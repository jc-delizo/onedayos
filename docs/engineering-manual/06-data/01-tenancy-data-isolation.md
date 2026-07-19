# OneDayOS Engineering Manual — 06 Data / 01 Tenancy Data Isolation

**Document ID:** `06-data/01-tenancy-data-isolation.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** No — implementation allowed only after Founder approval/freeze  
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
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/00-database-architecture.md`

---

# 1. Purpose

This document defines how OneDayOS isolates tenant data inside one shared PostgreSQL database.

OneDayOS serves many client organizations from one platform. Each client organization is a tenant. All tenant-scoped records must be separated by `orgId`, and every protected operation must use a verified `PlatformContext` derived by the Kernel.

Tenant isolation is not an optional security feature. It is one of the foundations that makes OneDayOS commercially possible.

If tenant isolation fails, OneDayOS fails as a platform.

---

# 2. Core Decision

OneDayOS MVP uses:

```txt
One PostgreSQL database
+ shared tables
+ required orgId on tenant-scoped records
+ verified PlatformContext
+ SDK-only database access
+ tenant-isolation tests
```

OneDayOS MVP does **not** use:

```txt
separate database per client
separate schema per client
separate app deployment per client
client-supplied orgId
module-level raw Prisma access
FastAPI database layer
RLS as the primary isolation mechanism
```

RLS is planned as a future defense-in-depth layer, but MVP tenant isolation is enforced in application code, service contracts, SDK database access, and regression tests.

---

# 3. Tenancy Mental Model

OneDayOS should be understood as:

```txt
OneDayOS Platform
  ├── Organization: Client A
  │     ├── Users
  │     ├── Roles
  │     ├── Employees
  │     ├── Products
  │     ├── Inventory records
  │     └── Settings
  │
  ├── Organization: Client B
  │     ├── Users
  │     ├── Roles
  │     ├── Employees
  │     ├── Products
  │     ├── Leave records
  │     └── Settings
  │
  └── Organization: Client C
        ├── Users
        ├── Roles
        ├── CRM records
        └── Settings
```

Each organization shares the same application code and database schema, but its data is isolated by `orgId`.

This means platform updates apply to all organizations, while data access remains tenant-scoped.

---

# 4. Terms

## 4.1 Tenant

A tenant is a customer organization using OneDayOS.

In the database, the tenant is represented by:

```txt
Organization
```

In code, the tenant boundary is represented by:

```ts
PlatformContext.orgId
```

## 4.2 Organization

An `Organization` is the root tenant record.

Examples:

```txt
Acme Manufacturing
Mabuhay Dental Clinic
Northstar Trading
```

## 4.3 orgId

`orgId` is the internal tenant identifier used in database rows.

It is not trusted from client input.

## 4.4 orgSlug

`orgSlug` is the URL locator.

Example:

```txt
/acme-manufacturing/dashboard
/api/orgs/acme-manufacturing/inventory/products
```

`orgSlug` is not authorization. It only identifies which organization the user is trying to access.

The server must verify that the authenticated user belongs to the organization represented by the slug.

## 4.5 PlatformContext

`PlatformContext` is the verified runtime identity object used by APIs, services, SDK helpers, database access, and events.

It is created only by Kernel auth/context helpers.

Simplified shape:

```ts
export type PlatformContext = {
  requestId: string
  authUserId: string
  userId: string
  orgId: string
  orgSlug: string
  orgStatus: 'active' | 'trial' | 'suspended' | 'cancelled'
  roleIds: string[]
  permissions: PermissionGrant[]
  enabledModuleIds: string[]
}
```

The exact type belongs in the SDK public API document, but this document defines its data-isolation purpose.

---

# 5. Non-Negotiable Rules

## Rule 1 — Every tenant-scoped table has `orgId`

Every table containing customer-owned data must include:

```prisma
orgId String
org   Organization @relation(fields: [orgId], references: [id])
```

This applies to:

```txt
Users
Roles
Permissions
UserRoles
Branches
Departments
Employees
Settings
OrgModules
Business Objects
Business Object extension tables
Module-owned tables
Future platform service tables
```

## Rule 2 — Never trust client-supplied `orgId`

The client must not submit `orgId` in query params, request bodies, form payloads, hidden fields, local storage, cookies, or headers.

Bad:

```ts
const orgId = body.orgId
```

Bad:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

Good:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const orgId = ctx.orgId
```

Tenant identity is derived from:

```txt
authenticated Supabase user
+ platform User record
+ requested orgSlug
+ membership check
```

## Rule 3 — Services receive `PlatformContext`, not `orgId`

Bad:

```ts
InventoryService.list(orgId)
```

Good:

```ts
InventoryService.list(ctx)
```

`PlatformContext` proves that the caller has already passed the Kernel identity and tenancy checks.

## Rule 4 — Modules use `sdk.getDb(ctx)`, not Prisma

Bad:

```ts
import { prisma } from '@/kernel/db/client'
```

Good:

```ts
import { sdk } from '@/sdk/server'

const db = sdk.getDb(ctx)
```

Modules must not import Kernel internals.

## Rule 5 — Every tenant query includes `orgId`

Bad:

```ts
await db.product.findFirst({
  where: { id: productId },
})
```

Good:

```ts
await db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.orgId,
    deletedAt: null,
  },
})
```

## Rule 6 — No `findUnique` by ID on tenant-scoped models in module code

This is forbidden because `id` is globally unique and can bypass tenant scoping if used alone.

Bad:

```ts
await db.product.findUnique({
  where: { id: productId },
})
```

Good:

```ts
await db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.orgId,
    deletedAt: null,
  },
})
```

Acceptable only for Kernel internals after context has already been validated and the model is not tenant-scoped.

## Rule 7 — Wrong organization access returns safe failure

If a user from Org A requests Org B, the response must not reveal whether Org B exists.

For APIs:

```txt
404 ORG_NOT_FOUND
```

For pages:

```txt
notFound()
```

Do not return:

```txt
403 You are not a member of Mabuhay Dental Clinic
```

That leaks tenant existence.

## Rule 8 — Admin wildcard does not bypass tenancy

Admin may have:

```txt
*.*.*
```

But only inside the verified organization.

Admin from Org A cannot access Org B.

Tenant membership is checked before permission matching.

## Rule 9 — Events must be tenant-scoped

All emitted events must include tenant context through `PlatformContext` and normalized `EventEnvelope` metadata.

Bad:

```ts
await sdk.events.emit('objects.product.created', product)
```

Good:

```ts
await sdk.events.emit(ctx, 'objects.product.created', {
  productId: product.id,
})
```

Events must not become cross-tenant data leaks.

## Rule 10 — Generated modules must be tenant-safe by default

Module generators must create secure patterns automatically.

Generated code must not contain:

```txt
orgId in client schemas
/api/[module]?orgId=...
sdk.getDb(orgId)
findUnique({ where: { id } }) on tenant models
API routes without context helpers
services accepting loose orgId
permission checks that rely only on UI hiding
```

---

# 6. Tenant Boundary Classification

Not all tables are tenant-scoped in the same way.

## 6.1 Global platform tables

These tables are global or platform-internal.

| Table | Tenant-Scoped? | Notes |
|---|---:|---|
| `Organization` | No | Root tenant record itself. Slug must be globally unique. |
| Future `PlatformOperator` | No | For OneDayOS internal support, not MVP. |
| Future `SystemMigrationLog` | No | Platform-wide migration tracking. |

Even though `Organization` does not have `orgId`, it is the root of tenant ownership.

## 6.2 Kernel tenant tables

| Table | Requires `orgId`? | Notes |
|---|---:|---|
| `User` | Yes | MVP user belongs to one org. |
| `Role` | Yes | Roles are org-scoped. |
| `Permission` | Yes | Permissions are org-scoped even if role also has orgId. |
| `UserRole` | Yes | User-role grants are org-scoped. |
| `Subscription` | Yes or unique `orgId` | Subscription belongs to one org. |
| `OrgModule` | Yes | Module enablement is per org. |
| `Setting` | Yes | Settings are per org and module. |
| `Branch` | Yes | Kernel org structure. |
| `Department` | Yes | Kernel org structure. |

## 6.3 Business Objects

| Table | Requires `orgId`? | Notes |
|---|---:|---|
| `Employee` | Yes | Shared business/personnel object. |
| `Product` | Yes | Shared business object. |
| `ProductCategory` | Yes | Shared product taxonomy. |
| `Customer` | Yes | Shared business object. |
| `Supplier` | Yes | Shared business object. |
| `Warehouse` | Yes | Shared operational object. |

## 6.4 Module-owned tables

Every module-owned table requires `orgId`.

Examples:

| Module | Table | Requires `orgId`? |
|---|---|---:|
| Inventory | `InventoryStockBalance` | Yes |
| Inventory | `InventoryStockMovement` | Yes |
| Leave | `LeaveRequest` | Yes |
| CRM | `CrmDeal` | Yes |
| Purchasing | `PurchaseRequest` | Yes |
| Assets | `AssetAssignment` | Yes |

## 6.5 Platform Service tables

Future Platform Service tables also require `orgId` unless they are explicitly platform-global.

Examples:

| Service | Table | Requires `orgId`? |
|---|---|---:|
| Audit Log | `AuditEvent` | Yes |
| Notifications | `Notification` | Yes |
| Approvals | `ApprovalRequest` | Yes |
| Comments | `Comment` | Yes |
| Attachments | `Attachment` | Yes |
| Reporting | `SavedReport` | Yes |
| Search | `SearchIndex` | Yes |

---

# 7. Required Database Modeling Patterns

## 7.1 Basic tenant-scoped model pattern

Every tenant-scoped model must include this shape:

```prisma
model ExampleRecord {
  id        String   @id @default(cuid())
  orgId     String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  deletedBy String?

  org Organization @relation(fields: [orgId], references: [id], onDelete: Restrict)

  @@index([orgId])
  @@index([orgId, deletedAt])
  @@map("example_records")
}
```

## 7.2 Tenant-scoped uniqueness

Uniqueness for business records is usually per organization.

Bad:

```prisma
code String @unique
```

Good:

```prisma
code String
@@unique([orgId, code])
```

Examples:

```prisma
@@unique([orgId, employeeNo])
@@unique([orgId, code])
@@unique([orgId, module, key])
@@unique([orgId, moduleId])
@@unique([orgId, name])
```

## 7.3 Compound relationship safety

When a module-owned table references a Business Object, it must include `orgId` and ensure the referenced object belongs to the same organization.

Recommended pattern:

```prisma
model Product {
  id    String @id @default(cuid())
  orgId String
  code  String
  name  String

  @@unique([orgId, id])
  @@unique([orgId, code])
  @@map("products")
}

model InventoryProductExtension {
  id        String @id @default(cuid())
  orgId     String
  productId String

  reorderPoint Int?
  minimumStock Int?

  org     Organization @relation(fields: [orgId], references: [id], onDelete: Restrict)
  product Product      @relation(fields: [orgId, productId], references: [orgId, id], onDelete: Restrict)

  @@unique([orgId, productId])
  @@index([orgId])
  @@map("inventory_product_extensions")
}
```

This prevents an Org A extension row from pointing to an Org B product.

If Prisma relation limitations make this pattern difficult in a specific case, Claude must stop and request an ADR rather than weakening tenant isolation.

## 7.4 User-role assignment safety

`UserRole` must include `orgId`.

Recommended shape:

```prisma
model UserRole {
  orgId  String
  userId String
  roleId String

  org  Organization @relation(fields: [orgId], references: [id], onDelete: Restrict)
  user User         @relation(fields: [orgId, userId], references: [orgId, id], onDelete: Cascade)
  role Role         @relation(fields: [orgId, roleId], references: [orgId, id], onDelete: Cascade)

  @@id([orgId, userId, roleId])
  @@map("user_roles")
}
```

This requires `User` and `Role` to expose compound uniqueness:

```prisma
@@unique([orgId, id])
```

Reason: user-role assignments must not be able to connect a user in one organization to a role in another organization.

## 7.5 Permission safety

`Permission` must include `orgId` even though it belongs to a role.

Recommended shape:

```prisma
model Permission {
  id         String @id @default(cuid())
  orgId      String
  roleId     String
  module     String
  resource   String
  action     String
  conditions Json?

  org  Organization @relation(fields: [orgId], references: [id], onDelete: Restrict)
  role Role         @relation(fields: [orgId, roleId], references: [orgId, id], onDelete: Cascade)

  @@unique([orgId, roleId, module, resource, action])
  @@index([orgId, module, resource, action])
  @@map("permissions")
}
```

`resource` is non-null. Wildcards use `'*'`.

Bad:

```prisma
resource String?
```

Good:

```prisma
resource String
```

Reason: nullable fields weaken uniqueness behavior and make wildcard matching ambiguous.

---

# 8. Canonical Request Flow

## 8.1 Page route flow

For a protected organization page:

```txt
GET /acme/dashboard
```

Required flow:

```txt
1. Read Supabase session.
2. If no session, redirect to /login.
3. Load platform User by session.user.id.
4. Load Organization by orgSlug.
5. Verify user.orgId === org.id.
6. Verify user.isActive.
7. Verify org/subscription status permits access.
8. Create PlatformContext.
9. Render page using ctx.
```

Pseudocode:

```ts
export default async function Page({ params }: PageProps) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)

  const data = await SomeService.list(ctx)

  return <SomePage data={data} />
}
```

## 8.2 API route flow

For a protected organization API:

```txt
POST /api/orgs/acme/inventory/products
```

Required flow:

```txt
1. Use SDK API handler wrapper.
2. Parse orgSlug from route params.
3. Require API auth.
4. Load platform User by session.user.id.
5. Load Organization by orgSlug.
6. Verify user.orgId === org.id.
7. Verify org/subscription status.
8. Verify module is enabled if module API.
9. Verify permission.
10. Validate request body.
11. Call service with PlatformContext.
12. Return { data, error } JSON.
```

Pseudocode:

```ts
export const POST = sdk.api.handleOrgRoute(
  async (req, { params }) => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'create',
    })

    const input = await sdk.api.parseJson(req, CreateProductSchema)
    const product = await InventoryProductService.create(ctx, input)

    return sdk.api.created(product)
  }
)
```

## 8.3 Service flow

Services must assume they are operating inside a verified tenant context.

```ts
export class InventoryProductService {
  static async list(ctx: PlatformContext) {
    const db = sdk.getDb(ctx)

    return db.product.findMany({
      where: {
        orgId: ctx.orgId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    })
  }
}
```

Services must not resolve organizations themselves unless that is their explicit Kernel responsibility.

---

# 9. API URL Rules

## 9.1 Tenant APIs must include `orgSlug` in the path

Good:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/inventory/stock-movements
/api/orgs/[orgSlug]/settings
```

Bad:

```txt
/api/products?orgId=...
/api/inventory?orgId=...
/api/settings?orgId=...
```

The path identifies intended tenant context. The server still verifies membership.

## 9.2 Current user API is not tenant-specific

The current authenticated user endpoint is:

```txt
GET /api/kernel/auth/me
```

It returns only the current session user and their organization summary.

Bad:

```txt
GET /api/kernel/users/[id]
```

Reason: ID-based user lookup invites IDOR mistakes.

## 9.3 Kernel setup APIs must be explicit

Examples:

```txt
POST /api/kernel/auth/register
GET  /api/kernel/auth/me
```

These APIs must still return `{ data, error }` JSON and must not leak tenant data.

---

# 10. Client-Supplied orgId Rejection

Tenant-scoped APIs should reject request payloads containing `orgId`.

Example helper behavior:

```ts
function rejectClientOrgId(input: unknown) {
  if (input && typeof input === 'object' && 'orgId' in input) {
    throw new ApiError({
      code: 'CLIENT_ORG_ID_FORBIDDEN',
      message: 'orgId is server-derived and must not be submitted by clients.',
      status: 400,
    })
  }
}
```

This is stricter than silently ignoring `orgId`.

Reason:

```txt
Rejecting orgId teaches generated code and developers the correct boundary.
Ignoring orgId can hide dangerous assumptions.
```

All create/update schemas for tenant-scoped module forms must omit `orgId`.

Bad schema:

```ts
export const CreateProductSchema = z.object({
  orgId: z.string(),
  name: z.string(),
})
```

Good schema:

```ts
export const CreateProductSchema = z.object({
  name: z.string(),
})
```

The service adds `orgId` from context:

```ts
await db.product.create({
  data: {
    orgId: ctx.orgId,
    name: input.name,
  },
})
```

---

# 11. Query Rules

## 11.1 List queries

Every tenant list query includes `orgId`.

```ts
await db.product.findMany({
  where: {
    orgId: ctx.orgId,
    deletedAt: null,
  },
})
```

## 11.2 Detail queries

Every detail query includes both `id` and `orgId`.

```ts
await db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.orgId,
    deletedAt: null,
  },
})
```

## 11.3 Update queries

Update must first verify tenant ownership, then mutate.

Preferred pattern:

```ts
const existing = await db.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.orgId,
    deletedAt: null,
  },
  select: { id: true },
})

if (!existing) throw sdk.errors.notFound('PRODUCT_NOT_FOUND')

const product = await db.product.update({
  where: { id: existing.id },
  data: { name: input.name },
})
```

Alternative if Prisma supports safe compound unique for the model:

```ts
await db.product.update({
  where: {
    orgId_id: {
      orgId: ctx.orgId,
      id: productId,
    },
  },
  data: { name: input.name },
})
```

Do not use ID-only update on tenant-scoped records unless ownership was verified immediately before mutation in the same service function.

## 11.4 Delete queries

Business data uses soft delete.

```ts
await db.product.update({
  where: { id: existing.id },
  data: {
    deletedAt: new Date(),
    deletedBy: ctx.userId,
  },
})
```

Hard delete is reserved for:

```txt
failed registration rollback
test cleanup
temporary non-business records
explicitly approved admin/system maintenance
```

## 11.5 Count queries

Counts are tenant-scoped.

```ts
await db.product.count({
  where: {
    orgId: ctx.orgId,
    deletedAt: null,
  },
})
```

## 11.6 Aggregate and groupBy queries

Aggregates must include `orgId`.

Bad:

```ts
await db.stockMovement.groupBy({
  by: ['productId'],
  _sum: { quantity: true },
})
```

Good:

```ts
await db.stockMovement.groupBy({
  by: ['productId'],
  where: {
    orgId: ctx.orgId,
    deletedAt: null,
  },
  _sum: { quantity: true },
})
```

This matters because soft-delete Prisma extensions often do not cover every query operation.

## 11.7 Nested relation reads

Nested relation includes can accidentally leak data if relationships are modeled incorrectly.

Preferred approach:

```ts
await db.inventoryStockMovement.findMany({
  where: { orgId: ctx.orgId },
  include: {
    product: {
      select: {
        id: true,
        code: true,
        name: true,
      },
    },
  },
})
```

But this is safe only if the relation itself enforces same-org ownership through compound relation patterns.

If same-org relation cannot be enforced at the schema level, avoid nested include and fetch related records using explicit tenant-scoped queries.

---

# 12. Soft Delete and Tenancy

Soft delete is not a substitute for tenant isolation.

Every soft-deletable tenant model needs both:

```txt
orgId filter
+ deletedAt filter
```

Good:

```ts
where: {
  orgId: ctx.orgId,
  deletedAt: null,
}
```

Bad:

```ts
where: {
  deletedAt: null,
}
```

Bad:

```ts
where: {
  orgId: ctx.orgId,
}
```

The restarted platform may use Prisma helpers/extensions to inject `deletedAt: null`, but module services should still be explicit in critical queries until the soft-delete behavior is fully tested.

Known risk from the previous MVP: soft-delete extensions can miss query types like `findUnique`, `aggregate`, `groupBy`, and nested reads. Therefore, this manual requires explicit tenant and deletion filters in service-level query patterns.

---

# 13. Authorization Order

Tenant isolation must happen before permission matching.

Correct order:

```txt
1. Authentication
2. Platform User lookup
3. Organization lookup by slug
4. Membership check: user.orgId === org.id
5. Org status check
6. Module enablement check
7. Permission check
8. Validation
9. Service operation
10. Event emission
```

Why tenant before permission?

Because permissions are organization-scoped.

A wildcard admin permission in Org A has no meaning in Org B.

---

# 14. Module Enablement and Tenancy

Module enablement is tenant-scoped.

Example:

```txt
Client A has Inventory enabled.
Client B does not.
```

Both clients run the same codebase, but only Client A can access Inventory routes.

`OrgModule` must include:

```prisma
orgId    String
moduleId String
isEnabled Boolean
```

Unique constraint:

```prisma
@@unique([orgId, moduleId])
```

Access flow:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

This helper must verify:

```txt
user is authenticated
user belongs to orgSlug
organization is active enough for module access
module is enabled for org
```

Then permission checks can run.

---

# 15. Settings and Tenancy

Settings are tenant-scoped.

Recommended shape:

```prisma
model Setting {
  id        String   @id @default(cuid())
  orgId     String
  module    String
  key       String
  value     Json
  updatedAt DateTime @updatedAt

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([orgId, module, key])
  @@index([orgId, module])
  @@map("settings")
}
```

Bad:

```ts
await db.setting.findFirst({
  where: { module: 'inventory', key: 'lowStockThreshold' },
})
```

Good:

```ts
await db.setting.findFirst({
  where: {
    orgId: ctx.orgId,
    module: 'inventory',
    key: 'lowStockThreshold',
  },
})
```

Settings must not be cached globally unless the cache key includes `orgId`.

Bad cache key:

```txt
settings:inventory
```

Good cache key:

```txt
settings:{orgId}:inventory
```

---

# 16. Events and Tenancy

Every event emitted from tenant-scoped operations must include tenant context.

Event envelope should include:

```ts
export type EventEnvelope<TPayload> = {
  id: string
  name: string
  orgId: string
  actorUserId: string
  occurredAt: string
  source: string
  payload: TPayload
}
```

Example:

```ts
await sdk.events.emit(ctx, 'objects.product.created', {
  productId: product.id,
})
```

Listeners must treat `event.orgId` as the tenant boundary.

Bad listener:

```ts
sdk.events.on('objects.product.created', async (event) => {
  await search.indexProduct(event.payload.productId)
})
```

Good listener:

```ts
sdk.events.on('objects.product.created', async (event) => {
  await search.indexProduct({
    orgId: event.orgId,
    productId: event.payload.productId,
  })
})
```

Future outbox/background jobs must preserve `orgId` in the job payload.

---

# 17. Background Jobs and Tenancy

Background jobs are deferred, but their future design must preserve tenant isolation.

Every future job must include:

```ts
type JobEnvelope<TPayload> = {
  jobId: string
  orgId: string
  actorUserId?: string
  source: string
  name: string
  payload: TPayload
}
```

Bad:

```ts
queue.add('send-low-stock-alert', { productId })
```

Good:

```ts
queue.add('send-low-stock-alert', {
  orgId: ctx.orgId,
  productId,
})
```

Job handlers must reconstruct a service-safe context or use a dedicated system context scoped to the same `orgId`.

No background job may query tenant data without an explicit `orgId`.

---

# 18. Search, Reporting, and AI Tenancy

Search, reporting, and AI are especially high-risk because they often aggregate data.

These services are deferred, but this document defines the tenant rule now.

## 18.1 Search

Search indexes must include `orgId`.

Search queries must filter by `orgId` and permissions.

Bad:

```ts
search.query('product name')
```

Good:

```ts
search.query(ctx, 'product name')
```

## 18.2 Reporting

Reports must be scoped to one organization unless a future OneDayOS internal operator system explicitly supports cross-tenant analytics.

Bad:

```sql
SELECT COUNT(*) FROM products;
```

Good:

```sql
SELECT COUNT(*) FROM products WHERE org_id = $1;
```

## 18.3 AI

AI context must include `orgId` and user permissions.

AI must never query globally.

Bad:

```txt
Find all customers named Santos.
```

Good:

```txt
Find customers named Santos inside ctx.orgId, limited to records this user may read.
```

AI is not allowed to bypass tenant isolation.

---

# 19. Caching and Tenancy

Any cache that stores tenant data must include `orgId` in its key.

Bad:

```txt
products:list
user-permissions:{userId}
settings:inventory
```

Good:

```txt
products:{orgId}:list
user-permissions:{orgId}:{userId}
settings:{orgId}:inventory
```

Cache invalidation events must also include `orgId`.

No tenant data may be cached in a global singleton without tenant-aware keys.

---

# 20. File Storage and Tenancy

Supabase Storage and attachments are deferred, but file storage must follow the same boundary.

Recommended path pattern:

```txt
orgs/{orgId}/attachments/{attachmentId}/{filename}
orgs/{orgId}/imports/{importId}/{filename}
orgs/{orgId}/exports/{exportId}/{filename}
```

Bad:

```txt
attachments/{filename}
```

Attachment metadata table must include `orgId`.

Signed URL generation must verify context before creating a URL.

---

# 21. Logs and Tenancy

Application logs may include `orgId`, but must not include sensitive customer data.

Good log metadata:

```ts
logger.info('Product created', {
  requestId: ctx.requestId,
  orgId: ctx.orgId,
  userId: ctx.userId,
  productId: product.id,
})
```

Bad:

```ts
logger.info('Product created', product)
```

Logs should support tenant-aware debugging without leaking full records.

---

# 22. Tenant Isolation Threat Model

The restarted platform must defend against these mistakes and attacks.

## 22.1 Guessed org slug

Attack:

```txt
User from /client-a tries /client-b/dashboard
```

Required outcome:

```txt
notFound() or safe 404
```

## 22.2 Client-supplied orgId

Attack:

```json
{
  "orgId": "org_b",
  "name": "Fake Product"
}
```

Required outcome:

```txt
400 CLIENT_ORG_ID_FORBIDDEN
```

## 22.3 IDOR by record ID

Attack:

```txt
User from Org A calls /api/orgs/org-a/products/product_id_from_org_b
```

Required outcome:

```txt
404 PRODUCT_NOT_FOUND
```

## 22.4 IDOR by user ID

Attack:

```txt
GET /api/kernel/users/some-other-user-id
```

Required outcome:

```txt
Endpoint should not exist for normal current-user lookup.
Use /api/kernel/auth/me.
```

## 22.5 Permission bypass

Attack:

```txt
Staff user hides button in UI but calls API directly.
```

Required outcome:

```txt
403 PERMISSION_DENIED
```

## 22.6 Module disabled bypass

Attack:

```txt
Client without Inventory enabled calls Inventory API.
```

Required outcome:

```txt
403 MODULE_NOT_ENABLED
```

or safe module not found response according to Kernel API contract.

## 22.7 Suspended organization access

Attack:

```txt
User from suspended org logs in and calls module API.
```

Required outcome:

```txt
403 ORG_SUSPENDED
```

Auth may still work, but module access is blocked.

## 22.8 Nested include leak

Attack:

```txt
A module relation points to a Product from another org and include loads it.
```

Required outcome:

```txt
Schema constraints prevent invalid relation,
or service code refuses unsafe include patterns.
```

## 22.9 Background job leak

Attack:

```txt
Job runs with productId only and indexes product from wrong org.
```

Required outcome:

```txt
Job payload includes orgId and handler filters by orgId.
```

---

# 23. Testing Requirements

Tenant isolation must be proven by tests.

Single-organization tests are insufficient.

Always-admin tests are insufficient.

## 23.1 Required test fixture

Every security-sensitive test suite should create at least:

```txt
Organization A
Organization B
Admin User A in Organization A
Admin User B in Organization B
Staff User A in Organization A
Role A with limited permissions
Business record A in Organization A
Business record B in Organization B
```

Example fixture names:

```ts
const fixtures = {
  orgA,
  orgB,
  adminA,
  adminB,
  staffA,
  productA,
  productB,
}
```

## 23.2 Required page tests

```txt
[ ] Authenticated user can load own org page
[ ] Authenticated user cannot load another org page
[ ] Unauthenticated user redirects to login
[ ] Suspended org blocks module pages
```

## 23.3 Required API tests

```txt
[ ] Unauthenticated tenant API returns 401 JSON
[ ] User from Org A cannot read Org B record
[ ] User from Org A cannot mutate Org B record
[ ] User from Org A cannot use Org B slug
[ ] Client-supplied orgId is rejected
[ ] Staff without permission receives 403 JSON
[ ] Admin wildcard works only inside own org
[ ] Disabled module blocks access
[ ] Validation errors do not bypass tenant checks
```

## 23.4 Required service tests

```txt
[ ] Service list only returns ctx.orgId records
[ ] Service detail query includes ctx.orgId
[ ] Service update refuses other-org record
[ ] Service soft delete refuses other-org record
[ ] Service emits events with ctx.orgId
[ ] Service never accepts loose orgId
```

## 23.5 Required generated module tests

Every generated module must include tests for:

```txt
[ ] list is tenant-scoped
[ ] create uses ctx.orgId
[ ] create rejects body.orgId
[ ] update cannot mutate another org
[ ] delete cannot delete another org
[ ] permission denied path returns 403
[ ] module disabled path is blocked
[ ] event envelope includes orgId
```

## 23.6 Required architecture tests

The codebase should eventually include a script such as:

```bash
npm run check:architecture
```

It must fail if modules contain:

```txt
from '@/kernel/'
from '@/kernel/db/client'
sdk.getDb(orgId)
orgId: z.string()
searchParams.get('orgId')
findUnique({ where: { id
/api/[module] without /api/orgs/[orgSlug]
```

These checks do not replace tests, but they prevent known-bad patterns from being reintroduced.

---

# 24. Error Response Rules

API tenant errors must follow the Kernel API contract.

## 24.1 Unauthenticated

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

Status:

```txt
401
```

## 24.2 Wrong organization

```json
{
  "data": null,
  "error": {
    "code": "ORG_NOT_FOUND",
    "message": "Organization not found."
  }
}
```

Status:

```txt
404
```

Reason: avoid leaking tenant existence.

## 24.3 Suspended organization

```json
{
  "data": null,
  "error": {
    "code": "ORG_SUSPENDED",
    "message": "This organization is currently suspended."
  }
}
```

Status:

```txt
403
```

## 24.4 Module disabled

```json
{
  "data": null,
  "error": {
    "code": "MODULE_NOT_ENABLED",
    "message": "This module is not enabled for the organization."
  }
}
```

Status:

```txt
403
```

## 24.5 Permission denied

```json
{
  "data": null,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action."
  }
}
```

Status:

```txt
403
```

## 24.6 Client-supplied orgId

```json
{
  "data": null,
  "error": {
    "code": "CLIENT_ORG_ID_FORBIDDEN",
    "message": "orgId is server-derived and must not be submitted by clients."
  }
}
```

Status:

```txt
400
```

---

# 25. RLS Future Plan

PostgreSQL Row Level Security is deferred for MVP.

Reason:

```txt
RLS adds complexity before module and query patterns are stable.
```

However, the database architecture must remain RLS-compatible.

Future approach:

```sql
SELECT set_config('app.org_id', '<org-id>', true);
```

Then policies can use:

```sql
org_id = current_setting('app.org_id')
```

Important: RLS will be defense-in-depth, not a replacement for application-level context checks.

Even after RLS is added, code must still use:

```ts
PlatformContext
sdk.getDb(ctx)
orgId-scoped queries
permission checks
```

RLS should be revisited after:

```txt
[ ] Kernel is stable
[ ] SDK context is stable
[ ] At least three real modules exist
[ ] Query patterns are known
[ ] Performance impact is measured
```

---

# 26. Migration Safety

Because OneDayOS uses shared tables, database migrations affect all organizations.

Tenant isolation depends on safe migrations.

## 26.1 Adding tenant tables

Every new tenant table must include `orgId` in the first migration.

Bad migration:

```prisma
model Asset {
  id   String @id @default(cuid())
  name String
}
```

Good migration:

```prisma
model Asset {
  id    String @id @default(cuid())
  orgId String
  name  String

  org Organization @relation(fields: [orgId], references: [id])

  @@index([orgId])
}
```

## 26.2 Backfilling orgId

If a legacy table somehow lacks `orgId`, adding it is a security migration and must be treated as high risk.

Required steps:

```txt
1. Stop feature work.
2. Identify ownership source for every existing row.
3. Backfill orgId.
4. Add NOT NULL constraint.
5. Add indexes.
6. Add tests.
7. Add architecture check preventing recurrence.
```

## 26.3 Global-to-tenant conversion

Do not convert global tables into tenant tables casually.

Requires ADR.

## 26.4 Tenant-scoped uniqueness changes

Changing uniqueness from global to tenant-scoped or tenant-scoped to global requires data audit.

Example:

```txt
Product.code global unique → Product.code unique per org
```

This is usually safe and desirable.

The reverse is usually dangerous.

---

# 27. Client Delivery Implications

Tenant isolation supports the OneDayOS commercial model.

When onboarding a new client:

```txt
1. Create Organization.
2. Create admin User.
3. Create org-scoped Roles and Permissions.
4. Enable purchased modules through OrgModule.
5. Configure Settings.
6. Import tenant data with orgId derived from onboarding context.
```

Do not create a separate app or database for each client during MVP.

The goal is:

```txt
One codebase.
One database.
Many organizations.
Strict tenant boundaries.
```

---

# 28. Anti-Patterns

## 28.1 Per-client forks

Bad:

```txt
client-a app repo
client-b app repo
client-c app repo
```

Why bad:

```txt
updates become manual
security fixes fragment
support costs explode
platform maturity stalls
```

## 28.2 Client-supplied tenant IDs

Bad:

```ts
body.orgId
query.orgId
headers['x-org-id']
localStorage.orgId
```

Why bad:

```txt
clients can tamper with tenant identity
```

## 28.3 Raw Prisma in modules

Bad:

```ts
import { prisma } from '@/kernel/db/client'
```

Why bad:

```txt
bypasses SDK tenant rules
locks modules to Kernel internals
breaks future database routing
```

## 28.4 ID-only queries

Bad:

```ts
where: { id }
```

Why bad:

```txt
record IDs can become IDOR attack vectors
```

## 28.5 Permission without tenant verification

Bad:

```ts
await sdk.permissions.require(userId, 'inventory.product.read')
```

Why bad:

```txt
permissions are org-scoped
```

Good:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

## 28.6 Global cache keys

Bad:

```txt
products:list
```

Why bad:

```txt
cached tenant data can leak
```

## 28.7 Full record event payloads

Bad:

```ts
sdk.events.emit(ctx, 'objects.customer.created', customer)
```

Why bad:

```txt
events can leak PII and become unstable contracts
```

Good:

```ts
sdk.events.emit(ctx, 'objects.customer.created', {
  customerId: customer.id,
})
```

---

# 29. Claude Implementation Rules

When Claude implements tenant-scoped code, it must follow these rules:

```txt
1. Do not accept orgId from client input.
2. Do not create tenant APIs outside /api/orgs/[orgSlug]/...
3. Do not pass orgId strings into module services.
4. Do not call sdk.getDb(orgId).
5. Do not import Prisma inside modules.
6. Do not use findUnique by id on tenant-scoped models in module code.
7. Do not create tenant tables without orgId.
8. Do not create unique constraints without considering orgId.
9. Do not create event payloads without tenant context.
10. Do not implement FastAPI as a second backend.
11. Stop and ask for architectural review if tenant ownership is ambiguous.
```

Recommended implementation prompt:

```md
You are implementing OneDayOS tenancy data isolation.

Authoritative documents:
- docs/engineering-manual/06-data/01-tenancy-data-isolation.md
- docs/engineering-manual/05-sdk/02-sdk-db-access.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md
- docs/engineering-manual/04-kernel/08-kernel-api-contracts.md

Rules:
- Do not accept orgId from client input.
- Do not use sdk.getDb(orgId).
- Use verified PlatformContext.
- Tenant APIs must live under /api/orgs/[orgSlug]/...
- Add tests with at least two organizations.
- Add cross-tenant read/write denial tests.
- Do not modify unrelated modules.
- Stop if the manual is ambiguous.
```

---

# 30. Acceptance Criteria

This document is satisfied when the restarted platform meets all of the following.

## 30.1 Schema acceptance criteria

```txt
[ ] Every tenant-scoped table has orgId.
[ ] Tenant-scoped unique constraints include orgId where appropriate.
[ ] Module-owned extension tables enforce same-org relationships where possible.
[ ] UserRole is org-scoped.
[ ] Permission is org-scoped.
[ ] Setting is org-scoped.
[ ] OrgModule is org-scoped.
[ ] Business Objects are org-scoped.
```

## 30.2 API acceptance criteria

```txt
[ ] Tenant APIs use /api/orgs/[orgSlug]/...
[ ] APIs never use redirect-style auth.
[ ] APIs return JSON 401 for unauthenticated requests.
[ ] APIs return safe 404 for wrong-org access.
[ ] APIs reject client-supplied orgId.
[ ] APIs create PlatformContext before service calls.
[ ] APIs enforce module enablement before module operations.
[ ] APIs enforce permissions before mutations.
```

## 30.3 Service acceptance criteria

```txt
[ ] Module services receive PlatformContext.
[ ] Module services do not receive loose orgId.
[ ] Services call sdk.getDb(ctx).
[ ] Tenant queries include ctx.orgId.
[ ] Detail/update/delete operations verify org ownership.
[ ] Soft delete includes deletedBy = ctx.userId.
[ ] Events include ctx.orgId through EventEnvelope.
```

## 30.4 Test acceptance criteria

```txt
[ ] Test fixtures include at least two organizations.
[ ] Cross-tenant page access is denied.
[ ] Cross-tenant API reads are denied.
[ ] Cross-tenant API writes are denied.
[ ] Cross-tenant updates are denied.
[ ] Cross-tenant deletes are denied.
[ ] Client-supplied orgId is rejected.
[ ] Permission denial is tested with non-admin user.
[ ] Admin wildcard is tested only inside own org.
[ ] Disabled module access is tested.
[ ] Architecture check blocks forbidden import/query patterns.
```

## 30.5 Production gate

Before onboarding a second real tenant:

```txt
[ ] All tenant isolation tests pass.
[ ] All permission enforcement tests pass.
[ ] API auth returns JSON 401, not redirects.
[ ] Wrong-org access returns safe 404.
[ ] No module imports from @/kernel/*.
[ ] No generated module accepts orgId.
[ ] No module uses sdk.getDb(orgId).
[ ] No tenant-scoped service uses ID-only findUnique.
```

---

# 31. Founder Review Questions

Before freezing this document, confirm these decisions:

```txt
[ ] Organization remains the tenant boundary for MVP.
[ ] MVP users belong to exactly one organization.
[ ] Multi-org users remain deferred.
[ ] Client-supplied orgId is rejected, not ignored.
[ ] Tenant APIs use /api/orgs/[orgSlug]/...
[ ] Wrong-org access returns safe 404.
[ ] Services receive PlatformContext.
[ ] sdk.getDb(ctx) remains the only module database access pattern.
[ ] RLS remains deferred until post-MVP defense-in-depth.
[ ] Database-per-tenant remains deferred to future enterprise architecture.
```

---

# 32. Summary

OneDayOS tenant isolation is built on a simple rule:

```txt
The client can request an organization by slug,
but only the Kernel can decide whether the user belongs to that organization.
```

After that decision, every operation must carry a verified `PlatformContext`.

The safe path is:

```txt
Supabase session
→ platform User
→ Organization by slug
→ membership check
→ PlatformContext
→ sdk.getDb(ctx)
→ tenant-scoped query
→ permission-checked service
→ tenant-scoped event
```

The unsafe path is:

```txt
client orgId
→ raw Prisma
→ ID-only query
→ cross-tenant leak
```

The restarted OneDayOS platform must make the safe path easy and the unsafe path difficult or impossible.

Tenant isolation is not just security engineering. It is what allows OneDayOS to serve hundreds of businesses from one platform without becoming hundreds of fragile custom apps.
