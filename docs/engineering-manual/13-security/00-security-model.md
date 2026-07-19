# OneDayOS Engineering Manual — 13 Security / 00 Security Model

**Document ID:** `13-security/00-security-model.md`  
**Version:** `1.0`  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Restarted Foundation Build  
**Owner:** OneDayOS Founder + Software Architect  
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
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `06-data/06-row-level-security-plan.md`
- `06-data/07-backup-restore.md`
- `08-module-system/04-module-permissions.md`
- `09-cli-generators/06-generator-safety-rails.md`
- `12-ai-layer/06-ai-safety-boundaries.md`
- `13-security/08-production-readiness-gate.md`
- `13-security/09-security-stabilization-new-build-spec.md`

---

# 1. Purpose

This document defines the overall security model for OneDayOS.

It is the umbrella document for:

```txt
Authentication
Tenant isolation
Authorization
API security
Data security
Secrets management
AI safety
Operational security
Security testing
Production readiness
```

This document does not replace the detailed security documents that follow it. It defines the complete security posture and the non-negotiable rules that every other document must obey.

The main purpose is to make sure the restarted OneDayOS build does **not** repeat the earlier MVP risks:

```txt
API auth returning redirects instead of JSON 401
permissions existing but not being enforced
org membership checks being incomplete
modules using loose orgId strings
client-supplied orgId being trusted
soft-delete behavior being bypassable
module generators producing insecure scaffolds
tests proving existence instead of security behavior
```

OneDayOS is a multi-tenant business platform. Security is not an optional hardening layer after the app works. Security is part of the product foundation.

---

# 2. Security Philosophy

OneDayOS should be secure because its architecture makes unsafe behavior difficult.

The platform should not rely on every developer or AI coding agent remembering to manually repeat security logic. The architecture should encode security into:

```txt
route shape
SDK access
PlatformContext
API wrappers
permission helpers
Prisma access rules
module generator output
test templates
architecture checks
production gates
```

## 2.1 Main security rule

```txt
No tenant-scoped operation happens without verified PlatformContext.
```

A valid `PlatformContext` proves:

```txt
authenticated Supabase user
+ matching OneDayOS User record
+ organization resolved from orgSlug
+ user belongs to that organization
+ organization is active or allowed for limited access
+ roles are loaded
+ permissions can be evaluated
+ module enablement can be evaluated
```

This context is created by Kernel/SDK helpers only.

Modules do not create it manually.

Clients do not supply it.

AI does not bypass it.

---

# 3. Security Goals

OneDayOS security has seven primary goals.

## 3.1 Tenant isolation

A user from one organization must never read, write, infer, export, search, or receive AI context from another organization.

```txt
Org A user cannot access Org B route.
Org A user cannot call Org B API.
Org A user cannot query Org B records.
Org A user cannot receive Org B events.
Org A user cannot see Org B search results.
Org A user cannot export Org B data.
Org A user cannot ask AI about Org B data.
```

## 3.2 Permission enforcement

A user can only perform actions allowed by their role permissions.

```txt
UI hiding is not security.
API enforcement is required.
Service enforcement is required.
```

## 3.3 Secure defaults for generated code

Generated modules must be safe by default.

A generator that creates insecure code is worse than no generator, because it scales bad architecture.

## 3.4 Low operational risk

The platform should support many SMEs without requiring enterprise security operations too early.

The system must still be operated responsibly:

```txt
company-owned infrastructure
MFA
least privilege
staging before production
backups
restore drills
incident response
```

## 3.5 Data minimization

OneDayOS should collect, expose, export, log, and send to AI only the data required for the task.

## 3.6 Auditability later

The MVP does not implement a full Audit Log Service yet, but mutations should emit stable events so that audit logging can be added later without rewriting every service.

## 3.7 AI cannot bypass the platform

AI is an assistant. The platform remains the authority.

AI must not become:

```txt
a database backdoor
an export shortcut
a permission bypass
a mutation engine
a cross-tenant leak path
a way to execute arbitrary SQL
```

---

# 4. Non-Goals

This document does not require the first restarted MVP to implement:

```txt
PostgreSQL RLS
full Audit Log Service
full Notification Service
full Activity Feed
full Attachment Service
full Background Jobs
full AI chatbot
vector search
runtime Dynamic CRUD
runtime Dynamic Forms
enterprise SSO
per-tenant databases
client-owned Supabase projects
```

Some of these may be added later.

They are not security prerequisites for the first foundation build if the application-layer security model is implemented correctly and tested.

---

# 5. Threat Model

OneDayOS must assume the following threats.

## 5.1 Cross-tenant access attempts

A user may try to access another organization by guessing a slug, ID, URL, API path, or record ID.

Examples:

```txt
/acme/dashboard
/api/orgs/acme/inventory/products
/api/orgs/acme/objects/customers/customer_123
```

The platform must verify membership every time.

`orgSlug` is a locator, not authorization.

## 5.2 IDOR

Insecure Direct Object Reference is one of the most important risks for OneDayOS.

Bad pattern:

```ts
await db.product.findUnique({ where: { id } })
```

Safe pattern:

```ts
await db.product.findFirst({
  where: {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Tenant-scoped records must always be queried with organization scope.

## 5.3 Client-supplied tenant identity

The client must never decide its own tenant.

Forbidden:

```txt
body.orgId
query.orgId
hidden form field orgId
localStorage orgId
cookie orgId created by client
AI-supplied orgId
```

Allowed:

```txt
orgSlug in route path as locator
server verifies orgSlug + authenticated user membership
Kernel creates PlatformContext
```

## 5.4 Permission bypass

A user may be authenticated and in the correct organization, but still not allowed to perform an action.

Authentication is not authorization.

Module enablement is not authorization.

Admin wildcard permission is not tenant bypass.

## 5.5 Unsafe generated code

Claude or a generator may accidentally produce insecure shortcuts.

Examples:

```ts
sdk.getDb(orgId)
where: { orgId: input.orgId }
request.nextUrl.searchParams.get('orgId')
await sdk.auth.requireAuth() inside API route
API route without permission enforcement
service mutation without PlatformContext
```

These must be blocked by generator rules, architecture checks, and tests.

## 5.6 Prompt injection

Business data, file contents, comments, descriptions, imported rows, and user-entered text can contain malicious instructions.

AI must treat business data as untrusted input.

## 5.7 Operational compromise

The platform must consider:

```txt
Supabase account compromise
Vercel account compromise
GitHub compromise
leaked service role key
bad migration
bad deployment
accidental deletion
billing interruption
backup failure
```

Operational security is part of the product because AppCare includes hosting, monitoring, security updates, backups, and maintenance.

---

# 6. Security Boundaries

OneDayOS security is enforced across multiple boundaries.

```txt
Browser
  ↓
Next.js route / page boundary
  ↓
Kernel auth / tenant context boundary
  ↓
SDK permission boundary
  ↓
Service boundary
  ↓
Database query boundary
  ↓
Event / AI / future service boundary
```

No single layer is enough.

## 6.1 Browser boundary

Client components are untrusted.

They may help with usability, but they do not enforce security.

Client code may:

```txt
show/hide buttons
validate fields for UX
submit business input
render permission-aware UI passed from server
```

Client code may not:

```txt
decide orgId
import @/sdk/server
import @/kernel/*
import raw Prisma
hold service role keys
trust hidden fields for security
bypass server validation
```

## 6.2 API boundary

APIs are the main external boundary of the platform.

Every protected API must:

```txt
return JSON only
use API-safe auth helpers
resolve PlatformContext
reject client-supplied orgId
validate params/query/body
check module enablement where applicable
enforce permissions
call services with PlatformContext
return { data, error, meta? }
```

APIs must never:

```txt
redirect to login
return HTML auth responses
trust request body orgId
call services with loose orgId
skip permission checks
expose stack traces
return full raw Prisma records unnecessarily
```

## 6.3 Service boundary

Services own business logic.

During MVP, public service methods should enforce permissions internally because generated APIs and future callers may accidentally skip checks.

Services receive:

```ts
PlatformContext
+ validated input
```

Services do not receive:

```ts
orgId: string
userId: string
raw request body
unvalidated JSON
```

## 6.4 Database boundary

Modules never import raw Prisma.

Modules use:

```ts
sdk.getDb(ctx)
```

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
sdk.getDb(orgId)
new PrismaClient()
raw SQL in modules
findUnique({ where: { id } }) on tenant-scoped records
```

## 6.5 Event boundary

Events must be tenant-scoped through context.

Events must not include `orgId` in payload.

The event envelope is created by the SDK using `PlatformContext`.

Future consumers like Audit Log, Notifications, Search, Activity Feed, AI, and Background Jobs must respect the same tenant boundary.

## 6.6 AI boundary

AI receives only approved context.

AI must not:

```txt
execute SQL
execute raw Prisma
mutate production data directly
export data without export permission
see data hidden from the user
cross tenant boundaries
receive secrets
```

---

# 7. Authentication Model

OneDayOS uses Supabase Auth as the identity provider.

Prisma `User` is the platform user record.

The Supabase Auth user ID should equal the Prisma `User.id`.

```txt
Supabase auth.users.id
=
OneDayOS users.id
```

## 7.1 Page auth

Page auth may redirect unauthenticated users.

Example:

```txt
Unauthenticated page request → redirect to /login
```

## 7.2 API auth

API auth must never redirect.

Example:

```txt
Unauthenticated API request → 401 JSON
```

Response shape:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

## 7.3 Registration

Registration must be server-owned.

The browser must not call `supabase.auth.signUp()` directly for OneDayOS platform registration.

Registration creates:

```txt
Supabase Auth user
Organization
Prisma User
Subscription
Admin role
Admin wildcard permission
initial settings/provisioning records
```

If Prisma creation fails after Supabase user creation, the Supabase user should be rolled back where possible.

---

# 8. Tenant Isolation Model

Organization is the tenant boundary.

Every tenant-scoped table must include `orgId`.

Tenant identity is derived from:

```txt
authenticated session
+ route orgSlug
+ platform User record
+ Organization record
+ membership check
```

## 8.1 Route tenant resolution

Tenant application routes should use:

```txt
/[orgSlug]/...
```

Tenant API routes should use:

```txt
/api/orgs/[orgSlug]/...
```

The server resolves and validates the organization.

## 8.2 Wrong organization behavior

When a user attempts to access another organization, normal responses should avoid confirming whether the organization exists.

Recommended API response:

```txt
404 ORG_NOT_FOUND
```

This is safer than:

```txt
403 You are not a member of Acme Corp
```

because it reduces organization enumeration.

## 8.3 Tenant query rules

Every tenant-scoped query must include `orgId` from `PlatformContext`.

Bad:

```ts
where: { id }
```

Good:

```ts
where: { id, orgId: ctx.org.id, deletedAt: null }
```

Bad:

```ts
where: { orgId: input.orgId }
```

Good:

```ts
where: { orgId: ctx.org.id }
```

---

# 9. Authorization Model

Authorization requires four gates.

```txt
1. Authentication
2. Tenant membership
3. Module enablement
4. Permission
```

These gates are not interchangeable.

## 9.1 Authentication

Proves the user is logged in.

Does not prove the user belongs to the requested organization.

Does not prove permission.

## 9.2 Tenant membership

Proves the authenticated user belongs to the requested organization.

Must be checked before permission matching.

## 9.3 Module enablement

Proves the organization has the module enabled.

Module enabled does not mean every user can access it.

## 9.4 Permission

Proves the user’s role allows the requested action.

Permission shape:

```ts
type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Examples:

```txt
objects.product.read
objects.customer.create
inventory.stock_adjustment.create
leave.leave_request.approve
```

## 9.5 Admin wildcard

Admin may receive:

```txt
*.*.*
```

But wildcard permissions are still scoped to the verified organization.

Admin wildcard does not bypass:

```txt
tenant membership
module enablement
soft delete
API validation
export restrictions
AI safety
```

---

# 10. API Security Model

Every API must follow the Kernel API contract.

## 10.1 Standard response shape

Success:

```json
{
  "data": {},
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

Optional metadata:

```json
{
  "data": [],
  "error": null,
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 120
  }
}
```

## 10.2 Required API route pattern

Every protected API should follow this order:

```ts
export async function POST(req: NextRequest, route: RouteContext) {
  return sdk.api.handle(req, async () => {
    const params = validateParams(route.params)

    const ctx = await sdk.auth.requireApiModuleContext(
      req,
      params.orgSlug,
      'inventory'
    )

    const body = await sdk.api.parseJson(req, CreateSchema)

    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    })

    const data = await InventoryService.createAdjustment(ctx, body)

    return sdk.api.created(data)
  })
}
```

## 10.3 Forbidden API patterns

```ts
await sdk.auth.requireAuth() // inside API route if it redirects
const orgId = body.orgId
const orgId = req.nextUrl.searchParams.get('orgId')
await SomeService.create(orgId, body)
return redirect('/login')
return new Response('<html>login</html>')
throw new Error('Forbidden') // unhandled to client
```

---

# 11. Data Security Model

OneDayOS stores sensitive business data.

Even if the first clients are SMEs, the platform must assume it may store:

```txt
employee personal data
customer contact data
supplier data
inventory data
financial-ish operational data
approvals
incidents
attachments later
AI support conversations later
```

## 11.1 Data minimization

Do not collect sensitive fields unless the module truly needs them.

Do not add fields to Business Objects casually.

Do not send unnecessary fields to:

```txt
browser
logs
events
exports
AI context
search index
reporting outputs
```

## 11.2 Soft delete

Business data should use soft delete by default.

Hard delete is reserved for:

```txt
safe cleanup
failed provisioning rollback
legal deletion workflows approved later
non-business temporary records
```

Soft-deleted records must be excluded from normal reads, search, reports, AI context, exports, and relation pickers.

## 11.3 Sensitive fields

Fields such as salary, government IDs, bank details, medical notes, private attachments, and internal incident details should be excluded from core MVP unless explicitly required and protected.

Sensitive-field handling must be deliberate.

---

# 12. Secrets Management Model

Secrets must never be exposed to client code.

## 12.1 Secret categories

```txt
Supabase service role key
Database URLs
Direct database URLs
Vercel tokens
GitHub tokens
AI provider keys
Email/SMS provider keys later
Storage signing secrets later
```

## 12.2 Rules

```txt
Never commit .env.local
Never expose service role key in NEXT_PUBLIC_ variables
Never send secrets to AI providers
Never paste production secrets into Claude prompts
Never log secrets
Never store secrets in database settings unless encrypted and approved
```

## 12.3 Environment separation

Use separate environments:

```txt
local
development
staging
production
```

Production secrets should not be used locally unless absolutely necessary.

---

# 13. Infrastructure Security Model

For MVP, OneDayOS should use shared company-owned infrastructure.

```txt
One OneDayOS-owned Supabase organization
One production Supabase project
One staging Supabase project
One Vercel production deployment
Many OneDayOS client organizations inside the app
```

Clients do not get Supabase dashboard access by default.

## 13.1 Required infrastructure controls

```txt
company-owned accounts
MFA enabled
at least two trusted owners
least-privilege team access
protected billing
production/staging separation
service role key restricted
backups enabled
restore drills
incident response process
```

## 13.2 Dedicated infrastructure

Dedicated client infrastructure is a future premium/enterprise option, not the default AppCare model.

Dedicated infrastructure requires:

```txt
higher price
separate migration process
separate backup monitoring
separate incident response
separate deployment pipeline or deployment target
formal ADR
```

---

# 14. AI Security Model

User-facing AI is deferred, but the security model must already prevent AI from becoming a backdoor later.

## 14.1 AI context rule

```txt
AI may only receive context the user is already allowed to know.
```

## 14.2 AI action rule

```txt
AI may propose actions.
The platform executes actions only after validation, permission checks, and explicit user confirmation.
```

## 14.3 Forbidden AI patterns

```txt
AI executes SQL
AI executes raw Prisma
AI receives full database dumps
AI receives service role keys
AI mutates records directly
AI exports data without export permission
AI ignores module enablement
AI ignores soft delete
AI treats business data as trusted instructions
```

---

# 15. Platform Services Security Model

Deferred Platform Services must follow the same security model when implemented later.

This includes:

```txt
Audit Log
Notifications
Approval Workflow
Comments
Attachments
Activity Feed
Reporting
Search
Background Jobs
Import/Export
Dynamic Forms
Dynamic CRUD
AI Query
```

Each service must:

```txt
use verified PlatformContext
never accept client-supplied orgId
respect tenant isolation
respect permissions
respect module enablement
respect soft delete
avoid leaking sensitive fields
include security tests
be accessed through SDK
avoid direct module imports
```

Deferred does not mean forgotten.

Deferred means not implemented until the pattern is proven and the contract is written.

---

# 16. Generator Security Model

Generators must encode the security model.

The Module Generator must produce:

```txt
tenant-scoped routes
API-safe auth/context usage
PlatformContext-based services
Zod strict validation
client-supplied orgId rejection
permission enforcement
soft delete where applicable
event emission after successful mutation
two-org tenant isolation tests
permission-denial tests
architecture checks
```

Generated code must never include:

```txt
sdk.getDb(orgId)
body.orgId
query orgId
hidden orgId fields
raw Prisma imports in modules
@/kernel/* imports in modules
module-to-module imports
/api/[module] route shape
auth-only mutation routes
placeholder security tests
FastAPI/Python backend files
```

---

# 17. Security Testing Model

Security tests are not optional.

Every security-sensitive suite must include at least two organizations.

## 17.1 Required test identities

```txt
Org A admin
Org A staff with permission
Org A staff without permission
Org B admin
Org B staff
unauthenticated user
suspended org user later
```

## 17.2 Required test categories

```txt
unauthenticated API returns 401 JSON
authenticated wrong-org access returns safe 404
correct-org but unauthorized user returns 403 JSON
module-disabled route returns safe 404
client-supplied orgId is rejected
tenant-scoped reads cannot cross orgs
tenant-scoped writes cannot cross orgs
soft-deleted records do not appear in normal reads
admin wildcard works only inside own org
API never redirects or returns HTML
services require PlatformContext
module generator output includes security tests
```

## 17.3 Architecture checks

The platform should include a command such as:

```bash
npm run check:architecture
```

It should block:

```txt
modules importing @/kernel/*
modules importing raw Prisma
modules importing other modules
sdk.getDb(orgId)
request body/query orgId usage
unsafe tenant-scoped findUnique patterns
FastAPI/Python backend files in core platform
```

---

# 18. Production Readiness Model

A OneDayOS build is not production-ready merely because it compiles.

Before onboarding real multi-tenant clients, the Production Readiness Gate must pass.

Minimum required checks:

```txt
[ ] live Postgres migration verified
[ ] seed/provisioning verified
[ ] API auth returns JSON 401, never redirects
[ ] org membership check implemented
[ ] route-level tenant guard implemented
[ ] API-level tenant guard implemented
[ ] services require PlatformContext
[ ] client-supplied orgId rejected
[ ] permissions enforced in APIs
[ ] permissions enforced in services
[ ] two-org cross-tenant read tests pass
[ ] two-org cross-tenant write tests pass
[ ] module-disabled tests pass
[ ] soft-delete tests pass
[ ] architecture checks pass
[ ] build passes
[ ] typecheck passes
[ ] tests pass
[ ] backup/restore plan exists
[ ] production environment secrets are protected
```

Before onboarding a **second tenant**, tenant isolation and permission enforcement are non-negotiable.

---

# 19. Error Handling and Information Disclosure

Errors should be useful without leaking internals.

## 19.1 Safe errors

```txt
UNAUTHENTICATED
FORBIDDEN
ORG_NOT_FOUND
MODULE_NOT_FOUND
RESOURCE_NOT_FOUND
VALIDATION_ERROR
CONFLICT
RATE_LIMITED later
INTERNAL_ERROR
```

## 19.2 Unsafe errors

Do not expose:

```txt
stack traces
SQL errors
Prisma raw errors
database URLs
table names where unnecessary
other organization names
whether another org has a record ID
secrets
provider tokens
```

Log internal details server-side with appropriate redaction.

---

# 20. Compliance Posture

OneDayOS is not initially claiming enterprise compliance certifications.

However, it should be designed in a way that does not block future maturity.

Future compliance-relevant areas:

```txt
audit logs
access logs
data retention
export controls
delete/anonymization workflows
backup restore evidence
incident response records
least-privilege infrastructure access
AI data-processing documentation
```

MVP should avoid architectural choices that make these impossible later.

---

# 21. Claude Implementation Rules

Claude must treat this document as a security boundary.

Claude may not:

```txt
implement APIs without API-safe auth
accept orgId from client input
use sdk.getDb(orgId)
pass loose orgId to services
skip permission checks
skip tenant tests
use redirect-style auth in APIs
import raw Prisma inside modules
import @/kernel/* inside modules
import one module from another module
add FastAPI/Python backend files
add Platform Services from roadmap names alone
add user-facing AI features from AI contracts alone
```

If the manual is ambiguous, Claude should stop and report the ambiguity.

Claude should not invent security exceptions.

---

# 22. Recommended File Ownership

Security-related implementation should be concentrated in predictable places.

```txt
src/sdk/server/auth.ts
src/sdk/server/context.ts
src/sdk/server/permissions.ts
src/sdk/server/api.ts
src/sdk/server/db.ts
src/kernel/auth/*
src/kernel/permissions/*
src/kernel/organizations/*
src/kernel/errors/*
src/platform/security/*
src/platform/checks/*
```

Modules should consume security through SDK helpers.

Modules should not implement their own auth, tenant, or permission systems.

---

# 23. Security Anti-Patterns

These patterns are explicitly rejected.

```txt
client-supplied orgId
hidden orgId form field
query string orgId for tenant operations
sdk.getDb(orgId)
raw Prisma in modules
findUnique({ where: { id } }) on tenant records
API route using redirect-based requireAuth
mutation route with auth but no permission check
service method that accepts loose orgId
module importing another module
module defining duplicate Product/Customer/Employee/Supplier/Warehouse
AI executing SQL
AI mutating data directly
attachments in public buckets for private business files
manual production DB schema edits
per-client code forks
client-owned Supabase projects by default
```

---

# 24. Acceptance Criteria

This document is acceptable when:

```txt
[ ] It clearly defines OneDayOS security philosophy.
[ ] It identifies tenant isolation as the primary platform security boundary.
[ ] It requires PlatformContext for tenant-scoped operations.
[ ] It separates authentication from authorization.
[ ] It defines API security expectations.
[ ] It defines data security expectations.
[ ] It defines AI safety expectations.
[ ] It defines generator security expectations.
[ ] It defines security testing expectations.
[ ] It aligns with the Production Readiness Gate.
[ ] It prevents the old MVP security risks from returning.
[ ] It gives Claude clear forbidden patterns.
```

---

# 25. Implementation Status

This document is required before the restarted foundation build.

It authorizes implementation of security foundations only when paired with the more specific documents:

```txt
13-security/01-auth-security.md
13-security/02-tenant-isolation.md
13-security/03-permission-enforcement.md
13-security/04-api-security.md
13-security/05-data-security.md
13-security/06-secrets-management.md
13-security/07-security-testing.md
13-security/08-production-readiness-gate.md
```

This document alone should not be used as a broad implementation prompt.

Claude should implement narrow, frozen security documents one at a time.

---

# 26. Final Rule

The security model of OneDayOS is simple:

```txt
Authenticate the user.
Verify the tenant.
Verify the module.
Verify the permission.
Validate the input.
Use PlatformContext.
Scope every query.
Return safe JSON.
Test with two organizations.
Never let AI, generators, or client input bypass the platform.
```

If that rule becomes boring and automatic, OneDayOS can safely scale from one client to hundreds.
