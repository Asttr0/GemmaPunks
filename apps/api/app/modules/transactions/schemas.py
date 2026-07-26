from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field


class TransactionLine(BaseModel):
    line_id: str
    product_id: str
    product_name: str
    quantity: int
    unit_price_centimes: int
    line_total_centimes: int


class Transaction(BaseModel):
    id: str
    organization_id: str
    kind: Literal["purchase", "sale", "expense"]
    currency: str = "MAD"
    total_centimes: int
    lines: list[TransactionLine] = Field(default_factory=list)
    ingestion_id: str | None = None
    draft_id: str | None = None
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class TransactionListResponse(BaseModel):
    items: list[Transaction]
    next_cursor: str | None = None
