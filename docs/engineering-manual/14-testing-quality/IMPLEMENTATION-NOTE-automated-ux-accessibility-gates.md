# Automated UX and Accessibility Gates Implementation Note

Status: Implemented  
Date: 2026-07-18  
Scope: Package 5 automated UX structure checks, selected accessibility tests, package scripts, and CI gates

---

# Dependency Decision

This package adds one development dependency:

```text
axe-core@4.12.1
```

`axe-core` was chosen because it is the maintained accessibility analysis engine, has no React wrapper dependency surface, and works directly with the current Vitest, jsdom, React Testing Library, and React stack:

```text
React 19.2.7
Vitest 4.1.10
jsdom 29.1.1
@testing-library/react 16.3.2
@testing-library/jest-dom 6.9.1
@testing-library/user-event 14.6.1
```

No browser automation, Playwright, Cypress, Storybook, or accessibility wrapper package was added.

# `check:ux` Scope

`npm run check:ux` runs:

```text
tsx scripts/check-ux.ts
```

The checker discovers official modules from the static module composition root:

```text
src/modules/index.ts
```

It reads the registered manifest imports and does not scan arbitrary module folders, `/tmp` output, docs, or archive examples as official modules.

Current official module:

```text
inventory
```

The checker verifies official modules include:

```text
src/modules/[module]/ux.ts
src/modules/[module]/process-flow.ts
src/modules/[module]/UX-CONFORMANCE.md
src/modules/[module]/__tests__/ux.test.ts
src/modules/[module]/__tests__/process-flow.test.ts
src/app/[orgSlug]/[module]/process-flow/page.tsx
src/app/[orgSlug]/[module]/process-flow/loading.tsx
```

It also checks for unresolved generated UX placeholders, generator-default conformance status, missing Module UX Contract fields, missing Process Flow fields, generic final `Loading...` / `Error` text, fake dashboard metric placeholders, hidden `orgId` fields, client-side `orgId` JSON submission, client server-only imports, duplicate module content navbars where reliably detectable, and required shared Inventory page-pattern usage.

# Accessibility Helper

The test helper lives at:

```text
src/test/accessibility.ts
```

It exposes:

```ts
expectNoA11yViolations(container, options?)
getA11yViolations(container, options?)
```

Failure messages include axe rule IDs, impact, help URL, and affected node targets.

The helper disables axe-core's `color-contrast` rule in jsdom only because jsdom does not implement the canvas/layout behavior axe uses for that rule. Color contrast remains a browser/manual review requirement and is not considered automatically verified by `test:a11y`.

# Automated Accessibility Coverage

Accessibility tests currently cover:

```text
src/components/onedayos/patterns/__tests__/accessibility.test.tsx
src/modules/inventory/__tests__/accessibility.test.tsx
```

Covered surfaces:

- `AppPage`
- `DashboardPage`
- `ListPage`
- `FormPage`
- `SettingsPage`
- `ProcessFlowPage`
- empty, safe error, permission denied, and module unavailable states
- Inventory Process Flow
- representative Inventory Stock Levels table
- Inventory Stock Adjustment form

Server route pages with live auth/database dependencies are not rendered directly in these tests. Their presentational surfaces are tested through shared patterns and client components.

# CI Changes

CI now runs:

```text
npm run check:ux
npm run test:a11y
```

These run alongside existing env, Prisma, lint, typecheck, architecture, generated, test, and build gates.

# Limitations

Automated checks are not human usability validation.

The axe/jsdom tests can catch many structural accessibility failures, but they do not prove:

- full WCAG 2.2 Level AA conformance
- keyboard-only task completion
- screen-reader behavior in real browsers
- browser layout or responsive issues
- automated color-contrast verification in jsdom
- representative user comprehension
- production accessibility certification

Manual review remains required.

# Inventory Conformance Update

`src/modules/inventory/UX-CONFORMANCE.md` now records:

- automated structural UX checks
- selected automated accessibility tests
- shared UX pattern use
- Process Flow structure
- security/transaction audit evidence from prior passes
- iterative Founder visual review

It still records pending manual keyboard, screen-reader, browser-level, representative warehouse user, representative Org Admin, and formal WCAG conformance assessment work.

# Explicit Non-Goals

This package did not implement:

- theme functionality
- Organization or Records UX retrofit
- new modules
- Inventory business logic changes
- Prisma schema changes
- migrations
- browser automation
- custom accessibility engine
- Dynamic Forms
- Dynamic CRUD
- Platform Services
- runtime AI
- FastAPI
- public demo approval

# Follow-Up Packages

- Manual accessibility review.
- Representative-user walkthrough.
- Organization and Records UX retrofit.
- Theme/appearance package.
