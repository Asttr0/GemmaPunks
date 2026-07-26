"""
Schema for the stockout forecast output (issue #23).

Pure deterministic output — no Gemma involved. Field names deliberately
match docs/taha-ai-procurement-handoff.md section 13 exactly
(stock_on_hand, target_stock, incoming_stock) so there's no ambiguity
translating between the doc and the code.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class StockoutStatus(str, Enum):
    NORMAL = "normal"
    OUT_OF_STOCK = "out_of_stock"
    INSUFFICIENT_HISTORY = "insufficient_history"
    NOT_SELLING = "not_selling"  # has history, but zero average daily sales


class StockoutForecast(BaseModel):
    product_id: str
    status: StockoutStatus
    stock_on_hand: int = Field(ge=0)
    average_daily_sales: float | None = None
    days_remaining: int | None = None
    reorder_quantity: int | None = None
    message: str