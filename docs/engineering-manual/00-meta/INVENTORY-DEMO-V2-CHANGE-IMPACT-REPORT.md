# Inventory Demo V2 Change Impact Report

Status: Frozen
Date: 2026-07
Implementation Allowed: One package at a time; only V2-1 is authorized next

Inventory Demo V2 direction is approved. Later packages remain blocked until their own explicit Founder approval.

## Founder Change Request Summary

The controlled Inventory demo surfaced product gaps that are larger than visual polish:

1. Page headers are too tall for operational pages.
2. Dashboard needs real charts and more visual life.
3. Process Flow should look like a real directional diagram.
4. Product Settings should not remain a top-level Inventory tab.
5. Tables need search, filters, sorting, pagination, selection, and column controls.
6. Stock Levels needs per-row Adjust Stock.
7. Create/edit/adjust actions should open URL-addressable modals.
8. Eligible tables need CSV and Excel export.
9. Shared Records should become a built-in app, and related records opened from Inventory should preserve Inventory context.
10. Rows should be clickable and open view/edit modals according to permission.
11. Appearance should support curated accent presets.
12. Tenant-safe caching should be designed before performance work.
13. Inventory should connect Suppliers, Customers, and Warehouses through real workflows.

## Current Implementation Audit

- Inventory routes exist under `/[orgSlug]/inventory`, including Dashboard, Process Flow, Product Settings, Stock Levels, Stock Movements, Stock Adjustments, and New Adjustment.
- Inventory APIs exist under `/api/orgs/[orgSlug]/inventory`.
- Inventory models are `InventoryProductExtension`, `StockBalance`, `StockMovement`, and `StockAdjustment`.
- Inventory references shared Product, ProductCategory, Supplier, and Warehouse in manifest metadata.
- Product, ProductCategory, Supplier, Customer, Warehouse, and Employee are shared Business Objects under `/records`.
- App shell has a persistent sidebar and app switcher for Inventory and Organization.
- Shared Records is currently a route context, not a built-in app in the app switcher.
- Related Records in Inventory are normal links to `/records/*`; they do not preserve Inventory context.
- Product Settings remains a top-level Inventory sidebar item and route.
- Current `DataTable` is semantic but basic.
- Current `ListPage` has optional toolbar/pagination slots but no integrated table state model.
- Current Process Flow renderer is card-based with ordered steps, not a connected diagram.
- Current dashboard shows real KPI cards and tables, but no charts.
- No modal/dialog primitive is installed or implemented.
- No export utilities or dependencies are installed.
- Next config has typed routes only; no explicit cache components, cache tags, or cache invalidation strategy are present.
- Appearance supports Light, Dark, and System only.

## Request Classification

UX refinements:

- Compact operational headers.
- Dashboard visual layout and charts.
- Process Flow diagram upgrade.
- Remove Product Settings from top-level Inventory sidebar.
- Per-row Adjust Stock affordance.
- Clickable rows.
- URL-addressable modals.
- Context-preserving related records.
- Curated accent presets.

Platform capabilities:

- Data Table V2.
- Modal routing standard.
- Bounded server-side export.
- Shared Records built-in app.
- Tenant-safe caching.
- Permission-aware row interaction.

Schema or migration changes required:

- Inventory V2 receipts, issues, and transfers.
- Unified `InventoryTransaction` and `InventoryTransactionLine` model.
- Export permissions if stored/seeded through existing RBAC.
- Potential route/data migration from existing StockAdjustment into unified transactions.

## Conflicts With Prior Frozen Decisions and Resolution

- Earlier IA said Records are not apps. ADR-0015 now amends that decision: Shared Records is a permission-aware built-in app, not an `OrgModule`.
- Earlier appearance scope allowed Light/Dark/System only. ADR-0019 adds browser-local curated accent presets in V2-8 while retaining Light/Dark/System.
- Inventory MVP was adjustment-only. ADR-0020 authorizes receipts, issues, transfers, and adjustments through a unified transaction model in V2-6.
- The broad Import/Export Engine remains deferred. ADR-0017 authorizes only bounded table export in V2-5.
- Product Settings currently has a top-level Inventory route. V2-1 removes the navigation item while preserving contextual access and a documented compatibility/deprecation route.

## Dependency Audit

Audit source: `npm view` metadata on 2026-07-20. No packages were installed.

| Candidate | Version | License | React/Next Compatibility | Decision |
| --- | --- | --- | --- | --- |
| Recharts | 3.9.2 | MIT | React peer range includes 19 | Approved for V2-4 through a small OneDayOS wrapper, real data only. |
| @tanstack/react-table | 8.21.3 | MIT | React peer range `>=16.8`; headless | Approved for V2-2; OneDayOS retains markup and styling. |
| ExcelJS | 4.4.0 | MIT | Server-side library; many dependencies | Conditionally approved for V2-5, server-side only, subject to implementation-time audit. |
| xlsx | 0.18.5 | Apache-2.0 | Server/client capable | Rejected as the selected V2-5 library. |
| @radix-ui/react-dialog | 1.1.19 | MIT | React peer range includes 19 | Selectively approved for V2-3; no broad Radix/shadcn migration. |
| Native `<dialog>` | Browser API | N/A | No dependency | Rejected as the initial modal primitive. |

## Data Model Impact

Option 1: separate workflow models.

- `StockReceipt` / `StockReceiptLine`
- `StockIssue` / `StockIssueLine`
- `StockTransfer` / `StockTransferLine`

Pros:

- Easy mental model.
- Workflow-specific validation is explicit.

Cons:

- Duplicated posting logic and API shapes.
- Harder unified transaction list.
- More migrations and tests.

Option 2: unified transaction model.

- `InventoryTransaction`
- `InventoryTransactionLine`
- `type = receipt | issue | transfer | adjustment`

Pros:

- One posting engine.
- One transaction list.
- Cleaner event and permission model.
- Easier backfill from existing adjustments.

Cons:

- More careful validation by transaction type.
- UI must hide irrelevant fields per type.

Decision: use the unified transaction model, with type-specific validation and one transactional posting service that generates StockMovement rows and updates StockBalance rows. A shared Customer reference is optional on issues; no generic Party model is introduced.

## Founder Decision Table

| Decision | Founder Result | Timing |
| --- | --- | --- |
| Compact header model | Approved: compact and explanatory modes | V2-1 |
| Shared Records built-in app | Approved, permission-aware and not `OrgModule`-controlled | V2-1 |
| Product Settings migration | Approved: contextual access plus compatibility/deprecation route | V2-1, modal treatment later in V2-3 |
| TanStack Table v8 | Approved, stable v8 only | V2-2 |
| Recharts v3 | Approved through a small wrapper and real data only | V2-4 |
| Modal routing | Approved: Next parallel/intercepting routes with full-page fallbacks | V2-3 |
| Radix Dialog | Selectively approved; no broad migration | V2-3 |
| CSV + XLSX export | Approved as bounded Export V1 | V2-5 |
| XLSX library | `exceljs@4.4.0` conditionally approved | Re-audit before V2-5 |
| Inventory V2 model | Approved unified model | V2-6 |
| Customer reference in issue | Approved as optional shared Customer reference | V2-6 |
| Curated accent presets | Approved; default Neutral, brand mark remains orange | V2-8 |
| Caching scope | Approved but deferred until shapes stabilize | V2-7 only |
| Website asset production | Pause remains approved | Until V2-1 through V2-6 and audit gates pass |

## Frozen Direction Summary

- Data Table V2: use TanStack Table v8 headlessly.
- Modals: use URL-addressable routes with selective Radix Dialog for focus management.
- Dashboard charts: use Recharts v3 only through OneDayOS chart wrappers.
- Process Flow: build an accessible CSS/HTML directional diagram, no diagram engine.
- Export: implement bounded server-side CSV/XLSX only after export permission design.
- Shared Records app: built-in app with permission-aware visibility; preserve Inventory context for related records.
- Product Settings: remove from top-level Inventory nav in V2-1 without losing contextual access; URL-addressable modal behavior waits for V2-3.
- Accent presets: curated browser-local presets with Neutral as default.
- Caching: defer until table/mutation shapes stabilize.
- Inventory V2: unified transaction model approved; Customer on issue is optional.

## Frozen Package Order and Rollback Boundaries

`V2-1 → V2-2 → V2-3 → V2-4 → V2-5 → V2-6 → V2-7 → V2-8`

Each package must preserve a local rollback boundary: navigation/header rollback in V2-1, current `DataTable` fallback in V2-2, full-page route fallback in V2-3, KPI/table/process-card fallback in V2-4, removal of export routes/controls in V2-5, an approved migration and feature rollback plan in V2-6, cache-wrapper disablement in V2-7, and Light/Dark/System-only appearance fallback in V2-8.

## Website Asset Production

Website asset production remains paused until V2-1 through V2-6 are complete and audited, V2-8 is stable or capture is explicitly approved earlier, controlled demo reset/check passes, and no Blocker or Must-Fix findings remain.
