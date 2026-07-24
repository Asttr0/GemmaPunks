---
purpose: "Load this file at the start of any AI coding session for MIZAN Souq frontend work. It's self-contained for day-to-day building: product context, scope, stack, screens, and the operational design-system rules. design_system.md remains the exhaustive canonical spec — check it for edge cases this file compresses or omits."
scope: "Frontend only (apps/web). No backend/database/infra content included."
---

# MIZAN Souq — Frontend Context

## 1. Product snapshot

Darija-first business platform connecting two sides:

- **Merchants** submit messy evidence (voice notes, receipt photos, WhatsApp
  screenshots, handwritten ledgers). AI turns this into a draft the owner
  confirms; the dashboard then answers "what should I do next?" (stock
  alerts, profit, best sellers, recommended reorders).
- **Suppliers** upload catalogs; the platform shows them aggregated demand
  and quotation opportunities, never a merchant's private financials.

**Differentiator — collective purchasing:** merchants who individually can't
hit a supplier's minimum order or wholesale price get matched into one
combined order. Each merchant sees only their own quantity, price, savings,
and deadline, and approves independently — no visibility into other
merchants' identity or finances.

Core loop the UI needs to visually narrate:

```
Evidence → AI draft → owner confirms → dashboard updates
  → purchasing need detected → supplier offers compared
  → collective order proposed → human approval → supplier sees opportunity
```

This is a 3-day hackathon build. Reliability of one demo path beats feature
breadth.

## 2. Frontend scope

**P0 screens — must exist and work in the live demo:**
- Login (minimal)
- Merchant dashboard
- Evidence upload + draft review/clarification
- Supplier dashboard
- Offer comparison
- Collective-order approval
- Agent/tool-call timeline (visible, not hidden)
- Final impact screen

**P1 — only after P0 is solid:** richer charts, transaction history, CSV/PDF
catalog upload UI, more comparison criteria, bilingual labels, downloadable
order summary, better empty/loading/error states beyond the P0 minimum.

**Out of scope — don't build UI for these:** payments, real WhatsApp
integration, credit/lending, full accounting, live merchant-to-merchant chat,
large catalogs, complex supplier ratings, a mobile-first redesign (desktop-
first is the P0 target).

## 3. Stack

React + TypeScript + Vite · Tailwind CSS + shadcn/ui · React Router ·
TanStack Query (server state, caching, loading states) · React Hook Form +
Zod (typed form validation) · Recharts (charts) · Lucide React (icons only —
never emoji as structural UI).

## 4. Responsibility boundary

- React presents data, collects input, and asks for confirmation. It **never
  calls the AI provider directly** and **never writes to the database
  directly** — everything goes through the FastAPI contract below.
- Treat every AI-produced value as a **draft** until a human explicitly
  confirms it. Never animate a draft straight into a "confirmed" visual state
  without showing the human action that caused the transition.
- TypeScript types should be generated from the backend's OpenAPI spec, not
  hand-written — ask for the current `openapi.json` / generated types rather
  than guessing response shapes.

## 5. API contract you're building against

```
POST   /api/v1/ingestions
GET    /api/v1/ingestions/{id}
POST   /api/v1/ingestions/{id}/confirm

GET    /api/v1/merchant/dashboard
GET    /api/v1/transactions
GET    /api/v1/inventory

POST   /api/v1/procurement-needs/generate
GET    /api/v1/procurement-needs
GET    /api/v1/suppliers/search
POST   /api/v1/offers/compare

POST   /api/v1/group-orders/propose
POST   /api/v1/group-orders/{id}/join
POST   /api/v1/group-orders/{id}/approve

GET    /api/v1/supplier/dashboard
GET    /api/v1/supplier/opportunities
POST   /api/v1/supplier/offers

GET    /api/v1/agent-runs/{id}
```

If a backend endpoint you need isn't live yet, use a fixture/mock matching
this contract rather than inventing a different shape — it has to line up
when the real API lands.

---

# 6. Design system (operational rules)

Full canonical spec lives in `design_system.md`. This section is the part
you'll reference on nearly every screen; go to the full file for exhaustive
detail (contrast ratios, complete page-by-page standards, PR checklist).

## 6.1 Product character

Should feel: trustworthy, intelligent, modern, interactive, premium, simple
enough for a busy merchant. Should **not** feel: like a bank portal or admin
template, playful at the expense of clarity, crowded with gradients/glass/
shadows/animation, or different between merchant and supplier portals.

## 6.2 Non-negotiables

1. Semantic tokens only — never raw hex in feature components.
2. Build shared primitives once, reuse them; don't fork a component for a
   small visual tweak — add an approved variant instead.
3. One primary call-to-action per screen/panel.
4. AI output is a draft/recommendation until a human confirms it.
5. Every view needs loading, empty, error, disabled, and success states.
6. Never communicate status with color alone — add text and/or an icon.
7. Meet WCAG AA contrast and keyboard accessibility.
8. Lucide icons only, never emoji as structural UI.
9. Always show currency; preserve financial precision.
10. Clarity over novelty in forms, prices, approvals, destructive actions.

## 6.3 Color tokens

Repo is scaffolded on Tailwind v3 — tokens are already wired into
`tailwind.config.js` as `theme.extend.colors`. The AI only needs to know
which token to reach for; it should never set up config or use raw hex.

| Token | Hex | Use |
|---|---|---|
| `brand-950` | `#03045E` | Deep emphasis, primary text accents, primary hover |
| `brand-700` | `#0077B6` | Primary actions, active navigation, links |
| `brand-500` | `#00B4D8` | Interactive accent, charts, focus details |
| `brand-200` | `#90E0EF` | Selected rows, highlighted regions, soft charts |
| `brand-100` | `#CAF0F8` | Informational surfaces, subtle brand backgrounds |
| `background` | `#F8FAFC` | Application background |
| `surface` | `#FFFFFF` | Cards, dialogs, tables, navigation |
| `surface-subtle` | `#F1F5F9` | Secondary regions, headers, grouped controls |
| `foreground` | `#0F172A` | Primary text |
| `foreground-muted` | `#475569` | Secondary text, metadata |
| `border` | `#CBD5E1` | Default borders, dividers |
| `border-strong` | `#94A3B8` | Emphasized boundaries |
| `primary` | `#0077B6` | Primary button, active state |
| `primary-hover` | `#03045E` | Primary hover / pressed state |
| `primary-subtle` | `#CAF0F8` | Selected / informational backgrounds |
| `ai` | `#6D28D9` | Gemma / agent / recommendation identity |
| `ai-subtle` | `#F5F3FF` | AI draft / explanation background |
| `success` | `#047857` | Confirmed success, positive state |
| `success-subtle` | `#ECFDF5` | Success background |
| `warning` | `#B45309` | Warning, attention state |
| `warning-subtle` | `#FFFBEB` | Warning background |
| `danger` | `#B91C1C` | Destructive action, error |
| `danger-subtle` | `#FEF2F2` | Error background |
| `info` | `#0369A1` | Neutral informational state |
| `info-subtle` | `#F0F9FF` | Informational background |
| `focus` | `#0077B6` | Keyboard focus ring |

Usage rules:
- White text on `brand-700` / `brand-950` only. Never white body text on
  `brand-500` (contrast fails). Never `brand-200`/`brand-100` as text on white.
- Portal accents: merchant emphasis = `brand-700`; supplier emphasis =
  `brand-500` (with dark text); AI emphasis = `ai` (violet), always. Same
  components/layout for both portals — accents differentiate context, not a
  second theme.
- Moroccan red (`#C1272D`) / green (`#006233`) are **brand-detail accents
  only** (e.g. a presentation motif) — never part of the app palette, never
  replacing semantic success/error colors.
- Violet (`ai` token) identifies AI origin, never correctness or confirmation.

## 6.4 Typography

- Latin UI: Inter. Arabic/Darija content: Noto Sans Arabic. Numeric tables:
  Inter with `font-variant-numeric: tabular-nums`. Code/IDs: system mono.

| Role | Size | Weight | Line height |
|---|---:|---:|---:|
| Display/impact value | 40–48px | 700 | 1.1 |
| Page title | 30–36px | 700 | 1.2 |
| Section title | 22–24px | 600 | 1.3 |
| Card title | 18px | 600 | 1.4 |
| Body | 16px | 400 | 1.5 |
| Small/metadata | 14px | 400–500 | 1.45 |
| Label/caption | 12px | 500–600 | 1.4 |

No body text below 14px. Right-align tabular numeric columns.

## 6.5 Layout

- Desktop-first: optimize 1440×900 and 1920×1080 (projector demo); stay
  usable at 1024px; functional fallback to 375px but no separate mobile nav
  for P0.
- Max content width 1600px; 24–32px desktop gutters, 16px narrow gutters.
- Shell: persistent left sidebar (240–264px), top bar for identity/org
  context, predictable page header. Same shell dimensions for both portals.
- 12-column grid; 4 KPI cards per row at large widths, 2 at medium, 1 at
  narrow. Prefer 2:1 or 2:2 compositions over irregular mosaics.
- Projector rules: key info above the fold, no fine borders/pale text, no
  tiny chart labels, nothing hidden behind hover-only.

## 6.6 Spacing, radius, elevation

- Spacing scale (px), no one-off values: `4, 8, 12, 16, 24, 32, 48, 64`.
- Radius: badges/compact controls 8px · buttons/inputs 12px · cards/dialogs
  16px · hero/final-impact panels 20px.
- Default cards: border, little/no shadow. Raised cards: one shared soft
  shadow. Dialogs: stronger shared elevation. Avoid neon glow, heavy inner
  shadows, competing gradients. One subtle blue gradient max, and never
  behind dense text or financial tables.

## 6.7 Component standards

- **Sources:** shadcn/ui (primitives), Lucide React (icons), Recharts
  (charts). External components must be re-themed to MIZAN tokens/type/radius
  before use — never keep a copied component's demo colors/fonts/gradients.
- **Buttons:** primary / secondary / outline / ghost / destructive / AI
  (violet, recommendation only, never auto-confirms). Min height 44px.
  "Confirm"/"Approve" must state what's being confirmed or approved.
- **Forms:** React Hook Form + Zod. Visible label always (placeholder is
  never the only label). Validate on blur/submit, not every keystroke. Error
  directly below the field; focus first invalid field after failed submit.
- **Cards:** one heading, one main content group, at most one primary action.
  No stacking decorative cards just for depth.
- **Tables:** right-align numbers, left-align text. Row height ≥48px. Filters
  above the table. On narrow screens, prioritize/collapse columns, don't
  shrink text.
- **Badges:** always include text, not color alone. Draft/AI = violet ·
  pending/warning = amber · confirmed/success = emerald · failed/danger =
  red · neutral = slate · informational = blue. Never a green badge on an
  unconfirmed AI suggestion.
- **Dialogs/sheets:** dialogs for focused confirmation/clarification only —
  never primary navigation in a dialog. Return focus to trigger on close.
- **Feedback:** skeleton if loading > 300ms with a predictable final shape;
  spinner for short indeterminate actions; progress bar for multi-step
  extraction. Toasts are secondary only, never the sole state indicator.

## 6.8 Screen-by-screen notes (P0)

- **Login:** minimal shell, text wordmark, one sign-in card. No nav before auth.
- **Merchant dashboard:** priority order = status → recommended next action →
  inventory risk → sales/profit trend → recent activity. Max 4 top-level
  KPIs. Alerts state cause, consequence, and action.
- **Evidence upload:** show accepted formats/size limits; upload and
  extraction are distinct visible steps; preserve original-evidence preview;
  never imply upload alone changes official records.
- **Draft review/clarification:** side-by-side source evidence vs. extracted
  fields; mark uncertain fields individually; one clarification question at a
  time; "Confirm draft" visually distinct from "Save edit"; state explicitly
  that inventory only changes after confirmation.
- **Inventory/stockout:** show current stock, estimated days remaining,
  recommended reorder; warning uses text+icon, not color alone.
- **Offer comparison:** compare landed cost, MOQ, delivery, affordability,
  expected margin in aligned rows/columns; highlight a recommendation without
  hiding tradeoffs; exact MAD amounts always visible.
- **Collective-order approval:** merchant's own quantity, original vs.
  collective price, product/delivery/total saving, conditions, deadline.
  "Join" is a separate action from final "Approve." Never reveal another
  merchant's identity/sales/cash.
- **Supplier dashboard:** lead with qualified demand and actionable
  opportunities; aggregated demand only, no merchant-level detail; reuse
  merchant dashboard component patterns where the shape matches.
- **Agent/tool timeline:** violet reserved for AI reasoning/tool selection;
  normal semantic colors for deterministic results; chronological
  running/complete/warning/failed states; raw JSON collapsed by default.
- **Final impact screen:** the one screen allowed a restrained animated
  reveal; max 5 impact metrics; lead with total saving + stockout prevented;
  closing line readable from a projector.

## 6.9 Data display

- Currency always shown: `1,234.50 MAD` (never an icon alone).
- Dates: `24 Jul 2026`. Time: 24-hour.
- Charts via Recharts: line/area for trends, bar for category comparison,
  donut only ≤5 categories. No 3D, gauges, or decorative backgrounds. Blue
  palette first; semantic color only when meaning requires it — never rely
  on red vs. green alone. Units on axes, exact values in tooltips. Default
  view: last 7 days. Provide a text/table alternative near every chart.

## 6.10 AI/draft visual sequence

Preserve this hierarchy visually on every relevant screen:

`Evidence → AI draft → validation → human confirmation → official record`

Label AI-created records `Draft`, `Suggested`, or `AI explanation`. Once
confirmed, return to the normal blue/neutral system — don't leave a violet
tint on confirmed data. Order approval is always a separate explicit action
from joining/drafting.

## 6.11 Motion

Intensity ~5/10 — noticeable, never constant. Fast feedback 150ms, standard
200–250ms, complex reveal 300–400ms max. Animate transform/opacity only
(avoid width/height/top/left). Concentrate richer motion in: evidence→draft
transition, agent timeline progress, offer-comparison reveal, collective-
order savings calculation, final impact screen — one or two focal animated
elements per view elsewhere. Respect `prefers-reduced-motion` everywhere.

## 6.12 Accessibility

WCAG 2.2 AA contrast. Semantic HTML + shadcn's built-in ARIA behavior (don't
strip it). 44×44px minimum interactive target, 8px minimum gap between
adjacent compact targets. Fully keyboard operable, visible focus ring using
the `focus` token. Icon-only controls need accessible names. Correct heading
order. `aria-live="polite"` for non-blocking status, `role="alert"` for
actionable errors. Move focus to the main heading after route navigation.
Never rely on hover-only information; never disable browser zoom.

## 6.13 Code organization

- Shared primitives → `apps/web/src/components/ui/`
- Shared product-level components → `apps/web/src/components/shared/`
- Feature-specific compositions stay inside their feature directory
  (`features/merchant`, `features/supplier`, `features/ingestion`,
  `features/inventory`, `features/procurement`, `features/group-orders`).
- Tokens are centralized in the Tailwind/CSS config — feature components
  consume token names, never hex.
- Don't add a second button/card/modal/toast/badge/chart system — request a
  variant of the existing shared one instead.

## 6.14 Quick rejection checklist

Revise before shipping if a screen introduces: a raw color in a feature
component · a new font/icon family · a one-off button/card/dialog/badge
style · white text on `brand-500` · an AI recommendation styled as confirmed
· a primary action under 44px · missing loading/empty/failure states ·
essential info only on hover · more than two animated focal elements at once
· unexplained cross-org data exposure · a mobile-first redesign conflicting
with the desktop-first P0 shell.

---

# 7. Using this with an AI coding session

1. Load this file at the start of a session. Reach for the full
   `design_system.md` only when you need something this file compresses
   (exact contrast-ratio numbers, the complete component-stack license notes,
   the open-brand-decisions list).
2. Ask for one screen/component at a time against Section 5's contract and
   Section 6.8's screen notes, rather than "build the merchant portal."
3. If the backend endpoint you need isn't ready, ask for a typed mock
   matching Section 5 rather than improvising a different shape.
