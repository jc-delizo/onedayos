# Inventory

Inventory consumes the OneDayOS platform and shared Business Objects.

Product, ProductCategory, Warehouse, and Supplier records remain shared Records. Inventory stores only inventory-specific settings, stock balances, posted manual adjustments, and immutable stock movements.

Manual stock adjustment is transactional: the service validates Product and Warehouse tenant ownership, computes the new balance server-side, creates the adjustment and movement, updates the balance, and emits inventory events after the mutation succeeds.

Deferred: purchasing integration, transfers, reservations, valuation, barcode hardware, lots, serial numbers, expiry tracking, approvals, notifications, comments, attachments, reporting, search, background jobs, dynamic systems, and runtime AI.
