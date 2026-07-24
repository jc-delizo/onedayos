# Implementation Note — V2-4 Dashboard Charts + Process Flow Diagram V2

## Status

Founder Visual Direction Accepted
Data-Consistency Hardening Complete
Founder Package Acceptance Pending

## Dependency

V2-4 adds exact `recharts@3.10.0` as the only new runtime dependency. The stable release is MIT-licensed, requires Node 18 or later, and declares React, ReactDOM, and React-Is peer support through React 19. It is compatible with the repository’s Node 24, React 19, Next.js 16, and TypeScript 6 tree.

The published package is approximately 7.45 MB unpacked. OneDayOS imports it only from the Inventory client chart presenter. Data access, permission checks, tenant scope, and aggregation remain in the server-only Inventory service. Clean install, peer-tree inspection, production-moderate audit, full-high audit, and full-moderate audit are required V2-4 gates.

## OneDayOS Chart Layer

The composition-first layer under `src/components/onedayos/charts/` exports:

- `ChartContainer` for title/description association, compact Surface layout, visual region, legend, and summary composition.
- `ChartLegend` for explicit text labels and solid/striped/dashed marker distinctions.
- `ChartDataTable` for a semantic, compact accessible data fallback.
- `ChartTooltip` and `formatChartValue` for safe labeled values with units.
- `ChartEmptyState`, `ChartLoadingState`, and `ChartErrorState`.

It does not fetch data, accept tenant identity, import `PlatformContext`, choose chart types, infer business metrics, cache, or export.

## Chart Tokens

Light and Dark maps define semantic `--chart-*` roles: primary, secondary, tertiary, muted, positive, negative, warning, neutral, and grid. Status roles alias existing OneDayOS semantics. Brand orange is one deliberate primary series; it does not replace warning or generic accent. System appearance continues to resolve through the existing Light/Dark token maps.

Charts are not color-only. Legends use text and different marker treatments, tooltips include series labels and units, and every chart has a semantic text/table equivalent.

## Dashboard Contract and Exact Aggregation

`InventoryDashboard` now contains:

- four exact KPIs;
- exclusive Stock Health category counts;
- a continuous 30-day UTC movement series;
- tracked, low-stock, and out-of-stock Product positions for every active Warehouse;
- recent Movement and Adjustment rows.

`InventoryService.getDashboard(ctx, { now? })` requires the Inventory module and `inventory.dashboard.read`, gets its database through `sdk.getDb(ctx)`, and derives every tenant filter from `ctx.org.id`. Product and Warehouse relations must be active and not soft-deleted. Tracking extensions must be active and stock-tracked.

The aggregate reads are dedicated and do not reuse paginated table rows or silently truncate candidates. A preflight count enforces the documented exact-processing limit before aggregation, and a post-read check protects against concurrent growth. V2-4 adds no cache and no API route. Recent detail tables remain separately permission-aware.

### KPI Classification

- Tracked Products: active Products with an active tracked Inventory extension.
- Low Stock: tracked Products with positive organization-wide quantity at or below the Product reorder point.
- Out of Stock: tracked Products with zero organization-wide quantity, including tracked Products without a balance row.
- Warehouses with Stock: active Warehouses containing at least one positive tracked balance.

The Stock Health categories are exclusive and total to Tracked Products.

### Movement Trend

The range is the current UTC date plus the preceding 29 UTC calendar dates. The query is `[UTC start, next UTC day)` and the DTO contains every calendar date, including zero-activity dates.

Implemented movement mapping:

- inbound: `opening_balance` and `adjustment_in`;
- outbound: absolute quantities from `adjustment_out`.

An unknown future movement type fails safely instead of silently undercounting. The chart description states that current values come from opening balances and adjustments; it does not imply Receipts, Issues, Purchasing, or Sales exist.

The exact range is 30 UTC calendar dates including the current UTC date: `[current UTC date - 29 days at 00:00, next UTC date at 00:00)`. On July 24, the displayed range is June 25 through July 24. Tests freeze month, year, leap-day, start, current-day, prior-day, and next-day boundaries.

Guarded demo reset persists recent canonical activity: three opening balances, three positive corrections, and three negative corrections across nine dates in the range. The Trend therefore remains useful without a chart-only array.

### Warehouse Decision

The Product model permits mixed units. Summing quantities into a universal Warehouse total would be misleading.

V2-4 therefore uses:

```text
Tracked, Low-Stock, and Out-of-Stock Product positions by Warehouse
```

A position is one tracked Product balance in one active Warehouse. A Product can have one position in each Warehouse, so Warehouse-position totals do not reconcile to the unique Product KPI. Every active Warehouse is included, including zero-count Warehouses. The accessible table lists the full result; there is no Top N truncation or hidden “Other”.

### Canonical Controlled-Demo Decision

The guarded reset removes noncanonical Product and Warehouse rows only inside the configured demo organization after deleting that organization’s Inventory operational rows. It preserves organization, subscription, users, roles, permissions, and module enablement.

The final baseline is:

- 3 active canonical Products and 3 tracked extensions;
- 1 active canonical Warehouse and 3 Product positions;
- 9 StockAdjustments and 9 matching StockMovements;
- movement vocabulary of 3 `opening_balance`, 3 `adjustment_in`, and 3 `adjustment_out`;
- final balances of Bottled Water `120`, Iced Tea `35`, and Coffee Beans `8`;
- Coffee Beans remains the single organization-wide Low-Stock Product.

Activity dates derive from an injectable UTC clock. Reset deletes and recreates the same bounded canonical dataset, while standalone provisioning creates the same activity only when balances are absent.

## Dashboard Presentation

The operational order is:

1. compact header and New Adjustment action;
2. four compact KPI cards;
3. Stock Health and Movement Trend chart grid;
4. Warehouse Product-position chart;
5. Recent Movements;
6. Recent Adjustments.

Charts stack at narrow widths. Recharts animation is disabled, and the global reduced-motion contract remains in force. Loading uses four KPI skeletons, chart-shaped skeletons, a Warehouse-chart skeleton, and a recent-table skeleton. Empty states never display fake chart shapes as data.

## Process Flow Diagram V2

`src/modules/inventory/process-flow.ts` remains the canonical client-safe semantic definition. Shared types add reusable connection, current/planned status, planned-step, and planned-label fields.

The current connection graph is:

```text
Shared Records
→ Inventory Tracking Settings
→ Stock Adjustment
→ Transactional Posting
├→ Stock Balance
└→ Movement Ledger
   → Low-Stock Detection
```

`ProcessFlowDiagram` derives its sequence and branches from the canonical connections. It uses semantic HTML, CSS Flex/Grid, and local decorative SVG arrows. Desktop is horizontal then branched; narrow screens stack vertically without primary-flow horizontal scrolling.

The visual graph is decorative to assistive technology because the same information is provided by the visible semantic ordered list. The fallback carries step numbers, titles, descriptions, inputs, outputs, warnings, and explicit Current labels.

Receipts, Issues, and Transfers appear only in a separate planned panel labeled “Planned for Inventory V2 — not implemented in the current demo.” Purchasing, Sales, and Notifications appear only as future integration directions. No diagram suggests they are current or interactive.

## Accessibility Strategy

- chart sections associate heading and description IDs;
- legends use labels and non-color-only marker treatment;
- tooltips include labels and units;
- semantic tables provide chart-equivalent values;
- empty/loading/error states have roles and contextual text;
- chart visuals are supplemental to the semantic summaries;
- Process Flow arrows are decorative;
- the Process Flow has a visible ordered textual fallback;
- planned/current state is stated in text;
- static diagrams add no tab stops;
- animation is disabled and reduced-motion remains respected.

Automated axe evidence is regression coverage only and is not a WCAG certification.

## Controlled Visual Review

Production-mode acceptance review covered Org Admin routes, Light and Dark appearances, System appearance resolution, and a 390 × 844 narrow viewport. The Dashboard rendered four reconciled KPIs, three populated/real chart surfaces, explicit Product-position units, semantic summaries, and both recent-record tables without horizontal page overflow. The Process Flow remained unchanged and rendered five current connections, its visible ordered fallback, and the explicitly separate planned-workflows panel without an active-workflow claim.

Private evidence is stored under `/tmp/v2-4-acceptance-*.png`.

## Testing and UX Gate

Coverage includes:

- chart wrapper semantics, states, formatter, legends, summaries, and business-boundary source checks;
- KPI exclusivity/invariant, no-balance behavior, multiple-Warehouse unique Product handling, zero data, mixed-unit Product positions, UTC month/year/leap/date boundaries, unsupported movement types, tenant scope, permission denial, module denial, soft-delete query scope, and the exact-processing guard;
- Dashboard chart labels, percentage reconciliation, populated and empty trend truthfulness, Product-position summaries, safe guard error, token use, and absence of client fetching/tenant props;
- Process Flow sequence, branch connections, planned labels, semantic fallback, no mutations, and accessibility;
- V2-1 header, V2-2 table, and V2-3 modal regressions through the full suite.

`check:ux` authorizes exact Recharts only through approved boundaries and now verifies explicit unique-Product/Product-position copy, the Stock Health invariant test, UTC boundary tests, real persisted canonical trend activity, the aggregation guard, canonical Process Flow treatment, and the absence of another chart/diagram/export/cache dependency.

## Performance Limits

V2-4 intentionally performs fresh uncached reads. The 30-day Movement query is date- and tenant-scoped. Stock Health and Warehouse summaries load the complete active tracked extension and balance sets for the verified tenant, while Movement Trend loads the exact 30-day movement set. They aggregate exact decimal values in application memory.

The temporary exact-processing maximum is 50,000 combined candidate rows across tracked extensions, active balances, active Warehouses, and in-range Movements. The service counts first and fails with a typed, user-safe `422` before data reads when the maximum is exceeded; it verifies the loaded count again before returning a DTO. No partial chart data is returned. The Dashboard presents a safe narrowing/contact-admin recovery message.

This preserves correctness without raw SQL, schema changes, migration work, or arbitrary truncation. Query and memory cost still grow up to the maximum. A measured aggregate-query/index review can follow V2-6 transaction stabilization; V2-7 alone owns caching.

## Explicit Non-Goals

No V2-5 export, CSV/XLSX control, ExcelJS, Prisma schema change, migration, InventoryTransaction, Receipt, Issue, Transfer, caching, accent preset, website asset, new module, diagram engine, React Flow, Mermaid, Platform Service, Dynamic System, runtime AI, background job, or FastAPI work is included.

V2-5 remains blocked pending Founder acceptance. Website screenshot/video asset production remains paused.
