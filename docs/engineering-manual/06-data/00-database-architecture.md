# OneDayOS Engineering Manual — 06 Data / 00 Database Architecture

**Document ID:** `06-data/00-database-architecture`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Date:** July 2026  
**Implementation Allowed:** No, not until approved and frozen  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `13-security/08-production-readiness-gate.md`
- `13-security/09-security-stabilization-new-build-spec.md`
- `04-kernel/00-kernel-overview.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `05-sdk/05-sdk-compatibility-versioning.md`
- `05-sdk/06-sdk-testing-contract.md`

---

# 1. Purpose

This document defines the database architecture for the restarted OneDayOS platform.

The database is not just storage. It is one of the main architectural foundations of OneDayOS.

OneDayOS is intended to operate many client organizations inside one reusable platform. The database must therefore support:

- one shared platform codebase,
- many client organizations,
- strict tenant separation,
- shared Business Objects,
- reusable modules,
- per-organization configuration,
- one-day delivery,
- low operational cost,
- future scaling without rewriting every module.

The database architecture must make it easy to build modules quickly without allowing modules to leak data across organizations, duplicate shared entities, or bypass platform rules.

---

# 2. Core Database Decision

OneDayOS uses:

```txt
One PostgreSQL database
Shared tables
Tenant separation using org_id
One platform deployment
Many organizations
```

This is the correct model for OneDayOS MVP and early growth.

It means:

```txt
organizations
users
roles
permissions
products
customers
suppliers
warehouses
module-owned tables
settings
org_modules
```

all live in the same PostgreSQL database.

Each tenant-scoped record belongs to exactly one organization through `orgId`.

Example:

```txt
products
  id       org_id       code       name
  p1       org_acme     SKU-001    Coffee Beans
  p2       org_beta     SKU-001    Printer Ink
```

Both organizations may use `SKU-001`, but those records are separate because uniqueness and queries are scoped by `orgId`.

---

# 3. Non-Negotiable Database Principles

## 3.1 OneDayOS is not a per-client fork system

Do not create:

```txt
client_a_database
client_b_database
client_c_database
```

Do not create:

```txt
client_a_schema
client_b_schema
client_c_schema
```

Do not create:

```txt
client_a_products
client_b_products
client_c_products
```

The MVP and early platform must use one shared schema and one shared database.

Separate databases may become an enterprise option later, but the platform must not depend on that model.

## 3.2 Tenant scope must be explicit

Every tenant-owned table must have:

```prisma
orgId String
org   Organization @relation(fields: [orgId], references: [id])
```

and every query for tenant data must be scoped to the verified organization from `PlatformContext`.

Correct:

```ts
const db = sdk.getDb(ctx)

const products = await db.product.findMany({
  where: {
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Forbidden:

```ts
const products = await prisma.product.findMany()
```

Forbidden:

```ts
const products = await prisma.product.findMany({
  where: { orgId: body.orgId },
})
```

Forbidden:

```ts
const products = await sdk.getDb(orgId).product.findMany()
```

`orgId` must come from verified `PlatformContext`, never from request body, query string, hidden form input, local storage, or client state.

## 3.3 Modules do not own shared Business Objects

Modules must not create duplicate versions of shared objects.

Forbidden:

```txt
inventory_products
crm_customers
purchasing_suppliers
assets_employees
```

Correct:

```txt
products
customers
suppliers
employees
warehouses
```

Module-specific data belongs in module-owned extension tables.

Example:

```txt
products
  id
  org_id
  code
  name
  unit

inventory_product_profiles
  id
  org_id
  product_id
  reorder_point
  minimum_stock
  valuation_method
```

## 3.4 Database design must support base updates

When OneDayOS is updated, all organizations use the new platform code and database schema.

This is a feature, not a bug.

Therefore, migrations must be:

- safe,
- backward-compatible when possible,
- tested with multiple organizations,
- compatible with per-org feature flags,
- compatible with old data.

## 3.5 The database is shared, but access is never shared

The database physically contains records from many organizations.

Application logic must behave as if every organization has its own private system.

That illusion is created through:

- verified `PlatformContext`,
- `orgId` on every tenant-scoped table,
- tenant-scoped unique constraints,
- tenant-scoped indexes,
- SDK-only database access,
- permission enforcement,
- module enablement checks,
- security regression tests,
- future Row Level Security.

---

# 4. Database Architecture Summary

```txt
PostgreSQL
  ↓
Prisma schema and migrations
  ↓
Kernel database client
  ↓
SDK server database boundary: sdk.getDb(ctx)
  ↓
Kernel services / Business Object services / Module services
  ↓
API routes and server components
```

Modules never talk directly to the raw Prisma client.

Modules call service methods.

Service methods receive verified `PlatformContext`.

Service methods access the database through `sdk.getDb(ctx)` or a module-safe database facade exposed by the SDK.

---

# 5. Database Ownership by Layer

## 5.1 Kernel-owned tables

Kernel-owned tables define platform fundamentals.

Examples:

```txt
organizations
subscriptions
org_modules
users
roles
permissions
user_roles
settings
branches
departments
```

These tables are owned by Kernel because every module depends on them.

Kernel tables must not contain module-specific workflow fields.

## 5.2 Business Object tables

Business Object tables define shared business entities used across modules.

Examples:

```txt
employees
products
product_categories
customers
suppliers
warehouses
```

Business Objects are conceptually their own layer, even if they live in the same Prisma schema as Kernel tables.

They are not owned by Inventory, CRM, HR, Purchasing, or any other module.

## 5.3 Platform Service tables

Platform Service tables are only created after promotion through the Three Independent Use Cases Rule.

Examples, deferred:

```txt
audit_events
notifications
approval_requests
approval_steps
comments
attachments
activity_events
saved_reports
search_index
background_jobs
```

Do not create these tables early just because they sound useful.

## 5.4 Business Module tables

Module tables store domain-specific records.

Examples:

```txt
inventory_stock_balances
inventory_stock_movements
inventory_adjustments
leave_requests
purchase_requests
expense_claims
asset_assignments
visitor_logs
incident_reports
```

Every module-owned table must:

- include `orgId`,
- be scoped to one organization,
- reference shared Business Objects when appropriate,
- use soft delete when record-level deletion is required,
- emit events on mutations,
- enforce permissions through service/API boundaries,
- avoid direct coupling to other modules.

---

# 6. Table Categories

Every database table must belong to one of these categories.

| Category | Has `orgId`? | Example | Notes |
|---|---:|---|---|
| Platform-global | No | future `platform_releases` | Rare. Must not contain tenant data. |
| Tenant root | No | `organizations` | Organization is the tenant boundary. |
| Tenant-scoped Kernel | Yes | `users`, `roles`, `settings` | Belongs to one organization. |
| Tenant-scoped Business Object | Yes | `products`, `employees` | Shared across modules. |
| Tenant-scoped Module | Yes | `inventory_stock_movements` | Owned by one module. |
| Tenant-scoped Platform Service | Yes | future `approval_requests` | Promoted only after repeated need. |
| Join table | Usually yes | `user_roles` | Include `orgId` when it improves tenant enforcement. |
| Audit/history table | Yes | future `audit_events` | Must be tenant-scoped. |

Default assumption:

```txt
If a table contains customer/client/business data, it must have orgId.
```

---

# 7. Tenant Boundary Model

## 7.1 Organization is the tenant

The `Organization` model is the tenant boundary.

An organization represents one paying client company, business, branch group, or operating entity inside OneDayOS.

For MVP:

```txt
One User belongs to one Organization.
```

Future multi-org users require a separate ADR.

## 7.2 `orgSlug` is a locator, not authorization

URLs may contain:

```txt
/acme-corp/dashboard
/api/orgs/acme-corp/inventory/products
```

But `orgSlug` does not authorize access.

The server must verify:

```txt
Authenticated Supabase user
→ matching Prisma User
→ User is active
→ Organization exists
→ Organization is active or access is allowed for suspended-state pages
→ user.orgId === organization.id
```

Only after this may the server create `PlatformContext`.

## 7.3 `orgId` must never come from the client

Clients may submit:

```json
{
  "name": "Product A",
  "code": "SKU-001"
}
```

Clients must not submit:

```json
{
  "orgId": "org_123",
  "name": "Product A"
}
```

If a request body or query string includes `orgId`, protected tenant APIs should reject the request with a validation error.

This is intentional. Rejecting the field makes unsafe client behavior visible.

---

# 8. Prisma as Schema Authority

Prisma is the application schema authority for the restarted OneDayOS build.

All database schema changes must go through Prisma migrations.

Forbidden:

```txt
Manual table creation in Supabase dashboard
Manual ALTER TABLE in production
Manual index creation without migration
Manual enum changes outside migration
Hand-edited database schema not reflected in Prisma
```

Allowed:

```txt
Edit prisma/schema.prisma
Generate migration locally
Review migration SQL
Run migration through approved workflow
Commit schema and migration together
```

## 8.1 Prisma schema naming style

Use Prisma field names in camelCase:

```prisma
model Product {
  id        String   @id @default(cuid())
  orgId     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Use database table names in snake_case through `@@map`:

```prisma
@@map("products")
```

When needed, use field-level mapping:

```prisma
orgId String @map("org_id")
```

Recommended database convention for the restarted build:

```txt
Prisma code: camelCase
Database tables: snake_case plural
Database columns: snake_case
```

This is slightly more explicit than the previous MVP plan and better for long-term SQL readability.

Example:

```prisma
model Product {
  id          String    @id @default(cuid())
  orgId       String    @map("org_id")
  code        String
  name        String
  description String?
  unit        String    @default("pcs")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  deletedBy   String?   @map("deleted_by")

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, code])
  @@index([orgId])
  @@map("products")
}
```

This document allows either all-camel physical columns or snake_case physical columns during the earliest prototype, but the recommended frozen standard is:

```txt
snake_case physical tables and columns
camelCase Prisma fields
```

If Claude starts from scratch, use the recommended standard.

---

# 9. ID Strategy

## 9.1 Default IDs

Default model IDs should use string IDs.

Recommended MVP default:

```prisma
id String @id @default(cuid())
```

This is acceptable for application-owned tables.

## 9.2 Supabase Auth user ID

The Prisma `User.id` must equal the Supabase Auth user UUID.

```prisma
model User {
  id String @id // = Supabase auth.users.id
}
```

Do not generate a separate Prisma user ID for platform users.

This simplifies session lookup:

```txt
Supabase user id
→ Prisma User.id
→ orgId
→ PlatformContext
```

## 9.3 Business-readable codes

Some entities need human-facing codes.

Examples:

```txt
Product.code
Employee.employeeNo
PurchaseRequest.requestNo
StockMovement.movementNo
```

These are not primary keys.

They must be unique only inside an organization.

Example:

```prisma
@@unique([orgId, code])
```

Never use business-readable codes as primary keys.

---

# 10. Required Base Fields

## 10.1 Tenant-scoped business records

Most tenant-scoped records should include:

```prisma
id        String   @id @default(cuid())
orgId     String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

If the record supports soft delete:

```prisma
deletedAt DateTime?
deletedBy String?
```

If the record needs business status:

```prisma
status String
```

Do not misuse `isActive` for deletion.

## 10.2 `isActive` vs `deletedAt`

`isActive` means the business thing is active.

Examples:

```txt
User.isActive = can this user log in?
Employee.isActive = is this employee currently employed?
Organization.isActive = is this organization active?
```

`deletedAt` means the record was soft-deleted from normal views.

Examples:

```txt
Product.deletedAt = product record removed from normal operations
Customer.deletedAt = customer hidden from normal lists
Warehouse.deletedAt = warehouse removed from normal operations
```

Do not use `isActive` as a substitute for soft delete.

---

# 11. Soft Delete Architecture

## 11.1 Default rule

Business data should be soft-deleted unless there is a strong reason to hard-delete.

Soft delete fields:

```prisma
deletedAt DateTime?
deletedBy String?
```

Soft delete action:

```ts
await db.product.update({
  where: {
    id_orgId: {
      id,
      orgId: ctx.org.id,
    },
  },
  data: {
    deletedAt: new Date(),
    deletedBy: ctx.user.id,
  },
})
```

## 11.2 Normal queries exclude deleted records

Normal reads should exclude deleted records:

```ts
await db.product.findMany({
  where: {
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

## 11.3 Do not rely only on Prisma `$extends` for security

A Prisma extension may help apply soft-delete filters automatically, but it is not enough as the only enforcement method.

The previous MVP discovered that some Prisma read paths can bypass limited soft-delete extensions.

Therefore, in the restarted build:

```txt
Explicit deletedAt: null in service queries is required.
Optional SDK query helpers may reduce repetition.
Prisma extension may provide defense-in-depth, not sole enforcement.
```

## 11.4 `findUnique` caution

For tenant-scoped records, avoid plain `findUnique({ where: { id } })` in module services.

Bad:

```ts
await db.product.findUnique({ where: { id } })
```

Good:

```ts
await db.product.findFirst({
  where: {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Better when using composite unique constraints:

```prisma
@@unique([id, orgId])
```

then:

```ts
await db.product.findUnique({
  where: {
    id_orgId: {
      id,
      orgId: ctx.org.id,
    },
  },
})
```

However, even with composite unique lookup, include soft-delete checks when applicable.

## 11.5 Hard delete policy

Hard delete is allowed only for:

- failed registration rollback,
- temporary records,
- test data,
- cleanup of records that are not business records,
- legally required erasure after explicit review,
- data retention policy execution.

Hard delete must not be the default behavior for module business data.

---

# 12. Unique Constraints

## 12.1 Tenant-scoped uniqueness

Most business uniqueness must include `orgId`.

Correct:

```prisma
@@unique([orgId, code])
@@unique([orgId, employeeNo])
@@unique([orgId, module, key])
@@unique([orgId, name])
```

Incorrect:

```prisma
code String @unique
employeeNo String @unique
name String @unique
```

A product code, employee number, department name, or role name should generally be unique inside one organization, not globally across all OneDayOS clients.

## 12.2 Platform-global uniqueness

Global uniqueness is allowed only when the value must truly be globally unique.

Examples:

```prisma
Organization.slug @unique
User.email maybe @unique only if the product forbids same email across orgs
```

For MVP, because one user belongs to one organization and Supabase Auth usually treats email as globally unique inside the Supabase project, user email can effectively be global through Supabase Auth.

Future multi-org users require an ADR.

## 12.3 Nullable unique fields caution

Avoid composite unique constraints involving nullable fields when uniqueness behavior is critical.

PostgreSQL allows multiple `NULL` values in unique constraints. This can surprise developers.

Example risk:

```prisma
@@unique([roleId, module, action, resource])
resource String?
```

If `resource` is nullable, multiple rows with `resource = NULL` may behave differently than intended.

Preferred:

```prisma
resource String @default("*")
@@unique([roleId, module, action, resource])
```

This matches the approved permissions design.

---

# 13. Indexing Strategy

## 13.1 Every tenant-scoped table needs an org index

At minimum:

```prisma
@@index([orgId])
```

This supports standard tenant-scoped queries.

## 13.2 Common list views need compound indexes

If a screen commonly lists records by organization and status:

```prisma
@@index([orgId, status])
```

If a screen commonly lists active, non-deleted records by date:

```prisma
@@index([orgId, deletedAt, createdAt])
```

If a module frequently filters by related Business Object:

```prisma
@@index([orgId, productId])
@@index([orgId, employeeId])
@@index([orgId, warehouseId])
```

## 13.3 Do not over-index early

Indexes speed reads but slow writes and increase storage.

MVP rule:

```txt
Add indexes for tenant scope, foreign keys, unique constraints, and actual list/filter paths.
Do not add speculative indexes for future reports.
```

Reporting-specific indexes should be added when reporting exists.

## 13.4 Foreign key indexes

PostgreSQL does not automatically index every foreign key in all cases. Add explicit indexes for frequently joined or filtered foreign keys.

Example:

```prisma
productId String
warehouseId String

@@index([orgId, productId])
@@index([orgId, warehouseId])
```

---

# 14. Relation Rules

## 14.1 Tenant consistency across relations

If a module record references a Business Object, both records must belong to the same organization.

Example:

```txt
inventory_stock_movements.org_id = org_acme
inventory_stock_movements.product_id = product_123
products.id = product_123
products.org_id must also equal org_acme
```

Prisma cannot always enforce this perfectly with simple foreign keys unless composite keys are used.

Therefore, service code must verify tenant consistency on writes.

Example:

```ts
const product = await db.product.findFirst({
  where: {
    id: input.productId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})

if (!product) {
  throw sdk.errors.notFound('PRODUCT_NOT_FOUND', 'Product not found.')
}
```

Do not trust that a foreign key alone proves tenant safety.

## 14.2 Composite relation strategy

For high-risk relationships, consider composite constraints:

```prisma
model Product {
  id    String @id @default(cuid())
  orgId String

  @@unique([id, orgId])
}

model InventoryStockMovement {
  id        String @id @default(cuid())
  orgId     String
  productId String

  product Product @relation(fields: [productId, orgId], references: [id, orgId])
}
```

This improves database-level tenant consistency.

However, composite relations can increase Prisma schema complexity. Use them selectively where cross-tenant reference risk is high.

MVP recommendation:

```txt
Always verify related records by orgId in service code.
Use composite relations for core/high-risk module tables after patterns stabilize.
```

---

# 15. Transactions

## 15.1 Transaction rule

Use transactions when a business operation writes multiple related records.

Examples:

- registration creates organization, user, subscription, admin role, permissions,
- stock adjustment creates stock movement and updates stock balance,
- purchase receiving creates stock movements and updates purchase status,
- employee creation links User and Employee,
- approval action updates request and creates activity event.

## 15.2 SDK transaction boundary

Transactions must go through SDK server helpers.

Recommended pattern:

```ts
await sdk.db.transaction(ctx, async (tx) => {
  const adjustment = await tx.inventoryAdjustment.create(...)
  await tx.inventoryStockMovement.create(...)
  await tx.inventoryStockBalance.update(...)
  return adjustment
})
```

Do not create raw Prisma transactions directly inside module code unless the SDK explicitly exposes the transaction client.

## 15.3 Events and transactions

Do not emit durable business events before the transaction succeeds.

Correct sequence:

```txt
Start transaction
Write records
Commit transaction
Emit event
Return result
```

For MVP, events may be in-process and non-durable.

Future outbox pattern:

```txt
Start transaction
Write records
Write event_outbox row
Commit transaction
Background worker publishes event
```

The database schema should not require the outbox in MVP, but the architecture must not block it later.

---

# 16. Event Readiness

Every mutation of a shared Business Object must be able to emit an event.

Examples:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
objects.customer.created
objects.supplier.updated
objects.employee.deactivated
```

Module-owned mutations emit module events.

Examples:

```txt
inventory.stock_movement.created
inventory.stock_adjustment.created
leave.leave_request.submitted
purchasing.purchase_request.approved
```

The database does not need an audit table in MVP, but mutation services must be designed so that Audit Log Service can consume events later without retrofitting every module.

---

# 17. Settings and Configuration Storage

## 17.1 Settings table

OneDayOS uses a tenant-scoped settings table:

```prisma
model Setting {
  id        String   @id @default(cuid())
  orgId     String
  module    String
  key       String
  value     Json
  updatedAt DateTime @updatedAt

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, module, key])
  @@index([orgId, module])
  @@map("settings")
}
```

Settings are used for configuration, not business records.

Examples:

```txt
kernel.timezone
kernel.date_format
inventory.default_unit
inventory.low_stock_threshold_mode
crm.pipeline_labels
```

## 17.2 Settings values must be validated

Because `Setting.value` is JSON, every setting must have a Zod schema at the service boundary.

Do not read arbitrary JSON and assume shape.

Correct:

```ts
const parsed = InventorySettingsSchema.parse(setting.value)
```

## 17.3 Do not create one settings column per preference

Avoid bloating `Organization` or module tables with many configuration columns.

Wrong:

```prisma
model Organization {
  inventoryLowStockThreshold Int?
  inventoryEnableSerials Boolean?
  crmDefaultPipeline String?
  leaveMaxDays Int?
}
```

Correct:

```txt
settings
  org_id
  module
  key
  value
```

---

# 18. Feature Flags and Module Enablement

Module availability is stored in `OrgModule`.

```prisma
model OrgModule {
  id        String   @id @default(cuid())
  orgId     String
  moduleId  String
  isEnabled Boolean  @default(true)
  enabledAt DateTime @default(now())

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, moduleId])
  @@index([orgId, isEnabled])
  @@map("org_modules")
}
```

Module code may exist in the platform, but an organization can access it only if:

```txt
organization is active
module is registered
module is enabled for organization
user has permission
```

Do not create separate deployments for different module combinations.

---

# 19. Business Object Minimalism

Business Object tables should contain only lowest-common-denominator fields.

Example `Product`:

```prisma
model Product {
  id          String    @id @default(cuid())
  orgId       String
  code        String
  name        String
  description String?
  categoryId  String?
  unit        String    @default("pcs")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  @@unique([orgId, code])
  @@index([orgId])
}
```

Do not add Inventory-only fields to `Product`:

```txt
reorderPoint
minimumStock
maximumStock
valuationMethod
warehouseLocation
supplierLeadTime
```

Those belong in Inventory or Purchasing extension tables.

Promotion rule:

```txt
If one module needs a field → module extension table.
If two modules need it → still prefer extension table.
If three independent use cases need it → consider moving to Business Object through ADR.
```

---

# 20. Module-Owned Table Pattern

Every module-owned table should follow a consistent shape.

Example:

```prisma
model InventoryStockMovement {
  id          String   @id @default(cuid())
  orgId       String
  productId   String
  warehouseId String
  type        String
  quantity    Decimal
  referenceNo String?
  occurredAt  DateTime @default(now())
  createdBy   String
  createdAt   DateTime @default(now())
  deletedAt   DateTime?
  deletedBy   String?

  org       Organization @relation(fields: [orgId], references: [id])
  product   Product      @relation(fields: [productId], references: [id])
  warehouse Warehouse    @relation(fields: [warehouseId], references: [id])
  creator   User         @relation(fields: [createdBy], references: [id])

  @@index([orgId, occurredAt])
  @@index([orgId, productId])
  @@index([orgId, warehouseId])
  @@map("inventory_stock_movements")
}
```

Naming rule:

```txt
[module]_[entity_plural]
```

Examples:

```txt
inventory_stock_movements
inventory_stock_balances
leave_requests
purchase_requests
expense_claims
asset_assignments
visitor_logs
incident_reports
```

---

# 21. Decimal and Money Fields

Do not use JavaScript floating-point numbers for money or quantities that require precision.

Use Prisma `Decimal` for:

- money,
- quantities,
- unit costs,
- totals,
- weights,
- measurements requiring exactness.

Example:

```prisma
quantity Decimal @db.Decimal(18, 4)
unitCost Decimal? @db.Decimal(18, 2)
```

UI and API layers should serialize decimals safely.

Recommended API response pattern:

```ts
quantity: movement.quantity.toString()
```

or a controlled numeric conversion only where precision loss is acceptable.

---

# 22. Date and Time Fields

Use PostgreSQL timestamps through Prisma `DateTime`.

Store dates in UTC.

Display dates according to organization/user settings.

Common fields:

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
occurredAt DateTime
approvedAt DateTime?
submittedAt DateTime?
```

Do not store formatted date strings as business dates.

Forbidden:

```prisma
createdDate String
```

Allowed only when preserving external document/reference text:

```prisma
externalDateText String?
```

---

# 23. Enums vs Strings

Use strings for early MVP statuses unless the lifecycle is extremely stable.

Reason: Prisma/Postgres enum migrations can become awkward when module workflows evolve quickly.

Preferred MVP pattern:

```prisma
status String @default("draft")
```

Validate allowed values using Zod/service constants.

Example:

```ts
export const LeaveRequestStatus = z.enum([
  'draft',
  'submitted',
  'approved',
  'rejected',
  'cancelled',
])
```

Promote to database enums only if the status set is stable and worth enforcing at DB level.

---

# 24. JSON Fields

JSON is allowed for:

- settings values,
- future field metadata,
- future workflow conditions,
- integration payload snapshots,
- structured but flexible configuration.

JSON is not allowed as a lazy replacement for relational modeling.

Wrong:

```prisma
model Product {
  customEverything Json
}
```

Wrong:

```prisma
model LeaveRequest {
  approvalHistory Json
}
```

Correct:

```prisma
model Setting {
  value Json
}
```

Correct future use:

```prisma
model FieldDefinition {
  validation Json
  visibility Json
}
```

Rule:

```txt
If users need to filter, sort, report, join, permission-check, or audit it frequently, it probably should not be buried only in JSON.
```

---

# 25. Raw SQL Policy

Raw SQL is forbidden in modules by default.

Forbidden in modules:

```ts
await prisma.$queryRaw`SELECT * FROM products`
await prisma.$executeRaw`DELETE FROM products`
```

Raw SQL may be allowed only in:

- Kernel database utilities,
- migrations,
- carefully reviewed Platform Services,
- performance-critical reporting after ADR,
- future RLS setup.

Any raw SQL must include:

- tenant-scope reasoning,
- SQL injection safety,
- test coverage,
- ADR or architecture note if used in runtime code.

---

# 26. Row Level Security Plan

PostgreSQL Row Level Security is a future defense-in-depth layer.

It is not required for the first restarted implementation phase if application-level tenant isolation is correctly enforced and tested.

However, the schema must remain compatible with future RLS.

Future approach:

```sql
SET LOCAL app.org_id = 'org_123';
```

Then policies can use:

```sql
org_id = current_setting('app.org_id')
```

MVP rule:

```txt
Do not implement RLS before core patterns are stable.
Do not use lack of RLS as an excuse for weak application-level isolation.
```

RLS may be considered after:

- Kernel tenancy is stable,
- at least three modules exist,
- data access patterns are proven,
- transaction strategy is clear,
- Prisma compatibility is tested.

---

# 27. Migration Architecture

## 27.1 Migration authority

All schema changes must be committed as Prisma migrations.

Migration files are part of the platform codebase.

A code deployment that depends on a migration must include that migration.

## 27.2 Migration safety rules

Because all organizations share one database, migrations must be conservative.

Prefer:

```txt
Add nullable column
Backfill data
Deploy code that uses column
Later make column required if safe
```

Avoid:

```txt
Add required column without default
Rename column without compatibility window
Drop column used by old code
Change meaning of field silently
Delete tenant data during migration
```

## 27.3 Destructive migrations require review

Any migration that does one of the following requires founder/architect review:

- drops a table,
- drops a column,
- changes a column type,
- changes uniqueness,
- changes tenant scope,
- deletes data,
- rewrites business records,
- changes primary keys,
- changes foreign keys for shared objects.

## 27.4 Migration tests

Before production, migrations must be tested with:

```txt
Org A data
Org B data
Admin user
Staff user
Enabled module
Disabled module
Soft-deleted records
At least one Business Object
At least one module-owned record if modules exist
```

Single-org migration tests are insufficient.

---

# 28. Seed Architecture

Seeds are for:

- local development,
- demo organization,
- test fixtures,
- baseline system roles,
- baseline permissions,
- module demo data.

Seeds are not a replacement for migrations.

## 28.1 Seed requirements

The seed script should create:

```txt
Demo Organization
Subscription
Admin Role
Staff Role
Wildcard Admin Permission
Baseline Staff Permissions
Admin User only if auth strategy supports safe local seed
Branch
Department
Example Business Objects
Enabled demo modules
```

## 28.2 Production seeds

Production seeding must be cautious.

Do not seed fake business data into production client organizations.

Use operator/admin flows for real client onboarding when available.

## 28.3 Idempotency

Seeds must be idempotent.

Use `upsert` where possible.

Running seed twice must not duplicate roles, permissions, settings, or modules.

---

# 29. Backup and Restore Assumptions

Full backup/restore details belong in `06-data/07-backup-restore.md`, but the database architecture must support AppCare.

Assumptions:

- Supabase/PostgreSQL is the system of record.
- Backups are mandatory for AppCare.
- Restore must be tested before serious production rollout.
- Per-tenant restore is harder than full database restore in a shared DB model.
- Destructive changes must consider restore complexity.

Important implication:

```txt
Shared database gives low operational cost, but per-client restore requires careful tooling later.
```

For MVP, acceptable restore model:

```txt
Full database point-in-time restore for disaster recovery.
Manual per-tenant export/import only when absolutely needed.
```

Future work:

```txt
Per-org export
Per-org restore tooling
Audit-based reconstruction
Backup verification jobs
```

---

# 30. Multi-Tenant Update Model

OneDayOS uses one platform database and one platform codebase.

When we deploy a database migration, the schema updates for all organizations.

When we deploy code, the platform updates for all organizations.

Whether an organization can use a feature depends on:

- module enablement,
- feature flags,
- settings,
- roles,
- permissions,
- subscription status.

Therefore, schema changes must support inactive or disabled modules.

Example:

```txt
Add inventory_stock_movements table
```

This table exists globally after migration.

But only organizations with Inventory enabled should use it.

Do not create tables only for specific clients.

---

# 31. Environment Strategy

Database environments should be separate.

```txt
Local development database
Preview/staging database
Production database
```

Do not use production data in local development unless explicitly sanitized.

Environment variables:

```txt
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client code.

---

# 32. Database Access Rules for Claude

When implementing from this manual, Claude must follow these rules.

## 32.1 Allowed

```ts
import { sdk } from '@/sdk/server'

const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const db = sdk.getDb(ctx)
```

```ts
await db.product.findMany({
  where: {
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

```ts
await sdk.db.transaction(ctx, async (tx) => {
  // tenant-scoped writes
})
```

## 32.2 Forbidden

```ts
import { prisma } from '@/kernel/db/client'
```

inside modules.

```ts
sdk.getDb(orgId)
```

anywhere in the restarted build.

```ts
const orgId = body.orgId
```

inside protected tenant APIs.

```ts
where: { id }
```

for tenant-scoped records unless combined with verified tenant scope.

```ts
delete()
deleteMany()
```

for business records unless explicitly approved.

```ts
findUnique({ where: { id } })
```

for tenant-scoped module/business data unless the unique input includes `orgId` and soft-delete implications are handled.

---

# 33. Minimum Database Test Matrix

Every database-sensitive subsystem must be tested with at least two organizations.

Required fixtures:

```txt
Organization A
Organization B
Admin User A
Staff User A
Admin User B
Staff User B
Product A in Organization A
Product B in Organization B
Soft-deleted Product A
Enabled module for A
Disabled module for B
```

Required tests:

```txt
Org A user cannot read Org B record
Org A user cannot update Org B record
Org A user cannot soft-delete Org B record
Org A user cannot reference Org B Business Object in module write
Soft-deleted records do not appear in normal list
Tenant-scoped unique fields allow same code in different orgs
Tenant-scoped unique fields reject duplicate code in same org
Client-supplied orgId is rejected
Raw Prisma import is blocked in modules
sdk.getDb(orgId) does not exist or fails type/lint checks
```

---

# 34. MVP Database Scope

The restarted MVP database should include only what is necessary for Kernel, Business Objects, SDK, module system, and secure first module implementation.

## 34.1 Build now

```txt
organizations
subscriptions
org_modules
users
roles
user_roles
permissions
settings
branches
departments
employees
products
product_categories
customers
suppliers
warehouses
```

## 34.2 Build with first module

For Inventory:

```txt
inventory_stock_balances
inventory_stock_movements
inventory_adjustments
inventory_product_profiles
```

Exact Inventory schema belongs in the Inventory module specification.

## 34.3 Do not build yet

```txt
audit_events
notifications
approval_requests
approval_steps
comments
attachments
activity_events
saved_reports
search_index
background_jobs
dynamic_forms
dynamic_fields
dynamic_views
ai_messages
ai_tool_calls
```

Those belong to future Platform Services or Dynamic Systems after the Three Independent Use Cases Rule proves the need.

---

# 35. Recommended Restarted-Build Prisma Model Skeleton

This is not the full final schema, but it shows the expected style.

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  logoUrl   String?  @map("logo_url")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  subscription Subscription?
  modules      OrgModule[]
  users        User[]
  roles        Role[]
  settings     Setting[]
  branches     Branch[]
  departments  Department[]
  employees    Employee[]
  products     Product[]
  customers    Customer[]
  suppliers    Supplier[]
  warehouses   Warehouse[]

  @@map("organizations")
}

model User {
  id        String   @id // Supabase auth.users.id
  orgId     String   @map("org_id")
  name      String
  email     String
  avatarUrl String?  @map("avatar_url")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  org      Organization @relation(fields: [orgId], references: [id])
  employee Employee?
  roles    UserRole[]

  @@index([orgId])
  @@map("users")
}

model Role {
  id        String   @id @default(cuid())
  orgId     String   @map("org_id")
  name      String
  isSystem  Boolean  @default(false) @map("is_system")
  createdAt DateTime @default(now()) @map("created_at")

  org         Organization @relation(fields: [orgId], references: [id])
  permissions Permission[]
  userRoles   UserRole[]

  @@unique([orgId, name])
  @@index([orgId])
  @@map("roles")
}

model UserRole {
  orgId  String @map("org_id")
  userId String @map("user_id")
  roleId String @map("role_id")

  user User @relation(fields: [userId], references: [id])
  role Role @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
  @@index([orgId])
  @@index([roleId])
  @@map("user_roles")
}

model Permission {
  id         String @id @default(cuid())
  orgId      String @map("org_id")
  roleId     String @map("role_id")
  module     String
  resource   String @default("*")
  action     String
  conditions Json?

  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, module, resource, action])
  @@index([orgId])
  @@map("permissions")
}
```

Important correction from the old MVP direction:

```txt
Permission.resource should not be nullable.
Use '*' for wildcard resource.
```

---

# 36. Implementation Checklist

Claude may implement this database architecture only after this document is approved/frozen.

Implementation must include:

```txt
[ ] Prisma initialized with PostgreSQL
[ ] Prisma schema uses approved naming conventions
[ ] Organization model created
[ ] Subscription model created
[ ] OrgModule model created
[ ] User model uses Supabase user ID as primary key
[ ] Role/UserRole/Permission models created with org scope
[ ] Permission.resource is non-null with '*' wildcard
[ ] Setting.value uses Json
[ ] Branch and Department models created as Kernel org-structure primitives
[ ] Employee model created as Business Object
[ ] Product/ProductCategory models created as Business Objects
[ ] Customer model created as Business Object
[ ] Supplier model created as Business Object
[ ] Warehouse model created as Business Object
[ ] Tenant-scoped models include orgId
[ ] Tenant-scoped unique constraints include orgId
[ ] Tenant-scoped indexes include orgId
[ ] Soft-deletable models include deletedAt/deletedBy
[ ] Prisma client is server-only
[ ] Modules cannot import Prisma directly
[ ] sdk.getDb(ctx) is the database seam
[ ] sdk.getDb(orgId) does not exist
[ ] Migrations run locally
[ ] Seed script is idempotent
[ ] Tests use at least two organizations
[ ] Build/typecheck/test pass
```

---

# 37. Acceptance Criteria

This document is implemented correctly when:

1. OneDayOS has one shared PostgreSQL database for all organizations.
2. Every tenant-scoped table has `orgId`.
3. No module imports raw Prisma.
4. No module calls `sdk.getDb(orgId)`.
5. Database access requires verified `PlatformContext`.
6. Client-supplied `orgId` is rejected in protected tenant APIs.
7. Business Objects are shared and not duplicated inside modules.
8. Module-specific fields live in module-owned tables or extension tables.
9. Tenant-scoped uniqueness includes `orgId`.
10. Soft-deletable business records use `deletedAt` and `deletedBy`.
11. Normal list/detail queries do not show soft-deleted records.
12. Admin wildcard permissions do not bypass tenant isolation.
13. Schema changes are made only through Prisma migrations.
14. Migration and seed flows work on a real PostgreSQL database.
15. Tests prove cross-tenant reads and writes are denied.
16. Tests prove same business codes may exist in different organizations.
17. Tests prove duplicate business codes are rejected inside the same organization.
18. The schema remains compatible with future RLS.
19. The schema does not include premature Platform Service tables.
20. The database supports one platform update serving many organizations.

---

# 38. Explicit Non-Goals

Do not implement in this database phase:

- FastAPI backend database layer,
- database-per-tenant routing,
- schema-per-tenant routing,
- Row Level Security,
- audit log tables,
- notification tables,
- approval workflow tables,
- attachment tables,
- dynamic form tables,
- dynamic CRUD metadata tables,
- search index tables,
- AI memory tables,
- module marketplace tables,
- per-organization module version pinning,
- custom fields engine.

These may be designed later, but they are not part of the restarted core database architecture.

---

# 39. Architectural Notes

## 39.1 Why not database-per-client now?

Database-per-client sounds safer, but it would make one-day delivery and AppCare harder too early.

It would require:

- per-client migrations,
- per-client backups,
- per-client connection routing,
- per-client seed scripts,
- per-client debugging,
- harder cross-client updates,
- more operational cost.

OneDayOS needs platform leverage first.

The correct MVP tradeoff is:

```txt
Shared database
Strong org_id tenancy
Verified PlatformContext
Security tests
Future RLS defense-in-depth
```

## 39.2 Why not store everything as JSON metadata?

Because OneDayOS is not just a no-code toy.

Core business records need:

- reliable constraints,
- indexes,
- joins,
- reporting,
- permissions,
- auditability,
- data integrity.

Metadata-driven forms and CRUD may come later, but the foundational business data model should remain relational.

## 39.3 Why not build all Platform Service tables now?

Because the Three Independent Use Cases Rule exists to prevent premature infrastructure.

Tables create gravity. Once they exist, Claude and future engineers will start designing around them, even if the real product does not need them yet.

The restarted build should be lean, secure, and extensible — not bloated.

---

# 40. Next Documents

After this document is approved, the recommended next data documents are:

```txt
06-data/01-tenancy-data-isolation.md
06-data/02-prisma-conventions.md
06-data/03-soft-delete-archival.md
06-data/04-migrations-seeding.md
06-data/05-data-validation-zod.md
06-data/06-row-level-security-plan.md
06-data/07-backup-restore.md
```

However, before writing all of them, it may be useful to write:

```txt
07-business-objects/00-business-object-philosophy.md
```

because Business Objects and database architecture are tightly connected.
