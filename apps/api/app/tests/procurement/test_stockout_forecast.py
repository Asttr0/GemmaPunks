"""
Tests for compute_stockout_forecast (issue #23).

Covers the exact test list from docs/taha-ai-procurement-handoff.md
section 17 ("Forecast tests").

Run with: pytest apps/api/app/tests/procurement/test_stockout_forecast.py
"""

from app.modules.procurement.forecasting.stockout_forecast import compute_stockout_forecast
from app.modules.procurement.schemas.stockout_schema import StockoutStatus


def test_demo_oil_returns_four_days_and_20_units():
    result = compute_stockout_forecast(
        product_id="cooking_oil_1l",
        stock_on_hand=14,
        units_sold=24.5,
        observed_days=7,
        target_stock=34,
        incoming_stock=0,
    )

    assert result.status == StockoutStatus.NORMAL
    assert result.average_daily_sales == 3.5
    assert result.days_remaining == 4
    assert result.reorder_quantity == 20


def test_zero_demand_returns_no_false_stockout():
    result = compute_stockout_forecast(
        product_id="dead_stock_item",
        stock_on_hand=10,
        units_sold=0,
        observed_days=7,
        target_stock=20,
    )

    assert result.status == StockoutStatus.NOT_SELLING
    assert result.days_remaining is None


def test_negative_stock_returns_out_of_stock():
    result = compute_stockout_forecast(
        product_id="sugar_1kg",
        stock_on_hand=-3,
        units_sold=10,
        observed_days=7,
        target_stock=20,
    )

    assert result.status == StockoutStatus.OUT_OF_STOCK
    assert result.stock_on_hand == 0


def test_insufficient_history_is_reported():
    result = compute_stockout_forecast(
        product_id="tea_boxes",
        stock_on_hand=10,
        units_sold=3,
        observed_days=2,
        target_stock=20,
    )

    assert result.status == StockoutStatus.INSUFFICIENT_HISTORY
    assert result.average_daily_sales is None
    assert result.reorder_quantity is None


def test_incoming_stock_can_reduce_reorder_to_zero():
    result = compute_stockout_forecast(
        product_id="cooking_oil_1l",
        stock_on_hand=14,
        units_sold=24.5,
        observed_days=7,
        target_stock=34,
        incoming_stock=20,  # covers the rest of the target on its own
    )

    assert result.reorder_quantity == 0


def test_days_remaining_rounds_up_not_down():
    # 10 units at 3/day is 3.33 days left -- must round UP to 4 (ceil),
    # since 3 would imply stock lasts a full 3rd day when it doesn't.
    result = compute_stockout_forecast(
        product_id="flour_bags",
        stock_on_hand=10,
        units_sold=21,
        observed_days=7,
        target_stock=20,
    )

    assert result.days_remaining == 4