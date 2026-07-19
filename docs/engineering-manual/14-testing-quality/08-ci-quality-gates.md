# OneDayOS Engineering Manual — 14 Testing & Quality / 08 CI Quality Gates

**Document ID:** `14-testing-quality/08-ci-quality-gates.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Foundation Build`  
**Owner:** Founder / Software Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `00-meta/04-definition-of-done.md`
- `02-architecture/05-dependency-rules.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/02-prisma-conventions.md`
- `13-security/08-production-readiness-gate.md`
- `14-testing-quality/00-testing-philosophy.md`
- `14-testing-quality/01-unit-testing.md`
- `14-testing-quality/02-integration-testing.md`
- `14-testing-quality/03-api-testing.md`
- `14-testing-quality/04-ui-testing.md`
- `14-testing-quality/05-security-testing.md`
- `14-testing-quality/06-regression-testing.md`
- `14-testing-quality/07-test-data-fixtures.md`

---

# 1. Purpose

This document defines the Continuous Integration quality gates for OneDayOS.

CI is not just automation.

For OneDayOS, CI is the automated enforcement layer for the Engineering Manual.

A pull request, Claude-generated change, or human-written change is not acceptable simply because the app appears to run locally.

It must pass the platform gates that protect:

```txt
architecture
security
tenant isolation
permission enforcement
API behavior
data safety
type safety
test integrity
build correctness
module boundaries
generator safety
```

The original Kernel v2 build already showed why CI quality gates matter. The previous implementation could pass basic tests and build checks while still having open risks: unenforced permissions, incomplete org membership checks, redirect-style API auth, weak generator output, tautological tests, sidebar route issues, and missing Prisma generation in fresh builds.

The restarted build must not repeat that failure mode.

---

# 2. Core Principle

```txt
OneDayOS code is not ready because it works locally.
It is ready only when the automated gates prove it follows the platform contract.
```

CI must protect the product from:

```txt
Claude hallucinating architecture
humans taking shortcuts
security fixes missing regression tests
modules importing Kernel internals
generated code scaling bad patterns
fresh clones failing because generation steps are missing
production deploys missing migration checks
```

CI is the difference between a disciplined platform and a fragile custom-app codebase.

---

# 3. Scope

This document covers:

```txt
required npm scripts
local developer checks
pull request checks
main branch checks
pre-deployment checks
architecture checks
security checks
test checks
Prisma checks
build checks
generator checks
CI workflow structure
failure policy
Claude completion rules
```

This document does not define:

```txt
full deployment operations
incident response
backup scheduling
production migration procedure
monitoring and observability
AppCare operations
```

Those belong to Deployment and Operations documents.

---

# 4. Required Scripts

The restarted platform must expose predictable scripts in `package.json`.

Minimum required scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:unit": "vitest run --config vitest.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:security": "vitest run --config vitest.security.config.ts",
    "test:api": "vitest run --config vitest.api.config.ts",
    "check:prisma": "prisma validate && prisma generate",
    "check:architecture": "tsx scripts/check-architecture.ts",
    "check:generated": "tsx scripts/check-generated-code.ts",
    "check:ux": "tsx scripts/check-ux.ts",
    "test:a11y": "vitest run <approved accessibility tests>",
    "check:all": "npm run check:prisma && npm run lint && npm run typecheck && npm run check:architecture && npm run check:generated && npm run check:ux && npm run test:run && npm run test:a11y && npm run build"
  }
}
```

The exact test config names may change, but the capabilities must exist.

The important rule:

```txt
There must be one command that proves the platform is safe enough to merge.
```

Recommended command:

```bash
npm run check:all
```

---

# 5. Local Developer Gate

Before Claude or a human says “done,” they must run at minimum:

```bash
npm run check:prisma
npm run lint
npm run typecheck
npm run check:architecture
npm run check:ux
npm run test:run
npm run test:a11y
npm run build
```

For security-sensitive work, they must also run:

```bash
npm run test:security
npm run test:api
```

For module work, they must run:

```bash
npm run check:generated
npm run test:integration
npm run test:security
```

Claude must not claim completion with language like:

```txt
This should work.
I believe this is complete.
The implementation is ready.
```

unless it reports which commands passed.

Allowed completion statement:

```txt
Completed. Ran:
- npm run check:prisma
- npm run lint
- npm run typecheck
- npm run check:architecture
- npm run test:run
- npm run build
All passed.
```

If a command was not run, Claude must say so plainly.

---

# 6. Pull Request Gate

Every pull request must pass the PR gate before merge.

Required PR checks:

```txt
[ ] install dependencies using lockfile
[ ] Prisma validate
[ ] Prisma generate
[ ] lint
[ ] typecheck
[ ] architecture check
[ ] unit tests
[ ] API/security tests affected by change
[ ] build
```

For module changes:

```txt
[ ] generated-code safety check
[ ] module manifest validation
[ ] module permission tests
[ ] module-disabled tests
[ ] two-org tenant isolation tests
[ ] event emission tests
[ ] soft-delete tests where applicable
```

For generator changes:

```txt
[ ] generator output snapshot or structural tests
[ ] forbidden-pattern tests
[ ] generated module compiles
[ ] generated module test suite passes
[ ] generated module contains real denial tests
```

For security changes:

```txt
[ ] security regression tests
[ ] two-org tests
[ ] non-admin denial tests
[ ] API failure-shape tests
[ ] architecture checks updated if needed
[ ] manual updated if behavior changes
```

---

# 7. Main Branch Gate

The `main` branch is the source for deployments.

Main must always satisfy:

```bash
npm run check:all
```

A broken `main` branch is a platform incident, not a normal inconvenience.

Rules:

```txt
No direct commits to main after MVP stabilization.
No bypassing failed checks without founder/architect approval.
No deployment from a red main branch.
No merging “temporary fixes” that weaken tenant isolation or permissions.
```

If `main` breaks:

```txt
1. Stop new feature merges.
2. Identify failing gate.
3. Revert or fix immediately.
4. Add regression protection if the break exposed a missing check.
5. Document the cause if it was architectural.
```

---

# 8. Deployment Gate

Before deploying to production, run:

```bash
npm run check:all
```

Production deployment is blocked if any of these fail:

```txt
lint
typecheck
architecture checks
security tests
API tests
Prisma validation
Prisma generation
build
```

For database changes, production deployment is blocked unless:

```txt
[ ] migration reviewed
[ ] migration tested locally
[ ] migration tested in staging
[ ] migration has no destructive surprise
[ ] backup / restore posture understood
[ ] backfill is tenant-safe if present
[ ] rollback or forward-fix plan exists
```

Production deployments must not depend on manual local steps such as:

```txt
remember to run prisma generate
remember to update generated client
remember to import the module somewhere
remember to add permission tests
```

If it is required, it must be automated.

---

# 9. CI Workflow Structure

The default CI workflow should have separate jobs.

Recommended jobs:

```txt
install-and-cache
prisma
lint
typecheck
architecture
unit-tests
api-security-tests
integration-tests
build
generator-checks
```

Do not put everything into one giant opaque job if separate jobs make failures clearer.

However, avoid overengineering CI before the platform stabilizes.

A practical early structure:

```txt
Job 1: static checks
  - install
  - prisma validate
  - prisma generate
  - lint
  - typecheck
  - architecture check

Job 2: tests
  - unit tests
  - API tests
  - security tests

Job 3: build
  - prisma generate
  - next build
```

Integration tests may become a separate job because they require a test database.

---

# 10. Example GitHub Actions Workflow

Initial recommended file:

```txt
.github/workflows/ci.yml
```

Example:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  static-checks:
    name: Static checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Validate Prisma schema
        run: npx prisma validate

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Architecture check
        run: npm run check:architecture

  tests:
    name: Tests
    runs-on: ubuntu-latest
    needs: static-checks

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Unit and security tests
        run: npm run test:run

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: tests

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

This is a starting point, not the final CI architecture.

As soon as integration tests require PostgreSQL, add a dedicated test database strategy.

---

# 11. Prisma CI Gate

Prisma must be checked explicitly.

Required commands:

```bash
npx prisma validate
npx prisma generate
```

Why:

```txt
schema can be invalid even if TypeScript has not reached the failing file
fresh CI clones need generated Prisma Client
Vercel build must not depend on local generated artifacts
```

The old MVP explicitly had a known issue where fresh CI clones could fail because `prisma generate` was not part of the build step.

The restarted platform must fix this permanently.

Build script should include:

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

CI must also run `prisma validate` before build.

Forbidden:

```txt
Skipping prisma generate in CI
Relying on a developer's local generated client
Committing generated client artifacts to avoid generation
Running prisma db push in CI for production checks
Running prisma migrate dev in CI against production
```

---

# 12. Architecture Check Gate

The restarted platform must include:

```bash
npm run check:architecture
```

This command should fail on architecture violations.

Minimum forbidden patterns:

```txt
src/modules/** imports @/kernel/*
src/modules/** imports @/modules/* from another module
src/modules/** imports raw Prisma client
src/modules/** imports @/sdk/server from client components
client components import server-only files
module API routes accept orgId from body/query
module services accept loose orgId as first-class tenant context
module code uses sdk.getDb(orgId)
module code uses prisma.* directly
tenant-scoped code uses findUnique({ where: { id } }) unsafely
API routes use redirect-style page auth helpers
API routes return HTML or redirects for auth failures
generated code contains placeholder security TODOs
FastAPI/Python backend files appear in core platform
```

The architecture checker may start as a simple TypeScript script that scans files.

Example conceptual checks:

```txt
checkForbiddenImports()
checkNoClientSuppliedOrgId()
checkNoSdkGetDbOrgId()
checkNoRawPrismaInModules()
checkNoModuleToModuleImports()
checkNoApiRedirectAuth()
checkNoFastApiBackend()
```

It can later be replaced or supplemented by ESLint rules, dependency-cruiser, or custom AST checks.

The tool is less important than the enforcement.

---

# 13. Generator Safety Gate

The restarted platform must include:

```bash
npm run check:generated
```

This command should generate a temporary sample module and inspect it.

Example flow:

```txt
1. create temporary directory
2. run module generator for sample module
3. inspect generated files
4. assert forbidden patterns are absent
5. assert required files exist
6. assert required tests exist
7. assert generated module compiles if possible
8. clean up temporary directory
```

Generated module must include:

```txt
manifest.ts
permissions.ts
schema.ts
service.ts
events.ts
settings.ts
navigation.ts
ai-context.ts
docs.md
index.ts
README.md
__tests__/service.test.ts
__tests__/api.test.ts
__tests__/security.test.ts
```

Generated module must not include:

```txt
orgId in client schemas
/api/[module] route shape
sdk.getDb(orgId)
raw Prisma imports
@/kernel imports
module-to-module imports
placeholder-only tests
FastAPI files
Python backend files
```

A generator that produces unsafe code is more dangerous than no generator.

---

# 14. API Security Gate

Every protected API route must have tests for:

```txt
[ ] unauthenticated request returns JSON 401
[ ] wrong-org request returns safe 404
[ ] missing permission returns JSON 403
[ ] disabled module returns safe 404 MODULE_NOT_FOUND
[ ] invalid body returns JSON 400 VALIDATION_ERROR
[ ] body with orgId returns TENANT_ID_NOT_ALLOWED
[ ] valid request succeeds
[ ] response shape is { data, error, meta? }
[ ] no redirect is returned
[ ] no HTML login page is returned
```

CI must fail if API test suites fail.

For a module with APIs, no merge without API tests.

For generated APIs, generated tests must already include these cases.

---

# 15. Tenant Isolation Gate

Tenant-sensitive changes must include at least two organizations in tests.

Minimum fixture pair:

```txt
Alpha Org
Beta Org
```

CI must prove:

```txt
Alpha user cannot read Beta data
Alpha user cannot mutate Beta data
Alpha user cannot load Beta org context
Alpha user cannot use Beta orgSlug to access resources
client-supplied orgId cannot switch tenant
admin wildcard does not cross tenant boundary
```

A test suite using only one organization cannot prove tenant isolation.

A test suite using only admin users cannot prove permission safety.

---

# 16. Permission Gate

Permission-sensitive changes must test:

```txt
allowed admin
allowed user with exact permission
denied user without permission
denied inactive user
denied wrong-org user
module-enabled but permission-denied user
module-disabled but permission-granted user
```

CI must reject work where permissions are only checked in the UI.

Required rule:

```txt
API routes and services enforce permission.
UI permission checks improve usability only.
```

---

# 17. Soft Delete Gate

For soft-deletable models, tests must prove:

```txt
normal reads exclude deleted records
normal detail reads do not expose deleted records
soft delete sets deletedAt and deletedBy
restore clears deletedAt and deletedBy
hard delete is not used for business records
deleted records do not appear in search/report/export paths unless explicitly allowed
```

CI must reject unsafe patterns such as:

```txt
prisma.model.delete(...)
prisma.model.deleteMany(...)
findUnique({ where: { id } }) on tenant-scoped business records
```

unless the file is an approved admin/maintenance script with explicit review.

---

# 18. Event Contract Gate

Event-sensitive changes must test:

```txt
event emitted after successful mutation
event not emitted after failed mutation
event name follows naming convention
event payload is minimal
event payload does not include orgId
event payload does not include full Prisma records
event payload does not include sensitive fields
```

CI should run unit tests for event name validators and schema validators.

Future event contract tests should validate manifest-declared events against actual emitted event constants.

---

# 19. UI Quality Gate

UI checks in CI should include:

```txt
component tests for changed UI
permission-aware visibility tests
form validation tests
forms do not render hidden orgId fields
sidebar active-state tests
empty/loading/error state tests where applicable
basic accessibility checks where practical
```

Visual regression testing is deferred until the design system stabilizes.

However, UI work cannot be considered complete if:

```txt
no empty state exists
no loading state exists
no error state exists
permission-hidden actions are untested
forms submit tenant identity
client components import server-only code
```

---

# 20. Environment Variable Gate

CI should validate environment variable structure without requiring production secrets.

Rules:

```txt
.env.example must exist
.env.example must not contain real secrets
server-only env vars must not be NEXT_PUBLIC_*
client env allowlist must be explicit
build must not require production credentials unless unavoidable
```

Recommended checks:

```txt
npm run check:env
```

Future `check:env` should validate:

```txt
required env names exist in schema
no obviously real secrets in .env.example
no NEXT_PUBLIC_DATABASE_URL
no NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
no NEXT_PUBLIC_DIRECT_URL
```

---

# 21. Dependency Gate

CI should protect dependency discipline.

Required:

```txt
npm ci instead of npm install in CI
lockfile committed
no accidental dependency drift
no unnecessary runtime dependencies
no shadcn CLI in production dependencies
```

The old MVP had `shadcn` CLI in `dependencies` even though it should have been a dev dependency.

CI or review should catch this class of issue.

Recommended future check:

```txt
npm run check:dependencies
```

This can enforce:

```txt
CLI/build-only tools are devDependencies
runtime bundle does not include development-only packages
forbidden backend frameworks are absent
FastAPI/Python backend packages are absent
```

---

# 22. Integration Test Database Gate

Integration tests need a safe database strategy.

Rules:

```txt
never use production database in CI
never use staging database for destructive CI tests
use a dedicated test database or disposable local database
reset database between integration test runs
seed deterministic fixtures
use at least two organizations
```

A later implementation may use:

```txt
local PostgreSQL service in GitHub Actions
Supabase local stack
testcontainers
separate CI Supabase project
```

No final provider decision is required in this document.

But the rule is fixed:

```txt
Integration tests must never point at production.
```

---

# 23. Required CI Stages by Project Maturity

## Stage 1 — Restarted foundation build

Required now:

```txt
Prisma validate
Prisma generate
lint
typecheck
architecture check
unit tests
API/security tests for Kernel routes
build
```

## Stage 2 — First official module

Add:

```txt
module integration tests
two-org module tenant tests
module permission-denial tests
module generator safety tests
soft-delete module tests
event emission tests
```

## Stage 3 — Production + AppCare

Add:

```txt
staging migration test
restore drill evidence
deployment smoke tests
monitoring checks
basic Playwright smoke tests
backup configuration checks
```

## Stage 4 — More clients / higher maturity

Add:

```txt
required PR reviews
branch protection
dependabot/security scans
secret scanning
scheduled CI
nightly integration suite
migration dry-run checks
performance smoke checks
```

---

# 24. Branch Protection Rules

Before serious production use, enable branch protection on `main`.

Required protections:

```txt
[ ] require pull request before merge
[ ] require CI checks to pass
[ ] require branch to be up to date before merge
[ ] block force pushes
[ ] block deletion of main
[ ] restrict who can bypass checks
```

Optional later:

```txt
[ ] require code owner review
[ ] require signed commits
[ ] require deployment approval
[ ] require security review for sensitive paths
```

Do not rely on memory or discipline alone.

Use platform controls.

---

# 25. Claude Workflow Requirements

When Claude implements code, its final response must include:

```txt
Files changed
Commands run
Tests added
Tests passed
Known limitations
Manual deviations
```

Claude must not say “done” if it did not run the gates.

Claude must not mark work complete if:

```txt
lint was not run
typecheck was not run
tests were not run
build was not run
architecture checks were not run for architecture-sensitive work
security tests were not added for security-sensitive work
```

Allowed honest statement:

```txt
Implementation is complete, but I could not run integration tests because DATABASE_URL_TEST is not configured.
I added the tests and ran lint/typecheck/unit/build successfully.
```

Forbidden dishonest statement:

```txt
Everything is complete.
```

when gates were skipped.

---

# 26. What CI Must Block Immediately

CI must block these patterns as soon as possible:

```txt
src/modules/** importing @/kernel/*
src/modules/** importing @/modules/other-module
src/modules/** importing Prisma directly
sdk.getDb(orgId)
body.orgId
query orgId in tenant APIs
/api/[module] route shape for protected module APIs
requireAuth() inside API route if it redirects
NextResponse.redirect from API auth failure
full Prisma records in event payloads
orgId in event payloads
hard delete on business records
findUnique({ where: { id } }) on tenant-scoped records
NEXT_PUBLIC_DATABASE_URL
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
FastAPI/Python backend files in core platform
```

If a legitimate exception exists, it must be documented in an ADR.

---

# 27. Non-Goals

CI quality gates should not become too heavy too early.

Do not implement immediately:

```txt
complex enterprise CI/CD pipelines
multi-environment promotion dashboards
full automated migration rollback system
full performance benchmarking suite
full visual regression system
full browser E2E suite for every feature
SAST/DAST enterprise stack
Dockerized production runtime
Kubernetes deployment checks
FastAPI/Python CI jobs
```

Start with the gates that protect the core platform risks.

Expand when the product and client base justify it.

---

# 28. Anti-Patterns

## Anti-pattern: CI only runs build

Bad:

```txt
npm run build passes, so we merge.
```

Why bad:

```txt
build does not prove tenant isolation
build does not prove permission denial
build does not prove API failure behavior
build does not prove architecture boundaries
```

## Anti-pattern: tests without denial paths

Bad:

```txt
Admin can create product.
Admin can update product.
Admin can delete product.
```

Missing:

```txt
Staff without permission cannot create product.
Wrong-org user cannot read product.
Client-supplied orgId is rejected.
```

## Anti-pattern: architecture violations accepted because tests pass

Bad:

```txt
Module imports @/kernel/db/client but tests pass.
```

Why bad:

```txt
The platform boundary is broken even if behavior works today.
```

## Anti-pattern: generated code trusted without generated-code tests

Bad:

```txt
The module generator works because it creates files.
```

Correct:

```txt
The module generator works because generated files compile, pass tests, and contain no forbidden patterns.
```

## Anti-pattern: skipped tests hidden in final answer

Bad:

```txt
Done.
```

when tests were not run.

Correct:

```txt
Done. I ran lint, typecheck, unit tests, and build. Integration tests were not run because test DB is not configured.
```

---

# 29. Acceptance Criteria

This document is satisfied when:

```txt
[ ] package.json exposes required check scripts
[ ] build script includes Prisma generation
[ ] CI workflow exists
[ ] CI runs npm ci
[ ] CI runs prisma validate
[ ] CI runs prisma generate
[ ] CI runs lint
[ ] CI runs typecheck
[ ] CI runs architecture checks
[ ] CI runs tests
[ ] CI runs build
[ ] check:architecture catches forbidden imports and tenant-risk patterns
[ ] check:generated validates generator output
[ ] security-sensitive changes require denial tests
[ ] module changes require tenant and permission tests
[ ] branch protection plan is documented
[ ] Claude completion rules are documented
```

---

# 30. Claude Implementation Instructions

When implementing CI quality gates, Claude must:

```txt
1. Read this document.
2. Read the SDK Testing Contract.
3. Read Security Testing.
4. Read Prisma Conventions.
5. Implement only the CI/check scripts requested.
6. Do not add unrelated deployment infrastructure.
7. Do not add FastAPI/Python jobs.
8. Do not add enterprise CI complexity unless explicitly requested.
9. Prefer simple architecture-check scripts first.
10. Add tests for architecture-check scripts where practical.
11. Run the final check commands.
12. Report exactly what passed and what was not run.
```

Claude must not:

```txt
hide failing tests
remove tests to make CI pass
weaken architecture checks to pass CI
skip Prisma generation
ignore generated-code safety
add secrets to CI logs
use production database in tests
```

---

# 31. Founder Review Checklist

Before approving this document, confirm:

```txt
[ ] Do we agree CI is required before serious platform work?
[ ] Do we agree build-only checks are insufficient?
[ ] Do we agree architecture checks are mandatory?
[ ] Do we agree generated-code safety must be checked?
[ ] Do we agree Prisma generation must be part of build/CI?
[ ] Do we agree security-sensitive work requires denial tests?
[ ] Do we agree two-org tests are mandatory for tenant-sensitive behavior?
[ ] Do we agree Claude must report commands run before claiming completion?
```

---

# 32. Summary

CI is not bureaucracy.

CI is how OneDayOS protects itself from becoming a fragile collection of custom apps.

The most important gates are:

```txt
Prisma validate/generate
lint
typecheck
architecture checks
security tests
API tests
module tests
build
generator safety checks
UX structural checks
automated accessibility checks
```

The core rule is:

```txt
A OneDayOS change is not safe because it compiles.
It is safe when the gates prove it follows the platform contract.
```

---

# ADR-0011 UX CI Amendment

CI now includes the approved automated UX and accessibility gates:

```txt
npm run check:ux
npm run test:a11y
```

Current purpose:

- `check:ux` verifies UX Contract, Process Flow, shell, page-pattern, loading/error, and fake-metric safety requirements.
- `test:a11y` runs the approved axe-compatible jsdom accessibility checks for selected shared patterns and Inventory surfaces.

These scripts are active after Automated UX and Accessibility Gates Package 5.

Manual UX review remains required because automated checks cannot prove task fit or workflow comprehension.
