# OneDayOS Engineering Manual — Manual Governance

**Document ID:** EM-00-01  
**Section:** 00 Meta  
**Status:** Frozen  
**Version:** 1.0.0  
**Author:** ChatGPT, acting as OneDayOS Founding Software Architect  
**Owner:** OneDayOS Founder / Architecture Lead  
**Last Updated:** July 2026  
**Implementation Allowed:** Governance document — use as authority for process
**Supersedes:** None  
**Related Documents:**

- `00-meta/00-roadmap.md`
- `00-meta/02-architecture-decision-records.md`
- `00-meta/03-claude-workflow.md`
- `00-meta/04-definition-of-done.md`
- `13-security/08-production-readiness-gate.md`

---

# 1. Purpose

This document defines how the OneDayOS Engineering Manual is created, reviewed, approved, frozen, amended, superseded, and used by engineers and AI coding agents.

The Engineering Manual is not normal documentation.

It is the operating system for building OneDayOS.

Its purpose is to prevent this pattern:

```txt
Founder explains architecture
  ↓
Claude implements from memory
  ↓
Claude fills gaps with assumptions
  ↓
Architecture drifts
  ↓
Modules become custom apps
  ↓
OneDayOS stops being a platform
```

The correct pattern is:

```txt
Founder + Architect write manual
  ↓
Founder approves manual
  ↓
Manual is frozen
  ↓
Claude implements only from frozen docs
  ↓
Tests prove the rules
  ↓
Platform stays coherent
```

This governance document exists so that the manual itself does not become stale, contradictory, or casually ignored.

---

# 2. Core Governance Principle

The Engineering Manual is the source of truth for OneDayOS architecture.

The codebase is evidence of implementation.

The roadmap is a guide.

The old Kernel v2 plan is historical reference.

Claude output is implementation work.

Only frozen Engineering Manual documents are authoritative for new implementation.

---

# 3. What This Document Governs

This document governs:

```txt
Engineering Manual documents
Architecture Decision Records
Claude implementation prompts
Module specifications
Platform Service specifications
Security gates
Production readiness gates
Design system standards
Testing standards
Deployment standards
Client delivery playbooks
```

It does not govern:

```txt
Sales copy
Marketing pages
Client proposals
Invoices
Legal contracts
Internal finance docs
Founder learning guides
```

Those may reference the Engineering Manual, but they are not part of the manual unless explicitly placed under the manual folder.

---

# 4. Manual Repository Location

In the project repo, the canonical manual should live here:

```txt
docs/engineering-manual/
```

Recommended structure:

```txt
docs/engineering-manual/
  00-meta/
  01-foundation/
  02-architecture/
  03-design-system/
  04-kernel/
  05-sdk/
  06-data/
  07-business-objects/
  08-module-system/
  09-cli-generators/
  10-platform-services/
  11-dynamic-systems/
  12-ai-layer/
  13-security/
  14-testing-quality/
  15-deployment-operations/
  16-client-delivery/
  17-module-specifications/
```

Chat-exported Markdown files may include version suffixes for handoff convenience, such as:

```txt
onedayos-engineering-manual-04-kernel-01-authentication-v1.md
```

But inside the actual repo, stable paths are preferred:

```txt
docs/engineering-manual/04-kernel/01-authentication.md
```

The version should live in the document header.

---

# 5. Required Document Header

Every Engineering Manual document must start with a structured header.

Required fields:

```md
# OneDayOS Engineering Manual — [Document Title]

**Document ID:** EM-[SECTION]-[NUMBER]
**Section:** [Manual Section]
**Status:** [Status]
**Version:** [Semver]
**Author:** [Author]
**Owner:** [Owner]
**Last Updated:** [Date]
**Implementation Allowed:** Governance document — use as authority for process  
**Supersedes:** [Document or None]
**Superseded By:** [Document or None]
**Related Documents:**
- ...
```

Optional fields:

```md
**Effective Date:** [Date]
**Reviewers:** [Names/Roles]
**ADR Dependencies:** [ADR IDs]
**Applies To:** [Kernel/SDK/Modules/etc.]
**Implementation Scope:** [Short statement]
```

A document without a header is not implementation-authoritative.

---

# 6. Manual Statuses

Every document must have exactly one status.

## 6.1 Draft for Founder Review

Meaning:

```txt
The document has been written but not approved.
It may contain open decisions.
Claude must not implement from it.
```

Allowed actions:

```txt
Founder review
Architect revision
Commenting
Clarification
```

Forbidden actions:

```txt
Claude implementation
Production use
Treating the document as final authority
```

---

## 6.2 Approved for Freeze

Meaning:

```txt
Founder has approved the substance of the document.
The document is ready to be included in a freeze batch.
```

This status is useful because conversation approval and repository freeze are not the same thing.

When the founder says:

```txt
Approved, proceed to the next step.
```

that means:

```txt
Approved for freeze candidate
```

It does not automatically mean the repo file has been updated to `Frozen`.

Why this distinction exists:

```txt
A chat artifact may say Draft.
A founder may approve it in conversation.
The repo still needs a controlled freeze pass before Claude implements from it.
```

---

## 6.3 Frozen

Meaning:

```txt
The document is approved, stable, and implementation-authoritative.
Claude may implement from it if the implementation package points to it.
```

Requirements before marking Frozen:

```txt
[ ] Founder has approved it
[ ] Header is complete
[ ] Version is set
[ ] Related documents are listed
[ ] Conflicts with other docs are resolved
[ ] Implementation status is clear
[ ] Deferred items are clearly marked
[ ] Acceptance criteria exist where needed
[ ] Claude instructions exist where needed
```

Only Frozen documents may be used as the primary source for implementation.

---

## 6.4 Deferred — Contract Only

Meaning:

```txt
The document defines a future capability contract,
but implementation is explicitly not allowed yet.
```

Examples:

```txt
Notification Service
Approval Workflow Service
Dynamic Form Engine
Dynamic CRUD Engine
AI Query Patterns
Attachments Service
Background Jobs
```

Claude may read these documents to avoid violating future architecture, but may not implement their systems unless a later frozen implementation document explicitly permits it.

---

## 6.5 Amended

Meaning:

```txt
A frozen document has been changed through a controlled amendment.
```

Amendments require:

```txt
[ ] Reason for amendment
[ ] Sections changed
[ ] Compatibility impact
[ ] Implementation impact
[ ] Tests affected
[ ] Whether an ADR is required
[ ] Version bump
[ ] Changelog entry
```

Minor clarifications may become `1.1.0`.

Bugfix wording may become `1.0.1`.

Architectural changes usually require `2.0.0` or an ADR.

---

## 6.6 Superseded

Meaning:

```txt
The document has been replaced by another document.
It remains in history but is no longer authoritative.
```

A superseded document must clearly state:

```txt
**Status:** Superseded
**Superseded By:** [new document path]
```

Claude must not implement from superseded documents.

---

## 6.7 Deprecated

Meaning:

```txt
The document or rule is still temporarily valid,
but scheduled for replacement.
```

Use sparingly.

Deprecated rules must have:

```txt
[ ] Replacement path
[ ] Timeline or trigger
[ ] Migration note
```

---

# 7. Conversation Approval vs Repository Freeze

During manual creation, the founder may approve each document in conversation.

That approval means:

```txt
The founder accepts the document direction.
Proceed to the next document.
```

It does not automatically update file headers in the repository.

Before Claude starts implementation, OneDayOS should run a dedicated **Freeze Pass**:

```txt
1. Collect all approved draft documents.
2. Check for conflicts.
3. Update status from Draft for Founder Review to Frozen.
4. Update versions if needed.
5. Commit them to the repo.
6. Create an Implementation Package listing the exact frozen docs Claude may use.
```

This avoids ambiguity where a chat says approved but a file still says draft.

---

# 8. Versioning Rules

Engineering Manual documents use semantic-style versioning:

```txt
MAJOR.MINOR.PATCH
```

## 8.1 Patch Version

Use patch changes for:

```txt
typos
formatting fixes
broken links
minor wording corrections that do not change meaning
```

Example:

```txt
1.0.0 → 1.0.1
```

---

## 8.2 Minor Version

Use minor changes for:

```txt
clarifications
new examples
additional non-conflicting rules
expanded acceptance criteria
new test cases that reinforce existing rules
```

Example:

```txt
1.0.0 → 1.1.0
```

---

## 8.3 Major Version

Use major changes for:

```txt
architecture boundary changes
security model changes
tenancy model changes
SDK contract changes
database architecture changes
module dependency changes
implementation permission changes
reversal of a previous decision
```

Example:

```txt
1.0.0 → 2.0.0
```

Major changes usually require an ADR.

---

# 9. Conflict Resolution Hierarchy

Conflicts will happen.

When two documents appear to disagree, use this hierarchy.

## 9.1 Highest Priority: Explicit ADRs

A frozen ADR overrides normal manual text only for the decision it covers.

Example:

```txt
ADR-0007: Adopt dedicated infrastructure for enterprise clients
```

This may override earlier default shared-infrastructure guidance for that specific scenario.

---

## 9.2 Security and Production Gates Override Feature Documents

Security documents override module specs, design docs, generator docs, and delivery docs.

Example:

```txt
A module spec says “export all records.”
Data Security says export requires separate permission and sensitive-field filtering.

Data Security wins.
```

---

## 9.3 Architecture Documents Override Implementation Convenience

Architecture and layer-boundary documents override shortcuts.

Example:

```txt
Claude says importing InventoryService into Purchasing is easier.
Layer Boundaries say modules cannot import other modules.

Layer Boundaries win.
```

---

## 9.4 More Specific Frozen Documents Override General Frozen Documents

If both documents are frozen and not security-related, the more specific document wins.

Example:

```txt
General Module Philosophy says modules own domain-specific records.
Inventory Module Spec says Product is not owned by Inventory.

Inventory Module Spec wins for Inventory.
```

But it cannot violate higher-level architecture/security rules.

---

## 9.5 Newer Frozen Version Overrides Older Frozen Version

If the same document exists in multiple versions, the newer frozen version wins.

Example:

```txt
Production Readiness Gate v2 supersedes Production Readiness Gate v1.
```

---

## 9.6 Code Does Not Automatically Override the Manual

Existing code is evidence, not doctrine.

If code disagrees with the manual, there are only three valid outcomes:

```txt
1. Code is wrong → fix code.
2. Manual is wrong → amend manual through governance.
3. Both need review → create ADR or architecture issue.
```

Never silently let code drift redefine architecture.

---

## 9.7 Claude Output Never Overrides the Manual

Claude may propose improvements.

Claude may identify contradictions.

Claude may ask for clarification.

But Claude cannot decide that a manual rule no longer applies.

---

# 10. Relationship to the Old Kernel v2 Plan

The uploaded Kernel v2 plan is valuable historical context.

It contains important lessons:

```txt
SDK-only module access
shared org_id tenancy
Event Bus pattern
Business Object minimalism
Three Client Rule
Dynamic Form Engine gate
optimistic UI rule
soft-delete rule
Prisma/Supabase considerations
known MVP security gaps
```

But it is not the final authority for the restarted platform.

The Engineering Manual supersedes it when frozen.

Specifically:

```txt
Old pattern: sdk.getDb(orgId)
New manual pattern: sdk.getDb(ctx)

Old pattern: module manifests may self-register
New manual pattern: pure manifests + composition registry

Old pattern: /api/[module]?orgId=...
New manual pattern: /api/orgs/[orgSlug]/[moduleId]/...

Old pattern: requireAuth() may be reused in APIs
New manual pattern: API-safe auth/context helpers return JSON
```

The old plan should be treated as:

```txt
Reference material
Implementation history
Risk evidence
Lesson source
```

Not as final doctrine.

---

# 11. Relationship to Code

The manual should drive code.

Code should validate the manual.

But code should not silently rewrite the manual.

If implementation reveals that a manual rule is impractical, Claude or the engineer must stop and report:

```txt
Manual conflict found:
- Document:
- Section:
- Rule:
- Implementation issue:
- Proposed options:
```

Then the founder/architect decides whether to:

```txt
amend the manual
write an ADR
change implementation
reject the shortcut
```

---

# 12. Relationship to Claude Code

Claude Code is an implementer.

Claude Code is not the architect.

Claude must not be asked:

```txt
Build OneDayOS.
```

Claude should be asked:

```txt
Using these frozen Engineering Manual documents,
implement only this subsystem.
Do not invent architecture.
Stop if a manual rule is ambiguous or impossible.
```

Claude must never implement from:

```txt
Draft documents
Superseded documents
Deferred contract-only documents
Roadmap titles alone
Conversation memory alone
```

Claude may implement only from:

```txt
Frozen documents
Approved implementation package
Specific task scope
Defined acceptance criteria
```

---

# 13. Implementation Package Requirement

Before Claude starts a subsystem, create an Implementation Package.

An Implementation Package must include:

```txt
Package name
Subsystem
Frozen source documents
Scope
Non-goals
Allowed files/directories
Forbidden files/directories
Required tests
Required commands
Known risks
Stop conditions
Founder approval
```

Example:

```md
# Implementation Package — Kernel Auth + Tenancy

Authoritative documents:
- 04-kernel/01-authentication.md
- 04-kernel/02-organizations-tenancy.md
- 04-kernel/04-authorization-enforcement.md
- 04-kernel/08-kernel-api-contracts.md
- 13-security/02-tenant-isolation.md
- 13-security/03-permission-enforcement.md
- 13-security/04-api-security.md

Scope:
- Implement Supabase auth helpers
- Implement PlatformContext
- Implement API auth/context helpers
- Implement tenant membership checks

Non-goals:
- No business modules
- No Platform Services
- No Dynamic Forms
- No FastAPI

Required commands:
- npm run lint
- npm run typecheck
- npm run test:run
- npm run build
- npm run check:architecture
```

Claude must not receive broad manual sections without a concrete implementation package.

---

# 14. Freeze Process

A document becomes frozen only through this process:

```txt
1. Draft created.
2. Founder reviews.
3. Architect revises if needed.
4. Founder approves.
5. Conflicts are checked.
6. Status changed to Frozen.
7. Version confirmed.
8. Changelog added if needed.
9. Document committed to repo.
10. Document listed in implementation package if implementation is needed.
```

Conversation approval alone is not enough.

The file itself must say:

```txt
Status: Frozen
Implementation Allowed: Yes | Conditional | Governance document — use as authority for process
```

---

# 15. Freeze Batch Strategy

Because many documents are being created quickly, OneDayOS should freeze them in batches.

Recommended freeze batches:

```txt
Batch 1 — Foundation and Architecture
Batch 2 — Kernel, Security, SDK, Data
Batch 3 — Business Objects and Module System
Batch 4 — Generators and Testing
Batch 5 — Design System
Batch 6 — Deployment, Operations, and AppCare
Batch 7 — Client Delivery
Batch 8 — Module Specifications
```

Each batch should include a review checklist:

```txt
[ ] No contradictions inside batch
[ ] No contradiction with earlier frozen batch
[ ] Deferred docs clearly marked
[ ] Implementation docs clearly marked
[ ] Security rules preserved
[ ] Tenant model preserved
[ ] SDK boundaries preserved
[ ] Claude instructions preserved
```

---

# 16. Amendment Process

Frozen documents may be amended, but never casually edited.

Use this process:

```txt
1. Identify issue.
2. Decide if amendment or ADR is needed.
3. Draft amendment.
4. Explain reason.
5. Identify impacted documents.
6. Update tests/acceptance criteria if needed.
7. Bump version.
8. Add changelog.
9. Founder approves.
10. Commit amendment.
```

Every amendment must answer:

```txt
Why is this change necessary?
What breaks if we do not change it?
What code or modules are affected?
Does this weaken tenant isolation, permissions, security, or maintainability?
Does this increase AppCare cost?
Does this require Claude implementation changes?
```

---

# 17. When an ADR Is Required

An ADR is required for decisions that change core architecture.

Examples:

```txt
Changing from shared database to database-per-tenant
Adding FastAPI as a second backend runtime
Moving RLS from deferred to required
Changing the SDK import structure
Allowing direct module-to-module imports
Implementing a Platform Service
Promoting a module-local feature into Platform Services
Introducing runtime Dynamic CRUD
Introducing user-facing AI actions
Adding a dedicated search engine
Adding background job infrastructure
Adding per-org module version pinning
Allowing dedicated infrastructure as a standard tier
Changing production migration strategy
Changing auth provider
Changing deployment provider
```

An ADR is not required for:

```txt
typos
small clarifications
module-specific field additions that follow existing rules
UI copy improvements
non-architectural refactors
```

When in doubt, write an ADR.

---

# 18. Required Changelog

Every document should include a changelog once frozen.

Recommended format:

```md
# Changelog

## 1.0.0 — July 2026

- Initial frozen version.
```

For amendments:

```md
## 1.1.0 — August 2026

- Clarified API route naming for module resources.
- Added rejection rule for client-supplied `orgId` in bulk import schemas.
- No implementation-breaking changes.
```

For major changes:

```md
## 2.0.0 — September 2026

- Replaced application-only tenancy with RLS defense-in-depth requirement.
- Requires changes to SDK database transaction helpers.
- See ADR-0008.
```

---

# 19. Document Quality Bar

A document is not good enough just because it is long.

A document is good enough when it removes decisions from implementation time.

Where applicable, every implementation-grade document should include:

```txt
Purpose
Non-goals
Layer ownership
Data model expectations
API route expectations
SDK expectations
Permission expectations
Tenant isolation rules
Event rules
Validation rules
UI expectations
Testing requirements
Forbidden patterns
Claude instructions
Acceptance criteria
```

For deferred documents, include:

```txt
Why deferred
What is allowed now
What is forbidden now
Promotion trigger
Future contract boundaries
```

For module specs, include:

```txt
Business workflows
Business Objects used
Module-owned entities
Extension tables
Permissions
Routes
APIs
Services
Events
UI screens
Forms
Tables
Tests
Out-of-scope items
Implementation prompt
```

---

# 20. Naming Conventions

## 20.1 Document IDs

Use this format:

```txt
EM-[SECTION]-[NUMBER]
```

Examples:

```txt
EM-00-01 Manual Governance
EM-04-01 Authentication
EM-05-02 SDK DB Access
EM-13-08 Production Readiness Gate
```

## 20.2 File Names

Repo file names should be stable and numeric:

```txt
04-kernel/01-authentication.md
05-sdk/02-sdk-db-access.md
13-security/08-production-readiness-gate.md
```

Export artifact names may include version:

```txt
onedayos-engineering-manual-04-kernel-01-authentication-v1.md
```

## 20.3 Document Titles

Use this format:

```txt
OneDayOS Engineering Manual — [Title]
```

Example:

```txt
OneDayOS Engineering Manual — Authentication
```

---

# 21. Manual Ownership

## 21.1 Founder

The founder owns:

```txt
business model fit
commercial positioning
scope boundaries
client delivery promise
AppCare promise
pricing implications
final approval
```

The founder may approve, reject, defer, or request revisions.

---

## 21.2 Architect

The architect owns:

```txt
system architecture
security boundaries
tenant model
SDK boundaries
module boundaries
reuse strategy
technical debt control
long-term maintainability
```

The architect must challenge decisions that create:

```txt
client-specific forks
operational burden
security risk
module coupling
premature abstractions
generic admin UI
AI-driven architecture drift
```

---

## 21.3 Claude Code

Claude owns:

```txt
implementation from frozen specs
code generation within scope
test writing
refactoring within boundaries
reporting ambiguity
```

Claude does not own:

```txt
architecture
scope expansion
security model changes
tech stack additions
business model decisions
client promises
```

---

# 22. Manual Review Checklist

Before approving a document, ask:

```txt
[ ] Does this document support OneDayOS as one shared platform?
[ ] Does this document avoid per-client forks?
[ ] Does this document preserve tenant isolation?
[ ] Does this document preserve SDK-only module access?
[ ] Does this document preserve Business Object ownership?
[ ] Does this document avoid premature Platform Services?
[ ] Does this document avoid Claude making architectural decisions?
[ ] Does this document make implementation easier, not harder?
[ ] Does this document include forbidden patterns?
[ ] Does this document include tests or acceptance criteria where needed?
[ ] Does this document clarify what is deferred?
[ ] Does this document reduce AppCare burden?
[ ] Does this document support one-day delivery?
```

If the answer is no, revise before freezing.

---

# 23. Implementation Readiness Checklist

Before Claude implements from any document, confirm:

```txt
[ ] Document status is Frozen
[ ] Implementation Allowed is Yes or Conditional
[ ] Related dependencies are frozen
[ ] Required ADRs are approved
[ ] Implementation package exists
[ ] Scope is narrow
[ ] Non-goals are explicit
[ ] Required tests are listed
[ ] Forbidden patterns are listed
[ ] Stop conditions are listed
[ ] Founder has approved implementation
```

If any item fails, Claude should not implement.

---

# 24. Stop Conditions

Claude or any engineer must stop and report if:

```txt
Manual documents conflict
Required helper does not exist
Security rule is unclear
Tenant boundary is unclear
Permission rule is unclear
Implementation requires a new dependency
Implementation requires a new Platform Service
Implementation requires FastAPI/Python backend
Implementation requires per-client infrastructure
Implementation requires module-to-module imports
Implementation requires raw Prisma in module code
Implementation requires client-supplied orgId
Implementation would weaken tests
Implementation would create custom client fork
```

Stopping is better than inventing architecture.

---

# 25. Handling Deferred Documents

Deferred documents are valuable.

They tell us:

```txt
what not to build yet
how not to paint ourselves into a corner
what future implementation must respect
what evidence is required before promotion
```

Claude may use deferred documents as constraints.

Claude may not implement them.

Example:

```txt
The Notification Service document says notifications are deferred.
Claude may ensure events are clean enough for future notifications.
Claude may not add notification tables, APIs, UI, or SDK methods.
```

---

# 26. Evidence Logs

Some decisions require evidence before implementation.

Examples:

```txt
Platform Service promotion
Business Object field promotion
Dynamic Form Engine implementation
Dynamic CRUD implementation
Dedicated infrastructure offering
AI query system
Background job infrastructure
```

Evidence log format:

```md
# Evidence Log — [Capability]

## Candidate Capability
[Name]

## Use Case 1
- Client/module:
- Workflow:
- Why local implementation is insufficient:
- Similarity to other use cases:

## Use Case 2
...

## Use Case 3
...

## Recommendation
- Keep local
- Align patterns
- Write Platform Service proposal
- Reject/defer

## Decision
- Approved / rejected / deferred
```

Three independent use cases trigger review, not automatic implementation.

---

# 27. Manual-to-Code Traceability

Every significant implementation should be traceable to a manual document.

Pull requests or Claude summaries should include:

```txt
Implemented from:
- docs/engineering-manual/[path]

Key rules followed:
- ...

Tests added:
- ...

Known deviations:
- None / listed
```

If an implementation deviates from the manual, it must say so explicitly.

---

# 28. Handling Manual Drift

Manual drift happens when code and docs diverge.

Sources of drift:

```txt
Claude improvises
urgent bug fixes
provider API changes
new module requirements
untracked founder decisions
new security findings
```

Drift handling process:

```txt
1. Identify drift.
2. Classify severity.
3. Decide code-fix vs manual-amendment.
4. Add tests if it was a bug.
5. Update affected docs or ADRs.
6. Commit changes.
```

Never leave drift undocumented.

---

# 29. Provider and Tech Stack Changes

Adding or changing major technology requires an ADR.

Examples:

```txt
FastAPI
Redis
BullMQ
Inngest
Trigger.dev
Algolia
Meilisearch
OpenSearch
Sentry alternative
Storage provider change
Auth provider change
Deployment provider change
Database provider change
```

Minor library additions may not require an ADR, but still need review if they affect:

```txt
bundle size
security
runtime cost
developer experience
platform architecture
Claude complexity
```

Default rule:

```txt
Do not add dependencies casually.
```

---

# 30. Founder Guide Is Separate

The founder requested a future plain-language guide explaining infrastructure, clients, tenants, backups, updates, AppCare, outages, and dedicated infrastructure.

That guide should live separately:

```txt
docs/founder-guide/
```

Suggested files:

```txt
00-how-onedayos-works.md
01-clients-tenants-and-infrastructure.md
02-updates-deployments-and-appcare.md
03-backups-outages-and-disaster-recovery.md
04-when-to-offer-dedicated-infrastructure.md
```

The Founder Guide may explain the Engineering Manual, but it does not override it.

---

# 31. Anti-Patterns

The following are governance failures:

```txt
Claude implements from a roadmap title.
Claude implements from a draft document.
Claude implements a deferred service.
A document says Draft but is treated as Frozen.
A module spec violates security docs.
An old plan overrides a newer frozen manual.
Code drift is accepted silently.
Client request creates architecture without ADR.
A Platform Service is built from one client request.
A module duplicates a Business Object.
A shortcut bypasses PlatformContext.
A manual conflict is resolved by convenience.
A client gets a fork because scope was not controlled.
```

If any of these happen, stop and correct the governance process.

---

# 32. Acceptance Criteria

This governance document is complete when:

```txt
[ ] Every manual document has a required header.
[ ] Every document has a clear status.
[ ] Draft vs Frozen distinction is understood.
[ ] Conversation approval vs repo freeze distinction is understood.
[ ] Conflict resolution hierarchy is defined.
[ ] ADR triggers are defined.
[ ] Amendment process is defined.
[ ] Claude implementation package requirement is defined.
[ ] Deferred document handling is defined.
[ ] Evidence log requirement is defined.
[ ] Manual-to-code traceability is defined.
[ ] Stop conditions are defined.
```

---

# 33. Claude Instructions

Claude Code must follow these governance rules:

```txt
1. Do not implement from Draft documents.
2. Do not implement from Deferred contract-only documents.
3. Do not implement from roadmap titles alone.
4. Do not treat old Kernel v2 plan as final authority once frozen manual docs exist.
5. Do not treat existing code as automatic architecture authority.
6. Do not resolve manual conflicts by convenience.
7. Stop if the requested implementation lacks a frozen source document.
8. Stop if the implementation requires architecture not covered by the manual.
9. Stop if implementation would violate tenant isolation, permissions, SDK boundaries, or module boundaries.
10. Report all deviations explicitly.
```

Claude should include this in implementation summaries:

```txt
Manual documents used:
- ...

Implementation scope:
- ...

Tests added:
- ...

Architecture checks passed:
- ...

Manual deviations:
- None / listed
```

---

# 34. Final Governance Rule

The Engineering Manual exists to make OneDayOS easier to build, not harder.

If the manual becomes bureaucracy, it has failed.

If it prevents Claude from inventing architecture, it is working.

If it makes every module faster, safer, and more consistent, it is working.

If it protects tenant isolation, AppCare margins, and one-day delivery, it is working.

The final rule is:

```txt
Decide architecture once.
Write it clearly.
Freeze it deliberately.
Make Claude follow it.
Turn repeated patterns into generators.
Do not let convenience become architecture.
```

---

# Changelog

## 1.0.0 — July 2026

- Initial draft for founder review.
- Defined manual statuses, freeze process, amendment process, conflict hierarchy, ADR triggers, implementation package requirement, deferred document handling, evidence logs, and Claude governance rules.
