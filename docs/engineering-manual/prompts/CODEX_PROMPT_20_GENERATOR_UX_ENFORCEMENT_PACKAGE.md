# OneDayOS — Generator UX Enforcement Package 3

You are implementing the third package of the OneDayOS reusable UX system.

UX Governance has been reviewed and frozen.

Shared UX Code Package 2 has been implemented and verified.

The Founder explicitly approves Generator UX Enforcement Package 3 only.

This package updates the audited module generator so every future business module receives the required UX contract, Process Flow scaffold, shared page patterns, contextual states, and UX conformance template by default.

This is NOT permission to:

- retrofit Inventory
- modify Organization or Records pages
- implement `check:ux`
- install accessibility tooling
- implement themes
- implement new business modules
- change Prisma schema
- run migrations
- implement Dynamic Forms or Dynamic CRUD
- implement a metadata-driven page builder
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

Also obey:

- `docs/engineering-manual/08-module-system/01-module-manifest.md`
- `docs/engineering-manual/08-module-system/03-module-folder-contract.md`
- `docs/engineering-manual/08-module-system/09-module-testing.md`
- `docs/engineering-manual/09-cli-generators/00-generator-philosophy.md`
- `docs/engineering-manual/09-cli-generators/01-module-generator.md`
- `docs/engineering-manual/09-cli-generators/04-api-generator.md`
- `docs/engineering-manual/09-cli-generators/05-test-generator.md`
- `docs/engineering-manual/09-cli-generators/06-generator-safety-rails.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/17-module-specifications/00-module-spec-template.md`
- `docs/engineering-manual/02-architecture/02-repository-architecture.md`
- `docs/engineering-manual/02-architecture/05-dependency-rules.md`
- `docs/engineering-manual/03-design-system/02-layout-system.md`
- `docs/engineering-manual/03-design-system/03-component-standards.md`
- `docs/engineering-manual/03-design-system/06-empty-loading-error-states.md`
- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`

Inspect the current generator implementation note:

- `docs/engineering-manual/09-cli-generators/IMPLEMENTATION-NOTE-generator-package.md`

If these documents conflict, stop and report the conflict instead of inventing a resolution.

## Repository Safety

The worktree may contain many existing changes from prior packages.

Before coding:

1. Run `git status --short`.
2. Record the current changed/untracked files.
3. Do not reset, delete, restore, or overwrite unrelated work.
4. Do not restore the historical implementation.
5. Limit edits strictly to generator UX enforcement files, generated-template tests, required shared types/exports, and the implementation note.
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

Make the module generator produce a secure, architecture-compliant, human-centred UX scaffold for every future business module.

The generated module must include:

```text
src/modules/[module]/
  manifest.ts
  permissions.ts
  schema.ts
  types.ts
  service.ts
  events.ts
  settings.ts
  navigation.ts
  ai-context.ts
  ux.ts
  process-flow.ts
  UX-CONFORMANCE.md
  docs.md
  index.ts
  README.md
  __tests__/
    service.test.ts
    ux.test.ts
    process-flow.test.ts

src/app/[orgSlug]/[module]/
  page.tsx
  loading.tsx
  error.tsx
  process-flow/
    page.tsx
    loading.tsx
```

Preserve any other secure generated files already required by the audited module folder contract.

The generator must not become a no-code builder or a generic page engine.

## Core UX Enforcement Principles

Every generated official-module scaffold must make these requirements visible and difficult to ignore:

1. Primary users and tasks must be defined.
2. Critical errors must be identified.
3. Related shared Business Objects must be named.
4. Module-owned records must be named.
5. Default landing page must be explicit.
6. A Process Flow route must exist.
7. Loading, empty, error, denied, and unavailable states must use shared patterns.
8. Pages must use the persistent OneDayOS shell.
9. Generated pages must use shared page-pattern components.
10. The generator must not create fake dashboard metrics.
11. The generator must not create a duplicate module navbar.
12. The generator must not expose hidden `orgId`.
13. The generator must not import server-only code into client components.
14. The generator must not duplicate Product, Customer, Employee, Supplier, or Warehouse identities.
15. UX conformance remains incomplete until humans review the module.

## Before Coding

Inspect and report briefly:

1. Current `scripts/create-module.ts` behavior.
2. Current generated file list.
3. Current generated module page templates.
4. Current `scripts/check-generated.ts` rules.
5. Current generator and checker tests.
6. Current `src/sdk/ux-types.ts` contract.
7. Current shared page-pattern exports.
8. Current module manifest type and whether it already has sufficient route metadata for Process Flow.
9. Files you plan to modify.
10. Files you plan to create.
11. Any architecture ambiguity or risk of over-abstraction.

If there is a real ambiguity, stop and wait for Founder approval.

If there is no ambiguity, proceed.

# Files to Modify

Expected generator/package files:

```text
scripts/create-module.ts
scripts/create-module.test.ts
scripts/check-generated.ts
scripts/check-architecture.ts
scripts/check-architecture.test.ts
```

Modify `src/sdk/module-types.ts` only if a minimal declarative UX field is clearly necessary and not duplicative.

Potentially modify:

```text
src/sdk/index.ts
```

only if generator templates require an already approved export that is currently missing.

Do not modify Inventory source.

Do not modify Organization or Records pages.

Do not modify Prisma.

# Files to Create

Create:

```text
docs/engineering-manual/09-cli-generators/
  IMPLEMENTATION-NOTE-generator-ux-enforcement-package.md
```

Create additional focused generator test fixtures only if they are clearly scoped and ignored by live architecture checks.

Do not create a real module in `src/modules`.

# Generated `ux.ts` Contract

The generator must create:

```text
src/modules/[module]/ux.ts
```

It must:

- import `ModuleUxContract` as a type from `@/sdk`
- use `satisfies ModuleUxContract`
- remain shared-safe and declarative
- contain no server imports
- contain no Prisma imports
- contain no `orgId`
- contain no executable business logic
- contain no tenant/client data

The generated contract must include all frozen required fields:

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

Because the generator cannot know the module’s true users and workflow, generated values must be explicit draft placeholders.

Use clear placeholder markers such as:

```text
TODO(UX): Define the primary users from the approved module specification.
```

Rules:

- The generated module must compile.
- Do not invent fake users, tasks, or business workflows.
- Do not use vague values that look final.
- Do not throw at runtime.
- Do not prevent generator audit output from compiling.
- The future `check:ux` package will reject unresolved UX placeholders in official modules.
- Document that generated UX placeholders must be resolved before implementation begins.

# Generated `process-flow.ts`

The generator must create:

```text
src/modules/[module]/process-flow.ts
```

It must:

- import `ProcessFlowDefinition` as a type from `@/sdk`
- use `satisfies ProcessFlowDefinition`
- remain declarative
- contain no API calls
- contain no server imports
- contain no Prisma imports
- contain no mutations
- contain no `orgId`
- contain no Workflow Engine logic
- contain no Dynamic Forms logic
- contain no AI logic

Use explicit draft placeholders rather than inventing a fake business process.

The generated definition must include:

```text
title
description
steps
owns
doesNotOwn
currentBoundaries
futureIntegrations
```

The scaffold may include one clearly marked draft step such as:

```text
TODO(UX): Replace this draft step with the approved business workflow before implementation.
```

Do not present the placeholder as a real working process.

# Generated `UX-CONFORMANCE.md`

The generator must create:

```text
src/modules/[module]/UX-CONFORMANCE.md
```

Required sections:

```text
# [Module] UX Conformance

## Status
Not Reviewed

## Standards Targeted
- Aligned with ISO 9241-210
- Aligned with ISO 9241-110
- Reviewed using Nielsen’s usability heuristics
- Targets WCAG 2.2 Level AA

## Primary Users Represented

## Critical Tasks Tested

## Reviewers

## Automated Structural Checks

## Automated Accessibility Checks

## Manual Accessibility Review

## Representative-User Walkthroughs

## Findings

## Resolutions

## Deferred Issues

## Approval Result
Not Approved
```

Do not claim certification or conformance.

Do not mark generated modules approved.

# Generated Process Flow Route

Generate:

```text
src/app/[orgSlug]/[module]/process-flow/page.tsx
```

It must:

- import the module’s `processFlow` definition
- render the shared `ProcessFlowPage`
- use the standard page shell/pattern
- remain server-compatible where possible
- make no API calls
- perform no mutation
- include no hidden `orgId`
- include no module-specific top navbar
- rely on the persistent shell/sidebar

Generate:

```text
src/app/[orgSlug]/[module]/process-flow/loading.tsx
```

It must use the shared contextual Process Flow loading state.

Do not generate generic horizontal bars.

# Generated Module Landing Page

Refactor the generated module landing page to use shared UX patterns.

Preferred behavior:

- use `DashboardPage` if the module landing page is an overview
- do not generate fake metrics
- do not generate fake charts
- render an honest draft/empty state that tells implementers the module dashboard requires real module data
- include a visible link to Process Flow
- do not create a duplicate module navbar
- do not fetch or display fabricated records

The generated module scaffold may show a development-only or draft empty state, but it must not look like production data.

# Generated List and Form Pages

Where the generator currently creates list/create pages:

- use `ListPage`
- use `FormPage`
- continue using shared `DataTable` and form primitives
- use contextual loading/error state patterns
- do not generate hidden `orgId`
- do not submit `orgId`
- do not create fake records
- do not emit fake success events
- do not claim a placeholder service is durable storage
- preserve all audited API, permission, tenant, and SDK rules

Do not create Dynamic CRUD behavior.

Do not infer fields from Prisma.

# Generated Loading and Error States

Generate or ensure:

```text
src/app/[orgSlug]/[module]/loading.tsx
src/app/[orgSlug]/[module]/error.tsx
```

Requirements:

- contextual module-page loading state
- safe error state
- no raw technical error output
- no plain final `Loading...`
- no plain final `Error`
- no duplicate shell/sidebar
- no redirect logic in error UI

If the current route architecture already provides a suitable parent-level state, avoid unnecessary duplication, but the generated module must still satisfy the frozen Page Patterns contract.

# Generated `ux.test.ts`

Create:

```text
src/modules/[module]/__tests__/ux.test.ts
```

Required structural tests:

- UX contract exports successfully
- contract includes every required field
- default landing page points inside the module route
- processFlowRoute points to the module’s Process Flow route
- relatedBusinessObjects and moduleOwnedRecords are separate arrays
- no `orgId` field or value
- no server-only imports in the source template
- unresolved draft placeholders are clearly marked `TODO(UX)` rather than appearing final

Do not claim the UX contract is approved.

# Generated `process-flow.test.ts`

Create:

```text
src/modules/[module]/__tests__/process-flow.test.ts
```

Required tests:

- definition exports successfully
- required fields exist
- steps use stable IDs
- ownership arrays exist
- no `orgId`
- no API/server imports
- Process Flow page source uses shared `ProcessFlowPage`
- Process Flow loading route uses contextual Process Flow loading helper
- placeholder content is clearly marked draft

# Module Manifest Decision

Inspect whether the existing manifest route declarations already express the Process Flow route.

Preferred:

- Add Process Flow to normal route/nav metadata.
- Do not add a new `ux` field if it duplicates existing route metadata.

Only add a minimal field such as:

```ts
ux?: {
  processFlowRoute: string
}
```

if it provides real non-duplicative value and is supported by the frozen manual.

If no field is added, document why route metadata and `ux.ts` are sufficient.

Keep manifest pure metadata.

# Navigation Template

Every generated business module should include Process Flow in module navigation.

Recommended order:

```text
Dashboard
Process Flow
[Module-specific workflow pages]
```

The generator cannot know all module-specific workflow pages, so preserve current secure scaffolding and insert Process Flow after the landing page.

Do not add shared Business Objects automatically to module navigation unless the approved module specification names them.

Do not invent Product, Customer, Employee, Supplier, or Warehouse relevance.

# `check-generated` Enhancements

Update `scripts/check-generated.ts` so generated modules are checked for:

```text
ux.ts exists
process-flow.ts exists
UX-CONFORMANCE.md exists
process-flow/page.tsx exists
process-flow/loading.tsx exists
ux.test.ts exists
process-flow.test.ts exists
generated page uses shared page patterns
generated Process Flow route uses ProcessFlowPage
generated Process Flow loading uses contextual Process Flow loading
no fake dashboard metrics
no generic final Loading... or Error
no duplicate module navbar
no hidden orgId
no client-side orgId submission
no raw Prisma in module files
no @/kernel imports in module files
no module-to-module imports
no sdk.getDb(orgId)
no /api/[module]
no action-array permissions
no wildcard manifest permissions
no self-registration
no duplicate Business Object identities
no old framer-motion imports
no FastAPI/Python files
```

Important:

- Draft `TODO(UX)` placeholders are allowed in generated scaffolds.
- Generated `UX-CONFORMANCE.md` must remain `Not Reviewed` and `Not Approved`.
- Do not make `check-generated` pretend human usability is proven.

# Architecture Checker Enhancements

Only add stable, non-brittle rules.

Potential additions:

- official module folder missing `ux.ts`
- official module folder missing `process-flow.ts`
- official module folder missing `UX-CONFORMANCE.md`
- module-specific navbar replacing shell, where reliably detectable
- generic final loading/error strings in generated templates
- fake metric placeholder markers in generated templates

Do not implement full `check:ux` yet.

Do not make architecture checks fail the current Inventory module in this package. Inventory retrofit happens later.

If a proposed rule would immediately fail Inventory because Package 4 has not run, either:

1. scope the rule to generated output only for now, or
2. document it as deferred to `check:ux`.

Do not weaken current security checks.

# Generator Tests

Strengthen `scripts/create-module.test.ts` and relevant checker tests.

Required tests:

- generator creates `ux.ts`
- generator creates `process-flow.ts`
- generator creates `UX-CONFORMANCE.md`
- generator creates Process Flow page/loading files
- generator creates UX/process-flow tests
- generated `ux.ts` uses `satisfies ModuleUxContract`
- generated process flow uses `satisfies ProcessFlowDefinition`
- generated Process Flow page uses shared `ProcessFlowPage`
- generated landing/list/form pages use shared page patterns where expected
- generated output contains no fake metrics
- generated output contains no hidden `orgId`
- generated output contains no server-only client imports
- generated output preserves secure API routes
- generated output does not duplicate shared Business Objects
- `--dry-run` writes nothing
- no silent overwrite
- invalid module IDs still fail
- existing generator security tests remain passing

Use temporary directories.

Do not generate a real module under `src/modules`.

# Temporary Audit Generation

Run both:

```bash
npm run module:create -- ux-audit-module --dry-run --output /tmp/onedayos-generator-ux-dry-run
npm run module:create -- ux-audit-module --output /tmp/onedayos-generator-ux-audit
```

Verify:

- dry run writes nothing
- real temp output contains all required UX files
- generated files compile or pass source-contract checks as designed
- no live repo module is created

Inspect every new UX-related generated file.

# Implementation Note

Create:

```text
docs/engineering-manual/09-cli-generators/IMPLEMENTATION-NOTE-generator-ux-enforcement-package.md
```

Include:

- generated files added
- page patterns used
- placeholder policy
- Process Flow policy
- UX conformance status policy
- manifest metadata decision
- check-generated changes
- explicit non-goals
- Inventory retrofit remains pending
- `check:ux` remains pending
- accessibility tooling remains pending
- theme functionality remains pending

# Forbidden Changes

Do not modify:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/kernel/db/**`
- auth flows
- Inventory source/pages
- Organization pages
- Records pages
- demo provisioning
- `.env.local`
- deployment scripts
- shared UX Governance documents except the new implementation note
- package dependencies

Do not run migrations.

Do not run demo provisioning.

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
npm run module:create -- ux-audit-module --dry-run --output /tmp/onedayos-generator-ux-dry-run
npm run module:create -- ux-audit-module --output /tmp/onedayos-generator-ux-audit
npm audit --audit-level=moderate
git diff --check
git status --short
```

Do not run:

```bash
npm audit fix --force
```

If the sandbox server is already running, do not unnecessarily restart it.

No browser smoke test is required because live Inventory/Organization/Records pages must not change in this package.

# Final Report Required

Report:

1. Generator UX Enforcement Package summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Generated UX files added.
6. Generated page-pattern usage.
7. Generated Process Flow behavior.
8. Generated UX conformance template behavior.
9. Manifest metadata decision.
10. `check-generated` changes.
11. Architecture-check changes, if any.
12. Tests added or strengthened.
13. Updated test count.
14. Temporary generation paths and inspection result.
15. Exact verification commands and results.
16. npm audit result.
17. Git diff/status observations.
18. Any deviations from frozen UX governance.
19. Any unresolved generator ergonomics or over-abstraction risks.
20. Confirmation that no Prisma, migrations, dependencies, Inventory, Organization, Records, themes, accessibility tooling, or new-module implementation changes were made.
21. Whether Generator UX Enforcement Package 3 is complete.
22. Whether Inventory UX Conformance Retrofit Package remains blocked pending Founder approval.

Stop after this package.

Do not proceed to Inventory retrofit, `check:ux`, accessibility tooling, themes, Organization/Records retrofit, or new modules without Founder approval.
