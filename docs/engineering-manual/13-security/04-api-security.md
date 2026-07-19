# OneDayOS Engineering Manual — 13 Security / 04 API Security

**Document ID:** `13-security/04-api-security.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Foundation Build`  
**Owner:** OneDayOS Founder + ChatGPT Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/05-data-validation-zod.md`
- `13-security/00-security-model.md`
- `13-security/01-auth-security.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`

---

# 1. Purpose

This document defines API security for the restarted OneDayOS platform build.

APIs are the most important enforcement boundary in OneDayOS because all module data mutations, Business Object operations, settings changes, onboarding flows, and future AI actions eventually pass through server-owned interfaces.

The previous MVP showed the exact failure modes this document must prevent:

- API routes using redirect-style auth helpers and returning HTML/redirects instead of JSON `401` responses.
- API routes protected only by authentication, not permission checks.
- Incomplete organization membership validation.
- Loose or client-supplied `orgId` patterns.
- Generated routes using unsafe route shapes like `/api/[module]?orgId=...`.
- Weak validation and weak generated tests.

The restarted platform must not repeat those patterns.

The goal is simple:

```txt
Every API route is tenant-safe, permission-safe, JSON-only, validated, testable, and generator-friendly.
```

---

# 2. Core API Security Doctrine

All OneDayOS APIs must follow this doctrine:

```txt
APIs are not page helpers.
APIs are security boundaries.
```

A secure OneDayOS API must:

1. Return JSON only.
2. Never redirect.
3. Never return HTML.
4. Validate route params.
5. Validate query params.
6. Validate request body.
7. Reject client-supplied `orgId`.
8. Create verified `PlatformContext` server-side.
9. Verify tenant membership before module/permission checks.
10. Verify module enablement when accessing module APIs.
11. Enforce permissions before service calls.
12. Call services with `PlatformContext`, not loose `orgId`.
13. Return a standard `{ data, error, meta? }` response.
14. Avoid leaking whether another tenant’s resource exists.
15. Include meaningful tests for both success and denial paths.

---

# 3. Scope

This document covers:

- Kernel APIs.
- Auth APIs.
- Current-user APIs.
- Organization-scoped APIs.
- Business Object APIs.
- Module APIs.
- Settings APIs.
- Future Platform Service APIs.
- Future AI APIs.
- Generated API route contracts.
- API response format.
- API error codes.
- API validation.
- API authorization flow.
- API tests.

---

# 4. Non-Goals

This document does **not** define:

- Full API implementation for every module.
- Public third-party API access.
- OAuth integrations.
- Webhooks.
- Rate limiting implementation.
- Background job APIs.
- AI runtime APIs.
- API key system.
- External developer platform.
- Mobile app API versioning.
- GraphQL.
- FastAPI.

Those are future documents or ADRs.

---

# 5. API Runtime Decision

For the restarted platform build, OneDayOS APIs use:

```txt
Next.js Route Handlers
TypeScript
Zod validation
Supabase Auth session validation
Prisma via SDK/server only
```

Do **not** add:

```txt
FastAPI
Express
NestJS
tRPC
GraphQL
Python API layer
Separate backend service
```

A second backend runtime would increase operational cost, duplicate security logic, confuse Claude, and weaken the one-platform architecture.

FastAPI may only be reconsidered later through an ADR for a narrow specialized service, such as document parsing, ML processing, or heavy Python-only background work. It must not become the main OneDayOS backend.

---

# 6. API Route Taxonomy

OneDayOS APIs fall into five categories.

## 6.1 Public Auth APIs

Examples:

```txt
POST /api/kernel/auth/register
GET  /api/kernel/auth/me
POST /api/kernel/auth/logout
```

These APIs handle authentication lifecycle.

They may be unauthenticated or session-aware depending on the endpoint.

They must still return JSON only.

---

## 6.2 Kernel Platform APIs

Examples:

```txt
GET  /api/kernel/auth/me
GET  /api/kernel/platform/status
```

These APIs serve platform-level needs that are not tied to a specific business module.

They must not expose tenant data without verified context.

---

## 6.3 Organization-Scoped Kernel APIs

Examples:

```txt
GET    /api/orgs/[orgSlug]/settings
PATCH  /api/orgs/[orgSlug]/settings
GET    /api/orgs/[orgSlug]/users
POST   /api/orgs/[orgSlug]/users
GET    /api/orgs/[orgSlug]/roles
POST   /api/orgs/[orgSlug]/roles
```

These APIs require verified organization membership.

They must create `PlatformContext` from:

```txt
session user
+ platform User row
+ orgSlug route param
+ Organization row
+ user.orgId === org.id
```

---

## 6.4 Business Object APIs

Examples:

```txt
GET    /api/orgs/[orgSlug]/objects/products
POST   /api/orgs/[orgSlug]/objects/products
GET    /api/orgs/[orgSlug]/objects/products/[productId]
PATCH  /api/orgs/[orgSlug]/objects/products/[productId]
DELETE /api/orgs/[orgSlug]/objects/products/[productId]

GET    /api/orgs/[orgSlug]/objects/employees
GET    /api/orgs/[orgSlug]/objects/customers
GET    /api/orgs/[orgSlug]/objects/suppliers
GET    /api/orgs/[orgSlug]/objects/warehouses
```

These APIs operate on shared Business Objects.

They use the `objects` permission namespace:

```txt
objects.product.read
objects.product.create
objects.product.update
objects.product.delete
objects.product.restore
```

They are not owned by Inventory, CRM, Leave, HR, Purchasing, or any other module.

---

## 6.5 Module APIs

Examples:

```txt
GET    /api/orgs/[orgSlug]/inventory/stock-levels
POST   /api/orgs/[orgSlug]/inventory/stock-adjustments
GET    /api/orgs/[orgSlug]/leave/requests
POST   /api/orgs/[orgSlug]/leave/requests
GET    /api/orgs/[orgSlug]/crm/deals
POST   /api/orgs/[orgSlug]/crm/deals
```

These APIs require:

```txt
authenticated user
verified tenant membership
enabled module
required permission
validated input
```

They must never be shaped like:

```txt
/api/inventory?orgId=...
/api/[module]
/api/products?orgId=...
```

---

# 7. Required API Route Shape

## 7.1 Tenant APIs

Tenant-scoped APIs must use this pattern:

```txt
/api/orgs/[orgSlug]/...
```

Good:

```txt
/api/orgs/acme/inventory/stock-adjustments
/api/orgs/acme/objects/products
/api/orgs/acme/settings
```

Bad:

```txt
/api/inventory?orgId=org_123
/api/products?orgId=org_123
/api/acme/inventory
/api/orgs/org_123/inventory
```

Why:

- `orgSlug` is a human-safe locator.
- `orgId` is a database tenant key and must not be supplied by the client.
- The server must resolve the slug and verify membership.

---

## 7.2 Route Params Are Untrusted

Every route param must be validated.

Example:

```ts
const ParamsSchema = z.strictObject({
  orgSlug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  productId: z.string().min(1),
})
```

Do not assume route params are safe because they came from the URL.

---

## 7.3 Query Params Are Untrusted

Query params must be validated with Zod before use.

Example:

```ts
const QuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().max(100).optional(),
})
```

Query params must never contain `orgId`.

---

## 7.4 Request Bodies Are Untrusted

Request bodies must use `z.strictObject()` by default.

Example:

```ts
const CreateProductSchema = z.strictObject({
  code: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  unit: z.string().min(1).max(40),
  categoryId: z.string().optional(),
})
```

This must reject:

```json
{
  "code": "P-001",
  "name": "Sample Product",
  "orgId": "some-other-org"
}
```

Do not use loose schemas that silently strip tenant fields unless the API contract explicitly requires stripping. For OneDayOS tenant identity, rejection is safer than silent stripping.

---

# 8. Standard API Response Shape

All APIs must return:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

Where:

```ts
type ApiError = {
  code: string
  message: string
  details?: unknown
}
```

Success:

```json
{
  "data": {
    "id": "product_123",
    "name": "Sample Product"
  },
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

Do not return:

```json
"Invalid input"
```

Do not return:

```json
{
  "error": "Invalid input"
}
```

Do not return raw Zod errors directly.

Do not return raw database errors.

---

# 9. Required Error Codes

## 9.1 Authentication Errors

```txt
UNAUTHENTICATED
```

HTTP status:

```txt
401
```

Example:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

Never redirect to `/login` from an API route.

---

## 9.2 Tenant Errors

```txt
ORG_NOT_FOUND
TENANT_ACCESS_DENIED
TENANT_ID_NOT_ALLOWED
```

Wrong-org access should generally return a safe `404` using `ORG_NOT_FOUND`.

Example:

```json
{
  "data": null,
  "error": {
    "code": "ORG_NOT_FOUND",
    "message": "Organization not found."
  }
}
```

This avoids revealing that another tenant exists.

Client-supplied `orgId` should return:

```json
{
  "data": null,
  "error": {
    "code": "TENANT_ID_NOT_ALLOWED",
    "message": "Tenant identity is server-derived and cannot be supplied by the client."
  }
}
```

---

## 9.3 Permission Errors

```txt
FORBIDDEN
```

HTTP status:

```txt
403
```

Example:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

Do not reveal exact permission internals to normal users unless needed for admin/debug UI.

---

## 9.4 Module Errors

```txt
MODULE_NOT_FOUND
MODULE_DISABLED
MODULE_DEPENDENCY_MISSING
```

For normal user-facing APIs, disabled/missing modules should return safe `404`.

Example:

```json
{
  "data": null,
  "error": {
    "code": "MODULE_NOT_FOUND",
    "message": "Module not found."
  }
}
```

---

## 9.5 Validation Errors

```txt
VALIDATION_ERROR
```

HTTP status:

```txt
400
```

Example:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request input.",
    "details": {
      "fieldErrors": {
        "name": ["Name is required"]
      }
    }
  }
}
```

---

## 9.6 Not Found Errors

```txt
NOT_FOUND
```

HTTP status:

```txt
404
```

For tenant-scoped resources, not found must not distinguish between:

```txt
record does not exist
record belongs to another organization
record is soft-deleted
```

All should usually appear as:

```txt
404 NOT_FOUND
```

---

## 9.7 Conflict Errors

```txt
CONFLICT
DUPLICATE_RECORD
LAST_ADMIN_REQUIRED
```

Examples:

- Duplicate product code within organization.
- Attempting to remove the last admin.
- Attempting to disable a module required by another enabled module.

---

## 9.8 Server Errors

```txt
INTERNAL_SERVER_ERROR
```

HTTP status:

```txt
500
```

Do not expose stack traces to the client.

Log internal details server-side.

---

# 10. API Auth Helpers

APIs must never use redirect-based page helpers.

Forbidden in API routes:

```ts
await sdk.auth.requireAuth()
```

if that helper redirects.

Required API-safe helpers:

```ts
await sdk.auth.requireApiAuth(req)
await sdk.auth.requireApiOrgContext(req, orgSlug)
await sdk.auth.requireApiModuleContext(req, orgSlug, moduleId)
```

## 10.1 `requireApiAuth`

Expected behavior:

```txt
valid session → returns authenticated platform user context
no session → throws/returns API 401 error
```

It must not redirect.

---

## 10.2 `requireApiOrgContext`

Expected behavior:

```txt
authenticated user
+ platform User row exists
+ orgSlug exists
+ user.orgId === org.id
→ returns PlatformContext
```

If the organization does not exist or does not belong to the user, return safe `404 ORG_NOT_FOUND`.

---

## 10.3 `requireApiModuleContext`

Expected behavior:

```txt
requireApiOrgContext
+ module exists in registry
+ module enabled for org
→ returns PlatformContext with module availability verified
```

If module is not enabled or does not exist, return safe `404 MODULE_NOT_FOUND`.

---

# 11. Required API Flow

Every protected API route must follow this order:

```txt
1. Validate route params.
2. Validate query params if present.
3. Validate request body if present.
4. Reject client-supplied tenant identity.
5. Create verified API PlatformContext.
6. Verify module enablement if module route.
7. Enforce permission.
8. Call service with PlatformContext and validated input.
9. Return standard JSON response.
```

The order matters.

Tenant membership must be verified before permission matching.

Permission must be enforced before mutation.

Services must not receive raw request bodies.

---

# 12. Standard API Wrapper

The SDK should provide a standard API wrapper:

```ts
sdk.api.handle(handler)
```

Example:

```ts
export const POST = sdk.api.handle(async (req, { params }) => {
  const parsedParams = ProductParamsSchema.parse(await params)
  const body = await sdk.api.parseJson(req, CreateProductSchema)

  const ctx = await sdk.auth.requireApiOrgContext(req, parsedParams.orgSlug)

  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'product',
    action: 'create',
  })

  const product = await ProductService.create(ctx, body)

  return sdk.api.created(product)
})
```

The wrapper should map known platform errors to standard API responses.

It should catch unexpected errors, log them server-side, and return `500 INTERNAL_SERVER_ERROR`.

---

# 13. API Route Examples

## 13.1 Business Object Create API

Example:

```ts
import { sdk } from '@/sdk/server'
import { CreateProductSchema, ProductRouteParamsSchema } from '@/objects/product/schema'
import { ProductService } from '@/objects/product/service'

export const POST = sdk.api.handle(async (req, { params }) => {
  const { orgSlug } = ProductRouteParamsSchema.parse(await params)
  const input = await sdk.api.parseJson(req, CreateProductSchema)

  const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'product',
    action: 'create',
  })

  const product = await ProductService.create(ctx, input)

  return sdk.api.created(product)
})
```

---

## 13.2 Module Mutation API

Example:

```ts
import { sdk } from '@/sdk/server'
import { CreateStockAdjustmentSchema, InventoryParamsSchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'

export const POST = sdk.api.handle(async (req, { params }) => {
  const { orgSlug } = InventoryParamsSchema.parse(await params)
  const input = await sdk.api.parseJson(req, CreateStockAdjustmentSchema)

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
  })

  const adjustment = await InventoryService.createStockAdjustment(ctx, input)

  return sdk.api.created(adjustment)
})
```

---

## 13.3 List API

Example:

```ts
export const GET = sdk.api.handle(async (req, { params }) => {
  const { orgSlug } = ProductRouteParamsSchema.parse(await params)
  const query = sdk.api.parseQuery(req, ProductListQuerySchema)

  const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'product',
    action: 'read',
  })

  const result = await ProductService.list(ctx, query)

  return sdk.api.ok(result.data, { pagination: result.pagination })
})
```

---

# 14. Forbidden API Patterns

## 14.1 Redirecting from APIs

Forbidden:

```ts
await requireAuth()
```

if unauthenticated behavior is:

```txt
redirect('/login')
```

APIs must return:

```txt
401 JSON
```

---

## 14.2 Client-Supplied `orgId`

Forbidden:

```ts
const orgId = body.orgId
const orgId = req.nextUrl.searchParams.get('orgId')
await Service.list(orgId)
```

Required:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
await Service.list(ctx)
```

---

## 14.3 Raw Prisma in Module APIs

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
```

inside module API files.

Required:

```ts
const db = sdk.getDb(ctx)
```

usually inside services, not API routes.

---

## 14.4 API Route Doing Business Logic

Forbidden:

```ts
export async function POST(req) {
  const ctx = ...
  const body = ...
  await prisma.stockMovement.create(...)
  await prisma.stockBalance.update(...)
  return NextResponse.json(...)
}
```

Required:

```ts
const result = await InventoryService.createStockMovement(ctx, input)
return sdk.api.created(result)
```

API routes coordinate.

Services own business logic.

---

## 14.5 Missing Permission Check

Forbidden:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const data = await InventoryService.create(ctx, input)
```

Required:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

The service should enforce permissions too during MVP.

---

## 14.6 Raw Error Exposure

Forbidden:

```ts
catch (err) {
  return NextResponse.json({ error: String(err) }, { status: 500 })
}
```

Forbidden:

```ts
return NextResponse.json({ error: err.stack }, { status: 500 })
```

Required:

```ts
logger.error(err)
return sdk.api.error('INTERNAL_SERVER_ERROR', 'Something went wrong.', 500)
```

---

## 14.7 HTML Responses

Forbidden:

```txt
API route returns login page HTML.
```

This happens when API routes call redirecting page auth helpers.

Tests must explicitly verify that protected APIs return JSON `401` when unauthenticated.

---

# 15. API Validation Rules

## 15.1 Strict Body Schemas

Use:

```ts
z.strictObject({ ... })
```

by default.

Do not use:

```ts
z.object({ ... })
```

if unknown keys could hide dangerous input like `orgId`, `userId`, `roleId`, or internal flags.

---

## 15.2 Reject Internal Fields

Client request schemas must reject internal fields such as:

```txt
orgId
createdAt
updatedAt
deletedAt
deletedBy
createdBy
updatedBy
isSystem
roleIds unless endpoint explicitly manages roles
permissionIds unless endpoint explicitly manages permissions
```

---

## 15.3 Validate Relation IDs Server-Side

If input references another record, the service must validate that the related record belongs to the same organization.

Example:

```ts
const warehouse = await db.warehouse.findFirst({
  where: {
    id: input.warehouseId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})

if (!warehouse) throw new NotFoundError('Warehouse not found')
```

Do not trust relation IDs just because they came from a form select.

---

## 15.4 Validate Pagination

All list APIs should constrain pagination.

Recommended default:

```txt
pageSize default: 25
pageSize max: 100
```

Do not allow unbounded list APIs by default.

---

## 15.5 Validate Sort Fields

Never accept raw `orderBy` objects from the client.

Bad:

```json
{
  "orderBy": {
    "someInternalField": "desc"
  }
}
```

Good:

```ts
const allowedSortFields = ['name', 'createdAt', 'code'] as const
```

Map safe sort keys to Prisma internally.

---

## 15.6 Validate Filter Fields

Never accept raw Prisma `where` from the client.

Bad:

```ts
const where = body.where
await db.product.findMany({ where })
```

Good:

```ts
const filters = ProductFilterSchema.parse(query)
const where = ProductService.buildWhere(ctx, filters)
```

---

# 16. Tenant Safety in APIs

## 16.1 Org Slug Resolution

APIs must resolve organization by `orgSlug`.

Then verify:

```ts
user.orgId === org.id
```

If not, return safe `404 ORG_NOT_FOUND`.

---

## 16.2 No Tenant Leakage

Wrong-tenant resource access should not reveal:

```txt
that the resource exists
which organization owns it
whether the org slug is valid
whether the user almost had access
```

Return safe `404`.

---

## 16.3 All Service Calls Use `PlatformContext`

Bad:

```ts
await ProductService.getById(productId, orgId)
```

Good:

```ts
await ProductService.getById(ctx, productId)
```

---

## 16.4 Cross-Tenant API Tests Required

Every tenant-scoped API test suite must include:

```txt
Org A user
Org A record
Org B user
Org B record
```

Test that Org A cannot read, update, delete, restore, export, or mutate Org B records.

---

# 17. Permission Safety in APIs

## 17.1 Permission Checks Are Mandatory

Every protected API must declare and enforce its required permission.

Examples:

```txt
GET products        → objects.product.read
POST products       → objects.product.create
PATCH product       → objects.product.update
DELETE product      → objects.product.delete
POST product restore→ objects.product.restore
GET export products → objects.product.export
```

---

## 17.2 Read Is Not Export

A user with read permission must not automatically be allowed to export.

Export APIs require explicit export permission.

---

## 17.3 Create Is Not Import

A user with create permission must not automatically be allowed to import.

Import APIs require explicit import permission.

---

## 17.4 UI Hiding Is Not Security

Even if a button is hidden, the API must enforce permission.

All sensitive APIs must return `403 FORBIDDEN` for unauthorized users.

---

# 18. Current User API

The current user API should be:

```txt
GET /api/kernel/auth/me
```

It should return the current platform user derived from the session.

It should not be:

```txt
GET /api/kernel/users/[id]
```

Reason:

```txt
The current user is session-derived, not ID-derived.
```

A user should not be able to request another user by guessing an ID.

If future admin user-management APIs are needed, they belong under organization-scoped admin routes:

```txt
GET /api/orgs/[orgSlug]/users/[userId]
```

and must enforce permissions.

---

# 19. Registration API Security

Registration is a special auth API.

The registration route must own the Supabase Auth ↔ Prisma sync seam.

Required rules:

1. The client must not call `supabase.auth.signUp()` directly for organization registration.
2. The server route creates the Supabase Auth user.
3. The server route creates Organization, User, Subscription, Admin Role, and Admin permission records.
4. If Prisma creation fails, the Supabase Auth user should be rolled back when possible.
5. The first user receives Admin role inside only their organization.
6. Registration response must not expose service role details or internal errors.

Recommended route:

```txt
POST /api/kernel/auth/register
```

---

# 20. Logout API Security

Logout may be handled client-side by Supabase browser auth, but if an API route exists it must return JSON.

Example:

```txt
POST /api/kernel/auth/logout
```

Response:

```json
{
  "data": {
    "success": true
  },
  "error": null
}
```

Do not return redirects from API logout.

Page-level logout buttons may redirect after receiving success.

---

# 21. API Logging

API logging should record enough to debug issues without leaking secrets.

Recommended log fields:

```txt
requestId
method
path
status
userId if authenticated
orgId if context resolved
moduleId if module route
error code
latency
```

Do not log:

```txt
passwords
session tokens
auth cookies
service role keys
full request bodies with sensitive data
full AI prompts containing private records
full exported data
```

A structured logger can be introduced later.

For MVP, consistent server-side `console.error` with safe metadata is acceptable.

---

# 22. API Rate Limiting

Rate limiting is not required in the first restarted foundation build, but the API contract must leave room for it.

Future error code:

```txt
RATE_LIMITED
```

Future HTTP status:

```txt
429
```

Candidate future targets:

- Login attempts.
- Registration attempts.
- Password reset attempts.
- Export APIs.
- Import APIs.
- Future AI APIs.
- Future public webhooks.

Do not implement generic rate limiting yet unless a specific risk demands it.

---

# 23. CSRF Posture

For the MVP, OneDayOS primarily uses same-origin APIs with Supabase session cookies/browser auth patterns.

Do not create cross-origin public mutation APIs without a separate security review.

Future CSRF hardening may include:

- SameSite cookie review.
- Origin checks on mutation APIs.
- CSRF tokens if required by auth/session behavior.

Claude must not add public cross-origin mutation APIs casually.

---

# 24. CORS Posture

Do not enable broad CORS in MVP.

Forbidden:

```txt
Access-Control-Allow-Origin: *
```

for authenticated business APIs.

OneDayOS web app APIs are same-origin by default.

If future public integrations or mobile apps need CORS, define that through a separate API Access / Public API document.

---

# 25. File Upload API Posture

Attachment APIs are deferred.

Until Attachment Service is implemented:

- Do not add generic upload APIs.
- Do not expose raw Supabase Storage paths from clients.
- Do not trust client-supplied bucket or path.
- Do not use public buckets for private business files.

If a module-local file upload is approved before Attachment Service exists, it requires a dedicated security spec.

---

# 26. Import / Export API Posture

Full Import / Export Engine is deferred.

Limited founder/developer-run onboarding scripts are allowed.

If module-local import/export APIs are approved:

- Import requires explicit import permission.
- Export requires explicit export permission.
- Exports must respect tenant isolation.
- Exports must respect sensitive-field restrictions.
- Imports must validate before writing.
- Imports must not accept `orgId`.
- Imports must use services, not raw DB writes.

---

# 27. AI API Posture

Runtime AI APIs are deferred.

No API should allow:

```txt
AI-generated SQL execution
AI-generated Prisma query execution
AI direct mutation of production data
AI bypass of permissions
AI unrestricted export of business records
```

Future AI APIs must use verified `PlatformContext` and human confirmation for mutations.

---

# 28. Webhooks

Webhooks are deferred.

Do not implement inbound or outbound webhooks during the foundation build.

Future webhook APIs require:

- Signature verification.
- Replay protection.
- Idempotency.
- Tenant mapping.
- Event schema versioning.
- Retry behavior.
- Secret rotation.

---

# 29. Public API / API Keys

Public API access is deferred.

Do not implement API keys during the foundation build.

Future API keys require:

- Tenant scope.
- Permission scope.
- Expiration.
- Rotation.
- Last-used tracking.
- Audit logging.
- Rate limiting.
- Revocation.

---

# 30. API Idempotency

For MVP, idempotency keys are not required for all APIs.

However, future high-risk operations should support idempotency:

- Payments.
- Imports.
- Bulk jobs.
- Webhooks.
- Background job enqueueing.
- External integrations.

Do not add ad hoc idempotency patterns per module.

When needed, define a platform-level idempotency contract.

---

# 31. API Versioning

Internal app APIs do not require `/v1` prefixes during MVP.

Recommended MVP shape:

```txt
/api/kernel/...
/api/orgs/[orgSlug]/...
```

Do not add public API versioning until OneDayOS exposes external developer APIs or mobile-app-compatible APIs.

Module manifest/API compatibility should still be documented in module specs.

---

# 32. API Documentation Requirements

Every official module spec must document its APIs.

For each API, include:

```txt
method
path
purpose
auth required
module enablement required
permission required
route params schema
query schema
body schema
success response
error responses
events emitted
service called
tests required
```

Claude should not implement APIs from vague module descriptions.

---

# 33. API Test Requirements

Every protected API must test:

```txt
unauthenticated request returns 401 JSON
wrong organization returns safe 404 JSON
module disabled returns safe 404 JSON when applicable
authenticated but unauthorized user returns 403 JSON
invalid route params return 400 JSON
invalid query params return 400 JSON
invalid body returns 400 JSON
client-supplied orgId is rejected
successful request returns { data, error: null }
response content type is JSON
no redirect response is returned
service is called with PlatformContext, not orgId
```

Mutation APIs must also test:

```txt
permission enforced before mutation
validation enforced before mutation
wrong-tenant relation IDs rejected
soft-deleted related records rejected
successful mutation emits event
failed mutation does not emit event
```

Delete APIs must test:

```txt
soft delete, not hard delete
wrong-tenant delete denied
soft-deleted record no longer appears in normal reads
```

Export APIs, when introduced, must test:

```txt
read permission alone is insufficient
export permission required
sensitive fields excluded unless explicitly allowed
```

---

# 34. Generated API Requirements

The Module Generator and future API Generator must emit APIs that follow this document.

Generated APIs must include:

- Tenant-scoped route path.
- Route param validation.
- Query validation where needed.
- `z.strictObject()` body validation.
- Client-supplied `orgId` rejection.
- API-safe auth/context helper.
- Module enablement check.
- Permission check.
- Service call using `PlatformContext`.
- Standard `{ data, error, meta? }` response.
- API tests for success and failure paths.

Generated APIs must not include:

```txt
/api/[module]
?orgId=...
sdk.getDb(orgId)
raw Prisma import
@/kernel/* import inside module route
redirect-based auth helper
auth-only protection
placeholder tests
HTML response
```

---

# 35. Architecture Checks

The restarted platform should include architecture checks that block unsafe API patterns.

Recommended future command:

```bash
npm run check:architecture
```

It should detect:

```txt
/api/[module] route patterns
searchParams.get('orgId')
body.orgId in API routes
sdk.getDb(orgId)
import { prisma } from '@/kernel/db/client' inside modules
import from '@/kernel/*' inside modules
redirecting auth helper used in API routes
NextResponse.redirect inside API routes except explicitly approved public flows
missing permission helper in generated protected APIs
raw Prisma where from request body
```

This can begin with grep-style checks and later move to ESLint/custom AST rules.

---

# 36. Claude Implementation Rules

When Claude implements APIs, it must follow these rules:

1. Do not invent API route shapes.
2. Use `/api/orgs/[orgSlug]/...` for tenant APIs.
3. Use `/api/orgs/[orgSlug]/objects/...` for Business Object APIs.
4. Use `/api/orgs/[orgSlug]/[moduleId]/...` for module APIs.
5. Do not accept `orgId` in params, query, or body.
6. Do not use redirect-based auth helpers.
7. Do not return HTML.
8. Do not return raw Zod errors.
9. Do not return raw database errors.
10. Do not import raw Prisma inside modules.
11. Do not skip permission checks.
12. Do not call services with loose `orgId`.
13. Do not put business logic inside API route handlers.
14. Add tests for `401`, `403`, safe `404`, validation, and success.
15. Stop and ask for manual clarification if a route needs external/public API behavior.

---

# 37. API Implementation Prompt Template for Claude

Use this prompt when asking Claude to implement an API subsystem:

```md
You are implementing OneDayOS API routes for [SUBSYSTEM].

Authoritative documents:
- docs/engineering-manual/04-kernel/08-kernel-api-contracts.md
- docs/engineering-manual/13-security/04-api-security.md
- docs/engineering-manual/13-security/02-tenant-isolation.md
- docs/engineering-manual/13-security/03-permission-enforcement.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md
- docs/engineering-manual/06-data/05-data-validation-zod.md

Rules:
- APIs return JSON only.
- APIs never redirect.
- Use tenant route shape `/api/orgs/[orgSlug]/...`.
- Never accept client-supplied `orgId`.
- Create verified `PlatformContext` before data access.
- Enforce permissions before service calls.
- Services receive `PlatformContext`, not loose `orgId`.
- Use Zod strict schemas.
- Add tests for 401, 403, safe 404, validation, client-supplied orgId rejection, and success.
- Do not import raw Prisma in modules.
- Do not import from `@/kernel/*` inside modules.

Task:
Implement only the API routes described in [SPEC].
Do not add unrelated modules, Platform Services, FastAPI, webhooks, API keys, rate limiting, or AI APIs.
```

---

# 38. Acceptance Criteria

This document is satisfied when the restarted foundation build has:

```txt
[ ] API-safe auth helper exists.
[ ] API-safe org context helper exists.
[ ] API-safe module context helper exists.
[ ] APIs return JSON only.
[ ] Protected APIs never redirect.
[ ] Standard { data, error, meta? } helpers exist.
[ ] Standard API error codes exist.
[ ] Route param validation pattern exists.
[ ] Query validation pattern exists.
[ ] Body validation pattern exists.
[ ] Client-supplied orgId rejection exists.
[ ] Wrong-org access returns safe 404.
[ ] Permission denial returns 403 JSON.
[ ] Unauthenticated access returns 401 JSON.
[ ] Module-disabled access returns safe 404.
[ ] Current-user API is session-derived.
[ ] Module APIs use /api/orgs/[orgSlug]/[moduleId]/...
[ ] Business Object APIs use /api/orgs/[orgSlug]/objects/...
[ ] Generated API templates follow this document.
[ ] API tests cover 401/403/404/400/success.
[ ] API tests verify no redirect/HTML auth response.
[ ] Architecture checks block unsafe API patterns.
```

---

# 39. Production Readiness Gate Impact

No official module should be implemented until API security passes.

The platform is not production-safe for multiple clients until:

```txt
API auth returns JSON 401.
API tenant checks are enforced.
API permission checks are enforced.
Client-supplied orgId is rejected.
Cross-tenant API reads are denied.
Cross-tenant API writes are denied.
Generated module APIs are secure by default.
```

---

# 40. Final Rule

The final API security rule is:

```txt
A OneDayOS API route is not complete because it works.
It is complete only when it fails safely.
```

Every API must be designed for the unhappy paths:

```txt
not logged in
wrong org
module disabled
no permission
bad input
soft-deleted record
wrong-tenant relation
unexpected server error
```

If those cases are not tested, the API is not done.
