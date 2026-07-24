# Implementation Note — V2-2 Data Table V2

Status: Acceptance hardening implemented; Founder acceptance pending
Date: 2026-07-23
Authorization: Prompt 36, V2-2 only

## Dependency

One exact runtime dependency was added: stable `@tanstack/react-table@8.21.3`. It supports React 19 and Node 24 through its published peer/engine ranges. No TanStack Query, Virtual, beta v9, visual table library, or later-package dependency was added. Clean install and all three audit thresholds remain clean.

## Architecture

The composition-first implementation lives under `src/components/onedayos/data-table/`. `DataTableV2` owns TanStack state, OneDayOS semantic markup, toolbar, filter controls, sort headers, pagination, page-scoped selection, column visibility, responsive overflow, contextual states, and row interaction.

Callers continue to own authentication, `PlatformContext`, permissions, tenant identity, API construction, fetching, business rules, columns, routes, and actions.

The original `DataTable` remains as a compatibility wrapper for non-operational dashboard summaries, the module generator, and older tests. All active Inventory operational lists, Shared Records lists, Organization People, and Branches & Departments use V2 adapters. Remove the wrapper only after generator/dashboard migration is separately verified.

## Table Modes

- `client`: for explicitly bounded, fully loaded controlled-demo/reference sets. TanStack performs search, sorting, filtering, and pagination locally.
- `server`: the caller supplies current rows, URL query state, and exact pagination metadata. TanStack uses manual filtering, sorting, and pagination.

All active production callers run in server mode. Prompt 37 migrated Shared Records, Organization, and Inventory Tracking Settings so the browser receives only the current page and exact metadata. There are no approved production client-mode callers.

## Query Contract

Canonical parameters are `q`, `page`, `pageSize`, `sort`, and `direction`. The former `search` key remains an allowlisted compatibility input for existing API consumers. Page size defaults to 25, supports 10/25/50 in the UI, and is capped at 100.

Every query family uses a strict Zod object and page-specific sort/filter enums. Unknown keys, `orgId`, invalid directions, unsupported sort fields, invalid pages, and oversize pages are rejected. Search is trimmed, whitespace-normalized, length-bounded, and mapped only to allowlisted Prisma fields.

## URL State

Server-mode search, filters, sorting, page, and page size are encoded in the URL. Default page/page-size values are omitted. Search/filter changes reset the page; page changes preserve other query keys. Search submits explicitly, avoiding navigation on every keystroke.

Client-mode search/filter state stays local to avoid server navigation for already loaded bounded lists.

Column visibility is stored under `onedayos.table.<stable-table-id>.columns`. Keys contain no organization or user identifier, and storage failure falls back to in-memory state. Row data and permissions are never stored.

## Pagination and API Metadata

Shared Business Object collection APIs and Inventory list APIs add:

```text
meta.page
meta.pageSize
meta.total
meta.totalPages
```

Counts use the same verified tenant, active-record, soft-delete, search, and filter scope as the list query. Existing response `data` remains an array.

Stock Status is computed from balance and reorder-point values for display. Prompt 37 removed the Stock Status filter because the existing approved Prisma/service layer cannot express the related-field comparison with exact pagination. The strict query schema rejects `status` and legacy `lowStockOnly`; exact filtering is deferred to V2-6.

## Row Interaction

Eligible rows are semantic `<tr>` elements with visible focus, `tabIndex=0`, accessible labels, pointer activation, and Enter/Space activation. Checkbox and action cells stop propagation.

- Update permission: canonical edit route.
- Read-only permission: canonical detail route.
- No read permission: service/page authorization prevents data return.

Explicit action buttons remain visible; essential behavior is not hover-only.

## Full-Page Fallback Routes

V2-2 adds canonical direct details for:

- Shared Records and Inventory-context Products, Categories, Customers, Suppliers, and Warehouses.
- Inventory Stock Levels, Stock Movements, and Stock Adjustments.

Stock Movements and posted Stock Adjustments are read-only. These routes are the V2-3 fallback foundation, but no intercepting route, parallel route, Dialog, or modal was implemented.

## Page Retrofits

- Inventory: Stock Levels, Stock Movements, Stock Adjustments, and the Inventory Tracking Settings compatibility list.
- Shared Records: Products, Product Categories, Customers, Suppliers, Warehouses, including Inventory-context variants.
- Organization: Platform Users, Employees, Branches, Departments.

Dashboard summary tables and generated-module compatibility remain on the old wrapper because they are not operational list pages. The Inventory Tracking Settings compatibility list uses V2.

## Stock Levels Adjust Action

Users with `inventory.stock_adjustment.create` receive an explicit per-row `Adjust Stock` action. It navigates to the existing full-page New Adjustment route with only `productId` and `warehouseId`.

The page strictly validates both query keys, rejects unknown/tenant/quantity keys, and confirms both IDs exist in the permission-scoped form options. Cross-tenant or invalid IDs fail safely. The server still recalculates current balance and enforces posting/negative-stock rules.

## Tests

Coverage includes semantic rendering, client and server modes, search/clear, filter clearing, sorting, pagination and page-size bounds, selection, visibility persistence/failure fallback, row pointer/keyboard activation, nested action isolation, all contextual states, strict query families, tenant-key rejection, adjustment prefill, service/API scope, and axe checks for a representative interactive table.

`check:ux` now verifies production V2 adapters, TanStack/manual-server contracts, Stock Levels prefill, absence of early export, and absence of V2-3+ dependencies.

Automated accessibility checks are regression evidence only; they do not establish formal WCAG conformance.

## Performance Limits

- Server page size is capped at 100.
- Every active production caller is server paginated and capped at 100 rows per response.
- There is no Stock Status candidate cap because the inexact filter was removed.
- Inventory Warehouse filter options are complete through an explicit 250-active-Warehouse reference bound; exceeding it fails with a typed safe error instead of truncating.
- No virtualization or cache was added.

## Prompt 37 Scale Hardening

- Products, Product Categories, Customers, Suppliers, Warehouses, Platform Users, Employees, Branches, Departments, and Inventory Tracking Settings moved to server mode.
- Shared and contextual presenters reuse each object service `listPage` contract.
- Organization uses tenant-scoped page services with exact independent counts for paired tables.
- Product rows load only the category relation for the current page.
- Inventory API zero-total fallbacks and dashboard partial-array aggregates were removed.
- Default/requested sorts use an ID tie-breaker.
- Tests exercise 155 Products and 155 Stock Levels, exact totals/pages, search beyond row 100, warehouse filtering, and tenant-derived count scope.
- The final inventory and performance recommendations are in `V2-2-ACCEPTANCE-REPORT.md`.
- V2-3 remains blocked and website asset production remains paused.

## Explicit Non-Goals

No modal, intercepting/parallel route, Radix Dialog, chart, Recharts, export, ExcelJS, Inventory V2 transaction, Prisma schema/migration, cache, accent preset, website asset, module, Platform Service, Dynamic System, runtime AI, or FastAPI work was added.

V2-3 remains blocked pending Founder approval. Export remains V2-5. Website screenshot/video asset production remains paused.
