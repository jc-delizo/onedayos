# OneDayOS Engineering Manual — Generator Safety Rails

**Document ID:** `09-cli-generators/06-generator-safety-rails.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Module Generator Implementation`  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Applies To:** OneDayOS restarted platform build  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
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
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/03-module-folder-contract.md`
- `08-module-system/04-module-permissions.md`
- `08-module-system/09-module-testing.md`
- `09-cli-generators/00-generator-philosophy.md`
- `09-cli-generators/01-module-generator.md`
- `09-cli-generators/02-crud-generator.md`
- `09-cli-generators/03-form-generator.md`
- `09-cli-generators/04-api-generator.md`
- `09-cli-generators/05-test-generator.md`

---

# 1. Purpose

This document defines the mandatory safety rails for all OneDayOS generators.

Generators are not allowed to merely create files that compile.

Generators must create code that obeys the OneDayOS architecture by default.

This document answers:

```txt
What must generated code never contain?
What must generated code always contain?
What patterns should automated checks block?
What mistakes should cause the generator to fail?
What should Claude never generate when implementing modules?
```

The goal is to prevent bad architecture from being repeated at machine speed.

A weak generator is dangerous because it can multiply unsafe code across every future module.

A strong generator is one of OneDayOS's biggest advantages because it lets AI and engineers move quickly without re-deciding architecture.

---

# 2. Core Principle

```txt
Generated code must be safer than hand-written code.
```

Generated code should already include:

```txt
verified PlatformContext
API-safe authentication
tenant membership checks
module enablement checks
permission enforcement
strict Zod validation
client-supplied orgId rejection
SDK-only database access
soft delete defaults
event emission for mutations
architecture tests
security tests
```

Generated code must not create insecure placeholders that someone is expected to fix later.

The generator should not output:

```txt
TODO: add permission check
TODO: scope by org
TODO: validate input
TODO: replace orgId from body
TODO: add tests
```

A generator that creates known-dangerous TODOs should be considered broken.

---

# 3. Historical Context

The previous Kernel MVP had useful ideas, but its generator and scaffold patterns exposed risks that must not return in the restarted build.

Known old-risk categories included:

```txt
sdk.getDb(orgId)
client-supplied orgId
/api/[module] route shape
redirect-style auth helpers in APIs
permissions modeled but not enforced
routes gated only by authentication
weak generated tests
module manifest self-registration
soft-delete bypass paths
raw route-level service calls without verified tenant context
```

The restarted platform intentionally replaces these with:

```txt
sdk.getDb(ctx)
verified PlatformContext
/api/orgs/[orgSlug]/[moduleId]/...
API-safe auth/context helpers
mandatory permission enforcement
two-org tenant-isolation tests
permission-denial tests
pure manifests
explicit module loader
soft-delete service contracts
```

---

# 4. Scope

This document applies to:

```txt
module:create generator
future crud:create generator
future form:create generator
future api:create generator
future test:create generator
future AI-assisted code generation prompts
Claude implementation instructions
architecture lint/check scripts
```

This document also applies when Claude is manually asked to create code that would normally be generated.

Claude must follow the same rules as the generator.

---

# 5. Non-Goals

This document does not define:

```txt
Dynamic CRUD Engine
Dynamic Form Engine
runtime plugin system
remote marketplace loader
per-client code forks
FastAPI service generation
Python backend scaffolding
module version pinning
RLS implementation
```

Those are either deferred or explicitly outside the restarted core platform.

---

# 6. Generator Safety Philosophy

## 6.1 Fail Closed

Generators should fail rather than create questionable code.

If required information is missing, the generator should stop with a clear message.

Bad:

```txt
Generate partial module anyway and let developer fix it.
```

Good:

```txt
Stop and report missing required manifest fields, permission definitions, or route metadata.
```

## 6.2 Refuse Unsafe Inputs

Generators must validate their own inputs.

Examples:

```txt
module ID must be lowercase kebab-case
entity name must be singular PascalCase or camelCase depending on context
route segments must be URL-safe
permission resources must be snake_case
event names must follow official convention
reserved names must be rejected
```

## 6.3 Generate Secure Defaults

Generated code should assume:

```txt
every route is protected
every operation is tenant-scoped
every mutation needs permission
every input is hostile
every business record is soft-deletable unless explicitly documented otherwise
every module can eventually run for many organizations
```

## 6.4 No Demo-Shaped Code

Generated code must not look like a tutorial.

Bad generated code:

```ts
export async function GET() {
  return NextResponse.json({ data: [], error: null })
}
```

Good generated code:

```ts
export const GET = sdk.api.handleOrgModuleRoute(
  async ({ ctx, searchParams }) => {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'read',
    })

    const query = StockAdjustmentListQuerySchema.parse(searchParams)
    const data = await StockAdjustmentService.list(ctx, query)

    return sdk.api.ok(data)
  }
)
```

Exact helper names may evolve, but the shape must remain:

```txt
API-safe wrapper
verified PlatformContext
permission requirement
validated input
service call with ctx
standard response
```

---

# 7. Mandatory Generator Output Checklist

Every generated module must include:

```txt
[ ] pure module manifest
[ ] module permissions file
[ ] Zod schemas
[ ] types file
[ ] server service file
[ ] event constants and payload schemas
[ ] settings file if needed
[ ] navigation metadata
[ ] AI context placeholder metadata
[ ] docs.md
[ ] README.md
[ ] API route files under /api/orgs/[orgSlug]/[moduleId]/...
[ ] page files under /[orgSlug]/[moduleId]/...
[ ] client components that never import server-only SDK
[ ] service tests
[ ] API tests
[ ] tenant-isolation tests using at least two organizations
[ ] permission-denial tests using non-admin users
[ ] validation tests
[ ] soft-delete tests where applicable
[ ] event emission tests for mutations
[ ] architecture tests or check coverage
```

Every generated API route must include:

```txt
[ ] API-safe authentication
[ ] orgSlug validation
[ ] tenant membership validation
[ ] module enablement validation
[ ] permission enforcement
[ ] strict body/query/params validation
[ ] client-supplied orgId rejection
[ ] service call with PlatformContext
[ ] standard { data, error, meta? } JSON response
[ ] no redirects
[ ] no HTML responses
```

Every generated service must include:

```txt
[ ] PlatformContext parameter
[ ] internal permission enforcement for public service methods during MVP
[ ] sdk.getDb(ctx)
[ ] tenant-scoped queries
[ ] soft-delete behavior for delete operations
[ ] event emission after successful mutation
[ ] no raw Prisma import
[ ] no Kernel import
[ ] no direct import from another module
```

---

# 8. Forbidden Patterns — Absolute Block List

If generated code contains any of these patterns, the generator output is invalid.

## 8.1 Client-Supplied Tenant Identity

Forbidden:

```ts
const orgId = body.orgId
```

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

```ts
const orgId = formData.get('orgId')
```

```ts
where: { orgId: input.orgId }
```

```ts
CreateThingSchema = z.object({
  orgId: z.string(),
  name: z.string(),
})
```

Required replacement:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const db = sdk.getDb(ctx)
```

Tenant identity comes from:

```txt
authenticated Supabase user
+ platform User record
+ orgSlug route param
+ user.orgId === org.id
+ verified PlatformContext
```

Never from the client body, query string, hidden input, local storage, or browser state.

---

## 8.2 Loose `orgId` Service Parameters

Forbidden:

```ts
InventoryService.list(orgId)
```

```ts
InventoryService.create(orgId, input)
```

```ts
sdk.getDb(orgId)
```

```ts
function getDb(orgId: string) {
  return prisma
}
```

Required replacement:

```ts
InventoryService.list(ctx, query)
```

```ts
InventoryService.create(ctx, input)
```

```ts
sdk.getDb(ctx)
```

`PlatformContext` is the trust boundary.

A string is not a trust boundary.

---

## 8.3 Raw Prisma in Modules

Forbidden inside `src/modules/**`:

```ts
import { prisma } from '@/kernel/db/client'
```

```ts
import { PrismaClient } from '@prisma/client'
```

```ts
const prisma = new PrismaClient()
```

```ts
await prisma.product.findMany(...)
```

Required replacement:

```ts
import { sdk } from '@/sdk/server'

const db = sdk.getDb(ctx)
await db.product.findMany(...)
```

Only Kernel/Data layer, SDK internals, migrations, and approved scripts may use raw Prisma.

---

## 8.4 Kernel Imports in Modules

Forbidden inside `src/modules/**`:

```ts
import { requireAuth } from '@/kernel/auth/session'
```

```ts
import { can } from '@/kernel/permissions/check'
```

```ts
import { bus } from '@/kernel/events/bus'
```

```ts
import { prisma } from '@/kernel/db/client'
```

Required replacement:

```ts
import { sdk } from '@/sdk/server'
```

or for shared-safe types:

```ts
import type { ModuleManifest } from '@/sdk'
```

Modules consume the platform through the SDK only.

---

## 8.5 Direct Module-to-Module Imports

Forbidden:

```ts
import { InventoryService } from '@/modules/inventory/service'
```

inside another module.

Forbidden:

```ts
import { CustomerPipelineService } from '@/modules/crm/service'
```

inside Reservations, Projects, Support, or Billing.

Required replacement:

```txt
shared Business Objects
events
Platform Services after promotion
SDK capabilities
```

Module dependencies do not grant direct import permission.

---

## 8.6 Unsafe API Route Shapes

Forbidden:

```txt
/api/inventory
/api/[module]
/api/products?orgId=...
/api/customers/[id]
```

Required:

```txt
/api/orgs/[orgSlug]/inventory/stock-adjustments
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
```

All tenant-scoped APIs must be under:

```txt
/api/orgs/[orgSlug]/...
```

The org slug is a locator, not authorization. The server still verifies membership.

---

## 8.7 Redirect-Style Auth in APIs

Forbidden in API route handlers:

```ts
await sdk.auth.requireAuth()
```

if it redirects.

Forbidden:

```ts
redirect('/login')
```

Forbidden:

```ts
notFound()
```

inside API route handlers unless wrapped in an API contract helper that converts it to JSON.

Required replacement:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

Unauthenticated API response:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

APIs return JSON only.

No redirects.

No HTML.

---

## 8.8 Auth-Only APIs

Forbidden:

```ts
await sdk.auth.requireApiAuth(req)
const data = await InventoryService.create(ctx, input)
```

if there is no tenant, module, and permission check.

Required sequence:

```txt
1. authenticate
2. verify tenant membership
3. verify module enablement
4. validate input
5. enforce permission
6. call service with PlatformContext
7. return standard JSON
```

Auth proves identity.

Auth does not prove authorization.

---

## 8.9 Missing Permission Enforcement

Forbidden:

```ts
const data = await SomeService.create(ctx, input)
```

with no permission check in route or service.

Required in API route:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

Required in public service methods during MVP:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

Yes, this can be duplicated in route and service for MVP.

Security clarity beats cleverness.

---

## 8.10 Wildcard Permissions in Module Manifests

Forbidden in module manifest:

```ts
permissions: [
  { module: 'inventory', resource: '*', action: '*' },
]
```

Forbidden:

```ts
permissions: ['create', 'read', 'update', 'delete']
```

Required:

```ts
permissions: [
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
]
```

Wildcards are grants assigned to roles, not manifest declarations.

Module manifests declare available permissions.

Roles grant permissions.

---

## 8.11 Duplicate Business Objects

Forbidden module models or services:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
InventoryWarehouse
```

when these represent duplicates of shared Business Objects.

Required replacement:

```txt
Product
Customer
Employee
Supplier
Warehouse
```

plus module-owned extension tables when needed:

```txt
InventoryProductExtension
CRMCustomerExtension
LeaveEmployeeExtension
PurchasingSupplierExtension
InventoryWarehouseExtension
```

Business Objects define identity.

Modules define behavior around that identity.

---

## 8.12 Wrong Business Object Event Names

Forbidden:

```txt
inventory.product.created
crm.customer.created
hr.employee.created
purchasing.supplier.created
inventory.warehouse.created
```

Required:

```txt
objects.product.created
objects.customer.created
objects.employee.created
objects.supplier.created
objects.warehouse.created
```

Module-owned events use module namespaces:

```txt
inventory.stock_movement.created
crm.deal.created
leave.leave_request.submitted
purchasing.purchase_order.created
```

Business Object events use the `objects` namespace.

---

## 8.13 Non-Past-Tense Event Names

Forbidden:

```txt
inventory.stock_level.low
inventory.stock_level.lowStock
inventory.product.create
crm.customer.convert
leave.request.submit
```

Required:

```txt
inventory.stock_level.low_detected
inventory.stock_level.reorder_threshold_crossed
objects.product.created
crm.customer.converted
leave.leave_request.submitted
```

Events are facts that already happened.

They are not commands.

---

## 8.14 Full Records in Event Payloads

Forbidden:

```ts
await sdk.events.emit(ctx, 'objects.customer.created', customer)
```

Forbidden:

```ts
await sdk.events.emit(ctx, 'objects.employee.updated', {
  before,
  after,
})
```

Required:

```ts
await sdk.events.emit(ctx, 'objects.customer.created', {
  customerId: customer.id,
})
```

```ts
await sdk.events.emit(ctx, 'objects.employee.updated', {
  employeeId: employee.id,
  changedFields: ['position', 'departmentId'],
})
```

Event payloads must be small, stable, JSON-serializable, and safe.

No secrets.

No full Prisma records.

No unnecessary PII.

---

## 8.15 Loose Zod Schemas

Forbidden:

```ts
const schema = z.object({
  name: z.string(),
})
```

for API request bodies.

Forbidden:

```ts
const parsed = schema.parse(await req.json())
```

without handling validation errors through the API contract.

Required:

```ts
const CreateThingSchema = z.strictObject({
  name: z.string().min(1),
})
```

Client-supplied `orgId` must be rejected.

Unknown keys should fail unless there is a documented exception.

---

## 8.16 `findUnique` on Tenant-Scoped Records

Forbidden:

```ts
await db.product.findUnique({ where: { id } })
```

Forbidden:

```ts
await db.customer.findUniqueOrThrow({ where: { id } })
```

Required:

```ts
await db.product.findFirst({
  where: {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

or, if using a tenant-safe composite unique constraint:

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

Tenant-scoped reads must include tenant scope.

---

## 8.17 Hard Delete for Business Data

Forbidden:

```ts
await db.product.delete({ where: { id } })
```

Forbidden:

```ts
await db.customer.deleteMany({ where: { orgId: ctx.org.id } })
```

Required:

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

Hard delete is allowed only for:

```txt
approved cleanup scripts
dev/test reset scripts
explicit compliance deletion path
join rows where the parent lifecycle requires it
```

Normal business records use soft delete.

---

## 8.18 Generic `customFields` JSON in MVP

Forbidden:

```prisma
customFields Json?
```

on Business Objects or module records as an escape hatch.

Forbidden:

```ts
metadata: z.record(z.any())
```

unless explicitly documented as platform metadata, not client customization.

Required replacement:

```txt
module-owned extension table
explicit typed fields
future Dynamic Form Engine after gate
```

Generic custom fields too early will destroy standardization.

---

## 8.19 Manifest Side Effects

Forbidden:

```ts
sdk.modules.register(InventoryModule)
```

inside `manifest.ts`.

Forbidden:

```ts
await seedInventoryDefaults(orgId)
```

inside `manifest.ts`.

Required:

```ts
export const inventoryManifest = { ... } satisfies ModuleManifest
```

Manifests are pure metadata.

Registration happens in the platform composition root.

Provisioning hooks are declared in the manifest and implemented in server-only files.

---

## 8.20 FastAPI / Python Backend Generation

Forbidden in core platform generators:

```txt
main.py
requirements.txt
alembic.ini
sqlalchemy models
pydantic schemas
FastAPI routers
uvicorn config
```

OneDayOS core platform uses:

```txt
Next.js route handlers
TypeScript
Supabase
PostgreSQL
Prisma
Zod
Vercel
```

FastAPI may be reconsidered only through a future ADR for a specialized service, not the core platform backend.

---

## 8.21 Runtime Plugin Loading

Forbidden in MVP:

```ts
fs.readdirSync('src/modules')
```

for runtime module discovery.

Forbidden:

```ts
await import(remoteModuleUrl)
```

Forbidden:

```txt
remote marketplace plugin loading
per-org dynamic code loading
client-uploaded modules
```

Required for MVP:

```ts
import { inventoryManifest } from '@/modules/inventory/manifest'
import { leaveManifest } from '@/modules/leave/manifest'

export const knownModuleManifests = [
  inventoryManifest,
  leaveManifest,
]
```

Static imports are boring, testable, bundler-friendly, and safe.

---

## 8.22 Weak Generated Tests

Forbidden as primary tests:

```ts
it('returns an array', async () => {
  expect(Array.isArray(await Service.list(ctx))).toBe(true)
})
```

```ts
it('exports manifest', () => {
  expect(manifest).toBeDefined()
})
```

```ts
it('calls service', () => {
  expect(Service.create).toBeDefined()
})
```

Required tests:

```txt
Org A cannot read Org B data
Org A cannot mutate Org B data
unauthenticated API returns 401 JSON
authenticated but unauthorized user returns 403 JSON
wrong-org slug returns safe 404 JSON
module-disabled route returns 404 MODULE_NOT_FOUND
client-supplied orgId is rejected
unknown body keys are rejected
service uses PlatformContext
mutation emits event only after success
soft delete hides record from normal reads
```

Generated tests must prove behavior.

They must not merely prove files exist.

---

# 9. Required Replacement Patterns

This section defines canonical replacements for common unsafe generator output.

## 9.1 API Route Pattern

Required shape:

```ts
import { sdk } from '@/sdk/server'
import { CreateStockAdjustmentSchema } from '@/modules/inventory/schema'
import { StockAdjustmentService } from '@/modules/inventory/service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  return sdk.api.handle(async () => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

    const body = await sdk.api.parseJson(req)
    const input = sdk.validation.parseBody(CreateStockAdjustmentSchema, body)

    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    })

    const data = await StockAdjustmentService.create(ctx, input)

    return sdk.api.created(data)
  })
}
```

Exact helper names may change, but the route must contain equivalent behavior.

---

## 9.2 Service Pattern

Required shape:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
import type { CreateStockAdjustmentInput } from './schema'
import { INVENTORY_PERMISSIONS } from './permissions'

export class StockAdjustmentService {
  static async create(ctx: PlatformContext, input: CreateStockAdjustmentInput) {
    await sdk.permissions.require(ctx, INVENTORY_PERMISSIONS.stockAdjustment.create)

    const db = sdk.getDb(ctx)

    const record = await db.stockAdjustment.create({
      data: {
        orgId: ctx.org.id,
        reason: input.reason,
        createdBy: ctx.user.id,
      },
    })

    await sdk.events.emit(ctx, 'inventory.stock_adjustment.created', {
      stockAdjustmentId: record.id,
    })

    return record
  }
}
```

Public service methods enforce permissions during MVP.

Later, an ADR may introduce internal trusted service methods, but generated modules should not start there.

---

## 9.3 Schema Pattern

Required shape:

```ts
import { z } from 'zod'

export const CreateStockAdjustmentSchema = z.strictObject({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantityDelta: z.number().int(),
  reason: z.string().min(1).max(500),
})

export type CreateStockAdjustmentInput = z.infer<typeof CreateStockAdjustmentSchema>
```

Forbidden:

```ts
orgId: z.string()
```

in tenant-scoped body schemas.

---

## 9.4 Manifest Pattern

Required shape:

```ts
import type { ModuleManifest } from '@/sdk'

export const inventoryManifest = {
  id: 'inventory',
  label: 'Inventory',
  version: '0.1.0',
  lifecycle: 'draft',
  compatibility: {
    platform: { min: '0.1.0' },
    sdk: { min: '0.1.0' },
    manifest: { min: '1.0.0' },
  },
  dependencies: [],
  usesBusinessObjects: ['product', 'warehouse', 'supplier'],
  ownedEntities: ['stock_movement', 'stock_adjustment'],
  permissions: [
    {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'read',
      label: 'View stock adjustments',
    },
  ],
  navItems: [
    {
      label: 'Stock Adjustments',
      href: '/inventory/stock-adjustments',
      requiredPermission: {
        module: 'inventory',
        resource: 'stock_adjustment',
        action: 'read',
      },
    },
  ],
  events: {
    emits: ['inventory.stock_adjustment.created'],
    listens: [],
  },
} satisfies ModuleManifest
```

Forbidden:

```ts
sdk.modules.register(inventoryManifest)
```

inside the manifest.

---

## 9.5 Test Pattern

Required generated API security tests:

```ts
describe('POST /api/orgs/[orgSlug]/inventory/stock-adjustments', () => {
  it('returns 401 JSON when unauthenticated', async () => {})
  it('returns safe 404 when user belongs to another org', async () => {})
  it('returns 404 MODULE_NOT_FOUND when module is disabled', async () => {})
  it('returns 403 when user lacks permission', async () => {})
  it('rejects client-supplied orgId', async () => {})
  it('rejects unknown body keys', async () => {})
  it('creates record for authorized user in same org', async () => {})
})
```

Required generated service tests:

```ts
describe('StockAdjustmentService.create', () => {
  it('requires create permission', async () => {})
  it('creates record scoped to ctx.org.id', async () => {})
  it('does not accept orgId in input', async () => {})
  it('emits event after successful create', async () => {})
  it('does not emit event when create fails', async () => {})
})
```

Required generated tenant-isolation tests:

```ts
describe('tenant isolation', () => {
  it('Org A user cannot read Org B records', async () => {})
  it('Org A user cannot update Org B records', async () => {})
  it('Org A user cannot delete Org B records', async () => {})
})
```

---

# 10. Static Architecture Checks

The restarted build should include a script named:

```bash
npm run check:architecture
```

This script should detect known forbidden patterns.

It may start as a simple custom TypeScript/Node script.

It does not need to be perfect on day one, but it must catch the high-risk patterns.

Recommended scripts:

```json
{
  "scripts": {
    "check:architecture": "tsx scripts/check-architecture.ts",
    "check": "npm run typecheck && npm run lint && npm run test:run && npm run check:architecture && npm run build"
  }
}
```

---

# 11. Required Architecture Check Rules

## 11.1 Forbidden Module Imports

Fail if files under `src/modules/**` contain:

```txt
@/kernel/
@/modules/
@prisma/client
new PrismaClient
@/kernel/db/client
```

Allowed exceptions:

```txt
src/modules/index.ts
module test files may mock modules by path only if not importing production services across modules
```

Prefer no exception unless necessary.

---

## 11.2 Forbidden Loose DB Access

Fail if generated or module files contain:

```txt
sdk.getDb(orgId)
sdk.getDb(input.orgId)
sdk.getDb(body.orgId)
sdk.getDb(params.orgId)
sdk.getDb(request
```

Required:

```txt
sdk.getDb(ctx)
```

---

## 11.3 Forbidden Client-Supplied `orgId`

Fail if schemas under `src/modules/**/schema.ts` contain:

```txt
orgId:
```

Fail if route files contain:

```txt
searchParams.get('orgId')
body.orgId
input.orgId
formData.get('orgId')
```

Some Kernel provisioning scripts may use `orgId`, but module APIs and module schemas must not.

---

## 11.4 Forbidden API Route Shape

Fail if generated API files are created under:

```txt
src/app/api/[module]
src/app/api/inventory
src/app/api/crm
src/app/api/leave
```

Required module API root:

```txt
src/app/api/orgs/[orgSlug]/[moduleId]/...
```

Required Business Object API root:

```txt
src/app/api/orgs/[orgSlug]/objects/[object]/...
```

---

## 11.5 Forbidden Redirect Helpers in APIs

Fail if files under `src/app/api/**` contain:

```txt
redirect(
requireAuth(
notFound(
```

unless the file is a Kernel-approved API wrapper implementation.

API routes must use API-safe helpers that return JSON errors.

---

## 11.6 Missing Permission Requirement

The check script should flag generated API route files that do not contain one of:

```txt
sdk.permissions.require
requirePermission
permission:
```

This may produce false positives at first.

False positives are acceptable if they push review.

False negatives are dangerous.

---

## 11.7 Forbidden Hard Delete

Fail in modules and Business Object services if code contains:

```txt
.delete(
.deleteMany(
```

Allowed exceptions must be explicitly commented:

```ts
// ARCHITECTURE_EXCEPTION: hard delete allowed for join-table cleanup because ...
```

All exceptions require review.

---

## 11.8 Forbidden `findUnique` on Tenant-Scoped Models

Fail in module services for:

```txt
.findUnique({ where: { id
.findUniqueOrThrow({ where: { id
```

Required:

```txt
findFirst with orgId/deletedAt
```

or composite unique:

```txt
id_orgId
```

---

## 11.9 Forbidden FastAPI/Python Backend Files

Fail if generator creates:

```txt
main.py
routers/
alembic/
alembic.ini
requirements.txt
pyproject.toml
sqlalchemy
pydantic
fastapi
uvicorn
```

unless a future ADR explicitly introduces a separate specialized Python service.

---

# 12. Generator Input Validation Rules

The generator must validate its own input before writing files.

## 12.1 Module ID

Valid:

```txt
inventory
leave
crm
visitor-management
incident-reporting
```

Invalid:

```txt
Inventory
inventory_module
inventory module
inventory.module
../inventory
api
kernel
sdk
objects
settings
admin
```

Rule:

```regex
^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$
```

Reserved words must be blocked.

## 12.2 Entity Name

Valid:

```txt
StockAdjustment
PurchaseRequest
LeaveRequest
VisitorLog
IncidentReport
```

Invalid:

```txt
Product
Customer
Employee
Supplier
Warehouse
InventoryProduct
CRMCustomer
LeaveEmployee
```

unless the generator is explicitly generating a Business Object extension table and the output name makes that clear:

```txt
InventoryProductExtension
CRMCustomerExtension
LeaveEmployeeExtension
```

## 12.3 Permission Resource

Valid:

```txt
stock_adjustment
stock_movement
purchase_request
leave_request
visitor_log
incident_report
```

Invalid:

```txt
StockAdjustment
stock-adjustment
stock adjustment
*
```

Rule:

```regex
^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$
```

## 12.4 Event Name

Valid:

```txt
inventory.stock_adjustment.created
inventory.stock_adjustment.approved
leave.leave_request.submitted
objects.product.created
```

Invalid:

```txt
inventory.stock_adjustment.create
inventory.stockAdjustment.created
inventory.stock_adjustment.low
inventory.product.created
crm.customer.created
```

Rule:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Namespace must be:

```txt
module ID
objects
kernel
```

---

# 13. File Overwrite Rules

Generators must not silently overwrite files.

If a target file exists, the generator must:

```txt
fail by default
print the file path
explain how to proceed
support --force only for clearly safe regeneration
support --dry-run
```

Recommended behavior:

```bash
npm run module:create inventory
```

If files exist:

```txt
ERROR: Refusing to overwrite existing files.

Existing files:
- src/modules/inventory/manifest.ts
- src/modules/inventory/service.ts

Use --dry-run to inspect output.
Use --force only if you understand this will overwrite generated files.
```

The first version may avoid `--force` entirely.

Safety beats convenience.

---

# 14. Dry-Run Requirement

Generators should support:

```bash
npm run module:create inventory -- --dry-run
```

Dry run should show:

```txt
files to create
files that already exist
manifest preview
permissions preview
routes preview
tests preview
warnings
```

Dry run must not write files.

This is important because Claude should be able to preview generated output before changing the repo.

---

# 15. Generated Test Safety Rails

Generated tests must not mock away the exact boundary being tested.

Bad:

```ts
vi.mock('@/sdk/server', () => ({
  sdk: {
    permissions: { require: vi.fn() },
  },
}))
```

then claiming permission enforcement works.

Good:

```txt
Use test helpers to create users, roles, and permissions.
Call the API as different users.
Assert actual 403 behavior.
```

Mocks are acceptable for pure unit tests.

Security behavior needs integration-style tests where possible.

---

# 16. UI Safety Rails

Generated client components must not import server-only capabilities.

Forbidden in files with `'use client'`:

```ts
import { sdk } from '@/sdk/server'
```

```ts
import { prisma } from '@/kernel/db/client'
```

```ts
import { requireAuth } from '@/kernel/auth/session'
```

```ts
import { SomeService } from '@/modules/inventory/service'
```

Client components may import:

```ts
import { sdkClient } from '@/sdk/client'
```

```ts
import type { SomeType } from '@/modules/inventory/types'
```

```ts
import { CreateThingSchema } from '@/modules/inventory/schema'
```

only if the schema file is client-safe.

Client forms submit business input only.

They must not submit:

```txt
orgId
userId
roleId
permission override
deletedAt
deletedBy
createdBy
updatedBy
```

Server derives those values from `PlatformContext`.

---

# 17. Migration Safety Rails

Generators must not automatically modify Prisma schema unless explicitly built for that future capability.

For MVP:

```txt
module:create must not add Prisma models automatically
crud:create is deferred
form:create is deferred
```

When a future generator modifies Prisma schema, it must:

```txt
show a diff
require explicit confirmation
create migration instructions
not run production migrations
not run prisma db push
not guess relationships to Business Objects
include tenant-scoped indexes
include soft-delete fields where required
include composite tenant-safe constraints where required
```

Forbidden:

```bash
prisma db push
```

for staging/production.

Forbidden generator behavior:

```txt
auto-run migrate deploy
auto-run destructive migration
auto-drop columns
auto-delete data
```

---

# 18. Dependency Safety Rails

Generators must not add packages without explicit founder/architect approval.

Forbidden default additions:

```txt
FastAPI
SQLAlchemy
Alembic
Redux
MobX
GraphQL server
tRPC
NestJS
Express
BullMQ
Redis
LangChain
Prisma alternatives
UI libraries outside approved system
```

This does not mean these tools are always bad.

It means they require an ADR or explicit approval.

OneDayOS must keep operational cost and implementation ambiguity low.

---

# 19. Claude Implementation Rules

When Claude implements or modifies generators, it must follow these rules:

```txt
1. Do not invent architecture.
2. Do not weaken this safety-rail document.
3. Do not generate code that violates any forbidden pattern.
4. Do not add FastAPI or Python backend files.
5. Do not accept client-supplied orgId.
6. Do not use sdk.getDb(orgId).
7. Do not import from @/kernel/* inside modules.
8. Do not import from another module.
9. Do not generate auth-only APIs.
10. Do not generate placeholder security tests.
11. Do not create duplicate Business Objects.
12. Do not silently overwrite files.
13. Stop and report if a requested generator feature conflicts with the manual.
```

Claude should treat this document as a checklist before creating generated output.

---

# 20. Required Claude Prompt Addition

Every prompt asking Claude to implement or use a generator should include:

```md
Authoritative safety document:
docs/engineering-manual/09-cli-generators/06-generator-safety-rails.md

Before writing files:
- Check every output against the forbidden pattern list.
- Do not generate code that accepts client-supplied orgId.
- Do not generate sdk.getDb(orgId).
- Do not generate /api/[module] routes.
- Do not generate redirect-style API auth.
- Do not generate module imports from @/kernel/* or other modules.
- Do not generate weak placeholder tests.
- Stop if the requested output conflicts with the manual.
```

---

# 21. Minimal `check-architecture.ts` Recommendation

The first implementation of `scripts/check-architecture.ts` can be simple.

It should recursively scan project files and fail on forbidden patterns.

Recommended starting checks:

```txt
src/modules/** contains @/kernel/
src/modules/** contains @prisma/client
src/modules/** contains new PrismaClient
src/modules/** contains sdk.getDb(orgId)
src/modules/** contains body.orgId
src/modules/** contains input.orgId
src/modules/** contains searchParams.get('orgId')
src/app/api/** contains redirect(
src/app/api/** contains requireAuth(
src/app/api/** contains /api/[module] generated route path
src/modules/**/schema.ts contains orgId:
src/modules/** contains .delete(
src/modules/** contains .deleteMany(
```

The script should print useful output:

```txt
Architecture check failed.

Forbidden pattern: sdk.getDb(orgId)
File: src/modules/inventory/service.ts
Line: 42
Reason: module database access must use sdk.getDb(ctx)
```

The check does not need to be perfect to be valuable.

It only needs to catch the mistakes Claude is most likely to make.

---

# 22. Review Checklist for Generated Output

Before accepting generated code, review this checklist:

```txt
[ ] Does every protected API route use /api/orgs/[orgSlug]/...?
[ ] Does every protected API route use API-safe auth/context helpers?
[ ] Does every protected API route return JSON only?
[ ] Does every service receive PlatformContext?
[ ] Does every DB access use sdk.getDb(ctx)?
[ ] Are all inputs validated with strict Zod schemas?
[ ] Is client-supplied orgId rejected?
[ ] Are permissions enforced in routes and services?
[ ] Are module enablement checks present?
[ ] Are tenant-scoped queries scoped by ctx.org.id?
[ ] Are deletes soft deletes?
[ ] Are mutation events emitted after success?
[ ] Are Business Objects reused instead of duplicated?
[ ] Are module-specific fields placed in extension tables?
[ ] Are tests using at least two organizations?
[ ] Are tests using non-admin permission-denied users?
[ ] Are wrong-org attempts tested?
[ ] Are module-disabled attempts tested?
[ ] Are forbidden imports absent?
[ ] Does npm run check:architecture pass?
```

---

# 23. What Must Be Implemented Now

For the restarted platform build, implement these safety rails before trusting the module generator:

```txt
[ ] generator input validation
[ ] no silent overwrite behavior
[ ] --dry-run support
[ ] secure API route templates
[ ] secure service templates
[ ] strict schema templates
[ ] pure manifest template
[ ] required generated tests
[ ] architecture check script
[ ] CI/check script including check:architecture
```

Deferred:

```txt
[ ] standalone crud:create generator
[ ] standalone form:create generator
[ ] standalone api:create generator
[ ] standalone test:create generator
[ ] generator-driven Prisma schema modification
[ ] dynamic metadata-to-CRUD runtime
[ ] dynamic form runtime
[ ] remote marketplace plugin loading
```

---

# 24. Acceptance Criteria

This document is accepted when:

```txt
[ ] All forbidden patterns are clear enough for Claude to follow.
[ ] Replacement patterns are provided for every major forbidden pattern.
[ ] Module generator implementation can use this document as a test oracle.
[ ] Architecture checks can be implemented from this document.
[ ] Generated API route standards are unambiguous.
[ ] Generated service standards are unambiguous.
[ ] Generated test standards are unambiguous.
[ ] Client-supplied orgId is impossible in generated module code.
[ ] sdk.getDb(orgId) is impossible in generated module code.
[ ] /api/[module] route output is impossible in generated module code.
[ ] FastAPI/Python backend output is impossible from core generators.
```

---

# 25. Final Rule

```txt
A generator is allowed to save time.
It is not allowed to save thought by skipping architecture.
```

OneDayOS should move fast because the architecture is encoded into the platform.

Not because every module is hand-waved into existence.

---

# ADR-0011 UX Safety-Rail Amendment

Future generator and architecture checks should block UX patterns that recreate known drift:

```txt
[ ] fake dashboard cards
[ ] fake metrics or fake charts
[ ] missing Module UX Contract
[ ] missing Process Flow page for official modules
[ ] module-specific navbar replacing the app shell
[ ] generic final loading placeholder on every page
[ ] generic final error placeholder on every page
[ ] shared Business Objects visually owned by modules
[ ] Records treated as an app
```

These are governance requirements only in this package. Checker implementation requires a later approved package.
