# OneDayOS — Inventory Demo V2 Package V2-2
# Data Table V2

V2-1 has passed automated gates, authenticated acceptance review, and dependency security remediation.

The Founder accepts the V2-1 visual and information-architecture result and explicitly authorizes **V2-2 only**.

V2-3 through V2-8 remain blocked.

## Completed Preconditions

- V2-1 compact headers and Shared Records IA are implemented.
- Shared Records is a permission-aware built-in app.
- Inventory contextual Related Records preserve Inventory context.
- Product Settings is removed from top-level Inventory navigation but remains contextually accessible.
- Next.js is patched to 16.2.11.
- Prisma packages are aligned on 7.9.0.
- `sharp`, PostCSS, and tooling advisories are remediated.
- All dependency audits are currently clean.
- `check:all` and `demo:check` pass.
- Controlled demo registration remains disabled.
- Website asset production remains paused.

## Primary Authority

Read and follow first:

- `docs/engineering-manual/03-design-system/16-data-table-v2.md`
- `docs/engineering-manual/14-testing-quality/10-data-table-modal-export-testing.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0016-data-table-v2-and-modal-interactions.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/00-meta/V2-1-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`

Also obey:

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/03-design-system/15-compact-operational-page-header.md`
- `docs/engineering-manual/08-module-system/10-contextual-shared-records.md`
- `docs/engineering-manual/04-kernel/04-authorization-enforcement.md`
- `docs/engineering-manual/04-kernel/08-kernel-api-contracts.md`
- `docs/engineering-manual/05-sdk/02-sdk-db-access.md`
- `docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md`
- `docs/engineering-manual/06-data/01-tenancy-data-isolation.md`
- `docs/engineering-manual/06-data/03-soft-delete-archival.md`
- `docs/engineering-manual/06-data/05-data-validation-zod.md`
- `docs/engineering-manual/07-business-objects/00-business-object-philosophy.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/04-api-security.md`
- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`
- `docs/engineering-manual/14/testing-quality/08-ci-quality-gates.md` if present; otherwise `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`

If these documents conflict, stop and report the conflict instead of inventing a resolution.

# Founder-Approved V2-2 Decision

Adopt stable `@tanstack/react-table` v8 as a headless table engine.

OneDayOS retains:

- OneDayOS Compact visual design
- its own table markup and wrappers
- current server/API architecture
- tenant and permission enforcement
- contextual page states
- semantic tokens
- Light / Dark / System
- full control over row interactions

Do not install or use a beta major version.

## Required Data Table V2 Capabilities

- search
- page-specific allowlisted filters
- sorting
- pagination
- row selection
- column visibility
- explicit row action menu
- pointer-clickable rows
- keyboard-openable rows
- permission-aware view/edit behavior
- URL/query-state persistence where appropriate
- server-side mode for larger data sets
- responsive horizontal overflow
- contextual loading, true-empty, filtered-empty, and safe-error states
- reusable client-side and server-controlled modes

## Row Interaction Contract

For every eligible operational data row:

- update permission → activate canonical edit route
- read-only permission → activate canonical view/detail route
- no read permission → row/data is not returned
- action cells/checkboxes/buttons must not accidentally trigger row activation
- Enter and Space activate an interactive row
- visible focus is required
- explicit action menu remains available

V2-2 uses full-page canonical routes.

V2-3 will later intercept those routes into URL-addressable modals.

Do not implement modals in V2-2.

# Absolute Scope

## Allowed

- install exact compatible stable `@tanstack/react-table` v8
- create reusable Data Table V2 components
- create table query-state types/helpers
- add allowlisted list query schemas
- add search/filter/sort/pagination to current list services/APIs
- add pagination metadata to current API envelopes
- retrofit current Inventory, Shared Records, and Organization tables
- create canonical full-page view/detail routes needed for row interaction
- preserve existing edit/create routes
- add per-row Stock Levels `Adjust Stock` action
- prefill the existing New Stock Adjustment full-page form
- add permission-aware row actions
- add URL query persistence
- add local column-visibility preference if safely scoped
- add tests, a11y checks, `check:ux` checks, conformance updates
- update controlled demo docs if needed

## Forbidden

Do not:

- install Radix Dialog
- implement modals
- implement intercepting/parallel routes
- install Recharts
- add charts
- redesign Process Flow
- implement CSV/XLSX export
- install ExcelJS
- change Prisma schema
- create migrations
- implement InventoryTransaction
- implement Receipts, Issues, Transfers
- implement caching
- implement accent presets
- resume website asset production
- change Inventory stock-posting logic
- add new modules
- add Platform Services, Dynamic Systems, runtime AI, or FastAPI
- run `npm audit fix` or `npm audit fix --force`

# Repository Safety

The worktree may contain prior uncommitted changes.

Before coding:

1. Run `git status --short`.
2. Record current changed/untracked files.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Do not restore historical implementation.
5. Keep edits strictly within V2-2.
6. Do not create a commit unless separately instructed.

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

If Node 24 is not active, switch using the repository’s supported mechanism before changing dependencies.

# Local Port Rule

The app remains on port `1320`.

Do not switch to `3000`.

# Before Coding

Inspect and report briefly:

1. Current shared `DataTable` component and APIs.
2. Current `ListPage` API.
3. Current table/list client components.
4. Current list service signatures.
5. Current list API query parsing.
6. Current API envelope/meta types.
7. Current pagination/query utilities.
8. Current full-page detail/edit routes.
9. Current permissions passed to pages/components.
10. Current Stock Levels row/action behavior.
11. Current demo role permissions.
12. Current `check:ux`, a11y, and table tests.
13. Current package versions and audit state.
14. Files you plan to create.
15. Files you plan to modify.
16. Any ambiguity or risk of over-generalization.

If there is a real architecture ambiguity, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# Phase 1 — Dependency Audit and Install

## Audit

Before installation, inspect the current stable v8 release compatible with:

- React 19
- TypeScript 6
- Next.js 16.2.11
- Node 24
- current npm peer dependency tree

Do not install v9 beta or another beta major.

## Install

Add one direct runtime dependency:

```text
@tanstack/react-table
```

Pin to an exact compatible stable v8 version according to the repository dependency policy.

Do not add TanStack Query, TanStack Virtual, or other TanStack packages.

After installation:

```bash
npm ci
npm ls @tanstack/react-table
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

All audits must remain clean.

If the dependency introduces an advisory or incompatible peer state, stop and report rather than choosing another package silently.

# Phase 2 — Data Table V2 Architecture

Create a reusable, composition-first table system.

Inspect actual repository conventions before choosing exact paths.

Preferred direction:

```text
src/components/onedayos/data-table/
  data-table.tsx
  data-table-toolbar.tsx
  data-table-pagination.tsx
  data-table-column-visibility.tsx
  data-table-row-actions.tsx
  data-table-filters.tsx
  data-table-selection.tsx
  use-table-query-state.ts
  types.ts
  index.ts
  __tests__/
```

Do not create a metadata-driven CRUD engine.

## Public API Principles

The shared table system may own:

- rendering
- TanStack table instance
- search control
- filter controls
- sort control
- column visibility
- selection
- pagination controls
- row/action interaction
- loading/empty/error presentation

It must not own:

- authentication
- PlatformContext
- permissions
- data fetching
- business rules
- Prisma
- API route construction
- tenant identity
- export
- modal behavior
- domain field definitions

## Table Modes

Support a typed mode such as:

```ts
type DataTableMode = 'client' | 'server'
```

or equivalent.

### Client mode

For explicitly small, fully loaded data sets.

### Server mode

Caller supplies:

- page
- pageSize
- totalRows
- sorting state
- filters/search
- loading state
- callbacks or URL-state behavior

Do not silently load unbounded production data for client-side filtering.

## Stable Table Identity

Each table must have a stable non-secret ID, such as:

```text
inventory.stock-levels
inventory.stock-movements
inventory.stock-adjustments
objects.products
objects.product-categories
objects.customers
objects.suppliers
objects.warehouses
organization.people
organization.branches
organization.departments
```

Use it only for UI preferences such as column visibility.

Do not include org IDs or user IDs in localStorage keys.

# Phase 3 — Query-State Contract

Create shared-safe table query types and pure helpers where useful.

Preferred canonical URL parameters:

```text
q
page
pageSize
sort
direction
```

Page-specific filters use explicit allowlisted names, for example:

```text
warehouse
status
category
type
isActive
branch
department
```

Do not support arbitrary field names from the client.

## Defaults

Recommended:

```text
page = 1
pageSize = 25
pageSize options = 10, 25, 50
sort/direction = page-specific safe default
```

Cap page size at 100.

## Search

- trim input
- reject or normalize pathological input
- case-insensitive where supported
- use page-specific allowlisted searchable fields
- no raw SQL
- no orgId
- no unbounded wildcard query

## Sorting

Each endpoint/service defines an explicit sortable-field allowlist.

Do not map arbitrary client strings directly into Prisma `orderBy`.

## Filters

Each page owns a strict Zod query schema.

Use `z.strictObject()` where applicable.

Reject:

- `orgId`
- unknown filter keys
- invalid sort fields
- invalid directions
- invalid page sizes

## Pagination metadata

Use the existing API envelope:

```ts
{
  data,
  error,
  meta: {
    page,
    pageSize,
    total,
    totalPages
  }
}
```

Extend shared API meta types carefully if needed.

Do not break existing API consumers.

# Phase 4 — URL State

Search, filters, sort, and pagination should persist in URL query parameters where useful.

Requirements:

- browser Back/Forward works
- refresh preserves state
- links can be copied
- no tenant ID in URL query
- default values may be omitted from URL
- changing search/filter resets page to 1
- changing page does not reset filters
- avoid one navigation request per keystroke without a small debounce or submit behavior
- no new dependency

Column visibility may persist in localStorage under a stable non-tenant table key.

If localStorage is unavailable, fall back safely.

Do not store row data or permissions in localStorage.

# Phase 5 — Shared Component Behavior

## Search control

- visible label or accessible name
- clear button
- current query shown
- compact OneDayOS style
- no giant global-search appearance

## Filters

- page-specific controls
- visible active-filter count or summary
- clear all
- keyboard accessible
- no Dynamic Forms

## Sorting

- accessible header buttons
- indicate ascending/descending in text/ARIA, not color alone
- unsortable columns are not interactive

## Pagination

- Previous/Next
- current page
- total pages/rows
- page-size selector
- disabled states
- keyboard accessible

## Column visibility

- menu with checkboxes
- cannot hide required action/selection columns incorrectly
- caller may mark required columns
- persistence is table-specific
- no client/tenant data stored

## Row selection

- select-all-current-page behavior
- individual row checkboxes
- selected count
- selection remains page-scoped unless the implementation explicitly and safely supports otherwise
- do not add bulk mutations in V2-2
- no export button yet

## Row actions

- explicit accessible action menu/button
- no hover-only essential actions
- caller supplies permission-safe actions
- action buttons stop row activation

## Responsive behavior

- horizontal overflow for wide tables
- key columns remain readable
- no card-list redesign in this package
- no disappearing actions
- compact-medium density

# Phase 6 — Permission-Aware Row Interaction

Define a typed row interaction contract, for example:

```ts
type RowInteraction = {
  href?: string
  label: string
}
```

or equivalent.

Caller determines:

- edit href if update permission
- view href if read-only permission
- no interaction if inappropriate

## Accessibility

Interactive rows require:

- `tabIndex=0`
- accessible label
- Enter activation
- Space activation
- visible focus
- semantic table preserved
- nested interactive elements excluded from row activation

Do not use a clickable `div` instead of table semantics.

## Permission rule

UI routing is not authorization.

Direct pages and APIs must recheck permissions.

# Phase 7 — Canonical Full-Page View Routes

V2-3 will later intercept canonical routes as modals.

V2-2 must establish direct full-page fallbacks where missing.

## Shared Records

For each eligible record type, ensure canonical routes exist:

```text
/[orgSlug]/records/products/[id]
/[orgSlug]/records/products/[id]/edit

/[orgSlug]/records/product-categories/[id]
/[orgSlug]/records/product-categories/[id]/edit

/[orgSlug]/records/customers/[id]
/[orgSlug]/records/customers/[id]/edit

/[orgSlug]/records/suppliers/[id]
/[orgSlug]/records/suppliers/[id]/edit

/[orgSlug]/records/warehouses/[id]
/[orgSlug]/records/warehouses/[id]/edit
```

Use existing routes if they already exist.

Create view/detail routes only where missing.

## Inventory-context Shared Records

Provide equivalent Inventory-context canonical routes while reusing the same presenters:

```text
/[orgSlug]/inventory/related/[area]/[id]
/[orgSlug]/inventory/related/[area]/[id]/edit
```

Only show/edit according to permission.

## Inventory operational tables

Ensure direct detail routes where needed:

```text
/[orgSlug]/inventory/stock-levels/[id]
/[orgSlug]/inventory/stock-movements/[id]
/[orgSlug]/inventory/stock-adjustments/[id]
```

Do not add edit routes for immutable Stock Movements.

Do not allow posted Stock Adjustments to be edited if current business rules forbid it.

## Organization

Apply clickable rows to eligible People/Branch/Department tables.

Create minimal direct view routes only if needed for row interaction and consistent with current UX.

Do not add new Organization workflows.

# Phase 8 — Service and API Query Support

Retrofit current list endpoints and services.

## Shared Records

- Products
- Product Categories
- Customers
- Suppliers
- Warehouses

## Inventory

- Stock Levels
- Stock Movements
- Stock Adjustments
- Inventory Tracking Settings compatibility list, if still used

## Organization

- People
- Branches
- Departments where list APIs/services exist

Requirements:

- PlatformContext
- tenant scope
- permissions
- soft-delete exclusion
- strict query validation
- allowlisted search/sort/filter
- pagination count
- stable API envelope
- no raw provider errors
- no hidden/client orgId

Use database filtering where practical.

If a computed filter such as low-stock status cannot be expressed safely in the current schema:

- implement a bounded, correct service-level strategy
- ensure pagination totals are accurate
- document performance limits
- do not fake totals
- do not change schema in V2-2

# Phase 9 — Page-Specific Table Requirements

## Inventory Stock Levels

Required:

- search by Product code/name and Warehouse name where supported
- Warehouse filter
- stock-status filter:
  - In Stock
  - Low Stock
  - Out of Stock
- sort:
  - Product
  - Warehouse
  - Quantity
  - Reorder Point
  - Status where accurately supported
- pagination
- column visibility
- row selection
- clickable detail row
- per-row `Adjust Stock` action
- contextual `Inventory Tracking Settings` action where permitted

### Adjust Stock action

For users with:

```text
inventory.stock_adjustment.create
```

show an explicit row action.

V2-2 behavior:

- navigate to the existing New Stock Adjustment full-page route
- prefill Product and Warehouse using validated query params
- preserve direct full-page form
- do not implement modal yet

For users without permission:

- action absent
- direct route/API remains denied safely

Do not allow client-supplied quantities/balances.

## Stock Movements

Required:

- search by Product/reference/reason where available
- filter by movement type
- filter by Warehouse
- sort by occurred/created date, Product, quantity change
- pagination
- read-only row details
- no edit/delete action
- append-only wording remains

## Stock Adjustments

Required:

- search by Product/reason/reference where available
- filter by Warehouse/status/type where current data supports it
- sort by date/Product/quantity
- pagination
- read-only detail row for posted adjustments
- New Adjustment primary action according to permission
- no edit of posted adjustment

## Products

Required:

- search by code/name/description
- category filter
- active-state filter if current model supports it
- sort by code/name/category/updated date
- pagination
- row selection
- column visibility
- permission-aware New/Edit/View

## Product Categories

Required:

- search by name
- sort by name
- pagination
- permission-aware New/Edit/View

## Customers

Required:

- search by name/email/phone where current fields exist
- active state filter if supported
- sort by name/updated date
- pagination
- permission-aware New/Edit/View
- do not imply CRM is implemented

## Suppliers

Required:

- search by name/email/phone where current fields exist
- sort by name/updated date
- pagination
- permission-aware New/Edit/View
- do not imply Purchasing is implemented

## Warehouses

Required:

- search by code/name/address where current fields exist
- active-state filter if supported
- sort by code/name/updated date
- pagination
- permission-aware New/Edit/View
- do not imply Inventory ownership

## People

Required:

- search by name/employee number/email where current fields exist
- Branch filter
- Department filter
- employment/active filter if supported
- sort by name/employee number
- pagination
- permission-aware New/Edit/View
- Employee and User distinction remains clear

## Branches & Departments

Use table/search/filter only where it improves current presentation without inventing hierarchy behavior.

Preserve branch-optional Department rules.

# Phase 10 — Existing DataTable Compatibility

Do not leave two competing table systems indefinitely.

Choose one safe strategy:

1. Replace the old shared DataTable API with V2 while preserving a compatibility wrapper.
2. Create V2 under the existing public export and migrate all current callers.
3. Deprecate the old component with a documented removal plan.

Preferred:

- migrate all current production table callers in this package
- keep a small compatibility wrapper only if generator/current tests require it
- update generator output only if required to preserve compilation and current secure behavior

The V2-2 package may update generator templates only to use the current table public API.

Do not add new generator UX scope.

Document the decision.

# Phase 11 — Tests

Add meaningful tests.

## Shared table unit tests

- renders headers and rows
- search control
- clear search
- filter controls
- clear filters
- sorting state
- pagination
- page-size cap
- column visibility
- row selection
- action menu
- row click
- Enter activation
- Space activation
- nested action does not activate row
- loading state
- true-empty state
- filtered-empty state
- safe error
- horizontal overflow
- client mode
- server mode
- localStorage failure fallback

## Query parser tests

For every query family:

- valid defaults
- invalid page
- invalid pageSize
- pageSize >100
- invalid sort field
- invalid direction
- unknown key
- body/query orgId rejection
- search normalization
- filter allowlists

## Service/API tests

- tenant scoping
- permission denial
- correct totals
- correct totalPages
- search results
- filter results
- sorting
- pagination
- soft-delete exclusion
- wrong-org safe failure
- no raw provider error

## Row-permission tests

- update user gets edit route
- read-only user gets view route
- no-read user does not get row/data
- Warehouse Operator shared records are read-only
- Org Admin gets permitted edit actions
- direct route permission remains authoritative

## Stock Levels Adjust action tests

- present with adjustment-create permission
- absent without permission
- prefilled Product/Warehouse query
- invalid/cross-tenant prefill rejected
- no orgId
- negative-stock rule remains server-side

## Accessibility tests

Use existing axe helper.

Cover:

- toolbar
- search
- filters
- sortable headers
- pagination
- selection checkboxes
- action menu
- interactive rows
- Stock Levels
- Products
- one read-only table

Do not claim full WCAG compliance.

## `check:ux`

Add stable checks:

- production list pages use Data Table V2
- no old plain-table implementation remains in active production pages
- no generic unbounded client filtering on server-scale tables
- no arbitrary sort fields
- no orgId query
- Stock Levels has Adjust action contract
- row interaction is permission-aware
- export is not implemented early
- modal dependencies are not installed early
- website assets remain paused

Avoid brittle class-string checks.

# Phase 12 — Documentation

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-2-data-table-v2.md
```

Include:

- dependency/version
- architecture
- table modes
- query contract
- URL state
- full-page fallback routes
- row interaction
- permission behavior
- page retrofits
- Stock Levels Adjust action
- compatibility/deprecation decision
- tests
- performance limits
- explicit non-goals
- V2-3 remains blocked
- export remains V2-5
- website assets remain paused

Update truthfully:

```text
src/modules/inventory/UX-CONFORMANCE.md
src/business-objects/UX-CONFORMANCE.md
src/platform/organization/UX-CONFORMANCE.md
```

Record automated evidence and manual visual review status.

Do not claim public-demo approval.

# Phase 13 — Manual Visual Review

Use the controlled sandbox under Node 24 and `next start` on port 1320.

Do not install browser automation.

Inspect with both demo personas.

## Org Admin

- Inventory Stock Levels
- Stock Movements
- Stock Adjustments
- Shared Records Products
- Categories
- Customers
- Suppliers
- Warehouses
- Organization People
- Branches & Departments

Verify:

- search works
- filters work
- sorting works
- pagination controls are coherent
- column visibility works
- row selection works
- row click routes correctly
- edit/view actions match permission
- Adjust Stock action pre-fills correctly
- compact headers remain
- no export button yet
- no modal yet

## Warehouse Operator

Verify:

- Inventory and Shared Records available
- Organization absent
- Product/Warehouse rows open read-only view
- edit/create controls absent where not permitted
- Stock Levels Adjust action available because current role has adjustment-create permission
- Product Settings update unavailable
- direct edit/API attempts denied
- Customers absent if no permission

## Light/Dark/System

Verify table readability and selected states in both modes.

Save screenshots under `/tmp`, including:

```text
/tmp/v2-2-stock-levels-light.png
/tmp/v2-2-stock-levels-dark.png
/tmp/v2-2-stock-levels-filtered.png
/tmp/v2-2-stock-levels-adjust-action.png
/tmp/v2-2-products-admin.png
/tmp/v2-2-products-warehouse-readonly.png
/tmp/v2-2-stock-movements.png
/tmp/v2-2-people-table.png
```

Do not publish screenshots.

# Controlled Demo Safety

Preserve:

- demo mode
- registration disabled
- noindex
- role profiles
- `demo:reset`
- `demo:check`
- controlled-guided-demo approval only
- website assets paused

Run `demo:check`.

Run `demo:reset` only if manual adjustment testing changes canonical data and the safety flags pass.

# Dependency and Security Gates

After installing TanStack Table:

```bash
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

All must pass.

Do not proceed with advisories.

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

npm ls @tanstack/react-table
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

Start the final production build on port 1320 after stopping any stale server.

# Final Report Required

Report:

1. V2-2 summary.
2. Node/npm versions.
3. Files inspected.
4. Files created.
5. Files modified.
6. TanStack Table exact version and compatibility audit.
7. Data Table V2 public API.
8. Client/server table mode design.
9. Query-state contract.
10. Search/filter/sort/pagination behavior.
11. Column visibility and selection behavior.
12. Row interaction/accessibility behavior.
13. Canonical view/edit route strategy.
14. Service/API pagination changes.
15. Inventory tables retrofitted.
16. Shared Records tables retrofitted.
17. Organization tables retrofitted.
18. Stock Levels Adjust action behavior.
19. Permission/role behavior.
20. Old DataTable compatibility/deprecation strategy.
21. Tests added and updated full count.
22. Accessibility test result.
23. `check:ux` changes.
24. Manual visual review and screenshot paths.
25. Light/Dark/System regression.
26. Controlled-demo result.
27. Port 1320 server status/PID.
28. Exact verification commands and results.
29. `check:all` result.
30. `demo:check` result.
31. Audit results.
32. Git diff/status observations.
33. Any deviations from frozen V2-2 scope.
34. Any unresolved performance, IA, permission, or accessibility risks.
35. Confirmation that no V2-3+ modals, Radix, charts, exports, ExcelJS, Prisma, migrations, Inventory V2 transactions, caching, accent presets, website assets, new modules, or Platform Services were added.
36. Whether V2-2 is complete.
37. Whether V2-3 remains blocked pending Founder approval.
38. Whether website asset production remains paused.

Stop after V2-2.

Do not proceed to V2-3 or any later V2 package without Founder approval.
