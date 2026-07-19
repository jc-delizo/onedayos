# OneDayOS Engineering Manual — 06 Data — 06 Row-Level Security Plan

**Document Path:** `docs/engineering-manual/06-data/06-row-level-security-plan.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** No — this is a future defense-in-depth plan, not an MVP implementation ticket  
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
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/04-migrations-seeding.md`
- `06-data/05-data-validation-zod.md`

---

# 1. Purpose

This document defines the **future Row-Level Security plan** for OneDayOS.

Row-Level Security, or RLS, is a PostgreSQL database feature that restricts which rows can be selected, inserted, updated, or deleted based on database policies.

For OneDayOS, RLS is important because OneDayOS is a multi-tenant business platform:

```txt
One OneDayOS platform
One shared PostgreSQL database
Many organizations
Tenant-scoped rows separated by orgId
```

If application code makes a tenant-scoping mistake, RLS should eventually provide an additional database-level guardrail.

However, RLS is **not** the primary MVP tenant isolation mechanism.

The primary MVP tenant isolation mechanism is still:

```txt
Authenticated Supabase user
  → Prisma User lookup
  → orgSlug lookup
  → user.orgId === org.id check
  → verified PlatformContext
  → sdk.getDb(ctx)
  → tenant-scoped queries
  → permission enforcement
  → security tests
```

RLS comes later as **defense-in-depth**, not as a substitute for correct Kernel, SDK, API, and service design.

---

# 2. Decision Summary

## 2.1 Core decision

OneDayOS should **not implement PostgreSQL RLS in the first restarted MVP build**.

OneDayOS should prepare for RLS now, but enable it later after the Kernel, SDK, database conventions, and at least one official module are stable.

## 2.2 Why not MVP?

RLS adds complexity in five areas:

1. Database roles.
2. Connection pooling.
3. Prisma transaction behavior.
4. Migration SQL outside normal Prisma model declarations.
5. Debugging access-denied behavior.

Adding this complexity before the app-layer tenant model is proven would slow down the platform without solving the current highest-risk problem.

The previous Kernel v2 plan already said RLS should be Phase 1.5, not Phase 1. That remains the correct decision.

## 2.3 What changes now?

Even though RLS is deferred, every restarted-build decision must remain RLS-compatible.

That means:

```txt
Every tenant-scoped table has orgId.
Every tenant-scoped query uses verified PlatformContext.
Every service receives PlatformContext, not loose orgId.
Every API derives tenant context server-side.
Every tenant-sensitive test uses at least two organizations.
No module imports raw Prisma.
No module uses client-supplied orgId.
No module assumes it can access cross-tenant data.
```

---

# 3. RLS Is Defense-in-Depth, Not Product Authorization

## 3.1 RLS protects tenant boundaries

OneDayOS RLS should answer this question:

> Is this row part of the current verified organization?

Example:

```txt
Current database context org = org_a
Row orgId = org_a
→ allowed

Current database context org = org_a
Row orgId = org_b
→ denied
```

## 3.2 RLS should not replace RBAC in MVP

RLS should not answer this question in MVP:

> Does this user have permission to approve purchase requests over ₱50,000?

That belongs to the Kernel authorization layer:

```txt
sdk.permissions.require(ctx, {
  module: 'purchasing',
  resource: 'purchase_request',
  action: 'approve',
})
```

## 3.3 RLS should not replace module enablement

RLS should not answer this question:

> Is the Inventory module enabled for this organization?

That belongs to Kernel module enablement:

```txt
sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

## 3.4 RLS should not replace soft delete

RLS should not primarily answer this question:

> Is this record deleted?

Soft delete remains a data lifecycle concern handled by SDK/service query conventions:

```txt
deletedAt IS NULL
```

RLS may eventually include additional safety for deleted rows, but the first RLS rollout should stay narrow and focus on tenant isolation only.

---

# 4. Current OneDayOS Position

## 4.1 Current required model

The restarted OneDayOS platform uses:

```txt
Next.js route handlers
Supabase Auth
Prisma ORM
PostgreSQL on Supabase
Vercel hosting
```

OneDayOS does **not** use FastAPI for the core platform.

## 4.2 Current tenant model

```txt
Organization = tenant boundary
User.orgId = user membership
Every tenant-scoped table = has orgId
orgSlug = route locator only
PlatformContext = verified tenant/user/module context
```

## 4.3 Current database access model

```ts
sdk.getDb(ctx)
```

not:

```ts
sdk.getDb(orgId)
```

and not:

```ts
import { prisma } from '@/kernel/db/client'
```

inside modules.

## 4.4 Current security model

RLS does not remove the need for:

```txt
API auth helpers
org membership checks
module enablement checks
permission checks
Zod validation
tenant-scoped query filters
two-org security tests
```

The application must be secure even before RLS exists.

---

# 5. Non-Goals

This document does **not** authorize Claude to implement RLS immediately.

This document does **not** introduce FastAPI, SQLAlchemy, Alembic, or a Python database layer.

This document does **not** move business authorization into PostgreSQL policies.

This document does **not** allow browser clients to directly query business tables through Supabase Data API.

This document does **not** allow modules to write raw SQL.

This document does **not** allow modules to import raw Prisma.

This document does **not** allow client-supplied `orgId`.

This document does **not** solve per-client database isolation.

This document does **not** replace the Production Readiness Gate.

---

# 6. When RLS Should Be Implemented

## 6.1 Do not implement in the first restarted Kernel build

The restarted build should first complete:

```txt
Kernel auth
Organizations and tenancy
Users, roles, permissions
Authorization enforcement
Kernel API contracts
SDK server/client split
SDK DB access
SDK auth/permissions
SDK events
SDK tests
Database architecture
Tenancy data isolation
Prisma conventions
Soft delete
Migrations and seeding
Zod validation
```

## 6.2 RLS implementation trigger

RLS should be revisited after all of the following are true:

```txt
[ ] Production Readiness Gate passes without RLS
[ ] Tenant isolation tests pass at API and service level
[ ] At least one official module exists
[ ] The SDK DB access pattern is stable
[ ] The team has verified live Supabase Postgres migration workflow
[ ] The team has created a non-superuser app database role strategy
[ ] The first RLS policy can be tested on a staging clone
```

## 6.3 Earlier implementation trigger

RLS may be accelerated if:

```txt
[ ] OneDayOS signs a high-security client
[ ] A client explicitly requires database-level tenant isolation
[ ] OneDayOS exposes any direct Supabase Data API access to clients
[ ] Background jobs or reporting increase the risk of cross-tenant query mistakes
```

Even then, RLS should be implemented through a focused frozen manual document and Claude implementation prompt.

---

# 7. RLS Strategy Options

## 7.1 Option A — Use Supabase Auth JWT helpers only

Supabase commonly demonstrates RLS policies using helpers such as:

```sql
auth.uid()
auth.jwt()
```

Example pattern:

```sql
CREATE POLICY "Users can see own rows"
ON profiles
FOR SELECT
USING ((select auth.uid()) = user_id);
```

This works well when the application accesses tables through Supabase’s client libraries and PostgREST/Data API using user JWTs.

### Pros

```txt
Native Supabase pattern.
Good for client-side Supabase table access.
Directly tied to Supabase Auth.
```

### Cons for OneDayOS

```txt
OneDayOS core backend uses Prisma server-side.
OneDayOS tenant identity is org-based, not just user-based.
OneDayOS should not expose business tables directly to browser clients.
RBAC/module checks still need application logic.
```

### Decision

Do not use this as the main OneDayOS RLS strategy.

It may still be useful for special tables later, but not for core business data.

---

## 7.2 Option B — Use custom PostgreSQL transaction context

The preferred future strategy is to set tenant context inside the database transaction.

Conceptually:

```sql
SELECT set_config('app.org_id', 'org_123', true);
SELECT set_config('app.user_id', 'user_123', true);
```

Then policies read:

```sql
current_setting('app.org_id', true)
```

Example:

```sql
USING ("orgId" = current_setting('app.org_id', true))
```

The third `set_config` argument should be `true` so the value applies only to the current transaction.

### Pros

```txt
Works with server-side Prisma.
Fits PlatformContext.
Keeps org-based tenancy explicit.
Does not require browser table access.
Can support background jobs later.
Can support future support/admin contexts carefully.
```

### Cons

```txt
Every RLS-protected Prisma operation must run in the correct transaction context.
Connection pooling makes session-level settings dangerous.
Prisma abstractions make this easy to get subtly wrong.
Requires serious testing.
```

### Decision

This is the preferred future OneDayOS RLS strategy.

But it should not be implemented until the SDK DB contract is stable.

---

## 7.3 Option C — Database per tenant

A future enterprise model could isolate each tenant into its own database.

### Pros

```txt
Strong isolation.
Easier per-client restore.
Potential enterprise sales story.
```

### Cons

```txt
Harder migrations.
Harder support.
Harder one-day delivery.
Higher operational cost.
Harder AppCare.
Harder analytics/reporting.
Harder local development.
```

### Decision

Do not use database-per-tenant in MVP.

Keep it as a future enterprise option only.

---

# 8. Preferred Future RLS Architecture

The preferred future architecture is:

```txt
API route
  → sdk.auth.requireApiModuleContext(...)
  → verified PlatformContext
  → sdk.db.withRlsContext(ctx, async (db) => { ... })
  → Prisma transaction begins
  → set_config('app.org_id', ctx.orgId, true)
  → set_config('app.user_id', ctx.userId, true)
  → service query runs inside same transaction
  → RLS policies enforce orgId
```

The application still includes `where: { orgId: ctx.orgId }` in queries.

This duplication is intentional.

```txt
Application-level org filter = primary security + performance + clarity
RLS org policy = database-level defense-in-depth
```

RLS should catch mistakes, not become an excuse to remove explicit tenant filters.

---

# 9. Future SDK API Shape

RLS should be introduced through the SDK, not through direct Prisma usage.

## 9.1 Existing required pattern

```ts
const db = sdk.getDb(ctx)
```

## 9.2 Future RLS-aware pattern

The implementation may evolve to:

```ts
await sdk.db.withRlsContext(ctx, async (db) => {
  return ProductService.list(ctx, db)
})
```

or:

```ts
const db = await sdk.getDb(ctx)
```

where `db` is already tenant-context-aware.

## 9.3 Preferred explicit wrapper

The explicit wrapper is clearer:

```ts
await sdk.db.withRlsContext(ctx, async (db) => {
  return db.product.findMany({
    where: {
      orgId: ctx.org.id,
      deletedAt: null,
    },
  })
})
```

## 9.4 Why explicit is safer

An explicit wrapper makes the transaction boundary visible.

That matters because RLS context must be set on the same database connection and inside the same transaction as the query.

This is safer than pretending `sdk.getDb(ctx)` magically protects every future query without visible transaction semantics.

## 9.5 MVP rule remains unchanged

Until RLS exists, modules still use:

```ts
sdk.getDb(ctx)
```

Claude must not invent RLS wrappers before this document becomes implementation-approved.

---

# 10. Example Future Implementation Sketch

This is illustrative, not implementation-approved code.

```ts
export async function withRlsContext<T>(
  ctx: PlatformContext,
  fn: (db: PrismaTransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config('app.org_id', ${ctx.org.id}, true)
    `

    await tx.$executeRaw`
      SELECT set_config('app.user_id', ${ctx.user.id}, true)
    `

    return fn(tx)
  })
}
```

Important notes:

```txt
The set_config calls must run inside the same transaction.
The setting must be transaction-local.
The module must not call set_config directly.
The module must not call raw SQL directly.
The SDK owns this behavior.
```

---

# 11. Database Role Requirement

## 11.1 RLS only helps if the app role is subject to RLS

PostgreSQL RLS can be bypassed by superusers and roles with `BYPASSRLS`.

Table owners normally bypass RLS unless `FORCE ROW LEVEL SECURITY` is enabled.

Therefore, OneDayOS cannot assume RLS is effective unless the application database connection uses a role that is actually subject to RLS.

## 11.2 Future required roles

When RLS is implemented, OneDayOS should separate database responsibilities:

```txt
Migration role
  - owns schema changes
  - can create/alter tables and policies
  - used only by migration pipeline

Application role
  - used by Vercel runtime
  - not superuser
  - no BYPASSRLS
  - subject to RLS policies
  - has only required table privileges

Read-only analytics role, future
  - subject to RLS or restricted to safe views
  - not MVP
```

## 11.3 Supabase caution

In Supabase projects, it is common for backend code to connect using powerful database credentials.

That may bypass RLS depending on role privileges and table ownership.

Before implementing RLS, OneDayOS must test the exact Supabase connection role used by Vercel and confirm that RLS policies apply to it.

## 11.4 Mandatory staging proof

Before RLS is called “implemented,” the team must prove:

```txt
[ ] App runtime DB user is not superuser
[ ] App runtime DB user does not have BYPASSRLS
[ ] App runtime DB user is subject to RLS
[ ] FORCE ROW LEVEL SECURITY behavior is verified where needed
[ ] Cross-tenant query returns no rows when context is wrong
[ ] Insert/update with wrong orgId fails
```

---

# 12. Policy Design Principles

## 12.1 Keep policies simple

First RLS policies should be boring:

```sql
"orgId" = current_setting('app.org_id', true)
```

Do not encode complex business rules into the first RLS rollout.

## 12.2 Use command-specific policies

Prefer separate policies for:

```txt
SELECT
INSERT
UPDATE
DELETE
```

This makes behavior easier to reason about and test.

## 12.3 Use `USING` and `WITH CHECK` correctly

For existing rows:

```sql
USING ("orgId" = current_setting('app.org_id', true))
```

For new or modified rows:

```sql
WITH CHECK ("orgId" = current_setting('app.org_id', true))
```

The insert/update policy must prevent a user from creating or moving records into another organization.

## 12.4 Missing context should deny access

Use:

```sql
current_setting('app.org_id', true)
```

not:

```sql
current_setting('app.org_id')
```

The `true` argument means missing settings return `NULL` instead of raising an error.

A comparison like:

```sql
"orgId" = NULL
```

will not evaluate to true, so the row is denied.

This produces safer default-deny behavior.

## 12.5 Index columns used by policies

Every tenant-scoped table must already have indexes that support tenant filtering:

```txt
orgId
orgId + id
orgId + natural keys
orgId + deletedAt where relevant
```

RLS policies that depend on `orgId` should not force full-table scans.

## 12.6 Do not rely on RLS for query planning alone

Application queries should still include explicit filters:

```ts
where: {
  orgId: ctx.org.id,
  deletedAt: null,
}
```

This helps correctness, readability, and performance.

---

# 13. Example Future SQL Policies

These examples assume the physical database column is `"orgId"`, matching Prisma’s default camelCase column naming.

If OneDayOS later maps Prisma fields to snake_case database columns using `@map("org_id")`, these examples must be converted to `org_id`.

## 13.1 Products table

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

CREATE POLICY products_select_tenant
ON products
FOR SELECT
USING (
  "orgId" = current_setting('app.org_id', true)
);

CREATE POLICY products_insert_tenant
ON products
FOR INSERT
WITH CHECK (
  "orgId" = current_setting('app.org_id', true)
);

CREATE POLICY products_update_tenant
ON products
FOR UPDATE
USING (
  "orgId" = current_setting('app.org_id', true)
)
WITH CHECK (
  "orgId" = current_setting('app.org_id', true)
);

CREATE POLICY products_delete_tenant
ON products
FOR DELETE
USING (
  "orgId" = current_setting('app.org_id', true)
);
```

## 13.2 Employees table

```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

CREATE POLICY employees_select_tenant
ON employees
FOR SELECT
USING (
  "orgId" = current_setting('app.org_id', true)
);

CREATE POLICY employees_insert_tenant
ON employees
FOR INSERT
WITH CHECK (
  "orgId" = current_setting('app.org_id', true)
);

CREATE POLICY employees_update_tenant
ON employees
FOR UPDATE
USING (
  "orgId" = current_setting('app.org_id', true)
)
WITH CHECK (
  "orgId" = current_setting('app.org_id', true)
);

CREATE POLICY employees_delete_tenant
ON employees
FOR DELETE
USING (
  "orgId" = current_setting('app.org_id', true)
);
```

## 13.3 Organizations table

Organizations are special because `Organization.id` is the tenant root.

Policy:

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

CREATE POLICY organizations_select_current
ON organizations
FOR SELECT
USING (
  id = current_setting('app.org_id', true)
);

CREATE POLICY organizations_update_current
ON organizations
FOR UPDATE
USING (
  id = current_setting('app.org_id', true)
)
WITH CHECK (
  id = current_setting('app.org_id', true)
);
```

Creating organizations is a Kernel registration/provisioning action and may require a separate migration/provisioning role or service path.

Normal application users should not be able to create arbitrary organizations through generic RLS-protected CRUD.

---

# 14. Table Categories

## 14.1 Tenant-scoped tables

These tables should eventually have RLS policies based on `orgId`:

```txt
users
roles
permissions
user_roles
subscriptions
org_modules
settings
branches
departments
employees
products
product_categories
customers
suppliers
warehouses
module-owned business tables
```

## 14.2 Tenant root table

This table needs a special policy based on `id`:

```txt
organizations
```

## 14.3 Global/system tables

Some future tables may not be tenant-scoped:

```txt
platform_release_log
module_registry_cache
system_jobs
migration_history
```

These tables should not be accessible through normal module APIs.

They should be restricted to Kernel/internal tools.

## 14.4 Audit/event tables

Future audit/event tables should include:

```txt
orgId
actorUserId
eventName
entityType
entityId
```

RLS should use `orgId`.

Internal append-only writes may need a carefully scoped service role or internal SDK path.

---

# 15. RLS and UserRole Design

The approved Users/Roles/Permissions document requires `UserRole` to include `orgId`.

That is important for RLS.

Preferred model shape:

```prisma
model UserRole {
  orgId  String
  userId String
  roleId String

  org  Organization @relation(fields: [orgId], references: [id])
  user User         @relation(fields: [userId], references: [id])
  role Role         @relation(fields: [roleId], references: [id])

  @@id([orgId, userId, roleId])
  @@map("user_roles")
}
```

If `UserRole` does not include `orgId`, RLS policies become more complex because they need to join through `Role` or `User`.

For OneDayOS, tenant-scoped join tables should carry `orgId` when the relationship itself is tenant-scoped.

---

# 16. RLS and Soft Delete

## 16.1 Keep tenant isolation and deletion separate

First RLS rollout should focus on tenant isolation.

Soft delete remains enforced through:

```txt
SDK query helpers
service-layer conventions
API behavior
tests
architecture checks
```

## 16.2 Why not include deletedAt in all RLS policies?

A policy like this seems tempting:

```sql
USING (
  "orgId" = current_setting('app.org_id', true)
  AND "deletedAt" IS NULL
)
```

But it can complicate:

```txt
restore flows
admin deleted-record review
audit/debugging
legal retention workflows
internal support tools
```

## 16.3 Recommended first policy

Use RLS for tenant boundary:

```sql
USING ("orgId" = current_setting('app.org_id', true))
```

Keep soft-delete filtering in SDK/service reads:

```ts
where: {
  orgId: ctx.org.id,
  deletedAt: null,
}
```

## 16.4 Future stricter policy

If needed later, OneDayOS may add separate views or policies for active records only.

Do not do this in the first RLS rollout.

---

# 17. RLS and Permissions

## 17.1 Admin wildcard is not RLS bypass

This permission:

```txt
*.*.*
```

means:

```txt
The user can perform all authorized application actions inside their verified organization.
```

It does not mean:

```txt
The user can access every tenant's database rows.
```

## 17.2 Do not encode RBAC into first RLS policies

Avoid first-version policies like:

```sql
USING (
  "orgId" = current_setting('app.org_id', true)
  AND private.has_permission('inventory', 'product', 'read')
)
```

This creates complexity:

```txt
policy performance risk
recursive policy risk
harder debugging
harder migrations
harder permission model evolution
harder tests
```

## 17.3 Application permissions remain mandatory

Every mutation still requires:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'create',
})
```

RLS is a backstop, not the authorization brain.

---

# 18. RLS and API Error Behavior

RLS-denied queries may manifest differently depending on operation:

```txt
SELECT wrong tenant → empty result
UPDATE wrong tenant → zero rows updated or not found
DELETE wrong tenant → zero rows affected
INSERT wrong tenant → policy violation error
UPDATE changing orgId → policy violation error
```

OneDayOS API routes should not expose raw database policy messages to clients.

The Kernel API contract should map errors to safe responses:

```txt
Wrong tenant read by id → 404 NOT_FOUND
Wrong tenant mutation → 404 NOT_FOUND or 403 FORBIDDEN depending on context
Wrong org route → 404 ORG_NOT_FOUND
Invalid payload orgId → 400 VALIDATION_ERROR
Unauthenticated → 401 UNAUTHENTICATED
Authenticated but unauthorized → 403 FORBIDDEN
```

RLS errors should be logged server-side for developers, but user-facing errors should remain stable.

---

# 19. RLS and Prisma

## 19.1 Prisma schema does not own RLS policy declarations

Prisma models define tables, fields, relations, indexes, and migrations.

PostgreSQL RLS policies are database-native objects.

The OneDayOS RLS implementation should add policies through Prisma migration SQL files, reviewed manually.

Do not expect a Prisma model attribute like this in MVP:

```prisma
@@security(...)
```

That is not part of the approved OneDayOS platform contract.

## 19.2 Raw SQL belongs only in migrations and SDK internals

Allowed:

```txt
Prisma migration SQL for RLS policies
Kernel/Data SDK code that sets transaction context
Approved migration/testing scripts
```

Forbidden:

```txt
Raw SQL inside business modules
Raw SQL inside module services
Raw SQL inside generated module code
Raw SQL in UI/API handlers outside SDK wrappers
```

## 19.3 Transaction context must be handled carefully

The future RLS wrapper must ensure:

```txt
set_config runs in the same transaction as the query
set_config uses transaction-local scope
Prisma transaction client is passed to the service
no query escapes to the root Prisma client
no module can bypass the transaction accidentally
```

## 19.4 Do not rely only on Prisma Client extensions

Prisma Client extensions may be useful later, but OneDayOS should not rely on hidden extension behavior as the only RLS mechanism.

The first RLS rollout should prefer an explicit SDK wrapper with visible transaction boundaries.

---

# 20. RLS and Connection Pooling

## 20.1 Session settings are dangerous with pooled connections

Do not use session-long settings for tenant context:

```sql
SELECT set_config('app.org_id', 'org_123', false);
```

The `false` argument means the setting can last for the session.

With pooled connections, that can leak context between requests if not carefully reset.

## 20.2 Use transaction-local settings

Use:

```sql
SELECT set_config('app.org_id', 'org_123', true);
```

The `true` argument means the setting applies only to the current transaction.

## 20.3 All RLS-protected queries must run inside that transaction

If a query runs outside the transaction, the context may be missing.

Missing context should deny access.

That is safe but can break functionality if the SDK wrapper is inconsistent.

## 20.4 Practical implication

After RLS is enabled, ordinary service code should not do this:

```ts
const db = sdk.getDb(ctx)
return db.product.findMany(...)
```

unless `sdk.getDb(ctx)` guarantees RLS context correctly.

The safer future pattern is:

```ts
return sdk.db.withRlsContext(ctx, async (db) => {
  return ProductService.list(ctx, db)
})
```

---

# 21. Rollout Plan

## 21.1 Phase 0 — RLS-compatible MVP

Status: required now.

```txt
[ ] Every tenant-scoped table has orgId
[ ] Every tenant-scoped table has supporting orgId indexes
[ ] Every service receives PlatformContext
[ ] Every API derives PlatformContext server-side
[ ] Every module avoids raw Prisma
[ ] Every module avoids client-supplied orgId
[ ] Every tenant-sensitive test uses at least two orgs
[ ] Production Readiness Gate passes without RLS
```

## 21.2 Phase 1 — RLS staging prototype

Status: future.

Prototype RLS on a staging clone for one low-risk table.

Recommended first table:

```txt
products
```

Why:

```txt
tenant-scoped
business object
simple orgId policy
not auth-critical
not registration-critical
useful for Inventory later
```

Requirements:

```txt
[ ] Create application DB role subject to RLS
[ ] Enable RLS on products
[ ] Force RLS on products if table owner bypass is relevant
[ ] Add SELECT/INSERT/UPDATE/DELETE tenant policies
[ ] Add SDK withRlsContext prototype
[ ] Add two-org tests
[ ] Add wrong-org insert/update tests
[ ] Add missing-context tests
[ ] Validate performance with orgId indexes
```

## 21.3 Phase 2 — Expand to shared Business Objects

After products passes:

```txt
customers
suppliers
warehouses
product_categories
employees
branches
departments
```

## 21.4 Phase 3 — Expand to Kernel tenant tables

Then:

```txt
users
roles
permissions
user_roles
settings
org_modules
subscriptions
```

Kernel tables require more careful handling because they are used during context creation.

Do not enable RLS on context-bootstrap tables until the bootstrap path is proven.

## 21.5 Phase 4 — Generator support

Once patterns are stable, module generator should produce RLS migration snippets for every tenant-scoped module table.

Generated RLS must include:

```txt
ENABLE ROW LEVEL SECURITY
FORCE ROW LEVEL SECURITY when appropriate
SELECT policy
INSERT policy
UPDATE policy
DELETE policy
policy tests
```

## 21.6 Phase 5 — Policy drift checks

Add architecture checks:

```txt
Every tenant-scoped table has RLS enabled
Every tenant-scoped table has at least SELECT/INSERT/UPDATE/DELETE policy
Every RLS policy references orgId or approved tenant root field
No policy references client-supplied data
No exposed table lacks RLS
```

---

# 22. Context Bootstrap Problem

RLS introduces a bootstrapping challenge.

To create `PlatformContext`, the application must query:

```txt
Supabase auth user
Prisma User
Organization by orgSlug
Roles
Permissions
OrgModule
```

But if RLS is enabled on these tables, the application needs `app.org_id` set first.

However, `app.org_id` is derived from those same tables.

## 22.1 Solution direction

Use a two-stage context process:

```txt
Stage 1 — Bootstrap context
  - use minimal Kernel query path
  - verify auth user and org membership
  - derive orgId

Stage 2 — RLS context
  - run business/module operations inside withRlsContext(ctx)
```

## 22.2 Do not rush RLS onto bootstrap tables

Initial RLS rollout should avoid the most bootstrap-sensitive tables.

Start with business tables, then expand carefully.

## 22.3 Future bootstrap function

A future Postgres function may help:

```sql
private.current_user_org_id()
```

But this should not be introduced until there is a clear reason.

Keep the first RLS rollout simple.

---

# 23. Testing Requirements

RLS implementation is not acceptable without real database tests.

Mock tests are not enough.

## 23.1 Required test organizations

Every RLS test suite must include:

```txt
Org A
Org B
Admin user A
Staff user A
Admin user B
Records in Org A
Records in Org B
```

## 23.2 Missing context tests

```txt
[ ] SELECT with no app.org_id returns no tenant rows
[ ] INSERT with no app.org_id fails
[ ] UPDATE with no app.org_id affects no rows or fails
[ ] DELETE with no app.org_id affects no rows
```

## 23.3 Correct context tests

```txt
[ ] Org A context can select Org A rows
[ ] Org B context can select Org B rows
[ ] Org A context can insert Org A rows
[ ] Org A context can update Org A rows
[ ] Org A context can soft-delete Org A rows
```

## 23.4 Wrong context tests

```txt
[ ] Org A context cannot select Org B rows
[ ] Org A context cannot update Org B rows
[ ] Org A context cannot delete Org B rows
[ ] Org A context cannot insert a row with orgId = Org B
[ ] Org A context cannot change an Org A row to orgId = Org B
```

## 23.5 API behavior tests

```txt
[ ] RLS-denied read maps to safe 404
[ ] RLS-denied insert maps to safe API error
[ ] RLS-denied update maps to safe API error
[ ] RLS-denied delete maps to safe API error
[ ] No raw PostgreSQL policy text leaks to client
```

## 23.6 Architecture tests

```txt
[ ] Modules cannot import raw Prisma
[ ] Modules cannot call set_config
[ ] Modules cannot use raw SQL
[ ] Modules cannot use client-supplied orgId
[ ] Generated module tables include RLS policy test placeholders after RLS is enabled
```

---

# 24. RLS and Background Jobs

When background jobs are introduced, they must also use `PlatformContext`.

Bad future pattern:

```ts
await JobService.run({ orgId: payload.orgId })
```

Good future pattern:

```ts
const ctx = await sdk.auth.createSystemContextForOrg(payload.orgSlug, {
  reason: 'scheduled_inventory_reorder_check',
})

await sdk.db.withRlsContext(ctx, async (db) => {
  await InventoryReorderJob.run(ctx, db)
})
```

System contexts must be audited.

Do not use database superuser credentials for ordinary background jobs.

---

# 25. RLS and Reporting/Search/AI

Reporting, Search, and AI are high-risk because they aggregate across many records.

When these Platform Services are introduced, they must follow the same tenant boundary:

```txt
Report queries use PlatformContext.
Search indexes include orgId.
AI context retrieval includes orgId.
Vector search filters by orgId.
Exports filter by orgId.
Background indexing uses org-scoped system context.
```

RLS is especially useful here as a second guardrail.

But it does not remove the need for explicit filters.

---

# 26. RLS and OneDayOS Support Access

OneDayOS may eventually need support/admin access to client organizations.

Do not solve this by bypassing RLS.

Future support access should use:

```txt
explicit support session
explicit target org
explicit reason
time-limited access
audited support action
client-visible audit trail, eventually
```

Possible future context:

```ts
type SupportPlatformContext = PlatformContext & {
  actorType: 'onedayos_support'
  supportUserId: string
  targetOrgId: string
  reason: string
}
```

RLS should still be set to the target organization.

Support access should not read all tenants at once.

---

# 27. RLS and Imports/Exports

Imports and exports must be tenant-scoped.

## 27.1 Imports

Every imported row must be assigned:

```txt
orgId = ctx.org.id
```

The client must not provide `orgId`.

RLS should reject any row whose `orgId` does not match the current context.

## 27.2 Exports

Exports must query only within:

```txt
ctx.org.id
```

RLS should prevent accidental cross-tenant exports.

## 27.3 Bulk operations

Bulk operations are dangerous because one bad filter can affect many records.

Bulk update/delete paths should be among the first tested once RLS exists.

---

# 28. Performance Guidance

RLS can affect query planning and performance.

OneDayOS should follow these rules:

## 28.1 Index `orgId`

Every RLS-protected tenant-scoped table should have an index beginning with `orgId`.

Examples:

```prisma
@@index([orgId])
@@index([orgId, deletedAt])
@@index([orgId, code])
@@unique([orgId, code])
```

## 28.2 Keep app filters

Even with RLS, service queries should include:

```ts
where: { orgId: ctx.org.id }
```

This helps the planner and makes code review easier.

## 28.3 Avoid complex policy functions early

Avoid policies that call many functions, join through permission tables, or evaluate role logic for every row.

## 28.4 Test real queries

Before enabling RLS broadly, test:

```txt
Product list
Employee list
Inventory stock list
Customer search
Dashboard metrics
Bulk export
```

Use realistic data volumes.

---

# 29. Migration Strategy

## 29.1 RLS migrations are reviewed manually

RLS policies should be added through Prisma migration SQL files.

Example migration file:

```txt
prisma/migrations/20260704120000_add_rls_products/migration.sql
```

The generated Prisma migration may need manual SQL additions.

This is acceptable only for database-native features like RLS.

## 29.2 Do not hand-edit production database

Even though policies are SQL, they must still go through migrations.

Forbidden:

```txt
Open Supabase dashboard
Paste policy manually into production
Forget to commit migration
```

Required:

```txt
Create migration
Review migration SQL
Apply to staging
Run RLS tests
Apply through production migration workflow
```

## 29.3 Rollback approach

RLS rollback must be planned carefully.

Possible rollback options:

```txt
Disable RLS on affected table
Drop only broken policy
Replace policy with corrected policy
Roll forward with fixed migration
```

Preferred operational approach:

```txt
Roll forward with corrected policy when possible.
Disable RLS only as emergency mitigation.
```

## 29.4 Rollout order

Do not enable RLS on all tables at once.

Preferred order:

```txt
1. products in staging
2. products in production after tests
3. remaining Business Objects
4. module-owned tables
5. less risky Kernel tenant tables
6. context-bootstrap-sensitive Kernel tables last
```

---

# 30. Generator Requirements After RLS Is Enabled

When the module generator creates a tenant-scoped table, it should eventually generate an RLS migration helper.

Generated module RLS must include:

```txt
ENABLE ROW LEVEL SECURITY
FORCE ROW LEVEL SECURITY when appropriate
SELECT policy
INSERT policy
UPDATE policy
DELETE policy
wrong-org tests
missing-context tests
policy naming convention
```

## 30.1 Policy naming convention

Use predictable names:

```txt
<table>_select_tenant
<table>_insert_tenant
<table>_update_tenant
<table>_delete_tenant
```

Example:

```txt
inventory_stock_movements_select_tenant
inventory_stock_movements_insert_tenant
inventory_stock_movements_update_tenant
inventory_stock_movements_delete_tenant
```

## 30.2 Generator must not enable RLS before platform support exists

Until the RLS implementation is approved, the generator should not create active policies.

It may create comments or future TODOs only if explicitly approved.

---

# 31. Claude Implementation Rules

Claude must not implement RLS until a future document is marked implementation-approved.

When that time comes, Claude must follow these rules:

```txt
Do not add FastAPI.
Do not add SQLAlchemy.
Do not add Alembic.
Do not expose Supabase table access to browser clients.
Do not move RBAC into SQL policies.
Do not remove application-level orgId filters.
Do not remove PlatformContext.
Do not let modules call raw SQL.
Do not let modules call set_config.
Do not connect runtime code as a superuser if testing RLS.
Do not enable RLS on every table at once.
Do not skip two-org tests.
```

Claude must implement RLS in this order:

```txt
1. Add staging-only RLS proof for one table.
2. Add SDK transaction context wrapper.
3. Add database-role verification notes/scripts.
4. Add two-org integration tests.
5. Add wrong-org write tests.
6. Add API error mapping tests.
7. Expand only after review.
```

---

# 32. Future Claude Prompt Template

Use this only when RLS implementation is approved.

```md
You are implementing the OneDayOS Row-Level Security staging prototype.

Authoritative documents:
- docs/engineering-manual/06-data/06-row-level-security-plan.md
- docs/engineering-manual/06-data/01-tenancy-data-isolation.md
- docs/engineering-manual/05-sdk/02-sdk-db-access.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md
- docs/engineering-manual/14-testing-quality/05-security-testing.md

Scope:
- Implement RLS only for the products table in staging/local test environment.
- Add SDK-owned transaction-local RLS context wrapper.
- Add integration tests proving tenant isolation.

Rules:
- Do not implement RLS for all tables.
- Do not add FastAPI.
- Do not allow modules to call raw SQL.
- Do not move permission checks into RLS.
- Do not remove application-level orgId filters.
- Do not use client-supplied orgId.
- Do not skip two-organization tests.
- Stop if database role assumptions are unclear.

Acceptance Criteria:
- Missing app.org_id sees no product rows.
- Org A context sees only Org A products.
- Org B context sees only Org B products.
- Org A cannot insert product with Org B orgId.
- Org A cannot update product to Org B orgId.
- API errors remain stable and do not leak raw policy errors.
- Existing non-RLS tests still pass.
```

---

# 33. Definition of Done for Future RLS Implementation

RLS is not done unless all are true:

```txt
[ ] RLS strategy approved by founder/architect
[ ] App-layer tenant isolation already works
[ ] Runtime DB role is subject to RLS
[ ] RLS tested against real PostgreSQL
[ ] RLS tested with connection pooling assumptions
[ ] Policies added through migrations
[ ] No manual production dashboard policy edits
[ ] Missing context denies access
[ ] Wrong context denies access
[ ] Correct context allows access
[ ] Wrong-org inserts fail
[ ] Wrong-org updates fail
[ ] API error mapping remains stable
[ ] Application-level orgId filters remain in code
[ ] No modules import raw Prisma
[ ] No modules call raw SQL
[ ] No modules call set_config
[ ] CI includes RLS integration tests or a documented staging test gate
```

---

# 34. Architectural Risks

## 34.1 False sense of security

Risk:

```txt
Team believes RLS makes app-layer security less important.
```

Mitigation:

```txt
Manual says RLS is defense-in-depth only.
Application tenant checks remain mandatory.
```

## 34.2 Runtime DB role bypasses RLS

Risk:

```txt
Vercel connects with a superuser/table-owner role and bypasses policies.
```

Mitigation:

```txt
Create and test an app DB role subject to RLS.
Use FORCE ROW LEVEL SECURITY where relevant.
```

## 34.3 Context leakage through pooling

Risk:

```txt
Session-level app.org_id leaks across requests.
```

Mitigation:

```txt
Use transaction-local set_config(..., true).
Never use session-level tenant settings.
```

## 34.4 Prisma query escapes transaction

Risk:

```txt
Service query uses root Prisma client outside RLS transaction.
```

Mitigation:

```txt
Use explicit SDK withRlsContext wrapper.
Pass transaction client to service where needed.
Add architecture tests.
```

## 34.5 Policy complexity grows too early

Risk:

```txt
RBAC, approvals, branch scoping, and support access all get encoded into SQL policies.
```

Mitigation:

```txt
First policies only enforce orgId tenant isolation.
```

## 34.6 Debugging becomes painful

Risk:

```txt
Developers see empty arrays and do not know if it is data absence, permission denial, tenant mismatch, or RLS.
```

Mitigation:

```txt
Clear test helpers.
Server-side logging.
Stable API error mapping.
RLS debug checklist.
```

---

# 35. Founder-Level Explanation

RLS is like a second lock on the database door.

The first lock is our application architecture:

```txt
PlatformContext
SDK
permissions
tenant-scoped queries
tests
```

The second lock is PostgreSQL itself:

```txt
Even if someone writes a bad query,
the database refuses rows outside the current organization.
```

But the second lock only works if it is installed correctly.

If we connect to the database with a superuser key, RLS might not protect us.

If we set tenant context incorrectly, queries may fail or leak.

If we put too much business logic into RLS, the system becomes hard to understand.

So the right OneDayOS approach is:

```txt
Build secure app-layer tenancy first.
Design everything to be RLS-compatible.
Add RLS later as defense-in-depth after patterns are stable.
```

This keeps OneDayOS commercially practical now while preserving a path to stronger enterprise-grade isolation later.

---

# 36. Final Decision

OneDayOS should remain on this path:

```txt
MVP:
  No RLS implementation.
  Strict app-layer tenant isolation.
  Verified PlatformContext.
  SDK-only DB access.
  Two-org tests.

Phase 1.5:
  Add RLS prototype on staging.
  Use transaction-local app.org_id context.
  Verify runtime DB role is subject to RLS.
  Start with one business table.

Phase 2+:
  Expand RLS gradually.
  Add generator support.
  Add policy drift checks.
```

This document is therefore a **plan**, not an implementation ticket.

Claude must not implement RLS until this document or a successor document is marked:

```txt
Status: Frozen
Implementation Allowed: Yes
```

---

# 37. External Reference Notes

These references informed this plan:

- PostgreSQL documentation: Row Security Policies. PostgreSQL explains that enabling row security requires policies for normal access, otherwise default-deny applies; it also notes that superusers and roles with `BYPASSRLS` bypass RLS, and table owners normally bypass RLS unless forced.
- PostgreSQL documentation: Configuration Settings Functions. PostgreSQL documents `current_setting(setting_name, missing_ok)` and `set_config(setting_name, new_value, is_local)`, including transaction-local behavior when `is_local` is true.
- Supabase documentation: Row Level Security. Supabase describes policies as table-attached SQL logic that effectively behaves like implicit row filters, and gives performance guidance around indexes, explicit filters, and wrapping stable helper calls in `select`.
- Prisma documentation and issue history: Prisma supports raw SQL and client extensions, and its public issue tracker has tracked first-class RLS support as a feature request with stopgap patterns. OneDayOS should therefore treat RLS policies as database-native migration SQL plus SDK-owned transaction context, not as normal module code.
