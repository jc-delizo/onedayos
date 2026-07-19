# OneDayOS Engineering Manual  
# 04 Kernel / 04 Authorization Enforcement

**Document ID:** `04-kernel/04-authorization-enforcement.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Owner:** OneDayOS Founder  
**Last Updated:** July 2026  
**Implementation Allowed:** No — freeze required before Claude implementation  
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

**Supersedes / Clarifies:**

- The old MVP pattern where `sdk.permissions.can()` existed but was not enforced.
- The old MVP pattern where API routes used redirect-style `requireAuth()`.
- The old MVP pattern where authenticated users could load another organization route.
- The old MVP pattern where generated APIs could rely on client-supplied `orgId`.
- Any authorization examples using nullable `Permission.resource`. The approved new model uses non-null `resource` with `'*'` as wildcard.

---

# 1. Purpose

This document defines how authorization is enforced in OneDayOS.

The previous MVP implementation proved an important lesson:

> A permission system that exists but is not enforced is not a permission system.

The restarted platform must build authorization into the Kernel from day one. Authorization must not be added after modules exist. Authorization must not depend on developers remembering to copy a pattern. Authorization must be easy enough that Claude Code generates secure code by default.

This document answers:

- When is authentication required?
- When is tenant membership required?
- When is module enablement required?
- When is a permission check required?
- What is the difference between page authorization, API authorization, service authorization, and UI visibility?
- What should happen when authorization fails?
- What must generated modules include?
- What tests prove authorization is actually enforced?

This document is about **runtime enforcement**, not just schema.

---

# 2. Core Decision

Authorization in OneDayOS requires all four gates to pass:

```txt
1. Authentication
   Is there a valid Supabase Auth session?

2. Tenant membership
   Does the authenticated OneDayOS User belong to the target Organization?

3. Module enablement
   Is the target module enabled for the Organization?

4. Permission
   Does the User have a Role with a matching Permission?
```

The canonical access-control chain is:

```txt
Supabase Auth session
  ↓
OneDayOS User record
  ↓
Verified PlatformContext
  ↓
Organization membership check
  ↓
Organization/user active check
  ↓
Module enablement check
  ↓
Permission requirement check
  ↓
Service method using ctx
  ↓
Tenant-scoped database query
```

No business module may bypass this chain.

---

# 3. Non-Goals

This document does **not** define:

- Supabase Auth setup.
- Registration flow.
- Login UI.
- Organization schema.
- Role and Permission schema details beyond enforcement implications.
- Dynamic role management UI.
- Row Level Security.
- Field-level permissions.
- Attribute-Based Access Control.
- Approval workflows.
- Internal OneDayOS operator impersonation.
- Audit Log Platform Service.
- Dynamic Form Engine permission metadata.

Those are separate documents or future phases.

---

# 4. Foundational Rules

## 4.1 Deny by default

The default access decision is always:

```txt
DENY
```

A request is allowed only when the Kernel can prove the user is authenticated, belongs to the target organization, the organization is active, the user is active, the module is enabled when applicable, and the permission requirement is satisfied.

No route, API, service, or UI action should be accessible merely because the user is logged in.

Authentication answers:

```txt
Who are you?
```

Authorization answers:

```txt
Are you allowed to do this here?
```

Those are different questions.

---

## 4.2 Tenant membership comes before permissions

A permission check is meaningless until tenant membership has already been verified.

Bad:

```ts
await sdk.permissions.can(userId, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
  orgId,
})
```

This is unsafe because `userId` and `orgId` may not have been verified together.

Good:

```ts
const ctx = await sdk.context.requireApiOrgContext(request, { orgSlug })

await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

The `PlatformContext` proves the user and organization belong together.

---

## 4.3 Never trust client-supplied `orgId`

Client-supplied `orgId` is forbidden for tenant-scoped reads and writes.

Forbidden:

```ts
const orgId = body.orgId
```

Forbidden:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

Forbidden:

```ts
CreateInventorySchema = z.object({
  orgId: z.string(),
  name: z.string(),
})
```

Required:

```ts
const ctx = await sdk.context.requireApiOrgContext(request, { orgSlug })
const orgId = ctx.orgId
```

Client forms may submit business fields.

Client forms may not submit tenant identity.

---

## 4.4 Services receive `PlatformContext`, not loose IDs

Business services must not accept loose `orgId` strings as authority.

Bad:

```ts
InventoryService.createProduct(orgId, input)
```

Good:

```ts
InventoryService.createProduct(ctx, input)
```

Where `ctx` is a verified `PlatformContext` created by the Kernel.

This pattern intentionally makes unsafe service calls harder to write.

---

## 4.5 UI checks are usability, not security

UI checks may hide buttons, links, and pages.

But UI checks do not protect the system.

This is useful:

```tsx
{permissions.canCreateProduct && <CreateProductButton />}
```

But this is mandatory:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'create',
})
```

Every sensitive operation must be enforced server-side.

---

## 4.6 API routes never redirect for auth failures

Page routes may redirect unauthenticated users to login.

API routes must return JSON.

Bad inside API route:

```ts
await sdk.auth.requireAuth()
```

if that helper redirects.

Required inside API route:

```ts
const ctx = await sdk.context.requireApiOrgContext(request, { orgSlug })
```

or another API-safe helper that returns structured JSON errors.

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
401
```

---

## 4.7 Module enablement is not permission

An organization may have the Inventory module enabled.

That does not mean every user in the organization can use Inventory.

A user must pass both gates:

```txt
module enabled for org
+ user has required permission
```

Likewise, a user may have `inventory.product.read`, but if Inventory is disabled for the organization, access is still denied.

---

## 4.8 Wildcard permissions never bypass tenant isolation

Admin may have:

```txt
module='*'
resource='*'
action='*'
```

That grants broad power **inside the verified organization only**.

It does not allow access to another organization.

Tenant isolation is evaluated before wildcard permission matching.

---

# 5. Required Runtime Concepts

## 5.1 `PlatformContext`

`PlatformContext` is the trusted context object passed into services.

It proves:

- the Supabase user is authenticated
- the OneDayOS User row exists
- the Organization exists
- the User belongs to the Organization
- the Organization is active
- the User is active
- the current request is operating inside one tenant boundary

Recommended type:

```ts
export type PlatformContext = {
  authUserId: string
  userId: string
  orgId: string
  orgSlug: string

  user: {
    id: string
    name: string
    email: string
    isActive: boolean
  }

  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
  }

  source: 'page' | 'api' | 'service'
  requestId?: string
}
```

Modules may read `ctx.orgId`.

Modules may not construct `PlatformContext` manually.

Only Kernel context helpers may create it.

---

## 5.2 Context helpers

The SDK should expose a context namespace:

```ts
sdk.context.requirePageOrgContext(params)
sdk.context.requireApiOrgContext(request, params)
sdk.context.getOptionalApiOrgContext(request, params)
```

Minimum usage:

```ts
const ctx = await sdk.context.requireApiOrgContext(request, {
  orgSlug: params.orgSlug,
})
```

The exact internal file location may be Kernel-owned, but modules and generated code must consume the stable SDK surface.

---

## 5.3 Context resolution algorithm

`requirePageOrgContext` and `requireApiOrgContext` must perform this sequence:

```txt
1. Read the Supabase Auth user from the current request/session.
2. If no auth user exists, fail.
3. Load the OneDayOS User using authUser.id.
4. If no User row exists, fail.
5. Verify user.isActive is true.
6. Load Organization by orgSlug.
7. If no Organization exists, fail.
8. Verify organization.isActive is true.
9. Verify user.orgId === organization.id.
10. Return PlatformContext.
```

Do not check permissions before step 9.

---

# 6. Permission Requirement Shape

The approved RBAC model uses non-null `resource`.

The SDK should represent permission requirements as:

```ts
export type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Examples:

```ts
{
  module: 'inventory',
  resource: 'product',
  action: 'read',
}
```

```ts
{
  module: 'kernel',
  resource: 'users',
  action: 'manage',
}
```

```ts
{
  module: '*',
  resource: '*',
  action: '*',
}
```

Do not use nullable resources.

Use `'*'` to mean all resources.

---

# 7. Permission Matching Rules

A permission grant matches a requirement when all three dimensions match.

```ts
function matchesPermission(grant, required) {
  return matches(grant.module, required.module)
    && matches(grant.resource, required.resource)
    && matches(grant.action, required.action)
}

function matches(grantValue, requiredValue) {
  return grantValue === '*' || grantValue === requiredValue
}
```

Examples:

| Grant | Requirement | Result |
|---|---|---:|
| `inventory.product.read` | `inventory.product.read` | allow |
| `inventory.*.read` | `inventory.product.read` | allow |
| `inventory.product.*` | `inventory.product.delete` | allow |
| `*.*.*` | `inventory.product.delete` | allow inside same org |
| `inventory.product.read` | `inventory.product.create` | deny |
| `crm.product.read` | `inventory.product.read` | deny |
| `inventory.customer.read` | `inventory.product.read` | deny |

Human-readable permission strings may be written as:

```txt
{module}.{resource}.{action}
```

But the database stores separate columns:

```txt
module
resource
action
```

---

# 8. No Implicit Action Hierarchy In MVP

For MVP, actions do not imply other actions.

This grant:

```txt
inventory.product.manage
```

must not automatically imply:

```txt
inventory.product.create
inventory.product.read
inventory.product.update
inventory.product.delete
```

unless the evaluator explicitly implements and tests action hierarchy.

MVP rule:

```txt
Only exact action match or '*' grants access.
```

If a role should have broad access, grant `'*'` for the action:

```txt
inventory.product.*
```

This avoids invisible semantics that Claude or future engineers may misunderstand.

---

# 9. Conditions / ABAC Rule

The `Permission.conditions` column is reserved for future Attribute-Based Access Control.

Example future conditions:

```json
{ "scope": "own_branch" }
```

```json
{ "maxAmount": 50000 }
```

```json
{ "scope": "own_records" }
```

For MVP:

```txt
conditions must be null
```

If a permission grant has non-null `conditions` and there is no approved condition evaluator, the permission must be treated as **not matching**.

Safe default:

```txt
unsupported conditions = deny
```

Do not build a partial ABAC evaluator casually.

ABAC requires its own manual document when enough real use cases exist.

---

# 10. SDK Permission API

## 10.1 Required SDK surface

The SDK must expose:

```ts
sdk.permissions.can(ctx, requirement)
sdk.permissions.require(ctx, requirement)
sdk.permissions.canAny(ctx, requirements)
sdk.permissions.canAll(ctx, requirements)
sdk.permissions.listForUser(ctx)
sdk.permissions.ACTIONS
sdk.permissions.MODULES
sdk.permissions.RESOURCES
```

Where `requirement` is:

```ts
type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

---

## 10.2 `can()`

`can()` returns a boolean.

```ts
const allowed = await sdk.permissions.can(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

Use `can()` for:

- navigation visibility
- button visibility
- conditional UI
- showing disabled states
- non-mutating preflight checks

`can()` must not be the only protection on mutations.

---

## 10.3 `require()`

`require()` enforces a permission and fails with a structured authorization error.

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

Use `require()` for:

- API reads of tenant data
- API mutations
- service methods
- server actions
- exports
- imports
- admin settings
- module enable/disable operations
- role management
- user management

---

## 10.4 `canAny()` and `canAll()`

`canAny()` returns true when at least one requirement passes.

`canAll()` returns true only when every requirement passes.

Example:

```ts
const canSeeInventory = await sdk.permissions.canAny(ctx, [
  { module: 'inventory', resource: 'product', action: 'read' },
  { module: 'inventory', resource: 'stock_level', action: 'read' },
])
```

---

# 11. Permission Evaluation Algorithm

The evaluator must execute in this order:

```txt
1. Validate that ctx exists.
2. Validate ctx.user.isActive.
3. Validate ctx.org.isActive.
4. Load UserRole rows where:
   - orgId = ctx.orgId
   - userId = ctx.userId
5. Load Roles for those UserRole rows where:
   - role.orgId = ctx.orgId
6. Load Permission rows where:
   - permission.orgId = ctx.orgId
   - permission.roleId is in the user's role IDs
7. Ignore any Permission with non-null conditions unless an approved evaluator exists.
8. Match module using exact or '*'.
9. Match resource using exact or '*'.
10. Match action using exact or '*'.
11. If at least one Permission matches, allow.
12. Otherwise deny.
```

Important query principle:

```txt
Access-control queries must include orgId directly.
```

Bad:

```ts
const roles = await prisma.userRole.findMany({
  where: { userId: ctx.userId },
})
```

Good:

```ts
const roles = await prisma.userRole.findMany({
  where: {
    orgId: ctx.orgId,
    userId: ctx.userId,
  },
  include: {
    role: {
      include: {
        permissions: true,
      },
    },
  },
})
```

Better implementation may optimize the query, but it must preserve tenant scoping.

---

# 12. Module Enablement Guard

Permissions and module enablement are separate.

The SDK must expose:

```ts
sdk.modules.isEnabled(ctx, moduleId)
sdk.modules.requireEnabled(ctx, moduleId)
```

Usage:

```ts
await sdk.modules.requireEnabled(ctx, 'inventory')

await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

Kernel namespaces do not require module enablement.

Examples that do not require `OrgModule` enablement:

```txt
kernel.users.read
kernel.roles.manage
kernel.settings.update
```

Module namespaces do require enablement:

```txt
inventory.product.read
crm.customer.read
leave.leave_request.create
```

Module enablement never grants permission by itself.

---

# 13. Page Authorization

## 13.1 Page rules

Every tenant-scoped page must:

```txt
1. Resolve PlatformContext using orgSlug.
2. Check module enablement if page belongs to a module.
3. Check page-level read/manage permission.
4. Fetch tenant-scoped data using ctx.
5. Render only after checks pass.
```

Example:

```ts
export default async function InventoryProductsPage({ params }) {
  const { orgSlug } = await params

  const ctx = await sdk.context.requirePageOrgContext({ orgSlug })

  await sdk.modules.requireEnabled(ctx, 'inventory')

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'product',
    action: 'read',
  })

  const products = await InventoryService.listProducts(ctx)

  return <InventoryProductsClient products={products} />
}
```

---

## 13.2 Page failure behavior

| Failure | Page Behavior |
|---|---|
| Unauthenticated | Redirect to `/login`. |
| Platform user missing | Redirect to login or render account setup error. |
| Organization does not exist | `notFound()`. |
| User does not belong to organization | `notFound()` by default. |
| Organization inactive/suspended | Render suspended organization screen. |
| Module disabled | Render module unavailable screen or `notFound()`. |
| Permission denied | Render access-denied screen. |

For guessed organization slugs, prefer `notFound()` to avoid confirming whether another customer exists.

---

# 14. API Authorization

## 14.1 API route shape

Tenant-scoped APIs should use org-scoped paths:

```txt
/api/orgs/[orgSlug]/inventory/products
/api/orgs/[orgSlug]/employees
/api/orgs/[orgSlug]/settings
```

Avoid:

```txt
/api/inventory?orgId=...
/api/products?orgId=...
```

The URL may include `orgSlug` because the server verifies membership.

The client must not send `orgId`.

---

## 14.2 API route rules

Every tenant-scoped API route must:

```txt
1. Resolve API PlatformContext.
2. Check module enablement if route belongs to a module.
3. Parse and validate input with Zod.
4. Check permission.
5. Call service with PlatformContext.
6. Return { data, error } JSON.
```

API routes must not call redirect-based page auth helpers.

---

## 14.3 API response contract

All API responses must use:

```ts
type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }

type ApiError = {
  code: string
  message: string
  details?: unknown
}
```

---

## 14.4 API error codes

| Code | HTTP Status | Meaning |
|---|---:|---|
| `UNAUTHENTICATED` | 401 | No valid auth session. |
| `PLATFORM_USER_NOT_FOUND` | 401 | Auth user has no platform User row. |
| `ORG_NOT_FOUND_OR_FORBIDDEN` | 404 | Org does not exist or user must not know it exists. |
| `USER_INACTIVE` | 403 | User is disabled. |
| `ORG_INACTIVE` | 403 | Organization is suspended/inactive. |
| `MODULE_DISABLED` | 403 | Module is not enabled for this organization. |
| `FORBIDDEN` | 403 | Permission denied. |
| `VALIDATION_ERROR` | 400 | Invalid request body/query. |
| `NOT_FOUND` | 404 | Entity not found within allowed tenant scope. |
| `CONFLICT` | 409 | Duplicate or invalid state transition. |
| `INTERNAL_ERROR` | 500 | Unexpected server error. |

For tenant mismatch, prefer `ORG_NOT_FOUND_OR_FORBIDDEN` with `404`.

For permission denial inside the user's own organization, use `FORBIDDEN` with `403`.

---

## 14.5 API example: list products

```ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  return sdk.api.handle(async () => {
    const { orgSlug } = await params

    const ctx = await sdk.context.requireApiOrgContext(request, { orgSlug })

    await sdk.modules.requireEnabled(ctx, 'inventory')

    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'read',
    })

    const data = await InventoryService.listProducts(ctx)

    return sdk.api.ok(data)
  })
}
```

---

## 14.6 API example: create stock adjustment

```ts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  return sdk.api.handle(async () => {
    const { orgSlug } = await params

    const ctx = await sdk.context.requireApiOrgContext(request, { orgSlug })

    await sdk.modules.requireEnabled(ctx, 'inventory')

    const body = await request.json()
    const input = CreateStockAdjustmentSchema.parse(body)

    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    })

    const data = await InventoryService.createStockAdjustment(ctx, input)

    return sdk.api.created(data)
  })
}
```

Notice:

```txt
No orgId in body.
No redirect helper.
No raw prisma import.
Service receives ctx.
```

---

# 15. Service Authorization

## 15.1 Service rules

Public service methods must:

```txt
accept PlatformContext
never accept orgId as authority
check required permissions for mutations and sensitive reads
always scope queries by ctx.orgId
emit events only after successful authorized mutation
return no data outside ctx.orgId
```

Recommended standard:

> Services performing business mutations must call `sdk.permissions.require()` internally even if the API route already checked permission.

This is deliberate defense in depth.

A forgotten API check should not automatically become a data breach.

---

## 15.2 Public service method pattern

Good:

```ts
class InventoryService {
  static async listProducts(ctx: PlatformContext) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'read',
    })

    return sdk.getDb(ctx).product.findMany({
      where: { orgId: ctx.orgId },
    })
  }

  static async createStockAdjustment(ctx: PlatformContext, input: CreateStockAdjustmentInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    })

    const record = await sdk.getDb(ctx).stockAdjustment.create({
      data: {
        ...input,
        orgId: ctx.orgId,
        createdBy: ctx.userId,
      },
    })

    await sdk.events.emit('inventory.stock_adjustment.created', {
      orgId: ctx.orgId,
      actorId: ctx.userId,
      entityId: record.id,
    })

    return record
  }
}
```

Bad:

```ts
class InventoryService {
  static async listProducts(orgId: string) {}
  static async createStockAdjustment(input: CreateStockAdjustmentInput & { orgId: string }) {}
}
```

---

## 15.3 Internal unsafe helpers

If a service needs an internal helper that does not perform permission checks, it must remain private or clearly mark the bypass.

Acceptable:

```ts
private static async unsafeCreateMovementWithoutPermissionCheck(...) {}
```

The word `unsafe` is intentional.

It makes authorization bypasses visible during review.

Do not export unsafe helpers from modules.

---

## 15.4 Tenant-scoped update/delete pattern

Tenant-scoped updates and deletes must prove the record belongs to `ctx.orgId`.

Good pattern:

```ts
const existing = await db.stockAdjustment.findFirst({
  where: {
    id,
    orgId: ctx.orgId,
  },
})

if (!existing) throw new NotFoundError()

const updated = await db.stockAdjustment.update({
  where: { id: existing.id },
  data,
})
```

Alternative when Prisma supports scoped extended unique filters:

```ts
await db.stockAdjustment.update({
  where: {
    id,
    orgId: ctx.orgId,
  },
  data,
})
```

Bad:

```ts
await db.stockAdjustment.update({
  where: { id },
  data,
})
```

because it does not prove tenant membership at the query boundary.

---

# 16. UI Authorization

## 16.1 UI rules

UI should be permission-aware.

Use UI checks to:

- hide unavailable navigation
- hide unavailable action buttons
- disable unavailable controls
- show useful access-denied states
- reduce user confusion

Do not use UI checks as the only authorization layer.

---

## 16.2 Permission flags passed to client components

Server components should compute permission flags and pass only what the client needs.

Example:

```ts
const permissions = {
  canCreateProduct: await sdk.permissions.can(ctx, {
    module: 'inventory',
    resource: 'product',
    action: 'create',
  }),
  canDeleteProduct: await sdk.permissions.can(ctx, {
    module: 'inventory',
    resource: 'product',
    action: 'delete',
  }),
}

return <ProductsClient products={products} permissions={permissions} />
```

Avoid sending the entire permission table to the browser unless a specific admin UI requires it.

---

## 16.3 Client actions still call protected APIs

Client components may conditionally render:

```tsx
{permissions.canDeleteProduct && <DeleteButton />}
```

But the API must still enforce:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'delete',
})
```

---

# 17. Navigation Authorization

Navigation must be both module-aware and permission-aware.

A navigation item appears only when:

```txt
1. its module is enabled for the organization
2. the route exists
3. the user has the nav item's required permission
```

Recommended module manifest navigation shape:

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

The earlier manifest shape with only action strings like:

```ts
permissions: ['create', 'read', 'update', 'delete']
```

is too weak for long-term resource-level authorization.

For the restarted platform, module manifests should use explicit permission descriptors.

---

# 18. Kernel Route Permissions

Kernel routes require permissions too.

Examples:

| Capability | Permission |
|---|---|
| View dashboard | `kernel.dashboard.read` |
| View users | `kernel.users.read` |
| Manage users | `kernel.users.manage` |
| View roles | `kernel.roles.read` |
| Manage roles | `kernel.roles.manage` |
| View settings | `kernel.settings.read` |
| Update settings | `kernel.settings.update` |
| View enabled modules | `kernel.modules.read` |
| Enable/disable modules | `kernel.modules.manage` |
| View subscription | `kernel.subscription.read` |

In object form:

```ts
{
  module: 'kernel',
  resource: 'roles',
  action: 'manage',
}
```

Kernel pages must not be auth-only.

---

# 19. Business Object Authorization

Business Objects are shared entities.

Authorization depends on the route and use case.

Examples:

| Use Case | Suggested Permission |
|---|---|
| View Products inside Inventory | `inventory.product.read` |
| Create Product inside Inventory | `inventory.product.create` |
| View Customers inside CRM | `crm.customer.read` |
| View Suppliers inside Purchasing | `purchasing.supplier.read` |
| View Employees in Kernel people admin | `kernel.employees.read` |
| Manage Employees in Kernel people admin | `kernel.employees.manage` |

This allows one module to use a shared object without granting global administrative power over that object.

The Business Objects manual may later introduce a dedicated namespace such as `objects.product.read`, but this Authorization Enforcement document does not require that namespace for MVP.

---

# 20. Super Admin and AppCare Access

OneDayOS will eventually need internal support access for AppCare.

Do not build unrestricted super-admin impersonation into MVP.

Two possible models exist:

## Option A — Tenant-scoped support user

OneDayOS support staff are added as users inside the client organization with explicit roles.

Pros:

- simple
- uses existing RBAC
- auditable through normal user actions
- no special bypass path

Cons:

- support staff may appear in client user lists
- requires per-client access setup

## Option B — Separate operator context

OneDayOS staff have a separate operator identity and explicitly assume support access.

Pros:

- cleaner long-term support tooling
- stronger audit trail
- better separation between customer users and OneDayOS operators

Cons:

- more complex
- requires audit logs and operator controls
- creates a powerful access path too early

## MVP Decision

Use Option A.

If support access is needed in v1, create a tenant-scoped support user with explicit permissions.

Do not build operator impersonation until the Security and AppCare Operations manuals require it.

---

# 21. Seeded Role Enforcement

Each new organization should start with:

```txt
Admin
Staff
```

## 21.1 Admin

Admin receives:

```txt
module='*'
resource='*'
action='*'
conditions=null
```

Admin can do everything inside their own organization.

Admin cannot access another organization.

Admin wildcard does not override:

- authentication
- tenant membership
- active user check
- active organization check
- module enablement when module enablement is required

---

## 21.2 Staff

Staff should be conservative by default.

A safe MVP Staff role may have only:

```txt
kernel.dashboard.read
kernel.profile.read
kernel.profile.update
```

Do not grant business module permissions to Staff unless onboarding configuration explicitly chooses them.

---

# 22. Forbidden Patterns

The following patterns are forbidden.

## 22.1 Client-supplied tenant identity

```ts
const orgId = body.orgId
```

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

```ts
schema = z.object({ orgId: z.string() })
```

---

## 22.2 API redirect auth helper

```ts
await sdk.auth.requireAuth()
```

inside API routes if that helper redirects.

---

## 22.3 Auth-only API protection

```ts
await requireAuth()
const data = await InventoryService.create(input)
```

Missing:

- org context
- module enablement
- permission check
- service context

---

## 22.4 Loose service tenant authority

```ts
InventoryService.list(orgId)
```

```ts
InventoryService.create({ ...input, orgId })
```

---

## 22.5 Direct Kernel imports inside modules

```ts
import { prisma } from '@/kernel/db/client'
```

Modules must use:

```ts
import { sdk } from '@/sdk'
```

---

## 22.6 Permission check without PlatformContext

```ts
await can(userId, 'read', 'inventory', orgId)
```

Use:

```ts
await sdk.permissions.can(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

---

## 22.7 Unscoped tenant queries

```ts
await db.product.findMany()
```

```ts
await db.product.update({
  where: { id },
  data,
})
```

Required:

```ts
await db.product.findMany({
  where: { orgId: ctx.orgId },
})
```

or an equivalent tenant-scoped pattern.

---

# 23. Required Generator Behavior

The module generator must generate secure code by default.

Generated API routes must include:

```txt
requireApiOrgContext
requireEnabled for module APIs
Zod validation
permissions.require
service call with ctx
structured JSON response
401/403/404 tests
cross-tenant tests
```

Generated service methods must include:

```txt
PlatformContext parameter
permission requirement
ctx.orgId query scoping
event emission for mutations
soft-delete for delete operations
```

Generated pages must include:

```txt
requirePageOrgContext
requireEnabled for module pages
permissions.require for page read
permission flags passed to client components
```

Generated client components must not:

```txt
submit orgId
read orgId from URL query
call unscoped APIs
assume hidden buttons are security
```

A generator that creates insecure code is worse than no generator.

---

# 24. Required Tests

Authorization is not done until tests prove enforcement.

## 24.1 Permission engine unit tests

Required tests:

```txt
no roles returns false
exact module/resource/action grants access
module wildcard grants access
resource wildcard grants access
action wildcard grants access
*.*.* grants access inside same org
wrong module denies access
wrong resource denies access
wrong action denies access
role from another org denies access
permission from another org denies access
inactive user denies access
inactive org denies access
non-null unsupported conditions deny access
```

---

## 24.2 API auth tests

Required tests:

```txt
unauthenticated API request returns 401 JSON
API auth failure does not redirect
missing platform user returns structured error
inactive user returns 403 JSON
inactive org returns 403 JSON
```

---

## 24.3 Tenant isolation tests

Required tests:

```txt
User from Org A cannot access Org B page
User from Org A cannot read Org B API data
User from Org A cannot mutate Org B API data
Admin wildcard in Org A cannot access Org B
Client-supplied orgId is rejected
Route orgSlug must match user's org
```

---

## 24.4 Permission denial tests

Required tests:

```txt
authenticated user without permission gets 403
read permission does not allow create
create permission does not allow delete
module permission does not apply to another module
resource-specific permission does not apply to another resource
```

---

## 24.5 Service tests

Required tests:

```txt
service requires PlatformContext
service denies missing permission
service scopes list by ctx.orgId
service scopes update/delete by ctx.orgId
service never uses input.orgId
mutation emits event after successful DB write
mutation does not emit event after failed DB write
mutation does not emit event after permission denial
```

---

## 24.6 Generator tests

Generated module code must be tested for forbidden patterns.

At minimum, add static tests that fail if generated files contain:

```txt
searchParams.get('orgId')
body.orgId
orgId: z.string()
from '@/kernel/db/client'
requireAuth() inside app/api
Service.create(input) without ctx
```

---

# 25. Static Enforcement

Authorization rules should be enforced with tests and linting where possible.

Recommended static checks:

```txt
No module imports from @/kernel/*
No app/api route uses redirect-based requireAuth
No generated API route reads orgId from query string
No generated schema includes orgId for create/update inputs
No public service method accepts orgId as first parameter
No direct Prisma import inside modules
No permission requirement omits resource
```

Acceptable first implementation tools:

- Vitest static tests
- simple grep-based CI checks
- ESLint restricted imports
- dependency-cruiser later

Do not wait for perfect tooling.

Simple static tests are enough to block the most dangerous regressions early.

---

# 26. Relationship To Row Level Security

PostgreSQL Row Level Security is future defense in depth.

RLS does not replace application-level authorization.

For v1:

```txt
application-level tenant isolation is mandatory
application-level permission enforcement is mandatory
RLS may be deferred
```

When RLS is introduced, it should reduce blast radius from developer mistakes.

It must not be the first or only line of defense.

---

# 27. Relationship To Soft Delete

Authorization and soft delete are separate.

A user with read permission should not automatically see soft-deleted records.

Viewing deleted records should require a separate permission.

Recommended examples:

```txt
inventory.product.restore
inventory.stock_adjustment.restore
kernel.employees.restore
```

For v1, avoid exposing deleted-record UI unless restore workflows are intentionally implemented.

---

# 28. Relationship To Events

Events do not grant permissions.

Events must only be emitted after:

```txt
authorization succeeds
validation succeeds
database mutation succeeds
```

Bad:

```ts
await sdk.events.emit('inventory.stock_adjustment.created', payload)
await db.stockAdjustment.create(...)
```

Good:

```ts
const record = await db.stockAdjustment.create(...)

await sdk.events.emit('inventory.stock_adjustment.created', {
  orgId: ctx.orgId,
  actorId: ctx.userId,
  entityId: record.id,
})
```

Event payloads for tenant-scoped mutations should include:

```txt
orgId
actorId
entityId
event-specific payload
```

Event subscribers that expose data must enforce their own authorization rules.

---

# 29. Restarted Build Requirements

Because OneDayOS is restarting development from scratch, the new Kernel must not recreate the old MVP security gaps.

The initial Kernel implementation must include:

```txt
PlatformContext type
page-safe org context helper
API-safe org context helper
API response/error helpers
module enablement guard
permission engine
permissions.can(ctx, requirement)
permissions.require(ctx, requirement)
service context pattern
secure module generator templates
security regression tests
static forbidden-pattern tests
```

The following are not acceptable as “patch later” items:

```txt
API routes using auth-only protection
any authenticated user loading any org route
permission system existing but unused
API routes redirecting instead of returning JSON
module generator creating orgId query/body patterns
services accepting loose orgId as authority
nullable Permission.resource
```

---

# 30. Minimal Implementation Order

Claude should implement authorization in this order:

```txt
1. Define ApiError and ApiResponse helpers.
2. Add API-safe auth helper.
3. Add PlatformContext type.
4. Add page org context resolver.
5. Add API org context resolver.
6. Add permission requirement type.
7. Add permission constants.
8. Implement permission matching with module/resource/action wildcards.
9. Implement permissions.can(ctx, requirement).
10. Implement permissions.require(ctx, requirement).
11. Implement module enablement guard.
12. Update Kernel pages and APIs to use context + permissions.
13. Update module generator templates.
14. Add permission engine tests.
15. Add API auth tests.
16. Add tenant isolation tests.
17. Add permission denial tests.
18. Add static forbidden-pattern tests.
```

Do not generate or implement business modules before step 18 passes.

---

# 31. Claude Implementation Prompt

Use this prompt when asking Claude to implement this subsystem:

```md
You are implementing OneDayOS Kernel Authorization Enforcement.

Authoritative documents:
- docs/engineering-manual/01-foundation/00-vision.md
- docs/engineering-manual/02-architecture/00-system-architecture.md
- docs/engineering-manual/02-architecture/01-layer-boundaries.md
- docs/engineering-manual/13-security/08-production-readiness-gate.md
- docs/engineering-manual/13-security/09-security-stabilization-new-build-spec.md
- docs/engineering-manual/04-kernel/00-kernel-overview.md
- docs/engineering-manual/04-kernel/01-authentication.md
- docs/engineering-manual/04-kernel/02-organizations-tenancy.md
- docs/engineering-manual/04-kernel/03-users-roles-permissions.md
- docs/engineering-manual/04-kernel/04-authorization-enforcement.md

Rules:
- Do not invent architecture.
- Implement only the authorization enforcement subsystem.
- API routes must not use redirect-based auth helpers.
- API routes must return { data, error } JSON.
- Never trust client-supplied orgId.
- Use verified PlatformContext everywhere tenant authority is needed.
- Modules must not import from @/kernel/*.
- Services must receive PlatformContext, not loose orgId strings.
- Permission requirements must include module, resource, and action.
- Permission.resource is non-null and uses '*' as wildcard.
- Permission checks must be enforced in APIs and services.
- Add tests for unauthenticated, forbidden, cross-tenant, and generated-module cases.
- Stop and report if any manual requirement conflicts with existing code.

Task:
Implement the authorization enforcement system exactly as specified.
```

---

# 32. Definition of Done

This subsystem is done only when all of the following are true:

```txt
[ ] API-safe auth helper exists
[ ] Page-safe org context helper exists
[ ] API-safe org context helper exists
[ ] PlatformContext type exists and is exported through SDK
[ ] permissions.can(ctx, requirement) exists
[ ] permissions.require(ctx, requirement) exists
[ ] permission requirements require module/resource/action
[ ] resource wildcard uses '*', not null
[ ] module enablement guard exists
[ ] API routes return JSON 401/403 instead of redirects
[ ] org membership is checked before tenant pages render
[ ] user.orgId === org.id is enforced
[ ] client-supplied orgId is rejected
[ ] services receive PlatformContext
[ ] services scope queries by ctx.orgId
[ ] permission checks are enforced in API routes
[ ] permission checks are enforced in service methods
[ ] generated module templates include authorization checks
[ ] generated module templates do not include orgId input
[ ] cross-tenant read tests pass
[ ] cross-tenant write tests pass
[ ] permission denial tests pass
[ ] unauthenticated API tests pass
[ ] forbidden-pattern static tests pass
[ ] typecheck passes
[ ] test suite passes
[ ] build passes
```

Required commands:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

If any command fails, authorization enforcement is not done.

---

# 33. Architectural Decision

Authorization enforcement is a Kernel responsibility.

The SDK owns the public interface.

Business modules declare permissions and request checks.

Business modules do not design their own authorization systems.

APIs enforce request-level access.

Services enforce business-operation access.

Database queries enforce tenant scoping.

UI enforces usability only.

---

# 34. Review Questions For Founder Approval

Before freezing this document, answer:

```txt
1. Should tenant mismatch return 404 or 403?
2. Should services always enforce permissions internally, or only mutations and sensitive reads?
3. Should module manifests use explicit permission descriptors immediately?
4. Should module disabled return 403 or 404?
5. Should Staff get any module permissions by default?
```

Recommended answers:

```txt
1. Use 404 for tenant mismatch to avoid org enumeration.
2. Services should enforce mutations and sensitive reads at minimum; list/read services should enforce read permission unless explicitly internal.
3. Yes. Use explicit descriptors from the restarted build.
4. Use 403 inside an authenticated org; 404 is acceptable for unknown/guessed paths.
5. No. Keep Staff conservative by default.
```

---

# End of Document
