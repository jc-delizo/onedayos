# OneDayOS Engineering Manual — Test Generator

**Document ID:** `09-cli-generators/05-test-generator.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Contract Required Now; Standalone Generator Deferred`  
**Owner:** OneDayOS Architecture  
**Last Updated:** July 2026  
**Depends On:**

- `00-meta/00-roadmap.md`
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
- `06-data/05-data-validation-zod.md`
- `08-module-system/09-module-testing.md`
- `09-cli-generators/00-generator-philosophy.md`
- `09-cli-generators/01-module-generator.md`
- `09-cli-generators/04-api-generator.md`

---

# 1. Purpose

The Test Generator defines the test files, fixtures, assertions, and safety checks that OneDayOS generators must produce.

Its job is not only to make generated code “covered.”

Its job is to make generated code **safe by default**.

The Test Generator exists because OneDayOS will eventually depend heavily on AI-assisted and generator-assisted development. If generators produce weak tests, every generated module becomes a future security risk. If generators produce strong tests, every generated module reinforces the architecture.

Core rule:

```txt
Generated tests must prove architecture.
They must not merely prove that generated files exist.
```

---

# 2. Status and Implementation Timing

The **test contract is required now** because the Module Generator must immediately generate secure tests.

However, a standalone CLI command such as:

```bash
npm run test:create inventory
```

is deferred.

For the restarted platform build, the required immediate behavior is:

```txt
module:create
  └── generates tests automatically
```

A standalone Test Generator may be added later only if repeated manual test creation becomes painful.

Recommended MVP position:

```txt
Required now:
- Test templates inside Module Generator
- Test templates inside future API/Form/CRUD generators
- Architecture check scripts

Deferred:
- Standalone test:create CLI
- AI-written test repair agent
- Mutation testing
- Browser E2E generator
- Test database orchestration CLI
```

---

# 3. Why This Document Exists

The previous MVP revealed several risks that tests did not fully prevent:

```txt
Permissions existed but were not enforced.
Org membership checks were incomplete.
API auth could redirect instead of returning JSON 401.
Generated routes could rely on loose orgId handling.
Some tests were tautological.
Soft-delete behavior could be bypassed.
Generated module tests were too weak.
```

The restarted platform must turn those lessons into permanent generated tests.

OneDayOS should assume that every generated module is potentially unsafe until tests prove otherwise.

---

# 4. Non-Goals

The Test Generator is not responsible for:

```txt
Building the test runner itself.
Choosing the production architecture.
Creating business logic for modules.
Creating fake passing tests.
Replacing manual review.
Replacing security review.
Replacing integration tests for real modules.
Generating Playwright E2E tests in MVP.
Generating load tests in MVP.
Generating FastAPI or Python tests.
```

The Test Generator should not create tests that simply lock in bad generated code.

Bad generated code should fail tests.

---

# 5. Core Philosophy

## 5.1 Tests are architecture enforcement

In OneDayOS, tests must enforce:

```txt
Tenant isolation
Permission enforcement
API response shape
Module enablement
SDK-only access
Soft delete behavior
Event contracts
Validation behavior
Business Object boundaries
No client-supplied orgId
No raw Prisma in modules
No direct module-to-module imports
```

A test suite that ignores these is not sufficient.

---

## 5.2 Security tests are not optional

Every generated module must include security tests from day one.

Even if the generated module is only a placeholder, it must still prove:

```txt
Unauthenticated users are rejected.
Wrong-tenant access is rejected.
Unauthorized users are rejected.
Disabled modules are inaccessible.
Client-supplied orgId is rejected.
Services require verified PlatformContext.
```

The generator must not create TODO comments such as:

```txt
// TODO: add permission tests later
```

That is not acceptable.

---

## 5.3 Every generated module needs at least two organizations

Single-organization tests are insufficient for OneDayOS.

A single-org test suite can pass while cross-tenant data leaks exist.

Generated tests must use at least:

```txt
Org A
Org B
Admin in Org A
Staff in Org A
Admin in Org B
```

For permission-denial tests, generated tests also need:

```txt
User with no role
User with role but missing permission
User with module disabled
```

---

## 5.4 Admin-only tests are dangerous

Admin wildcard permissions can hide bugs.

A generated test suite that only tests Admin is not safe.

Every generated module must test at least one non-admin denial path.

Example:

```txt
Admin can create stock adjustment.
Staff without inventory.stock_adjustment.create cannot create stock adjustment.
```

---

## 5.5 Mocks must not remove the thing being tested

Mocks are allowed, but not when they erase the security boundary being tested.

Bad API test:

```ts
vi.mock('@/modules/inventory/service', () => ({
  InventoryService: {
    create: vi.fn().mockResolvedValue({ id: 'x' }),
  },
}))
```

If this test is supposed to prove permission enforcement, mocking the service may hide whether the route passes a verified `PlatformContext`.

Better:

```txt
Test the API wrapper/context/permission path directly,
or use a thin integration test that verifies requireApiModuleContext and permissions.require are called.
```

Service security tests should not mock `sdk.permissions.require()` unless the test is specifically proving that the service calls it.

---

# 6. Test Generator Scope

The Test Generator contract applies to:

```txt
Module Generator
API Generator
CRUD Generator
Form Generator
Future Dynamic CRUD outputs
Future AI-assisted code generation
```

For the restarted platform, the Module Generator must produce the first version of these tests automatically.

---

# 7. Required Generated Test Files

Every generated module must include this minimum structure:

```txt
src/modules/[module]/
  __tests__/
    manifest.test.ts
    schema.test.ts
    service.test.ts
    permissions.test.ts
    events.test.ts
    architecture.test.ts

src/app/api/orgs/[orgSlug]/[module]/
  __tests__/
    route.test.ts

src/app/(platform)/[orgSlug]/[module]/
  __tests__/
    page.test.tsx
```

For modules with generated create/edit forms:

```txt
src/app/(platform)/[orgSlug]/[module]/
  __tests__/
    form.test.tsx
```

For modules with generated list clients:

```txt
src/app/(platform)/[orgSlug]/[module]/
  __tests__/
    list-client.test.tsx
```

For modules with extension tables:

```txt
src/modules/[module]/
  __tests__/
    extension.test.ts
```

For modules with import/export:

```txt
src/modules/[module]/
  __tests__/
    import.test.ts
    export.test.ts
```

Import/export tests are deferred unless the module declares import/export capability.

---

# 8. Required Test Fixture Model

Generated tests should use a standard fixture vocabulary.

Recommended fixture names:

```ts
const orgA = {
  id: 'org_a',
  slug: 'org-a',
  name: 'Org A',
}

const orgB = {
  id: 'org_b',
  slug: 'org-b',
  name: 'Org B',
}

const adminA = {
  id: 'user_admin_a',
  orgId: orgA.id,
  email: 'admin-a@example.test',
}

const staffA = {
  id: 'user_staff_a',
  orgId: orgA.id,
  email: 'staff-a@example.test',
}

const adminB = {
  id: 'user_admin_b',
  orgId: orgB.id,
  email: 'admin-b@example.test',
}
```

Test emails should use `.test` domains.

Never use real client data in tests.

---

# 9. PlatformContext Test Fixtures

Generated tests should use explicit verified contexts.

Example:

```ts
import type { PlatformContext } from '@/sdk'

export const ctxAdminA: PlatformContext = {
  requestId: 'req_admin_a',
  user: {
    id: 'user_admin_a',
    email: 'admin-a@example.test',
    name: 'Admin A',
  },
  org: {
    id: 'org_a',
    slug: 'org-a',
    name: 'Org A',
  },
  roles: [
    { id: 'role_admin_a', name: 'Admin' },
  ],
  permissions: [
    { module: '*', resource: '*', action: '*' },
  ],
  enabledModules: ['inventory'],
}
```

A generated service test should never create a context like this:

```ts
const ctx = { orgId: 'org_a' }
```

That is forbidden.

The test fixture must reflect the real security model:

```txt
user
organization
roles
permissions
enabled modules
request ID
```

---

# 10. Required Manifest Tests

Every generated module must test its manifest.

Generated file:

```txt
src/modules/[module]/__tests__/manifest.test.ts
```

Required assertions:

```txt
Manifest ID is URL-safe.
Manifest label is present.
Manifest version is present.
Manifest lifecycle is present.
Compatibility window is present.
Permissions are full permission objects.
Permissions do not include wildcard grants.
Navigation items declare required permissions.
API routes declare required permissions.
Event declarations follow event naming convention.
Dependencies do not include circular/self dependency.
Business Object usage is declared separately from module-owned entities.
Manifest does not execute registration side effects.
```

Example assertions:

```ts
expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*$/)
expect(manifest.permissions.every((p) => p.module === manifest.id)).toBe(true)
expect(manifest.permissions.some((p) => p.action === '*')).toBe(false)
expect(manifest.permissions.some((p) => p.module === '*')).toBe(false)
expect(manifest.permissions.some((p) => p.resource === '*')).toBe(false)
```

Wildcard grants belong to roles, not module manifests.

---

# 11. Required Schema Tests

Every generated module must test Zod schemas.

Generated file:

```txt
src/modules/[module]/__tests__/schema.test.ts
```

Required assertions:

```txt
Valid create input passes.
Valid update input passes.
Missing required field fails.
Invalid field type fails.
Unknown keys fail.
Client-supplied orgId fails.
Client-supplied userId fails unless explicitly part of business input.
Client-supplied deletedAt fails.
Client-supplied deletedBy fails.
Client-supplied createdAt fails.
Client-supplied updatedAt fails.
```

Required pattern:

```ts
it('rejects client-supplied orgId', () => {
  const result = CreateRecordSchema.safeParse({
    name: 'Test',
    orgId: 'org_b',
  })

  expect(result.success).toBe(false)
})
```

Generated schemas must use:

```ts
z.strictObject(...)
```

or equivalent strict object behavior.

---

# 12. Required Service Tests

Every generated module must test services.

Generated file:

```txt
src/modules/[module]/__tests__/service.test.ts
```

Required assertions:

```txt
Service methods require PlatformContext.
Service calls permission requirement.
Service uses sdk.getDb(ctx).
Service does not accept orgId as input.
Service scopes reads to ctx.org.id.
Service scopes writes to ctx.org.id.
Service soft-deletes instead of hard-deleting.
Service emits events after successful mutation.
Service does not emit events when mutation fails.
Service rejects records from another organization.
Service handles missing records as safe not found.
```

Example service test checklist:

```txt
list(ctxAdminA)
  [ ] calls sdk.getDb(ctxAdminA)
  [ ] returns only org A records
  [ ] excludes deleted records

create(ctxAdminA, input)
  [ ] requires create permission
  [ ] writes orgId from ctx.org.id
  [ ] ignores/rejects any orgId in input schema
  [ ] emits [module].[entity].created

update(ctxAdminA, id, input)
  [ ] requires update permission
  [ ] only updates record where id + orgId match
  [ ] emits [module].[entity].updated

delete(ctxAdminA, id)
  [ ] requires delete permission
  [ ] sets deletedAt/deletedBy
  [ ] does not hard delete
  [ ] emits [module].[entity].deleted
```

---

# 13. Required Permission Tests

Every generated module must test permission behavior.

Generated file:

```txt
src/modules/[module]/__tests__/permissions.test.ts
```

Required assertions:

```txt
Admin with wildcard permission can perform operation when module is enabled.
Staff with exact permission can perform operation.
Staff without exact permission is denied.
User with no role is denied.
User from another organization is denied.
Wildcard permission does not bypass tenant isolation.
Permission does not bypass module enablement.
Business Object permissions are separate from module permissions.
```

For module extension tables:

```txt
objects.product.create does not automatically grant inventory.product_extension.create.
inventory.product_extension.create does not automatically grant objects.product.create.
```

Generated tests must prove separation between:

```txt
module enablement
permission
tenant membership
```

---

# 14. Required API Route Tests

Every generated API route must test Kernel API behavior.

Generated file:

```txt
src/app/api/orgs/[orgSlug]/[module]/__tests__/route.test.ts
```

Required status tests:

| Case | Expected |
|---|---|
| Unauthenticated request | `401 UNAUTHENTICATED` JSON |
| Authenticated wrong org slug | safe `404 ORG_NOT_FOUND` JSON |
| Correct org but module disabled | safe `404 MODULE_NOT_FOUND` JSON |
| Correct org but missing permission | `403 FORBIDDEN` JSON |
| Invalid request body | `400 VALIDATION_ERROR` JSON |
| Client-supplied `orgId` | `400 VALIDATION_ERROR` JSON |
| Valid request | `200` or `201` JSON |
| Missing record | safe `404 NOT_FOUND` JSON |
| Cross-tenant record ID | safe `404 NOT_FOUND` JSON |
| Server error | `500 INTERNAL_SERVER_ERROR` JSON |

Required response shape:

```ts
expect(json).toEqual({
  data: expect.anything(),
  error: null,
})
```

or:

```ts
expect(json).toEqual({
  data: null,
  error: {
    code: expect.any(String),
    message: expect.any(String),
  },
})
```

APIs must never redirect.

Required assertion:

```ts
expect(response.headers.get('content-type')).toContain('application/json')
expect(response.status).not.toBe(307)
expect(response.status).not.toBe(308)
```

---

# 15. Required Tenant Isolation Tests

Every generated module must include cross-tenant tests.

Required cases:

```txt
Org A user cannot list Org B records.
Org A user cannot retrieve Org B record by ID.
Org A user cannot update Org B record by ID.
Org A user cannot delete Org B record by ID.
Org A user cannot create record under Org B using submitted orgId.
Org B admin wildcard permission cannot access Org A data.
```

The last case is important:

```txt
Wildcard permissions are org-scoped.
```

Admin in Org B is not superadmin of Org A.

---

# 16. Required Module Enablement Tests

Every generated module must test module enablement.

Required cases:

```txt
Module enabled + permission present → allowed.
Module enabled + permission missing → forbidden.
Module disabled + permission present → module not found.
Module disabled + admin wildcard → module not found.
Module not registered → module not found.
```

Reason:

```txt
Module enablement controls availability.
Permissions control user actions.
They are separate gates.
```

---

# 17. Required Soft Delete Tests

Every generated module that owns records must test soft delete.

Required cases:

```txt
Delete sets deletedAt.
Delete sets deletedBy from ctx.user.id.
Delete does not hard-delete.
Normal list excludes deleted records.
Normal detail read excludes deleted record.
Deleted record returns safe not found.
Restore requires restore permission if implemented.
Restore clears deletedAt/deletedBy.
Hard delete is not available in normal service/API.
```

Generated services must not call:

```ts
db.record.delete(...)
db.record.deleteMany(...)
```

unless the model is explicitly approved as non-business ephemeral data.

---

# 18. Required Event Tests

Every generated module must test events.

Generated file:

```txt
src/modules/[module]/__tests__/events.test.ts
```

Required cases:

```txt
Create emits created event after successful mutation.
Update emits updated event after successful mutation.
Delete emits deleted event after successful soft delete.
Failed validation emits no event.
Failed permission emits no event.
Failed database mutation emits no event.
Event payload does not include orgId.
Event payload does not include full Prisma record.
Event payload includes record id.
Event payload includes changedFields for update.
Event name follows convention.
```

Events are emitted from services, not API routes or client components.

---

# 19. Required Architecture Tests

Generated modules must include architecture checks.

Generated file:

```txt
src/modules/[module]/__tests__/architecture.test.ts
```

Required checks may be implemented with AST tooling, simple grep, ESLint, dependency-cruiser, or custom scripts.

The exact tooling may evolve, but the checks are mandatory.

Required forbidden patterns:

```txt
import ... from '@/kernel/'
import ... from '@/modules/[other-module]'
import { prisma } from ...
from '@/kernel/db/client'
sdk.getDb(orgId)
request.nextUrl.searchParams.get('orgId')
body.orgId
where: { id }
findUnique({ where: { id } }) on tenant-scoped records
delete( on business models
deleteMany( on business models
redirect( inside API routes
NextResponse.redirect inside API routes
```

Recommended architecture check script:

```bash
npm run check:architecture
```

This script should run in CI.

---

# 20. Required UI Tests

Generated pages and client components must test basic UI behavior.

Generated files:

```txt
src/app/(platform)/[orgSlug]/[module]/__tests__/page.test.tsx
src/app/(platform)/[orgSlug]/[module]/__tests__/list-client.test.tsx
src/app/(platform)/[orgSlug]/[module]/__tests__/form.test.tsx
```

Required page assertions:

```txt
Page renders module title.
Page loads under org shell.
Page does not fetch tenant data from client using orgId.
Page receives server-resolved data.
Page shows empty state.
Page respects permission-driven actions.
```

Required form assertions:

```txt
Required field errors display.
Invalid input errors display.
Submit sends business input only.
Submit does not include orgId.
Submit handles success.
Submit handles validation error.
Submit handles permission error.
```

Required list-client assertions:

```txt
Empty state appears.
Rows render.
Delete asks for confirmation if destructive.
Optimistic delete updates UI.
Failed delete rolls back or refreshes.
Toast appears on success/failure.
Action buttons hide or disable when permission missing.
```

UI tests are not security. They are usability and regression checks. API and service tests enforce security.

---

# 21. Required Business Object Boundary Tests

If a generated module touches a Business Object, tests must prove it does not duplicate ownership.

Required cases:

```txt
Inventory uses Product through Business Object service/API.
Inventory does not create InventoryProduct as a duplicate Product identity.
CRM uses Customer through Business Object service/API.
Leave uses Employee through Business Object service/API.
Module extension table references the Business Object.
Module extension table has orgId.
Module extension permissions are separate from Business Object permissions.
Business Object events are separate from module extension events.
```

Example:

```txt
Creating Inventory product extension requires:
- objects.product.create if creating the Product
- inventory.product_extension.create if creating inventory-specific fields
```

---

# 22. Required Generated Test Utilities

The platform should provide shared test helpers so generated tests stay consistent.

Recommended location:

```txt
src/testing/
  fixtures/
    organizations.ts
    users.ts
    roles.ts
    permissions.ts
    platform-context.ts
  helpers/
    api.ts
    permissions.ts
    tenancy.ts
    database.ts
    events.ts
    architecture.ts
```

The generator may import these helpers instead of duplicating large fixture code.

Example helper:

```ts
export function createTestPlatformContext(overrides?: Partial<PlatformContext>): PlatformContext {
  return {
    requestId: 'req_test',
    user: {
      id: 'user_admin_a',
      email: 'admin-a@example.test',
      name: 'Admin A',
    },
    org: {
      id: 'org_a',
      slug: 'org-a',
      name: 'Org A',
    },
    roles: [{ id: 'role_admin_a', name: 'Admin' }],
    permissions: [{ module: '*', resource: '*', action: '*' }],
    enabledModules: ['inventory'],
    ...overrides,
  }
}
```

This helper must still produce full `PlatformContext`, not loose `orgId`.

---

# 23. Required Test Scripts

The restarted platform should eventually include these package scripts:

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:watch": "vitest",
  "test:security": "vitest run --dir src --include '**/*.security.test.ts'",
  "check:architecture": "tsx scripts/check-architecture.ts",
  "check:generated": "npm run check:architecture && npm run test:run"
}
```

Exact implementation may vary, but the intent is fixed:

```txt
Tests must run.
Architecture checks must run.
Generated code must be checked before acceptance.
```

---

# 24. Naming Conventions

Generated test files should use:

```txt
*.test.ts
*.test.tsx
```

Security-specific tests may use:

```txt
*.security.test.ts
```

Recommended examples:

```txt
service.test.ts
service.security.test.ts
route.test.ts
route.security.test.ts
schema.test.ts
manifest.test.ts
architecture.test.ts
events.test.ts
```

Do not generate:

```txt
test.ts
spec.ts
__test__.ts
random-test-file.ts
```

Consistency matters because Claude and CI must be able to find generated tests.

---

# 25. Forbidden Generated Tests

The Test Generator must not produce tests like these:

```ts
it('returns an array', async () => {
  const result = await Service.list(ctx)
  expect(Array.isArray(result)).toBe(true)
})
```

This is too weak.

Instead:

```ts
it('returns only records for the authenticated organization', async () => {
  const result = await Service.list(ctxAdminA)

  expect(result).toEqual([
    expect.objectContaining({ orgId: orgA.id }),
  ])
  expect(result).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ orgId: orgB.id }),
    ])
  )
})
```

Forbidden weak assertions:

```txt
expect(result).toBeDefined()
expect(typeof fn).toBe('function')
expect(component).toMatchSnapshot()
expect(response.status).toBeLessThan(500)
expect(Array.isArray(result)).toBe(true)
```

These may appear as supplemental assertions, but they must not be the main proof.

---

# 26. Forbidden Generated Mocking Patterns

The generator must not create mocks that make security tests meaningless.

Forbidden:

```ts
vi.mock('@/sdk/server', () => ({
  sdk: {
    auth: {
      requireApiModuleContext: vi.fn().mockResolvedValue({ orgId: 'org_a' }),
    },
    permissions: {
      require: vi.fn().mockResolvedValue(true),
    },
  },
}))
```

This erases the actual auth and permission behavior.

Allowed in narrow unit tests:

```ts
expect(sdk.permissions.require).toHaveBeenCalledWith(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

But at least one test layer must prove the actual deny behavior.

---

# 27. Generated Test Template — Service Security

Generated service security test should resemble:

```ts
describe('InventoryService.create security', () => {
  it('requires create permission', async () => {
    const ctx = createTestPlatformContext({
      permissions: [
        { module: 'inventory', resource: 'stock_adjustment', action: 'read' },
      ],
    })

    await expect(
      InventoryService.create(ctx, validInput)
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('writes orgId from PlatformContext', async () => {
    const ctx = ctxAdminA

    await InventoryService.create(ctx, validInput)

    expect(db.stockAdjustment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: ctx.org.id,
        }),
      })
    )
  })

  it('does not accept orgId from input', () => {
    const result = CreateStockAdjustmentSchema.safeParse({
      ...validInput,
      orgId: orgB.id,
    })

    expect(result.success).toBe(false)
  })
})
```

---

# 28. Generated Test Template — API Security

Generated API test should resemble:

```ts
describe('POST /api/orgs/[orgSlug]/inventory/stock-adjustments', () => {
  it('returns 401 JSON when unauthenticated', async () => {
    const response = await POST(makeRequest(validInput), {
      params: Promise.resolve({ orgSlug: 'org-a' }),
    })

    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toEqual({
      data: null,
      error: {
        code: 'UNAUTHENTICATED',
        message: expect.any(String),
      },
    })
  })

  it('returns 403 JSON when permission is missing', async () => {
    mockApiContext(ctxStaffAWithoutCreatePermission)

    const response = await POST(makeRequest(validInput), {
      params: Promise.resolve({ orgSlug: 'org-a' }),
    })

    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('rejects client-supplied orgId', async () => {
    mockApiContext(ctxAdminA)

    const response = await POST(makeRequest({
      ...validInput,
      orgId: 'org-b',
    }), {
      params: Promise.resolve({ orgSlug: 'org-a' }),
    })

    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })
})
```

Exact helper names may change, but the behavior must remain.

---

# 29. Generated Test Template — Architecture Check

Generated architecture tests may call shared architecture check helpers:

```ts
import {
  expectNoForbiddenKernelImports,
  expectNoRawPrismaImports,
  expectNoDirectModuleImports,
  expectNoClientSuppliedOrgIdPatterns,
} from '@/testing/helpers/architecture'

describe('inventory module architecture', () => {
  it('does not import Kernel internals', async () => {
    await expectNoForbiddenKernelImports('src/modules/inventory')
  })

  it('does not import raw Prisma', async () => {
    await expectNoRawPrismaImports('src/modules/inventory')
  })

  it('does not import other modules', async () => {
    await expectNoDirectModuleImports('src/modules/inventory')
  })

  it('does not use client-supplied orgId patterns', async () => {
    await expectNoClientSuppliedOrgIdPatterns('src/modules/inventory')
  })
})
```

The helper implementation may use grep/AST/ESLint, but the checks must exist.

---

# 30. Integration with Module Generator

The Module Generator must generate tests automatically.

When running:

```bash
npm run module:create inventory
```

Expected test output:

```txt
CREATE src/modules/inventory/__tests__/manifest.test.ts
CREATE src/modules/inventory/__tests__/schema.test.ts
CREATE src/modules/inventory/__tests__/service.test.ts
CREATE src/modules/inventory/__tests__/permissions.test.ts
CREATE src/modules/inventory/__tests__/events.test.ts
CREATE src/modules/inventory/__tests__/architecture.test.ts
CREATE src/app/api/orgs/[orgSlug]/inventory/__tests__/route.test.ts
CREATE src/app/(platform)/[orgSlug]/inventory/__tests__/page.test.tsx
```

If the generator cannot produce meaningful tests, it should fail rather than create placeholder tests.

Forbidden output:

```txt
TODO: add tests
```

Allowed output:

```txt
TODO: replace placeholder business fields
```

But the security structure must already be real.

---

# 31. Integration with API Generator

The API Generator contract must produce:

```txt
route.test.ts
route.security.test.ts
```

Required assertions:

```txt
401 JSON
403 JSON
404 ORG_NOT_FOUND
404 MODULE_NOT_FOUND
400 VALIDATION_ERROR
client-supplied orgId rejected
service receives PlatformContext
no redirects
no HTML responses
```

A generated API without these tests is not acceptable.

---

# 32. Integration with CRUD Generator

The CRUD Generator is deferred, but when implemented, it must generate tests for:

```txt
list
detail
create
update
soft delete
restore if supported
validation
permissions
tenant isolation
events
empty state
form submit
```

CRUD Generator must not be allowed to produce a CRUD feature without the security tests.

---

# 33. Integration with Form Generator

The Form Generator is deferred, but when implemented, it must generate tests for:

```txt
required field validation
invalid type validation
unknown key rejection
orgId rejection
submit payload shape
loading state
error state
success state
permission-denied state
relation field tenant scoping
```

Forms do not enforce tenant security by themselves, but they must not submit tenant identity.

---

# 34. Integration with Future AI Code Generation

When AI generates module code, it must also generate or update tests.

AI-generated code is not accepted unless:

```txt
Generated/updated tests pass.
Architecture checks pass.
Security tests pass.
Manual acceptance criteria pass.
```

Claude must not write implementation-only code and leave tests to humans.

---

# 35. CI Requirements

Generated tests must be part of CI.

Minimum CI gate:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run check:architecture
npm run build
```

Recommended later gate:

```bash
npm run test:security
```

A generated module cannot be merged if architecture or security tests fail.

---

# 36. Acceptance Criteria

The Test Generator contract is satisfied when:

```txt
[ ] Module Generator emits meaningful test files.
[ ] Generated tests include two organizations.
[ ] Generated tests include at least one non-admin user.
[ ] Generated tests include tenant-isolation checks.
[ ] Generated tests include permission-denial checks.
[ ] Generated tests include module-disabled checks.
[ ] Generated tests include API 401/403/404/400 behavior.
[ ] Generated tests assert JSON-only API responses.
[ ] Generated tests reject client-supplied orgId.
[ ] Generated tests prove services use PlatformContext.
[ ] Generated tests prove services use sdk.getDb(ctx).
[ ] Generated tests prove soft delete behavior where applicable.
[ ] Generated tests prove event emission and non-emission on failure.
[ ] Generated tests include architecture import checks.
[ ] Generated tests do not rely only on admin users.
[ ] Generated tests are not tautological.
[ ] Generated tests pass on fresh checkout.
```

---

# 37. Claude Implementation Rules

When Claude implements generator testing behavior, it must follow these rules:

```txt
Do not generate weak placeholder tests.
Do not generate admin-only tests.
Do not generate single-org-only tests.
Do not mock away the security boundary under test.
Do not use loose orgId strings in test fixtures.
Do not generate tests for sdk.getDb(orgId).
Do not generate tests that import @/kernel/* from modules.
Do not generate tests that expect API redirects.
Do not generate FastAPI/Python/Pydantic tests.
Do not invent E2E infrastructure unless asked.
Do not implement Dynamic CRUD or Dynamic Forms while writing test generator contracts.
```

Claude may decide:

```txt
Exact helper function names.
Exact test file grouping.
Whether to use shared test fixtures or inline generated fixtures initially.
Whether architecture checks are implemented with grep, AST, ESLint, or dependency-cruiser.
```

Claude may not decide:

```txt
Whether tenant isolation tests are required.
Whether permission-denial tests are required.
Whether client-supplied orgId is allowed.
Whether admin-only tests are sufficient.
Whether API routes may redirect.
Whether raw Prisma is allowed in modules.
Whether FastAPI is part of the core platform.
```

---

# 38. Founder Review Questions

Before freezing this document, answer:

```txt
1. Should generated module tests include UI tests immediately, or should UI tests start once the Design System is frozen?
2. Should architecture checks be implemented as Vitest tests, ESLint rules, or a separate script first?
3. Should test fixtures be generated inside each module or imported from shared src/testing helpers?
4. Should service permission checks be tested through real sdk.permissions.require or mocked with call assertions in MVP?
5. Should generated tests be allowed to fail initially until the developer fills in business fields, or should generated module code always pass immediately?
```

Recommended answers:

```txt
1. Generate minimal UI smoke tests now; expand after Design System.
2. Start with a separate script plus Vitest wrapper; move to ESLint later.
3. Use shared src/testing helpers to avoid duplicated fixtures.
4. Use both: call assertions for unit tests, real deny behavior in integration/API tests.
5. Generated module should pass immediately for placeholder safe behavior, but must fail if developer adds unsafe patterns.
```

---

# 39. Final Rule

The Test Generator exists to make the right architecture easy and the wrong architecture visible.

If a generated module can leak tenant data, bypass permissions, trust `orgId`, or redirect from an API route while its generated tests still pass, then the Test Generator has failed.

---

# ADR-0011 UX Test Generator Amendment

Future generated tests must cover UX conformance in addition to security and architecture:

```txt
[ ] UX Contract completeness test.
[ ] Process Flow content test.
[ ] Page header and shell usage test.
[ ] Contextual loading-state test.
[ ] Contextual empty/error-state test.
[ ] Accessibility structure test when approved tooling exists.
[ ] No fake dashboard metrics or fake charts.
[ ] No hidden orgId in generated forms.
[ ] Shared Business Object ownership copy is present where relevant.
```

Generated UX tests must not be placeholders. They must fail when generated UI drifts toward generic CRUD or unsafe tenant behavior.
