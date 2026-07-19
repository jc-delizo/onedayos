# OneDayOS Engineering Manual — 04 Kernel — 08 Kernel API Contracts

**Document ID:** `04-kernel/08-kernel-api-contracts.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Owner:** OneDayOS Architecture  
**Author:** ChatGPT, acting as founding software architect  
**Date:** July 2026  
**Implementation Allowed:** No — freeze this document before asking Claude Code to implement it.  
**Applies To:** Restarted OneDayOS platform build  

---

## 1. Purpose

This document defines the HTTP API contract for OneDayOS.

It exists to prevent the restarted platform from repeating the old MVP problems:

- API routes using page-style auth helpers that redirect to `/login`.
- API responses returning HTML redirects instead of machine-readable JSON.
- Routes trusting client-supplied `orgId`.
- Current-user lookup through unsafe ID-based routes.
- Permission checks existing in theory but not being enforced in APIs.
- Each module inventing its own API response shape.

For the restarted build, APIs must be secure, boring, predictable, tenant-aware, and generator-friendly from day one.

---

## 2. Non-Goals

This document does **not** define:

- The full database schema.
- The full SDK surface.
- UI component behavior.
- Individual module business logic.
- Public third-party API access.
- Webhook ingestion.
- Background jobs.
- Realtime subscriptions.
- GraphQL.
- tRPC.

OneDayOS will start with simple, explicit Next.js Route Handlers using JSON APIs.

---

## 3. Core API Principles

### 3.1 APIs return JSON only

API routes must never redirect and must never return HTML for expected auth, validation, or permission failures.

```txt
Correct:
Unauthenticated API request → 401 JSON

Incorrect:
Unauthenticated API request → 307 redirect to /login
```

Page routes may redirect.

API routes must not.

---

### 3.2 Every API response uses the same envelope

Every successful or failed API response must use this shape:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

This applies to Kernel APIs, Business Object APIs, Platform Service APIs, and Module APIs.

---

### 3.3 Tenant identity is server-derived

Client requests may include an organization slug in the URL.

Client requests must not include `orgId` in query strings or request bodies for tenant-scoped operations.

Allowed:

```txt
/api/orgs/acme-corp/inventory/products
```

Forbidden:

```txt
/api/inventory/products?orgId=org_123
/api/inventory/products body: { "orgId": "org_123" }
```

`orgSlug` locates the organization.

It does not authorize access.

The server must always verify:

```txt
authenticated user
+ platform User row exists
+ requested orgSlug exists
+ user.orgId === org.id
+ org is active enough for requested operation
```

Only after those checks may the API create a verified `PlatformContext`.

---

### 3.4 APIs enforce permissions

API routes must enforce permissions.

UI checks are not security.

A hidden button does not protect data.

Every protected mutation route must enforce:

```txt
Authentication
Tenant membership
Organization status
Module enablement, when module-scoped
Permission
Input validation
```

Read routes also require permission unless the resource is explicitly public.

The default is protected.

---

### 3.5 Services receive verified context

Module and Business Object services must receive a verified `PlatformContext`, not loose strings.

Correct:

```ts
ProductService.create(ctx, input)
InventoryService.list(ctx, filters)
sdk.getDb(ctx)
```

Incorrect:

```ts
ProductService.create(orgId, input)
InventoryService.list(orgId)
sdk.getDb(orgId)
```

This protects OneDayOS from accidentally passing client-supplied tenant IDs into the data layer.

---

### 3.6 Route handlers stay thin

API route handlers are orchestration boundaries.

They should:

1. Resolve context.
2. Check module enablement.
3. Check permission.
4. Parse and validate input.
5. Call a service.
6. Return a standardized response.

They should not contain complex business logic.

---

## 4. API Route Taxonomy

OneDayOS has four API route categories.

---

## 4.1 Public Kernel Auth APIs

These APIs do not require an existing session.

Examples:

```txt
POST /api/kernel/auth/register
GET  /api/kernel/auth/health
```

`POST /api/kernel/auth/register` is public, but still heavily validated and rate-limit-ready.

It owns the Supabase Auth ↔ Prisma User/Organization creation seam.

The client must not call Supabase `signUp()` directly.

---

## 4.2 Authenticated Kernel Session APIs

These APIs require authentication but may not require an org slug in the URL.

Canonical current-user endpoint:

```txt
GET /api/kernel/auth/me
```

This replaces unsafe current-user patterns like:

```txt
GET /api/kernel/users/[id]
```

The client should not ask for the current user by ID after login.

The server already knows the authenticated Supabase user from the session.

`/api/kernel/auth/me` should return the signed-in platform user and their organization context.

Example response:

```json
{
  "data": {
    "user": {
      "id": "user_123",
      "name": "Juan dela Cruz",
      "email": "juan@example.com"
    },
    "org": {
      "id": "org_123",
      "slug": "acme-corp",
      "name": "Acme Corp",
      "status": "trial"
    }
  },
  "error": null
}
```

---

## 4.3 Organization-Scoped Kernel APIs

These APIs operate inside one tenant.

Pattern:

```txt
/api/orgs/[orgSlug]/kernel/[resource]
```

Examples:

```txt
GET    /api/orgs/acme-corp/kernel/users
POST   /api/orgs/acme-corp/kernel/users
PATCH  /api/orgs/acme-corp/kernel/users/user_123
DELETE /api/orgs/acme-corp/kernel/users/user_123

GET    /api/orgs/acme-corp/kernel/roles
POST   /api/orgs/acme-corp/kernel/roles

GET    /api/orgs/acme-corp/kernel/settings
PATCH  /api/orgs/acme-corp/kernel/settings
```

These routes require:

```txt
authentication
+ tenant membership
+ relevant kernel permission
```

Examples:

```txt
kernel.user.read
kernel.user.create
kernel.role.update
kernel.setting.update
```

---

## 4.4 Business Object APIs

Business Objects are shared platform entities used by multiple modules.

Pattern:

```txt
/api/orgs/[orgSlug]/objects/[businessObject]
```

Examples:

```txt
GET    /api/orgs/acme-corp/objects/employees
POST   /api/orgs/acme-corp/objects/employees
PATCH  /api/orgs/acme-corp/objects/employees/emp_123
DELETE /api/orgs/acme-corp/objects/employees/emp_123

GET    /api/orgs/acme-corp/objects/products
POST   /api/orgs/acme-corp/objects/products

GET    /api/orgs/acme-corp/objects/customers
GET    /api/orgs/acme-corp/objects/suppliers
GET    /api/orgs/acme-corp/objects/warehouses
```

Business Object APIs are not owned by any business module.

Inventory uses Product.

CRM uses Customer.

Purchasing uses Supplier.

But the shared API contract belongs to the platform.

---

## 4.5 Module APIs

Module APIs operate inside a tenant and a module domain.

Pattern:

```txt
/api/orgs/[orgSlug]/[moduleId]/[resource]
```

Examples:

```txt
GET    /api/orgs/acme-corp/inventory/stock-movements
POST   /api/orgs/acme-corp/inventory/stock-adjustments
GET    /api/orgs/acme-corp/leave/requests
POST   /api/orgs/acme-corp/leave/requests
GET    /api/orgs/acme-corp/crm/deals
```

This pattern is preferred over:

```txt
/api/[moduleId]/[resource]?orgId=...
```

The org slug is part of the URL because the app is tenant-scoped.

The actual `orgId` is resolved server-side.

---

## 5. Standard Response Envelope

### 5.1 Success response

```ts
type ApiSuccess<T> = {
  data: T
  error: null
  meta?: ApiMeta
}
```

Example:

```json
{
  "data": {
    "id": "prod_123",
    "code": "SKU-001",
    "name": "Blue Widget"
  },
  "error": null
}
```

---

### 5.2 Error response

```ts
type ApiFailure = {
  data: null
  error: ApiError
  meta?: ApiMeta
}
```

Example:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "requestId": "req_01JXYZ"
  }
}
```

---

### 5.3 Metadata

```ts
type ApiMeta = {
  requestId?: string
  pagination?: {
    cursor?: string | null
    nextCursor?: string | null
    limit: number
    hasMore: boolean
  }
  warnings?: string[]
}
```

Use `meta` only when needed.

Do not add random fields to the root response object.

Correct:

```json
{
  "data": [],
  "error": null,
  "meta": {
    "pagination": {
      "nextCursor": null,
      "limit": 50,
      "hasMore": false
    }
  }
}
```

Incorrect:

```json
{
  "items": [],
  "success": true,
  "page": 1
}
```

---

## 6. API Error Shape

```ts
type ApiError = {
  code: ApiErrorCode
  message: string
  details?: unknown
  fieldErrors?: Record<string, string[]>
  requestId?: string
}
```

`message` must be safe to show to users.

`details` may be included for validation or known business errors, but must not expose stack traces, SQL, secrets, environment variables, database connection strings, or internal service-role information.

---

## 7. Standard Error Codes

```ts
type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'ORG_NOT_FOUND'
  | 'ORG_SUSPENDED'
  | 'MODULE_DISABLED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'METHOD_NOT_ALLOWED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
```

---

## 8. HTTP Status Code Mapping

| Status | Error Code | Meaning |
|---:|---|---|
| `200` | none | Successful read, update, delete, or action. |
| `201` | none | Resource created. |
| `400` | `BAD_REQUEST` | Malformed JSON, invalid query format, missing required route parameter. |
| `401` | `UNAUTHENTICATED` | No valid authenticated session. |
| `403` | `FORBIDDEN` | Authenticated but lacks permission. |
| `403` | `MODULE_DISABLED` | User belongs to org, but requested module is not enabled. |
| `404` | `ORG_NOT_FOUND` | Requested org does not exist or user is not allowed to know it exists. |
| `404` | `NOT_FOUND` | Tenant-scoped resource not found. |
| `409` | `CONFLICT` | Unique constraint or business conflict. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Expected JSON but received unsupported content type. |
| `422` | `VALIDATION_ERROR` | Request shape parsed but failed business/input validation. |
| `423` | `ORG_SUSPENDED` | Organization exists but operations are blocked due to subscription or admin suspension. |
| `429` | `RATE_LIMITED` | Rate limiting, future implementation. |
| `500` | `INTERNAL_ERROR` | Unexpected server error. |

Avoid `204 No Content` for normal API operations.

OneDayOS APIs should return the standard envelope even for deletes.

Example delete response:

```json
{
  "data": {
    "id": "prod_123",
    "deleted": true
  },
  "error": null
}
```

---

## 9. Tenant-Aware Error Behavior

### 9.1 Wrong organization slug

If an authenticated user from Org A requests Org B by slug:

```txt
GET /api/orgs/org-b/inventory/products
```

The API should return:

```txt
404 ORG_NOT_FOUND
```

not:

```txt
403 FORBIDDEN
```

Reason: do not confirm whether Org B exists.

---

### 9.2 Resource outside tenant

Never fetch a resource by ID first and then check `orgId`.

Incorrect:

```ts
const product = await db.product.findUnique({ where: { id } })
if (product.orgId !== ctx.orgId) return forbidden()
```

Correct:

```ts
const product = await db.product.findFirst({
  where: {
    id,
    orgId: ctx.orgId,
    deletedAt: null,
  },
})

if (!product) return api.notFound('Product not found.')
```

Resource existence must be determined inside the tenant boundary.

---

## 10. Required API Helpers

The restarted build should include a small Kernel API helper layer.

Recommended files:

```txt
src/kernel/api/
  response.ts
  errors.ts
  json.ts
  context.ts
  pagination.ts
  route.ts
  __tests__/
```

Kernel internals may import these files directly.

Modules should access public equivalents through `@/sdk` when needed.

---

## 10.1 `response.ts`

Purpose: create standardized JSON responses.

Required helpers:

```ts
api.ok<T>(data: T, meta?: ApiMeta): NextResponse<ApiSuccess<T>>
api.created<T>(data: T, meta?: ApiMeta): NextResponse<ApiSuccess<T>>
api.fail(status: number, error: ApiError): NextResponse<ApiFailure>
api.badRequest(message: string, details?: unknown): NextResponse<ApiFailure>
api.unauthenticated(message?: string): NextResponse<ApiFailure>
api.forbidden(message?: string): NextResponse<ApiFailure>
api.orgNotFound(message?: string): NextResponse<ApiFailure>
api.notFound(message?: string): NextResponse<ApiFailure>
api.validation(error: ZodError): NextResponse<ApiFailure>
api.conflict(message: string, details?: unknown): NextResponse<ApiFailure>
api.internal(requestId: string): NextResponse<ApiFailure>
```

All responses should include:

```txt
Content-Type: application/json
Cache-Control: no-store
```

for protected APIs.

---

## 10.2 `errors.ts`

Purpose: represent known application errors.

Recommended type:

```ts
export class ApiException extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
  }
}
```

Services may throw known domain exceptions.

API route handlers must convert them into the standard response envelope.

Unexpected exceptions become `500 INTERNAL_ERROR`.

---

## 10.3 `json.ts`

Purpose: safely parse request bodies.

Required behavior:

- Reject non-JSON content type for methods with body.
- Return `400 BAD_REQUEST` for malformed JSON.
- Return `422 VALIDATION_ERROR` for Zod validation failures.
- Reject tenant identity fields in tenant-scoped create/update payloads.

Example forbidden fields:

```txt
orgId
organizationId
tenantId
userId, when user should be derived from session
createdBy, when actor should be derived from session
updatedBy, when actor should be derived from session
```

Recommended helper:

```ts
parseJsonBody<T>(request: NextRequest, schema: z.ZodSchema<T>): Promise<
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<ApiFailure> }
>
```

All create/update Zod schemas for tenant-scoped resources should use `.strict()`.

---

## 10.4 `context.ts`

Purpose: create verified API contexts.

Required helpers:

```ts
requireApiAuth(): Promise<
  | { ok: true; authUser: SupabaseUser }
  | { ok: false; response: NextResponse<ApiFailure> }
>

requireApiPlatformUser(): Promise<
  | { ok: true; authUser: SupabaseUser; user: PlatformUser }
  | { ok: false; response: NextResponse<ApiFailure> }
>

requireApiOrgContext(orgSlug: string): Promise<
  | { ok: true; ctx: PlatformContext }
  | { ok: false; response: NextResponse<ApiFailure> }
>
```

`requireApiOrgContext(orgSlug)` must verify:

```txt
Supabase session exists
Prisma User row exists
Organization exists
User belongs to Organization
Organization is not deleted
Organization status allows access
Enabled modules are loaded into context
Roles and permissions are available or queryable
```

It must not redirect.

It must not call `notFound()`.

It must return JSON-safe failures.

---

## 10.5 `route.ts`

Purpose: wrap API handlers with consistent error mapping and request IDs.

Recommended helper:

```ts
withApiHandler(handler)
```

Required behavior:

- Generate or read a request ID.
- Catch known `ApiException`s.
- Catch Zod validation errors if they escape.
- Catch unexpected errors.
- Log unexpected errors server-side.
- Return safe `500 INTERNAL_ERROR` to client.

Do not expose raw stack traces to the browser.

---

## 11. PlatformContext Contract

All protected org-scoped APIs should create a `PlatformContext`.

Recommended shape:

```ts
type PlatformContext = {
  requestId: string

  auth: {
    supabaseUserId: string
    email?: string
  }

  user: {
    id: string
    name: string
    email: string
    isActive: boolean
  }

  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
    subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled'
    plan: 'starter' | 'pro' | 'enterprise'
  }

  permissions: {
    can: (requirement: PermissionRequirement) => Promise<boolean>
    require: (requirement: PermissionRequirement) => Promise<void>
  }

  modules: {
    enabled: Set<string>
    requireEnabled: (moduleId: string) => void
  }
}
```

Implementation may optimize this shape, but the architectural requirement is stable:

> APIs and services operate on a verified context, not raw tenant strings.

---

## 12. Permission Requirement Contract

Permission checks must use a structured requirement.

```ts
type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Examples:

```ts
{ module: 'kernel', resource: 'user', action: 'read' }
{ module: 'kernel', resource: 'role', action: 'update' }
{ module: 'objects', resource: 'product', action: 'create' }
{ module: 'inventory', resource: 'stock_adjustment', action: 'create' }
```

Permission matching is defined in the Authorization Enforcement document.

API routes must not manually implement wildcard permission logic.

They must call the Kernel permission helper.

---

## 13. Standard Route Handler Order

Every protected route should follow this order:

```txt
1. Resolve route params
2. Resolve API org context
3. Require module enabled, if module-scoped
4. Require permission
5. Parse query parameters or JSON body
6. Call service with PlatformContext
7. Return standardized response
```

Do not validate input before authentication for protected routes unless there is a specific reason.

Reason: unauthenticated users should receive `401`, not detailed validation feedback.

---

## 14. Canonical GET Route Template

Example:

```ts
import { NextRequest } from 'next/server'
import { api } from '@/kernel/api/response'
import { requireApiOrgContext } from '@/kernel/api/context'
import { parseSearchParams } from '@/kernel/api/pagination'
import { ProductService } from '@/business-objects/product/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params

  const ctxResult = await requireApiOrgContext(orgSlug)
  if (!ctxResult.ok) return ctxResult.response
  const ctx = ctxResult.ctx

  await ctx.permissions.require({
    module: 'objects',
    resource: 'product',
    action: 'read',
  })

  const filters = parseSearchParams(request.nextUrl.searchParams)
  const result = await ProductService.list(ctx, filters)

  return api.ok(result.data, { pagination: result.pagination })
}
```

---

## 15. Canonical POST Route Template

Example:

```ts
import { NextRequest } from 'next/server'
import { api } from '@/kernel/api/response'
import { requireApiOrgContext } from '@/kernel/api/context'
import { parseJsonBody } from '@/kernel/api/json'
import { CreateProductSchema } from '@/business-objects/product/schema'
import { ProductService } from '@/business-objects/product/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params

  const ctxResult = await requireApiOrgContext(orgSlug)
  if (!ctxResult.ok) return ctxResult.response
  const ctx = ctxResult.ctx

  await ctx.permissions.require({
    module: 'objects',
    resource: 'product',
    action: 'create',
  })

  const bodyResult = await parseJsonBody(request, CreateProductSchema)
  if (!bodyResult.ok) return bodyResult.response

  const product = await ProductService.create(ctx, bodyResult.data)

  return api.created(product)
}
```

---

## 16. Canonical PATCH Route Template

Example:

```ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  const { orgSlug, id } = await params

  const ctxResult = await requireApiOrgContext(orgSlug)
  if (!ctxResult.ok) return ctxResult.response
  const ctx = ctxResult.ctx

  await ctx.permissions.require({
    module: 'objects',
    resource: 'product',
    action: 'update',
  })

  const bodyResult = await parseJsonBody(request, UpdateProductSchema)
  if (!bodyResult.ok) return bodyResult.response

  const product = await ProductService.update(ctx, id, bodyResult.data)

  return api.ok(product)
}
```

---

## 17. Canonical DELETE Route Template

Deletes should be soft deletes unless a separate document explicitly allows hard delete.

Example:

```ts
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  const { orgSlug, id } = await params

  const ctxResult = await requireApiOrgContext(orgSlug)
  if (!ctxResult.ok) return ctxResult.response
  const ctx = ctxResult.ctx

  await ctx.permissions.require({
    module: 'objects',
    resource: 'product',
    action: 'delete',
  })

  await ProductService.softDelete(ctx, id)

  return api.ok({ id, deleted: true })
}
```

---

## 18. JSON Body Rules

### 18.1 Accepted content type

For `POST`, `PATCH`, and `PUT`, APIs should accept:

```txt
Content-Type: application/json
```

The implementation may accept content types with charset:

```txt
application/json; charset=utf-8
```

Unsupported content types return:

```txt
415 UNSUPPORTED_MEDIA_TYPE
```

---

### 18.2 Malformed JSON

Malformed JSON returns:

```txt
400 BAD_REQUEST
```

Example response:

```json
{
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Request body must be valid JSON."
  }
}
```

---

### 18.3 Validation failure

Zod validation failures return:

```txt
422 VALIDATION_ERROR
```

Example response:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please fix the highlighted fields.",
    "fieldErrors": {
      "name": ["Name is required."],
      "email": ["Invalid email address."]
    }
  }
}
```

---

### 18.4 Tenant fields are forbidden in body

Tenant-scoped create/update APIs must reject these payload fields:

```txt
orgId
organizationId
tenantId
```

Example:

```json
{
  "name": "Blue Widget",
  "orgId": "org_123"
}
```

Should return:

```txt
422 VALIDATION_ERROR
```

or:

```txt
400 BAD_REQUEST
```

The exact status may be chosen during implementation, but the behavior is non-negotiable:

> Client-supplied tenant identity must not be accepted silently.

---

## 19. Query Parameter Rules

Query parameters are allowed for:

```txt
search
filters
sorting
pagination
view options
```

They are not allowed for tenant identity.

Forbidden:

```txt
?orgId=...
?tenantId=...
```

If present on a tenant-scoped API, return a client error.

---

## 20. Pagination Contract

Default list pagination should use cursor pagination.

Query parameters:

```txt
?limit=50
?cursor=abc123
```

Rules:

```txt
Default limit: 50
Maximum limit: 100
Minimum limit: 1
```

Response:

```json
{
  "data": [
    { "id": "prod_1", "name": "Product 1" }
  ],
  "error": null,
  "meta": {
    "pagination": {
      "cursor": null,
      "nextCursor": "prod_1",
      "limit": 50,
      "hasMore": true
    }
  }
}
```

Offset pagination may be used for simple MVP tables if cursor pagination adds too much complexity, but API contracts should be designed so cursor pagination can replace it later.

---

## 21. Sorting and Filtering Rules

Sorting fields must be whitelisted.

Forbidden:

```ts
orderBy: request.nextUrl.searchParams.get('sort')
```

Correct:

```ts
const allowedSorts = ['name', 'createdAt', 'updatedAt'] as const
```

Filtering must be validated with Zod or a typed parser.

Do not pass arbitrary query parameters directly into Prisma.

---

## 22. Search Rules

Basic search may use `contains` filters during MVP.

Example:

```txt
?search=blue
```

Rules:

- Search is always tenant-scoped.
- Search results must respect permissions.
- Search fields must be explicitly listed.
- Search should not use raw SQL in MVP unless reviewed.

Platform Search Service is deferred until the Three Independent Use Cases Rule justifies it.

---

## 23. Mutation Response Rules

Mutations should return the canonical updated resource or a clear action result.

Create:

```json
{
  "data": {
    "id": "prod_123",
    "name": "Blue Widget"
  },
  "error": null
}
```

Update:

```json
{
  "data": {
    "id": "prod_123",
    "name": "Updated Widget"
  },
  "error": null
}
```

Delete:

```json
{
  "data": {
    "id": "prod_123",
    "deleted": true
  },
  "error": null
}
```

This supports optimistic UI reconciliation.

---

## 24. Conflict Rules

Unique constraint violations should be converted to `409 CONFLICT`.

Example:

```json
{
  "data": null,
  "error": {
    "code": "CONFLICT",
    "message": "A product with this code already exists."
  }
}
```

Do not expose raw Prisma error messages to users.

---

## 25. Authentication API Contract

### 25.1 Page auth vs API auth

Page helper:

```ts
requirePageAuth()
```

Behavior:

```txt
No session → redirect('/login')
```

API helper:

```ts
requireApiAuth()
```

Behavior:

```txt
No session → 401 JSON
```

API routes must never use redirect-style page auth helpers.

---

### 25.2 Current-user endpoint

Required endpoint:

```txt
GET /api/kernel/auth/me
```

Used after login to find the user’s organization and redirect target.

Response:

```json
{
  "data": {
    "user": {
      "id": "user_123",
      "name": "Juan dela Cruz",
      "email": "juan@example.com"
    },
    "org": {
      "id": "org_123",
      "slug": "acme-corp",
      "name": "Acme Corp"
    },
    "defaultPath": "/acme-corp/dashboard"
  },
  "error": null
}
```

Forbidden replacement:

```txt
GET /api/kernel/users/[id]
```

Reason: the server already knows the session user. Asking for user data by arbitrary ID creates IDOR risk.

---

## 26. Registration API Contract

Required endpoint:

```txt
POST /api/kernel/auth/register
```

Request:

```json
{
  "orgName": "Acme Corp",
  "name": "Juan dela Cruz",
  "email": "juan@example.com",
  "password": "minimum-8-characters"
}
```

Response:

```json
{
  "data": {
    "orgSlug": "acme-corp"
  },
  "error": null
}
```

Rules:

- Server owns Supabase Auth user creation.
- Server owns Prisma Organization creation.
- Server owns Prisma User creation.
- Server owns initial Subscription creation.
- Server owns initial Admin Role assignment.
- Client must not call Supabase `signUp()` directly.
- If Prisma creation fails after Supabase user creation, the server must attempt to roll back the Supabase user.
- The API response must not leak service-role errors.

---

## 27. Organization Status Behavior

Organization status affects API access.

Recommended behavior:

| Org State | Auth APIs | Kernel Settings | Module APIs |
|---|---|---|---|
| `trial` | Allowed | Allowed | Allowed if module enabled |
| `active` | Allowed | Allowed | Allowed if module enabled |
| `suspended` | Allowed | Limited | Blocked with `423 ORG_SUSPENDED` |
| `cancelled` | Allowed for owner/admin recovery | Limited | Blocked |
| `inactive` | Allowed for owner/admin recovery | Limited | Blocked |

Exact subscription state names may be finalized in the Subscription document.

The API contract requirement is:

> Module APIs must not continue operating normally for suspended organizations.

---

## 28. Module Enablement Contract

Module-scoped APIs must check that the module is enabled for the organization.

Example:

```txt
GET /api/orgs/acme-corp/inventory/stock-levels
```

Required checks:

```txt
ctx.modules.requireEnabled('inventory')
ctx.permissions.require({ module: 'inventory', resource: 'stock_level', action: 'read' })
```

If the module is not enabled:

```json
{
  "data": null,
  "error": {
    "code": "MODULE_DISABLED",
    "message": "This module is not enabled for this organization."
  }
}
```

Recommended status:

```txt
403
```

---

## 29. Business Object API Contract

Business Object APIs must emit events for mutations.

Example Product create flow:

```txt
POST /api/orgs/acme-corp/objects/products
→ require objects.product.create
→ ProductService.create(ctx, input)
→ sdk.events.emit('objects.product.created', payload)
→ return 201 JSON
```

Event naming should follow the approved global event convention.

Preferred Business Object event module prefix:

```txt
objects.product.created
objects.customer.updated
objects.supplier.deleted
objects.warehouse.created
kernel.employee.deactivated
```

`Employee` may use `kernel.employee.*` because Employee is closely tied to identity/org structure, but this should be finalized in the Business Object Event Contract document.

---

## 30. API Caching Rules

Protected APIs should default to:

```txt
Cache-Control: no-store
```

Do not cache tenant data in shared caches.

Public metadata endpoints may define their own caching later.

Do not use browser cache behavior as a data consistency mechanism.

---

## 31. CORS Rules

MVP APIs are same-origin browser APIs.

Do not add:

```txt
Access-Control-Allow-Origin: *
```

Public third-party API access is a future product surface and requires a separate API key, rate limit, audit, and permission model.

---

## 32. CSRF Rules

For MVP, OneDayOS APIs are same-origin and session-authenticated.

Minimum requirement:

- Do not enable broad CORS.
- Use Supabase session handling correctly.
- Mutations must require authenticated API context.
- Mutations must require JSON content type.

Future requirement:

- Add CSRF tokens if OneDayOS exposes cross-origin browser APIs, embedded apps, or third-party integrations.

---

## 33. Request ID and Logging

Every API error response should include a `requestId` when practical.

Example:

```json
{
  "data": null,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong. Please try again.",
    "requestId": "req_01JXYZ"
  }
}
```

Server logs should include:

```txt
requestId
route
method
userId, if authenticated
orgId, if resolved
error code
safe error message
```

Do not log:

```txt
passwords
Supabase service role key
raw authorization headers
full request bodies with sensitive fields
full stack traces in client responses
```

Stack traces may be logged server-side in development and observability tools.

---

## 34. Rate Limiting

Rate limiting is not required for the first internal MVP, but the API contract must remain rate-limit-ready.

Future rate-limited response:

```txt
429 RATE_LIMITED
```

Example:

```json
{
  "data": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again shortly."
  }
}
```

Registration and login-adjacent APIs should be the first candidates for rate limiting.

---

## 35. Idempotency

Idempotency keys are deferred.

Do not build an idempotency system yet.

However, the API design should not block future support for:

```txt
Idempotency-Key: <client-generated-key>
```

Future candidates:

- Bulk imports.
- Payment operations.
- External integrations.
- Background job-triggering APIs.

---

## 36. File Uploads

File uploads are deferred until Attachment Service is promoted.

Until then:

- Do not add ad hoc upload APIs inside modules.
- Do not store files as base64 JSON payloads.
- Do not mix file upload contracts into normal CRUD endpoints.

When Attachment Service is approved, it should define:

```txt
signed upload URLs
file metadata
entity attachment links
permissions
size limits
virus scanning future
```

---

## 37. Webhooks

Webhooks are deferred.

When added, webhooks must have a separate contract for:

- Signature verification.
- Idempotency.
- Replay protection.
- Event mapping.
- Audit logging.
- Failure handling.

Do not reuse session-authenticated browser API patterns for webhooks.

---

## 38. Forbidden API Patterns

Claude Code must not generate these patterns.

### 38.1 Redirect auth in API routes

Forbidden:

```ts
await requireAuth()
```

if `requireAuth()` redirects.

Required:

```ts
const ctxResult = await requireApiOrgContext(orgSlug)
if (!ctxResult.ok) return ctxResult.response
```

---

### 38.2 Client-supplied org ID

Forbidden:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
const orgId = body.orgId
```

Required:

```ts
const { org } = ctx
```

---

### 38.3 Raw Prisma in module API routes

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
```

inside module API routes.

Required:

```ts
import { sdk } from '@/sdk'
import { InventoryService } from '@/modules/inventory/service'
```

Service receives `PlatformContext` and uses `sdk.getDb(ctx)`.

---

### 38.4 Permissionless mutation

Forbidden:

```ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const data = await SomeService.create(body)
  return NextResponse.json({ data, error: null })
}
```

Required:

```ts
ctx.permissions.require(...)
```

before service mutation.

---

### 38.5 Unstandardized errors

Forbidden:

```ts
return NextResponse.json({ error: 'Bad request' }, { status: 400 })
```

Required:

```ts
return api.badRequest('Request body must be valid JSON.')
```

---

### 38.6 Throwing raw errors to client

Forbidden:

```ts
throw new Error('Prisma failed: ...')
```

without API error handling.

Required:

```ts
return api.internal(requestId)
```

and log the real error server-side.

---

### 38.7 Current user by arbitrary ID

Forbidden:

```txt
GET /api/kernel/users/[id]
```

for current-user lookup.

Required:

```txt
GET /api/kernel/auth/me
```

Admin user management may use org-scoped user APIs with explicit permission checks:

```txt
GET /api/orgs/[orgSlug]/kernel/users/[userId]
```

---

## 39. Module Generator API Requirements

The Module Builder CLI must generate API routes that follow this document by default.

Generated module APIs must include:

```txt
/api/orgs/[orgSlug]/[moduleId]/[resource]
```

not:

```txt
/api/[moduleId]?orgId=...
```

Generated route skeletons must include:

```txt
requireApiOrgContext(orgSlug)
ctx.modules.requireEnabled(moduleId)
ctx.permissions.require(...)
parseJsonBody(...)
Service.method(ctx, input)
api.ok / api.created
```

Generated tests must include security tests.

---

## 40. Required API Tests

Every protected API route must have tests for:

```txt
Unauthenticated request returns 401 JSON
Authenticated user from another org cannot access route
Suspended org receives org-status error where applicable
Disabled module receives MODULE_DISABLED
Missing permission receives 403 JSON
Malformed JSON receives 400 JSON
Invalid schema receives 422 JSON
Client-supplied orgId is rejected
Successful request returns { data, error }
Service receives PlatformContext, not loose orgId
```

---

## 41. Required Current-User Tests

`GET /api/kernel/auth/me` must have tests for:

```txt
No session → 401 JSON
Session exists but Prisma User missing → 401 or 404 safe JSON
Inactive user → 403 JSON
Valid user → returns user + org + defaultPath
Response does not expose sensitive role internals unless intentionally requested
```

---

## 42. Required Registration Tests

`POST /api/kernel/auth/register` must have tests for:

```txt
Invalid email → 422 JSON
Weak password → 422 JSON
Duplicate email → 409 or safe 400 JSON
Duplicate org slug generates suffix
Supabase creation failure returns safe error
Prisma failure triggers Supabase rollback attempt
First user receives Admin role
Admin role receives wildcard permission scoped to org
Response contains orgSlug, not raw service-role details
```

---

## 43. Required Tenant Isolation Tests

At least two organizations must exist in the test fixtures.

Tests must prove:

```txt
User A can access Org A API
User A cannot access Org B API
User A cannot read Org B resource by ID
User A cannot update Org B resource by ID
User A cannot delete Org B resource by ID
Admin wildcard in Org A does not apply to Org B
Client-supplied Org B orgId does not affect Org A context
```

These tests are production-readiness blockers.

---

## 44. Example API Test Shape

Example pseudocode:

```ts
describe('POST /api/orgs/[orgSlug]/objects/products', () => {
  it('returns 401 JSON when unauthenticated', async () => {
    const res = await POST(fakeRequest({ name: 'A' }), params('acme-corp'))
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({
      data: null,
      error: { code: 'UNAUTHENTICATED' },
    })
  })

  it('rejects client-supplied orgId', async () => {
    const res = await POST(
      authedRequest({ name: 'A', orgId: 'other-org' }),
      params('acme-corp')
    )
    expect(res.status).toBe(422)
    expect(await res.json()).toMatchObject({
      data: null,
      error: { code: 'VALIDATION_ERROR' },
    })
  })
})
```

---

## 45. Recommended Implementation Order

When Claude implements this document, use this order:

```txt
1. Create API type definitions.
2. Create response helpers.
3. Create API error class and error mapper.
4. Create safe JSON parser.
5. Create request ID helper.
6. Create requireApiAuth.
7. Create requireApiPlatformUser.
8. Create requireApiOrgContext.
9. Create permission-required integration with PlatformContext.
10. Create /api/kernel/auth/me.
11. Refactor registration route to standard envelope.
12. Create tests for auth/me and registration.
13. Create one sample org-scoped API using the contract.
14. Add generator template requirements after module generator document is updated.
```

Do not implement every Business Object API as part of this document.

This document creates the API foundation.

Specific APIs are implemented by their own subsystem documents.

---

## 46. Claude Code Implementation Prompt

Use this prompt when implementing this document after it is frozen:

```md
You are implementing OneDayOS Kernel API Contracts.

Authoritative document:
docs/engineering-manual/04-kernel/08-kernel-api-contracts.md

Related frozen documents:
- 04-kernel/01-authentication.md
- 04-kernel/02-organizations-tenancy.md
- 04-kernel/03-users-roles-permissions.md
- 04-kernel/04-authorization-enforcement.md
- 13-security/09-security-stabilization-new-build-spec.md

Rules:
- Do not invent a different API response shape.
- APIs return JSON only.
- API auth must never redirect.
- Do not trust client-supplied orgId.
- Use verified PlatformContext for org-scoped APIs.
- Add tests for 401, 403, validation, and tenant isolation behavior.
- Do not implement business modules.
- Do not implement Platform Services.
- Stop and report if any manual instruction conflicts.

Task:
Implement only the API helper layer, auth/me endpoint, registration envelope alignment, and tests required by this document.
```

---

## 47. Acceptance Criteria

This document is complete when a fresh implementation can satisfy:

```txt
[ ] API response envelope type exists
[ ] API response helpers exist
[ ] API error codes are centralized
[ ] API auth helper returns 401 JSON, never redirect
[ ] API org context helper verifies membership
[ ] PlatformContext is created only after tenant verification
[ ] Current-user endpoint uses session, not user ID param
[ ] Tenant-scoped APIs reject client-supplied orgId
[ ] Validation errors return standard 422 shape
[ ] Forbidden errors return standard 403 shape
[ ] Wrong-org access does not leak tenant existence
[ ] Protected APIs default to no-store
[ ] API tests cover unauthenticated JSON behavior
[ ] API tests cover cross-tenant denial
[ ] API tests cover permission denial
[ ] API tests cover invalid JSON and Zod validation
[ ] No route uses redirect-based auth helper
[ ] No route returns ad hoc error shapes
```

---

## 48. Founder Review Checklist

Before freezing this document, confirm:

```txt
[ ] Approved route pattern: /api/orgs/[orgSlug]/[moduleId]/[resource]
[ ] Approved Business Object route pattern: /api/orgs/[orgSlug]/objects/[object]
[ ] Approved current-user endpoint: /api/kernel/auth/me
[ ] Approved JSON response envelope
[ ] Approved status code mapping
[ ] Approved wrong-org behavior as 404 ORG_NOT_FOUND
[ ] Approved no 204 responses for standard deletes
[ ] Approved rejection of client-supplied orgId
[ ] Approved requirement that module services receive PlatformContext
```

---

## 49. Architectural Decision Summary

The restarted OneDayOS build should treat API contracts as part of the Kernel, not as incidental route code.

The most important decision is:

> APIs are the security boundary between the browser and the platform.

Therefore:

```txt
No redirects.
No raw orgId.
No permissionless routes.
No ad hoc errors.
No unsafe current-user ID endpoints.
No module-specific API patterns.
```

OneDayOS can move fast only if generated APIs are safe by default.

