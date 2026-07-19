# OneDayOS Engineering Manual — 11 Dynamic Systems / 06 View Builder

**Document ID:** `11-dynamic-systems/06-view-builder.md`  
**Version:** `0.1.0`  
**Status:** Draft for Founder Review  
**Implementation Status:** Deferred — Contract Only  
**Owner:** OneDayOS Founder / Platform Architect  
**Last Updated:** July 2026  
**Applies To:** Future Dynamic Table Views, saved views, personal views, org views, module views, filters, columns, sorting, density, and user table preferences  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/05-data-validation-zod.md`
- `11-dynamic-systems/00-dynamic-systems-philosophy.md`
- `11-dynamic-systems/03-dynamic-table-view-engine.md`
- `11-dynamic-systems/04-field-metadata-schema.md`

---

# 1. Purpose

The View Builder is the future OneDayOS capability that allows users and organizations to create, save, share, and reuse table views.

A table view answers questions like:

```txt
Which columns should this user see?
Which filters are applied?
Which sort order is used?
How dense should the table be?
Is this view personal or organization-wide?
Is this the default view for this module/resource?
```

Examples:

```txt
Inventory → Low Stock Products
Inventory → Recently Adjusted Items
CRM → Active Leads
CRM → Overdue Follow-ups
Leave → Pending Requests
Expenses → Claims Awaiting Approval
Assets → Assigned to Me
Incidents → Open Incidents This Week
```

The View Builder exists so that OneDayOS can eventually support premium, data-dense workflows without custom-building table variants per client.

However, the View Builder is **not** part of the restarted foundation build.

During the foundation build, OneDayOS should use:

```txt
hand-coded tables
shared DataTable component
static module-defined views where helpful
field metadata contracts
strict API filters
server-side validation
```

The View Builder should be implemented only after repeated module patterns prove that saved configurable views are worth the complexity.

---

# 2. Strategic Decision

The View Builder is **deferred**.

It should be documented now as an architectural contract, but Claude must not implement it during the restarted foundation build.

```txt
Allowed now:
  shared table design standards
  hand-coded list pages
  static table filter presets
  field metadata types
  module-local filter/query schemas
  module-local UI tabs when simple

Not allowed now:
  saved user views
  org-wide configurable views
  runtime view builder UI
  dynamic Prisma filters from client JSON
  sdk.views
  view tables
  view APIs
  custom view permissions
  generic no-code view builder
```

The reason is simple:

```txt
A bad View Builder becomes a generic admin dashboard.
A good View Builder must be extracted from real OneDayOS table patterns.
```

OneDayOS should first build excellent hand-coded tables and module screens. The View Builder should come later, after the patterns are clear.

---

# 3. Definitions

## 3.1 Table View

A **Table View** is a saved configuration for displaying a list of records.

It may include:

```txt
columns
column order
column visibility
filters
sorts
density
pagination preference
grouping future
display mode future
```

A view stores presentation/query configuration.

A view does **not** store business records.

---

## 3.2 Preset View

A **Preset View** is a view defined by a module in code.

Example:

```txt
Inventory:
  All Products
  Low Stock
  Recently Updated
  Inactive Products
```

Preset views are safe to use earlier because they are static and reviewed.

They are not user-generated.

---

## 3.3 Personal View

A **Personal View** is saved by one user for themselves.

Example:

```txt
"My Low Stock Items"
"My Open Incidents"
"My Pending Approvals"
```

Personal views are future functionality.

They are deferred.

---

## 3.4 Organization View

An **Organization View** is available to multiple users in the same organization.

Example:

```txt
"Management Dashboard View"
"Warehouse Team View"
"Accounting Review View"
```

Organization views are future functionality and require permissions.

They are deferred.

---

## 3.5 Default View

A **Default View** is the table configuration a user sees when opening a page.

Future default resolution order may be:

```txt
user personal default
organization default
module preset default
system fallback
```

Default view logic is deferred.

---

## 3.6 View Builder

The **View Builder** is the future UI and API layer that allows authorized users to create/edit/delete saved views.

The View Builder is not the same as the DataTable component.

The View Builder is not the same as the Dynamic Table View Engine.

---

# 4. Relationship to Other Systems

## 4.1 View Builder vs DataTable Component

The DataTable component is a reusable UI component.

It renders rows and columns.

The View Builder is a future configuration system.

```txt
DataTable:
  Renders table UI.

View Builder:
  Allows users to configure and save table views.
```

The DataTable component should exist before the View Builder.

---

## 4.2 View Builder vs Dynamic Table View Engine

The Dynamic Table View Engine is the runtime system that interprets field metadata and view definitions to render configurable tables.

The View Builder is the future UI that allows users to create or edit those view definitions.

```txt
Dynamic Table View Engine:
  Executes and renders view definitions.

View Builder:
  Lets users create/edit those definitions.
```

Therefore:

```txt
Dynamic Table View Engine should come before View Builder.
```

The View Builder must not be implemented first.

---

## 4.3 View Builder vs Search

Search answers:

```txt
Find records matching this text.
```

View Builder answers:

```txt
Show this resource with these columns, filters, and sorting preferences.
```

They may overlap, but they are not the same system.

Search Service remains deferred.

---

## 4.4 View Builder vs Reporting

Reporting answers:

```txt
What are the totals, summaries, charts, exports, and analytics?
```

View Builder answers:

```txt
How should this table list be displayed?
```

A saved table view is not a report.

A report may later use some view-like concepts, but reporting remains a separate Platform Service.

---

## 4.5 View Builder vs Dynamic CRUD

Dynamic CRUD may eventually generate full create/read/update/delete experiences from metadata.

View Builder is narrower.

It focuses only on saved table/list configurations.

```txt
Dynamic CRUD:
  Full entity CRUD runtime.

View Builder:
  Saved table/list views.
```

The View Builder must not become a backdoor Dynamic CRUD Engine.

---

## 4.6 View Builder vs Custom Fields

The View Builder must not create new fields.

It only chooses from approved existing fields.

```txt
Allowed:
  Show/hide approved field.
  Filter by approved field.
  Sort by approved field.

Forbidden:
  Create new database field.
  Create custom JSON field.
  Add raw SQL expression.
  Add arbitrary computed JavaScript field.
```

Generic custom fields remain forbidden in MVP.

---

# 5. Why This Is Deferred

The View Builder looks attractive because it sounds like it will make every module configurable.

But early implementation is dangerous.

It introduces:

```txt
view storage
view ownership
view permissions
filter validation
sort validation
field allowlists
sensitive field rules
query generation
API complexity
migration complexity
UI complexity
support burden
cross-module ambiguity
```

If implemented too early, it will likely become a low-quality no-code/admin dashboard feature.

OneDayOS should first learn what tables actually need.

Examples of real patterns to observe:

```txt
Do clients repeatedly ask for saved filters?
Do managers need shared team views?
Do users need personal column preferences?
Do modules repeatedly hard-code the same filtering logic?
Do support requests show that table customization would reduce custom work?
```

Until those patterns exist, the View Builder should stay as a contract only.

---

# 6. Trigger for Future Implementation

The View Builder may be proposed only when at least three independent table-view use cases exist.

Examples that may count:

```txt
Inventory needs saved Low Stock / By Warehouse / Inactive Products views.
CRM needs saved Pipeline / Follow-up / Lost Leads views.
Expenses needs saved Pending / Approved / Rejected / My Claims views.
```

Or:

```txt
Three clients independently ask for saved table preferences across modules.
```

The trigger is not automatic implementation.

It triggers review.

Required before implementation:

```txt
[ ] Evidence log
[ ] Founder approval
[ ] ADR
[ ] Field metadata finalized enough for table usage
[ ] Dynamic Table View Engine spec reviewed
[ ] View storage model reviewed
[ ] API contract reviewed
[ ] Permission model reviewed
[ ] Tenant isolation tests defined
[ ] Sensitive field rules defined
[ ] Generator impact reviewed
```

---

# 7. Non-Goals

The View Builder must not do these things:

```txt
create database fields
create Prisma models
run migrations
generate raw SQL
accept raw Prisma filters from the client
accept raw Prisma orderBy from the client
expose all fields automatically
ignore permissions
ignore module enablement
ignore soft delete
replace Reporting Service
replace Search Service
replace Dynamic CRUD Engine
replace Dynamic Form Engine
become a no-code app builder
become a generic admin dashboard
```

It must also not add:

```txt
FastAPI
Python backend files
Pydantic schemas
Alembic migrations
SQLAlchemy models
external BI tools
client-specific forks
```

---

# 8. Future Conceptual Model

A future saved view may look like this:

```ts
type TableViewDefinition = {
  id: string
  name: string
  scope: 'personal' | 'organization' | 'module_preset'
  module: string
  resource: string
  columns: TableViewColumn[]
  filters: TableViewFilter[]
  sorts: TableViewSort[]
  density: 'comfortable' | 'compact'
  pageSize: number
}
```

This definition is conceptual only.

It must not be implemented yet.

---

# 9. Future Storage Model

If implemented later, the likely database model is:

```prisma
model TableView {
  id          String   @id @default(cuid())
  orgId       String
  userId      String?  // null = org-level view
  module      String
  resource    String
  name        String
  scope       String   // "personal" | "organization"
  isDefault   Boolean  @default(false)
  config      Json
  createdBy   String
  updatedBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org  Organization @relation(fields: [orgId], references: [id])
  user User?        @relation(fields: [userId], references: [id])

  @@index([orgId, module, resource])
  @@index([orgId, userId])
  @@map("table_views")
}
```

This model is **not approved for implementation yet**.

It is included only to clarify future direction.

Important rules:

```txt
TableView is tenant-scoped.
TableView is soft-deletable.
TableView config is JSON, but validated JSON.
TableView does not store row data.
TableView does not store arbitrary SQL.
TableView does not store arbitrary Prisma queries.
```

---

# 10. Future View Configuration Shape

A future validated config may look like:

```ts
type TableViewConfig = {
  version: 1
  columns: Array<{
    field: string
    visible: boolean
    order: number
    width?: number
  }>
  filters: Array<{
    field: string
    operator: FilterOperator
    value: unknown
  }>
  sorts: Array<{
    field: string
    direction: 'asc' | 'desc'
  }>
  density: 'comfortable' | 'compact'
  pageSize: 25 | 50 | 100
}
```

Allowed filter operators must be explicitly enumerated.

Example:

```ts
type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'before'
  | 'after'
  | 'between'
  | 'in'
```

Forbidden operators:

```txt
raw_sql
raw_prisma
regex from client
function
javascript
eval
```

---

# 11. Field Allowlist Rule

The View Builder may only use fields explicitly declared as safe in Field Metadata.

Example:

```ts
{
  key: 'name',
  label: 'Name',
  type: 'text',
  table: {
    visibleByDefault: true,
    sortable: true,
    filterable: true,
  }
}
```

A field not declared as table-safe must not appear in view configuration.

This matters because some fields are sensitive or internal.

Examples of fields that should usually be hidden from View Builder:

```txt
orgId
deletedAt
deletedBy
internal notes
private metadata
token fields
security fields
salary fields
government IDs
raw JSON config
service payloads
```

---

# 12. Tenant Isolation Rules

Every future View Builder operation must use verified `PlatformContext`.

Allowed:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

const views = await sdk.views.list(ctx, {
  module: 'inventory',
  resource: 'stock_level',
})
```

Forbidden:

```ts
const orgId = body.orgId
const views = await prisma.tableView.findMany({ where: { orgId } })
```

Hard rules:

```txt
Client-supplied orgId is forbidden.
View storage is tenant-scoped.
Saved views cannot cross organizations.
A user from Org A cannot read Org B views.
A user from Org A cannot save views in Org B.
Wrong-org access must return safe 404 behavior.
```

---

# 13. Permission Rules

Future permissions may include:

```txt
platform.view.read
platform.view.create_personal
platform.view.update_personal
platform.view.delete_personal
platform.view.create_organization
platform.view.update_organization
platform.view.delete_organization
platform.view.set_default
```

However, these permissions are not approved yet.

The future permission model should probably distinguish:

```txt
personal view permissions
organization-wide view permissions
default view management
admin-only view management
```

A regular user may be allowed to save personal views but not organization-wide views.

Example:

```txt
Staff:
  can save personal view

Manager:
  can create team/org view

Admin:
  can set organization default
```

---

# 14. Module Enablement Rules

A saved view for a module/resource must not be usable if that module is disabled for the organization.

Example:

```txt
Client A has Inventory enabled.
Client A can use inventory stock views.

Client B does not have Inventory enabled.
Client B cannot read, create, or apply inventory stock views.
```

Module-disabled behavior should return safe `404 MODULE_NOT_FOUND`.

---

# 15. Record Permission Rules

A user being able to read a saved view does not mean the user can read every record that the view might display.

View permission and record permission are separate.

Example:

```txt
User can open "Pending Expenses" view.
But the query must still return only expenses the user is allowed to read.
```

For MVP future implementation, because ABAC/own-record permissions are deferred, the first version should use module/resource read permissions only.

Later, branch/own-record/amount-scoped conditions may affect view results.

---

# 16. Sensitive Data Rules

A saved view must not reveal sensitive fields through column selection, filters, sorts, exports, AI context, or URL state.

Examples of risky fields:

```txt
employee salary
government IDs
bank details
private notes
supplier payment details
customer private contact data
security metadata
deleted records
internal system IDs
```

Field Metadata must mark sensitive fields.

The View Builder must respect those flags.

---

# 17. Soft Delete Rules

Saved views must exclude soft-deleted records by default.

A future "Deleted Records" view must require explicit restore/admin permissions.

Rules:

```txt
Normal views exclude deleted records.
Saved filters cannot bypass soft delete.
Saved views cannot include deleted records unless explicitly allowed.
Deleted TableView definitions are hidden by default.
Restoring a saved view requires permission.
```

---

# 18. API Route Contract — Future

Future View Builder APIs should live under tenant-scoped routes.

Examples:

```txt
GET    /api/orgs/[orgSlug]/views
POST   /api/orgs/[orgSlug]/views
GET    /api/orgs/[orgSlug]/views/[viewId]
PATCH  /api/orgs/[orgSlug]/views/[viewId]
DELETE /api/orgs/[orgSlug]/views/[viewId]
POST   /api/orgs/[orgSlug]/views/[viewId]/set-default
```

API route rules:

```txt
Use sdk.api.handle()
Use API-safe auth
Create verified PlatformContext
Validate route params
Validate query strings
Validate request body
Reject client-supplied orgId
Check permissions
Use SDK/service layer
Return { data, error, meta? } JSON only
Never redirect
Never return HTML
```

---

# 19. Server Query Rules

Future view execution must not pass client JSON directly into Prisma.

Forbidden:

```ts
db.product.findMany({
  where: body.view.filters,
  orderBy: body.view.sorts,
})
```

Allowed pattern:

```txt
1. Load saved view.
2. Validate saved view config with Zod.
3. Load field metadata allowlist.
4. Convert each allowed filter into a safe server-owned query fragment.
5. Convert each allowed sort into a safe server-owned order.
6. Apply orgId from PlatformContext.
7. Apply deletedAt: null.
8. Apply permission/module constraints.
9. Execute query.
```

The server owns the translation from view config to query.

The client never controls raw database query shape.

---

# 20. URL State Rules

Before saved views exist, modules may use URL query parameters for simple filters.

Example:

```txt
/inventory/products?status=active
/inventory/products?view=low-stock
```

Rules:

```txt
URL filters must be validated.
URL filters must not include orgId.
URL filters must not contain raw Prisma/SQL.
URL filters must not bypass permissions.
URL filters must not expose sensitive fields.
```

URL-based filters are useful now.

Saved views are deferred.

---

# 21. Static Preset Views Allowed Now

Modules may define static preset views in code if they improve UX.

Example:

```ts
export const inventoryProductViews = [
  {
    id: 'all',
    label: 'All Products',
    filters: {},
  },
  {
    id: 'inactive',
    label: 'Inactive',
    filters: { isActive: false },
  },
]
```

But even static preset views must follow these rules:

```txt
no client-supplied orgId
server-owned filters
validated params
permission checks
soft-delete exclusion
no raw SQL
no raw Prisma from client
```

Static preset views are not the View Builder.

They are just code-defined table shortcuts.

---

# 22. Client UI Rules — Future

A future View Builder UI should be premium and minimal.

It should not look like a generic admin filter builder.

Possible UI principles:

```txt
saved view tabs at top of table
compact filter chips
column visibility popover
sort menu
density toggle
save view dialog
personal/org scope selector
default view control for admins
```

Do not build a giant modal with every database field.

Do not expose internal field names.

Do not expose raw operators.

Use user-friendly language.

Example:

```txt
Good:
  "Status is Active"

Bad:
  "where.status.equals = active"
```

---

# 23. AI Rules — Future

AI may later help users create views.

Example:

```txt
"Show products that are low stock and updated this month."
```

But AI must not directly save or execute unsafe views.

AI-assisted views must follow the same validation flow:

```txt
natural language
→ proposed view config
→ field allowlist validation
→ permission validation
→ user confirmation
→ safe server execution
```

AI must not generate raw SQL or raw Prisma.

AI must not expose fields the user cannot access.

AI must not bypass module enablement or tenant isolation.

---

# 24. Export Rules

A saved view should not automatically grant export rights.

Export is separate.

Example:

```txt
User can view Product table.
User cannot export Product table unless they have objects.product.export.
```

Exporting a saved view must still check:

```txt
tenant isolation
module enablement
record read permission
export permission
sensitive-field restrictions
soft delete exclusion
row limits
```

---

# 25. Import Rules

The View Builder is unrelated to import.

A saved view must not define import mappings.

Import/export remains a separate deferred system.

---

# 26. Generator Rules

The Module Generator may eventually include code-defined preset views.

It must not generate runtime saved view infrastructure.

Allowed generator output:

```txt
static view constants
filter schema
tab labels
table column constants
tests for filter validation
```

Forbidden generator output:

```txt
TableView Prisma model
sdk.views
view APIs
view builder UI
saved view DB tables
raw filter passthrough
client-supplied orgId
raw SQL
FastAPI/Python files
```

---

# 27. Testing Requirements — Future

If the View Builder is implemented later, tests must include:

```txt
two-org tenant isolation tests
personal view ownership tests
organization view permission tests
default view resolution tests
field allowlist tests
sensitive field exclusion tests
invalid filter rejection tests
invalid sort rejection tests
client-supplied orgId rejection tests
module-disabled behavior tests
soft-deleted record exclusion tests
soft-deleted view exclusion tests
export permission separation tests
API JSON error shape tests
no redirect/HTML API tests
```

Testing must include at least:

```txt
Org A admin
Org A staff
Org B admin
Org B staff
```

Admin-only tests are insufficient.

---

# 28. Architecture Checks

Future architecture checks should block:

```txt
raw Prisma filters from client
raw SQL in view config
orgId in view request bodies
@/kernel/* imports from modules
raw Prisma imports from modules
sdk.getDb(orgId)
view APIs outside /api/orgs/[orgSlug]/...
HTML/redirect responses in view APIs
FastAPI/Python backend files for core platform
```

---

# 29. Failure Modes to Avoid

## 29.1 Generic Admin Dashboard Failure

If the View Builder simply exposes every table and field, OneDayOS will feel like a generic admin template.

Avoid this.

Views must be designed around business workflows and approved metadata.

---

## 29.2 Permission Bypass Failure

A saved view must never reveal data the user cannot otherwise access.

Bad:

```txt
User cannot read salary field in Employee page,
but can add salary column through View Builder.
```

This is forbidden.

---

## 29.3 Tenant Leak Failure

Saved views must never cross org boundaries.

Bad:

```txt
User edits viewId from another organization and sees config or data.
```

This is forbidden.

---

## 29.4 Query Injection Failure

Saved filters must not become raw database query fragments.

Bad:

```json
{
  "where": {
    "orgId": "other-org"
  }
}
```

This is forbidden.

---

## 29.5 Custom Field Creep Failure

The View Builder must not become the reason we add generic custom fields too early.

Bad:

```txt
Client wants a column.
So we add arbitrary customFields JSON.
Then filters, exports, AI, search, reports all break consistency.
```

Custom fields remain deferred.

---

# 30. Claude Implementation Rules

Claude must follow these rules:

```txt
Do not implement View Builder during foundation build.
Do not add TableView model.
Do not add sdk.views.
Do not add view APIs.
Do not add view builder UI.
Do not add saved view persistence.
Do not add runtime dynamic filters.
Do not pass client JSON into Prisma where/orderBy.
Do not accept client-supplied orgId.
Do not use sdk.getDb(orgId).
Do not import raw Prisma in modules.
Do not import @/kernel/* in modules.
Do not create FastAPI/Python backend files.
```

Claude may implement only if a future task explicitly provides:

```txt
Frozen View Builder spec
ADR
data model
API contract
permission model
test matrix
migration plan
implementation scope
```

---

# 31. Acceptance Criteria for This Document

This document is acceptable when it clearly establishes that:

```txt
[ ] View Builder is deferred.
[ ] View Builder is not DataTable.
[ ] View Builder is not Dynamic Table View Engine.
[ ] View Builder is not Search.
[ ] View Builder is not Reporting.
[ ] View Builder is not Dynamic CRUD.
[ ] View Builder does not create fields.
[ ] Saved views are tenant-scoped.
[ ] Saved views must use PlatformContext.
[ ] Client-supplied orgId is forbidden.
[ ] Raw Prisma/SQL filters from client are forbidden.
[ ] Field allowlists are required.
[ ] Sensitive fields are protected.
[ ] Module enablement and permissions still apply.
[ ] Soft delete still applies.
[ ] Static preset views are allowed before runtime saved views.
[ ] Claude is blocked from implementing runtime View Builder now.
```

---

# 32. Summary

The View Builder is a future premium capability for OneDayOS.

It will eventually let users and organizations save table configurations, filters, sorting, columns, density, and defaults.

But it must not be built too early.

For now, OneDayOS should focus on:

```txt
excellent hand-coded tables
shared DataTable components
strong field metadata contracts
safe module APIs
secure filters
Business Object boundaries
tenant isolation
permission enforcement
static preset views where useful
```

The View Builder should come later, after repeated real module patterns prove the need.

The rule is:

```txt
Build great tables first.
Extract configurable views later.
Never let saved views become a permission, tenant, or generic-admin-dashboard risk.
```
