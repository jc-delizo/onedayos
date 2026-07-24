# ADR-0020: Inventory V2 Operational Workflows

Status: Accepted
Date: 2026-07
Implementation Timing: V2-6
Implementation Allowed: Only through the approved V2-6 implementation package

## Context

Inventory MVP currently proves manual stock adjustments, stock balances, movement ledger, low-stock status, and shared Business Object references. Founder review requested an Inventory demo that feels connected to real operations over time, including Suppliers, Customers, and Warehouses.

## Decision

Plan Inventory V2 workflows:

- Receive Stock, referencing shared Supplier and destination Warehouse.
- Issue Stock, optionally referencing a shared Customer and using a source Warehouse.
- Transfer Stock, moving quantity between Warehouses without creation or loss.
- Stock Adjustment, retained for opening balances and corrections.

Inventory continues to own stock behavior only and must not own Product, ProductCategory, Supplier, Customer, or Warehouse.

## Model Decision

Use a unified transaction model:

- `InventoryTransaction`
- `InventoryTransactionLine`
- `type = receipt | issue | transfer | adjustment`

This model generates immutable StockMovement rows and updates StockBalance rows transactionally when posted. It requires type-specific validation, no negative stock, paired transfer movements with no quantity creation or loss, safe void/reversal behavior, explicit permissions and events, and a migration/backfill plan for existing StockAdjustment demo data.

`customerId` is optional for issues because outbound stock may represent internal consumption, damage/write-off, samples, or another approved non-customer recipient. No generic Party model is introduced.

## Consequences

- Prisma schema changes and migrations will be required in a later package.
- Existing demo data needs migration/backfill or recreation.
- Permissions, events, APIs, UI, and tests expand materially.

## Non-Goals

- Purchase Orders.
- Sales Orders.
- Accounting or costing.
- Approvals.
- Notifications.
- Lots, serials, expiry, bins, or background jobs.

## Implementation Timing

V2-6 only. Schema changes, migrations, backfill, permissions, events, APIs, UI, and posting logic remain blocked until that package is explicitly approved.
