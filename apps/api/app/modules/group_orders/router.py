from fastapi import APIRouter, Depends
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.group_orders.schemas import (
    GroupOrderListResponse,
    GroupOrderResponse,
    ProposeGroupOrderRequest,
)
from app.modules.group_orders.service import GroupOrderService

router = APIRouter(prefix="/api/v1/group-orders", tags=["group-orders"])


@router.get("", response_model=GroupOrderListResponse)
async def list_group_orders(
    user: UserContext = Depends(get_current_user),
) -> GroupOrderListResponse:
    """List collective group orders participating by the authenticated merchant."""
    items = GroupOrderService.list_group_orders(user)
    return GroupOrderListResponse(items=items)


@router.post("/propose", response_model=GroupOrderResponse)
async def propose_group_order(
    req: ProposeGroupOrderRequest,
    user: UserContext = Depends(get_current_user),
) -> GroupOrderResponse:
    """Propose combining compatible merchant demand into a collective order."""
    return GroupOrderService.propose_group_order(user, req)


@router.post("/{id}/join", response_model=GroupOrderResponse)
async def join_group_order(
    id: str,
    user: UserContext = Depends(get_current_user),
) -> GroupOrderResponse:
    """Join an open collective purchasing proposal."""
    return GroupOrderService.join_group_order(user, group_order_id=id)


@router.post("/{id}/approve", response_model=GroupOrderResponse)
async def approve_group_order(
    id: str,
    user: UserContext = Depends(get_current_user),
) -> GroupOrderResponse:
    """Approve final participation in a collective group order."""
    return GroupOrderService.approve_group_order(user, group_order_id=id)
