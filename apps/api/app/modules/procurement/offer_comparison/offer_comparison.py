"""
Deterministic supplier offer comparison (issue #24).

Implements docs/taha-ai-procurement-handoff.md section 14:

1. Filter with hard rules (product/unit match, area served, enough
   available quantity, delivery before the need date). Fail any of these
   -> rejected, with a reason.
2. An offer that passes those but whose MOQ exceeds the requested quantity
   is not rejected outright -- it's a group_opportunity, since combined
   demand (issue #25) could unlock it. This is the specific case the guide
   calls out: don't tell a 20-unit order it can use a 50-MOQ offer.
3. Everything else that passes all hard rules including MOQ is
   available_now.
4. Rank within each bucket: affordable before unaffordable, then lower
   landed cost, then earlier delivery, then stable supplier_id.
"""

from __future__ import annotations

from app.modules.procurement.schemas.offer_comparison_schema import (
    OfferComparisonResult,
    OfferEvaluation,
    PurchaseRequest,
    RejectedOffer,
    RejectionReason,
    SupplierOffer,
)


def _hard_rule_failure(offer: SupplierOffer, request: PurchaseRequest) -> RejectedOffer | None:
    if offer.product_id != request.product_id or offer.unit != request.unit:
        return RejectedOffer(
            offer_id=offer.offer_id,
            supplier_id=offer.supplier_id,
            reason=RejectionReason.WRONG_PRODUCT_OR_UNIT,
            detail=f"Offer is for {offer.product_id} ({offer.unit}), not "
            f"{request.product_id} ({request.unit}).",
        )

    if request.merchant_area not in offer.served_areas:
        return RejectedOffer(
            offer_id=offer.offer_id,
            supplier_id=offer.supplier_id,
            reason=RejectionReason.AREA_NOT_SERVED,
            detail=f"Supplier does not deliver to '{request.merchant_area}'.",
        )

    if offer.available_quantity < request.requested_quantity:
        return RejectedOffer(
            offer_id=offer.offer_id,
            supplier_id=offer.supplier_id,
            reason=RejectionReason.INSUFFICIENT_AVAILABLE_QUANTITY,
            detail=f"Only {offer.available_quantity} available, "
            f"{request.requested_quantity} requested.",
        )

    if offer.delivery_days > request.days_until_needed:
        return RejectedOffer(
            offer_id=offer.offer_id,
            supplier_id=offer.supplier_id,
            reason=RejectionReason.DELIVERY_TOO_LATE,
            detail=f"Delivery takes {offer.delivery_days} day(s), "
            f"needed within {request.days_until_needed}.",
        )

    return None


def _evaluate(offer: SupplierOffer, request: PurchaseRequest, quantity_used: int, usable_alone: bool) -> OfferEvaluation:
    product_cost_centimes = quantity_used * offer.unit_price_centimes
    landed_cost_centimes = product_cost_centimes + offer.delivery_cost_centimes
    landed_unit_cost_centimes = landed_cost_centimes / quantity_used
    affordable = landed_cost_centimes <= request.available_cash_centimes
    expected_unit_margin_centimes = request.selling_price_centimes - landed_unit_cost_centimes

    return OfferEvaluation(
        offer_id=offer.offer_id,
        supplier_id=offer.supplier_id,
        unit_price_centimes=offer.unit_price_centimes,
        minimum_order_quantity=offer.minimum_order_quantity,
        delivery_cost_centimes=offer.delivery_cost_centimes,
        delivery_days=offer.delivery_days,
        quantity_used_for_pricing=quantity_used,
        product_cost_centimes=product_cost_centimes,
        landed_cost_centimes=landed_cost_centimes,
        landed_unit_cost_centimes=round(landed_unit_cost_centimes, 2),
        affordable=affordable,
        expected_unit_margin_centimes=round(expected_unit_margin_centimes, 2),
        usable_alone=usable_alone,
    )


def _rank(evaluations: list[OfferEvaluation]) -> list[OfferEvaluation]:
    return sorted(
        evaluations,
        key=lambda e: (
            not e.affordable,  # affordable (False) sorts before unaffordable (True)
            e.landed_cost_centimes,
            e.delivery_days,
            e.supplier_id,
        ),
    )


def compare_supplier_offers(
    request: PurchaseRequest, offers: list[SupplierOffer]
) -> OfferComparisonResult:
    available_now: list[OfferEvaluation] = []
    group_opportunity: list[OfferEvaluation] = []
    rejected: list[RejectedOffer] = []

    for offer in offers:
        failure = _hard_rule_failure(offer, request)
        if failure is not None:
            rejected.append(failure)
            continue

        if request.requested_quantity >= offer.minimum_order_quantity:
            available_now.append(
                _evaluate(offer, request, quantity_used=request.requested_quantity, usable_alone=True)
            )
        else:
            # Preview pricing at the offer's MOQ -- this is what a group
            # order would need to reach to unlock this offer.
            group_opportunity.append(
                _evaluate(offer, request, quantity_used=offer.minimum_order_quantity, usable_alone=False)
            )

    return OfferComparisonResult(
        available_now=_rank(available_now),
        group_opportunity=_rank(group_opportunity),
        rejected=rejected,
    )