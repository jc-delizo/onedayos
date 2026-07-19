# OneDayOS Engineering Manual — SDK DB Access

**Document ID:** `05-sdk/02-sdk-db-access.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Owner:** OneDayOS Founding Architect  
**Date:** July 2026  
**Implementation Allowed:** No, not until marked `Frozen`  
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

---

# 1. Purpose

This document defines how all OneDayOS code accesses the database through the SDK.

This is one of the most important documents in the Engineering Manual because OneDayOS is a shared multi-tenant platform. A database access mistake can become a cross-client data leak.

The database access layer must satisfy five goals:

1. Protect tenant isolation.
2. Preserve the future database-routing seam.
3. Prevent module code from depending on Kernel internals.
4. Keep module development fast enough for one-day delivery.
5. Avoid premature infrastructure complexity.

The old MVP design used this pattern:

```ts
sdk.getDb(orgId)
```

For the restarted platform build, that is no longer strict enough.

The new-build pattern is:

```ts
sdk.getDb(ctx)
```

where `ctx` is a verified `PlatformContext` created by the Kernel after authentication, organization membership validation, module enablement checks, and permission checks where required.

This change is intentional.

An `orgId` string is too easy to forge, pass incorrectly, or accidentally derive from client input. A verified `PlatformContext` is harder to misuse and gives the database layer enough information to enforce tenant-scoped behavior consistently.

---

# 2. Core Decision

## 2.1 Decision

OneDayOS uses:

```txt
Next.js route handlers
→ SDK server helpers
→ verified PlatformContext
→ sdk.getDb(ctx)
→ Prisma
→ shared PostgreSQL database
```

OneDayOS does **not** use:

```txt
module code
→ raw Prisma singleton
```

OneDayOS does **not** use:

```txt
module code
→ sdk.getDb(orgId)
```

OneDayOS does **not** use:

```txt
client payload orgId
→ database query scope
```

OneDayOS does **not** use FastAPI as the core backend.

---

# 3. Non-Negotiable Rules

## 3.1 Modules never import Prisma directly

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
```

Allowed:

```ts
import { sdk } from '@/sdk/server'
```

Then:

```ts
const db = sdk.getDb(ctx)
```

The only code allowed to import the raw Prisma singleton is:

```txt
src/kernel/db/*
src/kernel/auth/register/*
src/kernel/bootstrap/*
prisma/seed.ts
scripts/* that are explicitly marked as platform maintenance scripts
```

Business modules must never import from `@/kernel/db/client`.

---

## 3.2 `sdk.getDb()` always requires `PlatformContext`

Forbidden:

```ts
sdk.getDb()
sdk.getDb(orgId)
sdk.getDb(body.orgId)
sdk.getDb(params.orgId)
sdk.getDb(searchParams.get('orgId'))
```

Allowed:

```ts
const ctx = await sdk.auth.requireApiOrgContext(request, params.orgSlug)
const db = sdk.getDb(ctx)
```

The SDK must not expose a no-argument `getDb()` to module code.

---

## 3.3 Client-supplied `orgId` is rejected

Tenant identity must be derived from:

```txt
authenticated Supabase user
+ platform User record
+ route orgSlug
+ Organization record
+ user.orgId === org.id
```

Client input may contain business data.

Client input must not contain tenant identity.

If a protected tenant-scoped API receives an `orgId` in JSON body, query string, form data, or headers, the API should return:

```json
{
  "data": null,
  "error": {
    "code": "TENANT_INPUT_REJECTED",
    "message": "Tenant identity is derived from the authenticated session and route. Do not submit orgId."
  }
}
```

Recommended status:

```txt
400 Bad Request
```

---

## 3.4 Tenant isolation is enforced in more than one layer

Tenant isolation must be enforced by:

```txt
Route structure
+ API context resolver
+ service method signatures
+ database access layer
+ tests
```

No single layer is trusted as the only defense.

The database layer is not a substitute for route authorization.

The route layer is not a substitute for database scoping.

Both are required.

---

## 3.5 `findUnique` is forbidden on tenant-scoped models in module code

This is a critical rule.

`findUnique` is dangerous for tenant-scoped records because it often queries only by globally unique `id`:

```ts
await db.product.findUnique({
  where: { id: productId },
})
```

Even if product IDs are globally unique, this pattern trains developers and AI agents to think in global records rather than tenant-scoped records.

Forbidden in module code:

```ts
db.product.findUnique(...)
db.customer.findUnique(...)
db.employee.findUnique(...)
db.stockMovement.findUnique(...)
```

Allowed pattern:

```ts
await db.product.findFirst({
  where: { id: productId },
})
```

The tenant database layer must automatically add:

```ts
orgId: ctx.org.id
```

Better helper pattern:

```ts
await db.product.findById(productId)
```

where `findById()` is an SDK-provided tenant-scoped helper.

---

## 3.6 Hard delete is forbidden for business data

Forbidden in module code:

```ts
db.product.delete(...)
db.product.deleteMany(...)
db.stockMovement.delete(...)
```

Allowed:

```ts
await db.product.softDeleteById(productId)
```

or module service helper:

```ts
await InventoryService.archiveStockAdjustment(ctx, adjustmentId)
```

Soft delete must set:

```ts
deletedAt: new Date()
deletedBy: ctx.user.id
```

`isActive` must not be used as a deletion flag.

`isActive` is for business status.

`deletedAt` is for record archival/deletion.

---

# 4. Database Architecture

## 4.1 Database model

OneDayOS uses one shared PostgreSQL database for all tenants.

Every tenant-scoped table must include:

```prisma
orgId String
```

The platform does not use one schema per organization in the MVP.

The platform does not use one database per organization in the MVP.

The platform must preserve a future database-per-tenant migration seam by requiring module code to access the database through the SDK.

---

## 4.2 Database stack

The core database stack is:

```txt
Supabase PostgreSQL
Prisma ORM
Prisma migrations
SDK database facade
```

FastAPI, SQLAlchemy, and separate Python database services are not part of the core platform.

Python services may be introduced later only through an ADR for specialized Platform Services such as document parsing, AI/RAG pipelines, or heavy background processing. They must not become the main database access path.

---

## 4.3 Prisma remains the migration authority

All schema changes must go through Prisma migrations.

Forbidden:

```txt
manual database table edits in Supabase dashboard
manual ALTER TABLE in production
module-specific untracked SQL schema changes
```

Allowed:

```bash
npx prisma migrate dev --name <migration-name>
npx prisma migrate deploy
npx prisma generate
```

Any raw SQL migration must be committed as part of a Prisma migration and documented.

---

# 5. Model Classification

The database access layer depends on model classification.

Every Prisma model must be classified before implementation.

## 5.1 Model classes

| Class | Description | Examples | Has `orgId`? | Soft delete? |
|---|---|---|---:|---:|
| Global system model | Platform-wide infrastructure | Future system metadata | Usually no | Usually no |
| Tenant root model | The tenant itself | `Organization` | No | Usually `isActive` |
| Tenant-scoped Kernel model | Kernel data belonging to one org | `User`, `Role`, `Permission`, `Setting`, `OrgModule` | Yes | Depends |
| Org structure model | Kernel org structure | `Branch`, `Department` | Yes | Yes |
| Business Object | Shared business entity | `Employee`, `Product`, `Customer`, `Supplier`, `Warehouse` | Yes | Yes |
| Module-owned entity | Entity owned by one module | `StockMovement`, `LeaveRequest` | Yes | Usually yes |
| Join model | Relationship table | `UserRole`, future module joins | Usually yes or scoped through parents | Usually no |
| Log/event model | Append-only or audit-like data | Future audit events | Yes | Usually no |

---

## 5.2 Tenant-scoped model rule

Every model that stores client-specific business or configuration data must have:

```prisma
orgId String
```

Examples:

```prisma
model Product {
  id    String @id @default(cuid())
  orgId String
  code  String
  name  String

  @@unique([orgId, code])
  @@index([orgId])
}
```

If Claude creates a tenant-scoped model without `orgId`, implementation must stop.

---

## 5.3 Composite uniqueness must include `orgId`

Forbidden:

```prisma
@@unique([code])
@@unique([email])
@@unique([name])
```

Allowed:

```prisma
@@unique([orgId, code])
@@unique([orgId, email])
@@unique([orgId, name])
```

Reason:

Two different clients may use the same product code, customer email, employee number, department name, supplier name, or warehouse name.

---

## 5.4 Global uniqueness is rare

The following may be globally unique:

```txt
Organization.slug
Supabase auth user ID
Platform User.id
```

Most other values are organization-scoped.

Do not make business fields globally unique unless the manual explicitly says so.

---

# 6. PlatformContext and Database Access

## 6.1 PlatformContext

The database layer accepts verified `PlatformContext`.

Canonical shape:

```ts
export type PlatformContext = {
  auth: {
    supabaseUserId: string
  }
  user: {
    id: string
    email: string
    name: string
    isActive: boolean
  }
  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
    subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled'
  }
  roles: Array<{
    id: string
    name: string
    isSystem: boolean
  }>
  permissions: Array<{
    module: string
    resource: string
    action: string
  }>
  enabledModules: string[]
  request?: {
    id?: string
    ip?: string
    userAgent?: string
  }
}
```

The exact type may evolve, but these principles must remain:

```txt
ctx.user.id is the platform user ID
ctx.org.id is the tenant ID
ctx.org.slug is the route locator
ctx.permissions are already org-scoped
ctx.enabledModules are already org-scoped
```

---

## 6.2 Context creation

Module services must not construct `PlatformContext` manually.

Forbidden:

```ts
const ctx = {
  user: { id: body.userId },
  org: { id: body.orgId },
}
```

Allowed:

```ts
const ctx = await sdk.auth.requireApiOrgContext(request, params.orgSlug)
```

Allowed for server pages:

```ts
const ctx = await sdk.auth.requirePageOrgContext(params.orgSlug)
```

Allowed for tests:

```ts
const ctx = createTestPlatformContext({ orgId: 'org-a', userId: 'user-a' })
```

Test helpers must live under SDK or test utilities and must be clearly marked as test-only.

---

## 6.3 `sdk.getDb(ctx)` signature

The server SDK must expose:

```ts
sdk.getDb(ctx: PlatformContext): TenantDb
```

It must not expose this to browser/client code.

Import path:

```ts
import { sdk } from '@/sdk/server'
```

Forbidden import path for server database access:

```ts
import { sdk } from '@/sdk'
```

The shared `@/sdk` package must not export database functions.

The browser-safe `@/sdk/client` package must not export database functions.

---

# 7. TenantDb Contract

## 7.1 Purpose

`TenantDb` is the database object returned by:

```ts
const db = sdk.getDb(ctx)
```

It must behave like a tenant-scoped database client.

When code uses `TenantDb`, it should be difficult to accidentally query, create, update, or delete another tenant’s records.

---

## 7.2 Minimum behavior

For tenant-scoped models, `TenantDb` must automatically enforce:

```txt
orgId = ctx.org.id
```

For soft-deletable models, `TenantDb` must automatically enforce:

```txt
deletedAt = null
```

unless a controlled restore/admin helper explicitly opts into deleted records.

---

## 7.3 Stage 1 implementation approach

For the restarted MVP, `TenantDb` may be implemented as a Prisma client wrapper or Prisma `$extends` client.

Recommended practical approach:

```txt
raw Prisma singleton
→ createTenantDb(ctx, prisma)
→ tenant-scoped Prisma extension
→ returned as TenantDb
```

However, the implementation must not pretend Prisma extensions solve everything automatically.

Prisma query extensions have edge cases, especially around:

```txt
findUnique
findUniqueOrThrow
nested include reads
raw queries
upsert
connect/connectOrCreate
aggregate/groupBy
```

Therefore, this document imposes method-level restrictions in addition to any extension-based safety.

---

## 7.4 Preferred service usage

A module service should look like this:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'

export class InventoryProductService {
  static async list(ctx: PlatformContext) {
    const db = sdk.getDb(ctx)

    return db.product.findMany({
      orderBy: { name: 'asc' },
    })
  }
}
```

The service should not accept `orgId`:

```ts
// Forbidden
static async list(orgId: string) {}
```

The service should not accept user ID separately:

```ts
// Forbidden
static async create(userId: string, orgId: string, input: Input) {}
```

The service should accept verified context:

```ts
// Allowed
static async create(ctx: PlatformContext, input: Input) {}
```

---

# 8. Query Rules

## 8.1 `findMany`

Allowed:

```ts
const products = await db.product.findMany({
  where: {
    categoryId,
  },
  orderBy: {
    name: 'asc',
  },
})
```

The SDK must ensure the actual query includes:

```ts
where: {
  orgId: ctx.org.id,
  deletedAt: null,
  categoryId,
}
```

Module code should not manually include `orgId`.

Forbidden:

```ts
await db.product.findMany({
  where: { orgId: ctx.org.id },
})
```

Even though this looks safe, it trains module authors to pass tenant scope manually. Tenant scope belongs in the SDK database layer.

---

## 8.2 `findFirst`

Allowed:

```ts
const product = await db.product.findFirst({
  where: { id: productId },
})
```

The SDK must scope it to:

```ts
where: {
  id: productId,
  orgId: ctx.org.id,
  deletedAt: null,
}
```

If no record exists inside the tenant, the service should return `null` or throw a safe `NOT_FOUND` error depending on the service contract.

---

## 8.3 `findUnique`

Forbidden for tenant-scoped models in module code.

Bad:

```ts
await db.customer.findUnique({
  where: { id: customerId },
})
```

Use:

```ts
await db.customer.findFirst({
  where: { id: customerId },
})
```

or:

```ts
await db.customer.findById(customerId)
```

If a future helper supports composite unique lookup, it must still use tenant context internally.

Example:

```ts
await db.product.findByCode(code)
```

Internally:

```ts
where: {
  orgId_code: {
    orgId: ctx.org.id,
    code,
  },
}
```

---

## 8.4 `count`

Allowed:

```ts
const lowStockCount = await db.stockBalance.count({
  where: { quantity: { lt: reorderPoint } },
})
```

Must be scoped internally by `orgId`.

---

## 8.5 `aggregate` and `groupBy`

Allowed only if the SDK implementation scopes them correctly.

If the SDK cannot safely inject tenant scope into `aggregate` or `groupBy`, they must be disabled from module-facing `TenantDb` until proper helpers exist.

Preferred pattern:

```ts
await db.stockMovement.aggregateForTenant({ ... })
```

or module-specific service method:

```ts
await InventoryAnalyticsService.getMovementSummary(ctx, filters)
```

No analytics query may read across tenants unless it is an internal OneDayOS operator query covered by a separate ADR.

---

## 8.6 Nested includes

Nested `include` can bypass soft-delete expectations.

Risky:

```ts
await db.product.findMany({
  include: {
    category: true,
  },
})
```

If `category` is soft-deletable, the include may return deleted related records unless explicitly filtered or handled by the SDK.

Rule:

Do not use deep nested includes casually in module services.

Prefer explicit second queries through the tenant DB facade.

Allowed:

```ts
const products = await db.product.findMany({ where: { categoryId } })
const category = await db.productCategory.findFirst({ where: { id: categoryId } })
```

If include is necessary, the service must verify the included relation is either:

```txt
not soft-deletable
or explicitly filtered
or safely handled by the SDK facade
```

---

## 8.7 Raw SQL

Forbidden in module code:

```ts
await db.$queryRaw`SELECT * FROM products`
await db.$executeRaw`DELETE FROM products`
```

Raw SQL may only be used by Kernel/database infrastructure with:

```txt
explicit architectural approval
documented tenant scope
tests
migration or operations rationale
```

Raw SQL must never be introduced by Claude without human approval.

---

# 9. Mutation Rules

## 9.1 Create

Module code must not provide `orgId` in create data.

Forbidden:

```ts
await db.product.create({
  data: {
    orgId: ctx.org.id,
    name: input.name,
  },
})
```

Allowed:

```ts
await db.product.create({
  data: {
    name: input.name,
    code: input.code,
    unit: input.unit,
  },
})
```

The SDK must inject:

```ts
orgId: ctx.org.id
```

For created business records, module or Business Object services must also emit required events after successful mutation.

Example:

```ts
const product = await db.product.create({
  data: {
    name: input.name,
    code: input.code,
    unit: input.unit,
  },
})

await sdk.events.emit(ctx, 'inventory.product.created', {
  productId: product.id,
})
```

---

## 9.2 CreateMany

`createMany` is allowed only if the SDK can inject `orgId` into every row.

Forbidden:

```ts
await db.product.createMany({
  data: rows.map((row) => ({ ...row, orgId: ctx.org.id })),
})
```

Allowed only through SDK-controlled helper:

```ts
await db.product.createManyForTenant({
  data: rows,
})
```

or a module import service:

```ts
await ProductImportService.import(ctx, rows)
```

Bulk import deserves special validation and error reporting. Do not casually expose raw `createMany` in generated modules.

---

## 9.3 Update

Tenant-scoped updates must ensure the target record belongs to `ctx.org.id`.

Risky:

```ts
await db.product.update({
  where: { id: productId },
  data: { name: input.name },
})
```

Safer helper:

```ts
await db.product.updateById(productId, {
  name: input.name,
})
```

Internally, the SDK may implement this with:

```ts
await prisma.product.updateMany({
  where: {
    id: productId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
  data,
})
```

Then fetch the updated record through a tenant-scoped read.

Reason:

Prisma `update({ where: { id } })` uses a unique selector and does not naturally include tenant scope unless the schema has a composite unique field and the code uses it correctly every time.

---

## 9.4 UpdateMany

`updateMany` is allowed only when the SDK injects tenant scope.

Allowed:

```ts
await db.product.updateMany({
  where: {
    categoryId,
  },
  data: {
    unit: 'pcs',
  },
})
```

Actual query must include:

```ts
where: {
  orgId: ctx.org.id,
  deletedAt: null,
  categoryId,
}
```

---

## 9.5 Upsert

`upsert` is forbidden in module code during MVP.

Reason:

`upsert` is easy to misuse with unique selectors that are not tenant-scoped.

Forbidden:

```ts
await db.product.upsert(...)
```

Allowed alternative:

```ts
const existing = await db.product.findByCode(input.code)

if (existing) {
  return db.product.updateById(existing.id, updateData)
}

return db.product.create({ data: createData })
```

If upsert becomes repeatedly necessary, create a specific SDK helper with tenant-safe semantics.

---

## 9.6 Connect and connectOrCreate

Relations are a common cross-tenant leak source.

Forbidden unless wrapped by a tenant-safe helper:

```ts
connect: { id: input.customerId }
connectOrCreate: { ... }
```

Allowed pattern:

```ts
const customer = await db.customer.findById(input.customerId)
if (!customer) throw notFound('Customer not found')

await db.reservation.create({
  data: {
    customerId: customer.id,
  },
})
```

Rule:

Before connecting a tenant-scoped related record, verify it through `TenantDb`.

Never trust a related entity ID submitted by the client.

---

## 9.7 Delete

Hard delete is forbidden for business records.

Allowed:

```ts
await db.product.softDeleteById(productId)
```

Internally:

```ts
await prisma.product.updateMany({
  where: {
    id: productId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
  data: {
    deletedAt: new Date(),
    deletedBy: ctx.user.id,
  },
})
```

If the affected row count is zero, return safe not found.

Do not reveal whether the record exists in another tenant.

---

# 10. Soft Delete Contract

## 10.1 Soft-deletable models

The following classes are soft-deletable by default:

```txt
Org structure models
Business Objects
Module-owned business entities
```

Examples:

```txt
Branch
Department
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
StockMovement
LeaveRequest
Asset
ExpenseClaim
```

Not every model needs soft delete.

Usually not soft-deletable:

```txt
Permission
UserRole
OrgModule
Subscription state rows
append-only audit/event rows
```

But this must be decided per model.

---

## 10.2 Soft-delete fields

Soft-deletable models must include:

```prisma
deletedAt DateTime?
deletedBy String?
```

Recommended also:

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

---

## 10.3 Default reads exclude deleted records

By default, tenant DB reads must exclude:

```ts
deletedAt: { not: null }
```

The default visible set is:

```ts
deletedAt: null
```

Module list pages should not manually add this.

The SDK database layer owns it.

---

## 10.4 Querying deleted records

Querying deleted records is allowed only for controlled restore/admin flows.

Not allowed in normal module services:

```ts
await db.product.findMany({
  where: {
    deletedAt: { not: null },
  },
})
```

Allowed future helper:

```ts
await sdk.adminDb(ctx).product.findDeleted(...)
```

or:

```ts
await db.product.findDeletedById(productId)
```

only if the user has the correct permission.

---

## 10.5 Restore

Restore is not a default MVP feature for every module.

If restore is implemented, it must:

```txt
verify tenant context
verify restore permission
check uniqueness conflicts
set deletedAt = null
set deletedBy = null or preserve deletion metadata elsewhere
emit restored event
```

Example event:

```txt
inventory.product.restored
```

---

# 11. Transactions

## 11.1 Transaction rule

Module code must not call raw Prisma `$transaction` directly.

Forbidden:

```ts
await prisma.$transaction(...)
await db.$transaction(...)
```

Allowed:

```ts
await sdk.db.transaction(ctx, async (tx) => {
  const product = await tx.product.create({ data })
  await tx.stockBalance.create({ data: { productId: product.id } })
  return product
})
```

The transaction callback receives a tenant-scoped transaction DB object, not raw Prisma.

---

## 11.2 Transaction signature

Recommended SDK API:

```ts
sdk.db.transaction<T>(
  ctx: PlatformContext,
  fn: (tx: TenantDbTransaction) => Promise<T>
): Promise<T>
```

The transaction must preserve:

```txt
tenant scoping
soft-delete behavior
forbidden method restrictions
```

inside the transaction.

---

## 11.3 Events and transactions

Do not emit irreversible external side effects inside a transaction.

For MVP in-process events:

```txt
perform transaction
if transaction succeeds, emit event
```

Example:

```ts
const product = await sdk.db.transaction(ctx, async (tx) => {
  return tx.product.create({ data })
})

await sdk.events.emit(ctx, 'inventory.product.created', {
  productId: product.id,
})
```

Future improvement:

```txt
Transactional outbox
Durable event queue
Background worker
```

Do not build that until the Three Independent Use Cases Rule justifies it.

---

# 12. System Database Access

## 12.1 Why system DB access exists

Some Kernel flows happen before a full tenant `PlatformContext` exists.

Examples:

```txt
registration
organization creation
first user creation
seed scripts
migration verification
internal maintenance scripts
```

These flows may need raw or system-level database access.

---

## 12.2 System DB access must be Kernel-only

System DB access must not be available to business modules.

Allowed inside Kernel:

```ts
import { prisma } from '@/kernel/db/client'
```

Allowed in Prisma seed:

```ts
const prisma = new PrismaClient()
```

Forbidden inside modules:

```ts
import { prisma } from '@/kernel/db/client'
```

---

## 12.3 Registration exception

Registration creates the first Organization and first User before `PlatformContext` exists.

This is a valid exception.

Registration must:

```txt
validate input
create Supabase Auth user server-side
create Organization
create Prisma User with Supabase user ID
create Subscription
create Admin role
create wildcard Admin permission
assign first User to Admin role
rollback Supabase Auth user if Prisma transaction fails
return orgSlug
```

The registration route must not be implemented as a normal module route.

It belongs to Kernel auth.

---

# 13. API Route Pattern

## 13.1 Read route example

```ts
import { sdk } from '@/sdk/server'

export const GET = sdk.api.handleOrgRoute(
  async ({ request, params }) => {
    const ctx = await sdk.auth.requireApiOrgContext(request, params.orgSlug)

    await sdk.modules.requireEnabled(ctx, 'inventory')
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'read',
    })

    const products = await InventoryProductService.list(ctx)

    return sdk.api.ok(products)
  }
)
```

Route shape:

```txt
/api/orgs/[orgSlug]/inventory/products
```

---

## 13.2 Create route example

```ts
import { sdk } from '@/sdk/server'
import { CreateProductSchema } from '@/modules/inventory/schema'

export const POST = sdk.api.handleOrgRoute(
  async ({ request, params }) => {
    const ctx = await sdk.auth.requireApiOrgContext(request, params.orgSlug)

    await sdk.modules.requireEnabled(ctx, 'inventory')
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'create',
    })

    const body = await sdk.api.parseJson(request)
    sdk.api.rejectTenantFields(body)

    const input = CreateProductSchema.parse(body)
    const product = await InventoryProductService.create(ctx, input)

    return sdk.api.created(product)
  }
)
```

The route must reject:

```txt
body.orgId
body.organizationId
query.orgId
headers.x-org-id
```

unless a future internal API explicitly documents otherwise.

---

# 14. Service Pattern

## 14.1 Service method signatures

Service methods must receive `PlatformContext` as their first argument.

Allowed:

```ts
static async list(ctx: PlatformContext, filters: ProductFilters) {}
static async create(ctx: PlatformContext, input: CreateProductInput) {}
static async update(ctx: PlatformContext, id: string, input: UpdateProductInput) {}
static async archive(ctx: PlatformContext, id: string) {}
```

Forbidden:

```ts
static async list(orgId: string) {}
static async create(orgId: string, userId: string, input: Input) {}
static async delete(id: string) {}
```

---

## 14.2 Service authorization assumption

There are two valid patterns:

### Pattern A — Route enforces permission, service assumes authorized context

```ts
await sdk.permissions.require(ctx, requirement)
await InventoryProductService.create(ctx, input)
```

This is acceptable for simple services if the service is not used anywhere else.

### Pattern B — Service also enforces permission

```ts
static async create(ctx: PlatformContext, input: CreateProductInput) {
  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'product',
    action: 'create',
  })

  // mutation
}
```

This is safer for services reused by APIs, server actions, batch jobs, or AI actions.

## 14.3 Preferred rule

For MVP, use this rule:

```txt
API route enforces permission.
Mutation service also enforces permission if it can be called from more than one entry point.
```

When in doubt, enforce in the service too.

Double-checking permission is cheaper than a security incident.

---

# 15. Module-Owned Models

## 15.1 Module model requirements

Every module-owned business model must include:

```prisma
id        String   @id @default(cuid())
orgId     String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

If the model represents mutable business data, include:

```prisma
deletedAt DateTime?
deletedBy String?
```

Recommended relation:

```prisma
org Organization @relation(fields: [orgId], references: [id])
```

Recommended indexes:

```prisma
@@index([orgId])
@@index([orgId, createdAt])
```

---

## 15.2 Example Inventory model

```prisma
model InventoryStockMovement {
  id          String   @id @default(cuid())
  orgId       String
  productId   String
  warehouseId String
  type        String
  quantity    Decimal
  reason      String?
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org       Organization @relation(fields: [orgId], references: [id])
  product   Product      @relation(fields: [productId], references: [id])
  warehouse Warehouse    @relation(fields: [warehouseId], references: [id])

  @@index([orgId])
  @@index([orgId, productId])
  @@index([orgId, warehouseId])
  @@index([orgId, createdAt])
  @@map("inventory_stock_movements")
}
```

Important:

`productId` and `warehouseId` must be verified through `TenantDb` before creating a stock movement.

Do not assume a submitted `productId` belongs to the current tenant.

---

# 16. Business Object Access

## 16.1 Business Objects are shared but still tenant-scoped

Business Objects such as Product, Customer, Supplier, Employee, and Warehouse are shared across modules, but they are not global records.

Every Business Object query must be tenant-scoped.

Example:

```ts
const product = await db.product.findById(productId)
```

must mean:

```txt
Find product where:
- id = productId
- orgId = ctx.org.id
- deletedAt = null
```

---

## 16.2 Business Object mutation events

Every Business Object mutation must emit an event.

Examples:

```txt
kernel.product.created
kernel.product.updated
kernel.product.deleted
kernel.customer.created
kernel.employee.deactivated
```

If a module initiates the mutation, event naming should still reflect the owner of the entity contract.

For shared Product created from Inventory, use the convention decided in the Business Object event contract document. Until then, prefer:

```txt
kernel.product.created
```

rather than:

```txt
inventory.product.created
```

unless Inventory creates a module-owned extension record.

---

## 16.3 Module extension tables

Module-specific fields do not belong on Business Objects.

Use extension tables.

Example:

```prisma
model InventoryProductExtension {
  id           String @id @default(cuid())
  orgId        String
  productId    String
  reorderPoint Decimal?
  minimumStock Decimal?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  org     Organization @relation(fields: [orgId], references: [id])
  product Product      @relation(fields: [productId], references: [id])

  @@unique([orgId, productId])
  @@index([orgId])
  @@map("inventory_product_extensions")
}
```

Even though `productId` is globally unique, the extension table still includes `orgId`.

Reason:

It makes tenant scoping explicit, improves query performance, and protects future migrations.

---

# 17. Validation and Data Hygiene

## 17.1 Zod schemas must not include `orgId`

Forbidden:

```ts
export const CreateProductSchema = z.object({
  orgId: z.string(),
  name: z.string(),
})
```

Allowed:

```ts
export const CreateProductSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  unit: z.string().default('pcs'),
})
```

Tenant identity is not business input.

---

## 17.2 Related IDs must be validated through tenant queries

Input may include related business IDs:

```ts
productId
warehouseId
employeeId
customerId
supplierId
```

But these IDs must be verified before use.

Example:

```ts
const product = await db.product.findById(input.productId)
if (!product) throw sdk.errors.notFound('Product not found')
```

Do not connect by submitted IDs without verification.

---

## 17.3 Server-side validation is mandatory

Client-side validation improves UX.

Server-side validation enforces correctness.

Every mutation route must validate input server-side using Zod or an approved schema validator.

---

# 18. Error Handling

## 18.1 Database errors must map to API errors

Prisma errors must not leak raw stack traces to clients.

Examples:

| Prisma case | API error code | HTTP status |
|---|---|---:|
| Unique violation | `CONFLICT` | 409 |
| Record not found inside tenant | `NOT_FOUND` | 404 |
| Validation error | `VALIDATION_ERROR` | 400 |
| Foreign key violation | `INVALID_REFERENCE` | 400 |
| Tenant field submitted | `TENANT_INPUT_REJECTED` | 400 |
| Unknown DB error | `INTERNAL_ERROR` | 500 |

The API wrapper should normalize these.

---

## 18.2 Cross-tenant not found behavior

If a user requests a record ID from another tenant, return safe not found.

Do not return:

```txt
403: You cannot access this record from another organization
```

Return:

```txt
404: Record not found
```

Reason:

The API should not confirm that another tenant’s record exists.

---

# 19. Pagination, Sorting, and Filtering

## 19.1 Pagination is required for list APIs

Generated list APIs must support pagination.

Minimum shape:

```ts
type ListParams = {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
}
```

Default:

```txt
page = 1
pageSize = 25
```

Maximum:

```txt
pageSize = 100
```

The API should reject larger page sizes.

---

## 19.2 Search must remain tenant-scoped

Search filters must be merged with tenant scope.

Allowed module code:

```ts
await db.product.findMany({
  where: {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ],
  },
})
```

Actual SDK query must still include:

```ts
orgId: ctx.org.id
```

---

## 19.3 Sorting must be allowlisted

Do not pass arbitrary client sort fields into Prisma.

Forbidden:

```ts
orderBy: { [searchParams.sort]: searchParams.direction }
```

Allowed:

```ts
const SORT_FIELDS = ['name', 'createdAt', 'updatedAt'] as const
```

Then validate.

---

# 20. Import Rules

## 20.1 Module import rules

Allowed inside modules:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/kernel/data-table/DataTable'
```

Forbidden inside modules:

```ts
import { prisma } from '@/kernel/db/client'
import { can } from '@/kernel/permissions/check'
import { requireAuth } from '@/kernel/auth/session'
import { createServerClient } from '@/kernel/auth/server'
```

---

## 20.2 Client component rules

Client components must not import server SDK.

Forbidden in `'use client'` files:

```ts
import { sdk } from '@/sdk/server'
```

Allowed:

```ts
import { sdkClient } from '@/sdk/client'
```

Client components call APIs.

They do not access the database.

---

# 21. Lint and Static Enforcement

## 21.1 Forbidden import linting

The repository should enforce forbidden imports.

Examples:

```txt
src/modules/** cannot import @/kernel/**
src/modules/** cannot import @/kernel/db/client
src/components/ui/** cannot import @/sdk/server
'use client' files cannot import @/sdk/server
```

Use ESLint, dependency-cruiser, or a custom script.

---

## 21.2 Forbidden database method linting

The repository should detect these patterns in module code:

```txt
.findUnique(
.findUniqueOrThrow(
.delete(
.deleteMany(
.upsert(
.$queryRaw
.$executeRaw
orgId: input.orgId
orgId: body.orgId
searchParams.get('orgId')
```

This does not replace code review, but it catches common Claude mistakes.

---

# 22. Testing Requirements

## 22.1 Required tests for SDK DB access

The SDK DB layer must test:

```txt
sdk.getDb(ctx) requires PlatformContext
sdk.getDb(ctx) scopes findMany by ctx.org.id
sdk.getDb(ctx) scopes findFirst by ctx.org.id
sdk.getDb(ctx) injects orgId on create
sdk.getDb(ctx) rejects orgId in create data
sdk.getDb(ctx) prevents findUnique on tenant models or wraps it safely
sdk.getDb(ctx) soft-deletes instead of hard-deletes
sdk.getDb(ctx) excludes deleted records by default
transaction(ctx) preserves tenant scope
client-supplied orgId is rejected at API helper level
```

---

## 22.2 Required cross-tenant tests

Every generated module must include tests for:

```txt
Org A user cannot list Org B records
Org A user cannot fetch Org B record by ID
Org A user cannot update Org B record by ID
Org A user cannot delete Org B record by ID
Org A user cannot connect Org B related record
submitted orgId is rejected
Admin wildcard permission does not bypass tenant isolation
```

---

## 22.3 Required soft-delete tests

Every soft-deletable model service must test:

```txt
soft-deleted records do not appear in list
soft-deleted records cannot be updated through normal service
soft delete sets deletedAt
soft delete sets deletedBy
second soft delete is idempotent or returns safe not found
restore, if supported, checks permissions and uniqueness conflicts
```

---

## 22.4 Required generated module tests

The module generator must output tests that prove:

```txt
service receives PlatformContext
service calls sdk.getDb(ctx)
service does not accept orgId
API route uses /api/orgs/[orgSlug]/...
API route rejects body.orgId
API route returns 401 when unauthenticated
API route returns 403 when permission missing
API route returns 404 for cross-tenant record
```

Generated tests must not be tautological.

A test that only proves an array is an array is not acceptable.

---

# 23. Example: Correct Inventory Product Service

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
import type { CreateProductInput, UpdateProductInput } from './schema'

export class InventoryProductService {
  static async list(ctx: PlatformContext) {
    const db = sdk.getDb(ctx)

    return db.product.findMany({
      orderBy: { name: 'asc' },
    })
  }

  static async getById(ctx: PlatformContext, productId: string) {
    const db = sdk.getDb(ctx)

    const product = await db.product.findFirst({
      where: { id: productId },
    })

    if (!product) throw sdk.errors.notFound('Product not found')

    return product
  }

  static async create(ctx: PlatformContext, input: CreateProductInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'create',
    })

    const db = sdk.getDb(ctx)

    const product = await db.product.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        unit: input.unit,
      },
    })

    await sdk.events.emit(ctx, 'kernel.product.created', {
      productId: product.id,
    })

    return product
  }

  static async update(ctx: PlatformContext, productId: string, input: UpdateProductInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'update',
    })

    const db = sdk.getDb(ctx)

    const product = await db.product.updateById(productId, {
      name: input.name,
      description: input.description,
      unit: input.unit,
    })

    await sdk.events.emit(ctx, 'kernel.product.updated', {
      productId: product.id,
    })

    return product
  }

  static async archive(ctx: PlatformContext, productId: string) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'product',
      action: 'delete',
    })

    const db = sdk.getDb(ctx)

    await db.product.softDeleteById(productId)

    await sdk.events.emit(ctx, 'kernel.product.deleted', {
      productId,
    })
  }
}
```

---

# 24. Example: Incorrect Service

This is forbidden:

```ts
import { prisma } from '@/kernel/db/client'

export class InventoryProductService {
  static async list(orgId: string) {
    return prisma.product.findMany({
      where: { orgId },
    })
  }

  static async create(input: CreateProductInput) {
    return prisma.product.create({
      data: {
        orgId: input.orgId,
        name: input.name,
      },
    })
  }

  static async delete(id: string) {
    return prisma.product.delete({
      where: { id },
    })
  }
}
```

Why this is wrong:

```txt
imports Kernel internals
accepts loose orgId
trusts input.orgId
uses raw Prisma
hard deletes data
has no permission check
has no event emission
can leak or mutate cross-tenant records
```

---

# 25. Implementation Guidance for Claude Code

When implementing this subsystem, Claude must follow this sequence:

```txt
1. Create or update shared PlatformContext type.
2. Ensure @/sdk/server is server-only.
3. Implement sdk.getDb(ctx), not sdk.getDb(orgId).
4. Create tenant-scoped DB facade or Prisma extension.
5. Add safeguards for tenant-scoped models.
6. Remove no-arg getDb from module-facing API.
7. Add transaction(ctx) wrapper.
8. Add tenant-input rejection helper.
9. Add tests for tenant scoping, soft delete, and forbidden methods.
10. Add lint/static checks for forbidden imports and unsafe DB patterns.
```

Claude must stop and report ambiguity if asked to expose raw Prisma to modules.

Claude must not implement FastAPI.

Claude must not implement RLS in this document.

Claude must not build Platform Services while implementing this document.

---

# 26. Migration from Old MVP Pattern

The old MVP pattern:

```ts
sdk.getDb(orgId)
```

is superseded.

The new pattern:

```ts
sdk.getDb(ctx)
```

Migration rules:

| Old pattern | New pattern |
|---|---|
| `Service.list(orgId)` | `Service.list(ctx)` |
| `sdk.getDb(orgId)` | `sdk.getDb(ctx)` |
| `where: { orgId }` | tenant DB injects org scope |
| create schema includes `orgId` | create schema excludes `orgId` |
| `/api/inventory?orgId=...` | `/api/orgs/[orgSlug]/inventory/...` |
| `requireAuth()` in API | `requireApiOrgContext()` |
| `findUnique({ where: { id }})` | `findFirst({ where: { id }})` or `findById(id)` |
| hard `delete()` | `softDeleteById()` |

Because development is restarting from scratch, do not implement the old pattern first and then refactor.

Build the new pattern from day one.

---

# 27. Deferred Decisions

## 27.1 PostgreSQL Row Level Security

RLS is deferred.

Reason:

It is valuable defense-in-depth, but it adds Prisma setup complexity before the module patterns are stable.

Application-level tenant isolation is mandatory now.

RLS can be revisited after at least three real modules exist and the query patterns are stable.

---

## 27.2 Database-per-tenant

Database-per-tenant is deferred.

Reason:

The MVP business model needs low operational cost and fast onboarding.

The SDK database seam exists so this can be considered later without rewriting modules.

---

## 27.3 Durable event outbox

Transactional outbox is deferred.

Reason:

In-process events are enough until Platform Services or background jobs require durability.

---

## 27.4 Generic dynamic repository engine

A full generic repository abstraction is deferred.

Reason:

Over-abstracting Prisma too early can slow development and produce a weak internal ORM.

The correct MVP balance is:

```txt
Prisma remains the real ORM
SDK enforces tenant access rules
services stay explicit and readable
unsafe Prisma methods are restricted
```

---

# 28. Acceptance Criteria

This document is complete when a senior engineer or Claude Code can implement database access without making architectural decisions.

Before this document can be marked `Frozen`, it must satisfy:

```txt
[ ] It clearly supersedes sdk.getDb(orgId)
[ ] It requires sdk.getDb(ctx)
[ ] It defines PlatformContext dependency
[ ] It prohibits raw Prisma in modules
[ ] It prohibits client-supplied orgId
[ ] It defines tenant-scoped model behavior
[ ] It defines soft-delete behavior
[ ] It forbids findUnique on tenant models in module code
[ ] It forbids hard delete for business data
[ ] It defines transaction rules
[ ] It defines test requirements
[ ] It defines generated module requirements
[ ] It preserves future database-per-tenant migration path
[ ] It avoids introducing FastAPI or a second backend runtime
```

---

# 29. Implementation Readiness Checklist

Before Claude implements this document:

```txt
[ ] 05-sdk/00-sdk-overview.md is frozen
[ ] 05-sdk/01-sdk-public-api.md is frozen
[ ] 04-kernel/02-organizations-tenancy.md is frozen
[ ] 04-kernel/04-authorization-enforcement.md is frozen
[ ] 04-kernel/08-kernel-api-contracts.md is frozen
[ ] PlatformContext type has been approved
[ ] API route structure has been approved
[ ] Module import rules have been approved
```

Before module development resumes:

```txt
[ ] sdk.getDb(ctx) implemented
[ ] sdk.getDb(orgId) does not exist
[ ] raw Prisma import blocked in modules
[ ] tenant-scoped DB tests pass
[ ] cross-tenant DB tests pass
[ ] soft-delete tests pass
[ ] generated module template uses PlatformContext
[ ] generated module API rejects orgId
```

---

# 30. Final Rule

Database access in OneDayOS must always answer this question:

> “Which verified organization is this operation acting inside?”

If the answer is:

```txt
from request body
from query string
from a loose orgId variable
from a guessed slug without membership validation
from a module-level constant
```

then the code is wrong.

The answer must be:

```txt
from verified PlatformContext
```

That is the contract.
