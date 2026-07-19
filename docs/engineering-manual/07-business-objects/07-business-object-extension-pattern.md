# OneDayOS Engineering Manual — Business Object Extension Pattern

**Document ID:** `07-business-objects/07-business-object-extension-pattern.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Owner:** Founder + ChatGPT  
**Last Updated:** July 2026  
**Implementation Allowed:** No, not until this document is marked `Frozen`  
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
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/01-employee.md`
- `07-business-objects/02-product.md`
- `07-business-objects/03-customer.md`
- `07-business-objects/04-supplier.md`
- `07-business-objects/05-warehouse.md`

---

# 1. Purpose

This document defines how OneDayOS business modules may add module-specific behavior, data, and workflows around shared Business Objects without polluting or duplicating the shared entities.

This is one of the most important long-term platform rules.

OneDayOS must avoid two opposite failures:

1. **Too much in core Business Objects**  
   The Product, Customer, Supplier, Employee, and Warehouse tables become bloated with fields only one module needs.

2. **Too much inside modules**  
   Each module creates its own duplicate Product, Customer, Supplier, Employee, or Warehouse table.

The extension pattern solves this by keeping Business Objects minimal and allowing modules to attach their own data through clearly owned extension tables.

The rule is simple:

```txt
Shared identity belongs in Business Objects.
Module-specific behavior belongs in module-owned extension tables.
```

---

# 2. Executive Summary

Business Objects are the shared nouns of the business:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Modules are the business capabilities that use those shared nouns:

```txt
Inventory
CRM
Purchasing
Leave
Assets
Projects
Expenses
Reservations
Incident Reporting
Visitor Management
```

A module may reference a Business Object.

A module may extend a Business Object.

A module may not redefine a Business Object.

Correct:

```txt
Product
  ↓
InventoryProductExtension
  ↓
Inventory-specific fields
```

Incorrect:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
```

unless those records are truly module-owned transactional records, not duplicate identities.

Example:

```txt
StockMovement is allowed.
InventoryProduct duplicate identity is not allowed.
```

---

# 3. Core Architectural Rule

The Business Object extension rule is:

```txt
A module must not add module-specific columns to a core Business Object table.
A module must not create its own duplicate copy of a core Business Object.
A module must attach module-specific fields through module-owned extension tables.
```

Examples:

| Proposed Field | Correct Location | Reason |
|---|---|---|
| `Product.name` | `Product` | Every module needs product identity. |
| `Product.unit` | `Product` | Core product display and operational meaning. |
| `Product.reorderPoint` | `InventoryProductExtension` | Inventory-specific. |
| `Product.valuationMethod` | `InventoryProductExtension` | Inventory/accounting-specific. |
| `Product.preferredSupplierId` | `PurchasingProductExtension` or `InventorySupplierProduct` | Supplier sourcing behavior is not core identity. |
| `Customer.pipelineStage` | `CRMCustomerExtension` | CRM-specific. |
| `Employee.leaveCredits` | `LeaveEmployeeExtension` | Leave-specific. |
| `Warehouse.binTrackingEnabled` | `InventoryWarehouseExtension` | Inventory-specific. |

---

# 4. Why This Pattern Exists

## 4.1 It protects platform reuse

OneDayOS will eventually support many modules. If every early module adds fields to shared objects, the core tables will become messy, confusing, and hard to evolve.

Bad Product table after uncontrolled growth:

```txt
Product
  code
  name
  unit
  reorderPoint
  minimumStock
  maximumStock
  valuationMethod
  preferredSupplierId
  sellingPrice
  commissionRate
  warrantyPeriod
  shelfLifeDays
  hazardousMaterialClass
  requiresSerialTracking
  isReservable
  serviceDurationMinutes
```

This looks powerful, but it is actually architectural debt.

A small retail client does not need all those fields.

A service business may not use inventory at all.

A purchasing-only client may not care about selling price.

A CRM client may not care about stock.

The better structure is:

```txt
Product
  code
  name
  description
  categoryId
  unit

InventoryProductExtension
  productId
  reorderPoint
  minimumStock
  maximumStock
  valuationMethod
  trackSerials
  trackLots

SalesProductExtension
  productId
  sellingPrice
  commissionRate
  isSellable

PurchasingProductExtension
  productId
  defaultLeadTimeDays
  purchaseUnit
```

## 4.2 It prevents duplicate business identity

The opposite failure is allowing modules to create their own copies of shared entities.

Bad structure:

```txt
InventoryProduct
PurchasingProduct
SalesProduct
```

Now the same physical item may exist three times.

That causes problems:

```txt
Inventory says product name = "Printer Ink 003"
Purchasing says product name = "Ink Cartridge 003"
Sales says product name = "Epson Ink 003"
```

Eventually, reporting, search, AI, and integrations become unreliable because there is no single product identity.

Correct structure:

```txt
Product
  id = prod_123
  code = INK-003
  name = Printer Ink 003

InventoryProductExtension
  productId = prod_123

PurchasingProductExtension
  productId = prod_123

SalesProductExtension
  productId = prod_123
```

One identity. Multiple module-specific behaviors.

---

# 5. Definitions

## 5.1 Business Object

A Business Object is a shared domain entity that multiple modules use.

Examples:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Business Objects are not owned by modules.

They are part of the shared business identity layer.

## 5.2 Extension Table

An extension table stores module-specific fields for a Business Object.

Example:

```txt
InventoryProductExtension
  productId
  reorderPoint
  minimumStock
  valuationMethod
```

This table is owned by the Inventory module.

It references the shared Product Business Object.

## 5.3 Module-Owned Transactional Record

A transactional record is a module-owned business event or workflow record that references Business Objects but is not an extension of them.

Examples:

```txt
StockMovement
LeaveRequest
PurchaseRequest
ExpenseClaim
IncidentReport
Reservation
```

These records are allowed to live inside modules because they represent module-specific workflows.

## 5.4 Relation Table

A relation table models a module-specific relationship between two or more Business Objects.

Example:

```txt
InventorySupplierProduct
  supplierId
  productId
  supplierSku
  leadTimeDays
  lastPurchasePrice
```

This is not a Supplier duplicate or Product duplicate.

It is a module-owned relationship between Supplier and Product.

## 5.5 Snapshot Field

A snapshot field stores historical display data at the time of a transaction.

Example:

```txt
StockMovement
  productId
  productCodeSnapshot
  productNameSnapshot
```

Snapshots are allowed when historical correctness requires them.

A stock movement from last year should still display the product name as it was known then, even if the Product name changes today.

Snapshot fields must be clearly named with `Snapshot`.

---

# 6. Extension Pattern Types

OneDayOS supports four approved extension patterns.

---

## 6.1 One-to-One Business Object Extension

Use this when a module adds one set of module-specific fields to one Business Object.

Example:

```txt
Product
  ↓
InventoryProductExtension
```

Prisma example:

```prisma
model Product {
  id          String    @id @default(cuid())
  orgId       String
  code        String
  name        String
  description String?
  categoryId  String?
  unit        String    @default("pcs")
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  inventoryExtension InventoryProductExtension?

  @@unique([orgId, code])
  @@unique([id, orgId])
  @@map("products")
}

model InventoryProductExtension {
  id              String   @id @default(cuid())
  orgId           String
  productId       String
  reorderPoint    Int?
  minimumStock    Int?
  maximumStock    Int?
  valuationMethod String?  // "fifo" | "average" | "specific"
  trackSerials    Boolean  @default(false)
  trackLots       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
  @@unique([id, orgId])
  @@index([orgId])
  @@map("inventory_product_extensions")
}
```

Use this pattern for:

```txt
InventoryProductExtension
CRMCustomerExtension
LeaveEmployeeExtension
PurchasingSupplierExtension
InventoryWarehouseExtension
```

---

## 6.2 One-to-Many Module Relationship Extension

Use this when a module needs to model a relationship between Business Objects.

Example:

```txt
Supplier supplies Product
```

Do not add these fields to Product:

```txt
preferredSupplierId
supplierSku
supplierLeadTimeDays
```

Do this instead:

```prisma
model InventorySupplierProduct {
  id                String    @id @default(cuid())
  orgId             String
  supplierId        String
  productId         String
  supplierSku       String?
  leadTimeDays      Int?
  lastPurchasePrice Decimal?
  isPreferred       Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  deletedBy         String?

  supplier Supplier @relation(fields: [supplierId, orgId], references: [id, orgId])
  product  Product  @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, supplierId, productId])
  @@unique([id, orgId])
  @@index([orgId, productId])
  @@index([orgId, supplierId])
  @@map("inventory_supplier_products")
}
```

This preserves shared identity while allowing rich module-specific relationships.

---

## 6.3 Module-Owned Workflow Record Referencing Business Objects

Use this when the module owns a business process or event.

Example:

```txt
Inventory owns StockMovement.
StockMovement references Product and Warehouse.
```

Correct:

```prisma
model StockMovement {
  id                  String   @id @default(cuid())
  orgId               String
  productId           String
  warehouseId         String
  movementType        String   // "in" | "out" | "adjustment" | "transfer"
  quantity            Decimal
  occurredAt          DateTime @default(now())
  reason              String?

  productCodeSnapshot String?
  productNameSnapshot String?
  warehouseNameSnapshot String?

  createdBy           String
  createdAt           DateTime @default(now())
  deletedAt           DateTime?
  deletedBy           String?

  product   Product   @relation(fields: [productId, orgId], references: [id, orgId])
  warehouse Warehouse @relation(fields: [warehouseId, orgId], references: [id, orgId])

  @@unique([id, orgId])
  @@index([orgId, productId])
  @@index([orgId, warehouseId])
  @@index([orgId, occurredAt])
  @@map("inventory_stock_movements")
}
```

This is allowed because StockMovement is not trying to redefine Product or Warehouse.

It is a module-owned event that references shared objects.

---

## 6.4 Module-Owned Configuration Record

Use this when configuration belongs to a module and affects how the module treats a Business Object.

Example:

```txt
Inventory valuation settings by warehouse
```

Correct:

```prisma
model InventoryWarehouseSettings {
  id                 String   @id @default(cuid())
  orgId              String
  warehouseId        String
  allowNegativeStock Boolean  @default(false)
  defaultBinCode     String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  warehouse Warehouse @relation(fields: [warehouseId, orgId], references: [id, orgId])

  @@unique([orgId, warehouseId])
  @@unique([id, orgId])
  @@map("inventory_warehouse_settings")
}
```

This is better than putting these fields on Warehouse:

```txt
Warehouse.allowNegativeStock
Warehouse.defaultBinCode
```

because those fields only make sense to Inventory.

---

# 7. Naming Conventions

## 7.1 One-to-One Extension Table Names

Use this format:

```txt
{Module}{BusinessObject}Extension
```

Examples:

```txt
InventoryProductExtension
CRMCustomerExtension
LeaveEmployeeExtension
PurchasingSupplierExtension
InventoryWarehouseExtension
```

Database table names use snake_case plural:

```txt
inventory_product_extensions
crm_customer_extensions
leave_employee_extensions
purchasing_supplier_extensions
inventory_warehouse_extensions
```

## 7.2 Relationship Table Names

Use this format:

```txt
{Module}{BusinessObjectA}{BusinessObjectB}
```

or, when clearer:

```txt
{Module}{RelationshipName}
```

Examples:

```txt
InventorySupplierProduct
PurchasingProductSupplier
AssetEmployeeAssignment
ProjectCustomerContact
```

## 7.3 Workflow Record Names

Use business-process names, not generic extension names.

Correct:

```txt
StockMovement
PurchaseRequest
LeaveRequest
ExpenseClaim
AssetAssignment
IncidentReport
Reservation
```

Incorrect:

```txt
InventoryProductLog
HRUserThing
CRMCustomerData
```

## 7.4 Snapshot Field Names

Use explicit `Snapshot` suffix.

Examples:

```txt
productNameSnapshot
productCodeSnapshot
customerNameSnapshot
supplierNameSnapshot
warehouseNameSnapshot
employeeNameSnapshot
```

Do not use vague names like:

```txt
oldName
nameCopy
cachedName
label
```

---

# 8. Required Fields for Extension Tables

Every tenant-scoped extension table must include:

```txt
id
orgId
businessObjectId
createdAt
updatedAt
```

If the extension record has its own lifecycle, include:

```txt
deletedAt
deletedBy
```

## 8.1 One-to-One Extension Required Shape

```prisma
model ModuleObjectExtension {
  id        String   @id @default(cuid())
  orgId     String
  objectId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  object BusinessObject @relation(fields: [objectId, orgId], references: [id, orgId])

  @@unique([orgId, objectId])
  @@unique([id, orgId])
  @@index([orgId])
}
```

## 8.2 Relationship Required Shape

```prisma
model ModuleObjectRelationship {
  id         String   @id @default(cuid())
  orgId      String
  objectAId  String
  objectBId  String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?
  deletedBy  String?

  objectA BusinessObjectA @relation(fields: [objectAId, orgId], references: [id, orgId])
  objectB BusinessObjectB @relation(fields: [objectBId, orgId], references: [id, orgId])

  @@unique([orgId, objectAId, objectBId])
  @@unique([id, orgId])
  @@index([orgId, objectAId])
  @@index([orgId, objectBId])
}
```

---

# 9. Tenant Safety Rules

Extension tables are tenant-scoped.

They must follow the same tenant isolation rules as Business Objects.

## 9.1 `orgId` is mandatory

Every extension table must include `orgId`.

Forbidden:

```prisma
model InventoryProductExtension {
  id        String @id @default(cuid())
  productId String
}
```

Required:

```prisma
model InventoryProductExtension {
  id        String @id @default(cuid())
  orgId     String
  productId String
}
```

## 9.2 Relations must be tenant-safe

A module extension must not reference a Business Object by `id` alone.

Forbidden:

```prisma
product Product @relation(fields: [productId], references: [id])
```

Required:

```prisma
product Product @relation(fields: [productId, orgId], references: [id, orgId])
```

This requires the Business Object table to include:

```prisma
@@unique([id, orgId])
```

## 9.3 Client-supplied `orgId` is forbidden

API clients must never submit `orgId` for extension operations.

Forbidden API body:

```json
{
  "orgId": "org_123",
  "productId": "prod_123",
  "reorderPoint": 10
}
```

Correct API body:

```json
{
  "productId": "prod_123",
  "reorderPoint": 10
}
```

The server derives `orgId` from verified `PlatformContext`:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

Then the service uses:

```ts
ctx.org.id
```

## 9.4 Services receive `PlatformContext`

Forbidden:

```ts
InventoryProductService.updateExtension(orgId, productId, input)
```

Required:

```ts
InventoryProductService.updateExtension(ctx, productId, input)
```

The context has already verified:

```txt
authenticated user
platform user exists
organization exists
user belongs to organization
module is enabled
permissions can be checked
```

---

# 10. Permission Rules

Business Object permissions and module extension permissions are separate.

## 10.1 Business Object permissions

Business Object identity is controlled by the `objects` namespace.

Examples:

```txt
objects.product.read
objects.product.create
objects.product.update
objects.product.delete
objects.product.restore
```

These permissions control the core Product record.

## 10.2 Module extension permissions

Module-specific extension data is controlled by the module namespace.

Examples:

```txt
inventory.product_extension.read
inventory.product_extension.update
crm.customer_extension.read
crm.customer_extension.update
leave.employee_extension.read
leave.employee_extension.update
purchasing.supplier_extension.read
purchasing.supplier_extension.update
```

## 10.3 Creating a Business Object from a module screen

Sometimes a module screen creates both a Business Object and its module extension.

Example:

```txt
Inventory → Products → New Product
```

This may create:

```txt
Product
InventoryProductExtension
```

The API must require both permissions:

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'create',
})

await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product_extension',
  action: 'create',
})
```

If the screen only edits inventory-specific fields, it only requires the module extension permission.

If the screen edits core Product fields, it requires the Business Object permission.

## 10.4 Reading object identity from a module

A module may need to list Products, Customers, Suppliers, Employees, or Warehouses.

The safe MVP rule is:

```txt
If a module screen displays core Business Object fields, the user must have the relevant objects.*.read permission or a module-specific permission that explicitly grants read access through that module's service.
```

For MVP simplicity, generated module screens should usually require both:

```txt
objects.product.read
inventory.product_extension.read
```

Later, OneDayOS may introduce permission composition rules such as:

```txt
inventory.product.read grants limited product identity read inside Inventory only
```

Do not add this complexity in the first build unless necessary.

---

# 11. API Route Patterns

## 11.1 Business Object APIs

Business Object APIs live under:

```txt
/api/orgs/[orgSlug]/objects/[businessObject]
```

Examples:

```txt
/api/orgs/acme/objects/products
/api/orgs/acme/objects/customers
/api/orgs/acme/objects/suppliers
/api/orgs/acme/objects/employees
/api/orgs/acme/objects/warehouses
```

## 11.2 Module Extension APIs

Module extension APIs live under module routes:

```txt
/api/orgs/[orgSlug]/[moduleId]/...
```

Examples:

```txt
/api/orgs/acme/inventory/products/[productId]/extension
/api/orgs/acme/crm/customers/[customerId]/extension
/api/orgs/acme/leave/employees/[employeeId]/extension
/api/orgs/acme/purchasing/suppliers/[supplierId]/extension
/api/orgs/acme/inventory/warehouses/[warehouseId]/extension
```

## 11.3 Combined create APIs

When a module provides a convenient create screen that creates both the Business Object and extension, use a module route but make the behavior explicit.

Example:

```txt
POST /api/orgs/[orgSlug]/inventory/products
```

This endpoint may create:

```txt
Product
InventoryProductExtension
```

The API must:

1. create verified `PlatformContext`,
2. require module enablement,
3. require both Business Object and module permissions,
4. validate input with strict Zod schemas,
5. reject client-supplied `orgId`,
6. run the create in a transaction,
7. emit both object and extension events after successful mutation.

---

# 12. Event Rules

Business Object events and module extension events are separate.

## 12.1 Business Object events

Use the `objects` namespace.

Examples:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored
objects.customer.created
objects.supplier.updated
objects.employee.deactivated
objects.warehouse.deleted
```

## 12.2 Module extension events

Use the module namespace.

Examples:

```txt
inventory.product_extension.created
inventory.product_extension.updated
inventory.product_extension.deleted
crm.customer_extension.updated
leave.employee_extension.updated
purchasing.supplier_extension.updated
inventory.warehouse_extension.updated
```

## 12.3 Combined create event sequence

When creating both Product and InventoryProductExtension:

```txt
1. Product created
2. InventoryProductExtension created
3. Transaction commits
4. Emit objects.product.created
5. Emit inventory.product_extension.created
```

The events are facts about what happened.

They are not commands.

## 12.4 Event payload rules

Event payloads must be small and safe.

Good payload:

```ts
await sdk.events.emit(ctx, 'inventory.product_extension.updated', {
  productId,
  extensionId,
  changedFields: ['reorderPoint', 'minimumStock'],
})
```

Bad payload:

```ts
await sdk.events.emit(ctx, 'inventory.product_extension.updated', fullPrismaRecord)
```

Do not emit full records, secrets, private information, or large nested objects.

---

# 13. Zod Validation Rules

Extension schemas must be strict.

Example:

```ts
import { z } from 'zod'

export const updateInventoryProductExtensionSchema = z.strictObject({
  reorderPoint: z.number().int().min(0).nullable().optional(),
  minimumStock: z.number().int().min(0).nullable().optional(),
  maximumStock: z.number().int().min(0).nullable().optional(),
  valuationMethod: z.enum(['fifo', 'average', 'specific']).nullable().optional(),
  trackSerials: z.boolean().optional(),
  trackLots: z.boolean().optional(),
})
```

Forbidden:

```ts
export const schema = z.object({
  orgId: z.string(),
  productId: z.string(),
  reorderPoint: z.number(),
})
```

`productId` may come from the route parameter or body depending on API design, but `orgId` must never come from the client.

For APIs with route params:

```txt
/api/orgs/[orgSlug]/inventory/products/[productId]/extension
```

validate:

```ts
const paramsSchema = z.strictObject({
  orgSlug: z.string().min(1),
  productId: z.string().min(1),
})
```

---

# 14. Service Pattern

## 14.1 Required service shape

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'

export class InventoryProductExtensionService {
  static async get(ctx: PlatformContext, productId: string) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product_extension',
      action: 'read',
    })

    const db = sdk.getDb(ctx)

    return db.inventoryProductExtension.findFirst({
      where: {
        orgId: ctx.org.id,
        productId,
      },
    })
  }

  static async upsert(
    ctx: PlatformContext,
    productId: string,
    input: UpdateInventoryProductExtensionInput
  ) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product_extension',
      action: 'update',
    })

    const db = sdk.getDb(ctx)

    const product = await db.product.findFirst({
      where: {
        id: productId,
        orgId: ctx.org.id,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!product) {
      throw sdk.errors.notFound('Product not found.')
    }

    const extension = await db.inventoryProductExtension.upsert({
      where: {
        orgId_productId: {
          orgId: ctx.org.id,
          productId,
        },
      },
      create: {
        orgId: ctx.org.id,
        productId,
        ...input,
      },
      update: input,
    })

    await sdk.events.emit(ctx, 'inventory.product_extension.updated', {
      productId,
      extensionId: extension.id,
      changedFields: Object.keys(input),
    })

    return extension
  }
}
```

## 14.2 Forbidden service shape

```ts
export class InventoryProductExtensionService {
  static async upsert(orgId: string, productId: string, input: any) {
    return prisma.inventoryProductExtension.upsert({
      where: { orgId_productId: { orgId, productId } },
      create: { orgId, productId, ...input },
      update: input,
    })
  }
}
```

Problems:

```txt
Accepts loose orgId
Imports or implies raw Prisma
Does not verify product belongs to org
Does not enforce permissions
Does not emit events
Does not validate input
```

---

# 15. Transaction Rules

When creating or updating a Business Object and extension together, use an SDK-owned transaction.

Example:

```ts
const result = await sdk.db.transaction(ctx, async (tx) => {
  const product = await tx.product.create({
    data: {
      orgId: ctx.org.id,
      code: input.code,
      name: input.name,
      description: input.description,
      unit: input.unit,
    },
  })

  const extension = await tx.inventoryProductExtension.create({
    data: {
      orgId: ctx.org.id,
      productId: product.id,
      reorderPoint: input.reorderPoint,
      minimumStock: input.minimumStock,
    },
  })

  return { product, extension }
})

await sdk.events.emit(ctx, 'objects.product.created', {
  productId: result.product.id,
})

await sdk.events.emit(ctx, 'inventory.product_extension.created', {
  productId: result.product.id,
  extensionId: result.extension.id,
})
```

Events should be emitted after the transaction succeeds.

Future outbox behavior may make this more durable, but the service contract should already separate mutation success from event emission.

---

# 16. UI Rules

## 16.1 Do not duplicate Business Object fields in module UI

Inventory Product screens may show Product fields:

```txt
Code
Name
Unit
Category
```

But these are still Product fields.

Inventory-specific fields should be visually grouped:

```txt
Inventory Settings
  Reorder Point
  Minimum Stock
  Track Serials
  Track Lots
```

This teaches users and engineers the same model:

```txt
Product identity is shared.
Inventory settings are module-specific.
```

## 16.2 Detail pages should separate shared and module-specific sections

Recommended structure:

```txt
Product Detail

Header
  Product code
  Product name
  Status

Tabs or Sections
  Overview          → shared Product fields
  Inventory         → InventoryProductExtension
  Purchasing        → PurchasingProductExtension
  Activity          → future activity feed
```

Do not make separate product detail pages that disagree with each other.

Bad:

```txt
/inventory/products/[id]
/purchasing/products/[id]
/sales/products/[id]
```

all showing different product identity fields.

Better:

```txt
/objects/products/[id]
```

with module-specific tabs, or module routes that clearly embed the shared Product identity.

For MVP, module-specific routes are acceptable if the data model remains clean.

## 16.3 Empty extension behavior

If a Product exists but has no InventoryProductExtension yet, Inventory should not create a duplicate product.

It should show:

```txt
This product has not been configured for Inventory yet.
[Configure Inventory Settings]
```

Then create the extension record.

---

# 17. Promotion from Extension Field to Core Business Object

A field may start inside a module extension and later become part of the shared Business Object.

This is normal.

But it must follow a formal promotion process.

## 17.1 Promotion trigger

A field may be promoted when it satisfies the Three Independent Use Cases Rule.

Example:

```txt
barcode
```

Initially:

```txt
InventoryProductExtension.barcode
```

Later, three independent use cases need it:

```txt
Inventory uses barcode for stock lookup.
Sales uses barcode for POS scanning.
Purchasing uses barcode for supplier receiving.
```

Now `barcode` may be promoted to `Product.barcode`.

## 17.2 Required evidence log

Before promotion, create an evidence entry:

```md
Capability / Field: Product barcode
Current Location: InventoryProductExtension.barcode
Use Case 1: Inventory stock lookup
Use Case 2: Sales POS scanning
Use Case 3: Purchasing receiving
Decision: Promote to Product
Rationale: Barcode now describes product identity across three independent workflows.
Approved By: Founder / Architect
Date: YYYY-MM-DD
```

## 17.3 Required ADR

Promotion requires an ADR.

The ADR must answer:

```txt
Why is this no longer module-specific?
Which modules need it?
What data must be migrated?
What old fields are deprecated?
How will backward compatibility be maintained?
How will tests prove the migration is correct?
```

## 17.4 Migration process

Recommended process:

```txt
1. Add nullable field to core Business Object.
2. Backfill from extension table.
3. Update services to read from core field.
4. Temporarily dual-write if necessary.
5. Update UI to show the core field.
6. Add regression tests.
7. Mark extension field deprecated.
8. Remove extension field in a later migration only after safe period.
```

Do not move fields casually.

Field promotion is a compatibility event.

---

# 18. When Not to Use an Extension Table

Extension tables are powerful, but not every customization needs a table.

## 18.1 Use Settings for configuration that applies to a whole module

Example:

```txt
Default inventory valuation method for the organization
```

This belongs in module settings:

```txt
Setting
  module = "inventory"
  key = "defaultValuationMethod"
  value = "average"
```

Not in every Product extension unless it can vary by Product.

## 18.2 Use a workflow record for actions and history

Example:

```txt
A product was moved from Warehouse A to Warehouse B.
```

This is not an extension field.

It is a StockMovement or StockTransfer record.

## 18.3 Use a future Platform Service only after repeated need

Example:

```txt
Approval required before changing reorder point
```

Do not immediately build a generic Approval Engine.

If only Inventory needs it, keep it inside Inventory.

If Leave, Purchasing, and Expenses also need approvals, promote to Platform Service.

---

# 19. Anti-Patterns

## 19.1 Duplicate shared identity

Forbidden:

```prisma
model InventoryProduct {
  id    String @id
  orgId String
  code  String
  name  String
}
```

Why forbidden:

```txt
Duplicates Product.
Breaks shared identity.
Breaks search/reporting/AI later.
```

## 19.2 Module-specific fields on core object

Forbidden:

```prisma
model Product {
  id             String @id
  reorderPoint   Int?
  valuationMethod String?
}
```

Why forbidden:

```txt
Inventory-specific fields pollute Product.
```

## 19.3 Generic `customFields` JSON escape hatch

Forbidden in MVP:

```prisma
model Product {
  customFields Json?
}
```

Why forbidden:

```txt
Becomes untyped schema chaos.
Hard to validate.
Hard to index.
Hard to search.
Hard for AI to reason about.
Hard to migrate.
```

A future metadata-driven field system may exist, but it must be designed through Dynamic Systems documents, not added casually.

## 19.4 Extension without tenant-safe relation

Forbidden:

```prisma
model CRMCustomerExtension {
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
}
```

Required:

```prisma
model CRMCustomerExtension {
  orgId      String
  customerId String
  customer   Customer @relation(fields: [customerId, orgId], references: [id, orgId])
}
```

## 19.5 Client-submitted tenant identity

Forbidden:

```ts
const { orgId } = await req.json()
```

Required:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

## 19.6 Extension table without permission checks

Forbidden:

```ts
await db.inventoryProductExtension.update(...)
```

Required:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product_extension',
  action: 'update',
})
```

## 19.7 Extension table without events

Forbidden:

```ts
return db.inventoryProductExtension.update(...)
```

Required:

```ts
const updated = await db.inventoryProductExtension.update(...)

await sdk.events.emit(ctx, 'inventory.product_extension.updated', {
  productId,
  extensionId: updated.id,
  changedFields,
})
```

---

# 20. Examples by Business Object

## 20.1 Employee Extensions

Core Employee fields:

```txt
employeeNo
name
email
phone
departmentId
branchId
position
employmentType
hiredAt
isActive
```

Leave module extension:

```txt
LeaveEmployeeExtension
  employeeId
  annualLeaveCredits
  sickLeaveCredits
  carryOverCredits
  leavePolicyId
```

Assets module relationship:

```txt
AssetAssignment
  employeeId
  assetId
  assignedAt
  returnedAt
```

Projects module relationship:

```txt
ProjectMember
  employeeId
  projectId
  role
  allocationPercent
```

## 20.2 Product Extensions

Core Product fields:

```txt
code
name
description
categoryId
unit
isActive
```

Inventory extension:

```txt
InventoryProductExtension
  productId
  reorderPoint
  minimumStock
  maximumStock
  valuationMethod
  trackSerials
  trackLots
```

Purchasing extension:

```txt
PurchasingProductExtension
  productId
  purchaseUnit
  defaultLeadTimeDays
  requiresApproval
```

Sales extension:

```txt
SalesProductExtension
  productId
  sellingPrice
  taxable
  commissionable
```

## 20.3 Customer Extensions

Core Customer fields:

```txt
name
email
phone
address
isActive
```

CRM extension:

```txt
CRMCustomerExtension
  customerId
  lifecycleStage
  leadSource
  accountOwnerId
  lastContactedAt
```

Reservations extension:

```txt
ReservationCustomerExtension
  customerId
  preferredContactMethod
  bookingNotes
```

Support extension:

```txt
SupportCustomerExtension
  customerId
  supportTier
  slaPolicyId
```

## 20.4 Supplier Extensions

Core Supplier fields:

```txt
name
email
phone
address
isActive
```

Purchasing extension:

```txt
PurchasingSupplierExtension
  supplierId
  paymentTerms
  defaultLeadTimeDays
  taxRegistrationName
  approvalStatus
```

Inventory relationship:

```txt
InventorySupplierProduct
  supplierId
  productId
  supplierSku
  lastPurchasePrice
  isPreferred
```

Expenses extension:

```txt
ExpensesSupplierExtension
  supplierId
  defaultExpenseCategoryId
  requiresReceipt
```

## 20.5 Warehouse Extensions

Core Warehouse fields:

```txt
code
name
branchId
address
isActive
```

Inventory extension:

```txt
InventoryWarehouseExtension
  warehouseId
  allowNegativeStock
  binTrackingEnabled
  defaultReceivingArea
```

Assets extension:

```txt
AssetsWarehouseExtension
  warehouseId
  storesCompanyAssets
  custodianEmployeeId
```

Transfers workflow:

```txt
StockTransfer
  fromWarehouseId
  toWarehouseId
  status
  requestedBy
  approvedBy
```

---

# 21. Generator Requirements

Module generators must understand the extension pattern.

When Claude or a generator creates a module that touches a Business Object, it must ask:

```txt
Is this data shared identity?
Or module-specific behavior?
```

## 21.1 Generator must not create duplicate Business Objects

Forbidden generator output:

```txt
src/modules/inventory/schema.ts creates InventoryProduct model
src/modules/crm/schema.ts creates CRMCustomer model
src/modules/leave/schema.ts creates LeaveEmployee model
```

Required generator behavior:

```txt
Use Product, Customer, Employee, Supplier, Warehouse from Business Objects.
Create extension tables only for module-specific fields.
```

## 21.2 Generator should produce extension skeletons

Example generator output for Inventory + Product:

```txt
src/modules/inventory/product-extension/schema.ts
src/modules/inventory/product-extension/service.ts
src/modules/inventory/product-extension/permissions.ts
src/modules/inventory/product-extension/events.ts
src/modules/inventory/product-extension/__tests__/service.test.ts
```

## 21.3 Generated extension APIs must include

```txt
API-safe auth
verified PlatformContext
module enablement check
permission enforcement
strict Zod validation
client orgId rejection
tenant-safe object lookup
soft-delete behavior when applicable
event emission
cross-tenant tests
permission denial tests
```

---

# 22. Testing Requirements

Every extension table implementation must include tests for:

```txt
[ ] authorized user can read extension in own org
[ ] authorized user can update extension in own org
[ ] unauthorized user receives 403 JSON
[ ] unauthenticated request receives 401 JSON
[ ] user from Org A cannot read Org B extension
[ ] user from Org A cannot update Org B extension
[ ] extension cannot reference Business Object from another org
[ ] client-supplied orgId is rejected
[ ] deleted Business Object cannot be extended through normal API
[ ] update emits module extension event
[ ] combined create emits Business Object event and extension event
[ ] service accepts PlatformContext, not orgId
[ ] module does not import from @/kernel/*
[ ] module does not import raw Prisma
```

Tests must include at least two organizations:

```txt
orgA
orgB
```

Single-org tests are insufficient for extension logic.

---

# 23. Claude Implementation Rules

When implementing an extension pattern, Claude must follow these rules:

```txt
1. Do not add module-specific fields to Business Object tables.
2. Do not create duplicate Business Object tables inside modules.
3. Use module-owned extension tables.
4. Include orgId on every tenant-scoped extension table.
5. Use tenant-safe composite relations where possible.
6. Use verified PlatformContext.
7. Never accept orgId from client input.
8. Use sdk.getDb(ctx), not raw Prisma.
9. Enforce permissions in services and APIs.
10. Validate all inputs with strict Zod schemas.
11. Emit events after successful mutations.
12. Add two-org tenant isolation tests.
13. Add permission denial tests.
14. Do not build Dynamic Forms, customFields JSON, Party abstraction, or Platform Services unless explicitly authorized by a frozen document.
```

Claude must stop and ask for architectural review if it believes a module-specific field should move into a Business Object table.

---

# 24. Implementation Checklist

Before implementing a module extension, confirm:

```txt
[ ] The Business Object exists.
[ ] The proposed fields are module-specific.
[ ] The extension table has a clear owner module.
[ ] The extension table includes orgId.
[ ] The extension table has tenant-safe uniqueness.
[ ] The extension table has tenant-safe relation to the Business Object.
[ ] The module permission namespace is defined.
[ ] The extension event names are defined.
[ ] The API route path is defined.
[ ] The service accepts PlatformContext.
[ ] The API rejects client-supplied orgId.
[ ] The Zod schema is strict.
[ ] The tests include two organizations.
[ ] The UI separates shared object fields from module-specific fields.
```

---

# 25. Acceptance Criteria

This document is ready to be marked `Frozen` when:

```txt
[ ] The founder accepts that Business Objects remain minimal.
[ ] The founder accepts that modules extend, not duplicate, Business Objects.
[ ] The founder accepts that module-specific fields belong in extension tables.
[ ] The founder accepts that extension tables require orgId.
[ ] The founder accepts that extension services receive PlatformContext.
[ ] The founder accepts that Business Object permissions and extension permissions are separate.
[ ] The founder accepts that Business Object events and extension events are separate.
[ ] The founder accepts the field-promotion process.
[ ] The founder accepts that generic customFields JSON is forbidden in MVP.
[ ] Claude can implement module extensions from this document without inventing architecture.
```

---

# 26. Deferred Decisions

The following are intentionally deferred:

```txt
Generic Party abstraction for Customer/Supplier
Custom field metadata engine
Dynamic Form Engine
Dynamic CRUD Engine
Polymorphic extension table system
Per-org custom schema fields
Field-level permissions
ABAC condition evaluator
Approval workflow for extension changes
Outbox-backed event delivery
```

Do not implement these during the restarted MVP build unless a later frozen document explicitly authorizes them.

---

# 27. Final Rule

The final rule is:

```txt
Business Objects define what something is.
Modules define what the business does with it.
Extension tables connect the two without corrupting either.
```

If Claude or a future engineer is unsure whether a field belongs in a Business Object or an extension table, default to the extension table.

It is easier to promote a proven extension field into a Business Object later than to remove a bad core field after many modules and clients depend on it.
