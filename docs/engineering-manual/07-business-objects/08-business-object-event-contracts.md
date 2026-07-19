# OneDayOS Engineering Manual — 07 Business Objects — 08 Business Object Event Contracts

**Document ID:** `07-business-objects/08-business-object-event-contracts.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Author:** ChatGPT / OneDayOS Architecture Partner  
**Date:** July 2026  
**Implementation Allowed:** `No — freeze before implementation`  
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
- `05-sdk/05-sdk-compatibility-versioning.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/01-employee.md`
- `07-business-objects/02-product.md`
- `07-business-objects/03-customer.md`
- `07-business-objects/04-supplier.md`
- `07-business-objects/05-warehouse.md`
- `07-business-objects/07-business-object-extension-pattern.md`

---

# 1. Purpose

This document defines the official event contracts for OneDayOS shared Business Objects.

Business Object events are stable domain facts emitted whenever shared business identities are created, updated, deleted, restored, or otherwise changed.

This document answers:

- Which Business Object events exist?
- What are their official names?
- Where are event definitions stored?
- What payloads do they carry?
- Which mutations must emit events?
- Which modules may emit or listen to them?
- How are events scoped to a tenant?
- How do these events prepare for Audit Logs, Search, Reporting, AI, Notifications, and Activity Feed?
- What is implemented in the restarted MVP?
- What is deferred?

Business Object events are not optional polish.

They are the foundation for future platform intelligence.

---

# 2. Executive Summary

The restarted OneDayOS platform must implement Business Object event contracts with these rules:

```txt
1. Every Business Object mutation emits an event.
2. Shared Business Object events use the objects namespace.
3. Business Object events are emitted through @/sdk/server.
4. Events require verified PlatformContext.
5. Events never receive loose orgId strings.
6. Event payloads never include client-supplied orgId.
7. Event payloads are small, stable, and privacy-conscious.
8. Event names are API contracts.
9. Event payload schemas are versioned.
10. Event definitions live with Business Object services, not modules.
11. Extension-table events belong to module namespaces.
12. Future Platform Services subscribe to these events instead of modifying Business Object services.
```

Official namespace:

```txt
objects
```

Official naming grammar:

```txt
objects.{business_object}.{past_tense_verb}
```

Examples:

```txt
objects.employee.created
objects.product.updated
objects.customer.deleted
objects.supplier.restored
objects.warehouse.deactivated
```

Business Objects are shared across modules, so their events must not use module namespaces.

Correct:

```txt
objects.product.created
```

Incorrect:

```txt
inventory.product.created
```

Inventory may create a Product, but Inventory does not own Product.

---

# 3. Non-Goals

This document does **not** implement:

- Audit Log Service.
- Search Service.
- Notification Service.
- Activity Feed Service.
- AI Context Service.
- Reporting Service.
- Event Outbox.
- Durable queues.
- Webhooks.
- Event replay.
- Event sourcing.
- Workflow engine.
- Background jobs.
- FastAPI event processing.

Those are future Platform Services.

This document only defines the event contracts that will allow those services to exist later without changing Business Object mutation code.

---

# 4. Core Principle

Business Object events are facts about shared business identities.

They are emitted after successful, authorized, tenant-scoped mutations.

They are not commands.

Incorrect:

```txt
objects.product.create
objects.customer.send_email
objects.employee.recalculate_leave
objects.supplier.notify_purchasing
```

Correct:

```txt
objects.product.created
objects.customer.updated
objects.employee.deactivated
objects.supplier.restored
```

The event says what happened.

Subscribers decide what to do.

---

# 5. Why Business Object Events Exist

Business Objects will be used by many modules.

Examples:

```txt
Employee
  Leave
  Assets
  Projects
  Approvals
  Expenses

Product
  Inventory
  Purchasing
  Sales
  Reservations

Customer
  CRM
  Billing
  Projects
  Reservations
  Support

Supplier
  Purchasing
  Inventory
  Expenses
  Assets

Warehouse
  Inventory
  Purchasing
  Transfers
  Assets
```

If every module directly reacts to every other module, OneDayOS becomes tangled.

Bad architecture:

```ts
// ❌ ProductService knows too much
await InventorySearchService.index(product)
await AuditService.record(product)
await AiContextService.refresh(product)
await ReportingService.invalidateProductCache(product)
```

Correct architecture:

```ts
// ✅ ProductService emits one stable fact
await sdk.events.emit(ctx, ProductCreatedEvent, {
  source: { module: 'objects', service: 'ProductService' },
  entity: { type: 'product', id: product.id },
  payload: {
    productId: product.id,
    code: product.code,
    name: product.name,
  },
})
```

Future subscribers can listen independently:

```txt
objects.product.created
  ↓
Audit Log Service
Search Service
AI Context Service
Reporting Service
Notification Service
```

The Business Object service stays clean.

---

# 6. Business Objects Covered

This document covers events for these shared Business Objects:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

`ProductCategory` is included because it is part of the Product Business Object area and affects product organization, search, import/export, reporting, and future AI context.

This document does **not** cover:

```txt
Organization
Branch
Department
User
Role
Permission
Setting
OrgModule
Subscription
```

Those belong to Kernel event contracts.

Branch and Department are Kernel org-structure primitives, not Business Objects.

---

# 7. Namespace Decision

Business Object events use:

```txt
objects
```

This intentionally differs from older examples such as:

```txt
inventory.product.created
hr.employee.created
crm.customer.created
```

Those names are wrong for the restarted architecture because they imply module ownership of shared entities.

Correct event names:

```txt
objects.employee.created
objects.product.created
objects.customer.created
objects.supplier.created
objects.warehouse.created
```

Module-owned events still use module namespaces.

Examples:

```txt
inventory.stock_movement.created
inventory.stock_adjustment.approved
leave.leave_request.submitted
crm.deal.won
purchasing.purchase_order.created
```

Extension-table events also use module namespaces.

Example:

```txt
inventory.product_extension.created
purchasing.supplier_extension.updated
crm.customer_extension.created
```

The rule:

```txt
Core shared identity change → objects namespace
Module-specific behavior change → module namespace
```

---

# 8. Event Naming Grammar

All Business Object event names must follow:

```txt
objects.{entity}.{past_tense_verb}
```

Where:

```txt
entity = employee | product | product_category | customer | supplier | warehouse
verb   = created | updated | deleted | restored | deactivated | reactivated | moved | merged | imported
```

Only approved verbs may be used.

MVP approved verbs:

```txt
created
updated
deleted
restored
deactivated
reactivated
```

Deferred verbs:

```txt
merged
imported
archived
unarchived
moved
```

Deferred verbs require a future manual amendment or ADR before implementation.

---

# 9. Official MVP Event List

## 9.1 Employee Events

```txt
objects.employee.created
objects.employee.updated
objects.employee.deactivated
objects.employee.reactivated
objects.employee.deleted
objects.employee.restored
```

Meaning:

| Event | Meaning |
|---|---|
| `objects.employee.created` | Employee record created. Employee may or may not have login access. |
| `objects.employee.updated` | Employee profile/business identity fields changed. |
| `objects.employee.deactivated` | Employee employment status changed to inactive/resigned/terminated. |
| `objects.employee.reactivated` | Employee employment status changed back to active. |
| `objects.employee.deleted` | Employee record soft-deleted. |
| `objects.employee.restored` | Soft-deleted Employee record restored. |

Important distinction:

```txt
Employee deactivated = no longer active as personnel.
Employee deleted = record soft-deleted because it should no longer appear in normal UI.
```

A resigned employee should usually be deactivated, not deleted.

---

## 9.2 Product Events

```txt
objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored
```

Meaning:

| Event | Meaning |
|---|---|
| `objects.product.created` | Shared Product identity created. |
| `objects.product.updated` | Shared Product identity fields changed. |
| `objects.product.deleted` | Product soft-deleted. |
| `objects.product.restored` | Soft-deleted Product restored. |

Product does not have `deactivated` / `reactivated` events in MVP unless the Product specification later adds an explicit `isActive` lifecycle field.

Do not use deletion to mean discontinued product.

If product discontinuation is needed later, add a separate Product lifecycle field through an ADR.

---

## 9.3 Product Category Events

```txt
objects.product_category.created
objects.product_category.updated
objects.product_category.deleted
objects.product_category.restored
```

Meaning:

| Event | Meaning |
|---|---|
| `objects.product_category.created` | Category created. |
| `objects.product_category.updated` | Category name/parent changed. |
| `objects.product_category.deleted` | Category soft-deleted. |
| `objects.product_category.restored` | Soft-deleted category restored. |

If changing a product category affects many products, do not emit product events for every product unless those Product records are actually updated.

---

## 9.4 Customer Events

```txt
objects.customer.created
objects.customer.updated
objects.customer.deleted
objects.customer.restored
```

Meaning:

| Event | Meaning |
|---|---|
| `objects.customer.created` | Customer identity created. |
| `objects.customer.updated` | Customer identity/contact summary changed. |
| `objects.customer.deleted` | Customer soft-deleted. |
| `objects.customer.restored` | Soft-deleted Customer restored. |

Customer data may contain personal information.

Customer event payloads must be privacy-conscious.

---

## 9.5 Supplier Events

```txt
objects.supplier.created
objects.supplier.updated
objects.supplier.deleted
objects.supplier.restored
```

Meaning:

| Event | Meaning |
|---|---|
| `objects.supplier.created` | Supplier identity created. |
| `objects.supplier.updated` | Supplier identity/contact summary changed. |
| `objects.supplier.deleted` | Supplier soft-deleted. |
| `objects.supplier.restored` | Soft-deleted Supplier restored. |

Supplier payment terms, bank information, tax details, purchasing approval status, and supplier-product lead times are not core Supplier fields in MVP and must not appear in core Supplier events.

---

## 9.6 Warehouse Events

```txt
objects.warehouse.created
objects.warehouse.updated
objects.warehouse.deactivated
objects.warehouse.reactivated
objects.warehouse.deleted
objects.warehouse.restored
```

Meaning:

| Event | Meaning |
|---|---|
| `objects.warehouse.created` | Warehouse identity created. |
| `objects.warehouse.updated` | Warehouse identity/location summary changed. |
| `objects.warehouse.deactivated` | Warehouse marked inactive for future use. |
| `objects.warehouse.reactivated` | Warehouse marked active again. |
| `objects.warehouse.deleted` | Warehouse soft-deleted. |
| `objects.warehouse.restored` | Soft-deleted Warehouse restored. |

Important distinction:

```txt
Warehouse deactivated = no longer used operationally.
Warehouse deleted = record soft-deleted because it should not appear in normal UI.
```

A warehouse with historical stock movements should normally be deactivated, not deleted.

---

# 10. Events Explicitly Not in MVP

Do not implement these events in the restarted MVP unless a frozen document adds them:

```txt
objects.employee.merged
objects.customer.merged
objects.supplier.merged
objects.product.imported
objects.customer.imported
objects.supplier.imported
objects.product_category.moved
objects.product.discontinued
objects.warehouse.moved
```

Reason:

```txt
These imply complex workflows, deduplication, import engines, lifecycle states, or reporting side effects that are not yet designed.
```

The manual can add them later.

---

# 11. Event Definitions Location

Business Object event definitions must live with Business Object code, not with modules.

Recommended structure:

```txt
src/business-objects/
  employee/
    events.ts
    service.ts
    schema.ts
  product/
    events.ts
    service.ts
    schema.ts
  customer/
    events.ts
    service.ts
    schema.ts
  supplier/
    events.ts
    service.ts
    schema.ts
  warehouse/
    events.ts
    service.ts
    schema.ts
```

Alternative MVP structure is acceptable if the repository is not yet organized this way:

```txt
src/business-objects/events/
  employee-events.ts
  product-events.ts
  customer-events.ts
  supplier-events.ts
  warehouse-events.ts
```

Forbidden:

```txt
src/modules/inventory/product-events.ts       # Product is not Inventory-owned
src/modules/hr/employee-events.ts             # Employee is not HR-owned
src/modules/crm/customer-events.ts             # Customer is not CRM-owned
src/kernel/events/business-object-events.ts    # Business Objects are not Kernel internals conceptually
```

Kernel may host the event bus implementation.

Business Object event definitions should live in the Business Objects layer.

---

# 12. Shared Event Definition Pattern

All Business Object events should be defined using the SDK event helper.

Example:

```ts
import { z } from 'zod'
import { defineEvent } from '@/sdk'

export const ProductCreatedEvent = defineEvent({
  name: 'objects.product.created',
  version: 1,
  payload: z.strictObject({
    productId: z.string(),
    code: z.string(),
    name: z.string(),
    categoryId: z.string().nullable(),
    unit: z.string(),
  }),
})
```

Rules:

```txt
1. Use z.strictObject().
2. Use version: 1 for initial contracts.
3. Do not include orgId in payload.
4. Do not include actor/userId in payload.
5. Do not include full Prisma records.
6. Use IDs and stable summary fields only.
7. Use ISO strings for dates if dates are included.
8. Payload fields should be long-term contracts.
```

`orgId`, `orgSlug`, actor, timestamp, source, and event ID belong in the `EventEnvelope`, not the payload.

---

# 13. Event Envelope Requirement

Business Object event handlers receive a normalized `EventEnvelope` from the SDK.

Required envelope fields:

```ts
type EventEnvelope<TPayload> = {
  id: string
  name: string
  version: number

  org: {
    id: string
    slug: string
  }

  actor: {
    type: 'user' | 'system'
    userId: string | null
  }

  source: {
    module: string
    service?: string
  }

  entity: {
    type: string
    id: string
  }

  payload: TPayload

  occurredAt: string
  requestId?: string
  correlationId?: string
  causationId?: string
}
```

For Business Object events:

```txt
source.module = 'objects'
entity.type   = employee | product | product_category | customer | supplier | warehouse
entity.id     = primary record ID
```

Example:

```ts
await sdk.events.emit(ctx, ProductCreatedEvent, {
  source: { module: 'objects', service: 'ProductService' },
  entity: { type: 'product', id: product.id },
  payload: {
    productId: product.id,
    code: product.code,
    name: product.name,
    categoryId: product.categoryId,
    unit: product.unit,
  },
})
```

The SDK derives:

```txt
org.id
org.slug
actor.userId
occurredAt
```

from verified `PlatformContext`.

---

# 14. PlatformContext Requirement

Every Business Object event must be emitted with verified `PlatformContext`.

Allowed:

```ts
await ProductService.create(ctx, input)
```

Inside service:

```ts
await sdk.events.emit(ctx, ProductCreatedEvent, ...)
```

Forbidden:

```ts
await sdk.events.emit('objects.product.created', payload)
await sdk.events.emit(orgId, ProductCreatedEvent, payload)
await sdk.events.emit(input.orgId, ProductCreatedEvent, payload)
```

Reason:

```txt
Events are tenant-scoped facts.
Tenant scope must come from verified PlatformContext, never from client input.
```

This preserves the required sequence:

```txt
Authenticated user
  ↓
Verified organization membership
  ↓
Permission check
  ↓
Validated input
  ↓
Database mutation
  ↓
Event emission with verified PlatformContext
```

---

# 15. Permission Requirement

Events do not authorize mutations.

Permission checks happen before the mutation.

Example:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'create',
})

const product = await ProductService.create(ctx, input)
```

Then `ProductService.create()` emits:

```txt
objects.product.created
```

The event proves that an authorized mutation happened.

The event itself does not grant permission.

Forbidden:

```ts
// ❌ Do not emit event first and let listener decide if user had permission.
await sdk.events.emit(ctx, ProductCreatedEvent, ...)
await sdk.permissions.require(ctx, ...)
```

---

# 16. Module Enablement Requirement

Business Object APIs do not require a business module to be enabled by default.

Example:

```txt
/api/orgs/acme/objects/products
```

requires:

```txt
authenticated user
organization membership
objects.product.* permission
```

It does not require Inventory to be enabled.

Why?

Product is shared.

Purchasing, Sales, Reservations, and Inventory may all use Product.

However, if a Product is created through a module route, that module route must check module enablement first.

Example:

```txt
/api/orgs/acme/inventory/products
```

requires:

```txt
authenticated user
organization membership
Inventory enabled
inventory permissions if creating inventory extension behavior
objects.product.create if creating core Product
```

Correct combined flow:

```txt
Inventory route
  ↓
requireApiModuleContext(req, orgSlug, 'inventory')
  ↓
require objects.product.create
  ↓
require inventory.product_extension.create
  ↓
create Product + InventoryProductExtension
  ↓
emit objects.product.created
  ↓
emit inventory.product_extension.created
```

---

# 17. Event Emission Timing

For MVP, emit Business Object events after the database mutation succeeds.

Preferred simple pattern:

```ts
const product = await db.product.create({
  data: {
    orgId: ctx.org.id,
    code: input.code,
    name: input.name,
    categoryId: input.categoryId,
    unit: input.unit,
  },
})

await sdk.events.emit(ctx, ProductCreatedEvent, {
  source: { module: 'objects', service: 'ProductService' },
  entity: { type: 'product', id: product.id },
  payload: {
    productId: product.id,
    code: product.code,
    name: product.name,
    categoryId: product.categoryId,
    unit: product.unit,
  },
})

return product
```

If the mutation requires a transaction:

```ts
const product = await sdk.db.transaction(ctx, async (tx) => {
  return tx.product.create(...)
})

await sdk.events.emit(ctx, ProductCreatedEvent, ...)
```

Avoid emitting inside Prisma transactions in MVP:

```ts
// ❌ Avoid in MVP
await sdk.db.transaction(ctx, async (tx) => {
  const product = await tx.product.create(...)
  await sdk.events.emit(ctx, ProductCreatedEvent, ...)
})
```

Reason:

```txt
Listeners may read uncommitted data or fail while the transaction is still open.
```

Future Event Outbox will allow events to be written transactionally.

Do not build Event Outbox in MVP unless a frozen document authorizes it.

---

# 18. Combined Business Object + Extension Mutations

Sometimes a module creates a Business Object and a module extension table in one user action.

Example:

```txt
Inventory creates Product
  + InventoryProductExtension
```

Correct pattern:

```ts
const result = await sdk.db.transaction(ctx, async (tx) => {
  const product = await ProductRepository.createWithTx(tx, ctx, productInput)
  const extension = await InventoryProductRepository.createWithTx(tx, ctx, {
    productId: product.id,
    reorderPoint: input.reorderPoint,
  })

  return { product, extension }
})

await sdk.events.emit(ctx, ProductCreatedEvent, ...)
await sdk.events.emit(ctx, InventoryProductExtensionCreatedEvent, ...)
```

Rules:

```txt
1. Both records should succeed or fail together.
2. Emit events only after transaction commit.
3. Emit the Business Object event first.
4. Emit the module extension event second.
5. Use objects namespace for the Business Object event.
6. Use module namespace for the extension event.
```

Incorrect:

```txt
inventory.product.created
```

Correct:

```txt
objects.product.created
inventory.product_extension.created
```

---

# 19. Update Event Rules

Every Business Object update should emit an `updated` event.

Update payloads should include:

```txt
Record ID
Stable display fields after update
changedFields array
```

Example:

```ts
export const ProductUpdatedEvent = defineEvent({
  name: 'objects.product.updated',
  version: 1,
  payload: z.strictObject({
    productId: z.string(),
    code: z.string(),
    name: z.string(),
    categoryId: z.string().nullable(),
    unit: z.string(),
    changedFields: z.array(z.string()),
  }),
})
```

Do not include full before/after snapshots in MVP.

Why:

```txt
1. Some objects contain personal data.
2. Event payloads should stay small.
3. Full audit history is a future Audit Log Service concern.
```

If future Audit Logs require before/after values, that should be designed in the Audit Log Service document or Event Outbox document.

---

# 20. Delete and Restore Event Rules

OneDayOS uses soft delete for business data.

Therefore:

```txt
objects.product.deleted
```

means:

```txt
Product.deletedAt was set.
```

It does **not** mean the row was physically removed from the database.

Delete event payloads should include:

```txt
Record ID
Stable display name/code if safe
Deleted timestamp if useful
```

Example:

```ts
export const ProductDeletedEvent = defineEvent({
  name: 'objects.product.deleted',
  version: 1,
  payload: z.strictObject({
    productId: z.string(),
    code: z.string(),
    name: z.string(),
    deletedAt: z.string(),
  }),
})
```

Restore event payloads should include:

```txt
Record ID
Stable display name/code if safe
Restored timestamp if useful
```

Example:

```ts
export const ProductRestoredEvent = defineEvent({
  name: 'objects.product.restored',
  version: 1,
  payload: z.strictObject({
    productId: z.string(),
    code: z.string(),
    name: z.string(),
    restoredAt: z.string(),
  }),
})
```

Hard delete events are not part of MVP.

Forbidden in normal app code:

```txt
objects.product.hard_deleted
objects.customer.purged
objects.employee.destroyed
```

Hard deletion requires future data-retention/security policy.

---

# 21. Deactivation and Reactivation Rules

Some Business Objects have business lifecycle status separate from deletion.

MVP objects with explicit lifecycle status:

```txt
Employee.isActive
Warehouse.isActive
```

Events:

```txt
objects.employee.deactivated
objects.employee.reactivated
objects.warehouse.deactivated
objects.warehouse.reactivated
```

Deactivation payloads should include:

```txt
Record ID
Stable display fields
Reason if captured
Effective timestamp
```

Example:

```ts
export const EmployeeDeactivatedEvent = defineEvent({
  name: 'objects.employee.deactivated',
  version: 1,
  payload: z.strictObject({
    employeeId: z.string(),
    employeeNo: z.string(),
    name: z.string(),
    reason: z.string().nullable(),
    deactivatedAt: z.string(),
  }),
})
```

Do not add deactivation events to objects that do not have explicit active/inactive lifecycle fields.

---

# 22. Privacy and PII Rules

Business Object event payloads may contain personal or sensitive business information.

Payloads must be privacy-conscious.

General rules:

```txt
1. Do not include full Prisma records.
2. Do not include raw request bodies.
3. Do not include passwords, tokens, secrets, or service keys.
4. Do not include government IDs.
5. Do not include salary or payroll data.
6. Do not include bank details.
7. Do not include tax IDs unless a future accounting/tax document explicitly allows it.
8. Do not include unnecessary personal data.
9. Do not include client-supplied orgId.
10. Do not include unrelated nested entities.
```

Employee events must not include:

```txt
salary
government IDs
leave balances
attendance records
payroll data
medical details
emergency contact details
```

Customer events should avoid unnecessary PII.

Supplier events must not include:

```txt
bank account details
payment terms unless specifically part of a future Purchasing extension event
tax documents
confidential contract terms
```

When in doubt, emit IDs and safe display fields only.

---

# 23. Payload Schema Standards

Use `z.strictObject()` for all payloads.

Example:

```ts
const ProductCreatedPayloadSchema = z.strictObject({
  productId: z.string(),
  code: z.string(),
  name: z.string(),
  categoryId: z.string().nullable(),
  unit: z.string(),
})
```

Do not use loose schemas:

```ts
// ❌ Unknown fields can sneak in
z.object({ productId: z.string() })
```

Do not allow `orgId` in payload schemas:

```ts
// ❌ Forbidden
z.strictObject({
  orgId: z.string(),
  productId: z.string(),
})
```

Tenant metadata belongs in the envelope:

```ts
event.org.id
```

not in the payload.

---

# 24. Standard Payload Field Names

Use consistent field names across Business Object events.

| Object | ID Field | Display Fields |
|---|---|---|
| Employee | `employeeId` | `employeeNo`, `name` |
| Product | `productId` | `code`, `name` |
| ProductCategory | `productCategoryId` | `name`, `parentId` |
| Customer | `customerId` | `name` |
| Supplier | `supplierId` | `name` |
| Warehouse | `warehouseId` | `code`, `name` |

Do not use inconsistent aliases:

```txt
itemId
skuId
clientId
vendorId
locationId
```

Those may be meaningful inside modules, but Business Object events must use official Business Object names.

---

# 25. Employee Event Payloads

## 25.1 Employee Created

```ts
export const EmployeeCreatedEvent = defineEvent({
  name: 'objects.employee.created',
  version: 1,
  payload: z.strictObject({
    employeeId: z.string(),
    employeeNo: z.string(),
    name: z.string(),
    userId: z.string().nullable(),
    branchId: z.string().nullable(),
    departmentId: z.string().nullable(),
    position: z.string().nullable(),
    employmentType: z.string(),
  }),
})
```

## 25.2 Employee Updated

```ts
export const EmployeeUpdatedEvent = defineEvent({
  name: 'objects.employee.updated',
  version: 1,
  payload: z.strictObject({
    employeeId: z.string(),
    employeeNo: z.string(),
    name: z.string(),
    userId: z.string().nullable(),
    branchId: z.string().nullable(),
    departmentId: z.string().nullable(),
    position: z.string().nullable(),
    employmentType: z.string(),
    changedFields: z.array(z.string()),
  }),
})
```

## 25.3 Employee Deactivated

```ts
export const EmployeeDeactivatedEvent = defineEvent({
  name: 'objects.employee.deactivated',
  version: 1,
  payload: z.strictObject({
    employeeId: z.string(),
    employeeNo: z.string(),
    name: z.string(),
    reason: z.string().nullable(),
    deactivatedAt: z.string(),
  }),
})
```

## 25.4 Employee Reactivated

```ts
export const EmployeeReactivatedEvent = defineEvent({
  name: 'objects.employee.reactivated',
  version: 1,
  payload: z.strictObject({
    employeeId: z.string(),
    employeeNo: z.string(),
    name: z.string(),
    reactivatedAt: z.string(),
  }),
})
```

## 25.5 Employee Deleted

```ts
export const EmployeeDeletedEvent = defineEvent({
  name: 'objects.employee.deleted',
  version: 1,
  payload: z.strictObject({
    employeeId: z.string(),
    employeeNo: z.string(),
    name: z.string(),
    deletedAt: z.string(),
  }),
})
```

## 25.6 Employee Restored

```ts
export const EmployeeRestoredEvent = defineEvent({
  name: 'objects.employee.restored',
  version: 1,
  payload: z.strictObject({
    employeeId: z.string(),
    employeeNo: z.string(),
    name: z.string(),
    restoredAt: z.string(),
  }),
})
```

---

# 26. Product Event Payloads

## 26.1 Product Created

```ts
export const ProductCreatedEvent = defineEvent({
  name: 'objects.product.created',
  version: 1,
  payload: z.strictObject({
    productId: z.string(),
    code: z.string(),
    name: z.string(),
    categoryId: z.string().nullable(),
    unit: z.string(),
  }),
})
```

## 26.2 Product Updated

```ts
export const ProductUpdatedEvent = defineEvent({
  name: 'objects.product.updated',
  version: 1,
  payload: z.strictObject({
    productId: z.string(),
    code: z.string(),
    name: z.string(),
    categoryId: z.string().nullable(),
    unit: z.string(),
    changedFields: z.array(z.string()),
  }),
})
```

## 26.3 Product Deleted

```ts
export const ProductDeletedEvent = defineEvent({
  name: 'objects.product.deleted',
  version: 1,
  payload: z.strictObject({
    productId: z.string(),
    code: z.string(),
    name: z.string(),
    deletedAt: z.string(),
  }),
})
```

## 26.4 Product Restored

```ts
export const ProductRestoredEvent = defineEvent({
  name: 'objects.product.restored',
  version: 1,
  payload: z.strictObject({
    productId: z.string(),
    code: z.string(),
    name: z.string(),
    restoredAt: z.string(),
  }),
})
```

---

# 27. Product Category Event Payloads

## 27.1 Product Category Created

```ts
export const ProductCategoryCreatedEvent = defineEvent({
  name: 'objects.product_category.created',
  version: 1,
  payload: z.strictObject({
    productCategoryId: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
  }),
})
```

## 27.2 Product Category Updated

```ts
export const ProductCategoryUpdatedEvent = defineEvent({
  name: 'objects.product_category.updated',
  version: 1,
  payload: z.strictObject({
    productCategoryId: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    changedFields: z.array(z.string()),
  }),
})
```

## 27.3 Product Category Deleted

```ts
export const ProductCategoryDeletedEvent = defineEvent({
  name: 'objects.product_category.deleted',
  version: 1,
  payload: z.strictObject({
    productCategoryId: z.string(),
    name: z.string(),
    deletedAt: z.string(),
  }),
})
```

## 27.4 Product Category Restored

```ts
export const ProductCategoryRestoredEvent = defineEvent({
  name: 'objects.product_category.restored',
  version: 1,
  payload: z.strictObject({
    productCategoryId: z.string(),
    name: z.string(),
    restoredAt: z.string(),
  }),
})
```

---

# 28. Customer Event Payloads

## 28.1 Customer Created

```ts
export const CustomerCreatedEvent = defineEvent({
  name: 'objects.customer.created',
  version: 1,
  payload: z.strictObject({
    customerId: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
})
```

## 28.2 Customer Updated

```ts
export const CustomerUpdatedEvent = defineEvent({
  name: 'objects.customer.updated',
  version: 1,
  payload: z.strictObject({
    customerId: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    changedFields: z.array(z.string()),
  }),
})
```

## 28.3 Customer Deleted

```ts
export const CustomerDeletedEvent = defineEvent({
  name: 'objects.customer.deleted',
  version: 1,
  payload: z.strictObject({
    customerId: z.string(),
    name: z.string(),
    deletedAt: z.string(),
  }),
})
```

## 28.4 Customer Restored

```ts
export const CustomerRestoredEvent = defineEvent({
  name: 'objects.customer.restored',
  version: 1,
  payload: z.strictObject({
    customerId: z.string(),
    name: z.string(),
    restoredAt: z.string(),
  }),
})
```

Privacy note:

```txt
Customer address is intentionally excluded from MVP event payloads.
```

If a future module needs address-change events, design a dedicated event contract.

---

# 29. Supplier Event Payloads

## 29.1 Supplier Created

```ts
export const SupplierCreatedEvent = defineEvent({
  name: 'objects.supplier.created',
  version: 1,
  payload: z.strictObject({
    supplierId: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
})
```

## 29.2 Supplier Updated

```ts
export const SupplierUpdatedEvent = defineEvent({
  name: 'objects.supplier.updated',
  version: 1,
  payload: z.strictObject({
    supplierId: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    changedFields: z.array(z.string()),
  }),
})
```

## 29.3 Supplier Deleted

```ts
export const SupplierDeletedEvent = defineEvent({
  name: 'objects.supplier.deleted',
  version: 1,
  payload: z.strictObject({
    supplierId: z.string(),
    name: z.string(),
    deletedAt: z.string(),
  }),
})
```

## 29.4 Supplier Restored

```ts
export const SupplierRestoredEvent = defineEvent({
  name: 'objects.supplier.restored',
  version: 1,
  payload: z.strictObject({
    supplierId: z.string(),
    name: z.string(),
    restoredAt: z.string(),
  }),
})
```

Privacy note:

```txt
Supplier address is intentionally excluded from MVP event payloads.
```

Bank details, tax details, payment terms, and contract terms are forbidden in core Supplier event payloads.

---

# 30. Warehouse Event Payloads

## 30.1 Warehouse Created

```ts
export const WarehouseCreatedEvent = defineEvent({
  name: 'objects.warehouse.created',
  version: 1,
  payload: z.strictObject({
    warehouseId: z.string(),
    code: z.string(),
    name: z.string(),
    branchId: z.string().nullable(),
  }),
})
```

## 30.2 Warehouse Updated

```ts
export const WarehouseUpdatedEvent = defineEvent({
  name: 'objects.warehouse.updated',
  version: 1,
  payload: z.strictObject({
    warehouseId: z.string(),
    code: z.string(),
    name: z.string(),
    branchId: z.string().nullable(),
    changedFields: z.array(z.string()),
  }),
})
```

## 30.3 Warehouse Deactivated

```ts
export const WarehouseDeactivatedEvent = defineEvent({
  name: 'objects.warehouse.deactivated',
  version: 1,
  payload: z.strictObject({
    warehouseId: z.string(),
    code: z.string(),
    name: z.string(),
    reason: z.string().nullable(),
    deactivatedAt: z.string(),
  }),
})
```

## 30.4 Warehouse Reactivated

```ts
export const WarehouseReactivatedEvent = defineEvent({
  name: 'objects.warehouse.reactivated',
  version: 1,
  payload: z.strictObject({
    warehouseId: z.string(),
    code: z.string(),
    name: z.string(),
    reactivatedAt: z.string(),
  }),
})
```

## 30.5 Warehouse Deleted

```ts
export const WarehouseDeletedEvent = defineEvent({
  name: 'objects.warehouse.deleted',
  version: 1,
  payload: z.strictObject({
    warehouseId: z.string(),
    code: z.string(),
    name: z.string(),
    deletedAt: z.string(),
  }),
})
```

## 30.6 Warehouse Restored

```ts
export const WarehouseRestoredEvent = defineEvent({
  name: 'objects.warehouse.restored',
  version: 1,
  payload: z.strictObject({
    warehouseId: z.string(),
    code: z.string(),
    name: z.string(),
    restoredAt: z.string(),
  }),
})
```

Warehouse address is intentionally excluded from MVP payloads because most subscribers need identity/location linkage, not the full address.

If address-specific workflows are needed later, add a dedicated event contract.

---

# 31. Event Emission in Services

Business Object events must be emitted inside Business Object services, not in React components, API route handlers, or module UI code.

Correct:

```ts
export class ProductService {
  static async create(ctx: PlatformContext, input: CreateProductInput) {
    const db = sdk.getDb(ctx)

    const product = await db.product.create({
      data: {
        orgId: ctx.org.id,
        code: input.code,
        name: input.name,
        categoryId: input.categoryId,
        unit: input.unit,
      },
    })

    await sdk.events.emit(ctx, ProductCreatedEvent, {
      source: { module: 'objects', service: 'ProductService' },
      entity: { type: 'product', id: product.id },
      payload: {
        productId: product.id,
        code: product.code,
        name: product.name,
        categoryId: product.categoryId,
        unit: product.unit,
      },
    })

    return product
  }
}
```

Incorrect:

```ts
// ❌ API handler emits event instead of service
const product = await ProductService.create(ctx, input)
await sdk.events.emit(ctx, ProductCreatedEvent, ...)
```

Why service-level emission is required:

```txt
1. API route, server action, import job, or future CLI can all use same service.
2. Events cannot be forgotten by one caller.
3. Business rules stay centralized.
4. Tests are easier to write.
```

---

# 32. API Route Responsibilities

API routes should not manually construct Business Object event payloads.

API route responsibilities:

```txt
1. Resolve PlatformContext.
2. Validate route params.
3. Validate request body/query.
4. Reject client-supplied orgId.
5. Check permissions.
6. Call Business Object service.
7. Return API response.
```

Service responsibilities:

```txt
1. Perform database mutation.
2. Enforce service-level invariants.
3. Emit Business Object event.
```

Correct route pattern:

```ts
export async function POST(req: NextRequest, { params }: RouteParams) {
  return sdk.api.handle(req, async () => {
    const { orgSlug } = await params
    const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

    await sdk.permissions.require(ctx, {
      module: 'objects',
      resource: 'product',
      action: 'create',
    })

    const input = await sdk.api.parseJson(req, CreateProductSchema)
    const product = await ProductService.create(ctx, input)

    return sdk.api.created(product)
  })
}
```

---

# 33. Event Payloads Must Not Leak Tenant IDs

Do not include `orgId` in Business Object event payloads.

Forbidden:

```ts
payload: {
  orgId: ctx.org.id,
  productId: product.id,
}
```

Correct:

```ts
payload: {
  productId: product.id,
}
```

Tenant context lives in the event envelope:

```ts
event.org.id
```

Reason:

```txt
1. Prevents accidental client-supplied orgId propagation.
2. Keeps tenant metadata consistent.
3. Makes listeners depend on verified envelope context.
4. Avoids duplicate source-of-truth fields.
```

---

# 34. Event Payloads Must Not Include Permissions

Do not include role names, permission lists, or access decisions in Business Object payloads.

Forbidden:

```ts
payload: {
  productId: product.id,
  userPermissions: ctx.permissions,
}
```

Events are facts about business records.

Authorization metadata belongs to Kernel/security logs, not Business Object event payloads.

---

# 35. Listener Rules

Business Object event listeners must follow SDK event rules.

Allowed listener locations:

```txt
Platform Service server code
Module server event registration
Kernel server code for infrastructure-level listeners
Tests
```

Forbidden listener locations:

```txt
Client components
Browser SDK
React hooks
UI files
Direct imports from Business Object service internals
```

Listeners must:

```txt
1. Be idempotent.
2. Be tenant-aware.
3. Use event.org.id from envelope.
4. Never trust payload.orgId.
5. Never assume event delivery is durable in MVP.
6. Avoid critical side effects until durable outbox exists.
7. Avoid direct writes unless reviewed.
```

For MVP, listeners should mostly be used for:

```txt
Test assertions
Development logging
Simple non-critical internal hooks
```

Do not build a complex listener network before Platform Services are designed.

---

# 36. Event Listener Examples

Future Search listener:

```ts
sdk.events.on(ProductUpdatedEvent, async (event) => {
  const systemCtx = await sdk.auth.createSystemContextFromEvent(event, {
    service: 'search-indexer',
  })

  await SearchService.upsertDocument(systemCtx, {
    entityType: 'product',
    entityId: event.payload.productId,
    title: event.payload.name,
    subtitle: event.payload.code,
  })
})
```

Future Audit listener:

```ts
sdk.events.on(CustomerDeletedEvent, async (event) => {
  await AuditLogService.recordFromEvent(event)
})
```

Future AI listener:

```ts
sdk.events.on(EmployeeUpdatedEvent, async (event) => {
  await AiContextService.markEntityStale({
    orgId: event.org.id,
    entityType: 'employee',
    entityId: event.payload.employeeId,
  })
})
```

These services are deferred.

The event contracts make them possible later.

---

# 37. Manifest Declarations

Modules that listen to Business Object events must declare those listeners in their manifest.

Example:

```ts
export const InventoryModule = {
  id: 'inventory',
  events: {
    emits: [
      'inventory.stock_movement.created',
      'inventory.product_extension.created',
    ],
    listens: [
      'objects.product.created',
      'objects.product.updated',
      'objects.warehouse.created',
      'objects.warehouse.updated',
    ],
  },
}
```

Business Object event definitions themselves do not belong to module manifests because they are not module-owned.

However, future module review should check:

```txt
1. Module does not emit Business Object events directly unless calling Business Object service.
2. Module does not claim ownership of objects.* events.
3. Module declares every objects.* event it listens to.
4. Module tests confirm listeners are registered intentionally.
```

---

# 38. Import and Bulk Operation Events

Bulk import is deferred.

When import/export is designed later, event volume must be considered.

For MVP, do not add bulk import event contracts.

Future possible patterns:

```txt
objects.product.created        # one per created Product
objects.product.updated        # one per updated Product
objects.product_import.completed # future batch summary event, if needed
```

Do not implement:

```txt
objects.product.imported
objects.customer.imported
```

until the Import/Export Engine document defines:

```txt
batch IDs
row-level errors
partial success behavior
retry behavior
event volume control
audit requirements
```

---

# 39. Deduplication and Merge Events

Customer merge, Supplier merge, and Employee merge are deferred.

Do not implement:

```txt
objects.customer.merged
objects.supplier.merged
objects.employee.merged
```

until there is a dedicated merge/deduplication design.

Merge events are complex because they affect:

```txt
foreign keys
historical records
audit trails
permissions
search indexes
AI context
reporting
undo/restore behavior
```

For MVP, duplicate customers/suppliers are allowed.

---

# 40. Event Versioning

Every Business Object event definition starts with:

```txt
version: 1
```

Backward-compatible changes:

```txt
Adding optional payload field
Clarifying documentation
Adding a new event definition
Adding new optional metadata in envelope
```

Breaking changes:

```txt
Renaming event
Removing payload field
Renaming payload field
Changing payload field type
Changing payload field meaning
Making optional field required
Changing event semantics
```

Breaking changes require:

```txt
1. ADR or manual amendment.
2. New event version or new event name.
3. Subscriber migration plan.
4. Tests for old and new behavior if both are supported temporarily.
```

Do not silently change event payloads after subscribers exist.

---

# 41. Event Compatibility Policy

The event name plus version is a compatibility contract.

Example:

```txt
objects.product.created v1
```

If a future version adds optional `barcode`, that can remain v1 if optional and safe:

```ts
barcode: z.string().nullable().optional()
```

If a future version changes `code` semantics from SKU to global barcode, that is breaking.

Do not do it silently.

Either create:

```txt
objects.product.created v2
```

or introduce a different event if the meaning is different:

```txt
objects.product_identifier.changed
```

Only add new events when a real use case exists.

---

# 42. Events and Audit Logs

Audit Log Service is deferred.

But Business Object event contracts must already support future audit logging.

Minimum audit-friendly fields are in the envelope:

```txt
event.id
event.name
event.version
event.org.id
event.actor.userId
event.source.module
event.source.service
event.entity.type
event.entity.id
event.occurredAt
event.payload
```

Do not build audit tables in MVP.

Do not add full before/after snapshots to Business Object events just because Audit will exist later.

The correct future design may use:

```txt
Event Outbox
Audit Log Service
Field-level diff generation
Retention rules
Sensitive field redaction
```

That belongs in the Audit Log Service document.

---

# 43. Events and Search

Search Service is deferred.

But Business Object events should be sufficient for future indexing.

Likely future subscriptions:

```txt
objects.employee.created       → index employee
objects.employee.updated       → update employee search document
objects.employee.deleted       → remove employee from search
objects.product.created        → index product
objects.product.updated        → update product search document
objects.product.deleted        → remove product from search
objects.customer.created       → index customer
objects.supplier.created       → index supplier
objects.warehouse.created      → index warehouse
```

Payloads should include basic display fields so Search can update lightweight indexes.

Search may also fetch current data through a future system context.

Do not build Search Service in MVP.

---

# 44. Events and AI Context

AI Layer is deferred.

But AI will eventually need to know when important business entities change.

Business Object events allow future AI systems to:

```txt
refresh cached entity summaries
invalidate stale embeddings
update organization knowledge context
answer questions about current business records
track high-level changes
```

Business Object event payloads must not leak secrets or unnecessary PII into AI systems.

Future AI listeners must remain tenant-scoped:

```txt
event.org.id determines tenant context
permissions determine what AI may reveal
```

Do not build AI event consumers in MVP.

---

# 45. Events and Reporting

Reporting Service is deferred.

Business Object events may later be used to invalidate cached reports or update materialized summaries.

Examples:

```txt
objects.product.updated → invalidate product catalog report cache
objects.warehouse.deactivated → invalidate warehouse listing report
objects.customer.created → update customer count metric
```

Do not build reporting event consumers in MVP.

---

# 46. Events and Notifications

Notification Service is deferred.

Business Object events should not automatically notify users in MVP.

Do not directly send email/SMS/in-app notifications from Business Object services.

Wrong:

```ts
await ProductService.create(ctx, input)
await sendEmail(...)
```

Correct future pattern:

```txt
objects.product.created
  ↓
Notification Service evaluates configured rules
  ↓
Notification queued/delivered
```

Notification rules require a future Platform Service document.

---

# 47. Event Failure Behavior

Business Object mutation should not fail because a listener failed.

Mutation may fail if:

```txt
authentication fails
tenant membership fails
permission fails
input validation fails
database mutation fails
event definition is invalid
event payload schema is invalid
```

Mutation should not fail if:

```txt
one listener throws
future search indexing fails
future AI context refresh fails
future non-critical notification listener fails
```

MVP event bus should use listener isolation:

```ts
await Promise.allSettled(handlers.map((handler) => handler(event)))
```

and log failures.

---

# 48. Event Testing Requirements

Every Business Object service mutation must have event tests.

Required tests per Business Object:

```txt
create emits created event
update emits updated event with changedFields
delete emits deleted event
restore emits restored event
business-status transition emits deactivated/reactivated where applicable
failed validation does not emit event
failed permission does not emit event
failed database mutation does not emit event
payload does not include orgId
payload matches schema
source.module is objects
entity.type is correct
event emitted with verified PlatformContext
```

Security-sensitive tests require at least two organizations.

Required tenant tests:

```txt
Org A user cannot mutate Org B object
Org A mutation emits event with Org A envelope
Client-supplied orgId is rejected
Event payload cannot override envelope org
```

Permission tests:

```txt
User without objects.product.create cannot emit objects.product.created
User without objects.customer.update cannot emit objects.customer.updated
Admin wildcard works only inside verified org
```

---

# 49. Event Definition Tests

Every event definition file must have tests.

Test examples:

```txt
event name passes validation
invalid event name would fail validation
payload schema accepts valid payload
payload schema rejects unknown keys
payload schema rejects orgId
payload schema rejects wrong field types
event version is 1
```

Example:

```ts
it('rejects orgId in ProductCreated payload', () => {
  const result = ProductCreatedEvent.payloadSchema.safeParse({
    orgId: 'org_123',
    productId: 'prod_123',
    code: 'SKU-001',
    name: 'Sample',
    categoryId: null,
    unit: 'pcs',
  })

  expect(result.success).toBe(false)
})
```

---

# 50. Architecture Tests

The architecture check suite should prevent these patterns:

```txt
Business Object events defined inside src/modules/*
Module emits raw objects.* event without calling Business Object service
Client component imports sdk.events.emit
Event payload schema includes orgId
Event names do not match naming convention
Module imports @/kernel/events/* directly
Business Object service emits module namespace event for core object mutation
```

Recommended future checks:

```txt
npm run check:architecture
npm run test:events
```

---

# 51. Generated Code Requirements

When Claude or a future generator creates a Business Object service, it must include:

```txt
event definitions
payload schemas
service emission
event tests
payload schema tests
permission tests
tenant isolation tests
no orgId in payload
source.module = objects
correct entity.type
```

Generated module code must not define shared Business Object events.

If a module generator creates Inventory, it may define:

```txt
inventory.stock_movement.created
inventory.product_extension.created
```

It must not define:

```txt
objects.product.created
```

because that belongs to the Product Business Object service.

---

# 52. Claude Implementation Rules

When implementing Business Object event contracts, Claude must follow these rules:

```txt
1. Do not invent new event names.
2. Do not use module namespaces for shared Business Object events.
3. Do not include orgId in event payloads.
4. Do not include full Prisma records in payloads.
5. Do not emit events from client components.
6. Do not emit events from API routes when the service should emit them.
7. Do not import @/kernel/events inside Business Object or module code.
8. Use @/sdk/server for runtime emission.
9. Use @/sdk for shared event definition helpers.
10. Use z.strictObject() for all payload schemas.
11. Use verified PlatformContext.
12. Add tests for emission and non-emission.
13. Add tenant isolation tests.
14. Add permission denial tests.
15. Stop if the required event is not defined in this document.
```

If Claude needs an event not listed here, it must stop and request a manual amendment.

---

# 53. Forbidden Patterns

Forbidden:

```ts
// ❌ Business Object event under module namespace
'inventory.product.created'
```

Forbidden:

```ts
// ❌ Raw event string scattered in service code
await sdk.events.emit(ctx, 'objects.product.created', payload)
```

Use an event definition instead.

Forbidden:

```ts
// ❌ Loose orgId
await sdk.events.emit(input.orgId, ProductCreatedEvent, payload)
```

Forbidden:

```ts
// ❌ orgId in payload
payload: {
  orgId: ctx.org.id,
  productId: product.id,
}
```

Forbidden:

```ts
// ❌ Full Prisma record
payload: product
```

Forbidden:

```tsx
// ❌ Client-side event emission
'use client'
await sdk.events.emit(...)
```

Forbidden:

```ts
// ❌ Direct kernel event bus import
import { bus } from '@/kernel/events/bus'
```

Forbidden:

```ts
// ❌ Event emitted before successful database mutation
await sdk.events.emit(ctx, ProductCreatedEvent, ...)
const product = await db.product.create(...)
```

Forbidden:

```ts
// ❌ Delete event used for business deactivation
await sdk.events.emit(ctx, WarehouseDeletedEvent, ...)
// when only isActive changed to false
```

---

# 54. Minimal MVP Implementation Scope

For the restarted MVP, implement only:

```txt
Business Object event definitions
Payload schemas
Event emission in Business Object services
Event emission tests
Event definition tests
Architecture checks where practical
```

Do not implement:

```txt
Audit Log Service
Search Service
Notification Service
AI listener
Reporting listener
Event Outbox
Background jobs
Webhook delivery
Event replay UI
```

The MVP goal is to make future services possible without overbuilding now.

---

# 55. Recommended Implementation Order

When Claude reaches this subsystem, implement in this order:

```txt
1. Ensure SDK event helpers exist.
2. Create Business Object event definition files.
3. Add payload schema tests.
4. Add service emission tests.
5. Implement service-level event emission.
6. Add tenant/security non-emission tests.
7. Add architecture checks if available.
8. Run full test suite.
```

Do not implement listeners first.

Events must be emitted correctly before subscribers exist.

---

# 56. Review Checklist

Before freezing this document, confirm:

```txt
[ ] objects namespace is accepted.
[ ] ProductCategory events are accepted.
[ ] Employee deactivation vs deletion distinction is accepted.
[ ] Warehouse deactivation vs deletion distinction is accepted.
[ ] Customer/Supplier payload privacy level is accepted.
[ ] No orgId in payload rule is accepted.
[ ] Update events use changedFields, not before/after snapshots.
[ ] Extension-table events are module namespace events.
[ ] Bulk import events remain deferred.
[ ] Merge events remain deferred.
[ ] Event Outbox remains deferred.
```

---

# 57. Acceptance Criteria

This document is ready to freeze when:

```txt
1. Every Business Object has an official event list.
2. Every official event has a clear meaning.
3. Event namespace rules are unambiguous.
4. Event payload rules are privacy-conscious.
5. Payload examples are implementation-grade.
6. Service-level emission rules are clear.
7. Permission and tenant rules are clear.
8. Delete, restore, deactivate, and reactivate semantics are distinct.
9. Module extension event boundaries are clear.
10. Testing requirements are explicit.
11. Claude can implement without inventing event names.
```

Implementation is not allowed until this document is frozen.

---

# 58. Final Architectural Rule

A Business Object event is a stable platform contract.

It should be treated with the same seriousness as:

```txt
API route contract
Database migration
SDK function signature
Permission name
Module manifest field
```

Wrong event names and sloppy payloads create long-term platform debt.

Correct Business Object events allow OneDayOS to add Audit Logs, Search, AI, Reporting, Notifications, and Activity Feed later without rewriting the core platform.

The rule is simple:

```txt
Shared identity changes emit objects.* events.
Module-specific behavior changes emit module.* events.
No exceptions without ADR.
```
