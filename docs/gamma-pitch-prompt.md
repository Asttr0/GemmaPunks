# Gamma prompt — MIZAN Control five-minute pitch

Set Gamma to **8 slides**, **English**, and a clean professional presentation.
Paste the prompt below as one block.

```text
Create an investor-ready 8-slide presentation for a five-minute hackathon pitch.

Project name: MIZAN Control
Tagline: AI financial operations control for Moroccan distribution companies.

Audience: hackathon jury, Moroccan distribution-company leaders, finance directors, and early-stage investors.

Core message:
Moroccan distributors already have the data needed to protect cash, but it is fragmented across supplier invoices, purchase orders, delivery notes, contracts, bank movements, ERP exports, email, and voice notes. MIZAN Control uses Gemma to understand and connect this evidence, then deterministic financial controls detect mismatches, forecast cash pressure, score supplier risk, and recommend an action. AI creates drafts and explanations; a human approves every consequential action.

Use this exact slide structure:

1. TITLE — 15 seconds
   MIZAN Control
   “From fragmented records to protected cash.”
   Show a clean financial-control dashboard visual for a Moroccan distributor.

2. THE PROBLEM — 35 seconds
   Title: “A company can be profitable and still leak cash”
   Show one simple chain: Purchase order → Delivery → Invoice → Payment.
   Explain that these records often live in separate systems, so overbilling, duplicate payments, missing deliveries, price drift, and late collections are detected too late.
   Keep text to three short bullets.

3. WHY MOROCCO, WHY NOW — 30 seconds
   Use only these sourced facts:
   - OMPIC reported 95,235 new Moroccan businesses in 2024.
   - Commerce represented 35.1% of newly created legal entities in 2024.
   - Casablanca-Settat represented 39.1% of new legal-entity creations in 2024.
   - OECD’s Morocco 2024 survey cites 2019 registry data showing more than half of firms paid invoices after the legal 60-day limit, and 35% paid after more than 120 days.
   Put small source labels: “OMPIC, 2024 business-creation results” and “OECD Economic Survey: Morocco 2024”.
   Do not invent market-size or ROI figures.

4. THE SOLUTION — 35 seconds
   Title: “A financial control tower for distributors”
   Show four capabilities with icons:
   - Evidence extraction
   - Continuous audit
   - Cash-flow forecast
   - Supplier intelligence
   End with one sentence: “Every record becomes a decision signal.”

5. HOW GEMMA POWERS IT — 35 seconds
   Show a simple architecture:
   Invoice / order / delivery note → Gemma extraction and matching → validated draft → deterministic controls → human approval → dashboard.
   State clearly:
   - Gemma reads French and mixed business documents.
   - Gemma matches product names and explains anomalies.
   - Backend code calculates money, inventory, and audit differences.
   - Fixture fallback keeps the live demo reliable.
   - Tool calls remain visible and auditable.

6. BUSINESS VALUE AND BUSINESS MODEL — 40 seconds
   Left side: business gain
   - Prevent overpayments and duplicate payments
   - Protect working capital
   - Reduce manual reconciliation time
   - Negotiate with suppliers using performance data
   Use the demo result as an illustrative case, not a general claim:
   “One three-way match prevents a 6,100 MAD overpayment.”
   Right side: business model
   - B2B SaaS subscription per company, based on document volume and warehouses
   - Paid ERP/accounting integration and onboarding
   - Premium continuous-audit, treasury forecasting, and supplier-risk modules
   Target beachhead: Moroccan distributors and multi-warehouse wholesalers with finance teams.

7. LIVE DEMO — 2 minutes
   Reserve most of the slide for a clear demo checklist:
   1. Upload PO-1042, BL-4478, and INV-8821
   2. Gemma extracts products, quantities, prices, and references
   3. Human confirms the draft
   4. MIZAN links the three records
   5. Audit detects: 500 cartons ordered, 480 received, 500 invoiced
   6. Contract price: 180 MAD; invoice price: 185 MAD
   7. Approved payable: 86,400 MAD; invoice: 92,500 MAD
   8. Preventable overpayment: 6,100 MAD
   Visually highlight the 6,100 MAD result.

8. CLOSE — 15 seconds
   Title: “MIZAN turns evidence into financial control”
   Show three outcomes: Protected cash. Better supplier decisions. Explainable AI.
   Closing line: “We do not replace the finance team. We give it continuous control.”
   Add a small final ask: pilot with one Moroccan distributor and one month of synthetic or approved records.

Design direction:
- Light-only, premium, trustworthy, modern financial UI.
- Primary palette: #03045E, #0077B6, #00B4D8, #90E0EF, #CAF0F8.
- Very small red/green Moroccan accents only where meaningful.
- English text, short headlines, maximum three bullets per slide.
- Use Lucide-style line icons, simple diagrams, and large numbers.
- No generic robot imagery, no stock-photo collage, no dense paragraphs.
- Use MAD as currency and Moroccan company context.
- Add concise speaker notes and the exact speaking time to every slide.
- Total delivery must fit within 4 minutes 45 seconds, leaving 15 seconds of safety.

Sources to place in small footer text:
- OMPIC: “Création de 95.235 entreprises en 2024”
  https://www.ompic.ma/fr/actualites/creation-de-95235-entreprises-en-2024-0
- OECD: “OECD Economic Surveys: Morocco 2024”
  https://www.oecd.org/en/publications/oecd-economic-surveys-morocco-2024_80777ea7-en/full-report/component-5.html
```

