# OneDayOS Engineering Manual — Module Loader & Registry

**Document ID:** `08-module-system/02-module-loader-registry.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** No, not until this document is approved and frozen  
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
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/05-sdk-compatibility-versioning.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`

---

# 1. Purpose

This document defines how OneDayOS discovers, validates, registers, enables, disables, and exposes business modules.

The Module Loader & Registry is the platform mechanism that allows OneDayOS to remain:

```txt
One codebase
One deployment
One database
Many organizations
Different enabled modules per organization
```

It is not a plugin marketplace system yet.

It is not a dynamic remote-code loader.

It is not a runtime package installer.

For the restarted platform build, the registry is a **static, code-owned, validated module catalog** combined with **database-owned per-organization module enablement**.

---

# 2. Core Principle

```txt
A module can exist in the codebase without being enabled for an organization.
A module can be enabled for an organization without being visible to every user.
A module can be visible to a user only if the organization has it enabled and the user has permission.
```

These are separate concepts:

```txt
Module registered in platform code
  ↓
Module compatible with current platform
  ↓
Module available for organization
  ↓
Module enabled for organization
  ↓
Module visible to user
  ↓
Module action allowed by permission
```

The registry must never confuse these layers.

---

# 3. Why This Matters

Without a strict module registry, OneDayOS will drift into one of two bad outcomes.

## Bad Outcome A — Per-client forks

```txt
Client A gets custom Inventory code.
Client B gets slightly different Inventory code.
Client C gets a patched Inventory copy.
```

This destroys the OneDayOS business model because every update becomes manual client-by-client maintenance.

## Bad Outcome B — Everything is always visible

```txt
Inventory code exists
→ every organization sees Inventory
→ every user can click Inventory
→ permissions are added later
```

This recreates the previous MVP risk pattern where platform capability existed but enforcement was incomplete.

The correct model is:

```txt
Code availability is global.
Module enablement is per organization.
Feature visibility is permission-aware.
Execution is enforced by APIs and services.
```

---

# 4. Scope

This document covers:

- Module discovery.
- Module manifest loading.
- Module registry creation.
- Manifest validation.
- Module compatibility checks.
- Per-organization module enablement.
- Module dependency resolution.
- Sidebar/navigation filtering.
- Route/API module guards.
- SDK registry access.
- Generator integration.
- Testing requirements.
- Claude implementation rules.

---

# 5. Non-Goals

This document does **not** define:

- Dynamic remote plugin installation.
- Marketplace billing.
- Per-organization module version pinning.
- Third-party module sandboxing.
- Runtime JavaScript evaluation.
- FastAPI-based module services.
- Background job processing.
- Platform Services.
- Business module implementation details.
- Dynamic CRUD.
- Dynamic Forms.
- A no-code module builder.

Those are future concerns.

---

# 6. Required Vocabulary

## Registered Module

A module whose manifest is present in the deployed codebase and has passed registry validation.

Example:

```txt
inventory
leave
crm
expenses
```

## Enabled Module

A registered module that an organization has active access to through an `OrgModule` record.

Example:

```txt
Org: acme-corp
Module: inventory
isEnabled: true
```

## Visible Module

An enabled module that the current user can see in navigation because they have at least one required read/navigation permission.

## Available Module

A registered module that could be enabled for an organization, usually shown in admin module settings.

## Module Dependency

A declared relationship where one module requires another module to be enabled first.

Example:

```txt
purchase_orders depends on purchasing
```

A dependency does not permit direct imports.

## Module Registry

The validated in-memory catalog of module manifests for the current deployed codebase.

## Module Loader

The composition root that imports known module manifests and creates the registry.

---

# 7. Architectural Position

The Module Registry belongs to the **Kernel** because module discovery and enablement are platform fundamentals.

However, module manifests belong to **modules**.

The registry may validate module manifests, but modules must not reach into Kernel internals.

```txt
Kernel
  owns registry types, validation, enablement checks

Modules
  own manifest files and module-specific implementation

Composition Root
  imports module manifests and creates the registry

SDK
  exposes safe registry/query helpers to pages, APIs, and modules
```

---

# 8. Layer Rules

## Allowed

```txt
src/platform/module-loader.ts
  → imports module manifests
  → imports Kernel registry builder
  → creates the module registry

src/kernel/modules/*
  → defines registry behavior
  → validates manifests
  → reads OrgModule records

src/modules/[module]/manifest.ts
  → exports pure manifest object

src/modules/[module]/service.ts
  → imports from @/sdk/server only

src/app/(platform)/[orgSlug]/[moduleId]/*
  → uses SDK context helpers and module service
```

## Forbidden

```txt
src/modules/[module]/manifest.ts
  → import { sdk } from '@/sdk/server'

src/modules/[module]/manifest.ts
  → register itself as a side effect

src/modules/[module]/service.ts
  → import { prisma } from '@/kernel/db/client'

src/modules/[module]/*
  → import from another module

src/modules/[module]/*
  → import from @/kernel/*

src/app/api/[module]/*
  → accept orgId from query/body

src/app/api/[module]/*
  → bypass module enablement checks
```

---

# 9. Important Correction from the Old MVP Direction

The old MVP direction used a side-effect pattern like:

```ts
import { sdk, KERNEL_VERSION } from '@/sdk'

export const InventoryModule = { ... }

sdk.modules.register(InventoryModule)
```

This is convenient, but it is not the preferred restarted-build pattern.

For the restarted platform, module manifests should be **pure declarative objects**.

Preferred:

```ts
// src/modules/inventory/manifest.ts

import type { ModuleManifest } from '@/sdk'

export const inventoryManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '0.1.0',
  icon: 'Package',
  compatibility: {
    platform: { min: '0.1.0', maxExclusive: '0.2.0' },
    sdk: { min: '0.1.0', maxExclusive: '0.2.0' },
    manifest: { min: '1.0.0', maxExclusive: '2.0.0' },
  },
  dependencies: [],
  businessObjects: {
    uses: ['product', 'warehouse', 'supplier'],
    extends: ['product', 'warehouse'],
  },
  entities: [
    { key: 'stock_movement', label: 'Stock Movement' },
    { key: 'stock_balance', label: 'Stock Balance' },
  ],
  permissions: [
    { module: 'inventory', resource: 'stock_movement', action: 'read' },
    { module: 'inventory', resource: 'stock_movement', action: 'create' },
  ],
  navItems: [
    {
      key: 'stock',
      label: 'Stock',
      href: '/inventory/stock',
      icon: 'Package',
      requiredPermission: {
        module: 'inventory',
        resource: 'stock_movement',
        action: 'read',
      },
    },
  ],
  events: {
    emits: ['inventory.stock_movement.created'],
    listens: [],
  },
} satisfies ModuleManifest
```

Then a composition file imports it:

```ts
// src/modules/index.ts

import { inventoryManifest } from './inventory/manifest'
import { leaveManifest } from './leave/manifest'

export const moduleManifests = [
  inventoryManifest,
  leaveManifest,
] as const
```

Then the loader builds the registry:

```ts
// src/platform/module-loader.ts

import { createModuleRegistry } from '@/kernel/modules/registry.server'
import { moduleManifests } from '@/modules'

export const moduleRegistry = createModuleRegistry(moduleManifests)
```

This is stricter and easier to test.

---

# 10. Module Loader Design

## 10.1 Static Loader for MVP

The MVP loader is static.

That means all module manifests are imported from source code:

```txt
src/modules/index.ts
```

This file is maintained by the module generator.

When a new module is generated, the generator appends its manifest import and export entry.

Example:

```ts
import { inventoryManifest } from './inventory/manifest'
import { leaveManifest } from './leave/manifest'

export const moduleManifests = [
  inventoryManifest,
  leaveManifest,
] as const
```

## 10.2 No Dynamic File-System Scanning in Runtime

Do not scan the filesystem at runtime in Next.js route handlers or server components.

Forbidden:

```ts
fs.readdirSync('src/modules')
```

Reasons:

- Unreliable in serverless deployment.
- Harder to bundle.
- Harder to type-check.
- Can hide missing imports during development.
- Makes deployment behavior less predictable.

The generator should update the module index explicitly.

## 10.3 No Remote Module Loading in MVP

Forbidden:

```txt
download module package at runtime
eval module code
import module from URL
load module from S3
load module from database
```

Remote modules are a marketplace concern and require a separate security model.

---

# 11. Module Registry Design

The registry should be deterministic and immutable after construction.

Recommended shape:

```ts
export type ModuleRegistry = {
  getAll(): ModuleManifest[]
  getById(moduleId: string): ModuleManifest | null
  has(moduleId: string): boolean
  getAvailableForOrg(ctx: PlatformContext): Promise<ModuleManifest[]>
  getEnabledForOrg(ctx: PlatformContext): Promise<ModuleManifest[]>
  getVisibleForUser(ctx: PlatformContext): Promise<VisibleModule[]>
  assertRegistered(moduleId: string): ModuleManifest
  assertEnabled(ctx: PlatformContext, moduleId: string): Promise<ModuleManifest>
  validate(): ModuleRegistryValidationResult
}
```

The registry should not be a loose mutable array that any module can push into.

Forbidden:

```ts
export const registry: ModuleManifest[] = []
registry.push(module)
registry.splice(0)
```

Preferred:

```ts
export function createModuleRegistry(manifests: readonly ModuleManifest[]): ModuleRegistry {
  const result = validateModuleManifests(manifests)

  if (!result.ok) {
    throw new ModuleRegistryError(result.errors)
  }

  const byId = new Map(manifests.map((manifest) => [manifest.id, manifest]))

  return Object.freeze({
    getAll: () => [...byId.values()],
    getById: (id) => byId.get(id) ?? null,
    has: (id) => byId.has(id),
    // ...
  })
}
```

---

# 12. Registry Construction Lifecycle

For the restarted build, the registry should be created once per server runtime instance.

In Next.js/Vercel, server runtime instances may be recreated. That is acceptable because the registry is derived from static imports.

Expected lifecycle:

```txt
Server runtime starts or route module loads
  ↓
moduleManifests imported from src/modules/index.ts
  ↓
createModuleRegistry(moduleManifests)
  ↓
manifest validation runs
  ↓
registry exposed through SDK/server helpers
```

The registry must not depend on:

- request body
- user input
- database state for construction
- external network calls
- FastAPI services
- runtime file scanning

Database state is used only later to determine which modules are enabled for an organization.

---

# 13. Manifest Validation

The registry must validate manifests before exposing them.

Validation failures should fail local checks and CI.

In production runtime, invalid manifests should fail fast because they indicate a bad deployment.

## 13.1 Required Validation Rules

Each manifest must satisfy:

```txt
id is required
id is lowercase kebab-case
id is unique
id is not reserved
label is required
version is required
compatibility is required
icon is required
permissions are valid
nav items are valid
routes are valid
API definitions are valid
events are valid
dependencies exist
dependencies are not circular
business object references are valid
module-owned entities are valid
settings keys are valid
AI context is safe
```

## 13.2 Reserved Module IDs

The following module IDs are reserved:

```txt
kernel
objects
auth
api
settings
admin
system
platform
sdk
```

These are not business module IDs.

Forbidden:

```ts
id: 'objects'
id: 'kernel'
id: 'settings'
```

## 13.3 Module ID Format

Module IDs should use lowercase kebab-case:

```txt
inventory
leave
crm
purchase-requests
visitor-management
incident-reporting
```

Valid:

```txt
inventory
leave
visitor-management
```

Invalid:

```txt
Inventory
inventory_module
inventoryModule
inventory.module
inventory/product
```

Recommended regex:

```ts
const MODULE_ID_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
```

## 13.4 Permission Validation

Module manifest permissions must:

- use the module's own module ID
- use non-empty resource
- use non-empty action
- not include wildcard module
- not include wildcard resource
- not include wildcard action
- not duplicate another permission in the same manifest

Valid:

```ts
{
  module: 'inventory',
  resource: 'stock_movement',
  action: 'create',
}
```

Invalid:

```ts
{ module: '*', resource: '*', action: '*' }
{ module: 'inventory', resource: '*', action: 'read' }
{ module: 'inventory', resource: 'stock_movement', action: '*' }
{ module: 'crm', resource: 'stock_movement', action: 'read' } // wrong namespace
```

Admin wildcard permissions are seeded in Kernel RBAC. They do not belong in module manifests.

## 13.5 Navigation Validation

Every nav item must:

- have a stable key
- have a label
- use an href under the module route
- declare a required permission
- not use absolute external URLs
- not include `orgSlug`
- not include `orgId`

Valid:

```ts
{
  key: 'stock',
  label: 'Stock',
  href: '/inventory/stock',
  requiredPermission: {
    module: 'inventory',
    resource: 'stock_movement',
    action: 'read',
  },
}
```

Invalid:

```ts
href: '/acme-corp/inventory/stock'
href: '/api/orgs/acme-corp/inventory'
href: 'https://example.com'
href: '/crm/deals' // inside inventory manifest
```

## 13.6 Event Validation

Events must follow:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Valid:

```txt
inventory.stock_movement.created
inventory.stock_adjustment.approved
leave.leave_request.submitted
objects.product.created
```

Invalid:

```txt
inventory.createStockMovement
inventory.stockMovement.created
stock.created
inventory.stock_movement.create
```

The registry may validate module-owned event names in manifests.

Business Object events such as `objects.product.created` are allowed only when declared as events the module listens to, not as module-owned emitted events unless the module is explicitly calling a Business Object service that emits them.

## 13.7 Dependency Validation

Each dependency must reference a registered module ID.

Valid:

```ts
dependencies: ['purchasing']
```

Invalid:

```ts
dependencies: ['not-real-module']
```

The registry must also reject circular dependencies.

Invalid:

```txt
module A depends on module B
module B depends on module A
```

---

# 14. Compatibility Validation

The registry must validate that a module is compatible with the current platform/SDK/manifest versions.

Recommended manifest field:

```ts
compatibility: {
  platform: { min: '0.1.0', maxExclusive: '0.2.0' },
  sdk: { min: '0.1.0', maxExclusive: '0.2.0' },
  manifest: { min: '1.0.0', maxExclusive: '2.0.0' },
}
```

MVP rule:

```txt
Do not add a semver dependency yet.
Use a small internal version comparison helper.
```

CI should fail if:

```txt
module platform compatibility does not include current platform version
module SDK compatibility does not include current SDK version
module manifest compatibility does not include current manifest schema version
```

Runtime should fail fast if incompatible manifests are deployed.

Reason:

```txt
Incompatible module code in production is a deploy bug, not a runtime user choice.
```

---

# 15. Organization Module Enablement

Registration is code-level.

Enablement is database-level.

The source of truth for per-organization enablement is `OrgModule`.

Recommended MVP model:

```prisma
model OrgModule {
  id        String   @id @default(cuid())
  orgId     String
  moduleId  String
  isEnabled Boolean  @default(true)
  enabledAt DateTime @default(now())
  disabledAt DateTime?
  enabledBy String?
  disabledBy String?

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, moduleId])
  @@index([orgId, isEnabled])
  @@map("org_modules")
}
```

If the current schema does not yet include `disabledAt`, `enabledBy`, or `disabledBy`, they may be deferred. But the service API should be designed to support them later.

## 15.1 Enable Module Flow

Enabling a module should:

```txt
1. Require verified PlatformContext.
2. Require kernel/module-management permission.
3. Verify target module exists in registry.
4. Verify module is compatible.
5. Verify dependencies are enabled.
6. Verify subscription/plan limits.
7. Run module provisioning hook if declared.
8. Upsert OrgModule row.
9. Emit kernel.module.enabled event.
10. Return enabled module data.
```

Recommended service:

```ts
await sdk.modules.enable(ctx, {
  moduleId: 'inventory',
})
```

## 15.2 Disable Module Flow

Disabling a module should:

```txt
1. Require verified PlatformContext.
2. Require kernel/module-management permission.
3. Verify module is enabled.
4. Verify no enabled module depends on it.
5. Set isEnabled false.
6. Set disabledAt / disabledBy if available.
7. Emit kernel.module.disabled event.
8. Do not delete module data.
```

Important:

```txt
Disabling a module hides and blocks the module.
It does not delete that module's data.
```

## 15.3 Re-enable Module Flow

Re-enabling a module should:

```txt
1. Verify dependencies.
2. Verify subscription limits.
3. Re-run safe idempotent provisioning if required.
4. Set isEnabled true.
5. Emit kernel.module.enabled event.
```

Provisioning must be idempotent.

---

# 16. Module Dependencies

Dependencies are declarative.

They do not create import permission.

Example:

```ts
dependencies: ['purchasing']
```

This means:

```txt
The platform cannot enable this module unless purchasing is also enabled.
```

It does **not** mean:

```txt
This module may import from @/modules/purchasing.
```

Direct module imports remain forbidden.

## 16.1 Dependency Enablement Rule

A module can be enabled only if all dependencies are:

```txt
registered
compatible
enabled for the organization
not suspended
```

## 16.2 Dependency Disable Rule

A module cannot be disabled if another enabled module depends on it.

Example:

```txt
purchase-approvals depends on purchasing
```

If both are enabled, the platform must block disabling `purchasing` until `purchase-approvals` is disabled first.

## 16.3 Dependency Cycles

Dependency cycles are forbidden at registry validation.

Invalid:

```txt
a → b → c → a
```

---

# 17. Module Visibility

A module appears in the sidebar only if:

```txt
module is registered
AND module is enabled for org
AND module has at least one nav item visible to user
AND user has the required permission for that nav item
```

Do not show a module because it is merely enabled.

Do not show a nav item because the user is merely authenticated.

## 17.1 Visible Module Shape

Recommended shape:

```ts
type VisibleModule = {
  id: string
  label: string
  icon: string
  version: string
  navItems: VisibleNavItem[]
}
```

Where:

```ts
type VisibleNavItem = {
  key: string
  label: string
  href: string
  icon?: string
  requiredPermission: PermissionRequirement
}
```

The final `href` should be constructed by the app shell:

```ts
`/${ctx.org.slug}${navItem.href}`
```

The manifest itself should not include `orgSlug`.

---

# 18. Route and API Guarding

The registry must integrate with route and API guards.

## 18.1 Page Route Guard

For a module page:

```txt
/[orgSlug]/inventory/stock
```

The page or layout must verify:

```txt
authenticated user
organization exists
user belongs to organization
organization is active
module is registered
module is enabled for organization
user has required permission
```

Preferred helper:

```ts
const ctx = await sdk.auth.requirePageModuleContext({
  orgSlug,
  moduleId: 'inventory',
  permission: {
    module: 'inventory',
    resource: 'stock_movement',
    action: 'read',
  },
})
```

## 18.2 API Route Guard

For a module API:

```txt
/api/orgs/[orgSlug]/inventory/stock-movements
```

The API route must verify:

```txt
authenticated user
organization exists
user belongs to organization
organization is active
module is registered
module is enabled for organization
user has required permission
request body/query/params are valid
```

Preferred helper:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_movement',
  action: 'create',
})
```

Or through the API wrapper:

```ts
export const POST = sdk.api.handle({
  moduleId: 'inventory',
  permission: {
    module: 'inventory',
    resource: 'stock_movement',
    action: 'create',
  },
  body: CreateStockMovementSchema,
  handler: async ({ ctx, body }) => {
    const data = await InventoryService.createStockMovement(ctx, body)
    return sdk.api.created(data)
  },
})
```

## 18.3 Disabled Module Response

If a user accesses a module that is not enabled for their organization:

- Page routes should show `notFound()`.
- API routes should return a safe JSON `404`.

Recommended error:

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
A disabled module should not be treated as an authorized feature that merely failed.
For normal users, it should not exist.
```

Admin module settings may show disabled modules through a separate Kernel admin endpoint.

---

# 19. SDK Interface

The module registry should be exposed through `@/sdk/server`.

Recommended server SDK surface:

```ts
sdk.modules.getRegistered()
sdk.modules.getById(moduleId)
sdk.modules.getEnabledForOrg(ctx)
sdk.modules.getVisibleForUser(ctx)
sdk.modules.requireRegistered(moduleId)
sdk.modules.requireEnabled(ctx, moduleId)
sdk.modules.enable(ctx, input)
sdk.modules.disable(ctx, input)
sdk.modules.validateRegistry()
```

## 19.1 Shared-Safe Types

The following may be exported from `@/sdk`:

```ts
ModuleManifest
ModuleCompatibility
ModuleDependency
ModulePermissionDeclaration
ModuleNavItem
ModuleEventDeclaration
```

## 19.2 Browser-Safe Helpers

The following may be exported from `@/sdk/client` later:

```ts
sdkClient.modules.listEnabled()
sdkClient.modules.listAvailableForAdmin()
```

These must call APIs.

They must not import the server registry directly.

---

# 20. Database Access Rules

The registry may read `OrgModule` records through SDK/Kernel data access.

Module services may not query `OrgModule` directly.

Allowed inside Kernel registry service:

```ts
db.orgModule.findMany({
  where: {
    orgId: ctx.org.id,
    isEnabled: true,
  },
})
```

Forbidden inside a module service:

```ts
sdk.getDb(ctx).orgModule.findMany(...)
```

Reason:

```txt
Module enablement is Kernel-owned.
Modules should not decide if they are enabled.
```

---

# 21. Module Provisioning

Some modules may need initial org-specific setup when enabled.

Examples:

```txt
Inventory creates default stock movement reasons.
Leave creates default leave types.
CRM creates default pipeline stages.
```

Do not put executable seed functions directly in the manifest.

Preferred manifest declaration:

```ts
provisioning: {
  onEnable: 'provisionInventoryModule',
}
```

Then implement server-only provisioning:

```ts
// src/modules/inventory/provisioning.server.ts

export async function provisionInventoryModule(ctx: PlatformContext) {
  // idempotent setup only
}
```

The platform loader may maintain a server-only provisioning map:

```ts
// src/platform/module-provisioning.server.ts

import { provisionInventoryModule } from '@/modules/inventory/provisioning.server'

export const moduleProvisioners = {
  inventory: {
    provisionInventoryModule,
  },
}
```

Rules:

```txt
Provisioning must be idempotent.
Provisioning must use PlatformContext.
Provisioning must not accept orgId.
Provisioning must not overwrite client data.
Provisioning must be tested.
```

---

# 22. Events

The module registry should emit Kernel events for module lifecycle changes.

Required events:

```txt
kernel.module.enabled
kernel.module.disabled
kernel.module.provisioned
kernel.module.provision_failed
```

## 22.1 `kernel.module.enabled`

Payload:

```ts
{
  moduleId: string
  enabledAt: string
}
```

Envelope context already includes actor and organization.

Do not include `orgId` in payload.

## 22.2 `kernel.module.disabled`

Payload:

```ts
{
  moduleId: string
  disabledAt: string
}
```

## 22.3 `kernel.module.provisioned`

Payload:

```ts
{
  moduleId: string
  provisioner: string
  provisionedAt: string
}
```

## 22.4 `kernel.module.provision_failed`

Payload:

```ts
{
  moduleId: string
  provisioner: string
  failedAt: string
  reasonCode: string
}
```

Do not include full error stacks in event payloads.

---

# 23. Subscription and Plan Limits

Module enablement must eventually respect subscription limits.

MVP minimum:

```txt
Subscription.maxModules should be checked before enabling a module.
Suspended subscriptions should block module usage.
```

Enablement flow should check:

```txt
organization active
subscription status
maxModules
module dependencies
module compatibility
```

Recommended behavior:

| Subscription Status | Module Access |
|---|---|
| `trial` | Allowed within plan limits |
| `active` | Allowed within plan limits |
| `suspended` | Block business modules |
| `cancelled` | Block business modules |

Kernel settings/billing pages may remain accessible for admins.

---

# 24. Admin Module Settings

The registry should support a future admin UI showing:

```txt
Available modules
Enabled modules
Disabled modules
Dependency status
Subscription limit status
Compatibility status
```

This is different from the user sidebar.

Sidebar:

```txt
Show what this user can use.
```

Admin module settings:

```txt
Show what the organization could enable/manage.
```

Do not use sidebar filtering logic as the only source for admin module settings.

---

# 25. Navigation Active State

The old MVP used broad prefix matching, which can cause bugs like:

```txt
/inventory matches /inventory-audit
```

The restarted build should use segment-aware active matching.

Preferred:

```ts
function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
```

For module root matching:

```txt
/inventory
/inventory/stock
/inventory/products
```

Should not match:

```txt
/inventory-audit
/inventory2
```

This belongs partly to UI standards, but the registry/nav contract should make hrefs predictable enough to support safe matching.

---

# 26. Error Types

Registry-specific errors should map into Kernel API contracts.

Recommended errors:

```ts
MODULE_NOT_REGISTERED
MODULE_NOT_ENABLED
MODULE_DEPENDENCY_MISSING
MODULE_DEPENDENCY_ACTIVE
MODULE_INCOMPATIBLE
MODULE_LIMIT_REACHED
MODULE_PROVISION_FAILED
MODULE_MANIFEST_INVALID
MODULE_PERMISSION_REQUIRED
```

API response examples:

```json
{
  "data": null,
  "error": {
    "code": "MODULE_NOT_ENABLED",
    "message": "Module is not enabled for this organization."
  }
}
```

For normal user module access, prefer safe `MODULE_NOT_FOUND`.

For admin settings endpoints, more specific errors are acceptable.

---

# 27. Testing Requirements

The module loader and registry are security-sensitive. Tests must prove behavior, not just function existence.

## 27.1 Manifest Validation Tests

Must test:

```txt
valid manifest passes
duplicate module IDs fail
invalid module ID fails
reserved module ID fails
missing compatibility fails
wildcard manifest permission fails
wrong permission namespace fails
invalid nav href fails
missing nav permission fails
invalid event name fails
unknown dependency fails
circular dependency fails
incompatible module fails
```

## 27.2 Registry Tests

Must test:

```txt
getAll returns registered modules
getById returns correct module
unknown module returns null
registry is immutable
invalid manifests fail construction
dependency graph is computed correctly
```

## 27.3 Enablement Tests

Use at least two organizations.

Must test:

```txt
Org A enabled module does not enable it for Org B
disabled module is excluded
unknown module cannot be enabled
missing dependency blocks enablement
enabled dependent module blocks dependency disablement
subscription maxModules is enforced
suspended org blocks module use
```

## 27.4 Visibility Tests

Must test:

```txt
enabled module hidden if user lacks nav permission
enabled module visible if user has nav permission
nav item hidden if user lacks item permission
admin wildcard permission sees allowed module nav
admin wildcard does not bypass tenant isolation
```

## 27.5 Route/API Guard Tests

Must test:

```txt
unauthenticated module API returns 401 JSON
wrong-org module API returns safe 404
disabled module API returns safe 404
enabled module without permission returns 403
enabled module with permission succeeds
client-supplied orgId is rejected
```

## 27.6 Generator Tests

The module generator must produce:

```txt
manifest registered in src/modules/index.ts
valid manifest
valid permissions
valid nav hrefs
valid API paths
tenant-safe API route pattern
PlatformContext service pattern
security test skeletons
```

---

# 28. Check Commands

The project should eventually include:

```bash
npm run check:modules
npm run check:architecture
npm run test:run
npm run typecheck
npm run build
```

`check:modules` should validate:

```txt
module manifest schema
dependency graph
compatibility windows
reserved module IDs
permission declarations
event naming
nav hrefs
API declarations
provisioning declarations
```

`check:architecture` should validate:

```txt
no @/kernel imports in modules
no raw Prisma imports in modules
no cross-module imports
no sdk.getDb(orgId)
no request query/body orgId usage in module APIs
```

---

# 29. Suggested File Structure

```txt
src/
  kernel/
    modules/
      manifest-schema.ts
      registry.server.ts
      registry-errors.ts
      registry-validation.ts
      dependency-graph.ts
      module-enable.service.ts
      __tests__/
        registry-validation.test.ts
        dependency-graph.test.ts
        module-enable.service.test.ts

  platform/
    module-loader.server.ts
    module-provisioning.server.ts

  modules/
    index.ts
    inventory/
      manifest.ts
      provisioning.server.ts
      service.ts
      schema.ts
      permissions.ts
      events.ts
      __tests__/
```

## 29.1 `src/modules/index.ts`

Generated composition list:

```ts
import { inventoryManifest } from './inventory/manifest'
import { leaveManifest } from './leave/manifest'

export const moduleManifests = [
  inventoryManifest,
  leaveManifest,
] as const
```

## 29.2 `src/platform/module-loader.server.ts`

Composition root:

```ts
import { createModuleRegistry } from '@/kernel/modules/registry.server'
import { moduleManifests } from '@/modules'

export const moduleRegistry = createModuleRegistry(moduleManifests)
```

This file is allowed to import both Kernel registry code and module manifests because it is the composition root.

## 29.3 `src/kernel/modules/registry.server.ts`

Kernel registry implementation.

It should not import specific module manifests.

It receives manifests as input.

---

# 30. Implementation Sketch

This sketch is not final code, but it shows the intended direction.

```ts
export function createModuleRegistry(
  manifests: readonly ModuleManifest[],
  options: ModuleRegistryOptions = {}
): ModuleRegistry {
  const validation = validateModuleManifests(manifests, options)

  if (!validation.ok) {
    throw new ModuleRegistryError(validation.errors)
  }

  const byId = new Map<string, ModuleManifest>()

  for (const manifest of manifests) {
    byId.set(manifest.id, Object.freeze(manifest))
  }

  async function getEnabledForOrg(ctx: PlatformContext) {
    const rows = await ctx.db.orgModule.findMany({
      where: {
        orgId: ctx.org.id,
        isEnabled: true,
      },
      select: {
        moduleId: true,
      },
    })

    const enabledIds = new Set(rows.map((row) => row.moduleId))

    return [...byId.values()].filter((manifest) => enabledIds.has(manifest.id))
  }

  async function assertEnabled(ctx: PlatformContext, moduleId: string) {
    const manifest = byId.get(moduleId)

    if (!manifest) {
      throw new ModuleNotFoundError(moduleId)
    }

    const row = await ctx.db.orgModule.findUnique({
      where: {
        orgId_moduleId: {
          orgId: ctx.org.id,
          moduleId,
        },
      },
    })

    if (!row?.isEnabled) {
      throw new ModuleNotFoundError(moduleId)
    }

    return manifest
  }

  return Object.freeze({
    getAll: () => [...byId.values()],
    getById: (moduleId) => byId.get(moduleId) ?? null,
    has: (moduleId) => byId.has(moduleId),
    getEnabledForOrg,
    assertEnabled,
    validate: () => validation,
  })
}
```

Note:

```txt
ctx.db here means tenant-aware SDK/Kernel DB access derived from PlatformContext.
```

Do not accept loose `orgId`.

---

# 31. Security Rules

The registry is part of the security model.

## 31.1 Never Trust Client-Supplied Module State

Forbidden:

```ts
const moduleId = body.moduleId
const isEnabled = body.isEnabled
```

Client input can request an operation, but the server validates against registry and permissions.

## 31.2 Module ID from Route Is Untrusted

Even though module ID appears in a route, it must be validated.

Example:

```txt
/api/orgs/acme-corp/inventory/products
```

The server must verify:

```txt
inventory is registered
inventory is enabled for acme-corp
current user belongs to acme-corp
current user has permission
```

## 31.3 Enabled Module Does Not Equal Permission

A module enabled for an organization does not mean every user can use it.

Required:

```txt
OrgModule says organization has module
RBAC says user may perform action
```

## 31.4 Admin Wildcard Does Not Bypass Enablement

Even if a user has:

```txt
*.*.*
```

They should not access a business module that is not enabled for the organization.

Order:

```txt
tenant context
organization active
module registered
module enabled
permission
```

## 31.5 Module Enablement Does Not Bypass Subscription

If subscription status is suspended, business module routes should be blocked.

---

# 32. Performance Rules

The registry is small in MVP, so simple in-memory lookup is fine.

However:

```txt
Do not query OrgModule separately for every nav item.
Do not query permissions separately for every nav item.
Do not create N+1 registry/database loops.
```

Preferred:

```txt
load enabled module rows once
load user permissions once
filter nav in memory
```

For a typical sidebar:

```txt
1 query for enabled modules
1 query for user permissions
in-memory filter
```

---

# 33. Observability Rules

The registry should log or expose diagnostics for:

```txt
invalid manifest
incompatible module
module enable failure
module disable failure
missing dependency
provisioning failure
```

Do not log secrets or full request bodies.

A future admin diagnostics page may show:

```txt
registered modules
enabled modules
manifest versions
compatibility status
dependency graph
```

---

# 34. Interaction with AppCare

Because OneDayOS sells AppCare, module enablement must be operationally safe.

AppCare support should be able to answer:

```txt
Which modules does this organization have enabled?
When was Inventory enabled?
Who enabled it?
Why is Leave not visible to this user?
Which dependency is missing?
Is the org over its module limit?
```

This does not require a full admin UI in MVP, but the data model and services should support these questions.

---

# 35. Claude Implementation Rules

When Claude implements this subsystem, it must follow these rules:

```txt
1. Do not implement dynamic remote plugin loading.
2. Do not use FastAPI.
3. Do not use runtime filesystem scanning.
4. Do not let manifests self-register as side effects.
5. Do not let module manifests import @/sdk/server or @/kernel/*.
6. Do not allow wildcard permissions in module manifests.
7. Do not accept client-supplied orgId.
8. Do not expose disabled modules to normal users.
9. Do not confuse module enablement with user permission.
10. Do not allow direct module-to-module imports.
11. Do not skip dependency validation.
12. Do not skip circular dependency tests.
13. Do not implement marketplace behavior.
14. Do not implement per-org module version pinning.
15. Do not delete module data when disabling a module.
```

---

# 36. Claude Implementation Prompt

Use this prompt when this document is frozen:

```md
You are implementing the OneDayOS Module Loader & Registry.

Authoritative document:
docs/engineering-manual/08-module-system/02-module-loader-registry.md

Relevant frozen dependencies:
- 08-module-system/01-module-manifest.md
- 05-sdk/01-sdk-public-api.md
- 05-sdk/03-sdk-auth-permissions.md
- 04-kernel/04-authorization-enforcement.md
- 04-kernel/08-kernel-api-contracts.md

Rules:
- Do not invent architecture.
- Do not implement remote plugins or marketplace loading.
- Do not use FastAPI.
- Do not scan the filesystem at runtime.
- Do not let manifests self-register as side effects.
- Do not import @/kernel/* inside modules.
- Do not import raw Prisma inside modules.
- Do not accept client-supplied orgId.
- Use PlatformContext for org-aware operations.
- Module enablement and user permission are separate gates.
- Add tests for manifest validation, dependency graph, two-org enablement, visibility, and route/API guards.
- Stop and report if this document conflicts with existing code.

Task:
Implement only the Module Loader & Registry subsystem described in this document.
```

---

# 37. Acceptance Criteria

This document is implemented correctly when:

```txt
[ ] Module manifests are pure objects.
[ ] src/modules/index.ts exports a static list of module manifests.
[ ] A composition root creates the registry from static manifests.
[ ] The registry validates manifests before use.
[ ] Duplicate module IDs are rejected.
[ ] Reserved module IDs are rejected.
[ ] Invalid permission declarations are rejected.
[ ] Invalid nav hrefs are rejected.
[ ] Invalid event names are rejected.
[ ] Unknown dependencies are rejected.
[ ] Circular dependencies are rejected.
[ ] Incompatible modules fail checks.
[ ] OrgModule controls per-organization enablement.
[ ] Enabled modules for Org A do not affect Org B.
[ ] Disabled modules are blocked from routes/APIs.
[ ] Sidebar only shows nav items the user has permission to see.
[ ] Admin wildcard does not bypass tenant isolation or module enablement.
[ ] Module enablement requires module-management permission.
[ ] Module disabling does not delete module data.
[ ] Module provisioning is idempotent.
[ ] Tests use at least two organizations.
[ ] Generated modules update src/modules/index.ts.
[ ] No module imports @/kernel/*.
[ ] No module imports another module.
[ ] No module API accepts orgId from query/body.
[ ] npm run check:modules exists or is planned with clear TODO.
```

---

# 38. Founder Review Questions

Before freezing this document, answer:

```txt
1. Do we accept static module imports for MVP?
2. Do we agree that manifests should not self-register as side effects?
3. Do we agree that disabled modules should return safe 404 for normal users?
4. Do we want enabledBy/disabledBy fields in OrgModule now or later?
5. Should module provisioning be implemented in MVP or only declared?
6. Should subscription maxModules be enforced immediately?
7. Should check:modules be built before Inventory?
```

---

# 39. Architectural Recommendation

For the restarted platform, implement the registry before any official business module.

Minimum before Inventory:

```txt
static module manifest list
manifest validation
registry creation
OrgModule enablement lookup
module enabled guard
permission-aware nav filtering
forbidden import checks
two-org registry tests
```

Do not wait until after Inventory to build this. Inventory should prove the module system, not bypass it.

---

# 40. Final Rule

```txt
A module being present in the codebase is not permission to use it.
A module being enabled for an organization is not permission for every user to access it.
A user having permission is not permission to access another tenant.
```

The registry must enforce those distinctions.
