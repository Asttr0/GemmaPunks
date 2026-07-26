from dataclasses import dataclass
from math import ceil


@dataclass(frozen=True)
class StockoutForecast:
    status: str
    quantity_needed: float
    days_remaining: int | None
    explanation: str
    uncertainty_note: str | None


def forecast_stockout(
    *,
    stock_on_hand: float,
    average_daily_sales: float | None,
    sales_history_days: int,
    target_stock_quantity: float,
    minimum_history_days: int = 3,
) -> StockoutForecast:
    quantity_needed = max(0.0, target_stock_quantity - max(0.0, stock_on_hand))
    if stock_on_hand <= 0:
        return StockoutForecast(
            status="OUT_OF_STOCK",
            quantity_needed=quantity_needed,
            days_remaining=0,
            explanation=(
                f"Stock is {stock_on_hand:g}; reorder {quantity_needed:g} units "
                f"to reach the {target_stock_quantity:g}-unit target."
            ),
            uncertainty_note=None,
        )
    if average_daily_sales is None or average_daily_sales <= 0:
        return StockoutForecast(
            status="NO_DEMAND",
            quantity_needed=quantity_needed,
            days_remaining=None,
            explanation=(f"Stock is {stock_on_hand:g}, but no positive sales rate is available."),
            uncertainty_note="A stockout date cannot be estimated without confirmed sales.",
        )
    if sales_history_days < minimum_history_days:
        return StockoutForecast(
            status="INSUFFICIENT_HISTORY",
            quantity_needed=quantity_needed,
            days_remaining=None,
            explanation=(
                f"Only {sales_history_days} day(s) of sales history are available; "
                f"at least {minimum_history_days} are required."
            ),
            uncertainty_note="Collect more confirmed sales before predicting a stockout date.",
        )

    days_remaining = ceil(stock_on_hand / average_daily_sales)
    return StockoutForecast(
        status="FORECAST",
        quantity_needed=quantity_needed,
        days_remaining=days_remaining,
        explanation=(
            f"{stock_on_hand:g} units on hand divided by "
            f"{average_daily_sales:g} confirmed units sold per day gives about "
            f"{days_remaining} day(s) remaining. Reorder {quantity_needed:g} units "
            f"to reach the {target_stock_quantity:g}-unit target."
        ),
        uncertainty_note=(
            f"The estimate uses {sales_history_days} day(s) of confirmed sales history."
        ),
    )
