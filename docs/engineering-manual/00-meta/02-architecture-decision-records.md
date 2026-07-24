# OneDayOS Engineering Manual — Architecture Decision Records

**Document ID:** `00-meta/02-architecture-decision-records.md`  
**Version:** `1.0`  
**Status:** Frozen  
**Owner:** OneDayOS Founder / Lead Architect  
**Primary Audience:** Founder, ChatGPT Architect, Claude Code, future senior engineers  
**Implementation Allowed:** Governance document — use as authority for process
**Last Updated:** July 2026  
**Supersedes:** None  
**Related Documents:**

- `00-meta/00-roadmap.md`
- `00-meta/01-manual-governance.md`
- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `13-security/08-production-readiness-gate.md`

---

# Inventory Demo V2 ADR Registry Amendment — 2026-07

The Founder accepted the following ADR files. Their standalone files are authoritative and supersede conflicting entries in the historical draft backlog later in this document.

| ADR | Status | Implementation Timing |
| --- | --- | --- |
| `ADR-0014-compact-operational-page-header.md` | Accepted | V2-1 |
| `ADR-0015-shared-records-built-in-app-context.md` | Accepted | V2-1 |
| `ADR-0016-data-table-v2-and-modal-interactions.md` | Accepted | V2-2 and V2-3 |
| `ADR-0017-bounded-table-export.md` | Accepted | V2-5 |
| `ADR-0018-tenant-safe-caching-strategy.md` | Accepted | V2-7 after stabilization |
| `ADR-0019-curated-accent-presets.md` | Accepted | V2-8 |
| `ADR-0020-inventory-v2-operational-workflows.md` | Accepted | V2-6 |

Only V2-1 is the next authorized package, subject to explicit Founder approval of its implementation handoff. Acceptance of later ADRs freezes direction but does not authorize early implementation.

---

# 1. Purpose

This document defines how OneDayOS records important architecture decisions.

OneDayOS is intended to become a long-term business operating system, not a collection of one-off client applications. That means important architecture decisions must not live only in chat history, memory, code comments, or Claude’s temporary reasoning.

An **Architecture Decision Record**, or **ADR**, is the formal record of a significant technical, product-architecture, infrastructure, security, or platform decision.

The ADR system exists to answer questions like:

```txt
Why did we choose one shared database?
Why do modules use PlatformContext instead of orgId?
Why are Platform Services deferred?
Why are Business Objects separate from modules?
Why are normal clients not given their own Supabase projects?
Why is FastAPI excluded from the core platform?
Why is RLS deferred?
Why is Dynamic CRUD not implemented yet?
```

If a future engineer or AI agent disagrees with a decision, they should not silently change the system. They should read the relevant ADR, understand the context, and propose a new ADR if the decision needs to change.

---

# 2. Core Rule

```txt
Major architecture decisions must be written down before implementation.
```

Claude Code must not decide major architecture during implementation.

Claude may implement approved decisions. Claude may identify ambiguity. Claude may propose options. Claude may not silently choose new architecture.

---

# 3. What an ADR Is

An ADR is a short but complete decision document that records:

```txt
Context
Decision
Alternatives considered
Consequences
Follow-up work
```

It is not a long design document. It is not a full implementation plan. It is not a marketing document. It is not a code comment.

It is the permanent record of a decision that future work must respect.

---

# 4. Why OneDayOS Needs ADRs

OneDayOS has several decisions that will affect the platform for years:

```txt
shared database versus database-per-client
single deployment versus per-client deployments
SDK-only module access
Business Object ownership
Platform Service promotion rules
AI boundaries
module generator safety
Supabase/Vercel operating model
RLS timing
Dynamic Forms timing
FastAPI exclusion
```

Without ADRs, these decisions will be repeatedly re-litigated by every new engineer, AI session, or client exception.

The risk is not just confusion. The risk is architecture drift.

Example drift:

```txt
Current manual:
Modules must not import from @/kernel/*.

Future Claude task:
“Quickly build Inventory.”

Claude shortcut:
import { prisma } from '@/kernel/db/client'

Result:
The SDK boundary is broken.
```

An ADR gives us a durable answer:

```txt
ADR-0004 says modules must only import through the SDK.
This import violates the architecture.
Reject the implementation.
```

---

# 5. ADRs vs Engineering Manual Documents

The Engineering Manual defines the full system.

ADRs explain why major choices were made.

| Item | Purpose |
|---|---|
| Engineering Manual | Defines how OneDayOS should be built. |
| ADR | Records why a significant architecture decision was made. |
| Implementation Plan | Tells Claude what to build from frozen manual docs. |
| Code | Implements approved architecture. |
| Tests | Prove the implementation follows the architecture. |

Example:

```txt
Engineering Manual:
Modules use @/sdk/server and receive PlatformContext.

ADR:
We rejected sdk.getDb(orgId) because loose orgId creates tenant-isolation risk.

Implementation Plan:
Refactor module generator to emit sdk.getDb(ctx).

Code:
InventoryService.list(ctx)

Tests:
Generated modules fail if sdk.getDb(orgId) appears.
```

---

# 6. ADR Authority

## 6.1 Frozen Manual Authority

A frozen Engineering Manual document is implementation authority.

A draft ADR cannot override a frozen manual document.

## 6.2 Accepted ADR Authority

An accepted ADR may change or refine a frozen manual document, but the manual must be amended afterward.

The ADR is the decision. The manual amendment is the system update.

## 6.3 Code Authority

Code does not automatically override the manual or ADRs.

If code disagrees with the manual:

```txt
Either the code is wrong,
or the manual needs an amendment,
or a new ADR is required.
```

## 6.4 Chat Approval Authority

A decision made in conversation is not enough for long-term governance.

Important decisions discussed in chat must be converted into an ADR or manual amendment.

---

# 7. When an ADR Is Required

An ADR is required when a decision affects long-term architecture, security, operations, delivery model, or module ecosystem.

## 7.1 Required for Architecture Layer Changes

Write an ADR before changing:

```txt
Kernel responsibilities
Business Object boundaries
Platform Service rules
Business Module boundaries
Client Configuration model
SDK boundaries
module import rules
shared database model
tenancy model
routing model
```

Example ADR-required decisions:

```txt
Move Branch/Department from Kernel to Business Objects.
Move Warehouse from Business Object to Inventory.
Allow modules to import services from other modules.
Create a new Platform Service before three use cases exist.
```

## 7.2 Required for Tenancy and Infrastructure Decisions

Write an ADR before changing:

```txt
one shared database model
database-per-client strategy
schema-per-client strategy
per-client Supabase projects
per-client Vercel projects
dedicated infrastructure offering
cross-region hosting
self-hosting
backup/restore architecture
```

Example ADR-required decisions:

```txt
Give every client their own Supabase project.
Move enterprise clients to dedicated infrastructure.
Introduce database-per-tenant routing.
Use Supabase branching as part of production migration flow.
```

## 7.3 Required for Auth, Security, and Permissions

Write an ADR before changing:

```txt
identity provider
Supabase Auth usage
Prisma User identity model
User vs Employee relationship
permission model
wildcard permission behavior
ABAC or conditional permissions
support/admin access model
RLS strategy
service role usage
API auth behavior
```

Example ADR-required decisions:

```txt
Replace Supabase Auth.
Allow multi-org users.
Implement support-staff cross-org access.
Implement ABAC conditions.
Move permission checks entirely into RLS.
```

## 7.4 Required for SDK Contract Changes

Write an ADR before changing:

```txt
SDK import paths
@sdk/server split
@sdk/client split
PlatformContext shape
sdk.getDb(ctx) contract
sdk.events contract
sdk.permissions contract
module manifest compatibility
```

Example ADR-required decisions:

```txt
Reintroduce sdk.getDb(orgId).
Allow client components to import @/sdk directly with server helpers.
Expose raw Prisma through the SDK.
Change event envelope shape.
```

## 7.5 Required for Platform Services

Write an ADR before implementing or promoting:

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
Workflow Engine
Custom Fields Service
```

Platform Service ADRs require evidence.

They must reference:

```txt
Three Independent Use Cases evidence log
candidate service proposal
non-goals
data model
SDK contract
security model
test plan
operational cost
```

## 7.6 Required for Dynamic Systems

Write an ADR before implementing:

```txt
Dynamic Form Engine
Dynamic CRUD Engine
Dynamic Table View Engine
Import/Export Engine
View Builder
Custom Fields
metadata-to-database schema generation
runtime module builder
```

Dynamic systems are high-leverage but dangerous. They must not be implemented from roadmap enthusiasm alone.

## 7.7 Required for AI Runtime Features

Write an ADR before adding:

```txt
in-app AI chatbot
AI query engine
AI SQL generation
embeddings
vector search
RAG pipeline
AI support agent
AI mutation/action system
AI-generated production modules from user prompts
AI access to tenant business data
FastAPI/Python AI service
```

AI may assist development now. Runtime AI needs ADR approval.

## 7.8 Required for Major Dependencies and Providers

Write an ADR before adding major dependencies such as:

```txt
FastAPI
GraphQL
tRPC
Redis
queue provider
email provider
SMS provider
file storage provider beyond Supabase Storage
search engine
analytics/BI provider
monitoring stack beyond approved MVP tools
Python backend
microservice runtime
```

Small UI or utility dependencies may not require ADRs, but still require review if they affect the platform broadly.

## 7.9 Required for Module Boundary Decisions

Write an ADR before:

```txt
promoting a module-owned entity into Business Objects
demoting a Business Object into a module
allowing a module-to-module direct dependency
creating a vertical-specific module with sensitive data
creating a client-specific module exception
forking a module for a client
```

Example:

```txt
Fleet Management may start as a draft module.
But deciding Vehicle should become a shared Business Object requires ADR review.
```

## 7.10 Required for Commercial Model Changes

Write an ADR before changing technical architecture to support:

```txt
dedicated infrastructure tier
client-owned Supabase/Vercel accounts
marketplace modules
white-label deployments
source-code handover
on-premise deployments
enterprise SLA architecture
```

These decisions affect engineering, pricing, support, liability, and operations.

---

# 8. When an ADR Is Not Required

An ADR is usually not required for:

```txt
typo fixes
document formatting
minor copy changes
small bug fixes that align with the manual
adding tests that enforce existing rules
refactoring internal code without changing public contracts
implementing a frozen manual document
adding a route/page already defined by a frozen module spec
changing UI spacing within approved design tokens
adding a missing error state that follows the design system
updating docs to match an accepted ADR
```

If unsure, ask:

```txt
Will this decision affect future modules, clients, security, infrastructure, or platform direction?
```

If yes, write an ADR.

---

# 9. ADR Lifecycle

Every ADR has a status.

| Status | Meaning |
|---|---|
| `Proposed` | Written for review; not authoritative yet. |
| `Accepted` | Approved and authoritative. |
| `Rejected` | Considered but not adopted. |
| `Superseded` | Replaced by a newer ADR. |
| `Amended` | Still active but modified by a later ADR or amendment. |
| `Deprecated` | Still historically valid, but should not guide new work. |

## 9.1 Proposed

A proposed ADR may be discussed, edited, or rejected. Claude must not implement from a proposed ADR unless explicitly told to prototype.

## 9.2 Accepted

An accepted ADR becomes architecture authority.

Implementation may proceed only if the relevant manual documents and implementation package are also ready.

## 9.3 Rejected

Rejected ADRs are still valuable. They document alternatives we considered and why we did not choose them.

Example:

```txt
ADR-0014: Use database-per-client for all tenants
Status: Rejected
Reason: Too much operational burden for MVP/AppCare pricing.
```

## 9.4 Superseded

When a decision is replaced, do not delete the old ADR. Mark it superseded and link to the new ADR.

Example:

```txt
Superseded by: ADR-0027 Dedicated Enterprise Infrastructure Tier
```

## 9.5 Amended

Use amended when the decision remains mostly valid but gains a refinement.

Example:

```txt
ADR-0002: Shared database tenancy
Amended by ADR-0021: Enterprise clients may receive dedicated database on premium plan.
```

---

# 10. ADR Numbering and File Naming

ADRs should live here:

```txt
docs/engineering-manual/00-meta/adrs/
```

Use this naming format:

```txt
ADR-0001-short-kebab-title.md
ADR-0002-short-kebab-title.md
ADR-0003-short-kebab-title.md
```

Rules:

```txt
Use four-digit numbers.
Never reuse numbers.
Do not renumber ADRs.
Use lowercase kebab-case file names.
Keep the title short but meaningful.
```

Examples:

```txt
ADR-0001-one-shared-platform-deployment.md
ADR-0002-shared-postgres-orgid-tenancy.md
ADR-0003-platform-context-over-loose-orgid.md
ADR-0004-sdk-only-module-access.md
ADR-0005-fastapi-excluded-from-core-platform.md
```

---

# 11. ADR Required Metadata

Every ADR must begin with this metadata block:

```md
# ADR-0000: [Decision Title]

**Status:** Proposed | Accepted | Rejected | Superseded | Amended | Deprecated  
**Date:** YYYY-MM-DD  
**Owner:** [Name / Role]  
**Deciders:** [Founder, Architect, etc.]  
**Consulted:** [Optional]  
**Impacted Layers:** Kernel, SDK, Data, Business Objects, Platform Services, Modules, Client Delivery, Operations, AI  
**Related Manual Docs:**  
- `path/to/doc.md`  
**Supersedes:** None | ADR-0000  
**Superseded By:** None | ADR-0000  
**Implementation Allowed:** No | Yes | Conditional
```

---

# 12. ADR Template

Use this template for every ADR.

```md
# ADR-0000: [Decision Title]

**Status:** Proposed  
**Date:** YYYY-MM-DD  
**Owner:** OneDayOS Founder / Architect  
**Deciders:** Founder, Architect  
**Consulted:** Optional  
**Impacted Layers:** [Kernel, SDK, Data, etc.]  
**Related Manual Docs:**  
- `docs/engineering-manual/...`  
**Supersedes:** None  
**Superseded By:** None  
**Implementation Allowed:** Governance document — use as authority for process  

---

## Context

What problem are we solving?

What facts led to this decision?

What constraints matter?

What is happening now if we do nothing?

---

## Decision

State the decision clearly.

Use direct language:

```txt
We will...
We will not...
```

---

## Alternatives Considered

### Alternative 1: [Name]

Description.

Pros:

- ...

Cons:

- ...

Why rejected or accepted:

- ...

### Alternative 2: [Name]

...

---

## Consequences

### Positive Consequences

- ...

### Negative Consequences / Tradeoffs

- ...

### Risks Introduced

- ...

### Risks Reduced

- ...

---

## Implementation Impact

What must change in:

- Manual documents
- Code
- Tests
- Generators
- Operations
- Client delivery
- Claude prompts

---

## Rollback / Reversal Strategy

Can this decision be reversed later?

What would reversing it require?

What migration or compatibility issues would exist?

---

## Acceptance Criteria

This decision is correctly implemented when:

- [ ] ...
- [ ] ...
- [ ] ...

---

## Follow-Up Tasks

- [ ] Amend relevant manual docs
- [ ] Add or update tests
- [ ] Update generator templates
- [ ] Update Claude implementation prompt
- [ ] Add architecture checks if needed
```

---

# 13. Decision Categories

Use these categories to help classify ADRs.

## 13.1 Platform Architecture ADRs

Examples:

```txt
layer boundaries
SDK contract
module system
Business Object ownership
PlatformContext model
```

## 13.2 Data Architecture ADRs

Examples:

```txt
shared database
orgId tenancy
RLS strategy
Prisma conventions
migration model
soft delete
backup/restore strategy
```

## 13.3 Security ADRs

Examples:

```txt
auth provider
permission model
support access
MFA requirements
service role usage
AI data boundaries
```

## 13.4 Infrastructure ADRs

Examples:

```txt
Vercel deployment model
Supabase ownership model
dedicated infrastructure tier
monitoring provider
queue provider
storage provider
```

## 13.5 Module Ecosystem ADRs

Examples:

```txt
module versioning
marketplace readiness
module dependency model
module generator constraints
new reusable module categories
```

## 13.6 Platform Service Promotion ADRs

Examples:

```txt
promote module-local approvals to Approval Workflow Service
promote module-local files to Attachment Service
promote module-local search to Search Service
```

## 13.7 AI ADRs

Examples:

```txt
runtime AI support agent
AI query system
RAG/embedding storage
AI mutation actions
provider selection
```

## 13.8 Commercial/Delivery ADRs

Examples:

```txt
dedicated infrastructure pricing model
client-owned infrastructure policy
white-labeling
source-code handover
enterprise SLA support
```

---

# 14. ADR Review Workflow

## Step 1: Identify Decision

A decision may be raised by:

```txt
Founder
ChatGPT Architect
Claude Code
future engineer
client requirement
production incident
implementation ambiguity
manual conflict
```

## Step 2: Determine if ADR Is Required

Ask:

```txt
Does this affect future architecture, security, infrastructure, modules, clients, operations, or platform reuse?
```

If yes, write an ADR.

## Step 3: Draft ADR

Create file:

```txt
docs/engineering-manual/00-meta/adrs/ADR-XXXX-title.md
```

Set status:

```txt
Status: Proposed
Implementation Allowed: No
```

## Step 4: Review

Review should ask:

```txt
Is the problem real?
Are alternatives fairly considered?
Is the decision aligned with OneDayOS vision?
Does it preserve one-day delivery?
Does it reduce or increase operational cost?
Does it help or hurt module reuse?
Does it create security risk?
Does it create Claude ambiguity?
Does it require manual amendments?
Does it require tests or architecture checks?
```

## Step 5: Decide

Decision outcomes:

```txt
Accepted
Rejected
Deferred for more evidence
Needs revision
```

## Step 6: Update Manual

If accepted, update impacted manual documents.

An accepted ADR must not remain disconnected from the Engineering Manual.

## Step 7: Create Implementation Package

Claude receives a narrow implementation package, not the ADR alone.

Example:

```txt
Authoritative docs:
- ADR-0003-platform-context-over-loose-orgid.md
- 05-sdk/01-sdk-public-api.md
- 05-sdk/02-sdk-db-access.md
- 13-security/02-tenant-isolation.md

Task:
Refactor module generator to emit PlatformContext-based services.
```

## Step 8: Add Tests and Checks

Every accepted architecture/security ADR should consider:

```txt
unit tests
integration tests
API tests
security tests
architecture checks
generator tests
CI checks
```

---

# 15. ADR Conflict Resolution

Conflicts will happen.

Examples:

```txt
Older ADR says sdk.getDb(orgId).
New manual says sdk.getDb(ctx).

Older module spec says Product is inside Inventory.
Business Object document says Product is shared.

Old implementation uses /api/[module].
API contract says /api/orgs/[orgSlug]/[moduleId].
```

Resolve conflicts in this order:

```txt
1. Most recent accepted ADR
2. Frozen Engineering Manual document
3. Security / Production Readiness documents
4. Module specification
5. Existing code
6. Historical plans / old implementation notes
7. Chat history
```

Security documents override convenience.

Production readiness gates override module speed.

---

# 16. ADR Amendments

An ADR amendment is needed when a decision is still valid but must be refined.

Example:

```txt
Original ADR:
One shared production database for all normal clients.

Amendment:
Enterprise clients may purchase dedicated database infrastructure under a premium plan.
```

Do not edit history silently.

Preferred approach:

```txt
1. Keep original ADR.
2. Create new ADR that amends it.
3. Mark original ADR as Amended.
4. Link both documents.
5. Update manual docs.
```

---

# 17. ADR Reversal

Some decisions may be reversed later.

Reversal requires a new ADR.

A reversal ADR must include:

```txt
Why the original decision no longer fits
What changed
Migration plan
Compatibility impact
Client impact
Operational impact
Test plan
Rollback strategy
```

Example:

```txt
ADR-0005: FastAPI excluded from core platform.

Future reversal:
ADR-0042: Add Python AI Worker Service for document parsing.
```

This would not mean FastAPI becomes the main backend. The reversal may permit a narrow worker service while preserving the Next.js core platform.

---

# 18. Evidence Logs and ADRs

Some decisions require evidence before an ADR can be accepted.

This is especially true for:

```txt
Platform Services
Business Object field promotion
Dynamic Systems
dedicated infrastructure tiers
runtime AI features
background jobs
import/export engine
```

Evidence should be recorded before the ADR.

Example evidence log:

```md
# Evidence Log: Attachment Service Candidate

## Use Case 1
Module: Incident Reporting
Need: Attach photos to incident reports
Status: Confirmed

## Use Case 2
Module: Expenses
Need: Attach receipt images to expense claims
Status: Confirmed

## Use Case 3
Module: Assets
Need: Attach warranty documents to assets
Status: Confirmed

## Recommendation
Write ADR to promote attachment behavior into Platform Attachment Service.
```

Then write:

```txt
ADR-0018-promote-attachments-service.md
```

---

# 19. Initial ADR Backlog

The following ADRs should eventually be created and accepted or rejected formally.

Some of these decisions are already reflected in approved manual drafts. ADRs still help preserve the reasoning permanently.

## ADR-0001: One Shared Platform Deployment for MVP

Decision likely:

```txt
OneDayOS uses one shared production platform deployment for normal clients.
Clients are Organizations inside the app, not separate app forks.
```

Impacted areas:

```txt
Deployment
Client Delivery
AppCare
Cost Management
Tenancy
```

## ADR-0002: Shared PostgreSQL Database with orgId Tenancy

Decision likely:

```txt
MVP uses one shared PostgreSQL database with tenant-scoped tables separated by orgId.
No separate schemas or databases per normal client.
```

Impacted areas:

```txt
Data
Security
SDK
Testing
Backup/Restore
AppCare
```

## ADR-0003: PlatformContext Over Loose orgId

Decision likely:

```txt
Services and SDK DB access use verified PlatformContext, not loose orgId strings.
```

Impacted areas:

```txt
SDK
Data
Security
Modules
Generators
Tests
```

## ADR-0004: SDK-Only Module Access

Decision likely:

```txt
Business modules import from SDK surfaces only. Modules must not import Kernel internals or other modules.
```

Impacted areas:

```txt
Module System
SDK
Generators
Architecture Checks
```

## ADR-0005: Business Objects Are Conceptually Separate from Kernel

Decision likely:

```txt
Business Objects are a separate conceptual layer even if physically colocated in the MVP codebase/schema.
```

Impacted areas:

```txt
Architecture
Business Objects
Modules
UI Navigation
Events
```

## ADR-0006: FastAPI Excluded from Core Platform

Decision likely:

```txt
The restarted core platform uses Next.js route handlers as backend boundary. FastAPI is excluded unless a future ADR approves a narrow specialized service.
```

Impacted areas:

```txt
Architecture
Deployment
Operations
AI
Background Jobs
Cost
Claude Prompts
```

## ADR-0007: Supabase Auth plus Prisma User Identity Model

Decision likely:

```txt
Supabase Auth remains identity provider; Prisma User remains OneDayOS platform user; Supabase auth user ID equals Prisma User.id.
```

Impacted areas:

```txt
Auth
Security
Tenancy
Registration
User Management
```

## ADR-0008: RLS Deferred to Phase 1.5

Decision likely:

```txt
RLS is planned as defense-in-depth, not as MVP’s primary tenant isolation mechanism.
```

Impacted areas:

```txt
Data
Security
Prisma
SDK
Testing
```

## ADR-0009: Dynamic Forms and Dynamic CRUD Deferred

Decision likely:

```txt
Dynamic Forms and Dynamic CRUD are contract-only until repeated hand-coded module patterns prove the abstraction.
```

Impacted areas:

```txt
Dynamic Systems
Generators
Modules
Delivery
Claude Prompts
```

## ADR-0010: Platform Services Require Three Independent Use Cases

Decision likely:

```txt
Platform Services require evidence and review before implementation. Three use cases trigger proposal, not automatic code.
```

Impacted areas:

```txt
Platform Services
Modules
Delivery
Scope Control
Roadmap
```

## ADR-0011: Normal Clients Do Not Receive Supabase/Vercel Access

Decision likely:

```txt
Normal clients receive a OneDayOS Organization, not infrastructure access.
```

Impacted areas:

```txt
Supabase Operations
Vercel Deployment
Handover
AppCare
Security
```

## ADR-0012: Dedicated Infrastructure as Future Premium Option

Decision likely:

```txt
Dedicated infrastructure may exist later for enterprise/high-value clients, but is excluded from MVP and normal AppCare.
```

Impacted areas:

```txt
Commercial Model
Deployment
Operations
Cost Management
Support
```

## ADR-0013: Motion for React as Animation Standard

Decision likely:

```txt
Use Motion for React for meaningful UI transitions in restarted code; avoid old framer-motion imports in new code.
```

Impacted areas:

```txt
Design System
Component Standards
Interaction Standards
Dependencies
```

## ADR-0014: Module Generator Safety Model

Decision likely:

```txt
Generated modules must include PlatformContext, tenant-scoped APIs, permission enforcement, orgId rejection, and security tests by default.
```

Impacted areas:

```txt
CLI Generators
Module System
Security
Testing
CI
```

---

# 20. Example ADR Summary

The following is a compact example. Real ADRs should use the full template.

```md
# ADR-0006: Exclude FastAPI from the Core Platform

**Status:** Accepted  
**Date:** 2026-07-XX  
**Impacted Layers:** Architecture, Deployment, SDK, Operations, AI  
**Implementation Allowed:** No — decision record only

## Context

OneDayOS already uses Next.js route handlers, Supabase, Prisma, PostgreSQL, Vercel, and TypeScript. Adding FastAPI to the core platform would introduce a second backend runtime, second deployment surface, second security surface, and more ambiguity for Claude.

## Decision

We will not use FastAPI for the restarted core platform.

We may reconsider FastAPI later only through a future ADR for a narrow specialized service such as AI document processing or heavy Python-based jobs.

## Alternatives Considered

- Use FastAPI as the main backend.
- Use FastAPI only for AI services.
- Exclude FastAPI entirely for MVP.

## Consequences

Positive:

- Lower operational complexity.
- One backend boundary.
- Easier Claude implementation.
- Easier deployment.

Tradeoffs:

- Python-native AI/document workflows may require future ADR.

## Acceptance Criteria

- No FastAPI files in core platform.
- No Alembic or SQLAlchemy.
- No Python backend deployment.
- Claude prompts explicitly exclude FastAPI.
```

---

# 21. Claude Code Rules

Claude must follow these rules when an ADR may be needed.

## 21.1 Claude Must Stop on Architecture Ambiguity

If Claude encounters ambiguity such as:

```txt
Should this be Kernel or Platform Service?
Should this field go in Business Object or module extension table?
Should this client get dedicated infrastructure?
Should this module import another module?
Should this feature become a generic service?
Should FastAPI be added?
Should RLS be implemented now?
```

Claude must stop and report:

```txt
This appears to require an ADR.
Here are the options.
Here is my recommendation.
No implementation performed for this decision.
```

## 21.2 Claude Must Not Implement Proposed ADRs

Claude must not treat `Proposed` ADRs as implementation authority.

Claude may implement only after:

```txt
ADR accepted
manual amended if needed
implementation package written
```

## 21.3 Claude Must Link Implementation to ADRs

When implementing a decision governed by an ADR, Claude should mention:

```txt
Implemented according to ADR-XXXX and manual document Y.
```

## 21.4 Claude Must Not Override ADRs for Speed

Speed does not justify architecture violation.

Bad Claude behavior:

```txt
Imported Prisma directly because it was faster.
Used orgId from request body because simpler.
Created one client-specific module because deadline.
Added Notification Service because module needed alert.
```

Correct Claude behavior:

```txt
Follow SDK, PlatformContext, tenant-scoped API, permission checks, events, and tests.
If missing, stop and ask for architecture decision.
```

---

# 22. Implementation Package Template with ADRs

When sending Claude an implementation task that depends on ADRs, use this format:

```md
# Claude Implementation Package

## Task
Implement [specific subsystem].

## Authoritative Manual Documents
- `docs/engineering-manual/...`
- `docs/engineering-manual/...`

## Relevant ADRs
- `docs/engineering-manual/00-meta/adrs/ADR-0003-platform-context-over-loose-orgid.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0004-sdk-only-module-access.md`

## Non-Negotiable Rules
- Do not import from `@/kernel/*` inside modules.
- Do not use `sdk.getDb(orgId)`.
- Use verified `PlatformContext`.
- Reject client-supplied `orgId`.
- Use tenant-scoped API routes.
- Add tests for denial paths.

## Scope
Implement only:
- ...

Do not implement:
- ...

## Required Verification
Run:

```bash
npm run check:all
```

Report exact results.
```

---

# 23. ADR Anti-Patterns

Avoid these.

## 23.1 ADR After the Fact

Bad:

```txt
Claude implemented a new Platform Service.
Now write an ADR justifying it.
```

Correct:

```txt
Write ADR first.
Approve decision.
Implement later.
```

## 23.2 Vague ADR

Bad:

```txt
We will use best practices for security.
```

Correct:

```txt
APIs must use requireApiContext, return JSON 401/403/404, reject client-supplied orgId, and use PlatformContext.
```

## 23.3 ADR with No Alternatives

A decision without alternatives is just an opinion.

Every ADR must explain what was considered and rejected.

## 23.4 ADR That Does Not Update the Manual

An accepted ADR that never updates the manual causes hidden contradiction.

## 23.5 ADR Used to Avoid Evidence

Bad:

```txt
We want a Workflow Engine, so write ADR to build it.
```

Correct:

```txt
Gather evidence from repeated module workflows.
Then write ADR.
```

## 23.6 ADR Used for Tiny Decisions

Do not create ADRs for every small UI spacing tweak or copy edit. The ADR system should stay lightweight enough to be used.

---

# 24. Acceptance Criteria for the ADR System

This ADR system is ready when:

```txt
[ ] ADR folder exists in the repository.
[ ] ADR template exists.
[ ] Initial ADR backlog is created or triaged.
[ ] Manual governance references ADR process.
[ ] Claude workflow references ADR process.
[ ] Implementation packages include relevant ADRs.
[ ] Accepted ADRs trigger manual amendments.
[ ] Architecture conflicts are resolved through ADRs, not silent code drift.
```

---

# 25. Founder Checklist

Before accepting an ADR, ask:

```txt
[ ] Does this decision support OneDayOS as one shared platform?
[ ] Does this decision reduce or increase future custom work?
[ ] Does this decision help one-day delivery?
[ ] Does this decision preserve AppCare profitability?
[ ] Does this decision protect tenant isolation?
[ ] Does this decision keep Claude from inventing architecture?
[ ] Does this decision require tests or architecture checks?
[ ] Does this decision need pricing or delivery implications?
[ ] Does this decision create a support burden?
[ ] Is this decision reversible later?
```

If the answers are unclear, keep the ADR in `Proposed` status.

---

# 26. Final Rule

```txt
Architecture decisions should not disappear into memory.
They should become ADRs, manual updates, tests, and generator rules.
```

That is how OneDayOS avoids becoming a fragile collection of AI-generated code.
