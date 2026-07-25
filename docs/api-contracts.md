# MIZAN Souq API Contracts & Endpoint Inventory

The complete REST API endpoint documentation, request/response JSON examples, header requirements, and centime financial rules are available in [the API Endpoints Guide](api-endpoints.md).

For step-by-step authentication, ingestion sequences, and MCD relationship mappings, refer to [the Backend Guide](anas-backend-handoff.md) and [the Database Guide](database-guide.md).

---

## Endpoint Summary

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login` — Authenticate user and retrieve profile & organization context.
- `POST /api/v1/auth/signup` — Register a new merchant or supplier organization.
- `GET /api/v1/auth/me` — Return current authenticated user context.

### Evidence Ingestion (`/api/v1/ingestions`)
- `POST /api/v1/ingestions` — Upload receipt or audio evidence file to generate a reviewable draft.
- `GET /api/v1/ingestions/{id}` — Fetch ingestion job status and extraction draft.
- `POST /api/v1/ingestions/{id}/confirm` — Confirm corrected draft, recalculate centimes, create transactions, and update stock.

### Merchant Dashboard, Transactions & Inventory
- `GET /api/v1/merchant/dashboard` — Fetch merchant KPIs (`sales_centimes`, `expenses_centimes`, `estimated_profit_centimes`, `available_cash_centimes`), inventory metrics, stockout alerts, and next action recommendations.
- `GET /api/v1/transactions` — List confirmed sales, purchases, and expenses.
- `GET /api/v1/inventory` — List current stock on hand, low-stock flags, and predicted stockout dates.

### Procurement Engine
- `POST /api/v1/procurement-needs/generate` — Calculate sales rate and generate a procurement restocking need.
- `GET /api/v1/procurement-needs` — List open procurement needs for the merchant.
- `GET /api/v1/suppliers/search` — Search supplier catalog items matching product criteria.
- `POST /api/v1/offers/compare` — Evaluate supplier offers, landed costs (`unit_price * qty + delivery`), MOQs, and group-order opportunities.

### Group Orders & Collective Purchasing (`/api/v1/group-orders`)
- `GET /api/v1/group-orders` — List collective purchasing proposals.
- `POST /api/v1/group-orders/propose` — Combine compatible merchant demand (`20 + 35 = 55` units) to unlock bulk pricing and savings.
- `POST /api/v1/group-orders/{id}/join` — Join an open collective order proposal.
- `POST /api/v1/group-orders/{id}/approve` — Approve final participation in a collective order.

### Supplier Portal & Catalogs
- `GET /api/v1/supplier/dashboard` — Fetch supplier KPIs and demand opportunities.
- `GET /api/v1/supplier/opportunities` — Fetch safe aggregated demand opportunities.
- `POST /api/v1/supplier/offers` — Submit a competitive quote for an aggregated demand opportunity.
- `GET /api/v1/supplier/catalogs` — List published catalog items.
- `POST /api/v1/supplier/catalogs` — Publish a new product catalog item.

### Agent Audit Timeline (`/api/v1/agent-runs`)
- `GET /api/v1/agent-runs/{id}` — Fetch human-verifiable agent execution timeline and tool-call records.
