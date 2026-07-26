"""
Schema for supplier offer comparison (issue #24).

Pure deterministic output — no Gemma involved. Field names follow the
calculation defined in docs/taha-ai-procurement-handoff.md section 14.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class RejectionReason(str, Enum):
    WRONG_PRODUCT_OR_UNIT = "wrong_product_or_unit"
    AREA_NOT_SERVED = "area_not_served"
    INSUFFICIENT_AVAILABLE_QUANTITY = "insufficient_available_quantity"
    DELIVERY_TOO_LATE = "delivery_too_late"


class SupplierOffer(BaseModel):
    """One supplier's terms for one product. Input to the comparison."""

    offer_id: str
    supplier_id: str
    product_id: str
    unit: str
    unit_price_centimes: int = Field(ge=0)
    minimum_order_quantity: int = Field(gt=0)
    available_quantity: int = Field(ge=0)
    delivery_cost_centimes: int = Field(ge=0)
    served_areas: list[str]
    delivery_days: int = Field(ge=0)


class PurchaseRequest(BaseModel):
    """What the merchant needs. The other input to the comparison."""

    product_id: str
    unit: str
    requested_quantity: int = Field(gt=0)
    merchant_area: str
    days_until_needed: int = Field(ge=0)
    available_cash_centimes: int = Field(ge=0)
    selling_price_centimes: int = Field(ge=0)


class OfferEvaluation(BaseModel):
    """One offer's calculated cost and fit, after passing the hard rules."""

    offer_id: str
    supplier_id: str
    unit_price_centimes: int
    minimum_order_quantity: int
    delivery_cost_centimes: int
    delivery_days: int
    quantity_used_for_pricing: int
    product_cost_centimes: int
    landed_cost_centimes: int
    landed_unit_cost_centimes: float
    affordable: bool
    expected_unit_margin_centimes: float
    usable_alone: bool


class RejectedOffer(BaseModel):
    offer_id: str
    supplier_id: str
    reason: RejectionReason
    detail: str


class OfferComparisonResult(BaseModel):
    available_now: list[OfferEvaluation]
    group_opportunity: list[OfferEvaluation]
    rejected: list[RejectedOffer]