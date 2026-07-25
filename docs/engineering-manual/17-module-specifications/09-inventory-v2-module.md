# Inventory V2 Module Specification

Status: Frozen
Implementation Timing: V2-6
Implementation Allowed: Only through the approved V2-6 implementation package

## Founder Clarification — 2026-07-25

V2-6 create requests contain 1–100 lines. Reversal is server-derived: Receipt/Issue retain their
Warehouse and applicable party, Transfer swaps Warehouses, and Adjustment stores the computed
post-reversal counted-final quantity derived from inverse canonical movement effects. The client
submits only reversal reason plus the required idempotency header.

## Purpose

Inventory V2 should make the demo feel like an operational inventory system while preserving OneDayOS boundaries. Inventory owns stock behavior. Shared Business Objects remain shared.

## Approved Workflows

### Receive Stock

- References shared Supplier.
- Uses destination Warehouse.
- Contains one or more Product lines.
- Captures quantity, reference number, and reference date.
- Creates inbound StockMovements and updates StockBalances on post.

### Issue Stock

- Optionally references a shared Customer; non-customer issues may use an approved recipient/reference.
- Uses source Warehouse.
- Contains one or more Product lines.
- Prevents negative stock.
- Creates outbound StockMovements and updates StockBalances on post.

### Transfer Stock

- Uses source Warehouse and destination Warehouse.
- Contains one or more Product lines.
- Creates paired outbound/inbound movements in one transaction.
- Does not create or lose quantity.

### Stock Adjustment

- Remains for opening balances and corrections.
- Must not be used as the substitute for receipts, issues, and transfers.

## Approved Direction for Sidebar

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

## Approved Data Model

Use a unified transaction model:

- `InventoryTransaction`
- `InventoryTransactionLine`
- `type = receipt | issue | transfer | adjustment`

Core fields:

- `orgId`
- `type`
- `status`
- `referenceNumber`
- `referenceDate`
- `supplierId`
- `customerId`
- `sourceWarehouseId`
- `destinationWarehouseId`
- `postedAt`
- `postedBy`
- timestamps and soft-delete/void fields as appropriate

Lines:

- `productId`
- `quantity`
- optional line note

Posting creates or updates:

- StockBalance.
- StockMovement.

## Approved Event Contract Direction

- `inventory.transaction.posted`
- `inventory.receipt.posted`
- `inventory.issue.posted`
- `inventory.transfer.posted`
- `inventory.adjustment.posted`
- `inventory.stock_movement.created`
- `inventory.stock_balance.updated`

Events remain facts, not commands, and payloads must not include `orgId` or full records.

Posting is transactional and type-specific. Posted transactions are immutable. Posting must prevent negative stock, create paired transfer movements without quantity creation or loss, and support a safe void/reversal strategy.

## Boundaries

Do not implement:

- Purchase Orders.
- Sales Orders.
- Accounting.
- Valuation or costing.
- Approvals.
- Notifications.
- Lots, serials, expiry, bins.
- Background jobs.

## Migration Impact

Existing StockAdjustment demo data must be either retained as legacy posted adjustments or backfilled into the unified transaction model under an explicit V2-6 migration plan. No schema change or migration is authorized before V2-6 approval.
