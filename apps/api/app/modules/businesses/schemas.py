from datetime import datetime

from pydantic import BaseModel, Field

from app.core.models import SupplierOpportunity


class DashboardKPIs(BaseModel):
    sales_centimes: int
    expenses_centimes: int
    estimated_profit_centimes: int
    available_cash_centimes: int


class InventorySummary(BaseModel):
    product_count: int
    low_stock_count: int


class DashboardAlert(BaseModel):
    code: str
    message: str


class DashboardNextAction(BaseModel):
    code: str
    label: str
    target_id: str | None = None


class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    inventory: InventorySummary
    alerts: list[DashboardAlert] = Field(default_factory=list)
    next_action: DashboardNextAction | None = None
    generated_at: datetime


# Supplier Portal Schemas


class SupplierDashboardKPIs(BaseModel):
    active_catalog_items: int = 5
    active_demand_opportunities: int = 2
    total_potential_volume: float = 55.0
    estimated_revenue_centimes: int = 101750


class SupplierDashboardResponse(BaseModel):
    kpis: SupplierDashboardKPIs
    opportunities: list[SupplierOpportunity] = Field(default_factory=list)


class SupplierOpportunityListResponse(BaseModel):
    items: list[SupplierOpportunity]
