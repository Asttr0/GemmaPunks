# GemmaPunks

GemmaPunks is the hackathon repository for **MIZAN Control**, an AI financial
control tower for Moroccan distribution companies.

MIZAN links fragmented company evidence—supplier invoices, purchase orders,
delivery notes, contracts, ERP exports, bank movements, and voice notes—then
turns it into explainable audit findings, cash forecasts, supplier intelligence,
and human-approved actions.

## The live-demo story

Atlas Distribution Maroc SARL receives an invoice from Maghreb Oils & Foods:

```text
PO-1042       500 cartons approved × 180 MAD
BL-4478       480 cartons actually received
INV-8821      500 cartons invoiced × 185 MAD
                         ↓
Approved payable             86,400 MAD
Supplier invoice             92,500 MAD
Preventable leakage           6,100 MAD
                         ↓
Finance reviews the evidence and approves a dispute
No payment is executed automatically
```

The same control run also detects a probable 12,750 MAD duplicate payment,
forecasts August cash pressure, and identifies 68% supplier concentration in the
edible-oil category.

## Product boundaries

- **Gemma** understands multilingual and multimodal company evidence, proposes
  normalized draft fields, marks uncertainty, and explains findings.
- **Deterministic Python controls** perform three-way matching, duplicate
  checks, exact money calculations, cash forecasting, and supplier scoring.
- **FastAPI** verifies Firebase identity, enforces organization isolation, owns
  authoritative actions, and exposes the OpenAPI contract.
- **Firebase** provides Authentication and Firestore for the shared demo.
- **React** presents the financial control tower and collects human decisions.
- **Humans** confirm extracted records and approve every consequential action.

## Main interfaces

| Interface | Purpose |
|---|---|
| Control tower | Executive spend, leakage, cash, and action priorities |
| Financial evidence | Upload invoices, POs, delivery notes, screenshots, or voice |
| Review draft | Correct Gemma extraction before records change |
| Audit center | Run controls and inspect AI/tool-call boundaries |
| Finding detail | See evidence, exact calculation, and approve a safe action |
| Cash-flow forecast | Understand 30-day liquidity pressure and planned responses |
| Supplier portfolio | Compare concentration, reliability, compliance, and risk |
| Connected records | Trace POs, deliveries, invoices, payments, and receivables |
| Demo impact | Present the investor value proposition and measurable outcome |

## Run locally

Requirements: Node 22+, Python 3.12+, Java for Firebase emulators, and the
Firebase CLI.

```bash
cp .env.example .env
npm ci
python -m venv .venv
.venv/bin/python -m pip install -e "apps/api[dev]"
```

Terminal 1:

```bash
npm run firebase:emulators
```

Terminal 2:

```bash
node scripts/seed_firebase.mjs --project demo-gemmapunks --verify
```

Terminal 3:

```bash
cd apps/api
../../.venv/bin/uvicorn app.main:app --reload --port 8000
```

Terminal 4:

```bash
npm run dev
```

Open `http://localhost:5173`, choose **Demo finance team**, then start at
`/control-tower/overview`.

Pitch-ready synthetic evidence:

```text
packages/demo-data/financial-records/purchase-order-po-1042.png
packages/demo-data/financial-records/delivery-note-bl-4478.png
packages/demo-data/financial-records/invoice-inv-8821.png
```

Use `AI_PROVIDER=gemma` and set `GEMINI_API_KEY` only in `.env` for hosted
Gemma. Use `AI_PROVIDER=fixture` for the stable recovery path. Never commit the
key.

## Quality commands

```bash
npm run lint
npm run test
npm run build
npm run contracts:check

.venv/bin/ruff check apps/api
.venv/bin/pytest -q apps/api/app/tests
```

## Team ownership

| Person | Clear ownership |
|---|---|
| Asttr0 | Integration lead, Firebase, API contracts, control-tower frontend, final demo |
| Rabii | Shared React components, responsive polish, accessibility, visual consistency |
| Taha | Gemma extraction, multilingual prompts, AI audit timeline, explanations |
| Anas | FastAPI endpoints, repositories, authorization, audit/action persistence |
| Aymen | Demo data, repeated QA runs, deployment checks, backup video, bug reporting |

Everyone works through small branches and pull requests. CI is the merge gate.
The shared UI rules are in [docs/design-system.md](docs/design-system.md), the
new demo sequence is in [docs/demo-script.md](docs/demo-script.md), and the API
contract is generated into `packages/contracts`.

## Repository map

```text
apps/web/        React + TypeScript + Tailwind interface
apps/api/        FastAPI application and deterministic controls
packages/
  contracts/     Generated OpenAPI and TypeScript contract
  demo-data/     Synthetic Moroccan company evidence and Firebase seed
docs/            Architecture, design, Firebase, team, and demo documents
scripts/         Contract generation and Firebase seed tools
```

## Safety

- All demo data is synthetic.
- AI output is untrusted draft data.
- Money is stored and calculated as integer centimes.
- Organization scope comes from the verified Firebase session.
- Finance data is scoped to the authenticated organization.
- AI never confirms a record, releases a payment, or contacts a supplier.
- Human decisions and tool calls remain auditable.

## License

MIT — see [LICENSE](LICENSE).
