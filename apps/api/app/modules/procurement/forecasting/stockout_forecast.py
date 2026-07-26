"""
Deterministic stockout forecast (issue #23).

Implements the exact formula from docs/taha-ai-procurement-handoff.md,
section 13:

    average_daily_sales = units_sold / observed_days
    days_remaining = ceil(stock_on_hand / average_daily_sales)
    reorder_quantity = max(0, target_stock - stock_on_hand - incoming_stock)

Demo numbers this reproduces:
    stock_on_hand=14, units_sold=24.5, observed_days=7 -> avg=3.5/day
    days_remaining = ceil(14 / 3.5) = 4
    target_stock=34, incoming_stock=0 -> reorder = 20

MIN_HISTORY_DAYS is a judgment call (the guide says "too short" without a
number) — 3 days felt like a reasonable floor for a hackathon demo. Flag
to the team if a different threshold is wanted.
"""

from __future__ import annotations

import math

from app.modules.procurement.schemas.stockout_schema import (
    StockoutForecast,
    StockoutStatus,
)

MIN_HISTORY_DAYS = 3


def compute_stockout_forecast(
    *,
    product_id: str,
    stock_on_hand: int,
    units_sold: float,
    observed_days: int,
    target_stock: int,
    incoming_stock: int = 0,
) -> StockoutForecast:
    """
    units_sold: total confirmed units sold over the observed window.
    observed_days: length of that window, in days.
    target_stock: the approved stock target for this product (business
        policy input, not calculated here).
    incoming_stock: units already on order / in transit.
    """
    if stock_on_hand <= 0:
        clamped_stock = max(stock_on_hand, 0)
        return StockoutForecast(
            product_id=product_id,
            status=StockoutStatus.OUT_OF_STOCK,
            stock_on_hand=clamped_stock,
            reorder_quantity=max(0, target_stock - clamped_stock - incoming_stock),
            message="Already out of stock — reorder immediately.",
        )

    if observed_days < MIN_HISTORY_DAYS:
        return StockoutForecast(
            product_id=product_id,
            status=StockoutStatus.INSUFFICIENT_HISTORY,
            stock_on_hand=stock_on_hand,
            message=(
                f"Only {observed_days} day(s) of sales history — "
                f"need at least {MIN_HISTORY_DAYS} for a reliable forecast."
            ),
        )

    average_daily_sales = units_sold / observed_days
    reorder_quantity = max(0, target_stock - stock_on_hand - incoming_stock)

    if average_daily_sales <= 0:
        # Per the guide: if average daily sales are zero, do not predict a
        # stockout — but the reorder target calc is independent of sales
        # velocity, so it still applies.
        return StockoutForecast(
            product_id=product_id,
            status=StockoutStatus.NOT_SELLING,
            stock_on_hand=stock_on_hand,
            average_daily_sales=0.0,
            reorder_quantity=reorder_quantity,
            message="No recent sales — no stockout predicted.",
        )

    days_remaining = math.ceil(stock_on_hand / average_daily_sales)

    return StockoutForecast(
        product_id=product_id,
        status=StockoutStatus.NORMAL,
        stock_on_hand=stock_on_hand,
        average_daily_sales=round(average_daily_sales, 2),
        days_remaining=days_remaining,
        reorder_quantity=reorder_quantity,
        message=f"~{days_remaining} day(s) of stock remaining at current pace.",
    )