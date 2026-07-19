# OneDayOS Engineering Manual — 15 Deployment & Operations — 03 Database Migrations in Production

**Document ID:** `15-deployment-operations/03-database-migrations-production.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Production Database Changes  
**Owner:** Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `06-data/00-database-architecture.md`
- `06-data/02-prisma-conventions.md`
- `06-data/04-migrations-seeding.md`
- `06-data/07-backup-restore.md`
- `13-security/08-production-readiness-gate.md`
- `14-testing-quality/08-ci-quality-gates.md`
- `15-deployment-operations/00-environments.md`
- `15-deployment-operations/01-vercel-deployment.md`
- `15-deployment-operations/02-supabase-operations.md`

---

# 1. Purpose

This document defines how OneDayOS changes the production database safely.

OneDayOS uses:

```txt
One shared PostgreSQL production database
Many tenant organizations
Tenant isolation through orgId
Prisma-managed migrations
Supabase as database host
Vercel as application host
```

That means a production migration is not a small internal developer action.

A production migration can affect:

```txt
every client organization
every enabled module
every API route
every dashboard
every report
every future AppCare promise
```

Therefore, database migrations must be treated as controlled operational events.

The main rule is:

```txt
A production database migration is not complete because it ran.
It is complete only when it is verified, observable, recoverable, and compatible with deployed code.
```

---

# 2. Scope

This document covers:

- how database migrations are created
- how migration SQL is reviewed
- how migrations move from local to staging to production
- which commands are allowed in each environment
- which commands are forbidden in staging and production
- how to handle additive changes
- how to handle breaking changes
- how to handle data backfills
- how to handle failed migrations
- how to coordinate code deploys with schema deploys
- how to protect all tenants during shared-database changes
- how Claude Code should and should not touch migrations

---

# 3. Non-Goals

This document does **not** define:

- the full Prisma schema
- the full backup/restore policy
- the full CI implementation
- Supabase account management
- RLS rollout
- per-client dedicated database infrastructure
- database-per-tenant architecture
- self-hosted PostgreSQL operations
- full zero-downtime migration automation
- background job infrastructure for large backfills

Those are separate concerns.

For MVP, this document focuses on safe, disciplined production migration behavior for the shared OneDayOS database.

---

# 4. Core Position

OneDayOS uses **Prisma migrations as the source of truth**.

Supabase is the PostgreSQL host.

Prisma is the schema and migration authority.

Vercel deploys application code.

Git is the record of migration history.

The production database must not be edited casually through the Supabase Dashboard.

The correct direction is:

```txt
Prisma schema change
  ↓
Prisma migration file
  ↓
code review
  ↓
local verification
  ↓
staging migration
  ↓
staging verification
  ↓
production migration
  ↓
production verification
```

Not:

```txt
Open Supabase Dashboard
  ↓
Edit table manually
  ↓
Hope Prisma catches up later
```

Manual production schema edits create drift between:

```txt
Prisma schema
migration history
actual database schema
generated Prisma Client
application code
```

That drift is dangerous.

---

# 5. Environment Model

OneDayOS has these environments:

```txt
local
ci-test
preview
staging
production
```

## 5.1 Local

Used for:

- development
- migration creation
- schema experimentation
- test migrations
- seed testing
- fixture testing

Allowed:

```bash
npx prisma migrate dev
npx prisma migrate dev --create-only
npx prisma migrate reset
npx prisma db seed
npx prisma generate
```

But local reset must never use production data unless explicitly sanitized and approved.

## 5.2 CI Test

Used for:

- typechecking
- linting
- architecture checks
- test database setup
- generated Prisma Client verification
- migration sanity checks

Allowed:

```bash
npx prisma generate
npm run check:all
```

Potentially allowed with a disposable test database:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Forbidden:

```txt
production credentials
staging credentials unless explicitly scoped
manual schema edits
```

## 5.3 Preview

Vercel Preview deployments are useful for UI and code review, but they must not mutate production schema.

Allowed:

```txt
application preview
read-only or isolated test data access if configured
```

Forbidden:

```bash
npx prisma migrate deploy   # against production
npx prisma migrate dev      # against production or shared staging
npx prisma db push          # against any shared environment
```

## 5.4 Staging

Staging is the rehearsal environment for production.

Staging must use a separate Supabase project or otherwise isolated database.

Allowed:

```bash
npx prisma migrate deploy
npx prisma db seed          # only staging-safe seed, if needed
npm run check:all
```

Staging must receive migrations before production.

## 5.5 Production

Production contains real client data.

Allowed only through approved migration workflow:

```bash
npx prisma migrate deploy
```

Forbidden:

```bash
npx prisma migrate dev
npx prisma migrate reset
npx prisma db push
manual Supabase Dashboard schema edits
ad hoc local terminal migration using production DATABASE_URL
```

---

# 6. Command Policy

## 6.1 Allowed Commands by Environment

| Command | Local | CI Test | Staging | Production |
|---|---:|---:|---:|---:|
| `prisma generate` | Yes | Yes | Yes | Yes |
| `prisma migrate dev` | Yes | No | No | No |
| `prisma migrate dev --create-only` | Yes | No | No | No |
| `prisma migrate deploy` | Rare | Yes, test DB only | Yes | Yes, approved workflow only |
| `prisma migrate reset` | Yes, local only | Disposable DB only | No | Never |
| `prisma db push` | Experiment only, throwaway DB | No | No | Never |
| `prisma db seed` | Yes | Test DB only | Staging-safe only | Baseline/provisioning only, approved |
| Supabase Dashboard schema edit | No, except inspection | No | No | Never |

## 6.2 Forbidden in Production

These commands must never be run against production:

```bash
npx prisma migrate dev
npx prisma migrate reset
npx prisma db push
```

Reason:

- `migrate dev` is a development workflow and may reset the database.
- `migrate reset` destroys and recreates data.
- `db push` bypasses migration history.
- manual schema edits create drift.

## 6.3 Production Migration Command

Production schema migrations use:

```bash
npx prisma migrate deploy
```

This applies pending migration files from `prisma/migrations`.

For OneDayOS, this should run in an approved CI/CD workflow or controlled operations workflow, not from a developer laptop with production credentials.

---

# 7. Migration Source of Truth

The source of truth is:

```txt
prisma/schema.prisma
prisma/migrations/**
prisma.config.ts
```

The following are not source of truth:

```txt
Supabase Dashboard table editor
temporary SQL run manually in production
local developer database state
generated Prisma Client only
old screenshots of the schema
Claude's memory
```

If production schema differs from Prisma migration history, that is a drift incident.

It must be investigated.

Do not silently continue building on top of drift.

---

# 8. Migration File Rules

Every migration file must be committed to Git.

Every migration should have a clear name.

Good migration names:

```txt
add_inventory_stock_movements
add_product_barcode_nullable
create_fleet_vehicle_tables
add_employee_status_index
backfill_product_search_code
```

Bad migration names:

```txt
changes
update
fix
new_tables
misc
test
```

Migration files should be reviewed before staging and production.

Claude must not create a migration and ask for production deployment without showing what changed.

---

# 9. Migration Review Checklist

Every migration must be reviewed for these questions.

## 9.1 Tenant Safety

```txt
[ ] Does every tenant-scoped table include orgId?
[ ] Are unique constraints tenant-scoped where needed?
[ ] Are indexes tenant-aware where queries filter by orgId?
[ ] Are foreign keys tenant-safe where cross-tenant reference risk exists?
[ ] Does the migration preserve existing orgId data?
[ ] Does the migration avoid global uniqueness where tenant uniqueness is intended?
```

Bad:

```prisma
model Product {
  code String @unique
}
```

Good:

```prisma
model Product {
  orgId String
  code  String

  @@unique([orgId, code])
}
```

## 9.2 Data Safety

```txt
[ ] Does this drop data?
[ ] Does this rename data?
[ ] Does this change column type?
[ ] Does this add a non-null field?
[ ] Does this add a unique constraint to existing data?
[ ] Does this require backfill?
[ ] Does this affect soft-deleted records?
[ ] Does this affect historical records?
```

## 9.3 Compatibility

```txt
[ ] Can the currently deployed app tolerate the new schema?
[ ] Can the new app tolerate the old schema during rollout?
[ ] Is this an additive migration?
[ ] Is this a breaking migration?
[ ] Does this require multiple deployments?
[ ] Does this require feature flags?
```

## 9.4 Performance

```txt
[ ] Does this alter a large table?
[ ] Does this create an index on a large table?
[ ] Does this backfill many rows?
[ ] Does this lock writes?
[ ] Does this need batching?
[ ] Does this need a maintenance window?
```

## 9.5 Operational Readiness

```txt
[ ] Has it run locally?
[ ] Has it run in staging?
[ ] Has staging passed smoke tests?
[ ] Has staging passed security tests?
[ ] Is there a backup or restore point?
[ ] Is there a rollback/forward-fix plan?
[ ] Is there a verification query?
[ ] Is there a communication plan if downtime is possible?
```

---

# 10. Migration Risk Levels

## 10.1 Low-Risk Migrations

Examples:

```txt
create a new unused table
add nullable column
add non-unique index on small table
add optional relation
add new enum-like string value if app handles it
```

Still required:

```txt
local verification
staging verification
review
production deploy through approved workflow
```

## 10.2 Medium-Risk Migrations

Examples:

```txt
add required field with default
add unique constraint on existing data
add foreign key to existing table
add index to medium/large table
add module tables that reference Business Objects
move field from module extension toward shared Business Object
```

Requires:

```txt
migration review
staging data test
verification query
possible backfill script
backup confirmation
```

## 10.3 High-Risk Migrations

Examples:

```txt
drop column
rename column
change data type
split table
merge table
large backfill
add NOT NULL to populated table
add unique constraint to dirty data
add foreign key to dirty data
change tenant boundary
change orgId behavior
change auth/user/role/permission schema
change Business Object identity fields
```

Requires:

```txt
ADR or founder approval
expand-contract plan
staging rehearsal
backup/restore plan
manual verification
possible maintenance window
client-impact assessment
```

## 10.4 Critical / Blocked Migrations

These are blocked unless founder-approved with a dedicated plan:

```txt
drop orgId from any tenant-scoped table
make client data globally unique by mistake
delete tenant data as part of schema migration
merge organizations
change Supabase Auth user ID mapping
change User.id away from Supabase auth.users.id
alter production permissions without test coverage
remove soft-delete columns from business data
```

---

# 11. Expand-Contract Migration Pattern

Breaking changes should usually use the expand-contract pattern.

## 11.1 Example: Rename a Column

Bad:

```txt
rename product.code to product.sku in one migration
deploy app code using sku immediately
hope nothing breaks
```

Good:

```txt
Step 1 — Expand
  add nullable sku column

Step 2 — Dual Write
  app writes both code and sku

Step 3 — Backfill
  copy code into sku for existing records

Step 4 — Read Switch
  app reads sku but can fall back to code

Step 5 — Contract
  remove code only after all code paths and data are verified
```

For MVP, avoid column renames unless necessary.

Prefer stable field names.

## 11.2 Example: Add Required Field

Bad:

```txt
add required Product.barcode without default
```

Good:

```txt
Step 1
  add Product.barcode as nullable

Step 2
  deploy app that can write barcode when present

Step 3
  backfill barcode if required

Step 4
  verify no nulls

Step 5
  add NOT NULL constraint later if truly required
```

## 11.3 Example: Add New Module Tables

Usually safe if additive:

```txt
create inventory_stock_movements
create inventory_stock_balances
create indexes
deploy Inventory code after migration
```

But still verify:

```txt
foreign keys
orgId columns
soft-delete columns if needed
tenant indexes
permissions
seed/provisioning
```

---

# 12. Code Deploy and Migration Ordering

Migration ordering depends on compatibility.

## 12.1 Additive Migration

Example:

```txt
add nullable column
add new table
add optional index
```

Typical order:

```txt
1. Run migration
2. Deploy app code that uses the new schema
3. Verify
```

Reason: old app can ignore new schema.

## 12.2 App-Compatible First

Example:

```txt
new app writes optional field but can operate without it
```

Possible order:

```txt
1. Deploy app code that tolerates missing field
2. Run migration
3. Enable feature flag
```

Use carefully.

## 12.3 Breaking Migration

Example:

```txt
drop column
rename table
change required relation
```

Required order:

```txt
1. Expand schema
2. Deploy compatible app
3. Backfill
4. Verify
5. Switch reads/writes
6. Contract old schema later
```

Never combine all steps in one risky production deploy.

---

# 13. Backfill Rules

Backfills are data migrations.

They are often riskier than schema migrations.

## 13.1 Backfill Requirements

Every backfill must be:

```txt
tenant-aware
idempotent
dry-run capable
batched when large
logged
resumable when possible
verified after completion
safe for soft-deleted records
```

## 13.2 Backfill Script Shape

Backfill scripts should live in an approved scripts area, for example:

```txt
scripts/backfills/
  2026-07-05-backfill-product-search-code.ts
```

A backfill script should support:

```bash
tsx scripts/backfills/2026-07-05-backfill-product-search-code.ts --dry-run
tsx scripts/backfills/2026-07-05-backfill-product-search-code.ts --apply
```

## 13.3 Backfill Must Not Trust Client-Supplied orgId

Backfills run server-side, but tenant safety still matters.

Bad:

```ts
const orgId = process.argv[2]
await prisma.product.updateMany({ data: ... })
```

Better:

```ts
const orgs = await prisma.organization.findMany({ select: { id: true, slug: true } })

for (const org of orgs) {
  await backfillOrg(org.id)
}
```

Or, for targeted repair:

```txt
explicit founder-approved org slug
dry-run first
log exact affected row count
apply second
```

## 13.4 Do Not Put Large Backfills Inside User-Facing Requests

Forbidden:

```txt
first user to open page triggers migration/backfill
```

Backfills must be operational scripts or future background jobs.

---

# 14. Index and Locking Rules

Indexes improve read performance but can cause production write blocking if created carelessly on large tables.

## 14.1 Small Tables

For small tables, normal Prisma-generated indexes are usually acceptable.

Examples:

```txt
roles
permissions
org_modules
settings
```

## 14.2 Growing Business Tables

For growing business/module tables, index creation must be reviewed.

Examples:

```txt
products
customers
stock_movements
activity feed
audit logs
notifications
attachments
imports
```

## 14.3 Large Index Creation

When tables become large, consider manual SQL migration using PostgreSQL concurrent index creation.

Example:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_org_name
ON products ("orgId", name);
```

This may require custom migration handling and review because concurrent index creation has operational constraints.

Do not blindly trust generated SQL for large production tables.

## 14.4 Tenant-Aware Indexes

Most tenant-scoped queries should index `orgId` with the queried field.

Examples:

```prisma
@@index([orgId, name])
@@index([orgId, createdAt])
@@index([orgId, deletedAt])
@@unique([orgId, code])
```

Avoid indexes that optimize global queries but ignore tenant access patterns.

---

# 15. Soft Delete and Migration Safety

Soft delete fields are part of the OneDayOS data lifecycle.

For tenant-scoped business data:

```txt
deletedAt DateTime?
deletedBy String?
```

Migration review must check:

```txt
[ ] Are new business tables soft-deletable if records may be deleted by users?
[ ] Are deleted records preserved during backfills?
[ ] Are unique constraints compatible with soft-deleted records?
[ ] Does restore behavior remain possible?
[ ] Do indexes account for deletedAt where appropriate?
```

Do not use `isActive` as deletion.

`isActive` means business status.

`deletedAt` means record deletion lifecycle.

---

# 16. Tenant Integrity Checks

After every migration that touches tenant-scoped tables, run tenant integrity checks.

Examples:

```sql
-- Tenant-scoped records without orgId
SELECT COUNT(*) FROM products WHERE "orgId" IS NULL;

-- Product codes accidentally globally unique instead of tenant-unique:
-- inspect constraints rather than only data.

-- Cross-tenant relation check example:
SELECT COUNT(*)
FROM inventory_product_extensions ipe
JOIN products p ON p.id = ipe."productId"
WHERE ipe."orgId" <> p."orgId";
```

Every module with extension tables should have similar integrity checks.

For MVP, these can be manual verification queries.

Later, they should become automated checks.

---

# 17. Production Migration Runbook

## 17.1 Before Creating Migration

```txt
[ ] Confirm the schema change is necessary
[ ] Confirm it belongs in the correct layer
[ ] Confirm it does not duplicate Business Objects
[ ] Confirm it does not create client-specific schema
[ ] Confirm it does not implement a deferred Platform Service without approval
[ ] Confirm it has no FastAPI/Python/Alembic/SQLAlchemy migration dependency
```

## 17.2 Create Migration Locally

For normal schema changes:

```bash
npx prisma migrate dev --name descriptive_change_name
```

For migrations needing manual SQL review before applying locally:

```bash
npx prisma migrate dev --create-only --name descriptive_change_name
```

Then inspect and edit the generated SQL if required.

## 17.3 Review Generated SQL

Review:

```txt
created tables
altered columns
dropped columns
foreign keys
indexes
unique constraints
default values
not-null constraints
data loss warnings
locking risk
tenant-safety
```

Claude must summarize generated SQL in plain English.

## 17.4 Local Verification

Run:

```bash
npx prisma generate
npm run check:all
```

If test database is available:

```bash
npx prisma migrate reset
npx prisma db seed
npm run test:run
```

## 17.5 Staging Migration

Run against staging through approved workflow:

```bash
npx prisma migrate deploy
```

Then run:

```bash
npx prisma generate
npm run check:all
```

Also verify staging manually:

```txt
[ ] login
[ ] org route access
[ ] wrong-org denial
[ ] module enablement
[ ] relevant Business Object list/create/update/delete
[ ] relevant module flow
[ ] no API auth redirects
[ ] no visible server errors
```

## 17.6 Production Preflight

Before production migration:

```txt
[ ] Migration committed to main/release branch
[ ] Staging migration passed
[ ] Staging smoke tests passed
[ ] Security tests passed
[ ] Backup/PITR state checked
[ ] Roll-forward plan exists
[ ] Verification queries prepared
[ ] Maintenance window decided if needed
[ ] Founder approval obtained for medium/high-risk migrations
```

## 17.7 Production Execution

Production migration should run from approved CI/operations workflow:

```bash
npx prisma migrate deploy
```

Do not run this from a laptop unless explicitly approved for an emergency and production credentials are handled according to the secrets policy.

## 17.8 Production Verification

After migration:

```txt
[ ] Migration completed successfully
[ ] `_prisma_migrations` shows applied migration
[ ] Application deploy is compatible
[ ] Login works
[ ] Current user endpoint works
[ ] Org route membership works
[ ] Wrong-org access fails safely
[ ] Critical APIs return JSON errors
[ ] Key module workflows still work
[ ] Error logs checked
[ ] Database health checked
[ ] Slow queries checked if relevant
[ ] Client-facing surfaces checked
```

## 17.9 Close Migration

Record:

```txt
migration name
date/time applied
environment
operator
app version/commit
verification result
issues found
follow-up tasks
```

---

# 18. Failed Migration Runbook

If a production migration fails:

```txt
Stop.
Do not rerun blindly.
Do not edit production manually in panic.
Do not run migrate reset.
Do not run db push.
Do not delete migration files.
```

## 18.1 Immediate Steps

```txt
[ ] Capture exact error output
[ ] Identify whether migration partially applied
[ ] Check `_prisma_migrations`
[ ] Check database schema state
[ ] Check app health
[ ] Decide whether to disable affected feature
[ ] Notify founder/operator
```

## 18.2 Diagnosis

Answer:

```txt
Did the migration fail before any changes?
Did it partially apply?
Did it block writes?
Did it create a table but fail a constraint?
Did it fail because existing data violates new constraint?
Did it fail because production drifted from migration history?
```

## 18.3 Fix Strategy

Preferred:

```txt
roll forward with a corrective migration
```

Avoid:

```txt
manual production edits without recording them in migration history
```

Restore from backup only if data integrity is seriously compromised and targeted repair is impossible.

## 18.4 Prisma Migration Resolution

Prisma migration resolution tools may be used only with founder/architect approval.

They are not normal development commands.

A migration history repair must be documented.

---

# 19. Rollback Policy

Vercel code rollback is not database rollback.

If code is rolled back but schema has changed, old code must still be compatible with the current schema.

Therefore:

```txt
Schema migrations should be forward-compatible whenever possible.
Roll-forward fixes are preferred.
Full database restore is last resort.
```

## 19.1 Safe Rollback Scenario

Example:

```txt
Migration added nullable column.
New app uses it.
Code rollback ignores it.
```

This is usually safe.

## 19.2 Unsafe Rollback Scenario

Example:

```txt
Migration renamed column.
New app uses new name.
Old app uses old name.
Rollback breaks.
```

This requires expand-contract.

## 19.3 Data Restore Is Not Normal Rollback

In a shared database, full restore affects every client organization.

For one-client issues, prefer:

```txt
restore backup to staging
extract affected tenant records
run targeted repair script
verify
```

Full production restore should be rare.

---

# 20. Supabase Dashboard Policy

Supabase Dashboard is allowed for:

```txt
inspection
monitoring
checking backups
checking project health
reviewing logs
emergency read-only diagnosis
```

Supabase Dashboard is not allowed for:

```txt
normal schema changes
manual table creation
manual column edits
manual constraint edits
manual policy edits unless in approved RLS phase
manual production data edits except approved repair
```

If an emergency manual SQL action is unavoidable:

```txt
[ ] founder approval
[ ] SQL recorded
[ ] reason recorded
[ ] migration follow-up created
[ ] staging reproduction created if possible
[ ] post-incident review completed
```

---

# 21. Client Impact

Normal clients do not have their own database.

Therefore, a production migration is platform-wide.

Before high-risk migration, ask:

```txt
Will this affect all organizations?
Will this affect login?
Will this affect module enablement?
Will this affect Business Objects?
Will this affect existing clients who do not use the new module?
Will this affect AppCare promises?
```

A new module table may be safe globally even if only one client uses the module.

But changes to shared objects like:

```txt
Employee
Product
Customer
Supplier
Warehouse
User
Role
Permission
Organization
OrgModule
Setting
```

are higher-risk because multiple modules and clients may rely on them.

---

# 22. Module Migration Rules

A module may introduce its own tables.

But module tables must obey platform data rules:

```txt
orgId required
tenant-safe indexes
tenant-safe relations
soft delete where applicable
no duplicate Business Objects
no raw Prisma in module runtime code
no client-supplied orgId
services use PlatformContext
events emitted after mutations
```

Good:

```prisma
model InventoryStockMovement {
  id        String   @id @default(cuid())
  orgId     String
  productId String
  warehouseId String
  type      String
  quantity  Decimal
  createdAt DateTime @default(now())

  product   Product   @relation(fields: [productId, orgId], references: [id, orgId])
  warehouse Warehouse @relation(fields: [warehouseId, orgId], references: [id, orgId])

  @@index([orgId, productId])
  @@index([orgId, warehouseId])
}
```

Bad:

```prisma
model InventoryProduct {
  id String @id @default(cuid())
  name String
}
```

Reason: `Product` already exists as a Business Object.

---

# 23. Business Object Migration Rules

Business Object changes require stricter review.

Business Objects are shared across modules.

Adding a field to `Product` affects:

```txt
Inventory
Purchasing
Sales
Search later
AI context later
Reporting later
Imports/exports later
```

Before adding a Business Object field:

```txt
[ ] Is this truly shared?
[ ] Do at least three independent use cases need it?
[ ] Should it be an extension-table field instead?
[ ] Does this field expose sensitive data?
[ ] Does it need search/export/AI restrictions?
[ ] Does it affect events?
[ ] Does it affect module specs?
```

When unsure, use a module extension table first.

Promotion from extension table to Business Object requires:

```txt
evidence
ADR
migration plan
backfill plan
tests
documentation update
```

---

# 24. Seed and Provisioning During Migrations

Production migrations should not casually run broad seed scripts.

Seeds are for:

```txt
baseline roles/permissions
system defaults
development/demo data outside production
controlled org provisioning
```

Production baseline seed must be:

```txt
idempotent
non-destructive
not overwrite client data
not create demo data in production
```

Client onboarding should use provisioning scripts or future admin UI, not global seed modifications.

Bad:

```txt
add Client A-specific settings to prisma/seed.ts
```

Good:

```txt
run approved org provisioning script for Client A
```

---

# 25. Production Migration Approval Levels

## 25.1 Low Risk

Requires:

```txt
developer review
staging pass
check:all pass
```

## 25.2 Medium Risk

Requires:

```txt
architect/founder approval
staging rehearsal
backup check
verification queries
```

## 25.3 High Risk

Requires:

```txt
ADR or written migration plan
maintenance window decision
backup/restore readiness
founder approval
rollback/forward-fix plan
client-impact review
```

## 25.4 Critical

Requires:

```txt
do not proceed until explicitly approved
dedicated plan
possibly external review
```

---

# 26. Claude Code Rules

Claude may:

```txt
propose schema changes
create local Prisma migrations
explain migration SQL
write migration tests
write backfill scripts
write verification queries
update documentation
```

Claude must not:

```txt
run production migrations
ask for production DATABASE_URL
paste production secrets
suggest db push for production
suggest migrate reset for production
edit Supabase Dashboard manually
create client-specific schema
drop columns without approval
remove orgId from tenant tables
bypass migration history
add FastAPI/Alembic/SQLAlchemy migrations
```

Claude must output before migration approval:

```txt
files changed
Prisma models changed
migration name
SQL summary
risk level
staging test plan
production verification plan
rollback/forward-fix notes
```

Claude must not say:

```txt
"Migration complete"
```

unless it also states:

```txt
which environment was migrated
which command was run
which tests passed
what was verified
```

---

# 27. Architecture Checks

The platform should eventually include `check:migrations`.

Possible checks:

```txt
no prisma db push in scripts
no production migrate dev scripts
no migrate reset in CI/prod workflows
all tenant-scoped models include orgId
Business Object models include soft-delete if user-deletable
no global unique constraints where org-scoped uniqueness is required
no module-owned duplicate Business Objects
migration files committed
no raw SQL dropping tables without approval marker
```

This does not replace human review.

It catches obvious violations early.

---

# 28. GitHub / CI Workflow Direction

For MVP, use a controlled migration workflow.

Recommended structure:

```txt
Pull Request:
  npm run check:all
  prisma generate
  migration file exists if schema changed
  architecture checks

Merge to main:
  deploy application through Vercel
  production migration workflow requires explicit approval

Staging:
  migrate deploy
  run smoke/security tests

Production:
  migrate deploy
  deploy compatible app code if not already deployed
  verify
```

The exact GitHub Actions implementation can come later.

The principle is required now:

```txt
production migrations must be deliberate, visible, and verifiable.
```

---

# 29. Emergency Migration Policy

Emergency migrations are allowed only for serious production incidents.

Examples:

```txt
security leak
data corruption
broken login
broken tenant isolation
critical AppCare-impacting failure
```

Even emergency migrations must follow minimum discipline:

```txt
[ ] founder/operator approval
[ ] backup state checked if possible
[ ] SQL reviewed
[ ] command recorded
[ ] verification run
[ ] follow-up migration/docs created
[ ] incident postmortem completed
```

Emergency does not mean undocumented.

Emergency does not mean casual.

---

# 30. What Not To Do

Do not do this:

```bash
DATABASE_URL=production npx prisma migrate dev
```

Do not do this:

```bash
DATABASE_URL=production npx prisma db push
```

Do not do this:

```bash
DATABASE_URL=production npx prisma migrate reset
```

Do not do this:

```txt
edit production tables manually in Supabase Dashboard
```

Do not do this:

```txt
create a separate production database for one normal SME client
```

Do not do this:

```txt
add client-specific columns to shared platform tables
```

Do not do this:

```txt
drop a column because the current client does not use it
```

Do not do this:

```txt
rename Business Object fields casually
```

Do not do this:

```txt
ship code that requires a migration before the migration has safely run
```

---

# 31. Production Migration Template

Use this template for any medium/high-risk production migration.

```md
# Production Migration Plan

Migration name:

Date:

Author:

Risk level:
Low / Medium / High / Critical

## Purpose

## Schema Changes

## Tables Affected

## Tenant Impact

## Business Objects Affected

## Modules Affected

## Data Loss Risk

## Locking / Performance Risk

## Backfill Required?

## Rollout Order

1.
2.
3.

## Staging Result

Command run:

Result:

Tests passed:

Manual checks:

## Production Preflight

[ ] Backup/PITR checked
[ ] Migration reviewed
[ ] Staging passed
[ ] Verification query ready
[ ] Roll-forward plan ready
[ ] Founder approval

## Production Execution

Command:

Operator:

Time:

## Production Verification

[ ] Migration applied
[ ] App works
[ ] Login works
[ ] Tenant isolation check passed
[ ] Permission check passed
[ ] Error logs checked
[ ] Data verification query passed

## Issues

## Follow-up Tasks
```

---

# 32. Acceptance Criteria

This document is accepted when:

```txt
[ ] Production migrations use Prisma migration files as source of truth.
[ ] `prisma migrate dev` is local-only.
[ ] `prisma migrate deploy` is the staging/production command.
[ ] `prisma db push` is forbidden outside throwaway local experiments.
[ ] Production migrations are not run inside Vercel build command.
[ ] Migrations are tested in staging before production.
[ ] Backup/restore state is checked before medium/high-risk production migrations.
[ ] Tenant safety is part of migration review.
[ ] Business Object changes require extra scrutiny.
[ ] Backfills are idempotent, tenant-aware, and dry-run capable.
[ ] Failed migrations have a stop/diagnose/forward-fix runbook.
[ ] Claude is forbidden from running or improvising production migrations.
[ ] The document is approved by the founder/architect.
```

---

# 33. Recommended Implementation Prompt for Claude

Use this only after this document is approved.

```md
You are implementing the OneDayOS database migration workflow.

Authoritative documents:
- docs/engineering-manual/06-data/02-prisma-conventions.md
- docs/engineering-manual/06-data/04-migrations-seeding.md
- docs/engineering-manual/15-deployment-operations/03-database-migrations-production.md
- docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md

Rules:
- Do not run production migrations.
- Do not ask for production DATABASE_URL.
- Do not use prisma db push.
- Do not use prisma migrate reset outside local/test.
- Do not put prisma migrate deploy inside Vercel build.
- Do not create client-specific schemas.
- Do not remove orgId from tenant-scoped tables.
- Do not create duplicate Business Objects.
- Do not add FastAPI, Alembic, SQLAlchemy, or Python migration tooling.

Task:
Implement local scripts, package.json commands, and CI-safe checks for migration workflow only.

Required outputs:
- package scripts
- migration check script if needed
- documentation update
- tests or architecture checks
- explanation of commands added

Before editing files:
1. List all files you will modify.
2. Explain how this avoids production-risk commands.
3. Stop if any requirement is ambiguous.
```

---

# 34. Final Rule

Database migrations are where the platform promise becomes real.

OneDayOS cannot promise one-day delivery and AppCare if production schema changes are improvised.

The correct standard is:

```txt
Fast module delivery.
Slow, careful production data changes.
```

That is how OneDayOS can move quickly without becoming fragile.
