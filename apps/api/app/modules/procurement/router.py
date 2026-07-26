from fastapi import APIRouter, Depends, Query

from app.core.models import ProcurementNeed
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.procurement.schemas import (
    GenerateProcurementNeedRequest,
    OfferCompareRequest,
    OfferCompareResponse,
    SupplierSearchResponse,
)
from app.modules.procurement.service import (
    ProcurementService,
    procurement_service_dependency,
)

router = APIRouter(tags=["procurement"])


@router.post("/api/v1/procurement-needs/generate", response_model=ProcurementNeed)
async def generate_procurement_need(
    req: GenerateProcurementNeedRequest,
    user: UserContext = Depends(get_current_user),
    service: ProcurementService = Depends(procurement_service_dependency),
) -> ProcurementNeed:
    """Predict stockout and generate a procurement need for the merchant."""
    return service.generate_need(user, req)


@router.get("/api/v1/procurement-needs", response_model=list[ProcurementNeed])
async def list_procurement_needs(
    user: UserContext = Depends(get_current_user),
    service: ProcurementService = Depends(procurement_service_dependency),
) -> list[ProcurementNeed]:
    """List open procurement needs owned by the merchant organization."""
    return service.list_needs(user)


@router.get("/api/v1/suppliers/search", response_model=SupplierSearchResponse)
async def search_suppliers(
    product_id: str | None = Query(None),
    user: UserContext = Depends(get_current_user),
    service: ProcurementService = Depends(procurement_service_dependency),
) -> SupplierSearchResponse:
    """Search supplier catalog items matching product criteria."""
    items = service.search_suppliers(user, product_id)
    return SupplierSearchResponse(items=items)


@router.post("/api/v1/offers/compare", response_model=OfferCompareResponse)
async def compare_offers(
    req: OfferCompareRequest,
    user: UserContext = Depends(get_current_user),
    service: ProcurementService = Depends(procurement_service_dependency),
) -> OfferCompareResponse:
    """Compare supplier offers and group order opportunities for a procurement need."""
    return service.compare_offers(user, req)
