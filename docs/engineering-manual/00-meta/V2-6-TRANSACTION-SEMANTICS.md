# V2-6 Transaction Semantics

Status: Frozen
Date: 2026-07
Implementation Allowed: No

## Lifecycle Decision

Recommend Option A: posted-only with safe reversal.

```text
POSTED -> REVERSED
```

Creation posts atomically. There are no drafts, edits, approvals, deletes, or partially posted transactions. This is the smallest honest lifecycle for the controlled demo and matches the frozen statement that posted transactions are immutable.

| Status | Editable fields | Transition and actor | API/UI behavior | Audit, events, and stock behavior |
| --- | --- | --- | --- | --- |
| `POSTED` | None | Reverse to `REVERSED` only by a caller with the type-specific reverse permission | Create returns `201`; detail is read-only; there is no PATCH/DELETE; UI offers Reverse only when permitted | `postedAt/postedByUserId`; one type-specific posted fact; immutable movements and current balances reflect the post |
| `REVERSED` | None | Terminal; no second reversal and no reversal-of-reversal | Detail remains read-only and visibly links to the reversal; create/edit/delete actions are absent | Reversal date, actor, and reason derive from the linked posted reversal; original movements remain and new inverse movements/balances record reversal |

Posting and reversing users/timestamps are server-derived. `referenceNumber`, `referenceDate`, notes, lines, parties, Warehouses, and reasons cannot be edited after posting. A correction is a new transaction.

## Atomic Posting Foundation

Every post:

1. authenticates and resolves verified module context;
2. requires the exact operation permission and required shared-object read permissions;
3. strictly validates the discriminated request and rejects `orgId`, audit fields, status, deltas, results, and unknown keys;
4. validates active tenant-owned Product, Warehouse, Supplier, and Customer references;
5. rejects duplicate Products and normalizes a deterministic line order;
6. executes all line, movement, and balance writes in one Prisma 7 serializable database transaction;
7. retries only known serialization/write-conflict failures, with a maximum of three total attempts using the same idempotency key;
8. returns no partial result;
9. commits before emitting events.

Balance rows are processed in stable `(productId, warehouseId)` order. The implementation must use the SDK-approved Prisma 7 transaction boundary with serializable isolation. A plain read-then-write transaction at default isolation is insufficient because concurrent issues can oversell stock. Validation, permission, and domain failures are never retried. If supported Prisma/PostgreSQL behavior cannot provide the guarantee, implementation stops for review.

`Idempotency-Key` is required for create and reverse POSTs. The server stores a key hash plus a normalized request hash. Reuse with the same request returns the original successful result; reuse with a different request returns stable `IDEMPOTENCY_KEY_REUSED`. Absence returns `IDEMPOTENCY_KEY_REQUIRED`. Keys and hashes are internal, never exported, and nullable only for migrated legacy rows.

## Receipt

Input:

- destination represented by `warehouseId`;
- optional `supplierId`;
- optional external `referenceNumber`;
- optional date-only `referenceDate`;
- optional notes;
- one or more Product lines with positive quantities and optional notes.

The server validates Supplier when present, Warehouse, every Product, tracking status, and unit snapshot. It creates one posted transaction, all lines, one `receipt_in` movement per line, and creates or increments each balance. No negative-stock check is needed for a positive receipt.

## Issue

Input:

- source represented by `warehouseId`;
- optional `customerId`;
- optional recipient/reference text in `referenceNumber` or notes when no Customer exists;
- optional date-only `referenceDate`;
- one or more positive Product quantities.

The server validates Customer when present and validates every Product/Warehouse reference. It atomically proves sufficient stock for every line, creates `issue_out` movements with negative deltas, and decrements balances. One insufficient line rejects the whole transaction.

## Transfer

Input:

- `sourceWarehouseId`;
- `destinationWarehouseId`;
- optional date-only reference date;
- one or more positive Product quantities.

Source and destination must differ. For each line the service validates source stock, creates `transfer_out` with a negative delta and `transfer_in` with a positive delta, decrements source, and increments/creates destination. Both Warehouse sides and every line commit together. The sum of paired deltas per Product must be zero.

## Adjustment

The adjustment request remains counted-final-quantity based, matching the current safer contract:

```text
warehouseId
reason
referenceDate?
lines:
  productId
  countedQuantity
  notes?
```

For a multi-line adjustment, every line supplies `productId`, counted-final `quantity`, and an optional line note. Zero is allowed. The type-specific API names the field `countedQuantity` for clarity. The service reads the previous balance and computes signed delta. Clients never submit previous quantity, delta, movement type, or balance after.

Negative counted quantities and zero-delta lines are rejected. Stored transaction-line `quantity` is the counted final quantity, not the delta. Positive computed deltas create `adjustment_in`; negative computed deltas create `adjustment_out`.

## Multi-Line Failure

Validation, reference resolution, quantity computation, all transaction/line/movement inserts, and all balance writes are one unit. Any invalid or conflicting line aborts every line. No event is emitted for a rolled-back post.

## Reversal

`REVERSED` means the original stock effects remain recorded and were counteracted by a separate posting; it does not mean cancelled, erased, or deleted.

Reversal executes atomically:

1. require the matching `*.reverse` permission;
2. load the original inside the verified tenant;
3. require original status `POSTED`, no existing reversal, and not itself a reversal;
4. require a non-empty reversal reason;
5. recompute current balance safety;
6. create a new `POSTED` transaction with `reversalOfTransactionId = original.id`;
7. copy immutable reference context and lines, with inverse stock effects;
8. append reversing movements;
9. update balances;
10. set original to `REVERSED`; reversal date, actor, and reason derive from the posted reversal transaction;
11. commit, then emit reversal facts.

Receipt reversal removes the originally received quantities and can fail if later consumption leaves insufficient stock. Issue reversal adds quantities. Transfer reversal moves stock from the original destination back to the original source and can fail if destination stock is insufficient. Adjustment reversal applies the inverse signed delta and can fail when reversing a positive adjustment would create negative stock.

The reversal transaction uses the same transaction type, a `REV` number, and an explicit reversal link. It is not independently reversible in V2-6. Double reversal returns `409`. If a reversal was incorrect, post a new normal corrective transaction. Posted movements are never edited or deleted.

UI wording is **Reverse transaction**, not Delete or Void. Confirmation shows stock impact and requires a reason. Detail and export show `Posted`, `Reversed`, or `Reversal of <number>` while persisted status is `POSTED`/`REVERSED`.

## Transaction Numbering

Use a server-generated non-sequential display number, not a counter model:

```text
REC-2026-0123456789ABCDEF
ISS-2026-0123456789ABCDEF
TRF-2026-0123456789ABCDEF
ADJ-2026-0123456789ABCDEF
REV-2026-0123456789ABCDEF
```

Normal prefixes come from type; every reversal uses `REV`. Year comes from server posting time in UTC. The suffix is exactly 16 uppercase hexadecimal characters from cryptographically strong server randomness. The database enforces `(orgId, transactionNumber)` uniqueness. Generation retries a unique collision at most three times and never accepts a client-generated number.

This avoids a counter table, lock contention, gap semantics, and retry ambiguity. Numbers are display/reference data, never authorization, and intentionally not sequential.

## Reference Date

`referenceDate` is optional external document/business metadata stored as date-only where supported. It may be historical but may not be later than the current UTC calendar date plus one day. Server-owned `postedAt` determines actual posting time, UTC number year, and movement chronology; reference date never backdates ledger creation.

## Permission Plan

Add exact permissions:

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

Rules:

- retain `inventory.stock_level.*` and `inventory.stock_movement.*`;
- migrate existing `inventory.stock_adjustment.read/create/export` grants idempotently to adjustment read/create and transaction export as applicable;
- do not automatically grant any reverse permission;
- do not add a wildcard grant;
- existing Org Admin wildcard behavior continues through the standard permission matcher and never bypasses tenant/module gates;
- export remains separate from read;
- transaction creation also requires `objects.product.read` and `objects.warehouse.read`;
- Receipt with Supplier requires `objects.supplier.read`;
- Issue with Customer requires `objects.customer.read`;
- transaction DTOs must redact shared-object identity a caller cannot read.

The approved Warehouse Operator profile adds read/create for receipts, issues, transfers, and adjustments plus `objects.customer.read`, while retaining current Product, Category, Supplier, Warehouse, stock-level, and movement access. It receives no reverse, transaction export, Product-setting update, shared-record mutation, Organization admin, wildcard, or admin permission. Grants are applied idempotently.

## Event Plan

Canonical transaction-level facts:

```text
inventory.receipt.posted
inventory.issue.posted
inventory.transfer.posted
inventory.adjustment.posted
inventory.transaction.reversed
```

Continue:

```text
inventory.stock_movement.created
inventory.stock_balance.updated
inventory.stock_level.reorder_threshold_crossed
```

One type-specific transaction event is emitted per post. A transfer emits one `inventory.transfer.posted` fact plus two movement facts and affected balance facts per line. Do not also emit a generic posted event in V2-6; this avoids double processing while preserving the frozen type-specific direction.

Minimal payloads contain transaction ID/number, line count, reference IDs required by the fact, signed quantities as strings, and actor ID where required. They contain no `orgId`, full record, names, email/address, request body, secret, or permission data.

Events are emitted only after commit. Current infrastructure is Founder-approved best-effort delivery for V2-6 MVP and has no outbox: an emitter failure is safely logged with request/transaction context and does not roll back stock. No external integration may treat delivery as guaranteed. Before any real external consumer, notification, accounting integration, or cross-system workflow, a separate Durable Outbox ADR/package is mandatory.

## API Contract

Recommend type-specific create/list routes backed by the unified model and service:

```text
GET  /api/orgs/[orgSlug]/inventory/transactions/receipts
POST /api/orgs/[orgSlug]/inventory/transactions/receipts
GET  /api/orgs/[orgSlug]/inventory/transactions/issues
POST /api/orgs/[orgSlug]/inventory/transactions/issues
GET  /api/orgs/[orgSlug]/inventory/transactions/transfers
POST /api/orgs/[orgSlug]/inventory/transactions/transfers
GET  /api/orgs/[orgSlug]/inventory/transactions/adjustments
POST /api/orgs/[orgSlug]/inventory/transactions/adjustments
GET  /api/orgs/[orgSlug]/inventory/transactions/[id]
POST /api/orgs/[orgSlug]/inventory/transactions/[id]/reverse
```

Type-specific POST schemas prevent invalid nullable-field combinations before the service. Lists remain type-specific for permissions and sidebar pages. Detail and reverse are unified because identity and lifecycle are unified.

All routes use standard JSON envelopes, strict Zod, safe `401/403/404/409/422`, module-disabled `404`, no redirects/raw errors, and no client `orgId`. Create/reverse require `Idempotency-Key`. Relation IDs are revalidated in-tenant even when they came from an authorized picker.

Legacy routes remain temporarily:

- GET/list/detail adjustments project canonical Adjustment transactions;
- POST stock-adjustments delegates the legacy counted-final request to canonical Adjustment posting;
- legacy export projects canonical Adjustment transactions;
- backfilled transaction IDs equal legacy adjustment IDs so existing detail URLs continue to resolve.

## UI and Navigation

Freeze the sidebar exactly as:

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

Each type gets a Data Table V2 list, compact operational header, permission-aware Create action, URL-addressable create/detail modal, and direct full-page fallback. Posted details are read-only. Reverse is permission-aware and uses a confirmation modal. No edit route is created.

Form fields:

- Receipt: reference date/number, optional Supplier, destination Warehouse, Product/quantity/note lines, notes.
- Issue: reference date/number, optional Customer, source Warehouse, Product/quantity/note lines, notes.
- Transfer: reference date/number, source and destination Warehouses, Product/quantity/note lines, notes.
- Adjustment: reference date/number, target Warehouse, reason, Product/counted-final-quantity/note lines, notes.

## Dashboard and Process Flow

Movement Trend:

- receipt is organization-wide inbound;
- issue is organization-wide outbound;
- adjustment follows signed delta;
- transfer is excluded from organization-wide inbound/outbound totals because paired movements net to zero;
- Warehouse-filtered views show transfer-out and transfer-in for the relevant Warehouse.

Exact mapping is `receipt_in` inbound, `issue_out` outbound, `adjustment_in` inbound, `adjustment_out` outbound, `reversal_in/out` by actual direction, and `transfer_in/out` excluded organization-wide. Legacy `opening_balance` remains a separately labeled historical/demo input.

The Process Flow can mark Receipt, Issue, Transfer, Adjustment, Transactional Posting, Balance, and Ledger as implemented only after schema migration, service/API/UI, demo, and acceptance gates pass. Until then, existing planned labels remain.

## Export Impact

Add bounded transaction exports using V2-5 infrastructure:

- type-specific transaction list export;
- optional line export as a separately explicit resource;
- 10,000 filtered-row and 1,000 selected-ID limits;
- `inventory.transaction.export` plus relevant transaction read permission;
- no internal IDs, tenant IDs, idempotency hashes, request hashes, or raw actor IDs;
- include number, type, status/presentation, reference date/number, shared labels when permitted, Warehouse labels, reason/notes as approved, line Product/code/unit/quantity, posted/reversed timestamps, and reversal number;
- preserve spreadsheet-injection defense and safe filenames.

Legacy adjustment export remains a compatibility projection until its route is explicitly retired.

## Canonical Demo V2 Data Plan

Do not mutate demo data during V2-6A. During approved V2-6 implementation, retain Main Warehouse and add `AUX` / Secondary Warehouse plus Demo Customer. Backfill the existing nine adjustments first, then post:

| Step | Water Main/Aux | Tea Main/Aux | Coffee Main/Aux |
| --- | --- | --- | --- |
| Backfilled starting balances | 120 / 0 | 35 / 0 | 8 / 0 |
| Receipt from Demo Supplier | +30 | +15 | +12 |
| Issue to Demo Customer | -20 | -10 | -4 |
| Transfer Main → Aux | -10 / +10 | -5 / +5 | -3 / +3 |
| Adjustment counted Main final | unchanged | unchanged | Main 13 → 5 |
| Expected final | 120 / 10 | 35 / 5 | 5 / 3 |

Organization totals end at Water 130, Tea 40, Coffee 8. Coffee remains below its reorder point of 10. Every movement chain must reconcile to each Warehouse balance and every transfer pair must net to zero.
