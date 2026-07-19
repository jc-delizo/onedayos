# Demo Readiness Checklist

Use this checklist before each controlled guided demo session.

## Environment

- [ ] `.env.local` exists and is not committed.
- [ ] `NEXT_PUBLIC_APP_URL` uses port `1320`.
- [ ] `ONEDAYOS_DEMO_MODE=true`.
- [ ] `ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false`.
- [ ] `ONEDAYOS_SANDBOX_DB_APPROVED=true`.
- [ ] `ONEDAYOS_DEMO_RESET_APPROVED=true` only when intentionally resetting.
- [ ] Demo passwords are strong and not placeholder values.
- [ ] Supabase and database credentials are non-production sandbox credentials.

## Commands

- [ ] `npm run check:all`
- [ ] `npm run demo:reset` when reset is intentionally approved.
- [ ] `npm run demo:check`
- [ ] `npm run build`
- [ ] `npm run start`

## HTTP Checks

- [ ] `curl -I http://localhost:1320`
- [ ] `curl -I http://localhost:1320/login`
- [ ] `curl -I http://localhost:1320/register`
- [ ] `/api/kernel/auth/me` returns JSON 401 when unauthenticated.
- [ ] Public sandbox URL responds on port `1320` when exposed.

## Product Checks

- [ ] `/register` shows invite-only copy.
- [ ] Login works for Org Admin.
- [ ] Login works for Warehouse User.
- [ ] Apps launcher opens after login.
- [ ] Inventory opens.
- [ ] Organization appears only for Org Admin.
- [ ] Warehouse User does not see Organization.
- [ ] Coffee Beans 1kg appears low stock.
- [ ] Stock adjustment creates movement and updates balance.
- [ ] Negative resulting stock is rejected.
- [ ] Products and Warehouses remain shared Records.

## Claim Check

- [ ] Do not say public demo approved.
- [ ] Do not say production ready.
- [ ] Do not say formal WCAG conformance complete.
- [ ] Do not say representative-user validation complete.
- [ ] Do not show secrets, tokens, cookies, or service keys.
