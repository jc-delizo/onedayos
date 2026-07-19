# OneDayOS Engineering Manual — 06 Data — 03 Soft Delete & Archival

**Document ID:** `06-data/03-soft-delete-archival.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Date:** July 2026  
**Implementation Allowed:** No — freeze required before Claude Code implementation  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/02-sdk-db-access.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`

---

# 1. Purpose

This document defines how OneDayOS handles record deletion, restoration, archival, retention, and permanent deletion.

Soft delete is not a small implementation detail. In a multi-tenant business operating system, deletion affects:

- data safety;
- auditability;
- reporting correctness;
- support recovery;
- client trust;
- regulatory readiness;
- platform consistency;
- AI/search/reporting safety;
- database performance over time.

The goal is to prevent accidental data loss while keeping normal application behavior simple:

```txt
Normal users do not see deleted records.
Support/admin users can recover records when allowed.
Hard deletion is rare, explicit, and controlled.
```

---

# 2. Core Doctrine

OneDayOS uses **record-level soft deletion** for business data.

Soft-deleted records remain in the database but are excluded from normal application queries.

```txt
Active record:
  deletedAt = null

Soft-deleted record:
  deletedAt = timestamp
  deletedBy = user id or system actor id
```

The previous Kernel implementation already used `deletedAt` / `deletedBy` on business entities and documented that `$extends` coverage was incomplete for some Prisma query types. The restarted platform must keep the useful soft-delete idea but must not rely on a partial Prisma extension as the only protection.

---

# 3. The Difference Between `isActive` and Soft Delete

This distinction is mandatory.

## 3.1 `isActive`

`isActive` means the record still exists, but its business status is inactive.

Examples:

```txt
Employee is no longer employed.
User account is disabled.
Organization subscription is suspended.
Supplier is no longer used.
Product is discontinued.
```

The record is still valid business history.

## 3.2 `deletedAt`

`deletedAt` means the record has been removed from normal operational use.

Examples:

```txt
Duplicate record was removed.
Wrong customer was created by mistake.
Test product was created in production.
Erroneous warehouse record should not appear.
```

A deleted record should not appear in normal lists, selectors, reports, search results, or AI context.

## 3.3 Rule

Do not use `isActive` as a deletion flag.

Do not use `deletedAt` as a business-status flag.

---

# 4. Scope

This document applies to every tenant-scoped business table and operational data table.

## 4.1 Applies To

Soft delete applies to:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
Branch
Department
module-owned business records
module extension tables
attachments metadata, when introduced
comments, when introduced
activity-feed records, when introduced, if user-facing deletion is allowed
```

## 4.2 Usually Does Not Apply To

Soft delete usually does not apply to immutable system/event records:

```txt
audit logs
event outbox records
security logs
background job attempts
billing ledger entries
```

Those records should use retention/archival policies, not user-facing soft deletion.

## 4.3 Depends on Business Semantics

Some tables need case-by-case rules:

```txt
User
Role
Permission
OrgModule
Subscription
Setting
```

For these, deletion may be replaced by disable/deactivate behavior because deleting them can affect security, billing, and configuration history.

---

# 5. Required Schema Fields

Every soft-deletable model must include:

```prisma
deletedAt DateTime?
deletedBy String?
```

Recommended full lifecycle fields:

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
deletedAt DateTime?
deletedBy String?
```

For tenant-scoped models:

```prisma
orgId String
```

## 5.1 `deletedBy`

`deletedBy` should normally store the platform `User.id` of the user who deleted the record.

For system-driven deletion, use a stable system actor string:

```txt
system
migration
support
retention_policy
```

Do not store email addresses in `deletedBy`.

Do not store display names in `deletedBy`.

Use stable identifiers.

---

# 6. Soft Delete Query Rule

Normal reads must exclude records where `deletedAt` is not null.

The safe default condition is:

```ts
where: {
  orgId: ctx.org.id,
  deletedAt: null,
}
```

However, module authors should not repeatedly hand-code this pattern everywhere.

Instead, tenant-scoped access should go through the SDK database layer:

```ts
const db = sdk.getDb(ctx)
```

and approved helpers/repositories should apply tenant scoping and deletion scoping.

---

# 7. Do Not Rely Only on Prisma `$extends`

Prisma `$extends` may be used as a defensive convenience, but it must not be the only soft-delete mechanism.

The previous MVP documented that the soft-delete extension covered only some read methods and could be bypassed by:

```txt
findUnique
findUniqueOrThrow
findFirstOrThrow, depending on implementation
aggregate
groupBy
nested include reads
some relation reads
raw SQL
```

For the restarted build, soft-delete safety must be implemented through layered controls:

```txt
1. schema convention
2. SDK/repository query helpers
3. lint/architecture rules
4. tests
5. optional Prisma extension as extra defense
```

Prisma `$extends` can reduce mistakes, but it cannot be the platform’s only line of defense.

---

# 8. Allowed Read Patterns

## 8.1 List Records

Allowed:

```ts
const records = await db.product.findMany({
  where: {
    orgId: ctx.org.id,
    deletedAt: null,
  },
  orderBy: { createdAt: 'desc' },
})
```

Preferred through repository/helper:

```ts
const records = await sdk.data.product.list(ctx, filters)
```

if a repository abstraction exists for that object.

## 8.2 Get One Record

Allowed:

```ts
const product = await db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Forbidden:

```ts
await db.product.findUnique({
  where: { id: productId },
})
```

`findUnique({ where: { id } })` is dangerous for tenant-scoped records because it can bypass both tenant scoping and soft-delete scoping.

## 8.3 Get Deleted Record for Restore

Allowed only in explicit restore/admin paths:

```ts
const product = await db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.org.id,
    deletedAt: { not: null },
  },
})
```

This must require an explicit restore/admin permission.

---

# 9. Forbidden Query Patterns

The following are forbidden in module code and generated code.

## 9.1 Raw Prisma Import

```ts
import { prisma } from '@/kernel/db/client'
```

Modules must use:

```ts
import { sdk } from '@/sdk/server'
```

## 9.2 Loose Tenant ID

```ts
sdk.getDb(orgId)
```

Use:

```ts
sdk.getDb(ctx)
```

## 9.3 Client-Supplied Tenant ID

```ts
const orgId = body.orgId
```

Use verified context:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

## 9.4 Tenant-Scoped `findUnique` by ID

```ts
await db.customer.findUnique({ where: { id } })
```

Use:

```ts
await db.customer.findFirst({
  where: { id, orgId: ctx.org.id, deletedAt: null },
})
```

## 9.5 Hard Delete Business Data

```ts
await db.product.delete({ where: { id } })
```

Use soft delete:

```ts
await db.product.update({
  where: { id },
  data: {
    deletedAt: new Date(),
    deletedBy: ctx.user.id,
  },
})
```

But even this update should be done through a tenant-scoped helper that first verifies `orgId`.

---

# 10. Delete Operation Contract

A soft delete is a mutation.

Every delete operation must perform these steps:

```txt
1. Authenticate user.
2. Resolve verified PlatformContext.
3. Verify organization membership.
4. Verify module enablement when module-owned.
5. Verify delete permission.
6. Find target record by id + orgId + deletedAt null.
7. Reject if record does not exist.
8. Check relationship constraints.
9. Set deletedAt and deletedBy.
10. Emit deletion event.
11. Return API response using { data, error }.
```

Example service shape:

```ts
export async function deleteProduct(ctx: PlatformContext, productId: string) {
  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'product',
    action: 'delete',
  })

  const db = sdk.getDb(ctx)

  const product = await db.product.findFirst({
    where: {
      id: productId,
      orgId: ctx.org.id,
      deletedAt: null,
    },
  })

  if (!product) {
    throw sdk.errors.notFound('PRODUCT_NOT_FOUND', 'Product not found.')
  }

  const deleted = await db.product.update({
    where: { id: product.id },
    data: {
      deletedAt: new Date(),
      deletedBy: ctx.user.id,
    },
  })

  await sdk.events.emit(ctx, 'objects.product.deleted', {
    productId: product.id,
  })

  return deleted
}
```

Important: the update uses `where: { id: product.id }` only after a tenant-scoped lookup has verified the record belongs to the current organization and is not already deleted.

---

# 11. Restore Operation Contract

Restore is also a mutation.

Restore must require a separate permission from delete.

Suggested action:

```txt
restore
```

Example permission:

```txt
objects.product.restore
```

Every restore operation must perform these steps:

```txt
1. Authenticate user.
2. Resolve verified PlatformContext.
3. Verify organization membership.
4. Verify restore permission.
5. Find target record by id + orgId + deletedAt not null.
6. Check uniqueness conflicts.
7. Set deletedAt null and deletedBy null.
8. Emit restored event.
9. Return API response using { data, error }.
```

## 11.1 Uniqueness Conflict During Restore

Restore can fail if a replacement record was created after deletion.

Example:

```txt
Product A code = SKU-001
Product A is deleted
New Product B code = SKU-001 is created
User tries to restore Product A
```

The restore must fail with a conflict:

```json
{
  "data": null,
  "error": {
    "code": "RESTORE_CONFLICT",
    "message": "This record cannot be restored because another active record already uses the same unique value."
  }
}
```

Do not silently change codes/names during restore.

---

# 12. Relationship Constraints

Soft deletion must respect relationships.

## 12.1 Restrict Delete

Some records should not be deletable while active child records depend on them.

Example:

```txt
Do not delete a Warehouse if active stock balances exist.
Do not delete a Product if active stock movements depend on it.
Do not delete a Department if active employees still belong to it.
```

In these cases, return:

```json
{
  "data": null,
  "error": {
    "code": "DELETE_RESTRICTED",
    "message": "This record cannot be deleted because it is still used by active records."
  }
}
```

## 12.2 Allow Delete With Historical References

Historical records may continue to reference a deleted record.

Example:

```txt
A deleted Product may still appear in old stock movements.
A deleted Supplier may still appear in old purchase orders.
A deactivated Employee may still appear in historical approvals.
```

Do not destroy history to make deletion easy.

## 12.3 Avoid Cascading Soft Delete by Default

Do not automatically soft-delete child records unless the business semantics are obvious and documented.

Default:

```txt
Parent deletion is restricted if active children exist.
```

Exception example:

```txt
Deleting a draft import batch may delete draft import rows.
```

Such exceptions require module-specific documentation.

---

# 13. Business Object Events

Every soft delete or restore of a Business Object must emit an event.

Required examples:

```txt
objects.employee.deleted
objects.employee.restored
objects.product.deleted
objects.product.restored
objects.customer.deleted
objects.customer.restored
objects.supplier.deleted
objects.supplier.restored
objects.warehouse.deleted
objects.warehouse.restored
```

Module-owned entities should emit module events:

```txt
inventory.stock_adjustment.deleted
inventory.stock_adjustment.restored
crm.deal.deleted
crm.deal.restored
```

Events must be emitted through the server SDK:

```ts
await sdk.events.emit(ctx, 'objects.product.deleted', {
  productId: product.id,
})
```

Events are facts, not commands.

Do not emit:

```txt
objects.product.delete
```

Use past tense:

```txt
objects.product.deleted
```

---

# 14. API Behavior

Delete and restore APIs must follow the Kernel API contract.

## 14.1 Delete Success

```json
{
  "data": {
    "id": "product_123",
    "deletedAt": "2026-07-04T00:00:00.000Z"
  },
  "error": null
}
```

Recommended status:

```txt
200 OK
```

Do not use `204 No Content`, because OneDayOS APIs should consistently return `{ data, error }`.

## 14.2 Restore Success

```json
{
  "data": {
    "id": "product_123",
    "deletedAt": null
  },
  "error": null
}
```

## 14.3 Not Found

For normal users, deleted records should behave as not found unless the endpoint explicitly supports deleted-record access.

```json
{
  "data": null,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found."
  }
}
```

## 14.4 Permission Denied

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to delete this record."
  }
}
```

## 14.5 Delete Restricted

```json
{
  "data": null,
  "error": {
    "code": "DELETE_RESTRICTED",
    "message": "This record cannot be deleted because it is still used by active records."
  }
}
```

---

# 15. UI Behavior

## 15.1 Normal Lists

Normal lists exclude deleted records.

```txt
Products page → active/non-deleted products only
Customers page → active/non-deleted customers only
Employees page → active/non-deleted employee records only
```

## 15.2 Deleted Records View

A deleted-records view is optional for MVP.

If implemented, it must be permission-gated.

Suggested route:

```txt
/[orgSlug]/settings/data/deleted-records
```

or module-specific:

```txt
/[orgSlug]/inventory/products/deleted
```

Do not expose deleted records to normal users by accident.

## 15.3 Confirmation Copy

Soft delete confirmation should be clear but not overly dramatic.

Example:

```txt
Delete product?
This will remove the product from normal lists. Historical records will be preserved.
```

For restricted deletion:

```txt
This product cannot be deleted because it has stock movement history.
```

## 15.4 Optimistic UI

Delete actions may use optimistic UI, but they must rollback on failure.

Example behavior:

```txt
User clicks Delete
Row disappears immediately
Server rejects because delete is restricted
Row returns
Toast shows reason
```

---

# 16. Search, Reporting, AI, and Exports

Soft-deleted records must be excluded from all normal derived outputs.

## 16.1 Search

Search indexes must exclude deleted records by default.

If a record is soft-deleted, future search service should either:

```txt
remove it from index
```

or mark it hidden:

```txt
deletedAt != null → do not return in normal results
```

## 16.2 Reporting

Operational reports exclude deleted records unless the report intentionally includes historical data.

Example:

```txt
Current Products Report → exclude deleted products
Historical Stock Movements Report → may show names of deleted products as historical references
```

## 16.3 AI Context

AI context must exclude deleted records by default.

The AI must not answer from deleted records unless the user has permission and explicitly asks about deleted/archive data.

## 16.4 Exports

Normal exports exclude deleted records.

Deleted-record exports require explicit permission.

---

# 17. Archival

Soft delete is not the same as archival.

## 17.1 Soft Delete

Soft delete means hidden from normal operations but still recoverable.

## 17.2 Archive

Archive means old data is retained for history/compliance/performance but no longer part of active workflows.

Possible future archive fields:

```prisma
archivedAt DateTime?
archivedBy String?
archiveReason String?
```

Do not implement archive fields in MVP unless a specific module needs them.

## 17.3 Retention

Retention means data may be permanently removed or moved after a defined period.

Retention policy is deferred.

For MVP:

```txt
Do not automatically hard-delete client business records.
```

---

# 18. Hard Delete Policy

Hard deletion means removing a record from the database.

Hard delete is forbidden for normal business operations.

## 18.1 Allowed Hard Delete Cases

Hard delete may be allowed only for:

```txt
failed registration cleanup
test data in local/dev environments
rollback of failed seed/migration in development
security/legal deletion after explicit approval
short-lived technical records designed for deletion
```

## 18.2 Forbidden Hard Delete Cases

Forbidden in normal production module code:

```txt
Product
Customer
Supplier
Warehouse
Employee
Inventory movements
Purchase requests
Leave requests
Expense claims
Incident reports
Audit logs
```

## 18.3 Hard Delete Requires ADR or Runbook

Any production hard-delete process for client data requires:

```txt
1. documented reason
2. affected org
3. affected records
4. backup verification
5. approval
6. execution log
7. post-delete verification
```

For MVP, this can be a manual operations runbook, not a full product feature.

---

# 19. Unique Constraints and Soft Delete

Unique constraints need careful design.

## 19.1 Simple Tenant Unique Constraint

Example:

```prisma
@@unique([orgId, code])
```

Problem:

```txt
Deleted Product uses code SKU-001.
User tries to create new Product with code SKU-001.
Database blocks it.
```

This may be acceptable for MVP because it avoids complex partial indexes.

## 19.2 Partial Unique Index Future

PostgreSQL supports partial unique indexes such as:

```sql
CREATE UNIQUE INDEX products_org_code_active_unique
ON products (org_id, code)
WHERE deleted_at IS NULL;
```

Prisma schema support for partial indexes may require manual migration SQL.

Manual SQL migrations are normally discouraged, but partial indexes may become justified later through an ADR.

## 19.3 MVP Decision

For MVP:

```txt
Use normal Prisma unique constraints.
Accept that deleted records may reserve unique values.
```

If clients need to reuse codes after deletion, create a future ADR for partial unique indexes.

Do not solve this prematurely.

---

# 20. Module-Owned Records

Every module-owned business table should follow the same lifecycle.

Example:

```prisma
model InventoryStockAdjustment {
  id        String   @id @default(cuid())
  orgId     String
  number    String
  status    String
  reason    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  deletedBy String?

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, number])
  @@index([orgId, deletedAt])
  @@map("inventory_stock_adjustments")
}
```

Generated module models must include:

```txt
orgId
createdAt
updatedAt, when mutable
deletedAt
deletedBy
```

unless the module spec explicitly says the entity is immutable and non-deletable.

---

# 21. Immutable Records

Some records should not be soft-deletable through normal UI.

Examples:

```txt
stock movements
financial ledger entries
approval history
audit logs
security logs
```

These are append-only historical records.

If a mistake happens, create a reversal/correction record rather than deleting the original.

Example:

```txt
Wrong stock movement created
→ create reversing stock movement
→ do not delete original movement
```

Module specs must explicitly classify records as:

```txt
mutable + soft-deletable
mutable + non-deletable
append-only
system/internal
```

---

# 22. Settings and Configuration

Settings should generally not be soft-deleted.

For settings:

```txt
update value
reset to default
remove key only through controlled admin path
```

If settings history becomes important, use a future settings audit/versioning table.

Do not add `deletedAt` to every configuration table blindly.

---

# 23. Roles, Permissions, and Users

## 23.1 Users

User accounts should usually be deactivated, not deleted.

```txt
User.isActive = false
```

This preserves audit and history.

## 23.2 Employees

Employee records can be inactive or soft-deleted, depending on meaning:

```txt
Employee resigned
→ isActive = false

Duplicate employee record created by mistake
→ deletedAt = timestamp
```

## 23.3 Roles

System roles should not be deleted.

Custom roles may be disabled or deleted only if no users depend on them.

Role deletion must not accidentally erase permission history if audit logs exist later.

## 23.4 Permissions

Permission rows may be changed by role-management UI.

Permission changes should eventually emit audit events, but full audit service is deferred.

---

# 24. Branches and Departments

Branch and Department are Kernel org-structure primitives.

They may be soft-deleted, but deletion must be restricted if active records depend on them.

Examples:

```txt
Cannot delete Branch with active Employees.
Cannot delete Department with active Employees.
Cannot delete Branch with active Warehouses.
```

Alternative actions:

```txt
rename
merge, future
deactivate, future if needed
```

Do not automatically delete employees when a department is deleted.

---

# 25. Business Objects

Business Objects are shared across modules, so deletion has wider consequences.

## 25.1 Product

Deleting a Product should be restricted if active operational records depend on it.

Inventory-specific rule example:

```txt
Product with stock balances or stock movements should not be deleted.
```

Alternative:

```txt
Mark product discontinued through module extension/status.
```

## 25.2 Customer

Deleting a Customer should be restricted if active deals, reservations, invoices, or support records exist.

For MVP, if those modules do not exist yet, the Customer deletion service can check only known dependencies.

## 25.3 Supplier

Deleting a Supplier should be restricted if active purchase requests/orders exist.

## 25.4 Warehouse

Deleting a Warehouse should be restricted if active stock balances exist.

## 25.5 Employee

Deleting an Employee should be rare.

Normal offboarding should use:

```txt
isActive = false
```

not soft delete.

Soft delete is for erroneous employee records.

---

# 26. Deleted Record Visibility

Deleted records may only be visible in explicit deleted/archive views.

Required access control:

```txt
read_deleted
restore
hard_delete, future super-admin only
```

Suggested permissions:

```txt
objects.product.read_deleted
objects.product.restore
objects.customer.read_deleted
objects.customer.restore
```

For MVP, simpler permissions may be used:

```txt
objects.*.restore
```

but must still be organization-scoped.

Admin wildcard may grant these permissions, but only within the verified organization.

---

# 27. Error Codes

Use standard error codes for lifecycle operations.

```txt
NOT_FOUND
FORBIDDEN
VALIDATION_ERROR
DELETE_RESTRICTED
ALREADY_DELETED
NOT_DELETED
RESTORE_CONFLICT
HARD_DELETE_FORBIDDEN
```

Module-specific errors may include entity prefixes:

```txt
PRODUCT_NOT_FOUND
PRODUCT_DELETE_RESTRICTED
PRODUCT_RESTORE_CONFLICT
```

Error messages should be user-safe and should not reveal cross-tenant existence.

---

# 28. Testing Requirements

Every soft-deletable entity must have tests for:

```txt
list excludes deleted records
get one excludes deleted records
delete sets deletedAt and deletedBy
delete requires permission
delete requires tenant context
delete cannot affect another org
deleted record cannot be deleted again without clear behavior
restore requires permission
restore cannot affect another org
restore fails on uniqueness conflict, if applicable
normal search/report/export excludes deleted records, when implemented
```

## 28.1 Minimum Cross-Tenant Test

Every deletion test suite must include at least two organizations.

Example:

```txt
Org A Product P1
Org B Product P2
User from Org A attempts to delete P2
Expected: safe 404 or 403, and P2 remains unchanged
```

Prefer safe `404 NOT_FOUND` for wrong-org object access to avoid leaking existence.

## 28.2 Permission Test

Every delete endpoint must test:

```txt
Admin with delete permission → success
Staff without delete permission → 403
Unauthenticated user → 401 JSON
Wrong-org user → 404 or 403, no mutation
```

## 28.3 Soft Delete Query Test

Tests must prove that normal list/get operations exclude deleted records.

Avoid tautological tests that only test a copied condition in isolation.

Bad test:

```ts
expect({ deletedAt: null }).toEqual({ deletedAt: null })
```

Good test:

```txt
Create active record
Create deleted record
Call service.list(ctx)
Assert only active record is returned
```

---

# 29. Architecture Enforcement

The architecture check should eventually block these patterns:

```txt
import { prisma } from '@/kernel/db/client' inside src/modules
sdk.getDb(orgId)
where: { id } on tenant-scoped model reads in modules
.delete( on soft-deletable business models
.deleteMany( on soft-deletable business models
request body schema containing orgId for tenant-scoped create/update
deletedAt omitted from normal tenant-scoped list queries, if not using approved helper
```

This can be implemented gradually through:

```txt
ESLint rules
custom check:architecture script
code review checklist
generator templates
tests
```

---

# 30. Generator Requirements

The module generator must produce soft-delete-safe code.

Generated services must use:

```ts
static async delete(ctx: PlatformContext, id: string) {
  // tenant-scoped lookup first
  // permission check
  // soft delete
  // event emission
}
```

Generated code must not produce:

```ts
static async delete(id: string) {
  await prisma.model.delete({ where: { id } })
}
```

Generated API routes must use:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, moduleId)
```

not:

```ts
const orgId = req.nextUrl.searchParams.get('orgId')
```

---

# 31. Operations and Support

Soft delete gives AppCare an important support capability:

```txt
Client accidentally deletes a record.
Support can restore it if permitted.
```

For MVP, restoration may be internal/admin-only rather than a polished client UI.

Minimum support runbook:

```txt
1. Confirm client/org.
2. Confirm user requesting restore has authority.
3. Identify record by id/name/timestamp.
4. Confirm record belongs to org.
5. Check uniqueness conflicts.
6. Restore record.
7. Log support action.
```

Do not restore records across organizations.

Do not restore based only on display name.

---

# 32. Performance and Indexing

Soft-deletable tenant tables should usually include indexes that support active-record queries.

Recommended indexes:

```prisma
@@index([orgId, deletedAt])
@@index([orgId, createdAt])
```

For common lookups:

```prisma
@@index([orgId, name])
@@index([orgId, code])
```

For large tables, consider future partial indexes on active records.

Do not add too many indexes prematurely; add based on actual query patterns.

---

# 33. Future RLS Compatibility

When Row Level Security is added later, soft-delete rules should remain in application queries.

RLS should protect tenant boundaries, not replace application-level logic.

Potential future RLS policies:

```sql
org_id = current_setting('app.org_id')
```

Soft-delete visibility could be handled separately:

```sql
deleted_at IS NULL
```

But be careful: admin restore views need deleted-record access.

For MVP, implement soft-delete filtering in the application/SDK layer and tests.

---

# 34. Claude Code Implementation Rules

When implementing this document, Claude Code must follow these rules:

```txt
1. Do not import Prisma directly inside modules.
2. Do not implement hard delete for business records.
3. Do not use sdk.getDb(orgId).
4. Do not accept orgId from client payloads.
5. Do not use findUnique({ where: { id } }) for tenant-scoped records.
6. Do not rely only on Prisma $extends for soft-delete filtering.
7. Add two-org tests for every delete/restore path.
8. Add permission-denial tests for every delete/restore path.
9. Emit events for Business Object mutations.
10. Use API-safe JSON errors only.
```

If the manual is ambiguous, Claude must stop and ask for architectural clarification rather than inventing behavior.

---

# 35. Acceptance Criteria

This document is ready to freeze when it clearly defines:

```txt
[ ] Difference between isActive and deletedAt
[ ] Required schema fields
[ ] Normal read behavior
[ ] Delete operation contract
[ ] Restore operation contract
[ ] Hard-delete policy
[ ] Relationship constraint policy
[ ] Event requirements
[ ] API behavior
[ ] UI behavior
[ ] Search/report/AI/export behavior
[ ] Test requirements
[ ] Generator requirements
[ ] Forbidden patterns
```

The implementation is done only when:

```txt
[ ] All soft-deletable models include deletedAt/deletedBy
[ ] Normal reads exclude deleted records
[ ] Delete services set deletedAt/deletedBy
[ ] Restore services clear deletedAt/deletedBy where implemented
[ ] Delete APIs enforce auth, tenant, module, and permission gates
[ ] Wrong-org delete attempts fail safely
[ ] Hard delete is absent from module business code
[ ] Tests cover at least two organizations
[ ] Architecture check blocks forbidden patterns
[ ] npm run lint passes
[ ] npm run typecheck passes
[ ] npm run test:run passes
[ ] npm run build passes
```

---

# 36. Final Position

Soft delete is mandatory for OneDayOS business data, but it must be implemented deliberately.

The restarted platform should not repeat the old MVP pattern where soft-delete behavior existed but was only partially enforced through Prisma query extension coverage.

The correct OneDayOS position is:

```txt
Soft delete is a platform lifecycle contract.
It is enforced through SDK patterns, service contracts, tests, and architecture checks.
Prisma extensions may help, but they are not the source of truth.
```

This protects client data, supports AppCare recovery, keeps reports/search/AI clean, and preserves the long-term operating-system model of OneDayOS.
