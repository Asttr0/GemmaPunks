from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from app.core.store import db_store
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.inventory.schemas import InventoryItemResponse, InventoryResponse

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


@router.get("", response_model=InventoryResponse)
async def list_inventory(
    user: UserContext = Depends(get_current_user),
) -> InventoryResponse:
    """List current stock levels and predicted stockouts for the authenticated merchant organization."""
    products = db_store.get_products(user.organization_id)
    items = []
    now = datetime.now(timezone.utc)

    for p in products:
        low = p.quantity_on_hand <= p.reorder_threshold
        stockout_date = now + timedelta(days=4) if low else None

        items.append(
            InventoryItemResponse(
                product_id=p.product_id,
                name=p.name,
                quantity_on_hand=p.quantity_on_hand,
                low_stock=low,
                predicted_stockout_at=stockout_date,
            )
        )

    return InventoryResponse(items=items)
