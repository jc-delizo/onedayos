# V2-6 Founder Decision Report

Status: Frozen
Date: 2026-07
Decision Authority: OneDayOS Founder
Implementation Allowed: One subpackage at a time; only V2-6B is eligible for explicit authorization next

V2-6 direction is approved.

Implementation is authorized one subpackage at a time.

Only V2-6B is eligible for explicit Founder authorization next.

## Approved Model and Lifecycle

- Use unified `InventoryTransaction` and `InventoryTransactionLine`.
- Types are `RECEIPT`, `ISSUE`, `TRANSFER`, and `ADJUSTMENT`.
- Statuses are `POSTED` and `REVERSED`; no Void, Draft, or Approval state.
- Posted history is immutable and not deleted.
- Reversal is a separate posted transaction of the original business type with `reversalOfTransactionId`; original becomes `REVERSED`.
- One reversal per original; reversal-of-reversal is forbidden. An incorrect reversal requires a new normal corrective transaction.
- Reversal reason is required. Date, actor, and reason derive from the posted reversal transaction.
- Reversal transaction numbers use `REV`; there is no fifth transaction type.

## Approved Field Semantics

- Receipt, Issue, and Adjustment use required `warehouseId`.
- Transfer forbids generic Warehouse and requires different source and destination Warehouses.
- Supplier is optional only for Receipt; Customer is optional only for Issue.
- Product remains shared. Each line stores `productId` and a required historical unit snapshot; no code/name snapshot is needed.
- Receipt, Issue, and Transfer quantities are positive.
- Adjustment line quantity is counted final quantity, may be zero, and is not a delta. The server derives previous balance, signed delta, direction, and result.
- New movements require canonical transaction and line links with composite same-organization/same-transaction integrity.
- Preserve legacy `sourceType/sourceId` and `opening_balance` during transition.
- New movement values are `receipt_in`, `issue_out`, `transfer_out`, `transfer_in`, `adjustment_in`, `adjustment_out`, `reversal_in`, and `reversal_out`.

## Approved Command Safety

- `Idempotency-Key` is mandatory for create/post and reverse.
- Store only organization-scoped key hash and normalized request hash; null is legacy-only.
- Same key/request replays success; a different request returns `IDEMPOTENCY_KEY_REUSED`; a missing key returns `IDEMPOTENCY_KEY_REQUIRED`.
- Use Prisma 7 serializable transactions and at most three attempts for known serialization/write-conflict failures only.
- No partial posting, negative-stock race, or transfer quantity loss is permitted.

## Approved Number and Date

```text
REC-{UTC_YEAR}-{16 uppercase hex}
ISS-{UTC_YEAR}-{16 uppercase hex}
TRF-{UTC_YEAR}-{16 uppercase hex}
ADJ-{UTC_YEAR}-{16 uppercase hex}
REV-{UTC_YEAR}-{16 uppercase hex}
```

Numbers are generated with cryptographically strong server randomness, unique per organization, retried at most three times on collision, non-sequential, and never authorization.

`referenceDate` is optional date-only external metadata. It may be historical but cannot exceed current UTC calendar date plus one day. Server `postedAt` owns chronology and number year.

## Event Boundary

Best-effort post-commit events are approved for V2-6 MVP only. Failed transactions emit nothing. Event failure is safely logged and does not roll back committed stock. No guaranteed-delivery claim or dependent external integration is allowed. A separate Durable Outbox ADR/package is mandatory before any guaranteed external consumer.

## Compatibility and Migration

- Keep StockAdjustment temporarily read-only.
- Add canonical models and nullable links before cutover.
- Backfill only valid, unambiguous history and link each legacy movement exactly once.
- Preserve legacy routes and export projection.
- Switch new writes only after cutover gates.
- Remove legacy model/fields only in a later approved cleanup migration.
- Any invalid or ambiguous history stops; no silent repair.
- Sandbox migration/backfill requires separate explicit operator approval.

## APIs and Permissions

Approved type-specific list/create routes:

```text
/inventory/transactions/receipts
/inventory/transactions/issues
/inventory/transactions/transfers
/inventory/transactions/adjustments
```

Approved unified detail/reverse:

```text
/inventory/transactions/[id]
/inventory/transactions/[id]/reverse
```

Strict Zod, verified PlatformContext, module/permission checks, JSON envelopes, safe errors, tenant reference validation, no client `orgId`, idempotency, and atomic posting are mandatory.

Add exact per-type read/create/reverse permissions plus `inventory.transaction.export`. Org Admin wildcard remains unchanged.

Warehouse Operator receives type read/create plus `objects.customer.read` and retains current shared Product/Category/Supplier/Warehouse and stock read access. It receives no reverse, export, wildcard/admin, Organization admin, Product-setting update, or shared-record mutation permission. Legacy adjustment grants migrate idempotently; reverse/export are never inferred.

## Dashboard, Process Flow, Export, and Demo

- Dashboard: Receipt inbound, Issue outbound, Adjustment by computed delta, Reversal by actual inverse direction, Transfer excluded from organization-wide inbound/outbound, and `opening_balance` separately labeled.
- Process Flow moves Receipt/Issue/Transfer to Current only after complete V2-6 acceptance.
- Transaction export uses explicit `inventory.transaction.export`; Warehouse Operator does not receive it. Legacy adjustment export remains compatible.
- Canonical demo adds Secondary Warehouse, Demo Customer, one of every transaction type, and exact reconciliation.

Final balances:

| Product | Main | Secondary | Organization total |
| --- | ---: | ---: | ---: |
| Water | 120 | 10 | 130 |
| Tea | 35 | 5 | 40 |
| Coffee | 5 | 3 | 8 |

Coffee remains low against reorder point 10.

## Staged Package Order

1. V2-6B — Schema, Migration, and Backfill Foundation.
2. V2-6C — Posting Engine, APIs, Permissions, Events, and Compatibility Reads.
3. V2-6D — UI, Modals, Navigation, Exports, Demo Cutover, and Acceptance.

V2-6C is blocked until V2-6B acceptance. V2-6D is blocked until V2-6C acceptance. Legacy cleanup is later.

## Forbidden Scope and Release Status

No Purchase Orders, Sales Orders, accounting, valuation/costing, approvals, notifications, lots/serials/expiry/bins, attachments, background jobs, caching, accents, import engine, new business module, Platform Service, or website asset production.

V2-6 governance approval is not public self-service demo approval and is not production readiness. Website asset production remains paused.
