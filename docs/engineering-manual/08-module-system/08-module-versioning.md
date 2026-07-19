# OneDayOS Engineering Manual — 08 Module System — 08 Module Versioning

**Document ID:** `08-module-system/08-module-versioning.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Architecture  
**Last Updated:** July 2026  
**Implementation Allowed:** No, not until this document is approved and frozen  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/05-sdk-compatibility-versioning.md`
- `06-data/00-database-architecture.md`
- `06-data/04-migrations-seeding.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/02-module-loader-registry.md`
- `08-module-system/07-module-dependencies.md`

---

# 1. Purpose

This document defines how **OneDayOS business modules are versioned, upgraded, released, deprecated, and kept compatible** as the platform grows.

This is important because OneDayOS is not a collection of separate client applications.

OneDayOS is:

```txt
One platform
One codebase
One deployment pipeline
One shared PostgreSQL database
Many organizations
Many enabled module combinations
```

When a module is updated, the code update affects the shared platform. Every organization that has that module enabled now runs the updated module code, unless a future enterprise version-pinning system is intentionally introduced.

Therefore, module versioning must protect:

```txt
existing client data
existing client workflows
database migrations
module manifests
permissions
settings
API contracts
event contracts
Business Object contracts
AI context
future marketplace compatibility
```

The purpose of module versioning is not to create ten different apps for ten clients.

The purpose is to let OneDayOS evolve safely while remaining one platform.

---

# 2. Core Decision

For the restarted MVP build:

```txt
OneDayOS does not support per-organization module version pinning.
```

That means this is **not** the MVP model:

```txt
Client A uses Inventory v1.0.0
Client B uses Inventory v1.1.0
Client C uses Inventory v2.0.0
```

The MVP model is:

```txt
One deployed OneDayOS platform
Inventory module code version vX.Y.Z in that deployment
All organizations with Inventory enabled use that deployed Inventory version
Access controlled by OrgModule, settings, roles, and permissions
```

This is simpler, cheaper, safer, and better aligned with one-day delivery.

Future per-organization module version pinning is possible, but it is explicitly deferred.

---

# 3. Why Per-Organization Version Pinning Is Deferred

Per-org module version pinning sounds attractive, but it creates significant complexity:

```txt
multiple active code paths
module compatibility matrices
per-org migration state
harder debugging
harder support
harder QA
harder AI-assisted development
higher AppCare burden
slower one-day delivery
more deployment risk
```

For an early platform serving Philippine SMEs, this is unnecessary complexity.

The business needs:

```txt
fast delivery
low maintenance cost
standardized support
reusable modules
simple upgrades
predictable AppCare
```

Per-org module version pinning should be reconsidered only when OneDayOS has:

```txt
many production clients
stable core modules
strong CI coverage
migration discipline
enterprise clients demanding controlled rollout
clear revenue justification
```

Until then, module versions are used for:

```txt
release history
compatibility checks
migration notes
manual review
future marketplace readiness
Claude implementation boundaries
```

They are not used to run different module code per organization.

---

# 4. Definitions

## 4.1 Platform Version

The version of the entire OneDayOS application.

Example:

```txt
platform.version = 0.3.0
```

This represents a deployed application state containing:

```txt
Kernel
SDK
Business Objects
Module System
Platform Services
Business Modules
Design System
Database schema
```

## 4.2 SDK Version

The version of the public SDK contract exposed to modules.

Example:

```txt
sdk.version = 0.2.0
```

Modules should depend on the SDK contract, not Kernel internals.

## 4.3 Module Manifest Version

The version of the manifest schema itself.

Example:

```txt
manifestVersion = 1
```

This is different from the module’s own business version.

## 4.4 Module Version

The semantic version of a module’s code and contract.

Example:

```txt
inventory.version = 0.4.0
leave.version = 0.2.1
crm.version = 0.1.0
```

This is declared in the module manifest.

## 4.5 Module Data Version

The implied version of the database/data shape required by a module.

In MVP, this is tracked through Prisma migrations and release notes, not through a per-org installed-version table.

## 4.6 Module Settings Version

The version of the module’s settings contract.

In MVP, settings should remain backward compatible. Do not implement a separate settings-versioning engine yet.

## 4.7 Event Contract Version

The version of event payload schemas emitted or listened to by the module.

In MVP, event names should be stable and event payloads should evolve additively. If a breaking event change is needed, introduce a new event name.

---

# 5. Versioning Rule for MVP

Every module manifest must include a module version.

Example:

```ts
export const inventoryManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '0.1.0',
  compatibility: {
    platform: {
      min: '0.1.0',
      maxExclusive: '0.2.0',
    },
    sdk: {
      min: '0.1.0',
      maxExclusive: '0.2.0',
    },
    manifest: {
      version: 1,
    },
  },
  // ...
}
```

For MVP, the registry should validate only simple compatibility windows.

Do not add a full semver dependency parser unless a later ADR approves it.

---

# 6. Semantic Versioning Policy

OneDayOS uses semantic versioning for module versions:

```txt
MAJOR.MINOR.PATCH
```

Example:

```txt
1.4.2
```

However, during the restarted pre-production build, modules should begin below `1.0.0`.

Example:

```txt
inventory 0.1.0
leave     0.1.0
crm       0.1.0
```

A module should not reach `1.0.0` until it has:

```txt
approved module spec
approved permissions
approved routes
approved API contracts
approved event contracts
approved tests
tenant-isolation tests
permission-denial tests
migration verification
at least one real production use
```

---

# 7. Patch Versions

A PATCH version is used for safe bug fixes that do not change contracts.

Example:

```txt
inventory 0.3.1 → 0.3.2
```

Patch changes may include:

```txt
fixing a UI bug
fixing a calculation bug
improving validation message text
fixing sorting
fixing empty states
fixing a non-contract internal service bug
improving test coverage
fixing permission enforcement without changing permission names
fixing tenant isolation
fixing performance without changing behavior
```

Patch changes must not:

```txt
remove fields
rename fields
remove routes
change event names
change permission names
change settings keys
require destructive migrations
change meaning of existing data
break existing workflows
```

Security fixes are usually PATCH changes, even if urgent.

Security fixes may override normal deprecation timelines.

---

# 8. Minor Versions

A MINOR version is used for backward-compatible feature additions.

Example:

```txt
inventory 0.3.2 → 0.4.0
```

Minor changes may include:

```txt
new optional screen
new optional setting
new optional nullable database field
new optional API field
new event emitted in addition to existing events
new dashboard widget
new permission for a new feature
new report
new filter
new export option
new module-owned extension table
```

Minor changes must be additive.

They should not break an existing organization that already uses the module.

---

# 9. Major Versions

A MAJOR version is used for breaking changes.

Example:

```txt
inventory 1.4.0 → 2.0.0
```

Major changes include:

```txt
renaming API fields
removing API fields
removing routes
changing event names
changing event payload meaning
renaming permissions
removing permissions
changing required permissions for existing workflows
removing settings keys
changing setting semantics
changing database semantics in a non-backward-compatible way
destructive migrations
changing core workflow behavior in a way existing clients will notice
```

Major changes should be avoided in the MVP phase.

Before `1.0.0`, changes may technically be breaking, but OneDayOS should still document them carefully because real client data may already exist.

Once a module is production-used by clients, breaking changes require:

```txt
manual approval
release notes
migration plan
rollback/forward-fix plan
client-impact review
updated tests
ADR if architectural
```

---

# 10. Module Lifecycle Status

Every module should eventually have a lifecycle status.

Recommended statuses:

```ts
type ModuleLifecycleStatus =
  | 'draft'
  | 'internal'
  | 'beta'
  | 'stable'
  | 'deprecated'
  | 'removed'
```

## 10.1 Draft

A module spec or scaffold exists, but the module is not safe for client use.

Rules:

```txt
not enabled for clients
may have incomplete UI
may have incomplete permissions
may have incomplete tests
may change without migration guarantees
```

## 10.2 Internal

The module is being used internally or in demo environments.

Rules:

```txt
not sold as a supported module
may be enabled for testing orgs
must not be enabled for production clients without founder approval
```

## 10.3 Beta

The module can be used by selected clients with known limitations.

Rules:

```txt
must have tenant-isolation tests
must have permission-denial tests
must have basic migration safety
must have documented known limitations
```

## 10.4 Stable

The module is production-supported.

Rules:

```txt
covered by AppCare
requires release notes for changes
breaking changes require approval
must pass module quality gate
must have real client acceptance criteria
```

## 10.5 Deprecated

The module is still supported but should not be sold or enabled for new clients.

Rules:

```txt
existing clients continue to work
no new feature work unless required
replacement path must be documented
```

## 10.6 Removed

The module is no longer available.

Rules:

```txt
must not be registered
must not appear in enablement UI
must have data archival/migration plan if it ever had production data
```

---

# 11. MVP Manifest Fields for Versioning

The module manifest should include at least:

```ts
type ModuleManifest = {
  id: string
  label: string
  version: string
  lifecycle: 'draft' | 'internal' | 'beta' | 'stable' | 'deprecated' | 'removed'
  compatibility: {
    platform: {
      min: string
      maxExclusive: string
    }
    sdk: {
      min: string
      maxExclusive: string
    }
    manifest: {
      version: number
    }
  }
  // ...other manifest fields
}
```

## 11.1 Do Not Use `kernelVersion` Alone

The older MVP plan used a simpler `kernelVersion` field.

That is not enough for the restarted build because OneDayOS now has distinct compatibility surfaces:

```txt
Platform
Kernel
SDK
Manifest schema
Module System
Database migrations
Events
Permissions
```

The restarted build should use a more explicit compatibility object.

---

# 12. Module Version Is Not Module Enablement

Module version and module enablement are separate concerns.

```txt
Module version = what code exists in the deployed platform
Module enablement = whether an organization may access that module
```

Example:

```txt
Inventory v0.4.0 exists in code
Client A has Inventory enabled
Client B does not have Inventory enabled
Client C has Inventory enabled
```

After deployment:

```txt
Client A uses Inventory v0.4.0
Client B still cannot access Inventory
Client C uses Inventory v0.4.0
```

Do not create client-specific code branches to handle this.

Use:

```txt
OrgModule
Settings
Roles
Permissions
Feature flags
Module configuration
```

---

# 13. Module Version Is Not User Permission

Module version does not grant user access.

A module may be present in code and enabled for an organization, but a user still needs permission.

Example:

```txt
Inventory v0.4.0 exists
Inventory enabled for Demo Corp
User Maria lacks inventory.stock_adjustment.create
Maria cannot create stock adjustments
```

Versioning must never bypass RBAC.

---

# 14. Database Migrations and Module Versions

In MVP, database migrations are platform-level Prisma migrations.

Do not create separate module migration systems yet.

Example migration names:

```txt
20260705_add_inventory_stock_movements
20260707_add_leave_requests
20260710_add_customer_contact_index
```

Even if a migration supports one module, it is still applied to the shared platform database.

That means migrations must be:

```txt
tenant-safe
backward compatible where possible
reviewed before production
verified against staging
covered by tests
safe for organizations that do not have the module enabled
```

---

# 15. Safe Migration Pattern

Use expand/contract migrations.

## 15.1 Expand

Add new structures without breaking old code.

Examples:

```txt
add nullable column
add new table
add new index concurrently if needed later
add optional setting key
add optional event payload field
```

## 15.2 Backfill

Populate data safely.

Backfills must be:

```txt
tenant-aware
batched if large
idempotent
logged
dry-run capable when risky
safe to resume
```

## 15.3 Switch Code

Deploy code that starts using the new structure.

## 15.4 Contract

Only later remove old structures or enforce stricter constraints.

Examples:

```txt
make column required after backfill
remove deprecated field after replacement is proven
remove old setting key after migration
```

Avoid contract steps in early MVP unless truly necessary.

---

# 16. Migration Rules for Module-Owned Tables

Every module-owned tenant-scoped table must include:

```txt
orgId
createdAt
updatedAt where relevant
deletedAt / deletedBy for business records
```

Example:

```prisma
model InventoryStockMovement {
  id          String    @id @default(cuid())
  orgId       String
  productId   String
  warehouseId String
  quantity    Decimal
  type        String
  occurredAt  DateTime
  createdBy   String
  createdAt   DateTime  @default(now())
  deletedAt   DateTime?
  deletedBy   String?

  @@index([orgId])
  @@index([orgId, productId])
  @@index([orgId, warehouseId])
  @@map("inventory_stock_movements")
}
```

Do not create module tables without `orgId` unless the table is truly global metadata approved by architecture.

---

# 17. Versioning Business Object Extensions

Module-owned extension tables are versioned as part of the module.

Example:

```txt
Product = Business Object
InventoryProductExtension = Inventory module-owned extension
PurchasingProductExtension = Purchasing module-owned extension
```

If Inventory adds `InventoryProductExtension.reorderPoint`, that is an Inventory module version change.

It is not a Product Business Object version change.

If a field moves from an extension table into the core Business Object, that requires:

```txt
Three Independent Use Cases evidence
ADR
Business Object manual update
migration plan
compatibility review
module version updates for affected modules
```

---

# 18. Permission Versioning

Permissions are compatibility contracts.

Changing permissions can break user workflows.

## 18.1 Adding a Permission

Adding a permission for a new optional feature is usually a MINOR change.

Example:

```txt
inventory.stock_adjustment.approve
```

Required actions:

```txt
add permission to manifest
add tests
update module docs
ensure Admin wildcard covers it
ensure non-admin roles do not receive it accidentally
```

## 18.2 Requiring a New Permission for an Existing Workflow

This may be a breaking change.

Example:

Old behavior:

```txt
inventory.stock_adjustment.update allows approving adjustments
```

New behavior:

```txt
inventory.stock_adjustment.approve is required
```

This is likely MAJOR or requires a careful migration because users who could previously complete a workflow may lose access.

## 18.3 Renaming Permissions

Renaming permissions is breaking.

Do not rename permissions casually.

If necessary:

```txt
add new permission
migrate role grants
keep old permission temporarily if possible
add tests
write release notes
remove old permission later
```

---

# 19. Event Contract Versioning

Events are API contracts.

Changing an event carelessly can break future Audit, Search, AI, Notification, Reporting, and Activity Feed services.

## 19.1 Event Names Are Stable

Do not rename event names casually.

Bad:

```txt
inventory.stock_movement.created
→ inventory.movement.created
```

Good:

```txt
keep inventory.stock_movement.created
add a new event only if semantics truly changed
```

## 19.2 Event Payloads Evolve Additively

Allowed:

```txt
add optional field
add metadata field
add schemaVersion in envelope
```

Forbidden without breaking-change review:

```txt
remove field
rename field
change field meaning
change ID type
include full Prisma record
include orgId in payload
include secrets or sensitive data
```

## 19.3 New Event for New Meaning

If the meaning changes, introduce a new event name.

Example:

```txt
inventory.stock_level.low_detected
inventory.stock_level.reorder_threshold_crossed
```

These may sound similar, but they are not necessarily the same business fact.

---

# 20. API Contract Versioning

OneDayOS module APIs are internal platform APIs in MVP.

Do not add `/v1` route prefixes yet.

Use stable route paths and clear contracts instead:

```txt
/api/orgs/[orgSlug]/inventory/stock-movements
/api/orgs/[orgSlug]/leave/requests
/api/orgs/[orgSlug]/crm/opportunities
```

API changes must follow the Kernel API contract:

```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```

Breaking API changes include:

```txt
renaming fields
removing fields
changing response shape
changing error shape
changing status semantics
changing required permissions
changing validation semantics in a non-backward-compatible way
```

Additive API fields are usually safe.

---

# 21. Route Versioning

Page routes are user-facing contracts.

Avoid renaming routes after clients use them.

Bad:

```txt
/[orgSlug]/inventory/products
→ /[orgSlug]/inventory/items
```

If a route must be renamed:

```txt
create redirect
update navigation
update docs
update tests
keep old route for a transition period if possible
```

For MVP, prefer stable, boring route names.

---

# 22. Settings Versioning

Settings keys are contracts.

Bad:

```txt
inventory.lowStockThreshold
```

Then later changing its meaning from:

```txt
quantity below this value
```

to:

```txt
percentage of average demand
```

This is a breaking settings change.

Instead, create a new key:

```txt
inventory.reorderThresholdQuantity
inventory.reorderThresholdDemandPercent
```

Settings versioning rules:

```txt
settings keys should be stable
settings values must be validated with Zod
new optional settings are minor changes
changing setting meaning is breaking
removing setting requires migration
module settings must remain org-scoped
```

---

# 23. AI Context Versioning

Module AI context is part of the module contract.

If a module changes workflows, entities, permissions, or supported questions, update its AI context.

AI context changes are usually PATCH or MINOR changes unless they expose new actions or change safety boundaries.

Rules:

```txt
AI context must not expose disabled features as available
AI context must respect module lifecycle status
AI context must respect permissions
AI context must not describe future features as implemented
AI context must be updated when module workflows change
```

---

# 24. Changelog Requirement

Every production-used module should eventually have a changelog.

Recommended location:

```txt
src/modules/[moduleId]/CHANGELOG.md
```

Format:

```md
# Inventory Changelog

## 0.4.0 — 2026-07-10

### Added
- Added stock adjustment approval screen.
- Added `inventory.stock_adjustment.approve` permission.

### Changed
- Improved stock movement table filters.

### Fixed
- Fixed cross-tenant stock-level test fixture.

### Migration
- Added nullable `approvedAt` and `approvedBy` columns to `inventory_stock_adjustments`.

### Client Impact
- Admins automatically have access through wildcard permission.
- Staff roles need explicit approval permission to approve adjustments.
```

Do not rely only on Git commits as release notes.

---

# 25. Release Process for Module Changes

Every module change should follow this sequence.

## Step 1 — Classify the Change

Classify as:

```txt
patch
minor
major
security fix
migration-only
configuration-only
```

## Step 2 — Update Manual or Module Spec if Needed

If the change affects architecture, permissions, events, APIs, or database design, update the relevant manual/spec first.

## Step 3 — Update Manifest

Update:

```txt
version
permissions
events
routes
apis
settings
AI context
compatibility if needed
```

## Step 4 — Write Migration if Needed

Use Prisma migrations.

No manual production schema edits.

## Step 5 — Update Tests

Required tests may include:

```txt
service tests
API tests
permission tests
tenant-isolation tests
migration/backfill tests
event tests
settings validation tests
UI smoke tests
```

## Step 6 — Update Changelog

Document the change for future support.

## Step 7 — Run Quality Gates

Required:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run check:architecture
```

If `check:architecture` does not exist yet, create it before trusting generated modules.

## Step 8 — Deploy to Staging

Verify with at least:

```txt
one org with the module enabled
one org with the module disabled
one admin user
one staff user without full permissions
```

## Step 9 — Deploy to Production

Deploy code and migrations according to the deployment manual.

## Step 10 — Verify Production

Check:

```txt
module page loads
module disabled org cannot access routes
unauthorized user gets correct denial
core workflows work
no cross-tenant access
logs have no unexpected errors
```

---

# 26. Rollback Policy

Database migrations make rollbacks harder.

Therefore:

```txt
prefer forward fixes over database rollback
avoid destructive migrations
use expand/contract pattern
keep old data until replacement is proven
make migrations backward compatible with previous code when possible
```

A safe code rollback requires the previous code to still work with the migrated database.

That is why migrations should not remove or rename columns in the same deployment where code starts using new structures.

---

# 27. Module Deprecation Policy

A module may be deprecated when:

```txt
it is replaced by a better module
it no longer matches platform direction
it was a client-specific experiment
it has too much support burden
it violates architecture
```

Deprecation requires:

```txt
manifest lifecycle = deprecated
removal from new-client sales material
replacement guidance
client-impact notes
migration/export path if production data exists
```

Deprecated modules should not receive new features unless needed for support or migration.

---

# 28. Module Removal Policy

Removing a module is serious if any client has used it.

Before removal:

```txt
verify no production org has it enabled
archive or migrate data
remove navigation
remove enablement option
remove event listeners
remove docs from active module list
keep migrations historically intact
```

Do not delete old Prisma migrations.

Do not drop production tables casually.

If data must remain for audit/history, keep tables but hide module UI.

---

# 29. Client-Specific Customizations and Versioning

Client-specific forks are forbidden in MVP.

Bad:

```txt
inventory-client-a.ts
inventory-client-b.ts
custom-inventory-for-acme
```

Good:

```txt
Org settings
Module settings
Feature flags
Permissions
Extension tables
Workflow configuration later
```

If one client needs a special behavior:

```txt
first, ask whether it belongs in configuration
second, ask whether it belongs inside that module
third, ask whether it indicates a future Platform Service
fourth, use the Three Independent Use Cases Rule before promotion
```

Do not create a new module version just for one client unless an enterprise deployment model exists and has been approved by ADR.

---

# 30. Feature Flags vs Module Versions

Feature flags and versions are different.

```txt
Version = what code is deployed
Feature flag = what behavior is enabled
```

Example:

```txt
Inventory v0.5.0 includes barcode scanning code
barcodeScanningEnabled = false for most orgs
barcodeScanningEnabled = true for pilot org
```

Feature flags are useful for:

```txt
beta features
gradual rollout
client-specific enablement without forks
hiding unfinished capabilities
commercial plan limits
```

But feature flags should not become a dumping ground for messy client-specific behavior.

Every feature flag needs:

```txt
owner
purpose
default value
removal criteria
settings validation
tests
```

---

# 31. Module Version Compatibility with Dependencies

Modules may declare required or optional dependencies.

Example:

```ts
dependencies: [
  {
    moduleId: 'inventory',
    type: 'required',
    minVersion: '0.4.0',
  },
]
```

For MVP, keep dependency validation simple.

Rules:

```txt
required dependency must be registered
required dependency must be enabled for the organization before enabling dependent module
dependency does not allow direct imports
dependency version mismatch blocks enablement or logs a clear error
dependency cycles are forbidden
```

Avoid required dependencies unless truly necessary.

Prefer Business Objects and events.

---

# 32. Module Version Compatibility with Business Objects

Business Object changes can affect multiple modules.

Example:

```txt
Product changes may affect Inventory, Purchasing, Sales, Reporting, Search, AI
Customer changes may affect CRM, Reservations, Billing, Projects
Employee changes may affect Leave, HR, Assets, Projects, Approvals
```

Therefore, changes to Business Objects require broader review than changes to module-owned tables.

Adding optional Business Object fields may be safe.

Renaming/removing Business Object fields is breaking across modules.

Business Object changes should update:

```txt
Business Object manual
affected module specs
affected module tests
event contracts
AI context
search/reporting plans if relevant
```

---

# 33. Versioning Generated Modules

The module generator must create modules with an initial version.

Recommended default:

```txt
0.1.0
```

Generated modules should also include:

```txt
CHANGELOG.md
manifest version
lifecycle = draft
compatibility window
test placeholders that fail if security checks are missing
```

Generated modules should not be considered production-ready just because they compile.

A generated module moves from `draft` to `beta` or `stable` only after its module specification and tests are approved.

---

# 34. Versioning and Claude Code

Claude must not decide module versioning policy.

Claude may:

```txt
update a module version when instructed
update changelog when instructed
add tests for a versioned change
implement migration based on approved spec
```

Claude must not:

```txt
invent per-org module pinning
add runtime module loading
add remote marketplace loading
add semver parser dependency without approval
create client-specific forks
rename events casually
rename permissions casually
remove settings keys casually
perform destructive migrations without approval
turn module dependencies into direct imports
```

If Claude believes a change is breaking, it must stop and report before implementing.

---

# 35. Example: Safe Patch Release

Scenario:

```txt
Inventory table sorting is wrong.
```

Classification:

```txt
PATCH
```

Required work:

```txt
fix sorting
add regression test
update changelog
bump Inventory 0.3.1 → 0.3.2
run quality gates
deploy
```

No database migration required.

---

# 36. Example: Safe Minor Release

Scenario:

```txt
Add optional barcode field to Product for Inventory display.
```

Architecture check:

Barcode may not belong in core Product yet unless multiple modules need it.

Better MVP approach:

```txt
InventoryProductExtension.barcode
```

Classification:

```txt
Inventory MINOR
```

Required work:

```txt
update Inventory module spec
add nullable barcode field to InventoryProductExtension
write Prisma migration
update validation schema
update UI
update tests
update events only if needed
bump Inventory 0.3.0 → 0.4.0
update changelog
```

---

# 37. Example: Breaking Change

Scenario:

```txt
Rename inventory.stock_movement.created to inventory.stock.created
```

Classification:

```txt
MAJOR / discouraged
```

Recommended decision:

```txt
Do not rename.
Keep old event.
Add a new event only if it represents a different fact.
```

Reason:

Future listeners may depend on exact event names.

A wrong event name is as dangerous as a broken API contract.

---

# 38. Example: No Per-Client Fork

Scenario:

```txt
Client A wants a special Inventory adjustment approval rule.
```

Bad solution:

```txt
create inventory-acme module
fork inventory service
branch code by orgSlug
```

Good MVP solution:

```txt
module setting or explicit paid custom enhancement if reusable
```

Future solution:

```txt
Approval Engine or Workflow Engine after Three Independent Use Cases evidence
```

---

# 39. Required Tests

Module versioning requires tests around change safety.

For every production-used module, the test suite should include:

```txt
manifest validation test
module registration test
module enablement test
module disabled route/API test
permission-denial test
cross-tenant read denial test
cross-tenant write denial test
service tests
API response-shape tests
event emission tests
settings validation tests if settings exist
migration/backfill tests where applicable
```

For versioned changes, add regression tests proving old behavior remains safe unless a breaking change is explicitly approved.

---

# 40. Architecture Checks

`check:architecture` should eventually validate:

```txt
module manifests include version
module manifests include lifecycle
module manifests include compatibility
module versions are valid MAJOR.MINOR.PATCH
module lifecycle is valid
module permissions are full objects
module APIs do not include orgId query patterns
modules do not import @/kernel/*
modules do not import other modules
modules do not import raw Prisma
module events follow naming convention
module dependencies do not form cycles
```

This should run in CI.

---

# 41. Forbidden Patterns

The following are forbidden in the restarted build:

```txt
per-client module forks
per-org module version pinning in MVP
runtime remote module loading
marketplace loading in MVP
client-supplied orgId for versioned behavior
module code branching on orgSlug for business logic
raw Prisma in module code
module direct imports from other modules
module direct imports from @/kernel/*
renaming permissions without migration
renaming events without migration
removing settings keys without migration
removing module tables casually
deleting old Prisma migrations
using database rollback as primary release strategy
```

---

# 42. MVP Implementation Guidance

For the restarted MVP, implement only:

```txt
manifest.version
manifest.lifecycle
manifest.compatibility
basic registry validation
CHANGELOG.md generator output
architecture tests for manifest version fields
```

Do not implement yet:

```txt
per-org module version pinning
module marketplace
remote module installation
module package registry
separate module migration runner
semver parser dependency
complex compatibility solver
```

Keep it simple.

The goal is discipline, not enterprise plugin infrastructure.

---

# 43. Acceptance Criteria

This document is accepted when the Engineering Manual clearly establishes that:

```txt
[ ] Modules are versioned with MAJOR.MINOR.PATCH.
[ ] Module versions are declared in manifests.
[ ] Module lifecycle status is declared in manifests.
[ ] Module compatibility is declared explicitly.
[ ] Per-org module version pinning is deferred.
[ ] One deployed module version serves all enabled organizations in MVP.
[ ] Module enablement is separate from module version.
[ ] Module version is separate from user permission.
[ ] Database migrations are platform-level Prisma migrations.
[ ] Module migrations must be tenant-safe.
[ ] Permission names are compatibility contracts.
[ ] Event names are compatibility contracts.
[ ] Settings keys are compatibility contracts.
[ ] Business Object changes require broader review.
[ ] Generated modules start as draft version 0.1.0.
[ ] Claude is forbidden from inventing module versioning infrastructure.
```

---

# 44. Founder Review Questions

Before freezing this document, answer:

1. Do we agree that MVP should not support per-org module version pinning?
2. Do we agree that module versions are release/compatibility metadata, not separate deployments?
3. Do we agree that generated modules start at `0.1.0` and lifecycle `draft`?
4. Do we agree that stable modules require tenant-isolation and permission-denial tests?
5. Do we agree that breaking module changes require manual approval after production use?
6. Do we agree that module changelogs should eventually live beside module code?
7. Do we agree that settings, events, permissions, and API routes are compatibility contracts?

---

# 45. Final Rule

A module version is a promise.

It tells OneDayOS:

```txt
what the module contains
what platform it expects
what contracts it exposes
what migrations it requires
what clients may safely rely on
```

But in MVP, module versioning must not become a second product.

The product is still OneDayOS:

```txt
One platform.
One codebase.
One database.
Many organizations.
Configuration over forks.
Compatibility over chaos.
```
