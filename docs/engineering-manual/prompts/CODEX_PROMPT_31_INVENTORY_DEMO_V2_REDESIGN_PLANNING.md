# OneDayOS — Inventory Demo V2 Product Redesign and Architecture Reconciliation

You are performing a Founder-directed product redesign and architecture reconciliation before any further website asset production.

This is a planning, specification, and ADR package only.

Do not implement application code.

Do not install dependencies.

Do not modify Prisma schema.

Do not create migrations.

Do not modify Inventory business logic.

Do not modify UI components.

Do not modify runtime caching.

Do not modify themes.

Do not modify the module generator.

Do not create exports.

Do not run demo reset unless needed only for read-only inspection; prefer no DB-affecting commands.

Do not create screenshots for publication.

The static website asset production package is paused because the current product surfaces are changing.

## Founder Change Request

The Founder tested the controlled Inventory demo and requested these changes:

1. Page headers consume too much vertical space.
2. Dashboard needs real charts and more visual life.
3. Process Flow should look like an actual diagram with arrows.
4. Product Settings should not remain a separate Inventory sidebar tab.
5. Tables need search and filters.
6. Stock Levels needs a per-row Adjust Stock action.
7. Create/edit/adjust actions should open modals rather than navigate away.
8. Eligible tables need CSV and Excel export.
9. Related Records opened from Inventory should preserve Inventory context; Shared Records should also become a built-in app.
10. Rows should be clickable and open edit or view modals according to permission.
11. Appearance should support curated color choices, not only dark blue/orange.
12. Tenant-safe caching should be designed for cost and performance.
13. Inventory should meaningfully connect Suppliers, Customers, and Warehouses rather than remain adjustment-only.

## Product Direction Approved for Planning

Use these as the recommended direction to formalize and evaluate.

### A. Compact Operational Page Header

Do not remove page titles entirely.

Define two header modes:

1. Compact Operational Header
   - compact breadcrumb
   - title and primary action on one row
   - description omitted when obvious or moved into contextual help
   - used for tables, dashboards, and routine forms

2. Explanatory Header
   - breadcrumb
   - title
   - short description
   - used for Process Flow, onboarding, app launcher, and complex concepts

The sidebar and breadcrumb help orientation, but the page title remains for clarity, accessibility, and document structure.

### B. Dashboard V2

Use real data only.

Recommended visual sections:

- KPI cards:
  - Tracked Products
  - Low Stock
  - Out of Stock
  - Warehouses with Stock

- Real charts:
  - Stock Health distribution
  - Inbound vs Outbound movement trend
  - Stock or low-stock count by Warehouse

- Recent activity:
  - recent movements
  - recent adjustments

Do not use fake chart data.

Audit a chart dependency separately.

Recommended candidate:

- Recharts v3 with a small OneDayOS chart wrapper inspired by composition-based chart patterns
- no wholesale shadcn installation
- no chart dependency until compatibility and bundle impact are reviewed

Charts must remain understandable through labels/tables and not rely only on color.

### C. Process Flow Diagram V2

Keep the existing semantic process definition.

Replace card-only presentation with:

- actual directional connectors/arrows
- clear start, sequence, branch, and output relationships
- responsive horizontal diagram on large screens
- vertical diagram on narrow screens
- ordered semantic text fallback
- accessible labels
- no React Flow or diagram engine unless separately justified

Recommended process:

Shared Records
→ Inventory Tracking Rules
→ Inventory Transaction
→ Transactional Posting
→ Stock Balance + Movement Ledger
→ Low-Stock Detection

Future Receipts, Issues, and Transfers must be reflected once Inventory V2 is implemented.

### D. Remove Product Settings as a Top-Level Sidebar Page

Product identity remains in Shared Records.

Inventory-specific tracking settings remain valid but should move into:

- Product detail modal with an Inventory section/tab, or
- Stock Levels/Product row modal where permitted

The separate Product Settings sidebar item should be removed.

Preserve services/data until a safe route deprecation plan exists.

The old route may redirect to Products or Stock Levels for compatibility.

### E. Data Table V2

Design a reusable operational table system supporting:

- search
- allowlisted filters
- sorting
- pagination
- row selection
- column visibility
- row actions
- clickable/keyboard-openable rows
- loading/empty/filtered-empty/error states
- URL/query-state persistence where useful
- server-side mode for larger data sets
- permission-aware actions
- export actions for eligible tables

Audit stable `@tanstack/react-table` v8 as the preferred headless engine.

Do not use a beta major version.

Preserve OneDayOS markup and styling.

Do not use a table component that owns the visual design.

### F. Permission-Aware Row Interaction

Every eligible table row should support:

- pointer click
- keyboard Enter/Space
- visible focus
- explicit action menu
- action cells that do not trigger the row accidentally

Behavior:

- users with update permission open Edit modal
- users with read-only permission open View modal
- users without read permission do not receive the row/data
- UI hiding remains usability only; server permissions remain authoritative

### G. URL-Addressable Modals

Primary create/edit/view interactions should open as dialogs/sheets while preserving:

- shareable URL
- browser back/forward
- refresh fallback
- direct full-page fallback
- accessible focus handling
- permission checks
- server validation

Audit Next.js Parallel Routes + Intercepting Routes for this pattern.

Recommended behavior:

- desktop: modal/dialog
- smaller screens: sheet/full-screen dialog
- direct navigation or refresh: full page fallback
- no loss of unsaved form data without warning

Apply first to:

- New Stock Adjustment
- Adjust Stock from Stock Levels row
- Product view/edit
- Category view/edit
- Supplier view/edit
- Customer view/edit
- Warehouse view/edit

### H. Export V1

Do not create a broad Import/Export Engine.

Create a bounded reusable export capability for eligible tables.

Required:

- CSV
- XLSX
- explicit export permission separate from read
- current filters/sort applied
- selected rows or all filtered rows
- allowlisted columns
- tenant-scoped server export
- row-count limit
- safe filenames
- no hidden/internal IDs unless approved
- no cross-tenant leakage
- no client-generated export from untrusted hidden data

Plan explicit permissions such as:

- inventory.stock_level.export
- inventory.stock_movement.export
- inventory.stock_adjustment.export
- objects.product.export
- objects.customer.export
- objects.supplier.export
- objects.warehouse.export

Audit the XLSX library separately for maintenance, license, bundle, and server compatibility.

### I. Shared Records as a Built-In App + Context-Preserving Related Records

This is a Founder change to the earlier IA decision.

Define:

- Inventory: business module/app
- Organization: built-in admin app
- Shared Records: built-in records app

App switcher may show Shared Records when the user has at least one shared-record read permission.

Shared Records app contains:

- Products
- Categories
- Customers
- Suppliers
- Warehouses
- People remains in Organization, not Shared Records primary navigation

When a user opens a Related Record from inside Inventory:

- preserve Inventory sidebar/context
- render shared record content through contextual nested/intercepted routes or modal
- do not imply Inventory owns the record
- provide shared ownership wording
- app switcher remains available

Direct access to Shared Records app remains available for cross-app management.

Avoid duplicating service/business logic.

### J. Curated Accent Presets, Not Arbitrary Per-Part Coloring

Do not implement a theme builder or make every UI part independently configurable.

Plan a curated Accent preference in Appearance:

- Neutral
- Orange
- Blue
- Violet
- Emerald
- Rose

Recommended default for review:

- Neutral/shadcn-like simple interface
- OneDayOS brand mark remains orange

Accent presets may affect:

- primary actions
- focus ring
- selected states
- chart accents
- links where appropriate

They must not alter:

- destructive red
- warning amber
- success green
- information blue semantics where conflict exists
- content readability
- layout
- font
- radius
- arbitrary component-specific colors

All presets require light/dark contrast tests.

Appearance remains user/browser scoped for MVP.

No organization-wide arbitrary palette.

This change requires an ADR amendment to the previous fixed-orange primary decision.

### K. Tenant-Safe Caching Strategy

Caching is a separate architecture package.

Do not simply cache every query.

Never cache:

- authentication state
- permission decisions without a proven safe key/expiry model
- PlatformContext
- rapidly changing Stock Balances where stale values are unacceptable
- form mutations
- sensitive cross-tenant responses
- exports

Potentially cache:

- static module metadata
- slow-changing Product Categories
- Supplier/Warehouse lookup lists
- selected shared-record lists with tenant-specific tags
- dashboard historical aggregates for a short TTL
- non-sensitive process/documentation content

Requirements:

- cache keys include tenant identity
- user/permission-sensitive results include appropriate scope or remain uncached
- tags include organization and resource
- invalidation occurs after mutations
- read-your-own-write behavior is preserved
- no stale stock value immediately after an adjustment
- cache hit/miss behavior is observable in tests/logging
- cost benefit is measured rather than assumed

Audit current Next.js 16 cache mode before choosing Cache Components or the previous caching model.

Do not enable global caching without an ADR.

### L. Inventory V2 Operational Workflows

The current adjustment-only Inventory is not the final demo target.

Plan these manual Inventory workflows:

1. Receive Stock
   - references shared Supplier
   - destination Warehouse
   - one or more Product lines
   - quantity
   - reference number/date
   - creates inbound Stock Movements and updates Stock Balances

2. Issue Stock
   - may reference shared Customer or another recipient/reference
   - source Warehouse
   - one or more Product lines
   - quantity
   - prevents negative stock
   - creates outbound Stock Movements and updates Stock Balances

3. Transfer Stock
   - source Warehouse
   - destination Warehouse
   - one or more Product lines
   - paired outbound/inbound movements
   - one transaction
   - no quantity creation/loss

4. Stock Adjustment
   - remains for corrections/opening balances
   - not used as a substitute for receipts/issues/transfers

Important boundaries:

- Inventory references but does not own Supplier, Customer, Warehouse, or Product
- no Purchase Orders
- no Sales Orders
- no accounting
- no valuation/costing
- no approvals
- no notifications
- no lots/serials
- no background jobs

Update the planned Inventory sidebar to:

```text
Dashboard
Process Flow
Stock Levels

Transactions
  Receipts
  Issues
  Transfers
  Adjustments

Movement Ledger

Related Records
  Products
  Categories
  Suppliers
  Customers
  Warehouses
```

Evaluate whether Movement Ledger remains one page or filtered views.

## Required Deliverables

Create:

```text
docs/engineering-manual/00-meta/adrs/
  ADR-0014-compact-operational-page-header.md
  ADR-0015-shared-records-built-in-app-context.md
  ADR-0016-data-table-v2-and-modal-interactions.md
  ADR-0017-bounded-table-export.md
  ADR-0018-tenant-safe-caching-strategy.md
  ADR-0019-curated-accent-presets.md
  ADR-0020-inventory-v2-operational-workflows.md
```

All ADRs:

```text
Status: Proposed
Date: 2026-07
Implementation Allowed: No — Founder review required
```

Create:

```text
docs/engineering-manual/03-design-system/
  15-compact-operational-page-header.md
  16-data-table-v2.md
  17-modal-interaction-standard.md
  18-curated-accent-presets.md

docs/engineering-manual/02-architecture/
  07-tenant-safe-caching-strategy.md

docs/engineering-manual/08-module-system/
  10-contextual-shared-records.md

docs/engineering-manual/14-testing-quality/
  10-data-table-modal-export-testing.md

docs/engineering-manual/17-module-specifications/
  09-inventory-v2-module.md

docs/engineering-manual/00-meta/
  INVENTORY-DEMO-V2-CHANGE-IMPACT-REPORT.md
  INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md
```

Metadata for new detailed specs:

```text
Status: Draft for Founder Review
Implementation Allowed: No
```

Do not edit frozen existing docs yet except for a narrow note that a Founder-directed redesign is under review.

## Required Audits

### Current implementation audit

Inspect:

- all Inventory pages and routes
- current dashboard service/data
- current Process Flow renderer
- current DataTable and ListPage
- current modal/dialog primitives
- current route structure
- current Shared Records app/shell behavior
- current Product Settings APIs/services
- current export utilities/dependencies
- current theme tokens/provider
- current Next.js caching config
- current Inventory schema
- current Supplier/Customer/Warehouse relationships
- current tests and quality gates

### Dependency audit

Evaluate, without installing:

- Recharts v3
- stable `@tanstack/react-table` v8
- one XLSX library candidate
- modal primitive options:
  - current custom primitive
  - selective Radix Dialog
  - native dialog
- current Next.js intercepting/parallel routes
- current Next.js caching mode

Record:

- version
- maintenance
- license
- bundle/server implications
- React 19 / Next 16 compatibility
- reasons to accept or reject

### Data migration impact

For Inventory V2, propose data models but do not edit Prisma.

Compare:

1. Separate models:
   - StockReceipt / StockReceiptLine
   - StockIssue / StockIssueLine
   - StockTransfer / StockTransferLine

2. Unified transaction model:
   - InventoryTransaction
   - InventoryTransactionLine
   - type = receipt / issue / transfer / adjustment

Recommend one.

Address:

- transaction status
- posting/immutability
- supplier/customer references
- source/destination warehouse
- movement generation
- rollback
- soft delete/void behavior
- existing StockAdjustment compatibility
- migration/backfill of demo data
- permissions
- event names
- APIs
- tests

Do not implement.

## Implementation Roadmap

Produce phased packages with dependencies and rollback points.

Recommended sequence:

### Package V2-1 — Compact Header + Shared Records IA

- compact operational page headers
- Shared Records built-in app
- context-preserving Related Records
- remove Product Settings sidebar item
- route deprecation/redirect plan

### Package V2-2 — Data Table V2

- search
- filters
- sorting
- pagination
- selection
- column visibility
- permission-aware row click/actions
- Stock Levels per-row Adjust action

### Package V2-3 — URL-Addressable Modals

- view/edit/create modal pattern
- direct page fallback
- Product/Warehouse/Supplier/Customer modals
- Adjustment modal

### Package V2-4 — Dashboard + Process Flow Visual Upgrade

- real charts
- chart tokens
- responsive accessible process diagram
- no fake data

### Package V2-5 — Export V1

- CSV
- XLSX
- export permissions
- filtered/selected scope
- server generation
- limits/tests

### Package V2-6 — Inventory V2 Core Transactions

- Receipts
- Issues
- Transfers
- updated movements/balances
- Supplier/Customer/Warehouse connection
- schema/migrations/services/APIs/tests/UI

### Package V2-7 — Tenant-Safe Caching

- only after read/mutation shapes stabilize
- metrics/reference-data caching
- no stale stock
- invalidation tests
- cost measurement

### Package V2-8 — Curated Accent Presets

- after structural UI stabilizes
- Neutral default decision
- light/dark token sets
- contrast/a11y tests
- profile Appearance integration

For every package include:

- goals
- authoritative docs
- files likely created/modified
- schema impact
- dependency impact
- tests
- migrations
- risks
- rollback
- exit criteria
- what remains forbidden

## Founder Decision Table

Create a concise final decision table requiring Founder approval for:

1. Compact header model
2. Shared Records built-in app
3. Product Settings removal/migration
4. TanStack Table v8 adoption
5. Recharts v3 adoption
6. Modal routing with intercepting routes
7. CSV + XLSX export
8. XLSX library choice
9. Inventory V2 unified vs separate transaction models
10. Customer reference in Stock Issue
11. Curated accent presets
12. Default accent:
    - Neutral
    - Orange
13. Caching scope
14. Public website asset production pause

## Verification

Documentation/audit only.

Run:

```bash
git status --short
find src/app -type f | sort
find src/components -type f | sort
find src/modules/inventory -type f | sort
rg -n "Product Settings|Stock Levels|Stock Movements|Stock Adjustments|DataTable|ListPage|ProcessFlow|cacheComponents|use cache|unstable_cache|revalidateTag|updateTag" src next.config.* package.json
rg -n "recharts|@tanstack/react-table|exceljs|xlsx|@radix-ui/react-dialog|<dialog" package.json package-lock.json src
git diff --check
```

Do not run:

- npm install
- migrations
- demo reset
- shadcn CLI
- implementation tests unless needed for inspection
- npm audit fix

## Final Report Required

Report:

1. Founder change-request summary.
2. Current implementation audit.
3. Which requests are UX refinements.
4. Which requests are platform capabilities.
5. Which requests require schema/migration changes.
6. Which requests conflict with prior frozen decisions.
7. Proposed ADRs/specs created.
8. Data Table V2 recommendation.
9. Modal architecture recommendation.
10. Dashboard/chart recommendation.
11. Process Flow diagram recommendation.
12. Export recommendation.
13. Shared Records app recommendation.
14. Product Settings migration recommendation.
15. Accent-preset recommendation.
16. Tenant-safe caching recommendation.
17. Inventory V2 model recommendation.
18. Dependency audit.
19. Phased implementation roadmap.
20. Founder decisions required.
21. Risks and rollback strategy.
22. Exact commands and results.
23. Confirmation that no application code, dependencies, Prisma, migrations, business logic, theme behavior, or runtime caching changed.
24. Whether website asset production should remain paused.
25. Whether implementation remains blocked pending Founder approval.

Stop after planning.

Do not implement any Founder change request until the Founder reviews and accepts the ADRs, specifications, dependency choices, and phased roadmap.
