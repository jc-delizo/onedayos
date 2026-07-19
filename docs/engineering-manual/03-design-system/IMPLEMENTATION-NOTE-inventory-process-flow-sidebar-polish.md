# Implementation Note: Inventory Process Flow and Sidebar Polish

Date: 2026-07-09

## Status

Implemented as a focused UI polish and education pass.

## Decisions

- The current app switcher uses a compact icon affordance, not the retired `Apps >` text.
- The current app switcher remains a popover aligned to the sidebar and must not become a collapsible sidebar group.
- Sidebar selected state uses subtle background, text, and inset outline treatment only.
- Sidebar selected state must not use notification-like dots, red/orange active markers, or selected left rails.
- Inventory includes a `Process Flow` page as an educational Inventory page.
- `Process Flow` is explanatory only. It does not implement automation, workflow orchestration, approvals, notifications, background jobs, or data mutation.
- Inventory owns stock behavior through `InventoryProductExtension`, `StockBalance`, `StockMovement`, and `StockAdjustment`.
- Shared records remain shared: Product, ProductCategory, Warehouse, Supplier, Customer, and Employee are not owned by Inventory.
- The Process Flow page may be used for founder demos, client onboarding, and training.

## Inventory Sidebar Order

- Dashboard
- Process Flow
- Product Settings
- Stock Levels
- Stock Movements
- Stock Adjustments

Related Records:

- Products
- Categories
- Suppliers
- Warehouses
