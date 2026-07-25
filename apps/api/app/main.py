from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.modules.businesses.router import router as merchant_router
from app.modules.ingestion.router import router as ingestion_router
from app.modules.inventory.router import router as inventory_router
from app.modules.transactions.router import router as transactions_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="MIZAN Souq - Modular FastAPI Backend for Darija-first business management and intelligent procurement.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register module API routers
app.include_router(ingestion_router)
app.include_router(transactions_router)
app.include_router(inventory_router)
app.include_router(merchant_router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
