# OneDayOS — V2-2 Acceptance and Scale-Correctness Hardening

Inventory Demo V2 Package V2-2 is code-complete.

The Founder accepts the overall V2-2 direction:

- TanStack Table v8
- search
- allowlisted filters
- sorting
- pagination
- column visibility
- row selection
- permission-aware row interactions
- Stock Levels Adjust Stock action
- full-page canonical routes
- OneDayOS Compact styling

However, V2-3 remains blocked until two V2-2 residual risks are resolved or made explicitly safe:

1. Stock Status filtering currently reports a 100-candidate cap.
2. Some Shared Records and Organization tables remain in client mode based on an assumed bounded data set.

This package is a focused V2-2 acceptance and correctness hardening pass.

Do not implement V2-3.

Do not install Radix Dialog.

Do not implement modals or intercepting routes.

Do not implement charts, exports, Inventory V2 transactions, caching, accent presets, or website assets.

## Primary Goal

Ensure Data Table V2 never silently returns incomplete, inaccurate, or unbounded results.

The final V2-2 contract must satisfy:

- pagination totals are truthful
- filter totals are truthful
- no hidden 100-row correctness cap
- large record sets use server-controlled queries
- client mode is limited to explicitly bounded small reference sets
- no table silently downloads an unbounded tenant data set
- no query weakens tenant or permission enforcement
- existing UI and role behavior remain unchanged

## Primary Authority

Read and follow:

- `docs/engineering-manual/03-design-system/16-data-table-v2.md`
- `docs/engineering-manual/14-testing-quality/10-data-table-modal-export-testing.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0016-data-table-v2-and-modal-interactions.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-2-data-table-v2.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`

Also obey:

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/04-kernel/04-authorization-enforcement.md`
- `docs/engineering-manual/04-kernel/08-kernel-api-contracts.md`
- `docs/engineering-manual/05-sdk/02-sdk-db-access.md`
- `docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md`
- `docs/engineering-manual/06-data/01-tenancy-data-isolation.md`
- `docs/engineering-manual/06-data/05-data-validation-zod.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/04-api-security.md`

If documents conflict, stop and report the conflict.

## Absolute Scope

### Allowed

- audit and correct table query behavior
- remove silent/inaccurate caps
- move appropriate tables from client mode to server mode
- add exact pagination/filter tests with more than 100 records
- add explicit bounded-client-mode rules
- improve query/service/API metadata
- remove or temporarily disable a filter that cannot be made correct without violating frozen architecture
- add V2-2 acceptance documentation
- update `check:ux`
- update conformance documents
- make narrowly scoped performance/correctness fixes

### Forbidden

Do not:

- change Prisma schema
- create migrations
- add denormalized stock-status fields
- add database triggers/views without separate approval
- add raw SQL casually
- violate SDK/module boundaries
- implement V2-3 modals
- install Radix Dialog
- install Recharts
- implement charts
- implement CSV/XLSX export
- install ExcelJS
- implement Receipts, Issues, Transfers, or unified Inventory transactions
- implement caching
- implement accent presets
- resume website asset production
- add new modules
- run `npm audit fix` or `npm audit fix --force`

## Supported Runtime

Use Node 24.

Run:

```bash
node --version
npm --version
```

Do not perform acceptance under Node 22.

## Repository Safety

Before work:

1. Run `git status --short`.
2. Record existing changes.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Do not create a commit unless separately instructed.
5. Stop any stale server before final build/start.
6. Keep port `1320`.

# Part A — Audit Every Production Table Mode

Create an explicit inventory of all active Data Table V2 callers.

For each table report:

- table ID
- route
- domain
- current mode: client/server
- API/service source
- maximum rows loaded
- total-count source
- search location: client/server
- filter location: client/server
- sorting location: client/server
- pagination location: client/server
- expected realistic data growth
- approved final mode

At minimum inspect:

## Inventory

- Stock Levels
- Stock Movements
- Stock Adjustments
- Inventory Tracking Settings

## Shared Records

- Products
- Product Categories
- Customers
- Suppliers
- Warehouses

## Organization

- Platform Users
- Employees/People
- Branches
- Departments

## Required mode decision

Use server mode for data sets that may reasonably grow beyond a small fixed reference set.

Default recommendation:

```text
Server mode:
- Stock Levels
- Stock Movements
- Stock Adjustments
- Products
- Customers
- Suppliers
- Warehouses
- People/Employees
- Platform Users

Client mode may remain only if explicitly justified:
- Product Categories
- Branches
- Departments
- very small static/reference sets
```

Even client-mode endpoints must use an explicit safe maximum and must not silently truncate.

If a supposedly bounded set can realistically grow, use server mode.

# Part B — Eliminate Silent Truncation

Search for:

- `take: 100`
- `slice(0, 100)`
- candidate caps
- hardcoded list maxima
- client-side filtering after a capped server fetch
- totals derived from partial arrays
- `total = rows.length` when rows are paginated
- unbounded `findMany`
- API responses missing truthful pagination metadata

No active production table may:

- display a partial result as complete
- report inaccurate `total`
- report inaccurate `totalPages`
- hide matching records beyond an internal candidate cap
- silently ignore filters after a threshold

If a safety maximum exists, the API/UI must not present it as complete data.

Preferred resolution is server-side exact querying and counting.

# Part C — Stock Status Filter Correctness

The Stock Levels status filter must be audited carefully.

Statuses:

- In Stock
- Low Stock
- Out of Stock

The current report mentions a 100-candidate cap.

This is not acceptable if it can produce incomplete results or inaccurate totals.

## Required decision order

### Option 1 — Exact tenant-scoped database query

Use this only if it can be implemented safely within current architecture.

Requirements:

- parameterized
- tenant-scoped
- permission-enforced
- no string-built SQL
- no cross-tenant exposure
- exact filtered total
- exact pagination
- covered by tests
- module/SDK boundaries preserved

Do not add raw SQL directly merely for convenience.

If a safe query repository/helper is needed but would create a new architecture layer, stop for Founder review.

### Option 2 — Exact bounded in-memory computation

This is acceptable only if:

- the complete tenant-scoped candidate set is fetched
- a documented hard maximum protects memory
- if the complete set exceeds the safe maximum, the request fails honestly with a clear error rather than returning partial results
- totals remain exact
- the UX explains the temporary limit
- the implementation is explicitly documented as temporary until V2-6

Do not silently cap at 100.

### Option 3 — Temporarily remove the status filter

If exact status filtering cannot be implemented safely without schema or architecture changes:

- remove/disable the status filter
- keep textual status display
- explain that exact status filtering is deferred to V2-6
- preserve search, warehouse filtering, sorting, and pagination
- do not return incorrect results

Correctness is more important than pretending the filter exists.

## Required tests

Use fixtures/data exceeding 100 candidate rows.

Test:

- low-stock match after row 100 is returned
- out-of-stock match after row 100 is returned
- totals are exact
- totalPages are exact
- page 2/3 results are correct
- warehouse + status combined filter is correct
- tenant isolation remains intact
- invalid status is rejected
- no `orgId` query is accepted

# Part D — Server-Mode Shared Records

Move realistic growth tables to server mode if they are not already.

At minimum audit and likely migrate:

- Products
- Customers
- Suppliers
- Warehouses
- People/Employees
- Platform Users

Requirements:

- tenant-scoped service query
- exact count query
- allowlisted search
- allowlisted filters
- allowlisted sorting
- pagination
- API `meta`
- URL state
- permissions
- soft-delete exclusion
- contextual Inventory presenters reuse the same query contract
- direct Shared Records and Inventory-context routes do not duplicate service logic

Do not load all Products/Customers/Suppliers merely to filter in the browser.

# Part E — Explicit Client-Mode Policy

For any table remaining in client mode:

- document why it is bounded
- define an explicit maximum
- enforce that maximum
- do not silently truncate
- expose a safe error or switch to server mode if the maximum is exceeded
- preserve search/sort/filter accuracy within the complete loaded set
- do not store tenant data in localStorage

Create a typed or documented policy rather than informal assumptions.

# Part F — Performance and Query Safety

Audit:

- count query cost
- N+1 relations
- query indexes already present
- soft-delete filters
- default sort stability
- page size cap
- search-field indexes where current schema supports them
- query explosion from related names
- repeated per-row permission checks
- repeated database calls

Do not add indexes or schema migrations in this package.

Document index recommendations for V2-6 if needed.

Do not implement caching.

# Part G — API and UI Honesty

If the server rejects a query because an exact bounded computation would exceed a safe limit:

- return a stable typed error
- show a clear safe UI message
- do not show partial rows
- suggest narrowing the search/filter
- do not expose technical details

The UI must distinguish:

- no records exist
- no records match filters
- query too broad for a temporary bounded computation
- permission denied
- server error

# Part H — V2-2 Acceptance Report

Create:

```text
docs/engineering-manual/00-meta/
  V2-2-ACCEPTANCE-REPORT.md
```

Required sections:

```text
# V2-2 Acceptance Report

## Status

## Data Table V2 Platform

## Production Table Mode Inventory

## Server-Mode Tables

## Approved Client-Mode Tables

## Stock Status Filter Correctness

## Pagination and Total Accuracy

## Tenant and Permission Safety

## Accessibility

## Manual Visual Review

## Dependency Audits

## Findings

## Fixed Issues

## Deferred Issues

## Performance Limits

## Founder Approval Required

## V2-3 Readiness
```

Recommended pre-Founder status:

```text
Code and Correctness Gates Complete
Founder Acceptance Pending
```

Create or update:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-2-data-table-v2.md
```

Add:

- final table-mode inventory
- exact stock-status decision
- removed caps
- server-mode migrations
- explicit client-mode limits
- tests above 100 rows
- performance recommendations
- V2-3 remains blocked

Update truthfully:

```text
src/modules/inventory/UX-CONFORMANCE.md
src/business-objects/UX-CONFORMANCE.md
src/platform/organization/UX-CONFORMANCE.md
```

# Part I — Tests

Add meaningful regression coverage.

## Scale fixtures

Create test data with:

- at least 150 Products
- at least 150 Stock Levels
- at least 120 Customers or another Shared Records set where practical
- multiple Warehouses
- low/out-of-stock rows beyond index 100
- two organizations

Use mocks/factories unless a test DB is already safely available.

Do not mutate the live sandbox merely to create scale fixtures.

## Required test categories

- exact totals above 100
- exact totalPages above 100
- search finds rows beyond 100
- filters find rows beyond 100
- sort/pagination stable across pages
- no duplicate/missing rows across page boundaries
- tenant A cannot affect tenant B totals
- server mode does not load full data into the client component
- client-mode limit fails honestly
- API error envelope for over-broad temporary computation
- no hidden `orgId`
- URL state remains stable
- row actions remain permission-aware
- Stock Levels Adjust action remains correct

## Accessibility

Preserve all current Data Table accessibility tests.

Add any error-state accessibility coverage introduced by this package.

# Part J — `check:ux`

Add stable checks:

- no active stock-status candidate cap
- no partial-array totals
- growth tables use server mode
- remaining client-mode tables have explicit bound policy
- no unbounded active list endpoint
- V2-2 acceptance report exists
- V2-3 dependencies remain absent
- export remains absent
- website assets remain paused

Do not use brittle exact class checks.

# Part K — Manual Visual Review

Use the controlled sandbox after starting the latest build on port 1320.

Inspect:

- Stock Levels search/filter/pagination
- Products search/filter/pagination
- Customers
- Suppliers
- Warehouses
- People
- read-only Warehouse persona behavior
- Light/Dark/System

If a filter is temporarily removed for correctness, verify the UI does not look broken and the limitation is clear.

Save screenshots under `/tmp` if tooling exists.

Do not publish them.

# Controlled Demo Safety

Preserve:

- demo mode
- registration disabled
- noindex
- role profiles
- `demo:check`
- controlled guided demo only
- website asset pause

Run `demo:check`.

Do not run `demo:reset` unless manual testing changed data and all safety flags pass.

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

Stop any stale server and start the latest production build on port 1320.

# Final Report Required

Report:

1. V2-2 acceptance/hardening summary.
2. Node/npm versions.
3. Files inspected.
4. Files created.
5. Files modified.
6. Complete active table-mode inventory.
7. Tables moved to server mode.
8. Tables retained in client mode and explicit limits.
9. Stock Status filter final implementation/decision.
10. Confirmation that no silent 100-candidate cap remains.
11. Pagination/total correctness above 100 rows.
12. Service/API changes.
13. Tenant/permission safety result.
14. Performance/query findings.
15. Tests added and updated total count.
16. Accessibility result.
17. `check:ux` changes.
18. Manual visual review and screenshot paths.
19. Light/Dark/System result.
20. Controlled-demo result.
21. Port 1320 server status/PID.
22. Exact verification commands and results.
23. `check:all` result.
24. `demo:check` result.
25. Dependency audit result.
26. Git diff/status observations.
27. Any deviations from V2-2 scope.
28. Remaining performance or correctness risks.
29. Confirmation that no V2-3+ modals, Radix, charts, exports, ExcelJS, Prisma, migrations, Inventory V2 transactions, caching, accent presets, website assets, new modules, or Platform Services were added.
30. Whether V2-2 is ready for Founder acceptance.
31. Whether V2-3 remains blocked pending explicit Founder approval.
32. Whether website asset production remains paused.

Stop after this acceptance/hardening pass.

Do not proceed to V2-3 or any later V2 package without Founder approval.
