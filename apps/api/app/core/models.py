from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field

from app.modules.ai.schemas.extraction import ExtractionDraft
from app.modules.transactions.schemas import Transaction

__all__ = [
    "Profile",
    "CanonicalProduct",
    "Organization",
    "Membership",
    "Document",
    "IngestionJob",
    "ExtractionDraft",
    "Transaction",
    "InventoryItem",
    "InventoryMovement",
    "SupplierCatalogItem",
    "ProcurementNeed",
    "Offer",
    "GroupOrderMember",
    "GroupOrder",
    "SupplierOpportunity",
    "Approval",
    "ToolCallRecord",
    "AgentRunRecord",
]

# --- Identity & Organizations ---


class Profile(BaseModel):
    user_id: str
    display_name: str
    email: str
    primary_organization_id: str
    locale: str = "en-MA"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CanonicalProduct(BaseModel):
    product_id: str
    canonical_name: str
    category: str = "GROCERY"
    base_unit: str = "UNIT"
    aliases: list[str] = Field(default_factory=list)
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Organization(BaseModel):
    organization_id: str
    name: str
    type: Literal["MERCHANT", "SUPPLIER"] = "MERCHANT"
    status: Literal["ACTIVE", "DISABLED"] = "ACTIVE"
    city: str = "Berrechid"
    coarse_area: str = "Berrechid Center"
    currency: str = "MAD"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Membership(BaseModel):
    organization_id: str
    user_id: str
    role: Literal["OWNER", "MEMBER", "ADMIN"] = "OWNER"
    status: Literal["ACTIVE", "DISABLED"] = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Documents & Ingestion ---


class Document(BaseModel):
    document_id: str
    organization_id: str
    kind: Literal["RECEIPT", "AUDIO", "LEDGER", "SCREENSHOT"] = "RECEIPT"
    original_name: str
    content_type: str
    size_bytes: int
    evidence_retained: bool = False
    storage_provider: str = "NONE"
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class IngestionJob(BaseModel):
    ingestion_id: str
    organization_id: str
    document_id: str
    draft_id: str | None = None
    agent_run_id: str | None = None
    status: Literal["PROCESSING", "NEEDS_REVIEW", "CONFIRMED", "REJECTED", "FAILED"] = "NEEDS_REVIEW"
    provider: Literal["gemma", "fixture"] = "fixture"
    fallback_used: bool = False
    error_code: str | None = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Inventory & Movement ---


class InventoryItem(BaseModel):
    organization_id: str
    product_id: str
    display_name: str
    unit: str = "BOTTLE"
    quantity_on_hand: float = 0.0
    average_daily_sales: float | None = None
    target_stock_quantity: float = 34.0
    low_stock_threshold: float = 20.0
    status: Literal["HEALTHY", "LOW_STOCK", "OUT_OF_STOCK"] = "HEALTHY"
    version: int = 1
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InventoryMovement(BaseModel):
    movement_id: str
    organization_id: str
    product_id: str
    transaction_id: str | None = None
    kind: Literal["SALE", "PURCHASE", "ADJUSTMENT", "REVERSAL"] = "PURCHASE"
    unit: str = "BOTTLE"
    quantity_delta: float
    quantity_after: float
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Procurement & Catalog ---


class SupplierCatalogItem(BaseModel):
    catalog_item_id: str
    organization_id: str
    product_id: str
    supplier_sku: str
    unit: str = "BOTTLE"
    unit_price_centimes: int
    minimum_quantity: float = 1.0
    available_quantity: float = 1000.0
    delivery_fee_centimes: int = 0
    delivery_days: int = 1
    service_areas: list[str] = Field(default_factory=lambda: ["Berrechid Center"])
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProcurementNeed(BaseModel):
    need_id: str
    organization_id: str
    product_id: str
    unit: str = "BOTTLE"
    quantity_needed: float
    stock_on_hand: float | None = None
    average_daily_sales: float | None = None
    days_remaining: int | None = None
    target_stock_quantity: float | None = None
    status: Literal["OPEN", "MATCHED", "ORDERED", "CANCELLED"] = "OPEN"
    coarse_area: str = "Berrechid Center"
    stockout_at: datetime | None = None
    needed_by: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Offer(BaseModel):
    offer_id: str
    organization_id: str
    procurement_need_id: str
    supplier_organization_id: str
    catalog_item_id: str
    product_id: str
    unit: str = "BOTTLE"
    requested_quantity: float
    unit_price_centimes: int
    minimum_quantity: float
    delivery_fee_centimes: int
    landed_cost_centimes: int
    eligible_alone: bool = True
    affordable: bool = True
    status: Literal["AVAILABLE_NOW", "GROUP_ONLY", "REJECTED"] = "AVAILABLE_NOW"
    rejection_reasons: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Group Orders & Collective Purchasing ---


class GroupOrderMember(BaseModel):
    organization_id: str
    procurement_need_id: str
    quantity: float
    status: Literal["PENDING", "JOINED", "APPROVED", "DECLINED"] = "JOINED"
    original_unit_price_centimes: int
    collective_unit_price_centimes: int
    original_delivery_centimes: int
    collective_delivery_share_centimes: int
    product_saving_centimes: int
    delivery_saving_centimes: int
    total_saving_centimes: int
    approved_by: str | None = None
    approved_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GroupOrder(BaseModel):
    group_order_id: str
    product_id: str
    unit: str = "BOTTLE"
    supplier_organization_id: str
    supplier_catalog_item_id: str
    status: Literal["PROPOSED", "OPEN", "APPROVED", "ORDERED", "CANCELLED"] = "PROPOSED"
    total_quantity: float
    minimum_quantity: float
    unit_price_centimes: int
    delivery_total_centimes: int
    participant_organization_ids: list[str] = Field(default_factory=list)
    coarse_area: str = "Berrechid Center"
    join_deadline: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    needed_by: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SupplierOpportunity(BaseModel):
    opportunity_id: str
    product_id: str
    unit: str = "BOTTLE"
    total_quantity: float
    coarse_area: str = "Berrechid Center"
    merchant_count: int = 1
    status: Literal["ACTIVE", "QUOTED", "CLOSED", "ARCHIVED"] = "ACTIVE"
    needed_by: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_group_order_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Approvals & Agent Audit ---


class Approval(BaseModel):
    approval_id: str
    organization_id: str
    action: Literal["CONFIRM_DRAFT", "JOIN_GROUP_ORDER", "APPROVE_GROUP_ORDER"]
    target_type: str
    target_id: str
    approved_by: str
    idempotency_key: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ToolCallRecord(BaseModel):
    tool_call_id: str
    organization_id: str
    sequence: int
    name: str
    status: Literal["STARTED", "SUCCEEDED", "FAILED"] = "SUCCEEDED"
    duration_ms: int = 0
    input_summary: str
    output_summary: str
    fallback_used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AgentRunRecord(BaseModel):
    agent_run_id: str
    organization_id: str
    document_id: str | None = None
    ingestion_job_id: str | None = None
    provider: str = "fixture"
    model: str | None = None
    status: Literal["RUNNING", "SUCCEEDED", "FAILED"] = "SUCCEEDED"
    fallback_used: bool = False
    duration_ms: int = 0
    tool_calls: list[ToolCallRecord] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None
