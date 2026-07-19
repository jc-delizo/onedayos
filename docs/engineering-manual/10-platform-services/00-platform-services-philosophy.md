# OneDayOS Engineering Manual — Platform Services Philosophy

**Document ID:** `10-platform-services/00-platform-services-philosophy.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Philosophy Required Now; Platform Service Implementations Deferred`  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Applies To:** Restarted OneDayOS platform build  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/04-sdk-events.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`

---

# 1. Purpose

This document defines the philosophy, promotion rules, boundaries, and lifecycle for **Platform Services** in OneDayOS.

Platform Services are reusable cross-cutting capabilities that serve multiple business modules through stable platform APIs.

Examples include:

```txt
Audit Log Service
Notification Service
Approval Workflow Service
Comments Service
Attachments Service
Activity Feed Service
Reporting Service
Search Service
Background Jobs Service
```

However, these services must not be built just because they sound useful.

OneDayOS is a platform, but it must not become an overengineered framework before it has real business-module evidence.

The goal of this document is to prevent both extremes:

```txt
Bad extreme 1: Build everything inside modules forever.
Result: duplication, inconsistent behavior, high maintenance cost.

Bad extreme 2: Build generic platform services too early.
Result: slow delivery, wrong abstractions, unnecessary complexity.
```

The correct path is:

```txt
Start module-local.
Observe repeated patterns.
Promote only proven capabilities.
Expose them through the SDK.
Keep modules decoupled.
```

---

# 2. Core Doctrine

## 2.1 Platform Services are earned, not imagined

A capability becomes a Platform Service only after OneDayOS has evidence that the same capability is needed across independent modules, clients, or workflows.

Do not build a Platform Service because:

```txt
It exists in Odoo.
It sounds enterprise-grade.
Claude suggested it.
It might be useful someday.
It would be impressive in a demo.
It makes the architecture diagram look complete.
```

Build a Platform Service because:

```txt
The same behavior has appeared repeatedly.
The repeated behavior is stable enough to abstract.
Keeping it module-local now creates visible duplication or inconsistency.
A shared service will reduce long-term maintenance without slowing near-term delivery.
```

## 2.2 Platform Services are not Kernel

Kernel contains fundamentals that every module needs to exist:

```txt
Authentication
Organizations
Users
Roles
Permissions
Settings
Feature flags
Module registry
Event bus interface
SDK backing primitives
Routing/app shell primitives
```

Platform Services are reusable business capabilities built on top of Kernel and Business Objects.

Kernel is required for the platform to run.

Platform Services are added when repeated business patterns justify them.

## 2.3 Platform Services are not modules

A Business Module owns a business domain.

Examples:

```txt
Inventory
Leave
Purchasing
Expenses
CRM
Assets
Visitor Management
Incident Reporting
```

A Platform Service does not own a business domain. It provides reusable infrastructure that modules consume.

Examples:

```txt
Approval Workflow Service does not own Leave.
It provides approval behavior that Leave, Purchasing, and Expenses may use.

Attachment Service does not own Incidents.
It provides file attachment behavior that Incidents, Expenses, Assets, and Projects may use.

Notification Service does not own Inventory.
It provides notification delivery behavior that Inventory, Leave, Incidents, and CRM may use.
```

## 2.4 Platform Services are accessed through SDK contracts

Modules must not import Platform Service internals directly.

Allowed:

```ts
import { sdk } from '@/sdk/server'

await sdk.approvals.request(ctx, input)
await sdk.notifications.send(ctx, input)
await sdk.attachments.link(ctx, input)
```

Forbidden:

```ts
import { ApprovalWorkflowService } from '@/platform-services/approvals/service'
import { NotificationService } from '@/platform-services/notifications/service'
import { AttachmentRepository } from '@/platform-services/attachments/repository'
```

The SDK is the public platform contract. Platform Service internals must remain replaceable.

---

# 3. Locked Architecture Context

The OneDayOS architecture is:

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

Platform Services sit between Business Objects and Business Modules because they often operate on shared objects and are consumed by multiple modules.

Example:

```txt
Employee
  ↓
Approval Workflow Service
  ↓
Leave Module
Purchasing Module
Expenses Module
```

Example:

```txt
Product / Warehouse / Stock Movement
  ↓
Reporting Service
  ↓
Inventory Module
Purchasing Module
Analytics Dashboard
```

Example:

```txt
Customer / Incident / Asset / Expense
  ↓
Attachments Service
  ↓
CRM Module
Incident Reporting Module
Assets Module
Expenses Module
```

---

# 4. The Three Independent Use Cases Rule

## 4.1 Rule

A capability may be promoted into Platform Services only when at least **three independent use cases** demonstrate the same reusable need.

This is the refined version of the earlier “Three Client Rule.”

The original principle remains:

```txt
If only one module needs a capability, keep it inside the module.
If three independent modules, clients, or workflows need it, consider promoting it.
```

The refined name is more precise:

```txt
Three Independent Use Cases Rule
```

because evidence may come from:

```txt
Three different clients
Three different modules
Three different workflows in one large client
A combination of the above
```

## 4.2 Why this rule exists

The rule prevents OneDayOS from overengineering early.

Without the rule, Claude or engineers may build generic systems too soon:

```txt
Approval Engine before any real approval workflow exists.
Notification Engine before delivery channels are known.
Dynamic Form Engine before enough forms exist.
Reporting Engine before report patterns are understood.
Attachment Service before file lifecycle rules are known.
```

Early generic services tend to be wrong because they are designed from imagination rather than real usage.

## 4.3 What counts as an independent use case

A use case counts as independent when it has a separate business workflow, separate module context, or separate client demand.

Examples that count:

```txt
Leave request approval
Purchase request approval
Expense claim approval
```

These are three independent approval use cases.

Examples that do not count:

```txt
Leave request approval for Client A
Leave request approval for Client B
Leave request approval for Client C
```

This is weaker evidence because it may still be the same module workflow repeated. It may support promotion, but it does not prove a general approval engine alone.

Better evidence:

```txt
Client A uses Leave approvals.
Client B uses Purchasing approvals.
Client C uses Expense approvals.
```

## 4.4 Three use cases trigger review, not automatic promotion

Three independent use cases do not automatically mean “build a platform service now.”

They mean:

```txt
Stop.
Review the repeated pattern.
Decide whether abstraction is justified.
Write a service specification.
Freeze the specification.
Then implement.
```

Promotion still requires architectural review.

---

# 5. What Does Not Need the Three Use Cases Rule

The rule does not apply to true Kernel fundamentals.

These are built immediately because every module depends on them:

```txt
Authentication
Organizations
Users
Roles
Permissions
Settings
Feature flags
Module registry
Event bus interface
SDK
PlatformContext
API response contract
Tenant isolation
```

The rule also does not apply to shared Business Objects that are foundational to the platform, such as:

```txt
Employee
Product
Customer
Supplier
Warehouse
```

However, it does apply to extra fields, behaviors, and engines around those objects.

Example:

```txt
Product belongs in Business Objects.
Product barcode does not automatically belong in core Product.
Barcode may start as an Inventory extension field.
```

---

# 6. Platform Service Classification

## 6.1 A capability is a Platform Service candidate when...

A capability may be a Platform Service candidate when it is:

```txt
Reusable across multiple modules
Not business-domain-specific
Tenant-scoped
Permission-sensitive
Event-aware
Configuration-driven
Stable enough to expose through SDK
```

Examples:

```txt
Approval routing
Notifications
Attachments
Comments
Activity timeline
Search indexing
Reporting definitions
Background jobs
```

## 6.2 A capability should remain module-local when...

A capability should remain inside a module when it is:

```txt
Needed by only one module
Still changing rapidly
Highly domain-specific
Not yet understood
Cheap to keep local
Dangerous to abstract early
```

Examples:

```txt
Inventory stock adjustment reason codes
Leave balance calculation
CRM pipeline stage probability
Expense reimbursement categories
Visitor badge printing
Incident severity classification
```

These may eventually interact with Platform Services, but they should not become Platform Services themselves.

---

# 7. Platform Service Lifecycle

Platform Services move through a lifecycle.

```txt
1. Module-local implementation
2. Repeated pattern observed
3. Candidate logged
4. Three Independent Use Cases evidence collected
5. Platform Service proposal written
6. Architecture review
7. Service specification frozen
8. Implementation through SDK
9. Module migration
10. Service hardening
```

## 7.1 Stage 1 — Module-local implementation

Start simple.

If only Leave needs approvals, Leave may implement local approval logic.

Example:

```txt
leave_requests.status
leave_requests.approvedBy
leave_requests.approvedAt
leave_requests.rejectedReason
```

This is acceptable when Leave is the only approval use case.

## 7.2 Stage 2 — Repeated pattern observed

If Purchasing later needs approvals, do not immediately build a full Approval Engine.

Instead:

```txt
Keep approval behavior inside Purchasing.
Use similar naming where reasonable.
Document similarities and differences.
Watch for repetition.
```

## 7.3 Stage 3 — Candidate logged

Once the second use case appears, create or update the Platform Service evidence log.

Example:

```txt
Capability: Approvals
Use Case 1: Leave requests
Use Case 2: Purchase requests
Status: Candidate, not yet promoted
Decision: Keep module-local for now
```

## 7.4 Stage 4 — Three independent use cases reached

When the third use case appears:

```txt
Capability: Approvals
Use Case 1: Leave requests
Use Case 2: Purchase requests
Use Case 3: Expense claims
Status: Promotion review required
```

Do not implement yet. Write a service specification first.

## 7.5 Stage 5 — Platform Service proposal

The proposal must answer:

```txt
What repeated behavior exists?
Which modules need it?
Which parts are truly shared?
Which parts remain module-specific?
What SDK API should expose it?
What database tables are needed?
What events are emitted?
What permissions are required?
What migrations are needed from module-local data?
What should remain out of scope?
```

## 7.6 Stage 6 — Architecture review

Review must challenge whether the abstraction is real.

Questions:

```txt
Are the use cases actually the same?
Are we abstracting too early?
Will the shared service simplify module code?
Will this slow one-day delivery?
Does the service reduce or increase support burden?
Can this be configured safely?
Can it be tested across tenants?
```

## 7.7 Stage 7 — Service specification frozen

Only after approval should a detailed service document be frozen.

Example:

```txt
10-platform-services/04-approval-workflow-service.md
```

## 7.8 Stage 8 — SDK implementation

A Platform Service is exposed through SDK.

Example:

```ts
await sdk.approvals.createRequest(ctx, input)
await sdk.approvals.approve(ctx, approvalRequestId, input)
await sdk.approvals.reject(ctx, approvalRequestId, input)
```

Modules do not import service internals.

## 7.9 Stage 9 — Module migration

Existing module-local implementations may be migrated gradually.

Migration must preserve:

```txt
Tenant isolation
Permission behavior
Historical records
Event contracts
User-facing behavior
Reports
Auditability
```

## 7.10 Stage 10 — Service hardening

Once a Platform Service is used by multiple modules, it becomes high-leverage infrastructure.

It must have:

```txt
Contract tests
Tenant-isolation tests
Permission-denial tests
Migration tests
Event tests
Failure-mode tests
Documentation
```

---

# 8. Platform Service Evidence Log

Every candidate Platform Service must have an evidence log.

Recommended file:

```txt
docs/engineering-manual/10-platform-services/evidence-log.md
```

Recommended format:

```md
# Platform Service Evidence Log

## Capability: Approvals

Status: Candidate

### Use Case 1
Module: Leave
Workflow: Employee submits leave request; manager approves or rejects.
Shared Need: Request, approver, status, decision, timestamp, comments.
Module-Specific Need: Leave balance validation.

### Use Case 2
Module: Purchasing
Workflow: Staff submits purchase request; owner approves before PO creation.
Shared Need: Request, approver, status, decision, timestamp, comments.
Module-Specific Need: Vendor and amount rules.

### Use Case 3
Module: Expenses
Workflow: Employee submits reimbursement; finance approves before payment.
Shared Need: Request, approver, status, decision, timestamp, comments.
Module-Specific Need: Receipt validation and reimbursement category.

Decision:
Promote to Platform Service proposal.

Reason:
The shared approval lifecycle is stable across three independent workflows.
```

The evidence log prevents vague claims like:

```txt
“Many modules need this.”
```

Instead, we require concrete proof.

---

# 9. Initial Platform Service Candidates

The following are likely future Platform Services, but they are not automatically approved for implementation.

## 9.1 Audit Log Service

Likely consumers:

```txt
Business Object mutations
Inventory adjustments
Leave approvals
User/permission changes
Settings changes
```

Why likely:

```txt
Every serious business system eventually needs traceability.
```

Why deferred:

```txt
The event contracts should be established first.
Actual audit UI/reporting needs should be observed.
```

Current preparation:

```txt
Every Business Object mutation emits events.
Module mutations emit typed events.
Event payloads are stable and tenant-scoped.
```

Potential future SDK:

```ts
await sdk.audit.record(ctx, input)
await sdk.audit.listForEntity(ctx, entityRef)
```

## 9.2 Notification Service

Likely consumers:

```txt
Inventory low-stock alerts
Leave request updates
Incident assignments
Approval requests
CRM follow-ups
```

Why deferred:

```txt
Delivery channels, notification preferences, and urgency rules are not yet proven.
```

Module-local start:

```txt
A module may show local status or simple UI alerts before a Notification Service exists.
```

Potential future SDK:

```ts
await sdk.notifications.send(ctx, {
  recipientUserId,
  title,
  body,
  source,
})
```

## 9.3 Approval Workflow Service

Likely consumers:

```txt
Leave
Purchasing
Expenses
Assets
```

Why deferred:

```txt
Approval workflows vary widely. Building a generic engine too early risks the wrong abstraction.
```

Module-local start:

```txt
Leave may implement simple approval locally.
Purchasing may implement simple approval locally.
Promote only after shared lifecycle is clear.
```

Potential future SDK:

```ts
await sdk.approvals.request(ctx, input)
await sdk.approvals.approve(ctx, approvalId, input)
await sdk.approvals.reject(ctx, approvalId, input)
```

## 9.4 Comments Service

Likely consumers:

```txt
Incident reports
CRM opportunities
Projects
Approvals
Assets
```

Why deferred:

```txt
Not every MVP module needs discussion threads.
Mentions, notifications, and permissions complicate the design.
```

Potential future SDK:

```ts
await sdk.comments.add(ctx, entityRef, input)
await sdk.comments.list(ctx, entityRef)
```

## 9.5 Attachments Service

Likely consumers:

```txt
Incident reports
Expenses
Assets
Purchasing
Projects
```

Why deferred:

```txt
File lifecycle, storage limits, signed URLs, permissions, backup behavior, and virus scanning need a full spec.
```

Potential future SDK:

```ts
await sdk.attachments.createUploadUrl(ctx, input)
await sdk.attachments.link(ctx, entityRef, fileRef)
await sdk.attachments.list(ctx, entityRef)
```

## 9.6 Activity Feed Service

Likely consumers:

```txt
Customer history
Asset history
Project history
Employee history
Inventory movement history
```

Why deferred:

```txt
Activity feeds should probably consume events and audit logs. Build after event patterns stabilize.
```

Potential future SDK:

```ts
await sdk.activity.listForEntity(ctx, entityRef)
```

## 9.7 Reporting Service

Likely consumers:

```txt
Inventory reports
Leave reports
Purchasing reports
CRM reports
Expenses reports
```

Why deferred:

```txt
Reports vary by module and client. Start with module-local reports before extracting shared definitions.
```

Potential future SDK:

```ts
await sdk.reports.run(ctx, reportId, filters)
await sdk.reports.saveView(ctx, input)
```

## 9.8 Search Service

Likely consumers:

```txt
Products
Customers
Suppliers
Employees
Inventory records
CRM records
Incidents
```

Why likely:

```txt
Global search is a strong platform capability.
```

Why deferred:

```txt
Permission-aware indexing and result filtering must be designed carefully.
```

Potential future SDK:

```ts
await sdk.search.query(ctx, input)
await sdk.search.index(ctx, entityRef, document)
```

## 9.9 Background Jobs Service

Likely consumers:

```txt
Email notifications
Scheduled reports
Import processing
Search indexing
AI processing
File processing
```

Why deferred:

```txt
In-process work is enough for MVP until long-running or retryable tasks appear.
```

Potential future SDK:

```ts
await sdk.jobs.enqueue(ctx, jobName, payload)
await sdk.jobs.schedule(ctx, jobName, schedule, payload)
```

---

# 10. Platform Services and the Event Bus

The Event Bus is a Kernel/SDK primitive.

It is not itself a full Platform Service.

The Event Bus provides decoupled communication:

```txt
Module or Business Object mutation
  ↓
Event emitted
  ↓
Future Platform Service may listen
```

Example:

```txt
objects.product.created
  ↓
Audit Log Service listens
Search Service listens
AI Context Service listens
```

Important rule:

```txt
Do not build Audit Log, Search, Notifications, or AI consumers just because events exist.
```

Events prepare the platform for future services. They do not force those services to exist immediately.

---

# 11. Platform Services and Business Objects

Platform Services may operate on Business Objects, but they do not own them.

Examples:

```txt
Audit Log Service records changes to Product.
It does not own Product.

Search Service indexes Customer.
It does not own Customer.

Attachments Service links files to Supplier.
It does not own Supplier.

Approval Workflow Service may reference Employee as approver.
It does not own Employee.
```

Business Objects remain the shared identity layer.

Platform Services provide cross-cutting behavior around them.

---

# 12. Platform Services and Modules

Modules may consume Platform Services through SDK.

Modules may not depend on Platform Service internals.

Example: Leave uses future approvals.

Allowed:

```ts
await sdk.approvals.request(ctx, {
  source: {
    module: 'leave',
    entity: 'leave_request',
    id: leaveRequest.id,
  },
  approverUserId,
  title: 'Leave request approval',
})
```

Forbidden:

```ts
import { createApprovalRequest } from '@/platform-services/approvals/repository'
```

Modules must also retain their domain logic.

Example:

```txt
Leave decides whether the employee has enough leave balance.
Approval Service decides approval routing and approval state.
```

Do not move domain logic into Platform Services just because a module uses them.

---

# 13. Service API Design Principles

Every Platform Service API must follow OneDayOS standards.

## 13.1 PlatformContext first

All service methods must receive verified `PlatformContext`.

Allowed:

```ts
await sdk.notifications.send(ctx, input)
```

Forbidden:

```ts
await sdk.notifications.send(orgId, userId, input)
await sdk.notifications.send(inputWithOrgId)
```

## 13.2 Tenant-scoped by default

Every service must be tenant-aware.

Service tables must include `orgId` unless explicitly global.

Client-supplied `orgId` is forbidden.

## 13.3 Permission-aware

Platform Services must define their own permissions when users interact with them directly.

Examples:

```txt
approvals.request.read
approvals.request.approve
attachments.file.upload
comments.comment.create
reports.report.export
```

But module-triggered service calls may also require module permissions.

Example:

```txt
Creating a leave request requires leave.leave_request.create.
Submitting it for approval may create approval records internally.
```

The module service should enforce module permissions before calling the Platform Service.

## 13.4 Events are contracts

Platform Services should emit events for meaningful state changes.

Examples:

```txt
approvals.request.created
approvals.request.approved
notifications.notification.sent
attachments.file.linked
comments.comment.created
reports.report.generated
```

Events must follow the naming convention:

```txt
{namespace}.{entity}.{past_tense_verb}
```

## 13.5 JSON API compatible

If exposed through APIs, Platform Services must follow Kernel API contracts:

```json
{
  "data": {},
  "error": null
}
```

or:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

## 13.6 No direct module coupling

Platform Services must not import business modules.

Forbidden:

```ts
import { LeaveService } from '@/modules/leave/service'
import { InventoryService } from '@/modules/inventory/service'
```

Instead, use generic source references:

```ts
type EntityRef = {
  module?: string
  object?: string
  entity: string
  id: string
}
```

---

# 14. Data Model Principles for Platform Services

Platform Service tables must follow the same data rules as the rest of OneDayOS.

Required for tenant-scoped service records:

```txt
id
orgId
createdAt
updatedAt where applicable
deletedAt/deletedBy where soft deletion applies
createdBy/updatedBy where user traceability matters
```

Required indexes:

```txt
orgId
orgId + entity reference
orgId + user reference where applicable
orgId + status where applicable
```

Forbidden:

```txt
Service table without orgId
Global service state for tenant data
Client-supplied orgId
Hard delete for business records
Raw Prisma inside modules
Cross-module foreign keys without review
```

---

# 15. Source References

Many Platform Services need to attach behavior to records owned by modules or Business Objects.

Do not solve this by importing modules.

Use source references.

Recommended shape:

```ts
type SourceRef = {
  namespace: 'objects' | 'module'
  module?: string
  object?: string
  entity: string
  id: string
}
```

Examples:

```ts
const productRef = {
  namespace: 'objects',
  object: 'product',
  entity: 'product',
  id: product.id,
}

const leaveRequestRef = {
  namespace: 'module',
  module: 'leave',
  entity: 'leave_request',
  id: leaveRequest.id,
}
```

This lets Platform Services link to records without importing their services or repositories.

---

# 16. Platform Services Must Not Become a Dumping Ground

Do not move code into Platform Services just because it is used twice.

Do not move code into Platform Services just because it feels “shared.”

Do not move code into Platform Services to avoid making a hard module decision.

Bad examples:

```txt
GenericStatusService
GenericWorkflowService
UniversalEntityService
BusinessRulesEngine
CustomFieldsService
OmniCrudService
```

These are warning signs that abstraction is happening too early or too broadly.

Prefer small, clear services:

```txt
Approval Workflow Service
Notification Service
Attachment Service
Search Service
Reporting Service
```

---

# 17. Overengineering Warning Signs

A proposed Platform Service is probably overengineered if:

```txt
It needs a plugin system before three modules use it.
It requires custom DSLs before real workflows exist.
It needs a visual builder before hand-coded patterns are known.
It introduces a queue before any background work is needed.
It introduces FastAPI or a second backend runtime without a specific ADR.
It requires more work than the first module it is supposed to support.
It cannot be explained to a client in one sentence.
It creates configuration screens before actual settings are known.
```

If these signs appear, keep the behavior module-local or defer.

---

# 18. Underengineering Warning Signs

A capability should be considered for promotion if:

```txt
Three modules implement nearly the same table.
Three modules implement nearly the same status lifecycle.
Three modules duplicate permission checks for the same cross-cutting behavior.
Three modules need the same UI pattern and state machine.
Three modules emit similar events that should have a shared consumer.
A bug fix has to be copied across modules.
Client support suffers because the same behavior works differently per module.
```

If these signs appear, log the evidence and begin service proposal review.

---

# 19. Current Restarted Build Decision

For the restarted OneDayOS platform foundation, do **not** implement full Platform Services yet.

Build now:

```txt
Kernel
SDK
Database architecture
Business Objects
Module system
Module generator
Security boundaries
Event contracts
Design system
```

Do not build yet:

```txt
Approval Engine
Notification Engine
Audit Log Service
Activity Feed
Comments
Attachments
Reporting Engine
Search Engine
Background Job Queue
Dynamic Form Engine
Dynamic CRUD Engine
```

Exceptions:

```txt
The Event Bus interface exists now because modules need a decoupled communication primitive.
Mutation events exist now because future Audit/Search/AI services should not require retrofitting.
```

This is not a contradiction.

The Event Bus is a small Kernel/SDK primitive.

Full Platform Services are deferred until evidence exists.

---

# 20. How Claude Should Use This Document

Claude must not read the Platform Services list and implement everything.

Claude should treat this document as a boundary document.

Claude may:

```txt
Add TODO comments that point to deferred Platform Services.
Emit events that future services may consume.
Keep module-local logic where only one module needs it.
Use SDK placeholders only if the service is already frozen and approved.
```

Claude must not:

```txt
Build Approval Engine without a frozen spec.
Build Notification Engine without a frozen spec.
Build generic Workflow Engine.
Build Dynamic Form Engine.
Build Dynamic CRUD Engine.
Add FastAPI for Platform Services.
Create cross-module imports.
Move domain-specific logic into Platform Services prematurely.
Create generic custom-fields JSON as a fake platform service.
```

---

# 21. Implementation Prompt Template for Future Platform Service

When a Platform Service is approved, Claude should receive a narrow prompt like this:

```md
You are implementing OneDayOS Platform Service: [SERVICE NAME].

Authoritative documents:
- docs/engineering-manual/10-platform-services/00-platform-services-philosophy.md
- docs/engineering-manual/10-platform-services/[SERVICE-SPEC].md
- docs/engineering-manual/05-sdk/01-sdk-public-api.md
- docs/engineering-manual/05-sdk/02-sdk-db-access.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md
- docs/engineering-manual/05-sdk/04-sdk-events.md

Rules:
- Implement only the approved Platform Service.
- Do not implement other deferred services.
- Use PlatformContext.
- Do not accept client-supplied orgId.
- Use sdk.getDb(ctx).
- Do not import business modules.
- Do not use FastAPI.
- Add tenant-isolation tests.
- Add permission-denial tests.
- Add event tests.
- Stop if the spec is ambiguous.
```

---

# 22. Testing Requirements for Platform Services

Every implemented Platform Service must include:

```txt
Unit tests
Service tests
API tests if API exists
Tenant-isolation tests
Permission-denial tests
Event emission tests
Event listener tests if applicable
Soft-delete tests if applicable
Module integration tests with at least two consuming modules when possible
```

Minimum security test matrix:

```txt
Org A user cannot read Org B service records.
Org A user cannot mutate Org B service records.
Unauthenticated API returns 401 JSON.
Authenticated but unauthorized API returns 403 JSON.
Disabled module cannot call module-specific service behavior.
Client-supplied orgId is rejected.
Admin wildcard does not bypass tenant isolation.
```

---

# 23. Platform Service Permissions

Platform Services may define their own permission namespace.

Examples:

```txt
approvals.request.read
approvals.request.approve
notifications.notification.read
attachments.file.upload
attachments.file.delete
comments.comment.create
reports.report.read
reports.report.export
search.query.run
```

But not every internal Platform Service operation requires a user-facing permission.

Example:

```txt
Inventory service emits inventory.stock_level.reorder_threshold_crossed.
Future Notification Service sends a notification as a system reaction.
The user does not separately need notifications.notification.create.
```

The initiating module operation must still be authorized.

If a user directly uses a Platform Service UI, the Platform Service permission applies.

---

# 24. Platform Services and Client Configuration

Platform Services should be configurable per organization when appropriate.

Examples:

```txt
Approval rules
Notification preferences
Report schedules
Attachment size limits
Search indexing options
```

Configuration must be:

```txt
Tenant-scoped
Validated with Zod
Stored through approved settings/configuration patterns
Permission-protected
Documented
```

Forbidden:

```txt
Hard-coded client-specific rules
Per-client code forks
Unvalidated JSON blobs
Settings without ownership
Settings that bypass permissions
```

---

# 25. Platform Services and AppCare

Platform Services increase AppCare responsibility.

Before implementing a service, consider support impact.

Examples:

```txt
Notification Service requires delivery monitoring and failure handling.
Attachment Service requires storage limits and backup strategy.
Background Jobs require retries and dead-letter handling.
Approval Service requires support for stuck approvals.
Reporting Service requires performance monitoring.
Search Service requires indexing health checks.
```

A Platform Service is not just code. It is operational responsibility.

This matters because OneDayOS sells AppCare at a low recurring price. Platform Services must not create operational cost that destroys margin.

---

# 26. Architectural Decision Records

A Platform Service requires an ADR when:

```txt
It is promoted from module-local code.
It introduces new tables used by multiple modules.
It adds a new SDK namespace.
It changes event contracts.
It changes permission semantics.
It introduces background jobs.
It introduces a new infrastructure dependency.
It changes AppCare operational obligations.
```

Example ADRs:

```txt
ADR-0010: Promote approval workflows to Platform Service.
ADR-0011: Introduce Notification Service with in-app delivery only.
ADR-0012: Add Background Jobs Service using [chosen queue].
ADR-0013: Add Attachment Service backed by Supabase Storage.
```

---

# 27. Anti-Patterns

## 27.1 Building a generic workflow engine too early

Bad:

```txt
Before Leave, Purchasing, and Expenses exist, build a universal Workflow Engine.
```

Why bad:

```txt
No real workflow evidence.
High complexity.
Likely wrong abstraction.
Hard for Claude to implement safely.
```

Correct:

```txt
Build simple local workflows.
Log evidence.
Promote only after patterns are proven.
```

## 27.2 Putting Platform Service logic inside Kernel

Bad:

```txt
src/kernel/approvals
src/kernel/notifications
src/kernel/comments
```

Why bad:

```txt
Kernel becomes bloated.
Business capabilities become platform fundamentals accidentally.
Harder to maintain layer boundaries.
```

Correct:

```txt
src/platform-services/approvals
src/platform-services/notifications
```

with public access through SDK only.

## 27.3 Hiding module-specific logic inside a Platform Service

Bad:

```txt
Approval Service knows how to calculate leave balances.
```

Correct:

```txt
Leave Service calculates leave balance.
Approval Service handles approval lifecycle.
```

## 27.4 Building services with client-supplied orgId

Bad:

```ts
await sdk.approvals.request({ orgId: body.orgId, ...body })
```

Correct:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'leave')
await sdk.approvals.request(ctx, input)
```

## 27.5 Using Platform Services to avoid module design

Bad:

```txt
“We do not know how Inventory should work, so let us build a generic record engine.”
```

Correct:

```txt
Design Inventory clearly.
Extract only repeated patterns later.
```

---

# 28. Recommended Folder Structure for Future Services

When Platform Services are eventually implemented, use a consistent structure.

```txt
src/platform-services/[service]/
  index.server.ts
  service.server.ts
  repository.server.ts
  schema.ts
  permissions.ts
  events.ts
  types.ts
  api.ts              # optional route helpers
  __tests__/
    service.test.ts
    api.test.ts
    tenant-isolation.test.ts
    permissions.test.ts
    events.test.ts
```

Rules:

```txt
.server.ts files may import @/sdk/server and server-only dependencies.
Shared schema/types may be imported by client code if safe.
Platform Services may import SDK/server but must not import business modules.
Modules may not import platform-service internals.
SDK exposes approved service methods.
```

---

# 29. Example Promotion: Approval Workflow

## 29.1 Before promotion

Leave module:

```txt
leave_requests.status
leave_requests.approvedBy
leave_requests.approvedAt
leave_requests.rejectedReason
```

Purchasing module:

```txt
purchase_requests.status
purchase_requests.approvedBy
purchase_requests.approvedAt
purchase_requests.rejectedReason
```

Expenses module:

```txt
expense_claims.status
expense_claims.approvedBy
expense_claims.approvedAt
expense_claims.rejectedReason
```

## 29.2 Evidence

The same lifecycle appears:

```txt
draft/submitted/approved/rejected
approver
decision timestamp
decision note
request source
permission to approve
```

## 29.3 Promotion

Create:

```txt
approval_requests
approval_steps
approval_decisions
```

Expose:

```ts
sdk.approvals.request(ctx, input)
sdk.approvals.approve(ctx, id, input)
sdk.approvals.reject(ctx, id, input)
```

Keep module-specific logic inside modules:

```txt
Leave validates leave balance.
Purchasing validates vendor/amount.
Expenses validates receipts/category.
```

---

# 30. Example Non-Promotion: Inventory Reorder Rules

Inventory needs reorder points.

This should not become a Platform Service just because it is “rules.”

Reason:

```txt
Reorder points are inventory-specific.
They belong in InventoryProductExtension or Inventory module tables.
```

Only if similar threshold-trigger behavior appears across multiple modules might a future rules/alert service be considered.

Even then, start with evidence.

---

# 31. Example Non-Promotion: Custom Fields

Do not create a generic Custom Fields Platform Service in MVP.

Why:

```txt
It creates schema ambiguity.
It weakens type safety.
It complicates validation.
It complicates search/reporting.
It invites per-client mini-apps.
It makes Claude generate vague JSON logic.
```

Correct path:

```txt
Use module extension tables.
Use explicit schema.
Promote fields only with evidence.
Plan Dynamic Forms later after enough hand-coded forms exist.
```

---

# 32. Design Requirements for Future Platform Service UI

If a Platform Service has UI, it must follow the Design System.

Examples:

```txt
Approval inbox
Notification center
Attachment panel
Comments thread
Activity timeline
Report builder
Search command palette
```

UI must be:

```txt
Data-dense
Keyboard-friendly
Permission-aware
Tenant-safe
Consistent with OneDayOS visual identity
Not generic admin template UI
```

Platform Service UI must not invent its own design language.

---

# 33. Deferred Does Not Mean Forgotten

Deferring Platform Services is intentional.

It does not mean they are unimportant.

It means:

```txt
We will not build the wrong abstraction too early.
We will collect evidence.
We will design each service with real module needs.
We will expose services through stable SDK APIs.
```

This is how OneDayOS becomes a durable platform instead of a bloated starter kit.

---

# 34. Acceptance Criteria

This document is accepted when the founder and architect agree that:

```txt
[ ] Platform Services are not implemented during the restarted foundation build.
[ ] The Three Independent Use Cases Rule is the promotion rule.
[ ] Platform Service candidates require an evidence log.
[ ] Three use cases trigger review, not automatic implementation.
[ ] Platform Services must be accessed through SDK.
[ ] Platform Services must use verified PlatformContext.
[ ] Platform Services must not accept client-supplied orgId.
[ ] Platform Services must not import business modules.
[ ] Platform Services must not become a dumping ground for unclear abstractions.
[ ] Future Platform Service implementations require frozen service-specific documents.
[ ] Claude is not allowed to implement deferred services from this philosophy document alone.
```

---

# 35. Founder Review Questions

Before freezing this document, answer:

```txt
1. Do we agree that no full Platform Services should be built in the restarted foundation phase?
2. Do we agree to use “Three Independent Use Cases Rule” instead of only “Three Client Rule”?
3. Do we agree that three use cases trigger review, not automatic promotion?
4. Do we agree that Audit Log, Notifications, Approvals, Attachments, Reporting, Search, and Background Jobs are deferred?
5. Do we agree that events should still be emitted now to prepare for future services?
6. Do we agree that Platform Services must be exposed only through the SDK?
7. Do we agree that Platform Services must not import modules?
8. Do we agree that FastAPI is still excluded from the core platform and from Platform Services unless a future ADR proves a narrow need?
```

---

# 36. Next Documents

After this document is approved, the recommended next document is:

```txt
10-platform-services/01-three-client-rule.md
```

That document should formalize the evidence log, examples, exceptions, and promotion workflow in more detail.

After that, the individual deferred service specifications may be written as design documents, but implementation should remain gated:

```txt
10-platform-services/02-audit-log-service.md
10-platform-services/03-notification-service.md
10-platform-services/04-approval-workflow-service.md
10-platform-services/05-comments-service.md
10-platform-services/06-attachments-service.md
10-platform-services/07-activity-feed-service.md
10-platform-services/08-reporting-service.md
10-platform-services/09-search-service.md
10-platform-services/10-background-jobs.md
```

---

# 37. Summary

Platform Services are one of the most important parts of the long-term OneDayOS vision.

But they must be built at the right time.

The OneDayOS platform should start with:

```txt
Strong Kernel
Stable SDK
Shared Business Objects
Secure Module System
Reliable Event Contracts
Generator Safety Rails
```

Then, as repeated patterns emerge, OneDayOS should promote proven capabilities into Platform Services.

This keeps the platform reusable without becoming overengineered.

The rule is simple:

```txt
Do not build a Platform Service because we can imagine it.
Build it because the platform has proven it needs one.
```
