# Implementation Note — V2-6B Schema, Migration, and Backfill Foundation

Status: Founder Accepted on 2026-07-25

Sandbox Migration Authorization Pending

## Governance Checkpoint

The frozen V2-6 governance documents were committed before schema work:

- commit `7acee4f8800bec6d9230ec5fde0d138e20195d54` (`docs: freeze Inventory V2-6 governance`);
- annotated local tag `inventory-demo-v2-v2.6-governance`;
- tag message `Frozen Inventory V2-6 schema, lifecycle, migration, and staged package decisions`.

Prompt 46 through Prompt 50 remain authorized, untracked task inputs.

## Schema Foundation

`InventoryTransactionType` contains exactly `RECEIPT`, `ISSUE`, `TRANSFER`, and `ADJUSTMENT`.
`InventoryTransactionStatus` contains exactly `POSTED` and `REVERSED`.

`InventoryTransaction` adds the frozen identity, tenant, type/status, number, optional reference,
party and Warehouse fields, posting actor/time, one-to-one reversal link, nullable legacy
idempotency hashes, audit timestamps, tenant-safe relations, and query indexes.

`InventoryTransactionLine` adds the frozen tenant and transaction identities, Product, counted or
operational quantity, required snapshotted unit, line number, notes, timestamps, tenant-safe
relations, and composite identities needed by movement linkage.

No Draft, Approval, Void, or soft-delete lifecycle was introduced.

## Migration

The one expand migration is:

`prisma/migrations/20260725000000_inventory_v2_transaction_foundation/migration.sql`

It creates both enums and canonical tables, adds the `User (id, orgId)` composite unique key, and
adds nullable `inventoryTransactionId` and `inventoryTransactionLineId` fields to `StockMovement`.
The three-column movement-to-line foreign key proves that a movement line belongs to the same
canonical transaction and organization.

Manual SQL adds deterministic checks for:

- type-specific transaction-number format, including reversal numbers;
- type-specific Warehouse and party shape;
- different transfer source and destination Warehouses;
- no self-reversal and the frozen posted/reason reversal shape;
- paired nullable idempotency hashes;
- required nonempty unit, positive line number, and nonnegative line quantity;
- all-null or all-present canonical movement linkage.

The migration contains no drop, data update, delete, insert, demo row, extension, or legacy-field
removal. It was generated from the pre-change schema and applied only to automatically removed
disposable loopback PostgreSQL databases, never the controlled sandbox.

## Legacy Compatibility

`StockAdjustment`, `StockMovement.sourceType`, `StockMovement.sourceId`, all existing ledger
indexes, and current runtime services, routes, UI, exports, events, permissions, and demo data
remain intact. Application reads and writes were not switched to the canonical tables.

## Read-Only Backfill Preflight

`npm run inventory:v2:backfill:preflight` reads legacy tables only and has no mutation path. It
scans adjustments in stable organization/creation/id order with a fixed 250-row page size, loads
the complete affected movement chains and balances, and validates tenant membership, active
references, posted/nondeleted history, Decimal(18,4) arithmetic, nonnegative before/after values,
nonzero delta, movement uniqueness/type/source/actor/chronology, chain continuity, and final
StockBalance reconciliation. Issues contain hashed references rather than personal data or full
records.

The deterministic plan is:

- transaction ID = legacy adjustment ID;
- line ID = `legacy-adjustment-line:<adjustmentId>`;
- number = `ADJ-<createdAt UTC year>-<first 16 uppercase SHA-256 hex of orgId:adjustmentId>`;
- transaction type/status = `ADJUSTMENT` / `POSTED`;
- posted and created time = legacy `createdAt`;
- line quantity = legacy counted-final `quantityAfter`;
- line unit = validated current Product unit;
- line number = 1, reference date/number and parties = null;
- the exactly matching legacy movement receives both canonical links in a future authorized package.

Any deterministic collision or integrity mismatch stops preflight. V2-6B includes no execute
script.

The approved sandbox read-only preflight reported 9 valid adjustments, 0 invalid adjustments,
0 warnings, one organization, and no issue codes. It performed no writes.

## Verification and Rehearsal

Prisma validation/generation, the stable foundation checker, TypeScript, and 49 focused V2-6B
tests pass. The full repository suite passes 439 tests across 66 files; the dedicated accessibility
suite passes 18 tests across 5 files; `check:all`, the production build, and `demo:check` pass.

The initial Prompt 48 registry snapshot was not green. The production audit reported 12
vulnerable packages (3 moderate, 9 high), and the full audit reports 20 (3 moderate, 17 high).
The direct roots are the already-pinned `exceljs`, Prisma CLI, ESLint, and Next ESLint configuration
chains. V2-6B forbids dependency/version changes and `npm audit fix`, so no remediation was
attempted; this is recorded as a dependency follow-up outside this package.

Prompt 49 subsequently cleared the production audit by updating compatible PostCSS, Valibot,
Archiver, and Unzipper paths. The raw full audit retains nine high development-tooling
wrapper entries through Minimatch 3. Current Next lint plugins do not accept ESLint 10, and forcing
Brace Expansion 5 beneath Minimatch 3 changes its CommonJS API. No unsafe override or audit
suppression was used.

The accepted remediation and exception controls pass `npm ci`, `npm ls --all`, 439 tests, 18 accessibility tests, 14
focused ExcelJS/export tests, the production build, `check:all`, Prisma validation/generation, and
read-only `demo:check`. ExcelJS remains server-only and is externalized from the Next server bundle
so unused optional Unzipper transports are not statically resolved.

Prompt 50 approved one exact dev-only exception and a strict policy gate. Production dependency
audit: clean. Development audit: one approved, time-bounded lint-tooling exception. The exception
expires 2026-08-31 and is removed when a coherent stable patched lint stack is available.

The disposable PostgreSQL 17.10 rehearsal passed fresh deployment, checkpoint upgrade, row
preservation, frozen-object inspection, four valid transaction types, 17 rejected constraint
cases, deterministic read-only preflight across two organizations, invalid-fixture rejection, and
V2-5 rollback compatibility. Twelve separate database-backed invalid preflight cases failed with
sanitized codes, and deterministic collision remains covered by the validator test. Neither
configured database URL was used as a target.

Repeated full-suite execution exposed a route-modal fallback timer surviving test-environment
teardown. The timer is now canceled on route unmount and has a focused regression test. This is a
lifecycle reliability correction, not an Inventory or V2-6C behavior change.

## Rollback and Boundary

Because no controlled database migration or backfill was executed, repository rollback is limited
to reverting the additive schema, migration, checker, preflight, tests, and documentation before any
canonical write exists. In a future authorized environment rollout, backup/restore proof and a
reviewed forward/down procedure must precede deployment; legacy adjustments, movements, and
balances must remain untouched.

The accepted repository boundary is resolved by the annotated local tag
`inventory-demo-v2-v2.6b-foundation`. Separate environment-specific sandbox migration/backfill
authorization remains required. V2-6C is eligible for explicit Founder approval but is not
authorized by this note.
