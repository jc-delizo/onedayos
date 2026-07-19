# OneDayOS Engineering Manual — Generator Philosophy

**Document ID:** `09-cli-generators/00-generator-philosophy.md`  
**Version:** `1.0.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Architecture  
**Last Updated:** July 2026  
**Implementation Allowed:** No — not until marked `Frozen`  
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
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/02-module-loader-registry.md`
- `08-module-system/03-module-folder-contract.md`
- `08-module-system/04-module-permissions.md`
- `08-module-system/05-module-navigation.md`
- `08-module-system/06-module-events.md`
- `08-module-system/07-module-dependencies.md`
- `08-module-system/08-module-versioning.md`
- `08-module-system/09-module-testing.md`

---

# 1. Purpose

This document defines the philosophy behind OneDayOS code generators.

Generators are not convenience scripts.

Generators are architecture enforcement tools.

OneDayOS depends on repeatability. The business promise is that internal software can be delivered quickly without creating one-off custom applications. That promise is impossible if every module is hand-assembled differently.

The purpose of OneDayOS generators is to make the correct architecture the default path.

A generator should produce code that is:

```txt
secure by default
consistent by default
tenant-scoped by default
permission-enforced by default
SDK-only by default
testable by default
visually consistent by default
compatible with future platform evolution by default
```

The generator should make bad architecture harder than good architecture.

---

# 2. Core Principle

The central rule is:

```txt
Generated code must be production-shaped, not demo-shaped.
```

A generator must never create code that is knowingly unsafe, incomplete, or architecturally wrong with the excuse that a developer will fix it later.

That means generated code must not contain patterns like:

```txt
TODO: add permission check
TODO: add tenant check
TODO: validate input
TODO: replace raw Prisma
TODO: fix orgId handling
TODO: add tests later
```

A generator may create placeholders for business-specific behavior, but it must not create placeholders for platform safety.

Acceptable placeholder:

```txt
TODO: replace placeholder entity name with real business label
TODO: define module-specific fields
TODO: customize empty-state copy
```

Unacceptable placeholder:

```txt
TODO: enforce permissions
TODO: ensure user belongs to org
TODO: reject client-supplied orgId
TODO: add 401/403 handling
TODO: scope query by orgId
```

Security, tenancy, validation, permissions, soft delete, API shape, and tests are not optional finishing touches. They are part of the generated foundation.

---

# 3. Why Generators Matter to OneDayOS

OneDayOS is not trying to become a normal software agency.

OneDayOS is trying to become a platform for delivering many internal business systems quickly and safely.

That requires a repeatable production pattern.

Without generators, every new module creates the risk of architectural drift:

```txt
one module imports raw Prisma
one module accepts orgId from the browser
one module forgets permission checks
one module uses a custom table layout
one module duplicates Product
one module emits inconsistent events
one module returns unstructured API errors
one module has no tenant-isolation tests
```

After five modules, the platform becomes inconsistent.

After ten clients, maintenance becomes expensive.

After one security incident, trust is damaged.

The generator exists to prevent that.

The generator turns the Engineering Manual into repeatable code.

---

# 4. Generator Philosophy in One Sentence

```txt
A OneDayOS generator should encode architectural decisions so Claude and humans do not have to re-decide them every time.
```

Claude should not decide:

```txt
where module files go
how APIs are shaped
how permissions are checked
how org context is resolved
how database access works
how events are named
how tests are structured
how navigation is declared
how manifests are formed
```

Those decisions belong in the Engineering Manual and generator templates.

Claude may decide:

```txt
business-specific copy
module-specific field labels
module-specific service logic within approved patterns
module-specific UI wording
module-specific tests based on the frozen module spec
```

Claude implements within boundaries.

The generator creates the boundaries.

---

# 5. Historical Correction from the Previous MVP Generator

The previous MVP Module Builder CLI was directionally useful because it introduced module scaffolding, manifest creation, route generation, service files, schemas, tests, optimistic UI patterns, and navigation integration.

However, the restarted build must not reproduce several unsafe or weak patterns from the old scaffold:

```txt
API routes under /api/[module] instead of /api/orgs/[orgSlug]/[moduleId]
client-supplied orgId in schemas or query strings
service methods accepting orgId strings
sdk.getDb(orgId)
auth-only API routes without permission enforcement
redirect-style auth helper usage inside API routes
tests that only prove arrays return or events were called
manifest self-registration side effects
permissions declared as action arrays instead of full permission objects
module seed functions accepting orgId strings
```

The restarted generator must be built around:

```txt
PlatformContext
sdk.getDb(ctx)
sdk.api.handle()
sdk.auth.requireApiModuleContext()
sdk.permissions.require()
Zod strict validation
server-only event emission
module manifests as pure metadata
real tenant-isolation tests
real permission-denial tests
```

The generator is where the restarted architecture becomes hard to misuse.

---

# 6. What a Generator Is

A OneDayOS generator is a controlled code creation tool that emits files conforming to frozen Engineering Manual documents.

A generator may create:

```txt
module folders
module manifests
permission declarations
Zod schemas
service skeletons
API route handlers
page route skeletons
client components
navigation metadata
event constants
event payload schemas
settings schemas
test files
README/docs stubs
architecture check files
```

A generator should also validate its inputs and refuse unsafe output.

A generator is not merely string interpolation.

A generator is a compiler from platform conventions into code.

---

# 7. What a Generator Is Not

A generator is not:

```txt
a shortcut around architecture
a way to create client-specific forks
a way to bypass the Engineering Manual
a way to create quick demo code
a replacement for module specifications
a replacement for tests
a replacement for founder review
a dynamic form engine
a no-code builder
a marketplace plugin installer
a FastAPI code generator
a schema migration authority
```

Generators help us start from the correct shape.

They do not remove the need for product thinking, architecture review, or implementation discipline.

---

# 8. Generator Scope for MVP

The MVP generator system should focus on a small number of high-value generators.

Approved MVP generators:

```txt
module generator
API route generator
service test generator
module test scaffold generator
```

Deferred generators:

```txt
dynamic CRUD generator
form generator
table-view generator
report generator
workflow generator
AI action generator
integration generator
marketplace package generator
```

The reason is simple:

```txt
Generate architecture first.
Generate business behavior later.
```

The first generator should make modules consistent and safe. It should not try to produce a full no-code app builder.

---

# 9. Relationship to the Three Independent Use Cases Rule

Generators must respect the Three Independent Use Cases Rule.

A generator should not create Platform Services before the platform has earned them.

For example, the module generator must not automatically generate:

```txt
approval workflow integration
notification service integration
comments service integration
attachments service integration
activity feed integration
background job queue integration
report builder integration
search indexing integration
AI action execution integration
```

unless those Platform Services are already approved, frozen, and implemented.

The generator may create future-ready placeholders in metadata only when those placeholders are safe and inert.

Acceptable:

```ts
aiContext: {
  description: 'Inventory tracks stock movements and stock levels.',
  exampleQueries: ['Which products are low on stock?'],
}
```

Not acceptable:

```ts
await sdk.ai.indexRecord(ctx, record)
await sdk.notifications.send(ctx, notification)
await sdk.approvals.createRequest(ctx, approval)
```

unless those SDK services already exist and are approved.

Generators must not make deferred Platform Services feel implemented.

---

# 10. Generator Design Goals

Every OneDayOS generator should optimize for:

```txt
architecture consistency
security by default
tenant isolation
developer speed
Claude reliability
readability
maintainability
testability
low operational burden
future refactor safety
```

Speed matters, but only after correctness.

A generator that produces unsafe code quickly is worse than no generator.

---

# 11. Generator Design Non-Goals

The MVP generator system should not optimize for:

```txt
maximum configurability
visual drag-and-drop editing
runtime plugin loading
per-client generated forks
code generation from vague prompts
automatic database schema mutation without review
multiple backend runtimes
Python/FastAPI service generation
enterprise marketplace packaging
module version pinning
```

Those may become relevant later, but not in the restarted platform foundation.

The generator must serve the current platform architecture, not imagined future complexity.

---

# 12. Required Generator Inputs

A generator should require explicit input.

For module generation, minimum input should include:

```txt
moduleId
moduleLabel
primaryResourceName
primaryResourceLabel
modulePurpose
businessObjectsUsed
moduleOwnedEntities
permissions
navigationItems
eventsEmitted
eventsListenedTo
```

The generator should refuse to run if critical information is missing.

For early MVP, a simpler interactive flow is acceptable, but it must not assume unsafe defaults.

Example command:

```bash
npm run module:create inventory
```

Acceptable only if the generator creates a safe skeleton with explicit placeholders and secure defaults.

Better future command:

```bash
npm run module:create -- --spec docs/engineering-manual/17-module-specifications/01-inventory-module.md
```

Best long-term command:

```bash
npm run module:create -- --from-spec inventory.module-spec.json
```

The generator should eventually consume structured module specifications rather than relying only on a module name.

---

# 13. Required Generator Output Characteristics

All generated code must satisfy these characteristics.

## 13.1 Tenant-safe

Generated code must derive tenant context from Kernel helpers.

Required pattern:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

Forbidden pattern:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
const orgId = body.orgId
```

## 13.2 Permission-enforced

Generated API routes and public service methods must enforce permissions.

Required pattern:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

Forbidden pattern:

```ts
// TODO: check permission later
```

## 13.3 API-contract compliant

Generated APIs must return the Kernel API shape:

```ts
return sdk.api.created(data)
return sdk.api.ok(data)
return sdk.api.noContent()
```

or use the approved API wrapper:

```ts
export const POST = sdk.api.handle(async ({ req, params }) => {
  // ...
})
```

Generated APIs must never return redirects, HTML auth pages, raw thrown errors, or arbitrary response shapes.

## 13.4 SDK-only

Generated module code must import platform behavior only from SDK surfaces.

Allowed:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
```

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
```

## 13.5 Server/client split safe

Generated client components must not import server-only SDK code.

Allowed in client components:

```ts
import { sdkClient } from '@/sdk/client'
```

Forbidden in client components:

```ts
import { sdk } from '@/sdk/server'
import { prisma } from '@/kernel/db/client'
```

## 13.6 Validated

Generated API body schemas must use strict validation.

Required:

```ts
export const createInventoryItemSchema = z.strictObject({
  name: z.string().min(1),
})
```

Forbidden:

```ts
export const createInventoryItemSchema = z.object({
  name: z.string(),
  orgId: z.string(),
})
```

## 13.7 Soft-delete aware

Generated delete operations must use soft delete for business records.

Required:

```ts
await db.stockAdjustment.update({
  where: { id_orgId: { id, orgId: ctx.org.id } },
  data: {
    deletedAt: new Date(),
    deletedBy: ctx.user.id,
  },
})
```

Forbidden:

```ts
await db.stockAdjustment.delete({ where: { id } })
```

## 13.8 Event-aware

Generated mutations must emit events from services after successful mutations.

Required:

```ts
await sdk.events.emit(ctx, {
  name: 'inventory.stock_adjustment.created',
  payload: {
    id: record.id,
    adjustmentNo: record.adjustmentNo,
  },
})
```

Forbidden:

```ts
await sdk.events.emit('created', record)
```

## 13.9 Tested

Generated modules must include real tests.

Minimum generated test categories:

```txt
manifest validation
API unauthenticated request returns 401 JSON
API wrong tenant returns safe 404
authorized user succeeds
unauthorized user receives 403 JSON
module-disabled user receives safe 404 or module-disabled response
client-supplied orgId is rejected
service uses PlatformContext
soft delete hides records
event emitted on successful mutation
event not emitted on failed mutation
forbidden imports are absent
```

Generated tests must not be placeholders.

---

# 14. Generator Output Must Be Boring

Generated code should be boring.

Boring means:

```txt
predictable file names
predictable function names
predictable route structure
predictable API response shape
predictable permission checks
predictable test layout
predictable event constants
predictable service signatures
```

Boring code is easy to review, easy to debug, easy for Claude to modify, and easy to lint.

The generator should not optimize for cleverness.

The generator should optimize for correctness and repetition.

---

# 15. Generator Output Must Be Readable

Generated code should look like code a senior engineer would write by hand.

That means:

```txt
clear names
small files
explicit imports
simple control flow
no overly abstract helper chains
no magic strings where constants should exist
no hidden global state
no hard-to-read generated comments
```

Generated code should be maintainable after generation.

OneDayOS is not generating throwaway code.

It is generating the first draft of production code.

---

# 16. Generator Output Must Be Editable

Generated code should be designed for controlled modification.

It should have clear extension points:

```txt
where to add module-owned fields
where to add service methods
where to add custom validation
where to add custom UI sections
where to add event declarations
where to add tests
where not to modify generated safety wrappers
```

Generated files should avoid mixing platform safety logic with business-specific customization.

For example, an API route should be thin and standardized:

```ts
export const POST = sdk.api.handleOrgModuleRoute(
  'inventory',
  async ({ req, ctx, params }) => {
    const input = await sdk.api.parseJson(req, createStockAdjustmentSchema)
    const data = await InventoryService.createStockAdjustment(ctx, input)
    return sdk.api.created(data)
  }
)
```

The business logic belongs in the service.

The API wrapper owns auth, API error shape, and safe response behavior.

---

# 17. Generator Output Must Avoid Premature Abstractions

The generator should not create generic engines before real module patterns exist.

Do not generate:

```txt
generic EntityController
generic CrudService<T>
generic Repository<T>
generic DynamicFormRenderer
generic WorkflowRunner
generic ApprovalEngine usage
generic NotificationEngine usage
generic AI action runner
```

unless the relevant manual documents are frozen and the Three Independent Use Cases Rule is satisfied.

A small amount of repetition is acceptable early.

Bad abstractions are expensive to undo.

---

# 18. Module Generator Philosophy

The module generator is the most important MVP generator.

It should create the standard shell of a business module.

The module generator should output:

```txt
src/modules/[moduleId]/
  manifest.ts
  permissions.ts
  schema.ts
  types.ts
  service.ts
  events.ts
  settings.ts
  navigation.ts
  ai-context.ts
  index.ts
  README.md
  docs.md
  __tests__/
    manifest.test.ts
    service.test.ts
    permissions.test.ts
    events.test.ts

src/app/(platform)/[orgSlug]/[moduleId]/
  page.tsx
  loading.tsx
  not-found.tsx
  _components/
    [module]-list-client.tsx
    [module]-empty-state.tsx

src/app/api/orgs/[orgSlug]/[moduleId]/[resource]/
  route.ts

src/app/api/orgs/[orgSlug]/[moduleId]/[resource]/[id]/
  route.ts
```

The generator may not generate routes like:

```txt
src/app/api/[moduleId]/route.ts
src/app/api/[moduleId]/[id]/route.ts
```

because those routes do not encode tenant context in the URL and encourage `orgId` query parameters.

---

# 19. API Generator Philosophy

Generated API routes must be thin, boring, and safe.

An API route should do only these jobs:

```txt
resolve verified PlatformContext
verify module enablement
validate route params
validate query/body input
delegate to service
map result to standard response
```

It should not contain business logic.

It should not call raw Prisma.

It should not import Kernel internals.

It should not trust browser-provided tenant IDs.

Example shape:

```ts
import { sdk } from '@/sdk/server'
import { InventoryService } from '@/modules/inventory/service'
import { createStockAdjustmentSchema } from '@/modules/inventory/schema'

export const POST = sdk.api.handleOrgModuleRoute(
  'inventory',
  async ({ req, ctx }) => {
    const input = await sdk.api.parseJson(req, createStockAdjustmentSchema)
    const data = await InventoryService.createStockAdjustment(ctx, input)
    return sdk.api.created(data)
  }
)
```

If this wrapper does not exist yet, the API generator must not invent a different pattern. It should wait until the Kernel API contracts and SDK API helpers are implemented.

---

# 20. Service Generator Philosophy

Generated services should be the main home of business behavior.

Service method signatures must use `PlatformContext`.

Required:

```ts
export class InventoryService {
  static async listStockAdjustments(ctx: PlatformContext, input: ListStockAdjustmentsInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'read',
    })

    const db = sdk.getDb(ctx)

    return db.stockAdjustment.findMany({
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
  static async listStockAdjustments(orgId: string) {
    return prisma.stockAdjustment.findMany({ where: { orgId } })
  }
}
```

Generated services must enforce permissions internally for public methods during MVP.

This intentionally duplicates the API route permission check in some cases.

That duplication is acceptable because it prevents unsafe service calls from future pages, jobs, event handlers, or admin utilities.

---

# 21. Schema Generator Philosophy

Generated schemas define security boundaries.

They are not only TypeScript helpers.

Generated schemas must:

```txt
use z.strictObject by default
reject unknown keys
reject orgId
validate route params
validate query strings
validate request bodies
separate create and update schemas
avoid database access in client-safe schema files
export inferred TypeScript types
```

Example:

```ts
import { z } from 'zod'

export const createStockAdjustmentSchema = z.strictObject({
  warehouseId: z.string().min(1),
  reason: z.string().min(1).max(500),
  lines: z.array(
    z.strictObject({
      productId: z.string().min(1),
      quantityDelta: z.number().int(),
    })
  ).min(1),
})

export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>
```

Forbidden:

```ts
export const createStockAdjustmentSchema = z.object({
  orgId: z.string(),
  warehouseId: z.string(),
})
```

The generator must treat `orgId` in input schemas as a security bug.

---

# 22. Manifest Generator Philosophy

Generated manifests must be pure metadata.

They should not self-register.

Required:

```ts
import type { ModuleManifest } from '@/sdk'
import { inventoryPermissions } from './permissions'
import { inventoryNavItems } from './navigation'
import { inventoryEvents } from './events'

export const inventoryManifest: ModuleManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '0.1.0',
  lifecycle: 'draft',
  compatibility: {
    platform: { min: '0.1.0' },
    sdk: { min: '0.1.0' },
    manifest: { version: '1.0.0' },
  },
  permissions: inventoryPermissions,
  navItems: inventoryNavItems,
  events: inventoryEvents,
  businessObjects: ['product', 'warehouse', 'supplier'],
  ownedEntities: ['stock_movement', 'stock_adjustment'],
}
```

Forbidden:

```ts
import { sdk } from '@/sdk/server'

sdk.modules.register(inventoryManifest)
```

Registration belongs to the platform module loader, not module side effects.

---

# 23. Permission Generator Philosophy

Generated permissions must be explicit.

Required:

```ts
export const inventoryPermissions = [
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'read',
    label: 'View stock adjustments',
  },
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
    label: 'Create stock adjustments',
  },
] as const
```

Forbidden:

```ts
permissions: ['create', 'read', 'update', 'delete']
```

Forbidden:

```ts
permissions: ['*']
```

Module manifests declare available permissions. They do not grant permissions.

Admin roles may receive wildcard grants during role seeding, but module manifests must not declare wildcard permissions.

---

# 24. Navigation Generator Philosophy

Generated navigation should be declarative and permission-aware.

Required:

```ts
export const inventoryNavItems = [
  {
    id: 'inventory.stock-levels',
    label: 'Stock Levels',
    href: '/inventory/stock-levels',
    icon: 'Boxes',
    requiredPermission: {
      module: 'inventory',
      resource: 'stock_level',
      action: 'read',
    },
  },
]
```

Generated hrefs should be org-shell-relative.

Allowed:

```txt
/inventory/stock-levels
```

Forbidden:

```txt
/demo-corp/inventory/stock-levels
```

The app shell adds the org slug.

Navigation generation must not create visible links without matching page routes.

---

# 25. Event Generator Philosophy

Generated modules should include event constants and schemas.

Required:

```ts
export const INVENTORY_EVENTS = {
  STOCK_ADJUSTMENT_CREATED: 'inventory.stock_adjustment.created',
  STOCK_ADJUSTMENT_DELETED: 'inventory.stock_adjustment.deleted',
} as const
```

Required payload schema:

```ts
export const stockAdjustmentCreatedPayloadSchema = z.strictObject({
  id: z.string(),
  adjustmentNo: z.string(),
})
```

Forbidden event names:

```txt
inventory.created
inventory.stockAdjustmentCreated
inventory.stock_adjustment.create
inventory.stock_level.low
product.created
```

Correct examples:

```txt
inventory.stock_adjustment.created
inventory.stock_adjustment.deleted
inventory.stock_level.low_detected
objects.product.created
```

Business Object events remain under `objects.*`.

Module-owned entity events use the module ID.

---

# 26. UI Generator Philosophy

Generated UI should follow the Design System, but until the full Design System documents are frozen, the generator should remain conservative.

Generated UI must include:

```txt
page title
clear primary action
premium empty state
loading state
error state
permission-denied behavior
consistent table shell
consistent form shell
keyboard-friendly form submission
sonner toast feedback for mutations
optimistic updates where safe
```

Generated UI must not include:

```txt
generic Bootstrap dashboard cards
random color choices
module-specific design systems
client-specific branding hard-coded into modules
spinners where skeletons are expected
large decorative illustrations by default
unsafe client-side permission fetching
server-only imports in client components
```

Generated client components must use `useParams()` where needed.

They must not accept server `params` objects as client props.

---

# 27. Test Generator Philosophy

The test generator is as important as the module generator.

Generated tests must not simply prove that generated code exists.

Bad test:

```ts
it('returns an array', async () => {
  const result = await Service.list(ctx)
  expect(Array.isArray(result)).toBe(true)
})
```

Better test:

```ts
it('does not return records from another organization', async () => {
  const result = await InventoryService.listStockAdjustments(ctxForOrgA, input)
  expect(result).not.toContainEqual(expect.objectContaining({ orgId: orgB.id }))
})
```

Generated tests must include negative security cases.

Minimum generated module test matrix:

```txt
manifest validates
forbidden imports absent
API unauthenticated request returns 401 JSON
API wrong org returns safe 404
API module disabled returns safe 404 or MODULE_NOT_FOUND
API missing permission returns 403 JSON
API invalid body returns VALIDATION_ERROR
API client-supplied orgId rejected
service authorized context succeeds
service unauthorized context denied
service wrong-tenant context denied
soft-deleted records hidden
mutation emits event after success
mutation does not emit event after failure
module does not duplicate Business Objects
```

The generator should create test files with enough scaffolding that developers and Claude naturally fill in real business cases.

---

# 28. Architecture Check Generator Philosophy

Some generator safety must be enforced by architecture checks, not human memory.

The generator should create or update checks that can detect forbidden patterns.

Examples:

```txt
modules importing @/kernel/*
modules importing other modules
modules importing raw Prisma
client components importing @/sdk/server
schemas containing orgId
API files under /api/[module]
service functions accepting orgId: string
sdk.getDb(orgId)
findUnique({ where: { id } }) on tenant-scoped models
prisma.*.delete on business records
wildcard permissions inside module manifests
manifest self-registration
```

The ideal command:

```bash
npm run check:architecture
```

should fail when generated or handwritten code violates these rules.

The generator should not rely on code review alone.

---

# 29. Generator Safety Rails

The generator must explicitly reject or avoid unsafe output.

Forbidden generated patterns:

```txt
where: { orgId: input.orgId }
where: { orgId: body.orgId }
request.nextUrl.searchParams.get('orgId')
CreateSchema includes orgId
UpdateSchema includes orgId
sdk.getDb(orgId)
sdk.getDb()
import { prisma } from '@/kernel/db/client' inside modules
import { requireAuth } from '@/kernel/auth/session' inside modules
import { can } from '@/kernel/permissions/check' inside modules
import from '@/modules/other-module'
export const POST without permission enforcement
export const GET without verified context
redirect('/login') inside API route
NextResponse.redirect inside API route auth flow
return NextResponse.json({ error: '...' }) with nonstandard shape
prisma.model.delete for business records
findUnique({ where: { id } }) for tenant-scoped records
module manifest with permissions: ['create', 'read']
module manifest with seed: (orgId) => ...
sdk.modules.register(...) inside manifest
```

If a generator cannot produce safe output, it should refuse to run.

---

# 30. Generator and Claude Workflow

Claude should use generators, not replace them.

Correct workflow:

```txt
1. Founder and ChatGPT write/freeze module specification.
2. Claude reads frozen module spec and frozen generator docs.
3. Claude runs approved generator.
4. Claude reviews generated files.
5. Claude implements module-specific business logic inside generated structure.
6. Claude writes/fills tests.
7. Claude runs architecture checks, tests, typecheck, and build.
8. Claude reports deviations.
```

Incorrect workflow:

```txt
1. Founder asks Claude to build Inventory.
2. Claude invents folders, services, routes, schemas, and permissions.
3. Claude creates a working demo.
4. Security and tenancy are patched later.
```

The generator exists so that step 2 never happens.

---

# 31. Generator Input Validation

Generators must validate their own inputs.

For module IDs:

```txt
lowercase
starts with a letter
uses letters, numbers, and hyphens only
no spaces
no underscores in module ID
no reserved names
```

Reserved module IDs:

```txt
kernel
objects
platform
admin
api
auth
settings
users
orgs
organizations
sdk
```

For resource names:

```txt
snake_case for resource IDs
human-readable labels required
plural label required
permission resource required
```

For event names:

```txt
must match {namespace}.{entity}.{past_tense_verb}
must use module ID or objects/kernel namespace
must not use camelCase
must not use future-tense commands
```

For route paths:

```txt
module pages under /[orgSlug]/[moduleId]/...
module APIs under /api/orgs/[orgSlug]/[moduleId]/...
no direct /api/[moduleId] routes
```

If validation fails, the generator must stop with a clear error.

---

# 32. Generated File Ownership

Generated files are not disposable.

After generation, they become normal source files owned by the OneDayOS codebase.

However, generated files should include light metadata comments where useful:

```ts
// Generated by OneDayOS module generator.
// Safe to edit inside documented extension points.
// Do not remove PlatformContext, permission, validation, or tenant checks.
```

Do not spam every file with large generated headers.

A short warning is useful for files where Claude may be tempted to remove safety logic.

---

# 33. Idempotency and Re-runs

Generators should be careful when run multiple times.

For MVP, the safest rule is:

```txt
Do not overwrite existing files by default.
```

If a file exists, the generator should:

```txt
skip it
report it
recommend manual review
```

Future modes may include:

```bash
npm run module:create inventory -- --force
npm run module:update inventory -- --apply-safe-diffs
npm run module:check inventory
```

But MVP should avoid destructive overwrites.

The generator may safely update central index files only if it can do so deterministically and with tests.

---

# 34. Generator Relationship to Database Migrations

Generators may create suggested Prisma model snippets, but they should not silently mutate the schema and run migrations without review.

Allowed:

```txt
create a generated Prisma snippet file
print migration instructions
create a draft schema section for human/Claude review
```

Forbidden:

```txt
automatically editing production schema without review
automatically running prisma migrate deploy
automatically running prisma db push
generating SQL migrations by hand
generating Alembic/FastAPI migration files
```

Prisma migrations remain the database authority.

Database schema changes must pass the Data manual rules.

---

# 35. Generator Relationship to Business Objects

Generators must protect Business Objects.

When a module uses a shared object, the generator should reference the existing Business Object.

Correct:

```txt
Inventory uses Product
Inventory uses Warehouse
Inventory extends Product with InventoryProductExtension
```

Incorrect:

```txt
InventoryProduct duplicates Product
InventoryWarehouse duplicates Warehouse
LeaveEmployee duplicates Employee
CRMCustomer duplicates Customer
PurchasingSupplier duplicates Supplier
```

The generator should ask whether an entity is:

```txt
a shared Business Object
an extension of a Business Object
a module-owned entity
```

If the user asks to generate a module entity with a reserved Business Object name, the generator should stop and explain the existing shared object.

Example:

```txt
Requested entity: Product
Decision: Do not create inventory.products.
Use Business Object Product and create inventory_product_extensions if needed.
```

---

# 36. Generator Relationship to Platform Services

Generators must not create hidden Platform Services.

If a module needs a capability like approvals, notifications, comments, attachments, reports, or background jobs, the generator should initially keep it inside the module unless the Three Independent Use Cases Rule has already promoted that capability.

Example before promotion:

```txt
Leave module has simple leave_request.status and approvedBy fields.
Purchasing module has simple purchase_request.status and approvedBy fields.
Expenses module has simple expense_claim.status and approvedBy fields.
```

After promotion:

```txt
Approval Engine becomes a Platform Service.
Generators can then use sdk.approvals according to frozen docs.
```

The generator must not create `sdk.approvals` usage before the SDK supports it.

---

# 37. Generator Relationship to AI

Generators are more important because Claude will implement much of the platform.

AI coding agents are prone to:

```txt
using familiar generic CRUD patterns
inventing route structures
forgetting tenant security
using raw Prisma because it is simple
creating placeholders for hard parts
mixing UI and business logic
creating inconsistent naming
```

Generators reduce this risk.

The generator should be treated as Claude's guardrail.

Claude should not be trusted to remember every architecture rule every time.

The generator should encode the rules in files, tests, and checks.

---

# 38. Generator Relationship to Dynamic CRUD

The generator is not the Dynamic CRUD Engine.

The MVP module generator creates files.

The future Dynamic CRUD Engine may generate runtime CRUD behavior from metadata.

These are different systems.

MVP generator:

```txt
writes TypeScript files
writes schemas
writes services
writes routes
writes tests
```

Future Dynamic CRUD:

```txt
uses metadata to render forms/tables/routes/actions consistently
may reduce handwritten CRUD code
requires proven patterns from multiple modules
```

Do not confuse them.

The generator can prepare metadata, but it should not prematurely implement runtime dynamic CRUD.

---

# 39. Generator Relationship to Design System

Generated UI must inherit the shared Design System.

Until full Design System documents are frozen, generated UI should remain minimal and conservative.

It should use approved shared components and avoid inventing module-specific styling.

Generated module UI should not be beautiful in a different way.

It should be beautiful in the OneDayOS way.

Generator templates should eventually be updated after these documents are frozen:

```txt
03-design-system/00-design-vision.md
03-design-system/02-layout-system.md
03-design-system/04-table-standards.md
03-design-system/05-form-standards.md
03-design-system/06-empty-loading-error-states.md
03-design-system/07-interaction-motion-standards.md
```

Until then, avoid heavy visual opinions in generated module files.

---

# 40. Generator CLI Architecture

The generator itself should be simple and testable.

Recommended MVP location:

```txt
scripts/generators/
  create-module.ts
  lib/
    naming.ts
    paths.ts
    validation.ts
    write-file.ts
    templates.ts
    update-module-index.ts
  __tests__/
    naming.test.ts
    validation.test.ts
    create-module.test.ts
```

Avoid one giant `scripts/create-module.ts` file long-term.

It was acceptable for an early MVP, but the restarted build should treat generators as platform infrastructure.

The generator should have unit tests for:

```txt
module ID validation
reserved name rejection
file path generation
permission object generation
event name validation
forbidden orgId schema detection
idempotent file writing
index file update behavior
```

---

# 41. Template Strategy

The generator may use plain TypeScript template strings for MVP.

That is acceptable if templates remain readable and tested.

Do not introduce a heavy templating dependency unless there is a clear need.

Preferred MVP approach:

```txt
small TypeScript functions returning strings
one function per generated file type
tests assert important output patterns
```

Example:

```ts
export function renderServiceTemplate(input: ModuleGeneratorInput): string {
  return `...`
}
```

Tests should assert that output contains required architecture patterns:

```ts
expect(output).toContain('PlatformContext')
expect(output).toContain('sdk.permissions.require')
expect(output).toContain('sdk.getDb(ctx)')
expect(output).not.toContain('orgId: string')
expect(output).not.toContain("@/kernel/db/client")
```

This makes generator regressions visible.

---

# 42. Generator Review Checklist

Before a generator change is approved, review:

```txt
[ ] Does it generate APIs under /api/orgs/[orgSlug]/...?
[ ] Does it use PlatformContext?
[ ] Does it avoid loose orgId strings?
[ ] Does it reject client-supplied orgId?
[ ] Does it enforce permissions in routes and services?
[ ] Does it use sdk.getDb(ctx)?
[ ] Does it avoid raw Prisma in modules?
[ ] Does it avoid @/kernel imports in modules?
[ ] Does it avoid direct module imports?
[ ] Does it declare full permission objects?
[ ] Does it generate strict Zod schemas?
[ ] Does it generate soft delete, not hard delete?
[ ] Does it emit correct events?
[ ] Does it generate meaningful tests?
[ ] Does it include two-org tenant tests?
[ ] Does it include non-admin permission-denial tests?
[ ] Does it generate matching nav and page routes?
[ ] Does it avoid deferred Platform Services?
[ ] Does it avoid FastAPI/Python backend files?
[ ] Does it pass architecture checks?
```

If any answer is no, the generator is not ready.

---

# 43. Generator Acceptance Criteria

This document is ready to be marked `Frozen` when:

```txt
[ ] Founder accepts the generator philosophy.
[ ] The distinction between generator and Dynamic CRUD is clear.
[ ] The generator's security responsibilities are explicit.
[ ] The generator's forbidden patterns are explicit.
[ ] The generator's relationship to Claude is explicit.
[ ] MVP generator scope is limited and clear.
[ ] Deferred generator scope is documented.
[ ] Required generated tests are documented.
[ ] Business Object duplication rules are documented.
[ ] Platform Service promotion rules are documented.
[ ] No implementation ambiguity remains for the next generator documents.
```

No generator should be implemented from this philosophy document alone.

Implementation requires the specific generator documents, especially:

```txt
09-cli-generators/01-module-generator.md
09-cli-generators/04-api-generator.md
09-cli-generators/05-test-generator.md
09-cli-generators/06-generator-safety-rails.md
```

---

# 44. Claude Implementation Rules

When Claude implements generator code, Claude must follow these rules:

```txt
Do not invent generator output patterns.
Do not generate APIs under /api/[module].
Do not generate service methods that accept orgId strings.
Do not generate schemas that accept orgId.
Do not generate raw Prisma imports inside modules.
Do not generate @/kernel imports inside modules.
Do not generate direct module imports.
Do not generate permission TODOs.
Do not generate tenant TODOs.
Do not generate auth TODOs.
Do not generate hard deletes for business records.
Do not generate manifest self-registration.
Do not generate placeholder-only tests.
Do not generate deferred Platform Service integrations.
Do not add FastAPI.
Stop if the frozen manual is ambiguous.
```

Claude should treat generator output as a platform contract.

---

# 45. Claude Prompt Template

Use this prompt when asking Claude to implement or modify generators:

```md
You are implementing OneDayOS generator infrastructure.

Authoritative documents:
- docs/engineering-manual/09-cli-generators/00-generator-philosophy.md
- docs/engineering-manual/09-cli-generators/01-module-generator.md
- docs/engineering-manual/09-cli-generators/06-generator-safety-rails.md

Rules:
- Do not invent architecture.
- Do not generate demo-only or insecure code.
- Generated module code must use PlatformContext.
- Generated module code must use sdk.getDb(ctx), never sdk.getDb(orgId).
- Generated module APIs must live under /api/orgs/[orgSlug]/[moduleId]/...
- Generated APIs must return the Kernel { data, error, meta? } shape.
- Generated schemas must reject client-supplied orgId.
- Generated services must enforce permissions.
- Generated tests must include tenant-isolation and permission-denial tests.
- Generated modules may import from @/sdk and @/sdk/server only as allowed.
- Generated modules must not import from @/kernel/*.
- Do not add FastAPI.
- Stop and report ambiguity instead of deciding.

Task:
Implement only the generator subsystem described by the frozen manual document.
```

---

# 46. Final Position

Generators are one of OneDayOS's future competitive advantages.

But only if they generate the right thing.

A weak generator will scale bad architecture.

A strong generator will scale platform discipline.

The correct goal is not:

```txt
Generate code quickly.
```

The correct goal is:

```txt
Generate correct OneDayOS-shaped code every time.
```

That is how OneDayOS can deliver fast without becoming a pile of client-specific templates.

---

# 47. Recommended Next Document

The next document should be:

```txt
09-cli-generators/01-module-generator.md
```

Reason:

The philosophy is now defined. The next step is to specify the exact module generator inputs, output files, templates, validations, safety rails, tests, and Claude implementation instructions.
