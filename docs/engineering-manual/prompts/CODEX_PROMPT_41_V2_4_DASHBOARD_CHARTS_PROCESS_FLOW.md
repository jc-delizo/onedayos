# OneDayOS — Inventory Demo V2 Package V2-4
# Dashboard Charts + Process Flow Diagram V2

V2-3 URL-Addressable Modals has passed:

- dependency security gate
- Supabase admin-key repair
- automated tests
- accessibility tests
- authenticated Org Admin review
- authenticated Warehouse Operator review
- Light / Dark / System review
- mobile-width review
- controlled-demo readiness
- clean production and full dependency audits

The Founder accepts V2-3 and explicitly authorizes **V2-4 only**.

V2-5 through V2-8 remain blocked.

## V2-4 Goal

Upgrade two explanatory/analytical surfaces without changing Inventory transaction semantics:

1. **Inventory Dashboard V2**
   - real charts
   - real KPI summaries
   - clear operational hierarchy
   - accessible data interpretation
   - no fake data

2. **Inventory Process Flow Diagram V2**
   - actual directional flow
   - arrows/connectors
   - responsive diagram
   - semantic text fallback
   - current behavior separated from deferred future workflows
   - no diagram engine

## Completed Preconditions

- V2-1 compact operational headers are implemented.
- Shared Records is a built-in app.
- Inventory contextual Related Records preserve Inventory context.
- V2-2 Data Table V2 is implemented and scale-correct.
- V2-3 URL-addressable modals and full-page fallbacks are implemented.
- Product Inventory Tracking Settings is contextually integrated.
- Dependency audits are clean.
- `check:all` and `demo:check` pass.
- Controlled registration remains disabled.
- Website asset production remains paused.

## Primary Authority

Read and follow first:

- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/17-module-specifications/09-inventory-v2-module.md`
- `docs/engineering-manual/03-design-system/15-compact-operational-page-header.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0014-compact-operational-page-header.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0020-inventory-v2-operational-workflows.md`

Also inspect and obey:

- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-1-compact-header-shared-records-ia.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-2-data-table-v2.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-3-url-addressable-modals.md`
- `docs/engineering-manual/00-meta/V2-2-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-3-ACCEPTANCE-REPORT.md`
- `src/modules/inventory/UX-CONFORMANCE.md`

Security/architecture authority:

- `docs/engineering-manual/04-kernel/04-authorization-enforcement.md`
- `docs/engineering-manual/04-kernel/08-kernel-api-contracts.md`
- `docs/engineering-manual/05-sdk/02-sdk-db-access.md`
- `docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md`
- `docs/engineering-manual/06-data/01-tenancy-data-isolation.md`
- `docs/engineering-manual/06-data/05-data-validation-zod.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/04-api-security.md`
- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`

If these documents conflict, stop and report the conflict instead of inventing a resolution.

# Founder-Approved V2-4 Decisions

## Dashboard Charts

Use **Recharts v3** through a small OneDayOS chart wrapper.

Requirements:

- real service-backed data only
- no hard-coded demo arrays presented as live data
- no fake trends
- no fabricated percentages
- compositional wrapper, not a chart engine
- responsive
- OneDayOS Compact tokens
- Light / Dark / System compatible
- semantic labels
- legend labels
- tooltip values with units
- not color-only
- textual/table summary or equivalent accessible fallback
- tenant-scoped
- permission-enforced
- exact enough to be honest
- no caching in V2-4

Planned dashboard charts:

1. Stock Health distribution
2. Inbound versus Outbound movement trend
3. Stock or low-stock count by Warehouse

## Process Flow Diagram

Use the existing declarative Inventory process definition.

Add a real diagram presentation using:

- semantic HTML
- CSS layout
- small local SVG connectors/arrows where needed
- no external diagram library
- no React Flow
- no Mermaid
- no workflow engine

Desktop:

- directional horizontal/branched flow where space permits

Narrow screens:

- vertical flow

The page must remain understandable without arrows, layout, or color through a semantic ordered-list/text fallback.

## Current versus Future Workflow Truthfulness

The currently implemented operational workflow is still adjustment-based.

The diagram must clearly distinguish:

### Implemented now

- Shared Records
- Inventory Tracking Settings
- Stock Adjustment
- Transactional Posting
- Stock Balance
- Movement Ledger
- Low-Stock Detection

### Approved for V2-6 but not implemented yet

- Receipts
- Issues
- Transfers

Do not draw future workflows as active/current functionality.

Use a distinct “Planned” or “Future integrations” treatment.

Do not imply:

- Purchasing exists
- Sales exists
- notifications exist
- approvals exist
- accounting exists

# Absolute Scope

## Allowed

- audit and install one exact stable Recharts v3 dependency
- create a small OneDayOS chart wrapper
- create chart tokens/configuration
- add tenant-scoped Dashboard aggregation/service methods
- add Dashboard chart presenter components
- improve KPI cards using real values
- add accessible chart summaries
- redesign Process Flow presentation with arrows/connectors
- preserve the existing declarative process definition
- add responsive diagram presentation
- add tests, a11y coverage, `check:ux` rules, documentation, and acceptance report
- make small correctness fixes in dashboard/process-flow data presentation

## Forbidden

Do not:

- implement V2-5 export
- install ExcelJS
- add CSV/XLSX buttons
- change Prisma schema
- create migrations
- implement InventoryTransaction
- implement Receipts, Issues, or Transfers
- implement caching
- implement curated accent presets
- resume website asset production
- change modal architecture
- change Data Table V2 behavior
- add a diagram engine
- add React Flow
- add Mermaid
- add Chart.js, ECharts, Nivo, Victory, or another chart library
- add new modules
- add Platform Services, Dynamic Systems, runtime AI, background jobs, or FastAPI
- run `npm audit fix`
- run `npm audit fix --force`

# Repository Safety

The worktree may contain prior uncommitted changes.

Before coding:

1. Run `git status --short`.
2. Record current changed/untracked files.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Do not restore historical implementation.
5. Keep edits strictly within V2-4.
6. Do not create a commit unless separately instructed.
7. Stop stale runtime before final build/start.
8. Keep the final server on port `1320`.

# Supported Runtime

Use:

```text
Node >=24 <25
```

Run:

```bash
node --version
npm --version
```

If Node 24 is not active, switch before dependency work.

# Before Coding

Inspect and report briefly:

1. Current Inventory dashboard page and presenter structure.
2. Current Inventory dashboard service/data methods.
3. Current StockBalance, StockMovement, StockAdjustment fields available.
4. Current movement-type vocabulary.
5. Current demo movement history and date distribution.
6. Current Dashboard KPI calculations.
7. Current Process Flow definition and page renderer.
8. Current shared `ProcessFlowPage`.
9. Current OneDayOS tokens available for chart colors.
10. Current Light/Dark/System implementation.
11. Current accessibility test helper.
12. Current chart dependencies, if any.
13. Current query/performance limitations.
14. Files you plan to create.
15. Files you plan to modify.
16. Any ambiguity or risk of inaccurate aggregation.

If a real architecture ambiguity exists, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# Phase 1 — Recharts Dependency Audit and Install

## Audit

Determine the current stable Recharts v3 release compatible with:

- React 19
- Next.js 16.2.11
- TypeScript 6
- Node 24
- current npm peer tree

Use a stable v3 release only.

Do not install a beta, RC, canary, or v4.

Inspect:

- license
- maintenance status
- peer dependencies
- package size/bundle impact
- SSR/client-component requirements
- accessibility support
- advisory state

## Install

Add one exact runtime dependency:

```text
recharts
```

Do not add:

- d3 packages directly
- another chart library
- shadcn chart package
- a chart-theme package

After installation:

```bash
npm ci
npm ls recharts
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

All audits must remain clean.

If Recharts introduces an advisory or incompatible peer state, stop and report rather than selecting another library silently.

# Phase 2 — OneDayOS Chart Wrapper

Create a small reusable chart layer consistent with repository conventions.

Preferred direction:

```text
src/components/onedayos/charts/
  chart-container.tsx
  chart-tooltip.tsx
  chart-legend.tsx
  chart-empty-state.tsx
  chart-data-table.tsx
  types.ts
  index.ts
  __tests__/
```

Use fewer files if a smaller API is clearer.

## Responsibilities

The chart layer may own:

- responsive container
- semantic title/description association
- chart color/token mapping
- tooltip presentation
- legend presentation
- accessible data summary/table
- loading/empty/error presentation
- common formatter utilities
- compact OneDayOS spacing

It must not own:

- data fetching
- PlatformContext
- permissions
- tenant identity
- business aggregation
- caching
- fake data
- chart selection from metadata
- a runtime chart builder
- export

## Public API

Prefer composition.

Example direction:

```tsx
<ChartContainer
  title="Stock health"
  description="Current products by stock status."
  dataSummary={<StockHealthSummary data={data} />}
>
  <ResponsiveContainer>
    <PieChart>...</PieChart>
  </ResponsiveContainer>
</ChartContainer>
```

Avoid:

```tsx
<UniversalChart
  model="StockBalance"
  autoInferEverything
/>
```

## Client boundary

Recharts components require a client component.

Keep:

- data fetching/aggregation server-side
- small serializable chart DTOs passed to client presenters
- no secrets
- no `orgId` exposed merely for chart rendering
- no client API fetch unless existing architecture clearly requires it

Do not move dashboard permission logic into client code.

# Phase 3 — Chart Token System

Use semantic OneDayOS Compact chart tokens.

Do not hard-code many raw colors inside TSX.

Create or formalize a restrained chart palette compatible with Light and Dark.

Required semantic roles may include:

```text
chart-primary
chart-secondary
chart-tertiary
chart-muted
chart-positive
chart-negative
chart-warning
chart-neutral
```

Rules:

- brand orange may be one deliberate series color
- status semantics remain consistent
- low stock uses warning semantics
- out of stock uses destructive semantics
- healthy stock uses success semantics
- inbound/outbound use distinct labels, patterns, or markers
- no chart relies only on red/green
- legends and textual values are required
- curated accent presets are not implemented yet
- V2-8 may later remap non-semantic chart accents

Do not change the OneDayOS brand/preset decision.

# Phase 4 — Dashboard Data Contract

Create explicit serializable DTOs.

Suggested shape:

```ts
type InventoryDashboardKpis = {
  trackedProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  warehousesWithStock: number
}

type StockHealthDatum = {
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  label: string
  count: number
}

type MovementTrendDatum = {
  date: string
  inbound: number
  outbound: number
}

type WarehouseStockDatum = {
  warehouseId: string
  warehouseName: string
  totalQuantity: number
  lowStockProducts: number
}
```

Refine names/types according to current domain conventions.

Do not expose internal IDs to the UI unless needed as stable React keys; prefer opaque DTO use.

## Exactness

Dashboard summaries must not be computed from paginated table rows.

Do not reuse only the first 25/100 table results.

Use dedicated tenant-scoped aggregate/service methods.

Do not silently cap candidate rows.

If an aggregate cannot be computed exactly without schema/raw-query changes:

- implement an honest, documented bounded strategy that fails rather than truncates, or
- omit that chart and report the limitation

Do not fabricate totals.

# Phase 5 — Dashboard KPI V2

Refine the current KPI cards.

Required:

- Tracked Products
- Low Stock
- Out of Stock
- Warehouses with Stock

Use real values only.

Each KPI requires:

- label
- value
- concise contextual explanation or accessible label
- semantic status where relevant
- no fake percentage delta
- no decorative trend arrow without real comparison data

Keep compact operational header.

Do not create a marketing-style card wall.

# Phase 6 — Stock Health Chart

Implement a donut, pie, or compact bar chart based on the audited best fit.

Required categories:

- In Stock
- Low Stock
- Out of Stock

Requirements:

- exact current counts
- labels/legend
- count and percentage in tooltip or summary
- visible or screen-reader-readable data table/summary
- empty state when no tracked products
- not color-only
- responsive
- Light/Dark/System
- no fake category

If total tracked products is zero:

- show honest empty state
- do not render a meaningless chart

# Phase 7 — Inbound vs Outbound Movement Trend

Use real StockMovement data.

Default range:

```text
Last 30 days
```

or the exact frozen spec if it differs.

Requirements:

- group by calendar date using a documented timezone strategy
- inbound quantity
- outbound quantity
- adjustment direction handled according to current movement vocabulary
- labels
- tooltip
- textual/table summary
- honest empty state
- no interpolation that implies missing data
- dates with no movement may show zero if the period contract requires a continuous timeline

## Current movement vocabulary

Audit actual values such as:

- opening_balance
- adjustment_in
- adjustment_out

Map only real implemented values.

Do not display Receipts/Issues/Transfers as current series until V2-6 implements them.

You may label the chart:

```text
Inbound vs Outbound movement
```

but the accessible description must explain that current values come from opening balances and adjustments in the existing MVP.

Do not imply purchasing/sales integrations.

# Phase 8 — Warehouse Chart

Implement an honest Warehouse chart.

Choose one frozen/approved interpretation based on available exact data:

### Preferred

```text
Total quantity by Warehouse
```

with low-stock count included in tooltip/summary.

Alternative if quantity aggregation is misleading due to mixed units:

```text
Tracked Product count and Low-Stock Product count by Warehouse
```

Important:

Products may use different units (`pcs`, `kg`, `liter`, etc.).

Do not sum unlike units into one number and present it as a meaningful universal quantity.

Audit the Product unit model.

If mixed units exist, use product-count/low-stock-count rather than total quantity.

Document the decision.

Requirements:

- exact tenant-scoped data
- warehouse labels
- readable with long names
- accessible summary
- no hidden warehouse
- empty state
- no more than a practical number of bars without an honest Top N/Other policy

Do not silently truncate.

If there are many Warehouses, use a documented sorted Top N plus explicit “Other” only if totals remain honest, or render a scrollable/list alternative.

# Phase 9 — Dashboard Layout

Create a more alive but still operational layout.

Recommended order:

1. compact page header + primary action
2. KPI row
3. chart grid
   - Stock Health
   - Movement Trend
4. Warehouse chart
5. Recent Movements
6. Recent Adjustments

Responsive:

- desktop: two-column chart grid where suitable
- tablet: one or two columns
- mobile: one column
- no clipped tooltips
- no horizontal page overflow
- tables remain usable

Do not add auto-playing animation.

Respect reduced motion.

Use minimal entry animation only if already supported through CSS and not decorative.

# Phase 10 — Dashboard Service/API

Prefer server component/service data flow.

Create or refine a dedicated service method such as:

```text
getDashboardV2(ctx, range)
```

or small focused methods.

Requirements:

- PlatformContext
- `sdk.getDb(ctx)`
- permission:
  - `inventory.dashboard.read`
- module enabled
- tenant scope
- soft-delete awareness
- exact aggregation
- safe date range
- no client orgId
- no caching
- no raw provider errors
- no API route required merely for server rendering

If an API is needed for future range controls:

- use org-scoped route
- strict query schema
- allowlisted range
- JSON envelope
- permission/tenant enforcement

Do not add a range selector unless the frozen scope supports it.

Keep V2-4 small.

# Phase 11 — Process Flow Diagram V2 Architecture

Preserve:

```text
src/modules/inventory/process-flow.ts
```

as the canonical semantic definition.

Do not hard-code a second independent workflow in the page.

Extend shared-safe types only if necessary to express connectors/groups/status.

Potential additions:

```ts
type ProcessFlowStep = {
  id: string
  number?: number
  title: string
  description: string
  inputs?: readonly string[]
  outputs?: readonly string[]
  warning?: string
  status?: 'current' | 'planned'
}

type ProcessFlowConnection = {
  from: string
  to: string
  label?: string
}
```

Only add fields that have real reusable value.

Do not create a general workflow engine.

# Phase 12 — Inventory Diagram Content

## Implemented current flow

Diagram must clearly show:

```text
Shared Records
  ↓
Inventory Tracking Settings
  ↓
Stock Adjustment
  ↓
Transactional Posting
  ├── Stock Balance
  └── Movement Ledger
          ↓
Low-Stock Detection
```

Clarify:

- Product and Warehouse are shared
- quantities/balance are server-computed
- negative stock is prevented
- Adjustment, Movement, and Balance update together
- Movement Ledger is append-only
- low-stock compares quantity and reorder point

## Planned/deferred flow

Show in a visually distinct planned/future section:

```text
Receipts
Issues
Transfers
```

These may connect conceptually to Transactional Posting, but must be labeled:

```text
Planned for Inventory V2
Not implemented in the current demo
```

Future integrations may also list:

- Purchasing
- Sales
- Notifications

Do not show them as active.

# Phase 13 — Diagram Rendering

Create a reusable diagram renderer or extend `ProcessFlowPage`.

Preferred direction:

```text
src/components/onedayos/patterns/
  process-flow-diagram.tsx
```

or equivalent.

## Desktop

- real arrows/connectors
- branching from Transactional Posting to Balance and Ledger
- clear sequence
- current versus planned styling
- no overlapping labels
- no lonely disconnected cards

## Mobile

- vertical sequence
- branches become stacked grouped outputs
- arrows remain clear
- no horizontal scrolling required for the primary flow

## Accessibility

Required:

- semantic heading
- ordered textual fallback
- current/planned labels in text
- connectors marked decorative where appropriate
- diagram understandable with CSS disabled
- no information only in arrow direction or color
- keyboard focus only on interactive controls; static diagram should not create unnecessary tab stops
- reduced-motion support
- no animated moving arrows

## Technology

Use:

- semantic HTML
- CSS Grid/Flex
- local SVG arrow/connector elements if needed

Do not add an external diagram package.

# Phase 14 — Process Flow Page Layout

Keep explanatory header.

Recommended sections:

1. diagram
2. accessible step details
3. what Inventory owns
4. what Inventory does not own
5. current MVP boundaries
6. planned Inventory V2 workflows
7. future integrations

Avoid duplicating identical long descriptions twice.

The accessible fallback may be visually compact but must remain available.

# Phase 15 — Loading, Empty, and Error States

## Dashboard

Add:

- KPI skeleton
- chart skeletons
- recent-table skeletons
- safe error state
- honest empty states

Do not show fake chart shapes as actual data.

## Process Flow

Use diagram-shaped loading state.

No generic bars.

Since Process Flow is static/declarative, loading should remain brief and should not imply network-derived workflow data.

# Phase 16 — Tests

Add meaningful tests.

## Chart wrapper tests

- title/description association
- responsive container wrapper
- tooltip formatter
- legend labels
- accessible summary/table
- empty state
- loading state
- safe error state
- Light/Dark token use
- no raw chart colors in presenter source where semantic tokens are required
- no API/data fetching inside wrapper
- no tenant/orgId props

## Dashboard aggregation tests

- exact KPIs
- low/out-of-stock classification
- no paginated-row dependency
- tenant scope
- permission denial
- module disabled
- soft-deleted Product/Warehouse exclusion
- zero-data state
- mixed-unit Warehouse decision
- 30-day date grouping
- inbound/outbound mapping
- days with no movement
- timezone boundary
- two organizations
- no candidate cap
- no caching

## Dashboard UI tests

- four KPI cards
- Stock Health chart
- Movement Trend chart
- Warehouse chart/alternative
- Recent Movements
- Recent Adjustments
- no fake metrics/trend labels
- accessible chart summaries
- compact header preserved
- primary Adjust action preserved
- responsive structure
- reduced-motion behavior

## Process Flow tests

- current steps in correct order
- branch to Balance and Ledger
- Low-Stock follows current outputs
- planned Receipts/Issues/Transfers labeled planned
- current and planned are not conflated
- owns/does-not-own sections
- semantic ordered fallback
- arrow connectors decorative
- mobile vertical layout contract
- no external diagram dependency
- no workflow automation
- no mutation/API call
- no `orgId`

## Accessibility tests

Use existing axe helper.

Cover:

- each chart card
- dashboard section
- chart legend/summary
- Process Flow diagram
- planned labels
- empty chart states

Do not claim full WCAG conformance.

## Regression tests

- V2-1 compact headers remain
- V2-2 Data Table remains
- V2-3 modals remain
- Product Settings remains contextual
- Light/Dark/System remains
- no export
- no caching
- no accent selector
- no V2-6 transaction behavior

# Phase 17 — `check:ux`

Add stable checks:

- Recharts appears only through approved chart wrapper/presenters
- no second chart library
- no fake dashboard data arrays
- no fake percentage/trend copy
- chart summaries exist
- chart semantics use tokens
- Process Flow diagram uses canonical definition
- planned workflows are labeled planned
- no React Flow/Mermaid/diagram engine
- no V2-5 export/ExcelJS
- no Prisma/migration changes
- no caching
- website assets remain paused

Avoid brittle class-string checks.

# Phase 18 — Documentation

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-4-dashboard-process-flow.md
```

Include:

- Recharts exact version
- dependency audit
- chart-wrapper API
- KPI/data contracts
- aggregation strategy
- mixed-unit Warehouse-chart decision
- accessibility strategy
- Process Flow diagram architecture
- current versus planned workflow treatment
- tests
- visual review
- performance limits
- explicit non-goals
- V2-5 remains blocked
- website assets remain paused

Create:

```text
docs/engineering-manual/00-meta/
  V2-4-ACCEPTANCE-REPORT.md
```

Status before Founder review:

```text
Code and Automated Gates Complete
Founder Visual Acceptance Pending
```

Required sections:

- dependency
- Dashboard V2
- chart data correctness
- chart accessibility
- Process Flow Diagram V2
- current/planned truthfulness
- visual review
- findings
- blockers/must-fix/polish
- V2-5 readiness

Update truthfully:

```text
src/modules/inventory/UX-CONFORMANCE.md
```

Do not claim public-demo approval.

# Phase 19 — Manual Visual Review

Use Node 24 and the controlled sandbox on port 1320.

Do not install browser automation.

Review Org Admin and Warehouse Operator where relevant.

## Light

- Inventory Dashboard
- Process Flow

## Dark

- Inventory Dashboard
- Process Flow

## System

- persistence and live resolution remain correct

Verify:

- charts use real demo data
- chart legends/tooltips readable
- chart colors work in Light/Dark
- no clipped axes/tooltips
- empty states honest if applicable
- KPI cards are compact, not old/generic
- Process Flow has real directional arrows
- branch is understandable
- mobile layout is readable
- planned workflows are clearly not implemented
- no screen suggests Receipts/Issues/Transfers already exist

## Mobile

Use a narrow viewport such as:

```text
390 × 844
```

Verify:

- chart cards stack
- chart labels remain readable
- diagram becomes vertical
- no horizontal page overflow
- tooltips remain usable

## Screenshots

Save under `/tmp`:

```text
/tmp/v2-4-dashboard-light.png
/tmp/v2-4-dashboard-dark.png
/tmp/v2-4-dashboard-mobile.png
/tmp/v2-4-stock-health-chart.png
/tmp/v2-4-movement-trend-chart.png
/tmp/v2-4-warehouse-chart.png
/tmp/v2-4-process-flow-diagram-light.png
/tmp/v2-4-process-flow-diagram-dark.png
/tmp/v2-4-process-flow-diagram-mobile.png
/tmp/v2-4-process-flow-planned-workflows.png
```

Do not publish them.

# Controlled Demo Safety

Preserve:

- demo mode
- registration disabled
- noindex
- role profiles
- `demo:reset`
- `demo:check`
- controlled guided demo only
- website asset pause

Run `demo:check`.

Do not run `demo:reset` unless visual testing changed canonical data and all safety flags pass.

# Dependency Gates

After installing Recharts:

```bash
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

All must pass.

# Verification Commands

Run under Node 24:

```bash
node --version
npm --version
npm ci

npm run typecheck
npm run lint
npm run test:run
npm run check:ux
npm run test:a11y
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm run check:all
npm run demo:check

npm ls recharts
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate

git diff --check
git status --short
```

Do not run:

```bash
npm audit fix
npm audit fix --force
```

Stop any stale server and start the latest production build on port 1320.

# Final Report Required

Report:

1. V2-4 summary.
2. Node/npm versions.
3. Files inspected.
4. Files created.
5. Files modified.
6. Recharts exact version and compatibility audit.
7. Chart-wrapper public API.
8. Chart token strategy.
9. Dashboard KPI data contract.
10. Stock Health chart behavior.
11. Movement Trend chart behavior.
12. Warehouse chart decision and mixed-unit handling.
13. Dashboard aggregation/service behavior.
14. Process Flow type/definition changes.
15. Process Flow diagram rendering strategy.
16. Current versus planned workflow treatment.
17. Accessibility strategy.
18. Tests added and updated full count.
19. Accessibility test result.
20. `check:ux` changes.
21. Manual visual review and screenshot paths.
22. Light/Dark/System result.
23. Mobile-width result.
24. Controlled-demo result.
25. Port 1320 server status/PID.
26. Exact verification commands and results.
27. `check:all` result.
28. `demo:check` result.
29. Dependency audit result.
30. Git diff/status observations.
31. Any deviations from frozen V2-4 scope.
32. Remaining chart, aggregation, performance, or accessibility risks.
33. Confirmation that no V2-5 export, ExcelJS, Prisma, migrations, Inventory V2 transactions, caching, accent presets, website assets, new modules, diagram engine, or Platform Services were added.
34. Whether V2-4 is complete.
35. Whether V2-5 remains blocked pending Founder approval.
36. Whether website asset production remains paused.

Stop after V2-4.

Do not proceed to V2-5 or any later V2 package without Founder approval.
