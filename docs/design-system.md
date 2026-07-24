# MIZAN Souq UI and UX standards

> Status: Hackathon design contract
> Product name: **MIZAN Souq** is a working name and remains subject to change.
> Repository/team name: **GemmaPunks**
> Primary surface: desktop-first responsive web application
> Theme: light only for the hackathon MVP

This document is the visual and interaction source of truth for every
GemmaPunks contributor. Merchant, supplier, AI, and shared screens must look
and behave like parts of one product even when different people build them.

If a component or external example conflicts with this document, this document
wins. A deliberate exception must be explained in the related pull request.

## 1. Product character

The interface must feel:

- Trustworthy.
- Intelligent.
- Modern.
- Interactive.
- Premium.
- Simple enough for a busy merchant to understand quickly.

The interface must not feel:

- Like a traditional bank portal.
- Like a generic admin template.
- Playful at the expense of financial clarity.
- Futuristic at the expense of usability.
- Crowded with gradients, glass, shadows, or animation.
- Different between the merchant and supplier portals.

The visual system is modern and data-rich. Premium quality comes from
hierarchy, alignment, typography, restrained depth, and meaningful motion—not
from decorating every surface.

## 2. Non-negotiable principles

1. Use shared semantic tokens; do not place raw hex values in feature
   components.
2. Build shared primitives once and reuse them.
3. Use one primary call to action per screen or focused panel.
4. Treat AI output as a draft or recommendation until a human confirms it.
5. Show loading, empty, error, disabled, and success states where applicable.
6. Do not communicate status using color alone; add text and/or an icon.
7. Meet WCAG AA contrast and keyboard-accessibility requirements.
8. Use Lucide SVG icons, never emoji as structural interface icons.
9. Preserve financial precision and always display the currency.
10. Prefer clarity over novelty in forms, prices, approvals, and destructive
    actions.

## 3. Brand identity

### 3.1 Naming

Until the final name is approved:

- Use `MIZAN Souq` as the working product label in product mockups.
- Use `GemmaPunks` only for repository, engineering, and team references.
- Keep the product-name element replaceable; do not bake the wordmark into
  illustrations or complex SVG assets.

### 3.2 Logo

No official logo exists yet. Use a plain text wordmark in Inter Semibold until
brand assets are approved. Do not create an unofficial permanent logo inside a
feature branch.

### 3.3 Moroccan identity

Moroccan red `#C1272D` and green `#006233` may appear only as subtle brand
details, such as a small accent line, presentation motif, or approved wordmark
detail.

They must not:

- Become the main application palette.
- Replace semantic error or success colors.
- Appear together on every card or screen.
- Reduce contrast or compete with business data.

## 4. Color system

### 4.1 Core blue palette

| Token | Hex | Intended use |
|---|---|---|
| `brand-950` | `#03045E` | Deep emphasis, primary text accents, primary hover |
| `brand-700` | `#0077B6` | Primary actions, active navigation, links |
| `brand-500` | `#00B4D8` | Interactive accent, charts, focus details |
| `brand-200` | `#90E0EF` | Selected rows, highlighted regions, soft charts |
| `brand-100` | `#CAF0F8` | Informational surfaces and subtle brand backgrounds |

### 4.2 Neutral and semantic tokens

| Token | Value | Intended use |
|---|---|---|
| `background` | `#F8FAFC` | Application background |
| `surface` | `#FFFFFF` | Cards, dialogs, tables, navigation |
| `surface-subtle` | `#F1F5F9` | Secondary regions, headers, grouped controls |
| `foreground` | `#0F172A` | Primary text |
| `foreground-muted` | `#475569` | Secondary text and metadata |
| `border` | `#CBD5E1` | Default borders and dividers |
| `border-strong` | `#94A3B8` | Emphasized boundaries |
| `primary` | `#0077B6` | Primary button and active state |
| `primary-hover` | `#03045E` | Primary hover and pressed state |
| `primary-subtle` | `#CAF0F8` | Selected and informational backgrounds |
| `ai` | `#6D28D9` | Gemma, agent, and recommendation identity |
| `ai-subtle` | `#F5F3FF` | AI draft and explanation background |
| `success` | `#047857` | Confirmed success and positive state |
| `success-subtle` | `#ECFDF5` | Success background |
| `warning` | `#B45309` | Warning and attention state |
| `warning-subtle` | `#FFFBEB` | Warning background |
| `danger` | `#B91C1C` | Destructive action and error |
| `danger-subtle` | `#FEF2F2` | Error background |
| `info` | `#0369A1` | Neutral informational state |
| `info-subtle` | `#F0F9FF` | Informational background |
| `focus` | `#0077B6` | Keyboard focus ring |

### 4.3 Approved foreground pairings

- Use white text on `brand-700` and `brand-950`.
- Use `brand-950` or `foreground` text on `brand-500`, `brand-200`, and
  `brand-100`.
- Never use white body-sized text on `brand-500`; its contrast is insufficient.
- Never use `brand-200` or `brand-100` for text on white.
- Muted text is for supporting information, not primary instructions.

Reference contrast ratios:

- `#FFFFFF` on `#0077B6`: 4.87:1.
- `#FFFFFF` on `#03045E`: 17.75:1.
- `#03045E` on `#00B4D8`: 7.20:1.
- `#03045E` on `#90E0EF`: 11.92:1.
- `#03045E` on `#CAF0F8`: 14.65:1.

### 4.4 Portal accents

Merchant and supplier experiences use the same components, typography, and
layout.

- Merchant emphasis: `brand-700`.
- Supplier emphasis: `brand-500`, paired with dark text where text is present.
- AI emphasis: `ai`.

Portal accents may identify context, but they must not create two separate
themes.

## 5. Typography

### 5.1 Font families

- Latin UI: Inter.
- Arabic and Darija content: Noto Sans Arabic.
- Numeric tables: Inter with `font-variant-numeric: tabular-nums`.
- Code, IDs, and tool payloads: system monospace.

Use `font-display: swap` and a metrically similar system fallback to avoid
invisible text and layout shift.

### 5.2 Type scale

| Role | Desktop size | Weight | Line height |
|---|---:|---:|---:|
| Display/impact value | 40–48 px | 700 | 1.1 |
| Page title | 30–36 px | 700 | 1.2 |
| Section title | 22–24 px | 600 | 1.3 |
| Card title | 18 px | 600 | 1.4 |
| Body | 16 px | 400 | 1.5 |
| Small/metadata | 14 px | 400–500 | 1.45 |
| Label/caption | 12 px | 500–600 | 1.4 |

Do not use body text below 14 px. Twelve-pixel text is reserved for short
labels, badges, and secondary chart annotations.

### 5.3 Numeric presentation

- Use tabular figures for money, quantities, percentages, dates in tables, and
  KPI values.
- Right-align numeric table columns.
- Do not use decorative monospace for normal prices.
- Keep units visually attached to their values.

## 6. Language and content

### 6.1 Hackathon language

- The primary interface language is English.
- The document direction is LTR for the hackathon MVP.
- Darija and French may appear inside evidence, transcriptions, clarifications,
  and AI explanations.
- Preserve the source language instead of silently translating evidence.
- Use `lang` and `dir="auto"` on user-provided or model-extracted text.
- Prefer logical CSS properties such as `margin-inline` and `padding-inline`
  when practical so future RTL support is not blocked.

Full translated navigation and full RTL layout are post-hackathon work.

### 6.2 Voice

Use short, plain, bilingual-friendly sentences. Explain business meaning
without accounting jargon.

Preferred:

- “You may run out in 4 days.”
- “Confirm this draft before stock changes.”
- “Joining saves you 100 MAD.”

Avoid:

- “Inventory depletion threshold exceeded.”
- “The model executed an autonomous write.”
- Long paragraphs inside dashboards.

Use sentence case for titles, buttons, table headings, and labels. Do not use
all caps except for very short technical statuses or currency codes.

## 7. Layout

### 7.1 Primary target

The product is desktop-first for a projector demonstration.

- Optimize the main demo at 1440×900 and 1920×1080.
- The interface must remain usable at 1024 px wide.
- Maintain a functional responsive fallback down to 375 px, but do not build a
  separate mobile navigation system during P0.
- Use a maximum content width of 1600 px.
- Use 24–32 px desktop page gutters and 16 px narrow-screen gutters.

Projector rules:

- Keep key information above the fold.
- Do not depend on fine borders or very pale text.
- Avoid tiny chart labels and crowded legends.
- Use larger primary values and clear selected states.
- Do not depend on hover to reveal essential information.

### 7.2 Application shell

Use one shared application shell:

- Persistent left sidebar on desktop: 240–264 px.
- Top bar for page identity, organization context, and account actions.
- Main content uses a predictable page header followed by content sections.
- Narrow layouts collapse the sidebar into a drawer.
- Navigation position must not change between pages.

The merchant and supplier portals may expose different destinations but must
use the same shell dimensions and interaction patterns.

### 7.3 Grid

- Use a 12-column desktop grid for complex screens.
- Use four KPI cards per row at large widths, two at medium widths, and one at
  narrow widths.
- Prefer 2:1 or 2:2 dashboard compositions over irregular card mosaics.
- Bento layouts are allowed only when they preserve reading order and data
  hierarchy.
- Avoid nested scroll containers unless a table genuinely requires one.

## 8. Spacing, shape, and elevation

### 8.1 Spacing scale

Use only this 4/8-based scale:

`4, 8, 12, 16, 24, 32, 48, 64`

Common applications:

- Icon-to-label gap: 8 px.
- Form field gap: 16 px.
- Card padding: 20–24 px.
- Card-to-card gap: 16–24 px.
- Section gap: 32–48 px.
- Page top/bottom padding: 24–32 px.

Do not invent one-off values unless required by an external asset.

### 8.2 Radius

The interface is moderately rounded:

- Small badges and compact controls: 8 px.
- Buttons, inputs, and standard controls: 12 px.
- Cards, tables, dialogs, and drawers: 16 px.
- Hero and final-impact panels: 20 px.
- Pills are reserved for statuses, segmented controls, and compact filters.

### 8.3 Shadows and effects

- Default cards use a border with little or no shadow.
- Raised cards use one shared soft shadow.
- Dialogs and popovers use a stronger shared elevation.
- Glass is allowed only for overlays or one showcase surface.
- Use blur to separate foreground layers, not as a background decoration.
- Avoid neon glows, heavy inner shadows, and multiple competing gradients.

Approved gradient usage:

- One subtle blue gradient may appear in the login, AI timeline header, or final
  impact panel.
- Gradients must not sit behind dense text or financial tables.

## 9. Icons and imagery

- Use Lucide React for interface icons.
- Use one consistent outline style and stroke weight.
- Standard icon sizes: 16 px, 20 px, and 24 px.
- Icon-only buttons must have an accessible name and at least a 44×44 px hit
  area.
- Do not use emoji for navigation, actions, status, or product categories.
- Do not mix multiple icon libraries within the application shell.
- Use real synthetic receipt/product images only when they support the demo
  story.
- Avoid generic stock photography inside operational dashboards.

## 10. Shared component standards

### 10.1 Component stack

Approved sources:

- shadcn/ui for functional primitives.
- Lucide React for icons.
- Recharts for charts.
- Animate UI and Motion Primitives for selected motion.
- Cult UI and Kokonut UI only after license review.

External components are starting material, not exceptions. Before use they must:

1. Use MIZAN semantic tokens.
2. Use the approved typography and radius.
3. Support keyboard and screen-reader interaction.
4. Respect reduced motion.
5. Include required states.
6. Avoid additional icon libraries.
7. Be placed in the shared component layer when reusable.

Do not copy a component with its demo colors, font, gradients, or page
background intact.

### 10.2 Buttons

Approved variants:

- Primary: one per focused region.
- Secondary: alternative non-destructive action.
- Outline: lower-priority utility action.
- Ghost: compact navigation or toolbar action.
- Destructive: irreversible or high-risk action.
- AI: violet recommendation/action, never automatic confirmation.

Rules:

- Minimum height: 44 px.
- Use a leading icon only when it improves recognition.
- Use an icon plus label for consequential actions.
- Disable repeated submission while loading.
- Keep the label visible during loading when space allows.
- “Confirm” and “Approve” must state what is being confirmed or approved.

### 10.3 Forms

- Every control has a visible label.
- Placeholder text is an example, never the only label.
- Validate on blur or submit, not aggressively on every keystroke.
- Place the error directly below the related field.
- Focus the first invalid field after a failed submit.
- Mark required fields consistently.
- Use helper text for unfamiliar financial or inventory concepts.
- Confirm before dismissing an edited extraction draft.
- Use controlled React form components through React Hook Form and Zod.

### 10.4 Cards

Every card has a clear purpose and may contain:

- One heading.
- Optional supporting label.
- One main content group.
- At most one primary card action.

Do not nest multiple decorative cards merely to create depth.

### 10.5 Tables

- Keep headers visible and concise.
- Right-align numbers; left-align names and descriptions.
- Use a consistent row height of at least 48 px.
- Provide hover and keyboard-focus states.
- Use zebra striping only when it materially improves dense-table scanning.
- Place filters above the table, not inside column headings unless sortable.
- On narrow screens, prioritize or collapse columns instead of shrinking text.

### 10.6 Status badges

Badges always include text. Approved semantic families:

- Draft/AI: violet.
- Pending/warning: amber.
- Confirmed/success: emerald.
- Failed/danger: red.
- Neutral/inactive: slate.
- Informational: blue.

Do not use a green badge for an AI suggestion that has not been confirmed.

### 10.7 Dialogs, sheets, and popovers

- Use dialogs for focused confirmation or clarification.
- Use sheets for secondary detail that should preserve page context.
- Do not place primary navigation in a dialog.
- Provide a visible close/cancel route.
- Return keyboard focus to the trigger on close.
- Separate destructive actions from normal actions.
- Use a 40–60% black scrim with sufficient foreground contrast.

### 10.8 Feedback

- Use skeletons when loading takes longer than 300 ms and the final shape is
  predictable.
- Use a spinner for short indeterminate actions.
- Use progress for extraction or multi-step processing.
- Toasts provide secondary confirmation and must not replace visible state.
- Error messages state what happened and how to recover.
- Empty states explain why the area is empty and present one useful next action.

## 11. Page standards

### 11.1 Login

- Minimal shell with text wordmark and one focused sign-in card.
- One restrained brand gradient or blue illustration is allowed.
- No dashboard navigation before authentication.

### 11.2 Merchant dashboard

Priority order:

1. Current business status.
2. Recommended next action.
3. Inventory risk.
4. Sales/profit trend.
5. Recent activity.

Use no more than four top-level KPIs. Alerts must include cause, consequence,
and action.

### 11.3 Evidence upload

- Make accepted formats and size limits visible.
- Show upload and extraction as distinct steps.
- Preserve a preview of the original evidence.
- Do not imply that uploading modifies official records.

### 11.4 Draft review and clarification

- Present source evidence and extracted fields in a clear comparison.
- Mark uncertain fields individually.
- Show one clarification question at a time.
- Keep “Confirm draft” visually distinct from “Save edit.”
- State explicitly that inventory changes only after confirmation.

### 11.5 Inventory and stockout

- Show current stock, estimated days remaining, and recommended reorder.
- Use text and icon in addition to warning color.
- Explain the inputs used by the forecast.

### 11.6 Offer comparison

- Compare landed cost, MOQ, delivery, affordability, and expected margin using
  aligned rows or columns.
- Highlight a recommendation without hiding tradeoffs.
- Never rank by unexplained AI opinion.
- Keep exact MAD amounts visible.

### 11.7 Collective-order approval

- Show the merchant’s own quantity.
- Show original and collective prices.
- Show product saving, delivery saving, total saving, conditions, and deadline.
- Separate “Join” from final “Approve.”
- Do not reveal another merchant’s private identity, sales, or cash.

### 11.8 Supplier dashboard

- Lead with qualified demand and actionable opportunities.
- Show aggregated demand, not private merchant details.
- Reuse merchant dashboard components where the information pattern matches.

### 11.9 Agent/tool timeline

- Use violet only for Gemma reasoning, draft creation, and tool selection.
- Use normal semantic colors for deterministic tool results.
- Use a chronological step pattern with clear running, complete, warning, and
  failed states.
- Tool payload details may expand on demand; do not show raw JSON by default.

### 11.10 Final impact screen

- This is the most expressive P0 screen.
- One restrained animated reveal is allowed.
- Show no more than five impact metrics.
- Lead with total saving and stockout prevention.
- Keep the closing line readable from a projector.

## 12. Data display

### 12.1 Formatting

- Currency: `1,234.50 MAD`.
- Always include `MAD`; never rely on a currency icon alone.
- Quantities: use whole numbers unless the product is sold fractionally.
- Percentages: zero or one decimal place according to meaningful precision.
- Dates: `24 Jul 2026`.
- Time: 24-hour format.
- Use locale-aware formatting utilities; do not concatenate separators manually.

### 12.2 Charts

- Use Recharts through shared wrappers.
- Trend over time: line or area chart.
- Category comparison: horizontal or vertical bar chart.
- Composition: donut only for five or fewer categories.
- Avoid 3D charts, gauges, and decorative chart backgrounds.
- Use the blue palette first; add semantic color only when meaning requires it.
- Do not rely on red versus green alone.
- Display units on axes and exact values in tooltips.
- Default dashboard view: last seven days, with daily points.
- Provide a nearby text summary or data table alternative.
- Use skeleton and error states instead of blank chart frames.
- Respect reduced-motion preferences.

## 13. AI, drafts, and approval safety

The visual hierarchy must preserve this sequence:

`Evidence → AI draft → validation → human confirmation → official record`

Rules:

- Violet identifies AI origin, never correctness or confirmation.
- Label all AI-created records `Draft`, `Suggested`, or `AI explanation`.
- Confirmed business data returns to the normal blue/neutral system.
- Human confirmation uses an explicit standard primary action.
- Order approval requires a separate explicit action.
- Uncertain values display confidence or a plain-language uncertainty label.
- Never animate a draft directly into a confirmed state without showing the
  human action that caused the transition.
- Never use “Completed” when the correct state is “Ready for review.”

## 14. Motion

Motion intensity is 5/10: noticeable and polished, never constant.

### 14.1 Tokens

- Fast feedback: 150 ms.
- Standard transition: 200–250 ms.
- Complex reveal: 300–400 ms maximum.
- Enter: ease-out.
- Exit: ease-in and approximately 60–70% of the enter duration.
- Animate transform and opacity; avoid width, height, top, and left.

### 14.2 Approved expressive moments

Concentrate richer motion in:

- Evidence becoming a structured draft.
- Gemma tool-call timeline progress.
- Offer-comparison recommendation reveal.
- Collective-order savings calculation.
- Final impact screen.

Use only one or two animated focal elements per view. Financial forms,
confirmation dialogs, tables, and destructive actions remain restrained.

### 14.3 Reduced motion

Every animation must respect `prefers-reduced-motion`. Reduced mode must remove
parallax, large transforms, stagger, and nonessential autoplay while preserving
state feedback.

## 15. Interaction and accessibility

- Meet WCAG 2.2 AA contrast targets.
- Use semantic HTML and shadcn primitives without replacing their ARIA behavior.
- Minimum interactive target: 44×44 px.
- Maintain at least 8 px between adjacent compact targets.
- All functionality must be keyboard accessible.
- Focus rings must remain visible and use the shared focus token.
- Icon-only controls require accessible names and tooltips when meaning is not
  obvious.
- Use correct heading order.
- Images require meaningful alt text or empty alt text when decorative.
- Charts need a text summary or table alternative.
- Use `aria-live="polite"` for non-blocking status updates.
- Use `role="alert"` for actionable errors.
- Move focus to the main heading after route navigation.
- Do not rely on hover-only information.
- Never disable browser zoom.

## 16. Performance and stability

- Reserve space for charts, previews, and async content to avoid layout shift.
- Lazy-load below-the-fold images and heavy dialog content.
- Prefer SVG for icons and WebP/AVIF for photographic assets.
- Declare image dimensions or aspect ratios.
- Avoid large animation libraries for one simple transition.
- Do not import multiple libraries that solve the same component problem.
- Profile before introducing memoization or complex rendering optimization.
- Ensure the projector demo remains functional with fixture data and slow
  network conditions.

## 17. Code organization contract

When implementation begins:

- Primitive shared components live in `apps/web/src/components/ui/`.
- Product-level shared components live in
  `apps/web/src/components/shared/`.
- Feature compositions remain inside their feature directory.
- Semantic tokens are defined centrally in Tailwind/CSS configuration.
- Feature components consume semantic token names, not palette hex values.
- Do not fork a shared component inside a feature to make a small visual change;
  add an approved variant instead.
- Do not add a second button, card, modal, toast, badge, or chart system.

The current dark scaffold tokens are temporary and must be replaced by the
approved light semantic token system when UI implementation begins.

## 18. Team workflow and enforcement

### 18.1 Ownership

- Rabii owns supplier UI and shared UI consistency.
- Asttr0 owns merchant UI and cross-stack integration.
- Rabii and Asttr0 coordinate changes to shared primitives.
- Other contributors reuse shared components and request a new variant instead
  of creating a parallel visual language.

### 18.2 Before starting a screen

1. Read this document.
2. Identify an existing page or shared component to reuse.
3. List any new shared primitives the screen requires.
4. Confirm the page hierarchy and one primary action.
5. Implement all required states, not only the success state.

### 18.3 UI pull-request evidence

Every UI pull request must include:

- Screenshot at 1440 px width.
- Screenshot or test at 1024 px width.
- List of reused and newly introduced shared components.
- Loading, empty, error, and disabled-state evidence when applicable.
- Keyboard/focus test notes.
- Reduced-motion test notes when animation is added.
- Confirmation that no raw colors or unapproved icon libraries were added.

Passing CI checks are required by repository policy; a human review is optional.
Visual standards still apply even when no reviewer is required.

### 18.4 Definition of done for UI

- Matches the shared shell and page hierarchy.
- Uses approved tokens, typography, spacing, radii, icons, and motion.
- Has no console errors or obvious layout shift.
- Works at the projector target and at 1024 px.
- Is usable with keyboard only.
- Meets contrast and touch-target requirements.
- Includes required async and recovery states.
- Keeps AI drafts visually distinct from confirmed data.
- Works in the shared deployment with seeded demo data.

## 19. Quick rejection checklist

Reject or revise a UI change if it introduces:

- A new raw color in a feature component.
- A new font or icon family.
- A one-off button, card, dialog, badge, toast, or chart style.
- White text on `brand-500`.
- An AI recommendation styled as confirmed.
- A primary action below 44 px high.
- Missing loading, empty, or failure behavior.
- Essential information available only on hover.
- More than two animated focal elements on one screen.
- Unexplained merchant or supplier data exposure.
- A mobile-first redesign that conflicts with the desktop-first P0 shell.
- A visual effect that harms projector readability.

## 20. Open brand decisions

The following items remain intentionally open and do not block UI development:

- Final product name.
- Official logo and wordmark.
- Permanent bilingual navigation strategy.
- Full RTL implementation.
- Post-hackathon light/dark theme expansion.

When one of these decisions is approved, update this document first and then
update shared tokens/components.
