# OneDayOS Engineering Manual — 14 Testing & Quality / 00 Testing Philosophy

**Document ID:** `14-testing-quality/00-testing-philosophy.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Restarted Foundation Build  
**Owner:** OneDayOS Founder + Software Architect  
**Last Updated:** July 2026  
**Depends On:**

- `00-meta/04-definition-of-done.md` — planned
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/01-tenancy-data-isolation.md`
- `08-module-system/09-module-testing.md`
- `09-cli-generators/05-test-generator.md`
- `13-security/07-security-testing.md`
- `13-security/08-production-readiness-gate.md`

---

# 1. Purpose

This document defines the testing philosophy for OneDayOS.

Testing in OneDayOS is not merely about preventing broken buttons or broken functions.

Testing exists to protect:

```txt
Tenant isolation
Permission enforcement
API contracts
SDK boundaries
Module boundaries
Business Object ownership
Soft-delete behavior
Event contracts
Generator output
Design-system consistency
Production readiness
AppCare reliability
```

OneDayOS is a shared platform for multiple client organizations. A bug is not only a feature problem. A bug can become a cross-client data leak, a broken AppCare promise, or a permanent architecture drift.

Therefore, OneDayOS tests must prove that the platform behaves correctly **when things go wrong**, not only when the happy path works.

---

# 2. Core Philosophy

The testing philosophy of OneDayOS is:

```txt
Tests are architecture enforcement.
```

They are not optional cleanup after implementation.

They are how the Engineering Manual becomes executable.

If the manual says:

```txt
Modules must not import from @/kernel/*
```

then the test/check system must catch violations.

If the manual says:

```txt
Client-supplied orgId is forbidden
```

then generated APIs must have tests proving that `orgId` in the request body is rejected.

If the manual says:

```txt
Permissions are enforced in APIs and services
```

then every protected mutation must have a denial test.

If the manual says:

```txt
Wrong-org access must fail safely
```

then every tenant-sensitive route must have a two-organization test.

The goal is not high test count.

The goal is high architectural confidence.

---

# 3. Why Testing Matters More in OneDayOS Than in a Normal CRUD App

A normal single-client internal app can sometimes survive weak tests because the blast radius is small.

OneDayOS cannot.

OneDayOS has:

```txt
One shared platform
One shared deployment
One shared database
Many client organizations
Reusable modules
Shared Business Objects
AI-assisted development
Generated code
Recurring AppCare obligations
```

That means one mistake can affect every client.

Examples:

```txt
A bad tenant query can leak Client A data to Client B.
A missing permission check can let staff delete restricted records.
A broken migration can affect all organizations.
A weak generator can create insecure modules repeatedly.
A bad shared component can damage every module UI.
A bad event payload can leak sensitive business data to future services.
```

Testing is therefore not a nice-to-have.

It is part of the business model.

---

# 4. Required Mindset

Engineers and AI coding agents must think this way:

```txt
Does it work?
```

is not enough.

They must also ask:

```txt
Does it fail safely?
Can another tenant access it?
Can an unauthorized user do it?
Can a client fake orgId?
Can a module bypass the SDK?
Can soft-deleted data leak?
Can a generated module repeat this mistake?
Will this still be safe when 100 organizations exist?
```

A feature is not done until the dangerous paths are tested.

---

# 5. Testing Principles

## 5.1 Test behavior, not implementation trivia

Good tests prove observable platform behavior.

Bad tests only prove that a function exists.

Bad:

```ts
expect(typeof service.create).toBe('function')
```

Good:

```ts
await expect(
  service.create(staffCtxWithoutPermission, input)
).rejects.toMatchObject({ code: 'FORBIDDEN' })
```

Bad:

```ts
expect(Array.isArray(await service.list(ctx))).toBe(true)
```

Good:

```ts
const records = await service.list(orgACtx)
expect(records).toContainEqual(expect.objectContaining({ orgId: orgA.id }))
expect(records).not.toContainEqual(expect.objectContaining({ orgId: orgB.id }))
```

---

## 5.2 Test denial paths as first-class behavior

OneDayOS must test failures deliberately.

Every protected feature should prove:

```txt
Unauthenticated users are denied
Wrong-organization users are denied
Users without permission are denied
Disabled modules are denied
Invalid input is denied
Client-supplied orgId is denied
Soft-deleted records are hidden
```

A feature that only tests success is not production-ready.

---

## 5.3 Use at least two organizations in tenant-sensitive tests

A test with only one organization cannot prove tenant isolation.

Bad fixture:

```txt
Org A
Admin A
Records A
```

Good fixture:

```txt
Org A
Admin A
Staff A
Records A

Org B
Admin B
Staff B
Records B
```

Every tenant-sensitive test suite must include at least two organizations.

This applies to:

```txt
Kernel tests
SDK tests
Business Object tests
Module tests
API tests
Service tests
Search tests later
Reporting tests later
AI tests later
Import/export tests later
Background job tests later
```

---

## 5.4 Do not rely only on Admin users

Admin users often have wildcard permissions.

If tests only use Admin users, permission bugs are hidden.

Every permission-sensitive suite needs at least:

```txt
Admin user with wildcard permission
Staff user with required permission
Staff user without required permission
User from another organization
Unauthenticated request
```

Admin tests prove that allowed operations work.

Non-admin denial tests prove that authorization works.

Both are required.

---

## 5.5 Test the API and the service layer

API tests alone are not enough.

Service tests alone are not enough.

OneDayOS must test both.

API tests prove:

```txt
HTTP route shape
JSON response shape
Auth behavior
Tenant context creation
Validation
Error mapping
No redirects
No HTML login responses
```

Service tests prove:

```txt
Business operation rules
Permission enforcement
Tenant scoping
Soft-delete behavior
Event emission
Transaction behavior
```

The reason is simple:

```txt
A route can be correct while a service remains unsafe.
A service can be correct while a route maps errors badly.
```

Both layers matter.

---

## 5.6 Generated code must include tests by default

OneDayOS uses AI-assisted development and future CLI generators.

That means tests must be generated with the code.

A generated module without tests is not acceptable.

The Module Generator must create tests for:

```txt
Tenant isolation
Permission denial
Client-supplied orgId rejection
API 401 JSON
API 403 JSON
Safe wrong-org 404
Validation errors
Soft delete if applicable
Event emission if applicable
Forbidden imports
```

The generator should never produce placeholder tests that make the suite look complete without proving anything.

---

## 5.7 Tests should become regression locks for every serious bug

Every serious bug must become a regression test.

Especially:

```txt
Tenant isolation bugs
Permission bugs
API auth bugs
Soft-delete leaks
Migration failures
Generator safety bugs
Business Object duplication bugs
Event contract bugs
Sensitive-data leaks
AI data-access bugs later
```

A bug is not truly fixed until the test suite would fail if the bug returned.

---

## 5.8 Tests must support AppCare

AppCare includes hosting, monitoring, security updates, backups, bug fixes, AI support, and maintenance.

Testing protects AppCare margins.

Without good tests:

```txt
Every update becomes scary
Every client becomes a manual QA problem
Bug fixes regress
Security patches break modules
Support cost increases
One-day delivery becomes risky
```

With good tests:

```txt
Updates are safer
Modules are reusable
Claude can implement faster
Regressions are caught earlier
AppCare is easier to deliver
```

---

# 6. What Counts as Done

For OneDayOS, implementation is not done when the feature visually works.

Implementation is done only when:

```txt
[ ] The happy path works
[ ] The unauthenticated path is tested
[ ] The wrong-tenant path is tested
[ ] The unauthorized path is tested
[ ] The invalid-input path is tested
[ ] Client-supplied orgId is rejected where applicable
[ ] Soft-deleted records are hidden where applicable
[ ] Event emission is tested where applicable
[ ] Sensitive data is not leaked in response/events/logs
[ ] Architecture checks pass
[ ] TypeScript passes
[ ] Build passes
[ ] Tests pass
[ ] The implementation follows the frozen Engineering Manual
```

A feature can be functional and still not done.

---

# 7. Test Categories

OneDayOS should use several types of tests.

Each protects a different risk.

---

## 7.1 Unit tests

Unit tests verify small pure or near-pure logic.

Examples:

```txt
Slug generation
Permission matching
Event name validation
Field metadata validation
API error formatting
Date/status helpers
Soft-delete helper behavior
Navigation active-state matching
```

Use unit tests when logic is isolated and does not need database behavior.

Unit tests should be fast and focused.

---

## 7.2 Service tests

Service tests verify business behavior.

Examples:

```txt
EmployeeService.create(ctx, input)
ProductService.softDelete(ctx, id)
InventoryService.createAdjustment(ctx, input)
LeaveService.submitRequest(ctx, input)
```

Service tests must verify:

```txt
PlatformContext is required
Permission enforcement
Tenant scoping
Validation assumptions
Soft delete
Event emission
Transaction behavior
```

Service tests are critical because service methods are where real business mutations happen.

---

## 7.3 API tests

API tests verify HTTP behavior.

Examples:

```txt
GET /api/kernel/auth/me
POST /api/orgs/[orgSlug]/objects/products
DELETE /api/orgs/[orgSlug]/inventory/stock-adjustments/[id]
```

API tests must verify:

```txt
JSON-only responses
401 for unauthenticated requests
403 for authenticated but unauthorized users
Safe 404 for wrong-org access
Validation errors
Client-supplied orgId rejection
Response shape: { data, error, meta? }
No redirects
No HTML responses
```

API tests protect frontend behavior and external contract stability.

---

## 7.4 Integration tests

Integration tests verify several layers working together.

Examples:

```txt
Register user → create org → create admin role → login → resolve PlatformContext
Create product → event emitted → product visible only in same org
Soft delete supplier → normal list hides it → restore path can find it
Enable module → nav appears for permitted user → API allows route
```

Integration tests should use realistic fixtures.

They should not mock away the boundary being tested.

---

## 7.5 Architecture tests

Architecture tests verify that the codebase still follows the manual.

They should catch forbidden patterns such as:

```txt
src/modules/** imports @/kernel/*
src/modules/** imports another module
src/modules/** imports raw Prisma
sdk.getDb(orgId)
where: { orgId: body.orgId }
request.nextUrl.searchParams.get('orgId')
/api/[module] route shapes
redirect-based auth helpers in API routes
findUnique({ where: { id } }) on tenant-scoped records
full Prisma records in event payloads
NEXT_PUBLIC_DATABASE_URL
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
```

Architecture tests are how we prevent Claude from quietly drifting.

---

## 7.6 UI tests

UI tests verify key interface behavior.

Examples:

```txt
Forms show validation errors
Tables show empty/loading states
Permission-hidden buttons are not visible
Danger actions require confirmation where applicable
Sidebar active state is correct
Disabled module navigation is absent
```

UI tests are not a replacement for API/service security tests.

Hidden buttons are usability only.

APIs and services still enforce security.

---

## 7.7 End-to-end tests

End-to-end tests are deferred for the earliest foundation build unless absolutely necessary.

They are useful later for critical flows:

```txt
Register organization
Login
Create employee
Create product
Enable module
Create first module record
Permission denial from UI
```

But E2E tests are slower and more brittle.

They should complement, not replace, service/API tests.

---

## 7.8 Manual QA checklists

Manual QA remains useful for:

```txt
Visual quality
Design system feel
Keyboard interaction
Mobile responsiveness
One-day delivery demos
Client handover flows
```

Manual QA should not be used as the only proof of tenant isolation or permission enforcement.

Security behavior must be automated.

---

# 8. The Minimum Test Matrix for Protected Features

Every protected API/service pair should usually include this matrix.

| Case | Expected Result |
|---|---|
| Unauthenticated request | `401 UNAUTHENTICATED` JSON |
| Authenticated user from wrong org | Safe `404` or tenant-denial response |
| Authenticated user without permission | `403 FORBIDDEN` JSON |
| Authenticated user with permission | Success |
| Module disabled for org | Safe `404 MODULE_NOT_FOUND` |
| Request body contains `orgId` | `400 TENANT_ID_NOT_ALLOWED` |
| Invalid body | `400 VALIDATION_ERROR` |
| Soft-deleted target record | Safe `404 RECORD_NOT_FOUND` |
| Valid mutation | Emits correct event |
| Failed mutation | Does not emit success event |

Not every feature needs every row, but security-sensitive exceptions require explicit explanation.

---

# 9. Test Data Philosophy

Test fixtures must represent real OneDayOS risks.

Minimum reusable fixture set:

```txt
Org A
  Admin A
  Staff A with permission
  Staff A without permission
  Employee A
  Product A
  Customer A
  Supplier A
  Warehouse A

Org B
  Admin B
  Staff B
  Employee B
  Product B
  Customer B
  Supplier B
  Warehouse B
```

Tests should avoid magical single-org fixtures for tenant-sensitive behavior.

Fixture names should make cross-tenant mistakes obvious.

Good:

```txt
orgAProduct
orgBProduct
orgAAdminCtx
orgBStaffCtx
```

Bad:

```txt
product1
product2
user1
user2
```

---

# 10. Mocking Philosophy

Mocks are allowed, but they must not erase the risk being tested.

Bad mock:

```ts
vi.mock('@/sdk/server', () => ({
  sdk: {
    permissions: { require: vi.fn().mockResolvedValue(true) },
  },
}))
```

if the test is supposed to prove permission denial.

Good mock:

```txt
Mock external provider behavior
Mock email/SMS provider later
Mock AI provider later
Mock clock/time
Mock network failure
```

Be careful mocking:

```txt
PlatformContext creation
Permission checks
Tenant filters
Database results
Event bus
```

If the test is about the boundary, do not mock away the boundary.

---

# 11. Tests and PlatformContext

`PlatformContext` is a core safety primitive.

Tests must verify that services use it.

Correct service shape:

```ts
ProductService.create(ctx, input)
```

Forbidden service shape:

```ts
ProductService.create(orgId, input)
ProductService.create(userId, orgId, input)
ProductService.create(inputWithOrgId)
```

Tests should include:

```txt
service rejects invalid/missing context
service scopes all reads to ctx.org.id
service writes orgId from ctx.org.id
service records actor from ctx.user.id
service does not trust input.orgId
```

The point is to prevent loose tenant IDs from returning.

---

# 12. Tests and Client-Supplied orgId

Client-supplied `orgId` is forbidden in tenant-scoped APIs and forms.

Every generated API body schema should reject it.

Required test:

```ts
const response = await postJson(route, {
  name: 'Test Product',
  orgId: orgB.id,
})

expect(response.status).toBe(400)
expect(await response.json()).toMatchObject({
  data: null,
  error: { code: 'TENANT_ID_NOT_ALLOWED' },
})
```

This test is mandatory because client-supplied `orgId` is one of the easiest ways to accidentally create cross-tenant writes.

---

# 13. Tests and Permissions

Permission tests must prove both allow and deny behavior.

Required patterns:

```txt
User has exact permission → allowed
User lacks permission → denied
User has wildcard permission within same org → allowed
User has wildcard permission but wrong org → denied
User has read but not export → export denied
User has create but not import → import denied
```

Admin wildcard permissions are useful, but they do not prove normal permission behavior.

---

# 14. Tests and Soft Delete

Soft delete must be tested as behavior, not only as a Prisma extension.

Required patterns:

```txt
Normal list excludes deleted records
Normal detail excludes deleted records
Normal update cannot update deleted records
Normal delete is idempotent or safely handled
Restore path can see deleted record only with explicit permission
Deleted record remains tenant-scoped
Hard delete is not used for normal business records
```

Do not rely only on tests that prove `$extends` injects `deletedAt: null`.

Some Prisma query paths can bypass extension behavior.

Services and tests must protect the lifecycle contract.

---

# 15. Tests and Events

Events are platform contracts.

Tests must verify:

```txt
Successful mutation emits expected event name
Event name follows naming convention
Payload includes safe IDs and changedFields where applicable
Payload does not include orgId
Payload does not include full Prisma record
Payload does not include sensitive fields
Failed mutation does not emit success event
Event emitted after database mutation succeeds
```

Events are not just internal callbacks.

Future services such as Audit Log, Search, Activity Feed, Notifications, Reporting, and AI may rely on them.

Wrong event names are contract bugs.

---

# 16. Tests and Business Objects

Business Object tests must protect shared ownership.

Required checks:

```txt
Product APIs use objects.product.* permissions
Customer APIs use objects.customer.* permissions
Employee APIs use objects.employee.* permissions
Supplier APIs use objects.supplier.* permissions
Warehouse APIs use objects.warehouse.* permissions
Product events use objects.product.*
Customer events use objects.customer.*
Employee events use objects.employee.*
Modules do not create duplicate shared entities
Extension tables reference Business Objects tenant-safely
```

Example forbidden generator/code pattern:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
```

unless they are explicitly named and designed as extension tables, not duplicate shared entities.

---

# 17. Tests and Module System

Every module must prove:

```txt
The module can be enabled for one org and disabled for another
Disabled module routes fail safely
Enabled module still requires user permission
Module navigation appears only when enabled and permitted
Module services use PlatformContext
Module APIs use /api/orgs/[orgSlug]/[moduleId]/...
Module events are declared and emitted correctly
Module does not import Kernel internals
Module does not import another module
Module does not use raw Prisma
```

A module without module-boundary tests is not official.

---

# 18. Tests and Generators

Generator tests are critical because bad generated code repeats mistakes.

Generator tests must verify that generated files do not contain forbidden patterns.

Examples:

```txt
sdk.getDb(orgId)
input.orgId
body.orgId
searchParams.get('orgId')
from '@/kernel/'
from '@/modules/other-module'
new PrismaClient inside module
/api/[module]
redirect('/login') inside API route
permissions: ['create', 'read']
```

Generator tests must also verify that generated modules include real tests.

A generator that creates insecure code is worse than no generator.

---

# 19. Tests and Design System

The design system should also be protected.

Not every visual choice needs snapshot testing.

But core UI behavior should be tested:

```txt
DataTable renders headers, rows, empty states, loading states
Forms render validation errors and help text
Dialogs trap focus where applicable
Sidebar active matching avoids unsafe prefix bugs
Permission-hidden buttons are absent
Keyboard interactions work for critical actions
```

Avoid brittle tests that fail because spacing changed.

Prefer behavior and accessibility tests over pixel-perfect tests.

Visual review remains part of founder QA.

---

# 20. Tests and AI-Assisted Development

Claude Code should not be trusted to remember every rule.

Tests and architecture checks should catch mistakes.

Claude implementation prompts must require:

```txt
Run existing tests
Add new tests
Run typecheck
Run architecture checks
Run build
Report any skipped tests
Report any manual verification needed
```

Claude must not claim completion if:

```txt
Tenant-denial tests are missing
Permission-denial tests are missing
API 401/403 tests are missing
Generated tests are placeholders
Architecture checks fail
TypeScript fails
Build fails
```

AI-assisted speed is useful only if tests preserve correctness.

---

# 21. Testing Commands

The standard commands should eventually be:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run check:architecture
npm run build
```

The exact scripts will be finalized in the CI Quality Gates document.

Minimum expectation:

```txt
No subsystem is complete unless the relevant checks pass.
```

---

# 22. CI Philosophy

CI should block unsafe code.

It should not be ceremonial.

CI should catch:

```txt
Type errors
Broken tests
Build failures
Forbidden imports
Forbidden route patterns
Unsafe orgId patterns
Missing Prisma generation
Generator output violations
```

Future CI may also include:

```txt
E2E smoke tests
Accessibility checks
Dependency audits
Migration dry runs
Schema drift checks
```

Do not add heavy CI too early if it slows development without protecting real risks.

But do add checks that prevent known OneDayOS architecture failures.

---

# 23. Coverage Philosophy

OneDayOS does not chase arbitrary coverage percentages.

High coverage can still miss the dangerous cases.

A 90% coverage suite that never tests wrong-org access is weak.

A smaller suite that proves tenant isolation, permissions, API contracts, and generator safety is much more valuable.

Coverage can be useful later as a trend signal, but it must not replace risk-based testing.

Priority order:

```txt
Security-critical behavior
Tenant isolation
Permission enforcement
API contracts
Generator safety
Database lifecycle behavior
Module boundaries
Business workflows
UI behavior
```

---

# 24. Anti-Patterns

The following testing patterns are rejected.

## 24.1 Tautological tests

Bad:

```ts
expect(result).toBeDefined()
```

when the real risk is tenant leakage.

---

## 24.2 Admin-only tests

Bad:

```txt
All tests run as Admin.
```

This hides permission bugs.

---

## 24.3 Single-org security tests

Bad:

```txt
Only one organization exists in fixtures.
```

This cannot prove tenant isolation.

---

## 24.4 Mocking away permissions

Bad:

```txt
Permission helper always returns true.
```

when testing protected operations.

---

## 24.5 Testing implementation but not contract

Bad:

```txt
Test that a certain internal helper was called.
```

Better:

```txt
Test that the unauthorized request gets 403 JSON.
```

---

## 24.6 Snapshot-heavy UI tests

Avoid tests that fail because harmless markup changes.

Use behavior and accessibility checks instead.

---

## 24.7 Tests that pass with insecure generated code

A generator test that still passes when generated code uses `sdk.getDb(orgId)` is useless.

---

# 25. Required Testing Documents After This One

This philosophy document is the umbrella.

The following documents define details:

```txt
14-testing-quality/01-unit-testing.md
14-testing-quality/02-integration-testing.md
14-testing-quality/03-api-testing.md
14-testing-quality/04-ui-testing.md
14-testing-quality/05-security-testing.md
14-testing-quality/06-regression-testing.md
14-testing-quality/07-test-data-fixtures.md
14-testing-quality/08-ci-quality-gates.md
```

Each lower-level document must follow this philosophy.

---

# 26. Claude Code Rules

When Claude implements any subsystem, it must follow these rules:

```txt
1. Read the relevant frozen manual document first.
2. Identify required tests before or during implementation.
3. Do not write only happy-path tests.
4. Use two organizations for tenant-sensitive tests.
5. Include non-admin permission-denial tests.
6. Test API errors as JSON, not redirects.
7. Test client-supplied orgId rejection where applicable.
8. Test event emission and non-emission where applicable.
9. Add architecture checks for forbidden patterns where applicable.
10. Run the required commands before claiming completion.
```

Claude must report any missing test infrastructure instead of silently skipping required tests.

---

# 27. Founder Review Checklist

Before this document is frozen, confirm:

```txt
[ ] Testing is treated as architecture enforcement
[ ] Two-organization tests are mandatory for tenant-sensitive behavior
[ ] Non-admin permission-denial tests are mandatory
[ ] API tests must prove JSON errors and no redirects
[ ] Generated modules must include real tests
[ ] Tautological tests are rejected
[ ] Regression tests are required for serious bugs
[ ] Tests support AppCare and one-day delivery
[ ] The philosophy does not over-prioritize arbitrary coverage numbers
[ ] The document gives Claude clear testing expectations
```

---

# 28. Acceptance Criteria

This document is accepted when:

```txt
[ ] It clearly explains why tests matter for OneDayOS as a platform
[ ] It distinguishes behavior tests from weak implementation tests
[ ] It requires denial-path testing
[ ] It requires two-org tenant-isolation testing
[ ] It requires permission-denial testing
[ ] It treats generator tests as first-class
[ ] It connects testing to AppCare reliability
[ ] It gives Claude implementation rules
[ ] It sets the foundation for the detailed testing documents
```

---

# 29. Final Rule

The final testing rule is:

```txt
A OneDayOS feature is not done because it works for the right user.
It is done when it also fails safely for the wrong user.
```

That is the difference between a demo app and a business operating system.
