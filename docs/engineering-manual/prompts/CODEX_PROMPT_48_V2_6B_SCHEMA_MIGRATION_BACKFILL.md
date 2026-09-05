# OneDayOS — Inventory Demo V2 Package V2-6B
# Schema, Migration, and Backfill Foundation

V2-6 governance is frozen.

The Founder explicitly authorizes **V2-6B only**.

V2-6C, V2-6D, V2-7, and V2-8 remain blocked.

This package may add the approved Prisma schema foundation, create the migration files, and implement guarded migration/backfill preflight tooling.

This package must **not** switch application writes to the new transaction model and must **not** apply the migration or backfill to the controlled sandbox without a later explicit operator authorization.

## Repository Baseline

Expected checkpoint:

```text
Branch: main
HEAD: 6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b
Tag: inventory-demo-v2-v2.5-checkpoint
```

Expected uncommitted items before this task:

- the approved V2-6A/V2-6 governance documentation
- authorized Prompt 46, Prompt 47, and this Prompt 48 input files under the prompts directory

Prompt files are task inputs and must remain untracked, unstaged, unmodified, and uncommitted.

No unexpected source/config/package/Prisma changes are allowed at the start.

## Primary Authority

Read and follow first:

- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6B-SCHEMA-MIGRATION-BACKFILL.md`
- `docs/engineering-manual/00-meta/V2-6-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-SCHEMA-MIGRATION-REVIEW.md`
- `docs/engineering-manual/00-meta/V2-6-TRANSACTION-SEMANTICS.md`
- `docs/engineering-manual/00-meta/V2-6-MIGRATION-BACKFILL-PLAN.md`
- `docs/engineering-manual/00-meta/V2-6-TEST-MATRIX.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- `docs/engineering-manual/17-module-specifications/09-inventory-v2-module.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0020-inventory-v2-operational-workflows.md`
- `docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`

Also obey:

- `docs/engineering-manual/06-data/00-prisma-schema-strategy.md`
- `docs/engineering-manual/06-data/01-tenancy-data-isolation.md`
- `docs/engineering-manual/06-data/02-migrations.md`
- `docs/engineering-manual/06-data/03-soft-delete-archival.md`
- `docs/engineering-manual/06-data/04-indexing-performance.md`
- `docs/engineering-manual/06-data/05-data-validation-zod.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/05-data-security.md`
- `docs/engineering-manual/14-testing-quality/05-security-testing.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/15-deployment-operations/03-database-migrations-production.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-V2-5-REPOSITORY-CHECKPOINT.md`

If these documents conflict, stop and report the exact conflict. Do not invent a resolution.

# Frozen Founder Decisions

Implement the schema foundation exactly according to the frozen documents.

At minimum the frozen design includes:

## Enums

```text
InventoryTransactionType:
RECEIPT
ISSUE
TRANSFER
ADJUSTMENT

InventoryTransactionStatus:
POSTED
REVERSED
```

No Draft, Approval, Void, or hard-delete lifecycle.

## Canonical models

```text
InventoryTransaction
InventoryTransactionLine
```

## Transaction behavior represented by the schema

- posted-only
- original transaction may become REVERSED
- reversal is a separate POSTED transaction
- reversal uses `reversalOfTransactionId`
- one original transaction may be reversed at most once
- a reversal transaction may not be reversed
- immutable posted history
- server-generated transaction number
- optional reference number/date
- Product unit snapshot on each line
- nullable idempotency hashes for legacy backfill only
- canonical StockMovement transaction/line linkage
- legacy compatibility fields retained during expand-contract migration

## Warehouse fields

Receipt, Issue, and Adjustment:

```text
warehouseId required
sourceWarehouseId absent
destinationWarehouseId absent
```

Transfer:

```text
warehouseId absent
sourceWarehouseId required
destinationWarehouseId required
source != destination
```

## Line quantity

- Receipt: positive received quantity
- Issue: positive issued quantity
- Transfer: positive transferred quantity
- Adjustment: counted final quantity, zero allowed
- Adjustment delta remains server-computed later in V2-6C

## Movement vocabulary supported by the migration foundation

Preserve:

```text
opening_balance
adjustment_in
adjustment_out
```

Prepare compatibility for:

```text
receipt_in
issue_out
transfer_out
transfer_in
reversal_in
reversal_out
```

Do not cut application writes over in V2-6B.

# Absolute Scope

## Allowed

- create a documentation checkpoint for the frozen V2-6 governance
- modify `prisma/schema.prisma`
- create one expand-contract migration folder and SQL
- add approved enums, models, relations, indexes, and constraints
- add nullable canonical linkage fields to `StockMovement`
- preserve all legacy Inventory models and fields
- create read-only backfill preflight tooling
- create guarded, non-executed backfill planning code if the frozen handoff requires it
- add schema/migration/backfill tests
- add package scripts for read-only preflight only
- update `check:architecture` / `check:prisma` with stable migration-foundation checks
- create V2-6B implementation and acceptance reports
- update V2-6 readiness/conformance documents truthfully
- generate Prisma client
- generate migration SQL without applying it
- run read-only migration status/preflight commands where explicitly safe

## Forbidden

Do not:

- apply the migration to the sandbox
- run `prisma migrate deploy`
- run `prisma migrate dev` against the configured sandbox
- run `prisma db push`
- run `prisma migrate reset`
- execute the backfill
- mutate any database
- run `demo:reset`
- change demo data
- switch reads or writes to InventoryTransaction
- implement posting/reversal services
- implement idempotency runtime behavior
- implement serializable retries
- add APIs
- add permissions
- add events
- change Inventory UI/navigation
- update Dashboard/Process Flow to Current transactions
- change exports
- install dependencies
- change package versions
- implement caching or accent presets
- resume website asset production
- add modules or Platform Services
- run `npm audit fix`
- run `npm audit fix --force`

# Supported Runtime

Use:

```text
Node >=24 <25
```

Run:

```bash
node --version
npm --version
```

If Node 24 is not active, stop before touching Prisma or package scripts.

# Phase 0 — Create a Governance Checkpoint

Before schema work, verify the only uncommitted non-prompt changes are the approved V2-6A/V2-6 governance documents.

Run:

```bash
git status --short
git diff --name-status
git ls-files --others --exclude-standard
```

Classify every path.

Do not stage prompt files.

Do not stage `.env.local`, runtime files, logs, screenshots, build output, or unrelated files.

Run a safe staged-secret scan.

If the governance files are the only intended changes and Git identity exists, create:

```text
Commit message:
docs: freeze Inventory V2-6 governance
```

Create an annotated local tag:

```text
inventory-demo-v2-v2.6-governance
```

Tag message:

```text
Frozen Inventory V2-6 schema, lifecycle, migration, and staged package decisions
```

Do not push.

If Git identity is missing or an ambiguous file exists, stop before schema changes.

Verify the new governance checkpoint and a clean source worktree except authorized prompt files.

# Phase 1 — Capture the Pre-Change Prisma Baseline

Before editing the schema:

1. copy the current schema to a temporary path outside the repository
2. record current migration folders
3. run:

```bash
npm run check:prisma
npx prisma validate
npx prisma generate
```

4. record current schema checksum or hash
5. inspect the current generated SQL conventions

Do not connect to or alter the sandbox database.

# Phase 2 — Implement the Frozen Prisma Schema

Use the exact frozen field names/types/relations from the authority documents.

Do not substitute a personal redesign.

## `InventoryTransaction`

Implement the frozen fields, including the approved equivalents of:

```text
id
orgId
type
status
transactionNumber
referenceNumber?
referenceDate?
supplierId?
customerId?
warehouseId?
sourceWarehouseId?
destinationWarehouseId?
reason?
notes?
postedAt
postedByUserId
reversalOfTransactionId?
idempotencyKeyHash?
requestHash?
createdAt
updatedAt
```

Do not add redundant `voidedAt`, `voidedBy`, or `voidReason` fields.

Do not add Draft/Approval fields.

If the frozen schema uses a narrowly justified `reversedAt`, implement it only with the documented atomic consistency contract. Otherwise derive reversal evidence from the reversal transaction.

## `InventoryTransactionLine`

Implement the frozen fields, including the approved equivalents of:

```text
id
orgId
transactionId
productId
quantity
unit
lineNumber
notes?
createdAt
updatedAt
```

`unit` is required for every newly created line.

Legacy backfill must populate it from the Product unit after validation.

## Relations

Implement tenant-safe relations to:

- Organization
- Supplier
- Customer
- generic Warehouse
- source Warehouse
- destination Warehouse
- Product
- posting User
- reversal transaction
- transaction lines
- StockMovement

Use explicit relation names where Prisma requires them.

All tenant-scoped relations must preserve organization integrity.

Do not rely only on application logic where a safe composite foreign key can enforce the same organization.

# Phase 3 — Canonical StockMovement Linkage

Add nullable compatibility fields according to the frozen schema:

```text
inventoryTransactionId?
inventoryTransactionLineId?
```

Preserve current:

- `sourceType`
- `sourceId`
- existing movement fields
- existing demo/current application behavior

The new relation must prove that:

```text
movement.orgId
movement.inventoryTransactionId
movement.inventoryTransactionLineId
```

reference a line from the same organization and the same transaction.

Use composite unique/relation keys if required by Prisma/PostgreSQL.

Backfilled legacy movements will later receive exactly one canonical linkage.

Do not remove or rename legacy compatibility fields in V2-6B.

# Phase 4 — Indexes, Unique Constraints, and Database Checks

Implement the frozen index/constraint design.

At minimum verify the reviewed need for:

## Transaction

- organization + transaction number uniqueness
- organization + idempotency key hash uniqueness
- organization/type/status/date query index
- organization/warehouse fields
- organization/Supplier
- organization/Customer
- reversal relation uniqueness
- posting date/order query support

## Line

- transaction + line number uniqueness
- organization/Product query support
- composite identity required by movement linkage

## Movement

- canonical transaction query indexes
- canonical line query indexes
- existing ledger indexes retained

## Database CHECK constraints

Use migration-level SQL where Prisma schema cannot express the invariant.

At minimum evaluate and implement frozen checks for:

- source Warehouse differs from destination Warehouse
- self-reversal is impossible
- warehouse-field shape where safely expressible
- transaction-number nonempty
- nonempty snapshotted unit
- line number positive
- quantity nonnegative at the database level only if compatible with all transaction meanings

Type-specific cross-table quantity rules remain service/Zod rules when the line table cannot safely inspect transaction type.

Do not write a CHECK that conflicts with Adjustment counted-final quantity zero.

Every manually added SQL constraint requires a migration contract test.

# Phase 5 — Generate One Expand-Contract Migration

Create one migration folder using the repository timestamp/naming convention, for example:

```text
prisma/migrations/<timestamp>_inventory_v2_transaction_foundation/
  migration.sql
```

Use the current Prisma 7.9 CLI syntax confirmed through:

```bash
npx prisma migrate diff --help
```

Generate the base migration from the temporary pre-change schema to the new schema without using a live database.

Then carefully add any frozen manual SQL:

- CHECK constraints
- comments if useful
- compatibility-safe constraint ordering
- indexes not emitted by Prisma, if approved

Do not include:

- destructive drops
- legacy model removal
- non-null StockMovement links
- application cutover
- data backfill writes in the schema migration unless the frozen plan explicitly requires them
- sandbox-specific data
- demo-specific rows

The migration must be expand-only and safe before V2-6C.

# Phase 6 — Migration SQL Safety Audit

Statically verify:

- no DROP TABLE
- no DROP COLUMN
- no destructive enum rewrite
- no legacy StockAdjustment deletion
- no legacy StockMovement field deletion
- no update/delete of current data
- new nullable linkage columns
- new tables/enums/indexes/FKs/checks
- constraint names are deterministic
- FK actions match the frozen review
- no cross-tenant cascade
- no unsupported extension requirement
- no database-specific random function required for application IDs
- migration can run before application cutover

Create focused migration SQL tests.

# Phase 7 — Read-Only Legacy Backfill Preflight

Create a read-only preflight tool according to the frozen plan.

Preferred conceptual path:

```text
scripts/inventory-v2/
  backfill-preflight.ts
  backfill-types.ts
  backfill-validation.ts
  backfill-id.ts
  __tests__/
```

Use the repository’s actual script conventions.

## Preflight responsibilities

For every legacy `StockAdjustment`, validate:

- organization exists
- Product exists in same organization
- Warehouse exists in same organization
- posting User exists in the expected organization/context
- status is compatible with posted history
- quantityBefore/quantityAfter/quantityDelta reconcile
- counted final quantity is nonnegative
- exactly one compatible legacy StockMovement can be identified
- movement organization/Product/Warehouse match
- movement quantity change equals adjustment delta
- movement quantity-after matches adjustment quantity-after where present
- movement source reference is consistent
- Product unit exists and is valid for snapshot
- no duplicate planned transaction mapping
- no cross-tenant relation
- no ambiguous movement match
- no orphan movement in the backfill scope

The preflight must produce:

```text
validCount
invalidCount
warningCount
per-organization summary
sanitized issue list
deterministic planned mappings
```

Do not print personal data, secrets, full records, or database URLs.

## Deterministic backfill identities

Follow the frozen plan.

The mapping must be idempotent and deterministic without requiring a database extension.

Do not use random IDs in a dry-run plan that would change on every execution.

Do not collide with application-generated IDs.

Document the exact deterministic strategy and tests.

## Execution boundary

V2-6B must not execute writes.

If an executable backfill command is scaffolded for V2-6C/D, it must:

- default to dry-run
- refuse execute mode without a future explicit approval flag
- clearly state that execution is blocked in V2-6B
- contain no active execution path enabled by current environment

Prefer a preflight-only script in V2-6B.

# Phase 8 — Read-Only Preflight Package Script

Add a package script only if approved by the frozen handoff, for example:

```text
inventory:v2:backfill:preflight
```

Requirements:

- read-only
- no migration
- no inserts/updates/deletes
- no implicit `demo:reset`
- safe output
- nonzero exit when invalid legacy data exists
- does not require new tables to be present
- can inspect the current V2-5 schema/database before migration

Do not add an `execute` package script in V2-6B.

# Phase 9 — Schema and Migration Tests

Add meaningful tests.

## Prisma shape tests

Verify:

- enums and exact values
- models exist
- approved fields exist
- prohibited Draft/Void fields absent
- Product unit snapshot required
- idempotency fields nullable for legacy only
- transaction number uniqueness
- reversal uniqueness
- organization fields on every tenant table
- Supplier/Customer/Warehouse relations
- movement canonical linkage
- legacy fields preserved

## Migration SQL tests

Verify:

- expand-only
- no destructive statements
- tables/enums/columns created
- indexes/unique constraints
- composite FKs
- CHECK constraints
- no current data mutation
- no migration execution
- no unsupported extension
- no demo data

## Preflight tests

Use fixtures for:

- valid adjustment/movement
- multiple organizations
- missing Product
- wrong-org Product
- missing Warehouse
- wrong-org Warehouse
- missing User
- inconsistent before/after/delta
- missing movement
- duplicate movement
- wrong movement delta
- wrong quantity-after
- invalid Product unit
- duplicate deterministic mapping
- orphan movement
- deterministic repeat output
- sanitized errors
- no mutation methods called

## Compatibility tests

Verify current V2-5:

- StockAdjustment model remains
- current services/APIs/routes compile unchanged
- current dashboard/export/detail behavior still compiles
- no InventoryTransaction runtime write is introduced
- no permission/event/UI cutover

# Phase 10 — Architecture and Quality Gates

Extend stable checks where needed:

- V2 transaction schema exists
- migration is expand-only
- legacy models/fields remain
- no V2-6C service/API/write cutover exists
- no new transaction permissions/events/routes yet
- no demo V2 data yet
- no migration applied marker/report
- preflight is read-only
- prompt files remain untracked

Do not add brittle generated-client string checks.

# Phase 11 — Optional Disposable Migration Rehearsal

Do not use the configured sandbox database.

If and only if a clearly isolated disposable PostgreSQL test database is already available through a dedicated non-production migration-test variable:

```text
ONEDAYOS_MIGRATION_TEST_DATABASE_URL
```

you may:

1. create the pre-V2-6B schema
2. apply the new migration
3. verify constraints/tables
4. destroy the disposable database afterward

If no dedicated isolated database is configured:

- do not substitute `DATABASE_URL` or `DIRECT_URL`
- do not use the sandbox
- record executable migration rehearsal as pending
- rely on schema validation, migration diff, and static SQL contract tests

Do not add a real credential to `.env.example`; a placeholder variable name may be documented if required.

# Phase 12 — Documentation

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-6b-schema-migration-backfill.md
```

Include:

- governance checkpoint commit/tag
- schema changes
- migration name
- enum/model fields
- relation/constraint design
- manual migration SQL
- preflight architecture
- deterministic mapping
- test evidence
- migration rehearsal status
- explicit no-apply/no-backfill boundary
- rollback
- V2-6C remains blocked

Create:

```text
docs/engineering-manual/00-meta/
  V2-6B-ACCEPTANCE-REPORT.md
```

Use status:

```text
Code and Static Migration Gates Complete
Founder Acceptance and Sandbox Migration Authorization Pending
```

Required sections:

- repository checkpoint
- Prisma schema
- migration
- constraints
- StockMovement linkage
- legacy compatibility
- backfill preflight
- tests
- migration rehearsal
- findings
- blockers
- Founder/operator approvals still required
- V2-6C readiness

Update narrowly:

```text
docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md
docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md
```

Do not mark V2-6C ready automatically.

# Phase 13 — Verification

Under Node 24 run:

```bash
node --version
npm --version
npm ci

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

If the read-only preflight script is implemented and current sandbox safety gates permit read-only inspection, run:

```bash
npm run inventory:v2:backfill:preflight
```

Do not run it if it mutates or if its read-only property cannot be proven.

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

Keep the existing verified production server behavior intact. A restart is not required unless schema generation/build validation requires it; do not claim the pending migration is applied.

# Final Report Required

Report:

1. V2-6B summary.
2. Node/npm versions.
3. Initial repository/worktree verification.
4. Governance checkpoint commit and tag.
5. Files inspected.
6. Files created.
7. Files modified.
8. Exact new enums.
9. Exact InventoryTransaction fields/relations.
10. Exact InventoryTransactionLine fields/relations.
11. StockMovement canonical-linkage design.
12. Indexes and unique constraints.
13. Database CHECK constraints.
14. Migration folder/path.
15. Confirmation the migration is expand-only.
16. Confirmation no migration was applied.
17. Backfill preflight architecture.
18. Deterministic mapping strategy.
19. Preflight findings/result if run.
20. Migration rehearsal status.
21. Tests added and updated full count.
22. Accessibility result.
23. `check:all` result.
24. `demo:check` result.
25. Prisma validate/generate result.
26. Dependency audit result.
27. Git diff/status observations.
28. Any deviations from frozen V2-6B scope.
29. Remaining migration, backfill, schema, or compatibility risks.
30. Confirmation that no posting/reversal service, API, permission, event, UI, export cutover, demo V2 data, caching, accent, website asset, new module, or Platform Service was implemented.
31. Whether V2-6B is complete.
32. Whether Founder acceptance is pending.
33. Whether sandbox migration/backfill authorization is pending.
34. Whether V2-6C remains blocked.

Stop after V2-6B.

Do not apply the migration, execute the backfill, or proceed to V2-6C without explicit Founder/operator authorization.
