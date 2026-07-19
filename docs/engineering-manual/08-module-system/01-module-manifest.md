# OneDayOS Engineering Manual — Module System: Module Manifest

**Document ID:** `08-module-system/01-module-manifest.md`  
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
- `08-module-system/00-module-philosophy.md`

---

## 1. Purpose

This document defines the **Module Manifest** contract for OneDayOS.

A module manifest is the official declaration of what a module is, what it exposes, what it requires, and how the Kernel, SDK, UI shell, permissions system, event bus, future search layer, future AI layer, future generators, and future marketplace should understand it.

The manifest is not decoration.

The manifest is not only sidebar metadata.

The manifest is not an implementation detail.

The manifest is a platform contract.

A OneDayOS module without a valid manifest is not a module. It is just code in a folder.

The manifest allows the platform to answer these questions without reading module internals:

```txt
What is this module?
Can this module run on this platform version?
What other modules must be enabled first?
What Business Objects does it use?
What module-owned entities does it define?
What permissions does it require?
What navigation does it add?
What routes does it expose?
What APIs does it expose?
What events does it emit?
What events does it listen to?
What settings does it support?
What AI context does it provide?
What dashboard widgets does it contribute?
What seed behavior does it need during org provisioning?
```

The manifest exists because OneDayOS is not a collection of hand-built client apps. It is a reusable Business Operating System.

---

## 2. Core Thesis

The central manifest thesis is:

```txt
The manifest is the module's public contract with the platform.
```

Module internals may change.

Services may be refactored.

Pages may be redesigned.

Prisma models may evolve.

But the manifest is how the rest of OneDayOS understands the module.

That means the manifest must be:

```txt
Explicit
Typed
Validated
Stable
Versioned
Declarative
Safe to inspect
Safe for generators
Safe for AI context
Safe for future marketplace use
```

The manifest must not become a dumping ground for executable business logic.

---

## 3. Architectural Position

The module manifest belongs to the **Business Module** layer.

```txt
Kernel
  ↓
Business Objects
  ↓
Platform Services
  ↓
Business Modules
      └── Module Manifest
  ↓
Client Configuration
```

The manifest is consumed by the Kernel and SDK, but it is authored by the module.

This creates an important separation:

```txt
The module declares itself.
The platform validates and loads it.
The client configuration decides whether an org can use it.
```

A manifest does not automatically enable a module for every client.

A manifest says:

```txt
This module exists in the platform codebase.
```

`OrgModule` says:

```txt
This organization has this module enabled.
```

Permissions say:

```txt
This user can perform this action inside this enabled module.
```

All three are required.

---

## 4. Historical Correction from the Kernel v2 Plan

The earlier Kernel v2 implementation plan already introduced an expanded `ModuleManifest` with identity, navigation, permissions, events, fields, dashboard widgets, AI context, documentation, dependencies, version, and seed behavior.

That was directionally correct.

However, the restarted build should tighten the design in five ways.

### 4.1 Use Full Permission Objects, Not Action Strings

Older shape:

```ts
permissions: ['create', 'read', 'update', 'delete']
```

New shape:

```ts
permissions: [
  {
    module: 'inventory',
    resource: 'stock_movement',
    action: 'create',
    label: 'Create stock movement',
    description: 'Allows the user to record stock movement entries.',
  },
]
```

Reason:

Action-only permissions are too vague for a platform.

OneDayOS permissions are `{ module, resource, action }` contracts.

### 4.2 Use Compatibility Windows, Not a Single Kernel Version

Older shape:

```ts
kernelVersion: '1.0.0'
```

New shape:

```ts
compatibility: {
  platform: { min: '0.1.0', max: null },
  sdk: { min: '0.1.0', max: null },
  manifest: '1',
}
```

Reason:

A single `kernelVersion` string is too weak for future module compatibility.

The platform, SDK, and manifest schema are separate compatibility surfaces.

### 4.3 Keep Manifest Metadata Declarative

The earlier plan allowed this:

```ts
seed?: (orgId: string) => Promise<void>
```

The restarted build should avoid putting executable hooks directly inside the manifest object.

New rule:

```txt
The manifest declares seed behavior.
Server-only module hooks implement seed behavior.
```

Reason:

A pure manifest is easier to validate, serialize, inspect, test, display in admin UI, expose to future marketplace tooling, and feed safely into AI context.

Server-only executable behavior belongs in a separate module hook file and must use `PlatformContext`, not `orgId`.

### 4.4 Use `PlatformContext`, Not `orgId`

Older implementation patterns sometimes passed `orgId` directly.

New pattern:

```ts
seed(ctx: PlatformContext): Promise<void>
service.list(ctx): Promise<Result>
events.emit(ctx, event): Promise<void>
```

Reason:

A verified `PlatformContext` proves authentication, organization membership, module enablement, and authorization boundaries before module work happens.

Loose `orgId` strings recreate the tenant-isolation risks that the restarted build is designed to prevent.

### 4.5 Separate Registration from Enablement

A registered manifest means the module is known to the platform.

It does not mean every organization can use it.

Enablement is controlled by `OrgModule` and subscription/feature rules.

---

## 5. Definition

A Module Manifest is a typed, validated, declarative object exported by each module.

Required location:

```txt
src/modules/[moduleId]/manifest.ts
```

Example:

```txt
src/modules/inventory/manifest.ts
src/modules/leave/manifest.ts
src/modules/crm/manifest.ts
```

Required export:

```ts
export const inventoryManifest: ModuleManifest = { ... }
```

Recommended barrel:

```txt
src/modules/[moduleId]/index.ts
```

Recommended server hook location:

```txt
src/modules/[moduleId]/server.ts
```

Recommended schema location:

```txt
src/modules/[moduleId]/schema.ts
```

Recommended registration location:

```txt
src/modules/index.server.ts
```

The manifest should be importable without initializing Prisma, reading request cookies, creating Supabase clients, calling external services, or executing module business logic.

---

## 6. Manifest Non-Goals

The manifest must not do these things:

```txt
Create database records
Run migrations
Perform permission checks
Fetch client data
Read request cookies
Call Supabase
Import raw Prisma
Import @/kernel/*
Import from another module
Execute background jobs
Contain full workflow logic
Contain secrets
Contain client-specific configuration
Contain arbitrary executable business logic
```

The manifest describes the module.

It does not run the module.

---

## 7. Manifest File Boundary

### 7.1 Allowed Imports

A module manifest may import:

```ts
import type { ModuleManifest } from '@/sdk'
import { defineModuleManifest } from '@/sdk'
```

A module manifest may import local static constants if they are safe:

```ts
import { inventoryPermissionDefinitions } from './permissions'
```

But this is allowed only if the imported file is also data-only and does not import server runtime code.

### 7.2 Forbidden Imports

A module manifest must not import:

```ts
import { prisma } from '@/kernel/db/client'
import { sdk } from '@/sdk/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/kernel/auth/server'
import { LeaveService } from '@/modules/leave/service'
import { InventoryService } from './service'
```

The manifest must stay declarative.

### 7.3 Why Service Imports Are Forbidden

This is forbidden:

```ts
import { InventoryService } from './service'

export const inventoryManifest = {
  seed: InventoryService.seed,
}
```

Reason:

It makes manifest import trigger service import, which can pull in server-only SDK, Prisma, environment variables, and other runtime concerns.

That breaks the manifest as metadata.

The correct pattern is:

```ts
// manifest.ts
export const inventoryManifest = defineModuleManifest({
  id: 'inventory',
  provisioning: {
    hasSeed: true,
    seedHook: 'seedInventoryModule',
  },
})
```

```ts
// server.ts
export async function seedInventoryModule(ctx: PlatformContext) {
  // server-only implementation
}
```

---

## 8. Required Manifest Shape

The official manifest type is:

```ts
export type ModuleManifest = {
  schemaVersion: '1'

  identity: ModuleIdentity
  lifecycle: ModuleLifecycle
  compatibility: ModuleCompatibility
  dependencies: ModuleDependency[]

  businessObjects: ModuleBusinessObjectUsage
  entities: ModuleEntityDefinition[]

  permissions: ModulePermissionDefinition[]
  navigation: ModuleNavigation
  routes: ModuleRouteDefinition[]
  api: ModuleApiDefinition[]

  events: ModuleEventContract
  settings: ModuleSettingDefinition[]

  dashboard?: ModuleDashboardDefinition
  ai?: ModuleAiContextDefinition
  docs?: ModuleDocsDefinition
  provisioning?: ModuleProvisioningDefinition
  generator?: ModuleGeneratorHints
}
```

This looks large, but most sections are short and declarative.

A module with no settings, dashboard widgets, AI context, or provisioning can use empty arrays or omit optional sections.

The manifest should be easy for a generator to create.

---

## 9. Module Identity

### 9.1 Type

```ts
export type ModuleIdentity = {
  id: ModuleId
  label: string
  shortLabel?: string
  description: string
  category: ModuleCategory
  icon: LucideIconName
  colorToken?: string
  owner: ModuleOwner
  tags?: string[]
}
```

### 9.2 `id`

The module ID is the stable platform identifier.

Rules:

```txt
lowercase only
kebab-case allowed
must start with a letter
must not contain spaces
must not be renamed casually
must be unique across the platform
must match route namespace by default
```

Valid:

```txt
inventory
leave
crm
purchasing
visitor-management
incident-reporting
```

Invalid:

```txt
Inventory
inventory_app
inventory app
client-a-inventory
inventory-v2
```

The module ID appears in:

```txt
Manifest identity
URLs
API routes
Permission namespace
Event namespace
OrgModule records
Settings namespace
Test fixtures
Future marketplace identifiers
```

Renaming a module ID is a breaking change and requires an ADR.

### 9.3 `label`

The label is the human-readable product name.

Example:

```txt
Inventory
Leave Management
Visitor Management
Incident Reporting
```

The label may change without a database migration if it does not change the module ID.

### 9.4 `shortLabel`

Optional shorter label for narrow navigation.

Example:

```txt
Leave Management → Leave
Visitor Management → Visitors
Incident Reporting → Incidents
```

### 9.5 `description`

The description must explain the module in one or two sentences.

Bad:

```txt
Manages inventory.
```

Better:

```txt
Tracks stock levels, stock movements, warehouse balances, and inventory adjustments across an organization's operational locations.
```

### 9.6 `category`

Allowed categories:

```ts
export type ModuleCategory =
  | 'operations'
  | 'sales'
  | 'hr'
  | 'finance'
  | 'assets'
  | 'service'
  | 'compliance'
  | 'admin'
```

Category is used for future admin module selection, marketplace browsing, and onboarding recommendations.

### 9.7 `icon`

Icons must use approved Lucide icon names.

The manifest should store the icon as a string:

```ts
icon: 'Package'
```

Do not store the component itself:

```ts
icon: Package // forbidden
```

Reason:

String names are serializable, inspectable, and safe for future admin UI or marketplace metadata.

### 9.8 `colorToken`

Optional design-system token.

Example:

```ts
colorToken: 'module.inventory'
```

Do not hard-code hex colors in manifests.

Bad:

```ts
color: '#F97316'
```

Good:

```ts
colorToken: 'module.inventory'
```

### 9.9 `owner`

```ts
export type ModuleOwner = {
  type: 'onedayos' | 'partner' | 'client-specific'
  name: string
}
```

MVP should use:

```ts
owner: {
  type: 'onedayos',
  name: 'OneDayOS',
}
```

`client-specific` is allowed only for future controlled enterprise extensions, not MVP.

---

## 10. Lifecycle

### 10.1 Type

```ts
export type ModuleLifecycle = {
  status: ModuleLifecycleStatus
  maturity: ModuleMaturity
  introducedIn: PlatformVersion
  deprecatedIn?: PlatformVersion | null
  removedIn?: PlatformVersion | null
}

export type ModuleLifecycleStatus =
  | 'planned'
  | 'experimental'
  | 'active'
  | 'deprecated'
  | 'removed'

export type ModuleMaturity =
  | 'prototype'
  | 'mvp'
  | 'stable'
  | 'legacy'
```

### 10.2 MVP Defaults

For the first official Inventory module:

```ts
lifecycle: {
  status: 'experimental',
  maturity: 'mvp',
  introducedIn: '0.1.0',
  deprecatedIn: null,
  removedIn: null,
}
```

Do not mark modules as `stable` until they have been used in real client delivery and passed production readiness checks.

### 10.3 `planned`

A planned module may exist in the roadmap but should not appear in navigation or admin enablement unless explicitly configured for internal preview.

### 10.4 `experimental`

An experimental module may be used by early clients, but must be clearly labeled internally.

### 10.5 `active`

An active module is approved for normal client delivery.

### 10.6 `deprecated`

Deprecated modules remain available for existing clients but should not be enabled for new clients.

### 10.7 `removed`

Removed modules should not be loaded.

A removed module manifest may remain temporarily only to support migration tooling.

---

## 11. Compatibility

### 11.1 Type

```ts
export type ModuleCompatibility = {
  platform: CompatibilityWindow
  sdk: CompatibilityWindow
  manifest: '1'
}

export type CompatibilityWindow = {
  min: string
  max: string | null
}
```

Example:

```ts
compatibility: {
  platform: { min: '0.1.0', max: null },
  sdk: { min: '0.1.0', max: null },
  manifest: '1',
}
```

### 11.2 Why This Exists

OneDayOS is currently one codebase and one platform deployment.

But modules still need compatibility metadata because future marketplace modules, module generators, migration tooling, and release processes need to know what each module expects.

### 11.3 MVP Rule

Do not add a semver range parsing dependency for MVP.

Use simple compatibility checks:

```txt
module.compatibility.platform.min <= currentPlatformVersion
module.compatibility.sdk.min <= currentSdkVersion
module.compatibility.manifest === supportedManifestSchemaVersion
```

`max` may be `null` until there is a known upper bound.

### 11.4 Incompatible Modules

If a module is incompatible, the registry must not silently load it as normal.

Allowed MVP behavior:

```txt
development: warn loudly
production: do not enable for orgs
```

The exact behavior should be defined in `08-module-system/02-module-loader-registry.md`.

---

## 12. Dependencies

### 12.1 Type

```ts
export type ModuleDependency = {
  moduleId: string
  reason: string
  required: boolean
}
```

Example:

```ts
dependencies: [
  {
    moduleId: 'purchasing',
    required: false,
    reason: 'Inventory can receive stock from purchase orders when Purchasing is enabled.',
  },
]
```

### 12.2 Dependency Meaning

A dependency means:

```txt
This module requires or can integrate with another enabled module.
```

A dependency does **not** mean:

```txt
This module may import code from that module.
```

Modules still may not import other modules directly.

### 12.3 Required Dependencies

If a module declares a required dependency, the platform must not enable the module for an organization unless the dependency is also enabled.

Example:

```ts
dependencies: [
  {
    moduleId: 'crm',
    required: true,
    reason: 'Customer Support requires CRM customer profiles in MVP.',
  },
]
```

### 12.4 Optional Dependencies

Optional dependencies allow integration when both modules are enabled.

Example:

```txt
Inventory works without Purchasing.
If Purchasing is enabled, Inventory may listen to purchasing.purchase_order.received events.
```

### 12.5 Business Objects Are Not Module Dependencies

Using `Product`, `Customer`, `Supplier`, `Warehouse`, or `Employee` is not a module dependency.

Business Object usage is declared separately.

Example:

```ts
businessObjects: {
  uses: [
    { object: 'product', operations: ['read', 'create', 'update'] },
    { object: 'warehouse', operations: ['read'] },
  ],
  extends: [
    { object: 'product', table: 'inventory_product_extensions' },
  ],
}
```

Inventory uses Product.

Inventory does not depend on a Product module.

There is no Product module.

Product is a Business Object.

### 12.6 Circular Dependencies

Circular required dependencies are forbidden.

Forbidden:

```txt
Inventory requires Purchasing
Purchasing requires Inventory
```

Optional bidirectional integration through events is allowed if both modules remain independently usable.

---

## 13. Business Object Usage

### 13.1 Type

```ts
export type ModuleBusinessObjectUsage = {
  uses: ModuleBusinessObjectUse[]
  extends: ModuleBusinessObjectExtension[]
}

export type ModuleBusinessObjectUse = {
  object: BusinessObjectKey
  operations: BusinessObjectOperation[]
  reason: string
}

export type BusinessObjectKey =
  | 'employee'
  | 'product'
  | 'product_category'
  | 'customer'
  | 'supplier'
  | 'warehouse'

export type BusinessObjectOperation =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'deactivate'
  | 'reactivate'

export type ModuleBusinessObjectExtension = {
  object: BusinessObjectKey
  table: string
  relation: 'one_to_one' | 'one_to_many'
  reason: string
}
```

### 13.2 Example: Inventory

```ts
businessObjects: {
  uses: [
    {
      object: 'product',
      operations: ['read', 'create', 'update'],
      reason: 'Inventory tracks stock behavior around shared Products.',
    },
    {
      object: 'warehouse',
      operations: ['read'],
      reason: 'Inventory stores balances by shared Warehouse.',
    },
    {
      object: 'supplier',
      operations: ['read'],
      reason: 'Inventory may display supplier-linked stock context when configured.',
    },
  ],
  extends: [
    {
      object: 'product',
      table: 'inventory_product_extensions',
      relation: 'one_to_one',
      reason: 'Inventory-specific product fields such as reorder point and minimum stock do not belong in core Product.',
    },
  ],
}
```

### 13.3 Why This Matters

Business Object usage declarations prevent modules from duplicating shared entities.

If Claude tries to create:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
```

The manifest contract should make that obviously wrong unless those are explicitly extension tables and named as such.

Correct:

```txt
Product
InventoryProductExtension
```

Incorrect:

```txt
InventoryProduct
```

unless the record is not actually a Product identity but a module-owned transactional entity.

---

## 14. Module-Owned Entities

### 14.1 Type

```ts
export type ModuleEntityDefinition = {
  key: string
  label: string
  table: string
  description: string
  tenantScoped: true
  softDelete: boolean
  primaryDisplayField: string
  permissions: {
    read: PermissionRef
    create?: PermissionRef
    update?: PermissionRef
    delete?: PermissionRef
    restore?: PermissionRef
  }
}

export type PermissionRef = `${string}.${string}.${string}`
```

### 14.2 Example: Inventory

```ts
entities: [
  {
    key: 'stock_movement',
    label: 'Stock Movement',
    table: 'inventory_stock_movements',
    description: 'Immutable record of stock entering, leaving, or moving between warehouses.',
    tenantScoped: true,
    softDelete: false,
    primaryDisplayField: 'referenceNo',
    permissions: {
      read: 'inventory.stock_movement.read',
      create: 'inventory.stock_movement.create',
    },
  },
  {
    key: 'inventory_adjustment',
    label: 'Inventory Adjustment',
    table: 'inventory_adjustments',
    description: 'Correction entry used to adjust stock balance after a count or discrepancy.',
    tenantScoped: true,
    softDelete: true,
    primaryDisplayField: 'adjustmentNo',
    permissions: {
      read: 'inventory.inventory_adjustment.read',
      create: 'inventory.inventory_adjustment.create',
      update: 'inventory.inventory_adjustment.update',
      delete: 'inventory.inventory_adjustment.delete',
      restore: 'inventory.inventory_adjustment.restore',
    },
  },
]
```

### 14.3 Entity Rules

Every module-owned entity must be:

```txt
Tenant-scoped
Permission-scoped
Service-owned
API-contract-backed
Tested with at least two organizations
Declared in the manifest
```

Every tenant-scoped entity table must include:

```txt
id
orgId
createdAt
updatedAt when mutable
deletedAt/deletedBy when soft-deletable
```

### 14.4 Entity Names

Entity keys use snake_case.

Valid:

```txt
stock_movement
inventory_adjustment
leave_request
purchase_order
incident_report
```

Invalid:

```txt
StockMovement
stockMovement
movement
inventoryProduct
```

Event names use these entity keys.

Example:

```txt
inventory.stock_movement.created
```

---

## 15. Permissions

### 15.1 Type

```ts
export type ModulePermissionDefinition = {
  module: string
  resource: string
  action: PermissionAction
  key: PermissionKey
  label: string
  description: string
  risk: PermissionRisk
  grants?: PermissionKey[]
}

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'restore'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'configure'

export type PermissionRisk = 'low' | 'medium' | 'high' | 'critical'

export type PermissionKey = `${string}.${string}.${PermissionAction}`
```

### 15.2 Permission Key Format

Permission keys must follow:

```txt
{module}.{resource}.{action}
```

Examples:

```txt
inventory.stock_movement.read
inventory.stock_movement.create
inventory.inventory_adjustment.approve
leave.leave_request.read
crm.deal.update
objects.product.create
```

### 15.3 Module Permissions vs Business Object Permissions

Module permissions do not replace Business Object permissions.

Example:

Creating an Inventory Product setup from inside Inventory may require:

```txt
objects.product.create
inventory.product_extension.create
```

Reason:

Creating the shared Product identity is a Business Object action.

Creating Inventory-specific product settings is an Inventory action.

### 15.4 Read Permissions

Every module must define at least one read permission.

Example:

```ts
{
  module: 'inventory',
  resource: 'stock_level',
  action: 'read',
  key: 'inventory.stock_level.read',
  label: 'View stock levels',
  description: 'Allows the user to view current stock balances.',
  risk: 'low',
}
```

### 15.5 Dangerous Permissions

Dangerous permissions must be marked `high` or `critical`.

Examples:

```txt
inventory.inventory_adjustment.approve
inventory.stock_movement.delete
expenses.expense_claim.approve
settings.module.configure
```

This helps future admin UI explain permission impact.

### 15.6 Permission Grants

`grants` is optional and should be used sparingly.

Example:

```ts
{
  key: 'inventory.admin.configure',
  module: 'inventory',
  resource: 'admin',
  action: 'configure',
  label: 'Configure Inventory',
  description: 'Allows the user to configure inventory settings and operational rules.',
  risk: 'critical',
  grants: [
    'inventory.stock_level.read',
    'inventory.stock_movement.read',
  ],
}
```

MVP does not need automatic `grants` expansion unless implemented deliberately.

If not implemented, `grants` is documentation metadata only.

### 15.7 Wildcard Permissions

Wildcard permissions such as `*.*.*` are Kernel/RBAC behavior.

Module manifests must not define wildcard permissions.

Forbidden in module manifest:

```ts
{
  module: '*',
  resource: '*',
  action: '*',
}
```

Admin roles may receive wildcard permissions through Kernel seed/provisioning, not through module manifests.

### 15.8 Conditions

Conditional permissions are deferred.

The manifest must not define active ABAC conditions in MVP.

Forbidden for MVP:

```ts
conditions: { scope: 'own_branch' }
```

Reason:

The approved RBAC model denies non-null conditions until a real ABAC evaluator exists.

---

## 16. Navigation

### 16.1 Type

```ts
export type ModuleNavigation = {
  primary: ModuleNavItem[]
  secondary?: ModuleNavItem[]
}

export type ModuleNavItem = {
  key: string
  label: string
  href: string
  icon?: LucideIconName
  requiredPermission: PermissionKey
  exact?: boolean
  order?: number
  children?: ModuleNavItem[]
}
```

### 16.2 Href Rules

Module navigation hrefs are relative to the organization shell.

Correct:

```ts
href: '/inventory/stock-levels'
```

The platform renders:

```txt
/[orgSlug]/inventory/stock-levels
```

Forbidden:

```ts
href: '/acme-corp/inventory/stock-levels'
href: 'https://client-a.com/inventory'
href: '/api/orgs/acme-corp/inventory'
```

Do not hard-code org slugs.

### 16.3 Active Matching

Each nav item should declare whether it uses exact matching.

Example:

```ts
{
  key: 'inventory.stock_levels',
  label: 'Stock Levels',
  href: '/inventory/stock-levels',
  exact: false,
}
```

The app shell must not use unsafe prefix matching that causes:

```txt
/inventory matches /inventory-audit
```

The exact active matching behavior belongs in Design/Layout and Module Navigation docs, but manifest should provide enough metadata.

### 16.4 Permission-Aware Navigation

Every nav item must have a `requiredPermission`.

The sidebar should hide nav items the user cannot access.

But hiding a nav item is not security.

The route and API must still enforce permission.

### 16.5 Empty Navigation

A module may have zero primary nav items only if it is a background/integration module.

For normal business modules, at least one primary nav item is required.

### 16.6 Example

```ts
navigation: {
  primary: [
    {
      key: 'inventory.dashboard',
      label: 'Inventory',
      href: '/inventory',
      icon: 'Package',
      requiredPermission: 'inventory.dashboard.read',
      exact: true,
      order: 10,
    },
    {
      key: 'inventory.stock_levels',
      label: 'Stock Levels',
      href: '/inventory/stock-levels',
      icon: 'Boxes',
      requiredPermission: 'inventory.stock_level.read',
      exact: false,
      order: 20,
    },
  ],
}
```

---

## 17. Routes

### 17.1 Type

```ts
export type ModuleRouteDefinition = {
  key: string
  path: string
  type: 'page'
  title: string
  requiredPermission: PermissionKey
  layout?: 'list' | 'detail' | 'form' | 'dashboard' | 'settings' | 'custom'
}
```

### 17.2 Route Path Rules

Page route paths are relative to the organization shell.

Correct:

```txt
/inventory
/inventory/stock-levels
/inventory/adjustments/new
/inventory/settings
```

Rendered as:

```txt
/[orgSlug]/inventory
/[orgSlug]/inventory/stock-levels
/[orgSlug]/inventory/adjustments/new
/[orgSlug]/inventory/settings
```

### 17.3 Required Permission

Every page route must declare a required permission.

Even pages that only display empty states must be permission-protected.

### 17.4 Module Enablement

Every module route requires:

```txt
authenticated user
verified tenant membership
organization active
module enabled
required permission
```

The manifest declares the required permission.

The route implementation enforces it through SDK helpers.

---

## 18. API Definitions

### 18.1 Type

```ts
export type ModuleApiDefinition = {
  key: string
  method: HttpMethod
  path: string
  description: string
  requiredPermission: PermissionKey
  requestSchema?: string
  responseSchema?: string
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
```

### 18.2 API Path Rules

Module API paths are relative to the organization API namespace.

Correct manifest path:

```ts
path: '/inventory/stock-levels'
```

Actual API route:

```txt
/api/orgs/[orgSlug]/inventory/stock-levels
```

Forbidden:

```txt
/api/inventory?orgId=...
/api/inventory/[id]
/api/kernel/inventory
```

Tenant-scoped module APIs must always live under:

```txt
/api/orgs/[orgSlug]/[moduleId]/...
```

### 18.3 `orgId` Rule

API definitions must not mention `orgId` as an input field.

Forbidden:

```ts
requestSchema: 'CreateInventoryRecordWithOrgIdSchema'
```

Correct:

```ts
requestSchema: 'CreateInventoryAdjustmentSchema'
```

The server derives tenant identity from `orgSlug` plus authenticated user membership and creates `PlatformContext`.

### 18.4 Schema References

The manifest references schema names as strings.

Example:

```ts
requestSchema: 'CreateInventoryAdjustmentSchema'
responseSchema: 'InventoryAdjustmentResponseSchema'
```

The manifest should not import Zod schemas directly if doing so pulls in runtime/server code.

Zod schemas remain in module schema files.

### 18.5 Example

```ts
api: [
  {
    key: 'inventory.stock_levels.list',
    method: 'GET',
    path: '/inventory/stock-levels',
    description: 'List current stock balances for the organization.',
    requiredPermission: 'inventory.stock_level.read',
    responseSchema: 'InventoryStockLevelListResponseSchema',
  },
  {
    key: 'inventory.adjustments.create',
    method: 'POST',
    path: '/inventory/adjustments',
    description: 'Create a new inventory adjustment.',
    requiredPermission: 'inventory.inventory_adjustment.create',
    requestSchema: 'CreateInventoryAdjustmentSchema',
    responseSchema: 'InventoryAdjustmentResponseSchema',
  },
]
```

---

## 19. Events

### 19.1 Type

```ts
export type ModuleEventContract = {
  emits: ModuleEventDefinition[]
  listens: ModuleEventListenerDefinition[]
}

export type ModuleEventDefinition = {
  name: EventName
  description: string
  payloadSchema: string
  timing: 'after_commit' | 'after_mutation'
}

export type ModuleEventListenerDefinition = {
  name: EventName
  reason: string
  handler: string
}

export type EventName = `${string}.${string}.${string}`
```

### 19.2 Event Naming

Events must follow:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Examples:

```txt
inventory.stock_movement.created
inventory.inventory_adjustment.approved
leave.leave_request.submitted
crm.deal.won
objects.product.created
objects.customer.updated
```

### 19.3 Facts, Not Commands

Events are facts that something happened.

Correct:

```txt
inventory.stock_level.low
purchasing.purchase_order.received
objects.product.created
```

Incorrect:

```txt
inventory.reorder_product
send_notification
update_search_index
```

Command-like behavior belongs in service calls or future workflow/job systems, not event names.

### 19.4 Module Events vs Business Object Events

If the event is about a shared Business Object, use `objects.*`.

Correct:

```txt
objects.product.created
```

Incorrect:

```txt
inventory.product.created
```

Inventory-specific product extension event:

```txt
inventory.product_extension.created
```

### 19.5 Event Payload Schema

The manifest references payload schema names as strings.

Example:

```ts
{
  name: 'inventory.stock_movement.created',
  description: 'Emitted after a stock movement is recorded.',
  payloadSchema: 'InventoryStockMovementCreatedPayloadSchema',
  timing: 'after_commit',
}
```

The schema should live in:

```txt
src/modules/[moduleId]/events.ts
```

or:

```txt
src/modules/[moduleId]/schema.ts
```

### 19.6 Event Listener Handlers

Listener handlers are declared by name.

Example:

```ts
listens: [
  {
    name: 'purchasing.purchase_order.received',
    reason: 'Inventory creates stock movement records when received purchase orders affect stock.',
    handler: 'handlePurchaseOrderReceived',
  },
]
```

The actual handler lives in a server-only module file:

```txt
src/modules/inventory/server.ts
```

### 19.7 Listener Rule

A listener declaration does not allow direct imports from the emitting module.

Inventory may listen to `purchasing.purchase_order.received`, but Inventory still must not import Purchasing services or types directly.

Shared event payload schemas should be exposed through SDK event contracts or generated type packages in the future.

For MVP, keep payloads small and stable.

---

## 20. Settings

### 20.1 Type

```ts
export type ModuleSettingDefinition = {
  key: string
  label: string
  description: string
  valueType: SettingValueType
  defaultValue: unknown
  requiredPermission: PermissionKey
  schema?: string
  category?: string
}

export type SettingValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'json'
  | 'enum'
```

### 20.2 Key Rules

Setting keys use dot notation within the module namespace.

Examples:

```txt
inventory.allow_negative_stock
inventory.default_unit
inventory.reorder_alert_enabled
leave.default_annual_leave_days
crm.default_pipeline_id
```

### 20.3 Storage

Settings are stored in the Kernel `Setting` table:

```txt
orgId
module
key
value
```

The manifest defines what settings exist.

Client configuration stores per-org values.

### 20.4 Required Permission

Every setting must declare a permission required to change it.

Example:

```ts
requiredPermission: 'inventory.settings.configure'
```

### 20.5 MVP Rule

Do not overbuild settings.

Only define settings that the first real module needs.

Do not create a settings framework more powerful than the module requirements justify.

---

## 21. Dashboard

### 21.1 Type

```ts
export type ModuleDashboardDefinition = {
  widgets: ModuleDashboardWidget[]
}

export type ModuleDashboardWidget = {
  key: string
  label: string
  type: 'stat' | 'list' | 'chart' | 'table'
  description: string
  requiredPermission: PermissionKey
  dataSource: string
}
```

### 21.2 Data Source Rule

`dataSource` is a symbolic reference, not an arbitrary URL.

Good:

```ts
dataSource: 'inventory.dashboard.lowStockCount'
```

Bad:

```ts
dataSource: '/api/orgs/acme-corp/inventory/low-stock'
```

Reason:

The dashboard engine should resolve data sources through SDK/server handlers using `PlatformContext`.

### 21.3 MVP Rule

Dashboard widgets may be declared before the dashboard engine is fully dynamic.

But do not build a full dashboard widget platform before the first module proves the pattern.

---

## 22. AI Context

### 22.1 Type

```ts
export type ModuleAiContextDefinition = {
  summary: string
  businessPurpose: string
  commonQuestions: string[]
  commonActions: ModuleAiActionHint[]
  vocabulary: ModuleVocabularyTerm[]
  safetyNotes: string[]
}

export type ModuleAiActionHint = {
  label: string
  description: string
  requiredPermission: PermissionKey
  destructive: boolean
}

export type ModuleVocabularyTerm = {
  term: string
  meaning: string
}
```

### 22.2 AI Context Rules

AI context must be general module knowledge.

It must not include:

```txt
Client data
Secrets
Raw SQL
Service role keys
Internal debugging notes
Unapproved business advice
Prompt injection instructions
```

### 22.3 Permission Rule

Every AI action hint must reference a permission.

Example:

```ts
{
  label: 'Create stock adjustment',
  description: 'Create a draft stock adjustment for review.',
  requiredPermission: 'inventory.inventory_adjustment.create',
  destructive: false,
}
```

AI must never bypass module permissions.

### 22.4 Example

```ts
ai: {
  summary: 'Inventory tracks stock levels, movements, and adjustments across warehouses.',
  businessPurpose: 'Helps SMEs know what products are available, where they are stored, and when stock is low.',
  commonQuestions: [
    'Which products are low stock?',
    'What moved in or out this week?',
    'Which warehouse has the most stock for this item?',
  ],
  commonActions: [
    {
      label: 'Draft stock adjustment',
      description: 'Prepare a stock adjustment record for user confirmation.',
      requiredPermission: 'inventory.inventory_adjustment.create',
      destructive: false,
    },
  ],
  vocabulary: [
    { term: 'Stock movement', meaning: 'A record of stock entering, leaving, or transferring between locations.' },
    { term: 'Stock adjustment', meaning: 'A correction made after a stock count or discrepancy.' },
  ],
  safetyNotes: [
    'Do not change stock balances without explicit user confirmation.',
    'Do not expose data from another organization.',
  ],
}
```

---

## 23. Documentation

### 23.1 Type

```ts
export type ModuleDocsDefinition = {
  overview: string
  setupGuide?: string
  userGuide?: string
  adminGuide?: string
  changelog?: string
}
```

### 23.2 Path Rules

Docs paths should be repository-relative.

Example:

```ts
docs: {
  overview: 'docs/modules/inventory/overview.md',
  setupGuide: 'docs/modules/inventory/setup.md',
  userGuide: 'docs/modules/inventory/user-guide.md',
}
```

Do not point to unstable external URLs for core documentation.

---

## 24. Provisioning

### 24.1 Type

```ts
export type ModuleProvisioningDefinition = {
  hasSeed: boolean
  seedHook?: string
  createsDefaultSettings?: boolean
  createsDefaultRoles?: boolean
  requiresPostEnableSetup?: boolean
}
```

### 24.2 Why Not a Function in the Manifest

This is intentionally not allowed:

```ts
seed: async (orgId) => { ... }
```

Reason:

The manifest should be metadata.

Executable seed behavior belongs in a server-only hook.

Correct:

```ts
provisioning: {
  hasSeed: true,
  seedHook: 'seedInventoryModule',
  createsDefaultSettings: true,
  createsDefaultRoles: false,
  requiresPostEnableSetup: true,
}
```

```ts
// src/modules/inventory/server.ts
export async function seedInventoryModule(ctx: PlatformContext) {
  // create module defaults using sdk.getDb(ctx)
}
```

### 24.3 Seed Context Rule

Seed hooks must receive verified `PlatformContext`.

Forbidden:

```ts
seed(orgId: string)
```

Correct:

```ts
seed(ctx: PlatformContext)
```

### 24.4 Idempotency

Module seed hooks must be idempotent.

Running the same module seed twice for the same organization must not duplicate records.

---

## 25. Generator Hints

### 25.1 Type

```ts
export type ModuleGeneratorHints = {
  generatedBy?: string
  generatedAt?: string
  generatorVersion?: string
  editableZones?: string[]
}
```

### 25.2 Purpose

Generator hints are optional metadata that help future OneDayOS generators understand how the module was created.

Example:

```ts
generator: {
  generatedBy: 'onedayos-module-generator',
  generatedAt: '2026-07-05',
  generatorVersion: '0.1.0',
  editableZones: [
    'service-methods',
    'ui-copy',
    'business-rules',
  ],
}
```

### 25.3 Claude Rule

Claude must not use generator hints to bypass the manual.

Generator hints are metadata, not architecture.

---

## 26. `defineModuleManifest()`

### 26.1 Purpose

The SDK should expose a helper:

```ts
defineModuleManifest(manifest)
```

This helper should:

```txt
Validate manifest shape
Preserve literal types
Reject unknown top-level keys
Reject invalid IDs
Reject invalid event names
Reject invalid permission keys
Reject forbidden wildcard module permissions
Reject route/API definitions without permissions
Reject client-specific hard-coded org slugs
Return the manifest unchanged if valid
```

### 26.2 Usage

```ts
import { defineModuleManifest } from '@/sdk'
import type { ModuleManifest } from '@/sdk'

export const inventoryManifest = defineModuleManifest({
  schemaVersion: '1',
  identity: {
    id: 'inventory',
    label: 'Inventory',
    description: 'Tracks stock levels, movements, and adjustments across warehouses.',
    category: 'operations',
    icon: 'Package',
    owner: { type: 'onedayos', name: 'OneDayOS' },
  },
  // ...
} satisfies ModuleManifest)
```

### 26.3 Validation Timing

Manifest validation should happen during:

```txt
unit tests
module registration
build-time architecture checks when possible
```

If invalid manifests are found in production startup, fail safely.

Do not silently skip invalid modules.

---

## 27. Manifest Registration

### 27.1 Recommended Registration File

```txt
src/modules/index.server.ts
```

Example:

```ts
import { registerModule } from '@/sdk/server'
import { inventoryManifest } from './inventory/manifest'

registerModule(inventoryManifest)
```

### 27.2 Why Server Registration

Module registration affects enabled module lookup, route enforcement, and server-side platform behavior.

It should be server-owned.

The client may receive serialized safe manifest subsets through APIs or server components.

### 27.3 Root Import

The platform should import module registration once in a server-only place.

Example:

```txt
src/app/layout.tsx
```

or a dedicated bootstrap file:

```txt
src/kernel/bootstrap/modules.ts
```

The exact bootstrap location belongs in `08-module-system/02-module-loader-registry.md`.

### 27.4 Registration Must Be Deterministic

Registering modules must not depend on request data.

Bad:

```ts
if (currentUser.email.endsWith('@client.com')) registerModule(clientModule)
```

Good:

```ts
registerModule(inventoryManifest)
```

Client access is controlled by `OrgModule`, not conditional module registration.

---

## 28. Manifest Validation Rules

A manifest is invalid if:

```txt
schemaVersion is missing or unsupported
identity.id is not valid kebab-case
identity.id is duplicated
identity.id conflicts with reserved namespaces
label is empty
description is empty
compatibility is missing
permissions are empty for normal business modules
permission keys do not match module/resource/action
module manifest defines wildcard permissions
navigation item lacks requiredPermission
route lacks requiredPermission
API lacks requiredPermission
API path is not org-scoped by convention
API path mentions orgId query parameters
business object extension lacks table name
event names violate naming convention
event payload schema is missing
listener handler name is missing
settings lack required permission
dashboard widget lacks required permission
AI action lacks required permission
dependencies contain circular required dependencies
manifest imports server/runtime code
```

Not every rule can be checked by TypeScript alone.

Some must be checked by tests, lint rules, or architecture scripts.

---

## 29. Reserved Namespaces

The following module IDs are reserved and cannot be used by business modules:

```txt
kernel
sdk
objects
platform
admin
auth
settings
api
system
```

Reason:

These names represent platform concepts, not business modules.

`objects` is reserved for Business Object permissions and events.

Examples:

```txt
objects.product.create
objects.product.created
```

A module must not use `objects` as its module ID.

---

## 30. Complete Example: Inventory Manifest

This is an illustrative manifest for the future Inventory module.

It is not permission to implement Inventory yet.

Inventory should still wait until the module system, design system, module generator safety rails, and Inventory specification are frozen.

```ts
import { defineModuleManifest } from '@/sdk'
import type { ModuleManifest } from '@/sdk'

export const inventoryManifest = defineModuleManifest({
  schemaVersion: '1',

  identity: {
    id: 'inventory',
    label: 'Inventory',
    shortLabel: 'Inventory',
    description: 'Tracks stock levels, stock movements, warehouse balances, and inventory adjustments across operational locations.',
    category: 'operations',
    icon: 'Package',
    colorToken: 'module.inventory',
    owner: {
      type: 'onedayos',
      name: 'OneDayOS',
    },
    tags: ['stock', 'warehouse', 'operations'],
  },

  lifecycle: {
    status: 'experimental',
    maturity: 'mvp',
    introducedIn: '0.1.0',
    deprecatedIn: null,
    removedIn: null,
  },

  compatibility: {
    platform: { min: '0.1.0', max: null },
    sdk: { min: '0.1.0', max: null },
    manifest: '1',
  },

  dependencies: [],

  businessObjects: {
    uses: [
      {
        object: 'product',
        operations: ['read', 'create', 'update'],
        reason: 'Inventory tracks stock behavior around shared Products.',
      },
      {
        object: 'product_category',
        operations: ['read'],
        reason: 'Inventory lists and filters Products by shared Product Categories.',
      },
      {
        object: 'warehouse',
        operations: ['read'],
        reason: 'Inventory stores stock balances by shared Warehouse.',
      },
      {
        object: 'supplier',
        operations: ['read'],
        reason: 'Inventory may display supplier context for stocked products.',
      },
    ],
    extends: [
      {
        object: 'product',
        table: 'inventory_product_extensions',
        relation: 'one_to_one',
        reason: 'Inventory-specific product settings such as reorder point and minimum stock do not belong in core Product.',
      },
    ],
  },

  entities: [
    {
      key: 'stock_level',
      label: 'Stock Level',
      table: 'inventory_stock_levels',
      description: 'Current product quantity by warehouse.',
      tenantScoped: true,
      softDelete: false,
      primaryDisplayField: 'productId',
      permissions: {
        read: 'inventory.stock_level.read',
      },
    },
    {
      key: 'stock_movement',
      label: 'Stock Movement',
      table: 'inventory_stock_movements',
      description: 'Immutable record of stock entering, leaving, or transferring between warehouses.',
      tenantScoped: true,
      softDelete: false,
      primaryDisplayField: 'referenceNo',
      permissions: {
        read: 'inventory.stock_movement.read',
        create: 'inventory.stock_movement.create',
      },
    },
    {
      key: 'inventory_adjustment',
      label: 'Inventory Adjustment',
      table: 'inventory_adjustments',
      description: 'Correction record used after stock counts or discrepancies.',
      tenantScoped: true,
      softDelete: true,
      primaryDisplayField: 'adjustmentNo',
      permissions: {
        read: 'inventory.inventory_adjustment.read',
        create: 'inventory.inventory_adjustment.create',
        update: 'inventory.inventory_adjustment.update',
        delete: 'inventory.inventory_adjustment.delete',
        restore: 'inventory.inventory_adjustment.restore',
      },
    },
  ],

  permissions: [
    {
      module: 'inventory',
      resource: 'dashboard',
      action: 'read',
      key: 'inventory.dashboard.read',
      label: 'View Inventory dashboard',
      description: 'Allows the user to view inventory dashboard summaries.',
      risk: 'low',
    },
    {
      module: 'inventory',
      resource: 'stock_level',
      action: 'read',
      key: 'inventory.stock_level.read',
      label: 'View stock levels',
      description: 'Allows the user to view current stock balances.',
      risk: 'low',
    },
    {
      module: 'inventory',
      resource: 'stock_movement',
      action: 'read',
      key: 'inventory.stock_movement.read',
      label: 'View stock movements',
      description: 'Allows the user to view historical stock movement records.',
      risk: 'low',
    },
    {
      module: 'inventory',
      resource: 'stock_movement',
      action: 'create',
      key: 'inventory.stock_movement.create',
      label: 'Create stock movements',
      description: 'Allows the user to record stock movements.',
      risk: 'high',
    },
    {
      module: 'inventory',
      resource: 'inventory_adjustment',
      action: 'create',
      key: 'inventory.inventory_adjustment.create',
      label: 'Create inventory adjustments',
      description: 'Allows the user to create stock adjustment records.',
      risk: 'high',
    },
    {
      module: 'inventory',
      resource: 'settings',
      action: 'configure',
      key: 'inventory.settings.configure',
      label: 'Configure Inventory settings',
      description: 'Allows the user to configure inventory module settings.',
      risk: 'critical',
    },
  ],

  navigation: {
    primary: [
      {
        key: 'inventory.dashboard',
        label: 'Inventory',
        href: '/inventory',
        icon: 'Package',
        requiredPermission: 'inventory.dashboard.read',
        exact: true,
        order: 10,
      },
      {
        key: 'inventory.stock_levels',
        label: 'Stock Levels',
        href: '/inventory/stock-levels',
        icon: 'Boxes',
        requiredPermission: 'inventory.stock_level.read',
        exact: false,
        order: 20,
      },
      {
        key: 'inventory.movements',
        label: 'Movements',
        href: '/inventory/movements',
        icon: 'ArrowLeftRight',
        requiredPermission: 'inventory.stock_movement.read',
        exact: false,
        order: 30,
      },
      {
        key: 'inventory.adjustments',
        label: 'Adjustments',
        href: '/inventory/adjustments',
        icon: 'SlidersHorizontal',
        requiredPermission: 'inventory.inventory_adjustment.read',
        exact: false,
        order: 40,
      },
    ],
    secondary: [
      {
        key: 'inventory.settings',
        label: 'Inventory Settings',
        href: '/inventory/settings',
        icon: 'Settings',
        requiredPermission: 'inventory.settings.configure',
        exact: true,
        order: 100,
      },
    ],
  },

  routes: [
    {
      key: 'inventory.dashboard',
      path: '/inventory',
      type: 'page',
      title: 'Inventory Dashboard',
      requiredPermission: 'inventory.dashboard.read',
      layout: 'dashboard',
    },
    {
      key: 'inventory.stock_levels.list',
      path: '/inventory/stock-levels',
      type: 'page',
      title: 'Stock Levels',
      requiredPermission: 'inventory.stock_level.read',
      layout: 'list',
    },
  ],

  api: [
    {
      key: 'inventory.stock_levels.list',
      method: 'GET',
      path: '/inventory/stock-levels',
      description: 'List current stock balances for the organization.',
      requiredPermission: 'inventory.stock_level.read',
      responseSchema: 'InventoryStockLevelListResponseSchema',
    },
    {
      key: 'inventory.adjustments.create',
      method: 'POST',
      path: '/inventory/adjustments',
      description: 'Create a new inventory adjustment.',
      requiredPermission: 'inventory.inventory_adjustment.create',
      requestSchema: 'CreateInventoryAdjustmentSchema',
      responseSchema: 'InventoryAdjustmentResponseSchema',
    },
  ],

  events: {
    emits: [
      {
        name: 'inventory.stock_movement.created',
        description: 'Emitted after a stock movement is recorded.',
        payloadSchema: 'InventoryStockMovementCreatedPayloadSchema',
        timing: 'after_commit',
      },
      {
        name: 'inventory.inventory_adjustment.created',
        description: 'Emitted after an inventory adjustment is created.',
        payloadSchema: 'InventoryAdjustmentCreatedPayloadSchema',
        timing: 'after_commit',
      },
      {
        name: 'inventory.stock_level.low',
        description: 'Emitted when a stock level falls below the configured reorder point.',
        payloadSchema: 'InventoryStockLevelLowPayloadSchema',
        timing: 'after_mutation',
      },
    ],
    listens: [],
  },

  settings: [
    {
      key: 'inventory.allow_negative_stock',
      label: 'Allow negative stock',
      description: 'Controls whether stock movements may reduce balances below zero.',
      valueType: 'boolean',
      defaultValue: false,
      requiredPermission: 'inventory.settings.configure',
      schema: 'InventoryAllowNegativeStockSettingSchema',
      category: 'Stock Rules',
    },
  ],

  dashboard: {
    widgets: [
      {
        key: 'inventory.low_stock_count',
        label: 'Low Stock Items',
        type: 'stat',
        description: 'Number of products below reorder point.',
        requiredPermission: 'inventory.stock_level.read',
        dataSource: 'inventory.dashboard.lowStockCount',
      },
    ],
  },

  ai: {
    summary: 'Inventory tracks stock levels, movements, and adjustments across warehouses.',
    businessPurpose: 'Helps SMEs know what products are available, where they are stored, and when stock is low.',
    commonQuestions: [
      'Which products are low stock?',
      'What stock moved this week?',
      'Which warehouse has available stock for this product?',
    ],
    commonActions: [
      {
        label: 'Draft stock adjustment',
        description: 'Prepare a stock adjustment for user review and confirmation.',
        requiredPermission: 'inventory.inventory_adjustment.create',
        destructive: false,
      },
    ],
    vocabulary: [
      {
        term: 'Stock movement',
        meaning: 'A record of stock entering, leaving, or transferring between warehouses.',
      },
      {
        term: 'Stock adjustment',
        meaning: 'A correction made after a stock count or discrepancy.',
      },
    ],
    safetyNotes: [
      'Do not change stock balances without explicit user confirmation.',
      'Never expose stock data from another organization.',
    ],
  },

  docs: {
    overview: 'docs/modules/inventory/overview.md',
    setupGuide: 'docs/modules/inventory/setup.md',
    userGuide: 'docs/modules/inventory/user-guide.md',
  },

  provisioning: {
    hasSeed: true,
    seedHook: 'seedInventoryModule',
    createsDefaultSettings: true,
    createsDefaultRoles: false,
    requiresPostEnableSetup: true,
  },

  generator: {
    generatedBy: 'onedayos-module-generator',
    generatedAt: '2026-07-05',
    generatorVersion: '0.1.0',
    editableZones: ['service-methods', 'ui-copy', 'business-rules'],
  },
} satisfies ModuleManifest)
```

---

## 31. Minimal Manifest Example

For a very small MVP module, the manifest can be much smaller.

```ts
import { defineModuleManifest } from '@/sdk'

export const visitorManagementManifest = defineModuleManifest({
  schemaVersion: '1',
  identity: {
    id: 'visitor-management',
    label: 'Visitor Management',
    shortLabel: 'Visitors',
    description: 'Records visitors entering and leaving an organization location.',
    category: 'operations',
    icon: 'UserRoundCheck',
    owner: { type: 'onedayos', name: 'OneDayOS' },
  },
  lifecycle: {
    status: 'experimental',
    maturity: 'mvp',
    introducedIn: '0.1.0',
    deprecatedIn: null,
    removedIn: null,
  },
  compatibility: {
    platform: { min: '0.1.0', max: null },
    sdk: { min: '0.1.0', max: null },
    manifest: '1',
  },
  dependencies: [],
  businessObjects: {
    uses: [],
    extends: [],
  },
  entities: [
    {
      key: 'visitor_log',
      label: 'Visitor Log',
      table: 'visitor_logs',
      description: 'Record of a visitor check-in and check-out.',
      tenantScoped: true,
      softDelete: true,
      primaryDisplayField: 'visitorName',
      permissions: {
        read: 'visitor-management.visitor_log.read',
        create: 'visitor-management.visitor_log.create',
        update: 'visitor-management.visitor_log.update',
        delete: 'visitor-management.visitor_log.delete',
      },
    },
  ],
  permissions: [
    {
      module: 'visitor-management',
      resource: 'visitor_log',
      action: 'read',
      key: 'visitor-management.visitor_log.read',
      label: 'View visitor logs',
      description: 'Allows the user to view visitor records.',
      risk: 'low',
    },
    {
      module: 'visitor-management',
      resource: 'visitor_log',
      action: 'create',
      key: 'visitor-management.visitor_log.create',
      label: 'Create visitor logs',
      description: 'Allows the user to record visitor check-ins.',
      risk: 'medium',
    },
  ],
  navigation: {
    primary: [
      {
        key: 'visitor-management.logs',
        label: 'Visitors',
        href: '/visitor-management',
        icon: 'UserRoundCheck',
        requiredPermission: 'visitor-management.visitor_log.read',
        exact: false,
        order: 10,
      },
    ],
  },
  routes: [
    {
      key: 'visitor-management.logs.list',
      path: '/visitor-management',
      type: 'page',
      title: 'Visitor Logs',
      requiredPermission: 'visitor-management.visitor_log.read',
      layout: 'list',
    },
  ],
  api: [
    {
      key: 'visitor-management.logs.list',
      method: 'GET',
      path: '/visitor-management/logs',
      description: 'List visitor logs for the organization.',
      requiredPermission: 'visitor-management.visitor_log.read',
      responseSchema: 'VisitorLogListResponseSchema',
    },
  ],
  events: {
    emits: [
      {
        name: 'visitor-management.visitor_log.created',
        description: 'Emitted after a visitor log is created.',
        payloadSchema: 'VisitorLogCreatedPayloadSchema',
        timing: 'after_commit',
      },
    ],
    listens: [],
  },
  settings: [],
})
```

---

## 32. Manifest and Client Configuration

Manifest metadata is global.

Client configuration is per organization.

The manifest says:

```txt
Inventory supports stock adjustments.
Inventory defines inventory.inventory_adjustment.create.
Inventory has a navigation item for Adjustments.
```

Client configuration says:

```txt
Client A has Inventory enabled.
Client A has allow_negative_stock = false.
Juan has inventory.inventory_adjustment.create.
Maria has inventory.stock_level.read only.
```

Do not place client-specific configuration in the manifest.

Forbidden:

```ts
settings: [
  {
    key: 'inventory.client_a_special_workflow',
  },
]
```

Correct:

```txt
Generic module setting declared in manifest.
Client-specific value stored in Setting table.
```

---

## 33. Manifest and Module Enablement

The existence of a manifest does not enable the module.

Enablement flow:

```txt
Module manifest is registered
↓
Admin enables module for Organization through OrgModule
↓
Module seed/provisioning runs if needed
↓
Users receive roles/permissions
↓
Navigation appears only for users with permission
↓
Routes/APIs enforce module enablement and permission
```

The module loader must check both:

```txt
registered manifest exists
OrgModule.isEnabled = true for ctx.org.id
```

A user cannot access a module just because its code exists in the repository.

---

## 34. Manifest and API Security

Every API route declared in the manifest must be implemented using the Kernel API contract.

Required API pattern:

```ts
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  return sdk.api.handle(req, async () => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'inventory_adjustment',
      action: 'create',
    })

    const input = await sdk.api.parseJson(req, CreateInventoryAdjustmentSchema)

    const data = await InventoryAdjustmentService.create(ctx, input)

    return sdk.api.created(data)
  })
}
```

Forbidden API pattern:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
const data = await InventoryService.create(orgId, body)
```

Manifest definitions should make the correct pattern obvious.

---

## 35. Manifest and Module Services

Manifest metadata does not replace services.

Services implement behavior.

But the manifest constrains service behavior.

If the manifest declares:

```txt
inventory.stock_movement.create
```

then service methods that create stock movements must require that permission either through the API route or through service-level enforcement using `PlatformContext`.

Recommended service signature:

```ts
InventoryStockMovementService.create(
  ctx: PlatformContext,
  input: CreateStockMovementInput
)
```

Forbidden:

```ts
InventoryStockMovementService.create(
  orgId: string,
  input: CreateStockMovementInput
)
```

---

## 36. Manifest and Events

The manifest is the source of truth for module event contracts.

If code emits an event not declared in the manifest, that is an architecture violation.

Forbidden:

```ts
await sdk.events.emit(ctx, {
  name: 'inventory.random.event',
  payload: {},
})
```

unless `inventory.random.event` is declared in the manifest.

If the manifest declares an event but code never emits it, that should be caught by module tests where possible.

---

## 37. Manifest and Business Object Events

A module may cause Business Object events indirectly.

Example:

Inventory UI creates a Product and an Inventory Product Extension.

Events:

```txt
objects.product.created
inventory.product_extension.created
```

The Inventory manifest should declare its own event:

```txt
inventory.product_extension.created
```

The Business Object event is declared in Business Object event contracts, not owned by Inventory.

However, Inventory manifest should declare that it uses and extends Product.

---

## 38. Manifest and Future Dynamic Systems

The manifest may include metadata useful for future Dynamic Forms, Dynamic CRUD, tables, search, reporting, and AI.

But this document does not authorize building those engines now.

The manifest can prepare metadata.

It must not trigger premature Platform Services.

Dynamic systems remain gated by the Three Independent Use Cases Rule.

---

## 39. Manifest and Search

Search is deferred as a Platform Service.

However, module manifests may eventually declare searchable resources.

MVP should not overbuild this section.

Recommended future shape:

```ts
search?: {
  resources: [
    {
      entity: 'stock_movement',
      label: 'Stock Movements',
      requiredPermission: 'inventory.stock_movement.read',
      fields: ['referenceNo', 'remarks'],
    },
  ]
}
```

Do not implement this until the Search Service manual is frozen.

---

## 40. Manifest and Reporting

Reporting is deferred as a Platform Service.

The manifest may eventually declare reportable entities and metrics.

MVP should avoid building a report engine too early.

Dashboard widgets are allowed as lightweight metadata, but full reporting belongs later.

---

## 41. Manifest and Marketplace Readiness

OneDayOS may eventually support a module marketplace.

The manifest prepares for that future by being:

```txt
Serializable
Versioned
Descriptive
Permission-aware
Dependency-aware
Documentation-linked
AI-context-ready
Compatibility-aware
```

But marketplace support is not part of MVP.

Do not add remote module loading, plugin sandboxes, paid module billing, or third-party module isolation in the restarted build.

Those require separate architecture documents.

---

## 42. Manifest Tests

Every module must include manifest tests.

Required tests:

```txt
manifest validates successfully
manifest ID matches folder name
manifest ID matches permission module namespace
manifest ID matches event namespace for module-owned events
manifest has no wildcard permissions
manifest has no API route using orgId query pattern
manifest has no nav item without permission
manifest has no route without permission
manifest has no API route without permission
manifest declares only valid Business Object keys
manifest event names follow naming convention
manifest has no required circular dependencies
```

Example:

```ts
import { describe, it, expect } from 'vitest'
import { inventoryManifest } from '../manifest'
import { validateModuleManifest } from '@/sdk'

describe('inventory manifest', () => {
  it('is valid', () => {
    expect(() => validateModuleManifest(inventoryManifest)).not.toThrow()
  })

  it('uses inventory permission namespace', () => {
    for (const permission of inventoryManifest.permissions) {
      expect(permission.module).toBe('inventory')
      expect(permission.key.startsWith('inventory.')).toBe(true)
    }
  })
})
```

---

## 43. Architecture Checks

The project should eventually include:

```bash
npm run check:architecture
```

Manifest-related architecture checks should detect:

```txt
modules importing @/kernel/*
modules importing other modules
manifests importing server-only SDK
manifests importing services
API routes outside /api/orgs/[orgSlug]/[moduleId]
module API route files that are not declared in manifest
manifest API definitions without matching route files
manifest route definitions without matching page files
permission keys not seeded or referenced correctly
```

Not all of these are required on day one.

But the manifest should be designed so these checks can be added.

---

## 44. Generator Requirements

The module generator must produce a valid manifest by default.

Generated manifest must include:

```txt
schemaVersion
identity
lifecycle
compatibility
dependencies
businessObjects
entities
permissions
navigation
routes
api
events
settings
```

Even if some arrays are empty, the structure should be present.

Generated manifest must not include:

```txt
client-supplied orgId patterns
wildcard permissions
executable seed functions
hard-coded org slugs
raw Prisma imports
@/kernel imports
imports from other modules
```

The generator should also create manifest tests.

---

## 45. Claude Implementation Rules

When Claude implements module manifests, it must follow these rules:

```txt
Do not invent a new manifest shape.
Do not use the old action-string permissions array.
Do not add seed functions directly to the manifest object.
Do not import @/kernel/* from a module manifest.
Do not import @/sdk/server from a module manifest.
Do not import module services into the manifest.
Do not use client-specific module IDs.
Do not use wildcard permissions in module manifests.
Do not declare events outside the naming convention.
Do not define Business Objects inside module manifests as module-owned entities.
Do not use orgId as an API input.
Do not hard-code org slugs in routes or nav items.
Do not mark a module stable before it has production proof.
Do not implement marketplace behavior.
Do not implement Dynamic Forms or Dynamic CRUD because the manifest has metadata for them.
```

If Claude believes the manifest needs a new field, it must stop and ask for an amendment to this document.

---

## 46. Anti-Patterns

### 46.1 Manifest as Sidebar Config Only

Bad:

```ts
export const inventoryManifest = {
  id: 'inventory',
  label: 'Inventory',
  navItems: [...],
}
```

Why bad:

It ignores permissions, events, routes, APIs, Business Objects, compatibility, and future platform tooling.

### 46.2 Manifest with Executable Business Logic

Bad:

```ts
export const inventoryManifest = {
  id: 'inventory',
  seed: async (orgId) => {
    await prisma.inventorySetting.create(...)
  },
}
```

Why bad:

It makes metadata import execute server/runtime dependencies and passes loose `orgId`.

### 46.3 Module-Owned Business Object Copy

Bad:

```ts
entities: [
  {
    key: 'inventory_product',
    table: 'inventory_products',
  },
]
```

Why bad:

If this represents Product identity, it duplicates the shared Product Business Object.

Correct:

```ts
businessObjects: {
  uses: [{ object: 'product', operations: ['read'] }],
  extends: [{ object: 'product', table: 'inventory_product_extensions' }],
}
```

### 46.4 API Route with orgId Query

Bad:

```ts
api: [
  {
    method: 'GET',
    path: '/inventory/products?orgId=:orgId',
  },
]
```

Correct:

```ts
api: [
  {
    method: 'GET',
    path: '/inventory/products',
    requiredPermission: 'inventory.product_extension.read',
  },
]
```

Actual route:

```txt
/api/orgs/[orgSlug]/inventory/products
```

### 46.5 Permission Without Resource

Bad:

```ts
{
  module: 'inventory',
  action: 'create',
}
```

Correct:

```ts
{
  module: 'inventory',
  resource: 'stock_movement',
  action: 'create',
  key: 'inventory.stock_movement.create',
}
```

### 46.6 Event Command

Bad:

```txt
inventory.create_stock_movement
```

Correct:

```txt
inventory.stock_movement.created
```

---

## 47. MVP Implementation Scope

For the restarted MVP platform, implement only:

```txt
ModuleManifest TypeScript types
validateModuleManifest()
defineModuleManifest()
module registration using validated manifests
manifest tests
navigation consumption from manifest
permission seeding/reading from manifest when enabling a module
route/API required-permission lookup from manifest where useful
```

Do not implement yet:

```txt
remote module registry
marketplace
per-org module version pinning
third-party module sandboxing
manifest-driven Dynamic CRUD
manifest-driven Dynamic Forms
manifest-driven Search Service
manifest-driven Reporting Service
manifest-driven AI actions
```

The manifest should prepare for these, not force them now.

---

## 48. Implementation Checklist

Before this document can be considered implemented:

```txt
[ ] ModuleManifest type exists in shared-safe SDK
[ ] defineModuleManifest() exists in shared-safe SDK
[ ] validateModuleManifest() exists and rejects invalid manifests
[ ] Manifest schema version is enforced
[ ] Module IDs are validated
[ ] Reserved namespaces are blocked
[ ] Permission keys are validated
[ ] Wildcard permissions are blocked in manifests
[ ] Event names are validated
[ ] Route definitions require permissions
[ ] API definitions require permissions
[ ] API definitions cannot include orgId query patterns
[ ] Business Object keys are validated
[ ] Manifest file imports do not pull server-only code
[ ] Module registry validates manifests before registration
[ ] Module generator emits valid manifests
[ ] Generated modules include manifest tests
[ ] At least one sample manifest test covers invalid permission shape
[ ] At least one sample manifest test covers invalid event name
[ ] At least one sample manifest test covers forbidden orgId API pattern
```

---

## 49. Acceptance Criteria

This document is successfully implemented when:

```txt
A module cannot register without a valid manifest.
A module manifest cannot define vague action-only permissions.
A module manifest cannot define wildcard permissions.
A module manifest cannot expose nav/routes/APIs without required permissions.
A module manifest cannot use client-supplied orgId patterns.
A module manifest cannot declare invalid event names.
A module manifest cannot duplicate shared Business Objects without explicitly declaring extension tables.
A module manifest is safe to inspect without running module business logic.
A module generator can create a secure default manifest.
The app shell can render module navigation from manifest + OrgModule + permissions.
The module registry can reason about compatibility and dependencies.
Claude has no reason to invent module metadata structure.
```

---

## 50. Next Document

Recommended next document:

```txt
08-module-system/02-module-loader-registry.md
```

Reason:

The manifest defines what a module declares.

The loader/registry document must define how the platform validates, registers, resolves, enables, disables, and exposes those manifests per organization.

---

## ADR-0011 UX Metadata Amendment

Future official module manifests may include optional UX metadata:

```ts
ux?: {
  processFlowRoute: string
}
```

This metadata is a review and navigation aid only. Route declarations remain the source for actual route availability, permission enforcement, and app-shell navigation.

Manifest UX rules:

```txt
[ ] UX metadata is pure metadata.
[ ] UX metadata does not import component code.
[ ] UX metadata does not register routes by side effect.
[ ] processFlowRoute points to the module's explanatory Process Flow page.
[ ] Official modules include a Process Flow page unless an accepted ADR grants an exception.
```

This amendment does not require code changes in the current governance package.
