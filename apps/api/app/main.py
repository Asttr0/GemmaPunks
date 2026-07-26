from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.modules.ai.router import router as ai_audit_router
from app.modules.auth.router import router as auth_router
from app.modules.businesses.router import router as business_router
from app.modules.catalogs.router import router as catalogs_router
from app.modules.control_tower.router import router as control_tower_router
from app.modules.group_orders.router import router as group_orders_router
from app.modules.ingestion.router import router as ingestion_router
from app.modules.inventory.router import router as inventory_router
from app.modules.procurement.router import router as procurement_router
from app.modules.transactions.router import router as transactions_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "MIZAN Control - AI financial control, supplier intelligence, and working-capital "
        "decision support for Moroccan distribution companies."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register module API routers
app.include_router(auth_router)
app.include_router(ingestion_router)
app.include_router(transactions_router)
app.include_router(inventory_router)
app.include_router(business_router)
app.include_router(procurement_router)
app.include_router(group_orders_router)
app.include_router(catalogs_router)
app.include_router(ai_audit_router)
app.include_router(control_tower_router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
