import os
from typing import Protocol

from app.core.config import get_settings
from app.core.firebase import get_firestore_client
from app.core.models import (
    AgentRunRecord,
    Approval,
    CanonicalProduct,
    GroupOrder,
    GroupOrderMember,
    InventoryItem,
    Offer,
    Organization,
    ProcurementNeed,
    SupplierCatalogItem,
    SupplierOpportunity,
    ToolCallRecord,
)
from app.core.store import DataStore, db_store
from app.modules.transactions.schemas import Transaction


class BusinessRepository(Protocol):
    def get_organization(self, organization_id: str) -> Organization | None: ...

    def list_transactions(self, organization_id: str) -> list[Transaction]: ...

    def list_canonical_products(self) -> list[CanonicalProduct]: ...

    def list_inventory_items(self, organization_id: str) -> list[InventoryItem]: ...

    def list_procurement_needs(self, organization_id: str) -> list[ProcurementNeed]: ...

    def get_inventory_item(
        self,
        organization_id: str,
        product_id: str,
    ) -> InventoryItem | None: ...

    def save_procurement_need(self, need: ProcurementNeed) -> None: ...

    def get_procurement_need(
        self,
        organization_id: str,
        need_id: str,
    ) -> ProcurementNeed | None: ...

    def list_catalog_items(
        self,
        product_id: str | None = None,
    ) -> list[SupplierCatalogItem]: ...

    def save_offers(self, organization_id: str, offers: list[Offer]) -> None: ...

    def get_catalog_item(
        self,
        supplier_organization_id: str,
        catalog_item_id: str,
    ) -> SupplierCatalogItem | None: ...

    def list_compatible_needs(
        self,
        *,
        excluded_organization_id: str,
        product_id: str,
        unit: str,
        coarse_area: str,
    ) -> list[ProcurementNeed]: ...

    def save_group_order(
        self,
        group_order: GroupOrder,
        members: list[GroupOrderMember],
        opportunity: SupplierOpportunity,
    ) -> None: ...

    def list_group_orders(
        self,
        organization_id: str,
    ) -> list[tuple[GroupOrder, GroupOrderMember]]: ...

    def get_group_order(self, group_order_id: str) -> GroupOrder | None: ...

    def get_group_order_member(
        self,
        group_order_id: str,
        organization_id: str,
    ) -> GroupOrderMember | None: ...

    def save_group_order_approval(
        self,
        group_order: GroupOrder,
        member: GroupOrderMember,
        approval: Approval,
    ) -> None: ...

    def list_supplier_opportunities(
        self,
        supplier_organization_id: str,
    ) -> list[SupplierOpportunity]: ...

    def save_catalog_item(self, item: SupplierCatalogItem) -> None: ...

    def get_supplier_opportunity(
        self,
        supplier_organization_id: str,
        opportunity_id: str,
    ) -> SupplierOpportunity | None: ...

    def save_supplier_offer(
        self,
        offer: Offer,
        opportunity: SupplierOpportunity,
    ) -> None: ...

    def get_agent_run(
        self,
        organization_id: str,
        agent_run_id: str,
    ) -> AgentRunRecord | None: ...


class InMemoryBusinessRepository:
    def __init__(self, store: DataStore):
        self.store = store

    def get_organization(self, organization_id: str) -> Organization | None:
        return self.store.organizations.get(organization_id)

    def list_transactions(self, organization_id: str) -> list[Transaction]:
        return sorted(
            self.store.transactions.get(organization_id, {}).values(),
            key=lambda item: item.occurred_at,
            reverse=True,
        )

    def list_canonical_products(self) -> list[CanonicalProduct]:
        return sorted(
            self.store.products.values(),
            key=lambda product: product.canonical_name.casefold(),
        )

    def list_inventory_items(self, organization_id: str) -> list[InventoryItem]:
        return sorted(
            self.store.inventory_items.get(organization_id, {}).values(),
            key=lambda item: item.display_name.casefold(),
        )

    def list_procurement_needs(self, organization_id: str) -> list[ProcurementNeed]:
        return sorted(
            self.store.procurement_needs.get(organization_id, []),
            key=lambda item: item.created_at,
            reverse=True,
        )

    def get_inventory_item(
        self,
        organization_id: str,
        product_id: str,
    ) -> InventoryItem | None:
        return self.store.inventory_items.get(organization_id, {}).get(product_id)

    def save_procurement_need(self, need: ProcurementNeed) -> None:
        needs = self.store.procurement_needs.setdefault(need.organization_id, [])
        needs[:] = [item for item in needs if item.need_id != need.need_id]
        needs.append(need)

    def get_procurement_need(
        self,
        organization_id: str,
        need_id: str,
    ) -> ProcurementNeed | None:
        return next(
            (
                need
                for need in self.store.procurement_needs.get(organization_id, [])
                if need.need_id == need_id
            ),
            None,
        )

    def list_catalog_items(
        self,
        product_id: str | None = None,
    ) -> list[SupplierCatalogItem]:
        items = [
            item
            for supplier_items in self.store.catalog_items.values()
            for item in supplier_items
            if item.status == "ACTIVE" and (product_id is None or item.product_id == product_id)
        ]
        return sorted(
            items,
            key=lambda item: (item.unit_price_centimes, item.organization_id),
        )

    def save_offers(self, organization_id: str, offers: list[Offer]) -> None:
        existing = self.store.offers.setdefault(organization_id, [])
        offer_ids = {offer.offer_id for offer in offers}
        existing[:] = [offer for offer in existing if offer.offer_id not in offer_ids]
        existing.extend(offers)

    def get_catalog_item(
        self,
        supplier_organization_id: str,
        catalog_item_id: str,
    ) -> SupplierCatalogItem | None:
        return next(
            (
                item
                for item in self.store.catalog_items.get(supplier_organization_id, [])
                if item.catalog_item_id == catalog_item_id
            ),
            None,
        )

    def list_compatible_needs(
        self,
        *,
        excluded_organization_id: str,
        product_id: str,
        unit: str,
        coarse_area: str,
    ) -> list[ProcurementNeed]:
        return sorted(
            [
                need
                for organization_id, needs in self.store.procurement_needs.items()
                if organization_id != excluded_organization_id
                for need in needs
                if need.status == "OPEN"
                and need.product_id == product_id
                and need.unit.casefold() == unit.casefold()
                and need.coarse_area.casefold() == coarse_area.casefold()
            ],
            key=lambda need: (need.needed_by, need.organization_id, need.need_id),
        )

    def save_group_order(
        self,
        group_order: GroupOrder,
        members: list[GroupOrderMember],
        opportunity: SupplierOpportunity,
    ) -> None:
        self.store.group_orders[group_order.group_order_id] = group_order
        self.store.group_order_members[group_order.group_order_id] = {
            member.organization_id: member for member in members
        }
        self.store.supplier_opportunities[opportunity.opportunity_id] = opportunity

    def list_group_orders(
        self,
        organization_id: str,
    ) -> list[tuple[GroupOrder, GroupOrderMember]]:
        return [
            (group_order, members[organization_id])
            for group_order_id, group_order in self.store.group_orders.items()
            if (members := self.store.group_order_members.get(group_order_id, {})).get(
                organization_id
            )
        ]

    def get_group_order(self, group_order_id: str) -> GroupOrder | None:
        return self.store.group_orders.get(group_order_id)

    def get_group_order_member(
        self,
        group_order_id: str,
        organization_id: str,
    ) -> GroupOrderMember | None:
        return self.store.group_order_members.get(group_order_id, {}).get(organization_id)

    def save_group_order_approval(
        self,
        group_order: GroupOrder,
        member: GroupOrderMember,
        approval: Approval,
    ) -> None:
        self.store.group_orders[group_order.group_order_id] = group_order
        self.store.group_order_members.setdefault(group_order.group_order_id, {})[
            member.organization_id
        ] = member
        approvals = self.store.approvals.setdefault(member.organization_id, [])
        if not any(item.approval_id == approval.approval_id for item in approvals):
            approvals.append(approval)

    def list_supplier_opportunities(
        self,
        supplier_organization_id: str,
    ) -> list[SupplierOpportunity]:
        return sorted(
            [
                opportunity
                for opportunity in self.store.supplier_opportunities.values()
                if opportunity.supplier_organization_id
                in {
                    "",
                    supplier_organization_id,
                }
            ],
            key=lambda item: item.created_at,
            reverse=True,
        )

    def save_catalog_item(self, item: SupplierCatalogItem) -> None:
        catalog = self.store.catalog_items.setdefault(item.organization_id, [])
        catalog[:] = [
            current for current in catalog if current.catalog_item_id != item.catalog_item_id
        ]
        catalog.append(item)

    def get_supplier_opportunity(
        self,
        supplier_organization_id: str,
        opportunity_id: str,
    ) -> SupplierOpportunity | None:
        opportunity = self.store.supplier_opportunities.get(opportunity_id)
        if opportunity is None:
            return None
        if opportunity.supplier_organization_id not in {
            "",
            supplier_organization_id,
        }:
            return None
        return opportunity

    def save_supplier_offer(
        self,
        offer: Offer,
        opportunity: SupplierOpportunity,
    ) -> None:
        offers = self.store.offers.setdefault(offer.organization_id, [])
        offers[:] = [item for item in offers if item.offer_id != offer.offer_id]
        offers.append(offer)
        self.store.supplier_opportunities[opportunity.opportunity_id] = opportunity

    def get_agent_run(
        self,
        organization_id: str,
        agent_run_id: str,
    ) -> AgentRunRecord | None:
        run = self.store.agent_runs.get(agent_run_id)
        if run is None or run.organization_id != organization_id:
            return None
        return run.model_copy(deep=True)


class FirestoreBusinessRepository:
    def __init__(self):
        self.client = get_firestore_client()

    def _organization_ref(self, organization_id: str):
        return self.client.collection("organizations").document(organization_id)

    def get_organization(self, organization_id: str) -> Organization | None:
        snapshot = self._organization_ref(organization_id).get()
        if not snapshot.exists:
            return None
        return Organization.model_validate(
            {"organization_id": organization_id, **snapshot.to_dict()}
        )

    def _product_name(self, product_id: str) -> str:
        snapshot = self.client.collection("products").document(product_id).get()
        if not snapshot.exists:
            return product_id.replace("-", " ").title()
        data = snapshot.to_dict()
        return str(data.get("canonical_name") or product_id.replace("-", " ").title())

    def list_transactions(self, organization_id: str) -> list[Transaction]:
        transactions: list[Transaction] = []
        collection = self._organization_ref(organization_id).collection("transactions")
        for snapshot in collection.stream():
            data = snapshot.to_dict()
            if data.get("organization_id") != organization_id:
                continue
            if str(data.get("status", "")).upper() != "CONFIRMED":
                continue
            lines = []
            for line in data.get("lines", []):
                normalized_line = dict(line)
                product_id = str(normalized_line["product_id"])
                normalized_line.setdefault("product_name", self._product_name(product_id))
                lines.append(normalized_line)
            transactions.append(
                Transaction.model_validate(
                    {
                        "id": snapshot.id,
                        **data,
                        "kind": str(data["kind"]).lower(),
                        "lines": lines,
                        "ingestion_id": data.get("ingestion_id"),
                        "draft_id": data.get("source_draft_id"),
                    }
                )
            )
        return sorted(transactions, key=lambda item: item.occurred_at, reverse=True)

    def list_canonical_products(self) -> list[CanonicalProduct]:
        products = [
            CanonicalProduct.model_validate({"product_id": snapshot.id, **snapshot.to_dict()})
            for snapshot in self.client.collection("products").stream()
        ]
        return sorted(products, key=lambda product: product.canonical_name.casefold())

    def list_inventory_items(self, organization_id: str) -> list[InventoryItem]:
        items = []
        collection = self._organization_ref(organization_id).collection("inventory_items")
        for snapshot in collection.stream():
            data = snapshot.to_dict()
            if data.get("organization_id") != organization_id:
                continue
            items.append(InventoryItem.model_validate(data))
        return sorted(items, key=lambda item: item.display_name.casefold())

    def list_procurement_needs(self, organization_id: str) -> list[ProcurementNeed]:
        needs = []
        collection = self._organization_ref(organization_id).collection("procurement_needs")
        for snapshot in collection.stream():
            data = snapshot.to_dict()
            if data.get("organization_id") != organization_id:
                continue
            needs.append(ProcurementNeed.model_validate({"need_id": snapshot.id, **data}))
        return sorted(needs, key=lambda item: item.created_at, reverse=True)

    def get_inventory_item(
        self,
        organization_id: str,
        product_id: str,
    ) -> InventoryItem | None:
        snapshot = (
            self._organization_ref(organization_id)
            .collection("inventory_items")
            .document(product_id)
            .get()
        )
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        if data.get("organization_id") != organization_id:
            return None
        return InventoryItem.model_validate(data)

    def save_procurement_need(self, need: ProcurementNeed) -> None:
        (
            self._organization_ref(need.organization_id)
            .collection("procurement_needs")
            .document(need.need_id)
            .set(need.model_dump(mode="python", exclude={"need_id"}))
        )

    def get_procurement_need(
        self,
        organization_id: str,
        need_id: str,
    ) -> ProcurementNeed | None:
        snapshot = (
            self._organization_ref(organization_id)
            .collection("procurement_needs")
            .document(need_id)
            .get()
        )
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        if data.get("organization_id") != organization_id:
            return None
        return ProcurementNeed.model_validate({"need_id": need_id, **data})

    def list_catalog_items(
        self,
        product_id: str | None = None,
    ) -> list[SupplierCatalogItem]:
        items: list[SupplierCatalogItem] = []
        for organization_snapshot in self.client.collection("organizations").stream():
            organization_data = organization_snapshot.to_dict()
            if organization_data.get("type") != "SUPPLIER":
                continue
            catalog_collection = organization_snapshot.reference.collection(
                "supplier_catalog_items"
            )
            for item_snapshot in catalog_collection.stream():
                data = item_snapshot.to_dict()
                if data.get("organization_id") != organization_snapshot.id:
                    continue
                if data.get("status") != "ACTIVE":
                    continue
                if product_id is not None and data.get("product_id") != product_id:
                    continue
                items.append(
                    SupplierCatalogItem.model_validate(
                        {"catalog_item_id": item_snapshot.id, **data}
                    )
                )
        return sorted(
            items,
            key=lambda item: (item.unit_price_centimes, item.organization_id),
        )

    def save_offers(self, organization_id: str, offers: list[Offer]) -> None:
        organization_ref = self._organization_ref(organization_id)
        batch = self.client.batch()
        for offer in offers:
            batch.set(
                organization_ref.collection("offers").document(offer.offer_id),
                offer.model_dump(mode="python", exclude={"offer_id"}),
            )
        batch.commit()

    def get_catalog_item(
        self,
        supplier_organization_id: str,
        catalog_item_id: str,
    ) -> SupplierCatalogItem | None:
        snapshot = (
            self._organization_ref(supplier_organization_id)
            .collection("supplier_catalog_items")
            .document(catalog_item_id)
            .get()
        )
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        if data.get("organization_id") != supplier_organization_id:
            return None
        return SupplierCatalogItem.model_validate({"catalog_item_id": catalog_item_id, **data})

    def list_compatible_needs(
        self,
        *,
        excluded_organization_id: str,
        product_id: str,
        unit: str,
        coarse_area: str,
    ) -> list[ProcurementNeed]:
        needs: list[ProcurementNeed] = []
        for organization_snapshot in self.client.collection("organizations").stream():
            if organization_snapshot.id == excluded_organization_id:
                continue
            if organization_snapshot.to_dict().get("type") != "MERCHANT":
                continue
            for need_snapshot in organization_snapshot.reference.collection(
                "procurement_needs"
            ).stream():
                data = need_snapshot.to_dict()
                if data.get("organization_id") != organization_snapshot.id:
                    continue
                if data.get("status") != "OPEN":
                    continue
                if data.get("product_id") != product_id:
                    continue
                if str(data.get("unit", "")).casefold() != unit.casefold():
                    continue
                if str(data.get("coarse_area", "")).casefold() != coarse_area.casefold():
                    continue
                needs.append(ProcurementNeed.model_validate({"need_id": need_snapshot.id, **data}))
        return sorted(
            needs,
            key=lambda need: (need.needed_by, need.organization_id, need.need_id),
        )

    def save_group_order(
        self,
        group_order: GroupOrder,
        members: list[GroupOrderMember],
        opportunity: SupplierOpportunity,
    ) -> None:
        group_ref = self.client.collection("group_orders").document(group_order.group_order_id)
        opportunity_ref = self.client.collection("supplier_opportunities").document(
            opportunity.opportunity_id
        )
        batch = self.client.batch()
        batch.set(
            group_ref,
            group_order.model_dump(mode="python", exclude={"group_order_id"}),
        )
        for member in members:
            batch.set(
                group_ref.collection("members").document(member.organization_id),
                member.model_dump(mode="python"),
            )
        batch.set(
            opportunity_ref,
            opportunity.model_dump(mode="python", exclude={"opportunity_id"}),
        )
        batch.commit()

    def list_group_orders(
        self,
        organization_id: str,
    ) -> list[tuple[GroupOrder, GroupOrderMember]]:
        results: list[tuple[GroupOrder, GroupOrderMember]] = []
        for group_snapshot in self.client.collection("group_orders").stream():
            member_snapshot = (
                group_snapshot.reference.collection("members").document(organization_id).get()
            )
            if not member_snapshot.exists:
                continue
            results.append(
                (
                    GroupOrder.model_validate(
                        {"group_order_id": group_snapshot.id, **group_snapshot.to_dict()}
                    ),
                    GroupOrderMember.model_validate(member_snapshot.to_dict()),
                )
            )
        return sorted(results, key=lambda item: item[0].created_at, reverse=True)

    def get_group_order(self, group_order_id: str) -> GroupOrder | None:
        snapshot = self.client.collection("group_orders").document(group_order_id).get()
        if not snapshot.exists:
            return None
        return GroupOrder.model_validate({"group_order_id": group_order_id, **snapshot.to_dict()})

    def get_group_order_member(
        self,
        group_order_id: str,
        organization_id: str,
    ) -> GroupOrderMember | None:
        snapshot = (
            self.client.collection("group_orders")
            .document(group_order_id)
            .collection("members")
            .document(organization_id)
            .get()
        )
        if not snapshot.exists:
            return None
        return GroupOrderMember.model_validate(snapshot.to_dict())

    def save_group_order_approval(
        self,
        group_order: GroupOrder,
        member: GroupOrderMember,
        approval: Approval,
    ) -> None:
        group_ref = self.client.collection("group_orders").document(group_order.group_order_id)
        member_ref = group_ref.collection("members").document(member.organization_id)
        approval_ref = (
            self._organization_ref(member.organization_id)
            .collection("approvals")
            .document(approval.approval_id)
        )
        batch = self.client.batch()
        batch.set(
            group_ref,
            group_order.model_dump(mode="python", exclude={"group_order_id"}),
        )
        batch.set(member_ref, member.model_dump(mode="python"))
        batch.set(
            approval_ref,
            approval.model_dump(mode="python", exclude={"approval_id"}),
        )
        batch.commit()

    def list_supplier_opportunities(
        self,
        supplier_organization_id: str,
    ) -> list[SupplierOpportunity]:
        opportunities = []
        for snapshot in self.client.collection("supplier_opportunities").stream():
            data = snapshot.to_dict()
            if data.get("supplier_organization_id") != supplier_organization_id:
                continue
            opportunities.append(
                SupplierOpportunity.model_validate({"opportunity_id": snapshot.id, **data})
            )
        return sorted(opportunities, key=lambda item: item.created_at, reverse=True)

    def save_catalog_item(self, item: SupplierCatalogItem) -> None:
        (
            self._organization_ref(item.organization_id)
            .collection("supplier_catalog_items")
            .document(item.catalog_item_id)
            .set(item.model_dump(mode="python", exclude={"catalog_item_id"}))
        )

    def get_supplier_opportunity(
        self,
        supplier_organization_id: str,
        opportunity_id: str,
    ) -> SupplierOpportunity | None:
        snapshot = self.client.collection("supplier_opportunities").document(opportunity_id).get()
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        if data.get("supplier_organization_id") != supplier_organization_id:
            return None
        return SupplierOpportunity.model_validate({"opportunity_id": opportunity_id, **data})

    def save_supplier_offer(
        self,
        offer: Offer,
        opportunity: SupplierOpportunity,
    ) -> None:
        offer_ref = (
            self._organization_ref(offer.organization_id)
            .collection("offers")
            .document(offer.offer_id)
        )
        opportunity_ref = self.client.collection("supplier_opportunities").document(
            opportunity.opportunity_id
        )
        batch = self.client.batch()
        batch.set(
            offer_ref,
            offer.model_dump(mode="python", exclude={"offer_id"}),
        )
        batch.set(
            opportunity_ref,
            opportunity.model_dump(mode="python", exclude={"opportunity_id"}),
        )
        batch.commit()

    def get_agent_run(
        self,
        organization_id: str,
        agent_run_id: str,
    ) -> AgentRunRecord | None:
        run_ref = (
            self._organization_ref(organization_id).collection("agent_runs").document(agent_run_id)
        )
        snapshot = run_ref.get()
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        if data.get("organization_id") != organization_id:
            return None
        tool_calls = [
            ToolCallRecord.model_validate(
                {"tool_call_id": tool_snapshot.id, **tool_snapshot.to_dict()}
            )
            for tool_snapshot in run_ref.collection("tool_calls").stream()
        ]
        tool_calls.sort(key=lambda call: call.sequence)
        return AgentRunRecord.model_validate(
            {
                "agent_run_id": agent_run_id,
                **data,
                "tool_calls": tool_calls,
            }
        )


_in_memory_repository = InMemoryBusinessRepository(db_store)


def get_business_repository() -> BusinessRepository:
    settings = get_settings()
    if settings.app_env == "production" or os.getenv("FIRESTORE_EMULATOR_HOST"):
        return FirestoreBusinessRepository()
    return _in_memory_repository


async def business_repository_dependency() -> BusinessRepository:
    """FastAPI dependency wrapper that avoids a thread hop for repository selection."""
    return get_business_repository()


def require_organization_type(
    repository: BusinessRepository,
    organization_id: str,
    expected_type: str,
) -> Organization:
    organization = repository.get_organization(organization_id)
    if organization is None or organization.status != "ACTIVE":
        raise PermissionError("Active organization not found")
    if organization.type != expected_type:
        raise PermissionError(f"{expected_type.title()} organization required")
    return organization
