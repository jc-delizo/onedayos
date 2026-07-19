# OneDayOS Engineering Manual — 10 Platform Services / 08 Reporting Service

**Document ID:** `10-platform-services/08-reporting-service.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Deferred — Contract Only  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/04-module-permissions.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`

---

# 1. Purpose

This document defines the future **Reporting Service** for OneDayOS.

The Reporting Service is a deferred Platform Service that will eventually provide reusable reporting capabilities across Business Objects and modules.

It should prevent OneDayOS from becoming a collection of custom SQL queries, custom dashboards, and one-off spreadsheet exports per client.

The Reporting Service should eventually support:

```txt
Saved reports
Reusable report definitions
Permission-aware report execution
Tenant-scoped filtering
Module-provided report templates
Business Object reports
Aggregations
Date ranges
Exports
Dashboard widgets
Future scheduled reports
Future AI-assisted report creation
```

However, the Reporting Service **must not be implemented during the restarted foundation build**.

During the foundation build, OneDayOS should only prepare for reporting by enforcing:

```txt
Clean tenant-scoped data models
Consistent Business Objects
Stable module manifests
Permission declarations
Typed events
Validated APIs
SDK-only database access
Consistent table/form patterns
```

---

# 2. Implementation Status

## 2.1 Current Status

```txt
Deferred — Contract Only
```

This document is allowed to define:

```txt
Principles
Boundaries
Future architecture
Trigger conditions
Non-goals
Security rules
Manifest expectations
Future API shape
Future data model direction
Testing expectations
Claude restrictions
```

This document is **not** allowed to authorize implementation of:

```txt
report tables
report builder UI
report execution engine
saved report APIs
scheduled reports
report exports
report dashboard widgets
AI report builder
raw SQL report editor
cross-module analytics engine
background report jobs
```

Claude must not implement the Reporting Service from this document alone.

---

# 3. Why Reporting Is Deferred

Reporting feels like a core ERP capability, but building it too early is dangerous.

A premature Reporting Service often becomes one of these bad systems:

```txt
A generic query builder nobody uses
A custom SQL backdoor
A fragile dashboard engine
A slow cross-module analytics layer
A per-client report customization trap
A security hole that bypasses permissions
A pile of CSV exports with inconsistent filters
```

OneDayOS should first build several real modules and observe repeated reporting needs.

Examples:

```txt
Inventory needs low-stock reports.
Leave needs leave balance reports.
Expenses needs reimbursement reports.
Purchasing needs purchase request reports.
CRM needs pipeline reports.
Assets needs asset assignment reports.
```

At first, each module may have simple module-local reports.

Only after patterns repeat should OneDayOS promote the common reporting infrastructure into a Platform Service.

---

# 4. Three Independent Use Cases Trigger

The Reporting Service may be proposed after at least three independent reporting use cases exist.

Examples that may count:

```txt
Inventory: low-stock report
Expenses: expense summary by department
Purchasing: purchase request aging report
```

Or:

```txt
CRM: pipeline by stage
Projects: billable work summary
Assets: asset assignment history
```

Three use cases do **not** automatically mean implementation.

They trigger a review.

The review must answer:

```txt
Are these reports structurally similar?
Do they need shared saved report definitions?
Do they need shared export behavior?
Do they need shared filters/date ranges?
Do they need cross-module reporting?
Do they need scheduled delivery?
Could shared table/view components solve this instead?
Could module-local reports remain sufficient?
```

---

# 5. Reporting Service Is Not

The Reporting Service is **not**:

```txt
The Event Bus
The Audit Log Service
The Activity Feed Service
The Search Service
The AI Layer
The Dynamic CRUD Engine
The Dynamic Table View Engine
The Workflow Engine
A BI platform
A SQL editor
A data warehouse
A spreadsheet replacement
A dashboard template library
A per-client custom report dumping ground
```

These distinctions matter.

## 5.1 Reporting vs Search

Search answers:

```txt
Find records matching a query.
```

Reporting answers:

```txt
Summarize, filter, group, compare, or export records for business decision-making.
```

Example:

```txt
Search: Find product "ABC-123".
Reporting: Show all products below reorder threshold by warehouse.
```

## 5.2 Reporting vs Activity Feed

Activity Feed answers:

```txt
What happened to this record?
```

Reporting answers:

```txt
What is the current or historical business state across many records?
```

Example:

```txt
Activity Feed: Product ABC was updated yesterday.
Reporting: 42 products are below reorder threshold this week.
```

## 5.3 Reporting vs Audit Log

Audit Log answers:

```txt
Who changed what, when, and why?
```

Reporting answers:

```txt
What metrics, lists, summaries, or exports does the business need?
```

Audit logs are primarily accountability records.

Reports are primarily decision-support outputs.

## 5.4 Reporting vs Dynamic Table Views

Dynamic Table Views help users configure list screens:

```txt
columns
filters
sort order
saved views
```

Reporting is broader:

```txt
aggregations
grouping
summaries
exports
report templates
scheduled reports later
cross-entity report definitions later
```

The future Dynamic Table View Engine may provide pieces that Reporting uses, but it is not the same service.

---

# 6. Foundation-Stage Rule

During the restarted foundation build, Claude must not build Reporting Service infrastructure.

Allowed foundation work:

```txt
Use consistent tenant-scoped Prisma models.
Use Business Objects correctly.
Declare module-owned entities in manifests.
Declare future dashboard widgets in manifests as metadata only.
Emit typed events from mutations.
Return consistent API responses.
Use shared DataTable standards.
Use validated APIs.
Use PlatformContext everywhere.
```

Forbidden foundation work:

```txt
Create ReportDefinition table.
Create SavedReport table.
Create report builder UI.
Create SQL report editor.
Create report execution engine.
Create export engine.
Create scheduled reports.
Create dashboard analytics engine.
Create generic aggregation DSL.
Create FastAPI analytics backend.
Add Python data pipeline files.
```

---

# 7. Future Reporting Service Responsibilities

When implemented later, the Reporting Service may own:

```txt
Report definitions
Saved reports
Report execution
Common filters
Common date ranges
Common export behavior
Report permissions
Report result normalization
Dashboard report widgets
Report template registry
Report metadata validation
Scheduled report definitions later
```

It should provide a consistent way to define and execute reports across modules without allowing modules to bypass tenancy or permissions.

---

# 8. Responsibilities That Stay Outside Reporting

## 8.1 Kernel Responsibilities

Kernel owns:

```txt
Authentication
Organizations
Tenant context
Users
Roles
Permissions
API contracts
Module enablement
Settings
```

Reporting must consume Kernel through the SDK.

Reporting must not reimplement auth, org membership, roles, permissions, or module enablement.

## 8.2 SDK Responsibilities

The SDK owns the public interface that modules and Platform Services use.

Future reporting APIs should be exposed through SDK methods such as:

```ts
sdk.reporting.listTemplates(ctx)
sdk.reporting.run(ctx, reportId, input)
sdk.reporting.export(ctx, reportId, input)
```

But these methods must not exist until the Reporting Service is actually implemented.

## 8.3 Business Object Responsibilities

Business Objects define shared entity identity.

Examples:

```txt
Employee
Product
Customer
Supplier
Warehouse
```

Reporting may read Business Objects, but must not add module-specific fields to them.

## 8.4 Module Responsibilities

Modules own domain-specific records and workflows.

Examples:

```txt
Inventory owns stock movements.
Leave owns leave requests.
Expenses owns expense claims.
Purchasing owns purchase requests.
CRM owns opportunities.
```

Before the Reporting Service exists, modules may implement simple module-local reports.

But module-local reports must still follow:

```txt
PlatformContext
SDK database access
tenant scoping
permission checks
validated input
no client-supplied orgId
no raw Prisma in UI/API files
```

---

# 9. Reporting Use Case Levels

Reporting should evolve through levels.

## 9.1 Level 0 — Normal List Screens

Most early “reports” are just list screens with filters.

Examples:

```txt
Products list
Employees list
Customers list
Leave requests list
Expense claims list
```

These do not justify Reporting Service.

They should be handled through module pages, DataTable standards, and later Dynamic Table Views.

## 9.2 Level 1 — Module-Local Reports

A module-local report belongs inside one module.

Examples:

```txt
Inventory low-stock list
Leave requests by status
Expenses by month
Purchasing requests pending approval
```

These can be implemented inside the module when needed.

They are not Platform Services yet.

## 9.3 Level 2 — Repeated Report Patterns

Repeated patterns appear when multiple modules need similar reporting behavior.

Examples:

```txt
date range filters
status summaries
department grouping
branch grouping
user export
PDF/CSV export
saved filters
```

At this point, log evidence.

Do not automatically build Reporting Service.

## 9.4 Level 3 — Platform Reporting Service

The Reporting Service becomes justified when repeated patterns need shared infrastructure.

Examples:

```txt
Saved report definitions across modules
Unified export behavior
Dashboard widgets built from reports
Permission-aware reusable report templates
Report scheduling later
Common filter metadata
```

## 9.5 Level 4 — Analytics / BI

This is not MVP and not near-term.

Examples:

```txt
data warehouse
materialized analytics store
cross-tenant analytics
predictive analytics
advanced visualization builder
natural-language BI
```

These require future ADRs.

---

# 10. Future Report Types

The first future Reporting Service should support only simple report types.

## 10.1 Allowed First Report Types

Allowed first future types:

```txt
list report
summary/stat report
grouped count report
grouped sum report
simple date-range report
exportable table report
```

Examples:

```txt
Low-stock products by warehouse
Leave requests by status
Expense claims by department
Purchase requests by status
Customers created this month
Assets assigned by employee
```

## 10.2 Deferred Report Types

Deferred:

```txt
pivot tables
ad hoc SQL reports
drag-and-drop chart builder
multi-axis analytics
custom formula engine
cross-module joins without explicit approval
scheduled email reports
real-time streaming dashboards
AI-generated SQL
```

---

# 11. Tenant Isolation Rules

Reporting is high-risk because it often reads many records at once.

Every future reporting operation must use verified `PlatformContext`.

Correct:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const report = await sdk.reporting.run(ctx, reportId, input)
```

Forbidden:

```ts
const orgId = body.orgId
const report = await runReport(orgId, input)
```

Forbidden:

```ts
const orgId = req.nextUrl.searchParams.get('orgId')
```

Forbidden:

```ts
await prisma.product.findMany()
```

Every report query must be tenant-scoped by `ctx.org.id`.

No report may aggregate across organizations unless a future internal OneDayOS operator analytics system is explicitly designed, separated, permissioned, and approved by ADR.

---

# 12. Permission Rules

Reporting permissions must be explicit.

A user who can read a record does not automatically have permission to export large report data.

Future permission examples:

```txt
platform.reporting.read
platform.reporting.create
platform.reporting.update
platform.reporting.delete
platform.reporting.export
platform.reporting.schedule
```

Module report permissions may also exist:

```txt
inventory.report.read
inventory.report.export
expenses.report.read
expenses.report.export
crm.report.read
crm.report.export
```

The exact permission model requires future review.

## 12.1 Read vs Export

Export must be separate from read.

Reason:

```txt
Viewing a page of 25 records is lower risk than exporting 10,000 rows.
```

Therefore:

```txt
report.read does not imply report.export
```

## 12.2 Dashboard Widgets

Dashboard widgets must obey report permissions.

A user must not see a metric that summarizes records they are not allowed to access.

Example:

```txt
A staff user without expenses permissions must not see total company expenses.
```

## 12.3 Admin Wildcard

Admin wildcard permissions may grant reporting access inside the verified organization only.

Admin wildcard must never bypass:

```txt
tenant isolation
module enablement
report-specific constraints
sensitive data redaction rules
```

---

# 13. Module Enablement Rules

A report that depends on a module should only run if that module is enabled for the organization.

Example:

```txt
inventory.low_stock report requires Inventory enabled.
```

If Inventory is disabled for an organization, the report should not be visible and should not run.

Safe response for normal users:

```txt
404 REPORT_NOT_FOUND
```

Not:

```txt
403 You do not have access to inventory.low_stock
```

This avoids revealing disabled or unavailable capabilities unnecessarily.

---

# 14. Data Access Rules

Future Reporting Service must use SDK-owned data access.

Correct future pattern:

```ts
const db = sdk.getDb(ctx)
```

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
```

inside modules or report templates.

Forbidden:

```ts
sdk.getDb(orgId)
```

Report definitions must not include arbitrary raw SQL in MVP.

If a future advanced report truly requires raw SQL, it must:

```txt
be server-only
be founder-approved
be tenant-scoped
be parameterized
be tested with two organizations
be reviewed for permissions
be documented in an ADR
```

---

# 15. Soft Delete Rules

Reports must exclude soft-deleted records by default.

Normal reports should behave as if deleted records do not exist.

Correct:

```txt
Products report excludes products where deletedAt is not null.
```

Deleted-record reports require explicit admin/restore/reporting permission.

Example future permission:

```txt
platform.reporting.include_deleted
```

This should not exist in MVP.

---

# 16. Business Object Reporting

Business Object reports should use the `objects` namespace.

Examples:

```txt
objects.product.list
objects.employee.list
objects.customer.list
objects.supplier.list
objects.warehouse.list
```

However, these should not be built as Reporting Service features during foundation.

Business Object list pages can exist separately.

The Reporting Service becomes relevant when those lists need saved filters, exports, aggregations, reusable templates, or dashboard widgets.

---

# 17. Module Report Naming

Future report identifiers should be stable contracts.

Recommended pattern:

```txt
{namespace}.{report_name}
```

Examples:

```txt
inventory.low_stock
inventory.stock_movement_summary
leave.leave_balance_summary
expenses.expense_summary
purchasing.request_aging
crm.pipeline_summary
assets.assignment_summary
```

Avoid vague names:

```txt
report1
summary
dashboard
main_report
export_data
```

Report IDs are contracts because saved reports, widgets, permissions, exports, AI context, and documentation may reference them.

---

# 18. Future Report Definition Shape

A future report definition may look like this conceptually:

```ts
type ReportDefinition = {
  id: string
  namespace: string
  label: string
  description?: string
  source: ReportSource
  requiredPermission: PermissionRequirement
  requiredModules?: string[]
  filters: ReportFilterDefinition[]
  columns?: ReportColumnDefinition[]
  aggregations?: ReportAggregationDefinition[]
  defaultSort?: ReportSortDefinition
  exportable?: boolean
}
```

This is not implementation authorization.

It is a future contract direction.

---

# 19. Future Database Model Direction

Potential future models:

```txt
ReportTemplate
SavedReport
ReportRun
ReportExport
ScheduledReport
```

Do not create these tables now.

## 19.1 Possible Future `ReportTemplate`

```txt
id
namespace
key
label
description
sourceType
requiredPermission
requiredModules
isSystem
createdAt
updatedAt
```

System templates are defined by the platform or modules.

## 19.2 Possible Future `SavedReport`

```txt
id
orgId
templateId
name
filters
columns
sort
ownerUserId
visibility
createdAt
updatedAt
deletedAt
deletedBy
```

Saved reports are tenant-scoped.

## 19.3 Possible Future `ReportExport`

```txt
id
orgId
reportId
requestedByUserId
format
status
storageKey
createdAt
expiresAt
```

Exports may require future background jobs and storage.

Do not build this now.

---

# 20. Report Inputs

Every report input must be validated with Zod.

Examples:

```txt
date range
status
branchId
departmentId
warehouseId
employeeId
customerId
supplierId
pagination
sort
export format
```

Client-supplied `orgId` must be rejected.

Correct:

```ts
const RunInventoryReportSchema = z.strictObject({
  warehouseId: z.string().optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
})
```

Forbidden:

```ts
const RunReportSchema = z.object({
  orgId: z.string(),
  sql: z.string(),
})
```

---

# 21. Report Outputs

Report outputs should be predictable and UI-friendly.

Possible future normalized shape:

```ts
type ReportResult = {
  columns: ReportColumn[]
  rows: Record<string, unknown>[]
  totals?: Record<string, unknown>
  meta: {
    generatedAt: string
    rowCount: number
    truncated?: boolean
  }
}
```

Reports should not return raw Prisma objects by default.

Reports should return explicitly selected fields.

Reason:

```txt
Raw Prisma records may expose sensitive fields, deleted-state fields, internal IDs, or implementation details.
```

---

# 22. Export Rules

Export is deferred.

When implemented later:

```txt
CSV should come before Excel.
PDF should be avoided unless a real need exists.
Exports should be permission-gated separately.
Large exports should become background jobs.
Exports should expire.
Exports should not include hidden/deleted/sensitive fields by default.
Exports should be tenant-scoped.
Exports should be logged or auditable once Audit Log exists.
```

The first future export capability should likely be:

```txt
CSV export for list-style reports
```

Not:

```txt
custom branded PDF builder
Excel formula workbook generator
scheduled email attachments
```

---

# 23. Dashboard Widget Rules

Module manifests may declare future dashboard widget metadata.

But this is metadata only during the foundation build.

A dashboard widget should not run arbitrary report logic from the manifest.

Future widgets should resolve through approved report definitions or service functions.

Example future widget declaration:

```ts
{
  id: 'inventory.low_stock_count',
  label: 'Low Stock Items',
  type: 'stat',
  report: 'inventory.low_stock_count',
  requiredPermission: {
    module: 'inventory',
    resource: 'report',
    action: 'read',
  },
}
```

Do not implement this now.

---

# 24. AI Reporting Rules

AI-assisted reporting is deferred.

When implemented later, AI may help with:

```txt
suggesting report filters
explaining metrics
summarizing report results
generating report drafts from approved templates
mapping natural language to safe filters
```

AI must not:

```txt
run arbitrary SQL
discover hidden tables
bypass permissions
aggregate across tenants
export data without permission
invent fields
query raw Prisma directly
```

Natural language reporting must compile into approved report definitions and validated filters.

Not raw SQL.

---

# 25. Performance Rules

Reporting can become expensive.

Future Reporting Service implementation must consider:

```txt
pagination
row limits
timeouts
indexes
select-only-needed-fields
avoiding N+1 queries
caching only with tenant-safe keys
background jobs for large exports
materialized summaries only after evidence
```

MVP should not introduce materialized analytics tables or caching layers prematurely.

Potential future escalation path:

```txt
simple live queries
optimized indexes
precomputed module-local summaries
platform report cache
background report jobs
analytics warehouse
```

Only move up the path when real usage proves the need.

---

# 26. Privacy and Sensitive Data Rules

Reports often expose more data than normal screens.

Therefore:

```txt
reports should select explicit fields
exports should exclude sensitive fields by default
PII-heavy reports need special permission
financial reports need special permission
employee reports need special permission
AI summaries must not reveal hidden data
```

Examples of sensitive fields:

```txt
salary
personal phone numbers
government IDs
bank details
private customer notes
supplier bank accounts
internal incident notes
```

These fields should not be included in broad reports without explicit design and permissions.

---

# 27. Report Visibility

Future saved reports may have visibility levels:

```txt
private
role-shared
organization-shared
system
```

Do not implement these now.

If implemented later:

```txt
private = visible only to owner
role-shared = visible to users with selected roles
organization-shared = visible to authorized users in org
system = provided by platform/module
```

Visibility does not replace permission checks.

Even if a report is organization-shared, the viewer must still have permission to run it.

---

# 28. Scheduling Rules

Scheduled reports are deferred.

Scheduled reports imply:

```txt
background jobs
email or notification delivery
recipient permissions
export generation
file storage
retry behavior
failure handling
unsubscription/preferences
```

Do not implement scheduled reports until:

```txt
Reporting Service exists
Background Jobs exist
Notification or Email delivery decision exists
Attachment/Storage export handling exists
Audit/operation logging strategy exists
```

---

# 29. Cross-Module Reporting

Cross-module reporting is powerful and risky.

Examples:

```txt
Customer profitability across CRM, Projects, Expenses, and Billing
Employee workload across Projects, Leave, and Assets
Supplier performance across Purchasing, Inventory, and Expenses
```

These should not be implemented early.

Cross-module reporting requires explicit report definitions and careful dependency handling.

Rules:

```txt
No direct module-to-module imports
No implicit cross-module joins
No report if required modules are disabled
No cross-module report without explicit permissions
No cross-module report without tests using two organizations
```

Business Objects should be the preferred bridge.

Example:

```txt
Supplier report can combine PurchasingSupplierExtension and Supplier.
But Purchasing must not import Inventory.
```

---

# 30. Module-Local Reporting Before Platform Service

Before Reporting Service exists, modules may implement simple reports locally.

Allowed example:

```txt
Inventory module has a Low Stock page.
```

Rules:

```txt
It uses Inventory permissions.
It uses verified PlatformContext.
It uses sdk.getDb(ctx).
It rejects client-supplied orgId.
It validates filters.
It excludes soft-deleted records.
It does not create generic report tables.
It does not claim to be the Reporting Service.
```

If similar patterns appear in other modules, log the evidence.

---

# 31. Evidence Log Template

Every reporting pattern that may become platform-level should be logged.

```md
## Reporting Evidence Entry

Capability candidate:

Use case 1:
- Module:
- Client/org:
- Report needed:
- Filters:
- Output:
- Export needed:
- Pain point:

Use case 2:
- Module:
- Client/org:
- Report needed:
- Filters:
- Output:
- Export needed:
- Pain point:

Use case 3:
- Module:
- Client/org:
- Report needed:
- Filters:
- Output:
- Export needed:
- Pain point:

Pattern observed:

Alternatives considered:

Recommendation:
- Keep module-local
- Extract shared component/helper
- Propose Reporting Service
- Propose Dynamic Table View Engine instead
- Defer
```

---

# 32. Future API Direction

Future Reporting Service APIs may look like:

```txt
GET    /api/orgs/[orgSlug]/reports/templates
GET    /api/orgs/[orgSlug]/reports/saved
POST   /api/orgs/[orgSlug]/reports/[reportId]/run
POST   /api/orgs/[orgSlug]/reports/[reportId]/export
POST   /api/orgs/[orgSlug]/reports/saved
PATCH  /api/orgs/[orgSlug]/reports/saved/[savedReportId]
DELETE /api/orgs/[orgSlug]/reports/saved/[savedReportId]
```

Do not implement these now.

Future APIs must follow Kernel API contracts:

```txt
JSON only
{ data, error, meta? }
401 JSON for unauthenticated
403 JSON for unauthorized
404 safe errors for unavailable reports
VALIDATION_ERROR for invalid input
no redirects
no HTML responses
```

---

# 33. Future SDK Direction

Future SDK namespace may be:

```ts
sdk.reporting
```

Potential future methods:

```ts
sdk.reporting.listTemplates(ctx)
sdk.reporting.listSaved(ctx)
sdk.reporting.run(ctx, reportId, input)
sdk.reporting.export(ctx, reportId, input)
sdk.reporting.save(ctx, input)
sdk.reporting.deleteSaved(ctx, savedReportId)
```

Do not add this SDK namespace until Reporting Service is approved for implementation.

Reserved SDK namespaces should not contain placeholder methods.

Reason:

```txt
Placeholder SDK APIs become false contracts and encourage Claude to build against non-existent behavior.
```

---

# 34. Future UI Direction

Future Reporting UI should be modest at first.

Allowed first UI concepts:

```txt
Reports index page
Run report page
Saved reports list
Simple filter panel
Results table
CSV export button
Dashboard stat widgets
```

Deferred UI concepts:

```txt
drag-and-drop report builder
pivot table builder
advanced chart designer
SQL editor
scheduled report designer
real-time BI dashboard
custom PDF layout builder
```

The first Reporting UI should feel like OneDayOS:

```txt
minimal
premium
data-dense
keyboard-friendly
consistent with DataTable standards
clear empty states
fast perceived response
```

---

# 35. Generator Rules

The Module Generator must not generate Reporting Service scaffolding by default.

Allowed generator output:

```txt
module pages
module services
module APIs
module tests
event declarations
manifest metadata
simple list pages
```

Forbidden generator output:

```txt
report tables
report builder pages
report export APIs
saved report APIs
scheduled report jobs
analytics dashboards
generic report engine
```

If a module needs a simple module-local report, that should be implemented intentionally, not emitted automatically for every module.

---

# 36. Testing Requirements For Future Implementation

When Reporting Service is eventually implemented, tests must include:

```txt
authenticated access
unauthenticated 401 JSON
unauthorized 403 JSON
wrong-org safe 404 or denial
client-supplied orgId rejection
module-disabled report hidden/blocked
permission-specific report denial
export permission separate from read
soft-deleted records excluded
two-organization isolation
sensitive field exclusion
validated filters
invalid filter validation errors
large-result limit behavior
event/report template contract tests if applicable
```

Admin-only tests are insufficient.

Tests must include:

```txt
admin user
authorized staff user
unauthorized staff user
Org A
Org B
```

---

# 37. Architecture Checks

Future Reporting implementation must not introduce:

```txt
imports from @/kernel/* inside modules
raw Prisma in module report code
sdk.getDb(orgId)
client-supplied orgId
/api/reports?orgId=...
/api/[module]/reports without orgSlug
direct module-to-module imports
raw SQL from user input
unvalidated filters
export without permission
reports that include soft-deleted records by default
reports that bypass module enablement
FastAPI/Python backend files
```

`npm run check:architecture` should eventually detect these patterns where possible.

---

# 38. FastAPI / Python Decision

FastAPI is not part of the core Reporting Service.

Do not add:

```txt
FastAPI
Pydantic
SQLAlchemy
Alembic
Python reporting backend
Python data pipeline
separate reporting database service
```

A future analytics/data-science subsystem may require Python, but that would be a separate ADR after real evidence.

For the core OneDayOS platform:

```txt
Next.js route handlers
TypeScript
Prisma
PostgreSQL
SDK
PlatformContext
```

remain the reporting foundation.

---

# 39. Claude Implementation Rules

Claude must obey these rules:

```txt
Do not implement Reporting Service from this document alone.
Do not add reporting tables.
Do not add saved report APIs.
Do not add report builder UI.
Do not add export engine.
Do not add scheduled reports.
Do not add FastAPI or Python files.
Do not add raw SQL report execution.
Do not add sdk.reporting placeholder methods.
Do not add report scaffolding to module generator by default.
Do not bypass PlatformContext.
Do not accept client-supplied orgId.
Do not use sdk.getDb(orgId).
```

If asked to implement reporting before approval, Claude should stop and request:

```txt
Reporting evidence log
ADR
Approved implementation spec
Data model
API contract
Permission model
Testing matrix
Migration plan
```

---

# 40. Future Implementation Gate

Before Reporting Service implementation begins:

```txt
[ ] Three independent reporting use cases documented
[ ] Evidence log reviewed
[ ] ADR approved
[ ] Reporting Service implementation spec written
[ ] Permission model approved
[ ] API contract approved
[ ] Data model approved
[ ] Export policy approved, if exports are included
[ ] Security test matrix approved
[ ] Performance limits approved
[ ] UI standards approved
[ ] Migration plan approved
```

No implementation should begin before these are complete.

---

# 41. Acceptance Criteria For This Document

This document is acceptable when:

```txt
[ ] It clearly defines Reporting Service as deferred.
[ ] It prevents custom SQL/report sprawl.
[ ] It distinguishes reporting from search, audit, activity, dashboards, and dynamic tables.
[ ] It explains when module-local reports are acceptable.
[ ] It defines the Three Independent Use Cases trigger.
[ ] It requires PlatformContext for all future report execution.
[ ] It forbids client-supplied orgId.
[ ] It requires permission-aware reports and exports.
[ ] It keeps exports, scheduling, AI reports, and advanced BI deferred.
[ ] It prevents Claude from implementing reporting prematurely.
[ ] It preserves the one-platform, many-organizations model.
```

---

# 42. Summary

The Reporting Service is important, but not urgent.

OneDayOS should not build a generic reporting engine before real module patterns exist.

For now, the correct approach is:

```txt
Build clean modules.
Use shared Business Objects.
Use consistent tables.
Use PlatformContext.
Emit clean events.
Implement simple module-local reports only when needed.
Log repeated reporting patterns.
Promote to Reporting Service only after evidence.
```

The first Reporting Service should be simple, tenant-safe, permission-aware, and export-conscious.

It should not become:

```txt
a BI platform
a SQL backdoor
a generic dashboard builder
a custom report dumping ground
a permission bypass
```

Reporting should become a Platform Service only when it strengthens OneDayOS as a reusable Business Operating System.

