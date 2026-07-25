from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field


class Product(BaseModel):
    product_id: str
    organization_id: str
    name: str
    unit: str = "unit"
    quantity_on_hand: int = 0
    reorder_threshold: int = 15
    selling_price_centimes: int = 0


class InventoryMovement(BaseModel):
    id: str
    organization_id: str
    product_id: str
    quantity: int
    direction: Literal["in", "out"]
    reference_transaction_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InventoryItemResponse(BaseModel):
    product_id: str
    name: str
    quantity_on_hand: int
    low_stock: bool = False
    predicted_stockout_at: datetime | None = None


class InventoryResponse(BaseModel):
    items: list[InventoryItemResponse]
