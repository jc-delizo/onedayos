# V2-6 Schema and Migration Review

Status: Frozen
Date: 2026-07
Implementation Allowed: No

## Review Boundary

This is a documentation-only V2-6A review. It does not authorize or make a Prisma schema, migration, application, permission, API, UI, dependency, or database change.

The review started from commit `6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b`, with `inventory-demo-v2-v2.5-checkpoint` resolving to the same commit. The initial worktree contained one expected, Founder-authorized, untracked task-input file:

```text
docs/engineering-manual/prompts/CODEX_PROMPT_46_V2_6A_SCHEMA_MIGRATION_REVIEW.md
```

That file was not modified, deleted, staged, or committed. There were no unexpected project changes.

## Authority Resolution

The exact Prompt 46 filenames `06-data/00-prisma-schema-strategy.md`, `06-data/02-migrations.md`, and `06-data/04-indexing-performance.md` do not exist. Their current canonical coverage is in:

- `06-data/00-database-architecture.md`;
- `06-data/02-prisma-conventions.md`;
- `06-data/04-migrations-seeding.md`;
- `15-deployment-operations/03-database-migrations-production.md`.

No substantive authority conflict was found. The data manual prefers strings for unstable module workflow states but permits database enums when a lifecycle is stable and worth enforcing. The frozen four transaction types and the proposed two-state terminal lifecycle meet that exception. ADR-0021 records the decision for Founder review.

## Current Inventory Data Model

### `InventoryProductExtension`

| Field | Current definition |
| --- | --- |
| Identity/tenant | `id String @id @default(cuid())`, `orgId String`, `productId String` |
| Configuration | `reorderPoint Decimal(18,4) @default(0)`, `isStockTracked Boolean @default(true)` |
| Audit/lifecycle | `createdAt`, `updatedAt`, nullable `deletedAt`, `deletedBy` |
| Uniques | `(orgId, productId)` and `(productId, orgId)` |
| Indexes | `(orgId, isStockTracked)`, `(orgId, deletedAt)` |
| Foreign keys | Organization cascades; composite Product relation restricts deletion |

### `StockBalance`

| Field | Current definition |
| --- | --- |
| Identity/tenant | `id`, `orgId`, `productId`, `warehouseId` |
| State | `quantity Decimal(18,4) @default(0)` |
| Audit | `updatedAt` only |
| Unique | `(orgId, productId, warehouseId)` |
| Indexes | `(orgId, warehouseId)`, `(orgId, productId)` |
| Foreign keys | Organization cascades; composite Product and Warehouse relations restrict deletion |

Current quantity is stored as one mutable current-state row per organization, Product, and Warehouse.

### `StockMovement`

| Field | Current definition |
| --- | --- |
| Identity/tenant | `id`, `orgId`, `productId`, `warehouseId` |
| Ledger fact | string `type`, signed `quantityDelta Decimal(18,4)`, nullable `resultingQuantity Decimal(18,4)` |
| Traceability | nullable string `sourceType`, `sourceId`, `reason` |
| Audit | `occurredAt @default(now())`, `createdBy`, `createdAt @default(now())` |
| Indexes | `(orgId, productId, occurredAt)`, `(orgId, warehouseId, occurredAt)`, `(orgId, sourceType, sourceId)` |
| Foreign keys | Organization cascades; composite Product/Warehouse restrict; User actor is ID-only and restricts |

The current service writes `opening_balance`, `adjustment_in`, or `adjustment_out`. Query validation also accepts legacy `manual_in` and `manual_out`. Direction is represented by both the string type and the sign of `quantityDelta`.

The movement ledger is immutable by service, API, UI, and module-document contract, but not by a database constraint. Prisma could technically update or delete a movement.

### `StockAdjustment`

| Field | Current definition |
| --- | --- |
| Identity/tenant | `id`, `orgId`, `productId`, `warehouseId` |
| Quantities | `quantityBefore`, `quantityAfter`, `quantityDelta`, all Decimal(18,4) |
| Explanation | required `reason`, nullable `notes` |
| Status | string `status @default("posted")` |
| Audit/lifecycle | `createdBy`, `createdAt`, `updatedAt`, nullable `deletedAt`, `deletedBy` |
| Indexes | `(orgId, productId, createdAt)`, `(orgId, warehouseId, createdAt)`, `(orgId, createdBy)`, `(orgId, deletedAt)` |
| Foreign keys | Organization cascades; composite Product/Warehouse restrict; User actor is ID-only and restricts |

Before and after quantities exist on `StockAdjustment`; `StockMovement` stores the delta and resulting quantity. There is no direct `stockAdjustmentId` column or Prisma relation. Linkage is polymorphic text: `StockMovement.sourceType = "stock_adjustment"` and `sourceId = StockAdjustment.id`.

The application exposes create, list, detail, and export only. Posted adjustments are read-only in current UI/service/API contracts. The schema itself does not prevent update or soft delete.

### Shared Relations

- Organization owns all current Inventory records.
- Product owns Inventory extension, balance, movement, and adjustment relations.
- Warehouse owns balance, movement, and adjustment relations.
- User identifies movement/adjustment actor through `createdBy`.
- Supplier and Customer currently have no Inventory relation.
- Product, Supplier, Customer, and Warehouse have `@@unique([id, orgId])`; User does not, so V2-6 needs an additive User composite unique before tenant-safe composite actor relations can be added.

## Current Posting Logic

`InventoryService.createStockAdjustment` currently executes in this exact order:

1. Require Inventory module enablement and `inventory.stock_adjustment.create`.
2. Parse the requested counted final quantity and reject a negative result before opening a transaction.
3. Open one Prisma interactive transaction.
4. Validate active, non-deleted Product in `ctx.org.id`.
5. Validate active, non-deleted Warehouse in `ctx.org.id`.
6. Find the Inventory Product extension; create a default tracked extension when absent; reject an untracked Product.
7. Find the current Product/Warehouse balance; absence means zero.
8. Compute `quantityDelta = requested quantityAfter - current quantity`.
9. Reject a zero delta.
10. Create a posted `StockAdjustment`.
11. Derive movement type and create one `StockMovement`.
12. Create or update `StockBalance`.
13. Build adjustment, movement, balance, extension, and reorder-threshold event facts.
14. Commit the transaction.
15. Emit queued events sequentially after commit.

Any validation or write failure rolls back all database writes. No event is emitted before commit. An event-emitter failure after commit cannot roll back the committed stock mutation; current infrastructure has no transactional outbox.

Reusable behavior includes verified `PlatformContext`, module/permission gates, strict tenant validation, four-decimal integer-unit arithmetic, server-derived before/delta/result, tracked-Product checks, atomic write grouping, safe DTOs, post-commit events, and reorder-threshold logic.

Logic requiring replacement or hardening includes single-line-only posting, adjustment-only validation, non-locking read/then-write concurrency, string-only transaction identity, polymorphic movement linkage, non-durable event delivery, and lack of reversal semantics.

## Frozen Field-Shape Decision

Use one generic `warehouseId` for receipt, issue, and adjustment, and `sourceWarehouseId` plus `destinationWarehouseId` only for transfer.

This is clearer than forcing an adjustment into a directional source/destination field, and smaller than per-type subtype tables. Type-specific service and SQL checks make nullable-field combinations safe.

## Exact Frozen Prisma Excerpt

This excerpt is a review artifact, not an edit to `prisma/schema.prisma`.

```prisma
enum InventoryTransactionType {
  RECEIPT
  ISSUE
  TRANSFER
  ADJUSTMENT
}

enum InventoryTransactionStatus {
  POSTED
  REVERSED
}

model InventoryTransaction {
  id                       String                     @id @default(cuid())
  orgId                    String
  type                     InventoryTransactionType
  status                   InventoryTransactionStatus @default(POSTED)
  transactionNumber        String
  referenceNumber          String?
  referenceDate            DateTime?                   @db.Date
  supplierId               String?
  customerId               String?
  warehouseId              String?
  sourceWarehouseId        String?
  destinationWarehouseId   String?
  reason                   String?
  notes                    String?
  postedAt                 DateTime                   @default(now())
  postedByUserId           String
  reversalOfTransactionId  String?
  idempotencyKeyHash       String?
  requestHash              String?
  createdAt                DateTime                   @default(now())
  updatedAt                DateTime                   @updatedAt

  org                  Organization          @relation(fields: [orgId], references: [id], onDelete: Cascade)
  supplier             Supplier?             @relation(fields: [supplierId, orgId], references: [id, orgId], onDelete: Restrict)
  customer             Customer?             @relation(fields: [customerId, orgId], references: [id, orgId], onDelete: Restrict)
  warehouse            Warehouse?            @relation("InventoryTransactionWarehouse", fields: [warehouseId, orgId], references: [id, orgId], onDelete: Restrict)
  sourceWarehouse      Warehouse?            @relation("InventoryTransactionSourceWarehouse", fields: [sourceWarehouseId, orgId], references: [id, orgId], onDelete: Restrict)
  destinationWarehouse Warehouse?            @relation("InventoryTransactionDestinationWarehouse", fields: [destinationWarehouseId, orgId], references: [id, orgId], onDelete: Restrict)
  postedBy             User                  @relation("InventoryTransactionPostedBy", fields: [postedByUserId, orgId], references: [id, orgId], onDelete: Restrict)
  reversalOf           InventoryTransaction? @relation("InventoryTransactionReversal", fields: [reversalOfTransactionId, orgId], references: [id, orgId], onDelete: Restrict)
  reversal             InventoryTransaction? @relation("InventoryTransactionReversal")
  lines                InventoryTransactionLine[]
  stockMovements       StockMovement[]

  @@unique([id, orgId])
  @@unique([orgId, transactionNumber])
  @@unique([orgId, idempotencyKeyHash])
  @@unique([reversalOfTransactionId, orgId])
  @@index([orgId, type, status, referenceDate])
  @@index([orgId, warehouseId, referenceDate])
  @@index([orgId, sourceWarehouseId, referenceDate])
  @@index([orgId, destinationWarehouseId, referenceDate])
  @@index([orgId, supplierId, referenceDate])
  @@index([orgId, customerId, referenceDate])
  @@index([orgId, postedByUserId, postedAt])
  @@map("inventory_transactions")
}

model InventoryTransactionLine {
  id             String   @id @default(cuid())
  orgId          String
  transactionId  String
  productId      String
  quantity       Decimal  @db.Decimal(18, 4)
  unit           String
  lineNumber     Int
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  org            Organization         @relation(fields: [orgId], references: [id], onDelete: Cascade)
  transaction    InventoryTransaction @relation(fields: [transactionId, orgId], references: [id, orgId], onDelete: Restrict)
  product        Product              @relation(fields: [productId, orgId], references: [id, orgId], onDelete: Restrict)
  stockMovements StockMovement[]

  @@unique([id, orgId])
  @@unique([id, transactionId, orgId])
  @@unique([orgId, transactionId, lineNumber])
  @@index([orgId, productId])
  @@index([orgId, transactionId])
  @@map("inventory_transaction_lines")
}
```

Required relation additions:

```prisma
// User
postedInventoryTransactions InventoryTransaction[] @relation("InventoryTransactionPostedBy")
@@unique([id, orgId])

// Product
inventoryTransactionLines InventoryTransactionLine[]

// Supplier
inventoryTransactions InventoryTransaction[]

// Customer
inventoryTransactions InventoryTransaction[]

// Warehouse
inventoryTransactions            InventoryTransaction[] @relation("InventoryTransactionWarehouse")
sourceInventoryTransactions      InventoryTransaction[] @relation("InventoryTransactionSourceWarehouse")
destinationInventoryTransactions InventoryTransaction[] @relation("InventoryTransactionDestinationWarehouse")

// Organization
inventoryTransactions     InventoryTransaction[]
inventoryTransactionLines InventoryTransactionLine[]

// StockMovement
inventoryTransactionId     String?
inventoryTransactionLineId String?
inventoryTransaction       InventoryTransaction?     @relation(fields: [inventoryTransactionId, orgId], references: [id, orgId], onDelete: Restrict)
inventoryTransactionLine   InventoryTransactionLine? @relation(fields: [inventoryTransactionLineId, inventoryTransactionId, orgId], references: [id, transactionId, orgId], onDelete: Restrict)
@@index([orgId, inventoryTransactionId])
@@index([orgId, inventoryTransactionLineId])
```

`unit` is snapshotted from Product during posting. Deriving it forever would rewrite history when a Product unit changes. Client input must not control this snapshot.

`InventoryTransactionLine` must additionally declare `@@unique([id, transactionId, orgId])`. The three-column movement-to-line relation then proves that the linked line belongs to the same canonical transaction and organization as the movement. A migration-level check requires transaction and line link columns to be both null for legacy-unlinked rows or both non-null for canonical rows.

`quantity` is positive for Receipt, Issue, and Transfer. For Adjustment it stores the counted final quantity and may be zero. The service reads the previous balance and computes the signed movement delta. Clients never submit previous quantity, delta, or balance-after fields.

No soft-delete fields are proposed. Posted operational history is retained and reversed, never hidden or deleted.

## Type-Specific Invariants

| Type | Required | Must be absent | Quantity rule |
| --- | --- | --- | --- |
| Receipt | `warehouseId`; one or more lines | source/destination Warehouse, Customer | every line `> 0`; Supplier optional |
| Issue | `warehouseId`; one or more lines | source/destination Warehouse, Supplier | every line `> 0`; Customer optional |
| Transfer | different source and destination Warehouses; one or more lines | generic Warehouse, Supplier, Customer | every line `> 0` |
| Adjustment | `warehouseId`; reason; one or more counted-final inputs | source/destination Warehouse, Supplier, Customer | counted final quantity `>= 0`; computed delta must be non-zero |

All referenced records must share `ctx.org.id`, be active where applicable, and not be soft-deleted. Duplicate Product lines are rejected rather than silently aggregated. Line numbers are contiguous from 1. `referenceDate` is optional date-only external/business metadata. It may not exceed the current UTC calendar date plus one day and never changes server-owned posting or movement timestamps.

Prisma cannot express all cross-field/type invariants. Strict Zod discriminated unions and service checks are mandatory. Migration SQL should also add:

- a transaction type/warehouse/reference `CHECK`;
- `sourceWarehouseId <> destinationWarehouseId`;
- `lineNumber > 0`;
- type-aware line quantity checks where safely expressible without a parent-table lookup;
- paired-null checks for `idempotencyKeyHash` and `requestHash`.

Line semantics by parent type, one reversal per original, original/reversal status consistency, and final balance safety remain transactional service invariants. Movement-to-line transaction and tenant consistency is enforced by the composite relation and revalidated by the service.

## Movement Linkage

Add nullable composite links from each movement to its canonical transaction and line. For transfer, each line creates exactly two movements: `transfer_out` at source and `transfer_in` at destination. Receipt creates `receipt_in`; issue creates `issue_out`; adjustment creates `adjustment_in` or `adjustment_out`; reversal creates `reversal_in` or `reversal_out`.

Retain historical `opening_balance` plus `adjustment_in` and `adjustment_out`. `opening_balance` remains valid for migrated history but new opening-balance corrections use an Adjustment transaction. Although the current query validator accepts `manual_in/manual_out`, those values are not in the Founder-approved V2-6 vocabulary; any persisted occurrence stops backfill for explicit review rather than being silently remapped.

Current `sourceType` and `sourceId` remain during compatibility. There is no current `stockAdjustmentId` field to retain. New V2-6 movements use direct transaction/line links and may also populate `sourceType = "inventory_transaction"` and `sourceId = transaction.id` for one compatibility release. Remove polymorphic source fields only in a later contract migration after read/export/event consumers prove they no longer depend on them.

Movement rows and their direct links are immutable after insert.

## Redundancy After V2-6

After verified migration and a later contract package:

- `StockAdjustment.quantityBefore/After/Delta` duplicate canonical transaction line plus movement history;
- `StockAdjustment.status`, actor, reason, notes, and timestamps duplicate transaction fields;
- `StockMovement.sourceType/sourceId` duplicate direct transaction/line relations;
- legacy movement vocabulary remains historical but is no longer written;
- `StockAdjustment.deletedAt/deletedBy` are inappropriate for immutable posted history.

No redundant field is removed in the V2-6 expand phase.

## Index and Query-Plan Review

The proposed indexes support type/status/date lists, Warehouse filters, Supplier/Customer filters, actor audit, line joins, Product history, and movement linkage. Validate with `EXPLAIN (ANALYZE, BUFFERS)` in a staging-sized data copy for:

- latest transactions by type/status/date;
- transaction detail with ordered lines and movements;
- all transactions for one Warehouse in each Warehouse role;
- Supplier receipts and Customer issues;
- Product movement history by date;
- reverse lookup from movement to transaction/line;
- filtered export count and deterministic page scans.

Do not add separate single-column indexes already covered by useful compound indexes. Large production indexes require lock-duration review and, if needed, separately reviewed concurrent SQL.

## Frozen Founder Decisions

- ADR-0021 and the stable `POSTED`/`REVERSED` enum are accepted.
- Generic Warehouse for non-transfer types and source/destination Warehouses for Transfer are accepted.
- Required Product-unit snapshots are accepted.
- Adjustment line quantity stores counted final quantity, including zero; the server computes delta.
- New movement rows must carry same-tenant, same-transaction composite transaction/line linkage.
- API-created rows require hashed idempotency key and normalized request hashes.
- Posting uses serializable transactions with bounded, known-conflict-only retries.
- Numbers use `REC|ISS|TRF|ADJ|REV-{UTC_YEAR}-{16 uppercase hex}`, with at most three collision attempts.
- Optional date-only `referenceDate` permits no later than current UTC date plus one day.
- Best-effort post-commit events are accepted for V2-6 MVP only; durable consumers require a separate Outbox ADR/package.
- The exact Warehouse Operator read/create and Customer-read expansion is accepted; reverse/export remain withheld.

No remaining implementation detail may weaken these frozen contracts. If Prisma 7 cannot enforce the approved isolation or composite linkage safely, implementation must stop for review.
