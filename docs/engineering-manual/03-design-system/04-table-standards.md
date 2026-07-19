# OneDayOS Engineering Manual — 03 Design System / 04 Table Standards

**Document ID:** `03-design-system/04-table-standards.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Restarted Platform UI Build  
**Owner:** Founder / Software Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `03-design-system/00-design-vision.md`
- `03-design-system/01-brand-system.md`
- `03-design-system/02-layout-system.md`
- `03-design-system/03-component-standards.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/01-sdk-public-api.md`
- `06-data/01-tenancy-data-isolation.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `14-testing-quality/04-ui-testing.md`

---

# 1. Purpose

This document defines how tables should look, behave, load, filter, sort, paginate, animate, fail, and enforce platform boundaries across OneDayOS.

Tables are one of the most important surfaces in OneDayOS. For many Philippine SMEs, the table is the workspace. Inventory stock levels, product lists, leave requests, customer pipelines, expenses, assets, visitors, incidents, purchase orders, and future reports will all be experienced through tables.

A weak table system makes OneDayOS feel like a generic admin dashboard.

A strong table system makes OneDayOS feel like a premium Business Operating System.

The goal is not to build the most configurable table engine immediately. The goal is to create a consistent, beautiful, secure, fast, reusable table standard that every module can inherit.

---

# 2. Core Position

OneDayOS tables must be:

```txt
Data-dense
Fast
Readable
Keyboard-friendly
Permission-aware
Tenant-safe
Consistent across modules
Beautiful without being decorative
```

They must not be:

```txt
Generic Bootstrap admin tables
Oversized SaaS marketing tables
Spreadsheet clones
Unstructured div lists
Per-module custom table designs
A premature no-code table builder
A permission bypass
A raw Prisma query surface
```

---

# 3. Why Tables Matter

OneDayOS is not primarily a content app. It is an operational system.

Operational systems are mostly used through:

```txt
Lists
Tables
Forms
Detail pages
Status workflows
Approvals
Search
Reports
```

If tables are bad, the whole product feels bad.

A client will spend more time looking at these screens:

```txt
Products
Stock Levels
Leave Requests
Customers
Opportunities
Assets
Visitors
Incidents
Purchase Orders
Expense Claims
```

than at any landing page, marketing page, or dashboard.

Therefore, table quality is not a UI detail. It is a core product capability.

---

# 4. Scope

This document covers:

- Standard table anatomy.
- Table density.
- Typography and spacing.
- Column rules.
- Row rules.
- Status badges.
- Row actions.
- Bulk actions.
- Sorting.
- Filtering.
- Search.
- Pagination.
- Loading states.
- Empty states.
- Error states.
- Permission-aware UI.
- Tenant-safe query behavior.
- Optimistic UI behavior.
- Keyboard behavior.
- Responsive behavior.
- Accessibility.
- Testing requirements.
- Claude implementation rules.

This document does **not** implement:

- Dynamic Table View Engine.
- Saved views.
- Global search.
- Reporting Service.
- Export Engine.
- AI querying.
- Realtime collaboration.
- Spreadsheet editing.
- Pivot tables.
- Column formula engine.
- Per-client custom table layouts.

Those remain separate future capabilities.

---

# 5. Table System Layers

OneDayOS should separate table responsibilities into layers.

## 5.1 Presentational Table Component

Example future component:

```txt
DataTable
```

Responsible for:

- Table structure.
- Headers.
- Rows.
- Cells.
- Empty state.
- Loading skeletons.
- Row action rendering.
- Basic accessibility.
- Visual consistency.

Not responsible for:

- Fetching data.
- Tenant context.
- Permissions.
- API calls.
- Prisma queries.
- Server filtering.
- Dynamic saved views.

## 5.2 Table Page / Container

Example:

```txt
ProductsPage
InventoryStockLevelsPage
LeaveRequestsPage
```

Responsible for:

- Creating or receiving verified `PlatformContext` on the server.
- Fetching tenant-scoped data through services.
- Passing safe data to client components.
- Reading URL query params.
- Applying server-side filters.
- Passing permission flags to UI.

## 5.3 Service Layer

Example:

```ts
ProductService.list(ctx, input)
InventoryService.listStockLevels(ctx, input)
LeaveService.listRequests(ctx, input)
```

Responsible for:

- Tenant scoping.
- Permission enforcement.
- Module enablement rules.
- Soft-delete exclusion.
- Query allowlists.
- Stable ordering.
- Pagination.

## 5.4 Future Dynamic Table View Engine

Deferred.

Responsible later for:

- Saved views.
- User-specific column preferences.
- Organization default views.
- Configurable filters.
- Configurable sorts.

It must not be implemented from this document.

---

# 6. Standard Table Anatomy

A standard OneDayOS table page should usually have this structure:

```txt
Page Header
  Title
  Short description
  Primary action

Toolbar
  Search
  Filters
  View controls if available later
  Secondary actions

Table Container
  Header row
  Data rows
  Row actions
  Empty/loading/error states

Pagination/Footer
  Result count if available
  Page size
  Previous/next
```

Example page layout:

```txt
Products                                      [+ New Product]
Shared product records used by Inventory, Purchasing, and Sales.

[Search products...] [Category] [Status] [More filters]

┌────────────┬──────────────────────┬──────────┬──────────┬────────────┐
│ Code       │ Name                 │ Category │ Unit     │ Status     │
├────────────┼──────────────────────┼──────────┼──────────┼────────────┤
│ SKU-001    │ Bond Paper A4        │ Office   │ ream     │ Active     │
│ SKU-002    │ Ballpen Black        │ Office   │ pcs      │ Active     │
└────────────┴──────────────────────┴──────────┴──────────┴────────────┘

Showing 1-25 of 132      [Previous] [Next]
```

---

# 7. Design Principles

## 7.1 Data First

Tables should make data easier to scan.

Do not add decoration that competes with the records.

Bad:

```txt
Large row cards
Heavy shadows
Large icons per row
Random colors
Oversized padding
```

Good:

```txt
Clear text hierarchy
Subtle borders
Compact row height
Predictable alignment
Quiet status badges
Readable actions
```

## 7.2 Dense, Not Cramped

OneDayOS should feel data-dense, but not suffocating.

Default table density:

```txt
Header height: compact
Row height: compact-medium
Cell padding: restrained
Font size: 13px-14px equivalent
```

Avoid both extremes:

```txt
Too loose: feels like a SaaS landing-page table
Too tight: feels like old ERP spreadsheet clutter
```

## 7.3 Predictable Over Clever

Tables should behave the same across modules.

Inventory tables, CRM tables, Leave tables, and Assets tables should not invent different row action placement, filter behavior, status styles, empty states, or pagination controls.

## 7.4 Fast Perception

Every table interaction should feel immediate.

Use:

- Optimistic UI for safe mutations.
- Skeleton rows for loading.
- Subtle row animations for inserts/removals.
- URL-backed filter state.
- Server-side pagination for large data.

Avoid:

- Full-page spinners.
- Layout jumps.
- Blocking overlays for simple actions.
- Delayed visual feedback.

## 7.5 Security Is Not Visual

Hiding a row action does not secure the operation.

Permission-aware UI improves usability, but APIs and services enforce security.

---

# 8. Table Types

## 8.1 Business Object Tables

Examples:

```txt
Employees
Products
Customers
Suppliers
Warehouses
```

These tables belong to the Business Objects layer, not to individual modules.

Rules:

- Product table must not feel owned by Inventory.
- Customer table must not feel owned by CRM.
- Employee table must not feel owned by Leave.
- Supplier table must not feel owned by Purchasing.
- Warehouse table must not feel owned by Inventory.

Permissions use:

```txt
objects.product.read
objects.customer.read
objects.employee.read
objects.supplier.read
objects.warehouse.read
```

APIs use:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/employees
```

## 8.2 Module Record Tables

Examples:

```txt
Inventory Stock Levels
Inventory Adjustments
Leave Requests
Expense Claims
Purchase Orders
Visitor Logs
Incident Reports
```

These tables belong to modules.

Permissions use module namespaces:

```txt
inventory.stock_balance.read
leave.leave_request.read
expenses.expense_claim.read
incidents.incident.read
```

APIs use:

```txt
/api/orgs/[orgSlug]/inventory/stock-levels
/api/orgs/[orgSlug]/leave/requests
/api/orgs/[orgSlug]/expenses/claims
```

## 8.3 Work Queue Tables

Examples:

```txt
Pending Leave Requests
Open Incidents
Purchase Requests Awaiting Approval
Unassigned Assets
```

These tables are action-oriented.

Rules:

- Primary status should be obvious.
- Assigned user/owner should be visible.
- Age/date should be visible.
- Row actions should be clear.
- Bulk actions require strong permission checks.

## 8.4 Ledger Tables

Examples:

```txt
Stock Movements
Audit entries later
Activity entries later
```

Rules:

- Usually append-only.
- Stable ordering is required.
- Cursor pagination is preferred later for high-volume tables.
- Avoid destructive row actions.
- Rows should be readable, but compact.

## 8.5 Configuration Tables

Examples:

```txt
Roles
Permissions
Leave Types
Expense Categories
Asset Categories
Incident Categories
```

Rules:

- Keep configuration tables simple.
- Prefer inline status badges.
- Avoid overbuilt filtering unless needed.
- Deletion may be restricted if records are already used.

---

# 9. Column Standards

## 9.1 Identity Column First

The first meaningful column should identify the row.

Examples:

```txt
Product: Code + Name
Customer: Name
Employee: Employee No + Name
Leave Request: Employee + Leave Type
Incident: Incident No + Title
Asset: Asset Tag + Name
```

Bad:

```txt
First column: database ID
First column: createdAt
First column: checkbox with no visible identity nearby
```

Database IDs must generally not be displayed unless explicitly useful for support.

## 9.2 Status Column Must Be Scannable

Statuses should use badges.

Bad:

```txt
Plain text: pending_approval
Random red/orange/green colors per module
Long labels that wrap
```

Good:

```txt
Pending
Approved
Rejected
Open
Resolved
Inactive
Deleted
```

Status badge colors must come from semantic tokens, not arbitrary module colors.

## 9.3 Numeric Alignment

Numbers should align consistently.

Recommended:

```txt
Quantity: right-aligned
Money: right-aligned
Counts: right-aligned
Percentages: right-aligned
Text: left-aligned
Dates: left-aligned or tabular, depending on context
Status: left-aligned unless table is very dense
```

## 9.4 Money and Decimal Values

Money and quantities must not be formatted carelessly.

Rules:

- Server stores Decimal-compatible values.
- UI formats values consistently.
- Avoid JavaScript float assumptions in calculations.
- Do not calculate official totals only on the client.
- For tables, display clear currency where applicable.

Example:

```txt
₱12,500.00
15 pcs
1,200 kg
```

## 9.5 Date Columns

Dates should be readable and consistent.

Recommended display:

```txt
Jul 6, 2026
Jul 6, 2026 3:45 PM
```

Avoid ambiguous formats:

```txt
06/07/26
7/6/2026
```

Because OneDayOS serves Philippine SMEs, local date/time behavior should be clear and eventually configurable.

## 9.6 Relation Columns

Relation fields should show human-readable labels, not IDs.

Bad:

```txt
branchId: clx123...
employeeId: clx456...
```

Good:

```txt
Head Office
Juan Dela Cruz
Warehouse A
```

Relation options and relation rows must be tenant-scoped server-side.

## 9.7 Action Column Last

Row actions belong at the far right.

Common actions:

```txt
View
Edit
Delete
Restore
Cancel
Approve
Reject
Void
```

Rules:

- Destructive actions require confirmation.
- Disabled actions should explain why when practical.
- Hidden actions are not security.
- APIs and services enforce permissions.

---

# 10. Row Standards

## 10.1 Row Height

Default row height should support fast scanning.

Recommended:

```txt
Compact default for list pages.
Slightly taller rows only when secondary text is required.
```

Avoid:

```txt
Card-like rows for standard tables
Excessive vertical padding
Rows that show too many unrelated details
```

## 10.2 Row Hover

Rows should have a subtle hover state.

Hover should indicate interactivity without feeling loud.

Rules:

- Use neutral hover backgrounds.
- Do not use brand orange for every hover state.
- Do not make hover state look like selection unless row is actually selected.

## 10.3 Clickable Rows

If a row opens a detail page, the clickable behavior must be clear.

Rules:

- Row click may open detail page.
- Text links may also be used for the primary identity cell.
- Row action buttons must not accidentally trigger row navigation.
- Keyboard users must be able to open the row.

## 10.4 Secondary Text

Use secondary text sparingly.

Good uses:

```txt
Customer name + email
Product name + description snippet
Employee name + position
Incident title + short reference
```

Bad uses:

```txt
Cramming every field into the first cell
Showing full notes/descriptions inside table rows
```

---

# 11. Status Badge Standards

Statuses should be standardized across modules as much as possible.

## 11.1 Semantic Groups

Use common semantic groups:

```txt
Neutral: draft, inactive, archived
Info: open, submitted, in review
Success: approved, completed, resolved, active
Warning: pending, low stock, needs attention
Danger: rejected, overdue, failed, critical
```

## 11.2 Status Names

Use human-readable names.

Bad:

```txt
pending_approval
stock_level_low_detected
is_active_true
```

Good:

```txt
Pending Approval
Low Stock
Active
```

## 11.3 Business State vs Deletion State

Do not confuse active/inactive business status with soft deletion.

Examples:

```txt
Employee.isActive = still employed?
Employee.deletedAt = record removed from normal views?
Warehouse.isActive = operational?
Warehouse.deletedAt = deleted record?
```

Deleted records should not appear in normal tables unless the table is explicitly a restore/admin view.

---

# 12. Toolbar Standards

A standard table toolbar may include:

```txt
Search input
Primary filters
Secondary filters
Reset filters
View options later
Export later
```

## 12.1 Search

Module-local search is allowed.

Global search is deferred to the future Search Service.

Rules:

- Search should be tenant-scoped.
- Search should not expose sensitive fields by default.
- Search should use approved searchable fields.
- Search should not accept raw SQL or raw Prisma filters.
- Search input state should usually be reflected in URL query params.

## 12.2 Filters

Filters should be simple and understandable.

Examples:

```txt
Status
Category
Branch
Department
Date range
Assignee
Owner
```

Rules:

- Filter keys must be allowlisted.
- Relation filters must be tenant-safe.
- Filter values must be validated with Zod.
- The client must not send raw Prisma `where` objects.

Bad:

```json
{
  "where": {
    "orgId": "client-supplied",
    "deletedAt": null
  }
}
```

Good:

```txt
?status=active&categoryId=cat_123&page=1&pageSize=25
```

Then the server maps validated filters to safe Prisma queries.

## 12.3 Reset Filters

Filtered tables should provide a clear reset action.

The user should never feel trapped in a filtered state.

---

# 13. Sorting Standards

Sorting is allowed, but must be controlled.

Rules:

- Sort fields must be allowlisted.
- Sort direction must be `asc` or `desc`.
- Default sorting must be stable.
- The client must not send raw Prisma `orderBy`.
- Sorting should use URL query params where practical.

Example allowed sort values:

```txt
?sort=name.asc
?sort=createdAt.desc
?sort=status.asc
```

Server maps these to safe internal query definitions.

Bad:

```json
{
  "orderBy": {
    "someNestedRelation": {
      "secretField": "desc"
    }
  }
}
```

---

# 14. Pagination Standards

## 14.1 Default Pagination

For MVP, most standard list tables may use page-based pagination.

Recommended defaults:

```txt
Default page size: 25
Allowed page sizes: 10, 25, 50, 100
Maximum page size: 100
```

Rules:

- `page` must be validated.
- `pageSize` must be validated.
- Large `pageSize` values must be rejected or clamped server-side.
- Page state should be in URL query params.

## 14.2 Cursor Pagination

Cursor pagination should be used later for high-volume append-only tables.

Examples:

```txt
StockMovement ledger
Activity Feed later
Audit Log later
Large import logs later
```

Do not overcomplicate ordinary SME list pages with cursor pagination too early.

## 14.3 Result Counts

Result counts are useful but can become expensive later.

MVP rule:

- Use result counts where cheap.
- Do not block table rendering on expensive counts.
- Do not pretend counts are exact if they are not.

---

# 15. Loading States

## 15.1 Use Skeleton Rows

Tables should use skeleton rows, not full-page spinners.

Bad:

```txt
Blank page + spinner
Huge loading overlay
Layout jumps after data loads
```

Good:

```txt
Table header visible
Skeleton rows preserve table shape
Toolbar remains visible if possible
```

## 15.2 Preserve Layout

Loading should not cause the page to jump.

If filters or toolbar are already known, render them immediately.

## 15.3 Small Inline Loading

For small row-level actions, use inline pending states.

Examples:

```txt
Disabling one row action button
Showing subtle pending state on row
Preserving row position during save
```

---

# 16. Empty States

Empty states should be helpful, not dead.

## 16.1 First-Time Empty State

For a table with no records yet:

```txt
No products yet
Create your first product to start using Inventory, Purchasing, or Sales workflows.
[+ New Product]
```

If the user lacks create permission:

```txt
No products yet
You can view products once your administrator adds them.
```

## 16.2 Filtered Empty State

For a table with filters that return no results:

```txt
No matching products
Try changing or clearing your filters.
[Clear filters]
```

Do not show the first-time onboarding empty state for a filtered empty result.

## 16.3 Module Disabled State

If a module is disabled, the table page should usually not render.

The route should return safe module-disabled behavior, usually `404 MODULE_NOT_FOUND` for normal users.

Do not show disabled module tables to unauthorized users.

---

# 17. Error States

Table errors should be clear and recoverable.

Examples:

```txt
Could not load products.
Try again or contact support if the issue continues.
[Retry]
```

Error states must not expose:

```txt
SQL errors
Prisma stack traces
Supabase secrets
Database URLs
Full request bodies
Internal tenant details
```

Wrong-org access should not render a table error explaining that another org exists. It should fail safely at the route/API level.

---

# 18. Permission-Aware Tables

Permission-aware UI improves usability.

It does not enforce security.

## 18.1 Primary Actions

The `+ New` button should show only when the user has create permission.

Example:

```txt
objects.product.create
inventory.stock_adjustment.create
leave.leave_request.create
```

If the user lacks permission, hide or disable the action depending on context.

## 18.2 Row Actions

Row actions should be filtered by permission.

Examples:

```txt
View: read permission
Edit: update permission
Delete: delete permission
Approve: approve permission
Export: export permission
```

## 18.3 Export Is Separate

Read permission is not export permission.

Tables must not show export actions unless the user has explicit export permission.

Examples:

```txt
objects.customer.export
expenses.expense_claim.export
incidents.incident.export
```

## 18.4 Bulk Actions

Bulk actions are powerful and risky.

For MVP, bulk actions should be avoided unless clearly required.

If implemented, bulk actions require:

- Explicit permission.
- Tenant-scoped selected IDs.
- Server-side revalidation of every selected record.
- Confirmation for destructive actions.
- Tests for cross-tenant ID injection.

---

# 19. Optimistic UI Standards

Tables should use optimistic UI for safe mutations.

Examples:

- Soft delete row.
- Restore row.
- Toggle active status.
- Update simple status.
- Mark as resolved.

Rules:

- Optimistic update happens immediately.
- Server remains authoritative.
- On failure, rollback UI and show toast.
- Do not optimistically display unauthorized success permanently.
- Do not skip server validation.
- Do not use optimistic UI for complex workflows unless rollback is well-defined.

Example flow:

```txt
User clicks Delete
  ↓
Row fades/removes immediately
  ↓
API soft-deletes using verified PlatformContext
  ↓
Success: toast confirms
Failure: row returns, error toast appears
```

Complex financial or stock mutations require caution.

For example, a stock adjustment may optimistically show a pending row, but the final stock balance should come from the server after the transaction completes.

---

# 20. Motion Standards for Tables

Use Motion for React / Framer Motion-style animation sparingly.

Allowed table motion:

```txt
Row insertion fade/slide
Row removal fade/collapse
Subtle layout animation after optimistic delete
Filter result transition
Dialog/sheet transitions for row actions
```

Forbidden table motion:

```txt
Bouncy row animations
Slow page transitions
Animated decoration
Confetti
Motion that delays work
Motion that makes dense tables harder to scan
```

Rule:

```txt
Motion should make state changes clearer.
It should not make the business app feel playful.
```

---

# 21. Keyboard Standards

OneDayOS should be keyboard-friendly.

MVP table keyboard expectations:

- Tab reaches toolbar controls.
- Tab reaches row action buttons.
- Buttons have visible focus states.
- Dialogs trap focus correctly.
- Escape closes dialogs/menus.
- Enter activates focused buttons/links.
- Search input is easy to focus.

Future keyboard enhancements:

- Arrow-key row navigation.
- Command-menu actions.
- Keyboard shortcuts for common actions.
- Saved view switching.

Do not implement advanced shortcuts before basic accessibility works.

---

# 22. Responsive Behavior

Tables are naturally wide.

For desktop and tablet:

- Use full table layout.
- Allow horizontal scroll inside table container when necessary.
- Keep page shell stable.

For mobile:

- Critical workflows should remain usable.
- Horizontal scroll is acceptable for dense operational tables.
- Do not automatically convert every table into cards unless the card pattern is designed and tested.
- Avoid hiding critical columns without a clear alternative.

Mobile table card views are deferred until real usage proves the need.

---

# 23. Table API Query Contract

All table data APIs must follow the Kernel API contract:

```json
{
  "data": {
    "items": [],
    "pagination": {}
  },
  "error": null,
  "meta": {
    "requestId": "req_..."
  }
}
```

Errors follow:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid table query.",
    "details": {}
  },
  "meta": {
    "requestId": "req_..."
  }
}
```

## 23.1 Query Parameters

Allowed common query params:

```txt
search
page
pageSize
sort
status
from
to
```

Module-specific filters are allowed only when validated and allowlisted.

## 23.2 Forbidden Query Inputs

Forbidden from clients:

```txt
orgId
tenantId
raw Prisma where
raw Prisma orderBy
raw SQL
includeDeleted unless explicit admin/restore route
arbitrary include
arbitrary select
```

## 23.3 Tenant Context

Tenant identity comes from:

```txt
session
+ orgSlug route param
+ verified PlatformContext
```

Never from table filter input.

---

# 24. Data Security Rules

Tables must not leak sensitive data.

## 24.1 Sensitive Fields

Sensitive fields should be hidden by default.

Examples:

```txt
Government IDs
Salary
Bank details
Medical notes
Full incident descriptions
Private customer notes
Auth/security metadata
```

A field being present in the database does not mean it belongs in a table.

## 24.2 Events and Row Data

Table row data must not be copied into event payloads casually.

Events should remain minimal.

## 24.3 Logs

Table errors and APIs must not log full rows or full request bodies.

---

# 25. Business Object Table Rules

Business Object tables must reinforce shared ownership.

## 25.1 Product Table

Product table belongs under Records / Business Objects.

It should not be placed only under Inventory.

Inventory may have Inventory-specific product settings, but Product itself is shared.

## 25.2 Customer Table

Customer table belongs under Records / Business Objects.

CRM may show CRM-specific customer profile fields, but Customer itself is shared.

## 25.3 Employee Table

Employee table belongs under Records / Business Objects.

Leave may show leave-related employee data, but Employee itself is shared.

## 25.4 Supplier Table

Supplier table belongs under Records / Business Objects.

Purchasing may show purchasing profile fields, but Supplier itself is shared.

## 25.5 Warehouse Table

Warehouse table belongs under Records / Business Objects.

Inventory may show stock levels by Warehouse, but Warehouse itself is shared.

---

# 26. Module Table Rules

Module tables should show module-owned workflows.

Examples:

```txt
Inventory:
  Stock Levels
  Stock Movements
  Stock Adjustments

Leave:
  Leave Requests
  Leave Types
  Leave Balances

CRM:
  Opportunities
  Pipeline Stages
  Follow-ups

Expenses:
  Expense Claims
  Expense Categories

Assets:
  Assets
  Asset Assignments
  Maintenance Records
```

Module tables must not duplicate Business Object tables.

Bad:

```txt
Inventory Products table as a duplicate Product identity table
CRM Customers table as a duplicate Customer identity table
Leave Employees table as a duplicate Employee identity table
```

Good:

```txt
Products table in Records
Inventory Product Settings table inside Inventory
CRM Customer Profiles inside CRM
Leave Balances inside Leave
```

---

# 27. Export Rules

Export is deferred as a generic engine, but table-level export may eventually exist.

Rules:

- Export requires explicit export permission.
- Export must be tenant-scoped.
- Export must use allowlisted fields.
- Export must exclude sensitive fields by default.
- Export must not use the same permission as read.
- Export must not be available just because a table is visible.

Do not add export buttons casually during MVP.

---

# 28. Deferred Table Features

The following are deferred:

```txt
Saved views
Column drag/reorder
User-specific column preferences
Organization default views
Bulk edit
Inline spreadsheet editing
Pivot tables
Charts inside tables
Global search across all tables
Realtime multi-user table updates
AI table query assistant
Excel export/import
Virtualization for all tables
Per-client table layouts
```

Some of these may become useful later, but they require evidence and separate documents.

---

# 29. Implementation Guidance

## 29.1 Shared Components

The restarted platform should eventually provide components like:

```txt
DataTable
TableToolbar
TableSearch
TableFilter
TablePagination
StatusBadge
RowActions
EmptyState
TableSkeleton
```

Do not let every module implement its own versions.

## 29.2 shadcn/ui Usage

Use shadcn/ui as the base component layer.

But OneDayOS should wrap and standardize where needed.

Bad:

```txt
Every module imports shadcn table and invents its own layout
```

Good:

```txt
Modules use OneDayOS table components built on top of shadcn primitives
```

## 29.3 No Table Library by Default

Do not add a large table library during MVP unless an ADR approves it.

Start with a controlled OneDayOS table component.

If requirements later exceed the custom component, evaluate a dedicated table library through ADR.

Reasons to delay:

- Avoid unnecessary dependency complexity.
- Avoid making generated modules harder to understand.
- Avoid designing for advanced table features before we have real module patterns.

---

# 30. Testing Requirements

## 30.1 Component Tests

Table component tests must cover:

- Headers render correctly.
- Rows render correctly.
- Empty state renders correctly.
- Loading skeleton renders correctly.
- Custom cell renderers work.
- Row actions render based on permission props.
- Dangerous actions require confirmation.
- No hidden `orgId` fields exist in table action forms.
- Keyboard focus works for row actions.

## 30.2 Page Tests

Table page tests should cover:

- Correct title and description.
- Correct primary action visibility.
- Permission-aware actions.
- Empty state for first-time empty data.
- Filtered empty state.
- Error state.
- Loading state if client-rendered.

## 30.3 API Tests

Table API tests must cover:

- Authenticated success.
- Unauthenticated JSON `401`.
- Wrong-org safe `404`.
- Missing permission `403`.
- Client-supplied `orgId` rejection.
- Invalid filter validation.
- Invalid sort validation.
- Invalid page/pageSize validation.
- Soft-deleted records excluded.
- Cross-tenant records excluded.

## 30.4 Service Tests

Service tests must cover:

- `PlatformContext` required.
- Tenant scoping.
- Permission enforcement.
- Module enablement where relevant.
- Filter allowlist.
- Sort allowlist.
- Pagination behavior.
- Soft-delete exclusion.

## 30.5 Generator Tests

Generated modules with list pages must prove:

- Generated table uses shared table component.
- Generated API route uses `/api/orgs/[orgSlug]/[moduleId]/...`.
- Generated schemas reject `orgId`.
- Generated services use `PlatformContext`.
- Generated code does not import raw Prisma in modules.
- Generated client components do not import `@/sdk/server` or `@/kernel/*`.

---

# 31. Accessibility Requirements

Tables must support:

- Semantic table markup where appropriate.
- Header cells marked correctly.
- Buttons with accessible names.
- Focus-visible states.
- Keyboard access to toolbar and row actions.
- Screen-reader-friendly empty/error states.
- Color-independent status meaning.
- Sufficient contrast in light and dark mode.

Do not rely only on badge color to communicate state.

Use text labels.

---

# 32. Common Anti-Patterns

## 32.1 Generic Admin Template Table

Bad:

```txt
Large gray card
Random fake stats above it
Huge search box
Unstyled actions
No density
No permission states
```

Why bad:

It makes OneDayOS feel like a starter template.

## 32.2 Raw Client Filters

Bad:

```json
{
  "where": {
    "orgId": "org_123",
    "status": "active"
  },
  "orderBy": {
    "createdAt": "desc"
  }
}
```

Why bad:

It creates security and query-control risk.

## 32.3 Hidden Org ID Forms

Bad:

```tsx
<input type="hidden" name="orgId" value={orgId} />
```

Why bad:

Tenant identity must come from `PlatformContext`, not the client.

## 32.4 Custom Module Table Styling

Bad:

```txt
Inventory table has its own design
Leave table has its own design
CRM table has its own design
```

Why bad:

It destroys platform consistency.

## 32.5 Overbuilt Spreadsheet UI

Bad:

```txt
Inline editing everywhere
Cell formulas
Drag handles
Column builders
Bulk operations
```

Why bad:

OneDayOS is not Excel. Build business workflows first.

---

# 33. Claude Implementation Rules

When implementing table UI, Claude must follow these rules:

```txt
1. Use shared OneDayOS table components.
2. Do not invent per-module table styling.
3. Do not create hidden orgId fields.
4. Do not accept orgId from query params, body, or local storage.
5. Do not send raw Prisma where/orderBy from the client.
6. Do not implement saved views unless explicitly instructed.
7. Do not implement export unless explicitly instructed.
8. Do not add a table library without ADR approval.
9. Do not build Dynamic Table View Engine from this document.
10. Do not build Reporting or Search from this document.
11. Do not import @/sdk/server in client components.
12. Do not import @/kernel/* in module UI.
13. Do not use full-page spinners for table loading.
14. Do not use arbitrary colors for status badges.
15. Do not claim completion without UI, API, service, and architecture tests where relevant.
```

---

# 34. Acceptance Criteria

This document is satisfied when:

```txt
[ ] Shared table component standard exists.
[ ] Table loading, empty, and error states are standardized.
[ ] Status badge standard exists.
[ ] Row action standard exists.
[ ] Table toolbar standard exists.
[ ] Sorting/filtering query contract is documented.
[ ] Client-supplied orgId is forbidden in table flows.
[ ] Raw Prisma filters/orderBy from client are forbidden.
[ ] Business Object table ownership is visually respected.
[ ] Module table ownership is clear.
[ ] Export remains separated from read permission.
[ ] Bulk actions are deferred or explicitly permissioned.
[ ] Table tests are defined.
[ ] Generator rules include safe table output.
[ ] Claude has clear implementation restrictions.
```

---

# 35. Final Rule

The table system should make OneDayOS feel like serious business software.

Not a template.

Not a spreadsheet clone.

Not a no-code builder.

A fast, premium, consistent operating surface for SME work.

```txt
Good tables make modules easier to build.
Great tables make OneDayOS feel like a platform.
```
