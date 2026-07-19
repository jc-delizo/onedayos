# OneDayOS Engineering Manual — 07 Business Objects — 02 Product

**Document ID:** `07-business-objects/02-product.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** No — freeze required before Claude implementation  
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

---

# 1. Purpose

This document defines the **Product** Business Object for OneDayOS.

Product is the shared business identity for goods, items, materials, SKUs, services, or sellable/procurable things that multiple modules may reference.

Product is not owned by Inventory.

Product is not owned by Purchasing.

Product is not owned by Sales, CRM, Reservations, or any future module.

Product belongs to the **Business Objects** layer.

Modules may reference Product.

Modules may extend Product.

Modules may not duplicate Product.

---

# 2. Core Architectural Decision

## 2.1 Product is a shared Business Object

Product exists once per organization.

```txt
Organization
  └── Product
        ├── Inventory references it
        ├── Purchasing references it
        ├── Sales/CRM references it
        ├── Reservations may reference it
        └── Reporting/Search/AI may index it
```

This means:

```txt
Inventory does not create its own Product table.
Purchasing does not create its own Item table.
CRM does not create its own Catalog Item table.
```

They all reference the same Product identity.

## 2.2 Inventory extends Product; it does not own Product

Inventory may own inventory-specific records such as:

```txt
InventoryProductExtension
StockBalance
StockMovement
StockAdjustment
ReorderRule
WarehouseStock
Lot
SerialNumber
```

But Inventory must not own the Product master record.

Bad:

```txt
InventoryProduct
  id
  orgId
  code
  name
  unit
  stockQuantity
  reorderPoint
```

Good:

```txt
Product
  id
  orgId
  code
  name
  unit

InventoryProductExtension
  id
  orgId
  productId
  reorderPoint
  minimumStock
  maximumStock
  valuationMethod
```

## 2.3 Product is an identity, not a stock record

A Product says:

```txt
What is this thing?
```

Inventory says:

```txt
How much of this thing do we have?
Where is it?
How did it move?
What is its valuation?
```

Purchasing says:

```txt
Who supplies this thing?
At what cost?
Under what purchasing terms?
```

Sales/CRM says:

```txt
How do we sell or quote this thing?
At what price?
To which customers?
```

These concerns must stay separate.

---

# 3. Non-Goals

The Product Business Object must not become an inventory engine, purchasing catalog, sales catalog, pricing engine, warehouse system, or ERP product monster.

## 3.1 Product must not include stock fields

Do not add these to core Product:

```txt
stockQuantity
availableQuantity
reservedQuantity
warehouseId
binLocation
minimumStock
maximumStock
reorderPoint
reorderQuantity
valuationMethod
averageCost
lastCost
serialNumber
lotNumber
expiryDate
```

These belong to Inventory or Inventory-adjacent extensions.

## 3.2 Product must not include purchasing-specific fields

Do not add these to core Product:

```txt
preferredSupplierId
supplierSku
lastPurchasePrice
purchaseCurrency
leadTimeDays
minimumOrderQuantity
purchaseTaxCode
```

These belong to Purchasing extension tables.

## 3.3 Product must not include sales-specific fields

Do not add these to core Product:

```txt
sellingPrice
priceListId
discountRate
salesTaxCode
commissionRate
quoteDescription
customerSpecificPrice
```

These belong to Sales, CRM, Billing, or Pricing modules.

## 3.4 Product must not include accounting fields

Do not add these to core Product:

```txt
revenueAccountId
expenseAccountId
inventoryAccountId
cogsAccountId
taxCategoryId
```

These belong to Accounting or future integration layers.

## 3.5 Product variants are deferred

Do not build a full variant system in MVP.

Do not add:

```txt
ProductVariant
VariantOption
AttributeSet
Color
Size
Style
Matrix SKU
```

until repeated use cases prove that variants are necessary.

For MVP, `Product.code` represents the usable business identifier.

If a client sells T-shirts by size and color, the MVP approach is:

```txt
Product: TSHIRT-BLACK-S
Product: TSHIRT-BLACK-M
Product: TSHIRT-BLACK-L
```

not:

```txt
Product: T-Shirt
Variant: Black / Small
Variant: Black / Medium
Variant: Black / Large
```

Variant modeling may be revisited after enough clients need it.

---

# 4. Product vs SKU Decision

## 4.1 MVP decision

For MVP, **Product and SKU are the same operational object**.

`Product.code` is the organization-specific product code/SKU/item code.

The UI may label it as:

```txt
Product Code
Item Code
SKU
```

depending on client/module wording, but the database field remains:

```txt
Product.code
```

## 4.2 Why not separate SKU yet?

A separate SKU layer adds complexity:

```txt
Product
  └── SKU
        └── Inventory Stock
```

This is correct for mature retail/ecommerce systems, but too heavy for the first OneDayOS platform build.

Most Philippine SMEs initially need:

```txt
code
name
category
unit
```

They do not initially need a variant matrix.

## 4.3 When to revisit

Create a future ADR for ProductVariant/SKU separation if at least three independent use cases require it, such as:

```txt
1. Apparel size/color matrices
2. Product bundles/kits with component inventory
3. Ecommerce integrations requiring parent product + child SKU hierarchy
```

Until then, keep Product simple.

---

# 5. Product Core Fields

## 5.1 Required MVP fields

The core Product table should include only lowest-common-denominator fields.

```txt
id
orgId
code
name
unit
isActive
createdAt
updatedAt
deletedAt
deletedBy
```

## 5.2 Optional MVP fields

The following fields are acceptable in the core Product table:

```txt
description
categoryId
```

Reason:

```txt
description helps identify the Product across modules
categoryId helps organize/search/report Products across modules
```

## 5.3 Fields intentionally excluded

The following are intentionally excluded from core Product:

```txt
barcode
imageUrl
sellingPrice
purchasePrice
cost
supplierId
warehouseId
stockQuantity
reorderPoint
brand
manufacturer
model
serialNumber
lotNumber
expiryDate
weight
dimensions
taxCode
accountingCode
```

Some of these may feel common. They are still not universal enough for the core Product object.

If a field is needed by one module, place it in that module.

If a field is needed by two modules, still resist promotion.

If a field is needed by three independent modules or use cases, record evidence and promote through the Business Object extension process.

---

# 6. Product Status vs Soft Delete

Product needs two different lifecycle concepts:

```txt
isActive
  Business status. Can this Product still be selected/used?

deletedAt / deletedBy
  Record deletion lifecycle. Was this Product record removed from normal views?
```

## 6.1 `isActive`

Use `isActive = false` when the Product is discontinued, temporarily unavailable, obsolete, or no longer selectable for new transactions.

Inactive Products may still appear in historical records.

Example:

```txt
Product: Old Printer Cartridge
isActive: false
```

Existing purchase orders, stock movements, sales records, or audit logs can still reference it.

## 6.2 `deletedAt`

Use soft delete only when the Product record itself should be removed from normal operational use, such as:

```txt
Duplicate product created by mistake
Test product entered into production
Incorrect product master record
```

Soft-deleted Products should not appear in normal lists, search results, dropdowns, reports, or AI context unless explicitly requested through an admin restore path.

## 6.3 Do not use delete for discontinued products

Bad:

```txt
Delete Product because company no longer sells it.
```

Good:

```txt
Set Product.isActive = false.
```

---

# 7. ProductCategory

## 7.1 Category is part of the Product Business Object area

ProductCategory is a supporting shared object used to organize Products.

It is not an Inventory-owned object.

It is not a Purchasing-owned object.

It belongs with Product in the Business Objects layer.

## 7.2 ProductCategory core fields

```txt
id
orgId
name
parentId
createdAt
updatedAt
deletedAt
deletedBy
```

## 7.3 Category hierarchy

The MVP may support simple parent/child categories through `parentId`.

Example:

```txt
Office Supplies
  └── Paper
  └── Ink
  └── Pens
```

However, do not build a full category management engine in MVP.

Do not build:

```txt
category attributes
category-specific fields
category-level permissions
category-specific pricing
category-specific tax rules
category path materialization
```

until real client/module needs prove it.

## 7.4 Category naming uniqueness

For MVP, ProductCategory names should be unique within an organization.

Recommended constraint:

```prisma
@@unique([orgId, name])
```

This is intentionally simpler than unique-per-parent category names.

Reason:

Nullable `parentId` creates uniqueness edge cases in PostgreSQL. Avoid creating subtle duplicate-category behavior early.

If repeated category names under different parents become necessary, create an ADR and revisit the model.

---

# 8. Recommended Prisma Model

This is the recommended new-build schema shape.

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

  org      Organization     @relation(fields: [orgId], references: [id])
  category ProductCategory? @relation(fields: [categoryId], references: [id])

  @@unique([orgId, code])
  @@unique([id, orgId])
  @@index([orgId, name])
  @@index([orgId, categoryId])
  @@index([orgId, isActive])
  @@map("products")
}

model ProductCategory {
  id        String    @id @default(cuid())
  orgId     String
  name      String
  parentId  String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  deletedBy String?

  org      Organization      @relation(fields: [orgId], references: [id])
  parent   ProductCategory?  @relation("ProductCategoryParent", fields: [parentId], references: [id])
  children ProductCategory[] @relation("ProductCategoryParent")
  products Product[]

  @@unique([orgId, name])
  @@unique([id, orgId])
  @@index([orgId, parentId])
  @@map("product_categories")
}
```

## 8.1 Why `@@unique([id, orgId])` exists

This supports tenant-safe composite references from module extension tables.

Example:

```prisma
model InventoryProductExtension {
  id        String @id @default(cuid())
  orgId     String
  productId String

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
}
```

This makes it harder to accidentally reference a Product from another organization.

## 8.2 Why `code` is org-unique

Product codes are tenant-specific.

Two clients may both use `ITEM-001`.

That must be allowed.

```txt
Client A: ITEM-001 = Bond Paper
Client B: ITEM-001 = Cleaning Alcohol
```

Therefore:

```prisma
@@unique([orgId, code])
```

not:

```prisma
@unique(code)
```

---

# 9. Product Extension Pattern

Modules extend Product through module-owned tables.

They do not add module-specific fields to Product.

## 9.1 Inventory extension example

```prisma
model InventoryProductExtension {
  id              String   @id @default(cuid())
  orgId           String
  productId        String
  reorderPoint     Int?
  minimumStock     Int?
  maximumStock     Int?
  valuationMethod  String?
  defaultWarehouseId String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
  @@index([orgId, productId])
  @@map("inventory_product_extensions")
}
```

## 9.2 Purchasing extension example

```prisma
model PurchasingProductExtension {
  id                  String   @id @default(cuid())
  orgId               String
  productId            String
  preferredSupplierId  String?
  supplierSku          String?
  leadTimeDays         Int?
  minimumOrderQuantity Int?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
  @@index([orgId, productId])
  @@map("purchasing_product_extensions")
}
```

## 9.3 Sales/CRM extension example

```prisma
model SalesProductExtension {
  id              String   @id @default(cuid())
  orgId           String
  productId        String
  defaultPrice     Decimal?
  quoteDescription String?
  isSellable       Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
  @@index([orgId, productId])
  @@map("sales_product_extensions")
}
```

## 9.4 Extension promotion rule

If the same extension field appears in at least three independent use cases, record it in the evidence log and consider promoting it to core Product.

Example:

```txt
barcode
  Use case 1: Inventory scanning
  Use case 2: POS checkout
  Use case 3: Warehouse receiving
  Decision: Consider ProductIdentifier or ProductBarcode shared object
```

Do not promote fields casually.

---

# 10. API Contract

Product APIs must follow the Kernel API Contract.

They must return JSON only.

They must never redirect.

They must never accept client-supplied `orgId`.

They must create verified `PlatformContext` before doing work.

## 10.1 Product API routes

Recommended routes:

```txt
GET    /api/orgs/[orgSlug]/objects/products
POST   /api/orgs/[orgSlug]/objects/products
GET    /api/orgs/[orgSlug]/objects/products/[productId]
PATCH  /api/orgs/[orgSlug]/objects/products/[productId]
DELETE /api/orgs/[orgSlug]/objects/products/[productId]
POST   /api/orgs/[orgSlug]/objects/products/[productId]/restore
```

## 10.2 ProductCategory API routes

Recommended routes:

```txt
GET    /api/orgs/[orgSlug]/objects/product-categories
POST   /api/orgs/[orgSlug]/objects/product-categories
PATCH  /api/orgs/[orgSlug]/objects/product-categories/[categoryId]
DELETE /api/orgs/[orgSlug]/objects/product-categories/[categoryId]
POST   /api/orgs/[orgSlug]/objects/product-categories/[categoryId]/restore
```

## 10.3 Route behavior

Every route must follow this order:

```txt
1. Validate route params
2. Create API PlatformContext from session + orgSlug
3. Validate request body/query with Zod
4. Reject client-supplied orgId
5. Require permission
6. Call ProductService/ProductCategoryService
7. Return { data, error, meta? }
```

Example:

```ts
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  return sdk.api.handle(req, async () => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

    await sdk.permissions.require(ctx, {
      module: 'objects',
      resource: 'product',
      action: 'create',
    })

    const input = await sdk.validation.parseJson(req, CreateProductSchema)
    const product = await ProductService.create(ctx, input)

    return sdk.api.created(product)
  })
}
```

---

# 11. Service Contract

Product services must receive verified `PlatformContext`.

They must not receive loose `orgId` strings.

Bad:

```ts
ProductService.list(orgId)
ProductService.create(orgId, input)
ProductService.delete(productId, orgId)
```

Good:

```ts
ProductService.list(ctx, filters)
ProductService.create(ctx, input)
ProductService.update(ctx, productId, input)
ProductService.softDelete(ctx, productId)
ProductService.restore(ctx, productId)
```

## 11.1 ProductService methods

Recommended service surface:

```ts
export const ProductService = {
  list(ctx: PlatformContext, filters: ProductListFilters): Promise<ProductListResult>,
  getById(ctx: PlatformContext, productId: string): Promise<ProductDto | null>,
  getByCode(ctx: PlatformContext, code: string): Promise<ProductDto | null>,
  create(ctx: PlatformContext, input: CreateProductInput): Promise<ProductDto>,
  update(ctx: PlatformContext, productId: string, input: UpdateProductInput): Promise<ProductDto>,
  deactivate(ctx: PlatformContext, productId: string): Promise<ProductDto>,
  reactivate(ctx: PlatformContext, productId: string): Promise<ProductDto>,
  softDelete(ctx: PlatformContext, productId: string): Promise<void>,
  restore(ctx: PlatformContext, productId: string): Promise<ProductDto>,
}
```

## 11.2 ProductCategoryService methods

Recommended service surface:

```ts
export const ProductCategoryService = {
  list(ctx: PlatformContext): Promise<ProductCategoryDto[]>,
  create(ctx: PlatformContext, input: CreateProductCategoryInput): Promise<ProductCategoryDto>,
  update(ctx: PlatformContext, categoryId: string, input: UpdateProductCategoryInput): Promise<ProductCategoryDto>,
  softDelete(ctx: PlatformContext, categoryId: string): Promise<void>,
  restore(ctx: PlatformContext, categoryId: string): Promise<ProductCategoryDto>,
}
```

## 11.3 Service responsibilities

ProductService must:

```txt
scope every query by ctx.org.id
exclude soft-deleted records by default
validate business invariants
emit Product events
avoid direct module coupling
return DTOs, not raw Prisma records
```

ProductService must not:

```txt
check Inventory stock
create StockMovement records
determine purchase pricing
determine sales pricing
send notifications directly
call module services
import from modules
```

---

# 12. Permissions

Product permissions use the `objects` module namespace.

## 12.1 Product permissions

```txt
objects.product.read
objects.product.create
objects.product.update
objects.product.delete
objects.product.restore
objects.product.import
objects.product.export
```

## 12.2 ProductCategory permissions

```txt
objects.product_category.read
objects.product_category.create
objects.product_category.update
objects.product_category.delete
objects.product_category.restore
```

## 12.3 Permission examples

Inventory staff may need:

```txt
objects.product.read
inventory.stock_balance.read
inventory.stock_movement.create
```

Inventory managers may need:

```txt
objects.product.read
objects.product.create
objects.product.update
inventory.stock_adjustment.create
inventory.stock_adjustment.approve
```

Purchasing staff may need:

```txt
objects.product.read
purchasing.purchase_order.create
```

Admins may have:

```txt
*.*.*
```

but wildcard permissions never bypass tenant isolation.

## 12.4 Module enablement is separate from Product permission

Product is a shared Business Object.

A user may have Product permissions because multiple modules need Product lookup.

Do not assume:

```txt
Inventory enabled = user can manage Products
```

Correct logic:

```txt
Organization has relevant module enabled
AND user has objects.product.* permission
```

For shared object admin screens, Product access is permission-driven, not owned by a single module.

---

# 13. Validation Rules

All Product input must be validated with Zod on the server.

Client validation is for user experience only.

Server validation is mandatory.

## 13.1 CreateProductSchema

Recommended shape:

```ts
import { z } from 'zod'

export const CreateProductSchema = z.strictObject({
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  unit: z.string().trim().min(1).max(32).default('pcs'),
  isActive: z.boolean().optional(),
})
```

`orgId` must not be present.

If `orgId` is present, validation should fail.

## 13.2 UpdateProductSchema

```ts
export const UpdateProductSchema = z.strictObject({
  code: z.string().trim().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  unit: z.string().trim().min(1).max(32).optional(),
  isActive: z.boolean().optional(),
})
```

## 13.3 CreateProductCategorySchema

```ts
export const CreateProductCategorySchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().min(1).optional().nullable(),
})
```

## 13.4 Product code normalization

Product codes should be normalized before storage.

Recommended MVP rule:

```txt
trim whitespace
preserve case for display
compare using exact stored value initially
```

Do not add complex normalization early unless required.

If case-insensitive uniqueness is needed later, create an ADR and add a normalized column such as:

```txt
normalizedCode
```

Do not retrofit this casually after many clients have data.

---

# 14. Events

Every Product and ProductCategory mutation must emit an event.

Events are emitted through `sdk.events.emit(ctx, ...)`.

Events use verified `PlatformContext`.

Events are facts, not commands.

## 14.1 Product events

```txt
objects.product.created
objects.product.updated
objects.product.deactivated
objects.product.reactivated
objects.product.deleted
objects.product.restored
```

## 14.2 ProductCategory events

```txt
objects.product_category.created
objects.product_category.updated
objects.product_category.deleted
objects.product_category.restored
```

## 14.3 Product event payloads

Payloads should be small and stable.

Example:

```ts
export type ProductCreatedPayload = {
  productId: string
  code: string
  name: string
  categoryId: string | null
}
```

Do not emit full Prisma records.

Do not emit sensitive or module-specific fields.

Do not include cross-tenant data.

## 14.4 Event consumers

Future consumers may include:

```txt
Audit Log Service
Search Service
AI Context Indexer
Reporting Service
Notification Service
Inventory module listeners
Purchasing module listeners
```

Product must not know who listens.

ProductService emits facts and stops there.

---

# 15. Search, Reporting, and AI Context

## 15.1 Searchable Product fields

MVP searchable fields:

```txt
code
name
description
category.name
```

Do not search module extension fields from Product search unless the specific module contributes search metadata later.

## 15.2 Product display label

Product should have a standard display label:

```txt
{code} — {name}
```

Example:

```txt
PAPER-A4 — A4 Bond Paper
```

If code is hidden by UI settings, the database still keeps code as the stable identifier.

## 15.3 AI context

Product AI context may include:

```txt
Product code
Product name
Description
Category
Unit
Active/inactive status
```

Product AI context must not include:

```txt
cross-tenant data
soft-deleted products by default
module-specific prices/costs/stock unless user has relevant module permissions
```

The AI layer must respect Product permissions and module permissions separately.

---

# 16. UI Rules

Product UI must inherit the OneDayOS design system.

## 16.1 Product list

The Product list should be data-dense and keyboard-friendly.

Default columns:

```txt
Code
Name
Category
Unit
Status
Updated At
Actions
```

Optional later columns:

```txt
Created At
Created By
```

Do not show inventory stock quantity in the core Product list unless the Inventory module contributes a joined view/widget.

## 16.2 Product form

Default fields:

```txt
Code
Name
Description
Category
Unit
Active
```

The form should not include:

```txt
Stock Quantity
Reorder Point
Supplier
Selling Price
Purchase Cost
Warehouse
```

Those belong to module-specific screens or extension panels.

## 16.3 Product detail page

The Product detail page may eventually show module-contributed panels:

```txt
Core Details
Inventory Summary
Purchasing Info
Sales Info
Activity
```

But in MVP, do not build a full plugin panel system unless required by the Module System document.

Start simple.

---

# 17. Import and Export

Product import/export is useful but should not become a full import engine inside the Product object.

## 17.1 MVP import

If implemented early, Product import must be simple CSV import with server-side validation.

Required columns:

```txt
code
name
unit
```

Optional columns:

```txt
description
category
isActive
```

## 17.2 Import must be tenant-safe

Import must:

```txt
use verified PlatformContext
reject orgId columns
validate each row
scope duplicates by ctx.org.id
emit events for created/updated Products
produce row-level errors
```

## 17.3 Export must be permission-safe

Product export requires:

```txt
objects.product.export
```

Export must exclude soft-deleted products unless an explicit admin restore/export mode is used.

---

# 18. Integration With Modules

## 18.1 Inventory module

Inventory may:

```txt
list Products
create Products if user has objects.product.create
extend Products with inventory settings
track stock balances by Product
emit inventory-specific events
```

Inventory may not:

```txt
own the Product table
add stock fields to Product
create duplicate Product records for inventory only
```

## 18.2 Purchasing module

Purchasing may:

```txt
reference Product on purchase request lines
reference Product on purchase order lines
store supplier-specific product metadata in PurchasingProductExtension
```

Purchasing may not:

```txt
add supplier fields to Product
create its own Item table
```

## 18.3 CRM/Sales module

CRM/Sales may:

```txt
reference Product in opportunities, quotes, or orders
store sales-specific descriptions or prices in module tables
```

CRM/Sales may not:

```txt
add sellingPrice to Product
create a separate SalesProduct master table
```

## 18.4 Reporting/Search/AI

Reporting, Search, and AI may consume Product events and metadata later.

They must respect tenant context, permissions, and module enablement.

---

# 19. Tenant Isolation Rules

Product is tenant-scoped.

Every Product query must be scoped by `ctx.org.id`.

Bad:

```ts
await prisma.product.findUnique({
  where: { id: productId },
})
```

Good:

```ts
await db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Better if composite unique constraints are available through SDK helpers:

```ts
await db.product.findUnique({
  where: {
    id_orgId: {
      id: productId,
      orgId: ctx.org.id,
    },
  },
})
```

But normal service code should still make soft-delete behavior explicit or use SDK query helpers that guarantee it.

## 19.1 Client-supplied `orgId` is forbidden

Never accept this:

```json
{
  "orgId": "org_abc",
  "code": "ITEM-001",
  "name": "A4 Paper"
}
```

The server derives tenant identity from:

```txt
session + orgSlug + verified platform User
```

not the request body.

## 19.2 Cross-tenant product references are forbidden

Module extension tables must not be able to reference Products from another organization.

Use composite references where possible:

```prisma
product Product @relation(fields: [productId, orgId], references: [id, orgId])
```

---

# 20. Testing Requirements

Product implementation is not complete without tests.

## 20.1 Required Product service tests

```txt
creates product inside ctx.org.id
rejects duplicate code inside same org
allows same code across different orgs
lists only products from ctx.org.id
excludes soft-deleted products by default
gets product by id only within ctx.org.id
updates product only within ctx.org.id
soft deletes product with deletedAt/deletedBy
restores product only with restore permission path
does not hard delete product
emits objects.product.created
emits objects.product.updated
emits objects.product.deleted
```

## 20.2 Required API tests

```txt
unauthenticated request returns 401 JSON
wrong-org request returns safe 404 JSON
authenticated but unauthorized request returns 403 JSON
invalid body returns VALIDATION_ERROR
body containing orgId is rejected
POST creates product only in caller org
GET list excludes another org's products
PATCH cannot update another org's product
DELETE cannot delete another org's product
```

## 20.3 Required ProductCategory tests

```txt
creates category inside ctx.org.id
rejects duplicate name inside same org
allows same category name across different orgs
lists only categories from ctx.org.id
soft deletes category
prevents unsafe delete if active products depend on category, unless behavior is explicitly defined
```

## 20.4 Required extension tests

When a module extends Product, tests must prove:

```txt
extension row belongs to same org as Product
extension cannot reference cross-tenant Product
extension creation uses verified PlatformContext
extension does not duplicate core Product fields
```

---

# 21. Error Behavior

Product APIs must use the Kernel API error contract.

Examples:

## 21.1 Duplicate code

```json
{
  "data": null,
  "error": {
    "code": "CONFLICT",
    "message": "A product with this code already exists."
  }
}
```

## 21.2 Product not found

```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found."
  }
}
```

For wrong-org product access, return the same not-found response.

Do not reveal that a Product exists in another organization.

## 21.3 Permission denied

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

---

# 22. Claude Implementation Rules

When Claude implements Product, it must follow these rules.

## 22.1 Required rules

```txt
Use Product as a Business Object, not a module object.
Place Product APIs under /api/orgs/[orgSlug]/objects/products.
Use verified PlatformContext.
Use sdk.getDb(ctx).
Reject client-supplied orgId.
Use objects.product.* permissions.
Emit objects.product.* events.
Use soft delete.
Add two-org tenant isolation tests.
Add permission denial tests.
Add validation tests.
Do not import from @/kernel inside modules.
Do not use FastAPI.
```

## 22.2 Forbidden patterns

Claude must not generate:

```ts
ProductService.create(orgId, input)
sdk.getDb(orgId)
prisma.product.findUnique({ where: { id } })
body.orgId
input.orgId
/api/products?orgId=...
/api/inventory/products as the canonical Product API
inventory.product.created for core Product creation
```

The canonical event is:

```txt
objects.product.created
```

not:

```txt
inventory.product.created
```

because Product is not owned by Inventory.

---

# 23. Acceptance Criteria

This document can be considered implemented only when:

```txt
[ ] Product model exists with orgId tenancy
[ ] ProductCategory model exists with orgId tenancy
[ ] Product APIs live under /api/orgs/[orgSlug]/objects/products
[ ] ProductCategory APIs live under /api/orgs/[orgSlug]/objects/product-categories
[ ] Product services receive PlatformContext
[ ] Product services never accept loose orgId
[ ] Client-supplied orgId is rejected
[ ] Product permissions use objects.product.*
[ ] ProductCategory permissions use objects.product_category.*
[ ] Product mutations emit objects.product.* events
[ ] ProductCategory mutations emit objects.product_category.* events
[ ] Product soft delete uses deletedAt/deletedBy
[ ] Discontinued Products use isActive = false, not deletedAt
[ ] Product list excludes soft-deleted records by default
[ ] Duplicate Product code is scoped by orgId
[ ] Same Product code is allowed across different organizations
[ ] Cross-tenant read tests pass
[ ] Cross-tenant write tests pass
[ ] Permission denial tests pass
[ ] Validation tests pass
[ ] No module defines a duplicate Product table
[ ] No Inventory stock fields exist on Product
[ ] No Purchasing fields exist on Product
[ ] No Sales pricing fields exist on Product
[ ] No FastAPI backend is introduced
```

---

# 24. Final Architectural Position

Product is one of the most important Business Objects in OneDayOS.

If Product is modeled incorrectly, every future operational module will inherit the mistake.

The correct model is:

```txt
Product = shared business identity
Inventory = stock behavior around Product
Purchasing = procurement behavior around Product
Sales/CRM = commercial behavior around Product
Reporting/Search/AI = platform consumers of Product facts
```

Do not let the first Inventory implementation define Product too narrowly.

Do not let future Sales or Purchasing modules duplicate it.

Keep Product minimal, tenant-scoped, event-emitting, permission-protected, and extension-friendly.

That is what allows OneDayOS to become a real Business Operating System instead of a collection of one-off apps.
