# OneDayOS — V2-6B Acceptance Gate
# Dependency Remediation + Disposable Migration Rehearsal

V2-6B Schema, Migration, and Backfill Foundation is code-complete within its authorized scope.

The Founder does **not** authorize V2-6C yet.

Two acceptance gates remain:

1. Dependency audits now report production and development vulnerabilities.
2. The expand-only migration has not been executed against an isolated disposable PostgreSQL database.

This package is limited to:

- dependency security remediation,
- disposable migration rehearsal,
- read-only backfill-preflight rehearsal,
- V2-6B acceptance evidence.

It must not apply the migration or backfill to the controlled sandbox.

## Current V2-6B Evidence

Implemented:

- `InventoryTransactionType`
- `InventoryTransactionStatus`
- `InventoryTransaction`
- `InventoryTransactionLine`
- nullable canonical `StockMovement` links
- one expand-only migration
- tenant-safe relations and checks
- read-only deterministic legacy backfill preflight
- 9 valid / 0 invalid / 0 warning legacy sandbox adjustments
- 418 tests passing
- `check:all` passing
- `demo:check` passing
- no migration or backfill applied

Current blockers:

- production audit reports moderate/high vulnerabilities
- full audit reports moderate/high vulnerabilities
- no `ONEDAYOS_MIGRATION_TEST_DATABASE_URL` rehearsal occurred

## Absolute Scope

### Allowed

- inspect and remediate current dependency advisories
- update direct dependency versions coherently
- update `package-lock.json`
- add narrowly scoped npm overrides only where a parent package cannot yet resolve a compatible patched transitive dependency
- run `npm ci`
- create or use an isolated disposable PostgreSQL database
- apply migrations only to disposable migration-test databases
- seed synthetic legacy fixture data only into disposable migration-test databases
- run the read-only backfill preflight against disposable databases
- test database constraints and migration compatibility
- add migration-rehearsal scripts/tests
- update V2-6B reports and dependency reports
- add a placeholder migration-test variable to `.env.example` if needed
- add a package script for disposable rehearsal if it is safe and cannot target the sandbox
- run all current gates
- restore the current production server on port 1320

### Forbidden

Do not:

- use the configured sandbox `DATABASE_URL`
- use the configured sandbox `DIRECT_URL`
- apply the V2-6B migration to Supabase
- execute a real legacy-data backfill
- run `prisma db push`
- run `prisma migrate reset` against any persistent/shared database
- modify canonical demo data
- run `demo:reset`
- implement V2-6C posting/reversal services
- implement transaction APIs, permissions, events, or UI
- change Inventory business behavior
- add V2-6D features
- implement caching, accents, website assets, new modules, or Platform Services
- run `npm audit fix`
- run `npm audit fix --force`
- weaken or suppress dependency audits
- commit or tag
- modify or stage authorized prompt files
- modify `.env.local`

## Primary Authority

Read first:

- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6B-SCHEMA-MIGRATION-BACKFILL.md`
- `docs/engineering-manual/00-meta/V2-6B-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6b-schema-migration-backfill.md`
- `docs/engineering-manual/00-meta/V2-6-SCHEMA-MIGRATION-REVIEW.md`
- `docs/engineering-manual/00-meta/V2-6-MIGRATION-BACKFILL-PLAN.md`
- `docs/engineering-manual/00-meta/V2-6-TEST-MATRIX.md`
- `docs/engineering-manual/00-meta/V2-6-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-AUDIT-TRIAGE-2026-07.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`
- `docs/engineering-manual/15-deployment-operations/03-database-migrations-production.md`
- `docs/engineering-manual/06-data/02-migrations.md`
- `docs/engineering-manual/13-security/08-production-readiness-gate.md`

Inspect:

- `package.json`
- `package-lock.json`
- `.nvmrc`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `prisma.config.ts`
- `scripts/inventory-v2/**`
- `.github/workflows/ci.yml`
- `.env.example`

If authorities conflict, stop and report the exact conflict.

## Repository Safety

Before work:

1. Run `git status --short`.
2. Record every changed/untracked path.
3. Preserve all approved V2-6 governance and V2-6B changes.
4. Authorized prompt files must remain untouched, unstaged, and uncommitted.
5. Do not reset, restore, delete, or overwrite unrelated work.
6. Do not create a commit or tag.
7. Use Node 24.
8. Stop stale runtime only before the final build/start.

# Phase 1 — Reproduce and Classify the Dependency Audit

Under Node 24 run and save sanitized output under `/tmp`:

```bash
node --version
npm --version

npm audit --json > /tmp/onedayos-v2-6b-audit-before.json || true
npm audit --omit=dev --json > /tmp/onedayos-v2-6b-audit-prod-before.json || true
npm audit --audit-level=high || true
npm outdated || true
npm ls --all
```

For every advisory record:

- advisory ID/title
- severity
- affected package
- installed version
- affected range
- patched range
- direct or transitive
- production/runtime or development/tooling
- exact dependency path
- exploit prerequisites
- current OneDayOS exposure
- compatible parent-package upgrade, if any
- whether npm proposes a breaking change

Update the dependency triage document with newly disclosed advisories before changing versions.

Do not dismiss high findings merely because V2-6B code does not use the affected path.

# Phase 2 — Minimal Dependency Remediation

Use the smallest coherent non-breaking changes.

Rules:

1. Prefer upgrading the direct parent.
2. Keep related package families coherent:
   - Next / eslint-config-next
   - Prisma / `@prisma/client` / `@prisma/adapter-pg`
3. Preserve current scoped override decisions unless a patched parent eliminates them.
4. Use a narrow parent-scoped override only when:
   - the patched transitive version is API-compatible,
   - the parent cannot currently resolve it naturally,
   - compatibility tests pass,
   - removal conditions are documented.
5. Do not use broad global overrides without evidence.
6. Do not add a vulnerable direct dependency merely to hide a transitive audit path.
7. Do not downgrade current framework or ORM major versions.
8. Do not modify application code unless a small compatibility correction is unavoidable and fully tested.

After version selection:

```bash
npm ci
npm ls --all
```

Required:

- no invalid packages
- no unmet peer dependencies
- deterministic lockfile
- no manual lockfile edits

# Phase 3 — Dependency Acceptance Threshold

Run:

```bash
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

Required before migration rehearsal:

```text
production moderate → pass
full high → pass
full moderate → pass
```

If clean audits cannot be achieved safely, stop and report. Do not proceed to database rehearsal.

# Phase 4 — Isolated Migration-Test Database Gate

The migration rehearsal must never use:

- `.env.local` `DATABASE_URL`
- `.env.local` `DIRECT_URL`
- the controlled Supabase sandbox
- any shared/production-like database

Approved sources, in order:

## Option A — Dedicated configured migration-test URL

Use only:

```text
ONEDAYOS_MIGRATION_TEST_DATABASE_URL
```

Requirements:

- variable name is distinct
- URL is not equal to `DATABASE_URL` or `DIRECT_URL`
- host/database identity is demonstrably disposable/non-production
- no credentials are printed
- database can be dropped/recreated safely

## Option B — Existing local disposable PostgreSQL

If the variable is absent, inspect whether an isolated local PostgreSQL test environment is already available through:

- local PostgreSQL tools and a dedicated temporary database, or
- Docker/Podman already installed and usable without adding dependencies.

You may create a disposable local database/container only when:

- it is clearly isolated,
- it uses no sandbox credentials,
- it will be destroyed after rehearsal,
- the commands and cleanup are documented.

Do not install Docker/PostgreSQL in this task.

## No safe database available

If neither option is available:

- complete dependency remediation,
- create the rehearsal scripts/tests,
- stop before any migration execution,
- report the exact operator action required,
- leave V2-6B acceptance pending.

Never substitute the sandbox URL.

# Phase 5 — Create a Safe Rehearsal Harness

Create a migration-rehearsal harness consistent with repository conventions, for example:

```text
scripts/inventory-v2/
  migration-rehearsal.ts
  migration-rehearsal.test.ts
  migration-fixtures.ts
```

or a shell/TypeScript combination if clearer.

Requirements:

- refuses sandbox `DATABASE_URL`/`DIRECT_URL`
- requires the dedicated test URL or an internally created local disposable DB
- prints no credentials
- records database host/database only in redacted/safe form
- can create/reset only the isolated disposable database
- always cleans up a locally created disposable DB/container
- never calls `demo:reset`
- never reads/writes the controlled demo organization
- no production mode
- no generic arbitrary URL argument
- safe failure and cleanup

Add an explicit package script only if safe, such as:

```text
inventory:v2:migration:rehearse
```

Do not add an apply-to-sandbox script.

# Phase 6 — Fresh-Database Migration Rehearsal

Against Disposable Database A:

1. apply all repository migrations from an empty database through V2-6B
2. verify migration completion
3. run Prisma validation/client compatibility against the migrated schema where practical
4. inspect:
   - enums
   - tables
   - columns
   - indexes
   - unique constraints
   - foreign keys
   - CHECK constraints
5. verify legacy Inventory tables still exist
6. verify no demo data was inserted
7. verify no destructive drop occurred

Required checks:

- `InventoryTransaction`
- `InventoryTransactionLine`
- nullable StockMovement transaction links
- `StockAdjustment` preserved
- sourceType/sourceId preserved
- composite tenant-safe relations
- transaction-number format check
- warehouse-shape check
- reversal-shape/self-reversal checks
- idempotency-pair check
- line-number/unit/quantity checks
- movement-link pair check

# Phase 7 — Upgrade-Path Migration Rehearsal

Against Disposable Database B, or a clean recreated database:

## Step 1 — Apply pre-V2-6B schema

Use the checkpoint migration set from:

```text
inventory-demo-v2-v2.5-checkpoint
```

Preferred safe methods:

- temporary Git worktree/temporary checkout under `/tmp`, or
- temporary migration-directory copy containing only migrations through V2-5.

Do not modify or switch the main worktree.

## Step 2 — Seed synthetic legacy fixtures

Insert synthetic, non-personal fixture data for at least:

- two organizations
- Products
- Warehouses
- Users
- InventoryProductExtensions
- StockBalances
- valid StockAdjustments
- matching StockMovements

Fixtures must include:

- at least one valid positive adjustment
- at least one valid negative adjustment
- at least one zero counted-final adjustment only if current legacy rules allow it
- organization isolation
- deterministic IDs
- no real demo credentials/data

Do not use the controlled demo data.

## Step 3 — Apply only the V2-6B expand migration

Apply the current V2-6B migration to the synthetic legacy database.

Verify:

- old data remains intact
- old adjustment/movement counts unchanged
- new tables are empty
- nullable links remain null
- all constraints/indexes exist
- application compatibility queries on legacy tables still work

# Phase 8 — Constraint Execution Tests

Against the disposable migrated database, execute controlled negative tests.

Verify the database rejects:

- invalid transaction number format
- self reversal
- reversal relation shape violation
- same source/destination Transfer Warehouse
- invalid Receipt/Issue/Adjustment warehouse shape
- invalid Transfer warehouse shape
- partial idempotency hash pair
- empty unit
- nonpositive line number
- negative line quantity
- partial movement-link pair
- movement line/transaction/org mismatch
- duplicate organization transaction number
- duplicate organization idempotency key
- second reversal for one original transaction

Verify valid rows are accepted for each transaction type foundation.

Do not test posting logic; V2-6C is not implemented.

# Phase 9 — Backfill Preflight Rehearsal

Run the read-only V2-6B preflight against the synthetic upgraded database.

Required:

- valid fixtures pass
- two-organization summaries are correct
- deterministic planned transaction IDs/numbers repeat exactly
- no mutation occurs
- planned quantity uses counted final quantity
- Product unit snapshot is planned
- matching movement identified exactly once
- sanitized report

Create separate invalid-fixture scenarios and prove preflight reports, without writing:

- missing Product
- wrong-org Product
- missing Warehouse
- wrong-org Warehouse
- missing User
- inconsistent before/after/delta
- no matching movement
- duplicate matching movements
- wrong movement delta
- wrong quantity-after
- invalid/empty Product unit
- orphan movement
- deterministic collision

The preflight must exit nonzero on invalid legacy data.

# Phase 10 — Migration Rollback/Recovery Rehearsal

The actual migration is expand-only and has no automatic destructive down migration.

Document and test the recovery strategy in disposable infrastructure:

## Before application cutover

Preferred rollback:

- stop deployment
- restore database from pre-migration backup/snapshot, or
- leave additive tables/columns unused and roll application back to V2-5 code.

Because the migration is additive, V2-5 application code should continue functioning.

Verify against the upgraded disposable DB that V2-5 legacy queries remain valid after migration.

Do not create a production down migration that drops the new schema automatically.

Document exact operator steps and limits.

# Phase 11 — Full Application Regression

After dependency remediation and migration harness work, run:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run check:ux
npm run test:a11y
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm run check:all
npm run demo:check
```

`demo:check` remains read-only and must pass against the unmigrated controlled sandbox.

Do not apply the new migration there.

Verify:

- V2-1 through V2-5 behavior unchanged
- current controlled demo remains functional
- no V2-6C runtime write exists
- no new transaction route/permission/event/UI exists

# Phase 12 — Documentation

Update:

```text
docs/engineering-manual/00-meta/DEPENDENCY-AUDIT-TRIAGE-2026-07.md
docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md
docs/engineering-manual/00-meta/V2-6B-ACCEPTANCE-REPORT.md
docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6b-schema-migration-backfill.md
docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md
```

Create:

```text
docs/engineering-manual/00-meta/
  V2-6B-MIGRATION-REHEARSAL-REPORT.md
```

Required sections:

```text
# V2-6B Migration Rehearsal Report

## Status

## Dependency Remediation

## Isolated Database Source

## Safety Checks

## Fresh Database Rehearsal

## Upgrade Path Rehearsal

## Constraint Verification

## Legacy Compatibility Verification

## Backfill Preflight Rehearsal

## Invalid Legacy Scenarios

## Recovery/Rollback Rehearsal

## Findings

## Remaining Risks

## Sandbox Migration Status

## V2-6B Acceptance Status

## V2-6C Readiness
```

Allowed final status if every gate passes:

```text
Static and Disposable Migration Gates Complete
Founder Acceptance Pending
Sandbox Migration Authorization Pending
```

Do not mark sandbox migration complete.

Do not mark V2-6C authorized.

# Phase 13 — Final Runtime

After all source/dependency gates:

1. stop stale server on port 1320
2. run latest build
3. start `next start` on port 1320
4. verify:
   - `/`
   - `/login`
   - `/register`
   - unauthenticated `/api/kernel/auth/me`
5. keep the server running

No sandbox migration is required for the V2-5 runtime because the new V2-6B schema is not yet used by application code.

# Verification Commands

Under Node 24 run:

```bash
node --version
npm --version
npm ci
npm ls --all

npm run typecheck
npm run lint
npm run test:run
npm run check:ux
npm run test:a11y
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm run check:all
npm run demo:check

npx prisma validate
npx prisma generate

npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate

git diff --check
git status --short
```

Run the isolated migration-rehearsal command only after its safety checks pass.

Do not run:

```bash
prisma migrate deploy
prisma migrate dev
prisma db push
prisma migrate reset
npm run demo:reset
npm audit fix
npm audit fix --force
```

against the controlled sandbox.

# Final Report Required

Report:

1. V2-6B acceptance-gate summary.
2. Node/npm versions.
3. Initial worktree state.
4. Files inspected.
5. Files created.
6. Files modified.
7. Dependency advisories before remediation.
8. Dependency changes and overrides.
9. Dependency audits after remediation.
10. Disposable database source and safety proof.
11. Fresh-database migration result.
12. Upgrade-path migration result.
13. Constraint execution results.
14. Legacy V2-5 compatibility result.
15. Backfill-preflight rehearsal result.
16. Invalid legacy scenario results.
17. Recovery/rollback rehearsal result.
18. Tests added and updated full count.
19. Accessibility result.
20. `check:all` result.
21. `demo:check` result.
22. Prisma validate/generate result.
23. Confirmation that the controlled sandbox migration was not applied.
24. Port 1320 server status/PID.
25. Documentation/report paths.
26. Git diff/status observations.
27. Any deviations from scope.
28. Remaining dependency, migration, backfill, or compatibility risks.
29. Confirmation that no V2-6C service/API/permission/event/UI/export cutover, demo V2 data, caching, accents, website assets, new modules, or Platform Services were implemented.
30. Whether V2-6B is ready for Founder acceptance.
31. Whether sandbox migration authorization remains pending.
32. Whether V2-6C remains blocked.

Stop after this acceptance gate.

Do not apply the migration to the controlled sandbox or proceed to V2-6C without explicit Founder/operator authorization.
