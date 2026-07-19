# OneDayOS Engineering Manual — 13 Security / 08 Production Readiness Gate

**Document ID:** `13-security/08-production-readiness-gate.md`  
**Version:** 2.0  
**Status:** Frozen  
**Implementation Allowed:** Yes — frozen as production readiness gate authority  
**Supersedes:** `onedayos-engineering-manual-13-security-08-production-readiness-gate-v1.md`  
**Owner:** Founder + Software Architect  
**Last Updated:** July 2026  

---

# 1. Purpose

This document defines when OneDayOS is allowed to move from architecture and development into real client use.

This is not a normal launch checklist.

OneDayOS is a shared multi-tenant business operating system. A mistake in authentication, tenancy, permissions, migrations, backups, or generated code can affect multiple client organizations.

The Production Readiness Gate exists to answer one question:

```txt
Is this platform safe enough to operate for real client businesses?
```

If the answer is no, OneDayOS must not onboard clients, enable official modules, or claim AppCare-grade reliability.

---

# 2. Why This Gate Exists

The previous MVP Kernel proved useful ideas:

```txt
shared database
org_id tenancy
Supabase Auth
Prisma
module registry
SDK-only module access
Business Objects
Event Bus
Module Builder CLI
soft delete
Three Client Rule
Dynamic Form Engine gate
```

But it also exposed serious risks:

```txt
org membership checks were incomplete
permissions existed but were not enforced
API auth could redirect instead of returning JSON 401
module scaffolding could encourage loose orgId handling
soft-delete coverage could be bypassed
some tests were tautological
live migration and seed were not verified against real Postgres
```

The restarted OneDayOS build must not reproduce those weaknesses.

This gate turns those lessons into mandatory launch conditions.

---

# 3. Core Principle

```txt
A OneDayOS release is not production-ready because it builds.
It is production-ready only when it fails safely.
```

A production-ready foundation must safely handle:

```txt
unauthenticated users
wrong organization access
missing permissions
disabled modules
invalid input
client-supplied tenant IDs
soft-deleted records
bad migrations
failed seeds
missing secrets
expired sessions
backup restoration
Claude-generated unsafe code
```

---

# 4. Gate Levels

Production readiness is not one yes/no event. OneDayOS should pass gates progressively.

## Gate 0 — Manual Gate

Required before Claude restarts implementation.

```txt
Goal: Claude has frozen architecture to follow.
Risk controlled: architecture invention.
```

Claude may not begin the restarted foundation build until the required architecture/security documents are approved.

---

## Gate 1 — Local Foundation Gate

Required before the foundation branch is considered locally complete.

```txt
Goal: the platform works locally with realistic test data.
Risk controlled: false confidence from mocks and shallow tests.
```

---

## Gate 2 — Staging Gate

Required before production deployment.

```txt
Goal: the platform works in a hosted environment with real Supabase/Postgres/Vercel behavior.
Risk controlled: local-only success.
```

---

## Gate 3 — First Client Gate

Required before onboarding the first real paying client.

```txt
Goal: OneDayOS can safely support one client organization in production.
Risk controlled: client-impacting defects.
```

---

## Gate 4 — Second Tenant Gate

Required before onboarding a second client organization into the same production database.

```txt
Goal: prove tenant isolation before multi-tenant production.
Risk controlled: cross-client data exposure.
```

This is the most important gate in the early company.

---

## Gate 5 — Official Module Gate

Required before any module is considered official and reusable.

```txt
Goal: a module is secure, tenant-safe, permission-safe, test-covered, and generator-aligned.
Risk controlled: scaling bad module patterns.
```

---

## Gate 6 — AppCare Gate

Required before OneDayOS can responsibly market AppCare as including hosting, monitoring, backups, maintenance, and support.

```txt
Goal: operations are real, documented, and tested.
Risk controlled: promising support without operational maturity.
```

---

# 5. Non-Negotiable Blockers

The following issues block production use.

```txt
[ ] API auth redirects instead of returning JSON 401
[ ] Tenant membership check is incomplete
[ ] Any API or service trusts client-supplied orgId
[ ] Permissions are modeled but not enforced
[ ] Modules import from @/kernel/*
[ ] Modules import from other modules
[ ] Module services use loose orgId instead of PlatformContext
[ ] Generated modules lack tenant-isolation tests
[ ] Generated modules lack permission-denial tests
[ ] Live migration has not been tested against real Postgres
[ ] Seed script has not been tested against real Postgres
[ ] No restore drill has been completed before serious production use
[ ] Production secrets are exposed to client code
[ ] Supabase service role key is exposed outside server-only Kernel/admin code
```

If any item above is true, the platform is not production-ready.

---

# 6. Required Architecture Decisions Before Implementation

Before Claude writes the restarted foundation code, these decisions must be frozen.

```txt
[ ] One shared PostgreSQL database for MVP
[ ] Organization is the tenant boundary
[ ] orgSlug is a locator, not authorization
[ ] orgId is server-derived only
[ ] PlatformContext is required for protected operations
[ ] sdk.getDb(ctx), not sdk.getDb(orgId)
[ ] Modules use @/sdk and @/sdk/server only through approved boundaries
[ ] Modules never import @/kernel/*
[ ] Modules never import other modules
[ ] Business Objects are conceptually separate from Kernel
[ ] Branch and Department are Kernel org-structure primitives
[ ] Warehouse is a Business Object
[ ] API routes return JSON only
[ ] API routes live under /api/orgs/[orgSlug]/...
[ ] Dynamic Forms and Dynamic CRUD are deferred
[ ] Platform Services are deferred until proven
[ ] FastAPI is excluded from the core platform
```

---

# 7. Gate 0 — Manual Gate Checklist

Gate 0 is passed when the foundation documents required for implementation are approved.

Required documents:

```txt
[ ] 00-roadmap approved
[ ] 00-vision approved
[ ] 02-system-architecture approved
[ ] 02-layer-boundaries approved
[ ] 13-security/08-production-readiness-gate approved
[ ] 13-security/09-security-stabilization-new-build-spec approved
[ ] 04-kernel/00-kernel-overview approved
[ ] 04-kernel/01-authentication approved
[ ] 04-kernel/02-organizations-tenancy approved
[ ] 04-kernel/03-users-roles-permissions approved
[ ] 04-kernel/04-authorization-enforcement approved
[ ] 04-kernel/08-kernel-api-contracts approved
[ ] 05-sdk section approved
[ ] 06-data section approved
[ ] 13-security section approved
```

Gate 0 fails if Claude must decide any of the following:

```txt
how tenancy works
how API auth works
how permissions are enforced
where orgId comes from
whether modules can import Kernel internals
whether services receive orgId or PlatformContext
whether API routes return redirects or JSON
whether raw Prisma is allowed in modules
```

Claude may implement details, but Claude may not invent architecture.

---

# 8. Gate 1 — Local Foundation Gate Checklist

Gate 1 is passed when the restarted foundation works locally and passes meaningful checks.

## 8.1 Build and Type Safety

```txt
[ ] npm install succeeds from clean clone
[ ] Prisma Client generation succeeds
[ ] npm run typecheck passes
[ ] npm run lint passes
[ ] npm run test:run passes
[ ] npm run build passes
[ ] npm run check:architecture passes
```

`check:architecture` must eventually check for:

```txt
[ ] no @/kernel/* imports inside src/modules
[ ] no raw Prisma imports inside src/modules
[ ] no direct module-to-module imports
[ ] no sdk.getDb(orgId)
[ ] no request body orgId usage in protected APIs
[ ] no /api/[module] route pattern for tenant-scoped APIs
[ ] no redirect-style auth helpers in API routes
[ ] no client components importing @/sdk/server
[ ] no client components importing @/kernel/*
[ ] no service role key usage outside approved server-only files
```

---

## 8.2 Authentication

```txt
[ ] Supabase Auth is the identity provider
[ ] Prisma User is the platform user
[ ] Supabase auth user ID equals Prisma User.id
[ ] Registration is server-owned
[ ] Client does not call supabase.auth.signUp() for platform registration
[ ] Registration creates Supabase user + Organization + User + Subscription + Admin role in one logical sequence
[ ] Failed Prisma registration rolls back or cleans up Supabase auth user
[ ] Login works through Supabase browser signInWithPassword()
[ ] Current-user lookup uses /api/kernel/auth/me
[ ] /api/kernel/users/[id] is not used for current-user lookup
[ ] Page auth helper may redirect
[ ] API auth helper never redirects
[ ] Unauthenticated API request returns JSON 401
[ ] Expired session returns JSON 401
[ ] Logout clears session
```

Required tests:

```txt
[ ] registration success test
[ ] registration Prisma failure rollback test
[ ] registration duplicate email test
[ ] login success test
[ ] /api/kernel/auth/me authenticated test
[ ] /api/kernel/auth/me unauthenticated 401 JSON test
[ ] API helper never returns redirect test
```

---

## 8.3 Tenant Context

```txt
[ ] Organization is the tenant boundary
[ ] User belongs to exactly one Organization in MVP
[ ] orgSlug resolves Organization
[ ] orgSlug is not treated as authorization
[ ] PlatformContext verifies auth user
[ ] PlatformContext verifies Prisma User
[ ] PlatformContext verifies Organization
[ ] PlatformContext verifies user.orgId === org.id
[ ] Wrong-org access returns safe 404
[ ] Client-supplied orgId is rejected with TENANT_ID_NOT_ALLOWED
[ ] Services receive PlatformContext, not loose orgId
[ ] sdk.getDb(ctx) exists
[ ] sdk.getDb(orgId) does not exist
```

Required tests:

```txt
[ ] Org A user can access Org A route
[ ] Org A user cannot access Org B route
[ ] Org A user cannot access Org B API
[ ] Org A user cannot mutate Org B data
[ ] wrong orgSlug returns safe 404
[ ] payload orgId is rejected
[ ] query param orgId is rejected
[ ] hidden form orgId is rejected
```

Every tenant-sensitive test suite must use at least two organizations.

---

## 8.4 Permissions

```txt
[ ] Role is org-scoped
[ ] UserRole is org-scoped or tenant-safe through role relation
[ ] Permission is org-scoped through Role
[ ] Permission.resource is non-null
[ ] '*' is used as wildcard resource
[ ] Permission conditions are denied in MVP unless null
[ ] Admin receives wildcard permission only inside verified org
[ ] Permissions are checked after tenant membership
[ ] Module enablement and permission are separate gates
[ ] UI permission checks are usability only
[ ] API routes enforce permissions
[ ] Services enforce permissions for public mutation methods
[ ] Last-admin protection exists
```

Required tests:

```txt
[ ] admin wildcard allows permitted action inside same org
[ ] admin wildcard does not cross tenant boundary
[ ] staff without permission receives 403 JSON
[ ] disabled module returns safe 404 before permission check
[ ] enabled module without permission returns 403
[ ] permission conditions non-null are denied in MVP
[ ] last admin cannot be removed/deactivated without replacement
```

---

## 8.5 API Contracts

```txt
[ ] Every API returns { data, error, meta? }
[ ] Every protected API uses API-safe auth/context helper
[ ] No protected API redirects
[ ] No protected API returns HTML login pages
[ ] 401 uses UNAUTHENTICATED
[ ] 403 uses FORBIDDEN
[ ] wrong-org 404 uses ORG_NOT_FOUND or generic NOT_FOUND
[ ] disabled module 404 uses MODULE_NOT_FOUND
[ ] validation errors use VALIDATION_ERROR
[ ] unexpected errors use INTERNAL_SERVER_ERROR without stack trace
[ ] route params are validated
[ ] query strings are validated
[ ] request bodies are validated
[ ] request bodies use z.strictObject() by default
[ ] client-supplied orgId is rejected
```

Required tests:

```txt
[ ] API success returns { data, error: null }
[ ] API unauthenticated returns 401 JSON
[ ] API forbidden returns 403 JSON
[ ] API wrong org returns safe 404 JSON
[ ] API validation failure returns 400 JSON
[ ] API unknown keys are rejected
[ ] API client-supplied orgId is rejected
[ ] API never returns redirect for auth failure
[ ] API never returns HTML for auth failure
```

---

## 8.6 Data Access

```txt
[ ] Modules never import raw Prisma
[ ] Modules access database through sdk.getDb(ctx)
[ ] Services receive PlatformContext
[ ] Tenant-scoped queries include ctx.org.id
[ ] Tenant-scoped findUnique({ where: { id } }) is forbidden unless uniqueness includes orgId
[ ] Soft-deletable reads exclude deletedAt records by default
[ ] Hard delete is forbidden for business data
[ ] Soft delete uses deletedAt and deletedBy
[ ] isActive is business status, not deletion
[ ] Raw SQL is forbidden inside modules
[ ] Transactions go through approved SDK/Data helpers
```

Required tests:

```txt
[ ] Org A cannot read Org B record by ID
[ ] Org A cannot update Org B record by ID
[ ] Org A cannot delete Org B record by ID
[ ] soft-deleted records are hidden from normal reads
[ ] restore path requires explicit permission
[ ] hard delete is not used for business records
```

---

## 8.7 Business Objects

```txt
[ ] Employee is a Business Object, not HR-owned
[ ] Product is a Business Object, not Inventory-owned
[ ] Customer is a Business Object, not CRM-owned
[ ] Supplier is a Business Object, not Purchasing-owned
[ ] Warehouse is a Business Object, not Inventory-owned
[ ] Branch and Department are Kernel org-structure primitives
[ ] Business Object APIs live under /api/orgs/[orgSlug]/objects/...
[ ] Business Object permissions use objects.*
[ ] Business Object events use objects.*
[ ] Module-specific fields use extension tables
[ ] Modules do not duplicate Business Objects
```

Required tests:

```txt
[ ] Product creation emits objects.product.created
[ ] Customer creation emits objects.customer.created
[ ] Employee creation emits objects.employee.created
[ ] Business Object mutation requires objects.* permission
[ ] Module extension mutation requires module permission
[ ] generated module does not create duplicate shared entity copies
```

---

## 8.8 Event Safety

```txt
[ ] Events are server-only
[ ] Events are emitted through SDK
[ ] Events use PlatformContext
[ ] Event payloads do not include orgId
[ ] Event payloads do not include full Prisma records
[ ] Event payloads are JSON-serializable
[ ] Event payloads are Zod-validated where practical
[ ] Listener failures do not break original mutation
[ ] Required business correctness is not delegated to event listeners
[ ] Event names follow namespace.entity.past_tense_verb
```

Required tests:

```txt
[ ] successful mutation emits expected event
[ ] failed mutation does not emit success event
[ ] event payload excludes orgId
[ ] event payload excludes sensitive fields
[ ] listener failure is contained
```

---

## 8.9 Generator Safety

The Module Generator must not be allowed to generate insecure code.

```txt
[ ] generated APIs use /api/orgs/[orgSlug]/[moduleId]/...
[ ] generated pages use /[orgSlug]/[moduleId]/...
[ ] generated services use PlatformContext
[ ] generated services use sdk.getDb(ctx)
[ ] generated schemas reject orgId
[ ] generated APIs enforce permissions
[ ] generated services enforce permissions during MVP
[ ] generated manifests are pure metadata
[ ] generated manifests use full permission objects
[ ] generated tests include two-org tenant tests
[ ] generated tests include permission-denial tests
[ ] generator refuses to overwrite existing files silently
[ ] generator supports dry-run or clear preview behavior
```

Forbidden generated patterns:

```txt
sdk.getDb(orgId)
where: { orgId: input.orgId }
request.nextUrl.searchParams.get('orgId')
/api/[module]
import { prisma } from '@/kernel/db/client'
import '@/kernel/*' inside modules
import from another module
redirect() inside API route
mutation route without permission check
mutation service without PlatformContext
create schema containing orgId
event payload containing full Prisma record
```

---

# 9. Gate 2 — Staging Gate Checklist

Gate 2 is passed when the foundation works in a hosted staging environment.

## 9.1 Supabase Staging

```txt
[ ] staging Supabase project exists
[ ] staging database URL configured
[ ] staging direct URL configured
[ ] staging anon key configured
[ ] staging service role key configured server-side only
[ ] staging auth settings verified
[ ] staging database migration runs through Prisma migrate deploy
[ ] staging seed runs successfully
[ ] staging demo org can log in
[ ] staging contains at least two test organizations
```

---

## 9.2 Vercel Staging

```txt
[ ] Vercel staging/preview environment configured
[ ] environment variables configured correctly
[ ] no production secrets in preview unless intentionally approved
[ ] build includes Prisma Client generation
[ ] npm run build succeeds in Vercel
[ ] auth cookies work in hosted environment
[ ] API JSON errors verified in hosted environment
[ ] route protection verified in hosted environment
```

---

## 9.3 Staging Security Smoke Test

Manual or automated staging checks:

```txt
[ ] unauthenticated user cannot load org dashboard
[ ] unauthenticated API returns JSON 401
[ ] Org A user cannot load Org B dashboard
[ ] Org A user cannot call Org B API
[ ] staff without permission cannot mutate data
[ ] disabled module route returns safe 404
[ ] client-supplied orgId is rejected
[ ] logs do not expose secrets or full request bodies
[ ] soft-deleted record is hidden
```

---

# 10. Gate 3 — First Client Gate Checklist

Gate 3 must pass before onboarding the first real paying client.

```txt
[ ] Gate 0 passed
[ ] Gate 1 passed
[ ] Gate 2 passed
[ ] production Supabase project exists
[ ] production Vercel project exists
[ ] production environment variables configured
[ ] production migration tested first in staging
[ ] production seed/provisioning script tested first in staging
[ ] production backup plan documented
[ ] Supabase organization uses company-owned account
[ ] MFA enabled on infrastructure accounts
[ ] at least two trusted owners/admins exist
[ ] service role key not exposed to client code
[ ] first client org provisioned through approved script/admin flow
[ ] first client users assigned roles intentionally
[ ] first client enabled modules documented
[ ] first client known limitations documented
[ ] founder has rollback/recovery notes for deployment
```

First client production may still be limited, but it must not be careless.

---

# 11. Gate 4 — Second Tenant Gate Checklist

This gate is mandatory before putting a second client organization in the same production database.

The goal is to prove that OneDayOS can safely operate as a multi-tenant platform.

```txt
[ ] two-org tenant test suite passes
[ ] cross-tenant page access denied
[ ] cross-tenant API read denied
[ ] cross-tenant API write denied
[ ] cross-tenant API delete denied
[ ] wrong-org errors do not reveal private org details
[ ] admin wildcard does not cross tenant boundary
[ ] module enablement is org-scoped
[ ] settings are org-scoped
[ ] roles are org-scoped
[ ] permissions are org-scoped
[ ] Business Objects are org-scoped
[ ] module-owned records are org-scoped
[ ] events are org-scoped through context
[ ] logs do not mix tenant-sensitive data
[ ] seed/provisioning cannot overwrite existing client data
[ ] backups and restore process account for shared multi-tenant DB
```

If this gate fails, OneDayOS may only run one real production tenant.

---

# 12. Gate 5 — Official Module Gate Checklist

A module is not official just because it works for one client.

A module becomes official only when it passes this gate.

```txt
[ ] module has approved module specification
[ ] module generated or structured according to module folder contract
[ ] module manifest is valid pure metadata
[ ] module uses SDK only
[ ] module has no @/kernel/* imports
[ ] module has no direct imports from other modules
[ ] module does not duplicate Business Objects
[ ] module uses extension tables for module-specific Business Object fields
[ ] module services receive PlatformContext
[ ] module APIs live under /api/orgs/[orgSlug]/[moduleId]/...
[ ] module pages live under /[orgSlug]/[moduleId]/...
[ ] module schemas reject orgId
[ ] module API routes enforce auth, tenant, module enablement, validation, and permissions
[ ] module services enforce permissions for public mutations during MVP
[ ] module uses soft delete for business records
[ ] module emits events for successful mutations
[ ] module event names follow convention
[ ] module tests use at least two orgs
[ ] module tests include permission denial
[ ] module tests include disabled-module behavior
[ ] module tests include client-supplied orgId rejection
[ ] module UI uses approved design system components
[ ] module has docs and AI context metadata if official
```

---

# 13. Gate 6 — AppCare Gate Checklist

OneDayOS should not promise AppCare maturity until operations are documented and tested.

AppCare claims include:

```txt
hosting
monitoring
security updates
backups
bug fixes
AI support
maintenance
```

Therefore AppCare requires:

```txt
[ ] production infrastructure ownership documented
[ ] Supabase backup plan documented
[ ] restore drill completed or scheduled before scale
[ ] Vercel deployment process documented
[ ] migration process documented
[ ] pre-migration backup policy documented
[ ] incident response runbook drafted
[ ] client communication template drafted
[ ] uptime/error monitoring selected or deferred with reason
[ ] support intake process defined
[ ] bug vs enhancement distinction defined
[ ] monthly maintenance checklist drafted
[ ] secrets rotation process drafted
[ ] account recovery process documented
[ ] founder understands shared-infrastructure blast radius
```

AppCare must not imply impossible promises.

Do not promise:

```txt
zero downtime
zero data loss
instant restore
per-client database restore
enterprise SLA
24/7 support
client-owned infrastructure
```

unless the required infrastructure and pricing exist.

---

# 14. Database and Migration Readiness

Before production:

```txt
[ ] Prisma schema reviewed
[ ] migration generated through Prisma
[ ] migration applied locally
[ ] migration applied to staging
[ ] migration verified in staging
[ ] migration rollback/forward-fix plan documented
[ ] seed/provisioning is idempotent
[ ] seed/provisioning does not overwrite client data
[ ] Prisma Client generation included in build process
[ ] no manual production schema edits
[ ] no prisma db push in staging/production
```

Before every future production migration:

```txt
[ ] migration reviewed
[ ] backup status checked
[ ] staging apply completed
[ ] staging smoke test passed
[ ] production deploy window selected
[ ] affected modules listed
[ ] founder/operator understands rollback/forward-fix plan
```

---

# 15. Backup and Restore Readiness

Before serious production use:

```txt
[ ] backup provider behavior understood
[ ] Supabase plan supports required backup level
[ ] PITR decision documented
[ ] external logical backup plan considered
[ ] restore-to-staging drill completed or scheduled
[ ] targeted per-tenant repair process drafted
[ ] full production restore consequences understood
[ ] Storage backup plan documented before Attachments Service exists
```

The most important rule:

```txt
A backup is not real until it has been restored and verified.
```

---

# 16. Infrastructure Account Readiness

Before production:

```txt
[ ] Supabase is owned by OneDayOS company account, not an informal personal setup
[ ] Vercel is owned by OneDayOS company/team account
[ ] GitHub repository is under correct owner/org
[ ] MFA enabled for critical accounts
[ ] at least two trusted recovery owners/admins exist where practical
[ ] billing/payment method is stable
[ ] recovery email is controlled by the company
[ ] service role keys are restricted
[ ] production environment variables are not shared with Claude
[ ] production secrets are not pasted into chat
```

---

# 17. Secrets Readiness

```txt
[ ] .env.local is gitignored
[ ] .env.example contains placeholders only
[ ] env.server.ts validates server env
[ ] env.client.ts exposes only safe public env
[ ] no NEXT_PUBLIC_DATABASE_URL
[ ] no NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
[ ] no service role key in client bundle
[ ] no process.env logging
[ ] no secrets in module manifests
[ ] no secrets in Setting table for MVP
[ ] no secrets in generated files
```

If a production secret is pasted into chat, logs, commits, or Claude:

```txt
[ ] treat as compromised
[ ] rotate immediately
[ ] audit usage
[ ] document incident
```

---

# 18. UI and Design Readiness

Production readiness is not only security. OneDayOS must not look like a generic admin starter.

Before official module release:

```txt
[ ] approved design system exists
[ ] app shell follows design system
[ ] tables follow table standards
[ ] forms follow form standards
[ ] empty states are intentional
[ ] loading states are intentional
[ ] error states are useful
[ ] permission-denied state exists
[ ] disabled-module/not-found state exists
[ ] no generic dashboard template feel
[ ] no inconsistent module-local UI patterns
```

Design does not block the security foundation, but it blocks official module polish.

---

# 19. Claude Completion Criteria

Claude may not mark the restarted foundation build complete unless it reports:

```txt
[ ] files changed
[ ] architecture documents followed
[ ] commands run
[ ] tests added
[ ] tests passed
[ ] typecheck passed
[ ] lint passed
[ ] build passed
[ ] architecture check passed
[ ] known gaps listed
[ ] no forbidden imports found
[ ] no client-supplied orgId patterns found
[ ] no redirect-style API auth patterns found
[ ] no sdk.getDb(orgId) patterns found
```

Claude must not say:

```txt
"tenant isolation is done"
```

unless two-org cross-tenant tests exist and pass.

Claude must not say:

```txt
"permissions are done"
```

unless permission-denial tests exist and pass for APIs and services.

Claude must not say:

```txt
"API auth is done"
```

unless unauthenticated API tests prove JSON `401` and no redirects/HTML.

---

# 20. Required Test Matrix

Every production-readiness test matrix must include:

| Case | Expected Result |
|---|---|
| unauthenticated page | redirect to login |
| unauthenticated API | JSON 401 |
| expired session API | JSON 401 |
| Org A user accesses Org A | allowed |
| Org A user accesses Org B page | safe 404 / denied |
| Org A user reads Org B API data | safe 404 / denied |
| Org A user mutates Org B data | safe 404 / denied |
| user lacks permission | JSON 403 |
| module disabled | safe JSON 404 / module not found |
| client payload includes orgId | JSON 400 TENANT_ID_NOT_ALLOWED |
| hidden form includes orgId | rejected |
| soft-deleted record normal read | not returned |
| restore without permission | JSON 403 |
| admin wildcard same org | allowed |
| admin wildcard other org | denied |
| invalid body unknown field | JSON 400 |
| API validation error | JSON 400 with safe details |
| service called without permission | denied |
| event listener throws | mutation still succeeds if listener is non-critical |
| failed mutation | no success event emitted |

---

# 21. Production Launch Decision Format

Before any production launch, write a short launch note.

Template:

```md
# OneDayOS Production Launch Decision

Date:
Release:
Environment:
Target:

## Scope

## Gates Passed
- [ ] Gate 0 Manual Gate
- [ ] Gate 1 Local Foundation Gate
- [ ] Gate 2 Staging Gate
- [ ] Gate 3 First Client Gate
- [ ] Gate 4 Second Tenant Gate, if applicable
- [ ] Gate 5 Official Module Gate, if applicable
- [ ] Gate 6 AppCare Gate, if applicable

## Known Limitations

## Explicitly Deferred

## Backup / Rollback Notes

## Approval
Founder:
Architect:
```

This prevents vague production decisions.

---

# 22. Stop Conditions

Stop implementation and return to planning if any of these happen:

```txt
Claude proposes per-client app forks
Claude proposes client-owned Supabase as MVP default
Claude proposes FastAPI for the core backend
Claude proposes raw Prisma inside modules
Claude proposes sdk.getDb(orgId)
Claude proposes client-supplied orgId
Claude proposes auth redirects inside API routes
Claude proposes building Platform Services during foundation
Claude proposes Dynamic CRUD during foundation
Claude proposes generic customFields JSON during MVP
Claude cannot write two-org tenant tests
Claude cannot explain how permissions are enforced
```

These are architecture drift signals.

---

# 23. What Is Allowed Before All Gates Pass

Before all gates pass, OneDayOS may still do limited work:

```txt
write Engineering Manual documents
prototype design system components
write module specifications
write generator specs
run local experiments
run non-production demos with fake data
create throwaway UI prototypes
```

But OneDayOS must not:

```txt
onboard real multi-tenant production clients
claim AppCare-grade reliability
ship official modules
store sensitive production data
build client-specific forks
```

---

# 24. First Foundation Build Acceptance Summary

The restarted OneDayOS foundation is acceptable when this statement is true:

```txt
A user can register or log in, enter only their own organization, access only enabled modules, perform only permitted actions, receive JSON API errors, and cannot read or mutate another organization's data even by guessing URLs, IDs, or submitting orgId manually.
```

If that sentence is not true, the foundation is not ready.

---

# 25. Final Founder Rule

When in doubt, choose the safer interpretation.

```txt
Do not trust the browser.
Do not trust orgSlug alone.
Do not trust orgId from the client.
Do not trust UI permission hiding.
Do not trust generated code without tests.
Do not trust backups until restored.
Do not trust architecture unless enforced.
```

OneDayOS should move fast because the foundation is safe, not because the foundation is ignored.

