# OneDayOS — Organization and Shared Records UX Conformance Retrofit Package 7

You are implementing the next approved OneDayOS UX package.

Completed and verified before this package:

- UX Governance
- Shared UX Code
- Generator UX Enforcement
- Inventory UX Conformance Retrofit
- Automated UX and Accessibility Gates
- OneDayOS Compact Design Preset Lock
- Runtime Appearance Hardening

The Founder explicitly approves **Organization and Shared Records UX Conformance Retrofit Package 7 only**.

This package brings the remaining currently implemented authenticated surfaces onto the same reusable UX system already proven by Inventory.

## Package Goal

Retrofit:

1. The built-in **Organization app**
2. The shared **Records surfaces**

so they consistently use:

- the persistent OneDayOS shell
- shared page-pattern components
- contextual loading, empty, error, denied, and unavailable states
- OneDayOS Compact tokens and geometry
- Light / Dark / System appearance
- current accessibility gates
- role-relevant navigation
- honest UX conformance records

This package must preserve the existing product decisions:

- Organization is a built-in admin app.
- Organization is visible only to Org Admin users.
- Organization is not controlled by `OrgModule`.
- Organization contains:
  - People
  - Branches & Departments
  - Settings
- Records are shared data surfaces, not apps.
- Employees/People belong in Organization for the current UX.
- Products, Categories, Suppliers, and Warehouses remain related shared records for Inventory.
- Customers remain a shared Business Object but are not shown in the Inventory sidebar.
- Records must never trap the user away from enabled apps.
- Inventory and Organization remain accessible through the app switcher according to permissions.

## Explicit Non-Goals

Do not:

- add a new business module
- add a Process Flow page to Records merely to satisfy a pattern
- treat Records as an app
- turn Organization into a business module
- add HRIS workflows
- add payroll, attendance, onboarding, or leave behavior
- add custom organization theming
- add organization accent controls
- change Inventory business logic or APIs
- change Prisma schema
- create migrations
- run migrations
- change auth architecture
- modify the module generator unless a severe regression is discovered and reported
- implement Dynamic Forms or Dynamic CRUD
- implement Platform Services
- implement runtime AI
- add FastAPI
- add browser automation
- claim formal WCAG compliance
- claim representative-user validation unless it actually occurs

## Local Port Rule

The app must remain on port `1320`.

Do not switch back to `3000`.

Verify:

- `npm run dev` uses port 1320
- `npm run start` uses port 1320
- `.env.example` uses `NEXT_PUBLIC_APP_URL=http://localhost:1320`
- port 3000 appears only in rejection guards or archived/historical documentation

## Primary Implementation Authority

Read and follow:

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/11-module-ux-contract.md`
- `docs/engineering-manual/03-design-system/12-usability-review-checklist.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0011-human-centred-ux-standard.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0012-onedayos-compact-design-preset.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0013-runtime-appearance-preference.md`

Also obey:

- `docs/engineering-manual/03-design-system/02-layout-system.md`
- `docs/engineering-manual/03-design-system/03-component-standards.md`
- `docs/engineering-manual/03-design-system/04-table-standards.md`
- `docs/engineering-manual/03-design-system/05-form-standards.md`
- `docs/engineering-manual/03-design-system/06-empty-loading-error-states.md`
- `docs/engineering-manual/03-design-system/08-accessibility-standards.md`
- `docs/engineering-manual/04-kernel/02-organizations-tenancy.md`
- `docs/engineering-manual/04-kernel/03-users-roles-permissions.md`
- `docs/engineering-manual/04-kernel/04-authorization-enforcement.md`
- `docs/engineering-manual/04-kernel/05-settings-configuration.md`
- `docs/engineering-manual/04-kernel/07-routing-app-shell.md`
- `docs/engineering-manual/07-business-objects/00-business-object-philosophy.md`
- `docs/engineering-manual/07-business-objects/01-employee.md`
- `docs/engineering-manual/07-business-objects/02-product.md`
- `docs/engineering-manual/07-business-objects/03-customer.md`
- `docs/engineering-manual/07-business-objects/04-supplier.md`
- `docs/engineering-manual/07-business-objects/05-warehouse.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/04-api-security.md`
- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`
- `docs/engineering-manual/14/testing-quality/08-ci-quality-gates.md` if it exists; otherwise use `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`

Inspect current implementation notes under:

- `docs/engineering-manual/03-design-system/`
- `docs/engineering-manual/07-business-objects/`
- `docs/engineering-manual/14-testing-quality/`

If documents conflict, stop and report the conflict instead of inventing a resolution.

## Repository Safety

The worktree may contain many existing changes.

Before coding:

1. Run `git status --short`.
2. Record current changed and untracked files.
3. Do not reset, delete, restore, or overwrite unrelated work.
4. Do not restore the historical implementation.
5. Keep edits scoped to Organization/Records UX retrofit files, focused tests, `check:ux` additions, accessibility tests, conformance documents, and the implementation note.
6. Do not create a commit unless separately instructed.

## Before Coding

Inspect and report briefly:

1. Current Organization routes and components.
2. Current Records routes and components.
3. Current People/Employee UI behavior.
4. Current Branches & Departments UI behavior.
5. Current Settings UI behavior.
6. Current Product, Category, Customer, Supplier, and Warehouse list/form/detail pages.
7. Current shell/navigation behavior on direct Records routes.
8. Current permission enforcement for Organization routes.
9. Current shared page-pattern APIs.
10. Current contextual loading/error files.
11. Current accessibility tests for Organization/Records.
12. Current `check:ux` coverage for non-module platform surfaces.
13. Files you plan to create.
14. Files you plan to modify.
15. Any ambiguity or over-abstraction risk.

If there is a real architecture ambiguity, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# Part A — Organization App UX Retrofit

## Organization Route Contract

Preserve or normalize:

```text
/[orgSlug]/organization
/[orgSlug]/organization/people
/[orgSlug]/organization/branches-departments
/[orgSlug]/organization/settings
```

Preferred behavior:

- `/[orgSlug]/organization` may redirect to `/[orgSlug]/organization/people` if that is the current accepted behavior.
- Do not invent a fake Organization dashboard.
- Organization remains accessible only to Org Admin.
- Non-admin users do not see Organization in the app switcher.
- Direct non-admin access must fail safely through the current permission model.

## Organization Page Patterns

Use shared patterns:

### People

Use `ListPage` for the People list.

Use `FormPage` for create/edit People forms where implemented.

Page contract:

```text
Breadcrumb: Organization / People
Title: People
Description: Manage people and platform-user relationships for this organization.
Primary action: New Person, if implemented and permitted
```

Important:

- User is not Employee.
- Employee can exist without a login.
- Do not add HRIS, payroll, attendance, leave, or onboarding workflows.
- Do not expose raw User IDs or tenant IDs.
- Do not submit `orgId`.

### Branches & Departments

Use `ListPage`, `DetailPage`, or a composed two-section page as appropriate.

Page contract:

```text
Breadcrumb: Organization / Branches & Departments
Title: Branches & Departments
Description: Manage company locations and organizational structure used across OneDayOS.
```

Important:

- Branch and Department are Kernel organization-structure primitives.
- Department may be branch-optional.
- Do not invent matrix-org features beyond current schema.
- Do not add warehouses here as if Branch and Warehouse were identical.
- No hidden `orgId`.

### Settings

Use `SettingsPage`.

Page contract:

```text
Breadcrumb: Organization / Settings
Title: Settings
Description: Configure organization-wide preferences supported by OneDayOS.
```

Important:

- Use typed settings only.
- Do not expose a raw JSON editor.
- Do not create organization theme controls.
- Do not store secrets.
- Do not enable modules through generic Settings if module enablement has a separate system.
- Do not grant permissions through Settings.
- Render only settings currently supported by the app.
- If no editable settings exist yet, show an honest empty/informational state instead of fake controls.

## Organization Contextual States

Use shared helpers:

- settings-shaped loading
- list/table loading
- form loading
- safe error
- permission denied

Do not use generic final `Loading...`, `Error`, or `No data`.

## Organization UX Conformance

Create:

```text
src/platform/organization/
  UX-CONFORMANCE.md
```

Do not force a `ModuleUxContract`; Organization is a built-in admin app, not a business module.

Required sections:

```text
# Organization App UX Conformance

## Status

## Product Role

## Primary Users

## Primary Tasks

## Critical Errors to Prevent

## Shared Page Patterns

## Automated Structural Checks

## Automated Accessibility Checks

## Manual Accessibility Review

## Founder Review

## Representative Org Admin Review

## Findings

## Resolutions

## Deferred Issues

## Approval Result
```

Truthful status after this package:

```text
Implementation Conformance Complete
Independent Org Admin Validation Pending
```

Do not claim Public Demo approval.

# Part B — Shared Records UX Retrofit

## Records Product Decision

Records are shared data surfaces.

They are not:

- an app
- a module
- an app-switcher item
- a replacement for Inventory or Organization
- a dumping ground for every platform table

Direct Records routes must retain:

- organization name
- app switcher
- profile menu
- path back to enabled apps

## Records Landing Page

Inspect:

```text
/[orgSlug]/records
```

Use `AppPage` or an appropriate shared pattern.

The landing page should explain:

```text
Shared Records are organization-wide business identities used by enabled apps.
```

Do not present Records as an app.

Do not display fake statistics.

List available shared record types according to current permissions.

For the current platform, these may include:

- Products
- Categories
- Customers
- Suppliers
- Warehouses

People should remain under Organization for current primary navigation.

If an Employee route remains directly accessible for compatibility, it should guide users to Organization → People where appropriate without breaking URLs.

## Shared Record Pages

Retrofit current pages for:

- Products
- Product Categories
- Customers
- Suppliers
- Warehouses

Use:

- `ListPage` for list pages
- `FormPage` for create/edit pages
- `DetailPage` for detail pages where implemented
- shared contextual states

Required descriptions:

### Products

```text
Shared product/SKU identity used by Inventory and future modules.
```

### Product Categories

```text
Shared product classification used across product-based workflows.
```

### Customers

```text
Shared customer identity used by CRM and future customer-facing workflows.
```

Do not imply CRM is implemented.

### Suppliers

```text
Shared supplier identity used by Inventory, Purchasing, and future procurement workflows.
```

Do not imply Purchasing is implemented.

### Warehouses

```text
Shared warehouse/location identity used by Inventory and future stock workflows.
```

Do not imply Warehouse is owned by Inventory.

## Shared Records Ownership Clarity

Every relevant page must preserve:

```text
Architecture decides ownership.
UX explains relevance.
```

Products and Warehouses remain shared even when opened from Inventory.

Do not add module-specific fields to shared forms.

Do not expose:

- reorder point in Product core form
- stock quantity in Product core form
- inventory settings in Warehouse core form
- CRM lifecycle in Customer core form
- purchasing payment terms in Supplier core form

## Records Contextual States

Use:

- table/list loading
- form loading
- true empty
- filtered empty where filtering exists
- safe error
- permission denied

Do not add search, pagination, exports, saved views, or reporting unless already implemented.

## Shared Records UX Conformance

Create:

```text
src/business-objects/
  UX-CONFORMANCE.md
```

This is a shared-surface conformance record, not a module contract.

Required sections:

```text
# Shared Records UX Conformance

## Status

## Product Role

## Record Types Covered

## Ownership Rules

## Primary Tasks

## Critical Errors to Prevent

## Shared Page Patterns

## Automated Structural Checks

## Automated Accessibility Checks

## Manual Accessibility Review

## Founder Review

## Representative User Review

## Findings

## Resolutions

## Deferred Issues

## Approval Result
```

Truthful status:

```text
Implementation Conformance Complete
Representative-User Validation Pending
```

Do not claim Public Demo approval.

# Files to Create

Expected:

```text
src/platform/organization/UX-CONFORMANCE.md
src/business-objects/UX-CONFORMANCE.md

docs/engineering-manual/03-design-system/
  IMPLEMENTATION-NOTE-organization-records-ux-retrofit.md
```

Create focused accessibility/conformance tests where current structure requires them.

Do not create Organization or Records Process Flow files merely for symmetry.

# Expected Files to Modify

Inspect exact paths before editing.

Likely Organization files:

```text
src/app/[orgSlug]/organization/page.tsx
src/app/[orgSlug]/organization/people/page.tsx
src/app/[orgSlug]/organization/branches-departments/page.tsx
src/app/[orgSlug]/organization/settings/page.tsx
src/app/[orgSlug]/organization/loading.tsx
src/app/[orgSlug]/organization/error.tsx
```

Likely Records files:

```text
src/app/[orgSlug]/records/page.tsx
src/app/[orgSlug]/records/loading.tsx
src/app/[orgSlug]/records/error.tsx

src/app/[orgSlug]/records/products/**
src/app/[orgSlug]/records/product-categories/**
src/app/[orgSlug]/records/customers/**
src/app/[orgSlug]/records/suppliers/**
src/app/[orgSlug]/records/warehouses/**
```

Modify shared Business Object client components only as needed to consume shared patterns.

Potentially modify:

```text
src/platform/navigation/tenant-navigation.ts
src/components/onedayos/app-shell.tsx
```

only if a small navigation-conformance fix is required.

Do not alter the approved app-switcher model.

Do not alter Inventory navigation.

# Page Pattern Requirements

## List pages

Use `ListPage`.

Preserve:

- server data fetching
- permission checks
- tenant scoping
- existing APIs
- existing table behavior
- existing primary actions
- existing empty/error semantics

Do not move business logic into page-pattern components.

## Form pages

Use `FormPage`.

Preserve:

- React Hook Form/Zod behavior
- safe API route
- no `orgId`
- validation errors
- pending state
- cancel/back behavior
- server/client boundaries

Do not implement Dynamic Forms.

## Detail pages

Use `DetailPage` where it improves existing detail pages.

Do not convert every field into disabled inputs.

Do not create detail pages that do not already have product value.

## Settings

Use `SettingsPage`.

Do not invent settings.

## Page headers

Use standard:

- breadcrumb
- title
- description
- primary action
- contextual help where needed

Do not add a duplicate top navbar.

# Permission and Role Scenarios

Add or strengthen tests:

## Organization

- Org Admin sees Organization in app launcher.
- Non-admin does not see Organization.
- Org Admin can open People.
- Non-admin direct access is denied safely.
- Inventory permissions alone do not grant Organization access.
- Organization pages do not expose tenant IDs.
- People page does not imply every Employee has a login.

## Records

- authorized user sees only permitted record actions.
- hidden UI action is not treated as security.
- API/service permission enforcement remains unchanged.
- direct Records route retains app switcher.
- Inventory remains reachable from Products/Warehouses.
- Product does not appear Inventory-owned.
- Warehouse does not appear Inventory-owned.
- Customer page does not imply CRM is enabled.
- Supplier page does not imply Purchasing is enabled.

Do not weaken backend permissions.

# Accessibility Tests

Use the existing axe helper.

Add selected automated coverage for:

- Organization People list
- Branches & Departments page/presentational content
- Organization Settings state
- Records landing page
- Products list
- Product form
- Warehouses list
- one permission-denied state

If full server pages are difficult to render without auth/DB, test presentational/client components and document the limitation.

Do not mock away semantics.

Preserve `test:a11y`.

# `check:ux` Enhancements

Extend stable checks to current built-in/shared surfaces.

Potential checks:

- Organization UX conformance document exists.
- Shared Records UX conformance document exists.
- Organization People page uses shared page pattern.
- Organization Settings uses `SettingsPage`.
- Records list pages use `ListPage`.
- shared forms use `FormPage`.
- Records are not declared as an app.
- Organization is not declared as an `OrgModule`.
- People/Employees do not appear in Inventory navigation.
- Customers do not appear in Inventory navigation.
- no duplicate page navbar replaces sidebar.
- no generic final loading/error placeholders.

Do not hardcode fragile class strings.

Do not force Process Flow for Organization or Records.

Preserve all existing module checks.

# Manual Visual Review

Use the sandbox server on port 1320 if available.

Do not install Playwright.

If authenticated review is available without printing secrets, inspect in both Light and Dark:

- `/onedayosdemo/apps`
- `/onedayosdemo/organization/people`
- `/onedayosdemo/organization/branches-departments`
- `/onedayosdemo/organization/settings`
- `/onedayosdemo/records`
- `/onedayosdemo/records/products`
- `/onedayosdemo/records/product-categories`
- `/onedayosdemo/records/customers`
- `/onedayosdemo/records/suppliers`
- `/onedayosdemo/records/warehouses`

Verify:

- Organization uses the shared shell and focused sidebar.
- People is clearly organization administration, not Inventory.
- Settings does not show fake controls.
- Records are not presented as an app.
- Product/Warehouse ownership is clear.
- App switcher remains accessible.
- Inventory remains reachable from Records.
- page patterns look consistent with Inventory.
- Light/Dark/System remain functional.
- tables/forms/loading/error states remain readable.

Save screenshots in `/tmp` if tooling exists and report paths.

Do not install browser automation.

# Manual UX Evidence

This package may record a Founder implementation review if actually performed.

Do not claim:

- independent Org Admin validation
- representative warehouse-user validation
- full keyboard review
- screen-reader validation
- public demo approval

unless actually completed.

# Tests

Add meaningful tests.

Required categories:

## Pattern integration

- Organization People uses `ListPage`.
- Organization Settings uses `SettingsPage`.
- Records landing uses shared page frame.
- Product/Category/Customer/Supplier/Warehouse lists use `ListPage`.
- relevant create/edit forms use `FormPage`.
- contextual loading/error states use shared helpers.

Use source-contract tests only when server page rendering is impractical.

## Navigation/IA

- Records are not in app launcher.
- Organization remains Org Admin-only.
- People does not appear in Inventory sidebar.
- Customers do not appear in Inventory sidebar.
- Products/Warehouses remain reachable.
- app switcher remains visible on direct Records routes.

## Ownership wording

- Product page identifies Product as shared.
- Warehouse page identifies Warehouse as shared.
- Customer page does not claim CRM is implemented.
- Supplier page does not claim Purchasing is implemented.
- People page distinguishes Employee from User/login.

## State behavior

- true empty and filtered empty are distinguishable where applicable.
- safe error does not expose technical details.
- permission denied is distinct from not found.
- Settings empty state is honest if no editable settings exist.

## Appearance/a11y regression

- Light/Dark/System provider remains unchanged.
- selected states remain readable.
- no raw brand/orange leakage is introduced.
- automated accessibility tests pass.

Do not add placeholder tests.

# Implementation Note

Create:

```text
docs/engineering-manual/03-design-system/
  IMPLEMENTATION-NOTE-organization-records-ux-retrofit.md
```

Include:

- files created/modified
- Organization pages retrofitted
- Records pages retrofitted
- page patterns consumed
- loading/error states consumed
- IA decisions preserved
- accessibility tests added
- conformance statuses
- manual evidence completed
- human validation pending
- explicit non-goals
- no schema/API/business changes
- follow-up:
  - manual accessibility review
  - representative Org Admin walkthrough
  - representative operational user walkthrough
  - controlled demo preparation

# Forbidden Changes

Do not modify:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- Inventory services/APIs/schema
- auth architecture
- module generator
- `.env.local`
- demo provisioning
- public deployment automation
- runtime appearance behavior
- OneDayOS Compact preset
- Lucide version
- system font
- new module code
- Platform Services

Do not run migrations.

Do not run demo provisioning unless a read-only verification is impossible and the safety flag is present; prefer no provisioning.

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

Do not run:

```bash
npm audit fix --force
```

Use port 1320 for visual/smoke checks if the server is available.

# Final Report Required

Report:

1. Organization and Shared Records retrofit summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Organization page-pattern retrofit.
6. Records page-pattern retrofit.
7. Loading/error-state retrofit.
8. Organization conformance status.
9. Shared Records conformance status.
10. IA/navigation behavior.
11. Permission/role behavior.
12. Accessibility tests added.
13. Updated full test count.
14. `test:a11y` result.
15. `check:ux` changes.
16. Manual visual review result and screenshot paths.
17. Light/Dark/System regression result.
18. Exact verification commands and results.
19. `check:all` result.
20. npm audit result.
21. Git diff/status observations.
22. Any deviations from frozen UX governance.
23. Any unresolved UX, accessibility, or role-relevance risks.
24. Confirmation that no Prisma, migrations, Inventory business logic/APIs, generator, theme/preset, new modules, or Platform Services were changed.
25. Whether Package 7 is complete.
26. Whether manual accessibility and representative-user review remain pending.
27. Whether Controlled Demo Preparation remains blocked pending Founder approval.
28. Whether public website demo approval remains pending.

Stop after this package.

Do not proceed to manual review claims, controlled demo preparation, public demo work, deployment automation, or new modules without Founder approval.
