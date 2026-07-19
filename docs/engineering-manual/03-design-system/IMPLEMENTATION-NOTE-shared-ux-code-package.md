# Implementation Note — Shared UX Code Package

Status: Implemented  
Date: 2026-07-18  
Scope: Shared UX types and composition-first page-pattern components

---

# Files Implemented

```text
src/sdk/ux-types.ts
src/components/onedayos/patterns/app-page.tsx
src/components/onedayos/patterns/dashboard-page.tsx
src/components/onedayos/patterns/list-page.tsx
src/components/onedayos/patterns/detail-page.tsx
src/components/onedayos/patterns/form-page.tsx
src/components/onedayos/patterns/settings-page.tsx
src/components/onedayos/patterns/process-flow-page.tsx
src/components/onedayos/patterns/page-states.tsx
src/components/onedayos/patterns/index.ts
src/components/onedayos/patterns/__tests__/page-patterns.test.tsx
src/components/onedayos/patterns/__tests__/process-flow-page.test.tsx
```

Exports were added through:

```text
src/sdk/index.ts
src/components/onedayos/index.ts
```

`src/components/ui/surface.tsx` was extended in a backward-compatible way so surfaces can receive semantic HTML attributes such as `aria-label`.

---

# Pattern APIs Implemented

- `AppPage`: breadcrumb, title, description, primary action, secondary actions, contextual help, content width, children.
- `DashboardPage`: explicit metric slot, primary content, secondary/recent content.
- `ListPage`: toolbar, content, pagination slot, and explicit ready/loading/empty/filtered-empty/error states.
- `DetailPage`: summary, sections, metadata, and actions.
- `FormPage`: form content, form-level error, pending affordance, cancel action, footer/action slot.
- `SettingsPage`: settings sections, optional section navigation, save state, and error state.
- `ProcessFlowPage`: renders `ProcessFlowDefinition` with accessible ordered steps, inputs, outputs, warnings, ownership boundaries, current boundaries, and future integrations.
- `page-states.tsx`: wraps existing OneDayOS empty, filtered-empty, loading, error, permission denied, and module unavailable primitives.

The APIs are composition-first. Callers pass explicit React content. The pattern library does not infer fields, fetch data, submit forms, resolve permissions, or generate CRUD.

---

# Explicit Non-Goals

This package did not implement:

- module generator changes
- Inventory retrofit
- Organization or Records retrofit
- accessibility tooling
- `check:ux`
- `test:a11y`
- theme functionality
- Dynamic Forms
- Dynamic CRUD
- metadata-driven page builder
- Platform Services
- runtime AI
- FastAPI
- Prisma or migration changes

---

# Known Follow-Up Packages

1. Generator UX Enforcement Package.
2. Inventory UX Contract and Process Flow retrofit.
3. Accessibility tooling package.
4. `check:ux` implementation package.
5. Organization and Records UX retrofit.

