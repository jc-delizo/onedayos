# OneDayOS Engineering Manual — 00 Meta — 03 Claude Workflow

**Document ID:** `00-meta/03-claude-workflow.md`  
**Version:** `1.0`  
**Status:** Frozen  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** Governance document — use as authority for process  
**Supersedes:** Informal Claude usage patterns from the earlier Kernel MVP implementation  
**Depends On:**

- `00-meta/00-roadmap.md`
- `00-meta/01-manual-governance.md`
- `00-meta/02-architecture-decision-records.md`
- `13-security/08-production-readiness-gate.md`

**Related Documents:**

- `17-module-specifications/00-module-spec-template.md`
- `09-cli-generators/00-generator-philosophy.md`
- `09-cli-generators/06-generator-safety-rails.md`
- `14-testing-quality/08-ci-quality-gates.md`
- `02-architecture/05-dependency-rules.md`

---

# 1. Purpose

This document defines how Claude Code should be used on OneDayOS.

Claude is a powerful implementation partner, but it must not become the architect of the platform.

OneDayOS is intended to become a long-term Business Operating System for Philippine SMEs. The platform depends on architectural consistency, tenant safety, SDK boundaries, shared Business Objects, reusable modules, and repeatable delivery.

Therefore, Claude must work from the Engineering Manual.

Claude should not be asked vague prompts such as:

```txt
Build OneDayOS.
Build the platform.
Create an inventory app.
Make this work.
Fix the architecture.
```

Claude should be asked narrow implementation tasks based on frozen documents.

The preferred Claude task shape is:

```txt
Using these frozen Engineering Manual documents,
implement this specific subsystem only.
Do not invent architecture.
Stop if the manual is ambiguous.
```

---

# 2. Core Principle

Claude is an implementer.

ChatGPT / Founder is the architect.

The Engineering Manual is the source of truth.

Claude should not silently decide:

```txt
tenancy model
permission model
API shape
database access pattern
module boundaries
Business Object ownership
Platform Service promotion
deployment topology
test strategy
UI system
AI runtime behavior
```

Claude may make small implementation choices inside the approved architecture, but those choices must not change the architecture.

---

# 3. Why This Document Exists

The earlier Kernel MVP proved that Claude can build quickly, but it also showed why vague implementation prompts are dangerous.

The previous build produced useful foundations such as:

```txt
auth helpers
organization model
roles and permissions
module registry
event bus
SDK concept
module builder CLI
app shell
soft delete
optimistic UI patterns
```

But it also left serious open risks:

```txt
org membership checks were incomplete
permissions existed but were not enforced
API auth helpers redirected instead of returning JSON 401
module scaffolds could rely on loose orgId patterns
soft-delete coverage had bypass paths
some tests were tautological
fresh builds lacked Prisma generation in the build step
```

The problem was not that Claude was useless.

The problem was that Claude was allowed to fill in architectural gaps.

This workflow document prevents that.

---

# 4. Role Definitions

## 4.1 Founder

The Founder decides:

```txt
business priorities
client fit
scope boundaries
commercial constraints
module priority
approval of frozen documents
approval of ADRs
when to ask Claude for implementation
when to reject or defer client requests
```

The Founder should not need to personally decide low-level code patterns every time.

The Engineering Manual should carry those decisions.

---

## 4.2 ChatGPT / Architect

The architect helps create and review:

```txt
Engineering Manual documents
Architecture Decision Records
module specifications
implementation packages
Claude prompts
risk reviews
scope classifications
design and product principles
```

The architect challenges decisions that create:

```txt
technical debt
security risk
module duplication
tenant leakage
generic SaaS UI
overengineering
client-specific forks
high operational cost
```

---

## 4.3 Claude Code

Claude Code implements.

Claude may:

```txt
create files
edit files
run tests
fix TypeScript errors
wire services
write API routes
write components
write tests
run lint/typecheck/build
produce implementation summaries
identify ambiguity
```

Claude must not:

```txt
invent architecture
change tenancy model
bypass PlatformContext
import Kernel internals inside modules
introduce FastAPI
create per-client infrastructure
duplicate Business Objects
implement deferred Platform Services
implement Dynamic CRUD/Form runtime from roadmap names
create runtime AI features without an approved spec
accept client-supplied orgId
skip security tests
hide failing tests
claim completion without verification
```

---

## 4.4 Engineering Manual

The Engineering Manual is the long-term platform doctrine.

Frozen documents are authoritative.

Draft documents are discussion material.

Deferred contract documents define future boundaries, but do not authorize implementation.

When code conflicts with a frozen manual document, the conflict must be resolved deliberately.

The resolution is one of:

```txt
fix the code
amend the manual
write an ADR
mark the old document superseded
```

---

# 5. Claude Operating Model

Claude should be treated like a junior-to-mid engineer with excellent speed and broad coding ability.

That means:

```txt
give Claude clear requirements
give Claude a small scope
give Claude authoritative documents
ask Claude to plan before editing
ask Claude to test after editing
ask Claude to report deviations
do not let Claude decide architecture implicitly
```

Claude should not be treated like:

```txt
a founding architect
a product strategist
a security authority
a database operations owner
a business model owner
a compliance/legal advisor
a production incident commander
```

---

# 6. Allowed Claude Work Types

Claude may perform these work types when given an approved implementation package.

## 6.1 Foundation Implementation

Examples:

```txt
implement PlatformContext helpers
implement API wrapper
implement SDK server/client split
implement tenant-safe database access
implement permission matching
implement architecture checks
implement test fixtures
```

Required authority:

```txt
Frozen Kernel / SDK / Security / Data / Testing docs
```

---

## 6.2 Module Implementation

Examples:

```txt
implement Inventory module
implement Leave module
implement CRM module
implement a new approved draft module
```

Required authority:

```txt
Frozen module specification
Frozen module system docs
Frozen SDK docs
Frozen security docs
Frozen design system docs
```

Claude should not implement a module from a sales call transcript alone.

---

## 6.3 Generator Implementation

Examples:

```txt
implement module:create
implement generator safety checks
implement generated-test templates
implement generated API patterns
```

Required authority:

```txt
Frozen CLI / Generator docs
Frozen Module System docs
Frozen Security Testing docs
```

Generators are high-risk because they multiply architecture.

A bad generator scales bad code.

A good generator scales platform discipline.

---

## 6.4 Design System Implementation

Examples:

```txt
implement AppShell
implement Sidebar
implement OneDayOS DataTable
implement form components
implement empty/loading/error states
implement motion standards
implement accessibility defaults
```

Required authority:

```txt
Frozen Design System documents
Frozen Layout System document
Frozen Component Standards document
```

Claude must not generate generic admin dashboard UI once the Design System is frozen.

---

## 6.5 Bug Fixing

Claude may fix bugs if given:

```txt
bug description
expected behavior
affected docs
test requirement
allowed files or subsystem
```

Every serious bug fix should include regression coverage.

Claude should not fix bugs by bypassing the manual.

---

## 6.6 Refactoring

Claude may refactor only if:

```txt
the architecture target is already frozen
tests exist or are added
the refactor does not change behavior unless approved
the affected boundaries are known
```

Examples of acceptable refactors:

```txt
move duplicated API error handling into sdk.api.handle
extract repeated table state into shared hook
replace loose orgId with PlatformContext
rename old unsafe helpers after migration
```

Examples of unacceptable refactors without ADR:

```txt
move backend to FastAPI
replace Prisma with another ORM
make every client a separate database
create a plugin marketplace runtime
add a generic workflow engine
```

---

# 7. Disallowed Claude Work Types

Claude must not be asked to do these without a frozen document and, where required, an ADR.

## 7.1 Do Not Ask Claude to “Build OneDayOS”

This is too broad.

It invites Claude to decide:

```txt
folder structure
database model
auth flow
module boundaries
UI design
API contracts
security rules
tests
deployment strategy
```

That is not acceptable.

---

## 7.2 Do Not Ask Claude to Build from Roadmap Names Alone

Bad prompt:

```txt
Implement the Approval Engine from the roadmap.
```

Correct response:

```txt
Stop. Approval Workflow Service is deferred.
Write or freeze the Approval Workflow implementation spec first.
```

Deferred roadmap items are not implementation authorization.

---

## 7.3 Do Not Ask Claude to Patch Security Vaguely

Bad prompt:

```txt
Fix tenant isolation.
```

Better prompt:

```txt
Using frozen documents:
- 04-kernel/02-organizations-tenancy.md
- 04-kernel/04-authorization-enforcement.md
- 13-security/02-tenant-isolation.md
- 13-security/03-permission-enforcement.md
- 14-testing-quality/05-security-testing.md

Implement only:
- requireApiOrgContext
- requireApiModuleContext
- PlatformContext creation
- client-supplied orgId rejection
- two-org API tests for the listed routes

Do not touch modules outside scope.
```

Security work must be precise.

---

## 7.4 Do Not Ask Claude to Create Client Forks

Bad prompt:

```txt
Create a separate version for Client A.
```

Correct direction:

```txt
Create an Organization.
Enable modules.
Apply settings.
Add module extension if approved.
Create a new reusable draft module if needed.
```

OneDayOS must stay one shared platform by default.

---

## 7.5 Do Not Ask Claude to Implement Deferred Platform Services Casually

Deferred services include:

```txt
Audit Log
Notification Service
Approval Workflow Service
Comments Service
Attachments Service
Activity Feed
Reporting Service
Search Service
Background Jobs
Dynamic Form Engine
Dynamic CRUD Engine
View Builder
Runtime AI
```

Claude may write contract documents or tests for boundaries, but not implement runtime systems unless:

```txt
evidence log exists
ADR is accepted if needed
manual implementation document is frozen
implementation package is narrow
```

---

## 7.6 Do Not Ask Claude to Add FastAPI

FastAPI is excluded from the core restarted platform build.

Claude must not add:

```txt
FastAPI
Python backend services
Alembic
SQLAlchemy
Celery
separate API server
Python migrations
```

unless a future ADR proves a narrow specialized need.

---

# 8. Implementation Package

Claude should receive an Implementation Package for every meaningful coding task.

An Implementation Package is a concise handoff containing:

```txt
1. Task title
2. Objective
3. Authoritative frozen documents
4. Relevant ADRs
5. Scope included
6. Scope excluded
7. Files expected to change
8. Required patterns
9. Forbidden patterns
10. Required tests
11. Required verification commands
12. Stop conditions
13. Output/reporting format
```

Claude should not begin coding until the package is clear.

---

# 9. Implementation Package Template

Use this template.

```md
# Claude Implementation Package — [Task Name]

## Objective

Implement [specific subsystem/feature] for OneDayOS.

## Authoritative Documents

Use these frozen Engineering Manual documents as authority:

- `docs/engineering-manual/[path].md`
- `docs/engineering-manual/[path].md`
- `docs/engineering-manual/[path].md`

## Relevant ADRs

- `docs/engineering-manual/00-meta/adrs/ADR-XXXX-[title].md`

## Scope Included

- [specific item]
- [specific item]
- [specific item]

## Scope Excluded

- Do not implement [deferred service].
- Do not modify [unrelated subsystem].
- Do not add [new dependency].
- Do not change [architecture decision].

## Required Patterns

- Use verified `PlatformContext`.
- Use `sdk.getDb(ctx)`.
- Use tenant-scoped API routes under `/api/orgs/[orgSlug]/...`.
- Reject client-supplied `orgId`.
- Return `{ data, error, meta? }` JSON from APIs.
- Enforce permissions in APIs and services.
- Emit events from services after successful mutations.
- Use soft delete for business records.
- Use shared Business Objects instead of duplicates.

## Forbidden Patterns

- `sdk.getDb(orgId)`
- client-supplied `orgId`
- raw Prisma in modules
- imports from `@/kernel/*` inside modules
- module-to-module imports
- redirect-style auth helpers in API routes
- unhandled throws to clients
- full Prisma records in event payloads
- hidden `orgId` fields in forms
- FastAPI / Python backend files

## Required Tests

- Unit tests for [helpers/components].
- Integration tests for [service behavior].
- API tests for:
  - unauthenticated `401` JSON
  - unauthorized `403` JSON
  - wrong-org safe `404`
  - validation errors
  - client-supplied `orgId` rejection
  - success path
- Two-organization tenant isolation tests.
- Non-admin permission-denial tests.
- Architecture checks for forbidden imports/patterns.

## Verification Commands

Run:

```bash
npm run check:all
```

If `check:all` does not exist yet, run:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Also run any subsystem-specific checks.

## Stop Conditions

Stop and report if:

- The manual is ambiguous.
- A required helper does not exist.
- A frozen document conflicts with another frozen document.
- The task requires a deferred Platform Service.
- The task requires a new dependency not listed here.
- The implementation would require changing tenancy, auth, permission, or SDK architecture.
- Tests cannot be written without changing scope.
- Production credentials are requested or needed.

## Claude Output Required

When complete, report:

1. Files changed.
2. Summary of implementation.
3. Tests added.
4. Verification commands run and results.
5. Any manual deviations.
6. Any unresolved risks.
7. Whether implementation is ready for founder review.
```

---

# 10. Claude Pre-Flight Checklist

Before editing files, Claude must answer internally or in its plan:

```txt
[ ] What frozen documents govern this task?
[ ] Is the task narrow enough?
[ ] Is any part deferred?
[ ] Does this require an ADR?
[ ] Which files will likely change?
[ ] What security boundaries are involved?
[ ] What tests must be added?
[ ] What commands will verify completion?
[ ] What are the stop conditions?
```

Claude should then provide a concise implementation plan.

Claude should not start by editing many files without first identifying the intended path.

---

# 11. Claude Implementation Rules

## 11.1 Manual First

Claude must follow frozen Engineering Manual documents over:

```txt
memory
common SaaS patterns
generic Next.js examples
old code patterns
the old Kernel v2 implementation
convenience
```

The old Kernel MVP can be used as historical context, but not as final doctrine after the restarted manual is frozen.

---

## 11.2 Small Scope

Claude should implement one subsystem at a time.

Good tasks:

```txt
Implement API-safe auth helper.
Implement PlatformContext resolver.
Implement module manifest validator.
Implement OneDayOS DataTable component.
Implement Inventory stock adjustment service.
```

Bad tasks:

```txt
Implement the platform.
Implement all security.
Implement Inventory, CRM, and Leave.
Build the entire UI.
```

---

## 11.3 Stop on Ambiguity

If Claude sees ambiguity, it should stop and ask for clarification.

Examples:

```txt
Should Product belong to Inventory?
Should this use a Platform Service?
Should this be a Business Object?
Should this be client-specific?
Should this API reveal 403 or safe 404?
Should a new dependency be added?
```

Claude should not guess.

---

## 11.4 No Architecture by Convenience

Claude must not choose a pattern because it is faster.

Bad:

```txt
Passing orgId from form because it is easy.
Using raw Prisma because SDK helper is missing.
Importing another module because it already has a service.
Returning redirect from API because requireAuth already exists.
Hard-deleting records because delete is simpler.
```

Correct:

```txt
Stop and report missing foundation helper.
```

---

## 11.5 Test Before Completion

Claude must not claim completion without verification.

At minimum:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Or:

```bash
npm run check:all
```

once defined.

Claude must report exact commands and results.

---

## 11.6 Security Tests Are Required

For security-sensitive work, happy-path tests are not enough.

Claude must add denial tests.

Required security-sensitive tests often include:

```txt
wrong org
missing permission
disabled module
unauthenticated API
client-supplied orgId
soft-deleted record
invalid input
non-admin user
```

Admin-only testing is insufficient.

---

# 12. Standard Claude Prompts

## 12.1 Foundation Subsystem Prompt

```md
You are implementing a OneDayOS foundation subsystem.

Authoritative documents:
- [list frozen docs]

Task:
Implement only [specific subsystem].

Rules:
- Do not invent architecture.
- Use verified PlatformContext.
- Use `sdk.getDb(ctx)`, never `sdk.getDb(orgId)`.
- Do not accept client-supplied `orgId`.
- APIs return `{ data, error, meta? }` JSON only.
- API auth failures return JSON `401`, never redirects.
- Enforce permissions in APIs and services.
- Add denial tests, not just happy-path tests.
- Do not add FastAPI or Python backend files.
- Stop if the manual is ambiguous.

Before editing:
1. List files you expect to change.
2. List tests you will add.
3. Confirm no deferred subsystem is being implemented.

After editing:
Run checks and report results.
```

---

## 12.2 Module Implementation Prompt

```md
You are implementing a OneDayOS business module.

Authoritative module spec:
- `docs/engineering-manual/17-module-specifications/[module].md`

Also follow:
- SDK docs
- Module System docs
- Security docs
- Data docs
- Design System docs
- Testing docs

Task:
Implement only the module scope defined in the module spec.

Rules:
- Do not duplicate Business Objects.
- Use module-owned entities only where the spec says so.
- Use extension tables for module-specific Business Object fields.
- Module services receive `PlatformContext`.
- Module APIs live under `/api/orgs/[orgSlug]/[moduleId]/...`.
- Module pages live under `/[orgSlug]/[moduleId]/...`.
- Reject client-supplied `orgId`.
- Enforce permissions in API and service layers.
- Emit events from services after successful mutations.
- Use soft delete where applicable.
- Do not implement deferred Platform Services.
- Do not import from other modules.
- Do not import from `@/kernel/*` inside module code.
- Do not use raw Prisma inside modules.
- Add tenant-isolation and permission-denial tests.

Stop if:
- The spec requires missing foundation helpers.
- The spec conflicts with frozen architecture.
- The work requires a deferred service.
```

---

## 12.3 Bug Fix Prompt

```md
You are fixing a OneDayOS bug.

Bug:
[description]

Expected behavior:
[expected behavior]

Authoritative documents:
- [relevant frozen docs]

Rules:
- Fix the root cause, not just the symptom.
- Do not bypass architecture.
- Add a regression test.
- If this is security-related, include denial tests.
- Do not add client-specific code.
- Do not add new dependencies unless approved.
- Report whether any manual/ADR update is needed.

Before editing:
List likely files and test plan.

After editing:
Run checks and report results.
```

---

## 12.4 Generator Implementation Prompt

```md
You are implementing or modifying a OneDayOS generator.

Authoritative documents:
- `09-cli-generators/00-generator-philosophy.md`
- `09-cli-generators/01-module-generator.md`
- `09-cli-generators/06-generator-safety-rails.md`
- relevant Module System, SDK, Security, and Testing docs

Rules:
- Generated code must be secure by default.
- Generated modules must use `PlatformContext`.
- Generated APIs must use `/api/orgs/[orgSlug]/...`.
- Generated code must reject client-supplied `orgId`.
- Generated services must enforce permissions.
- Generated tests must include tenant-isolation and permission-denial tests.
- The generator must not generate FastAPI/Python backend files.
- The generator must not duplicate Business Objects.
- The generator must fail closed instead of generating unsafe placeholders.

Required:
- Update generator tests.
- Generate a sample module in a temporary location or test fixture.
- Run architecture checks against generated output.
```

---

## 12.5 Design System Prompt

```md
You are implementing OneDayOS design system components.

Authoritative documents:
- `03-design-system/00-design-vision.md`
- `03-design-system/01-brand-system.md`
- `03-design-system/02-layout-system.md`
- `03-design-system/03-component-standards.md`
- relevant table/form/state/motion/accessibility docs

Task:
Implement only [component/system].

Rules:
- Do not create generic admin-template UI.
- Use OneDayOS brand tokens.
- Do not hijack shadcn `accent` token for brand orange.
- Use shared OneDayOS components.
- Use optimistic UI where applicable.
- Use Motion for React from `motion/react` where motion is required.
- Respect reduced motion.
- No hidden `orgId` fields.
- Client components must not import server SDK, Kernel internals, Prisma, or server env.
- Add UI tests for meaningful behavior.

Report files changed, tests added, and verification results.
```

---

# 13. Claude Stop Conditions

Claude must stop and report instead of continuing when any of these occur.

## 13.1 Architecture Ambiguity

Examples:

```txt
The manual does not say whether this belongs in Kernel or a module.
The module spec conflicts with Business Object ownership.
The task appears to require a deferred Platform Service.
The task requires a new dependency.
The task requires a new database model not in the spec.
```

---

## 13.2 Security Ambiguity

Examples:

```txt
There is no permission for this action.
The route does not have orgSlug.
PlatformContext helper does not exist.
The API needs to access tenant data but only has userId.
The operation seems to require client-supplied orgId.
Wrong-org behavior is unclear.
```

---

## 13.3 Production Risk

Examples:

```txt
Task requires production credentials.
Task requires running production migration.
Task requires deleting production data.
Task requires changing auth or tenancy globally.
Task could affect all client organizations.
```

Claude must not proceed with production-risk work without explicit founder approval and an operations runbook.

---

## 13.4 Deferred System Trigger

Claude must stop if implementation would require:

```txt
Audit Log Service
Notification Service
Approval Workflow Service
Comments Service
Attachments Service
Activity Feed
Reporting Service
Search Service
Background Jobs
Dynamic Form Engine
Dynamic CRUD Engine
View Builder
Runtime AI
FastAPI service
per-client infrastructure
```

unless an approved implementation document explicitly authorizes that subsystem.

---

# 14. Files Claude Should Usually Not Touch Without Explicit Approval

Claude should not casually edit:

```txt
prisma/schema.prisma
prisma/migrations/*
src/sdk/*
src/kernel/auth/*
src/kernel/permissions/*
src/kernel/db/*
src/platform/module-loader.server.ts
src/modules/index.ts
src/app/api/kernel/*
src/app/(platform)/[orgSlug]/layout.tsx
next.config.ts
package.json
.env.example
deployment scripts
CI workflow files
```

These files define platform-wide behavior.

They may be edited, but only when the implementation package says so.

---

# 15. Dependency Rules for Claude

Claude must not add dependencies casually.

Any new dependency requires:

```txt
why needed
alternatives considered
bundle/runtime impact
security implications
maintenance risk
whether it affects server/client boundary
whether existing stack already solves it
```

No new dependency is allowed for:

```txt
convenience only
generic admin templates
unapproved table libraries
unapproved state managers
unapproved auth libraries
FastAPI/Python backend
workflow engines
AI libraries
file upload services
background job queues
```

unless approved by ADR or explicit implementation document.

---

# 16. Claude and Database Changes

Database changes are high-risk because OneDayOS uses one shared multi-tenant database.

Claude must not:

```txt
run production migrations
use prisma db push in staging/production
suggest migrate reset for production
hand-edit Supabase database schema
add module-specific duplicates of Business Objects
add nullable tenant fields for tenant-scoped tables
add broad customFields JSON to bypass modeling
```

Claude may write Prisma schema changes only if:

```txt
the relevant manual or module spec authorizes the model
migration risks are considered
tenant-scoped models include orgId
soft-delete rules are followed
indexes/unique constraints are tenant-safe
tests are updated
```

---

# 17. Claude and Secrets

Claude must never receive real production secrets.

Claude must not ask for:

```txt
production DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
Vercel tokens
GitHub tokens
OpenAI/API provider keys
SMTP credentials
payment provider keys
```

If a secret is pasted into chat or Claude, treat it as compromised and rotate it.

Claude may work with:

```txt
.env.example
placeholder env values
local fake test values
sanitized error logs
sanitized incident reports
```

---

# 18. Claude and Client Data

Claude must not receive real client data unless explicitly sanitized.

Do not paste:

```txt
real customer lists
real employee records
real financial records
real incident descriptions with personal data
real medical/legal/government ID data
full production logs with PII
full request bodies
database dumps
```

Claude may work with:

```txt
synthetic examples
sanitized records
minimal reproduction data
fake fixture data
```

---

# 19. Claude and UI Work

Claude must follow OneDayOS design standards.

Claude must not create:

```txt
generic Bootstrap-like dashboards
random stat card walls
fake charts
placeholder admin UI
per-module visual styles
per-client CSS forks
giant forms that mirror database columns
tables with no empty/loading/error states
loading states that only say "Loading..."
error states that only say "Error"
inaccessible clickable divs
```

Claude should use:

```txt
shared layout patterns
shared table patterns
shared form patterns
shared state components
brand tokens
Motion for React for meaningful transitions
optimistic UI with rollback
accessible labels and focus states
```

---

# 20. Claude and Modules

Claude must preserve module boundaries.

Modules may:

```txt
use SDK
use shared UI components
use Business Object APIs/services through approved boundaries
own domain-specific tables
own domain-specific services
emit and listen to events
declare manifest metadata
```

Modules must not:

```txt
import Kernel internals
import raw Prisma
import another module
duplicate Business Objects
accept client-supplied orgId
build Platform Services internally
create per-client logic
```

A module implementation is acceptable only if:

```txt
tenant isolation tests pass
permission-denial tests pass
module-disabled behavior is handled
events are emitted safely
soft delete is handled
API failure paths are tested
architecture checks pass
```

---

# 21. Claude and New Client Requests

Claude must not decide whether a client request becomes:

```txt
configuration
module extension
new module
Platform Service candidate
custom work
rejection
```

The Founder / Architect decides that classification.

Claude may help analyze a request if asked, but implementation should begin only after:

```txt
Discovery Brief
Scope Lock
Module Spec or configuration plan
```

---

# 22. Claude and Deferred Services

Claude may help document deferred services.

Claude may not implement them until promotion is approved.

The required promotion path is:

```txt
1. Evidence log
2. Three Independent Use Cases review
3. ADR if architectural
4. Implementation-grade manual document
5. Founder approval
6. Narrow Claude implementation package
7. Tests
8. CI checks
```

Roadmap presence is not implementation permission.

---

# 23. Claude and Founder Guide

The Founder Guide is separate from the Engineering Manual.

Claude may help write plain-language founder documents about:

```txt
how the platform works
clients vs tenants
Supabase ownership
backups
updates
AppCare
incidents
dedicated infrastructure
pricing implications
```

But founder guide content does not override frozen Engineering Manual documents.

If the Founder Guide reveals a real architecture issue, create an ADR or manual amendment.

---

# 24. Claude Review Checklist

After Claude completes a task, review using this checklist.

```txt
[ ] Did Claude stay within scope?
[ ] Did Claude cite/follow the authoritative manual documents?
[ ] Did Claude avoid deferred systems?
[ ] Did Claude avoid architecture changes?
[ ] Did Claude avoid new unapproved dependencies?
[ ] Did Claude preserve PlatformContext?
[ ] Did Claude avoid client-supplied orgId?
[ ] Did Claude avoid raw Prisma in modules?
[ ] Did Claude avoid Kernel imports in modules?
[ ] Did Claude avoid module-to-module imports?
[ ] Did Claude enforce permissions in APIs and services?
[ ] Did Claude add denial tests?
[ ] Did Claude add two-org tests where tenant-sensitive?
[ ] Did Claude run verification commands?
[ ] Did Claude report files changed?
[ ] Did Claude report unresolved risks?
```

If any answer is no, the implementation is not complete.

---

# 25. Required Claude Completion Report

Claude must end implementation tasks with this structure.

```md
## Implementation Summary

[Short summary]

## Files Changed

- `path/to/file`
- `path/to/file`

## Tests Added or Updated

- `path/to/test`

## Verification Commands

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Results:
- lint: pass/fail
- typecheck: pass/fail
- test: pass/fail
- build: pass/fail

## Architecture Compliance

- PlatformContext used: yes/no
- Client-supplied orgId rejected: yes/no
- Permissions enforced: yes/no
- Tenant isolation tests added: yes/no/not applicable
- Forbidden imports avoided: yes/no
- Deferred systems avoided: yes/no

## Deviations

[List any deviations from manual. If none, say none.]

## Risks / Follow-Ups

[List unresolved risks. If none, say none.]
```

Claude should not respond with vague completion statements like:

```txt
Done.
Everything works.
Implemented successfully.
```

without details.

---

# 26. Architecture Check Expectations

Claude should expect `check:architecture` to block unsafe patterns.

Examples:

```txt
modules importing @/kernel/*
modules importing other modules
modules importing raw Prisma
sdk.getDb(orgId)
request body orgId
hidden orgId form fields
/api/[module] route shape
redirect-style auth in API routes
full Prisma records in event payloads
framer-motion import in restarted code instead of motion/react
NEXT_PUBLIC_ server secrets
```

Claude should treat architecture-check failures as real failures, not lint noise.

---

# 27. Recommended Implementation Sequence for Restarted Build

When Claude restarts the platform, do not ask it to build modules first.

Use this sequence:

```txt
1. Bootstrap stack
2. Environment validation
3. Database schema foundation
4. Auth foundation
5. PlatformContext
6. Tenant routing and org shell
7. API error/response wrapper
8. Permission model and enforcement
9. SDK server/client split
10. Event system
11. Business Object services
12. Module registry/loader
13. Generator foundation
14. Design system shell/components
15. Testing/architecture checks
16. First official module only after gates pass
```

Inventory is not the beginning.

Inventory is proof that the foundation works.

---

# 28. Minimum Claude Package Before Restarted Foundation Build

Before asking Claude to restart the platform, prepare an Implementation Package that includes at minimum:

```txt
00 Vision
02 System Architecture
02 Layer Boundaries
04 Kernel Overview
04 Authentication
04 Organizations & Tenancy
04 Users/Roles/Permissions
04 Authorization Enforcement
04 Kernel API Contracts
05 SDK Overview
05 SDK Public API
05 SDK DB Access
05 SDK Auth & Permissions
05 SDK Events
06 Database Architecture
06 Tenancy Data Isolation
06 Prisma Conventions
06 Soft Delete & Archival
06 Migrations & Seeding
06 Data Validation with Zod
13 Security Model
13 Auth Security
13 Tenant Isolation
13 Permission Enforcement
13 API Security
13 Security Testing
13 Production Readiness Gate
14 Testing Philosophy
14 CI Quality Gates
03 Design Vision
03 Brand System
03 Layout System
03 Component Standards
03 Table Standards
03 Form Standards
03 Empty/Loading/Error States
03 Interaction/Motion Standards
03 Accessibility Standards
```

Do not overload Claude with all 100+ documents at once.

Give Claude the documents relevant to the subsystem being implemented.

---

# 29. Example: Good Claude Task

```txt
Task:
Implement PlatformContext and API-safe auth helpers.

Documents:
- 04-kernel/01-authentication.md
- 04-kernel/02-organizations-tenancy.md
- 04-kernel/04-authorization-enforcement.md
- 04-kernel/08-kernel-api-contracts.md
- 05-sdk/03-sdk-auth-permissions.md
- 13-security/02-tenant-isolation.md
- 13-security/04-api-security.md
- 14-testing-quality/03-api-testing.md

Scope:
- Create PlatformContext type.
- Implement requireApiAuth.
- Implement requireApiOrgContext.
- Implement requireApiModuleContext.
- Return JSON errors.
- Add tests for 401, wrong-org 404, suspended org, disabled module.

Exclusions:
- Do not implement business modules.
- Do not implement Platform Services.
- Do not implement RLS.
- Do not implement AI.
```

This is a good Claude task.

---

# 30. Example: Bad Claude Task

```txt
Build the OneDayOS kernel and make sure it supports modules.
```

This is bad because it lets Claude decide:

```txt
auth shape
tenant shape
permissions
API responses
database access
module loader
SDK
tests
UI
```

Do not use prompts like this.

---

# 31. Example: Good Module Task

```txt
Task:
Implement Inventory Stock Adjustment MVP.

Documents:
- 17-module-specifications/01-inventory-module.md
- 07-business-objects/02-product.md
- 07-business-objects/05-warehouse.md
- 07-business-objects/07-business-object-extension-pattern.md
- 08-module-system/*
- 05-sdk/*
- 13-security/*
- 03-design-system/table/form/state docs

Scope:
- InventoryProductExtension
- StockBalance
- StockMovement
- StockAdjustment
- list/detail/create adjustment pages
- adjustment API routes
- service transactions
- inventory events
- tests

Exclusions:
- Purchasing integration
- Notifications
- Approval Workflow Service
- Attachments
- Barcode hardware
- valuation/accounting
```

This is acceptable.

---

# 32. Example: Bad Module Task

```txt
Build inventory like Odoo.
```

This is unacceptable.

---

# 33. Claude Task Size Guidelines

Prefer tasks that can be completed and verified in one focused session.

Good task sizes:

```txt
one helper family
one API wrapper
one service
one module workflow
one shared component
one generator feature
one test fixture system
```

Too large:

```txt
whole kernel
whole module ecosystem
whole UI
whole security system
all platform services
all dynamic systems
```

If a task touches more than 10–15 meaningful files, consider splitting it.

---

# 34. Claude Escalation Rules

Claude should escalate to Founder/Architect when:

```txt
business rule unclear
scope unclear
client request outside planned modules
new module needed
new dependency needed
migration risk high
security behavior unclear
manual conflict exists
deferred system seems necessary
Platform Service candidate appears
dedicated infrastructure question arises
cost/pricing implication appears
```

Claude should not make these decisions alone.

---

# 35. Anti-Patterns

## 35.1 “Just Make It Work”

This causes architecture erosion.

OneDayOS must prefer:

```txt
make it right
make it tested
make it reusable
then make it fast
```

---

## 35.2 “Temporary” Client Forks

Temporary forks become permanent.

Do not create:

```txt
client-specific folders
client-specific environment branches
client-specific database schemas
client-specific UI variants
client-specific auth hacks
```

Use settings, modules, roles, permissions, and approved extension patterns.

---

## 35.3 “Generic Platform Service Because It Sounds Useful”

Do not build:

```txt
Workflow Engine
Notification Engine
Approval Engine
Search Engine
Report Builder
Custom Fields
Dynamic CRUD
```

until evidence justifies it.

---

## 35.4 “AI Will Figure It Out”

AI should not decide architecture.

AI should follow architecture.

---

# 36. Success Criteria

This workflow is successful when:

```txt
Claude implementation becomes faster
Claude output becomes more consistent
security mistakes become harder to introduce
module creation becomes repeatable
the generator produces safe scaffolds
tests catch architecture drift
the Founder can ask for implementation without re-explaining everything
the platform remains one shared platform, not many client forks
```

---

# 37. Founder Review Checklist

Before freezing this document, confirm:

```txt
[ ] Claude's role is clear.
[ ] ChatGPT/Architect's role is clear.
[ ] Founder approval flow is clear.
[ ] Implementation Package format is practical.
[ ] Stop conditions are strict enough.
[ ] Deferred systems are protected.
[ ] Security tests are non-negotiable.
[ ] Module implementation flow is realistic.
[ ] Generator workflow is clear.
[ ] There is no ambiguity about client forks.
[ ] There is no ambiguity about FastAPI exclusion.
[ ] There is no ambiguity about production secrets.
```

---

# 38. Final Rule

Claude should make OneDayOS faster to build.

Claude should not make OneDayOS easier to corrupt.

The Engineering Manual exists so that AI speed compounds good architecture instead of multiplying bad decisions.
