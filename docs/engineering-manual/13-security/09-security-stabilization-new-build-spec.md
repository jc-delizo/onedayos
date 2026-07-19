# OneDayOS Engineering Manual — Security Stabilization New-Build Specification

**Document ID:** `13-security/09-security-stabilization-new-build-spec.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Date:** July 2026  
**Implementation Allowed:** No — not until this document is reviewed and frozen  
**Intended Implementer:** Claude Code, after founder approval  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `13-security/08-production-readiness-gate.md`

---

# 1. Purpose

This document defines the security foundation that must exist in the restarted OneDayOS platform before business modules are implemented.

The previous kernel MVP proved useful architectural ideas, but it also exposed security gaps that must not be recreated in the new build:

1. API routes were protected mostly by authentication only.
2. `sdk.permissions.can()` existed but was not enforced by routes or services.
3. Org membership checks were incomplete.
4. API routes used page-oriented auth helpers that redirected to HTML instead of returning JSON `401` errors.
5. Some generated module routes accepted or relied on client-supplied `orgId`.
6. The module generator could scale insecure API patterns.

This document turns those lessons into a new-build implementation contract.

The goal is not to patch the old MVP.

The goal is to ensure the restarted platform is secure by design from day one.

---

# 2. Executive Decision

The restarted OneDayOS platform must build security into the Kernel, SDK, API layer, service layer, and module generator before any official business module is created.

The minimum required foundation is:

```txt
API-safe auth helper
+ verified organization context
+ permission enforcement helper
+ typed PlatformContext
+ tenant-scoped database access
+ standardized API response format
+ security regression tests
+ secure module generator templates
```

No business module should be implemented until this foundation exists and passes the security test matrix in this document.

---

# 3. Scope

This document covers:

- API authentication behavior.
- Page authentication behavior.
- Organization membership verification.
- Tenant isolation rules.
- Permission enforcement rules.
- `PlatformContext` design.
- Tenant-scoped service design.
- Tenant-scoped API route design.
- API error response format.
- Module generator security requirements.
- Security tests required before module work.
- Claude Code implementation instructions.

This document does not cover:

- Full Row Level Security implementation.
- Penetration testing.
- Audit log service.
- Notification service.
- Approval workflow service.
- Dynamic CRUD.
- Dynamic Forms.
- Inventory module logic.
- Any business module implementation.

---

# 4. Non-Negotiable Security Principles

## 4.1 Authentication is not authorization

Being logged in only proves identity.

It does not prove:

- the user belongs to the requested organization,
- the user may access the requested module,
- the user may perform the requested action,
- the user may read or mutate the requested resource.

Every protected request must pass both authentication and authorization.

---

## 4.2 Tenant identity must be server-derived

The client must never be trusted to tell the server which tenant it is acting on behalf of.

Forbidden:

```ts
const orgId = body.orgId
const orgId = request.nextUrl.searchParams.get('orgId')
const data = await service.create({ ...body, orgId })
```

Required:

```ts
const ctx = await sdk.auth.requireApiOrgContext({ orgSlug })
const data = await service.create(ctx, parsed.data)
```

The organization must be derived from:

```txt
authenticated Supabase session
+ platform User record
+ route organization slug
+ verified membership match
```

---

## 4.3 API routes must never redirect for auth failures

Page routes may redirect unauthenticated users to `/login`.

API routes must return JSON.

Wrong:

```ts
await sdk.auth.requireAuth()
```

inside an API route if `requireAuth()` performs a redirect.

Correct:

```ts
const ctx = await sdk.auth.requireApiOrgContext({ orgSlug })
```

Unauthenticated API response:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

HTTP status:

```txt
401 Unauthorized
```

---

## 4.4 Permission checks are mandatory in API and service layers

UI permission checks improve experience only.

They are not security.

A hidden button is not an authorization system.

Every protected mutation and sensitive read must enforce permissions on the server.

Minimum required layers:

```txt
API route checks permission before calling service.
Service accepts verified PlatformContext and may re-check permission for sensitive operations.
Database query is always scoped to ctx.orgId.
```

---

## 4.5 Module services must not accept loose `orgId` strings

Loose `orgId` parameters make it too easy for code to accidentally use client-supplied tenant identity.

Avoid this service shape:

```ts
InventoryService.list(orgId: string)
InventoryService.create(input: { orgId: string; name: string })
```

Use this shape:

```ts
InventoryService.list(ctx: PlatformContext)
InventoryService.create(ctx: PlatformContext, input: CreateInventoryInput)
```

The service should receive a verified platform context, not a naked tenant ID.

---

## 4.6 Generated code must be secure by default

The module generator must not output placeholder security.

Generated modules must include:

- API-safe auth.
- org context resolution.
- permission enforcement.
- Zod validation.
- tenant-scoped service calls.
- no client-supplied `orgId`.
- security tests.

A generator that emits insecure code scales insecurity faster than manual development.

---

# 5. Required Runtime Model

The restarted platform should use this request model:

```txt
Browser request
  ↓
Next.js route/page
  ↓
Auth/session resolver
  ↓
Platform User lookup
  ↓
Organization lookup by slug
  ↓
Membership verification
  ↓
PlatformContext creation
  ↓
Permission check
  ↓
Tenant-scoped service call
  ↓
Tenant-scoped database query
  ↓
Standard API response / rendered page
```

The important point is that the route does not decide tenant identity alone, the client does not decide tenant identity, and services never operate without a verified context.

---

# 6. Canonical Types

## 6.1 API response type

All API routes must return this shape:

```ts
export type ApiSuccess<T> = {
  data: T
  error: null
}

export type ApiFailure = {
  data: null
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
    requestId?: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
```

Required error codes:

```ts
export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'ORG_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'MODULE_DISABLED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
```

---

## 6.2 PlatformContext

`PlatformContext` is the verified server-side context passed into module services and platform services.

Recommended shape:

```ts
declare const verifiedPlatformContext: unique symbol

export type PlatformContext = {
  readonly [verifiedPlatformContext]: true

  userId: string
  orgId: string
  orgSlug: string
  userEmail: string
  userName: string
  roleIds: string[]
  enabledModuleIds: string[]

  requestId?: string
}
```

Rules:

1. `PlatformContext` may only be created by Kernel auth/context helpers.
2. Modules may consume `PlatformContext` but must not construct it manually.
3. Tests may create a `PlatformContext` only through approved test helpers.
4. Services should receive `PlatformContext`, not `orgId`.
5. `PlatformContext` must never be sent wholesale to the browser.

Client-safe context must be projected separately:

```ts
export type ClientPlatformContext = {
  userName: string
  orgSlug: string
  orgName: string
  enabledModuleIds: string[]
}
```

---

## 6.3 PermissionRequirement

Permission checks should use a structured object, not loose strings.

```ts
export type PermissionRequirement = {
  module: string
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'manage'
  resource?: string
}
```

Examples:

```ts
{ module: 'inventory', action: 'read' }
{ module: 'inventory', action: 'create', resource: 'stock_adjustment' }
{ module: 'kernel', action: 'manage', resource: 'users' }
```

---

# 7. Canonical Helpers

The restarted Kernel must provide these helpers through the SDK.

## 7.1 Page auth helper

For pages and layouts:

```ts
sdk.auth.requirePageAuth()
```

Behavior:

```txt
Authenticated user → returns Supabase auth user or platform user context
Unauthenticated user → redirects to /login
```

This helper is allowed to redirect because pages render HTML.

---

## 7.2 API auth helper

For API routes:

```ts
sdk.auth.requireApiAuth()
```

Behavior:

```txt
Authenticated user → returns authenticated user
Unauthenticated user → throws/returns API-safe 401 JSON error
```

It must never redirect.

---

## 7.3 Page org context helper

For org-scoped pages and layouts:

```ts
sdk.auth.requirePageOrgContext({ orgSlug })
```

Behavior:

```txt
Unauthenticated user → redirect /login
Unknown org slug → notFound()
Authenticated user from different org → notFound()
Inactive org → notFound() or dedicated suspended page
Inactive user → redirect /login or forbidden page
Valid user + valid org membership → PlatformContext
```

Important:

For an organization slug that exists but does not belong to the current user, prefer `notFound()` over a visible `403` page. This avoids confirming that another tenant exists.

---

## 7.4 API org context helper

For org-scoped APIs:

```ts
sdk.auth.requireApiOrgContext({ orgSlug })
```

Behavior:

```txt
Unauthenticated user → 401 UNAUTHENTICATED
Unknown org slug → 404 ORG_NOT_FOUND
Authenticated user from different org → 404 ORG_NOT_FOUND
Inactive org → 403 FORBIDDEN
Inactive user → 403 FORBIDDEN
Valid user + valid org membership → PlatformContext
```

The helper must verify:

```ts
user.orgId === org.id
```

This check is required even if the product currently assumes one organization per user.

---

## 7.5 Permission check helper

For boolean checks:

```ts
sdk.permissions.can(ctx, requirement)
```

Returns:

```ts
Promise<boolean>
```

Example:

```ts
const allowed = await sdk.permissions.can(ctx, {
  module: 'inventory',
  action: 'read',
})
```

---

## 7.6 Permission enforcement helper

For required checks:

```ts
sdk.permissions.require(ctx, requirement)
```

Behavior:

```txt
Allowed → returns void
Denied → throws/returns 403 FORBIDDEN
```

Example:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  action: 'create',
  resource: 'stock_adjustment',
})
```

This helper should be used in API routes and sensitive services.

---

## 7.7 API wrapper

Every API route should use a wrapper that catches known platform errors and returns standardized JSON.

Recommended shape:

```ts
export function withApiHandler<TParams>(
  handler: (request: NextRequest, context: TParams) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: TParams) => {
    try {
      return await handler(request, context)
    } catch (error) {
      return toApiErrorResponse(error)
    }
  }
}
```

Example route:

```ts
export const POST = withApiHandler(async (request, { params }) => {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requireApiOrgContext({ orgSlug })

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    action: 'create',
    resource: 'stock_adjustment',
  })

  const body = await request.json()
  const input = parseOrThrow(CreateAdjustmentSchema, body)
  const data = await InventoryService.createAdjustment(ctx, input)

  return apiOk(data, { status: 201 })
})
```

---

# 8. API Route Architecture

## 8.1 Public API routes

Public routes do not require a tenant context.

Examples:

```txt
POST /api/kernel/auth/register
POST /api/kernel/auth/login-helper      if needed
GET  /api/health
```

Even public routes must return the standard `{ data, error }` response shape.

---

## 8.2 Authenticated non-tenant API routes

These require authentication but not an org slug.

Examples:

```txt
GET /api/kernel/me
POST /api/kernel/logout-helper          if needed
```

They must use:

```ts
sdk.auth.requireApiAuth()
```

not redirecting page helpers.

---

## 8.3 Tenant-scoped API routes

Tenant-scoped API routes should include `orgSlug` in the path.

Canonical pattern:

```txt
/api/orgs/[orgSlug]/...
```

Examples:

```txt
GET  /api/orgs/[orgSlug]/employees
POST /api/orgs/[orgSlug]/employees
GET  /api/orgs/[orgSlug]/inventory/products
POST /api/orgs/[orgSlug]/inventory/adjustments
GET  /api/orgs/[orgSlug]/settings
```

These routes must use:

```ts
sdk.auth.requireApiOrgContext({ orgSlug })
```

They must not accept tenant identity through:

```txt
query string orgId
request body orgId
request header orgId
hidden form field orgId
client-side localStorage orgId
```

---

# 9. Page Route Architecture

Org-scoped pages live under:

```txt
/:[orgSlug]/...
```

or in Next.js App Router structure:

```txt
src/app/(platform)/[orgSlug]/...
```

The org layout must resolve and verify context once:

```tsx
export default async function OrgLayout({ children, params }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext({ orgSlug })

  return (
    <AppShell context={toClientPlatformContext(ctx)}>
      {children}
    </AppShell>
  )
}
```

Rules:

1. The org layout must not load an organization by slug without verifying `user.orgId === org.id`.
2. Sidebar modules must come from verified context or a tenant-scoped module registry lookup.
3. Page components must not fetch tenant data with a client-supplied `orgId`.
4. Server components may use `PlatformContext` directly.
5. Client components receive only client-safe projections.

---

# 10. Database Access Contract

## 10.1 Public SDK database access

For restarted development, the module-facing database seam should be strengthened from:

```ts
sdk.getDb(orgId)
```

to:

```ts
sdk.getDb(ctx)
```

where `ctx` is a verified `PlatformContext`.

This preserves the future database-per-tenant seam while making it harder to pass untrusted tenant IDs.

Example:

```ts
const db = sdk.getDb(ctx)

const products = await db.product.findMany({
  where: { orgId: ctx.orgId },
})
```

## 10.2 Kernel-internal database access

Kernel internals may use private lower-level helpers when resolving context:

```ts
getDbForOrgId(orgId: string)
```

But modules should not use this function.

## 10.3 Query scoping rule

Every tenant-scoped query must include:

```ts
where: { orgId: ctx.orgId }
```

or an equivalent relation filter that enforces tenant ownership.

Forbidden:

```ts
await db.product.findUnique({ where: { id } })
```

Required:

```ts
await db.product.findFirst({
  where: {
    id,
    orgId: ctx.orgId,
  },
})
```

`findUnique` is unsafe for tenant-scoped models unless the unique constraint includes `orgId`.

Preferred unique constraint for tenant-owned slugs/codes:

```prisma
@@unique([orgId, code])
```

Then query:

```ts
await db.product.findUnique({
  where: {
    orgId_code: {
      orgId: ctx.orgId,
      code,
    },
  },
})
```

---

# 11. Permission Enforcement Contract

## 11.1 Permission model

The permission model should support:

```txt
module
+ action
+ optional resource
+ optional conditions later
```

Example rows:

```txt
module: inventory, action: read,   resource: null
module: inventory, action: create, resource: stock_adjustment
module: kernel,    action: manage, resource: users
module: *,         action: *,      resource: null
```

## 11.2 Wildcard behavior

Wildcard module:

```txt
module = '*'
```

grants across all modules.

Wildcard action:

```txt
action = '*'
```

grants all actions for the matched module/resource.

Resource behavior:

```txt
permission.resource = null
  → grants all resources for that module/action

permission.resource = requirement.resource
  → grants only that resource

requirement.resource omitted
  → only permission.resource = null should satisfy it
```

## 11.3 Conditions behavior

`conditions` are reserved for future ABAC.

For MVP:

```txt
conditions must be null
```

If a permission row has non-null `conditions`, `can()` must not blindly grant it unless an explicit condition evaluator exists.

Safe default:

```txt
conditional permission without evaluator → deny
```

## 11.4 Role scoping

Permissions must be scoped through roles belonging to the same organization.

Required role lookup logic:

```ts
user roles
  where userId = ctx.userId
  and role.orgId = ctx.orgId
```

Do not rely only on `userId`.

This protects future multi-org membership and prevents role leakage.

---

# 12. Service-Layer Contract

## 12.1 Service method signatures

Module services must accept `PlatformContext` as the first argument.

Correct:

```ts
export class InventoryService {
  static async listProducts(ctx: PlatformContext) {}
  static async createAdjustment(ctx: PlatformContext, input: CreateAdjustmentInput) {}
  static async deleteAdjustment(ctx: PlatformContext, id: string) {}
}
```

Wrong:

```ts
export class InventoryService {
  static async listProducts(orgId: string) {}
  static async createAdjustment(input: CreateAdjustmentInput & { orgId: string }) {}
  static async deleteAdjustment(id: string) {}
}
```

## 12.2 Service permission policy

API routes must enforce permissions before calling services.

Services should still enforce permissions for sensitive mutations or use narrower context types.

Acceptable patterns:

### Pattern A — Route enforces, service trusts verified context

```ts
await sdk.permissions.require(ctx, { module: 'inventory', action: 'create' })
await InventoryService.createAdjustment(ctx, input)
```

Use for simple services.

### Pattern B — Service enforces internally

```ts
static async createAdjustment(ctx: PlatformContext, input: CreateAdjustmentInput) {
  await sdk.permissions.require(ctx, {
    module: 'inventory',
    action: 'create',
    resource: 'stock_adjustment',
  })

  // mutation
}
```

Use for sensitive operations, reused operations, and anything callable from multiple routes.

### Pattern C — Authorized context specialization

```ts
const inventoryCtx = await InventoryPermissions.requireInventoryManager(ctx)
await InventoryService.createAdjustment(inventoryCtx, input)
```

Use later if permission logic becomes complex.

## 12.3 Service output

Services should return domain data or throw platform errors.

They should not return raw `NextResponse`.

Wrong:

```ts
return NextResponse.json(...)
```

inside a service.

Correct:

```ts
return adjustment
```

or:

```ts
throw new NotFoundError('Stock adjustment not found')
```

The API wrapper maps errors to JSON.

---

# 13. Standard API Response Helpers

The Kernel should provide helpers similar to:

```ts
export function apiOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(
    { data, error: null },
    { status: init?.status ?? 200 }
  )
}

export function apiFail(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    {
      data: null,
      error: { code, message, details },
    },
    { status }
  )
}
```

Expected mappings:

| Condition | Code | HTTP Status |
|---|---:|---:|
| No session | `UNAUTHENTICATED` | 401 |
| Authenticated but permission denied | `FORBIDDEN` | 403 |
| Org missing or belongs to another tenant | `ORG_NOT_FOUND` | 404 |
| User record missing | `USER_NOT_FOUND` | 401 or 403 |
| Module disabled | `MODULE_DISABLED` | 403 |
| Zod validation failed | `VALIDATION_ERROR` | 400 |
| Entity not found inside verified org | `NOT_FOUND` | 404 |
| Unique conflict | `CONFLICT` | 409 |
| Unexpected error | `INTERNAL_ERROR` | 500 |

For unexpected errors, return a safe message to the client and log the actual error server-side.

---

# 14. Validation Contract

Every mutation must validate request input with Zod.

Validation rules:

1. Zod schemas must not include tenant identity fields such as `orgId`.
2. Create schemas validate user-provided business data only.
3. Update schemas should be explicit, not blindly `partial()` when sensitive fields exist.
4. Validation errors must return `VALIDATION_ERROR` with useful field details.

Forbidden create schema:

```ts
export const CreateRecordSchema = z.object({
  name: z.string(),
  orgId: z.string(),
})
```

Required create schema:

```ts
export const CreateRecordSchema = z.object({
  name: z.string().min(1),
})
```

The service receives tenant context separately:

```ts
await RecordService.create(ctx, parsed.data)
```

---

# 15. Module Enablement Contract

Tenant access to a module requires both:

```txt
module enabled for org
+ user permission for module/action
```

Enabled module alone is not enough.

User permission alone is not enough if the org has not purchased or enabled the module.

API route pattern:

```ts
const ctx = await sdk.auth.requireApiOrgContext({ orgSlug })
await sdk.modules.requireEnabled(ctx, 'inventory')
await sdk.permissions.require(ctx, { module: 'inventory', action: 'read' })
```

Page/sidebar pattern:

```ts
const enabledModules = await sdk.modules.getEnabledForContext(ctx)
```

If a module is disabled:

```txt
API → 403 MODULE_DISABLED
Page → notFound() or module-disabled state
Sidebar → hide module
```

---

# 16. Event Contract Security

Events must not bypass authorization.

Rules:

1. Permission is checked before mutation.
2. Mutation happens in tenant-scoped service.
3. Event is emitted after successful mutation.
4. Event payload includes `orgId` from `ctx.orgId`.
5. Event payload includes actor `userId` from `ctx.userId` where relevant.
6. Event listeners must treat event payloads as internal but still tenant-scoped.

Example:

```ts
await sdk.events.emit('inventory.stock_adjustment.created', {
  orgId: ctx.orgId,
  actorUserId: ctx.userId,
  adjustmentId: adjustment.id,
})
```

Event names must follow:

```txt
{module}.{entity}.{past_tense_verb}
```

Examples:

```txt
inventory.stock_adjustment.created
kernel.employee.created
crm.customer.converted
purchasing.purchase_request.approved
```

---

# 17. Module Generator Security Contract

The module generator must produce secure code from the first line.

## 17.1 Generated module schema

Generated create schemas must not include `orgId`.

Correct generated schema:

```ts
export const CreateExampleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})
```

Forbidden generated schema:

```ts
export const CreateExampleSchema = z.object({
  name: z.string(),
  orgId: z.string(),
})
```

---

## 17.2 Generated service

Correct generated service shape:

```ts
import { sdk, type PlatformContext } from '@/sdk'
import type { CreateExampleInput } from './schema'

export class ExampleService {
  static async list(ctx: PlatformContext) {
    const db = sdk.getDb(ctx)
    return db.exampleRecord.findMany({
      where: { orgId: ctx.orgId },
    })
  }

  static async create(ctx: PlatformContext, input: CreateExampleInput) {
    await sdk.permissions.require(ctx, {
      module: 'example',
      action: 'create',
    })

    const db = sdk.getDb(ctx)
    const record = await db.exampleRecord.create({
      data: {
        orgId: ctx.orgId,
        ...input,
      },
    })

    await sdk.events.emit('example.record.created', {
      orgId: ctx.orgId,
      actorUserId: ctx.userId,
      recordId: record.id,
    })

    return record
  }
}
```

---

## 17.3 Generated API route

Tenant-scoped generated API routes should live under:

```txt
src/app/api/orgs/[orgSlug]/[module]/route.ts
```

Example generated route:

```ts
import { sdk } from '@/sdk'
import { withApiHandler, apiOk, parseOrThrow } from '@/kernel/api'
import { ExampleService } from '@/modules/example/service'
import { CreateExampleSchema } from '@/modules/example/schema'

export const GET = withApiHandler(async (_request, { params }) => {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requireApiOrgContext({ orgSlug })

  await sdk.modules.requireEnabled(ctx, 'example')
  await sdk.permissions.require(ctx, { module: 'example', action: 'read' })

  const data = await ExampleService.list(ctx)
  return apiOk(data)
})

export const POST = withApiHandler(async (request, { params }) => {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requireApiOrgContext({ orgSlug })

  await sdk.modules.requireEnabled(ctx, 'example')
  await sdk.permissions.require(ctx, { module: 'example', action: 'create' })

  const input = parseOrThrow(CreateExampleSchema, await request.json())
  const data = await ExampleService.create(ctx, input)

  return apiOk(data, { status: 201 })
})
```

---

## 17.4 Generated client calls

Client components should call org-scoped APIs using the route `orgSlug`, not `orgId`.

Correct:

```ts
await fetch(`/api/orgs/${orgSlug}/example`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
})
```

Forbidden:

```ts
await fetch(`/api/example?orgId=${orgId}`)
```

or:

```ts
body: JSON.stringify({ ...formData, orgId })
```

---

## 17.5 Generator forbidden patterns

The generator must never emit:

```txt
orgId: z.string()
request.nextUrl.searchParams.get('orgId')
where: { orgId: input.orgId }
where: { id } on tenant-scoped models
await sdk.auth.requireAuth() inside API routes if it redirects
import { prisma } from '@/kernel/db/client' inside modules
import anything from '@/kernel/*' inside modules
API route without sdk.permissions.require(...)
API route without sdk.auth.requireApiOrgContext(...)
mutation without event emission
DELETE that hard-deletes tenant records by default
```

---

# 18. Required Tests

This section is mandatory.

The restarted platform is not allowed to continue to module work until these tests exist and pass.

## 18.1 API auth tests

| Test | Expected Result |
|---|---|
| Unauthenticated request to tenant API | `401 UNAUTHENTICATED` JSON |
| Unauthenticated request to page | redirects to `/login` |
| API auth helper never calls `redirect()` | test passes |
| API error body always has `{ data: null, error }` | test passes |

## 18.2 Org membership tests

Create at least two orgs:

```txt
Org A: alpha-corp
Org B: beta-corp
```

Create at least two users:

```txt
User A belongs to Org A
User B belongs to Org B
```

Required tests:

| Test | Expected Result |
|---|---|
| User A loads `/alpha-corp/dashboard` | allowed |
| User A loads `/beta-corp/dashboard` | not found |
| User A calls `/api/orgs/alpha-corp/...` | allowed if permission passes |
| User A calls `/api/orgs/beta-corp/...` | `404 ORG_NOT_FOUND` |
| User A submits body `{ orgId: betaOrgId }` to Org A route | ignored or rejected; no cross-tenant write |

## 18.3 Permission tests

Required tests:

| Test | Expected Result |
|---|---|
| User with no roles calls protected API | `403 FORBIDDEN` |
| User with read permission can read | allowed |
| User with read permission cannot create | `403 FORBIDDEN` |
| User with module wildcard can access matching action | allowed |
| User with action wildcard can access matching module | allowed |
| User with resource-specific permission cannot perform module-wide action | denied |
| Non-null `conditions` without evaluator | denied |

## 18.4 Service-layer tests

Required tests:

| Test | Expected Result |
|---|---|
| Service list scopes query by `ctx.orgId` | pass |
| Service create writes `orgId: ctx.orgId` | pass |
| Service ignores input `orgId` if somehow present | pass |
| Service emits event with `ctx.orgId` and `ctx.userId` | pass |
| Service mutation without permission fails if service enforces internally | pass |

## 18.5 Module generator tests

The module generator must have tests that inspect generated output.

Required tests:

| Test | Expected Result |
|---|---|
| Generated schema does not include `orgId` | pass |
| Generated API uses `requireApiOrgContext` | pass |
| Generated API uses `permissions.require` | pass |
| Generated API does not read query `orgId` | pass |
| Generated service accepts `PlatformContext` | pass |
| Generated module imports from `@/sdk`, not `@/kernel/*` | pass |
| Generated client calls `/api/orgs/${orgSlug}/...` | pass |

## 18.6 Forbidden import tests

CI should fail if modules import Kernel internals.

Forbidden:

```txt
src/modules/** imports @/kernel/*
src/modules/** imports @/kernel/db/client
src/modules/** imports another src/modules/* package directly
```

Allowed:

```txt
src/modules/** imports @/sdk
src/modules/** imports @/components
src/modules/** imports local module files
```

---

# 19. Implementation Order for Claude Code

Claude should implement this document in the following order.

## Step 1 — API response primitives

Create:

```txt
src/kernel/api/response.ts
src/kernel/api/errors.ts
src/kernel/api/handler.ts
src/kernel/api/validation.ts
```

Exports:

```ts
apiOk
apiFail
withApiHandler
parseOrThrow
PlatformApiError
```

Tests:

```txt
response helpers
error mapping
validation error mapping
unexpected error mapping
```

---

## Step 2 — Auth/session split

Create separate helpers for pages and APIs.

Page helpers:

```ts
requirePageAuth()
requirePageOrgContext({ orgSlug })
```

API helpers:

```ts
requireApiAuth()
requireApiOrgContext({ orgSlug })
```

Do not reuse redirecting helpers in APIs.

Tests:

```txt
page helper redirects unauthenticated users
API helper returns/throws 401 JSON-safe error
org mismatch is denied
inactive user denied
inactive org denied
```

---

## Step 3 — PlatformContext

Create:

```txt
src/kernel/context/platform-context.ts
src/kernel/context/test-context.ts
```

Exports through SDK:

```ts
type PlatformContext
createTestPlatformContext
```

Rules:

```txt
Production context is created only by auth/org helpers.
Test context is created only by test helper.
```

---

## Step 4 — Permission enforcement

Implement:

```ts
sdk.permissions.can(ctx, requirement)
sdk.permissions.require(ctx, requirement)
```

Tests:

```txt
role scoping by orgId
module wildcard
action wildcard
resource matching
conditions denied without evaluator
403 behavior
```

---

## Step 5 — SDK exports

SDK must expose:

```ts
sdk.auth.requirePageAuth
sdk.auth.requireApiAuth
sdk.auth.requirePageOrgContext
sdk.auth.requireApiOrgContext
sdk.permissions.can
sdk.permissions.require
sdk.modules.requireEnabled
sdk.getDb(ctx)
sdk.events.emit
```

Modules must not import from Kernel internals.

---

## Step 6 — App shell org guard

The org layout must use:

```ts
sdk.auth.requirePageOrgContext({ orgSlug })
```

It must not independently load org and user without membership verification.

---

## Step 7 — API route examples

Create at least one secure Kernel tenant API route as a reference implementation.

Example:

```txt
GET /api/orgs/[orgSlug]/kernel/users
```

Requirements:

```txt
uses withApiHandler
uses requireApiOrgContext
uses module enabled check if relevant
uses permissions.require
returns apiOk
has tests for 401/403/404
```

---

## Step 8 — Seed roles and permissions

Seed must include:

```txt
Demo org A
Demo org B
Admin role
Staff role
Admin wildcard permission: module='*', action='*', resource=null
Staff limited read permission
At least one user per org for tenant tests
```

Do not seed only one tenant. Tenant tests require at least two.

---

## Step 9 — Module generator hardening

Update generator templates so generated modules follow this document.

Generated output must include:

```txt
PlatformContext service signatures
org-scoped API routes
API auth context helper
permission enforcement
no client orgId
no query orgId
security tests
SDK-only imports
```

---

## Step 10 — CI/security checks

Add checks for:

```txt
forbidden imports
forbidden generated patterns
lint
typecheck
test
build
```

Minimum scripts:

```json
{
  "typecheck": "tsc --noEmit",
  "test:run": "vitest run",
  "security:imports": "node scripts/check-forbidden-imports.mjs",
  "security:patterns": "node scripts/check-forbidden-patterns.mjs"
}
```

---

# 20. Acceptance Criteria

This document is complete only when all of the following are true.

## 20.1 Auth behavior

```txt
[ ] Page auth redirects unauthenticated users to /login
[ ] API auth returns 401 JSON for unauthenticated requests
[ ] API auth never returns HTML redirects
[ ] API auth helper is separate from page auth helper
```

## 20.2 Tenant isolation

```txt
[ ] User from Org A cannot load Org B page
[ ] User from Org A cannot call Org B API
[ ] User from Org A cannot write data into Org B
[ ] Client-supplied orgId is ignored or rejected
[ ] All tenant queries scope by ctx.orgId
[ ] Tenant tests use at least two orgs
```

## 20.3 Permission enforcement

```txt
[ ] sdk.permissions.can(ctx, requirement) works
[ ] sdk.permissions.require(ctx, requirement) works
[ ] API routes call permission enforcement
[ ] Sensitive services call permission enforcement or require authorized context
[ ] Wildcard module/action behavior is tested
[ ] Resource-specific behavior is tested
[ ] Conditions are denied unless evaluator exists
```

## 20.4 API contract

```txt
[ ] Every API route returns { data, error }
[ ] Validation errors return VALIDATION_ERROR
[ ] Permission errors return FORBIDDEN
[ ] Auth errors return UNAUTHENTICATED
[ ] Org mismatch returns ORG_NOT_FOUND or equivalent non-leaking 404
[ ] Unexpected errors are logged server-side and hidden client-side
```

## 20.5 SDK/module boundary

```txt
[ ] Modules import from @/sdk only for platform capabilities
[ ] Modules do not import @/kernel/*
[ ] Modules do not import raw Prisma client
[ ] Module services accept PlatformContext
[ ] sdk.getDb(ctx) is the module-facing database seam
```

## 20.6 Generator safety

```txt
[ ] Generated schema excludes orgId
[ ] Generated API route is org-scoped
[ ] Generated API route uses requireApiOrgContext
[ ] Generated API route uses permissions.require
[ ] Generated service accepts PlatformContext
[ ] Generated service writes orgId from ctx.orgId
[ ] Generated client calls /api/orgs/[orgSlug]/...
[ ] Generated tests include security checks
```

## 20.7 Verification commands

Before this foundation is considered done:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run security:imports
npm run security:patterns
npm run build
```

All must pass.

---

# 21. Forbidden Anti-Patterns

Claude Code must not implement any of these patterns.

## 21.1 API redirect anti-pattern

```ts
export async function GET() {
  await sdk.auth.requireAuth()
  return NextResponse.json(...)
}
```

If `requireAuth()` redirects, this is forbidden inside APIs.

---

## 21.2 Client org ID anti-pattern

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

or:

```ts
const { orgId } = await request.json()
```

or:

```ts
CreateSchema = z.object({ orgId: z.string() })
```

---

## 21.3 Raw Prisma in modules

```ts
import { prisma } from '@/kernel/db/client'
```

inside:

```txt
src/modules/**
```

Forbidden.

---

## 21.4 Direct module-to-module import

```ts
import { LeaveService } from '@/modules/leave/service'
```

inside another module.

Forbidden.

Use events, SDK, or shared Business Objects.

---

## 21.5 Auth-only mutation

```ts
await sdk.auth.requireApiAuth()
await SomeService.create(...)
```

without permission enforcement.

Forbidden.

---

## 21.6 Tenant-unscoped entity lookup

```ts
await db.product.findUnique({ where: { id } })
```

for tenant-owned entities.

Forbidden unless the unique key includes tenant ownership.

---

# 22. Claude Code Implementation Prompt

When this document is frozen, use a prompt like this:

```md
You are implementing the OneDayOS security foundation for a restarted platform build.

Authoritative document:
docs/engineering-manual/13-security/09-security-stabilization-new-build-spec.md

Context:
OneDayOS is a multi-tenant Business Operating System for Philippine SMEs. The previous MVP had open risks around tenant isolation, permission enforcement, and API auth redirect behavior. This new build must not recreate those risks.

Rules:
- Implement only the security foundation described in this document.
- Do not implement Inventory, CRM, Leave, or any business module.
- Do not create Platform Services such as approvals, notifications, comments, or audit logs.
- Do not let API routes use redirecting auth helpers.
- Do not accept orgId from request body, query string, headers, localStorage, or hidden form fields.
- Do not let modules import from @/kernel/*.
- Do not let modules use raw Prisma.
- Module services must accept PlatformContext.
- Every protected API route must use requireApiOrgContext and permissions.require.
- Every API route must return { data, error } JSON.
- Add tests for every acceptance criterion.
- Stop and report if the manual is ambiguous.

Expected output:
1. Implementation plan.
2. Files to create/modify.
3. Tests to add.
4. Code changes.
5. Verification results for lint, typecheck, test, security checks, and build.
```

---

# 23. Architect Notes

## 23.1 This document intentionally strengthens `sdk.getDb(orgId)`

The previous kernel reference used `sdk.getDb(orgId)` as the future database-routing seam.

That idea is correct.

However, for the restarted build, the safer public module-facing interface is:

```ts
sdk.getDb(ctx)
```

because `ctx` is verified by the Kernel and cannot be confused with a client-supplied tenant ID.

Internally, the SDK can still route using:

```ts
ctx.orgId
```

So the future database-per-tenant seam is preserved.

This is an intentional architectural hardening, not a rejection of the original seam.

---

## 23.2 RLS remains defense-in-depth, not the first fix

PostgreSQL Row Level Security is valuable later.

But the first fix is application-level correctness:

```txt
verified context
+ scoped queries
+ permission checks
+ tests
```

RLS should not be used as an excuse to allow sloppy application code.

When RLS is implemented later, it should reinforce these rules, not replace them.

---

## 23.3 This should be implemented before official modules

Inventory should not start until this security foundation passes.

Otherwise, every generated and hand-written module will inherit unstable patterns.

The correct order is:

```txt
Security foundation
→ SDK/module boundary
→ design system
→ Business Objects
→ module system/generator
→ Inventory
```

---

# 24. Review Checklist for Founder Approval

Before freezing this document, confirm these decisions:

```txt
[ ] Tenant-scoped APIs should use /api/orgs/[orgSlug]/... pattern
[ ] Public module-facing DB seam should be sdk.getDb(ctx), not sdk.getDb(orgId)
[ ] Org mismatch should return notFound/404 instead of visible 403
[ ] Module services must receive PlatformContext
[ ] Generated modules must include security tests
[ ] RLS remains deferred until after application-level guards are proven
```

If approved, this document becomes the implementation specification Claude should follow before rebuilding modules.
