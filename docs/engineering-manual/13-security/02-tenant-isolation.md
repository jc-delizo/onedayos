# OneDayOS Engineering Manual — 13 Security / 02 Tenant Isolation

**Document ID:** `13-security/02-tenant-isolation.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Restarted Foundation Build  
**Owner:** Founder / Lead Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `13-security/00-security-model.md`
- `13-security/08-production-readiness-gate.md`
- `13-security/09-security-stabilization-new-build-spec.md`

---

# 1. Purpose

This document defines the tenant isolation security model for the restarted OneDayOS platform build.

OneDayOS uses:

```txt
One shared codebase
One shared production deployment
One shared PostgreSQL database
Many client organizations
Tenant separation through Organization + orgId
```

This architecture is commercially correct for OneDayOS because it supports fast delivery, centralized maintenance, shared platform updates, AppCare, reusable modules, and low operational cost.

But this model is safe only if tenant isolation is designed as a first-class security boundary.

Tenant isolation is not a UI feature.

Tenant isolation is not only a database convention.

Tenant isolation is the rule that:

```txt
A user from Organization A must never read, mutate, infer, export, search, report on,
or receive events from Organization B.
```

This must hold across:

```txt
Pages
Layouts
API routes
Server actions
Services
SDK helpers
Database queries
Generated modules
Business Objects
Platform Services
Events
Search
Reports
AI
Imports
Exports
Background jobs
Testing
```

The previous MVP Kernel reference correctly used `org_id` and shared tables, but it also documented several open risks:

```txt
org membership check incomplete
sdk.permissions.can() not enforced
API requireAuth() returning redirects instead of JSON 401
sdk.getDb(orgId) allowing loose tenant identity
soft-delete and query bypass paths
generated module patterns that could accept client-supplied orgId
```

The restarted build must not recreate those gaps.

---

# 2. Non-Goals

This document does not define:

```txt
Supabase account ownership
Supabase billing
Dedicated client infrastructure
RLS implementation details
Full RBAC implementation
Full API error contract
Data retention
Backups
AI safety in full
Platform Service implementation
Client delivery process
```

Those are covered in separate documents.

This document focuses specifically on:

```txt
how a request becomes tenant-authorized
how org context is verified
how tenant-scoped data is queried
how cross-tenant access is prevented
how generated code avoids tenant leaks
how tests prove the boundary
```

---

# 3. Core Tenant Isolation Invariant

The core invariant is:

```txt
For every tenant-scoped operation, the organization must be derived and verified
by the server before any data access occurs.
```

The server must verify:

```txt
authenticated Supabase user
↓
matching OneDayOS User row
↓
requested Organization resolved from orgSlug
↓
user.orgId === organization.id
↓
organization status allows access
↓
module is enabled if the route belongs to a module
↓
user has required permission
↓
database query is scoped by ctx.org.id
```

No operation may skip directly from:

```txt
client request
↓
database query
```

The correct flow is:

```txt
client request
↓
API/page context helper
↓
verified PlatformContext
↓
permission/module checks
↓
service call
↓
sdk.getDb(ctx)
↓
tenant-scoped database query
```

---

# 4. Tenant Terminology

## 4.1 Organization

`Organization` is the tenant boundary.

An organization represents one client company or business account inside OneDayOS.

Examples:

```txt
Acme Trading Corporation
Juan's Hardware
Metro Dental Clinic
North Luzon Trucking
```

Each organization has:

```txt
id
name
slug
status
subscription
enabled modules
users
roles
settings
business data
```

## 4.2 orgId

`orgId` is the database tenant key.

Tenant-scoped tables must include:

```txt
orgId String
```

Examples:

```txt
Product.orgId
Customer.orgId
Employee.orgId
Warehouse.orgId
InventoryStockMovement.orgId
LeaveRequest.orgId
```

`orgId` must never be accepted from normal client requests.

## 4.3 orgSlug

`orgSlug` is a URL locator.

Example:

```txt
/acme-trading/dashboard
/api/orgs/acme-trading/inventory/stock-movements
```

`orgSlug` is not authorization.

An attacker can guess a slug. Guessing a slug must not grant access.

The server must verify:

```txt
requested orgSlug resolves to org
AND authenticated user belongs to that org
```

## 4.4 PlatformContext

`PlatformContext` is the verified server-side context used by services and SDK helpers.

A `PlatformContext` proves:

```txt
this authenticated OneDayOS user belongs to this organization
```

It is the central tenant-isolation object.

Services must receive:

```ts
PlatformContext
```

not:

```ts
orgId: string
```

## 4.5 Client Organization vs Supabase Organization

A OneDayOS client organization is not the same as a Supabase organization.

```txt
Supabase Organization = OneDayOS company infrastructure account
OneDayOS Organization = client tenant inside the OneDayOS app
```

Clients do not get Supabase dashboard access in the standard MVP model.

---

# 5. MVP Tenant Membership Model

For MVP, each platform user belongs to exactly one organization:

```txt
User.orgId → Organization.id
```

This keeps the first platform simple, safe, and commercially realistic.

The user table must include:

```txt
User {
  id     String // Supabase auth user id
  orgId  String
  email  String
  name   String
  ...
}
```

A user may access only:

```txt
organization.id === user.orgId
```

Future multi-organization users are deferred.

Do not add:

```txt
OrganizationMember
UserOrganization
Membership
OrgSwitcher
```

during MVP unless a future ADR approves multi-org access.

---

# 6. Future Multi-Org User Model

A future enterprise model may require:

```txt
one user belongs to multiple organizations
consultant or accountant users
OneDayOS internal support users
agency-managed clients
franchise groups
```

That requires a different model:

```txt
OrganizationMembership {
  orgId
  userId
  membershipStatus
  defaultRole
}
```

But MVP must not implement this yet.

The current rule remains:

```txt
User.orgId is the only membership source.
```

Future multi-org support requires:

```txt
ADR
schema migration
auth helper redesign
permission redesign
audit impact review
UI org switcher design
tenant isolation test expansion
```

---

# 7. Tenant Isolation Layers

Tenant isolation must be enforced through multiple layers.

No single layer is enough.

## 7.1 URL Layer

Tenant routes must include `orgSlug`:

```txt
/[orgSlug]/dashboard
/[orgSlug]/inventory
/[orgSlug]/objects/products
/api/orgs/[orgSlug]/inventory/products
/api/orgs/[orgSlug]/objects/products
```

Forbidden:

```txt
/api/inventory?orgId=...
/api/products?orgId=...
/api/kernel/users/[id] for current user lookup
/dashboard?orgId=...
```

The URL locates the tenant.

It does not authorize access.

## 7.2 Auth Layer

Every protected route must establish the authenticated Supabase user.

Page routes may redirect unauthenticated users to login.

API routes must return JSON `401`.

Forbidden in APIs:

```txt
redirect('/login')
HTML login response
307 auth redirect
notFound() for unauthenticated API access
```

## 7.3 Platform User Layer

The authenticated Supabase user must map to a OneDayOS `User` row.

If the Supabase user exists but no OneDayOS user exists, the session is invalid for platform access.

This can happen if auth and Prisma sync failed.

Expected API error:

```json
{
  "data": null,
  "error": {
    "code": "PLATFORM_USER_NOT_FOUND",
    "message": "Your OneDayOS user profile could not be found."
  }
}
```

## 7.4 Organization Membership Layer

The requested `orgSlug` must resolve to an Organization.

Then the platform user must belong to that organization.

```ts
user.orgId === org.id
```

If not, access is denied before any tenant data query.

## 7.5 Organization Status Layer

The organization status must allow access.

Suggested states:

```txt
active
trial
suspended
cancelled
archived
```

MVP may keep status in `Subscription.status` and `Organization.isActive`, but the behavior must be clear.

Recommended behavior:

| State | Login | Dashboard | Modules | APIs |
|---|---:|---:|---:|---:|
| active | yes | yes | yes | yes |
| trial | yes | yes | yes | yes |
| suspended | yes | limited | no | no |
| cancelled | yes | limited | no | no |
| archived | no or limited | no | no | no |

Suspended organizations should not produce cross-tenant ambiguity. If the user belongs to the suspended org, return a clear own-org suspension error. If the user is trying to access another org, return safe not-found behavior.

## 7.6 Module Enablement Layer

For module routes, the organization must have that module enabled.

```txt
OrgModule.orgId = ctx.org.id
OrgModule.moduleId = requested module
OrgModule.isEnabled = true
```

If a module is not enabled, normal users should receive safe module-not-found behavior.

## 7.7 Permission Layer

After tenant membership and module enablement, the user must have permission for the action.

Permissions must never be checked before tenant membership.

Correct order:

```txt
auth
tenant membership
org status
module enablement
permission
operation
```

## 7.8 Data Query Layer

Every tenant-scoped query must include:

```txt
orgId: ctx.org.id
```

This is still required even after `PlatformContext` is verified.

The context proves who the user is.

The query still scopes the data.

## 7.9 Test Layer

Tenant isolation must be proven with tests using at least two organizations.

A single-org test suite is not enough.

---

# 8. PlatformContext Contract

## 8.1 Required Shape

The server SDK should expose a `PlatformContext` similar to:

```ts
export type PlatformContext = {
  requestId: string

  auth: {
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
    subscriptionStatus?: string
  }

  permissions: {
    roles: Array<{
      id: string
      name: string
      isSystem: boolean
    }>
  }

  modules: {
    enabled: string[]
  }
}
```

This shape may evolve, but these concepts must exist:

```txt
authenticated identity
platform user
verified organization
enabled modules
roles/permissions context
request/debug identity
```

## 8.2 Context Must Be Created Only by Kernel/SDK Helpers

Module code must not construct `PlatformContext` manually.

Allowed:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

Forbidden:

```ts
const ctx = {
  org: { id: body.orgId },
  user: { id: userId },
} as PlatformContext
```

## 8.3 Branding the Context

To reduce accidental manual construction, `PlatformContext` may use a private brand.

Example:

```ts
declare const platformContextBrand: unique symbol

export type PlatformContext = {
  readonly [platformContextBrand]: true
  requestId: string
  user: PlatformUser
  org: PlatformOrganization
  modules: PlatformModuleContext
  permissions: PlatformPermissionContext
}
```

Only Kernel/SDK context helpers should attach the brand.

Tests may use approved test factories.

## 8.4 Context Should Be Immutable

Treat `PlatformContext` as read-only.

Forbidden:

```ts
ctx.org.id = otherOrgId
ctx.user.orgId = otherOrgId
ctx.modules.enabled.push('inventory')
```

Use `Readonly` types where practical.

---

# 9. Required Context Helpers

The server SDK must provide safe context helpers.

## 9.1 Page Auth Helper

Used by server components and layouts.

```ts
const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
```

Behavior:

```txt
unauthenticated → redirect to /login
org missing → notFound()
user missing → redirect or error page
wrong org → notFound()
suspended org → suspended page
success → PlatformContext
```

Page helpers may use Next.js `redirect()` and `notFound()`.

They must not be used inside API routes.

## 9.2 API Auth Helper

Used by APIs that require auth but not tenant context.

```ts
const ctx = await sdk.auth.requireApiAuth(req)
```

Behavior:

```txt
unauthenticated → 401 JSON
platform user missing → 401 or 403 JSON depending on final API contract
success → authenticated user context
```

## 9.3 API Org Context Helper

Used by tenant-scoped APIs.

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
```

Behavior:

```txt
unauthenticated → 401 JSON
org missing → 404 JSON
wrong org → 404 JSON
suspended org → 403 JSON with ORG_SUSPENDED
success → PlatformContext
```

Wrong-org access should not reveal whether the org exists.

## 9.4 API Module Context Helper

Used by module APIs.

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

Behavior:

```txt
auth check
tenant membership check
org status check
module enablement check
return PlatformContext
```

If module is disabled:

```txt
404 MODULE_NOT_FOUND
```

not:

```txt
403 "Inventory disabled for this org"
```

for normal users.

## 9.5 API Business Object Context Helper

Business Object APIs should use org context, not module context.

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
```

Then require Business Object permission:

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'read',
})
```

---

# 10. Route Shape Rules

## 10.1 Tenant Page Routes

Use:

```txt
/[orgSlug]/dashboard
/[orgSlug]/objects/products
/[orgSlug]/objects/customers
/[orgSlug]/objects/employees
/[orgSlug]/inventory/stock-levels
/[orgSlug]/leave/requests
```

Do not use:

```txt
/dashboard?orgId=...
/inventory?orgId=...
/client/[orgId]/...
```

## 10.2 Tenant API Routes

Use:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/inventory/stock-movements
/api/orgs/[orgSlug]/leave/requests
```

Do not use:

```txt
/api/products?orgId=...
/api/inventory?orgId=...
/api/[module]
/api/kernel/users/[id] for current user lookup
```

## 10.3 Current User Route

Use:

```txt
GET /api/kernel/auth/me
```

Do not use:

```txt
GET /api/kernel/users/[id]
```

for current-user lookup.

The user ID is security-sensitive. The server should derive the current user from session, not from a path parameter.

## 10.4 Public Routes

Allowed public routes:

```txt
/login
/register
/api/kernel/auth/register
/api/kernel/health
```

Public routes must be intentionally listed.

Everything else should be protected by default.

---

# 11. Client-Supplied orgId Is Forbidden

Normal client requests must not include `orgId`.

Forbidden locations:

```txt
JSON body
query string
headers
cookies
hidden form fields
localStorage
sessionStorage
URL search params
CSV uploaded by end user as tenant selector
```

Forbidden examples:

```ts
const orgId = body.orgId
const orgId = request.nextUrl.searchParams.get('orgId')
const orgId = request.headers.get('x-org-id')
const orgId = formData.get('orgId')
```

Allowed:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
const orgId = ctx.org.id
```

## 11.1 Reject, Do Not Ignore

If a protected API receives `orgId` in the request body or query string, reject it.

Recommended status:

```txt
400 BAD_REQUEST
```

Recommended error code:

```txt
TENANT_ID_NOT_ALLOWED
```

Example response:

```json
{
  "data": null,
  "error": {
    "code": "TENANT_ID_NOT_ALLOWED",
    "message": "Tenant identity is derived from the authenticated session and route."
  }
}
```

Rejecting is better than ignoring because it catches bad client code and bad generator output early.

## 11.2 Registration Exception

Registration creates a new organization.

It accepts:

```txt
orgName
```

not:

```txt
orgId
```

The server creates the organization ID.

## 11.3 Founder/Developer Onboarding Scripts

Trusted internal scripts may accept an explicit organization locator for provisioning.

Example:

```bash
npm run org:provision -- --slug acme-trading
```

But these are not client-facing APIs.

They must be:

```txt
server-only
operator-run
logged
reviewed
not exposed to the browser
```

---

# 12. Database Query Rules

## 12.1 Tenant-Scoped Models

Every tenant-scoped model must include:

```prisma
orgId String
```

Recommended tenant-safe unique reference:

```prisma
@@unique([id, orgId])
```

Even though `id` is globally unique, the composite unique helps enforce tenant-scoped query patterns.

## 12.2 List Query Pattern

Correct:

```ts
const db = sdk.getDb(ctx)

return db.product.findMany({
  where: {
    orgId: ctx.org.id,
    deletedAt: null,
  },
  orderBy: { createdAt: 'desc' },
})
```

Forbidden:

```ts
return prisma.product.findMany()
```

Forbidden:

```ts
return prisma.product.findMany({
  where: { orgId: body.orgId },
})
```

## 12.3 Get-by-ID Query Pattern

Correct:

```ts
return db.product.findUnique({
  where: {
    id_orgId: {
      id: productId,
      orgId: ctx.org.id,
    },
  },
})
```

Or, if composite unique is not available:

```ts
return db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Forbidden for tenant-scoped records:

```ts
return prisma.product.findUnique({
  where: { id: productId },
})
```

## 12.4 Update Pattern

Correct:

```ts
await db.product.update({
  where: {
    id_orgId: {
      id: productId,
      orgId: ctx.org.id,
    },
  },
  data: validatedInput,
})
```

Forbidden:

```ts
await prisma.product.update({
  where: { id: productId },
  data,
})
```

## 12.5 Delete Pattern

Correct:

```ts
await db.product.update({
  where: {
    id_orgId: {
      id: productId,
      orgId: ctx.org.id,
    },
  },
  data: {
    deletedAt: new Date(),
    deletedBy: ctx.user.id,
  },
})
```

Forbidden:

```ts
await prisma.product.delete({
  where: { id: productId },
})
```

## 12.6 Create Pattern

Correct:

```ts
await db.product.create({
  data: {
    orgId: ctx.org.id,
    code: input.code,
    name: input.name,
    createdBy: ctx.user.id,
  },
})
```

Forbidden:

```ts
await db.product.create({
  data: {
    orgId: input.orgId,
    code: input.code,
    name: input.name,
  },
})
```

## 12.7 Relation Validation Pattern

If a module creates a record that references a Business Object, validate the related object belongs to the same organization.

Correct:

```ts
const product = await db.product.findUnique({
  where: {
    id_orgId: {
      id: input.productId,
      orgId: ctx.org.id,
    },
  },
  select: { id: true },
})

if (!product) {
  throw new NotFoundError('Product not found.')
}
```

Forbidden:

```ts
await db.inventoryStockMovement.create({
  data: {
    orgId: ctx.org.id,
    productId: input.productId, // not validated
    quantity: input.quantity,
  },
})
```

## 12.8 Nested Includes

Nested includes can accidentally surface records that are not scoped or not filtered for soft delete.

Prefer explicit selects.

Risky:

```ts
return db.customer.findMany({
  where: { orgId: ctx.org.id },
  include: {
    projects: true,
    invoices: true,
    comments: true,
  },
})
```

Better:

```ts
return db.customer.findMany({
  where: { orgId: ctx.org.id, deletedAt: null },
  select: {
    id: true,
    name: true,
    email: true,
  },
})
```

If nested relations are needed, ensure each relation is tenant-safe and excludes deleted records where applicable.

## 12.9 Raw SQL

Raw SQL is forbidden in modules.

If absolutely needed for a platform-level performance reason, it requires:

```txt
architecture approval
tenant-scope proof
parameterization
tests
ADR if persistent
```

Forbidden:

```ts
await prisma.$queryRawUnsafe(`SELECT * FROM products WHERE org_id = '${orgId}'`)
```

---

# 13. Tenant Isolation in Services

Services are the main business logic boundary.

Every public service method that touches tenant data must accept `PlatformContext`.

Correct:

```ts
export class InventoryService {
  static async listStockLevels(ctx: PlatformContext, input: ListStockInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_level',
      action: 'read',
    })

    const db = sdk.getDb(ctx)

    return db.inventoryStockLevel.findMany({
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
  static async listStockLevels(orgId: string) {
    return prisma.inventoryStockLevel.findMany({
      where: { orgId },
    })
  }
}
```

## 13.1 Service Permission Enforcement

During MVP, public service methods should enforce permissions internally.

Reason:

```txt
API routes may forget
future server actions may reuse services
future event handlers may call services
Claude may generate incomplete routes
```

The service is the last reliable application boundary before the database.

## 13.2 Internal Helper Functions

Internal private helper functions may receive narrowed values if they are not exported and are called only after context verification.

Allowed:

```ts
private static async calculateBalance(db: TenantDb, productId: string) {
  ...
}
```

But public service entry points must require context.

---

# 14. Tenant Isolation in API Routes

All tenant-scoped APIs must follow this shape:

```ts
import { sdk } from '@/sdk/server'
import { createProductSchema } from '@/modules/.../schema'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  return sdk.api.handle(req, async () => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

    await sdk.permissions.require(ctx, {
      module: 'objects',
      resource: 'product',
      action: 'create',
    })

    const body = await sdk.api.parseJson(req, createProductSchema)

    const data = await ProductService.create(ctx, body)

    return sdk.api.created(data)
  })
}
```

A module API should use module context:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

Then permission:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_movement',
  action: 'create',
})
```

## 14.1 API Error Behavior

Expected errors:

| Situation | Status | Code |
|---|---:|---|
| Not logged in | 401 | `UNAUTHENTICATED` |
| Platform user missing | 401 or 403 | `PLATFORM_USER_NOT_FOUND` |
| Org missing | 404 | `ORG_NOT_FOUND` |
| Wrong org | 404 | `ORG_NOT_FOUND` |
| Org suspended | 403 | `ORG_SUSPENDED` |
| Module disabled | 404 | `MODULE_NOT_FOUND` |
| Permission missing | 403 | `FORBIDDEN` |
| Client-supplied orgId | 400 | `TENANT_ID_NOT_ALLOWED` |
| Validation failed | 400 | `VALIDATION_ERROR` |
| Record missing in current tenant | 404 | `NOT_FOUND` |

Wrong-org access should not reveal whether the target organization exists.

---

# 15. Tenant Isolation in Page Layouts

The org layout must verify tenant membership before rendering the shell.

Correct:

```ts
export default async function OrgLayout({ children, params }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)

  const nav = await NavigationService.getNav(ctx)

  return (
    <AppShell ctx={safeClientContext(ctx)} nav={nav}>
      {children}
    </AppShell>
  )
}
```

Forbidden:

```ts
const org = await prisma.organization.findUnique({ where: { slug: orgSlug } })
const user = await prisma.user.findUnique({ where: { id: authUser.id } })

// Missing: user.orgId === org.id
```

The page shell must not render another organization's name, logo, modules, or navigation to the wrong user.

---

# 16. Tenant Isolation in Client Components

Client components must not know `orgId`.

Allowed client data:

```txt
orgSlug
display org name
current user's display name
navigation labels
record IDs already scoped by server
business form fields
```

Forbidden client data:

```txt
orgId as hidden field
orgId in localStorage
orgId in request body
orgId in query string
service role keys
raw permission tables
raw enabled module table
```

Client fetches should use routes like:

```ts
fetch(`/api/orgs/${orgSlug}/inventory/stock-movements`)
```

not:

```ts
fetch(`/api/inventory?orgId=${orgId}`)
```

---

# 17. Tenant Isolation in Business Objects

Business Object APIs live under:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/employees
/api/orgs/[orgSlug]/objects/suppliers
/api/orgs/[orgSlug]/objects/warehouses
```

Business Object permissions use:

```txt
objects.product.read
objects.customer.update
objects.employee.delete
```

Business Object services must use:

```ts
PlatformContext
```

not:

```ts
orgId
```

Example:

```ts
await ProductService.create(ctx, input)
```

not:

```ts
await ProductService.create(orgId, input)
```

Business Object records are shared by modules, but they are still tenant-scoped.

Inventory may reference `Product`.

CRM may reference `Customer`.

Leave may reference `Employee`.

But no module may query those objects without tenant context.

---

# 18. Tenant Isolation in Module Extensions

Module extension tables must include `orgId`.

Example:

```prisma
model InventoryProductExtension {
  id             String   @id @default(cuid())
  orgId          String
  productId      String
  reorderPoint   Int?
  minimumStock   Int?
  valuationMethod String?

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
}
```

Even if the parent Business Object has `orgId`, the extension table still keeps its own `orgId`.

Reason:

```txt
tenant-safe queries
tenant-safe unique constraints
future RLS compatibility
easy debugging
safer imports/exports
```

---

# 19. Tenant Isolation in Events

Events must be tenant-scoped.

Modules emit events through the server SDK using verified context:

```ts
await sdk.events.emit(ctx, 'objects.product.created', {
  productId: product.id,
})
```

The event envelope may include:

```ts
{
  id: string
  name: string
  orgId: string
  actorUserId: string
  occurredAt: string
  payload: unknown
}
```

But the payload itself should not include `orgId`.

Correct:

```ts
payload: {
  productId: product.id
}
```

Avoid:

```ts
payload: {
  orgId: ctx.org.id,
  product: fullProductRecord
}
```

## 19.1 Listener Tenant Safety

Listeners receive an event envelope and must preserve tenant context.

A listener must not query across all organizations.

Correct:

```ts
async function onProductCreated(event: EventEnvelope<ProductCreatedPayload>) {
  const ctx = await sdk.events.getContext(event)
  await SearchIndexer.indexProduct(ctx, event.payload.productId)
}
```

Forbidden:

```ts
async function onProductCreated(event) {
  const product = await prisma.product.findUnique({
    where: { id: event.payload.productId },
  })
}
```

## 19.2 Module Enablement for Listeners

A listener belonging to a module should run only if that module is enabled for the event organization.

Example:

```txt
CRM listener responds to customer created
only if CRM is enabled for that org
```

---

# 20. Tenant Isolation in Search

Search Service is deferred.

When implemented later, it must be tenant-scoped.

Search must respect:

```txt
PlatformContext
orgId
module enablement
permissions
soft delete
sensitive-field exclusions
```

Search must not use a global index that returns cross-tenant results.

If search indexing exists later, index documents must include tenant identity internally, and every query must filter by context tenant.

---

# 21. Tenant Isolation in Reporting

Reporting Service is deferred.

Future reports must:

```txt
use PlatformContext
exclude soft-deleted records by default
respect module enablement
respect permissions
require export permission for exports
avoid raw client SQL
avoid unapproved cross-module joins
```

Dashboard widgets must not become permission bypasses.

---

# 22. Tenant Isolation in AI

AI runtime features are deferred.

Future AI must:

```txt
use PlatformContext
receive only data the current user may access
never accept client-supplied orgId
never execute arbitrary SQL
never export data unless export permission exists
treat business data as untrusted input
respect soft delete
respect module enablement
```

AI is not a tenant boundary.

The platform is the tenant boundary.

---

# 23. Tenant Isolation in Imports and Exports

The full Import/Export Engine is deferred.

Limited onboarding scripts are allowed.

All future imports must:

```txt
target one verified organization
avoid client-supplied orgId
validate all referenced records inside the same org
avoid duplicating Business Objects
use services where practical
```

All future exports must:

```txt
use PlatformContext
require export permission
exclude soft-deleted records by default
exclude sensitive fields by default
never export another org's records
```

---

# 24. Tenant Isolation in Background Jobs

Background Jobs are deferred.

When implemented later, jobs must carry verified tenant context.

A job payload must not trust arbitrary client-provided `orgId`.

Future job payloads should include enough identifiers to reconstruct or verify context safely.

Example future payload:

```ts
{
  orgId: string,
  actorUserId: string,
  jobType: 'inventory.import',
  inputFileId: string
}
```

But the job worker must still verify:

```txt
organization exists
actor exists or system actor is approved
module is enabled if relevant
operation is allowed
```

Do not run background jobs with global tenant access unless the job is explicitly a platform maintenance task.

---

# 25. Tenant Isolation in Admin and Support Access

OneDayOS internal support access is deferred.

Do not add hidden support bypasses in MVP.

Forbidden:

```txt
if email endsWith @onedayonlysystems.com, allow all orgs
if user is superadmin, skip org check
support=true query param
x-support-org-id header
```

Future support access requires:

```txt
ADR
explicit support role
auditable impersonation
time-bound access
reason required
client-visible audit trail if appropriate
strict internal permissions
```

Until then:

```txt
OneDayOS operators use scripts or database tools carefully,
not hidden app-level tenant bypasses.
```

---

# 26. Tenant Isolation in Dedicated Deployments

Dedicated infrastructure is deferred.

If a future enterprise client receives its own deployment/database, tenant isolation still matters.

Reason:

```txt
the app code should remain the same
there may still be multiple orgs in one dedicated deployment
support/internal users still need boundaries
future migration back to shared infra should remain possible
```

Do not write code that assumes:

```txt
one deployment = one organization
```

The app model remains:

```txt
Organization is the tenant boundary.
```

---

# 27. Required Test Matrix

Tenant isolation tests are mandatory.

Every security-sensitive test suite must include:

```txt
Org A
Org B
Admin user in Org A
Staff user in Org A
User in Org B
Records in Org A
Records in Org B
```

## 27.1 Page Tests

Required:

```txt
unauthenticated user is redirected to login
Org A user can access Org A page
Org A user cannot access Org B page
wrong org does not render Org B name
wrong org does not render Org B modules
suspended org shows limited/suspended behavior
```

## 27.2 API Context Tests

Required:

```txt
unauthenticated tenant API returns 401 JSON
authenticated user with no platform User returns platform-user error
Org A user accessing Org A API succeeds
Org A user accessing Org B API returns safe 404
missing orgSlug returns safe 404
suspended own org returns ORG_SUSPENDED
API never redirects or returns HTML
```

## 27.3 API Data Tests

Required:

```txt
Org A user cannot list Org B records
Org A user cannot fetch Org B record by guessed ID
Org A user cannot update Org B record by guessed ID
Org A user cannot soft-delete Org B record by guessed ID
Org A user cannot restore Org B record by guessed ID
client-supplied orgId is rejected
query-string orgId is rejected
header orgId is rejected
```

## 27.4 Permission Tests

Required:

```txt
tenant membership is checked before permissions
Admin wildcard works only inside own org
Staff without permission gets 403
module-disabled route returns module-not-found behavior
module-enabled but unauthorized route returns forbidden behavior
Business Object permissions use objects namespace
module extension permissions use module namespace
```

## 27.5 Service Tests

Required:

```txt
service requires PlatformContext
service scopes list query by ctx.org.id
service scopes get/update/delete by ctx.org.id
service rejects or cannot compile with loose orgId
service validates related records belong to same org
service emits events with tenant context
failed mutation does not emit success event
```

## 27.6 Generator Tests

Required generated module tests:

```txt
generated schemas reject orgId
generated APIs use /api/orgs/[orgSlug]/...
generated services receive PlatformContext
generated services use sdk.getDb(ctx)
generated APIs include requireApiModuleContext
generated APIs include permission checks
generated tests include two orgs
generated tests include permission denial
generated code contains no @/kernel imports
generated code contains no raw Prisma imports
```

---

# 28. Architecture Checks

The restarted platform should include:

```bash
npm run check:architecture
```

This should eventually scan for forbidden patterns.

Minimum forbidden patterns:

```txt
request.nextUrl.searchParams.get('orgId')
body.orgId
input.orgId
headers.get('x-org-id')
sdk.getDb(orgId)
sdk.getDb('
getDb(orgId
import { prisma } from '@/kernel/db/client' inside src/modules
from '@/kernel/ inside src/modules
src/app/api/[module] route shape
findUnique({ where: { id: inside tenant modules/services
prisma.$queryRaw inside modules
prisma.$executeRaw inside modules
```

This check does not replace tests.

It catches obvious architectural drift before review.

---

# 29. Safe Error Disclosure

Tenant isolation errors must avoid information leaks.

## 29.1 Wrong Org

If a user from Org A requests Org B:

```txt
/api/orgs/org-b/inventory/products
```

return:

```txt
404 ORG_NOT_FOUND
```

not:

```txt
403 You do not belong to Org B
```

Reason:

```txt
403 confirms Org B exists.
```

## 29.2 Own Org Suspended

If a user accesses their own suspended organization, it is safe to show:

```txt
403 ORG_SUSPENDED
```

or a suspended account page.

Reason:

```txt
the user already belongs to that org.
```

## 29.3 Record Missing

If a record exists in another org, return:

```txt
404 NOT_FOUND
```

not:

```txt
403 FORBIDDEN
```

Reason:

```txt
do not reveal cross-tenant record existence.
```

---

# 30. Forbidden Patterns

## 30.1 Loose orgId

Forbidden:

```ts
function list(orgId: string) {}
```

in module or Business Object services.

Use:

```ts
function list(ctx: PlatformContext) {}
```

## 30.2 Client orgId

Forbidden:

```ts
const schema = z.object({
  name: z.string(),
  orgId: z.string(),
})
```

Use:

```ts
const schema = z.strictObject({
  name: z.string(),
})
```

## 30.3 Query String orgId

Forbidden:

```ts
const orgId = req.nextUrl.searchParams.get('orgId')
```

## 30.4 Header orgId

Forbidden:

```ts
const orgId = req.headers.get('x-org-id')
```

## 30.5 Raw Prisma in Modules

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
```

inside:

```txt
src/modules/*
```

## 30.6 Kernel Imports in Modules

Forbidden:

```ts
import { can } from '@/kernel/permissions/check'
```

Use:

```ts
import { sdk } from '@/sdk/server'
```

## 30.7 Direct Module Imports

Forbidden:

```ts
import { InventoryService } from '@/modules/inventory/service'
```

inside another module.

Use Business Objects, Platform Services, or events.

## 30.8 Auth Redirect in APIs

Forbidden:

```ts
await sdk.auth.requireAuth()
```

if that helper redirects.

Use:

```ts
await sdk.auth.requireApiOrgContext(req, orgSlug)
```

## 30.9 findUnique by id

Forbidden on tenant-scoped data:

```ts
db.product.findUnique({ where: { id } })
```

Use composite tenant-safe lookup.

## 30.10 Hidden Tenant Field

Forbidden:

```tsx
<input type="hidden" name="orgId" value={orgId} />
```

---

# 31. Required Implementation Sequence

Tenant isolation should be implemented in this order:

```txt
1. Define PlatformContext type.
2. Implement current-user session resolver.
3. Implement platform User lookup.
4. Implement orgSlug resolver.
5. Implement user.orgId === org.id check.
6. Implement page org context helper.
7. Implement API org context helper.
8. Implement API module context helper.
9. Implement API JSON error helpers.
10. Update org layout to use page org context.
11. Update Business Object services to require PlatformContext.
12. Update module generator to use PlatformContext.
13. Add tenant isolation test fixtures with two orgs.
14. Add API tenant isolation tests.
15. Add architecture checks for forbidden orgId patterns.
16. Only then implement official modules.
```

Do not start Inventory before this sequence is complete.

---

# 32. Claude Implementation Rules

Claude must obey these rules when implementing tenant isolation:

```txt
Do not add FastAPI.
Do not add RLS in MVP.
Do not create multi-org membership tables.
Do not add hidden support/superadmin bypass.
Do not use client-supplied orgId.
Do not use sdk.getDb(orgId).
Do not use raw Prisma in modules.
Do not use redirect-based auth helpers in API routes.
Do not return HTML from API auth failures.
Do not implement module logic before context helpers exist.
Do not implement official modules before tenant isolation tests pass.
```

Claude must stop and report ambiguity if:

```txt
a service appears to need orgId but no PlatformContext exists
a module wants to access another module's data
a route has no orgSlug
a client request includes orgId
a query cannot be tenant-scoped
a record relation lacks tenant-safe validation
```

---

# 33. Example Correct API Route

```ts
import { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { createProductSchema } from '@/objects/product/schema'
import { ProductService } from '@/objects/product/service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  return sdk.api.handle(req, async () => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

    await sdk.permissions.require(ctx, {
      module: 'objects',
      resource: 'product',
      action: 'create',
    })

    const input = await sdk.api.parseJson(req, createProductSchema)

    const product = await ProductService.create(ctx, input)

    return sdk.api.created(product)
  })
}
```

---

# 34. Example Correct Service

```ts
import { sdk, type PlatformContext } from '@/sdk/server'
import type { CreateProductInput } from './schema'

export class ProductService {
  static async create(ctx: PlatformContext, input: CreateProductInput) {
    await sdk.permissions.require(ctx, {
      module: 'objects',
      resource: 'product',
      action: 'create',
    })

    const db = sdk.getDb(ctx)

    const product = await db.product.create({
      data: {
        orgId: ctx.org.id,
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        categoryId: input.categoryId ?? null,
        unit: input.unit ?? 'pcs',
      },
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        createdAt: true,
      },
    })

    await sdk.events.emit(ctx, 'objects.product.created', {
      productId: product.id,
      code: product.code,
    })

    return product
  }

  static async getById(ctx: PlatformContext, productId: string) {
    await sdk.permissions.require(ctx, {
      module: 'objects',
      resource: 'product',
      action: 'read',
    })

    const db = sdk.getDb(ctx)

    return db.product.findUnique({
      where: {
        id_orgId: {
          id: productId,
          orgId: ctx.org.id,
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        unit: true,
      },
    })
  }
}
```

---

# 35. Example Forbidden API Route

```ts
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId')

  const data = await InventoryService.list(orgId)

  return NextResponse.json({ data, error: null })
}
```

Reasons this is forbidden:

```txt
no orgSlug
trusts client-supplied orgId
no PlatformContext
no org membership verification
no module enablement check
no permission check
loose service argument
```

---

# 36. Example Forbidden Service

```ts
export class InventoryService {
  static async list(orgId: string) {
    return prisma.inventoryStockLevel.findMany({
      where: { orgId },
    })
  }
}
```

Reasons this is forbidden:

```txt
accepts loose orgId
imports raw Prisma
does not enforce permission
can be called with another tenant's orgId
does not prove org membership
```

---

# 37. Production Readiness Gate

Tenant isolation is not ready until all of these pass:

```txt
[ ] PlatformContext implemented
[ ] requirePageOrgContext implemented
[ ] requireApiOrgContext implemented
[ ] requireApiModuleContext implemented
[ ] orgSlug membership check implemented
[ ] user.orgId === org.id enforced
[ ] API auth returns JSON 401, never redirect
[ ] client-supplied orgId rejected
[ ] wrong-org API access returns safe 404
[ ] wrong-org page access returns notFound behavior
[ ] module-disabled access returns safe module-not-found
[ ] permission-denied access returns 403
[ ] sdk.getDb(ctx) implemented
[ ] sdk.getDb(orgId) impossible or architecture-blocked
[ ] raw Prisma forbidden in modules
[ ] tenant-scoped findUnique-by-id blocked or reviewed
[ ] generated modules use PlatformContext
[ ] generated module tests include two orgs
[ ] cross-tenant read tests pass
[ ] cross-tenant write tests pass
[ ] cross-tenant delete tests pass
[ ] cross-tenant restore tests pass
[ ] client-supplied orgId tests pass
[ ] architecture checks pass
```

Before this checklist passes:

```txt
Do not onboard a second tenant.
Do not implement official Inventory.
Do not trust generated modules.
Do not call the platform production-safe.
```

---

# 38. Acceptance Criteria

This document is satisfied when a senior engineer or Claude implementation agent can answer:

```txt
How is org context derived?
Where does orgSlug appear?
Why is orgSlug not authorization?
Why is client-supplied orgId forbidden?
What is PlatformContext?
Who can create PlatformContext?
How do API routes get PlatformContext?
How do services use PlatformContext?
How do database queries scope by tenant?
How are wrong-org requests handled?
How are modules enabled per org?
How are permissions combined with tenant checks?
How are Business Objects tenant-scoped?
How are events tenant-scoped?
What tests prove isolation?
What patterns are forbidden?
```

without making new architectural decisions.

---

# 39. Founder Summary

The simple mental model:

```txt
The client can say which organization they are trying to open by URL.
The server decides whether they actually belong there.
```

Example:

```txt
/acme/dashboard
```

The URL says:

```txt
I want Acme.
```

The server checks:

```txt
Who are you?
What OneDayOS user are you?
Which org do you belong to?
Is it Acme?
Is Acme active?
Is this module enabled?
Do you have permission?
```

Only then can data load.

The database is shared, but every query must still say:

```txt
only records for ctx.org.id
```

That is why the platform can safely serve many clients from one deployment and one database.

---

# 40. Final Rule

Tenant isolation is existential for OneDayOS.

If tenant isolation fails, the platform fails.

Therefore:

```txt
No tenant context, no data access.
No PlatformContext, no service call.
No org membership check, no page render.
No API-safe auth, no API route.
No permission enforcement, no mutation.
No two-org tests, no production readiness.

```
