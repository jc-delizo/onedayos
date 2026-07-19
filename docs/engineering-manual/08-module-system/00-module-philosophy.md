# OneDayOS Engineering Manual — Module System: Module Philosophy

**Document ID:** `08-module-system/00-module-philosophy.md`  
**Version:** `1.0.0`  
**Status:** `Draft for Founder Review`  
**Author:** ChatGPT, acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Implementation Allowed:** No, not until marked `Frozen`  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `13-security/08-production-readiness-gate.md`
- `13-security/09-security-stabilization-new-build-spec.md`
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
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/04-migrations-seeding.md`
- `06-data/05-data-validation-zod.md`
- `06-data/06-row-level-security-plan.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/01-employee.md`
- `07-business-objects/02-product.md`
- `07-business-objects/03-customer.md`
- `07-business-objects/04-supplier.md`
- `07-business-objects/05-warehouse.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `07-business-objects/08-business-object-event-contracts.md`

---

## 1. Purpose

This document defines what a OneDayOS module is.

A module is not just a folder.

A module is not a mini-app.

A module is not a separate SaaS product.

A module is a self-contained business capability package that plugs into the shared OneDayOS platform.

The purpose of this document is to prevent the restarted platform from turning into a pile of separate applications hidden inside one repository.

OneDayOS must support hundreds of Philippine SMEs through one platform, one deployment model, one database architecture, one login system, one SDK, one permission model, one design system, and one module contract.

Modules are how OneDayOS delivers business value.

The platform is how OneDayOS survives.

---

## 2. Core Thesis

The central module thesis is:

```txt
Modules should be independently understandable,
but not independently sovereign.
```

This means a module should contain its own workflows, services, routes, UI, permissions, tests, events, and documentation.

But a module must not own platform fundamentals.

A module must not create its own authentication.

A module must not create its own tenant model.

A module must not create its own permission system.

A module must not create duplicate copies of shared Business Objects.

A module must not directly import another module.

A module must not bypass the SDK.

A module must not decide architecture.

---

## 3. Module Definition

A OneDayOS module is a business-domain package with a stable platform contract.

A module may include:

```txt
Manifest
Permissions
Navigation
Routes
API handlers
Services
Module-owned database models
Extension tables for Business Objects
Zod schemas
Server utilities
Client components
Pages
Events emitted
Events listened to
Settings definitions
Seed hooks
AI context
Documentation
Tests
```

A module must integrate through:

```txt
@/sdk
@/sdk/server
@/sdk/client
Shared UI components
Business Object APIs/services
Module manifest registration
Event contracts
```

A module must not integrate through:

```txt
@/kernel/*
Raw Prisma imports
Direct imports from another module
Client-supplied orgId
Private database tables of another module
Private service classes of another module
Separate FastAPI routes
Separate backend runtime
```

---

## 4. What a Module Is Not

A module is not a standalone deployment.

A module is not a client-specific fork.

A module is not a code island.

A module is not allowed to contain its own platform primitives.

A module is not allowed to recreate Business Objects.

A module is not allowed to bypass tenant isolation.

A module is not allowed to trust the browser for tenant identity.

A module is not allowed to treat UI permission checks as security.

A module is not allowed to invent new API response shapes.

A module is not allowed to invent new event naming conventions.

A module is not allowed to invent a new table/form design language.

---

## 5. Architectural Position

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

Business Modules sit above Kernel, Business Objects, and Platform Services.

Modules consume the lower layers.

Modules do not own the lower layers.

Modules may expose business behavior to Client Configuration.

Modules may eventually contribute metadata to Dynamic Forms, Dynamic CRUD, Reporting, Search, and AI.

But those dynamic systems are not part of the module philosophy MVP.

---

## 6. Module Boundary Rule

A module owns business behavior that belongs to one domain.

Examples:

| Module | Owns | Does Not Own |
|---|---|---|
| Inventory | Stock movements, stock adjustments, stock balances, reorder rules | Product, Warehouse, Supplier |
| Leave | Leave requests, leave balances, leave policies | Employee, User, Department |
| CRM | Leads, opportunities, pipelines, interactions | Customer, User |
| Purchasing | Purchase requests, purchase orders, receiving workflows | Supplier, Product, Warehouse |
| Expenses | Expense claims, reimbursements | Employee, Supplier |
| Assets | Asset records, assignments, maintenance | Employee, Supplier, Warehouse |
| Visitor Management | Visitor logs, visits, host assignment | Employee |
| Incident Reporting | Incidents, categories, investigations | Employee, Department |

If a concept is shared by multiple modules, it probably belongs in Business Objects or Platform Services.

If a concept is specific to one domain, it belongs inside the module.

If unsure, keep the concept inside the module first.

Promotion is easier than extracting a premature shared abstraction.

---

## 7. Business Object Rule

Modules must reference shared Business Objects.

Modules must not duplicate them.

Forbidden examples:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
AssetWarehouse
ProjectCustomer
```

Allowed examples:

```txt
Product
Customer
Supplier
Employee
Warehouse

InventoryProductExtension
CRMCustomerExtension
PurchasingSupplierExtension
AssetWarehouseExtension
```

The shared Business Objects currently approved are:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Branch and Department are not Business Objects.

They are Kernel organization-structure primitives.

Warehouse is a Business Object because it represents an operational storage/location identity that may be used by Inventory, Purchasing, Transfers, Assets, and future modules.

---

## 8. Extension Table Rule

Modules may add module-specific behavior around Business Objects through extension tables.

Example:

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
  valuationMethod
```

The module owns `InventoryProductExtension`.

The platform owns `Product`.

The Inventory module may not add `reorderPoint` directly to `Product`.

The Purchasing module may not add `preferredSupplierId` directly to `Product`.

The CRM module may not add `salesStage` directly to `Customer`.

A field becomes eligible for promotion to a Business Object only after repeated independent use cases prove it belongs there.

---

## 9. Three Independent Use Cases Rule

The earlier shorthand was the Three Client Rule.

The more precise OneDayOS rule is:

```txt
A capability should not become Kernel or Platform Service infrastructure
until at least three independent use cases prove that the same capability
is needed across domains.
```

The independent use cases may be:

```txt
Three independent modules
Three independent client workflows
Three independent paying client requirements
```

Examples:

```txt
Leave needs approvals
Purchasing needs approvals
Expenses needs approvals
→ Approval Engine may be promoted to Platform Service.
```

```txt
Only Inventory needs low-stock alerts
→ Keep alert behavior inside Inventory.
```

```txt
Inventory, Incidents, and Leave all need user notifications
→ Notification Service may be promoted to Platform Service.
```

This rule does not apply to true Kernel fundamentals.

Authentication, organizations, users, roles, permissions, SDK, module registry, routing primitives, and API contracts are Kernel because every module depends on them from day one.

---

## 10. Module Ownership

A module may own:

```txt
Module-specific database tables
Module-specific services
Module-specific API routes
Module-specific page routes
Module-specific UI components
Module-specific permissions
Module-specific settings
Module-specific event payload schemas
Module-specific tests
Module-specific documentation
Module-specific AI context
Module-specific seed data
```

A module may not own:

```txt
Authentication
Organizations
Users
Roles
Permissions engine
Branch
Department
Business Object identity tables
Raw database client
Global API response shape
Global event bus implementation
Global design system
Platform service engines
Supabase clients
Prisma singleton
```

---

## 11. Module Import Rules

Modules may import:

```ts
import { sdk } from '@/sdk/server'
import { sdkClient } from '@/sdk/client'
import type { PlatformContext } from '@/sdk'
import type { ModuleManifest } from '@/sdk'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/platform/data-table'
import { CreateInventorySchema } from './schema'
```

Modules must not import:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
import { registerModule } from '@/kernel/modules/registry'
import { CustomerService } from '@/modules/crm/service'
import { InventoryService } from '@/modules/inventory/service'
```

A module imports the SDK.

The SDK imports Kernel internals.

This preserves the ability to refactor Kernel without rewriting modules.

---

## 12. Direct Module-to-Module Import Rule

Modules never import from other modules.

Forbidden:

```ts
// inside purchasing
import { InventoryService } from '@/modules/inventory/service'

// inside crm
import { ReservationService } from '@/modules/reservations/service'

// inside assets
import { EmployeeLeaveService } from '@/modules/leave/service'
```

Allowed alternatives:

```txt
Shared Business Object reference
Event emission/listening
Platform Service after promotion
SDK-provided capability
Manifest dependency declaration
```

Example:

Purchasing should not call Inventory directly when receiving items.

Instead:

```txt
Purchasing emits purchasing.receipt.created
Inventory listens and creates stock movement
```

Purchasing does not need to know Inventory exists.

Inventory does not need to be imported by Purchasing.

---

## 13. Module Manifest Rule

Every module must have a manifest.

The manifest is the module's public declaration to the platform.

It should eventually describe:

```txt
Identity
Version
Compatibility
Dependencies
Permissions
Navigation
Routes
Events emitted
Events listened to
Settings
Business Objects referenced
Module-owned entities
Extension tables
Dashboard widgets
AI context
Documentation
Seed hooks
```

The manifest is not decorative.

The manifest drives:

```txt
Module registration
Sidebar navigation
Module enablement
Permission seeding
Route validation
Documentation
Future marketplace listing
Future AI context
Future reporting/search registration
Future dynamic forms/tables
```

A module without a manifest is not a OneDayOS module.

It is just code.

---

## 14. Module Enablement Rule

A module can exist in the codebase but be disabled for an organization.

Module availability is controlled by:

```txt
OrgModule
Subscription/plan rules
Module dependencies
Organization status
User permissions
```

These are separate gates.

A module route is accessible only if all required gates pass:

```txt
Authenticated user
+ verified organization membership
+ active organization
+ subscription allows module
+ module enabled for organization
+ user has required permission
```

A module being enabled does not mean every user can access it.

A user having permission does not matter if the module is disabled.

Tenant membership always comes before module enablement and permission checks.

---

## 15. Module API Route Rule

Module APIs must be tenant-scoped by route.

Approved route pattern:

```txt
/api/orgs/[orgSlug]/[moduleId]/[resource]
/api/orgs/[orgSlug]/[moduleId]/[resource]/[id]
```

Examples:

```txt
/api/orgs/acme-corp/inventory/stock-movements
/api/orgs/acme-corp/leave/requests
/api/orgs/acme-corp/crm/opportunities
/api/orgs/acme-corp/purchasing/purchase-orders
```

Forbidden route patterns:

```txt
/api/inventory?orgId=org_123
/api/inventory/products
/api/modules/inventory?orgId=org_123
/api/clients/acme/inventory
```

The server may receive `orgSlug` as a route locator.

The server must verify that the authenticated user belongs to the organization represented by that slug.

The client must never submit `orgId`.

---

## 16. Module Page Route Rule

Module UI routes live under the organization slug.

Approved page pattern:

```txt
/[orgSlug]/[moduleId]
/[orgSlug]/[moduleId]/new
/[orgSlug]/[moduleId]/[id]
/[orgSlug]/[moduleId]/[id]/edit
```

Examples:

```txt
/acme-corp/inventory
/acme-corp/inventory/stock
/acme-corp/leave/requests
/acme-corp/crm/opportunities
/acme-corp/purchasing/purchase-orders
```

A module page must not derive authorization from the URL alone.

The page route must either receive or trigger verified platform context.

---

## 17. Module Service Rule

Module services must receive verified `PlatformContext`.

Approved:

```ts
export class InventoryService {
  static async listStockMovements(ctx: PlatformContext, input: ListStockMovementsInput) {
    const db = sdk.getDb(ctx)

    return db.stockMovement.findMany({
      where: {
        orgId: ctx.org.id,
        deletedAt: null,
      },
    })
  }
}
```

Forbidden:

```ts
export class InventoryService {
  static async listStockMovements(orgId: string) {
    return prisma.stockMovement.findMany({
      where: { orgId },
    })
  }
}
```

Also forbidden:

```ts
export class InventoryService {
  static async listStockMovements(input: { orgId: string }) {
    return sdk.getDb(input.orgId).stockMovement.findMany(...)
  }
}
```

The verified context must come from Kernel/SDK auth helpers.

Never from browser input.

---

## 18. Standard Module Operation Flow

A protected module API mutation should follow this sequence:

```txt
1. Parse route params.
2. Create verified PlatformContext.
3. Verify module is enabled.
4. Verify permission.
5. Parse and validate body using Zod strict schema.
6. Reject client-supplied orgId.
7. Call module service with ctx + validated input.
8. Service queries via sdk.getDb(ctx).
9. Service emits event through sdk.events.
10. API returns standard { data, error, meta? } JSON.
```

Example:

```ts
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params

  return sdk.api.handle(req, async () => {
    const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    })

    const input = await sdk.api.parseJson(req, CreateStockAdjustmentSchema)

    const result = await InventoryService.createStockAdjustment(ctx, input)

    return sdk.api.created(result)
  })
}
```

This pattern is not optional.

Generated module APIs must follow it by default.

---

## 19. Module-Owned Database Model Rule

Module-owned tables must follow OneDayOS data rules.

A tenant-scoped module-owned model should include:

```txt
id
orgId
createdAt
updatedAt
deletedAt
deletedBy
createdBy or actor fields where appropriate
```

A module-owned model should reference Business Objects with tenant-safe relationships.

Example:

```prisma
model StockMovement {
  id          String   @id @default(cuid())
  orgId       String
  productId   String
  warehouseId String
  type        String
  quantity    Decimal
  occurredAt  DateTime @default(now())
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org       Organization @relation(fields: [orgId], references: [id])
  product   Product      @relation(fields: [productId, orgId], references: [id, orgId])
  warehouse Warehouse    @relation(fields: [warehouseId, orgId], references: [id, orgId])

  @@index([orgId, productId])
  @@index([orgId, warehouseId])
  @@index([orgId, occurredAt])
  @@map("inventory_stock_movements")
}
```

The exact Prisma relation syntax may vary based on final schema constraints, but the principle remains:

```txt
Tenant-safe references always include orgId.
```

---

## 20. Module Table Naming Rule

Module-owned tables should be prefixed by module identity unless the model name is already clearly scoped.

Preferred table names:

```txt
inventory_stock_movements
inventory_stock_balances
inventory_stock_adjustments
leave_requests
leave_balances
crm_opportunities
crm_interactions
purchasing_purchase_orders
expense_claims
asset_records
visitor_visits
incident_reports
```

Avoid generic table names:

```txt
records
requests
items
transactions
logs
details
```

Generic names become confusing in a platform with many modules.

---

## 21. Module Permission Rule

Every module must declare its permissions.

Permissions must be explicit, resource-based, and action-based.

Example:

```ts
permissions: [
  { module: 'inventory', resource: 'stock_movement', action: 'read' },
  { module: 'inventory', resource: 'stock_adjustment', action: 'create' },
  { module: 'inventory', resource: 'stock_adjustment', action: 'approve' },
]
```

Avoid vague permission names:

```txt
inventory.access
inventory.manage
inventory.admin
```

Preferred permission shape:

```txt
module.resource.action
```

Examples:

```txt
inventory.stock_movement.read
inventory.stock_adjustment.create
inventory.stock_adjustment.approve
leave.request.create
leave.request.approve
crm.opportunity.update
purchasing.purchase_order.receive
```

Wildcard permissions are allowed only through Kernel RBAC rules.

They do not bypass tenant isolation.

---

## 22. Module UI Rule

Modules inherit the OneDayOS design system.

Modules must not invent their own UI language.

Module UI must use:

```txt
Shared App Shell
Shared page header patterns
Shared table patterns
Shared form patterns
Shared empty/loading/error states
Shared permission-denied states
Shared motion/interaction standards
Shared shadcn/ui components
Shared platform components
```

A module must not generate generic dashboard cards just because the domain has data.

A module screen should be:

```txt
Minimal
Premium
Fast
Data-dense
Keyboard-friendly
Consistent
Beautiful in empty state
Beautiful under loading
Clear under error
```

If Claude generates a module page that looks like a generic admin starter, reject it.

---

## 23. Module Client Component Rule

Client components must be browser-safe.

Client components may import:

```ts
import { sdkClient } from '@/sdk/client'
import { Button } from '@/components/ui/button'
import { useParams } from 'next/navigation'
```

Client components must not import:

```ts
import { sdk } from '@/sdk/server'
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { InventoryService } from '@/modules/inventory/service'
```

Client components should call API routes or server actions through approved client SDK helpers.

Client components should never receive `params` as a synchronous prop if the current Next.js runtime treats route params asynchronously.

Use `useParams()` in client components.

---

## 24. Module Validation Rule

Modules must validate all inputs with Zod.

Validation applies to:

```txt
API request bodies
Route params
Query strings
Form inputs
Settings values
Event payloads
Import rows
Future AI-generated action inputs
```

Schemas should be strict by default.

Forbidden schema pattern:

```ts
z.object({
  orgId: z.string(),
  name: z.string(),
})
```

Approved schema pattern:

```ts
z.strictObject({
  name: z.string().min(1),
})
```

Tenant identity belongs to `PlatformContext`, not to input schemas.

---

## 25. Module Event Rule

Modules communicate through events.

Events are facts.

Events are not commands.

Approved examples:

```txt
inventory.stock_movement.created
inventory.stock_adjustment.approved
leave.request.submitted
leave.request.approved
crm.opportunity.won
purchasing.purchase_order.received
assets.asset.assigned
incidents.report.created
```

Forbidden examples:

```txt
inventory.createStockMovement
sendNotification
updateCRM
productCreated
inventory.StockMovementCreated
```

Module events must be emitted server-side through the SDK:

```ts
await sdk.events.emit(ctx, 'inventory.stock_movement.created', {
  stockMovementId: movement.id,
  productId: movement.productId,
  warehouseId: movement.warehouseId,
})
```

Event payloads must not contain:

```txt
orgId
full Prisma records
secrets
access tokens
large blobs
unvalidated input
```

The `EventEnvelope` already carries tenant context.

---

## 26. Module Listener Rule

A module may listen to events declared in its manifest.

Listeners must not create direct coupling.

Example:

Inventory may listen to:

```txt
purchasing.receipt.created
```

and create a stock movement.

But Purchasing must not import Inventory.

Inventory must not assume every organization has Purchasing enabled.

Event listeners must check:

```txt
Organization context
Module enablement
Permission or system permission requirements
Idempotency
Payload schema
```

Listener failures must not break the original business transaction unless explicitly designed as part of the same workflow.

For MVP, most listeners should be minimal.

Durable event processing can wait until background jobs/outbox are promoted.

---

## 27. Module Settings Rule

Modules may define settings.

Settings must use the platform settings system.

Allowed:

```txt
Setting:
  orgId
  module: "inventory"
  key: "low_stock_threshold_mode"
  value: { ... }
```

Forbidden:

```txt
.env variable per client
module-specific settings table without review
hardcoded client behavior
client slug conditionals in code
```

Settings must be validated with Zod.

Settings must have defaults.

Settings must be documented in the module manifest or module spec.

---

## 28. Module Seed Rule

Modules may provide seed hooks.

Seed hooks are used for:

```txt
Default settings
Default categories
Default statuses
Default workflows
Default permissions
Demo data only when explicitly requested
```

Seed hooks must be idempotent.

Seed hooks must not overwrite client data.

Seed hooks must not create users unless part of org provisioning.

Seed hooks must not enable the module by themselves unless the provisioning flow explicitly requests it.

---

## 29. Module AI Context Rule

Every official module should eventually provide AI context.

AI context should describe:

```txt
What the module does
What entities it owns
What Business Objects it references
Common user questions
Allowed AI actions
Forbidden AI actions
Data sensitivity
Permission requirements
```

AI context is not implemented in MVP as a runtime agent capability.

But module docs should be written so future AI can consume them safely.

AI must never bypass permissions.

AI must never query module data without verified tenant context.

---

## 30. Module Documentation Rule

A module must include documentation.

Documentation should include:

```txt
Purpose
Non-goals
Business workflows
Business Objects used
Module-owned entities
Permissions
Routes
APIs
Services
Events emitted
Events listened to
Settings
UI screens
Tests
Seed data
Known limitations
```

If the module cannot be explained, it should not be implemented.

Documentation is not separate from implementation.

Documentation is how OneDayOS prevents Claude from inventing architecture.

---

## 31. Module Testing Rule

Every module must ship with tests.

Minimum test categories:

```txt
Manifest tests
Service tests
API tests
Tenant isolation tests
Permission-denial tests
Validation tests
Soft-delete tests
Event emission tests
Module enablement tests
UI smoke tests where practical
```

Security-sensitive module tests must use at least two organizations.

Always-admin tests are not enough.

Single-org tests are not enough.

Generated module tests must not be tautological.

Bad test:

```ts
expect(Array.isArray(await Service.list(ctx))).toBe(true)
```

Good test:

```ts
expect(await OrgAUserCannotReadOrgBRecord()).toBeDenied()
expect(await StaffWithoutPermissionCannotCreate()).toReturn403()
expect(sdk.events.emit).toHaveBeenCalledWith(ctx, expectedEventName, expectedPayload)
```

---

## 32. Module Lifecycle

A module should move through these stages:

```txt
1. Proposed
2. Specified
3. Generated
4. Implemented
5. Tested
6. Registered
7. Seeded
8. Enabled for demo org
9. Reviewed
10. Approved for production
11. Enabled for client orgs
12. Maintained
```

A module should not skip specification.

A module should not be enabled for clients before passing tenant and permission tests.

A module should not become a Platform Service just because its code is reused once.

---

## 33. Module Development Sequence

For a new module, the correct sequence is:

```txt
1. Write module specification.
2. Identify Business Objects referenced.
3. Identify module-owned entities.
4. Identify extension tables needed.
5. Define permissions.
6. Define events.
7. Define APIs.
8. Define screens.
9. Define tests.
10. Generate scaffold.
11. Implement database models.
12. Implement services.
13. Implement APIs.
14. Implement UI.
15. Run tests.
16. Enable for demo org.
17. Review against manual.
18. Enable for client org.
```

The wrong sequence is:

```txt
1. Ask Claude to build Inventory.
2. Let Claude create Product inside Inventory.
3. Add pages.
4. Add API.
5. Add database fields.
6. Patch permissions later.
7. Patch tenancy later.
8. Discover duplicate entities later.
```

That is how OneDayOS becomes a brittle admin app instead of a platform.

---

## 34. First Official Module Rule

Inventory should be the first official module only after the platform foundations are frozen.

Inventory is not the platform.

Inventory is a proof that the platform works.

Inventory should prove:

```txt
Business Objects
Extension tables
SDK-only access
Verified PlatformContext
Module APIs
Module permissions
Module enablement
Event emission
Soft delete
DataTable/form standards
Tenant isolation tests
Permission-denial tests
```

Inventory must not teach Claude bad patterns.

If Inventory is built before the module system is frozen, the bad patterns will spread.

---

## 35. Module Examples

### 35.1 Inventory

Inventory owns:

```txt
StockMovement
StockBalance
StockAdjustment
InventoryProductExtension
ReorderRule
```

Inventory references:

```txt
Product
Warehouse
Supplier
Employee/User as actor
```

Inventory does not own:

```txt
Product
Warehouse
Supplier
Employee
```

### 35.2 Leave

Leave owns:

```txt
LeaveRequest
LeavePolicy
LeaveBalance
LeaveType
```

Leave references:

```txt
Employee
Department
Branch
User as approver
```

Leave does not own:

```txt
Employee
User
Department
Approval Engine unless promoted later
Notification Engine unless promoted later
```

### 35.3 CRM

CRM owns:

```txt
Lead
Opportunity
Pipeline
PipelineStage
Interaction
Activity
```

CRM references:

```txt
Customer
Employee/User as owner
```

CRM does not own:

```txt
Customer
User
Email engine
Notification engine
```

### 35.4 Purchasing

Purchasing owns:

```txt
PurchaseRequest
PurchaseOrder
PurchaseOrderLine
ReceivingRecord
PurchasingSupplierExtension
PurchasingProductExtension
```

Purchasing references:

```txt
Supplier
Product
Warehouse
Employee/User as requester/approver
```

Purchasing does not own:

```txt
Supplier
Product
Warehouse
Approval Engine unless promoted later
```

---

## 36. Module Anti-Patterns

Reject these patterns immediately:

```txt
Module imports from @/kernel/*
Module imports from another module
Module uses raw Prisma
Module accepts orgId from client
Module service receives only orgId string
Module API route outside /api/orgs/[orgSlug]/...
Module page route outside /[orgSlug]/...
Module defines its own Employee/Product/Customer/Supplier/Warehouse
Module creates generic customFields JSON
Module hardcodes client-specific behavior
Module skips permission enforcement
Module checks permission only in UI
Module emits command-like events
Module returns nonstandard API JSON
Module uses hard delete for business records
Module includes FastAPI endpoint
Module invents its own design system
Module has no security tests
```

---

## 37. FastAPI Rule

FastAPI is not part of the core module system.

Modules must not expose FastAPI endpoints.

Modules must not call a Python backend directly.

Modules must use Next.js route handlers and the OneDayOS SDK.

A future Python/FastAPI service may be considered only through an ADR for specialized internal platform work, such as:

```txt
AI/RAG processing
Document parsing
Heavy ML workloads
Long-running background processing
```

Even then, it should be a Platform Service integration, not the module runtime.

---

## 38. Client-Specific Behavior Rule

Modules must not contain client-specific branches.

Forbidden:

```ts
if (ctx.org.slug === 'acme-corp') {
  // special behavior
}
```

Approved alternatives:

```txt
Org settings
Module settings
Feature flags
Plan limits
Permission configuration
Workflow configuration after Workflow Engine exists
Extension tables
Paid custom module after review
```

Client-specific hacks destroy platform maintainability.

---

## 39. Module Dependency Rule

A module may declare dependencies in its manifest.

Example:

```txt
Purchasing depends on Inventory? Maybe.
Inventory depends on Product Business Object? No, Business Objects are not modules.
Leave depends on Employee Business Object? No, Business Objects are not modules.
```

A dependency means:

```txt
This module cannot be enabled unless another module is enabled.
```

A dependency does not mean direct imports are allowed.

Dependencies should be rare in MVP.

Prefer Business Objects and events over module dependencies.

---

## 40. Module Versioning Rule

Modules have versions.

But MVP does not support per-organization module version pinning.

There is one platform deployment.

All organizations run the same deployed module code.

Module version metadata exists for:

```txt
Compatibility tracking
Release notes
Migration planning
Future marketplace readiness
Future enterprise module pinning
```

It does not mean:

```txt
Client A runs Inventory v1
Client B runs Inventory v2
Client C runs a fork
```

That complexity is deferred.

---

## 41. Module Release Rule

A module release must include:

```txt
Code changes
Database migrations if needed
Seed changes if needed
Manifest updates
Permission updates
Documentation updates
Tests
Release notes
Rollback/forward-fix consideration
```

A module release must not require manual per-client code changes.

Client differences should be configuration.

---

## 42. Module Generator Rule

The module generator must produce secure-by-default output.

Generated output must include:

```txt
Manifest
Permission constants
Zod schemas without orgId
Service receiving PlatformContext
API routes under /api/orgs/[orgSlug]/...
API auth/module/permission checks
Soft-delete pattern
Event emission
Tenant isolation tests
Permission-denial tests
Validation tests
Forbidden import compliance
```

Generated output must not include:

```txt
orgId in client schema
sdk.getDb(orgId)
raw Prisma import
/api/[module] routes
auth-only protected mutation routes
placeholder tests that prove nothing
```

The module generator is part of the platform architecture.

If the generator emits unsafe code, OneDayOS will scale unsafe code.

---

## 43. Claude Implementation Rules

Claude must follow these rules when implementing modules:

```txt
1. Read the frozen module specification first.
2. Do not invent module architecture.
3. Use only approved import paths.
4. Use PlatformContext for services.
5. Use SDK helpers for auth, DB, permissions, events, and API responses.
6. Do not accept client-supplied orgId.
7. Do not create duplicate Business Objects.
8. Do not directly import another module.
9. Do not add Platform Services unless specifically instructed by a frozen document.
10. Add tests with implementation.
11. Stop and report ambiguity instead of guessing.
```

Claude should not be asked:

```txt
Build Inventory.
```

Claude should be asked:

```txt
Using frozen Engineering Manual documents X, Y, and Z,
implement only the Inventory module scaffold and tests described in
17-module-specifications/01-inventory-module.md.
Do not invent architecture.
```

---

## 44. Suggested Module Folder Structure

The standard module folder should be:

```txt
src/modules/[moduleId]/
  manifest.ts
  permissions.ts
  schema.ts
  service.ts
  events.ts
  settings.ts
  ai-context.ts
  docs.md
  components/
  __tests__/
    manifest.test.ts
    service.test.ts
    permissions.test.ts
    events.test.ts
```

API routes live in:

```txt
src/app/api/orgs/[orgSlug]/[moduleId]/...
```

Page routes live in:

```txt
src/app/(platform)/[orgSlug]/[moduleId]/...
```

Module-specific UI components may live under the module if they are not globally reusable.

Globally reusable components belong in the design system or platform component area.

---

## 45. Example Minimal Module Manifest

This is illustrative only. The authoritative manifest contract belongs in `08-module-system/01-module-manifest.md`.

```ts
export const InventoryModule: ModuleManifest = {
  id: 'inventory',
  label: 'Inventory',
  description: 'Track stock movements, balances, and adjustments.',
  version: '0.1.0',
  compatibility: {
    platform: '>=0.1.0',
    sdk: '>=0.1.0',
  },
  icon: 'Package',
  dependencies: [],
  businessObjects: ['product', 'warehouse', 'supplier'],
  permissions: [
    { module: 'inventory', resource: 'stock_movement', action: 'read' },
    { module: 'inventory', resource: 'stock_adjustment', action: 'create' },
    { module: 'inventory', resource: 'stock_adjustment', action: 'approve' },
  ],
  navItems: [
    { label: 'Inventory', href: 'inventory', icon: 'Package' },
    { label: 'Stock Movements', href: 'inventory/stock-movements', icon: 'ArrowLeftRight' },
    { label: 'Adjustments', href: 'inventory/adjustments', icon: 'SlidersHorizontal' },
  ],
  events: {
    emits: [
      'inventory.stock_movement.created',
      'inventory.stock_adjustment.created',
      'inventory.stock_adjustment.approved',
    ],
    listens: [],
  },
}
```

---

## 46. Acceptance Criteria

This document is acceptable when:

```txt
[ ] A senior engineer can explain what a OneDayOS module is.
[ ] Claude can distinguish a module from a standalone app.
[ ] Module ownership boundaries are clear.
[ ] Business Object duplication is clearly forbidden.
[ ] SDK-only module access is clearly required.
[ ] Direct module-to-module imports are clearly forbidden.
[ ] Client-supplied orgId is clearly forbidden.
[ ] Module service PlatformContext pattern is clearly required.
[ ] Module API route pattern is clearly defined.
[ ] Module event philosophy is clearly defined.
[ ] Module tests are treated as architecture enforcement.
[ ] FastAPI is excluded from module runtime.
[ ] The document supports future generator implementation.
```

---

## 47. Founder Review Questions

Before freezing this document, answer:

```txt
1. Do we agree that modules are packages, not apps?
2. Do we agree that module APIs must live under /api/orgs/[orgSlug]/[moduleId]/...?
3. Do we agree that module services must receive PlatformContext?
4. Do we agree that modules cannot import other modules?
5. Do we agree that Business Objects are never duplicated inside modules?
6. Do we agree that module dependencies do not allow direct imports?
7. Do we agree that generated modules must include security tests by default?
8. Do we agree that Inventory should prove the platform, not define it?
```

---

## 48. Recommended Next Documents

After this document is approved, continue with:

```txt
08-module-system/01-module-manifest.md
08-module-system/02-module-loader-registry.md
08-module-system/03-module-folder-contract.md
08-module-system/04-module-permissions.md
08-module-system/05-module-navigation.md
08-module-system/06-module-events.md
08-module-system/07-module-dependencies.md
08-module-system/08-module-versioning.md
08-module-system/09-module-testing.md
```

The Module Manifest document should come next because the manifest is the contract between modules and the platform runtime.

---

## 49. Final Principle

A OneDayOS module should feel easy to build because the platform has already made the hard decisions.

If a module requires new architecture, stop.

If a module duplicates a shared object, stop.

If a module bypasses the SDK, stop.

If a module needs to call another module directly, stop.

If a module cannot be tested across two organizations, stop.

Modules deliver business value.

The platform protects the business.

Do not confuse the two.
