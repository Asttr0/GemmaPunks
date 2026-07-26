from pydantic import BaseModel, Field

from app.core.models import Offer, SupplierCatalogItem


class GenerateProcurementNeedRequest(BaseModel):
    product_id: str = "cooking-oil-1l"
    unit: str = "BOTTLE"
    target_stock: float | None = Field(default=None, gt=0)


class SupplierSearchResponse(BaseModel):
    items: list[SupplierCatalogItem]


class OfferCompareRequest(BaseModel):
    procurement_need_id: str
    quantity: float | None = Field(default=None, gt=0)


class OfferCompareResponse(BaseModel):
    available_now: list[Offer] = Field(default_factory=list)
    group_opportunity: Offer | None = None
    rejected: list[Offer] = Field(default_factory=list)
