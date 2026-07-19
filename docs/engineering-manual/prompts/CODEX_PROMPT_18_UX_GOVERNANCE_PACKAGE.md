# OneDayOS — UX Governance Package 1

You are implementing the first package of the OneDayOS reusable UX governance system.

This package is documentation and governance only.

Do not implement application code.

Do not modify React components.

Do not modify the SDK.

Do not modify the module generator.

Do not modify Inventory pages.

Do not install packages.

Do not modify Prisma.

Do not run migrations.

Do not add FastAPI.

Do not implement themes, accessibility tooling, automated axe scans, page-pattern components, or `check:ux` yet.

Those belong to later packages after this governance package is reviewed.

## Founder Approval

The Founder has approved the following direction:

OneDayOS will use:

- Human-centred design aligned with ISO 9241-210:2019
- Interaction principles aligned with ISO 9241-110:2020
- Usability review using Nielsen’s 10 Usability Heuristics
- Accessibility targeting WCAG 2.2 Level AA
- OneDayOS-specific principles that make business software understandable, consistent, efficient, and reusable

Important language rules:

- Say “aligned with ISO 9241-210” and “aligned with ISO 9241-110.”
- Say “targets WCAG 2.2 Level AA.”
- Do not claim ISO certification.
- Do not claim formal WCAG conformance or certification.
- Do not reproduce copyrighted ISO standard text verbatim.
- Translate the standards into original OneDayOS requirements.

## Goal

Create the permanent governance documents that future modules, generators, page patterns, tests, and reviews will follow.

This package must define:

1. The OneDayOS UX Constitution
2. Standard page patterns
3. The required Module UX Contract
4. The usability review checklist
5. The module UX review scorecard
6. UX conformance testing requirements
7. The ADR recording the standards decision
8. Manual amendments connecting the new UX governance to existing architecture, module, generator, and CI documents

## Source Documents to Inspect

Before editing, inspect:

- docs/engineering-manual/00-meta/00-roadmap.md
- docs/engineering-manual/00-meta/01-manual-governance.md
- docs/engineering-manual/00-meta/02-architecture-decision-records.md
- docs/engineering-manual/00-meta/04-definition-of-done.md

- docs/engineering-manual/03-design-system/00-design-vision.md
- docs/engineering-manual/03-design-system/02-layout-system.md
- docs/engineering-manual/03-design-system/08-accessibility-standards.md

- docs/engineering-manual/08-module-system/01-module-manifest.md
- docs/engineering-manual/08-module-system/03-module-folder-contract.md
- docs/engineering-manual/08-module-system/09-module-testing.md

- docs/engineering-manual/09-cli-generators/01-module-generator.md
- docs/engineering-manual/09-cli-generators/05-test-generator.md
- docs/engineering-manual/09-cli-generators/06-generator-safety-rails.md

- docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md

- docs/engineering-manual/17-module-specifications/00-module-spec-template.md
- docs/engineering-manual/17-module-specifications/01-inventory-module.md

Also inspect existing design implementation notes under:

- docs/engineering-manual/03-design-system/

Do not edit archived documents.

## Files to Create

Create:

```text
docs/engineering-manual/00-meta/adrs/
  ADR-0011-human-centred-ux-standard.md

docs/engineering-manual/03-design-system/
  09-ux-constitution.md
  10-page-patterns.md
  11-module-ux-contract.md
  12-usability-review-checklist.md

docs/engineering-manual/03-design-system/templates/
  module-ux-review.md

docs/engineering-manual/14-testing-quality/
  09-ux-conformance-testing.md
```

## Files to Update

Update only as needed:

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

Do not edit unrelated documents.

## Status Rules

For newly created UX governance documents:

```text
Status: Draft for Founder Review
Implementation Allowed: No — governance must be reviewed and frozen first
```

For ADR-0011:

```text
Status: Accepted
Date: 2026-07
```

The ADR records the approved direction.

The detailed governance documents remain drafts until the Founder reviews them.

Do not mark the new documents Frozen in this pass.

When updating existing frozen documents:

- Preserve their current status.
- Add narrowly scoped cross-references and requirements.
- Do not rewrite unrelated sections.
- Note the ADR/manual amendment where appropriate.

## ADR-0011 Requirements

Create:

```text
docs/engineering-manual/00-meta/adrs/ADR-0011-human-centred-ux-standard.md
```

Include:

- Status
- Date
- Context
- Decision
- Standards and Frameworks
- OneDayOS Interpretation
- Alternatives Considered
- Consequences
- Non-Claims
- Manual References
- Implementation Sequence

The Decision must state:

```text
OneDayOS will use a human-centred design process aligned with ISO 9241-210:2019, interaction principles aligned with ISO 9241-110:2020, usability evaluation using Nielsen’s heuristics, and accessibility targeting WCAG 2.2 Level AA.
```

The ADR must make clear:

- These standards guide process and evaluation.
- They do not replace the OneDayOS design language.
- They do not imply certification.
- Reusable components, generator output, tests, and human reviews must encode the requirements.
- Every official business module must include a Module UX Contract and Process Flow page unless an approved ADR grants an exception.

## 09-ux-constitution.md Requirements

Create a concise but implementation-grade UX Constitution.

Required principles:

1. Match the user’s real task and work environment.
2. The UI must teach the business process.
3. The user must always know what organization and app they are using.
4. The user must always understand the next meaningful action.
5. Prevent expensive mistakes before reporting them.
6. Prefer recognition over recall.
7. Preserve user control, cancellation, recovery, and safe back-navigation.
8. Keep shared Business Object ownership visually clear.
9. Show only apps, records, and actions relevant to the current role and task.
10. Use one consistent shell, page, form, table, loading, empty, error, and permission pattern.
11. Accessibility is a baseline, not a separate mode.
12. Frequent users must be able to work efficiently.
13. Motion must communicate state, not decorate.
14. Errors must explain what happened and how to recover.
15. Every serious usability finding must become a reusable pattern, generator improvement, test, or manual amendment.

Define a required UX hierarchy:

```text
Organization Workspace
→ App Launcher
→ Current App
→ App Sidebar
→ Page Header
→ Task Content
```

Define the relationship:

```text
Architecture decides ownership.
UX decides relevance and presentation.
```

Examples:

- Employee remains a shared Business Object but appears under Organization → People for the current MVP.
- Product remains a shared Business Object but appears as a related record inside Inventory.
- Records are shared data surfaces, not apps.

Include a section called:

```text
The UI Must Teach the Business
```

Require every official business module to explain:

- what the module owns
- what it does not own
- normal workflow
- inputs
- outputs
- important error prevention
- future integrations
- current MVP boundaries

## 10-page-patterns.md Requirements

Define the standard OneDayOS page patterns:

- App Launcher Page
- Dashboard Page
- List Page
- Detail Page
- Form Page
- Settings Page
- Process Flow Page
- Permission Denied Page
- Module Unavailable Page
- Loading, Empty, Filtered Empty, and Error States

For every pattern include:

- Purpose
- Required structure
- Required states
- Accessibility expectations
- Forbidden patterns
- Example uses

Examples of forbidden patterns:

- fake dashboard metrics
- generic final `Loading...`
- generic final `Error`
- a module-specific navbar replacing the persistent sidebar
- every detail value rendered as a disabled input
- hidden `orgId`
- raw provider errors
- page-specific spacing invented without design-system reason

Define the standard page header:

- breadcrumb
- title
- description
- primary action
- contextual help where required

Define contextual loading requirements:

- dashboard-shaped skeleton
- table-shaped skeleton
- form-shaped skeleton
- settings-shaped skeleton
- process-flow-shaped skeleton

## 11-module-ux-contract.md Requirements

Define a mandatory Module UX Contract for every official business module.

Required fields:

```text
Primary Users
User Goals
Primary Tasks
Task Frequency
Work Environment
Required Knowledge
Related Business Objects
Module-Owned Records
Critical Errors to Prevent
Permission Roles
App Navigation
Page Map
Default Landing Page
Process Flow
Loading States
Empty States
Error and Recovery States
Permission-Denied States
Module-Unavailable State
Keyboard Workflows
Accessibility Requirements
Usability Test Scenarios
Known MVP Limitations
Future Integrations
```

Define an example Inventory UX Contract including:

- Primary users: warehouse staff, inventory supervisor, Org Admin
- Tasks: check stock, identify low stock, post adjustments, review movements
- Critical errors: wrong warehouse, cross-tenant Product/Warehouse, negative stock, partial posting
- Related Business Objects: Product, ProductCategory, Supplier, Warehouse
- Module-owned records: InventoryProductExtension, StockBalance, StockMovement, StockAdjustment
- Default landing page: Inventory Dashboard
- Process Flow route: `/[orgSlug]/inventory/process-flow`

Require that the Module UX Contract is completed before coding begins.

## 12-usability-review-checklist.md Requirements

Create a reusable human-review checklist organized by:

- Human-centred task fit
- Self-descriptiveness
- User expectations and consistency
- Learnability
- User control and recovery
- Error tolerance and prevention
- Recognition over recall
- Efficiency for frequent users
- Visual focus and hierarchy
- Navigation and location awareness
- Shared-record ownership clarity
- Process teaching
- Accessibility
- Responsive behavior
- Role relevance
- Tenant and permission clarity

Include review questions such as:

- Can the user explain where they are?
- Can the user identify the primary action?
- Can the user recover from a mistake?
- Can the user complete the task without remembering hidden system rules?
- Are dangerous actions prevented or clearly confirmed?
- Does the page expose irrelevant records or apps?
- Does a shared record incorrectly appear module-owned?
- Does the page teach what happens next?
- Can a keyboard-only user complete the task?
- Are loading, empty, error, denied, and unavailable states distinguishable?

Include a required issue classification:

- Blocker
- Must Fix
- Polish
- Question / Product Decision
- Deferred with reason

## module-ux-review.md Requirements

Create a scorecard template.

Use a 0–2 scale:

- 0 = unacceptable / absent
- 1 = partial / inconsistent
- 2 = meets OneDayOS standard

Required categories:

- Task fit
- Self-description
- Consistency
- User control
- Error prevention
- Error recovery
- Learnability
- Recognition over recall
- Efficiency
- Accessibility
- Process teaching
- Navigation clarity
- Shared-record ownership clarity
- Permission/role relevance
- Visual focus

Release rule:

- No category may score 0.
- Critical categories must score 2:
  - task fit
  - error prevention
  - accessibility
  - tenant/permission clarity
- Any exception requires Founder approval and a documented reason.

Include:

- Module
- Version
- Reviewer
- Date
- Users represented
- Tasks tested
- Findings
- Resolutions
- Deferred issues
- Approval result

## 09-ux-conformance-testing.md Requirements

Define three layers:

### Automated structural checks

Future `check:ux` should validate, where feasible:

- official module has `ux.ts`
- official module has `process-flow.ts`
- official module has `UX-CONFORMANCE.md`
- official module has Process Flow route
- no duplicate module navbar replaces the shell
- no generic final loading/error placeholders
- no hidden `orgId`
- no fake generated dashboard metrics
- no client component server-only imports
- accessible labels for detectable icon-only buttons

State clearly that scripts cannot prove usability.

### Automated accessibility tests

Define future axe-compatible tests for:

- Login
- Register
- App Launcher
- Inventory Dashboard
- Process Flow
- Stock Levels
- New Stock Adjustment
- Organization People

Do not mandate a specific dependency in this documentation package.

Require dependency compatibility review before installation.

### Manual reviews

Require:

- keyboard-only walkthrough
- visible focus review
- contrast review
- zoom/reflow review
- screen-reader spot check
- error comprehension review
- task-based representative-user testing

For early official modules require at minimum:

- Founder walkthrough
- one representative Org Admin
- one representative operational user

Do not claim formal WCAG conformance based only on automated tests.

## Existing Document Amendments

### 00-roadmap.md

Register:

- 03-design-system/09-ux-constitution.md
- 03-design-system/10-page-patterns.md
- 03-design-system/11-module-ux-contract.md
- 03-design-system/12-usability-review-checklist.md
- 14-testing-quality/09-ux-conformance-testing.md
- ADR-0011

Add the future implementation sequence:

1. UX Governance
2. Shared Page Patterns
3. Generator UX Contract
4. Inventory UX Conformance
5. CI + Accessibility Gates
6. Organization and Records retrofit

### 04-definition-of-done.md

Add mandatory UX completion requirements:

- UX Contract completed
- Primary users/tasks documented
- Process Flow page implemented
- Shared-record ownership is clear
- Navigation follows the app shell
- Contextual loading/empty/error/denied/unavailable states exist
- Critical errors are prevented
- Keyboard journey reviewed
- Automated accessibility checks pass when available
- Manual accessibility review completed
- Heuristic/usability review completed
- Representative-user walkthrough completed
- Findings resolved or explicitly deferred

### 00-design-vision.md

Reference the UX Constitution as the higher-level usability authority.

Add:

```text
Visual polish is not sufficient. OneDayOS pages must match real business tasks, prevent expensive mistakes, and teach the business process.
```

### 02-layout-system.md

Reference the standard Page Patterns document.

Clarify:

- persistent shell is primary navigation
- content navbars must not duplicate sidebar navigation
- page headers follow the shared pattern
- loading states are contextual

### 08-accessibility-standards.md

Reference:

- WCAG 2.2 AA target
- automated checks plus manual evaluation
- UX conformance testing document
- no formal compliance claim without actual evaluation

### 01-module-manifest.md

Add only minimal declarative UX metadata if useful.

Preferred optional shape:

```ts
ux?: {
  processFlowRoute: string
}
```

Do not add executable UX logic.

Do not add user research data to the manifest.

If the existing manifest already has an appropriate route declaration, a new UX field may be unnecessary. Report the decision.

### 03-module-folder-contract.md

Require future official modules to include:

```text
ux.ts
process-flow.ts
UX-CONFORMANCE.md
```

### 09-module-testing.md

Require:

- UX contract tests
- Process Flow tests
- accessibility tests when tooling exists
- task-based manual review
- no fake dashboard metrics
- contextual loading/error states

### 01-module-generator.md

Specify that future generator output must include:

```text
src/modules/[module]/
  ux.ts
  process-flow.ts
  UX-CONFORMANCE.md

src/app/[orgSlug]/[module]/
  process-flow/page.tsx
```

Do not implement the generator changes in this package.

### 05-test-generator.md

Require future generated tests for:

- UX contract completeness
- Process Flow content
- contextual page states
- accessibility structure
- navigation shell usage

### 06-generator-safety-rails.md

Add future safety rules:

- no generic fake dashboard cards
- no missing UX contract
- no missing Process Flow
- no module-specific navbar replacing app shell
- no final generic loading/error placeholders

### 08-ci-quality-gates.md

Register future commands:

```text
npm run check:ux
npm run test:a11y
```

Mark them as planned until implemented in later packages.

Do not add package scripts in this governance package.

### 00-module-spec-template.md

Add the complete mandatory `UX Contract` section from the new Module UX Contract document.

## Inventory Reference

Do not change Inventory code in this package.

Use Inventory only as an example in the governance documents.

Document that Inventory will become the first reference conformance implementation in a later package.

The later Inventory conformance package will create:

```text
src/modules/inventory/ux.ts
src/modules/inventory/process-flow.ts
src/modules/inventory/UX-CONFORMANCE.md
```

Do not create these source files now.

## Verification

Run documentation-only verification:

```bash
find docs/engineering-manual/03-design-system -maxdepth 2 -type f | sort
find docs/engineering-manual/14-testing-quality -maxdepth 1 -type f | sort
find docs/engineering-manual/00-meta/adrs -maxdepth 1 -type f | sort
git diff --check
git status --short
```

Search for accidental overclaims:

```bash
rg -n "ISO certified|ISO-certified|WCAG compliant|fully compliant|certified accessible" docs/engineering-manual
```

Any such phrase must either be removed or clearly identified as a prohibited public claim.

Search for the required language:

```bash
rg -n "aligned with ISO 9241-210|aligned with ISO 9241-110|targets WCAG 2.2" docs/engineering-manual
```

Do not run npm install, npm build, tests, Prisma commands, or migrations. No code changes are allowed in this package.

## Final Report Required

Report:

1. Governance summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. ADR-0011 summary.
6. UX Constitution summary.
7. Page Patterns summary.
8. Module UX Contract summary.
9. Usability checklist summary.
10. UX review scorecard summary.
11. UX conformance testing summary.
12. Existing manual amendments made.
13. Any conflicts found.
14. Any wording intentionally deferred for Founder review.
15. Exact verification commands and results.
16. Confirmation that no application code, package, Prisma, migration, or dependency changes were made.
17. Whether the UX Governance Package is ready for Founder review.
18. Whether Shared UX Code Package implementation remains blocked until Founder approval.

Stop after this package.

Do not implement shared page-pattern code, generator changes, Inventory retrofit, accessibility dependencies, themes, or new modules without Founder approval.
