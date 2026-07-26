import hashlib
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.business_repository import (
    BusinessRepository,
    business_repository_dependency,
    require_organization_type,
)
from app.core.models import SupplierCatalogItem
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.catalogs.schemas import CreateCatalogItemRequest, SupplierCatalogResponse

router = APIRouter(prefix="/api/v1/supplier/catalogs", tags=["supplier-catalogs"])


@router.get("", response_model=SupplierCatalogResponse)
async def list_supplier_catalogs(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
) -> SupplierCatalogResponse:
    """List catalog items published by the authenticated supplier."""
    try:
        require_organization_type(repository, user.organization_id, "SUPPLIER")
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    items = [
        item
        for item in repository.list_catalog_items()
        if item.organization_id == user.organization_id
    ]
    return SupplierCatalogResponse(items=items)


@router.post("", response_model=SupplierCatalogItem)
async def create_catalog_item(
    req: CreateCatalogItemRequest,
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
) -> SupplierCatalogItem:
    """Add a new product catalog item for the supplier organization."""
    try:
        require_organization_type(repository, user.organization_id, "SUPPLIER")
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    org_id = user.organization_id
    identity = f"{org_id}:{req.supplier_sku.strip().casefold()}"
    cat_id = f"catalog-{hashlib.sha256(identity.encode()).hexdigest()[:16]}"
    now = datetime.now(UTC)

    item = SupplierCatalogItem(
        catalog_item_id=cat_id,
        organization_id=org_id,
        product_id=req.product_id,
        supplier_sku=req.supplier_sku,
        unit=req.unit,
        unit_price_centimes=req.unit_price_centimes,
        minimum_quantity=req.minimum_quantity,
        available_quantity=req.available_quantity,
        delivery_fee_centimes=req.delivery_fee_centimes,
        delivery_days=req.delivery_days,
        service_areas=req.service_areas,
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )

    repository.save_catalog_item(item)
    return item
