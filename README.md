# GemmaPunks

GemmaPunks is the hackathon repository for **MIZAN Souq**, a Darija-first
business-management and intelligent-procurement platform for Moroccan
microbusinesses.

MIZAN Souq turns receipts, voice notes, screenshots, and other messy business
evidence into reviewed records, useful inventory insights, and better purchasing
decisions.

The hackathon demo proves one complete loop:

```text
Receipt or voice note
        ↓
Gemma creates a draft
        ↓
Merchant reviews and confirms it
        ↓
Inventory and dashboard update
        ↓
A stockout is predicted
        ↓
Supplier offers are compared
        ↓
Nearby demand is combined
        ↓
Merchant approves a collective order
        ↓
Supplier sees the consolidated opportunity
```

Gemma interprets evidence and explains recommendations. Deterministic Python
code performs calculations. Firebase stores the application data. A human must
confirm financial records and approve commercial actions.

## Team responsibilities

Each person owns a clear part of the demo. Owning a task means making sure it
reaches a working result, asking teammates for the inputs it needs, and
reporting blockers early. It does **not** mean working alone.

| Person | Main responsibility | Issues |
|---|---|---|
| Asttr0 (`@Asttr0`) | Full-stack lead, Firebase, merchant UI, contracts, integration | #5, #6, #9, #10, #12, #13, #15, #26 |
| Rabii (`@rabiibanine`) | Supplier UI and shared visual consistency | #16, #17 |
| Taha Maftah (`@taha-kas`) | Gemma extraction and procurement intelligence | #21–#25 |
| Anas (`@ANAS-999`) | FastAPI business APIs | #18, #19 |
| Aymen (`@AymenMh7`) | Deployment, QA, demo reset coordination, and reliability | #7, #27, #28 |

Everyone working on an interface must read
[docs/design-system.md](docs/design-system.md) before writing UI code. It is
the shared rulebook for colors, spacing, typography, components, motion,
responsive behavior, and accessibility.

### Asttr0 — full-stack lead and Firebase owner

**Purpose:** Build the shared foundation, own Firebase, create the merchant
experience, and connect everyone’s work into one complete demo.

**Exact tasks:**

1. **#5 — Repository foundation:** keep the React and FastAPI applications,
   development commands, environment template, and repository structure usable
   by the whole team.
2. **#6 — CI and protected `main`:** keep frontend and backend checks running
   on pull requests and make sure broken code cannot be merged into `main`.
3. **#9 — Firebase foundation:** create the Firebase project and configure
   Authentication, Firestore, Storage, and the local Emulator Suite.
4. **#10 — Firebase data and security:** define Firestore collections, indexes,
   security rules, organization isolation, and synthetic seed data.
5. **#12 — API contracts:** agree with Anas and Taha on the exact request and
   response shapes used by React, FastAPI, Firebase, and Gemma.
6. **#13 — Merchant dashboard:** build the merchant KPIs, inventory view,
   stockout warning, and recommended next action.
7. **#15 — Evidence review:** build receipt/audio upload, the extracted draft,
   uncertainty display, clarification, editing, and confirmation.
8. **#26 — Integration:** connect the merchant UI, FastAPI, Firebase, Gemma,
   procurement flow, supplier UI, and demo timeline.

**Receives:**

- Validated extraction drafts and procurement results from Taha.
- FastAPI endpoints from Anas.
- Supplier screens and shared UI work from Rabii.
- Deployment and QA reports from Aymen.

**Delivers:**

- A working Firebase environment and safe data model.
- Stable API contracts that everyone can build against.
- The complete merchant interface.
- A working end-to-end demo in the shared deployment.

**Does not own:**

- Every unfinished task in the repository.
- Gemma prompts and procurement calculations.
- The supplier portal.
- Final responsibility for FastAPI endpoint implementation.

**Work order:** `#9 → #10 → #12 → #13/#15 → #26`

**First task now:** Start **#9** by setting up Firebase and its local emulators.

**Main handoffs:** Give Anas the Firebase Admin configuration and agreed data
paths. Give Taha the final extraction draft schema. Give Rabii the shared
frontend contracts. Fix cross-team contract mismatches as soon as they appear.

### Rabii — supplier UI and shared design consistency

**Purpose:** Build what suppliers see and make sure the frontend feels like one
product instead of separate screens made by different people.

**Exact tasks:**

1. **#16 — Supplier dashboard:** show catalog information, qualified demand,
   active offers, revenue summary, and collective purchasing opportunities.
2. **#17 — Collective-order interface:** show each merchant’s quantity,
   original price, collective price, delivery share, expected savings,
   conditions, deadline, and approval actions. The supplier sees only the
   consolidated opportunity.
3. Reuse shared buttons, cards, tables, inputs, navigation, loading states, and
   error states instead of creating unrelated versions for each screen.
4. Check UI work against [docs/design-system.md](docs/design-system.md).

**Receives:**

- Shared API types and mock data from Asttr0.
- Supplier opportunity and order data from Anas’s APIs.
- Offer rankings, savings, and group-order results from Taha.

**Delivers:**

- A clear supplier dashboard.
- A clear merchant collective-order decision screen.
- Reusable UI pieces that Asttr0 can also use in the merchant portal.

**Does not own:**

- Supplier calculations or offer-ranking rules.
- Firebase setup.
- FastAPI endpoints.
- Gemma extraction.

**Work order:** `#16 → #17`

**First task now:** Read the design standards, then build **#16** with typed
mock data so backend work does not block the UI.

**Main handoffs:** Coordinate shared UI components with Asttr0. Use values
returned by the backend instead of recalculating money in React. Tell Anas or
Taha immediately when a required field is missing from the contract.

### Taha Maftah — Gemma and procurement intelligence

**Purpose:** Turn messy evidence into a safe draft, then turn inventory data
into clear purchasing recommendations.

Before starting, read
[docs/taha-ai-procurement-handoff.md](docs/taha-ai-procurement-handoff.md).
It explains the provider and fixture in plain language, freezes the handoff
with Anas, documents every calculation, and gives the exact implementation and
test order for issues #21–#25.

**Exact tasks:**

1. **#21 — Real AI plus reliable backup:** create one extraction entry point
   that accepts a receipt or audio input and returns one validated draft shape.
   It must support:
   - **Real mode:** send the evidence to Gemma.
   - **Backup mode:** return a saved answer for the known demo evidence.

   Both modes must return the same fields, so the rest of the application does
   not need to know which one ran. The saved answer is the recovery path if the
   internet or Gemma fails during the presentation.
2. **#22 — Gemma extraction:** make the known receipt and Darija/French voice
   note produce products, quantities, prices, transactions, uncertainty, and
   one useful clarification question.
3. **#23 — Stockout forecast:** use deterministic Python to calculate when the
   selected product will run out and how much should be reordered.
4. **#24 — Supplier comparison:** compare the three synthetic supplier offers
   using price, minimum quantity, delivery cost, available cash, and expected
   margin. Explain why the top offer wins.
5. **#25 — Collective-order matching:** combine the merchant’s 20 units with
   35 compatible units from other synthetic merchants, calculate the 55-unit
   proposal and its savings, and protect each merchant’s private data.
6. Record Gemma activity and approved tool calls so the UI can show the
   tool-call timeline.

**Receives:**

- The final receipt, audio, expected values, and data schemas from Asttr0.
- Confirmed transaction and inventory data through Anas’s APIs.

**Delivers:**

- One validated extraction draft shape for both real and backup modes.
- The clarification question and agent/tool timeline data.
- Tested stockout, offer-comparison, and collective-order results.
- Simple explanations whose numbers match the deterministic calculations.

**Does not own:**

- Writing directly to confirmed Firebase financial records.
- Confirming a draft or approving an order for the user.
- Building the dashboards.
- Authentication or organization authorization.
- Using Gemma to guess final totals that Python can calculate exactly.

**Work order:** `#21 → #22 → #23 → #24 → #25`

**First task now:** Build the saved backup result for the known demo evidence
and make it pass the same validation that the real Gemma result will use.

**Main handoffs:** Agree on the draft shape with Asttr0 and Anas before deeper
Gemma work. Give Anas validated data, not free-form AI text. Give Rabii the
exact offer and savings fields needed by the UI.

### Anas — FastAPI backend

**Purpose:** Build the trusted API between the frontend, Firebase data, and
Taha’s AI/procurement work.

Before starting, read
[docs/anas-backend-handoff.md](docs/anas-backend-handoff.md). It contains the
MCD, request flows, initial payloads, state transitions, and exact implementation
order for issues #18 and #19.

Asttr0 owns Firebase setup, Firestore structure, indexes, and security rules.
Anas owns the FastAPI behavior that safely uses that Firebase environment.

**Exact tasks:**

1. **#18 — Ingestion and confirmation API:**
   - Accept receipt, image, PDF, and audio uploads.
   - Validate file type and size.
   - Store the evidence through the agreed Firebase setup.
   - Start extraction through Taha’s one extraction entry point.
   - Return a reviewable draft without changing official records.
   - On explicit confirmation, create the transaction and inventory movement
     exactly once.
   - Support editing, rejection, failure, retry, and audit information.
2. **#19 — Business data APIs:**
   - Return merchant dashboard totals.
   - Return transactions and inventory.
   - Return procurement needs and supplier opportunities required by the demo.
   - Verify the Firebase ID token on every protected request.
   - Scope every business query to the user’s verified organization.
   - Prevent retries from creating duplicate transactions or stock movements.

**Request and data flow:**

```text
React sends a request with a Firebase ID token
        ↓
FastAPI verifies the token and organization membership
        ↓
FastAPI validates the request
        ↓
For extraction, FastAPI calls Taha's extraction entry point
        ↓
FastAPI reads or writes the correct Firebase records
        ↓
FastAPI returns the agreed response shape to React
```

Example confirmation flow:

```text
Merchant confirms a reviewed draft
        ↓
FastAPI verifies identity, organization, and draft status
        ↓
FastAPI creates the transaction once
        ↓
FastAPI creates the inventory movement once
        ↓
FastAPI marks the draft confirmed and returns updated data
```

**Receives:**

- Firebase project configuration, collection paths, and security decisions from
  Asttr0.
- Validated extraction drafts and procurement functions from Taha.
- Exact frontend data needs from Asttr0 and Rabii.

**Delivers:**

- Documented FastAPI endpoints with Pydantic request/response schemas.
- Safe draft confirmation and business-data flows.
- OpenAPI output that frontend types can be generated from.
- Tests for authorization, retries, and organization isolation.

**Does not own:**

- Firebase project setup, Firestore rules, indexes, or seed ownership.
- React screens.
- Gemma prompts or AI output quality.
- Deciding stockout, offer-ranking, or collective-order formulas alone.

**Work order:** `#18 → #19`

**First task now:** Create the **#18** endpoint and Pydantic schema skeletons
against the agreed mock contract while Asttr0 finishes Firebase.

**Main handoffs:** Work with Asttr0 on authentication and data access instead of
creating a second Firebase design. Agree with Taha on validated AI-facing
schemas. Keep the OpenAPI contract current so both frontend developers can work
without guessing.

### Aymen — deployment, QA, and demo reliability

**Purpose:** Make sure the combined work is reachable, repeatable, and safe to
present. Aymen owns the result of these tasks and coordinates technical help
when implementation needs Asttr0, Anas, or Taha.

**Exact tasks:**

1. **#7 — Shared deployments:** configure or verify the Vercel frontend and
   Railway API, health-check both, document environment needs, and verify the
   latest `main` is actually deployed.
2. Continuously test completed work in the shared deployment, not only on a
   teammate’s laptop.
3. For every failure, open or update a GitHub issue with exact steps, expected
   result, actual result, screenshot/log evidence, and severity.
4. **#27 — Deterministic demo reset:** coordinate one safe command that resets
   the synthetic demo data to the same starting state every time. Asttr0 helps
   with Firebase, Anas helps with API/reset behavior, and Taha verifies the
   saved AI and procurement results. Aymen verifies the whole reset outcome.
5. **#28 — Final demo reliability:** maintain the demo checklist and script,
   rehearse the complete path at least five times, verify every displayed
   number, prepare screenshots and an offline backup video, and confirm the
   fixture AI recovery switch works.

**Receives:**

- Deployable work from the whole team.
- Firebase reset support from Asttr0.
- API/reset support from Anas.
- Expected AI and procurement results from Taha.
- Final screens from Asttr0 and Rabii.

**Delivers:**

- Reachable shared web and API deployments.
- Reproducible bug reports and retest results.
- A predictable demo reset and verified test accounts.
- A rehearsed demo, recovery checklist, screenshots, and backup video.

**Does not own:**

- Random leftover coding tasks.
- Firebase, FastAPI, Gemma, or UI implementation by himself.
- Quietly fixing unreported product bugs without involving the owner.
- Marking something done only because it works locally.

**Work order:** `#7 → continuous QA → #27 → #28`

**First task now:** Verify **#7**, write down the public web/API URLs and their
health status, then create a short checklist for testing each merged feature.

**Main handoffs:** Report failures to the correct owner with reproducible
evidence. Ask Asttr0, Anas, or Taha for technical implementation help on #27
while remaining responsible for proving that the reset and demo are reliable.

## How the team works together

The main handoff chain is:

```text
Asttr0 defines Firebase paths and shared contracts
        ↓
Taha returns validated drafts and procurement results
        ↓
Anas exposes safe FastAPI endpoints and confirmed business data
        ↓
Asttr0 and Rabii connect the merchant and supplier interfaces
        ↓
Aymen tests the shared deployment and verifies the complete demo
        ↓
The original owner fixes any failure and Aymen retests it
```

Work can happen in parallel:

- Asttr0 can set up Firebase while Anas builds FastAPI skeletons against mock
  contracts.
- Taha can build the saved extraction backup before the live Gemma integration.
- Asttr0 and Rabii can build screens with typed mock data before APIs are ready.
- Aymen can test deployments and prepare QA cases from the first day.

When a required field or behavior is unclear, record the decision in the
relevant GitHub issue. Do not let different parts silently invent different
data shapes.

## Start locally

Requirements: Node.js 22+, npm 10+, Python 3.12+, and Java 21+ for the Firebase
emulators.

```bash
cp .env.example .env
make install
```

Run the API and web app in separate terminals:

```bash
make api
make web
```

- Web: <http://localhost:5173>
- API: <http://localhost:8000>
- OpenAPI: <http://localhost:8000/docs>

Firebase setup and its Emulator Suite command are being completed under issue
#9. Follow [docs/firebase-setup.md](docs/firebase-setup.md) after that issue is
merged.

## Quality checks

Before opening or updating a pull request:

```bash
make lint
make test
npm run build
```

## Architecture

GemmaPunks uses a modular monolith:

- `apps/web`: React + TypeScript + Vite
- `apps/api`: FastAPI + Pydantic
- Firebase Authentication and Cloud Firestore
- `packages/contracts`: the frozen OpenAPI contract and generated frontend types
- `packages/demo-data`: synthetic demo inputs and expected results
- `docs`: architecture, design standards, decisions, and demo documentation
- `infra`: local and deployment configuration

The browser never calls Gemma directly and never directly changes critical
business records. React calls FastAPI. FastAPI verifies identity, applies
business rules, coordinates AI tools, and accesses Firebase.

## Firebase and security

Local development is emulator-first. The exact setup command and ports are kept
in [docs/firebase-setup.md](docs/firebase-setup.md).

The complete Firestore tree, field contracts, permissions, relationships,
seeded values, and teammate handoffs are frozen in
[docs/database-guide.md](docs/database-guide.md). Read it before adding a
collection or changing a database field.

The browser signs in through Firebase Authentication and sends its Firebase ID
token to FastAPI over HTTPS. FastAPI verifies the token with the Firebase Admin
SDK, then enforces organization membership for every business query.

Security rules for every contributor:

- Never commit `.env`, API keys, service-account JSON, or real merchant
  documents.
- Use synthetic hackathon data only.
- Scope every business-owned record and query by `organization_id`.
- Never expose one merchant’s exact sales, cash, or private data to another
  merchant or supplier.
- Validate file type and size.
- Treat all AI output as untrusted draft data.
- Validate AI output with Pydantic before using it.
- Require human confirmation before creating official financial records.
- Require human approval before joining or confirming an order.
- Log agent runs and tool calls for audit and for the demo timeline.

## Git workflow

Every change starts from one GitHub issue and one short-lived branch:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/<issue-number>-<short-name>
```

Commit and push only the files related to that issue:

```bash
git add <files>
git commit -m "feat: describe the completed change"
git push -u origin feat/<issue-number>-<short-name>
```

Then open a pull request. The current `main` rules are:

- A pull request is required.
- Frontend and backend CI checks must pass.
- Human review is useful but optional.
- Resolving every review conversation is not required by branch protection.
- Direct pushes, force pushes, and branch deletion are blocked.
- Use squash merge.

Keep one major issue in progress per person, open draft pull requests early,
and report blockers immediately. A task is complete only when it works in the
shared deployment with the expected synthetic data. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the contribution guide.

## Hackathon

- **Event:** Build with Gemma
- **Date:** July 26, 2026
- **Track:** Autonomous Agents
- **Theme:** Financial Services
