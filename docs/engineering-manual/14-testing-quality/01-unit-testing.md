# OneDayOS Engineering Manual — 14 Testing & Quality / 01 Unit Testing

**Status:** Draft for Founder Review  
**Version:** 1.0  
**Owner:** OneDayOS Founder / Platform Architect  
**Last Updated:** July 2026  
**Implementation Status:** Required Before Restarted Foundation Build  
**Depends On:**  
- `14-testing-quality/00-testing-philosophy.md`
- `13-security/07-security-testing.md`
- `13-security/08-production-readiness-gate.md`
- `05-sdk/06-sdk-testing-contract.md`
- `08-module-system/09-module-testing.md`

---

# 1. Purpose

This document defines how **unit tests** should be written in OneDayOS.

Unit tests are the smallest and fastest layer of the test suite. They verify isolated business rules, pure helpers, validators, mappers, permission matchers, manifest validators, event-name validators, API error mappers, generator output functions, and component behavior that does not require a real database or full application runtime.

Unit tests are important, but they are **not enough** for OneDayOS.

OneDayOS is a multi-tenant business platform. The most dangerous bugs are often not pure-function bugs. They are bugs in:

```txt
tenant isolation
permission enforcement
API behavior
database scoping
soft delete
module enablement
cross-module boundaries
generator output
```

Therefore, unit tests must be used for the right things, and they must not pretend to prove things they cannot prove.

The rule is:

```txt
Unit tests prove isolated logic.
Integration and security tests prove platform safety.
```

---

# 2. Why Unit Testing Matters in OneDayOS

Unit tests help OneDayOS move quickly without becoming fragile.

They are useful because they are:

```txt
fast
small
deterministic
easy to run often
good for edge cases
good for pure logic
good for regression protection
good for generator checks
good for architecture helpers
```

But they are dangerous when they become a false sense of security.

A unit test that says:

```txt
can() returns true for admin
```

is useful.

A unit test that says:

```txt
InventoryService.list() returns an array
```

is almost useless if it does not prove tenant scoping, permission enforcement, soft-delete behavior, or failure paths.

The old MVP showed this problem: some tests existed, but some were effectively tautological and did not exercise real security behavior. The restarted platform must treat weak tests as architecture debt.

---

# 3. Definition of a Unit Test

A OneDayOS unit test verifies one isolated unit of behavior without depending on:

```txt
real PostgreSQL database
real Supabase Auth
real Vercel runtime
real browser navigation
real file storage
real email/SMS providers
real AI providers
real background queues
```

A unit test may use mocks, stubs, or test doubles when the goal is to isolate behavior.

A unit test should usually run in milliseconds.

A unit test should be deterministic.

A unit test should not depend on test order.

A unit test should not require `.env.local`.

A unit test should not require real infrastructure.

---

# 4. What Unit Tests Are Good For

Unit tests are appropriate for these categories.

## 4.1 Pure utility functions

Examples:

```txt
slug generation
string normalization
permission matching
wildcard matching
event name validation
route active-state matching
error code mapping
safe filename generation
pagination calculation
date-range normalization
money/quantity formatting
```

Good unit test:

```txt
toSlug('Acme Trading Corp!') returns 'acme-trading-corp'
```

Bad unit test:

```txt
toSlug() exists
```

---

## 4.2 Zod schemas and validation rules

Examples:

```txt
rejects missing required fields
rejects invalid email
rejects unknown keys
rejects client-supplied orgId
accepts valid input
normalizes optional fields
validates route params
validates query params
```

Required pattern:

```txt
Every tenant-scoped create/update schema must test that client-supplied orgId is rejected.
```

Example cases:

```txt
valid body passes
unknown field fails
orgId field fails
empty required name fails
invalid enum fails
```

---

## 4.3 Permission matching logic

Examples:

```txt
exact permission match
module wildcard
resource wildcard
action wildcard
admin wildcard
missing permission denial
wrong module denial
wrong resource denial
non-null conditions denied in MVP
```

Permission unit tests should prove matching behavior only.

They do not replace API/service permission-enforcement tests.

A permission matcher unit test proves:

```txt
Given these permission objects, does the matcher return true or false?
```

It does not prove:

```txt
Every route called the permission matcher.
```

That requires API/service/security tests.

---

## 4.4 API error helpers

Examples:

```txt
UNAUTHENTICATED maps to 401
FORBIDDEN maps to 403
VALIDATION_ERROR maps to 400
ORG_NOT_FOUND maps to safe 404
MODULE_NOT_FOUND maps to safe 404
TENANT_ID_NOT_ALLOWED maps to 400
```

Unit tests should prove OneDayOS error helpers return the approved API shape:

```ts
{
  data: null,
  error: {
    code: string,
    message: string,
    details?: unknown
  },
  meta?: unknown
}
```

No API helper should accidentally return raw stack traces, HTML, redirect responses, or inconsistent shapes.

---

## 4.5 Event helpers

Examples:

```txt
event name validator accepts objects.product.created
event name validator rejects inventory.product.created for Product Business Object
event envelope builder includes event name, actor, timestamp, and payload
event envelope builder excludes orgId from payload
event payload schema rejects full record shapes
event registry rejects invalid names
```

Unit tests should protect event contracts because future services such as Audit Log, Search, Activity Feed, Notifications, and AI may depend on event names and payloads.

A wrong event name is not a cosmetic issue.

It is a broken contract.

---

## 4.6 Module manifest validation

Examples:

```txt
manifest ID is URL-safe
manifest permissions use full permission objects
manifest permissions do not include wildcard grants
manifest API routes live under /api/orgs/[orgSlug]/...
manifest navigation hrefs are org-shell-relative
manifest does not declare Business Object events under module namespace
manifest compatibility object is valid
manifest dependencies are not circular
```

Manifest validation should be heavily unit-tested because module manifests are used by:

```txt
module registry
navigation
permissions
module enablement
future marketplace
future AI context
future search/reporting metadata
```

---

## 4.7 Generator logic

Generators should be tested with unit tests because they encode architecture into files.

Examples:

```txt
module:create produces expected file paths
module:create refuses invalid module IDs
module:create refuses overwriting files
module:create emits /api/orgs/[orgSlug]/[moduleId]/... routes
module:create does not emit /api/[module]
module:create does not emit sdk.getDb(orgId)
module:create does not emit client-supplied orgId schemas
module:create emits tenant-isolation tests
module:create emits permission-denial tests
```

Generator unit tests should often inspect strings.

This is acceptable because the generator output is source code, and source code patterns are part of OneDayOS architecture.

---

## 4.8 Small React components

Examples:

```txt
DataTable renders headers
DataTable renders rows
DataTable renders empty state
DataTable respects custom cell renderer
PermissionGate hides children when user lacks permission
ErrorState renders correct message
EmptyState renders action button
LoadingSkeleton renders without spinner
```

Component unit tests should test behavior visible to the user.

They should not only test implementation details.

Bad:

```txt
component has className text-gray-500
```

Usually good:

```txt
empty table shows the configured empty-state message
```

---

# 5. What Unit Tests Are Not Good For

Unit tests must not be used to claim safety for things they cannot prove.

## 5.1 Unit tests do not prove tenant isolation

A mocked database cannot fully prove tenant isolation.

This unit test is not enough:

```txt
mock db called with orgId
```

Real tenant isolation requires integration/security tests with at least two organizations.

Unit tests may help test helper behavior, but they do not replace real two-org tests.

---

## 5.2 Unit tests do not prove Prisma behavior

A mocked Prisma client does not prove:

```txt
composite unique constraints work
soft delete filters are applied in real queries
nested reads are scoped correctly
findUnique restrictions are actually enforced
migrations are valid
foreign keys behave correctly
transactions roll back correctly
```

Those require integration tests against a real or test PostgreSQL database.

---

## 5.3 Unit tests do not prove Supabase Auth behavior

Mocking Supabase does not prove:

```txt
sessions are refreshed correctly
cookies are written correctly
service role is protected
Supabase Auth user creation works
password reset flow works
MFA behavior works
```

Unit tests may test our wrapper behavior, but auth flows require API/integration tests.

---

## 5.4 Unit tests do not prove API security

A unit test for an API helper is not enough to prove every route uses it.

API security requires route-level tests that prove:

```txt
unauthenticated request returns JSON 401
unauthorized request returns JSON 403
wrong-org access returns safe 404
client-supplied orgId is rejected
validation errors return VALIDATION_ERROR
API never redirects or returns HTML
```

---

## 5.5 Unit tests do not prove UI authorization

A component test can prove a button is hidden.

It does not prove the user cannot call the API.

UI authorization tests are useful for usability, but security belongs in APIs and services.

---

# 6. Required Test Frameworks

The restarted foundation build should use:

```txt
Vitest for unit tests
React Testing Library for component behavior tests
@testing-library/jest-dom for DOM assertions
```

Do not introduce another unit test framework without an ADR.

Do not introduce Jest separately unless a future ADR proves the need.

Do not introduce Python/Pytest/FastAPI testing for the core platform.

The core OneDayOS platform is TypeScript/Next.js/Prisma/Supabase/Vercel.

---

# 7. Test File Placement

Tests should live close to the code they test.

Required pattern:

```txt
src/kernel/auth/__tests__/session.test.ts
src/kernel/permissions/__tests__/matcher.test.ts
src/sdk/__tests__/api.test.ts
src/modules/inventory/__tests__/service.test.ts
src/components/kernel/data-table/__tests__/DataTable.test.tsx
scripts/__tests__/create-module.test.ts
```

Do not create one giant test folder detached from the source tree.

Co-located tests make ownership obvious.

---

# 8. Test Naming Rules

Test names should describe behavior, not implementation.

Good:

```txt
it('rejects client-supplied orgId in create schema')
it('returns false when permission resource does not match')
it('maps UNAUTHENTICATED to JSON 401')
it('rejects module manifests with wildcard permissions')
it('does not render row actions when user lacks update permission')
```

Bad:

```txt
it('works')
it('test 1')
it('returns data')
it('renders')
it('calls function')
```

A failing test name should tell Claude what broke.

---

# 9. Test Structure

Use this pattern:

```ts
describe('unit being tested', () => {
  it('expected behavior', () => {
    // arrange
    // act
    // assert
  })
})
```

Prefer one behavior per test.

Avoid tests that assert many unrelated behaviors at once.

Bad:

```ts
it('handles permissions', () => {
  expect(canRead).toBe(true)
  expect(canCreate).toBe(false)
  expect(canExport).toBe(false)
  expect(renderedTable).toBeDefined()
})
```

Better:

```ts
it('allows read when role grants resource read')
it('denies create when role lacks create')
it('denies export even when role has read')
```

---

# 10. Mocking Philosophy

Mocks are allowed, but they must not erase the behavior being tested.

The rule is:

```txt
Mock infrastructure.
Do not mock the security boundary you claim to test.
```

Allowed mocks:

```txt
Supabase client when testing auth wrapper error handling
Prisma client when testing service call shape
Event bus when testing service emits after mutation
Router when testing component navigation
Date/time when testing deterministic timestamps
File system when testing generator dry-run behavior
```

Dangerous mocks:

```txt
mocking sdk.permissions.require to always succeed in a permission-enforcement test
mocking tenant context as valid without testing invalid contexts elsewhere
mocking service methods while claiming an API route is secure
mocking the function under test
mocking away validation while claiming validation is tested
mocking database scoping while claiming tenant isolation is tested
```

---

# 11. Tautological Tests Are Forbidden

A tautological test is a test that passes even if the real behavior is broken.

Forbidden examples:

```ts
it('returns an array', async () => {
  const result = await Service.list(ctx)
  expect(Array.isArray(result)).toBe(true)
})
```

```ts
it('exports sdk', () => {
  expect(sdk).toBeDefined()
})
```

```ts
it('has a service', () => {
  expect(InventoryService).toBeDefined()
})
```

```ts
it('creates a module', () => {
  expect(files.length).toBeGreaterThan(0)
})
```

These are not enough.

Better tests prove specific behavior:

```txt
list excludes soft-deleted records
create rejects client-supplied orgId
delete emits event only after successful soft delete
module generator emits tenant-scoped API route
permission matcher denies wrong resource
API helper maps forbidden error to JSON 403
```

---

# 12. Unit Testing the PlatformContext Boundary

`PlatformContext` is one of the most important safety concepts in OneDayOS.

Unit tests should cover helper behavior around context shape and usage.

Examples:

```txt
builds context from authenticated user + org slug
rejects inactive users
rejects suspended organizations for module access
rejects org mismatch
includes enabled module IDs
includes role/permission summary
excludes secrets
```

However, the real org-membership guarantee must also be tested with integration/API tests.

Unit tests can prove:

```txt
given user.orgId !== org.id, helper returns ORG_NOT_FOUND
```

Integration tests must prove:

```txt
User from Org A cannot access Org B route/API in a realistic request path
```

---

# 13. Unit Testing Permissions

Permission unit tests should cover the matcher exhaustively.

Required cases:

```txt
exact module/resource/action match passes
wrong module fails
wrong resource fails
wrong action fails
module wildcard passes only inside same tenant context
resource wildcard passes for resource under module
action wildcard passes only when explicitly granted
full admin wildcard *.*.* passes inside verified org
no roles fails
no permissions fails
non-null conditions denied in MVP
read does not imply export
create does not imply import
approve permission does not imply approval assignment
```

Example matrix:

| Permission Grant | Requirement | Expected |
|---|---|---:|
| `inventory.product.read` | `inventory.product.read` | allow |
| `inventory.product.read` | `inventory.product.create` | deny |
| `inventory.*.read` | `inventory.stock_level.read` | allow |
| `inventory.product.*` | `inventory.product.delete` | allow |
| `*.*.*` | `crm.customer.delete` | allow, but only after tenant context verified |
| `objects.product.read` | `inventory.product.read` | deny |
| `inventory.product.read` | `inventory.product.export` | deny |

Important:

```txt
Permission unit tests must not imply tenant isolation is optional.
Tenant membership is checked before permission matching.
```

---

# 14. Unit Testing Zod Schemas

Every create/update schema for tenant-scoped operations must test:

```txt
valid input passes
missing required input fails
unknown key fails
client-supplied orgId fails
invalid enum fails
invalid relation ID shape fails
empty string handling is intentional
optional nullable fields behave as expected
```

OneDayOS uses strict request-body validation by default.

Therefore, this should fail:

```json
{
  "name": "Test Product",
  "orgId": "org_attacker"
}
```

The correct tenant identity comes from:

```txt
authenticated user
+ orgSlug route param
+ verified PlatformContext
```

Not from the request body.

---

# 15. Unit Testing API Helpers

API helper unit tests should cover:

```txt
success response shape
error response shape
validation error formatting
known error codes
unknown error fallback
status code mapping
no stack trace exposure
no HTML response
no redirect response
```

Required status mappings:

| Error Code | HTTP Status |
|---|---:|
| `UNAUTHENTICATED` | 401 |
| `FORBIDDEN` | 403 |
| `ORG_NOT_FOUND` | 404 |
| `MODULE_NOT_FOUND` | 404 |
| `RECORD_NOT_FOUND` | 404 |
| `VALIDATION_ERROR` | 400 |
| `TENANT_ID_NOT_ALLOWED` | 400 |
| `CONFLICT` | 409 |
| `INTERNAL_ERROR` | 500 |

Unit tests should also prove the public message is safe.

For wrong-org access, do not reveal:

```txt
Organization exists but you cannot access it.
```

Use safe not-found behavior.

---

# 16. Unit Testing Events

Event unit tests should cover:

```txt
valid event names pass
invalid event names fail
present-tense or command-style event names fail
camelCase event names fail
missing namespace fails
Business Object events use objects.*
module-owned events use module ID namespace
event envelope includes actor metadata
event envelope excludes payload.orgId
payload schema rejects full record dumps
listener failure does not break emit in in-process bus
```

Examples of valid events:

```txt
objects.product.created
objects.customer.updated
objects.employee.deactivated
inventory.stock_movement.created
inventory.stock_level.reorder_threshold_crossed
platform.approval_request.submitted
```

Examples of invalid events:

```txt
product.created
inventory.product.created
send.email
notify.user
productCreated
inventory.stock.low
```

Note: `inventory.product.created` is invalid because `Product` is a shared Business Object, not owned by Inventory.

---

# 17. Unit Testing Generators

Generators are one of the highest-leverage areas for unit tests.

The module generator must be tested before Claude uses it heavily.

Required generator unit tests:

```txt
rejects invalid module IDs
creates expected module folder paths
creates expected app route paths
creates expected API route paths
does not overwrite existing files unless explicitly allowed
does not generate /api/[module]
does not generate ?orgId= patterns
does not generate sdk.getDb(orgId)
does not generate client-supplied orgId schemas
does not generate @/kernel imports inside modules
does not generate raw Prisma imports inside modules
does not generate module-to-module imports
does not generate FastAPI/Python files
emits PlatformContext-based service signatures
emits permission-denial tests
emits tenant-isolation tests
emits Zod unknown-key tests
```

Generator tests may inspect source strings.

Example:

```ts
expect(output).toContain('sdk.getDb(ctx)')
expect(output).not.toContain('sdk.getDb(orgId)')
expect(output).not.toContain("searchParams.get('orgId')")
```

This is not brittle in a bad way.

The generated patterns are architecture contracts.

---

# 18. Unit Testing React Components

React component unit tests should focus on user-visible behavior.

Examples:

```txt
renders empty state when no rows exist
renders loading skeleton while loading
renders validation message for invalid input
hides action button when permission is missing
shows disabled state while mutation is pending
calls submit handler with business fields only
never includes hidden orgId field
renders tooltip for non-obvious fields
does not render export action without export permission
```

Do not test internal implementation details unless they are architecture-critical.

Usually avoid:

```txt
exact Tailwind class assertions
component internal state variables
private helper calls
DOM structure too tightly
```

Prefer:

```txt
what user sees
what user can click
what data is submitted
what accessibility role/name exists
```

---

# 19. Unit Testing Forms

Form unit tests should cover:

```txt
required fields
validation messages
submit disabled/loading behavior
business payload only
no orgId field
relation option rendering
server error display
success callback/navigation behavior
```

A form test should explicitly prove this:

```txt
The form submits business data only.
Tenant identity is not submitted by the client.
```

Bad payload:

```json
{
  "name": "Test Product",
  "orgId": "org_123"
}
```

Good payload:

```json
{
  "name": "Test Product"
}
```

---

# 20. Unit Testing Navigation Helpers

Navigation logic has security and UX implications.

Unit tests should cover:

```txt
href joining does not double slashes
nav items are org-shell-relative
active matching is segment-aware
/inventory does not match /inventory-audit
disabled modules are excluded
unauthorized nav items are excluded
Business Object nav is not owned by modules
settings nav requires settings permission
```

The previous MVP had unsafe prefix active-state matching. The restarted platform must avoid this permanently.

---

# 21. Unit Testing Business Object Rules

Business Object helper tests should cover:

```txt
Product belongs to objects namespace
Customer belongs to objects namespace
Employee belongs to objects namespace
Supplier belongs to objects namespace
Warehouse belongs to objects namespace
Product events are objects.product.*
Customer events are objects.customer.*
Employee events are objects.employee.*
module extension events are module-owned
module cannot declare duplicate Business Object entity names
```

These tests help prevent Claude from recreating:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
```

as duplicate shared entities.

---

# 22. Unit Testing Soft Delete Helpers

Soft delete unit tests should cover helper behavior:

```txt
softDelete data includes deletedAt and deletedBy
restore data clears deletedAt and deletedBy
normal query builder adds deletedAt null
deleted query builder requires explicit option
hard delete helper is not exposed for business records
```

But unit tests must not claim to prove real Prisma soft-delete behavior.

Real database tests are still required because Prisma query behavior can differ across:

```txt
findMany
findFirst
findUnique
aggregate
groupBy
nested include
relations
transactions
```

---

# 23. Unit Testing Module Services

Module service unit tests are allowed, but must be written carefully.

Service unit tests may prove:

```txt
service calls sdk.permissions.require before mutation
service calls sdk.getDb(ctx), not sdk.getDb(orgId)
service rejects invalid context shape
service emits event after successful mutation
service does not emit event after failed mutation
service maps known errors correctly
service passes tenant-scoped where clause to repository/helper
```

Service unit tests must not be the only tests for:

```txt
tenant isolation
permission enforcement
soft delete
database constraints
transactions
```

Those need integration/security tests.

Recommended service method shape:

```ts
ProductService.create(ctx, input)
InventoryService.createStockAdjustment(ctx, input)
LeaveService.submitRequest(ctx, input)
```

Forbidden service method shape:

```ts
ProductService.create(orgId, input)
InventoryService.list(orgId)
LeaveService.submit(userId, orgId, input)
```

---

# 24. Unit Testing SDK Boundaries

SDK unit tests should prove the public SDK surface exposes intended safe APIs and does not expose internals.

Required tests:

```txt
@/sdk exports shared-safe types/constants only
@/sdk/server exports server-only sdk
@/sdk/client exports browser-safe sdkClient
client SDK does not expose getDb
client SDK does not expose server auth helpers
client SDK does not expose Prisma
server SDK exposes getDb(ctx)
server SDK does not expose getDb(orgId)
reserved SDK namespaces are documented but not implemented
```

Do not write a weak test like:

```txt
sdk exists
```

Test the boundary.

---

# 25. Unit Testing Environment Helpers

Environment helper tests should cover:

```txt
server env requires DATABASE_URL
server env requires Supabase service role only on server
client env exposes only NEXT_PUBLIC_* values
server secrets are not available from env.client.ts
missing env produces safe startup error
.env.example contains placeholders only
```

Never put real secrets in tests.

Never snapshot real environment values.

---

# 26. Snapshot Testing Policy

Snapshot tests are allowed only when they add real value.

Allowed:

```txt
generator output snapshot for a stable template
API error shape snapshot
manifest validation error summary
```

Avoid snapshots for:

```txt
large React trees
random UI markup
Tailwind class soup
unstable generated IDs
dates/timestamps
```

Snapshot tests should not become a way to approve accidental architecture drift.

If a generator snapshot changes, review carefully.

---

# 27. Time, Randomness, and IDs

Unit tests must be deterministic.

When testing time:

```txt
freeze time
inject clock
mock Date.now carefully
```

When testing IDs:

```txt
inject ID generator
mock nanoid/cuid if needed
assert shape, not exact generated randomness
```

Do not let random test data create flaky tests.

---

# 28. Test Data Builders

Use small builders for repeated test data.

Example:

```ts
function makePlatformContext(overrides = {}): PlatformContext {
  return {
    user: { id: 'user_a_admin', email: 'admin@orga.test', name: 'Admin A' },
    org: { id: 'org_a', slug: 'org-a', name: 'Org A' },
    roles: ['Admin'],
    permissions: [{ module: '*', resource: '*', action: '*' }],
    enabledModules: ['inventory'],
    ...overrides,
  }
}
```

Use builders to make tests readable.

Do not hide critical fields.

For security-related tests, the builder should make tenant identity explicit.

---

# 29. Required Unit Test Categories by Layer

## Kernel

Must unit test:

```txt
auth helper error mapping
context helper branching
permission matcher
API error helpers
env validation
module registry validation
event name validation
event bus behavior
settings key validation
```

## SDK

Must unit test:

```txt
server/client import boundary
public API shape
reserved namespace behavior
error helpers
permission requirement helpers
API wrapper behavior
```

## Data

Must unit test:

```txt
schema validators
query-builder helpers
soft-delete helper payloads
migration guard helpers
seed helper pure logic
```

Do not claim real DB correctness from unit tests.

## Business Objects

Must unit test:

```txt
Zod schemas
permission constants
Business Object event names
service branching where mockable
extension-pattern validators
```

## Modules

Must unit test:

```txt
schemas
permission constants
event constants
manifest validation
small pure service helpers
component behavior
```

## Generators

Must unit test:

```txt
file paths
template output
forbidden patterns
no overwrite behavior
invalid module ID rejection
```

---

# 30. Test Commands

The project should support:

```bash
npm run test
npm run test:run
npm run test:unit
```

Recommended meaning:

```txt
npm run test       → Vitest watch mode for local development
npm run test:run   → run all tests once
npm run test:unit  → run unit tests only, excluding integration/e2e if separated later
```

The exact script names can be finalized during implementation, but the intent must remain clear.

---

# 31. Unit Test Performance

Unit tests should be fast enough to run frequently.

Targets:

```txt
single unit test file: usually under 1 second
full unit suite in early platform: under 10 seconds if possible
generator tests: fast and deterministic
component tests: focused, not full app render
```

Slow tests may belong in integration or e2e suites instead.

---

# 32. Anti-Patterns

## 32.1 Testing implementation instead of behavior

Bad:

```txt
expects internal helper to be called exactly once when user-facing behavior is enough
```

Better:

```txt
expects permission denial result
```

---

## 32.2 Mocking everything

If every dependency is mocked, the test may prove only that mocks work.

Be careful when testing services and APIs.

---

## 32.3 Only testing admin users

Admin users hide permission bugs.

Every permission-sensitive area needs non-admin denial tests.

---

## 32.4 Only testing one organization

Single-org tests hide tenant bugs.

Unit tests may use one org for pure logic, but tenant-sensitive suites need two-org integration/security tests.

---

## 32.5 Testing that generated files exist only

A generator test that only checks file existence is weak.

It must also inspect architecture-critical content.

---

## 32.6 Ignoring failure paths

OneDayOS must fail safely.

Tests must cover denial, invalid input, wrong tenant, disabled module, and missing permission.

---

# 33. Required Claude Rules

When Claude writes unit tests, it must follow these rules:

```txt
1. Do not write tautological tests.
2. Do not test only that a function exists.
3. Do not use admin-only tests for permission-sensitive logic.
4. Do not mock away the security boundary being tested.
5. Do not claim tenant isolation is proven by a unit test alone.
6. Do not claim Prisma behavior is proven by mocked Prisma.
7. Do not introduce Jest, Playwright, Cypress, Pytest, FastAPI, or Python testing without instruction.
8. Do not add real secrets or environment values to tests.
9. Do not snapshot huge unstable UI trees.
10. Do not skip failing tests to make build pass.
11. Do not mark a subsystem complete without denial/failure tests where relevant.
12. Stop and ask for architectural review if a manual rule is ambiguous.
```

---

# 34. Required Unit Test Template for Claude

Claude should use this pattern when implementing a new isolated helper:

```md
Implement unit tests for [UNIT].

Authoritative documents:
- 14-testing-quality/01-unit-testing.md
- related subsystem manual document

Required behavior to test:
- [behavior 1]
- [behavior 2]
- [failure behavior]
- [security behavior if applicable]

Rules:
- Do not write tautological tests.
- Do not mock the function under test.
- Do not use real database, Supabase, or secrets.
- Include at least one failure-path test.
- If tenant-sensitive, do not claim unit tests alone prove tenant isolation.
```

---

# 35. Example: Good Permission Matcher Unit Tests

```ts
describe('matchesPermission()', () => {
  it('allows exact module/resource/action match', () => {
    expect(matchesPermission(
      { module: 'inventory', resource: 'product', action: 'read' },
      { module: 'inventory', resource: 'product', action: 'read' }
    )).toBe(true)
  })

  it('denies when action does not match', () => {
    expect(matchesPermission(
      { module: 'inventory', resource: 'product', action: 'read' },
      { module: 'inventory', resource: 'product', action: 'create' }
    )).toBe(false)
  })

  it('allows full wildcard grant', () => {
    expect(matchesPermission(
      { module: '*', resource: '*', action: '*' },
      { module: 'crm', resource: 'customer', action: 'delete' }
    )).toBe(true)
  })

  it('does not treat read as export', () => {
    expect(matchesPermission(
      { module: 'inventory', resource: 'product', action: 'read' },
      { module: 'inventory', resource: 'product', action: 'export' }
    )).toBe(false)
  })
})
```

---

# 36. Example: Good Schema Unit Tests

```ts
describe('CreateProductSchema', () => {
  it('accepts valid product input', () => {
    const result = CreateProductSchema.safeParse({
      code: 'SKU-001',
      name: 'Test Product',
      unit: 'pcs',
    })

    expect(result.success).toBe(true)
  })

  it('rejects client-supplied orgId', () => {
    const result = CreateProductSchema.safeParse({
      code: 'SKU-001',
      name: 'Test Product',
      unit: 'pcs',
      orgId: 'org_attacker',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const result = CreateProductSchema.safeParse({
      code: 'SKU-001',
      name: 'Test Product',
      unit: 'pcs',
      secretAdminFlag: true,
    })

    expect(result.success).toBe(false)
  })
})
```

---

# 37. Example: Good Generator Unit Test

```ts
describe('module:create output', () => {
  it('generates tenant-scoped API routes', () => {
    const files = generateModuleFiles({ moduleId: 'inventory' })

    expect(files).toHaveProperty(
      'src/app/api/orgs/[orgSlug]/inventory/route.ts'
    )

    expect(files).not.toHaveProperty(
      'src/app/api/inventory/route.ts'
    )
  })

  it('does not generate loose orgId database access', () => {
    const output = Object.values(generateModuleFiles({ moduleId: 'inventory' })).join('\n')

    expect(output).toContain('sdk.getDb(ctx)')
    expect(output).not.toContain('sdk.getDb(orgId)')
    expect(output).not.toContain("searchParams.get('orgId')")
  })

  it('generates tenant-isolation and permission-denial tests', () => {
    const files = generateModuleFiles({ moduleId: 'inventory' })
    const testOutput = Object.values(files).join('\n')

    expect(testOutput).toContain('cannot access another organization')
    expect(testOutput).toContain('returns 403 when permission is missing')
  })
})
```

---

# 38. Minimum Unit Test Acceptance Criteria

A subsystem’s unit test layer is acceptable only if:

```txt
[ ] Pure helpers have meaningful edge-case tests
[ ] Validators reject unknown fields
[ ] Validators reject client-supplied orgId where applicable
[ ] Permission matching covers exact, wildcard, and deny cases
[ ] API helpers map errors to correct JSON status/shape
[ ] Event helpers validate event names and payload constraints
[ ] Generator tests check forbidden output patterns
[ ] Component tests cover visible behavior, not only rendering existence
[ ] No real secrets are used
[ ] No tests require real Supabase or production DB
[ ] No tautological tests are used as completion evidence
[ ] Unit tests do not claim to prove integration/security behavior
```

---

# 39. What This Document Does Not Cover

This document does not fully define:

```txt
integration testing
API route testing
database testing
security testing
UI/e2e testing
CI gates
test data fixtures
production smoke tests
load testing
```

Those are covered in later Testing & Quality documents.

---

# 40. Acceptance Criteria

This document is approved when:

```txt
[ ] Unit testing responsibilities are clear
[ ] Unit testing limits are clear
[ ] Mocking rules are clear
[ ] Tautological tests are explicitly rejected
[ ] PlatformContext boundary testing is addressed
[ ] Permission matcher testing is addressed
[ ] Zod schema testing is addressed
[ ] API helper testing is addressed
[ ] Event helper testing is addressed
[ ] Generator testing is addressed
[ ] React component unit testing is addressed
[ ] Claude implementation rules are explicit
[ ] The document does not weaken tenant isolation or security testing requirements
```

---

# 41. Final Rule

Unit tests are valuable when they prove real isolated behavior.

They are harmful when they give false confidence.

The final rule is:

```txt
Do not ask, “Does this test pass?”
Ask, “What behavior would break if this test failed?”
```

If the answer is unclear, the test is probably weak.
