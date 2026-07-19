# OneDayOS Engineering Manual — 09.01 Module Generator

**Document ID:** `09-cli-generators/01-module-generator.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Author:** ChatGPT / OneDayOS Architecture Partner  
**Last Updated:** July 2026  
**Implementation Allowed:** `No — freeze before Claude implementation`  
**Target Audience:** Claude Code, senior engineers, future maintainers  
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
- `05-sdk/05-sdk-compatibility-versioning.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/07-business-object-extension-pattern.md`
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
- `09-cli-generators/00-generator-philosophy.md`

---

# 1. Purpose

The Module Generator creates the initial file structure for a new OneDayOS business module.

It is not a toy scaffolder.

It is an architecture enforcement tool.

The generator exists so that every module starts with:

```txt
correct folder structure
correct manifest shape
correct permission declarations
correct route structure
correct API contracts
correct service pattern
correct validation pattern
correct event pattern
correct test baseline
correct documentation baseline
```

The generator must help OneDayOS deliver modules quickly without turning the platform into a collection of unsafe one-off admin pages.

---

# 2. Core Philosophy

The generator should create code that is boring, predictable, secure, and aligned with the Engineering Manual.

The generator must not optimize for impressive demos.

The generator must optimize for long-term platform discipline.

Core principle:

```txt
Generated code should already look like production code.
```

Not complete production functionality, but production-shaped structure.

This means generated code may contain TODOs for domain-specific business logic, but it must not contain TODOs for architecture, tenancy, authorization, validation, or API response shape.

---

# 3. Non-Goals

The Module Generator is not:

```txt
a Dynamic CRUD Engine
a no-code builder
a visual app builder
a Platform Service generator
a FastAPI generator
a database model generator for arbitrary business logic
a per-client fork generator
a marketplace package generator
```

It should generate a safe module shell, not decide business domain architecture.

The generator may create placeholder module-owned entities for development convenience only when explicitly requested, but it must not invent real domain models without a module specification.

---

# 4. Command Shape

The MVP command should be:

```bash
npm run module:create -- <module-id>
```

Example:

```bash
npm run module:create -- inventory
npm run module:create -- leave
npm run module:create -- visitor-management
```

Direct script execution may also be supported:

```bash
tsx scripts/create-module.ts inventory
```

The package script should be:

```json
{
  "scripts": {
    "module:create": "tsx scripts/create-module.ts"
  }
}
```

---

# 5. Module ID Rules

The generator must validate the module ID.

Allowed:

```txt
inventory
leave
crm
visitor-management
incident-reporting
purchase-requests
```

Forbidden:

```txt
Inventory
inventory_module
inventory.module
inventory/module
inventory module
../inventory
@kernel
kernel
objects
admin
api
```

Validation rule:

```ts
const MODULE_ID_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
```

Reserved module IDs:

```txt
kernel
objects
settings
admin
api
auth
sdk
platform
components
modules
users
organizations
```

The generator must fail fast if the module ID is invalid or reserved.

---

# 6. Naming Conventions

Given:

```txt
module-id = visitor-management
```

The generator derives:

```txt
PascalCase: VisitorManagement
camelCase: visitorManagement
Title Case: Visitor Management
kebab-case: visitor-management
constant prefix: VISITOR_MANAGEMENT
```

The generator must consistently use these derived names.

Example file symbols:

```ts
export const visitorManagementManifest = { ... }
export const VISITOR_MANAGEMENT_PERMISSIONS = { ... }
export class VisitorManagementService { ... }
export const visitorManagementEvents = { ... }
```

Do not generate inconsistent names like:

```txt
VisitorModule
VisitorManagementModuleService
visitorManagementModuleManifest
```

---

# 7. Required Generated Files

The generator must create this structure:

```txt
src/modules/[module-id]/
  manifest.ts
  permissions.ts
  schema.ts
  types.ts
  service.ts
  events.ts
  settings.ts
  navigation.ts
  ai-context.ts
  docs.md
  index.ts
  README.md
  __tests__/
    manifest.test.ts
    permissions.test.ts
    schema.test.ts
    service.test.ts
    events.test.ts

src/app/(platform)/[orgSlug]/[module-id]/
  page.tsx
  loading.tsx
  error.tsx
  not-found.tsx
  _components/
    [module-pascal]-list-client.tsx
    [module-pascal]-empty-state.tsx

src/app/api/orgs/[orgSlug]/[module-id]/
  route.ts
  __tests__/
    route.test.ts
```

Optional if `--with-create-page` is passed:

```txt
src/app/(platform)/[orgSlug]/[module-id]/new/
  page.tsx
```

Optional if `--with-detail-page` is passed:

```txt
src/app/(platform)/[orgSlug]/[module-id]/[id]/
  page.tsx
```

Optional if `--with-id-api` is passed:

```txt
src/app/api/orgs/[orgSlug]/[module-id]/[id]/
  route.ts
  __tests__/
    route.test.ts
```

For MVP, the default generator should create the list page and collection API only. Create/detail/update/delete code can be generated behind explicit flags once the API wrapper and testing tools are stable.

---

# 8. Files the Generator Must Not Create

The generator must not create:

```txt
src/kernel/*
src/sdk/*
src/components/ui/*
src/components/kernel/*
src/platform/*
src/modules/[other-module]/*
Python files
FastAPI files
Alembic migrations
SQLAlchemy models
custom Express servers
raw SQL migration files
```

The generator must not modify Prisma schema by default.

Reason: module entity design requires a module specification and architectural review.

If a future `--with-model` option exists, it must be a separate reviewed generator with strict safeguards.

---

# 9. Generated Manifest Contract

The generated `manifest.ts` must be pure metadata.

It must not self-register.

It must not import server-only SDK.

It must not import Kernel internals.

It must not import services.

Correct:

```ts
import type { ModuleManifest } from '@/sdk'
import { MODULE_COMPATIBILITY } from './types'
import { [MODULE]_PERMISSIONS } from './permissions'
import { [module]Navigation } from './navigation'
import { [module]Events } from './events'
import { [module]AiContext } from './ai-context'

export const [module]Manifest: ModuleManifest = {
  id: '[module-id]',
  label: '[Title Case]',
  version: '0.1.0',
  lifecycle: 'draft',
  icon: 'Box',
  compatibility: MODULE_COMPATIBILITY,
  dependencies: [],
  usesBusinessObjects: [],
  ownsEntities: [],
  permissions: Object.values([MODULE]_PERMISSIONS),
  navigation: [module]Navigation,
  routes: {
    pages: [
      {
        path: '/[module-id]',
        label: '[Title Case]',
        requiredPermission: [MODULE]_PERMISSIONS.READ,
      },
    ],
    api: [
      {
        method: 'GET',
        path: '/api/orgs/[orgSlug]/[module-id]',
        requiredPermission: [MODULE]_PERMISSIONS.READ,
      },
    ],
  },
  events: [module]Events.manifest,
  settings: [],
  dashboardWidgets: [],
  aiContext: [module]AiContext,
  docs: {
    readme: 'src/modules/[module-id]/README.md',
    manual: 'src/modules/[module-id]/docs.md',
  },
  provisioning: {
    seedHook: null,
  },
}
```

Forbidden:

```ts
import { sdk } from '@/sdk/server'
sdk.modules.register([module]Manifest)
import { prisma } from '@/kernel/db/client'
import { OtherModuleService } from '@/modules/other/service'
```

Module registration belongs in the platform composition root, not inside the manifest.

---

# 10. Generated Permission Contract

The generated `permissions.ts` must use full permission objects.

Correct:

```ts
import type { PermissionRequirement } from '@/sdk'

export const [MODULE]_PERMISSIONS = {
  READ: {
    module: '[module-id]',
    resource: 'record',
    action: 'read',
  },
  CREATE: {
    module: '[module-id]',
    resource: 'record',
    action: 'create',
  },
  UPDATE: {
    module: '[module-id]',
    resource: 'record',
    action: 'update',
  },
  DELETE: {
    module: '[module-id]',
    resource: 'record',
    action: 'delete',
  },
} as const satisfies Record<string, PermissionRequirement>
```

The generator must not generate wildcard permissions inside module manifests or module permission constants.

Forbidden:

```ts
permissions: ['create', 'read', 'update', 'delete']
{ module: '*', resource: '*', action: '*' }
{ module: '[module-id]', resource: '*', action: '*' }
```

Admin wildcard grants are seeded by Kernel role provisioning, not declared by modules.

---

# 11. Generated Schema Contract

The generated `schema.ts` must use Zod and reject unknown keys.

Correct:

```ts
import { z } from 'zod'

export const [module]ListQuerySchema = z.strictObject({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export const create[Module]RecordSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
})

export const update[Module]RecordSchema = z.strictObject({
  name: z.string().trim().min(1).max(120).optional(),
})

export type [Module]ListQuery = z.infer<typeof [module]ListQuerySchema>
export type Create[Module]RecordInput = z.infer<typeof create[Module]RecordSchema>
export type Update[Module]RecordInput = z.infer<typeof update[Module]RecordSchema>
```

The generated schemas must not include:

```txt
orgId
userId
roleIds
createdBy
updatedBy
deletedBy
```

Those are derived from `PlatformContext`, not accepted from the client.

Forbidden:

```ts
orgId: z.string()
userId: z.string()
deletedBy: z.string()
```

The generated tests must prove `orgId` is rejected.

---

# 12. Generated Service Contract

Generated `service.ts` is the most important file.

It must show the correct service pattern even if real business logic is still TODO.

Correct baseline:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
import { [MODULE]_PERMISSIONS } from './permissions'
import type { [Module]ListQuery, Create[Module]RecordInput } from './schema'
import { [module]Events } from './events'

export class [Module]Service {
  static async list(ctx: PlatformContext, query: [Module]ListQuery) {
    await sdk.permissions.require(ctx, [MODULE]_PERMISSIONS.READ)

    const db = sdk.getDb(ctx)

    // TODO: Replace with real module-owned model after module spec defines it.
    // Must include ctx.org.id and deletedAt: null when querying tenant-scoped records.
    return []
  }

  static async create(ctx: PlatformContext, input: Create[Module]RecordInput) {
    await sdk.permissions.require(ctx, [MODULE]_PERMISSIONS.CREATE)

    const db = sdk.getDb(ctx)

    // TODO: Replace with real Prisma create after module-owned entity exists.
    const record = {
      id: crypto.randomUUID(),
      name: input.name,
    }

    await sdk.events.emit(ctx, [module]Events.recordCreated, {
      recordId: record.id,
      name: record.name,
    })

    return record
  }
}
```

Forbidden service patterns:

```ts
static async list(orgId: string) {}
static async create(input: CreateInput & { orgId: string }) {}
sdk.getDb(orgId)
import { prisma } from '@/kernel/db/client'
import { OtherModuleService } from '@/modules/other/service'
await sdk.events.emit('module.record.created', record) // no ctx, full record
```

Services must receive `PlatformContext`, not loose identifiers.

Services must enforce permissions internally during MVP.

This is intentional duplication with API route checks. If an API route forgets permission enforcement, the service still blocks the operation.

---

# 13. Generated Event Contract

Generated `events.ts` must define event names, payload schemas, and manifest declarations.

Correct:

```ts
import { z } from 'zod'

export const [module]Events = {
  recordCreated: '[module-id].record.created',
  recordUpdated: '[module-id].record.updated',
  recordDeleted: '[module-id].record.deleted',

  manifest: {
    emits: [
      '[module-id].record.created',
      '[module-id].record.updated',
      '[module-id].record.deleted',
    ],
    listens: [],
  },
} as const

export const [module]RecordCreatedPayloadSchema = z.strictObject({
  recordId: z.string().min(1),
  name: z.string().min(1),
})

export const [module]EventPayloadSchemas = {
  [[module]Events.recordCreated]: [module]RecordCreatedPayloadSchema,
}
```

Generated event names must follow:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Correct:

```txt
inventory.stock_adjustment.created
leave.leave_request.approved
visitor-management.visit.checked_in
```

Forbidden:

```txt
inventory.createRecord
inventory.record.create
inventory.record.created.success
record.created
product.created
```

Payloads must not include:

```txt
orgId
full Prisma records
secrets
large nested objects
unredacted sensitive data
```

The event envelope adds org/user context outside the payload.

---

# 14. Generated Settings Contract

Generated `settings.ts` should define an empty settings contract by default.

Correct:

```ts
import type { ModuleSettingDefinition } from '@/sdk'

export const [module]Settings = [] satisfies ModuleSettingDefinition[]
```

The generator must not invent settings.

Settings are added when the module specification proves a real need.

Forbidden:

```txt
auto-generated custom field settings
module-specific theme settings
per-client behavior flags without spec
```

---

# 15. Generated Navigation Contract

Generated `navigation.ts` must export navigation metadata, not React components.

Correct:

```ts
import type { ModuleNavigationItem } from '@/sdk'
import { [MODULE]_PERMISSIONS } from './permissions'

export const [module]Navigation = [
  {
    label: '[Title Case]',
    href: '/[module-id]',
    icon: 'Box',
    requiredPermission: [MODULE]_PERMISSIONS.READ,
  },
] satisfies ModuleNavigationItem[]
```

Navigation hrefs are org-shell-relative.

Correct:

```txt
/inventory
/inventory/stock-levels
/leave/requests
```

Forbidden:

```txt
/[orgSlug]/inventory
/acme-corp/inventory
/api/orgs/[orgSlug]/inventory
```

The App Shell is responsible for prefixing the current organization slug.

---

# 16. Generated AI Context Contract

Generated `ai-context.ts` must be minimal and safe.

Correct:

```ts
import type { ModuleAiContext } from '@/sdk'

export const [module]AiContext = {
  description: '[Title Case] module. Draft module generated by OneDayOS.',
  businessPurpose: 'To be completed in the module specification.',
  commonQuestions: [],
  supportedActions: [],
  forbiddenActions: [
    'Do not access records outside the verified organization.',
    'Do not perform destructive actions without explicit user confirmation.',
  ],
} satisfies ModuleAiContext
```

The generator must not create AI actions that execute mutations.

AI actions require a future AI Layer document and explicit module specification.

---

# 17. Generated Index Contract

Generated `index.ts` should re-export safe module metadata.

Correct:

```ts
export { [module]Manifest } from './manifest'
export { [MODULE]_PERMISSIONS } from './permissions'
export { [module]Events } from './events'
export type * from './types'
```

It must not re-export server-only service classes by default.

Reason: module composition and API routes can import services directly when needed, but broad barrel exports often make accidental client imports easier.

Forbidden:

```ts
export { [Module]Service } from './service'
```

Exception: If future architecture tooling can enforce server-only boundaries reliably, this may be changed by ADR.

---

# 18. Generated Page Contract

The generated module page must be a server component.

It must create verified module context before fetching data.

Correct:

```tsx
import { sdk } from '@/sdk/server'
import { [Module]Service } from '@/modules/[module-id]/service'
import { [module]ListQuerySchema } from '@/modules/[module-id]/schema'
import { [MODULE]_PERMISSIONS } from '@/modules/[module-id]/permissions'
import { [Module]ListClient } from './_components/[module-pascal]-list-client'

export default async function [Module]Page({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { orgSlug } = await params
  const rawSearchParams = await searchParams

  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, '[module-id]')
  await sdk.permissions.require(ctx, [MODULE]_PERMISSIONS.READ)

  const query = [module]ListQuerySchema.parse(rawSearchParams)
  const records = await [Module]Service.list(ctx, query)

  return <[Module]ListClient initialRecords={records} />
}
```

The page must not:

```txt
use client
import raw Prisma
call sdk.getDb(orgId)
read orgId from search params
trust params before context verification
```

---

# 19. Generated Client Component Contract

Generated client components must be UI-only.

They may:

```txt
render data
handle local state
perform optimistic UI
call browser-safe API endpoints
show toasts
use useParams()
use useRouter()
```

They may not:

```txt
import @/sdk/server
import @/kernel/*
import raw Prisma
perform permission decisions from scratch
read or submit orgId
construct cross-tenant URLs
```

Correct mutation URL:

```ts
const { orgSlug } = useParams<{ orgSlug: string }>()

await fetch(`/api/orgs/${orgSlug}/[module-id]`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(inputWithoutOrgId),
})
```

Forbidden mutation URL:

```ts
await fetch('/api/[module-id]?orgId=' + orgId)
await fetch('/api/[module-id]', { body: JSON.stringify({ ...input, orgId }) })
```

---

# 20. Generated API Route Contract

Generated module APIs must live under:

```txt
src/app/api/orgs/[orgSlug]/[module-id]/route.ts
```

Correct API pattern:

```ts
import { sdk } from '@/sdk/server'
import { [Module]Service } from '@/modules/[module-id]/service'
import { [module]ListQuerySchema, create[Module]RecordSchema } from '@/modules/[module-id]/schema'
import { [MODULE]_PERMISSIONS } from '@/modules/[module-id]/permissions'

export const GET = sdk.api.handleOrgModuleRoute(
  '[module-id]',
  async ({ ctx, request }) => {
    await sdk.permissions.require(ctx, [MODULE]_PERMISSIONS.READ)

    const query = [module]ListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    )

    const data = await [Module]Service.list(ctx, query)
    return sdk.api.ok(data)
  }
)

export const POST = sdk.api.handleOrgModuleRoute(
  '[module-id]',
  async ({ ctx, request }) => {
    await sdk.permissions.require(ctx, [MODULE]_PERMISSIONS.CREATE)

    const body = await request.json()
    const input = create[Module]RecordSchema.parse(body)

    const data = await [Module]Service.create(ctx, input)
    return sdk.api.created(data)
  }
)
```

Generated API routes must:

```txt
return JSON only
use Kernel API response shape
create verified PlatformContext
verify tenant membership
verify module enablement
verify permissions
validate params/query/body
reject client-supplied orgId
call services with ctx
never redirect
never return HTML auth responses
```

Forbidden API route paths:

```txt
/api/[module-id]
/api/[module-id]/[id]
/api/modules/[module-id]
/api/kernel/[module-id]
```

Forbidden API route patterns:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
const orgId = body.orgId
await sdk.auth.requireAuth() // if redirect-style helper
await [Module]Service.list(orgId)
return NextResponse.redirect('/login')
```

---

# 21. Generated API Response Shape

Generated APIs must use the Kernel response contract:

Success:

```json
{
  "data": {},
  "error": null
}
```

Failure:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request.",
    "details": {}
  }
}
```

Generated APIs must not return:

```json
{ "success": true }
```

or:

```json
{ "error": "Invalid input" }
```

or raw Zod errors directly.

---

# 22. Generated Tests

The generator must create real tests, not placeholders.

Required test files:

```txt
src/modules/[module-id]/__tests__/manifest.test.ts
src/modules/[module-id]/__tests__/permissions.test.ts
src/modules/[module-id]/__tests__/schema.test.ts
src/modules/[module-id]/__tests__/service.test.ts
src/modules/[module-id]/__tests__/events.test.ts
src/app/api/orgs/[orgSlug]/[module-id]/__tests__/route.test.ts
```

Generated tests must prove:

```txt
manifest is valid
manifest has no wildcard permissions
manifest routes use org-scoped API paths
permissions use full permission objects
schema rejects unknown fields
schema rejects client-supplied orgId
service requires PlatformContext
service calls sdk.permissions.require
service calls sdk.getDb(ctx), not sdk.getDb(orgId)
events follow naming convention
event payload schemas reject orgId
API returns 401 JSON when unauthenticated
API returns 404 MODULE_NOT_FOUND when module disabled
API returns 403 JSON when permission denied
API rejects client-supplied orgId
API validates request body/query
API calls service with PlatformContext
```

Tests may use mocks, but they must test behavior.

Forbidden tests:

```ts
expect(service).toBeDefined()
expect(Array.isArray(await service.list())).toBe(true)
expect(manifest.id).toBe('[module-id]') // if this is the only manifest test
```

Tautological tests are not acceptable.

---

# 23. Generated README Contract

The generated `README.md` should help a future engineer understand what exists and what must be completed.

Required sections:

```md
# [Title Case] Module

## Status
Draft / Generated

## Purpose
To be completed in the module specification.

## Generated Files
[list]

## Architecture Rules
- Use @/sdk/server in server code only.
- Do not import @/kernel/*.
- Do not import other modules.
- Do not accept orgId from the client.
- Services receive PlatformContext.
- APIs live under /api/orgs/[orgSlug]/[module-id].

## Required Next Steps
1. Write or link the module specification.
2. Define module-owned entities.
3. Add Prisma models through reviewed migration.
4. Replace placeholder service logic.
5. Expand tests.
6. Freeze module spec before production use.

## Forbidden Shortcuts
[list]
```

---

# 24. Generated docs.md Contract

The generated `docs.md` should be a placeholder for module-level operational documentation.

It should include:

```md
# [Title Case] Module Documentation

## Business Purpose
TBD

## Workflows
TBD

## Permissions
TBD

## Screens
TBD

## Events
TBD

## Settings
TBD

## AI Context
TBD

## Client Training Notes
TBD
```

It must not invent domain documentation.

---

# 25. Registry Update Behavior

The generator may update:

```txt
src/modules/index.ts
```

The update should add a pure manifest export/import entry.

Preferred `src/modules/index.ts` shape:

```ts
import { inventoryManifest } from './inventory/manifest'
import { leaveManifest } from './leave/manifest'

export const moduleManifests = [
  inventoryManifest,
  leaveManifest,
] as const
```

When adding a module, the generator should:

1. parse existing file safely,
2. add import if absent,
3. add manifest to array if absent,
4. avoid duplicate entries,
5. preserve formatting where possible.

If the file cannot be safely updated, the generator should fail with a clear manual instruction.

It must not rely on side effects like:

```ts
import '@/modules/inventory/manifest'
```

and it must not ask the developer to manually import manifests in `src/app/layout.tsx`.

---

# 26. Existing File Behavior

The generator must never silently overwrite an existing file.

Default behavior:

```txt
If target file exists → fail the command.
```

Allowed override behavior:

```bash
npm run module:create -- inventory --force
```

But `--force` must be dangerous and explicit. It may overwrite generated files only if they contain a generator marker.

Generated files should include a marker comment:

```ts
// Generated by OneDayOS Module Generator.
// Safe to edit, but do not remove architecture guardrails.
```

For files likely to be heavily edited, the marker should not imply they can be regenerated safely.

Recommended behavior:

```txt
manifest.ts                fail if exists
permissions.ts             fail if exists
schema.ts                  fail if exists
service.ts                 fail if exists
README.md                  fail if exists
page.tsx                   fail if exists
registry index update      idempotent
```

---

# 27. Dry Run Mode

The generator should support:

```bash
npm run module:create -- inventory --dry-run
```

Dry run should print:

```txt
CREATE src/modules/inventory/manifest.ts
CREATE src/modules/inventory/permissions.ts
CREATE src/modules/inventory/schema.ts
CREATE src/modules/inventory/service.ts
CREATE src/app/(platform)/[orgSlug]/inventory/page.tsx
CREATE src/app/api/orgs/[orgSlug]/inventory/route.ts
UPDATE src/modules/index.ts
```

It should not write files.

Dry run is useful before asking Claude to implement a module.

---

# 28. Check Mode

The generator should support:

```bash
npm run module:create -- inventory --check
```

Check mode validates that a generated module still follows the module folder contract.

Minimum checks:

```txt
required files exist
manifest is importable
manifest has correct id
permissions are full objects
no wildcard manifest permissions
no @/kernel imports
no raw Prisma imports
no direct module imports
no sdk.getDb(orgId)
no client-supplied orgId schema fields
API route path exists under /api/orgs/[orgSlug]
page path exists under /[orgSlug]/[module-id]
required tests exist
```

This check mode may later become part of:

```bash
npm run check:architecture
```

---

# 29. Required CLI Output

Successful generation should output:

```txt
✅ OneDayOS module generated: inventory

Created:
- src/modules/inventory/manifest.ts
- src/modules/inventory/permissions.ts
- src/modules/inventory/schema.ts
- src/modules/inventory/types.ts
- src/modules/inventory/service.ts
- src/modules/inventory/events.ts
- src/modules/inventory/settings.ts
- src/modules/inventory/navigation.ts
- src/modules/inventory/ai-context.ts
- src/modules/inventory/docs.md
- src/modules/inventory/README.md
- src/app/(platform)/[orgSlug]/inventory/page.tsx
- src/app/api/orgs/[orgSlug]/inventory/route.ts

Updated:
- src/modules/index.ts

Next steps:
1. Write or attach the Inventory Module Specification.
2. Define module-owned entities in the module spec.
3. Add Prisma models only after schema review.
4. Replace placeholder service logic.
5. Run npm run check:architecture.
6. Run npm run test:run.
7. Run npm run typecheck.
8. Run npm run build.
```

The generator must not claim the module is production-ready.

---

# 30. Required Failure Messages

Failure messages should be specific.

Bad:

```txt
Error.
```

Good:

```txt
Cannot create module "kernel" because "kernel" is a reserved platform namespace.
```

Good:

```txt
Refusing to create module because src/modules/inventory/service.ts already exists.
Use a different module ID or manually remove the existing module.
```

Good:

```txt
Refusing to generate schema with orgId field. Tenant identity must come from PlatformContext, not client input.
```

Good:

```txt
Could not safely update src/modules/index.ts. Add inventoryManifest manually to moduleManifests.
```

---

# 31. Forbidden Generated Patterns

The generator must never output these patterns:

```ts
import { prisma } from '@/kernel/db/client'
```

```ts
import { something } from '@/kernel/*'
```

```ts
import { OtherModuleService } from '@/modules/other-module/service'
```

```ts
sdk.getDb(orgId)
```

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

```ts
const { orgId } = await request.json()
```

```ts
orgId: z.string()
```

```ts
await sdk.auth.requireAuth()
```

inside API routes if that helper redirects.

```ts
return NextResponse.redirect('/login')
```

inside API routes.

```ts
permissions: ['create', 'read', 'update', 'delete']
```

inside manifests.

```ts
sdk.modules.register(manifest)
```

inside module manifest files.

```ts
await sdk.events.emit('module.record.created', record)
```

without `ctx` and with full record payload.

```ts
where: { id }
```

on tenant-scoped soft-deletable module records.

---

# 32. Module-Owned Entity Placeholder Policy

The default generator should not create Prisma models.

However, generated service comments may show the intended future pattern.

Correct placeholder comment:

```ts
// TODO after module spec is approved:
// Add a module-owned Prisma model with orgId, createdAt, updatedAt, deletedAt, deletedBy.
// Query it only through sdk.getDb(ctx) and tenant-scoped filters.
```

Forbidden placeholder comment:

```ts
// TODO: add orgId to the form and pass it here.
```

If a future flag is added:

```bash
npm run module:create -- inventory --with-model StockMovement
```

that flag must be governed by a separate `crud-generator` or `model-generator` document. It must not be part of MVP.

---

# 33. Business Object Safeguards

The generator must ask whether the module uses existing Business Objects, but it must not create duplicate Business Objects.

For interactive CLI later:

```txt
Does this module use shared Business Objects? Select all:
[ ] Employee
[ ] Product
[ ] ProductCategory
[ ] Customer
[ ] Supplier
[ ] Warehouse
```

If the user selects `Product`, the manifest should include:

```ts
usesBusinessObjects: ['product']
```

But the generator must not create:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
```

unless those are explicitly extension tables and named accordingly:

```txt
InventoryProductExtension
CrmCustomerExtension
LeaveEmployeePolicy
PurchasingSupplierTerms
```

Even then, extension tables require a module specification and migration review.

---

# 34. Security Requirements

Every generated module must assume hostile input.

The generator must produce code that enforces:

```txt
authentication
tenant membership
module enablement
permission enforcement
input validation
client-supplied orgId rejection
soft delete behavior
JSON-only API errors
```

At minimum, generated API tests must cover:

```txt
unauthenticated request → 401 JSON
wrong organization → safe 404 JSON
module disabled → safe 404 JSON
missing permission → 403 JSON
invalid body/query → 400 VALIDATION_ERROR
body containing orgId → 400 VALIDATION_ERROR
successful request → { data, error: null }
```

If the generated test utilities are not ready, the generator should still create test files with explicit failing tests marked as required, not vague TODOs.

---

# 35. Implementation Strategy

The generator should be implemented in phases.

## Phase 1 — Safe static generator

Scope:

```txt
validate module ID
generate fixed file structure
generate pure manifest
generate permission constants
generate Zod schemas
generate service skeleton
generate event constants/schemas
generate navigation metadata
generate AI context placeholder
generate docs/README
generate route/page skeletons
generate test skeletons with real assertions
update src/modules/index.ts idempotently
support --dry-run
fail on existing files
```

Do not include:

```txt
interactive prompts
Prisma schema editing
CRUD model generation
form generation
component design generation
module dependencies selection
Business Object extension generation
```

## Phase 2 — Architecture check mode

Scope:

```txt
module folder validation
forbidden import scan
unsafe orgId scan
manifest validation
permission validation
route path validation
test existence validation
```

## Phase 3 — Spec-aware generation

Only after module specifications become consistent.

Possible future:

```bash
npm run module:create -- --from-spec docs/engineering-manual/17-module-specifications/01-inventory-module.md
```

This is not MVP.

## Phase 4 — Dynamic CRUD integration

Only after Dynamic CRUD is approved.

This is explicitly deferred.

---

# 36. Claude Implementation Rules

When Claude implements this generator, it must follow these rules:

```txt
1. Implement only the Module Generator.
2. Do not generate business modules yet unless explicitly asked to test generation.
3. Do not add FastAPI, Python backend, Alembic, or SQLAlchemy.
4. Do not modify Kernel architecture.
5. Do not modify SDK public API unless the frozen SDK documents require it.
6. Do not create Prisma models for generated modules by default.
7. Do not generate /api/[module] routes.
8. Do not generate orgId fields in client schemas.
9. Do not generate sdk.getDb(orgId).
10. Do not generate raw Prisma imports inside modules.
11. Do not generate direct imports from other modules.
12. Do not self-register manifests.
13. Do not overwrite existing files silently.
14. Add tests for the generator itself.
15. Add architecture checks for generated output.
```

If Claude finds ambiguity, it should stop and report the ambiguity instead of inventing a pattern.

---

# 37. Generator Tests

The generator itself must be tested.

Required tests:

```txt
valid module ID generates expected files
invalid module ID fails
reserved module ID fails
existing file prevents generation
dry-run writes no files
manifest file contains no sdk.modules.register
manifest file contains no @/sdk/server import
manifest file contains no @/kernel import
permissions are full objects
schema rejects orgId
service uses PlatformContext
service uses sdk.getDb(ctx)
service does not use sdk.getDb(orgId)
API route path is /api/orgs/[orgSlug]/[module-id]
API route uses sdk.api wrapper
API route does not use redirect auth helper
module index update is idempotent
```

Test strategy:

```txt
create temporary directory
run generator into temp directory
inspect file tree
inspect generated file contents
run generated tests if feasible
```

The test suite should not depend on the real project directory.

---

# 38. Architecture Check Integration

Generated code should pass future checks:

```bash
npm run check:architecture
npm run test:run
npm run typecheck
npm run build
```

At minimum, `check:architecture` should eventually scan for:

```txt
@/kernel imports inside src/modules
raw Prisma imports inside src/modules
direct module-to-module imports
sdk.getDb(orgId)
request.nextUrl.searchParams.get('orgId')
body.orgId
orgId in generated Zod schemas
/api/[module] route patterns
manifest self-registration
wildcard permissions inside module manifests
findUnique({ where: { id } }) on tenant-scoped records
```

The generator should produce code that passes these checks from day one.

---

# 39. Example Generated Module Summary

For:

```bash
npm run module:create -- inventory
```

The generated module should be a safe shell:

```txt
Inventory exists in the module registry.
Inventory has a pure manifest.
Inventory declares permissions.
Inventory declares navigation.
Inventory has server-only service skeleton.
Inventory has Zod schemas rejecting orgId.
Inventory has event contracts.
Inventory has org-scoped API route.
Inventory has org-scoped page route.
Inventory has tests proving security guardrails.
Inventory does not define Product.
Inventory does not define Warehouse.
Inventory does not import Kernel internals.
Inventory does not import other modules.
Inventory does not use raw Prisma.
Inventory is not production-ready until its module spec and real entities are implemented.
```

---

# 40. Acceptance Criteria

This document is ready to freeze when:

```txt
[ ] Module generator command shape is approved.
[ ] Required generated files are approved.
[ ] Manifest pattern is approved.
[ ] Permission pattern is approved.
[ ] Schema pattern is approved.
[ ] Service pattern is approved.
[ ] API route pattern is approved.
[ ] Page/component pattern is approved.
[ ] Test requirements are approved.
[ ] Forbidden generated patterns are approved.
[ ] Registry update behavior is approved.
[ ] No conflict remains with SDK documents.
[ ] No conflict remains with Module System documents.
[ ] No conflict remains with Data/Tenancy documents.
```

Generated module output is acceptable only if:

```txt
[ ] It compiles.
[ ] It does not import @/kernel from module code.
[ ] It does not use raw Prisma in module code.
[ ] It does not accept client-supplied orgId.
[ ] It uses PlatformContext.
[ ] It uses sdk.getDb(ctx).
[ ] It uses org-scoped API routes.
[ ] It uses JSON-only API responses.
[ ] It declares full permission objects.
[ ] It emits typed events with ctx.
[ ] It includes real tests.
[ ] It does not duplicate Business Objects.
```

---

# 41. Final Rule

The Module Generator must make the correct architecture the path of least resistance.

If the generated code is insecure, Claude will scale insecurity.

If the generated code is generic, OneDayOS will become a generic admin starter.

If the generated code is disciplined, OneDayOS can become the fastest platform for building internal business software without becoming a pile of client-specific forks.

Therefore:

```txt
The generator is part of the platform architecture.
Treat it like production infrastructure.
```

---

# ADR-0011 Generator UX Amendment

After UX governance is reviewed and frozen, future module generator output must include UX scaffolding:

```txt
src/modules/[module]/ux.ts
src/modules/[module]/process-flow.ts
src/modules/[module]/UX-CONFORMANCE.md
src/app/[orgSlug]/[module]/process-flow/page.tsx
```

Generated UX scaffolds must:

```txt
[ ] require a Module UX Contract before real implementation
[ ] include a Process Flow page
[ ] explain what the module owns and does not own
[ ] reference shared Business Objects instead of duplicating identity
[ ] use shared page patterns
[ ] avoid fake dashboard metrics and fake charts
[ ] include contextual loading and error-state placeholders
```

This amendment documents future generator behavior only. This package does not implement or modify the generator.
