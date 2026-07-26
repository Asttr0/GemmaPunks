import hashlib
from datetime import UTC, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status

from app.core.business_repository import BusinessRepository, get_business_repository
from app.core.models import Offer, ProcurementNeed, SupplierCatalogItem
from app.modules.auth.schemas import UserContext
from app.modules.businesses.service import build_merchant_dashboard
from app.modules.procurement.forecasting import forecast_stockout
from app.modules.procurement.schemas import (
    GenerateProcurementNeedRequest,
    OfferCompareRequest,
    OfferCompareResponse,
)


def _money(quantity: float, unit_centimes: int) -> int:
    return int(
        (Decimal(str(quantity)) * Decimal(unit_centimes)).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )


class ProcurementService:
    def __init__(self, repository: BusinessRepository):
        self.repository = repository

    def generate_need(
        self,
        user: UserContext,
        req: GenerateProcurementNeedRequest,
    ) -> ProcurementNeed:
        organization = self.repository.get_organization(user.organization_id)
        if organization is None or organization.type != "MERCHANT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Merchant organization required",
            )
        item = self.repository.get_inventory_item(user.organization_id, req.product_id)
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found",
            )
        if item.unit.casefold() != req.unit.casefold():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Requested unit must be {item.unit}",
            )

        target_stock = (
            req.target_stock if req.target_stock is not None else item.target_stock_quantity
        )
        forecast = forecast_stockout(
            stock_on_hand=item.quantity_on_hand,
            average_daily_sales=item.average_daily_sales,
            sales_history_days=item.sales_history_days,
            target_stock_quantity=target_stock,
        )
        now = datetime.now(UTC)
        existing = next(
            (
                need
                for need in self.repository.list_procurement_needs(user.organization_id)
                if need.product_id == item.product_id and need.status == "OPEN"
            ),
            None,
        )
        need_id = existing.need_id if existing else f"need-{item.product_id}"
        stockout_at = (
            now + timedelta(days=forecast.days_remaining)
            if forecast.days_remaining is not None
            else None
        )
        need = ProcurementNeed(
            need_id=need_id,
            organization_id=user.organization_id,
            product_id=item.product_id,
            unit=item.unit,
            quantity_needed=forecast.quantity_needed,
            stock_on_hand=item.quantity_on_hand,
            average_daily_sales=item.average_daily_sales,
            sales_history_days=item.sales_history_days,
            days_remaining=forecast.days_remaining,
            target_stock_quantity=target_stock,
            status="OPEN",
            coarse_area=organization.coarse_area,
            stockout_at=stockout_at,
            forecast_status=forecast.status,
            explanation=forecast.explanation,
            uncertainty_note=forecast.uncertainty_note,
            needed_by=stockout_at or now + timedelta(days=7),
            created_at=existing.created_at if existing else now,
            updated_at=now,
        )
        self.repository.save_procurement_need(need)
        return need

    def list_needs(self, user: UserContext) -> list[ProcurementNeed]:
        return self.repository.list_procurement_needs(user.organization_id)

    def search_suppliers(
        self,
        user: UserContext,
        product_id: str | None = None,
    ) -> list[SupplierCatalogItem]:
        organization = self.repository.get_organization(user.organization_id)
        if organization is None or organization.type != "MERCHANT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Merchant organization required",
            )
        area = organization.coarse_area.casefold()
        return [
            item
            for item in self.repository.list_catalog_items(product_id)
            if area in {service_area.casefold() for service_area in item.service_areas}
        ]

    def compare_offers(
        self,
        user: UserContext,
        req: OfferCompareRequest,
    ) -> OfferCompareResponse:
        need = self.repository.get_procurement_need(
            user.organization_id,
            req.procurement_need_id,
        )
        if need is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Procurement need not found",
            )
        inventory_item = self.repository.get_inventory_item(
            user.organization_id,
            need.product_id,
        )
        quantity = req.quantity if req.quantity is not None else need.quantity_needed
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Quantity must be greater than zero",
            )
        available_cash = build_merchant_dashboard(
            self.repository,
            user.organization_id,
        ).kpis.available_cash_centimes
        now = datetime.now(UTC)

        available_now: list[Offer] = []
        group_candidates: list[Offer] = []
        rejected: list[Offer] = []
        for item in self.repository.list_catalog_items(need.product_id):
            reasons: list[str] = []
            if item.unit.casefold() != need.unit.casefold():
                reasons.append("UNIT_MISMATCH")
            if need.coarse_area.casefold() not in {area.casefold() for area in item.service_areas}:
                reasons.append("AREA_NOT_SERVED")
            if item.available_quantity < quantity:
                reasons.append("INSUFFICIENT_SUPPLIER_STOCK")
            if now + timedelta(days=item.delivery_days) > need.needed_by:
                reasons.append("DELIVERY_AFTER_NEEDED_BY")

            product_cost = _money(quantity, item.unit_price_centimes)
            landed_cost = product_cost + item.delivery_fee_centimes
            landed_unit = int(
                (Decimal(landed_cost) / Decimal(str(quantity))).quantize(
                    Decimal("1"),
                    rounding=ROUND_HALF_UP,
                )
            )
            eligible_alone = quantity >= item.minimum_quantity
            affordable = landed_cost <= available_cash
            expected_margin = (
                inventory_item.selling_price_centimes - landed_unit
                if inventory_item and inventory_item.selling_price_centimes > 0
                else None
            )
            if not eligible_alone:
                reasons.append("MINIMUM_QUANTITY_NOT_MET")

            status_value = (
                "REJECTED"
                if any(
                    reason
                    in {
                        "UNIT_MISMATCH",
                        "AREA_NOT_SERVED",
                        "INSUFFICIENT_SUPPLIER_STOCK",
                        "DELIVERY_AFTER_NEEDED_BY",
                    }
                    for reason in reasons
                )
                else "GROUP_ONLY"
                if not eligible_alone
                else "AVAILABLE_NOW"
            )
            explanation = (
                f"{quantity:g} × {item.unit_price_centimes} centimes plus "
                f"{item.delivery_fee_centimes} delivery = {landed_cost} centimes. "
                f"Cash available: {available_cash} centimes. "
                f"MOQ: {item.minimum_quantity:g}; delivery: {item.delivery_days} day(s)."
            )
            offer_key = f"{user.organization_id}:{need.need_id}:{item.catalog_item_id}:{quantity:g}"
            offer = Offer(
                offer_id=f"offer-{hashlib.sha256(offer_key.encode()).hexdigest()[:16]}",
                organization_id=user.organization_id,
                procurement_need_id=need.need_id,
                supplier_organization_id=item.organization_id,
                catalog_item_id=item.catalog_item_id,
                product_id=item.product_id,
                unit=item.unit,
                requested_quantity=quantity,
                unit_price_centimes=item.unit_price_centimes,
                minimum_quantity=item.minimum_quantity,
                delivery_fee_centimes=item.delivery_fee_centimes,
                product_cost_centimes=product_cost,
                landed_cost_centimes=landed_cost,
                landed_unit_cost_centimes=landed_unit,
                expected_unit_margin_centimes=expected_margin,
                delivery_days=item.delivery_days,
                eligible_alone=eligible_alone,
                affordable=affordable,
                status=status_value,
                rejection_reasons=reasons,
                explanation=explanation,
                created_at=now,
                updated_at=now,
            )
            if offer.status == "REJECTED":
                rejected.append(offer)
            elif offer.status == "GROUP_ONLY":
                group_candidates.append(offer)
            else:
                available_now.append(offer)

        def rank_key(offer: Offer):
            return (
                not offer.affordable,
                offer.landed_cost_centimes,
                offer.delivery_days,
                offer.supplier_organization_id,
            )

        available_now.sort(key=rank_key)
        group_candidates.sort(key=rank_key)
        rejected.sort(key=lambda offer: offer.supplier_organization_id)
        all_offers = [*available_now, *group_candidates, *rejected]
        self.repository.save_offers(user.organization_id, all_offers)
        return OfferCompareResponse(
            available_now=available_now,
            group_opportunity=group_candidates[0] if group_candidates else None,
            rejected=rejected,
        )


def get_procurement_service() -> ProcurementService:
    return ProcurementService(get_business_repository())


async def procurement_service_dependency() -> ProcurementService:
    return get_procurement_service()
