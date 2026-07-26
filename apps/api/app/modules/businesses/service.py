from datetime import UTC, datetime

from app.core.business_repository import BusinessRepository
from app.modules.businesses.schemas import (
    DashboardAlert,
    DashboardKPIs,
    DashboardNextAction,
    DashboardResponse,
    InventorySummary,
    SupplierDashboardKPIs,
    SupplierDashboardResponse,
)


def build_merchant_dashboard(
    repository: BusinessRepository,
    organization_id: str,
) -> DashboardResponse:
    organization = repository.get_organization(organization_id)
    if organization is None:
        raise LookupError("Organization not found")

    transactions = repository.list_transactions(organization_id)
    inventory = repository.list_inventory_items(organization_id)
    open_needs = [
        need for need in repository.list_procurement_needs(organization_id) if need.status == "OPEN"
    ]

    sales = sum(item.total_centimes for item in transactions if item.kind == "sale")
    expenses = sum(
        item.total_centimes for item in transactions if item.kind in {"purchase", "expense"}
    )
    estimated_profit = sales - expenses
    available_cash = max(0, organization.opening_cash_centimes + estimated_profit)

    low_stock_items = [item for item in inventory if item.status in {"LOW_STOCK", "OUT_OF_STOCK"}]
    alerts: list[DashboardAlert] = []
    for item in low_stock_items:
        if item.status == "OUT_OF_STOCK":
            message = f"{item.display_name} is out of stock."
        elif item.average_daily_sales and item.average_daily_sales > 0:
            days_remaining = max(
                0,
                int(item.quantity_on_hand / item.average_daily_sales + 0.999999),
            )
            message = (
                f"{item.display_name} may run out in about {days_remaining} days. "
                f"Current stock: {item.quantity_on_hand:g} {item.unit.lower()}."
            )
        else:
            message = (
                f"{item.display_name} is below its low-stock threshold. "
                "More sales history is needed for a stockout date."
            )
        alerts.append(DashboardAlert(code="stockout_soon", message=message))

    next_action = None
    if open_needs:
        need = min(open_needs, key=lambda item: item.needed_by)
        next_action = DashboardNextAction(
            code="review_procurement_need",
            label=f"Review a safe reorder of {need.quantity_needed:g} {need.unit.lower()}",
            target_id=need.need_id,
        )
    elif low_stock_items:
        next_action = DashboardNextAction(
            code="generate_procurement_need",
            label=f"Calculate a safe reorder for {low_stock_items[0].display_name}",
            target_id=low_stock_items[0].product_id,
        )

    return DashboardResponse(
        kpis=DashboardKPIs(
            sales_centimes=sales,
            expenses_centimes=expenses,
            estimated_profit_centimes=estimated_profit,
            available_cash_centimes=available_cash,
        ),
        inventory=InventorySummary(
            product_count=len(inventory),
            low_stock_count=len(low_stock_items),
        ),
        alerts=alerts,
        next_action=next_action,
        generated_at=datetime.now(UTC),
    )


def build_supplier_dashboard(
    repository: BusinessRepository,
    organization_id: str,
) -> SupplierDashboardResponse:
    catalog = [
        item
        for item in repository.list_catalog_items()
        if item.organization_id == organization_id and item.status == "ACTIVE"
    ]
    opportunities = [
        opportunity
        for opportunity in repository.list_supplier_opportunities(organization_id)
        if opportunity.status in {"ACTIVE", "QUOTED"}
    ]
    price_by_product = {
        item.product_id: min(
            candidate.unit_price_centimes
            for candidate in catalog
            if candidate.product_id == item.product_id
        )
        for item in catalog
    }
    estimated_revenue = sum(
        int(opportunity.total_quantity * price_by_product.get(opportunity.product_id, 0))
        for opportunity in opportunities
    )
    return SupplierDashboardResponse(
        kpis=SupplierDashboardKPIs(
            active_catalog_items=len(catalog),
            active_demand_opportunities=len(opportunities),
            total_potential_volume=sum(opportunity.total_quantity for opportunity in opportunities),
            estimated_revenue_centimes=estimated_revenue,
        ),
        opportunities=opportunities,
    )
