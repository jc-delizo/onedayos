# OneDayOS — Automated UX and Accessibility Gates Package 5

You are implementing the fifth package of the OneDayOS reusable UX system.

UX Governance has been reviewed and frozen.

Shared UX Code Package 2 has been implemented and verified.

Generator UX Enforcement Package 3 has been implemented and verified.

Inventory UX Conformance Retrofit Package 4 has been implemented and verified.

The Founder explicitly approves Automated UX and Accessibility Gates Package 5 only.

This package adds:

- `npm run check:ux`
- `npm run test:a11y`
- CI enforcement
- automated structural UX checks
- automated accessibility checks for selected reusable and implemented surfaces
- honest conformance reporting

This package does NOT replace human usability testing or manual accessibility review.

This is NOT permission to:

- implement themes
- add new business modules
- retrofit Organization or Records pages broadly
- change Inventory business logic
- change Prisma schema
- run migrations
- implement Dynamic Forms or Dynamic CRUD
- implement Platform Services
- implement runtime AI
- add FastAPI
- create client-specific UI forks
- claim formal WCAG compliance
- claim ISO certification

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
- `docs/engineering-manual/17-module-specifications/IMPLEMENTATION-NOTE-inventory-ux-conformance-retrofit.md`
- `src/modules/inventory/UX-CONFORMANCE.md`

Also obey:

- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`
- `docs/engineering-manual/14-testing-quality/05-security-testing.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/03-design-system/08-accessibility-standards.md`
- `docs/engineering-manual/02-architecture/05-dependency-rules.md`
- `docs/engineering-manual/08-module-system/03-module-folder-contract.md`
- `docs/engineering-manual/08-module-system/09-module-testing.md`
- `docs/engineering-manual/09-cli-generators/05-test-generator.md`
- `docs/engineering-manual/09-cli-generators/06-generator-safety-rails.md`

If these documents conflict, stop and report the conflict instead of inventing a resolution.

## Repository Safety

The worktree may contain many existing changes from prior packages.

Before coding:

1. Run `git status --short`.
2. Record current changed/untracked files.
3. Do not reset, delete, restore, or overwrite unrelated work.
4. Do not restore the historical implementation.
5. Limit edits strictly to UX/accessibility gates, tests, CI scripts, package scripts, and conformance notes.
6. Do not create a commit unless the Founder separately instructs you to commit.

## Local Port Rule

The app must remain on port `1320`.

Do not switch back to `3000`.

Verify:

- `npm run dev` uses port 1320
- `npm run start` uses port 1320
- `.env.example` uses `NEXT_PUBLIC_APP_URL=http://localhost:1320`
- port 3000 appears only in rejection guards or archived/historical documentation

## Goal

Create automated gates that catch structural UX regressions and common accessibility failures while preserving honest limits:

- automated checks can detect structure and many accessibility issues
- automated checks cannot prove usability
- automated checks cannot prove full WCAG 2.2 Level AA conformance
- automated checks cannot replace keyboard, screen-reader, representative-user, and task-based review

The result should make future module UX safer by default without creating a brittle linter or pretending human validation is automated.

# Package Scope

## Allowed

You may implement:

- `scripts/check-ux.ts`
- tests for `check-ux`
- shared accessibility-test helper
- selected axe-compatible tests
- package scripts
- CI workflow updates
- Inventory conformance note updates
- implementation note for this package
- small stable testability fixes in shared components if required
- a narrowly approved accessibility test dependency after compatibility review

## Forbidden

Do not implement:

- theme switching
- shadcn style migration
- Organization UX retrofit
- Records UX retrofit
- new Inventory features
- new modules
- browser automation framework
- Playwright
- Cypress
- Storybook
- a custom accessibility engine
- a full HTML crawler
- a runtime UX analytics system
- Prisma changes
- migrations
- demo reset tooling
- Platform Services
- Dynamic Systems
- runtime AI
- FastAPI

# Before Coding

Inspect and report briefly:

1. Current `package.json` scripts and dependencies.
2. Current Vitest/jsdom/Testing Library versions.
3. Current CI workflow.
4. Current `scripts/check-architecture.ts` and `scripts/check-generated.ts`.
5. Current official module registration/composition root.
6. Current Inventory UX files:
   - `ux.ts`
   - `process-flow.ts`
   - `UX-CONFORMANCE.md`
7. Current shared UX patterns.
8. Current accessible UI test coverage.
9. Candidate maintained axe-compatible dependency and version compatibility.
10. Files you plan to create.
11. Files you plan to modify.
12. Any ambiguity or risk of brittle checks.

If there is a real ambiguity, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# Accessibility Dependency Decision

You may add one narrowly scoped development dependency for automated accessibility analysis.

Preferred decision process:

1. Inspect current React, Vitest, jsdom, and Testing Library versions.
2. Choose a maintained axe-compatible package that works with the existing stack.
3. Prefer direct `axe-core` usage through a small local helper if wrappers are stale or incompatible.
4. Do not add multiple overlapping accessibility packages.
5. Do not add browser automation.
6. Record the exact dependency decision in the implementation note.

Acceptable outcomes:

- add `axe-core` as a dev dependency and create a local helper
- add a maintained Vitest-compatible axe wrapper if compatibility is verified
- stop and report if no compatible maintained option exists

Do not use `npm audit fix --force`.

# Files to Create

Expected files:

```text
scripts/
  check-ux.ts
  check-ux.test.ts

src/test/
  accessibility.ts

src/components/onedayos/patterns/__tests__/
  accessibility.test.tsx

src/modules/inventory/__tests__/
  accessibility.test.tsx

docs/engineering-manual/14-testing-quality/
  IMPLEMENTATION-NOTE-automated-ux-accessibility-gates.md
```

You may split accessibility tests into additional clearly named files if that improves maintainability.

Do not add tests under production route folders unless existing conventions strongly prefer it.

# Files to Modify

Expected files:

```text
package.json
package-lock.json
vitest.config.ts
src/test/setup.ts
.github/workflows/ci.yml
src/modules/inventory/UX-CONFORMANCE.md
docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md
```

Only modify `vitest.config.ts` or `src/test/setup.ts` if required for the chosen accessibility tool.

Modify shared components only if automated checks expose a real accessibility defect.

Do not broadly refactor pages.

# `check:ux` Design

Create:

```text
scripts/check-ux.ts
```

and package script:

```json
"check:ux": "tsx scripts/check-ux.ts"
```

## Official Module Detection

`check:ux` must evaluate official registered modules, not arbitrary folders or temporary generated output.

Inspect the current static module composition root and choose a stable approach.

Preferred:

- derive official module IDs from the static module composition root or a small explicit source of truth already used by the module registry
- do not treat temporary `/tmp` generated modules as official
- do not treat documentation examples as official
- do not scan `_archive`

Current official module is Inventory.

Do not hardcode Inventory as the only possible module.

## Required Official-Module Checks

For every official module, verify:

```text
src/modules/[module]/ux.ts exists
src/modules/[module]/process-flow.ts exists
src/modules/[module]/UX-CONFORMANCE.md exists
src/modules/[module]/__tests__/ux.test.ts exists
src/modules/[module]/__tests__/process-flow.test.ts exists
src/app/[orgSlug]/[module]/process-flow/page.tsx exists
src/app/[orgSlug]/[module]/process-flow/loading.tsx exists
```

Verify official UX files do not contain unresolved:

```text
TODO(UX)
Not Reviewed
Not Approved
```

Nuance:

- `UX-CONFORMANCE.md` may truthfully contain human-review statuses such as `Human Validation Pending`.
- Do not reject honest pending human validation.
- Reject generator-default states that were never replaced, such as the exact generated `Status: Not Reviewed` and `Approval Result: Not Approved` scaffolding.
- Do not require Public Demo approval.

Verify official module source uses:

- shared `ProcessFlowPage`
- shared contextual Process Flow loading
- shared page patterns for approved page types where conformance retrofit has happened

For Inventory, verify at minimum:

- Dashboard uses `DashboardPage`
- list pages use `ListPage`
- adjustment form uses `FormPage`
- Process Flow uses `ProcessFlowPage`

## Structural UX Regression Checks

Where stable and non-brittle, detect:

- duplicate module top navbar replacing persistent sidebar
- final plain `Loading...`
- final plain `Error`
- fake dashboard metric markers/placeholders
- hidden `orgId` fields
- client-side `orgId` submission
- client component importing `@/sdk/server`
- client component importing `@/kernel/*`
- raw Prisma imports in UX/page-pattern client files
- missing accessible name on known icon-only shared buttons where reliably detectable
- missing Process Flow navigation for official business modules
- module UX contract missing required exported fields

Do not duplicate security checks already reliably covered by `check:architecture`.

It is acceptable for `check:ux` to delegate or complement rather than repeat everything.

Avoid brittle checks based only on arbitrary Tailwind class strings.

## Exit Behavior

- print concise actionable failures
- exit non-zero on structural failures
- print a clear success summary
- do not print secrets
- do not claim usability or WCAG conformance

# `check-ux.test.ts`

Add meaningful tests using temporary fixtures.

Required coverage:

- passes for a complete official-module fixture
- fails when `ux.ts` is missing
- fails when `process-flow.ts` is missing
- fails when `UX-CONFORMANCE.md` is missing
- fails when Process Flow page is missing
- fails when Process Flow loading route is missing
- fails when generated `TODO(UX)` remains in an official module
- fails when generator-default `Not Reviewed` / `Not Approved` remains unchanged
- allows truthful `Human Validation Pending`
- fails on generic final `Loading...`
- fails on generic final `Error`
- fails on fake dashboard metric placeholder markers
- fails when required ModuleUxContract fields are missing, if source-contract validation can do this reliably
- ignores docs/archive/temp generated output
- does not hardcode Inventory-only behavior

Do not write placeholder tests.

# Accessibility Test Helper

Create:

```text
src/test/accessibility.ts
```

The helper should:

- run the chosen axe-compatible analyzer against a rendered container/document
- return or assert violations in a readable way
- include rule IDs and affected nodes in failure messages where possible
- avoid global mutation beyond test setup
- remain test-only
- not import server code
- not claim full WCAG conformance

Preferred API shape:

```ts
export async function expectNoA11yViolations(
  container: HTMLElement,
  options?: ...
): Promise<void>
```

or another small, typed API.

If some rules cannot run reliably in jsdom, document exclusions narrowly.

Do not broadly disable color contrast or landmark rules without explanation.

Note: jsdom cannot accurately evaluate every browser/layout-dependent rule. Record those limitations.

# Automated Accessibility Tests

## Shared Pattern Tests

Create:

```text
src/components/onedayos/patterns/__tests__/accessibility.test.tsx
```

Test representative states:

- `AppPage`
- `DashboardPage`
- `ListPage`
- `FormPage`
- `SettingsPage`
- `ProcessFlowPage`
- permission denied state
- module unavailable state
- safe error state
- empty state

Use meaningful content and accessible labels.

Required assertions:

- axe-compatible scan reports no violations for tested markup
- Process Flow remains semantic and ordered
- primary actions have accessible names
- headings are structured reasonably
- state messages use appropriate semantics
- no color-only status assumption in test fixtures

## Inventory Accessibility Tests

Create:

```text
src/modules/inventory/__tests__/accessibility.test.tsx
```

Test components or renderable page fragments that can be exercised without importing server-only route execution.

At minimum cover:

- Inventory Process Flow through shared `ProcessFlowPage`
- Inventory UX-related low-stock status presentation or representative Stock Levels table markup
- Inventory adjustment form component if it is a client component and can be rendered with safe fixtures
- Inventory navigation/app-shell relevant component only if practical without duplicating existing shell tests

Do not mock away the accessibility semantics being tested.

If full route pages are server components with DB/auth dependencies, test the shared/presentational components and document the limitation.

# Optional Auth/App Launcher Accessibility Coverage

If existing Login, Register, and App Launcher components can be tested easily using current fixtures, add or extend tests for:

- Login
- Register
- App Launcher

This is encouraged but should not expand scope into page refactoring.

Do not modify auth behavior.

# Test Script

Add:

```json
"test:a11y": "vitest run <specific accessibility test pattern>"
```

Use a stable pattern that runs only accessibility test files.

Examples:

```json
"test:a11y": "vitest run --testNamePattern accessibility"
```

or a file glob supported by the current Vitest version.

Choose a script that is verified in the current repository.

Do not make `test:a11y` accidentally run zero tests.

Add a test or command verification proving the script runs the intended files.

# CI Integration

Update:

```text
.github/workflows/ci.yml
```

Add required steps:

```text
npm run check:ux
npm run test:a11y
```

Place them after install/type/lint as appropriate and before build completion.

Preserve existing:

- Node 24
- typecheck
- lint
- test suite
- architecture checks
- generated checks
- env checks
- Prisma checks
- build

Do not expose secrets.

Accessibility tests must run without live Supabase/DB credentials.

# Package Scripts

Update `package.json`:

```json
"check:ux": "tsx scripts/check-ux.ts",
"test:a11y": "<verified Vitest accessibility command>"
```

Update `check:all` to include:

```text
check:ux
test:a11y
```

Preserve existing script ordering and behavior.

Do not remove existing gates.

# Inventory UX Conformance Update

Update:

```text
src/modules/inventory/UX-CONFORMANCE.md
```

Truthfully record:

Completed:

- automated structural UX checks
- selected automated accessibility tests
- shared UX pattern use
- Process Flow structure
- Inventory security/transaction audit
- iterative Founder visual review

Still pending unless actually completed:

- full keyboard-only walkthrough
- screen-reader spot check
- browser-level accessibility scan
- representative warehouse user walkthrough
- independent Org Admin walkthrough
- formal WCAG conformance assessment

Do not change approval to Public Demo Approved.

Do not claim WCAG compliance.

Keep controlled-Founder-demo wording only if still accurate.

# Manual Accessibility Checklist Artifact

Create or update a small checklist artifact for Inventory:

```text
src/modules/inventory/UX-CONFORMANCE.md
```

or, if the frozen governance strongly prefers a separate file:

```text
src/modules/inventory/MANUAL-ACCESSIBILITY-CHECKLIST.md
```

Do not create unnecessary files if the conformance document already supports the checklist.

Record unchecked items honestly.

# Existing Manual Amendment

Update:

```text
docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md
```

The commands were previously marked planned.

Change them to implemented/current where appropriate:

```text
npm run check:ux
npm run test:a11y
```

Preserve frozen status and make a narrow ADR-backed amendment.

Do not rewrite unrelated content.

# Implementation Note

Create:

```text
docs/engineering-manual/14-testing-quality/IMPLEMENTATION-NOTE-automated-ux-accessibility-gates.md
```

Include:

- dependency chosen and why
- dependency/version compatibility
- `check:ux` scope
- official-module detection approach
- accessibility helper
- pages/components covered
- CI changes
- limitations of jsdom/automated testing
- human review still required
- no formal compliance claim
- Inventory conformance update
- explicit non-goals
- follow-up packages:
  - manual accessibility review
  - representative-user walkthrough
  - Organization/Records UX retrofit
  - theme/appearance package

# Architecture Checker

Do not move all UX rules into `check:architecture`.

Use:

- `check:architecture` for architecture/security boundaries
- `check:generated` for generator output
- `check:ux` for official-module UX structure
- `test:a11y` for automated accessibility tests

Only modify `check:architecture` if a clear non-UX architecture gap is discovered.

# Forbidden Changes

Do not modify:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/kernel/db/**`
- auth flows
- Inventory business services
- Inventory APIs
- Inventory database behavior
- Organization pages
- Records pages
- module generator templates, unless a severe regression is discovered and reported
- `.env.local`
- demo provisioning
- deployment infrastructure beyond CI
- theme functionality
- shadcn style/preset
- fonts/colors/radius
- public demo reset behavior

Do not run migrations.

Do not run demo provisioning.

Do not add Playwright or Cypress.

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

Verify `test:a11y` runs at least one test file and non-zero tests.

Do not run:

```bash
npm audit fix --force
```

If the sandbox server is already running, do not unnecessarily restart it.

No browser smoke test is required unless a shared component change unexpectedly affects rendering.

# Final Report Required

Report:

1. Automated UX and Accessibility Gates summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Accessibility dependency chosen and exact version.
6. Why that dependency was chosen.
7. `check:ux` official-module detection approach.
8. `check:ux` rules implemented.
9. `check:ux` tests added.
10. Accessibility helper API.
11. Accessibility test files and surfaces covered.
12. Number of accessibility test files/tests run.
13. CI workflow changes.
14. Package scripts added/updated.
15. Inventory UX-CONFORMANCE updates.
16. Manual review items still pending.
17. Exact verification commands and results.
18. `check:all` result.
19. npm audit result.
20. Git diff/status observations.
21. Any deviations from frozen UX governance.
22. Any limitations of jsdom/axe automation.
23. Confirmation that no Prisma, migrations, Inventory business logic, APIs, Organization, Records, themes, browser automation, or new-module changes were made.
24. Whether Automated UX and Accessibility Gates Package 5 is complete.
25. Whether manual accessibility and representative-user validation remain pending.
26. Whether Theme/Appearance Package and Organization/Records Retrofit remain blocked pending Founder approval.
27. Whether public website demo approval remains pending.

Stop after this package.

Do not proceed to themes, Organization/Records retrofit, representative-user claims, public demo preparation, deployment automation, or new modules without Founder approval.
