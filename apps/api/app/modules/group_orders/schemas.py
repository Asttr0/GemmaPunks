from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.core.models import GroupOrder, GroupOrderMember


class ProposeGroupOrderRequest(BaseModel):
    procurement_need_id: str
    product_id: str = "cooking-oil-1l"
    quantity: float = 20.0
    supplier_organization_id: str = "supplier-atlas"
    supplier_catalog_item_id: str = "cat-oil-bulk"


class GroupOrderMemberDetail(BaseModel):
    member: GroupOrderMember
    is_current_organization: bool = True


class GroupOrderResponse(BaseModel):
    group_order: GroupOrder
    member: GroupOrderMember
    total_savings_centimes: int
    collective_unit_price_centimes: int
    original_unit_price_centimes: int


class GroupOrderListResponse(BaseModel):
    items: list[GroupOrderResponse]
