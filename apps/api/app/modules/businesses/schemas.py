from pydantic import BaseModel, Field


class DashboardKPIs(BaseModel):
    sales_centimes: int = 1250000
    expenses_centimes: int = 830000
    estimated_profit_centimes: int = 420000
    available_cash_centimes: int = 610000


class InventorySummary(BaseModel):
    product_count: int = 18
    low_stock_count: int = 1


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
