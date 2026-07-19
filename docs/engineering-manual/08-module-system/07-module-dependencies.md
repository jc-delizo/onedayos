# OneDayOS Engineering Manual — 08 Module System — 07 Module Dependencies

**Document ID:** `08-module-system/07-module-dependencies.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Implementation Allowed:** No. This document must be reviewed and frozen before Claude implements module dependency behavior.  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/02-organizations-tenancy.md`
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
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/02-module-loader-registry.md`
- `08-module-system/03-module-folder-contract.md`
- `08-module-system/04-module-permissions.md`
- `08-module-system/05-module-navigation.md`
- `08-module-system/06-module-events.md`

---

# 1. Purpose

This document defines how OneDayOS business modules may depend on one another without turning the platform into a tangled set of imports, duplicated entities, hidden runtime assumptions, or client-specific forks.

A OneDayOS module may need another module to be enabled, but that does **not** mean it may import that module's service, call that module's functions directly, reuse that module's private schema, or depend on that module's database tables casually.

The core rule is:

```txt
Module dependencies describe enablement and compatibility.
They do not grant direct code access.
```

This document exists because OneDayOS must support many business capabilities over time while preserving the original platform promise:

```txt
One deployment.
One database.
One login.
Shared business objects.
Shared platform.
No module-to-module spaghetti.
```

---

# 2. Non-Goals

This document does not define:

- Module versioning in full detail.
- Marketplace installation.
- Remote plugin loading.
- Per-organization module version pinning.
- Package-level distribution of modules.
- Dynamic import of tenant-specific module bundles.
- Background job dependency orchestration.
- Platform Service promotion logic beyond dependency-related guidance.
- FastAPI or a second backend runtime.

Those belong to later documents or future ADRs.

For the restarted MVP, modules are compiled into the same Next.js application and discovered through static manifest registration.

---

# 3. Core Thesis

A module dependency should answer this question:

```txt
Can this module be enabled and run correctly for this organization?
```

A module dependency should **not** answer this question:

```txt
Which TypeScript files may this module import?
```

Import rules are already fixed:

```txt
Allowed:
modules/* → @/sdk
modules/* → @/sdk/server, server-only files only
modules/* → @/sdk/client, client-safe files only
modules/* → @/components
modules/* → module-local files
modules/* → shared safe types, if explicitly approved

Forbidden:
modules/* → @/kernel/*
modules/* → another module/*
modules/* → raw Prisma
modules/* → FastAPI service clients as core backend dependencies
```

Even if `purchasing` declares a dependency on `inventory`, this remains forbidden:

```ts
// Forbidden
import { InventoryService } from '@/modules/inventory/service'
```

The correct integration pattern is one of:

```txt
1. Shared Business Objects
2. SDK APIs
3. Platform Services, after promotion
4. Events
5. Declarative configuration
6. Explicit dependency metadata
```

---

# 4. Dependency Types

OneDayOS uses several kinds of dependencies. They must not be confused.

## 4.1 Kernel Dependency

Every module depends on Kernel capabilities:

```txt
Authentication
Organizations
Users
Roles
Permissions
PlatformContext
Module Registry
API Contracts
Event Bus interface
Configuration
```

This is implicit. A module manifest does not need to declare the Kernel as a dependency.

---

## 4.2 SDK Dependency

Every module depends on the SDK.

The SDK is the only supported interface to the platform:

```ts
import { sdk } from '@/sdk/server'
```

or, in browser-safe code:

```ts
import { sdkClient } from '@/sdk/client'
```

A module does not depend on Kernel internals. It depends on SDK contracts.

---

## 4.3 Business Object Dependency

A module may use shared Business Objects:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

This is **not** a dependency on another module.

Examples:

```txt
Inventory uses Product.
Inventory does not depend on a Product module.

CRM uses Customer.
CRM does not own or depend on a Customer module.

Leave uses Employee.
Leave does not depend on HR.

Purchasing uses Supplier.
Purchasing does not depend on Inventory.
```

Business Object usage should be declared in the module manifest under `businessObjects`, but not under `dependencies`.

---

## 4.4 Required Module Dependency

A required module dependency means:

```txt
This module cannot be enabled or function correctly unless another module is also enabled for the same organization.
```

Required dependencies should be rare.

Example:

```txt
advanced-inventory-forecasting requires inventory
```

The forecasting module has no purpose without base inventory data and workflows.

Required dependencies are enforced at module enablement and route/runtime resolution.

---

## 4.5 Optional Module Integration

An optional integration means:

```txt
This module can run alone, but it can react to or enrich another module when both are enabled.
```

Example:

```txt
Purchasing can run without Inventory.
Inventory can run without Purchasing.

But when both are enabled:
A confirmed goods receipt in Purchasing may create a stock movement in Inventory.
```

This is not a hard dependency. It is an optional integration, usually implemented through events.

Optional integrations must not block enablement.

---

## 4.6 Platform Service Dependency

A module may depend on a Platform Service only after that service exists and has been promoted under the Three Independent Use Cases Rule.

Examples of future Platform Services:

```txt
Approval Engine
Notification Service
Attachment Service
Reporting Service
Search Service
Workflow Engine
Background Jobs
```

Before promotion, the capability should remain inside the module that needs it.

Example:

```txt
Only Leave needs approvals.
→ Keep simple leave approval logic inside Leave.

Leave + Purchasing + Expenses need approvals.
→ Promote Approval Engine to Platform Service.
```

---

## 4.7 External Integration Dependency

External systems such as payment gateways, SMS providers, accounting software, or payroll systems are not module dependencies.

They are integration dependencies and should be handled through:

```txt
Platform integration services
Module settings
Secrets management
Feature flags
Future connector architecture
```

Do not model an external vendor as a OneDayOS module dependency unless it is actually a OneDayOS module.

---

# 5. Dependency Classification Table

| Scenario | Classification | Example | Rule |
|---|---|---|---|
| Module uses authentication | Kernel dependency | All modules | Implicit |
| Module uses `Product` | Business Object usage | Inventory, Purchasing | Not module dependency |
| Module reacts when another module emits event | Optional integration | Inventory reacts to Purchasing receipt | No direct import |
| Module cannot function without another module | Required module dependency | Forecasting requires Inventory | Enforced at enablement |
| Module needs approvals but only for itself | Local module capability | Leave approvals | Keep inside module |
| Three modules need same approval lifecycle | Platform Service dependency | Leave, Purchasing, Expenses | Promote after review |
| Module sends SMS through provider | External integration | Notifications via SMS | Not module dependency |

---

# 6. Manifest Contract

Module dependencies are declared in the module manifest.

The MVP manifest should support both required dependencies and optional integrations.

Recommended shape:

```ts
export type ModuleDependency = {
  moduleId: string
  type: 'required' | 'optional'
  reason: string
}

export type ModuleManifest = {
  id: string
  label: string
  version: string

  compatibility: {
    platform: {
      min: string
      maxExclusive?: string
    }
    sdk: {
      min: string
      maxExclusive?: string
    }
    manifest: {
      min: string
      maxExclusive?: string
    }
  }

  dependencies: ModuleDependency[]

  businessObjects: Array<{
    object: 'employee' | 'product' | 'product_category' | 'customer' | 'supplier' | 'warehouse'
    usage: 'read' | 'reference' | 'extend' | 'mutate'
    reason: string
  }>

  permissions: PermissionDefinition[]
  navItems: NavItem[]

  events: {
    emits: EventDefinition[]
    listens: EventSubscriptionDefinition[]
  }
}
```

For MVP, this may be simplified internally, but the meaning must remain stable.

---

# 7. Required Dependency Rules

## 7.1 Required Dependencies Must Exist

If a manifest declares:

```ts
dependencies: [
  {
    moduleId: 'inventory',
    type: 'required',
    reason: 'Forecasting requires inventory stock history.',
  },
]
```

then `inventory` must exist in the registry.

If the dependency does not exist, the module registry must treat the manifest as invalid.

---

## 7.2 Required Dependencies Must Be Enabled First

A required dependency must be enabled for the organization before the dependent module can be enabled.

Example:

```txt
Cannot enable advanced-inventory-forecasting unless inventory is enabled.
```

The API should return:

```json
{
  "data": null,
  "error": {
    "code": "MODULE_DEPENDENCY_MISSING",
    "message": "This module requires Inventory to be enabled first.",
    "details": {
      "moduleId": "advanced-inventory-forecasting",
      "missingDependency": "inventory"
    }
  }
}
```

---

## 7.3 No Automatic Cascade Enablement in MVP

For MVP, OneDayOS should not automatically enable dependency modules.

Bad MVP behavior:

```txt
Enable Forecasting
→ silently auto-enable Inventory
```

Correct MVP behavior:

```txt
Enable Forecasting
→ return missing dependency error
→ user/admin intentionally enables Inventory first
```

Reason:

```txt
Module enablement may affect pricing, permissions, navigation, setup data, and client expectations.
Silent cascade enablement creates commercial and security ambiguity.
```

Future admin UI may offer a confirmation flow:

```txt
This module requires Inventory.
Enable Inventory too?
```

But that is not MVP behavior.

---

## 7.4 Required Dependencies Must Stay Enabled

If module `A` requires module `B`, and both are enabled for an organization, OneDayOS must not allow `B` to be disabled while `A` remains enabled.

Example:

```txt
Forecasting requires Inventory.
Inventory cannot be disabled until Forecasting is disabled first.
```

The API should return:

```json
{
  "data": null,
  "error": {
    "code": "MODULE_DEPENDENCY_BLOCKS_DISABLE",
    "message": "Inventory cannot be disabled because Forecasting depends on it.",
    "details": {
      "moduleId": "inventory",
      "dependentModules": ["advanced-inventory-forecasting"]
    }
  }
}
```

---

## 7.5 Dependency Disable Does Not Delete Data

Disabling a module must not delete that module's data.

Module disablement means:

```txt
Routes inaccessible
Navigation hidden
APIs blocked
Scheduled jobs/listeners disabled
Data retained
Settings retained unless explicitly reset
```

This is critical because clients may temporarily pause modules, downgrade subscriptions, or re-enable modules later.

---

# 8. Optional Integration Rules

Optional integrations are the preferred way for modules to collaborate.

## 8.1 Optional Integrations Do Not Block Enablement

If `inventory` optionally listens to `purchasing.goods_receipt.confirmed`, this does not mean Inventory requires Purchasing.

Valid configurations:

```txt
Inventory enabled, Purchasing disabled
Purchasing enabled, Inventory disabled
Both enabled
Neither enabled
```

The integration activates only when both relevant modules are enabled.

---

## 8.2 Optional Integrations Should Use Events

Correct pattern:

```txt
Purchasing confirms goods receipt.
Purchasing emits purchasing.goods_receipt.confirmed.
Inventory listener receives event.
Inventory checks Inventory is enabled for ctx.org.
Inventory creates stock movement.
```

Forbidden pattern:

```ts
// Forbidden
import { InventoryService } from '@/modules/inventory/service'

await InventoryService.createStockMovement(ctx, input)
```

---

## 8.3 Listener Module Must Be Enabled

A module event listener must not process events for an organization where the listening module is disabled.

Example:

```txt
Purchasing emits purchasing.goods_receipt.confirmed.
Inventory is disabled for Org A.
Inventory listener must ignore the event for Org A.
```

The event bus or listener wrapper should enforce this.

Recommended helper:

```ts
sdk.events.onModuleEvent({
  moduleId: 'inventory',
  event: 'purchasing.goods_receipt.confirmed',
  schema: PurchasingGoodsReceiptConfirmedPayloadSchema,
  handler: async (ctx, envelope) => {
    await InventoryService.createStockMovementFromGoodsReceipt(ctx, envelope.payload)
  },
})
```

The SDK wrapper should check that `inventory` is enabled for `ctx.org.id` before invoking the handler.

---

## 8.4 Optional Integration Must Not Be Required for Correctness Unless Transactional

Events are asynchronous or eventually replaceable with a queue. Therefore, events should not be used for logic that must happen inside the original transaction to keep data correct.

Bad example:

```txt
Create invoice.
Emit event.
Listener creates required invoice line items.
```

If invoice line items are required for invoice correctness, they belong in the invoice service transaction.

Good example:

```txt
Create invoice.
Emit invoice.created.
Search listener indexes invoice later.
Notification listener sends notification later.
```

For cross-module integrations, use this rule:

```txt
If the source module remains correct without the target module reaction,
the integration may be event-driven.

If the source module is invalid without the target reaction,
then the capability is probably not an optional integration.
It may need a required dependency, Platform Service, or transaction-level design.
```

---

# 9. Cross-Module Data Rules

## 9.1 No Casual Foreign Keys to Other Module-Owned Tables

A module should not casually create foreign keys to another module's owned tables.

Forbidden by default:

```prisma
model PurchasingRecord {
  id String @id @default(cuid())
  inventoryStockMovementId String
  inventoryStockMovement InventoryStockMovement @relation(fields: [inventoryStockMovementId], references: [id])
}
```

This creates tight database coupling between modules.

Preferred alternatives:

```txt
1. Reference shared Business Object instead.
2. Store a non-FK source reference if audit/linking is enough.
3. Use events.
4. Promote shared behavior into Platform Service if repeated.
5. Use ADR-approved hard dependency only when unavoidable.
```

---

## 9.2 Source References Are Allowed for Traceability

A module may store traceability references without enforcing cross-module foreign keys.

Example:

```prisma
model InventoryStockMovement {
  id           String @id @default(cuid())
  orgId        String
  productId    String
  warehouseId  String
  quantity     Decimal

  sourceModule String?
  sourceEntity String?
  sourceId     String?

  createdAt DateTime @default(now())
  deletedAt DateTime?
  deletedBy String?

  @@index([orgId, sourceModule, sourceEntity, sourceId])
}
```

This allows Inventory to say:

```txt
This stock movement came from Purchasing goods receipt abc123.
```

without importing Purchasing or enforcing a hard database dependency.

---

## 9.3 Shared Identity Belongs in Business Objects

If multiple modules need to identify the same real-world thing, that thing should probably be a Business Object.

Examples:

```txt
Product
Customer
Supplier
Employee
Warehouse
```

Do not create these:

```txt
InventoryProduct
PurchasingProduct
CRMCustomer
LeaveEmployee
AssetEmployee
```

Use core Business Objects plus module extension tables.

---

## 9.4 Platform Services Own Shared Workflows

If multiple modules need the same workflow behavior, that behavior should eventually become a Platform Service.

Examples:

```txt
Approvals
Notifications
Comments
Attachments
Activity feed
Reporting
Search
```

Do not make one business module the owner of a generic workflow.

Bad:

```txt
Leave owns approvals, Purchasing imports Leave approval code.
```

Good:

```txt
Leave has local approval logic first.
Purchasing later develops similar approval logic.
Expenses later needs the same pattern.
Then Approval Engine is promoted to Platform Service.
```

---

# 10. Dependency Graph Validation

The module registry must validate the dependency graph at startup or during a platform check command.

## 10.1 Validation Rules

The registry must reject or report:

```txt
Missing dependency module ID
Self-dependency
Circular dependency
Duplicate dependencies
Unknown dependency type
Required dependency on disabled module during enablement
Attempted disable of module required by enabled module
```

---

## 10.2 Missing Dependency

Invalid:

```ts
{
  id: 'forecasting',
  dependencies: [
    { moduleId: 'inventory-typo', type: 'required', reason: 'Needs inventory.' },
  ],
}
```

Result:

```txt
Registry validation fails.
```

---

## 10.3 Self-Dependency

Invalid:

```ts
{
  id: 'inventory',
  dependencies: [
    { moduleId: 'inventory', type: 'required', reason: 'Bad manifest.' },
  ],
}
```

Result:

```txt
Registry validation fails.
```

---

## 10.4 Circular Dependency

Invalid:

```txt
A requires B
B requires C
C requires A
```

Result:

```txt
Registry validation fails.
```

Circular dependencies indicate bad architecture. Usually the correct fix is one of:

```txt
Use Business Objects
Use events
Extract a Platform Service
Remove the dependency
Split the module differently
```

---

## 10.5 Topological Sort for Provisioning

Provisioning hooks should run in dependency order.

Example:

```txt
inventory
advanced-inventory-forecasting
```

If `advanced-inventory-forecasting` requires `inventory`, Inventory provisioning runs first.

For MVP, this matters only for module enablement/provisioning scripts, not runtime imports.

---

# 11. Module Enablement Algorithm

When enabling a module for an organization, the platform should follow this logic:

```txt
1. Authenticate user.
2. Resolve verified PlatformContext.
3. Require permission: kernel.module.enable or equivalent admin permission.
4. Validate target module exists in registry.
5. Validate organization subscription allows another enabled module.
6. Validate required dependencies exist.
7. Validate required dependencies are already enabled for this organization.
8. Create or update OrgModule row.
9. Run module provisioning hook if defined.
10. Emit kernel.module.enabled event.
11. Return { data, error } JSON.
```

Suggested service API:

```ts
await sdk.modules.enable(ctx, {
  moduleId: 'inventory',
})
```

The service must receive verified `PlatformContext`.

Forbidden:

```ts
await enableModule(orgId, moduleId)
```

---

# 12. Module Disablement Algorithm

When disabling a module for an organization, the platform should follow this logic:

```txt
1. Authenticate user.
2. Resolve verified PlatformContext.
3. Require permission: kernel.module.disable or equivalent admin permission.
4. Validate target module exists.
5. Find enabled modules that require this module.
6. If dependents exist, block disable.
7. Mark OrgModule.isEnabled = false.
8. Disable scheduled jobs/listeners for that org/module if applicable.
9. Keep data.
10. Emit kernel.module.disabled event.
11. Return { data, error } JSON.
```

Disablement must not:

```txt
Delete module data
Delete Business Objects
Delete roles/permissions automatically unless explicitly designed
Delete settings automatically unless explicitly designed
Break other enabled modules
```

---

# 13. Runtime Guard Rules

Module routes and APIs must validate module availability at runtime.

## 13.1 Page Routes

A module page route must require:

```txt
Authentication
Tenant membership
Module enabled
Required dependencies enabled
Permission
```

Example:

```ts
const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')

await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_movement',
  action: 'read',
})
```

`requirePageModuleContext` should also verify that required dependencies for `inventory` are enabled.

---

## 13.2 API Routes

A module API route must require:

```txt
Authentication
Tenant membership
Module enabled
Required dependencies enabled
Permission
Validation
```

Example:

```ts
export const POST = sdk.api.handle(async (req, { params }) => {
  const { orgSlug } = await params

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
```

---

## 13.3 Service Methods

Public module service methods should assume they may be called from multiple routes or event handlers.

Therefore, they should receive verified `PlatformContext` and enforce the required business permission where appropriate.

Example:

```ts
export class InventoryService {
  static async createStockAdjustment(ctx: PlatformContext, input: CreateStockAdjustmentInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    })

    const db = sdk.getDb(ctx)

    return db.inventoryStockAdjustment.create({
      data: {
        orgId: ctx.org.id,
        ...input,
      },
    })
  }
}
```

Forbidden:

```ts
static async createStockAdjustment(orgId: string, input: unknown) {}
```

---

# 14. Permissions and Dependencies

## 14.1 Module Enablement Is Not Permission

If Inventory is enabled for an organization, that does not mean every user can access Inventory.

A user needs both:

```txt
OrgModule inventory enabled
+
User role permission inventory.*.* or specific inventory permission
```

---

## 14.2 Dependency Enablement Is Not Permission

If Forecasting requires Inventory, and Inventory is enabled, that does not mean a Forecasting user can navigate to Inventory.

Example:

```txt
User has forecasting.forecast.read.
User does not have inventory.stock_level.read.

Forecasting can use Inventory data through approved service/query patterns,
but user cannot browse Inventory pages unless granted Inventory permission.
```

This requires careful design.

For MVP, avoid building modules that require hidden cross-module reads unless absolutely necessary.

---

## 14.3 Event Listener Side Effects

Event listeners may perform side effects in a target module when:

```txt
The source action was authorized.
The target module is enabled.
The listener is registered by the target module.
The side effect is part of a documented integration.
The action is auditable to the original actor.
```

Example:

```txt
A user with purchasing.goods_receipt.confirm confirms a receipt.
Purchasing emits purchasing.goods_receipt.confirmed.
Inventory listener creates inventory.stock_movement record.
Audit actor remains the original user.
```

The Inventory listener does not necessarily require the user to also have manual `inventory.stock_movement.create`, because the user is not manually creating a stock movement. They are performing an authorized Purchasing workflow whose documented integration creates stock movement.

However, this must be explicitly documented in the module spec.

If this ambiguity becomes common, promote an Integration Policy or Workflow Engine later.

---

# 15. Business Object Usage Is Not Module Dependency

This rule is critical enough to repeat.

## 15.1 Inventory and Product

Incorrect:

```txt
Product belongs to Inventory.
Purchasing depends on Inventory because it needs Product.
```

Correct:

```txt
Product is a Business Object.
Inventory uses Product.
Purchasing uses Product.
Neither owns Product.
Purchasing does not depend on Inventory merely because both use Product.
```

---

## 15.2 Leave and Employee

Incorrect:

```txt
Employee belongs to HR.
Leave depends on HR because it needs Employee.
```

Correct:

```txt
Employee is a Business Object.
Leave uses Employee.
Assets uses Employee.
Projects uses Employee.
HR may extend Employee.
No module owns Employee.
```

---

## 15.3 CRM and Customer

Incorrect:

```txt
Customer belongs to CRM.
Reservations depends on CRM because it needs Customer.
```

Correct:

```txt
Customer is a Business Object.
CRM uses Customer.
Reservations uses Customer.
Billing uses Customer.
Projects uses Customer.
No module owns Customer.
```

---

# 16. Dependency Examples

## 16.1 Inventory Module

Inventory uses:

```txt
Product
Warehouse
Supplier, possibly later
```

These are Business Objects, not module dependencies.

Inventory required dependencies:

```ts
[]
```

Inventory optional integrations:

```txt
Purchasing goods receipt confirmed → Inventory stock movement created
Sales order fulfilled → Inventory stock movement created
```

These should be event-driven and optional.

---

## 16.2 Purchasing Module

Purchasing uses:

```txt
Supplier
Product
Warehouse, for receiving destination
Employee, for requester/approver if needed
```

These are Business Objects, not module dependencies.

Purchasing required dependencies:

```ts
[]
```

Purchasing optional integrations:

```txt
Inventory enabled → receiving may trigger stock movement
Approval Engine enabled later → purchase requests may use platform approvals
Notification Service enabled later → approvers may receive notifications
```

---

## 16.3 Leave Module

Leave uses:

```txt
Employee
Department
Branch
```

Employee is a Business Object. Department and Branch are Kernel org-structure primitives.

Leave required dependencies:

```ts
[]
```

Leave may have local approval logic first. It should not depend on a Platform Approval Engine until that service is actually promoted.

---

## 16.4 Advanced Inventory Forecasting Module

Forecasting uses inventory history and cannot function without Inventory.

Required dependencies:

```ts
[
  {
    moduleId: 'inventory',
    type: 'required',
    reason: 'Forecasting requires inventory stock movement history.',
  },
]
```

This is a valid required dependency.

---

## 16.5 CRM Module

CRM uses:

```txt
Customer
Employee, for owner/assignee if needed
```

These are not module dependencies.

CRM required dependencies:

```ts
[]
```

CRM optional integrations:

```txt
Projects enabled → won deal may create project draft
Billing enabled later → won deal may create billing customer/invoice draft
```

These are event-driven integrations.

---

# 17. Anti-Patterns

## 17.1 Dependency as Import Permission

Bad:

```txt
Purchasing depends on Inventory, therefore Purchasing imports InventoryService.
```

Correct:

```txt
Purchasing declares optional integration with Inventory and communicates through events.
```

---

## 17.2 Dependency to Reuse UI

Bad:

```txt
CRM depends on Inventory because Inventory has a nice table component.
```

Correct:

```txt
Move reusable UI to shared components/design system.
```

---

## 17.3 Dependency to Reuse Business Object

Bad:

```txt
Leave depends on HR because HR has Employee.
```

Correct:

```txt
Employee is a Business Object.
Both modules use objects.employee.* services.
```

---

## 17.4 Dependency to Avoid Platform Service Promotion

Bad:

```txt
Expenses imports Purchasing approval logic instead of promoting Approval Engine.
```

Correct:

```txt
If the same approval lifecycle appears in three independent use cases,
promote to Platform Approval Service.
```

---

## 17.5 Hidden Client-Specific Dependency

Bad:

```txt
Client A's Inventory module silently assumes Client A's Purchasing module exists.
```

Correct:

```txt
All dependencies are declared in the manifest and validated by the platform.
```

---

## 17.6 Cross-Tenant Dependency Lookup

Bad:

```ts
const orgId = body.orgId
await sdk.modules.isEnabled(orgId, 'inventory')
```

Correct:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'purchasing')
await sdk.modules.requireEnabled(ctx, 'inventory')
```

Client-supplied `orgId` is always forbidden.

---

# 18. API Behavior

## 18.1 Enable Module API

Recommended path:

```txt
POST /api/orgs/[orgSlug]/kernel/modules/[moduleId]/enable
```

Required behavior:

```txt
401 if unauthenticated
404 if org does not exist or user is not a member
403 if user lacks module enable permission
404 if module ID is unknown
409 if required dependency is missing
409 if subscription limit would be exceeded
200 or 201 on success
```

---

## 18.2 Disable Module API

Recommended path:

```txt
POST /api/orgs/[orgSlug]/kernel/modules/[moduleId]/disable
```

Required behavior:

```txt
401 if unauthenticated
404 if org does not exist or user is not a member
403 if user lacks module disable permission
404 if module ID is unknown
409 if enabled dependent modules require this module
200 on success
```

---

## 18.3 List Module Dependencies API

Future admin UI may need:

```txt
GET /api/orgs/[orgSlug]/kernel/modules/[moduleId]/dependencies
```

Response:

```json
{
  "data": {
    "moduleId": "advanced-inventory-forecasting",
    "required": [
      {
        "moduleId": "inventory",
        "label": "Inventory",
        "enabled": true,
        "reason": "Forecasting requires inventory stock movement history."
      }
    ],
    "optional": []
  },
  "error": null
}
```

This is not required for first MVP implementation, but the service layer should make it possible.

---

# 19. Error Codes

Dependency-related API errors should use the Kernel API contract.

Recommended codes:

```txt
MODULE_NOT_FOUND
MODULE_NOT_ENABLED
MODULE_DEPENDENCY_MISSING
MODULE_DEPENDENCY_CYCLE
MODULE_DEPENDENCY_INVALID
MODULE_DEPENDENCY_BLOCKS_DISABLE
MODULE_SUBSCRIPTION_LIMIT_EXCEEDED
MODULE_PROVISIONING_FAILED
```

These errors must return JSON using the standard shape:

```json
{
  "data": null,
  "error": {
    "code": "MODULE_DEPENDENCY_MISSING",
    "message": "This module requires Inventory to be enabled first.",
    "details": {}
  }
}
```

No redirects. No HTML errors. No unhandled throws to clients.

---

# 20. Testing Requirements

Dependency behavior must be tested because broken dependency enforcement can create broken modules, hidden 500s, or security issues.

## 20.1 Registry Validation Tests

Required tests:

```txt
Registry accepts module with no dependencies.
Registry rejects missing required dependency.
Registry rejects self-dependency.
Registry rejects dependency cycle.
Registry rejects unknown dependency type.
Registry ignores duplicate dependency or reports validation error.
```

---

## 20.2 Enablement Tests

Required tests:

```txt
Can enable module with no dependencies.
Cannot enable module with missing required dependency.
Can enable dependent module after required dependency is enabled.
Optional dependencies do not block enablement.
Subscription maxModules is enforced.
Client-supplied orgId is rejected.
Cross-tenant enablement is impossible.
```

---

## 20.3 Disablement Tests

Required tests:

```txt
Can disable module with no enabled dependents.
Cannot disable module required by another enabled module.
Can disable dependent module first, then dependency module.
Disablement does not delete module data.
Disablement hides navigation.
Disabled module API returns safe error.
```

---

## 20.4 Runtime Guard Tests

Required tests:

```txt
Disabled module page is inaccessible.
Disabled module API returns JSON error.
Enabled module with missing required dependency is inaccessible.
Unauthorized user cannot access enabled module.
Enabled module plus permission allows access.
Wrong-org user gets safe 404.
```

---

## 20.5 Event Integration Tests

Required tests:

```txt
Optional listener runs when listening module is enabled.
Optional listener does not run when listening module is disabled.
Listener failure does not break original mutation.
Listener receives verified PlatformContext.
Listener payload does not include orgId.
```

---

## 20.6 Architecture Tests

Required checks:

```txt
modules/* must not import @/kernel/*
modules/* must not import another module/*
modules/* must not import raw Prisma
modules/* must not call sdk.getDb(orgId)
modules/* must not reference request body orgId
manifests must not contain wildcard permission definitions
manifests must not contain executable seed functions
```

These should be enforced through `npm run check:architecture` eventually.

---

# 21. Generator Requirements

The module generator must be conservative.

By default, generated modules should have:

```ts
dependencies: []
```

The generator must not invent dependencies.

If the operator passes dependencies explicitly:

```bash
npm run module:create advanced-inventory-forecasting --requires inventory
```

then the generated manifest may include:

```ts
dependencies: [
  {
    moduleId: 'inventory',
    type: 'required',
    reason: 'TODO: explain why this dependency is required.',
  },
]
```

The generated TODO must block production readiness until replaced with a real reason.

Generated tests must include:

```txt
missing dependency enablement denial
optional dependency non-blocking behavior, if optional dependencies are generated
module-disabled route/API behavior
permission-denial behavior
cross-tenant denial behavior
```

---

# 22. Claude Implementation Rules

When Claude implements module dependencies, it must follow these rules:

```txt
1. Do not add direct imports between modules.
2. Do not use module dependencies as permission to call another module service.
3. Do not create required dependencies unless the manual or module spec says so.
4. Do not treat Business Object usage as module dependency.
5. Do not auto-enable dependencies in MVP.
6. Do not delete data when disabling modules.
7. Do not accept client-supplied orgId.
8. Do not bypass PlatformContext.
9. Do not add FastAPI or a separate dependency service.
10. Do not implement remote plugin loading.
11. Do not implement marketplace dependency resolution.
12. Do not implement per-org module version pinning.
13. Do not introduce generic workflow/platform services just to satisfy one module.
14. Stop if a dependency requires cross-module data writes not covered by events, Business Objects, or approved Platform Services.
```

Claude should ask for an ADR or module spec amendment if it encounters a module that seems to require direct module access.

---

# 23. Implementation Sketch

This section is guidance, not final code.

## 23.1 Dependency Validator

```ts
type DependencyValidationResult =
  | { ok: true }
  | { ok: false; errors: ModuleDependencyError[] }

function validateModuleDependencyGraph(manifests: ModuleManifest[]): DependencyValidationResult {
  // 1. Build moduleId set.
  // 2. Validate each dependency target exists.
  // 3. Validate no self-dependencies.
  // 4. Validate known dependency types.
  // 5. Detect cycles among required dependencies.
  // 6. Return structured errors.
}
```

---

## 23.2 Enable Module Service

```ts
async function enableModule(ctx: PlatformContext, moduleId: string) {
  await sdk.permissions.require(ctx, {
    module: 'kernel',
    resource: 'module',
    action: 'enable',
  })

  const manifest = sdk.modules.getManifest(moduleId)
  if (!manifest) throw sdk.errors.notFound('MODULE_NOT_FOUND')

  const missing = await sdk.modules.getMissingRequiredDependencies(ctx, moduleId)
  if (missing.length > 0) {
    throw sdk.errors.conflict('MODULE_DEPENDENCY_MISSING', {
      moduleId,
      missingDependencies: missing,
    })
  }

  await sdk.modules.assertSubscriptionAllowsEnable(ctx, moduleId)

  const db = sdk.getDb(ctx)

  await db.orgModule.upsert({
    where: {
      orgId_moduleId: {
        orgId: ctx.org.id,
        moduleId,
      },
    },
    update: {
      isEnabled: true,
      enabledAt: new Date(),
    },
    create: {
      orgId: ctx.org.id,
      moduleId,
      isEnabled: true,
    },
  })

  await sdk.events.emit(ctx, 'kernel.module.enabled', {
    moduleId,
  })
}
```

---

## 23.3 Disable Module Service

```ts
async function disableModule(ctx: PlatformContext, moduleId: string) {
  await sdk.permissions.require(ctx, {
    module: 'kernel',
    resource: 'module',
    action: 'disable',
  })

  const dependents = await sdk.modules.getEnabledDependents(ctx, moduleId)

  if (dependents.length > 0) {
    throw sdk.errors.conflict('MODULE_DEPENDENCY_BLOCKS_DISABLE', {
      moduleId,
      dependentModules: dependents.map((m) => m.id),
    })
  }

  const db = sdk.getDb(ctx)

  await db.orgModule.update({
    where: {
      orgId_moduleId: {
        orgId: ctx.org.id,
        moduleId,
      },
    },
    data: {
      isEnabled: false,
    },
  })

  await sdk.events.emit(ctx, 'kernel.module.disabled', {
    moduleId,
  })
}
```

---

# 24. Production Readiness Checklist

Before module dependencies are production-ready:

```txt
[ ] Dependency type is represented in manifest schema.
[ ] Registry validates missing dependencies.
[ ] Registry validates self-dependencies.
[ ] Registry validates circular dependencies.
[ ] Module enablement checks required dependencies.
[ ] Module disablement blocks disabling required dependency modules.
[ ] Optional integrations do not block enablement.
[ ] Runtime module context checks required dependencies.
[ ] Navigation hides disabled modules.
[ ] APIs return JSON errors, never redirects.
[ ] Client-supplied orgId is rejected.
[ ] Services receive PlatformContext.
[ ] Generated modules default to no dependencies.
[ ] Generated modules include dependency tests when dependencies exist.
[ ] Architecture check blocks direct module imports.
[ ] No FastAPI dependency runtime exists in core platform.
```

---

# 25. Acceptance Criteria

This document is accepted when:

```txt
[ ] Required dependency behavior is clearly defined.
[ ] Optional integration behavior is clearly defined.
[ ] Business Object usage is clearly separated from module dependency.
[ ] Module enablement and disablement behavior is defined.
[ ] Direct module imports remain forbidden.
[ ] Cross-module data coupling rules are defined.
[ ] Event-based integration rules are defined.
[ ] Permission and dependency interaction is defined.
[ ] Testing requirements are implementation-grade.
[ ] Claude implementation rules are explicit.
```

---

# 26. Architectural Challenge

Do not overuse required module dependencies.

Most modules should be able to stand alone because OneDayOS sells modules in flexible combinations. If every module starts requiring every other module, the platform becomes a monolith with feature flags instead of a modular Business Operating System.

Default posture:

```txt
Use Business Objects for shared identity.
Use events for optional reactions.
Use Platform Services for repeated cross-cutting workflows.
Use required dependencies only when the dependent module has no meaningful independent existence.
```

Required dependencies are sometimes correct, but they should be rare, explicit, tested, and justified.

---

# 27. Next Recommended Document

After this document is reviewed and approved, proceed to:

```txt
08-module-system/08-module-versioning.md
```

Reason:

Module dependencies and module versioning are connected. Once dependencies are declared, OneDayOS needs rules for compatibility windows, module upgrades, manifest changes, and future marketplace readiness.
