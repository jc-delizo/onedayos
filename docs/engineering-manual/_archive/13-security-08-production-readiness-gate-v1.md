# OneDayOS Engineering Manual — 13 Security / 08 Production Readiness Gate

**Document ID:** `13-security/08-production-readiness-gate.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Implementation Allowed:** No — this document defines gates and acceptance criteria. Implementation must happen through a separate frozen implementation specification or through the relevant frozen Kernel/Security documents.  
**Depends On:**

- `01-foundation/00-vision.md` — Approved
- `02-architecture/00-system-architecture.md` — Approved
- `02-architecture/01-layer-boundaries.md` — Approved
- Current Kernel v2 MVP implementation reference

---

# 1. Purpose

This document defines the minimum conditions that OneDayOS must satisfy before it can be considered production-ready for real client use.

OneDayOS is a shared business operating system. It is not a one-off internal tool. It is expected to serve multiple Philippine SMEs from the same platform, using a shared deployment, shared application code, shared database, shared authentication system, shared Kernel, shared Business Objects, shared Platform Services, and reusable Business Modules.

Because of this, production readiness is not defined by whether the app builds, whether login works, or whether a dashboard loads.

Production readiness is defined by whether OneDayOS can safely host real businesses without leaking data, bypassing permissions, corrupting tenant boundaries, or producing operational debt that AppCare cannot support.

This document is a gate.

It answers:

```txt
Is OneDayOS safe enough to onboard real clients?
```

If the answer is no, development may continue, but production onboarding must not proceed.

---

# 2. Executive Summary

OneDayOS must not be treated as production-ready until these critical areas pass:

```txt
1. Live database migration and seed are verified.
2. Authentication works consistently for pages and APIs.
3. API routes return JSON errors, never login redirects.
4. Tenant membership is enforced at the route layer.
5. Tenant identity is never trusted from client input.
6. Database reads and writes are scoped to the verified organization.
7. Permission checks are enforced in APIs and services.
8. Generated modules are secure by default.
9. Cross-tenant read/write tests exist and pass.
10. Security regression tests exist and pass.
11. The app can be deployed from a fresh clone without hidden manual steps.
12. AppCare operational basics are in place.
```

The first version of the Kernel proved useful architectural direction, but the known open risks mean it should be treated as a reference implementation, not as a production-safe foundation.

If development is restarted from scratch, these gates must be built into the new implementation from day one.

---

# 3. Production Readiness Philosophy

## 3.1 Production readiness is not feature completeness

A platform can be production-ready with only a small set of features if those features are safe, stable, and operable.

A platform is not production-ready if it has many features but weak tenant isolation, inconsistent permissions, unreliable deployment, or fragile operational practices.

For OneDayOS, the correct priority is:

```txt
Security before module count.
Tenant isolation before second client.
Permission enforcement before business workflows.
Operational reliability before AppCare promises.
Manual authority before AI-generated implementation.
```

## 3.2 The second tenant is the real production test

A single-tenant demo can hide dangerous assumptions.

The moment OneDayOS hosts two organizations, these questions become existential:

```txt
Can Org A read Org B data?
Can Org A mutate Org B data?
Can a user guess another org slug and load its shell?
Can a client submit another orgId in a request payload?
Can an API route accidentally bypass permission checks?
Can a generated module ship without tenant tests?
```

If any answer is yes, OneDayOS is not production-ready.

## 3.3 Production readiness must be testable

No gate in this document may rely only on developer confidence.

Every production readiness gate must be validated by at least one of:

```txt
Automated test
Build-time check
Lint rule
Manual deployment checklist
Database verification step
Security review checklist
Operational runbook
```

Confidence is not a control.

Tests, checks, and documented procedures are controls.

---

# 4. Non-Goals

This document does not define the full implementation of:

```txt
Authentication internals
Permission system internals
Tenant isolation helper APIs
API response helper functions
Module generator implementation
RLS implementation
Monitoring integration
Backup automation
```

Those belong in the relevant Engineering Manual documents.

This document defines the pass/fail gates that those documents must satisfy.

---

# 5. Restart-from-Scratch Directive

The founder has indicated that Claude Code may be asked to restart development of the platform from scratch.

That decision is acceptable and may be strategically correct, but only if the restart uses the Engineering Manual as the authority.

The restart must not mean:

```txt
Rebuild the old MVP faster.
Copy old shortcuts.
Recreate auth-only API routes.
Accept orgId from forms.
Ship a generic dashboard shell.
Defer permission enforcement again.
Generate modules before security gates exist.
```

The restart must mean:

```txt
Build the Kernel from the frozen manual.
Treat old code as reference, not doctrine.
Design tenant isolation before module CRUD.
Design permission enforcement before routes.
Design API error contracts before APIs.
Design module generator safety rails before generated modules.
Design tests as part of implementation, not after.
```

## 5.1 Old code status

The previous Kernel implementation is useful evidence.

It tells us:

```txt
What worked.
What broke.
What was under-specified.
What Claude implemented safely.
What Claude left open.
Where the manual must be stricter.
```

But it should not be treated as the final architecture.

In the restarted build:

```txt
The Engineering Manual is doctrine.
Old code is reference material.
Claude is the implementer.
ChatGPT + founder are the architecture authority.
```

## 5.2 Restart acceptance rule

A restarted Kernel implementation must not be accepted simply because:

```txt
npm run build passes
TypeScript passes
Login works
Dashboard loads
Module scaffold works
```

It is accepted only when the gates in this document pass.

---

# 6. Gate Categories

Production readiness is divided into ten gate categories:

```txt
Gate 1: Manual Authority Gate
Gate 2: Environment and Deployment Gate
Gate 3: Database Migration and Seed Gate
Gate 4: Authentication Gate
Gate 5: API Contract Gate
Gate 6: Tenant Isolation Gate
Gate 7: Permission Enforcement Gate
Gate 8: Module Generator Safety Gate
Gate 9: Testing and CI Gate
Gate 10: Operations and AppCare Gate
```

A client-facing production release must pass all applicable gates.

For internal demos, some gates may be marked incomplete, but the environment must be clearly labeled as non-production.

---

# 7. Gate 1 — Manual Authority Gate

## 7.1 Purpose

Prevents Claude Code, contractors, or future engineers from inventing architecture during implementation.

## 7.2 Required before implementation restart

The following documents must exist before the full platform is rebuilt:

```txt
[ ] 00-meta/00-roadmap.md
[ ] 01-foundation/00-vision.md
[ ] 02-architecture/00-system-architecture.md
[ ] 02-architecture/01-layer-boundaries.md
[ ] 13-security/08-production-readiness-gate.md
```

The following should exist before implementing the security-critical Kernel:

```txt
[ ] 04-kernel/01-authentication.md
[ ] 04-kernel/02-organizations-tenancy.md
[ ] 04-kernel/03-users-roles-permissions.md
[ ] 04-kernel/04-authorization-enforcement.md
[ ] 04-kernel/08-kernel-api-contracts.md
[ ] 05-sdk/00-sdk-overview.md
[ ] 05-sdk/01-sdk-public-api.md
[ ] 06-data/01-tenancy-data-isolation.md
[ ] 13-security/02-tenant-isolation.md
[ ] 13-security/03-permission-enforcement.md
[ ] 13-security/04-api-security.md
```

## 7.3 Pass criteria

```txt
[ ] Claude receives one frozen or founder-approved document at a time.
[ ] Claude is not asked to “build OneDayOS.”
[ ] Claude is not asked to make architectural decisions.
[ ] Every implementation task cites the relevant manual document.
[ ] Any ambiguity is reported instead of guessed.
[ ] Any deviation becomes an ADR or founder-approved amendment.
```

## 7.4 Fail examples

```txt
Claude creates a new folder structure not described in the manual.
Claude imports from @/kernel inside a module.
Claude adds a Platform Service without Three Client Rule evidence.
Claude creates auth-only API routes for business mutations.
Claude accepts orgId from a client payload.
Claude invents a module-specific Product table.
```

---

# 8. Gate 2 — Environment and Deployment Gate

## 8.1 Purpose

Ensures OneDayOS can be deployed from a fresh clone without tribal knowledge.

## 8.2 Required environments

At minimum:

```txt
local
preview
production
```

Recommended before multiple clients:

```txt
local
preview
staging
production
```

## 8.3 Required environment files

```txt
[ ] .env.example exists.
[ ] .env.example contains placeholders only.
[ ] .env.local is ignored by git.
[ ] Production variables are configured in Vercel.
[ ] Supabase service role key is server-only.
[ ] Public Supabase anon key is clearly separated from service role key.
```

## 8.4 Required build behavior

Fresh clone must support:

```bash
npm install
npm run typecheck
npm run test:run
npm run build
```

If Prisma is used, fresh clone must also support:

```bash
npx prisma generate
```

or the build must run Prisma generation automatically.

## 8.5 Pass criteria

```txt
[ ] Fresh clone builds without hidden local files.
[ ] Build does not depend on uncommitted generated files.
[ ] CI or deployment runs Prisma generation when needed.
[ ] Production environment variables are documented.
[ ] Preview deployments are clearly non-production.
[ ] Service role key is never exposed to client code.
```

## 8.6 Fail examples

```txt
Build passes locally but fails on Vercel because Prisma Client was not generated.
.env.local is required but undocumented.
Service role key is imported into a client component.
Production deploy depends on manual local migration state.
```

---

# 9. Gate 3 — Database Migration and Seed Gate

## 9.1 Purpose

Ensures the schema and seed data work against a real PostgreSQL/Supabase database, not only TypeScript.

## 9.2 Required checks

```txt
[ ] Prisma schema validates.
[ ] Initial migration runs against local database.
[ ] Initial migration runs against Supabase development database.
[ ] Seed script runs against real Postgres.
[ ] Seed creates a demo organization.
[ ] Seed creates roles.
[ ] Seed creates permissions.
[ ] Seed creates subscription record.
[ ] Seed creates branch/department where applicable.
[ ] Seed does not create impossible or insecure default data.
```

## 9.3 Required commands

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run test:run
npm run build
```

For production deployment, use the production migration process defined in:

```txt
15-deployment-operations/03-database-migrations-production.md
```

Until that document exists, production migration requires manual founder approval.

## 9.4 Pass criteria

```txt
[ ] Migration has been run against real Postgres.
[ ] Seed has been run against real Postgres.
[ ] Seeded admin can log in.
[ ] Seeded organization can load dashboard.
[ ] Seeded permissions are valid.
[ ] Rollback or reset path is documented for development.
```

## 9.5 Fail examples

```txt
Schema exists but has never been migrated.
Seed script exists but has never been run.
Seed creates admin role but no wildcard permission.
Seed enables a module whose manifest is not registered.
Migration works locally but fails in Supabase.
```

---

# 10. Gate 4 — Authentication Gate

## 10.1 Purpose

Ensures user identity is reliable and consistent across Supabase Auth, Prisma, pages, APIs, and tenant resolution.

## 10.2 Required auth model

OneDayOS uses:

```txt
Supabase Auth = authentication identity
Prisma User = platform user record
Employee = business/personnel record, optionally linked to User
```

A Supabase auth user without a Prisma `User` row is an invalid platform state.

A Prisma `User` without a corresponding active auth identity is also suspicious and must be handled explicitly.

## 10.3 Required auth helpers

The Kernel must define separate helpers for page auth and API auth.

Required helper categories:

```ts
getSession()
requirePageAuth()
requireApiAuth()
requirePageOrgContext(orgSlug)
requireApiOrgContext(...)
```

Exact function names may vary, but the distinction is mandatory.

## 10.4 Page auth behavior

For pages:

```txt
Unauthenticated user may redirect to /login.
Authenticated inactive user must be denied.
Authenticated user without Prisma User row must be denied and logged.
Authenticated user with suspended org must be denied.
```

## 10.5 API auth behavior

For APIs:

```txt
Unauthenticated request must return 401 JSON.
Inactive user must return 403 JSON.
Missing platform user must return 403 or 409 JSON.
Suspended org must return 403 JSON.
APIs must not return 307 redirects to /login.
APIs must not return HTML login pages.
```

## 10.6 Registration behavior

Registration must avoid orphaned auth users.

Required sequence:

```txt
1. Validate input server-side.
2. Create Supabase auth user server-side.
3. Create Organization, User, Subscription, initial Role/Permission rows in Prisma.
4. Roll back auth user if Prisma creation fails.
5. Return structured JSON.
```

Client-side registration must not directly call `supabase.auth.signUp()` and hope a separate hook creates database rows.

## 10.7 Pass criteria

```txt
[ ] Page auth helper redirects unauthenticated users only from page contexts.
[ ] API auth helper returns 401 JSON.
[ ] Auth helper resolves Supabase user and Prisma user together.
[ ] Missing Prisma User row is handled explicitly.
[ ] Inactive user is denied.
[ ] Suspended org is denied.
[ ] Registration rollback is implemented.
[ ] Registration route has tests.
[ ] Middleware/proxy does not block public registration APIs.
```

## 10.8 Required tests

```txt
[ ] getSession returns null when unauthenticated.
[ ] page auth redirects unauthenticated user.
[ ] API auth returns 401 JSON when unauthenticated.
[ ] API auth does not redirect.
[ ] inactive user is denied.
[ ] missing Prisma User row is denied.
[ ] registration creates auth user and Prisma records.
[ ] registration rolls back auth user if Prisma transaction fails.
```

---

# 11. Gate 5 — API Contract Gate

## 11.1 Purpose

Ensures all API routes behave consistently, securely, and predictably.

## 11.2 Standard response shape

Every API route must return:

```ts
type ApiResponse<T> =
  | {
      data: T
      error: null
    }
  | {
      data: null
      error: {
        code: string
        message: string
        details?: unknown
      }
    }
```

String-only errors are discouraged in production APIs.

## 11.3 Required error codes

Minimum required error codes:

```txt
UNAUTHENTICATED
FORBIDDEN
ORG_NOT_FOUND
USER_NOT_FOUND
ORG_ACCESS_DENIED
VALIDATION_ERROR
NOT_FOUND
CONFLICT
METHOD_NOT_ALLOWED
INTERNAL_ERROR
```

## 11.4 Required API behavior

```txt
[ ] APIs validate request input with Zod or approved equivalent.
[ ] APIs derive user identity from auth context.
[ ] APIs derive org identity from verified context.
[ ] APIs do not trust orgId from request body or query params.
[ ] APIs enforce permissions before mutations.
[ ] APIs return JSON for all errors.
[ ] APIs do not leak stack traces.
[ ] APIs do not return raw database errors.
[ ] APIs do not use page-only redirect helpers.
```

## 11.5 API route implementation pattern

Preferred pattern:

```ts
export async function POST(request: NextRequest, routeContext: RouteContext) {
  const ctx = await sdk.auth.requireApiOrgContext(request, routeContext)

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    action: 'create',
    resource: 'stock_adjustment',
  })

  const input = parseJsonWithSchema(request, CreateStockAdjustmentSchema)

  const data = await InventoryService.createStockAdjustment(ctx, input)

  return api.ok(data, 201)
}
```

The exact helper names may change, but the shape must remain.

## 11.6 Pass criteria

```txt
[ ] All APIs use the standard response shape.
[ ] All unauthenticated API calls return 401 JSON.
[ ] All unauthorized API calls return 403 JSON.
[ ] Validation errors return 400 JSON.
[ ] Not found returns 404 JSON.
[ ] No API route imports page-only auth helpers.
[ ] No API route trusts orgId from client input.
```

## 11.7 Required tests

For every API route:

```txt
[ ] unauthenticated request test
[ ] unauthorized request test, if permission-protected
[ ] invalid input test, if mutation
[ ] success test
[ ] tenant isolation test, if tenant-scoped
```

---

# 12. Gate 6 — Tenant Isolation Gate

## 12.1 Purpose

Ensures one organization cannot access another organization's data, routes, settings, users, modules, or business objects.

This is the most important production gate for OneDayOS.

## 12.2 Core rule

Tenant identity must be derived from trusted server-side context.

Never trust tenant identity from:

```txt
request body
query string
hidden form input
client state
localStorage
URL alone
module service caller without verification
```

The URL may contain `orgSlug`, but the server must verify that the authenticated user belongs to that organization.

## 12.3 Required tenant model

For the MVP, each platform user belongs to exactly one organization:

```txt
User.orgId → Organization.id
```

Future multi-org membership may be added later, but must be designed explicitly.

Until then:

```txt
user.orgId must equal route org.id
```

## 12.4 Required org context

The platform must expose a verified org context object.

Recommended shape:

```ts
type PlatformContext = {
  authUserId: string
  userId: string
  orgId: string
  orgSlug: string
  userName: string
  userEmail: string
  roles: Array<{
    id: string
    name: string
  }>
  isSystemAdmin?: boolean
}
```

This context must be created only by Kernel/SDK helpers.

Modules may receive `PlatformContext`.

Modules must not construct it manually.

## 12.5 Route-level tenant isolation

For pages under:

```txt
/[orgSlug]/*
```

The layout or route guard must:

```txt
1. Require authenticated user.
2. Load Prisma User by auth user ID.
3. Load Organization by orgSlug.
4. Verify Organization exists.
5. Verify user.orgId === org.id.
6. Verify user is active.
7. Verify org is active and not suspended.
8. Return PlatformContext to downstream code.
```

If verification fails:

```txt
Unauthenticated → redirect to /login
Org does not exist → 404
User does not belong to org → 404 or 403
Inactive/suspended → 403 page
```

Recommendation: use 404 for org slug guessing in pages, and 403 for authenticated explicit API denial.

## 12.6 API-level tenant isolation

Every tenant-scoped API route must:

```txt
1. Require API auth.
2. Resolve platform user.
3. Resolve target org from route context or server-owned mapping.
4. Verify membership.
5. Scope reads/writes by ctx.orgId.
6. Return JSON errors.
```

## 12.7 Database-level tenant scoping

Every tenant-scoped database query must include `orgId` directly or through an approved helper.

Approved examples:

```ts
await sdk.getDb(ctx.orgId).product.findMany({
  where: { orgId: ctx.orgId }
})
```

Better future pattern:

```ts
await sdk.db.products.list(ctx)
```

Forbidden examples:

```ts
await prisma.product.findMany()
await prisma.product.findUnique({ where: { id } })
await sdk.getDb().product.findUnique({ where: { id } })
await sdk.getDb(body.orgId).product.findMany(...)
```

## 12.8 `findUnique` warning

A common tenant isolation bug happens when code loads a record only by ID:

```ts
await prisma.product.findUnique({ where: { id } })
```

Even if IDs are hard to guess, this is not acceptable for tenant-scoped data.

Safer pattern:

```ts
await prisma.product.findFirst({
  where: {
    id,
    orgId: ctx.orgId,
  },
})
```

Or define compound unique constraints where appropriate:

```prisma
@@unique([id, orgId])
```

Then query using both.

## 12.9 Client-supplied orgId policy

Tenant-scoped create/update schemas must not require `orgId` from the client.

Forbidden schema:

```ts
const CreateProductSchema = z.object({
  orgId: z.string(),
  name: z.string(),
})
```

Allowed schema:

```ts
const CreateProductSchema = z.object({
  name: z.string(),
})
```

Then server-side:

```ts
const ctx = await sdk.auth.requireApiOrgContext(request)
await ProductService.create(ctx, input)
```

## 12.10 Pass criteria

```txt
[ ] Authenticated user cannot load another org's page shell.
[ ] Authenticated user cannot read another org's API data.
[ ] Authenticated user cannot mutate another org's API data.
[ ] Client-submitted orgId is ignored or rejected.
[ ] Every tenant-scoped table has orgId.
[ ] Every tenant-scoped query includes orgId or uses an approved tenant-aware helper.
[ ] Every tenant-scoped service accepts PlatformContext, not loose orgId.
[ ] Cross-tenant tests exist and pass.
```

## 12.11 Required test matrix

Create at least two organizations:

```txt
Org A
Org B
```

Create at least three users:

```txt
Admin A → belongs to Org A
Staff A → belongs to Org A
Admin B → belongs to Org B
```

Required tests:

```txt
[ ] Admin A can load Org A dashboard.
[ ] Admin A cannot load Org B dashboard.
[ ] Admin A cannot list Org B products.
[ ] Admin A cannot create records in Org B by submitting orgId.
[ ] Admin A cannot delete Org B record by ID.
[ ] Staff A cannot access disabled module routes.
[ ] Admin B cannot access Org A records.
```

---

# 13. Gate 7 — Permission Enforcement Gate

## 13.1 Purpose

Ensures authenticated users can only perform actions they are authorized to perform.

Authentication answers:

```txt
Who are you?
```

Tenant isolation answers:

```txt
Which organization may you access?
```

Permissions answer:

```txt
What are you allowed to do inside that organization?
```

All three are required.

## 13.2 Core rule

A route protected only by authentication is not production-safe if it performs tenant-scoped business reads or mutations.

Every business API must enforce permissions.

## 13.3 Required permission concepts

Minimum permission shape:

```txt
module
resource optional
action
conditions future
```

Example permissions:

```txt
inventory.read
inventory.create
inventory.update
inventory.delete
inventory.adjust
hr.employee.read
hr.employee.update
purchasing.purchase_request.approve
*.read
*.*
```

The exact storage model may vary, but the concept must support:

```txt
module-level permissions
resource-level permissions
wildcard permissions
future condition-based permissions
```

## 13.4 Required SDK helpers

The SDK must expose:

```ts
sdk.permissions.can(ctx, permission)
sdk.permissions.require(ctx, permission)
```

Where `ctx` is a verified `PlatformContext`.

Avoid helper signatures that accept only loose values:

```ts
can(userId, action, module, orgId)
```

That form is easy to misuse.

Preferred:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  action: 'create',
  resource: 'stock_adjustment',
})
```

## 13.5 API enforcement

Every API mutation must call `sdk.permissions.require()` before executing the mutation.

Examples:

```txt
POST /api/inventory/adjustments → inventory.adjust
POST /api/products → product.create or inventory.product.create, depending on object ownership
PATCH /api/customers/:id → crm.customer.update or customer.update
DELETE /api/suppliers/:id → supplier.delete
```

Read APIs must also enforce read permissions unless the data is safe for every authenticated user in the organization.

Default rule:

```txt
Reads require permission.
Writes require permission.
Deletes require permission.
Exports require permission.
Admin/settings actions require permission.
```

## 13.6 Service enforcement

APIs must enforce permissions, but services should not rely completely on APIs doing the right thing.

Preferred service pattern:

```ts
class InventoryService {
  static async createAdjustment(ctx: PlatformContext, input: CreateAdjustmentInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      action: 'adjust',
      resource: 'stock_adjustment',
    })

    // mutation here
  }
}
```

Alternative allowed pattern:

```txt
API performs permission check.
Service requires an AuthorizedContext type that can only be produced after permission check.
```

But this is more complex and should not be used until needed.

## 13.7 UI permission checks

UI permission checks are allowed and encouraged for user experience.

Examples:

```txt
Hide Create button if user lacks create permission.
Disable Delete menu item if user lacks delete permission.
Show permission-denied empty state.
```

But UI permission checks are not security.

Security must happen server-side.

## 13.8 Pass criteria

```txt
[ ] sdk.permissions.can exists.
[ ] sdk.permissions.require exists.
[ ] API routes call permission enforcement.
[ ] Services receive PlatformContext.
[ ] Sensitive services enforce permissions or accept authorized context.
[ ] UI visibility uses permissions where appropriate.
[ ] Unauthorized user receives 403 JSON from APIs.
[ ] Unauthorized user cannot mutate data by calling API manually.
[ ] Wildcard permissions work.
[ ] Permission denial tests exist and pass.
```

## 13.9 Required test matrix

Create roles:

```txt
Admin → wildcard permissions
Inventory Manager → inventory read/create/update/adjust
Inventory Viewer → inventory read only
Staff → limited or no module permissions
```

Required tests:

```txt
[ ] Admin can create, update, delete.
[ ] Inventory Manager can adjust stock.
[ ] Inventory Viewer can read but cannot create.
[ ] Staff cannot access inventory APIs.
[ ] User without permission gets 403 JSON.
[ ] Permission denial does not leak record existence across tenants.
[ ] Wildcard module permission works.
[ ] Wildcard action permission works only as designed.
```

---

# 14. Gate 8 — Module Generator Safety Gate

## 14.1 Purpose

Ensures the module generator scales correct architecture instead of scaling vulnerabilities.

The generator is not a convenience script.

The generator is a product-critical architecture tool.

A bad generator will create insecure modules faster than a human can review them.

## 14.2 Generator output must be secure by default

Generated modules must include:

```txt
[ ] Manifest
[ ] Permissions
[ ] Routes
[ ] Services
[ ] Zod schemas
[ ] API routes
[ ] Page routes
[ ] Tests
[ ] Tenant isolation patterns
[ ] Permission enforcement patterns
[ ] Event emission patterns
[ ] Soft-delete patterns where applicable
```

## 14.3 Forbidden generated patterns

The generator must never emit:

```ts
request.nextUrl.searchParams.get('orgId')
```

```ts
const orgId = body.orgId
```

```ts
import { prisma } from '@/kernel/db/client'
```

inside a business module.

It must never emit:

```ts
await sdk.auth.requireAuth()
```

inside an API route if that helper redirects.

It must never emit API routes without:

```txt
API auth
org context resolution
permission enforcement
input validation
standard JSON response shape
```

## 14.4 Generated schemas

Generated create schemas must not include tenant identity.

Forbidden:

```ts
export const CreateRecordSchema = z.object({
  orgId: z.string(),
  name: z.string(),
})
```

Allowed:

```ts
export const CreateRecordSchema = z.object({
  name: z.string().min(1),
})
```

## 14.5 Generated service signature

Preferred generated service signature:

```ts
static async create(ctx: PlatformContext, input: CreateInput)
```

Forbidden:

```ts
static async create(input: CreateInput & { orgId: string })
```

## 14.6 Generated API pattern

Generated mutation APIs must follow this shape:

```ts
export async function POST(request: NextRequest, routeContext: RouteContext) {
  const ctx = await sdk.auth.requireApiOrgContext(request, routeContext)

  await sdk.permissions.require(ctx, {
    module: MODULE_ID,
    action: 'create',
  })

  const input = await parseBody(request, CreateSchema)
  const data = await ModuleService.create(ctx, input)

  return api.created(data)
}
```

## 14.7 Generated tests

Every generated module must include tests for:

```txt
[ ] Service accepts PlatformContext.
[ ] Service does not accept client orgId.
[ ] API returns 401 when unauthenticated.
[ ] API returns 403 when unauthorized.
[ ] API rejects invalid input.
[ ] API does not allow cross-tenant read.
[ ] API does not allow cross-tenant write.
[ ] Mutation emits event.
```

## 14.8 Pass criteria

```txt
[ ] Generator output passes lint/typecheck/tests.
[ ] Generator output contains no forbidden imports.
[ ] Generator output contains no client-supplied orgId pattern.
[ ] Generator output contains permission checks.
[ ] Generator output contains API auth checks.
[ ] Generator output contains tenant isolation tests.
[ ] Generator output contains permission denial tests.
[ ] Generated module can be safely used as the starting point for Inventory.
```

---

# 15. Gate 9 — Testing and CI Gate

## 15.1 Purpose

Ensures critical behavior is continuously verified.

OneDayOS must not depend on manual clicking as the primary quality check.

## 15.2 Required local checks

At minimum:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

If a command does not exist yet, the implementation is not production-ready.

## 15.3 Required CI checks

CI must run:

```txt
[ ] install
[ ] prisma generate
[ ] lint
[ ] typecheck
[ ] unit tests
[ ] integration/security tests, where available
[ ] build
[ ] forbidden import check
```

## 15.4 Forbidden import check

CI must prevent modules from importing Kernel internals.

Forbidden:

```txt
src/modules/** imports @/kernel/**
src/modules/** imports src/kernel/**
src/modules/** imports another module directly
src/components/ui/** imports business logic
```

Allowed:

```txt
src/modules/** imports @/sdk
src/modules/** imports @/components
src/modules/** imports module-local files
```

## 15.5 Required security tests

Minimum security regression suite:

```txt
[ ] unauthenticated API returns 401 JSON
[ ] API auth does not redirect
[ ] user cannot access another org route
[ ] user cannot read another org API data
[ ] user cannot mutate another org API data
[ ] client-supplied orgId is rejected or ignored
[ ] user without permission gets 403 JSON
[ ] generated module includes tenant tests
[ ] generated module includes permission tests
```

## 15.6 Tautological test policy

Tests that only prove mocks work are not sufficient.

Examples of weak tests:

```txt
Test manually recreates soft-delete logic instead of testing the actual Prisma extension.
Test checks singleton identity without exercising database behavior.
Test checks that a mocked function was called but not that security behavior occurred.
```

Weak tests may exist temporarily, but they cannot count toward production readiness gates.

## 15.7 Pass criteria

```txt
[ ] CI exists.
[ ] CI blocks failed tests.
[ ] CI blocks failed build.
[ ] CI blocks type errors.
[ ] CI blocks forbidden imports.
[ ] Security regression tests exist.
[ ] Security regression tests pass.
[ ] Known previous bugs have regression tests.
```

---

# 16. Gate 10 — Operations and AppCare Gate

## 16.1 Purpose

Ensures OneDayOS can be supported commercially through AppCare.

AppCare promises hosting, monitoring, security updates, backups, bug fixes, AI support, and maintenance.

That promise requires operational basics.

## 16.2 Required operational capabilities before paid production

```txt
[ ] Production deployment process documented.
[ ] Database migration process documented.
[ ] Backup process documented.
[ ] Restore process documented or explicitly limited.
[ ] Error logging exists.
[ ] Basic uptime monitoring exists.
[ ] Incident response checklist exists.
[ ] Support escalation path exists.
[ ] AppCare coverage boundaries are documented.
```

## 16.3 Minimum monitoring

Before real clients:

```txt
[ ] App health endpoint or basic uptime check.
[ ] Vercel deployment visibility.
[ ] Supabase database health visibility.
[ ] Error logs accessible to operator.
[ ] Failed API errors are logged server-side.
```

## 16.4 Backup and restore

Before real clients:

```txt
[ ] Supabase backup policy understood.
[ ] Manual backup/export procedure documented.
[ ] Restore limitations documented.
[ ] Client data loss response documented.
```

## 16.5 AppCare scope clarity

AppCare must distinguish:

```txt
Bug fix
Minor configuration change
Module enhancement
New module
Custom development
Emergency support
```

Without this, support becomes unbounded custom work.

## 16.6 Pass criteria

```txt
[ ] Operator knows how to deploy.
[ ] Operator knows how to roll back.
[ ] Operator knows how to inspect errors.
[ ] Operator knows how to confirm backups.
[ ] Operator knows how to respond to incidents.
[ ] Client handover includes support boundaries.
```

---

# 17. Production Readiness Levels

Not every environment needs the same readiness level.

Use these levels to classify the platform honestly.

## 17.1 Level 0 — Prototype

Allowed:

```txt
Internal exploration
Throwaway UI experiments
Architecture spikes
```

Not allowed:

```txt
Client data
Production use
Paid AppCare
Second tenant
```

Criteria:

```txt
Build may be unstable.
Tests may be incomplete.
Security may be incomplete.
```

## 17.2 Level 1 — Internal Demo

Allowed:

```txt
Founder demos
Screen recordings
Internal walkthroughs
Single demo org with fake data
```

Not allowed:

```txt
Real client operations
Real sensitive data
Multiple real tenants
```

Criteria:

```txt
Login works.
Dashboard works.
Basic routes work.
Known security gaps documented.
```

## 17.3 Level 2 — Single Pilot Client

Allowed:

```txt
One carefully supervised pilot client
Limited real data
Manual operator oversight
```

Required:

```txt
Tenant isolation implemented even if only one tenant exists.
API auth returns JSON errors.
Permission enforcement exists for pilot workflows.
Backups are understood.
Operator can respond quickly.
```

Not allowed:

```txt
Multiple unsupervised clients
Marketplace modules
Unreviewed generated modules
```

## 17.4 Level 3 — Multi-Tenant Production

Allowed:

```txt
Multiple real client organizations
Paid AppCare
Repeatable module delivery
```

Required:

```txt
All gates in this document pass.
Security tests pass.
CI passes.
Deployment is repeatable.
Backups are operational.
Support process exists.
```

## 17.5 Level 4 — Platform Scale

Allowed:

```txt
Hundreds of businesses
Module marketplace preparation
Premium AI features
Deeper integrations
```

Required:

```txt
Observability mature.
Cost management mature.
Background jobs mature.
RLS or equivalent defense-in-depth considered.
Module versioning mature.
Upgrade/migration process mature.
```

---

# 18. Second Tenant Gate

Before onboarding the second real client organization, all of the following must pass:

```txt
[ ] User from Org A cannot load Org B page shell.
[ ] User from Org A cannot access Org B dashboard.
[ ] User from Org A cannot access Org B settings.
[ ] User from Org A cannot list Org B users.
[ ] User from Org A cannot list Org B employees.
[ ] User from Org A cannot list Org B business objects.
[ ] User from Org A cannot mutate Org B business objects.
[ ] User from Org A cannot enable/disable Org B modules.
[ ] User from Org A cannot submit orgId=OrgB in payload to create records.
[ ] User from Org A cannot delete Org B record by guessed ID.
[ ] All unauthorized API attempts return JSON, not redirects.
[ ] All permission denials return 403 JSON.
[ ] Security tests exist for all above cases.
```

If any item fails, second tenant onboarding is blocked.

---

# 19. First Official Module Gate

Before implementing the first official business module, likely Inventory:

```txt
[ ] Vision document approved.
[ ] System Architecture document approved.
[ ] Layer Boundaries document approved.
[ ] Production Readiness Gate approved.
[ ] SDK public API documented.
[ ] Tenant isolation helper designed.
[ ] API contract helper designed.
[ ] Permission enforcement helper designed.
[ ] Module manifest contract documented.
[ ] Module generator safety rails documented.
[ ] Design System minimum standards documented.
```

Before shipping the first official module to production:

```txt
[ ] Module APIs enforce auth, tenant isolation, and permissions.
[ ] Module services accept PlatformContext.
[ ] Module-owned tables have orgId.
[ ] Module does not duplicate Business Objects.
[ ] Module emits events for mutations.
[ ] Module passes tenant isolation tests.
[ ] Module passes permission tests.
[ ] Module UI follows design system.
[ ] Module docs exist.
```

---

# 20. Security Stabilization Patch Scope

This document recommends a later dedicated implementation package called:

```txt
Security Stabilization Patch
```

If the platform is restarted from scratch, this patch should become part of the first Kernel implementation instead of a later patch.

If the existing codebase is continued, this patch must happen before real module work.

## 20.1 Patch objectives

```txt
1. Add API-safe auth helper.
2. Add verified PlatformContext.
3. Add page org context guard.
4. Add API org context guard.
5. Add standard API response helpers.
6. Add permission require helper.
7. Enforce permission checks in existing APIs.
8. Remove client-supplied orgId from generated module schemas.
9. Harden module generator output.
10. Add tenant isolation and permission tests.
```

## 20.2 Patch non-goals

```txt
RLS
Approval Engine
Notification Engine
Audit Log Service
Dynamic Form Engine
Inventory business logic
Marketplace support
Multi-org user membership
```

## 20.3 Patch acceptance criteria

```txt
[ ] All API routes return JSON errors.
[ ] No API route uses redirecting auth helper.
[ ] Verified PlatformContext exists.
[ ] Org route guard verifies membership.
[ ] API org guard verifies membership.
[ ] Permission require helper exists.
[ ] Existing protected APIs enforce permissions.
[ ] Module generator emits secure patterns.
[ ] Security tests pass.
[ ] Build passes.
```

---

# 21. RLS Position

PostgreSQL Row Level Security is valuable defense-in-depth.

However, RLS is not required for the first production gate if application-level tenant isolation is correctly implemented and tested.

RLS should be considered after:

```txt
[ ] Kernel tenant patterns are stable.
[ ] At least three modules exist.
[ ] Query patterns are understood.
[ ] Prisma integration overhead is acceptable.
[ ] The team can test RLS reliably.
```

RLS must not be used as an excuse to skip application-level tenant checks.

Even with RLS:

```txt
APIs must resolve org context.
Services must receive PlatformContext.
Permissions must be enforced.
Queries must be written intentionally.
```

---

# 22. Soft Delete Readiness

Soft delete is part of the platform data philosophy, but it must be implemented carefully.

## 22.1 Required behavior

```txt
[ ] Soft-deletable models include deletedAt.
[ ] Soft-deletable models include deletedBy where applicable.
[ ] Normal list/read queries exclude deleted records.
[ ] Delete operations update deletedAt instead of hard deleting.
[ ] Restore behavior is either implemented or explicitly deferred.
[ ] Admin deleted-record access is explicit.
```

## 22.2 Known danger

Prisma extensions or middleware may not cover all query types.

The manual must explicitly define which query types are allowed for soft-deletable tenant data.

Dangerous query types include:

```txt
findUnique
findUniqueOrThrow
aggregate
groupBy
nested includes
raw queries
```

## 22.3 Pass criteria

```txt
[ ] Soft-delete behavior is tested against actual helper code.
[ ] Known bypass paths are blocked, wrapped, or documented.
[ ] Generated modules do not use unsafe delete patterns.
[ ] Generated modules do not use unsafe findUnique patterns for tenant-scoped data.
```

---

# 23. Business Object Readiness

Before Business Object CRUD is exposed to real clients:

```txt
[ ] Business Object ownership is documented.
[ ] Business Object minimalism rule is documented.
[ ] Business Object extension pattern is documented.
[ ] Business Object mutation events are documented.
[ ] Business Object APIs enforce tenant isolation.
[ ] Business Object APIs enforce permissions.
[ ] Business Object APIs emit events.
[ ] Business Object APIs use soft delete.
```

Business Objects include, at minimum:

```txt
Employee
Product
Customer
Supplier
Warehouse
```

Branch and Department are Kernel organization structure primitives, not ordinary Business Objects.

---

# 24. Design Readiness

Production readiness includes user experience quality.

The first generated base app looked like a generic SaaS/admin starter. That must not become the official OneDayOS product feel.

Before official module UI is accepted:

```txt
[ ] Design Vision exists.
[ ] Layout standards exist.
[ ] Table standards exist.
[ ] Form standards exist.
[ ] Empty/loading/error state standards exist.
[ ] Permission denied state exists.
[ ] App shell does not contain dead links.
[ ] Sidebar active state is correct.
[ ] Generated module UI follows OneDayOS standards.
```

Design quality does not block internal security stabilization work.

Design quality does block official module release.

---

# 25. Production Readiness Checklist

Use this checklist before any real client launch.

## 25.1 Manual and architecture

```txt
[ ] Roadmap approved.
[ ] Vision approved.
[ ] System Architecture approved.
[ ] Layer Boundaries approved.
[ ] Production Readiness Gate approved.
[ ] Relevant Kernel docs approved.
[ ] Relevant Security docs approved.
[ ] Claude implementation scope is document-bound.
```

## 25.2 Build and deployment

```txt
[ ] Fresh clone installs.
[ ] Prisma generates.
[ ] Typecheck passes.
[ ] Lint passes.
[ ] Tests pass.
[ ] Build passes.
[ ] Vercel deploy works.
[ ] Environment variables documented.
```

## 25.3 Database

```txt
[ ] Migration runs against real Postgres.
[ ] Seed runs against real Postgres.
[ ] Demo org loads.
[ ] Roles exist.
[ ] Permissions exist.
[ ] Subscription exists.
[ ] Backup process understood.
```

## 25.4 Authentication

```txt
[ ] Login works.
[ ] Logout works.
[ ] Registration creates auth + Prisma records.
[ ] Registration rollback works.
[ ] API auth returns JSON 401.
[ ] Page auth redirects appropriately.
[ ] Missing User row handled.
[ ] Inactive user denied.
```

## 25.5 Tenant isolation

```txt
[ ] Org route membership guard exists.
[ ] API org context guard exists.
[ ] Client orgId is not trusted.
[ ] Reads are org-scoped.
[ ] Writes are org-scoped.
[ ] Cross-tenant read tests pass.
[ ] Cross-tenant write tests pass.
[ ] Second tenant test passes.
```

## 25.6 Permissions

```txt
[ ] Permission can helper exists.
[ ] Permission require helper exists.
[ ] APIs enforce permissions.
[ ] Services enforce permissions or accept authorized context.
[ ] UI uses permission visibility.
[ ] Unauthorized API returns 403 JSON.
[ ] Permission denial tests pass.
```

## 25.7 Module system

```txt
[ ] Modules import only from @/sdk.
[ ] Module registry works.
[ ] Enabled modules drive nav.
[ ] Disabled modules are inaccessible.
[ ] Module generator output is secure.
[ ] Generated module has security tests.
```

## 25.8 Operations

```txt
[ ] Error logging available.
[ ] Uptime monitoring available.
[ ] Backup process documented.
[ ] Incident response checklist exists.
[ ] AppCare scope documented.
[ ] Support handover template exists.
```

---

# 26. Claude Implementation Prompt Template

When the time comes to implement this gate or its related stabilization patch, use a prompt like this:

```md
You are implementing the OneDayOS Security Stabilization Patch.

Authoritative documents:
- docs/engineering-manual/13-security/08-production-readiness-gate.md
- docs/engineering-manual/04-kernel/01-authentication.md
- docs/engineering-manual/04-kernel/02-organizations-tenancy.md
- docs/engineering-manual/04-kernel/04-authorization-enforcement.md
- docs/engineering-manual/04-kernel/08-kernel-api-contracts.md
- docs/engineering-manual/06-data/01-tenancy-data-isolation.md
- docs/engineering-manual/13-security/02-tenant-isolation.md
- docs/engineering-manual/13-security/03-permission-enforcement.md
- docs/engineering-manual/13-security/04-api-security.md

Rules:
- Do not invent architecture.
- Do not build business modules.
- Do not build Platform Services.
- Do not implement RLS yet.
- Do not accept orgId from client payloads.
- Do not use redirecting auth helpers in API routes.
- Do not import @/kernel from modules.
- Every API must return { data, error } JSON.
- Every tenant-scoped API must resolve PlatformContext.
- Every protected API must enforce permissions.
- Add tests for every security fix.

Task:
Implement only the security stabilization scope required to satisfy the Production Readiness Gate.

Before editing files:
1. List the files you will modify.
2. List the helpers you will create.
3. List the tests you will add.
4. Stop if the manual is ambiguous.
```

---

# 27. Founder Review Questions

Before freezing this document, answer:

```txt
1. Are we willing to block second-tenant onboarding until every tenant isolation test passes?
2. Are we willing to delay Inventory until API auth and permission enforcement are correct?
3. Are we restarting from scratch as a clean rebuild, or using the old MVP as a reference only?
4. Do we want Level 2 Single Pilot Client as an allowed milestone before full multi-tenant production?
5. Should permission enforcement happen in both API and service layers, or API layer plus AuthorizedContext?
6. Do we want to use 404 or 403 for cross-org page access?
7. Do we want CI forbidden-import checks before the first official module?
8. What is the minimum AppCare operational checklist before taking payment?
```

Recommended default answers:

```txt
1. Yes.
2. Yes.
3. Use old MVP as reference only.
4. Yes, but with strict supervision and no second real tenant.
5. Use both API and service-layer enforcement for now.
6. 404 for guessed org pages, 403 JSON for APIs.
7. Yes.
8. Deployment, backups, logs, uptime, incident checklist, support scope.
```

---

# 28. Approval Criteria for This Document

This document may be marked `Approved` when the founder agrees that:

```txt
[ ] Production readiness means safety, not feature count.
[ ] Second tenant onboarding is blocked until tenant isolation passes.
[ ] Business modules are blocked until API auth and permission enforcement are designed.
[ ] The restarted build must use the Engineering Manual as authority.
[ ] Old code is reference, not doctrine.
[ ] Claude must implement from narrow frozen documents.
[ ] The Security Stabilization Patch is required before module work if continuing old code.
[ ] The same stabilization requirements are required from day one if restarting from scratch.
```

---

# 29. Final Position

OneDayOS should not rush into Inventory, CRM, Leave, or any other business module until the platform can prove the following:

```txt
The right user is in the right organization.
The user can only access allowed data.
The user can only perform allowed actions.
The API behaves predictably.
The database schema is verified.
The generated code is safe by default.
The system can be deployed and supported repeatedly.
```

That is the minimum foundation for a Business Operating System.

Anything less is a bespoke admin app with platform branding.

