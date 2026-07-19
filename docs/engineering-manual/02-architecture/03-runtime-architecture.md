# OneDayOS Engineering Manual — 02 Architecture / 03 Runtime Architecture

**Document ID:** `02-architecture/03-runtime-architecture.md`  
**Version:** `1.0`  
**Status:** Frozen  
**Owner:** Founder / Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  
**Depends On:**

- `00-meta/01-manual-governance.md`
- `00-meta/03-claude-workflow.md`
- `00-meta/04-definition-of-done.md`
- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `02-architecture/02-repository-architecture.md`
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
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `13-security/00-security-model.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `13-security/04-api-security.md`

---

# 1. Purpose

This document defines how OneDayOS runs at runtime.

It explains what code runs in the browser, what code runs on the server, how requests move through the system, how tenant context is created, how modules are loaded, how APIs are called, how database access happens, how events are emitted, and what runtime patterns Claude must follow.

This document is not about folder structure. That is covered in `02-architecture/02-repository-architecture.md`.

This document is not about business logic. That belongs to Business Object specs and Module specs.

This document is not about deployment operations. That belongs to `15-deployment-operations/*`.

This document answers:

```txt
When OneDayOS is running, what happens where?
```

---

# 2. Runtime Summary

OneDayOS MVP runs as a **single full-stack Next.js application** deployed on Vercel, backed by Supabase Auth and Supabase-hosted PostgreSQL, accessed through Prisma.

```txt
Browser
  ↓
Next.js App Router on Vercel
  ↓
Kernel / SDK / Business Objects / Modules
  ↓
Prisma
  ↓
Supabase PostgreSQL

Supabase Auth
  ↕
Next.js server + browser session clients
```

The core runtime model is:

```txt
One codebase
One Vercel production deployment
One Supabase production project
One shared PostgreSQL database
Many OneDayOS Organizations inside the app
Tenant isolation through verified PlatformContext + orgId
```

Normal clients do not receive separate Vercel apps, separate Supabase projects, separate repos, or separate databases.

---

# 3. Runtime Non-Goals

The restarted foundation build must not introduce these runtimes:

```txt
FastAPI backend
Python API runtime
GraphQL server
Separate Express/NestJS backend
Supabase Edge Functions as application backend
Per-client backend deployments
Per-client Supabase projects
Runtime plugin loading
Remote module loading
Background worker runtime
Queue runtime
Runtime Dynamic CRUD engine
Runtime Dynamic Form engine
Runtime AI agent
```

These may be reconsidered only through future ADRs.

The default OneDayOS runtime is:

```txt
Next.js App Router + Route Handlers + Server Components + Client Components
```

---

# 4. Runtime Layers

At runtime, OneDayOS has these execution layers:

```txt
Browser Runtime
  Client Components
  Optimistic UI
  Browser-safe SDK client
  Fetch calls to tenant-scoped APIs

Next.js Server Runtime
  Server Components
  Route Handlers
  Auth/session helpers
  PlatformContext creation
  Kernel services
  SDK server surface
  Business Object services
  Module services
  Event emission

Database Runtime
  Prisma Client
  Supabase PostgreSQL
  Shared tenant-scoped tables

External Infrastructure Runtime
  Supabase Auth
  Vercel platform
  Monitoring/error tracking providers later
  Storage providers later
  AI providers later
```

Each layer has strict responsibilities.

---

# 5. Browser Runtime

The browser runtime is for user interaction only.

It may contain:

```txt
Client Components
React Hook Form
Zod client-side validation for UX
Optimistic UI state
Motion for React animations
sonner toasts
browser-safe SDK client helpers
fetch() calls to OneDayOS APIs
```

It must not contain:

```txt
Prisma
raw database access
@/sdk/server
@/kernel/* imports
server env access
service role key
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
trusted orgId
permission authority
tenant isolation authority
business mutation authority
```

Client Components may know the current `orgSlug` from the route.

Client Components must not treat `orgSlug` as proof of authorization.

Client Components must never submit `orgId`, even as a hidden field.

Bad:

```tsx
<input type="hidden" name="orgId" value={orgId} />
```

Bad:

```ts
await fetch('/api/inventory?orgId=' + orgId)
```

Good:

```ts
await fetch(`/api/orgs/${orgSlug}/inventory/products`, {
  method: 'POST',
  body: JSON.stringify({ name, code, unit }),
})
```

The server derives tenant identity from:

```txt
authenticated session
+ orgSlug route param
+ platform User record
+ Organization record
+ membership check
```

---

# 6. Server Runtime

The server runtime is the authority for:

```txt
authentication checks
tenant membership checks
PlatformContext creation
module enablement checks
permission enforcement
server-side validation
database access
business logic
event emission
API responses
server logs
```

Server runtime code may import:

```txt
@/sdk/server
@/kernel/* where appropriate inside Kernel/composition code
@/business-objects/* server files
@/modules/[module]/* server files
Prisma only inside Kernel/Data/SDK-approved server access
```

Server runtime code must still respect layer boundaries.

Modules may not import Kernel internals just because they run on the server.

Bad inside module code:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
```

Good inside module code:

```ts
import { sdk } from '@/sdk/server'
```

---

# 7. Next.js Runtime Decisions

## 7.1 App Router is the application runtime

OneDayOS uses the Next.js App Router.

The route tree controls:

```txt
layouts
pages
route handlers
loading states
error states
organization shell
module pages
Business Object pages
settings pages
```

## 7.2 Server Components by default

Most pages should start as Server Components.

Use Server Components for:

```txt
initial data fetch
PlatformContext creation
module enablement resolution
permission-aware page composition
server-only imports
safe data preparation
passing initial data into Client Components
```

Server Components should not contain browser interactivity.

They may pass safe props into Client Components.

## 7.3 Client Components only when needed

Use Client Components for:

```txt
forms
optimistic UI
local state
table row interactions
dialog open/close state
keyboard interactions
Motion animations
browser-only APIs
```

A component must not become a Client Component just because it is easier.

Every `'use client'` line increases the chance of accidentally pulling server-only logic into the browser.

## 7.4 Route Handlers are the canonical API boundary

For MVP, **Route Handlers are the canonical business API boundary**.

Use Route Handlers for:

```txt
create
read/list API
update
delete/soft-delete
workflow actions
imports/exports later
module APIs
Business Object APIs
settings APIs
```

Route Handlers must return JSON only.

They must follow the Kernel API contract:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

## 7.5 Server Actions are not the default mutation boundary

Server Actions are not the default OneDayOS mutation API for MVP.

Reason:

```txt
Route Handlers give us consistent JSON responses.
Route Handlers are easier to test for 401/403/404/validation errors.
Route Handlers support browser fetch and optimistic UI consistently.
Route Handlers make module APIs explicit.
Route Handlers align with client onboarding/API contract needs.
```

Server Actions may be reconsidered later for narrowly-scoped internal forms, but only after an ADR.

Claude must not replace Route Handler APIs with Server Actions for convenience.

---

# 8. Vercel Runtime

OneDayOS is designed for Vercel deployment.

The application runs as:

```txt
Next.js pages and layouts
Vercel-hosted server-rendered routes
Vercel Functions for Route Handlers
static assets through Vercel CDN
```

Important runtime rules:

```txt
Do not run database migrations during Vercel build.
Do not run long background work inside user-facing API requests.
Do not rely on in-memory state for durable business data.
Do not use in-memory queues.
Do not create one Vercel project per client.
```

Vercel rollback is code rollback.

It is not database rollback.

---

# 9. Node Runtime vs Edge Runtime

OneDayOS server code that uses Prisma must run in the Node.js runtime.

Default rule:

```txt
Use Node.js runtime for protected app routes and APIs.
Do not use Edge runtime for Prisma-backed business APIs.
```

Reason:

```txt
Prisma and database access belong in Node runtime.
Auth, PlatformContext, and permission checks need server-only dependencies.
Edge runtime adds constraints and complexity not needed for MVP.
```

Do not add:

```ts
export const runtime = 'edge'
```

to routes or pages that use:

```txt
Prisma
@sdk/server
Kernel auth/context helpers
Business Object services
Module services
```

If a future route needs Edge runtime, it requires an ADR.

---

# 10. Proxy / Middleware Runtime

If using Next.js 16+, the request interception layer may be implemented as `src/proxy.ts`.

The proxy layer may be used for:

```txt
Supabase session cookie refresh
light request normalization
public/auth route routing conveniences
```

The proxy layer must not be the main authority for:

```txt
tenant isolation
permission enforcement
module enablement
data access
business logic
redirecting API auth failures to login
```

APIs must enforce their own authentication and authorization.

Pages/layouts must create verified `PlatformContext` server-side.

Bad:

```txt
Proxy says user has a cookie, therefore API is safe.
```

Good:

```txt
API route calls sdk.auth.requireApiModuleContext(req, orgSlug, moduleId)
then sdk.permissions.require(ctx, permission)
then service method.
```

Proxy must not redirect `/api/*` requests to `/login`.

API auth failure must return JSON `401`.

---

# 11. Request Lifecycle — Authenticated Page Load

Example:

```txt
GET /acme-corp/inventory/products
```

Runtime flow:

```txt
1. Browser requests /acme-corp/inventory/products.
2. Next.js resolves the organization shell route.
3. Server layout reads orgSlug = "acme-corp".
4. Server auth helper reads Supabase session.
5. Kernel loads Prisma User by auth user id.
6. Kernel loads Organization by orgSlug.
7. Kernel verifies user.orgId === org.id.
8. Kernel creates PlatformContext.
9. Kernel checks organization status/subscription/module enablement.
10. Page checks required permission or composes permission-aware UI.
11. Server Component fetches page data through SDK/service.
12. Server passes safe initial data to Client Component.
13. Browser hydrates only interactive parts.
```

If no session:

```txt
Page route → redirect to /login
```

If wrong org:

```txt
Page route → safe 404 or not-found behavior
```

If module disabled:

```txt
Page route → safe 404 MODULE_NOT_FOUND or not-found behavior
```

If missing permission:

```txt
Page route → permission denied UI
```

---

# 12. Request Lifecycle — API Mutation

Example:

```txt
POST /api/orgs/acme-corp/inventory/stock-adjustments
```

Runtime flow:

```txt
1. Browser sends request to tenant-scoped API.
2. Route Handler validates route params.
3. Route Handler calls sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory').
4. Kernel verifies Supabase session.
5. Kernel loads User.
6. Kernel loads Organization by orgSlug.
7. Kernel verifies user.orgId === org.id.
8. Kernel verifies organization active/suspended state.
9. Kernel verifies module enabled for organization.
10. Route Handler validates request body using Zod strict schema.
11. Zod rejects client-supplied orgId if present.
12. Route Handler calls sdk.permissions.require(ctx, requiredPermission).
13. Route Handler calls module service with PlatformContext and validated input.
14. Service enforces permission again during MVP for sensitive operations.
15. Service performs transaction through sdk.getDb(ctx).
16. Service emits event after successful mutation.
17. Route Handler returns { data, error, meta? } JSON.
18. Client confirms optimistic UI state or rolls back on failure.
```

The service must receive:

```ts
InventoryService.createStockAdjustment(ctx, input)
```

not:

```ts
InventoryService.createStockAdjustment(orgId, input)
```

---

# 13. PlatformContext Runtime

`PlatformContext` is the central runtime security object.

It must be created only by Kernel/SDK server helpers.

It represents:

```txt
an authenticated platform user
inside a verified organization
with known roles/permissions
under known module enablement/subscription state
```

Conceptual shape:

```ts
type PlatformContext = {
  requestId: string
  authUserId: string
  user: {
    id: string
    email: string
    name: string
    isActive: boolean
  }
  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
    subscriptionStatus: string
  }
  roles: Array<{
    id: string
    name: string
  }>
  permissions: PermissionRequirement[]
  enabledModules: string[]
}
```

Rules:

```txt
PlatformContext is server-only.
PlatformContext is not serialized wholesale to the browser.
PlatformContext must never be constructed from request body orgId.
PlatformContext must never be mocked loosely in security-sensitive integration tests.
PlatformContext is required before database access in modules.
```

Client-safe context may be derived from it, but only minimal safe fields:

```ts
type ClientOrgContext = {
  orgSlug: string
  orgName: string
  userName: string
  visibleModules: NavItem[]
}
```

---

# 14. Database Runtime

Database access happens through Prisma in the server runtime.

Rules:

```txt
Modules never import raw Prisma.
Client Components never import raw Prisma.
Route Handlers should prefer services over raw DB calls.
Services use sdk.getDb(ctx).
Business Object services use sdk.getDb(ctx).
Kernel/Data layer may own raw Prisma setup.
```

Bad:

```ts
const product = await prisma.product.findUnique({ where: { id } })
```

Good:

```ts
const db = sdk.getDb(ctx)
const product = await db.product.findFirst({
  where: {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Tenant-scoped records must always be queried by tenant.

`findUnique({ where: { id } })` is forbidden for tenant-scoped business records unless the unique constraint includes `orgId`.

---

# 15. Supabase Runtime

Supabase provides:

```txt
Auth
PostgreSQL hosting
Storage later, when Attachment Service or approved module-local file handling exists
```

Supabase does not replace the OneDayOS Kernel.

Supabase Auth user is not enough to authorize app access.

Runtime rule:

```txt
Supabase Auth proves identity.
OneDayOS PlatformContext proves tenant membership and authorization.
```

Supabase service role key may be used only in server-only Kernel/admin paths such as registration provisioning.

It must never be used in:

```txt
Client Components
browser SDK
module code
module manifests
client-visible env vars
logs
Claude prompts
```

Supabase Storage is deferred until Attachment Service or approved module-local file handling exists.

Supabase Realtime, Edge Functions, Vector, and direct generated APIs are excluded from the restarted MVP foundation.

---

# 16. Route Runtime Model

## 16.1 Public routes

Examples:

```txt
/login
/register
```

Rules:

```txt
No PlatformContext required.
No tenant data access.
No service role in client code.
Registration posts to server-owned API.
```

## 16.2 Tenant shell routes

Examples:

```txt
/[orgSlug]/dashboard
/[orgSlug]/records/products
/[orgSlug]/inventory/stock-levels
/[orgSlug]/settings
```

Rules:

```txt
Must create PlatformContext.
Must verify org membership.
Must not statically generate tenant pages.
Must not expose another org's existence.
Must server-resolve navigation.
```

## 16.3 Kernel APIs

Examples:

```txt
/api/kernel/auth/register
/api/kernel/auth/me
```

Rules:

```txt
Used for platform-level auth/current-user behavior.
Must follow API error contract.
Must never expose arbitrary /users/[id] current-user lookup without IDOR checks.
```

## 16.4 Business Object APIs

Examples:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/employees
```

Rules:

```txt
Use PlatformContext.
Use objects.* permissions.
Use Business Object services.
Emit objects.* events.
Never live under module APIs.
```

## 16.5 Module APIs

Examples:

```txt
/api/orgs/[orgSlug]/inventory/stock-adjustments
/api/orgs/[orgSlug]/leave/requests
/api/orgs/[orgSlug]/crm/opportunities
```

Rules:

```txt
Use PlatformContext.
Verify module enablement.
Use module permissions.
Use module service.
Emit module events.
Never accept orgId.
```

---

# 17. Rendering Runtime

## 17.1 Protected tenant pages are dynamic

Tenant pages should be treated as dynamic.

Do not statically generate tenant-specific pages.

Bad:

```ts
export const revalidate = 3600
```

on protected tenant pages without explicit review.

Good:

```txt
Server page creates PlatformContext on each request.
Server fetches tenant-scoped data.
Client performs optimistic mutations and router.refresh().
```

## 17.2 Caching must not break tenancy

Do not cache tenant data globally unless:

```txt
cache key includes org/user/permission context
invalidations are known
security review approves it
```

Bad:

```ts
const products = cache(async () => db.product.findMany())
```

Good:

```ts
const products = await ProductService.list(ctx, filters)
```

If caching is introduced later, it requires a caching strategy document or ADR.

## 17.3 Client refresh after mutation

After successful mutation, Client Components should generally:

```txt
confirm optimistic state
show toast if useful
router.refresh() when server data must re-sync
```

On failure:

```txt
rollback optimistic state
show clear error
preserve form input where possible
```

---

# 18. Module Runtime

Modules are compiled into the OneDayOS app.

There is no runtime plugin marketplace in MVP.

Module discovery is static.

Runtime flow:

```txt
src/modules/index.ts exports known module manifests.
Platform composition root imports known manifests.
Registry validates manifests.
OrgModule table determines which modules are enabled for each org.
PlatformContext determines current user's visible module access.
Navigation is server-resolved.
Routes/APIs still enforce module enablement and permission.
```

A module can exist in the codebase but be disabled for an organization.

A module can be enabled for an organization but hidden from a user without permission.

A module dependency does not permit direct imports.

Bad:

```ts
import { InventoryService } from '@/modules/inventory/service'
```

inside Purchasing.

Good:

```txt
Purchasing emits purchasing.goods_receipt.posted.
A future approved integration listens and reacts.
```

---

# 19. Business Object Runtime

Business Objects run as shared domain services.

Examples:

```txt
Employee
Product
Customer
Supplier
Warehouse
```

They are not module-owned at runtime.

Their APIs live under:

```txt
/api/orgs/[orgSlug]/objects/...
```

Their permissions live under:

```txt
objects.employee.*
objects.product.*
objects.customer.*
objects.supplier.*
objects.warehouse.*
```

Their events live under:

```txt
objects.employee.created
objects.product.updated
objects.customer.deleted
```

Modules reference Business Objects by ID + tenant-safe relation, but do not own them.

---

# 20. Event Runtime

MVP Event Bus is in-process.

It is used for decoupled non-critical reactions.

Rules:

```txt
Events are emitted on the server.
Events are facts, not commands.
Events use PlatformContext.
Events do not include orgId in payload.
Events do not include full Prisma records.
Listener failures do not normally break the original mutation.
Critical business correctness must stay inside service transactions.
```

Good event:

```txt
inventory.stock_adjustment.created
```

Bad event:

```txt
send.email
```

Bad event:

```txt
inventory.product.created
```

if Product is the shared Business Object. Correct:

```txt
objects.product.created
```

MVP in-process Event Bus is not durable.

Do not rely on it for:

```txt
financial correctness
stock ledger correctness
required approval transitions
guaranteed notification delivery
import/export jobs
```

If a reaction must always happen, it belongs in the same service transaction.

---

# 21. Background Runtime

There is no background job runtime in the restarted MVP foundation.

Do not add:

```txt
BullMQ
Redis queues
Vercel Queues
Inngest
Trigger.dev
Temporal
Celery
FastAPI workers
setInterval workers
in-memory queues
```

Background Jobs are deferred until real use cases prove the need.

Examples of future candidates:

```txt
large imports
large exports
email digests
scheduled reports
search indexing
AI processing
file processing
```

Until then, user-facing APIs should remain quick and bounded.

Do not run long processing inside route handlers.

---

# 22. AI Runtime

No user-facing runtime AI is included in the restarted MVP foundation.

Allowed now:

```txt
AI-assisted development
Claude implementation from frozen specs
static module AI context metadata
AI planning with founder/architect
```

Not allowed now:

```txt
in-app chatbot
AI SQL querying
AI database agent
embeddings
vector search
RAG pipeline
AI mutation agent
AI support agent
FastAPI AI backend
```

Future runtime AI must use verified `PlatformContext`, respect permissions, and never execute raw SQL or raw Prisma.

---

# 23. Error Runtime

Runtime errors must follow these rules:

```txt
APIs return JSON only.
APIs never redirect.
APIs include stable error codes.
Wrong-org access returns safe 404.
Missing permission returns 403.
Unauthenticated API returns 401.
Validation error returns 400.
Conflict returns 409.
Unexpected errors are logged and return safe 500.
```

Server logs may include:

```txt
requestId
orgId
userId
route
moduleId
error code
safe message
```

Server logs must not include:

```txt
passwords
tokens
service keys
full request bodies
full Prisma records
full customer records
sensitive incident descriptions
```

---

# 24. Runtime Security Rules

The runtime must enforce these rules everywhere:

```txt
No client-supplied orgId.
No loose orgId service methods.
No raw Prisma inside modules.
No @/kernel imports inside modules.
No server-only imports inside Client Components.
No API redirects.
No per-client forks.
No FastAPI backend.
No background jobs before approval.
No Platform Services before proof.
No runtime Dynamic CRUD/Form engines.
No AI runtime before approval.
```

Security flow order:

```txt
Authentication
  ↓
Tenant membership
  ↓
Organization/subscription state
  ↓
Module enablement or Business Object availability
  ↓
Permission
  ↓
Validation
  ↓
Service operation
  ↓
Database transaction
  ↓
Event emission
  ↓
API response
```

Tenant membership must be checked before permission matching.

Admin wildcard permission does not bypass tenant isolation.

---

# 25. Runtime API Wrapper Pattern

All APIs should eventually use a shared wrapper.

Conceptual pattern:

```ts
export const POST = sdk.api.handle(async (req, params) => {
  const { orgSlug } = orgParamsSchema.parse(params)

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

  const body = createStockAdjustmentSchema.parse(await req.json())

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
  })

  const data = await InventoryService.createStockAdjustment(ctx, body)

  return sdk.api.created(data)
})
```

The wrapper should handle:

```txt
requestId creation
JSON error mapping
Zod validation mapping
OneDayError mapping
unexpected error logging
consistent response shape
```

Claude must not hand-roll inconsistent API error behavior in every route.

---

# 26. Runtime Service Pattern

Services own business operations.

A service method should look like:

```ts
static async create(ctx: PlatformContext, input: ValidatedInput) {
  await sdk.permissions.require(ctx, permission)

  const db = sdk.getDb(ctx)

  const result = await db.$transaction(async (tx) => {
    // tenant-scoped writes
  })

  await sdk.events.emit(ctx, eventName, payload)

  return result
}
```

A service method should not look like:

```ts
static async create(orgId: string, input: unknown) {
  return prisma.someTable.create({ data: { ...input, orgId } })
}
```

During MVP, public service methods should enforce permissions internally because service methods may be called from multiple routes/pages/generators.

---

# 27. Runtime Form Submission Pattern

Client form runtime:

```txt
React Hook Form manages UI state.
Zod validates for UX.
Form submits business fields only.
No hidden orgId.
Optimistic/pending states are shown.
API route performs authoritative validation.
Service performs business mutation.
Server emits event.
Client shows success or rollback/error.
```

Form submits to:

```txt
/api/orgs/[orgSlug]/objects/[object]
```

or:

```txt
/api/orgs/[orgSlug]/[moduleId]/[resource]
```

Never:

```txt
/api/[module]?orgId=...
```

---

# 28. Runtime Table Pattern

Table runtime:

```txt
Server Component fetches initial rows through service.
Client Component handles row interactions.
Filters/sorts are allowlisted.
Client never sends raw Prisma where/orderBy.
Client never sends orgId.
Safe optimistic mutations are allowed.
Server remains authority.
```

Table filtering route example:

```txt
GET /api/orgs/acme-corp/inventory/stock-levels?status=low&warehouseId=...
```

Server validates query params and maps them to approved filters.

---

# 29. Runtime Configuration

Client configuration lives in the database, not code forks.

Examples:

```txt
Organization
Subscription
OrgModule
Role
Permission
Setting
module settings
client brand tokens
```

Runtime must resolve configuration server-side.

Client Components may receive safe configuration props, but must not load privileged configuration directly.

Do not create:

```txt
src/clients/acme-corp/config.ts
src/clients/acme-corp/theme.css
if (orgSlug === 'acme-corp') custom behavior
```

Unless there is a future premium/dedicated ADR.

---

# 30. Runtime Observability

At runtime, every meaningful request should be traceable.

Minimum future runtime fields:

```txt
requestId
route
method
statusCode
orgId when available
userId when available
moduleId when available
errorCode when available
```

These are operational diagnostics, not Audit Log.

Do not confuse:

```txt
Runtime logs = developer/operator diagnostics
Audit Log = business record of user actions, deferred Platform Service
Activity Feed = user-facing timeline, deferred Platform Service
```

---

# 31. Runtime Testing Requirements

Runtime architecture is not accepted unless tested.

Required tests:

```txt
Page context creation tests
API context creation tests
401 JSON API auth tests
Wrong-org safe 404 tests
403 permission tests
Module-disabled 404 tests
Client-supplied orgId rejection tests
No redirect API tests
Service PlatformContext tests
No raw Prisma in modules checks
No @/kernel imports in modules checks
No @/sdk/server in Client Components checks
No sdk.getDb(orgId) checks
Two-org tenant isolation tests
Optimistic UI rollback tests for key interactions
```

`npm run check:architecture` must enforce forbidden runtime patterns.

---

# 32. Runtime Anti-Patterns

## 32.1 Client-supplied tenant identity

Bad:

```ts
const orgId = body.orgId
```

Good:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
```

## 32.2 Auth-only API

Bad:

```ts
await sdk.auth.requireApiAuth(req)
return InventoryService.list(orgId)
```

Good:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
await sdk.permissions.require(ctx, permission)
return InventoryService.list(ctx, filters)
```

## 32.3 API redirect

Bad:

```ts
await sdk.auth.requireAuth()
```

inside API route if it redirects.

Good:

```ts
await sdk.auth.requireApiAuth(req)
```

## 32.4 Module importing Kernel

Bad:

```ts
import { prisma } from '@/kernel/db/client'
```

Good:

```ts
import { sdk } from '@/sdk/server'
```

## 32.5 Server import in client component

Bad:

```tsx
'use client'
import { sdk } from '@/sdk/server'
```

Good:

```tsx
'use client'
import { sdkClient } from '@/sdk/client'
```

## 32.6 In-memory business state

Bad:

```ts
const pendingJobs = []
```

Good:

```txt
Defer background jobs until approved durable job system exists.
```

## 32.7 Runtime module plugins

Bad:

```txt
Load remote module code at runtime.
```

Good:

```txt
Static module manifests compiled into the OneDayOS app.
```

---

# 33. Claude Implementation Rules

Claude must follow these rules when implementing runtime architecture:

```txt
Do not add FastAPI.
Do not add Express/NestJS backend.
Do not add GraphQL.
Do not add Edge runtime for Prisma-backed routes.
Do not use Server Actions as the default business mutation boundary.
Do not create per-client deployments.
Do not accept orgId from client input.
Do not use sdk.getDb(orgId).
Do not import raw Prisma inside modules.
Do not import @/kernel/* inside modules.
Do not import @/sdk/server inside Client Components.
Do not implement background jobs.
Do not implement runtime AI.
Do not implement Platform Services from roadmap names.
Do not implement Dynamic CRUD/Form runtimes.
Do not cache tenant data globally.
Do not return redirects from API routes.
```

Claude must implement:

```txt
Route Handler APIs
PlatformContext helpers
API-safe auth helpers
tenant-scoped API paths
JSON error responses
service-layer permission enforcement
sdk.getDb(ctx)
two-org tests
architecture checks
```

---

# 34. Acceptance Criteria

This document is accepted when a reviewer can answer:

```txt
[ ] What runs in the browser?
[ ] What runs on the server?
[ ] Where is PlatformContext created?
[ ] Why do APIs use Route Handlers instead of Server Actions by default?
[ ] Why does Prisma require Node runtime?
[ ] Why is Edge runtime not default?
[ ] How does a protected page load?
[ ] How does an API mutation execute?
[ ] How is orgSlug different from orgId?
[ ] How are modules enabled at runtime?
[ ] How do modules communicate?
[ ] What is deferred?
[ ] What must Claude not add?
[ ] What runtime patterns must tests enforce?
```

Implementation may begin only after this document is frozen and included in a narrow Implementation Package.

---

# 35. Implementation Package Prompt Template

When this document is frozen, Claude may receive a prompt like:

```md
You are implementing the OneDayOS runtime foundation.

Authoritative documents:
- docs/engineering-manual/02-architecture/03-runtime-architecture.md
- docs/engineering-manual/04-kernel/01-authentication.md
- docs/engineering-manual/04-kernel/02-organizations-tenancy.md
- docs/engineering-manual/04-kernel/04-authorization-enforcement.md
- docs/engineering-manual/04-kernel/08-kernel-api-contracts.md
- docs/engineering-manual/05-sdk/01-sdk-public-api.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md
- docs/engineering-manual/13-security/02-tenant-isolation.md
- docs/engineering-manual/13-security/03-permission-enforcement.md
- docs/engineering-manual/13-security/04-api-security.md

Task:
Implement only the runtime foundation helpers:
- PlatformContext creation for pages
- PlatformContext creation for APIs
- requireApiAuth
- requireApiOrgContext
- requireApiModuleContext
- API wrapper
- JSON error mapping
- architecture tests for forbidden runtime imports/patterns

Rules:
- Do not add FastAPI.
- Do not use Server Actions as the mutation boundary.
- Do not use Edge runtime for Prisma-backed routes.
- Do not implement modules yet.
- Do not implement Platform Services.
- Do not accept client-supplied orgId.
- Do not use sdk.getDb(orgId).
- Add two-org tenant tests.
- Add 401/403/safe-404 API tests.

Stop and report if any manual is ambiguous.
```

---

# 36. Final Rule

The OneDayOS runtime exists to make the platform feel like one coherent business operating system, not a collection of generated app fragments.

The runtime must make the safe path the easiest path:

```txt
Route Handler
  → verified PlatformContext
  → permission check
  → validated input
  → service(ctx, input)
  → sdk.getDb(ctx)
  → tenant-scoped database access
  → event emission
  → JSON response
  → optimistic UI confirmation
```

Any runtime shortcut that bypasses this path is architecture debt.

