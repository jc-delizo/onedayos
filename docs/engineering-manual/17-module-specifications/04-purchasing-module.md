# OneDayOS Engineering Manual — 17 Module Specifications — 04 Purchasing Module

**Document ID:** `17-module-specifications/04-purchasing-module.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Purchasing Module Implementation  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/*`
- `05-sdk/*`
- `06-data/*`
- `07-business-objects/*`
- `08-module-system/*`
- `09-cli-generators/*`
- `13-security/*`
- `14-testing-quality/*`
- `17-module-specifications/00-module-spec-template.md`
- `17-module-specifications/01-inventory-module.md`

---

# 1. Purpose

The Purchasing Module manages procurement workflows for Philippine SMEs.

It answers questions like:

```txt
What do we need to buy?
Who requested it?
Was it approved?
Which supplier are we buying from?
Has the purchase order been issued?
Have the goods been received?
Which purchase orders are still open?
```

The Purchasing Module is a **Business Module**.

It is not a standalone app.

It is not a mini-ERP inside OneDayOS.

It is one reusable business capability inside the shared OneDayOS platform.

---

# 2. Core Architectural Rule

The most important rule is:

```txt
Purchasing owns procurement behavior.
Purchasing does not own Supplier, Product, Warehouse, or Employee.
```

Therefore:

```txt
Supplier = shared Business Object
Product = shared Business Object
Warehouse = shared Business Object
Employee = shared Business Object
Purchasing = workflow around buying products/services from suppliers
```

Purchasing may reference and extend these Business Objects.

Purchasing must not duplicate them.

---

# 3. Module Identity

```ts
const PurchasingModule = {
  id: 'purchasing',
  label: 'Purchasing',
  lifecycle: 'draft',
  version: '0.1.0',
}
```

Purchasing starts as a **draft official module** until it has passed:

```txt
[ ] tenant-isolation tests
[ ] permission-denial tests
[ ] API failure-path tests
[ ] service integration tests
[ ] soft-delete / cancellation behavior tests
[ ] event emission tests
[ ] architecture checks
[ ] founder review
```

It should not be marketed as a mature official module until those pass.

---

# 4. Layer Classification

Purchasing belongs here:

```txt
Kernel
  ↓
Business Objects
  ↓
Platform Services
  ↓
Business Modules
      ↓
      Purchasing
  ↓
Client Configuration
```

Purchasing consumes:

```txt
Kernel auth / tenancy / permissions
SDK
Business Objects
Event Bus
Design System
Data layer
```

Purchasing must not consume:

```txt
Kernel internals directly
raw Prisma directly
other module services directly
FastAPI / Python backend
unapproved Platform Services
client-supplied orgId
```

---

# 5. Non-Goals

The Purchasing MVP must not include:

```txt
Generic Approval Workflow Service
Notification Service
Attachment Service
Comments Service
Activity Feed Service
Audit Log Service
Background Jobs
AI purchasing assistant
Supplier portal
RFQ / bidding system
Accounts payable
Payment tracking
Check voucher system
BIR / tax compliance engine
Full accounting integration
Budget control engine
Multi-step approval builder
PDF purchase order generator
Email-to-supplier delivery
Inventory stock update integration
Barcode receiving
Serial / lot / expiry receiving
Multi-currency FX accounting
Contract management
Purchase analytics platform
```

Some of these may come later.

They must not be built inside the Purchasing MVP.

---

# 6. Business Objects Used

Purchasing uses the following shared Business Objects.

## 6.1 Supplier

Supplier is the vendor/provider identity.

Purchasing uses Supplier for:

```txt
purchase order supplier
preferred supplier profiles
supplier purchase history
supplier lead-time assumptions
```

Purchasing must not create:

```txt
PurchasingSupplier
Vendor
ProcurementSupplier
```

Supplier APIs remain:

```txt
/api/orgs/[orgSlug]/objects/suppliers
```

Supplier events remain:

```txt
objects.supplier.created
objects.supplier.updated
objects.supplier.deleted
objects.supplier.restored
```

Purchasing-specific supplier fields belong in:

```txt
PurchasingSupplierProfile
```

---

## 6.2 Product

Product is the shared item/service identity.

Purchasing uses Product for:

```txt
purchase request lines
purchase order lines
goods receipt lines
preferred supplier profiles
last purchase cost tracking
```

Purchasing must not create:

```txt
PurchasingProduct
PurchaseItem
ProcurementProduct
```

Product APIs remain:

```txt
/api/orgs/[orgSlug]/objects/products
```

Product events remain:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored
```

Purchasing-specific product fields belong in:

```txt
PurchasingProductProfile
```

---

## 6.3 Warehouse

Warehouse is the shared operational storage/location identity.

Purchasing uses Warehouse for:

```txt
expected delivery location
receiving location
purchase receipt destination
```

Purchasing must not create:

```txt
PurchasingWarehouse
ReceivingWarehouse
```

Warehouse APIs remain:

```txt
/api/orgs/[orgSlug]/objects/warehouses
```

Warehouse events remain:

```txt
objects.warehouse.created
objects.warehouse.updated
objects.warehouse.deleted
objects.warehouse.restored
```

---

## 6.4 Employee

Employee is the shared personnel/business-person record.

Purchasing uses Employee for:

```txt
requester
buyer
receiver
approver
```

Purchasing must not create:

```txt
PurchasingEmployee
Requester
BuyerEmployee
ApproverEmployee
```

Employee APIs remain:

```txt
/api/orgs/[orgSlug]/objects/employees
```

Employee events remain:

```txt
objects.employee.created
objects.employee.updated
objects.employee.deactivated
objects.employee.reactivated
```

---

## 6.5 Branch and Department

Branch and Department are **Kernel org-structure primitives**, not Business Objects.

Purchasing may reference them for:

```txt
requesting branch
requesting department
delivery branch
cost center placeholder
```

But Purchasing must not redefine them.

---

# 7. Module-Owned Entities

Purchasing owns procurement records only.

Recommended MVP entities:

```txt
PurchasingProductProfile
PurchasingSupplierProfile
PurchaseRequest
PurchaseRequestLine
PurchaseOrder
PurchaseOrderLine
GoodsReceipt
GoodsReceiptLine
```

---

# 8. Entity Responsibility Table

| Entity | Owner | Reason |
|---|---|---|
| Supplier | Business Objects | Shared vendor identity |
| Product | Business Objects | Shared item/service identity |
| Warehouse | Business Objects | Shared storage/location identity |
| Employee | Business Objects | Shared personnel identity |
| Branch | Kernel | Org structure |
| Department | Kernel | Org structure |
| PurchasingSupplierProfile | Purchasing | Purchasing-specific supplier configuration |
| PurchasingProductProfile | Purchasing | Purchasing-specific product configuration |
| PurchaseRequest | Purchasing | Internal request to buy |
| PurchaseRequestLine | Purchasing | Requested items |
| PurchaseOrder | Purchasing | Supplier-facing order |
| PurchaseOrderLine | Purchasing | Ordered items |
| GoodsReceipt | Purchasing | Documentary receipt of ordered items |
| GoodsReceiptLine | Purchasing | Received line quantities |

---

# 9. Recommended MVP Data Model

This section is implementation guidance, not a copy-paste migration.

Claude must still implement through Prisma conventions, SDK rules, tenant isolation rules, soft delete rules, and validation rules.

---

## 9.1 PurchasingProductProfile

Purchasing-specific settings for a Product.

```prisma
model PurchasingProductProfile {
  id                  String   @id @default(cuid())
  orgId               String
  productId           String
  preferredSupplierId String?
  defaultPurchaseUnit String?
  leadTimeDays        Int?
  lastPurchaseCost    Decimal? @db.Decimal(18, 4)
  notes               String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?
  deletedBy           String?

  org               Organization @relation(fields: [orgId], references: [id])
  product           Product      @relation(fields: [productId], references: [id])
  preferredSupplier Supplier?    @relation(fields: [preferredSupplierId], references: [id])

  @@unique([orgId, productId])
  @@unique([id, orgId])
  @@index([orgId, preferredSupplierId])
  @@map("purchasing_product_profiles")
}
```

Notes:

```txt
lastPurchaseCost is informational only.
It is not an accounting valuation engine.
```

---

## 9.2 PurchasingSupplierProfile

Purchasing-specific settings for a Supplier.

```prisma
model PurchasingSupplierProfile {
  id             String   @id @default(cuid())
  orgId          String
  supplierId     String
  paymentTerms   String?
  leadTimeDays   Int?
  contactPerson  String?
  supplierCode   String?
  notes          String?
  isPreferred    Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?
  deletedBy      String?

  org      Organization @relation(fields: [orgId], references: [id])
  supplier Supplier     @relation(fields: [supplierId], references: [id])

  @@unique([orgId, supplierId])
  @@unique([id, orgId])
  @@index([orgId, isPreferred])
  @@map("purchasing_supplier_profiles")
}
```

Do not store supplier bank details in MVP unless separately approved.

Banking fields increase data sensitivity and support risk.

---

## 9.3 PurchaseRequest

Internal request to buy.

```prisma
model PurchaseRequest {
  id             String   @id @default(cuid())
  orgId          String
  requestNo      String
  requesterId    String?
  branchId       String?
  departmentId   String?
  neededBy       DateTime?
  status         String   @default("draft")
  reason         String?
  currency       String   @default("PHP")
  submittedAt    DateTime?
  approvedAt     DateTime?
  approvedById   String?
  rejectedAt     DateTime?
  rejectedById   String?
  rejectionReason String?
  cancelledAt    DateTime?
  cancelledById  String?
  convertedOrderId String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?
  deletedBy      String?

  org          Organization @relation(fields: [orgId], references: [id])
  requester    Employee?    @relation(fields: [requesterId], references: [id])
  branch       Branch?      @relation(fields: [branchId], references: [id])
  department   Department?  @relation(fields: [departmentId], references: [id])
  approvedBy   User?        @relation(fields: [approvedById], references: [id])
  rejectedBy   User?        @relation(fields: [rejectedById], references: [id])
  cancelledBy  User?        @relation(fields: [cancelledById], references: [id])
  lines        PurchaseRequestLine[]

  @@unique([orgId, requestNo])
  @@unique([id, orgId])
  @@index([orgId, status])
  @@index([orgId, requesterId])
  @@map("purchase_requests")
}
```

Recommended statuses:

```txt
draft
submitted
approved
rejected
converted
cancelled
```

Status rules:

```txt
draft → submitted
submitted → approved
submitted → rejected
approved → converted
submitted → cancelled
approved → cancelled
```

Deletion rules:

```txt
Draft requests may be soft-deleted.
Submitted/approved/rejected/converted requests should be cancelled, not deleted.
```

---

## 9.4 PurchaseRequestLine

Requested items.

```prisma
model PurchaseRequestLine {
  id          String   @id @default(cuid())
  orgId       String
  requestId   String
  productId   String
  description String?
  quantity    Decimal  @db.Decimal(18, 4)
  unit         String?
  estimatedUnitCost Decimal? @db.Decimal(18, 4)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org     Organization    @relation(fields: [orgId], references: [id])
  request PurchaseRequest @relation(fields: [requestId], references: [id])
  product Product         @relation(fields: [productId], references: [id])

  @@unique([id, orgId])
  @@index([orgId, requestId])
  @@index([orgId, productId])
  @@map("purchase_request_lines")
}
```

Product is required for MVP.

Free-text non-catalog purchasing is deferred unless founder-approved.

Reason:

```txt
Free-text procurement often becomes messy reporting, duplicate products, and inventory reconciliation problems.
```

---

## 9.5 PurchaseOrder

Supplier-facing purchase order.

```prisma
model PurchaseOrder {
  id             String   @id @default(cuid())
  orgId          String
  orderNo        String
  supplierId     String
  requestId      String?
  buyerId        String?
  warehouseId    String?
  status         String   @default("draft")
  orderDate      DateTime @default(now())
  expectedDate   DateTime?
  currency       String   @default("PHP")
  supplierNameSnapshot String
  subtotal       Decimal  @default(0) @db.Decimal(18, 4)
  taxAmount      Decimal  @default(0) @db.Decimal(18, 4)
  totalAmount    Decimal  @default(0) @db.Decimal(18, 4)
  notes          String?
  issuedAt       DateTime?
  issuedById     String?
  cancelledAt    DateTime?
  cancelledById  String?
  closedAt       DateTime?
  closedById     String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?
  deletedBy      String?

  org          Organization @relation(fields: [orgId], references: [id])
  supplier     Supplier     @relation(fields: [supplierId], references: [id])
  request      PurchaseRequest? @relation(fields: [requestId], references: [id])
  buyer        Employee?    @relation(fields: [buyerId], references: [id])
  warehouse    Warehouse?   @relation(fields: [warehouseId], references: [id])
  issuedBy     User?        @relation(fields: [issuedById], references: [id])
  cancelledBy  User?        @relation(fields: [cancelledById], references: [id])
  closedBy     User?        @relation(fields: [closedById], references: [id])
  lines        PurchaseOrderLine[]
  receipts     GoodsReceipt[]

  @@unique([orgId, orderNo])
  @@unique([id, orgId])
  @@index([orgId, supplierId])
  @@index([orgId, status])
  @@map("purchase_orders")
}
```

Recommended statuses:

```txt
draft
issued
partially_received
received
closed
cancelled
```

Status rules:

```txt
draft → issued
issued → partially_received
issued → received
partially_received → received
issued → cancelled
partially_received → closed
received → closed
```

Soft delete is for erroneous draft records.

Business cancellation is represented by `cancelled`.

---

## 9.6 PurchaseOrderLine

Ordered items.

```prisma
model PurchaseOrderLine {
  id                  String   @id @default(cuid())
  orgId               String
  orderId             String
  productId           String
  productCodeSnapshot String
  productNameSnapshot String
  description         String?
  quantity            Decimal  @db.Decimal(18, 4)
  receivedQuantity    Decimal  @default(0) @db.Decimal(18, 4)
  unit                String
  unitCost            Decimal  @db.Decimal(18, 4)
  lineTotal           Decimal  @db.Decimal(18, 4)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?
  deletedBy           String?

  org     Organization  @relation(fields: [orgId], references: [id])
  order   PurchaseOrder @relation(fields: [orderId], references: [id])
  product Product       @relation(fields: [productId], references: [id])

  @@unique([id, orgId])
  @@index([orgId, orderId])
  @@index([orgId, productId])
  @@map("purchase_order_lines")
}
```

Snapshot fields are required because purchase orders are historical documents.

If the Product name changes later, the old PO must still show what was ordered at that time.

---

## 9.7 GoodsReceipt

Documentary receipt of ordered goods.

```prisma
model GoodsReceipt {
  id           String   @id @default(cuid())
  orgId        String
  receiptNo    String
  orderId      String
  receiverId   String?
  warehouseId  String?
  status       String   @default("draft")
  receivedAt   DateTime?
  postedAt     DateTime?
  postedById   String?
  voidedAt     DateTime?
  voidedById   String?
  voidReason   String?
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?
  deletedBy    String?

  org       Organization @relation(fields: [orgId], references: [id])
  order     PurchaseOrder @relation(fields: [orderId], references: [id])
  receiver  Employee?    @relation(fields: [receiverId], references: [id])
  warehouse Warehouse?   @relation(fields: [warehouseId], references: [id])
  postedBy  User?        @relation(fields: [postedById], references: [id])
  voidedBy  User?        @relation(fields: [voidedById], references: [id])
  lines     GoodsReceiptLine[]

  @@unique([orgId, receiptNo])
  @@unique([id, orgId])
  @@index([orgId, orderId])
  @@index([orgId, status])
  @@map("goods_receipts")
}
```

Recommended statuses:

```txt
draft
posted
voided
```

A posted receipt should not be deleted.

If it was wrong, void it.

---

## 9.8 GoodsReceiptLine

Received quantities against purchase order lines.

```prisma
model GoodsReceiptLine {
  id          String   @id @default(cuid())
  orgId       String
  receiptId   String
  orderLineId String
  productId   String
  quantity    Decimal  @db.Decimal(18, 4)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org       Organization      @relation(fields: [orgId], references: [id])
  receipt   GoodsReceipt      @relation(fields: [receiptId], references: [id])
  orderLine PurchaseOrderLine @relation(fields: [orderLineId], references: [id])
  product   Product           @relation(fields: [productId], references: [id])

  @@unique([id, orgId])
  @@index([orgId, receiptId])
  @@index([orgId, orderLineId])
  @@index([orgId, productId])
  @@map("goods_receipt_lines")
}
```

Service rules:

```txt
Do not allow receiving more than the remaining ordered quantity unless an explicit over-receive setting is added later.
Do not allow receipt line productId to mismatch the referenced order line productId.
Do not allow posted receipt lines to be edited.
```

---

# 10. Inventory Integration Position

Purchasing and Inventory are separate modules.

Purchasing must not import Inventory services.

Purchasing must not update Inventory tables directly.

For MVP:

```txt
GoodsReceipt is documentary receiving only.
It does not automatically create Inventory StockMovement records.
```

When automatic inventory receiving is needed, write a separate integration specification.

Possible future document:

```txt
17-module-specifications/04a-purchasing-inventory-integration.md
```

That future integration must decide:

```txt
Should Inventory listen to purchasing.goods_receipt.posted?
Should stock movement creation be transactional?
Should a durable outbox be introduced?
How are listener failures retried?
How is duplicate stock posting prevented?
How are voided receipts reversed?
```

Do not solve those questions casually inside Purchasing MVP.

Reason:

```txt
Inventory stock correctness is operationally critical.
A weak event listener that silently fails could make Purchasing look successful while Inventory stays wrong.
```

Until the integration is formalized, the safe MVP is:

```txt
Purchasing records purchase orders and receipts.
Inventory stock movement remains a separate action.
```

---

# 11. Approval Position

Purchasing may need approval.

But the Platform Approval Workflow Service is deferred.

For MVP:

```txt
Purchasing uses simple module-local approval fields and status transitions.
```

Allowed:

```txt
purchase request submit
purchase request approve
purchase request reject
approvedById
approvedAt
rejectedById
rejectedAt
rejectionReason
```

Not allowed:

```txt
multi-step approval builder
approval delegation
approval escalation
conditional approval matrix
amount-based generic workflow engine
shared Approval Workflow Service
```

If Leave, Expenses, and Purchasing all need similar approval behavior, that becomes evidence for the future Platform Approval Workflow Service.

Until then, keep approval local and simple.

---

# 12. Permissions

Purchasing permissions use the `purchasing` namespace.

Business Object permissions remain separate.

---

## 12.1 Module Permissions

Recommended MVP permissions:

```txt
purchasing.purchase_request.read
purchasing.purchase_request.create
purchasing.purchase_request.update
purchasing.purchase_request.delete
purchasing.purchase_request.submit
purchasing.purchase_request.approve
purchasing.purchase_request.reject
purchasing.purchase_request.cancel
purchasing.purchase_request.convert

purchasing.purchase_order.read
purchasing.purchase_order.create
purchasing.purchase_order.update
purchasing.purchase_order.delete
purchasing.purchase_order.issue
purchasing.purchase_order.cancel
purchasing.purchase_order.close

purchasing.goods_receipt.read
purchasing.goods_receipt.create
purchasing.goods_receipt.update
purchasing.goods_receipt.delete
purchasing.goods_receipt.post
purchasing.goods_receipt.void

purchasing.product_profile.read
purchasing.product_profile.update

purchasing.supplier_profile.read
purchasing.supplier_profile.update

purchasing.settings.read
purchasing.settings.update
purchasing.export
purchasing.import
```

Import/export permissions exist as contracts.

The generic Import/Export Engine is still deferred.

---

## 12.2 Business Object Permissions Required

Purchasing screens often need to read shared objects.

Examples:

```txt
objects.product.read
objects.supplier.read
objects.warehouse.read
objects.employee.read
```

Creating a new Supplier from a Purchasing screen requires:

```txt
objects.supplier.create
```

Creating a new Product from a Purchasing screen requires:

```txt
objects.product.create
```

Purchasing permission alone does not grant Business Object mutation permission.

---

## 12.3 Permission Examples

A normal purchasing requester may have:

```txt
purchasing.purchase_request.read
purchasing.purchase_request.create
purchasing.purchase_request.submit
objects.product.read
objects.supplier.read
objects.employee.read
```

A purchasing officer may have:

```txt
purchasing.purchase_request.read
purchasing.purchase_request.update
purchasing.purchase_order.read
purchasing.purchase_order.create
purchasing.purchase_order.update
purchasing.purchase_order.issue
purchasing.goods_receipt.read
purchasing.goods_receipt.create
purchasing.goods_receipt.post
objects.product.read
objects.supplier.read
objects.warehouse.read
objects.employee.read
```

A purchasing approver may have:

```txt
purchasing.purchase_request.read
purchasing.purchase_request.approve
purchasing.purchase_request.reject
```

An admin wildcard grant may exist, but only inside the verified organization.

Wildcard permissions never bypass tenant isolation.

---

# 13. API Routes

All Purchasing APIs must live under the tenant API namespace.

Allowed:

```txt
/api/orgs/[orgSlug]/purchasing/requests
/api/orgs/[orgSlug]/purchasing/requests/[requestId]
/api/orgs/[orgSlug]/purchasing/requests/[requestId]/submit
/api/orgs/[orgSlug]/purchasing/requests/[requestId]/approve
/api/orgs/[orgSlug]/purchasing/requests/[requestId]/reject
/api/orgs/[orgSlug]/purchasing/requests/[requestId]/cancel
/api/orgs/[orgSlug]/purchasing/requests/[requestId]/convert

/api/orgs/[orgSlug]/purchasing/orders
/api/orgs/[orgSlug]/purchasing/orders/[orderId]
/api/orgs/[orgSlug]/purchasing/orders/[orderId]/issue
/api/orgs/[orgSlug]/purchasing/orders/[orderId]/cancel
/api/orgs/[orgSlug]/purchasing/orders/[orderId]/close

/api/orgs/[orgSlug]/purchasing/receipts
/api/orgs/[orgSlug]/purchasing/receipts/[receiptId]
/api/orgs/[orgSlug]/purchasing/receipts/[receiptId]/post
/api/orgs/[orgSlug]/purchasing/receipts/[receiptId]/void

/api/orgs/[orgSlug]/purchasing/product-profiles/[productId]
/api/orgs/[orgSlug]/purchasing/supplier-profiles/[supplierId]
/api/orgs/[orgSlug]/purchasing/settings
```

Forbidden:

```txt
/api/purchasing?orgId=...
/api/purchasing/orders?orgId=...
/api/purchasing/[id]
/api/purchasing/admin
```

API routes must:

```txt
use API-safe auth helpers
create verified PlatformContext
enforce module enablement
enforce permissions
validate route params
validate query params
validate body with Zod
reject client-supplied orgId
call services with PlatformContext
return JSON only
never redirect
never return HTML
```

---

# 14. Service Layer

Purchasing services are the authority for business behavior.

Recommended service split:

```txt
PurchaseRequestService
PurchaseOrderService
GoodsReceiptService
PurchasingProfileService
PurchasingSettingsService
```

Public service methods must receive verified `PlatformContext`.

Allowed:

```ts
PurchaseOrderService.issue(ctx, orderId)
```

Forbidden:

```ts
PurchaseOrderService.issue(orgId, orderId)
PurchaseOrderService.issue(orderId)
```

Services must:

```txt
enforce permissions during MVP
use sdk.getDb(ctx)
scope all queries by ctx.org.id
validate tenant-safe Business Object references
use transactions for multi-record mutations
emit events after successful mutations
exclude soft-deleted records by default
reject invalid status transitions
```

---

# 15. Required Service Transactions

The following operations must be transactional.

## 15.1 Convert Purchase Request to Purchase Order

Must atomically:

```txt
verify request belongs to ctx.org.id
verify request is approved
create PurchaseOrder
create PurchaseOrderLines from request lines
copy Supplier/Product snapshots where applicable
mark request as converted
emit purchasing.purchase_request.converted
emit purchasing.purchase_order.created
```

If any step fails, no partial order should remain.

---

## 15.2 Issue Purchase Order

Must atomically:

```txt
verify order belongs to ctx.org.id
verify order status is draft
verify order has at least one non-deleted line
set status = issued
set issuedAt / issuedById
emit purchasing.purchase_order.issued
```

After issuing, core order terms and lines should not be casually editable.

Corrections should be explicit.

---

## 15.3 Post Goods Receipt

Must atomically:

```txt
verify receipt belongs to ctx.org.id
verify receipt status is draft
verify order status allows receiving
verify each line matches order line product
verify no over-receiving beyond allowed quantity
increment PurchaseOrderLine.receivedQuantity
update PurchaseOrder status to partially_received or received
set receipt status = posted
set postedAt / postedById
emit purchasing.goods_receipt.posted
```

Posting a receipt does not automatically update Inventory in MVP.

---

## 15.4 Void Goods Receipt

Void behavior is tricky and may be deferred.

If implemented, it must atomically:

```txt
verify receipt is posted
verify user has purchasing.goods_receipt.void
set status = voided
set voidedAt / voidedById / voidReason
decrement PurchaseOrderLine.receivedQuantity
recompute PurchaseOrder status
emit purchasing.goods_receipt.voided
```

If Inventory integration exists later, voiding must also define stock reversal behavior.

Until then, voiding is documentary only.

---

# 16. Events

Purchasing events use the `purchasing` namespace.

Events are facts, not commands.

Allowed event names:

```txt
purchasing.product_profile.updated
purchasing.supplier_profile.updated

purchasing.purchase_request.created
purchasing.purchase_request.updated
purchasing.purchase_request.submitted
purchasing.purchase_request.approved
purchasing.purchase_request.rejected
purchasing.purchase_request.cancelled
purchasing.purchase_request.converted
purchasing.purchase_request.deleted
purchasing.purchase_request.restored

purchasing.purchase_order.created
purchasing.purchase_order.updated
purchasing.purchase_order.issued
purchasing.purchase_order.cancelled
purchasing.purchase_order.closed
purchasing.purchase_order.deleted
purchasing.purchase_order.restored

purchasing.goods_receipt.created
purchasing.goods_receipt.updated
purchasing.goods_receipt.posted
purchasing.goods_receipt.voided
purchasing.goods_receipt.deleted
purchasing.goods_receipt.restored
```

Forbidden event names:

```txt
purchasing.product.created        # Product is Business Object, not Purchasing-owned
purchasing.supplier.created       # Supplier is Business Object, not Purchasing-owned
purchasing.warehouse.created      # Warehouse is Business Object, not Purchasing-owned
send.email
notify.approver
update.inventory.stock
purchaseRequestApproved           # wrong casing
purchasing.order.approve          # command, not fact
```

---

# 17. Event Payload Rules

Payloads must be small and safe.

They must not include:

```txt
orgId
full Prisma records
supplier full profile
product full profile
employee full profile
request body
secrets
bank details
large line arrays unless specifically needed
```

Example payload:

```ts
type PurchaseOrderIssuedPayload = {
  orderId: string
  orderNo: string
  supplierId: string
  totalAmount: string
  currency: string
  issuedById: string
}
```

The Event Envelope supplies tenant and actor context.

The payload should not duplicate it.

---

# 18. Pages

Recommended MVP pages:

```txt
/[orgSlug]/purchasing
/[orgSlug]/purchasing/requests
/[orgSlug]/purchasing/requests/new
/[orgSlug]/purchasing/requests/[requestId]
/[orgSlug]/purchasing/orders
/[orgSlug]/purchasing/orders/new
/[orgSlug]/purchasing/orders/[orderId]
/[orgSlug]/purchasing/receipts
/[orgSlug]/purchasing/receipts/new
/[orgSlug]/purchasing/receipts/[receiptId]
/[orgSlug]/purchasing/settings
```

Page rules:

```txt
server components load authorized data
client components handle interactivity
client components do not import @/sdk/server
client components do not import @/kernel/*
client components do not import raw Prisma
forms never contain hidden orgId
relation options are tenant-scoped server-side
```

---

# 19. Navigation

Manifest navigation should start simple.

```ts
navItems: [
  { label: 'Purchasing', href: '/purchasing', icon: 'ShoppingCart', requiredPermission: { module: 'purchasing', resource: 'purchase_order', action: 'read' } },
  { label: 'Purchase Requests', href: '/purchasing/requests', icon: 'ClipboardList', requiredPermission: { module: 'purchasing', resource: 'purchase_request', action: 'read' } },
  { label: 'Purchase Orders', href: '/purchasing/orders', icon: 'FileText', requiredPermission: { module: 'purchasing', resource: 'purchase_order', action: 'read' } },
  { label: 'Receiving', href: '/purchasing/receipts', icon: 'PackageCheck', requiredPermission: { module: 'purchasing', resource: 'goods_receipt', action: 'read' } },
]
```

Sidebar visibility requires:

```txt
authentication
tenant membership
module enabled
permission
```

Hidden navigation is not security.

APIs and services still enforce permissions.

---

# 20. Forms

Recommended MVP forms:

```txt
Purchase Request Form
Purchase Order Form
Goods Receipt Form
Purchasing Product Profile Form
Purchasing Supplier Profile Form
Purchasing Settings Form
```

Forms must:

```txt
use React Hook Form
use Zod validation
never include orgId fields
use tenant-scoped relation pickers
show helpful tooltips for non-obvious fields
use optimistic behavior only when safe
show clear status-transition actions
```

Relation fields must be revalidated server-side.

For example, if a user submits `supplierId`, the service must verify:

```txt
supplier exists
supplier belongs to ctx.org.id
supplier is not soft-deleted
user has required object/module permissions
```

---

# 21. Tables

Recommended MVP tables:

```txt
Purchase Requests Table
Purchase Orders Table
Goods Receipts Table
Purchasing Product Profiles Table
Purchasing Supplier Profiles Table
```

Tables should include:

```txt
status badges
supplier/product display names
request/order numbers
dates
totals
row actions filtered by permission
empty states
loading states
safe error states
```

Tables must not expose sensitive fields automatically.

Export must require `purchasing.export`.

---

# 22. Settings

Purchasing settings are stored as tenant-scoped settings.

Recommended setting keys:

```txt
purchasing.requestNumberPrefix
purchasing.orderNumberPrefix
purchasing.receiptNumberPrefix
purchasing.defaultCurrency
purchasing.enablePurchaseRequests
purchasing.enableLocalApproval
purchasing.allowDirectPurchaseOrders
purchasing.requireSupplierOnRequest
purchasing.defaultWarehouseId
purchasing.allowOverReceiving
purchasing.receivingMode
```

Recommended defaults:

```ts
{
  requestNumberPrefix: 'PR',
  orderNumberPrefix: 'PO',
  receiptNumberPrefix: 'GR',
  defaultCurrency: 'PHP',
  enablePurchaseRequests: true,
  enableLocalApproval: true,
  allowDirectPurchaseOrders: true,
  requireSupplierOnRequest: false,
  defaultWarehouseId: null,
  allowOverReceiving: false,
  receivingMode: 'document_only'
}
```

`receivingMode` values:

```txt
document_only        # MVP default; Purchasing records receipt only
inventory_integrated # future; requires formal Inventory integration spec
```

Do not enable `inventory_integrated` until the integration spec exists and tests pass.

---

# 23. Zod Validation Rules

All Purchasing schemas must use strict objects.

Required rules:

```txt
z.strictObject() by default
reject client-supplied orgId
validate route params
validate query params
validate body
validate action-specific input
validate status transition inputs
```

Example forbidden input:

```json
{
  "orgId": "other-org",
  "supplierId": "supplier-1"
}
```

Expected response:

```json
{
  "data": null,
  "error": {
    "code": "TENANT_ID_NOT_ALLOWED",
    "message": "Tenant identity is derived from your session and route. Do not submit orgId."
  }
}
```

---

# 24. Soft Delete and Business Cancellation

Purchasing records should support soft delete, but business cancellation is not deletion.

Use this distinction:

| Situation | Behavior |
|---|---|
| Draft request entered by mistake | Soft delete allowed |
| Submitted request no longer needed | Cancel |
| Approved request no longer needed | Cancel |
| Issued purchase order cancelled by supplier/client | Cancel |
| Posted receipt entered incorrectly | Void |
| Historical purchasing record | Do not hard delete |

Hard delete is forbidden for normal business records.

---

# 25. Numbering

Purchase numbers must be unique per organization.

Recommended numbers:

```txt
PR-000001
PO-000001
GR-000001
```

MVP may use a simple transactional sequence table or safe database query pattern.

Do not generate numbers client-side.

Do not trust user-submitted document numbers unless a setting explicitly allows manual numbering.

If manual numbering is allowed, enforce:

```txt
unique per org
validated format
clear duplicate error
```

---

# 26. Money and Decimal Rules

Purchasing must not use JavaScript floating point numbers for money or quantities.

Use Decimal-compatible values.

Rules:

```txt
quantities use Decimal
unit costs use Decimal
totals use Decimal
currency defaults to PHP
lineTotal = quantity × unitCost
order totals are calculated server-side
client-submitted totals are ignored or rejected
```

The client may display calculated totals for UX.

The server remains authoritative.

---

# 27. Module Manifest Requirements

The Purchasing manifest must declare:

```txt
module identity
version
lifecycle
compatibility
Business Objects used
module-owned entities
permissions
navigation
routes
APIs
events emitted
events listened to
settings
AI context metadata
```

The manifest must not:

```txt
self-register as a side effect
import @/kernel/*
import @/sdk/server
import raw Prisma
import other modules
contain executable business logic
contain secrets
contain tenant data
```

---

# 28. AI Context

Purchasing AI context is metadata only.

It may describe:

```txt
what purchasing does
what a purchase request is
what a purchase order is
what a goods receipt is
what Business Objects it uses
safe example questions
unsafe example questions
```

It must not include:

```txt
client purchasing data
supplier records
product records
orgId
secrets
real purchase orders
runtime data access logic
AI provider calls
```

Runtime AI features remain deferred.

---

# 29. Import and Export Position

The generic Import/Export Engine is deferred.

For Purchasing MVP:

```txt
No client-facing import UI by default.
No Excel import by default.
No export unless explicitly implemented and permissioned.
```

A controlled founder/developer-run onboarding script may be allowed for initial supplier/product/purchasing setup, but it must follow data-import rules:

```txt
verified PlatformContext
no client-supplied orgId
validate before write
use services, not raw database shortcuts
reject duplicate Business Object creation
```

---

# 30. Security Requirements

Purchasing must pass the normal OneDayOS security model.

Required gates:

```txt
authentication
tenant membership
module enablement
permission
input validation
service enforcement
database scoping
soft delete filtering
event safety
```

Purchasing must not:

```txt
accept orgId from client
trust route params without validation
use raw Prisma in module code
use sdk.getDb(orgId)
import from @/kernel/*
import from Inventory
import from Expenses
import from Approval Service internals
expose full supplier/product/employee records in events
return HTML/redirects from APIs
```

---

# 31. Required Tests

Purchasing is not implementation-complete until these pass.

---

## 31.1 Tenant Isolation Tests

Must prove:

```txt
Org A user cannot list Org B purchase requests
Org A user cannot read Org B purchase order
Org A user cannot issue Org B purchase order
Org A user cannot receive Org B purchase order
Org A user cannot access Org B supplier/product/warehouse references through Purchasing
wrong-org access returns safe 404
client-supplied orgId is rejected
```

Every tenant-sensitive suite must use at least two organizations.

---

## 31.2 Permission Tests

Must prove:

```txt
user without purchasing.purchase_request.create cannot create request
user without purchasing.purchase_request.approve cannot approve request
user without purchasing.purchase_order.issue cannot issue PO
user without purchasing.goods_receipt.post cannot post receipt
user with read permission cannot export unless purchasing.export exists
Admin wildcard works only inside own organization
module enablement does not grant permission
```

Admin-only tests are insufficient.

---

## 31.3 API Tests

Must prove:

```txt
unauthenticated API returns JSON 401
unauthorized API returns JSON 403
wrong org returns safe 404
module disabled returns MODULE_NOT_FOUND
validation errors return VALIDATION_ERROR
client-supplied orgId returns TENANT_ID_NOT_ALLOWED
successful responses use { data, error, meta? }
APIs never redirect
APIs never return HTML
```

---

## 31.4 Service Tests

Must prove:

```txt
services require PlatformContext
services use sdk.getDb(ctx)
services enforce permissions
services validate tenant-safe Business Object references
status transitions are enforced
transactions avoid partial writes
events emit only after successful mutations
failed mutations do not emit events
```

---

## 31.5 Purchasing Workflow Tests

Must prove:

```txt
create draft purchase request
submit purchase request
approve purchase request
reject purchase request
cancel purchase request
convert approved request to purchase order
create direct purchase order
issue purchase order
create goods receipt
post goods receipt
prevent over-receiving by default
update order received status after receipt
void receipt if implemented
```

---

## 31.6 Soft Delete / Cancellation Tests

Must prove:

```txt
draft request soft delete hides record from normal lists
submitted request should cancel, not delete
issued PO should cancel, not delete
posted receipt should void, not delete
soft-deleted records do not appear in normal lookup/list/table flows
restore behavior requires explicit permission if implemented
```

---

## 31.7 Event Tests

Must prove:

```txt
purchasing.purchase_request.created emits after successful create
purchasing.purchase_request.approved emits after successful approve
purchasing.purchase_order.issued emits after successful issue
purchasing.goods_receipt.posted emits after successful post
no events emit on failed mutation
event payloads do not contain orgId
event payloads do not contain full Prisma records
event names follow convention
```

---

## 31.8 Architecture Tests

Must block:

```txt
modules/purchasing importing @/kernel/*
modules/purchasing importing raw Prisma
modules/purchasing importing Inventory module files
modules/purchasing importing Expenses module files
modules/purchasing calling sdk.getDb(orgId)
modules/purchasing accepting orgId in schemas
modules/purchasing using /api/purchasing route shape
modules/purchasing creating duplicate Product/Supplier/Warehouse/Employee entities
```

---

# 32. UI Acceptance Criteria

Purchasing UI must include:

```txt
clear empty states
beautiful tables
status badges
safe action buttons
permission-aware actions
loading skeletons
error states
form validation messages
tooltips for non-obvious fields
keyboard-friendly forms
optimistic UI only where safe
```

Dangerous actions like approve, issue, post, cancel, void, and close should be explicit.

They should not happen from accidental row clicks.

---

# 33. Implementation Plan

Claude should implement Purchasing only after the foundation documents and gates are satisfied.

Recommended implementation sequence:

```txt
1. Confirm Kernel, SDK, Data, Business Objects, Module System, and API helpers exist.
2. Run module generator for purchasing.
3. Add Purchasing Prisma models.
4. Write Zod schemas.
5. Write permission constants.
6. Write event constants and payload schemas.
7. Write services with permission enforcement.
8. Write API routes with api wrapper/context helpers.
9. Write pages and client components.
10. Write tests before or alongside implementation.
11. Add manifest metadata.
12. Add AI context metadata.
13. Add architecture checks if needed.
14. Run all checks.
```

Required commands before completion:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run check:architecture
```

If any helper does not exist yet, Claude must stop and report the missing foundation piece.

Claude must not invent a shortcut.

---

# 34. Claude Implementation Prompt

Use this prompt when Purchasing is ready for implementation:

```md
You are implementing the OneDayOS Purchasing Module.

Authoritative document:
docs/engineering-manual/17-module-specifications/04-purchasing-module.md

Required architecture:
- Use PlatformContext.
- Use sdk.getDb(ctx), never sdk.getDb(orgId).
- Do not accept client-supplied orgId.
- Do not import from @/kernel/* inside module code.
- Do not import raw Prisma inside module code.
- Do not import Inventory, Expenses, Leave, CRM, or any other module.
- Product, Supplier, Warehouse, and Employee are shared Business Objects.
- Do not create duplicate Product/Supplier/Warehouse/Employee entities.
- Purchasing APIs live under /api/orgs/[orgSlug]/purchasing/...
- Purchasing pages live under /[orgSlug]/purchasing/...
- APIs return { data, error, meta? } JSON only.
- Services enforce permissions during MVP.
- Status transitions must be validated.
- GoodsReceipt does not update Inventory stock in MVP.
- Approval is module-local in MVP.
- Do not implement Notification, Attachment, Comment, Activity Feed, AI, Background Jobs, or Platform Approval Workflow.
- Add tenant-isolation, permission-denial, API, service, event, and architecture tests.

Task:
Implement only the Purchasing Module scope defined in this document.
Stop and report if any required Kernel/SDK/Data helper is missing.
```

---

# 35. Founder Review Checklist

Before approving implementation, confirm:

```txt
[ ] Purchasing does not own Supplier
[ ] Purchasing does not own Product
[ ] Purchasing does not own Warehouse
[ ] Purchasing does not own Employee
[ ] Approval Workflow Service remains deferred
[ ] Inventory stock update integration remains deferred
[ ] Purchasing MVP scope is commercially useful enough
[ ] Non-goals are accepted
[ ] Permissions are acceptable
[ ] Status workflows are acceptable
[ ] Required tests are acceptable
[ ] Implementation prompt is narrow enough for Claude
```

---

# 36. Acceptance Criteria

Purchasing may be considered implemented only when:

```txt
[ ] module manifest exists and validates
[ ] module folder follows contract
[ ] Prisma models exist and migrate cleanly
[ ] services use PlatformContext
[ ] services enforce permissions
[ ] APIs are tenant-scoped
[ ] APIs reject client-supplied orgId
[ ] UI pages render under org shell
[ ] Business Objects are reused, not duplicated
[ ] purchase request workflow works
[ ] purchase order workflow works
[ ] goods receipt workflow works in document-only mode
[ ] local approval works if enabled
[ ] Inventory is not directly mutated
[ ] events emit correctly
[ ] soft delete/cancel/void behavior works
[ ] tenant-isolation tests pass
[ ] permission-denial tests pass
[ ] API failure-path tests pass
[ ] architecture checks pass
[ ] typecheck passes
[ ] test suite passes
[ ] build passes
```

---

# 37. Final Rule

The Purchasing Module should make procurement reusable across clients.

It must not become:

```txt
a custom purchasing app for one client
a hidden inventory integration
a local approval engine pretending to be a platform workflow engine
a supplier duplicate system
a product duplicate system
a raw Prisma module
a client-specific fork
```

The correct model is:

```txt
Shared Business Objects
+ Purchasing-owned procurement workflow
+ SDK boundaries
+ tenant-safe services
+ permission enforcement
+ event contracts
+ deferred integrations until proven
```

