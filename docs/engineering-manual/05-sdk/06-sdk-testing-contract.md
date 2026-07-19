# OneDayOS Engineering Manual — SDK Testing Contract

**Document ID:** `05-sdk/06-sdk-testing-contract.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** No — freeze required before Claude implementation  
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
- `05-sdk/05-sdk-compatibility-versioning.md`

---

# 1. Purpose

This document defines the testing contract for the OneDayOS SDK.

The SDK is the only supported interface between Business Modules and the OneDayOS Kernel. Therefore, the SDK must be tested more strictly than ordinary application code.

A broken SDK does not break one screen.

A broken SDK can break every module, every tenant, every generated feature, and every future AI-assisted implementation.

This document tells Claude Code and future engineers:

```txt
How to test the SDK.
What SDK behavior must never regress.
Which mocks are allowed.
Which mocks are forbidden.
What generated modules must test.
How tenant isolation and permission enforcement are proven.
```

---

# 2. Core Principle

The SDK test suite is not only a correctness test suite.

It is an **architecture enforcement suite**.

The tests must prove that:

```txt
Modules cannot bypass Kernel boundaries.
Modules cannot access raw Prisma.
Modules cannot use client-supplied orgId.
Modules cannot skip tenant membership checks.
Modules cannot skip permission checks.
Modules cannot use redirect-style auth in APIs.
Modules cannot emit unscoped events.
Client code cannot import server-only SDK capabilities.
```

If a test only proves that a function exists, it is insufficient.

---

# 3. Why This Document Exists

The previous Kernel MVP correctly introduced an SDK, event bus, module registry, permission checker, shared database, and module generator.

However, several important safety boundaries remained incomplete:

```txt
sdk.permissions.can() existed but was not enforced.
org membership checks were incomplete.
API routes could use redirect-style auth helpers.
module scaffolds could drift toward unsafe orgId handling.
some tests were tautological and did not exercise real behavior.
```

The restarted OneDayOS platform must not repeat this pattern.

The SDK test suite must prove behavior, not merely imports.

---

# 4. Scope

This document covers testing for:

```txt
@/sdk
@/sdk/server
@/sdk/client
SDK shared types
PlatformContext creation
auth helpers
tenant helpers
module enablement helpers
permission helpers
database access helpers
API route wrappers
event helpers
module manifest compatibility
generated module SDK usage
SDK import boundaries
```

This document does not cover:

```txt
full UI visual regression testing
module-specific business logic tests
database migration testing
end-to-end browser testing
performance/load testing
security penetration testing
```

Those are handled in later Testing and Operations manual documents.

---

# 5. SDK Package Boundaries

The SDK is split into three import surfaces:

```txt
@/sdk
@/sdk/server
@/sdk/client
```

## 5.1 Shared SDK

`@/sdk` is safe to import from server or client code.

It may export:

```txt
types
constants
error codes
permission requirement types
module manifest types
event name types
API response types
```

It must not export:

```txt
Prisma
Supabase server client
cookies
headers
server-only auth helpers
database helpers
event emitters
service role utilities
```

## 5.2 Server SDK

`@/sdk/server` is server-only.

It may export:

```ts
sdk.auth
sdk.context
sdk.permissions
sdk.modules
sdk.getDb
sdk.db.transaction
sdk.events.emit
sdk.api.handle
```

It may import Kernel internals.

It must never be imported by client components.

## 5.3 Client SDK

`@/sdk/client` is browser-safe.

It may export:

```ts
sdkClient.api
sdkClient.auth
sdkClient.forms
sdkClient.errors
```

It must not export:

```txt
Prisma
server auth helpers
PlatformContext creation
permission enforcement
database access
server event emitters
service role access
```

---

# 6. Required Test Categories

The SDK requires seven categories of tests.

```txt
1. Shared SDK import safety tests
2. Server SDK contract tests
3. Client SDK contract tests
4. PlatformContext tests
5. Permission enforcement tests
6. Database access tests
7. Generated module contract tests
```

Each category is mandatory.

---

# 7. Test Directory Structure

Recommended structure:

```txt
src/
  sdk/
    index.ts
    server.ts
    client.ts

    __tests__/
      shared-imports.test.ts
      server-sdk.test.ts
      client-sdk.test.ts
      platform-context.test.ts
      permissions.test.ts
      db-access.test.ts
      api-wrapper.test.ts
      events.test.ts
      module-compatibility.test.ts

    test-utils/
      factories.ts
      contexts.ts
      api.ts
      permissions.ts
      tenants.ts
```

Module-generated tests should live inside the module:

```txt
src/modules/[module]/
  __tests__/
    service.test.ts
    api.test.ts
    permissions.test.ts
    tenant-isolation.test.ts
    events.test.ts
```

---

# 8. Testing Philosophy

## 8.1 Test behavior, not implementation

Bad test:

```ts
expect(typeof sdk.permissions.can).toBe('function')
```

Good test:

```ts
expect(await sdk.permissions.can(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'create',
})).toBe(true)
```

Better test:

```ts
await expect(
  sdk.permissions.require(staffCtx, {
    module: 'inventory',
    resource: 'product',
    action: 'delete',
  })
).rejects.toMatchObject({
  code: 'FORBIDDEN',
})
```

## 8.2 Test boundaries, not happy paths only

Every SDK helper must be tested for:

```txt
successful case
unauthenticated case
wrong tenant case
disabled module case
missing permission case
invalid input case
```

## 8.3 Security tests are contract tests

Tenant and permission tests are not optional security extras.

They are part of the SDK contract.

## 8.4 Tests should fail loudly when architecture drifts

If Claude accidentally reintroduces:

```ts
sdk.getDb(orgId)
```

or:

```ts
import { prisma } from '@/kernel/db/client'
```

inside a module, the test suite or CI import rules must fail.

---

# 9. Required SDK Test Utilities

The SDK should provide test utilities for internal platform tests and generated module tests.

These utilities should be available from a test-only path:

```ts
import {
  createTestOrg,
  createTestUser,
  createTestRole,
  createTestPermission,
  createTestPlatformContext,
  createSecondOrgFixture,
  expectApiError,
  expectForbidden,
  expectUnauthorized,
} from '@/sdk/test-utils'
```

These utilities must not be included in production bundles or public module APIs.

---

# 10. Test Fixture Model

The standard SDK test fixture must create at least two organizations.

```txt
Org A
  Admin User A
  Staff User A
  Employee A
  Inventory enabled
  CRM disabled

Org B
  Admin User B
  Staff User B
  Employee B
  Inventory enabled or disabled depending on test
```

This fixture is required because single-org tests cannot prove tenant isolation.

---

# 11. Standard Test Users

Every SDK and generated module test suite should have these users:

## 11.1 Org Admin

```txt
User: adminA
Org: orgA
Role: Admin
Permission: *.*.*
```

Expected:

```txt
Can access orgA.
Can use enabled modules in orgA.
Cannot access orgB.
Cannot bypass org suspension.
Cannot bypass tenant isolation.
```

## 11.2 Org Staff With Permission

```txt
User: staffA
Org: orgA
Role: Inventory Staff
Permission: inventory.product.read
```

Expected:

```txt
Can read inventory products in orgA.
Cannot create/update/delete without permission.
Cannot access orgB.
```

## 11.3 Org Staff Without Permission

```txt
User: limitedA
Org: orgA
Role: Staff
Permission: none or unrelated permission
```

Expected:

```txt
Can authenticate.
Can load basic org shell if allowed.
Cannot access protected module actions.
Receives 403 JSON for forbidden API calls.
```

## 11.4 Other Org User

```txt
User: adminB
Org: orgB
Role: Admin
Permission: *.*.*
```

Expected:

```txt
Cannot access orgA even with wildcard permission.
Wildcard permission is scoped to verified organization only.
```

---

# 12. PlatformContext Test Contract

`PlatformContext` is the root of safe SDK behavior.

The SDK must test that `PlatformContext` can only be created by Kernel-authenticated helpers.

## 12.1 Expected PlatformContext Shape

```ts
type PlatformContext = {
  authUserId: string
  userId: string
  orgId: string
  orgSlug: string
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
  }
  roles: Array<{
    id: string
    name: string
  }>
  permissions: PermissionGrant[]
  enabledModuleIds: string[]
  source: 'page' | 'api' | 'service' | 'test'
}
```

## 12.2 Required Tests

```txt
creates context for authenticated active user
rejects unauthenticated request
rejects missing Prisma User row
rejects inactive user
rejects inactive organization for module access
rejects wrong org slug
returns safe 404 for wrong org access
loads enabled modules
loads role-derived permissions
does not accept orgId from request body
does not accept orgId from query string
```

## 12.3 Example Test

```ts
it('rejects user from another organization even with wildcard permission', async () => {
  const { orgA, adminB } = await createTwoOrgFixture()

  await expect(
    sdk.auth.requireApiOrgContext({
      request: mockRequestAs(adminB),
      orgSlug: orgA.slug,
    })
  ).rejects.toMatchObject({
    code: 'ORG_NOT_FOUND',
    status: 404,
  })
})
```

---

# 13. Auth Helper Test Contract

SDK auth helpers must distinguish page behavior from API behavior.

## 13.1 Page Auth

Page auth may redirect.

```ts
await sdk.auth.requirePageAuth()
```

Allowed behavior:

```txt
Unauthenticated page request → redirect to /login
```

## 13.2 API Auth

API auth must never redirect.

```ts
await sdk.auth.requireApiAuth(request)
```

Required behavior:

```txt
Unauthenticated API request → 401 JSON-compatible error
```

## 13.3 Required Tests

```txt
requirePageAuth redirects unauthenticated users
requirePageAuth returns authenticated user
requireApiAuth returns user for valid session
requireApiAuth throws/returns UNAUTHENTICATED for missing session
requireApiAuth never calls redirect()
requireApiAuth never returns HTML
requireApiAuth error maps to 401 JSON through sdk.api.handle()
```

## 13.4 Forbidden Regression

This must fail tests:

```ts
export async function GET() {
  await sdk.auth.requirePageAuth()
}
```

API routes must use API-safe helpers.

---

# 14. Permission Helper Test Contract

The permission system must test both `can()` and `require()`.

## 14.1 Permission Requirement Shape

```ts
type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

## 14.2 Permission Matching Rules

A grant matches a requirement if:

```txt
grant.orgId == ctx.orgId
AND grant.conditions == null
AND (grant.module == requirement.module OR grant.module == '*')
AND (grant.resource == requirement.resource OR grant.resource == '*')
AND (grant.action == requirement.action OR grant.action == '*')
```

## 14.3 Required Permission Tests

```txt
returns true for exact permission
returns true for wildcard module
returns true for wildcard resource
returns true for wildcard action
returns true for *.*.*
returns false for missing role
returns false for wrong module
returns false for wrong resource
returns false for wrong action
returns false for permission from another org
returns false for non-null conditions in MVP
require() throws FORBIDDEN when missing permission
require() returns void when permission exists
Admin wildcard does not bypass wrong org context
```

## 14.4 Conditions Rule Test

MVP does not support ABAC evaluation.

Therefore this permission must be denied:

```json
{
  "module": "expenses",
  "resource": "claim",
  "action": "approve",
  "conditions": {
    "maxAmount": 50000
  }
}
```

Required behavior:

```txt
conditions != null → deny until ABAC evaluator exists
```

Test:

```ts
it('denies conditional permissions in MVP', async () => {
  const ctx = await createTestPlatformContext({
    permissions: [
      {
        module: 'expenses',
        resource: 'claim',
        action: 'approve',
        conditions: { maxAmount: 50000 },
      },
    ],
  })

  expect(await sdk.permissions.can(ctx, {
    module: 'expenses',
    resource: 'claim',
    action: 'approve',
  })).toBe(false)
})
```

---

# 15. Module Enablement Test Contract

Module enablement is separate from user permission.

A user needs both:

```txt
OrgModule enabled
AND
permission granted
```

## 15.1 Required Tests

```txt
enabled module + permission → allowed
enabled module + missing permission → forbidden
disabled module + permission → module disabled
disabled module + admin wildcard → module disabled
unknown module → module disabled or not found
suspended org → module access blocked
```

## 15.2 Example

```ts
it('blocks admin from disabled module', async () => {
  const ctx = await createTestPlatformContext({
    enabledModuleIds: [],
    permissions: ['*.*.*'],
  })

  await expect(
    sdk.auth.requireApiModuleContext(mockRequest(ctx), ctx.orgSlug, 'inventory')
  ).rejects.toMatchObject({
    code: 'MODULE_DISABLED',
    status: 403,
  })
})
```

---

# 16. Database Access Test Contract

Database access is one of the most critical SDK contracts.

The approved pattern is:

```ts
const db = sdk.getDb(ctx)
```

The forbidden old pattern is:

```ts
const db = sdk.getDb(orgId)
```

## 16.1 Required Tests

```txt
sdk.getDb(ctx) returns tenant-aware database facade
sdk.getDb() with no context is forbidden for modules
sdk.getDb(orgId) does not exist
tenant-scoped helper injects ctx.orgId
client-supplied orgId is rejected before service call
soft-deletable reads exclude deleted records
soft-delete writes set deletedAt and deletedBy
hard delete helper is unavailable for module business data
transactions preserve ctx
raw SQL is unavailable in module SDK facade
```

## 16.2 Tenant Query Rules

Module code should prefer tenant-scoped SDK helpers.

Allowed:

```ts
const db = sdk.getDb(ctx)

await db.product.findMany({
  where: {
    name: { contains: search },
  },
})
```

The SDK facade should inject or require tenant scope according to the DB access document.

Forbidden:

```ts
await prisma.product.findMany({
  where: {
    orgId: body.orgId,
  },
})
```

Forbidden:

```ts
await sdk.getDb('org_123')
```

Forbidden:

```ts
await db.product.findUnique({
  where: { id },
})
```

For tenant-scoped models, `findUnique` can create subtle cross-tenant risks unless uniqueness includes tenant information. Use tenant-scoped `findFirst` or SDK-provided helpers.

## 16.3 Transaction Tests

Required:

```ts
it('preserves PlatformContext inside transactions', async () => {
  await sdk.db.transaction(ctx, async (tx) => {
    expect(tx.ctx.orgId).toBe(ctx.orgId)
  })
})
```

Required:

```txt
transaction callback receives tenant-scoped db facade
transaction callback cannot access raw Prisma
transaction rolls back on thrown error
transaction supports event emission after successful commit where applicable
```

---

# 17. API Wrapper Test Contract

All API routes should be implemented using:

```ts
sdk.api.handle()
```

or the equivalent approved helper.

## 17.1 Required API Wrapper Behavior

`sdk.api.handle()` must:

```txt
catch known SDK errors
map auth errors to 401
map permission errors to 403
map validation errors to 400
map not found errors to 404
map conflict errors to 409
hide stack traces
return { data, error }
never redirect
never return HTML
preserve request IDs if available
```

## 17.2 Standard Error Response

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": null
  }
}
```

## 17.3 Required Tests

```txt
successful handler returns 200 { data, error: null }
created handler returns 201 { data, error: null }
unauthenticated request returns 401 JSON
wrong tenant returns safe 404 JSON
disabled module returns 403 JSON
missing permission returns 403 JSON
invalid body returns 400 JSON
unexpected error returns 500 JSON without stack trace
handler never calls redirect()
handler never returns Response HTML
```

## 17.4 Example

```ts
it('maps unauthenticated SDK error to 401 JSON', async () => {
  const response = await sdk.api.handle(async () => {
    throw new SdkError('UNAUTHENTICATED', 'Authentication required.', 401)
  })

  expect(response.status).toBe(401)
  await expect(response).toHaveApiError('UNAUTHENTICATED')
})
```

---

# 18. Event SDK Test Contract

Events are contracts.

They must be tested.

## 18.1 Required Event Behavior

```txt
event names must follow naming convention
event emit requires PlatformContext
event envelope includes orgId
event envelope includes actorUserId
event envelope includes occurredAt
payload is validated when schema exists
listener receives EventEnvelope
listener failure does not break mutation
emitted events are testable
```

## 18.2 Event Naming Tests

Allowed:

```txt
inventory.stock_movement.created
objects.product.updated
kernel.user.invited
```

Forbidden:

```txt
ProductCreated
inventory.product.create
inventoryProductCreated
product.created
inventory.product.Created
inventory.product.created.v2
```

## 18.3 Example

```ts
it('rejects invalid event names', async () => {
  await expect(
    sdk.events.emit(ctx, 'ProductCreated', { id: 'p1' })
  ).rejects.toMatchObject({
    code: 'INVALID_EVENT_NAME',
  })
})
```

## 18.4 Listener Failure Test

```ts
it('does not fail mutation when listener throws', async () => {
  sdk.events.on('objects.product.created', async () => {
    throw new Error('listener failed')
  })

  await expect(
    sdk.events.emit(ctx, 'objects.product.created', { productId: 'p1' })
  ).resolves.not.toThrow()
})
```

---

# 19. Client SDK Test Contract

The client SDK is a browser-safe helper layer.

It must not enforce security. It improves developer experience only.

Security remains server-side.

## 19.1 Required Client SDK Tests

```txt
client SDK can call JSON APIs
client SDK parses { data, error }
client SDK throws or returns normalized API errors
client SDK never exposes server-only helpers
client SDK never imports Prisma
client SDK never imports next/headers
client SDK never imports next/navigation redirect helpers
client SDK supports typed API response helpers
```

## 19.2 Forbidden Client SDK Exports

This must not compile:

```ts
import { sdk } from '@/sdk/client'

sdk.getDb(ctx)
sdk.permissions.require(ctx, requirement)
sdk.events.emit(ctx, event, payload)
```

The client SDK may expose helper functions like:

```ts
sdkClient.api.get()
sdkClient.api.post()
sdkClient.api.delete()
sdkClient.auth.signIn()
sdkClient.auth.signOut()
```

But every protected operation must still be enforced on the server.

---

# 20. Shared SDK Import Safety Tests

The shared SDK must remain server/client neutral.

## 20.1 Required Tests

```txt
@/sdk imports without server-only modules
@/sdk does not import Prisma
@/sdk does not import next/headers
@/sdk does not import next/cookies
@/sdk does not import Supabase service role helpers
@/sdk exports only safe types/constants/errors
```

This is best enforced through a dependency rule, but at minimum it must be covered by CI.

---

# 21. Forbidden Import Tests

Modules must never import Kernel internals.

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
import { bus } from '@/kernel/events/bus'
import { registerModule } from '@/kernel/modules/registry'
```

Allowed:

```ts
import { sdk } from '@/sdk/server'
import type { ModuleManifest } from '@/sdk'
import { sdkClient } from '@/sdk/client'
```

## 21.1 Enforcement Options

Use one or more:

```txt
ESLint no-restricted-imports
dependency-cruiser
custom script scanning module imports
TypeScript project references
CI grep check
```

## 21.2 Minimum CI Check

There must be a script:

```bash
npm run check:architecture
```

It must fail if any file under `src/modules/` imports from:

```txt
@/kernel/*
@/modules/*
@/sdk/server from client components
```

---

# 22. Generated Module Testing Contract

Every generated module must include tests from day one.

The generator must not create placeholder tests that merely pass.

## 22.1 Required Generated Tests

For module `[module]`, generate:

```txt
src/modules/[module]/__tests__/service.test.ts
src/modules/[module]/__tests__/permissions.test.ts
src/modules/[module]/__tests__/events.test.ts
src/modules/[module]/__tests__/tenant-isolation.test.ts
src/app/api/orgs/[orgSlug]/[module]/[resource]/__tests__/route.test.ts
```

If the route test structure is too heavy for MVP, API tests may be colocated under the module:

```txt
src/modules/[module]/__tests__/api.test.ts
```

But the behaviors are still required.

## 22.2 Generated Service Tests

Required:

```txt
service accepts PlatformContext
service rejects missing PlatformContext at type level where possible
service calls sdk.getDb(ctx)
service does not call sdk.getDb(orgId)
service emits expected events on mutation
service uses soft delete for delete actions
service never imports raw Prisma
```

## 22.3 Generated Permission Tests

Required:

```txt
admin with enabled module can read
staff with read permission can read
staff without read permission is denied
staff with read cannot create
admin from another org is denied
disabled module blocks even admin
```

## 22.4 Generated Tenant Isolation Tests

Required:

```txt
Org A user cannot list Org B records
Org A user cannot create under Org B slug
Org A user cannot update Org B record by guessed ID
Org A user cannot delete Org B record by guessed ID
client-supplied orgId is rejected
```

## 22.5 Generated API Tests

Required:

```txt
GET unauthenticated → 401 JSON
GET wrong org → 404 JSON
GET missing permission → 403 JSON
POST invalid body → 400 JSON
POST valid body → 201 JSON
POST body containing orgId → 400 JSON
DELETE forbidden user → 403 JSON
DELETE valid admin → 200 JSON
```

## 22.6 Generated Event Tests

Required:

```txt
create emits [module].[entity].created
update emits [module].[entity].updated
delete emits [module].[entity].deleted
events include orgId and actorUserId
invalid event names fail
```

---

# 23. Mocking Rules

Mocks are allowed, but unsafe mocks can hide architectural bugs.

## 23.1 Allowed Mocks

Allowed:

```txt
mock Supabase session for auth tests
mock Prisma through test DB facade for unit tests
mock sdk.events.emit to assert event emission
mock Date for deterministic timestamps
mock request objects for API wrapper tests
```

## 23.2 Forbidden Mocks

Forbidden:

```txt
mock permission helper to always return true in route tests
mock PlatformContext manually in API tests without testing context creation separately
mock sdk.getDb to hide orgId misuse
mock raw Prisma in module tests
mock API wrapper away when testing API behavior
mock tenant isolation tests using only one organization
```

## 23.3 Rule

Do not mock the exact boundary you are trying to prove.

Example:

If testing permission enforcement, do not mock `sdk.permissions.require()` to always pass.

---

# 24. Unit vs Contract vs Integration Tests

## 24.1 Unit Tests

Use for:

```txt
event name validation
permission matching logic
API error mapping
manifest compatibility matching
client SDK response parsing
```

## 24.2 Contract Tests

Use for:

```txt
SDK public surface
PlatformContext creation
API route wrapper behavior
permission enforcement behavior
database facade behavior
event envelope shape
generated module expectations
```

## 24.3 Integration Tests

Use for:

```txt
real Prisma queries
transaction behavior
tenant isolation with two orgs
soft delete behavior
module enablement with OrgModule
registration auth/db sync
```

## 24.4 End-to-End Tests

Not required in this SDK document, but later should cover:

```txt
login
org route access
module list/create/update/delete
permission-denied UI
```

---

# 25. Test Database Strategy

The SDK test suite should eventually run against a real PostgreSQL test database for integration tests.

MVP can start with mocked unit tests, but the Production Readiness Gate requires real database-backed tests for:

```txt
tenant isolation
permission grants
org membership
soft delete
transactions
registration rollback where practical
```

## 25.1 Recommended Test Database

Use one of:

```txt
dedicated Supabase test project
local PostgreSQL container
ephemeral CI PostgreSQL service
```

Avoid SQLite for integration tests because OneDayOS production uses PostgreSQL and Prisma behavior can differ.

## 25.2 Required Test DB Commands

Eventually define:

```bash
npm run test:unit
npm run test:integration
npm run test:security
npm run test:run
```

For MVP, `npm run test:run` may run all available tests, but the script names should be reserved.

---

# 26. API Test Helpers

Add test helpers for API responses.

## 26.1 `expectApiSuccess`

```ts
await expectApiSuccess(response, {
  status: 200,
})
```

Checks:

```txt
response status matches
body has data
body.error is null
body does not contain stack trace
```

## 26.2 `expectApiError`

```ts
await expectApiError(response, {
  status: 403,
  code: 'FORBIDDEN',
})
```

Checks:

```txt
response status matches
body.data is null
body.error.code matches
body.error.message exists
body.error.details is safe
body does not contain stack trace
```

## 26.3 `expectUnauthorized`

Shortcut for:

```txt
401 UNAUTHENTICATED
```

## 26.4 `expectForbidden`

Shortcut for:

```txt
403 FORBIDDEN
```

## 26.5 `expectWrongOrgNotFound`

Shortcut for:

```txt
404 ORG_NOT_FOUND
```

---

# 27. SDK Error Test Contract

SDK errors must be normalized.

## 27.1 Required Error Type

```ts
class SdkError extends Error {
  code: string
  status: number
  details?: unknown
  expose: boolean
}
```

## 27.2 Required Error Codes

```txt
UNAUTHENTICATED
ORG_NOT_FOUND
ORG_INACTIVE
USER_INACTIVE
MODULE_DISABLED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
CONFLICT
INVALID_EVENT_NAME
INTERNAL_ERROR
```

## 27.3 Required Tests

```txt
SdkError preserves code/status
API wrapper maps SdkError to JSON
API wrapper hides unexpected errors
validation helper maps Zod errors
unexpected errors do not expose stack trace
```

---

# 28. Manifest Compatibility Test Contract

Module manifests are compatibility contracts.

## 28.1 Required Tests

```txt
valid manifest passes validation
missing id fails validation
missing version fails validation
invalid permission shape fails validation
invalid event name fails validation
unsupported SDK compatibility window warns or fails according to policy
duplicate module ID fails registration
dependency cycle fails detection where implemented
disabled dependency blocks enablement where implemented
```

## 28.2 Manifest Permission Test

Old pattern:

```ts
permissions: ['create', 'read']
```

New approved pattern:

```ts
permissions: [
  {
    module: 'inventory',
    resource: 'product',
    action: 'read',
  },
]
```

Required test:

```txt
array of action strings fails manifest validation
```

This prevents old scaffolds from returning.

---

# 29. Compatibility Regression Tests

The SDK compatibility/versioning document defines several contracts that must be protected with tests.

Required regression tests:

```txt
sdk.getDb(orgId) is not exported
PlatformContext has orgId and userId
PermissionRequirement uses module/resource/action
EventEnvelope includes orgId and actorUserId
API response shape is { data, error, meta? }
module manifest uses compatibility object, not simple kernelVersion only
client SDK cannot import server SDK
server SDK cannot be bundled into client components
```

---

# 30. Soft Delete Test Contract

The SDK DB access document defines soft delete as a platform rule.

Required tests:

```txt
list queries exclude deleted records
detail queries exclude deleted records
soft delete sets deletedAt
soft delete sets deletedBy from ctx.userId
soft-deleted records cannot be updated by normal module service
restore is unavailable unless explicit admin restore API exists
hard delete is not exposed for module business entities
```

Known Prisma extension limitations must not be hidden by shallow tests.

The test suite must cover actual query behavior or the SDK facade behavior, not only a copied `if` statement.

---

# 31. Tenant Isolation Test Matrix

Every SDK-protected route and generated module should eventually pass this matrix.

| Scenario | Expected Result |
|---|---|
| Unauthenticated request | `401 UNAUTHENTICATED` |
| Authenticated user, missing platform user | `401` or `403` depending on helper |
| User from Org A requests Org A | Allowed if permission exists |
| User from Org A requests Org B | `404 ORG_NOT_FOUND` |
| User from Org A sends `orgId` for Org B | `400 VALIDATION_ERROR` |
| Admin from Org A requests Org B | `404 ORG_NOT_FOUND` |
| Staff from Org A lacks permission | `403 FORBIDDEN` |
| Admin from Org A but module disabled | `403 MODULE_DISABLED` |
| User inactive | `403 USER_INACTIVE` |
| Organization inactive/suspended | blocked according to org status policy |

---

# 32. Permission Test Matrix

| Permission Grant | Requirement | Expected |
|---|---|---|
| `inventory.product.read` | `inventory.product.read` | allow |
| `inventory.*.read` | `inventory.product.read` | allow |
| `inventory.product.*` | `inventory.product.delete` | allow |
| `*.*.*` | `inventory.product.delete` | allow inside same org |
| `crm.customer.read` | `inventory.product.read` | deny |
| `inventory.product.read` | `inventory.product.delete` | deny |
| `inventory.product.read` in Org A | same requirement in Org B | deny |
| conditional permission | matching requirement | deny in MVP |

---

# 33. API Response Test Matrix

Every protected API route must test:

| Case | Status | Error Code |
|---|---:|---|
| Success read | `200` | `null` |
| Success create | `201` | `null` |
| Success update | `200` | `null` |
| Success soft delete | `200` | `null` |
| Invalid body | `400` | `VALIDATION_ERROR` |
| Missing auth | `401` | `UNAUTHENTICATED` |
| Wrong org slug | `404` | `ORG_NOT_FOUND` |
| Disabled module | `403` | `MODULE_DISABLED` |
| Missing permission | `403` | `FORBIDDEN` |
| Record not found | `404` | `NOT_FOUND` |
| Conflict | `409` | `CONFLICT` |
| Unexpected error | `500` | `INTERNAL_ERROR` |

---

# 34. Type-Level Tests

Some SDK contracts should fail at TypeScript level.

Recommended tool later:

```txt
tsd
expect-type
or dedicated TypeScript compile fixtures
```

MVP may use ordinary `tsc --noEmit`, but type-level assertions should be added when the SDK grows.

Type-level contracts:

```txt
sdk.getDb('org_123') should not typecheck
module service without PlatformContext should not typecheck
client SDK should not expose getDb
client SDK should not expose permission enforcement
shared SDK should not expose server-only objects
event names may eventually be constrained by generated string unions
```

---

# 35. Lint-Level Architecture Tests

Testing alone is not enough.

The following must also be linted or checked:

```txt
modules cannot import @/kernel/*
modules cannot import other modules
client components cannot import @/sdk/server
modules cannot import raw Prisma
API routes cannot use requirePageAuth
no route reads orgId from body/query for tenant scope
no generated module route uses /api/[module]?orgId=
```

Minimum command:

```bash
npm run check:architecture
```

Recommended CI:

```bash
npm run lint
npm run check:architecture
npm run typecheck
npm run test:run
npm run build
```

---

# 36. Claude Implementation Rules

When Claude implements the SDK test suite, it must follow these rules:

```txt
Do not weaken tests to make implementation pass.
Do not mock away the boundary being tested.
Do not reintroduce sdk.getDb(orgId).
Do not import @/kernel/* from modules.
Do not create single-org tenant tests.
Do not make permission tests admin-only.
Do not use redirect-style auth in API tests.
Do not create placeholder tests that only assert functions exist.
Do not add FastAPI.
Do not add new test frameworks without approval.
```

Claude must stop and ask for architectural review if:

```txt
a manual document conflicts with another manual document
a test requires changing approved SDK surface
a helper seems impossible without weakening tenant isolation
Prisma behavior makes an approved rule hard to enforce
Next.js route behavior conflicts with API contract
```

---

# 37. Minimum SDK Test Suite for Restarted Build

Before Claude can consider the SDK foundation complete, these tests must exist and pass.

```txt
[ ] shared SDK exports only safe types/constants/errors
[ ] server SDK exports auth/context/permissions/db/events/api helpers
[ ] client SDK exports browser-safe helpers only
[ ] requireApiAuth returns 401 behavior, never redirect
[ ] requireApiOrgContext rejects wrong org
[ ] requireApiModuleContext rejects disabled module
[ ] permissions.can supports exact and wildcard grants
[ ] permissions.require throws 403 when missing
[ ] conditional permissions are denied in MVP
[ ] sdk.getDb(ctx) works
[ ] sdk.getDb(orgId) is unavailable
[ ] client-supplied orgId is rejected in API validation
[ ] API wrapper maps known errors correctly
[ ] event names are validated
[ ] events include orgId and actorUserId
[ ] generated module service test uses PlatformContext
[ ] generated module tenant-isolation test uses two orgs
[ ] generated module permission test covers deny path
[ ] architecture check blocks @/kernel imports from modules
```

---

# 38. Production Readiness Gate Tie-In

The SDK Testing Contract is required for the Production Readiness Gate.

The platform is not production-ready unless tests prove:

```txt
Unauthenticated API request returns 401 JSON.
Authenticated user from Org A cannot access Org B routes.
Authenticated user from Org A cannot read Org B API data.
Authenticated user from Org A cannot mutate Org B data.
User without permission receives 403 JSON.
Admin wildcard is org-scoped.
Client-supplied orgId is rejected.
Generated modules include tenant and permission tests.
```

---

# 39. Anti-Patterns

## 39.1 Tautological Tests

Bad:

```ts
it('injects deletedAt null', () => {
  const where = { orgId: 'org1' }
  if (!('deletedAt' in where)) {
    Object.assign(where, { deletedAt: null })
  }
  expect(where.deletedAt).toBeNull()
})
```

This only tests the test itself.

Better:

```ts
it('excludes soft-deleted products from normal product listing', async () => {
  await createProduct(ctx, { name: 'Active' })
  await createProduct(ctx, { name: 'Deleted', deletedAt: new Date() })

  const products = await ProductService.list(ctx)

  expect(products.map((p) => p.name)).toEqual(['Active'])
})
```

## 39.2 Always-Admin Tests

Bad:

```txt
All tests use Admin.
```

This hides permission bugs.

Every module must test admin, permitted staff, unpermitted staff, and wrong-org users.

## 39.3 Single-Tenant Tests

Bad:

```txt
Only one org exists in test data.
```

This cannot prove tenant isolation.

Every security-sensitive test suite needs at least two orgs.

## 39.4 Mocking Permission Success

Bad:

```ts
vi.mock('@/sdk/server', () => ({
  sdk: {
    permissions: {
      require: vi.fn().mockResolvedValue(undefined),
    },
  },
}))
```

This is acceptable only when the test is not about permissions.

For API and route tests, permission enforcement must be real or contract-tested through the route wrapper.

## 39.5 Testing Only Imports

Bad:

```ts
expect(sdk.getDb).toBeDefined()
```

This does not prove safe DB access.

---

# 40. Recommended Test Implementation Order

For the restarted build, implement SDK tests in this order:

```txt
1. SDK shared import safety tests
2. SDK server/client export tests
3. SDK error mapping tests
4. API wrapper tests
5. PlatformContext tests
6. Permission matching tests
7. Permission enforcement tests
8. Module enablement tests
9. DB access facade tests
10. Event envelope tests
11. Generated module contract tests
12. Architecture import checks
```

Reason:

```txt
API and context helpers depend on error shape.
Permissions depend on context.
DB access depends on context.
Generated module tests depend on SDK patterns.
```

---

# 41. Required Scripts

Add or reserve these scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:unit": "vitest run --config vitest.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:security": "vitest run \"**/*.security.test.ts\"",
    "check:architecture": "tsx scripts/check-architecture.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

MVP may not immediately implement separate configs, but the naming should be reserved.

---

# 42. Example Generated Module Test Pattern

Example for an Inventory Product API.

```ts
describe('Inventory Product API permissions', () => {
  it('allows permitted staff to create product', async () => {
    const { orgA, inventoryStaffA } = await createTwoOrgFixture()

    const response = await postAs(
      inventoryStaffA,
      `/api/orgs/${orgA.slug}/inventory/products`,
      {
        code: 'P001',
        name: 'Test Product',
        unit: 'pcs',
      }
    )

    await expectApiSuccess(response, { status: 201 })
  })

  it('rejects staff without create permission', async () => {
    const { orgA, staffA } = await createTwoOrgFixture()

    const response = await postAs(
      staffA,
      `/api/orgs/${orgA.slug}/inventory/products`,
      {
        code: 'P001',
        name: 'Test Product',
        unit: 'pcs',
      }
    )

    await expectApiError(response, {
      status: 403,
      code: 'FORBIDDEN',
    })
  })

  it('rejects cross-tenant create by guessed org slug', async () => {
    const { orgA, adminB } = await createTwoOrgFixture()

    const response = await postAs(
      adminB,
      `/api/orgs/${orgA.slug}/inventory/products`,
      {
        code: 'P001',
        name: 'Test Product',
        unit: 'pcs',
      }
    )

    await expectApiError(response, {
      status: 404,
      code: 'ORG_NOT_FOUND',
    })
  })

  it('rejects client-supplied orgId', async () => {
    const { orgA, orgB, adminA } = await createTwoOrgFixture()

    const response = await postAs(
      adminA,
      `/api/orgs/${orgA.slug}/inventory/products`,
      {
        orgId: orgB.id,
        code: 'P001',
        name: 'Test Product',
        unit: 'pcs',
      }
    )

    await expectApiError(response, {
      status: 400,
      code: 'VALIDATION_ERROR',
    })
  })
})
```

---

# 43. Example Service Test Pattern

```ts
describe('InventoryProductService.create()', () => {
  it('uses verified PlatformContext and emits object event', async () => {
    const ctx = await createTestPlatformContext({
      org: 'orgA',
      user: 'adminA',
      permissions: ['inventory.product.create'],
      enabledModules: ['inventory'],
    })

    const product = await InventoryProductService.create(ctx, {
      code: 'P001',
      name: 'Test Product',
      unit: 'pcs',
    })

    expect(product.orgId).toBe(ctx.orgId)

    await expectEventEmitted('objects.product.created', {
      orgId: ctx.orgId,
      actorUserId: ctx.userId,
      payload: {
        productId: product.id,
      },
    })
  })
})
```

---

# 44. Example Architecture Check

`scripts/check-architecture.ts` should eventually scan for forbidden patterns.

Minimum checks:

```txt
src/modules/** must not contain "@/kernel/"
src/modules/** must not contain "@/modules/" except same-module relative imports
src/modules/** must not contain "from '@prisma/client'"
src/modules/** must not contain "sdk.getDb(" followed by string or variable named orgId
src/app/api/** must not contain "requirePageAuth"
src/app/api/** must not read "orgId" from searchParams for tenant scoping
src/app/api/** must not destructure orgId from request body for tenant scoping
client components must not import "@/sdk/server"
```

This check is not a replacement for tests.

It is a fast architectural tripwire.

---

# 45. What Claude May Decide

Claude may decide:

```txt
exact test helper file names
exact fixture factory implementation
whether to use in-memory mocks or test DB for first unit tests
minor naming details for helper functions
Vitest describe/it organization
```

Claude may not decide:

```txt
to remove PlatformContext
to return to sdk.getDb(orgId)
to trust client orgId
to skip tenant tests
to skip permission denial tests
to expose server SDK to client code
to use FastAPI
to replace SDK API shape
to mock away the boundary being tested
```

---

# 46. Acceptance Criteria

This document is satisfied when:

```txt
[ ] SDK test directory exists.
[ ] Shared SDK import safety is tested or lint-enforced.
[ ] Server SDK exports are tested.
[ ] Client SDK exports are tested.
[ ] PlatformContext creation is tested.
[ ] API auth returns JSON 401 behavior in tests.
[ ] Wrong-org access returns safe 404 behavior in tests.
[ ] Permission matching is tested.
[ ] Permission enforcement denial is tested.
[ ] Disabled module access is tested.
[ ] sdk.getDb(ctx) is tested.
[ ] sdk.getDb(orgId) is impossible or test/lint-blocked.
[ ] API wrapper error mapping is tested.
[ ] Event envelope behavior is tested.
[ ] Generated module tests include tenant isolation.
[ ] Generated module tests include permission denial.
[ ] Architecture import checks run in CI.
[ ] No tests merely assert that SDK functions exist without proving behavior.
```

---

# 47. Founder Review Checklist

Before freezing this document, confirm:

```txt
[ ] Do we agree that SDK tests are architecture enforcement, not just correctness tests?
[ ] Do we agree that every generated module must include tenant-isolation tests?
[ ] Do we agree that every generated module must include permission-denial tests?
[ ] Do we agree that single-org tests are insufficient?
[ ] Do we agree that API routes must test 401/403/404 JSON behavior?
[ ] Do we agree that FastAPI remains excluded from the core platform?
[ ] Do we agree that test utilities may exist under '@/sdk/test-utils' but are not production SDK APIs?
[ ] Do we agree that check:architecture is required before production readiness?
```

---

# 48. Next Recommended Manual Document

After this document is approved, proceed to:

```txt
06-data/00-database-architecture.md
```

Reason:

The SDK now has its public surface, DB access contract, auth/permission contract, event contract, compatibility contract, and testing contract.

The next risk area is the underlying data model:

```txt
single PostgreSQL database
shared tables
org_id tenancy
Prisma conventions
soft delete
migration discipline
future RLS
backup/restore
```

The database architecture must be frozen before Claude restarts implementation.

