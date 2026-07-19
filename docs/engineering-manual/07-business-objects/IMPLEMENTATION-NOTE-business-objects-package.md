# Business Objects Package Implementation Note

Status: Implemented
Date: 2026-07

## Scope

The Business Objects Package implements shared platform records for:

- Employee
- Product
- ProductCategory
- Customer
- Supplier
- Warehouse

These records live in the shared Business Objects layer, not in modules.

## Boundaries

- Inventory does not own Product or Warehouse.
- CRM does not own Customer.
- Purchasing does not own Supplier.
- Leave does not own Employee.
- Modules may reference or extend Business Objects later, but must not duplicate their identity.
- No module extension tables were added in this package.
- No Inventory, CRM, Leave, Purchasing, Assets, or other business module behavior was implemented.

## Implemented Surfaces

- Tenant-scoped Prisma models and migration SQL.
- Strict Zod create/update schemas.
- Object permissions in the `objects.*.*` namespace.
- Object events in the `objects.*.*` namespace with minimal payloads.
- Server services using `PlatformContext` and `sdk.getDb(ctx)`.
- Org-scoped APIs under `/api/orgs/[orgSlug]/objects/...`.
- Records UI under `/[orgSlug]/records/...`.
- Architecture checks for duplicate Business Object identities in modules and generated module templates.

## Deferred

- Module-specific extension tables.
- Import/export.
- Dynamic Forms and Dynamic CRUD.
- Search, Reporting, Comments, Attachments, Activity Feed, Notifications, and Approval Workflow.
- Detailed object profile pages beyond list/new/edit screens.
- Demo seed data for Business Objects.
