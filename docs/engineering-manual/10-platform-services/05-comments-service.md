# OneDayOS Engineering Manual — 10 Platform Services / 05 Comments Service

**Document ID:** `10-platform-services/05-comments-service.md`  
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
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/06-module-events.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`
- `10-platform-services/02-audit-log-service.md`
- `10-platform-services/03-notification-service.md`
- `10-platform-services/04-approval-workflow-service.md`

---

# 1. Purpose

This document defines the future **Comments Service** for OneDayOS.

The Comments Service is the reusable Platform Service that may eventually support threaded human discussion on records across multiple independent modules and Business Objects.

Examples:

```txt
Comment on a leave request
Comment on a purchase request
Comment on an expense claim
Comment on an incident report
Comment on an asset record
Comment on a customer record
Comment on a project task
```

However, this document is **not** permission to implement comments now.

The Comments Service is intentionally deferred until repeated record-level discussion patterns prove the need for a shared service.

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

The Comments Service should be designed now so Claude and future engineers do not invent incompatible comment patterns inside each module later.

---

# 2. Implementation Status

```txt
Implementation Status: Deferred — Contract Only
```

This means:

```txt
Allowed now:
- Document comment terminology.
- Document future data model direction.
- Document future SDK shape.
- Document future event names.
- Document module-local guidance.
- Document promotion criteria.

Not allowed now:
- Creating comment database tables.
- Creating comment SDK APIs.
- Creating comment UI components.
- Creating comment API route handlers.
- Adding comments into the module generator.
- Adding comments into Business Object APIs.
- Adding mentions.
- Adding notification behavior.
- Adding real-time comment subscriptions.
```

Claude must not implement the Comments Service from this document alone.

Implementation requires a future approved document with status:

```txt
Status: Frozen
Implementation Status: Approved for Implementation
```

and likely an ADR if comments become broadly reusable.

---

# 3. Core Principle

```txt
Comments are collaboration around records.
They are not business state.
```

A comment may explain why a user took an action, ask a question, or add context.

A comment must not replace module-owned business fields, approval state, audit logs, or workflow transitions.

Bad example:

```txt
Purchase Request status = pending
Comment says: "Approved by Maria"
```

This is wrong because the actual business state did not change.

Better example:

```txt
Purchase Request status = approved
Approval event emitted
Optional comment says: "Approved because supplier confirmed stock availability."
```

Comments add context. They do not define the source of truth.

---

# 4. Why Comments Service Is Deferred

Comments feel universally useful, but implementing them too early creates architectural drag.

A premature Comments Service can create problems:

```txt
Every module suddenly has comment UI before users need it.
Comment permissions become unclear.
Comments become a substitute for workflow state.
Mentions imply notifications before Notification Service exists.
Attachments imply Attachment Service before it exists.
Threads imply Activity Feed before it exists.
Real-time comments imply infrastructure before value is proven.
```

For OneDayOS, the correct sequence is:

```txt
1. Build secure platform foundation.
2. Build first modules without comments unless clearly needed.
3. If one module needs record notes, keep it module-local.
4. Observe repeated comment/discussion patterns.
5. Record evidence.
6. Write Comments Service implementation proposal.
7. Approve ADR if needed.
8. Extract common comment mechanics into Platform Service.
```

---

# 5. Three Independent Use Cases Requirement

The Comments Service must not be implemented until at least three independent comment use cases exist.

Examples that may count:

```txt
Use Case 1: Users discuss leave requests before approval.
Use Case 2: Users discuss purchase requests before procurement.
Use Case 3: Users discuss incident reports during investigation.
```

or:

```txt
Use Case 1: Sales team comments on customer records.
Use Case 2: Asset team comments on asset maintenance records.
Use Case 3: Project team comments on project deliverables.
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
Comment on pending leave request
Comment on approved leave request
Comment on rejected leave request
```

Those are variants of one Leave comment workflow.

---

# 6. Evidence Log Requirement

Before implementation, create an evidence log.

Template:

```md
# Comments Service Evidence Log

## Candidate Service
Comments Service

## Use Case 1
Module:
Client:
Entity being commented on:
Who comments:
Who reads:
Is threading needed:
Are mentions needed:
Are attachments needed:
Is this business state or context:

## Use Case 2
Module:
Client:
Entity being commented on:
Who comments:
Who reads:
Is threading needed:
Are mentions needed:
Are attachments needed:
Is this business state or context:

## Use Case 3
Module:
Client:
Entity being commented on:
Who comments:
Who reads:
Is threading needed:
Are mentions needed:
Are attachments needed:
Is this business state or context:

## Similarities

## Differences

## Recommendation
Keep module-local / Promote to Platform Service

## Risks

## ADR Required
Yes / No
```

Implementation cannot start until the evidence log shows a common collaboration pattern worth extracting.

---

# 7. What Comments Service Is

The future Comments Service is responsible for reusable record-level discussion mechanics.

It may eventually handle:

```txt
Comment thread creation
Comment creation
Comment editing
Comment soft deletion
Comment restoration by admin
Thread resolution
Comment visibility checks
Comment event emission
Mention parsing, future
Attachment linking, future
Activity feed integration, future
Notification integration, future
```

The service owns collaboration mechanics.

It does **not** own the module’s business meaning.

Example:

```txt
Incident Reporting Module owns incident status, severity, assigned investigator, and resolution.
Comments Service owns discussion around the incident record.
```

---

# 8. What Comments Service Is Not

The Comments Service is not:

```txt
The Event Bus
The Audit Log Service
The Notification Service
The Activity Feed Service
The Attachment Service
The Approval Workflow Service
A chat system
A helpdesk ticketing system
A task management module
A business workflow engine
A replacement for business state
A replacement for audit history
A replacement for approval reasons
A module-to-module communication shortcut
```

Do not use comments to avoid proper domain modeling.

---

# 9. Layer Classification

Comments Service belongs to:

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
Comments are not required by every module.
Comments are not shared business entities like Employee or Product.
Comments are cross-cutting collaboration capability.
Comments should be promoted only after repeated use cases prove the need.
```

---

# 10. Module-Local Notes Before Comments Service Exists

Before Comments Service exists, a module may implement a simple module-local note field if needed.

Allowed example:

```txt
IncidentReport.internalNotes
```

or:

```txt
PurchaseRequest.reason
```

or:

```txt
LeaveRequest.employeeRemarks
```

These are not Comments Service.

They are module-owned fields with module-specific business meaning.

Do not build a mini Comments Service inside one module unless the evidence log supports promotion.

Forbidden early pattern:

```txt
src/modules/incidents/comments.ts
src/modules/purchasing/comments.ts
src/modules/leave/comments.ts
```

If three modules start building similar comment tables, stop and write the evidence log.

---

# 11. Comments vs Notes

OneDayOS should distinguish comments from notes.

```txt
Note = usually a field on a business record.
Comment = usually a separate discussion entry attached to a record.
```

Examples of notes:

```txt
Leave request reason
Purchase request justification
Incident initial report
Asset maintenance note
Customer internal note
```

Examples of comments:

```txt
"Can you confirm the dates?"
"Supplier changed delivery estimate."
"I checked CCTV and attached the finding."
"Please review before we approve."
```

A note can be module-local.

A comment is a reusable collaboration pattern only after repeated need is proven.

---

# 12. Comments vs Audit Logs

Comments are written by users for collaboration.

Audit logs are generated by the system to record what happened.

Example comment:

```txt
"I updated the quantity because the physical count was wrong."
```

Example audit entry:

```txt
User Maria updated StockAdjustment.quantity from 10 to 12.
```

Do not use comments as audit logs.

Do not use audit logs as comments.

Future relationship:

```txt
Comment created
→ platform.comment.created event
→ Audit Log Service may record that a comment was created
→ Activity Feed Service may show it
→ Notification Service may notify mentioned users
```

But these are separate services.

---

# 13. Comments vs Activity Feed

Comments are user-authored discussion entries.

Activity Feed is a chronological stream of events.

A future Activity Feed may include comments, but comments are not the whole feed.

Example Activity Feed items:

```txt
Product created
Stock adjusted
Comment added
Approval requested
Approval completed
Attachment uploaded
```

The Comments Service should emit events. The future Activity Feed Service may consume them.

---

# 14. Comments vs Notifications

Comments do not automatically mean notifications.

The first future Comments Service implementation should not send emails, SMS, or push notifications directly.

Instead:

```txt
Comment created
→ platform.comment.created event emitted
→ Notification Service may eventually listen if enabled
```

Mentions are deferred because mentions imply notification semantics.

Do not build:

```txt
@mentions
email alerts
push alerts
real-time unread badges
```

until Notification Service exists or the implementation proposal explicitly includes a narrow version.

---

# 15. Comments vs Attachments

A comment may eventually link to attachments, but the Comments Service should not own file storage.

Future relationship:

```txt
Attachment Service owns uploaded files.
Comments Service may reference attachment IDs.
```

Do not implement:

```txt
comment file upload
comment image paste
comment attachment previews
```

until Attachment Service exists or an approved future proposal defines the dependency.

---

# 16. Future Entity Reference Model

The Comments Service needs a way to attach comments to any commentable record.

Preferred future conceptual reference:

```ts
type CommentTarget = {
  orgId: string
  targetType: 'business_object' | 'module_record' | 'platform_record'
  targetNamespace: string
  targetEntity: string
  targetId: string
}
```

Examples:

```txt
Business Object Product:
targetType: business_object
targetNamespace: objects
targetEntity: product
targetId: product_id

Inventory Stock Adjustment:
targetType: module_record
targetNamespace: inventory
targetEntity: stock_adjustment
targetId: stock_adjustment_id

Leave Request:
targetType: module_record
targetNamespace: leave
targetEntity: request
targetId: leave_request_id
```

This avoids direct foreign keys to every possible table.

However, it also means the service must rely on target validation hooks or module-provided resolvers to verify that the target exists and is visible to the current user.

This design must be finalized only during the future implementation proposal.

---

# 17. Future Data Model Direction

A future MVP Comments Service may use two tables:

```txt
CommentThread
Comment
```

Conceptual shape:

```ts
type CommentThread = {
  id: string
  orgId: string

  targetType: string
  targetNamespace: string
  targetEntity: string
  targetId: string

  status: 'open' | 'resolved'
  createdById: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  resolvedById?: string

  deletedAt?: Date
  deletedBy?: string
}
```

```ts
type Comment = {
  id: string
  orgId: string
  threadId: string

  body: string
  bodyFormat: 'plain_text'
  authorUserId: string

  editedAt?: Date
  editedById?: string

  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}
```

MVP should use plain text only.

Do not implement rich text, Markdown, HTML, embedded media, reactions, or threaded replies until proven necessary.

---

# 18. Threading Decision

The first future implementation should be conservative.

Recommended future MVP:

```txt
One comment thread per target record.
Flat chronological comments inside the thread.
```

Not recommended for first implementation:

```txt
Nested replies
Multiple threads per target record
Comment reactions
Comment pinning
Resolved subthreads
```

Reason:

```txt
Most Philippine SME internal workflows need simple record discussion first.
Full collaboration-suite behavior is overkill early.
```

---

# 19. Tenant Isolation Requirements

Comments must be tenant-scoped.

Every comment thread and comment must belong to exactly one organization.

All operations must use verified `PlatformContext`.

Required future pattern:

```ts
sdk.comments.listForTarget(ctx, target)
sdk.comments.create(ctx, input)
sdk.comments.update(ctx, commentId, input)
sdk.comments.delete(ctx, commentId)
sdk.comments.resolveThread(ctx, threadId)
```

Forbidden future pattern:

```ts
sdk.comments.create(orgId, input)
sdk.comments.listForTarget(userId, orgId, target)
```

Client-supplied `orgId` is forbidden.

Every read and mutation must scope by:

```txt
ctx.org.id
```

not by request body.

---

# 20. PlatformContext Requirement

Every Comments Service operation must receive verified `PlatformContext`.

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

The service must never re-derive tenant identity from client input.

The service may check target visibility through platform-approved target resolvers.

---

# 21. Future Permission Model

The future Comments Service may define platform-level permissions:

```txt
platform.comments.read
platform.comments.create
platform.comments.update_own
platform.comments.delete_own
platform.comments.moderate
platform.comments.resolve_thread
```

But comments must also respect the target record’s permission model.

Example:

```txt
User can read purchase request
+ user can read comments
= user can read comments on that purchase request
```

If the user cannot read the target record, the user must not read comments on it.

Example:

```txt
User cannot read incident report
→ user cannot read incident report comments
```

Comment permissions are additive, not a bypass.

---

# 22. Target Visibility Requirement

The Comments Service cannot assume that a user may access a target just because the target ID exists.

A future implementation must verify:

```txt
Target exists.
Target belongs to ctx.org.id.
Target is not soft-deleted.
Target is visible to ctx.userId based on module/business-object permissions.
The target's module is enabled if it is module-owned.
```

This likely requires target resolvers.

Conceptual future interface:

```ts
type CommentTargetResolver = {
  namespace: string
  entity: string
  canReadTarget(ctx: PlatformContext, targetId: string): Promise<boolean>
  canCommentOnTarget(ctx: PlatformContext, targetId: string): Promise<boolean>
  getTargetLabel(ctx: PlatformContext, targetId: string): Promise<string>
}
```

Resolvers must be registered through the platform, not by direct module imports.

This detail should be finalized only during the implementation proposal.

---

# 23. Future SDK Shape

Future SDK shape may look like:

```ts
sdk.comments.getThreadForTarget(ctx, target)
sdk.comments.list(ctx, threadId)
sdk.comments.create(ctx, input)
sdk.comments.update(ctx, commentId, input)
sdk.comments.delete(ctx, commentId)
sdk.comments.restore(ctx, commentId)
sdk.comments.resolveThread(ctx, threadId)
sdk.comments.reopenThread(ctx, threadId)
```

Where `target` is a validated comment target:

```ts
type CommentTargetInput = {
  targetType: 'business_object' | 'module_record' | 'platform_record'
  targetNamespace: string
  targetEntity: string
  targetId: string
}
```

The SDK must not expose low-level comment table access to modules.

Forbidden:

```ts
sdk.getDb(ctx).comment.create(...)
```

Modules should use the Comments SDK if and when the service exists.

---

# 24. Future API Shape

Future API routes should follow Kernel API contracts.

Possible routes:

```txt
GET    /api/orgs/[orgSlug]/platform/comments/thread?targetNamespace=&targetEntity=&targetId=
POST   /api/orgs/[orgSlug]/platform/comments
PATCH  /api/orgs/[orgSlug]/platform/comments/[commentId]
DELETE /api/orgs/[orgSlug]/platform/comments/[commentId]
POST   /api/orgs/[orgSlug]/platform/comments/threads/[threadId]/resolve
POST   /api/orgs/[orgSlug]/platform/comments/threads/[threadId]/reopen
```

All API routes must:

```txt
Use API-safe auth helpers.
Create verified PlatformContext.
Reject client-supplied orgId.
Validate params, query, and body with Zod.
Check comment permissions.
Check target visibility.
Return { data, error, meta? } JSON only.
Never redirect.
Never return HTML.
```

---

# 25. Validation Rules

Future comment input should be validated with Zod.

Example future create schema:

```ts
const CreateCommentSchema = z.strictObject({
  targetType: z.enum(['business_object', 'module_record', 'platform_record']),
  targetNamespace: z.string().min(1),
  targetEntity: z.string().min(1),
  targetId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
})
```

Forbidden fields:

```txt
orgId
authorUserId
createdById
createdAt
updatedAt
deletedAt
deletedBy
```

These must be derived server-side.

---

# 26. Comment Body Format

The first future implementation should use:

```txt
plain_text
```

Not:

```txt
HTML
Markdown
Rich text JSON
Tiptap/ProseMirror document JSON
```

Reason:

```txt
Plain text is safe, searchable, easy to render, easy to export, and hard to exploit.
```

Rich text can be revisited later if the need is real.

---

# 27. Editing Policy

Future MVP recommendation:

```txt
Users may edit their own comments for a limited practical window.
Moderators/admins may delete or restore comments.
Edited comments should show edited state.
```

Possible fields:

```txt
editedAt
editedById
```

Do not silently overwrite historical comment meaning.

If auditability is important, Audit Log Service may later record comment edits.

---

# 28. Deletion Policy

Comments should use soft delete.

Soft-deleted comments should normally display as:

```txt
Comment deleted
```

or be hidden depending on UX decision.

Hard delete is forbidden for normal operations.

Fields:

```txt
deletedAt
deletedBy
```

Deleted comments should not be returned by normal list APIs unless the UI explicitly needs tombstones for conversation continuity.

This decision must be finalized during implementation.

---

# 29. Event Contracts

Future Comments Service events should use the `platform` namespace.

Possible event names:

```txt
platform.comment.created
platform.comment.updated
platform.comment.deleted
platform.comment.restored
platform.comment_thread.created
platform.comment_thread.resolved
platform.comment_thread.reopened
```

Events must be emitted through `@/sdk/server` using verified `PlatformContext`.

Payloads must be small and safe.

Example:

```ts
type PlatformCommentCreatedPayload = {
  commentId: string
  threadId: string
  targetType: string
  targetNamespace: string
  targetEntity: string
  targetId: string
  authorUserId: string
}
```

Payloads must not include:

```txt
orgId
full comment body by default
full Prisma record
sensitive target data
```

Whether comment body appears in events should require explicit privacy review.

---

# 30. Relationship to AI

Comments may eventually provide useful context to AI.

But comments may include sensitive internal discussion.

Future AI access to comments must obey:

```txt
Tenant isolation
Target visibility
Comment permissions
Data minimization
No cross-org retrieval
No unauthorized summarization
```

Do not include comments in AI context during MVP.

Future examples:

```txt
Summarize discussion on this incident.
Show unresolved questions on this purchase request.
Explain why this customer record has internal concerns.
```

These require a dedicated AI safety review.

---

# 31. Relationship to Search

Comments may eventually be searchable.

But comment search is deferred until Search Service exists.

Future requirements:

```txt
Tenant-scoped indexing.
Permission-aware search results.
Target visibility checks.
No deleted comments in normal search.
No search results for inaccessible target records.
```

Do not add comment search inside the first Comments Service implementation unless approved.

---

# 32. Relationship to Reporting

Comments are usually collaboration data, not core reporting data.

Possible future reporting:

```txt
Records with unresolved comment threads
Comment volume by module
Unanswered comment count
Aging unresolved discussions
```

These are deferred.

Do not turn Comments Service into a reporting engine.

---

# 33. UI Direction

Future comment UI should be minimal and record-attached.

Recommended first UI pattern:

```txt
Record detail page
→ Right-side comments panel or lower comments section
→ Flat chronological list
→ Textarea composer
→ Edit/delete own comment
→ Resolve thread if permitted
```

Do not build:

```txt
Global chat inbox
Slack-like interface
Nested threaded UI
Emoji reactions
Typing indicators
Real-time presence
Rich text editor
```

until proven necessary.

---

# 34. Client Configuration

Comments should not be globally available for every entity by default.

Future commentability should be explicit.

Possible future configuration:

```txt
Enable comments for incident reports.
Enable comments for purchase requests.
Disable comments for customer records.
```

This configuration should be platform-owned, not hard-coded randomly in modules.

However, do not implement comment configuration until the service itself is approved.

---

# 35. Security Requirements

Future Comments Service must enforce:

```txt
Authentication
Tenant membership
Target visibility
Comment permission
Soft-delete rules
Input validation
Output sanitization
PII minimization
```

Security risks:

```txt
Cross-tenant comment leaks
Comments visible on records the user cannot access
Stored XSS through rich text or unsafe rendering
Comment body included in events unnecessarily
Deleted comments appearing in AI/search/export
Mentions notifying unauthorized users
```

The first implementation should use plain text rendering to reduce XSS risk.

---

# 36. Privacy Requirements

Comments may contain sensitive information.

Examples:

```txt
Employee performance issues
Supplier disputes
Customer complaints
Incident investigation notes
Financial concerns
Internal decisions
```

Therefore:

```txt
Do not include full comment bodies in generic event payloads by default.
Do not expose comments to AI without permission checks.
Do not export comments casually.
Do not include comments in public/customer-facing surfaces by default.
```

---

# 37. Database Constraints

Future comment tables must follow OneDayOS database rules:

```txt
orgId on every tenant-scoped table
createdAt / updatedAt
soft delete with deletedAt / deletedBy
tenant-safe indexes
Prisma migrations only
No manual DB edits
No raw SQL in modules
```

Likely indexes:

```txt
CommentThread(orgId, targetNamespace, targetEntity, targetId)
Comment(orgId, threadId, createdAt)
Comment(orgId, authorUserId)
Comment(orgId, deletedAt)
```

Exact indexes should be finalized when implementation begins.

---

# 38. Module Integration Pattern

If Comments Service exists later, modules should integrate through SDK and UI slots.

Example future module page:

```tsx
<CommentPanel
  target={{
    targetType: 'module_record',
    targetNamespace: 'incidents',
    targetEntity: 'incident',
    targetId: incident.id,
  }}
/>
```

The `CommentPanel` must not trust the client target blindly.

Server/API must validate that the target exists, belongs to the tenant, and is visible to the user.

---

# 39. Business Object Integration Pattern

Business Objects may become commentable later.

Examples:

```txt
Product comments
Customer comments
Supplier comments
Warehouse comments
Employee comments
```

But this should be explicit.

Do not automatically enable comments for every Business Object just because the service exists.

Customer and Employee comments are especially sensitive.

---

# 40. Import / Export Behavior

Comments should not be included in basic record exports by default.

Reason:

```txt
Comments may contain sensitive internal discussion.
Exports often leave the system.
```

Future export behavior should require explicit permission:

```txt
platform.comments.export
```

and target-specific read permission.

Imports of historical comments should be deferred.

---

# 41. Testing Requirements for Future Implementation

A future Comments Service implementation must include tests for:

```txt
Unauthenticated request returns 401 JSON.
Wrong-org access returns safe 404.
User without target read permission cannot read comments.
User without comment permission cannot create comments.
User cannot comment on a target in another organization.
Client-supplied orgId is rejected.
Soft-deleted comments are hidden or tombstoned according to policy.
Comment author can edit own comment if policy allows.
User cannot edit another user's comment without moderation permission.
Moderation permission can delete/restore comments.
Comment events emit only after successful mutation.
Failed mutation emits no event.
Comment body is validated and length-limited.
Plain text output is escaped safely.
```

All security-sensitive tests must use at least two organizations.

Admin-only tests are insufficient.

---

# 42. Generator Rules

The Module Generator must not generate comments by default.

Forbidden generator output:

```txt
comments.ts
Comment model
CommentPanel import
comment permissions
comment API routes
comment service calls
```

Until Comments Service is approved, generated modules may include only module-specific note fields when explicitly requested and architecturally appropriate.

Example allowed field:

```txt
internalNotes
```

Example forbidden generic scaffold:

```txt
src/modules/inventory/comments.ts
```

---

# 43. FastAPI Decision

FastAPI must not be introduced for Comments Service.

Comments are normal platform CRUD/collaboration behavior and belong in the existing Next.js / TypeScript / Prisma / SDK architecture.

Forbidden:

```txt
FastAPI comments microservice
Python comment API
SQLAlchemy comment models
Alembic comment migrations
Separate comment database
```

A separate runtime would add operational cost and security surface without enough benefit.

---

# 44. Claude Implementation Rules

Claude must obey these rules:

```txt
Do not implement Comments Service now.
Do not create comment tables.
Do not create comment SDK methods.
Do not create CommentPanel.
Do not add comment APIs.
Do not add mentions.
Do not add real-time subscriptions.
Do not add notification behavior.
Do not add attachment behavior.
Do not add comment search.
Do not add FastAPI.
```

If a module seems to need comments, Claude must stop and ask for architectural review.

For MVP module work, Claude may implement module-local fields such as:

```txt
reason
remarks
internalNotes
resolutionNotes
```

only when they are part of that module's business model.

---

# 45. Promotion Checklist

Before Comments Service can be implemented:

```txt
[ ] Three independent comment use cases are documented.
[ ] Evidence log is approved.
[ ] ADR is written if needed.
[ ] Target reference model is approved.
[ ] Target visibility resolver pattern is approved.
[ ] Permission model is approved.
[ ] Event contracts are approved.
[ ] Data model is approved.
[ ] API contract is approved.
[ ] UI pattern is approved.
[ ] Security test matrix is approved.
[ ] Interaction with Notifications is explicitly deferred or approved.
[ ] Interaction with Attachments is explicitly deferred or approved.
[ ] Interaction with AI/Search is explicitly deferred or approved.
```

---

# 46. Acceptance Criteria for This Document

This document is acceptable if:

```txt
[ ] It clearly marks Comments Service as deferred.
[ ] It explains when comments should remain module-local.
[ ] It distinguishes comments from notes, audit logs, notifications, activity feed, and attachments.
[ ] It defines future tenant isolation rules.
[ ] It requires PlatformContext.
[ ] It forbids client-supplied orgId.
[ ] It defines future permission direction.
[ ] It defines future event direction.
[ ] It blocks premature mentions, real-time, rich text, and attachments.
[ ] It gives Claude explicit non-implementation rules.
```

---

# 47. Summary

The Comments Service is a likely future Platform Service, but it should not be built during the restarted foundation phase.

For now:

```txt
Module-specific notes may live inside modules.
Reusable comments are deferred.
Events should remain clean.
Business state should remain explicit.
Approval, Audit, Notification, Activity Feed, Attachment, Search, and AI concerns remain separate.
```

The correct OneDayOS posture is:

```txt
Do not build comments because they sound useful.
Build comments only when repeated collaboration patterns prove the need.
```

