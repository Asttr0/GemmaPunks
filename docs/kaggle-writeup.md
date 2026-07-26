# Kaggle submission copy

## Title

MIZAN Control — AI Financial Operations Control for Moroccan Distributors

## Subtitle

Gemma turns fragmented company evidence into auditable records, cash forecasts,
supplier intelligence, and human-approved financial decisions.

## Project description

### The problem

Distribution companies process purchase orders, delivery notes, supplier
invoices, contracts, bank movements, and ERP exports every day. These records
often sit in different systems and formats. Finance teams therefore spend time
reconciling evidence manually, while overbilling, duplicate payments, missing
deliveries, price drift, and cash-flow pressure can remain hidden.

This problem matters in Morocco. OMPIC reported 95,235 new businesses in 2024,
with commerce representing 35.1% of newly created legal entities. The OECD's
2024 Morocco survey also highlights payment-delay pressure: based on 2019
registry data, more than half of firms paid beyond the legal 60-day limit and
35% paid after more than 120 days.

### Our solution

MIZAN Control is a financial operations control tower for Moroccan distribution
companies. A finance team uploads an invoice, purchase order, delivery note,
screenshot, or voice note. Gemma extracts and normalizes the evidence into a
reviewable draft. The user corrects uncertain fields and confirms the record.

Confirmed evidence powers:

- Continuous three-way matching and accounting exception detection
- Cash-flow and working-capital forecasting
- Supplier concentration, reliability, and contract-compliance analysis
- Connected financial records with a visible audit trail
- Clear recommended actions that remain subject to human approval

### Five-minute demo

Our synthetic Atlas Distribution Maroc scenario connects three documents:

1. PO-1042 orders 500 cartons of cooking oil at 180 MAD.
2. BL-4478 records that only 480 cartons were received.
3. INV-8821 bills 500 cartons at 185 MAD.

The approved payable is 480 × 180 = 86,400 MAD. The invoice requests 92,500
MAD. MIZAN therefore identifies a preventable 6,100 MAD overpayment, shows the
evidence chain, and prepares a human-approved action.

### How Gemma is used

Gemma is the interpretation and reasoning layer, not a decorative chatbot. It:

- Reads multimodal financial evidence
- Extracts products, quantities, units, prices, dates, and references
- Normalizes inconsistent product and unit descriptions
- Links evidence and explains mismatches in simple language
- Produces structured output validated by Pydantic
- Records an auditable timeline of approved tool calls

Deterministic Python code calculates totals, unit conversions, inventory
movements, cash forecasts, and audit differences. Gemma cannot confirm a record
or payment. Every important action requires a separate human decision.

### Architecture

- React, TypeScript, Vite, Tailwind CSS, and shadcn-style components
- FastAPI and Pydantic for validated APIs and AI output
- Firebase Authentication and Firestore for organization-scoped data
- Gemma through Google's hosted API
- Approved synthetic fixture provider as a reliable demo fallback
- Modular-monolith architecture with clear finance, ingestion, AI, inventory,
  audit, and supplier-intelligence modules

### Engineering challenges

We solved four important challenges:

1. Keeping untrusted AI output separate from official financial records.
2. Matching packaging units such as cartons to inventory units such as bottles.
3. Enforcing organization-level access and human approval.
4. Keeping the live demo reproducible when network inference is unavailable.

### Business model

MIZAN Control is a B2B SaaS product for distributors and multi-warehouse
wholesalers. Revenue can come from a subscription based on document volume and
warehouse count, paid ERP/accounting integrations and onboarding, and premium
continuous-audit, treasury-forecasting, and supplier-risk modules.

The business value is direct: prevent avoidable payments, protect working
capital, shorten reconciliation work, and improve supplier negotiations. The
6,100 MAD result in our demo is an illustrative synthetic case, not a general
ROI claim.

### Links

- Public code: https://github.com/Asttr0/GemmaPunks
- Live demo: ADD_DEPLOYED_DEMO_URL
- Demo video: ADD_YOUTUBE_URL

### Sources

- OMPIC, “Création de 95.235 entreprises en 2024”:
  https://www.ompic.ma/fr/actualites/creation-de-95235-entreprises-en-2024-0
- OECD Economic Surveys: Morocco 2024:
  https://www.oecd.org/en/publications/oecd-economic-surveys-morocco-2024_80777ea7-en/full-report/component-5.html

## Submission checklist from the official rules

- [ ] Team has no more than five members.
- [ ] Make only one final team submission.
- [ ] Add a working live-demo URL or demo files.
- [ ] Paste the technical writeup above.
- [ ] Add the public GitHub repository.
- [ ] Make Gemma usage obvious in the repository and writeup.
- [ ] Ensure the repository uses an OSI-approved open-source license.
- [ ] Replace `ADD_DEPLOYED_DEMO_URL`.
- [ ] Replace `ADD_YOUTUBE_URL`, or upload equivalent demo media.
- [ ] Add a 560 × 280 card image.
- [ ] Save draft, preview, and submit before the Kaggle deadline.

