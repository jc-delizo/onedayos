# Inventory

Inventory is the first official OneDayOS business module.

It owns stock behavior only:

- InventoryProductExtension
- StockBalance
- StockMovement
- StockAdjustment

It does not own Product, ProductCategory, Warehouse, or Supplier identity. Those remain shared Business Objects.

API routes live under `/api/orgs/[orgSlug]/inventory/...`, and pages live under `/[orgSlug]/inventory/...`.
