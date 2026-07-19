# OneDayOS Engineering Manual — 14 Testing & Quality / 02 Integration Testing

**Document ID:** `14-testing-quality/02-integration-testing.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Restarted Foundation Build  
**Owner:** Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `00-meta/04-definition-of-done.md`
- `02-architecture/00-system-architecture.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `13-security/07-security-testing.md`
- `14-testing-quality/00-testing-philosophy.md`
- `14-testing-quality/01-unit-testing.md`

---

# 1. Purpose

This document defines how OneDayOS uses **integration tests** to prove that platform pieces work together correctly.

Unit tests prove isolated behavior.

Integration tests prove that real platform boundaries work together:

```txt
Prisma schema
+ PostgreSQL behavior
+ SDK database access
+ PlatformContext
+ tenant isolation
+ permissions
+ services
+ events
+ soft delete
+ module enablement
+ validation
```

Integration tests are mandatory because OneDayOS is a multi-tenant platform. A function can pass unit tests and still leak data across organizations if the real database query is wrong.

The core rule is:

```txt
Integration tests prove that OneDayOS works as a platform,
not just as a collection of functions.
```

---

# 2. Why Integration Tests Matter for OneDayOS

The previous MVP already showed why integration tests are necessary.

The old implementation had tests, but several serious risks remained:

```txt
org membership check incomplete
sdk.permissions.can() existed but was not enforced
API auth helper returned redirects instead of JSON 401
some tests were tautological
soft-delete coverage could be bypassed
module generator could create unsafe patterns
live migration and seed were not verified against PostgreSQL
```

Those are not problems that simple unit tests reliably catch.

OneDayOS needs integration tests because the dangerous bugs happen **between layers**:

```txt
Route finds org by slug
but does not verify user belongs to org

API validates body
but accepts client-supplied orgId

Service receives orgId
but nobody proves it came from PlatformContext

Permission helper works
but service never calls it

Soft-delete helper works for findMany
but deleted record appears through findUnique

Module is disabled
but API route still returns data
```

Integration tests exist to catch those failures before clients are onboarded.

---

# 3. Definition

An integration test is a test that exercises at least two real OneDayOS layers together.

Examples:

```txt
service + real PostgreSQL
SDK auth/context helper + Prisma user/org records
permission enforcement + service mutation
module enablement + API behavior
soft delete + real database query
event emission + service transaction
module generator output + typecheck/test run
```

Integration tests should use as much real platform behavior as practical while still staying fast enough for regular development.

---

# 4. What Integration Tests Are Not

Integration tests are not:

```txt
unit tests with more mocks
browser end-to-end tests
manual QA
production smoke tests
load tests
visual regression tests
security penetration tests
```

They may support security, but they do not replace the full security test suite.

They may exercise APIs, but detailed API response-matrix testing is covered by `14-testing-quality/03-api-testing.md`.

They may exercise UI server components, but browser-level flows are covered by future UI/E2E testing documents.

---

# 5. Required Test Environment

## 5.1 Dedicated Test Database

Integration tests must never use production.

Integration tests must use one of these:

```txt
Preferred local development:
  local PostgreSQL / local Supabase stack

Preferred CI:
  disposable PostgreSQL service/database

Allowed for staging verification:
  dedicated staging database with disposable test orgs
```

Forbidden:

```txt
production DATABASE_URL
production Supabase project
production service role key
client organization data
shared developer database without isolation
```

---

## 5.2 Environment Variables

Use explicit test variables:

```txt
TEST_DATABASE_URL
TEST_DIRECT_URL
TEST_SUPABASE_URL              optional for auth/storage integration tests
TEST_SUPABASE_ANON_KEY         optional
TEST_SUPABASE_SERVICE_ROLE_KEY optional and local/staging-only
```

Do not let tests fall back silently to production variables.

Bad:

```ts
const databaseUrl = process.env.DATABASE_URL
```

Better:

```ts
const databaseUrl = process.env.TEST_DATABASE_URL
if (!databaseUrl) {
  throw new Error('TEST_DATABASE_URL is required for integration tests')
}
```

Best:

```ts
assertSafeTestDatabaseUrl(process.env.TEST_DATABASE_URL)
```

The helper should reject URLs that look like production.

---

## 5.3 Production URL Safety Check

OneDayOS should include a helper like:

```ts
export function assertSafeTestDatabaseUrl(url?: string): string {
  if (!url) throw new Error('TEST_DATABASE_URL is required')

  const lower = url.toLowerCase()

  if (lower.includes('prod') || lower.includes('production')) {
    throw new Error('Refusing to run integration tests against production database')
  }

  if (!lower.includes('test') && !lower.includes('local')) {
    throw new Error('TEST_DATABASE_URL must clearly identify a test/local database')
  }

  return url
}
```

This is intentionally conservative.

False positives are acceptable.

Accidental production test runs are not.

---

# 6. Recommended Test Stack

For the restarted build:

```txt
Vitest for integration test runner
Prisma Client for database access
Real PostgreSQL for database-backed tests
Supabase local stack only where Supabase Auth or Storage behavior must be proven
React Testing Library for component integration where needed
```

Do not add a second backend test stack.

Forbidden for core integration tests:

```txt
FastAPI test client
Pytest
SQLAlchemy fixtures
Alembic test migrations
Python worker tests
```

FastAPI remains excluded from the core platform.

---

# 7. Test File Naming

Use explicit integration test names:

```txt
*.integration.test.ts
*.integration.test.tsx
```

Examples:

```txt
src/kernel/auth/__tests__/context.integration.test.ts
src/kernel/permissions/__tests__/permissions.integration.test.ts
src/modules/inventory/__tests__/service.integration.test.ts
src/business-objects/product/__tests__/service.integration.test.ts
```

Do not hide database-backed tests inside normal unit test files.

---

# 8. Recommended Scripts

Use separate test commands:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --exclude '**/*.integration.test.*'",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:run": "npm run test:unit && npm run test:integration"
  }
}
```

The exact script names may change, but the separation must remain clear.

---

# 9. Integration Test Configuration

Create a dedicated config:

```txt
vitest.integration.config.ts
```

It should:

```txt
use Node environment by default
load test environment variables
include only *.integration.test.*
use setup file for test database safety checks
run with controlled concurrency if database state is shared
```

Example shape:

```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['./vitest.integration.setup.ts'],
    pool: 'forks',
    fileParallelism: false,
  },
})
```

The exact configuration can evolve, but integration tests must remain isolated from production and should not race against shared database state.

---

# 10. Test Database Lifecycle

## 10.1 Local Developer Flow

Recommended local flow:

```bash
npm run db:test:reset
npm run test:integration
```

Where `db:test:reset` should:

```txt
verify TEST_DATABASE_URL is safe
apply Prisma migrations to test database
clear test data
seed baseline test fixtures if needed
```

---

## 10.2 CI Flow

Recommended CI flow:

```txt
1. Start disposable PostgreSQL service
2. Set TEST_DATABASE_URL
3. Run prisma migrate deploy against test DB
4. Run test fixture seed
5. Run npm run test:integration
6. Destroy disposable database
```

CI must not use the production Supabase database.

---

## 10.3 Reset Strategy

Preferred reset strategy:

```txt
fresh disposable database per CI run
```

Allowed local reset strategy:

```txt
truncate tenant-scoped test tables
re-run fixture seed
```

Avoid relying on test order.

Avoid tests that pass only because another test created data first.

---

# 11. Test Fixtures

Integration tests need realistic fixtures.

At minimum, every tenant-sensitive integration test suite must include:

```txt
Organization A
Organization B
Admin user in Organization A
Staff user in Organization A
Unauthorized user in Organization A
Admin user in Organization B
Role with permission
Role without permission
At least one enabled module
At least one disabled module
At least one soft-deletable record
```

The fixture system should expose helpers like:

```ts
createTestOrg()
createTestUser({ orgId })
createTestRole({ orgId })
grantPermission({ roleId, module, resource, action })
assignRole({ userId, roleId })
enableModule({ orgId, moduleId })
disableModule({ orgId, moduleId })
createPlatformContext({ userId, orgSlug })
```

Fixtures should create real database rows.

---

# 12. PlatformContext Integration Tests

The most important integration tests are for `PlatformContext` creation.

Required scenarios:

```txt
authenticated user in correct org gets PlatformContext
unauthenticated request fails
user without Prisma User row fails
wrong orgSlug fails safely
inactive user fails
inactive organization fails according to org status rules
suspended organization blocks module access
module disabled blocks module context
module enabled allows module context
```

Example:

```ts
describe('requireApiOrgContext()', () => {
  it('returns PlatformContext when user belongs to org', async () => {
    const org = await fixtures.createOrg({ slug: 'alpha' })
    const user = await fixtures.createUser({ orgId: org.id })

    const ctx = await testContextFactory.requireApiOrgContext({
      authUserId: user.id,
      orgSlug: 'alpha',
    })

    expect(ctx.org.id).toBe(org.id)
    expect(ctx.user.id).toBe(user.id)
  })

  it('fails safely when user tries another org slug', async () => {
    const orgA = await fixtures.createOrg({ slug: 'alpha' })
    const orgB = await fixtures.createOrg({ slug: 'beta' })
    const userA = await fixtures.createUser({ orgId: orgA.id })

    await expect(
      testContextFactory.requireApiOrgContext({
        authUserId: userA.id,
        orgSlug: orgB.slug,
      })
    ).rejects.toMatchObject({ code: 'ORG_NOT_FOUND' })
  })
})
```

This is mandatory before onboarding a second tenant.

---

# 13. Tenant Isolation Integration Tests

Every tenant-scoped service must prove that Org A cannot read or mutate Org B data.

Required scenarios:

```txt
Org A list does not return Org B records
Org A read cannot access Org B record by ID
Org A update cannot modify Org B record
Org A delete cannot soft-delete Org B record
Org A restore cannot restore Org B record
Org A relation lookup cannot attach Org B relation
client-supplied orgId is rejected before service call
```

Example:

```ts
it('does not return records from another organization', async () => {
  const { ctx: ctxA, org: orgA } = await fixtures.createOrgAdminContext()
  const { org: orgB } = await fixtures.createOrgAdminContext()

  await ProductService.create(ctxA, { code: 'A-001', name: 'Org A Product', unit: 'pcs' })

  await fixtures.db.product.create({
    data: {
      orgId: orgB.id,
      code: 'B-001',
      name: 'Org B Product',
      unit: 'pcs',
    },
  })

  const products = await ProductService.list(ctxA)

  expect(products).toHaveLength(1)
  expect(products[0].code).toBe('A-001')
  expect(products.some((p) => p.code === 'B-001')).toBe(false)
})
```

Do not mark tenant isolation complete without two-org tests.

---

# 14. Permission Integration Tests

Permission integration tests prove that permission records in the database affect real service behavior.

Required scenarios:

```txt
user with exact permission can perform operation
user without permission is denied
admin wildcard works inside same org
admin wildcard does not bypass tenant isolation
module-disabled org is denied even with permission
permission conditions are denied in MVP if non-null
read permission does not imply export permission
create permission does not imply import permission
```

Example:

```ts
it('denies create when user lacks permission', async () => {
  const { ctx } = await fixtures.createUserContextWithoutPermission({
    module: 'objects',
    resource: 'product',
    action: 'create',
  })

  await expect(
    ProductService.create(ctx, { code: 'P-001', name: 'Product', unit: 'pcs' })
  ).rejects.toMatchObject({ code: 'FORBIDDEN' })
})
```

A service test that only uses Admin is insufficient.

---

# 15. Module Enablement Integration Tests

Module enablement is separate from permission.

Required scenarios:

```txt
module enabled + permission present = allowed
module disabled + permission present = denied
module enabled + permission missing = denied
module disabled returns safe module-not-found behavior at API layer
admin wildcard does not bypass module enablement
```

Example:

```ts
it('denies module service when module is disabled even for admin', async () => {
  const { ctx } = await fixtures.createOrgAdminContext()
  await fixtures.disableModule({ orgId: ctx.org.id, moduleId: 'inventory' })

  await expect(
    InventoryStockService.list(ctx)
  ).rejects.toMatchObject({ code: 'MODULE_NOT_FOUND' })
})
```

---

# 16. Soft Delete Integration Tests

Soft delete must be tested against the real database because mocked Prisma cannot prove query behavior.

Required scenarios:

```txt
normal list excludes deleted records
normal read treats deleted record as not found
delete sets deletedAt and deletedBy
delete does not hard-delete business records
restore clears deletedAt and deletedBy
restore requires restore/update permission
unique constraints behave correctly after soft delete according to model policy
related historical records are not cascade-deleted
```

Example:

```ts
it('hides soft-deleted records from normal list', async () => {
  const { ctx } = await fixtures.createOrgAdminContext()

  const product = await ProductService.create(ctx, {
    code: 'P-001',
    name: 'Test Product',
    unit: 'pcs',
  })

  await ProductService.delete(ctx, product.id)

  const products = await ProductService.list(ctx)

  expect(products.some((p) => p.id === product.id)).toBe(false)
})
```

Do not rely only on Prisma `$extends` tests.

Soft-delete behavior is a service/SDK contract.

---

# 17. Business Object Integration Tests

Every Business Object service must have integration tests.

Required for each Business Object:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Each service should test:

```txt
create
list
read
update
soft delete
restore if supported
permission denial
tenant isolation
client-supplied orgId rejection at API/schema layer
event emission
relation validation
```

Business Object tests must also prove module ownership boundaries.

Examples:

```txt
Product API/service uses objects.product permissions
Product emits objects.product.created
Product does not emit inventory.product.created
Customer uses objects.customer permissions
Employee is not User
Warehouse may link to Branch but is not Branch
```

---

# 18. Module Service Integration Tests

Every module service must have integration tests once official modules exist.

Required scenarios:

```txt
uses verified PlatformContext
uses sdk.getDb(ctx)
enforces module enablement
enforces permissions
scopes all reads/writes by ctx.org.id
rejects cross-tenant records
uses Business Objects instead of duplicating them
uses extension tables for module-specific fields
uses soft delete where applicable
emits module events after successful mutations
```

Example for Inventory later:

```txt
InventoryProductExtension references Product
Inventory does not create duplicate InventoryProduct as product identity
StockMovement references Product + Warehouse tenant-safely
Org A cannot create StockMovement for Org B Product
Org A cannot create StockMovement for Org B Warehouse
```

---

# 19. Event Integration Tests

Events are part of the platform contract.

Required event integration scenarios:

```txt
event emitted after successful create
event emitted after successful update
event emitted after soft delete
event not emitted when validation fails
event not emitted when permission denied
event not emitted when transaction fails
event payload excludes orgId
event payload excludes full Prisma record
event name follows naming convention
listener failure does not break original mutation unless explicitly required
```

Example:

```ts
it('emits objects.product.created after successful create', async () => {
  const { ctx } = await fixtures.createOrgAdminContext()
  const spy = vi.spyOn(sdk.events, 'emit')

  const product = await ProductService.create(ctx, {
    code: 'P-001',
    name: 'Product',
    unit: 'pcs',
  })

  expect(spy).toHaveBeenCalledWith(
    ctx,
    'objects.product.created',
    expect.objectContaining({ productId: product.id })
  )
})
```

Events are facts, not commands.

---

# 20. API + Service Integration Boundary

Detailed API testing is covered in `14-testing-quality/03-api-testing.md`, but integration tests should still prove the API/service boundary for critical paths.

At minimum, for every protected API:

```txt
API creates PlatformContext
API rejects client-supplied orgId
API validates input before service call
API checks permission before or through service call
API returns JSON error shape
service receives PlatformContext, not orgId
```

Do not write API routes that directly query Prisma.

Bad:

```ts
await prisma.product.findMany({ where: { orgId } })
```

Correct:

```ts
const ctx = await sdk.auth.requireApiObjectContext(req, orgSlug)
const products = await ProductService.list(ctx)
```

---

# 21. Supabase Auth Integration Tests

Not every integration test should hit Supabase Auth.

For most service integration tests, use verified test `PlatformContext` factories.

However, the auth system needs its own integration tests proving:

```txt
server-owned registration creates Supabase auth user and Prisma User
Prisma failure triggers Supabase auth rollback
/api/kernel/auth/me returns current platform user
API auth helper returns JSON 401 when unauthenticated
page auth helper redirects when unauthenticated
current-user lookup is session-derived, not ID-derived
```

Allowed strategies:

```txt
local Supabase stack for full auth integration
controlled staging auth project for pre-production smoke
mocked Supabase auth only for lower-level unit tests
```

Forbidden:

```txt
running auth integration tests against production Supabase Auth
using real client users in test runs
using production service role keys in tests
```

---

# 22. Integration Tests for Migrations and Seeds

Because the previous MVP had migration/seed scripts written but not verified against live PostgreSQL, the restarted build must include migration/seed verification.

Required checks:

```txt
prisma generate succeeds
migrations apply to empty test database
baseline seed runs idempotently
baseline seed creates required roles and permissions
baseline seed does not overwrite client-like data
second seed run succeeds without duplicates
module provisioning seed is idempotent
```

Example CI sequence:

```bash
npm run prisma:generate
npm run db:test:migrate
npm run db:test:seed
npm run db:test:seed
npm run test:integration
```

The second seed run is deliberate.

Idempotency must be proven.

---

# 23. Integration Tests for Generators

Generators create architecture at scale.

Generator integration tests should prove that generated output:

```txt
compiles
passes typecheck
passes architecture checks
contains tenant-scoped API route shape
uses PlatformContext
uses sdk.getDb(ctx)
rejects client-supplied orgId
includes permission-denial tests
includes tenant-isolation tests
does not import @/kernel/* in module files
does not import raw Prisma in module files
does not import other modules
does not generate FastAPI/Python backend files
```

Generator integration test strategy:

```txt
create temporary sandbox project/folder
run generator
inspect output files
run typecheck against generated files if practical
run generated tests if practical
remove sandbox
```

Do not trust generator output just because the CLI prints success.

---

# 24. Integration Tests for Import/Export Scripts

The full Import/Export Engine is deferred, but controlled onboarding scripts are allowed.

Any onboarding import script must test:

```txt
uses explicit target org selected by operator, not client payload
validates rows before writing
rejects unknown columns where applicable
rejects cross-tenant relation matches
uses services instead of raw database writes where practical
respects Business Object uniqueness rules
handles duplicates predictably
supports dry-run mode
produces error report
```

Any export script must test:

```txt
requires export permission
scopes rows by org
excludes soft-deleted records by default
excludes sensitive fields unless explicitly allowed
```

---

# 25. Integration Tests for Future Platform Services

Deferred Platform Services cannot be implemented without integration tests.

When later implemented, these services require tests proving:

```txt
tenant isolation
permission enforcement
module enablement behavior where applicable
soft delete behavior where applicable
minimal event payloads
no client-supplied orgId
no direct module imports
SDK-only access
```

This applies to:

```txt
Audit Log Service
Notification Service
Approval Workflow Service
Comments Service
Attachments Service
Activity Feed Service
Reporting Service
Search Service
Background Jobs
```

---

# 26. Integration Tests for Future AI

Runtime AI features are deferred, but when they exist, integration tests must prove:

```txt
AI context is built from verified PlatformContext
AI context excludes unauthorized modules
AI context excludes unauthorized records
AI context excludes soft-deleted records
AI context excludes sensitive fields by default
AI cannot execute SQL
AI cannot execute raw Prisma queries
AI cannot export data without export permission
AI cannot mutate without preview + confirmation
prompt-injection content in business data is treated as untrusted
```

No AI feature may ship without tenant-isolation tests.

---

# 27. Mocking Rules

Integration tests should minimize mocks.

Allowed mocks:

```txt
email/SMS providers
AI providers
external payment providers
external APIs
file upload provider if Attachment Service is not under test
clock/time where deterministic behavior is needed
```

Avoid mocking:

```txt
Prisma database behavior
permission database rows
tenant relation rows
soft-delete persistence
service permission checks
PlatformContext construction for context tests
```

Mocking away the thing being tested invalidates the test.

---

# 28. Test Data Isolation

Integration tests must not depend on global data.

Use one of these patterns:

```txt
fresh disposable database per run
unique test run ID prefix per suite
unique org slug per test
transaction rollback if reliable
cleanup/truncate after suite
```

Recommended helper:

```ts
const testRunId = createTestRunId()
const orgSlug = `test-${testRunId}-alpha`
```

Never use real client-like names without test prefixes in integration tests.

---

# 29. Performance Expectations

Integration tests are slower than unit tests, but they must remain usable.

Targets:

```txt
core integration suite: fast enough to run during active development
full integration suite: required before merge/release
security-critical integration tests: required before foundation is considered complete
```

Do not skip dangerous tests just because they are slower.

Instead:

```txt
improve fixture setup
use fewer duplicated scenarios
separate slow suites
run full suite in CI/release gates
```

---

# 30. CI Requirements

Before the restarted foundation build can be considered complete, CI should run:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run check:architecture
npm run build
```

If integration tests require a database service, CI must provision one.

If the database is unavailable, CI should fail clearly, not silently skip integration tests.

---

# 31. Required Integration Test Matrix

The restarted foundation build is not complete until this matrix exists and passes:

| Area | Required Integration Proof |
|---|---|
| Auth context | session-derived user maps to Prisma User |
| Org context | user can access own org |
| Org isolation | user cannot access another org |
| API auth | unauthenticated protected API returns JSON 401 |
| Permission | unauthorized user denied |
| Admin wildcard | works only inside tenant and enabled module |
| Module enablement | disabled module blocks access |
| Business Objects | CRUD is tenant-scoped and permission-enforced |
| Soft delete | deleted records hidden and restorable through explicit path |
| Events | emitted only after successful mutation |
| Seeds | idempotent and verified against PostgreSQL |
| Generator | output contains secure patterns and real tests |
| Architecture checks | forbidden imports/patterns blocked |

---

# 32. Integration Test Anti-Patterns

Forbidden:

```txt
tests using only one organization
tests using only Admin users
tests that mock Prisma and claim to prove integration
tests that check only “returns an array”
tests that pass loose orgId into services
tests that call raw Prisma inside module test setup without fixture helpers
tests that rely on production Supabase
tests that silently skip when TEST_DATABASE_URL is missing
tests that depend on test execution order
tests that mutate shared staging/client data
tests that accept redirects from APIs as success
tests that inspect implementation details instead of platform behavior
```

---

# 33. Example Integration Test Structure

Recommended structure:

```txt
src/test/
  integration/
    setup.ts
    db.ts
    fixtures.ts
    assertions.ts
    safe-env.ts

src/kernel/auth/__tests__/
  context.integration.test.ts

src/kernel/permissions/__tests__/
  permissions.integration.test.ts

src/business-objects/product/__tests__/
  product.service.integration.test.ts

src/modules/inventory/__tests__/
  inventory.service.integration.test.ts
```

---

# 34. Example Fixture Helper Shape

```ts
export async function createOrgAdminContext(options?: {
  moduleId?: string
  permissions?: PermissionRequirement[]
}) {
  const org = await db.organization.create({
    data: {
      name: uniqueName('Org'),
      slug: uniqueSlug('org'),
      isActive: true,
    },
  })

  const user = await db.user.create({
    data: {
      id: crypto.randomUUID(),
      orgId: org.id,
      name: 'Test Admin',
      email: uniqueEmail('admin'),
      isActive: true,
    },
  })

  const role = await db.role.create({
    data: {
      orgId: org.id,
      name: 'Admin',
      isSystem: true,
    },
  })

  await db.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      orgId: org.id,
    },
  })

  await db.permission.create({
    data: {
      orgId: org.id,
      roleId: role.id,
      module: '*',
      resource: '*',
      action: '*',
      conditions: null,
    },
  })

  if (options?.moduleId) {
    await db.orgModule.create({
      data: {
        orgId: org.id,
        moduleId: options.moduleId,
        isEnabled: true,
      },
    })
  }

  const ctx = await createTestPlatformContext({ userId: user.id, orgSlug: org.slug })

  return { org, user, role, ctx }
}
```

The exact implementation may differ, but the fixture must create real database rows and verified context.

---

# 35. Claude Implementation Rules

When Claude implements integration tests, give it this instruction:

```md
You are implementing OneDayOS integration tests.

Authoritative document:
docs/engineering-manual/14-testing-quality/02-integration-testing.md

Rules:
- Do not use production database variables.
- Add safe test database guard before any DB mutation.
- Use at least two organizations for tenant-sensitive tests.
- Do not use only Admin users.
- Do not mock Prisma for database integration tests.
- Do not pass loose orgId into services.
- Use verified PlatformContext.
- Prove permission denial.
- Prove cross-tenant denial.
- Prove API auth returns JSON, not redirect/HTML, where APIs are tested.
- Do not add FastAPI/Python test infrastructure.
- If the test environment is ambiguous, stop and report the ambiguity.
```

---

# 36. Acceptance Criteria

This document is satisfied when:

```txt
[ ] Integration tests use a dedicated test database
[ ] Test database safety guard exists
[ ] Integration tests never run against production
[ ] Two-org tenant isolation tests exist
[ ] Permission-denial integration tests exist
[ ] Module-disabled integration tests exist
[ ] Soft-delete integration tests use real database behavior
[ ] Business Object services have integration tests
[ ] PlatformContext creation is tested
[ ] Seed idempotency is tested
[ ] Generator output is integration-tested or architecture-checked
[ ] Integration tests are separated from unit tests
[ ] CI runs or can run integration tests predictably
[ ] No FastAPI/Python test stack is added to the core platform
```

---

# 37. Non-Goals

This document does not implement or define:

```txt
browser end-to-end testing
visual regression testing
load testing
manual QA process
production monitoring
external penetration testing
formal compliance certification
runtime AI testing
file upload testing for Attachment Service
background job processing tests
```

Those belong in later documents when needed.

---

# 38. Final Rule

A platform integration test should answer this question:

```txt
When the real OneDayOS layers touch each other,
does the platform still protect the tenant, enforce permission,
and preserve the architecture?
```

If a test does not help answer that question, it may be a unit test, a smoke test, or a weak test — but it is not a meaningful OneDayOS integration test.

