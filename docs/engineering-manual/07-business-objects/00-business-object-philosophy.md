# OneDayOS Engineering Manual — Business Object Philosophy

**Document ID:** `07-business-objects/00-business-object-philosophy.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Founder / Lead Architect  
**Implementation Allowed:** `No — freeze before implementation`  
**Last Updated:** July 2026  
**Applies To:** Restarted OneDayOS platform build  

---

# 1. Purpose

This document defines the philosophy, boundaries, lifecycle, and implementation rules for **Business Objects** in OneDayOS.

Business Objects are one of the most important architectural ideas in the platform.

They are the reason OneDayOS is not just a collection of separate apps.

A normal app-builder mindset would create this:

```txt
InventoryProduct
PurchasingProduct
SalesProduct
CRMCustomer
ReservationsCustomer
BillingCustomer
LeaveEmployee
AssetsEmployee
ProjectsEmployee
```

OneDayOS must not do that.

OneDayOS should have shared business identities:

```txt
Product
Customer
Supplier
Employee
Warehouse
```

Then modules attach their own workflows, transactions, settings, and extension data around those shared identities.

The goal is:

```txt
One business object.
Many modules.
One tenant boundary.
One source of truth.
```

---

# 2. Core Thesis

A **Business Object** is a shared domain entity that represents a real-world business thing used across multiple modules.

Examples:

```txt
Employee
Product
Product Category
Customer
Supplier
Warehouse
```

These entities do **not** belong to Inventory, CRM, HR, Purchasing, Projects, or Assets.

They belong to the OneDayOS platform.

Modules may reference them, extend them, react to them, and display them, but modules do not own them.

---

# 3. Architectural Layer

The locked OneDayOS architecture is:

```txt
Kernel
  ↓
Business Objects
  ↓
Platform Services
  ↓
Business Modules
  ↓
Client Configuration
```

Business Objects sit **below Platform Services and Business Modules** because they are foundational shared business entities.

They sit **above Kernel** conceptually because they are business-specific, not platform fundamentals.

This distinction matters:

```txt
Authentication        → Kernel
Organization          → Kernel
Branch                → Kernel org structure
Department            → Kernel org structure
Employee              → Business Object
Product               → Business Object
Stock Movement        → Inventory Module
Leave Request         → Leave Module
Approval Engine       → Platform Service, when promoted
Client label override → Client Configuration
```

For the restarted build, Business Object tables may physically live in the same Prisma schema as Kernel tables. That is acceptable.

But architecturally, Business Objects are **not Kernel internals**.

Modules must not import `@/kernel/*` to access them.

Modules access Business Objects through approved SDK, service, and API boundaries.

---

# 4. Why Business Objects Exist

Business Objects exist to prevent the platform from becoming a graveyard of duplicated domain models.

Without shared Business Objects, every new module would slowly create its own version of the same entity.

That causes:

```txt
Duplicate records
Conflicting meanings
Broken reporting
Broken search
Broken AI context
Impossible cross-module workflows
Painful data migration
Client confusion
More support burden
```

Example failure pattern:

```txt
Inventory has Product A.
Purchasing has Supplier Item A.
Sales has Sellable Product A.
CRM has Quoted Item A.

The client asks: “How many of Product A did we buy, sell, and keep in stock?”

The system cannot answer cleanly because Product A exists four times.
```

Correct OneDayOS pattern:

```txt
Product exists once.
Inventory references Product.
Purchasing references Product.
Sales references Product.
Reporting aggregates around Product.
AI understands Product as one shared object.
```

---

# 5. What Counts as a Business Object

A thing may become a Business Object when it satisfies most of these conditions:

```txt
It represents a durable real-world business entity.
It is reused by multiple modules.
It has a stable identity over time.
It is not merely a transaction.
It is not merely a workflow step.
It is not merely a report.
It is not merely a configuration value.
It should appear consistently in search, reporting, AI, import/export, and module relationships.
```

Examples that qualify:

```txt
Employee
Product
Customer
Supplier
Warehouse
```

Examples that usually do not qualify:

```txt
Stock Movement
Leave Request
Purchase Request
Expense Claim
Sales Opportunity
Visitor Log Entry
Incident Report
Task
Comment
Approval Step
Notification
Report Definition
Dashboard Widget
```

Those are module records, workflow records, or Platform Service records.

They may reference Business Objects, but they are not Business Objects themselves.

---

# 6. Business Objects vs Kernel Objects

Kernel objects are platform fundamentals.

Business Objects are shared business-domain entities.

| Entity | Layer | Reason |
|---|---|---|
| Organization | Kernel | Tenant boundary |
| User | Kernel | Login identity |
| Role | Kernel | Authorization |
| Permission | Kernel | Authorization |
| Subscription | Kernel | Commercial/platform control |
| OrgModule | Kernel | Module enablement |
| Branch | Kernel | Organization structure |
| Department | Kernel | Organization structure |
| Employee | Business Object | Shared personnel/business entity |
| Product | Business Object | Shared item/catalog entity |
| Product Category | Business Object | Shared product classification |
| Customer | Business Object | Shared customer/account entity |
| Supplier | Business Object | Shared vendor/procurement entity |
| Warehouse | Business Object | Shared operational location entity |

Important correction:

```txt
Branch and Department are Kernel org-structure primitives.
Warehouse is a Business Object.
```

Reason:

```txt
Branch and Department define how an Organization is structured.
Warehouse defines an operational business location that can be used by Inventory, Purchasing, Transfers, Assets, and future logistics workflows.
```

---

# 7. Business Objects vs Platform Services

Business Objects are nouns.

Platform Services are reusable capabilities.

Examples:

```txt
Product              → Business Object
Audit Log            → Platform Service
Customer             → Business Object
Notification Engine  → Platform Service
Employee             → Business Object
Approval Engine      → Platform Service
Warehouse            → Business Object
Search               → Platform Service
```

A Business Object may emit events.

A Platform Service may consume those events.

Example:

```txt
objects.product.created
  ↓
Audit Log Service
  ↓
Search Service
  ↓
AI Context Index
```

Product does not need to know those services exist.

---

# 8. Business Objects vs Business Modules

Modules implement domain-specific business workflows.

Business Objects provide shared identity.

Example:

```txt
Product
  used by Inventory
  used by Purchasing
  used by Sales
  used by Reporting
  used by AI
```

Inventory may own:

```txt
StockBalance
StockMovement
InventoryAdjustment
ReorderRule
InventoryProductProfile
```

Inventory may not own:

```txt
Product
ProductCategory
Warehouse
```

CRM may own:

```txt
Lead
Opportunity
Pipeline
Activity
CrmCustomerProfile
```

CRM may not own:

```txt
Customer
```

Leave may own:

```txt
LeaveRequest
LeaveBalance
LeaveType
```

Leave may not own:

```txt
Employee
```

---

# 9. Initial Business Object Set

The restarted platform should recognize the following initial Business Object set:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

This does not mean every object must have a full UI, import flow, reporting flow, AI flow, and CRUD generator on day one.

It means these are the approved shared entities and no module may duplicate them.

Implementation depth can be staged.

Example:

```txt
Phase 1:
  Tables, SDK/service contracts, tenant isolation, permissions, events, tests.

Phase 2:
  Basic management UI for objects needed by first official module.

Phase 3:
  Search, import/export, AI context, audit, reporting integrations.
```

---

# 10. Business Object Minimalism Rule

Business Objects must contain only the lowest common denominator fields needed across modules.

Do not use core Business Objects as dumping grounds.

A field belongs on a core Business Object only when it is broadly useful across independent modules.

Example: `Product.name` belongs on Product.

Example: `Product.reorderPoint` does **not** belong on Product.

`reorderPoint` belongs in an Inventory-owned extension table.

Correct:

```txt
Product
  id
  orgId
  code
  name
  description
  categoryId
  unit

InventoryProductProfile
  id
  orgId
  productId
  reorderPoint
  minimumStock
  valuationMethod
```

Incorrect:

```txt
Product
  id
  orgId
  code
  name
  reorderPoint
  minimumStock
  valuationMethod
  supplierLeadTime
  crmPipelineStatus
  ecommerceSeoTitle
```

That turns a shared object into a bloated pseudo-ERP table.

OneDayOS must avoid that.

---

# 11. Three Independent Use Cases Rule

A field, capability, or abstraction should not be promoted into the shared Business Object layer merely because it sounds reusable.

It needs evidence.

Use the **Three Independent Use Cases Rule**.

A field or behavior may be promoted when three independent modules, workflows, or clients need the same concept in substantially the same way.

Example:

```txt
Field: Product.barcode

Use case 1: Inventory uses barcode for stock counting.
Use case 2: Sales/POS uses barcode for item lookup.
Use case 3: Purchasing uses barcode for receiving goods.

Decision: Promote barcode to Product.
```

Counterexample:

```txt
Field: Product.reorderPoint

Use case 1: Inventory needs reorder point.
Use case 2: Purchasing wants to see reorder suggestions, but does not own the setting.
Use case 3: No third independent use case.

Decision: Keep reorderPoint inside InventoryProductProfile.
```

The rule prevents two problems:

```txt
Overengineering too early
Polluting shared objects with module-specific fields
```

Important exception:

The rule does not apply to true identity fields that are obviously required for the object to exist.

Example:

```txt
Product.name
Customer.name
Employee.name
Supplier.name
Warehouse.name
```

Those are fundamental.

---

# 12. Evidence Log Requirement

Any proposed promotion into a Business Object must be recorded in an evidence log before implementation.

Suggested format:

```md
## Business Object Field Promotion Evidence

Capability or field: Product.barcode
Proposed target: Product
Requested by:
- Inventory stock counting
- POS item lookup
- Purchasing receiving

Alternatives considered:
- InventoryProductProfile.barcode
- Module-specific duplicate fields

Decision:
Promote to Product.

Reason:
Barcode is an identity/lookup attribute used consistently across three independent workflows.

Migration required:
Yes.

Backward compatibility risk:
Low.
```

This evidence can live in the relevant Business Object document or an ADR.

Claude must not promote fields without this evidence.

---

# 13. Business Object Ownership

Business Objects are owned by the platform architecture, not by modules.

Ownership rules:

```txt
Business Object schema changes require manual/document approval.
Modules may reference Business Objects.
Modules may define extension tables.
Modules may not add columns directly to core Business Object tables.
Modules may not define duplicate object tables.
Modules may not bypass Business Object services when those services exist.
```

Example forbidden module table:

```prisma
model InventoryProduct {
  id String @id
  orgId String
  code String
  name String
  unit String
}
```

Reason: this duplicates Product.

Correct module table:

```prisma
model InventoryProductProfile {
  id String @id @default(cuid())
  orgId String
  productId String
  reorderPoint Decimal?
  minimumStock Decimal?
  valuationMethod String?

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
  @@map("inventory_product_profiles")
}
```

---

# 14. Business Object Access Pattern

Modules must not access Business Objects through Kernel internals.

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
import { ProductService } from '@/kernel/objects/product'
```

Allowed, depending on the implemented stage:

```ts
import { sdk } from '@/sdk/server'
```

Preferred future pattern:

```ts
const product = await sdk.objects.products.getById(ctx, productId)
```

Acceptable MVP pattern only where no dedicated object service exists yet:

```ts
const db = sdk.getDb(ctx)
const product = await db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

But once a Business Object service exists, modules should use the service instead of writing object queries repeatedly.

This gives the platform one place to enforce:

```txt
Tenant isolation
Soft delete
Permissions
Validation
Events
Future audit logging
Future search indexing
Future AI context updates
```

---

# 15. Business Object API Namespace

Business Object APIs should not live under a business module.

Preferred route shape:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/products/[productId]
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/suppliers
/api/orgs/[orgSlug]/objects/employees
/api/orgs/[orgSlug]/objects/warehouses
```

Not this:

```txt
/api/orgs/[orgSlug]/inventory/products
/api/orgs/[orgSlug]/crm/customers
/api/orgs/[orgSlug]/hr/employees
```

Reason:

```txt
Product is not owned by Inventory.
Customer is not owned by CRM.
Employee is not owned by HR or Leave.
Warehouse is not owned only by Inventory.
```

A module page may display a Business Object.

But the underlying API and service should remain shared.

---

# 16. Business Object Permission Namespace

Business Object permissions should use the shared `objects` permission namespace.

Permission shape:

```ts
{
  module: 'objects',
  resource: 'product',
  action: 'create'
}
```

Examples:

```txt
objects.product.read
objects.product.create
objects.product.update
objects.product.delete
objects.product.restore

objects.customer.read
objects.customer.create
objects.customer.update
objects.customer.delete
objects.customer.restore

objects.employee.read
objects.employee.create
objects.employee.update
objects.employee.delete
objects.employee.restore
```

Do not use module-specific permissions for shared object ownership.

Incorrect:

```txt
inventory.product.create
crm.customer.update
hr.employee.delete
```

Those imply the module owns the shared object.

Correct distinction:

```txt
objects.product.update              → edit shared Product identity
inventory.product_profile.update    → edit Inventory-specific Product settings
crm.customer_profile.update         → edit CRM-specific Customer settings
```

Admin wildcard permission may grant access to `objects.*.*`, but wildcard permission never bypasses tenant isolation.

---

# 17. Business Object Event Namespace

Business Object events use the `objects` namespace.

Examples:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored

objects.customer.created
objects.customer.updated
objects.customer.deleted
objects.customer.restored

objects.employee.created
objects.employee.updated
objects.employee.deactivated
objects.employee.deleted
objects.employee.restored

objects.supplier.created
objects.warehouse.updated
```

Do not use module namespaces for shared object events.

Incorrect:

```txt
inventory.product.created
crm.customer.created
hr.employee.created
```

Correct:

```txt
objects.product.created
objects.customer.created
objects.employee.created
```

Module-specific events remain module-scoped:

```txt
inventory.stock_movement.created
purchasing.purchase_request.approved
leave.leave_request.submitted
crm.opportunity.won
```

Events must be emitted through the server SDK with verified `PlatformContext`.

Example:

```ts
await sdk.events.emit(ctx, 'objects.product.created', {
  productId: product.id,
})
```

Payloads should be small and stable.

Do not emit full Prisma records.

---

# 18. Tenant Scope

Every Business Object is tenant-scoped.

Every Business Object table must include:

```txt
orgId
```

Every Business Object read/write must use verified `PlatformContext`.

Correct:

```ts
await sdk.objects.products.getById(ctx, productId)
```

Incorrect:

```ts
await prisma.product.findUnique({ where: { id: productId } })
```

Incorrect:

```ts
await sdk.objects.products.getById(orgId, productId)
```

Reason:

```txt
orgId is not enough.
The operation needs a verified user, organization, membership, module state, and permissions.
```

Business Object services should accept:

```ts
type PlatformContext = {
  authUserId: string
  user: {
    id: string
    orgId: string
    email: string
    name: string
  }
  org: {
    id: string
    slug: string
    name: string
    status: string
  }
  permissions: PermissionSummary
  enabledModules: string[]
}
```

They should not accept loose `orgId` strings.

---

# 19. Recommended Prisma Relation Pattern

Tenant-scoped Business Objects should support composite references from module-owned tables.

Recommended pattern:

```prisma
model Product {
  id        String    @id @default(cuid())
  orgId     String
  code      String
  name      String
  deletedAt DateTime?
  deletedBy String?

  @@unique([orgId, code])
  @@unique([id, orgId])
  @@map("products")
}
```

Then module-owned records can enforce same-tenant references:

```prisma
model InventoryProductProfile {
  id        String @id @default(cuid())
  orgId     String
  productId String

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
  @@map("inventory_product_profiles")
}
```

This does not replace application-level tenant checks.

It adds database-level integrity so an Inventory record from Org A cannot reference a Product from Org B.

---

# 20. Soft Delete Rule

Business Objects are soft-deleted by default.

Required fields:

```txt
deletedAt DateTime?
deletedBy String?
```

Soft delete means:

```txt
Normal reads exclude deleted records.
Deleted records are hidden from module workflows.
Deleted records are hidden from normal search and AI context.
Restore requires explicit permission.
Hard delete is reserved for exceptional internal maintenance.
```

`isActive` is not deletion.

Example:

```txt
Employee.isActive = false
```

means the employee is no longer active/employed.

```txt
Employee.deletedAt = timestamp
```

means the record itself is deleted/archived from normal use.

A Business Object may be inactive but not deleted.

---

# 21. Reference Integrity and Deletion

Business Object deletion must consider active references.

Example:

```txt
Product is referenced by StockMovement.
Customer is referenced by Opportunity.
Employee is referenced by LeaveRequest.
Supplier is referenced by PurchaseRequest.
Warehouse is referenced by StockBalance.
```

The default rule:

```txt
If a Business Object has active historical or transactional references, do not hard delete it.
Soft delete or deactivate it.
```

For module behavior:

```txt
Historical records may continue to show the deleted object's display name.
New records should not allow selecting deleted objects.
Reports should be explicit about including archived/deleted objects.
Restore should re-enable selection only if the object is valid.
```

Module records should store enough denormalized display data only when historically necessary.

Example:

```txt
StockMovement.productNameSnapshot
```

may be acceptable if reports must preserve historical names after Product rename.

But snapshots should not become duplicate ownership models.

---

# 22. Extension Table Pattern

Module-specific fields belong in module-owned extension tables.

There are two common patterns.

## 22.1 One-to-One Extension

Use this when a module needs additional settings for a shared object.

Example:

```prisma
model InventoryProductProfile {
  id              String @id @default(cuid())
  orgId           String
  productId        String
  reorderPoint     Decimal?
  minimumStock     Decimal?
  maximumStock     Decimal?
  valuationMethod  String?
  defaultWarehouseId String?

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
  @@map("inventory_product_profiles")
}
```

## 22.2 One-to-Many Extension

Use this when a module tracks repeated module-specific records around a Business Object.

Example:

```prisma
model StockMovement {
  id          String @id @default(cuid())
  orgId       String
  productId   String
  warehouseId String
  quantity    Decimal
  movementType String
  occurredAt  DateTime

  product Product @relation(fields: [productId, orgId], references: [id, orgId])
  warehouse Warehouse @relation(fields: [warehouseId, orgId], references: [id, orgId])

  @@index([orgId, productId])
  @@index([orgId, warehouseId])
  @@map("inventory_stock_movements")
}
```

The extension table belongs to the module.

The Business Object remains shared.

---

# 23. Field Promotion Process

Sometimes a module-specific field proves to be broadly useful and should move into the Business Object.

Promotion process:

```txt
1. Capture evidence from three independent use cases.
2. Write or update the relevant Business Object document.
3. Add an ADR if the change affects multiple modules or compatibility.
4. Design a safe migration.
5. Backfill from extension tables if needed.
6. Keep backward-compatible reads temporarily if needed.
7. Update SDK/service contracts.
8. Update event payloads only in a compatible way.
9. Update tests.
10. Deprecate old extension fields after migration.
```

Example:

```txt
Product.barcode starts in InventoryProductProfile.
Later, POS and Purchasing also need barcode.
Decision: promote Product.barcode.
Migration: add nullable Product.barcode, backfill from InventoryProductProfile, then update services.
```

No field should be promoted casually.

---

# 24. Business Object Creation from Modules

A module may provide a UI that creates a Business Object, but the module does not own the object.

Example:

Inventory page:

```txt
/[orgSlug]/inventory/products/new
```

This page may create:

```txt
Product
InventoryProductProfile
```

But it should do so through shared object services and module services.

Conceptual flow:

```ts
const product = await sdk.objects.products.create(ctx, productInput)

await InventoryProductProfileService.create(ctx, {
  productId: product.id,
  reorderPoint,
  minimumStock,
})
```

This lets the page feel natural to the user while preserving architectural ownership.

---

# 25. Business Object Display in Modules

Modules can display shared Business Objects in module-specific screens.

Example:

```txt
Inventory > Products
```

This screen may show columns from both:

```txt
Product
InventoryProductProfile
StockBalance
```

But the UI should not imply that Product is Inventory-owned.

Recommended data composition:

```txt
Product.name
Product.code
Product.unit
InventoryProductProfile.reorderPoint
StockBalance.quantityOnHand
```

This composition belongs in the module service/query layer.

The underlying object identity remains shared.

---

# 26. Business Object Naming

Business Object names should be simple, durable, and business-friendly.

Use:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Avoid overly technical names:

```txt
InventoryItemMaster
PartyAccount
PersonEntity
VendorRecord
LocationNode
```

OneDayOS is for SMEs.

The domain language should be understandable to business operators.

---

# 27. Business Object Codes and Human Identifiers

Most Business Objects need human-friendly identifiers.

Examples:

```txt
Employee.employeeNo
Product.code
Customer.code — optional/future
Supplier.code — optional/future
Warehouse.code — optional/future
```

Rules:

```txt
Database id is internal.
Human code is tenant-scoped.
Human code may be shown in UI, imports, exports, and search.
Human code should be unique within org when used.
```

Example:

```prisma
@@unique([orgId, code])
```

Do not expose internal `id` as the main business identifier.

---

# 28. Business Object Search and AI Readiness

Business Objects will eventually become central to platform search and AI.

Therefore, Business Object services and events must be designed now so Search and AI can be added later without retrofitting every module.

Required now:

```txt
Stable object IDs
Stable object events
Tenant-scoped access
Soft-delete lifecycle
Minimal payload events
Clear display names
Clear object type names
```

Future services may consume events like:

```txt
objects.product.created
objects.customer.updated
objects.employee.deactivated
```

to update:

```txt
Search index
Audit log
Activity feed
AI context
Reports
```

Do not build those Platform Services yet unless their own rules are satisfied.

But do not block them by designing Business Objects poorly.

---

# 29. Import and Export Readiness

Business Objects are likely to be imported and exported.

Examples:

```txt
Import Product catalog
Import Customer list
Import Supplier list
Import Employee directory
Import Warehouse list
```

The import/export engine is deferred.

But Business Object schemas should be designed with import/export in mind:

```txt
Stable required fields
Tenant-scoped unique codes
Clear validation rules
Soft-delete behavior
Duplicate handling strategy
Friendly error messages
```

Do not make core Business Object fields too complex for SME data entry.

---

# 30. Business Object Validation

Each Business Object must have Zod validation schemas.

Minimum schema types:

```txt
Create schema
Update schema
Query/filter schema
Restore schema, if needed
Import row schema, future
```

Rules:

```txt
Schemas reject client-supplied orgId.
Schemas are strict by default.
Server validation is mandatory.
Client validation is only UX.
Services receive validated input.
Business Object services receive PlatformContext separately from input.
```

Example shape:

```ts
const CreateProductSchema = z.strictObject({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unit: z.string().min(1).default('pcs'),
})
```

Forbidden:

```ts
const CreateProductSchema = z.object({
  orgId: z.string(),
  code: z.string(),
  name: z.string(),
})
```

The server derives tenant identity from verified `PlatformContext`.

---

# 31. Business Object Services

Each Business Object should eventually have a server-only service.

Example:

```txt
ProductObjectService
CustomerObjectService
SupplierObjectService
EmployeeObjectService
WarehouseObjectService
```

Service responsibilities:

```txt
Receive PlatformContext.
Validate permission.
Validate input.
Scope every query to ctx.org.id.
Exclude deleted records by default.
Use soft delete.
Emit Business Object events.
Map Prisma errors to API errors.
Protect cross-tenant references.
Return stable DTOs.
```

Example conceptual API:

```ts
await ProductObjectService.list(ctx, filters)
await ProductObjectService.getById(ctx, productId)
await ProductObjectService.create(ctx, input)
await ProductObjectService.update(ctx, productId, input)
await ProductObjectService.softDelete(ctx, productId)
await ProductObjectService.restore(ctx, productId)
```

Do not implement generic dynamic object CRUD yet.

Object services should be explicit until patterns prove stable.

---

# 32. Business Object DTOs

Business Object services should not return full Prisma records by default.

Use DTOs.

Example:

```ts
type ProductDto = {
  id: string
  code: string
  name: string
  description?: string | null
  categoryId?: string | null
  categoryName?: string | null
  unit: string
  createdAt: string
  updatedAt: string
}
```

Reasons:

```txt
Avoid leaking internal fields.
Avoid accidental deletedBy exposure.
Keep API shape stable.
Allow future computed fields.
Allow future database refactors.
```

Internal fields may exist in database but should not automatically become API fields.

---

# 33. Business Object UI Philosophy

Business Object UI should feel shared, not module-specific.

Possible UI placement:

```txt
/[orgSlug]/objects/products
/[orgSlug]/objects/customers
/[orgSlug]/objects/suppliers
/[orgSlug]/objects/employees
/[orgSlug]/objects/warehouses
```

But module pages may also provide object entry points when natural:

```txt
/[orgSlug]/inventory/products
/[orgSlug]/crm/customers
/[orgSlug]/purchasing/suppliers
```

The key is that UI placement does not determine ownership.

Product shown inside Inventory is still a shared Product.

Customer shown inside CRM is still a shared Customer.

Employee shown inside Leave is still a shared Employee.

---

# 34. Business Object Relationship to Client Configuration

Client-specific differences should usually be configuration, not schema changes.

Examples:

```txt
Client calls Product “Item”
Client calls Customer “Account”
Client hides Supplier email
Client requires Product category
Client enables barcode field after it exists
```

Handle these through:

```txt
Labels
Settings
Feature flags
Field visibility rules, future
Dynamic form metadata, future
Permissions
Module configuration
```

Do not create client-specific Business Object tables or columns.

Forbidden:

```txt
AcmeProduct
BetaCorpCustomer
client_a_products
client_b_products
```

OneDayOS is one platform.

---

# 35. Business Object Introduction Process

A new Business Object must not be introduced casually.

Before adding a new Business Object, answer:

```txt
What real-world entity does this represent?
Which modules need it?
Can it remain inside one module for now?
Does it have stable identity over time?
What are the minimal fields?
What module-specific fields are being intentionally excluded?
What events will it emit?
What permissions will protect it?
How will tenant isolation be tested?
How will soft delete work?
What extension tables are expected?
```

If unclear, keep it inside the module until evidence emerges.

New Business Objects require either:

```txt
A frozen Business Object specification document
or
An ADR approved by the Founder / Lead Architect
```

---

# 36. Anti-Patterns

## 36.1 Module-Owned Shared Entity

Incorrect:

```txt
Inventory owns Product.
CRM owns Customer.
HR owns Employee.
```

Correct:

```txt
Product, Customer, and Employee are shared Business Objects.
```

## 36.2 Bloated Core Object

Incorrect:

```txt
Add every field any module might ever need to Product.
```

Correct:

```txt
Keep Product minimal.
Use extension tables.
Promote fields only with evidence.
```

## 36.3 Client-Specific Schema

Incorrect:

```txt
Add custom columns for one client.
```

Correct:

```txt
Use settings, metadata, module configuration, or paid custom module extension.
```

## 36.4 Direct Kernel Import

Incorrect:

```ts
import { prisma } from '@/kernel/db/client'
```

inside a module.

Correct:

```ts
import { sdk } from '@/sdk/server'
```

## 36.5 Loose Tenant ID

Incorrect:

```ts
ProductService.create(orgId, input)
```

Correct:

```ts
ProductService.create(ctx, input)
```

## 36.6 Full Record Event Payload

Incorrect:

```ts
await sdk.events.emit(ctx, 'objects.product.created', product)
```

Correct:

```ts
await sdk.events.emit(ctx, 'objects.product.created', {
  productId: product.id,
})
```

---

# 37. Testing Requirements

Every Business Object implementation must include tests for:

```txt
Create with valid PlatformContext
Reject unauthenticated request
Reject wrong-org access
Reject client-supplied orgId
Reject missing permission
Allow Admin wildcard permission within same org
Deny Admin wildcard permission across orgs
List excludes deleted records
Get by ID excludes deleted records
Soft delete sets deletedAt/deletedBy
Restore clears deletedAt/deletedBy
Events emitted on create/update/delete/restore
Tenant-scoped unique constraints
Extension table cannot reference object from another org
```

Every tenant-sensitive test suite must use at least two organizations.

Single-org tests are insufficient.

Always-admin tests are insufficient.

---

# 38. Architecture Checks

The codebase should eventually include automated checks to prevent Business Object drift.

Checks should detect:

```txt
Modules importing @/kernel/*
Modules defining duplicate Product/Customer/Supplier/Employee/Warehouse models
API routes accepting orgId in body/query for Business Object operations
Business Object mutations without event emission
Business Object services accepting loose orgId
findUnique by id only on tenant-scoped objects
Hard delete on Business Object tables
Core Business Object fields added without doc update
```

Suggested script:

```bash
npm run check:architecture
```

This script should run in CI before build/deploy.

---

# 39. Generator Rules

The module generator must understand Business Objects.

When generating a module, Claude or the generator must not create duplicate shared entities.

Example:

If generating Inventory, do not create:

```prisma
model InventoryProduct
```

as a duplicate Product table.

Instead create:

```prisma
model InventoryProductProfile
model StockBalance
model StockMovement
model InventoryAdjustment
```

and reference:

```txt
Product
Warehouse
Employee, if needed
```

The generator should include comments like:

```txt
This module references Product. Do not define a duplicate Product model.
Inventory-specific product fields belong in InventoryProductProfile.
```

Generated module tests must include cross-tenant Business Object reference tests.

---

# 40. Relationship to Dynamic CRUD and Dynamic Forms

Business Objects should be designed so Dynamic CRUD and Dynamic Forms can eventually generate management screens.

But do not build Dynamic CRUD or Dynamic Forms yet.

Current rule:

```txt
Hand-code object services and forms first.
Extract metadata only after repeated patterns are proven.
```

Business Object documents should still define metadata-friendly concepts:

```txt
Field labels
Validation
Searchability
Sortability
Filterability
Importability
Exportability
Display identity
Permission requirements
```

That prepares the platform without overengineering too early.

---

# 41. Relationship to Search, Reporting, and AI

Business Objects are primary entities for future cross-module intelligence.

Search should eventually answer:

```txt
Find Product ABC
Find Customer Juan Trading
Find Supplier Manila Hardware
Find Employee Maria Santos
Find Warehouse Cebu Main
```

Reporting should eventually aggregate around Business Objects:

```txt
Stock by Product
Purchases by Supplier
Sales by Customer
Assets by Employee
Incidents by Branch/Warehouse
```

AI should eventually understand Business Objects as shared entities:

```txt
“Show me low stock products from our Cebu warehouse.”
“Which customers have open opportunities?”
“Which employees have pending assets?”
```

This is only possible if Business Objects are not duplicated per module.

---

# 42. Claude Implementation Rules

When implementing Business Objects, Claude must follow these rules:

```txt
Do not import from @/kernel/* inside modules.
Do not create duplicate shared entities inside modules.
Do not add fields to core Business Objects unless the frozen object spec says so.
Do not accept orgId from client input.
Do not use sdk.getDb(orgId).
Do not use loose orgId in object services.
Do not use findUnique({ where: { id } }) for tenant-scoped objects.
Do not hard delete Business Objects.
Do not emit module-namespaced events for shared object mutations.
Do not implement Dynamic CRUD unless explicitly instructed by a frozen document.
Do not use FastAPI for Business Object APIs.
```

If a field or object classification is ambiguous, Claude must stop and ask for architecture review rather than inventing a decision.

---

# 43. MVP Implementation Scope

This document does not require full Business Object UI for every object immediately.

MVP scope should be staged.

Recommended restarted-build scope:

```txt
1. Define Prisma models for approved initial Business Objects.
2. Add tenant fields, soft-delete fields, indexes, and composite org references.
3. Add Zod schemas for objects needed immediately.
4. Add explicit services for objects needed by the first official module.
5. Add API routes only for objects needed by the first official module.
6. Add events for all implemented object mutations.
7. Add security tests before module use.
```

Do not build a giant object-management admin area prematurely.

But do enforce object ownership from day one.

---

# 44. Initial Business Object Document Set

After this philosophy document is approved, write individual specs:

```txt
07-business-objects/01-employee.md
07-business-objects/02-product.md
07-business-objects/03-customer.md
07-business-objects/04-supplier.md
07-business-objects/05-warehouse.md
07-business-objects/06-branch-department.md
07-business-objects/07-business-object-extension-pattern.md
07-business-objects/08-business-object-event-contracts.md
```

Note:

```txt
Branch and Department are not Business Objects.
```

But `06-branch-department.md` exists in this section because Branch/Department are closely related to Employee, Warehouse, tenancy, and organizational structure. The document should explicitly classify them as Kernel org-structure primitives.

---

# 45. Acceptance Criteria

This document is complete when:

```txt
[ ] Business Objects are clearly defined.
[ ] Business Objects are clearly separated from Kernel, Platform Services, and Modules.
[ ] Branch and Department are classified as Kernel org-structure primitives.
[ ] Warehouse is classified as a Business Object.
[ ] The initial Business Object set is defined.
[ ] Module ownership boundaries are clear.
[ ] The Business Object minimalism rule is clear.
[ ] The Three Independent Use Cases Rule is applied to Business Object fields.
[ ] Extension table pattern is defined.
[ ] Business Object event namespace is defined.
[ ] Business Object permission namespace is defined.
[ ] Tenant isolation rules are defined.
[ ] Soft-delete rules are defined.
[ ] Generator rules are defined.
[ ] Claude implementation rules are defined.
```

---

# 46. Final Architectural Position

OneDayOS should feel like one coherent business operating system, not a pile of disconnected apps.

That requires shared business identity.

Therefore:

```txt
Employee exists once.
Product exists once.
Customer exists once.
Supplier exists once.
Warehouse exists once.
```

Modules build workflows around them.

Platform Services observe and enhance them.

Client Configuration adapts how they appear.

But the core identity stays shared.

This is one of the main differences between OneDayOS and a generic SaaS starter.

