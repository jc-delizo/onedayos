# OneDayOS Engineering Manual — 05 SDK / 05 SDK Compatibility & Versioning

**Document ID:** `05-sdk/05-sdk-compatibility-versioning.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Date:** July 2026  
**Implementation Allowed:** No, not until this document is approved and frozen  
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

---

# 1. Purpose

This document defines how OneDayOS versions its Kernel, SDK, modules, database schema, module manifests, events, generated code, and public contracts.

The goal is to make OneDayOS safe to evolve over many years without breaking client organizations, generated modules, future marketplace modules, or internal platform contracts.

This document exists because OneDayOS is not a one-off app. It is a long-lived platform. Updating the base platform should improve every client organization without forcing per-client forks or manual patching.

---

# 2. Executive Summary

OneDayOS uses one shared platform codebase, one deployment pipeline, and one shared tenant-scoped database.

When the platform is updated, all client organizations run on the updated platform unless a future enterprise deployment model explicitly says otherwise.

Therefore, compatibility must be managed at these boundaries:

```txt
SDK public API
Kernel API contracts
Module manifests
Module services
Event names and payloads
Database migrations
Generated code templates
Client configuration keys
Business Object schemas
```

The most important rule is:

> Modules may depend on the SDK contract. Modules may not depend on Kernel internals.

The second most important rule is:

> Database migrations must be safe for all existing organizations in the shared database.

The third most important rule is:

> Module versions are tracked for compatibility and release management, but MVP OneDayOS does not support per-organization module version pinning.

---

# 3. Non-Goals

This document does not define:

- A marketplace package system.
- Remote module loading.
- Per-client code forks.
- Per-organization module version pinning.
- Database-per-client deployment.
- FastAPI or a second backend runtime.
- A public third-party developer API.
- Automated plugin sandboxing.
- Enterprise release channels.

Those may exist later, but they are not part of the restarted core platform build.

---

# 4. Why Versioning Matters Even With One Codebase

At first, versioning may feel unnecessary because OneDayOS has one codebase.

That is false.

Even with one codebase, OneDayOS has contracts that must remain stable:

```txt
Generated modules depend on the SDK.
Module manifests depend on manifest types.
Module services depend on PlatformContext.
Frontend code depends on API response shapes.
Event listeners depend on event names and payloads.
Database records depend on migrations being safe.
Client settings depend on stable setting keys.
Future AI tools depend on metadata schemas.
```

If these contracts change casually, the platform becomes fragile.

The goal is not to avoid change. The goal is to make change explicit, testable, and reversible.

---

# 5. Platform Update Mental Model

OneDayOS must be understood like this:

```txt
OneDayOS Platform
  ├── Organization: Client A
  ├── Organization: Client B
  ├── Organization: Client C
  ├── Organization: Client D
  └── Organization: Client N
```

Not like this:

```txt
Client A app fork
Client B app fork
Client C app fork
Client D app fork
```

When OneDayOS deploys a security fix, UI improvement, SDK change, or module bug fix, all organizations receive the updated platform.

Access remains controlled by:

```txt
Organization tenancy
Enabled modules
Roles
Permissions
Settings
Feature flags
Client configuration
```

The platform may contain code for a module that an organization has not purchased. That is acceptable. The organization must not be able to access it unless the module is enabled and the user has permission.

---

# 6. Version Taxonomy

OneDayOS has multiple version types.

## 6.1 Platform Version

The Platform Version represents the whole OneDayOS release.

Examples:

```txt
0.1.0
0.2.0
1.0.0
1.1.0
2.0.0
```

It covers the deployed product as a whole.

## 6.2 Kernel Version

The Kernel Version represents the stability of Kernel contracts:

```txt
Auth
Organizations
Tenancy
Users
Roles
Permissions
Module registry
Settings
Feature flags
API contracts
PlatformContext creation
```

Breaking Kernel behavior is serious because every module depends on the Kernel indirectly through the SDK.

## 6.3 SDK Version

The SDK Version represents the public API surface that modules use.

This includes:

```txt
@/sdk
@/sdk/server
@/sdk/client
PlatformContext
PermissionRequirement
ApiResponse
EventEnvelope
ModuleManifest
sdk.auth
sdk.permissions
sdk.modules
sdk.events
sdk.getDb
sdk.api
```

The SDK Version is the most important developer-facing version.

## 6.4 Module Manifest Version

The Module Manifest Version represents the schema of module manifests.

If `ModuleManifest` changes in a breaking way, this version must change.

## 6.5 Module Version

Each module has its own version.

Examples:

```txt
inventory@1.0.0
leave@1.0.0
crm@1.0.0
expenses@1.0.0
```

Module version tracks that module's implementation, schema, permissions, events, and UI.

In MVP, this does not mean each organization can run a different module version. It is metadata for compatibility, testing, migrations, release notes, and future marketplace support.

## 6.6 Database Schema Version

The database schema is versioned through Prisma migrations.

The ordered migration history is the source of truth.

Examples:

```txt
20260704_init_kernel
20260705_add_inventory_module
20260706_add_product_barcode
```

The database must never be manually changed outside Prisma migrations.

## 6.7 Generator Version

The module generator and CRUD/form generators must have versions because generated code depends on platform contracts.

Example:

```txt
module-generator@1.0.0
crud-generator@0.1.0
form-generator@0.1.0
```

Generated code must state which generator version produced it.

## 6.8 Manual Document Version

Engineering Manual documents have versions, statuses, and freeze states.

A frozen manual document is an implementation contract.

If code conflicts with a frozen document, the conflict must be resolved through amendment or ADR. Code does not silently supersede the manual.

---

# 7. Initial Version Policy

The restarted platform should begin at:

```ts
ONEDAYOS_VERSION = '0.1.0'
KERNEL_VERSION = '0.1.0'
SDK_VERSION = '0.1.0'
MODULE_MANIFEST_VERSION = '0.1.0'
```

The first production-safe release should become:

```ts
ONEDAYOS_VERSION = '1.0.0'
KERNEL_VERSION = '1.0.0'
SDK_VERSION = '1.0.0'
MODULE_MANIFEST_VERSION = '1.0.0'
```

`1.0.0` means the platform has passed the Production Readiness Gate, including:

```txt
Tenant isolation
API-safe auth
Permission enforcement
Database migrations verified
Security tests passing
SDK contract tests passing
Build passing
```

Do not label the platform `1.0.0` while tenant isolation or permission enforcement is incomplete.

---

# 8. Version Source of Truth

Create this file:

```txt
src/sdk/version.ts
```

It should export:

```ts
export const ONEDAYOS_VERSION = '0.1.0'
export const KERNEL_VERSION = '0.1.0'
export const SDK_VERSION = '0.1.0'
export const MODULE_MANIFEST_VERSION = '0.1.0'

export type Version = `${number}.${number}.${number}`

export type VersionWindow = {
  min: Version
  maxExclusive?: Version
}
```

The SDK may re-export these from `@/sdk`:

```ts
export {
  ONEDAYOS_VERSION,
  KERNEL_VERSION,
  SDK_VERSION,
  MODULE_MANIFEST_VERSION,
} from './version'
```

Modules must not define their own understanding of the Kernel or SDK version.

---

# 9. Do Not Use Complex Semver Ranges in MVP

Do not use strings like:

```txt
^1.0.0
~1.2.0
>=1.0.0 <2.0.0
```

Reason:

- They require a semver range parser.
- They create ambiguity for Claude.
- They add dependency pressure.
- OneDayOS does not need package-manager-level range complexity in MVP.

Instead, use explicit compatibility windows:

```ts
type VersionWindow = {
  min: Version
  maxExclusive?: Version
}
```

Example:

```ts
compatibility: {
  kernel: { min: '1.0.0', maxExclusive: '2.0.0' },
  sdk: { min: '1.0.0', maxExclusive: '2.0.0' },
  manifest: { min: '1.0.0', maxExclusive: '2.0.0' },
}
```

This is simple, explicit, and easy to validate without a third-party package.

---

# 10. Module Manifest Compatibility

Every module manifest must declare compatibility.

Required shape:

```ts
export type ModuleCompatibility = {
  kernel: VersionWindow
  sdk: VersionWindow
  manifest: VersionWindow
}

export type ModuleManifest = {
  id: string
  label: string
  version: Version
  compatibility: ModuleCompatibility
  icon: string
  dependencies: string[]
  permissions: PermissionRequirement[]
  navItems: NavItem[]
  events: {
    emits: EventName[]
    listens: EventName[]
  }
  aiContext?: ModuleAIContext
  docsUrl?: string
}
```

Example:

```ts
import {
  KERNEL_VERSION,
  SDK_VERSION,
  MODULE_MANIFEST_VERSION,
  type ModuleManifest,
} from '@/sdk'

export const InventoryModule: ModuleManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '1.0.0',
  compatibility: {
    kernel: { min: '1.0.0', maxExclusive: '2.0.0' },
    sdk: { min: '1.0.0', maxExclusive: '2.0.0' },
    manifest: { min: '1.0.0', maxExclusive: '2.0.0' },
  },
  icon: 'Package',
  dependencies: [],
  permissions: [
    { module: 'inventory', resource: 'product_extension', action: 'read' },
    { module: 'inventory', resource: 'stock_movement', action: 'create' },
  ],
  navItems: [
    { label: 'Inventory', href: 'inventory', permission: { module: 'inventory', resource: '*', action: 'read' } },
  ],
  events: {
    emits: ['inventory.stock_movement.created'],
    listens: ['objects.product.created'],
  },
}
```

Do not use a single `kernelVersion` field in the restarted build as the only compatibility signal. The older MVP used that pattern, but the restarted architecture needs structured compatibility.

---

# 11. Compatibility Validation

The Kernel must validate module compatibility before a module is considered registered.

Required function:

```ts
validateModuleCompatibility(manifest: ModuleManifest): CompatibilityResult
```

Suggested result shape:

```ts
type CompatibilityResult =
  | { ok: true }
  | {
      ok: false
      errors: CompatibilityError[]
    }

type CompatibilityError = {
  code:
    | 'KERNEL_VERSION_INCOMPATIBLE'
    | 'SDK_VERSION_INCOMPATIBLE'
    | 'MANIFEST_VERSION_INCOMPATIBLE'
    | 'MODULE_VERSION_INVALID'
    | 'DEPENDENCY_MISSING'
    | 'DEPENDENCY_VERSION_INCOMPATIBLE'
  message: string
}
```

`registerModule()` must call this validator.

In development and CI, incompatible modules should fail loudly.

In production, incompatible modules should never reach deployment because CI should block them. If a runtime incompatibility somehow occurs, the module must fail closed:

```txt
Do not register the module.
Do not show the module in navigation.
Do not allow its routes.
Log the incompatibility.
Return a safe module-unavailable error if accessed.
```

---

# 12. Version Comparison Rules

Implement a small internal version comparator.

Do not add a semver dependency unless an ADR approves it.

Supported format:

```txt
MAJOR.MINOR.PATCH
```

Examples:

```txt
0.1.0
1.0.0
1.4.2
2.0.0
```

Invalid:

```txt
1
1.0
v1.0.0
1.0.0-beta
1.0.0+build.1
```

MVP does not need prerelease or build metadata.

Suggested helpers:

```ts
export function parseVersion(version: string): [number, number, number]
export function compareVersions(a: Version, b: Version): -1 | 0 | 1
export function satisfiesWindow(version: Version, window: VersionWindow): boolean
```

Compatibility logic:

```ts
function satisfiesWindow(version: Version, window: VersionWindow): boolean {
  return compareVersions(version, window.min) >= 0 &&
    (!window.maxExclusive || compareVersions(version, window.maxExclusive) < 0)
}
```

---

# 13. Semantic Versioning Policy

OneDayOS follows semantic versioning after `1.0.0`.

## 13.1 Patch Version

Increment PATCH for safe fixes.

Examples:

```txt
1.0.0 → 1.0.1
```

Patch changes include:

- Security bug fixes.
- Tenant isolation bug fixes.
- Permission enforcement bug fixes.
- UI bug fixes.
- Performance improvements.
- Non-breaking test improvements.
- Internal refactors that do not affect public contracts.

Patch updates should be safe for all organizations.

## 13.2 Minor Version

Increment MINOR for backward-compatible additions.

Examples:

```txt
1.0.0 → 1.1.0
```

Minor changes include:

- Adding new SDK functions.
- Adding optional fields to `PlatformContext`.
- Adding optional fields to `ModuleManifest`.
- Adding new module permissions.
- Adding new module events.
- Adding nullable database columns.
- Adding new API endpoints.
- Adding new components.
- Adding new feature flags.

Minor updates should not require existing modules to change.

## 13.3 Major Version

Increment MAJOR for breaking changes.

Examples:

```txt
1.0.0 → 2.0.0
```

Major changes include:

- Removing SDK functions.
- Renaming SDK functions.
- Changing required `PlatformContext` fields in a way that breaks modules.
- Changing API response shape.
- Removing or renaming event names.
- Changing event payload meaning.
- Removing database columns used by modules.
- Renaming Business Object fields.
- Changing permission matching semantics.
- Changing module manifest required fields.

Major updates require explicit migration planning.

---

# 14. Pre-1.0 Policy

Before the first production-safe release, OneDayOS may move faster.

However, even before `1.0.0`, the following rules still apply:

```txt
Security contracts must not be weakened.
Tenant isolation must not regress.
Permission enforcement must not regress.
API response shape should remain stable once implemented.
Module services must continue to use PlatformContext.
Generated code must remain secure by default.
```

Pre-1.0 does not mean careless.

It means architectural contracts can still be refined before the first production client.

---

# 15. SDK Compatibility Contract

The SDK is the only supported platform interface for modules.

## 15.1 Public SDK Surface

These are compatibility-controlled:

```txt
@/sdk
@/sdk/server
@/sdk/client
```

Compatibility-controlled exports include:

```txt
Version constants
PlatformContext type
PermissionRequirement type
ApiResponse type
ApiError type
EventEnvelope type
ModuleManifest type
sdk.auth
sdk.context
sdk.permissions
sdk.modules
sdk.events
sdk.getDb
sdk.db.transaction
sdk.api.handle
sdk.api.success
sdk.api.error
sdkClient.api
```

Changing these requires version review.

## 15.2 Private Kernel Internals

These are not public contracts:

```txt
@/kernel/auth/*
@/kernel/db/*
@/kernel/permissions/*
@/kernel/events/*
@/kernel/modules/*
```

Modules must not import them.

Kernel internals may change without module version bumps, as long as the SDK behavior remains compatible.

## 15.3 Breaking SDK Changes

Breaking SDK changes include:

```txt
Removing sdk.auth.requireApiContext
Renaming sdk.getDb(ctx)
Changing sdk.getDb(ctx) to accept orgId again
Changing sdk.permissions.require return behavior
Changing ApiResponse shape
Moving server SDK exports into client-safe SDK
Removing PlatformContext fields used by modules
Changing EventEnvelope structure
```

## 15.4 Non-Breaking SDK Changes

Non-breaking SDK changes include:

```txt
Adding sdk.audit later
Adding sdk.notifications later
Adding optional ctx fields
Adding optional ApiResponse.meta fields
Adding helper overloads that preserve existing behavior
Adding new error codes without changing existing codes
```

---

# 16. PlatformContext Compatibility

`PlatformContext` is one of the most important contracts in OneDayOS.

It represents verified runtime context:

```txt
Authenticated user
Platform user record
Organization
Tenant membership
Enabled modules
Roles
Permissions
Request metadata
```

Modules must receive `PlatformContext` from the Kernel or SDK. They must not construct it manually.

## 16.1 Stable Fields

The following should be stable after `1.0.0`:

```ts
export type PlatformContext = {
  authUserId: string
  userId: string
  orgId: string
  orgSlug: string
  roleIds: string[]
  permissions: PermissionRequirement[]
  enabledModules: string[]
  requestId?: string
}
```

The exact final type may be refined before `1.0.0`, but after `1.0.0`, changes are compatibility-controlled.

## 16.2 Allowed Changes

Allowed non-breaking changes:

```txt
Adding optional fields
Adding derived helper methods outside ctx
Adding metadata fields
Adding support access metadata later
```

## 16.3 Breaking Changes

Breaking changes:

```txt
Removing orgId
Removing userId
Changing orgSlug meaning
Changing permissions shape
Making optional fields required in module-facing code
Allowing ctx to be created from client-supplied orgId
```

## 16.4 Critical Rule

Never reintroduce this pattern:

```ts
sdk.getDb(orgId)
```

Use:

```ts
sdk.getDb(ctx)
```

Reason:

`orgId` can be copied from unsafe input. `PlatformContext` must be created only after authentication and tenant membership validation.

---

# 17. API Compatibility Contract

The API contract is compatibility-controlled.

Every API must return:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

Do not change this shape without a major version.

## 17.1 Non-Breaking API Changes

Non-breaking:

```txt
Adding new endpoints
Adding optional response fields inside data
Adding optional meta fields
Adding new error codes
Adding new filters with defaults
Adding pagination metadata when old behavior remains supported
```

## 17.2 Breaking API Changes

Breaking:

```txt
Changing { data, error } shape
Returning redirects from APIs
Changing 401/403 behavior
Removing endpoint fields
Renaming endpoint paths
Changing validation error format
Changing error code strings
Returning HTML from protected API routes
```

## 17.3 API Versioning in MVP

Do not introduce `/api/v1` yet.

Reason:

OneDayOS is not exposing a public third-party API in MVP.

Internal API compatibility is protected by tests and the Engineering Manual.

Add `/api/v1` later only if OneDayOS supports external integrations or public API consumers.

---

# 18. Event Compatibility Contract

Events are public platform contracts.

Event names and payloads must be stable.

## 18.1 Event Name Stability

Once an event ships, do not rename it casually.

This is breaking:

```txt
inventory.stock_movement.created
→ inventory.stockMovement.created
```

This is also breaking:

```txt
objects.product.created
→ inventory.product.created
```

Because `Product` is a Business Object, not Inventory-owned.

## 18.2 Event Payload Stability

Event payloads should be small and stable.

Allowed non-breaking changes:

```txt
Adding optional payload fields
Adding metadata to EventEnvelope
Adding new event names
```

Breaking changes:

```txt
Removing payload fields
Renaming payload fields
Changing payload meaning
Changing event tenant scope
Emitting full Prisma records instead of safe payloads
```

## 18.3 Event Deprecation

To replace an event:

```txt
1. Emit both old and new event names.
2. Mark old event deprecated in docs.
3. Update listeners to new event.
4. Remove old event only in a major version.
```

---

# 19. Module Versioning

Every module must declare a version.

Example:

```ts
version: '1.0.0'
```

Module version changes should follow semantic versioning.

## 19.1 Patch Module Version

Use for:

```txt
Bug fixes
UI fixes
Permission enforcement fixes
Query performance fixes
Test improvements
```

Example:

```txt
inventory@1.0.0 → inventory@1.0.1
```

## 19.2 Minor Module Version

Use for:

```txt
New screens
New optional fields
New reports
New settings
New non-breaking events
New permissions that do not break existing roles
```

Example:

```txt
inventory@1.0.0 → inventory@1.1.0
```

## 19.3 Major Module Version

Use for:

```txt
Breaking schema changes
Major workflow changes
Permission model changes
Removing screens
Removing events
Renaming module-owned entities
Changing core stock calculation behavior
```

Example:

```txt
inventory@1.0.0 → inventory@2.0.0
```

Major module changes require an implementation plan and migration notes.

---

# 20. MVP Does Not Support Per-Org Module Version Pinning

In MVP, `OrgModule` should store:

```txt
orgId
moduleId
isEnabled
enabledAt
```

Do not add per-org module version pinning yet.

Avoid this in MVP:

```txt
OrgModule.version
OrgModule.pinnedVersion
OrgModule.releaseChannel
```

Reason:

OneDayOS runs one deployed codebase. Pretending that different organizations can run different module versions inside the same deployment creates false safety.

A module version in the manifest is useful for compatibility checks and release notes. It does not mean Client A can run Inventory 1.0 while Client B runs Inventory 1.2 in the same production deployment.

Future enterprise version pinning requires a separate ADR and probably a more advanced deployment model.

---

# 21. Database Migration Compatibility

Database compatibility is critical because all organizations share one database.

## 21.1 Safe Migration Types

Generally safe:

```txt
Adding nullable columns
Adding columns with safe defaults
Adding indexes concurrently where possible
Adding new tables
Adding new foreign keys after backfill
Adding new enum-like string values
Adding optional JSON settings
```

## 21.2 Dangerous Migration Types

Dangerous:

```txt
Dropping columns
Renaming columns
Changing column types
Changing nullability from nullable to required
Dropping tables
Changing uniqueness constraints
Changing foreign key behavior
Changing enum-like string semantics
```

Dangerous migrations require explicit migration plans.

## 21.3 Expansion and Contraction Pattern

Breaking schema changes must use expansion and contraction.

Example: rename `Product.code` to `Product.sku`.

Do not do this in one migration:

```txt
Rename code → sku
Deploy code that uses sku
Hope old code never runs
```

Use this sequence:

```txt
1. Add nullable sku column.
2. Backfill sku from code.
3. Deploy code that writes both code and sku.
4. Deploy code that reads sku but falls back to code.
5. Verify all records have sku.
6. Deploy code that only uses sku.
7. Remove code in a later major version.
8. Drop code column only after an explicit contraction migration.
```

This is more work, but it protects existing organizations.

## 21.4 Migration Ordering

For safe deployment:

```txt
1. Run additive migration.
2. Deploy code that uses new schema.
3. Backfill if needed.
4. Remove old behavior later.
```

Do not deploy code that requires a migration before the migration exists.

## 21.5 No Per-Client Schema Drift

Never create custom columns only for one client.

Bad:

```txt
products.client_a_custom_field
```

Better:

```txt
Module extension table
Org setting
Custom field metadata later
Dynamic form metadata later
```

---

# 22. Business Object Compatibility

Business Objects are shared platform contracts.

Examples:

```txt
Employee
Product
Customer
Supplier
Warehouse
Branch
Department
```

Important clarification:

```txt
Branch and Department are Kernel org-structure primitives.
Warehouse is a Business Object.
```

Changing Business Objects affects multiple modules.

## 22.1 Adding Business Object Fields

Only add fields when they pass the Business Object minimalism rule.

Allowed:

```txt
Fields that are lowest-common-denominator across modules.
Fields required by at least three independent use cases.
Fields that are genuinely part of the entity identity.
```

Avoid:

```txt
Inventory-only fields on Product
CRM-only fields on Customer
HR-only fields on Employee
Purchasing-only fields on Supplier
```

Use module extension tables instead.

## 22.2 Breaking Business Object Changes

Breaking:

```txt
Renaming Product.code
Changing Customer.name meaning
Removing Employee.employeeNo
Changing Warehouse.branchId semantics
Moving shared fields into module tables without migration
```

Breaking Business Object changes require major version review.

---

# 23. Permission Compatibility

Permissions are security contracts.

Permission names, modules, resources, and actions must be stable.

Example:

```ts
{ module: 'inventory', resource: 'stock_movement', action: 'create' }
```

## 23.1 Non-Breaking Permission Changes

Generally non-breaking:

```txt
Adding new permissions for new features
Adding narrower permissions while keeping old broad permissions temporarily
Adding UI visibility checks backed by existing API enforcement
```

## 23.2 Breaking Permission Changes

Breaking:

```txt
Renaming a permission module
Renaming a permission resource
Changing action semantics
Removing permissions without migration
Changing wildcard semantics
Making existing roles lose access unexpectedly
```

## 23.3 Permission Migration Rule

If a module introduces a new permission, existing roles need a migration policy.

Example:

```txt
New permission: inventory.stock_adjustment.approve
```

Possible migration choices:

```txt
Admin receives it automatically.
Staff does not receive it automatically.
Existing custom roles do not receive it automatically unless documented.
```

Permission migrations must be explicit.

---

# 24. Client Configuration Compatibility

Settings are also contracts.

Example:

```txt
module: inventory
key: low_stock_threshold_behavior
value: { mode: 'per_product' }
```

Do not rename setting keys casually.

## 24.1 Safe Settings Changes

Safe:

```txt
Adding new setting keys
Adding optional JSON fields
Adding defaults
Adding validation for new settings
```

## 24.2 Breaking Settings Changes

Breaking:

```txt
Renaming keys
Changing value shape without migration
Changing default behavior unexpectedly
Deleting settings used by clients
```

## 24.3 Settings Schema Version

For complex settings, store schema version inside value:

```json
{
  "schemaVersion": 1,
  "mode": "per_product"
}
```

This allows future migration:

```json
{
  "schemaVersion": 2,
  "thresholdSource": "product",
  "fallbackThreshold": 5
}
```

---

# 25. Generator Compatibility

Generators are part of the platform contract because they create code Claude and engineers will maintain.

Generated files should include a header:

```ts
/**
 * Generated by OneDayOS Module Generator v1.0.0
 * Manual: 09-cli-generators/01-module-generator.md
 * Do not remove security context checks.
 */
```

Generator output must declare:

```txt
Generator version
Kernel version expected
SDK version expected
Manual document source
```

## 25.1 Generator Breaking Changes

Breaking generator changes include:

```txt
Changing generated service function signatures
Changing generated API route shape
Changing generated test structure
Changing generated manifest structure
Changing generated permission naming
Changing generated event naming
```

## 25.2 Generated Code Safety Rule

A generator must never output code that:

```txt
Accepts client-supplied orgId
Calls sdk.getDb(orgId)
Imports from @/kernel in a module
Uses redirect-style auth in APIs
Skips permission checks
Skips tenant checks
Uses hard delete for business records
Emits invalid event names
```

---

# 26. Dependency Compatibility

External dependencies are also version risks.

Core dependencies include:

```txt
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Supabase
Prisma
Zod
React Hook Form
Vitest
Vercel
```

Do not casually upgrade these.

Major dependency upgrades require either:

```txt
ADR
or
frozen technology-baseline amendment
```

Examples of risky upgrades:

```txt
Next.js major version
Prisma major version
Zod major version
Tailwind major version
Supabase auth helper changes
```

Reason:

The previous implementation already showed that dependency versions can materially change architecture assumptions, such as Prisma 7 configuration, Next.js middleware/proxy behavior, and shadcn/ui theme behavior.

---

# 27. FastAPI Compatibility Decision

FastAPI is not part of the core platform versioning model.

Do not add FastAPI to the restarted core platform.

Reasons:

```txt
It creates a second backend runtime.
It creates a second auth surface.
It creates a second deployment surface.
It creates ambiguity for Claude.
It increases operational cost.
It weakens the simple one-codebase mental model.
```

FastAPI may be considered later only through ADR for a specialized internal Platform Service, such as:

```txt
Document parsing
AI/RAG processing
ML-heavy jobs
Python-only integrations
```

Even then, modules must not call FastAPI directly. They should call a OneDayOS SDK or Platform Service interface.

---

# 28. Deprecation Policy

After `1.0.0`, do not remove public contracts immediately.

Deprecation flow:

```txt
1. Add replacement.
2. Mark old API as deprecated in docs and JSDoc.
3. Keep old API working for at least one minor release.
4. Update generated code to use the replacement.
5. Update all first-party modules.
6. Remove deprecated API only in a major version.
```

Example:

```ts
/**
 * @deprecated Use sdk.auth.requireApiModuleContext instead.
 */
async function requireApiOrgContext(...) {}
```

Do not use noisy runtime warnings in production unless the warning indicates a security issue.

---

# 29. Security Exception Policy

Security fixes may bypass normal deprecation timelines.

Example:

```txt
A helper allows cross-tenant data access.
```

In that case:

```txt
Fix immediately.
Document the breaking change.
Add regression tests.
Publish release notes.
Add an ADR if the change alters architecture.
```

Security compatibility never means preserving unsafe behavior.

Tenant isolation, permission enforcement, and API-safe auth are higher priority than backward compatibility.

---

# 30. Release Process

Every platform release should have a release note.

Minimum release note sections:

```md
# OneDayOS Release X.Y.Z

## Summary
## Security Fixes
## Kernel Changes
## SDK Changes
## Module Changes
## Database Migrations
## Client Configuration Changes
## Breaking Changes
## Deprecations
## Rollback Notes
## Tests Run
```

For internal MVP releases, this can be short, but it must exist.

---

# 31. Upgrade Process

Before deploying a platform update:

```txt
1. Review changed Engineering Manual documents.
2. Review migrations.
3. Run compatibility checks.
4. Run SDK contract tests.
5. Run module manifest validation.
6. Run tenant isolation tests.
7. Run permission tests.
8. Run API contract tests.
9. Run build.
10. Deploy to staging or preview.
11. Smoke test demo organization.
12. Deploy to production.
13. Monitor errors.
```

Required commands:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run compatibility:check
npm run build
```

If `compatibility:check` does not exist yet, create it before first production release.

---

# 32. Rollback Process

Rollback must account for code and database changes.

## 32.1 Code-Only Rollback

Safe when:

```txt
No migration was deployed
No data shape changed
No background job changed persisted data
```

Use Vercel rollback.

## 32.2 Migration-Affected Rollback

More dangerous.

If migration was additive, rollback code may still work.

If migration was destructive, rollback may fail.

Therefore:

```txt
Avoid destructive migrations.
Use expansion/contraction.
Back up before risky migrations.
Test rollback on staging.
```

## 32.3 Security Patch Rollback

Do not rollback a security patch unless the rollback risk is lower than the production incident risk.

If a security patch breaks a module, prefer fixing the module forward.

---

# 33. CI Compatibility Gates

The platform CI should eventually include:

```txt
Forbidden import check
SDK contract tests
Module manifest validation
Event name validation
Permission naming validation
API response shape tests
Tenant isolation tests
Migration generation check
Generated module smoke test
```

Suggested scripts:

```json
{
  "scripts": {
    "compatibility:check": "tsx scripts/check-compatibility.ts",
    "architecture:check": "tsx scripts/check-architecture.ts",
    "module:validate": "tsx scripts/validate-modules.ts"
  }
}
```

These scripts should fail if:

```txt
A module imports from @/kernel
A module uses sdk.getDb(orgId)
A manifest has incompatible versions
An event name is invalid
A module declares invalid permissions
A module route lacks auth/context checks
```

---

# 34. Runtime Behavior for Incompatible Modules

Incompatible modules must fail closed.

Do not show them in navigation.

Do not enable their routes.

Do not allow API access.

Return a safe error:

```json
{
  "data": null,
  "error": {
    "code": "MODULE_INCOMPATIBLE",
    "message": "This module is not compatible with the current OneDayOS platform version."
  }
}
```

Do not expose internal stack traces or dependency details to end users.

Log full diagnostics server-side.

---

# 35. Versioning Examples

## 35.1 Security Patch

Change:

```txt
Fix cross-tenant read in Inventory API.
```

Version bump:

```txt
ONEDAYOS_VERSION: 1.0.0 → 1.0.1
SDK_VERSION: unchanged unless SDK contract changed
Inventory: 1.0.0 → 1.0.1
```

## 35.2 New SDK Helper

Change:

```txt
Add sdk.permissions.requireAny(ctx, requirements)
```

Version bump:

```txt
SDK_VERSION: 1.0.0 → 1.1.0
ONEDAYOS_VERSION: 1.0.0 → 1.1.0
```

Existing modules continue working.

## 35.3 Breaking SDK Change

Change:

```txt
Rename sdk.auth.requireApiModuleContext to sdk.context.requireModule
```

Version bump:

```txt
SDK_VERSION: 1.x.x → 2.0.0
ONEDAYOS_VERSION: 1.x.x → 2.0.0
```

Requires migration plan and module updates.

## 35.4 New Inventory Feature

Change:

```txt
Add low-stock alert settings.
```

Version bump:

```txt
Inventory: 1.0.0 → 1.1.0
ONEDAYOS_VERSION: 1.0.0 → 1.1.0
```

Only organizations with Inventory enabled can use it.

## 35.5 Add Product Barcode

Change:

```txt
Add nullable Product.barcode.
```

Version bump:

```txt
ONEDAYOS_VERSION: 1.0.0 → 1.1.0
Business Object schema updated
Migration: additive
```

Safe if nullable and UI handles missing values.

## 35.6 Rename Product Code to SKU

Change:

```txt
Product.code → Product.sku
```

Version bump:

```txt
ONEDAYOS_VERSION: 1.x.x → 2.0.0 eventually
```

Requires expansion/contraction migration.

Do not do it casually.

---

# 36. Claude Code Implementation Rules

When Claude implements versioning, it must follow these rules:

```txt
Do not add FastAPI.
Do not add complex semver dependencies without approval.
Do not add per-org module version pinning.
Do not modify module runtime behavior beyond this document.
Do not weaken tenant isolation for compatibility.
Do not preserve unsafe APIs for backward compatibility.
Do not allow modules to import from @/kernel.
Do not reintroduce sdk.getDb(orgId).
Do not accept client-supplied orgId.
```

Claude should implement:

```txt
src/sdk/version.ts
version comparison helpers
module compatibility validation
tests for compatibility validation
module manifest compatibility fields
compatibility check script
CI script entry
```

Claude should not implement:

```txt
Marketplace versioning
Remote modules
Per-client pinned versions
Release channels
Enterprise deployment modes
External public API versioning
```

---

# 37. Required Tests

At minimum, tests must cover:

```txt
Valid version parses
Invalid version rejects
Version comparison works
Version window accepts min boundary
Version window rejects below min
Version window rejects maxExclusive boundary
Module manifest with compatible versions registers
Module manifest with incompatible Kernel version fails
Module manifest with incompatible SDK version fails
Module manifest with incompatible manifest version fails
Invalid module version fails
Missing dependency fails
Forbidden module import check catches @/kernel
```

Suggested test files:

```txt
src/sdk/__tests__/version.test.ts
src/kernel/modules/__tests__/compatibility.test.ts
scripts/__tests__/check-compatibility.test.ts
```

---

# 38. Acceptance Criteria

This document is implemented correctly when:

```txt
[ ] Version constants exist in src/sdk/version.ts
[ ] SDK re-exports safe version constants
[ ] Module manifests declare structured compatibility windows
[ ] Compatibility validation exists
[ ] Incompatible module manifests fail validation
[ ] Version comparison tests pass
[ ] Module compatibility tests pass
[ ] No semver dependency is added without ADR
[ ] No FastAPI dependency is added
[ ] No per-org module pinning is added
[ ] Release notes template exists
[ ] Compatibility check script exists before first production release
[ ] CI can block incompatible modules
[ ] Manual and code agree on versioning behavior
```

---

# 39. Founder Review Questions

Before freezing this document, answer these:

1. Should the first production-safe release be labeled `1.0.0`, or should we use `0.x` for the first paying clients?
2. Are we comfortable not supporting per-org module version pinning in MVP?
3. Should compatibility validation throw during module registration in development, or only during CI?
4. Should release notes be required for every deploy or only production deploys?
5. Should the module generator create versioned file headers from day one?

My recommendation:

```txt
Use 0.x during development.
Declare 1.0.0 only after the Production Readiness Gate passes.
Do not support per-org module pinning in MVP.
Make compatibility validation fail CI.
Make development registration fail loudly.
Require release notes for production deploys.
Make generators include versioned headers from day one.
```

---

# 40. Final Rule

Compatibility is not bureaucracy.

Compatibility is what allows OneDayOS to update one shared platform for many client organizations without turning into ten custom apps.

The SDK contract, event contract, API contract, database migration strategy, and module manifest versioning are what make long-term reuse possible.

