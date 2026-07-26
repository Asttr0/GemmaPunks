# MIZAN Souq frontend component research

> Status: frontend implementation guide  
> Scope: React, Vite, Tailwind CSS, shadcn/ui, charts, icons, and motion  
> Important: this document does not replace
> [`design-system.md`](./design-system.md). If the two documents disagree, the
> design system wins.

This document explains which public components we can use, where they fit, and
which effects we should avoid.

The goal is not to use as many libraries as possible. The goal is to make one
consistent product that feels trustworthy, intelligent, modern, and premium.

## 1. Important compatibility warning

The web application currently uses:

- React 19.
- Vite 7.
- Tailwind CSS 3.4.

Most current shadcn/ui and animated-component websites now publish code for
Tailwind CSS 4. Their examples may use Tailwind 4 syntax such as:

- `@theme`.
- `@custom-variant`.
- `bg-linear-to-r`.
- New registry CSS that does not work in Tailwind 3.

Do not run the latest registry command and accept every generated change
without reviewing it.

For our Tailwind 3 application:

1. Use the Tailwind 3 shadcn guide.
2. Prefer `shadcn@2.3.0` when using the CLI.
3. Inspect every generated file before keeping it.
4. Copy only the component we need.
5. Replace demo colors, fonts, radii, and shadows with MIZAN tokens.
6. Manually convert Tailwind 4 utilities when borrowing newer components.
7. Never let a registry command overwrite customized shared components.

Official references:

- [shadcn Vite guide for Tailwind 3](https://v3.shadcn.com/docs/installation/vite)
- [shadcn Tailwind 4 compatibility notes](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn components configuration](https://v3.shadcn.com/docs/components-json)

## 2. Chosen frontend stack

Use a small stack with one clear owner for each job.

| Need                        | Chosen tool                     | How we use it                                                                            |
| --------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| Styled interface components | shadcn/ui                       | Buttons, cards, dialogs, forms, tables, sidebar, sheets, badges, and feedback            |
| Accessible behavior         | Radix UI                        | Keyboard navigation, focus management, ARIA behavior, menus, dialogs, tabs, and popovers |
| Styling                     | Tailwind CSS 3.4                | Layout, responsive behavior, spacing, and semantic tokens                                |
| Animation                   | Motion for React                | All custom transitions and animated state changes                                        |
| Icons                       | Lucide React                    | The only application icon family                                                         |
| Charts                      | Recharts                        | Sales, profit, stock, demand, and savings charts                                         |
| Data tables                 | TanStack Table                  | Sorting, filtering, pagination, and typed table state                                    |
| File selection              | react-dropzone                  | Receipt, audio, image, PDF, and CSV selection                                            |
| Toasts                      | Sonner                          | Secondary success or error feedback                                                      |
| Optional copied animation   | Animate UI or Motion Primitives | One carefully selected component at a time                                               |
| Final demo effect           | Magic UI, optional              | A number ticker or one short confetti burst only                                         |

### Why Radix is important

Radix handles difficult interaction details such as keyboard navigation, focus
management, labels, and expected WAI-ARIA behavior. We should not rebuild those
details from scratch for dialogs, menus, tabs, or popovers.

- [Radix introduction](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

### One animation engine

Use the `motion` package for custom animation. Do not add GSAP or another large
animation engine.

At the root of the application, Motion should respect the operating system's
reduced-motion setting:

```tsx
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```

Official references:

- [Motion for React](https://motion.dev/docs/react)
- [Motion accessibility](https://motion.dev/docs/react-accessibility)
- [Motion with Tailwind](https://motion.dev/docs/react-tailwind)

## 3. Public component sources

### Approved foundation

#### shadcn/ui

Use shadcn for normal application components. It is our primary source.

Useful pages:

- [All shadcn components](https://ui.shadcn.com/docs/components)
- [Sidebar](https://ui.shadcn.com/docs/components/sidebar)
- [Data table](https://ui.shadcn.com/docs/components/data-table)
- [Charts](https://ui.shadcn.com/docs/components/chart)
- [Resizable panels](https://ui.shadcn.com/docs/components/resizable)
- [Dialog](https://ui.shadcn.com/docs/components/dialog)
- [Alert dialog](https://ui.shadcn.com/docs/components/alert-dialog)
- [Sheet](https://ui.shadcn.com/docs/components/sheet)
- [Collapsible](https://ui.shadcn.com/docs/components/collapsible)
- [Progress](https://ui.shadcn.com/docs/components/progress)
- [Skeleton](https://ui.shadcn.com/docs/components/skeleton)
- [Sonner](https://ui.shadcn.com/docs/components/sonner)

#### Lucide

Use Lucide for navigation, actions, status, files, products, money, and AI
timeline icons. Do not mix Lucide with another icon library.

- [Lucide icon browser](https://lucide.dev/icons/)
- [Lucide React guide](https://lucide.dev/guide/packages/lucide-react)

#### Recharts

Use Recharts through shared MIZAN chart wrappers. Keep charts simple and
readable from a projector.

- [Recharts guide](https://recharts.github.io/en-US/guide/)
- [Recharts API](https://recharts.github.io/en-US/api/)
- [Recharts animations and reduced motion](https://recharts.github.io/en-US/guide/animations/)

Use `accessibilityLayer` on charts. Keep the default animation behavior so
Recharts can respect `prefers-reduced-motion`.

#### TanStack Table

Use TanStack Table for transactions, inventory, catalogs, opportunities, and
offers. The shared table component should provide the visual styling.

- [TanStack Table React documentation](https://tanstack.com/table/latest/docs/framework/react)
- [TanStack Table examples](https://tanstack.com/table/latest/docs/framework/examples)

#### react-dropzone

Use react-dropzone for file-selection behavior, then build the visible surface
with MIZAN cards, icons, and text.

- [react-dropzone guide](https://react-dropzone.org/guide/getting-started/)
- [react-dropzone website](https://react-dropzone.js.org/)

### Approved selective animation sources

These sources are not complete application themes. Copy one useful component,
adapt it, and keep it in our shared component layer.

#### Animate UI

Good candidates:

- Animated progress.
- Counting number.
- Fade.
- Animated accordion or collapsible.

References:

- [Animate UI introduction](https://animate-ui.com/docs)
- [Animate UI components](https://animate-ui.com/docs/components)
- [Animate UI primitives](https://animate-ui.com/docs/primitives)
- [Animate UI accessibility](https://animate-ui.com/docs/accessibility)
- [Animate UI counting number](https://animate-ui.com/docs/primitives/texts/counting-number)
- [Animate UI progress](https://animate-ui.com/docs/primitives/radix/progress)

Warning: inspect and manually port the source for Tailwind 3.

#### Motion Primitives

Good candidate:

- Animated Number for one important savings or KPI reveal.

References:

- [Motion Primitives documentation](https://motion-primitives.com/docs)
- [Animated Number](https://motion-primitives.com/docs/animated-number)

Motion Primitives is still marked beta. Do not use its dialog for financial
confirmation. Use the Radix/shadcn alert dialog instead.

#### Magic UI

Good candidates:

- Number Ticker on the final impact screen.
- One short confetti burst after an explicit successful approval.
- Blur Fade for one final-screen reveal.

References:

- [Magic UI documentation](https://magicui.design/docs)
- [Number Ticker](https://magicui.design/docs/components/number-ticker)
- [Confetti](https://magicui.design/docs/components/confetti)
- [Blur Fade](https://magicui.design/docs/components/blur-fade)

Warning: current Magic UI examples commonly use Tailwind 4. Copy and adapt the
source manually. Never install an entire template.

## 4. Interface-by-interface component map

The priority labels are:

- **P0:** required for the live demo.
- **P1:** build after the complete demo path is stable.
- **P2:** later product work.

### Shared and authentication interfaces

| Interface                        | Priority | Components                                                                                            | Motion                                   |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Sign in `/login`                 | P0       | shadcn `Card`, `Form`, `Input`, `Button`, and `Alert`; Lucide `Store`, `Building2`, and `ShieldCheck` | One 200 ms fade and small upward slide   |
| Registration `/register`         | P1       | `Form`, `RadioGroup`, `Progress`, and business-role cards                                             | Crossfade between form steps             |
| Shared application shell         | P0       | `Sidebar`, `Breadcrumb`, `DropdownMenu`, `Avatar`, `Sheet`, and `Tooltip`                             | A 200 ms narrow-screen drawer transition |
| Profile and settings `/settings` | P2       | `Tabs`, `Form`, `Select`, and `Separator`                                                             | Normal 150–200 ms state transitions only |

The application shell must remain stable. Do not animate the full sidebar on
every route change.

### Merchant interfaces

| Interface                                                | Priority | Components                                                                                                                         | Motion                                                                            |
| -------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Merchant dashboard `/merchant/dashboard`                 | P0       | Four `MetricCard` components, `Badge`, `Alert`, Recharts `AreaChart`, and action cards                                             | Optional number animation on the first demo entry only                            |
| Evidence upload `/merchant/evidence/new`                 | P0       | react-dropzone, `Card`, `Tabs` or `ToggleGroup`, `Progress`, and file preview                                                      | Border and background response while dragging; no looping upload animation        |
| Extraction workspace `/merchant/ingestions/:id`          | P0       | `Resizable`, evidence preview, field cards, `Accordion`, `Collapsible`, clarification `Dialog`, and `Progress`                     | Extracted fields may appear with a 30–40 ms stagger; one finite running indicator |
| Draft confirmation state                                 | P0       | `AlertDialog`, confirmed-record summary, inventory-movement summary, and Sonner                                                    | Short checkmark and opacity transition after the API succeeds                     |
| Transactions `/merchant/transactions`                    | P1       | Shared TanStack/shadcn `DataTable`, date filter, `Popover`, `Badge`, and row-action menu                                           | No table entrance animation                                                       |
| Inventory `/merchant/inventory`                          | P0       | Shared `DataTable`, search, status badge, small Recharts sparkline, and detail `Sheet`                                             | Subtle row highlight only                                                         |
| Product detail `/merchant/inventory/:productId`          | P0       | KPI cards, `AreaChart`, stockout `Alert`, explanation `Accordion`, and stock runway `Progress`                                     | Use the normal Recharts animation behavior                                        |
| Procurement needs `/merchant/procurement`                | P1       | `DataTable` or compact need cards, filters, urgency badge, and status tabs                                                         | Standard hover/focus transition                                                   |
| Offer comparison `/merchant/procurement/:needId/compare` | P0       | Aligned comparison `Table` or cards, `RadioGroup`, `Tooltip`, and recommendation badge                                             | Motion layout transition when the recommendation is revealed                      |
| Group orders `/merchant/group-orders`                    | P1       | `Tabs`, group-order cards, MOQ `Progress`, and deadline badge                                                                      | Progress changes only                                                             |
| Group-order decision `/merchant/group-orders/:id`        | P0       | Original and collective price cards, MOQ progress, anonymous participant indicators, savings breakdown, and approval `AlertDialog` | Animate 20 to 55 units and one 100 MAD total; separate Join and Approve actions   |

Suggested merchant icons:

- `LayoutDashboard`.
- `ReceiptText`.
- `Mic`.
- `UploadCloud`.
- `Package`.
- `TriangleAlert`.
- `TrendingUp`.
- `Truck`.
- `Banknote`.
- `UsersRound`.
- `Clock3`.
- `PiggyBank`.
- `ShieldCheck`.

### Supplier interfaces

| Interface                                           | Priority | Components                                                                                         | Motion                                              |
| --------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Supplier dashboard `/supplier/dashboard`            | P0       | Four metric cards, opportunity cards, horizontal Recharts bar chart, and primary action            | One initial metric reveal; no constant chart motion |
| Catalog `/supplier/catalog`                         | P1       | Shared `DataTable`, search, status badges, add-product `Dialog`, and react-dropzone import         | Normal dialog and upload feedback                   |
| Opportunities `/supplier/opportunities`             | P0       | Opportunity cards or `DataTable`, volume badge, deadline, and detail `Sheet`                       | Small card hover/focus response                     |
| Opportunity and quote `/supplier/opportunities/:id` | P0       | Two-column demand summary, React Hook Form fields, `Input`, `Select`, and calculated revenue panel | Crossfade the calculated result when values change  |
| Offers and orders `/supplier/offers`                | P1       | `Tabs`, shared `DataTable`, status badge, and detail `Sheet`                                       | Restrained status transition                        |

Do not use a detailed map in the supplier dashboard unless the backend provides
real geographic data. A clear demand-by-area bar chart is safer for the demo.

### AI and demo interfaces

| Interface                                                    | Priority | Components                                                                                             | Motion                                                                                      |
| ------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Agent run `/agent-runs/:id`                                  | P0       | Semantic ordered timeline, `Collapsible`, `ScrollArea`, status badges, and tool detail panels          | Timeline progress and step fade; raw JSON remains collapsed                                 |
| Final impact `/demo/impact`                                  | P0       | Maximum five metrics, before/after price comparison, savings breakdown, and closing statement          | One number reveal and one short final-screen reveal; optional short confetti after approval |
| Loading, empty, error, offline, unauthorized, and 404 states | P0       | Shared `Skeleton`, `EmptyState`, `ErrorState`, retry button, and status illustration built from Lucide | Short fade only                                                                             |

For the agent timeline:

- Violet means Gemma reasoning, draft creation, or tool selection.
- Blue and neutral colors mean normal product work.
- Green means a successful deterministic result.
- Amber means a warning.
- Red means a failure.
- A Gemma suggestion must never appear as confirmed.

## 5. Shared components to build once

These components should be reused across features:

- `AppShell`.
- `PageHeader`.
- `MetricCard`.
- `StatusBadge`.
- `Money`.
- `Quantity`.
- `DataTable`.
- `ChartContainer`.
- `EmptyState`.
- `ErrorState`.
- `LoadingSkeleton`.
- `StockRiskAlert`.
- `RecommendationCard`.
- `EvidencePreview`.
- `ConfidenceBadge`.
- `AgentTimeline`.
- `OfferComparison`.
- `SavingsBreakdown`.
- `ApprovalDialog`.

This shared layer is more important than importing many external components.
It prevents different contributors from creating different visual styles.

## 6. Where impressive motion belongs

Use expressive motion in only five moments:

1. Evidence becomes a structured draft.
2. The Gemma tool timeline progresses.
3. The recommended supplier offer is revealed.
4. Group demand reaches the supplier minimum and savings are calculated.
5. The final impact screen appears.

Everything else should use simple 150–250 ms transitions.

Good motion:

- Shows cause and effect.
- Helps the user understand a changed state.
- Uses opacity and transform.
- Stops after the state is clear.
- Can be interrupted.
- Respects reduced motion.

Bad motion:

- Loops without meaning.
- Delays the next action.
- Moves financial numbers while the user is reading them.
- Reorders data unexpectedly.
- Hides important information until hover.
- Animates every card on every visit.

## 7. Effects we should not use

Do not add:

- Animated page backgrounds.
- Particle fields behind dashboards.
- Smooth custom cursors.
- Magnetic buttons.
- Rainbow or neon buttons.
- Continuous glowing borders.
- Glass on normal cards.
- 3D charts.
- Globes.
- Marquees.
- Text scrambling on financial values.
- Parallax.
- Large card tilt effects.
- Autoplay video.

These effects may look impressive on a portfolio website, but they reduce trust
and clarity in a business-management product.

## 8. Component review checklist

Before copying an external component, confirm:

- It works with React 19 and Vite.
- Its code has been converted to Tailwind 3 syntax.
- It uses MIZAN semantic tokens instead of raw demo colors.
- It uses Inter and Noto Sans Arabic.
- It uses the approved radius and spacing scale.
- It uses Lucide icons only.
- It works with a keyboard.
- Its focus ring is visible.
- It has an accessible name and description.
- It does not depend on hover for essential content.
- It supports loading, empty, error, disabled, and success states where needed.
- It respects `prefers-reduced-motion`.
- It does not introduce another animation or icon library.
- Its license is compatible and recorded.

## 9. License reference

All selected core sources are free and open source. Preserve their license
notices when code is copied or distributed.

| Project           | License                                        | Official source                                                                             |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| shadcn/ui         | MIT                                            | [License](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)                             |
| Radix UI          | MIT                                            | [Repository](https://github.com/radix-ui/primitives)                                        |
| Motion            | MIT                                            | [Repository](https://github.com/motiondivision/motion)                                      |
| Animate UI        | MIT                                            | [Repository](https://github.com/imskyleen/animate-ui)                                       |
| Magic UI          | MIT                                            | [Repository](https://github.com/magicuidesign/magicui)                                      |
| Motion Primitives | MIT, beta project                              | [Repository](https://github.com/ibelick/motion-primitives)                                  |
| Lucide            | ISC, with some Feather-derived icons under MIT | [License](https://github.com/lucide-icons/lucide/blob/main/LICENSE)                         |
| Recharts          | MIT                                            | [Official guide](https://recharts.github.io/en-US/guide/)                                   |
| TanStack Table    | MIT                                            | [Repository](https://github.com/TanStack/table)                                             |
| react-dropzone    | MIT                                            | [Package source](https://github.com/react-dropzone/react-dropzone/blob/master/package.json) |
| Sonner            | MIT                                            | [Repository](https://github.com/emilkowalski/sonner)                                        |

Do not copy paid Tailwind Plus, Magic UI Pro, Motion Primitives Pro, or other
paid component source into the repository unless the team owns a suitable
license and explicitly approves its use.

## 10. Final rule

An external component is only raw material.

Before it becomes part of MIZAN Souq, it must look, behave, and read like MIZAN
Souq. A smaller number of well-adapted components will produce a better demo
than a large number of unrelated effects.
