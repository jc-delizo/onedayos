# OneDayOS Engineering Manual — Architecture Risk Register

**Document ID:** `02-architecture/06-architecture-risk-register`  
**Version:** `1.0`  
**Status:** Frozen  
**Owner:** Founder / Lead Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  
**Supersedes:** None  
**Depends On:**

- `00-meta/01-manual-governance.md`
- `00-meta/02-architecture-decision-records.md`
- `00-meta/04-definition-of-done.md`
- `01-foundation/00-vision.md`
- `01-foundation/03-platform-vs-modules.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `02-architecture/05-dependency-rules.md`
- `13-security/08-production-readiness-gate.md`

---

# 1. Purpose

This document tracks the architectural risks that could prevent OneDayOS from becoming a durable, reusable Business Operating System.

It exists because OneDayOS is not just a collection of client apps. OneDayOS is a shared platform with:

```txt
one codebase
one production deployment
one shared database
many tenant organizations
reusable modules
shared Business Objects
centralized AppCare operations
```

That model is powerful, but it means architectural mistakes can scale quickly.

The Risk Register turns vague concerns into explicit tracked risks with owners, severity, mitigation, status, and implementation gates.

---

# 2. Core Risk Philosophy

OneDayOS should not avoid risk by becoming slow or overengineered.

OneDayOS should manage risk by making the dangerous parts explicit, testable, and hard for Claude or future engineers to accidentally bypass.

The main rule:

```txt
A risk is acceptable only when it is visible, owned, mitigated, and gated.
```

Hidden risks are unacceptable.

---

# 3. What This Document Is Not

This document is not:

```txt
a bug tracker
a task list
a sprint board
a replacement for security testing
a replacement for ADRs
a reason to delay everything forever
a dumping ground for every hypothetical concern
```

It tracks architecture-level risks that can affect platform correctness, security, delivery, operations, cost, or long-term maintainability.

---

# 4. Risk Severity Levels

## 4.1 Critical

A Critical risk can compromise the platform model itself.

Examples:

```txt
cross-tenant data exposure
client-supplied tenant identity accepted
permission checks not enforced
production secrets exposed
shared database corrupted
per-client forks created casually
```

Critical risks must block production or official module rollout until mitigated.

---

## 4.2 High

A High risk can cause serious operational, security, delivery, or maintainability harm, but may not immediately compromise all tenants.

Examples:

```txt
weak generator output
missing denial tests
soft-delete bypasses
unverified migrations
bad rollback process
generic UI repeated across modules
```

High risks require active mitigation before scaling beyond early controlled use.

---

## 4.3 Medium

A Medium risk can create drag, rework, or future maintenance pain.

Examples:

```txt
premature Platform Service abstraction
unproven Dynamic CRUD
dependency drift
unclear module ownership
manual delivery steps not yet automated
```

Medium risks should be managed through deferral, evidence logs, or ADRs.

---

## 4.4 Low

A Low risk is worth tracking but does not currently threaten platform viability.

Examples:

```txt
minor naming inconsistency
non-critical UI polish gap
future feature uncertainty
small documentation ambiguity
```

Low risks can be reviewed periodically.

---

# 5. Risk Probability Levels

| Probability | Meaning |
|---|---|
| `High` | Likely to happen without active mitigation. |
| `Medium` | Plausible; should be watched and mitigated. |
| `Low` | Unlikely now, but possible later. |

---

# 6. Risk Statuses

| Status | Meaning |
|---|---|
| `Open` | Risk exists and is not fully mitigated. |
| `Mitigating` | Mitigation is in progress. |
| `Accepted` | Risk is consciously accepted for now with reason. |
| `Blocked` | Work cannot continue until this is resolved. |
| `Resolved` | Risk has been mitigated and verified. |
| `Deferred` | Risk belongs to a future phase and is intentionally not active now. |
| `Watching` | Risk does not block today but must be monitored. |

---

# 7. Risk Categories

OneDayOS risks are grouped into these categories:

```txt
Security
Tenancy
Authorization
API behavior
Data integrity
Database operations
Module boundaries
Business Object ownership
Generator safety
Design system
Dynamic systems
Platform Services
AI
Deployment
AppCare operations
Commercial viability
Cost
Founder/operator understanding
```

---

# 8. Current Architecture Risk Register

## R-001 — Tenant Isolation Incomplete

**Category:** Tenancy / Security  
**Severity:** Critical  
**Probability:** High  
**Status:** Open  
**Owner:** Kernel / Security  
**Blocks:** production, second tenant, official modules, AppCare claims

### Description

OneDayOS uses one shared production database with many tenant organizations separated by `orgId`. If tenant isolation is incomplete, one client could access another client's data.

### Known Source

The previous Kernel implementation explicitly identified incomplete organization membership checks and real tenant-isolation work as open issues.

### Risk

```txt
User from Org A guesses /org-b/dashboard
API route accepts orgId from request
Service receives loose orgId
Query does not scope by verified tenant
Cross-tenant data becomes visible or mutable
```

### Mitigation

```txt
Use verified PlatformContext for all protected operations.
Treat orgSlug as locator, not authorization.
Check user.orgId === org.id.
Reject client-supplied orgId.
Use /api/orgs/[orgSlug]/... tenant-scoped APIs.
Use sdk.getDb(ctx), not sdk.getDb(orgId).
Require two-organization tests.
```

### Required Evidence Before Resolution

```txt
[ ] User from Org A cannot load Org B tenant shell
[ ] User from Org A cannot read Org B API records
[ ] User from Org A cannot mutate Org B API records
[ ] Client-supplied orgId is rejected
[ ] Tenant-sensitive tests use at least two organizations
[ ] Architecture check blocks sdk.getDb(orgId) and body.orgId patterns
```

---

## R-002 — Permission System Exists but Is Not Enforced

**Category:** Authorization / Security  
**Severity:** Critical  
**Probability:** High  
**Status:** Open  
**Owner:** Kernel / SDK / Module System  
**Blocks:** production, official modules

### Description

A permission system that is modeled but not enforced creates false confidence. Users may have roles and permissions in the database, but APIs and services may still allow actions based only on authentication.

### Known Source

The previous Kernel implementation identified `sdk.permissions.can()` as existing but unenforced by routes and services.

### Risk

```txt
Staff user lacks inventory.stock_adjustment.create
API checks only authentication
Service performs mutation anyway
Permission model becomes decorative
```

### Mitigation

```txt
Use sdk.permissions.require(ctx, requirement).
Enforce permissions in API routes before service calls.
Enforce permissions in public service methods during MVP.
Use non-admin denial tests.
Separate module enablement from permission.
Separate read/export and create/import.
```

### Required Evidence Before Resolution

```txt
[ ] API permission-denial tests return JSON 403
[ ] Service permission-denial tests exist
[ ] Admin wildcard works only inside verified tenant
[ ] Non-admin user denial tests exist
[ ] Generated modules include permission-denial tests
```

---

## R-003 — API Auth Uses Redirect Behavior Instead of JSON Errors

**Category:** API Security  
**Severity:** High  
**Probability:** High  
**Status:** Open  
**Owner:** Kernel API  
**Blocks:** production, module APIs

### Description

Page auth helpers may redirect unauthenticated users to `/login`. API routes must not do this. APIs must return JSON `401`, not HTML or `307` redirects.

### Known Source

The previous Kernel implementation identified `requireAuth()` in API routes as returning redirects instead of JSON `401`s.

### Risk

```txt
API client expects JSON
Unauthenticated request receives login HTML
Client code breaks
Tests miss the issue
Security behavior becomes inconsistent
```

### Mitigation

```txt
Separate page auth helpers from API auth helpers.
Use sdk.auth.requireApiAuth() for APIs.
Use sdk.api.handle() to normalize errors.
Test no redirects and no HTML for protected APIs.
```

### Required Evidence Before Resolution

```txt
[ ] Unauthenticated API request returns 401 JSON
[ ] Protected API never returns login HTML
[ ] API tests assert content-type and response shape
[ ] Generated API template uses API-safe auth helper
```

---

## R-004 — Client-Supplied `orgId` Reintroduced

**Category:** Tenancy / Generator Safety / API Security  
**Severity:** Critical  
**Probability:** Medium  
**Status:** Open  
**Owner:** SDK / API / Generator  
**Blocks:** production, module generator

### Description

Client-supplied `orgId` is one of the most dangerous patterns in a shared database system. Tenant identity must come from authentication and route context, not request body, query string, hidden form fields, CSV files, or client state.

### Risk

```txt
User belongs to Org A
Client submits orgId = Org B
API trusts body.orgId
Cross-tenant write occurs
```

### Mitigation

```txt
Reject orgId in Zod schemas using z.strictObject().
Never include orgId in forms or hidden fields.
Use PlatformContext.
Use route orgSlug + authenticated user to resolve tenant.
Add check:architecture forbidden pattern rules.
```

### Required Evidence Before Resolution

```txt
[ ] API tests reject body.orgId
[ ] Form tests prove no hidden orgId
[ ] Import scripts derive orgId from operator context
[ ] Generated schemas reject orgId
[ ] Architecture checks block body.orgId, input.orgId, searchParams.get('orgId')
```

---

## R-005 — Soft Delete Can Be Bypassed

**Category:** Data Integrity / Privacy  
**Severity:** High  
**Probability:** High  
**Status:** Open  
**Owner:** Data / SDK  
**Blocks:** production confidence, official modules

### Description

Soft delete must be a lifecycle contract, not only a Prisma extension. If deleted records can appear through `findUnique`, `aggregate`, `groupBy`, nested includes, raw Prisma, or module shortcuts, the system may show records that should be hidden.

### Known Source

The previous Kernel implementation identified limited soft-delete coverage, including bypass paths like `findUnique`, `*OrThrow`, `aggregate`, `groupBy`, and nested reads.

### Risk

```txt
Record is soft-deleted
Module uses findUnique({ where: { id } })
Deleted record appears in UI or API
```

### Mitigation

```txt
Use service-level filters.
Forbid tenant-scoped findUnique({ id }) unless orgId is part of unique constraint.
Use sdk.getDb(ctx) access patterns.
Use explicit restore/admin paths.
Add tests for deleted-record hiding.
```

### Required Evidence Before Resolution

```txt
[ ] Normal list excludes deleted records
[ ] Normal detail excludes deleted records
[ ] Deleted records return safe 404 unless explicit restore/admin path
[ ] Restore path requires permission
[ ] Architecture check blocks unsafe findUnique in modules
```

---

## R-006 — Module Generator Scales Bad Architecture

**Category:** Generator Safety  
**Severity:** Critical  
**Probability:** Medium  
**Status:** Open  
**Owner:** CLI / Module System  
**Blocks:** module generator implementation

### Description

A generator can multiply architecture quickly. If it generates unsafe APIs, weak tests, raw Prisma, client-supplied `orgId`, or module-to-module imports, it will scale the exact mistakes OneDayOS is trying to avoid.

### Risk

```txt
npm run module:create creates unsafe route
Claude copies generated pattern
Every new module inherits security gaps
```

### Mitigation

```txt
Generated APIs use /api/orgs/[orgSlug]/[moduleId]/...
Generated services use PlatformContext.
Generated services enforce permissions.
Generated tests include two-org tenant isolation and permission denial.
Generated code is scanned by check:generated.
Generator fails closed.
```

### Required Evidence Before Resolution

```txt
[ ] module:create output passes check:architecture
[ ] generated module has no sdk.getDb(orgId)
[ ] generated module rejects orgId
[ ] generated module has two-org tests
[ ] generated module has permission-denial tests
[ ] generated module does not import @/kernel/* or raw Prisma
```

---

## R-007 — Business Objects Become Polluted With Module Fields

**Category:** Business Object Ownership  
**Severity:** High  
**Probability:** Medium  
**Status:** Open  
**Owner:** Business Objects / Module Specs  
**Blocks:** long-term module reuse

### Description

Business Objects must be the lowest common denominator shared identity layer. If module-specific fields are added to core Business Object tables too early, the data model becomes bloated and harder to reuse.

### Risk

```txt
Product gets reorderPoint, supplierLeadTime, salesPrice, barcode, taxCode, warrantyPeriod
Different modules fight over the same table
Core object stops being shared identity
```

### Mitigation

```txt
Use extension tables.
Promote fields only after evidence and ADR.
Business Object specs define excluded fields.
Module specs must declare extension tables.
```

### Required Evidence Before Resolution

```txt
[ ] Product/Customer/Supplier/Employee/Warehouse specs are frozen
[ ] Extension pattern is frozen
[ ] Module specs declare Business Objects used vs owned entities
[ ] Architecture check or review blocks duplicate shared entities
```

---

## R-008 — Modules Import Other Modules or Kernel Internals

**Category:** Dependency Boundaries  
**Severity:** High  
**Probability:** Medium  
**Status:** Open  
**Owner:** Architecture / Module System  
**Blocks:** official modules

### Description

Modules must be independently understandable but not independently sovereign. Direct imports from Kernel internals or other modules make refactors hard and create hidden coupling.

### Risk

```txt
Purchasing imports InventoryService
Leave imports Employee kernel internals
CRM imports Customer module code
A future refactor breaks multiple modules unpredictably
```

### Mitigation

```txt
Modules import from @/sdk only for platform capabilities.
Modules use Business Object public contracts.
Cross-module reactions use events.
Architecture checks block forbidden imports.
```

### Required Evidence Before Resolution

```txt
[ ] check:architecture blocks modules → @/kernel/*
[ ] check:architecture blocks modules → modules/*
[ ] check:architecture blocks raw Prisma in modules
[ ] module generator output obeys dependency rules
```

---

## R-009 — Generic Admin Starter UI Returns

**Category:** Design System / Product Quality  
**Severity:** High  
**Probability:** High  
**Status:** Open  
**Owner:** Design System  
**Blocks:** restarted platform UI build

### Description

The previous base app had authentication, sidebar, dashboard, cards, and CRUD, but it felt like a generic SaaS/admin template. If Claude restarts the platform UI without a frozen design system, this problem may return.

### Risk

```txt
fake dashboard cards
raw CRUD tables
generic forms
weak empty states
inconsistent module pages
OneDayOS feels like a template, not a product
```

### Mitigation

```txt
Freeze design vision, brand, layout, components, tables, forms, empty/loading/error states, motion, accessibility.
Use shared OneDayOS components.
Block arbitrary module UI patterns.
Use design-system implementation package before modules.
```

### Required Evidence Before Resolution

```txt
[ ] Design System baseline frozen
[ ] App shell implements layout rules
[ ] Shared table/form/state components exist
[ ] Generated modules use shared components
[ ] UI tests cover layout/state behavior
```

---

## R-010 — Dynamic Systems Built Too Early

**Category:** Overengineering / Dynamic Systems  
**Severity:** Medium  
**Probability:** Medium  
**Status:** Deferred  
**Owner:** Dynamic Systems  
**Blocks:** Dynamic Forms, Dynamic CRUD, Dynamic Tables

### Description

Dynamic Forms, Dynamic CRUD, Dynamic Table Views, Import/Export Engine, and View Builder are strategically important but dangerous if built before real patterns exist.

### Risk

```txt
OneDayOS becomes a weak no-code platform
security rules are bypassed by metadata
forms/tables feel generic
Claude builds a dynamic engine instead of useful modules
```

### Mitigation

```txt
Write contracts now.
Defer runtime engines.
Build hand-coded forms/tables first.
Extract only after repeated independent patterns prove the pain.
Require ADR before implementation.
```

### Required Evidence Before Resolution

```txt
[ ] At least three independent hand-coded examples exist
[ ] Pain points are documented
[ ] Security model is specified
[ ] ADR approved
[ ] Tests defined before implementation
```

---

## R-011 — Platform Services Built From Imagination

**Category:** Overengineering / Platform Services  
**Severity:** Medium  
**Probability:** High  
**Status:** Deferred  
**Owner:** Platform Services  
**Blocks:** Audit Log, Notifications, Approvals, Comments, Attachments, Activity Feed, Reporting, Search, Background Jobs

### Description

Platform Services should be promoted from repeated real needs. Building them too early creates operational complexity, database tables, APIs, permissions, UI, and tests before the real shape is known.

### Risk

```txt
Approval Engine built before actual approval workflows
Notification Service built before delivery channels are known
Attachment Service built before file/security/cost patterns are clear
```

### Mitigation

```txt
Use Three Independent Use Cases Rule.
Maintain evidence logs.
Write proposal and ADR before implementation.
Keep single-use capabilities module-local.
```

### Required Evidence Before Resolution

```txt
[ ] Evidence log has three independent use cases
[ ] Platform Service proposal exists
[ ] ADR approved
[ ] SDK contract defined
[ ] Security tests defined
```

---

## R-012 — Database Migration Damages Shared Production Data

**Category:** Database Operations / AppCare  
**Severity:** Critical  
**Probability:** Medium  
**Status:** Open  
**Owner:** Data / Operations  
**Blocks:** production migration process

### Description

OneDayOS uses one shared production database. A bad migration can affect all clients.

### Risk

```txt
migration drops column
backfill corrupts records across organizations
Vercel deploy rolls back code but database remains changed
client data is affected globally
```

### Mitigation

```txt
Use Prisma migrations only.
No production db push.
Staging verification required.
Pre-migration backup required.
Backfills must be tenant-aware, idempotent, batched, and dry-run capable.
Roll-forward plan required.
```

### Required Evidence Before Resolution

```txt
[ ] Production migration runbook frozen
[ ] Staging project exists
[ ] Migration applied to staging first
[ ] Backup/restore plan tested
[ ] Backfill scripts include dry-run mode
```

---

## R-013 — Live Migration and Seed Are Not Verified

**Category:** Database Operations  
**Severity:** High  
**Probability:** Medium  
**Status:** Open  
**Owner:** Data / Operations  
**Blocks:** production readiness

### Description

The previous implementation had schema and seed script written but not verified against a live PostgreSQL database.

### Risk

```txt
schema compiles locally
migration fails on actual Supabase Postgres
seed silently does not run
first deployment fails
```

### Mitigation

```txt
Run migrations against staging Supabase.
Run seed against staging.
Verify Prisma generate in build/CI.
Test idempotent seed behavior.
```

### Required Evidence Before Resolution

```txt
[ ] staging migration succeeds
[ ] staging seed succeeds
[ ] seed is idempotent
[ ] fresh clone check passes
[ ] CI includes prisma generate
```

---

## R-014 — Fresh CI/Deployment Fails Due to Missing Prisma Generation

**Category:** CI / Deployment  
**Severity:** High  
**Probability:** Medium  
**Status:** Open  
**Owner:** CI / Data  
**Blocks:** reliable deployment

### Description

Fresh clones and Vercel builds must generate Prisma Client. Relying on local developer state is unsafe.

### Risk

```txt
Developer build works
CI clone has no generated Prisma Client
Vercel deployment fails
or generated client is stale
```

### Mitigation

```txt
Include prisma generate in build and check workflows.
Use npm run check:all.
CI runs typecheck, tests, architecture checks, generated checks, and build.
```

### Required Evidence Before Resolution

```txt
[ ] npm run build includes prisma generate
[ ] CI includes prisma generate
[ ] fresh clone verification passes
```

---

## R-015 — Shared Infrastructure Blast Radius

**Category:** Operations / AppCare / Infrastructure  
**Severity:** High  
**Probability:** Medium  
**Status:** Watching  
**Owner:** Operations  
**Blocks:** AppCare maturity if unmanaged

### Description

A shared Supabase/Vercel platform means one infrastructure incident can affect multiple clients.

### Risk

```txt
Supabase project outage affects all tenants
bad deployment affects all tenants
billing issue affects all clients
account compromise affects the platform
```

### Mitigation

```txt
Company-owned Supabase and Vercel accounts.
MFA enforced.
At least two trusted owners.
Staging and production separated.
Backups and restore drills.
Incident response runbook.
Dedicated infrastructure only for premium/enterprise later.
```

### Required Evidence Before Resolution

```txt
[ ] company-owned infrastructure accounts
[ ] MFA enforced
[ ] two owners configured
[ ] backups enabled
[ ] restore drill completed
[ ] incident response runbook exists
```

---

## R-016 — AppCare Becomes Unlimited Custom Labor

**Category:** Commercial Viability / Operations  
**Severity:** High  
**Probability:** High  
**Status:** Open  
**Owner:** Founder / Client Delivery  
**Blocks:** scalable business model

### Description

AppCare must support hosting, monitoring, security updates, backups, bug fixes, maintenance, and limited support. It must not become unlimited custom development for ₱3,500/month.

### Risk

```txt
clients request new modules under AppCare
support becomes constant custom labor
margins collapse
platform becomes agency work
```

### Mitigation

```txt
Classify every support request.
Separate bug fixes from enhancements.
Use change request process.
Use scope-control language.
Protect founder time.
```

### Required Evidence Before Resolution

```txt
[ ] AppCare document frozen
[ ] support classification workflow exists
[ ] client handover explains AppCare boundaries
[ ] support templates exist
```

---

## R-017 — Client-Specific Forks Appear

**Category:** Commercial / Architecture  
**Severity:** Critical  
**Probability:** Medium  
**Status:** Open  
**Owner:** Founder / Architecture  
**Blocks:** long-term platform viability

### Description

Client-specific forks destroy the shared-platform model. OneDayOS should not become ten separate codebases for ten clients.

### Risk

```txt
client-a branch has custom changes
client-b branch has different custom changes
updates must be copied manually
security fixes become inconsistent
AppCare becomes impossible to scale
```

### Mitigation

```txt
Use one shared codebase.
Represent clients as Organizations.
Use settings, permissions, feature flags, modules, and extension tables.
Use new draft modules for reusable verticals.
Dedicated deployments only as premium/enterprise exceptions.
```

### Required Evidence Before Resolution

```txt
[ ] client delivery docs frozen
[ ] no client-specific source folders
[ ] scope-control docs frozen
[ ] dedicated infrastructure policy documented
```

---

## R-018 — FastAPI or Second Backend Runtime Added Prematurely

**Category:** Technology / Operations  
**Severity:** Medium  
**Probability:** Medium  
**Status:** Accepted / Watching  
**Owner:** Architecture  
**Blocks:** core platform simplicity

### Description

Adding FastAPI or another backend runtime to the core platform would create a second deployment, auth surface, data access path, test model, and operational burden.

### Risk

```txt
Next.js APIs enforce PlatformContext
FastAPI endpoint bypasses it
permissions diverge
Prisma and Python data models drift
operations become harder
```

### Mitigation

```txt
Exclude FastAPI from core platform.
Use Next.js Route Handlers as backend boundary.
Require ADR for any future specialized Python service.
Modules must never call specialized services directly.
```

### Required Evidence Before Resolution

```txt
[ ] technology baseline excludes FastAPI
[ ] dependency rules exclude Python backend files
[ ] ADR required for future exception
```

---

## R-019 — Runtime AI Becomes Security or Cost Risk

**Category:** AI / Security / Cost  
**Severity:** High  
**Probability:** Medium  
**Status:** Deferred  
**Owner:** AI Layer / Security  
**Blocks:** user-facing AI features

### Description

Runtime AI can become a permission bypass, data exfiltration tool, hidden export system, cost leak, or prompt-injection surface.

### Risk

```txt
AI receives too much tenant data
AI answers across permissions
AI runs SQL
AI mutates production data
AI cost scales unpredictably
```

### Mitigation

```txt
No runtime AI in foundation build.
Reserve sdk.ai but do not implement.
Use AI Context contracts.
Require PlatformContext.
No raw SQL.
Preview + confirmation for future actions.
Sensitive fields excluded by default.
```

### Required Evidence Before Resolution

```txt
[ ] AI safety docs frozen
[ ] AI feature proposal exists
[ ] cost model approved
[ ] security tests defined
[ ] prompt-injection strategy defined
```

---

## R-020 — Founder/Operator Does Not Understand Shared Platform Operations

**Category:** Founder Operations / AppCare  
**Severity:** Medium  
**Probability:** Medium  
**Status:** Open  
**Owner:** Founder Guide  
**Blocks:** operational confidence

### Description

The shared platform model requires the founder/operator to understand tenants, Supabase ownership, backups, deployments, incidents, AppCare, and dedicated infrastructure exceptions.

### Risk

```txt
founder accidentally promises per-client infrastructure
backup assumptions are misunderstood
clients are onboarded before operations are ready
incident response is improvised
```

### Mitigation

```txt
Create separate Founder Guide outside Engineering Manual.
Explain platform model in plain language.
Explain clients vs tenants vs infrastructure.
Explain backups, outages, restore, AppCare, and dedicated infrastructure.
```

### Required Evidence Before Resolution

```txt
[ ] Founder Guide created
[ ] infrastructure model explained
[ ] backup/restore model explained
[ ] AppCare boundaries explained
[ ] dedicated infrastructure policy explained
```

---

## R-021 — Import/Export Becomes a Data Leak or Corruption Tool

**Category:** Data Security / Dynamic Systems  
**Severity:** High  
**Probability:** Medium  
**Status:** Deferred / Watching  
**Owner:** Data / Dynamic Systems  
**Blocks:** generic import/export engine

### Description

Imports and exports are commercially useful, but risky. Exports can leak data. Imports can corrupt tenant data or duplicate Business Objects.

### Risk

```txt
export bypasses export permission
import accepts orgId column
CSV links records across tenants
bad import creates duplicate Products or Employees
```

### Mitigation

```txt
Full Import/Export Engine deferred.
Limited onboarding scripts allowed.
Read permission is not export permission.
Create permission is not import permission.
Imports validate before writing.
Tenant context is server-derived.
```

### Required Evidence Before Resolution

```txt
[ ] import/export contract frozen
[ ] export permissions defined
[ ] import validation tests defined
[ ] orgId rejection tests defined
[ ] onboarding script process documented
```

---

## R-022 — File Attachments Introduce Storage, Privacy, and Backup Risk

**Category:** Attachments / Storage / Privacy / Cost  
**Severity:** High  
**Probability:** Medium  
**Status:** Deferred  
**Owner:** Platform Services / Operations  
**Blocks:** Attachment Service, module file uploads

### Description

Files are not just files. They introduce storage costs, access control, signed URLs, backups, virus/security concerns, privacy exposure, and restore complexity.

### Risk

```txt
public bucket exposes private files
file metadata and object storage become inconsistent
Storage objects are not covered by DB backup
attachments bypass target-record permission
```

### Mitigation

```txt
Attachment Service deferred.
Module-local file handling requires founder approval.
Private buckets only for business files.
Signed URLs only through server authorization.
Storage backup plan required before serious file use.
```

### Required Evidence Before Resolution

```txt
[ ] Attachment Service evidence exists
[ ] storage access model defined
[ ] backup plan covers objects
[ ] permissions tested
[ ] cost limits defined
```

---

## R-023 — Module Specs Become Documentation but Not Implementation Contracts

**Category:** Module Delivery / Claude Workflow  
**Severity:** High  
**Probability:** Medium  
**Status:** Open  
**Owner:** Module Specs / Claude Workflow  
**Blocks:** official module implementation

### Description

Module specs must be implementation-grade contracts. If they are treated as lightweight docs, Claude may still invent architecture during implementation.

### Risk

```txt
module spec says Inventory exists
Claude invents tables, APIs, permissions, events, and UI
platform rules are bypassed
```

### Mitigation

```txt
Use module spec template.
Every module spec defines Business Objects, owned entities, extension tables, permissions, routes, APIs, services, events, tests, and non-goals.
Claude receives implementation package referencing frozen specs.
```

### Required Evidence Before Resolution

```txt
[ ] module spec template frozen
[ ] official module spec frozen before implementation
[ ] Claude prompt references exact spec docs
[ ] module implementation reports deviations
```

---

## R-024 — Documentation Approval Does Not Equal Repository Freeze

**Category:** Governance / Implementation Control  
**Severity:** Medium  
**Probability:** High  
**Status:** Open  
**Owner:** Manual Governance  
**Blocks:** controlled Claude implementation

### Description

Conversation approval is useful, but a formal repository freeze is still required before Claude implements from the Engineering Manual.

### Risk

```txt
doc approved in chat
repo copy differs
Claude implements outdated file
manual conflicts go unnoticed
```

### Mitigation

```txt
Manual governance defines statuses.
Frozen documents live in repository.
Implementation packages reference exact paths and versions.
ADRs handle changes.
```

### Required Evidence Before Resolution

```txt
[ ] manual files committed to repo
[ ] document statuses reviewed
[ ] frozen docs marked explicitly
[ ] implementation package references exact docs
```

---

## R-025 — Technology Baseline Drifts Too Quickly

**Category:** Dependency / Maintainability  
**Severity:** Medium  
**Probability:** Medium  
**Status:** Watching  
**Owner:** Architecture / CI  
**Blocks:** stable implementation if unmanaged

### Description

OneDayOS relies on modern tools that change quickly: Next.js, React, Prisma, Tailwind, shadcn/ui, Zod, Supabase, Vercel, Motion, Vitest. Uncontrolled upgrades can break implementation patterns.

### Risk

```txt
Claude installs latest dependency
API changes silently break patterns
manual becomes stale
generated code no longer compiles
```

### Mitigation

```txt
Freeze technology baseline.
Commit package-lock.json.
Require ADR for major dependency changes.
Use CI.
Update manual when dependencies change.
```

### Required Evidence Before Resolution

```txt
[ ] technology baseline frozen
[ ] lockfile committed
[ ] upgrade policy documented
[ ] CI catches compatibility failures
```

---

# 9. Top Immediate Blockers for Restarted Development

Before Claude restarts the foundation build, the following risks must be treated as blockers:

```txt
R-001 Tenant Isolation Incomplete
R-002 Permission System Exists but Is Not Enforced
R-003 API Auth Uses Redirect Behavior Instead of JSON Errors
R-004 Client-Supplied orgId Reintroduced
R-006 Module Generator Scales Bad Architecture
R-009 Generic Admin Starter UI Returns
R-012 Database Migration Damages Shared Production Data
R-014 Fresh CI/Deployment Fails Due to Missing Prisma Generation
```

The restarted build should not recreate the previous MVP and patch these later. These must be built into the foundation.

---

# 10. Risks That Are Intentionally Deferred

The following are real risks, but the correct mitigation is **not** to build the full solution now:

```txt
Dynamic Forms
Dynamic CRUD
Dynamic Table Views
View Builder
Audit Log Service
Notification Service
Approval Workflow Service
Comments Service
Attachments Service
Activity Feed
Reporting Service
Search Service
Background Jobs
Runtime AI
Dedicated client infrastructure
FastAPI / Python backend services
```

These are deferred because premature implementation would add complexity before OneDayOS has enough real module evidence.

---

# 11. Risk Review Cadence

## 11.1 During Manual Writing

Review this register after every major section:

```txt
Architecture
Kernel
SDK
Data
Business Objects
Module System
Generators
Design System
Security
Testing
Deployment
Client Delivery
Module Specs
```

---

## 11.2 During Claude Implementation

Claude must review relevant risks before implementation.

Every implementation package should include:

```txt
Relevant risk IDs:
- R-001 Tenant Isolation Incomplete
- R-002 Permission System Exists but Is Not Enforced
- R-003 API Auth Uses Redirect Behavior Instead of JSON Errors
```

Claude must report which risks were mitigated or affected.

---

## 11.3 Before Production

Run a risk review before:

```txt
first production deployment
first paid client
second tenant
first official module
AppCare launch
first production migration
first import/export script
first file upload
first runtime AI feature
```

---

# 12. Risk Escalation Rules

A risk must be escalated to ADR/manual review if it involves:

```txt
tenancy model changes
per-client infrastructure
FastAPI or second backend runtime
new database strategy
runtime AI
Platform Service implementation
Dynamic Form/CRUD implementation
Business Object ownership change
raw Prisma access from modules
module-to-module imports
production migration risk
security/privacy incident
client-specific fork pressure
```

Claude must not resolve these alone.

---

# 13. Claude Instructions

Claude must follow these rules when working on OneDayOS:

```txt
1. Read the relevant frozen manual documents.
2. Read the relevant risk IDs.
3. Do not implement around a Critical or High risk without addressing it.
4. Do not mark a task done if relevant risk tests are missing.
5. Do not create new risk surfaces casually.
6. Stop if a requested change conflicts with this register.
7. Report any newly discovered risk.
8. Add regression tests for any risk that becomes a real bug.
```

Claude must not say:

```txt
Done, but tenant tests are missing.
Done, but permissions are not enforced yet.
Done, but API auth still redirects.
Done, but generated modules are only placeholders.
Done, but migration was not tested.
```

Those are not done states.

---

# 14. Risk Register Update Template

When adding a new risk, use this format:

```md
## R-XXX — [Risk Name]

**Category:**  
**Severity:** Critical | High | Medium | Low  
**Probability:** High | Medium | Low  
**Status:** Open | Mitigating | Accepted | Blocked | Resolved | Deferred | Watching  
**Owner:**  
**Blocks:**

### Description

### Risk

### Mitigation

### Required Evidence Before Resolution

### Related Documents
```

---

# 15. Acceptance Criteria

This document is ready to freeze when:

```txt
[ ] Critical current risks are listed
[ ] High current risks are listed
[ ] Deferred risks are clearly marked
[ ] Production blockers are explicit
[ ] Claude escalation rules are clear
[ ] Risk statuses are defined
[ ] Risk review cadence is defined
[ ] Risk update template exists
[ ] Founder understands that risk tracking is not the same as implementation
```

---

# 16. Final Rule

The final rule of the Architecture Risk Register is:

```txt
OneDayOS may move fast only when the dangerous parts are visible.
```

A shared platform can scale value quickly.

It can also scale mistakes quickly.

This register exists to make sure OneDayOS scales the value, not the mistakes.
