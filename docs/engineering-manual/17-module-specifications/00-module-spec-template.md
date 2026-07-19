# OneDayOS Engineering Manual — Module Specification Template

**Document ID:** `17-module-specifications/00-module-spec-template.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Any Official Module Implementation  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
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
- `05-sdk/*`
- `06-data/*`
- `07-business-objects/*`
- `08-module-system/*`
- `09-cli-generators/*`
- `13-security/*`
- `14-testing-quality/*`

---

# 1. Purpose

This document defines the required template for every OneDayOS business module specification.

A module specification is not a feature brief.

A module specification is not a loose product idea.

A module specification is not a prompt for Claude to “build an app.”

A module specification is an implementation-grade contract that tells Claude, engineers, and future maintainers exactly what a module is allowed to contain, what it must reuse, what it must not duplicate, how it behaves, how it is tested, and how it fits inside the OneDayOS platform.

Every official module must have a module specification before implementation begins.

Examples:

```txt
Inventory Module
Leave Module
CRM Module
Purchasing Module
Expenses Module
Assets Module
Visitor Management Module
Incident Reporting Module
Fleet Module
Reservations Module
```

The goal is repeatability.

A senior engineer or Claude Code should be able to implement a module from a frozen module specification without making new architectural decisions.

---

# 2. Core Rule

```txt
No module implementation without a module specification.
```

A module may start as a draft for one client, but even a one-client draft module must follow the module specification template.

A module may be commercially experimental.

A module may be enabled for only one organization.

A module may be incomplete.

But it must still follow the OneDayOS architecture.

The module specification prevents this failure mode:

```txt
Client asks for workflow
→ Claude builds random CRUD
→ module duplicates Business Objects
→ API trusts orgId
→ permissions are missing
→ tests are weak
→ module cannot be reused
→ OneDayOS becomes a custom app shop
```

Instead, the module specification creates this workflow:

```txt
Client asks for workflow
→ request is classified
→ module spec is written
→ module boundaries are clear
→ Business Objects are reused
→ extension tables are defined
→ permissions are declared
→ APIs and services are scoped
→ tests are required
→ Claude implements from the spec
→ module becomes reusable
```

---

# 3. What a Module Specification Must Decide

A module specification must settle these questions before implementation:

```txt
What business capability does this module provide?
What is explicitly out of scope?
Which shared Business Objects does it use?
Which entities does the module own?
What extension tables does it need?
What permissions exist?
What pages exist?
What APIs exist?
What services exist?
What events are emitted?
What events are listened to?
What settings exist?
What reports or dashboards exist?
What data is seeded?
What tests are required?
What implementation steps should Claude follow?
What must not be built yet?
```

If a module specification does not answer these, Claude will answer them implicitly during implementation.

That is not allowed.

Claude implements architecture.

Claude does not invent architecture.

---

# 4. Module Specification Status System

Every module specification must use one of these statuses:

| Status | Meaning | Claude Implementation Allowed? |
|---|---|---:|
| `Draft` | Being written. Founder/architect review required. | No |
| `Review` | Ready for architectural review. | No |
| `Frozen` | Approved for implementation. | Yes |
| `Amended` | Frozen document with approved changes. | Yes, with amendment scope |
| `Superseded` | Replaced by newer module spec. | No |
| `Deferred` | Intentionally not implemented. | No |

A module specification must not be implemented until its status is `Frozen` or `Amended`.

---

# 5. Module Lifecycle

Modules should use this lifecycle:

```txt
draft
  ↓
internal
  ↓
beta
  ↓
stable
  ↓
deprecated
  ↓
retired
```

## 5.1 Draft Module

A draft module may exist for a first client or first internal proof.

Allowed:

```txt
Enabled for one organization
Incomplete reporting
Limited settings
Limited workflows
Extra founder review
```

Not allowed:

```txt
Tenant isolation shortcuts
Permission shortcuts
Client-specific forks
Duplicate Business Objects
Raw Prisma in module code
Direct module-to-module imports
Client-supplied orgId
Missing tests
```

## 5.2 Internal Module

An internal module is used by OneDayOS or demo organizations but not sold broadly.

## 5.3 Beta Module

A beta module may be used by paying clients with disclosed limitations.

A beta module must have:

```txt
Tenant isolation tests
Permission denial tests
Basic AppCare support plan
Known limitations listed
Migration safety reviewed
```

## 5.4 Stable Module

A stable module is an official reusable OneDayOS module.

A stable module must have:

```txt
Frozen module specification
Complete core workflows
Tests passing
Security tests passing
UI standards met
Handover/training docs
Support boundaries
Versioning rules
```

## 5.5 Deprecated / Retired Module

Deprecation and retirement require founder/architect approval, migration planning, and client communication.

---

# 6. Module Specification File Naming

Module specs should live under:

```txt
docs/engineering-manual/17-module-specifications/
```

Use this naming pattern:

```txt
00-module-spec-template.md
01-inventory-module.md
02-leave-module.md
03-crm-module.md
04-purchasing-module.md
05-expenses-module.md
06-assets-module.md
07-visitor-management-module.md
08-incident-reporting-module.md
09-fleet-module.md
```

If a module starts as a one-client draft, still use a clean module name:

```txt
09-fleet-module.md
```

Do not use client-specific names:

```txt
❌ 09-acme-trucking-custom-module.md
❌ 09-client-a-special-workflow.md
❌ 09-bobs-inventory-hack.md
```

Client-specific requirements belong in a client delivery brief, not the module specification.

---

# 7. Required Module Specification Template

Every module specification must follow this structure.

```md
# OneDayOS Engineering Manual — [Module Name] Module Specification

**Document ID:** `17-module-specifications/[module-file].md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Not Allowed Until Frozen  
**Module ID:** `[module_id]`  
**Module Label:** `[Human Label]`  
**Lifecycle:** draft | internal | beta | stable | deprecated | retired  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Depends On:**

- `[relevant manual docs]`

---

# 1. Purpose
# 2. Non-Goals
# 3. Business Fit
# 4. User Roles and Personas
# 5. Business Workflows
# 6. Business Objects Used
# 7. Module-Owned Entities
# 8. Extension Tables
# 9. Permissions
# 10. Routes and Pages
# 11. API Contracts
# 12. Services
# 13. Events Emitted
# 14. Events Listened To
# 15. Settings and Configuration
# 16. Navigation
# 17. UI Requirements
# 18. Forms
# 19. Tables
# 20. Dashboards and Reports
# 21. Imports and Exports
# 22. AI Context
# 23. Seed and Provisioning
# 24. Security Requirements
# 25. Testing Requirements
# 26. Module Manifest Requirements
# 27. Generator Requirements
# 28. Implementation Plan for Claude
# 29. Acceptance Criteria
# 30. Deferred Features
# 31. Open Questions
```

Each section is defined below.

---

# 8. Section-by-Section Requirements

## 8.1 Purpose

The purpose section explains what the module does in plain business language.

It must answer:

```txt
What business problem does this module solve?
Who uses it?
What is the main value?
Why does this belong as a OneDayOS module?
```

Example:

```md
The Inventory Module helps SMEs track products, warehouses, stock levels,
and stock movements across locations. It provides a standard foundation for
stock visibility and inventory adjustments without creating client-specific
inventory apps.
```

Bad purpose:

```md
Build inventory CRUD.
```

Reason: CRUD is not the business purpose.

---

## 8.2 Non-Goals

The non-goals section is mandatory.

It prevents scope creep.

It must explicitly list what the module will not do in the first implementation.

Example for Inventory:

```txt
No accounting valuation engine.
No barcode scanning in MVP.
No serial/lot tracking in MVP.
No expiry tracking in MVP.
No purchase order workflow in Inventory.
No approval engine.
No file attachments.
No AI stock forecasting.
```

Non-goals are especially important because clients often ask for features that sound related but belong elsewhere.

---

## 8.3 Business Fit

This section explains when the module is a good fit and when it is not.

It must include:

```txt
Good-fit clients
Bad-fit clients
One-day delivery fit
Premium/custom scope triggers
High-risk cases
```

Example:

```txt
Good fit:
- Small distributor tracking stock by warehouse.
- Retail shop tracking basic product quantities.
- Service company tracking spare parts.

Bad fit:
- Manufacturing company requiring BOM and production planning.
- Pharmaceutical inventory needing expiry/lot compliance.
- Enterprise warehouse needing barcode scanners and WMS automation.
```

This helps sales and discovery avoid overpromising.

---

## 8.4 User Roles and Personas

This section identifies expected users.

Example:

```txt
Business owner
Operations manager
Warehouse staff
Purchasing staff
Viewer / auditor
```

For each persona, define:

```txt
What they need to see
What they need to do
What they must not be able to do
What permissions they likely need
```

This section guides UI, permissions, and training.

---

## 8.5 Business Workflows

This section defines the workflows the module supports.

Each workflow must be written as a business process, not a list of screens.

Example format:

```md
## Workflow: Stock Adjustment

### Purpose
Correct product quantity when physical count differs from system count.

### Actors
- Operations Manager
- Warehouse Staff

### Preconditions
- Product exists.
- Warehouse exists.
- User has `inventory.stock_adjustment.create`.

### Steps
1. User selects warehouse.
2. User selects product.
3. User enters adjustment quantity.
4. User enters reason.
5. System validates product and warehouse belong to same org.
6. System creates stock movement.
7. System updates stock balance.
8. System emits `inventory.stock_adjustment.created`.

### Postconditions
- Stock balance reflects adjustment.
- Stock movement history is preserved.
- Event is emitted.

### Failure Cases
- Product not found.
- Warehouse not found.
- User lacks permission.
- Adjustment would create invalid state.
```

Workflows are more important than CRUD.

A module with only CRUD is usually incomplete.

---

## 8.6 Business Objects Used

This section lists shared Business Objects the module uses.

Examples:

```txt
Product
ProductCategory
Employee
Customer
Supplier
Warehouse
```

For each Business Object, specify:

```txt
How the module uses it
Whether the module reads it
Whether the module creates it
Whether the module updates it
Whether the module extends it
What permissions are needed
```

Example:

```md
## Product

The Inventory Module uses Product as the shared item identity.
Inventory does not own Product.
Inventory may create Product through the Business Object service if the user has
`objects.product.create` and the workflow requires product creation.
Inventory-specific product fields belong in `InventoryProductExtension`.
```

Required anti-duplication statement:

```txt
This module must not create duplicate Business Object tables such as
InventoryProduct, CRMCustomer, LeaveEmployee, or PurchasingSupplier unless they
are explicitly defined as extension or junction tables.
```

---

## 8.7 Module-Owned Entities

This section defines records owned by the module.

A module-owned entity is a domain object that belongs specifically to this module.

Examples:

```txt
Inventory owns StockBalance.
Inventory owns StockMovement.
Inventory owns StockAdjustment.
Leave owns LeaveRequest.
CRM owns Deal.
Purchasing owns PurchaseRequest.
Expenses owns ExpenseClaim.
Fleet owns Vehicle.
```

For each module-owned entity, define:

```txt
Purpose
Fields
Tenant scope
Relations
Unique constraints
Soft delete behavior
Events
Permissions
Indexes
```

Example:

```md
## Entity: StockMovement

### Purpose
Immutable record of inventory quantity movement.

### Ownership
Owned by Inventory Module.

### Tenant Scope
Must include `orgId`.

### Required Fields
- id
- orgId
- productId
- warehouseId
- movementType
- quantity
- occurredAt
- sourceType
- sourceId
- createdBy
- createdAt

### Deletion Policy
StockMovement is immutable and should not be soft-deleted in normal workflows.
Corrections must be represented by reversing movements.
```

Do not define Prisma models casually.

Every module-owned entity should justify why it exists.

---

## 8.8 Extension Tables

If the module adds module-specific fields to a Business Object, define extension tables.

Example:

```txt
InventoryProductExtension
PurchasingSupplierExtension
CRMCustomerExtension
```

For each extension table, define:

```txt
Which Business Object it extends
Whether it is one-to-one or one-to-many
Required fields
Permissions
Events
Soft delete behavior
Creation workflow
Update workflow
```

Required rule:

```txt
Extension tables must include `orgId` and must reference the Business Object in a tenant-safe way.
```

Example:

```md
## InventoryProductExtension

Extends: Product  
Relationship: one-to-one per org/product  
Purpose: Stores inventory-specific product settings.

Fields:
- id
- orgId
- productId
- reorderPoint
- minimumStock
- preferredWarehouseId
- createdAt
- updatedAt
- deletedAt
- deletedBy

Rules:
- Product remains the shared Business Object.
- This table must not duplicate Product name, code, category, or unit.
- Service must validate Product belongs to ctx.org.id.
```

---

## 8.9 Permissions

This section defines all permissions used by the module.

Permissions must use the OneDayOS permission shape:

```ts
type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Module-owned permissions use the module namespace:

```txt
inventory.stock_balance.read
inventory.stock_adjustment.create
inventory.stock_adjustment.approve
inventory.stock_movement.read
```

Business Object permissions use the `objects` namespace:

```txt
objects.product.read
objects.product.create
objects.warehouse.read
objects.supplier.read
```

The module spec must separate:

```txt
Business Object permissions
Module-owned entity permissions
Extension-table permissions
Import permissions
Export permissions
Admin/configuration permissions
```

Required rules:

```txt
Read is not export.
Create is not import.
Approve is not assignment.
Module enablement is not permission.
Admin wildcard does not bypass tenant isolation.
```

Example permission table:

| Permission | Purpose | Used By |
|---|---|---|
| `inventory.stock_balance.read` | View stock balances | Stock levels page |
| `inventory.stock_adjustment.create` | Create adjustment | New adjustment form/API/service |
| `inventory.stock_adjustment.approve` | Approve adjustment if approval is module-local | Approval workflow |
| `inventory.stock_movement.read` | View movement history | Movement table |
| `inventory.stock_balance.export` | Export stock levels | Export action |

---

## 8.10 Routes and Pages

This section defines UI routes.

Module pages must live under:

```txt
/[orgSlug]/[moduleId]/...
```

Example:

```txt
/[orgSlug]/inventory
/[orgSlug]/inventory/stock-levels
/[orgSlug]/inventory/adjustments
/[orgSlug]/inventory/adjustments/new
/[orgSlug]/inventory/movements
/[orgSlug]/inventory/settings
```

For every page, define:

```txt
Route
Purpose
Server or client component split
Required module enablement
Required permission
Data loaded server-side
Client interactions
Empty state
Error state
Loading state
```

Example:

| Route | Purpose | Permission |
|---|---|---|
| `/[orgSlug]/inventory` | Inventory dashboard | `inventory.stock_balance.read` |
| `/[orgSlug]/inventory/stock-levels` | Stock balance table | `inventory.stock_balance.read` |
| `/[orgSlug]/inventory/adjustments/new` | Create adjustment | `inventory.stock_adjustment.create` |

Required rule:

```txt
Pages may hide UI based on permission, but APIs and services remain the security boundary.
```

---

## 8.11 API Contracts

This section defines API routes.

Module APIs must live under:

```txt
/api/orgs/[orgSlug]/[moduleId]/...
```

Example:

```txt
GET  /api/orgs/[orgSlug]/inventory/stock-levels
POST /api/orgs/[orgSlug]/inventory/adjustments
GET  /api/orgs/[orgSlug]/inventory/movements
```

For every API route, define:

```txt
HTTP method
Path
Purpose
Auth requirement
Module enablement requirement
Permission requirement
Request params schema
Request query schema
Request body schema
Response shape
Events emitted
Errors
Tests
```

All API responses must use:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: Record<string, unknown>
}
```

APIs must return JSON only.

APIs must never redirect.

Required API errors:

```txt
401 UNAUTHENTICATED
403 FORBIDDEN
404 ORG_NOT_FOUND or MODULE_NOT_FOUND or RECORD_NOT_FOUND
400 VALIDATION_ERROR
409 CONFLICT
500 INTERNAL_ERROR
```

Required rule:

```txt
Client-supplied `orgId` is rejected.
```

---

## 8.12 Services

This section defines service methods.

Module services contain business logic.

Services must receive verified `PlatformContext`.

Example:

```ts
InventoryService.createStockAdjustment(ctx, input)
```

Not allowed:

```ts
InventoryService.createStockAdjustment(orgId, input)
InventoryService.createStockAdjustment(userId, orgId, input)
InventoryService.createStockAdjustment(inputWithOrgId)
```

For each service method, define:

```txt
Method name
Purpose
Input schema
Permission required
Business Object relations
Transaction behavior
Events emitted
Soft delete behavior
Failure cases
Tests
```

Example:

```md
## Service: createStockAdjustment(ctx, input)

### Permission
`inventory.stock_adjustment.create`

### Steps
1. Verify permission.
2. Validate product belongs to ctx.org.id.
3. Validate warehouse belongs to ctx.org.id.
4. Create StockAdjustment.
5. Create StockMovement.
6. Update StockBalance.
7. Emit `inventory.stock_adjustment.created`.

### Transaction
Steps 4, 5, and 6 must happen in one transaction.

### Events
Emit after successful transaction.
```

Required rule:

```txt
During MVP, public service methods must enforce permissions internally.
```

This prevents an API route from forgetting permission checks and still calling the service.

---

## 8.13 Events Emitted

This section lists all events emitted by the module.

Events must follow:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Module-owned events use the module ID:

```txt
inventory.stock_adjustment.created
inventory.stock_movement.created
inventory.stock_level.reorder_threshold_crossed
```

Business Object events use `objects.*`:

```txt
objects.product.created
objects.product.updated
objects.warehouse.created
```

Do not use command events:

```txt
❌ inventory.send_notification
❌ inventory.create_stock_movement
❌ notify.user
```

Events are facts, not commands.

For each event, define:

```txt
Event name
When emitted
Payload schema
Sensitive fields excluded
Whether listener failures affect mutation
Future consumers
Tests
```

Payloads must not include:

```txt
orgId
full Prisma records
secrets
full customer/person data
large nested objects
```

The event envelope already carries tenant context internally.

---

## 8.14 Events Listened To

If the module listens to events, define:

```txt
Event name
Source namespace
Why this module listens
Handler behavior
Whether the listening module must be enabled
Idempotency rules
Failure behavior
Tests
```

Required rule:

```txt
Listening to another module's events does not allow importing that module.
```

Listeners must not be used for correctness-critical same-transaction behavior.

If the original business operation depends on a side effect succeeding, it belongs in the service transaction, not an async/event listener.

---

## 8.15 Settings and Configuration

This section defines module settings.

Settings must be org-scoped.

Example:

```txt
inventory.defaultWarehouseId
inventory.allowNegativeStock
inventory.adjustmentRequiresReason
inventory.lowStockThresholdMode
```

For each setting, define:

```txt
Key
Type
Default value
Validation schema
Who can edit it
Effect
Whether changing it affects historical data
```

Settings must not contain secrets.

Settings must not become a custom-code system.

Required rule:

```txt
The Setting table is configuration, not a secret store and not a custom-field system.
```

---

## 8.16 Navigation

This section defines module navigation.

Navigation must align with the module manifest.

For each nav item, define:

```txt
Label
Href relative to org shell
Icon
Required permission
Empty state behavior
```

Example:

```txt
Inventory
  /inventory
  permission: inventory.stock_balance.read

Stock Levels
  /inventory/stock-levels
  permission: inventory.stock_balance.read

Adjustments
  /inventory/adjustments
  permission: inventory.stock_adjustment.read
```

Navigation visibility requires:

```txt
authenticated user
verified tenant membership
module enabled
permission granted
```

Hidden navigation is not security.

---

## 8.17 UI Requirements

This section defines module-specific UI rules.

It must reference the Design System once available.

For now, every module must follow these base UI principles:

```txt
Minimal
Premium
Fast
Data-dense
Keyboard-friendly
Consistent with app shell
Beautiful empty states
Beautiful loading states
Clear error states
No generic Bootstrap/admin-dashboard feel
```

For each major screen, define:

```txt
Page title
Primary action
Secondary actions
Table or form layout
Empty state
Loading state
Error state
Permission-denied state
Mobile behavior
Keyboard behavior
```

Required rule:

```txt
Module UI must not invent a separate visual language.
```

---

## 8.18 Forms

This section defines forms.

For each form, define:

```txt
Form name
Route/location
Fields
Required fields
Validation rules
Help text/tooltips
Relation fields
Default values
Submit behavior
Optimistic behavior if applicable
Permission required
API endpoint
Server validation
Events emitted by service
Tests
```

Required rules:

```txt
Forms must never include hidden orgId fields.
Forms submit business input only.
Server validation is authoritative.
Relation IDs must be revalidated server-side.
```

Example:

```md
## Form: New Stock Adjustment

Fields:
- warehouseId: relation to Warehouse, required
- productId: relation to Product, required
- quantityDelta: number, required, non-zero
- reason: text, required

Not included:
- orgId
- userId
- stockBalanceId

Server derives:
- orgId from PlatformContext
- createdBy from PlatformContext
```

---

## 8.19 Tables

This section defines module tables.

For each table, define:

```txt
Table name
Page route
Data source
Columns
Default sort
Filters
Search behavior
Row actions
Bulk actions
Empty state
Loading state
Pagination
Permission requirements
Export permission if export exists
```

Required rules:

```txt
Tables exclude soft-deleted records by default.
Export requires explicit export permission.
Sensitive fields are opt-in.
Client must not send raw Prisma filters or raw SQL.
```

Dynamic Table View Engine is deferred.

Saved views are deferred unless explicitly approved.

---

## 8.20 Dashboards and Reports

This section defines dashboards and reports.

For each widget/report, define:

```txt
Purpose
Data source
Permission required
Module enablement required
Included records
Excluded records
Soft-delete behavior
Export behavior
Caching/deferred behavior
```

Required rules:

```txt
Dashboard widgets must not bypass permissions.
Reporting Service is deferred.
Cross-module reports require founder/architect approval.
```

Simple module-local summaries are allowed.

Generic Reporting Service is deferred until proven.

---

## 8.21 Imports and Exports

This section defines whether the module supports imports or exports.

By default:

```txt
Imports are deferred.
Exports are deferred unless explicitly required.
```

If included, define:

```txt
Import/export name
Format
Fields
Permission required
Validation rules
Sensitive fields
Tenant scoping
Soft-delete behavior
Error handling
Tests
```

Required rules:

```txt
Read is not export.
Create is not import.
Client-supplied orgId is forbidden.
Imports validate before writing.
Exports respect permissions and soft delete.
```

For MVP delivery, controlled founder/developer-run onboarding scripts may be used instead of a generic import engine.

---

## 8.22 AI Context

This section defines static AI metadata for the module.

This does not implement runtime AI.

It should include:

```txt
Module description
Business workflows
Business Objects used
Module-owned entities
Safe questions
Unsafe questions
Common misunderstandings
Glossary terms
Permission-sensitive topics
```

Required rules:

```txt
No tenant data in static AI context.
No orgId.
No real client examples.
No secrets.
No AI data access implementation.
No AI actions.
```

The first safe future AI feature is contextual module help, not unrestricted business data querying.

---

## 8.23 Seed and Provisioning

This section defines what happens when the module is enabled for an organization.

Possible provisioning items:

```txt
Default settings
Default categories
Default statuses
Default roles/permissions suggestions
Demo data for demo org only
```

Required rules:

```txt
Provisioning must be idempotent.
Provisioning must use PlatformContext or approved provisioning context.
Provisioning must not overwrite client data.
Production seed is not client onboarding.
Demo data is not production baseline data.
```

Module manifests may declare provisioning hooks, but executable provisioning code must live in server-only module files.

---

## 8.24 Security Requirements

This section must explicitly state security requirements for the module.

At minimum:

```txt
Use verified PlatformContext.
Never accept client-supplied orgId.
Use tenant-scoped APIs.
Use sdk.getDb(ctx).
Do not import raw Prisma.
Do not import @/kernel/*.
Do not import other modules.
Enforce permissions in services.
Enforce permissions in APIs.
Reject unknown body fields through strict Zod schemas.
Use soft delete for deletable business records.
Exclude sensitive fields from events, logs, exports, and AI context.
Return JSON errors only from APIs.
```

This section must also define any module-specific security concerns.

Examples:

```txt
Inventory adjustments affect operational truth.
Expenses may contain receipts and financial data.
HR/Leave may contain sensitive employee data.
Visitor Management may contain personal data.
Incident Reporting may contain sensitive narratives or photos.
```

---

## 8.25 Testing Requirements

This section defines tests required before implementation is complete.

Every module must include:

```txt
Unit tests
Service tests
API tests
Integration tests where needed
UI tests where needed
Tenant-isolation tests
Permission-denial tests
Module-disabled tests
Validation tests
Soft-delete tests if deletable records exist
Event-emission tests
Architecture checks
Generator output tests if generated
```

Required test scenarios:

```txt
Unauthenticated API request returns JSON 401.
Wrong-org user receives safe 404.
User without permission receives 403.
Disabled module returns MODULE_NOT_FOUND.
Client-supplied orgId is rejected.
Soft-deleted records are hidden by default.
Mutation emits event only after success.
Failed mutation does not emit success event.
Non-admin denial case is tested.
At least two organizations exist in tenant-sensitive tests.
```

Admin-only tests are insufficient.

Tautological tests are insufficient.

Example of insufficient test:

```ts
expect(Array.isArray(result)).toBe(true)
```

Example of useful test:

```ts
expect(
  InventoryService.listStockBalances(betaCtx)
).not.toContainRecordFrom(alphaOrg)
```

---

## 8.26 Module Manifest Requirements

This section defines what the module manifest must contain.

At minimum:

```txt
id
label
version
lifecycle
compatibility
icon
dependencies
businessObjectsUsed
entitiesOwned
permissions
navItems
routes
api
settings
events.emits
events.listens
aiContext reference
docs reference
provisioning hook names
```

The manifest must be pure metadata.

It must not:

```txt
self-register as a side effect
import services
import raw Prisma
import @/kernel/*
import @/sdk/server
execute provisioning
contain secrets
contain client-specific values
```

---

## 8.27 Generator Requirements

This section defines how the Module Generator should scaffold the module.

It must specify:

```txt
Generated files
Generated tests
Generated manifest
Generated route shell
Generated service shell
Generated schema shell
Generated event constants
Generated AI context stub
Generated docs stub
```

Required generated safety:

```txt
No orgId field in client schemas.
No sdk.getDb(orgId).
No /api/[module] routes.
No auth-only APIs.
No raw Prisma imports in modules.
No @/kernel imports in modules.
No direct module imports.
Real tenant-isolation tests.
Real permission-denial tests.
```

---

## 8.28 Implementation Plan for Claude

This section gives Claude the implementation steps.

It must be narrow, ordered, and checkable.

Example:

```md
## Claude Implementation Plan

1. Read the frozen module specification.
2. Run the module generator for `[moduleId]`.
3. Add Prisma models exactly as specified.
4. Create migration locally.
5. Implement Zod schemas.
6. Implement service methods.
7. Implement API routes.
8. Implement pages and client components.
9. Implement event constants and payload schemas.
10. Implement tests.
11. Run architecture checks.
12. Run typecheck.
13. Run tests.
14. Run build.
15. Report changed files and verification results.
```

Required Claude instructions:

```txt
Do not invent architecture.
Do not add Platform Services.
Do not add FastAPI.
Do not duplicate Business Objects.
Do not accept client-supplied orgId.
Do not use sdk.getDb(orgId).
Do not import @/kernel/* from module code.
Do not import other modules.
Stop if the spec is ambiguous.
```

---

## 8.29 Acceptance Criteria

This section defines what “done” means.

Example:

```txt
[ ] Module spec is Frozen.
[ ] Module manifest is valid.
[ ] Module APIs use tenant-scoped route pattern.
[ ] Services receive PlatformContext.
[ ] Services enforce permissions.
[ ] Client-supplied orgId is rejected.
[ ] Business Objects are reused, not duplicated.
[ ] Extension tables are used where needed.
[ ] Soft delete is implemented where applicable.
[ ] Events are emitted after successful mutations.
[ ] API tests cover 401, 403, safe 404, validation, orgId rejection, success.
[ ] Tenant isolation tests use at least two organizations.
[ ] Permission-denial tests use non-admin users.
[ ] UI follows design standards.
[ ] Navigation is permission-aware.
[ ] Module-disabled behavior is tested.
[ ] Typecheck passes.
[ ] Tests pass.
[ ] Build passes.
[ ] Architecture checks pass.
```

No module is complete unless its acceptance criteria are met.

---

## 8.30 Deferred Features

Every module spec must list deferred features.

Examples:

```txt
Barcode scanning deferred.
Mobile app deferred.
Approval engine deferred.
Attachments deferred.
Notifications deferred.
AI insights deferred.
Advanced reports deferred.
Import/export engine deferred.
Saved views deferred.
```

Deferred means not included unless a future amendment or separate spec approves it.

Claude must not implement deferred items.

---

## 8.31 Open Questions

Every module spec may include open questions.

Open questions must be resolved before freezing if they affect implementation.

Example:

```txt
Should stock adjustments allow negative stock?
Should Product creation happen inside Inventory or only in Business Objects pages?
Should Warehouse be required for all stock movement?
Should draft adjustments exist before posting?
```

If the answer changes architecture, create an ADR.

---

# 9. Required Module Spec Header Template

Use this header exactly:

```md
# OneDayOS Engineering Manual — [Module Name] Module Specification

**Document ID:** `17-module-specifications/[module-file].md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Not Allowed Until Frozen  
**Module ID:** `[module_id]`  
**Module Label:** `[Human Label]`  
**Lifecycle:** draft  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `05-sdk/*`
- `06-data/*`
- `07-business-objects/*`
- `08-module-system/*`
- `09-cli-generators/*`
- `13-security/*`
- `14-testing-quality/*`
```

---

# 10. Module Classification Before Spec Writing

Before writing a module spec, classify the request.

```txt
Configuration
Existing module setup
Existing module extension
New draft module
Platform Service candidate
Custom/premium work
Reject/defer
```

## 10.1 Configuration

Use settings, roles, permissions, enabled modules, labels, and seed data.

No new module spec needed.

## 10.2 Existing Module Setup

The client request fits an existing module.

No new module spec needed unless the existing spec changes.

## 10.3 Existing Module Extension

The request fits an existing module but needs module-specific fields or workflow.

Update the existing module spec.

Do not create a new module just for fields.

## 10.4 New Draft Module

The request is a coherent reusable business capability.

Create a new module spec.

Example:

```txt
Fleet Management
Reservations
Quality Control
Service Tickets
Rental Management
Training Records
```

## 10.5 Platform Service Candidate

The request sounds like a reusable cross-cutting capability.

Do not implement as Platform Service unless the Three Independent Use Cases Rule is satisfied.

Example:

```txt
Approvals
Notifications
Attachments
Comments
Search
Reporting
Activity Feed
```

## 10.6 Custom/Premium Work

The request is valuable but not normal one-day scope.

It may become:

```txt
premium module
dedicated project
vertical product
enterprise deployment
paid custom extension
```

## 10.7 Reject/Defer

Reject or defer when the request creates unacceptable risk, support burden, or architectural damage.

Examples:

```txt
Unclear regulated healthcare workflow
Client wants direct database access
Client wants custom fork
Client wants unlimited custom reports
Client wants runtime AI to edit data
Client wants vague “make it like SAP” scope
```

---

# 11. Examples of Request Classification

## 11.1 Trucking Client: Fleet Management

Request:

```txt
Track trucks, drivers, odometer logs, fuel logs, maintenance schedules,
vehicle documents, and vehicle assignments.
```

Classification:

```txt
New draft module: Fleet
```

Shared Business Objects used:

```txt
Employee = drivers
Supplier = repair shops / fuel providers
Warehouse maybe = depot/storage location if relevant
```

Module-owned entities:

```txt
Vehicle
VehicleAssignment
OdometerLog
FuelLog
MaintenanceSchedule
MaintenanceRecord
```

Deferred Platform Services:

```txt
Attachments for vehicle documents deferred unless approved.
Notifications for maintenance reminders deferred unless local workaround approved.
```

Correct action:

```txt
Write Fleet Module Specification.
```

Wrong action:

```txt
Fork app for trucking client.
Add vehicle fields to Employee.
Put fuel logs inside Expenses without module boundary.
Build generic Attachment Service immediately.
```

---

## 11.2 Dental Clinic: Patient Records

Request:

```txt
Patients, tooth charting, x-rays, prescriptions, medical history,
treatment plans, appointments, and billing.
```

Classification:

```txt
High-risk vertical module or reject/defer.
```

Reason:

```txt
Sensitive health data.
Specialized workflows.
Attachments likely required.
Higher privacy burden.
Potential compliance/support complexity.
```

Possible action:

```txt
Founder review required.
Maybe create Clinic/Dental module only as premium vertical scope.
Not normal one-day module.
```

Wrong action:

```txt
Force patient records into Customer.
Build x-ray uploads casually.
Treat medical notes as normal comments.
```

---

## 11.3 School: Student Attendance

Request:

```txt
Track students, classes, attendance, absences, parent contact, and reports.
```

Classification:

```txt
Possible new module: School Attendance
or vertical Education module.
```

Business Object decision:

```txt
Do not automatically use Employee for Student.
Student may be a new Business Object only after broader evidence.
For first implementation, Student may be module-owned inside School module.
```

Reason:

```txt
Student is not a universal OneDayOS Business Object yet.
```

---

## 11.4 Repair Shop: Service Tickets

Request:

```txt
Track repair jobs, customers, devices/items, technician assignments,
status, parts used, and service notes.
```

Classification:

```txt
New draft module: Service Tickets
```

Business Objects used:

```txt
Customer
Employee = technician
Product = spare parts if inventory-linked
```

Module-owned entities:

```txt
ServiceTicket
ServiceTicketLine
ServiceStatusHistory
```

Platform Service candidates:

```txt
Comments, Attachments, Notifications may emerge later but should not be built first.
```

---

# 12. Module Spec Quality Bar

A good module spec is:

```txt
Specific
Reusable
Security-aware
Tenant-aware
Permission-aware
Workflow-oriented
Testable
Generator-friendly
Claude-friendly
Commercially scoped
```

A bad module spec is:

```txt
Vague
CRUD-only
Client-specific
Missing permissions
Missing tests
Missing workflows
Duplicating Business Objects
Overusing Platform Services
Too broad for one-day delivery
```

---

# 13. Claude Prompt Template for Module Spec Implementation

When a module specification is frozen, give Claude a prompt like this:

```md
You are implementing the OneDayOS [MODULE NAME] Module.

Authoritative documents:
- docs/engineering-manual/17-module-specifications/[module-file].md
- docs/engineering-manual/08-module-system/*
- docs/engineering-manual/05-sdk/*
- docs/engineering-manual/13-security/*
- docs/engineering-manual/14-testing-quality/*

Rules:
- Implement only the frozen module specification.
- Do not invent architecture.
- Do not add Platform Services.
- Do not add FastAPI or Python backend files.
- Do not duplicate Business Objects.
- Do not import from @/kernel/* inside module code.
- Do not import other modules.
- Do not use raw Prisma inside module code.
- Do not use sdk.getDb(orgId).
- Use verified PlatformContext.
- Reject client-supplied orgId.
- Enforce permissions in services and APIs.
- Use tenant-scoped API routes under /api/orgs/[orgSlug]/[moduleId]/...
- Add required tests.

Task:
1. Read the module spec.
2. Propose a file-level implementation plan.
3. Implement only the approved scope.
4. Run typecheck, tests, build, and architecture checks.
5. Report verification results.

Stop and ask for clarification only if the frozen spec contradicts itself or a required decision is missing.
```

---

# 14. Module Spec Review Checklist

Before freezing a module specification, review:

```txt
[ ] Purpose is clear.
[ ] Non-goals are explicit.
[ ] Business fit is defined.
[ ] Workflows are written as workflows, not CRUD screens.
[ ] Business Objects are reused correctly.
[ ] Module-owned entities are justified.
[ ] Extension tables are used where needed.
[ ] Permissions are complete.
[ ] Routes are tenant-scoped.
[ ] APIs are tenant-scoped and JSON-only.
[ ] Services receive PlatformContext.
[ ] Events follow naming convention.
[ ] Settings are validated.
[ ] Navigation is permission-aware.
[ ] Forms do not include orgId.
[ ] Tables define columns/actions/states.
[ ] Reports do not bypass permissions.
[ ] Imports/exports are scoped or deferred.
[ ] AI context is static and safe.
[ ] Seed/provisioning is idempotent.
[ ] Security requirements are explicit.
[ ] Tests include tenant and permission denial.
[ ] Manifest requirements are clear.
[ ] Generator output requirements are clear.
[ ] Claude implementation plan is narrow.
[ ] Acceptance criteria are checkable.
[ ] Deferred features are listed.
[ ] Open questions are resolved or intentionally deferred.
```

---

# 15. Stop Conditions

Do not freeze a module spec if any of these are true:

```txt
The module duplicates a Business Object.
The module needs client-supplied orgId.
The module requires direct imports from another module.
The module requires raw Prisma inside module code.
The module requires FastAPI or another backend runtime.
The module relies on a deferred Platform Service without approval.
The module has no tenant-isolation test plan.
The module has no permission-denial test plan.
The module has vague workflows.
The module is really a client-specific fork.
The module's scope cannot fit one-day delivery but is being sold as one-day delivery.
```

If a stop condition exists, resolve it before implementation.

---

# 16. Relationship to the Module Generator

The Module Generator creates the file skeleton.

The module specification defines what the skeleton should become.

```txt
Module Spec = what to build and why
Module Generator = safe starting files
Claude = implementation worker
Tests = proof it works and fails safely
```

The generator should not replace module specifications.

A generated module without a specification is only a scaffold.

It is not an official OneDayOS module.

---

# 17. Relationship to Platform Services

Module specs must not casually include Platform Services.

Examples:

```txt
Do not add Approval Workflow Service because one module needs approval.
Do not add Notification Service because one module needs an alert.
Do not add Attachment Service because one module needs one file upload.
Do not add Reporting Service because one module needs one report.
```

Instead:

```txt
Keep first use module-local if needed.
Log evidence.
Promote only after Three Independent Use Cases review.
```

If the module spec requires a deferred Platform Service, it must say:

```txt
This feature is deferred until the Platform Service exists.
```

or:

```txt
This module includes a temporary module-local implementation approved by founder/architect.
```

---

# 18. Relationship to Business Objects

Module specs must clearly distinguish:

```txt
Shared Business Objects
Module-owned entities
Module extension tables
```

Example:

```txt
Product = shared Business Object
InventoryProductExtension = Inventory extension table
StockMovement = Inventory-owned entity
```

Bad design:

```txt
InventoryProduct duplicates Product.
CRMCustomer duplicates Customer.
LeaveEmployee duplicates Employee.
```

This template exists partly to prevent those mistakes.

---

# 19. Relationship to Client Delivery

A module spec is not a client delivery brief.

A client delivery brief says:

```txt
Client A will use Inventory and Leave.
Enable these modules.
Configure these roles.
Import these products.
Train these users.
```

A module spec says:

```txt
This is how the Inventory Module works for any client.
```

Do not put client-specific customizations inside module specs.

Use client configuration for client-specific setup.

---

# 20. Final Rule

```txt
A OneDayOS module is not a folder.
A OneDayOS module is a reusable business capability with a contract.
```

The module specification is that contract.

If we write module specs well, future module development becomes faster, safer, and more repeatable.

If we skip module specs, OneDayOS will slowly become a pile of client-specific apps.

That is not acceptable.

---

# ADR-0011 Mandatory UX Contract Section

Every future official module spec must include this section before implementation.

```md
# UX Contract

## Primary Users

List the user roles that will use this module. Include operational users, managers, and Org Admin users only when they have real tasks in the module.

## User Goals

List what each primary user is trying to accomplish and how they decide that the work is done.

## Primary Tasks

Describe the business work users must complete. Avoid describing generic CRUD.

## Task Frequency

Describe whether tasks are daily, weekly, occasional, or exception-based.

## Work Environment

Describe where and under what pressure users perform the work.

## Required Knowledge

Describe what the user must know before using the module and what the UI must teach.

## Related Business Objects

List shared Business Objects used by this module and how the UI keeps ownership clear.

## Module-Owned Records

List only records owned by the module.

## Critical Errors To Prevent

List expensive business, security, tenant, permission, and data mistakes the UI must prevent before submission where feasible.

## Permission Roles

List the permission roles or permission groups that affect visible actions and routes.

## App Navigation

Describe how the app appears in the app launcher and what appears in the app sidebar.

## Page Map

List each page and the page pattern it uses.

## Default Landing Page

Identify the first page users see when opening the app.

## Main Process Flow

Describe the workflow the UI must teach. Include inputs, outputs, posting/transaction behavior, recovery paths, and deferred integrations.

## Page Inventory and Page Patterns

List each page and the page pattern it uses:

- App launcher entry, if applicable.
- Module dashboard.
- Process Flow.
- List/table pages.
- Create/edit forms.
- Detail pages.
- Settings pages.
- Error/permission/unavailable states.

## Primary Actions

List the main user actions that must be clear from page headers or task content.

## Secondary Actions

List lower-priority actions that must not compete with the primary action.

## Validation and Confirmation Requirements

Describe validation timing, destructive confirmations, irreversible warnings, and rollback/recovery needs.

## Empty States

Describe first-use and filtered-empty states. Explain what the user should do next.

## Loading States

Describe contextual skeletons for dashboard, table, form, process-flow, and settings pages.

## Error and Recovery States

Describe user-safe errors, recovery actions, and what raw provider details must never appear.

## Permission-Denied State

Describe missing-permission behavior.

## Module-Unavailable State

Describe disabled-module behavior separately from permission denial.

## Keyboard Workflows

Describe how the main workflow can be completed with keyboard interaction.

## Accessibility Requirements

Describe semantic structure, labels, focus behavior, reduced motion, and any risk areas. OneDayOS targets WCAG 2.2 Level AA.

## Ownership Boundaries

Explain what the module does not own, especially where users may confuse shared Records with module records.

## Known MVP Limitations

List intentionally deferred workflows and limitations users should understand.

## Deferred Workflows and Integrations

List integrations, platform services, automation, reports, notifications, approvals, and imports that are explicitly out of scope.

## Usability Test Scenarios

List task-based scenarios, blocked-permission scenarios, and failure/recovery scenarios to review.

## Required UX Tests and Review Evidence

List required UI tests, accessibility checks when tooling exists, manual review evidence, and scorecard path.
```

If a module cannot complete this section, it is not ready for implementation.
