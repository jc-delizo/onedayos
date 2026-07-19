# OneDayOS Engineering Manual — SDK Overview

**Document ID:** `05-sdk/00-sdk-overview.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT / OneDayOS Architecture Partner  
**Date:** July 2026  
**Project:** OneDayOS  
**Website:** onedayonlysystems.com

---

# 1. Purpose

This document defines the purpose, boundaries, and first implementation shape of the **OneDayOS SDK**.

The SDK is the public internal interface between the OneDayOS platform and business modules.

It exists so that modules do not depend on Kernel internals.

OneDayOS is expected to live for many years, support many clients, and eventually support many modules. Kernel internals will change. Database routing may change. Authentication behavior may change. Event delivery may change. Platform Services may be introduced later.

Modules should not need to be rewritten every time those internals change.

The SDK is the seam that protects that future.

---

# 2. Core Position

The SDK is not optional.

Every business module must use the SDK for platform capabilities.

A module may not directly import from:

```txt
@/kernel/*
@/kernel/db/*
@/kernel/auth/*
@/kernel/permissions/*
@/kernel/modules/*
@/kernel/events/*
```

A module may import only from:

```txt
@/sdk
@/sdk/server
@/sdk/client
@/components/*
its own module folder
shared type-only packages explicitly approved later
```

The SDK is how OneDayOS keeps the Kernel private and replaceable.

---

# 3. Architectural Rule

The SDK is the **only supported interface** between Business Modules and the platform.

```txt
Business Module
   ↓
SDK
   ↓
Kernel / Business Objects / Platform Services
```

Modules do not know how the Kernel works internally.

Modules do not know whether the event bus is in-process, Redis-backed, database-backed, or queue-backed.

Modules do not know whether the database is one shared PostgreSQL database or database-per-tenant later.

Modules do not know whether permissions are simple RBAC or later ABAC.

Modules use SDK contracts.

---

# 4. Why the SDK Exists

The SDK exists for eight reasons.

## 4.1 To protect Kernel internals

The Kernel should be free to change implementation details without breaking modules.

For example, today the Kernel may use:

```txt
Supabase Auth
Prisma
PostgreSQL
In-process EventBus
Next.js route handlers
```

Later, OneDayOS may add:

```txt
Row Level Security
Queue-backed events
Background jobs
External search index
Object storage
AI context engine
Multi-org users
Database-per-tenant routing
```

Modules should not care.

## 4.2 To enforce tenant safety

Modules must never accept loose `orgId` strings as proof of tenant identity.

The SDK must make the safe path the easy path.

The correct pattern is:

```ts
const ctx = await sdk.context.requireApiContext(...)
const db = sdk.getDb(ctx)
```

Not:

```ts
const orgId = body.orgId
const db = sdk.getDb(orgId)
```

The previous MVP plan used `sdk.getDb(orgId)` as a useful database-routing seam, but the restarted build should improve that seam by requiring verified `PlatformContext` instead of loose tenant IDs.

## 4.3 To enforce authorization consistently

Permission checks must not be copy-pasted across modules.

The SDK should provide helpers such as:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

This avoids the previous MVP risk where `can()` existed but routes and services did not enforce it.

## 4.4 To keep modules decoupled

Modules must never call each other directly.

Bad:

```ts
import { LeaveService } from '@/modules/leave/service'
```

Good:

```ts
await sdk.events.emit(ctx, 'hr.employee.deactivated', payload)
```

Cross-module behavior happens through platform contracts, primarily events and shared Business Objects.

## 4.5 To support AI-assisted development

Claude Code and future AI coding agents need a stable API surface.

The SDK gives Claude a narrow set of allowed tools.

Instead of allowing Claude to browse the repository and invent access patterns, we say:

```txt
Use the SDK.
Do not import Kernel internals.
Do not invent new platform access patterns.
```

## 4.6 To support future generators

The Module Generator, CRUD Generator, and Form Generator should all generate code that follows SDK patterns.

If the SDK is stable, generated code is safer.

If the SDK is vague, generated code will drift.

## 4.7 To support future marketplace modules

If OneDayOS later supports module marketplace distribution, modules must depend on a public platform contract, not internal file paths.

The SDK is the beginning of that contract.

## 4.8 To reduce long-term support cost

A platform with modules directly importing internals becomes expensive to maintain.

Every Kernel refactor becomes a multi-module refactor.

The SDK prevents that.

---

# 5. Important New-Build Correction

The previous MVP implementation treated the SDK mostly as a single object exported from:

```txt
src/sdk/index.ts
```

For the restarted build, we should improve this design.

The SDK should be split into **server-safe** and **client-safe** surfaces.

This matters because Next.js can accidentally bundle imports into client components if boundaries are not explicit.

The restarted build should use:

```txt
src/sdk/
  index.ts        # shared type exports, constants, version metadata only
  server.ts       # server-only SDK: db, auth, context, permissions, events
  client.ts       # client-safe SDK: browser helpers, fetch wrappers, UI utilities
  types.ts        # shared SDK types
```

## 5.1 Server SDK

`@/sdk/server` may import server-only dependencies:

```txt
Prisma
Supabase server client
Next.js cookies
Kernel auth helpers
Kernel context helpers
Kernel permission checks
Event bus
```

It must include:

```ts
import 'server-only'
```

## 5.2 Client SDK

`@/sdk/client` must not import:

```txt
Prisma
server-only auth helpers
Supabase service role client
Next.js cookies
Kernel DB code
Kernel permission internals
```

It may include:

```txt
fetch wrappers
client-safe auth helpers
current org route helpers
optimistic UI helpers
API response helpers
```

## 5.3 Shared SDK index

`@/sdk` should not accidentally import server-only code.

It should primarily export:

```txt
types
constants
version metadata
module manifest types
permission action constants
```

This is a deliberate correction to avoid one giant SDK object that can be accidentally imported by client components.

---

# 6. FastAPI Decision

OneDayOS should **not use FastAPI in the core platform MVP or restarted Kernel build**.

The core platform should remain:

```txt
Next.js App Router
TypeScript
Next.js Route Handlers
Supabase Auth
PostgreSQL
Prisma
Vercel
```

FastAPI would introduce a second backend runtime, second deployment unit, second auth integration path, second logging/monitoring surface, and second source of architectural decisions.

That is not worth it for the Kernel, SDK, module system, or first modules.

## 6.1 Why not FastAPI now?

Because OneDayOS needs platform maturity, not backend fragmentation.

Adding FastAPI now would increase:

```txt
operational cost
deployment complexity
security surface area
auth/session complexity
tenant isolation risk
Claude implementation ambiguity
maintenance burden
```

The platform is already complex enough with:

```txt
multi-tenancy
RBAC
module registry
SDK
Business Objects
event bus
future Dynamic CRUD
future AI layer
future Platform Services
```

A second backend should not be introduced unless it solves a proven problem that the TypeScript platform cannot solve cleanly.

## 6.2 When could FastAPI be allowed later?

FastAPI may be considered later only through an ADR and only for a clearly bounded service.

Possible future cases:

```txt
AI/RAG processing that strongly benefits from Python libraries
heavy document parsing or OCR pipelines
background data-processing workers
ML model orchestration
integration code where Python ecosystem support is materially better
```

Even then, FastAPI must not become the general backend of OneDayOS.

It would be a **specialized Platform Service**, not the core application server.

## 6.3 FastAPI rules if introduced later

If OneDayOS introduces FastAPI later, these rules apply:

```txt
FastAPI must be approved through an ADR.
FastAPI must be owned by a specific Platform Service.
FastAPI must not be called directly by modules.
FastAPI must not replace Next.js route handlers for normal app APIs.
FastAPI must not receive raw client-supplied orgId as tenant proof.
FastAPI must not bypass OneDayOS permissions.
FastAPI must not become a second source of truth for business data.
FastAPI must have its own security tests, deployment docs, and monitoring.
```

Preferred interaction pattern:

```txt
Client
  ↓
Next.js API route / Server Action
  ↓
OneDayOS SDK / Platform Service
  ↓
Optional internal FastAPI service
```

Not:

```txt
Client
  ↓
FastAPI
  ↓
Database
```

## 6.4 Current decision

Current decision:

```txt
Do not use FastAPI for the restarted platform build.
Do not ask Claude to add FastAPI.
Do not create a Python backend.
Use Next.js route handlers as the backend boundary.
Revisit only if a future ADR proves the need.
```

---

# 7. SDK Design Goals

The SDK must be:

## 7.1 Stable

Modules should depend on SDK contracts that do not change casually.

Breaking SDK changes require:

```txt
ADR
migration guide
compatibility notes
module update plan
```

## 7.2 Small

The SDK should not expose every Kernel function.

It should expose only what modules need.

A small SDK is easier to keep stable.

## 7.3 Safe by default

Unsafe operations should be difficult to perform.

Examples:

```txt
No sdk.getDb(orgId: string)
No API helper that redirects in APIs
No permission helper that allows missing tenant context
No mutation helper without actor context
No event emission without org context
```

## 7.4 Explicit

SDK functions should require clear parameters.

Good:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

Bad:

```ts
await sdk.permissions.require('create')
```

## 7.5 Typed

The SDK should make illegal states harder to represent.

Use TypeScript types to distinguish:

```txt
Raw session user
Platform User
Organization
Verified PlatformContext
API error
Permission requirement
Module manifest
Event name
```

## 7.6 Testable

Modules should be able to mock the SDK cleanly in tests.

The SDK should include testing helpers later, but the MVP should at least keep the SDK surface predictable.

## 7.7 Server/client safe

Server-only functions must not be importable from client components by accident.

This is why the restarted build should split `@/sdk/server` and `@/sdk/client`.

---

# 8. SDK Non-Goals

The SDK is not:

```txt
A public API for external customers
A replacement for all internal Kernel code
A no-code engine
A GraphQL layer
A FastAPI client
A dumping ground for random utilities
A way to bypass architecture review
```

The SDK should not grow just because a helper is convenient.

If a function is only useful to one module, keep it in that module.

If a function becomes useful across multiple modules, consider promoting it through the Three Independent Use Cases Rule.

---

# 9. SDK Package Structure

Recommended new-build structure:

```txt
src/sdk/
  index.ts
  server.ts
  client.ts
  types.ts
  constants.ts
  errors.ts
  testing.ts             # future
  __tests__/
    sdk-boundaries.test.ts
    server-sdk.test.ts
    client-sdk.test.ts
```

## 9.1 `src/sdk/index.ts`

Shared public entrypoint.

Allowed exports:

```txt
SDK_VERSION
KERNEL_VERSION
ModuleManifest type
PlatformContext type
ApiResponse type
ApiError type
PermissionRequirement type
EventName type
constants
```

Forbidden imports:

```txt
@/kernel/db/client
@/kernel/auth/server
next/headers
server-only dependencies
```

## 9.2 `src/sdk/server.ts`

Server-only entrypoint.

Must begin with:

```ts
import 'server-only'
```

Allowed capabilities:

```txt
context creation
auth helpers
database access
permission enforcement
module registry access
event emission
settings access
server API helpers
Business Object services when created
```

## 9.3 `src/sdk/client.ts`

Client-safe entrypoint.

Allowed capabilities:

```txt
browser auth helper wrappers
fetch helpers
API response parsing
current route helpers
client-side permission visibility helpers if supplied by server
optimistic UI helpers later
```

Forbidden capabilities:

```txt
Prisma
service role key
server cookies
raw permission DB checks
raw module registry DB checks
```

## 9.4 `src/sdk/types.ts`

Shared SDK types.

Should contain no runtime logic.

## 9.5 `src/sdk/constants.ts`

Shared constants.

Examples:

```ts
export const SDK_VERSION = '1.0.0'
export const KERNEL_VERSION = '1.0.0'
```

## 9.6 `src/sdk/errors.ts`

Shared error types and constructors.

Should be safe for server and client.

---

# 10. PlatformContext

`PlatformContext` is the most important SDK concept.

It represents a verified platform request context.

It is created by Kernel auth and tenancy helpers.

It is passed into services, permission checks, event emission, database access, and future Platform Services.

## 10.1 Why PlatformContext exists

Loose identifiers are dangerous.

Bad:

```ts
InventoryService.list(orgId)
InventoryService.create(userId, orgId, input)
sdk.getDb(orgId)
```

Better:

```ts
InventoryService.list(ctx)
InventoryService.create(ctx, input)
sdk.getDb(ctx)
```

The difference is that `ctx` is not a string from the client.

It is a verified object created by the Kernel.

## 10.2 Required fields

Initial type:

```ts
export type PlatformContext = Readonly<{
  requestId: string
  authUserId: string
  userId: string
  orgId: string
  orgSlug: string
  orgStatus: 'trial' | 'active' | 'suspended' | 'cancelled'
  userIsActive: boolean
  source: 'page' | 'api' | 'service' | 'job'
}>
```

## 10.3 Optional future fields

Future versions may include:

```ts
export type PlatformContext = Readonly<{
  // MVP fields above
  roles?: string[]
  permissions?: string[]
  enabledModules?: string[]
  branchId?: string | null
  departmentId?: string | null
  employeeId?: string | null
  impersonation?: {
    actorUserId: string
    reason: string
    expiresAt: string
  }
}>
```

Do not add these until needed.

## 10.4 Context creation rule

Only Kernel/SDK server helpers may create `PlatformContext`.

Modules may receive it.

Modules may pass it.

Modules may not fabricate it.

## 10.5 Context immutability

`PlatformContext` should be treated as immutable.

Do not mutate it inside services.

If a future service needs a derived context, create a new typed context explicitly.

---

# 11. Server SDK Surface

The initial server SDK should expose the following namespaces.

```ts
import { sdk } from '@/sdk/server'
```

Recommended shape:

```ts
export const sdk = {
  context,
  auth,
  permissions,
  modules,
  events,
  settings,
  api,
  getDb,
}
```

---

# 12. `sdk.context`

`context` creates verified `PlatformContext` objects.

## 12.1 Required functions

```ts
sdk.context.requirePageContext(args)
sdk.context.requireApiContext(args)
sdk.context.requireServiceContext(args) // future/internal
```

## 12.2 Page context

Used in Server Components and layouts.

Example:

```ts
const ctx = await sdk.context.requirePageContext({ orgSlug })
```

Behavior:

```txt
Unauthenticated user → redirect to /login
Unknown org → notFound()
Wrong org → notFound()
Suspended org → allow shell, block modules depending on route
Inactive user → redirect/logout or forbidden page
```

## 12.3 API context

Used in API route handlers.

Example:

```ts
const ctx = await sdk.context.requireApiContext({
  request,
  orgSlug,
})
```

Behavior:

```txt
Unauthenticated user → return/throw 401 JSON error
Unknown org → return/throw 404 JSON error
Wrong org → return/throw 404 JSON error
Inactive user → return/throw 403 JSON error
Suspended org module access → return/throw 403 JSON error
```

API context must never redirect.

## 12.4 Module API context

For module routes:

```ts
const ctx = await sdk.context.requireModuleApiContext({
  request,
  orgSlug,
  moduleId: 'inventory',
  permission: {
    module: 'inventory',
    resource: 'product',
    action: 'read',
  },
})
```

This helper should verify:

```txt
authenticated user
platform User exists
organization exists
user belongs to organization
organization is allowed to access app
module is enabled for organization
user has required permission
```

This helper is the ideal generated-module default.

---

# 13. `sdk.auth`

`auth` handles session and authentication helpers.

## 13.1 Required functions

```ts
sdk.auth.getSession()
sdk.auth.requirePageAuth()
sdk.auth.requireApiAuth()
sdk.auth.getCurrentPlatformUser(ctx)
```

## 13.2 Page vs API auth

Page auth and API auth are different.

Page auth may redirect.

API auth must return structured JSON errors.

Bad:

```ts
await sdk.auth.requirePageAuth() // inside API route
```

Good:

```ts
await sdk.auth.requireApiAuth(request)
```

## 13.3 Current user lookup

Use current-session lookup:

```txt
GET /api/kernel/auth/me
```

Do not use ID-based current user lookup:

```txt
GET /api/kernel/users/[id]
```

The current user is derived from the authenticated session.

---

# 14. `sdk.permissions`

`permissions` checks and enforces RBAC.

## 14.1 Permission requirement type

```ts
export type PermissionRequirement = Readonly<{
  module: string
  resource: string
  action: string
}>
```

`resource` must be non-null.

Use `'*'` as wildcard.

## 14.2 Required functions

```ts
sdk.permissions.can(ctx, requirement)
sdk.permissions.require(ctx, requirement)
sdk.permissions.requireAny(ctx, requirements)
sdk.permissions.requireAll(ctx, requirements)
```

## 14.3 `can()`

`can()` returns boolean.

Use for:

```txt
conditional UI rendering
non-security convenience checks
optional feature visibility
```

Example:

```ts
const mayCreate = await sdk.permissions.can(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'create',
})
```

## 14.4 `require()`

`require()` enforces security.

Use for:

```txt
API routes
services
mutations
background jobs
server actions
```

Example:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'create',
})
```

If denied, it should throw or return a structured `403 FORBIDDEN` error that the API helper can serialize.

## 14.5 Tenant isolation comes first

Permissions never bypass tenant isolation.

Even Admin wildcard permission is valid only inside the verified `ctx.orgId`.

---

# 15. `sdk.getDb(ctx)`

Database access must go through SDK.

## 15.1 Required signature

```ts
sdk.getDb(ctx: PlatformContext)
```

Not:

```ts
sdk.getDb(orgId: string)
```

## 15.2 Current behavior

For MVP, this returns the shared Prisma client.

```ts
function getDb(ctx: PlatformContext) {
  return prisma
}
```

Even though the current implementation returns the singleton, the function still requires `ctx` to prevent unsafe call sites.

## 15.3 Future behavior

Later, `sdk.getDb(ctx)` may:

```txt
set RLS context
route to tenant-specific database
inject observability metadata
wrap queries with audit context
provide tenant-scoped helpers
```

Modules should not care.

## 15.4 Module query rule

A module service should not accept `orgId` separately.

Good:

```ts
export class InventoryService {
  static async listProducts(ctx: PlatformContext) {
    const db = sdk.getDb(ctx)
    return db.product.findMany({ where: { orgId: ctx.orgId } })
  }
}
```

Bad:

```ts
export class InventoryService {
  static async listProducts(orgId: string) {
    return prisma.product.findMany({ where: { orgId } })
  }
}
```

## 15.5 Tenant filters are still required

Even with `sdk.getDb(ctx)`, MVP queries must still include tenant scope:

```ts
where: { orgId: ctx.orgId }
```

RLS is future defense-in-depth, not a substitute for application-level scoping.

---

# 16. `sdk.modules`

`modules` exposes module registry and enablement helpers.

## 16.1 Required functions

```ts
sdk.modules.register(manifest)
sdk.modules.getRegistered()
sdk.modules.getEnabledForOrg(ctx)
sdk.modules.isEnabled(ctx, moduleId)
sdk.modules.requireEnabled(ctx, moduleId)
```

## 16.2 Module enablement is not permission

A module being enabled means the organization purchased or activated it.

It does not mean every user can use it.

Both are required:

```txt
module enabled
+ user has permission
```

## 16.3 Registry ownership

Modules register manifests during application startup.

Claude must not create ad hoc navigation arrays outside the registry.

## 16.4 Future compatibility

Later, module enablement may include:

```txt
module version
subscription plan limits
module dependencies
marketplace source
billing status
```

The SDK should hide those details from modules.

---

# 17. `sdk.events`

`events` is the decoupled communication mechanism.

## 17.1 Required functions

```ts
sdk.events.emit(ctx, eventName, payload)
sdk.events.on(eventName, handler)
sdk.events.off(eventName, handler)
```

## 17.2 Event naming

All events must follow:

```txt
{module}.{entity}.{past_tense_verb}
```

Examples:

```txt
inventory.product.created
inventory.stock_adjustment.created
hr.employee.deactivated
purchasing.purchase_request.approved
crm.customer.converted
```

## 17.3 Event context

Event emission should include `ctx`.

Good:

```ts
await sdk.events.emit(ctx, 'inventory.product.created', {
  productId: product.id,
})
```

Bad:

```ts
await sdk.events.emit('inventory.product.created', product)
```

Context enables future audit logs, notifications, activity feeds, analytics, and AI memory without retrofitting every mutation.

## 17.4 In-process now, durable later

For MVP, the bus may be in-process.

Later it may become:

```txt
queue-backed
Redis-backed
database-backed
background-job-backed
```

Modules should not change.

---

# 18. `sdk.settings`

`settings` provides org and module configuration access.

## 18.1 Required functions

```ts
sdk.settings.get(ctx, { module, key })
sdk.settings.set(ctx, { module, key, value })
sdk.settings.getMany(ctx, { module })
sdk.settings.getWithDefault(ctx, { module, key, defaultValue })
```

## 18.2 Validation

Settings should be validated by module-owned Zod schemas.

The SDK should provide storage and retrieval, not business-specific validation.

## 18.3 Tenant scope

All settings are scoped by `ctx.orgId`.

Modules must not pass `orgId` manually.

---

# 19. `sdk.api`

`api` provides response and error helpers for route handlers.

## 19.1 Required functions

```ts
sdk.api.ok(data, meta?)
sdk.api.created(data, meta?)
sdk.api.noContent()
sdk.api.error(error)
sdk.api.validationError(zodError)
sdk.api.handle(handler)
```

## 19.2 Response shape

Every API returns:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: Record<string, unknown>
}
```

## 19.3 API handler wrapper

Recommended pattern:

```ts
export const POST = sdk.api.handle(async (request, route) => {
  const ctx = await sdk.context.requireModuleApiContext({
    request,
    orgSlug: route.params.orgSlug,
    moduleId: 'inventory',
    permission: {
      module: 'inventory',
      resource: 'product',
      action: 'create',
    },
  })

  const body = await request.json()
  const input = CreateProductSchema.parse(body)
  const product = await InventoryService.createProduct(ctx, input)

  return sdk.api.created(product)
})
```

The wrapper should convert known SDK errors into correct JSON responses.

---

# 20. `sdk.objects` Future Namespace

Business Objects are conceptually separate from Kernel.

The SDK should eventually expose Business Object services through a stable namespace.

Reserved future shape:

```ts
sdk.objects.employees
sdk.objects.products
sdk.objects.customers
sdk.objects.suppliers
sdk.objects.warehouses
```

Example future usage:

```ts
const product = await sdk.objects.products.getById(ctx, productId)
```

Do not expose raw Business Object Prisma models directly as the final contract.

For the earliest new build, direct `sdk.getDb(ctx).product` may be acceptable inside first-party modules, but the long-term target should be service-style object access.

---

# 21. Reserved Future Namespaces

Do not implement these until the roadmap says they are ready.

Reserved:

```ts
sdk.forms
sdk.tables
sdk.search
sdk.ai
sdk.storage
sdk.notifications
sdk.approvals
sdk.comments
sdk.attachments
sdk.reports
sdk.jobs
```

Important rule:

A reserved namespace is not permission to build it.

These namespaces exist to avoid naming conflicts later.

Implementation still requires the proper manual document and, for Platform Services, evidence under the Three Independent Use Cases Rule.

---

# 22. Module Usage Pattern

## 22.1 API route pattern

Module API route:

```ts
import { sdk } from '@/sdk/server'
import { InventoryService } from '@/modules/inventory/service'
import { CreateProductSchema } from '@/modules/inventory/schema'

export const POST = sdk.api.handle(async (request, { params }) => {
  const ctx = await sdk.context.requireModuleApiContext({
    request,
    orgSlug: params.orgSlug,
    moduleId: 'inventory',
    permission: {
      module: 'inventory',
      resource: 'product',
      action: 'create',
    },
  })

  const body = await request.json()
  const input = CreateProductSchema.parse(body)
  const result = await InventoryService.createProduct(ctx, input)

  return sdk.api.created(result)
})
```

## 22.2 Service pattern

Module service:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'

export class InventoryService {
  static async createProduct(ctx: PlatformContext, input: CreateProductInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'create',
    })

    const db = sdk.getDb(ctx)

    const product = await db.product.create({
      data: {
        orgId: ctx.orgId,
        code: input.code,
        name: input.name,
        unit: input.unit,
      },
    })

    await sdk.events.emit(ctx, 'inventory.product.created', {
      productId: product.id,
    })

    return product
  }
}
```

## 22.3 Client component pattern

Client component:

```ts
import { sdkClient } from '@/sdk/client'
```

Client components may use API wrappers, but may not import server SDK.

Example:

```ts
const result = await sdkClient.api.post(
  `/api/orgs/${orgSlug}/inventory/products`,
  input
)
```

---

# 23. Forbidden Patterns

The following are forbidden in modules.

## 23.1 Kernel imports

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
```

Use SDK instead.

## 23.2 Loose org IDs

```ts
const orgId = body.orgId
const db = sdk.getDb(orgId)
```

Use verified context instead.

## 23.3 API redirects

```ts
await sdk.auth.requirePageAuth() // inside API route
```

Use API context helpers.

## 23.4 Permission-only security

```ts
await sdk.permissions.require(ctx, requirement)
// but ctx was created from client orgId
```

Tenant context must be verified before permission checks.

## 23.5 Module-to-module imports

```ts
import { PurchasingService } from '@/modules/purchasing/service'
```

Use events, shared Business Objects, or future Platform Services.

## 23.6 FastAPI shortcut

```txt
Client calls FastAPI directly for module CRUD
```

This is forbidden for the core platform.

---

# 24. SDK and Business Objects

Business Objects are shared domain entities.

Examples:

```txt
Employee
Product
Customer
Supplier
Warehouse
```

Modules may use Business Objects, but they do not own them.

For the restarted build, modules should access Business Objects through the safest available SDK pattern.

MVP acceptable:

```ts
const db = sdk.getDb(ctx)
await db.product.findMany({ where: { orgId: ctx.orgId } })
```

Long-term preferred:

```ts
await sdk.objects.products.list(ctx, filters)
```

The Business Object SDK should be designed in a later document.

---

# 25. SDK and Platform Services

Platform Services will eventually expose SDK namespaces.

Examples:

```ts
sdk.notifications.send(ctx, message)
sdk.approvals.createRequest(ctx, input)
sdk.attachments.upload(ctx, input)
sdk.search.index(ctx, entity)
sdk.ai.ask(ctx, query)
```

But these must not be built early.

Platform Services require:

```txt
manual document
review
founder approval
implementation gate
Three Independent Use Cases evidence, when applicable
```

The SDK may reserve names but must not implement the services prematurely.

---

# 26. SDK and the Module Generator

The Module Generator must generate SDK-compliant code.

Generated modules must:

```txt
import server capabilities from @/sdk/server
import shared types from @/sdk
import client helpers from @/sdk/client
never import @/kernel/*
create PlatformContext in API routes
pass PlatformContext into services
call permission enforcement helpers
reject client-supplied orgId
emit events with context
return API responses through sdk.api helpers
include security tests
```

Generated modules must not produce placeholder security TODOs.

A generated route that says “TODO: add permission check” is unacceptable.

The permission check must exist from the beginning.

---

# 27. SDK Testing Requirements

The SDK itself must have tests.

## 27.1 Boundary tests

Verify that:

```txt
@/sdk does not import server-only dependencies
@/sdk/client does not import Prisma
@/sdk/client does not import service role code
@/sdk/server includes server-only
modules do not import @/kernel/*
```

## 27.2 Context tests

Verify:

```txt
unauthenticated API request becomes 401
wrong-org request becomes safe 404
inactive user becomes 403
suspended org blocks module access
valid user/org creates PlatformContext
```

## 27.3 Permission tests

Verify:

```txt
Admin wildcard works inside own org
Admin wildcard does not cross orgs
Staff without permission is denied
resource wildcard works
module wildcard works
conditions are denied until ABAC exists
```

## 27.4 API helper tests

Verify:

```txt
sdk.api.ok returns { data, error: null }
sdk.api.error returns { data: null, error }
validation errors are structured
known SDK errors map to correct status codes
unknown errors become INTERNAL_ERROR without stack trace
```

## 27.5 Generator tests

When the Module Generator is built, add tests that generated code:

```txt
does not import @/kernel/*
does not accept orgId in schema
does not read orgId from query string
does call requireModuleApiContext
does call permissions.require
does pass ctx to service
does emit events with ctx
```

---

# 28. SDK Versioning

The SDK should have a version from the beginning.

```ts
export const SDK_VERSION = '1.0.0'
export const KERNEL_VERSION = '1.0.0'
```

Module manifests should declare compatibility.

Example:

```ts
export const InventoryModule = {
  id: 'inventory',
  version: '1.0.0',
  kernelVersion: '1.0.0',
  sdkVersion: '1.0.0',
}
```

Breaking SDK changes require:

```txt
ADR
migration guide
updated module generator
updated tests
module compatibility review
```

---

# 29. SDK Documentation Standard

Every SDK function must document:

```txt
purpose
allowed callers
server/client safety
required parameters
return value
errors thrown/returned
tenant behavior
permission behavior
example usage
```

Example function documentation:

```ts
/**
 * Creates a verified PlatformContext for a module API route.
 *
 * Allowed callers:
 * - Next.js route handlers under /api/orgs/[orgSlug]/[moduleId]
 *
 * Security behavior:
 * - Requires authenticated Supabase user
 * - Requires matching Prisma User
 * - Requires user.orgId === org.id
 * - Requires module enabled for org
 * - Requires permission if provided
 *
 * Never redirects. Throws ApiError for sdk.api.handle() to serialize.
 */
async function requireModuleApiContext(args: RequireModuleApiContextArgs): Promise<PlatformContext>
```

---

# 30. Implementation Order

Do not build the entire SDK at once.

Implement in this order:

```txt
1. SDK types and constants
2. Server/client SDK split
3. PlatformContext type
4. API response/error helpers
5. Auth/context helpers
6. Permission helpers
7. getDb(ctx)
8. Module registry helpers
9. Event helpers
10. Settings helpers
11. Tests and import-boundary rules
```

Do not implement future namespaces until their documents are frozen.

---

# 31. Claude Implementation Rules

When Claude implements the SDK, give it this instruction:

```md
You are implementing the OneDayOS SDK foundation.

Authoritative document:
docs/engineering-manual/05-sdk/00-sdk-overview.md

Rules:
- Do not invent additional SDK namespaces.
- Do not add FastAPI.
- Do not add a Python backend.
- Do not expose Kernel internals to modules.
- Use @/sdk/server for server-only capabilities.
- Use @/sdk/client for browser-safe capabilities.
- Keep @/sdk free of server-only runtime imports.
- sdk.getDb must accept PlatformContext, not orgId string.
- API helpers must return JSON responses only.
- Add tests for SDK import boundaries.
- Stop if a required Kernel helper does not exist yet.
```

---

# 32. Acceptance Criteria

This document is implemented correctly when:

```txt
[ ] src/sdk/index.ts exports only shared safe types/constants
[ ] src/sdk/server.ts is server-only and imports server-only safely
[ ] src/sdk/client.ts is browser-safe
[ ] PlatformContext is defined and used by server SDK functions
[ ] sdk.getDb requires PlatformContext
[ ] module services accept PlatformContext, not orgId strings
[ ] API routes use SDK API/context helpers
[ ] permissions are enforced through SDK helpers
[ ] module registry access goes through SDK
[ ] event emission goes through SDK and includes context
[ ] modules do not import @/kernel/*
[ ] client components do not import @/sdk/server
[ ] generated modules follow SDK patterns
[ ] no FastAPI or Python backend is introduced
[ ] tests cover SDK boundaries
[ ] lint or static checks can detect forbidden imports
```

---

# 33. Founder Review Questions

Before freezing this document, answer these:

```txt
[ ] Do we approve the server/client SDK split?
[ ] Do we approve sdk.getDb(ctx) instead of sdk.getDb(orgId)?
[ ] Do we approve PlatformContext as the mandatory service context?
[ ] Do we agree that FastAPI is not part of the restarted core platform?
[ ] Do we want @/sdk to export only safe shared types/constants?
[ ] Do we want generated modules to use @/sdk/server and @/sdk/client subpaths?
```

---

# 34. Final Position

The SDK is one of the most important parts of OneDayOS.

It is the contract that allows the platform to mature without rewriting every module.

For the restarted build, the SDK should be stricter than the previous MVP plan:

```txt
No loose orgId database access.
No one giant mixed server/client SDK object.
No direct Kernel imports from modules.
No permission checks without verified tenant context.
No FastAPI in the core platform.
```

The SDK should make the correct architecture feel natural.

That is how OneDayOS becomes a platform instead of a pile of modules.
