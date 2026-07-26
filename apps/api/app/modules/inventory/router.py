from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.business_repository import (
    BusinessRepository,
    business_repository_dependency,
    require_organization_type,
)
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.inventory.schemas import InventoryItemResponse, InventoryResponse

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


@router.get("", response_model=InventoryResponse)
async def list_inventory(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
) -> InventoryResponse:
    """List authoritative stock snapshots updated by confirmed inventory movements."""
    try:
        require_organization_type(repository, user.organization_id, "MERCHANT")
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    products = repository.list_inventory_items(user.organization_id)
    items = []

    for p in products:
        low = p.status in {"LOW_STOCK", "OUT_OF_STOCK"}
        stockout_date = None
        if p.average_daily_sales and p.average_daily_sales > 0:
            stockout_date = p.updated_at + timedelta(
                days=p.quantity_on_hand / p.average_daily_sales
            )

        items.append(
            InventoryItemResponse(
                product_id=p.product_id,
                name=p.display_name,
                unit=p.unit,
                quantity_on_hand=p.quantity_on_hand,
                low_stock_threshold=p.low_stock_threshold,
                status=p.status,
                low_stock=low,
                predicted_stockout_at=stockout_date,
            )
        )

    return InventoryResponse(items=items)
