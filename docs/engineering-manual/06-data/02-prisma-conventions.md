# OneDayOS Engineering Manual — 06 Data — 02 Prisma Conventions

**Document ID:** `06-data/02-prisma-conventions.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Implementation Allowed:** No, not until this document is marked `Frozen`  
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
- `05-sdk/04-sdk-events.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`

---

# 1. Purpose

This document defines how OneDayOS uses **Prisma ORM** in the restarted platform build.

The purpose is not merely to make database queries type-safe. The purpose is to make database access:

```txt
Tenant-safe
Predictable
Reusable
Testable
Migration-safe
AI-agent-safe
```

Prisma is a powerful tool, but in a multi-tenant Business Operating System it can also become a source of dangerous mistakes if used casually.

This document exists so Claude Code and future engineers do not invent their own database patterns.

---

# 2. Core Decision

OneDayOS uses:

```txt
PostgreSQL
+ Prisma ORM
+ SDK-controlled database access
+ verified PlatformContext
```

The correct module pattern is:

```ts
const db = sdk.getDb(ctx)
```

The incorrect module pattern is:

```ts
import { prisma } from '@/kernel/db/client'

const db = prisma
```

The old MVP pattern:

```ts
sdk.getDb(orgId)
```

is also no longer allowed in the restarted build.

The restarted platform uses:

```ts
sdk.getDb(ctx)
```

where `ctx` is a verified `PlatformContext` produced by the Kernel after authentication, organization membership validation, module enablement checks, and permission checks where applicable.

---

# 3. Scope

This document covers:

- Prisma package usage.
- Prisma client initialization.
- Prisma config.
- Prisma schema conventions.
- Model naming.
- Table naming.
- Tenant-scoped models.
- IDs.
- Relations.
- Indexes.
- Unique constraints.
- Timestamps.
- Soft delete conventions.
- JSON fields.
- Money and quantity fields.
- Transactions.
- Query safety.
- Migration rules.
- Seeding rules.
- Testing rules.
- Forbidden Prisma patterns.
- Claude implementation rules.

This document does **not** define the full OneDayOS database schema. That belongs to:

```txt
06-data/00-database-architecture.md
06-data/01-tenancy-data-isolation.md
07-business-objects/*
08-module-system/*
17-module-specifications/*
```

---

# 4. Non-Goals

This document does not define:

- Row Level Security implementation.
- Backup and restore process.
- Complete Business Object schemas.
- Full module schemas.
- Dynamic Form metadata schema.
- Analytics warehouse strategy.
- Marketplace schema versioning.
- Per-client database isolation.
- FastAPI database access.

These are separate documents or future ADRs.

---

# 5. Architectural Rules

## 5.1 Prisma is an implementation detail, not a module API

Business modules should not know or care how the Kernel internally initializes Prisma.

Modules consume the database through:

```ts
import { sdk } from '@/sdk/server'

const db = sdk.getDb(ctx)
```

Modules must never import:

```ts
import { prisma } from '@/kernel/db/client'
```

## 5.2 Prisma Client belongs inside Kernel/Data only

The raw Prisma client may exist only in:

```txt
src/kernel/db/client.ts
src/kernel/db/*
src/kernel/auth/*        // only when necessary for registration/session sync
src/kernel/context/*     // only when resolving PlatformContext
src/kernel/permissions/* // only for permission evaluation
src/sdk/server/*         // only as wrapper/export boundary
prisma/seed.ts
scripts/*                // only migration/seed/dev scripts
```

Business modules must not import the raw Prisma client.

## 5.3 All tenant-scoped database access starts with PlatformContext

Correct:

```ts
async function listProducts(ctx: PlatformContext) {
  const db = sdk.getDb(ctx)
  return db.product.findMany({
    where: { orgId: ctx.orgId },
  })
}
```

Better, if `TenantDb` injects tenant scope:

```ts
async function listProducts(ctx: PlatformContext) {
  const db = sdk.getDb(ctx)
  return db.product.findMany()
}
```

Incorrect:

```ts
async function listProducts(orgId: string) {
  return prisma.product.findMany({ where: { orgId } })
}
```

Even if the second version appears safe, it trains Claude and future engineers to pass tenant identity as a loose string. That is not acceptable for OneDayOS.

## 5.4 Client-supplied orgId is forbidden

API requests must not accept:

```json
{
  "orgId": "org_123"
}
```

for tenant-scoped operations.

API routes derive tenant identity from:

```txt
authenticated session
+ route orgSlug
+ Prisma User record
+ Organization record
+ membership check
```

Then they create `PlatformContext`.

## 5.5 Prisma is not used from the browser

Prisma is server-only.

Forbidden:

```tsx
'use client'

import { prisma } from '@/kernel/db/client'
```

Also forbidden:

```tsx
'use client'

import { sdk } from '@/sdk/server'
```

Client components may use:

```ts
import { sdkClient } from '@/sdk/client'
```

which internally calls API routes.

---

# 6. Prisma Version Baseline

The restarted build should use the Prisma version selected by the Technology Baseline document.

Until `02-architecture/04-technology-baseline.md` is frozen, use the previous Kernel v2 as the historical stack reference:

```txt
Prisma 7
@prisma/adapter-pg
PostgreSQL
Supabase database
```

However, Claude must not blindly copy the old MVP Prisma setup. The old implementation had useful lessons, but also open risks around tenant isolation, soft-delete bypass behavior, API auth behavior, and permission enforcement.

## 6.1 Prisma 7 baseline expectations

If Prisma 7 is used, the restarted build should expect:

```txt
Prisma Client requires a driver adapter.
PostgreSQL uses @prisma/adapter-pg.
Prisma CLI configuration lives in prisma.config.ts.
Seed configuration belongs in prisma.config.ts migrations.seed.
```

## 6.2 Do not invent Prisma version workarounds

If Prisma setup fails because of a major-version difference, Claude must stop and report:

```txt
The Prisma setup in this document does not match the installed Prisma version.
```

Claude must not silently:

- downgrade Prisma;
- remove the driver adapter;
- move datasource configuration back into `schema.prisma` if the selected version rejects it;
- change generated client output paths without updating imports;
- use `prisma db push` as a shortcut;
- skip Prisma Client generation.

Any Prisma major version change requires an ADR.

---

# 7. Required Packages

The expected packages are:

```bash
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma
```

If `tsx` is used for seed scripts:

```bash
npm install -D tsx
```

If the Prisma config loads `.env` directly:

```bash
npm install dotenv
```

---

# 8. Required Files

Claude should create or maintain these files:

```txt
prisma/
  schema.prisma
  seed.ts
  migrations/

prisma.config.ts

src/kernel/db/
  client.ts
  tenant-db.ts
  errors.ts
  prisma-error-map.ts
  __tests__/

src/sdk/server/
  index.ts
  db.ts
```

The exact internal split may evolve, but these responsibilities must exist.

---

# 9. Prisma Config

## 9.1 Required config file

The restarted build should use:

```txt
prisma.config.ts
```

at the project root.

Example:

```ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

## 9.2 Environment variable rule

Required local environment variables:

```txt
DATABASE_URL=
DIRECT_URL=
```

`DATABASE_URL` is the default database connection used by Prisma.

`DIRECT_URL` may be used for direct migration connections if required by the selected Supabase/Prisma setup, but Claude must follow the selected Prisma version’s documented configuration rules. Do not invent unsupported `directUrl` config syntax.

## 9.3 Supabase connection caution

Supabase commonly exposes both pooled and direct connection strings.

For MVP:

```txt
Application runtime may use a pooled connection.
Migrations should use a migration-safe direct connection where required.
```

This is finalized in:

```txt
15-deployment-operations/03-database-migrations-production.md
```

Until that document is frozen, Claude should avoid clever connection pooling changes.

---

# 10. Prisma Schema Generator

The schema must define a Prisma client generator.

Default MVP pattern:

```prisma
generator client {
  provider = "prisma-client-js"
}
```

If the selected Prisma version or project baseline uses a custom generated client output, the decision must be documented in `02-architecture/04-technology-baseline.md` and all imports must be updated consistently.

Claude must not create a second Prisma client output location casually.

---

# 11. Prisma Client Initialization

## 11.1 One raw client file

The raw Prisma client must be initialized in exactly one canonical file:

```txt
src/kernel/db/client.ts
```

No other app file should call:

```ts
new PrismaClient()
```

except:

```txt
prisma/seed.ts
approved one-off migration scripts
```

## 11.2 Prisma 7 adapter pattern

If using Prisma 7 with PostgreSQL, initialize with `@prisma/adapter-pg`.

Example shape:

```ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## 11.3 Logging rule

Development may log:

```txt
query
error
warn
```

Production should log:

```txt
error
```

Do not log sensitive payloads.

## 11.4 No module import of this file

This file is not a public API.

Forbidden inside modules:

```ts
import { prisma } from '@/kernel/db/client'
```

Allowed inside SDK implementation:

```ts
import { prisma } from '@/kernel/db/client'
```

---

# 12. TenantDb Wrapper

## 12.1 Public database API

The public SDK database API is:

```ts
sdk.getDb(ctx)
```

It returns a tenant-aware database access object.

The exact implementation may be:

```txt
A restricted Prisma wrapper
A repository-style wrapper
A tenant-scoped delegate collection
```

But the module-facing contract must prevent casual cross-tenant queries.

## 12.2 Recommended MVP shape

Recommended type:

```ts
type TenantDb = {
  product: TenantModelDelegate<'product'>
  customer: TenantModelDelegate<'customer'>
  supplier: TenantModelDelegate<'supplier'>
  warehouse: TenantModelDelegate<'warehouse'>
  employee: TenantModelDelegate<'employee'>
  // module delegates added as modules are implemented
}
```

The tenant delegate should inject or require `ctx.orgId`.

Example conceptual implementation:

```ts
export function getDb(ctx: PlatformContext): TenantDb {
  return createTenantDb(prisma, ctx)
}
```

## 12.3 Minimum acceptable MVP implementation

If a full wrapper is too much for the first build, the minimum acceptable implementation is:

```ts
function getDb(ctx: PlatformContext) {
  return {
    prisma,
    orgId: ctx.orgId,
  }
}
```

But modules still must not receive or pass loose `orgId` strings.

In this minimum pattern, module service code must explicitly scope queries:

```ts
const db = sdk.getDb(ctx)

return db.prisma.product.findMany({
  where: {
    orgId: ctx.orgId,
    deletedAt: null,
  },
})
```

This is less safe than a real wrapper, but still better than `sdk.getDb(orgId)`.

## 12.4 Preferred implementation before first official module

Before Inventory becomes the first official module, OneDayOS should implement a real tenant wrapper that makes the safe path the easiest path.

Preferred:

```ts
const products = await db.product.findMany()
```

Not preferred:

```ts
const products = await db.prisma.product.findMany({
  where: { orgId: ctx.orgId, deletedAt: null },
})
```

The preferred API reduces repetitive security-sensitive query conditions.

---

# 13. Model Naming Conventions

## 13.1 Prisma model names

Prisma models use singular PascalCase:

```prisma
model Organization {}
model User {}
model Role {}
model Product {}
model StockMovement {}
```

## 13.2 Database table names

Database tables use plural snake_case via `@@map`:

```prisma
model Product {
  id String @id @default(cuid())

  @@map("products")
}
```

Examples:

| Prisma Model | Database Table |
|---|---|
| `Organization` | `organizations` |
| `OrgModule` | `org_modules` |
| `ProductCategory` | `product_categories` |
| `StockMovement` | `stock_movements` |
| `InventoryProductExtension` | `inventory_product_extensions` |

## 13.3 Field names

Prisma fields use camelCase:

```prisma
model Product {
  orgId      String
  categoryId String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Database column names should use Prisma’s default mapping unless there is a strong reason to map them.

Do not add `@map("org_id")` everywhere in MVP unless the team deliberately chooses snake_case columns in a database-style ADR. The application is TypeScript-first, and Prisma field consistency matters more than raw SQL aesthetics.

## 13.4 Relation field names

Relation fields use natural singular/plural names:

```prisma
model Product {
  org      Organization @relation(fields: [orgId], references: [id])
  category ProductCategory? @relation(fields: [categoryId], references: [id])
}

model ProductCategory {
  products Product[]
}
```

---

# 14. ID Conventions

## 14.1 Default ID strategy

For OneDayOS-owned records, use:

```prisma
id String @id @default(cuid())
```

This applies to:

```txt
Organization
Role
Permission
Employee
Product
Customer
Supplier
Warehouse
Module-owned business records
```

## 14.2 Supabase Auth user ID exception

`User.id` is an exception.

It must equal the Supabase Auth user ID:

```prisma
model User {
  id String @id // = Supabase auth.users.id
}
```

Do not generate a separate CUID for platform users.

## 14.3 Stable external IDs

Do not expose internal IDs as business numbers.

Use separate business fields when needed:

```prisma
employeeNo String
productCode String
referenceNo String
```

Example:

```prisma
model Employee {
  id         String @id @default(cuid())
  orgId      String
  employeeNo String

  @@unique([orgId, employeeNo])
}
```

## 14.4 No integer auto-increment IDs for tenant data

Do not use:

```prisma
id Int @id @default(autoincrement())
```

for OneDayOS tenant-scoped data.

Reasons:

- predictable IDs increase enumeration risk;
- string IDs are easier to merge/migrate;
- future distributed generation is easier;
- consistency across modules matters.

---

# 15. Timestamp Conventions

## 15.1 Required timestamps

Most durable records should include:

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

Examples:

```txt
Organization
User
Role
Product
Customer
Supplier
Warehouse
Module-owned records
Settings
```

## 15.2 Optional updatedAt exceptions

Small join tables may omit `updatedAt` if they are append/delete only:

```txt
UserRole
OrgModule may include enabledAt instead
```

But when in doubt, include `createdAt`.

## 15.3 Timezone rule

Store timestamps in UTC.

Display timestamps in the user/org locale at the UI layer.

Do not store Manila-local timestamps in the database.

## 15.4 Business date vs timestamp

Distinguish these:

```txt
createdAt     = technical timestamp
transactionAt = business event timestamp
postedDate    = accounting/business date
hiredAt       = employment date
```

Do not reuse `createdAt` for business meaning.

---

# 16. Tenant-Scoped Model Conventions

## 16.1 Every tenant-scoped model has orgId

Required:

```prisma
orgId String
org   Organization @relation(fields: [orgId], references: [id])
```

Example:

```prisma
model Product {
  id    String @id @default(cuid())
  orgId String

  org Organization @relation(fields: [orgId], references: [id])

  @@map("products")
}
```

## 16.2 Tenant-scoped unique constraints include orgId

Correct:

```prisma
@@unique([orgId, code])
@@unique([orgId, employeeNo])
@@unique([orgId, module, key])
```

Incorrect:

```prisma
code String @unique
employeeNo String @unique
```

A product code that is unique for Client A should not block Client B from using the same code.

## 16.3 Tenant-scoped indexes include orgId first

Common pattern:

```prisma
@@index([orgId, deletedAt])
@@index([orgId, createdAt])
@@index([orgId, status])
@@index([orgId, branchId])
```

For list pages, prefer indexes that match common filters:

```prisma
@@index([orgId, status, createdAt])
```

## 16.4 Cross-tenant global uniqueness is rare

Global uniqueness may be used for:

```txt
Organization.slug
User.email, if platform requires globally unique login emails
```

Everything else should usually be org-scoped.

---

# 17. Organization Model Convention

`Organization` is the tenant root.

Required fields:

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  logoUrl   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("organizations")
}
```

`Organization.slug` is a locator for URLs.

It is not authorization.

This URL:

```txt
/acme-corp/dashboard
```

only locates the org. Access still requires:

```txt
session user
+ platform User record
+ user.orgId === organization.id
```

---

# 18. User Model Convention

`User` is a platform login identity.

It is not the same thing as `Employee`.

Required shape:

```prisma
model User {
  id        String   @id // Supabase auth.users.id
  orgId     String
  name      String
  email     String
  avatarUrl String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  org      Organization @relation(fields: [orgId], references: [id])
  employee Employee?
  roles    UserRole[]

  @@unique([orgId, email])
  @@index([orgId, isActive])
  @@map("users")
}
```

## 18.1 Email uniqueness decision

For MVP single-org user membership, use:

```prisma
@@unique([orgId, email])
```

However, Supabase Auth itself may enforce global email uniqueness depending on project configuration.

That is acceptable for MVP.

Do not try to implement complex multi-org identity until a future ADR.

---

# 19. Permission Model Convention

The approved permissions model requires:

```txt
Role is org-scoped.
UserRole includes orgId.
Permission includes orgId.
Permission.resource is non-null.
Wildcard resource uses '*'.
Conditions are denied in MVP unless null.
```

Recommended schema shape:

```prisma
model Role {
  id        String   @id @default(cuid())
  orgId     String
  name      String
  isSystem  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  org         Organization @relation(fields: [orgId], references: [id])
  permissions Permission[]
  userRoles   UserRole[]

  @@unique([orgId, name])
  @@map("roles")
}

model UserRole {
  orgId  String
  userId String
  roleId String

  org  Organization @relation(fields: [orgId], references: [id])
  user User         @relation(fields: [userId], references: [id])
  role Role         @relation(fields: [roleId], references: [id])

  @@id([orgId, userId, roleId])
  @@index([orgId, roleId])
  @@map("user_roles")
}

model Permission {
  id         String @id @default(cuid())
  orgId      String
  roleId     String
  module     String
  resource   String
  action     String
  conditions Json?

  org  Organization @relation(fields: [orgId], references: [id])
  role Role         @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([orgId, roleId, module, resource, action])
  @@index([orgId, module, resource, action])
  @@map("permissions")
}
```

Important correction from the old MVP:

```prisma
resource String?
```

should not be used.

Use:

```prisma
resource String
```

with wildcard:

```txt
*
```

Reason: nullable columns inside unique constraints can behave in surprising ways and weaken permission uniqueness expectations.

---

# 20. Soft Delete Conventions

## 20.1 Business records use soft delete

Tenant business records should use:

```prisma
deletedAt DateTime?
deletedBy String?
```

Examples:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
StockMovement, if deletable
InventoryAdjustment, if deletable
CRM records
Leave requests, if deletable
```

## 20.2 `isActive` is not deletion

Do not use:

```prisma
isActive Boolean
```

as a deletion flag.

`isActive` means business status.

Examples:

```txt
Employee.isActive = still employed
Organization.isActive = tenant account active
User.isActive = login enabled
```

`deletedAt` means the record was removed from normal views.

## 20.3 Hard delete is restricted

Hard delete is allowed only for:

```txt
short-lived tokens
temporary import staging rows
failed setup rollback records
join records where deletion is semantically removal, such as UserRole
```

Hard delete is not allowed for normal business records.

## 20.4 Soft delete must record actor

Soft delete must set:

```ts
{
  deletedAt: new Date(),
  deletedBy: ctx.userId,
}
```

Do not set:

```ts
deletedBy: 'system'
```

unless the deletion is genuinely system-initiated and the event payload records why.

## 20.5 Query convention

Normal list/read queries must exclude soft-deleted records.

Correct:

```ts
where: {
  orgId: ctx.orgId,
  deletedAt: null,
}
```

Incorrect:

```ts
where: {
  orgId: ctx.orgId,
}
```

## 20.6 Do not rely only on Prisma `$extends`

The previous MVP used a Prisma extension to inject `deletedAt: null` for some query types. That idea was useful, but incomplete.

The restarted build must not treat `$extends` as the only soft-delete defense.

Reasons:

```txt
findUnique may bypass soft-delete filtering
findUniqueOrThrow may bypass soft-delete filtering
aggregate may bypass soft-delete filtering
groupBy may bypass soft-delete filtering
nested includes may bypass soft-delete filtering
raw SQL bypasses it completely
```

The primary protection should be:

```txt
TenantDb safe delegates
+ service conventions
+ tests
+ forbidden query linting where possible
```

A Prisma extension may still be used as defense-in-depth, but not as the only mechanism.

---

# 21. `findUnique` Rules

## 21.1 Forbidden by default for tenant-scoped records

This is forbidden for tenant-scoped models:

```ts
await prisma.product.findUnique({
  where: { id: productId },
})
```

Reason:

```txt
id alone does not prove tenant membership.
```

## 21.2 Use findFirst with orgId for ID lookups

Correct:

```ts
await prisma.product.findFirst({
  where: {
    id: productId,
    orgId: ctx.orgId,
    deletedAt: null,
  },
})
```

## 21.3 Composite unique exception

`findUnique` is allowed if the unique constraint includes `orgId`.

Schema:

```prisma
@@unique([orgId, code])
```

Query:

```ts
await prisma.product.findUnique({
  where: {
    orgId_code: {
      orgId: ctx.orgId,
      code,
    },
  },
})
```

## 21.4 Organization lookup exception

This is allowed:

```ts
await prisma.organization.findUnique({
  where: { slug: orgSlug },
})
```

But it does not grant access.

After loading by slug, Kernel must verify:

```ts
user.orgId === org.id
```

---

# 22. Relation Conventions

## 22.1 Relations must preserve tenant scope

When a tenant-scoped model references another tenant-scoped model, both should belong to the same organization.

Example:

```prisma
model Product {
  id         String @id @default(cuid())
  orgId      String
  categoryId String?

  category ProductCategory? @relation(fields: [categoryId], references: [id])
}
```

The database foreign key alone does not prove same-org membership unless the relation uses composite constraints. Prisma has limitations around composite relation ergonomics, so application/service tests are mandatory.

## 22.2 Validate related records before write

When creating a record with a related tenant-scoped ID, validate the related record belongs to the same org.

Example:

```ts
const category = await db.productCategory.findFirst({
  where: {
    id: input.categoryId,
    orgId: ctx.orgId,
    deletedAt: null,
  },
})

if (!category) {
  throw new AppError('NOT_FOUND', 'Product category not found.')
}
```

Then create:

```ts
await db.product.create({
  data: {
    orgId: ctx.orgId,
    categoryId: category.id,
    code: input.code,
    name: input.name,
  },
})
```

## 22.3 Avoid deep nested writes in modules

Avoid complex nested writes like:

```ts
prisma.product.create({
  data: {
    category: {
      create: { ... },
    },
  },
})
```

Prefer explicit service steps inside a transaction.

Reason:

```txt
Explicit steps are easier to validate for tenant isolation, events, and permissions.
```

---

# 23. Include and Select Rules

## 23.1 Prefer select over include

Prefer:

```ts
select: {
  id: true,
  code: true,
  name: true,
}
```

over:

```ts
include: {
  category: true,
  org: true,
}
```

Reasons:

- prevents over-fetching;
- avoids accidental sensitive data exposure;
- keeps API response contracts stable;
- reduces query cost.

## 23.2 Never return full Prisma records directly from APIs

Service result:

```ts
const product = await db.product.findFirst(...)
```

API response should map it to a DTO:

```ts
return {
  id: product.id,
  code: product.code,
  name: product.name,
  categoryName: product.category?.name ?? null,
}
```

Do not do:

```ts
return NextResponse.json({ data: product, error: null })
```

unless the DTO and Prisma model are deliberately identical and safe.

## 23.3 Include tenant-safe relations only

When including relations, ensure related models are tenant-safe.

Bad:

```ts
include: {
  user: true,
  org: true,
}
```

Better:

```ts
select: {
  id: true,
  name: true,
  createdByUser: {
    select: {
      id: true,
      name: true,
    },
  },
}
```

---

# 24. JSON Field Conventions

## 24.1 JSON is allowed only when schema flexibility is intentional

Allowed examples:

```txt
Setting.value
Permission.conditions, future only
Module-specific metadata
Dynamic Form metadata, future
Import error details
AI context snapshots, future
```

Not allowed:

```txt
Using JSON because modeling relations is inconvenient
Storing arbitrary module records as JSON blobs
Storing user permissions as JSON arrays
Storing financial transaction lines as JSON blobs
```

## 24.2 JSON fields require Zod schemas

Every JSON field must have a Zod schema at the application boundary.

Example:

```ts
const InventorySettingsSchema = z.object({
  lowStockAlertsEnabled: z.boolean().default(false),
  defaultWarehouseId: z.string().nullable(),
})
```

Do not write unvalidated JSON into the database.

## 24.3 Settings use JSON intentionally

Correct:

```prisma
model Setting {
  id     String @id @default(cuid())
  orgId  String
  module String
  key    String
  value  Json

  @@unique([orgId, module, key])
  @@map("settings")
}
```

`Setting.value` should not be a stringified JSON column.

---

# 25. Enum and Status Conventions

## 25.1 Use Prisma enums only for stable platform-owned values

Prisma enums are acceptable for values that are:

```txt
small
stable
platform-owned
unlikely to be customized per client
```

Examples:

```prisma
enum SubscriptionStatus {
  trial
  active
  suspended
  cancelled
}
```

However, Prisma enum naming limitations and migration overhead must be considered.

## 25.2 Use strings for configurable business statuses

Use strings for statuses that may differ by module or client.

Examples:

```txt
lead status
incident severity
purchase request state
custom workflow state
```

These may eventually become configurable workflow states.

## 25.3 Zod validates string statuses

Example:

```ts
const StockMovementTypeSchema = z.enum([
  'stock_in',
  'stock_out',
  'adjustment',
  'transfer',
])
```

Do not accept arbitrary status strings from clients without validation.

---

# 26. Money, Quantity, and Measurement Conventions

## 26.1 Never use Float for money

Forbidden:

```prisma
amount Float
price Float
```

Acceptable options:

```prisma
amountCents Int
```

or:

```prisma
amount Decimal @db.Decimal(12, 2)
```

## 26.2 MVP recommendation for Philippine peso amounts

For simple PHP amounts:

```prisma
amountCentavos Int
```

This avoids floating-point rounding errors.

Example:

```txt
₱1,250.75 = 125075 centavos
```

## 26.3 Use Decimal for inventory quantities where fractional units matter

Inventory may require:

```txt
1.5 kg
0.25 liter
2.75 meters
```

Use:

```prisma
quantity Decimal @db.Decimal(18, 4)
```

Do not use `Float` for stock quantities.

## 26.4 Units are separate fields

Example:

```prisma
unit String @default("pcs")
```

Later, units may become a shared object if repeated across modules.

Do not overbuild a Unit of Measure engine before Inventory proves the need.

---

# 27. Transaction Conventions

## 27.1 Use transactions for multi-step business mutations

Required when a mutation:

- creates multiple related records;
- updates balances;
- writes movement history;
- creates a user and organization;
- changes roles and permissions together;
- must emit an event after persistence.

## 27.2 Modules use SDK transaction wrapper

Correct:

```ts
await sdk.db.transaction(ctx, async (tx) => {
  const product = await tx.product.create({ data })
  await tx.events.stage('objects.product.created', { productId: product.id })
  return product
})
```

The exact `tx.events.stage` API may be implemented later. The principle is:

```txt
Database mutation and event publication must not drift apart silently.
```

## 27.3 No module-level raw prisma.$transaction

Forbidden inside modules:

```ts
await prisma.$transaction(...)
```

Allowed inside SDK/Kernel implementation:

```ts
await prisma.$transaction(...)
```

## 27.4 Event emission after transactions

Do not emit success events before the transaction commits.

Bad:

```ts
await sdk.events.emit(ctx, 'objects.product.created', payload)
await db.product.create(...)
```

Better MVP pattern:

```ts
const product = await sdk.db.transaction(ctx, async (tx) => {
  return tx.product.create(...)
})

await sdk.events.emit(ctx, 'objects.product.created', {
  productId: product.id,
})
```

Future pattern:

```txt
transaction writes outbox row
background worker publishes event
```

Do not build the full outbox system in MVP unless the background jobs document is frozen.

---

# 28. Error Handling Conventions

## 28.1 Prisma errors are not API responses

Do not return raw Prisma errors to users.

Forbidden:

```ts
return NextResponse.json({ data: null, error: String(error) })
```

## 28.2 Map Prisma errors to app errors

Create:

```txt
src/kernel/db/prisma-error-map.ts
```

Expected behavior:

| Prisma Condition | API Meaning |
|---|---|
| Unique constraint violation | `CONFLICT` / 409 |
| Record not found | `NOT_FOUND` / 404 |
| FK violation | `VALIDATION_ERROR` or `NOT_FOUND` |
| Connection failure | `INTERNAL_ERROR` / 500 |

Example conceptual mapping:

```ts
export function mapPrismaError(error: unknown): AppError {
  if (isUniqueConstraintError(error)) {
    return new AppError('CONFLICT', 'A record with this value already exists.')
  }

  return new AppError('INTERNAL_ERROR', 'Unexpected database error.')
}
```

## 28.3 API contract remains `{ data, error }`

Even when Prisma fails, APIs must return the Kernel API Contract shape:

```json
{
  "data": null,
  "error": {
    "code": "CONFLICT",
    "message": "A product with this code already exists."
  }
}
```

---

# 29. Migration Conventions

## 29.1 Prisma Migrate is authoritative

All schema changes go through Prisma migrations.

Allowed:

```bash
npx prisma migrate dev --name add_inventory_stock_movements
npx prisma migrate deploy
```

Forbidden for shared environments:

```bash
npx prisma db push
```

Forbidden always unless specifically approved:

```txt
manual Supabase dashboard schema edits
hand-edited production tables
untracked SQL changes
```

## 29.2 Migration naming

Use descriptive snake_case names:

```bash
npx prisma migrate dev --name init_kernel
npx prisma migrate dev --name add_business_objects
npx prisma migrate dev --name add_inventory_stock_movements
npx prisma migrate dev --name add_permission_resource_wildcards
```

Bad:

```bash
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
npx prisma migrate dev --name changes
```

## 29.3 Never edit applied migrations

Once a migration has been applied to a shared or production database, do not edit it.

Create a new migration instead.

## 29.4 Safe migration pattern

For shared production data, prefer expand-and-contract:

```txt
1. Add nullable column or new table.
2. Deploy code that writes both old and new shape if needed.
3. Backfill data.
4. Validate.
5. Make column required or remove old column in a later migration.
```

Do not add a required column without a default to a table with existing rows.

Bad:

```prisma
barcode String
```

Better:

```prisma
barcode String?
```

Then backfill and later make required only if truly necessary.

## 29.5 Production migrations require backup

Production migration process is finalized in:

```txt
15-deployment-operations/03-database-migrations-production.md
```

Until then:

```txt
No production migration without backup.
No production migration without tested rollback plan.
No production migration directly from Claude without human review.
```

---

# 30. Prisma Generate and Build Rules

## 30.1 Generate before typecheck/build

The previous MVP had an open issue where fresh CI clones could fail because `prisma generate` was not guaranteed in the build step.

The restarted build must include Prisma generation in the scripts.

Recommended scripts:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "typecheck": "tsc --noEmit",
    "build": "prisma generate && next build",
    "check": "npm run db:generate && npm run typecheck && npm run test:run && npm run build"
  }
}
```

If `build` already runs generation through a framework hook, document that explicitly. Do not rely on hidden behavior.

## 30.2 CI must run Prisma validate

Recommended:

```json
{
  "scripts": {
    "db:validate": "prisma validate"
  }
}
```

CI should include:

```bash
npm run db:validate
npm run db:generate
npm run typecheck
npm run test:run
npm run build
```

---

# 31. Seeding Conventions

## 31.1 Seed scripts must be idempotent

Seed scripts should be safe to run more than once.

Use:

```ts
upsert
```

or check-before-create patterns.

Do not create duplicate demo data on every run.

## 31.2 Seed script uses its own Prisma client

Allowed:

```ts
// prisma/seed.ts
const prisma = new PrismaClient({ adapter })
```

This is an exception to the one-client-file rule because seed scripts run outside the app runtime.

## 31.3 Seed at least two test organizations in test fixtures

For tests, single-org fixtures are insufficient.

Required test fixture orgs:

```txt
orgA
orgB
```

Required users:

```txt
orgA admin
orgA staff with limited permissions
orgB admin
unauthenticated request
```

## 31.4 Production seed must be minimal

Production seed should create only required platform defaults.

Examples:

```txt
system permission constants, if stored
default starter plan, if stored
initial owner org during operator-led onboarding, if requested
```

Do not seed fake demo data into production client orgs.

## 31.5 Demo org is not a real client

Demo seed data may exist for local/staging:

```txt
demo-corp
sample users
sample products
sample modules
```

But production clients should be created through the approved onboarding flow, not by modifying seed scripts per client.

---

# 32. Pagination Conventions

## 32.1 List APIs must be paginated

Do not return unlimited list results.

Bad:

```ts
await db.product.findMany({ where: { orgId: ctx.orgId } })
```

Better:

```ts
await db.product.findMany({
  where: { orgId: ctx.orgId, deletedAt: null },
  take: limit,
  skip: offset,
  orderBy: { createdAt: 'desc' },
})
```

## 32.2 Default pagination

Recommended defaults:

```txt
default limit: 50
maximum limit: 100
```

## 32.3 Cursor pagination for high-volume records

For high-volume modules, prefer cursor pagination later:

```ts
cursor: { id: lastSeenId }
take: 50
```

Do not build a generic pagination engine before tables and module needs are proven.

---

# 33. Search and Filtering Conventions

## 33.1 Basic search stays module-local first

Before a Platform Search Service exists, modules may implement simple search using Prisma filters.

Example:

```ts
where: {
  orgId: ctx.orgId,
  deletedAt: null,
  OR: [
    { code: { contains: query, mode: 'insensitive' } },
    { name: { contains: query, mode: 'insensitive' } },
  ],
}
```

## 33.2 Search must remain tenant-scoped

Every search query must include tenant scope.

Never search across all orgs unless the user is an internal OneDayOS operator and the internal admin model has been formally implemented.

## 33.3 Future full-text search

Full-text search belongs to:

```txt
10-platform-services/09-search-service.md
```

Do not add Meilisearch, Typesense, Elasticsearch, pgvector, or external search services in MVP without ADR.

---

# 34. Import/Export Conventions

Bulk import/export is not implemented in MVP, but Prisma conventions must prepare for it.

## 34.1 Imports must validate before writing

Do not stream unvalidated CSV rows directly into Prisma writes.

Required future pattern:

```txt
parse
validate
stage
review errors
commit valid rows
emit events
```

## 34.2 Exports must use DTOs

Do not export raw Prisma records.

Export only approved fields.

## 34.3 Exports must be permission-aware

A user who cannot read a module/resource cannot export it.

---

# 35. AI Query Conventions

AI must not access Prisma directly.

Forbidden:

```txt
AI agent generates arbitrary Prisma queries.
AI agent runs raw SQL.
AI agent receives unscoped Prisma client.
```

Future AI data access must go through:

```txt
PlatformContext
SDK
permission-aware query helpers
approved read models
```

AI cannot be a shortcut around tenant isolation.

---

# 36. Raw SQL Rules

## 36.1 Raw SQL is forbidden in modules

Forbidden:

```ts
await prisma.$queryRaw`SELECT * FROM products`
```

## 36.2 Raw SQL is allowed only in Kernel/Data with review

Allowed only for:

```txt
performance-critical reporting
migration support
future RLS setup
database maintenance scripts
```

Requires:

```txt
ADR or explicit manual instruction
tenant scoping
parameterization
tests
review
```

## 36.3 Never concatenate SQL strings

Forbidden:

```ts
await prisma.$queryRawUnsafe(`SELECT * FROM products WHERE name = '${name}'`)
```

If raw SQL is approved, it must use parameterized APIs.

---

# 37. N+1 Query Rules

## 37.1 Avoid repeated queries inside loops

Bad:

```ts
const products = await db.product.findMany(...)

for (const product of products) {
  product.category = await db.productCategory.findFirst({
    where: { id: product.categoryId, orgId: ctx.orgId },
  })
}
```

Better:

```ts
const products = await db.product.findMany({
  where: { orgId: ctx.orgId, deletedAt: null },
  select: {
    id: true,
    code: true,
    name: true,
    category: {
      select: { id: true, name: true },
    },
  },
})
```

## 37.2 Use relation loading carefully

Relation loading is allowed when:

```txt
relations are tenant-safe
selected fields are limited
the resulting query is understandable
```

Do not include full nested objects casually.

---

# 38. Business Object Extension Pattern in Prisma

Business Objects must remain minimal.

Module-specific fields go in module extension tables.

Example:

```prisma
model Product {
  id          String @id @default(cuid())
  orgId       String
  code        String
  name        String
  description String?
  unit        String @default("pcs")

  inventoryExtension InventoryProductExtension?

  @@unique([orgId, code])
  @@map("products")
}

model InventoryProductExtension {
  id              String @id @default(cuid())
  orgId           String
  productId        String
  reorderPoint     Decimal? @db.Decimal(18, 4)
  minimumStock     Decimal? @db.Decimal(18, 4)
  valuationMethod  String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  deletedAt        DateTime?
  deletedBy        String?

  product Product @relation(fields: [productId], references: [id])

  @@unique([orgId, productId])
  @@index([orgId, deletedAt])
  @@map("inventory_product_extensions")
}
```

Important:

```txt
Product does not belong to Inventory.
Inventory extends Product.
```

---

# 39. Module-Owned Model Conventions

Module-owned models must include:

```prisma
id        String   @id @default(cuid())
orgId     String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

Most module-owned models also include:

```prisma
deletedAt DateTime?
deletedBy String?
```

Example:

```prisma
model StockMovement {
  id          String   @id @default(cuid())
  orgId       String
  productId   String
  warehouseId String
  type        String
  quantity    Decimal  @db.Decimal(18, 4)
  occurredAt  DateTime
  referenceNo String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org       Organization @relation(fields: [orgId], references: [id])
  product   Product      @relation(fields: [productId], references: [id])
  warehouse Warehouse    @relation(fields: [warehouseId], references: [id])

  @@index([orgId, productId, occurredAt])
  @@index([orgId, warehouseId, occurredAt])
  @@index([orgId, deletedAt])
  @@map("stock_movements")
}
```

Before adding module models, the module specification must be written and approved.

---

# 40. Settings Model Convention

Settings use:

```prisma
model Setting {
  id        String   @id @default(cuid())
  orgId     String
  module    String
  key       String
  value     Json
  updatedAt DateTime @updatedAt

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, module, key])
  @@map("settings")
}
```

Rules:

```txt
module = 'kernel' for platform settings
module = module ID for module settings
key = stable setting key
value = JSON validated by Zod
```

Examples:

```txt
kernel.theme
kernel.locale
inventory.defaultWarehouseId
inventory.lowStockAlertsEnabled
```

Do not create random settings tables per module unless the module has a strong domain-specific configuration model.

---

# 41. OrgModule Convention

`OrgModule` controls module enablement.

Recommended schema:

```prisma
model OrgModule {
  id        String   @id @default(cuid())
  orgId     String
  moduleId  String
  isEnabled Boolean  @default(true)
  enabledAt DateTime @default(now())
  disabledAt DateTime?

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, moduleId])
  @@index([orgId, isEnabled])
  @@map("org_modules")
}
```

Rules:

```txt
A module existing in code does not mean it is enabled for an org.
A module enabled for an org does not mean every user can access it.
Permissions still apply.
```

---

# 42. Prisma and Supabase Auth Boundary

Supabase Auth owns authentication identity.

Prisma owns OneDayOS platform records.

Do not attempt to model Supabase `auth.users` in Prisma.

The bridge is:

```txt
Supabase auth user ID = Prisma User.id
```

Registration must be server-owned.

Correct:

```txt
POST /api/kernel/auth/register
  creates Supabase auth user
  creates Organization
  creates Prisma User
  creates Subscription
  creates Admin Role
  grants wildcard Permission
  assigns UserRole
```

Incorrect:

```txt
client calls supabase.auth.signUp()
separate trigger or later client call creates Prisma User
```

Reason:

```txt
That creates orphaned auth users and broken login states.
```

---

# 43. Prisma Test Conventions

## 43.1 Do not write tautological tests

Bad test:

```ts
it('adds deletedAt null', () => {
  const where = { orgId: 'org1' }
  where.deletedAt = null
  expect(where.deletedAt).toBeNull()
})
```

This tests the test, not the code.

## 43.2 Test real wrappers

If `TenantDb` injects tenant scope, test the wrapper.

Example test intent:

```txt
calling db.product.findMany() includes orgId from ctx
calling db.product.findById(id) cannot return another org's product
calling db.product.delete(id) soft-deletes with deletedBy
```

## 43.3 Every tenant-sensitive test uses two orgs

Minimum fixture:

```txt
orgA
orgB
orgAAdmin
orgAStaff
orgBAdmin
productA in orgA
productB in orgB
```

Test:

```txt
orgA user cannot read productB
orgA user cannot update productB
orgA user cannot soft-delete productB
orgA user cannot relate productB to orgA record
```

## 43.4 Tests must cover permission and tenant separately

A denied request can be denied for different reasons.

Test both:

```txt
authenticated wrong org -> safe 404 ORG_NOT_FOUND
right org but missing permission -> 403 FORBIDDEN
```

## 43.5 Generated modules must include database safety tests

The module generator must generate tests for:

```txt
tenant-scoped list
cross-tenant read denial
cross-tenant mutation denial
permission denial
soft delete
client-supplied orgId rejection
```

---

# 44. Architecture Checks

The project should include a future script:

```bash
npm run check:architecture
```

It should block:

```txt
modules importing @/kernel/*
modules importing @/kernel/db/client
modules calling new PrismaClient()
modules calling sdk.getDb(orgId)
API routes reading body.orgId for tenant-scoped operations
API routes reading searchParams.get('orgId')
findUnique({ where: { id } }) on tenant-scoped models in module code
hard delete on soft-deletable models
raw SQL in modules
```

This may be implemented through:

```txt
ESLint rules
custom AST script
simple grep checks at first
```

The first version can be simple. The important part is that architecture violations fail CI.

---

# 45. Forbidden Patterns

## 45.1 Forbidden imports

```ts
import { prisma } from '@/kernel/db/client'
```

inside:

```txt
src/modules/*
src/app/(platform)/[orgSlug]/[module]/* client components
```

## 45.2 Forbidden tenant identity patterns

```ts
const orgId = body.orgId
const orgId = request.nextUrl.searchParams.get('orgId')
sdk.getDb(orgId)
InventoryService.list(orgId)
```

## 45.3 Forbidden tenant lookup patterns

```ts
findUnique({ where: { id } })
```

on tenant-scoped records.

## 45.4 Forbidden deletion patterns

```ts
await prisma.product.delete(...)
await prisma.product.deleteMany(...)
```

for soft-deletable records.

## 45.5 Forbidden migration shortcuts

```bash
npx prisma db push
```

against shared/staging/production environments.

## 45.6 Forbidden raw SQL

```ts
prisma.$queryRawUnsafe(...)
```

inside app/module code.

## 45.7 Forbidden browser usage

```tsx
'use client'
import { sdk } from '@/sdk/server'
```

or:

```tsx
'use client'
import { prisma } from '@/kernel/db/client'
```

---

# 46. Recommended Initial Implementation Tasks for Claude

When this document is frozen, Claude may be asked to implement the Prisma foundation.

Recommended task sequence:

```txt
1. Install Prisma packages.
2. Create prisma.config.ts.
3. Create prisma/schema.prisma with Kernel MVP models only.
4. Create src/kernel/db/client.ts.
5. Create src/kernel/db/tenant-db.ts.
6. Create SDK server db wrapper.
7. Add Prisma scripts to package.json.
8. Add seed script.
9. Add tests for Prisma client initialization.
10. Add tests for TenantDb tenant scoping.
11. Add architecture check for forbidden Prisma imports.
12. Run prisma validate.
13. Run prisma generate.
14. Run typecheck.
15. Run tests.
16. Run build.
```

Claude must not implement Inventory during this task.

Claude must not implement Platform Services during this task.

Claude must not implement Dynamic CRUD during this task.

---

# 47. Suggested Claude Prompt

```md
You are implementing the OneDayOS Prisma foundation.

Authoritative documents:
- docs/engineering-manual/06-data/00-database-architecture.md
- docs/engineering-manual/06-data/01-tenancy-data-isolation.md
- docs/engineering-manual/06-data/02-prisma-conventions.md
- docs/engineering-manual/05-sdk/02-sdk-db-access.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md

Rules:
- Do not implement business modules.
- Do not implement Platform Services.
- Do not use FastAPI.
- Do not create database-per-client architecture.
- Do not let modules import @/kernel/db/client.
- Do not implement sdk.getDb(orgId).
- Implement sdk.getDb(ctx).
- Client-supplied orgId is forbidden.
- Use Prisma migrations, not db push.
- Add tests for tenant safety and forbidden patterns.
- Stop if Prisma version behavior conflicts with the manual.

Task:
Implement only the Prisma foundation described in the documents above.
```

---

# 48. Acceptance Criteria

This document is satisfied when:

```txt
[ ] Prisma config exists and matches selected Prisma version.
[ ] Prisma schema exists with approved Kernel MVP models only.
[ ] Prisma client initializes from one Kernel file.
[ ] Prisma Client generation is part of build/check workflow.
[ ] Raw Prisma is not imported by modules.
[ ] sdk.getDb(ctx) exists.
[ ] sdk.getDb(orgId) does not exist.
[ ] TenantDb or equivalent wrapper is implemented.
[ ] Tenant-scoped queries include orgId.
[ ] Client-supplied orgId is rejected in APIs.
[ ] findUnique({ id }) is not used for tenant-scoped module/business records.
[ ] Soft-deletable records use deletedAt/deletedBy.
[ ] Hard delete is not used for business records.
[ ] Migrations use Prisma Migrate.
[ ] Seed script is idempotent.
[ ] Test fixtures include at least two organizations.
[ ] Cross-tenant read tests exist.
[ ] Cross-tenant write tests exist.
[ ] Permission-denial tests exist where applicable.
[ ] Prisma errors are mapped to API errors.
[ ] npm run typecheck passes.
[ ] npm run test:run passes.
[ ] npm run build passes.
```

---

# 49. Founder Review Questions

Before freezing this document, answer these:

## 49.1 Should `TenantDb` be a real restricted wrapper before Inventory?

Recommendation: yes.

A real wrapper reduces the chance of Claude forgetting `orgId` and `deletedAt` filters.

## 49.2 Should monetary values use integer centavos or Decimal?

Recommendation:

```txt
Simple PHP amounts: amountCentavos Int
Complex accounting/tax values: Decimal, later if required
Inventory quantities: Decimal
```

## 49.3 Should Prisma enums be used?

Recommendation:

```txt
Use Prisma enums only for stable Kernel-owned statuses.
Use strings + Zod for module workflow statuses.
```

## 49.4 Should database columns be snake_case?

Recommendation: no for MVP.

Use Prisma camelCase fields and plural snake_case table maps. Avoid excessive `@map` noise unless there is a strong database operations reason.

## 49.5 Should RLS be implemented now?

Recommendation: no.

Prepare for RLS, but do not make it the primary MVP isolation mechanism. The primary MVP isolation mechanism is:

```txt
PlatformContext
+ SDK-controlled database access
+ tenant-scoped queries
+ tests
```

---

# 50. Final Position

Prisma should help OneDayOS move fast, but it must not become a shortcut around architecture.

The core database rule is simple:

```txt
No verified PlatformContext, no tenant data access.
```

The second rule is equally important:

```txt
Modules do not own Prisma. The platform SDK owns database access.
```

If those two rules hold, OneDayOS can safely serve many organizations from one shared database while still preserving the future option to change routing, add RLS, introduce read replicas, or support enterprise database isolation later.
