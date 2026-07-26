# MIZAN Souq frontend interfaces

> Status: Frontend implementation contract  
> Scope: Hackathon web application  
> Priority: Finish the complete P0 demo journey before starting P1 work

This document tells the frontend team what screens to build, how users move
between them, which backend endpoint supplies each screen, and which shared
components must be reused.

The visual source of truth remains [`design-system.md`](./design-system.md).
The application is light-only, desktop-first, readable on a projector, and
uses the MIZAN blue palette. AI drafts use violet. Confirmed business data uses
the normal blue and neutral styles.

## 1. Priority meanings

- **P0:** Required for the live hackathon demo.
- **P1:** Useful after the complete P0 journey works reliably.
- **System state:** Not a separate feature, but every relevant screen must
  support it.

## 2. Complete route inventory

### 2.1 Public and shared routes

| Priority | Route                     | Interface        | Main purpose                                                            | Backend                                                           |
| -------- | ------------------------- | ---------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| P0       | `/login`                  | Sign in          | Sign in with email and password or use a seeded demo account            | Firebase Authentication, then `GET /api/v1/auth/me`               |
| P0       | `/register`               | Create account   | Create a Firebase user and register a merchant or supplier organization | Firebase Authentication, then `POST /api/v1/auth/signup`          |
| P0       | `/app`                    | Role redirect    | Send the signed-in user to the correct portal                           | Uses the organization type from `GET /api/v1/auth/me`             |
| P0       | `/agent-runs/:agentRunId` | Agent activity   | Show Gemma and deterministic tool activity in time order                | `GET /api/v1/agent-runs/{id}`                                     |
| P0       | `/demo/impact`            | Final impact     | End the demo with savings and stockout-prevention results               | Uses data already returned by dashboard and group-order endpoints |
| P1       | `/settings`               | Account settings | Show basic profile, organization, and sign-out controls                 | `GET /api/v1/auth/me`                                             |

The login page is the only page shown before authentication. Normal users do
not switch between merchant and supplier tabs. Their organization type decides
which portal they can open.

For the demo, an account-menu action may sign out and sign in to the other
seeded account. It must use real authentication and must not change the role
only in browser state.

### 2.2 Merchant routes

| Priority | Route                                  | Interface                 | Main purpose                                                                                      | Backend                                                                                                                                 |
| -------- | -------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | `/merchant/dashboard`                  | Merchant overview         | Show sales, expenses, estimated profit, available cash, stock risk, and the next action           | `GET /api/v1/merchant/dashboard`; optionally `GET /api/v1/transactions` for a short trend                                               |
| P0       | `/merchant/evidence/new`               | Add evidence              | Upload a receipt, voice note, ledger, or screenshot without changing official records             | `POST /api/v1/ingestions`                                                                                                               |
| P0       | `/merchant/ingestions/:ingestionId`    | Extraction review         | Show the source beside the AI draft, answer one clarification, edit uncertain fields, and confirm | `GET /api/v1/ingestions/{id}` and `POST /api/v1/ingestions/{id}/confirm`                                                                |
| P0       | `/merchant/inventory`                  | Inventory                 | Show stock on hand, low-stock status, and predicted stockout dates                                | `GET /api/v1/inventory`                                                                                                                 |
| P0       | `/merchant/procurement/:needId`        | Procurement cockpit       | Show the forecast, compare supplier offers, explain tradeoffs, and propose a collective order     | `GET /api/v1/procurement-needs`, `GET /api/v1/suppliers/search`, `POST /api/v1/offers/compare`, and `POST /api/v1/group-orders/propose` |
| P0       | `/merchant/group-orders/:groupOrderId` | Collective-order decision | Show the merchant's quantity and savings, then keep Join and Approve as separate actions          | `GET /api/v1/group-orders`, `POST /api/v1/group-orders/{id}/join`, and `POST /api/v1/group-orders/{id}/approve`                         |
| P1       | `/merchant/transactions`               | Transaction history       | Browse confirmed sales, purchases, and expenses                                                   | `GET /api/v1/transactions`                                                                                                              |
| P1       | `/merchant/procurement`                | Procurement needs         | Browse all open, matched, ordered, and cancelled needs                                            | `GET /api/v1/procurement-needs`; create with `POST /api/v1/procurement-needs/generate`                                                  |
| P1       | `/merchant/group-orders`               | Group-order history       | Browse the merchant's collective-order proposals and statuses                                     | `GET /api/v1/group-orders`                                                                                                              |

The procurement cockpit is intentionally one focused P0 screen. The forecast,
supplier comparison, and group-order proposal belong to one decision. Splitting
them into several small screens would slow down the demo.

### 2.3 Supplier routes

| Priority | Route                                    | Interface             | Main purpose                                                                                                | Backend                                                                    |
| -------- | ---------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| P0       | `/supplier/dashboard`                    | Supplier overview     | Show active catalog items, qualified demand, potential volume, estimated revenue, and current opportunities | `GET /api/v1/supplier/dashboard`                                           |
| P0       | `/supplier/opportunities`                | Demand opportunities  | Show aggregated demand without exposing merchant-private information                                        | `GET /api/v1/supplier/opportunities`                                       |
| P0       | `/supplier/opportunities/:opportunityId` | Opportunity and quote | Explain one demand opportunity and let the supplier submit an offer                                         | Read from the cached opportunity list, then `POST /api/v1/supplier/offers` |
| P1       | `/supplier/catalog`                      | Supplier catalog      | Browse catalog items and add a product offer                                                                | `GET /api/v1/supplier/catalogs` and `POST /api/v1/supplier/catalogs`       |
| P1       | `/supplier/offers`                       | Offers and orders     | Browse submitted and accepted offers                                                                        | A list endpoint does not exist yet; do not invent production data          |

There is no supplier-opportunity detail endpoint. The P0 detail page should
find the selected opportunity in TanStack Query's cached opportunity list. If
the page is refreshed and the cache is empty, fetch the list again and select
the matching ID.

## 3. Navigation model

### 3.1 Shared shell

All authenticated pages use one application shell:

- A persistent 240–264 px sidebar on desktop.
- A top bar with the page name, organization context, and account menu.
- A sidebar drawer at narrower widths.
- A maximum main-content width of 1600 px.
- A visible page heading at the start of every route.

The shell uses the same spacing, typography, cards, and controls for merchants
and suppliers. Supplier cyan is only a small context accent, not a different
theme.

### 3.2 Merchant navigation

1. Overview
2. Add evidence
3. Inventory
4. Procurement
5. Group orders
6. Transactions — P1

`Add evidence` is the most prominent navigation action because it starts the
main demo journey.

### 3.3 Supplier navigation

1. Overview
2. Opportunities
3. Catalog — P1
4. Offers — P1 and blocked until a list endpoint exists

### 3.4 Shared navigation actions

- Account and organization information.
- Sign out.
- Switch demo account, only for the hackathon demo.
- Agent activity when a related run ID is available.
- Settings — P1.

## 4. Main screen content

### 4.1 Login

Required content:

- MIZAN Souq text wordmark.
- Email and password fields.
- Sign-in action.
- Demo merchant and demo supplier actions.
- Link to registration.

The page may use one restrained blue gradient. It must not show application
navigation before authentication.

### 4.2 Merchant dashboard

Display information in this order:

1. Four KPI cards: sales, expenses, estimated profit, and available cash.
2. Recommended next action.
3. Stockout warning.
4. Short sales or profit summary.
5. Recent confirmed activity when data is available.

Do not invent a chart series. A small seven-day series may be calculated from
the transaction list. Otherwise show a clear text summary from the dashboard
response.

### 4.3 Add evidence

Required content:

- Evidence type: receipt, audio, ledger, or screenshot.
- Drag-and-drop area and file picker.
- Accepted formats and size limit.
- File preview or audio metadata.
- Upload progress.
- A visible message: uploading creates a draft and does not change official
  records.

After a successful upload, navigate to the extraction review using the returned
ingestion ID.

### 4.4 Extraction review

Required content:

- Original evidence preview.
- Extraction status.
- AI Draft badge in violet.
- Editable transaction type and line items.
- Confidence and uncertain-field labels.
- One clarification question at a time.
- Recalculated totals shown in MAD.
- A visible warning that inventory changes only after confirmation.
- Separate edit and confirm actions.

The page represents a state machine:

`PROCESSING → NEEDS_REVIEW → CONFIRMED`

It must also support `FAILED` and `REJECTED`.

Confirmation is consequential. Generate one idempotency key for the user's
confirmation attempt and reuse it if the same request is retried. Do not show
the transaction or stock as confirmed before the backend returns success.

### 4.5 Inventory

Required content:

- Product name.
- Quantity on hand and unit.
- Healthy, low-stock, or out-of-stock status.
- Low-stock threshold.
- Predicted stockout date when one exists.
- Clear action to create or review a procurement need.

Do not depend on color alone. A low-stock row needs an icon and text.

### 4.6 Procurement cockpit

Required content:

- Current stock.
- Average daily sales.
- Estimated days remaining.
- Recommended reorder quantity.
- Exact supplier price, MOQ, delivery fee, landed cost, affordability, and
  expected margin when available.
- Clear separation between offers available to one merchant and offers that
  require a group.
- A plain-language explanation for the recommendation.
- Action to propose the collective order.

The recommendation may use violet to show AI assistance. Prices and
calculations remain normal business data and must be readable without the AI
explanation.

### 4.7 Collective-order decision

Required content:

- Merchant's own quantity.
- Total combined quantity.
- Supplier minimum quantity.
- Anonymized participant count.
- Original unit price and collective unit price.
- Product saving, delivery saving, and total saving.
- Conditions, needed-by date, and join deadline.
- Separate Join and Approve actions.

Joining does not mean approval. The interface must show the current member
status as `PENDING`, `JOINED`, `APPROVED`, or `DECLINED`.

### 4.8 Supplier dashboard and opportunities

Required content:

- Active catalog-item count.
- Active demand-opportunity count.
- Total potential volume.
- Estimated revenue.
- Aggregated product demand.
- Coarse location only.
- Merchant count without names or private business details.
- Action to review and quote an opportunity.

### 4.9 Supplier quote

Required content:

- Product and requested quantity.
- Coarse service area.
- Number of participating merchants.
- Needed-by date.
- Catalog item.
- Unit price in MAD.
- Minimum quantity.
- Calculated estimated revenue.
- Submit-offer action.

### 4.10 Agent activity

Required content:

- Provider, model, status, duration, and fallback status.
- Tool calls in chronological order.
- Running, succeeded, warning, and failed states.
- Input and output summaries.
- Expandable technical details when available.

Violet is used only for Gemma reasoning, draft creation, and tool selection.
Deterministic tool results use normal semantic colors. Raw JSON must not be
open by default.

### 4.11 Final impact

Show no more than five large results:

1. Total merchant saving.
2. Stockout prevented.
3. Original unit price.
4. Collective unit price.
5. Expected additional margin or combined delivery saving.

The screen may use one restrained animated reveal and one subtle gradient. The
closing line must be readable from a projector:

> One small shop has little negotiating power. A network of small shops has a
> market.

## 5. Required states

Every API-driven screen must consider:

| State           | Required behavior                                               |
| --------------- | --------------------------------------------------------------- |
| Initial loading | Use a skeleton matching the final page shape                    |
| Empty           | Explain why there is no data and offer one useful next action   |
| Error           | Say what failed and provide a retry action when safe            |
| Unauthorized    | Return to login without exposing protected data                 |
| Forbidden       | Explain that the current organization cannot open this portal   |
| Offline         | Keep the current view visible and show a connection warning     |
| Submitting      | Disable repeated submission and keep the action label readable  |
| Success         | Update the visible page; a toast may provide secondary feedback |
| Reduced motion  | Remove large movement and nonessential autoplay                 |

Specific state requirements:

- Ingestion: `PROCESSING`, `NEEDS_REVIEW`, `CONFIRMED`, `REJECTED`, and
  `FAILED`.
- Procurement needs: `OPEN`, `MATCHED`, `ORDERED`, and `CANCELLED`.
- Offers: `AVAILABLE_NOW`, `GROUP_ONLY`, and `REJECTED`.
- Group members: `PENDING`, `JOINED`, `APPROVED`, and `DECLINED`.
- Inventory: `HEALTHY`, `LOW_STOCK`, and `OUT_OF_STOCK`.
- Supplier opportunities: `ACTIVE`, `QUOTED`, `CLOSED`, and `ARCHIVED`.
- Agent runs: `RUNNING`, `SUCCEEDED`, and `FAILED`.

## 6. Shared components

### 6.1 Primitive components

Primitive components live in `apps/web/src/components/ui/`:

- `Button`
- `Card`
- `Badge`
- `Input`
- `Textarea`
- `Select`
- `Dialog`
- `AlertDialog`
- `Sheet`
- `Tabs`
- `Table`
- `Skeleton`
- `Progress`
- `Tooltip`
- `DropdownMenu`
- `Sidebar`
- `Collapsible`
- `Alert`

These components handle styling and accessibility. They must use the light
semantic tokens and Lucide icons.

### 6.2 Shared product components

Shared product components live in `apps/web/src/components/shared/`:

- `AppShell`
- `PageHeader`
- `MetricCard`
- `StatusBadge`
- `Money`
- `Quantity`
- `EmptyState`
- `ErrorState`
- `PageSkeleton`
- `AsyncBoundary`
- `DataTable`
- `ChartContainer`
- `EvidencePreview`
- `ConfidenceBadge`
- `DraftLineEditor`
- `ClarificationCard`
- `AgentTimeline`
- `StockRiskAlert`
- `ProcurementNeedSummary`
- `OfferComparison`
- `GroupOrderProgress`
- `SavingsBreakdown`
- `ApprovalDialog`
- `OpportunityCard`

Feature folders compose these components into pages. A feature must not create
another button, card, badge, table, dialog, toast, or chart system.

## 7. Frontend data rules

Use these simple ownership rules:

- **TanStack Query:** API and server state.
- **React Router:** route IDs and page/filter URLs.
- **React Hook Form and Zod:** editable drafts, registration, quotes, and
  consequential forms.
- **Local React state:** open dialogs and short-lived visual state.
- **Generated OpenAPI types:** request and response transport types.

No additional global state library is required.

The API client must:

- Add a valid Firebase ID token to every protected request.
- Let the browser set the multipart boundary for `FormData`.
- Parse FastAPI error messages.
- Support request cancellation.
- Add an idempotency key to confirmation and approval requests.
- Never send an `organization_id` chosen by the browser.

Important query invalidation:

- Confirm ingestion: refresh ingestion, transactions, inventory, and merchant
  dashboard.
- Generate or compare procurement: refresh procurement needs and comparisons.
- Propose, join, or approve a group order: refresh group orders, merchant
  dashboard, supplier opportunities, and supplier dashboard.
- Add a catalog item: refresh supplier catalog and supplier dashboard.
- Submit an offer: refresh supplier opportunities and supplier dashboard.

Do not use optimistic updates for draft confirmation or group-order approval.
Wait for the backend response.

## 8. Known backend contract gaps

### 8.1 Missing `agent_run_id`

The ingestion response currently contains:

- Ingestion ID.
- Organization ID.
- Status.
- Document.
- Draft.
- Error message.

It does **not** contain the related `agent_run_id`.

This means the frontend cannot reliably open
`/agent-runs/:runId` after uploading evidence. The backend contract should add:

```json
{
  "agent_run_id": "run-001"
}
```

to `IngestionResponse`, preferably as an optional field while an ingestion is
still processing.

Until this contract is fixed, do not guess a production run ID. For the
hackathon fixture only, the agent timeline may be embedded in the ingestion
page using a known seeded run, with the fallback clearly kept inside demo data.

### 8.2 Other current limitations

- Merchant dashboard has no chart series. Derive a small trend from confirmed
  transactions or show a text summary.
- Inventory has no product-history endpoint. Do not invent historical
  sparklines.
- Supplier opportunity has no detail endpoint. Select the item from the cached
  opportunity list.
- Supplier offers have no list endpoint. Keep the offers-history page at P1.
- Supplier dashboard has no time-series data. Use KPI and opportunity
  information only.

## 9. Implementation order

Build in this order:

1. Replace the temporary dark tokens with the approved light MIZAN tokens.
2. Build the UI primitives and shared formatters.
3. Add the router, application providers, route guards, and role-aware shell.
4. Finish login and registration.
5. Add the typed API client, query keys, feature hooks, and shared async states.
6. Build the merchant dashboard.
7. Build the complete ingestion path: upload, processing, review,
   clarification, confirmation, and refreshed dashboard/inventory.
8. Build inventory, the procurement cockpit, and collective-order approval.
9. Build supplier dashboard, opportunities, and quote submission.
10. Build the agent timeline and final impact screen.
11. Rehearse and stabilize the complete P0 demo.
12. Start P1 screens only after P0 works repeatedly in the shared deployment.

## 10. P0 completion test

P0 frontend work is complete only when this exact journey works:

```text
Sign in as merchant
→ upload receipt or voice evidence
→ watch extraction status
→ review and clarify the AI draft
→ explicitly confirm
→ see dashboard and inventory update
→ open the four-day stockout warning
→ compare supplier offers
→ propose a 55-unit collective order
→ join
→ explicitly approve
→ switch to the seeded supplier account
→ see the consolidated opportunity
→ open the final impact screen
```

Test the journey at 1440 px and 1024 px widths. It must also support keyboard
navigation, visible focus, reduced motion, loading states, and safe recovery
from API failures.
