# OneDayOS Engineering Manual — Regression Testing

**Document ID:** `14-testing-quality/06-regression-testing.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Owner:** OneDayOS Founder / Software Architect  
**Last Updated:** July 2026  
**Implementation Status:** Required Before Restarted Foundation Build  
**Supersedes:** None  
**Depends On:**

- `14-testing-quality/00-testing-philosophy.md`
- `14-testing-quality/01-unit-testing.md`
- `14-testing-quality/02-integration-testing.md`
- `14-testing-quality/03-api-testing.md`
- `14-testing-quality/04-ui-testing.md`
- `14-testing-quality/05-security-testing.md`
- `13-security/07-security-testing.md`
- `13-security/08-production-readiness-gate.md`

---

# 1. Purpose

Regression testing exists to make sure OneDayOS does not repeat the same mistakes.

A regression is not only a broken feature.

A regression is any return of a known bad pattern, including:

```txt
tenant isolation failure
permission enforcement failure
API auth returning redirects
client-supplied orgId
raw Prisma inside modules
module-to-module imports
Business Object duplication
soft-delete bypass
event payload leaking data
generator output creating unsafe code
generic UI pattern replacing approved design
missing tests after a bug fix
```

The restarted OneDayOS platform must treat regressions as architectural failures, not merely bugs.

The rule is:

```txt
If a bug was serious enough to fix,
it is serious enough to test.
```

---

# 2. Core Principle

OneDayOS should improve every time it breaks.

Every bug, security issue, production incident, support escalation, or generator mistake must leave behind either:

```txt
a new regression test
an improved architecture check
a stronger generator rule
a manual amendment
an ADR
or a documented reason why no test is possible
```

No serious bug should be fixed only by editing code.

A code fix without regression protection is temporary.

---

# 3. What Regression Testing Protects

Regression testing protects the platform from repeating known failures in these areas:

```txt
authentication
tenant isolation
permission enforcement
API response behavior
service-layer security
database access
soft delete
Business Object ownership
module boundaries
generated code
events
settings
migrations
seeds
UI navigation
forms
tables
imports and exports
future AI features
future Platform Services
deployment and AppCare operations
```

Regression testing is especially important for OneDayOS because the platform is intended to serve many organizations from one shared codebase.

A small regression can affect many clients.

---

# 4. Regression Test Policy

Every confirmed bug must be classified.

The classification decides what kind of regression protection is required.

| Bug Type | Required Regression Protection |
|---|---|
| Tenant isolation bug | Two-org integration/security test |
| Permission bug | Non-admin denial test |
| API auth bug | API test proving JSON `401` and no redirect |
| API validation bug | Zod/schema/API validation test |
| Soft-delete bug | Integration test against real query path |
| Module generator bug | Generator unit test and architecture check |
| Raw Prisma/module boundary bug | Architecture check |
| Business Object duplication bug | Architecture check or module test |
| Event payload bug | Event schema/unit/security test |
| Migration bug | Migration/seeding integration test |
| UI navigation bug | UI/component test |
| Form submission bug | UI + API validation test |
| Table behavior bug | Component or integration test |
| Deployment/build bug | CI/build check |
| Secret leak bug | Secret scanning/architecture check |
| AI safety bug future | AI safety regression test before AI rollout |

---

# 5. Mandatory Rule: Test Before or With the Fix

When practical, write the regression test before fixing the bug.

Preferred sequence:

```txt
1. Reproduce the bug.
2. Write a failing regression test.
3. Confirm the test fails for the right reason.
4. Fix the bug.
5. Confirm the test passes.
6. Run the full relevant suite.
7. Document the regression in the changelog or issue.
```

If a test cannot be written first, it must be written in the same change set as the fix.

Do not allow:

```txt
fix now, test later
```

unless the system is actively down and the issue is an emergency production incident.

Even then, the post-incident task must include the regression test.

---

# 6. Regression Severity Levels

## 6.1 Critical Regression

A Critical Regression affects tenant isolation, authentication, authorization, production data integrity, secrets, or cross-client data exposure.

Examples:

```txt
Org A user can read Org B records
Org A user can mutate Org B records
unauthenticated API returns protected data
non-admin can perform admin mutation
client-supplied orgId is accepted
service role key exposed to browser
production migration corrupts shared data
AI exposes records the user cannot access
```

Required response:

```txt
[ ] Stop affected release if not deployed
[ ] Patch immediately if deployed
[ ] Add regression test
[ ] Add or update architecture check if possible
[ ] Review generator templates if generated code caused it
[ ] Update Engineering Manual if rule was unclear
[ ] Record issue in risk register or ADR if architectural
```

Critical regressions block production readiness.

---

## 6.2 High Regression

A High Regression affects data correctness, module boundaries, soft delete, API behavior, backup/restore expectations, generated code safety, or important UI workflows.

Examples:

```txt
soft-deleted records appear in normal list
API returns HTML instead of JSON
module imports from @/kernel/*
module imports another module
generated module lacks permission tests
sidebar routes point to missing pages
active route matching highlights wrong nav item
seed script is not idempotent
```

Required response:

```txt
[ ] Add regression test or architecture check
[ ] Fix template/generator if relevant
[ ] Run affected test suite
[ ] Add release note if customer-visible
```

High regressions block official module readiness.

---

## 6.3 Medium Regression

A Medium Regression affects UX consistency, non-critical module behavior, non-sensitive validation, or repeated developer friction.

Examples:

```txt
form error message missing
empty state regresses
table column alignment breaks
tooltip missing on non-obvious field
loading state returns spinner instead of skeleton
```

Required response:

```txt
[ ] Add UI/component regression test if behavior is important
[ ] Update design-system rule if repeated
[ ] Fix component or generator template
```

Medium regressions may not block production, but repeated Medium regressions indicate weak standards.

---

## 6.4 Low Regression

A Low Regression affects polish, copy, spacing, or minor visual details.

Examples:

```txt
minor label typo
small spacing inconsistency
non-critical icon mismatch
```

Required response:

```txt
[ ] Fix when convenient
[ ] Add test only if repeated or part of a critical shared component
```

Do not over-test trivial visual details unless they affect the design system.

---

# 7. Known Historical Regression Sources

The previous MVP Kernel revealed several patterns that must become permanent regression coverage in the restarted build.

Known dangerous historical patterns include:

```txt
org membership check missing in org layout
sdk.permissions.can() existing but not enforced
API auth helper redirecting instead of returning JSON 401
module scaffolds accepting loose orgId
sdk.getDb(orgId) accepting tenant identity directly
soft-delete extension covering only some query paths
sidebar links pointing to missing routes
sidebar active-state using unsafe pathname.startsWith(href)
missing prisma generate in build flow
tautological tests that do not exercise real behavior
register route lacking dedicated tests
proxy/middleware behavior lacking tests
module registry requiring fragile side-effect imports
```

The restarted build must not recreate these patterns.

---

# 8. Required Regression Test Categories

## 8.1 Authentication Regressions

Authentication regression tests must cover:

```txt
unauthenticated page access redirects only from page helpers
unauthenticated API access returns JSON 401
API routes never return login page HTML
registration creates Supabase Auth user and Prisma User in one server-owned flow
registration rolls back or reports cleanly on partial failure
login uses current authenticated user lookup
current-user endpoint is /api/kernel/auth/me
current-user endpoint does not accept arbitrary user IDs
inactive user cannot access protected app
```

Forbidden regression:

```txt
GET /api/kernel/users/[id] as general current-user lookup
```

Reason:

```txt
ID-based current-user lookup invites IDOR bugs.
```

---

## 8.2 Tenant Isolation Regressions

Tenant regression tests must use at least two organizations:

```txt
Org A
Org B
```

And at least two users:

```txt
User A in Org A
User B in Org B
```

Required tests:

```txt
User A cannot load Org B protected route
User A cannot read Org B API records
User A cannot mutate Org B records
User A cannot restore Org B records
User A cannot export Org B records
User A cannot access Org B module settings
User A cannot trigger events against Org B records
client-supplied orgId is rejected
route orgSlug must match authenticated user's organization
```

Tenant isolation is not regression-tested if the suite uses only one organization.

---

## 8.3 Permission Regressions

Permission regression tests must include non-admin users.

Required tests:

```txt
admin with wildcard can perform allowed operation inside own org
staff without permission receives 403
staff with read cannot create
staff with read cannot export
staff with create cannot import unless import permission exists
module enabled does not imply user permission
user permission does not imply module enabled
permission wildcard does not bypass tenant isolation
non-null permission conditions are denied until ABAC exists
```

Forbidden test pattern:

```txt
only testing Admin
```

Reason:

```txt
Admin-only tests hide permission bugs.
```

---

## 8.4 API Behavior Regressions

Every protected API regression suite must verify:

```txt
JSON response only
no redirects
no HTML
401 for unauthenticated
403 for authenticated but unauthorized
safe 404 for wrong organization
404 MODULE_NOT_FOUND for disabled module
400 VALIDATION_ERROR for invalid input
400 TENANT_ID_NOT_ALLOWED for client-supplied orgId
success response shape { data, error, meta? }
error response shape { data: null, error }
```

Forbidden regression:

```txt
API route uses redirect()
API route uses requireAuth() if it redirects
API route returns HTML login page
API route throws unhandled error to client
```

---

## 8.5 Service-Layer Regressions

Services must be tested because APIs are not the only callers.

Required service regression tests:

```txt
service requires PlatformContext
service rejects or cannot accept loose orgId
service enforces permission during MVP
service scopes every query by ctx.org.id
service excludes soft-deleted records by default
service rejects records from another org
service emits event after successful mutation
service does not emit event after failed mutation
service does not return full sensitive records unnecessarily
```

Forbidden service signatures:

```ts
list(orgId: string)
create(orgId: string, input)
delete(id: string)
```

Preferred pattern:

```ts
list(ctx: PlatformContext, input)
create(ctx: PlatformContext, input)
delete(ctx: PlatformContext, id)
```

---

## 8.6 Database Access Regressions

Required regression checks:

```txt
modules never import raw Prisma
modules never import @/kernel/db/client
modules use sdk.getDb(ctx)
sdk.getDb(orgId) does not exist
tenant-scoped findUnique({ where: { id } }) is forbidden
hard delete is forbidden for business data
client-supplied orgId is never used in where clauses
migrations are Prisma-managed
db push is not used in staging/production
```

Recommended enforcement:

```txt
npm run check:architecture
```

---

## 8.7 Soft Delete Regressions

Soft-delete regressions must be tested against real service/query paths.

Required tests:

```txt
soft-deleted records disappear from normal lists
soft-deleted records cannot be read through normal detail APIs
soft-deleted records cannot be updated through normal APIs
soft-deleted records are excluded from search/report/export by default
restore requires explicit permission
restore is tenant-scoped
hard delete is not used for normal business data
delete sets deletedAt and deletedBy
delete emits deleted event
restore emits restored event
```

Do not rely only on Prisma `$extends` tests.

Soft delete is a service/data-access contract, not just a Prisma trick.

---

## 8.8 Business Object Regressions

Required regression checks:

```txt
Inventory does not define Product
CRM does not define Customer
Leave does not define Employee
Purchasing does not define Supplier
Inventory does not define Warehouse
Business Object APIs live under /api/orgs/[orgSlug]/objects/...
Business Object permissions use objects.*
Business Object events use objects.*
module extension tables do not pollute core Business Objects
```

Forbidden generated names:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
InventoryWarehouse
```

Exception:

```txt
InventoryProductExtension
PurchasingSupplierExtension
```

Extension tables are allowed when they extend a shared Business Object without duplicating it.

---

## 8.9 Event Regressions

Event regression tests must verify:

```txt
event name follows {namespace}.{entity}.{past_tense_verb}
Business Object events use objects.*
module-owned events use module namespace
events are emitted from services
events use PlatformContext
payload does not include orgId
payload does not include full Prisma record
payload does not include secrets
payload does not include sensitive fields unless explicitly approved
listener failure does not break original mutation
event not emitted on failed mutation
```

Bad event names:

```txt
send.email
notify.user
inventory.product.created
```

`inventory.product.created` is bad if `Product` is the shared Business Object.

Correct:

```txt
objects.product.created
inventory.stock_movement.created
inventory.stock_level.reorder_threshold_crossed
```

---

## 8.10 Generator Regressions

Generator regressions are especially dangerous because they multiply mistakes.

Every generator bug must result in:

```txt
a generator unit test
an architecture check if possible
a generated fixture test
and a template fix
```

Required generator regression checks:

```txt
generated module does not include orgId in client schemas
generated APIs use /api/orgs/[orgSlug]/...
generated services receive PlatformContext
generated services use sdk.getDb(ctx)
generated services enforce permissions
generated tests include two-org tenant tests
generated tests include permission-denial tests
generated manifests are pure metadata
generated code does not self-register manifests as side effects
generated code does not import @/kernel/*
generated code does not import other modules
generated code does not include FastAPI/Python backend files
```

Forbidden generated patterns:

```txt
orgId: z.string()
request.nextUrl.searchParams.get('orgId')
sdk.getDb(orgId)
await sdk.auth.requireAuth() inside API route if it redirects
/api/[module]
import { prisma } from '@/kernel/db/client'
returns an array
function exists
```

---

## 8.11 UI Regressions

UI regression tests should protect meaningful user behavior.

Required UI regression tests for shared shell:

```txt
sidebar renders enabled modules only
sidebar hides disabled modules
sidebar hides unauthorized module nav
sidebar active match is segment-aware
/inventory does not match /inventory-audit
missing module route does not appear in sidebar
logout works
permission-denied state renders clearly
```

Required form regression tests:

```txt
form does not include orgId field
form does not submit orgId
validation errors show
disabled submit prevents duplicate submission
server error renders safely
success redirects or updates state correctly
```

Required table regression tests:

```txt
empty state renders
loading state renders
row actions respect permissions
delete is optimistic where approved
failed optimistic mutation rolls back or refreshes
sensitive fields do not render by default
```

---

## 8.12 Migration and Seed Regressions

Migration and seed regressions affect every tenant in a shared database.

Required checks:

```txt
migration applies cleanly to staging
migration does not require manual Supabase dashboard edits
seed is idempotent
seed does not overwrite client data
seed does not create duplicate permissions
seed creates required system roles
seed creates required baseline settings
module provisioning is separate from global seed where appropriate
backfill scripts are tenant-aware
backfill scripts support dry-run for risky changes
```

A migration bug should result in:

```txt
migration test
seed test
backfill test
or migration checklist update
```

---

## 8.13 Deployment and Build Regressions

Required regression checks:

```txt
npm run typecheck
npm run lint
npm run test:run
npm run build
prisma generate runs before build or as part of build pipeline
architecture checks pass
environment validation passes
```

Regression examples:

```txt
fresh CI clone fails because Prisma Client was not generated
Vercel build fails because env validation is missing
server secret is imported into client bundle
Next.js route uses old middleware/proxy convention incorrectly
```

Every build/deployment failure should become a CI or checklist regression.

---

# 9. Regression Test Location

Regression tests should live near the layer they protect.

Recommended locations:

```txt
src/kernel/**/__tests__/
src/sdk/**/__tests__/
src/modules/[module]/__tests__/
src/components/**/__tests__/
src/app/api/**/__tests__/
scripts/__tests__/
tests/security/
tests/architecture/
tests/integration/
```

Use `tests/security/` for cross-cutting security tests that involve multiple layers.

Use `tests/architecture/` for static checks that scan source code for forbidden patterns.

---

# 10. Regression Test Naming

Regression tests should be named after the behavior they protect.

Good names:

```txt
denies cross-tenant product read
rejects client-supplied orgId in create schema
returns JSON 401 instead of redirect for unauthenticated API
does not emit event when mutation fails
generated module service uses PlatformContext
sidebar active match does not treat /inventory-audit as /inventory
```

Bad names:

```txt
works
test create
returns data
handles error
fix bug
```

Regression test names should explain the failure mode.

---

# 11. Regression Test Metadata

For serious bugs, include a short comment with issue context.

Example:

```ts
it('returns JSON 401 instead of redirect for unauthenticated API', async () => {
  // Regression: old MVP API routes used redirect-style auth helpers,
  // returning 307/HTML instead of machine-readable JSON errors.
})
```

Do not over-comment every test.

Use metadata comments for:

```txt
security regressions
tenant isolation regressions
production incidents
generator regressions
migration regressions
```

---

# 12. Regression Workflow for Claude

When Claude fixes a bug, the prompt should require:

```txt
1. Identify the bug category.
2. Identify the layer affected.
3. Write or update a regression test.
4. Run the targeted test.
5. Fix the bug.
6. Run the targeted test again.
7. Run relevant broader checks.
8. Summarize the regression protection added.
```

Claude must not respond:

```txt
Fixed.
```

without saying:

```txt
Regression test added:
- [test name/path]
```

If Claude cannot add a regression test, it must explain why and propose an alternate guard.

---

# 13. Regression Workflow for Production Incidents

After a production incident, create a post-incident regression checklist.

Template:

```md
# Incident Regression Checklist

Incident:
Date:
Affected orgs:
Severity:
Root cause:
Fix commit:

## Regression Protection

- [ ] Unit test added
- [ ] Integration test added
- [ ] API test added
- [ ] Security test added
- [ ] Architecture check added
- [ ] Generator template fixed
- [ ] Migration/seed test added
- [ ] Manual amended
- [ ] ADR created
- [ ] CI check updated

## If no test added

Reason:
Alternative guard:
Founder approval:
```

No critical incident should be closed without this checklist.

---

# 14. Regression Workflow for Support Tickets

Not every support ticket needs a regression test.

Use this rule:

```txt
If the ticket reveals a platform bug, add regression protection.
If the ticket is user confusion, improve UX/docs/training.
If the ticket is a client-specific request, classify it as configuration, extension, module, or custom work.
```

Examples:

| Support Ticket | Regression Response |
|---|---|
| User cannot save because validation silently fails | Add form/API validation regression |
| Staff can delete records without permission | Add permission-denial regression |
| Client asks for a new report | No regression; classify feature |
| User asks how to reset password | Improve Founder/User Guide |
| Low-stock alert missing because module setting wrong | Add settings/module test if systemic |

---

# 15. Regression Workflow for Generator Bugs

Generator bugs require extra discipline.

If generated code is wrong, the fix must happen in the generator template, not only in the generated module.

Required steps:

```txt
1. Add failing generator test.
2. Fix generator template.
3. Regenerate fixture.
4. Run generated fixture tests.
5. Run architecture checks against generated output.
6. Update generator safety rails if needed.
```

Never fix only the generated file unless it is a one-off temporary patch.

The generator is the source of truth for future modules.

---

# 16. Regression Workflow for Manual Ambiguity

If a bug happened because the Engineering Manual was unclear, fix the manual.

Examples:

```txt
Manual says modules use SDK but does not say which SDK import path.
Manual says permissions exist but does not say services must enforce them.
Manual says soft delete but does not say findUnique is forbidden.
Manual says events must be emitted but does not define payload safety.
```

Required response:

```txt
[ ] Amend affected manual document
[ ] Add or update ADR if decision changed
[ ] Add test or architecture check
[ ] Update Claude implementation prompt
```

The manual should become clearer after every ambiguity-driven bug.

---

# 17. Regression Coverage Is Not the Same as Coverage Percentage

OneDayOS should not chase coverage percentage blindly.

A codebase can have high coverage and still be unsafe if it only tests happy paths.

Important regression coverage questions:

```txt
Can the wrong tenant access it?
Can the wrong role do it?
Can the disabled module still run it?
Can client input spoof orgId?
Can soft-deleted records appear?
Can generated code recreate the bug?
Can an API fail with HTML instead of JSON?
Can sensitive data leak through logs/events/AI/export?
Can the migration break all tenants?
```

These questions matter more than a raw percentage.

---

# 18. Regression Gate for Pull Requests

Every PR that fixes a bug must include this checklist:

```txt
[ ] Bug category identified
[ ] Regression test added or updated
[ ] Test fails before fix or bug reproduction is documented
[ ] Test passes after fix
[ ] Related generator template updated if applicable
[ ] Related architecture check updated if applicable
[ ] Related manual/ADR updated if ambiguity caused the bug
[ ] Relevant test suite run
[ ] No forbidden patterns introduced
```

If no regression test is added, the PR must say why.

---

# 19. Regression Gate for Releases

Before releasing OneDayOS to production:

```txt
[ ] Critical regression tests pass
[ ] Tenant isolation tests pass
[ ] Permission-denial tests pass
[ ] API auth/JSON tests pass
[ ] Soft-delete tests pass
[ ] Generator safety tests pass
[ ] Architecture checks pass
[ ] Migration/seed checks pass
[ ] Build passes
[ ] Known regression list reviewed
```

Before onboarding a second tenant:

```txt
[ ] Cross-tenant regression tests pass
[ ] Wrong-org safe 404 tests pass
[ ] Client-supplied orgId rejection tests pass
[ ] Permission-denial tests pass with non-admin users
[ ] API routes return JSON 401/403/404
```

---

# 20. Regression Anti-Patterns

The following are forbidden:

```txt
fixing a security bug without a test
testing only Admin users
testing only one organization
mocking away PlatformContext
mocking away permission checks
testing only that a function exists
writing "returns an array" as meaningful service coverage
fixing generated output but not the generator
adding a manual rule but no architecture check when the rule is checkable
using snapshots for unstable large UI trees
closing production incidents without regression follow-up
```

---

# 21. Claude Implementation Rules

Claude must follow these rules when asked to fix regressions:

```txt
1. Do not fix code first unless the bug is trivial.
2. First identify the regression category.
3. Add a failing test or explain why one cannot be written.
4. Do not weaken tests to make them pass.
5. Do not delete failing tests unless the founder/architect approves.
6. Do not replace security tests with snapshots.
7. Do not use Admin-only tests for permission behavior.
8. Do not use one-org tests for tenant behavior.
9. Do not fix generated module output without fixing generator templates.
10. Do not claim completion until targeted and relevant broader checks pass.
```

---

# 22. Minimum Regression Test Matrix

For the restarted foundation build, the minimum regression matrix is:

```txt
Authentication:
  [ ] API unauthenticated returns JSON 401
  [ ] Page unauthenticated redirects appropriately
  [ ] Current-user endpoint is session-derived

Tenant isolation:
  [ ] wrong-org route denied
  [ ] wrong-org API read denied
  [ ] wrong-org API write denied
  [ ] client-supplied orgId rejected

Permissions:
  [ ] staff without permission denied
  [ ] admin wildcard allowed inside own org
  [ ] wildcard does not bypass tenant isolation
  [ ] module enabled does not imply permission

API:
  [ ] no redirects
  [ ] no HTML
  [ ] JSON error shape
  [ ] validation errors stable

Database:
  [ ] module cannot import raw Prisma
  [ ] sdk.getDb(orgId) forbidden
  [ ] tenant-scoped findUnique unsafe pattern blocked

Soft delete:
  [ ] deleted records hidden from normal read
  [ ] restore path explicit
  [ ] hard delete forbidden for business records

Events:
  [ ] mutation emits event after success
  [ ] failed mutation emits no event
  [ ] event payload excludes full records and orgId

Generators:
  [ ] generated module passes architecture checks
  [ ] generated module includes tenant tests
  [ ] generated module includes permission tests

UI:
  [ ] sidebar active matching segment-safe
  [ ] hidden nav does not replace route/API enforcement
  [ ] forms do not submit orgId
```

---

# 23. Acceptance Criteria

This document is accepted when:

```txt
[ ] Regression policy is clear.
[ ] Bug categories map to required test types.
[ ] Critical regressions require tests and architecture checks.
[ ] Tenant, permission, API, soft-delete, event, generator, and UI regressions are covered.
[ ] Claude workflow for bug fixes is defined.
[ ] Production incident regression workflow is defined.
[ ] Generator regression workflow is defined.
[ ] PR and release regression gates are defined.
[ ] Anti-patterns are explicit.
```

---

# 24. Final Rule

The platform should never suffer the same serious bug twice.

If it does, the failure is not only in the code.

It means the regression system failed.

The OneDayOS standard is:

```txt
Every serious bug makes the platform harder to break next time.
```
