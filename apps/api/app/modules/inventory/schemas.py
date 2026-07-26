from datetime import UTC, datetime
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class InventoryItemResponse(BaseModel):
    product_id: str
    name: str
    unit: str
    quantity_on_hand: float
    low_stock_threshold: float
    status: Literal["HEALTHY", "LOW_STOCK", "OUT_OF_STOCK"]
    low_stock: bool = False
    predicted_stockout_at: datetime | None = None


class InventoryResponse(BaseModel):
    items: list[InventoryItemResponse]


class ProductUnitOptionResponse(BaseModel):
    unit: str
    label: str
    conversion_to_base: int = Field(ge=1)


class ProductOptionResponse(BaseModel):
    product_id: str
    name: str
    base_unit: str
    units: list[ProductUnitOptionResponse]


class ProductOptionListResponse(BaseModel):
    items: list[ProductOptionResponse]
