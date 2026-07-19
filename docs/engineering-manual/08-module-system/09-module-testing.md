# OneDayOS Engineering Manual — Module Testing

**Document ID:** `08-module-system/09-module-testing.md`  
**Version:** `1.0.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Architecture  
**Last Updated:** July 2026  
**Implementation Allowed:** No — not until marked `Frozen`  
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
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/03-module-folder-contract.md`
- `08-module-system/04-module-permissions.md`
- `08-module-system/06-module-events.md`
- `08-module-system/07-module-dependencies.md`

---

# 1. Purpose

This document defines the required testing standard for every OneDayOS business module.

A OneDayOS module is not considered real, safe, or production-ready just because:

```txt
the page renders
the CRUD works
the happy path passes
the build succeeds
```

A module is only production-ready when its tests prove that it respects the platform architecture:

```txt
tenant isolation
permission enforcement
module enablement
SDK-only access
Business Object reuse
soft delete
event emission
API contract
validated input
no client-supplied orgId
no direct module coupling
```

Module tests are not only quality assurance.

They are architecture enforcement.

---

# 2. Core Testing Principle

The central rule is:

```txt
A module test suite must prove that the module cannot escape the platform.
```

That means module tests must verify not only that authorized users can perform valid operations, but also that unauthorized users cannot.

The most important tests are often the negative tests:

```txt
wrong tenant denied
missing permission denied
module disabled denied
invalid input rejected
client-supplied orgId rejected
soft-deleted records hidden
cross-module direct access forbidden
```

A module without negative tests is not production-ready.

---

# 3. Why This Matters

OneDayOS is intended to serve many organizations from one platform and one shared database.

That means a module bug can become a platform-wide vulnerability.

If Inventory accidentally trusts `orgId` from the client, then a user from Client A may be able to create or read records under Client B.

If Leave checks permissions only in the UI, then someone can bypass the UI and call the API directly.

If CRM duplicates Customer instead of using the shared Customer Business Object, then future reporting, search, AI, and integrations become fragmented.

Therefore, every module test suite must defend the platform model.

---

# 4. Testing Scope

Every business module must include tests for:

```txt
manifest validity
service behavior
API behavior
tenant isolation
permission enforcement
module enablement
input validation
soft delete
event emission
Business Object usage
extension-table behavior
navigation metadata
settings behavior, if any
import/export behavior, if any
UI smoke behavior
generator output, if generated
```

Not every module needs deep UI tests in MVP, but every module needs security-sensitive service and API tests.

---

# 5. Required Test Locations

Every module must follow this structure:

```txt
src/modules/[module]/
  __tests__/
    manifest.test.ts
    permissions.test.ts
    service.test.ts
    events.test.ts
    tenant-isolation.test.ts
    validation.test.ts
    soft-delete.test.ts
    business-object-usage.test.ts

src/app/api/orgs/[orgSlug]/[moduleId]/...
  __tests__/
    route.test.ts

src/app/(platform)/[orgSlug]/[moduleId]/...
  __tests__/
    page.test.tsx
```

For MVP, route tests may live inside the module test folder if the test tooling makes App Router route tests awkward, but the test name must still clearly identify the API route being tested.

Acceptable MVP structure:

```txt
src/modules/inventory/__tests__/
  inventory-api-products-route.test.ts
```

Preferred long-term structure:

```txt
src/app/api/orgs/[orgSlug]/inventory/products/__tests__/route.test.ts
```

---

# 6. Test Categories

## 6.1 Manifest Tests

Every module manifest must have tests proving:

```txt
module id is URL-safe
module label exists
module version exists
compatibility window exists
lifecycle exists
permissions are full permission objects
navigation items point to valid module routes
API route declarations use /api/orgs/[orgSlug]/[moduleId]/...
events follow naming convention
Business Object usage is declared
module-owned entities are declared
manifest does not contain executable business logic
manifest does not import @/kernel/*
manifest does not import @/sdk/server
manifest does not import Prisma
manifest does not self-register as a side effect
```

Example:

```ts
import { describe, expect, it } from 'vitest'
import { inventoryManifest } from '../manifest'

describe('inventory manifest', () => {
  it('uses a URL-safe module id', () => {
    expect(inventoryManifest.id).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  it('declares full permission objects', () => {
    expect(inventoryManifest.permissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module: 'inventory',
          resource: expect.any(String),
          action: expect.any(String),
        }),
      ])
    )
  })

  it('does not declare wildcard permissions', () => {
    for (const permission of inventoryManifest.permissions) {
      expect(permission.module).not.toBe('*')
      expect(permission.resource).not.toBe('*')
      expect(permission.action).not.toBe('*')
    }
  })

  it('declares tenant-scoped API routes', () => {
    for (const api of inventoryManifest.api ?? []) {
      expect(api.path).toMatch(/^\/api\/orgs\/\[orgSlug\]\/inventory/)
    }
  })
})
```

---

## 6.2 Permission Tests

Every module must test at least:

```txt
admin with permission can perform operation
staff with permission can perform operation
authenticated user without permission receives 403
user from another organization receives safe 404 or tenant denial
disabled module denies access regardless of permission
UI-hidden action is still denied at API/service level
```

Permission tests must not rely only on Admin users.

An all-admin test suite hides real authorization bugs.

Bad:

```txt
all tests use admin with *.*.*
```

Good:

```txt
admin user
staff user with read only
staff user with create only
staff user with no module permissions
user from another organization
```

---

## 6.3 Tenant Isolation Tests

Every tenant-sensitive module test suite must use at least two organizations.

Minimum fixture set:

```txt
orgA
orgB

orgAAdmin
orgAStaffWithPermission
orgAStaffWithoutPermission
orgBAdmin

orgARecords
orgBRecords
```

Every module must prove:

```txt
orgA users cannot read orgB module records
orgA users cannot mutate orgB module records
orgA users cannot soft-delete orgB module records
orgA users cannot restore orgB module records
orgA users cannot attach orgB Business Objects to orgA module records
orgA users cannot use orgB IDs in payloads to create cross-tenant relations
```

This is mandatory.

A single-organization test suite is not acceptable for OneDayOS modules.

---

## 6.4 Module Enablement Tests

Every module must test module enablement separately from permission.

Required cases:

```txt
module enabled + permission granted → allowed
module enabled + permission missing → 403
module disabled + permission granted → 404 MODULE_NOT_FOUND or module-disabled denial
module disabled + admin wildcard → still denied
module not registered → safe 404
module dependency missing → enablement/provisioning denied
```

Important rule:

```txt
Admin wildcard permissions do not bypass module enablement.
```

Example:

```ts
it('denies access when module is disabled even for admin', async () => {
  const ctx = await createTestPlatformContext({
    org: 'org-a',
    user: 'admin',
    permissions: ['*.*.*'],
    enabledModules: [],
  })

  await expect(InventoryService.listStockLevels(ctx)).rejects.toMatchObject({
    code: 'MODULE_NOT_FOUND',
  })
})
```

---

## 6.5 API Route Tests

Every protected module API route must test:

```txt
401 unauthenticated
404 wrong organization slug / inaccessible org
404 module disabled
403 missing permission
400 validation error
400 client-supplied orgId rejected
200/201 success
404 not found for records outside tenant
soft-deleted records hidden
response shape always { data, error, meta? }
no redirects
no HTML auth responses
```

Example API response assertion:

```ts
expect(response.status).toBe(403)

await expect(response.json()).resolves.toEqual({
  data: null,
  error: {
    code: 'FORBIDDEN',
    message: expect.any(String),
  },
})
```

Forbidden API behavior:

```txt
redirect('/login')
NextResponse.redirect(...)
HTML login page returned from API
unhandled thrown Prisma errors
raw Zod error object leaked
stack trace leaked
```

---

## 6.6 Service Tests

Every module service must test business behavior and security behavior.

Required service tests:

```txt
service receives PlatformContext
service rejects missing or invalid context
service enforces required permission
service uses sdk.getDb(ctx)
service does not accept orgId as an argument
service validates cross-tenant related IDs
service excludes soft-deleted records
service emits required events after successful mutation
service does not emit events after failed mutation
service uses transactions when mutating multiple tables
```

Preferred service method shape:

```ts
InventoryService.createStockAdjustment(ctx, input)
```

Forbidden service method shapes:

```ts
InventoryService.createStockAdjustment(orgId, input)
InventoryService.createStockAdjustment(userId, orgId, input)
InventoryService.createStockAdjustment(inputWithOrgId)
```

Service tests should prove that the public service methods cannot be used unsafely.

---

## 6.7 Validation Tests

Every module schema must test:

```txt
valid input passes
required fields fail when missing
invalid enum values fail
unknown keys fail
client-supplied orgId fails
client-supplied userId fails when server-derived
client-supplied deletedAt fails
client-supplied deletedBy fails
client-supplied approval/status fields fail when server-controlled
cross-tenant relation IDs are rejected by service checks
```

Zod schemas used for API bodies should use strict objects unless there is a specific ADR-approved reason not to.

Example:

```ts
it('rejects client-supplied orgId', () => {
  const result = CreateInventoryAdjustmentSchema.safeParse({
    orgId: 'org-b',
    productId: 'prod-a',
    quantity: 10,
    reason: 'count correction',
  })

  expect(result.success).toBe(false)
})
```

---

## 6.8 Soft Delete Tests

Every module-owned entity that represents business data must use soft delete.

Required tests:

```txt
delete sets deletedAt and deletedBy
delete does not hard-delete record
normal list excludes deleted records
normal detail excludes deleted records
normal update cannot update deleted records
normal delete is idempotent or returns safe not found
restore clears deletedAt and deletedBy
restore requires restore/admin permission
deleted records do not appear in search/export/reporting by default
historical records remain referentially intact
```

Forbidden test shortcuts:

```txt
mocking delete as array.filter only
testing soft delete without database shape
testing only the happy-path delete response
```

---

## 6.9 Event Tests

Every module mutation that should emit an event must test:

```txt
correct event name
correct namespace
correct past-tense verb
event emitted only after successful mutation
event not emitted after failed validation
event not emitted after failed permission check
event payload excludes orgId
event payload excludes full Prisma records
event payload contains stable IDs and changed fields
listener failure does not break original mutation
```

Example:

```ts
expect(sdk.events.emit).toHaveBeenCalledWith(
  ctx,
  'inventory.stock_adjustment.created',
  expect.objectContaining({
    stockAdjustmentId: expect.any(String),
  })
)
```

Forbidden event examples:

```txt
inventory.product.created
```

if Product is a Business Object.

Correct examples:

```txt
objects.product.created
inventory.stock_adjustment.created
inventory.stock_level.reorder_threshold_crossed
```

---

## 6.10 Business Object Usage Tests

Every module that references Business Objects must test that it does not duplicate them.

For example, Inventory must test:

```txt
Inventory references Product
Inventory does not create an InventoryProduct as duplicate Product identity
Inventory references Warehouse
Inventory does not create InventoryWarehouse as duplicate Warehouse identity
Inventory extension table links to Product with orgId
cross-tenant Product IDs are rejected
soft-deleted Products cannot be used in new Inventory records
inactive Products are handled according to business rules
```

Leave must test:

```txt
Leave references Employee
Leave does not create LeaveEmployee as duplicate Employee identity
cross-tenant Employee IDs are rejected
soft-deleted Employees cannot create new leave requests
inactive/resigned Employees follow module business rules
```

CRM must test:

```txt
CRM references Customer
CRM does not create CRMCustomer as duplicate Customer identity
CRM-specific fields live in CRM extension tables
```

---

## 6.11 Extension Table Tests

When a module extends a Business Object, it must test:

```txt
extension row includes orgId
extension row references Business Object with tenant-safe relation
extension create requires Business Object permission if creating the Business Object
extension create requires module permission for module-specific fields
extension update does not mutate core Business Object fields unless explicitly intended
extension delete does not delete the core Business Object
extension soft delete does not remove the Business Object
cross-tenant Business Object references are rejected
```

Example:

```txt
Product
  id
  orgId
  code
  name

InventoryProductExtension
  productId
  orgId
  reorderPoint
  minimumStock
```

Test required:

```txt
orgA cannot create InventoryProductExtension using orgB productId
```

---

## 6.12 Navigation Tests

Every module must test its navigation metadata.

Required tests:

```txt
nav items are declared in manifest
nav hrefs are org-shell-relative
nav hrefs do not include hard-coded org slugs
nav items declare required permissions
nav hidden when module disabled
nav hidden when user lacks permission
nav visible when module enabled and user has permission
active route matching is segment-safe
```

Forbidden nav hrefs:

```txt
/acme/inventory
/[orgSlug]/inventory
https://...
```

Correct nav href:

```txt
/inventory
/inventory/stock-levels
```

---

## 6.13 UI Smoke Tests

Every module should have at least lightweight UI tests for:

```txt
list page renders title
empty state renders
loading state renders if applicable
permission-denied state renders
create form renders required fields
form validation messages appear
primary action is disabled during submission
```

MVP does not require exhaustive browser automation for every module, but a module with no UI tests is incomplete.

Recommended future tool:

```txt
Playwright
```

MVP acceptable:

```txt
Vitest + Testing Library component smoke tests
```

---

## 6.14 Import / Export Tests

If a module supports import/export, it must test:

```txt
import requires import permission
export requires export permission
import validates every row
import rejects orgId columns or ignores only through approved mapping
import cannot connect rows to another tenant's Business Objects
export returns only current tenant records
export excludes soft-deleted records by default
export respects permission filters
import emits events for created/updated records
failed import produces row-level errors
```

Import/export should not be implemented casually in early MVP modules unless truly needed.

---

## 6.15 Settings Tests

If a module has settings, it must test:

```txt
settings schema validates values
settings are org-scoped
settings are module-scoped
settings cannot be read across tenants
settings update requires settings permission
invalid settings fail with VALIDATION_ERROR
settings defaults are applied when no org setting exists
```

Settings keys are compatibility contracts.

Renaming settings keys requires a migration or compatibility adapter.

---

## 6.16 Module Dependency Tests

If a module declares dependencies, it must test:

```txt
required dependency missing prevents enablement
optional dependency missing does not break base module
disabling required dependency is blocked while dependent module is enabled
dependency does not permit direct imports
dependency does not grant permissions
dependency data is not accessed through another module service
```

Example:

```txt
Purchasing may depend on Inventory for receiving workflows.
Purchasing still must not import InventoryService.
```

---

# 7. Required Fixtures

Module tests should share a standard fixture vocabulary.

Minimum fixture set:

```ts
type TestOrgFixture = {
  orgA: TestOrganization
  orgB: TestOrganization

  orgAAdmin: TestUser
  orgAStaffWithRead: TestUser
  orgAStaffWithCreate: TestUser
  orgAStaffWithoutPermission: TestUser

  orgBAdmin: TestUser
}
```

For modules using Business Objects:

```ts
type InventoryFixture = TestOrgFixture & {
  orgAProduct: TestProduct
  orgBProduct: TestProduct
  orgAWarehouse: TestWarehouse
  orgBWarehouse: TestWarehouse
}
```

Fixtures must make cross-tenant mistakes easy to test.

Bad fixture design:

```txt
one organization
one admin
one record
```

Good fixture design:

```txt
two organizations
multiple users
different roles
records with same-looking names in both tenants
```

Example:

```txt
orgA product: "Rice"
orgB product: "Rice"
```

This catches accidental name-based or unscoped queries.

---

# 8. Mocking Rules

Mocking is allowed, but it must not hide architecture violations.

## 8.1 What May Be Mocked

Acceptable mocks:

```txt
email delivery
external APIs
file storage
AI providers
time/date helpers
event listeners when testing emitter
Supabase auth at boundary tests
```

## 8.2 What Should Not Be Over-Mocked

Avoid over-mocking:

```txt
permission checks
tenant context creation
database access patterns
soft-delete behavior
Business Object relations
validation behavior
```

If everything is mocked, the test proves nothing.

---

# 9. Architecture Check Tests

Each module must pass architecture checks that prove forbidden imports and patterns do not exist.

Forbidden module imports:

```txt
@/kernel/*
../other-module/*
@/modules/[other-module]/*
@prisma/client
@/kernel/db/client
```

Allowed module imports:

```txt
@/sdk
@/sdk/server
@/sdk/client
@/components/*
@/lib/*
module-local files
```

Important distinction:

```txt
@/sdk/server is allowed only in server-only module files.
@/sdk/client is allowed in browser/client files.
@/sdk is shared-safe types/constants only.
```

Client files must not import:

```txt
@/sdk/server
@/kernel/*
@prisma/client
server-only module services
```

Architecture checks should also scan for forbidden strings:

```txt
orgId: input.orgId
body.orgId
searchParams.get('orgId')
sdk.getDb(orgId)
findUnique({ where: { id } })
delete({ where:
deleteMany({ where:
import { prisma }
```

Some of these patterns may be valid in rare Kernel/Data files, but not inside business modules.

---

# 10. Generated Module Testing Requirements

The module generator must create tests by default.

A generated module must include:

```txt
manifest.test.ts
permissions.test.ts
service.test.ts
api-route.test.ts
tenant-isolation.test.ts
validation.test.ts
events.test.ts
soft-delete.test.ts
architecture.test.ts
```

Generated tests must not be placeholders that always pass.

Bad generated test:

```ts
it('works', () => {
  expect(true).toBe(true)
})
```

Bad generated test:

```ts
it('returns an array', async () => {
  expect(Array.isArray(await Service.list(ctx))).toBe(true)
})
```

Better generated test:

```ts
it('does not return records from another organization', async () => {
  const fixture = await createTwoOrgFixture()
  const records = await InventoryService.list(fixture.orgACtx)

  expect(records.map((record) => record.orgId)).toEqual([fixture.orgA.id])
  expect(records).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ orgId: fixture.orgB.id }),
    ])
  )
})
```

Generated tests should force Claude to fill in real implementation safely.

---

# 11. Test Naming Standards

Test names should describe behavior, not implementation.

Good:

```txt
denies stock adjustment creation when user lacks inventory.stock_adjustment.create
rejects client-supplied orgId in create product extension payload
does not return stock movements from another organization
emits inventory.stock_adjustment.created after successful create
does not emit event when validation fails
```

Bad:

```txt
works
creates
returns data
calls function
renders
```

---

# 12. Minimum Required Tests Before Module Can Ship

A module cannot be marked production-ready unless the following checklist passes:

```txt
[ ] manifest validity tests
[ ] permission allow tests
[ ] permission denial tests
[ ] module-disabled tests
[ ] tenant isolation read tests
[ ] tenant isolation write tests
[ ] validation tests
[ ] client-supplied orgId rejection test
[ ] service tests with PlatformContext
[ ] API 401 tests
[ ] API 403 tests
[ ] API 404 tenant-safe tests
[ ] API validation-error tests
[ ] soft-delete tests
[ ] event emission tests
[ ] event non-emission on failure tests
[ ] Business Object reference tests, if applicable
[ ] extension-table tests, if applicable
[ ] navigation visibility tests
[ ] forbidden import / architecture checks
[ ] build passes
[ ] typecheck passes
[ ] lint passes
```

---

# 13. Module Testing and Platform Services

Module tests are also evidence for future Platform Services.

If three independent modules contain similar test patterns, that is evidence for the Three Independent Use Cases Rule.

Examples:

```txt
Leave approval tests
Purchasing approval tests
Expense approval tests
```

If these become nearly identical, that is evidence for:

```txt
Approval Engine
```

Another example:

```txt
Incident attachment tests
Expense receipt attachment tests
Asset document attachment tests
```

This is evidence for:

```txt
Attachment Service
```

Therefore, module tests should be written clearly enough that repeated patterns are visible.

Do not prematurely extract Platform Services, but do not hide repetition either.

---

# 14. CI Requirements

Module test suites must run in CI.

Minimum CI checks before merging module code:

```bash
npm run check:architecture
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Recommended package scripts:

```json
{
  "scripts": {
    "check:architecture": "tsx scripts/check-architecture.ts",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "build": "next build"
  }
}
```

If a module touches Prisma schema:

```bash
npx prisma generate
npx prisma migrate diff
```

or the project-approved equivalent should be part of review.

---

# 15. Testing Database Strategy

MVP may use one of these strategies:

```txt
mocked repository tests for pure service logic
transaction-isolated test database
dedicated Supabase local database
ephemeral Postgres in CI
```

But security-sensitive module behavior should eventually be tested against a real PostgreSQL database because tenancy, uniqueness, relations, and soft delete are database-sensitive.

Priority:

```txt
Phase 1:
  meaningful unit/service/API tests with strong fixtures

Phase 1.5:
  integration tests against real Postgres for Kernel + SDK + first module

Phase 2:
  CI database test environment
```

Do not let lack of perfect infrastructure justify weak tests.

---

# 16. API Test Context Helpers

The test framework should provide helpers like:

```ts
createApiRequest({
  method: 'POST',
  path: '/api/orgs/acme/inventory/stock-adjustments',
  user: orgAStaffWithCreate,
  body: {
    productId: orgAProduct.id,
    quantity: 10,
  },
})
```

And:

```ts
expectApiError(response, {
  status: 403,
  code: 'FORBIDDEN',
})
```

This makes security tests easy to write and hard to skip.

---

# 17. PlatformContext Test Helpers

Test helpers should create verified test contexts.

Example:

```ts
const ctx = await createTestPlatformContext({
  org: orgA,
  user: orgAStaffWithCreate,
  enabledModules: ['inventory'],
  permissions: [
    {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    },
  ],
})
```

Tests should not manually fake context in a way that bypasses Kernel behavior unless the test is specifically unit-testing a pure function.

Bad:

```ts
const ctx = { orgId: 'org-a' } as any
```

Good:

```ts
const ctx = await createVerifiedTestContext(...)
```

---

# 18. Error Testing Standards

Tests must assert stable error codes, not only status codes.

Required examples:

```txt
UNAUTHENTICATED
ORG_NOT_FOUND
MODULE_NOT_FOUND
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
CONFLICT
SOFT_DELETED
```

Example:

```ts
expect(await response.json()).toMatchObject({
  data: null,
  error: {
    code: 'FORBIDDEN',
  },
})
```

Do not test only:

```ts
expect(response.status).toBe(403)
```

The JSON error contract matters because the frontend, AI layer, support tooling, and generated clients will depend on it.

---

# 19. Performance Testing Baseline

MVP modules do not need heavy load tests, but they must avoid obvious performance mistakes.

Required service test/review checks:

```txt
list endpoints include pagination or intentional MVP limit
list endpoints do not fetch all records unbounded
list endpoints select only needed fields where practical
search/filter inputs are validated
no N+1 query pattern in obvious paths
indexes exist for common tenant-scoped lookups
```

For MVP, a module list route may use a safe default limit:

```txt
limit = 50
maxLimit = 100
```

Generated modules should not create unbounded `findMany()` list APIs.

---

# 20. Security Regression Tests

Every time a security issue is found in a module, a regression test must be added.

Examples:

```txt
Bug: user can create record using another tenant's productId
Test: rejects productId from another organization

Bug: delete route accepts record id only and deletes cross-tenant record
Test: orgA cannot delete orgB record with known id

Bug: disabled module route still loads through direct URL
Test: disabled module route returns MODULE_NOT_FOUND

Bug: UI hides button but API still allows operation
Test: API returns FORBIDDEN for missing permission
```

No security fix is complete without a test.

---

# 21. What Claude Code May Do

Claude may:

```txt
write module tests following this document
create test fixtures
create test helpers
update generated module templates to include required tests
add missing permission-denial tests
add tenant-isolation tests
add validation tests
add event tests
add architecture checks
```

Claude may not:

```txt
remove negative tests to make builds pass
replace real tests with tautologies
mock away tenant isolation
mock away permissions
skip API tests because service tests pass
introduce loose orgId arguments
use raw Prisma inside modules
import @/kernel/* inside modules
import one module from another
create test-only architecture that differs from production architecture
```

If the manual and current code disagree, Claude must stop and report the discrepancy.

---

# 22. Forbidden Patterns

These patterns are forbidden in module code and should be caught by tests, lint rules, or architecture checks:

```ts
// Loose tenant identity
Service.list(orgId)
Service.create({ orgId, ...input })
sdk.getDb(orgId)

// Client-supplied tenant identity
body.orgId
input.orgId
request.nextUrl.searchParams.get('orgId')

// Raw Prisma inside module
import { prisma } from '@/kernel/db/client'
import { PrismaClient } from '@prisma/client'

// Direct Kernel import
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'

// Direct module coupling
import { InventoryService } from '@/modules/inventory/service'

// Unsafe tenant-scoped lookup
db.product.findUnique({ where: { id } })

// Hard delete business data
db.stockMovement.delete({ where: { id } })
db.stockMovement.deleteMany(...)

// API redirect
redirect('/login')
NextResponse.redirect('/login')
```

---

# 23. Required Generated Test Skeleton

The module generator should emit a test skeleton similar to this:

```ts
describe('[ModuleName] security contract', () => {
  it('requires authentication', async () => {
    // API returns 401 JSON
  })

  it('requires tenant membership', async () => {
    // Org A user cannot access Org B slug
  })

  it('requires module enablement', async () => {
    // Module disabled returns MODULE_NOT_FOUND
  })

  it('requires permission', async () => {
    // Missing permission returns FORBIDDEN
  })

  it('rejects client-supplied orgId', async () => {
    // Unknown key fails validation
  })

  it('does not return records from another organization', async () => {
    // Two-org fixture
  })

  it('soft deletes instead of hard deletes', async () => {
    // deletedAt/deletedBy set
  })

  it('emits event after successful mutation', async () => {
    // event name + payload checked
  })
})
```

The generator should not create fake placeholder tests that future Claude can ignore.

---

# 24. Production Readiness Gate for Modules

A module may be enabled for a real client only when:

```txt
[ ] all required module tests pass
[ ] tenant isolation tests use two organizations
[ ] permission tests include non-admin users
[ ] API tests prove JSON errors
[ ] no API redirects
[ ] no loose orgId arguments
[ ] no client-supplied orgId accepted
[ ] no raw Prisma in module code
[ ] no @/kernel imports in module code
[ ] no direct module imports
[ ] no duplicated Business Objects
[ ] soft delete is implemented where required
[ ] module events are documented and tested
[ ] generated module template includes the same guardrails
```

A module may be demoed internally before this gate, but it must not be sold or enabled for client production use.

---

# 25. Architectural Decision

OneDayOS will treat module tests as part of the module contract.

Therefore:

```txt
A module without tests is not a module.
It is a prototype.
```

Claude must not implement business modules without generating tests.

The module generator must not generate business code without generating tests.

The platform must not enable client modules that fail tenant, permission, and API-contract tests.

---

# 26. Deferred Testing Improvements

The following are deferred but expected later:

```txt
Playwright end-to-end tests
visual regression tests
load tests
full Supabase local integration test environment
database-per-test transaction isolation
mutation testing
contract tests for generated API clients
accessibility automation
```

These are useful, but they should not block the restarted MVP if the required service/API/security tests are already strong.

---

# 27. Acceptance Criteria

This document is ready to freeze when:

```txt
[ ] It defines required module test categories.
[ ] It requires two-organization tenant tests.
[ ] It requires non-admin permission-denial tests.
[ ] It requires module-disabled tests.
[ ] It requires API JSON error tests.
[ ] It requires client-supplied orgId rejection tests.
[ ] It requires soft-delete tests.
[ ] It requires event emission tests.
[ ] It requires Business Object usage tests.
[ ] It requires extension-table tests.
[ ] It requires generated module tests.
[ ] It forbids tautological tests.
[ ] It forbids mocking away security.
[ ] It defines Claude implementation boundaries.
[ ] It aligns with PlatformContext, SDK-only access, and shared database tenancy.
```

---

# 28. Founder Review Checklist

Before approving this document, confirm:

```txt
[ ] Do we agree every module must test tenant isolation with two organizations?
[ ] Do we agree every module must test permission denial with non-admin users?
[ ] Do we agree disabled modules should be denied even for Admin wildcard users?
[ ] Do we agree generated modules must include security tests by default?
[ ] Do we agree a module without tests is only a prototype?
[ ] Do we agree UI hiding is not security?
[ ] Do we agree services must be tested with PlatformContext, not orgId?
[ ] Do we agree direct module imports must be blocked by architecture tests?
```

If approved, the next document should be:

```txt
09-cli-generators/00-generator-philosophy.md
```

---

# ADR-0011 UX Testing Amendment

Official module tests must eventually include UX conformance coverage:

```txt
[ ] Module UX Contract completeness.
[ ] Process Flow page content.
[ ] Shared Business Object ownership presentation.
[ ] Persistent app shell usage.
[ ] Contextual loading, empty, error, permission, and unavailable states.
[ ] Absence of fake dashboard metrics and fake charts.
[ ] Tenant-safe forms with no hidden orgId.
[ ] Keyboard path for the critical workflow.
[ ] Accessibility structure tests when approved tooling exists.
[ ] Manual task-based review evidence.
```

These requirements complement service, API, tenant, permission, event, and architecture tests. They do not reduce the security testing requirements in this document.
