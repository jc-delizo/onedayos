# OneDayOS Engineering Manual — 17 Module Specifications — 01 Inventory Module

**Document ID:** `17-module-specifications/01-inventory-module.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Inventory Implementation  
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
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/02-product.md`
- `07-business-objects/04-supplier.md`
- `07-business-objects/05-warehouse.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/*`
- `09-cli-generators/*`
- `13-security/*`
- `14-testing-quality/*`
- `17-module-specifications/00-module-spec-template.md`

---

# 1. Purpose

The Inventory Module is the first official OneDayOS business module.

Its purpose is to let a Philippine SME know:

```txt
What products do we track?
Where are they stored?
How many do we have?
Why did stock increase or decrease?
Which items are below reorder threshold?
Who performed each inventory movement?
```

Inventory is not the platform. Inventory is the first proof that the platform works.

It must prove that OneDayOS can combine:

```txt
Kernel
+ SDK
+ PlatformContext
+ tenant isolation
+ permissions
+ Business Objects
+ module-owned tables
+ extension tables
+ event emission
+ API contracts
+ tests
+ design system
+ one-day delivery discipline
```

The module must be built in a way that future modules can copy safely.

---

# 2. Core Position

The Inventory Module owns **inventory behavior**, not shared product identity.

```txt
Product = shared Business Object
Warehouse = shared Business Object
Supplier = shared Business Object
Inventory = stock behavior around those objects
```

Therefore:

```txt
Inventory does not own Product.
Inventory does not own Warehouse.
Inventory does not own Supplier.
Inventory must not create InventoryProduct, InventoryWarehouse, or InventorySupplier as duplicate identity tables.
```

Inventory may create extension and transaction tables that reference those Business Objects.

Correct examples:

```txt
InventoryProductExtension
StockBalance
StockMovement
StockAdjustment
InventorySupplierProduct
```

Incorrect examples:

```txt
InventoryProduct
InventoryWarehouse
InventorySupplier
ProductForInventory
StockProduct
WarehouseInventoryMaster
```

---

# 3. Non-Goals

The first Inventory Module must stay intentionally focused.

It must not include:

```txt
point-of-sale
sales orders
purchase orders
purchase request approvals
supplier billing
customer invoicing
accounting
barcode scanning hardware integration
serial number tracking
lot tracking
expiry tracking
manufacturing / bill of materials
multi-unit conversion engine
inventory valuation / costing engine
FIFO / weighted-average costing
warehouse bin/shelf management
transfer approval workflow
full audit log UI
activity timeline
comments
attachments
notifications
background jobs
global search
AI inventory assistant
dynamic CRUD runtime
custom fields engine
mobile app
offline mode
```

Some of these may become future module features or Platform Services, but they are outside the first official Inventory implementation.

---

# 4. Business Workflows

## 4.1 Product inventory setup

A user configures inventory-specific behavior for an existing or newly created Product.

Example:

```txt
Product: Bond Paper A4
Unit: ream
Inventory tracking: enabled
Reorder point: 20
Default warehouse: Main Warehouse
```

Important:

Product identity is created through the Business Objects layer, not through an Inventory-owned product table.

The Inventory module may provide a convenience screen that creates both:

```txt
Product
+ InventoryProductExtension
```

in one transaction, but it must respect both Business Object and Inventory permissions.

---

## 4.2 View stock balances

A user views current stock quantities by Product and Warehouse.

Example:

```txt
Product              Warehouse        On Hand
Bond Paper A4        Main Warehouse   120
Printer Ink Black    Main Warehouse   8
Face Mask Box        Branch B         35
```

Stock balance is a derived operational state maintained by inventory mutations.

StockBalance must not be edited directly by users.

---

## 4.3 Create stock adjustment

A user adjusts stock because of physical count, damage, correction, shrinkage, opening balance, or other non-purchase/non-sale reason.

Example:

```txt
Product: Printer Ink Black
Warehouse: Main Warehouse
Current stock: 8
Actual count: 10
Adjustment: +2
Reason: Physical count correction
```

The service creates:

```txt
StockAdjustment
+ StockMovement
+ StockBalance update
+ inventory.stock_adjustment.created event
+ inventory.stock_movement.created event
```

The adjustment must be transactional.

If any part fails, none of it should persist.

---

## 4.4 Record stock movement

A stock movement is the source-of-truth ledger of inventory changes.

Examples:

```txt
opening_balance
adjustment_in
adjustment_out
transfer_in
transfer_out
manual_in
manual_out
```

The first Inventory implementation should support:

```txt
opening_balance
adjustment_in
adjustment_out
manual_in
manual_out
```

Transfers may be deferred unless required for the first client. If implemented, transfers must create paired movements.

---

## 4.5 Detect low stock

When a mutation causes Product stock to fall below reorder threshold, the module may emit:

```txt
inventory.stock_level.reorder_threshold_crossed
```

The first implementation may show low-stock rows in the Inventory UI.

It must not build a full Notification Service.

Low-stock detection is Inventory-local until repeated notification use cases justify Platform Notification Service.

---

# 5. Business Objects Used

Inventory uses these shared Business Objects:

```txt
Product
ProductCategory
Supplier
Warehouse
Employee/User actor context
```

## 5.1 Product

Product is required.

Inventory references Product through `productId` and `orgId`.

Inventory must not add stock fields to core Product.

Forbidden core Product fields:

```txt
quantity
stock
reorderPoint
minimumStock
maximumStock
cost
price
warehouseId
supplierId
barcode
serialNumber
lotNumber
expiryDate
valuationMethod
```

These belong to Inventory or another module.

---

## 5.2 ProductCategory

ProductCategory is part of the Product Business Object area.

Inventory may display/filter by category, but Inventory does not own categories.

---

## 5.3 Warehouse

Warehouse is required.

Warehouse is a shared Business Object, not an Inventory-owned table.

Inventory references Warehouse through `warehouseId` and `orgId`.

Inventory must not create duplicate warehouse identity tables.

---

## 5.4 Supplier

Supplier is optional for first implementation.

Supplier may be referenced later through `InventorySupplierProduct`, but Supplier identity belongs to the Business Objects layer.

The first Inventory module should not build Purchasing workflows.

---

## 5.5 Employee / User

Inventory actions are performed by authenticated platform users.

The actor is represented by `ctx.user.id`.

If the user has a linked Employee record, the UI may display employee details later, but Inventory should not require every user to have an Employee record.

---

# 6. Module-Owned Entities

Inventory owns these records:

```txt
InventoryProductExtension
StockBalance
StockMovement
StockAdjustment
```

Optional future records:

```txt
StockTransfer
StockTransferLine
InventorySupplierProduct
InventoryCycleCount
InventoryCountLine
```

Only the first group is required for MVP Inventory.

---

# 7. Data Model

## 7.1 InventoryProductExtension

Purpose:

Stores inventory-specific configuration for a Product.

Suggested Prisma shape:

```prisma
model InventoryProductExtension {
  id                 String    @id @default(cuid())
  orgId              String
  productId           String
  isTracked           Boolean   @default(true)
  reorderPoint        Decimal?  @db.Decimal(18, 4)
  defaultWarehouseId  String?
  notes               String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?
  deletedBy           String?

  org              Organization @relation(fields: [orgId], references: [id])
  product          Product      @relation(fields: [productId, orgId], references: [id, orgId])
  defaultWarehouse Warehouse?   @relation(fields: [defaultWarehouseId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
  @@index([orgId, isTracked])
  @@index([orgId, defaultWarehouseId])
  @@map("inventory_product_extensions")
}
```

Notes:

- `productId + orgId` should be used for tenant-safe relations.
- `defaultWarehouseId` is optional.
- `reorderPoint` is optional because not all products need low-stock monitoring.
- No cost/price/valuation fields in the first implementation.

---

## 7.2 StockBalance

Purpose:

Stores current quantity for a Product at a Warehouse.

Suggested Prisma shape:

```prisma
model StockBalance {
  id          String   @id @default(cuid())
  orgId       String
  productId   String
  warehouseId String
  quantity    Decimal  @default(0) @db.Decimal(18, 4)
  updatedAt   DateTime @updatedAt

  org       Organization @relation(fields: [orgId], references: [id])
  product   Product      @relation(fields: [productId, orgId], references: [id, orgId])
  warehouse Warehouse    @relation(fields: [warehouseId, orgId], references: [id, orgId])

  @@unique([orgId, productId, warehouseId])
  @@index([orgId, warehouseId])
  @@index([orgId, productId])
  @@map("stock_balances")
}
```

Notes:

- StockBalance is tenant-scoped.
- StockBalance is not soft-deletable in MVP because it is an operational state row.
- If a product or warehouse is deleted/deactivated, the balance may remain for historical consistency but should be hidden through service rules.
- Users must not edit StockBalance directly.

---

## 7.3 StockMovement

Purpose:

Stores the immutable ledger of stock changes.

Suggested Prisma shape:

```prisma
model StockMovement {
  id               String    @id @default(cuid())
  orgId            String
  productId        String
  warehouseId      String
  type             String
  quantityDelta    Decimal   @db.Decimal(18, 4)
  resultingQuantity Decimal? @db.Decimal(18, 4)
  sourceType       String?
  sourceId         String?
  reason           String?
  occurredAt       DateTime  @default(now())
  createdBy        String
  createdAt        DateTime  @default(now())

  org       Organization @relation(fields: [orgId], references: [id])
  product   Product      @relation(fields: [productId, orgId], references: [id, orgId])
  warehouse Warehouse    @relation(fields: [warehouseId, orgId], references: [id, orgId])
  actor     User         @relation(fields: [createdBy], references: [id])

  @@index([orgId, productId, occurredAt])
  @@index([orgId, warehouseId, occurredAt])
  @@index([orgId, sourceType, sourceId])
  @@map("stock_movements")
}
```

Notes:

- StockMovement should generally be immutable.
- Do not soft-delete movements casually.
- Corrections should be recorded as new movements, not by editing old movements.
- `quantityDelta` may be positive or negative.
- `resultingQuantity` is optional but recommended for easier audit/debugging.
- `sourceType/sourceId` supports traceability without direct cross-module coupling.

Allowed movement types for MVP:

```txt
opening_balance
adjustment_in
adjustment_out
manual_in
manual_out
```

Future movement types:

```txt
transfer_in
transfer_out
purchase_receipt
sales_issue
reservation_hold
reservation_release
production_consume
production_output
```

---

## 7.4 StockAdjustment

Purpose:

Stores the business record explaining why an adjustment happened.

Suggested Prisma shape:

```prisma
model StockAdjustment {
  id             String    @id @default(cuid())
  orgId          String
  productId       String
  warehouseId     String
  quantityBefore  Decimal   @db.Decimal(18, 4)
  quantityAfter   Decimal   @db.Decimal(18, 4)
  quantityDelta   Decimal   @db.Decimal(18, 4)
  reason          String
  notes           String?
  status          String    @default("posted")
  createdBy       String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  deletedBy       String?

  org       Organization @relation(fields: [orgId], references: [id])
  product   Product      @relation(fields: [productId, orgId], references: [id, orgId])
  warehouse Warehouse    @relation(fields: [warehouseId, orgId], references: [id, orgId])
  actor     User         @relation(fields: [createdBy], references: [id])

  @@index([orgId, productId, createdAt])
  @@index([orgId, warehouseId, createdAt])
  @@index([orgId, createdBy])
  @@map("stock_adjustments")
}
```

Notes:

- MVP adjustment status is probably always `posted`.
- Draft/approval workflow is deferred.
- Deleting an adjustment should be avoided after posting.
- If a correction is needed, create another adjustment.
- Soft delete is included only for administrative cleanup, not normal reversal.

---

# 8. Decimal Quantity Rule

Inventory quantities should use Decimal, not JavaScript floating point numbers.

Reason:

Some SMEs track units like:

```txt
kg
liters
meters
boxes
cases
packs
pieces
```

Avoid floating point errors.

Use database Decimal fields such as:

```txt
Decimal @db.Decimal(18, 4)
```

In TypeScript, services must treat quantities carefully and avoid unsafe arithmetic with plain floats when possible.

MVP may accept string/number input through Zod, but service-level conversion should normalize to Decimal-compatible values.

---

# 9. Permissions

Inventory module permissions use the `inventory` namespace.

Business Object permissions remain in the `objects` namespace.

## 9.1 Module permissions

Required MVP permissions:

```ts
export const INVENTORY_PERMISSIONS = [
  {
    module: 'inventory',
    resource: 'dashboard',
    action: 'read',
    description: 'View inventory dashboard.',
  },
  {
    module: 'inventory',
    resource: 'product_extension',
    action: 'read',
    description: 'View inventory-specific product settings.',
  },
  {
    module: 'inventory',
    resource: 'product_extension',
    action: 'create',
    description: 'Create inventory-specific product settings.',
  },
  {
    module: 'inventory',
    resource: 'product_extension',
    action: 'update',
    description: 'Update inventory-specific product settings.',
  },
  {
    module: 'inventory',
    resource: 'stock_balance',
    action: 'read',
    description: 'View stock balances.',
  },
  {
    module: 'inventory',
    resource: 'stock_movement',
    action: 'read',
    description: 'View stock movement history.',
  },
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'read',
    description: 'View stock adjustments.',
  },
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
    description: 'Create stock adjustments.',
  },
]
```

Optional future permissions:

```txt
inventory.stock_adjustment.delete
inventory.stock_adjustment.restore
inventory.stock_transfer.create
inventory.stock_transfer.read
inventory.stock_transfer.post
inventory.stock_count.create
inventory.stock_count.post
inventory.export
inventory.import
```

Do not include future permissions in the MVP manifest unless the corresponding feature exists.

---

## 9.2 Business Object permissions required by Inventory screens

Inventory screens may require Business Object permissions:

```txt
objects.product.read
objects.product.create
objects.product.update
objects.warehouse.read
objects.warehouse.create
objects.supplier.read
```

If the Inventory UI creates a Product and InventoryProductExtension in one workflow, the operation requires both:

```txt
objects.product.create
inventory.product_extension.create
```

If it updates Product core fields and Inventory extension fields, it requires both:

```txt
objects.product.update
inventory.product_extension.update
```

---

## 9.3 Permission enforcement rule

Every protected Inventory operation must pass:

```txt
authentication
+ tenant membership
+ module enablement
+ permission
+ validation
```

API routes must enforce permissions before service calls.

Services must enforce permissions internally during MVP.

UI permission checks are usability only.

---

# 10. Routes

## 10.1 Page routes

Inventory pages live under the organization shell:

```txt
/[orgSlug]/inventory
/[orgSlug]/inventory/products
/[orgSlug]/inventory/products/new
/[orgSlug]/inventory/products/[productId]
/[orgSlug]/inventory/stock-levels
/[orgSlug]/inventory/stock-movements
/[orgSlug]/inventory/adjustments
/[orgSlug]/inventory/adjustments/new
/[orgSlug]/inventory/settings
```

MVP may start with fewer pages if delivery pressure requires it, but the module spec should preserve this target structure.

Minimum official MVP pages:

```txt
/[orgSlug]/inventory
/[orgSlug]/inventory/products
/[orgSlug]/inventory/stock-levels
/[orgSlug]/inventory/adjustments
/[orgSlug]/inventory/adjustments/new
```

---

## 10.2 API routes

Inventory APIs live under tenant-scoped module API paths:

```txt
/api/orgs/[orgSlug]/inventory/dashboard
/api/orgs/[orgSlug]/inventory/product-extensions
/api/orgs/[orgSlug]/inventory/product-extensions/[id]
/api/orgs/[orgSlug]/inventory/stock-balances
/api/orgs/[orgSlug]/inventory/stock-movements
/api/orgs/[orgSlug]/inventory/stock-adjustments
/api/orgs/[orgSlug]/inventory/stock-adjustments/[id]
```

Forbidden API paths:

```txt
/api/inventory
/api/inventory?orgId=...
/api/products/inventory
/api/orgs/[orgId]/inventory
```

The client may send `orgSlug` through the route path.

The client must never send `orgId` in body/query.

---

# 11. API Contracts

Every API returns:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: Record<string, unknown>
}
```

APIs return JSON only.

APIs never redirect.

Unauthenticated requests return JSON `401`.

Wrong-org access returns safe JSON `404`.

Missing permission returns JSON `403`.

Validation errors return JSON `400` with `VALIDATION_ERROR`.

---

## 11.1 List stock balances

```txt
GET /api/orgs/[orgSlug]/inventory/stock-balances
```

Query params:

```txt
productId?
warehouseId?
lowStockOnly?
page?
pageSize?
```

Permissions:

```txt
inventory.stock_balance.read
```

Response:

```ts
type StockBalanceListItem = {
  id: string
  productId: string
  productCode: string
  productName: string
  warehouseId: string
  warehouseName: string
  quantity: string
  reorderPoint: string | null
  isLowStock: boolean
  updatedAt: string
}
```

---

## 11.2 List stock movements

```txt
GET /api/orgs/[orgSlug]/inventory/stock-movements
```

Query params:

```txt
productId?
warehouseId?
type?
from?
to?
page?
pageSize?
```

Permissions:

```txt
inventory.stock_movement.read
```

Response:

```ts
type StockMovementListItem = {
  id: string
  productId: string
  productCode: string
  productName: string
  warehouseId: string
  warehouseName: string
  type: string
  quantityDelta: string
  resultingQuantity: string | null
  reason: string | null
  occurredAt: string
  createdByName: string
}
```

---

## 11.3 Create stock adjustment

```txt
POST /api/orgs/[orgSlug]/inventory/stock-adjustments
```

Permissions:

```txt
inventory.stock_adjustment.create
```

Body:

```ts
type CreateStockAdjustmentInput = {
  productId: string
  warehouseId: string
  quantityAfter: string
  reason: string
  notes?: string
}
```

Forbidden body fields:

```txt
orgId
createdBy
quantityBefore
quantityDelta
status
createdAt
updatedAt
deletedAt
deletedBy
```

The server derives:

```txt
orgId from PlatformContext
createdBy from PlatformContext
quantityBefore from current StockBalance
quantityDelta from quantityAfter - quantityBefore
status from service rules
```

Response:

```ts
type StockAdjustmentCreated = {
  id: string
  productId: string
  warehouseId: string
  quantityBefore: string
  quantityAfter: string
  quantityDelta: string
  reason: string
  createdAt: string
}
```

---

# 12. Zod Schemas

Schemas must use `z.strictObject()` by default.

Example:

```ts
export const CreateStockAdjustmentSchema = z.strictObject({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantityAfter: z.string().min(1),
  reason: z.string().min(2).max(200),
  notes: z.string().max(1000).optional(),
})
```

Client-supplied `orgId` must fail validation.

Schemas must live in module files safe for client import unless they contain server-only logic.

Database-backed validation must happen in services, not client-safe schemas.

---

# 13. Services

Inventory services must receive verified `PlatformContext`, not loose `orgId`.

Correct:

```ts
InventoryStockAdjustmentService.create(ctx, input)
```

Incorrect:

```ts
InventoryStockAdjustmentService.create(orgId, input)
InventoryStockAdjustmentService.create(inputWithOrgId)
```

Suggested service files:

```txt
src/modules/inventory/service.ts
src/modules/inventory/services/product-extension-service.ts
src/modules/inventory/services/stock-balance-service.ts
src/modules/inventory/services/stock-movement-service.ts
src/modules/inventory/services/stock-adjustment-service.ts
```

MVP may use one `service.ts` initially if the module is small, but the interfaces should remain clean.

---

## 13.1 StockAdjustmentService.create

Required behavior:

```txt
1. Require inventory.stock_adjustment.create.
2. Validate Product belongs to ctx.org.id and is not deleted.
3. Validate Warehouse belongs to ctx.org.id and is not deleted/inactive.
4. Find or create StockBalance for Product + Warehouse.
5. Calculate quantityBefore.
6. Calculate quantityDelta.
7. Create StockAdjustment.
8. Create StockMovement.
9. Update StockBalance.
10. Emit inventory.stock_adjustment.created.
11. Emit inventory.stock_movement.created.
12. If threshold crossed, emit inventory.stock_level.reorder_threshold_crossed.
13. Return DTO.
```

This must happen inside a transaction.

If any write fails, the whole operation fails.

---

## 13.2 StockBalanceService.list

Required behavior:

```txt
1. Require inventory.stock_balance.read.
2. Scope by ctx.org.id.
3. Exclude soft-deleted Product and Warehouse records.
4. Support filters only through allowlisted query fields.
5. Return DTOs, not raw Prisma records.
```

---

## 13.3 StockMovementService.list

Required behavior:

```txt
1. Require inventory.stock_movement.read.
2. Scope by ctx.org.id.
3. Support filters only through allowlisted query fields.
4. Exclude records linked to deleted Product/Warehouse from normal UI unless explicit admin mode exists.
5. Return DTOs, not raw Prisma records.
```

---

## 13.4 ProductExtensionService.createOrUpdate

Required behavior:

```txt
1. Require inventory.product_extension.create or inventory.product_extension.update.
2. Validate Product belongs to ctx.org.id.
3. Validate default Warehouse belongs to ctx.org.id if provided.
4. Upsert InventoryProductExtension.
5. Emit inventory.product_extension.created or inventory.product_extension.updated.
```

---

# 14. Events

Inventory emits module-owned events.

Business Object events remain under `objects.*`.

## 14.1 Required Inventory events

```txt
inventory.product_extension.created
inventory.product_extension.updated
inventory.stock_adjustment.created
inventory.stock_movement.created
inventory.stock_level.reorder_threshold_crossed
```

Optional future events:

```txt
inventory.stock_transfer.created
inventory.stock_transfer.posted
inventory.stock_count.started
inventory.stock_count.posted
inventory.stock_adjustment.reversed
```

---

## 14.2 Event naming rule

Events must follow:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Good:

```txt
inventory.stock_adjustment.created
inventory.stock_movement.created
inventory.stock_level.reorder_threshold_crossed
```

Bad:

```txt
inventory.stock.low
inventory.notify.low_stock
inventory.product.created
send.email
stockAdjusted
```

Why `inventory.product.created` is bad:

Product is a Business Object. Its event is:

```txt
objects.product.created
```

Inventory can emit:

```txt
inventory.product_extension.created
```

---

## 14.3 Event payload rules

Payloads must not include:

```txt
orgId
full Prisma records
sensitive fields
secrets
entire request body
```

Payloads should include stable identifiers and small context:

```ts
type InventoryStockAdjustmentCreatedPayload = {
  adjustmentId: string
  productId: string
  warehouseId: string
  quantityDelta: string
  createdBy: string
}
```

The `EventEnvelope` carries tenant context through `PlatformContext`.

---

# 15. Module Manifest

Inventory manifest must be pure metadata.

It must not self-register as a side effect.

Suggested manifest:

```ts
export const inventoryManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '0.1.0',
  lifecycle: 'draft',
  icon: 'Package',
  compatibility: {
    platform: { min: '0.1.0', maxTested: '0.1.x' },
    sdk: { min: '0.1.0', maxTested: '0.1.x' },
    manifest: { min: '1.0.0', maxTested: '1.0.x' },
  },
  dependencies: [],
  businessObjectsUsed: [
    { object: 'product', required: true },
    { object: 'warehouse', required: true },
    { object: 'supplier', required: false },
  ],
  ownedEntities: [
    'inventory_product_extension',
    'stock_balance',
    'stock_movement',
    'stock_adjustment',
  ],
  permissions: INVENTORY_PERMISSIONS,
  navItems: [
    {
      label: 'Inventory',
      href: '/inventory',
      icon: 'Package',
      requiredPermission: {
        module: 'inventory',
        resource: 'dashboard',
        action: 'read',
      },
    },
    {
      label: 'Stock Levels',
      href: '/inventory/stock-levels',
      icon: 'Boxes',
      requiredPermission: {
        module: 'inventory',
        resource: 'stock_balance',
        action: 'read',
      },
    },
    {
      label: 'Adjustments',
      href: '/inventory/adjustments',
      icon: 'SlidersHorizontal',
      requiredPermission: {
        module: 'inventory',
        resource: 'stock_adjustment',
        action: 'read',
      },
    },
  ],
  events: {
    emits: [
      'inventory.product_extension.created',
      'inventory.product_extension.updated',
      'inventory.stock_adjustment.created',
      'inventory.stock_movement.created',
      'inventory.stock_level.reorder_threshold_crossed',
    ],
    listens: [
      'objects.product.deleted',
      'objects.warehouse.deleted',
    ],
  },
  settings: [],
  aiContext: 'inventoryAiContext',
} satisfies ModuleManifest
```

The exact type shape must follow the frozen Module Manifest document.

---

# 16. Navigation

Inventory navigation should be permission-aware.

Minimum sidebar items:

```txt
Inventory
Stock Levels
Adjustments
```

Optional later:

```txt
Products
Stock Movements
Transfers
Settings
```

Business Object pages like Products and Warehouses may appear globally under Business Objects or inside Inventory as convenience links, but the ownership must remain clear.

If Inventory shows a Products page, it is a view over Business Object Product plus InventoryProductExtension — not an Inventory-owned product table.

---

# 17. UI Screens

## 17.1 Inventory Dashboard

Purpose:

Quick operational summary.

MVP widgets:

```txt
Total tracked products
Low-stock products
Total warehouses with stock
Recent stock movements
Recent adjustments
```

Dashboard widgets must respect permissions.

A user without `inventory.stock_balance.read` must not see stock totals.

---

## 17.2 Stock Levels Table

Purpose:

Show current stock by Product and Warehouse.

Columns:

```txt
Product Code
Product Name
Category
Warehouse
Quantity
Reorder Point
Status
Updated At
Actions
```

Status examples:

```txt
OK
Low Stock
Not Tracked
```

Actions:

```txt
Adjust Stock
View Movements
```

Actions must be hidden if the user lacks permission, but API/service enforcement remains mandatory.

---

## 17.3 Stock Movements Table

Purpose:

Show ledger of stock changes.

Columns:

```txt
Date
Product
Warehouse
Type
Quantity Delta
Resulting Quantity
Reason
Created By
Source
```

Movements are normally read-only.

---

## 17.4 Adjustments List

Purpose:

Show adjustment records.

Columns:

```txt
Date
Product
Warehouse
Before
After
Delta
Reason
Created By
```

---

## 17.5 New Adjustment Form

Purpose:

Create a posted stock adjustment.

Fields:

```txt
Product
Warehouse
Current Quantity (read-only)
New Quantity
Reason
Notes
```

Forbidden fields:

```txt
orgId
createdBy
quantityBefore
quantityDelta
status
```

The server derives these.

---

# 18. Forms

Forms must follow the Form Standards document.

General rules:

```txt
No hidden orgId fields.
Server validation is authoritative.
Relation fields are tenant-scoped.
Relation IDs are revalidated server-side.
Non-obvious fields get tooltips.
Optimistic UI may be used only when rollback is clear.
```

## 18.1 Adjustment form validation

Validation rules:

```txt
productId required
warehouseId required
quantityAfter required
quantityAfter must be a valid decimal >= 0
reason required, 2-200 characters
notes optional, max 1000 characters
```

Business rules:

```txt
Product must belong to ctx.org.id.
Product must not be deleted.
Warehouse must belong to ctx.org.id.
Warehouse must not be deleted.
Warehouse should be active if Warehouse has isActive.
Product should be tracked in InventoryProductExtension.
```

Whether to allow negative quantity is a founder/product decision.

Recommendation for MVP:

```txt
Do not allow resulting stock below zero.
```

If future clients need negative inventory, make it an inventory setting later.

---

# 19. Tables

Inventory tables must use the shared DataTable / table standards.

Tables must support at least:

```txt
loading state
empty state
permission-aware row actions
search/filter placeholders or basic filters
stable column alignment
responsive layout
```

MVP can use server-side simple filtering.

Dynamic Table View Engine remains deferred.

---

# 20. Settings

MVP settings should be minimal.

Suggested future settings, not required immediately:

```txt
allowNegativeStock: boolean
lowStockDetectionEnabled: boolean
defaultAdjustmentReason: string | null
showStockValue: boolean
```

Do not implement settings until they are needed.

If implemented, settings must use Kernel `Setting` patterns and be scoped:

```txt
module = 'inventory'
key = 'allowNegativeStock'
```

Settings must not become custom code per client.

---

# 21. Reports

Inventory MVP may include simple module-local summary cards and tables.

Do not implement Platform Reporting Service.

Allowed MVP reporting-like views:

```txt
Low-stock list
Recent movements
Stock by warehouse
```

Deferred:

```txt
report builder
scheduled reports
export engine
PDF reports
cross-module reports
AI reports
valuation reports
```

Export requires separate permission and is not included by default.

---

# 22. AI Context

Inventory should include static module AI context metadata.

This context teaches future AI what Inventory means, but it must not access tenant data.

Suggested concepts:

```txt
Inventory tracks quantities of Products stored in Warehouses.
Product and Warehouse are shared Business Objects.
StockBalance is current operational state.
StockMovement is the ledger of quantity changes.
StockAdjustment explains manual corrections.
Inventory does not own purchasing, sales, accounting, or approvals.
```

Safe future questions:

```txt
What does the Inventory module do?
How do I adjust stock?
What is the difference between Product and StockBalance?
Why can't I delete a stock movement?
```

Unsafe future questions until runtime AI is approved:

```txt
Show me all low-stock products.
Export all inventory records.
Adjust stock for Product X.
Delete old stock movements.
```

Runtime AI remains deferred.

---

# 23. Import / Export

Full Import / Export Engine is deferred.

For one-day onboarding, developer/founder-run scripts may load initial Products, Warehouses, and opening balances if approved.

Rules:

```txt
No client-supplied orgId.
Use verified/provisioned org context.
Validate before writing.
Use services where possible.
Do not duplicate Business Objects.
Do not bypass permission/tenant assumptions casually.
Opening balances should create StockMovement records.
```

Do not build client-facing Inventory import UI in MVP.

Do not build generic export UI in MVP.

---

# 24. Security Requirements

Inventory must satisfy all security gates.

Required:

```txt
Authentication required for every page/API.
Tenant membership required for every page/API.
Inventory module must be enabled for the org.
Permission required for every operation.
Services enforce permissions.
APIs enforce permissions.
No client-supplied orgId.
No raw Prisma in module UI/API files.
No imports from @/kernel/* inside module code.
No direct imports from other modules.
No full Prisma records in API responses.
No full records in event payloads.
No deleted records in normal reads.
```

Wrong-org access must fail safely.

---

# 25. Testing Requirements

Inventory is the first official module, so its tests define the standard.

## 25.1 Required test fixture states

Tests must include:

```txt
Org Alpha
Org Beta
Alpha Admin
Alpha Staff with inventory permissions
Alpha Staff without inventory permissions
Beta Staff
Inventory enabled for Alpha
Inventory disabled for Beta or another test org
Product in Alpha
Product in Beta
Warehouse in Alpha
Warehouse in Beta
StockBalance in Alpha
StockMovement in Alpha
Soft-deleted Product or Warehouse case
```

---

## 25.2 Service tests

Required service tests:

```txt
list stock balances scopes to ctx.org.id
list stock balances excludes other org data
list stock balances requires inventory.stock_balance.read
create adjustment requires inventory.stock_adjustment.create
create adjustment rejects Product from another org
create adjustment rejects Warehouse from another org
create adjustment rejects deleted Product
create adjustment rejects deleted Warehouse
create adjustment updates StockBalance
create adjustment creates StockMovement
create adjustment creates StockAdjustment
create adjustment emits events after success
create adjustment does not emit events after failed validation
create adjustment rejects negative resulting stock if allowNegativeStock is false/not implemented
```

---

## 25.3 API tests

Required API tests:

```txt
unauthenticated request returns JSON 401
wrong-org request returns safe JSON 404
module-disabled request returns MODULE_NOT_FOUND 404
missing permission returns JSON 403
client-supplied orgId returns validation error
invalid productId returns validation/business error
invalid warehouseId returns validation/business error
successful adjustment returns { data, error }
API never redirects
API never returns HTML
```

---

## 25.4 Tenant isolation tests

Required:

```txt
Org Alpha cannot read Org Beta stock balances.
Org Alpha cannot adjust Org Beta product.
Org Alpha cannot adjust stock into Org Beta warehouse.
Org Alpha cannot infer Org Beta record existence from errors.
```

---

## 25.5 Permission tests

Required:

```txt
Admin wildcard can access Inventory only if module enabled.
Staff with read can view balances but cannot adjust.
Staff with adjustment create can adjust stock.
Staff without permission cannot view balances.
Staff without permission cannot create adjustment.
UI hides actions for users without permission.
API denies even if user manually calls endpoint.
Service denies even if called from internal code without permission.
```

---

## 25.6 Event tests

Required:

```txt
successful adjustment emits inventory.stock_adjustment.created
successful adjustment emits inventory.stock_movement.created
low-stock threshold crossing emits inventory.stock_level.reorder_threshold_crossed
failed adjustment emits no events
payloads do not include orgId
payloads do not include full Prisma records
```

---

## 25.7 Architecture tests

Required architecture checks:

```txt
No import from @/kernel/* inside src/modules/inventory.
No raw Prisma import inside src/modules/inventory.
No import from another module.
No sdk.getDb(orgId).
No request.nextUrl.searchParams.get('orgId').
No body.orgId.
No /api/inventory route.
No InventoryProduct duplicate identity model.
```

---

# 26. Implementation Plan

Inventory should be implemented only after foundation gates are satisfied.

## 26.1 Prerequisites

Before Inventory implementation:

```txt
[ ] Production Readiness Gate v2 reviewed
[ ] Kernel auth implemented
[ ] tenant isolation implemented
[ ] permission enforcement implemented
[ ] API contracts implemented
[ ] SDK server/client split implemented
[ ] sdk.getDb(ctx) implemented
[ ] Business Object Product implemented
[ ] Business Object Warehouse implemented
[ ] Business Object events implemented
[ ] Module system implemented
[ ] Module generator safety rails implemented
[ ] test fixtures created
[ ] check:architecture exists
```

If these are not done, Claude must not start Inventory implementation.

---

## 26.2 Implementation phases

### Phase 1 — Scaffold

Use the module generator:

```bash
npm run module:create inventory
```

Then verify generated output follows the current manual, not the old MVP pattern.

Generated output must include:

```txt
manifest
permissions
schemas
services
events
navigation
AI context
tests
API route skeletons
page skeletons
```

---

### Phase 2 — Database models

Add:

```txt
InventoryProductExtension
StockBalance
StockMovement
StockAdjustment
```

Create Prisma migration.

Run locally and in test database.

Do not use `prisma db push` for committed work.

---

### Phase 3 — Services

Implement service methods using `PlatformContext`.

Recommended order:

```txt
ProductExtensionService
StockBalanceService
StockMovementService
StockAdjustmentService
```

---

### Phase 4 — APIs

Implement tenant-scoped APIs:

```txt
/api/orgs/[orgSlug]/inventory/stock-balances
/api/orgs/[orgSlug]/inventory/stock-movements
/api/orgs/[orgSlug]/inventory/stock-adjustments
```

All APIs use `sdk.api.handle()` or equivalent standard wrapper.

---

### Phase 5 — UI

Implement pages:

```txt
Inventory Dashboard
Stock Levels
Adjustments
New Adjustment
```

Do not overbuild.

Use design system components.

---

### Phase 6 — Tests

Implement all required tests.

No official module acceptance without security tests.

---

### Phase 7 — Seed / Demo data

Add optional demo data for Inventory only in demo seed or fixture scripts.

Do not add client-specific data to global seed.

---

# 27. Claude Implementation Prompt

Use this prompt only after this document is approved and the prerequisite manuals are frozen.

```md
You are implementing the OneDayOS Inventory Module.

Authoritative documents:
- docs/engineering-manual/17-module-specifications/01-inventory-module.md
- docs/engineering-manual/17-module-specifications/00-module-spec-template.md
- docs/engineering-manual/08-module-system/*
- docs/engineering-manual/05-sdk/*
- docs/engineering-manual/06-data/*
- docs/engineering-manual/07-business-objects/*
- docs/engineering-manual/13-security/*
- docs/engineering-manual/14-testing-quality/*

Non-negotiable rules:
- Do not invent architecture.
- Do not import from @/kernel/* inside modules.
- Do not import raw Prisma inside modules.
- Do not import from other modules.
- Do not create InventoryProduct as a duplicate Product identity table.
- Product, Warehouse, and Supplier are Business Objects.
- Module services receive PlatformContext, not orgId.
- Use sdk.getDb(ctx), never sdk.getDb(orgId).
- API routes must live under /api/orgs/[orgSlug]/inventory/...
- Pages must live under /[orgSlug]/inventory/...
- Client-supplied orgId must be rejected.
- API routes return JSON only; never redirect.
- Enforce permissions in APIs and services.
- Add tenant-isolation and permission-denial tests.
- Events must follow the documented event contracts.
- Do not implement deferred Platform Services.
- Do not add FastAPI, Python backend files, Celery, Alembic, or SQLAlchemy.

Task:
Implement only the MVP Inventory scope described in the approved module specification.

Before coding:
1. List files you will create/modify.
2. Confirm prerequisite platform helpers exist.
3. Stop if the current codebase does not contain PlatformContext, sdk.getDb(ctx), API auth helpers, or permission enforcement helpers.

After coding:
Run and report:
- npm run lint
- npm run typecheck
- npm run test:run
- npm run build
- npm run check:architecture
```

---

# 28. Acceptance Criteria

Inventory is accepted only when all are true:

```txt
[ ] Module manifest is valid and pure metadata.
[ ] Inventory module is enabled through OrgModule.
[ ] Inventory pages live under /[orgSlug]/inventory/...
[ ] Inventory APIs live under /api/orgs/[orgSlug]/inventory/...
[ ] Product remains a Business Object.
[ ] Warehouse remains a Business Object.
[ ] Supplier remains a Business Object.
[ ] No duplicate InventoryProduct identity table exists.
[ ] InventoryProductExtension references Product tenant-safely.
[ ] StockBalance references Product and Warehouse tenant-safely.
[ ] StockMovement records stock ledger entries.
[ ] StockAdjustment creates movement and balance update transactionally.
[ ] Services receive PlatformContext.
[ ] No service accepts loose orgId.
[ ] No client-supplied orgId is accepted.
[ ] APIs return JSON only.
[ ] APIs do not redirect.
[ ] Permissions are enforced in APIs.
[ ] Permissions are enforced in services.
[ ] Wrong-org access fails safely.
[ ] Module-disabled access fails safely.
[ ] Soft-deleted Product/Warehouse records are excluded from normal flows.
[ ] Events are emitted after successful mutations.
[ ] Events are not emitted after failed mutations.
[ ] Event payloads do not include orgId or full records.
[ ] Tests use at least two organizations.
[ ] Tests include non-admin denial cases.
[ ] Architecture checks pass.
[ ] Typecheck passes.
[ ] Test suite passes.
[ ] Build passes.
```

---

# 29. Founder Review Checklist

Before approving implementation, confirm:

```txt
[ ] Inventory scope is intentionally small enough for first official module.
[ ] No purchasing, sales, accounting, approval, attachment, or notification behavior slipped in.
[ ] Product ownership remains in Business Objects.
[ ] Warehouse ownership remains in Business Objects.
[ ] Stock adjustment workflow is commercially useful for first SMEs.
[ ] Low-stock behavior is local UI/event only, not full notifications.
[ ] Tests are strong enough to prevent tenant/permission regressions.
[ ] Claude prompt is narrow enough.
```

---

# 30. Final Rule

Inventory should prove the OneDayOS platform.

It should not become the place where OneDayOS hides unfinished platform decisions.

If Inventory feels hard to implement, fix the platform pattern.

Do not make Inventory a special case.
