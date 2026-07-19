# OneDayOS Engineering Manual — 09 CLI & Generators — 04 API Generator

Version: 1.0  
Status: Draft for Founder Review  
Implementation Status: Contract Required; Standalone Generator Deferred  
Owner: OneDayOS Founding Architect  
Last Updated: July 2026  
Depends On:

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
- `06-data/01-tenancy-data-isolation.md`
- `06-data/05-data-validation-zod.md`
- `08-module-system/04-module-permissions.md`
- `09-cli-generators/00-generator-philosophy.md`
- `09-cli-generators/01-module-generator.md`

---

# 1. Purpose

This document defines the **API Generator contract** for OneDayOS.

The API Generator is responsible for producing tenant-safe, permission-enforced, validation-backed, JSON-only API route handlers that follow the OneDayOS Kernel API Contract.

The goal is not merely to save typing.

The goal is to prevent Claude Code, future engineers, or future generators from producing insecure API routes.

A generated API route must already be shaped like production code.

It must not be a demo route.

It must not be auth-only.

It must not trust client-submitted tenant identity.

It must not return redirects.

It must not return HTML.

It must not bypass services.

It must not import raw Prisma.

It must not make architectural decisions.

---

# 2. Implementation Status

This document has two meanings.

## 2.1 Required now: API template contract

The API route patterns in this document are required for:

```txt
module:create
future CRUD generator
manual module implementation
Business Object APIs
module-owned APIs
```

Claude may use this document to implement secure route templates inside the Module Generator.

## 2.2 Deferred: standalone API generator CLI

A standalone CLI such as:

```bash
npm run api:create inventory stock-adjustments
```

is **not required for MVP** and should not be built until repeated manual/API-template pain proves the need.

For the restarted platform build, the priority is:

```txt
secure API route contract first
module generator API templates second
standalone API generator later
```

---

# 3. Core Rule

```txt
Generated APIs must enforce the OneDayOS security model by default.
```

Every protected API route must follow this order:

```txt
1. Parse route params
2. Authenticate request
3. Resolve tenant membership
4. Check organization status
5. Check module enablement, when module-scoped
6. Validate request body/query
7. Enforce permission
8. Call service with PlatformContext
9. Return { data, error, meta? } JSON
```

The route handler is not the place to invent business logic.

The route handler is the boundary layer.

The service owns business behavior.

---

# 4. Why This Document Exists

The previous Kernel MVP proved that scaffolding can produce dangerous defaults if API generation is not strict enough.

The restarted platform must not recreate these patterns:

```txt
/api/[module]
/api/[module]?orgId=...
sdk.getDb(orgId)
request.nextUrl.searchParams.get('orgId')
requireAuth() inside API routes when it redirects
API route protected only by authentication
API route without permission check
API route returning HTML redirect instead of JSON 401
API route importing @/kernel/* directly from generated module code
API route importing raw Prisma
mutation route without validation
mutation route without event emission through service layer
```

The API Generator contract exists to make the secure path the easy path.

---

# 5. What the API Generator Is

The API Generator is a static code generator that can produce:

```txt
Next.js route handlers
route param validation
query validation
body validation
API-safe auth/context resolution
module enablement checks
permission checks
service invocation skeletons
error handling
response formatting
tests
```

It emits normal TypeScript files.

It does not create a runtime API framework.

It does not create a second backend.

It does not create FastAPI files.

It does not bypass the SDK.

---

# 6. What the API Generator Is Not

The API Generator is not:

```txt
A business logic generator
A database schema generator
A Prisma model generator
A Dynamic CRUD Engine
A Dynamic Form Engine
A FastAPI generator
A Python service generator
A way to bypass service methods
A way to bypass permission checks
A way to generate client-specific forks
A way to expose arbitrary Prisma models over HTTP
```

Generated APIs must be explicit and boring.

If the generator cannot safely infer something, it must fail and ask for explicit metadata.

---

# 7. API Route Families

OneDayOS has four main API route families.

## 7.1 Kernel APIs

Kernel APIs are platform-wide but may still require authentication.

Examples:

```txt
/api/kernel/auth/register
/api/kernel/auth/me
/api/kernel/orgs
/api/kernel/modules
```

Kernel APIs may import Kernel internals because they are Kernel code.

Business modules must not copy this exception.

## 7.2 Tenant-scoped Business Object APIs

Business Object APIs live under:

```txt
/api/orgs/[orgSlug]/objects/[object]
```

Examples:

```txt
/api/orgs/[orgSlug]/objects/employees
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/suppliers
/api/orgs/[orgSlug]/objects/warehouses
```

These APIs use Business Object permissions:

```txt
objects.employee.read
objects.product.create
objects.customer.update
objects.supplier.delete
objects.warehouse.restore
```

## 7.3 Tenant-scoped Module APIs

Module APIs live under:

```txt
/api/orgs/[orgSlug]/[moduleId]/[resource]
```

Examples:

```txt
/api/orgs/[orgSlug]/inventory/stock-levels
/api/orgs/[orgSlug]/inventory/stock-adjustments
/api/orgs/[orgSlug]/leave/requests
/api/orgs/[orgSlug]/crm/opportunities
```

These APIs require:

```txt
authentication
tenant membership
active organization
module enablement
permission
validation
service call with PlatformContext
```

## 7.4 Public APIs

Public APIs are rare.

Examples may include:

```txt
/api/health
/api/webhooks/stripe
```

Public does not mean unsafe.

Public APIs need their own authentication model, such as webhook signature verification.

The API Generator should not create public APIs by default.

---

# 8. Required Route Shapes

## 8.1 Module API route shape

Module APIs must use this pattern:

```txt
src/app/api/orgs/[orgSlug]/[moduleId]/[resource]/route.ts
```

Example:

```txt
src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/route.ts
```

## 8.2 Module item API route shape

```txt
src/app/api/orgs/[orgSlug]/[moduleId]/[resource]/[id]/route.ts
```

Example:

```txt
src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/[id]/route.ts
```

## 8.3 Business Object API route shape

```txt
src/app/api/orgs/[orgSlug]/objects/[object]/route.ts
```

Example:

```txt
src/app/api/orgs/[orgSlug]/objects/products/route.ts
```

## 8.4 Business Object item API route shape

```txt
src/app/api/orgs/[orgSlug]/objects/[object]/[id]/route.ts
```

Example:

```txt
src/app/api/orgs/[orgSlug]/objects/products/[id]/route.ts
```

---

# 9. Forbidden Route Shapes

The API Generator must not generate:

```txt
src/app/api/[module]/route.ts
src/app/api/[module]/[id]/route.ts
src/app/api/inventory/route.ts
src/app/api/products/route.ts
src/app/api/employees/route.ts
/api/inventory?orgId=...
/api/products?orgId=...
/api/users/[id] for current-user lookup
```

Current-user lookup must use:

```txt
GET /api/kernel/auth/me
```

not:

```txt
GET /api/kernel/users/[id]
```

The old ID-based current-user pattern risks IDOR bugs.

---

# 10. Required Generated Imports

Generated module APIs may import:

```ts
import { sdk } from '@/sdk/server'
import { ApiErrorCode } from '@/sdk'
import { SomeService } from '@/modules/some-module/service'
import { SomeSchema } from '@/modules/some-module/schema'
```

Generated Business Object APIs may import:

```ts
import { sdk } from '@/sdk/server'
import { ProductService } from '@/business-objects/product/service'
import { CreateProductSchema } from '@/business-objects/product/schema'
```

Actual paths may vary based on final repo structure, but the architectural rule is fixed:

```txt
Generated APIs use @/sdk/server for platform access.
Generated module APIs call module services.
Generated Business Object APIs call Business Object services.
Generated APIs do not import raw Prisma.
Generated module APIs do not import @/kernel/*.
```

---

# 11. Forbidden Generated Imports

Generated module APIs must never include:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
import { createServerClient } from '@/kernel/auth/server'
import { SomeOtherModuleService } from '@/modules/other-module/service'
```

Generated client-facing APIs must never use raw Kernel internals.

The SDK owns the supported platform interface.

---

# 12. Required API Response Shape

Every generated API route must return:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

Success:

```json
{
  "data": { "id": "record_123" },
  "error": null
}
```

Failure:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

Generated APIs must not return raw strings like:

```json
{ "error": "Invalid input" }
```

Generated APIs must not return unstructured Zod errors.

Generated APIs must not expose stack traces.

---

# 13. Required Error Codes

Generated APIs must use the Kernel API Contract error codes.

Minimum required codes:

```txt
UNAUTHENTICATED
FORBIDDEN
ORG_NOT_FOUND
MODULE_NOT_FOUND
NOT_FOUND
VALIDATION_ERROR
CONFLICT
INTERNAL_ERROR
```

Recommended HTTP status mapping:

| Condition | HTTP Status | Error Code |
|---|---:|---|
| Not logged in | 401 | `UNAUTHENTICATED` |
| Logged in but lacks permission | 403 | `FORBIDDEN` |
| Wrong org / org not accessible | 404 | `ORG_NOT_FOUND` |
| Module disabled or inaccessible | 404 | `MODULE_NOT_FOUND` |
| Record not found | 404 | `NOT_FOUND` |
| Invalid body/query/params | 400 | `VALIDATION_ERROR` |
| Unique conflict | 409 | `CONFLICT` |
| Unexpected server error | 500 | `INTERNAL_ERROR` |

Wrong-org access should return safe `404 ORG_NOT_FOUND` to avoid revealing tenant existence.

---

# 14. Required Context Resolution

Generated tenant-scoped module APIs must create context using an API-safe helper.

Example:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

This helper must verify:

```txt
Supabase session exists
Prisma User exists
Organization slug exists
User belongs to Organization
Organization is active enough for operation
Module is enabled for Organization
```

Generated Business Object APIs should use:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
```

Business Object APIs do not require a module to be enabled, because Business Objects belong to the shared platform layer.

Generated APIs must not construct `PlatformContext` manually.

---

# 15. Client-Supplied `orgId` Rule

Generated APIs must reject client-supplied `orgId`.

This applies to:

```txt
request body
query string
route params other than orgSlug
headers
form data
JSON payload
import payloads
```

Bad:

```ts
const orgId = body.orgId
```

Bad:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

Good:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const orgId = ctx.org.id
```

Validation schemas must use `z.strictObject()` so unexpected tenant fields are rejected.

---

# 16. Required Permission Enforcement

Generated APIs must enforce permission before calling a service mutation or sensitive read.

Example:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

Business Object example:

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'create',
})
```

Permission checks must use verified `PlatformContext`.

Generated APIs must not use loose parameters like:

```ts
can(userId, action, module, orgId)
```

unless wrapped internally by SDK and never exposed to module code.

---

# 17. Service Invocation Rule

Generated APIs must call services with `PlatformContext`.

Good:

```ts
const data = await InventoryStockAdjustmentService.create(ctx, input)
```

Bad:

```ts
const data = await InventoryStockAdjustmentService.create(ctx.org.id, input)
```

Bad:

```ts
const data = await InventoryStockAdjustmentService.create(body.orgId, input)
```

The service receives verified context and validated business input.

The route handler should not perform business rules that belong in services.

---

# 18. Validation Rules

Generated APIs must validate:

```txt
route params
query string
request body
bulk/import payloads
```

## 18.1 Route params

Route params are untrusted.

Generated APIs must validate:

```ts
const ParamsSchema = z.strictObject({
  orgSlug: z.string().min(1),
})
```

For item routes:

```ts
const ParamsSchema = z.strictObject({
  orgSlug: z.string().min(1),
  id: z.string().min(1),
})
```

## 18.2 Query params

Generated list APIs may support query params such as:

```txt
page
pageSize
search
sort
status
```

These must be validated.

Query params must not include `orgId`.

## 18.3 Body payloads

Generated request body schemas must use:

```ts
z.strictObject({ ... })
```

not:

```ts
z.object({ ... })
```

unless the schema intentionally uses a documented passthrough pattern, which is forbidden in MVP module APIs.

---

# 19. Standard Generated API Wrapper

Generated APIs should use the SDK API handler wrapper once implemented.

Example target shape:

```ts
export const POST = sdk.api.handle(async (req, route) => {
  const { orgSlug } = RouteParamsSchema.parse(await route.params)

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  const input = await sdk.api.parseJson(req, CreateStockAdjustmentSchema)

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
  })

  const data = await StockAdjustmentService.create(ctx, input)

  return sdk.api.created(data)
})
```

If `sdk.api.handle()` is not yet implemented, generated APIs must still manually follow the same behavior.

The wrapper should eventually own:

```txt
try/catch
error normalization
Zod error formatting
JSON response formatting
unexpected error logging
no redirect guarantee
```

---

# 20. Generated Module API Template — Collection Route

Example generated file:

```txt
src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/route.ts
```

Target pattern:

```ts
import { z } from 'zod'
import { sdk } from '@/sdk/server'
import {
  CreateStockAdjustmentSchema,
  ListStockAdjustmentsQuerySchema,
} from '@/modules/inventory/schema'
import { StockAdjustmentService } from '@/modules/inventory/service'

const RouteParamsSchema = z.strictObject({
  orgSlug: z.string().min(1),
})

export const GET = sdk.api.handle(async (req, route) => {
  const { orgSlug } = RouteParamsSchema.parse(await route.params)

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  const query = sdk.api.parseQuery(req, ListStockAdjustmentsQuerySchema)

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'read',
  })

  const data = await StockAdjustmentService.list(ctx, query)

  return sdk.api.ok(data)
})

export const POST = sdk.api.handle(async (req, route) => {
  const { orgSlug } = RouteParamsSchema.parse(await route.params)

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  const input = await sdk.api.parseJson(req, CreateStockAdjustmentSchema)

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
  })

  const data = await StockAdjustmentService.create(ctx, input)

  return sdk.api.created(data)
})
```

This is the shape Claude should follow.

---

# 21. Generated Module API Template — Item Route

Example generated file:

```txt
src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/[id]/route.ts
```

Target pattern:

```ts
import { z } from 'zod'
import { sdk } from '@/sdk/server'
import { UpdateStockAdjustmentSchema } from '@/modules/inventory/schema'
import { StockAdjustmentService } from '@/modules/inventory/service'

const RouteParamsSchema = z.strictObject({
  orgSlug: z.string().min(1),
  id: z.string().min(1),
})

export const GET = sdk.api.handle(async (req, route) => {
  const { orgSlug, id } = RouteParamsSchema.parse(await route.params)

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'read',
  })

  const data = await StockAdjustmentService.getById(ctx, id)

  return sdk.api.ok(data)
})

export const PATCH = sdk.api.handle(async (req, route) => {
  const { orgSlug, id } = RouteParamsSchema.parse(await route.params)

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  const input = await sdk.api.parseJson(req, UpdateStockAdjustmentSchema)

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'update',
  })

  const data = await StockAdjustmentService.update(ctx, id, input)

  return sdk.api.ok(data)
})

export const DELETE = sdk.api.handle(async (req, route) => {
  const { orgSlug, id } = RouteParamsSchema.parse(await route.params)

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'delete',
  })

  const data = await StockAdjustmentService.delete(ctx, id)

  return sdk.api.ok(data)
})
```

Delete means soft delete unless a document explicitly says otherwise.

---

# 22. Generated Business Object API Template

Example generated file:

```txt
src/app/api/orgs/[orgSlug]/objects/products/route.ts
```

Target pattern:

```ts
import { z } from 'zod'
import { sdk } from '@/sdk/server'
import {
  CreateProductSchema,
  ListProductsQuerySchema,
} from '@/business-objects/product/schema'
import { ProductService } from '@/business-objects/product/service'

const RouteParamsSchema = z.strictObject({
  orgSlug: z.string().min(1),
})

export const GET = sdk.api.handle(async (req, route) => {
  const { orgSlug } = RouteParamsSchema.parse(await route.params)

  const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

  const query = sdk.api.parseQuery(req, ListProductsQuerySchema)

  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'product',
    action: 'read',
  })

  const data = await ProductService.list(ctx, query)

  return sdk.api.ok(data)
})

export const POST = sdk.api.handle(async (req, route) => {
  const { orgSlug } = RouteParamsSchema.parse(await route.params)

  const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

  const input = await sdk.api.parseJson(req, CreateProductSchema)

  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'product',
    action: 'create',
  })

  const data = await ProductService.create(ctx, input)

  return sdk.api.created(data)
})
```

Business Object APIs must not be hidden inside module route trees.

Product is not an Inventory API.

Customer is not a CRM API.

Employee is not a Leave API.

---

# 23. Generated Query Schema Requirements

Generated list APIs should support only safe, explicit query fields.

Example:

```ts
export const ListStockAdjustmentsQuerySchema = z.strictObject({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
})
```

Forbidden query fields:

```txt
orgId
userId
roleId
rawWhere
include
select
orderBy as JSON
filter as arbitrary JSON
```

The API must never expose a raw Prisma query interface.

---

# 24. Generated Body Schema Requirements

Create/update schemas must exclude system-controlled fields.

Forbidden body fields:

```txt
id
orgId
createdAt
updatedAt
deletedAt
deletedBy
createdBy
updatedBy
userId, unless explicitly part of business input and verified server-side
roleId, unless explicitly part of permission management APIs
```

Example create schema:

```ts
export const CreateStockAdjustmentSchema = z.strictObject({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int(),
  reason: z.string().trim().min(1).max(500),
})
```

Server services must revalidate tenant ownership of related IDs.

For example, if the client submits `productId`, the service must verify that the product belongs to `ctx.org.id`.

---

# 25. Related Entity Validation

Generated APIs may validate the shape of related IDs.

Services must validate tenant ownership of related IDs.

Example:

```txt
Client submits productId
API validates productId is a string
Service verifies product exists where { id, orgId: ctx.org.id, deletedAt: null }
```

This prevents cross-tenant relation injection.

Generated APIs must not assume a valid ID is tenant-safe.

---

# 26. Soft Delete Requirements

Generated `DELETE` handlers must call service-level soft delete methods.

They must not call raw database delete.

Good:

```ts
await StockAdjustmentService.delete(ctx, id)
```

Bad:

```ts
await prisma.stockAdjustment.delete({ where: { id } })
```

Bad:

```ts
await sdk.getDb(ctx).stockAdjustment.delete({ where: { id } })
```

Service delete methods must set:

```txt
deletedAt
deletedBy
```

where `deletedBy = ctx.user.id`.

---

# 27. Event Emission Rule

Generated APIs must not emit events directly.

Services emit events after successful mutations.

Good:

```ts
const data = await StockAdjustmentService.create(ctx, input)
```

Inside service:

```ts
await sdk.events.emit(ctx, 'inventory.stock_adjustment.created', payload)
```

Bad:

```ts
await sdk.events.emit(ctx, 'inventory.stock_adjustment.created', payload)
return sdk.api.created(data)
```

from the route handler.

Reason:

```txt
The service owns business mutation semantics.
The API only exposes the service over HTTP.
```

---

# 28. Transaction Rule

Generated APIs must not open database transactions directly unless explicitly documented.

Transactions belong in services.

Good:

```ts
await StockAdjustmentService.create(ctx, input)
```

Inside service:

```ts
await sdk.db.transaction(ctx, async (tx) => {
  // create records
  // update balances
  // emit or enqueue event after commit strategy
})
```

Bad:

```ts
export const POST = sdk.api.handle(async () => {
  await sdk.db.transaction(ctx, async (tx) => {
    // business behavior here
  })
})
```

---

# 29. API Generator Inputs

A future standalone API generator should require explicit metadata.

Example command:

```bash
npm run api:create inventory stock-adjustments \
  --resource stock_adjustment \
  --actions list,get,create,update,delete
```

Minimum required metadata:

```ts
type ApiGeneratorConfig = {
  kind: 'module' | 'business-object'
  moduleId?: string
  objectId?: string
  resource: string
  routeSegment: string
  serviceName: string
  serviceImportPath: string
  schemas: {
    listQuery?: string
    create?: string
    update?: string
  }
  permissions: {
    list?: PermissionRequirement
    get?: PermissionRequirement
    create?: PermissionRequirement
    update?: PermissionRequirement
    delete?: PermissionRequirement
    restore?: PermissionRequirement
    export?: PermissionRequirement
    import?: PermissionRequirement
  }
  generatedHandlers: Array<'GET_LIST' | 'GET_ONE' | 'POST' | 'PATCH' | 'DELETE' | 'RESTORE'>
}
```

The generator must not infer permissions from route names alone.

---

# 30. API Generator Outputs

For a collection route, the generator may create:

```txt
route.ts
route.test.ts
```

For an item route, the generator may create:

```txt
[id]/route.ts
[id]/route.test.ts
```

If generated as part of module creation, tests should live near the module or API route according to the final testing convention.

Minimum generated tests:

```txt
unauthenticated returns 401 JSON
wrong org returns safe 404 JSON
disabled module returns 404 JSON
missing permission returns 403 JSON
invalid body returns 400 JSON
client-supplied orgId returns 400 JSON
successful request calls service with PlatformContext
service receives no loose orgId
response shape is { data, error }
route never redirects
```

---

# 31. Required Tests for Generated APIs

Every generated protected API route must include tests for these scenarios.

## 31.1 Authentication test

```txt
Given no authenticated session
When request hits protected API
Then response is 401 JSON
And response is not redirect
And response body follows { data, error }
```

## 31.2 Tenant isolation test

```txt
Given User A belongs to Org A
And Org B exists
When User A calls /api/orgs/org-b-slug/...
Then response is 404 ORG_NOT_FOUND
And no service method is called
```

## 31.3 Module enablement test

For module APIs:

```txt
Given User A belongs to Org A
And module inventory is disabled for Org A
When User A calls /api/orgs/org-a/inventory/...
Then response is 404 MODULE_NOT_FOUND
And no service method is called
```

## 31.4 Permission denial test

```txt
Given User A belongs to Org A
And module is enabled
And User A lacks required permission
When User A calls mutation API
Then response is 403 FORBIDDEN
And no service method is called
```

## 31.5 Validation test

```txt
Given User A is allowed
When request body has unknown orgId field
Then response is 400 VALIDATION_ERROR
And no service method is called
```

## 31.6 Success test

```txt
Given User A is allowed
When request is valid
Then service is called with PlatformContext
And response is success JSON
```

## 31.7 No redirect test

```txt
Every API auth failure must return JSON, not redirect HTML.
```

This test exists specifically to prevent page-auth helpers from leaking into API routes.

---

# 32. Generated API Test Fixture Requirements

Generated API tests must use at least:

```txt
Org A
Org B
Admin user in Org A
Staff user in Org A with permission
Staff user in Org A without permission
User in Org B
Enabled module record
Disabled module record
```

Single-org tests are not enough.

Always-admin tests are not enough.

Tests must prove the security boundary.

---

# 33. Architecture Checks

The API Generator must produce code that passes architecture checks.

Checks should block:

```txt
@/kernel/* imports inside generated module API files
raw Prisma imports inside generated module API files
sdk.getDb(orgId)
request.nextUrl.searchParams.get('orgId')
body.orgId
requireAuth() in API route files if it redirects
NextResponse.redirect inside API route files
redirect('/login') inside API route files
unstructured NextResponse.json({ error: '...' })
prisma.*.delete on business data
findUnique({ where: { id } }) on tenant-scoped records
```

The generator itself should also be tested against these forbidden strings/patterns.

---

# 34. Manual Implementation Rules Before Generator Exists

Until the standalone API Generator exists, Claude must implement APIs manually using this document as the template.

Claude must:

```txt
Use tenant-scoped route paths
Use API-safe auth/context helpers
Use Zod strict schemas
Reject client-supplied orgId
Require permissions
Call service with PlatformContext
Return { data, error }
Add tests for security cases
```

Claude must not:

```txt
Use /api/[module] route shapes
Use query-string orgId
Use raw Prisma in route handlers
Use redirect-based requireAuth in API routes
Skip permission checks
Return ad-hoc JSON errors
Implement FastAPI routes
```

---

# 35. When Standalone API Generator Becomes Worth Building

Do not build a standalone API Generator just because it sounds useful.

Build it only after there is evidence such as:

```txt
Three modules have similar hand-written API routes
Security test templates are repeating
CRUD route patterns are stable
Kernel API wrapper is stable
Zod schema conventions are stable
Module permission model is stable
```

Until then, API templates inside the Module Generator may be enough.

This follows the Three Independent Use Cases Rule.

---

# 36. Relationship to Module Generator

The Module Generator should call or embed the API Generator contract.

When `module:create inventory` runs, it may generate placeholder API route files that already follow this document.

The generated route files must not be unsafe placeholders.

Bad placeholder:

```ts
export async function GET() {
  return Response.json({ data: [] })
}
```

Good placeholder:

```ts
export const GET = sdk.api.handle(async (req, route) => {
  const { orgSlug } = RouteParamsSchema.parse(await route.params)
  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'record',
    action: 'read',
  })
  const data = await InventoryService.list(ctx)
  return sdk.api.ok(data)
})
```

Even placeholders must teach Claude the right pattern.

---

# 37. Relationship to CRUD Generator

The future CRUD Generator will need API routes.

It should reuse this API Generator contract.

CRUD-generated APIs must still:

```txt
use PlatformContext
use tenant-scoped routes
reject orgId
validate input
check permission
soft delete
emit events through services
return JSON only
include security tests
```

CRUD generation does not weaken the API contract.

---

# 38. Relationship to Dynamic CRUD Engine

The API Generator is static.

It writes TypeScript route files.

The Dynamic CRUD Engine is future runtime behavior.

They are not the same.

Do not build Dynamic CRUD while building the API Generator.

Do not make generated APIs depend on a runtime CRUD engine.

---

# 39. Relationship to FastAPI

FastAPI is excluded from the core OneDayOS platform.

The API Generator must not generate:

```txt
FastAPI routers
Pydantic schemas
Python service files
Alembic migrations
SQLAlchemy models
```

OneDayOS core API routes are Next.js route handlers.

A future Python service may exist only through an approved ADR for a specialized Platform Service, such as AI document processing or ML workloads.

Modules must not call such a service directly.

---

# 40. Example Forbidden Generated Code

The following generated code is forbidden:

```ts
export async function POST(req: NextRequest) {
  await requireAuth()

  const body = await req.json()
  const orgId = body.orgId

  const record = await prisma.inventoryRecord.create({
    data: { ...body, orgId },
  })

  return NextResponse.json({ data: record, error: null })
}
```

Reasons:

```txt
uses redirect-style auth helper
trusts body.orgId
imports raw Prisma
performs business logic in route
skips module enablement
skips permission checks
skips validation
skips service layer
likely emits no event
```

---

# 41. Example Correct Generated Code

The following shape is acceptable:

```ts
export const POST = sdk.api.handle(async (req, route) => {
  const { orgSlug } = RouteParamsSchema.parse(await route.params)

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  const input = await sdk.api.parseJson(req, CreateInventoryRecordSchema)

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'record',
    action: 'create',
  })

  const data = await InventoryRecordService.create(ctx, input)

  return sdk.api.created(data)
})
```

This pattern is safe because:

```txt
context is verified
module enablement is checked
input is validated
orgId is server-derived
permission is enforced
business logic stays in service
response shape is standardized
errors are normalized
```

---

# 42. Claude Implementation Prompt Template

Use this prompt when asking Claude to implement generated API templates or a future API Generator.

```md
You are implementing the OneDayOS API Generator contract.

Authoritative documents:
- docs/engineering-manual/04-kernel/08-kernel-api-contracts.md
- docs/engineering-manual/05-sdk/01-sdk-public-api.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md
- docs/engineering-manual/06-data/05-data-validation-zod.md
- docs/engineering-manual/08-module-system/04-module-permissions.md
- docs/engineering-manual/09-cli-generators/04-api-generator.md

Rules:
- Generate Next.js route handlers only.
- Do not generate FastAPI or Python backend files.
- Do not import from @/kernel/* in generated module APIs.
- Do not import raw Prisma in generated module APIs.
- Do not use sdk.getDb(orgId).
- Do not accept client-supplied orgId.
- Use PlatformContext.
- Use API-safe auth helpers.
- Use tenant-scoped route paths.
- Use Zod strict schemas.
- Enforce permissions.
- Call services with PlatformContext.
- Return { data, error } JSON only.
- Add tests for 401, 403, wrong org, module disabled, validation, orgId rejection, and success.
- Stop if any required metadata is missing.

Task:
Implement only the API route template/generator scope described in this document.
```

---

# 43. Acceptance Criteria

This document is accepted when a senior engineer or Claude Code can implement API route templates without making architectural decisions.

## 43.1 Generated route acceptance criteria

A generated protected API route is acceptable only if:

```txt
[ ] It lives under the correct tenant-scoped route path
[ ] It validates route params
[ ] It authenticates using API-safe helpers
[ ] It resolves verified PlatformContext
[ ] It checks module enablement when module-scoped
[ ] It validates query/body input with strict Zod schemas
[ ] It rejects client-supplied orgId
[ ] It enforces permission before service call
[ ] It calls a service with PlatformContext
[ ] It returns { data, error, meta? } JSON
[ ] It never redirects
[ ] It never imports raw Prisma
[ ] It never imports @/kernel/* from generated module API code
[ ] It includes tests for auth, tenancy, module enablement, permission, validation, and success
```

## 43.2 Generator acceptance criteria

A future standalone API Generator is acceptable only if:

```txt
[ ] It refuses missing required metadata
[ ] It refuses unsafe route shapes
[ ] It refuses to generate orgId-based APIs
[ ] It emits tests with every route
[ ] It fails instead of overwriting existing files
[ ] It supports dry-run output
[ ] Its own output is checked for forbidden patterns
[ ] It does not generate FastAPI/Python files
```

---

# 44. Final Architectural Position

The API Generator is not primarily a productivity tool.

It is a security and architecture consistency tool.

If it generates unsafe APIs quickly, it damages OneDayOS.

If it generates secure APIs consistently, it becomes one of the strongest foundations for one-day delivery.

The correct default is:

```txt
Tenant-scoped route
API-safe context
Strict validation
Permission enforcement
Service call with PlatformContext
Standard JSON response
Security tests
```

Anything weaker should not be generated.
