# OneDayOS — Shared UX Code Package 2

You are implementing the second package of the OneDayOS reusable UX system.

UX Governance has been reviewed and frozen.

The Founder explicitly approves implementation of Shared UX Code Package 2 only.

This package creates reusable UX types and page-pattern components that future modules will consume.

This is NOT permission to:

- modify the module generator
- retrofit Inventory
- implement `check:ux`
- install accessibility tooling
- implement themes
- implement new modules
- implement Dynamic Forms or Dynamic CRUD
- implement a metadata-driven page builder
- implement Platform Services
- implement runtime AI
- add FastAPI
- change Prisma schema
- run migrations
- create client-specific UI forks

## Primary Implementation Authority

Read and follow:

- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-2-SHARED-UX-CODE.md`
- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/03-design-system/11-module-ux-contract.md`
- `docs/engineering-manual/03-design-system/12-usability-review-checklist.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0011-human-centred-ux-standard.md`

Also obey:

- `docs/engineering-manual/02-architecture/02-repository-architecture.md`
- `docs/engineering-manual/02-architecture/05-dependency-rules.md`
- `docs/engineering-manual/03-design-system/02-layout-system.md`
- `docs/engineering-manual/03-design-system/03-component-standards.md`
- `docs/engineering-manual/03-design-system/04-table-standards.md`
- `docs/engineering-manual/03-design-system/05-form-standards.md`
- `docs/engineering-manual/03-design-system/06-empty-loading-error-states.md`
- `docs/engineering-manual/03-design-system/08-accessibility-standards.md`
- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`

If these documents conflict, stop and report the conflict instead of inventing a resolution.

## Repository Safety

The worktree may contain many existing changes from prior packages.

Before coding:

1. Run `git status --short`.
2. Record the current changed/untracked files.
3. Do not reset, delete, restore, or overwrite unrelated work.
4. Do not restore the historical implementation.
5. Limit edits strictly to Shared UX Code Package files and required exports/tests.
6. Do not create a commit unless the Founder has separately instructed you to commit.

## Local Port Rule

The app must remain on port `1320`.

Do not switch back to `3000`.

Verify:

- `npm run dev` uses port 1320
- `npm run start` uses port 1320
- `.env.example` uses `NEXT_PUBLIC_APP_URL=http://localhost:1320`
- port 3000 appears only in rejection guards or archived/historical documentation

## Goal

Create a small, reusable, composition-first UX pattern library.

The shared patterns must make the correct OneDayOS UX easier to implement in future modules without becoming:

- a no-code page builder
- a Dynamic Forms engine
- a Dynamic CRUD engine
- a metadata-driven runtime renderer
- a generic admin template
- an overly abstract component framework

The components should standardize structure while leaving business content explicit in module/page code.

## Architectural Principle

Use composition, not configuration-heavy abstraction.

Good:

```tsx
<ListPage
  breadcrumb={...}
  title="Products"
  description="Shared product identity."
  primaryAction={<Button>New Product</Button>}
  toolbar={<ProductFilters />}
>
  <DataTable ... />
</ListPage>
```

Avoid:

```tsx
<UniversalPage
  type="crud"
  model="Product"
  autoGenerateEverything
/>
```

The pattern library standardizes:

- page hierarchy
- spacing
- breadcrumbs
- titles/descriptions
- primary actions
- content width
- contextual states
- process-flow presentation

It does not own:

- data fetching
- authorization
- tenant resolution
- business rules
- APIs
- forms metadata
- database access
- module routing

## Before Coding

Inspect and report briefly:

1. Current `src/components/onedayos` structure.
2. Current shared UI primitives.
3. Current `PageHeader`, state, skeleton, table, panel/surface, and form components.
4. Current `src/sdk` exports and shared-safe type conventions.
5. Current test setup and Testing Library support.
6. Whether any pattern components already exist.
7. Files you plan to create.
8. Files you plan to modify.
9. Any ambiguity or duplication risk.

If there is a real architecture ambiguity, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# Files to Create

Create:

```text
src/sdk/ux-types.ts

src/components/onedayos/patterns/
  app-page.tsx
  dashboard-page.tsx
  list-page.tsx
  detail-page.tsx
  form-page.tsx
  settings-page.tsx
  process-flow-page.tsx
  page-states.tsx
  index.ts

src/components/onedayos/patterns/__tests__/
  page-patterns.test.tsx
  process-flow-page.test.tsx

docs/engineering-manual/03-design-system/
  IMPLEMENTATION-NOTE-shared-ux-code-package.md
```

Do not create Inventory UX files in this package.

Do not create generator UX templates in this package.

Do not create `scripts/check-ux.ts` yet.

Do not install axe or any accessibility package yet.

# Files to Modify

Modify only as required:

```text
src/sdk/index.ts
src/components/onedayos/index.ts
```

Potentially modify existing shared primitives only if a small backward-compatible fix is required for the new patterns.

Do not broadly refactor existing pages in this package.

Do not modify Inventory pages.

Do not modify Organization or Records pages.

# Shared UX Types

Create:

```text
src/sdk/ux-types.ts
```

At minimum define:

```ts
export type ModuleUxContract = {
  primaryUsers: readonly string[]
  userGoals: readonly string[]
  primaryTasks: readonly string[]
  taskFrequency: readonly string[]
  workEnvironment: readonly string[]
  requiredKnowledge: readonly string[]
  relatedBusinessObjects: readonly string[]
  moduleOwnedRecords: readonly string[]
  criticalErrorsToPrevent: readonly string[]
  permissionRoles: readonly string[]
  appNavigation: readonly string[]
  pageMap: readonly string[]
  defaultLandingPage: string
  processFlowRoute: string
  keyboardWorkflows: readonly string[]
  accessibilityRequirements: readonly string[]
  usabilityTestScenarios: readonly string[]
  knownMvpLimitations: readonly string[]
  futureIntegrations: readonly string[]
}

export type ProcessFlowStep = {
  id: string
  number?: number
  title: string
  description: string
  inputs?: readonly string[]
  outputs?: readonly string[]
  warning?: string
}

export type ProcessFlowDefinition = {
  title: string
  description: string
  steps: readonly ProcessFlowStep[]
  owns: readonly string[]
  doesNotOwn: readonly string[]
  currentBoundaries?: readonly string[]
  futureIntegrations?: readonly string[]
}
```

You may refine names if the frozen governance documents specify an exact contract.

Rules:

- shared-safe types only
- no React imports unless genuinely necessary
- no server-only imports
- no Kernel imports
- no Prisma imports
- no executable business logic
- no tenant data
- no `orgId`

Export these types from `src/sdk/index.ts`.

Do not add executable UX behavior to module manifests.

# Pattern Component Requirements

## 1. `AppPage`

Purpose:

Standard page frame for authenticated task pages.

Required support:

- breadcrumb
- title
- description
- primary action
- optional secondary actions
- optional contextual help
- consistent content width
- consistent vertical spacing
- children/content

It must reuse existing `PageHeader` and design-system primitives where practical.

It must not:

- fetch data
- perform auth
- resolve permissions
- contain module navigation
- accept `orgId`
- create a top navbar

Prefer a server-compatible component with no `'use client'` unless interaction requires it.

## 2. `DashboardPage`

Purpose:

Standard frame for real operational dashboards.

Required support:

- AppPage header contract
- metric content slot
- primary content section
- secondary/recent activity section
- optional actions

Important:

- no fake metrics
- no default placeholder cards presented as real data
- no charts dependency
- no automatic data generation
- metrics are explicit React children passed by the caller

It should be a composition wrapper, not a dashboard engine.

## 3. `ListPage`

Purpose:

Standard frame for list/table pages.

Required support:

- AppPage header contract
- optional toolbar/filter area
- table/content slot
- true-empty state
- filtered-empty state
- loading state
- error state
- optional pagination slot for future callers

Do not implement:

- global search
- saved views
- Dynamic Table Views
- exports
- reporting
- raw filter/query generation

The caller remains responsible for determining state and passing the appropriate content.

## 4. `DetailPage`

Purpose:

Standard record-detail presentation.

Required support:

- AppPage header contract
- summary content
- sections
- actions
- optional metadata area

Do not render all fields as disabled inputs.

Do not infer fields from Prisma or metadata.

## 5. `FormPage`

Purpose:

Standard frame for create/edit/task forms.

Required support:

- AppPage header contract
- form content
- optional section grouping
- form-level error
- action/footer slot
- pending state affordance if supplied by caller
- cancel/back action slot

Do not:

- generate fields
- accept `orgId`
- submit data
- own React Hook Form state
- become Dynamic Forms

The caller owns validation and submission.

## 6. `SettingsPage`

Purpose:

Standard administrative settings frame.

Required support:

- AppPage header contract
- section navigation or section content slot
- clear save/pending/error states
- consistent content width appropriate for settings

Do not create a raw JSON editor.

Do not create organization custom-theme functionality.

## 7. `ProcessFlowPage`

Purpose:

Render a `ProcessFlowDefinition` consistently for every business module.

Required:

- page header
- accessible ordered sequence
- numbered steps
- step title and description
- optional inputs/outputs
- optional warning
- “What this module owns”
- “What this module does not own”
- optional current boundaries
- optional future integrations
- responsive layout
- understandable without relying only on arrow direction or color
- semantic headings and ordered-list structure where possible

Do not:

- mutate data
- make API calls
- implement workflow automation
- implement approvals
- implement background jobs
- implement a diagram library
- add Mermaid
- add SVG-heavy custom diagrams
- add a new dependency

Use existing Surface/Panel/Badge/design primitives.

## 8. `page-states.tsx`

Create reusable composition helpers for:

- page loading
- table loading
- form loading
- dashboard loading
- process-flow loading
- true empty
- filtered empty
- safe page error
- permission denied
- module unavailable

Prefer wrapping/reusing existing:

- `EmptyState`
- `FilteredEmptyState`
- `LoadingState`
- `ErrorState`
- `PermissionDeniedState`
- `ModuleUnavailableState`
- loading skeleton primitives

Do not duplicate existing components unnecessarily.

Do not render raw technical errors.

Do not use final plain text:

- `Loading...`
- `Error`
- `No data`

# Pattern API Quality

Pattern component APIs should be:

- typed
- small
- composition-oriented
- stable
- accessible
- server-compatible where possible
- easy for generator templates to use later
- not tied to Inventory
- not tied to a specific org
- not tied to a database model

Avoid excessive boolean props.

If a component requires many mutually exclusive booleans, reconsider the API.

Prefer explicit children/slots and small discriminated unions where useful.

# Styling Requirements

Use existing OneDayOS tokens and primitives.

Do not:

- introduce arbitrary raw colors
- create per-pattern custom palettes
- re-map brand orange to generic accent
- add gradients/glassmorphism
- add fake dashboard visuals
- introduce a second sidebar/header system
- add a new font
- implement theme switching in this package

Keep:

- calm
- compact
- premium
- data-dense
- predictable
- responsive

# Accessibility Requirements

At minimum:

- semantic headings
- breadcrumb navigation with accessible label
- ordered semantics for process flow
- accessible names for icon-only actions supplied by patterns
- visible focus remains governed by existing primitives
- state components use appropriate roles where practical
- process flow remains understandable without color
- no clickable `div` elements
- no inaccessible hidden content

Do not claim WCAG conformance.

Do not install accessibility scanning dependencies in this package.

# Tests

Use the existing Vitest + Testing Library setup.

Add meaningful tests.

## `page-patterns.test.tsx`

Required coverage:

- AppPage renders breadcrumb, title, description, primary action, and content.
- AppPage works without optional actions.
- DashboardPage renders caller-supplied metrics/content and does not invent fake metrics.
- ListPage renders toolbar and list content.
- ListPage renders true-empty state.
- ListPage renders filtered-empty state.
- ListPage renders loading state.
- ListPage renders safe error state without exposing raw technical details.
- DetailPage renders summary and sections.
- FormPage renders form content and action/footer slot.
- SettingsPage renders settings content.
- Page patterns do not render duplicate module navigation.
- No pattern accepts or renders hidden `orgId`.

## `process-flow-page.test.tsx`

Required coverage:

- renders title and description
- renders ordered process steps
- renders inputs and outputs when provided
- renders warning when provided
- renders owns list
- renders does-not-own list
- renders boundaries/future integrations when provided
- remains understandable without relying on color-only content
- does not render form controls or mutation actions
- does not make API calls
- accepts a frozen/readonly definition

Do not write placeholder tests.

# Exports

Update:

```text
src/sdk/index.ts
```

to export:

- `ModuleUxContract`
- `ProcessFlowDefinition`
- `ProcessFlowStep`

Update:

```text
src/components/onedayos/index.ts
```

to export the pattern library.

Avoid circular imports.

# Implementation Note

Create:

```text
docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-shared-ux-code-package.md
```

Include:

- files implemented
- pattern APIs implemented
- explicit non-goals
- no generator changes yet
- no Inventory retrofit yet
- no accessibility dependency yet
- no `check:ux` yet
- no theme functionality yet
- known follow-up packages

# Architecture Checks

Inspect whether current `check:architecture` already protects the relevant boundaries.

Only extend it if needed to detect clear regressions introduced by this package, such as:

- server-only imports in shared pattern components
- Prisma imports in shared pattern components
- `orgId` form fields in patterns
- pattern components under module folders
- forbidden page-builder naming/patterns if reliably detectable

Do not add brittle checks.

Do not implement `check:ux` yet.

# Forbidden Changes

Do not modify:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/kernel/db/**`
- auth flows
- Inventory source/pages
- Organization pages
- Records pages
- module generator files
- package dependencies
- `.env.local`
- deployment scripts
- demo provisioning
- theme functionality

Do not run migrations.

Do not run demo provisioning.

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

If the sandbox server is already running, do not unnecessarily restart it for this package.

No browser smoke test is required unless existing pages are affected unexpectedly.

# Final Report Required

Report:

1. Shared UX Code Package summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Shared UX types added.
6. Page patterns added.
7. ProcessFlowPage API summary.
8. Page-state helpers added.
9. Tests added.
10. Updated test count.
11. Exports changed.
12. Architecture-check changes, if any.
13. Exact verification commands and results.
14. npm audit result.
15. Git diff/status observations.
16. Any deviations from the frozen UX governance documents.
17. Any unresolved API or over-abstraction risks.
18. Confirmation that no Prisma, migrations, dependencies, generator, Inventory, Organization, Records, theme, or accessibility-tooling changes were made.
19. Whether Shared UX Code Package 2 is complete.
20. Whether Generator UX Enforcement Package remains blocked pending Founder approval.

Stop after this package.

Do not proceed to generator changes, Inventory retrofit, accessibility tooling, themes, Organization/Records retrofit, or new modules without Founder approval.
