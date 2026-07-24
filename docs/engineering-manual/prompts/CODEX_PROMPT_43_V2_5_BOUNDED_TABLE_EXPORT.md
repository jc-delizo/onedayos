# OneDayOS — Inventory Demo V2 Package V2-5
# Bounded Server-Side CSV/XLSX Export V1

V2-4 Dashboard Charts and Process Flow Diagram V2 has passed:

- analytical consistency hardening
- canonical controlled-demo reset
- exact Stock Health invariants
- populated recent movement trend
- Product-versus-Product-position labeling
- Light / Dark / System review
- mobile review
- accessibility tests
- clean dependency audits
- `check:all`
- `demo:check`

The Founder accepts V2-4 and explicitly authorizes **V2-5 only**.

V2-6 through V2-8 remain blocked.

## V2-5 Goal

Add a bounded, reusable, server-side export capability for eligible OneDayOS operational tables.

Supported formats:

```text
CSV
XLSX
```

Supported scopes:

```text
Selected rows
All rows matching the current allowlisted filters and sorting
```

The export system must be:

- tenant-scoped
- permission-enforced
- server-generated
- column-allowlisted
- row-limited
- safe against spreadsheet formula injection
- compatible with current Data Table V2 URL/query state
- reusable without becoming a broad Import/Export Engine
- absent from client bundles except for the download UI
- honest about limits and errors

## Primary Authority

Read and follow first:

- `docs/engineering-manual/00-meta/adrs/ADR-0017-bounded-table-export.md`
- `docs/engineering-manual/14-testing-quality/10-data-table-modal-export-testing.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/00-meta/V2-2-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-3-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-4-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-2-data-table-v2.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-3-url-addressable-modals.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-4-dashboard-process-flow.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`

Also obey:

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/03-design-system/15-compact-operational-page-header.md`
- `docs/engineering-manual/03-design-system/16-data-table-v2.md`
- `docs/engineering-manual/03-design-system/17-modal-interaction-standard.md`
- `docs/engineering-manual/04-kernel/03-users-roles-permissions.md`
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
- `docs/engineering-manual/13-security/05-data-security.md`
- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`
- `docs/engineering-manual/14-testing-quality/05-security-testing.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/14/testing-quality/09-ux-conformance-testing.md` if present; otherwise use `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`

If these documents conflict, stop and report the conflict instead of inventing a resolution.

# Founder-Approved V2-5 Decisions

## Export boundary

V2-5 is a bounded table export capability.

It is not:

- an Import/Export Engine
- a reporting engine
- scheduled reporting
- background export jobs
- a public download service
- a generic Prisma-to-spreadsheet generator
- a client-side dump of hidden table data

## Formats

Approved:

- CSV
- XLSX

## XLSX dependency

Conditionally approved candidate:

```text
exceljs@4.4.0
```

Before installation, recheck:

- current official stable version
- Node 24 compatibility
- Next.js 16.2.11 server compatibility
- maintenance state
- license
- security advisories
- server bundle behavior

Use the exact approved stable version only if the audit is acceptable.

If ExcelJS presents an unacceptable current risk, stop for Founder review rather than silently choosing another XLSX package.

ExcelJS must remain server-only.

## Permissions

Export permission is separate from read permission.

A user must have:

1. read permission for the resource, and
2. the explicit export permission

Examples:

```text
inventory.stock_level.export
inventory.stock_movement.export
inventory.stock_adjustment.export

objects.product.export
objects.product_category.export
objects.customer.export
objects.supplier.export
objects.warehouse.export

objects.employee.export
kernel.organization.branch.export
kernel.organization.department.export
```

Use the actual existing permission storage model.

Do not create a second permission system.

Org Admin wildcard may satisfy the permissions.

Do not automatically grant export to the Warehouse Operator merely because the user has read access.

The controlled Warehouse Operator should not see Export unless the role is explicitly changed in a separate approved decision.

## Export scope

Approved:

- selected rows
- all filtered rows

Not required:

- current-page-only export
- all tenant data ignoring filters
- scheduled export
- background jobs

## Limits

Use the frozen spec’s limit if it defines one.

If no exact limit is frozen, use:

```text
Maximum filtered export rows: 10,000
Maximum selected IDs: 1,000
```

These are synchronous V1 limits.

Exceeding a limit must fail safely and never return a partial file.

# Absolute Scope

## Allowed

- audit and install one exact stable ExcelJS version
- build a small server-only OneDayOS export adapter
- implement CSV generation without another dependency
- implement XLSX generation through the approved adapter
- add strict export request schemas
- add server-side export routes
- reuse V2-2 search/filter/sort query contracts
- add export permissions
- integrate Export controls into eligible Data Table V2 toolbars
- support selected rows and all filtered rows
- support visible/allowlisted columns
- add row limits
- add formula-injection protection
- add safe filenames and response headers
- add tests, accessibility coverage, `check:ux` gates, documentation, and acceptance reporting
- make small V2-5 correctness/security fixes

## Forbidden

Do not:

- implement imports
- implement scheduled/background exports
- add queues
- add file storage
- add email delivery
- add reporting dashboards
- add custom report builders
- export hidden internal IDs by default
- export secrets, tokens, password-related fields, or authorization metadata
- implement V2-6 Inventory transactions
- change Prisma schema
- create migrations
- implement caching
- implement accent presets
- resume website asset production
- add another spreadsheet library
- add a PDF export
- change V2-3 modal architecture
- change V2-2 table semantics
- add new modules
- add Platform Services, Dynamic Systems, runtime AI, background jobs, or FastAPI
- run `npm audit fix`
- run `npm audit fix --force`

# Repository Safety

The worktree may contain prior uncommitted V2 changes.

Before coding:

1. Run `git status --short`.
2. Record current changed/untracked files.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Do not restore historical implementation.
5. Keep edits strictly within V2-5.
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

1. Frozen export ADR/spec.
2. Current Data Table V2 toolbar, selection, column visibility, URL query state, and page metadata.
3. Current list query schemas and service methods.
4. Current API envelope/error types.
5. Current permission constants/manifests/check helpers.
6. Current demo role permissions.
7. Current canonical view/edit routes and V2-3 modal behavior.
8. Current server-only/client-only dependency boundaries.
9. Current download/file-response helpers, if any.
10. Current Content Security Policy and response-header conventions.
11. Current list fields and sensitive fields per eligible table.
12. Current package/audit state.
13. Files you plan to create.
14. Files you plan to modify.
15. Any ambiguity about eligible tables, columns, or permission mapping.

If there is a real architecture ambiguity, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# Phase 1 — ExcelJS Dependency Audit and Install

## Audit

Verify the current stable ExcelJS release and whether `4.4.0` remains the approved safe choice.

Check:

- exact version
- license
- maintenance/release state
- Node 24 support
- Next.js 16 server compatibility
- transitive dependencies
- security advisories
- bundle behavior
- whether import syntax works in the current TypeScript/ESM setup
- whether the package can be excluded from client bundles

Use stable releases only.

Do not use a fork or another XLSX library without Founder approval.

## Install

If acceptable, install exact:

```text
exceljs@4.4.0
```

or the exact currently approved stable patch documented by the audit.

Do not add ExcelJS to client components.

After install:

```bash
npm ci
npm ls exceljs
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

All audits must remain clean.

If the dependency introduces a vulnerability, peer conflict, or unacceptable server-bundle issue, stop and report.

# Phase 2 — Narrow Export Architecture

Create a small reusable server-only capability.

Inspect repository architecture before choosing exact paths.

Preferred conceptual direction:

```text
src/platform/table-export/
  export-types.ts
  export-schema.ts
  export-columns.ts
  export-query.ts
  csv-exporter.ts
  xlsx-exporter.ts
  export-response.ts
  filename.ts
  spreadsheet-safety.ts
  index.ts
  __tests__/
```

If platform-layer placement conflicts with dependency rules, use the frozen ADR’s approved location.

Expose module/server callers only through an approved server-only surface, such as:

```text
@/sdk/server
```

or the exact server boundary already used by modules.

Do not expose ExcelJS or server export internals through `@/sdk/client` or shared browser-safe exports.

## Responsibilities

The export capability may own:

- export request parsing
- format selection
- scope selection
- column allowlisting
- spreadsheet-safe cell normalization
- CSV serialization
- XLSX workbook serialization
- safe filenames
- response headers
- row-limit enforcement
- generic serializable row/column contracts

It must not own:

- authentication
- PlatformContext resolution
- resource permissions
- tenant queries
- Prisma model discovery
- business filters
- arbitrary reflection
- background jobs
- file storage
- import behavior

# Phase 3 — Export Contracts

## Format

```ts
type ExportFormat = 'csv' | 'xlsx'
```

## Scope

```ts
type ExportScope = 'selected' | 'filtered'
```

## Request

Prefer a strict JSON POST body because selected IDs and columns may exceed safe URL lengths.

Conceptual contract:

```ts
type TableExportRequest = {
  format: ExportFormat
  scope: ExportScope
  selectedIds?: readonly string[]
  columns?: readonly string[]
  query?: {
    q?: string
    sort?: string
    direction?: 'asc' | 'desc'
    // page-specific allowlisted filters only
  }
}
```

Refine it per current query schema architecture.

Requirements:

- `z.strictObject()`
- reject `orgId`
- reject unknown keys
- reject unsupported columns
- reject unsupported filters
- reject invalid format
- reject invalid scope
- selected scope requires at least one ID
- filtered scope ignores pagination and exports all matching rows up to the limit
- selected IDs are deduplicated
- selected IDs are capped
- no quantity/tenant/permission data supplied by the client
- server derives organization and permissions from PlatformContext

## Success response

Binary success is an explicit export-route exception to the normal JSON data envelope.

Use:

### CSV

```text
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="..."
```

### XLSX

```text
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="..."
```

Errors remain JSON using the standard API error envelope.

Document this exception.

# Phase 4 — Row and Column Security

Every eligible table defines an explicit export configuration.

Example conceptual shape:

```ts
type ExportColumn<Row> = {
  id: string
  header: string
  getValue: (row: Row) => string | number | boolean | Date | null
  required?: boolean
}
```

Requirements:

- column IDs are allowlisted
- client may request only allowed columns
- required business-identifying columns may not be removed if the export would become misleading
- no Prisma/internal field reflection
- no hidden internal IDs by default
- no `orgId`
- no `deletedAt`
- no `deletedBy`
- no role/permission IDs
- no user auth IDs
- no password/secrets/tokens
- no fields absent from the user’s authorized resource view
- no relationship data that bypasses current permissions

The server, not the client, determines final columns.

## Visible columns

The UI may send current visible column IDs.

The server intersects them with the table’s export allowlist.

Do not trust localStorage visibility state blindly.

If no column list is supplied, use a safe table-specific default.

# Phase 5 — Spreadsheet Injection Safety

Protect string cells beginning with dangerous spreadsheet formula prefixes.

At minimum handle:

```text
=
+
-
@
tab
carriage return
```

Use a documented safe transformation, such as prefixing a single quote where needed.

Requirements:

- applied to CSV string values
- applied to XLSX string values
- numbers remain numeric
- booleans remain booleans
- dates remain typed dates in XLSX where appropriate
- no formulas are created
- no macros
- no external links
- no hidden worksheets
- no rich-text injection

Add dedicated tests.

# Phase 6 — CSV Exporter

Implement CSV without another dependency.

Requirements:

- UTF-8
- optional BOM for Excel compatibility, documented
- RFC 4180-style quoting/escaping
- CRLF or documented line endings
- spreadsheet-injection safety
- stable column order
- human-readable headers
- typed values serialized correctly
- no partial file on row-limit failure
- testable pure serializer

Do not build CSV in a client component.

# Phase 7 — XLSX Exporter

Use ExcelJS server-side only.

Requirements:

- one worksheet
- safe worksheet name, max 31 characters
- frozen header row if supported safely
- autofilter if useful and not misleading
- compact readable header style using neutral OneDayOS-inspired formatting
- no heavy decorative formatting
- correct number/date/boolean cell types
- safe string cells
- reasonable column widths with maximum caps
- no formulas
- no macros
- no external workbook links
- no images
- no hidden metadata containing secrets
- workbook creator/title may identify OneDayOS generically
- output as a server buffer

## Server bundle

Verify:

- ExcelJS is not imported by client modules
- it is absent from client bundles
- it loads only in server routes/adapter
- build remains successful

Use dynamic import if necessary and supported.

# Phase 8 — Filenames

Generate deterministic safe filenames.

Conceptual pattern:

```text
onedayos-{resource}-{yyyy-mm-dd}.{csv|xlsx}
```

Optionally include a sanitized organization slug only if the frozen spec permits it.

Requirements:

- lowercase
- ASCII-safe
- no path separators
- no control characters
- no untrusted arbitrary title
- correct extension
- worksheet name separately sanitized
- tests for long/invalid names

# Phase 9 — Export Limits and Query Execution

## Default hard limits

Use frozen values if specified.

Otherwise:

```text
Filtered export maximum: 10,000 rows
Selected ID maximum: 1,000
Batch read size: 500 or 1,000
```

## Required execution pattern

1. resolve verified PlatformContext
2. verify module availability where applicable
3. require resource read permission
4. require resource export permission
5. parse strict request
6. resolve allowlisted table query
7. compute exact matching count
8. reject if over limit
9. fetch in deterministic batches
10. reapply tenant/permission/soft-delete scope in every batch
11. map through export allowlist
12. serialize
13. return binary response

Do not:

- call the list API from the export route
- fetch one unbounded array without a count/limit
- export only the current page when scope is filtered
- silently truncate
- return a partial file
- use caching
- queue the job

## Limit error

Use a stable typed error, for example:

```text
EXPORT_ROW_LIMIT_EXCEEDED
```

Status:

```text
422
```

or the status defined by the frozen API contract.

Message should instruct the user to narrow filters or select specific rows.

Do not expose database details.

# Phase 10 — Selected-Row Safety

For selected scope:

- deduplicate IDs
- cap ID count
- query by IDs plus tenant scope
- apply soft-delete rules
- preserve deterministic order
- verify every returned record is authorized
- if requested IDs cannot all be resolved within the user’s authorized scope, return a generic safe selection error
- do not reveal which ID belongs to another tenant or does not exist
- no direct ID inference

Use a stable error such as:

```text
EXPORT_SELECTION_INVALID
```

# Phase 11 — Export Permissions

Add explicit export permissions through the existing permission system.

At minimum for eligible V2-5 tables:

## Inventory

```text
inventory.stock_level.export
inventory.stock_movement.export
inventory.stock_adjustment.export
```

## Shared Records

```text
objects.product.export
objects.product_category.export
objects.customer.export
objects.supplier.export
objects.warehouse.export
```

## Organization / People

```text
objects.employee.export
kernel.organization.branch.export
kernel.organization.department.export
```

Use the actual current permission/resource vocabulary.

Do not invent a second string-only model if current permissions use module/action/resource fields.

## Eligibility decision

Create an explicit table matrix.

Preferred V2-5 eligible tables:

- Stock Levels
- Stock Movements
- Stock Adjustments
- Products
- Product Categories
- Customers
- Suppliers
- Warehouses
- People/Employees
- Branches
- Departments

Not eligible in V2-5 unless the frozen spec explicitly includes them:

- Platform Users/auth identities
- Inventory Tracking Settings
- Dashboard summary tables
- Process Flow
- app launcher
- audit/security metadata

Explain every exclusion.

## Demo roles

- Org Admin wildcard remains export-capable.
- Warehouse Operator remains unchanged and must not automatically receive export permission.
- Warehouse Operator should not see Export controls.
- Do not broaden the demo role silently.

# Phase 12 — Export API Routes

Create tenant-scoped export routes consistent with current route conventions.

Expected conceptual routes:

## Inventory

```text
POST /api/orgs/[orgSlug]/inventory/stock-levels/export
POST /api/orgs/[orgSlug]/inventory/stock-movements/export
POST /api/orgs/[orgSlug]/inventory/stock-adjustments/export
```

## Shared Records

```text
POST /api/orgs/[orgSlug]/objects/products/export
POST /api/orgs/[orgSlug]/objects/product-categories/export
POST /api/orgs/[orgSlug]/objects/customers/export
POST /api/orgs/[orgSlug]/objects/suppliers/export
POST /api/orgs/[orgSlug]/objects/warehouses/export
POST /api/orgs/[orgSlug]/objects/employees/export
```

## Organization

Use the existing organization API namespace for Branches and Departments.

Do not invent a conflicting route convention.

Requirements:

- verified API PlatformContext
- strict route/body parsing
- no redirects
- binary success
- JSON errors
- no HTML auth response
- module disabled behavior where applicable
- read + export permissions
- tenant scope
- no raw provider errors
- request ID preserved where current wrapper supports it

# Phase 13 — Reuse V2-2 Query Contracts

Each export route must reuse the existing list query schema/service filter logic.

Do not maintain a second independent search/filter implementation.

Requirements:

- same searchable fields
- same allowlisted filters
- same sort allowlist
- same soft-delete behavior
- same tenant scope
- same role constraints
- pagination removed only for the bounded export batch loop
- status filter remains absent until V2-6
- no `orgId`

For selected scope, filters may still be applied if the frozen spec says selected means “selected within current filtered table.” At minimum, selected IDs must be authorized.

Document the final behavior.

# Phase 14 — Data Table V2 Export UI

Add an optional export capability to the shared Data Table V2 toolbar.

The table caller supplies:

- whether the user may export
- export endpoint
- allowed format options
- table/resource label
- selected row IDs
- current query/filter/sort state
- current visible column IDs
- total filtered row count

The shared table must not determine permissions.

## Export control

Use an accessible dropdown/menu with:

```text
Export CSV
Export Excel
```

When rows are selected, provide clear scope choices, for example:

```text
Selected rows (N)
All filtered rows (N)
```

A compact two-stage menu is acceptable.

Do not show unavailable options.

## Visibility

- hidden when user lacks export permission
- disabled when there are no eligible rows
- selected scope shown only when rows are selected
- all-filtered scope shows the exact filtered count from server metadata
- no Export button on ineligible tables

## Download behavior

- send a POST request
- show `Preparing export…`
- prevent duplicate request
- parse JSON error if response is not OK
- download Blob on success
- honor sanitized server filename
- revoke object URL
- preserve table state and selection
- use `aria-live` for success/failure
- no page navigation required
- no toast dependency

If the binary response is large, remain within the synchronous V1 limit.

## Error behavior

Display user-safe messages for:

- permission denied
- row limit exceeded
- invalid selection
- no matching rows
- server error

Do not show technical stack/provider messages.

# Phase 15 — Table-Specific Export Columns

Define explicit safe columns.

Use current domain field names only.

## Stock Levels

Suggested:

- Product Code
- Product Name
- Warehouse
- Quantity
- Unit
- Reorder Point
- Status

Exclude:

- internal balance ID
- Product ID
- Warehouse ID
- orgId

## Stock Movements

Suggested:

- Date/Time
- Product Code
- Product Name
- Warehouse
- Movement Type
- Quantity Change
- Balance After
- Reason/Reference where available

Exclude internal IDs.

## Stock Adjustments

Suggested:

- Date/Time
- Product Code
- Product Name
- Warehouse
- Quantity Change
- Quantity Before
- Quantity After
- Reason
- Created By display name if currently permitted and safely available

Do not expose auth IDs.

## Products

Suggested:

- Code
- Name
- Description
- Category
- Unit
- Active/Status
- Updated At

Do not include Inventory-specific settings in the Product core export unless an explicitly separate Inventory export column is authorized and permission-checked.

## Product Categories

- Name
- Parent Category where available
- Status

## Customers

- Name
- Email
- Phone
- Address
- Status

Do not export hidden CRM fields that do not exist.

## Suppliers

- Name
- Email
- Phone
- Address
- Status

## Warehouses

- Name
- Branch
- Address
- Status

## People/Employees

- Employee Number
- Name
- Email
- Phone
- Branch
- Department
- Position
- Employment Type
- Hired At
- Active/Status

Do not export User/Auth IDs.

## Branches

- Name
- Address
- Phone
- Status

## Departments

- Name
- Branch
- Parent Department
- Status

Refine columns according to actual current models.

Do not invent missing fields.

# Phase 16 — Tests

Add meaningful tests.

## CSV serializer

- comma
- quote
- newline
- CRLF
- UTF-8
- BOM decision
- null
- number
- boolean
- date
- stable column order
- formula injection:
  - `=`
  - `+`
  - `-`
  - `@`
  - tab
  - carriage return
- no partial file

## XLSX serializer

- workbook opens/loads in ExcelJS test readback
- worksheet name safe
- header row
- stable column order
- numeric types
- date types
- boolean types
- string formula protection
- no formulas/macros/external links
- row count
- column width caps
- no secret metadata

## Schema tests

- valid csv/xlsx
- invalid format
- valid selected/filtered
- selected missing IDs
- selected max exceeded
- filtered row limit exceeded
- unknown columns
- unknown filters
- invalid sort
- invalid direction
- unknown keys
- `orgId` rejected
- duplicate IDs normalized

## Permission tests

- read only is insufficient
- export only without read is insufficient
- Org Admin wildcard allowed
- Warehouse Operator export control absent
- direct export route returns JSON 403
- module disabled safe failure
- no cross-tenant export

## Query correctness

- filters match V2-2 table
- sorting matches
- selected rows only
- all filtered rows across multiple pages
- exact filtered count
- soft-deleted rows excluded
- deterministic batching
- row limit rejects before serialization
- no silent truncation

## Security tests

- selected ID from another tenant does not leak
- generic invalid-selection error
- internal columns cannot be requested
- filename sanitization
- header injection prevented
- ExcelJS absent from client source/bundle contract
- no server secret in files
- no client orgId

## UI tests

- Export hidden without permission
- CSV and Excel options
- selected/all-filtered scope
- exact counts
- loading state
- duplicate-click prevention
- Blob download
- filename honored
- JSON error handling
- row-limit message
- table URL state preserved
- selection preserved

## Accessibility tests

Use existing axe helper.

Cover:

- Export trigger
- format/scope menu
- selected-state copy
- loading state
- error announcement
- disabled state

Do not claim formal WCAG conformance.

## Regression tests

- V2-2 table behavior remains
- V2-3 modals remain
- V2-4 charts remain
- no import
- no export of hidden IDs
- no Inventory V2 transactions
- no caching
- no accents
- website assets remain paused

# Phase 17 — `check:ux` and Architecture Gates

Add stable checks:

- ExcelJS imported only in server-only export adapter/routes/tests
- no ExcelJS import in client components
- no client-side spreadsheet generation
- export permissions are separate from read
- all eligible table configs have explicit columns
- no internal IDs in default export columns
- formula-injection sanitizer exists and is tested
- export row limit exists
- binary success/JSON error convention documented
- Warehouse Operator is not granted export
- no Import/Export Engine
- no background job/queue
- no V2-6 schema/migration
- no caching/accent/website asset work

Update architecture checks only for stable server/client and dependency-boundary rules.

# Phase 18 — Documentation

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-5-bounded-table-export.md
```

Include:

- ExcelJS exact version and audit
- export architecture
- server-only boundary
- binary success/JSON error contract
- permissions
- eligible-table matrix
- excluded tables
- request schema
- selected/filtered behavior
- column allowlists
- row limits
- CSV/XLSX behavior
- spreadsheet-injection mitigation
- filenames
- Data Table V2 integration
- tests
- manual review
- performance limits
- explicit non-goals
- V2-6 remains blocked
- website assets remain paused

Create:

```text
docs/engineering-manual/00-meta/
  V2-5-ACCEPTANCE-REPORT.md
```

Status before Founder review:

```text
Code and Automated Gates Complete
Founder Acceptance Pending
```

Required sections:

- dependency
- export architecture
- permissions
- eligible tables
- CSV verification
- XLSX verification
- filtering/sorting/selection verification
- row limits
- security review
- accessibility
- manual visual/download review
- findings
- blockers/must-fix/polish
- V2-6 readiness

Update truthfully:

```text
src/modules/inventory/UX-CONFORMANCE.md
src/business-objects/UX-CONFORMANCE.md
src/platform/organization/UX-CONFORMANCE.md
```

Do not claim public-demo approval.

# Phase 19 — Manual Controlled Review

Use Node 24 and `next start` on port 1320.

Do not install browser automation.

Review Org Admin:

- Stock Levels export CSV
- Stock Levels export Excel
- selected Stock Level export
- filtered Stock Level export
- Stock Movements export
- Stock Adjustments export
- Products export
- Customers export
- Suppliers export
- Warehouses export
- People export
- Branch/Department export if eligible

Verify:

- files download
- filenames are safe
- filters/sort reflected
- selected scope exact
- visible/default columns correct
- internal IDs absent
- values readable
- formula-like demo value is sanitized through a test fixture, not live unsafe data
- modal/table state preserved
- Light/Dark/System menu readable

Review Warehouse Operator:

- Export absent on tables without export permission
- direct export API returns JSON 403
- normal read/view/adjust behavior remains

Open at least one generated CSV and XLSX file and verify content.

Save private screenshots:

```text
/tmp/v2-5-export-menu-stock-levels.png
/tmp/v2-5-export-selected.png
/tmp/v2-5-export-filtered.png
/tmp/v2-5-export-preparing.png
/tmp/v2-5-export-error-limit.png
/tmp/v2-5-export-hidden-warehouse-user.png
```

Save generated review files only under `/tmp`.

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

Export is read-only and must not mutate canonical data.

Run `demo:check`.

Do not run `demo:reset` unless unrelated manual actions changed data.

# Dependency Gates

After installing ExcelJS:

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

npm ls exceljs
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

1. V2-5 summary.
2. Node/npm versions.
3. Files inspected.
4. Files created.
5. Files modified.
6. ExcelJS exact version and compatibility/security audit.
7. Export adapter/server-only architecture.
8. CSV implementation.
9. XLSX implementation.
10. Formula-injection protection.
11. Request schema.
12. Binary success/JSON error contract.
13. Permission model and exact export permissions.
14. Eligible-table matrix.
15. Excluded tables and reasons.
16. Column-allowlist strategy.
17. Selected versus filtered behavior.
18. Row limits and failure behavior.
19. Data Table V2 UI integration.
20. Service/query reuse.
21. Tests added and updated full count.
22. Accessibility result.
23. `check:ux` and architecture changes.
24. Manual download review and screenshot/file paths.
25. Warehouse Operator denial/visibility behavior.
26. Light/Dark/System result.
27. Controlled-demo result.
28. Port 1320 server status/PID.
29. Exact verification commands and results.
30. `check:all` result.
31. `demo:check` result.
32. Dependency audit result.
33. Git diff/status observations.
34. Any deviations from frozen V2-5 scope.
35. Remaining export, memory, security, or accessibility risks.
36. Confirmation that no V2-6 Inventory transactions, Prisma schema, migrations, imports, background jobs, caching, accent presets, website assets, new modules, or Platform Services were added.
37. Whether V2-5 is complete.
38. Whether V2-6 remains blocked pending explicit Founder approval.
39. Whether website asset production remains paused.

Stop after V2-5.

Do not proceed to V2-6 or any later V2 package without Founder approval.
