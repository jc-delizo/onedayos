# Implementation Package V2-1 — Compact Header + Shared Records IA

Status: Ready for Explicit Founder Approval
Date: 2026-07
Implementation Allowed: Not yet; this handoff does not itself authorize code changes

## Objective

Deliver the first frozen Inventory Demo V2 package: denser semantic operational headers, a permission-aware Shared Records built-in app, Inventory-context shared-record access, and a safe Product Settings navigation migration.

## Authoritative Documents

- `00-meta/adrs/ADR-0014-compact-operational-page-header.md`
- `00-meta/adrs/ADR-0015-shared-records-built-in-app-context.md`
- `03-design-system/15-compact-operational-page-header.md`
- `08-module-system/10-contextual-shared-records.md`
- `INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md`
- `INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- Existing tenancy, PlatformContext, permissions, Business Object, app-shell, appearance, UX, testing, and production-readiness documents remain authoritative.

## Allowed Scope

- Add compact operational header mode.
- Preserve explanatory header mode for Process Flow, onboarding, app launcher, and complex concepts.
- Add Shared Records as a built-in app in the app switcher.
- Show Shared Records only when the user has at least one relevant shared-record read permission.
- Add the Shared Records sidebar: Products, Categories, Customers, Suppliers, and Warehouses.
- Keep People under Organization.
- Support direct Shared Records navigation.
- Preserve Inventory app context and sidebar when opening related shared records from Inventory.
- Reuse shared routes, services, APIs, and components; make shared ownership explicit.
- Remove Product Settings from top-level Inventory navigation.
- Preserve Inventory-specific Product settings through a contextual action and temporary full-page fallback.
- Document and implement compatibility/deprecation handling for the old Product Settings route without deleting data or services.
- Add focused navigation, permission, route, header, UX, accessibility, and tenant/security tests.
- Update `check:ux` only as necessary for the frozen V2-1 contract.
- Update conformance and implementation-note documentation for completed V2-1 behavior.

## Forbidden Scope

- TanStack Table installation or Data Table V2.
- Radix Dialog installation, modal routing, or V2-3 behavior.
- Recharts, charts, or V2-4 visual work.
- CSV/XLSX export, ExcelJS, or import/export engines.
- Prisma schema changes or migrations.
- Receipts, issues, transfers, unified transactions, or posting changes.
- Caching.
- Accent presets or changes to Light/Dark/System behavior.
- Website screenshots/video/public assets.
- New business modules, Platform Services, Dynamic Systems, runtime AI, or FastAPI.
- Any implementation from V2-2 through V2-8.

## Required Behavior

- Compact operational pages retain exactly one semantic `h1`, a compact breadcrumb/context label, and a keyboard-reachable primary action on the title row when space permits.
- Explanatory pages retain descriptions and suitable spacing.
- Shared Records is permission-aware and independent of `OrgModule`.
- Direct Shared Records access uses Shared Records context.
- Inventory-origin Products, Categories, Customers, Suppliers, and Warehouses retain Inventory context and sidebar.
- Product, Product Category, Customer, Supplier, and Warehouse identities remain shared; Inventory owns only stock behavior.
- Product Settings disappears from main Inventory navigation but remains discoverable and accessible contextually.
- The old Product Settings route has a documented compatibility/deprecation behavior.
- App switcher, profile menu, organization context, and Light/Dark/System remain correct.

## Security and Architecture Rules

- Derive tenant context through verified `PlatformContext`; never trust a client-supplied `orgId`.
- Keep server-side permission enforcement authoritative; UI visibility is not authorization.
- Do not move shared Business Object APIs or services under Inventory.
- Do not duplicate shared records or business logic.
- Do not let wildcard permissions bypass tenant isolation.
- Preserve module boundaries and current architecture checks.

## Rollback Boundaries

- Compact header mode must be independently revertible to the current header.
- Shared Records app registration and contextual Inventory navigation must be independently revertible to the current route model.
- Product Settings compatibility route must preserve access during rollback; no data or service is deleted in V2-1.
- No dependency, schema, or migration rollback should be needed because V2-1 permits none.

## Exit Criteria

- Compact headers reduce vertical space while page titles remain semantic.
- Explanatory headers remain available in approved contexts.
- Shared Records appears as a built-in app only when permitted.
- Records are not `OrgModule`-controlled.
- Direct Shared Records navigation works.
- Inventory Related Records preserve Inventory context and sidebar.
- Product, Warehouse, Supplier, Customer, and Category remain explicitly shared.
- Product Settings is removed from main navigation without losing access.
- App switcher and profile menu remain correct.
- Light/Dark/System remain correct.
- Existing security and tenant gates pass.
- No schema or dependency changes occur.
- Controlled demo remains resettable; do not reset it as part of implementation verification unless separately authorized.
- Website asset production remains paused.

## Required Verification Commands

Run during the explicitly approved V2-1 implementation package:

```bash
npm run check:env
npm run check:prisma
npm run lint
npm run typecheck
npm run check:architecture
npm run check:generated
npm run check:ux
npm run test:run
npm run test:a11y
npm run build
git diff --check
git status --short
```

Also report focused V2-1 test files and results, confirm no dependency or Prisma diff, and do not run demo reset without separate authorization.

## Stop Conditions

Stop and request Founder review if V2-1 would require a new dependency, schema/migration change, modal architecture, table V2, a duplicated Business Object/service, weakened permission/tenant enforcement, or any later-package capability.
