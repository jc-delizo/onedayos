# Implementation Note — V2-1 Compact Header + Shared Records IA

Status: Code-complete; automated verification passed; Founder visual review pending
Date: 2026-07
Package: V2-1 only

## Summary

V2-1 adds typed compact/explanatory page headers, makes Shared Records a permission-aware built-in app, preserves Inventory context for related shared records, and removes Product Settings from top-level Inventory navigation without removing its functionality.

## Route Strategy

- Direct Shared Records: `/[orgSlug]/records/**`.
- Inventory-context lists: `/[orgSlug]/inventory/related/[area]`.
- Inventory-context full-page create: `/[orgSlug]/inventory/related/[area]/new`.
- Inventory-context full-page edit: `/[orgSlug]/inventory/related/[area]/[id]/edit`.
- Temporary tracking-settings compatibility surface: `/[orgSlug]/inventory/product-settings`.

The Inventory routes keep Inventory as the current app and retain the Inventory sidebar. Direct Records routes resolve Shared Records and use its permission-aware sidebar. Both strategies preserve normal browser Back/Forward behavior and do not use modal or intercepting routes.

## Reuse Strategy

Direct and Inventory-context routes render the same `SharedRecordListPresenter`, `SharedRecordFormPresenter`, `RecordsListPage`, `RecordsFormPage`, `RecordForm`, and record-area configuration. They call the existing shared Business Object services and APIs. No Product, Category, Customer, Supplier, Warehouse, validation, permission, table, form, or business-rule implementation was copied into Inventory.

## Permission Behavior

Shared Records appears only when the verified `PlatformContext` grants at least one relevant `objects.*.read` permission for Product, Product Category, Customer, Supplier, or Warehouse. Its sidebar includes only permitted types. It is not derived from `enabledModules` and is not an `OrgModule`.

Org Admin is expected to see Inventory, Shared Records, and Organization. The Warehouse Operator sees Inventory and Shared Records, but not Organization. People remains under Organization.

Inventory-context routes require the Inventory module context and continue to rely on the shared service permission checks. No client-supplied `orgId` was added.

## Product Settings Compatibility

Product Settings was removed from the tenant Inventory sidebar and Inventory module navigation metadata. Existing schema, service, API, validation, permission, route, and tests remain. The route is relabeled `Inventory Tracking Settings`, described as a compatibility/contextual surface, and linked from Stock Levels and contextual Inventory Products.

## Header Behavior

`PageHeader` and `AppPage` accept a typed `compact | explanatory` mode. Routine Inventory, Shared Records, record form, and selected Organization operational pages use compact headers. Inventory Process Flow and the App Launcher explicitly retain explanatory headers.

## Files Created

- Shared record list/form presenter.
- Inventory-context related-record list/create/edit routes and contextual loading state.
- This implementation note.

## Tests and Automated Evidence

Coverage includes:

- compact and explanatory header semantics;
- Process Flow explanatory preservation;
- Org Admin, Warehouse Operator, and no-record-permission app visibility;
- Shared Records current-app/sidebar behavior;
- Inventory-context links and shared presenter reuse;
- Product Settings navigation removal and compatibility access;
- unchanged tenant and permission enforcement;
- selected accessibility scans and Light/Dark/System regression.

Final automated verification:

- `npm run check:all`: passed, including 47 test files / 278 tests, 2 accessibility test files / 13 tests, and the production build.
- `npm run demo:check`: passed for the controlled demo tenant and port `1320`; public self-service is not implied.
- Focused V2-1 suite: passed, 9 test files / 83 tests.
- `git diff --check`: passed before the final gate and is rerun at handoff.
- `npm audit --audit-level=moderate`: reported 8 dependency advisories (4 moderate, 4 high). No dependency or lockfile mutation was made because package upgrades are outside V2-1 and forced audit fixes are prohibited.

## Visual Review

The stale July 19 `next start` process was stopped and the current tree was rebuilt. The latest production build is running on port `1320` as `next start` and was verified through separate authenticated Org Admin and Warehouse Operator Chrome sessions.

Codex browser review confirmed compact/explanatory header behavior, role-specific app visibility, direct Shared Records context, Inventory-context Related Records, Product Settings contextual access, Organization denial for the Warehouse Operator, and persisted Light/Dark/System preferences. No V2-1 regression requiring a code fix was found.

Founder review screenshots were captured at 1440 × 900:

- `/tmp/v2-1-org-admin-app-launcher-light.png`
- `/tmp/v2-1-warehouse-app-launcher-light.png`
- `/tmp/v2-1-inventory-dashboard-compact-light.png`
- `/tmp/v2-1-inventory-dashboard-compact-dark.png`
- `/tmp/v2-1-process-flow-explanatory.png`
- `/tmp/v2-1-inventory-context-products.png`
- `/tmp/v2-1-shared-records-products.png`
- `/tmp/v2-1-shared-records-app.png`
- `/tmp/v2-1-product-settings-contextual-access.png`
- `/tmp/v2-1-organization-people.png`

Screenshots are temporary local evidence and must not be committed or published. Founder visual approval remains pending. See `00-meta/V2-1-ACCEPTANCE-REPORT.md`.

## Dependency Advisory Triage

The July 23 audit triage is recorded in `00-meta/DEPENDENCY-AUDIT-TRIAGE-2026-07.md`. It reports eight vulnerable package entries (four high and four moderate), including a direct production Next patch at `16.2.11`. No dependency or lockfile change was made. A separately approved Dependency Security Remediation Package is required before V2-2.

## Explicit Non-Goals

No Data Table V2, search/filter/sort/pagination/selection, Radix Dialog, modal/intercepting routes, Recharts, charts, Process Flow diagram V2, export, ExcelJS, Prisma change, migration, Inventory transaction, receipt, issue, transfer, caching, accent preset, new business module, Platform Service, Dynamic System, runtime AI, FastAPI, or public asset is part of V2-1.

V2-2 remains blocked pending explicit Founder approval, and website asset production remains paused.
