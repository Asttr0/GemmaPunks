from pydantic import BaseModel, Field

from app.core.models import SupplierCatalogItem


class CreateCatalogItemRequest(BaseModel):
    product_id: str
    supplier_sku: str = Field(min_length=1, max_length=80)
    unit: str = "BOTTLE"
    unit_price_centimes: int = Field(gt=0)
    minimum_quantity: float = Field(default=1.0, gt=0)
    available_quantity: float = Field(default=1000.0, ge=0)
    delivery_fee_centimes: int = Field(default=3000, ge=0)
    delivery_days: int = Field(default=1, ge=0, le=30)
    service_areas: list[str] = Field(default_factory=lambda: ["Berrechid Center"])


class SupplierCatalogResponse(BaseModel):
    items: list[SupplierCatalogItem]
