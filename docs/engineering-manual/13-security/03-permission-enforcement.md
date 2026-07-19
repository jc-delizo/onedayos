# OneDayOS Engineering Manual — 13 Security / 03 Permission Enforcement

**Document ID:** `13-security/03-permission-enforcement.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Foundation Build`  
**Owner:** Founder / Software Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/01-tenancy-data-isolation.md`
- `13-security/00-security-model.md`
- `13-security/02-tenant-isolation.md`

---

# 1. Purpose

This document defines how OneDayOS enforces permissions.

The restarted platform must not merely **store** roles and permissions. It must enforce them consistently across:

- pages
- API routes
- services
- SDK helpers
- Business Object operations
- module operations
- navigation
- generators
- tests
- future Platform Services
- future AI features

The previous MVP already proved that having a `can()` helper is not enough. A permission system that exists but is not called is not a security system.

The core rule is:

```txt
Permissions must be enforced at the API/service boundary.
UI checks are helpful, but they are not security.
```

---

# 2. Why This Document Exists

OneDayOS is a multi-tenant business platform.

That means a permission bug can expose or mutate real company data.

Because all clients share the same platform and database, permission enforcement must be:

```txt
centralized
predictable
testable
generator-enforced
impossible to casually bypass
```

This document exists to prevent these failure modes:

```txt
API route only checks login
service accepts loose orgId
admin wildcard bypasses tenant isolation
UI hides button but API still allows action
module generator creates routes without permission checks
read permission accidentally permits export
wrong-org data returns 403 and reveals another org exists
client-supplied orgId controls authorization
future AI answers questions the user could not see in UI
```

---

# 3. Scope

This document covers permission enforcement for the restarted OneDayOS platform.

It covers:

```txt
authentication + tenancy + module enablement + permission gates
permission requirement shape
API enforcement
service enforcement
page enforcement
navigation enforcement
Business Object enforcement
module enforcement
admin wildcard behavior
generator output
tests
future services and AI
```

It does not define:

```txt
Supabase Auth setup
organization membership rules
database schema in full
UI component styling
ABAC implementation
field-level permissions
branch-scoped permissions
own-record permissions
approval assignment logic
RLS policies
```

Those belong in other manual documents.

---

# 4. Core Enforcement Model

Every protected operation must pass four gates:

```txt
1. Authentication
2. Tenant membership
3. Module or object availability
4. Permission
```

For module operations:

```txt
authenticated user
  ↓
verified organization membership
  ↓
module enabled for organization
  ↓
user has required module permission
  ↓
operation allowed
```

For Business Object operations:

```txt
authenticated user
  ↓
verified organization membership
  ↓
user has required objects.* permission
  ↓
operation allowed
```

For Kernel administration operations:

```txt
authenticated user
  ↓
verified organization membership
  ↓
user has required platform/kernel permission
  ↓
operation allowed
```

---

# 5. Gate Order Is Mandatory

Gate order matters.

Correct order:

```txt
1. Authenticate
2. Resolve and verify tenant context
3. Check organization status
4. Check module enablement, if module operation
5. Check permission
6. Validate business invariants
7. Execute operation
```

Do not check permission before tenant membership.

Why:

```txt
Permission checks must be scoped to the verified organization.
A user from Org A should never be evaluated against Org B's roles.
```

---

# 6. Permission Is Not Tenant Isolation

Permission enforcement and tenant isolation are related, but not the same.

Tenant isolation answers:

```txt
Does this authenticated user belong to this organization?
```

Permission enforcement answers:

```txt
Inside this verified organization, may this user perform this action?
```

A user with wildcard Admin permission in Org A must still have zero access to Org B.

Correct:

```txt
ctx.org.id = Org A
user has *.*.* inside Org A
request path = /api/orgs/org-b/inventory/products

Result:
404 ORG_NOT_FOUND
```

Incorrect:

```txt
user has *.*.*
allow access to Org B
```

Admin permissions never cross organization boundaries.

---

# 7. Permission Requirement Shape

Permission requirements use this shape:

```ts
type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Examples:

```ts
{
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
}

{
  module: 'objects',
  resource: 'product',
  action: 'read',
}

{
  module: 'kernel',
  resource: 'user',
  action: 'invite',
}
```

The order in code is `{ module, resource, action }`, even if the display form is `module.resource.action`.

---

# 8. Permission String Convention

For human-readable documentation, permissions may be written as:

```txt
module.resource.action
```

Examples:

```txt
inventory.stock_adjustment.create
inventory.stock_adjustment.approve
objects.product.read
objects.employee.update
kernel.user.invite
platform.audit.read
```

The canonical stored fields are still separate:

```txt
module
resource
action
```

Do not store permissions as a single string in the database for MVP.

Why:

```txt
Separate columns make wildcard matching, uniqueness, validation, and future conditions cleaner.
```

---

# 9. Namespace Rules

## 9.1 Kernel Permissions

Kernel permissions use the `kernel` namespace.

Examples:

```txt
kernel.user.read
kernel.user.invite
kernel.user.deactivate
kernel.role.read
kernel.role.update
kernel.organization.update
kernel.subscription.read
kernel.module.enable
kernel.module.disable
kernel.setting.update
```

## 9.2 Business Object Permissions

Business Object permissions use the `objects` namespace.

Examples:

```txt
objects.employee.read
objects.employee.create
objects.employee.update
objects.employee.delete
objects.employee.restore

objects.product.read
objects.product.create
objects.product.update
objects.product.delete
objects.product.restore

objects.customer.read
objects.supplier.read
objects.warehouse.read
```

Product is not `inventory.product`.

Customer is not `crm.customer`.

Employee is not `hr.employee`.

## 9.3 Module Permissions

Module-owned entities use the module ID namespace.

Examples:

```txt
inventory.stock_movement.read
inventory.stock_movement.create
inventory.stock_adjustment.read
inventory.stock_adjustment.create
inventory.stock_adjustment.approve

leave.leave_request.read
leave.leave_request.create
leave.leave_request.approve

expenses.expense_claim.read
expenses.expense_claim.create
expenses.expense_claim.approve
expenses.expense_claim.export
```

## 9.4 Future Platform Service Permissions

Future Platform Services use the `platform` namespace.

Examples:

```txt
platform.audit.read
platform.audit.export
platform.notification.read
platform.comment.create
platform.attachment.upload
platform.report.read
platform.report.export
```

These permissions are reserved until those services are implemented.

---

# 10. Action Vocabulary

Use a small, consistent action vocabulary.

Core actions:

```txt
read
create
update
delete
restore
export
import
approve
cancel
assign
enable
disable
invite
deactivate
reactivate
```

Avoid synonyms.

Do not use both:

```txt
remove
delete
archive
```

Choose one based on semantics.

For normal business records:

```txt
delete = soft delete
restore = restore soft-deleted record
```

For status changes:

```txt
deactivate = business inactive state
reactivate = business active state
```

---

# 11. Read Is Not Export

Read permission does not imply export permission.

Correct:

```txt
objects.customer.read
objects.customer.export
```

A user may be allowed to see records in the UI but not export them into CSV or Excel.

Why:

```txt
Export increases data leakage risk.
```

This rule applies to:

```txt
Business Objects
modules
reports
search results
future AI answers
future saved views
```

---

# 12. Read Is Not Search

Read permission does not automatically imply global search permission.

Module-local list/filter/search may use read permission.

But future global Search Service must define its own rules.

For MVP:

```txt
module table filtering = read permission
global cross-module search = deferred
```

---

# 13. Read Is Not AI Access

Future AI features must not assume:

```txt
user can read page
therefore AI can summarize all data
```

AI context must apply:

```txt
tenant isolation
module enablement
permission checks
sensitive field filtering
export rules
soft-delete exclusion
```

AI access is not implemented in MVP.

---

# 14. Wildcard Permission Rules

Wildcard permissions are allowed for granted roles, especially Admin.

Allowed grant:

```txt
module: '*'
resource: '*'
action: '*'
```

Human-readable:

```txt
*.*.*
```

This means:

```txt
all modules/resources/actions inside the verified organization
```

It does not mean:

```txt
all organizations
all tenants
all infrastructure
all Supabase projects
all service role access
```

Wildcard permissions must never bypass:

```txt
authentication
tenant membership
organization status
module enablement
data tenant scoping
soft-delete rules
API validation
```

---

# 15. Wildcards in Module Manifests Are Forbidden

Module manifests declare available permissions.

They must not declare wildcard permissions.

Forbidden:

```ts
permissions: [
  { module: '*', resource: '*', action: '*' }
]
```

Allowed:

```ts
permissions: [
  { module: 'inventory', resource: 'stock_movement', action: 'read' },
  { module: 'inventory', resource: 'stock_movement', action: 'create' },
  { module: 'inventory', resource: 'stock_adjustment', action: 'approve' },
]
```

Admin wildcard grants are seeded or assigned by Kernel role management, not by module manifests.

---

# 16. Conditions / ABAC

The Permission model may support a future `conditions` JSON field.

For MVP:

```txt
conditions must be null
```

If `conditions` is non-null and no ABAC evaluator exists:

```txt
deny
```

Do not silently allow conditional permissions.

Forbidden MVP assumptions:

```txt
conditions = { branchId: 'x' } is automatically enforced
conditions = { ownRecordsOnly: true } is automatically enforced
conditions = { maxAmount: 50000 } is automatically enforced
```

ABAC requires a separate future manual document, evaluator, tests, and ADR.

---

# 17. Permission Enforcement Locations

Permissions must be enforced in more than one place, but not all places are equal.

## 17.1 API Routes

API routes must enforce permissions or call helpers that enforce them.

API enforcement is mandatory.

## 17.2 Services

Public service methods must enforce permissions during MVP.

Service enforcement is mandatory.

## 17.3 Pages

Server pages should check permissions to choose what to render.

Page checks improve UX but are not enough.

## 17.4 Navigation

Navigation should hide unavailable items.

Navigation checks improve UX but are not enough.

## 17.5 Client Components

Client components may check permissions to hide buttons.

Client checks are not security.

## 17.6 Database

Database queries must be tenant-scoped.

Database query scoping is not permission enforcement by itself.

## 17.7 Future RLS

Future RLS may provide defense-in-depth tenant isolation.

RLS does not replace application permission enforcement.

---

# 18. API Route Enforcement Pattern

Every protected API route should follow this structure:

```ts
import { sdk } from '@/sdk/server'
import { createInputSchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  return sdk.api.handle(req, async () => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

    const input = await sdk.api.parseJson(req, createInputSchema)

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

The actual helper names may differ, but the pattern is mandatory.

---

# 19. Forbidden API Route Pattern

Forbidden:

```ts
export async function POST(req: Request) {
  const user = await requireAuth()
  const body = await req.json()
  const data = await InventoryService.create(body)
  return NextResponse.json({ data, error: null })
}
```

Problems:

```txt
redirect-style auth in API
no tenant membership check
no module enablement check
no permission check
raw body passed to service
client may supply orgId
service may not know verified user/org
```

Also forbidden:

```ts
const orgId = body.orgId
const data = await InventoryService.create(orgId, body)
```

and:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

---

# 20. Service Enforcement Pattern

During MVP, public service methods must enforce permissions internally.

Example:

```ts
export class InventoryService {
  static async createStockAdjustment(
    ctx: PlatformContext,
    input: CreateStockAdjustmentInput
  ) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    })

    const db = sdk.getDb(ctx)

    return db.stockAdjustment.create({
      data: {
        orgId: ctx.org.id,
        createdById: ctx.user.id,
        ...input,
      },
    })
  }
}
```

This means API routes and services may both call permission checks.

That is acceptable in MVP.

Why duplicate checks?

```txt
API route checks protect HTTP entrypoints.
Service checks protect internal callers and future reuse.
```

Later, we may refine this with trusted internal command objects or authorized service contexts, but not until patterns are proven.

---

# 21. Forbidden Service Pattern

Forbidden:

```ts
export class InventoryService {
  static async createStockAdjustment(orgId: string, input: Input) {
    return prisma.stockAdjustment.create({
      data: { orgId, ...input },
    })
  }
}
```

Problems:

```txt
loose orgId
raw Prisma
no PlatformContext
no permission enforcement
possible client-supplied tenant identity
```

Also forbidden:

```ts
static async create(input: Input) {
  const db = sdk.getDb(input.orgId)
}
```

---

# 22. PlatformContext Is Required

Permission enforcement must use verified `PlatformContext`.

Minimum shape:

```ts
type PlatformContext = {
  authUser: {
    id: string
    email?: string
  }

  user: {
    id: string
    orgId: string
    email: string
    name: string
    isActive: boolean
  }

  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
  }

  roles: Array<{
    id: string
    name: string
  }>

  permissions: PermissionGrant[]
}
```

Do not pass loose values:

```ts
userId
orgId
roleIds
```

when a full `PlatformContext` is available.

---

# 23. Permission Helper API

The server SDK should expose:

```ts
sdk.permissions.can(ctx, requirement)
sdk.permissions.require(ctx, requirement)
sdk.permissions.canAny(ctx, requirements)
sdk.permissions.requireAny(ctx, requirements)
sdk.permissions.canAll(ctx, requirements)
sdk.permissions.requireAll(ctx, requirements)
```

Suggested behavior:

```ts
await sdk.permissions.can(ctx, req)
// returns boolean

await sdk.permissions.require(ctx, req)
// returns void or throws/returns 403-compatible error
```

Do not expose helpers that accept only:

```ts
userId
orgId
module
action
```

for module/service code.

Those are too easy to misuse.

---

# 24. `can()` vs `require()`

Use `can()` when choosing UI rendering or optional behavior.

Use `require()` when protecting a business operation.

Examples:

```ts
const canCreate = await sdk.permissions.can(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'create',
})
```

For mutation:

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'create',
})
```

Do not protect mutations with:

```ts
if (await can(...)) {
  // do mutation
}
```

unless denial is handled through the standard API/service error path.

---

# 25. Module Enablement vs Permission

Module enablement and permission are separate.

Module enablement answers:

```txt
Did this organization buy/enable this module?
```

Permission answers:

```txt
Can this user inside the organization use this resource/action?
```

A module can be enabled but hidden from a user.

A user can have permission in a role, but the module can be disabled for the organization.

Both must pass.

Example:

```txt
Inventory enabled for Org A
User has inventory.stock_adjustment.create
=> allow, if tenant membership passes

Inventory disabled for Org A
User has inventory.stock_adjustment.create
=> deny safe 404 MODULE_NOT_FOUND

Inventory enabled for Org A
User lacks inventory.stock_adjustment.create
=> deny 403 FORBIDDEN
```

---

# 26. Disabled Module Behavior

If a module is disabled for the organization, normal users should receive:

```txt
404 MODULE_NOT_FOUND
```

not:

```txt
403 FORBIDDEN
```

Why:

```txt
Avoid revealing commercial/module availability details unnecessarily.
```

Internal admins may have diagnostics later, but not in MVP.

---

# 27. Wrong Organization Behavior

If a user tries to access another organization's route or API:

```txt
404 ORG_NOT_FOUND
```

not:

```txt
403 FORBIDDEN
```

Why:

```txt
Do not reveal whether another organization's slug exists.
```

This is tenant isolation behavior, not ordinary permission denial.

---

# 28. Permission Denial Behavior

If the organization is verified and module is enabled, but the user lacks permission:

```txt
403 FORBIDDEN
```

API response:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {
      "permission": "inventory.stock_adjustment.create"
    }
  }
}
```

The `details.permission` field is safe only if it does not reveal sensitive internal policy. For MVP, it is acceptable.

---

# 29. Business Object Permission Rules

Business Objects use `objects.*` permissions.

Example Product create from Inventory UI:

```txt
objects.product.create
inventory.product_extension.create
```

If the action creates both a Product and an Inventory extension row, the service must require both permissions.

Example:

```ts
await sdk.permissions.requireAll(ctx, [
  {
    module: 'objects',
    resource: 'product',
    action: 'create',
  },
  {
    module: 'inventory',
    resource: 'product_extension',
    action: 'create',
  },
])
```

Why:

```txt
Creating the shared Product identity and creating module-specific Inventory behavior are different permissions.
```

---

# 30. Extension Table Permission Rules

Module extension tables use module permissions.

Examples:

```txt
inventory.product_extension.read
inventory.product_extension.create
inventory.product_extension.update

purchasing.supplier_extension.read
purchasing.supplier_extension.update

sales.customer_extension.read
sales.customer_extension.update
```

Do not use `objects.product.update` to modify inventory-specific reorder points.

Do not use `inventory.product_extension.update` to modify core product name/code.

---

# 31. Import Permission Rules

Import is separate from create.

Example:

```txt
objects.product.create
objects.product.import
```

Why:

```txt
Bulk import can create or modify many records at once.
```

A user who can create one Product manually should not automatically be allowed to import thousands of Products.

For MVP:

```txt
full Import Engine is deferred
founder/developer onboarding scripts may exist
```

But any client-facing import later must require explicit import permission.

---

# 32. Export Permission Rules

Export is separate from read.

Examples:

```txt
objects.customer.read
objects.customer.export

inventory.stock_movement.read
inventory.stock_movement.export

platform.report.read
platform.report.export
```

Future AI, reports, saved views, and search must respect export boundaries.

---

# 33. Approval Permission Rules

Approval permission is not the same as workflow assignment.

Example:

```txt
expenses.expense_claim.approve
```

means the user may be eligible to approve expense claims.

But a future Approval Workflow Service must also check:

```txt
Is this user assigned as an approver for this specific request?
```

For MVP:

```txt
module-local approval logic may exist
Approval Workflow Service is deferred
```

---

# 34. Page Enforcement

Server-rendered pages should resolve context and check permission before rendering sensitive data.

Example:

```ts
export default async function ProductsPage({ params }) {
  const { orgSlug } = await params

  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)

  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'product',
    action: 'read',
  })

  const products = await ProductService.list(ctx)

  return <ProductsPageClient products={products} />
}
```

Page checks prevent users from seeing screens they cannot use.

But do not rely on page checks alone.

APIs and services still enforce permissions.

---

# 35. Client Component Enforcement

Client components may receive permission flags from server-rendered context.

Example:

```tsx
<ProductListClient
  products={products}
  permissions={{
    canCreate: true,
    canUpdate: false,
    canDelete: false,
  }}
/>
```

Client components may hide buttons:

```tsx
{permissions.canCreate && <NewProductButton />}
```

But hidden buttons are not security.

The API and service must still deny the action.

---

# 36. Navigation Enforcement

Navigation should be permission-aware.

A sidebar item is visible only if:

```txt
user is authenticated
tenant context is verified
module is enabled, if module nav
user has at least one required read/access permission
```

Example:

```txt
Inventory nav visible if:
- inventory module enabled
- user has inventory.*.read or a specific declared nav permission
```

But hidden navigation is not security.

Direct URL access must still be checked.

---

# 37. Settings Permission Rules

Settings are high-risk.

Suggested permissions:

```txt
kernel.setting.read
kernel.setting.update
kernel.module.enable
kernel.module.disable
kernel.role.read
kernel.role.create
kernel.role.update
kernel.user.invite
kernel.user.deactivate
kernel.subscription.read
```

Do not allow ordinary module users to access org/module settings unless explicitly granted.

---

# 38. Role Management Permission Rules

Managing permissions is more sensitive than ordinary data access.

Suggested permissions:

```txt
kernel.role.read
kernel.role.create
kernel.role.update
kernel.role.delete
kernel.user.assign_role
```

Last-admin protection is mandatory.

A user must not be able to remove the final Admin role assignment from the organization.

---

# 39. Last-Admin Protection

Before removing or modifying admin access, the system must verify that at least one active Admin user remains.

Forbidden:

```txt
deactivate last admin
remove last admin role
delete last admin role
remove wildcard from only admin role
disable the only admin account
```

This is not optional.

Without it, a client can lock themselves out of their organization.

---

# 40. System Roles

MVP system roles:

```txt
Admin
Staff
```

Admin:

```txt
*.*.* inside the verified organization
```

Staff:

```txt
minimal permissions
usually read-only or no permissions until configured
```

System roles are org-scoped.

Do not create global roles shared across all organizations in MVP.

---

# 41. Permission Seeding

During org creation, seed:

```txt
Admin role
Staff role
Admin wildcard permission
first user assigned to Admin
subscription/trial record
```

Do not seed every possible module permission into every org by default.

When enabling a module, the system may make declared permissions available for assignment, but it should not automatically grant them to all users.

---

# 42. Module Enablement and Permission Seeding

When a module is enabled:

```txt
OrgModule is created or marked enabled
module permissions become assignable
module nav may become visible for permitted users
```

Do not automatically grant module permissions to Staff.

Founder/admin may decide whether Admin wildcard covers the module automatically. For MVP, Admin wildcard should cover all enabled modules.

---

# 43. Permission Cache

MVP may compute permissions directly from the database or load them into `PlatformContext`.

If cached in `PlatformContext`, the cache lasts only for the current request.

Do not implement long-lived permission caching yet.

Why:

```txt
Role changes should take effect quickly.
Long-lived permission caches create confusing security behavior.
```

Future caching requires invalidation rules and tests.

---

# 44. Permission Matching Algorithm

A permission grant matches a requirement if:

```txt
grant.orgId === ctx.org.id
AND module matches exact or '*'
AND resource matches exact or '*'
AND action matches exact or '*'
AND conditions is null
```

Pseudo-code:

```ts
function matches(grant, requirement) {
  if (grant.orgId !== ctx.org.id) return false

  const moduleMatches =
    grant.module === requirement.module || grant.module === '*'

  const resourceMatches =
    grant.resource === requirement.resource || grant.resource === '*'

  const actionMatches =
    grant.action === requirement.action || grant.action === '*'

  const conditionsSupported = grant.conditions == null

  return moduleMatches && resourceMatches && actionMatches && conditionsSupported
}
```

If `conditions` is not null in MVP:

```txt
deny
```

---

# 45. Resource Must Be Non-Null

`Permission.resource` should be non-null.

Use wildcard `'*'` instead of `null`.

Correct:

```txt
module = inventory
resource = *
action = read
```

Incorrect:

```txt
module = inventory
resource = null
action = read
```

Why:

```txt
PostgreSQL uniqueness behavior with nullable fields can allow duplicate-looking permissions.
A wildcard string is clearer and safer.
```

---

# 46. Testing Requirements

Permission enforcement tests must cover:

```txt
authenticated admin allowed
authenticated staff denied
unauthenticated user receives 401 JSON
wrong-org user receives safe 404
module-disabled org receives safe 404
missing permission receives 403 JSON
wildcard permission works inside verified org
wildcard permission does not cross tenant boundary
client-supplied orgId is rejected
conditions non-null is denied
read does not imply export
create does not imply import
soft-deleted records are not accessible through permissioned reads
```

Single-organization tests are not enough.

Always include at least two organizations in security-sensitive tests.

---

# 47. Required Test Matrix

Minimum test data:

```txt
Org A
Org B

Org A Admin
Org A Staff with read only
Org A Staff without permission
Org B Admin

Inventory enabled for Org A
Inventory disabled for Org B

Product in Org A
Product in Org B
Soft-deleted Product in Org A
```

Test cases:

| Case | Expected Result |
|---|---|
| Org A Admin reads Org A product | `200` |
| Org A Staff with read reads Org A product | `200` |
| Org A Staff without read reads Org A product | `403` |
| Unauthenticated user reads Org A product | `401` |
| Org A Admin reads Org B product by guessed ID | safe `404` |
| Org B Admin reads Org A product by guessed ID | safe `404` |
| Org A Admin accesses disabled module route | `404 MODULE_NOT_FOUND` |
| Org A user submits `orgId` in body | `400 TENANT_ID_NOT_ALLOWED` |
| Org A user with read exports products | `403` unless export granted |
| Org A user reads soft-deleted product | safe `404` |

---

# 48. Architecture Checks

The platform should include an architecture check command:

```bash
npm run check:architecture
```

It should fail on forbidden patterns.

Forbidden patterns include:

```txt
modules/* importing @/kernel/*
modules/* importing @/kernel/db/client
modules/* importing from another module
sdk.getDb(orgId)
where: { orgId: input.orgId }
request.nextUrl.searchParams.get('orgId')
body.orgId
requireAuth() inside API routes if it redirects
API route without permission requirement
service public mutation without permission requirement
findUnique({ where: { id } }) on tenant-scoped models
module manifest declaring wildcard permissions
```

This check should be implemented before official modules are built.

---

# 49. Generator Requirements

The Module Generator must generate permission-safe code.

Generated API routes must include:

```txt
API-safe auth/context helper
tenant context resolution
module enablement check
Zod validation
client-supplied orgId rejection
permission enforcement
standard JSON responses
```

Generated services must include:

```txt
PlatformContext argument
sdk.getDb(ctx)
permission enforcement
tenant-scoped queries
soft delete where applicable
event emission where applicable
```

Generated tests must include:

```txt
401 unauthenticated
403 missing permission
404 wrong org
404 module disabled
400 client-supplied orgId
successful authorized operation
```

The generator must not output TODOs like:

```txt
// TODO: add permission check
```

Security cannot be a TODO.

---

# 50. Future Platform Service Permission Rules

Future Platform Services must follow the same enforcement model.

Example:

```ts
await sdk.permissions.require(ctx, {
  module: 'platform',
  resource: 'audit',
  action: 'read',
})
```

Platform Services must not create their own permission models.

They use the same Kernel RBAC system.

---

# 51. Future AI Permission Rules

Future AI features must call permission-aware services.

AI must not:

```txt
query database directly
execute SQL
execute raw Prisma queries
read full tenant database
use hidden privileged service role logic
return data from disabled modules
return soft-deleted records
summarize records the user cannot access
export data without export permission
```

AI can only operate through approved SDK/service APIs using verified `PlatformContext`.

---

# 52. Future Background Job Permission Rules

Background jobs do not have a live user session.

Future background jobs must carry a safe job context.

Possible future shape:

```ts
type JobContext = {
  orgId: string
  actorType: 'user' | 'system'
  actorUserId?: string
  reason: string
}
```

But this is deferred.

Do not implement background job permissions in MVP.

For now:

```txt
Background Jobs Service is deferred.
```

---

# 53. Error Codes

Permission-related error codes:

```txt
UNAUTHENTICATED
ORG_NOT_FOUND
ORG_INACTIVE
MODULE_NOT_FOUND
FORBIDDEN
TENANT_ID_NOT_ALLOWED
VALIDATION_ERROR
```

Suggested mapping:

| Situation | Status | Code |
|---|---:|---|
| No session | `401` | `UNAUTHENTICATED` |
| Wrong org / no membership | `404` | `ORG_NOT_FOUND` |
| Suspended org trying to use module | `403` | `ORG_INACTIVE` |
| Module disabled | `404` | `MODULE_NOT_FOUND` |
| Missing permission | `403` | `FORBIDDEN` |
| Client sends `orgId` | `400` | `TENANT_ID_NOT_ALLOWED` |
| Invalid request body | `400` | `VALIDATION_ERROR` |

---

# 54. UI Permission Denied States

When a user reaches a page they cannot access, prefer a calm permission-denied state.

Example copy:

```txt
You do not have access to this area.

Ask your organization administrator if you believe this is a mistake.
```

Do not show:

```txt
stack traces
permission internals
role IDs
other organization names
raw policy data
```

For wrong-org access, show not found.

---

# 55. Observability

Permission denials should be logged server-side at a safe level.

Log:

```txt
timestamp
orgId
userId
route
permission requirement
result
reason
```

Do not log:

```txt
passwords
tokens
full request bodies
sensitive field values
full business records
```

Audit Log Service is deferred, but basic security logging may still exist.

---

# 56. Anti-Patterns

## Anti-pattern: Auth-only API

```ts
await sdk.auth.requireApiAuth(req)
return Service.create(input)
```

Why bad:

```txt
Login does not mean permission.
```

## Anti-pattern: UI-only permission check

```tsx
{canDelete && <DeleteButton />}
```

but API allows delete anyway.

Why bad:

```txt
Users can call APIs directly.
```

## Anti-pattern: Loose orgId

```ts
Service.list(orgId)
```

Why bad:

```txt
The service cannot know whether orgId is verified.
```

## Anti-pattern: Admin bypasses module enablement

```txt
Admin can access Inventory even if Inventory disabled
```

Why bad:

```txt
Commercial module access and user permission are separate.
```

## Anti-pattern: Business Object under module namespace

```txt
inventory.product.update
```

Why bad:

```txt
Product is shared and belongs to objects.product.
```

## Anti-pattern: wildcard in manifest

```txt
module manifest declares *.*.*
```

Why bad:

```txt
Modules declare capabilities; roles grant permissions.
```

---

# 57. Claude Implementation Rules

When implementing permission enforcement, Claude must:

```txt
use verified PlatformContext
use API-safe auth helpers
use sdk.permissions.require for protected operations
use sdk.getDb(ctx), never sdk.getDb(orgId)
reject client-supplied orgId
return JSON errors only
test 401 / 403 / 404 / validation / success
test at least two organizations
test non-admin denied paths
test wildcard admin paths
avoid raw Prisma in modules
avoid @/kernel imports from modules
avoid module-to-module imports
```

Claude must not:

```txt
use redirect-based requireAuth in API routes
skip permission checks because UI hides buttons
add TODO permission comments
grant Staff all permissions by default
treat Admin as cross-tenant superuser
implement ABAC conditions
implement field-level permissions
implement branch-scoped permissions
implement per-record ownership rules
implement RLS from this document alone
```

---

# 58. Acceptance Criteria

This document is satisfied when the restarted foundation build has:

```txt
[ ] API-safe auth/context helpers
[ ] verified PlatformContext
[ ] org membership checked before permissions
[ ] module enablement checked before module permissions
[ ] sdk.permissions.can(ctx, requirement)
[ ] sdk.permissions.require(ctx, requirement)
[ ] wildcard permission matching inside verified org only
[ ] conditions denied when non-null
[ ] resource non-null wildcard model
[ ] API route permission pattern
[ ] service permission pattern
[ ] Business Object permission namespace
[ ] module permission namespace
[ ] kernel permission namespace
[ ] export/import separated from read/create
[ ] last-admin protection
[ ] two-org permission tests
[ ] non-admin denial tests
[ ] architecture check for forbidden patterns
[ ] generator emits permission-safe code
```

---

# 59. Production Readiness Gate

Before onboarding a second tenant:

```txt
[ ] wrong-org route access returns safe 404
[ ] wrong-org API access returns safe 404
[ ] unauthenticated API returns 401 JSON
[ ] authenticated but unauthorized API returns 403 JSON
[ ] module-disabled access returns safe 404
[ ] admin wildcard works only inside verified organization
[ ] Staff without permission cannot read or mutate protected records
[ ] client-supplied orgId is rejected
[ ] generated module includes permission tests
[ ] generated module includes tenant isolation tests
[ ] all protected mutations enforce permissions in services
```

No official module should be implemented before this gate passes.

---

# 60. Final Rule

The final rule is:

```txt
Authentication proves who the user is.
Tenant isolation proves where the user belongs.
Module enablement proves what the organization purchased.
Permission enforcement proves what the user may do.
```

All four are required.

OneDayOS must not repeat the old MVP mistake of having permissions that exist but are not enforced.

