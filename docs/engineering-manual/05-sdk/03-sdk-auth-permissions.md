# OneDayOS Engineering Manual — 05 SDK / 03 SDK Auth & Permissions

**Document ID:** `05-sdk/03-sdk-auth-permissions.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Implementation Allowed:** No, not until this document is reviewed and frozen  
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

---

# 1. Purpose

This document defines the SDK authentication, tenant-context, module-access, and permission helper contracts for OneDayOS.

The goal is to make secure access control the default path for every page, API route, service, module, and generator.

This document exists because the previous MVP proved that merely having a permission model is not enough. The old build had a `can()` helper, but routes and services did not consistently call it. It also had incomplete organization membership checks and API routes that could use redirect-style authentication helpers instead of JSON-safe API authentication behavior.

The restarted platform must not repeat that pattern.

---

# 2. Core Decision

The SDK must expose authentication and authorization through verified context helpers.

Modules should not manually assemble authentication, organization, module, and permission state.

The canonical server-side pattern is:

```ts
import { sdk } from '@/sdk/server'

const ctx = await sdk.auth.requireApiOrgContext(req, params.orgSlug)
await sdk.modules.requireEnabled(ctx, 'inventory')
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})

const result = await InventoryService.createAdjustment(ctx, input)
```

The canonical service pattern is:

```ts
export class InventoryService {
  static async createAdjustment(ctx: PlatformContext, input: CreateAdjustmentInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    })

    const db = sdk.getDb(ctx)
    // perform tenant-scoped mutation
  }
}
```

The canonical forbidden pattern is:

```ts
const orgId = body.orgId
const userId = body.userId
const db = sdk.getDb(orgId)
await sdk.permissions.can(userId, 'create', 'inventory', orgId)
```

That pattern is forbidden because the tenant and user identity may have been supplied by the client.

---

# 3. Non-Negotiable Rules

## 3.1 Client-supplied tenant identity is forbidden

The client must never submit or control `orgId` for tenant-scoped operations.

Forbidden:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
const orgId = body.orgId
const orgId = formData.get('orgId')
```

Required:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
const orgId = ctx.org.id
```

The URL may contain `orgSlug`, but `orgSlug` is only a locator. It is not authorization.

---

## 3.2 Services receive verified `PlatformContext`

Module services must not accept loose `orgId`, `userId`, or `roleIds` as independent parameters.

Forbidden:

```ts
ProductService.list(orgId)
InventoryService.create(orgId, userId, input)
LeaveService.approve(userId, orgId, leaveId)
```

Required:

```ts
ProductService.list(ctx)
InventoryService.create(ctx, input)
LeaveService.approve(ctx, leaveId)
```

A `PlatformContext` is created only by Kernel/SDK auth helpers after authentication and tenant verification.

---

## 3.3 Page auth and API auth are separate

Page authentication may redirect.

API authentication must return structured JSON errors.

Page helper:

```ts
await sdk.auth.requirePageAuth()
```

API helper:

```ts
await sdk.auth.requireApiAuth(req)
```

Forbidden in API routes:

```ts
await sdk.auth.requirePageAuth()
await requireAuth() // if this redirects
redirect('/login')
```

---

## 3.4 UI permission checks are not security

Client-side permission checks are for usability only.

They may hide buttons, links, and menu items.

They must never be treated as authorization.

Security enforcement must happen in API routes and services.

---

## 3.5 Module enablement and permissions are separate gates

An organization may have a module enabled, but a user may still lack permission to use it.

Likewise, a user may have a role that mentions a module, but if the organization does not have that module enabled, access must still be denied.

Required access sequence:

```txt
1. Authentication
2. Active platform user
3. Organization exists
4. User belongs to organization
5. Organization is active / not suspended for module operations
6. Module is enabled for organization
7. User has permission
8. Input is valid
9. Service executes
```

---

# 4. SDK Export Location

This document applies to the server-only SDK:

```ts
import { sdk } from '@/sdk/server'
```

The shared SDK may export safe types:

```ts
import type { PlatformContext, PermissionRequirement } from '@/sdk'
```

The browser-safe SDK may expose current-user fetch helpers and permission metadata for UI convenience:

```ts
import { sdkClient } from '@/sdk/client'
```

But the browser SDK must not expose permission-enforcement authority.

---

# 5. Required Shared Types

## 5.1 `PlatformContext`

`PlatformContext` is the verified tenant/user context for server-side platform operations.

```ts
export type PlatformContext = {
  requestId: string

  auth: {
    provider: 'supabase'
    userId: string
    email: string | null
  }

  user: {
    id: string
    orgId: string
    name: string
    email: string
    isActive: boolean
  }

  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
    subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled'
    plan: string
  }

  roles: Array<{
    id: string
    name: string
    isSystem: boolean
  }>

  permissions: PermissionGrant[]

  enabledModules: string[]
}
```

Notes:

- `ctx.user.orgId` must equal `ctx.org.id`.
- `ctx.org.slug` must match the requested `orgSlug`.
- `ctx.permissions` must only contain permissions scoped to `ctx.org.id`.
- `ctx.enabledModules` must only contain modules enabled for `ctx.org.id`.

---

## 5.2 `PermissionGrant`

```ts
export type PermissionGrant = {
  id: string
  roleId: string
  orgId: string
  module: string
  resource: string
  action: string
  conditions: null
}
```

MVP rule:

```txt
conditions must be null.
```

If `conditions` is non-null, the permission must not grant access until a real ABAC evaluator exists.

---

## 5.3 `PermissionRequirement`

```ts
export type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Examples:

```ts
const readProducts: PermissionRequirement = {
  module: 'inventory',
  resource: 'product',
  action: 'read',
}

const approveLeave: PermissionRequirement = {
  module: 'leave',
  resource: 'leave_request',
  action: 'approve',
}
```

---

## 5.4 `AuthResult`

```ts
export type AuthResult =
  | { ok: true; user: SupabaseAuthUser }
  | { ok: false; error: ApiError }
```

This is mostly useful internally. Public API routes should normally use `sdk.api.handle()` so thrown platform errors are converted into the correct JSON response.

---

# 6. Required Server SDK Surface

The server SDK must expose:

```ts
export const sdk = {
  auth: {
    getSession,
    getAuthUser,
    requirePageAuth,
    requireApiAuth,
    getCurrentUser,
    requireCurrentUser,
    requirePageOrgContext,
    requireApiOrgContext,
    requireApiModuleContext,
  },

  permissions: {
    can,
    require,
    canAny,
    requireAny,
    canAll,
    requireAll,
  },

  modules: {
    isEnabled,
    requireEnabled,
  },

  getDb,
  db,
  events,
  api,
}
```

---

# 7. Auth Helper Contracts

## 7.1 `sdk.auth.getSession()`

Purpose:

Returns the Supabase session user if available.

Contract:

```ts
async function getSession(): Promise<{ user: SupabaseAuthUser | null }>
```

Rules:

- May be used by pages, layouts, and internal helpers.
- Must not redirect.
- Must not return platform `User` from Prisma.
- Must not create database records.

---

## 7.2 `sdk.auth.getAuthUser()`

Purpose:

Returns the Supabase authenticated user or `null`.

Contract:

```ts
async function getAuthUser(): Promise<SupabaseAuthUser | null>
```

Rules:

- Thin helper over Supabase Auth.
- No redirects.
- No API response side effects.

---

## 7.3 `sdk.auth.requirePageAuth()`

Purpose:

Protects server-rendered pages and layouts.

Contract:

```ts
async function requirePageAuth(): Promise<SupabaseAuthUser>
```

Behavior:

```txt
Authenticated → returns Supabase user
Unauthenticated → redirects to /login
```

Allowed only in:

```txt
Server components
Layouts
Page-level loaders
```

Forbidden in:

```txt
API routes
Module services
Background jobs
Client components
```

---

## 7.4 `sdk.auth.requireApiAuth(req)`

Purpose:

Protects API routes without redirecting.

Contract:

```ts
async function requireApiAuth(req: NextRequest): Promise<SupabaseAuthUser>
```

Behavior:

```txt
Authenticated → returns Supabase user
Unauthenticated → throws ApiError('UNAUTHENTICATED', 401)
```

The API wrapper converts this to:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

Forbidden behavior:

```txt
No redirect.
No HTML response.
No 307.
No swallowed auth failure.
```

---

## 7.5 `sdk.auth.getCurrentUser(authUserId)`

Purpose:

Returns the platform `User` record for an authenticated Supabase user.

Contract:

```ts
async function getCurrentUser(authUserId: string): Promise<User | null>
```

Rules:

- Lookup by Supabase auth user ID.
- Must not accept user ID from client payload.
- Must select only necessary fields.
- Must not expose password, provider tokens, or auth internals.

---

## 7.6 `sdk.auth.requireCurrentUser(authUserId)`

Purpose:

Returns the platform `User` or throws a safe error.

Contract:

```ts
async function requireCurrentUser(authUserId: string): Promise<User>
```

Behavior:

```txt
User exists and active → returns User
No Prisma user row → throws USER_NOT_FOUND
Inactive user → throws USER_INACTIVE
```

Important:

If a Supabase Auth user exists without a Prisma `User` record, that indicates a registration synchronization problem. It should not be silently repaired during normal API access.

---

# 8. Organization Context Helpers

## 8.1 `sdk.auth.requirePageOrgContext(orgSlug)`

Purpose:

Protects organization-scoped pages and layouts.

Contract:

```ts
async function requirePageOrgContext(orgSlug: string): Promise<PlatformContext>
```

Behavior:

```txt
Unauthenticated → redirect to /login
Org missing → notFound()
Wrong organization → notFound()
Inactive user → redirect or access-denied page
Suspended organization → limited shell or billing/suspended page
Valid access → returns PlatformContext
```

Wrong-organization access should not reveal that the other organization exists.

That means an authenticated user from `acme` trying to access `/other-company/dashboard` should receive a safe not-found response, not a message saying “you are not a member of Other Company.”

---

## 8.2 `sdk.auth.requireApiOrgContext(req, orgSlug)`

Purpose:

Protects organization-scoped APIs.

Contract:

```ts
async function requireApiOrgContext(
  req: NextRequest,
  orgSlug: string
): Promise<PlatformContext>
```

Behavior:

```txt
Unauthenticated → ApiError('UNAUTHENTICATED', 401)
Org missing → ApiError('ORG_NOT_FOUND', 404)
Wrong organization → ApiError('ORG_NOT_FOUND', 404)
Inactive user → ApiError('USER_INACTIVE', 403)
Suspended organization → ApiError('ORG_SUSPENDED', 403)
Valid access → PlatformContext
```

Wrong-organization API access returns `404 ORG_NOT_FOUND`, not `403`, to avoid confirming organization existence.

---

## 8.3 `sdk.auth.requireApiModuleContext(req, orgSlug, moduleId)`

Purpose:

Protects APIs that belong to a module.

Contract:

```ts
async function requireApiModuleContext(
  req: NextRequest,
  orgSlug: string,
  moduleId: string
): Promise<PlatformContext>
```

Behavior:

This helper performs:

```txt
1. API auth
2. Platform user lookup
3. Org lookup
4. Org membership check
5. Org active/suspended check
6. Module enabled check
7. Returns PlatformContext
```

It does not automatically check specific permissions. Permission requirements remain explicit at route/service level.

Example:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

---

# 9. Context Creation Pipeline

All context helpers must build `PlatformContext` using this sequence:

```txt
1. Read Supabase authenticated user from secure session/cookies.
2. Find matching Prisma User by auth user ID.
3. Verify User exists.
4. Verify User is active.
5. Find Organization by orgSlug.
6. Verify Organization exists.
7. Verify User.orgId === Organization.id.
8. Load Subscription state.
9. Load User roles scoped to Organization.id.
10. Load permissions through those roles scoped to Organization.id.
11. Load enabled modules for Organization.id.
12. Construct PlatformContext.
```

Important:

`PlatformContext` must not be constructed directly by modules.

Forbidden:

```ts
const ctx = {
  user: { id: body.userId },
  org: { id: body.orgId },
} as PlatformContext
```

Required:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
```

---

# 10. Permission Helper Contracts

## 10.1 `sdk.permissions.can(ctx, requirement)`

Purpose:

Returns whether a verified context has a permission.

Contract:

```ts
async function can(
  ctx: PlatformContext,
  requirement: PermissionRequirement
): Promise<boolean>
```

Rules:

- Must require a full `PlatformContext`.
- Must not accept loose `userId` or `orgId`.
- Must check only permissions loaded or fetched for `ctx.org.id`.
- Must support wildcard permissions.
- Must deny permissions with non-null `conditions` until ABAC exists.

Example:

```ts
const allowed = await sdk.permissions.can(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

Forbidden:

```ts
await sdk.permissions.can('user-1', 'create', 'inventory', 'org-1')
```

---

## 10.2 `sdk.permissions.require(ctx, requirement)`

Purpose:

Throws a structured error if the context lacks permission.

Contract:

```ts
async function require(
  ctx: PlatformContext,
  requirement: PermissionRequirement
): Promise<void>
```

Behavior:

```txt
Allowed → resolves
Denied → throws ApiError('FORBIDDEN', 403)
```

Example:

```ts
await sdk.permissions.require(ctx, {
  module: 'leave',
  resource: 'leave_request',
  action: 'approve',
})
```

---

## 10.3 `sdk.permissions.canAny(ctx, requirements)`

Purpose:

Returns true if the user has at least one permission in a list.

Contract:

```ts
async function canAny(
  ctx: PlatformContext,
  requirements: PermissionRequirement[]
): Promise<boolean>
```

Use cases:

- Showing a module page where multiple actions are possible.
- Showing navigation if user can read at least one resource in a module.

---

## 10.4 `sdk.permissions.requireAny(ctx, requirements)`

Purpose:

Throws unless at least one requirement is satisfied.

Contract:

```ts
async function requireAny(
  ctx: PlatformContext,
  requirements: PermissionRequirement[]
): Promise<void>
```

---

## 10.5 `sdk.permissions.canAll(ctx, requirements)`

Purpose:

Returns true only if all requirements are satisfied.

Contract:

```ts
async function canAll(
  ctx: PlatformContext,
  requirements: PermissionRequirement[]
): Promise<boolean>
```

---

## 10.6 `sdk.permissions.requireAll(ctx, requirements)`

Purpose:

Throws unless all requirements are satisfied.

Contract:

```ts
async function requireAll(
  ctx: PlatformContext,
  requirements: PermissionRequirement[]
): Promise<void>
```

Use sparingly. Most routes should require one permission.

---

# 11. Wildcard Permission Matching

Permissions use:

```txt
module.resource.action
```

In database form:

```txt
module
resource
action
```

The wildcard token is:

```txt
*
```

Examples:

| Permission | Meaning |
|---|---|
| `*.*.*` | Admin inside one verified organization |
| `inventory.*.*` | All inventory permissions |
| `inventory.product.*` | All product actions inside inventory |
| `inventory.product.read` | Read products only |
| `leave.leave_request.approve` | Approve leave requests |

Matching algorithm:

```ts
function matches(grant: PermissionGrant, required: PermissionRequirement) {
  if (grant.conditions !== null) return false

  const moduleMatches = grant.module === '*' || grant.module === required.module
  const resourceMatches = grant.resource === '*' || grant.resource === required.resource
  const actionMatches = grant.action === '*' || grant.action === required.action

  return moduleMatches && resourceMatches && actionMatches
}
```

Critical rule:

Wildcard permissions never bypass tenant isolation.

An Admin in Org A with `*.*.*` still has zero access to Org B.

---

# 12. Module Enablement Helper Contracts

## 12.1 `sdk.modules.isEnabled(ctx, moduleId)`

Purpose:

Returns whether a module is enabled for the context organization.

Contract:

```ts
async function isEnabled(ctx: PlatformContext, moduleId: string): Promise<boolean>
```

Rules:

- Must use `ctx.org.id`.
- Must not accept loose `orgId`.
- May use `ctx.enabledModules` if already loaded.

---

## 12.2 `sdk.modules.requireEnabled(ctx, moduleId)`

Purpose:

Throws if a module is disabled for the organization.

Contract:

```ts
async function requireEnabled(ctx: PlatformContext, moduleId: string): Promise<void>
```

Behavior:

```txt
Enabled → resolves
Disabled → throws ApiError('MODULE_DISABLED', 403)
```

Example:

```ts
await sdk.modules.requireEnabled(ctx, 'inventory')
```

---

# 13. API Route Usage Pattern

All protected API routes should use `sdk.api.handle()` plus context and permission helpers.

Example:

```ts
import { sdk } from '@/sdk/server'
import { CreateProductSchema } from '@/modules/inventory/schema'
import { ProductService } from '@/modules/inventory/service'

export const POST = sdk.api.handle(
  async (req, { params }) => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'create',
    })

    const body = await sdk.api.parseJson(req, CreateProductSchema)

    const data = await ProductService.create(ctx, body)

    return sdk.api.created(data)
  }
)
```

The route should live at:

```txt
src/app/api/orgs/[orgSlug]/inventory/products/route.ts
```

Not:

```txt
src/app/api/inventory/route.ts
```

And not:

```txt
/api/inventory?orgId=...
```

---

# 14. Page Usage Pattern

Organization pages should create context in the layout or page.

Example:

```tsx
import { sdk } from '@/sdk/server'
import { InventoryDashboard } from './inventory-dashboard'

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)

  await sdk.modules.requireEnabled(ctx, 'inventory')

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'dashboard',
    action: 'read',
  })

  return <InventoryDashboard ctx={sdk.auth.toClientContext(ctx)} />
}
```

Important:

Do not pass the full server `PlatformContext` to client components. Create a safe client context shape.

---

# 15. Client Context

The client may receive a reduced, non-sensitive context.

```ts
export type ClientPlatformContext = {
  user: {
    id: string
    name: string
    email: string
  }
  org: {
    slug: string
    name: string
  }
  permissions: Array<{
    module: string
    resource: string
    action: string
  }>
  enabledModules: string[]
}
```

Rules:

- Safe to use for UI hiding/showing only.
- Not authority for server operations.
- Must not include role IDs if not needed.
- Must not include internal subscription billing data unless UI needs it.
- Must not include service-role information, tokens, or auth provider internals.

---

# 16. Error Codes

Auth and permission helpers must throw or return errors compatible with the Kernel API contract.

| Code | HTTP | Meaning |
|---|---:|---|
| `UNAUTHENTICATED` | 401 | No valid auth session |
| `USER_NOT_FOUND` | 401 or 403 | Auth user has no platform user row |
| `USER_INACTIVE` | 403 | Platform user is inactive |
| `ORG_NOT_FOUND` | 404 | Org missing or inaccessible |
| `ORG_SUSPENDED` | 403 | Organization is suspended |
| `MODULE_DISABLED` | 403 | Module not enabled for org |
| `FORBIDDEN` | 403 | User lacks permission |
| `VALIDATION_ERROR` | 422 | Input failed validation |

Wrong-org access must use:

```txt
404 ORG_NOT_FOUND
```

not:

```txt
403 FORBIDDEN
```

because confirming that an organization exists can leak tenant information.

---

# 17. Suspended Organization Behavior

Suspended organizations are still real tenants.

Users may be allowed to authenticate, but module operations must be blocked.

Recommended behavior:

| Area | Behavior |
|---|---|
| Login | Allowed |
| Org shell | Allowed but restricted |
| Billing / support page | Allowed |
| Module APIs | Blocked with `ORG_SUSPENDED` |
| Module pages | Redirect to suspended/billing page |
| Background jobs | Paused unless operationally required |

This allows a suspended client to resolve billing or support without allowing normal system use.

---

# 18. First-User Admin Behavior

During registration, the first user in an organization should receive:

```txt
Role: Admin
Permission: *.*.*
```

Rules:

- Admin role is organization-scoped.
- Admin wildcard applies only inside the verified organization.
- Admin role must not grant cross-org access.
- Last-admin protection must prevent removing the final Admin from an organization.

This behavior is primarily defined in the Authentication and Users/Roles/Permissions documents, but SDK helpers must support it correctly.

---

# 19. Module Generator Requirements

Generated modules must use the SDK auth/permission helpers by default.

Generated API routes must include:

```txt
[ ] sdk.api.handle()
[ ] sdk.auth.requireApiModuleContext(req, orgSlug, moduleId)
[ ] sdk.permissions.require(ctx, requirement)
[ ] sdk.api.parseJson() for mutation payloads
[ ] service call with PlatformContext
[ ] no client-supplied orgId
[ ] tests for 401, 403, validation, and cross-tenant denial
```

Generated services must include:

```txt
[ ] PlatformContext parameter
[ ] sdk.getDb(ctx)
[ ] permission check for sensitive operations
[ ] tenant-scoped where clauses
[ ] soft delete for delete operations
[ ] event emission for mutations
```

Forbidden generated output:

```ts
const orgId = req.nextUrl.searchParams.get('orgId')
const orgId = body.orgId
sdk.getDb(orgId)
await sdk.auth.requirePageAuth()
await sdk.permissions.can(userId, requirement)
Service.list(orgId)
```

---

# 20. Testing Requirements

## 20.1 Auth helper tests

Required tests:

```txt
[ ] getSession returns null when unauthenticated
[ ] getSession returns Supabase user when authenticated
[ ] requirePageAuth redirects when unauthenticated
[ ] requireApiAuth throws 401 JSON-safe error when unauthenticated
[ ] requireApiAuth does not redirect
[ ] requireCurrentUser throws USER_NOT_FOUND for orphaned auth user
[ ] inactive user is denied
```

---

## 20.2 Organization context tests

Required tests:

```txt
[ ] Org A user can create context for Org A slug
[ ] Org A user cannot create context for Org B slug
[ ] wrong-org API access returns ORG_NOT_FOUND
[ ] missing org returns ORG_NOT_FOUND
[ ] inactive org/suspended org is blocked for module operations
[ ] client-supplied orgId is not read by context helper
```

---

## 20.3 Permission tests

Required tests:

```txt
[ ] exact permission grants access
[ ] wrong action denies access
[ ] wrong resource denies access
[ ] wrong module denies access
[ ] wildcard module grants access inside same org
[ ] wildcard resource grants access inside same org
[ ] wildcard action grants access inside same org
[ ] *.*.* grants admin access inside same org
[ ] *.*.* does not grant cross-org access
[ ] non-null conditions deny access in MVP
```

---

## 20.4 API route tests

Every protected API route must test:

```txt
[ ] unauthenticated request returns 401 JSON
[ ] authenticated wrong-org request returns 404 JSON
[ ] authenticated disabled-module request returns 403 JSON
[ ] authenticated no-permission request returns 403 JSON
[ ] invalid payload returns 422 JSON
[ ] valid request succeeds
[ ] client-supplied orgId is rejected
```

---

## 20.5 Service tests

Every sensitive module service must test:

```txt
[ ] accepts PlatformContext
[ ] rejects or cannot compile with loose orgId API
[ ] scopes query by ctx.org.id
[ ] enforces required permission or receives pre-authorized context by explicit contract
[ ] emits mutation event
[ ] uses soft-delete for delete behavior
```

---

# 21. Implementation Notes for Claude Code

Claude must implement this document narrowly.

Claude may create:

```txt
src/sdk/server/auth.ts
src/sdk/server/permissions.ts
src/sdk/server/modules.ts
src/sdk/server/context.ts
src/sdk/server/errors.ts
src/sdk/server/index.ts
src/sdk/shared/types.ts
src/sdk/shared/errors.ts
src/sdk/client/index.ts
```

Claude may modify:

```txt
src/sdk/server.ts or src/sdk/server/index.ts
src/app/api/... routes only if implementing tests/examples required by this document
```

Claude must not:

```txt
[ ] Add FastAPI
[ ] Add a second backend runtime
[ ] Build business modules
[ ] Build Platform Services
[ ] Build Dynamic Forms
[ ] Use client-supplied orgId
[ ] Use sdk.getDb(orgId)
[ ] Import Kernel internals from modules
[ ] Use redirect-style auth in API routes
[ ] Treat UI permission checks as security
```

---

# 22. Suggested File Structure

```txt
src/sdk/
  index.ts                    # shared-safe exports only
  server.ts                   # re-export from server/index.ts
  client.ts                   # browser-safe client SDK

  shared/
    types.ts
    errors.ts
    permissions.ts

  server/
    index.ts
    auth.ts
    context.ts
    permissions.ts
    modules.ts
    api.ts
    db.ts
    events.ts
    __tests__/
      auth.test.ts
      context.test.ts
      permissions.test.ts
      modules.test.ts

  client/
    index.ts
    api-client.ts
    current-user.ts
```

If the project prefers flatter files, Claude may simplify, but must preserve the import boundaries:

```txt
@/sdk          shared-safe only
@/sdk/server   server-only
@/sdk/client   browser-safe only
```

---

# 23. Acceptance Criteria

This document is implemented correctly when:

```txt
[ ] Modules can create authenticated, tenant-safe API routes using one standard pattern.
[ ] API auth returns JSON 401, never redirect HTML.
[ ] Wrong-org access returns safe 404.
[ ] Services receive PlatformContext, not loose orgId.
[ ] sdk.getDb(ctx) is the only module-safe DB access path.
[ ] sdk.permissions.can(ctx, requirement) works with exact and wildcard permissions.
[ ] sdk.permissions.require(ctx, requirement) throws structured 403 errors.
[ ] Module enablement is checked separately from user permission.
[ ] Client-supplied orgId is rejected in protected APIs.
[ ] Tests cover auth, org context, permissions, module enablement, and cross-tenant denial.
[ ] No module imports from @/kernel/*.
[ ] No FastAPI or second backend runtime is introduced.
```

---

# 24. Anti-Patterns

## 24.1 Auth-only APIs

Forbidden:

```ts
await sdk.auth.requireApiAuth(req)
return InventoryService.create(input)
```

Reason:

Auth alone does not prove tenant membership, module access, or permission.

---

## 24.2 Page auth in API routes

Forbidden:

```ts
await sdk.auth.requirePageAuth()
```

inside an API route.

Reason:

It can return redirects or HTML instead of JSON.

---

## 24.3 Loose tenant IDs

Forbidden:

```ts
sdk.getDb(orgId)
EmployeeService.list(orgId)
```

Reason:

The code does not prove where `orgId` came from.

---

## 24.4 Permission checks without module enablement

Forbidden:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

without first requiring or proving module enablement.

Reason:

A user permission should not unlock a disabled module.

---

## 24.5 UI-only permission checks

Forbidden:

```tsx
{canCreate && <CreateButton />}
```

as the only permission control.

Reason:

Users can still call APIs directly.

---

# 25. Future Considerations

## 25.1 ABAC conditions

The permission schema allows `conditions`, but MVP does not evaluate them.

Do not implement conditional permissions until there is a clear need and a separate manual document.

Possible future examples:

```json
{ "scope": "own_branch" }
{ "maxAmount": 50000 }
{ "departmentOnly": true }
```

Until then:

```txt
conditions !== null means deny.
```

---

## 25.2 Multi-org users

MVP assumes one user belongs to one organization.

Future multi-org support may require:

```txt
OrganizationMembership
User current active org
Org switcher
Per-org roles
Per-org permissions
```

Do not implement this in the restarted MVP without an ADR.

---

## 25.3 Internal OneDayOS support access

OneDayOS staff may eventually need support access to client organizations.

Do not fake this by giving staff cross-org user records in MVP.

Future support access requires its own model:

```txt
SupportAccessGrant
Reason
Expiration
Audit trail
Client approval optional
```

---

## 25.4 RLS

PostgreSQL Row Level Security remains a future defense-in-depth layer.

Application-level tenant isolation through `PlatformContext` is mandatory now.

RLS should not be used as an excuse to weaken SDK context rules.

---

# 26. Final Architectural Position

The SDK auth and permissions layer is the safety rail that prevents OneDayOS from becoming a collection of insecure admin pages.

Every protected operation must answer four questions before touching data:

```txt
Who is the user?
Which organization are they verified to belong to?
Is the module enabled for that organization?
Are they permitted to perform this action?
```

Only after those are answered should code call:

```ts
sdk.getDb(ctx)
```

This is the foundation that allows OneDayOS to safely support 10 clients, then 100 clients, then hundreds of clients, from one shared platform.
