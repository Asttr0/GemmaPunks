from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class CompanyContext(BaseModel):
    name: str
    legal_name: str
    sector: str
    city: str
    warehouse_count: int
    active_supplier_count: int
    reporting_period: str


class ControlTowerKPIs(BaseModel):
    monitored_spend_centimes: int
    preventable_leakage_centimes: int
    cash_at_risk_centimes: int
    inventory_value_centimes: int
    open_findings: int
    critical_findings: int


class CashForecastPoint(BaseModel):
    label: str
    date: date
    inflows_centimes: int
    outflows_centimes: int
    projected_balance_centimes: int


class PriorityAction(BaseModel):
    action_id: str
    title: str
    description: str
    impact_centimes: int
    urgency: Literal["NOW", "THIS_WEEK", "MONITOR"]
    target_path: str


class AuditEvidence(BaseModel):
    document_type: Literal[
        "PURCHASE_ORDER",
        "DELIVERY_NOTE",
        "SUPPLIER_INVOICE",
        "BANK_PAYMENT",
        "SUPPLIER_CONTRACT",
    ]
    reference: str
    label: str
    amount_centimes: int | None = None
    quantity: int | None = None
    unit_price_centimes: int | None = None
    status: Literal["MATCHED", "MISMATCH", "SUPPORTING"] = "SUPPORTING"


class CalculationStep(BaseModel):
    label: str
    expression: str
    result_centimes: int


class AuditFinding(BaseModel):
    finding_id: str
    finding_type: Literal[
        "THREE_WAY_MISMATCH",
        "DUPLICATE_PAYMENT",
        "PRICE_DRIFT",
        "MISSING_CREDIT_NOTE",
        "SUPPLIER_CONCENTRATION",
    ]
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    status: Literal["OPEN", "READY_FOR_APPROVAL", "APPROVED", "RESOLVED"]
    title: str
    summary: str
    supplier_id: str
    supplier_name: str
    financial_impact_centimes: int
    confidence: float = Field(ge=0, le=1)
    expected_amount_centimes: int | None = None
    observed_amount_centimes: int | None = None
    recommended_action: str
    owner: str
    due_date: date
    evidence: list[AuditEvidence] = Field(default_factory=list)
    calculation: list[CalculationStep] = Field(default_factory=list)


class ControlTowerDashboard(BaseModel):
    generated_at: datetime
    company: CompanyContext
    kpis: ControlTowerKPIs
    cash_forecast: list[CashForecastPoint]
    priority_actions: list[PriorityAction]
    findings: list[AuditFinding]


class SupplierScorecard(BaseModel):
    supplier_id: str
    name: str
    city: str
    category: str
    annual_spend_centimes: int
    spend_share_percent: float
    delivery_reliability_percent: float
    contract_compliance_percent: float
    disputed_invoice_rate_percent: float
    average_payment_terms_days: int
    risk: Literal["LOW", "MEDIUM", "HIGH"]
    trend: Literal["IMPROVING", "STABLE", "DECLINING"]
    recommendation: str


class SupplierPortfolioResponse(BaseModel):
    total_spend_centimes: int
    concentration_risk_percent: float
    savings_opportunity_centimes: int
    scorecards: list[SupplierScorecard]


class FinancialRecord(BaseModel):
    record_id: str
    record_type: Literal[
        "PURCHASE_ORDER",
        "DELIVERY_NOTE",
        "SUPPLIER_INVOICE",
        "BANK_PAYMENT",
        "CUSTOMER_RECEIVABLE",
    ]
    reference: str
    counterparty: str
    issued_on: date
    due_on: date | None = None
    amount_centimes: int
    status: Literal["MATCHED", "EXCEPTION", "PENDING", "PAID", "EXPECTED"]
    linked_records: list[str] = Field(default_factory=list)


class FinancialRecordListResponse(BaseModel):
    items: list[FinancialRecord]


class AuditRunToolCall(BaseModel):
    sequence: int
    name: str
    label: str
    status: Literal["SUCCEEDED"] = "SUCCEEDED"
    duration_ms: int
    output: str
    deterministic: bool


class AuditRunResponse(BaseModel):
    run_id: str
    status: Literal["SUCCEEDED"]
    provider: str
    model: str
    documents_analyzed: int
    findings_created: int
    total_impact_centimes: int
    tool_calls: list[AuditRunToolCall]


class FindingDecisionRequest(BaseModel):
    action: Literal["PREPARE_DISPUTE", "APPROVE_CORRECTED_AMOUNT", "DISMISS"]
    note: str | None = Field(default=None, max_length=500)


class FindingDecisionResponse(BaseModel):
    finding_id: str
    status: Literal["APPROVED", "RESOLVED"]
    action: str
    approved_amount_centimes: int | None = None
    dispute_reference: str | None = None
    message: str
    approved_by: str
    approved_at: datetime
