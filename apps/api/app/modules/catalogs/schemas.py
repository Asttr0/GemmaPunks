from pydantic import BaseModel, Field
from app.core.models import SupplierCatalogItem


class CreateCatalogItemRequest(BaseModel):
    product_id: str
    supplier_sku: str
    unit: str = "BOTTLE"
    unit_price_centimes: int
    minimum_quantity: float = 1.0
    available_quantity: float = 1000.0
    delivery_fee_centimes: int = 3000
    delivery_days: int = 1
    service_areas: list[str] = Field(default_factory=lambda: ["Berrechid Center"])


class SupplierCatalogResponse(BaseModel):
    items: list[SupplierCatalogItem]
