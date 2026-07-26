import pytest

from app.modules.group_orders.savings import calculate_collective_savings
from app.modules.procurement.forecasting import forecast_stockout


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
