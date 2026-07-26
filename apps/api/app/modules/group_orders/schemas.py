from datetime import datetime

from pydantic import BaseModel, Field

from app.core.models import GroupOrderMember


class ProposeGroupOrderRequest(BaseModel):
    procurement_need_id: str
    supplier_organization_id: str
    supplier_catalog_item_id: str
    product_id: str | None = None
    quantity: float | None = Field(default=None, gt=0)


class GroupOrderSummary(BaseModel):
    group_order_id: str
    product_id: str
    unit: str
    supplier_organization_id: str
    supplier_catalog_item_id: str
    status: str
    total_quantity: float
    minimum_quantity: float
    unit_price_centimes: int
    delivery_total_centimes: int
    participant_count: int
    coarse_area: str
    join_deadline: datetime
    needed_by: datetime


class GroupOrderResponse(BaseModel):
    group_order: GroupOrderSummary
    member: GroupOrderMember
    total_savings_centimes: int
    collective_unit_price_centimes: int
    original_unit_price_centimes: int


class GroupOrderListResponse(BaseModel):
    items: list[GroupOrderResponse]
