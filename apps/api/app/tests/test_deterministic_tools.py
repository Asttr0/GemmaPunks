from datetime import UTC, datetime, timedelta

import pytest

from app.core.models import Offer, ProcurementNeed, SupplierCatalogItem
from app.modules.group_orders.savings import calculate_collective_savings
from app.modules.procurement.forecasting import forecast_stockout
from app.modules.procurement.offer_comparison import (
    evaluate_catalog_offer,
    offer_rank_key,
)


def test_stockout_forecast_demo_and_edge_cases():
    forecast = forecast_stockout(
        stock_on_hand=14,
        average_daily_sales=3.5,
        sales_history_days=7,
        target_stock_quantity=34,
    )
    assert forecast.status == "FORECAST"
    assert forecast.days_remaining == 4
    assert forecast.quantity_needed == 20
    assert "14 units" in forecast.explanation
    assert "3.5" in forecast.explanation

    out = forecast_stockout(
        stock_on_hand=0,
        average_daily_sales=3,
        sales_history_days=7,
        target_stock_quantity=20,
    )
    assert out.status == "OUT_OF_STOCK"
    assert out.days_remaining == 0

    no_demand = forecast_stockout(
        stock_on_hand=10,
        average_daily_sales=0,
        sales_history_days=7,
        target_stock_quantity=20,
    )
    assert no_demand.status == "NO_DEMAND"
    assert no_demand.days_remaining is None

    insufficient = forecast_stockout(
        stock_on_hand=10,
        average_daily_sales=2,
        sales_history_days=1,
        target_stock_quantity=20,
    )
    assert insufficient.status == "INSUFFICIENT_HISTORY"
    assert insufficient.days_remaining is None

    incoming = forecast_stockout(
        stock_on_hand=14,
        average_daily_sales=3.5,
        sales_history_days=7,
        target_stock_quantity=34,
        incoming_stock=20,
    )
    assert incoming.quantity_needed == 0


def test_offer_evaluation_hard_rules_moq_affordability_and_stable_ranking():
    now = datetime.now(UTC)
    need = ProcurementNeed(
        need_id="need-oil",
        organization_id="merchant-berrechid",
        product_id="cooking-oil-1l",
        unit="BOTTLE",
        quantity_needed=20,
        coarse_area="Berrechid Center",
        needed_by=now + timedelta(days=5),
    )
    wholesale = SupplierCatalogItem(
        catalog_item_id="catalog-wholesale",
        organization_id="supplier-z",
        product_id="cooking-oil-1l",
        supplier_sku="OIL-1L",
        unit="BOTTLE",
        unit_price_centimes=1850,
        minimum_quantity=50,
        available_quantity=200,
        delivery_fee_centimes=3000,
        delivery_days=3,
        service_areas=["Berrechid Center"],
    )
    group_only = evaluate_catalog_offer(
        item=wholesale,
        need=need,
        quantity=20,
        available_cash_centimes=100_000,
        selling_price_centimes=3000,
        evaluated_at=now,
    )
    assert group_only.status == "GROUP_ONLY"
    assert group_only.eligible_alone is False
    assert "MINIMUM_QUANTITY_NOT_MET" in group_only.rejection_reasons

    combined = evaluate_catalog_offer(
        item=wholesale,
        need=need,
        quantity=55,
        available_cash_centimes=200_000,
        selling_price_centimes=3000,
        evaluated_at=now,
    )
    assert combined.status == "AVAILABLE_NOW"
    assert combined.eligible_alone is True

    wrong_area = evaluate_catalog_offer(
        item=wholesale.model_copy(update={"service_areas": ["Casablanca"]}),
        need=need,
        quantity=20,
        available_cash_centimes=100_000,
        selling_price_centimes=3000,
        evaluated_at=now,
    )
    assert wrong_area.status == "REJECTED"
    assert "AREA_NOT_SERVED" in wrong_area.rejection_reasons

    base_offer = Offer(
        offer_id="offer-z",
        organization_id="merchant-berrechid",
        procurement_need_id="need-oil",
        supplier_organization_id="supplier-z",
        catalog_item_id="catalog-z",
        product_id="cooking-oil-1l",
        requested_quantity=20,
        unit_price_centimes=2200,
        minimum_quantity=1,
        delivery_fee_centimes=0,
        landed_cost_centimes=44000,
        delivery_days=2,
    )
    tied_offer = base_offer.model_copy(
        update={"offer_id": "offer-a", "supplier_organization_id": "supplier-a"}
    )
    assert sorted([base_offer, tied_offer], key=offer_rank_key)[0].offer_id == "offer-a"


def test_collective_savings_demo_numbers_and_invalid_quantity():
    savings = calculate_collective_savings(
        member_quantity=20,
        total_quantity=55,
        original_unit_price_centimes=2200,
        collective_unit_price_centimes=1850,
        original_delivery_centimes=3000,
        collective_delivery_total_centimes=0,
    )
    assert savings.product_saving_centimes == 7000
    assert savings.delivery_saving_centimes == 3000
    assert savings.total_saving_centimes == 10000

    with pytest.raises(ValueError):
        calculate_collective_savings(
            member_quantity=60,
            total_quantity=55,
            original_unit_price_centimes=2200,
            collective_unit_price_centimes=1850,
            original_delivery_centimes=3000,
            collective_delivery_total_centimes=0,
        )
