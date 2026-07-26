import hashlib
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.business_repository import (
    BusinessRepository,
    business_repository_dependency,
    require_organization_type,
)
from app.core.models import Offer
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.businesses.schemas import (
    DashboardResponse,
    SupplierDashboardResponse,
    SupplierOpportunityListResponse,
)
from app.modules.businesses.service import (
    build_merchant_dashboard,
    build_supplier_dashboard,
)

router = APIRouter(tags=["business"])


class CreateSupplierOfferRequest(BaseModel):
    opportunity_id: str
    catalog_item_id: str
    unit_price_centimes: int = Field(gt=0)
    minimum_quantity: float = Field(default=50.0, gt=0)


@router.get("/api/v1/merchant/dashboard", response_model=DashboardResponse)
async def get_merchant_dashboard(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
) -> DashboardResponse:
    """Return KPIs, stockout alerts, and recommended next actions for the authenticated merchant."""
    try:
        require_organization_type(repository, user.organization_id, "MERCHANT")
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    try:
        return build_merchant_dashboard(repository, user.organization_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/api/v1/supplier/dashboard", response_model=SupplierDashboardResponse)
async def get_supplier_dashboard(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
) -> SupplierDashboardResponse:
    """Return KPIs and active demand opportunities for the authenticated supplier."""
    try:
        require_organization_type(repository, user.organization_id, "SUPPLIER")
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    return build_supplier_dashboard(repository, user.organization_id)


@router.get("/api/v1/supplier/opportunities", response_model=SupplierOpportunityListResponse)
async def list_supplier_opportunities(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
) -> SupplierOpportunityListResponse:
    """Return safe aggregated supplier demand without exposing private merchant data."""
    try:
        require_organization_type(repository, user.organization_id, "SUPPLIER")
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    opps = repository.list_supplier_opportunities(user.organization_id)
    return SupplierOpportunityListResponse(items=opps)


@router.post("/api/v1/supplier/offers", response_model=Offer)
async def create_supplier_offer(
    req: CreateSupplierOfferRequest,
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
) -> Offer:
    """Submit a competitive supplier offer responding to an aggregated demand opportunity."""
    try:
        require_organization_type(repository, user.organization_id, "SUPPLIER")
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    opp = repository.get_supplier_opportunity(
        user.organization_id,
        req.opportunity_id,
    )
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier opportunity not found",
        )

    now = datetime.now(UTC)
    catalog_item = repository.get_catalog_item(
        user.organization_id,
        req.catalog_item_id,
    )
    if catalog_item is None or catalog_item.product_id != opp.product_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Catalog item must belong to this supplier and match the opportunity",
        )
    offer_identity = f"{user.organization_id}:{opp.opportunity_id}:{req.catalog_item_id}"
    offer_id = f"supplier-offer-{hashlib.sha256(offer_identity.encode()).hexdigest()[:16]}"
    product_cost = int(
        (Decimal(str(opp.total_quantity)) * Decimal(req.unit_price_centimes)).quantize(
            Decimal("1"), rounding=ROUND_HALF_UP
        )
    )

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
        delivery_fee_centimes=catalog_item.delivery_fee_centimes,
        product_cost_centimes=product_cost,
        landed_cost_centimes=product_cost + catalog_item.delivery_fee_centimes,
        landed_unit_cost_centimes=req.unit_price_centimes,
        delivery_days=catalog_item.delivery_days,
        eligible_alone=True,
        affordable=True,
        status="AVAILABLE_NOW",
        explanation=(
            f"Supplier quoted {req.unit_price_centimes} centimes for "
            f"{opp.total_quantity:g} {opp.unit.lower()}."
        ),
        created_at=now,
        updated_at=now,
    )

    opp.status = "QUOTED"
    opp.updated_at = now
    repository.save_supplier_offer(offer, opp)
    return offer
