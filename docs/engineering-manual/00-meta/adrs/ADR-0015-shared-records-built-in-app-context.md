# ADR-0015: Shared Records Built-In App and Context Preservation

Status: Accepted
Date: 2026-07
Implementation Timing: V2-1
Implementation Allowed: Only through the approved V2-1 implementation package

## Context

Earlier IA treated Records as shared surfaces but not an app. Founder review of Inventory showed that moving from Inventory to shared Product records can feel like leaving the module with no preserved context. The new product direction says Shared Records should be a built-in app while also supporting context-preserving related record views from Inventory.

## Decision

Shared Records is a built-in records app, separate from Inventory and Organization:

- Inventory remains a business module/app.
- Organization remains a built-in admin app for Org Admin users.
- Shared Records becomes a built-in records app for users with at least one shared-record read permission.

When opened from Inventory, related Products, Categories, Suppliers, Customers, and Warehouses preserve Inventory context. V2-1 uses contextual routes or full-page fallbacks while keeping the Inventory sidebar visible; V2-3 may add URL-addressable modals. Direct Shared Records access remains available through the app switcher.

## Consequences

- This amends the earlier implementation note that said Records are not apps.
- App switcher visibility must become permission-aware for Shared Records.
- Shared record services and APIs remain shared; no Inventory-owned duplicate logic is allowed.
- The Inventory sidebar can include contextual related records without changing app ownership.

## Non-Goals

- Moving People into Shared Records primary navigation.
- Making Product, Warehouse, Supplier, Customer, or Category module-owned.
- Creating duplicate InventoryProduct, InventoryWarehouse, or InventorySupplier identities.

## Implementation Timing

V2-1 adds the permission-aware Shared Records app, its direct sidebar, and contextual access from Inventory. Shared Records is built in and is not controlled by `OrgModule`. Direct `/records` entry uses Shared Records context; Inventory-origin contextual routes preserve Inventory context.
