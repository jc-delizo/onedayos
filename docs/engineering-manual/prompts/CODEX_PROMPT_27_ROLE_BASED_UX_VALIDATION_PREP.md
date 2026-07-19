# OneDayOS — Role-Based UX Validation Preparation Package 8

You are preparing OneDayOS for the first structured human UX validation pass.

Completed and verified before this package:

- Full Platform Scenario Audit
- Inventory Audit and Hardening
- UX Governance
- Shared UX Code
- Generator UX Enforcement
- Inventory UX Conformance Retrofit
- Automated UX and Accessibility Gates
- OneDayOS Compact Design Preset Lock
- Runtime Appearance Hardening
- Organization and Shared Records UX Conformance Retrofit

Do not repeat the Full Platform Scenario Audit or Inventory Audit. They have already been completed.

The Founder explicitly approves **Role-Based UX Validation Preparation Package 8 only**.

This package does not claim that human validation has occurred. It prepares:

1. A least-privilege warehouse-user sandbox account
2. Role-based UI and permission verification
3. Founder walkthrough scripts
4. Manual accessibility checklists
5. UX review scorecards
6. A structured findings log

Actual human review remains a Founder/manual activity after this package.

## Absolute Scope Boundaries

Do not:

- add a new business module
- add new Inventory features
- change Inventory stock logic
- change Prisma schema
- create migrations
- run destructive database commands
- implement public demo reset automation
- implement public registration hardening
- implement billing
- implement Platform Services
- implement Dynamic Forms or Dynamic CRUD
- implement runtime AI
- add FastAPI
- add Playwright, Cypress, or browser automation
- claim representative-user validation
- claim formal accessibility conformance
- claim public website demo approval
- alter OneDayOS Compact
- alter Light / Dark / System behavior
- create client-specific UI forks

## Goal

Prepare two controlled sandbox personas:

### Persona 1 — Org Admin

Existing demo account.

Expected access:

- Apps launcher
- Inventory
- Organization
- Shared Records according to permissions
- People
- Branches & Departments
- Settings
- Profile / Appearance / Sign out

### Persona 2 — Warehouse User

New or repaired sandbox-only demo account.

Expected access:

- Apps launcher
- Inventory only
- Inventory Dashboard
- Process Flow
- Stock Levels
- Stock Movements
- Stock Adjustments
- New Stock Adjustment, if granted
- Related Products, Categories, Suppliers, and Warehouses in read-only form where permissions permit

Expected denial/non-visibility:

- Organization app must not appear
- People must not appear
- Branches & Departments admin must not appear
- Organization Settings must not appear
- Customer records must not appear in Inventory navigation
- Product Settings update must not appear unless explicitly granted
- no cross-tenant access
- no admin-only controls

The warehouse persona is a controlled proxy persona for Founder testing. Do not describe Founder testing as independent representative-user validation.

## Local Port Rule

The app remains on port `1320`.

Do not switch to `3000`.

Verify:

- `npm run dev` uses port 1320
- `npm run start` uses port 1320
- `.env.example` uses `NEXT_PUBLIC_APP_URL=http://localhost:1320`

## Secret Safety

Do not print:

- passwords
- Supabase service/secret keys
- database URLs
- tokens
- cookies
- sessions

Do not commit `.env.local`.

Do not display secret values in final output.

## Required Sandbox Environment

Inspect `.env.local` by variable-name presence only.

Existing required approval:

```text
ONEDAYOS_SANDBOX_DB_APPROVED=true
```

Require these additional sandbox-only variables:

```text
ONEDAYOS_DEMO_WAREHOUSE_EMAIL
ONEDAYOS_DEMO_WAREHOUSE_PASSWORD
ONEDAYOS_DEMO_WAREHOUSE_NAME
```

Recommended non-secret values:

```text
ONEDAYOS_DEMO_WAREHOUSE_EMAIL=warehouse@onedayonlysystems.test
ONEDAYOS_DEMO_WAREHOUSE_NAME=Warehouse User
```

The Founder must choose a strong password in:

```text
ONEDAYOS_DEMO_WAREHOUSE_PASSWORD
```

Reject placeholder or weak values such as:

- password
- password123
- Password123
- Password123!
- admin
- admin123
- warehouse
- warehouse123
- demo
- demo123
- changeme
- placeholder markers

If any required variable is missing or weak, stop before DB-affecting work and report variable names only.

## Primary Authority

Read and obey:

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/11-module-ux-contract.md`
- `docs/engineering-manual/03-design-system/12-usability-review-checklist.md`
- `docs/engineering-manual/03-design-system/templates/module-ux-review.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/04-api-security.md`
- `docs/engineering-manual/17-module-specifications/01-inventory-module.md`
- `src/modules/inventory/UX-CONFORMANCE.md`
- `src/platform/organization/UX-CONFORMANCE.md`
- `src/business-objects/UX-CONFORMANCE.md`
- `docs/demo/FOUNDER-SANDBOX-TESTING-GUIDE.md`

If documents conflict, stop and report the conflict.

## Repository Safety

Before coding:

1. Run `git status --short`.
2. Record existing changed/untracked files.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Limit changes to sandbox provisioning, role/permission tests, validation guides, conformance notes, and a package implementation note.
5. Do not commit unless separately instructed.

# Before Coding

Inspect and report briefly:

1. Current sandbox provisioning script.
2. Current demo Org Admin provisioning.
3. Current Role/UserRole/Permission schema and helper conventions.
4. Current Inventory permission constants.
5. Current Business Object permission constants.
6. Current app-launcher visibility resolver.
7. Current Organization admin visibility logic.
8. Current Inventory sidebar/action visibility logic.
9. Current demo guide.
10. Files you plan to create.
11. Files you plan to modify.
12. Any role-model or permission ambiguity.

If a real ambiguity exists, stop and wait for Founder approval.

# Part A — Warehouse Persona Permission Profile

Do not invent a new authorization architecture.

Use existing Role, UserRole, Permission, PlatformContext, and permission-string conventions.

Create or ensure a sandbox role named:

```text
Warehouse Operator
```

This role is sandbox/demo data, not a new hardcoded platform role.

Use the actual permission model and current constants.

The intended least-privilege permission profile is:

## Inventory

Allow:

```text
inventory.dashboard.read
inventory.product_setting.read
inventory.stock_level.read
inventory.stock_movement.read
inventory.stock_adjustment.read
inventory.stock_adjustment.create
```

Do not grant:

```text
inventory.product_setting.update
```

unless current UI cannot function read-only and the manual explicitly requires it. Prefer no update permission.

Do not grant wildcard Inventory permissions.

## Shared Business Objects

Allow read access required to understand Inventory:

```text
objects.product.read
objects.product_category.read
objects.supplier.read
objects.warehouse.read
```

Do not grant create/update/delete/restore permissions for these records.

Do not grant:

```text
objects.employee.*
objects.customer.*
```

unless an existing technical dependency proves read access is required. If so, stop and report rather than broadening silently.

## Organization

Do not grant:

```text
kernel.organization.manage
```

or any equivalent Organization-admin permission.

Do not grant wildcard Admin permission.

The warehouse user must not qualify as Org Admin.

## Permission Vocabulary

Inspect actual constants and resource/action mapping.

If the current system stores permissions as module/action/resource fields rather than one string, translate the intended profile into the existing model.

Do not create a second permission system.

Document the final permission rows in the implementation note without exposing IDs unnecessarily.

# Part B — Provision Warehouse User

Update:

```text
scripts/provision-sandbox-demo.ts
```

or the existing equivalent.

Requirements:

- idempotent
- guarded by `ONEDAYOS_SANDBOX_DB_APPROVED=true`
- validates warehouse demo env values
- creates or updates Supabase Auth user
- updates existing password from env if user already exists
- creates or repairs matching Prisma User with the same Supabase user ID
- assigns the user to the existing demo organization
- creates or ensures `Warehouse Operator` role
- creates or repairs only the approved least-privilege permissions
- assigns UserRole
- removes stale extra demo permissions from this role if the script previously created them
- does not alter the Org Admin role
- does not alter real users
- does not create another organization
- does not print secrets
- does not duplicate users/roles/permissions on rerun

Do not modify production seed behavior.

Add or update package script only if the existing `demo:provision` does not already invoke this provisioning.

Prefer keeping one idempotent `npm run demo:provision`.

# Part C — Role-Based Automated Verification

Add or strengthen tests for:

## App launcher

- Org Admin sees Inventory and Organization.
- Warehouse user sees Inventory.
- Warehouse user does not see Organization.
- Records do not appear as an app.

## Navigation

- Warehouse Inventory sidebar shows approved Inventory pages.
- Warehouse sidebar does not show Organization admin links.
- People does not appear.
- Customers do not appear in Inventory navigation.
- Related Products, Categories, Suppliers, and Warehouses remain available when permitted.

## Actions

- Warehouse user can read Dashboard, Stock Levels, Stock Movements, and Stock Adjustments.
- Warehouse user can open New Stock Adjustment.
- Warehouse user cannot update Product Settings.
- Warehouse user cannot create/edit/delete Products.
- Warehouse user cannot create/edit/delete Warehouses.
- UI action hiding remains usability only; API/service denial must still be tested.

## Direct access

- Warehouse user direct Organization route is denied safely.
- Warehouse user direct People route is denied safely.
- Warehouse user direct Organization Settings route is denied safely.
- Warehouse user cannot call Organization APIs/actions.
- Warehouse user cannot update Product Settings through direct API.
- Warehouse user cannot mutate shared Product/Warehouse records through direct APIs.
- warehouse user remains tenant-scoped.

## Inventory adjustment

- Warehouse user with create adjustment permission can post a valid adjustment.
- negative stock remains prevented.
- cross-tenant Product/Warehouse remains rejected.
- no partial writes/events on failure.

Do not weaken existing tests.

# Part D — Validation Guides and Review Artifacts

Create:

```text
docs/demo/ROLE-BASED-UX-VALIDATION-GUIDE.md

docs/demo/reviews/
  FOUNDER-ORG-ADMIN-UX-REVIEW.md
  FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md
  MANUAL-ACCESSIBILITY-REVIEW.md
  UX-FINDINGS-LOG.md
```

## ROLE-BASED-UX-VALIDATION-GUIDE.md

Include:

- sandbox URL
- Org Admin email
- Warehouse User email
- never include passwords
- password locations in `.env.local`
- clean-session instructions:
  - sign out before switching persona
  - use separate browser profiles/private windows if possible
- task sequence for both personas
- expected permissions and denials
- what screenshots/notes to collect
- how to classify findings
- reminder that Founder proxy testing is not independent representative-user validation

## FOUNDER-ORG-ADMIN-UX-REVIEW.md

Use the frozen review scorecard.

Tasks:

1. Log in.
2. Confirm app launcher shows Inventory and Organization.
3. Open Organization.
4. Review People.
5. Review Branches & Departments.
6. Review Settings.
7. Switch to Inventory.
8. Review Dashboard.
9. Review Process Flow.
10. Review shared Products and return to Inventory.
11. Change Appearance and verify persistence.
12. Sign out.

Record:

- completion
- wrong turns
- confusion
- errors
- severity
- scorecard
- approval decision

Do not pre-fill successful results.

## FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md

Tasks:

1. Log in as Warehouse User.
2. Confirm only Inventory appears as an app.
3. Open Inventory.
4. Find Coffee Beans current quantity.
5. Explain low-stock status.
6. Review Process Flow.
7. Create a small positive Stock Adjustment.
8. Locate corresponding Stock Movement.
9. Attempt an adjustment that makes stock negative.
10. Confirm understandable failure and no partial change.
11. Open shared Product.
12. Return to Inventory.
13. Attempt to access Organization by URL and confirm safe denial.
14. Attempt Product Settings edit and confirm action is absent or denied.
15. Change Appearance and verify persistence.
16. Sign out.

Record clearly:

```text
Founder proxy review only — representative warehouse-user validation pending.
```

## MANUAL-ACCESSIBILITY-REVIEW.md

Create unchecked checklist sections for:

- keyboard-only login
- keyboard-only app launcher
- keyboard-only sidebar/app switcher
- profile/Appearance menu
- Inventory Dashboard
- Process Flow
- Stock Levels
- New Adjustment
- Organization People
- visible focus
- no keyboard trap
- logical focus order
- 200% zoom/reflow
- light/dark contrast review
- status not color-only
- error comprehension
- reduced-motion behavior
- screen-reader spot check, pending if unavailable

Do not pre-check items.

## UX-FINDINGS-LOG.md

Columns:

```text
ID
Date
Persona
Page/Task
Expected
Observed
Severity
Standard/Heuristic
Owner
Resolution
Status
Deferred Reason
Regression Test/Pattern Added
```

Severity values:

- Blocker
- Must Fix
- Polish
- Question / Product Decision
- Deferred with Reason

# Part E — Conformance Document Updates

Update only truthfully:

```text
src/modules/inventory/UX-CONFORMANCE.md
src/platform/organization/UX-CONFORMANCE.md
src/business-objects/UX-CONFORMANCE.md
```

Record that:

- role-based validation artifacts exist
- Warehouse Operator demo persona exists after successful provisioning
- Founder manual reviews are pending until the Founder completes them
- independent representative-user validation is still pending
- formal manual accessibility review is still pending
- public demo approval remains pending

Do not mark tasks complete merely because files were created.

# Part F — Implementation Note

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-role-based-ux-validation-preparation.md
```

Include:

- persona definitions
- warehouse role permissions
- provisioning behavior
- automated role tests
- validation artifacts
- evidence still pending
- explicit non-goals
- no public demo claim
- next decision after Founder completes reviews

# Sandbox Provisioning

After environment gates pass, run:

```bash
npm run demo:provision
```

Do not run migrations unless current schema migrations are unexpectedly unapplied and the safety gate explicitly permits it. Prefer no migration command in this package.

Verify without printing secrets:

- warehouse auth user exists
- matching Prisma User exists
- user belongs to demo org
- Warehouse Operator role exists
- UserRole exists
- exact permission profile exists
- user is not Org Admin
- Inventory is enabled for demo org

Report email but never password.

# Manual Browser Preparation

Keep production server on port 1320.

Do not install Playwright.

If possible using existing browser tooling, verify login for both accounts without printing passwords.

If browser automation is unavailable, provide exact Founder manual steps.

Do not claim human usability results.

# `check:ux` and Accessibility

Only add stable rules if useful:

- validation guide exists
- review templates exist
- conformance documents do not falsely claim human reviews completed
- no warehouse role wildcard permission in demo provision source
- Organization visibility remains admin-only

Do not make sandbox demo account existence a CI requirement.

CI must not require real sandbox credentials.

Accessibility automated tests remain unchanged unless a real regression is found.

# Forbidden Changes

Do not modify:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- Inventory business service logic except test-only setup or a confirmed bug
- Inventory API contracts except a confirmed bug
- runtime appearance
- OneDayOS Compact tokens
- module generator
- Organization/Records page structure unless a confirmed role-visibility defect is found
- `.env.local`
- public deployment automation

Do not run:

- `prisma migrate reset`
- `prisma db push`
- production migrations
- `npm audit fix --force`

# Verification Commands

Run:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run check:ux
npm run test:a11y
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm run check:all
npm audit --audit-level=moderate
git diff --check
git status --short
```

If sandbox variables pass, also run:

```bash
npm run demo:provision
```

Use port 1320 for smoke checks.

# Final Report Required

Report:

1. Role-Based UX Validation Preparation summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Warehouse demo env gate result.
6. Warehouse auth/Prisma user provisioning result.
7. Warehouse Operator role result.
8. Exact permission profile created.
9. Confirmation that no wildcard/admin permission was granted.
10. App-launcher role behavior.
11. Navigation/action role behavior.
12. Direct-access/API denial behavior.
13. Automated tests added or strengthened.
14. Updated test count.
15. Validation guides/review artifacts created.
16. Conformance document updates.
17. Founder manual tasks still pending.
18. Independent representative-user validation still pending.
19. Manual accessibility review still pending.
20. Exact verification commands and results.
21. `check:all` result.
22. npm audit result.
23. Port 1320/server status.
24. Git diff/status observations.
25. Any deviations from approved scope.
26. Any unresolved permission, UX, or test risks.
27. Confirmation that no Prisma, migrations, new modules, themes, generator, public-demo, or Platform Service changes occurred.
28. Whether Package 8 is complete.
29. Whether the Founder can begin the two-persona manual walkthrough.
30. Whether Controlled Demo Preparation remains blocked until review findings are resolved.
31. Whether public website demo approval remains pending.

Stop after this package.

Do not proceed to claim human validation, controlled demo preparation, public demo work, deployment automation, or new modules without Founder approval and completed review evidence.
