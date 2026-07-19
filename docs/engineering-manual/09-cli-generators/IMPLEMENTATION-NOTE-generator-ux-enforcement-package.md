# Generator UX Enforcement Package Implementation Note

Status: Implemented  
Date: 2026-07-18  
Scope: Module generator UX contract, Process Flow, page-pattern, and conformance scaffolding

---

# Generated Files Added

Future `module:create` output now includes:

```text
src/modules/[module]/
  ux.ts
  process-flow.ts
  UX-CONFORMANCE.md
  __tests__/
    ux.test.ts
    process-flow.test.ts

src/app/[orgSlug]/[module]/
  loading.tsx
  error.tsx
  process-flow/
    page.tsx
    loading.tsx
```

The generator keeps the existing secure manifest, permissions, schema, service, API route, settings, navigation, docs, README, and safety-test scaffold.

# Page Patterns Used

Generated pages now use shared OneDayOS page patterns:

- Module landing pages use `DashboardPage` and an honest draft empty state.
- Draft list scaffolds use `ListPage` and `DataTable`.
- Process Flow pages use `ProcessFlowPage`.
- Loading states use contextual `DashboardPageLoadingState` and `ProcessFlowLoadingState`.
- Error states use `SafePageErrorState`.

The generator does not create fake dashboard metrics, fake charts, duplicate module navbars, or production-looking placeholder records.

# Placeholder Policy

Generated UX values are intentionally marked with `TODO(UX)`.

These placeholders are allowed in generated scaffolds so the scaffold compiles, but they are not approved product behavior. They must be resolved from the approved module specification before module implementation begins.

Future `check:ux` work may reject unresolved `TODO(UX)` placeholders in official modules after the relevant retrofit package is approved.

# Process Flow Policy

Every generated module gets a declarative `process-flow.ts` and a Process Flow route.

The generated Process Flow:

- is explanatory only
- performs no API calls
- performs no mutations
- imports no server-only code
- imports no Prisma code
- does not implement Workflow Engine, Dynamic Forms, Platform Services, runtime AI, notifications, or background jobs

# UX Conformance Status Policy

Generated `UX-CONFORMANCE.md` starts as:

```text
Status: Not Reviewed
Approval Result: Not Approved
```

The scaffold does not claim ISO certification, WCAG certification, usability approval, accessibility approval, or demo readiness. Human review evidence must be added before a module can be called UX-conformant.

# Manifest Metadata Decision

No new `ux` field was added to the module manifest in this package.

The existing manifest route and navigation metadata can declare the Process Flow page without duplicating `processFlowRoute`. The detailed UX contract lives in `ux.ts`, where future UX-specific tooling can inspect it directly.

# Check-Generated Changes

`npm run check:generated` now verifies generated scaffolds include:

- `ux.ts`
- `process-flow.ts`
- `UX-CONFORMANCE.md`
- Process Flow route and loading state
- UX and Process Flow tests
- shared page-pattern usage
- contextual loading and safe error patterns
- no fake dashboard metrics
- existing generator security constraints

Draft `TODO(UX)` placeholders remain allowed for generated scaffolds.

# Explicit Non-Goals

This package did not implement:

- Inventory UX retrofit
- Organization or Records retrofit
- `check:ux`
- accessibility tooling
- `test:a11y`
- theme functionality
- Dynamic Forms
- Dynamic CRUD
- metadata-driven page building
- Platform Services
- runtime AI
- Prisma schema or migration changes
- package dependency changes

Inventory retrofit remains pending Founder approval.
