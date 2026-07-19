# OneDayOS — Inventory UX Conformance Retrofit Package 4

You are implementing the fourth package of the OneDayOS reusable UX system.

UX Governance has been reviewed and frozen.

Shared UX Code Package 2 has been implemented and verified.

Generator UX Enforcement Package 3 has been implemented and verified.

The Founder explicitly approves Inventory UX Conformance Retrofit Package 4 only.

This package makes Inventory the first official reference module that fully consumes the frozen UX governance and shared UX pattern library.

This is NOT permission to:

- add new Inventory features
- change Inventory database schema
- run migrations
- implement new business modules
- modify Organization or Records pages except for a tiny shared-navigation compatibility fix if strictly required
- implement `check:ux`
- install accessibility tooling
- implement themes
- implement Dynamic Forms or Dynamic CRUD
- implement Platform Services
- implement runtime AI
- add FastAPI
- create client-specific UI forks

## Primary Implementation Authority

Read and follow:

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/11-module-ux-contract.md`
- `docs/engineering-manual/03-design-system/12-usability-review-checklist.md`
- `docs/engineering-manual/03-design-system/templates/module-ux-review.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0011-human-centred-ux-standard.md`
- `docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-shared-ux-code-package.md`
- `docs/engineering-manual/09-cli-generators/IMPLEMENTATION-NOTE-generator-ux-enforcement-package.md`

Also obey:

- `docs/engineering-manual/17-module-specifications/01-inventory-module.md`
- `docs/engineering-manual/08-module-system/00-module-philosophy.md`
- `docs/engineering-manual/08-module-system/03-module-folder-contract.md`
- `docs/engineering-manual/08-module-system/04-module-permissions.md`
- `docs/engineering-manual/08-module-system/05-module-navigation.md`
- `docs/engineering-manual/08-module-system/06-module-events.md`
- `docs/engineering-manual/08-module-system/09-module-testing.md`
- `docs/engineering-manual/07-business-objects/00-business-object-philosophy.md`
- `docs/engineering-manual/07-business-objects/02-product.md`
- `docs/engineering-manual/07-business-objects/04-supplier.md`
- `docs/engineering-manual/07-business-objects/05-warehouse.md`
- `docs/engineering-manual/07-business-objects/07-business-object-extension-pattern.md`
- `docs/engineering-manual/03-design-system/02-layout-system.md`
- `docs/engineering-manual/03-design-system/03-component-standards.md`
- `docs/engineering-manual/03-design-system/04-table-standards.md`
- `docs/engineering-manual/03-design-system/05-form-standards.md`
- `docs/engineering-manual/03-design-system/06-empty-loading-error-states.md`
- `docs/engineering-manual/03-design-system/08-accessibility-standards.md`
- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`
- `docs/engineering-manual/14/testing-quality/08-ci-quality-gates.md` if that path exists; otherwise use `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`

Also inspect current implementation notes:

- `docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-app-switcher-organization-app.md`
- `docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-app-launcher-sidebar-profile.md`
- `docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-inventory-process-flow-sidebar-polish.md`
- `docs/engineering-manual/07-business-objects/IMPLEMENTATION-NOTE-business-objects-package.md`
- `docs/engineering-manual/09-cli-generators/IMPLEMENTATION-NOTE-generator-package.md`

If these documents conflict, stop and report the conflict instead of inventing a resolution.

## Repository Safety

The worktree may contain many existing changes from prior packages.

Before coding:

1. Run `git status --short`.
2. Record the current changed/untracked files.
3. Do not reset, delete, restore, or overwrite unrelated work.
4. Do not restore the historical implementation.
5. Limit edits strictly to Inventory UX conformance files, Inventory route refactors, Inventory tests, required exports, and the implementation note.
6. Do not create a commit unless the Founder separately instructed you to commit.

## Local Port Rule

The app must remain on port `1320`.

Do not switch back to `3000`.

Verify:

- `npm run dev` uses port 1320
- `npm run start` uses port 1320
- `.env.example` uses `NEXT_PUBLIC_APP_URL=http://localhost:1320`
- port 3000 appears only in rejection guards or archived/historical documentation

## Goal

Make Inventory the reference implementation of the OneDayOS UX Constitution.

Inventory must:

1. Have a complete, truthful Module UX Contract.
2. Have a reusable declarative Process Flow definition.
3. Render Process Flow through the shared `ProcessFlowPage`.
4. Use shared page-pattern components across Inventory pages.
5. Use contextual shared loading/error/empty states.
6. Preserve the persistent app shell and focused Inventory navigation.
7. Make shared Business Object ownership clear.
8. Prevent critical Inventory errors.
9. Record honest UX conformance status.
10. Remain functionally equivalent unless a clear UX bug is fixed.

The retrofit must not turn Inventory into a generic page-builder implementation.

## Core Inventory UX Model

Inventory primary users:

- warehouse staff
- inventory supervisor
- Org Admin when performing administrative Inventory tasks

Primary user goals:

- know current stock quantity
- identify low-stock products
- post a safe stock adjustment
- review the stock movement ledger
- configure Inventory-specific tracking for shared Products

Primary tasks:

- open Inventory Dashboard
- review tracked and low-stock products
- review Stock Levels
- post a Stock Adjustment
- review Stock Movements
- update Product Settings
- open shared Product or Warehouse records when needed
- understand the module through Process Flow

Critical errors to prevent:

- posting to the wrong Warehouse
- using a Product or Warehouse from another organization
- reducing stock below zero
- accepting client-computed previous/new/balance values
- partially creating adjustment, movement, or balance changes
- emitting success events after failed persistence
- making Product or Warehouse appear Inventory-owned

Related shared Business Objects:

- Product
- ProductCategory
- Supplier
- Warehouse

Inventory-owned records:

- InventoryProductExtension
- StockBalance
- StockMovement
- StockAdjustment

Default landing page:

- `/[orgSlug]/inventory`

Process Flow route:

- `/[orgSlug]/inventory/process-flow`

## Files to Create

Create:

```text
src/modules/inventory/
  ux.ts
  process-flow.ts
  UX-CONFORMANCE.md

src/modules/inventory/__tests__/
  ux.test.ts
  process-flow.test.ts

docs/engineering-manual/17-module-specifications/
  IMPLEMENTATION-NOTE-inventory-ux-conformance-retrofit.md
```

Create additional Inventory page-pattern tests only if they fit existing test conventions.

Do not create new Prisma files.

Do not create new migrations.

## Expected Files to Modify

Inspect actual paths before editing. Expected files include:

```text
src/modules/inventory/index.ts
src/modules/inventory/manifest.ts
src/modules/inventory/navigation.ts

src/app/[orgSlug]/inventory/page.tsx
src/app/[orgSlug]/inventory/loading.tsx
src/app/[orgSlug]/inventory/error.tsx

src/app/[orgSlug]/inventory/process-flow/page.tsx
src/app/[orgSlug]/inventory/process-flow/loading.tsx

src/app/[orgSlug]/inventory/product-settings/page.tsx
src/app/[orgSlug]/inventory/stock-levels/page.tsx
src/app/[orgSlug]/inventory/stock-movements/page.tsx
src/app/[orgSlug]/inventory/stock-adjustments/page.tsx
src/app/[orgSlug]/inventory/stock-adjustments/new/page.tsx
```

Modify child/client components only where necessary to integrate the shared patterns without moving server-only work into client components.

Potentially modify existing Inventory loading/error files to consume shared page-state helpers.

Do not broadly modify Organization or Records pages.

Do not modify the generator in this package.

## Before Coding

Inspect and report briefly:

1. Current Inventory module files.
2. Current Inventory page route structure.
3. Current page headers/layout wrappers used by each Inventory page.
4. Current Process Flow page implementation.
5. Current contextual loading/error state implementation.
6. Current Inventory tests.
7. Current shared UX pattern APIs.
8. Current Inventory manifest and navigation metadata.
9. Files you plan to create.
10. Files you plan to modify.
11. Any ambiguity, API mismatch, or risk of over-abstraction.

If there is a real architecture ambiguity, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# 1. Create `src/modules/inventory/ux.ts`

Create a complete, production-shaped Inventory UX Contract.

Requirements:

- import `ModuleUxContract` as a type from `@/sdk`
- use `satisfies ModuleUxContract`
- no `TODO(UX)` placeholders
- no server imports
- no Prisma imports
- no React imports
- no tenant data
- no `orgId`
- no executable business logic

Populate all frozen fields:

```text
primaryUsers
userGoals
primaryTasks
taskFrequency
workEnvironment
requiredKnowledge
relatedBusinessObjects
moduleOwnedRecords
criticalErrorsToPrevent
permissionRoles
appNavigation
pageMap
defaultLandingPage
processFlowRoute
keyboardWorkflows
accessibilityRequirements
usabilityTestScenarios
knownMvpLimitations
futureIntegrations
```

Use truthful current-MVP content.

Suggested content direction:

### `primaryUsers`

- Warehouse staff
- Inventory supervisor
- Org Admin

### `userGoals`

- Know current stock by Product and Warehouse
- Detect low-stock items
- Post corrections safely
- Understand why stock changed
- Configure stock tracking for shared Products

### `primaryTasks`

- Review Inventory Dashboard
- Review Stock Levels
- Post Stock Adjustment
- Review Stock Movements
- Configure Product Settings
- Open shared Product/Warehouse records
- Review Inventory Process Flow

### `taskFrequency`

Use honest task descriptions rather than invented numerical claims, for example:

- Stock-level review: frequent operational task
- Stock adjustment: as physical counts or corrections require
- Product-setting review: occasional administrative task
- Movement review: investigation and reconciliation task

### `workEnvironment`

- Desktop or shared workstation
- Warehouse or office context
- Repetitive operational use
- Users may be interrupted and must recover context quickly

### `requiredKnowledge`

- Product identity and unit
- Warehouse/location receiving the adjustment
- Physical count or correction reason
- Difference between shared Product identity and Inventory settings

### `permissionRoles`

Use role concepts consistent with current implementation.

Do not invent database roles that do not exist.

Describe permission responsibilities, for example:

- Inventory read user
- Inventory adjustment operator
- Inventory supervisor
- Org Admin

If the database currently only seeds Admin and Staff, phrase these as permission profiles rather than claiming concrete seeded roles.

### `appNavigation`

- Dashboard
- Process Flow
- Product Settings
- Stock Levels
- Stock Movements
- Stock Adjustments
- Related Records: Products, Categories, Suppliers, Warehouses

### `pageMap`

Include current route templates.

### `keyboardWorkflows`

Include realistic keyboard expectations:

- navigate app switcher/sidebar by keyboard
- reach primary page action
- complete adjustment form without mouse
- move through form fields in logical order
- submit or cancel safely
- escape/close menus where supported

Do not claim shortcuts that are not implemented.

### `accessibilityRequirements`

Include:

- status not communicated by color alone
- labels and descriptions for all form controls
- visible focus
- semantic tables/headings
- low-stock indication has text
- errors explain recovery
- Process Flow readable without arrows/color alone

### `usabilityTestScenarios`

Include concrete tasks:

1. Find current quantity of Coffee Beans.
2. Explain why it is low stock.
3. Add stock safely through New Adjustment.
4. Find the corresponding movement entry.
5. Open the shared Product record.
6. Return to Inventory.
7. Explain the process using Process Flow.
8. Attempt an adjustment that would make stock negative and understand the error.

### `knownMvpLimitations`

Include current real boundaries:

- no purchasing receipt integration
- no sales/outbound integration
- no transfers
- no lots or serial numbers
- no valuation/costing
- no notifications
- no attachments
- no import/export engine
- no advanced reporting/search

### `futureIntegrations`

List only clearly deferred, plausible integrations:

- Purchasing receipts
- Sales/outbound stock movements
- Notification Service for low-stock events
- Reporting Service
- Import/Export Engine
- Background jobs where future volume justifies them

Do not imply these are implemented.

# 2. Create `src/modules/inventory/process-flow.ts`

Extract the Process Flow definition from the route into a reusable declarative file.

Requirements:

- import `ProcessFlowDefinition` as a type from `@/sdk`
- use `satisfies ProcessFlowDefinition`
- no React
- no API calls
- no server imports
- no Prisma
- no mutations
- no `orgId`
- no workflow-engine logic
- no Dynamic Forms
- no AI

The definition should include these steps:

1. Shared Records Setup
2. Inventory Product Settings
3. Stock Adjustment
4. Transactional Posting
5. Stock Balance
6. Stock Movement Ledger
7. Low-Stock Detection
8. Future Integrations

Each stable step should have:

- stable `id`
- number
- title
- concise description
- inputs where useful
- outputs where useful
- warning where error prevention is important

Use the current audited Inventory behavior:

- Product and Warehouse belong to the organization
- previous and new quantities are server-computed
- negative resulting stock is prevented
- adjustment, movement, and balance update occur together
- StockMovement is append-only
- low-stock is quantity vs reorder point
- Notification Service is not implemented

Ownership:

```text
owns:
- InventoryProductExtension
- StockBalance
- StockMovement
- StockAdjustment
```

```text
doesNotOwn:
- Product
- ProductCategory
- Supplier
- Warehouse
- Customer
- Employee
```

Current boundaries and future integrations must be explicit.

# 3. Create `src/modules/inventory/UX-CONFORMANCE.md`

This file must be honest.

Do not claim certification.

Do not claim completed representative-user validation if it has not happened.

Required structure:

```text
# Inventory UX Conformance

## Status

## Standards Targeted

## UX Contract

## Automated Structural Checks

## Automated Accessibility Checks

## Manual Accessibility Review

## Founder Walkthrough

## Representative Operational User Walkthrough

## Representative Org Admin Walkthrough

## Critical Tasks

## Findings

## Resolutions

## Deferred Issues

## Approval Result
```

Recommended truthful status after this package:

```text
Implementation Conformance Complete
Human Validation Pending
```

Standards language:

- Aligned with ISO 9241-210
- Aligned with ISO 9241-110
- Reviewed using Nielsen’s usability heuristics
- Targets WCAG 2.2 Level AA

Record completed evidence truthfully:

- shared UX patterns implemented
- Process Flow implemented
- structural/component tests passing
- Inventory security/transaction audit already passed
- Founder has performed iterative visual/product reviews

Record pending evidence truthfully:

- formal keyboard-only review, unless completed during this package
- automated axe scan
- screen-reader spot check
- representative warehouse user walkthrough
- representative non-Founder Org Admin walkthrough

Approval Result must remain:

```text
Controlled Founder Demo Approved
Public Demo Approval Pending
```

only if current evidence supports that wording.

If not, use a more conservative status.

# 4. Refactor Inventory Process Flow Route

Refactor:

```text
src/app/[orgSlug]/inventory/process-flow/page.tsx
```

It must:

- import `inventoryProcessFlow`
- render shared `ProcessFlowPage`
- preserve current breadcrumb/title/description
- make no API calls
- perform no mutations
- render no duplicate process-flow layout
- preserve server compatibility
- preserve persistent shell/navigation

Refactor:

```text
src/app/[orgSlug]/inventory/process-flow/loading.tsx
```

to use the shared Process Flow loading helper.

Remove duplicate route-local process-flow presentation if the shared component fully replaces it.

Do not change business content beyond aligning it with the reusable definition.

# 5. Refactor Inventory Dashboard

Refactor:

```text
src/app/[orgSlug]/inventory/page.tsx
```

to use shared `DashboardPage`.

Requirements:

- preserve real service-provided metrics
- preserve current Dashboard data
- preserve current primary action
- no fake metrics
- no fake charts
- no new API calls
- no business logic moved into presentation component
- preserve permissions and server data flow
- preserve contextual loading/error behavior

Use caller-supplied metric content.

Do not force existing metric cards into a generic metadata array unless that clearly improves readability.

# 6. Refactor Inventory List Pages

Refactor these pages to use shared `ListPage` where appropriate:

```text
src/app/[orgSlug]/inventory/product-settings/page.tsx
src/app/[orgSlug]/inventory/stock-levels/page.tsx
src/app/[orgSlug]/inventory/stock-movements/page.tsx
src/app/[orgSlug]/inventory/stock-adjustments/page.tsx
```

Requirements:

- preserve current data fetching
- preserve current permissions
- preserve current APIs
- preserve current table behavior
- use shared page header/state structure
- use shared DataTable
- use contextual empty/loading/error states
- no duplicate module navbar
- no hidden `orgId`
- no client-side tenant ID submission
- no fake records or fake metrics
- Product/Warehouse/Supplier remain shared records

Do not implement search, pagination, export, saved views, reporting, or Dynamic Table Views.

# 7. Refactor New Adjustment Form Page

Refactor:

```text
src/app/[orgSlug]/inventory/stock-adjustments/new/page.tsx
```

and any related client form component only as needed.

Use shared `FormPage`.

Requirements:

- preserve existing React Hook Form/Zod behavior
- preserve validation
- preserve API route
- preserve negative-stock prevention
- preserve server-computed quantities
- preserve no-`orgId` rule
- preserve user-safe errors
- preserve cancel/back behavior
- preserve accessible labels and field order
- no Dynamic Forms
- no metadata field generation
- no new dependency

If the route is a server wrapper around a client form, keep the boundary correct.

Do not import server-only code into the client component.

# 8. Refactor Contextual Loading and Error States

Use shared page-state helpers for Inventory route states.

Audit:

```text
src/app/[orgSlug]/inventory/loading.tsx
src/app/[orgSlug]/inventory/error.tsx
```

and child loading/error files.

Requirements:

- Dashboard uses dashboard-shaped loading
- Process Flow uses process-flow-shaped loading
- list pages use table/list loading
- adjustment form uses form loading
- errors do not render raw technical details
- permission denied remains distinct from general error
- module unavailable remains distinct from permission denied
- no final plain `Loading...`
- no final plain `Error`

Avoid unnecessary route-level duplication where parent states already cover the route well.

# 9. Inventory Manifest and Navigation

Inspect:

```text
src/modules/inventory/manifest.ts
src/modules/inventory/navigation.ts
src/modules/inventory/index.ts
```

Requirements:

- Process Flow remains declared
- app navigation matches the UX Contract
- no duplicate `ux` manifest field unless already approved and useful
- `ux.ts` and `process-flow.ts` may be exported from the module index if useful
- manifest remains pure metadata
- no server-only imports
- no Prisma
- no self-registration
- no wildcard permissions
- no action-array permissions

Do not change Inventory permissions or routes unless a conformance mismatch is found.

# 10. Tests

Use existing Vitest + Testing Library setup.

Add meaningful tests.

## `src/modules/inventory/__tests__/ux.test.ts`

Required coverage:

- exports `inventoryUx`
- every required ModuleUxContract field is populated
- no `TODO(UX)` placeholders
- default landing page is `/[orgSlug]/inventory`
- Process Flow route is `/[orgSlug]/inventory/process-flow`
- related Business Objects are Product, ProductCategory, Supplier, Warehouse
- module-owned records are InventoryProductExtension, StockBalance, StockMovement, StockAdjustment
- related and owned lists do not overlap
- critical errors include wrong warehouse, cross-tenant records, negative stock, and partial posting
- known limitations do not claim deferred features are implemented
- no `orgId`
- no server/Prisma imports in source

## `src/modules/inventory/__tests__/process-flow.test.ts`

Required coverage:

- exports `inventoryProcessFlow`
- all required steps exist in correct logical order
- stable unique step IDs
- Stock Adjustment step explains server validation/computation
- Transactional Posting includes adjustment, movement, and balance
- negative-stock warning exists
- StockMovement is described as append-only/ledger
- low-stock detection is quantity vs reorder point
- ownership and non-ownership lists are correct
- no `orgId`
- no API/server/Prisma imports
- future integrations are clearly deferred

## Page-pattern conformance tests

Add or update tests proving:

- Inventory Dashboard uses `DashboardPage`
- Inventory Process Flow route uses shared `ProcessFlowPage`
- Process Flow loading uses shared contextual helper
- Inventory list pages use `ListPage`
- New Adjustment page uses `FormPage`
- no duplicate module navbar is rendered
- no generic loading/error final state
- no hidden `orgId`
- no fake dashboard metrics

Prefer behavior tests over brittle source-string tests, but source-contract tests are acceptable for architectural integration where rendering the server route is impractical.

## UX Conformance document tests

If the repository has documentation contract tests, verify:

- no certification claim
- status is not falsely Public Demo Approved
- representative-user review remains pending unless actually completed
- controlled Founder demo language is accurate

Do not create a fake human-review test.

# 11. Manual Review Within This Package

Perform a limited Founder-oriented implementation review, not a claimed representative-user study.

If sandbox demo credentials are available without printing secrets:

Inspect:

- `/onedayosdemo/apps`
- `/onedayosdemo/inventory`
- `/onedayosdemo/inventory/process-flow`
- `/onedayosdemo/inventory/product-settings`
- `/onedayosdemo/inventory/stock-levels`
- `/onedayosdemo/inventory/stock-movements`
- `/onedayosdemo/inventory/stock-adjustments`
- `/onedayosdemo/inventory/stock-adjustments/new`

Verify:

- shell/sidebar remains unchanged
- Inventory navigation remains focused
- Process Flow renders correctly through shared pattern
- dashboard still shows real data
- list pages still show demo data
- New Adjustment form still works visually
- loading/error states remain contextual
- Products/Warehouses remain shared
- app switcher/profile menu remain correct

Do not install Playwright.

If authenticated browser automation is unavailable, perform available smoke checks and report the manual steps still required.

Do not print credentials.

# 12. Implementation Note

Create:

```text
docs/engineering-manual/17-module-specifications/IMPLEMENTATION-NOTE-inventory-ux-conformance-retrofit.md
```

Include:

- files created
- pages refactored
- shared patterns consumed
- UX Contract summary
- Process Flow extraction summary
- UX Conformance status
- tests added
- human-review evidence completed
- human-review evidence pending
- explicit non-goals
- no schema/migration changes
- no new Inventory features
- follow-up packages:
  - automated UX gate
  - accessibility tooling
  - representative-user walkthrough
  - Organization/Records retrofit
  - theme/appearance package

# 13. Architecture and Generator Checks

Run existing:

- `check:architecture`
- `check:generated`

Do not implement `check:ux` yet.

Only modify architecture checks if this retrofit reveals a clear existing gap and the new rule is stable and non-brittle.

Do not modify generator templates in this package unless a serious regression from Package 3 is discovered. Report rather than silently expanding scope.

# Forbidden Changes

Do not modify:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/kernel/db/**`
- auth flows
- Organization pages
- Records pages
- module generator files
- package dependencies
- `.env.local`
- demo provisioning unless a tiny read-only verification adjustment is unavoidable
- theme functionality
- accessibility dependencies
- public deployment automation

Do not run migrations.

Do not reset demo data unless explicitly necessary and approved by `ONEDAYOS_SANDBOX_DB_APPROVED=true`.

Do not add `check:ux`.

Do not add `test:a11y`.

# Verification Commands

Run:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm audit --audit-level=moderate
git diff --check
git status --short
```

Do not run:

```bash
npm audit fix --force
```

If the sandbox server is available, use port 1320 for any smoke check.

No public website demo claim should be made in this package.

# Final Report Required

Report:

1. Inventory UX Conformance Retrofit summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Inventory UX Contract summary.
6. Inventory Process Flow definition summary.
7. UX-CONFORMANCE status and evidence.
8. Dashboard retrofit summary.
9. List-page retrofit summary.
10. Form-page retrofit summary.
11. Loading/error-state retrofit summary.
12. Manifest/navigation decisions.
13. Tests added or strengthened.
14. Updated test count.
15. Manual/sandbox review result.
16. Exact verification commands and results.
17. npm audit result.
18. Git diff/status observations.
19. Any deviations from frozen UX governance.
20. Any unresolved UX/API ergonomics risks.
21. Confirmation that no Prisma, migrations, dependencies, generator, Organization, Records, themes, accessibility tooling, or new-module changes were made.
22. Whether Inventory UX Conformance Retrofit Package 4 is complete.
23. Whether Automated UX and Accessibility Gates Package remains blocked pending Founder approval.
24. Whether Inventory remains appropriate for controlled Founder demo use.
25. Whether public website demo approval remains pending.

Stop after this package.

Do not proceed to `check:ux`, accessibility tooling, themes, Organization/Records retrofit, public demo preparation, or new modules without Founder approval.
