# OneDayOS Engineering Manual — Supplier Business Object

**Document ID:** `07-business-objects/04-supplier.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Author:** ChatGPT / OneDayOS Architecture Partner  
**Date:** July 2026  
**Implementation Allowed:** `No — freeze required before implementation`  
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
- `05-sdk/04-sdk-events.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/03-customer.md`

---

# 1. Purpose

This document defines the **Supplier** Business Object for OneDayOS.

A Supplier is a shared business entity representing a person, company, vendor, contractor, service provider, distributor, or other external party from whom the organization may purchase goods or services.

Supplier is a **Business Object**, not a module-owned entity.

That means:

```txt
Supplier = shared vendor/provider identity
Purchasing = purchase request/order behavior around Supplier
Inventory = stock sourcing behavior around Supplier
Expenses = vendor billing/payment behavior around Supplier
Assets = maintenance/service provider behavior around Supplier
Projects = subcontractor/vendor behavior around Supplier
```

No module owns Supplier.

No module may define its own duplicate Supplier table.

---

# 2. Architectural Position

Supplier belongs to this layer:

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

Supplier sits in the **Business Objects** layer.

It is conceptually separate from Kernel, even if physically colocated in the same Prisma schema during the MVP implementation.

## 2.1 Why Supplier is not Purchasing-owned

A common mistake would be to create Supplier inside the Purchasing module.

That would be wrong because Supplier is likely to be reused by multiple modules:

```txt
Purchasing → purchase orders, purchase requests, RFQs
Inventory → preferred product suppliers, stock replenishment
Expenses → vendor bills, expense payees
Assets → maintenance providers, warranty vendors
Projects → subcontractors, service providers
```

If Purchasing owns Supplier, other modules eventually need to either import Purchasing or create their own supplier table.

Both are forbidden.

The correct pattern is:

```txt
Business Object:
Supplier

Module-owned behavior:
PurchasingSupplierExtension
InventorySupplierProduct
ExpenseVendorExtension
AssetServiceProviderExtension
```

---

# 3. Core Rule

Supplier is the **lowest-common-denominator provider identity** used across modules.

Core Supplier should contain only fields that are broadly useful wherever a supplier/vendor/provider needs to be identified.

When in doubt, leave the field out of core Supplier.

Module-specific supplier details belong in module-owned extension tables.

---

# 4. Definition

A Supplier is:

```txt
An external person, company, vendor, distributor, contractor, service provider, subcontractor, or organization that provides goods or services to the client organization.
```

A Supplier may provide:

```txt
Physical goods
Inventory stock
Raw materials
Office supplies
Professional services
Repairs
Maintenance
Transport
Contract labor
Project subcontracting
Utilities or recurring services
```

A Supplier is scoped to one OneDayOS Organization.

The same real-world supplier may exist in multiple client organizations, but each client has its own Supplier record.

---

# 5. Supplier Is Not Customer

Supplier and Customer are separate Business Objects in MVP.

A company may be both a customer and a supplier in real life, but OneDayOS should not prematurely merge Customer and Supplier into a generic `Party` or `Contact` abstraction.

For MVP:

```txt
If Acme Corp buys from the organization:
→ Customer record

If Acme Corp sells to the organization:
→ Supplier record

If Acme Corp does both:
→ Customer record + Supplier record
```

This is intentionally simple.

## 5.1 Why not create a generic Party model now?

A generic `Party` abstraction sounds elegant, but it creates unnecessary complexity too early:

```txt
Party
  → Customer role
  → Supplier role
  → Contact role
  → Employee role?
  → User role?
```

That abstraction may be useful later, but it is not needed for the first platform build.

The MVP should avoid creating a generic CRM/accounting-style master-data engine before real module patterns prove the need.

Future promotion to a `Party` abstraction requires an ADR.

---

# 6. Supplier Is Not User

Supplier is not a platform login identity.

```txt
User = someone who logs in to OneDayOS
Supplier = external provider/vendor identity
```

Supplier portal access is deferred.

If OneDayOS later supports vendor portals, portal identities should be designed separately and linked to Supplier records through an explicit access model.

Do not add login fields, passwords, auth IDs, or portal state to core Supplier.

---

# 7. Supplier Is Not Employee

Supplier is not an Employee.

Contractors create a useful edge case.

For MVP:

```txt
A contractor who works like internal personnel:
→ Employee record with employmentType = contractor

A contractor/company who provides services externally:
→ Supplier record

A person/company that needs both contexts:
→ Employee record + Supplier record, linked later only if a real need appears
```

Do not force all contractors into Supplier.

Do not force all suppliers into Employee.

---

# 8. Core Supplier Fields

Core Supplier should remain intentionally minimal.

## 8.1 Required MVP fields

```txt
id
orgId
name
email
phone
address
createdAt
updatedAt
deletedAt
deletedBy
```

## 8.2 Field definitions

| Field | Required | Description |
|---|---:|---|
| `id` | Yes | Stable Supplier ID. |
| `orgId` | Yes | Tenant boundary. Always derived from `PlatformContext`. |
| `name` | Yes | Supplier display name. Can be company name or individual name. |
| `email` | No | General supplier email. Not a login identity. |
| `phone` | No | General contact phone. |
| `address` | No | General address. Structured addresses are deferred. |
| `createdAt` | Yes | Record creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |
| `deletedAt` | No | Soft-delete timestamp. |
| `deletedBy` | No | User ID that soft-deleted the record. |

---

# 9. Fields Explicitly Excluded from Core Supplier

The following must **not** be added to core Supplier in MVP:

```txt
supplierCode
supplierType
contactPerson
taxIdentificationNumber
businessRegistrationNumber
paymentTerms
leadTimeDays
creditLimit
currency
bankAccountName
bankAccountNumber
bankName
withholdingTaxType
vatType
preferredSupplier
approvalStatus
accreditationStatus
supplierRating
riskScore
productCatalog
serviceCategories
contractStartDate
contractEndDate
notes
tags
website
socialLinks
```

## 9.1 Why these fields are excluded

Most of these fields are meaningful only to specific modules or future workflows.

Examples:

```txt
paymentTerms
→ Purchasing / Accounts Payable concern

leadTimeDays
→ Purchasing or Inventory concern

preferredSupplier
→ Purchasing or Inventory concern

bankAccountNumber
→ Payments/Finance concern, sensitive data

approvalStatus
→ Purchasing approval/accreditation concern

supplierRating
→ Procurement performance concern

productCatalog
→ Inventory/Purchasing supplier-product relation
```

Putting all of these in core Supplier would make the Business Object bloated and would train Claude to treat OneDayOS as a generic ERP schema dump.

That is explicitly not the goal.

---

# 10. MVP Prisma Model

The MVP Supplier model should be close to:

```prisma
model Supplier {
  id        String    @id @default(cuid())
  orgId     String
  name      String
  email     String?
  phone     String?
  address   String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  deletedBy String?

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([id, orgId])
  @@index([orgId, name])
  @@index([orgId, deletedAt])
  @@map("suppliers")
}
```

## 10.1 Why no unique constraint on supplier name?

Supplier names should not be globally unique.

They should also not be strictly unique within one organization during MVP.

Reasons:

```txt
Different suppliers can have similar names.
SMEs may enter partial names during setup.
Duplicate detection is a UX/workflow problem, not a hard database rule yet.
Some suppliers may be individual persons with common names.
```

Duplicate detection and merge flows are deferred.

The UI may warn when a similar supplier name already exists, but MVP should not block creation by name.

---

# 11. Tenant Isolation Rules

Supplier is tenant-scoped.

Every Supplier record belongs to exactly one Organization.

Hard rules:

```txt
Supplier.orgId must always exist.
Supplier.orgId must always come from verified PlatformContext.
Client-supplied orgId must be rejected.
Supplier queries must always be scoped by ctx.org.id.
Supplier service methods must receive PlatformContext, not orgId.
Supplier APIs must live under /api/orgs/[orgSlug]/objects/suppliers.
```

Forbidden:

```ts
SupplierService.list(orgId)
SupplierService.create(orgId, input)
sdk.getDb(orgId)
where: { id: supplierId }
body.orgId
request.nextUrl.searchParams.get('orgId')
```

Required:

```ts
SupplierService.list(ctx)
SupplierService.create(ctx, input)
sdk.getDb(ctx)
where: { id_orgId: { id: supplierId, orgId: ctx.org.id } }
```

If the exact Prisma unique input differs, the principle remains:

```txt
Never identify tenant-scoped records by id alone.
```

---

# 12. Permissions

Supplier permissions use the `objects` namespace.

Required MVP permissions:

```txt
objects.supplier.read
objects.supplier.create
objects.supplier.update
objects.supplier.delete
objects.supplier.restore
```

## 12.1 Permission meanings

| Permission | Meaning |
|---|---|
| `objects.supplier.read` | View supplier lists and supplier details. |
| `objects.supplier.create` | Create new Supplier records. |
| `objects.supplier.update` | Edit Supplier core fields. |
| `objects.supplier.delete` | Soft-delete Supplier records. |
| `objects.supplier.restore` | Restore soft-deleted Supplier records. |

## 12.2 Permission requirements by operation

| Operation | Required Permission |
|---|---|
| List suppliers | `objects.supplier.read` |
| View supplier detail | `objects.supplier.read` |
| Create supplier | `objects.supplier.create` |
| Update supplier | `objects.supplier.update` |
| Soft-delete supplier | `objects.supplier.delete` |
| Restore supplier | `objects.supplier.restore` |

Permission checks must happen in APIs and services.

UI checks are usability only.

---

# 13. API Contract

Supplier APIs belong under the Business Objects API namespace.

## 13.1 Routes

```txt
GET    /api/orgs/[orgSlug]/objects/suppliers
POST   /api/orgs/[orgSlug]/objects/suppliers
GET    /api/orgs/[orgSlug]/objects/suppliers/[supplierId]
PATCH  /api/orgs/[orgSlug]/objects/suppliers/[supplierId]
DELETE /api/orgs/[orgSlug]/objects/suppliers/[supplierId]
POST   /api/orgs/[orgSlug]/objects/suppliers/[supplierId]/restore
```

Do not place Supplier APIs under Purchasing:

```txt
/api/orgs/[orgSlug]/purchasing/suppliers ❌
```

Purchasing may expose purchasing-specific supplier views later, but the canonical Supplier CRUD API belongs to Business Objects.

## 13.2 Response shape

All responses must follow the Kernel API contract:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

## 13.3 Error behavior

| Case | Status | Code |
|---|---:|---|
| Not authenticated | `401` | `UNAUTHENTICATED` |
| Wrong org slug / org not visible to user | `404` | `ORG_NOT_FOUND` |
| Missing permission | `403` | `FORBIDDEN` |
| Invalid input | `400` | `VALIDATION_ERROR` |
| Supplier not found | `404` | `SUPPLIER_NOT_FOUND` |
| Client sends `orgId` | `400` | `CLIENT_ORG_ID_FORBIDDEN` |
| Deleted supplier accessed through normal route | `404` | `SUPPLIER_NOT_FOUND` |

Wrong-org access should never reveal that the target organization or supplier exists.

---

# 14. Zod Validation

Supplier input schemas must reject unknown keys by default.

## 14.1 Create schema

```ts
import { z } from 'zod'

export const CreateSupplierSchema = z.strictObject({
  name: z.string().trim().min(2).max(200),
  email: z.email().trim().toLowerCase().max(254).optional().or(z.literal('')),
  phone: z.string().trim().min(3).max(50).optional().or(z.literal('')),
  address: z.string().trim().max(1000).optional().or(z.literal('')),
})
```

## 14.2 Update schema

```ts
export const UpdateSupplierSchema = CreateSupplierSchema.partial()
```

## 14.3 Forbidden input

These must fail validation:

```json
{
  "orgId": "org_123",
  "name": "ABC Trading"
}
```

```json
{
  "deletedAt": "2026-07-04T00:00:00.000Z",
  "name": "ABC Trading"
}
```

```json
{
  "createdAt": "2026-07-04T00:00:00.000Z",
  "name": "ABC Trading"
}
```

The server owns tenant identity and lifecycle fields.

---

# 15. Service Contract

Supplier services must be server-only.

They must receive verified `PlatformContext`.

## 15.1 Required service shape

```ts
type SupplierListOptions = {
  search?: string
  includeDeleted?: boolean
  limit?: number
  cursor?: string
}

export const SupplierService = {
  list(ctx: PlatformContext, options?: SupplierListOptions): Promise<SupplierListResult>,
  getById(ctx: PlatformContext, supplierId: string): Promise<Supplier>,
  create(ctx: PlatformContext, input: CreateSupplierInput): Promise<Supplier>,
  update(ctx: PlatformContext, supplierId: string, input: UpdateSupplierInput): Promise<Supplier>,
  softDelete(ctx: PlatformContext, supplierId: string): Promise<void>,
  restore(ctx: PlatformContext, supplierId: string): Promise<Supplier>,
}
```

## 15.2 Required service sequence

Every mutation must follow this sequence:

```txt
1. Receive verified PlatformContext.
2. Require permission.
3. Validate input before service or at API boundary.
4. Use sdk.getDb(ctx).
5. Query by supplierId + ctx.org.id.
6. Perform mutation.
7. Emit Supplier event.
8. Return safe response data.
```

Example:

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'supplier',
  action: 'create',
})

const db = sdk.getDb(ctx)

const supplier = await db.supplier.create({
  data: {
    orgId: ctx.org.id,
    name: input.name,
    email: normalizeOptional(input.email),
    phone: normalizeOptional(input.phone),
    address: normalizeOptional(input.address),
  },
})

await sdk.events.emit(ctx, 'objects.supplier.created', {
  supplierId: supplier.id,
})
```

---

# 16. Events

Supplier mutations must emit Business Object events.

Events use the `objects` namespace.

## 16.1 Required events

```txt
objects.supplier.created
objects.supplier.updated
objects.supplier.deleted
objects.supplier.restored
```

## 16.2 Event payload rules

Supplier event payloads must be small and stable.

Do not emit full Prisma records.

Do not emit sensitive payment or banking details.

Do not emit unnecessary contact information.

Recommended payloads:

```ts
type SupplierCreatedPayload = {
  supplierId: string
}

type SupplierUpdatedPayload = {
  supplierId: string
  changedFields: string[]
}

type SupplierDeletedPayload = {
  supplierId: string
}

type SupplierRestoredPayload = {
  supplierId: string
}
```

A future Audit Log Service can fetch record snapshots if needed.

Do not use events as a data transport shortcut.

---

# 17. Module Extension Pattern

Supplier-specific module behavior belongs in extension tables.

## 17.1 Purchasing extension example

```prisma
model PurchasingSupplierExtension {
  id          String   @id @default(cuid())
  orgId       String
  supplierId  String

  paymentTermsDays Int?
  leadTimeDays     Int?
  preferred        Boolean @default(false)
  approvalStatus   String  @default("pending")

  supplier Supplier @relation(fields: [supplierId, orgId], references: [id, orgId])

  @@unique([orgId, supplierId])
  @@index([orgId, approvalStatus])
  @@map("purchasing_supplier_extensions")
}
```

## 17.2 Inventory supplier-product relation example

```prisma
model InventorySupplierProduct {
  id                  String @id @default(cuid())
  orgId               String
  supplierId           String
  productId            String

  supplierProductCode  String?
  minimumOrderQuantity Int?
  leadTimeDays         Int?
  lastPurchaseCost     Decimal?

  supplier Supplier @relation(fields: [supplierId, orgId], references: [id, orgId])
  product  Product  @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, supplierId, productId])
  @@index([orgId, productId])
  @@map("inventory_supplier_products")
}
```

## 17.3 Expenses extension example

```prisma
model ExpenseVendorExtension {
  id         String @id @default(cuid())
  orgId      String
  supplierId String

  defaultExpenseCategoryId String?
  requiresReceipt          Boolean @default(true)

  supplier Supplier @relation(fields: [supplierId, orgId], references: [id, orgId])

  @@unique([orgId, supplierId])
  @@map("expense_vendor_extensions")
}
```

Bank account details, if ever implemented, must be handled with a separate security review.

Do not casually add banking fields to any extension table without considering encryption, masking, access control, audit logs, and export behavior.

---

# 18. Relationship Rules

## 18.1 Tenant-safe foreign keys

Module records should reference Supplier with tenant-safe composite relations:

```prisma
model PurchaseOrder {
  id         String @id @default(cuid())
  orgId      String
  supplierId String

  supplier Supplier @relation(fields: [supplierId, orgId], references: [id, orgId])
}
```

This prevents accidental cross-tenant relations.

## 18.2 Historical records

Historical records should remain valid even if a Supplier is soft-deleted.

Example:

```txt
A purchase order from 2024 should still show the supplier name/reference even if the supplier was deleted in 2026.
```

Do not cascade-delete purchasing, expense, or asset records when a Supplier is soft-deleted.

## 18.3 Creating new module records with deleted Suppliers

New records should not normally reference soft-deleted suppliers.

Examples:

```txt
New purchase order → cannot select deleted supplier
New expense vendor bill → cannot select deleted supplier
New supplier-product mapping → cannot select deleted supplier
```

Restore the Supplier first if it should be used again.

---

# 19. Soft Delete and Restore

Supplier uses standard Business Object soft-delete behavior.

## 19.1 Soft-delete rule

Delete means:

```txt
Set deletedAt
Set deletedBy
Emit objects.supplier.deleted
Exclude from normal reads
```

Delete does not mean:

```txt
Hard delete row
Remove historical references
Cascade delete purchase records
Erase audit/event history
```

## 19.2 Restore rule

Restore means:

```txt
Set deletedAt = null
Set deletedBy = null
Emit objects.supplier.restored
Make visible in normal reads again
```

Restore requires `objects.supplier.restore`.

## 19.3 Deleted Supplier UI behavior

Normal Supplier list:

```txt
Exclude deleted suppliers
```

Supplier detail normal route:

```txt
Deleted supplier returns 404-like response
```

Admin restore route/view:

```txt
Explicitly includes deleted suppliers
Requires restore permission
Visually marks deleted state
```

---

# 20. Search, Reporting, AI, and Export

## 20.1 Search

Supplier should eventually be searchable by:

```txt
name
email
phone
address
```

For MVP, search may be simple case-insensitive database filtering.

Global Search Service is deferred until promoted by the Three Independent Use Cases Rule.

## 20.2 Reporting

Supplier itself should not define reporting logic.

Reporting belongs to modules or future Platform Reporting Service.

Examples:

```txt
Purchasing spend by supplier
Inventory lead time by supplier
Expenses paid by vendor
Assets maintenance cost by service provider
```

Those are not core Supplier concerns.

## 20.3 AI context

AI may use Supplier as a known Business Object, but must remain permission-aware and tenant-scoped.

AI must not retrieve supplier information across organizations.

AI must not expose supplier contact data unless the user has `objects.supplier.read`.

AI-generated Supplier creation must still pass Zod validation, authorization, and server-side tenant context.

## 20.4 Export

Supplier export is deferred.

When implemented, export must:

```txt
Require explicit export permission or reporting permission
Use PlatformContext
Exclude deleted suppliers by default
Respect sensitive extension fields
Never export across tenants
```

---

# 21. UI Requirements

The Supplier UI is a Business Object UI, not a Purchasing UI.

Canonical screens should eventually include:

```txt
Supplier list
Supplier create form
Supplier detail page
Supplier edit form
Supplier restore/admin view
```

## 21.1 Supplier list

The Supplier list should include:

```txt
Name
Email
Phone
Address summary
Created date
Row actions based on permissions
```

Do not show Purchasing-specific fields in the canonical Supplier list.

Bad:

```txt
Supplier list contains payment terms, preferred supplier, purchase volume, lead time
```

Good:

```txt
Supplier list contains shared identity/contact fields only
```

Purchasing can later provide a purchasing-specific supplier view if needed.

## 21.2 Empty state

Empty state should explain the shared nature of Supplier:

```txt
No suppliers yet.
Add companies, vendors, contractors, or service providers your business buys from.
```

## 21.3 Form behavior

Supplier forms must follow the OneDayOS form standards:

```txt
Fast
Minimal
Keyboard-friendly
Server-validated
Optimistic where safe
Clear validation errors
No unexplained fields
Tooltip/help for non-obvious fields
```

---

# 22. Anti-Patterns

These are explicitly forbidden:

## 22.1 Module-owned Supplier copy

```prisma
model PurchasingSupplier { ... } // if it duplicates Supplier identity ❌
model InventorySupplier { ... }  // if it duplicates Supplier identity ❌
```

Allowed:

```prisma
model PurchasingSupplierExtension { ... } ✅
model InventorySupplierProduct { ... } ✅
```

## 22.2 Putting purchasing fields in core Supplier

Forbidden:

```prisma
model Supplier {
  paymentTermsDays Int?
  leadTimeDays Int?
  preferred Boolean
  approvalStatus String
}
```

These belong to Purchasing or Inventory extensions.

## 22.3 Treating Supplier as Customer

Forbidden:

```txt
Use Customer table for vendors
Use Supplier table for customers
Add customer/supplier flags to one table without ADR
```

## 22.4 Trusting client orgId

Forbidden:

```ts
const { orgId } = await req.json()
await SupplierService.create(orgId, input)
```

Required:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
await SupplierService.create(ctx, input)
```

## 22.5 Full-record event payloads

Forbidden:

```ts
await sdk.events.emit(ctx, 'objects.supplier.created', supplier)
```

Required:

```ts
await sdk.events.emit(ctx, 'objects.supplier.created', {
  supplierId: supplier.id,
})
```

---

# 23. Testing Requirements

Supplier implementation must include tests before it is considered complete.

## 23.1 Required test fixtures

At minimum:

```txt
Org A
Org B
Org A admin user
Org A staff user with supplier read only
Org A staff user with no supplier permissions
Org B admin user
Supplier in Org A
Supplier in Org B
Deleted Supplier in Org A
```

Single-org tests are insufficient.

Always-admin tests are insufficient.

## 23.2 Service tests

Required service tests:

```txt
list returns only suppliers in ctx.org.id
list excludes deleted suppliers by default
getById requires supplierId + ctx.org.id
create derives orgId from ctx
create rejects client-supplied orgId before service or at API boundary
update modifies only supplier in ctx.org.id
softDelete sets deletedAt/deletedBy
restore clears deletedAt/deletedBy
wrong-org supplier access fails safely
```

## 23.3 Permission tests

Required permission tests:

```txt
User without objects.supplier.read cannot list suppliers
User without objects.supplier.create cannot create supplier
User without objects.supplier.update cannot update supplier
User without objects.supplier.delete cannot delete supplier
User without objects.supplier.restore cannot restore supplier
Admin wildcard works only inside own org
```

## 23.4 API tests

Required API tests:

```txt
Unauthenticated request returns 401 JSON
Wrong-org request returns safe 404 JSON
Missing permission returns 403 JSON
Invalid body returns VALIDATION_ERROR
Body with orgId returns CLIENT_ORG_ID_FORBIDDEN
GET list does not leak Org B supplier to Org A user
PATCH cannot update Org B supplier from Org A context
DELETE cannot delete Org B supplier from Org A context
Deleted supplier normal GET returns SUPPLIER_NOT_FOUND
Restore requires restore permission
```

## 23.5 Event tests

Required event tests:

```txt
create emits objects.supplier.created
update emits objects.supplier.updated with changedFields
delete emits objects.supplier.deleted
restore emits objects.supplier.restored
event payload does not include full supplier record
event payload does not include email/phone/address unless explicitly approved later
```

## 23.6 Validation tests

Required validation tests:

```txt
name is required
name trims whitespace
email must be valid if provided
unknown keys are rejected
orgId is rejected
createdAt is rejected
deletedAt is rejected
```

---

# 24. Implementation Notes for Claude Code

When Claude implements Supplier, it must follow these rules:

```txt
Do not create Supplier inside Purchasing.
Do not create Supplier inside Inventory.
Do not create Supplier inside Expenses.
Do not add supplier-specific fields not listed in this document.
Do not add payment terms, bank details, tax details, lead times, or approval status to core Supplier.
Do not use sdk.getDb(orgId).
Do not pass loose orgId to SupplierService.
Do not trust client-supplied orgId.
Do not import from @/kernel/* inside module code.
Do not emit full Supplier records as event payloads.
Do not hard-delete suppliers.
Do not build Supplier merge/deduplication in MVP.
Do not build Supplier portal access in MVP.
```

Claude may implement only:

```txt
Supplier model if not already present
Supplier Zod schemas
Supplier service
Supplier API routes
Supplier permissions
Supplier events
Supplier tests
Basic Supplier UI only if design system standards are already frozen
```

If the design system is not frozen yet, Claude should implement backend/service/API/tests first and defer UI polish.

---

# 25. Deferred Capabilities

These are intentionally deferred:

```txt
Supplier portal
Supplier approval/accreditation workflow
Supplier ratings
Supplier performance analytics
Supplier product catalog
Supplier-product price lists
Supplier contracts
Supplier documents/attachments
Supplier bank details
Supplier tax profile
Supplier payment terms
Multiple contact persons
Multiple addresses
Duplicate detection
Supplier merge
Generic Party model
Cross-client supplier master database
Supplier marketplace
```

Do not implement these until a later module spec or Platform Service document requires them.

---

# 26. Acceptance Criteria

Supplier Business Object is ready for implementation only when all of the following are true:

```txt
[ ] Supplier belongs to Business Objects, not Purchasing or Inventory.
[ ] Supplier core model contains only approved MVP fields.
[ ] Supplier APIs live under /api/orgs/[orgSlug]/objects/suppliers.
[ ] Supplier services receive PlatformContext.
[ ] Supplier queries are tenant-scoped by ctx.org.id.
[ ] Client-supplied orgId is rejected.
[ ] Supplier permissions use objects.supplier.*.
[ ] Supplier events use objects.supplier.*.
[ ] Supplier soft delete uses deletedAt/deletedBy.
[ ] Hard delete is unavailable for normal operations.
[ ] Module-specific Supplier fields use extension tables.
[ ] Historical module records are not cascade-deleted when Supplier is soft-deleted.
[ ] Tests include at least two organizations.
[ ] Tests include non-admin permission denial.
[ ] Tests verify cross-tenant read/write denial.
[ ] Tests verify event emission.
[ ] Tests verify validation rejects orgId and unknown keys.
```

---

# 27. Founder Review Questions

Before freezing this document, confirm:

1. Should Supplier remain as minimal as Customer for MVP, with no `supplierCode`?
2. Should duplicate Supplier names be allowed in the same organization during MVP?
3. Should Supplier active/inactive status be deferred, or should core Supplier include `isActive` from day one?
4. Are bank/payment/tax details correctly deferred to future Finance/Purchasing specifications?
5. Are we comfortable keeping Customer and Supplier separate instead of introducing a generic `Party` abstraction?

Recommended default answers:

```txt
1. Yes, no supplierCode in MVP.
2. Yes, allow duplicates and solve deduplication later.
3. Defer isActive/status until a real workflow requires it.
4. Yes, defer sensitive financial/tax fields.
5. Yes, avoid Party abstraction until evidence proves the need.
```

---

# 28. Final Decision

Supplier is a shared Business Object.

It is the canonical provider/vendor identity across OneDayOS.

It is not owned by Purchasing, Inventory, Expenses, Assets, Projects, or any other module.

The MVP Supplier object should remain intentionally small:

```txt
name
email
phone
address
lifecycle fields
tenant fields
```

Everything else belongs in module-owned extension tables until repeated use proves that a field or capability belongs in the shared Business Object layer.

