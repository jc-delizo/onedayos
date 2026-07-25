# ADR-0021: Inventory Transaction Lifecycle and Reversal

Status: Accepted
Date: 2026-07
Implementation Allowed: Only one explicitly authorized V2-6 subpackage at a time

## Founder Clarification — 2026-07-25

Prompt 53 amends this accepted decision without reopening it. Create transactions contain 1–100
lines. Receipt/Issue reversal retain Warehouse/applicable party and copy positive line quantities.
Transfer reversal swaps source/destination and copies positive quantities. Adjustment reversal
uses the inverse of each exact canonical movement and stores the resulting counted-final quantity,
not the original line quantity. Reversals copy reference number/date and line metadata, use the new
reason/current actor/time, and omit original transaction notes.

## Context

ADR-0020 froze a unified `InventoryTransaction`/`InventoryTransactionLine` direction but did not fully decide lifecycle, Warehouse field shape, reversal records, movement linkage, numbering, idempotency, concurrency, or legacy compatibility. The Founder approved and amended the V2-6A review through Prompt 47.

## Decision

### Model and lifecycle

- Use unified transaction and line models for `RECEIPT`, `ISSUE`, `TRANSFER`, and `ADJUSTMENT`; do not add a fifth reversal type, per-type model families, or generic Party.
- Use stable `POSTED` and `REVERSED` Prisma statuses. There are no Draft or Approval states.
- Creation posts atomically. Posted transactions, lines, and movements cannot be edited, soft-deleted, or hard-deleted.
- Reverse by creating one separate `POSTED` transaction of the original business type, linked through `reversalOfTransactionId`, appending inverse movements, updating balances, and transitioning the original to `REVERSED` atomically.
- A transaction can be reversed once. A reversal cannot be reversed. An incorrect reversal is corrected with a new normal transaction.
- Reversal date, actor, and reason derive from the linked reversal transaction; duplicate `voided*`/`reversed*` audit fields are not stored on the original.

### Warehouse, line, and movement shape

- Receipt, Issue, and Adjustment require generic `warehouseId`; Transfer requires different source/destination Warehouses and forbids generic Warehouse.
- Supplier is optional only for Receipt; Customer is optional only for Issue.
- Each line retains shared `productId` and snapshots required Product `unit`; no Product code/name snapshot is added.
- Receipt, Issue, and Transfer line quantity is positive operational quantity.
- Adjustment line quantity is the non-negative counted final quantity, including zero. The server derives previous balance, signed delta, movement direction, and result.
- New movements populate nullable canonical transaction and line IDs. Composite relations must prove movement, transaction, line, and organization consistency.
- Preserve `sourceType/sourceId` and `opening_balance` for compatibility. New movement vocabulary is `receipt_in`, `issue_out`, `transfer_out`, `transfer_in`, `adjustment_in`, `adjustment_out`, `reversal_in`, and `reversal_out`.

### Commands and concurrency

- Create/post and reverse require `Idempotency-Key`. Store only organization-scoped key hash and normalized request hash; nullable values exist only for legacy backfill.
- Same key/request replays the original successful result; different request returns `IDEMPOTENCY_KEY_REUSED`; absence returns `IDEMPOTENCY_KEY_REQUIRED`.
- Posting uses Prisma 7 serializable transactions and at most three attempts for known serialization/write-conflict failures only.
- Generate numbers server-side as `REC|ISS|TRF|ADJ|REV-{UTC_YEAR}-{16 uppercase hex}` with at most three collision attempts. Reversals always use `REV`; numbers are not authorization.
- Optional `referenceDate` is date-only external metadata, accepts history, and may not exceed current UTC calendar date plus one day. `postedAt` controls actual chronology and number year.

### Events, permissions, and compatibility

- Events are best-effort after commit for V2-6 MVP. Failure is safely logged and never rolls back committed stock. Guaranteed external consumption requires a separate Durable Outbox ADR/package.
- Keep StockAdjustment read-only during expand-contract migration; backfill valid history, link movements once, preserve routes/exports, and remove legacy structures only later. Invalid/ambiguous history stops without silent repair.
- Use type-specific list/create APIs plus unified detail/reverse.
- Add explicit per-type read/create/reverse permissions and `inventory.transaction.export`.
- Warehouse Operator receives type read/create and `objects.customer.read`, but no reverse, export, wildcard/admin, Organization admin, Product-setting update, or shared-record mutation grant.

### Staged implementation

Freeze order:

```text
V2-6B Schema, Migration, and Backfill Foundation
V2-6C Posting Engine, APIs, Permissions, Events, and Compatibility Reads
V2-6D UI, Modals, Navigation, Exports, Demo Cutover, and Acceptance
```

Only V2-6B is eligible for explicit Founder authorization next. This ADR acceptance does not itself authorize implementation, migration execution, or data mutation.

## Consequences

- The schema and migration are additive first; legacy cleanup is deferred.
- Receipt and applicable reversal operations can fail when later stock use makes reversal unsafe.
- Numbers are intentionally non-sequential.
- Transfer movements are excluded from organization-wide inbound/outbound totals; reversal movement types map by actual direction.
- Production rollback after canonical writes is feature disable plus forward-fix, not destructive schema reversal.

## Alternatives Rejected

- Void-oriented, Draft, Approval, destructive cancellation, or editable posted history.
- Mutating original movements or adding a `REVERSAL` transaction type.
- Permanent StockAdjustment subtype, generic Party, per-type transaction tables, or counter model.
- Guaranteed-delivery claims without a durable outbox.
- One uncontrolled V2-6 implementation change set.

## Boundary

No application, Prisma, migration, data, permission, API, event, UI, dependency, caching, accent, asset, module, or Platform Service implementation is completed or authorized by this governance ADR alone.
