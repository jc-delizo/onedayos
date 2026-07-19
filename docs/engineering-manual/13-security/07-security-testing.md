# OneDayOS Engineering Manual — 13 Security / 07 Security Testing

**Document ID:** `13-security/07-security-testing.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Foundation Build`  
**Owner:** OneDayOS Founder + Platform Architect  
**Last Updated:** July 2026  
**Supersedes:** N/A  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/01-tenancy-data-isolation.md`
- `13-security/00-security-model.md`
- `13-security/01-auth-security.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `13-security/04-api-security.md`
- `13-security/05-data-security.md`
- `13-security/06-secrets-management.md`

---

## 1. Purpose

This document defines the security testing requirements for the restarted OneDayOS platform build.

Security testing in OneDayOS is not a final QA activity. It is an architectural enforcement system.

The previous MVP proved that it is possible to build the Kernel, SDK, permissions, module registry, event bus, shell, and generator while still leaving critical security behavior unenforced. Specifically, the old build had open issues around:

```txt
org membership checks
permission enforcement
API auth returning redirects instead of JSON 401
loose orgId handling
soft-delete bypass paths
generator-created unsafe patterns
tautological tests
```

The restarted build must not repeat those mistakes.

Security tests must prove that OneDayOS behaves safely when users are unauthenticated, authenticated but unauthorized, authenticated in the wrong tenant, using disabled modules, submitting invalid data, submitting forbidden tenant identifiers, or trying to access deleted records.

The security test suite is mandatory before any official business module starts.

---

## 2. Core Thesis

```txt
OneDayOS is not secure because we wrote secure-looking code.
OneDayOS is secure only when tests prove the dangerous paths fail safely.
```

A route is not secure because it works for Admin.

A service is not secure because it accepts `ctx`.

A module is not secure because it has permissions in its manifest.

A generator is not secure because it creates files.

Security exists only when tests prove the system denies the wrong user, wrong tenant, wrong module, wrong permission, wrong input, and wrong data state.

---

## 3. Why This Document Exists

The old MVP had tests, but some of the most important risks remained open.

The restarted build must treat security testing as a core platform subsystem because OneDayOS uses:

```txt
one shared codebase
one shared database
many client organizations
per-org tenant isolation
per-org module enablement
per-org roles and permissions
shared Business Objects
AI-assisted implementation
generated module scaffolds
```

This architecture is commercially correct, but it means one bug can affect many clients.

Therefore, security testing must be built into:

```txt
Kernel
SDK
Data access
APIs
Business Objects
Module System
CLI generators
Future Platform Services
Future AI layer
CI quality gates
```

---

## 4. Non-Goals

This document does not implement:

```txt
full penetration testing program
SOC 2 compliance
ISO 27001 program
bug bounty program
SAST vendor selection
DAST vendor selection
external audit process
RLS implementation
enterprise SIEM integration
runtime intrusion detection
```

Those may come later.

This document defines the mandatory application-level security tests required for the restarted OneDayOS foundation.

---

## 5. External Testing Reference

OneDayOS should use OWASP ASVS as a long-term reference for application security verification. OWASP ASVS provides a basis for testing web application technical security controls and gives developers requirements for secure development.

For MVP, we do not need to claim formal ASVS compliance.

But the spirit should be:

```txt
security controls must be testable
security tests must be repeatable
security failures must be regression-protected
```

Suggested future direction:

```txt
MVP: OneDayOS internal security test suite
Phase 1.5: Map critical tests to OWASP ASVS categories
Phase 2: Use ASVS Level 1/selected Level 2 as a security maturity guide
```

---

## 6. Security Testing Scope

Security tests must cover the following areas:

```txt
Authentication
Session behavior
Tenant isolation
Org route membership
API auth behavior
Permission enforcement
Module enablement
Business Object access
Data validation
Soft delete
Import/export boundaries
Sensitive data handling
Secrets exposure
Generator output
Architecture boundaries
Events
Future AI boundaries
Future Platform Services boundaries
```

Not all of these require the same type of test.

Some are unit tests.

Some are API integration tests.

Some are static architecture checks.

Some are generator snapshot/pattern tests.

Some are manual release checklist items.

---

## 7. Required Test Types

OneDayOS security testing uses multiple layers.

### 7.1 Unit Tests

Unit tests validate isolated logic.

Examples:

```txt
permission matching
wildcard matching
API error mapping
Zod validation helpers
slug normalization
safe response helpers
PlatformContext construction errors
```

Unit tests are useful, but they are not enough.

A unit test that proves `can()` returns `true` does not prove any route actually calls `can()`.

### 7.2 Service Tests

Service tests validate business logic with verified `PlatformContext`.

Examples:

```txt
InventoryService.create(ctx, input) rejects unauthorized user
ProductService.delete(ctx, id) soft-deletes only within ctx.org.id
EmployeeService.list(ctx) does not return Org B employees
```

Service tests are mandatory because service methods are reusable entry points.

### 7.3 API Tests

API tests validate HTTP behavior.

Examples:

```txt
unauthenticated request returns 401 JSON
wrong-org request returns safe 404 JSON
missing permission returns 403 JSON
client-supplied orgId returns 400 JSON
invalid request body returns 400 VALIDATION_ERROR
API never redirects to login
API never returns HTML login page
```

API tests are mandatory for every protected route.

### 7.4 Integration Tests

Integration tests validate behavior across multiple layers.

Examples:

```txt
login session → PlatformContext → permission → service → database
org route slug → membership check → module enablement → permission
module API → schema validation → service mutation → event emission
```

Integration tests are especially important for tenant isolation.

### 7.5 Architecture Tests

Architecture tests validate forbidden code patterns.

Examples:

```txt
modules cannot import @/kernel/*
modules cannot import raw Prisma
modules cannot import other modules
module APIs cannot use /api/[module]
code cannot call sdk.getDb(orgId)
code cannot read request.nextUrl.searchParams.get('orgId')
client components cannot import @/sdk/server
```

These tests should run in CI through:

```bash
npm run check:architecture
```

### 7.6 Generator Tests

Generator tests validate that generated code is safe by default.

Examples:

```txt
module:create generates tenant-scoped API routes
module:create generates PlatformContext service calls
module:create generates permission tests
module:create does not generate orgId fields
module:create does not generate raw Prisma imports
module:create does not generate FastAPI/Python files
```

A weak generator will scale insecure architecture.

Generator security tests are mandatory before using the generator for real modules.

### 7.7 UI Security Smoke Tests

UI tests are not security enforcement, but they help catch permission visibility issues.

Examples:

```txt
user without create permission does not see New button
user without export permission does not see Export button
disabled module is absent from sidebar
wrong-org route shows not found/denied behavior
```

UI hiding is never enough.

API and service tests must still enforce the same denial.

### 7.8 Manual Release Checks

Some risks require manual checks before production.

Examples:

```txt
Supabase service role key is not exposed
production env vars are configured
backup settings are enabled
migration has run in staging
restore drill status is known
```

These belong in deployment and operations checklists, but security testing must reference them.

---

## 8. Mandatory Security Fixtures

Every security-sensitive test suite must use realistic test fixtures.

The minimum fixture set is:

```txt
Organization A
Organization B
Admin user in Organization A
Staff user in Organization A with limited permissions
No-role user in Organization A
Inactive user in Organization A
Admin user in Organization B
Staff user in Organization B
Enabled module in Organization A
Disabled module in Organization B
Business Object record in Organization A
Business Object record in Organization B
Soft-deleted record in Organization A
```

A test suite that uses only one organization is not a tenant-isolation test.

A test suite that uses only Admin users is not a permission test.

A test suite that uses only happy paths is not a security test.

---

## 9. Recommended Fixture Builder API

The test suite should eventually include a fixture builder like:

```ts
type SecurityFixture = {
  orgA: Organization
  orgB: Organization
  adminA: User
  staffA: User
  noRoleA: User
  inactiveA: User
  adminB: User
  staffB: User
  ctxAdminA: PlatformContext
  ctxStaffA: PlatformContext
  ctxNoRoleA: PlatformContext
  ctxAdminB: PlatformContext
}
```

Suggested helper:

```ts
const fixture = await createSecurityFixture()
```

Suggested context helpers:

```ts
fixture.ctxAdminA
fixture.ctxStaffA
fixture.ctxAdminB
```

Test setup should make it easy to write:

```ts
await expect(ProductService.list(fixture.ctxStaffA)).resolves.toEqual(...)
await expect(ProductService.get(fixture.ctxStaffA, fixture.orgBProduct.id)).rejects.toThrow(...)
```

Security tests should be easy enough that Claude and future developers cannot avoid them.

---

## 10. Security Test Naming Convention

Security tests should have clear names.

Recommended format:

```txt
SEC-[AREA]-[NUMBER]: [expected security behavior]
```

Examples:

```txt
SEC-AUTH-001: unauthenticated API request returns 401 JSON
SEC-TENANT-001: Org A user cannot access Org B dashboard route
SEC-TENANT-002: Org A user cannot read Org B Product API data
SEC-PERM-001: user without create permission cannot create Product
SEC-API-001: API route never redirects unauthenticated requests
SEC-DATA-001: sensitive fields are excluded from event payloads
SEC-GEN-001: module generator does not emit client-supplied orgId pattern
```

The goal is not bureaucracy.

The goal is traceability.

When a security bug appears, it should become a named regression test.

---

## 11. Authentication Security Tests

Authentication tests must prove that page auth and API auth are separate.

### 11.1 Page Auth Tests

Page auth may redirect.

Required tests:

```txt
unauthenticated platform page redirects to /login
authenticated user can access own org shell
authenticated inactive user is blocked
authenticated user without platform User row is blocked safely
```

### 11.2 API Auth Tests

API auth must never redirect.

Required tests:

```txt
unauthenticated protected API returns 401 JSON
unauthenticated protected API does not return 307
unauthenticated protected API does not return HTML
unauthenticated protected API returns { data: null, error }
authenticated API request creates PlatformContext
authenticated user without Prisma User row returns safe 401 or 403
inactive user returns 403 USER_INACTIVE
```

Required JSON shape:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

### 11.3 Current User Tests

Current-user lookup must be session-derived.

Required tests:

```txt
GET /api/kernel/auth/me returns current session user
GET /api/kernel/auth/me does not accept userId query param
GET /api/kernel/auth/me does not expose other users
/api/kernel/users/[id] is not used as current-user lookup
```

Forbidden pattern:

```txt
/api/kernel/users/[id]
```

for login redirect or current-user lookup.

Approved pattern:

```txt
/api/kernel/auth/me
```

---

## 12. Tenant Isolation Tests

Tenant isolation is the most important security requirement in OneDayOS.

Every tenant-scoped route, API, service, and query must be tested with at least two organizations.

### 12.1 Route Tenant Tests

Required tests:

```txt
Org A user can access /org-a/dashboard
Org A user cannot access /org-b/dashboard
Org A user accessing /org-b/dashboard gets safe 404 or access-denied page
Org A user cannot access /org-b/inventory
Org slug lookup does not authorize access by itself
suspended org blocks module access
inactive org blocks module access
```

Important rule:

```txt
orgSlug is a locator, not authorization.
```

### 12.2 API Tenant Tests

Required tests:

```txt
Org A user can call /api/orgs/org-a/objects/products
Org A user cannot call /api/orgs/org-b/objects/products
Org A user gets safe 404 ORG_NOT_FOUND for org-b
Org A user cannot create records in org-b
Org A user cannot update records in org-b
Org A user cannot delete records in org-b
Org A user cannot restore records in org-b
```

Wrong-org response should avoid confirming that the other org exists.

Recommended status:

```txt
404 ORG_NOT_FOUND
```

Not:

```txt
403 You are not a member of Acme Corp
```

### 12.3 Service Tenant Tests

Required tests:

```txt
service list(ctxOrgA) returns only Org A records
service get(ctxOrgA, orgBRecordId) returns not found
service update(ctxOrgA, orgBRecordId) returns not found
service delete(ctxOrgA, orgBRecordId) returns not found
service restore(ctxOrgA, orgBRecordId) returns not found
```

Service tests must prove that `ctx.org.id` scopes every operation.

### 12.4 Client-Supplied orgId Tests

Every API body schema must reject client-supplied `orgId`.

Required tests:

```txt
POST body containing orgId returns 400 TENANT_ID_NOT_ALLOWED
PATCH body containing orgId returns 400 TENANT_ID_NOT_ALLOWED
query string orgId returns 400 TENANT_ID_NOT_ALLOWED when forbidden
hidden form orgId is not accepted
```

Forbidden pattern:

```ts
const orgId = body.orgId
```

Forbidden pattern:

```ts
request.nextUrl.searchParams.get('orgId')
```

Approved pattern:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
```

---

## 13. Permission Enforcement Tests

Permission tests must prove that permissions are enforced in APIs and services.

### 13.1 Permission Matching Tests

Required unit tests:

```txt
exact permission allows action
wrong action denies action
wrong resource denies action
wrong module denies action
module wildcard works
resource wildcard works
action wildcard works for Admin
wildcard permission remains org-scoped
non-null conditions are denied in MVP
```

Example:

```txt
objects.product.create allows Product creation
objects.product.read does not allow Product creation
inventory.stock_adjustment.create does not allow Product creation
*.*.* allows Admin inside same org only
```

### 13.2 API Permission Tests

Required API tests:

```txt
user without read permission gets 403 on list endpoint
user without create permission gets 403 on create endpoint
user without update permission gets 403 on update endpoint
user without delete permission gets 403 on delete endpoint
user without restore permission gets 403 on restore endpoint
user without export permission cannot export
user with read but without export cannot export
user with create but without import cannot import
```

### 13.3 Service Permission Tests

Required service tests:

```txt
public service method enforces required permission
service mutation fails before DB write when permission missing
service mutation does not emit event when permission missing
service mutation does not partially write data when permission missing
```

Public service methods must not assume the API already checked permission.

During MVP, service methods must enforce permissions internally because services may be called from APIs, server components, scripts, future jobs, or future platform services.

### 13.4 Module Enablement Tests

Permission and module enablement are separate.

Required tests:

```txt
module disabled returns MODULE_NOT_FOUND or safe 404
module enabled but no permission returns 403
admin wildcard permission does not bypass disabled module
module sidebar hidden when disabled
module API blocked when disabled
module service blocked when disabled when called through module context
```

---

## 14. API Security Tests

Every protected API route must test both safe success and safe failure.

### 14.1 Required API Response Tests

Required tests:

```txt
success response uses { data, error: null }
validation error uses { data: null, error }
auth error uses { data: null, error }
permission error uses { data: null, error }
not found uses { data: null, error }
API never returns unhandled stack trace
API never returns HTML for auth failures
API never redirects
```

### 14.2 Required Status Tests

Required status behavior:

```txt
401 unauthenticated
403 authenticated but unauthorized
404 wrong org / missing resource / disabled module where safe hiding is desired
400 validation error
409 conflict
500 generic unexpected server error
```

### 14.3 Validation Tests

Required tests:

```txt
unknown body keys rejected
client-supplied orgId rejected
wrong type rejected
missing required field rejected
invalid route params rejected
invalid query params rejected
empty string rejected where inappropriate
invalid enum rejected
```

Schemas should use:

```ts
z.strictObject(...)
```

by default for API bodies.

### 14.4 Error Disclosure Tests

Required tests:

```txt
production errors do not expose stack traces
Prisma errors are mapped safely
validation errors expose field-level issues only
wrong-org errors do not reveal other org names
not-found errors do not reveal cross-tenant existence
```

---

## 15. Data Security Tests

Data security tests must prove sensitive data is not leaked through normal platform surfaces.

Required tests:

```txt
API responses exclude sensitive fields by default
event payloads exclude sensitive fields
logs do not include full request bodies
logs do not include secrets
exports require explicit export permission
AI context excludes sensitive fields by default
soft-deleted records are excluded by default
```

Sensitive fields include but are not limited to:

```txt
passwords
tokens
service role keys
session cookies
reset tokens
government IDs
salary fields
bank details
medical notes
full attachments URLs
private signed URLs
auth provider metadata
```

Many of these fields are not in MVP yet.

The rule applies as they are introduced.

---

## 16. Soft Delete Security Tests

Soft delete must be tested as a security and data-lifecycle boundary.

Required tests:

```txt
normal list excludes soft-deleted records
normal get treats soft-deleted record as not found
normal update cannot update soft-deleted record
normal delete is idempotent or safe
restore requires explicit restore permission
restore works only inside ctx.org.id
hard delete is not available through normal APIs
soft-deleted Org A record cannot be restored by Org B user
```

Prisma `$extends` may help, but tests must not rely only on extension behavior.

Service-level tests must prove queries explicitly include:

```ts
orgId: ctx.org.id
deletedAt: null
```

where appropriate.

---

## 17. Business Object Security Tests

Business Objects are shared across modules, so their security tests are mandatory.

Required tests for each Business Object:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

For each object:

```txt
Org A cannot read Org B records
Org A cannot create records for Org B
Org A cannot update Org B records
Org A cannot delete Org B records
user without objects.[object].read cannot list
user without objects.[object].create cannot create
user without objects.[object].update cannot update
user without objects.[object].delete cannot delete
soft-deleted records excluded by default
mutation emits objects.[object].* event only after success
mutation does not emit event on permission failure
client-supplied orgId rejected
```

Example event test:

```txt
ProductService.create(ctxAdminA, input)
→ emits objects.product.created
→ payload includes productId
→ payload does not include orgId
→ payload does not include full Product record
```

---

## 18. Module Security Tests

Every generated or official module must include security tests.

Required tests:

```txt
module disabled returns safe 404
module enabled but unauthorized returns 403
Org A user cannot access Org B module records
client-supplied orgId rejected
service uses PlatformContext
service enforces permission
API creates PlatformContext
API never redirects
API returns JSON errors
soft delete works
mutation emits module event only after success
module does not duplicate Business Objects
module does not import other modules
module does not import @/kernel/*
module does not import raw Prisma
```

No module is official until these pass.

---

## 19. Generator Security Tests

The module generator must be tested like a production system.

Required generator tests:

```txt
module:create creates tenant-scoped API route path
module:create does not create /api/[module]
module:create does not create orgId request fields
module:create uses PlatformContext
module:create uses sdk.getDb(ctx)
module:create does not use sdk.getDb(orgId)
module:create generates permission checks
module:create generates Zod schemas with strictObject
module:create generates client-supplied orgId rejection tests
module:create generates two-org tenant tests
module:create generates permission-denial tests
module:create generates safe event constants
module:create generates pure manifest metadata
module:create does not self-register manifest as side effect
module:create does not import @/kernel/* inside module files
module:create does not import raw Prisma inside module files
module:create does not import other modules
module:create does not generate FastAPI/Python files
module:create fails instead of overwriting existing files
module:create supports dry-run or check mode eventually
```

Forbidden generated strings should be tested.

Examples:

```txt
sdk.getDb(orgId)
request.nextUrl.searchParams.get('orgId')
body.orgId
from '@/kernel/
from '@prisma/client' inside modules
/api/${moduleId}
redirect('/login') inside API route
```

---

## 20. Architecture Security Checks

OneDayOS should include a command:

```bash
npm run check:architecture
```

This command should block known-dangerous patterns.

Minimum checks:

```txt
modules cannot import @/kernel/*
modules cannot import @/modules/* from another module
modules cannot import raw Prisma
client components cannot import @/sdk/server
client components cannot import @/kernel/*
API routes cannot use redirect-style auth helpers
code cannot call sdk.getDb(orgId)
code cannot call sdk.getDb with a string
code cannot read orgId from request body
code cannot read orgId from query params
module APIs cannot live under /api/[module]
FastAPI/Python backend files are not present in core platform
```

Possible implementation options:

```txt
custom Node script
ESLint no-restricted-imports
dependency-cruiser
ripgrep-based forbidden pattern script
AST-based check later
```

MVP can start with a custom script.

The important part is that forbidden architecture fails CI.

---

## 21. Secrets Testing

Secrets testing should prove secrets are not accidentally exposed.

Required tests/checks:

```txt
.env.local is gitignored
.env.example contains placeholders only
server env schema rejects missing required server vars
client env schema exposes only NEXT_PUBLIC_* values
service role key is never imported in client code
DATABASE_URL is never imported in client code
no code logs process.env wholesale
no generated code creates NEXT_PUBLIC_DATABASE_URL
no generated code creates NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
```

Architecture checks should search for:

```txt
process.env.SUPABASE_SERVICE_ROLE_KEY in client files
process.env.DATABASE_URL in client files
NEXT_PUBLIC_DATABASE_URL
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
console.log(process.env
```

---

## 22. Event Security Tests

Events can leak data if payloads are too large or too sensitive.

Required tests:

```txt
events are emitted only after successful mutation
events are not emitted after validation failure
events are not emitted after permission failure
events are not emitted after tenant failure
event payload does not include orgId
event payload does not include full Prisma record
event payload does not include secrets
event payload does not include sensitive fields by default
event name follows naming convention
event namespace matches ownership boundary
```

Examples:

```txt
objects.product.created     good
inventory.product.created   bad, Product is a Business Object
inventory.stock_movement.created good
send.email                  bad, command not fact
notify.user                 bad, command not fact
```

---

## 23. Future AI Security Tests

User-facing AI is deferred, but when introduced, security tests must prove AI is not a backdoor.

Required future tests:

```txt
AI context uses PlatformContext
AI context excludes disabled modules
AI context excludes unauthorized modules
AI context excludes soft-deleted records
AI context excludes sensitive fields by default
AI does not accept client-supplied orgId
AI cannot execute raw SQL
AI cannot execute raw Prisma queries
AI cannot export data without export permission
AI cannot mutate data without preview and explicit confirmation
prompt-injection content inside business records cannot override system rules
AI action denial is tested for unauthorized users
```

No AI runtime should be implemented until these tests are planned.

---

## 24. Future Platform Service Security Tests

Every future Platform Service must include security tests before implementation.

Applicable services:

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
Dynamic Table Views
```

Minimum future service tests:

```txt
uses verified PlatformContext
rejects client-supplied orgId
respects tenant isolation
respects permissions
respects module enablement where applicable
respects soft delete
excludes sensitive fields by default
cannot be accessed through disabled modules
cannot become export bypass
cannot become permission bypass
has two-org tests
has non-admin denial tests
```

Deferred does not mean unprotected.

Deferred means not built until the security model is ready.

---

## 25. Required CI Commands

The restarted build should eventually support:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run test:security
npm run check:architecture
npm run build
```

Suggested script responsibilities:

```txt
lint               TypeScript/React linting
typecheck          tsc --noEmit
test:run           all unit/integration tests
test:security      security-tagged tests or security suite
check:architecture forbidden imports/patterns
build              production build
```

Before official module work begins, CI should block failures in:

```txt
typecheck
test:run
check:architecture
build
```

Before second tenant onboarding, CI should block failures in:

```txt
test:security
```

---

## 26. Security Test Tags

Tests should be taggable or organized by folder.

Suggested folder patterns:

```txt
src/kernel/auth/__tests__/*.test.ts
src/kernel/security/__tests__/*.test.ts
src/sdk/server/__tests__/*.test.ts
src/modules/[module]/__tests__/security.test.ts
src/app/api/**/__tests__/*.test.ts
scripts/__tests__/create-module.security.test.ts
```

Suggested naming:

```txt
*.security.test.ts
*.tenant.test.ts
*.permission.test.ts
*.api.test.ts
*.architecture.test.ts
```

This allows:

```bash
npm run test:security
```

without needing to run every UI test.

---

## 27. Anti-Patterns

The following are rejected.

### 27.1 One-Org Security Tests

Bad:

```txt
Create one org.
Create one admin.
Assert list returns data.
```

This proves nothing about cross-tenant isolation.

### 27.2 Admin-Only Permission Tests

Bad:

```txt
Use Admin for every API test.
```

This hides permission bugs.

### 27.3 Mocking Away Security

Bad:

```ts
vi.mock('@/sdk/server', () => ({
  sdk: {
    permissions: { require: vi.fn().mockResolvedValue(true) }
  }
}))
```

If the test is supposed to prove authorization, do not mock authorization into success.

### 27.4 Testing Function Existence

Bad:

```ts
expect(typeof sdk.permissions.can).toBe('function')
```

This can be a smoke test, but it is not a security test.

### 27.5 Testing Only Happy Path

Bad:

```txt
POST creates record successfully
```

A security test must also prove:

```txt
unauthenticated denied
wrong tenant denied
missing permission denied
invalid input denied
client-supplied orgId denied
```

### 27.6 Trusting UI Tests as Security

Bad:

```txt
The button is hidden, so the action is secure.
```

Correct:

```txt
The button is hidden, and the API/service denies the request.
```

---

## 28. Claude Implementation Rules

When Claude implements security-sensitive code, it must also implement or update tests.

Claude must not say a security-sensitive task is complete unless it includes tests for:

```txt
success path
auth failure
tenant failure
permission failure
validation failure
client-supplied orgId if request accepts body/query
soft-delete behavior if model is soft-deletable
event non-emission on failure if mutation emits event
```

Claude must not remove security tests to make the suite pass.

Claude must not weaken tests from two-org to one-org.

Claude must not replace denial tests with Admin happy-path tests.

Claude must not mock the very security boundary being tested.

Claude must not implement a module that lacks security tests.

---

## 29. Implementation Prompt for Claude

Use this prompt when asking Claude to implement security tests:

```md
You are implementing OneDayOS security tests.

Authoritative documents:
- docs/engineering-manual/13-security/07-security-testing.md
- docs/engineering-manual/13-security/02-tenant-isolation.md
- docs/engineering-manual/13-security/03-permission-enforcement.md
- docs/engineering-manual/13-security/04-api-security.md
- docs/engineering-manual/05-sdk/06-sdk-testing-contract.md

Rules:
- Do not invent architecture.
- Use at least two organizations in tenant tests.
- Use non-admin users in permission-denial tests.
- API auth failures must return 401 JSON, never redirects.
- Wrong-org access must fail safely.
- Client-supplied orgId must be rejected.
- Do not mock away the security boundary being tested.
- Do not import @/kernel/* inside modules.
- Do not use raw Prisma inside modules.
- Add or update tests before marking the task done.

Task:
Implement only the security tests for [SUBSYSTEM].
Report any ambiguity before changing architecture.
```

---

## 30. Minimum Security Gate Before Foundation Build Is Considered Safe

Before the restarted foundation build is considered safe enough for official module work:

```txt
[ ] Auth API tests prove 401 JSON, no redirects
[ ] Org route tests prove wrong-org users are denied
[ ] API tenant tests prove wrong-org users are denied
[ ] Permission tests prove non-admin denial
[ ] Services enforce permissions internally
[ ] Client-supplied orgId is rejected
[ ] Business Object tenant isolation tests pass
[ ] Soft-delete exclusion tests pass
[ ] Module generator security tests pass
[ ] Architecture checks block forbidden imports/patterns
[ ] Secrets exposure checks pass
[ ] CI runs security tests
```

Before onboarding a second real tenant:

```txt
[ ] Two-org integration test suite passes
[ ] Cross-tenant read tests pass
[ ] Cross-tenant write tests pass
[ ] Cross-tenant update tests pass
[ ] Cross-tenant delete tests pass
[ ] Permission denial tests pass
[ ] API JSON error tests pass
[ ] Production readiness gate is reviewed
```

---

## 31. Acceptance Criteria

This document is accepted when:

```txt
[ ] Security test categories are clear
[ ] Required fixtures are defined
[ ] Tenant isolation tests require at least two organizations
[ ] Permission tests require non-admin users
[ ] API tests require JSON 401/403/404 behavior
[ ] Client-supplied orgId rejection is mandatory
[ ] Generator security tests are mandatory
[ ] Architecture checks are mandatory
[ ] Claude implementation rules are clear
[ ] Production/module safety gates are clear
```

Implementation is accepted only when:

```txt
[ ] test helpers exist
[ ] auth security tests exist
[ ] tenant isolation tests exist
[ ] permission enforcement tests exist
[ ] API security tests exist
[ ] generator security tests exist
[ ] architecture checks exist
[ ] CI runs the checks
[ ] known old MVP risks are regression-protected
```

---

## 32. Final Rule

```txt
Every serious OneDayOS security bug must become a regression test.
```

If a bug can happen once, it can happen again.

The Engineering Manual should make it harder for Claude, future engineers, or rushed delivery work to reintroduce the same class of mistake.

OneDayOS should move fast because the platform is safe by default, not because security is skipped.

