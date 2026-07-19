# OneDayOS Founder Sandbox Testing Guide

Date: 2026-07-09

## Sandbox URL

Use:

- http://46.250.229.188:1320

The sandbox server is expected to run with `npm run start` on port `1320`.

This is a controlled guided sandbox demo. Public registration should be disabled and `/register` should show invite-only copy.

## Demo Login

- Demo admin email: `demo@onedayonlysystems.test`
- Demo org slug: `onedayosdemo`
- Password: see `.env.local` value `ONEDAYOS_DEMO_ADMIN_PASSWORD`
- Warehouse user email: see `.env.local` value `ONEDAYOS_DEMO_WAREHOUSE_EMAIL`
- Warehouse user password: see `.env.local` value `ONEDAYOS_DEMO_WAREHOUSE_PASSWORD`

Do not commit `.env.local` or paste the password into chat.

## Login Steps

1. Open http://46.250.229.188:1320/login.
2. Enter the demo admin email.
3. Enter the demo password from `.env.local`.
4. Submit the form.
5. Expected result: the browser redirects to `/onedayosdemo/apps`.
6. Click `Open Inventory` to enter the Inventory app.

For role-based UX review, repeat the login with the Warehouse User credentials. Expected result: the browser redirects to `/onedayosdemo/apps`, Inventory is available, and Organization is not available.

## Pages To Test

Open these after logging in:

- http://46.250.229.188:1320/
- http://46.250.229.188:1320/login
- http://46.250.229.188:1320/register
- http://46.250.229.188:1320/onedayosdemo/apps
- http://46.250.229.188:1320/onedayosdemo/inventory
- http://46.250.229.188:1320/onedayosdemo/inventory/product-settings
- http://46.250.229.188:1320/onedayosdemo/inventory/stock-levels
- http://46.250.229.188:1320/onedayosdemo/inventory/stock-movements
- http://46.250.229.188:1320/onedayosdemo/inventory/stock-adjustments
- http://46.250.229.188:1320/onedayosdemo/inventory/stock-adjustments/new
- http://46.250.229.188:1320/onedayosdemo/records/products
- http://46.250.229.188:1320/onedayosdemo/records/warehouses
- http://46.250.229.188:1320/onedayosdemo/records/suppliers
- http://46.250.229.188:1320/onedayosdemo/organization/people

Warehouse User role-based review should focus on:

- http://46.250.229.188:1320/onedayosdemo/apps
- http://46.250.229.188:1320/onedayosdemo/inventory
- http://46.250.229.188:1320/onedayosdemo/inventory/process-flow
- http://46.250.229.188:1320/onedayosdemo/inventory/stock-levels
- http://46.250.229.188:1320/onedayosdemo/inventory/stock-movements
- http://46.250.229.188:1320/onedayosdemo/inventory/stock-adjustments
- http://46.250.229.188:1320/onedayosdemo/inventory/stock-adjustments/new
- http://46.250.229.188:1320/onedayosdemo/records/products
- http://46.250.229.188:1320/onedayosdemo/records/warehouses

Expected Warehouse User non-access:

- Organization app should not appear in the app launcher.
- People, Branches & Departments, and Settings should not appear.
- Customers should not appear in Inventory navigation.
- Product, Category, Supplier, and Warehouse create/edit/delete controls should not appear.
- Product Settings update controls should not appear.

## Before Testing

The guide should run:

- `npm run demo:reset`
- `npm run demo:check`
- `npm run check:all`

The Founder should not continue if these gates fail.

## Expected Demo Data

Records:

- Product Category: Beverages
- Products:
  - Bottled Water 500ml
  - Iced Tea 1L
  - Coffee Beans 1kg
- Warehouse:
  - Main Warehouse
- Supplier:
  - Demo Supplier Co.

Inventory:

- Bottled Water 500ml: stock 120, reorder point 50
- Iced Tea 1L: stock 35, reorder point 25
- Coffee Beans 1kg: stock 8, reorder point 10

Coffee Beans 1kg should appear as the low-stock item.

## Stock Adjustment Test

1. Open `/onedayosdemo/inventory/stock-adjustments/new`.
2. Select a Product.
3. Select Main Warehouse.
4. Enter a new quantity.
5. Enter a clear reason, such as `Founder sandbox test`.
6. Submit the adjustment.
7. Check `/onedayosdemo/inventory/stock-levels` and `/onedayosdemo/inventory/stock-movements`.

Expected result: the stock level changes, and a movement appears in the ledger.

## Errors To Report

Report any of these:

- Login fails with the demo credentials.
- Login succeeds but does not redirect to `/onedayosdemo/apps`.
- Any page shows an internal server error.
- Inventory navigation is missing after login.
- The app launcher does not show Inventory.
- Records pages are empty when they should show demo data.
- Coffee Beans 1kg is not visible as low stock.
- Stock adjustment submit shows a raw Supabase, Prisma, SQL, or stack trace error.

## Known Limitations

- This is a sandbox only.
- This is a controlled guided demo only.
- Public registration is disabled during controlled demo sessions.
- There is no public demo reset automation yet.
- There is no production backup guarantee yet.
- There are no public abuse controls or rate limiting for a public website demo yet.
- Founder Org Admin and Warehouse User proxy walkthroughs completed with no blocker or must-fix findings reported.
- Representative-user validation, independent Org Admin validation, and manual accessibility review are still pending.
- Public self-service demo approval is still pending.
- The known upstream Next/PostCSS npm audit advisory remains tracked.
