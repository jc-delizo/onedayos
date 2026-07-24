# OneDayOS — Inventory Demo V2 Package V2-1
# Compact Operational Headers + Shared Records Built-In App + Context-Preserving Records

Inventory Demo V2 governance is frozen.

ADR-0014 through ADR-0020 are Accepted.

The detailed V2 specifications are Frozen.

The Founder explicitly approves **V2-1 only**.

V2-2 through V2-8 remain blocked.

## Primary Handoff

Read and follow first:

- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-1-COMPACT-HEADER-SHARED-RECORDS-IA.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-CHANGE-IMPACT-REPORT.md`

Use the frozen specifications:

- `docs/engineering-manual/03-design-system/15-compact-operational-page-header.md`
- `docs/engineering-manual/08-module-system/10-contextual-shared-records.md`

Use the accepted ADRs:

- `docs/engineering-manual/00-meta/adrs/ADR-0014-compact-operational-page-header.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0015-shared-records-built-in-app-context.md`

Also obey:

- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/14-runtime-appearance.md`
- `docs/engineering-manual/04-kernel/03-users-roles-permissions.md`
- `docs/engineering-manual/04-kernel/04-authorization-enforcement.md`
- `docs/engineering-manual/04-kernel/07-routing-app-shell.md`
- `docs/engineering-manual/07-business-objects/00-business-object-philosophy.md`
- `docs/engineering-manual/07-business-objects/02-product.md`
- `docs/engineering-manual/07-business-objects/03-customer.md`
- `docs/engineering-manual/07-business-objects/04-supplier.md`
- `docs/engineering-manual/07-business-objects/05-warehouse.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`

If the handoff and frozen documents conflict, stop and report the conflict instead of inventing a resolution.

# Founder-Approved V2-1 Decisions

## 1. Compact Operational Header

Routine operational pages use:

- compact breadcrumb
- semantic page title
- primary action on the same horizontal row
- no large description block when the page purpose is obvious
- optional contextual help for explanation

Page titles remain required.

Do not rely on the sidebar or breadcrumb alone.

Explanatory headers remain for:

- Process Flow
- App Launcher
- onboarding
- complex concepts

## 2. Shared Records Is a Built-In App

Shared Records becomes a built-in app in the Apps switcher.

It is:

- not a business module
- not controlled by `OrgModule`
- permission-aware
- available when the user has at least one relevant shared-record read permission

Shared Records contains:

- Products
- Product Categories
- Customers
- Suppliers
- Warehouses

People remains under Organization.

## 3. Context-Preserving Related Records

When a shared record is opened from Inventory:

- Inventory remains the current app
- Inventory sidebar remains visible
- the shared record surface is reused
- ownership remains explicitly shared
- no duplicate Product, Category, Customer, Supplier, or Warehouse logic is created
- app switcher remains available
- browser Back/Forward remains sensible

Direct access to the Shared Records app remains available.

## 4. Product Settings Navigation Migration

Remove Product Settings as a top-level Inventory sidebar item.

Do not delete:

- InventoryProductExtension data
- Product Settings service methods
- Product Settings API behavior
- validation
- permissions
- tests

Preserve access contextually.

V2-1 may keep a temporary full-page compatibility route.

V2-3 will later introduce URL-addressable modals.

# Absolute Scope

## Allowed

- compact/explanatory page-header mode
- apply compact headers to current routine pages
- preserve explanatory Process Flow header
- Shared Records built-in app
- permission-aware Shared Records app visibility
- Shared Records current-app detection
- Shared Records sidebar
- context-preserving Inventory related-record routes/surfaces
- reusable shared-record page presenters/components
- Product Settings removal from main Inventory navigation
- contextual Product Settings access
- compatibility redirect/deprecation handling
- navigation, UX, role, a11y, and regression tests
- stable `check:ux` additions
- implementation and conformance documentation updates

## Forbidden

Do not:

- install `@tanstack/react-table`
- implement Data Table V2
- add search/filter/sort/pagination/selection
- install Radix Dialog
- implement modal or intercepting routes
- install Recharts
- add charts
- change Process Flow into arrow diagram V2
- implement CSV/XLSX export
- install ExcelJS
- change Prisma schema
- create migrations
- implement InventoryTransaction
- implement Receipts, Issues, Transfers
- implement caching
- implement accent presets
- resume website asset production
- change Inventory stock logic
- change API contracts except a narrow compatibility redirect if explicitly needed
- add new modules
- add Platform Services, Dynamic Systems, runtime AI, or FastAPI
- run `npm audit fix --force`

# Repository Safety

The worktree may contain many existing changes.

Before coding:

1. Run `git status --short`.
2. Record current changed and untracked files.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Do not restore historical implementation files.
5. Limit changes strictly to V2-1.
6. Do not create a commit unless separately instructed.

# Local Port Rule

The app remains on port `1320`.

Do not switch to `3000`.

Verify:

- `npm run dev` uses port 1320
- `npm run start` uses port 1320
- `.env.example` uses `NEXT_PUBLIC_APP_URL=http://localhost:1320`

# Before Coding

Inspect and report briefly:

1. Current shared `PageHeader`, `AppPage`, `DashboardPage`, `ListPage`, `FormPage`, and `SettingsPage` APIs.
2. Current Inventory page-header usage.
3. Current Organization and Shared Records page-header usage.
4. Current App Launcher/app-switcher resolver.
5. Current current-app detection.
6. Current Inventory navigation model.
7. Current Shared Records navigation model.
8. Current direct Records routes.
9. Current Inventory Related Records links.
10. Current Product Settings route, service, API, permissions, and navigation.
11. Current role profiles for Org Admin and Warehouse Operator.
12. Current `check:ux` rules.
13. Files you plan to create.
14. Files you plan to modify.
15. Any route or reuse ambiguity.

If there is a real architecture ambiguity, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# Part A — Compact Operational Header

## Shared API

Refactor the shared page-header/page-frame API to support explicit modes.

Preferred API direction:

```ts
type PageHeaderMode = 'compact' | 'explanatory'
```

or an equivalent small typed API.

Do not add many mutually exclusive booleans.

## Compact mode

Required:

- breadcrumb remains visible but visually compact
- one semantic `<h1>`
- title and primary action share the main row where space permits
- routine description is omitted when obvious
- optional concise help affordance may contain the explanation
- mobile layout stacks safely
- no duplicate title from shell
- no duplicate module navbar

## Explanatory mode

Required:

- breadcrumb
- title
- short description
- optional primary action
- used where conceptual explanation is important

## Apply compact mode

Apply to routine operational pages, including as appropriate:

### Inventory

- Dashboard
- Stock Levels
- Stock Movements / Movement Ledger
- Stock Adjustments
- temporary Product Settings compatibility surface
- New Stock Adjustment full-page fallback

### Shared Records

- Products list/create/edit
- Product Categories list/create/edit
- Customers list/create/edit
- Suppliers list/create/edit
- Warehouses list/create/edit
- Shared Records landing if its purpose remains clear with a compact presentation

### Organization

Apply only where the frozen spec and current UX support it:

- People
- Branches & Departments
- Settings

Do not force compact mode onto pages that genuinely need explanation.

## Preserve explanatory mode

At minimum:

- Inventory Process Flow
- App Launcher

## Header accessibility

Verify:

- one clear `<h1>`
- breadcrumb navigation has accessible label
- primary action remains keyboard accessible
- help trigger has an accessible name
- no page loses its semantic title
- no heading-level regression

# Part B — Shared Records Built-In App

## App identity

Add a built-in app identity:

```text
id: shared-records
label: Shared Records
```

Use an appropriate existing Lucide icon.

Do not represent it as an `OrgModule`.

Do not add a database row.

## App visibility

Show Shared Records in the Apps switcher only when the current user has at least one permitted shared-record read capability.

Relevant permissions:

```text
objects.product.read
objects.product_category.read
objects.customer.read
objects.supplier.read
objects.warehouse.read
```

Use the actual existing permission model.

Do not create a second authorization system.

## Persona expectations

### Org Admin

Expected Apps:

- Inventory
- Shared Records
- Organization

### Warehouse Operator

Expected Apps:

- Inventory
- Shared Records, because the current role has read permissions for Product, Category, Supplier, and Warehouse
- Organization absent

If a future user has no shared-record read permission, Shared Records must be absent.

## Current-app detection

Direct routes under:

```text
/[orgSlug]/records/**
```

must resolve current app as Shared Records.

Do not show Records as an Inventory module.

Do not show Shared Records as Organization.

## Shared Records sidebar

When current app is Shared Records, show permission-aware entries:

- Products
- Categories
- Customers
- Suppliers
- Warehouses

Only show record types the user may read.

Do not show People.

Do not show Organization admin navigation.

Do not show Inventory transactions.

## Shared Records landing

Use a concise page explaining:

```text
Shared Records are organization-wide business identities reused by enabled apps.
```

Do not present fake statistics.

Do not imply every future app is implemented.

# Part C — Context-Preserving Inventory Related Records

## Route strategy

Follow the frozen contextual-shared-records specification and V2-1 handoff.

Use a route strategy that:

- keeps Inventory as current app
- keeps Inventory sidebar visible
- reuses shared record content/presenters
- provides direct full-page URLs
- does not require V2-3 modals
- supports Back/Forward
- avoids duplicating services and business logic

Preferred conceptual shape, only if consistent with the frozen spec:

```text
/[orgSlug]/inventory/related/products
/[orgSlug]/inventory/related/product-categories
/[orgSlug]/inventory/related/customers
/[orgSlug]/inventory/related/suppliers
/[orgSlug]/inventory/related/warehouses
```

Do not blindly use this exact path if the frozen handoff specifies another route.

## Reuse model

Extract or reuse shared presentational page components/configuration.

Good:

```text
Shared Product list presenter
  used by:
  - /records/products
  - /inventory/related/products
```

Bad:

```text
Copy the Product page into Inventory.
```

Do not duplicate:

- API calls
- services
- validation
- permissions
- table configuration
- forms
- business rules

## Inventory sidebar

Related Records links point to Inventory-context routes.

Inventory sidebar remains:

```text
Dashboard
Process Flow
Stock Levels
Stock Movements
Stock Adjustments

Related Records
Products
Categories
Suppliers
Customers
Warehouses
```

Add Customers because the frozen V2 direction includes Customers in contextual/shared Records.

Do not add Product Settings as a top-level link.

## Ownership wording

Contextual Product page:

```text
Shared Product identity used by Inventory and other apps.
```

Contextual Warehouse page:

```text
Shared Warehouse identity used by Inventory and future stock workflows.
```

Contextual Supplier page:

```text
Shared Supplier identity available to Inventory and future procurement workflows.
```

Contextual Customer page:

```text
Shared Customer identity available for future issue references and customer-facing workflows.
```

Do not imply:

- Inventory owns these records
- Purchasing is implemented
- CRM is implemented
- V2 Receipts/Issues are already implemented

## Context navigation

Provide a clear but compact context marker:

```text
Inventory / Related Records / Products
```

Do not add a large redundant navbar.

App switcher remains available.

# Part D — Product Settings Navigation Migration

## Remove top-level nav

Remove:

```text
Product Settings
```

from Inventory sidebar and module navigation metadata.

Update Inventory UX contract/navigation documentation accordingly.

## Preserve access

Until V2-3:

- keep the current Product Settings functionality reachable through a contextual action
- preferred contextual entry points:
  - Stock Levels page secondary/contextual action: `Manage tracking settings`
  - contextual Products page action/link: `Inventory settings`
- use existing full-page Product Settings route if necessary

Do not introduce a modal yet.

## Compatibility route

Preserve:

```text
/[orgSlug]/inventory/product-settings
```

through one of these approved temporary behaviors:

1. Keep the page working but remove it from navigation and mark it as compatibility/contextual.
2. Redirect to a new contextual management route that preserves Inventory context.
3. Redirect to Stock Levels with a clear contextual settings entry.

Choose the least risky option consistent with the frozen handoff.

Do not create a redirect loop.

Do not make Product Settings inaccessible.

## Copy

Rename UI where needed to clarify:

```text
Inventory Tracking Settings
```

or:

```text
Stock Tracking Settings
```

Avoid implying Product identity is managed there.

## No data/API deletion

Do not remove:

- `InventoryProductExtension`
- schemas
- services
- APIs
- permissions
- tests

# Part E — Loading/Error/State Integration

New Shared Records and contextual routes must use the existing shared states:

- list/table loading
- form loading
- true empty
- filtered empty where already applicable
- safe error
- permission denied

Do not add generic:

- `Loading...`
- `Error`
- `No data`

Do not implement Data Table V2 features yet.

# Part F — `check:ux` and Conformance

## Stable `check:ux` additions

Add stable checks for:

- Shared Records built-in app exists
- Shared Records is not an `OrgModule`
- Shared Records visibility is permission-aware
- direct `/records/**` resolves Shared Records context
- Inventory Related Records use Inventory-context routes
- Product Settings is absent from top-level Inventory nav
- Product Settings functionality/compatibility route still exists
- page header supports compact and explanatory modes
- Process Flow remains explanatory
- no duplicate page navbar
- no website asset production resumed

Avoid brittle class checks.

## Conformance docs

Update truthfully:

```text
src/modules/inventory/UX-CONFORMANCE.md
src/business-objects/UX-CONFORMANCE.md
src/platform/organization/UX-CONFORMANCE.md
```

Record:

- compact-header retrofit
- Shared Records built-in app
- contextual Related Records behavior
- Product Settings navigation migration
- V2-1 automated evidence
- manual Founder visual review pending until completed
- public-demo and website-asset approval remain pending

Create:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-1-compact-header-shared-records-ia.md
```

Include:

- files created/modified
- route strategy
- reuse strategy
- permission behavior
- Product Settings compatibility strategy
- tests
- visual review
- explicit non-goals
- V2-2 remains blocked
- website assets remain paused

# Tests

Add meaningful tests.

## Header tests

- compact mode renders one `<h1>`
- compact mode renders breadcrumb
- compact mode aligns/contains primary action
- compact mode does not render routine description when omitted
- compact help remains accessible
- explanatory mode renders description
- Process Flow uses explanatory mode
- routine Inventory/Records pages use compact mode
- no duplicate page title/header

## App switcher tests

- Org Admin sees Inventory, Shared Records, Organization
- Warehouse Operator sees Inventory and Shared Records
- Warehouse Operator does not see Organization
- user with no shared-record read permissions does not see Shared Records
- Shared Records is not derived from `OrgModule`
- Records is not duplicated as another app identity

## Current-app/sidebar tests

- `/records/products` resolves Shared Records
- Shared Records sidebar shows permitted records only
- People is absent
- Inventory transactions are absent
- direct Shared Records route retains app switcher/profile

## Context-preserving route tests

- Inventory Products related link uses Inventory-context route
- Inventory contextual Product page retains Inventory navigation
- contextual page uses shared Product presenter/config
- direct Shared Records Product page uses Shared Records navigation
- no duplicated Product service/API implementation
- ownership copy remains shared
- Back links/context remain sensible

## Product Settings tests

- Product Settings absent from Inventory top-level nav
- compatibility route remains available or redirects safely
- contextual Inventory settings action exists
- service/API/schema remain present
- no redirect loop
- Warehouse Operator read/update behavior remains permission-correct

## Appearance/a11y/security regression

- Light/Dark/System behavior unchanged
- selected app/nav states remain accessible
- no hidden `orgId`
- no permission weakening
- direct unauthorized Records routes fail safely
- automated a11y tests cover compact header and Shared Records shell/presenters where practical

Do not write placeholder tests.

# Manual Visual Review

Use the controlled sandbox on port 1320.

Do not install browser automation.

If authenticated tooling is available without exposing secrets, inspect in Light and Dark:

- `/onedayosdemo/apps`
- `/onedayosdemo/inventory`
- `/onedayosdemo/inventory/process-flow`
- `/onedayosdemo/inventory/stock-levels`
- contextual Inventory Products
- contextual Inventory Suppliers
- contextual Inventory Customers
- contextual Inventory Warehouses
- `/onedayosdemo/records`
- `/onedayosdemo/records/products`
- `/onedayosdemo/records/customers`
- `/onedayosdemo/organization/people`
- Product Settings compatibility route

Verify:

- routine headers are visibly more compact
- page title remains clear
- Process Flow remains explanatory
- Shared Records appears as an app
- Inventory Related Records preserve Inventory sidebar
- direct Shared Records app uses its own sidebar
- Product Settings is not in Inventory nav
- settings remain reachable contextually
- no navigation trap
- app switcher/profile/appearance remain correct
- no unsupported V2 functionality appears

Save screenshots in `/tmp` if tooling exists.

Do not publish them.

# Controlled Demo Safety

After implementation, preserve:

- registration disabled
- demo mode/noindex
- Org Admin and Warehouse personas
- demo reset/check scripts
- controlled-demo approval only
- website asset production paused

Run `demo:check`.

Do not run `demo:reset` unless visual testing changed canonical data.

# Forbidden Changes

Do not modify:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- Inventory stock service logic
- Inventory APIs except a narrow route redirect if required
- generator templates
- caching
- charts
- Process Flow diagram V2
- Data Table engine
- modal primitives
- export
- accent presets
- public assets
- `.env.local`

Do not run:

- migrations
- `npm install` for V2-2+ dependencies
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
npm run demo:check
npm audit --audit-level=moderate
git diff --check
git status --short
```

Do not run `npm audit fix --force`.

Use `next start` on port 1320 for final smoke/visual checks.

# Final Report Required

Report:

1. V2-1 summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Compact-header API and applied pages.
6. Explanatory-header preserved pages.
7. Shared Records app implementation.
8. Shared Records visibility rules.
9. Current-app and sidebar behavior.
10. Context-preserving Related Records route strategy.
11. Shared content/service reuse strategy.
12. Product Settings nav removal and compatibility strategy.
13. Tests added or strengthened.
14. Updated full test count.
15. `check:ux` changes.
16. Accessibility test result.
17. Manual visual review result and screenshot paths.
18. Light/Dark/System regression result.
19. Controlled-demo readiness result.
20. Port 1320/server status.
21. Exact verification commands and results.
22. `check:all` result.
23. `demo:check` result.
24. npm audit result.
25. Git diff/status observations.
26. Any deviations from frozen V2-1 scope.
27. Any unresolved IA, accessibility, or compatibility risks.
28. Confirmation that no dependencies, Prisma, migrations, Data Table V2, modals, charts, exports, Inventory V2 transactions, caching, accent presets, website assets, new modules, or Platform Services were added.
29. Whether V2-1 is complete.
30. Whether V2-2 remains blocked pending explicit Founder approval.
31. Whether website asset production remains paused.

Stop after V2-1.

Do not proceed to V2-2 or any later V2 package without Founder approval.
