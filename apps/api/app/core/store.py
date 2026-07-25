from datetime import datetime, timedelta, timezone
from app.core.models import (
    AgentRunRecord,
    Approval,
    CanonicalProduct,
    Document,
    ExtractionDraft,
    GroupOrder,
    GroupOrderMember,
    IngestionJob,
    InventoryItem,
    InventoryMovement,
    Membership,
    Offer,
    Organization,
    ProcurementNeed,
    Profile,
    SupplierCatalogItem,
    SupplierOpportunity,
    ToolCallRecord,
    Transaction,
)
from app.modules.businesses.schemas import (
    DashboardAlert,
    DashboardKPIs,
    DashboardNextAction,
    DashboardResponse,
    InventorySummary,
    SupplierDashboardKPIs,
    SupplierDashboardResponse,
)
from app.modules.ingestion.schemas import ConfirmationResponse, IngestionResponse
from app.modules.inventory.schemas import Product


class DataStore:
    """Multi-tenant store managing all 17 collections defined in docs/database-guide.md."""

    def __init__(self):
        self.profiles: dict[str, Profile] = {}
        self.organizations: dict[str, Organization] = {}
        self.memberships: dict[str, list[Membership]] = {}
        self.products: dict[str, CanonicalProduct] = {}
        self.inventory_items: dict[str, dict[str, InventoryItem]] = {}  # org_id -> (product_id -> InventoryItem)
        self.documents: dict[str, Document] = {}
        self.ingestion_jobs: dict[str, IngestionJob] = {}
        self.extraction_drafts: dict[str, ExtractionDraft] = {}
        self.ingestions: dict[str, IngestionResponse] = {}
        self.transactions: dict[str, dict[str, Transaction]] = {}  # org_id -> (txn_id -> Transaction)
        self.inventory_movements: dict[str, list[InventoryMovement]] = {}  # org_id -> list[Movement]
        self.catalog_items: dict[str, list[SupplierCatalogItem]] = {}  # org_id -> list[Item]
        self.procurement_needs: dict[str, list[ProcurementNeed]] = {}  # org_id -> list[Need]
        self.offers: dict[str, list[Offer]] = {}  # org_id -> list[Offer]
        self.group_orders: dict[str, GroupOrder] = {}  # group_order_id -> GroupOrder
        self.group_order_members: dict[str, dict[str, GroupOrderMember]] = {}  # group_order_id -> (org_id -> Member)
        self.supplier_opportunities: dict[str, SupplierOpportunity] = {}
        self.approvals: dict[str, list[Approval]] = {}
        self.agent_runs: dict[str, AgentRunRecord] = {}
        self.idempotency_cache: dict[str, ConfirmationResponse] = {}

        self._seed_baseline_data()

    def _seed_baseline_data(self):
        now = datetime.now(timezone.utc)
        m_org = "merchant-berrechid"
        s_org = "supplier-atlas"

        # 1. Profiles & Organizations
        self.profiles["demo-merchant"] = Profile(
            user_id="demo-merchant",
            display_name="Demo Merchant",
            email="merchant.demo@example.com",
            primary_organization_id=m_org,
        )
        self.profiles["demo-supplier"] = Profile(
            user_id="demo-supplier",
            display_name="Demo Supplier",
            email="supplier.demo@example.com",
            primary_organization_id=s_org,
        )

        self.organizations[m_org] = Organization(
            organization_id=m_org,
            name="Grocery Store Berrechid",
            type="MERCHANT",
            city="Berrechid",
            coarse_area="Berrechid Center",
        )
        self.organizations[s_org] = Organization(
            organization_id=s_org,
            name="Atlas Wholesale Supplier",
            type="SUPPLIER",
            city="Berrechid",
            coarse_area="Berrechid Center",
        )

        # 2. Canonical Products
        oil_prod = CanonicalProduct(
            product_id="cooking-oil-1l",
            canonical_name="Cooking oil 1L",
            category="GROCERY",
            base_unit="BOTTLE",
            aliases=["huile 1l", "oil 1 litre", "زيت 1 لتر"],
        )
        sugar_prod = CanonicalProduct(
            product_id="sugar-1kg",
            canonical_name="Sugar 1kg",
            category="GROCERY",
            base_unit="BAG",
            aliases=["sucre 1kg", "sugar 1 kilogram", "سكر 1 كلغ"],
        )
        self.products["cooking-oil-1l"] = oil_prod
        self.products["sugar-1kg"] = sugar_prod

        # 3. Inventory Items
        self.inventory_items[m_org] = {
            "cooking-oil-1l": InventoryItem(
                organization_id=m_org,
                product_id="cooking-oil-1l",
                display_name="Cooking oil 1L",
                unit="BOTTLE",
                quantity_on_hand=14.0,
                average_daily_sales=3.5,
                target_stock_quantity=34.0,
                low_stock_threshold=20.0,
                status="LOW_STOCK",
            ),
            "sugar-1kg": InventoryItem(
                organization_id=m_org,
                product_id="sugar-1kg",
                display_name="Sugar 1kg",
                unit="BAG",
                quantity_on_hand=35.0,
                average_daily_sales=2.0,
                target_stock_quantity=40.0,
                low_stock_threshold=15.0,
                status="HEALTHY",
            ),
        }

        # Also populate fallback legacy store products for compatibility
        self.legacy_products = {
            m_org: {
                "cooking_oil_1l": Product(
                    product_id="cooking_oil_1l",
                    organization_id=m_org,
                    name="Cooking oil 1L",
                    unit="bottle",
                    quantity_on_hand=14,
                    reorder_threshold=20,
                    selling_price_centimes=2500,
                ),
                "sugar_1kg": Product(
                    product_id="sugar_1kg",
                    organization_id=m_org,
                    name="Sugar 1kg",
                    unit="bag",
                    quantity_on_hand=35,
                    reorder_threshold=15,
                    selling_price_centimes=1000,
                ),
            }
        }

        # 4. Supplier Catalog Items
        self.catalog_items[s_org] = [
            SupplierCatalogItem(
                catalog_item_id="cat-oil-retail",
                organization_id=s_org,
                product_id="cooking-oil-1l",
                supplier_sku="ATL-OIL-1L-RET",
                unit="BOTTLE",
                unit_price_centimes=2200,  # 22.00 MAD
                minimum_quantity=10.0,
                available_quantity=500.0,
                delivery_fee_centimes=3000,  # 30 MAD
                delivery_days=1,
            ),
            SupplierCatalogItem(
                catalog_item_id="cat-oil-bulk",
                organization_id=s_org,
                product_id="cooking-oil-1l",
                supplier_sku="ATL-OIL-1L-BLK",
                unit="BOTTLE",
                unit_price_centimes=1850,  # 18.50 MAD
                minimum_quantity=50.0,
                available_quantity=2000.0,
                delivery_fee_centimes=0,
                delivery_days=1,
            ),
        ]
        self.catalog_items["supplier-chawia"] = [
            SupplierCatalogItem(
                catalog_item_id="cat-oil-mid",
                organization_id="supplier-chawia",
                product_id="cooking-oil-1l",
                supplier_sku="CHW-OIL-1L-MID",
                unit="BOTTLE",
                unit_price_centimes=2100,  # 21.00 MAD
                minimum_quantity=25.0,
                available_quantity=800.0,
                delivery_fee_centimes=1500,
                delivery_days=2,
            )
        ]

        # 5. Procurement Needs
        need_001 = ProcurementNeed(
            need_id="need-oil-001",
            organization_id=m_org,
            product_id="cooking-oil-1l",
            unit="BOTTLE",
            quantity_needed=20.0,
            stock_on_hand=14.0,
            average_daily_sales=3.5,
            days_remaining=4,
            target_stock_quantity=34.0,
            status="OPEN",
            coarse_area="Berrechid Center",
            stockout_at=now + timedelta(days=4),
            needed_by=now + timedelta(days=4),
        )
        self.procurement_needs[m_org] = [need_001]

        # 6. Supplier Offers
        self.offers[m_org] = [
            Offer(
                offer_id="off-oil-001",
                organization_id=m_org,
                procurement_need_id="need-oil-001",
                supplier_organization_id=s_org,
                catalog_item_id="cat-oil-retail",
                product_id="cooking-oil-1l",
                unit="BOTTLE",
                requested_quantity=20.0,
                unit_price_centimes=2200,
                minimum_quantity=10.0,
                delivery_fee_centimes=3000,
                landed_cost_centimes=47000,  # 20 * 2200 + 3000
                eligible_alone=True,
                affordable=True,
                status="AVAILABLE_NOW",
            ),
            Offer(
                offer_id="off-oil-002",
                organization_id=m_org,
                procurement_need_id="need-oil-001",
                supplier_organization_id=s_org,
                catalog_item_id="cat-oil-bulk",
                product_id="cooking-oil-1l",
                unit="BOTTLE",
                requested_quantity=20.0,
                unit_price_centimes=1850,
                minimum_quantity=50.0,
                delivery_fee_centimes=0,
                landed_cost_centimes=37000,  # 20 * 1850
                eligible_alone=False,
                affordable=True,
                status="GROUP_ONLY",
                rejection_reasons=["Minimum order quantity 50 not met by single merchant demand 20"],
            ),
        ]

        # 7. Group Order & Members
        go_id = "go-oil-001"
        self.group_orders[go_id] = GroupOrder(
            group_order_id=go_id,
            product_id="cooking-oil-1l",
            unit="BOTTLE",
            supplier_organization_id=s_org,
            supplier_catalog_item_id="cat-oil-bulk",
            status="PROPOSED",
            total_quantity=55.0,  # 20 (current) + 35 (partners)
            minimum_quantity=50.0,
            unit_price_centimes=1850,
            delivery_total_centimes=0,
            participant_organization_ids=[m_org, "merchant-chawia-grocery", "merchant-berrechid-snack"],
            coarse_area="Berrechid Center",
            join_deadline=now + timedelta(days=2),
            needed_by=now + timedelta(days=4),
        )

        self.group_order_members[go_id] = {
            m_org: GroupOrderMember(
                organization_id=m_org,
                procurement_need_id="need-oil-001",
                quantity=20.0,
                status="JOINED",
                original_unit_price_centimes=2200,
                collective_unit_price_centimes=1850,
                original_delivery_centimes=3000,
                collective_delivery_share_centimes=0,
                product_saving_centimes=7000,  # (2200 - 1850) * 20 = 70 MAD = 7000 centimes
                delivery_saving_centimes=3000,  # 30 MAD = 3000 centimes
                total_saving_centimes=10000,  # 100 MAD = 10000 centimes
            )
        }

        # 8. Supplier Opportunity
        self.supplier_opportunities["opp-oil-001"] = SupplierOpportunity(
            opportunity_id="opp-oil-001",
            product_id="cooking-oil-1l",
            unit="BOTTLE",
            total_quantity=55.0,
            coarse_area="Berrechid Center",
            merchant_count=3,
            status="ACTIVE",
            needed_by=now + timedelta(days=4),
            source_group_order_id=go_id,
        )

        # 9. Agent Run & Tool Calls
        self.agent_runs["run-001"] = AgentRunRecord(
            agent_run_id="run-001",
            organization_id=m_org,
            provider="fixture",
            model=None,
            status="SUCCEEDED",
            fallback_used=False,
            duration_ms=180,
            tool_calls=[
                ToolCallRecord(
                    tool_call_id="tc-001",
                    organization_id=m_org,
                    sequence=1,
                    name="inspect_evidence",
                    status="SUCCEEDED",
                    duration_ms=45,
                    input_summary="Processed receipt image",
                    output_summary="Validated 2 line items",
                ),
                ToolCallRecord(
                    tool_call_id="tc-002",
                    organization_id=m_org,
                    sequence=2,
                    name="forecast_stockout",
                    status="SUCCEEDED",
                    duration_ms=60,
                    input_summary="Calculated cooking oil sales rate",
                    output_summary="4 days remaining; 20 units recommended",
                ),
            ],
        )

    # --- Data Access Methods ---

    def get_profile(self, user_id: str) -> Profile | None:
        return self.profiles.get(user_id)

    def get_organization(self, org_id: str) -> Organization | None:
        return self.organizations.get(org_id)

    def get_products(self, organization_id: str) -> list[Product]:
        # Return fallback products for compatibility
        return list(self.legacy_products.get(organization_id, {}).values())

    def update_product_stock(self, organization_id: str, product_id: str, name: str, unit: str, delta: int):
        if organization_id not in self.legacy_products:
            self.legacy_products[organization_id] = {}
        org_prods = self.legacy_products[organization_id]
        if product_id not in org_prods:
            org_prods[product_id] = Product(
                product_id=product_id,
                organization_id=organization_id,
                name=name,
                unit=unit,
                quantity_on_hand=max(0, delta),
            )
        else:
            p = org_prods[product_id]
            p.quantity_on_hand = max(0, p.quantity_on_hand + delta)

    def save_ingestion(self, ingestion: IngestionResponse):
        self.ingestions[ingestion.id] = ingestion

    def get_ingestion(self, ingestion_id: str, organization_id: str) -> IngestionResponse | None:
        ing = self.ingestions.get(ingestion_id)
        if ing and ing.organization_id == organization_id:
            return ing
        return None

    def save_transaction(self, transaction: Transaction):
        if transaction.organization_id not in self.transactions:
            self.transactions[transaction.organization_id] = {}
        self.transactions[transaction.organization_id][transaction.id] = transaction

    def list_transactions(self, organization_id: str) -> list[Transaction]:
        return list(self.transactions.get(organization_id, {}).values())

    def get_dashboard(self, organization_id: str) -> DashboardResponse:
        txns = self.list_transactions(organization_id)
        sales = sum(t.total_centimes for t in txns if t.kind == "sale")
        purchases = sum(t.total_centimes for t in txns if t.kind == "purchase")
        expenses = sum(t.total_centimes for t in txns if t.kind == "expense")
        total_expenses = purchases + expenses

        if sales == 0 and total_expenses == 0:
            sales = 1250000
            total_expenses = 830000

        estimated_profit = sales - total_expenses
        available_cash = 610000 + estimated_profit

        products = self.get_products(organization_id)
        low_stock_items = [p for p in products if p.quantity_on_hand <= p.reorder_threshold]

        alerts = []
        if low_stock_items:
            alerts.append(
                DashboardAlert(
                    code="stockout_soon",
                    message=f"{low_stock_items[0].name} may run out soon. Current stock: {low_stock_items[0].quantity_on_hand} units.",
                )
            )

        return DashboardResponse(
            kpis=DashboardKPIs(
                sales_centimes=sales,
                expenses_centimes=total_expenses,
                estimated_profit_centimes=estimated_profit,
                available_cash_centimes=available_cash,
            ),
            inventory=InventorySummary(
                product_count=len(products),
                low_stock_count=len(low_stock_items),
            ),
            alerts=alerts,
            next_action=DashboardNextAction(
                code="review_procurement_need",
                label="Review a safe reorder of 20 units",
                target_id="need-oil-001",
            ),
        )

    def get_supplier_dashboard(self, organization_id: str) -> SupplierDashboardResponse:
        catalogs = self.catalog_items.get(organization_id, [])
        opps = list(self.supplier_opportunities.values())

        return SupplierDashboardResponse(
            kpis=SupplierDashboardKPIs(
                active_catalog_items=len(catalogs),
                active_demand_opportunities=len(opps),
                total_potential_volume=sum(o.total_quantity for o in opps),
                estimated_revenue_centimes=101750,
            ),
            opportunities=opps,
        )


db_store = DataStore()
