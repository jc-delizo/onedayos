# OneDayOS Engineering Manual — 15 Deployment & Operations — 05 Error Handling

**Document ID:** `15-deployment-operations/05-error-handling.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Foundation Build`  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
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
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/05-data-validation-zod.md`
- `13-security/00-security-model.md`
- `13-security/04-api-security.md`
- `13-security/05-data-security.md`
- `15-deployment-operations/04-monitoring-observability.md`

---

# 1. Purpose

This document defines how OneDayOS handles errors across the platform.

Error handling is not just a developer convenience. In a multi-tenant business platform, errors are part of the security model, support model, user experience, and AppCare promise.

OneDayOS must handle errors in a way that is:

```txt
safe
consistent
debuggable
user-friendly
machine-readable
tenant-safe
supportable
```

The goal is not to hide every error. The goal is to show the right level of information to the right audience.

```txt
User sees: what happened and what they can do.
Developer sees: enough diagnostic context to fix it.
Attacker sees: nothing useful.
Support sees: a request ID and safe operational context.
```

---

# 2. Core Rule

```txt
A OneDayOS error is handled correctly only when it fails safely,
communicates clearly, logs responsibly, and does not leak data.
```

A failed request is not automatically a bug.

These are normal expected outcomes:

```txt
401 unauthenticated
403 forbidden
404 wrong org / not found / disabled module
400 validation error
409 conflict
422 business rule violation
```

These are operational problems:

```txt
500 unhandled exception
503 provider unavailable
migration failure
database connection failure
unexpected service crash
```

Both categories need clear handling.

---

# 3. Non-Goals

This document does not implement:

```txt
custom observability platform
custom logging backend
custom incident management system
custom error dashboard
client-facing status page
AI support agent
background job failure dashboard
Audit Log Service
Activity Feed Service
Notification Service
FastAPI error layer
```

Those are separate systems or future capabilities.

For the restarted foundation build, OneDayOS needs a consistent error contract, typed error helpers, API wrapper behavior, safe logging rules, UI error patterns, and tests.

---

# 4. Error Handling Is a Platform Concern

Errors cross every layer:

```txt
Kernel
SDK
Database
Business Objects
Modules
Platform Services later
Client Configuration
UI
Deployment
Monitoring
Support
```

So errors must not be invented independently inside every module.

Modules may define business-specific error codes, but they must use the shared OneDayOS error structure.

---

# 5. Error Audience Model

Every error has multiple audiences.

## 5.1 User

The user needs:

```txt
clear message
next action
field-level errors when relevant
non-technical language
no stack traces
no secrets
no internal table names
no cross-tenant hints
```

Example:

```txt
“You do not have permission to create stock adjustments.”
```

Not:

```txt
“RolePermission lookup failed for user u_123 in org org_456.”
```

## 5.2 Developer

The developer needs:

```txt
request ID
error code
route
module
orgId when safe
userId when safe
timestamp
stack trace in server logs only
validated details
```

## 5.3 Support / AppCare

Support needs:

```txt
request ID
client organization name or slug
user email if safe
module affected
time of issue
plain-language symptom
known recovery steps
```

Support does not need:

```txt
passwords
tokens
full request bodies
full business records
raw SQL
service role keys
```

## 5.4 Attacker

An attacker should learn as little as possible.

Wrong-org access should not reveal that another organization exists. Sensitive record lookups should fail with safe `404` when the user is not allowed to know whether the record exists.

---

# 6. API Error Contract

Every API response must follow the Kernel API contract:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}

type ApiError = {
  code: string
  message: string
  details?: unknown
}

type ApiMeta = {
  requestId?: string
  pagination?: {
    page: number
    pageSize: number
    total?: number
  }
}
```

Successful response:

```json
{
  "data": {
    "id": "product_123",
    "name": "Printer Ink"
  },
  "error": null,
  "meta": {
    "requestId": "req_abc123"
  }
}
```

Failed response:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

APIs must never return:

```txt
HTML login pages
redirect responses
raw stack traces
plain string errors
unstructured JSON
framework default error pages
```

---

# 7. Standard Error Codes

OneDayOS should use a stable set of platform error codes.

## 7.1 Authentication Errors

| HTTP | Code | Meaning |
|---:|---|---|
| `401` | `UNAUTHENTICATED` | No valid session or token. |
| `401` | `SESSION_EXPIRED` | Session existed but is no longer valid. |
| `401` | `AUTH_PROVIDER_ERROR` | Supabase Auth failed unexpectedly. |

Required behavior:

```txt
API auth failures return JSON 401.
Page auth failures may redirect to login.
```

API routes must never call redirect-style page auth helpers.

---

## 7.2 Tenant Errors

| HTTP | Code | Meaning |
|---:|---|---|
| `404` | `ORG_NOT_FOUND` | Organization does not exist or user cannot access it. |
| `400` | `TENANT_ID_NOT_ALLOWED` | Request body/query included client-supplied `orgId`. |
| `403` | `ORG_SUSPENDED` | Organization exists and user belongs to it, but it is suspended. |

Important rule:

```txt
Wrong-org access should usually return safe 404, not 403.
```

Reason: `403` can reveal that the organization or record exists.

---

## 7.3 Authorization Errors

| HTTP | Code | Meaning |
|---:|---|---|
| `403` | `FORBIDDEN` | User lacks required permission. |
| `403` | `ROLE_REQUIRED` | User has no role or required role assignment. |
| `403` | `EXPORT_PERMISSION_REQUIRED` | User can read but cannot export. |
| `403` | `IMPORT_PERMISSION_REQUIRED` | User can create but cannot import. |

Important rule:

```txt
Admin wildcard permission never bypasses tenant isolation.
```

---

## 7.4 Module Errors

| HTTP | Code | Meaning |
|---:|---|---|
| `404` | `MODULE_NOT_FOUND` | Module does not exist or is not enabled for the org. |
| `409` | `MODULE_DEPENDENCY_MISSING` | Required module dependency is missing. |
| `409` | `MODULE_ALREADY_ENABLED` | Module is already enabled. |
| `409` | `MODULE_CANNOT_DISABLE` | Other enabled modules depend on this module. |

Disabled module behavior should generally be safe `404`, not `403`, for normal users.

---

## 7.5 Validation Errors

| HTTP | Code | Meaning |
|---:|---|---|
| `400` | `VALIDATION_ERROR` | Request body, route param, or query param failed validation. |
| `400` | `INVALID_ROUTE_PARAM` | Route parameter is malformed. |
| `400` | `INVALID_QUERY_PARAM` | Query string is malformed. |
| `400` | `UNKNOWN_FIELD` | Strict schema rejected unexpected field. |

Zod validation errors should be mapped into a stable `details` structure.

Example:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields.",
    "details": {
      "fieldErrors": {
        "name": ["Name is required."],
        "email": ["Invalid email address."]
      },
      "formErrors": []
    }
  }
}
```

---

## 7.6 Data Errors

| HTTP | Code | Meaning |
|---:|---|---|
| `404` | `RECORD_NOT_FOUND` | Record not found or not visible to user. |
| `409` | `CONFLICT` | Generic conflict. |
| `409` | `DUPLICATE_RECORD` | Unique constraint violation. |
| `409` | `RECORD_IN_USE` | Record cannot be deleted/deactivated because other records depend on it. |
| `409` | `STALE_RECORD` | Optimistic concurrency conflict. |
| `422` | `BUSINESS_RULE_VIOLATION` | Request is valid JSON but invalid business action. |

Soft-deleted records should behave as `RECORD_NOT_FOUND` unless the user is using an explicit restore/admin path.

---

## 7.7 System Errors

| HTTP | Code | Meaning |
|---:|---|---|
| `500` | `INTERNAL_ERROR` | Unexpected server failure. |
| `503` | `SERVICE_UNAVAILABLE` | Database, Supabase, or external provider unavailable. |
| `504` | `TIMEOUT` | Operation exceeded allowed time. |
| `429` | `RATE_LIMITED` | Too many requests. Deferred until rate limiting exists. |

For `500` errors, user-visible message should be generic.

Example:

```txt
“Something went wrong. Please try again or contact support with the request ID.”
```

Never expose:

```txt
stack traces
Prisma error internals
SQL strings
connection strings
service keys
environment variable names where not necessary
```

---

# 8. Typed Error Model

OneDayOS should define a small platform error class.

Recommended type:

```ts
export type OneDayErrorCode =
  | 'UNAUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'ORG_NOT_FOUND'
  | 'ORG_SUSPENDED'
  | 'TENANT_ID_NOT_ALLOWED'
  | 'FORBIDDEN'
  | 'MODULE_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RECORD_NOT_FOUND'
  | 'DUPLICATE_RECORD'
  | 'RECORD_IN_USE'
  | 'BUSINESS_RULE_VIOLATION'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'

type OneDayErrorOptions = {
  code: OneDayErrorCode
  status: number
  message: string
  details?: unknown
  exposeDetails?: boolean
  cause?: unknown
}

export class OneDayError extends Error {
  readonly code: OneDayErrorCode
  readonly status: number
  readonly details?: unknown
  readonly exposeDetails: boolean
  readonly cause?: unknown

  constructor(options: OneDayErrorOptions) {
    super(options.message)
    this.name = 'OneDayError'
    this.code = options.code
    this.status = options.status
    this.details = options.details
    this.exposeDetails = options.exposeDetails ?? false
    this.cause = options.cause
  }
}
```

Rules:

```txt
Typed, expected failures use OneDayError.
Unexpected failures become INTERNAL_ERROR at API boundary.
Services may throw OneDayError.
API route wrapper catches and maps errors to response shape.
UI receives stable JSON errors.
```

---

# 9. Where Errors Are Handled

## 9.1 API Boundary

API routes are the main error-normalization boundary.

API routes should:

```txt
create request ID
validate auth/context
validate inputs
call service
catch errors
map errors to JSON
log safely
return stable status code
```

API routes should not:

```txt
return raw errors
redirect
return HTML
call raw Prisma in module routes
accept client-supplied orgId
leak stack traces
```

Recommended pattern:

```ts
export const POST = sdk.api.handle(async (req, { params }) => {
  const { orgSlug } = await params

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  const input = await sdk.api.parseJson(req, CreateStockAdjustmentSchema)

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

## 9.2 Service Layer

Services own business behavior.

Services should:

```txt
receive PlatformContext
validate business rules
check permissions during MVP
use sdk.getDb(ctx)
emit events after successful mutations
throw typed OneDayError for expected failures
```

Services should not:

```txt
return NextResponse
redirect
read request objects
trust orgId strings
log full business records
leak database internals
```

Example:

```ts
export async function deleteProduct(ctx: PlatformContext, productId: string) {
  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'product',
    action: 'delete',
  })

  const db = sdk.getDb(ctx)

  const product = await db.product.findFirst({
    where: {
      id: productId,
      orgId: ctx.org.id,
      deletedAt: null,
    },
  })

  if (!product) {
    throw new OneDayError({
      code: 'RECORD_NOT_FOUND',
      status: 404,
      message: 'Product not found.',
    })
  }

  await db.product.update({
    where: { id_orgId: { id: productId, orgId: ctx.org.id } },
    data: { deletedAt: new Date(), deletedBy: ctx.user.id },
  })

  await sdk.events.emit(ctx, 'objects.product.deleted', {
    productId,
  })
}
```

---

## 9.3 UI Layer

UI should display errors clearly, but UI is not the security boundary.

UI should:

```txt
show form field errors
show toast for mutation failures
show inline error states for table/list loads
show permission-denied state when appropriate
show request ID for unexpected failures
```

UI should not:

```txt
display raw stack traces
hide security problems with generic failure messages only
assume hidden buttons equal security
submit orgId in forms
parse internal developer errors
```

---

## 9.4 Server Components and Pages

Page-level behavior differs from API behavior.

Allowed in page/server component context:

```txt
redirect('/login') for unauthenticated users
notFound() for missing/wrong org or missing page
render permission denied page
render module disabled/not found page
```

Forbidden in API context:

```txt
redirect('/login')
notFound() framework HTML response
throwing unhandled errors to Next.js default page
```

This distinction must be enforced by separate helpers:

```ts
sdk.auth.requirePageContext(...)
sdk.auth.requireApiContext(...)
sdk.auth.requireApiModuleContext(...)
```

---

# 10. Error Mapping Rules

## 10.1 Zod Errors

Zod validation failures become:

```txt
HTTP 400
VALIDATION_ERROR
```

Use a stable mapping helper.

Example:

```ts
function mapZodError(error: ZodError) {
  const flattened = z.flattenError(error)

  return new OneDayError({
    code: 'VALIDATION_ERROR',
    status: 400,
    message: 'Please check the highlighted fields.',
    details: flattened,
    exposeDetails: true,
  })
}
```

Rules:

```txt
Unknown keys should fail by default through z.strictObject().
Client-supplied orgId should fail explicitly.
Validation details are safe only if they come from schemas, not raw runtime internals.
```

---

## 10.2 Prisma Errors

Prisma errors should be mapped centrally, not inside every route.

Common mappings:

| Prisma/Error Pattern | OneDayOS Error |
|---|---|
| Unique constraint violation | `409 DUPLICATE_RECORD` |
| Foreign key violation | `409 RECORD_IN_USE` or `400 VALIDATION_ERROR` depending context |
| Record not found through expected lookup | `404 RECORD_NOT_FOUND` |
| Database unavailable | `503 SERVICE_UNAVAILABLE` |
| Unknown Prisma error | `500 INTERNAL_ERROR` |

Do not show Prisma error messages directly to users.

Bad:

```txt
Unique constraint failed on the fields: (`orgId`,`code`)
```

Good:

```txt
A product with this code already exists.
```

Business services may convert known Prisma conflicts into business-specific messages.

Example:

```ts
throw new OneDayError({
  code: 'DUPLICATE_RECORD',
  status: 409,
  message: 'A product with this code already exists.',
})
```

---

## 10.3 Supabase Auth Errors

Supabase Auth errors should be mapped into platform auth errors.

Examples:

| Situation | User Message |
|---|---|
| Invalid login | `Invalid email or password.` |
| Expired session | `Your session expired. Please sign in again.` |
| Auth provider unavailable | `Authentication is temporarily unavailable. Please try again.` |
| Registration conflict | `An account with this email already exists.` |

Do not expose provider internals directly.

The registration route must handle Supabase Auth + Prisma sync carefully:

```txt
create auth user
create org/user/subscription records
rollback auth user if Prisma creation fails
return safe error if rollback fails
log rollback failure server-side
```

---

## 10.4 Tenant Errors

Wrong-org access should not reveal whether the other org exists.

If user from `alpha` requests `/beta/dashboard`:

```txt
Page: notFound() or safe not-found screen
API: 404 ORG_NOT_FOUND
```

Not:

```txt
403 You cannot access Beta Corporation
```

Client-supplied `orgId` is different. It should be rejected clearly because it indicates an invalid request shape.

```txt
400 TENANT_ID_NOT_ALLOWED
```

---

## 10.5 Permission Errors

Missing permission should return:

```txt
403 FORBIDDEN
```

Example message:

```txt
“You do not have permission to create products.”
```

Permission errors should not reveal inaccessible data.

If a user can access Inventory but not a specific hidden record, prefer safe `404 RECORD_NOT_FOUND` when revealing record existence would leak information.

---

## 10.6 Module Disabled Errors

If module is disabled for organization:

```txt
404 MODULE_NOT_FOUND
```

Reason:

```txt
A disabled module should behave as unavailable to that org.
```

Do not return:

```txt
403 Your plan does not include Inventory
```

unless this is an intentional billing/upgrade UI inside an authorized admin/settings context.

---

## 10.7 Business Rule Errors

Business rule errors are valid requests that cannot be completed because of business state.

Examples:

```txt
cannot delete warehouse with stock
cannot approve already approved request
cannot deactivate last admin
cannot restore record whose required parent is deleted
cannot create stock movement with negative quantity
```

Use:

```txt
409 CONFLICT
```

or:

```txt
422 BUSINESS_RULE_VIOLATION
```

Recommended rule:

```txt
Use 409 when the conflict is with current system state.
Use 422 when the request is semantically invalid regardless of transient state.
```

Examples:

```txt
409 RECORD_IN_USE — Cannot delete warehouse because stock exists.
422 BUSINESS_RULE_VIOLATION — Stock adjustment quantity cannot be zero.
```

---

# 11. Request IDs

Every API response should include a request ID in `meta.requestId`.

Request IDs help connect:

```txt
user report
browser request
server log
Sentry event
Vercel runtime log
Supabase log
support ticket
```

Recommended helper:

```ts
function createRequestId() {
  return crypto.randomUUID()
}
```

The API wrapper should:

```txt
create request ID at start
include it in response meta
include it in logs
include it in Sentry scope/tags when available
```

User-facing unexpected error message:

```txt
“Something went wrong. Please contact support with request ID req_abc123.”
```

---

# 12. Logging Rules

Logs should be useful, but privacy-safe.

## 12.1 Allowed in Logs

Allowed:

```txt
requestId
timestamp
route
method
status code
error code
module ID
orgId
userId
record ID when necessary
duration
safe validation summary
stack trace for unexpected server errors
```

## 12.2 Forbidden in Logs

Forbidden:

```txt
passwords
session tokens
Supabase access/refresh tokens
service role key
DATABASE_URL
DIRECT_URL
full request bodies
full Prisma records
full customer records
bank details
government IDs
personal addresses when unnecessary
file contents
raw document text
AI prompts containing business data unless explicitly approved
```

## 12.3 Logging Expected Errors

Expected errors should not be logged as scary exceptions.

Examples:

```txt
401 unauthenticated
403 forbidden
404 wrong org
400 validation error
```

These may be logged at `info` or `warn` level depending on context.

Unexpected errors should be logged at `error` level and sent to error tracking.

---

# 13. Error Tracking Rules

Sentry or equivalent should receive unexpected server/client errors.

Send:

```txt
requestId
error code
route
module
orgId tag when safe
userId tag when safe
environment
release/version
```

Do not send:

```txt
full request bodies
full records
secrets
sensitive field values
unredacted business data
```

Session replay should not be enabled by default because OneDayOS screens may contain sensitive SME business data.

---

# 14. UI Error Patterns

## 14.1 Form Errors

Form validation errors should appear near the relevant field.

Example:

```txt
Name is required.
Invalid email address.
Product code already exists.
```

For server-side validation, map API `VALIDATION_ERROR` details back to field errors where possible.

Do not show generic toasts for field-specific validation when inline field errors are available.

---

## 14.2 Mutation Errors

Mutation failures should use toast or inline banner depending on context.

Examples:

```txt
“Failed to create product. Please check the form and try again.”
“You do not have permission to delete this record.”
“This warehouse cannot be deleted because it still has stock.”
```

Optimistic UI rollback should be visible and understandable.

If optimistic delete fails:

```txt
restore row
show error toast
refresh server state
```

---

## 14.3 Table/List Errors

Tables should support:

```txt
loading state
empty state
error state
permission-denied state
module-disabled state
```

Error state should include retry when applicable.

Example:

```txt
“We couldn’t load products. Try again or contact support if this continues.”
```

Do not show raw API JSON in UI.

---

## 14.4 Page-Level Errors

Page errors should distinguish:

```txt
not found
permission denied
module unavailable
unexpected error
```

A page that fails because of wrong-org access should not reveal the other org.

---

## 14.5 Supportable Unexpected Errors

Unexpected error pages should include:

```txt
short apology
request ID
retry guidance
support guidance
```

Example:

```txt
Something went wrong.
Please try again. If this continues, contact support with request ID req_abc123.
```

---

# 15. Module Error Rules

Modules may define module-specific error codes, but they must fit the platform contract.

Example inventory-specific codes:

```txt
inventory.STOCK_INSUFFICIENT
inventory.WAREHOUSE_HAS_STOCK
inventory.INVALID_STOCK_ADJUSTMENT
```

However, API response codes should still map to stable categories:

```txt
409 RECORD_IN_USE
422 BUSINESS_RULE_VIOLATION
404 RECORD_NOT_FOUND
403 FORBIDDEN
```

Recommended pattern:

```ts
throw new OneDayError({
  code: 'BUSINESS_RULE_VIOLATION',
  status: 422,
  message: 'Stock adjustment quantity cannot be zero.',
  details: {
    moduleCode: 'inventory.INVALID_STOCK_ADJUSTMENT',
  },
  exposeDetails: true,
})
```

---

# 16. Business Object Error Rules

Business Object errors use the `objects` namespace conceptually.

Examples:

```txt
Product not found.
Customer not found.
Employee number already exists.
Warehouse code already exists.
Supplier cannot be deleted because purchase records reference it.
```

Business Object services must:

```txt
use PlatformContext
scope by orgId
reject client-supplied orgId
use soft delete
emit events only after successful mutation
return safe errors
```

---

# 17. Event Error Rules

Event listener failures must not normally break the original business mutation.

Example:

```txt
Product created successfully.
Search indexing listener fails.
Product creation still succeeds.
Listener failure is logged for operations.
```

Reason:

```txt
Events are decoupled reactions.
They are not usually part of the core transaction.
```

Exception:

```txt
If the reaction is required for correctness,
it does not belong in an async event listener.
It belongs inside the service transaction.
```

Event error rules:

```txt
log listener failure safely
include event name
include requestId/correlationId when available
include orgId from envelope, not payload
never leak full payload if sensitive
never retry in-process forever
```

Background retry/durable outbox is deferred.

---

# 18. Soft Delete Error Rules

Soft-deleted records should be invisible to normal reads.

Normal access to a soft-deleted record returns:

```txt
404 RECORD_NOT_FOUND
```

Restore paths may return more specific errors:

```txt
404 RECORD_NOT_FOUND — deleted record does not exist
403 FORBIDDEN — user cannot restore
409 RECORD_IN_USE — restore conflicts with an active duplicate
409 BUSINESS_RULE_VIOLATION — parent record is deleted
```

Deletes should be idempotent when reasonable.

If user deletes an already soft-deleted record through normal delete route:

```txt
404 RECORD_NOT_FOUND
```

or:

```txt
200 success with already-deleted semantics
```

Choose per module, but prefer `404` for normal business records to avoid revealing hidden state.

---

# 19. Import / Export Error Rules

Full Import / Export Engine is deferred, but controlled onboarding scripts may exist.

Import errors should distinguish:

```txt
file parse error
schema validation error
row validation error
relation lookup error
duplicate record conflict
permission error
partial write prevention
```

Export errors should distinguish:

```txt
missing export permission
module disabled
invalid filters
record count too large
provider unavailable
```

Important:

```txt
Read permission is not export permission.
Create permission is not import permission.
```

---

# 20. AI Error Rules

Runtime AI features are deferred.

When future AI exists, errors must never reveal:

```txt
hidden data
permission-denied data
raw prompts with secrets
model provider internals
cross-tenant context
```

AI should fail closed.

Example:

```txt
“I can’t access that information with your current permissions.”
```

Not:

```txt
“I found records but you are not allowed to see them.”
```

---

# 21. Environment-Specific Error Behavior

## 21.1 Local Development

Local may show richer developer diagnostics in terminal logs.

Still forbidden:

```txt
committing secrets
showing service role key in browser
logging full sensitive request bodies
using production data casually
```

## 21.2 Preview

Preview should behave like production for security.

Preview must not use production database credentials.

## 21.3 Staging

Staging should mimic production error behavior.

Staging may have more verbose logs, but still no secrets or sensitive data.

## 21.4 Production

Production must:

```txt
return safe messages
include request IDs
log safely
send unexpected errors to monitoring
never expose stack traces to users
never expose raw provider errors
```

---

# 22. Error Handling Helpers Required

The restarted foundation build should include these helpers.

Recommended files:

```txt
src/sdk/shared/errors.ts
src/sdk/server/api.ts
src/sdk/server/logging.ts
src/sdk/server/error-mapping.ts
src/components/kernel/error/ErrorState.tsx
src/components/kernel/error/PermissionDenied.tsx
src/components/kernel/error/UnexpectedError.tsx
```

## 22.1 Shared Error Types

Shared-safe package:

```txt
@/sdk/shared/errors
```

May include:

```ts
ApiError
ApiResponse
OneDayErrorCode
error code constants
```

Must not import:

```txt
Prisma
Supabase admin
server env
@/kernel/*
```

## 22.2 Server API Wrapper

Server-only SDK:

```txt
@/sdk/server
```

May expose:

```ts
sdk.api.handle
sdk.api.ok
sdk.api.created
sdk.api.noContent
sdk.api.error
sdk.api.parseJson
sdk.api.parseQuery
sdk.api.parseParams
```

## 22.3 UI Error Components

UI components should be generic and design-system aligned:

```txt
ErrorState
EmptyState
PermissionDeniedState
ModuleUnavailableState
InlineFieldError
FormErrorSummary
```

These are UI primitives, not security.

---

# 23. Generator Requirements

Generated APIs must include error handling by default.

Generated module API route must include:

```txt
sdk.api.handle wrapper
request ID
API-safe auth/context helper
Zod validation
tenant-scoped orgSlug path
client-supplied orgId rejection
permission enforcement
service call with PlatformContext
stable JSON response
```

Generated tests must include:

```txt
401 JSON
403 JSON
safe 404 wrong org
MODULE_NOT_FOUND disabled module
VALIDATION_ERROR malformed body
TENANT_ID_NOT_ALLOWED body includes orgId
success response shape
no redirect
no HTML response
```

Forbidden generated patterns:

```txt
throw new Error('...') in API route without wrapper
return NextResponse.json({ error: '...' }) with inconsistent shape
redirect('/login') inside API route
notFound() inside API route
request.nextUrl.searchParams.get('orgId')
body.orgId
sdk.getDb(orgId)
raw Prisma import in module API
full Prisma error returned to client
```

---

# 24. Testing Requirements

Error handling requires tests across layers.

## 24.1 Unit Tests

Unit tests should cover:

```txt
OneDayError construction
error-to-response mapping
Zod error mapping
Prisma error mapping
Supabase error mapping
request ID generation
safe detail exposure
```

## 24.2 API Tests

API tests should cover:

```txt
401 unauthenticated returns JSON
403 forbidden returns JSON
wrong-org returns safe 404
module-disabled returns safe 404
validation error returns field details
client-supplied orgId returns TENANT_ID_NOT_ALLOWED
unexpected service error returns INTERNAL_ERROR
no redirects
no HTML
requestId included
```

## 24.3 Service Tests

Service tests should cover:

```txt
expected business errors
permission errors
record not found
soft-deleted record hidden
conflict handling
event not emitted on failure
```

## 24.4 UI Tests

UI tests should cover:

```txt
field errors render inline
toast appears on mutation error
optimistic rollback occurs on failure
table error state appears
permission-denied state appears
unexpected error includes request ID when available
```

## 24.5 Architecture Checks

Architecture checks should block:

```txt
redirect() in API routes
notFound() in API routes
raw Prisma in modules
sdk.getDb(orgId)
client-supplied orgId patterns
inconsistent API response shapes
console.log(process.env)
console.log(full request body)
```

---

# 25. Anti-Patterns

## 25.1 Returning Raw Errors

Bad:

```ts
catch (err) {
  return NextResponse.json({ error: String(err) }, { status: 500 })
}
```

Good:

```ts
return sdk.api.internalError(err)
```

---

## 25.2 Redirecting from API Routes

Bad:

```ts
await sdk.auth.requireAuth()
```

if it redirects.

Good:

```ts
await sdk.auth.requireApiContext(req)
```

---

## 25.3 Leaking Tenant Existence

Bad:

```txt
403 You cannot access Beta Corporation.
```

Good:

```txt
404 Organization not found.
```

---

## 25.4 Treating UI Errors as Security

Bad:

```txt
Hide Delete button and assume user cannot delete.
```

Good:

```txt
Hide Delete button for UX.
API and service still enforce delete permission.
```

---

## 25.5 Swallowing Errors Silently

Bad:

```ts
try {
  await doSomething()
} catch {}
```

Good:

```ts
try {
  await doSomething()
} catch (error) {
  logSafeError(error, { requestId, operation: '...' })
}
```

---

## 25.6 Logging Full Business Records

Bad:

```ts
console.error('Failed customer update', customer)
```

Good:

```ts
logger.error('Failed customer update', {
  requestId,
  orgId: ctx.org.id,
  userId: ctx.user.id,
  customerId,
  errorCode,
})
```

---

## 25.7 Exposing Provider Errors Directly

Bad:

```txt
PrismaClientKnownRequestError: Unique constraint failed on fields...
```

Good:

```txt
A product with this code already exists.
```

---

# 26. Claude Implementation Rules

Claude must follow these rules when implementing error handling:

```txt
1. Do not invent new API response shapes.
2. Do not return raw strings as errors.
3. Do not use redirect() in API routes.
4. Do not use notFound() in API routes.
5. Do not expose raw Prisma/Supabase errors to users.
6. Do not log full request bodies or full records.
7. Do not accept client-supplied orgId.
8. Do not use sdk.getDb(orgId).
9. Do not import raw Prisma in modules.
10. Do not add FastAPI or Python error middleware.
11. Do not add a custom monitoring platform.
12. Do not add user-facing AI error handling until AI runtime exists.
13. Add tests for failure paths before claiming completion.
14. Include request IDs in API responses where possible.
15. Report which tests and checks passed.
```

---

# 27. Minimum Implementation Scope for Restarted Build

The restarted foundation build should implement:

```txt
[ ] OneDayError class
[ ] standard error code constants
[ ] API response helpers
[ ] API wrapper with request ID
[ ] Zod error mapping
[ ] Prisma error mapping
[ ] Supabase auth error mapping
[ ] safe logging helper
[ ] generic UI error states
[ ] API failure-path tests
[ ] architecture checks for forbidden patterns
```

It should not implement:

```txt
custom monitoring dashboard
custom incident platform
Audit Log Service
Activity Feed Service
Notification Service
AI support agent
background job error dashboard
FastAPI error service
```

---

# 28. Acceptance Criteria

This document is satisfied when:

```txt
[ ] All API routes return { data, error, meta? } JSON.
[ ] API auth failures return JSON 401, never redirects.
[ ] Wrong-org access returns safe 404.
[ ] Missing permission returns 403.
[ ] Client-supplied orgId is rejected.
[ ] Validation errors return stable field/form details.
[ ] Unexpected errors return safe 500 messages.
[ ] Request IDs are included in API responses where possible.
[ ] Server logs include request IDs.
[ ] Logs do not include secrets or full business records.
[ ] Services throw typed expected errors.
[ ] APIs map typed errors centrally.
[ ] UI shows clear error states.
[ ] Generated modules include error-path tests.
[ ] Architecture checks block unsafe error patterns.
[ ] No FastAPI/Python error layer exists in core platform.
```

---

# 29. Summary

Error handling in OneDayOS must support security, usability, debugging, AppCare, and long-term platform reuse.

The correct pattern is:

```txt
Typed service errors
+ centralized API mapping
+ JSON-only API responses
+ safe user messages
+ request IDs
+ privacy-safe logging
+ meaningful UI states
+ denial-path tests
```

The wrong pattern is:

```txt
raw exceptions
redirecting APIs
HTML error pages
unstructured JSON
full-record logs
client-supplied orgId
provider errors shown to users
Claude-generated placeholder tests
```

Core rule:

```txt
OneDayOS is not done when the happy path works.
It is done when the failure path is safe, clear, and supportable.
```
