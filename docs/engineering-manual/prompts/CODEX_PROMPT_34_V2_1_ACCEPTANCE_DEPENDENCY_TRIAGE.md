# OneDayOS — V2-1 Acceptance, Authenticated Visual Review, and Dependency Advisory Triage

Inventory Demo V2 Package V2-1 is code-complete and all automated gates pass.

Final V2-1 acceptance is still pending because:

1. The authenticated visual review was not completed.
2. Port 1320 was occupied by an older server process, so the latest build was not proven to be the process shown in the browser.
3. `npm audit --audit-level=moderate` now reports 8 advisories, including 4 high-severity advisories, and these have not been triaged.

This is a verification, acceptance, and audit-triage package.

Do not implement V2-2.

Do not install TanStack Table.

Do not add search, filters, sorting, pagination, selection, or exports.

Do not implement modals, charts, Process Flow Diagram V2, Inventory V2 transactions, caching, accent presets, or website assets.

Do not change Prisma schema.

Do not create or run migrations.

Do not add new modules.

Do not run `npm audit fix` or `npm audit fix --force`.

## Goals

1. Ensure the latest V2-1 build is actually running on port 1320.
2. Complete authenticated visual verification for both demo personas.
3. Verify all V2-1 information-architecture decisions in the real browser.
4. Capture screenshots for Founder review.
5. Triage every npm advisory accurately.
6. Produce an acceptance report and dependency-audit report.
7. Keep V2-2 blocked until the Founder accepts V2-1 and reviews the advisory triage.

## Primary Authority

Read and obey:

- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-1-COMPACT-HEADER-SHARED-RECORDS-IA.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/03-design-system/15-compact-operational-page-header.md`
- `docs/engineering-manual/08-module-system/10-contextual-shared-records.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-1-compact-header-shared-records-ia.md`
- `src/modules/inventory/UX-CONFORMANCE.md`
- `src/business-objects/UX-CONFORMANCE.md`
- `src/platform/organization/UX-CONFORMANCE.md`
- `docs/demo/DEMO-RUNTIME-VALIDATION-REPORT.md`

If these documents conflict, stop and report the conflict.

## Repository Safety

Before work:

1. Run `git status --short`.
2. Record current changed/untracked files.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Do not commit unless separately instructed.
5. Limit fixes to clear V2-1 regressions only.
6. Do not make dependency changes during audit triage.

## Secret Safety

Do not print:

- passwords
- Supabase secret/service keys
- database URLs
- tokens
- cookies
- session values

Do not commit `.env.local`.

## Port Rule

The approved runtime port is:

```text
1320
```

Do not use port 3000.

# Part A — Replace the Stale Server with the Latest Build

## 1. Inspect port 1320

Determine:

- PID
- process type
- start time
- whether it is `next dev` or `next start`
- whether it predates the V2-1 build

Do not print environment values.

## 2. Stop the stale process

Stop the existing process on port 1320 cleanly.

Confirm the port is free.

Do not leave multiple Next.js processes running.

## 3. Build the current tree

Run:

```bash
npm run build
```

It must pass.

## 4. Start the latest production build

Run:

```bash
npm run start
```

on port 1320.

Use `next start`, not `next dev`, for the public sandbox.

Keep the latest server running at the end unless a blocker occurs.

Record the new PID and start mode.

# Part B — Authenticated Browser Review

Use the existing controlled-demo accounts from `.env.local`.

Do not print passwords.

Use separate sessions if possible:

- Org Admin
- Warehouse Operator

Do not install Playwright or Cypress.

Use existing Chrome/Chromium/browser tooling only.

If automated authenticated browser capture is unavailable, prepare exact manual checks and capture available screenshots manually through existing tooling.

## Org Admin expected apps

- Inventory
- Shared Records
- Organization

## Warehouse Operator expected apps

- Inventory
- Shared Records
- Organization absent

# Part C — V2-1 Visual and IA Acceptance Checks

## 1. App Launcher

Route:

```text
/onedayosdemo/apps
```

Verify:

### Org Admin

- Inventory visible
- Shared Records visible
- Organization visible
- no duplicate Records app identity

### Warehouse Operator

- Inventory visible
- Shared Records visible
- Organization absent

### Visual

- app cards fit OneDayOS Compact
- page remains explanatory, not compact
- Light/Dark/System still work
- app switcher remains accessible

## 2. Inventory Dashboard Compact Header

Route:

```text
/onedayosdemo/inventory
```

Verify:

- compact breadcrumb
- one semantic page title
- primary action aligned in the header row
- no oversized routine description block
- real dashboard data remains visible
- Inventory sidebar remains correct
- Product Settings is absent from top-level Inventory navigation

## 3. Inventory Process Flow Explanatory Header

Route:

```text
/onedayosdemo/inventory/process-flow
```

Verify:

- explanatory title/description remains
- it was not incorrectly converted to compact mode
- Process Flow remains readable
- Inventory context remains visible

Do not implement Diagram V2 in this package.

## 4. Inventory Contextual Products

Route according to implemented V2-1 route, expected direction:

```text
/onedayosdemo/inventory/related/products
```

Verify:

- Inventory remains current app
- Inventory sidebar remains visible
- breadcrumb communicates Inventory / Related Records / Products
- shared Product ownership is explicit
- Product list is reused rather than copied
- Inventory remains easy to return to
- app switcher remains available

## 5. Inventory Contextual Categories

Verify equivalent behavior.

## 6. Inventory Contextual Suppliers

Verify:

- Inventory context preserved
- Supplier remains shared
- Purchasing is not presented as implemented

## 7. Inventory Contextual Customers

Verify:

- Inventory context preserved
- Customer remains shared
- CRM is not presented as implemented
- no Customer mutation action appears without permission

## 8. Inventory Contextual Warehouses

Verify:

- Inventory context preserved
- Warehouse remains shared
- Warehouse is not presented as Inventory-owned

## 9. Direct Shared Records App

Routes:

```text
/onedayosdemo/records
/onedayosdemo/records/products
/onedayosdemo/records/product-categories
/onedayosdemo/records/customers
/onedayosdemo/records/suppliers
/onedayosdemo/records/warehouses
```

Verify:

- Shared Records is current app
- Shared Records sidebar is used
- only permitted record types appear
- People is absent
- Inventory transactions are absent
- app switcher remains visible
- pages use compact operational headers
- ownership wording is accurate

## 10. Product Settings Compatibility

Verify:

- Product Settings is absent from top-level Inventory navigation
- contextual link/action remains available from Stock Levels and/or contextual Products
- compatibility route works or redirects safely
- no redirect loop
- Warehouse Operator sees only permitted read/update behavior
- InventoryProductExtension functionality remains reachable
- no data/API/service was removed

## 11. Organization Regression

Route:

```text
/onedayosdemo/organization/people
```

Verify:

- Organization remains Org Admin-only
- compact header is appropriate
- Organization sidebar remains focused
- Shared Records and Inventory app changes did not break it

## 12. Appearance Regression

Verify Light, Dark, and System on:

- Inventory Dashboard
- Shared Records Products
- Inventory contextual Products
- Organization People

Confirm:

- persistence after reload
- readable selected states
- compact header remains readable in both modes
- no brand/accent regression

# Part D — Screenshots for Founder Review

Use a consistent desktop viewport, preferably:

```text
1440 × 900
```

Save to `/tmp`.

Required screenshots:

```text
/tmp/v2-1-org-admin-app-launcher-light.png
/tmp/v2-1-warehouse-app-launcher-light.png
/tmp/v2-1-inventory-dashboard-compact-light.png
/tmp/v2-1-inventory-dashboard-compact-dark.png
/tmp/v2-1-process-flow-explanatory.png
/tmp/v2-1-inventory-context-products.png
/tmp/v2-1-shared-records-products.png
/tmp/v2-1-shared-records-app.png
/tmp/v2-1-product-settings-contextual-access.png
/tmp/v2-1-organization-people.png
```

If a screenshot cannot be captured, state why.

Do not commit screenshots.

Do not resume website asset production.

# Part E — V2-1 Functional/Permission Checks

Verify through tests or safe runtime inspection:

- Shared Records is not controlled by `OrgModule`
- Shared Records visibility requires at least one supported read permission
- no supported read permission means Shared Records hidden
- contextual Inventory routes use shared services/APIs
- no duplicate Product/Category/Customer/Supplier/Warehouse service was added
- Warehouse Operator cannot access Organization
- Warehouse Operator cannot mutate Product/Warehouse without permission
- Product Settings update remains permission-protected
- direct unauthorized routes fail safely
- no tenant scoping was weakened
- no hidden/client-supplied `orgId`

# Part F — Dependency Advisory Triage

Do not modify dependencies.

Run:

```bash
npm audit --json
npm audit --omit=dev --json
npm audit --audit-level=high
npm ls --all
```

Capture output safely to temporary files if needed.

Do not print secrets.

## Create dependency triage document

Create:

```text
docs/engineering-manual/00-meta/
  DEPENDENCY-AUDIT-TRIAGE-2026-07.md
```

For every advisory include:

- advisory ID/title
- severity
- affected package
- installed version
- dependency path
- direct or transitive
- production/runtime or dev-only
- vulnerable range
- patched version/range, if available
- whether `npm audit` proposes a force/breaking change
- actual OneDayOS exposure assessment
- exploit prerequisites
- recommended action
- temporary mitigation
- owner
- status

Do not dismiss high advisories merely because tests pass.

Do not describe an advisory as exploitable unless supported by the advisory and current usage.

Do not describe it as irrelevant without evidence.

## Classify each advisory

Use:

```text
Blocker before V2-2
Must remediate before controlled demo
Can patch safely now in separate package
Transitive/upstream tracked
Dev-only / no runtime exposure, tracked
Needs deeper review
```

## Decision rules

V2-2 must remain blocked if any high advisory:

- affects production runtime
- has a realistic exposure in current usage
- has a compatible non-breaking fix
- or has not been sufficiently understood

Do not upgrade packages in this task.

If remediation is needed, recommend a separate:

```text
Dependency Security Remediation Package
```

before V2-2.

# Part G — Acceptance Documents

## Create V2-1 acceptance report

Create:

```text
docs/engineering-manual/00-meta/
  V2-1-ACCEPTANCE-REPORT.md
```

Required sections:

```text
# V2-1 Acceptance Report

## Status

## Latest Build Runtime

## Automated Gates

## Authenticated Visual Review

## Compact Header Review

## Shared Records App Review

## Context-Preserving Related Records Review

## Product Settings Compatibility Review

## Role/Permission Review

## Light/Dark/System Review

## Screenshots

## Dependency Advisory Summary

## Findings

## Blockers

## Must-Fix Items

## Polish Items

## Founder Approval Required

## V2-2 Readiness
```

Do not mark Founder visual approval complete unless the Founder explicitly approves after reviewing screenshots/live pages.

Recommended status:

```text
Code and Automated Gates Complete
Founder Visual Acceptance Pending
Dependency Triage Pending Founder Review
```

If all review work is completed by Codex, keep Founder approval pending.

## Update implementation note

Update:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-1-compact-header-shared-records-ia.md
```

Add:

- latest-server verification
- visual review evidence
- screenshot paths
- dependency triage reference
- outstanding Founder acceptance

Do not mark V2-2 approved.

# Part H — Clear V2-1 Fixes Allowed

If the authenticated review reveals a clear V2-1 regression, you may fix only:

- compact-header spacing/semantics
- Shared Records app visibility
- current-app detection
- sidebar context
- contextual route links
- shared presenter reuse
- Product Settings contextual access/redirect
- V2-1 accessibility issue
- V2-1 test gap

Do not implement any V2-2 feature.

For every fix:

- add/strengthen a regression test
- report the file
- rerun full gates
- update acceptance report

If an issue requires V2-2 or later architecture, report it instead of implementing it.

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
npm run demo:check
npm audit --audit-level=moderate
npm audit --audit-level=high
git diff --check
git status --short
```

Do not run:

```bash
npm audit fix
npm audit fix --force
```

# Final Report Required

Report:

1. V2-1 acceptance-pass summary.
2. Stale server process handling.
3. Latest runtime PID/mode/URL.
4. Files inspected.
5. Files created.
6. Files modified.
7. Authenticated Org Admin visual review.
8. Authenticated Warehouse visual review.
9. Compact-header review.
10. Explanatory-header review.
11. Shared Records app review.
12. Context-preserving Related Records review.
13. Product Settings compatibility review.
14. Role/permission review.
15. Light/Dark/System review.
16. Screenshot paths.
17. Any V2-1 fixes made.
18. Updated test count.
19. Exact verification commands and results.
20. `check:all` result.
21. `demo:check` result.
22. Dependency advisories by severity.
23. Production vs dev-only advisory split.
24. Direct vs transitive advisory split.
25. Recommended dependency remediation action.
26. V2-1 blockers/must-fix/polish findings.
27. Founder decisions still required.
28. Whether V2-1 is ready for Founder visual approval.
29. Whether V2-2 is ready or blocked.
30. Confirmation that no V2-2+ features, Prisma, migrations, dependency changes, charts, modals, exports, Inventory V2 transactions, caching, accent presets, website assets, new modules, or Platform Services were added.

Stop after V2-1 acceptance and audit triage.

Do not proceed to V2-2 or dependency remediation without Founder approval.
