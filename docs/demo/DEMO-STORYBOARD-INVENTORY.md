# Inventory Demo Storyboard

This storyboard supports a controlled guided demo of the current Inventory MVP. It is not a public demo script and does not imply production readiness.

## Opening

Explain OneDayOS as a business operating system with shared Records and enabled apps. Records are not apps. Inventory is the first official business module.

## Scene 1: App Launcher

Show `/[orgSlug]/apps`.

Key points:

- Users choose available apps.
- Inventory appears when enabled.
- Organization appears only for Org Admin users.
- Public registration is disabled for controlled demos.

## Scene 2: Inventory Dashboard

Open Inventory.

Key points:

- Dashboard uses real sandbox demo data.
- It shows current Inventory operating state without fake metrics.
- Product and Warehouse identity are not managed here.

## Scene 3: Process Flow

Open Inventory / Process Flow.

Explain:

- Shared Records setup creates Products, Categories, Suppliers, and Warehouses.
- Inventory Product Settings extend shared Products.
- Stock Adjustment validates Product and Warehouse in the current organization.
- Transactional posting creates StockAdjustment, StockMovement, and StockBalance together.
- Stock Levels read StockBalance.
- Stock Movements are the immutable ledger.
- Low stock is visual only; no Notification Service exists yet.

## Scene 4: Product Settings

Open Product Settings.

Key points:

- Inventory owns `InventoryProductExtension`.
- Settings include stock tracking and reorder point.
- Product name, code, unit, and category remain shared Records.

## Scene 5: Stock Levels

Open Stock Levels.

Expected demo data:

- Bottled Water 500ml: quantity `120`, reorder point `50`
- Iced Tea 1L: quantity `35`, reorder point `25`
- Coffee Beans 1kg: quantity `8`, reorder point `10`

Coffee Beans should appear low stock.

## Scene 6: Stock Movements

Open Stock Movements.

Key points:

- Movements are append-only ledger facts.
- Users do not edit movements directly.
- Each manual adjustment creates a corresponding movement.

## Scene 7: Stock Adjustment

Open New Adjustment.

Show a safe positive or small negative adjustment that does not push stock below zero.

Key points:

- The server computes previous quantity, new quantity, and ledger balance.
- Client does not submit `orgId`, previous quantity, new quantity, or balance after.
- Negative resulting stock is rejected.

## Scene 8: Shared Records

Open Products and Warehouses from Related Records.

Key points:

- Products and Warehouses are shared Records.
- Inventory references them but does not own them.
- Users can return to Inventory through the app switcher/sidebar.

## Scene 9: Organization Admin

Switch to Organization as Org Admin.

Key points:

- People, Branches & Departments, and Settings live in Organization.
- Organization is a built-in admin app, not a module.
- Warehouse User should not see Organization.

## Close

State current limitations clearly:

- Sandbox only.
- Guided demo only.
- No public reset automation.
- No production backup guarantee.
- No public self-service demo approval.
- Inventory still requires continued hardening before broader public claims.
