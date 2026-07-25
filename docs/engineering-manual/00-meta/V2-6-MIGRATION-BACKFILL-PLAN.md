# V2-6 Migration and Backfill Plan

Status: Frozen
Date: 2026-07
Implementation Allowed: No

## Compatibility Decision

Use Strategy 2: keep `StockAdjustment` as a temporary read-only compatibility source/projection while new transactions become canonical.

Backfill every valid existing adjustment into `InventoryTransaction` and `InventoryTransactionLine`, link its existing movement, then switch application reads/writes to the unified model. Preserve old URLs and export contracts through adapters. Do not dual-write indefinitely and do not remove the old table in V2-6.

This is safer than retiring the model in the same migration and cleaner than preserving it as a permanent subtype, which would contradict the frozen unified model.

## Expand–Backfill–Switch–Contract Sequence

1. **Preflight:** backup/restore readiness, migration status, exact row counts, two-organization fixtures, and integrity queries.
2. **Expand migration:** add stable enums, User composite unique, transaction/line tables, tenant-safe relations, checks, indexes, and nullable movement link columns.
3. **Deploy compatibility-capable code:** code understands both unlinked legacy and linked canonical history but keeps new transaction UI disabled.
4. **Dry-run backfill:** scan by organization and stable `(createdAt, id)` cursor; produce counts and rejection details without writes.
5. **Execute backfill:** process bounded batches; each batch is one database transaction.
6. **Verify:** every eligible adjustment has exactly one transaction/line and exactly one correctly linked movement; quantities and balances reconcile.
7. **Switch reads:** canonical transaction reads with legacy routes projecting canonical Adjustment DTOs.
8. **Switch writes:** new type-specific services write only canonical transactions; legacy adjustment POST delegates to canonical posting.
9. **Enable controlled UI:** enable new transaction navigation only after sandbox migration, tests, and reconciliation pass.
10. **Observe:** retain old model and source fields read-only for at least one release/checkpoint.
11. **Contract later:** remove old model/fields only through a separately approved migration with zero-use evidence.

Production execution remains separately gated after sandbox and staging evidence.

## Backfill Mapping

For each current `StockAdjustment`:

| Legacy value | Canonical value |
| --- | --- |
| `id` | transaction `id` and line-derived compatibility key |
| `orgId` | transaction and line `orgId` |
| fixed | `type = ADJUSTMENT`, `status = POSTED` |
| derived | `transactionNumber = ADJ-<createdAt UTC year>-<deterministic 16 uppercase hex>` |
| `createdAt` | `postedAt` and transaction `createdAt`; `referenceDate` remains null because no external date exists |
| `createdBy` | `postedByUserId` |
| `warehouseId` | transaction `warehouseId` |
| `reason`, `notes` | transaction fields |
| `productId` | one line Product |
| `quantityAfter` | counted-final line `quantity` |
| current Product `unit` | line unit snapshot, with migration provenance documented |
| fixed | `lineNumber = 1` |
| legacy movement | nullable direct transaction and line links |

No Supplier or Customer is inferred. `referenceNumber` remains null. Existing `quantityBefore` and `quantityAfter` are verified against the linked movement and chain but are not copied to redundant canonical columns.

Using the same transaction ID as the adjustment preserves existing detail URLs and makes idempotency easy. Backfill number suffix is the first collision-free 16 uppercase hexadecimal characters from a documented SHA-256 input containing organization and legacy adjustment ID; its year is the legacy server posting year. Any deterministic collision stops preflight rather than changing format silently. Inserts use deterministic IDs/numbers and upsert-or-skip only after verifying that an existing canonical row exactly matches.

## Mandatory Preflight Rejections

Stop and report; do not silently backfill when any adjustment:

- has no matching organization, Product, Warehouse, or User in the same tenant;
- is not `posted`, is soft-deleted, or has soft-delete metadata inconsistent with status;
- has `quantityAfter - quantityBefore != quantityDelta`;
- has a negative before/after quantity;
- has a zero delta;
- has zero or multiple candidate movements;
- has a movement with mismatched tenant, Product, Warehouse, delta, result, source type, source ID, actor, or chronology;
- would duplicate an existing transaction number or incompatible deterministic ID;
- belongs to a movement chain whose running result does not reconcile;
- disagrees with the final `StockBalance`.

Rejected rows remain untouched. The migration does not create placeholder users, Products, Warehouses, or movements.

## SQL/Pseudocode Outline

The implementation migration must be generated through Prisma and reviewed. PostgreSQL checks/indexes not expressible in Prisma may be appended to the reviewed migration SQL.

```text
BEGIN expand migration
  create InventoryTransactionType and InventoryTransactionStatus enums
  add User (id, orgId) unique
  create inventory_transactions
  create inventory_transaction_lines
  add nullable StockMovement transaction/line columns
  add composite foreign keys, checks, unique constraints, and indexes
COMMIT
```

Backfill is a separate tenant-aware TypeScript operational script using the approved Prisma/SDK data boundary:

```text
--dry-run is mandatory first
for each organization ordered by id:
  read StockAdjustment batches ordered by (createdAt, id), default 250
  preflight the complete batch and linked movements
  transaction:
    insert deterministic InventoryTransaction when absent
    insert deterministic line when absent
    update only matching legacy movement's nullable links
  log org, cursor, scanned, inserted, already-matching, rejected
after all batches:
  run global and per-org verification
```

Default batch size is 250 and configurable downward, not upward without review. Each batch commits independently. A failed batch rolls back and stops; earlier verified batches remain idempotently rerunnable.

## Idempotency

- deterministic transaction ID equals adjustment ID;
- deterministic transaction number uses the approved prefix/year/16-hex format;
- one line uses exact deterministic ID `legacy-adjustment-line:<adjustmentId>`;
- unique transaction/line/movement links prevent duplicates;
- rerun accepts an existing row only when every mapped field matches;
- movement link update requires both new link columns to be null or already exactly matching;
- no count-only “success” can hide field divergence.

## Validation Queries

Required per organization and globally:

```text
legacy posted, non-deleted adjustment count
canonical backfilled Adjustment transaction count
canonical backfilled line count
legacy source movement count
linked movement count
orphan transaction/line/movement count
duplicate transaction number or reversal count
cross-tenant relation mismatch count
delta mismatch count
movement resulting-quantity mismatch count
running movement chain versus StockBalance mismatch count
transfer pair count/sum mismatch count after new writes
```

All mismatch counts must be zero. Counts alone are insufficient; sample hashes and exact aggregate sums by `(orgId, productId, warehouseId)` are required.

## Application Compatibility

- Existing adjustment list/detail IDs remain valid because backfilled transaction IDs equal adjustment IDs.
- Data Table V2 filters, pagination, selection, and row actions map to canonical query fields.
- Existing adjustment modal/detail becomes a read-only canonical detail presenter.
- Existing adjustment export keeps its filename/column contract while reading the canonical projection.
- Dashboard reads both legacy movement vocabulary and new movement types.
- Process Flow remains “planned” until the complete package passes.
- Reset/provision scripts must delete/create in foreign-key-safe order and create the canonical V2 sequence only after separate approval.
- Existing event consumers continue receiving movement/balance facts; old adjustment-created event may remain as a compatibility event only for legacy POST delegation during one release.

## Failure and Rollback

Before new canonical writes:

- disable the feature;
- roll application code back;
- if necessary, remove only verified backfill links/rows through an approved down/forward script;
- leave legacy adjustments/movements/balances untouched.

After any new canonical write, dropping tables is destructive and forbidden. Disable new UI/writes, preserve all new data, and forward-fix. Rolling back to code that knows only `StockAdjustment` would hide receipts/issues/transfers and is not an acceptable recovery.

Backfill batches can be retried after correcting a rejected data condition. Never delete or rewrite posted movements as rollback.

## Environment Run Order

1. Disposable empty database migration test.
2. Copy of current controlled demo database.
3. Two-organization fixture with cross-tenant attack cases.
4. Sandbox dry run, backup verification, execute, reconcile, and rollback rehearsal before feature enablement.
5. Staging with production-like volume and query plans.
6. Separate Founder/operations approval for production backup, maintenance/lock window, migration deploy, backfill, verification, and feature enablement.

No migration, backfill, database command, demo reset, or data mutation occurred during V2-6A.
