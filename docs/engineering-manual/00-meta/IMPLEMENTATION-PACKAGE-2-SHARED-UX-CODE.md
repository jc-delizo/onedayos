# OneDayOS Implementation Package 2 — Shared UX Code

Status: Prepared  
Implementation Approval: Requires explicit Founder approval.

---

# Goal

Implement reusable shared-safe UX types and reusable OneDayOS page-pattern components.

This package prepares the next implementation step after UX Governance freeze. It does not authorize implementation by itself.

---

# Allowed Scope

The future package may create:

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

The future package may update:

```text
src/sdk/index.ts
src/components/onedayos/index.ts
```

---

# Forbidden Scope

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

---

# Required Tests

The future package must test:

- page header structure
- page pattern composition
- contextual loading states
- Process Flow renderer
- accessibility semantics
- no hidden `orgId`
- no server-only imports in client components

---

# Required Verification

The future package must run:

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

---

# Implementation Boundary

This document is preparation only. It does not authorize application code changes.

Implementation Approval: Requires explicit Founder approval.

