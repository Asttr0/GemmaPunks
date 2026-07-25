from fastapi import APIRouter, Depends
from app.core.store import db_store
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.businesses.schemas import DashboardResponse

router = APIRouter(tags=["merchant"])


@router.get("/api/v1/merchant/dashboard", response_model=DashboardResponse)
async def get_merchant_dashboard(
    user: UserContext = Depends(get_current_user),
) -> DashboardResponse:
    """Return KPIs, stockout alerts, and recommended next actions for the authenticated merchant."""
    return db_store.get_dashboard(user.organization_id)
