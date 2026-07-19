# OneDayOS Engineering Manual — 08 Module System / 04 Module Permissions

**Document ID:** `08-module-system/04-module-permissions.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Architecture  
**Last Updated:** July 2026  
**Implementation Allowed:** No, not until marked `Frozen`  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/02-module-loader-registry.md`
- `08-module-system/03-module-folder-contract.md`

---

## 1. Purpose

This document defines how business modules declare, use, test, and enforce permissions in OneDayOS.

Module permissions are not sidebar labels. They are part of the security boundary of the platform.

The previous MVP proved that merely having a permission system is not enough. A `can()` helper that exists but is not called does not protect tenant data. A generated route that checks only authentication is not production-safe. A UI button hidden by permissions is not security. The restarted build must make permission enforcement part of every module API, every module service, every generated scaffold, and every test suite.

This document exists so Claude Code does not invent permission behavior per module.

---

## 2. Core Rule

Every module operation must pass four gates before it touches tenant data:

```txt
1. Authentication
2. Tenant membership
3. Module enablement
4. Permission
```

In code, the safe pattern is:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})

const data = await InventoryService.createStockAdjustment(ctx, input)
```

For service methods, the rule is even stricter:

```txt
No verified PlatformContext, no business operation.
```

Module services must receive a verified `PlatformContext`, not `orgId`, `userId`, `roleId`, `email`, request bodies, cookies, or route params.

---

## 3. Why Module Permissions Matter

OneDayOS is a shared multi-tenant platform.

A single codebase may serve ten, one hundred, or one thousand client organizations. That means a permission mistake is not isolated to one custom app. It becomes a platform-wide risk.

Permissions protect against:

1. Staff users accessing admin-only module settings.
2. Users creating or deleting records they should only read.
3. Users exporting sensitive data.
4. Users approving their own requests.
5. Users accessing a module that is enabled for the org but not assigned to them.
6. Users calling APIs directly even when UI buttons are hidden.
7. Claude-generated modules shipping auth-only API routes.
8. Cross-tenant access through loose `orgId` handling.
9. Accidental over-granting through wildcard permissions.
10. Future AI actions bypassing normal UI workflows.

The goal is not merely to make permissions configurable. The goal is to make unsafe module code difficult to write.

---

## 4. Scope

This document defines:

1. Module permission concepts.
2. Permission object shape.
3. Permission namespace rules.
4. Module manifest permission declarations.
5. Module `permissions.ts` conventions.
6. Standard action vocabulary.
7. Resource naming rules.
8. Module enablement versus user permission.
9. API enforcement rules.
10. Service enforcement rules.
11. UI visibility rules.
12. Business Object permission interaction.
13. Extension-table permission interaction.
14. Wildcard behavior.
15. Future ABAC boundaries.
16. Permission seeding and provisioning.
17. Generated module requirements.
18. Test requirements.
19. Forbidden patterns.
20. Claude implementation instructions.

---

## 5. Non-Goals

This document does not define:

1. The full RBAC database model. That belongs to `04-kernel/03-users-roles-permissions.md`.
2. The global authorization algorithm. That belongs to `04-kernel/04-authorization-enforcement.md`.
3. Tenant membership resolution. That belongs to `04-kernel/02-organizations-tenancy.md`.
4. API response shapes. That belongs to `04-kernel/08-kernel-api-contracts.md`.
5. The role-management UI.
6. Approval workflow semantics.
7. Field-level permissions.
8. Row-level branch/department scoping.
9. ABAC conditions evaluation.
10. AI action authorization beyond using the same SDK permission helpers.
11. FastAPI authorization behavior. FastAPI is excluded from the core platform.

---

## 6. Mental Model

A module permission answers this question:

> Is this verified user, inside this verified organization, allowed to perform this action on this module resource?

The answer depends on:

```txt
PlatformContext
  ↓
Organization membership
  ↓
Module enablement
  ↓
User roles in this organization
  ↓
Role permissions in this organization
  ↓
Permission requirement for the operation
```

The permission system does not determine tenant membership. Tenant membership must already be verified before permission matching begins.

The permission system does not determine whether a module exists. The module registry determines that.

The permission system does not determine whether a module is enabled. `OrgModule` determines that.

The permission system determines whether the user may perform the requested operation after the previous gates pass.

---

## 7. Permission Shape

The canonical permission requirement shape is:

```ts
type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Example:

```ts
{
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
}
```

A permission may also be displayed as a string for logs, docs, UI, or tests:

```txt
inventory.stock_adjustment.create
```

But the database and SDK should treat permissions as structured objects:

```txt
module   = inventory
resource = stock_adjustment
action   = create
```

This prevents string parsing from becoming a security boundary.

---

## 8. Database Permission Grant Shape

Role permission grants are stored using the Kernel RBAC model:

```prisma
model Permission {
  id         String  @id @default(cuid())
  orgId      String
  roleId     String
  module     String
  resource   String
  action     String
  conditions Json?
}
```

Important constraints:

```txt
orgId is required.
roleId is required.
module is required.
resource is required.
action is required.
conditions is nullable but denied in MVP if non-null.
```

`resource` must not be nullable.

Use `'*'` for wildcard resource grants instead of `null`.

Reason:

```txt
Nullable fields weaken uniqueness behavior in PostgreSQL.
Explicit wildcard values are clearer, testable, and easier to reason about.
```

Recommended unique constraint:

```prisma
@@unique([orgId, roleId, module, resource, action])
```

---

## 9. Permission Namespace Rules

Every permission belongs to a namespace.

The `module` field is the namespace.

### 9.1 Kernel Permissions

Kernel permissions use:

```txt
module = kernel
```

Examples:

```txt
kernel.user.read
kernel.user.create
kernel.role.update
kernel.setting.configure
kernel.subscription.read
```

Kernel permissions are not business module permissions.

### 9.2 Business Object Permissions

Business Object permissions use:

```txt
module = objects
```

Examples:

```txt
objects.employee.read
objects.employee.create
objects.product.update
objects.customer.delete
objects.supplier.restore
objects.warehouse.deactivate
```

Do not put Business Object permissions under module namespaces.

Wrong:

```txt
inventory.product.create
crm.customer.update
hr.employee.read
```

Correct:

```txt
objects.product.create
objects.customer.update
objects.employee.read
```

### 9.3 Module Permissions

Business module permissions use the module ID as namespace:

```txt
module = inventory
module = leave
module = crm
module = purchasing
module = expenses
module = assets
```

Examples:

```txt
inventory.stock_movement.read
inventory.stock_adjustment.create
leave.leave_request.approve
crm.opportunity.update
purchasing.purchase_request.create
expenses.expense_claim.export
```

### 9.4 Platform Service Permissions

Future Platform Services may use their service namespace:

```txt
approvals.approval_request.approve
notifications.notification.read
reports.report.export
search.index.manage
```

Do not create these early unless the service has passed the Three Independent Use Cases Rule.

---

## 10. Standard Action Vocabulary

OneDayOS permissions should use a controlled action vocabulary.

MVP standard actions:

```txt
read
create
update
delete
restore
export
import
configure
approve
reject
```

### 10.1 `read`

Allows viewing or listing a resource.

Examples:

```txt
inventory.stock_balance.read
crm.opportunity.read
objects.product.read
```

### 10.2 `create`

Allows creating a new resource.

Examples:

```txt
inventory.stock_adjustment.create
leave.leave_request.create
objects.customer.create
```

### 10.3 `update`

Allows editing an existing resource.

Examples:

```txt
inventory.reorder_rule.update
crm.opportunity.update
objects.supplier.update
```

### 10.4 `delete`

Allows soft-deleting a resource.

This does not mean hard delete.

Examples:

```txt
inventory.stock_adjustment.delete
objects.product.delete
```

### 10.5 `restore`

Allows restoring a soft-deleted resource.

Examples:

```txt
objects.product.restore
inventory.reorder_rule.restore
```

### 10.6 `export`

Allows exporting data outside the normal app interface.

Examples:

```txt
inventory.stock_balance.export
crm.customer_pipeline.export
objects.customer.export
```

Exports require explicit permission because they increase data leakage risk.

### 10.7 `import`

Allows bulk importing data.

Examples:

```txt
objects.product.import
objects.customer.import
inventory.stock_balance.import
```

Imports require explicit permission because they can mutate many records at once.

### 10.8 `configure`

Allows changing settings or configuration.

Examples:

```txt
inventory.settings.configure
leave.settings.configure
kernel.role.configure
```

### 10.9 `approve`

Allows approving a workflow record.

Examples:

```txt
leave.leave_request.approve
purchasing.purchase_request.approve
expenses.expense_claim.approve
```

Approval Engine is deferred, but individual modules may have approval-style permissions before the Platform Service exists.

### 10.10 `reject`

Allows rejecting a workflow record.

Examples:

```txt
leave.leave_request.reject
purchasing.purchase_request.reject
expenses.expense_claim.reject
```

---

## 11. Actions to Avoid in MVP

Avoid vague actions:

```txt
manage
admin
all
write
edit
view
```

Use explicit actions instead:

```txt
read
create
update
delete
restore
export
import
configure
approve
reject
```

Do not use both `view` and `read`. Use `read`.

Do not use both `edit` and `update`. Use `update`.

Do not use `manage` unless a future ADR proves it is needed. `manage` hides too many behaviors behind one broad grant.

---

## 12. Resource Naming Rules

Permission resources must be:

1. Lowercase.
2. Snake case.
3. Singular for entity-like resources.
4. Stable after release.
5. Business-readable.
6. Aligned with module-owned entities or actions.

Valid examples:

```txt
stock_movement
stock_adjustment
stock_balance
reorder_rule
leave_request
purchase_request
expense_claim
asset_assignment
visitor_log
incident_report
settings
dashboard
```

Invalid examples:

```txt
StockMovement
stock-movement
inventoryStockMovement
record
thing
data
module
v2_stock_movement
```

Resource names should not include the module ID because the `module` field already does that.

Wrong:

```txt
inventory.inventory_stock_movement.read
```

Correct:

```txt
inventory.stock_movement.read
```

---

## 13. Module Permission Definition File

Every module must define its permission requirements in:

```txt
src/modules/[moduleId]/permissions.ts
```

Example:

```ts
import type { PermissionDefinition } from '@/sdk'

export const inventoryPermissions = {
  dashboard: {
    read: {
      module: 'inventory',
      resource: 'dashboard',
      action: 'read',
      label: 'View inventory dashboard',
      description: 'Can view inventory summary metrics and dashboard widgets.',
    },
  },
  stockBalance: {
    read: {
      module: 'inventory',
      resource: 'stock_balance',
      action: 'read',
      label: 'View stock balances',
      description: 'Can view product quantities by warehouse.',
    },
    export: {
      module: 'inventory',
      resource: 'stock_balance',
      action: 'export',
      label: 'Export stock balances',
      description: 'Can export stock balance reports.',
    },
  },
  stockAdjustment: {
    read: {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'read',
      label: 'View stock adjustments',
      description: 'Can view inventory adjustment records.',
    },
    create: {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
      label: 'Create stock adjustments',
      description: 'Can add stock in/out adjustments.',
    },
    approve: {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'approve',
      label: 'Approve stock adjustments',
      description: 'Can approve stock adjustments before posting.',
    },
    delete: {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'delete',
      label: 'Delete stock adjustments',
      description: 'Can soft-delete stock adjustment records.',
    },
  },
  settings: {
    configure: {
      module: 'inventory',
      resource: 'settings',
      action: 'configure',
      label: 'Configure inventory settings',
      description: 'Can change inventory module settings.',
    },
  },
} satisfies Record<string, Record<string, PermissionDefinition>>

export const inventoryPermissionList = [
  inventoryPermissions.dashboard.read,
  inventoryPermissions.stockBalance.read,
  inventoryPermissions.stockBalance.export,
  inventoryPermissions.stockAdjustment.read,
  inventoryPermissions.stockAdjustment.create,
  inventoryPermissions.stockAdjustment.approve,
  inventoryPermissions.stockAdjustment.delete,
  inventoryPermissions.settings.configure,
] as const
```

`permissions.ts` must be shared-safe.

It must not import:

```txt
@/kernel/*
@/sdk/server
raw Prisma
module services
server-only files
other modules
```

---

## 14. Permission Definition Type

The shared SDK should expose a client-safe permission definition type:

```ts
export type PermissionDefinition = {
  module: string
  resource: string
  action: string
  label: string
  description?: string
  dangerous?: boolean
  requiresConfirmation?: boolean
}
```

Example dangerous permission:

```ts
{
  module: 'objects',
  resource: 'customer',
  action: 'export',
  label: 'Export customers',
  description: 'Can export customer records outside the app.',
  dangerous: true,
  requiresConfirmation: true,
}
```

`dangerous` does not enforce security by itself. It tells the UI and role editor to show additional warnings.

Security still comes from API and service enforcement.

---

## 15. Module Manifest Permission Declarations

Every module manifest must include its available permission definitions.

Example:

```ts
import type { ModuleManifest } from '@/sdk'
import { inventoryPermissionList } from './permissions'

export const inventoryManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '0.1.0',
  permissions: inventoryPermissionList,
  navItems: [
    {
      label: 'Inventory',
      href: 'inventory',
      icon: 'Package',
      requiredPermission: {
        module: 'inventory',
        resource: 'dashboard',
        action: 'read',
      },
    },
  ],
} satisfies ModuleManifest
```

The manifest should declare what permissions exist.

It should not grant permissions to users.

Granting happens through RBAC role records inside the organization.

---

## 16. Manifest Permission Rules

Module manifests must obey these rules:

```txt
Must declare full permission objects.
Must not use action arrays like ['create', 'read'].
Must not declare wildcard permissions.
Must not declare Business Object permissions unless explicitly required as dependencies.
Must not grant permissions.
Must not contain server code.
Must not import Kernel internals.
```

Wrong:

```ts
permissions: ['create', 'read', 'update', 'delete']
```

Correct:

```ts
permissions: [
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
    label: 'Create stock adjustments',
  },
]
```

---

## 17. Available Permissions vs Granted Permissions

There are two different concepts:

```txt
Available permission = the module says this permission exists.
Granted permission = an org role actually has this permission.
```

Available permissions live in code:

```txt
src/modules/inventory/permissions.ts
src/modules/inventory/manifest.ts
```

Granted permissions live in the database:

```txt
Permission records attached to Role records
```

Enabling a module only makes its available permissions visible to the role editor. It does not automatically grant those permissions to every user.

---

## 18. Module Enablement vs Module Permission

Module enablement and module permission are separate gates.

```txt
OrgModule says whether the organization purchased/enabled the module.
Role Permission says whether this user may use a specific resource/action inside it.
```

Example:

```txt
Client A has Inventory enabled.
User Maria has inventory.stock_balance.read.
Maria can view stock balances.
```

Example:

```txt
Client A has Inventory enabled.
User Juan has no inventory permissions.
Juan cannot see Inventory navigation and cannot call Inventory APIs.
```

Example:

```txt
Client B does not have Inventory enabled.
User Ana has wildcard Admin permission.
Ana still cannot access Inventory because module enablement fails first.
```

Admin wildcard does not bypass module enablement.

---

## 19. Permission Gate Order

Protected module APIs must enforce gates in this order:

```txt
1. Authenticate user.
2. Resolve platform User.
3. Resolve organization by orgSlug.
4. Verify user belongs to organization.
5. Verify organization is active and not suspended for module operations.
6. Verify module exists in registry.
7. Verify module is enabled for organization.
8. Validate request params/body/query.
9. Check permission.
10. Execute service operation.
```

Tenant membership must happen before permission matching.

Module enablement must happen before module permission matching.

Validation should happen before the service operation, but never trust validated `orgId` from the client because `orgId` should not be accepted at all.

---

## 20. API Enforcement Pattern

Module APIs must use tenant-scoped routes:

```txt
/api/orgs/[orgSlug]/[moduleId]/[resource]
/api/orgs/[orgSlug]/[moduleId]/[resource]/[id]
```

Example:

```txt
/api/orgs/acme-corp/inventory/stock-adjustments
/api/orgs/acme-corp/inventory/stock-adjustments/adj_123
```

API route example:

```ts
import { sdk } from '@/sdk/server'
import { inventoryPermissions } from '@/modules/inventory/permissions'
import { createStockAdjustmentSchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'

export const POST = sdk.api.handleOrgModuleRoute(
  async (req, { params }) => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

    const input = await sdk.api.parseJson(req, createStockAdjustmentSchema)

    await sdk.permissions.require(ctx, inventoryPermissions.stockAdjustment.create)

    const data = await InventoryService.createStockAdjustment(ctx, input)

    return sdk.api.created(data)
  }
)
```

The API must not:

```txt
Use requireAuth() if it redirects.
Read orgId from query string.
Read orgId from request body.
Call raw Prisma.
Call service without PlatformContext.
Skip permission checks because the UI hides buttons.
```

---

## 21. Service Enforcement Pattern

Module services must be permission-aware.

There are two acceptable patterns.

### 21.1 Preferred MVP Pattern: Service Enforces Permission

Each public service method calls `sdk.permissions.require()` internally.

Example:

```ts
export class InventoryService {
  static async createStockAdjustment(
    ctx: PlatformContext,
    input: CreateStockAdjustmentInput
  ) {
    await sdk.permissions.require(ctx, inventoryPermissions.stockAdjustment.create)

    const db = sdk.getDb(ctx)

    const adjustment = await db.inventoryStockAdjustment.create({
      data: {
        orgId: ctx.org.id,
        warehouseId: input.warehouseId,
        reason: input.reason,
        createdById: ctx.user.id,
      },
    })

    await sdk.events.emit(ctx, 'inventory.stock_adjustment.created', {
      stockAdjustmentId: adjustment.id,
    })

    return adjustment
  }
}
```

This is safest because it protects against future callers that are not API routes:

```txt
Server actions
Background jobs
Admin tools
Import scripts
AI actions
Other platform services
```

### 21.2 Advanced Future Pattern: Authorized Context

A future optimization may allow:

```ts
type AuthorizedContext<P extends PermissionRequirement> = PlatformContext & {
  authorizedFor: P
}
```

Then an API route could call:

```ts
const authorizedCtx = await sdk.permissions.authorize(
  ctx,
  inventoryPermissions.stockAdjustment.create
)

await InventoryService.createStockAdjustment(authorizedCtx, input)
```

This pattern is deferred.

MVP should use direct `sdk.permissions.require()` inside public service methods for clarity and safety.

---

## 22. Double Enforcement Is Acceptable in MVP

It is acceptable for both API routes and services to call `sdk.permissions.require()`.

This may appear redundant, but it is safer during the restarted build.

Reasons:

1. API checks return early and produce clear HTTP `403` errors.
2. Service checks protect non-API callers.
3. Permission results can be cached in `PlatformContext` later.
4. Redundant checks are cheaper than a cross-tenant or unauthorized mutation.

Do not remove service checks merely because the route checked permissions.

---

## 23. UI Permission Rules

UI permission checks are for usability, not security.

The UI may use permissions to:

1. Hide module navigation.
2. Hide create buttons.
3. Hide edit buttons.
4. Hide delete actions.
5. Disable fields.
6. Show permission-denied empty states.
7. Show upgrade/module-disabled states.
8. Avoid confusing users with actions they cannot perform.

But UI permission checks do not secure data.

All APIs and services must enforce permissions regardless of UI behavior.

---

## 24. Sidebar Visibility

A module appears in the sidebar only if all of the following are true:

```txt
Module is registered in code.
Module is enabled for the organization.
User has the nav item's required permission.
```

Example nav item:

```ts
{
  label: 'Stock Adjustments',
  href: 'inventory/stock-adjustments',
  icon: 'ClipboardList',
  requiredPermission: {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'read',
  },
}
```

A module being enabled does not automatically show every nav item to every user.

---

## 25. Page Route Visibility

Module pages must require a page-level permission.

Example:

```ts
export default async function StockAdjustmentsPage({ params }: PageProps) {
  const { orgSlug } = await params

  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')

  await sdk.permissions.require(ctx, inventoryPermissions.stockAdjustment.read)

  const data = await InventoryService.listStockAdjustments(ctx)

  return <StockAdjustmentList data={data} />
}
```

If the user lacks permission, page behavior should be:

```txt
403-style Permission Denied page for authenticated users inside their own org.
404 for wrong org or disabled module.
```

Do not render sensitive data and then hide controls.

---

## 26. Client Component Permission Props

Client components may receive a small permission snapshot from server components.

Example:

```ts
type StockAdjustmentPagePermissions = {
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canApprove: boolean
}
```

Server component:

```ts
const permissions = await sdk.permissions.evaluateMany(ctx, {
  canCreate: inventoryPermissions.stockAdjustment.create,
  canUpdate: inventoryPermissions.stockAdjustment.update,
  canDelete: inventoryPermissions.stockAdjustment.delete,
  canApprove: inventoryPermissions.stockAdjustment.approve,
})
```

Client component:

```tsx
{permissions.canCreate && <CreateStockAdjustmentButton />}
```

The client must not make final authorization decisions.

---

## 27. Permission-Denied UI States

When a user is authenticated and belongs to the organization but lacks permission, show a clear state.

Example:

```txt
You do not have permission to view stock adjustments.
Ask your administrator for access to Inventory → Stock Adjustments.
```

Do not show:

```txt
Something went wrong.
```

Do not show detailed role internals to normal users.

Admin-facing role UI may show permission IDs.

---

## 28. Business Object Permissions from Modules

Modules often use Business Objects.

Business Object permissions stay in the `objects` namespace.

Example: Inventory product setup may create both:

```txt
Product Business Object
Inventory product extension
```

That operation may require two permissions:

```ts
await sdk.permissions.requireAll(ctx, [
  objectsPermissions.product.create,
  inventoryPermissions.productExtension.create,
])
```

This is correct because it crosses two ownership boundaries:

```txt
objects.product.create
inventory.product_extension.create
```

Do not collapse this into:

```txt
inventory.product.create
```

because Inventory does not own Product.

---

## 29. Extension Table Permissions

Module extension tables use module permissions.

Example:

```txt
InventoryProductExtension
```

Permissions:

```txt
inventory.product_extension.read
inventory.product_extension.create
inventory.product_extension.update
inventory.product_extension.delete
```

The core Product still uses:

```txt
objects.product.read
objects.product.create
objects.product.update
objects.product.delete
```

This separation is important because a user may be allowed to manage inventory-specific product settings without being allowed to edit the shared Product identity, or vice versa.

---

## 30. Composite Permission Requirements

Some operations require multiple permissions.

The SDK should support:

```ts
await sdk.permissions.requireAll(ctx, [
  objectsPermissions.product.read,
  inventoryPermissions.stockBalance.read,
])
```

And eventually:

```ts
await sdk.permissions.requireAny(ctx, [
  inventoryPermissions.stockAdjustment.approve,
  inventoryPermissions.stockAdjustment.update,
])
```

MVP should implement `requireAll` only if needed by generated module patterns. Otherwise, individual sequential `require()` calls are acceptable.

For clarity, prefer explicit sequential calls at first:

```ts
await sdk.permissions.require(ctx, objectsPermissions.product.read)
await sdk.permissions.require(ctx, inventoryPermissions.stockBalance.read)
```

---

## 31. Read Permission Nuance

Read permissions are not always simple.

Examples:

```txt
Viewing the Inventory dashboard may need inventory.dashboard.read.
Viewing stock balances may need inventory.stock_balance.read.
Viewing Product names inside stock balances may also involve objects.product.read.
```

For MVP, avoid overcomplicating joins.

Recommended rule:

```txt
A module page requires the primary module permission for that page.
If the page exposes full CRUD for a Business Object, require the Business Object permission too.
```

Examples:

```txt
Inventory stock balance list
→ inventory.stock_balance.read

Inventory product setup page that edits Product.name/code/unit
→ objects.product.update + inventory.product_extension.update

CRM customer list that edits Customer.name/phone/email
→ objects.customer.update + crm.customer_profile.update, if profile extension exists
```

---

## 32. Settings Permissions

Every module with settings must define:

```txt
[moduleId].settings.configure
```

Example:

```txt
inventory.settings.configure
leave.settings.configure
crm.settings.configure
```

Settings APIs must check this permission.

Wrong:

```txt
Any user with inventory.dashboard.read can configure inventory settings.
```

Correct:

```txt
Only users with inventory.settings.configure can configure inventory settings.
```

---

## 33. Dashboard Permissions

Module dashboards should have explicit read permissions.

Example:

```txt
inventory.dashboard.read
crm.dashboard.read
leave.dashboard.read
```

Do not assume that any permission inside a module grants dashboard access.

A user may be allowed to create leave requests but not view HR dashboard analytics.

---

## 34. Export Permissions

Export permissions must be explicit.

A user who can read a table does not automatically get export access.

Example:

```txt
objects.customer.read     → can view customers in UI
objects.customer.export   → can export customers to CSV/Excel
```

Exports are sensitive because they move data outside the app.

Generated modules must create separate export permissions for export features.

---

## 35. Import Permissions

Import permissions must be explicit.

A user who can create one record does not automatically get bulk import access.

Example:

```txt
objects.product.create    → can create one product
objects.product.import    → can bulk import products
```

Imports are sensitive because they can create or mutate many records at once.

Generated modules must create separate import permissions for import features.

---

## 36. Delete and Restore Permissions

Delete and restore are separate permissions.

Example:

```txt
inventory.reorder_rule.delete
inventory.reorder_rule.restore
```

A user who can delete does not automatically get restore.

A user who can restore does not automatically get delete.

Soft delete is still a destructive operation and must require explicit permission.

Hard delete is forbidden for normal module operations.

---

## 37. Approval Permissions

Approval-style actions are allowed inside modules before the future Approval Engine exists.

Example:

```txt
leave.leave_request.approve
leave.leave_request.reject
purchasing.purchase_request.approve
expenses.expense_claim.reject
```

But do not build a generic Approval Engine until the Three Independent Use Cases Rule is satisfied.

A module may implement simple local approval logic.

When at least three independent workflows share the same approval lifecycle, promote the behavior into Platform Services through an ADR.

---

## 38. Own-Record Permissions Are Deferred

Do not implement complex permissions like these in MVP:

```txt
Can read own leave requests only.
Can approve only branch-level requests.
Can update only records they created.
Can view only department employees.
```

These are ABAC or scope-based permissions.

MVP should document the need but not implement a weak half-solution.

Use simple RBAC first:

```txt
leave.leave_request.read
leave.leave_request.create
leave.leave_request.approve
```

If own-record behavior is needed urgently, implement it inside the module service explicitly and document it as module-local logic, not as platform-wide ABAC.

---

## 39. ABAC Conditions Boundary

The RBAC model may include:

```txt
conditions Json?
```

But MVP must deny non-null conditions unless a real evaluator exists.

This means:

```ts
if (permission.conditions != null) {
  return false
}
```

Do not partially implement conditions.

Do not store JSON conditions that nobody evaluates.

Do not let Claude invent ad hoc condition parsing in individual modules.

Future ABAC belongs in a dedicated manual document and ADR.

---

## 40. Wildcard Rules

Wildcard permissions are supported for grants, not declarations.

Role grants may use:

```txt
*.*.*
```

Meaning:

```txt
module = *
resource = *
action = *
```

This is intended for organization Admin roles.

Wildcard matching must still be organization-scoped.

Admin in Org A does not become Admin in Org B.

Admin wildcard does not bypass:

```txt
Authentication
Tenant membership
Organization active/suspended status
Module registration
Module enablement
```

---

## 41. Wildcards Forbidden in Module Manifests

Module manifests must not declare wildcard permissions.

Wrong:

```ts
permissions: [
  { module: 'inventory', resource: '*', action: '*' },
]
```

Correct:

```ts
permissions: [
  { module: 'inventory', resource: 'stock_balance', action: 'read' },
  { module: 'inventory', resource: 'stock_adjustment', action: 'create' },
]
```

Reason:

```txt
Manifests define available permissions.
Wildcards are grants, not capabilities.
```

---

## 42. Permission Matching Algorithm

The SDK permission matcher should treat a grant as matching a requirement when all of the following are true:

```txt
Grant orgId equals ctx.org.id.
Grant belongs to one of ctx user's roles.
Grant module equals requirement.module OR grant module is '*'.
Grant resource equals requirement.resource OR grant resource is '*'.
Grant action equals requirement.action OR grant action is '*'.
Grant conditions is null in MVP.
```

Pseudo-code:

```ts
function grantMatches(
  grant: PermissionGrant,
  requirement: PermissionRequirement,
  ctx: PlatformContext
) {
  if (grant.orgId !== ctx.org.id) return false
  if (grant.conditions != null) return false

  const moduleMatches = grant.module === requirement.module || grant.module === '*'
  const resourceMatches = grant.resource === requirement.resource || grant.resource === '*'
  const actionMatches = grant.action === requirement.action || grant.action === '*'

  return moduleMatches && resourceMatches && actionMatches
}
```

Do not match on action alone.

Do not ignore resource.

Do not ignore orgId.

---

## 43. Permission Error Behavior

API permission failure must return:

```http
403 Forbidden
```

Response:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

Do not leak role internals in normal API responses.

Wrong:

```json
{
  "error": "Missing inventory.stock_adjustment.create because user only has role Staff"
}
```

Allowed for server logs:

```txt
Permission denied: user=user_123 org=org_123 requirement=inventory.stock_adjustment.create
```

---

## 44. Disabled Module Error Behavior

If a module is not enabled for the organization, normal users should receive safe 404-style behavior:

```http
404 Not Found
```

Response:

```json
{
  "data": null,
  "error": {
    "code": "MODULE_NOT_FOUND",
    "message": "Module not found."
  }
}
```

Reason:

```txt
Disabled modules should not be discoverable through API probing.
```

Admin configuration UIs may show disabled modules because they are intentionally managing module enablement.

---

## 45. Wrong Organization Behavior

If the authenticated user does not belong to the requested org slug, return safe 404-style behavior:

```http
404 Not Found
```

Response:

```json
{
  "data": null,
  "error": {
    "code": "ORG_NOT_FOUND",
    "message": "Organization not found."
  }
}
```

Do not return:

```txt
You do not belong to this organization.
```

That leaks tenant existence.

---

## 46. Suspended Organization Behavior

Suspended organizations may allow login for billing/support flows, but business module APIs should be blocked.

Recommended response:

```http
403 Forbidden
```

Response:

```json
{
  "data": null,
  "error": {
    "code": "ORG_SUSPENDED",
    "message": "This organization is currently suspended."
  }
}
```

Module permissions do not override organization suspension.

---

## 47. Module Dependency Permissions

Module dependencies do not grant permissions.

Example:

```txt
Purchasing depends on Supplier Business Object.
Purchasing enabled does not grant objects.supplier.update.
```

If a workflow needs to mutate a dependent object, it must require that dependent permission.

Example:

```ts
await sdk.permissions.require(ctx, purchasingPermissions.purchaseRequest.create)
await sdk.permissions.require(ctx, objectsPermissions.supplier.read)
```

Do not treat dependency installation as authorization.

---

## 48. Events and Permissions

Events are emitted after an authorized mutation succeeds.

Event listeners do not grant permission to the original action.

Example:

```txt
User creates stock adjustment.
Service checks inventory.stock_adjustment.create.
Service writes record.
Service emits inventory.stock_adjustment.created.
Search listener receives event.
Notification listener receives event later.
```

The listener should not re-check whether the original user had permission to create the record, because the mutation already passed authorization.

However, listeners must still respect tenant context and must not read/write cross-tenant data.

Listeners receive event envelopes with `orgId` from verified context.

---

## 49. AI Actions and Permissions

Future AI actions must use the same permission system.

If AI creates an inventory adjustment on behalf of a user, it must require:

```txt
inventory.stock_adjustment.create
```

If AI exports customer data, it must require:

```txt
objects.customer.export
```

AI must not have a hidden superuser path.

AI should operate with the requesting user's `PlatformContext` unless a future system-agent model is explicitly approved through an ADR.

---

## 50. Background Jobs and Permissions

Background jobs are deferred.

When introduced, they must distinguish between:

```txt
User-initiated jobs
System-initiated jobs
```

User-initiated jobs should capture the initiating user's verified context and permission at creation time.

System-initiated jobs should use a controlled system context, not a fake user with wildcard access.

Do not design module permissions around background jobs yet.

---

## 51. Permission Seeding

There are two kinds of seeding:

```txt
Available permission declarations in code.
Granted role permissions in database.
```

For MVP:

1. Module manifests declare available permissions.
2. The first organization Admin role receives wildcard grant `*.*.*`.
3. Staff role receives minimal or no module permissions unless explicitly configured.
4. Enabling a module does not automatically grant permissions to Staff.
5. Future role templates may propose default module grants.

Do not put per-client permission grants inside global seed scripts.

Client-specific grants belong in org provisioning scripts or a future admin UI.

---

## 52. Module Provisioning and Permissions

When a module is enabled for an organization, provisioning may create module settings, starter records, or default views.

Provisioning must not silently grant broad permissions unless explicitly specified by the manual or client configuration.

Wrong:

```txt
Enable Inventory → every user gets inventory.*.*
```

Correct:

```txt
Enable Inventory → module becomes available to org.
Admin can assign Inventory permissions to roles.
```

Optional future:

```txt
Enable Inventory with template: warehouse_staff
→ grants selected read/create permissions to selected role
```

This template system is deferred.

---

## 53. Role Editor Requirements

The future role editor should use module manifests to display available permissions.

It should group permissions by:

```txt
Module
  Resource
    Action
```

Example:

```txt
Inventory
  Stock Balance
    [ ] Read
    [ ] Export
  Stock Adjustment
    [ ] Read
    [ ] Create
    [ ] Update
    [ ] Delete
    [ ] Approve
  Settings
    [ ] Configure
```

The role editor should not let normal admins create arbitrary permission strings.

They choose from registered manifest-defined permissions plus approved Kernel/Business Object permissions.

---

## 54. Custom Permission Strings Are Forbidden

Do not let users or modules invent permission strings at runtime.

Wrong:

```txt
admin enters: inventory.secret.superpower
```

Correct:

```txt
admin selects from registered permissions
```

Reason:

```txt
Permissions are contracts. Unknown permissions create false confidence and security confusion.
```

---

## 55. API Route Permission Metadata

Every module API route should declare its permission requirement near the top of the file.

Example:

```ts
const requiredPermission = inventoryPermissions.stockAdjustment.create
```

This makes security review easy.

For routes with multiple methods:

```ts
const permissions = {
  GET: inventoryPermissions.stockAdjustment.read,
  POST: inventoryPermissions.stockAdjustment.create,
}
```

Generated code must include this pattern.

---

## 56. Route Handler Wrapper Pattern

The SDK should provide wrappers that make correct behavior easy.

Example target pattern:

```ts
export const GET = sdk.api.moduleRoute({
  moduleId: 'inventory',
  permission: inventoryPermissions.stockAdjustment.read,
  query: listStockAdjustmentsQuerySchema,
  handler: async ({ ctx, query }) => {
    const data = await InventoryService.listStockAdjustments(ctx, query)
    return sdk.api.ok(data)
  },
})
```

This wrapper may be implemented later.

Until then, manual routes must follow the same steps explicitly.

---

## 57. Generated Module Requirements

The module generator must emit permission-safe code by default.

Generated module must include:

```txt
permissions.ts
manifest.ts with full permission objects
API route permission checks
service-level permission checks
page-level permission checks
client permission props for action buttons
permission-denial tests
cross-tenant tests
module-disabled tests
```

Generated module must not include:

```txt
permissions: ['create', 'read']
orgId in client schema
request.nextUrl.searchParams.get('orgId')
body.orgId
sdk.getDb(orgId)
raw Prisma imports
requireAuth() in API routes if it redirects
API route without permission check
service method without PlatformContext
```

---

## 58. Module Permission Test Matrix

Every module must include permission tests covering at least:

```txt
Admin can perform allowed operation.
Staff with explicit permission can perform operation.
Staff without permission receives 403.
Unauthenticated request receives 401 JSON.
Wrong-org user receives safe 404.
Disabled module receives safe 404.
Client-supplied orgId is rejected.
Wildcard admin grant works only within same org.
Non-null permission conditions are denied in MVP.
```

These tests are not optional.

They are part of the Definition of Done for every module.

---

## 59. Required Test Fixtures

Permission tests need at least:

```txt
Org A
Org B
Org A Admin
Org A Staff With Permission
Org A Staff Without Permission
Org B Admin
Org A enabled module
Org B disabled module or separate enabled module state
```

Single-org tests are insufficient.

Always-admin tests are insufficient.

A permission system that is only tested with Admin users is not tested.

---

## 60. Example Permission Test: Deny Staff Without Permission

```ts
it('returns 403 when staff lacks create permission', async () => {
  const ctx = await testAuth.asUser(orgAStaffWithoutPermission)

  const res = await ctx.fetch(`/api/orgs/${orgA.slug}/inventory/stock-adjustments`, {
    method: 'POST',
    body: JSON.stringify(validInput),
  })

  expect(res.status).toBe(403)
  await expect(res.json()).resolves.toMatchObject({
    data: null,
    error: { code: 'FORBIDDEN' },
  })
})
```

---

## 61. Example Permission Test: Cross-Tenant Denial

```ts
it('does not allow Org A user to access Org B module route', async () => {
  const ctx = await testAuth.asUser(orgAAdmin)

  const res = await ctx.fetch(`/api/orgs/${orgB.slug}/inventory/stock-adjustments`)

  expect(res.status).toBe(404)
  await expect(res.json()).resolves.toMatchObject({
    data: null,
    error: { code: 'ORG_NOT_FOUND' },
  })
})
```

---

## 62. Example Permission Test: Client-Supplied Org ID Rejected

```ts
it('rejects client-supplied orgId in module mutation body', async () => {
  const ctx = await testAuth.asUser(orgAAdmin)

  const res = await ctx.fetch(`/api/orgs/${orgA.slug}/inventory/stock-adjustments`, {
    method: 'POST',
    body: JSON.stringify({
      ...validInput,
      orgId: orgB.id,
    }),
  })

  expect(res.status).toBe(400)
  await expect(res.json()).resolves.toMatchObject({
    data: null,
    error: { code: 'VALIDATION_ERROR' },
  })
})
```

---

## 63. Example Permission Test: Module Disabled

```ts
it('returns safe 404 when module is disabled for org', async () => {
  const ctx = await testAuth.asUser(orgAAdmin)

  await disableModuleForOrg(orgA.id, 'inventory')

  const res = await ctx.fetch(`/api/orgs/${orgA.slug}/inventory/stock-adjustments`)

  expect(res.status).toBe(404)
  await expect(res.json()).resolves.toMatchObject({
    data: null,
    error: { code: 'MODULE_NOT_FOUND' },
  })
})
```

---

## 64. Example Service Test: Service Enforces Permission

```ts
it('InventoryService.createStockAdjustment requires create permission', async () => {
  const ctx = createPlatformContext({
    user: orgAStaffWithoutPermission,
    org: orgA,
  })

  await expect(
    InventoryService.createStockAdjustment(ctx, validInput)
  ).rejects.toMatchObject({
    code: 'FORBIDDEN',
  })
})
```

This test proves that the service itself is protected, not only the API route.

---

## 65. Architecture Check Requirements

`check:architecture` should eventually fail if module code contains forbidden patterns.

Forbidden patterns:

```txt
src/modules/** imports @/kernel/*
src/modules/** imports @/kernel/db/client
src/modules/** imports @prisma/client directly for runtime DB access
src/modules/** calls sdk.getDb(orgId)
src/modules/** accepts orgId in create/update schemas
src/modules/** uses request.nextUrl.searchParams.get('orgId')
src/app/api/orgs/**/[module]/** route lacks permission declaration
src/modules/**/service.ts public method lacks PlatformContext parameter
src/modules/**/permissions.ts declares wildcard permission
```

Some checks can be static lint rules.

Some checks may require code review until automation exists.

---

## 66. Forbidden Patterns

### 66.1 Auth-Only Module API

Forbidden:

```ts
await sdk.auth.requireApiAuth(req)
const data = await InventoryService.create(input)
```

Required:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
await sdk.permissions.require(ctx, inventoryPermissions.stockAdjustment.create)
const data = await InventoryService.createStockAdjustment(ctx, input)
```

### 66.2 Client-Supplied Org ID

Forbidden:

```ts
const orgId = body.orgId
```

Required:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const orgId = ctx.org.id
```

### 66.3 Raw Prisma in Module

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
```

Required:

```ts
const db = sdk.getDb(ctx)
```

### 66.4 Loose Service Parameters

Forbidden:

```ts
InventoryService.list(orgId: string)
```

Required:

```ts
InventoryService.list(ctx: PlatformContext)
```

### 66.5 UI-Only Permission Enforcement

Forbidden:

```tsx
{canDelete && <DeleteButton />}
```

with an API route that deletes without checking permission.

Required:

```txt
UI hides button.
API checks permission.
Service checks permission.
```

### 66.6 Module Permission Owning Business Object

Forbidden:

```txt
inventory.product.create
crm.customer.update
hr.employee.delete
```

Required:

```txt
objects.product.create
objects.customer.update
objects.employee.delete
```

---

## 67. Example Inventory Permission Set

Initial Inventory permissions may be:

```txt
inventory.dashboard.read
inventory.stock_balance.read
inventory.stock_balance.export
inventory.stock_movement.read
inventory.stock_movement.create
inventory.stock_adjustment.read
inventory.stock_adjustment.create
inventory.stock_adjustment.update
inventory.stock_adjustment.delete
inventory.stock_adjustment.approve
inventory.stock_adjustment.reject
inventory.reorder_rule.read
inventory.reorder_rule.create
inventory.reorder_rule.update
inventory.reorder_rule.delete
inventory.settings.configure
```

Inventory also depends on Business Object permissions for product and warehouse management:

```txt
objects.product.read
objects.product.create
objects.product.update
objects.product.delete
objects.warehouse.read
objects.warehouse.create
objects.warehouse.update
objects.warehouse.delete
```

Do not move Product and Warehouse permissions under Inventory.

---

## 68. Example Leave Permission Set

Initial Leave permissions may be:

```txt
leave.dashboard.read
leave.leave_request.read
leave.leave_request.create
leave.leave_request.update
leave.leave_request.delete
leave.leave_request.approve
leave.leave_request.reject
leave.leave_balance.read
leave.leave_balance.update
leave.leave_type.read
leave.leave_type.create
leave.leave_type.update
leave.leave_type.delete
leave.settings.configure
```

Leave depends on:

```txt
objects.employee.read
```

Leave does not own Employee.

---

## 69. Example CRM Permission Set

Initial CRM permissions may be:

```txt
crm.dashboard.read
crm.lead.read
crm.lead.create
crm.lead.update
crm.lead.delete
crm.opportunity.read
crm.opportunity.create
crm.opportunity.update
crm.opportunity.delete
crm.pipeline.read
crm.pipeline.configure
crm.settings.configure
```

CRM depends on:

```txt
objects.customer.read
objects.customer.create
objects.customer.update
objects.customer.delete
```

CRM does not own Customer.

---

## 70. Permission Review Checklist

Before approving a module spec, answer:

```txt
[ ] Does every module-owned entity have explicit permissions?
[ ] Are Business Object permissions kept under objects.*?
[ ] Are module settings protected by [module].settings.configure?
[ ] Are exports protected by explicit export permissions?
[ ] Are imports protected by explicit import permissions?
[ ] Are approval actions explicit?
[ ] Does every API route declare a permission?
[ ] Does every public service method enforce permission?
[ ] Does the UI receive permission snapshots from server context?
[ ] Do tests cover unauthorized users?
[ ] Do tests cover wrong-org access?
[ ] Do tests cover disabled modules?
[ ] Does generated code reject client-supplied orgId?
[ ] Are wildcard permissions absent from the manifest?
[ ] Are ABAC conditions deferred rather than half-implemented?
```

---

## 71. Claude Implementation Rules

When Claude implements module permissions, it must follow these rules:

```txt
Do not invent permission naming.
Do not use action arrays.
Do not put Business Object permissions under module namespaces.
Do not add wildcard permissions to manifests.
Do not trust client-supplied orgId.
Do not call sdk.getDb(orgId).
Do not import Kernel internals in modules.
Do not rely on UI checks for security.
Do not ship API routes without permission enforcement.
Do not ship service methods without PlatformContext.
Do not implement ABAC conditions unless a frozen manual document exists.
Do not add FastAPI or a separate permission runtime.
```

Claude must produce:

```txt
permissions.ts
manifest permission declarations
API permission checks
service permission checks
UI permission snapshots where needed
tenant and permission tests
architecture-check updates if applicable
```

---

## 72. Implementation Prompt Template for Claude

Use this template when implementing module permissions:

```md
You are implementing OneDayOS module permissions for [MODULE].

Authoritative documents:
- docs/engineering-manual/04-kernel/03-users-roles-permissions.md
- docs/engineering-manual/04-kernel/04-authorization-enforcement.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md
- docs/engineering-manual/08-module-system/04-module-permissions.md

Rules:
- Modules import only from @/sdk, @/sdk/server, @/sdk/client, shared components, and module-local files.
- Do not import @/kernel/* from modules.
- Do not use raw Prisma in modules.
- Do not accept orgId from client body, query, or params except orgSlug route param.
- Use verified PlatformContext.
- Use sdk.permissions.require() in public service methods.
- API routes must return JSON, never redirects.
- Add permission-denial and cross-tenant tests.

Task:
Implement only the module permission definitions, enforcement points, and tests for [MODULE].
Stop if the manual is ambiguous.
```

---

## 73. Acceptance Criteria

This document is ready to freeze when:

```txt
[ ] Permission shape is unambiguous.
[ ] Module permission namespace rules are clear.
[ ] Business Object permission namespace rules are clear.
[ ] Manifest permission declaration rules are clear.
[ ] API enforcement pattern is clear.
[ ] Service enforcement pattern is clear.
[ ] UI visibility limitations are clear.
[ ] Wildcard rules are clear.
[ ] ABAC deferral is explicit.
[ ] Generated module requirements are clear.
[ ] Test matrix is implementation-grade.
[ ] Forbidden patterns are explicit.
[ ] Claude implementation prompt is included.
```

A module is not production-ready unless its permissions are declared, enforced, and tested according to this document.

---

## 74. Founder Review Questions

Before freezing this document, answer:

1. Should `export` and `import` always be separate permissions from `read` and `create`?
2. Should module service methods always enforce permissions internally, even if the API route already checked them?
3. Should role templates be deferred, or should each module ship with default role templates now?
4. Should the first official Inventory module require both `objects.product.*` and `inventory.product_extension.*` permissions when editing products from Inventory screens?
5. Should disabled modules return 404 for all users, or should org Admins see a special disabled-module message?

My recommendation:

```txt
Yes, export/import should be separate.
Yes, service methods should enforce permissions internally during MVP.
Defer role templates.
Yes, Inventory product setup should require both Business Object and extension permissions.
Return 404 for normal users; allow Admin module-management screens to show disabled modules intentionally.
```

---

## 75. Summary

Module permissions are the bridge between the business flexibility of OneDayOS and the security requirements of a shared multi-tenant platform.

The rule is simple:

```txt
Enabled module means the organization can use the module.
Granted permission means this user can perform this action.
Verified PlatformContext proves which organization and user are involved.
API and service checks enforce the boundary.
UI checks improve usability only.
```

If OneDayOS follows this model, modules can scale without becoming security liabilities.

If OneDayOS skips this model, the platform will recreate the old MVP risk: permissions exist on paper but do not protect real tenant data.
