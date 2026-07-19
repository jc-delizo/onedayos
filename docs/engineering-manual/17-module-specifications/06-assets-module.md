# OneDayOS Engineering Manual — Assets Module Specification

**Document ID:** `17-module-specifications/06-assets-module.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Assets Module Implementation  
**Owner:** OneDayOS Founder / Platform Architect  
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
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/01-employee.md`
- `07-business-objects/04-supplier.md`
- `07-business-objects/05-warehouse.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/*`
- `09-cli-generators/*`
- `10-platform-services/*`
- `14-testing-quality/*`
- `17-module-specifications/00-module-spec-template.md`

---

## 1. Purpose

The Assets Module manages company-owned physical assets that are individually tracked, assigned, maintained, returned, retired, or disposed.

Examples:

```txt
laptops
phones
tablets
printers
POS machines
tools
chairs
desks
vehicles
appliances
safety equipment
company-issued devices
```

The Assets Module answers practical SME questions:

```txt
What assets does the company own?
Who is currently responsible for this asset?
Where is this asset located?
What is its condition?
When was it acquired?
Has it been returned?
Is it under repair?
Is it retired or disposed?
What maintenance has been recorded?
```

The module should be useful for Philippine SMEs that need accountability for company property without requiring a full enterprise fixed-asset accounting system.

---

## 2. Core Position

The most important rule:

```txt
Asset = module-owned tracked company property
Employee = shared Business Object used as asset assignee/custodian
Supplier = shared Business Object used as vendor/service provider
Warehouse = shared Business Object used as storage/location
```

The Assets Module **does not own Employee, Supplier, Warehouse, Product, Branch, or Department**.

Assets owns asset-specific lifecycle and accountability records.

---

## 3. Why Asset Is Module-Owned, Not a Business Object Yet

At first glance, `Asset` may look like a shared Business Object. It is not promoted to the Business Objects layer for MVP.

Reason:

```txt
Only the Assets Module clearly owns the full asset lifecycle in MVP.
```

An asset has domain-specific lifecycle concepts:

```txt
assigned
returned
under_maintenance
retired
disposed
condition
asset tag
custodian
maintenance history
```

Those are not lowest-common-denominator fields needed by every module.

Therefore:

```txt
Asset belongs to the Assets Module.
```

If, later, three independent modules need a generic shared Asset identity, we may review promotion through an ADR. Until then, `Asset` remains module-owned.

### 3.1 Do Not Confuse Product and Asset

`Product` and `Asset` are different concepts.

```txt
Product = shared item/type/catalog identity
Asset = individual tracked company-owned item
```

Example:

```txt
Product: Dell Latitude 5440 Laptop
Asset: Laptop assigned to Maria, Asset Tag LAP-00034, Serial ABC123
```

For MVP, the Assets Module does **not** require Product integration.

A future `productId` reference may be added if repeated use cases prove that companies want assets linked to shared product catalog records.

Do not force that dependency too early.

---

## 4. Non-Goals

The Assets Module MVP must not become any of these systems:

```txt
Inventory stock management
Purchasing system
Expenses/reimbursement system
Accounting fixed-asset depreciation engine
Full asset valuation/accounting module
Insurance management system
Warranty claims system
IoT tracking system
GPS/fleet telematics system
Barcode hardware integration
QR-code scanning system
Attachment/file management system
Maintenance ticketing system
Approval workflow platform
Notification system
Activity Feed
Comments system
AI asset assistant
```

These are explicitly out of scope for the first Assets implementation.

---

## 5. Relationship to Other OneDayOS Concepts

### 5.1 Asset vs Inventory

Inventory tracks quantities and movements of stock.

Assets tracks individually accountable company property.

Example:

```txt
Inventory:
  50 boxes of printer paper
  200 bottles of water
  100 units of Product X

Assets:
  Laptop LAP-001
  Printer PRN-003
  Truck TRK-002
```

Inventory is about stock quantities.

Assets is about individual tracked property.

The Assets Module must not create or update Inventory stock balances during MVP.

### 5.2 Asset vs Product

Product is a shared item/catalog identity.

Asset is an individual tracked object.

For MVP:

```txt
Asset.name = "Dell Laptop"
Asset.assetTag = "LAP-0001"
Asset.serialNumber = "ABC123"
```

Do not require Product records just to create an Asset.

### 5.3 Asset vs Purchasing

Purchasing manages purchase requests, purchase orders, and goods receipts.

Assets manages company property after it exists as an asset.

For MVP:

```txt
Purchasing does not automatically create Assets.
Assets does not automatically create Purchase Orders.
```

A future Purchasing → Assets integration may be specified later.

### 5.4 Asset vs Expenses

Expenses may record reimbursements or costs.

Assets may record asset purchase cost or maintenance cost for operational reference.

For MVP:

```txt
Assets does not post accounting expenses.
Expenses does not own assets.
```

### 5.5 Asset vs Attachments

Asset photos, receipts, warranty documents, and repair documents are useful.

But Attachment Service is deferred.

Therefore, in MVP:

```txt
No file upload fields.
No Supabase Storage bucket.
No asset document table.
No receipt attachment.
```

If a client urgently needs asset documents, require founder/architect review.

---

## 6. Business Objects Used

The Assets Module may reference these shared Business Objects:

| Business Object / Kernel Object | Usage |
|---|---|
| `Employee` | asset assignee, custodian, responsible person |
| `Supplier` | purchase vendor, maintenance vendor, service provider |
| `Warehouse` | storage location, unassigned asset location |
| `Branch` | optional organization location context |
| `Department` | optional cost center / organizational context |
| `Product` | deferred optional item-type reference, not MVP-required |

Important:

```txt
Using a Business Object does not mean the module owns that Business Object.
```

Assets must not create duplicate tables such as:

```txt
AssetEmployee
AssetSupplier
AssetWarehouse
AssetProduct
```

unless they are explicit module-owned extension/relationship records, not duplicate identities.

---

## 7. Module-Owned Entities

The Assets Module owns these entities.

### 7.1 AssetCategory

Groups assets into practical categories.

Examples:

```txt
Laptop
Mobile Phone
Printer
Vehicle
Furniture
Tool
Equipment
```

`AssetCategory` is module-owned because it is specific to the Assets Module.

It is not the same as `ProductCategory`.

### 7.2 Asset

Represents one individually tracked company-owned item.

Examples:

```txt
Laptop LAP-0001
Printer PRN-0003
Truck TRK-0002
Power Drill TOOL-0012
```

### 7.3 AssetAssignment

Represents the assignment of an asset to an Employee.

Example:

```txt
Asset LAP-0001 assigned to Employee Maria Santos on 2026-07-01
Asset LAP-0001 returned on 2026-09-15
```

This is a historical record.

Do not overwrite assignment history.

### 7.4 AssetMaintenanceRecord

Represents maintenance or repair activity for an asset.

Example:

```txt
Printer PRN-0003 repaired by Supplier ABC Repair Center on 2026-07-10
```

This is operational maintenance tracking, not a full ticketing system.

### 7.5 AssetStatusEvent — Deferred

Do not create a generic status-event table in MVP unless implementation proves it is necessary.

Status history can initially be represented through:

```txt
AssetAssignment
AssetMaintenanceRecord
Asset.updatedAt
Asset events
```

If detailed asset lifecycle timeline becomes important, consider a future module-local history table or Activity Feed Service after evidence.

---

## 8. Recommended MVP Data Model

This schema is a proposed implementation target. Claude must still follow current Prisma conventions, tenant-safe relations, soft delete rules, and `PlatformContext` service patterns.

### 8.1 AssetCategory

```prisma
model AssetCategory {
  id          String    @id @default(cuid())
  orgId       String
  code        String?
  name        String
  description String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org    Organization @relation(fields: [orgId], references: [id])
  assets Asset[]

  @@unique([orgId, name])
  @@unique([id, orgId])
  @@map("asset_categories")
}
```

### 8.2 Asset

```prisma
model Asset {
  id                    String    @id @default(cuid())
  orgId                 String
  assetTag              String
  name                  String
  description           String?
  categoryId            String?
  serialNumber          String?
  supplierId            String?
  warehouseId           String?
  currentAssigneeId     String?
  branchId              String?
  departmentId          String?
  purchaseDate          DateTime?
  purchaseCost          Decimal?  @db.Decimal(12, 2)
  condition             String    @default("good")
  status                String    @default("available")
  notes                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  deletedAt             DateTime?
  deletedBy             String?

  org               Organization    @relation(fields: [orgId], references: [id])
  category          AssetCategory?  @relation(fields: [categoryId], references: [id])
  supplier          Supplier?       @relation(fields: [supplierId], references: [id])
  warehouse         Warehouse?      @relation(fields: [warehouseId], references: [id])
  currentAssignee   Employee?       @relation(fields: [currentAssigneeId], references: [id])
  branch            Branch?         @relation(fields: [branchId], references: [id])
  department        Department?     @relation(fields: [departmentId], references: [id])
  assignments       AssetAssignment[]
  maintenanceRecords AssetMaintenanceRecord[]

  @@unique([orgId, assetTag])
  @@unique([id, orgId])
  @@index([orgId, status])
  @@index([orgId, categoryId])
  @@index([orgId, currentAssigneeId])
  @@index([orgId, warehouseId])
  @@map("assets")
}
```

### 8.3 AssetAssignment

```prisma
model AssetAssignment {
  id                String    @id @default(cuid())
  orgId             String
  assetId           String
  employeeId        String
  assignedAt        DateTime
  returnedAt        DateTime?
  assignedById      String
  returnedById      String?
  conditionAtIssue  String?
  conditionAtReturn String?
  notes             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  deletedBy         String?

  org         Organization @relation(fields: [orgId], references: [id])
  asset       Asset        @relation(fields: [assetId], references: [id])
  employee    Employee     @relation(fields: [employeeId], references: [id])
  assignedBy  User         @relation("AssetAssignedBy", fields: [assignedById], references: [id])
  returnedBy  User?        @relation("AssetReturnedBy", fields: [returnedById], references: [id])

  @@unique([id, orgId])
  @@index([orgId, assetId])
  @@index([orgId, employeeId])
  @@index([orgId, returnedAt])
  @@map("asset_assignments")
}
```

### 8.4 AssetMaintenanceRecord

```prisma
model AssetMaintenanceRecord {
  id              String    @id @default(cuid())
  orgId           String
  assetId         String
  supplierId      String?
  type            String
  status          String    @default("completed")
  maintenanceDate DateTime
  cost            Decimal?  @db.Decimal(12, 2)
  description     String?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  deletedBy       String?

  org      Organization @relation(fields: [orgId], references: [id])
  asset    Asset        @relation(fields: [assetId], references: [id])
  supplier Supplier?    @relation(fields: [supplierId], references: [id])

  @@unique([id, orgId])
  @@index([orgId, assetId])
  @@index([orgId, supplierId])
  @@index([orgId, maintenanceDate])
  @@map("asset_maintenance_records")
}
```

---

## 9. Field Decisions

### 9.1 Asset Fields Included in MVP

| Field | Reason |
|---|---|
| `assetTag` | org-specific tracking identifier |
| `name` | human-readable asset name |
| `description` | optional explanation |
| `categoryId` | practical grouping |
| `serialNumber` | common asset identifier |
| `supplierId` | optional purchase/vendor reference |
| `warehouseId` | storage or current location reference |
| `currentAssigneeId` | current responsible Employee |
| `branchId` | optional branch context |
| `departmentId` | optional department/cost-center context |
| `purchaseDate` | useful operational reference |
| `purchaseCost` | useful operational value reference |
| `condition` | simple physical condition state |
| `status` | lifecycle state |
| `notes` | simple operational remarks |

### 9.2 Asset Fields Excluded From MVP

Do not include these in core MVP unless explicitly approved:

```txt
barcode
qrCode
rfidTag
warrantyStartDate
warrantyEndDate
insurancePolicyNumber
depreciationMethod
salvageValue
bookValue
usefulLifeMonths
accountingAssetCode
maintenanceScheduleRule
gpsTrackerId
imageUrl
documentUrl
attachmentIds
customFields
metadata Json
```

Many of these are useful later, but they add complexity too early.

### 9.3 Money Fields

Money fields must use Decimal-compatible values.

Do not use JavaScript floats for money calculations.

Examples:

```txt
purchaseCost
maintenance cost
```

The UI may display money values, but server logic must use Decimal-safe handling.

---

## 10. Asset Status Model

Recommended MVP asset statuses:

```txt
available
assigned
under_maintenance
lost
retired
disposed
```

Meaning:

| Status | Meaning |
|---|---|
| `available` | asset exists and is not currently assigned |
| `assigned` | asset is assigned to an Employee |
| `under_maintenance` | asset is being repaired or serviced |
| `lost` | asset is missing but not formally disposed |
| `retired` | asset is no longer active for business use |
| `disposed` | asset has been discarded/sold/written off operationally |

### 10.1 Status Is Business State

Asset status is not deletion.

```txt
retired/disposed/lost = business state
deletedAt = record lifecycle / erroneous record removal
```

Do not soft-delete an asset just because it is retired.

---

## 11. Asset Condition Model

Recommended MVP condition values:

```txt
new
good
fair
poor
damaged
unusable
```

Keep this simple. Do not build a configurable condition engine yet.

---

## 12. Business Workflows

### 12.1 Create Asset

Purpose:

```txt
Register a company-owned asset.
```

Required checks:

```txt
authenticated user
tenant membership
assets module enabled
assets.asset.create permission
Zod input validation
client-supplied orgId rejected
assetTag unique inside org
referenced Business Objects belong to same org
```

Expected result:

```txt
Asset created
assets.asset.created event emitted
```

### 12.2 Update Asset

Purpose:

```txt
Update asset details such as name, category, condition, warehouse, notes, supplier reference.
```

Required checks:

```txt
assets.asset.update permission
asset belongs to ctx.org.id
soft-deleted asset cannot be updated through normal path
referenced Business Objects belong to same org
```

Expected result:

```txt
Asset updated
assets.asset.updated event emitted with changedFields
```

### 12.3 Assign Asset to Employee

Purpose:

```txt
Assign an available asset to an Employee.
```

Required checks:

```txt
assets.asset.assign permission
asset belongs to ctx.org.id
employee belongs to ctx.org.id
asset is not soft-deleted
asset is not retired/disposed/lost
asset is not already actively assigned
```

Transaction should:

```txt
create AssetAssignment
update Asset.currentAssigneeId
update Asset.status = "assigned"
update Asset.warehouseId if needed
emit assets.asset.assigned
```

This must be one transaction.

Do not create assignment and update asset state separately.

### 12.4 Return Asset

Purpose:

```txt
Return an assigned asset from an Employee.
```

Required checks:

```txt
assets.asset.return permission
asset belongs to ctx.org.id
active assignment exists
return condition is valid
```

Transaction should:

```txt
set AssetAssignment.returnedAt
set AssetAssignment.returnedById
set AssetAssignment.conditionAtReturn
update Asset.currentAssigneeId = null
update Asset.status = "available" or "under_maintenance" if selected
update Asset.condition
optionally set Asset.warehouseId
emit assets.asset.returned
```

### 12.5 Move Asset Location

Purpose:

```txt
Move unassigned asset to another Warehouse, Branch, or Department context.
```

Required checks:

```txt
assets.asset.update or assets.asset.move permission
asset belongs to ctx.org.id
location belongs to ctx.org.id
```

For MVP, location movement may be a normal asset update.

If movement history becomes important, add a future `AssetMovement` table through ADR/module revision.

### 12.6 Record Maintenance

Purpose:

```txt
Record repair or maintenance information.
```

Required checks:

```txt
assets.maintenance_record.create permission
asset belongs to ctx.org.id
supplier belongs to ctx.org.id if provided
```

Expected result:

```txt
AssetMaintenanceRecord created
assets.maintenance_record.created event emitted
```

If maintenance should change asset status, the service owns that transaction.

### 12.7 Retire Asset

Purpose:

```txt
Mark asset as no longer used by the business.
```

Required checks:

```txt
assets.asset.retire permission
asset belongs to ctx.org.id
asset is not soft-deleted
asset is not actively assigned unless explicit return/retire flow handles it
```

Expected result:

```txt
Asset.status = "retired"
assets.asset.retired event emitted
```

### 12.8 Dispose Asset

Purpose:

```txt
Mark asset as discarded, sold, scrapped, or otherwise no longer held.
```

Required checks:

```txt
assets.asset.dispose permission
asset belongs to ctx.org.id
asset is not actively assigned
```

Expected result:

```txt
Asset.status = "disposed"
assets.asset.disposed event emitted
```

Do not hard-delete disposed assets.

### 12.9 Soft Delete Asset

Purpose:

```txt
Hide/remove an erroneous asset record from normal views.
```

Soft delete should be allowed only for erroneous or duplicate records.

If an asset has meaningful history, prefer:

```txt
retired
disposed
lost
```

over deletion.

Required checks:

```txt
assets.asset.delete permission
asset belongs to ctx.org.id
business rules allow deletion
```

Expected result:

```txt
Asset.deletedAt set
Asset.deletedBy set
assets.asset.deleted event emitted
```

---

## 13. Permissions

### 13.1 Permission Namespace

Assets permissions use the `assets` module namespace.

Business Object permissions remain under `objects.*`.

### 13.2 Recommended MVP Permissions

```txt
assets.asset.read
assets.asset.create
assets.asset.update
assets.asset.delete
assets.asset.assign
assets.asset.return
assets.asset.retire
assets.asset.dispose

assets.asset_category.read
assets.asset_category.create
assets.asset_category.update
assets.asset_category.delete

assets.maintenance_record.read
assets.maintenance_record.create
assets.maintenance_record.update
assets.maintenance_record.delete
```

Optional future permissions:

```txt
assets.asset.export
assets.asset.import
assets.asset.restore
assets.asset.move
```

Do not include import/export UI in MVP unless explicitly approved.

### 13.3 Permission Rules

Creating or editing an asset may also require read access to referenced Business Objects.

Examples:

```txt
Selecting an Employee requires objects.employee.read.
Selecting a Supplier requires objects.supplier.read.
Selecting a Warehouse requires objects.warehouse.read.
```

Creating those Business Objects from inside Assets requires their own Business Object create permissions.

Example:

```txt
Create Supplier from asset form
→ requires objects.supplier.create
```

Do not silently create shared Business Objects using only `assets.asset.create`.

---

## 14. Routes

### 14.1 Page Routes

Assets pages live under the organization shell:

```txt
/[orgSlug]/assets
/[orgSlug]/assets/new
/[orgSlug]/assets/[assetId]
/[orgSlug]/assets/[assetId]/edit
/[orgSlug]/assets/categories
/[orgSlug]/assets/assignments
/[orgSlug]/assets/maintenance
```

MVP can begin with:

```txt
/[orgSlug]/assets
/[orgSlug]/assets/new
/[orgSlug]/assets/[assetId]
/[orgSlug]/assets/[assetId]/edit
```

Do not build too many screens before the list/detail/create/edit workflow is excellent.

### 14.2 API Routes

Assets APIs live under tenant-scoped module routes:

```txt
/api/orgs/[orgSlug]/assets/assets
/api/orgs/[orgSlug]/assets/assets/[assetId]
/api/orgs/[orgSlug]/assets/assets/[assetId]/assign
/api/orgs/[orgSlug]/assets/assets/[assetId]/return
/api/orgs/[orgSlug]/assets/assets/[assetId]/retire
/api/orgs/[orgSlug]/assets/assets/[assetId]/dispose
/api/orgs/[orgSlug]/assets/categories
/api/orgs/[orgSlug]/assets/categories/[categoryId]
/api/orgs/[orgSlug]/assets/maintenance-records
/api/orgs/[orgSlug]/assets/maintenance-records/[maintenanceRecordId]
```

Forbidden API routes:

```txt
/api/assets?orgId=...
/api/assets/[id]?orgId=...
/api/asset-management
/api/client-acme-assets
```

---

## 15. Services

### 15.1 Service Pattern

Assets services receive verified `PlatformContext`.

Correct:

```ts
await AssetsService.createAsset(ctx, input)
await AssetsService.assignAsset(ctx, assetId, input)
```

Forbidden:

```ts
await AssetsService.createAsset(orgId, input)
await AssetsService.assignAsset(userId, orgId, assetId, input)
```

### 15.2 Recommended Service Methods

```ts
AssetsService.listAssets(ctx, filters)
AssetsService.getAsset(ctx, assetId)
AssetsService.createAsset(ctx, input)
AssetsService.updateAsset(ctx, assetId, input)
AssetsService.deleteAsset(ctx, assetId)
AssetsService.restoreAsset(ctx, assetId)

AssetsService.assignAsset(ctx, assetId, input)
AssetsService.returnAsset(ctx, assetId, input)
AssetsService.retireAsset(ctx, assetId, input)
AssetsService.disposeAsset(ctx, assetId, input)

AssetsService.listCategories(ctx)
AssetsService.createCategory(ctx, input)
AssetsService.updateCategory(ctx, categoryId, input)
AssetsService.deleteCategory(ctx, categoryId)

AssetsService.listMaintenanceRecords(ctx, filters)
AssetsService.createMaintenanceRecord(ctx, input)
AssetsService.updateMaintenanceRecord(ctx, maintenanceRecordId, input)
AssetsService.deleteMaintenanceRecord(ctx, maintenanceRecordId)
```

### 15.3 Permission Enforcement in Services

During MVP, public service methods must enforce permissions internally.

Example:

```ts
await sdk.permissions.require(ctx, {
  module: 'assets',
  resource: 'asset',
  action: 'create',
})
```

API routes should also enforce permissions before service calls where practical.

But service enforcement remains mandatory so future callers cannot bypass authorization.

---

## 16. Validation

Use Zod schemas for every API body and relevant route/query param.

Body schemas must use strict object validation by default.

Client-supplied `orgId` must be rejected.

### 16.1 Create Asset Input

Allowed fields:

```ts
type CreateAssetInput = {
  assetTag: string
  name: string
  description?: string
  categoryId?: string
  serialNumber?: string
  supplierId?: string
  warehouseId?: string
  branchId?: string
  departmentId?: string
  purchaseDate?: string
  purchaseCost?: string
  condition?: AssetCondition
  status?: AssetStatus
  notes?: string
}
```

Forbidden fields:

```txt
orgId
id
createdAt
updatedAt
deletedAt
deletedBy
currentAssigneeId // assignment flow owns this
```

### 16.2 Assign Asset Input

```ts
type AssignAssetInput = {
  employeeId: string
  assignedAt: string
  conditionAtIssue?: string
  notes?: string
}
```

### 16.3 Return Asset Input

```ts
type ReturnAssetInput = {
  returnedAt: string
  conditionAtReturn?: string
  nextStatus?: 'available' | 'under_maintenance'
  warehouseId?: string
  notes?: string
}
```

### 16.4 Maintenance Input

```ts
type CreateMaintenanceRecordInput = {
  assetId: string
  supplierId?: string
  type: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  maintenanceDate: string
  cost?: string
  description?: string
  notes?: string
}
```

---

## 17. Events

### 17.1 Event Namespace

Assets events use the `assets` module namespace.

Business Object events remain under `objects.*`.

### 17.2 Recommended Events

```txt
assets.asset.created
assets.asset.updated
assets.asset.deleted
assets.asset.restored
assets.asset.assigned
assets.asset.returned
assets.asset.moved
assets.asset.retired
assets.asset.disposed
assets.asset.lost_marked

assets.asset_category.created
assets.asset_category.updated
assets.asset_category.deleted
assets.asset_category.restored

assets.maintenance_record.created
assets.maintenance_record.updated
assets.maintenance_record.deleted
assets.maintenance_record.restored
```

Note: `assets.asset.lost_marked` is acceptable because it expresses a past-tense business fact. If we prefer cleaner naming later, use `assets.asset.marked_lost`.

### 17.3 Event Payload Rules

Payloads must be minimal.

Good:

```ts
{
  assetId: string
  assetTag: string
  employeeId?: string
  changedFields?: string[]
}
```

Forbidden:

```txt
full Prisma Asset record
full Employee record
full Supplier record
full request body
orgId
secret values
private notes if sensitive
```

`orgId` comes from `EventEnvelope.ctx`, not payload.

### 17.4 Event Emission Location

Events are emitted by services after successful mutations.

Forbidden:

```txt
emit from UI component
emit from API route before service succeeds
emit before transaction commits
emit command-style events like assets.asset.assign_requested unless explicitly modeled
```

---

## 18. Manifest

The module manifest must declare:

```ts
export const assetsModuleManifest = {
  id: 'assets',
  label: 'Assets',
  lifecycle: 'draft',
  version: '0.1.0',
  icon: 'BriefcaseBusiness',
  dependencies: [],
  permissions: [
    { module: 'assets', resource: 'asset', action: 'read' },
    { module: 'assets', resource: 'asset', action: 'create' },
    { module: 'assets', resource: 'asset', action: 'update' },
    { module: 'assets', resource: 'asset', action: 'delete' },
    { module: 'assets', resource: 'asset', action: 'assign' },
    { module: 'assets', resource: 'asset', action: 'return' },
    { module: 'assets', resource: 'asset', action: 'retire' },
    { module: 'assets', resource: 'asset', action: 'dispose' },
    { module: 'assets', resource: 'asset_category', action: 'read' },
    { module: 'assets', resource: 'asset_category', action: 'create' },
    { module: 'assets', resource: 'asset_category', action: 'update' },
    { module: 'assets', resource: 'asset_category', action: 'delete' },
    { module: 'assets', resource: 'maintenance_record', action: 'read' },
    { module: 'assets', resource: 'maintenance_record', action: 'create' },
    { module: 'assets', resource: 'maintenance_record', action: 'update' },
    { module: 'assets', resource: 'maintenance_record', action: 'delete' },
  ],
  navItems: [
    {
      label: 'Assets',
      href: '/assets',
      requiredPermission: { module: 'assets', resource: 'asset', action: 'read' },
    },
  ],
  businessObjectsUsed: ['employee', 'supplier', 'warehouse'],
  events: {
    emits: [
      'assets.asset.created',
      'assets.asset.updated',
      'assets.asset.assigned',
      'assets.asset.returned',
      'assets.asset.retired',
      'assets.asset.disposed',
    ],
    listens: [],
  },
}
```

Wildcard permissions are forbidden inside the module manifest.

---

## 19. Navigation

Assets navigation should be simple in MVP.

Recommended nav:

```txt
Assets
```

Optional later nav:

```txt
Assets
Assignments
Maintenance
Categories
```

Do not over-segment the sidebar too early.

The first page should provide filters/tabs for:

```txt
All
Available
Assigned
Under Maintenance
Retired/Disposed
```

---

## 20. UI Screens

### 20.1 Assets List

Purpose:

```txt
Browse and filter assets.
```

Recommended columns:

```txt
Asset Tag
Name
Category
Status
Condition
Assigned To
Location
Updated
Actions
```

Required states:

```txt
loading skeleton
empty state
filtered empty state
permission denied state
error state
```

### 20.2 Asset Detail

Purpose:

```txt
Show complete asset record and available actions.
```

Sections:

```txt
Header: asset tag, name, status, condition
Details: category, serial number, supplier, purchase date/cost
Assignment: current assignee, assigned date
Location: warehouse/branch/department
Maintenance: recent records
Lifecycle actions: assign, return, maintenance, retire, dispose
```

Do not build a generic Activity Feed here.

Module-local assignment/maintenance lists are allowed.

### 20.3 Create/Edit Asset Form

Must follow form standards:

```txt
no hidden orgId
clear field labels
tooltips for non-obvious fields
server validation
optimistic UI where safe
errors mapped from API contract
```

### 20.4 Assign Asset Dialog

Fields:

```txt
Employee
Assigned date
Condition at issue
Notes
```

Employee picker must be tenant-scoped and permission-aware.

### 20.5 Return Asset Dialog

Fields:

```txt
Returned date
Condition at return
Next status
Warehouse/location
Notes
```

### 20.6 Maintenance Record Form

Fields:

```txt
Type
Date
Supplier
Cost
Status
Description
Notes
```

No file uploads in MVP.

---

## 21. Tables and Filters

Recommended filters:

```txt
search by assetTag, name, serialNumber
status
condition
category
assigned employee
warehouse
branch
department
```

MVP filters may start with:

```txt
search
status
category
```

Do not implement Dynamic Table View Engine yet.

---

## 22. Settings

MVP settings can be minimal.

Potential future settings:

```txt
asset tag prefix
default condition
default status
allow purchase cost visibility
require serial number
require category
```

For first implementation, avoid complex settings unless real client need exists.

Asset tag may be manually entered in MVP.

Auto-numbering can be added later.

---

## 23. Import and Export

### 23.1 Import

Generic Import Engine is deferred.

Limited founder/developer-run onboarding scripts are allowed.

Asset onboarding imports must:

```txt
use verified PlatformContext
reject client-supplied orgId
validate all rows before writing
resolve categories/employees/warehouses tenant-safely
not duplicate Business Objects
produce clear error report
```

### 23.2 Export

Generic Export Engine is deferred.

If MVP asset export is required, it must require explicit permission:

```txt
assets.asset.export
```

Read permission alone is not export permission.

---

## 24. AI Context

Runtime AI is deferred.

Static module AI context may describe:

```txt
Assets tracks company-owned property.
Assets uses Employee for assignees.
Assets uses Supplier for vendors/service providers.
Assets uses Warehouse for storage/location.
Assets does not manage inventory stock quantities.
Assets does not calculate accounting depreciation in MVP.
```

AI must not receive unrestricted asset data.

AI must never mutate asset records directly.

---

## 25. Platform Services

The Assets Module must not implement these Platform Services during MVP:

```txt
Approval Workflow Service
Notification Service
Audit Log Service
Activity Feed Service
Comments Service
Attachments Service
Reporting Service
Search Service
Background Jobs
Dynamic Forms
Dynamic CRUD
Dynamic Table Views
View Builder
AI Support Agent
```

If asset workflows need any of these, log the use case and evaluate later through the Three Independent Use Cases Rule.

---

## 26. Module Dependencies

The Assets Module should declare:

```txt
dependencies: []
```

Using Business Objects does not create module dependencies.

Assets may use:

```txt
Employee
Supplier
Warehouse
Branch
Department
```

through SDK/Business Object APIs/services, not module dependencies.

Assets must not depend on:

```txt
Inventory
Purchasing
Expenses
CRM
Leave
```

Future integrations may be event-based and separately specified.

---

## 27. Security Requirements

The Assets Module must enforce:

```txt
authentication
tenant membership
module enablement
permission checks
Zod validation
client-supplied orgId rejection
soft-delete behavior
Business Object tenant-safe references
API JSON-only errors
no redirects from APIs
```

Every service method must receive `PlatformContext`.

Every database query must be tenant-scoped.

Wrong-org access must fail safely.

---

## 28. Testing Requirements

The Assets Module is not production-ready unless these tests exist.

### 28.1 Tenant Isolation Tests

Use at least two organizations.

Required cases:

```txt
Org A user cannot list Org B assets
Org A user cannot read Org B asset detail
Org A user cannot assign Org B asset
Org A user cannot update Org B asset
Org A user cannot delete Org B asset
Org A user cannot use Org B employee as assignee
Org A user cannot use Org B supplier or warehouse
```

### 28.2 Permission Tests

Required cases:

```txt
user without assets.asset.read cannot list assets
user without assets.asset.create cannot create asset
user without assets.asset.update cannot update asset
user without assets.asset.assign cannot assign asset
user without assets.asset.return cannot return asset
user without assets.asset.retire cannot retire asset
user without assets.maintenance_record.create cannot create maintenance record
admin wildcard works only inside own org
```

### 28.3 API Tests

Required cases:

```txt
unauthenticated request returns JSON 401
wrong-org request returns safe 404
missing permission returns 403
client-supplied orgId returns TENANT_ID_NOT_ALLOWED
invalid body returns VALIDATION_ERROR
module disabled returns MODULE_NOT_FOUND
successful create returns { data, error: null }
```

### 28.4 Service Tests

Required cases:

```txt
create asset enforces permission
create asset validates tenant-scoped category/supplier/warehouse
assign asset creates assignment and updates asset in one transaction
return asset closes assignment and updates asset in one transaction
retire/dispose asset changes business status, not deletedAt
soft delete sets deletedAt/deletedBy
normal list excludes deleted assets
```

### 28.5 Event Tests

Required cases:

```txt
create emits assets.asset.created
update emits assets.asset.updated with changedFields
assign emits assets.asset.assigned
return emits assets.asset.returned
maintenance create emits assets.maintenance_record.created
failed mutation emits no event
event payload does not include orgId
event payload does not include full Prisma record
```

### 28.6 Architecture Tests

Required checks:

```txt
no imports from @/kernel/* inside src/modules/assets
no imports from other modules
no raw Prisma import inside module files
no sdk.getDb(orgId)
no client-supplied orgId in schemas/forms/API bodies
no /api/assets?orgId= route shape
no duplicate Employee/Supplier/Warehouse/Product model inside Assets
no FastAPI/Python backend files
```

---

## 29. Seed Data

Recommended starter seed for new orgs if Assets is enabled:

```txt
Asset Categories:
- Laptop
- Mobile Phone
- Printer
- Furniture
- Vehicle
- Tool
- Equipment
```

Do not seed real asset records unless demo data is explicitly requested.

Seed must be idempotent.

Seed must use `PlatformContext` or approved provisioning context.

---

## 30. Implementation Plan

Claude should implement Assets only after the foundation helpers exist.

### Phase 0 — Prerequisite Check

Before implementation, verify:

```txt
PlatformContext exists
sdk.getDb(ctx) exists
API wrapper exists
permission helpers exist
module registry exists
Business Object services exist or required lookups are available
Zod validation helpers exist
error contract exists
architecture checks exist
```

If missing, Claude must stop and report missing prerequisites.

### Phase 1 — Module Scaffold

Use the module generator if ready:

```bash
npm run module:create assets
```

Then adjust generated files to match this spec.

### Phase 2 — Prisma Models

Add:

```txt
AssetCategory
Asset
AssetAssignment
AssetMaintenanceRecord
```

Run migration locally.

Do not use `db push` for staging/production.

### Phase 3 — Manifest and Permissions

Add full manifest permissions and navigation.

Register through the approved module registry pattern.

### Phase 4 — Schemas

Add Zod schemas for:

```txt
CreateAsset
UpdateAsset
AssignAsset
ReturnAsset
RetireAsset
DisposeAsset
CreateAssetCategory
UpdateAssetCategory
CreateMaintenanceRecord
UpdateMaintenanceRecord
```

All schemas must reject `orgId`.

### Phase 5 — Services

Implement services with:

```txt
PlatformContext
permission enforcement
sdk.getDb(ctx)
tenant-safe relation validation
transactions for assignment/return/status changes
event emission after successful mutation
soft delete
```

### Phase 6 — APIs

Implement tenant-scoped APIs:

```txt
/api/orgs/[orgSlug]/assets/...
```

Use JSON-only API wrapper.

No redirects.

### Phase 7 — UI

Implement:

```txt
Assets list
Create asset
Asset detail
Edit asset
Assign dialog
Return dialog
Maintenance record form/list if in MVP scope
```

Focus on quality, not number of screens.

### Phase 8 — Tests

Add required tests before marking complete.

### Phase 9 — Smoke Test

Verify:

```txt
module enabled for Org A only
Org A can use assets
Org B cannot see Org A assets
non-admin permission denial works
asset assignment/return works
soft delete hides asset
build passes
architecture checks pass
```

---

## 31. Claude Implementation Prompt

Use this prompt only after this document is approved/frozen.

```md
You are implementing the OneDayOS Assets Module.

Authoritative document:
docs/engineering-manual/17-module-specifications/06-assets-module.md

Rules:
- Do not invent architecture.
- Do not import from @/kernel/* inside the module.
- Do not import from other modules.
- Do not use raw Prisma inside module files.
- Do not use sdk.getDb(orgId).
- Use verified PlatformContext and sdk.getDb(ctx).
- APIs must live under /api/orgs/[orgSlug]/assets/...
- Pages must live under /[orgSlug]/assets/...
- Do not accept client-supplied orgId.
- Do not duplicate Employee, Supplier, Warehouse, Product, Branch, or Department.
- Asset is module-owned for MVP.
- Product integration is deferred unless explicitly approved.
- Attachments, Notifications, Approvals, Activity Feed, Comments, Reporting, Search, AI, and Background Jobs are deferred.
- Add tenant-isolation and permission-denial tests.
- Add API failure-path tests.
- Add architecture checks or update existing checks.

Task:
Implement only the Assets Module scope defined in this document.
Stop and report if any required foundation helper is missing.
```

---

## 32. Acceptance Criteria

The Assets Module is acceptable only when:

```txt
[ ] Asset is module-owned and does not duplicate Business Objects
[ ] Employee is referenced as assignee/custodian, not duplicated
[ ] Supplier is referenced as vendor/service provider, not duplicated
[ ] Warehouse is referenced as storage/location, not duplicated
[ ] Product integration is absent or explicitly approved
[ ] APIs use /api/orgs/[orgSlug]/assets/...
[ ] Pages use /[orgSlug]/assets/...
[ ] Services receive PlatformContext
[ ] Database access uses sdk.getDb(ctx)
[ ] Client-supplied orgId is rejected
[ ] Permissions are enforced in APIs and services
[ ] Module enablement is enforced
[ ] Asset assignment is transactional
[ ] Asset return is transactional
[ ] Retire/dispose use business status, not deletion
[ ] Soft delete uses deletedAt/deletedBy
[ ] Events emit after successful mutations
[ ] Event payloads are minimal and safe
[ ] Tests include two-org tenant isolation
[ ] Tests include non-admin permission denial
[ ] API tests include 401, 403, safe 404, validation error, and orgId rejection
[ ] Architecture checks pass
[ ] Typecheck passes
[ ] Tests pass
[ ] Build passes
```

---

## 33. Final Rule

The Assets Module should make SMEs more accountable for company property without turning OneDayOS into a heavy accounting, inventory, procurement, file-management, or workflow system.

The rule is:

```txt
Track the asset lifecycle.
Reuse shared Business Objects.
Keep integrations deferred until proven.
Never fork the platform.
```
