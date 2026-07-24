# OneDayOS — Inventory Demo V2 Package V2-3
# URL-Addressable Modals with Full-Page Fallbacks

V2-2 Data Table V2 has passed automated gates, scale-correctness hardening, authenticated review, clean dependency audits, and controlled-demo checks.

The Founder explicitly accepts V2-2 and authorizes **V2-3 only**.

V2-4 through V2-8 remain blocked.

## Completed Preconditions

- Every active production Data Table V2 caller uses server mode.
- Exact pagination and totals work beyond 100 rows.
- No silent Stock Status candidate cap remains.
- Stock Status filtering is intentionally deferred to V2-6 rather than returning incorrect results.
- Canonical full-page view/edit routes exist for current tables.
- Row interaction is permission-aware.
- Stock Levels provides a full-page Adjust Stock action with validated Product/Warehouse prefill.
- Dependency audits report zero vulnerabilities.
- `check:all` and `demo:check` pass.
- Controlled demo registration remains disabled.
- Website asset production remains paused.

## Founder-Approved V2-3 Decision

Use URL-addressable modal interactions with direct full-page fallbacks.

Use:

- Next.js App Router Parallel Routes
- Next.js Intercepting Routes
- selective Radix Dialog as the accessible dialog primitive

This is not approval for a broad Radix, Base UI, shadcn, or component-library migration.

### Required behavior

- soft navigation from a list/table opens a modal over the current page
- the URL changes to the canonical route
- browser Back closes the modal
- browser Forward can reopen it
- direct navigation to the same URL renders a full page
- refresh on the canonical URL renders the full-page fallback
- authorization and validation remain server-authoritative
- desktop uses a dialog
- small screens use a full-screen or sheet-like presentation
- focus is trapped while open
- focus returns to the trigger on close
- Escape closes when safe
- title and description are accessible
- no hidden/client-supplied `orgId`
- modal forms preserve user-safe validation errors

## Primary Authority

Read and follow first:

- `docs/engineering-manual/03-design-system/17-modal-interaction-standard.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0016-data-table-v2-and-modal-interactions.md`
- `docs/engineering-manual/14-testing-quality/10-data-table-modal-export-testing.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/00-meta/V2-2-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-2-data-table-v2.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`

Also obey:

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/03-design-system/15-compact-operational-page-header.md`
- `docs/engineering-manual/03-design-system/16-data-table-v2.md`
- `docs/engineering-manual/08-module-system/10-contextual-shared-records.md`
- `docs/engineering-manual/04-kernel/04-authorization-enforcement.md`
- `docs/engineering-manual/04-kernel/08-kernel-api-contracts.md`
- `docs/engineering-manual/05-sdk/02-sdk-db-access.md`
- `docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md`
- `docs/engineering-manual/06-data/01-tenancy-data-isolation.md`
- `docs/engineering-manual/06-data/05-data-validation-zod.md`
- `docs/engineering-manual/07-business-objects/00-business-object-philosophy.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/04-api-security.md`
- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`

If these documents conflict, stop and report the conflict instead of inventing a resolution.

# Absolute Scope

## Allowed

- install one exact compatible stable `@radix-ui/react-dialog` release
- create a small OneDayOS route-modal/dialog wrapper
- add the necessary parallel-route slots and intercepting routes
- preserve and reuse canonical full-page routes
- open create/view/edit actions in modal form during soft navigation
- keep direct/full-page fallback behavior
- implement responsive dialog/full-screen presentation
- implement permission-aware view versus edit modal content
- integrate Product Inventory Tracking Settings contextually
- add modal focus, close, loading, error, and validation behavior
- add route, UI, permission, accessibility, and regression tests
- update `check:ux`
- update conformance/implementation documentation
- make tiny V2-3 compatibility fixes only

## Forbidden

Do not:

- install broad Radix packages
- install shadcn or run shadcn CLI
- migrate existing primitives wholesale
- install Recharts
- add charts
- redesign Process Flow
- implement CSV/XLSX export
- install ExcelJS
- change Prisma schema
- create migrations
- implement InventoryTransaction
- implement Receipts, Issues, Transfers
- implement caching
- implement accent presets
- resume website asset production
- change stock-posting business logic
- change tenant/permission architecture
- add new modules
- add Platform Services, Dynamic Systems, runtime AI, background jobs, or FastAPI
- run `npm audit fix` or `npm audit fix --force`

# Repository Safety

The worktree may contain prior uncommitted changes.

Before coding:

1. Run `git status --short`.
2. Record current changed/untracked files.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Do not restore historical implementation.
5. Keep edits strictly within V2-3.
6. Do not create a commit unless separately instructed.
7. Stop any stale server before the final build/start.
8. Keep the final server on port `1320`.

# Supported Runtime

Use:

```text
Node >=24 <25
```

Run:

```bash
node --version
npm --version
```

If Node 24 is not active, switch before dependency or build work.

# Before Coding

Inspect and report briefly:

1. Current App Router layout tree under `src/app/[orgSlug]`.
2. Current app-shell placement and route groups.
3. Current canonical full-page create/view/edit routes from V2-2.
4. Current Inventory-context Shared Records routes.
5. Current Data Table V2 row/action href generation.
6. Current form components and server/client boundaries.
7. Current Product Inventory Tracking Settings route/service/API/permissions.
8. Current loading/error/permission-denied states.
9. Current confirmation/unsaved-changes primitives, if any.
10. Current portal/dialog/sheet primitives, if any.
11. Current tests for browser navigation and focus.
12. Current package versions and clean audit state.
13. Files you plan to create.
14. Files you plan to modify.
15. Any route interception ambiguity or risk of duplicated business logic.

If there is a real architecture ambiguity, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# Phase 1 — Dependency Audit and Install

## Audit

Verify the current stable `@radix-ui/react-dialog` version is compatible with:

- React 19
- Next.js 16.2.11
- TypeScript 6
- Node 24
- current npm peer tree

Do not install a release candidate or beta.

## Install

Add one exact runtime dependency:

```text
@radix-ui/react-dialog
```

Do not add:

- the Radix meta package
- Radix Themes
- Radix Popover unless already installed
- Radix Alert Dialog unless separately justified
- shadcn
- Base UI
- another modal library

After installation run:

```bash
npm ci
npm ls @radix-ui/react-dialog
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

All audits must remain clean.

If installation creates an advisory or peer conflict, stop and report rather than selecting another library silently.

# Phase 2 — OneDayOS Route Modal Primitive

Create a small reusable primitive consistent with repository conventions.

Preferred direction:

```text
src/components/onedayos/modal/
  route-modal.tsx
  modal-content.tsx
  modal-header.tsx
  modal-footer.tsx
  modal-close.tsx
  types.ts
  index.ts
  __tests__/
```

Use fewer files if the repository style favors a smaller implementation.

## Responsibilities

The modal layer may own:

- Radix Dialog composition
- overlay
- portal
- focus trap
- focus return
- Escape behavior
- close button
- responsive size/layout
- accessible title and description
- internal content scrolling
- sticky action footer where useful
- safe close navigation
- route-slot fallback shell
- loading/error presentation

It must not own:

- authentication
- permissions
- PlatformContext
- data fetching
- business rules
- form validation
- Prisma
- API calls
- tenant identity
- entity field metadata
- export
- optimistic business mutations

## Recommended API

Use a small typed API, for example:

```ts
type RouteModalProps = {
  title: string
  description?: string
  closeHref: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
  preventOutsideClose?: boolean
}
```

or an equivalent composition-first API.

Avoid excessive booleans and a universal metadata-driven dialog.

## Close behavior

Preferred:

- closing a soft-navigation intercepted modal uses `router.back()`
- provide a safe fallback `closeHref`
- do not rely on browser history alone
- no redirect loop
- direct full-page routes do not render the modal wrapper

## Responsive behavior

Desktop:

- centered modal
- maximum width according to content
- maximum height with internal scrolling

Small screens:

- full-width/full-height or sheet-like
- readable form controls
- safe close affordance
- no clipped footer
- no inaccessible off-screen content

Do not add a separate sheet dependency.

## OneDayOS Compact styling

- semantic tokens only
- border-first
- floating shadow only
- restrained radius
- neutral accent
- orange only for primary actions
- Light/Dark/System compatible
- no raw brand hex in TSX
- no glassmorphism
- no giant rounded SaaS dialog

# Phase 3 — Next.js Parallel Route Architecture

Use the current Next.js 16 App Router conventions.

## Required outcomes

- one or more `@modal` parallel slots at the correct shell/layout level
- `default.tsx` files return `null` where required
- intercepted routes map to existing canonical routes
- canonical full-page routes remain the source of direct navigation/refresh fallback
- no business logic is duplicated in intercept routes
- no modal slot causes unmatched-route 404s
- closing returns to the correct underlying page
- app shell/current-app context remains correct

## Contexts to preserve

### Inventory app

Underlying pages:

- Inventory Stock Levels
- Inventory Stock Adjustments
- Inventory Related Records

### Shared Records app

Underlying pages:

- Products
- Product Categories
- Customers
- Suppliers
- Warehouses

### Organization app

Only include Organization records if the frozen modal standard and current canonical routes clearly require it.

Do not expand Organization workflows merely for symmetry.

## Route reuse

Extract shared server/presenter components where needed.

Good:

```text
Canonical Product detail presenter
  used by:
  - full-page route
  - Shared Records intercepted modal
  - Inventory-context intercepted modal
```

Bad:

```text
Copy Product data fetching and form code into each modal route.
```

Intercept routes should import the same presenter/form shell used by the full page.

# Phase 4 — Initial Modal Targets

Implement the Founder-approved initial targets.

## Inventory

### New Stock Adjustment

Canonical route remains:

```text
/[orgSlug]/inventory/stock-adjustments/new
```

Soft navigation from:

- Stock Adjustments primary action
- Stock Levels per-row Adjust Stock action

opens a modal.

Requirements:

- validated Product/Warehouse prefill remains
- no quantity/balance/orgId prefill
- permission remains `inventory.stock_adjustment.create`
- server validation remains authoritative
- successful submit:
  - closes modal
  - refreshes/revalidates underlying table view
  - shows the new state without stale rows
- direct navigation/refresh:
  - renders full-page fallback
  - successful submit follows a sensible full-page redirect

Do not change stock transaction logic.

### Stock Level View

Canonical detail route opens as a read modal.

Include:

- shared Product
- shared Warehouse
- current quantity
- reorder point
- status
- contextual Adjust Stock action when permitted
- contextual Inventory Tracking Settings action when permitted

Do not edit StockBalance directly.

### Stock Movement View

Read-only modal.

No edit/delete.

Reinforce append-only ledger wording.

### Stock Adjustment View

Read-only modal for posted adjustments.

No edit of posted adjustment.

## Shared Records

Implement view/edit/create modal behavior for:

- Products
- Product Categories
- Customers
- Suppliers
- Warehouses

### Permission behavior

- update permission:
  - row opens Edit modal
  - explicit View action may still exist if useful
- read-only permission:
  - row opens View modal
  - edit controls absent
- create permission:
  - New action opens Create modal
- no read:
  - record/data unavailable
- no update:
  - direct edit URL/API safely denied

## Inventory-context Shared Records

The same canonical entity surfaces must work in Inventory context while preserving the Inventory sidebar.

Do not imply Inventory owns the entity.

## Product Inventory Tracking Settings

Complete the V2-1 migration direction.

Remove dependence on a top-level Product Settings page as the normal interaction.

Preferred V2-3 behavior:

- Product View/Edit modal includes a clearly separated Inventory section
- Inventory section shows:
  - stock tracking enabled
  - reorder point
- read-only users see values only
- `inventory.product_setting.update` users can edit Inventory settings
- `objects.product.update` and `inventory.product_setting.update` remain separate permissions
- Product identity fields and Inventory extension fields must not be submitted to the wrong API
- each save action uses its own schema/service/API contract

Alternative, if the frozen spec requires a separate modal action:

- an `Inventory Tracking Settings` modal reachable from Product/Stock Level context

Choose the safest approach and document it.

Do not merge Product core data and Inventory extension data into one unsafe combined mutation.

## Compatibility route

The existing full-page Inventory Tracking Settings route must:

- remain a direct fallback or
- redirect safely to the canonical contextual surface

No redirect loop.

No data/service/API deletion.

Document deprecation timing.

# Phase 5 — Modal Form Behavior

## Validation

- preserve React Hook Form/Zod behavior
- preserve server validation
- preserve field values after validation failure
- show field and form-level errors
- no raw provider errors
- no hidden `orgId`
- no client-computed stock values

## Pending state

- prevent duplicate submit
- keep accessible button state
- show clear pending copy
- do not close before server success

## Success behavior

Intercepted modal:

- close only after successful mutation
- refresh/reload underlying data safely
- preserve current search/filter/sort/page URL state
- no stale table row

Full-page fallback:

- redirect to a sensible detail/list route
- preserve user-safe success behavior

Do not add a toast dependency.

Use existing feedback patterns.

## Failure behavior

- modal remains open
- user input remains
- error explains recovery
- no partial business write
- no unhandled exception

# Phase 6 — Unsaved Changes and Close Safety

Inspect current forms and frozen modal standard.

No dirty form may be silently discarded by:

- close button
- Escape
- overlay click
- browser Back
- app switcher/navigation

Preferred strategy:

1. Reuse an existing confirmation primitive if available and accessible.
2. If no suitable primitive exists, implement a small in-scope discard confirmation using the approved Dialog foundation without adding another dependency.
3. Do not use an inaccessible custom overlay.
4. Do not use nested modal behavior that breaks focus.

At minimum:

- clean form closes immediately
- dirty form requires explicit discard confirmation
- continue editing returns focus correctly
- discard closes safely
- successful submission clears dirty state
- direct full-page forms preserve any existing browser-navigation protection

If the current router cannot safely block browser Back for dirty forms without introducing unstable behavior:

- document the limitation
- prevent overlay/Escape/button loss
- keep critical forms full page until a safe route guard exists
- stop for Founder review rather than silently discarding changes

Do not fake complete unsaved-navigation protection.

# Phase 7 — Loading, Error, Denied, and Not Found States

Modal routes need distinct states:

- modal loading skeleton
- safe modal error
- permission denied
- record not found
- module unavailable where applicable

Requirements:

- no raw stack/provider error
- modal error does not destroy the underlying page
- direct full-page fallback retains full-page states
- loading skeleton matches modal content
- close remains available where safe

# Phase 8 — Data Table V2 Integration

Update Data Table V2 adapters/row actions so:

- canonical href remains the same
- Link/soft navigation triggers intercepted modal
- direct URL still works
- nested actions do not trigger row activation
- action menu can choose View/Edit
- row behavior remains permission-aware
- URL query state on the underlying list remains intact after close
- row selection state remains predictable

Do not change search/filter/sort/pagination semantics.

Do not add export.

# Phase 9 — Tests

Add meaningful tests.

## Route architecture tests

- parallel modal slot exists
- required `default.tsx` returns null
- intercepted routes exist for approved targets
- canonical full-page routes remain
- intercepted routes reuse canonical presenters/forms
- no duplicate business service/API logic
- direct route does not require modal slot
- no unmatched-route 404 regression

## Navigation behavior tests

- soft navigation opens dialog
- URL becomes canonical target URL
- close returns to underlying list
- browser Back closes modal
- fallback close href works
- direct navigation renders full page
- refresh fallback remains full page
- underlying query state is preserved

Use source-contract/router tests where a full browser is unavailable.

Do not add Playwright/Cypress.

## Dialog accessibility tests

Using existing axe helper and Testing Library:

- dialog has accessible title
- description relationship is correct
- close button has accessible name
- focus moves into dialog
- focus is trapped
- Escape behavior works
- focus returns to trigger
- modal is keyboard usable
- form controls remain labeled
- error messages remain associated
- mobile/full-screen markup remains semantic
- no duplicate `h1`/dialog title confusion

## Permission tests

- Admin Product row opens Edit modal
- Warehouse Product row opens View modal
- Warehouse direct Product edit remains denied
- Organization remains denied to Warehouse
- Inventory Tracking Settings update requires its own permission
- Product update permission does not imply Inventory settings update
- Inventory settings update permission does not imply Product identity update
- New Adjustment modal requires create permission
- no read permission returns no data

## Form tests

- Product create/edit success
- Category create/edit success
- Customer create/edit success
- Supplier create/edit success
- Warehouse create/edit success
- Adjustment prefill
- invalid prefill rejected
- validation error keeps modal open
- submit pending prevents duplicate mutation
- success closes/refreshes
- failure stays open
- no `orgId`

## Unsaved-change tests

- clean close
- dirty close requires confirmation
- continue editing
- discard
- successful submit clears dirty state
- Escape/overlay behavior respects dirty state

## Regression tests

- Data Table V2 behavior unchanged
- compact headers unchanged
- Shared Records app unchanged
- Inventory contextual records remain contextual
- Product Settings absent from top-level nav
- Light/Dark/System unchanged
- no charts/export/V2 transactions/caching/accent behavior added

# Phase 10 — `check:ux`

Add stable checks:

- approved modal primitive exists
- only selective Radix Dialog dependency is present
- canonical full-page fallback exists for each intercepted target
- parallel slot has `default.tsx`
- no modal-only business route
- no duplicate service/API in intercept routes
- title/description contract exists
- no hidden `orgId`
- dirty form close guard exists where required
- no V2-4+ Recharts
- no V2-5 ExcelJS/export
- no Prisma/migration changes
- website assets remain paused

Avoid brittle folder-name assumptions beyond the frozen route contract.

# Phase 11 — Documentation

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-3-url-addressable-modals.md
```

Include:

- Radix version and dependency audit
- parallel/intercepting route architecture
- route-slot placement
- canonical fallback strategy
- shared presenter/form reuse
- responsive behavior
- close/back behavior
- unsaved-change policy
- Product Inventory Tracking Settings migration
- permission boundaries
- tests
- visual review
- explicit non-goals
- V2-4 remains blocked
- website assets remain paused

Create:

```text
docs/engineering-manual/00-meta/
  V2-3-ACCEPTANCE-REPORT.md
```

Status before Founder review:

```text
Code and Automated Gates Complete
Founder Visual Acceptance Pending
```

Required sections:

- modal architecture
- targets implemented
- direct fallback verification
- browser navigation behavior
- permission behavior
- unsaved changes
- accessibility
- manual visual review
- findings
- blockers/must-fix/polish
- V2-4 readiness

Update truthfully:

```text
src/modules/inventory/UX-CONFORMANCE.md
src/business-objects/UX-CONFORMANCE.md
```

Update Organization only if Organization modal behavior was actually included.

Do not claim public-demo approval.

# Phase 12 — Manual Visual Review

Use the controlled sandbox under Node 24 and `next start` on port 1320.

Do not install browser automation.

Review both personas in Light and Dark.

## Org Admin

Verify:

- Stock Levels row click opens Stock Level view modal
- Adjust Stock action opens prefilled Adjustment modal
- Stock Adjustments New action opens modal
- Product row opens Edit modal
- Category row opens Edit modal
- Customer row opens Edit modal
- Supplier row opens Edit modal
- Warehouse row opens Edit modal
- direct URL/refresh renders full page
- Back closes modal
- Product Inventory section permissions/save boundaries are clear
- validation and success behavior are clear

## Warehouse Operator

Verify:

- Product/Supplier/Warehouse rows open View modal
- edit controls absent
- Customer absent without permission
- Adjust Stock modal available
- Product Inventory settings are read-only
- Organization remains denied
- direct edit URLs remain denied

## Mobile-width review

At a narrow viewport verify:

- modal becomes full-screen/sheet-like
- form actions remain reachable
- close remains reachable
- content scrolls internally
- keyboard/focus behavior remains sound

## Appearance

Verify Light, Dark, and System.

## Screenshots

Save under `/tmp`, including:

```text
/tmp/v2-3-stock-level-view-modal-light.png
/tmp/v2-3-adjust-stock-modal-light.png
/tmp/v2-3-adjust-stock-modal-dark.png
/tmp/v2-3-product-edit-modal-admin.png
/tmp/v2-3-product-view-modal-warehouse.png
/tmp/v2-3-product-inventory-settings.png
/tmp/v2-3-customer-edit-modal.png
/tmp/v2-3-warehouse-edit-modal.png
/tmp/v2-3-direct-full-page-fallback.png
/tmp/v2-3-mobile-full-screen-modal.png
/tmp/v2-3-unsaved-discard-confirmation.png
```

Do not publish them.

# Controlled Demo Safety

Preserve:

- demo mode
- registration disabled
- noindex
- role profiles
- `demo:reset`
- `demo:check`
- controlled guided demo only
- website asset pause

Run `demo:check`.

Run `demo:reset` only if manual mutation testing changes canonical data and all safety gates pass.

# Dependency Gates

After installing Radix Dialog:

```bash
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

All must pass.

# Verification Commands

Run under Node 24:

```bash
node --version
npm --version
npm ci

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

npm ls @radix-ui/react-dialog
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate

git diff --check
git status --short
```

Do not run:

```bash
npm audit fix
npm audit fix --force
```

Stop any stale server and start the final production build on port 1320.

# Final Report Required

Report:

1. V2-3 summary.
2. Node/npm versions.
3. Files inspected.
4. Files created.
5. Files modified.
6. Radix Dialog exact version and compatibility audit.
7. Route-modal public API.
8. Parallel-slot architecture.
9. Intercepted route strategy.
10. Canonical full-page fallback strategy.
11. Responsive modal behavior.
12. Close/Back/Forward behavior.
13. Unsaved-change behavior and limitations.
14. Inventory modal targets implemented.
15. Shared Records modal targets implemented.
16. Product Inventory Tracking Settings migration.
17. Permission behavior by persona.
18. Form success/failure behavior.
19. Data Table V2 integration.
20. Tests added and updated full count.
21. Accessibility test result.
22. `check:ux` changes.
23. Manual visual review and screenshot paths.
24. Light/Dark/System result.
25. Mobile-width result.
26. Controlled-demo result.
27. Port 1320 server status/PID.
28. Exact verification commands and results.
29. `check:all` result.
30. `demo:check` result.
31. Dependency audit result.
32. Git diff/status observations.
33. Any deviations from frozen V2-3 scope.
34. Remaining modal, navigation, permission, or accessibility risks.
35. Confirmation that no V2-4+ charts, Recharts, exports, ExcelJS, Prisma, migrations, Inventory V2 transactions, caching, accent presets, website assets, new modules, or Platform Services were added.
36. Whether V2-3 is complete.
37. Whether V2-4 remains blocked pending explicit Founder approval.
38. Whether website asset production remains paused.

Stop after V2-3.

Do not proceed to V2-4 or any later V2 package without Founder approval.
