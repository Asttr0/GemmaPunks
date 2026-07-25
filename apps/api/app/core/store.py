from datetime import datetime, timezone
from app.modules.businesses.schemas import (
    DashboardAlert,
    DashboardKPIs,
    DashboardNextAction,
    DashboardResponse,
    InventorySummary,
)
from app.modules.ingestion.schemas import ConfirmationResponse, IngestionResponse
from app.modules.inventory.schemas import InventoryItemResponse, Product
from app.modules.transactions.schemas import Transaction, TransactionLine


class DataStore:
    """Thread-safe in-memory repository for MIZAN Souq entities scoped by organization_id."""

    def __init__(self):
        self.ingestions: dict[str, IngestionResponse] = {}
        self.transactions: dict[str, Transaction] = {}
        self.products: dict[str, dict[str, Product]] = {}
        self.idempotency_cache: dict[str, ConfirmationResponse] = {}
        self._seed_default_data()

    def _seed_default_data(self):
        default_org = "org_berrechid_grocery"
        self.products[default_org] = {
            "cooking_oil_1l": Product(
                product_id="cooking_oil_1l",
                organization_id=default_org,
                name="Cooking oil 1L",
                unit="bottle",
                quantity_on_hand=14,
                reorder_threshold=20,
                selling_price_centimes=2500,
            ),
            "sugar_1kg": Product(
                product_id="sugar_1kg",
                organization_id=default_org,
                name="Sugar 1kg",
                unit="bag",
                quantity_on_hand=35,
                reorder_threshold=15,
                selling_price_centimes=1000,
            ),
        }

        txn_id = "txn_seed_001"
        self.transactions[txn_id] = Transaction(
            id=txn_id,
            organization_id=default_org,
            kind="sale",
            currency="MAD",
            total_centimes=1250000,
            lines=[
                TransactionLine(
                    line_id="line_seed_001",
                    product_id="cooking_oil_1l",
                    product_name="Cooking oil 1L",
                    quantity=50,
                    unit_price_centimes=2500,
                    line_total_centimes=1250000,
                )
            ],
            occurred_at=datetime.now(timezone.utc),
        )

    def save_ingestion(self, ingestion: IngestionResponse):
        self.ingestions[ingestion.id] = ingestion

    def get_ingestion(self, ingestion_id: str, organization_id: str) -> IngestionResponse | None:
        ing = self.ingestions.get(ingestion_id)
        if ing and ing.organization_id == organization_id:
            return ing
        return None

    def save_transaction(self, transaction: Transaction):
        self.transactions[transaction.id] = transaction

    def list_transactions(self, organization_id: str) -> list[Transaction]:
        return [
            t for t in self.transactions.values()
            if t.organization_id == organization_id
        ]

    def get_products(self, organization_id: str) -> list[Product]:
        org_products = self.products.get(organization_id, {})
        return list(org_products.values())

    def update_product_stock(self, organization_id: str, product_id: str, name: str, unit: str, delta: int):
        if organization_id not in self.products:
            self.products[organization_id] = {}

        org_prods = self.products[organization_id]
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
                target_id="need_001",
            ),
        )


db_store = DataStore()
