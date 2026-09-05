# Controlled Demo Runbook

This runbook is for guided OneDayOS sandbox demo sessions only. It does not approve public self-service demo use, production use, or public website demo claims.

## Required Mode

The sandbox must run with private `.env.local` values equivalent to:

- `ONEDAYOS_DEMO_MODE=true`
- `ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false`
- `ONEDAYOS_DEMO_RESET_APPROVED=true` only while intentionally resetting demo data
- `NEXT_PUBLIC_APP_URL` using port `1320`

Do not commit `.env.local`. Do not paste passwords or service keys into chat, docs, screenshots, or recordings.

## Before Each Guided Session

1. Stop stale servers on port `1320`.
2. Run `npm run demo:reset` only when the reset approval flag is intentionally enabled.
3. Run `npm run demo:check`.
4. Run or confirm `npm run check:all` for code gates.
5. Start the app with `npm run build` then `npm run start`.
6. Smoke-check:
   - `http://localhost:1320`
   - `http://localhost:1320/login`
   - `http://localhost:1320/register`
7. Confirm `/register` is invite-only and public registration is disabled.
8. Confirm demo mode noindex/robots behavior is active.

## Demo Accounts

- Org Admin email: use `ONEDAYOS_DEMO_ADMIN_EMAIL`
- Warehouse User email: use `ONEDAYOS_DEMO_WAREHOUSE_EMAIL`
- Passwords: read from private `.env.local`

Never put demo passwords in committed docs.

## Approved Guided Flow

1. Log in as Org Admin.
2. Open Apps.
3. Open Inventory.
4. Explain Inventory Dashboard and Process Flow.
5. Open Stock Levels, Receipts, Issues, Transfers, Adjustments, Movement Ledger, Dashboard, and Process Flow.
6. Open Related Records for Products and Warehouses to show that Product and Warehouse remain shared.
7. Switch to Organization through the app switcher.
8. Show People, Branches & Departments, and Settings at a high level.
9. Log out.
10. Log in as Warehouse User.
11. Show that Organization is not available and Inventory is focused.
12. Post a safe canonical transaction and show its detail and movement-ledger result.
13. Attempt a negative-stock adjustment only if useful, then explain safe rejection.

## Stop Conditions

Stop the session and log a finding if any of these occur:

- Public registration is enabled.
- Demo data is not at the known baseline.
- The Warehouse User can open Organization.
- The Warehouse User sees People, Customers, or admin settings in Inventory.
- Inventory creates or owns Product, Warehouse, or Supplier identity.
- An API returns HTML or redirects for an API auth failure.
- A raw provider, Prisma, stack trace, token, or secret appears.

## Claims Allowed

Allowed:

- Controlled guided demo is prepared after gates pass.
- Founder Org Admin walkthrough completed.
- Founder Warehouse User proxy walkthrough completed.
- No blocker or must-fix findings were reported by the Founder in those walkthroughs.

Not allowed:

- Public self-service demo approved.
- Production ready.
- Formal WCAG conformance complete.
- Independent representative-user validation complete.
- Independent Org Admin validation complete.
