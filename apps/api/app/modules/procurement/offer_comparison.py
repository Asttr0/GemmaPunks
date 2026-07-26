"""Deterministic supplier-offer evaluation.

This module contains no AI and performs no persistence. It translates the
catalog item and merchant need into costs, eligibility, affordability, and
stable ranking inputs used by the procurement service.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from app.core.models import Offer, ProcurementNeed, SupplierCatalogItem


@dataclass(frozen=True)
class OfferEvaluation:
    status: str
    rejection_reasons: tuple[str, ...]
    product_cost_centimes: int
    landed_cost_centimes: int
    landed_unit_cost_centimes: int
    expected_unit_margin_centimes: int | None
    eligible_alone: bool
    affordable: bool


def _money(quantity: float, unit_centimes: int) -> int:
    return int(
        (Decimal(str(quantity)) * Decimal(unit_centimes)).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )


def evaluate_catalog_offer(
    *,
    item: SupplierCatalogItem,
    need: ProcurementNeed,
    quantity: float,
    available_cash_centimes: int,
    selling_price_centimes: int | None,
    evaluated_at: datetime,
) -> OfferEvaluation:
    """Evaluate one offer against the server-owned need and cash balance."""
    if quantity <= 0:
        raise ValueError("Quantity must be greater than zero")

    reasons: list[str] = []
    if item.product_id != need.product_id or item.unit.casefold() != need.unit.casefold():
        reasons.append("PRODUCT_OR_UNIT_MISMATCH")
    if need.coarse_area.casefold() not in {area.casefold() for area in item.service_areas}:
        reasons.append("AREA_NOT_SERVED")
    if item.available_quantity < quantity:
        reasons.append("INSUFFICIENT_SUPPLIER_STOCK")
    if evaluated_at + timedelta(days=item.delivery_days) > need.needed_by:
        reasons.append("DELIVERY_AFTER_NEEDED_BY")

    product_cost = _money(quantity, item.unit_price_centimes)
    landed_cost = product_cost + item.delivery_fee_centimes
    landed_unit_cost = int(
        (Decimal(landed_cost) / Decimal(str(quantity))).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )
    eligible_alone = quantity >= item.minimum_quantity
    if not eligible_alone:
        reasons.append("MINIMUM_QUANTITY_NOT_MET")

    hard_rejections = {
        "PRODUCT_OR_UNIT_MISMATCH",
        "AREA_NOT_SERVED",
        "INSUFFICIENT_SUPPLIER_STOCK",
        "DELIVERY_AFTER_NEEDED_BY",
    }
    status = (
        "REJECTED"
        if any(reason in hard_rejections for reason in reasons)
        else "GROUP_ONLY"
        if not eligible_alone
        else "AVAILABLE_NOW"
    )
    expected_margin = (
        selling_price_centimes - landed_unit_cost
        if selling_price_centimes is not None and selling_price_centimes > 0
        else None
    )
    return OfferEvaluation(
        status=status,
        rejection_reasons=tuple(reasons),
        product_cost_centimes=product_cost,
        landed_cost_centimes=landed_cost,
        landed_unit_cost_centimes=landed_unit_cost,
        expected_unit_margin_centimes=expected_margin,
        eligible_alone=eligible_alone,
        affordable=landed_cost <= available_cash_centimes,
    )


def offer_rank_key(offer: Offer) -> tuple[bool, int, int, str]:
    """Affordable offers win, then landed cost, delivery time, and stable ID."""
    return (
        not offer.affordable,
        offer.landed_cost_centimes,
        offer.delivery_days,
        offer.supplier_organization_id,
    )
