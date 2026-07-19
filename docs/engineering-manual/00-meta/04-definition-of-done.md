# OneDayOS Engineering Manual — Definition of Done

**Document ID:** `00-meta/04-definition-of-done.md`  
**Version:** 1.0  
**Status:** Frozen  
**Owner:** Founder / Lead Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** Governance document — use as authority for process  
**Depends On:**

- `00-meta/00-roadmap.md`
- `00-meta/01-manual-governance.md`
- `00-meta/02-architecture-decision-records.md`
- `00-meta/03-claude-workflow.md`
- `13-security/08-production-readiness-gate.md`
- `14-testing-quality/08-ci-quality-gates.md`

---

# 1. Purpose

This document defines what **done** means in OneDayOS.

OneDayOS is not a normal CRUD app. A feature, subsystem, module, or platform change is not done merely because it appears to work in the browser.

For OneDayOS, work is only done when it is:

```txt
architecturally compliant
secure by default
tenant-safe
permission-enforced
tested against failure paths
generated safely if applicable
usable in the UI
documented clearly
verified through repeatable commands
ready for future modules and clients
```

This document exists to stop Claude, future developers, or the founder from accepting incomplete work too early.

---

# 2. Core Definition

The core OneDayOS rule is:

```txt
A task is not done because the happy path works.
A task is done when the right user succeeds,
the wrong user fails safely,
and the architecture remains intact.
```

This means every meaningful piece of work must answer:

```txt
Can the correct user do the intended action?
Can an unauthenticated user not do it?
Can a user from another organization not do it?
Can a user without permission not do it?
Can a disabled module not be accessed?
Can invalid input not corrupt data?
Can soft-deleted data stay hidden?
Can the UI fail clearly?
Can future modules reuse the pattern?
Can Claude repeat this safely next time?
```

If the answer is not yes, the task is not done.

---

# 3. Why OneDayOS Needs a Strict Definition of Done

The previous Kernel MVP was useful, but it showed the danger of stopping at “build passes.” It had working auth, sidebar, module registry, permissions, SDK, events, and generator scaffolding, but still had serious unresolved platform gaps:

```txt
org membership check incomplete
permissions modeled but not enforced
API auth helper redirected instead of returning JSON 401
client/org handling was loose in generated patterns
soft-delete protection had bypass paths
some tests were tautological
fresh builds lacked Prisma generation in the build step
```

Those were not small details. In a shared multi-tenant platform, they are the difference between a demo and a production foundation.

The restarted build must therefore use this Definition of Done as a hard completion standard.

---

# 4. Scope

This document applies to:

```txt
Engineering Manual documents
ADRs
Kernel work
SDK work
Database work
Business Objects
Business Modules
Module generator output
Platform Services
Dynamic Systems
AI Layer
Security work
Testing work
Deployment/operations work
Client delivery work
Bug fixes
Production patches
Claude implementation tasks
```

It applies equally to human developers and AI coding agents.

---

# 5. Completion Levels

OneDayOS uses several levels of “done.”

## 5.1 Draft Done

A document or spec is **Draft Done** when it is complete enough for founder review.

```txt
[ ] Purpose is clear
[ ] Non-goals are clear
[ ] Architectural decisions are explicit
[ ] Forbidden patterns are listed
[ ] Security boundaries are included
[ ] Claude implementation rules are included where relevant
[ ] Acceptance criteria are included
[ ] Known risks are called out
[ ] Deferred items are marked clearly
```

Draft Done does **not** mean implementation may start.

---

## 5.2 Frozen Done

A document is **Frozen Done** when it has passed founder/architect review and has been formally marked as implementation authority.

```txt
[ ] Status changed from Draft to Frozen
[ ] Version number confirmed
[ ] Conflicts with previous documents resolved
[ ] Related ADRs referenced or created
[ ] Implementation Allowed field updated
[ ] Deferred sections remain explicitly deferred
[ ] Claude implementation package can reference it safely
```

Only Frozen documents may be used as primary implementation authority.

---

## 5.3 Implementation Done

A code implementation is **Implementation Done** when:

```txt
[ ] It follows frozen manual documents
[ ] It does not introduce architecture drift
[ ] It has meaningful tests
[ ] It handles failure paths
[ ] It passes local verification commands
[ ] It passes CI checks
[ ] It documents deviations
[ ] It does not implement deferred capabilities accidentally
```

---

## 5.4 Production Done

A subsystem is **Production Done** when it is safe to run for real client organizations.

```txt
[ ] Implementation Done is satisfied
[ ] Production Readiness Gate requirements are satisfied
[ ] Tenant isolation tests pass
[ ] Permission-denial tests pass
[ ] API failure behavior is safe
[ ] Monitoring/error handling exists where relevant
[ ] Migration/rollback implications are reviewed
[ ] AppCare/support implications are understood
```

---

## 5.5 AppCare Done

A client-facing operational capability is **AppCare Done** when OneDayOS can responsibly support it after handover.

```txt
[ ] Production Done is satisfied
[ ] Monitoring expectations are defined
[ ] Backup/restore implications are understood
[ ] Support classification is clear
[ ] Known limitations are documented
[ ] Client-facing handover/training material can explain it
[ ] It does not create unlimited custom-support burden
```

---

# 6. Universal Required Checks

Every meaningful implementation task must pass these checks unless explicitly exempted by an approved ADR.

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
```

The restarted platform should eventually add:

```bash
npm run check:architecture
npm run check:generated
npm run check:all
```

Recommended eventual command:

```bash
npm run check:all
```

Where `check:all` should run:

```txt
Prisma generation
TypeScript typecheck
ESLint
unit tests
integration tests where configured
API/security tests
architecture checks
generator checks
Next.js build
```

Claude must report which commands were run and whether they passed.

---

# 7. Architecture Done

A task is architecturally done only if it follows the OneDayOS layer model:

```txt
Kernel
  ↓
Business Objects
  ↓
Platform Services
  ↓
Business Modules
  ↓
Client Configuration
```

Architecture Done requires:

```txt
[ ] Code belongs to the correct layer
[ ] No module imports from @/kernel/*
[ ] No module imports from another module
[ ] Modules use @/sdk or @/sdk/server where appropriate
[ ] Client components do not import server-only SDK code
[ ] Business Objects are not duplicated inside modules
[ ] Platform Services are not implemented prematurely
[ ] Deferred systems remain deferred
[ ] FastAPI/Python backend is not added without ADR
[ ] No per-client forks, repos, databases, Supabase projects, or Vercel projects are created for normal clients
```

Forbidden examples:

```ts
import { prisma } from '@/kernel/db/client' // inside a module
import { InventoryService } from '@/modules/inventory/service' // inside another module
import { requireAuth } from '@/kernel/auth/session' // inside a module API route
```

Preferred examples:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
```

---

# 8. Security Done

A task is security done only if it fails safely.

Security Done requires:

```txt
[ ] Authenticated access is required where appropriate
[ ] API auth failures return JSON 401, never redirects
[ ] Tenant membership is verified before data access
[ ] Wrong-org access fails safely
[ ] Permissions are enforced in API routes
[ ] Permissions are enforced in services where relevant
[ ] Module enablement is checked for module routes/APIs
[ ] Client-supplied orgId is rejected
[ ] Request bodies are validated with Zod
[ ] Unknown request-body keys are rejected where appropriate
[ ] Sensitive data is not logged
[ ] Events do not include full records or secrets
[ ] UI hiding is not treated as security
```

The minimum protected API failure matrix:

```txt
[ ] unauthenticated user → 401 JSON
[ ] authenticated wrong-org user → safe 404
[ ] authenticated no-permission user → 403 JSON
[ ] disabled module → safe 404
[ ] invalid body → 400 validation error
[ ] client-supplied orgId → rejected
[ ] valid request → success response
[ ] response shape is { data, error, meta? }
[ ] no redirects
[ ] no HTML auth pages
```

---

# 9. Tenant Isolation Done

Tenant isolation is not done unless it is tested with at least two organizations.

Required fixture pattern:

```txt
Organization Alpha
  Admin Alpha
  Staff Alpha
  No-Permission Alpha
  Records Alpha

Organization Beta
  Admin Beta
  Staff Beta
  Records Beta
```

Tenant Isolation Done requires:

```txt
[ ] Every tenant-scoped table has orgId
[ ] Every tenant-scoped operation uses verified PlatformContext
[ ] Services receive ctx, not loose orgId
[ ] sdk.getDb(ctx) is used
[ ] sdk.getDb(orgId) is not used
[ ] Client-supplied orgId is rejected
[ ] Cross-tenant reads are denied
[ ] Cross-tenant writes are denied
[ ] Tenant-scoped findUnique({ where: { id } }) is avoided unless orgId is part of the unique constraint
[ ] Wrong-org API access returns safe 404
```

A feature with only single-org tests is not tenant-isolation done.

---

# 10. Permission Done

Permission Done requires:

```txt
[ ] Permission requirements are explicit
[ ] Permission constants are declared
[ ] Permission checks happen in APIs
[ ] Permission checks happen in public service methods where relevant
[ ] UI visibility uses permissions but does not replace server enforcement
[ ] Admin wildcard works only inside verified tenant context
[ ] Non-admin denial tests exist
[ ] Read/export permissions are separate
[ ] Create/import permissions are separate
[ ] Approval permission and approval assignment are separate where applicable
```

For module work:

```txt
[ ] Module manifest declares permissions
[ ] Module routes declare required permissions
[ ] Module APIs enforce required permissions
[ ] Module services enforce required permissions during MVP
[ ] Tests include non-admin denied user
```

---

# 11. API Done

An API route is done only when it behaves predictably in success and failure.

API Done requires:

```txt
[ ] Route is under the correct namespace
[ ] Tenant APIs use /api/orgs/[orgSlug]/...
[ ] Business Object APIs use /api/orgs/[orgSlug]/objects/...
[ ] Module APIs use /api/orgs/[orgSlug]/[moduleId]/...
[ ] No /api/[module]?orgId=... pattern
[ ] Uses API-safe auth/context helper
[ ] Does not use redirect-style page auth helper
[ ] Creates verified PlatformContext before data access
[ ] Validates params
[ ] Validates query string
[ ] Validates request body
[ ] Rejects client-supplied orgId
[ ] Enforces module enablement where relevant
[ ] Enforces permission before service call
[ ] Calls service with ctx
[ ] Returns { data, error, meta? }
[ ] Has tests for success and failure paths
```

An API is not done if it only works in the browser for the founder/admin user.

---

# 12. Service Done

Services are where business rules live.

Service Done requires:

```txt
[ ] Service receives PlatformContext
[ ] Service does not receive loose orgId
[ ] Service validates or receives validated input
[ ] Service uses sdk.getDb(ctx)
[ ] Service does not import raw Prisma in modules
[ ] Service enforces permissions where required
[ ] Service scopes all tenant queries by ctx.org.id
[ ] Service excludes soft-deleted records by default
[ ] Service handles transactions for multi-record workflows
[ ] Service emits events after successful mutations
[ ] Service does not emit events after failed mutations
[ ] Service has meaningful unit/integration tests
```

Bad:

```ts
InventoryService.create(orgId, input)
```

Good:

```ts
InventoryService.create(ctx, input)
```

---

# 13. Database Done

Database work is done only if it is migration-safe, tenant-safe, and future-proof enough for a shared platform.

Database Done requires:

```txt
[ ] Prisma migration exists
[ ] Prisma Client generation succeeds
[ ] Tenant-scoped tables include orgId
[ ] Tenant-scoped unique constraints include orgId where appropriate
[ ] Soft-deletable business records include deletedAt and deletedBy
[ ] Business status fields are not confused with deletion
[ ] Decimal values are used for money/quantities where precision matters
[ ] Migration has been tested locally
[ ] Migration has a staging path before production
[ ] Seed/backfill scripts are idempotent where applicable
[ ] No manual Supabase dashboard schema edits are required
[ ] No db push for staging/production
```

For production database changes:

```txt
[ ] Migration reviewed
[ ] Staging migration verified
[ ] Backup/restore implication reviewed
[ ] Backfill is tenant-aware and dry-run capable if needed
[ ] Roll-forward plan exists
```

---

# 14. Soft Delete Done

Soft Delete Done requires:

```txt
[ ] Business records use deletedAt/deletedBy
[ ] Normal reads exclude deleted records
[ ] Deleted records do not appear in tables/search/reports/AI context by default
[ ] Delete operations use update, not hard delete
[ ] Restore behavior is defined where needed
[ ] Business cancellation/void/retire is not confused with deletion
[ ] Soft-deleted records are tested against real service/query paths
[ ] findUnique bypass risks are handled by service/query pattern
[ ] Events are emitted for delete/restore where relevant
```

Hard delete is allowed only for explicitly approved cases, such as ephemeral test data or approved cleanup scripts.

---

# 15. Business Object Done

A Business Object implementation is done only if it remains shared and minimal.

Business Object Done requires:

```txt
[ ] Object belongs to Business Objects layer, not a module
[ ] Core fields are lowest-common-denominator
[ ] Module-specific fields are excluded
[ ] Extension-table path is defined
[ ] APIs live under /api/orgs/[orgSlug]/objects/...
[ ] Permissions use objects.[object].*
[ ] Events use objects.[object].*
[ ] Services receive PlatformContext
[ ] Mutations emit events
[ ] Soft delete is implemented where applicable
[ ] Tenant isolation tests exist
[ ] Permission-denial tests exist
```

Forbidden duplicates:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
AssetEmployee
```

Unless they are explicitly module extension/profile tables and not duplicate identity records.

---

# 16. Module Done

A module is not done because pages render.

Module Done requires:

```txt
[ ] Module Specification exists and is approved
[ ] Module generated or structured according to folder contract
[ ] Manifest is pure metadata
[ ] Manifest declares permissions, routes, nav, events, dependencies, Business Object usage, module-owned entities
[ ] Module APIs use tenant-scoped routes
[ ] Module services receive PlatformContext
[ ] Module does not import @/kernel/*
[ ] Module does not import another module
[ ] Module does not use raw Prisma directly
[ ] Module does not accept client-supplied orgId
[ ] Module does not duplicate Business Objects
[ ] Module-specific fields use extension tables where appropriate
[ ] Module checks enablement and permissions
[ ] Module emits events for mutations
[ ] Module uses shared UI patterns
[ ] Module includes meaningful tests
```

Required module test matrix:

```txt
[ ] service success
[ ] service permission denial
[ ] service wrong-org denial
[ ] API 401
[ ] API 403
[ ] API wrong-org safe 404
[ ] API module-disabled safe 404
[ ] validation error
[ ] client-supplied orgId rejection
[ ] soft-delete behavior
[ ] event emission on success
[ ] no event emission on failure
[ ] architecture import checks
```

---

# 17. Generator Done

A generator is done only if it produces safe code by default.

Generator Done requires:

```txt
[ ] Generated code compiles
[ ] Generated code follows folder contract
[ ] Generated code uses PlatformContext
[ ] Generated code uses sdk.getDb(ctx)
[ ] Generated APIs use /api/orgs/[orgSlug]/...
[ ] Generated schemas reject orgId
[ ] Generated services enforce permissions
[ ] Generated events follow naming rules
[ ] Generated tests include tenant and permission denial
[ ] Generated UI uses shared components
[ ] Generated code contains no forbidden imports
[ ] Generated code contains no raw Prisma in modules
[ ] Generated code contains no module-to-module imports
[ ] Generated code contains no FastAPI/Python backend files
[ ] Generator refuses to overwrite files silently
[ ] Generator supports or plans dry-run/check mode
```

A generator that creates insecure code is worse than no generator.

---

# 18. UI Done

UI Done means the interface is usable, consistent, and platform-grade.

UI Done requires:

```txt
[ ] Follows Design Vision
[ ] Uses shared Layout System
[ ] Uses shared Component Standards
[ ] Uses Table Standards for list pages
[ ] Uses Form Standards for forms
[ ] Includes empty/loading/error states
[ ] Includes optimistic UI where safe
[ ] Includes rollback on optimistic failure
[ ] Uses Motion for React only where it improves clarity
[ ] Respects reduced-motion preferences
[ ] Has accessible labels, focus states, and keyboard behavior
[ ] Does not submit hidden orgId fields
[ ] Does not treat hidden buttons as security
[ ] Does not use fake dashboard cards/charts
[ ] Does not create per-module visual styles unnecessarily
[ ] Does not create per-client UI forks
```

A page with `Loading...`, `Error`, or `No data` as the final state is not UI Done.

---

# 19. Design System Done

A design-system component is done when it can be reused by modules without reinterpretation.

Design System Done requires:

```txt
[ ] Component purpose is clear
[ ] Variants are defined
[ ] Loading state is defined where relevant
[ ] Empty state is defined where relevant
[ ] Error state is defined where relevant
[ ] Disabled state is defined where relevant
[ ] Keyboard behavior is defined
[ ] Accessibility behavior is defined
[ ] Responsive behavior is defined
[ ] Permission-aware usage is documented if relevant
[ ] Tests cover user-visible behavior
[ ] Component does not import business logic
[ ] Component does not import server SDK unless explicitly server-only
```

---

# 20. Event Done

Event Done requires:

```txt
[ ] Event name follows {namespace}.{entity}.{past_tense_verb}
[ ] Event is a fact, not a command
[ ] Event is emitted from service layer
[ ] Event uses PlatformContext
[ ] Payload excludes orgId
[ ] Payload excludes full Prisma records
[ ] Payload excludes sensitive fields unless explicitly approved
[ ] Payload has Zod schema where appropriate
[ ] Manifest declares emitted/listened events where relevant
[ ] Tests prove event is emitted on success
[ ] Tests prove event is not emitted on failure
```

Good:

```txt
objects.product.created
inventory.stock_adjustment.posted
leave.leave_request.submitted
```

Bad:

```txt
send.email
notify.user
inventory.product.created
productCreated
```

---

# 21. AI Done

For now, runtime AI features are deferred. Development AI may be used.

AI-related work is done only if:

```txt
[ ] It does not implement runtime AI unless explicitly approved
[ ] It does not expose unrestricted business data to AI
[ ] It uses declarative AI context only where allowed
[ ] It respects tenant isolation and permissions
[ ] It does not execute raw SQL
[ ] It does not execute raw Prisma
[ ] It does not mutate production data directly
[ ] It does not become an export bypass
[ ] It treats business data as untrusted input
[ ] It excludes secrets and sensitive fields
```

The key rule:

```txt
AI may accelerate approved architecture.
AI may not create architecture.
```

---

# 22. Documentation Done

A feature or subsystem is documentation done when another senior engineer or AI coding agent can understand how to work with it without inventing architecture.

Documentation Done requires:

```txt
[ ] Purpose is documented
[ ] Non-goals are documented
[ ] Public API/contract is documented
[ ] Security model is documented
[ ] Tenant behavior is documented
[ ] Permission behavior is documented
[ ] Events are documented
[ ] Tests required are documented
[ ] Deferred capabilities are documented
[ ] Claude implementation rules are documented
[ ] Known limitations are documented
```

For module docs:

```txt
[ ] Business workflows are documented
[ ] Business Objects used are documented
[ ] Module-owned entities are documented
[ ] Extension tables are documented
[ ] Routes/APIs/UI are documented
[ ] Acceptance criteria are documented
```

---

# 23. Deployment Done

Deployment-related work is done when it can be repeated safely.

Deployment Done requires:

```txt
[ ] Environment variables are documented
[ ] No secrets are committed
[ ] Build includes Prisma generation
[ ] Preview/staging/production separation is respected
[ ] Production migrations are not hidden inside Vercel build
[ ] Production deployment is Git-driven or approved process-driven
[ ] Rollback expectations are clear
[ ] Monitoring implications are understood
[ ] Database migration implications are reviewed
[ ] No per-client deployment fork is created for normal clients
```

---

# 24. AppCare Done

AppCare-related work is done when support burden is understood and operationally manageable.

AppCare Done requires:

```txt
[ ] Monitoring path exists or is explicitly deferred
[ ] Backup/restore implication is clear
[ ] Incident response implication is clear
[ ] Support classification is clear
[ ] Client-facing limitation is documented
[ ] Monthly maintenance implication is clear
[ ] Cost implication is reviewed
[ ] It does not create unlimited custom labor
```

---

# 25. Bug Fix Done

A bug fix is done only when the bug is less likely to happen again.

Bug Fix Done requires:

```txt
[ ] Bug cause is identified
[ ] Fix is implemented
[ ] Regression test is added
[ ] Related generator template is fixed if generator output caused the bug
[ ] Related architecture check is added if pattern should be forbidden
[ ] Documentation/manual is updated if architecture was unclear
[ ] Verification commands pass
```

Security bug fixes additionally require:

```txt
[ ] Denial-path test added
[ ] Two-org test added if tenant-related
[ ] Non-admin test added if permission-related
[ ] Incident notes captured if production-impacting
```

---

# 26. Claude Completion Report Requirement

Claude must not simply say “done.”

Every Claude implementation response should include:

```md
## Summary
What was implemented.

## Files Changed
- path/to/file.ts — what changed

## Architecture Compliance
- SDK boundary followed: yes/no
- PlatformContext used: yes/no
- Client-supplied orgId rejected: yes/no
- Permission enforcement added: yes/no
- Tenant tests added: yes/no

## Tests Added
- test file
- behavior tested

## Verification Commands
- npm run typecheck — pass/fail
- npm run lint — pass/fail
- npm run test:run — pass/fail
- npm run build — pass/fail
- npm run check:architecture — pass/fail if available

## Deviations
Any manual deviation, uncertainty, or missing prerequisite.

## Risks / Follow-ups
Anything not solved.
```

If Claude cannot run a command, it must say so clearly. It must not claim the command passed.

---

# 27. Stop Conditions

Claude or a human implementer must stop and ask for architecture review if any of these occur:

```txt
Need to add FastAPI or another backend runtime
Need to create per-client infrastructure
Need to change tenant model
Need to accept client-supplied orgId
Need to import from @/kernel inside a module
Need to import one module from another module
Need to add a Platform Service
Need to implement a deferred Dynamic System
Need to implement runtime AI
Need to add file uploads before Attachment Service decision
Need to add background jobs before Background Jobs decision
Need to add raw SQL in module code
Need to expose support/staff access across tenants
Need to change Business Object ownership
Need to add sensitive fields to AI/export/events
```

These require ADR/manual review, not improvisation.

---

# 28. Anti-Patterns That Are Never Done

The following work is never considered done, even if it appears to function:

```txt
API works but redirects unauthenticated users to HTML login page
API works but has no 403 test
API works but accepts orgId from client
Service works but accepts loose orgId
Module works but imports raw Prisma
Module works but imports another module
Module works but duplicates Product/Customer/Employee/Supplier/Warehouse
UI works but submits hidden orgId
UI works but has no empty/error/loading states
Generator works but creates insecure scaffolds
Tests pass but only test admin happy paths
Build passes but architecture checks are missing
Feature works but creates per-client fork
Feature works but implements deferred Platform Service casually
```

---

# 29. Minimum Done for Restarted Foundation Build

Before Claude can claim the restarted foundation build is done:

```txt
[ ] Manual implementation package references frozen documents
[ ] Auth works and API auth returns JSON 401
[ ] PlatformContext exists and is tested
[ ] Tenant membership is enforced
[ ] Permission enforcement exists and is tested
[ ] SDK server/client split exists
[ ] sdk.getDb(ctx) exists
[ ] sdk.getDb(orgId) does not exist
[ ] Shared database schema has orgId tenancy
[ ] Prisma generation is part of build
[ ] Business Objects exist with minimal fields
[ ] Module registry/loader exists
[ ] Module generator creates safe scaffold
[ ] API contract is implemented
[ ] Error handling is typed and safe
[ ] Tests use at least two organizations
[ ] Denial tests exist
[ ] Architecture checks exist
[ ] Design system baseline exists
[ ] CI commands pass
[ ] Build passes
```

---

# 30. Minimum Done for First Official Module

Before Inventory or any official module is considered done:

```txt
[ ] Module spec approved
[ ] Module scaffold follows generator/folder contract
[ ] Module uses shared Business Objects correctly
[ ] Module does not duplicate shared entities
[ ] Module APIs are tenant-scoped
[ ] Module services use PlatformContext
[ ] Module permissions are declared and enforced
[ ] Module UI follows design system
[ ] Module tables/forms/empty/error states are implemented
[ ] Module mutations use optimistic UI where safe
[ ] Module emits events
[ ] Module tests include tenant isolation
[ ] Module tests include permission denial
[ ] Module tests include API failure paths
[ ] Module tests include event behavior
[ ] Architecture checks pass
[ ] Typecheck/lint/tests/build pass
```

---

# 31. Acceptance Criteria for This Document

This Definition of Done is acceptable when:

```txt
[ ] Founder understands what “done” means
[ ] Claude can be evaluated against it
[ ] It converts previous MVP weaknesses into hard checks
[ ] It applies across docs, code, modules, generators, UI, security, and operations
[ ] It supports one-day delivery without accepting weak foundations
[ ] It prevents architecture drift
[ ] It makes future module work faster by making completion criteria obvious
```

---

# 32. Final Rule

The final rule is:

```txt
Do not accept work because it looks finished.
Accept work only when it is safe, tested, reusable, supportable,
and aligned with the OneDayOS platform architecture.
```

OneDayOS wins long term not because the first module is built quickly, but because every module after it becomes easier, safer, and more reusable.

---

# ADR-0011 UX Completion Amendment

For official pages and modules, "done" also requires UX completion evidence.

Minimum UX done checklist:

```txt
[ ] UX Contract is complete before implementation.
[ ] Target users, roles, and real business tasks are named.
[ ] Process Flow explains the workflow and ownership boundaries.
[ ] Shared Business Object ownership is visually clear.
[ ] Current organization and app context are obvious.
[ ] Shell navigation is persistent and not replaced by content navbars.
[ ] Page headers explain location, purpose, and primary action.
[ ] Loading, empty, error, permission, and unavailable states are contextual.
[ ] Critical business mistakes are prevented before submission where feasible.
[ ] Forms do not include hidden orgId or client-submitted tenant identity.
[ ] Keyboard path for the critical workflow is reviewed.
[ ] Automated accessibility checks are run when approved tooling exists.
[ ] Manual UX review is completed with severity classification.
[ ] Nielsen-style heuristic/usability review findings are recorded.
[ ] Representative-user walkthrough evidence exists for demo claims.
[ ] Findings are fixed, converted into reusable work, or Founder-approved for deferral.
```

Visual polish is not sufficient for UX completion. A page must support the real business task, fail safely, and preserve OneDayOS platform boundaries.
