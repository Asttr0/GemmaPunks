import hashlib
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.core.business_repository import BusinessRepository, get_business_repository
from app.core.models import (
    Approval,
    GroupOrder,
    GroupOrderMember,
    SupplierOpportunity,
)
from app.modules.auth.schemas import UserContext
from app.modules.group_orders.savings import calculate_collective_savings
from app.modules.group_orders.schemas import (
    GroupOrderResponse,
    GroupOrderSummary,
    ProposeGroupOrderRequest,
)
from app.modules.procurement.schemas import OfferCompareRequest
from app.modules.procurement.service import ProcurementService


def _summary(group_order: GroupOrder) -> GroupOrderSummary:
    return GroupOrderSummary(
        group_order_id=group_order.group_order_id,
        product_id=group_order.product_id,
        unit=group_order.unit,
        supplier_organization_id=group_order.supplier_organization_id,
        supplier_catalog_item_id=group_order.supplier_catalog_item_id,
        status=group_order.status,
        total_quantity=group_order.total_quantity,
        minimum_quantity=group_order.minimum_quantity,
        unit_price_centimes=group_order.unit_price_centimes,
        delivery_total_centimes=group_order.delivery_total_centimes,
        participant_count=len(group_order.participant_organization_ids),
        coarse_area=group_order.coarse_area,
        join_deadline=group_order.join_deadline,
        needed_by=group_order.needed_by,
    )


def _response(group_order: GroupOrder, member: GroupOrderMember) -> GroupOrderResponse:
    return GroupOrderResponse(
        group_order=_summary(group_order),
        member=member,
        total_savings_centimes=member.total_saving_centimes,
        collective_unit_price_centimes=member.collective_unit_price_centimes,
        original_unit_price_centimes=member.original_unit_price_centimes,
    )


class GroupOrderService:
    def __init__(self, repository: BusinessRepository):
        self.repository = repository

    def propose_group_order(
        self,
        user: UserContext,
        req: ProposeGroupOrderRequest,
    ) -> GroupOrderResponse:
        organization = self.repository.get_organization(user.organization_id)
        if organization is None or organization.type != "MERCHANT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Merchant organization required",
            )
        need = self.repository.get_procurement_need(
            user.organization_id,
            req.procurement_need_id,
        )
        if need is None or need.status != "OPEN":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Open procurement need not found",
            )
        if req.product_id is not None and req.product_id != need.product_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Product must match the procurement need",
            )
        if req.quantity is not None and req.quantity != need.quantity_needed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Quantity must match the procurement need",
            )
        catalog_item = self.repository.get_catalog_item(
            req.supplier_organization_id,
            req.supplier_catalog_item_id,
        )
        if catalog_item is None or catalog_item.product_id != need.product_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Matching supplier catalog item not found",
            )
        if catalog_item.unit.casefold() != need.unit.casefold():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Supplier unit does not match the procurement need",
            )

        compatible_needs = self.repository.list_compatible_needs(
            excluded_organization_id=user.organization_id,
            product_id=need.product_id,
            unit=need.unit,
            coarse_area=need.coarse_area,
        )
        selected_needs = [need]
        running_quantity = need.quantity_needed
        for candidate in compatible_needs:
            selected_needs.append(candidate)
            running_quantity += candidate.quantity_needed
            if running_quantity >= catalog_item.minimum_quantity:
                break
        if running_quantity < catalog_item.minimum_quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Compatible demand totals {running_quantity:g}, below supplier MOQ "
                    f"{catalog_item.minimum_quantity:g}"
                ),
            )
        if catalog_item.available_quantity < running_quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Supplier stock is insufficient for the collective order",
            )

        comparison = ProcurementService(self.repository).compare_offers(
            user,
            OfferCompareRequest(
                procurement_need_id=need.need_id,
                quantity=need.quantity_needed,
            ),
        )
        if not comparison.available_now:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No eligible individual offer exists for savings comparison",
            )
        original_offer = comparison.available_now[0]
        now = datetime.now(UTC)
        identity = (
            f"{need.need_id}:{catalog_item.catalog_item_id}:"
            f"{','.join(item.need_id for item in selected_needs)}"
        )
        group_order_id = f"group-{hashlib.sha256(identity.encode()).hexdigest()[:16]}"
        existing_group = self.repository.get_group_order(group_order_id)
        existing_member = self.repository.get_group_order_member(
            group_order_id,
            user.organization_id,
        )
        if existing_group is not None and existing_member is not None:
            return _response(existing_group, existing_member)
        participant_ids = [item.organization_id for item in selected_needs]
        group_order = GroupOrder(
            group_order_id=group_order_id,
            product_id=need.product_id,
            unit=need.unit,
            supplier_organization_id=catalog_item.organization_id,
            supplier_catalog_item_id=catalog_item.catalog_item_id,
            status="OPEN",
            total_quantity=running_quantity,
            minimum_quantity=catalog_item.minimum_quantity,
            unit_price_centimes=catalog_item.unit_price_centimes,
            delivery_total_centimes=catalog_item.delivery_fee_centimes,
            participant_organization_ids=participant_ids,
            coarse_area=need.coarse_area,
            join_deadline=min(need.needed_by, now + timedelta(days=2)),
            needed_by=min(item.needed_by for item in selected_needs),
            created_at=now,
            updated_at=now,
        )

        members: list[GroupOrderMember] = []
        for selected_need in selected_needs:
            savings = calculate_collective_savings(
                member_quantity=selected_need.quantity_needed,
                total_quantity=running_quantity,
                original_unit_price_centimes=original_offer.unit_price_centimes,
                collective_unit_price_centimes=catalog_item.unit_price_centimes,
                original_delivery_centimes=original_offer.delivery_fee_centimes,
                collective_delivery_total_centimes=catalog_item.delivery_fee_centimes,
            )
            members.append(
                GroupOrderMember(
                    organization_id=selected_need.organization_id,
                    procurement_need_id=selected_need.need_id,
                    quantity=selected_need.quantity_needed,
                    status=(
                        "JOINED"
                        if selected_need.organization_id == user.organization_id
                        else "PENDING"
                    ),
                    original_unit_price_centimes=original_offer.unit_price_centimes,
                    collective_unit_price_centimes=catalog_item.unit_price_centimes,
                    original_delivery_centimes=original_offer.delivery_fee_centimes,
                    collective_delivery_share_centimes=(savings.collective_delivery_share_centimes),
                    product_saving_centimes=savings.product_saving_centimes,
                    delivery_saving_centimes=savings.delivery_saving_centimes,
                    total_saving_centimes=savings.total_saving_centimes,
                    created_at=now,
                    updated_at=now,
                )
            )

        opportunity = SupplierOpportunity(
            opportunity_id=f"opportunity-{group_order_id.removeprefix('group-')}",
            supplier_organization_id=catalog_item.organization_id,
            product_id=need.product_id,
            unit=need.unit,
            total_quantity=running_quantity,
            coarse_area=need.coarse_area,
            merchant_count=len(members),
            status="ACTIVE",
            needed_by=group_order.needed_by,
            source_group_order_id=group_order_id,
            created_at=now,
            updated_at=now,
        )
        self.repository.save_group_order(group_order, members, opportunity)
        current_member = next(
            member for member in members if member.organization_id == user.organization_id
        )
        return _response(group_order, current_member)

    def list_group_orders(self, user: UserContext) -> list[GroupOrderResponse]:
        return [
            _response(group_order, member)
            for group_order, member in self.repository.list_group_orders(user.organization_id)
        ]

    def join_group_order(
        self,
        user: UserContext,
        group_order_id: str,
    ) -> GroupOrderResponse:
        group_order = self.repository.get_group_order(group_order_id)
        member = self.repository.get_group_order_member(
            group_order_id,
            user.organization_id,
        )
        if group_order is None or member is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group order invitation not found",
            )
        if group_order.status not in {"PROPOSED", "OPEN"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Group order is not open",
            )
        now = datetime.now(UTC)
        if now > group_order.join_deadline:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Group order join deadline has passed",
            )
        member.status = "JOINED"
        member.updated_at = now
        placeholder_approval = Approval(
            approval_id=f"join-{group_order_id}-{user.organization_id}",
            organization_id=user.organization_id,
            action="JOIN_GROUP_ORDER",
            target_type="group_order",
            target_id=group_order_id,
            approved_by=user.user_id,
            created_at=now,
        )
        self.repository.save_group_order_approval(
            group_order,
            member,
            placeholder_approval,
        )
        return _response(group_order, member)

    def approve_group_order(
        self,
        user: UserContext,
        group_order_id: str,
        idempotency_key: str,
    ) -> GroupOrderResponse:
        group_order = self.repository.get_group_order(group_order_id)
        member = self.repository.get_group_order_member(
            group_order_id,
            user.organization_id,
        )
        if group_order is None or member is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group order membership not found",
            )
        if member.status not in {"JOINED", "APPROVED"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Join the group order before approval",
            )
        now = datetime.now(UTC)
        member.status = "APPROVED"
        member.approved_by = user.user_id
        member.approved_at = member.approved_at or now
        member.updated_at = now

        statuses = {
            organization_id: (
                member.status
                if organization_id == user.organization_id
                else (
                    stored.status
                    if (
                        stored := self.repository.get_group_order_member(
                            group_order_id,
                            organization_id,
                        )
                    )
                    else "PENDING"
                )
            )
            for organization_id in group_order.participant_organization_ids
        }
        if statuses and all(value == "APPROVED" for value in statuses.values()):
            group_order.status = "APPROVED"
            group_order.updated_at = now

        approval_identity = f"{group_order_id}:{user.organization_id}"
        approval = Approval(
            approval_id=(f"approve-{hashlib.sha256(approval_identity.encode()).hexdigest()[:24]}"),
            organization_id=user.organization_id,
            action="APPROVE_GROUP_ORDER",
            target_type="group_order",
            target_id=group_order_id,
            approved_by=user.user_id,
            idempotency_key=idempotency_key,
            created_at=now,
        )
        self.repository.save_group_order_approval(group_order, member, approval)
        return _response(group_order, member)


def get_group_order_service() -> GroupOrderService:
    return GroupOrderService(get_business_repository())


async def group_order_service_dependency() -> GroupOrderService:
    return get_group_order_service()
