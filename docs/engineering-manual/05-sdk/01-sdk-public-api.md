# OneDayOS Engineering Manual — SDK Public API

**Document ID:** `05-sdk/01-sdk-public-api.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT / OneDayOS Architecture Partner  
**Date:** July 2026  
**Project:** OneDayOS  
**Website:** onedayonlysystems.com

---

# 1. Purpose

This document defines the **public SDK API contract** for the restarted OneDayOS platform build.

The previous SDK Overview explained why the SDK exists. This document defines the exact first version of the SDK surface that Claude Code and future engineers should implement against.

This document answers:

```txt
What can modules import?
What functions exist?
Which functions are server-only?
Which functions are client-safe?
What arguments do SDK functions accept?
What must SDK functions never accept?
What response and error types are standard?
What is stable now, reserved for later, or forbidden?
```

The goal is not to expose every possible helper. The goal is to expose a **small, stable, safe, boring contract** that all modules and generators use.

---

# 2. Relationship to Previous Documents

This document depends on the approved direction from:

```txt
01-foundation/00-vision.md
02-architecture/00-system-architecture.md
02-architecture/01-layer-boundaries.md
04-kernel/00-kernel-overview.md
04-kernel/01-authentication.md
04-kernel/02-organizations-tenancy.md
04-kernel/03-users-roles-permissions.md
04-kernel/04-authorization-enforcement.md
04-kernel/08-kernel-api-contracts.md
05-sdk/00-sdk-overview.md
13-security/08-production-readiness-gate.md
13-security/09-security-stabilization-new-build-spec.md
```

This document assumes the following architecture is approved:

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

This document also assumes the restarted platform build will use:

```txt
Next.js App Router
TypeScript
Supabase Auth
PostgreSQL
Prisma
Vercel
```

The SDK must not introduce FastAPI, Python backend services, direct module-to-module imports, or raw Kernel imports inside modules.

---

# 3. Core SDK Contract

The SDK is the only supported platform interface for modules.

Business modules must not import from Kernel internals.

Allowed module imports:

```ts
import type { PlatformContext, ModuleManifest } from '@/sdk'
import { sdk } from '@/sdk/server'
import { sdkClient } from '@/sdk/client'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/kernel/data-table/DataTable'
```

Forbidden module imports:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
import { registerModule } from '@/kernel/modules/registry'
import { bus } from '@/kernel/events/bus'
```

The SDK hides platform internals behind stable contracts.

---

# 4. Public Import Paths

The restarted build must split the SDK into three public entrypoints.

```txt
@/sdk
@/sdk/server
@/sdk/client
```

## 4.1 `@/sdk`

Shared safe entrypoint.

May be imported by:

```txt
server components
client components
route handlers
module services as type-only imports
module manifests
module schemas
tests
generators
```

Allowed contents:

```txt
types
constants
enums/version strings
module manifest types
permission types
API response types
error types
event name type helpers
```

Forbidden contents:

```txt
Prisma
Supabase server client
Supabase service role client
Next.js cookies
next/headers
server-only imports
database access
auth session lookup
permission database checks
event bus singleton
```

## 4.2 `@/sdk/server`

Server-only runtime entrypoint.

May be imported by:

```txt
route handlers
server components
server actions, if used later
module services
seed scripts with care
generator-produced server code
```

Must not be imported by:

```txt
client components
browser utilities
React hooks that run client-side
```

Must start with:

```ts
import 'server-only'
```

## 4.3 `@/sdk/client`

Browser-safe client entrypoint.

May be imported by:

```txt
client components
browser hooks
client-side forms
optimistic UI components
```

Must not import:

```txt
Prisma
Kernel DB client
Supabase service role key
Next.js cookies
next/headers
server-only auth helpers
server SDK
```

---

# 5. SDK Stability Levels

Every SDK export must have a stability level.

| Stability | Meaning | Claude may use? |
|---|---|---|
| `stable` | Safe for modules and generators. Breaking changes require ADR. | Yes |
| `internal` | Used by Kernel/SDK implementation only. Not for modules. | No |
| `experimental` | May change. Requires explicit document permission. | Only if instructed |
| `reserved` | Name reserved for future service. Not implemented. | No |
| `forbidden` | Must not exist or be used. | No |

For MVP, most exposed SDK functions should be `stable` only after review.

Reserved future namespaces must not be implemented just because they are listed.

---

# 6. File Structure

The restarted build should create this SDK structure:

```txt
src/sdk/
  index.ts
  server.ts
  client.ts
  types.ts
  constants.ts
  errors.ts
  event-names.ts
  api-types.ts
  permissions.ts
  module-types.ts
  testing.ts              # future, not required in first pass
  __tests__/
    sdk-index-boundary.test.ts
    sdk-server-boundary.test.ts
    sdk-client-boundary.test.ts
    sdk-public-api.test.ts
```

## 6.1 `index.ts`

The shared SDK entrypoint.

Should re-export only from:

```txt
./types
./constants
./errors
./api-types
./permissions
./module-types
./event-names
```

It must not import from:

```txt
@/kernel/*
@/sdk/server
@/sdk/client
```

## 6.2 `server.ts`

The server SDK implementation entrypoint.

Should export:

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

## 6.3 `client.ts`

The client SDK implementation entrypoint.

Should export:

```ts
export const sdkClient = {
  api,
  auth,
  routes,
}
```

Do not name the client object `sdk`, because that increases the chance a developer imports the wrong SDK surface.

Use:

```ts
import { sdk } from '@/sdk/server'
import { sdkClient } from '@/sdk/client'
```

---

# 7. Shared Types from `@/sdk`

This section defines the shared exports that may be imported from `@/sdk`.

## 7.1 Version constants

```ts
export const SDK_VERSION = '1.0.0'
export const KERNEL_VERSION = '1.0.0'
```

These constants are safe for server and client.

Module manifests should declare compatibility with both:

```ts
export const InventoryModule: ModuleManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '1.0.0',
  kernelVersion: KERNEL_VERSION,
  sdkVersion: SDK_VERSION,
  // ...
}
```

## 7.2 Context source

```ts
export type ContextSource = 'page' | 'api' | 'service' | 'job'
```

## 7.3 Organization status

```ts
export type OrganizationStatus = 'trial' | 'active' | 'suspended' | 'cancelled'
```

This should come from subscription/org state, not from arbitrary strings in module code.

## 7.4 PlatformContext

`PlatformContext` is the most important SDK type.

```ts
export type PlatformContext = Readonly<{
  requestId: string
  authUserId: string
  userId: string
  orgId: string
  orgSlug: string
  orgStatus: OrganizationStatus
  userIsActive: boolean
  source: ContextSource
}>
```

Rules:

```txt
Only Kernel/SDK context helpers may create PlatformContext.
Modules may receive PlatformContext.
Modules may pass PlatformContext.
Modules may not fabricate PlatformContext.
Services must accept PlatformContext, not loose orgId.
```

## 7.5 Future PlatformContext extension

Do not implement these fields in MVP unless explicitly needed:

```ts
export type FuturePlatformContextFields = Readonly<{
  roleIds?: string[]
  permissionKeys?: string[]
  enabledModuleIds?: string[]
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

They are listed only to protect future compatibility.

---

# 8. API Types from `@/sdk`

Every API route must use the same response shape.

## 8.1 `ApiResponse<T>`

```ts
export type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

## 8.2 `ApiMeta`

```ts
export type ApiMeta = Record<string, unknown>
```

Suggested common meta fields:

```ts
export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
```

Do not overbuild pagination until tables and list APIs require it.

## 8.3 `ApiError`

```ts
export type ApiError = {
  code: ApiErrorCode
  message: string
  details?: unknown
  requestId?: string
}
```

## 8.4 `ApiErrorCode`

Initial allowed error codes:

```ts
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'ORG_NOT_FOUND'
  | 'MODULE_NOT_ENABLED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
```

Do not invent random error codes inside modules.

If a new error code is needed, update this document or amend it.

## 8.5 Validation error details

Validation errors should use a predictable shape.

```ts
export type ValidationErrorDetails = {
  fieldErrors: Record<string, string[]>
  formErrors: string[]
}
```

For Zod:

```ts
const details = parsed.error.flatten()
```

---

# 9. Permission Types from `@/sdk`

Permissions are organization-scoped RBAC checks.

## 9.1 PermissionRequirement

```ts
export type PermissionRequirement = Readonly<{
  module: string
  resource: string
  action: PermissionAction
}>
```

Rules:

```txt
module is required
resource is required
action is required
resource must not be null
use '*' for wildcard resource
tenant isolation is checked before permission matching
```

## 9.2 PermissionAction

Initial action union:

```ts
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'manage'
  | 'configure'
  | 'import'
  | 'export'
```

Minimal modules should start with:

```txt
create
read
update
delete
```

Use specialized actions only when the workflow needs them.

Examples:

```txt
approve → leave request approval, purchase request approval
configure → module settings
manage → user/role/module administration
import → CSV import
export → report/table export
```

## 9.3 Wildcards

Wildcards are allowed but must be explicit.

Examples:

```ts
{ module: '*', resource: '*', action: 'manage' }
{ module: 'inventory', resource: '*', action: 'read' }
{ module: 'inventory', resource: 'product', action: 'create' }
```

Admin role should normally use:

```ts
{ module: '*', resource: '*', action: '*' }
```

If action wildcard is supported in the DB model, represent it as:

```ts
export type PermissionActionOrWildcard = PermissionAction | '*'
```

For `PermissionRequirement`, normal checks should use concrete actions.

## 9.4 PermissionKey helper

Optional helper type:

```ts
export type PermissionKey = `${string}.${string}.${string}`
```

Example:

```txt
inventory.product.create
kernel.user.manage
leave.request.approve
```

This is useful for logs and tests, but the primary runtime shape remains `{ module, resource, action }`.

---

# 10. Module Types from `@/sdk`

## 10.1 ModuleManifest

```ts
export type ModuleManifest = Readonly<{
  id: string
  label: string
  version: string
  kernelVersion: string
  sdkVersion: string
  icon: string
  dependencies: string[]
  permissions: PermissionDefinition[]
  navItems: NavItem[]
  events: ModuleEventContract
  aiContext?: ModuleAIContext
  docsUrl?: string
  seed?: ModuleSeedFunction
}>
```

## 10.2 PermissionDefinition

Prefer full permission definitions over plain string arrays.

```ts
export type PermissionDefinition = Readonly<{
  module: string
  resource: string
  action: PermissionAction | '*'
  label: string
  description?: string
}>
```

Example:

```ts
permissions: [
  {
    module: 'inventory',
    resource: 'product',
    action: 'read',
    label: 'View products',
  },
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
    label: 'Create stock adjustments',
  },
]
```

This is better than:

```ts
permissions: ['create', 'read', 'update', 'delete']
```

because the generator, UI, roles screen, and future marketplace need resource-level metadata.

## 10.3 NavItem

```ts
export type NavItem = Readonly<{
  label: string
  href: string
  icon?: string
  requiredPermission?: PermissionRequirement
}>
```

Rules:

```txt
href is relative to /[orgSlug]
icon is a lucide icon name
requiredPermission controls visibility only
API/service authorization remains mandatory
```

Example:

```ts
navItems: [
  {
    label: 'Products',
    href: 'inventory/products',
    icon: 'Package',
    requiredPermission: {
      module: 'inventory',
      resource: 'product',
      action: 'read',
    },
  },
]
```

## 10.4 ModuleEventContract

```ts
export type ModuleEventContract = Readonly<{
  emits: EventName[]
  listens: EventName[]
}>
```

## 10.5 ModuleAIContext

```ts
export type ModuleAIContext = Readonly<{
  description: string
  exampleQueries?: string[]
  supportedActions?: string[]
  forbiddenActions?: string[]
}>
```

AI context is metadata only in MVP. It does not mean the AI Layer is implemented.

## 10.6 ModuleSeedFunction

```ts
export type ModuleSeedFunction = (ctx: PlatformContext) => Promise<void>
```

A module seed must receive verified context.

Do not use:

```ts
seed?: (orgId: string) => Promise<void>
```

---

# 11. Event Types from `@/sdk`

## 11.1 EventName

```ts
export type EventName = `${string}.${string}.${string}`
```

All events must follow:

```txt
{module}.{entity}.{past_tense_verb}
```

Examples:

```txt
inventory.product.created
inventory.stock_adjustment.created
hr.employee.deactivated
crm.customer.converted
purchasing.purchase_request.approved
```

Forbidden:

```txt
ProductCreated
inventory.product.create
inventory.productCreated
inv.product.created
product.created
```

## 11.2 EventPayload

MVP generic type:

```ts
export type EventPayload = Record<string, unknown>
```

Future event contracts may become strongly typed per event.

## 11.3 EventEnvelope

The SDK event layer should internally normalize events into an envelope.

```ts
export type EventEnvelope<TPayload extends EventPayload = EventPayload> = Readonly<{
  id: string
  name: EventName
  orgId: string
  actorUserId: string
  occurredAt: string
  payload: TPayload
  requestId?: string
}>
```

Modules should normally call `sdk.events.emit(ctx, name, payload)`, not construct envelopes manually.

---

# 12. Error Classes from `@/sdk`

The SDK may expose safe error classes for server code, but they must serialize cleanly.

## 12.1 SdkError

```ts
export class SdkError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(args: {
    code: ApiErrorCode
    message: string
    status: number
    details?: unknown
  })
}
```

## 12.2 Specific errors

Recommended helpers:

```ts
export class UnauthenticatedError extends SdkError {}
export class ForbiddenError extends SdkError {}
export class OrgNotFoundError extends SdkError {}
export class ModuleNotEnabledError extends SdkError {}
export class ValidationSdkError extends SdkError {}
```

Do not leak stack traces to API clients.

The API wrapper should convert these errors to structured JSON.

---

# 13. Server SDK Public Shape

Server code imports:

```ts
import { sdk } from '@/sdk/server'
```

The public server SDK shape is:

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

Do not export a giant list of named functions from `@/sdk/server` unless there is a strong reason.

The namespaced object makes generated code consistent and readable.

---

# 14. `sdk.context`

`context` creates verified request context.

This is the main security boundary of the SDK.

## 14.1 Types

```ts
export type RequirePageContextArgs = Readonly<{
  orgSlug: string
  allowSuspendedOrg?: boolean
}>

export type RequireApiContextArgs = Readonly<{
  request: Request
  orgSlug: string
  allowSuspendedOrg?: boolean
}>

export type RequireModuleApiContextArgs = Readonly<{
  request: Request
  orgSlug: string
  moduleId: string
  permission?: PermissionRequirement
  allowSuspendedOrg?: boolean
}>
```

## 14.2 Public functions

```ts
sdk.context.requirePageContext(args: RequirePageContextArgs): Promise<PlatformContext>

sdk.context.requireApiContext(args: RequireApiContextArgs): Promise<PlatformContext>

sdk.context.requireModuleApiContext(args: RequireModuleApiContextArgs): Promise<PlatformContext>
```

## 14.3 `requirePageContext`

Used by server components and layouts.

Example:

```ts
const ctx = await sdk.context.requirePageContext({ orgSlug })
```

Behavior:

```txt
No session → redirect to /login
No platform User → redirect/logout or forbidden page
Unknown orgSlug → notFound()
Wrong org for user → notFound()
Inactive user → forbidden page or logout
Suspended org → allowed only if allowSuspendedOrg is true
```

## 14.4 `requireApiContext`

Used by Kernel and Business Object API routes.

Example:

```ts
const ctx = await sdk.context.requireApiContext({ request, orgSlug })
```

Behavior:

```txt
No session → throw UNAUTHENTICATED 401
No platform User → throw UNAUTHENTICATED or FORBIDDEN
Unknown orgSlug → throw ORG_NOT_FOUND 404
Wrong org for user → throw ORG_NOT_FOUND 404
Inactive user → throw FORBIDDEN 403
Suspended org → throw FORBIDDEN 403 unless allowed
```

It must never redirect.

## 14.5 `requireModuleApiContext`

Used by module API routes.

Example:

```ts
const ctx = await sdk.context.requireModuleApiContext({
  request,
  orgSlug,
  moduleId: 'inventory',
  permission: {
    module: 'inventory',
    resource: 'product',
    action: 'create',
  },
})
```

It verifies, in order:

```txt
1. Authenticated Supabase user exists
2. Matching Prisma User exists
3. Organization exists
4. User belongs to organization
5. User is active
6. Organization/subscription permits platform access
7. Module is enabled for organization
8. User has required permission, if provided
```

Tenant membership must be checked before permission matching.

---

# 15. `sdk.auth`

`auth` handles authentication and current-user access.

## 15.1 Types

```ts
export type AuthSession = Readonly<{
  authUserId: string
  email?: string
}>

export type PlatformUserSummary = Readonly<{
  id: string
  orgId: string
  name: string
  email: string
  avatarUrl?: string | null
  isActive: boolean
}>
```

## 15.2 Public functions

```ts
sdk.auth.getSession(): Promise<AuthSession | null>

sdk.auth.requirePageAuth(): Promise<AuthSession>

sdk.auth.requireApiAuth(request: Request): Promise<AuthSession>

sdk.auth.getCurrentPlatformUser(ctx: PlatformContext): Promise<PlatformUserSummary>
```

## 15.3 Page vs API auth rule

Use `requirePageAuth()` only in pages/layouts.

Use `requireApiAuth()` only in API routes.

Forbidden:

```ts
await sdk.auth.requirePageAuth() // inside API route
```

Because page auth may redirect.

API auth must return JSON-safe errors through `sdk.api.handle()`.

## 15.4 Current user route

Client-side login redirect should fetch:

```txt
GET /api/kernel/auth/me
```

Not:

```txt
GET /api/kernel/users/[id]
```

The current user is derived from the session, not a path parameter.

---

# 16. `sdk.permissions`

`permissions` checks and enforces access.

## 16.1 Public functions

```ts
sdk.permissions.can(
  ctx: PlatformContext,
  requirement: PermissionRequirement
): Promise<boolean>

sdk.permissions.require(
  ctx: PlatformContext,
  requirement: PermissionRequirement
): Promise<void>

sdk.permissions.requireAny(
  ctx: PlatformContext,
  requirements: PermissionRequirement[]
): Promise<void>

sdk.permissions.requireAll(
  ctx: PlatformContext,
  requirements: PermissionRequirement[]
): Promise<void>
```

## 16.2 `can()`

Returns boolean.

Allowed uses:

```txt
permission-aware navigation
show/hide UI actions
non-security convenience checks
```

Example:

```ts
const mayCreateProduct = await sdk.permissions.can(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'create',
})
```

Important:

```txt
can() alone is not enough for security.
```

## 16.3 `require()`

Enforces security.

Required in:

```txt
API mutations
module services
server actions, if used
background jobs that act as a user
admin operations
```

Example:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'create',
})
```

Denied access should throw `ForbiddenError` or equivalent SDK error.

## 16.4 `requireAny()`

Allows access if the user has at least one requirement.

Example:

```ts
await sdk.permissions.requireAny(ctx, [
  { module: 'inventory', resource: 'product', action: 'update' },
  { module: 'inventory', resource: 'product', action: 'manage' },
])
```

Use sparingly.

## 16.5 `requireAll()`

Allows access only if the user has all requirements.

Example:

```ts
await sdk.permissions.requireAll(ctx, [
  { module: 'inventory', resource: 'stock_adjustment', action: 'create' },
  { module: 'inventory', resource: 'warehouse', action: 'read' },
])
```

## 16.6 Conditions rule

If a permission row has non-null `conditions`, MVP must deny it unless an ABAC evaluator exists.

Do not silently allow conditional permissions.

---

# 17. `sdk.getDb(ctx)`

Database access goes through the SDK.

## 17.1 Public function

```ts
sdk.getDb(ctx: PlatformContext): PrismaClientLike
```

Do not expose the raw Prisma type from shared `@/sdk`.

The server implementation may use Prisma internally.

## 17.2 Required usage

Good:

```ts
const db = sdk.getDb(ctx)
await db.product.findMany({ where: { orgId: ctx.orgId } })
```

Forbidden:

```ts
const db = sdk.getDb(orgId)
const db = sdk.getDb(body.orgId)
import { prisma } from '@/kernel/db/client'
```

## 17.3 Tenant filtering

MVP still requires explicit tenant filters:

```ts
where: { orgId: ctx.orgId }
```

`sdk.getDb(ctx)` does not remove the need for tenant-scoped queries.

Future versions may add RLS context, query wrappers, or tenant-specific routing.

---

# 18. `sdk.modules`

`modules` exposes module registry and module enablement.

## 18.1 Public functions

```ts
sdk.modules.register(manifest: ModuleManifest): void

sdk.modules.getRegistered(): ModuleManifest[]

sdk.modules.getEnabledForOrg(ctx: PlatformContext): Promise<ModuleManifest[]>

sdk.modules.isEnabled(ctx: PlatformContext, moduleId: string): Promise<boolean>

sdk.modules.requireEnabled(ctx: PlatformContext, moduleId: string): Promise<void>
```

## 18.2 Registering modules

Module manifest file:

```ts
import { sdk } from '@/sdk/server'
import { SDK_VERSION, KERNEL_VERSION, type ModuleManifest } from '@/sdk'

export const InventoryModule: ModuleManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '1.0.0',
  kernelVersion: KERNEL_VERSION,
  sdkVersion: SDK_VERSION,
  icon: 'Package',
  dependencies: [],
  permissions: [],
  navItems: [],
  events: { emits: [], listens: [] },
}

sdk.modules.register(InventoryModule)
```

## 18.3 Module enablement is separate from permission

A module is usable only when both are true:

```txt
Organization has module enabled.
User has required permission.
```

Do not treat module enablement as user authorization.

---

# 19. `sdk.events`

`events` provides decoupled event publishing.

## 19.1 Public functions

```ts
sdk.events.emit<TPayload extends EventPayload>(
  ctx: PlatformContext,
  name: EventName,
  payload: TPayload
): Promise<void>

sdk.events.on<TPayload extends EventPayload>(
  name: EventName,
  handler: EventHandler<TPayload>
): void

sdk.events.off<TPayload extends EventPayload>(
  name: EventName,
  handler: EventHandler<TPayload>
): void
```

## 19.2 EventHandler

```ts
export type EventHandler<TPayload extends EventPayload = EventPayload> = (
  envelope: EventEnvelope<TPayload>
) => Promise<void> | void
```

Handlers should receive an envelope, not a raw payload.

Reason:

```txt
orgId
actorUserId
requestId
occurredAt
event id
```

are needed by future audit, notifications, analytics, and AI systems.

## 19.3 Event emission rule

Every mutation of a Business Object must emit an event.

Example:

```ts
await sdk.events.emit(ctx, 'inventory.product.created', {
  productId: product.id,
})
```

Do not emit events from client components.

Events should be emitted from services after successful mutations.

---

# 20. `sdk.settings`

`settings` provides tenant-scoped configuration access.

## 20.1 Public functions

```ts
sdk.settings.get<TValue = unknown>(
  ctx: PlatformContext,
  args: { module: string; key: string }
): Promise<TValue | null>

sdk.settings.getWithDefault<TValue>(
  ctx: PlatformContext,
  args: { module: string; key: string; defaultValue: TValue }
): Promise<TValue>

sdk.settings.getMany(
  ctx: PlatformContext,
  args: { module: string }
): Promise<Record<string, unknown>>

sdk.settings.set<TValue = unknown>(
  ctx: PlatformContext,
  args: { module: string; key: string; value: TValue }
): Promise<void>
```

## 20.2 Permission behavior

Reading settings may require module read/configure permission depending on route.

Writing settings must require:

```ts
{ module, resource: 'settings', action: 'configure' }
```

or a Kernel admin equivalent.

## 20.3 Validation

Settings storage is generic.

Validation belongs to:

```txt
Kernel setting schema
Module setting schema
Zod parser before set()
```

Do not store unvalidated complex settings.

---

# 21. `sdk.api`

`api` standardizes API route behavior.

## 21.1 Public functions

```ts
sdk.api.ok<T>(data: T, meta?: ApiMeta): Response

sdk.api.created<T>(data: T, meta?: ApiMeta): Response

sdk.api.noContent(): Response

sdk.api.error(error: ApiError | SdkError): Response

sdk.api.validationError(error: unknown): Response

sdk.api.handle<TParams>(
  handler: ApiRouteHandler<TParams>
): ApiRouteExport<TParams>

sdk.api.parseJson<T>(request: Request, schema: ZodSchema<T>): Promise<T>
```

## 21.2 Handler types

```ts
export type ApiRouteHandler<TParams = unknown> = (
  request: Request,
  context: { params: TParams }
) => Promise<Response>
```

For Next.js versions where `params` is a Promise, the implementation must support awaiting params.

Recommended implementation detail:

```ts
export type MaybePromise<T> = T | Promise<T>

export type ApiRouteContext<TParams> = {
  params: MaybePromise<TParams>
}
```

`handle()` should normalize this.

## 21.3 Response helpers

### `ok`

```ts
return sdk.api.ok({ id: 'product-1' })
```

Response:

```json
{
  "data": { "id": "product-1" },
  "error": null
}
```

HTTP status: `200`.

### `created`

```ts
return sdk.api.created(product)
```

HTTP status: `201`.

### `noContent`

Use for deletes only if the frontend does not need a body.

For consistency, prefer returning deleted ID:

```ts
return sdk.api.ok({ id })
```

### `error`

Serializes SDK errors.

Must never include stack traces.

### `validationError`

Returns:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input.",
    "details": {
      "fieldErrors": {},
      "formErrors": []
    }
  }
}
```

HTTP status: `400`.

## 21.4 API route pattern

```ts
import { sdk } from '@/sdk/server'
import { CreateProductSchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'

export const POST = sdk.api.handle<{ orgSlug: string }>(async (request, { params }) => {
  const { orgSlug } = await params

  const ctx = await sdk.context.requireModuleApiContext({
    request,
    orgSlug,
    moduleId: 'inventory',
    permission: {
      module: 'inventory',
      resource: 'product',
      action: 'create',
    },
  })

  const input = await sdk.api.parseJson(request, CreateProductSchema)
  const product = await InventoryService.createProduct(ctx, input)

  return sdk.api.created(product)
})
```

---

# 22. Client SDK Public Shape

Client code imports:

```ts
import { sdkClient } from '@/sdk/client'
```

The client SDK shape is:

```ts
export const sdkClient = {
  api,
  auth,
  routes,
}
```

---

# 23. `sdkClient.api`

Client-side API helpers.

## 23.1 Public functions

```ts
sdkClient.api.get<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>>

sdkClient.api.post<TResponse, TInput = unknown>(
  url: string,
  input: TInput,
  init?: RequestInit
): Promise<ApiResponse<TResponse>>

sdkClient.api.patch<TResponse, TInput = unknown>(
  url: string,
  input: TInput,
  init?: RequestInit
): Promise<ApiResponse<TResponse>>

sdkClient.api.delete<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>>
```

## 23.2 Error behavior

Client API helpers should not throw for normal API errors.

They should return `ApiResponse<T>`.

Network failures may throw or be normalized later.

Example:

```ts
const response = await sdkClient.api.post<Product>(
  sdkClient.routes.orgModule(orgSlug, 'inventory', 'products'),
  input
)

if (response.error) {
  toast.error(response.error.message)
  return
}
```

## 23.3 Headers

Client API helpers should set:

```txt
Content-Type: application/json
Accept: application/json
```

They should not set auth headers manually unless the auth provider requires it later.

Supabase session cookies should be handled by the browser/Next.js integration.

---

# 24. `sdkClient.auth`

Client-side auth convenience.

## 24.1 Public functions

```ts
sdkClient.auth.signInWithPassword(args: {
  email: string
  password: string
}): Promise<ApiResponse<{ orgSlug: string }>>

sdkClient.auth.signOut(): Promise<void>

sdkClient.auth.getMe(): Promise<ApiResponse<CurrentUserResponse>>
```

## 24.2 CurrentUserResponse

```ts
export type CurrentUserResponse = Readonly<{
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }
  org: {
    id: string
    slug: string
    name: string
    status: OrganizationStatus
  }
}>
```

## 24.3 Registration rule

The client SDK must not expose raw Supabase sign-up for OneDayOS registration.

Registration must call the server-owned route:

```txt
POST /api/kernel/auth/register
```

Potential future function:

```ts
sdkClient.auth.register(args)
```

If implemented, it must call the OneDayOS server route, not `supabase.auth.signUp()` directly.

---

# 25. `sdkClient.routes`

Client route builders prevent ad hoc string construction.

## 25.1 Public functions

```ts
sdkClient.routes.org(orgSlug: string): string

sdkClient.routes.orgDashboard(orgSlug: string): string

sdkClient.routes.orgApi(orgSlug: string, path: string): string

sdkClient.routes.orgModule(orgSlug: string, moduleId: string, path?: string): string

sdkClient.routes.businessObjectApi(orgSlug: string, objectName: string, path?: string): string
```

## 25.2 Examples

```ts
sdkClient.routes.orgDashboard('demo-corp')
// /demo-corp/dashboard

sdkClient.routes.orgModule('demo-corp', 'inventory', 'products')
// /api/orgs/demo-corp/inventory/products

sdkClient.routes.businessObjectApi('demo-corp', 'products')
// /api/orgs/demo-corp/objects/products
```

## 25.3 Security note

Route builders do not authorize anything.

They only build paths.

The server must still verify org membership, module enablement, and permission.

---

# 26. Reserved Future SDK Namespaces

These names are reserved but not implemented in the initial SDK.

```ts
sdk.objects
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

Rules:

```txt
Do not implement reserved namespaces now.
Do not let Claude create placeholder objects for them.
Do not expose empty fake APIs.
Do not build Platform Services without their manual documents.
```

Reserved names exist to prevent naming collisions later.

---

# 27. Explicitly Forbidden SDK API

These functions must not exist.

## 27.1 Forbidden database APIs

```ts
sdk.db
sdk.prisma
sdk.getDb()
sdk.getDb(orgId: string)
sdk.getDbFromRequest(request)
```

Reason: these allow bypassing verified `PlatformContext`.

## 27.2 Forbidden auth APIs

```ts
sdk.auth.requireAuth() // ambiguous page/API behavior
sdk.auth.getUserById(id)
sdk.auth.requireAuthOrRedirect() // if importable by API routes
```

Use explicit page/API helpers.

## 27.3 Forbidden permission APIs

```ts
sdk.permissions.can(userId, action, module, orgId)
sdk.permissions.require(userId, orgId, permission)
sdk.permissions.isAdmin(userId)
```

Permission checks require `PlatformContext`.

## 27.4 Forbidden module APIs

```ts
sdk.modules.enable(orgId, moduleId)
sdk.modules.getEnabledForOrg(orgId)
```

Use `PlatformContext`.

Admin enablement flows may be added later with explicit admin context.

## 27.5 Forbidden event APIs

```ts
sdk.events.emit(eventName, payload)
sdk.events.emit(orgId, eventName, payload)
```

Events require `PlatformContext`.

---

# 28. Module Manifest Example

A generated module manifest should look like this:

```ts
import { sdk } from '@/sdk/server'
import {
  KERNEL_VERSION,
  SDK_VERSION,
  type ModuleManifest,
} from '@/sdk'

export const InventoryModule: ModuleManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '1.0.0',
  kernelVersion: KERNEL_VERSION,
  sdkVersion: SDK_VERSION,
  icon: 'Package',
  dependencies: [],
  permissions: [
    {
      module: 'inventory',
      resource: 'product',
      action: 'read',
      label: 'View products',
    },
    {
      module: 'inventory',
      resource: 'product',
      action: 'create',
      label: 'Create products',
    },
    {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
      label: 'Create stock adjustments',
    },
  ],
  navItems: [
    {
      label: 'Products',
      href: 'inventory/products',
      icon: 'Package',
      requiredPermission: {
        module: 'inventory',
        resource: 'product',
        action: 'read',
      },
    },
  ],
  events: {
    emits: [
      'inventory.product.created',
      'inventory.product.updated',
      'inventory.stock_adjustment.created',
    ],
    listens: [],
  },
  aiContext: {
    description: 'Tracks products, warehouses, stock balances, and stock movements.',
    exampleQueries: [
      'Which products are low stock?',
      'Show stock movements this week.',
    ],
  },
}

sdk.modules.register(InventoryModule)
```

---

# 29. Module Service Example

Module services must accept `PlatformContext`.

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
import type { CreateProductInput } from './schema'

export class InventoryService {
  static async listProducts(ctx: PlatformContext) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'read',
    })

    const db = sdk.getDb(ctx)

    return db.product.findMany({
      where: {
        orgId: ctx.orgId,
      },
      orderBy: {
        name: 'asc',
      },
    })
  }

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

Forbidden service shape:

```ts
export class InventoryService {
  static async listProducts(orgId: string) {}
  static async createProduct(orgId: string, input: CreateProductInput) {}
}
```

---

# 30. Module API Route Example

Recommended route path:

```txt
src/app/api/orgs/[orgSlug]/inventory/products/route.ts
```

Route implementation:

```ts
import { sdk } from '@/sdk/server'
import { InventoryService } from '@/modules/inventory/service'
import { CreateProductSchema } from '@/modules/inventory/schema'

export const GET = sdk.api.handle<{ orgSlug: string }>(async (request, { params }) => {
  const { orgSlug } = await params

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

  const products = await InventoryService.listProducts(ctx)

  return sdk.api.ok(products)
})

export const POST = sdk.api.handle<{ orgSlug: string }>(async (request, { params }) => {
  const { orgSlug } = await params

  const ctx = await sdk.context.requireModuleApiContext({
    request,
    orgSlug,
    moduleId: 'inventory',
    permission: {
      module: 'inventory',
      resource: 'product',
      action: 'create',
    },
  })

  const input = await sdk.api.parseJson(request, CreateProductSchema)
  const product = await InventoryService.createProduct(ctx, input)

  return sdk.api.created(product)
})
```

---

# 31. Client Component Example

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { sdkClient } from '@/sdk/client'
import type { ApiResponse } from '@/sdk'

export function NewProductForm({ orgSlug }: { orgSlug: string }) {
  const router = useRouter()

  async function onSubmit(input: CreateProductInput) {
    const response = await sdkClient.api.post<Product>(
      sdkClient.routes.orgModule(orgSlug, 'inventory', 'products'),
      input
    )

    if (response.error) {
      toast.error(response.error.message)
      return
    }

    toast.success('Product created.')
    router.push(`/${orgSlug}/inventory/products`)
    router.refresh()
  }

  // form JSX
}
```

Client components do not import `@/sdk/server`.

Client payloads do not include `orgId`.

---

# 32. Business Object Access

Business Objects are shared entities, not module-owned entities.

MVP acceptable pattern inside first-party services:

```ts
const db = sdk.getDb(ctx)
const product = await db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.orgId,
  },
})
```

Long-term target pattern:

```ts
const product = await sdk.objects.products.getById(ctx, productId)
```

Do not implement `sdk.objects` until the Business Objects SDK document is written and approved.

---

# 33. Static Boundary Tests

The SDK must include import-boundary tests.

## 33.1 `@/sdk` must remain safe

Test intent:

```txt
src/sdk/index.ts must not import @/kernel/*
src/sdk/index.ts must not import @/sdk/server
src/sdk/index.ts must not import Prisma
src/sdk/index.ts must not import next/headers
```

## 33.2 `@/sdk/client` must remain browser-safe

Test intent:

```txt
src/sdk/client.ts must not import @/kernel/db/*
src/sdk/client.ts must not import @/sdk/server
src/sdk/client.ts must not import server-only
src/sdk/client.ts must not import next/headers
src/sdk/client.ts must not import Supabase service role code
```

## 33.3 Modules must not import Kernel

Test intent:

```txt
No file under src/modules may import from @/kernel/*
No file under src/modules may import from ../other-module
No client component may import @/sdk/server
```

Use ESLint, dependency-cruiser, or a custom Vitest static file scan.

A simple custom test is acceptable for MVP.

---

# 34. Runtime Tests

The SDK implementation must include tests for core behavior.

## 34.1 Context tests

```txt
[ ] unauthenticated API request throws UNAUTHENTICATED
[ ] unknown orgSlug throws ORG_NOT_FOUND
[ ] wrong-org user throws ORG_NOT_FOUND
[ ] inactive user throws FORBIDDEN
[ ] suspended org blocks module API by default
[ ] valid user/org returns PlatformContext
```

## 34.2 Permission tests

```txt
[ ] can() returns true for exact permission
[ ] can() returns true for module wildcard
[ ] can() returns true for resource wildcard
[ ] can() returns true for action wildcard if supported
[ ] can() returns false across org boundary
[ ] require() throws FORBIDDEN when denied
[ ] non-null conditions deny until ABAC exists
```

## 34.3 API tests

```txt
[ ] ok() returns status 200 and { data, error: null }
[ ] created() returns status 201
[ ] validationError() returns status 400
[ ] UnauthenticatedError maps to 401
[ ] ForbiddenError maps to 403
[ ] OrgNotFoundError maps to 404
[ ] unknown error maps to 500 without stack trace
```

## 34.4 Event tests

```txt
[ ] emit() includes orgId and actorUserId in envelope
[ ] emit() enforces event naming convention
[ ] listener receives envelope
[ ] failed listener does not block other listeners
```

---

# 35. Claude Implementation Rules

When Claude implements this document, use this instruction:

```md
You are implementing the OneDayOS SDK Public API.

Authoritative document:
docs/engineering-manual/05-sdk/01-sdk-public-api.md

Rules:
- Implement only the SDK public API surface defined in this document.
- Do not invent additional SDK namespaces.
- Do not implement reserved future namespaces.
- Do not add FastAPI.
- Do not add a Python backend.
- Keep @/sdk free of server-only runtime imports.
- Put server-only capabilities in @/sdk/server.
- Put browser-safe helpers in @/sdk/client.
- sdk.getDb must accept PlatformContext, not orgId string.
- Context helpers must verify tenant membership.
- API helpers must return JSON only.
- Module services must receive PlatformContext.
- Add static import-boundary tests.
- Stop if Kernel helpers required by this API do not exist yet.
```

---

# 36. Implementation Order

Implement this SDK API in this order:

```txt
1. Shared SDK types
2. Shared constants
3. Shared API error types
4. SDK error classes
5. Empty server/client boundary files with tests
6. sdk.api response helpers
7. sdk.auth wrappers
8. sdk.context helpers
9. sdk.permissions wrappers
10. sdk.getDb(ctx)
11. sdk.modules wrappers
12. sdk.events wrappers
13. sdk.settings wrappers
14. sdkClient.api helpers
15. sdkClient.routes helpers
16. static import-boundary tests
```

Do not start with module generator code.

Do not start with Inventory.

The SDK contract must exist before generated modules depend on it.

---

# 37. Acceptance Criteria

This document is implemented correctly when:

```txt
[ ] @/sdk exports only safe shared types/constants/errors
[ ] @/sdk/server exports sdk
[ ] @/sdk/server imports server-only
[ ] @/sdk/client exports sdkClient
[ ] @/sdk/client is browser-safe
[ ] PlatformContext is required for server SDK operations
[ ] sdk.getDb(ctx) rejects loose orgId pattern by type
[ ] sdk.context.requireApiContext never redirects
[ ] sdk.context.requireModuleApiContext checks auth, org, module, and permission
[ ] sdk.permissions.require(ctx, requirement) exists
[ ] sdk.api.handle() maps SDK errors to JSON responses
[ ] sdk.api.parseJson() standardizes Zod validation
[ ] sdk.events.emit(ctx, name, payload) includes context
[ ] sdk.modules functions use PlatformContext where tenant-scoped
[ ] sdkClient.api returns ApiResponse<T>
[ ] sdkClient.routes builds org-scoped API paths
[ ] no reserved future namespaces are implemented
[ ] no FastAPI or Python backend is introduced
[ ] import-boundary tests pass
[ ] typecheck passes
[ ] build passes
```

---

# 38. Founder Review Questions

Before freezing this document, answer these:

```txt
[ ] Do we approve `sdk` for server and `sdkClient` for browser?
[ ] Do we approve full PermissionDefinition objects in ModuleManifest instead of string actions?
[ ] Do we approve route builders in sdkClient?
[ ] Do we approve `sdk.api.handle()` as the standard route wrapper?
[ ] Do we approve event handlers receiving EventEnvelope instead of raw payload?
[ ] Do we approve keeping `sdk.objects` reserved, not implemented yet?
[ ] Do we approve denying non-null permission conditions until ABAC exists?
```

---

# 39. Final Position

The OneDayOS SDK should be small, strict, and hard to misuse.

The most important choices in this document are:

```txt
Use @/sdk for shared safe types only.
Use @/sdk/server for server platform access.
Use @/sdk/client for browser helpers.
Use PlatformContext everywhere server-side.
Never pass loose orgId strings into SDK functions.
Never let modules import Kernel internals.
Never let API routes redirect.
Never implement future Platform Service namespaces early.
```

This SDK contract is what keeps OneDayOS from becoming a collection of one-off app folders.

It is also what allows Claude Code to become productive without being architecturally dangerous.
