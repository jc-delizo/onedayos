# V2-2 Acceptance Report

## Status

Code and Correctness Gates Complete
Founder Acceptance Pending

Date: 2026-07-23
Authority: Prompt 37, V2-2 acceptance and scale-correctness hardening only

## Data Table V2 Platform

Data Table V2 remains the OneDayOS semantic table shell over `@tanstack/react-table@8.21.3`. Search, allowlisted filters, sorting, bounded pagination, selection, visibility, pointer/keyboard row activation, action isolation, contextual empty/error states, and URL state remain available.

Every active production V2 caller now uses server mode. The browser receives only the current page plus truthful metadata. Column preferences remain browser-local, contain no tenant identity or row data, and do not affect authorization.

## Production Table Mode Inventory

| Table ID | Route | Domain | Source | Maximum loaded | Total source | Query location | Growth | Final mode |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| `inventory.stock-levels` | `/[orgSlug]/inventory/stock-levels` | Inventory | `InventoryService.listStockLevelsPage` | 100/page | matching `stockBalance.count` | server | high | server |
| `inventory.stock-movements` | `/[orgSlug]/inventory/stock-movements` | Inventory | `InventoryService.listStockMovementsPage` | 100/page | matching `stockMovement.count` | server | high | server |
| `inventory.stock-adjustments` | `/[orgSlug]/inventory/stock-adjustments` | Inventory | `InventoryService.listStockAdjustmentsPage` | 100/page | matching `stockAdjustment.count` | server | high | server |
| `inventory.product-settings` | `/[orgSlug]/inventory/product-settings` | Inventory | `InventoryService.listProductSettingsPage` | 100/page | matching `product.count` | server | high | server |
| `objects.products` | `/[orgSlug]/records/products`; Inventory contextual equivalent | Shared Records | `ProductService.listPage` | 100/page | matching `product.count` | server | high | server |
| `objects.product-categories` | `/[orgSlug]/records/product-categories`; Inventory contextual equivalent | Shared Records | `ProductCategoryService.listPage` | 100/page | matching `productCategory.count` | server | low/medium | server |
| `objects.customers` | `/[orgSlug]/records/customers`; Inventory contextual equivalent | Shared Records | `CustomerService.listPage` | 100/page | matching `customer.count` | server | high | server |
| `objects.suppliers` | `/[orgSlug]/records/suppliers`; Inventory contextual equivalent | Shared Records | `SupplierService.listPage` | 100/page | matching `supplier.count` | server | high | server |
| `objects.warehouses` | `/[orgSlug]/records/warehouses`; Inventory contextual equivalent | Shared Records | `WarehouseService.listPage` | 100/page | matching `warehouse.count` | server | medium/high | server |
| `objects.employees` | `/[orgSlug]/records/employees` | Shared Records / Organization compatibility | `EmployeeService.listPage` | 100/page | matching `employee.count` | server | high | server |
| `organization.users` | `/[orgSlug]/organization/people` | Organization | `OrganizationTableService.listPeople` | 100/page | matching `user.count` | server | high | server |
| `organization.people` | `/[orgSlug]/organization/people` | Organization | `OrganizationTableService.listPeople` | 100/page | matching `employee.count` | server | high | server |
| `organization.branches` | `/[orgSlug]/organization/branches-departments` | Organization | `OrganizationTableService.listStructure` | 100/page | matching `branch.count` | server | low/medium | server |
| `organization.departments` | `/[orgSlug]/organization/branches-departments` | Organization | `OrganizationTableService.listStructure` | 100/page | matching `department.count` | server | medium | server |

Search, filter, sort, and pagination execute server-side for every row above. Organization’s paired tables intentionally share one strict page-level URL query; each still has its own exact count and page metadata.

## Server-Mode Tables

Prompt 37 migrated Products, Product Categories, Customers, Suppliers, Warehouses, Platform Users, Employees, Branches, Departments, and Inventory Tracking Settings from client to server mode. Stock Levels, Movements, and Adjustments remain server mode.

Shared Records and Inventory-context routes call the same presenters and Business Object services. They do not duplicate query or permission logic.

## Approved Client-Mode Tables

None in active production Data Table V2 callers.

Client mode remains a reusable component capability for tests and a future explicitly bounded reference set. A production caller may not use it without a documented maximum, a complete bounded fetch, and an honest failure when the maximum is exceeded. Tenant row data must never be persisted in local storage.

## Stock Status Filter Correctness

Prompt 37 Option 3 was selected.

The Stock Status filter was removed temporarily. Status badges remain computed and visible per returned row. The current schema cannot express an exact paginated comparison between `StockBalance.quantity` and the related Inventory reorder point through the existing approved Prisma/service layer. Raw SQL, a schema field, a migration, or a new query repository was not introduced.

`status` and the legacy `lowStockOnly` query key are now rejected by the strict Stock Level schema. Exact status filtering is deferred to the V2-6 query-layer/schema decision.

## Pagination and Total Accuracy

- All current-page fetches use `skip`/`take` with a page-size ceiling of 100.
- Every total uses a count with the same tenant, soft-delete, active-relation, search, and allowlisted filter scope as the row query.
- Default and requested sorts include `id` as a deterministic tie-breaker.
- Inventory APIs no longer contain zero-total fallbacks.
- Scale tests use 155 Products and 155 Stock Levels, prove totals and total pages above 100, find a record beyond index 100, and verify stable/non-overlapping page boundaries.
- Dashboard computed status and positive-warehouse counts are no longer derived from a partial 100-row array; they remain unavailable until an exact approved aggregate exists.

## Tenant and Permission Safety

Business Object services require the object read permission before database access. Inventory page methods require module enablement and the relevant read permission before their count query. Organization table services require verified organization context plus Organization Admin before database access.

All `where` clauses derive `orgId` from `PlatformContext`, exclude soft-deleted records, and preserve active related Product/Warehouse constraints. Strict query schemas reject `orgId` and unknown keys. Count queries use the same server-derived tenant scope as row queries.

## Accessibility

Semantic table markup, keyboard row activation, visible focus, labeled search/filter/selection controls, action-cell propagation isolation, and contextual empty/error states remain covered by component and Inventory axe regression tests. Automated evidence is not a formal WCAG claim.

## Manual Visual Review

Controlled production review passed on the final build for Stock Levels, Products, Customers, Suppliers, Warehouses, People, Warehouse Operator read-only behavior, safe Organization denial, and Light/Dark/System.

Evidence:

- `/tmp/p37-admin-stock-levels-light.png`
- `/tmp/p37-admin-stock-levels-search.png`
- `/tmp/p37-admin-products.png`
- `/tmp/p37-admin-products-search.png`
- `/tmp/p37-admin-customers.png`
- `/tmp/p37-admin-suppliers.png`
- `/tmp/p37-admin-warehouses.png`
- `/tmp/p37-admin-people.png`
- `/tmp/p37-admin-people-dark.png`
- `/tmp/p37-admin-people-system.png`
- `/tmp/p37-warehouse-products-read-only.png`
- `/tmp/p37-warehouse-organization-denied.png`

The Warehouse Operator received View rather than Edit actions on Products and no Organization table data. The denied Organization route rendered the safe 404 state.

## Dependency Audits

No dependency was added or changed by Prompt 37. The required production-moderate, full-high, and full-moderate npm audit gates remain required and must report zero findings.

## Findings

- Computed Stock Status filtering silently depended on a 100-candidate correctness ceiling.
- Shared Records, Organization, and Inventory Tracking Settings loaded complete tenant sets into client mode.
- Inventory list API test fallbacks could report `total: 0`.
- Product category display required an unbounded category list.
- Some server sort controls did not align with allowlisted server fields.
- Dashboard low-stock/warehouse summaries were calculated from at most 100 balances.
- Organization pages performed unbounded direct `findMany` calls.

## Fixed Issues

- Removed the Stock Status filter and rejected its query keys.
- Migrated every active V2 table to server mode.
- Added exact count/page methods for Inventory Tracking Settings and Organization tables.
- Added relation loading for the current Product page rather than loading every category.
- Added deterministic ID tie-breakers.
- Removed inaccurate API metadata fallbacks and partial dashboard aggregates.
- Added scale, query rejection, tenant-scope, and production-mode regression checks.

## Deferred Issues

- Exact Stock Status filtering and exact low-stock/positive-warehouse aggregate queries: V2-6 Founder decision.
- Search performance for case-insensitive contains queries at very large scale: V2-6 index/query review.
- Independent representative-user, keyboard-only, screen-reader, and formal accessibility validation remain pending.

## Performance Limits

Page size is capped at 100. Counts are exact and may become the dominant cost at very large tenant sizes. Existing tenant-leading indexes support primary scopes; several contains-search fields cannot fully benefit from ordinary B-tree indexes. No schema/index migration or caching was authorized.

Inventory Warehouse dropdowns use a separate permission-checked tenant reference lookup capped at 250 active Warehouses. The service counts first and returns a typed safe error instead of truncating when the explicit maximum is exceeded. Movement types come from the complete query allowlist rather than the current page.

Recommended V2-6 review:

- exact computed Stock Status query representation;
- search indexes appropriate to PostgreSQL contains matching;
- composite index fit for common tenant + active/deleted + sort paths;
- exact Inventory dashboard aggregates;
- independent URL scopes if paired Organization tables need separate pagination.

## Founder Approval Required

Founder acceptance is required before V2-3. This report does not authorize Radix Dialog, modal/intercepting routes, or any later package.

## V2-3 Readiness

V2-2 code and correctness gates are complete: 50 test files / 312 tests, 3 accessibility files / 14 tests, production build, `check:all`, `demo:check`, three zero-finding audits, and final production browser review passed under Node 24.18.0/npm 11.16.0. V2-3 remains blocked pending explicit Founder acceptance. Website asset production remains paused.
