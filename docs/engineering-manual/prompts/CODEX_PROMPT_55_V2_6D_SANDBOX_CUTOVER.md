# OneDayOS — Inventory Demo V2 Package V2-6D
# Controlled Sandbox Migration, Backfill, UI, Demo Cutover, and Acceptance

V2-6C Posting Engine, APIs, Permissions, Events, and Compatibility Reads is Founder Accepted and safely checkpointed.

Repository checkpoints:

```text
V2-5:
6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b
inventory-demo-v2-v2.5-checkpoint

V2-6 governance:
7acee4f8800bec6d9230ec5fde0d138e20195d54
inventory-demo-v2-v2.6-governance

V2-6B:
b439afd12266a03766699f7fdc08f2178a480aba
inventory-demo-v2-v2.6b-foundation

V2-6C:
671824095bbd3925bd7e59fa8308eeed6841e188
inventory-demo-v2-v2.6c-posting-engine
```

The Founder explicitly authorizes **V2-6D only**, including the controlled-sandbox operator actions defined below.

V2-7, V2-8, website asset production, public self-service demo approval, and production readiness remain blocked.

## V2-6D Goal

Complete the Inventory V2 cutover in one guarded, reversible sequence:

1. implement V2 transaction UI and navigation behind the disabled runtime gate,
2. implement V2 transaction export integration,
3. update Dashboard and Process Flow semantics,
4. update guarded demo provisioning/reset/check logic,
5. fully rehearse the complete cutover in disposable PostgreSQL,
6. create and verify a controlled-sandbox backup,
7. apply the accepted expand-only migration to the controlled sandbox,
8. execute the deterministic legacy backfill,
9. provision the approved V2 permissions,
10. create canonical V2 demo data,
11. enable the Inventory V2 runtime,
12. build and start the latest production server,
13. complete authenticated acceptance review,
14. leave legacy `StockAdjustment` compatibility structures intact.

This package is the controlled demo cutover, not a production deployment.

## Required Operator Flags

Before any controlled-sandbox mutation, `.env.local` must contain:

```text
ONEDAYOS_SANDBOX_DB_APPROVED=true
ONEDAYOS_INVENTORY_V2_MIGRATION_APPROVED=true
ONEDAYOS_INVENTORY_V2_BACKFILL_APPROVED=true
ONEDAYOS_INVENTORY_V2_CUTOVER_APPROVED=true
ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED=false
```

The Founder/operator must add the three V2 approval flags privately before running this prompt.

Do not print `.env.local`.

Do not commit `.env.local`.

The runtime flag must remain `false` until migration, backfill, permission provisioning, canonical demo-data creation, and post-cutover database verification all pass.

After all cutover gates pass, Codex is authorized to change only:

```text
ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED=false
```

to:

```text
ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED=true
```

inside `.env.local`.

No other `.env.local` value may be modified.

The edit must be non-echoing, preserve file permissions, remain Git-ignored, and be verified by status only.

If the approval flags are missing or false, stop before any sandbox mutation and report variable names only.

## Primary Authority

Read and follow first:

- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6D-UI-DEMO-CUTOVER.md`
- `docs/engineering-manual/00-meta/V2-6-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-TRANSACTION-SEMANTICS.md`
- `docs/engineering-manual/00-meta/V2-6-SCHEMA-MIGRATION-REVIEW.md`
- `docs/engineering-manual/00-meta/V2-6-MIGRATION-BACKFILL-PLAN.md`
- `docs/engineering-manual/00-meta/V2-6-TEST-MATRIX.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- `docs/engineering-manual/17-module-specifications/09-inventory-v2-module.md`
- `docs/engineering-manual/00-meta/V2-6B-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6C-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6b-schema-migration-backfill.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6c-posting-api-compatibility.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-V2-6C-REPOSITORY-CHECKPOINT.md`

Also obey:

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/03-design-system/15-compact-operational-page-header.md`
- `docs/engineering-manual/03-design-system/16-data-table-v2.md`
- `docs/engineering-manual/03-design-system/17-modal-interaction-standard.md`
- `docs/engineering-manual/08-module-system/04-module-permissions.md`
- `docs/engineering-manual/08-module-system/06-module-events.md`
- `docs/engineering-manual/08-module-system/09-module-testing.md`
- `docs/engineering-manual/04-kernel/04-authorization-enforcement.md`
- `docs/engineering-manual/04-kernel/08-kernel-api-contracts.md`
- `docs/engineering-manual/05-sdk/02-sdk-db-access.md`
- `docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md`
- `docs/engineering-manual/06-data/01-tenancy-data-isolation.md`
- `docs/engineering-manual/06-data/04-migrations-seeding.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/04-api-security.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/15-deployment-operations/03-database-migrations-production.md`
- `docs/demo/CONTROLLED-DEMO-RUNBOOK.md`
- `docs/demo/DEMO-RUNTIME-VALIDATION-REPORT.md`

If these documents conflict, stop and report the exact conflict.

## Supported Security Policy

Required:

```text
Production dependency audit: clean.
Development audit: only the accepted, unexpired lint-tooling exception.
```

Run:

```bash
npm run check:audit-policy
npm audit --omit=dev --audit-level=moderate
```

The raw full audit may remain nonzero only for the exact accepted exception.

Do not call the raw full audit clean.

## Absolute Scope

### Allowed

- implement V2 transaction list/detail/create/reverse UI
- add V2 Inventory navigation
- reuse V2-3 URL-addressable modal architecture
- reuse V2-2 Data Table V2
- add V2 transaction export integration using V2-5 infrastructure
- cut adjustment reads/writes to canonical V2 transactions
- preserve legacy adjustment compatibility URLs and data
- update Dashboard movement semantics
- update Process Flow nodes from Planned to Current after successful cutover
- update guarded demo provision/reset/check logic
- add Secondary Warehouse and Demo Customer
- provision approved V2 Warehouse Operator permissions
- add guarded migration/backfill/cutover scripts
- create a verified local database backup of the controlled sandbox
- apply the accepted migration to the controlled sandbox
- execute the deterministic backfill
- enable the V2 runtime after all gates pass
- run guarded controlled-demo reset/provisioning
- update documentation and conformance
- create V2-6D acceptance and cutover reports
- make narrowly required V2-6D compatibility fixes

### Forbidden

Do not:

- remove `StockAdjustment`
- drop legacy fields
- create a cleanup migration
- change the accepted V2-6B schema or migration unless a proven cutover defect requires stopping for Founder review
- implement Durable Outbox
- implement caching
- implement curated accents
- resume website asset production
- add Purchase Orders
- add Sales Orders
- add accounting or valuation
- add approvals
- add notifications
- add lots/serials
- add attachments
- add background jobs
- add new modules
- add Platform Services, Dynamic Systems, runtime AI, or FastAPI
- run `npm audit fix`
- run `npm audit fix --force`
- push commits/tags
- stage or commit prompt inputs

## Repository Safety

Before work:

1. Run `git status --short`.
2. Verify `HEAD` and all expected checkpoint tags.
3. Only authorized prompt inputs may be untracked.
4. Stop on any unexpected source/config/package/Prisma change.
5. Do not reset, restore, delete, or overwrite unrelated work.
6. Do not create a commit or tag in this implementation task.
7. Use Node 24.
8. Keep the final server on port `1320`.

# Phase 1 — Inspect Current V2-6D Surface

Before coding, report:

1. current V2-6C transaction DTOs/query services/APIs
2. current modal/presenter/form architecture
3. current Inventory navigation
4. current legacy Adjustment routes and exports
5. current Dashboard movement mapping
6. current Process Flow current/planned definition
7. current demo provision/reset/check logic
8. current permissions and demo-role declarations
9. current migration/backfill scripts
10. exact files planned for creation/modification
11. any mismatch with the frozen V2-6D handoff

Stop on mismatch.

# Phase 2 — Implement UI Behind the Disabled Runtime Gate

Complete all V2-6D source changes while:

```text
ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED=false
```

No controlled-sandbox V2 query may occur yet.

## Inventory sidebar

Implement:

```text
Dashboard
Process Flow
Stock Levels

Transactions
  Receipts
  Issues
  Transfers
  Adjustments

Movement Ledger

Related Records
  Products
  Categories
  Suppliers
  Customers
  Warehouses
```

Requirements:

- transaction navigation appears only when runtime V2 is enabled
- current V2-5 navigation remains while disabled
- no dead links
- permission-aware entries
- Movement Ledger uses current StockMovement data
- Product Settings remains contextual
- Shared Records context remains correct

## Transaction lists

Use Data Table V2 server mode for:

- Receipts
- Issues
- Transfers
- Adjustments

Required:

- search
- strict allowlisted filters
- sorting
- pagination
- row selection
- column visibility
- permission-aware row interaction
- direct full-page fallback
- V2-3 modal interception
- current `POSTED` / `REVERSED` status
- reverse action only with type-specific permission
- no edit after posting

## Create forms/modals

Implement type-specific forms:

### Receipt

- optional Supplier
- destination Warehouse
- reference number/date
- reason/notes where frozen
- 1–100 Product lines
- positive quantities

### Issue

- optional Customer
- source Warehouse
- 1–100 Product lines
- positive quantities

### Transfer

- source Warehouse
- destination Warehouse
- source != destination
- 1–100 Product lines
- positive quantities

### Adjustment

- Warehouse
- reason
- 1–100 Product lines
- counted final quantities
- no client delta/before/after fields

Requirements:

- URL-addressable modal + full-page fallback
- strict client/server validation
- accessible dynamic line editor
- add/remove line controls
- duplicate Product behavior follows frozen contract
- pending state
- user-safe errors
- no duplicate submit
- unique Idempotency-Key per user submission
- retry uses the same key
- new user action generates a new key
- no raw key shown/logged/persisted beyond the in-flight form state
- success closes modal and refreshes underlying table
- no stale Stock Levels/Movements

## Detail/reverse modals

- posted details are read-only
- show transaction number/type/status/reference/date
- show Supplier/Customer/Warehouses as applicable
- show lines, units, quantities
- show posting actor/time
- show reversal linkage
- reverse action requires permission
- reverse confirmation requires reason
- no destructive “Delete”
- direct full-page fallback

# Phase 3 — Export Integration

Use V2-5 bounded server-side export.

Add transaction export support under:

```text
inventory.transaction.export
```

Eligible lists:

- Receipts
- Issues
- Transfers
- Adjustments

Requirements:

- CSV/XLSX
- selected rows
- all filtered rows
- exact type-scoped query reuse
- no internal IDs/hashes/orgId
- Supplier/Customer/Warehouse labels
- status
- transaction number
- reference date/number
- posted/reversed context
- row limits unchanged
- Warehouse Operator has no export control
- Org Admin wildcard may export

Legacy Stock Adjustment export remains available through compatibility behavior during the cutover.

Do not remove existing V2-5 routes until a later cleanup package.

# Phase 4 — Dashboard Cutover

Update movement mapping:

```text
receipt_in     → inbound
issue_out      → outbound
adjustment_in  → inbound
adjustment_out → outbound
reversal_in    → inbound
reversal_out   → outbound
transfer_in/out excluded from organization-wide inbound/outbound totals
opening_balance remains separately documented
```

Requirements:

- no double-counting transfer
- exact 30-day UTC contract
- current stock-health semantics unchanged
- no partial/capped analytics
- runtime flag false keeps current V2-5 behavior
- runtime true uses canonical V2 semantics
- no caching

# Phase 5 — Process Flow Cutover

Before runtime enablement:

- Receipts/Issues/Transfers remain Planned.

After migration, backfill, V2 permission provisioning, canonical V2 demo data, runtime enablement, and acceptance checks:

Move to Current:

```text
Receipt
Issue
Transfer
Adjustment
Transactional Posting
Stock Balance
Movement Ledger
Low-Stock Detection
```

Requirements:

- canonical definition remains source of truth
- Shared Records remain inputs
- Supplier/Customer/Warehouse ownership remains shared
- no Purchasing/Sales/Notification claims
- semantic fallback updated
- arrows/connectors remain accessible
- no workflow engine

Do not mark them Current merely because source code exists. The final runtime/cutover verification must pass first.

# Phase 6 — Demo Provisioning and Reset V2

Update the guarded controlled-demo tooling.

## Canonical shared records

Ensure:

- Main Warehouse
- Secondary Warehouse
- Demo Supplier
- Demo Customer
- three canonical Products
- Inventory tracking settings

## Legacy baseline

The existing nine valid legacy adjustments remain historical and are backfilled into canonical V2 transactions.

Their movements are linked, not duplicated.

## Canonical new V2 demo transactions

Create exactly one canonical transaction of each type using fixed demo reference numbers and stable idempotency inputs:

```text
DEMO-REC-001
DEMO-TRF-001
DEMO-ISS-001
DEMO-ADJ-001
```

Starting post-legacy balances:

```text
Main:
Water 120
Tea 35
Coffee 8

Secondary:
Water 0
Tea 0
Coffee 0
```

### Receipt from Demo Supplier into Main

```text
Water +20
Tea +10
Coffee +5
```

Intermediate Main:

```text
Water 140
Tea 45
Coffee 13
```

### Transfer Main → Secondary

```text
Water 10
Tea 5
Coffee 3
```

Intermediate:

```text
Main:
Water 130
Tea 40
Coffee 10

Secondary:
Water 10
Tea 5
Coffee 3
```

### Issue from Main with Demo Customer reference

```text
Water 5
Tea 2
```

Intermediate Main:

```text
Water 125
Tea 38
Coffee 10
```

### Adjustment counted final quantities at Main

```text
Water 120
Tea 35
Coffee 5
```

Final:

```text
Product     Main   Secondary   Organization total
Water       120    10          130
Tea         35     5           40
Coffee      5      3           8
```

Coffee remains Low Stock against reorder point 10.

## Recent dates

Use real persisted transaction/movement dates distributed across the recent 30-day UTC Dashboard window.

Do not backdate `postedAt` through APIs.

The guarded demo script may create deterministic recent demo records through the approved sandbox-only mechanism documented in the implementation note, but must not weaken production posting semantics.

## Reset scope

The guarded reset must:

- operate only on the configured demo organization
- preserve Organization, Subscription, Auth users, Prisma Users, roles, and module enablement
- preserve backfilled legacy canonical transactions
- remove non-legacy V2 demo/manual transaction data safely
- remove linked new movements/lines in the correct order
- restore the post-legacy baseline
- recreate the four canonical V2 demo transactions through the real posting engine where practical
- preserve deterministic/idempotent results
- verify final balances and counts
- never affect another organization

No public reset control.

# Phase 7 — Permission Provisioning

Idempotently provision the approved Warehouse Operator additions:

```text
inventory.receipt.read
inventory.receipt.create
inventory.issue.read
inventory.issue.create
inventory.transfer.read
inventory.transfer.create
inventory.adjustment.read
inventory.adjustment.create
objects.customer.read
```

Preserve:

- existing Product/Category/Supplier/Warehouse read
- current stock-level/movement read
- current adjustment create where compatibility requires it

Do not grant:

- any reverse permission
- `inventory.transaction.export`
- Product Settings update
- shared-record mutation
- Organization admin
- wildcard/admin

Org Admin wildcard remains unchanged.

Update `demo:check` to verify the exact final profile only after cutover.

# Phase 8 — Compatibility and Cutover Reads

After runtime enablement:

- new Adjustment writes use InventoryTransaction only
- legacy StockAdjustment rows remain read-only
- canonical Adjustment list/detail includes:
  - backfilled legacy adjustments
  - new V2 adjustments
- no duplicate rows
- legacy URLs continue to resolve
- legacy export remains compatible
- Stock Movement ledger includes linked legacy and new V2 movements
- V2-5 Stock Levels remains authoritative from `StockBalance`

Do not dual-write new V2 Adjustments into `StockAdjustment` unless the frozen handoff explicitly requires it.

Do not remove legacy routes/models/fields.

# Phase 9 — Tests Before Sandbox Mutation

Add and pass:

## UI

- navigation flag false/true
- permission visibility
- all four list pages
- create forms
- 0/1/100/101 line behavior
- modal/full-page fallback
- dynamic line accessibility
- idempotency-key lifecycle
- detail/reverse
- Warehouse read/create without reverse/export
- Light/Dark/System/mobile

## Exports

- type-scoped CSV/XLSX
- selected/filtered
- no internal fields
- permission denial
- legacy compatibility

## Dashboard/Process Flow

- V2 mapping
- transfer excluded
- reversal direction
- Planned before cutover
- Current after verified cutover flag/state

## Demo tooling

- exact transaction sequence
- exact movement counts
- exact final balances
- reset idempotency
- no other organization affected
- role permissions exact
- legacy transactions preserved

## Compatibility

- legacy Adjustment URLs
- no duplicate canonical/legacy row
- no legacy write after cutover
- runtime false retains V2-5 behavior

# Phase 10 — Full Disposable V2-6D Rehearsal

Before touching the sandbox, reuse isolated Docker/PostgreSQL.

Rehearse the entire sequence:

1. apply all migrations,
2. seed synthetic V2-5 legacy data,
3. run preflight,
4. execute backfill,
5. enable V2 runtime in isolated process,
6. provision approved permissions,
7. create canonical V2 demo data,
8. run all API/service/UI-contract tests,
9. run reset twice,
10. verify exact balances/counts,
11. verify legacy compatibility,
12. verify rollback by disabling runtime,
13. destroy container.

Required evidence:

- no duplicate backfill
- no duplicate canonical demo transactions
- no partial cutover
- runtime false still supports V2-5 behavior
- runtime true supports V2 transactions
- two organizations isolated
- all constraints hold

If this rehearsal fails, do not touch the sandbox.

# Phase 11 — Controlled Sandbox Preflight

Before mutation:

1. stop the current server,
2. verify approval flags,
3. verify `.env.local` is ignored,
4. run `demo:check`,
5. run V2 backfill preflight,
6. verify expected legacy result:

```text
validCount = 9
invalidCount = 0
warningCount = 0
organizationCount = 1
```

7. verify current migration status,
8. verify V2 runtime remains false,
9. verify no V2 tables are already partially applied unless expected,
10. verify production dependency audit clean,
11. verify dev audit policy passes,
12. verify no pending unrelated migration.

Stop on any mismatch.

# Phase 12 — Controlled Sandbox Backup

Create a verified local PostgreSQL backup before mutation.

Preferred:

```text
pg_dump custom format
```

Requirements:

- use the approved direct/session database URL without printing it
- output under `/tmp`
- timestamped safe filename
- restrictive file permissions
- no committed backup
- verify with `pg_restore --list`
- compute SHA-256
- record path/checksum in cutover report
- do not print credentials
- keep backup until Founder accepts V2-6D
- document manual restore command without executing it

If `pg_dump` is unavailable or backup verification fails, stop before migration.

# Phase 13 — Apply the Accepted Migration

Only after all preceding gates pass:

```bash
npx prisma migrate deploy
```

using the controlled sandbox migration/session URL.

Requirements:

- no `migrate dev`
- no `db push`
- no reset
- verify `_prisma_migrations`
- verify new tables/constraints
- verify legacy tables/rows unchanged
- runtime remains false
- V2-5 application may be restarted if needed and must still work

If migration fails:

- keep runtime false
- do not execute backfill
- preserve backup
- report sanitized failure
- do not continue

# Phase 14 — Execute Deterministic Backfill

Create/use an explicit guarded execution command such as:

```text
inventory:v2:backfill:execute
```

It must require:

```text
ONEDAYOS_INVENTORY_V2_BACKFILL_APPROVED=true
```

Requirements:

- preflight repeats immediately
- idempotent
- deterministic IDs/numbers
- transactionally safe
- organization-scoped
- no silent repair
- stop on invalid/ambiguous data
- link each legacy movement exactly once
- populate snapshotted unit
- new canonical transactions/lines created
- no duplicate StockMovement
- legacy rows remain
- rerun produces zero new writes
- safe sanitized report

Expected controlled demo result:

```text
9 legacy adjustments backfilled
9 canonical Adjustment transactions
9 transaction lines
9 existing movements linked
0 invalid
0 warnings
```

If backfill fails:

- keep runtime false
- do not provision/cut over
- preserve backup
- stop and report

# Phase 15 — Provision Permissions and Canonical V2 Demo Data

After migration/backfill verification:

1. run guarded V2 permission provisioning,
2. create/repair Secondary Warehouse,
3. create/repair Demo Customer,
4. create the four canonical V2 transactions,
5. verify all balances/movements/links,
6. run guarded reset twice and verify idempotency,
7. run updated `demo:check`.

Runtime may remain false while provisioning uses explicit server-side V2 engine/test entry points in a controlled script.

Do not expose V2 UI yet.

# Phase 16 — Enable Runtime and Start Latest Build

Only after all database, backfill, permission, and demo-data gates pass:

1. safely change only:

```text
ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED=false
```

to:

```text
ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED=true
```

2. verify `.env.local` remains ignored,
3. run:

```bash
npm run build
npm run start
```

4. keep the latest `next start` server on port 1320,
5. verify the V2 API no longer returns runtime-disabled 404,
6. verify registration remains disabled,
7. verify `demo:check` passes in V2 mode.

If startup or V2 readiness fails:

- return the runtime flag to false,
- rebuild/restart V2-5 mode,
- preserve backup,
- stop and report.

# Phase 17 — Authenticated Cutover Review

Review Org Admin and Warehouse Operator.

## Org Admin

Verify:

- Inventory sidebar shows new transaction structure
- Receipt list/create/detail/reverse
- Issue list/create/detail/reverse
- Transfer list/create/detail/reverse
- Adjustment list/create/detail/reverse
- Movement Ledger
- Stock Levels
- export CSV/XLSX
- Dashboard V2 mappings
- Process Flow Current nodes
- legacy Adjustment compatibility
- Light/Dark/System
- mobile modal behavior

## Warehouse Operator

Verify:

- Receipt read/create
- Issue read/create
- Transfer read/create
- Adjustment read/create
- Customer read
- no reverse
- no transaction export
- no Product/Customer/Supplier/Warehouse mutation
- Organization denied
- Inventory Tracking Settings update denied

## Safety scenarios

Verify:

- insufficient Issue fails
- insufficient Transfer fails
- same Warehouse Transfer fails
- 101 lines rejected
- idempotent replay does not duplicate
- same key/different request conflicts
- reverse permissions denied to Warehouse
- direct unauthorized API denied
- no cross-tenant access

# Phase 18 — Screenshots and Manual Evidence

Use `/tmp`.

Required:

```text
/tmp/v2-6d-inventory-sidebar.png
/tmp/v2-6d-receipts-list.png
/tmp/v2-6d-receipt-create-modal.png
/tmp/v2-6d-issues-list.png
/tmp/v2-6d-transfer-create-modal.png
/tmp/v2-6d-adjustment-create-modal.png
/tmp/v2-6d-transaction-detail.png
/tmp/v2-6d-reverse-confirmation.png
/tmp/v2-6d-dashboard.png
/tmp/v2-6d-process-flow-current.png
/tmp/v2-6d-warehouse-user.png
/tmp/v2-6d-mobile-transaction-modal.png
```

Do not publish them.

# Phase 19 — Documentation

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-6d-ui-demo-cutover.md

docs/engineering-manual/00-meta/
  V2-6D-CUTOVER-REPORT.md

docs/engineering-manual/00-meta/
  V2-6D-ACCEPTANCE-REPORT.md
```

Acceptance status before Founder review:

```text
Code, Sandbox Migration, Backfill, and Controlled Cutover Gates Complete
Founder Acceptance Pending
```

Update truthfully:

- `V2-6-READINESS-NOTE.md`
- `INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `src/modules/inventory/UX-CONFORMANCE.md`
- `docs/demo/DEMO-RUNTIME-VALIDATION-REPORT.md`
- controlled demo runbook/storyboard/limitations
- V2-5 export compatibility docs where needed

Record:

- backup path/checksum
- migration result
- backfill result
- runtime flag cutover
- permission profile
- canonical V2 demo data
- rollback instructions
- best-effort event limitation
- public demo remains unapproved
- website assets remain paused
- V2-7/V2-8 blocked

# Phase 20 — Rollback Contract

Document and test these rollback levels:

## Before runtime enablement

- leave runtime false
- V2-5 app continues against additive migrated schema
- rerun/fix idempotent backfill if needed
- restore backup only when data integrity requires it

## After runtime enablement but before Founder acceptance

Fast application rollback:

1. set runtime flag false
2. rebuild/restart
3. V2-5 UI becomes active
4. additive schema/backfilled data remain unused
5. preserve backup and cutover report

Database restore is reserved for proven data corruption, not ordinary UI rollback.

Do not automatically restore the database without explicit operator authorization.

# Phase 21 — Tests and Gates

Run under Node 24:

```bash
node --version
npm --version
npm ci

npm run check:audit-policy
npm audit --omit=dev --audit-level=moderate

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

npm run inventory:v2:migration:rehearse
npm run inventory:v2:posting:rehearse
npm run inventory:v2:cutover:rehearse

npm run demo:check
npx prisma validate
npx prisma generate

git diff --check
git status --short
```

Capture raw full audit and verify only the accepted unexpired dev-tooling exception remains.

Do not call it clean.

Do not run `demo:reset` before migration/backfill. After V2 cutover, run only the updated guarded V2 reset.

# Final Report Required

Report:

1. V2-6D summary.
2. Node/npm versions.
3. Repository/checkpoint verification.
4. Initial worktree state.
5. Files inspected.
6. Files created.
7. Files modified.
8. UI/navigation implementation.
9. Receipt UI/API behavior.
10. Issue UI/API behavior.
11. Transfer UI/API behavior.
12. Adjustment cutover behavior.
13. Detail/reversal behavior.
14. Export integration.
15. Dashboard cutover.
16. Process Flow cutover.
17. Permission provisioning.
18. Canonical V2 demo transaction sequence.
19. Exact final balances.
20. Full disposable cutover-rehearsal result.
21. Controlled-sandbox preflight result.
22. Backup path/checksum/verification.
23. Migration result.
24. Backfill result and idempotency rerun.
25. Legacy compatibility result.
26. Runtime-enable result.
27. `demo:check` result.
28. Org Admin review.
29. Warehouse Operator review.
30. Safety/error scenarios.
31. Tests added and updated full count.
32. Accessibility result.
33. `check:all` result.
34. Production dependency audit result.
35. Approved raw development-audit exception result.
36. Port 1320 server PID/mode/URL.
37. Screenshot paths.
38. Documentation/report paths.
39. Git diff/status observations.
40. Deviations from frozen V2-6D scope, if any.
41. Remaining cutover, migration, event-delivery, accessibility, or operational risks.
42. Confirmation legacy StockAdjustment structures remain.
43. Confirmation no cleanup migration, Durable Outbox, caching, accents, website assets, new modules, or Platform Services were implemented.
44. Whether V2-6D is complete.
45. Whether Founder acceptance remains pending.
46. Whether V2-7 and V2-8 remain blocked.
47. Whether website asset production remains paused.
48. Whether public self-service demo and production readiness remain unapproved.

Stop after V2-6D.

Do not proceed to V2-7, V2-8, website asset production, public demo exposure, or production claims without explicit Founder approval.
