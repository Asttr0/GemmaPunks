"""
Tests for compare_supplier_offers (issue #24).

Offer data here is PLACEHOLDER, not yet confirmed with Rabii/Asttr0 (the
guide references "three approved synthetic offers" without printing the
values). Chosen to be consistent with the frozen #25 group-order numbers:
2200 -> 1850 centimes/unit, MOQ 50, group-order delivery saving of 3000
centimes -- so #24 and #25 tell one coherent demo story. Swap in the real
values once frozen; the test names/assertions should stay the same.

Run with: pytest apps/api/app/tests/procurement/test_offer_comparison.py
"""

from app.modules.procurement.offer_comparison.offer_comparison import compare_supplier_offers
from app.modules.procurement.schemas.offer_comparison_schema import (
    PurchaseRequest,
    RejectionReason,
    SupplierOffer,
)

RETAIL_OFFER = SupplierOffer(
    offer_id="offer_retail",
    supplier_id="quick_supply",
    product_id="cooking_oil_1l",
    unit="bottle",
    unit_price_centimes=2200,
    minimum_order_quantity=1,
    available_quantity=100,
    delivery_cost_centimes=500,
    served_areas=["berrechid"],
    delivery_days=2,
)

WHOLESALE_OFFER = SupplierOffer(
    offer_id="offer_wholesale",
    supplier_id="wholesale_co",
    product_id="cooking_oil_1l",
    unit="bottle",
    unit_price_centimes=1850,
    minimum_order_quantity=50,
    available_quantity=200,
    delivery_cost_centimes=3000,
    served_areas=["berrechid"],
    delivery_days=3,
)

OUT_OF_AREA_OFFER = SupplierOffer(
    offer_id="offer_far",
    supplier_id="casablanca_bulk",
    product_id="cooking_oil_1l",
    unit="bottle",
    unit_price_centimes=2000,
    minimum_order_quantity=1,
    available_quantity=100,
    delivery_cost_centimes=400,
    served_areas=["casablanca"],
    delivery_days=1,
)

BASE_REQUEST = PurchaseRequest(
    product_id="cooking_oil_1l",
    unit="bottle",
    requested_quantity=20,
    merchant_area="berrechid",
    days_until_needed=5,
    available_cash_centimes=100_000,
    selling_price_centimes=3000,
)


def test_all_three_offers_have_a_clear_result():
    result = compare_supplier_offers(
        BASE_REQUEST, [RETAIL_OFFER, WHOLESALE_OFFER, OUT_OF_AREA_OFFER]
    )

    total_seen = len(result.available_now) + len(result.group_opportunity) + len(result.rejected)
    assert total_seen == 3


def test_moq_50_offer_is_unavailable_for_20_units_alone():
    result = compare_supplier_offers(BASE_REQUEST, [WHOLESALE_OFFER])

    assert len(result.available_now) == 0
    assert len(result.group_opportunity) == 1
    assert result.group_opportunity[0].offer_id == "offer_wholesale"
    assert result.group_opportunity[0].usable_alone is False


def test_same_offer_becomes_available_for_55_combined_units():
    combined_request = BASE_REQUEST.model_copy(update={"requested_quantity": 55})

    result = compare_supplier_offers(combined_request, [WHOLESALE_OFFER])

    assert len(result.available_now) == 1
    assert result.available_now[0].offer_id == "offer_wholesale"
    assert result.available_now[0].usable_alone is True


def test_out_of_area_offer_is_rejected_not_deprioritized():
    result = compare_supplier_offers(BASE_REQUEST, [OUT_OF_AREA_OFFER])

    assert len(result.rejected) == 1
    assert result.rejected[0].reason == RejectionReason.AREA_NOT_SERVED


def test_unaffordable_offer_cannot_rank_as_the_safe_choice():
    # Cash only covers the cheaper offer's landed cost, not the pricier one.
    tight_cash_request = BASE_REQUEST.model_copy(
        update={"available_cash_centimes": RETAIL_OFFER.unit_price_centimes * 20 + 500}
    )
    unaffordable_but_eligible = RETAIL_OFFER.model_copy(
        update={
            "offer_id": "offer_unaffordable",
            "supplier_id": "aaa_supplier",  # sorts first alphabetically, to prove it's NOT winning on that alone
            "delivery_cost_centimes": 999_999,  # forces landed cost over budget
        }
    )

    result = compare_supplier_offers(
        tight_cash_request, [RETAIL_OFFER, unaffordable_but_eligible]
    )

    assert len(result.available_now) == 2
    assert result.available_now[0].offer_id == "offer_retail"
    assert result.available_now[0].affordable is True
    assert result.available_now[1].offer_id == "offer_unaffordable"
    assert result.available_now[1].affordable is False


def test_ties_use_the_documented_stable_supplier_id_rule():
    twin_a = RETAIL_OFFER.model_copy(update={"offer_id": "offer_twin_z", "supplier_id": "zzz_supplier"})
    twin_b = RETAIL_OFFER.model_copy(update={"offer_id": "offer_twin_a", "supplier_id": "aaa_supplier"})

    result = compare_supplier_offers(BASE_REQUEST, [twin_a, twin_b])

    assert [e.supplier_id for e in result.available_now] == ["aaa_supplier", "zzz_supplier"]