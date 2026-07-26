# P0 backlog

Every issue below blocks or protects the live demo. The GitHub setup script
creates these issues with labels and acceptance criteria.

## Foundation

### 1. Initialize monorepo and development commands

Owner: Lead and integration · Depends on: none

- React and FastAPI start with documented commands.
- Fixture mode works without cloud credentials.
- `.env.example` contains every required variable and no secrets.

### 2. Configure CI and protected `main` workflow

Owner: Lead and integration · Depends on: #1

- Frontend and backend checks run on every PR; #6 adds Contract CI when the
  first contract is frozen.
- PR review, resolved conversations, linear history, and passing checks are
  required on `main`.
- Force pushes and branch deletion are blocked; squash is the merge strategy.

### 3. Configure shared deployment environments

Owner: Lead and integration · Depends on: #1

- Vercel web and Railway API placeholders are public and health-checked.
- Production CORS and environment settings are documented.
- No service-account material appears in build logs or source.

### 4. Create Firebase project, emulators, and environment template

Owner: Asttr0 — Firebase owner · Depends on: #1

- Auth and Firestore are enabled; Cloud Storage is intentionally disabled.
- Local Emulator Suite starts from `firebase.json`.
- Web and API connect through environment variables.

### 5. Implement Firestore model, rules, indexes, and seed baseline

Owner: Asttr0 — Firebase owner · Depends on: #4

- P0 collections and organization-scoped paths exist.
- Firestore rules deny cross-organization access and Storage rules deny all
  access.
- Emulator rule tests cover same-organization reads, isolation, server-only
  writes, and supplier opportunities.
- Synthetic demo data loads into an empty emulator/project.

### 6. Freeze OpenAPI request and response examples

Owner: Lead and integration + Backend · Depends on: #5

- P0 endpoints have validated request/response schemas and examples.
- `packages/contracts/openapi.json` is generated from FastAPI.
- TypeScript types are generated and drift fails CI.

## Experiences

### 7. Build merchant dashboard shell

Owner: Merchant Experience · Depends on: #6

- Seeded KPIs, inventory health, and one actionable alert render.
- Currency uses MAD and the layout works at 375 px and desktop widths.
- Loading, empty, and error states are demonstrable.

### 8. Build evidence upload and draft review

Owner: Merchant Experience · Depends on: #6

- JPG, PNG, PDF, WAV, M4A, and MP3 validation is visible.
- Extracted lines, confidence, and one clarification question are reviewable.
- Inventory cannot update before explicit confirmation.

### 9. Build supplier dashboard shell

Owner: Supplier Experience · Depends on: #6

- Catalog, qualified demand, active offers, and revenue summary render.
- No merchant identity, exact sales, cash, or private financial data appears.
- Loading, empty, and error states are demonstrable.

### 10. Build collective-order decision interface

Owner: Supplier Experience · Depends on: #6

- Merchant sees own quantity, original and collective price, delivery share,
  savings, conditions, and deadline.
- Join and approve are separate explicit actions.
- Supplier sees only the consolidated opportunity.

## Business and AI path

### 11. Implement ingestion API and review lifecycle

Owner: Backend and Firebase · Depends on: #5

- Valid evidence creates a job and extraction draft.
- File type/size and Pydantic output validation are enforced.
- Confirmation creates auditable records and inventory movements atomically.

### 12. Implement transaction, inventory, and dashboard APIs

Owner: Backend and Firebase · Depends on: #5

- Confirmed transaction changes dashboard and stock exactly once.
- Every query is scoped by verified Firebase membership.
- Retry/idempotency and cross-organization tests pass.

### 13. Define AI provider interface and fixtures

Owner: Gemma and Procurement · Depends on: #6

- Fixture and hosted providers share one typed interface.
- Fixture returns the exact clarification and demo line items.
- Agent run and tool-call timeline are recorded.

### 14. Integrate Gemma multimodal extraction

Owner: Gemma and Procurement · Depends on: #13

- Known receipt and Darija/French audio yield a validated draft.
- Ambiguity produces one concise clarification.
- Timeout/failure switches safely to the fixture recovery path.

### 15. Implement deterministic stockout forecast

Owner: Gemma and Procurement + Backend · Depends on: #12

- Seeded oil stock produces a four-day warning and a 20-unit proposed need.
- Zero/negative demand and insufficient-history behavior is tested.
- Explanation cites the inputs without inventing certainty.

### 16. Implement supplier matching and offer comparison

Owner: Gemma and Procurement + Backend · Depends on: #12

- Three seeded offers rank by deterministic landed-cost criteria.
- MOQ, delivery, cash, and margin tradeoffs are visible.
- The explanation matches the actual ranking factors.

### 17. Implement collective-order matching

Owner: Gemma and Procurement + Backend · Depends on: #15, #16

- 20 merchant units plus 35 compatible units produce a 55-unit proposal.
- Product saving is 70 MAD, delivery saving is 30 MAD, total is 100 MAD.
- Participants approve independently and private demand stays isolated.

## Stabilization

### 18. Connect the complete vertical demo path

Owner: Lead and integration + all · Depends on: #7–#17

- The 16-step demo completes in the shared deployment.
- The agent/tool timeline is visible.
- A failed live AI call can continue through fixture mode.

### 19. Seed and reset deterministic demo scenario

Owner: Backend and Firebase + AI · Depends on: #12–#17

- One command resets Firebase emulators/shared demo data.
- Demo merchant/supplier accounts and all totals match the script.
- Reset is safe against the wrong Firebase project.

### 20. Write, rehearse, and back up the final demo

Owner: Lead and integration + all · Depends on: #18, #19

- Full demo succeeds five consecutive times within the limit.
- Presenter and backup have a script and recovery cues.
- Offline video and final-state screenshots are available.
