# OneDayOS Engineering Manual — 06 Data — 04 Migrations & Seeding

**Document ID:** `06-data/04-migrations-seeding.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Allowed:** No — freeze before Claude implementation  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Applies To:** Restarted OneDayOS platform build  
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
- `05-sdk/05-sdk-compatibility-versioning.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`

---

# 1. Purpose

This document defines how OneDayOS creates, changes, verifies, seeds, and deploys its database schema and required baseline data.

Migrations and seeds are not just setup scripts.

They are part of the platform contract.

Because OneDayOS uses one shared PostgreSQL database for many client organizations, database changes affect every tenant. A migration mistake is not isolated to one client. It can affect the entire platform.

Therefore, this document exists to make database evolution:

- predictable,
- reviewable,
- reversible where possible,
- tenant-safe,
- compatible with one-day client delivery,
- safe for repeated deployments,
- safe for AI-assisted implementation,
- and aligned with the single-platform model.

The goal is not to make migrations complicated.

The goal is to make them boring.

---

# 2. Core Decision

OneDayOS uses:

```txt
Prisma schema
    ↓
Prisma migrations
    ↓
PostgreSQL database on Supabase
    ↓
Idempotent seed scripts
    ↓
Verified platform baseline
```

Prisma is the primary schema and migration authority for the MVP platform.

Supabase provides the PostgreSQL database, authentication infrastructure, dashboard, connection strings, backups, and operational tooling. Supabase is not the primary place where developers manually edit the schema.

---

# 3. Non-Negotiable Rules

## 3.1 Never hand-edit production schema

Do not change production schema by manually editing tables in the Supabase dashboard.

Forbidden:

```txt
Supabase Dashboard → Table Editor → Add column manually
Supabase SQL Editor → ALTER TABLE manually without migration
Local hotfix SQL that is not captured in the repo
```

Allowed only through emergency protocol:

```txt
Emergency SQL hotfix
    ↓
Document incident
    ↓
Create matching migration immediately
    ↓
Reconcile migration history
    ↓
Add regression test
```

The database schema must be reproducible from the repository.

---

## 3.2 Prisma migrations are source of truth

The committed migration history is authoritative.

Required:

```txt
prisma/schema.prisma
prisma/migrations/*
prisma.config.ts
prisma/seed.ts
```

A fresh environment should be able to run:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

and reach the expected baseline state.

---

## 3.3 `db push` is forbidden for shared environments

Forbidden in staging and production:

```bash
npx prisma db push
```

Reason:

`db push` changes schema directly without creating a reviewed migration history. That is unacceptable for a multi-tenant platform.

Allowed:

```bash
npx prisma db push
```

only in disposable experiments outside the main OneDayOS platform repository, and never for committed platform work.

---

## 3.4 `migrate dev` is local only

Allowed locally:

```bash
npx prisma migrate dev --name <migration-name>
```

Forbidden for staging and production:

```bash
npx prisma migrate dev
```

Production and staging must use:

```bash
npx prisma migrate deploy
```

---

## 3.5 Seeds must be idempotent

Seed scripts may be run more than once.

This must not create duplicates.

Correct:

```ts
await prisma.role.upsert({
  where: { orgId_name: { orgId, name: 'Admin' } },
  update: {},
  create: { orgId, name: 'Admin', isSystem: true },
})
```

Incorrect:

```ts
await prisma.role.create({
  data: { orgId, name: 'Admin', isSystem: true },
})
```

unless the seed is intentionally creating new sample records and is only used in local/demo mode.

---

## 3.6 Seeds must not overwrite client data

Seeds may create missing baseline records.

Seeds must not reset, overwrite, or delete real client configuration unless the script is explicitly a local reset script.

Forbidden in production seed:

```ts
await prisma.organization.deleteMany()
await prisma.user.deleteMany()
await prisma.role.updateMany({ data: { name: 'Admin' } })
await prisma.setting.deleteMany()
```

Allowed:

```ts
await ensureKernelPermissions()
await ensureSystemRolesForOrg(orgId)
await ensureRequiredSettingsForOrg(orgId)
```

---

## 3.7 Client-specific setup is not platform seed

The seed script should not become a dumping ground for client onboarding.

Wrong:

```txt
prisma/seed.ts creates Client A, Client B, Client C, and custom data for each.
```

Correct:

```txt
prisma/seed.ts
    baseline platform seed

scripts/orgs/create-org.ts
    creates one organization

scripts/orgs/enable-module.ts
    enables module for one organization

scripts/orgs/seed-demo-org.ts
    creates local/demo data only
```

Production client onboarding should be done through explicit org provisioning scripts or future admin UI, not by editing global seed every time a new client signs up.

---

## 3.8 Client-supplied `orgId` is forbidden in seeds and migrations

Seed and migration scripts may use `orgId` internally after looking up or creating an organization.

They must never accept arbitrary tenant IDs from untrusted client payloads.

For scripts run by operators, input should be stable identifiers like:

```txt
org slug
org name
module ID
admin email
```

Then the script resolves the real `Organization.id`.

---

## 3.9 Data migrations must be tenant-aware

Any migration that updates tenant-scoped data must include `orgId` in its logic or operate safely across all organizations.

Wrong:

```sql
UPDATE products SET unit = 'pcs' WHERE unit IS NULL;
```

Maybe acceptable if the change is truly universal.

Safer:

```sql
UPDATE products
SET unit = 'pcs'
WHERE unit IS NULL
  AND deleted_at IS NULL;
```

For complex data migrations, prefer a TypeScript script using Prisma with explicit model and tenant awareness.

---

## 3.10 FastAPI is not part of migrations or seeding

The restarted OneDayOS core platform does not use FastAPI for database migrations, seeding, or schema management.

Do not add:

```txt
Alembic
SQLAlchemy migrations
Python migration service
FastAPI seed endpoint
```

The migration authority remains Prisma + PostgreSQL.

---

# 4. Migration Philosophy

Database migrations must preserve customer trust.

Every migration must answer:

```txt
What schema changes?
What existing data changes?
Can it be rolled forward safely?
Can it be deployed while the app is running?
Does it affect all organizations?
Does it expose cross-tenant data?
Does it require a seed?
Does it require a backfill?
Does it require code to be deployed before or after?
How is success verified?
```

A migration is not complete when it runs.

A migration is complete when:

```txt
schema updated
Prisma client generated
tests pass
seed remains idempotent
production deploy path is clear
rollback/forward-fix plan exists
tenant data remains isolated
```

---

# 5. Migration Categories

## 5.1 Schema-only migration

Changes structure only.

Examples:

```txt
Add nullable column
Add optional relation
Add index
Add enum-like string column
Add new table
```

Usually safe if backwards-compatible.

---

## 5.2 Schema + data migration

Changes both schema and existing records.

Examples:

```txt
Add column
Backfill column
Make column required later
Normalize old values
Move data from one table to another
```

Requires more careful sequencing.

---

## 5.3 Tenant-wide data migration

Updates data for all organizations.

Examples:

```txt
Create missing default settings for every organization
Create missing Staff role for every organization
Normalize product units across all organizations
Backfill module permissions for all enabled modules
```

Requires tenant-safe logic.

---

## 5.4 Org-specific data migration

Updates one organization.

Examples:

```txt
Fix incorrect setup for one client
Enable a module for one client
Import initial client inventory records
Correct duplicate branch setup
```

This should usually be an operational script, not a global migration.

---

## 5.5 Security migration

Fixes an access or data-isolation problem.

Examples:

```txt
Add orgId to a table
Add missing tenant-scoped unique constraint
Add permission records
Remove unsafe duplicate user role records
Backfill deletedAt/deletedBy
```

Security migrations can override normal release timing, but they still need review, tests, and verification.

---

## 5.6 Destructive migration

Deletes data or drops columns/tables.

Examples:

```txt
Drop column
Drop table
Delete records
Change required relation in a way that can orphan data
```

Destructive migrations are forbidden unless explicitly approved through an ADR or emergency process.

For MVP, prefer two-step deprecation:

```txt
1. Stop reading/writing old field.
2. Wait at least one release.
3. Verify unused.
4. Drop in later migration.
```

---

# 6. Safe Migration Patterns

## 6.1 Expand-contract pattern

For breaking schema changes, use expand-contract.

Example: rename `Product.code` to `Product.sku`.

Do not do this in one migration:

```txt
Drop code
Add sku
Update app
```

Do this instead:

```txt
Release 1 — Expand
    Add nullable sku
    Keep code
    App writes both code and sku
    Backfill sku from code

Release 2 — Switch
    App reads sku
    Keep code for compatibility

Release 3 — Contract
    Verify no code usage
    Drop code
```

This reduces deployment risk because old code and new code can coexist temporarily.

---

## 6.2 Add nullable first, require later

Wrong:

```prisma
model Product {
  barcode String
}
```

on an existing table with existing rows.

Better:

```prisma
model Product {
  barcode String?
}
```

Then:

```txt
1. Add nullable field.
2. Backfill existing data if needed.
3. Update code to require it in new writes.
4. Later make it required only if truly necessary.
```

For SMEs, avoid unnecessary required fields. Required fields increase import and onboarding friction.

---

## 6.3 Add tables before using them

For new modules:

```txt
1. Add module-owned tables.
2. Deploy migration.
3. Deploy code that reads/writes tables.
4. Enable module for selected orgs.
```

Do not enable a module before its schema exists.

---

## 6.4 Add permissions before enforcing new actions

If a new feature requires a new permission:

```txt
1. Add permission constant.
2. Add role permission seed/backfill.
3. Deploy.
4. Enforce permission in API/service.
```

Otherwise existing admins may lose access after deployment.

---

## 6.5 Add indexes before high-volume queries

If a new feature will query by:

```txt
orgId
deletedAt
createdAt
status
moduleId
foreign key
```

then add indexes before the feature becomes heavily used.

Tenant-scoped tables commonly need indexes like:

```prisma
@@index([orgId, deletedAt])
@@index([orgId, createdAt])
@@index([orgId, status])
@@index([orgId, updatedAt])
```

Do not add indexes blindly. Add indexes for actual query paths.

---

## 6.6 Never combine unrelated changes

Bad migration:

```txt
add-inventory-module-and-rename-users-and-fix-settings-and-seed-crm
```

Good migrations:

```txt
add-inventory-stock-tables
add-user-last-login-column
add-kernel-settings-defaults
```

Small migrations are easier to review and repair.

---

# 7. Naming Conventions

## 7.1 Migration names

Use short kebab-case names with intent.

Good:

```bash
npx prisma migrate dev --name add-inventory-stock-tables
npx prisma migrate dev --name add-user-last-login-at
npx prisma migrate dev --name add-product-barcode
npx prisma migrate dev --name create-module-settings
npx prisma migrate dev --name backfill-default-role-permissions
```

Bad:

```bash
npx prisma migrate dev --name update
npx prisma migrate dev --name changes
npx prisma migrate dev --name fix
npx prisma migrate dev --name final
```

---

## 7.2 Script names

Use explicit script names:

```txt
scripts/db/verify-migration.ts
scripts/db/check-tenant-integrity.ts
scripts/db/backfill-default-settings.ts
scripts/orgs/create-org.ts
scripts/orgs/enable-module.ts
scripts/orgs/seed-demo-org.ts
scripts/orgs/import-products.ts
```

---

## 7.3 Seed function names

Use `ensure*` names for idempotent seed functions:

```ts
ensureSystemRolesForOrg()
ensureAdminRoleForOrg()
ensureStaffRoleForOrg()
ensureKernelSettingsForOrg()
ensureSubscriptionForOrg()
ensureModuleDefaultsForOrg()
ensureDemoOrg()
```

Use `create*` only when duplicate creation is intended.

---

# 8. Required Files

The restarted platform should include:

```txt
prisma/
  schema.prisma
  migrations/
  seed.ts

prisma.config.ts

scripts/
  db/
    check-tenant-integrity.ts
    verify-migration.ts
    reset-local-db.ts
  orgs/
    create-org.ts
    enable-module.ts
    seed-demo-org.ts
```

Optional later:

```txt
scripts/
  imports/
    import-products.ts
    import-employees.ts
    import-customers.ts
```

---

# 9. Prisma Config

OneDayOS should configure Prisma through `prisma.config.ts`.

Required responsibilities:

```txt
database URL loading
schema location
migration settings
seed command
```

Example:

```ts
// prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',

  datasource: {
    url: env('DATABASE_URL'),
  },

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
})
```

Notes:

- Do not rely on `package.json` `prisma.seed` for the restarted build.
- Keep Prisma config close to the root `package.json`.
- Do not put real secrets in this file.
- Use environment variables.
- Do not configure a second migration system.

---

# 10. Prisma Client Generation

Prisma Client generation must be explicit in the platform workflow.

Required package scripts:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset:local": "prisma migrate reset",
    "check": "npm run db:generate && npm run lint && npm run typecheck && npm run test:run && npm run build"
  }
}
```

Recommended build script:

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

Reason:

A fresh clone or CI environment may not have generated Prisma Client yet.

---

# 11. Local Development Workflow

## 11.1 Creating a new migration locally

When changing schema:

```bash
# 1. Edit prisma/schema.prisma

# 2. Create migration locally
npx prisma migrate dev --name add-product-barcode

# 3. Generate client
npx prisma generate

# 4. Run tests
npm run test:run

# 5. Run typecheck
npm run typecheck

# 6. Run build
npm run build
```

Do not commit a schema change without its matching migration folder.

---

## 11.2 Local reset

Allowed locally only:

```bash
npx prisma migrate reset
```

This drops and recreates the local database.

Never run this against staging or production.

Create an explicit wrapper to reduce accidents:

```bash
npm run db:reset:local
```

The wrapper should check:

```txt
NODE_ENV !== production
DATABASE_URL does not contain production host
operator confirms reset
```

---

## 11.3 Local seed

Run:

```bash
npx prisma db seed
```

The seed should create:

```txt
demo organization
demo admin user only if configured
system roles
kernel settings
sample branch
sample department
optional demo module enablement
```

Do not assume local seed has Supabase Auth service role unless configured.

For local development, it may be acceptable to create Prisma-side demo records, but authentication records must still follow the Authentication document if login is required.

---

# 12. Staging Workflow

Staging should mimic production as much as practical.

Recommended staging flow:

```txt
1. Merge migration PR into staging branch.
2. CI runs tests and build.
3. CI runs `prisma migrate deploy` against staging database.
4. CI runs `prisma generate`.
5. CI deploys app to staging.
6. CI or operator runs staging-safe seed/backfill if required.
7. Smoke tests run.
8. Founder/engineer verifies high-risk flows.
```

Required staging checks:

```txt
[ ] login works
[ ] /api/kernel/auth/me works
[ ] org route membership check works
[ ] wrong-org route returns safe 404
[ ] admin permission works
[ ] staff permission denial works
[ ] seed is idempotent
[ ] migration does not expose deleted records
[ ] module enablement still works
```

---

# 13. Production Workflow

Production migration must be deliberate.

Recommended production flow:

```txt
1. Review migration PR.
2. Confirm migration category.
3. Confirm backup/PITR readiness.
4. Deploy migration using `prisma migrate deploy`.
5. Generate Prisma Client.
6. Deploy app code.
7. Run required seed/backfill.
8. Run post-deploy checks.
9. Monitor logs/errors.
```

For many changes, app code and migrations are deployed together through CI/CD. For riskier changes, separate into expand-contract releases.

---

## 13.1 Production command

Use:

```bash
npx prisma migrate deploy
```

Do not use:

```bash
npx prisma migrate dev
npx prisma db push
npx prisma migrate reset
```

against production.

---

## 13.2 Production seed

Production seed is allowed only if it is idempotent and baseline-only.

Allowed:

```bash
npx prisma db seed
```

if `prisma/seed.ts` is safe for production.

Better long term:

```bash
npm run db:seed:baseline
npm run org:create
npm run org:enable-module
```

because these separate platform baseline from client onboarding.

---

## 13.3 Production backfill

If a migration needs data backfill, prefer explicit one-time script:

```bash
tsx scripts/db/backfill-product-barcodes.ts
```

The script must:

```txt
log what it will do
support dry run
process records in batches
be tenant-aware
be idempotent or resume-safe
avoid full-table memory loading
write progress logs
fail loudly
```

---

# 14. Seed Architecture

## 14.1 Seed should be modular

Do not write one giant `main()`.

Recommended structure:

```ts
async function main() {
  await seedBaseline()
  await seedDemoIfEnabled()
}

async function seedBaseline() {
  await ensureKernelDefaults()
  await ensureDemoPlanDefinitions()
}

async function seedDemoIfEnabled() {
  if (process.env.SEED_DEMO !== 'true') return

  const org = await ensureDemoOrg()
  await ensureSystemRolesForOrg(org.id)
  await ensureDemoUsersForOrg(org.id)
  await ensureDemoOrgStructure(org.id)
  await ensureDemoModules(org.id)
}
```

---

## 14.2 Baseline seed vs demo seed

Separate baseline data from demo data.

Baseline seed:

```txt
required system permissions
required settings keys
required subscription plan definitions if modeled
default role templates
global module registry metadata if persisted
```

Demo seed:

```txt
Demo Corporation
sample branches
sample departments
sample employees
sample products
sample customers
sample suppliers
sample warehouses
sample module records
```

Demo seed should be disabled by default in production.

---

## 14.3 Required baseline seed

The baseline seed should ensure:

```txt
kernel permission constants are represented if persisted
system role templates exist if modeled
default settings exist
default subscription plan defaults exist if modeled
demo plan constraints are consistent
```

Because the current manual favors manifest-declared permissions and org-scoped roles, the MVP baseline seed may be small.

The most important production seed may be per-org provisioning, not global seed.

---

## 14.4 Required org provisioning seed

When a new organization is created, OneDayOS must provision:

```txt
Organization
Subscription
Admin User
Admin Role
Admin Permissions
Staff Role
Default Kernel Settings
Default Branch if appropriate
Default Department if appropriate
Enabled Modules
Module Default Settings
Module Seed Data if module requires it
```

This should happen through the registration route for self-service org creation, or through an operator/admin script for manually onboarded clients.

It should not require editing `prisma/seed.ts`.

---

# 15. Organization Provisioning Scripts

The restarted platform should include scripts for operator-driven onboarding until an admin UI exists.

## 15.1 `scripts/orgs/create-org.ts`

Purpose:

```txt
Create an organization and initial admin account.
```

Inputs:

```txt
--org-name
--admin-name
--admin-email
--plan
```

Optional:

```txt
--slug
--modules inventory,crm
--trial-days 30
```

Output:

```txt
organization slug
admin email
enabled modules
next steps
```

Security:

```txt
Do not print passwords unless intentionally generated for one-time use.
Do not log service role keys.
Do not create Supabase Auth user without corresponding Prisma User.
Follow the Authentication document.
```

---

## 15.2 `scripts/orgs/enable-module.ts`

Purpose:

```txt
Enable one module for one organization.
```

Inputs:

```txt
--org-slug
--module inventory
```

Behavior:

```txt
verify org exists
verify module manifest exists
verify dependencies are enabled
upsert OrgModule
run module seed if available
```

---

## 15.3 `scripts/orgs/seed-demo-org.ts`

Purpose:

```txt
Create demo data for local/staging demos.
```

Important:

This script should not run automatically in production.

---

# 16. Module Seeding

Modules may define a seed function in their manifest, but module seed behavior must be controlled.

A module seed may create:

```txt
default settings
default categories
default statuses
default workflow states
starter records only if demo mode
```

A module seed must not:

```txt
create duplicate records on repeated runs
overwrite client configuration
delete records
create users
change roles except through approved permission provisioning
```

Example manifest concept:

```ts
export const InventoryModule = {
  id: 'inventory',
  label: 'Inventory',
  seed: async (ctx) => {
    await ensureInventorySettings(ctx)
    await ensureInventoryDefaultCategories(ctx)
  },
}
```

The seed receives verified context or controlled provisioning context, not raw unvalidated `orgId`.

---

# 17. Permission Seeding

Permissions are part of the security model.

When a module declares permissions in its manifest:

```ts
permissions: [
  { module: 'inventory', resource: 'product', action: 'read' },
  { module: 'inventory', resource: 'product', action: 'create' },
  { module: 'inventory', resource: 'stock_adjustment', action: 'approve' },
]
```

The system must support provisioning these into roles.

## 17.1 Admin role

Admin should receive:

```txt
*.*.*
```

inside the organization only.

Admin wildcard does not cross tenant boundaries.

---

## 17.2 Staff role

Staff should not automatically receive all permissions.

For MVP, Staff may receive conservative read permissions only if appropriate.

Example:

```txt
kernel.profile.read
inventory.product.read
```

Do not grant broad mutation permissions to Staff by default.

---

## 17.3 Module enablement does not equal permission

Enabling Inventory for an organization means the module can be used in that org.

It does not mean every user can perform every Inventory action.

Both gates are required:

```txt
OrgModule enabled
    +
Role permission granted
```

---

# 18. Settings Seeding

Settings must be idempotent and schema-validated.

Example:

```ts
await prisma.setting.upsert({
  where: {
    orgId_module_key: {
      orgId,
      module: 'kernel',
      key: 'timezone',
    },
  },
  update: {},
  create: {
    orgId,
    module: 'kernel',
    key: 'timezone',
    value: 'Asia/Manila',
  },
})
```

Do not blindly update existing settings:

```ts
update: { value: defaultValue }
```

This could overwrite client configuration.

Prefer:

```ts
update: {}
```

or update only when a versioned migration intentionally changes defaults.

---

# 19. Seed Data and Supabase Auth

Authentication data has two sides:

```txt
Supabase Auth user
Prisma User
```

The registration/auth document already requires server-owned Supabase ↔ Prisma sync.

Seed scripts that create login-capable users must follow the same rule:

```txt
create Supabase Auth user with service role
create Prisma User in same logical operation
create roles
if Prisma step fails, roll back Supabase Auth user
```

Do not create a Prisma `User` without a matching Supabase Auth user if that user is expected to log in.

Do not create a Supabase Auth user without a matching Prisma `User`.

For demo-only non-login data, use `Employee`, not `User`.

---

# 20. Migration Review Checklist

Every migration PR must answer this checklist.

```txt
[ ] Does this change schema, data, or both?
[ ] Does every tenant-scoped table include orgId?
[ ] Are new unique constraints tenant-scoped where needed?
[ ] Are deleted records considered?
[ ] Are indexes needed for new query paths?
[ ] Is this backwards-compatible with existing code?
[ ] Does this require expand-contract?
[ ] Does this require a backfill?
[ ] Is the backfill idempotent?
[ ] Does this affect all organizations?
[ ] Does this affect permissions?
[ ] Does this affect module enablement?
[ ] Does this affect seed data?
[ ] Does this affect API response shape?
[ ] Does this affect generated modules?
[ ] Does this require tests?
[ ] Has the migration been tested on a copy/local/staging DB?
[ ] Is there a rollback or forward-fix plan?
```

A migration with unchecked tenant implications should not be merged.

---

# 21. Seed Review Checklist

Every seed change must answer:

```txt
[ ] Is this baseline seed, demo seed, or org provisioning?
[ ] Is it safe to run more than once?
[ ] Could it overwrite client data?
[ ] Could it create duplicates?
[ ] Does it create Supabase Auth users?
[ ] Does it create Prisma Users?
[ ] Does it create roles or permissions?
[ ] Does it enable modules?
[ ] Does it depend on module manifests?
[ ] Does it use stable unique keys?
[ ] Is it safe in production?
[ ] Should it be behind an environment flag?
```

---

# 22. Backfill Scripts

Backfills must be written like production code.

## 22.1 Required features

A backfill script should support:

```txt
dry run
batching
progress logging
resume safety
idempotency
tenant awareness
clear error output
```

Example CLI:

```bash
tsx scripts/db/backfill-product-barcodes.ts --dry-run
tsx scripts/db/backfill-product-barcodes.ts --execute
```

---

## 22.2 Batch pattern

Do not load all records into memory.

Bad:

```ts
const products = await prisma.product.findMany()
for (const product of products) {
  // update
}
```

Better:

```ts
const batchSize = 500
let cursor: string | undefined

while (true) {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    take: batchSize,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { id: 'asc' },
  })

  if (products.length === 0) break

  for (const product of products) {
    // idempotent update
  }

  cursor = products[products.length - 1].id
}
```

For tenant-scoped models, ensure updates preserve `orgId` boundaries.

---

## 22.3 Backfill auditability

A backfill should log:

```txt
script name
environment
dry run or execute
records scanned
records changed
records skipped
errors
duration
```

For high-risk scripts, write a record to a future internal migration log table.

---

# 23. Migration Verification

After applying migrations, verify:

```txt
Prisma migration status
Prisma Client generated
database tables exist
required indexes exist
seed is idempotent
tenant integrity check passes
app build passes
API smoke tests pass
```

Recommended script:

```bash
npm run db:verify
```

Potential checks:

```ts
await prisma.$queryRaw`SELECT 1`
await prisma.organization.count()
await prisma.role.count()
await prisma.permission.count()
await prisma.setting.count()
```

Tenant integrity checks:

```txt
orphaned users
orphaned roles
permissions whose roles do not belong to same org
tenant-scoped rows with missing orgId
duplicate slugs
duplicate per-org business codes
module records without OrgModule enablement if required
```

---

# 24. Tenant Integrity Script

Create:

```txt
scripts/db/check-tenant-integrity.ts
```

It should check:

```txt
User.orgId points to existing Organization
Role.orgId points to existing Organization
Permission role belongs to org-scoped role
UserRole user and role belong to same org
Branch.orgId points to existing Organization
Department.orgId points to existing Organization
Employee.orgId points to existing Organization
Product.orgId points to existing Organization
Customer.orgId points to existing Organization
Supplier.orgId points to existing Organization
Warehouse.orgId points to existing Organization
OrgModule.orgId points to existing Organization
Setting.orgId points to existing Organization
```

For MVP, many of these are enforced by foreign keys. The script still helps catch logical inconsistencies, especially around roles and user-role assignment.

Example critical check:

```txt
UserRole must not connect a user from Org A to a role from Org B.
```

This must never happen.

---

# 25. Migration and Deployment Ordering

Some changes require ordering.

## 25.1 Backwards-compatible schema first

Preferred:

```txt
Deploy migration first
Deploy code second
```

Example:

```txt
add nullable field
add new table
add index
```

---

## 25.2 Code first when removing usage

Preferred:

```txt
Deploy code that stops using field
Wait one release
Drop field later
```

Example:

```txt
remove old setting key
drop obsolete column
remove legacy relation
```

---

## 25.3 Coordinated deploy for security fixes

Some security fixes require code and database changes together.

Example:

```txt
Add orgId to module table
Backfill orgId
Add unique constraint
Update SDK query pattern
Deploy code
```

For such changes, create a release plan in the PR.

---

# 26. Rollback and Forward-Fix Strategy

In production databases, rollback is not always simple.

The preferred strategy is usually:

```txt
forward-fix
```

not blindly reversing migrations.

## 26.1 Forward-fix

If a migration added a nullable field and code fails:

```txt
fix code
deploy again
```

If a migration introduced wrong default data:

```txt
write corrective migration/script
run verification
```

---

## 26.2 Rollback

Rollback may be acceptable for code.

Database rollback is dangerous if writes occurred after the migration.

Before database rollback, ask:

```txt
Did users create data using the new schema?
Would rollback delete or orphan that data?
Can we preserve data?
Is restore from backup safer?
```

---

## 26.3 Destructive rollback forbidden

Do not run:

```sql
DROP TABLE
DROP COLUMN
DELETE FROM
```

as rollback without review.

---

# 27. Backup Requirements Before High-Risk Migration

Before high-risk production migrations:

```txt
[ ] Confirm Supabase backup status
[ ] Confirm PITR availability if enabled
[ ] Confirm last backup time
[ ] Confirm migration has been tested on staging
[ ] Confirm owner is available during deploy
[ ] Confirm rollback/forward-fix plan
```

High-risk migrations include:

```txt
large backfills
destructive schema changes
permission changes
tenant isolation changes
auth/user changes
large index changes
table rewrites
```

---

# 28. Environment Policy

## 28.1 Local

Purpose:

```txt
developer testing
migration creation
seed testing
module development
```

Allowed:

```txt
migrate dev
migrate reset
demo seed
db push only in throwaway experiments
```

---

## 28.2 Staging

Purpose:

```txt
production rehearsal
migration verification
client demo testing
security regression testing
```

Allowed:

```txt
migrate deploy
baseline seed
demo seed only if staging demo environment
```

Forbidden:

```txt
migrate reset
db push
manual schema changes
```

---

## 28.3 Production

Purpose:

```txt
real customer operations
```

Allowed:

```txt
migrate deploy
baseline seed if production-safe
approved org provisioning scripts
approved backfills
```

Forbidden:

```txt
migrate dev
migrate reset
db push
manual schema edits
demo seed
unreviewed backfills
```

---

# 29. CI/CD Requirements

CI should run:

```bash
npm run db:generate
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run check:architecture
```

For deployment environments:

```bash
npx prisma migrate deploy
npx prisma generate
```

Seed should not always run automatically in production unless explicitly safe.

Recommended approach:

```txt
migrate deploy
generate
deploy app
run baseline seed only when seed changed or environment is new
run backfill scripts explicitly
```

---

# 30. Generated Module Requirements

The module generator must respect migration and seed rules.

When generating a module, Claude or the generator must not:

```txt
edit production database manually
create module tables without migrations
create schema fields without orgId
create hard-delete behavior
create seed that overwrites data
create APIs that accept orgId
create raw Prisma imports inside module code
```

Generated module implementation should include:

```txt
Prisma model proposal
migration name
service methods using sdk.getDb(ctx)
module permission list
module seed requirements
tenant-isolation tests
permission-denial tests
soft-delete tests
event-emission tests
```

---

# 31. Business Object Migration Rules

Business Objects are shared across modules.

Changes to Business Objects require extra caution.

Examples:

```txt
Product
Customer
Supplier
Warehouse
Employee
```

Before adding a Business Object field, ask:

```txt
Is this field needed by three independent use cases?
Is it lowest common denominator?
Would it be better in a module extension table?
Will this field confuse clients that do not use that module?
Does it belong to a specific domain?
```

If a field starts in a module extension table and later becomes shared:

```txt
1. Add nullable field to Business Object.
2. Backfill from extension table where applicable.
3. Update modules to read/write shared field.
4. Keep extension field temporarily.
5. Remove extension field only after verification.
```

---

# 32. Module-Owned Table Migration Rules

Module-owned tables must include:

```txt
id
orgId
createdAt
updatedAt where useful
deletedAt/deletedBy for business records
foreign keys to Business Objects where appropriate
tenant-scoped indexes
tenant-scoped unique constraints
```

Example:

```prisma
model InventoryStockMovement {
  id          String   @id @default(cuid())
  orgId       String
  productId   String
  warehouseId String
  quantity    Decimal
  type        String
  createdAt   DateTime @default(now())
  deletedAt   DateTime?
  deletedBy   String?

  org       Organization @relation(fields: [orgId], references: [id])
  product   Product      @relation(fields: [productId], references: [id])
  warehouse Warehouse    @relation(fields: [warehouseId], references: [id])

  @@index([orgId, productId])
  @@index([orgId, warehouseId])
  @@index([orgId, createdAt])
  @@map("inventory_stock_movements")
}
```

Do not create module tables without `orgId`.

---

# 33. Seed Safety Examples

## 33.1 Correct role seed

```ts
export async function ensureAdminRoleForOrg(orgId: string) {
  const role = await prisma.role.upsert({
    where: { orgId_name: { orgId, name: 'Admin' } },
    update: {},
    create: {
      orgId,
      name: 'Admin',
      isSystem: true,
    },
  })

  await prisma.permission.upsert({
    where: {
      orgId_roleId_module_resource_action: {
        orgId,
        roleId: role.id,
        module: '*',
        resource: '*',
        action: '*',
      },
    },
    update: {},
    create: {
      orgId,
      roleId: role.id,
      module: '*',
      resource: '*',
      action: '*',
    },
  })

  return role
}
```

Note:

The exact unique key depends on the approved Prisma schema. The important rule is that permissions are org-scoped and idempotent.

---

## 33.2 Correct setting seed

```ts
export async function ensureKernelSetting(
  orgId: string,
  key: string,
  defaultValue: unknown
) {
  return prisma.setting.upsert({
    where: {
      orgId_module_key: {
        orgId,
        module: 'kernel',
        key,
      },
    },
    update: {},
    create: {
      orgId,
      module: 'kernel',
      key,
      value: defaultValue,
    },
  })
}
```

---

## 33.3 Incorrect setting seed

```ts
await prisma.setting.upsert({
  where: { orgId_module_key: { orgId, module: 'kernel', key: 'timezone' } },
  update: { value: 'Asia/Manila' },
  create: { orgId, module: 'kernel', key: 'timezone', value: 'Asia/Manila' },
})
```

Problem:

This overwrites a client’s chosen timezone every time seed runs.

---

# 34. Required Tests

## 34.1 Migration tests

At minimum:

```txt
fresh database can apply migrations
Prisma Client can generate
app can build after migration
seed can run once
seed can run twice
```

---

## 34.2 Seed tests

Seed tests should verify:

```txt
roles are not duplicated
permissions are not duplicated
settings are not overwritten
demo data does not run unless enabled
module seed does not run for disabled modules
org provisioning creates admin role and permissions
```

---

## 34.3 Tenant safety tests

For migration/backfill scripts touching tenant data:

```txt
Org A data remains Org A
Org B data remains Org B
UserRole cannot cross orgs
module records cannot lose orgId
deleted records are not unintentionally restored
```

---

# 35. Production Readiness Gate

Before the restarted platform can be considered production-ready:

```txt
[ ] `prisma migrate deploy` verified against staging
[ ] `prisma db seed` verified against staging
[ ] seed is idempotent
[ ] no production seed overwrites client data
[ ] no schema changes are manual-only
[ ] Prisma Client generation is part of build
[ ] migration status can be checked
[ ] tenant integrity script exists
[ ] at least two-org tenant tests pass
[ ] backup/PITR expectations documented
[ ] org provisioning script exists or registration route covers first org provisioning
[ ] module enablement script or admin UI exists
[ ] generated modules include migration guidance
```

---

# 36. Claude Implementation Instructions

When Claude implements migrations and seeding, give this instruction:

```md
You are implementing OneDayOS database migrations and seed workflow.

Authoritative document:
docs/engineering-manual/06-data/04-migrations-seeding.md

Rules:
- Do not use FastAPI, Alembic, or SQLAlchemy.
- Do not use `prisma db push` for committed platform work.
- Do not edit production schema manually.
- Use Prisma migrations as source of truth.
- Use `prisma.config.ts` for Prisma configuration and seed command.
- Seeds must be idempotent.
- Seeds must not overwrite client data.
- Do not accept client-supplied orgId.
- Org provisioning should be separate from global seed.
- Any tenant data script must be tenant-aware.
- Add tests for seed idempotency.
- Add at least two-organization tests for tenant-sensitive scripts.
- Stop if schema, seed, or migration requirements conflict with another frozen manual document.
```

Claude must not decide:

```txt
to add a second migration system
to move schema management into Supabase dashboard
to introduce FastAPI/Alembic
to make seed destructive
to create per-client forks
to ignore tenant isolation in scripts
```

Claude may decide:

```txt
helper function names
script file organization within approved folders
test implementation details
small refactors that preserve the manual contract
```

---

# 37. Common Mistakes to Avoid

## 37.1 Treating seed as reset

Seed is not reset.

Reset is local-only and destructive.

---

## 37.2 Adding demo data to production

Demo data must be behind an explicit flag.

---

## 37.3 Forgetting Prisma generate

If Prisma Client is not generated in CI/build, fresh environments break.

---

## 37.4 Adding required fields too early

Required fields slow onboarding and break existing data.

Prefer nullable + validation at app level until the data model is proven.

---

## 37.5 Not testing seed twice

A seed that works once but fails the second time is not idempotent.

---

## 37.6 Using migrations for client onboarding

Client onboarding is provisioning, not global migration.

---

## 37.7 Backfilling without batching

Full-table updates can be dangerous as the platform grows.

---

## 37.8 Adding Business Object fields too casually

Business Object migrations affect many modules. Use the Three Independent Use Cases Rule.

---

# 38. Future Enhancements

Do not implement these in MVP unless required by a frozen document:

```txt
migration dashboard
internal migration log table
per-org module version pinning
declarative client provisioning files
tenant-specific feature rollout migrations
RLS policy migrations
automated backup verification
restore drills
data anonymization for staging
migration dry-run previews
background backfill jobs
```

These are valuable later, but MVP should stay operationally simple.

---

# 39. Acceptance Criteria

This document is complete when a new engineer or Claude can answer:

```txt
How do we create a migration?
How do we apply migrations locally?
How do we apply migrations in staging/production?
What commands are forbidden?
How do we seed baseline data?
How do we seed demo data?
How do we provision a new organization?
How do we keep seed idempotent?
How do we avoid overwriting client data?
How do we run a tenant-safe backfill?
How do we verify a migration succeeded?
How do we avoid schema drift?
```

Implementation of this document is complete when:

```txt
[ ] prisma.config.ts exists
[ ] Prisma migration commands are in package scripts
[ ] Prisma generate is part of build/check workflow
[ ] prisma/seed.ts is modular and idempotent
[ ] demo seed is gated by environment flag
[ ] org provisioning script exists or registration covers provisioning
[ ] module enablement script exists or admin UI covers it
[ ] tenant integrity script exists
[ ] seed idempotency tests exist
[ ] two-org tenant safety tests exist
[ ] production migration checklist exists in docs or PR template
[ ] no forbidden migration commands are documented as normal workflow
```

---

# 40. Final Doctrine

OneDayOS should be able to onboard the 1st client and the 100th client from the same platform foundation.

That requires database changes to be disciplined from day one.

The migration system must make it easy to improve the base platform without forking client apps.

The seed system must make it easy to create new organizations without contaminating existing ones.

The database must remain shared, tenant-safe, reproducible, and boring.

That is the point.
