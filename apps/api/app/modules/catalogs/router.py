import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends

from app.core.models import SupplierCatalogItem
from app.core.store import db_store
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.catalogs.schemas import CreateCatalogItemRequest, SupplierCatalogResponse

router = APIRouter(prefix="/api/v1/supplier/catalogs", tags=["supplier-catalogs"])


@router.get("", response_model=SupplierCatalogResponse)
async def list_supplier_catalogs(
    user: UserContext = Depends(get_current_user),
) -> SupplierCatalogResponse:
    """List catalog items published by the authenticated supplier."""
    items = db_store.catalog_items.get(user.organization_id, [])
    return SupplierCatalogResponse(items=items)


@router.post("", response_model=SupplierCatalogItem)
async def create_catalog_item(
    req: CreateCatalogItemRequest,
    user: UserContext = Depends(get_current_user),
) -> SupplierCatalogItem:
    """Add a new product catalog item for the supplier organization."""
    org_id = user.organization_id
    cat_id = f"cat-{uuid.uuid4().hex[:8]}"
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

    if org_id not in db_store.catalog_items:
        db_store.catalog_items[org_id] = []
    db_store.catalog_items[org_id].append(item)
    return item
