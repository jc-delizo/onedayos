# OneDayOS — UX Governance Review, Consistency Audit, and Freeze Pass

You completed the UX Governance Package as a documentation-only pass.

The Founder has already approved the governing direction:

- human-centred design aligned with ISO 9241-210:2019
- interaction principles aligned with ISO 9241-110:2020
- usability review using Nielsen’s 10 Usability Heuristics
- accessibility targeting WCAG 2.2 Level AA
- reusable UX contracts, page patterns, Process Flow pages, tests, and human review for future modules

This task is the formal review, consistency audit, and freeze pass for that governance package.

Do not implement application code.

Do not modify React components.

Do not modify the SDK.

Do not modify the module generator.

Do not modify Inventory source code.

Do not install packages.

Do not modify Prisma.

Do not run migrations.

Do not add `check:ux`, `test:a11y`, axe, themes, or page-pattern code yet.

This task is documentation governance only.

## Goal

Verify that the new UX governance documents are internally consistent, compatible with the existing Engineering Manual, precise enough to guide implementation, and free from unsupported certification claims.

If no unresolved conflicts remain, freeze the UX governance documents and prepare the next implementation package:

```text
Shared UX Types and Page-Pattern Components
```

Do not implement that package in this pass.

## Files to Inspect

Inspect the new documents:

```text
docs/engineering-manual/00-meta/adrs/ADR-0011-human-centred-ux-standard.md

docs/engineering-manual/03-design-system/09-ux-constitution.md
docs/engineering-manual/03-design-system/10-page-patterns.md
docs/engineering-manual/03-design-system/11-module-ux-contract.md
docs/engineering-manual/03-design-system/12-usability-review-checklist.md
docs/engineering-manual/03-design-system/templates/module-ux-review.md

docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md
```

Inspect the amended documents:

```text
docs/engineering-manual/00-meta/00-roadmap.md
docs/engineering-manual/00-meta/04-definition-of-done.md

docs/engineering-manual/03-design-system/00-design-vision.md
docs/engineering-manual/03-design-system/02-layout-system.md
docs/engineering-manual/03-design-system/08-accessibility-standards.md

docs/engineering-manual/08-module-system/01-module-manifest.md
docs/engineering-manual/08-module-system/03-module-folder-contract.md
docs/engineering-manual/08-module-system/09-module-testing.md

docs/engineering-manual/09-cli-generators/01-module-generator.md
docs/engineering-manual/09-cli-generators/05-test-generator.md
docs/engineering-manual/09-cli-generators/06-generator-safety-rails.md

docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md

docs/engineering-manual/17-module-specifications/00-module-spec-template.md
```

Also inspect these authoritative documents for consistency:

```text
docs/engineering-manual/00-meta/01-manual-governance.md
docs/engineering-manual/00-meta/02-architecture-decision-records.md
docs/engineering-manual/00-meta/03-claude-workflow.md

docs/engineering-manual/01-foundation/02-product-principles.md
docs/engineering-manual/01-foundation/03-platform-vs-modules.md

docs/engineering-manual/03-design-system/03-component-standards.md
docs/engineering-manual/03-design-system/04-table-standards.md
docs/engineering-manual/03-design-system/05-form-standards.md
docs/engineering-manual/03-design-system/06-empty-loading-error-states.md
docs/engineering-manual/03-design-system/07-interaction-motion-standards.md

docs/engineering-manual/08-module-system/00-module-philosophy.md
docs/engineering-manual/08-module-system/05-module-navigation.md

docs/engineering-manual/17-module-specifications/01-inventory-module.md
```

Do not inspect or modify archived documents except to confirm they remain archived.

## Review Areas

### 1. Standards language

Verify the documents use accurate, restrained language:

Required language:

```text
aligned with ISO 9241-210
aligned with ISO 9241-110
targets WCAG 2.2 Level AA
reviewed using Nielsen’s usability heuristics
```

Forbidden public claims unless a future formal evaluation supports them:

```text
ISO certified
ISO-certified
WCAG certified
fully WCAG compliant
formally accessible
certified accessible
guaranteed compliant
```

If prohibited wording appears as an example of what must not be claimed, that is acceptable only when clearly marked as prohibited.

Do not reproduce copyrighted ISO clauses verbatim.

### 2. UX Constitution consistency

Verify the UX Constitution clearly requires:

- real task and work-environment fit
- process teaching
- organization and app awareness
- clear next action
- error prevention
- recognition over recall
- user control and recovery
- shared Business Object ownership clarity
- role/task relevance
- consistent shell/page/form/table/state patterns
- accessibility baseline
- efficiency for frequent users
- functional motion only
- actionable errors
- reusable improvement after usability findings

Verify the hierarchy is consistent:

```text
Organization Workspace
→ App Launcher
→ Current App
→ App Sidebar
→ Page Header
→ Task Content
```

Verify it distinguishes:

```text
Architecture decides ownership.
UX decides relevance and presentation.
```

### 3. Current OneDayOS IA consistency

Verify the new governance does not regress current approved decisions:

- Organization is a built-in admin app.
- Inventory is a business app/module.
- Records are shared data surfaces, not apps.
- Employee remains a shared Business Object but currently appears through Organization → People.
- Product, ProductCategory, Supplier, and Warehouse remain shared Business Objects related to Inventory.
- Customers are not forced into the Inventory sidebar.
- Persistent sidebar/app shell is primary navigation.
- Content navbars must not duplicate sidebar navigation.
- App launcher is the post-login landing page.
- Process Flow is explanatory, not a workflow engine.

### 4. Page Patterns completeness

Verify every page pattern defines:

- purpose
- required structure
- required states
- accessibility expectations
- forbidden patterns
- example uses

Verify the patterns cover:

- App Launcher
- Dashboard
- List
- Detail
- Form
- Settings
- Process Flow
- Permission Denied
- Module Unavailable
- Loading
- Empty
- Filtered Empty
- Error

Verify the shared page header includes:

- breadcrumb
- title
- description
- primary action where applicable
- contextual help where necessary

Verify contextual skeleton expectations are explicit.

### 5. Module UX Contract completeness

Verify the Module UX Contract requires:

- Primary Users
- User Goals
- Primary Tasks
- Task Frequency
- Work Environment
- Required Knowledge
- Related Business Objects
- Module-Owned Records
- Critical Errors to Prevent
- Permission Roles
- App Navigation
- Page Map
- Default Landing Page
- Process Flow
- Loading States
- Empty States
- Error and Recovery States
- Permission-Denied State
- Module-Unavailable State
- Keyboard Workflows
- Accessibility Requirements
- Usability Test Scenarios
- Known MVP Limitations
- Future Integrations

Verify it must be completed before module implementation begins.

Verify Inventory is used only as an example and remains consistent with the current Inventory specification.

### 6. Process Flow requirement

Verify every official business module is required to include:

- a declarative Process Flow definition
- a Process Flow page
- what the module owns
- what it does not own
- normal workflow
- inputs
- outputs
- critical error prevention
- current MVP boundaries
- future integrations

Allow an exception only through Founder-approved ADR/manual amendment.

Clarify that Process Flow does not imply:

- Workflow Engine
- automation engine
- Approval Service
- Dynamic Forms
- background jobs
- AI orchestration

### 7. Human review and scorecard

Verify the usability checklist and scorecard are practical.

Required score scale:

```text
0 = unacceptable / absent
1 = partial / inconsistent
2 = meets OneDayOS standard
```

Required release rule:

- no category may score 0
- critical categories must score 2:
  - task fit
  - error prevention
  - accessibility
  - tenant/permission clarity
- exceptions require Founder approval and a documented reason

Verify issue classifications include:

- Blocker
- Must Fix
- Polish
- Question / Product Decision
- Deferred with reason

### 8. UX conformance testing boundaries

Verify the testing document clearly separates:

1. automated structural checks
2. automated accessibility checks
3. manual accessibility review
4. task-based representative-user review

Verify it states:

- automation cannot prove usability
- automated accessibility tools cannot prove full WCAG conformance
- manual evaluation remains necessary
- dependencies must be reviewed before installation
- no specific axe dependency is mandated yet
- future commands are planned, not currently implemented

Required future commands:

```text
npm run check:ux
npm run test:a11y
```

These must be marked as planned until later implementation packages create them.

### 9. Existing manual amendment audit

Verify the amendments are narrow and do not create contradictions.

Especially verify:

- Definition of Done now requires UX evidence.
- Module folder contract requires `ux.ts`, `process-flow.ts`, and `UX-CONFORMANCE.md` for future official modules.
- Generator docs specify future output but do not falsely claim the generator already emits it.
- CI docs list `check:ux` and `test:a11y` as planned.
- Module specification template includes the full UX Contract.
- Module manifest remains declarative.
- No executable UX behavior was added to manifest requirements.
- Inventory source code is not falsely described as already conformant to the new contract.

### 10. Scope and overengineering audit

Verify the governance does not require premature implementation of:

- full user research department/process
- formal ISO certification
- formal WCAG certification
- expensive enterprise usability tooling
- a no-code page builder
- Dynamic Forms
- Dynamic CRUD
- Workflow Engine
- runtime AI
- automatic design generation
- a new Platform Service

The governance should be rigorous but commercially realistic for OneDayOS.

The minimum early representative review should remain:

- Founder walkthrough
- one representative Org Admin
- one representative operational user

### 11. Inventory future conformance boundary

Verify documents clearly state:

- Inventory is the first reference conformance implementation.
- Inventory code is not modified in this governance package.
- Later Inventory conformance work will create:

```text
src/modules/inventory/ux.ts
src/modules/inventory/process-flow.ts
src/modules/inventory/UX-CONFORMANCE.md
```

- Later page-pattern refactoring does not change Inventory data architecture or stock logic.

## Allowed Documentation Fixes

You may fix:

- contradictions
- ambiguous language
- missing cross-references
- incorrect status metadata
- unsupported compliance/certification wording
- inconsistent terminology
- missing Process Flow boundaries
- planned-vs-implemented ambiguity
- roadmap registration gaps
- Definition of Done gaps
- module-template UX Contract gaps

Do not invent new architecture.

Do not expand implementation scope.

## Freeze Rules

If no unresolved conflicts remain, update the new UX governance documents to:

```text
Status: Frozen
Implementation Allowed: Governance authority — implementation requires an approved package
```

For the template file:

```text
Status: Frozen
Implementation Allowed: Template authority
```

Keep ADR-0011:

```text
Status: Accepted
```

Do not mark future code implementation as generally approved.

Record the freeze in:

```text
docs/engineering-manual/00-meta/UX-GOVERNANCE-FREEZE-REPORT.md
```

## Freeze Report Requirements

Create:

```text
docs/engineering-manual/00-meta/UX-GOVERNANCE-FREEZE-REPORT.md
```

Include:

- Date
- Scope
- Files inspected
- Files changed
- Standards-language audit
- IA consistency result
- Page Patterns result
- Module UX Contract result
- Process Flow result
- Human-review result
- UX conformance-testing result
- Existing-manual amendment result
- Overengineering/commercial-viability result
- Conflicts found and resolved
- Unresolved conflicts
- Documents frozen
- Implementation still deferred
- Recommended next package

Recommended next package:

```text
Shared UX Types and Page-Pattern Components
```

## Prepare Next Implementation Package

Create:

```text
docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-2-SHARED-UX-CODE.md
```

This document must prepare, but not authorize by itself, the next package.

Include:

### Goal

Implement reusable shared-safe UX types and reusable OneDayOS page-pattern components.

### Allowed Scope

Future package may create:

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
```

Future package may update:

```text
src/sdk/index.ts
src/components/onedayos/index.ts
```

### Forbidden Scope

The next package must not yet:

- modify the module generator
- retrofit Inventory pages
- install accessibility dependencies
- add `check:ux`
- add `test:a11y`
- modify Prisma
- add migrations
- implement themes
- add new modules
- implement Platform Services
- implement Dynamic Systems
- add FastAPI

### Required Tests

Future package must test:

- page header structure
- page pattern composition
- contextual loading states
- Process Flow renderer
- accessibility semantics
- no hidden `orgId`
- no server-only imports in client components

### Required Verification

Future package must run:

```text
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
```

State clearly:

```text
Implementation Approval: Requires explicit Founder approval.
```

Do not implement the package in this pass.

## Documentation Verification Commands

Run:

```bash
find docs/engineering-manual/03-design-system -maxdepth 2 -type f | sort
find docs/engineering-manual/14-testing-quality -maxdepth 1 -type f | sort
find docs/engineering-manual/00-meta/adrs -maxdepth 1 -type f | sort

rg -n "ISO certified|ISO-certified|WCAG certified|fully WCAG compliant|certified accessible|guaranteed compliant" docs/engineering-manual
rg -n "aligned with ISO 9241-210|aligned with ISO 9241-110|targets WCAG 2.2 Level AA" docs/engineering-manual

rg -n "check:ux|test:a11y" docs/engineering-manual
rg -n "ux\.ts|process-flow\.ts|UX-CONFORMANCE\.md" docs/engineering-manual

git diff --check
git status --short
```

Do not run:

- npm install
- npm build
- npm tests
- Prisma commands
- migrations

No application code changes are allowed.

## Final Report Required

Report:

1. Review summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Conflicts found.
6. Conflicts resolved.
7. Unresolved conflicts.
8. Standards-language audit result.
9. IA consistency result.
10. Page Patterns audit result.
11. Module UX Contract audit result.
12. Process Flow audit result.
13. Human-review/scorecard audit result.
14. UX conformance-testing audit result.
15. Overengineering/commercial-viability audit result.
16. Documents frozen.
17. Freeze report path.
18. Next implementation package path.
19. Exact verification commands and results.
20. Confirmation that no application code, packages, Prisma, migrations, or tests were changed/run.
21. Whether UX Governance is now frozen.
22. Whether Shared UX Code implementation remains blocked pending Founder approval.

Stop after this pass.

Do not implement Shared UX Code, generator changes, Inventory retrofit, accessibility tooling, themes, or new modules without Founder approval.
