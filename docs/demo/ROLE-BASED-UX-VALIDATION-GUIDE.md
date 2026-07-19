# OneDayOS Role-Based UX Validation Guide

Date: 2026-07-19

This guide prepares a structured Founder review of two sandbox personas. This guide does not claim representative-user validation has occurred.

## Sandbox URL

- Public sandbox: http://46.250.229.188:1320
- Local sandbox: http://localhost:1320

## Persona 1: Org Admin

Use the existing demo admin account.

- Email: see `ONEDAYOS_DEMO_ADMIN_EMAIL`
- Password: see `.env.local` value `ONEDAYOS_DEMO_ADMIN_PASSWORD`
- Expected landing page: `/onedayosdemo/apps`

Expected access:

- Apps launcher
- Inventory
- Organization
- Organization / People
- Organization / Branches & Departments
- Organization / Settings
- Shared Records according to the admin permission profile
- Profile menu with Appearance and Sign out

Review tasks:

1. Log in as Org Admin.
2. Confirm the apps launcher shows Inventory and Organization.
3. Open Inventory and confirm the sidebar stays Inventory-focused.
4. Open Organization and confirm the sidebar switches to People, Branches & Departments, and Settings.
5. Open Shared Records from Inventory related links and confirm the app switcher still provides a way back to Inventory.
6. Open the profile menu and confirm Appearance and Sign out are present.

## Persona 2: Warehouse User

Use the sandbox Warehouse User account after `npm run demo:provision` succeeds.

- Email: see `ONEDAYOS_DEMO_WAREHOUSE_EMAIL`
- Password: see `.env.local` value `ONEDAYOS_DEMO_WAREHOUSE_PASSWORD`
- Expected landing page: `/onedayosdemo/apps`

Expected access:

- Apps launcher
- Inventory only
- Inventory Dashboard
- Process Flow
- Stock Levels
- Stock Movements
- Stock Adjustments
- New Stock Adjustment
- Related Records for Products, Categories, Suppliers, and Warehouses in read-only form where permissions permit

Expected denial or non-visibility:

- Organization app must not appear.
- People must not appear.
- Branches & Departments must not appear.
- Organization Settings must not appear.
- Customers must not appear in Inventory navigation.
- Product Settings update controls must not appear.
- Product, Category, Supplier, and Warehouse create/edit/delete controls must not appear.
- Cross-tenant access must fail safely.
- Admin-only controls must not appear.

Review tasks:

1. Log in as Warehouse User.
2. Confirm the apps launcher shows Inventory and does not show Organization or Records as apps.
3. Open Inventory.
4. Confirm the sidebar shows Dashboard, Process Flow, Product Settings, Stock Levels, Stock Movements, and Stock Adjustments.
5. Confirm Related Records show Products, Categories, Suppliers, and Warehouses only.
6. Open Stock Levels and confirm demo stock data appears.
7. Open New Stock Adjustment and post a safe valid adjustment.
8. Try a negative resulting stock adjustment and confirm the app rejects it safely.
9. Open Products and Warehouses from Related Records and confirm create/edit/delete actions are not visible.
10. Try direct Organization URLs and confirm access is denied safely.

## Manual Accessibility Checklist

Complete this checklist separately for each persona:

- [ ] Keyboard-only login works.
- [ ] App launcher cards are reachable by keyboard.
- [ ] Sidebar app switcher is reachable and announces its purpose.
- [ ] Profile menu is reachable and exposes Appearance and Sign out.
- [ ] Focus is visible in Light and Dark modes.
- [ ] Inventory tables have understandable headers.
- [ ] Process Flow is understandable without relying only on arrows or color.
- [ ] Stock Adjustment form labels and validation errors are clear.
- [ ] Error states avoid raw Supabase, Prisma, SQL, or stack trace details.
- [ ] Loading states are contextual and not generic blank bars.

## Evidence Rules

- Use the review templates in `docs/demo/reviews/`.
- Record defects in `docs/demo/reviews/UX-FINDINGS-LOG.md`.
- Do not mark representative-user validation complete from this Founder proxy review.
- Do not claim formal WCAG conformance from this checklist.
- Do not claim public website demo approval from this package.
