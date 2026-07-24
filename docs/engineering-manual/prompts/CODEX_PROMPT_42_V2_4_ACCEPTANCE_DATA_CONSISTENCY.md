# OneDayOS — V2-4 Acceptance and Dashboard Data-Consistency Hardening

Inventory Demo V2 Package V2-4 is code-complete and all automated gates pass.

The Founder accepts the V2-4 visual direction:

- real KPI cards
- real Recharts-based charts
- OneDayOS chart wrapper
- Light/Dark/System support
- responsive Dashboard
- directional Process Flow Diagram
- clear current-versus-planned workflow distinction

However, V2-5 remains blocked until the V2-4 analytical semantics and controlled-demo data are reconciled.

The implementation report contains signals that require explicit verification:

1. The movement trend rendered an empty state for the current 30-day window even though canonical demo movements/adjustments exist.
2. Reported chart values need reconciliation:
   - Stock Health tooltip example: `In Stock — 17 products · 94%`
   - Warehouse tooltip example: `18 tracked products, 3 low-stock products`
3. Earlier canonical controlled-demo data used 3 Products, while the visual report referenced 18 tracked Products.
4. Dashboard aggregation currently grows in application memory.

This is a focused V2-4 acceptance and correctness hardening pass.

Do not implement V2-5.

Do not add export or ExcelJS.

Do not change Prisma schema.

Do not create migrations.

Do not implement Receipts, Issues, Transfers, caching, accent presets, or website assets.

## Primary Goal

Make every Dashboard number and chart:

- internally consistent
- clearly defined
- tenant-scoped
- based on canonical controlled-demo data
- truthful about its unit of analysis
- exact for the current supported scale
- stable across timezone/date boundaries
- visually useful for the controlled demo

The final Dashboard must not show contradictory counts, stale demo drift, or an avoidably empty movement chart.

## Primary Authority

Read and follow:

- `docs/engineering-manual/00-meta/V2-4-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-4-dashboard-process-flow.md`
- `docs/engineering-manual/17-module-specifications/09-inventory-v2-module.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/03-design-system/15-compact-operational-page-header.md`
- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`
- `src/modules/inventory/UX-CONFORMANCE.md`
- `docs/demo/DEMO-RUNTIME-VALIDATION-REPORT.md`
- `docs/demo/CONTROLLED-DEMO-RUNBOOK.md`

Also inspect:

- `scripts/provision-sandbox-demo.ts`
- `scripts/reset-sandbox-demo.ts`
- `scripts/check-demo-readiness.ts`
- current Inventory Dashboard service/presenters/tests
- current Stock Level status calculation
- current demo Product/Balance/Movement/Adjustment timestamps

If these authorities conflict, stop and report the conflict.

## Absolute Scope

### Allowed

- audit and correct Dashboard metric definitions
- audit and correct movement-date window logic
- reconcile chart and KPI units
- update controlled-demo canonical data timestamps/counts
- run guarded `demo:reset`
- add exact consistency tests
- add scale/memory guardrails
- update chart labels/tooltips/summaries for clarity
- update V2-4 documentation and conformance evidence
- make small V2-4 visual-copy corrections
- preserve the current Process Flow Diagram implementation

### Forbidden

Do not:

- implement V2-5 export
- install ExcelJS
- add CSV/XLSX actions
- change Prisma schema
- create migrations
- implement unified InventoryTransaction
- implement Receipts, Issues, Transfers
- implement caching
- implement curated accents
- resume website asset production
- add another chart library
- change modal/Data Table architecture
- add new modules
- add Platform Services, Dynamic Systems, runtime AI, or FastAPI
- run `npm audit fix`
- run `npm audit fix --force`

## Supported Runtime

Use Node 24.

Verify:

```bash
node --version
npm --version
```

Keep the final server on port `1320`.

## Repository Safety

Before work:

1. Run `git status --short`.
2. Preserve all prior V2 work.
3. Do not reset, restore, delete, or overwrite unrelated files.
4. Do not commit unless separately instructed.
5. Stop stale runtime before final build/start.

# Part A — Reproduce the Current Dashboard State

Before reset or code changes, record read-only current sandbox facts:

- Product count
- tracked Product count
- active Warehouse count
- StockBalance count
- low-stock count
- out-of-stock count
- in-stock count
- movement count in the chart range
- adjustment count in the chart range
- earliest/latest movement timestamps
- earliest/latest adjustment timestamps
- current UTC timestamp/date used by the server
- chart start/end date
- per-Warehouse tracked/low-stock counts

Do not print internal IDs or secrets.

Explain why the report showed:

```text
17 in-stock / 94%
18 tracked in Main Warehouse
3 low-stock in Main Warehouse
```

Determine whether the difference is:

- demo-data drift
- unique Product versus Product-Warehouse position semantics
- multiple Warehouse aggregation
- missing balances
- inconsistent classification
- stale build/data
- a tooltip/reporting mistake
- another documented cause

Do not proceed until the cause is understood.

# Part B — Freeze Dashboard Metric Semantics

Create one explicit implementation decision in the V2-4 acceptance report.

Use these definitions unless the frozen Inventory spec requires a different one.

## Tracked Products KPI

```text
Unique active, non-deleted Products in the organization
with InventoryProductExtension.isStockTracked = true.
```

Count each Product once.

## Warehouses with Stock KPI

```text
Unique active, non-deleted Warehouses
having at least one positive StockBalance for a tracked Product.
```

## Product-level Stock Health chart

Use unique tracked Products.

Recommended classification:

### Out of Stock

```text
Aggregate on-hand quantity across all active Warehouses <= 0.
```

### Low Stock

```text
Aggregate on-hand quantity across all active Warehouses > 0
and <= the Product’s Inventory reorder point.
```

### In Stock

```text
Aggregate on-hand quantity across all active Warehouses
> the Product’s Inventory reorder point.
```

Requirements:

- categories are mutually exclusive
- categories sum exactly to Tracked Products
- percentages sum to 100% subject only to displayed rounding
- Product with no StockBalance is Out of Stock
- deleted/inactive Product/Warehouse records are excluded
- no Product is counted twice

If the current approved spec defines per-Warehouse health instead, stop and report the conflict rather than silently changing semantics.

## Warehouse chart

Use a different, clearly labeled unit:

```text
Product positions by Warehouse
```

For each Warehouse:

- tracked positions
- low-stock positions
- out-of-stock positions where useful

A Product may appear once per Warehouse.

The title, tooltip, legend, and accessible summary must say:

```text
product positions
```

not simply `products` if the unit is Product × Warehouse.

This chart does not need to sum to the unique Tracked Products KPI.

Explain the distinction in concise help/accessibility copy.

Do not sum incompatible Product units.

## Dashboard consistency invariant

Tests must prove:

```text
stockHealth.inStock
+ stockHealth.lowStock
+ stockHealth.outOfStock
= trackedProducts
```

# Part C — Movement Trend Date Contract

Audit the current “last 30 days” implementation.

Freeze a precise contract:

```text
30 UTC calendar dates including the current UTC date.
```

Example:

If current UTC date is July 24:

```text
June 25 through July 24 inclusive
```

Use exactly 30 dates.

Requirements:

- include current UTC date
- no off-by-one exclusion
- start at 00:00:00.000 UTC
- end before the next UTC date
- stable tests with an injected/frozen `now`
- continuous zero-filled date series
- no local-server-time ambiguity
- tooltip labels remain human-readable

If the existing frozen V2-4 spec explicitly says “30 completed days excluding today,” preserve it and document why current-day movements are absent. Otherwise use the inclusive-current-date contract above.

## Movement type mapping

Use only implemented movement types:

Inbound:

- opening_balance
- adjustment_in

Outbound:

- adjustment_out

Do not label Receipts/Issues/Transfers as current data.

## Empty state

The empty state remains valid for organizations with no movement in the range.

The controlled demo should not be empty merely because canonical demo timestamps are outside or on an accidentally excluded boundary.

# Part D — Canonical Controlled-Demo Activity

The controlled demo should include genuine persisted demo activity across the recent trend window.

This is not fake chart data.

Update the guarded sandbox provision/reset logic so canonical demo records are real Inventory records with meaningful relative dates.

Requirements:

- only configured demo organization
- guarded by existing demo/sandbox flags
- idempotent
- no production effect
- no secrets
- use current time through an injectable clock/helper
- create canonical activity across recent UTC dates
- preserve final canonical StockBalance values
- preserve transaction/service invariants
- movement/adjustment rows remain internally consistent
- no duplicate records on repeated provision/reset
- no arbitrary future dates
- no dates older than the intended demo range unless explicitly retained

Recommended recent activity pattern:

- opening balances earlier in the 30-day range
- at least one positive adjustment on a later date
- at least one negative adjustment on a different later date
- final balances remain:
  - Bottled Water 500ml: 120
  - Iced Tea 1L: 35
  - Coffee Beans 1kg: 8
- Coffee Beans remains low stock
- no negative historical balance
- no unsupported movement type

Use enough dates to make the line/bar trend visibly meaningful, but keep demo data small and understandable.

Do not create Receipts, Issues, or Transfers before V2-6.

## Canonical demo count decision

Determine whether the controlled demo should contain exactly 3 canonical Products or an intentionally expanded set.

Preferred for current controlled demo:

```text
Exactly the canonical 3 Products
```

unless a prior accepted demo-data decision intentionally expanded it.

If extra products exist due prior manual/scale testing:

- `demo:reset` must remove noncanonical demo Inventory/Shared Record rows only within the configured demo organization where the current reset policy permits it
- preserve users, roles, permissions, organization, subscription, and module enablement
- do not affect another organization

Document the final canonical counts.

# Part E — Dashboard Aggregation Memory Guard

The report notes full Product/balance aggregation grows in application memory.

Do not implement caching or schema changes.

Add an explicit safe policy.

Requirements:

- no silent truncation
- no partial totals
- exact result for supported scale
- an explicit maximum candidate count if full in-memory aggregation remains necessary
- fail honestly with a typed safe error when the maximum is exceeded
- error suggests narrowing operational scope or future aggregate optimization
- no raw technical details
- document future V2-6/V2-7 optimization path

Choose a reasonable temporary maximum based on memory/profile evidence, not an arbitrary tiny value.

Tests must verify:

- exact result below limit
- safe failure above limit
- no partial chart data
- tenant scope
- error accessibility

If exact database aggregation can be implemented safely using current Prisma without raw SQL or schema changes, prefer it.

Do not add raw SQL casually.

# Part F — Chart Copy and Accessibility Reconciliation

Update labels so units are unmistakable.

Required examples:

```text
Stock Health
Unique tracked Products by organization-wide stock status.

Warehouse Stock Positions
Tracked Product positions by Warehouse.
```

Tooltips:

- include the unit (`products`, `product positions`, `movements`, quantity)
- include counts
- avoid ambiguous percentages
- match accessible data tables exactly

Accessible summaries must match visible chart values.

No report or tooltip may use `products` when it actually means Product-Warehouse positions.

# Part G — Controlled Visual Acceptance

After guarded reset and latest build, inspect:

- Dashboard Light
- Dashboard Dark
- Dashboard mobile
- Stock Health tooltip/summary
- Movement Trend with recent real activity
- Warehouse chart tooltip/summary
- Process Flow Light/Dark/mobile

Verify:

- movement chart is meaningfully populated
- no contradictory counts
- stock-health categories sum to Tracked Products
- warehouse chart unit is clear
- canonical Product count is expected
- no fake data
- Process Flow remains unchanged and truthful
- Light/Dark/System remain readable
- no horizontal overflow

Save screenshots:

```text
/tmp/v2-4-acceptance-dashboard-light.png
/tmp/v2-4-acceptance-dashboard-dark.png
/tmp/v2-4-acceptance-dashboard-mobile.png
/tmp/v2-4-acceptance-stock-health-tooltip.png
/tmp/v2-4-acceptance-movement-trend-populated.png
/tmp/v2-4-acceptance-warehouse-position-tooltip.png
/tmp/v2-4-acceptance-process-flow.png
```

Do not publish them.

# Part H — Tests

Add meaningful tests.

## Metric consistency

- tracked unique Products
- no-balance Product is Out of Stock
- mutually exclusive categories
- category sum equals tracked Products
- percentage rounding
- soft-deleted Product excluded
- inactive/deleted Warehouse excluded
- two organizations isolated
- multiple Warehouses do not duplicate unique Product KPI

## Warehouse positions

- Product counted once per Warehouse
- low-stock positions exact
- tooltip unit says product positions
- accessible summary matches
- mixed units are not summed

## Date range

- exactly 30 dates
- includes current UTC date
- month boundary
- year boundary
- leap day where practical
- movement at start boundary included
- movement just before start excluded
- movement on current date included
- next-day movement excluded
- timezone-independent
- zero-filled missing days

## Demo provision/reset

- relative dates use injectable clock
- idempotent
- canonical 3 Products
- recent inbound/outbound activity
- final balances exact
- Coffee Beans low stock
- no unsupported movement type
- no other organization affected
- users/roles/permissions preserved

## Memory guard

- below-limit exact result
- above-limit safe typed failure
- no partial DTO
- safe UI error
- no raw technical output

## Regression

- all V2-4 charts remain
- Process Flow remains
- no export
- no transactions V2
- no caching
- no accent selector
- no schema change

# Part I — `check:ux`

Add stable checks:

- Dashboard chart unit labels are explicit
- stock-health invariant test exists
- movement-date boundary tests exist
- controlled demo trend data uses real persisted records
- no hard-coded live chart array in the presenter
- no ambiguous Warehouse `products` label for Product positions
- V2-5 dependencies remain absent
- website assets remain paused

Avoid brittle style-class checks.

# Part J — Documentation

Update:

```text
docs/engineering-manual/00-meta/V2-4-ACCEPTANCE-REPORT.md
docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-4-dashboard-process-flow.md
src/modules/inventory/UX-CONFORMANCE.md
docs/demo/DEMO-RUNTIME-VALIDATION-REPORT.md
```

Record:

- final metric definitions
- Product versus Product-position distinction
- 30-day UTC contract
- canonical demo-data decision
- recent movement dataset
- memory guard
- visual evidence
- remaining risks
- Founder acceptance still pending until explicitly given

Create no new V2-5 handoff in this package.

# Controlled Demo Safety

Run:

```bash
npm run demo:reset
npm run demo:check
```

only when all existing safety flags pass.

Preserve:

- registration disabled
- noindex
- role profiles
- controlled guided demo only
- website asset pause

# Dependency Gates

No new dependency is expected.

All audits must remain clean:

```bash
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

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

npm run demo:reset
npm run demo:check

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

Stop stale server and start the latest production build on port 1320.

# Final Report Required

Report:

1. V2-4 acceptance/hardening summary.
2. Root cause of the reported count differences.
3. Root cause of the empty movement trend.
4. Files inspected.
5. Files created.
6. Files modified.
7. Final tracked-Product KPI definition.
8. Final Stock Health classification.
9. Stock Health invariant result.
10. Final Warehouse chart unit.
11. Final 30-day UTC date contract.
12. Canonical demo Product count.
13. Canonical recent movement/adjustment pattern.
14. Final canonical balances.
15. Dashboard memory-guard policy.
16. Tests added and updated full count.
17. Accessibility result.
18. `check:ux` changes.
19. `demo:reset` result.
20. `demo:check` result.
21. Manual visual review and screenshot paths.
22. Light/Dark/System result.
23. Port 1320 server status/PID.
24. Exact verification commands and results.
25. `check:all` result.
26. Dependency audit result.
27. Git diff/status observations.
28. Any deviations from V2-4 scope.
29. Remaining aggregation/performance/accessibility risks.
30. Confirmation that no V2-5 export, ExcelJS, Prisma, migrations, Inventory V2 transactions, caching, accents, website assets, new modules, or Platform Services were added.
31. Whether V2-4 is ready for Founder acceptance.
32. Whether V2-5 remains blocked pending explicit Founder approval.
33. Whether website asset production remains paused.

Stop after this V2-4 acceptance pass.

Do not proceed to V2-5 without Founder approval.
