# OneDayOS — Controlled Demo Preparation Package 9

You are preparing OneDayOS for controlled, guided Founder/prospect demonstrations.

Completed and verified before this package:

- Foundation and security hardening
- Design system and OneDayOS app shell
- Generator and Business Objects audits
- Inventory implementation and hardening
- Full Platform Scenario Audit
- UX Governance
- Shared UX Code
- Generator UX Enforcement
- Inventory UX Conformance Retrofit
- Automated UX and Accessibility Gates
- OneDayOS Compact Design Preset Lock
- Runtime Appearance Hardening
- Organization and Shared Records UX Conformance Retrofit
- Role-Based UX Validation Preparation

## Founder Validation Result

The Founder has completed the prepared Org Admin and Warehouse User proxy walkthroughs and reports:

```text
All good.
```

You may record:

```text
Founder Org Admin walkthrough: Completed
Founder Warehouse User proxy walkthrough: Completed
Blocker findings: None reported
Must-Fix findings: None reported
```

Do not record:

- independent representative-user validation
- independent Org Admin validation
- formal warehouse-user validation
- formal WCAG conformance
- public demo approval

Those remain pending.

## Package Goal

Prepare a safe and repeatable **controlled demo environment** for guided use by the Founder and selected prospects.

A controlled demo means:

- the Founder operates or supervises the demo
- credentials are shared privately and out-of-band
- demo registration is disabled
- demo data can be restored to a known baseline
- demo readiness can be checked before each session
- the environment is not presented as a public self-service playground
- the sandbox is not indexed by search engines
- limitations are stated honestly
- no production-readiness claim is made

This package should make a guided Inventory/Organization demo easy and repeatable without building a public-demo platform.

## Explicit Non-Goals

Do not:

- create a public anonymous playground
- create a public demo reset button
- add self-service demo account generation
- add public registration
- add billing
- add email invitations
- add rate-limiting infrastructure requiring Redis or another service
- add CAPTCHA
- add a status page
- add production monitoring infrastructure
- add public website integration
- create marketing claims
- add a new business module
- change Inventory business logic
- change Prisma schema
- create migrations
- run destructive commands against production
- implement Platform Services
- implement Dynamic Forms or Dynamic CRUD
- implement runtime AI
- add FastAPI
- change OneDayOS Compact
- change Light / Dark / System behavior
- implement Organization branding
- claim public website demo readiness

## Local/Sandbox Port Rule

The sandbox remains on port `1320`.

Do not switch to `3000`.

Verify:

- `npm run dev` uses port 1320
- `npm run start` uses port 1320
- `.env.example` uses `NEXT_PUBLIC_APP_URL=http://localhost:1320`
- public sandbox URL remains `http://46.250.229.188:1320` when available

## Secret Safety

Do not print or commit:

- passwords
- Supabase service/secret keys
- database URLs
- cookies
- session tokens
- auth tokens

Do not modify or commit `.env.local`.

Do not put passwords in documentation.

## Primary Authority

Read and obey:

- `docs/demo/FOUNDER-SANDBOX-TESTING-GUIDE.md`
- `docs/demo/ROLE-BASED-UX-VALIDATION-GUIDE.md`
- `docs/demo/reviews/FOUNDER-ORG-ADMIN-UX-REVIEW.md`
- `docs/demo/reviews/FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md`
- `docs/demo/reviews/MANUAL-ACCESSIBILITY-REVIEW.md`
- `docs/demo/reviews/UX-FINDINGS-LOG.md`

- `docs/engineering-manual/15-deployment-operations/00-environments.md`
- `docs/engineering-manual/15-deployment-operations/01-vercel-deployment.md`
- `docs/engineering-manual/15-deployment-operations/02-supabase-operations.md`
- `docs/engineering-manual/15-deployment-operations/03-database-migrations-production.md`
- `docs/engineering-manual/15-deployment-operations/04-monitoring-observability.md`
- `docs/engineering-manual/15-deployment-operations/05-error-handling.md`
- `docs/engineering-manual/15-deployment-operations/07-incident-response.md`
- `docs/engineering-manual/16-client-delivery/00-one-day-delivery-playbook.md`
- `docs/engineering-manual/16-client-delivery/04-user-training.md`
- `docs/engineering-manual/16-client-delivery/05-handover.md`

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/12-usability-review-checklist.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`

- `src/modules/inventory/UX-CONFORMANCE.md`
- `src/platform/organization/UX-CONFORMANCE.md`
- `src/business-objects/UX-CONFORMANCE.md`

If documents conflict, stop and report the conflict.

## Repository Safety

Before coding:

1. Run `git status --short`.
2. Record current changed and untracked files.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Do not restore the historical implementation.
5. Limit edits to controlled-demo configuration, guarded demo scripts, demo documentation, focused tests, conformance status updates, and minimal registration/noindex behavior.
6. Do not create a commit unless separately instructed.

# Before Coding

Inspect and report briefly:

1. Current environment validation and server-env structure.
2. Current registration page and registration API behavior.
3. Current root metadata and robots handling.
4. Current sandbox provisioning script.
5. Current demo data canonical values.
6. Current demo accounts and permission profiles.
7. Current package scripts.
8. Current conformance-document statuses.
9. Current demo guides.
10. Files you plan to create.
11. Files you plan to modify.
12. Any ambiguity or risk of changing normal non-demo behavior.

If a real ambiguity exists, stop and wait for Founder approval.

# Part A — Demo Environment Contract

## New environment values

Add non-secret placeholders to `.env.example`:

```text
ONEDAYOS_DEMO_MODE=false
ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=true
ONEDAYOS_DEMO_RESET_APPROVED=false
```

Do not add real values.

Expected sandbox `.env.local` values for controlled demo use:

```text
ONEDAYOS_DEMO_MODE=true
ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false
ONEDAYOS_DEMO_RESET_APPROVED=true
```

Do not edit `.env.local`.

The Founder will set these values privately.

## Server environment validation

Add typed server-side validation for these values using the existing env pattern.

Requirements:

- `ONEDAYOS_DEMO_MODE` defaults to false outside explicit demo config
- `ONEDAYOS_PUBLIC_REGISTRATION_ENABLED` defaults according to existing normal behavior, preferably true unless explicitly disabled
- `ONEDAYOS_DEMO_RESET_APPROVED` defaults false
- values must be parsed as booleans safely
- client code must not receive server-only reset approval
- no `NEXT_PUBLIC_` prefix for reset/registration-control values
- no tenant IDs in environment config

If the project already has equivalent flags, reuse them instead of duplicating.

# Part B — Disable Public Registration in Demo Mode

## Registration API

When:

```text
ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false
```

the registration API must return a stable JSON error such as:

```text
HTTP 403
error.code = REGISTRATION_DISABLED
```

Use the existing API envelope.

Requirements:

- JSON only
- no redirect
- no HTML
- no provider error leakage
- no Supabase Auth user created
- no Prisma rows created
- normal registration behavior remains unchanged when enabled

Do not use client-side hiding as the only enforcement.

## Registration page

When registration is disabled:

- do not render an active registration form
- show a calm, clear state:

```text
Registration is currently invite-only.
Use the demo credentials provided by your OneDayOS guide.
```

- provide a link to Sign in
- do not expose demo passwords
- do not expose service contact details unless already approved
- preserve accessible headings and actions

If detecting the flag requires a server wrapper around a client form, preserve clean server/client boundaries.

## Login page

When registration is disabled:

- hide or disable “Create account” links if present
- do not change login behavior
- do not hardcode demo credentials

## Tests

Required:

- API returns 403 `REGISTRATION_DISABLED`
- no registration service/admin client call occurs when disabled
- enabled mode preserves current behavior
- disabled registration page shows invite-only state
- disabled registration page has Sign in link
- no password appears
- login page does not advertise registration in disabled mode

# Part C — Demo Noindex / Robots Protection

When:

```text
ONEDAYOS_DEMO_MODE=true
```

the sandbox must discourage search indexing.

Implement:

- `robots.txt` behavior that disallows all
- root metadata with `noindex, nofollow` or equivalent
- no public sitemap requirement for demo mode

When demo mode is false, preserve existing normal behavior.

Requirements:

- no dependency
- no route leakage
- no secret values
- test both demo and normal modes

Do not claim this is a security control. It is only indexing guidance.

# Part D — Demo Readiness Checker

Create:

```text
scripts/check-demo-readiness.ts
scripts/check-demo-readiness.test.ts
```

Add package script:

```json
"demo:check": "tsx scripts/check-demo-readiness.ts"
```

The checker must not print secrets.

## Environment checks

Verify:

- `ONEDAYOS_DEMO_MODE=true`
- `ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false`
- `ONEDAYOS_SANDBOX_DB_APPROVED=true`
- demo Org Admin variables exist
- Warehouse User variables exist
- demo passwords are not placeholder-like
- app URL uses port 1320
- database strings contain no placeholder markers

## Database/demo checks

Using safe read-only queries, verify:

- demo organization exists
- subscription exists
- Inventory is enabled
- Org Admin auth/Prisma mapping exists
- Org Admin wildcard permission exists
- Warehouse User auth/Prisma mapping exists
- Warehouse Operator role exists
- Warehouse Operator has exact approved permissions
- Warehouse Operator has no wildcard/admin permission
- Product category exists
- 3 canonical Products exist
- Supplier exists
- Warehouse exists
- 3 InventoryProductExtension rows exist
- 3 StockBalance rows exist
- StockMovement rows exist
- StockAdjustment rows exist
- Coffee Beans canonical low-stock state exists

## Application checks

Verify source/config:

- registration disabled in demo mode
- robots/noindex demo behavior exists
- server start port is 1320
- `check:all` is available

If the server is running, optionally check:

- `/`
- `/login`
- `/register`
- unauthenticated `/api/kernel/auth/me`

Do not require a running server for the DB/source readiness result unless the manual says otherwise.

## Output

Print a concise checklist:

```text
PASS  Demo mode enabled
PASS  Public registration disabled
PASS  Demo org exists
...
```

On failure:

- print variable/condition names only
- do not print values
- exit non-zero
- provide a safe next action

Do not claim public-demo readiness.

Final success language:

```text
Controlled demo readiness checks passed.
Public self-service demo approval is not implied.
```

# Part E — Guarded Demo Reset

Create:

```text
scripts/reset-sandbox-demo.ts
scripts/reset-sandbox-demo.test.ts
```

Add package script:

```json
"demo:reset": "tsx scripts/reset-sandbox-demo.ts"
```

## Safety gates

The reset script must refuse to run unless all are true:

```text
ONEDAYOS_DEMO_MODE=true
ONEDAYOS_SANDBOX_DB_APPROVED=true
ONEDAYOS_DEMO_RESET_APPROVED=true
ONEDAYOS_DEMO_ORG_SLUG is present
```

Reject placeholder database strings.

Require the org slug to match the configured demo org slug.

Do not accept an arbitrary org slug argument.

Do not run against production-like config.

Do not print connection strings.

## Reset scope

Reset only the configured demo organization’s demo operational data.

Do not delete:

- Organization
- Subscription
- Auth users
- Prisma Users
- Roles
- UserRole assignments
- Permissions
- OrgModule enablement
- Branch/Department unless canonical repair requires it
- any other organization

Reset/repair only demo data required for a clean guided walkthrough:

- Inventory StockAdjustments
- Inventory StockMovements
- Inventory StockBalances
- InventoryProductExtensions
- canonical demo Products/Category/Supplier/Warehouse only if necessary

Preferred sequence:

1. Safely delete/recreate demo Inventory operational rows for the configured demo org.
2. Reuse the existing guarded provisioner to recreate canonical data.
3. Verify canonical counts and balances.
4. Preserve both demo accounts and permission profiles.

If the existing provisioner can fully repair canonical state without deleting extra test rows, explain whether deletion is necessary.

For reliable demos, remove extra Inventory operational rows created during manual testing while preserving canonical shared records where practical.

## Transaction and failure safety

- use transaction where practical
- fail without affecting another organization
- no partial reset if an error occurs
- no event emission required for sandbox reset scripts
- script remains outside production app behavior

## Tests

Required:

- refuses without demo mode
- refuses without sandbox approval
- refuses without reset approval
- refuses placeholder DB
- refuses missing demo org slug
- cannot target arbitrary org
- scopes deletes to configured demo org
- preserves users/roles/permissions/org
- invokes canonical provisioning after reset
- does not print secrets
- is idempotent

Do not execute destructive reset in CI.

Use source-contract/unit tests with mocks.

# Part F — Controlled Demo Operations Pack

Create:

```text
docs/demo/
  CONTROLLED-DEMO-RUNBOOK.md
  DEMO-STORYBOARD-INVENTORY.md
  DEMO-READINESS-CHECKLIST.md
  DEMO-KNOWN-LIMITATIONS.md
  WEBSITE-SAMPLE-ASSET-PLAN.md
```

## CONTROLLED-DEMO-RUNBOOK.md

Include:

### Before a demo

1. Verify `.env.local` flags privately.
2. Run `npm run demo:reset`.
3. Run `npm run demo:check`.
4. Run `npm run check:all`.
5. Build and start on port 1320.
6. Test Org Admin login.
7. Test Warehouse User login.
8. Verify Appearance modes.
9. Open all demo routes.
10. Share credentials privately.

### During a demo

- Founder guides the session.
- Use Org Admin for Organization and configuration story.
- Use Warehouse User for least-privilege operational story.
- Do not let prospects change passwords.
- Do not expose `.env.local`.
- Do not describe deferred features as implemented.

### After a demo

- Stop server if no longer needed.
- Rotate demo passwords if shared broadly.
- Run reset before the next session.
- Record findings.
- Do not treat prospect feedback as representative validation automatically.

## DEMO-STORYBOARD-INVENTORY.md

Create a 10–15 minute guided story:

1. Sign in and App Launcher
2. Inventory Dashboard
3. Process Flow
4. Shared Products and Warehouses
5. Stock Levels / low-stock Coffee Beans
6. New positive Stock Adjustment
7. Stock Movement ledger
8. Negative-stock prevention
9. Organization app as Org Admin
10. Warehouse User least-privilege contrast
11. Light / Dark / System appearance
12. Recap of shared platform/module architecture

For each step include:

- purpose
- page
- what to say
- what to click
- expected result
- important limitation not to overclaim

## DEMO-READINESS-CHECKLIST.md

Include unchecked operational items:

- flags configured
- demo reset passed
- demo check passed
- check:all passed
- server started
- accounts tested
- routes tested
- no secrets visible
- screenshots/data clean
- known limitations reviewed
- backup/monitoring/public controls not claimed

## DEMO-KNOWN-LIMITATIONS.md

State clearly:

- controlled sandbox only
- no public self-service demo
- no rate-limit/CAPTCHA hardening
- no public reset automation
- no production SLA
- no production backup guarantee for this sandbox
- no purchasing/sales integrations
- no notifications
- no reporting service
- no import/export engine
- no file uploads
- no independent representative-user validation yet
- formal manual accessibility review still pending
- known upstream Next/PostCSS advisory remains tracked
- HTTP/IP sandbox is not final production hosting

## WEBSITE-SAMPLE-ASSET-PLAN.md

Do not create website assets yet.

Plan safe future assets:

- App Launcher screenshot
- Inventory Dashboard screenshot
- Process Flow screenshot
- Stock Levels screenshot
- New Adjustment screenshot
- Organization People screenshot
- Light/Dark comparison
- short video sequence
- captions and alt text
- data-sanitization checklist

State:

```text
Assets may be produced after controlled demo approval.
No public interactive demo link is approved by this file.
```

# Part G — Conformance and Review Updates

Update truthfully:

```text
src/modules/inventory/UX-CONFORMANCE.md
src/platform/organization/UX-CONFORMANCE.md
src/business-objects/UX-CONFORMANCE.md

docs/demo/reviews/FOUNDER-ORG-ADMIN-UX-REVIEW.md
docs/demo/reviews/FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md
docs/demo/reviews/UX-FINDINGS-LOG.md
```

Based on the Founder’s explicit message, record:

```text
Founder walkthrough completed
No Blocker findings reported
No Must-Fix findings reported
```

Do not fabricate individual scores or task timings.

If the review templates require scores that the Founder did not provide, leave them:

```text
Not scored
```

Do not mark manual accessibility complete unless the Founder explicitly completed it.

Keep:

- independent representative-user validation pending
- independent Org Admin validation pending
- manual accessibility review pending if not completed
- public-demo approval pending

## Approval language

Inventory may move to:

```text
Controlled Founder/Prospect Guided Demo Approved
```

only if:

- `demo:check` passes
- `check:all` passes
- registration is disabled
- reset tooling is guarded
- no Blocker/Must-Fix findings remain

Organization and Shared Records may use the same controlled-guided-demo wording if their gates pass.

Do not use:

```text
Public Demo Approved
Production Ready
WCAG Compliant
ISO Certified
```

# Part H — `check:ux` and CI

Extend `check:ux` only with stable controlled-demo checks:

- demo operations documents exist
- conformance docs do not claim Public Demo Approved
- review docs distinguish Founder proxy from independent validation
- registration disabled behavior exists
- noindex/robots demo behavior exists
- reset script contains required guards
- demo checker exists

Do not require real sandbox env or DB in CI.

Do not run `demo:reset` or `demo:check` in CI.

Keep controlled-demo operations as an operator gate, not a general build gate.

No CI secret requirement.

# Part I — Implementation Note

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-controlled-demo-preparation.md
```

Include:

- Founder review evidence
- registration-control behavior
- demo/noindex behavior
- readiness checker
- guarded reset
- demo operations documents
- tests
- exact approval wording
- pending human/accessibility evidence
- known limitations
- explicit non-goals
- public demo remains unapproved
- next decision after controlled demos

# Manual/Visual Verification

Use port 1320.

If sandbox env flags are set privately, verify:

- `/register` shows invite-only state
- register API returns JSON 403 `REGISTRATION_DISABLED`
- `/robots.txt` disallows indexing
- root metadata includes noindex/nofollow in demo mode
- login works for both demo personas
- app launcher role behavior remains correct
- Inventory/Organization/Records remain correct
- Appearance remains correct
- reset returns demo data to canonical values
- demo check passes after reset

Do not print passwords.

Do not install browser automation.

Save screenshots in `/tmp` if current tooling permits, but do not commit them as public assets.

# Tests

Add meaningful tests.

Required categories:

## Environment/registration

- demo flags parse safely
- registration disabled API behavior
- no auth/DB creation when disabled
- registration enabled behavior remains intact
- invite-only register page
- login registration link hidden when disabled

## Robots/noindex

- demo mode disallows all
- demo mode sets noindex/nofollow
- normal mode preserves existing behavior

## Demo checker

- passes complete mocked state
- fails each missing environment condition
- fails registration enabled
- fails incorrect warehouse permission profile
- fails wildcard/admin warehouse permission
- fails missing canonical data
- ignores secret values in output

## Demo reset

- guard tests listed above
- demo-org-only scope
- users/roles preserved
- canonical provision invoked
- idempotent behavior

## Conformance/docs

- no public-demo claim
- Founder walkthrough recorded accurately
- independent validation remains pending
- manual accessibility status remains honest
- required operations docs exist

Do not write placeholder tests.

# Forbidden Changes

Do not modify:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- Inventory services or APIs except registration-independent test fixtures
- Organization/Records business logic
- module generator
- runtime appearance
- OneDayOS Compact
- Lucide/system font
- `.env.local`
- production deployment infrastructure
- new module code

Do not run:

- migrations
- `prisma db push`
- `prisma migrate reset`
- production database operations
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

If private sandbox flags are configured and safety gates pass, also run:

```bash
npm run demo:reset
npm run demo:check
```

Do not run destructive reset if flags are absent.

Use `next start` on port 1320 for final controlled-demo smoke checks.

# Final Report Required

Report:

1. Controlled Demo Preparation summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Demo environment contract.
6. Registration-disabled behavior.
7. Robots/noindex behavior.
8. `demo:check` implementation and result.
9. `demo:reset` safety design and result.
10. Canonical demo-data verification.
11. Founder walkthrough evidence recorded.
12. Conformance approval wording.
13. Operations documents created.
14. Tests added or strengthened.
15. Updated test count.
16. `check:ux` changes.
17. Accessibility test result.
18. Manual/visual verification result and screenshot paths.
19. Port 1320/server status.
20. Exact verification commands and results.
21. `check:all` result.
22. npm audit result.
23. Git diff/status observations.
24. Any deviations from approved scope.
25. Any unresolved security, UX, accessibility, or operational risks.
26. Confirmation that no Prisma, migrations, new modules, Inventory business logic, theme/preset, generator, public-demo platform, or Platform Service changes occurred.
27. Whether Package 9 is complete.
28. Whether controlled guided Founder/prospect demos are approved.
29. Whether public self-service demo approval remains pending.
30. Whether public website demo claims remain pending.

Stop after this package.

Do not proceed to website asset production, public demo exposure, deployment automation, new modules, or production claims without Founder approval.
