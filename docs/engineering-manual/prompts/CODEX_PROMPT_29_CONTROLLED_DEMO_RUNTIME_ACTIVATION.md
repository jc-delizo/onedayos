# OneDayOS — Controlled Demo Runtime Activation and Final Verification (Package 9B)

You already implemented the Controlled Demo Preparation code and documentation.

The only reported blocker was that `.env.local` did not yet contain:

```text
ONEDAYOS_DEMO_MODE=true
ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false
ONEDAYOS_DEMO_RESET_APPROVED=true
```

The Founder has now been instructed to add those values privately.

This task activates and verifies the controlled demo runtime. It is not a feature package.

## Absolute Scope

Do not:

- add new modules
- change Prisma schema
- create migrations
- modify Inventory business logic
- modify Organization or Records behavior
- change OneDayOS Compact
- change Light / Dark / System behavior
- change the generator
- add public-demo functionality
- add CAPTCHA, Redis, queues, billing, monitoring, or Platform Services
- expose secrets
- commit `.env.local`
- run `npm audit fix --force`

## Safety

Never print:

- passwords
- database URLs
- Supabase secret/service keys
- tokens
- cookies
- session values

Before any reset or DB-affecting operation, verify by variable-name/status only:

```text
ONEDAYOS_DEMO_MODE=true
ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false
ONEDAYOS_DEMO_RESET_APPROVED=true
ONEDAYOS_SANDBOX_DB_APPROVED=true
ONEDAYOS_DEMO_ORG_SLUG is present
DATABASE_URL and DIRECT_URL contain no placeholder markers
demo account variables are present
```

If any gate fails, stop and report the missing variable names only.

## Port Rule

The runtime must remain on port `1320`.

Do not use port `3000`.

## Step 1 — Inspect and stop stale runtime

Check what process is listening on port 1320.

Stop the existing `next start` or `next dev` process before rebuilding, because the currently running server may have been built without the new demo flags.

Do not leave multiple servers running.

## Step 2 — Verify the controlled-demo environment

Run the strict environment/readiness precheck without printing values.

Confirm:

- `.env.local` exists and is ignored by Git
- demo mode is true
- public registration is false
- reset approval is true
- sandbox DB approval is true
- app URL uses port 1320
- demo passwords are non-placeholder
- database URLs are non-placeholder

## Step 3 — Run guarded reset

Run:

```bash
npm run demo:reset
```

Expected:

- only the configured demo organization is affected
- users/auth users remain intact
- roles and permissions remain intact
- Inventory remains enabled
- canonical demo data is restored
- no other organization is affected

If reset fails, stop and report a sanitized error.

## Step 4 — Run readiness checker

Run:

```bash
npm run demo:check
```

It must pass all controlled-demo conditions.

Expected final message must remain equivalent to:

```text
Controlled demo readiness checks passed.
Public self-service demo approval is not implied.
```

## Step 5 — Run complete gates

Run:

```bash
npm run check:all
npm run build
```

If either fails, fix only within the already approved controlled-demo scope.

## Step 6 — Start fresh production runtime

Start:

```bash
npm run start
```

on port 1320.

Use the built production server, not `next dev`, for the public sandbox URL.

Keep the server running at the end unless a blocker occurs.

## Step 7 — Verify registration lock

Verify the registration page:

```text
http://localhost:1320/register
http://46.250.229.188:1320/register
```

Expected:

- page loads
- active registration form is not shown
- invite-only message is shown
- Sign in link is available
- no password or secret is shown

Verify the registration API with a harmless test request.

Expected:

```text
HTTP 403
JSON response
error.code = REGISTRATION_DISABLED
no redirect
no HTML
```

Confirm no Supabase Auth user or Prisma rows are created for the blocked request.

Do not use a real person’s email.

## Step 8 — Verify noindex and robots behavior

Verify in demo mode:

```text
/robots.txt
```

Expected:

```text
User-agent: *
Disallow: /
```

or equivalent complete disallow behavior.

Verify root/page metadata contains:

```text
noindex
nofollow
```

or equivalent robots metadata.

State clearly that these are indexing hints, not authentication/security controls.

## Step 9 — Verify both demo personas

Without printing passwords, verify login for:

```text
Org Admin:
demo@onedayonlysystems.test

Warehouse User:
warehouse@onedayonlysystems.test
```

At minimum, verify Supabase sign-in for both.

If current browser tooling is available, also verify:

### Org Admin

- redirects to `/onedayosdemo/apps`
- sees Inventory
- sees Organization
- can open Organization
- can open Inventory

### Warehouse User

- redirects to `/onedayosdemo/apps`
- sees Inventory
- does not see Organization
- can open Inventory
- cannot open Organization directly

Do not install Playwright or Cypress.

If full browser verification is unavailable, provide exact manual steps and report automated auth verification separately.

## Step 10 — Verify canonical demo data

Read-only verification:

- demo org exists
- Inventory enabled
- 1 product category
- 3 canonical products
- 1 supplier
- 1 warehouse
- 3 InventoryProductExtension rows
- 3 StockBalance rows
- StockMovement rows exist
- StockAdjustment rows exist
- Coffee Beans is low stock
- Org Admin has wildcard permission
- Warehouse Operator has exactly the approved least-privilege profile
- Warehouse Operator has no wildcard/admin permission

Do not print internal IDs unless necessary.

## Step 11 — Update controlled-demo status honestly

Create:

```text
docs/demo/DEMO-RUNTIME-VALIDATION-REPORT.md
```

Include:

- date
- environment: controlled sandbox
- flags verified
- reset result
- readiness checker result
- check:all result
- registration-disabled result
- robots/noindex result
- Org Admin auth result
- Warehouse User auth result
- canonical data result
- known advisory
- known limitations
- approval wording

Allowed approval wording if all checks pass:

```text
Controlled Founder/Prospect Guided Demo Approved
```

Required caveats:

```text
Public self-service demo is not approved.
Production readiness is not implied.
Independent representative-user validation remains pending.
Formal accessibility conformance is not claimed.
```

Update these conformance documents only if all checks pass:

```text
src/modules/inventory/UX-CONFORMANCE.md
src/platform/organization/UX-CONFORMANCE.md
src/business-objects/UX-CONFORMANCE.md
```

Use the same controlled-guided-demo wording.

Do not mark Public Demo Approved.

## Step 12 — Final verification commands

Run and report:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run check:ux
npm run test:a11y
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm run check:all
npm run demo:check
npm audit --audit-level=moderate
git diff --check
git status --short
```

Do not run:

```bash
npm audit fix --force
```

## Final Report Required

Report:

1. Environment gate result.
2. Stale server handling.
3. `demo:reset` result.
4. `demo:check` result.
5. `check:all` result.
6. Registration-page lock result.
7. Registration-API lock result.
8. Confirmation that blocked registration created no user/org rows.
9. Robots/noindex result.
10. Org Admin sign-in/result.
11. Warehouse User sign-in/result.
12. Warehouse Organization-denial result.
13. Canonical demo-data result.
14. Demo runtime URL.
15. Whether the server remains running.
16. Runtime validation report path.
17. Conformance-document updates.
18. Exact verification commands and results.
19. npm audit result.
20. Remaining risks.
21. Whether controlled guided demos are approved.
22. Whether public self-service demos remain unapproved.
23. Whether public website demo claims remain pending.

Stop after activation and verification.

Do not proceed to website asset production, public demo exposure, deployment automation, new modules, or production claims without Founder approval.
