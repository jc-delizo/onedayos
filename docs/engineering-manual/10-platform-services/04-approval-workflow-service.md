# OneDayOS Engineering Manual — 10 Platform Services / 04 Approval Workflow Service

**Document ID:** `10-platform-services/04-approval-workflow-service.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Deferred — Contract Only`  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/06-module-events.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`

---

# 1. Purpose

This document defines the future **Approval Workflow Service** for OneDayOS.

The Approval Workflow Service is the reusable Platform Service that may eventually support approval flows across multiple independent modules, such as:

```txt
Leave request approval
Purchase request approval
Expense claim approval
Inventory adjustment approval
Asset disposal approval
Incident resolution approval
```

However, this document is **not** permission to implement the service now.

The Approval Workflow Service is intentionally deferred until repeated approval workflows prove the need for a shared engine.

During the restarted foundation build, OneDayOS should only implement:

```txt
Kernel auth
Tenant isolation
Users, roles, permissions
SDK
Database access
Business Objects
Module system
Event contracts
Generator safety rails
```

The Approval Workflow Service should be designed now so Claude and future engineers do not invent incompatible approval patterns later.

---

# 2. Implementation Status

```txt
Implementation Status: Deferred — Contract Only
```

This means:

```txt
Allowed now:
- Document approval terminology.
- Document future data model direction.
- Document future SDK shape.
- Document future event names.
- Document module-local approval guidance.
- Document promotion criteria.

Not allowed now:
- Creating approval database tables.
- Creating approval SDK APIs.
- Creating approval UI components.
- Creating approval route handlers.
- Adding approval engine logic to Kernel.
- Adding approval logic to the module generator.
- Building a generic workflow engine.
```

Claude must not implement the Approval Workflow Service from this document alone.

Implementation requires a future approved document with status:

```txt
Status: Frozen
Implementation Status: Approved for Implementation
```

and likely an ADR.

---

# 3. Core Principle

```txt
Approvals are business workflows.
The Approval Workflow Service exists only when the same approval lifecycle repeats across independent modules.
```

Do not build an Approval Engine because approvals sound important.

Build it only after there is evidence that multiple modules need the same approval lifecycle.

---

# 4. Why Approval Workflow Is Deferred

Approvals are deceptively complex.

A premature Approval Workflow Service can easily become a bad generic workflow engine.

Common traps:

```txt
Trying to support every possible approval rule too early.
Trying to model all Philippine SME approval structures before real examples exist.
Building drag-and-drop workflow builders prematurely.
Building condition engines before conditions are understood.
Mixing approval state with module business state.
Letting approvals bypass module permissions.
Letting modules depend directly on approval internals.
```

For OneDayOS, the correct sequence is:

```txt
1. Build secure platform foundation.
2. Build first modules with module-local approval logic if needed.
3. Observe repeated approval patterns.
4. Record evidence.
5. Write Approval Workflow Service proposal.
6. Approve ADR.
7. Extract common approval lifecycle into Platform Service.
```

---

# 5. Three Independent Use Cases Requirement

The Approval Workflow Service must not be implemented until at least three independent approval use cases exist.

Examples that may count:

```txt
Use Case 1: Leave requests require manager approval.
Use Case 2: Purchase requests require finance/admin approval.
Use Case 3: Expense claims require supervisor approval.
```

or:

```txt
Use Case 1: Inventory stock adjustment approval.
Use Case 2: Asset disposal approval.
Use Case 3: Incident closure approval.
```

The use cases may come from:

```txt
Three different clients
Three different modules
Three different workflows inside the same client
```

But they must be genuinely independent.

The following does **not** count as three independent use cases:

```txt
Leave approval for vacation leave
Leave approval for sick leave
Leave approval for emergency leave
```

Those are variants of one Leave approval workflow.

---

# 6. Evidence Log Requirement

Before implementation, create an evidence log.

Template:

```md
# Approval Workflow Evidence Log

## Candidate Service
Approval Workflow Service

## Use Case 1
Module:
Client:
Workflow:
Who submits:
Who approves:
Approval levels:
Business state affected:
Special rules:

## Use Case 2
Module:
Client:
Workflow:
Who submits:
Who approves:
Approval levels:
Business state affected:
Special rules:

## Use Case 3
Module:
Client:
Workflow:
Who submits:
Who approves:
Approval levels:
Business state affected:
Special rules:

## Similarities

## Differences

## Recommendation
Keep module-local / Promote to Platform Service

## Risks

## ADR Required
Yes / No
```

Implementation cannot start until the evidence log shows a common lifecycle worth extracting.

---

# 7. What Approval Workflow Service Is

The future Approval Workflow Service is responsible for managing reusable approval lifecycle mechanics.

It may eventually handle:

```txt
Approval request creation
Approval step assignment
Approval status transitions
Approver resolution
Approval actions
Rejection actions
Cancellation
Delegation
Escalation
Comments or reason capture
Approval event emission
Approval history
```

It should provide shared workflow infrastructure, but not own the module’s business meaning.

Example:

```txt
Leave Module owns leave balance and leave request business rules.
Approval Workflow Service owns the generic approval lifecycle.
```

---

# 8. What Approval Workflow Service Is Not

The Approval Workflow Service is not:

```txt
The Event Bus
A generic Workflow Engine
A BPMN engine
A no-code workflow builder
A rule engine
A permissions engine
A notification engine
An audit log engine
A comments engine
A task management module
A module-to-module communication shortcut
A replacement for module business logic
```

Do not use the Approval Workflow Service to hide unclear domain modeling.

---

# 9. Layer Classification

Approval Workflow Service belongs to:

```txt
Platform Services
```

It does not belong to:

```txt
Kernel
Business Objects
Business Modules
Client Configuration
```

Reason:

```txt
Approvals are not required by every module.
Approvals are not shared business entities like Employee or Product.
Approvals are cross-cutting reusable workflow capability.
Approvals should be promoted only after repeated use cases prove the need.
```

---

# 10. Relationship to Kernel Permissions

Approval Workflow Service must not replace Kernel authorization.

Kernel permissions answer:

```txt
Is this user allowed to perform this platform action?
```

Approval Workflow answers:

```txt
Has this business request completed the required approval lifecycle?
```

These are different.

Example:

```txt
A manager may have permission to approve leave.
But that does not mean they are the assigned approver for every leave request.
```

Both checks are needed.

---

# 11. Future Permission Model

The future Approval Workflow Service may define platform-level permissions such as:

```txt
platform.approvals.read
platform.approvals.admin
platform.approvals.delegate
```

But module approval actions should remain module-specific where appropriate.

Examples:

```txt
leave.request.approve
purchasing.purchase_request.approve
expenses.expense_claim.approve
inventory.stock_adjustment.approve
```

Reason:

```txt
Approving a leave request is not the same business authority as approving a purchase request.
```

A user who can approve leave should not automatically approve purchases.

---

# 12. Approval Authority vs Platform Permission

Approval requires two things:

```txt
1. Platform permission
2. Workflow assignment
```

Example:

```txt
User has leave.request.approve permission
+ user is assigned approver for this request
= user may approve
```

If either fails, approval is denied.

Bad pattern:

```ts
if (await sdk.permissions.can(ctx, { module: 'leave', resource: 'request', action: 'approve' })) {
  approveRequest()
}
```

This is incomplete because it ignores workflow assignment.

Better future pattern:

```ts
await sdk.permissions.require(ctx, {
  module: 'leave',
  resource: 'request',
  action: 'approve',
})

await sdk.approvals.requireAssignedApprover(ctx, approvalRequestId)

await sdk.approvals.approve(ctx, approvalRequestId, input)
```

---

# 13. Tenant Isolation Requirements

The Approval Workflow Service must be tenant-scoped.

Every approval request must belong to exactly one organization.

Approval operations must use verified `PlatformContext`.

Required:

```ts
sdk.approvals.create(ctx, input)
sdk.approvals.approve(ctx, approvalRequestId, input)
sdk.approvals.reject(ctx, approvalRequestId, input)
sdk.approvals.cancel(ctx, approvalRequestId, input)
```

Forbidden:

```ts
sdk.approvals.create(orgId, input)
sdk.approvals.approve(userId, orgId, approvalRequestId)
```

Client-supplied `orgId` is forbidden.

---

# 14. Future PlatformContext Requirement

Every Approval Workflow Service operation must receive verified `PlatformContext`.

Required context properties:

```ts
type PlatformContext = {
  authUserId: string
  userId: string
  org: {
    id: string
    slug: string
    name: string
  }
  permissions: PermissionGrant[]
  enabledModules: string[]
}
```

The service must never re-derive tenant identity from request body.

---

# 15. Approval Request Concept

A future approval request represents the reusable approval lifecycle around a module-owned business record.

Conceptual shape:

```ts
type ApprovalRequest = {
  id: string
  orgId: string

  sourceModule: string
  sourceEntity: string
  sourceId: string

  status: ApprovalStatus
  submittedById: string
  submittedAt: Date

  currentStepId?: string
  completedAt?: Date
  cancelledAt?: Date

  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}
```

The approval request points to the module record, but does not replace it.

Example:

```txt
ApprovalRequest
  sourceModule = leave
  sourceEntity = request
  sourceId = leave_request_123
```

---

# 16. Approval Statuses

Future approval statuses should likely be:

```txt
draft
submitted
pending
approved
rejected
cancelled
withdrawn
```

Potential meaning:

| Status | Meaning |
|---|---|
| `draft` | Approval request exists but has not been submitted. |
| `submitted` | Request was submitted and workflow resolution is starting. |
| `pending` | Waiting for one or more approvers. |
| `approved` | Approval lifecycle completed successfully. |
| `rejected` | Request was rejected by an approver. |
| `cancelled` | Request was cancelled by the system or authorized admin. |
| `withdrawn` | Submitter withdrew the request before completion. |

The final implementation may simplify this if real use cases do not need all statuses.

---

# 17. Approval Steps

A future approval step represents one stage in the approval lifecycle.

Conceptual shape:

```ts
type ApprovalStep = {
  id: string
  orgId: string
  approvalRequestId: string

  stepNumber: number
  label: string
  status: ApprovalStepStatus

  assignedApproverUserId?: string
  assignedApproverRoleId?: string

  decidedById?: string
  decidedAt?: Date
  decision?: ApprovalDecision
  reason?: string
}
```

Possible step statuses:

```txt
waiting
active
approved
rejected
skipped
cancelled
```

---

# 18. Approval Decisions

Approval decisions should be explicit.

Possible decisions:

```txt
approve
reject
request_changes
cancel
withdraw
```

For MVP of the future service, only these may be needed:

```txt
approve
reject
cancel
withdraw
```

`request_changes` should be deferred unless real modules need it.

---

# 19. Source Module Relationship

Approval Workflow Service must not import module internals.

Bad:

```ts
import { LeaveService } from '@/modules/leave/service'
```

Good:

```txt
Approval Service emits approval.approval_request.approved
Leave Module listens and updates leave request status
```

or, if the module initiates the operation:

```txt
Leave Module calls sdk.approvals.approve(...)
Then Leave Module updates its own record after successful approval
```

The final integration pattern should be decided during implementation proposal.

---

# 20. Business State vs Approval State

Approval state and business state are related but not identical.

Example:

```txt
LeaveRequest.status = approved
ApprovalRequest.status = approved
```

These may look redundant, but they serve different purposes:

```txt
LeaveRequest.status = module business state
ApprovalRequest.status = generic approval lifecycle state
```

The Approval Workflow Service should not own the module record’s final business state.

Modules own their own business state transitions.

---

# 21. Future Integration Pattern Options

There are two possible safe integration patterns.

## Option A — Module-owned transition after approval service result

```ts
const approval = await sdk.approvals.approve(ctx, approvalRequestId, input)

await LeaveService.markApprovedAfterApproval(ctx, leaveRequestId, approval)
```

Pros:

```txt
Explicit
Easy to reason about
Module owns business state
```

Cons:

```txt
Caller must remember second step
Transaction boundaries may be harder
```

## Option B — Event-driven module reaction

```txt
Approval Service emits platform.approval_request.approved
Leave Module listener updates LeaveRequest.status
```

Pros:

```txt
Decoupled
Consistent with Event Bus
```

Cons:

```txt
Listener failure can desync business state
Harder to guarantee correctness
```

## Recommended future default

For correctness-critical state changes, prefer **Option A** or a transaction-aware service orchestration.

Events are good for secondary effects.

Events are not good for required business correctness unless a durable outbox/background job system exists.

---

# 22. Future Data Model Direction

Do not implement this now.

Possible future Prisma models:

```prisma
model ApprovalRequest {
  id           String   @id @default(cuid())
  orgId        String

  sourceModule String
  sourceEntity String
  sourceId     String

  status       String
  submittedById String
  submittedAt DateTime?

  currentStepId String?
  completedAt DateTime?
  cancelledAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  deletedBy String?

  org Organization @relation(fields: [orgId], references: [id])
  steps ApprovalStep[]

  @@index([orgId, sourceModule, sourceEntity, sourceId])
  @@index([orgId, status])
  @@map("approval_requests")
}

model ApprovalStep {
  id String @id @default(cuid())
  orgId String
  approvalRequestId String

  stepNumber Int
  label String
  status String

  assignedApproverUserId String?
  assignedApproverRoleId String?

  decidedById String?
  decidedAt DateTime?
  decision String?
  reason String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  approvalRequest ApprovalRequest @relation(fields: [approvalRequestId], references: [id])

  @@unique([approvalRequestId, stepNumber])
  @@index([orgId, assignedApproverUserId, status])
  @@index([orgId, assignedApproverRoleId, status])
  @@map("approval_steps")
}
```

This is illustrative only.

Final schema requires real evidence from modules.

---

# 23. Why Not Store Module Record Foreign Keys Directly?

The generic Approval Workflow Service cannot have direct foreign keys to every module-owned table.

Bad pattern:

```prisma
model ApprovalRequest {
  leaveRequestId String?
  purchaseRequestId String?
  expenseClaimId String?
  stockAdjustmentId String?
}
```

This creates coupling and schema bloat.

Better pattern:

```txt
sourceModule
sourceEntity
sourceId
```

This avoids direct dependencies.

However, this also means module services must verify source records using their own tenant-scoped services.

---

# 24. Future Workflow Definition

The future service may need workflow definitions.

Possible conceptual shape:

```ts
type ApprovalWorkflowDefinition = {
  id: string
  orgId: string
  module: string
  entity: string
  name: string
  isActive: boolean
  steps: ApprovalWorkflowStepDefinition[]
}

type ApprovalWorkflowStepDefinition = {
  stepNumber: number
  label: string
  approverType: 'user' | 'role' | 'manager' | 'submitter_manager'
  approverId?: string
  requiredDecision: 'any_one' | 'all'
}
```

This should not be implemented yet.

Hardcoded module-local approval flows are acceptable before the Platform Service is promoted.

---

# 25. Deferred Complexity

The following approval features are explicitly deferred:

```txt
Drag-and-drop workflow builder
Condition-based approval rules
Amount thresholds
Branch-scoped approvals
Department-scoped approvals
Parallel approvals
Sequential approvals beyond simple steps
Delegation
Escalation
Approval SLAs
Auto-approval rules
Approval templates
Approval analytics
Approval email notifications
Approval reminders
Mobile approval inbox
External approvers
Customer/vendor approvals
Digital signatures
BPMN support
```

Some of these may become valuable later.

They must not be built in the first implementation.

---

# 26. Module-Local Approval Guidance Before Platform Service

Before the Approval Workflow Service exists, modules may implement simple module-local approval logic.

Example for Leave:

```txt
LeaveRequest.status:
  draft
  submitted
  approved
  rejected
  cancelled

LeaveRequest.approvedById
LeaveRequest.approvedAt
LeaveRequest.rejectionReason
```

Example for Expenses:

```txt
ExpenseClaim.status:
  draft
  submitted
  approved
  rejected
  paid

ExpenseClaim.approvedById
ExpenseClaim.approvedAt
ExpenseClaim.rejectionReason
```

This duplication is acceptable early.

Why?

```txt
It helps reveal real patterns.
It avoids premature abstraction.
It keeps first modules simple.
It gives evidence for future extraction.
```

But module-local approval logic must still follow platform rules:

```txt
Use PlatformContext.
Reject client-supplied orgId.
Enforce permissions.
Emit events.
Test tenant isolation.
Test permission denial.
```

---

# 27. When Module-Local Approval Becomes Technical Debt

Module-local approval becomes technical debt when:

```txt
Three independent modules implement nearly identical approval states.
Three independent modules need approval inbox UI.
Three independent modules need approver assignment.
Three independent modules need approval history.
Three independent modules need notification/reminder hooks.
Three independent modules need delegation/escalation.
```

At that point, write the evidence log and propose Platform Service promotion.

---

# 28. Future SDK Shape

Do not implement now.

Potential future SDK shape:

```ts
sdk.approvals.create(ctx, input)
sdk.approvals.submit(ctx, approvalRequestId)
sdk.approvals.approve(ctx, approvalRequestId, input)
sdk.approvals.reject(ctx, approvalRequestId, input)
sdk.approvals.cancel(ctx, approvalRequestId, input)
sdk.approvals.withdraw(ctx, approvalRequestId, input)
sdk.approvals.listPendingForUser(ctx, filters)
sdk.approvals.getForSource(ctx, source)
sdk.approvals.requireAssignedApprover(ctx, approvalRequestId)
```

Potential input shape:

```ts
type CreateApprovalRequestInput = {
  sourceModule: string
  sourceEntity: string
  sourceId: string
  workflowKey?: string
  title: string
  summary?: string
}
```

Forbidden:

```ts
type CreateApprovalRequestInput = {
  orgId: string
  sourceModule: string
  sourceEntity: string
  sourceId: string
}
```

`orgId` comes from `ctx`, never input.

---

# 29. Future API Shape

Do not implement now.

Potential future routes:

```txt
GET    /api/orgs/[orgSlug]/platform/approvals/pending
GET    /api/orgs/[orgSlug]/platform/approvals/[id]
POST   /api/orgs/[orgSlug]/platform/approvals
POST   /api/orgs/[orgSlug]/platform/approvals/[id]/submit
POST   /api/orgs/[orgSlug]/platform/approvals/[id]/approve
POST   /api/orgs/[orgSlug]/platform/approvals/[id]/reject
POST   /api/orgs/[orgSlug]/platform/approvals/[id]/cancel
```

All routes must:

```txt
Return JSON only.
Use Kernel API contract.
Use API-safe auth helpers.
Create verified PlatformContext.
Reject client-supplied orgId.
Validate inputs with Zod.
Enforce permissions.
Verify workflow assignment.
Call SDK/service with PlatformContext.
```

---

# 30. Future UI Shape

Do not implement now.

Possible future UI:

```txt
My Approvals inbox
Approval request detail page
Approval history panel
Approve/reject dialog
Reason required on rejection
Approval status badge
Approval timeline
Admin workflow configuration page
```

UI must not become security.

Approving buttons may be hidden in UI, but APIs and services must enforce:

```txt
Permission
Tenant membership
Module enablement
Assigned approver relationship
Workflow status
```

---

# 31. Future Event Contracts

Do not implement now.

Potential future event names:

```txt
platform.approval_request.created
platform.approval_request.submitted
platform.approval_request.approved
platform.approval_request.rejected
platform.approval_request.cancelled
platform.approval_request.withdrawn
platform.approval_step.activated
platform.approval_step.approved
platform.approval_step.rejected
```

These follow:

```txt
{namespace}.{entity}.{past_tense_verb}
```

The namespace is `platform` because Approval Workflow Service is a Platform Service.

Rejected event names:

```txt
approval.request.approve
approvalRequestApproved
send.approval.notification
notify.approver
workflow.done
```

Events are facts, not commands.

---

# 32. Event Payload Rules

Future approval events must:

```txt
Use EventEnvelope.
Be emitted through @/sdk/server.
Use verified PlatformContext.
Exclude orgId from payload.
Exclude full Prisma records.
Include stable IDs.
Include source reference.
Avoid sensitive data.
```

Example conceptual payload:

```ts
type ApprovalRequestApprovedPayload = {
  approvalRequestId: string
  sourceModule: string
  sourceEntity: string
  sourceId: string
  approvedById: string
  completedAt: string
}
```

Do not include:

```txt
Full leave request
Full expense claim
Employee salary
Customer private data
Supplier bank details
```

---

# 33. Relationship to Notification Service

Approval Workflow Service should not send notifications directly.

Bad:

```ts
await emailProvider.send(...)
```

Better future pattern:

```txt
Approval Workflow Service emits platform.approval_request.submitted
Notification Service consumes event and creates notification
```

But Notification Service is also deferred.

Before Notification Service exists, modules may use simple module-local notification behavior if required, but it must be documented as temporary.

---

# 34. Relationship to Audit Log Service

Approval events should make future audit logging easy.

Approval Workflow Service should emit stable events.

Audit Log Service may later consume:

```txt
platform.approval_request.created
platform.approval_request.approved
platform.approval_request.rejected
```

But Approval Workflow Service should not write audit log records directly unless future architecture decides otherwise.

---

# 35. Relationship to Comments Service

Approval rejection reasons are not the same as comments.

Future approval records may store:

```txt
Decision reason
Rejection reason
Cancellation reason
```

A future Comments Service may support discussion threads.

Do not build Comments Service just because approvals may eventually need comments.

---

# 36. Relationship to Activity Feed

Approval activity may later appear in an Activity Feed.

But Activity Feed is a separate deferred Platform Service.

Approval Workflow Service should emit events and maintain its own lifecycle records.

Activity Feed may consume events later.

---

# 37. Relationship to Business Objects

Approval Workflow Service should not own Business Objects.

Example:

```txt
Employee may be the submitter.
Employee may be the subject of a leave request.
User may be the approver.
Product may be related to an inventory adjustment.
Supplier may be related to a purchase request.
```

Approval Workflow Service should reference users and source records, but should not create duplicate Employee, Product, Supplier, Customer, or Warehouse records.

---

# 38. Relationship to Module Dependencies

A module using approval workflows should not depend directly on another module.

Example:

```txt
Expenses uses Approval Workflow Service.
Purchasing uses Approval Workflow Service.
Leave uses Approval Workflow Service.
```

This does not mean these modules depend on each other.

They share a Platform Service through the SDK.

---

# 39. Service Boundary Rules

Future Approval Workflow Service internals may live under something like:

```txt
src/platform-services/approvals/
```

or another approved platform services folder.

Modules must not import from there directly.

Allowed:

```ts
import { sdk } from '@/sdk/server'
await sdk.approvals.approve(ctx, id, input)
```

Forbidden:

```ts
import { ApprovalWorkflowService } from '@/platform-services/approvals/service'
```

The SDK is the public boundary.

---

# 40. API Error Behavior

Future approval APIs must use the Kernel API contract.

Examples:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to approve this request."
  }
}
```

```json
{
  "data": null,
  "error": {
    "code": "APPROVAL_NOT_ASSIGNED",
    "message": "You are not assigned to approve this request."
  }
}
```

```json
{
  "data": null,
  "error": {
    "code": "INVALID_APPROVAL_STATE",
    "message": "This request cannot be approved in its current state."
  }
}
```

No redirects.

No HTML auth responses.

No unhandled stack traces.

---

# 41. Future Error Codes

Possible future error codes:

```txt
APPROVAL_NOT_FOUND
APPROVAL_NOT_ASSIGNED
APPROVAL_ALREADY_COMPLETED
APPROVAL_ALREADY_REJECTED
APPROVAL_CANCELLED
INVALID_APPROVAL_STATE
INVALID_APPROVAL_WORKFLOW
NO_ACTIVE_APPROVAL_STEP
APPROVER_NOT_FOUND
APPROVAL_SOURCE_NOT_FOUND
```

These are examples, not final implementation.

---

# 42. Soft Delete and Archival

Future approval records should normally be retained.

Approvals are history-sensitive.

Hard delete should be forbidden for normal approval records.

Use:

```txt
deletedAt
deletedBy
```

But in many cases, approval records may be better treated as immutable historical records rather than deleted.

Final deletion/retention policy must align with:

```txt
Audit requirements
AppCare support
Client data retention
Privacy rules
Storage cost
```

---

# 43. Immutability Expectations

Approval decisions should be mostly immutable.

Bad pattern:

```txt
Admin edits old approval decision from rejected to approved.
```

Better pattern:

```txt
Admin cancels/voids prior approval lifecycle.
New approval lifecycle is created or request is resubmitted.
```

A future implementation should preserve decision history.

---

# 44. Concurrency Requirements

Approvals are concurrency-sensitive.

Future implementation must prevent:

```txt
Two approvers approving the same active step at the same time.
Approving an already rejected request.
Rejecting an already approved request.
Submitting a request twice.
Cancelling while approval is completing.
```

Future service methods should use transactions where needed.

Possible approaches:

```txt
Database transactions
State checks inside transaction
Optimistic concurrency using updatedAt/version
Unique active-step constraints
```

Do not design this casually.

---

# 45. Testing Requirements for Future Implementation

Future Approval Workflow Service tests must include:

```txt
Two-organization tenant isolation tests
Unauthenticated API returns 401 JSON
Unauthorized user returns 403 JSON
Wrong-org access returns safe 404
Client-supplied orgId is rejected
User with permission but not assigned approver is denied
Assigned approver without permission is denied
Assigned approver with permission can approve
Cannot approve rejected request
Cannot reject approved request
Cannot approve twice
Events emitted after successful transitions
Events not emitted after failed transitions
Module business state remains correct
Soft delete/archival behavior works
```

Admin-only tests are insufficient.

Single-org tests are insufficient.

---

# 46. Module-Local Approval Tests Before Platform Service

Before the Platform Service exists, any module-local approval implementation must still include:

```txt
Tenant isolation tests
Permission-denial tests
Wrong-org tests
Module-disabled tests
Validation tests
State transition tests
Event emission tests
Client-supplied orgId rejection tests
```

This ensures future extraction has reliable source behavior.

---

# 47. Generator Rules

The module generator must not generate Approval Workflow Service integration by default.

Forbidden generated code:

```ts
sdk.approvals.create(...)
```

unless the service is implemented and the module explicitly requests it.

For now, generated modules may include comments like:

```txt
If this module needs approvals, implement simple module-local approval state first.
Do not create a generic approval engine.
```

Do not add approval tables, approval SDK calls, or approval UI into generated modules automatically.

---

# 48. AI Layer Considerations

Future AI support may help users answer:

```txt
Which approvals are pending?
Who approved this request?
Why was this rejected?
Which requests are overdue?
```

But AI must not bypass permissions.

AI approval actions must require explicit confirmation.

AI should never approve or reject without a verified user action.

Potential future rule:

```txt
AI may draft approval comments.
AI may summarize approval history.
AI may suggest next action.
AI may not silently approve/reject.
```

---

# 49. Reporting Considerations

Future reporting may include:

```txt
Pending approvals
Average approval time
Approvals by approver
Rejected requests
Bottlenecks by step
Overdue approvals
```

Reporting Service is separate and deferred.

Approval data should be structured enough to support reporting later.

---

# 50. Operational Considerations

Future Approval Workflow Service may become critical to customer operations.

If it is implemented, AppCare must consider:

```txt
Stuck approvals
Wrong approver assignment
Approval email/notification delays
Historical approval disputes
Data correction requests
Permission misconfiguration
```

Support tooling may eventually be needed.

Do not implement support tooling in MVP.

---

# 51. Security Considerations

Approval systems are sensitive because they authorize business decisions.

Security requirements:

```txt
No tenant leakage
No client-supplied orgId
No approval through UI-only checks
No permission bypass
No assignment bypass
No mutable historical decisions without trace
No full sensitive record payloads in events
No hidden module-to-module imports
No raw Prisma inside modules
```

Approval actions must be auditable later.

---

# 52. Anti-Patterns

## Anti-pattern 1 — Building Approval Engine too early

Bad:

```txt
Build generic approval engine before Leave, Purchasing, and Expenses exist.
```

Why bad:

```txt
No real evidence.
Likely wrong abstraction.
Slows foundation build.
Creates surface area Claude may misuse.
```

## Anti-pattern 2 — Approval Service owns module status

Bad:

```txt
Approval Service directly updates LeaveRequest.status.
```

Why bad:

```txt
Platform Service imports module logic.
Business state ownership becomes unclear.
```

## Anti-pattern 3 — Permission equals assignment

Bad:

```txt
Anyone with approve permission can approve every request.
```

Why bad:

```txt
Approver assignment is separate from permission.
```

## Anti-pattern 4 — Events as commands

Bad:

```txt
approval.send_to_manager
approval.notify_user
approval.do_next_step
```

Why bad:

```txt
Events should describe facts, not commands.
```

## Anti-pattern 5 — Generic workflow engine

Bad:

```txt
Build arbitrary workflow graph engine with conditions, loops, branches, and scripts.
```

Why bad:

```txt
Massive overengineering.
Hard to test.
Dangerous for one-day delivery.
```

---

# 53. Minimal Future V1 Scope

If the service is approved later, the first implementation should be very small.

Possible future V1 scope:

```txt
Single organization-scoped approval request table
Single approval step table
Sequential approval only
User or role approver assignment only
Approve/reject/cancel/withdraw
Pending approvals list
Events on transitions
No workflow builder
No complex conditions
No escalation
No delegation
No notifications except events
```

This should be enough to support common first workflows without becoming a workflow platform.

---

# 54. Future Promotion Checklist

Before implementing Approval Workflow Service:

```txt
[ ] Evidence log contains three independent use cases.
[ ] Similar lifecycle is proven across those use cases.
[ ] Module-local implementations have been reviewed.
[ ] Approval Service proposal is written.
[ ] ADR is approved.
[ ] Data model is reviewed.
[ ] SDK API is reviewed.
[ ] Event contracts are reviewed.
[ ] Permission model is reviewed.
[ ] Migration strategy is reviewed.
[ ] Tenant isolation test plan exists.
[ ] Permission-denial test plan exists.
[ ] UI scope is intentionally minimal.
[ ] Notifications remain decoupled.
[ ] Audit remains decoupled.
```

---

# 55. Claude Implementation Rules

Claude must obey these rules:

```txt
Do not implement Approval Workflow Service now.
Do not create approval tables.
Do not create approval SDK APIs.
Do not create approval UI.
Do not add approval integration to generated modules by default.
Do not create a generic Workflow Engine.
Do not create a workflow builder.
Do not add FastAPI, Python, Celery, Alembic, or SQLAlchemy for approvals.
Do not import modules from platform services.
Do not import platform service internals from modules.
Do not accept client-supplied orgId.
Do not bypass PlatformContext.
```

If asked to implement approvals before the service is approved, Claude should implement module-local approval behavior inside the relevant module and mark it as an extraction candidate if appropriate.

---

# 56. FastAPI Decision

FastAPI must not be used for the Approval Workflow Service in the core platform.

Reason:

```txt
Approvals are tightly coupled to OneDayOS tenancy, permissions, SDK, events, and module state.
Adding FastAPI would create a second backend security surface for no justified benefit.
```

Future specialized Python services may be considered only through ADR for narrow use cases such as AI/RAG or document processing.

Approvals do not qualify.

---

# 57. Acceptance Criteria for This Document

This document is acceptable if:

```txt
[ ] It clearly marks Approval Workflow Service as deferred.
[ ] It defines when approval logic should remain module-local.
[ ] It defines when promotion becomes justified.
[ ] It explains approval permission vs workflow assignment.
[ ] It protects tenant isolation through PlatformContext.
[ ] It prevents client-supplied orgId.
[ ] It prevents generic workflow overengineering.
[ ] It defines future event naming direction.
[ ] It defines future SDK/API direction without allowing implementation.
[ ] It gives Claude clear no-build instructions.
```

---

# 58. Final Architectural Position

The Approval Workflow Service is likely to become important for OneDayOS.

But it should not be part of the restarted foundation build.

The correct near-term approach is:

```txt
Build secure Kernel.
Build SDK.
Build Business Objects.
Build Module System.
Build first modules.
Allow simple module-local approval logic when needed.
Collect evidence.
Promote only after repeated use cases prove the abstraction.
```

Approvals should become a Platform Service only when the platform has earned the abstraction.

