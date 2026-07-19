# OneDayOS Engineering Manual — 09 CLI Generators / 02 CRUD Generator

**Document ID:** `09-cli-generators/02-crud-generator.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Allowed:** No — Deferred Specification  
**Author:** ChatGPT acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Applies To:** Restarted OneDayOS platform build  

---

# 1. Purpose

This document defines the future **CRUD Generator** for OneDayOS.

The CRUD Generator is a CLI tool that will eventually generate secure, tenant-aware, permission-enforced CRUD resources using OneDayOS conventions.

It should help create list pages, detail pages, forms, API routes, services, schemas, permissions, events, and tests for a business resource.

However, this document is a **specification only**.

The CRUD Generator must **not** be implemented yet.

The goal right now is to define the contract so Claude Code does not later invent an unsafe or generic CRUD scaffolder.

---

# 2. Current Status

```txt
Status: Deferred
Implementation: Not allowed yet
Reason: CRUD patterns are not mature enough
```

The restarted OneDayOS build should first implement:

```txt
Kernel
SDK
Database architecture
Business Objects
Module System
Module Generator
Design System
At least one real module, preferably Inventory
```

Only after those are stable should the CRUD Generator be implemented.

---

# 3. Why This Document Exists Now

The CRUD Generator is strategically important because OneDayOS wants to deliver internal business software very quickly.

But CRUD generation is dangerous if implemented too early.

A bad CRUD generator will scale bad architecture faster than a human can write it manually.

The previous MVP already showed why this matters. The old generator/scaffold direction produced or encouraged unsafe patterns such as:

```txt
/api/[module] routes instead of tenant-scoped APIs
loose orgId handling
sdk.getDb(orgId)
auth-only API protection
weak placeholder tests
manifest self-registration
client-supplied tenant identity
```

The restarted platform must not repeat those patterns.

The CRUD Generator must encode the Engineering Manual, not bypass it.

---

# 4. Relationship to Other Generators and Systems

## 4.1 Module Generator

The Module Generator creates a complete module shell.

Example:

```bash
npm run module:create -- inventory
```

It creates the module boundary:

```txt
manifest
permissions
service files
schemas
events
navigation
AI context
docs
tests
routes/pages skeletons
```

The Module Generator answers:

> “Create a business capability package.”

---

## 4.2 CRUD Generator

The CRUD Generator creates a resource inside an existing module or Business Object area.

Example:

```bash
npm run crud:create -- \
  --module inventory \
  --resource stock-adjustment \
  --type module-owned
```

It answers:

> “Create secure CRUD for this resource using existing OneDayOS architecture.”

---

## 4.3 Dynamic CRUD Engine

The Dynamic CRUD Engine is a future runtime system that renders CRUD screens dynamically from metadata.

That is not the same as this generator.

```txt
CRUD Generator = static code generation
Dynamic CRUD Engine = runtime metadata-driven CRUD
```

The CRUD Generator may eventually use metadata, but it still produces conventional code files.

The Dynamic CRUD Engine remains deferred until the platform has enough real hand-coded patterns.

---

# 5. Core Rule

```txt
The CRUD Generator must generate production-shaped CRUD, not demo-shaped CRUD.
```

Generated CRUD must be:

```txt
tenant-aware
permission-enforced
module-aware
soft-delete aware
event-emitting
validated with Zod
tested against cross-tenant access
design-system compliant
SDK-only
safe for AI-assisted development
```

If the generator cannot produce secure CRUD, it should not generate anything.

---

# 6. Implementation Gate

The CRUD Generator may not be implemented until all of the following are true:

```txt
[ ] Production Readiness Gate document is frozen
[ ] Kernel auth, tenancy, authorization, and API contracts are implemented and tested
[ ] SDK public API is implemented and tested
[ ] sdk.getDb(ctx) is implemented
[ ] Module Generator is implemented and secure-by-default
[ ] Business Object services exist for Employee, Product, Customer, Supplier, Warehouse
[ ] At least one official module has been implemented manually
[ ] At least three CRUD-like resources have been hand-coded and reviewed
[ ] Design System table and form standards are frozen
[ ] Generated module tests are meaningful, not placeholder tests
```

Recommended trigger:

```txt
Inventory has at least three hand-coded resources:
- stock movement
- stock adjustment
- reorder rule
```

or equivalent patterns from separate modules.

---

# 7. Non-Goals

The CRUD Generator must not:

```txt
build the Dynamic CRUD Engine
create a runtime no-code platform
auto-design the database without review
run Prisma migrations automatically
generate FastAPI / Python backend files
generate SQLAlchemy / Alembic files
create per-client forks
create Platform Services prematurely
duplicate Business Objects inside modules
trust client-supplied orgId
generate APIs outside tenant-scoped routes
generate auth-only APIs
generate raw Prisma access inside modules
generate hard deletes for business data
generate placeholder tests that prove nothing
```

---

# 8. CRUD Target Types

The generator must support different target types, because not all CRUD belongs to the same architectural layer.

## 8.1 Business Object CRUD

Business Object CRUD manages shared entities such as:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Business Object CRUD belongs to the Business Objects layer.

Example route:

```txt
/api/orgs/[orgSlug]/objects/products
```

Example page route:

```txt
/[orgSlug]/objects/products
```

Example permission:

```txt
objects.product.create
```

Example event:

```txt
objects.product.created
```

The generator must not place Product CRUD under Inventory.

Wrong:

```txt
/api/orgs/[orgSlug]/inventory/products
inventory.product.created
```

Correct:

```txt
/api/orgs/[orgSlug]/objects/products
objects.product.created
```

---

## 8.2 Module-Owned CRUD

Module-owned CRUD manages records owned by a specific business module.

Examples:

```txt
Inventory Stock Movement
Inventory Stock Adjustment
Leave Request
Purchase Request
Expense Claim
Asset Assignment
Visitor Log Entry
Incident Report
```

Example route:

```txt
/api/orgs/[orgSlug]/inventory/stock-adjustments
```

Example page route:

```txt
/[orgSlug]/inventory/stock-adjustments
```

Example permission:

```txt
inventory.stock_adjustment.create
```

Example event:

```txt
inventory.stock_adjustment.created
```

---

## 8.3 Module Extension CRUD

Module extension CRUD manages module-specific data attached to a Business Object.

Examples:

```txt
InventoryProductExtension
PurchasingSupplierExtension
SalesCustomerExtension
HRProfileExtension
```

Example:

```txt
Product = shared Business Object
InventoryProductExtension = Inventory-specific fields around Product
```

The generator must clearly separate:

```txt
Product permissions
Inventory extension permissions
Product events
Inventory extension events
```

Creating an Inventory extension for a Product may require:

```txt
objects.product.read
inventory.product_extension.create
```

If the operation also creates a new Product, it may require:

```txt
objects.product.create
inventory.product_extension.create
```

---

# 9. Proposed CLI Shape

The final CLI syntax may be adjusted later, but this is the recommended contract.

## 9.1 Module-Owned Resource

```bash
npm run crud:create -- \
  --module inventory \
  --resource stock-adjustment \
  --type module-owned
```

## 9.2 Business Object Resource

```bash
npm run crud:create -- \
  --object product \
  --type business-object
```

## 9.3 Module Extension Resource

```bash
npm run crud:create -- \
  --module inventory \
  --resource product-extension \
  --extends product \
  --type module-extension
```

## 9.4 Dry Run

```bash
npm run crud:create -- \
  --module inventory \
  --resource stock-adjustment \
  --type module-owned \
  --dry-run
```

Dry run must show:

```txt
files to create
files to modify
permissions to add
events to add
manifest changes
test files to create
Prisma model assumptions
manual follow-up steps
```

## 9.5 Check Mode

```bash
npm run crud:create -- \
  --module inventory \
  --resource stock-adjustment \
  --type module-owned \
  --check
```

Check mode validates whether existing generated CRUD still follows the generator contract.

---

# 10. Required Generator Input

The generator must not infer everything from a resource name.

At minimum, it needs structured metadata.

Recommended future input file:

```txt
src/modules/[moduleId]/resources/[resource]/crud.config.ts
```

or:

```txt
crud/[moduleId].[resource].config.ts
```

The exact location may be finalized during implementation, but the contract should remain stable.

---

# 11. CRUD Metadata Contract

A future CRUD config should look conceptually like this:

```ts
type CrudTargetType = 'business-object' | 'module-owned' | 'module-extension'

type CrudConfig = {
  type: CrudTargetType

  identity: {
    moduleId?: string
    objectId?: string
    resourceId: string
    label: string
    labelPlural: string
    routeSegment: string
    tableName: string
    prismaModel: string
  }

  ownership: {
    tenantScoped: true
    softDelete: true
    ownerLayer: 'business-objects' | 'module'
    extendsObject?: string
  }

  permissions: PermissionRequirement[]

  routes: {
    apiBase: string
    pageBase: string
  }

  fields: CrudField[]

  table: CrudTableConfig
  form: CrudFormConfig
  events: CrudEventConfig
  tests: CrudTestConfig
}
```

This type is illustrative. The final implementation may rename fields, but the information must exist.

---

# 12. Field Metadata Requirements

Each CRUD field must declare enough metadata for validation, forms, tables, import/export future, and AI assistance.

Example:

```ts
type CrudField = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  readonly?: boolean
  create?: boolean
  update?: boolean
  list?: boolean
  detail?: boolean
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  helpText?: string
  placeholder?: string
  relation?: RelationConfig
  validation?: ValidationConfig
}
```

Supported MVP field types:

```txt
text
textarea
number
money
date
datetime
boolean
email
phone
url
select
enum
relation
```

Deferred field types:

```txt
polymorphic relation
formula
computed database expression
file upload
rich text
JSON custom fields
workflow state machine
field-level ABAC
branch-scoped visibility
```

---

# 13. Schema Generation Rules

The generator must create Zod schemas for:

```txt
create body
update body
route params
list query params
restore params, if restore enabled
bulk action body, if bulk actions enabled later
```

## 13.1 Strict Object Rule

Generated request body schemas must use strict object validation.

Conceptual example:

```ts
export const CreateStockAdjustmentSchema = z.strictObject({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int(),
  reason: z.string().min(1),
})
```

Generated schemas must reject unknown keys.

This is required so `orgId`, `userId`, `roleId`, `deletedAt`, `deletedBy`, and other server-owned fields cannot silently pass through request bodies.

## 13.2 Forbidden Client Fields

Generated create/update schemas must reject:

```txt
orgId
createdAt
updatedAt
deletedAt
deletedBy
createdBy
updatedBy
roleIds
permissions
isSystem
```

If a generated schema allows client-supplied `orgId`, the generator is broken.

## 13.3 Server-Owned Fields

The service layer owns:

```txt
orgId
createdAt
updatedAt
deletedAt
deletedBy
createdBy
updatedBy
actor/user context
```

These values must come from verified `PlatformContext` or server logic.

---

# 14. Route Generation Rules

## 14.1 Module-Owned API Routes

Generated module APIs must use this shape:

```txt
/api/orgs/[orgSlug]/[moduleId]/[resource]/route.ts
/api/orgs/[orgSlug]/[moduleId]/[resource]/[id]/route.ts
```

Example:

```txt
/api/orgs/acme-corp/inventory/stock-adjustments
/api/orgs/acme-corp/inventory/stock-adjustments/adj_123
```

## 14.2 Business Object API Routes

Generated Business Object APIs must use this shape:

```txt
/api/orgs/[orgSlug]/objects/[object]/route.ts
/api/orgs/[orgSlug]/objects/[object]/[id]/route.ts
```

Example:

```txt
/api/orgs/acme-corp/objects/products
/api/orgs/acme-corp/objects/products/prod_123
```

## 14.3 Forbidden API Routes

The generator must not create:

```txt
/api/[module]
/api/[module]/[id]
/api/inventory?orgId=...
/api/products?orgId=...
/api/kernel/[business-resource]
```

Tenant identity must never be supplied through query strings or request bodies.

---

# 15. Page Route Generation Rules

## 15.1 Module-Owned Pages

Generated module pages should use this shape:

```txt
src/app/(platform)/[orgSlug]/[moduleId]/[resource]/page.tsx
src/app/(platform)/[orgSlug]/[moduleId]/[resource]/new/page.tsx
src/app/(platform)/[orgSlug]/[moduleId]/[resource]/[id]/page.tsx
src/app/(platform)/[orgSlug]/[moduleId]/[resource]/[id]/edit/page.tsx
```

Example:

```txt
/[orgSlug]/inventory/stock-adjustments
/[orgSlug]/inventory/stock-adjustments/new
/[orgSlug]/inventory/stock-adjustments/[id]
/[orgSlug]/inventory/stock-adjustments/[id]/edit
```

## 15.2 Business Object Pages

Generated Business Object pages should use this shape:

```txt
src/app/(platform)/[orgSlug]/objects/[object]/page.tsx
src/app/(platform)/[orgSlug]/objects/[object]/new/page.tsx
src/app/(platform)/[orgSlug]/objects/[object]/[id]/page.tsx
src/app/(platform)/[orgSlug]/objects/[object]/[id]/edit/page.tsx
```

## 15.3 Client Component Params Rule

Generated client components must use:

```ts
useParams()
```

They must not accept `params` as a prop.

This preserves compatibility with the Next.js App Router pattern already adopted by the manual.

---

# 16. Service Generation Rules

Generated services must be server-only.

They must receive verified `PlatformContext`.

Correct:

```ts
export async function listStockAdjustments(
  ctx: PlatformContext,
  query: ListStockAdjustmentsInput,
) {
  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'read',
  })

  const db = sdk.getDb(ctx)

  return db.stockAdjustment.findMany({
    where: {
      orgId: ctx.org.id,
      deletedAt: null,
    },
  })
}
```

Forbidden:

```ts
export async function listStockAdjustments(orgId: string) {}
export async function listStockAdjustments(input: { orgId: string }) {}
sdk.getDb(orgId)
prisma.stockAdjustment.findMany(...)
```

---

# 17. Permission Generation Rules

The generator must create or update permission declarations using full permission objects.

Example:

```ts
export const stockAdjustmentPermissions = [
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'read',
    label: 'View stock adjustments',
  },
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
    label: 'Create stock adjustments',
  },
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'update',
    label: 'Update stock adjustments',
  },
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'delete',
    label: 'Delete stock adjustments',
  },
]
```

Generated permissions must not include wildcard permissions.

Forbidden in generated module manifests:

```ts
{ module: '*', resource: '*', action: '*' }
```

Admin wildcard grants are seeded at the role level, not declared by module resources.

---

# 18. Authorization Gates

Every generated CRUD operation must enforce:

```txt
1. Authentication
2. Tenant membership
3. Module enablement, for module-owned/module-extension resources
4. Permission
5. Input validation
6. Tenant-scoped database access
```

The order matters.

Tenant membership must be verified before resource access.

Permission checks must never bypass tenant validation.

Module enablement must be checked separately from user permissions.

---

# 19. API Handler Pattern

Generated API routes should use the SDK API wrapper once implemented.

Conceptual example:

```ts
export const GET = sdk.api.handleOrgModuleRoute(
  async ({ req, params, ctx }) => {
    const query = ListStockAdjustmentsQuerySchema.parse(req.nextUrl.searchParams)

    const data = await StockAdjustmentService.list(ctx, query)

    return sdk.api.ok(data)
  },
  {
    module: 'inventory',
    permission: {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'read',
    },
  },
)
```

If the wrapper is not yet implemented, generated routes must still follow the same logical sequence manually.

The generator must never use page-style redirect auth helpers inside API routes.

API routes return JSON only.

---

# 20. API Response Contract

Generated APIs must return the Kernel API contract:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

Required statuses:

```txt
200 OK for successful reads/updates/deletes
201 Created for successful creates
400 Bad Request for malformed input
401 Unauthorized for unauthenticated API calls
403 Forbidden for authenticated but unauthorized calls
404 Not Found for missing resource, wrong tenant, or disabled module safe responses
409 Conflict for uniqueness/business conflicts
422 Unprocessable Entity only if explicitly standardized later
500 Internal Server Error for unexpected server errors
```

Generated APIs must not:

```txt
redirect to login
return HTML for API auth failure
throw unhandled errors to clients
return raw Zod errors directly without normalization
leak whether another organization's resource exists
```

---

# 21. Database Access Rules

Generated CRUD must use:

```ts
sdk.getDb(ctx)
```

Generated CRUD must not use:

```ts
sdk.getDb(orgId)
prisma
PrismaClient
raw SQL
```

## 21.1 Tenant Scope

Every tenant-scoped query must include:

```ts
orgId: ctx.org.id
```

## 21.2 Soft Delete Scope

Normal reads must include:

```ts
deletedAt: null
```

## 21.3 Tenant-Safe ID Lookup

Forbidden:

```ts
findUnique({ where: { id } })
```

Required pattern:

```ts
findFirst({
  where: {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

or a composite unique constraint that includes `orgId`.

---

# 22. Prisma Model Generation Rules

The CRUD Generator should not automatically modify `schema.prisma` in its first implementation.

Recommended MVP generator behavior:

```txt
Generate CRUD code against an existing Prisma model.
If model does not exist, fail with a clear message.
```

Optional future behavior:

```txt
--model-fragment
```

This may generate a suggested Prisma model fragment as a Markdown or `.prisma.fragment` file, but it must not automatically run migrations.

## 22.1 Required Tenant-Scoped Model Shape

A generated model proposal for business data must include:

```prisma
id        String   @id @default(cuid())
orgId     String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
deletedAt DateTime?
deletedBy String?
```

It should usually include:

```prisma
@@index([orgId])
@@index([orgId, deletedAt])
@@unique([id, orgId])
```

## 22.2 Migration Safety

The generator must not run:

```bash
prisma migrate dev
prisma migrate deploy
prisma db push
```

The generator may print next steps, but a human or Claude implementation step must apply migrations under the migration manual.

---

# 23. Soft Delete Generation Rules

Generated delete behavior must be soft delete.

Correct:

```ts
await db.stockAdjustment.updateMany({
  where: {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  },
  data: {
    deletedAt: new Date(),
    deletedBy: ctx.user.id,
  },
})
```

Forbidden:

```ts
await db.stockAdjustment.delete({ where: { id } })
await db.stockAdjustment.deleteMany({ where: { orgId } })
```

Generated delete operations must emit deleted events only after a successful soft delete.

If no row is affected, return safe not found behavior.

---

# 24. Restore Generation Rules

Restore should not be generated by default for every resource.

It may be generated only when explicitly enabled:

```bash
--with-restore
```

Restore requires a separate permission:

```txt
[module].[resource].restore
```

or:

```txt
objects.[object].restore
```

Restore route shape:

```txt
POST /api/orgs/[orgSlug]/[moduleId]/[resource]/[id]/restore
POST /api/orgs/[orgSlug]/objects/[object]/[id]/restore
```

Restore must:

```txt
use PlatformContext
check restore permission
scope by orgId
only restore soft-deleted records
emit restored event
return JSON only
```

---

# 25. Event Generation Rules

Generated CRUD services must emit events after successful mutations.

## 25.1 Module-Owned Events

Example:

```txt
inventory.stock_adjustment.created
inventory.stock_adjustment.updated
inventory.stock_adjustment.deleted
inventory.stock_adjustment.restored
```

## 25.2 Business Object Events

Example:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored
```

## 25.3 Event Payload Rules

Event payloads must not include:

```txt
orgId
full Prisma records
secrets
PII-heavy snapshots
raw request bodies
```

Recommended payload:

```ts
{
  id: record.id,
  changedFields?: ['name', 'status'],
}
```

The EventEnvelope contains tenant and actor context.

Payloads must remain small and stable.

---

# 26. UI Generation Rules

Generated UI must follow the OneDayOS Design System.

It must not look like a generic admin template.

## 26.1 List Page

Generated list pages should include:

```txt
page title
short description
primary action
permission-aware action visibility
premium table layout
empty state
loading skeleton
error state
basic search/filter if configured
row actions
pagination if configured
```

## 26.2 Detail Page

Generated detail pages should include:

```txt
entity heading
key metadata
status badge if relevant
permission-aware actions
related records section if configured
activity placeholder only if Activity Feed service exists later
```

## 26.3 Create/Edit Forms

Generated forms should include:

```txt
React Hook Form
Zod resolver
field help text
tooltips for non-obvious fields
server validation error display
dirty-state behavior
save/cancel actions
keyboard submit
loading state
```

Forms must not include hidden `orgId` fields.

## 26.4 Delete UI

Delete behavior should include:

```txt
confirmation dialog for destructive actions
optimistic UI if safe
rollback on failure
toast feedback
permission-aware visibility
```

---

# 27. Table Generation Rules

Generated tables must use the shared OneDayOS table standard.

A generated table should support:

```txt
consistent density
column labels
empty state
loading skeleton
row actions
permission-aware action visibility
safe active-state behavior
responsive fallback
```

The generator must not create custom one-off table styling unless the table system explicitly supports variants.

---

# 28. Form Generation Rules

Generated forms must follow the Form Standards document once frozen.

Until Dynamic Forms exist, generated forms are still normal React components.

The generator should not introduce a runtime form engine.

Generated form components must be easy for Claude or a human to modify manually.

---

# 29. Search and Filter Rules

Generated CRUD may include simple local/resource search.

It must not create the Platform Search Service.

Allowed:

```txt
simple text filter on configured fields
status filter
date range filter
relation filter
sort by configured columns
```

Forbidden until Platform Search exists:

```txt
global cross-module search engine
search indexing service
vector search
AI search
background indexing jobs
```

---

# 30. Import and Export Rules

Import/export should be deferred unless explicitly requested and supported by the manual.

Default CRUD generation must not include import/export.

If later enabled:

```txt
import requires separate permission
export requires separate permission
exports must be tenant-scoped
imports must validate rows with Zod
imports must reject orgId columns
imports must produce row-level error reports
bulk operations must emit events carefully
```

---

# 31. File Output Contract

For a module-owned resource, the generator should create files similar to:

```txt
src/modules/[moduleId]/resources/[resource]/
  schema.ts
  types.ts
  service.ts
  events.ts
  table.ts
  form.ts
  permissions.ts
  __tests__/
    schema.test.ts
    service.test.ts
    events.test.ts

src/app/(platform)/[orgSlug]/[moduleId]/[resource]/
  page.tsx
  list-client.tsx
  new/page.tsx
  [id]/page.tsx
  [id]/edit/page.tsx

src/app/api/orgs/[orgSlug]/[moduleId]/[resource]/
  route.ts
  [id]/route.ts
```

For Business Object CRUD, the generator should create or modify files in the Business Object area, not inside a module folder.

The exact physical Business Object folder structure must be finalized in the Business Object implementation documents before generating Business Object CRUD.

---

# 32. Manifest Update Rules

For module-owned CRUD, the generator may update:

```txt
module manifest permissions
module manifest nav items
module manifest page route declarations
module manifest API route declarations
module manifest event declarations
module docs
module AI context metadata
```

It must not:

```txt
self-register the module
insert executable business logic into the manifest
add wildcard permissions
add dependencies casually
add Platform Service metadata prematurely
```

If manifest modification is ambiguous, the generator should fail and print a manual patch suggestion.

---

# 33. Navigation Update Rules

Generated CRUD may add a navigation item only if requested or configured.

Example:

```ts
{
  label: 'Stock Adjustments',
  href: '/inventory/stock-adjustments',
  requiredPermission: {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'read',
  },
}
```

Navigation visibility remains server-resolved through verified `PlatformContext`.

Generated client components must not fetch permissions to decide sidebar visibility.

---

# 34. AI Context Update Rules

The generator may add AI context metadata, but must keep it descriptive.

Allowed:

```txt
resource description
common user questions
safe query examples
field explanations
forbidden actions
```

Forbidden:

```txt
AI action execution without permissions
AI access to raw database queries
AI bypass of service layer
AI context containing secrets or tenant data
```

AI support remains a future platform layer.

The CRUD Generator should only prepare metadata.

---

# 35. Test Generation Requirements

Generated CRUD must include real tests.

Placeholder tests are forbidden.

## 35.1 Required Schema Tests

```txt
valid create input passes
missing required field fails
unknown key fails
client-supplied orgId fails
server-owned fields fail
invalid relation id shape fails
update schema rejects immutable fields
```

## 35.2 Required Service Tests

```txt
service requires PlatformContext
service enforces permission
service scopes list by ctx.org.id
service excludes deleted records
service creates using ctx.org.id
service soft-deletes instead of hard-deleting
service emits event after successful mutation
service does not emit event after failed mutation
service rejects cross-tenant resource access
```

## 35.3 Required API Tests

```txt
unauthenticated request returns 401 JSON
authenticated but unauthorized request returns 403 JSON
wrong org returns tenant-safe 404
module disabled returns safe 404 for module routes
validation error returns normalized 400 JSON
client-supplied orgId is rejected
successful create returns 201 JSON
successful update returns 200 JSON
successful soft delete returns 200 JSON
API never redirects to login
API never returns HTML auth response
```

## 35.4 Required Cross-Tenant Tests

Every generated tenant-scoped resource must test at least two organizations:

```txt
Org A user cannot list Org B records
Org A user cannot read Org B record by id
Org A user cannot update Org B record by id
Org A user cannot delete Org B record by id
Org A user cannot restore Org B record by id
```

## 35.5 Required Permission Tests

```txt
admin can perform allowed action
staff without permission is denied
read does not imply create
create does not imply update
update does not imply delete
module enablement does not imply permission
permission does not bypass module disabled state
wildcard admin permission does not bypass tenant isolation
```

---

# 36. Architecture Checks

The generator must either create or satisfy architecture checks that reject forbidden patterns.

Forbidden generated patterns:

```txt
import { prisma } from '@/kernel/db/client'
import { PrismaClient } from '@prisma/client' inside modules
import '@/kernel/*' inside modules
import another module from a module
sdk.getDb(orgId)
request.nextUrl.searchParams.get('orgId')
body.orgId
findUnique({ where: { id } }) on tenant-scoped resources
.delete({ where: ... }) on business data
API route using redirect-based auth helper
API route without permission enforcement
service method without PlatformContext
mutation without event emission
Zod object that allows unknown keys
```

The generator should eventually support:

```bash
npm run check:architecture
```

or integrate with the existing architecture check system.

---

# 37. Error Handling Rules

Generated CRUD must map expected failures to standard API errors.

Examples:

```txt
Invalid input → VALIDATION_ERROR
Unauthenticated → UNAUTHENTICATED
Unauthorized → FORBIDDEN
Wrong org resource → NOT_FOUND
Disabled module → MODULE_NOT_FOUND
Duplicate unique field → CONFLICT
Deleted record access → NOT_FOUND
Unexpected failure → INTERNAL_SERVER_ERROR
```

Generated routes must not leak stack traces or raw database error messages.

---

# 38. Conflict Handling

Generated CRUD should support conflict errors for unique constraints.

Example:

```txt
Product code already exists in this organization.
```

But the API must not leak cross-tenant uniqueness information.

Correct uniqueness scope:

```txt
unique within organization
```

Wrong:

```txt
unique globally across all clients
```

unless the resource is truly global, which business/module resources are not.

---

# 39. Transaction Rules

Generated multi-step mutations should use SDK-owned transactions.

Example:

```ts
await sdk.db.transaction(ctx, async (tx) => {
  // create record
  // create extension record
  // write related rows
})
```

Events should be emitted only after the mutation successfully commits, or through a future outbox pattern.

For MVP, service methods should avoid pretending event emission is durable.

If a side effect is required for correctness, it must be inside the transaction, not an event listener.

---

# 40. Business Object Extension Rules

When generating extension CRUD, the generator must:

```txt
verify the base Business Object exists in the same org
not duplicate the base Business Object
use tenant-safe relation patterns
separate object permissions from extension permissions
separate object events from extension events
not create customFields JSON blobs
not add module-specific fields to the core Business Object
```

Example:

```txt
InventoryProductExtension.productId → Product.id
InventoryProductExtension.orgId → Organization.id
```

Service lookup must verify:

```txt
Product.id = productId
Product.orgId = ctx.org.id
Product.deletedAt = null
```

---

# 41. Deferred Capabilities

The CRUD Generator must not implement these in its first version:

```txt
Dynamic CRUD Engine
Dynamic Form Engine
workflow engine
approval engine
notification engine
audit log UI
activity feed
comments
attachments
background jobs
saved views
complex report builder
AI-generated SQL
branch-scoped ABAC
field-level permissions
per-client code generation
per-org module version pinning
remote marketplace plugins
```

It may prepare metadata for future systems, but must not create the systems themselves.

---

# 42. Generator Safety Behavior

The generator must be conservative.

## 42.1 Existing Files

If a target file exists, the generator must not overwrite it by default.

It should print:

```txt
SKIP existing file
```

or fail with:

```txt
File already exists. Use --force only after review.
```

`--force` should be avoided in MVP.

## 42.2 Dry Run

`--dry-run` must show exactly what would happen without writing files.

## 42.3 Partial Failure

If generation fails midway, the generator must report created files and recommended cleanup.

Future improvement:

```txt
transactional file generation with rollback
```

but MVP can be simpler if failure reporting is clear.

---

# 43. Claude Implementation Rules

When Claude eventually implements the CRUD Generator, use a prompt like this:

```md
You are implementing the OneDayOS CRUD Generator.

Authoritative document:
docs/engineering-manual/09-cli-generators/02-crud-generator.md

Rules:
- Do not build Dynamic CRUD.
- Do not add FastAPI or Python backend files.
- Do not generate raw Prisma access inside modules.
- Do not generate sdk.getDb(orgId).
- Do not accept client-supplied orgId.
- Do not generate APIs outside /api/orgs/[orgSlug]/...
- Do not run migrations automatically.
- Generate real tests, not placeholders.
- Stop and report if the manual is ambiguous.

Task:
Implement only the static CRUD generator described in this document.
```

Claude must not decide:

```txt
new API route conventions
new permission model
new event naming model
new folder structure
new dynamic form runtime
new module dependency behavior
new database migration workflow
```

---

# 44. Acceptance Criteria for Future Implementation

The CRUD Generator is acceptable only when:

```txt
[ ] It refuses unsafe resource names
[ ] It supports dry-run mode
[ ] It refuses to overwrite existing files by default
[ ] It generates tenant-scoped API routes
[ ] It generates page routes under the org shell
[ ] It generates strict Zod schemas
[ ] It rejects client-supplied orgId
[ ] It generates services that receive PlatformContext
[ ] It generates sdk.getDb(ctx), not sdk.getDb(orgId)
[ ] It generates permission checks
[ ] It generates soft delete behavior
[ ] It generates event emission after successful mutations
[ ] It generates real schema tests
[ ] It generates real service tests
[ ] It generates real API tests
[ ] It generates two-org tenant isolation tests
[ ] It generates permission denial tests
[ ] It generates module-disabled tests for module resources
[ ] It does not generate raw Prisma imports inside modules
[ ] It does not generate FastAPI/Python backend files
[ ] It does not generate Dynamic CRUD runtime code
[ ] It passes npm run check:architecture
[ ] It passes npm run test:run
[ ] It passes npm run typecheck
[ ] It passes npm run build
```

---

# 45. Anti-Patterns

## 45.1 CRUD as Database Table Wrapper

Wrong:

```txt
Generate CRUD for every Prisma model automatically.
```

Correct:

```txt
Generate CRUD only for approved business resources with permissions, routes, UI, events, and tests.
```

---

## 45.2 CRUD Without Business Meaning

Wrong:

```txt
Resource: inventory_records
Fields: field1, field2, field3
```

Correct:

```txt
Resource: stock_adjustment
Business meaning: manual correction to stock quantity
Permissions: inventory.stock_adjustment.*
Events: inventory.stock_adjustment.created
```

---

## 45.3 Client-Specific CRUD

Wrong:

```txt
Generate special stock adjustment CRUD only for Client A.
```

Correct:

```txt
Generate reusable Inventory stock adjustment CRUD.
Configure Client A behavior through settings or feature flags.
```

---

## 45.4 Generic Custom Fields Too Early

Wrong:

```txt
customFields Json
```

Correct:

```txt
Real typed fields in module-owned tables or extension tables.
```

Generic custom fields are deferred until metadata and reporting patterns are mature.

---

## 45.5 Auth-Only CRUD

Wrong:

```txt
Authenticated users can create/update/delete.
```

Correct:

```txt
Authenticated user + tenant membership + module enablement + permission + validation.
```

---

# 46. Recommended Implementation Timing

Do not implement this immediately after the Module Generator.

Recommended sequence:

```txt
1. Finish Kernel implementation
2. Finish SDK implementation
3. Finish database and Business Object services
4. Finish Module System implementation
5. Implement secure Module Generator
6. Build Inventory manually
7. Build at least two more CRUD-like resources manually
8. Review repeated patterns
9. Amend this document if needed
10. Implement CRUD Generator
```

The CRUD Generator should be extracted from proven patterns, not imagined patterns.

---

# 47. Final Position

The CRUD Generator is important, but it is not urgent.

OneDayOS should eventually be very fast at producing CRUD.

But the first priority is not speed.

The first priority is ensuring that every generated CRUD screen is:

```txt
secure
multi-tenant safe
permission-enforced
consistent
beautiful
reusable
testable
aligned with the platform
```

A CRUD Generator that violates the platform architecture is worse than no generator.

A CRUD Generator that encodes the platform architecture becomes one of OneDayOS’s strongest long-term advantages.
