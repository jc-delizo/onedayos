# Demo Runtime Validation Report

Date: 2026-07-24

Environment: controlled sandbox

## Result

Controlled Founder/Prospect Guided Demo Approved

This approval is limited to guided sandbox walkthroughs using the prepared demo accounts and canonical demo data.

## Required Caveats

- Public self-service demo is not approved.
- Production readiness is not implied.
- Independent representative-user validation remains pending.
- Formal accessibility conformance is not claimed.
- Robots and noindex controls are indexing hints, not authentication or security controls.

## Flags Verified

- `ONEDAYOS_DEMO_MODE=true`: verified
- `ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false`: verified
- `ONEDAYOS_DEMO_RESET_APPROVED=true`: verified
- `ONEDAYOS_SANDBOX_DB_APPROVED=true`: verified
- `NEXT_PUBLIC_APP_URL` uses port `1320`: verified
- Demo passwords: present and non-placeholder
- Database URLs: present and non-placeholder

## Reset Result

`npm run demo:reset`: passed.

The reset was guarded by demo mode, sandbox DB approval, reset approval, and configured demo org slug. Repeated reset completed for the configured demo organization only and produced the same canonical counts. It removed prior scale-test Product/Warehouse and Inventory drift inside that organization while preserving organization, subscription, users, roles, permissions, and module enablement.

## Readiness Checker Result

`npm run demo:check`: passed.

Final checker wording:

```text
Controlled demo readiness checks passed.
Public self-service demo approval is not implied.
```

## Local Gates

`npm run check:all`: passed.

`npm run build`: passed.

## Registration Disabled Result

Registration page:

- Local `/register`: invite-only copy shown.
- Public `/register`: invite-only copy shown.
- Active registration form not shown.
- Sign in link available.
- No password or secret shown.

Registration API:

- `POST /api/kernel/auth/register`: HTTP 403.
- Response is JSON.
- `error.code`: `REGISTRATION_DISABLED`.
- No redirect.
- No HTML response.
- Blocked request created no Supabase Auth user, Prisma User, or Organization rows.

## Robots and Noindex Result

`/robots.txt` returns:

```text
User-Agent: *
Disallow: /
```

Root page metadata includes `noindex` and `nofollow`.

## Demo Persona Auth Result

Org Admin:

- Supabase sign-in succeeded.
- Prisma user maps to the demo organization.
- Wildcard admin permission exists.
- Expected landing target remains `/onedayosdemo/apps`.
- Browser app-launcher verification remains manual.

Warehouse User:

- Supabase sign-in succeeded.
- Prisma user maps to the demo organization.
- Exact Warehouse Operator least-privilege profile verified.
- No wildcard permission.
- No `kernel.organization.manage` permission.
- Organization direct browser-route denial remains manual because browser automation is not installed; app route code requires Org Admin and the Warehouse User lacks that permission.

## Canonical Data Result

- Demo org exists.
- Inventory enabled.
- Product categories: `1`
- Canonical products: `3`
- Active products: `3`
- Suppliers: `1`
- Warehouses: `1`
- InventoryProductExtension rows: `3`
- StockBalance rows: `3`
- StockMovement rows: `9`
- StockAdjustment rows: `9`
- Recent movement pattern: `3` opening balances, `3` adjustment-in, `3` adjustment-out
- Recent UTC activity dates: June 30 through July 23, 2026
- Final balances: Bottled Water `120`, Iced Tea `35`, Coffee Beans `8`
- Coffee Beans is low stock.

All movement rows have matching persisted StockAdjustment sources and internally consistent before/after/delta/resulting quantities. No Receipt, Issue, Transfer, or unsupported movement type exists.

## Runtime

- Server mode: `next start`
- Port: `1320`
- Local URL: `http://localhost:1320`
- Public sandbox URL: `http://46.250.229.188:1320`

## Dependency Audit

Production-moderate, full-high, and full-moderate audits pass with zero vulnerabilities. No audit fix command was run.

## Known Limitations

- Sandbox only.
- Guided demo only.
- Public self-service demo is not approved.
- Production readiness is not implied.
- No public reset automation.
- No public abuse controls or rate limiting.
- Independent representative-user validation remains pending.
- Independent Org Admin validation remains pending.
- Formal accessibility conformance is not claimed.
