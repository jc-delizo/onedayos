# OneDayOS Engineering Manual — Dynamic Table View Engine

**Document ID:** `11-dynamic-systems/03-dynamic-table-view-engine.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Deferred — Contract Only  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `09-cli-generators/06-generator-safety-rails.md`
- `11-dynamic-systems/00-dynamic-systems-philosophy.md`
- `11-dynamic-systems/04-field-metadata-schema.md`

---

# 1. Purpose

The Dynamic Table View Engine is the future OneDayOS capability that allows list screens to become configurable, reusable, and consistent without each module reinventing table behavior.

It should eventually power things like:

```txt
Saved views
Column visibility
Column ordering
Filtering
Sorting
Search integration
Density settings
Pagination
Export configuration
User-specific table preferences
Organization-default views
Module-provided default views
```

However, this engine must **not** be implemented during the restarted foundation build.

The correct foundation-stage work is:

```txt
Build excellent hand-coded tables first.
Use shared DataTable components.
Use Field Metadata as a future contract.
Observe repeated patterns across real modules.
Only then extract a Dynamic Table View Engine.
```

The purpose of this document is to define the future contract so Claude and future engineers do not invent incompatible table systems later.

---

# 2. Implementation Status

## 2.1 Current status

```txt
Deferred — Contract Only
```

Claude must not implement the runtime Dynamic Table View Engine from this document alone.

Claude may implement ordinary shared table components if instructed by the Design System or module documents, but it must not add:

```txt
saved_views table
view builder UI
dynamic table runtime
sdk.tables runtime APIs
user table preference persistence
organization table defaults
filter-expression runtime engine
column metadata database storage
```

unless a future implementation document explicitly approves those items.

## 2.2 Why deferred

Dynamic table views are valuable, but implementing them too early creates risk.

If we build the engine before real modules exist, we may build the wrong abstraction.

Early risks include:

```txt
generic admin-dashboard feel
overcomplicated metadata
weak permissions
cross-tenant data leaks
inconsistent filters
slow queries
export security bugs
saved views that expose sensitive fields
AI/Claude confusion between tables and reports
```

The first priority is still:

```txt
Kernel
SDK
Tenancy
Permissions
Business Objects
Module System
Design System
Generators
First real modules
```

Dynamic table views come later.

---

# 3. Core Principle

```txt
Tables are product surfaces, not database dumps.
```

A OneDayOS table must show the right business information for the right user in the right tenant context.

It must not automatically expose database fields just because those fields exist.

The future Dynamic Table View Engine should make tables easier to build and configure, but it must never bypass:

```txt
authentication
tenant membership
module enablement
permissions
server-side validation
soft delete
Business Object ownership boundaries
API contracts
```

---

# 4. What This Engine Is

The future Dynamic Table View Engine is a reusable platform capability for configurable list views.

It should eventually answer questions like:

```txt
Which columns are visible?
Which filters are available?
Which filters are currently applied?
Which sort is active?
Which saved view is selected?
Is this a user view or organization default view?
Which fields are exportable?
Which rows can the current user see?
Which actions are available per row?
```

It should standardize the behavior of list pages across Business Objects and modules.

Examples:

```txt
Employees table
Products table
Customers table
Suppliers table
Warehouses table
Inventory stock levels table
Purchase requests table
Leave requests table
Expense claims table
Assets table
Visitor logs table
Incident reports table
```

---

# 5. What This Engine Is Not

## 5.1 Not the DataTable component

A `DataTable` component is a UI component.

The Dynamic Table View Engine is a future state/configuration/query orchestration layer.

```txt
DataTable = renders rows and columns
Dynamic Table View Engine = decides view metadata, filters, sorts, columns, preferences, and saved views
```

Do not confuse the two.

During the foundation build, OneDayOS may have excellent shared table components without having a Dynamic Table View Engine.

## 5.2 Not Search Service

Search finds records across fields or entities.

Dynamic Table Views configure how a specific list is displayed.

```txt
Search = find matching records
Table View = display and arrange records
```

The engine may eventually integrate with Search, but it is not Search.

## 5.3 Not Reporting Service

Reports aggregate, summarize, calculate, and export business insights.

Dynamic Table Views display operational records.

Examples:

```txt
Table View:
  Show open purchase requests assigned to me.

Report:
  Show monthly purchasing spend by supplier.
```

Do not use the Dynamic Table View Engine as a reporting system.

## 5.4 Not Dynamic CRUD

Dynamic CRUD defines generic create/read/update/delete behavior for entities.

Dynamic Table Views are only about list/view configuration.

```txt
Dynamic CRUD = entity operations
Dynamic Table View = list presentation and filtering
```

## 5.5 Not a no-code builder

The engine is not a drag-and-drop app builder.

It should support controlled platform configuration, not arbitrary client customization.

## 5.6 Not a permission system

The engine may hide columns or actions based on permissions, but it is not the source of permission truth.

Permission enforcement remains in:

```txt
Kernel authorization helpers
SDK permission helpers
API routes
services
```

## 5.7 Not a raw SQL builder

The engine must not allow users, admins, clients, Claude, or AI to write raw SQL.

All query behavior must be generated from approved metadata and server-owned query builders.

---

# 6. Why This Exists Long Term

OneDayOS must eventually build many internal applications quickly.

Most business apps contain many list screens:

```txt
list products
list customers
list employees
list stock movements
list leave requests
list purchase requests
list visitors
list incidents
list assets
list expenses
```

If every table is hand-designed forever, development becomes repetitive.

But if every table is made dynamic too early, the platform becomes fragile.

The right path is:

```txt
1. Build repeated table screens manually.
2. Standardize visual table components through Design System.
3. Standardize fields through Field Metadata.
4. Standardize query patterns through SDK/Data rules.
5. Standardize generated table scaffolds through CLI generators.
6. Only then create a runtime Dynamic Table View Engine.
```

The engine should be extracted from OneDayOS patterns, not invented in isolation.

---

# 7. Implementation Gate

The Dynamic Table View Engine may only move from `Deferred` to `Implementation Candidate` when all of the following are true:

```txt
[ ] At least three independent table-heavy workflows exist.
[ ] Those workflows have repeated column/filter/sort/view pain.
[ ] The current shared DataTable component is insufficient.
[ ] Field Metadata has been tested in real module documentation or generators.
[ ] Table Standards from the Design System are frozen.
[ ] Security model for saved views is documented.
[ ] Query model is tenant-safe.
[ ] Export behavior is permission-safe.
[ ] Founder/architect approves promotion.
[ ] ADR is written.
[ ] Implementation document is written.
```

Examples of valid evidence:

```txt
Use case 1: Inventory needs saved stock-level views.
Use case 2: CRM needs saved lead/customer views.
Use case 3: Purchasing needs saved purchase-request views.
```

At that point, a Dynamic Table View Engine proposal may be written.

The existence of three use cases triggers **review**, not automatic implementation.

---

# 8. Relationship to Field Metadata

The Dynamic Table View Engine should eventually consume Field Metadata, but Field Metadata does not automatically create dynamic tables.

Field Metadata may say:

```ts
type FieldMetadata = {
  key: string
  label: string
  type: FieldType
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  exportable?: boolean
  sensitive?: boolean
}
```

The Dynamic Table View Engine may later use this to decide:

```txt
which columns can appear
which fields can be filtered
which fields can be sorted
which fields can be exported
which fields are hidden from AI/search/export
```

But metadata remains declarative.

It must not execute arbitrary code.

It must not generate database schema.

It must not bypass server-side validation.

---

# 9. Future Conceptual Model

A future implementation may introduce a model similar to this.

This is conceptual only.

```ts
type TableViewDefinition = {
  id: string
  key: string
  label: string
  scope: 'system' | 'organization' | 'user'
  ownerUserId?: string
  orgId: string
  target: TableTarget
  columns: TableColumnConfig[]
  filters: TableFilterConfig[]
  sort: TableSortConfig[]
  density?: 'compact' | 'comfortable' | 'spacious'
  pageSize?: number
  isDefault?: boolean
}
```

A target might be:

```ts
type TableTarget = {
  namespace: 'objects' | 'module'
  module?: string
  resource: string
}
```

Examples:

```txt
objects.product
objects.customer
objects.employee
inventory.stock_level
purchasing.purchase_request
leave.leave_request
```

This target must not be a raw database table name exposed to the client.

It must be a safe platform resource identifier.

---

# 10. Future View Scopes

A future engine may support three scopes.

## 10.1 System views

System views are shipped by OneDayOS code.

Examples:

```txt
All Products
Active Employees
Low Stock Items
Open Purchase Requests
Pending Leave Requests
```

System views should be defined in code or manifest metadata, not edited directly by clients in MVP.

## 10.2 Organization views

Organization views are shared across users in one tenant organization.

Examples:

```txt
Client A default Product table
Client B default Customer table
Client C preferred Incident list
```

Organization views require admin-level configuration permission.

## 10.3 User views

User views are personal saved views.

Examples:

```txt
My Open Tasks
My Pending Leave Requests
Products I Check Weekly
High Priority Incidents
```

User views must remain tenant-scoped and user-owned.

---

# 11. Future Table View Ownership Rules

A future saved view must always be owned by exactly one tenant organization.

Required ownership context:

```txt
orgId
scope
createdBy
updatedBy
```

Optional ownership context:

```txt
ownerUserId for user views
moduleId for module-specific views
resource for target entity
```

Forbidden:

```txt
global client-editable saved views
views without orgId
views that apply across tenants
views that use client-supplied orgId
views that reference raw Prisma model names from the browser
```

---

# 12. Tenant Isolation Requirements

The future engine must use verified `PlatformContext`.

Correct:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const data = await sdk.tables.getRows(ctx, viewKey, query)
```

Forbidden:

```ts
const orgId = body.orgId
const data = await sdk.tables.getRows(orgId, viewKey, query)
```

Also forbidden:

```ts
/api/table-views?orgId=...
/api/search?orgId=...
/api/views/[id]?orgId=...
```

Correct route shape:

```txt
/api/orgs/[orgSlug]/table-views/...
/api/orgs/[orgSlug]/objects/products/views/...
/api/orgs/[orgSlug]/inventory/stock-levels/views/...
```

The server must verify:

```txt
authenticated user
platform User exists
organization slug exists
user belongs to organization
module is enabled if target is module-owned
permission allows access to target resource
requested fields are allowed for that user
requested filters are allowed for that user
requested export is allowed if exporting
```

---

# 13. Permission Requirements

The future engine must never show data merely because a saved view exists.

Saved view access requires current permission checks.

Examples:

```txt
User has objects.product.read
→ may access Product table views.

User lacks objects.product.read
→ may not access Product table views even if the view exists.

User has inventory.stock_level.read
→ may access stock-level views if Inventory module is enabled.

User lacks inventory.stock_level.read
→ may not access stock-level views.
```

View configuration permissions should be separate from record reading permissions.

Possible future permissions:

```txt
platform.table_view.read
platform.table_view.create
platform.table_view.update
platform.table_view.delete
platform.table_view.share
platform.table_view.set_default
```

However, these platform permissions must not override target-resource permissions.

For example:

```txt
platform.table_view.read
```

must not allow a user to read Product data unless they also have:

```txt
objects.product.read
```

---

# 14. Module Enablement Requirements

For module-owned table targets, module enablement is required.

Example:

```txt
Target: inventory.stock_level
Required: Inventory module enabled for org
Required: user has inventory.stock_level.read
```

If the module is disabled:

```txt
Return 404 MODULE_NOT_FOUND
```

Do not return a detailed error exposing disabled module internals to ordinary users.

Business Object targets do not require a business module, but they still require object permissions.

Example:

```txt
Target: objects.product
Required: objects.product.read
No Inventory module requirement
```

Because Product is a Business Object, not an Inventory entity.

---

# 15. Column Rules

A future engine may allow configurable columns.

But column availability must be controlled by metadata and permissions.

## 15.1 Column metadata

A column should have metadata like:

```ts
type TableColumnMetadata = {
  key: string
  label: string
  type: FieldType
  visibleByDefault?: boolean
  hideable?: boolean
  sortable?: boolean
  filterable?: boolean
  exportable?: boolean
  sensitive?: boolean
  width?: number
  align?: 'left' | 'center' | 'right'
}
```

## 15.2 Forbidden columns

The engine must not expose internal fields by default.

Forbidden by default:

```txt
orgId
deletedAt
deletedBy
internal IDs unless useful
passwords
service keys
auth provider fields
sensitive payroll fields
sensitive government IDs
raw JSON config
raw metadata blobs
```

`id` may appear in APIs, but should rarely be visible as a table column.

## 15.3 Sensitive fields

Sensitive fields require explicit approval.

A field marked sensitive should default to:

```txt
visible: false
searchable: false
exportable: false
aiVisible: false
eventPayload: false
```

If a sensitive field must be visible, it needs a specific permission.

---

# 16. Filter Rules

The future engine may allow configurable filters.

Filters must be generated from allowed metadata, not arbitrary user expressions.

Allowed filter types may include:

```txt
text contains
exact match
select option
multi-select
number range
date range
boolean
relation selector
status selector
```

Forbidden filters:

```txt
raw SQL filters
Prisma where JSON from client
JavaScript filter functions
filters against hidden fields
filters against sensitive fields without permission
filters using orgId from client
filters using deletedAt unless admin restore context
```

Client-submitted filters must be parsed into a safe server-side query model.

The server decides the final database query.

---

# 17. Sort Rules

Sorting should be allowed only on fields marked sortable.

Forbidden:

```txt
client submits raw orderBy object
client sorts by orgId
client sorts by sensitive field without permission
client sorts by deletedAt in normal views
client sorts by arbitrary relation path
```

Allowed example:

```json
{
  "sort": [
    { "field": "name", "direction": "asc" }
  ]
}
```

Server validation must confirm:

```txt
field exists in metadata
field is sortable
user can access the field
sort direction is valid
```

---

# 18. Pagination Rules

All future dynamic table APIs must use bounded pagination.

Required:

```txt
default page size
maximum page size
stable sorting
pagination metadata
```

Possible future response shape:

```json
{
  "data": {
    "rows": [],
    "view": {},
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 120
    }
  },
  "error": null
}
```

Forbidden:

```txt
unbounded findMany
export through normal table endpoint
loading all rows to filter client-side
```

Large exports should later use the Import/Export Engine or Background Jobs.

---

# 19. Saved View Rules

Saved views are useful but risky.

A saved view stores table configuration, not data.

It may store:

```txt
visible columns
column order
filter definitions
sort definitions
density
page size
view label
view scope
```

It must not store:

```txt
row data
cached sensitive values
raw SQL
raw Prisma where clauses
client-supplied orgId
permission snapshots as permanent truth
full user objects
full records
```

Permissions should be evaluated at request time, not only when the view was created.

If a user loses access to a field or module, saved views must respect the new permissions.

---

# 20. Default View Rules

A future engine may support defaults.

Possible defaults:

```txt
system default
organization default
user default
```

Resolution order may be:

```txt
user default
organization default
system default
```

But this must not override permissions.

If a default view contains a field the user cannot access, the field should be removed or the view should fail safely.

Do not silently expose restricted data.

---

# 21. Export Rules

Table export is high-risk and must not be included automatically.

Export may eventually use table views, but export requires separate permissions.

Example:

```txt
objects.product.read
```

does not automatically grant:

```txt
objects.product.export
```

Possible future export rules:

```txt
export only visible/exportable fields
exclude sensitive fields by default
exclude soft-deleted records by default
log export events
limit export size
use background jobs for large exports
```

Export must not be implemented as:

```txt
fetch all rows from current table endpoint
convert client-side to CSV
```

That pattern risks data leaks and performance issues.

---

# 22. Business Object Table Rules

Business Object tables belong to the Business Objects layer.

Examples:

```txt
objects.employee
objects.product
objects.customer
objects.supplier
objects.warehouse
```

Business Object views should use `objects.*` permissions.

Examples:

```txt
objects.employee.read
objects.product.read
objects.customer.read
objects.supplier.read
objects.warehouse.read
```

They should not require module permissions unless the view includes module extension fields.

Example:

A basic Product table requires:

```txt
objects.product.read
```

A Product table showing inventory-specific fields like reorder point may require:

```txt
objects.product.read
inventory.product_extension.read
```

The future engine must understand the difference between:

```txt
core Business Object fields
module extension fields
module-owned records
```

---

# 23. Module Table Rules

Module-owned tables use module permissions.

Examples:

```txt
inventory.stock_level.read
inventory.stock_movement.read
purchasing.purchase_request.read
leave.leave_request.read
expenses.expense_claim.read
assets.asset.read
```

Module table targets require:

```txt
tenant membership
module enabled
resource permission
soft-delete exclusion
```

Module table views must not expose Business Object extension fields without the correct permission.

---

# 24. Relationship to Design System

The Dynamic Table View Engine must inherit Design System standards.

It must not invent a separate table UI.

The engine should use approved components for:

```txt
table shell
toolbar
filter chips
column selector
saved view dropdown
bulk actions
row actions
empty state
loading skeleton
error state
pagination
keyboard navigation
```

The engine should preserve OneDayOS product feel:

```txt
minimal
premium
fast
data-dense
keyboard-first
consistent
beautiful tables
```

A dynamic table that feels like a generic admin dashboard is a failure.

---

# 25. Relationship to AI

The future AI Layer may use table metadata to answer questions or build filters.

But AI must never bypass table permissions.

Allowed future use:

```txt
User asks: "Show products with low stock."
AI creates a safe filter for an allowed table view.
```

Forbidden:

```txt
AI generates raw SQL.
AI accesses hidden fields.
AI exports sensitive columns.
AI sees all records regardless of permissions.
AI creates cross-tenant table views.
```

AI-generated filters must be translated into approved filter metadata and validated server-side.

---

# 26. Relationship to Search

The future Search Service may power global search or table quick-search.

But table search must remain scoped.

Requirements:

```txt
search within current table target
respect permissions
respect module enablement
respect orgId
exclude soft-deleted records
exclude sensitive fields unless allowed
```

Search results must not contain fields that the table metadata would hide.

---

# 27. Relationship to Reporting

Do not turn saved views into reports.

A saved table view is for operational records.

A report is for business insight.

Examples:

```txt
Saved Table View:
  Open purchase requests this week

Report:
  Purchasing spend by supplier by month
```

If users need grouping, totals, pivots, charts, or scheduled delivery, that belongs to Reporting Service, not Dynamic Table View Engine.

---

# 28. Relationship to Background Jobs

Most table view queries should be request/response.

Background Jobs may be needed later for:

```txt
large exports
scheduled exports
heavy report generation
reindexing search documents
backfilling saved views after metadata changes
```

Do not introduce Background Jobs just to support table views during MVP.

---

# 29. Future Data Model Concept

A future implementation may introduce tables like:

```prisma
model TableView {
  id          String   @id @default(cuid())
  orgId       String
  key         String
  label       String
  targetType  String   // "objects" | "module"
  moduleId    String?
  resource    String
  scope       String   // "system" | "organization" | "user"
  ownerUserId String?
  config      Json
  isDefault   Boolean  @default(false)
  createdBy   String
  updatedBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  @@unique([orgId, key])
  @@index([orgId, targetType, moduleId, resource])
  @@map("table_views")
}
```

This is not approved for implementation yet.

A future ADR should decide:

```txt
whether system views live in code or database
whether user views are stored in PostgreSQL
whether organization defaults are enabled in first release
how config JSON is validated
whether soft delete applies to views
how to migrate view configs between versions
```

---

# 30. API Contract Concept

Future APIs may look like:

```txt
GET    /api/orgs/[orgSlug]/table-views
POST   /api/orgs/[orgSlug]/table-views
GET    /api/orgs/[orgSlug]/table-views/[viewId]
PATCH  /api/orgs/[orgSlug]/table-views/[viewId]
DELETE /api/orgs/[orgSlug]/table-views/[viewId]
POST   /api/orgs/[orgSlug]/table-views/[viewId]/query
```

But route shape should be reviewed before implementation.

Alternative target-specific routes may be cleaner:

```txt
GET  /api/orgs/[orgSlug]/objects/products/views
POST /api/orgs/[orgSlug]/objects/products/views/query
GET  /api/orgs/[orgSlug]/inventory/stock-levels/views
POST /api/orgs/[orgSlug]/inventory/stock-levels/views/query
```

The future implementation document must choose one.

Every API must return:

```json
{
  "data": null,
  "error": null
}
```

or:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid table view configuration.",
    "details": {}
  }
}
```

No redirects.

No HTML auth responses.

No unhandled throws to client.

---

# 31. Validation Rules

Future table view config must be validated with Zod.

Validation must happen for:

```txt
route params
query strings
request bodies
saved view config JSON
filter definitions
sort definitions
column definitions
export requests
```

Unknown keys should be rejected by default.

Client-submitted config must never become a raw Prisma query.

Bad pattern:

```ts
await db.product.findMany({ where: body.where })
```

Correct pattern:

```ts
const parsed = TableFilterSchema.parse(body.filters)
const safeWhere = buildProductWhere(ctx, parsed)
await db.product.findMany({ where: safeWhere })
```

---

# 32. Security Risks

The future engine is security-sensitive because it controls what data appears in tables.

Risks include:

```txt
saved view exposes hidden field
saved view exposes another tenant's records
saved view bypasses module enablement
filter JSON becomes raw Prisma where
export includes sensitive fields
AI creates unsafe table filter
soft-deleted records appear in normal views
user retains access through old saved view after permission removed
client-supplied orgId leaks data
```

Every one of these risks must have tests before implementation.

---

# 33. Testing Requirements for Future Implementation

A future implementation must include tests for:

```txt
unauthenticated request returns 401 JSON
wrong-org request returns safe 404
module-disabled request returns MODULE_NOT_FOUND
user without read permission gets 403
user cannot see hidden columns
user cannot filter hidden fields
user cannot sort hidden fields
user cannot export without export permission
client-supplied orgId is rejected
soft-deleted records are excluded
saved views respect current permissions
saved views do not store row data
view config rejects unknown keys
view config rejects raw SQL
view config rejects raw Prisma where/orderBy
Business Object views use objects.* permissions
module views use module permissions
extension-field views require extension permissions
```

Tests must use at least two organizations.

Admin-only tests are insufficient.

---

# 34. Generator Requirements

The Module Generator and future CRUD/Form generators may prepare metadata for table views.

They must not generate runtime Dynamic Table View Engine code yet.

Allowed generator output:

```txt
static table columns
static filters
static list page
static DataTable usage
field metadata hints
module manifest metadata
```

Forbidden generator output:

```txt
saved views table
table view persistence
dynamic query runtime
client-driven Prisma filters
raw SQL filters
orgId hidden fields
view builder UI
sdk.tables implementation
```

---

# 35. Performance Requirements

Future table views must be designed for growing datasets.

Requirements:

```txt
server-side pagination
bounded page sizes
indexed common filters
indexed sort fields where needed
no unbounded client-side filtering
no loading all rows to browser
no automatic joins across many modules
no N+1 relation loading
```

A future implementation should define:

```txt
maximum page size
allowed relation depth
allowed filter complexity
query timeout expectations
indexing requirements
```

---

# 36. Migration and Compatibility

Saved view configuration becomes a compatibility contract.

Changing field keys can break saved views.

Future implementation must handle:

```txt
renamed fields
removed fields
permission changes
module disabled state
metadata version changes
Business Object field promotion
module extension changes
```

Possible strategy:

```txt
store metadata version on saved view
validate view on load
remove unavailable fields safely
show warning when view changed
provide migration scripts for major changes
```

This must be specified before implementation.

---

# 37. Forbidden Patterns

Claude must not generate or implement these patterns:

```txt
sdk.tables.getRows(orgId, ...)
body.orgId
query.orgId
hidden orgId form fields
/api/table-views?orgId=...
raw SQL filters
Prisma where JSON from client
Prisma orderBy JSON from client
saved views without orgId
saved views storing row data
saved views exposing deleted records by default
client-side filtering of all records
export from browser-only data
admin dashboard-style generic table dump
```

Also forbidden:

```txt
FastAPI table service
Python table backend
Pydantic table schemas
SQLAlchemy query builder
Alembic migrations
```

FastAPI remains excluded from the core platform unless a future ADR proves a narrow specialized need.

---

# 38. Claude Implementation Rules

Claude may not implement the Dynamic Table View Engine from this document alone.

If asked to implement table behavior before this engine is approved, Claude must implement ordinary static tables using:

```txt
Design System table standards
shared DataTable component
module-specific services
verified PlatformContext
static Zod schemas
static permissions
server-side APIs
```

Claude must not add:

```txt
runtime view builder
saved view persistence
sdk.tables runtime
view config database tables
client-driven filters
raw query builders
```

If a task requires those features, Claude should stop and ask for the future implementation document.

---

# 39. Founder Decision Notes

This document intentionally protects ease of future app development.

It may feel like extra planning now, but its purpose is to prevent three bad outcomes:

```txt
1. Every module builds tables differently.
2. Claude creates unsafe generic CRUD/admin screens.
3. Saved views become a security hole.
```

The goal is not to delay app delivery forever.

The goal is to make the first real modules produce the patterns that future generators and dynamic systems can safely reuse.

A good future outcome looks like:

```txt
Claude creates a new module.
The module has a secure static list page.
The list page uses shared table standards.
Repeated patterns are captured in metadata.
After enough repetition, a Dynamic Table View Engine is extracted.
Future modules become faster, not slower.
```

If this process does not make delivery faster after the foundation is built, the architecture has failed.

---

# 40. Acceptance Criteria for This Document

This document is acceptable when it clearly defines:

```txt
[ ] Dynamic Table View Engine is deferred.
[ ] It is distinct from DataTable, Search, Reporting, Dynamic CRUD, and Dynamic Forms.
[ ] It requires verified PlatformContext.
[ ] It forbids client-supplied orgId.
[ ] It respects module enablement.
[ ] It respects permissions.
[ ] It respects Business Object boundaries.
[ ] It excludes soft-deleted records by default.
[ ] It rejects raw SQL and raw Prisma query input.
[ ] It defines saved view risks.
[ ] It defines future security tests.
[ ] It blocks Claude from premature implementation.
[ ] It explains how this helps future app development.
```

---

# 41. Summary

The Dynamic Table View Engine is a future OneDayOS accelerator.

It should eventually make list screens faster to create, easier to configure, and more consistent across modules.

But it should not be implemented during the restarted foundation build.

The correct approach is:

```txt
Build excellent static tables first.
Observe repeated table patterns.
Use Field Metadata as a contract.
Use generators for static scaffolding.
Promote to Dynamic Table View Engine only after real pain is proven.
```

This protects the platform from premature abstraction while still preparing the path toward much faster app development later.
