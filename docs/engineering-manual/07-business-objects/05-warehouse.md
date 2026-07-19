# OneDayOS Engineering Manual — 07 Business Objects / 05 Warehouse

**Document ID:** `07-business-objects/05-warehouse.md`  
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
- `07-business-objects/00-business-object-philosophy.md`

---

# 1. Purpose

This document defines **Warehouse** as a shared OneDayOS **Business Object**.

A Warehouse represents a tenant-owned operational storage location used by one or more business modules.

Warehouse is not owned by Inventory.

Warehouse is not owned by Purchasing.

Warehouse is not owned by Transfers.

Warehouse is not owned by Assets.

Warehouse is a shared business identity that those modules reference.

```txt
Warehouse = shared operational storage/location identity
Inventory = stock behavior around Warehouse
Purchasing = receiving behavior around Warehouse
Transfers = movement behavior between Warehouses
Assets = storage/location behavior around Warehouse
Repairs/Maintenance = parts/location behavior around Warehouse
```

This distinction matters because OneDayOS is a platform, not a collection of disconnected apps.

If Inventory creates its own warehouse table, Purchasing creates another supplier receiving location table, and Assets creates another storage-location table, OneDayOS becomes fragmented. Reports, search, permissions, AI, and future workflows become harder because the same real-world storage place is duplicated across modules.

The Warehouse Business Object prevents that.

---

# 2. Executive Decision

Warehouse belongs in the **Business Objects** layer.

It is a shared tenant-scoped entity.

It should be created, updated, deactivated, restored, and queried through Business Object APIs and services, not through module-specific APIs.

Correct API location:

```txt
/api/orgs/[orgSlug]/objects/warehouses
/api/orgs/[orgSlug]/objects/warehouses/[warehouseId]
```

Incorrect API locations:

```txt
/api/orgs/[orgSlug]/inventory/warehouses
/api/orgs/[orgSlug]/purchasing/warehouses
/api/warehouses?orgId=...
```

Correct service style:

```ts
WarehouseService.list(ctx, filters)
WarehouseService.create(ctx, input)
WarehouseService.update(ctx, warehouseId, input)
WarehouseService.deactivate(ctx, warehouseId)
WarehouseService.delete(ctx, warehouseId)
```

Incorrect service style:

```ts
WarehouseService.list(orgId)
WarehouseService.create({ orgId, ...input })
InventoryWarehouseService.create(...)
```

The service must receive a verified `PlatformContext`, not a loose `orgId` string.

---

# 3. Mental Model

## 3.1 Warehouse vs Branch

A **Branch** is an organizational location.

A **Warehouse** is an operational storage location.

They are related, but they are not the same thing.

```txt
Branch
  = business location / office / store / site
  = Kernel org-structure primitive

Warehouse
  = storage location where items/assets/materials may be stored
  = Business Object
```

Examples:

```txt
Branch: Cebu Office
Warehouse: Cebu Main Stockroom
Warehouse: Cebu Returns Area
Warehouse: Cebu Spare Parts Room
```

Another example:

```txt
Branch: Manila Head Office
Warehouse: Main Warehouse
Warehouse: Damaged Goods Holding Area
```

Another example:

```txt
Branch: null
Warehouse: Third-Party Logistics Warehouse
```

A warehouse may be linked to a branch, but it does not have to be.

This supports:

- physical branches with stockrooms
- remote warehouses
- third-party logistics locations
- centralized storage locations
- storage locations that are not customer-facing branches

## 3.2 Branch is not automatically a Warehouse

Do not automatically treat every Branch as a Warehouse.

Some branches have no stored inventory.

Some warehouses are not branches.

Some branches have multiple warehouses.

If a store branch also stores sellable stock, create a Warehouse linked to that Branch.

Correct:

```txt
Branch: Makati Store
Warehouse: Makati Store Stockroom
```

Incorrect:

```txt
Branch automatically acts as Warehouse
```

## 3.3 Warehouse vs Department

A Department is an organizational team or unit.

A Warehouse is a physical or operational storage location.

Warehouse should not belong to Department in MVP.

If a client says “Marketing has its own storage cabinet,” do not add `departmentId` to Warehouse immediately.

Use one of these instead:

```txt
Warehouse: Marketing Supplies Storage
branchId: Head Office
```

or later, if proven by repeated use:

```txt
InventoryLocationExtension.departmentId
AssetLocationAssignment.departmentId
```

Department ownership of storage is module-specific unless proven otherwise.

## 3.4 Warehouse vs Bin / Shelf / Zone

Warehouse is the high-level storage location.

Bin, shelf, rack, aisle, zone, and pallet location are detailed inventory-location concepts.

They do not belong in core Warehouse for MVP.

Correct:

```txt
Warehouse
  Main Warehouse

InventoryBin
  Aisle A / Shelf 01 / Bin 03
```

Incorrect:

```txt
Warehouse
  aisle
  shelf
  bin
  rack
  palletLocation
```

Detailed storage hierarchy belongs to Inventory or a future Warehouse Management capability, not the shared Warehouse Business Object.

---

# 4. Ownership Rule

Warehouse is owned by the Business Objects layer.

Modules may reference Warehouse.

Modules may extend Warehouse.

Modules may not redefine Warehouse.

Modules may not create their own copy of Warehouse under another name just because they need warehouse-like behavior.

Forbidden module-owned duplicates:

```txt
InventoryWarehouse
PurchasingWarehouse
AssetWarehouse
StockLocation // if it means the same thing as Warehouse
ReceivingLocation // if it means the same thing as Warehouse
StorageSite // if it means the same thing as Warehouse
```

Allowed module-owned extensions:

```txt
InventoryWarehouseExtension
PurchasingWarehouseExtension
InventoryBin
InventoryZone
AssetStorageRule
```

Allowed module-owned records referencing Warehouse:

```txt
StockBalance.warehouseId
StockMovement.fromWarehouseId
StockMovement.toWarehouseId
PurchaseReceipt.warehouseId
AssetAssignment.warehouseId
```

---

# 5. Layer Classification

| Concern | Layer | Reason |
|---|---|---|
| Organization | Kernel | Tenant boundary |
| Branch | Kernel | Org-structure primitive |
| Department | Kernel | Org-structure primitive |
| Warehouse | Business Objects | Shared operational storage identity |
| Stock balance | Business Module | Inventory-specific |
| Stock movement | Business Module | Inventory-specific |
| Purchase receiving location | Business Module | Purchasing behavior referencing Warehouse |
| Bin/shelf/rack | Business Module or future Platform Service | Not universally needed |
| Transfer workflow | Business Module | Inventory/Logistics-specific |
| Warehouse approval rules | Module or future Platform Service | Not core identity |
| Warehouse capacity planning | Module-specific until proven | Not universal |

---

# 6. MVP Field Philosophy

Warehouse fields must remain the lowest common denominator needed by all modules that reference a storage location.

Warehouse should contain identity and basic location information.

Warehouse should not contain stock behavior, procurement rules, fulfillment rules, bin hierarchy, valuation, capacity planning, or module-specific operational settings.

## 6.1 Core fields

The restarted build should use this core model:

```prisma
model Warehouse {
  id        String   @id @default(cuid())
  orgId     String
  branchId  String?

  code      String
  name      String
  address   String?
  isActive  Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  deletedBy String?

  org    Organization @relation(fields: [orgId], references: [id])
  branch Branch?      @relation(fields: [branchId], references: [id])

  @@unique([orgId, code])
  @@index([orgId, branchId])
  @@index([orgId, deletedAt])
  @@map("warehouses")
}
```

Important: this improves the earlier MVP shape by adding `code`, `isActive`, and `updatedAt`.

That is intentional for the restarted build.

`code` gives every warehouse a compact stable operational identifier.

`isActive` lets modules prevent new transactions against closed warehouses while preserving historical records.

`updatedAt` makes audit, sync, import/export, and future AI context easier.

## 6.2 Why Warehouse has `code`

Warehouse should have a code because operational locations are often selected, imported, exported, displayed in tables, and referenced in reports.

Examples:

```txt
MAIN
CEBU
MNL-RETURNS
QC-SPARES
3PL-LAGUNA
```

`code` is not an Inventory-specific field.

Inventory, Purchasing, Transfers, Assets, Imports, Exports, Reporting, Search, and AI can all benefit from a compact warehouse identifier.

The UI may auto-generate `code` from `name` during creation to keep setup easy.

Example:

```txt
name: Main Warehouse
code: MAIN
```

If there is a conflict, the service can append a suffix:

```txt
MAIN-2
```

## 6.3 Why Warehouse has `isActive`

`isActive` means the warehouse is available for normal business use.

It is not deletion.

A warehouse can be inactive but still appear in historical records.

Examples:

```txt
Closed old warehouse
Transferred-out storage site
Deprecated branch stockroom
Temporary project warehouse no longer used
```

Modules should generally prevent new operational transactions against inactive warehouses unless an admin intentionally overrides.

## 6.4 Fields excluded from core Warehouse

Do not add these to core Warehouse in MVP:

```txt
capacity
capacityUnit
valuationMethod
costingMethod
reorderPolicy
binTrackingEnabled
lotTrackingEnabled
serialTrackingEnabled
receivingCutoffTime
preferredSupplierId
managerEmployeeId
warehouseType
zoneCount
aisleCount
shelfCount
storageTemperature
securityLevel
operatingHours
fulfillmentPriority
shippingCarrierRules
defaultPurchaseReceivingRules
defaultTransferRules
inventoryAccountId
```

Reasons:

- Some are Inventory-specific.
- Some are Purchasing-specific.
- Some are Warehouse Management-specific.
- Some are Accounting-specific.
- Some are operational preferences, not shared identity.
- Many Philippine SMEs will not need them initially.

Add them only through module-owned extension tables or future Platform Services after real repeated demand.

---

# 7. Warehouse Code Rules

## 7.1 Code format

Recommended code normalization:

```txt
uppercase
trimmed
spaces converted to hyphens
letters, numbers, hyphens only
max 32 characters
```

Examples:

```txt
Main Warehouse     → MAIN-WAREHOUSE
Makati Stockroom   → MAKATI-STOCKROOM
Cebu Returns       → CEBU-RETURNS
```

For UI convenience, the create form may auto-suggest a code but must allow editing.

## 7.2 Code uniqueness

Warehouse code must be unique within an organization.

Correct:

```txt
Org A: MAIN
Org B: MAIN
```

Incorrect:

```txt
Org A: MAIN
Org A: MAIN
```

Database constraint:

```prisma
@@unique([orgId, code])
```

## 7.3 Code mutability

Warehouse code may be changed in MVP, but it should be treated carefully.

Changing a warehouse code should:

- require `objects.warehouse.update`
- emit `objects.warehouse.updated`
- include `code` in `changedFields`
- not change historical record IDs
- not break foreign keys, because relationships use `warehouseId`

Future enterprise setups may restrict code changes after transactions exist, but that is deferred.

---

# 8. Branch Relationship Rules

## 8.1 Optional branch

`branchId` is optional.

Correct:

```txt
Warehouse linked to Branch:
  Cebu Stockroom → Cebu Branch

Warehouse not linked to Branch:
  Laguna 3PL Warehouse → no branch
```

Do not force every warehouse to belong to a branch.

## 8.2 Branch must belong to same organization

If `branchId` is provided, it must belong to the same organization as the verified `PlatformContext`.

Correct:

```ts
const branch = await db.branch.findFirst({
  where: {
    id: input.branchId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Incorrect:

```ts
const branch = await db.branch.findUnique({ where: { id: input.branchId } })
```

This prevents cross-tenant association bugs.

## 8.3 Branch deletion behavior

A Branch should not be hard-deleted if warehouses reference it.

If a Branch is soft-deleted, linked warehouses should not automatically be deleted.

Instead, the Warehouse should either:

- keep the historical branch reference, or
- be manually reassigned by an admin, or
- be deactivated if the warehouse is no longer used

Do not cascade-delete warehouses from branch deletion.

---

# 9. Status and Lifecycle

Warehouse has three different lifecycle concepts:

```txt
exists
active/inactive
soft-deleted
```

These are not the same.

## 9.1 Active warehouse

An active warehouse can be selected for normal operations.

Examples:

```txt
receiving stock
moving stock
assigning assets
viewing available stock
```

## 9.2 Inactive warehouse

An inactive warehouse still exists but should not be used for new normal operations.

Examples:

```txt
closed warehouse
old storage room
temporary warehouse no longer in use
```

Inactive warehouses should remain visible in historical records.

They may be hidden from default dropdowns unless the user chooses “include inactive.”

## 9.3 Soft-deleted warehouse

A soft-deleted warehouse is a removed record.

Soft delete should be rare for Warehouse.

Normal business closure should use `isActive = false`, not deletion.

Soft delete should be used for:

```txt
mistakenly created warehouse
duplicate warehouse created during setup
test data accidentally created in production
```

It should not be used for:

```txt
old warehouse with historical stock movements
closed branch warehouse
warehouse no longer receiving purchases
```

Use deactivation for those.

---

# 10. Deletion Policy

Warehouse deletion is more dangerous than Customer/Supplier deletion because many module-owned records may reference it.

For MVP, deletion should be conservative.

## 10.1 Preferred operational path

For warehouses that have ever been used operationally:

```txt
Deactivate, do not delete.
```

## 10.2 Soft delete allowed only for safe cases

Warehouse soft delete should only be allowed when the system can safely determine that the warehouse is not used by module-owned records.

If usage cannot be determined safely, deletion should be denied.

Recommended error:

```json
{
  "data": null,
  "error": {
    "code": "ENTITY_IN_USE",
    "message": "This warehouse has related records and cannot be deleted. Deactivate it instead."
  }
}
```

## 10.3 No cascade deletion

Soft-deleting a Warehouse must not delete:

```txt
stock balances
stock movements
purchase receipts
asset assignments
transfer records
historical reports
```

Historical records must remain intact.

## 10.4 Future deletion guard pattern

Eventually, OneDayOS may need a shared Business Object usage guard.

Example future interface:

```ts
type BusinessObjectUsageCheck = {
  object: 'warehouse'
  objectId: string
  module: string
  hasBlockingUsage: boolean
  message?: string
}
```

Do not build this generic system in MVP unless deletion conflicts become real across multiple Business Objects.

For now, keep deletion conservative.

---

# 11. Module Usage

## 11.1 Inventory

Inventory references Warehouse for:

```txt
stock balances
stock movements
adjustments
transfers
reorder points by warehouse
cycle counts
```

Inventory does not own Warehouse.

Inventory-specific extension examples:

```prisma
model InventoryWarehouseExtension {
  id          String @id @default(cuid())
  orgId       String
  warehouseId String

  allowNegativeStock Boolean @default(false)
  binTrackingEnabled Boolean @default(false)
  cycleCountEnabled  Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  warehouse Warehouse @relation(fields: [warehouseId], references: [id])

  @@unique([orgId, warehouseId])
  @@map("inventory_warehouse_extensions")
}
```

Do not add these fields to core Warehouse.

## 11.2 Purchasing

Purchasing references Warehouse for:

```txt
purchase receipt destination
default receiving location
supplier delivery location
partial receipt location
```

Purchasing does not own Warehouse.

Purchasing-specific extension examples:

```txt
defaultReceivingWarehouseId
receivingCutoffTime
requiresReceivingInspection
supplierDeliveryInstructions
```

These belong to Purchasing settings or Purchasing extension tables.

## 11.3 Transfers

Transfers reference Warehouse for:

```txt
fromWarehouseId
toWarehouseId
inTransit state
transfer approval
```

Transfer workflow belongs to an Inventory/Logistics module, not core Warehouse.

## 11.4 Assets

Assets may reference Warehouse for:

```txt
asset storage location
spare unit storage
equipment holding area
```

Assets does not own Warehouse.

If Assets needs asset-specific location behavior, it should use an Assets-owned extension table.

## 11.5 Projects

Projects may reference Warehouse for:

```txt
project material storage
site storage
consumables staging location
```

This is still a reference to Warehouse, not a new project warehouse table.

---

# 12. API Contract

Warehouse APIs belong to the Business Object API namespace.

## 12.1 Routes

```txt
GET    /api/orgs/[orgSlug]/objects/warehouses
POST   /api/orgs/[orgSlug]/objects/warehouses
GET    /api/orgs/[orgSlug]/objects/warehouses/[warehouseId]
PATCH  /api/orgs/[orgSlug]/objects/warehouses/[warehouseId]
DELETE /api/orgs/[orgSlug]/objects/warehouses/[warehouseId]
POST   /api/orgs/[orgSlug]/objects/warehouses/[warehouseId]/restore
POST   /api/orgs/[orgSlug]/objects/warehouses/[warehouseId]/activate
POST   /api/orgs/[orgSlug]/objects/warehouses/[warehouseId]/deactivate
```

Alternative: activation/deactivation may be handled through `PATCH` if the API remains simple.

If separate endpoints are implemented, they must still use the same permission and event rules.

## 12.2 List filters

Allowed list query filters:

```txt
search
branchId
isActive
includeInactive
includeDeleted // admin/restore permission only
limit
cursor
```

Forbidden query filters:

```txt
orgId
organizationId
tenantId
```

The org comes from `orgSlug` plus verified `PlatformContext`, never from the client query string.

## 12.3 Create request

Allowed create body:

```json
{
  "code": "MAIN",
  "name": "Main Warehouse",
  "address": "123 Warehouse Road, Quezon City",
  "branchId": "branch_123"
}
```

`code` may be optional at the API layer if the service auto-generates it from `name`, but the database should store a non-null code.

Forbidden create body:

```json
{
  "orgId": "org_123",
  "name": "Main Warehouse"
}
```

Client-supplied `orgId` must be rejected with `VALIDATION_ERROR`.

## 12.4 Update request

Allowed update body:

```json
{
  "code": "MNL-MAIN",
  "name": "Manila Main Warehouse",
  "address": "Updated address",
  "branchId": "branch_456",
  "isActive": false
}
```

All fields are optional.

Unknown keys should be rejected.

Client-supplied `orgId` should be rejected.

## 12.5 Response shape

All API responses must use the Kernel API contract:

```json
{
  "data": {},
  "error": null
}
```

or:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to update warehouses."
  }
}
```

APIs must never redirect.

APIs must never return raw stack traces.

---

# 13. Service Contract

## 13.1 Service location

Recommended location:

```txt
src/business-objects/warehouse/service.ts
```

or, if the restarted project keeps shared objects under a consolidated object layer:

```txt
src/objects/warehouse/service.ts
```

Do not put Warehouse service under:

```txt
src/modules/inventory/warehouse-service.ts
src/modules/purchasing/warehouse-service.ts
```

## 13.2 Required methods

```ts
type WarehouseFilters = {
  search?: string
  branchId?: string
  isActive?: boolean
  includeInactive?: boolean
  includeDeleted?: boolean
  limit?: number
  cursor?: string
}

class WarehouseService {
  static list(ctx: PlatformContext, filters?: WarehouseFilters): Promise<WarehouseListItem[]>

  static getById(ctx: PlatformContext, warehouseId: string): Promise<WarehouseDetail | null>

  static create(ctx: PlatformContext, input: CreateWarehouseInput): Promise<WarehouseDetail>

  static update(
    ctx: PlatformContext,
    warehouseId: string,
    input: UpdateWarehouseInput
  ): Promise<WarehouseDetail>

  static activate(ctx: PlatformContext, warehouseId: string): Promise<WarehouseDetail>

  static deactivate(ctx: PlatformContext, warehouseId: string): Promise<WarehouseDetail>

  static delete(ctx: PlatformContext, warehouseId: string): Promise<void>

  static restore(ctx: PlatformContext, warehouseId: string): Promise<WarehouseDetail>
}
```

## 13.3 Service rules

Every method must:

1. receive verified `PlatformContext`
2. use `sdk.getDb(ctx)`
3. scope all queries by `ctx.org.id`
4. enforce soft-delete rules
5. validate branch ownership when `branchId` is provided
6. reject client-supplied `orgId`
7. emit events for mutations
8. return sanitized data
9. never expose another tenant's warehouse

## 13.4 Example query pattern

Correct:

```ts
const db = sdk.getDb(ctx)

const warehouse = await db.warehouse.findFirst({
  where: {
    id: warehouseId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Incorrect:

```ts
await prisma.warehouse.findUnique({ where: { id: warehouseId } })
```

Incorrect:

```ts
await sdk.getDb(orgId).warehouse.findMany(...)
```

Incorrect:

```ts
await db.warehouse.findMany({ where: { orgId: input.orgId } })
```

---

# 14. Validation Contract

Warehouse validation should use Zod and the shared validation rules from `06-data/05-data-validation-zod.md`.

## 14.1 Create schema

Example:

```ts
import { z } from 'zod'

const WarehouseCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, 'Use letters, numbers, and hyphens only.')
  .transform((value) => value.toUpperCase())

export const CreateWarehouseSchema = z.strictObject({
  code: WarehouseCodeSchema.optional(),
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().max(500).optional().nullable(),
  branchId: z.string().min(1).optional().nullable(),
})
```

## 14.2 Update schema

```ts
export const UpdateWarehouseSchema = z.strictObject({
  code: WarehouseCodeSchema.optional(),
  name: z.string().trim().min(1).max(120).optional(),
  address: z.string().trim().max(500).optional().nullable(),
  branchId: z.string().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
})
```

## 14.3 Restore schema

Restore should not need a body.

If a reason field is added later, it must be validated strictly.

## 14.4 Forbidden schema behavior

Do not use `.passthrough()`.

Do not silently strip `orgId`.

Do not accept unknown keys.

Do not validate only on the client.

Do not use Inventory schemas for Warehouse.

---

# 15. Permissions

Warehouse permissions use the Business Object namespace.

Permission shape:

```ts
{
  module: 'objects',
  resource: 'warehouse',
  action: 'read' | 'create' | 'update' | 'delete' | 'restore'
}
```

String representation:

```txt
objects.warehouse.read
objects.warehouse.create
objects.warehouse.update
objects.warehouse.delete
objects.warehouse.restore
```

## 15.1 Required permission checks

| Operation | Required permission |
|---|---|
| List warehouses | `objects.warehouse.read` |
| View warehouse | `objects.warehouse.read` |
| Create warehouse | `objects.warehouse.create` |
| Update warehouse | `objects.warehouse.update` |
| Activate warehouse | `objects.warehouse.update` |
| Deactivate warehouse | `objects.warehouse.update` |
| Soft delete warehouse | `objects.warehouse.delete` |
| Restore warehouse | `objects.warehouse.restore` |
| Include deleted warehouses | `objects.warehouse.restore` or admin-equivalent |

## 15.2 Permission enforcement location

API routes must enforce permissions.

Services must also enforce or require an already-authorized context pattern.

UI permission checks are only usability helpers.

Correct route pattern:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'warehouse',
  action: 'create',
})

const input = CreateWarehouseSchema.parse(body)
const warehouse = await WarehouseService.create(ctx, input)
```

Incorrect:

```ts
if (showButton) {
  await WarehouseService.create(ctx, input)
}
```

The service/API must enforce security regardless of UI state.

## 15.3 Admin wildcard rule

Admin wildcard permission may allow warehouse operations, but only inside the verified organization.

Wildcard permission never bypasses tenant isolation.

---

# 16. Events

Warehouse mutations must emit Business Object events.

Events use the `objects` namespace.

Correct:

```txt
objects.warehouse.created
objects.warehouse.updated
objects.warehouse.activated
objects.warehouse.deactivated
objects.warehouse.deleted
objects.warehouse.restored
```

Incorrect:

```txt
inventory.warehouse.created
purchasing.warehouse.created
warehouse.created
objects.warehouse.create
objects.warehouse.deactivate
```

Events are facts, so verbs must be past tense.

## 16.1 Event envelope

Events must be emitted through the server SDK:

```ts
await sdk.events.emit(ctx, 'objects.warehouse.created', {
  warehouseId: warehouse.id,
  code: warehouse.code,
  name: warehouse.name,
  branchId: warehouse.branchId,
})
```

The event envelope should include:

```txt
eventId
name
orgId
actorUserId
occurredAt
payload
```

Payloads should remain small.

Do not include full Prisma records.

Do not include secrets.

Do not include unrelated module data.

## 16.2 Event payload examples

Created:

```json
{
  "warehouseId": "wh_123",
  "code": "MAIN",
  "name": "Main Warehouse",
  "branchId": "branch_123"
}
```

Updated:

```json
{
  "warehouseId": "wh_123",
  "changedFields": ["name", "address"]
}
```

Deactivated:

```json
{
  "warehouseId": "wh_123"
}
```

Deleted:

```json
{
  "warehouseId": "wh_123"
}
```

## 16.3 Future consumers

Future consumers may include:

```txt
Audit Log Service
Search Service
Reporting Service
AI Context Indexer
Notification Service
Inventory listeners
Purchasing listeners
```

Warehouse should emit events now so these services can be added later without retrofitting every mutation.

---

# 17. Search and Display Rules

Warehouse should be searchable by:

```txt
code
name
address
branch name
```

Default display label:

```txt
CODE — Name
```

Example:

```txt
MAIN — Main Warehouse
```

If linked to a branch, UI may display:

```txt
MAIN — Main Warehouse · Manila Branch
```

Dropdowns should generally show only active warehouses by default.

Historical filters should allow inactive warehouses when needed.

Deleted warehouses should not appear except in restore/admin views.

---

# 18. UI Standards

Warehouse management UI should be simple and operational.

## 18.1 List page columns

Recommended columns:

```txt
Code
Name
Branch
Address
Status
Updated
Actions
```

## 18.2 Create form fields

Recommended fields:

```txt
Name
Code
Branch
Address
```

`Code` may be auto-suggested from `Name`.

`Branch` should be optional.

## 18.3 Status handling

UI should distinguish:

```txt
Active
Inactive
Deleted
```

Inactive should not look like deleted.

Deleted should appear only in explicit restore/admin views.

## 18.4 Empty state

Suggested empty state:

```txt
No warehouses yet.
Create a warehouse to start tracking where products, supplies, or assets are stored.
```

Do not mention Inventory only, because Warehouse is shared.

Incorrect empty state:

```txt
No inventory warehouses yet.
```

## 18.5 Deletion confirmation

Warehouse delete confirmation must strongly recommend deactivation when appropriate.

Example:

```txt
Delete warehouse?

Only delete a warehouse if it was created by mistake and has no related records.
If this warehouse was used before, deactivate it instead so historical records stay clear.
```

---

# 19. Import / Export Rules

Warehouse import/export is not MVP-critical but should be designed correctly.

Importable fields:

```txt
code
name
branchCode or branchName
address
isActive
```

Forbidden import fields:

```txt
orgId
createdAt
deletedAt
deletedBy
```

Import should resolve branch by current organization only.

Export should include only current organization data.

Deleted warehouses should be excluded by default.

---

# 20. AI Context Rules

AI may answer questions about warehouses only within the verified tenant context.

Examples of safe AI questions:

```txt
Which warehouses are active?
Which warehouses are linked to Cebu Branch?
Do we have inactive warehouses?
Show warehouses without branch assignment.
```

Examples requiring module data:

```txt
Which warehouse has the most stock?
Which warehouse received the most purchases?
Which warehouse has slow-moving inventory?
```

Those questions require Inventory or Purchasing data and must go through those modules or future Reporting/Search services.

AI must not infer warehouse stock quantities from Warehouse alone.

Warehouse contains identity and location, not stock.

---

# 21. Tenant Isolation Rules

Warehouse is tenant-scoped.

Every Warehouse record must have `orgId`.

Every Warehouse query must be scoped by `ctx.org.id`.

Client-supplied `orgId` must be rejected.

Wrong-org warehouse access should return safe `404`, not reveal that the warehouse exists.

Correct:

```ts
await db.warehouse.findFirst({
  where: {
    id: warehouseId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Incorrect:

```ts
await db.warehouse.findUnique({
  where: { id: warehouseId },
})
```

Incorrect:

```ts
await db.warehouse.findMany({
  where: { orgId: body.orgId },
})
```

---

# 22. Database Relationship Rules

Module-owned tables should reference Warehouse safely.

Preferred pattern:

```prisma
model StockBalance {
  id          String @id @default(cuid())
  orgId       String
  productId   String
  warehouseId String

  quantity    Decimal

  warehouse Warehouse @relation(fields: [warehouseId], references: [id])

  @@index([orgId, warehouseId])
  @@unique([orgId, productId, warehouseId])
}
```

Even when foreign keys reference `warehouseId`, services must still query with `orgId`.

Where practical, tenant-safe composite references are preferred:

```prisma
@@unique([id, orgId])
```

Then relation fields can include both `warehouseId` and `orgId`.

However, even composite references do not replace service-level `PlatformContext` checks.

---

# 23. Module Extension Pattern

Warehouse extension fields belong in module-owned extension tables.

## 23.1 Inventory extension

Examples:

```txt
binTrackingEnabled
allowNegativeStock
cycleCountEnabled
inventoryValuationGroup
defaultAdjustmentReason
```

## 23.2 Purchasing extension

Examples:

```txt
receivingInstructions
requiresInspection
preferredReceivingHours
defaultReceivingUserId
```

## 23.3 Assets extension

Examples:

```txt
allowAssetStorage
requiresCustodian
assetSecurityLevel
```

## 23.4 Future Warehouse Management extension

Examples:

```txt
zones
bins
racks
pick paths
putaway rules
capacity planning
```

Do not add these to core Warehouse until repeated independent use cases justify promotion.

---

# 24. Three Independent Use Cases Rule

Warehouse itself is already justified as a Business Object because it is a shared operational identity likely to be used across multiple modules:

```txt
Inventory
Purchasing
Transfers
Assets
```

However, Warehouse-related capabilities must still follow the Three Independent Use Cases Rule.

Example: bin tracking.

```txt
Only Inventory needs bin tracking
→ Keep it inside Inventory.

Inventory + Assets need detailed storage positions
→ Still keep separate or use a small shared pattern.

Inventory + Assets + Repairs all need reusable bin/location hierarchy
→ Consider promoting to Platform Service or shared Warehouse Management capability.
```

Example: warehouse approvals.

```txt
Only Inventory needs approval to transfer between warehouses
→ Keep it inside Inventory/Transfers.

Inventory + Purchasing + Assets need approval around warehouse movements
→ Consider Approval Engine if the approval lifecycle is the same.
```

Do not turn Warehouse into a mini-WMS prematurely.

---

# 25. Testing Requirements

Warehouse tests are required before implementation is accepted.

## 25.1 Service tests

Required service tests:

```txt
creates warehouse using PlatformContext org
rejects client-supplied orgId
normalizes warehouse code
requires unique code within org
allows same code in different orgs
validates branch belongs to same org
rejects branch from another org
lists only current org warehouses
excludes deleted warehouses by default
can include inactive warehouses
can deactivate warehouse
can reactivate warehouse
soft-deletes warehouse when safe
restores warehouse with restore permission
emits created event
emits updated event
emits deactivated event
emits restored event
```

## 25.2 API tests

Required API tests:

```txt
unauthenticated request returns 401 JSON
wrong-org request returns safe 404
user without read permission gets 403
user without create permission gets 403
create rejects orgId in body
create rejects unknown keys
create validates branch ownership
update rejects orgId in body
list excludes other org data
delete uses soft delete
delete denies entity in use when usage is known
```

## 25.3 Tenant isolation tests

Every warehouse test suite must include at least two organizations:

```txt
Org A
Org B
```

Tests must prove that Org A cannot:

```txt
read Org B warehouse
update Org B warehouse
delete Org B warehouse
assign Org B branch to Org A warehouse
reuse Org B context accidentally
```

## 25.4 Permission tests

Tests must include:

```txt
Admin user
Staff user with read only
Staff user with no warehouse permission
```

Always-admin tests are insufficient.

## 25.5 Event tests

Mutation tests must assert event names exactly.

Correct:

```txt
objects.warehouse.created
```

A typo in event names should fail tests.

---

# 26. Security Requirements

Warehouse implementation must satisfy the same security requirements as all Business Objects.

```txt
No client-supplied orgId
No raw Prisma in modules
No findUnique by id only for tenant-scoped records
No direct module ownership
No redirecting API auth
No UI-only permission enforcement
No cross-tenant branch assignment
No cascade deletion of module history
No event payloads with full Prisma records
```

All API errors must follow Kernel API Contracts.

---

# 27. Forbidden Patterns

Claude must not generate these patterns.

## 27.1 Module-owned warehouse

Forbidden:

```prisma
model InventoryWarehouse {
  id String @id
  orgId String
  name String
}
```

Correct:

```prisma
model InventoryWarehouseExtension {
  warehouseId String
  orgId String
  binTrackingEnabled Boolean
}
```

## 27.2 Loose orgId

Forbidden:

```ts
WarehouseService.list(orgId)
```

Correct:

```ts
WarehouseService.list(ctx)
```

## 27.3 Client-supplied orgId

Forbidden:

```ts
const orgId = body.orgId
```

Correct:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
```

## 27.4 Direct Prisma in module

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
```

Correct:

```ts
import { sdk } from '@/sdk/server'
```

## 27.5 Stock fields in Warehouse

Forbidden:

```prisma
model Warehouse {
  stockQuantity Decimal
  reorderPoint Int
  valuationMethod String
}
```

Correct:

```prisma
model StockBalance {
  warehouseId String
  productId String
  quantity Decimal
}
```

## 27.6 Wrong event namespace

Forbidden:

```txt
inventory.warehouse.created
```

Correct:

```txt
objects.warehouse.created
```

## 27.7 Deleting used warehouses casually

Forbidden:

```txt
Delete warehouse even if it has stock movements
```

Correct:

```txt
Deactivate used warehouse
```

---

# 28. Claude Implementation Instructions

When Claude implements Warehouse, it must follow these rules:

```txt
1. Implement Warehouse as a Business Object, not an Inventory module entity.
2. Use verified PlatformContext for every service operation.
3. Use sdk.getDb(ctx), never sdk.getDb(orgId).
4. Reject client-supplied orgId in all schemas.
5. Scope every query by ctx.org.id.
6. Validate branch ownership before linking branchId.
7. Use soft delete, not hard delete.
8. Prefer deactivation over deletion for used warehouses.
9. Emit objects.warehouse.* events for all mutations.
10. Enforce permissions in API routes and services.
11. Add two-org tenant isolation tests.
12. Add permission denial tests.
13. Do not add stock, bin, receiving, valuation, or capacity fields to Warehouse.
14. Do not create InventoryWarehouse as a duplicate entity.
15. Do not import Kernel internals from modules.
```

If Claude finds a conflict between this document and older Kernel v2 code, Claude must follow this document for the restarted build and report the conflict.

---

# 29. Acceptance Criteria

This document is implementation-ready only when all of the following are true:

```txt
[ ] Warehouse is implemented as a Business Object.
[ ] Warehouse table includes orgId.
[ ] Warehouse table includes code, name, optional branchId, optional address, isActive, timestamps, deletedAt, deletedBy.
[ ] Warehouse code is unique per organization.
[ ] Warehouse branch relationship is optional.
[ ] Branch ownership is validated by org.
[ ] Warehouse APIs live under /api/orgs/[orgSlug]/objects/warehouses.
[ ] APIs reject client-supplied orgId.
[ ] APIs return JSON only.
[ ] APIs enforce authentication, tenant membership, module/object permission, and validation.
[ ] Services receive PlatformContext, not loose orgId.
[ ] Services use sdk.getDb(ctx).
[ ] Normal reads exclude deleted warehouses.
[ ] Inactive warehouses remain available for historical display.
[ ] Soft delete is conservative and does not cascade-delete history.
[ ] Warehouse mutations emit objects.warehouse.* events.
[ ] Inventory, Purchasing, Assets, and Transfers reference Warehouse instead of duplicating it.
[ ] Module-specific fields go in module extension tables.
[ ] Two-org tenant isolation tests pass.
[ ] Permission denial tests pass.
[ ] Event emission tests pass.
[ ] Typecheck passes.
[ ] Tests pass.
[ ] Build passes.
```

---

# 30. Summary

Warehouse is the shared operational storage identity of OneDayOS.

It is a Business Object, not an Inventory entity.

It should stay minimal:

```txt
code
name
branch
address
active status
lifecycle fields
```

It should not become a warehouse management system.

Inventory, Purchasing, Transfers, Assets, and future modules should reference Warehouse instead of creating their own storage-location tables.

The most important rule:

```txt
Warehouse is shared identity.
Modules own behavior around it.
```

That is how OneDayOS avoids becoming ten separate apps inside one repository.
