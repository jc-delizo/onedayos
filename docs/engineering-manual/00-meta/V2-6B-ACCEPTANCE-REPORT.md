# Implementation Package — V2-6B Schema, Migration, and Backfill Foundation

Status: Founder Accepted

Acceptance Date: 2026-07-25

Sandbox Migration Authorization Pending

## Repository Checkpoint

V2-6B began from the V2-5 checkpoint `6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b`.
The initial V2-6B worktree contained only approved V2-6A/V2-6 governance documents and authorized
untracked prompt inputs, with no unexpected project changes. Prompt 50 began with the expected
V2-6B package changes and Prompt 46 through Prompt 50 untracked, with no unexpected project
changes. Governance was then
committed as `7acee4f8800bec6d9230ec5fde0d138e20195d54` and tagged locally with the annotated tag
`inventory-demo-v2-v2.6-governance`. Prompt 46 through Prompt 50 were not modified, staged, or
committed.

## Prisma Schema

The exact new enums are:

```text
InventoryTransactionType: RECEIPT, ISSUE, TRANSFER, ADJUSTMENT
InventoryTransactionStatus: POSTED, REVERSED
```

`InventoryTransaction` contains `id`, `orgId`, `type`, `status`, `transactionNumber`,
`referenceNumber?`, date-only `referenceDate?`, `supplierId?`, `customerId?`, `warehouseId?`,
`sourceWarehouseId?`, `destinationWarehouseId?`, `reason?`, `notes?`, `postedAt`,
`postedByUserId`, `reversalOfTransactionId?`, `idempotencyKeyHash?`, `requestHash?`, `createdAt`,
and `updatedAt`. It relates tenant-safely to Organization, Supplier, Customer, three Warehouse
roles, posting User, original/reversal transactions, lines, and movements.

`InventoryTransactionLine` contains `id`, `orgId`, `transactionId`, `productId`, Decimal(18,4)
`quantity`, required `unit`, `lineNumber`, `notes?`, `createdAt`, and `updatedAt`. It relates
tenant-safely to Organization, transaction, Product, and movements.

## Migration and Constraints

The single migration is
`prisma/migrations/20260725000000_inventory_v2_transaction_foundation/migration.sql`. It is
expand-only: no table/column drop, enum rewrite, data mutation, extension, or demo data exists.
The migration was applied only to disposable loopback PostgreSQL databases and not to the
controlled sandbox.

Unique keys cover transaction `(id, orgId)`, transaction number per organization, nullable
idempotency hash per organization, one reversal per original and organization, line composite
identities, line number per transaction, and User `(id, orgId)`. Query indexes cover type/status
and reference date, all Warehouse roles, Supplier, Customer, posting order, line Product and
transaction lookups, and both canonical movement links.

Manual checks enforce number format, Warehouse/party shape, distinct transfer Warehouses,
non-self-reversal, posted/reason reversal shape, paired idempotency hashes, nonempty unit, positive
line number, nonnegative quantity, and paired canonical movement links.

## StockMovement Linkage and Legacy Compatibility

Both canonical link columns are nullable during expand/backfill. The movement-to-transaction
foreign key uses `(inventoryTransactionId, orgId)`. The movement-to-line foreign key uses
`(inventoryTransactionLineId, inventoryTransactionId, orgId)`, proving the line, transaction, and
movement tenant agree. Legacy `StockAdjustment`, `sourceType`, `sourceId`, and existing behavior
remain unchanged.

## Backfill Preflight

The preflight is read-only and queries only existing V2-5 tables. It pages at 250 rows, validates
all frozen tenant, record-state, arithmetic, movement, chronology, chain, balance, unit, orphan,
ambiguity, and deterministic-collision rules, emits sanitized issue references, and exits nonzero
on invalid history. No execute script or active write path exists.

The sandbox read-only result was:

```text
validCount: 9
invalidCount: 0
warningCount: 0
organizationCount: 1
issueCodes: []
```

Deterministic identities use the legacy adjustment ID for the transaction, the exact
`legacy-adjustment-line:<adjustmentId>` line ID, and
`ADJ-<UTC year>-<16 uppercase SHA-256 hex>` for the number. Counted-final quantity, Product unit,
legacy actor, Warehouse, reason, notes, and created time are mapped without inference of parties or
external dates.

## Tests

Forty-nine focused schema, SQL, safety, and preflight tests cover schema shape, prohibited lifecycle fields, retained
legacy compatibility, expand-only SQL, composite keys/FKs, every manual check, valid and corrupt
history, two organizations, deterministic rerun/collision, orphan movement, sanitized issues, and
static absence of mutation calls.

The full repository suite passes 439 tests across 66 files. Accessibility passes 18 tests across
5 files. TypeScript, lint, UX, architecture, generated-template, environment, Prisma, production
build, `check:all`, and `demo:check` pass.

The initial Prompt 48 registry snapshot failed at the requested thresholds: production had 12 vulnerable packages
(3 moderate, 9 high), and the full tree has 20 (3 moderate, 17 high). Direct dependency roots
reported by npm are the existing `exceljs` and Prisma CLI chains for production, plus ESLint and
Next ESLint configuration in development. No package/version or lockfile remediation was attempted
because it is forbidden in V2-6B; no `npm audit fix` command was run.

Prompt 49 cleared all production findings through compatible parent updates and narrow overrides.
Prompt 50 records one Founder-approved, exact, time-bounded exception for GHSA-mh99-v99m-4gvg
through the dev-only stable ESLint/Next lint graph. The strict checker rejects any production
occurrence, changed/additional advisory, root, wrapper, version, severity, direct dependency, or
expiry. Review is due no later than 2026-08-31.

Production dependency audit: clean.

Development audit: one approved, time-bounded lint-tooling exception.

The accepted dependency set passes clean install/tree validation, 439 tests, 18
accessibility tests, the focused XLSX round-trip suite, two production builds, `check:all`,
Prisma validation/generation, and read-only `demo:check`.

## Migration Rehearsal

The no-argument harness completed fresh and V2-5 checkpoint upgrade rehearsals against an
automatically removed loopback-only PostgreSQL 17.10 container. It proved migration history,
frozen objects, zero fresh/demo data, unchanged legacy counts, empty new tables, null new links,
V2-5 query compatibility, tenant isolation, 4 valid/17 rejected constraint cases, deterministic
read-only preflight (4 valid, 0 invalid, 0 warnings across two organizations), invalid-fixture
rejection across 12 separate database scenarios plus deterministic-collision unit coverage, and
application rollback compatibility. It did not use sandbox credentials.

A final repeated suite exposed a pre-existing route-modal close fallback timer that could outlive
jsdom teardown. The narrow lifecycle fix cancels that timer when the route unmounts and adds one
regression test; it does not change Inventory business behavior or add V2-6C behavior.

## Findings and Blockers

No blocking static schema, migration, or current sandbox legacy-history finding remains. The
remaining findings are procedural, environmental, and dependency-related:

- sandbox migration and backfill need separate explicit operator authorization;
- shared-environment migration/backup/rollback rehearsal remains pending;
- the one dev-only audit exception requires compatible upstream remediation by 2026-08-31;
- V2-6C posting behavior and cross-row reversal rules remain unimplemented and require separate
  explicit Founder authorization.

No posting/reversal service, API, permission, event, UI, navigation, export cutover, demo V2 data,
caching, accent, website asset, module, or Platform Service was implemented.

## V2-6C Readiness

V2-6B Founder Accepted. V2-6C is the next package eligible for explicit Founder authorization, but
implementation is not authorized by this report. The controlled migration/backfill remains
unmigrated, unexecuted, and separately gated for V2-6D unless the frozen roadmap is amended.

## Final Runtime

The verified Next 16.2.11 production build was confirmed running on port 1320 at acceptance.
`/`, `/login`, and `/register` returned 200; unauthenticated `/api/kernel/auth/me` returned the
expected 401.
