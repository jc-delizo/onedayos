# Contextual Shared Records

Status: Frozen
Implementation Timing: V2-1
Implementation Allowed: Only through the approved V2-1 implementation package

## Purpose

Modules need to reference shared Business Objects without making users feel trapped or implying module ownership.

## Approved App Model

- Inventory: business module/app.
- Organization: built-in admin app.
- Shared Records: built-in records app.

Shared Records appears in the app switcher when the user has at least one shared-record read permission.

## Contextual Access From Inventory

Inventory may expose related shared records:

- Products.
- Categories.
- Suppliers.
- Customers.
- Warehouses.

When the user opens these from Inventory, the UI preserves Inventory context and keeps the Inventory sidebar visible. V2-1 uses contextual routes or full-page fallbacks; V2-3 may add modal/sheet surfaces. Wording must make ownership clear:

> Product identity is shared. Inventory only manages stock behavior.

## Direct Shared Records Access

Direct Shared Records app navigation remains available for cross-app management. People remains under Organization for now, not Shared Records primary navigation.

Shared Records is built in, is not controlled by `OrgModule`, and is visible in the app switcher only when the user has at least one relevant shared-record read permission.

## Rules

- Do not duplicate service logic.
- Do not create module-owned Product/Warehouse/Supplier/Customer models.
- Do not move Business Object APIs under Inventory.
- Do not hide server permission checks behind UI-only gating.

## Tests Required Later

- Inventory related record opens preserve Inventory context.
- Direct Shared Records app is accessible through app switcher.
- Product/Warehouse/Supplier/Customer remain shared in labels and routes.
- User without read permission never receives row data.
