# Implementation Note — V2-5 Bounded Table Export

Status: Founder Accepted on 2026-07-24

## Dependency and Boundary

V2-5 uses exact `exceljs@4.4.0` with the Founder-approved, ExcelJS-scoped `uuid@11.1.1` override. The compatibility decision and removal condition are recorded in `V2-5-EXCELJS-UUID-COMPATIBILITY-GATE.md`.

ExcelJS is imported only from the server-only XLSX adapter. CSV serialization is local and server-side. Client tables only POST strict export requests and download returned blobs.

## Architecture

`src/platform/table-export` owns strict request parsing, column resolution, spreadsheet safety, CSV/XLSX serialization, safe filenames, binary responses, and synchronous limits. Authentication, tenant context, permissions, module availability, filters, and database access remain in existing Kernel, module, Business Object, and Organization services.

Success is a binary route exception:

- CSV: `text/csv; charset=utf-8`
- XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- both use attachment disposition, `no-store`, and `nosniff`.

Failures remain the standard JSON API envelope with request IDs.

## Permissions

Read permission alone is insufficient. Routes require both read and export:

- `inventory.stock_level.export`
- `inventory.stock_movement.export`
- `inventory.stock_adjustment.export`
- `objects.product.export`
- `objects.product_category.export`
- `objects.customer.export`
- `objects.supplier.export`
- `objects.warehouse.export`
- `objects.employee.export`
- `kernel.organization.branch.export`
- `kernel.organization.department.export`

Org Admin wildcard satisfies these requirements. The controlled Warehouse Operator permission profile was not broadened and does not see Export.

## Eligible Table Matrix

| Table | Route | Safe default/visible columns |
| --- | --- | --- |
| Stock Levels | Inventory | Product code/name, category, Warehouse, quantity, unit, reorder point, status |
| Stock Movements | Inventory | time, Product, Warehouse, type, delta, result, reason |
| Stock Adjustments | Inventory | time, Product, Warehouse, before/after/delta, reason |
| Products | Shared Records | code, name, description, category, unit, status, updated time |
| Product Categories | Shared Records | name, parent |
| Customers | Shared Records | name, email, phone, address |
| Suppliers | Shared Records | name, email, phone, address |
| Warehouses | Shared Records | code, name, Branch, address, status |
| Employees | Shared Records / Organization | employee number, name, contact, Branch, Department, position, type, hire date, status |
| Branches | Organization | code, name, status |
| Departments | Organization | code, name, Branch, status |

Platform Users/auth identities, Inventory Tracking Settings, dashboard summaries, Process Flow, launcher, and security/audit metadata are excluded because they are identity/security surfaces, configuration rather than an eligible table, derived presentation, or outside V2-5.

## Request and Query Behavior

The strict JSON POST body accepts `csv|xlsx`, `selected|filtered`, up to 1,000 selected IDs, allowlisted visible columns, and only the table’s existing V2-2 search/filter/sort keys. Unknown keys and tenant identity are rejected recursively. Pagination is removed server-side.

Filtered export reads every matching row in deterministic 100-row service batches after exact count validation. Selected export applies the current filters, deduplicates IDs, and returns a generic selection error if every requested row cannot be resolved inside authorized tenant scope.

## Limits and Safety

- maximum filtered candidates: 10,000;
- maximum selected IDs: 1,000;
- no partial or silently truncated files;
- over-limit status: JSON `422 EXPORT_ROW_LIMIT_EXCEEDED`;
- invalid selection: JSON `422 EXPORT_SELECTION_INVALID`;
- no rows: JSON `422 EXPORT_EMPTY`.

Every table has explicit columns. Internal IDs, `orgId`, soft-delete metadata, auth IDs, permission metadata, secrets, and tokens are absent.

Strings beginning with `=`, `+`, `-`, `@`, tab, or carriage return receive a leading apostrophe in CSV and XLSX. Numbers, booleans, and XLSX dates remain typed. XLSX contains one visible worksheet, no formulas, macros, images, external links, or secret metadata. CSV uses UTF-8 BOM, CRLF, and RFC-style quoting.

Filenames follow `onedayos-{resource}-{yyyy-mm-dd}.{format}` with lowercase ASCII sanitization.

## Data Table V2

Eligible callers explicitly pass permission-derived export options. The shared toolbar does not determine authorization. Its accessible menu offers CSV and Excel plus selected and all-filtered scopes with exact counts. POST download behavior reports preparing/success/failure through `aria-live`, prevents duplicate requests, honors the server filename, revokes object URLs, and preserves URL state and row selection.

## Verification

Tests cover UUID interop, workbook round trips, serializer escaping/types/injection, schema rejection/deduplication, row limits, deterministic batching, selection safety, binary/JSON route behavior, permission denial, UI scopes/download/error state, and axe regression coverage. Structural gates enforce exact dependency/override, server-only ExcelJS, explicit limits, and no Warehouse Operator export grant.

## Performance and Non-Goals

This is synchronous V1 and holds bounded serialized output in server memory. It is not an import engine, report builder, scheduler, background job, file store, email delivery mechanism, PDF exporter, cache, or generic Prisma reflection layer.

No Prisma schema, migration, V2-6 transaction, cache, accent, website asset, module, Platform Service, Dynamic System, AI runtime, FastAPI, or background job was added. V2-6 remains blocked and website asset production remains paused.
