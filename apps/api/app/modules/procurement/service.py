import uuid
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from app.core.models import Offer, ProcurementNeed, SupplierCatalogItem
from app.core.store import db_store
from app.modules.auth.schemas import UserContext
from app.modules.procurement.schemas import (
    GenerateProcurementNeedRequest,
    OfferCompareRequest,
    OfferCompareResponse,
)


class ProcurementService:
    @staticmethod
    def generate_need(user: UserContext, req: GenerateProcurementNeedRequest) -> ProcurementNeed:
        org_id = user.organization_id
        need_id = f"need-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        need = ProcurementNeed(
            need_id=need_id,
            organization_id=org_id,
            product_id=req.product_id,
            unit=req.unit,
            quantity_needed=20.0,
            stock_on_hand=14.0,
            average_daily_sales=3.5,
            days_remaining=4,
            target_stock_quantity=req.target_stock,
            status="OPEN",
            coarse_area="Berrechid Center",
            stockout_at=now + timedelta(days=4),
            needed_by=now + timedelta(days=4),
        )

        if org_id not in db_store.procurement_needs:
            db_store.procurement_needs[org_id] = []
        db_store.procurement_needs[org_id].append(need)
        return need

    @staticmethod
    def list_needs(user: UserContext) -> list[ProcurementNeed]:
        return db_store.procurement_needs.get(user.organization_id, [])

    @staticmethod
    def search_suppliers(product_id: str | None = None) -> list[SupplierCatalogItem]:
        results = []
        for cat_list in db_store.catalog_items.values():
            for item in cat_list:
                if not product_id or item.product_id == product_id or item.product_id == "cooking_oil_1l":
                    results.append(item)
        return results

    @staticmethod
    def compare_offers(user: UserContext, req: OfferCompareRequest) -> OfferCompareResponse:
        need = None
        for n in db_store.procurement_needs.get(user.organization_id, []):
            if n.need_id == req.procurement_need_id:
                need = n
                break

        qty = req.quantity if req.quantity > 0 else (need.quantity_needed if need else 20.0)
        catalog_items = ProcurementService.search_suppliers("cooking-oil-1l")

        available_now = []
        group_opportunity = None
        rejected = []

        for item in catalog_items:
            unit_price = item.unit_price_centimes
            delivery_fee = item.delivery_fee_centimes
            landed_cost = int(qty * unit_price + delivery_fee)
            eligible_alone = qty >= item.minimum_quantity

            offer_id = f"off-{uuid.uuid4().hex[:8]}"
            rejection_reasons = []
            if not eligible_alone:
                rejection_reasons.append(
                    f"Minimum order quantity {item.minimum_quantity} not met by single merchant demand {qty}"
                )

            offer = Offer(
                offer_id=offer_id,
                organization_id=user.organization_id,
                procurement_need_id=req.procurement_need_id,
                supplier_organization_id=item.organization_id,
                catalog_item_id=item.catalog_item_id,
                product_id=item.product_id,
                unit=item.unit,
                requested_quantity=qty,
                unit_price_centimes=unit_price,
                minimum_quantity=item.minimum_quantity,
                delivery_fee_centimes=delivery_fee,
                landed_cost_centimes=landed_cost,
                eligible_alone=eligible_alone,
                affordable=True,
                status="AVAILABLE_NOW" if eligible_alone else "GROUP_ONLY",
                rejection_reasons=rejection_reasons,
            )

            if eligible_alone:
                available_now.append(offer)
            else:
                if not group_opportunity or offer.unit_price_centimes < group_opportunity.unit_price_centimes:
                    group_opportunity = offer

        available_now.sort(key=lambda o: o.landed_cost_centimes)
        return OfferCompareResponse(
            available_now=available_now,
            group_opportunity=group_opportunity,
            rejected=rejected,
        )
