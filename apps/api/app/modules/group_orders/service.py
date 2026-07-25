import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.core.models import GroupOrder, GroupOrderMember, SupplierOpportunity
from app.core.store import db_store
from app.modules.auth.schemas import UserContext
from app.modules.group_orders.schemas import GroupOrderResponse, ProposeGroupOrderRequest


class GroupOrderService:
    @staticmethod
    def propose_group_order(user: UserContext, req: ProposeGroupOrderRequest) -> GroupOrderResponse:
        org_id = user.organization_id
        now = datetime.now(UTC)
        go_id = f"go-{uuid.uuid4().hex[:8]}"

        # Demo calculation: 20 units merchant + 35 units partner demand = 55 total units
        qty = req.quantity if req.quantity > 0 else 20.0
        total_qty = qty + 35.0  # Combined demand

        original_unit_price = 2200  # 22 MAD
        collective_unit_price = 1850  # 18.50 MAD
        original_delivery = 3000  # 30 MAD
        collective_delivery = 0  # 0 MAD (free bulk delivery)

        product_saving = (original_unit_price - collective_unit_price) * int(
            qty
        )  # 7000 centimes (70 MAD)
        delivery_saving = original_delivery - collective_delivery  # 3000 centimes (30 MAD)
        total_saving = product_saving + delivery_saving  # 10000 centimes (100 MAD)

        group_order = GroupOrder(
            group_order_id=go_id,
            product_id=req.product_id,
            unit="BOTTLE",
            supplier_organization_id=req.supplier_organization_id,
            supplier_catalog_item_id=req.supplier_catalog_item_id,
            status="PROPOSED",
            total_quantity=total_qty,
            minimum_quantity=50.0,
            unit_price_centimes=collective_unit_price,
            delivery_total_centimes=collective_delivery,
            participant_organization_ids=[
                org_id,
                "merchant-chawia-grocery",
                "merchant-berrechid-snack",
            ],
            coarse_area="Berrechid Center",
            join_deadline=now + timedelta(days=2),
            needed_by=now + timedelta(days=4),
        )

        member = GroupOrderMember(
            organization_id=org_id,
            procurement_need_id=req.procurement_need_id,
            quantity=qty,
            status="JOINED",
            original_unit_price_centimes=original_unit_price,
            collective_unit_price_centimes=collective_unit_price,
            original_delivery_centimes=original_delivery,
            collective_delivery_share_centimes=collective_delivery,
            product_saving_centimes=product_saving,
            delivery_saving_centimes=delivery_saving,
            total_saving_centimes=total_saving,
        )

        db_store.group_orders[go_id] = group_order
        if go_id not in db_store.group_order_members:
            db_store.group_order_members[go_id] = {}
        db_store.group_order_members[go_id][org_id] = member

        # Automatically publish/update Supplier Opportunity
        opp_id = f"opp-{uuid.uuid4().hex[:8]}"
        db_store.supplier_opportunities[opp_id] = SupplierOpportunity(
            opportunity_id=opp_id,
            product_id=req.product_id,
            unit="BOTTLE",
            total_quantity=total_qty,
            coarse_area="Berrechid Center",
            merchant_count=3,
            status="ACTIVE",
            needed_by=group_order.needed_by,
            source_group_order_id=go_id,
        )

        return GroupOrderResponse(
            group_order=group_order,
            member=member,
            total_savings_centimes=total_saving,
            collective_unit_price_centimes=collective_unit_price,
            original_unit_price_centimes=original_unit_price,
        )

    @staticmethod
    def list_group_orders(user: UserContext) -> list[GroupOrderResponse]:
        results = []
        org_id = user.organization_id

        for go_id, go in db_store.group_orders.items():
            members = db_store.group_order_members.get(go_id, {})
            member = members.get(org_id)
            if member:
                results.append(
                    GroupOrderResponse(
                        group_order=go,
                        member=member,
                        total_savings_centimes=member.total_saving_centimes,
                        collective_unit_price_centimes=member.collective_unit_price_centimes,
                        original_unit_price_centimes=member.original_unit_price_centimes,
                    )
                )

        return results

    @staticmethod
    def join_group_order(user: UserContext, group_order_id: str) -> GroupOrderResponse:
        go = db_store.group_orders.get(group_order_id)
        if not go:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group order not found",
            )

        org_id = user.organization_id
        members = db_store.group_order_members.setdefault(group_order_id, {})
        member = members.get(org_id)

        if not member:
            member = GroupOrderMember(
                organization_id=org_id,
                procurement_need_id="need-oil-001",
                quantity=20.0,
                status="JOINED",
                original_unit_price_centimes=2200,
                collective_unit_price_centimes=1850,
                original_delivery_centimes=3000,
                collective_delivery_share_centimes=0,
                product_saving_centimes=7000,
                delivery_saving_centimes=3000,
                total_saving_centimes=10000,
            )
            members[org_id] = member

        member.status = "JOINED"

        return GroupOrderResponse(
            group_order=go,
            member=member,
            total_savings_centimes=member.total_saving_centimes,
            collective_unit_price_centimes=member.collective_unit_price_centimes,
            original_unit_price_centimes=member.original_unit_price_centimes,
        )

    @staticmethod
    def approve_group_order(user: UserContext, group_order_id: str) -> GroupOrderResponse:
        go = db_store.group_orders.get(group_order_id)
        if not go:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group order not found",
            )

        org_id = user.organization_id
        members = db_store.group_order_members.setdefault(group_order_id, {})
        member = members.get(org_id)

        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization is not a member of this group order",
            )

        member.status = "APPROVED"
        member.approved_by = user.user_id
        member.approved_at = datetime.now(UTC)
        go.status = "APPROVED"

        return GroupOrderResponse(
            group_order=go,
            member=member,
            total_savings_centimes=member.total_saving_centimes,
            collective_unit_price_centimes=member.collective_unit_price_centimes,
            original_unit_price_centimes=member.original_unit_price_centimes,
        )
