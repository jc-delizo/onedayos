# OneDayOS — Inventory Demo V2 Founder Decision, Freeze, and V2-1 Handoff

You completed the Inventory Demo V2 planning and specification package.

This task is documentation governance only.

Do not implement application code.

Do not install dependencies.

Do not modify Prisma schema.

Do not create or run migrations.

Do not modify runtime UI, business logic, caching, exports, charts, modals, themes, or navigation.

Do not run demo reset.

Do not resume website asset production.

The Founder has reviewed the planning recommendations and explicitly approves the decisions below.

## Founder Decisions

### 1. Compact Operational Page Header

Approved.

OneDayOS will keep page titles, but routine operational pages will use a compact header:

- compact breadcrumb
- title and primary action on one row
- description omitted when obvious
- contextual help used when explanation is still needed

Explanatory headers remain for:

- Process Flow
- onboarding
- app launcher
- complex concepts

### 2. Shared Records Built-In App

Approved.

Shared Records becomes a built-in app in the Apps switcher when the user has at least one relevant shared-record read permission.

Shared Records contains:

- Products
- Product Categories
- Customers
- Suppliers
- Warehouses

People remains under Organization.

Shared Records is not controlled by OrgModule.

Shared Records services and APIs remain shared platform surfaces.

### 3. Context-Preserving Related Records

Approved.

When a user opens Products, Categories, Customers, Suppliers, or Warehouses from inside Inventory:

- Inventory app context remains visible
- Inventory sidebar remains visible
- shared ownership remains explicit
- no Inventory-owned duplicate record is created
- app switcher remains available
- direct Shared Records app access remains available

The implementation must reuse shared services/components, not duplicate business logic.

### 4. Product Settings Migration

Approved.

Remove Product Settings as a top-level Inventory sidebar item.

Inventory-specific Product settings remain valid.

Migration direction:

- tracking and reorder-point settings move into Product/Stock context
- V2-1 removes the main navigation item but preserves access through a contextual action
- V2-1 must not make existing settings inaccessible
- a temporary full-page contextual route/fallback is allowed
- V2-3 will move view/edit behavior into URL-addressable modals
- the old Product Settings route receives a documented compatibility/deprecation plan
- no data or service deletion occurs until migration is complete

### 5. Data Table V2

Approved.

Adopt stable `@tanstack/react-table` v8 as the headless table engine.

OneDayOS retains:

- its own markup
- OneDayOS Compact styling
- permission behavior
- loading/empty/error patterns
- server/API architecture

Data Table V2 will support:

- search
- allowlisted filters
- sorting
- pagination
- row selection
- column visibility
- row actions
- keyboard-accessible clickable rows
- permission-aware view/edit behavior
- URL/query-state persistence where useful
- server-side mode for larger data sets
- export integration later

Do not use a beta major.

### 6. Dashboard Charts

Approved.

Use Recharts v3 through a small OneDayOS chart wrapper.

Requirements:

- real service-backed data only
- no fake metrics
- no fake trends
- accessible labels/legends
- not color-only
- textual/table fallback or equivalent accessible summary
- responsive
- OneDayOS Compact tokens
- charts remain compositional, not a chart engine

Planned dashboard charts:

- Stock Health distribution
- Inbound vs Outbound movement trend
- Stock/low-stock by Warehouse

### 7. Modal Interaction Architecture

Approved.

Use URL-addressable modals with direct full-page fallbacks.

Use Next.js App Router Parallel Routes + Intercepting Routes where appropriate.

Approve selective use of Radix Dialog as the accessible dialog primitive.

This is not approval for a broad Radix/shadcn migration.

Required behavior:

- desktop dialog
- small-screen sheet/full-screen treatment
- direct URL fallback
- refresh fallback
- browser Back/Forward behavior
- accessible focus trap/return
- Escape handling
- title/description semantics
- server-side authorization and validation remain authoritative

Initial targets:

- New Stock Adjustment
- Adjust Stock from Stock Levels
- Product view/edit
- Product Category view/edit
- Customer view/edit
- Supplier view/edit
- Warehouse view/edit

### 8. Bounded CSV/XLSX Export

Approved.

Export remains a bounded reusable capability, not a broad Import/Export Engine.

Required:

- CSV
- XLSX
- explicit export permissions separate from read
- server-side tenant scoping
- current allowlisted filters/sort
- selected rows or all filtered rows
- allowlisted columns
- row-count limit
- safe filenames
- no hidden/internal IDs unless explicitly approved
- no cross-tenant data
- no client-side export from untrusted hidden datasets

### 9. XLSX Library

Conditionally approved:

```text
exceljs@4.4.0
```

Use it server-side only and isolate it behind a small OneDayOS export adapter.

Before V2-5 implementation:

- recheck Node 24 and Next.js 16 compatibility
- recheck maintenance/security state
- confirm no critical advisories
- confirm server-bundle behavior
- document replacement seam

Do not include ExcelJS in client bundles.

If the implementation-time audit finds unacceptable risk, stop for Founder review rather than silently choosing another XLSX library.

### 10. Inventory V2 Transaction Model

Approved:

```text
Unified InventoryTransaction
Unified InventoryTransactionLine
```

Planned transaction types:

- receipt
- issue
- transfer
- adjustment

The model must preserve clear type-specific validation and posting rules.

Requirements:

- immutable/posted transaction behavior
- transactional movement and balance updates
- optional Supplier on receipt
- optional Customer on issue
- source Warehouse where applicable
- destination Warehouse where applicable
- line-level Product and quantity
- no negative stock
- paired transfer movements
- no quantity creation/loss on transfer
- safe void/reversal strategy
- explicit permissions
- explicit events
- migration/backfill plan for current StockAdjustment demo data

Do not implement schema changes during this freeze task.

### 11. Customer Reference on Issues

Approved as optional.

A Stock Issue may have:

```text
customerId?: shared Customer reference
```

The Customer reference is not mandatory because an issue may represent:

- internal consumption
- damage/write-off
- samples
- non-customer recipients
- other approved outbound reasons

Do not introduce a generic Party model.

Do not imply CRM or Sales Orders are implemented.

### 12. Curated Accent Presets

Approved.

Appearance will later offer:

- Neutral
- Orange
- Blue
- Violet
- Emerald
- Rose

Default:

```text
Neutral
```

OneDayOS brand mark remains orange.

Curated accents may affect:

- primary actions
- focus ring
- selected states
- links
- chart accents

They must not override semantic:

- destructive
- warning
- success
- information

No arbitrary per-component color selector.

No theme builder.

No custom CSS.

No organization-wide arbitrary palette in MVP.

### 13. Tenant-Safe Caching

Approved as a deferred, selective package after V2 query/mutation shapes stabilize.

Never cache:

- authentication
- PlatformContext
- permission decisions without a separately approved safe model
- exports
- mutations
- fresh Stock Balances
- Stock Movements requiring immediate freshness
- cross-tenant responses
- sensitive personalized data by incomplete keys

Potentially cache:

- static module metadata
- Product Categories
- Supplier/Warehouse lookup lists
- carefully scoped shared-record lookups
- short-lived dashboard historical aggregates
- static Process Flow/documentation content

Requirements:

- organization in every cache key/tag
- permission/user scope where necessary
- explicit mutation invalidation
- read-your-own-write behavior
- no stale stock immediately after posting
- tests for invalidation
- measured cost/latency benefit
- architecture ADR controls activation

V2-7 must audit the current Next.js 16 caching model before implementation.

### 14. Website Asset Production

Pause remains approved.

Do not resume final website screenshots/video assets until:

- V2-1 through V2-6 are complete and audited
- V2-8 accent choice is stable, or the Founder explicitly approves capture before V2-8
- controlled demo reset/check pass
- no Blocker/Must-Fix findings remain

The existing asset planning documents remain valid but unexecuted.

## Implementation Sequence

Freeze this sequence:

```text
V2-1  Compact Header + Shared Records IA
V2-2  Data Table V2
V2-3  URL-Addressable Modals
V2-4  Dashboard Charts + Process Flow Diagram V2
V2-5  CSV/XLSX Export V1
V2-6  Inventory V2 Core Transactions
V2-7  Tenant-Safe Caching
V2-8  Curated Accent Presets
```

Do not reorder without an ADR/amendment.

## Task 1 — Inspect Planning Documents

Inspect:

- ADR-0014 through ADR-0020
- 03-design-system/15 through 18
- 02-architecture/07
- 08-module-system/10
- 14-testing-quality/10
- 17-module-specifications/09-inventory-v2-module.md
- INVENTORY-DEMO-V2-CHANGE-IMPACT-REPORT.md
- INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md

Report any conflict with the Founder decisions above.

If a conflict is ambiguous, stop and report.

Otherwise reconcile the documents.

## Task 2 — Accept ADRs

Update:

- ADR-0014
- ADR-0015
- ADR-0016
- ADR-0017
- ADR-0018
- ADR-0019
- ADR-0020

To:

```text
Status: Accepted
Date: 2026-07
```

Add implementation timing where relevant:

- ADR-0014: V2-1
- ADR-0015: V2-1
- ADR-0016: V2-2 and V2-3
- ADR-0017: V2-5
- ADR-0018: V2-7 only after stabilization
- ADR-0019: V2-8
- ADR-0020: V2-6

Record all conditional decisions accurately.

## Task 3 — Freeze Detailed Specs

Update these detailed specs to Frozen:

- 03-design-system/15-compact-operational-page-header.md
- 03-design-system/16-data-table-v2.md
- 03-design-system/17-modal-interaction-standard.md
- 03-design-system/18-curated-accent-presets.md
- 02-architecture/07-tenant-safe-caching-strategy.md
- 08-module-system/10-contextual-shared-records.md
- 14-testing-quality/10-data-table-modal-export-testing.md
- 17-module-specifications/09-inventory-v2-module.md

Use:

```text
Status: Frozen
```

Set implementation permission precisely:

- Header/context spec: implementation allowed in V2-1
- Data Table spec: implementation allowed in V2-2
- Modal spec: implementation allowed in V2-3
- Accent spec: implementation allowed in V2-8
- Caching spec: implementation allowed in V2-7 only
- Contextual Shared Records: implementation allowed in V2-1
- Testing spec: authority for V2-2 through V2-5
- Inventory V2 spec: implementation allowed in V2-6

Do not imply all V2 work is allowed immediately.

## Task 4 — Reconcile Reports and Roadmap

Update:

- `INVENTORY-DEMO-V2-CHANGE-IMPACT-REPORT.md`
- `INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`

Add:

- Founder decisions
- accepted dependency choices
- conditional ExcelJS decision
- unified transaction decision
- optional Customer reference
- Neutral accent default
- caching deferral
- website asset pause
- package order
- rollback boundaries

Remove unresolved-decision language that is now decided.

Preserve risks and caveats.

## Task 5 — Create Founder Decision Report

Create:

```text
docs/engineering-manual/00-meta/
  INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md
```

Include:

- date
- approved decisions
- conditional decisions
- rejected alternatives
- deferred capabilities
- package order
- website asset pause
- public-demo status
- production-readiness status

Required status language:

```text
Inventory Demo V2 direction approved.
Implementation is authorized one package at a time.
Only V2-1 is authorized next.
```

## Task 6 — Create Freeze Report

Create:

```text
docs/engineering-manual/00-meta/
  INVENTORY-DEMO-V2-FREEZE-REPORT.md
```

Include:

- documents inspected
- conflicts found
- conflicts resolved
- ADR statuses
- spec statuses
- implementation timing
- dependencies approved
- conditional library decision
- risks
- V2-1 readiness

## Task 7 — Create V2-1 Implementation Package

Create:

```text
docs/engineering-manual/00-meta/
  IMPLEMENTATION-PACKAGE-V2-1-COMPACT-HEADER-SHARED-RECORDS-IA.md
```

V2-1 scope only:

### Allowed

- compact operational header mode
- explanatory header mode preservation
- Shared Records built-in app in app switcher
- permission-aware Shared Records app visibility
- Shared Records sidebar:
  - Products
  - Categories
  - Customers
  - Suppliers
  - Warehouses
- context-preserving Related Records inside Inventory
- Inventory sidebar remains visible for contextual Records
- shared ownership wording
- remove Product Settings from top-level Inventory nav
- preserve Inventory settings through contextual access
- old Product Settings route compatibility/deprecation handling
- focused navigation/UX tests
- `check:ux` updates
- conformance documentation updates

### Forbidden

- TanStack Table installation or Data Table V2
- Radix Dialog or modal routing
- Recharts or charts
- export
- XLSX
- Prisma/schema/migrations
- Receipts/Issues/Transfers
- caching
- accent presets
- public assets
- new business modules
- Platform Services
- Dynamic Systems
- runtime AI
- FastAPI

### Exit Criteria

- compact headers reduce vertical space
- page titles remain semantic
- Shared Records appears as built-in app when permitted
- Records are not OrgModule-controlled
- direct Shared Records navigation works
- Inventory Related Records preserve Inventory context
- Product/Warehouse/Supplier/Customer remain shared
- Product Settings removed from main nav without losing access
- app switcher and profile menu remain correct
- Light/Dark/System remain correct
- all existing security/tenant gates pass
- no schema/dependency changes
- controlled demo remains resettable
- website asset production remains paused

Include authoritative documents and required verification commands.

Do not implement V2-1 during this task.

## Task 8 — Update Roadmap Registry

Update the canonical roadmap and ADR index as required:

- register ADR-0014 through ADR-0020
- register new V2 specs
- register V2 freeze/decision reports
- register V2 implementation sequence

Preserve existing history.

## Verification

Documentation-only verification:

```bash
find docs/engineering-manual/00-meta/adrs -maxdepth 1 -type f | sort
find docs/engineering-manual/03-design-system -maxdepth 1 -type f | sort
find docs/engineering-manual/17-module-specifications -maxdepth 1 -type f | sort
rg -n "Status: Proposed|Implementation Allowed: No — Founder review required" \
  docs/engineering-manual/00-meta/adrs/ADR-001{4,5,6,7,8,9}-*.md \
  docs/engineering-manual/00-meta/adrs/ADR-0020-*.md
rg -n "TanStack|Recharts|Radix|ExcelJS|InventoryTransaction|Neutral|website asset" \
  docs/engineering-manual/00-meta \
  docs/engineering-manual/02-architecture \
  docs/engineering-manual/03-design-system \
  docs/engineering-manual/08-module-system \
  docs/engineering-manual/14-testing-quality \
  docs/engineering-manual/17-module-specifications
git diff --check
git status --short
```

Do not run:

- npm install
- tests/build
- migrations
- demo reset
- shadcn CLI
- implementation commands
- npm audit fix

## Final Report Required

Report:

1. Decision/freeze summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. ADR statuses.
6. Spec statuses and implementation timing.
7. Conflicts found/resolved.
8. Accepted dependencies.
9. Conditional ExcelJS decision.
10. Unified Inventory transaction decision.
11. Shared Records/Product Settings decisions.
12. Accent/caching decisions.
13. Website asset pause status.
14. V2 package order.
15. V2-1 handoff path and scope.
16. Exact verification commands and results.
17. Confirmation that no application code, dependencies, Prisma, migrations, business logic, runtime UI, caching, theme behavior, or demo data changed.
18. Whether V2 planning is frozen.
19. Whether V2-1 implementation is ready for explicit Founder approval.
20. Whether all later V2 packages remain blocked.

Stop after governance.

Do not implement V2-1 or any later package without explicit Founder approval.
