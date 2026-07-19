# OneDayOS Engineering Manual — Dynamic CRUD Engine

**Document ID:** `11-dynamic-systems/02-dynamic-crud-engine.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Deferred — Contract Only`  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `08-module-system/00-module-philosophy.md`
- `09-cli-generators/02-crud-generator.md`
- `11-dynamic-systems/00-dynamic-systems-philosophy.md`
- `11-dynamic-systems/04-field-metadata-schema.md`
- `11-dynamic-systems/01-dynamic-form-engine.md`

---

# 1. Purpose

The **Dynamic CRUD Engine** is a future OneDayOS platform capability that may eventually generate standard list, detail, create, edit, delete, restore, filter, search, and export experiences from approved metadata.

Its long-term purpose is to make OneDayOS faster at delivering common internal business software without repeatedly hand-writing the same CRUD patterns for every entity.

The Dynamic CRUD Engine should eventually help OneDayOS deliver:

```txt
Business Object CRUD
Module-owned entity CRUD
Extension-table CRUD
Standard list/detail/create/edit/delete flows
Standard permission checks
Standard tenant-scoped APIs
Standard events
Standard forms
Standard tables
Standard tests
```

However, this document is **not permission to implement the Dynamic CRUD Engine now**.

The Dynamic CRUD Engine is one of the most dangerous abstractions in the platform. If built too early, it will produce a generic admin-template platform instead of a premium Business Operating System.

---

# 2. Implementation Status

```txt
Deferred — Contract Only
```

Claude must not implement the Dynamic CRUD Engine from this document alone.

This document may be used to:

```txt
Define future architecture
Define metadata requirements
Guide hand-coded CRUD consistency
Guide the static CRUD Generator contract
Prevent unsafe dynamic CRUD implementation
Prepare future ADRs
```

This document must not be used to implement:

```txt
Runtime CRUD engine
Metadata-driven route generation
Metadata-driven API execution
Database-stored CRUD definitions
No-code CRUD builder
Admin CRUD builder
Dynamic SQL executor
Automatic Prisma migration generator
Generic custom-field system
Generic table/form runtime
```

---

# 3. Core Principle

```txt
Dynamic CRUD must be extracted from proven OneDayOS patterns.
It must not be invented before those patterns exist.
```

The correct sequence is:

```txt
1. Build Kernel correctly.
2. Build SDK correctly.
3. Build Business Objects correctly.
4. Build Module System correctly.
5. Build secure Module Generator.
6. Hand-code the first real modules.
7. Observe repeated CRUD patterns.
8. Document pain points.
9. Build static generators.
10. Only then consider Dynamic CRUD.
```

The wrong sequence is:

```txt
1. Build a generic CRUD engine.
2. Force every module to fit it.
3. Discover real business workflows do not fit.
4. Patch exceptions everywhere.
5. End up with an unmaintainable admin panel.
```

---

# 4. Why Dynamic CRUD Is Deferred

Dynamic CRUD sounds like the heart of OneDayOS, but implementing it too early creates major risk.

## 4.1 We do not yet know the real repetition

OneDayOS does not yet have enough production module patterns.

Before building a dynamic runtime, we need to see real patterns from modules such as:

```txt
Inventory
Leave
CRM
Purchasing
Expenses
Assets
Visitor Management
Incident Reporting
```

We need to know which CRUD flows are actually repeated, and which flows are domain-specific.

## 4.2 CRUD is not the same as business software

A CRUD engine can create screens, but it cannot automatically understand:

```txt
stock movements
leave approval rules
purchase request lifecycles
customer pipeline stages
expense reimbursement logic
asset assignment history
incident resolution workflow
```

OneDayOS must not reduce modules to generic database tables.

## 4.3 Dynamic CRUD can bypass architecture if built carelessly

A bad Dynamic CRUD Engine may accidentally bypass:

```txt
PlatformContext
tenant isolation
permissions
module enablement
soft delete
server-side validation
Business Object boundaries
event contracts
API response contracts
service-layer rules
```

This would recreate the exact class of risks the restarted architecture is designed to prevent.

## 4.4 Dynamic CRUD can make UI generic

The first generated app already felt like a generic SaaS starter. A premature CRUD engine would make this worse.

The Dynamic CRUD Engine must inherit the OneDayOS design system. It must not produce Bootstrap-style admin tables, bland forms, or generic dashboard cards.

---

# 5. Relationship to Other Systems

## 5.1 Dynamic CRUD vs Static CRUD Generator

The **Static CRUD Generator** produces normal code at development time.

```txt
Input: metadata / CLI prompt
Output: actual TypeScript files, React pages, API routes, services, tests
Runtime: normal code
```

The **Dynamic CRUD Engine** renders and executes CRUD behavior at runtime from metadata.

```txt
Input: approved metadata
Output: runtime UI/API/service behavior
Runtime: dynamic engine
```

Static generator first. Dynamic engine later.

## 5.2 Dynamic CRUD vs Dynamic Form Engine

The Dynamic Form Engine focuses on forms.

```txt
Fields
validation
layout
visibility
relation pickers
form submission behavior
```

The Dynamic CRUD Engine is broader.

```txt
list pages
detail pages
create flows
edit flows
delete / restore flows
filters
sorting
pagination
table actions
forms
API contracts
service execution
permissions
events
```

The Dynamic CRUD Engine may eventually compose the Dynamic Form Engine, but it must not be implemented before form patterns are proven.

## 5.3 Dynamic CRUD vs Dynamic Table View Engine

Dynamic Table Views allow configurable views over known data.

Dynamic CRUD owns the end-to-end CRUD lifecycle.

```txt
Dynamic Table View = how records are displayed
Dynamic CRUD Engine = how records are created, read, updated, deleted, restored, and acted upon
```

## 5.4 Dynamic CRUD vs Business Modules

Dynamic CRUD may help build standard module screens, but it must not replace module services.

Business modules still own:

```txt
business rules
domain workflows
module-owned entities
module-specific events
module-specific permissions
module-specific service logic
```

Dynamic CRUD must not turn modules into thin wrappers around database tables.

## 5.5 Dynamic CRUD vs Platform Services

Dynamic CRUD is a Dynamic System, not a normal Platform Service.

It should not absorb:

```txt
approval workflows
notifications
audit logs
comments
attachments
activity feeds
search
reporting
background jobs
AI
```

Those remain separate services with their own promotion gates.

---

# 6. Required Promotion Gate

Dynamic CRUD may only be considered after all of the following are true:

```txt
[ ] Kernel is production-safe.
[ ] SDK is stable.
[ ] Module system is stable.
[ ] Design system is frozen enough for module work.
[ ] Module Generator is secure-by-default.
[ ] At least three real modules have hand-coded CRUD.
[ ] At least three repeated CRUD patterns are documented.
[ ] Pain is visible and measurable.
[ ] Static CRUD Generator has been considered first.
[ ] Field Metadata contract has been validated by real module code.
[ ] Dynamic Form Engine requirements are clearer.
[ ] Security model has been reviewed.
[ ] ADR is approved.
[ ] Dedicated implementation spec is written.
```

The minimum recommended trigger is:

```txt
Three real modules
+ repeated CRUD shape
+ repeated table/form/API/service/test code
+ clear evidence that static generation is not enough
```

---

# 7. Evidence Log Requirement

Before Dynamic CRUD is proposed, the team must maintain an evidence log.

Example:

```md
# Dynamic CRUD Evidence Log

## Repeated CRUD Pattern: Simple tenant-scoped list/create/edit/delete

### Use Case 1
Module: Inventory
Entity: InventoryProductExtension
Screens: list, create, edit, delete
Pain: repeated table/filter/form/API/service/test code

### Use Case 2
Module: CRM
Entity: LeadSource
Screens: list, create, edit, delete
Pain: same table/form/API pattern

### Use Case 3
Module: Assets
Entity: AssetCategory
Screens: list, create, edit, delete
Pain: same table/form/API pattern

Decision:
Candidate for static CRUD generation first.
Dynamic CRUD still not approved.
```

Dynamic CRUD must not be approved because it feels elegant. It must be approved because repetition has become expensive.

---

# 8. Non-Goals

The Dynamic CRUD Engine is not:

```txt
A no-code app builder
A low-code platform
A database admin panel
A generic SaaS admin dashboard
A replacement for business modules
A replacement for module services
A replacement for Prisma
A replacement for Zod
A replacement for API routes
A replacement for tenant isolation
A replacement for permissions
A replacement for the design system
A replacement for hand-designed workflows
A custom-fields engine
A workflow engine
A report builder
A search engine
An AI app generator
```

The engine must not become a place where architecture is bypassed for convenience.

---

# 9. What Dynamic CRUD May Eventually Handle

A future Dynamic CRUD Engine may handle simple, standard CRUD cases such as:

```txt
List records
View record details
Create record
Edit record
Soft delete record
Restore record
Filter records
Sort records
Paginate records
Basic search within records
Bulk select records
Export records if permitted
Render standard empty/loading/error states
Render standard forms through metadata
Emit standard mutation events
Call approved service adapters
```

Good candidate entities:

```txt
Product categories
Lead sources
Asset categories
Expense categories
Visitor types
Incident categories
Warehouse zones, if later promoted
Simple settings dictionaries
```

Poor candidate entities:

```txt
Stock adjustment
Stock transfer
Leave request
Purchase request
Expense claim
Approval request
Incident investigation
Asset assignment
CRM deal pipeline
```

Reason: poor candidates have lifecycle rules, workflow state, side effects, approvals, event semantics, or business-specific behavior that must be hand-designed first.

---

# 10. What Dynamic CRUD Must Never Handle Automatically

Dynamic CRUD must not automatically handle:

```txt
approvals
payments
inventory quantity changes
stock valuation
payroll
government identifiers
financial posting
destructive bulk actions
cross-tenant access
permission grants
role assignment
module enablement
subscription changes
auth user creation
organization creation
raw SQL
schema migrations
background jobs
AI-generated queries
file uploads
```

These require explicit service design.

---

# 11. Metadata Model — Future Shape

The Dynamic CRUD Engine would require a metadata contract that composes existing metadata types.

A future shape may look like this:

```ts
type CrudDefinition = {
  id: string
  namespace: 'objects' | string
  entity: string
  label: string
  pluralLabel: string
  ownership: 'business-object' | 'module-owned' | 'extension'

  route: CrudRouteDefinition
  api: CrudApiDefinition
  permissions: CrudPermissionDefinition
  fields: FieldMetadata[]
  table: CrudTableDefinition
  form: CrudFormDefinition
  events: CrudEventDefinition
  behavior: CrudBehaviorDefinition
}
```

This is intentionally conceptual. Claude must not implement this type unless explicitly instructed by a future implementation document.

---

# 12. Entity Ownership Metadata

Every CRUD definition must identify ownership.

Allowed ownership types:

```txt
business-object
module-owned
extension
```

## 12.1 Business Object CRUD

Example:

```txt
objects.product
objects.customer
objects.supplier
objects.employee
objects.warehouse
```

Rules:

```txt
permissions use objects.*
events use objects.*
APIs live under /api/orgs/[orgSlug]/objects/...
Business Object services own mutation behavior
modules may consume, not own
```

## 12.2 Module-Owned CRUD

Example:

```txt
inventory.stock_movement
leave.leave_request
crm.deal
expenses.expense_claim
```

Rules:

```txt
permissions use module namespace
events use module namespace
APIs live under /api/orgs/[orgSlug]/[moduleId]/...
module services own mutation behavior
```

## 12.3 Extension CRUD

Example:

```txt
inventory.product_extension
purchasing.supplier_extension
crm.customer_extension
```

Rules:

```txt
extension table includes orgId
extension references Business Object tenant-safely
permissions may require both objects.* and module.*
transaction belongs in service layer
Business Object event and module event remain separate
```

---

# 13. Tenant Isolation Requirements

Dynamic CRUD must be tenant-safe by construction.

Hard rules:

```txt
Dynamic CRUD must use verified PlatformContext.
Dynamic CRUD must never accept client-supplied orgId.
Dynamic CRUD must never expose orgId as a field.
Dynamic CRUD must never use sdk.getDb(orgId).
Dynamic CRUD must use sdk.getDb(ctx).
Dynamic CRUD must validate orgSlug through Kernel context helpers.
Dynamic CRUD must scope all tenant-scoped queries by ctx.org.id.
Dynamic CRUD must exclude soft-deleted records by default.
```

Forbidden examples:

```ts
const orgId = body.orgId
const orgId = searchParams.get('orgId')
sdk.getDb(orgId)
where: { id }
findUnique({ where: { id } })
```

Required pattern:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, moduleId)
const db = sdk.getDb(ctx)
```

---

# 14. Authorization Requirements

Dynamic CRUD must enforce authorization in at least three places:

```txt
API route wrapper
CRUD service adapter
UI visibility
```

UI visibility is not security. APIs and services remain authoritative.

Every CRUD action must map to an explicit permission requirement.

Example:

```ts
type CrudPermissionDefinition = {
  list: PermissionRequirement
  read: PermissionRequirement
  create: PermissionRequirement
  update: PermissionRequirement
  delete: PermissionRequirement
  restore?: PermissionRequirement
  export?: PermissionRequirement
}
```

Example permissions:

```txt
objects.product.read
objects.product.create
objects.product.update
objects.product.delete
objects.product.restore
inventory.stock_adjustment.read
inventory.stock_adjustment.create
```

Wildcard Admin permissions may satisfy permission checks, but they never bypass:

```txt
authentication
tenant membership
module enablement
soft delete rules
validation
```

---

# 15. Module Enablement Requirements

For module-owned CRUD, module enablement is required.

Example:

```txt
/api/orgs/acme/inventory/stock-adjustments
```

This route must verify:

```txt
user is authenticated
user belongs to acme
inventory module is enabled for acme
user has required inventory permission
```

Business Object CRUD may exist outside a module, but UI exposure may still depend on enabled modules or platform navigation decisions.

Example:

```txt
Product is a Business Object.
Inventory may expose Product pages.
Purchasing may expose Product selection.
Product itself is not owned by Inventory.
```

---

# 16. API Requirements

Dynamic CRUD APIs must follow the Kernel API contract.

Required response shape:

```json
{
  "data": null,
  "error": null,
  "meta": {}
}
```

APIs must return JSON only.

Forbidden:

```txt
redirects from API routes
HTML error pages
unhandled thrown errors to client
raw Zod errors without normalization
raw Prisma errors
stack traces
```

Required API route families may eventually include:

```txt
GET    /api/orgs/[orgSlug]/objects/[entity]
POST   /api/orgs/[orgSlug]/objects/[entity]
GET    /api/orgs/[orgSlug]/objects/[entity]/[id]
PATCH  /api/orgs/[orgSlug]/objects/[entity]/[id]
DELETE /api/orgs/[orgSlug]/objects/[entity]/[id]
POST   /api/orgs/[orgSlug]/objects/[entity]/[id]/restore

GET    /api/orgs/[orgSlug]/[moduleId]/[resource]
POST   /api/orgs/[orgSlug]/[moduleId]/[resource]
GET    /api/orgs/[orgSlug]/[moduleId]/[resource]/[id]
PATCH  /api/orgs/[orgSlug]/[moduleId]/[resource]/[id]
DELETE /api/orgs/[orgSlug]/[moduleId]/[resource]/[id]
POST   /api/orgs/[orgSlug]/[moduleId]/[resource]/[id]/restore
```

But these must not be implemented dynamically until a future implementation document approves it.

---

# 17. Service Layer Requirements

Dynamic CRUD must not directly mutate the database from UI metadata.

There must be a service adapter boundary.

A future pattern may look like:

```ts
type CrudServiceAdapter<TCreate, TUpdate> = {
  list(ctx: PlatformContext, query: ListQuery): Promise<ListResult>
  get(ctx: PlatformContext, id: string): Promise<RecordResult>
  create(ctx: PlatformContext, input: TCreate): Promise<RecordResult>
  update(ctx: PlatformContext, id: string, input: TUpdate): Promise<RecordResult>
  delete(ctx: PlatformContext, id: string): Promise<void>
  restore?(ctx: PlatformContext, id: string): Promise<RecordResult>
}
```

This preserves business rules.

Dynamic CRUD should orchestrate standard behavior. It should not become the owner of every domain rule.

---

# 18. Validation Requirements

Dynamic CRUD must use Zod-backed validation.

Rules:

```txt
Server validation is authoritative.
Client validation is UX only.
Body schemas use z.strictObject() by default.
Unknown keys are rejected.
Client-supplied orgId is rejected.
Route params are validated.
Query strings are validated.
Relation IDs are revalidated server-side.
```

The engine must not infer validation from UI metadata alone unless a future ADR explicitly approves safe metadata-to-Zod generation.

Until then, generated or dynamic CRUD must use explicit server schemas.

---

# 19. Soft Delete Requirements

Dynamic CRUD delete must mean soft delete by default.

Rules:

```txt
delete sets deletedAt and deletedBy
normal reads exclude deleted records
restore clears deletedAt and deletedBy
hard delete is forbidden for business records
soft-deleted records appear as not found in normal APIs
admin/restore paths require explicit permission
```

The engine must not rely only on Prisma `$extends` for soft-delete correctness.

Services and tests must prove the behavior.

---

# 20. Event Requirements

Dynamic CRUD mutations must emit events through the SDK.

Business Object events:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored
```

Module-owned events:

```txt
inventory.stock_movement.created
crm.deal.updated
expenses.expense_claim.deleted
```

Rules:

```txt
events are emitted by services, not UI components
events use PlatformContext
event payloads do not include orgId
event payloads do not include full Prisma records
event payloads include stable identifiers and changedFields where needed
failed mutations do not emit events
```

---

# 21. Table Requirements

Dynamic CRUD list views must inherit OneDayOS table standards.

Minimum future table features:

```txt
premium data-dense design
server-side pagination when needed
safe sorting
safe filters
empty state
loading state
error state
row actions
bulk selection only when approved
permission-aware actions
keyboard-friendly interactions
mobile-aware behavior
```

Tables must not become generic admin-table dumps.

Every column must be intentionally exposed.

Sensitive fields must be opt-in, never automatic.

---

# 22. Form Requirements

Dynamic CRUD create/edit flows must eventually compose the Dynamic Form Engine.

Rules:

```txt
forms never include orgId fields
hidden fields are not security
server validation remains authoritative
relation pickers are tenant-scoped
relation IDs are revalidated server-side
permission checks happen before mutation
services own transactions and events
```

Dynamic CRUD must not create forms directly from raw database schema.

Database schema is not UX design.

---

# 23. Detail Page Requirements

A future Dynamic CRUD detail page may include:

```txt
record title
key fields
metadata
related records
module-specific actions
edit/delete/restore actions
empty relation states
future activity timeline slot
future comments slot
future attachments slot
```

But it must not automatically show every field.

The detail view must be metadata-controlled, permission-aware, and design-system compliant.

---

# 24. Search, Filtering, and Export Requirements

Dynamic CRUD may support local entity search/filtering later.

It must not become global Search Service.

Rules:

```txt
filters are defined by metadata
only filterable fields may be filtered
only sortable fields may be sorted
only exportable fields may be exported
sensitive fields are excluded by default
export requires explicit permission
query strings are validated
raw SQL is forbidden
```

Global cross-module search remains deferred to Search Service.

Reporting remains separate.

---

# 25. Import Requirements

Dynamic CRUD must not implement import automatically.

Import is a separate high-risk capability because it involves:

```txt
bulk validation
partial failures
duplicate detection
tenant-safe relation mapping
background jobs
rollback strategy
audit/event behavior
user-facing error reports
```

Import belongs to the future Import/Export Engine, not initial Dynamic CRUD.

---

# 26. AI Requirements

Dynamic CRUD must not allow AI to generate or execute CRUD metadata directly in production.

Future AI-assisted CRUD may help draft metadata, but it must require:

```txt
human review
schema validation
permission review
security tests
manual approval
```

AI must never bypass:

```txt
PlatformContext
permissions
module enablement
server validation
service-layer rules
tenant isolation
```

---

# 27. Database Requirements

Dynamic CRUD must not create or modify database schema at runtime.

Forbidden:

```txt
metadata creates Prisma models
metadata runs migrations
metadata creates tables
metadata adds columns
metadata creates indexes
metadata executes raw SQL
metadata stores arbitrary custom fields JSON for MVP
```

Database schema changes remain:

```txt
manual design
Prisma migration
reviewed migration file
staging verification
production deploy process
```

---

# 28. Runtime Storage of Metadata

For the first future implementation, metadata should probably be static TypeScript, not database-stored.

Preferred future initial approach:

```txt
src/objects/product/crud-definition.ts
src/modules/inventory/crud/stock-adjustment.crud.ts
```

Deferred:

```txt
DB-stored CRUD definitions
admin-editable CRUD metadata
client-editable CRUD metadata
runtime-created entities
custom tables per client
```

Reason: static TypeScript gives type safety, code review, Git history, and easier testing.

---

# 29. Security Anti-Patterns

The following are forbidden:

```txt
CRUD engine accepts orgId from request body
CRUD engine accepts orgId from query string
CRUD engine uses sdk.getDb(orgId)
CRUD engine uses raw Prisma from module code
CRUD engine exposes all model fields automatically
CRUD engine lets clients choose model/table names
CRUD engine lets clients choose arbitrary filters without validation
CRUD engine executes raw SQL
CRUD engine performs hard deletes
CRUD engine bypasses service-layer permissions
CRUD engine treats hidden fields as secure
CRUD engine uses frontend-only permission checks
CRUD engine returns full Prisma records
CRUD engine includes soft-deleted data by default
CRUD engine generates events with orgId in payload
CRUD engine allows module-to-module imports
CRUD engine creates Business Object duplicates
```

---

# 30. Design Anti-Patterns

The following are also forbidden:

```txt
generic admin dashboards
unbranded table dumps
unstyled forms
random card grids
Bootstrap-like layouts
inconsistent button placement
unexplained empty states
spinner-only loading states
unhelpful validation messages
too many fields on one screen
forms generated directly from DB schema
```

Dynamic CRUD must feel like OneDayOS, not like a database admin tool.

---

# 31. Testing Requirements

A future Dynamic CRUD Engine must include tests for:

```txt
tenant isolation with at least two organizations
wrong-org access denial
client-supplied orgId rejection
module-disabled behavior
permission denial
Admin wildcard behavior
non-admin behavior
validation errors
unknown key rejection
soft delete behavior
restore behavior
event emission on success
event non-emission on failure
sensitive field exclusion
export permission checks
filter validation
sort validation
forbidden raw Prisma usage
forbidden sdk.getDb(orgId) usage
forbidden @/kernel imports from modules
```

Dynamic CRUD without security tests is not allowed.

---

# 32. First Future Implementation Scope

If Dynamic CRUD is approved later, the first implementation should be narrow.

Recommended first scope:

```txt
Static TypeScript CRUD definitions only
One Business Object candidate
One module-owned simple dictionary entity
List page
Create form
Edit form
Soft delete
Restore optional
Server-side validation
Permission checks
Events
Tests
No import
No export
No reporting
No global search
No DB-stored metadata
No custom fields
No runtime schema editing
```

Good first candidate:

```txt
ProductCategory
```

Reason:

```txt
simple entity
Business Object adjacent
tenant-scoped
soft-deletable
low workflow complexity
useful for Inventory and Purchasing later
```

Bad first candidate:

```txt
StockMovement
LeaveRequest
PurchaseRequest
ExpenseClaim
```

Reason: those contain business workflows, lifecycle rules, and side effects.

---

# 33. Migration Strategy From Hand-Coded CRUD

If hand-coded CRUD already exists, migration to Dynamic CRUD must be gradual.

Process:

```txt
1. Identify candidate CRUD screen.
2. Write matching CRUD definition.
3. Run behavior tests against old implementation.
4. Build dynamic implementation behind feature flag.
5. Compare UI behavior and API behavior.
6. Run tenant and permission regression tests.
7. Switch one internal/demo org first.
8. Monitor.
9. Roll out to more orgs.
10. Remove old code only after confidence.
```

No big-bang migration.

---

# 34. Relationship to One-Day Delivery

Dynamic CRUD can eventually support one-day delivery by reducing repetitive implementation work.

But if built too early, it will slow OneDayOS down because every real workflow will require engine exceptions.

The platform should first win through:

```txt
clear architecture
secure generators
shared Business Objects
module reuse
strong design system
repeatable service patterns
```

Dynamic CRUD is an accelerator later, not the foundation now.

---

# 35. Claude Implementation Rules

Claude must follow these rules:

```txt
Do not implement Dynamic CRUD now.
Do not create runtime CRUD engine files.
Do not create metadata-driven API execution.
Do not create DB-stored CRUD definitions.
Do not create custom-fields system.
Do not create generic admin UI.
Do not generate raw Prisma CRUD bypassing services.
Do not implement FastAPI/Python backend for CRUD.
Do not add new dependencies for Dynamic CRUD.
Do not create no-code builder UI.
Do not treat this document as an implementation ticket.
```

Claude may use this document only to:

```txt
keep hand-coded CRUD consistent
avoid unsafe generator behavior
prepare future proposals
understand why Dynamic CRUD is deferred
```

---

# 36. Future ADR Required

Before implementation, create an ADR:

```txt
ADR: Dynamic CRUD Engine First Implementation

Context:
- Which repeated patterns exist?
- Which modules prove the need?
- Why static generation is insufficient?

Decision:
- What narrow scope is approved?

Alternatives considered:
- Continue hand-coded CRUD
- Use static CRUD Generator
- Improve Module Generator
- Build Dynamic Form Engine first

Consequences:
- Security risk
- UX risk
- Testing burden
- Migration burden

Acceptance criteria:
- Tenant isolation tests
- Permission tests
- Validation tests
- Soft-delete tests
- Event tests
- Design review
```

No ADR, no implementation.

---

# 37. Acceptance Criteria for This Document

This document is acceptable if:

```txt
[ ] It clearly says Dynamic CRUD is deferred.
[ ] It distinguishes Dynamic CRUD from static CRUD generation.
[ ] It protects PlatformContext and tenant isolation.
[ ] It forbids client-supplied orgId.
[ ] It requires permission enforcement.
[ ] It requires soft delete.
[ ] It requires server-side validation.
[ ] It requires service-layer behavior.
[ ] It prevents database-schema generation at runtime.
[ ] It protects Business Object boundaries.
[ ] It keeps design quality as a requirement.
[ ] It gives Claude clear non-implementation rules.
```

---

# 38. Final Position

The Dynamic CRUD Engine is strategically important but tactically dangerous.

OneDayOS should absolutely become faster than bespoke app development. But the path is not to build a generic CRUD engine first.

The correct path is:

```txt
Platform first.
Security first.
Design system first.
SDK first.
Business Objects first.
Module system first.
Generators first.
Real modules first.
Dynamic systems later.
```

Dynamic CRUD should be built only when OneDayOS has enough real module evidence to know what it is abstracting.

Until then:

```txt
Hand-code critical workflows.
Generate boring scaffolding safely.
Document repeated patterns.
Promote only when the abstraction is obvious.
```

