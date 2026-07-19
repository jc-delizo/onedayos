# OneDayOS Engineering Manual — Three Client Rule

```yaml
Document: 10-platform-services/01-three-client-rule.md
Version: 1.0
Status: Draft for Founder Review
Implementation Status: Rule Required Now; Platform Service Implementations Deferred
Owner: OneDayOS Founder / Software Architect
Last Updated: July 2026
Depends On:
  - 01-foundation/00-vision.md
  - 02-architecture/00-system-architecture.md
  - 02-architecture/01-layer-boundaries.md
  - 04-kernel/00-kernel-overview.md
  - 05-sdk/00-sdk-overview.md
  - 08-module-system/00-module-philosophy.md
  - 10-platform-services/00-platform-services-philosophy.md
Supersedes / Refines:
  - Kernel v2 Global Constraint: Three Client Rule
  - Kernel v2 Platform Services deferral rule
Implementation Allowed: Partially
Claude Implementation Scope:
  - Claude may implement evidence-log files, templates, comments, and architecture checks described here.
  - Claude must not implement Approval Engine, Notification Engine, Workflow Engine, Dynamic Form Engine, Dynamic CRUD Engine, Attachment Service, Reporting Service, Search Service, Activity Feed, Comments, or Background Jobs from this document alone.
```

---

## 1. Purpose

The Three Client Rule prevents OneDayOS from becoming overengineered before real module and client needs prove an abstraction is worth building.

OneDayOS is a platform, but not every useful-sounding capability deserves to become platform infrastructure immediately.

This document defines:

- when a capability should remain inside one module;
- when repeated patterns should be watched but not abstracted yet;
- when a capability becomes a Platform Service candidate;
- when a Platform Service may be designed;
- when a Platform Service may be implemented;
- what evidence is required before promotion;
- how Claude Code must handle repeated requirements without inventing premature infrastructure.

The rule exists because OneDayOS must optimize for both:

```txt
Long-term platform reuse
+
Low-cost one-day delivery
```

Those goals conflict if OneDayOS builds generic engines too early.

---

## 2. Core Rule

The original shorthand is:

```txt
If only one module needs a capability, keep it inside that module.
If three independent modules need it, promote it into Platform Services.
```

For the Engineering Manual, the formal rule is:

```txt
A capability may be promoted into Platform Services only after three independent use cases prove the same reusable capability is needed.
```

This document therefore uses the more precise name:

```txt
Three Independent Use Cases Rule
```

The business shorthand may remain:

```txt
Three Client Rule
```

But internally, OneDayOS should reason in terms of independent use cases, not only paying clients.

---

## 3. Why the Name Is Refined

The phrase “Three Client Rule” is useful commercially, but technically incomplete.

A capability can be proven by:

```txt
three different clients
three different modules
three different workflows
three different roles/processes inside one large client
```

Example:

```txt
Client A needs leave approvals.
Client B needs purchase approvals.
Client C needs expense approvals.
```

This clearly supports a future Approval Service.

But this also counts as evidence:

```txt
Leave Module needs approvals.
Purchasing Module needs approvals.
Expenses Module needs approvals.
```

Even if those three workflows first appear inside the same client, they are still independent business use cases.

Therefore, the formal standard is not “three clients literally paid for it.”

The formal standard is:

```txt
three independent use cases with the same underlying lifecycle, data shape, permission model, and user experience pattern.
```

---

## 4. What the Rule Protects Against

The rule protects OneDayOS from premature abstractions such as:

```txt
Approval Engine before approvals are understood.
Notification Engine before notification channels are understood.
Workflow Engine before workflows are repetitive.
Dynamic Form Engine before forms have repeated patterns.
Dynamic CRUD Engine before CRUD conventions stabilize.
Reporting Service before report shapes are known.
Custom Fields Service before extension patterns are proven.
Attachment Service before file lifecycle rules are understood.
```

Premature Platform Services are dangerous because they:

- create more code than needed;
- increase maintenance burden;
- confuse Claude Code with too many abstractions;
- make debugging harder;
- slow down one-day delivery;
- force modules to fit an abstraction that may be wrong;
- become architectural debt disguised as “platform maturity.”

OneDayOS should not build a generic ERP meta-framework before it has real module evidence.

---

## 5. What the Rule Does Not Apply To

The Three Independent Use Cases Rule does **not** apply to true Kernel fundamentals.

These are required immediately because every module needs them:

```txt
Authentication
Organizations
Tenant isolation
Users
Roles
Permissions
PlatformContext
SDK
Module registry
Module enablement
Event Bus interface
Settings/configuration primitives
App shell/routing primitives
API response contract
Database access boundary
```

These are Kernel capabilities, not Platform Services.

They do not need three clients.

They are platform prerequisites.

---

## 6. Layer Decision Summary

| Capability Type | Where It Belongs | Needs Three Use Cases? | Example |
|---|---|---:|---|
| Needed by every module | Kernel | No | Auth, orgs, users, roles |
| Shared business identity | Business Objects | No, but fields must stay minimal | Product, Customer, Employee |
| Cross-cutting repeated capability | Platform Services | Yes | Approvals, notifications, comments |
| Business-domain behavior | Module | No | Inventory adjustment, leave request |
| Client preference | Client Configuration | No | Enabled modules, labels, settings |
| UI primitive | Design System | No | Button, table, form layout |
| Small technical utility | Shared library/helper | Usually no | Date formatting, slug helper |

---

## 7. The Capability Lifecycle

Every reusable capability should pass through these stages.

### Stage 0 — Idea

Someone says:

```txt
“We might need this later.”
```

Decision:

```txt
Do not build.
Write a note if needed.
```

Examples:

```txt
“We might need workflow automation someday.”
“We might need custom fields.”
“We might need notifications.”
```

These are not enough.

---

### Stage 1 — Module-Local Implementation

One module needs the capability.

Decision:

```txt
Build it inside the module.
Do not promote.
```

Example:

```txt
Leave Module needs approval for leave requests.
```

Correct:

```txt
Leave owns leave approval logic.
```

Incorrect:

```txt
Build generic Approval Engine immediately.
```

---

### Stage 2 — Second Independent Use Case

A second module/workflow/client needs something similar.

Decision:

```txt
Do not promote yet.
Copy carefully or align patterns manually.
Start evidence log.
```

Example:

```txt
Leave needs approvals.
Purchasing now needs approvals.
```

Correct:

```txt
Implement Purchasing approvals locally, but compare with Leave.
Document repeated concepts.
```

Incorrect:

```txt
Immediately build generic Approval Engine after the second use case.
```

At this stage, OneDayOS should learn, not abstract.

---

### Stage 3 — Third Independent Use Case

A third independent module/workflow/client needs the same capability.

Decision:

```txt
Promotion review is triggered.
Platform Service is not automatic.
```

Example:

```txt
Leave approvals
Purchasing approvals
Expense approvals
```

Now OneDayOS may write:

```txt
10-platform-services/04-approval-workflow-service.md
```

But implementation still requires architectural review and founder approval.

---

### Stage 4 — Platform Service Proposal

Before implementation, create a proposal document.

Required sections:

```md
# Platform Service Proposal: [Capability]

## Evidence Log
## Repeated Use Cases
## Shared Lifecycle
## Differences Between Use Cases
## What Stays Module-Specific
## Proposed Service Boundary
## SDK API
## Database Model
## Permission Model
## Event Model
## UI Model
## Migration Plan
## Risks
## Non-Goals
## Acceptance Criteria
```

Decision:

```txt
Approve, revise, defer, or reject.
```

---

### Stage 5 — Pilot Extraction

The first implementation should usually extract the smallest shared core.

Decision:

```txt
Build the narrowest Platform Service that removes real duplication.
```

The first version should not become a universal engine.

Example:

```txt
Approval Service v0.1 supports sequential approval requests.
It does not support visual workflow builder, escalation, delegation, SLA timers, custom scripts, or arbitrary branching.
```

---

### Stage 6 — Platform Service

Only after successful pilot extraction does the capability become a formal Platform Service.

At that point it requires:

- SDK access;
- documentation;
- tests;
- migration path;
- ownership;
- compatibility rules;
- module integration rules;
- upgrade rules;
- monitoring if operationally relevant.

---

## 8. What Counts as an Independent Use Case

An independent use case must be meaningfully separate in business purpose, module boundary, or operational lifecycle.

### Counts as independent

```txt
Leave request approval
Purchase request approval
Expense claim approval
```

These are independent because each has different records, users, permissions, and business context, even if the approval lifecycle is similar.

```txt
Inventory low-stock notification
Incident assignment notification
Leave approval notification
```

These are independent notification use cases.

```txt
Expense receipt attachment
Incident photo attachment
Asset warranty document attachment
```

These are independent attachment use cases.

```txt
Product search
Customer search
Employee search
```

These may become evidence for search, but only if they require one shared search experience rather than simple table filters.

---

### Does not count as independent

The following do not count as three independent use cases:

```txt
Create leave request
Edit leave request
Delete leave request
```

Those are operations inside one module.

```txt
Leave list page
Leave detail page
Leave dashboard card
```

Those are screens inside one domain.

```txt
Client A asks for three slightly different leave approval statuses.
```

That is one workflow variation, not three independent use cases.

```txt
Claude thinks notifications might be useful later.
```

Speculation is not evidence.

```txt
The roadmap lists Approval Engine as a future service.
```

Roadmap presence is not implementation approval.

---

## 9. Similarity Test

Three use cases only justify a Platform Service if they share enough structure.

Use this test:

| Question | Required Answer for Promotion |
|---|---|
| Do they share a similar lifecycle? | Yes |
| Do they need similar permissions? | Mostly yes |
| Do they need similar UI patterns? | Mostly yes |
| Can one SDK API support all three without module-specific hacks? | Yes |
| Can module-specific differences remain outside the service? | Yes |
| Would extracting the service reduce code and support burden? | Yes |
| Would the service improve future one-day delivery? | Yes |

If the answers are mostly no, keep the behavior module-local.

---

## 10. Promotion Decision Checklist

A capability may enter Platform Service design only if all required items pass.

```txt
[ ] Three independent use cases documented
[ ] Existing module-local implementations reviewed
[ ] Shared lifecycle identified
[ ] Differences clearly separated from shared core
[ ] Service boundary proposed
[ ] SDK API proposed
[ ] Tenant model proposed
[ ] Permission model proposed
[ ] Database model proposed
[ ] Event model proposed
[ ] Migration path from module-local implementations proposed
[ ] Tests proposed
[ ] Operational cost understood
[ ] Design/system UI impact understood
[ ] Founder/Architect approval obtained
[ ] ADR created if service changes architecture meaningfully
```

If any required item is missing, do not implement.

---

## 11. Evidence Log Template

Each candidate Platform Service should have an evidence log.

Recommended location:

```txt
docs/engineering-manual/10-platform-services/evidence/[capability]-evidence.md
```

Template:

```md
# Platform Service Evidence Log: [Capability]

Status: Watching | Proposal Triggered | Approved | Rejected | Deferred
Owner:
Last Updated:

## Capability Summary

What repeated capability are we observing?

## Use Case 1

Module/Client/Workflow:
Date Observed:
Description:
Records Involved:
Users/Roles Involved:
Permissions Needed:
UI Needed:
Events Needed:
Module-Specific Parts:

## Use Case 2

Module/Client/Workflow:
Date Observed:
Description:
Records Involved:
Users/Roles Involved:
Permissions Needed:
UI Needed:
Events Needed:
Module-Specific Parts:

## Use Case 3

Module/Client/Workflow:
Date Observed:
Description:
Records Involved:
Users/Roles Involved:
Permissions Needed:
UI Needed:
Events Needed:
Module-Specific Parts:

## Similarity Analysis

Shared Lifecycle:
Shared Data Shape:
Shared UI Pattern:
Shared Permission Pattern:
Shared Event Pattern:
Differences:

## Decision

Promote / Defer / Reject:
Reason:
ADR Required:
Next Document:
```

---

## 12. Platform Service Candidate Matrix

Default status for common candidates:

| Candidate | Default Status | Why |
|---|---|---|
| Audit Log Service | Deferred | Emit events now; build audit UI/storage when needed |
| Notification Service | Deferred | Many modules may need it, but channels/preferences are unknown |
| Approval Workflow Service | Deferred | Very likely needed, but must be proven by multiple approval workflows |
| Comments Service | Deferred | Avoid generic comment engine until multiple entities need comments |
| Attachments Service | Deferred | File lifecycle, storage, permissions, and backup rules need evidence |
| Activity Feed Service | Deferred | Can use events later; not required for first modules |
| Reporting Service | Deferred | Report needs vary heavily; avoid premature report engine |
| Search Service | Deferred | Start with table/module search; promote when global search is needed |
| Background Jobs | Deferred | Use in-process events first; durable queue later when needed |
| Workflow Engine | Strongly Deferred | High overengineering risk |
| Dynamic Form Engine | Deferred by gate | Build only after three hand-coded modules prove form repetition |
| Dynamic CRUD Engine | Deferred by gate | Build only after CRUD conventions stabilize |
| Custom Fields Service | Strongly Deferred | Use explicit extension tables first |
| AI Layer | Planned, but gated | Must respect tenant/permission model and module context |

---

## 13. Examples

### 13.1 Approval Engine

#### First use case

```txt
Leave Module needs leave request approvals.
```

Decision:

```txt
Keep approval logic inside Leave.
```

#### Second use case

```txt
Purchasing Module needs purchase request approvals.
```

Decision:

```txt
Implement locally in Purchasing.
Start approval evidence log.
Compare lifecycle with Leave.
```

#### Third use case

```txt
Expenses Module needs expense claim approvals.
```

Decision:

```txt
Trigger Approval Service proposal.
Do not implement automatically.
```

Potential shared lifecycle:

```txt
Draft → Submitted → Pending Approval → Approved / Rejected / Cancelled
```

Module-specific parts:

```txt
Leave: leave dates and balances
Purchasing: vendors and line items
Expenses: receipts and claim amounts
```

Shared service should own approval state and approver actions, not the module's business data.

---

### 13.2 Notification Service

#### First use case

```txt
Inventory needs low-stock alerts.
```

Decision:

```txt
Keep inside Inventory.
Maybe use events.
```

#### Second use case

```txt
Incidents need assignment alerts.
```

Decision:

```txt
Implement locally or with simple shared UI patterns.
Start evidence log.
```

#### Third use case

```txt
Leave needs approval notifications.
```

Decision:

```txt
Trigger Notification Service proposal.
```

Do not build email, SMS, push, in-app inbox, preferences, retries, templates, and digest scheduling all at once.

The first version might only support:

```txt
in-app notifications
recipient userId
title
body
link
readAt
```

---

### 13.3 Attachment Service

#### First use case

```txt
Incident Reporting needs photo uploads.
```

Decision:

```txt
Keep attachment handling inside Incident Reporting if necessary.
```

#### Second use case

```txt
Expenses needs receipt uploads.
```

Decision:

```txt
Start attachment evidence log.
Compare storage, permissions, retention, and UI needs.
```

#### Third use case

```txt
Assets needs warranty document uploads.
```

Decision:

```txt
Trigger Attachment Service proposal.
```

Questions before promotion:

```txt
Do all attachments need the same storage bucket strategy?
Do all need previews?
Do all need signed URLs?
Do all need virus scanning later?
Do all need audit events?
Do all need per-record permission checks?
```

---

### 13.4 Search Service

Start with module-local search.

```txt
Inventory product table search
Customer table search
Employee table search
```

This alone may not justify a global Search Service if simple table filtering is enough.

Promotion is more justified when users need:

```txt
one global command/search box
cross-module results
permission-aware result filtering
searchable Business Objects and module records
event-driven indexing
```

---

### 13.5 Dynamic Form Engine

The Dynamic Form Engine has a specific gate:

```txt
Do not build until at least three modules have hand-coded forms and the pain is confirmed.
```

This means:

```txt
Inventory product/stock forms
Leave request forms
CRM customer/opportunity forms
```

After those exist, evaluate whether field metadata can safely describe repeated patterns.

Do not start by building a no-code form builder.

---

### 13.6 Custom Fields

Custom Fields are especially risky.

They sound useful for client flexibility, but they can damage:

```txt
type safety
query performance
reporting
validation
permissions
imports/exports
AI context
design consistency
```

Default decision:

```txt
Use explicit extension tables.
Do not build generic custom fields in MVP.
```

Custom Fields require a separate evidence log and ADR.

---

## 14. Two-Use-Case Guidance

The second use case is the danger zone.

At two use cases, engineers feel the duplication and want to abstract.

OneDayOS should usually resist.

Correct behavior at two use cases:

```txt
Document similarity.
Use consistent naming.
Use similar local patterns.
Avoid incompatible designs.
Do not build the service yet.
```

This gives OneDayOS better evidence before extraction.

A little duplication is acceptable if it prevents the wrong abstraction.

Bad abstraction is more expensive than temporary duplication.

---

## 15. When Early Promotion Is Allowed

Early promotion before three use cases is rare and requires founder/architect approval.

Allowed exceptions:

### 15.1 Security Requirement

If a capability is required to protect tenant data, it may be built early.

Examples:

```txt
API auth helper
Tenant context resolver
Permission enforcement helper
Architecture checks
```

These are Kernel/Security capabilities, not normal Platform Services.

---

### 15.2 Legal or Compliance Requirement

If AppCare or client agreements require it, a capability may be built earlier.

Example:

```txt
backup verification
security incident logging
export audit trails
```

Still requires a document and approval.

---

### 15.3 Strong Operational Necessity

If not building the capability would create severe support or production risk, early promotion may be considered.

Example:

```txt
background job infrastructure if synchronous operations start timing out
```

Still requires an ADR.

---

### 15.4 Extremely Small Shared Primitive

Small utilities are not Platform Services.

Examples:

```txt
slugify helper
money formatter
date formatter
error-code constants
```

These can live in shared libraries without invoking the full Three Use Cases process.

Do not confuse shared utilities with Platform Services.

---

## 16. What Must Stay Module-Local

The following should normally stay inside modules:

```txt
inventory stock adjustment rules
leave balance rules
CRM pipeline stage logic
purchasing line item calculations
expense reimbursement rules
asset depreciation rules
visitor check-in rules
incident severity classification
```

These are domain-specific.

They should not be extracted merely because they contain similar CRUD, status transitions, or table screens.

---

## 17. What Should Become Design System, Not Platform Service

Repeated UI patterns should often become design-system components, not Platform Services.

Examples:

```txt
table layout
form section layout
empty state
status badge
filter bar
command menu item
loading skeleton
permission denied state
```

A `DataTable` component is not a Platform Service.

A `FormField` component is not a Dynamic Form Engine.

A `StatusBadge` component is not a Workflow Engine.

Keep this distinction clear.

---

## 18. What Should Become SDK Helper, Not Platform Service

Some repeated technical behavior belongs in the SDK rather than a Platform Service.

Examples:

```txt
sdk.auth.requireApiModuleContext(...)
sdk.permissions.require(...)
sdk.api.ok(...)
sdk.api.validationError(...)
sdk.events.emit(...)
sdk.getDb(ctx)
```

These are access boundaries and platform primitives.

They do not require the Three Use Cases rule because they protect every module.

---

## 19. Platform Service Boundary Rules

When a capability becomes a Platform Service, it must follow these rules:

```txt
[ ] Exposed through SDK
[ ] Uses verified PlatformContext
[ ] Does not accept client-supplied orgId
[ ] Does not import business modules
[ ] Does not depend on module-specific schemas directly
[ ] Has its own permissions if user-facing
[ ] Emits events for important mutations
[ ] Has tenant-isolation tests
[ ] Has permission-denial tests
[ ] Has documentation and examples
[ ] Has a migration path from module-local patterns
```

Platform Services are not allowed to become secret global singletons used by modules directly.

---

## 20. Database Rules for Promoted Services

A promoted Platform Service may have its own tables.

Every tenant-scoped Platform Service table must include:

```txt
orgId
createdAt
updatedAt where useful
deletedAt/deletedBy if soft-deletable
```

Every service table must follow the same data rules:

```txt
Use Prisma migrations.
Use tenant-scoped indexes.
Use SDK access.
Use PlatformContext.
Reject client-supplied orgId.
Test cross-tenant denial.
```

Platform Service tables must not use module-specific assumptions.

Example:

Good:

```txt
approval_requests
  id
  orgId
  sourceModule
  sourceEntity
  sourceId
  status
```

Risky:

```txt
approval_requests
  leaveRequestId
  purchaseRequestId
  expenseClaimId
```

The latter hard-codes module-specific fields into a platform service.

---

## 21. Event Rules for Candidate Services

Events are useful before Platform Services exist.

For example, modules and Business Objects should emit events now:

```txt
objects.product.created
inventory.stock_adjustment.created
leave.request.submitted
```

Future Platform Services can subscribe later.

This is why the Event Bus belongs in Kernel/SDK now.

However, event emission does not mean every listener/service should exist now.

Correct:

```txt
Emit inventory.stock_adjustment.created now.
Build Audit Log later when evidence/need exists.
```

Incorrect:

```txt
Because events exist, build Audit Log, Activity Feed, Notifications, Search, and AI indexing immediately.
```

---

## 22. Claude Code Rules

Claude must follow these rules:

```txt
1. Do not implement a Platform Service from a candidate name alone.
2. Do not implement deferred services just because they appear in the roadmap.
3. Do not create generic engines without a frozen service specification.
4. If one module needs a capability, implement it inside the module.
5. If a second module needs the same capability, update the evidence log.
6. If a third independent use case appears, propose a service document; do not implement automatically.
7. Never bypass PlatformContext for a candidate service.
8. Never accept client-supplied orgId.
9. Never import modules into Platform Services.
10. Never import Platform Service internals into modules.
11. Never use FastAPI/Python for a Platform Service unless a future ADR explicitly approves it.
12. Stop and report if the manual is ambiguous.
```

Claude is an implementer.

Claude is not allowed to decide that a repeated pattern deserves promotion.

---

## 23. Required Claude Prompt for Candidate Promotion

Use this prompt when the third independent use case appears:

```md
We have observed a repeated capability that may qualify for Platform Service promotion.

Authoritative documents:
- docs/engineering-manual/10-platform-services/00-platform-services-philosophy.md
- docs/engineering-manual/10-platform-services/01-three-client-rule.md

Task:
Create an evidence log for [CAPABILITY].
Do not implement the service.
Do not modify runtime code.
Analyze the three use cases and determine whether they appear to share the same reusable lifecycle.

Required output:
- Evidence log markdown file
- Similarity analysis
- Recommendation: promote, defer, or reject
- Open questions
```

---

## 24. Required Claude Prompt for Approved Service Design

Use only after evidence review:

```md
We are designing a candidate Platform Service.

Authoritative documents:
- docs/engineering-manual/10-platform-services/00-platform-services-philosophy.md
- docs/engineering-manual/10-platform-services/01-three-client-rule.md
- docs/engineering-manual/05-sdk/00-sdk-overview.md
- docs/engineering-manual/05-sdk/01-sdk-public-api.md
- docs/engineering-manual/06-data/01-tenancy-data-isolation.md

Task:
Write the implementation-grade Engineering Manual document for [SERVICE].
Do not implement code.
Do not invent features beyond the approved evidence.
Clearly separate shared service behavior from module-specific behavior.
```

---

## 25. Required Claude Prompt for Approved Service Implementation

Use only after the service document is frozen:

```md
You are implementing the approved OneDayOS Platform Service: [SERVICE].

Authoritative document:
- docs/engineering-manual/10-platform-services/[SERVICE].md

Global rules:
- Use verified PlatformContext.
- Do not accept client-supplied orgId.
- Expose service through SDK.
- Do not import business modules.
- Do not use raw Prisma in modules.
- Do not create FastAPI/Python backend files.
- Add tenant-isolation and permission-denial tests.
- Implement only the frozen scope.
- Stop if the manual is ambiguous.
```

---

## 26. Architecture Review Questions

Before promoting a capability, ask:

```txt
What are the three independent use cases?
Are they truly independent?
What lifecycle do they share?
What is different between them?
Can the differences stay module-local?
What does the shared service own?
What must the shared service not own?
What SDK API will modules use?
What permissions are required?
What events are emitted?
What tables are required?
How will existing module-local code migrate?
What tests prove tenant isolation?
What tests prove permission enforcement?
What operational burden does this introduce?
Will this improve one-day delivery or slow it down?
```

If the last answer is “slow it down,” defer.

---

## 27. Rejection Reasons

A candidate should be rejected or deferred if:

```txt
[ ] Only one real use case exists
[ ] Use cases are too different
[ ] Shared lifecycle is unclear
[ ] Service API would require many module-specific flags
[ ] Module-specific business rules would leak into the service
[ ] Operational cost is too high
[ ] Testing strategy is unclear
[ ] Tenant model is unclear
[ ] Permission model is unclear
[ ] It would delay near-term delivery without reducing long-term cost
[ ] It exists only because Claude suggested it
[ ] It exists only because a competitor has it
```

---

## 28. Common Anti-Patterns

### Anti-Pattern: “We might need it later”

Problem:

```txt
Speculation becomes architecture.
```

Correction:

```txt
Write it down as a future candidate. Do not implement.
```

---

### Anti-Pattern: “Two modules need it, so abstract now”

Problem:

```txt
The abstraction is based on too little evidence.
```

Correction:

```txt
Keep module-local, align patterns, start evidence log.
```

---

### Anti-Pattern: “Generic Workflow Engine”

Problem:

```txt
Workflow engines become complex quickly and can swallow the platform.
```

Correction:

```txt
Implement specific workflows first. Extract only proven shared lifecycle later.
```

---

### Anti-Pattern: “Custom Fields Fix Everything”

Problem:

```txt
Custom fields hide schema decisions and make reporting, validation, permissions, and AI harder.
```

Correction:

```txt
Use explicit fields and extension tables first.
```

---

### Anti-Pattern: “Platform Service as Dumping Ground”

Problem:

```txt
Anything reused gets thrown into a vague service.
```

Correction:

```txt
Define clear ownership and non-goals.
```

---

### Anti-Pattern: “Event Listener for Required Business Correctness”

Problem:

```txt
If listener fails, business mutation becomes inconsistent.
```

Correction:

```txt
Required correctness belongs in the service transaction. Events are for decoupled side effects.
```

---

## 29. Relationship to Business Objects

Business Objects are not governed the same way as Platform Services.

Core Business Objects exist because they represent shared business identity:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

However, adding fields to Business Objects should follow a similar evidence discipline.

If a field only matters to one module:

```txt
Put it in a module extension table.
```

If two modules need it:

```txt
Still be cautious.
```

If three independent use cases need it:

```txt
Consider promotion to the core Business Object through ADR and migration.
```

This is the Business Object minimalism rule.

---

## 30. Relationship to Dynamic Systems

Dynamic systems are some of the highest-risk abstractions.

These require especially strong evidence:

```txt
Dynamic Form Engine
Dynamic CRUD Engine
Dynamic Table View Engine
Custom Fields
Workflow Builder
Report Builder
```

For Dynamic Forms specifically:

```txt
Do not build until three modules have hand-coded forms and the pain is confirmed.
```

For Dynamic CRUD:

```txt
Do not build until CRUD patterns stabilize across real Business Objects and real modules.
```

For Custom Fields:

```txt
Do not build until explicit extension tables fail to meet repeated real needs.
```

---

## 31. Relationship to One-Day Delivery

The rule exists to protect one-day delivery.

Platform Services should only be built when they make delivery faster over time.

A good Platform Service:

```txt
reduces repeated work
improves consistency
lowers support burden
improves client delivery speed
strengthens security
```

A bad Platform Service:

```txt
adds configuration complexity
slows module implementation
requires special training
creates debugging difficulty
forces all modules into one pattern
```

Every promotion proposal must explain how the service supports one-day delivery.

---

## 32. Relationship to AppCare

AppCare rewards standardization.

A proven Platform Service can reduce support burden.

Examples:

```txt
one notification preference system
one approval audit trail
one attachment permission system
one report export system
```

But a premature Platform Service can increase AppCare burden because it creates complex infrastructure before support patterns are known.

Therefore:

```txt
AppCare supports the rule.
It does not weaken it.
```

---

## 33. Relationship to AI-Assisted Development

The Three Independent Use Cases Rule is especially important because Claude Code may over-abstract.

AI agents often see repeated words and invent generic systems.

Example:

```txt
Leave has status.
Purchasing has status.
Inventory has status.
Claude proposes Status Workflow Engine.
```

That is not enough.

A `status` field does not prove a shared workflow service.

The manual must force Claude to ask:

```txt
Are the lifecycles actually the same?
Are the permissions the same?
Are the events the same?
Is the UI the same?
Can the differences stay module-local?
```

---

## 34. Minimum File System Additions Allowed Now

Claude may create these support files now:

```txt
docs/engineering-manual/10-platform-services/evidence/.gitkeep
docs/engineering-manual/10-platform-services/evidence/README.md
docs/engineering-manual/10-platform-services/templates/platform-service-evidence-template.md
docs/engineering-manual/10-platform-services/templates/platform-service-proposal-template.md
```

Claude may not create service runtime folders yet, such as:

```txt
src/platform-services/approval
src/platform-services/notifications
src/platform-services/workflows
src/platform-services/search
src/platform-services/reporting
```

Those require approved service documents.

---

## 35. Testing Requirements for Future Platform Services

Every promoted Platform Service must include tests for:

```txt
[ ] tenant isolation with at least two organizations
[ ] permission denial with non-admin user
[ ] admin success where appropriate
[ ] module enablement interaction if service is module-triggered
[ ] client-supplied orgId rejection
[ ] event emission or event consumption behavior
[ ] soft delete where applicable
[ ] service API contract
[ ] SDK wrapper behavior
[ ] forbidden import checks
```

No Platform Service may ship with only happy-path tests.

---

## 36. Required ADRs

An ADR is required when:

```txt
[ ] a deferred Platform Service is approved for implementation
[ ] a Platform Service introduces new tables
[ ] a Platform Service introduces background jobs or durable queues
[ ] a Platform Service changes SDK public API
[ ] a Platform Service changes module manifest structure
[ ] a Platform Service introduces cross-module data references
[ ] a service is promoted before three independent use cases
[ ] FastAPI/Python is proposed for a specialized service
```

---

## 37. Decision Examples Table

| Scenario | Decision |
|---|---|
| Only Inventory needs low-stock alerting | Keep inside Inventory |
| Inventory and Incidents both need notifications | Keep local; start evidence log |
| Inventory, Incidents, and Leave need notifications | Trigger Notification Service proposal |
| Leave needs approvals | Keep inside Leave |
| Leave + Purchasing need approvals | Keep local; align patterns |
| Leave + Purchasing + Expenses need approvals | Trigger Approval Service proposal |
| Product table needs search | Module/local table search |
| Product + Customer + Employee need global command search | Consider Search Service proposal |
| Incident photos only | Module-local upload handling |
| Incident photos + Expense receipts + Asset documents | Trigger Attachment Service proposal |
| Inventory uses Product | Business Object reference, not dependency |
| Purchasing uses Supplier | Business Object reference, not dependency |
| Multiple modules need dates formatted | Shared utility, not Platform Service |
| Multiple modules need tables | Design System component, not Platform Service |
| Every module needs permissions | Kernel, no Three Use Cases needed |

---

## 38. Founder Review Questions

Before approving this document, answer:

```txt
1. Do we agree that three independent use cases trigger review, not automatic implementation?
2. Do we agree that Kernel fundamentals are exempt from the rule?
3. Do we agree that Dynamic Forms and Dynamic CRUD are deferred until proven?
4. Do we agree that two use cases should usually not trigger abstraction?
5. Do we agree that evidence logs are required before Platform Service proposals?
6. Do we agree that Claude must not implement deferred services from the roadmap alone?
7. Do we agree that custom fields are strongly deferred?
8. Do we agree that Platform Services must use PlatformContext and SDK boundaries?
```

---

## 39. Acceptance Criteria

This document is accepted when:

```txt
[ ] The rule is understood as Three Independent Use Cases, not literal three-client-only counting
[ ] Kernel exceptions are clear
[ ] Business Objects vs Platform Services are distinguished
[ ] Design System vs Platform Services are distinguished
[ ] SDK helpers vs Platform Services are distinguished
[ ] Evidence log template is approved
[ ] Promotion checklist is approved
[ ] Early-promotion exceptions are approved
[ ] Claude Code rules are approved
[ ] Deferred services remain explicitly not implementable from this document alone
```

---

## 40. Final Doctrine

OneDayOS should build reusable platform services only when reality proves the abstraction.

The platform should not be small because OneDayOS lacks ambition.

The platform should be small at first because premature abstractions are expensive.

The right pattern is:

```txt
Build module-local.
Observe repetition.
Document evidence.
Review promotion.
Extract the smallest shared service.
Expose through SDK.
Keep module-specific logic out.
```

The Three Client Rule is not anti-platform.

It is how OneDayOS becomes a real platform without becoming a bloated framework.
