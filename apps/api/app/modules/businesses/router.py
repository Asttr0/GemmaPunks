import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.models import Offer, SupplierOpportunity
from app.core.store import db_store
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.businesses.schemas import (
    DashboardResponse,
    SupplierDashboardResponse,
    SupplierOpportunityListResponse,
)

router = APIRouter(tags=["business"])


class CreateSupplierOfferRequest(BaseModel):
    opportunity_id: str
    catalog_item_id: str
    unit_price_centimes: int
    minimum_quantity: float = 50.0


@router.get("/api/v1/merchant/dashboard", response_model=DashboardResponse)
async def get_merchant_dashboard(
    user: UserContext = Depends(get_current_user),
) -> DashboardResponse:
    """Return KPIs, stockout alerts, and recommended next actions for the authenticated merchant."""
    return db_store.get_dashboard(user.organization_id)


@router.get("/api/v1/supplier/dashboard", response_model=SupplierDashboardResponse)
async def get_supplier_dashboard(
    user: UserContext = Depends(get_current_user),
) -> SupplierDashboardResponse:
    """Return KPIs and active demand opportunities for the authenticated supplier."""
    return db_store.get_supplier_dashboard(user.organization_id)


@router.get("/api/v1/supplier/opportunities", response_model=SupplierOpportunityListResponse)
async def list_supplier_opportunities(
    user: UserContext = Depends(get_current_user),
) -> SupplierOpportunityListResponse:
    """Return safe aggregated demand opportunities for suppliers without exposing private merchant data."""
    opps = list(db_store.supplier_opportunities.values())
    return SupplierOpportunityListResponse(items=opps)


@router.post("/api/v1/supplier/offers", response_model=Offer)
async def create_supplier_offer(
    req: CreateSupplierOfferRequest,
    user: UserContext = Depends(get_current_user),
) -> Offer:
    """Submit a competitive supplier offer responding to an aggregated demand opportunity."""
    opp = db_store.supplier_opportunities.get(req.opportunity_id)
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier opportunity not found",
        )

    now = datetime.now(timezone.utc)
    offer_id = f"off-{uuid.uuid4().hex[:8]}"

    offer = Offer(
        offer_id=offer_id,
        organization_id=user.organization_id,
        procurement_need_id=opp.opportunity_id,
        supplier_organization_id=user.organization_id,
        catalog_item_id=req.catalog_item_id,
        product_id=opp.product_id,
        unit=opp.unit,
        requested_quantity=opp.total_quantity,
        unit_price_centimes=req.unit_price_centimes,
        minimum_quantity=req.minimum_quantity,
        delivery_fee_centimes=0,
        landed_cost_centimes=int(opp.total_quantity * req.unit_price_centimes),
        eligible_alone=True,
        affordable=True,
        status="AVAILABLE_NOW",
        created_at=now,
        updated_at=now,
    )

    if user.organization_id not in db_store.offers:
        db_store.offers[user.organization_id] = []
    db_store.offers[user.organization_id].append(offer)

    opp.status = "QUOTED"
    return offer
