# OneDayOS — Inventory Demo V2 Package V2-6C
# Posting Engine, APIs, Permissions, Events, and Compatibility Reads

V2-6B Schema, Migration, and Backfill Foundation is Founder Accepted and safely checkpointed.

Repository checkpoint:

```text
Commit: b439afd12266a03766699f7fdc08f2178a480aba
Tag: inventory-demo-v2-v2.6b-foundation
Branch: main
```

The controlled Supabase sandbox remains intentionally unmigrated and unbackfilled.

The Founder explicitly authorizes **V2-6C only**.

V2-6D, V2-7, and V2-8 remain blocked.

## V2-6C Goal

Implement the disabled-by-default Inventory V2 runtime foundation:

- unified posting service
- Receipt posting
- Issue posting
- Transfer posting
- Adjustment posting
- reversal service
- mandatory idempotency
- serializable concurrency with bounded retries
- type-specific strict API routes
- exact permissions
- best-effort post-commit events
- canonical list/detail query services
- legacy compatibility reads
- future demo-role provisioning declarations
- disposable PostgreSQL integration tests

The new runtime must remain **disabled in the controlled sandbox** until V2-6D applies the migration, executes the final backfill, updates demo data, and performs the UI cutover.

Existing V2-5 application behavior must continue unchanged while the feature is disabled.

## Primary Authority

Read and follow first:

- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6C-POSTING-API-COMPATIBILITY.md`
- `docs/engineering-manual/00-meta/V2-6-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-TRANSACTION-SEMANTICS.md`
- `docs/engineering-manual/00-meta/V2-6-SCHEMA-MIGRATION-REVIEW.md`
- `docs/engineering-manual/00-meta/V2-6-MIGRATION-BACKFILL-PLAN.md`
- `docs/engineering-manual/00-meta/V2-6-TEST-MATRIX.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- `docs/engineering-manual/17-module-specifications/09-inventory-v2-module.md`
- `docs/engineering-manual/00-meta/V2-6B-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6B-MIGRATION-REHEARSAL-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6b-schema-migration-backfill.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-V2-6B-REPOSITORY-CHECKPOINT.md`

Also obey:

- `docs/engineering-manual/08-module-system/04-module-permissions.md`
- `docs/engineering-manual/08-module-system/06-module-events.md`
- `docs/engineering-manual/08-module-system/09-module-testing.md`
- `docs/engineering-manual/04-kernel/03-users-roles-permissions.md`
- `docs/engineering-manual/04-kernel/04-authorization-enforcement.md`
- `docs/engineering-manual/04-kernel/08-kernel-api-contracts.md`
- `docs/engineering-manual/05-sdk/02-sdk-db-access.md`
- `docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md`
- `docs/engineering-manual/05-sdk/04-sdk-events.md`
- `docs/engineering-manual/06-data/01-tenancy-data-isolation.md`
- `docs/engineering-manual/06-data/03-soft-delete-archival.md`
- `docs/engineering-manual/06-data/05-data-validation-zod.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/04-api-security.md`
- `docs/engineering-manual/13-security/05-data-security.md`
- `docs/engineering-manual/14-testing-quality/05-security-testing.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/15-deployment-operations/03-database-migrations-production.md`
- `docs/engineering-manual/00-meta/DEV-TOOLING-SECURITY-EXCEPTION-GHSA-MH99-V99M-4GVG.md`

If these documents conflict, stop and report the exact conflict. Do not invent a resolution.

## Frozen Domain Decisions

Implement exactly:

### Models and lifecycle

```text
InventoryTransaction
InventoryTransactionLine

Types:
RECEIPT
ISSUE
TRANSFER
ADJUSTMENT

Statuses:
POSTED
REVERSED
```

No Draft.

No Approval.

No hard delete.

No editing after posting.

### Reversal

- separate POSTED reversal transaction
- same business type as the original
- `reversalOfTransactionId` points to the original
- original becomes REVERSED
- original movements remain immutable
- one reversal maximum per original
- a reversal transaction cannot itself be reversed
- incorrect reversal requires a new normal corrective transaction
- reversal reason required
- reversal number prefix `REV`
- reverse operation atomic
- negative-stock protection remains applicable

### Warehouse fields

Receipt / Issue / Adjustment:

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

### Line quantities

- Receipt: positive received quantity
- Issue: positive issued quantity
- Transfer: positive transferred quantity
- Adjustment: counted final quantity; zero allowed
- Product unit snapshotted on every line
- Adjustment delta calculated server-side

### New movement types

```text
receipt_in
issue_out
transfer_out
transfer_in
adjustment_in
adjustment_out
reversal_in
reversal_out
```

Preserve:

```text
opening_balance
```

New writes populate canonical transaction and line links plus approved legacy source fields during compatibility.

### Idempotency

Every create and reverse request requires:

```text
Idempotency-Key
```

Store only:

```text
idempotencyKeyHash
requestHash
```

Same key + same normalized request:

```text
return original successful result
```

Same key + different normalized request:

```text
IDEMPOTENCY_KEY_REUSED
```

Missing key:

```text
IDEMPOTENCY_KEY_REQUIRED
```

No raw key storage or logging.

### Concurrency

Use:

```text
Prisma 7 Serializable transaction
+ maximum three attempts
```

Retry only the exact reviewed serialization/write-conflict errors.

Do not retry:

- validation
- permission
- module-disabled
- insufficient-stock
- idempotency conflicts
- business-domain errors

### Transaction numbers

```text
REC-{UTC_YEAR}-{16 UPPERCASE HEX}
ISS-{UTC_YEAR}-{16 UPPERCASE HEX}
TRF-{UTC_YEAR}-{16 UPPERCASE HEX}
ADJ-{UTC_YEAR}-{16 UPPERCASE HEX}
REV-{UTC_YEAR}-{16 UPPERCASE HEX}
```

Server-generated with cryptographically strong randomness.

Maximum three number-collision attempts.

### Reference date

- optional date-only
- historical allowed
- maximum current UTC date + one day
- posting date remains server-owned `postedAt`
- reference date never backdates movements

### Events

Best effort after commit.

No durable-delivery claim.

No outbox in V2-6C.

No external consumer may depend on guaranteed delivery.

## Absolute Scope

### Allowed

- add a server-only disabled-by-default V2 runtime flag
- implement transaction schemas/types/utilities
- implement posting/reversal/query services
- implement strict type-specific API routes
- implement exact permissions and manifest metadata
- implement event definitions and post-commit emission
- implement canonical and compatibility query projections
- update future demo-role provisioning declarations without running them
- add unit, API, architecture, and disposable PostgreSQL integration tests
- add an isolated posting-engine integration-test harness
- update `check:architecture`, `check:ux`, and documentation
- create V2-6C implementation and acceptance reports
- make narrowly required compatibility fixes

### Forbidden

Do not:

- apply the migration to the controlled sandbox
- execute the sandbox backfill
- run `demo:reset`
- mutate canonical demo data
- enable the V2 runtime in `.env.local`
- change current Inventory sidebar/navigation
- add Receipt/Issue/Transfer UI
- cut existing tables/dashboard/exports over to new reads
- remove or rewrite legacy StockAdjustment APIs
- remove legacy fields/models
- modify Prisma schema or the V2-6B migration
- create another migration
- change dependencies
- implement durable outbox
- implement caching
- implement accent presets
- resume website asset production
- add modules or Platform Services
- run `npm audit fix`
- run `npm audit fix --force`
- stage or commit prompt inputs

If service implementation reveals a schema defect, stop and report. Do not silently edit the accepted schema or migration.

## Repository Safety

Before work:

1. Run `git status --short`.
2. Verify HEAD and `inventory-demo-v2-v2.6b-foundation`.
3. The only expected untracked files are authorized prompt inputs.
4. Stop if any unexpected source/config/package/Prisma change exists.
5. Do not reset, restore, delete, or overwrite unrelated work.
6. Do not create a commit or tag.
7. Use Node 24.
8. Keep final production runtime on port `1320`.

## Supported Audit Policy

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

Do not describe the raw full audit as clean.

# Phase 1 — Inspect Current Runtime and Frozen Schema

Before coding, report:

1. exact generated Prisma model fields
2. current Inventory service organization
3. current Decimal helpers
4. current event emitter surface
5. current API wrappers/error types
6. current module/permission helpers
7. current movement and balance services
8. current legacy adjustment routes/services
9. current disposable Docker/PostgreSQL rehearsal helpers
10. current server env conventions
11. files planned for creation/modification
12. any mismatch between generated Prisma API and frozen V2-6C handoff

Stop on mismatch.

# Phase 2 — Disabled-by-Default Runtime Gate

Add a server-only environment flag:

```text
ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED=false
```

Add a placeholder to `.env.example`.

Do not edit `.env.local`.

Requirements:

- defaults to false
- parsed through existing server env validation
- never exposed to browser code
- checked before any V2 transaction database query
- disabled API behavior returns the frozen safe JSON 404 contract
- no Prisma access occurs when disabled
- current V2-5 app remains functional against the unmigrated sandbox
- current `demo:check` remains unchanged and passing
- V2-6D will enable it only after migration/backfill/cutover

Use an existing safe error if frozen docs specify one.

Otherwise prefer a non-enumerating safe response such as:

```text
MODULE_NOT_FOUND
```

Do not reveal migration state.

Tests must prove an intentionally throwing DB mock is never called while disabled.

# Phase 3 — Module Structure

Use repository conventions.

Preferred conceptual direction:

```text
src/modules/inventory/transactions/
  types.ts
  schemas.ts
  query-schema.ts
  errors.ts
  request-hash.ts
  transaction-number.ts
  serializable.ts
  validation.ts
  balance-posting.ts
  posting-service.ts
  reversal-service.ts
  query-service.ts
  compatibility.ts
  events.ts
  index.ts
  __tests__/
```

Use fewer files if clearer.

Do not create a metadata-driven transaction engine.

The shared layer may own common transaction mechanics, but type-specific validation must remain explicit.

No `@/kernel` imports inside the module.

No raw Prisma import except through the approved SDK/database surface.

# Phase 4 — Strict Request Schemas

Create separate strict schemas for:

## Receipt

Fields approved by frozen docs, conceptually:

```text
referenceNumber?
referenceDate?
supplierId?
warehouseId
reason?
notes?
lines[]
```

Each line:

```text
productId
quantity > 0
notes?
```

## Issue

```text
referenceNumber?
referenceDate?
customerId?
warehouseId
reason?
notes?
lines[]
```

Each line quantity > 0.

## Transfer

```text
referenceNumber?
referenceDate?
sourceWarehouseId
destinationWarehouseId
reason?
notes?
lines[]
```

Each line quantity > 0.

## Adjustment

```text
referenceNumber?
referenceDate?
warehouseId
reason
notes?
lines[]
```

Each line uses a clear API field such as:

```text
countedQuantity >= 0
```

Do not ask clients for a delta.

## Reverse

```text
reason
```

No transaction number, status, dates, actors, hashes, unit, before/after balance, or `orgId` from the client.

Requirements:

- `z.strictObject()`
- unknown keys rejected
- `orgId` rejected recursively
- line count bounded by frozen contract
- duplicate Product behavior follows frozen documents
- Decimal precision/scale validated
- blank strings normalized/rejected safely
- reference date contract
- source != destination
- safe errors

If duplicate Product-line behavior is not frozen, stop and report rather than inventing it.

# Phase 5 — Pure Security Utilities

## Request hashing

Implement deterministic normalized-request hashing.

Requirements:

- SHA-256
- arrays preserve intentional line order unless frozen docs specify canonical sorting
- Decimal/date/string normalization
- no raw key in normalized request
- no tenant ID from client
- stable tests
- no JSON property-order ambiguity

## Idempotency-key hashing

- SHA-256
- validate reasonable header length/format
- never store/log raw key
- constant safe output
- no secret key required

## Transaction numbering

- use Node cryptographic randomness
- exact frozen prefixes/format
- UTC posting year
- three collision attempts
- deterministic tests with injected randomness/clock
- no client generation

## Reference-date helper

- date-only
- max UTC today + one day
- injected clock for tests
- no local timezone ambiguity

# Phase 6 — Serializable Transaction Executor

Create a small, typed executor around the approved Prisma transaction API.

Requirements:

- `Serializable` isolation
- maximum three attempts
- retry only reviewed Prisma/PostgreSQL conflict codes
- safe backoff/jitter if frozen docs approve it
- injected sleep/randomness for tests
- no retry on domain/permission/validation/idempotency errors
- preserve original safe error
- log retry metadata without secrets, payloads, or IDs that violate logging rules
- tests for:
  - success first attempt
  - one/two conflicts then success
  - third conflict fails safely
  - nonretryable error executes once

Do not catch all Prisma errors as retryable.

# Phase 7 — Shared Posting Validation

Inside the serializable transaction, validate:

- organization scope
- module availability
- transaction-type permission
- active/non-deleted Product
- active/non-deleted Warehouse
- active/non-deleted Supplier/Customer when supplied
- reference shape
- Warehouse field invariants
- Product unit exists
- Inventory tracking policy according to the frozen V2-6 contract
- no cross-tenant reference
- no client-owned posting fields

Sort balance-affecting work in a deterministic order to reduce conflicts.

Use Decimal-safe arithmetic only.

No JS floating-point quantity math.

# Phase 8 — Balance and Movement Posting

Implement shared helpers for current `StockBalance` and `StockMovement`.

Requirements:

- exact tenant scope
- create or update balance atomically
- signed `quantityChange`
- server-computed `quantityAfter`
- canonical `inventoryTransactionId`
- canonical `inventoryTransactionLineId`
- approved compatibility `sourceType` / `sourceId`
- exact movement type
- no partial movement
- no movement before transaction/line exists
- no event inside the database transaction
- no mutation of prior movements
- negative-stock protection
- deterministic line ordering

Use the schema’s composite relation correctly.

# Phase 9 — Receipt Posting

Implement service entry point with `PlatformContext`.

Required behavior:

1. runtime flag
2. module enabled
3. `inventory.receipt.create`
4. required idempotency key
5. request hash
6. existing-idempotency resolution
7. serializable transaction
8. validate optional Supplier
9. validate destination `warehouseId`
10. validate Products/tracking/units
11. generate transaction number
12. create POSTED transaction
13. create ordered lines
14. create `receipt_in` movements
15. increase balances
16. commit
17. emit approved events after commit
18. return canonical DTO

No negative quantity.

No source Warehouse.

No Customer.

No duplicate event on idempotent replay.

# Phase 10 — Issue Posting

Required:

- `inventory.issue.create`
- optional Customer
- source `warehouseId`
- `issue_out`
- positive input quantity
- subtract from balance
- prevent negative stock per line
- entire multi-line transaction fails on any insufficient line
- no Supplier
- no partial movements/balances
- post-commit events

# Phase 11 — Transfer Posting

Required:

- `inventory.transfer.create`
- source and destination Warehouses
- source != destination
- no generic `warehouseId`
- no Supplier/Customer
- positive quantity
- sufficient source stock
- one `transfer_out` at source
- one `transfer_in` at destination
- source/destination balances updated atomically
- organization-wide total unchanged
- no quantity creation/loss
- multi-line atomicity
- post-commit events
- deterministic lock/order strategy

# Phase 12 — Adjustment Posting

Required:

- `inventory.adjustment.create`
- target `warehouseId`
- counted final quantity input
- server reads previous balance
- server computes signed delta
- reject no-op adjustment if frozen docs require it
- `adjustment_in` or `adjustment_out`
- prevent negative final quantity
- line stores counted final quantity
- movement stores signed delta
- preserve legacy StockAdjustment compatibility behavior according to frozen handoff

Do not create a new legacy StockAdjustment row for V2 canonical writes unless the frozen compatibility plan explicitly requires a temporary dual-write.

If dual-write is not frozen, do not invent it.

# Phase 13 — Idempotency Race Handling

Inside/around the serializable transaction:

- look up existing transaction by organization + key hash
- same request hash returns the original DTO
- different request hash returns 409 conflict
- handle unique-key races safely
- after a unique collision, fetch and compare
- never double-post balances/movements
- replay emits no duplicate events
- legacy backfilled null keys remain unaffected

Test with real disposable PostgreSQL concurrency.

# Phase 14 — Reversal Service

Implement:

```text
reverseInventoryTransaction(ctx, transactionId, reason, idempotencyKey)
```

Required:

- runtime flag
- read permission and type-specific reverse permission
- original same organization
- original POSTED
- original is not a reversal transaction
- no existing reversal
- idempotency
- serializable transaction
- create a POSTED reversal transaction
- `reversalOfTransactionId`
- `REV-...` number
- original type retained
- reversal lines follow frozen representation
- inverse movements are derived safely from original canonical movements
- original movements unchanged
- update current balances
- reject reversal if inverse stock effect would create invalid negative stock
- mark original REVERSED atomically
- no double reversal
- event after commit
- no duplicate event on idempotent replay

Follow the exact frozen line/warehouse representation.

If the accepted documents still leave reversal-line representation ambiguous, stop before implementation.

# Phase 15 — Canonical DTOs and Query Services

Create browser-safe serializable DTOs, not Prisma records.

At minimum:

- transaction summary
- transaction detail
- line detail
- Warehouse/Supplier/Customer labels
- posting actor display data where permitted
- status/type labels
- reversal linkage
- movement summary where approved

No:

- orgId
- idempotency hashes
- request hash
- auth IDs
- deleted metadata
- raw Prisma Decimal objects

## List/query services

Implement type-scoped lists for:

- receipts
- issues
- transfers
- adjustments

Use Data Table V2 server-mode query patterns:

- `q`
- page
- pageSize
- sort
- direction
- status
- Warehouse
- Supplier/Customer where appropriate
- date range if frozen
- exact totals
- soft-delete/tenant scope
- permission
- stable sorting

Do not cut existing UI to these queries yet.

## Detail

Unified detail by ID, permission-aware.

# Phase 16 — Legacy Compatibility Reads

Preserve all V2-5 legacy routes and behavior.

Implement the frozen compatibility layer needed for V2-6D:

- canonical projection helpers
- legacy StockAdjustment to canonical adjustment summary where required
- legacy route/detail compatibility
- no duplicate rows after backfill
- clear source/canonical identity
- no write cutover
- no removal of `StockAdjustment`
- current export/dashboard paths remain unchanged until V2-6D

Do not query new tables while runtime flag is false.

Do not make current V2-5 pages depend on the unmigrated schema.

# Phase 17 — Permissions and Manifest

Add exact permissions to the existing Inventory permission model:

```text
inventory.receipt.read
inventory.receipt.create
inventory.receipt.reverse

inventory.issue.read
inventory.issue.create
inventory.issue.reverse

inventory.transfer.read
inventory.transfer.create
inventory.transfer.reverse

inventory.adjustment.read
inventory.adjustment.create
inventory.adjustment.reverse

inventory.transaction.export
```

Reconcile existing adjustment permission naming through the frozen compatibility plan.

Requirements:

- no wildcard permission in manifest
- no action arrays
- permissions declared as metadata
- services enforce permissions
- APIs enforce/resolve context before service calls
- reverse/export not implied by read/create
- Org Admin wildcard remains
- no runtime permission-row mutation in this package

Update future demo provisioning declarations for Warehouse Operator:

- receipt read/create
- issue read/create
- transfer read/create
- adjustment read/create
- Customer read

Do not run provisioning.

Do not change current `demo:check` expected live permissions until V2-6D cutover.

# Phase 18 — Events

Define and emit after commit:

```text
inventory.receipt.posted
inventory.issue.posted
inventory.transfer.posted
inventory.adjustment.posted
inventory.transaction.reversed
inventory.stock_movement.created
inventory.stock_balance.updated
```

Follow current event contracts.

Requirements:

- no orgId in payload
- no full records
- minimal stable IDs/quantities
- no secrets/hashes
- no event on rollback
- no duplicate event on idempotent replay
- event failure logged safely
- committed transaction is not rolled back by event failure
- no Notification Service
- no durable-delivery claim

Add a documentation/test guard requiring a future Outbox before external consumers.

# Phase 19 — API Routes

Create:

```text
GET/POST /api/orgs/[orgSlug]/inventory/transactions/receipts
GET/POST /api/orgs/[orgSlug]/inventory/transactions/issues
GET/POST /api/orgs/[orgSlug]/inventory/transactions/transfers
GET/POST /api/orgs/[orgSlug]/inventory/transactions/adjustments

GET /api/orgs/[orgSlug]/inventory/transactions/[id]
POST /api/orgs/[orgSlug]/inventory/transactions/[id]/reverse
```

Requirements:

- runtime flag checked before V2 DB access
- verified API PlatformContext
- strict route/query/body parsing
- `Idempotency-Key` header required on create/reverse
- JSON success/error envelopes
- no redirects
- no HTML
- no `orgId`
- 401/403/404 safe behavior
- module disabled safe 404
- V2 runtime disabled safe 404
- malformed JSON → BAD_REQUEST
- unknown keys → VALIDATION_ERROR
- idempotency errors stable
- conflict/stock errors safe
- request ID preserved
- no raw provider error

Do not add UI routes.

# Phase 20 — Feature-Disabled Runtime Safety

The controlled sandbox is still unmigrated.

Required proofs:

- application build succeeds with V2 schema client but unmigrated runtime DB
- current V2-5 pages continue to work
- no new route queries V2 tables when flag false
- new APIs return the frozen safe 404
- `demo:check` passes
- no import-time database introspection
- no Prisma migration check at request time
- no current navigation exposes V2 transaction routes

Start the latest production server with the flag remaining false.

# Phase 21 — Disposable PostgreSQL Integration Harness

Reuse the accepted V2-6B Docker/PostgreSQL safety helpers.

Create a separate V2-6C integration command, for example:

```text
inventory:v2:posting:rehearse
```

Requirements:

- isolated random local PostgreSQL container
- no persistent volume
- loopback/dynamic port
- no sandbox credentials
- apply all migrations through V2-6B
- seed two organizations and approved synthetic records
- runtime V2 flag enabled only in the isolated test process
- cleanup on success/failure
- no main-worktree switch
- no controlled demo mutation

Do not require Docker in ordinary `check:all` unless the current CI explicitly supports it.

Unit/API tests remain part of normal gates.

The disposable integration rehearsal is an acceptance gate.

# Phase 22 — Real Database Integration Scenarios

Against disposable PostgreSQL, prove:

## Receipt

- single line
- multi-line
- balance create
- balance update
- optional Supplier
- invalid cross-tenant references
- idempotent replay
- conflicting idempotency reuse
- transaction/movement/line linkage
- event timing

## Issue

- valid issue
- optional Customer
- exact balance reduction
- insufficient stock
- multi-line rollback
- concurrent issues cannot overspend stock
- idempotent replay

## Transfer

- valid paired movements
- two-Warehouse balances
- organization total unchanged
- same Warehouse rejected
- insufficient source
- multi-line rollback
- concurrent transfer/issue safety

## Adjustment

- counted final quantity
- positive/negative/zero final
- server delta
- no-op behavior according to frozen docs
- legacy compatibility behavior
- idempotent replay

## Reversal

- each type
- original becomes REVERSED
- reversal POSTED
- inverse movements
- balances restored
- double reversal rejected
- reversal-of-reversal rejected
- insufficient-stock reversal rejected
- idempotent replay

## Serializable retry

- actual conflict scenario
- bounded retry
- no double posting
- safe failure after max attempts

## Two organizations

- no cross-tenant references
- totals isolated
- idempotency key scoped by organization
- transaction numbers unique per organization

# Phase 23 — Tests

Add meaningful normal-suite tests and disposable integration tests.

## Schemas

- all valid/invalid type shapes
- recursive orgId rejection
- quantity precision
- reference-date boundary
- unknown keys
- duplicate lines per frozen policy
- line count bound

## Utilities

- key/request hash
- stable normalization
- number generation/collision
- UTC year
- reference date
- serializable retry

## Service unit tests

- permission order
- module/flag order
- no DB access when disabled
- exact movement types
- event after commit
- no event on failure/replay
- safe errors

## API tests

- disabled runtime 404 before DB
- 401/403/404
- missing idempotency header
- same/different replay
- malformed JSON
- query/body orgId
- module disabled
- safe errors
- list meta
- detail/reverse

## Security/architecture

- no raw key logging
- no idempotency hashes in DTO
- no `@/kernel` module import
- no raw Prisma outside approved DB surface
- no V2 UI/nav/cutover
- no migration application
- no Outbox claim

# Phase 24 — `check:architecture` / `check:ux`

Add stable gates:

- V2 runtime flag defaults false
- new APIs gate before V2 table access
- no UI/nav exposure
- no sandbox migration marker
- exact permissions exist
- reverse/export separate
- idempotency required
- serializable retry helper exists
- no raw key storage/logging
- events after commit
- no durable-delivery claim
- no V2-6D work
- website assets remain paused

Avoid brittle class/string checks where semantic tests are better.

# Phase 25 — Documentation

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-6c-posting-api-compatibility.md
```

Include:

- runtime feature gate
- service architecture
- type-specific schemas
- idempotency
- serializable retry
- posting semantics
- reversal
- permissions
- events
- API routes
- compatibility reads
- disposable integration evidence
- controlled sandbox remains unmigrated
- explicit non-goals
- V2-6D remains blocked

Create:

```text
docs/engineering-manual/00-meta/
  V2-6C-ACCEPTANCE-REPORT.md
```

Status before Founder acceptance:

```text
Code and Isolated Posting Gates Complete
Founder Acceptance Pending
Sandbox Migration and Cutover Pending
```

Update narrowly:

```text
docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md
docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md
```

Do not mark V2-6D ready automatically.

# Controlled Sandbox Safety

Do not run:

```text
prisma migrate deploy
backfill execution
demo:reset
demo provisioning
```

The sandbox remains V2-5/unmigrated.

Run `demo:check` read-only.

No V2 permission profile is applied live.

# Dependency Gates

No dependency change is expected.

Required:

```bash
npm run check:audit-policy
npm audit --omit=dev --audit-level=moderate
```

Capture raw full audit and verify only the approved lint exception remains.

# Verification Commands

Under Node 24:

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
npm run demo:check

npm run inventory:v2:posting:rehearse

npx prisma validate
npx prisma generate

git diff --check
git status --short
```

Capture but do not mislabel:

```bash
npm audit --json
npm audit --audit-level=high
npm audit --audit-level=moderate
```

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

Stop stale server and start the latest build on port 1320 with V2 runtime disabled.

# Final Report Required

Report:

1. V2-6C summary.
2. Node/npm versions.
3. Repository/checkpoint verification.
4. Files inspected.
5. Files created.
6. Files modified.
7. Runtime feature-gate design.
8. Exact request schemas.
9. Idempotency implementation.
10. Transaction-number implementation.
11. Serializable-retry implementation.
12. Receipt behavior.
13. Issue behavior.
14. Transfer behavior.
15. Adjustment behavior.
16. Reversal behavior.
17. Balance/movement linkage.
18. Canonical DTO/query services.
19. Legacy compatibility reads.
20. Permission definitions and future demo-role declaration.
21. Event definitions/delivery behavior.
22. API routes and error contracts.
23. Feature-disabled sandbox safety result.
24. Disposable PostgreSQL integration-rehearsal result.
25. Concurrency/idempotency integration result.
26. Tests added and updated full count.
27. Accessibility result.
28. `check:all` result.
29. `demo:check` result.
30. Production dependency audit result.
31. Approved raw development-audit exception result.
32. Prisma validate/generate result.
33. Port 1320 server status/PID.
34. Documentation/report paths.
35. Git diff/status observations.
36. Deviations from frozen V2-6C scope, if any.
37. Remaining posting, reversal, concurrency, compatibility, or event-delivery risks.
38. Confirmation that the controlled sandbox was not migrated, backfilled, reset, provisioned, or switched to V2.
39. Confirmation that no V2-6D UI/navigation/export/demo cutover, caching, accents, website assets, modules, Durable Outbox, or Platform Services were implemented.
40. Whether V2-6C is complete.
41. Whether Founder acceptance remains pending.
42. Whether V2-6D and sandbox migration/cutover remain blocked.

Stop after V2-6C.

Do not apply the migration, execute the backfill, provision permissions, enable the runtime, or proceed to V2-6D without explicit Founder/operator authorization.
