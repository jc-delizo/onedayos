# OneDayOS Engineering Manual — 10 Platform Services / 07 Activity Feed Service

**Document ID:** `10-platform-services/07-activity-feed-service.md`  
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
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/06-module-events.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`
- `10-platform-services/02-audit-log-service.md`
- `10-platform-services/03-notification-service.md`
- `10-platform-services/05-comments-service.md`
- `10-platform-services/06-attachments-service.md`

---

# 1. Purpose

The Activity Feed Service is the future OneDayOS Platform Service responsible for showing human-readable activity timelines across the platform.

Examples:

```txt
Product was created.
Stock adjustment was submitted.
Leave request was approved.
Expense claim was rejected.
Incident report was updated.
Customer was converted to an active account.
Asset was assigned to an employee.
Attachment was added to a purchase request.
Comment was added to an incident report.
```

The service exists to answer questions like:

```txt
What happened to this record?
What has this employee been working on?
What changed in this module recently?
What happened across this organization today?
Which records need attention?
```

However, this service is **not approved for implementation yet**.

During the restarted foundation build, Claude must not create:

```txt
Activity feed tables
Activity feed APIs
Activity feed UI
Global timeline pages
Entity timeline panels
Activity cards
Activity summary widgets
Activity indexing jobs
Activity notification integrations
AI activity summaries
```

This document defines the future contract only.

---

# 2. Core Decision

The Activity Feed Service is deferred.

OneDayOS should not build a generic activity timeline until repeated activity-feed use cases prove the need.

The correct current behavior is:

```txt
Foundation build:
  No generic Activity Feed Service.

Business Object and module mutations:
  Emit clean, tenant-scoped, typed events.

First module needing a visible timeline:
  Keep timeline behavior module-local if unavoidable.
  Log the use case as evidence.

Three independent activity timeline use cases:
  Write Platform Service proposal.
  Review architecture.
  Approve or reject promotion.

After approval:
  Implement Activity Feed Service through SDK.
```

The Activity Feed Service should be built only when there are at least three independent use cases such as:

```txt
CRM needs customer activity timeline.
Inventory needs product/stock movement timeline.
Projects needs project activity timeline.
```

or:

```txt
Incidents needs incident activity history.
Assets needs asset assignment timeline.
Leave needs employee leave activity timeline.
```

At that point, the same timeline capability has appeared across independent business domains, and a reusable Platform Service becomes justified.

---

# 3. Why This Service Must Be Deferred

Activity feeds look simple but easily become a dumping ground for every event in the system.

A premature Activity Feed Service creates risks in:

```txt
Event noise
Permission leaks
Tenant leaks
Poor timeline UX
Duplicated audit logs
Unclear event semantics
Storage bloat
Confusing user-facing language
Incorrect entity links
Hard-to-change event formatting
Unnecessary background jobs
```

Activity feeds also require mature answers to questions OneDayOS does not yet have enough real module experience to answer:

```txt
Which events are worth showing?
Which events should be hidden?
Who is allowed to see each activity item?
Should activity be grouped?
Should activity be summarized?
Should activity be stored or computed from events?
Should deleted records appear?
Should confidential activity be redacted?
Should activity feed entries survive event schema changes?
```

The platform should first build:

```txt
Kernel
SDK
Tenancy
Permissions
Business Objects
Module System
Event Contracts
First real modules
```

Then extract activity feed patterns when repeated needs are real.

---

# 4. Relationship to Other Services

The Activity Feed Service must not be confused with nearby services.

| Capability | Purpose | Status |
|---|---|---|
| Event Bus | Emits internal business facts | Kernel/SDK primitive now |
| Audit Log Service | Compliance/security record of what changed | Deferred |
| Activity Feed Service | Human-readable timeline of meaningful activity | Deferred |
| Notification Service | Alerts users about things needing attention | Deferred |
| Comments Service | User-authored collaboration on records | Deferred |
| Attachments Service | File attachment lifecycle | Deferred |
| Reporting Service | Aggregated business analysis | Deferred |
| Search Service | Find records globally or within modules | Deferred |
| AI Layer | Reasoning/summarization/action assistance | Deferred |

## 4.1 Activity Feed vs Event Bus

The Event Bus is internal infrastructure.

The Activity Feed is a user-facing product surface.

An event says:

```txt
inventory.stock_adjustment.submitted
```

An activity feed item may display:

```txt
Juan dela Cruz submitted a stock adjustment for Warehouse A.
```

The Event Bus should exist now.

The Activity Feed Service should not.

## 4.2 Activity Feed vs Audit Log

Audit logs are for accountability.

Activity feeds are for user understanding.

Audit logs should answer:

```txt
Who changed this record?
When did it change?
Which fields changed?
What was the actor?
What was the source?
```

Activity feeds should answer:

```txt
What meaningful things happened here?
What should a user understand quickly?
What is the story of this record?
```

Audit logs may contain events that are too technical or sensitive for normal users.

Activity feed items must be curated and permission-aware.

## 4.3 Activity Feed vs Notifications

Notifications are delivered to users.

Activity feed items are viewed when users visit a record, module, dashboard, or timeline.

A stock level crossing a threshold may later produce both:

```txt
Notification:
  "Low stock alert: Product A is below reorder level."

Activity feed:
  "Product A crossed its reorder threshold."
```

But the systems are not the same.

A timeline item does not imply a user should be notified.

## 4.4 Activity Feed vs Comments

Comments are written by users.

Activity items are produced by system events.

Example comment:

```txt
"Please verify the supplier invoice before approval."
```

Example activity:

```txt
"Maria Santos uploaded a supplier quotation."
```

If Comments Service is built later, comment events may become activity items, but the services remain separate.

## 4.5 Activity Feed vs Reporting

Activity feed shows chronology.

Reporting shows analysis.

Activity feed:

```txt
March 3 — Stock adjustment submitted.
March 4 — Stock adjustment approved.
March 4 — Stock movement posted.
```

Report:

```txt
Total adjustments this month: 27
Total adjustment value: ₱138,400
Top adjusted warehouse: Cebu
```

Do not use Activity Feed as a reporting engine.

---

# 5. Three Independent Use Cases Trigger

The Activity Feed Service may be proposed only after three independent activity timeline needs are logged.

Examples that may count:

```txt
CRM customer timeline
Inventory product/stock timeline
Projects project timeline
```

Examples that may also count:

```txt
Incident report timeline
Asset assignment timeline
Purchase request timeline
```

Examples that do **not** count as independent use cases:

```txt
Two different pages in the same module need the same customer timeline.
A founder thinks timelines would look premium.
Claude generated an activity-feed component because dashboards often have one.
A client asks for "history" but only means audit/compliance.
A module needs internal event handling but no visible timeline.
```

Three independent use cases trigger a **proposal**, not automatic implementation.

Before implementation, the proposal must answer:

```txt
Which events become activity items?
Where will the activity feed be shown?
Which users can see it?
How are permissions checked?
How are sensitive fields redacted?
How are deleted records handled?
How is activity retained?
How is activity queried efficiently?
What is the MVP scope?
What is explicitly excluded?
```

---

# 6. Deferred Does Not Mean Forgotten

The Activity Feed Service is not built now, but the current platform must prepare for it.

The foundation build must already enforce:

```txt
Stable event naming
Typed event payloads
Verified PlatformContext
Tenant-scoped mutations
Permission-enforced services
Business Object event contracts
Module event contracts
No direct module-to-module calls
No full Prisma records in event payloads
No client-supplied orgId
```

This means that when Activity Feed Service is eventually approved, it can consume existing event contracts without retrofitting every module.

The correct foundation-stage investment is not activity feed UI.

The correct foundation-stage investment is clean events.

---

# 7. How Deferred Services Are Added Later

Deferred Platform Services are added to the platform through the same OneDayOS base codebase.

They are not created as separate per-client apps.

The lifecycle is:

```txt
1. A module needs a capability.
2. Keep the capability inside that module if only one use case exists.
3. Log the use case in the Platform Service evidence log.
4. A second independent use case appears.
5. Align patterns, but usually keep logic module-local.
6. A third independent use case appears.
7. Write a Platform Service proposal and ADR.
8. Approve the service scope.
9. Add the Platform Service to the base platform codebase.
10. Add database migrations if needed.
11. Add SDK APIs if needed.
12. Add tests.
13. Deploy the platform update.
14. Enable or expose the service only where configuration, module usage, and permissions allow.
```

So when Activity Feed is implemented later, it becomes part of the shared OneDayOS platform.

The code may be available globally after deployment, but access and visibility remain controlled by:

```txt
Organization
Enabled modules
Settings
Permissions
Record-level access rules
Feature flags, if needed
```

A platform service being present in the codebase does not mean every client sees it immediately.

Example:

```txt
OneDayOS deploys Activity Feed Service.

Client A uses CRM and Inventory:
  Customer timelines and product timelines may appear if enabled.

Client B uses only Visitor Management:
  Activity Feed may remain invisible if no supported activity views exist.

Client C is on a beta rollout:
  Activity Feed appears only for selected modules/settings.
```

This is the same platform model as all other OneDayOS features:

```txt
One codebase.
One platform.
Many organizations.
Per-org modules, settings, permissions, and rollout controls.
```

---

# 8. Activity Feed Service Is Not Part of Every App by Default

A customer buys OneDayOS plus modules.

They do not buy a separate app fork.

When a deferred Platform Service is not yet implemented, client modules may still work without it.

Example before Activity Feed exists:

```txt
Inventory can still manage products.
Inventory can still post stock movements.
Inventory can still emit events.
Inventory just does not show a generic activity timeline yet.
```

Example after Activity Feed exists:

```txt
Inventory still owns stock logic.
Activity Feed owns reusable timeline rendering/querying.
Inventory emits stock events.
Activity Feed consumes allowed events and displays a product/stock timeline.
```

The service is added to the base platform only when it is justified.

It is then consumed by modules through the SDK and displayed only where appropriate.

---

# 9. When Activity Feed May Be Added to the System

Activity Feed may be added only after these conditions are true:

```txt
[ ] At least three independent activity timeline use cases are logged.
[ ] Existing module-local timeline needs are reviewed.
[ ] Event contracts for those modules are stable enough.
[ ] A Platform Service proposal is written.
[ ] An ADR approves the service.
[ ] The MVP scope is narrow.
[ ] Permissions and tenant behavior are defined.
[ ] Database schema is reviewed.
[ ] SDK API is reviewed.
[ ] UI standards are reviewed.
[ ] Tests are specified.
```

The first version should probably support only:

```txt
Entity activity timeline
Module-scoped activity list
Basic actor + verb + target display
Tenant-scoped query
Permission-aware visibility
Event-derived activity entries
```

It should not start with:

```txt
Global social feed
Realtime feed
Infinite collaboration stream
AI summarization
Digest emails
Webhook subscriptions
Cross-client analytics
User productivity scoring
Complex event grouping engine
```

---

# 10. Future Service Boundary

When approved, the Activity Feed Service belongs to Platform Services.

It may expose SDK APIs such as:

```ts
sdk.activity.listForEntity(ctx, {
  entityType: 'product',
  entityId: productId,
})

sdk.activity.listForModule(ctx, {
  module: 'inventory',
})

sdk.activity.record(ctx, activityInput)
```

However, modules should generally not manually record activity items if activity can be derived from events.

Preferred future pattern:

```txt
Module service performs mutation.
Module service emits business event.
Activity Feed Service consumes event.
Activity Feed Service decides whether to create a visible activity item.
```

Less preferred pattern:

```txt
Module service manually writes activity feed row.
```

Manual activity recording should require explicit approval because it can create inconsistent timelines.

---

# 11. Future Data Model — Candidate Only

The future service may use a model like this.

This is **not approved for implementation**.

```prisma
model ActivityItem {
  id              String   @id @default(cuid())
  orgId           String

  // Origin
  sourceEventName String?
  sourceEventId   String?
  sourceModule    String?

  // Actor
  actorType        String   // "user" | "system" | "integration" | "ai"
  actorUserId      String?
  actorLabel       String?

  // Target
  targetType       String   // "product" | "customer" | "stock_adjustment" | etc.
  targetId         String
  targetLabel      String?

  // Optional parent/grouping
  parentType       String?
  parentId         String?

  // Display
  verb             String
  message          String
  metadata         Json?

  // Visibility and lifecycle
  visibility       String   @default("normal")
  occurredAt       DateTime
  createdAt        DateTime @default(now())
  deletedAt        DateTime?
  deletedBy        String?

  @@index([orgId, targetType, targetId, occurredAt])
  @@index([orgId, sourceModule, occurredAt])
  @@index([orgId, actorUserId, occurredAt])
  @@map("activity_items")
}
```

Important notes:

```txt
This model is a candidate, not a command.
The final design requires an ADR.
Do not add this model during the foundation build.
Do not let Claude implement this from the contract-only document.
```

---

# 12. Tenant Isolation Rules

Future Activity Feed must be tenant-scoped.

Every activity item must belong to exactly one organization:

```txt
ActivityItem.orgId = ctx.org.id
```

Future Activity Feed code must use:

```ts
sdk.activity.listForEntity(ctx, input)
```

not:

```ts
sdk.activity.listForEntity(orgId, input)
```

Forbidden:

```ts
const orgId = body.orgId
const orgId = searchParams.get('orgId')
await prisma.activityItem.findMany({ where: { targetId } })
await prisma.activityItem.create({ data: { orgId: input.orgId } })
```

Required:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, moduleId)
await sdk.activity.listForEntity(ctx, input)
```

The activity feed must never allow one organization to see another organization's timeline.

---

# 13. Permission Rules

Activity Feed visibility must respect the target record's permissions.

A user should not see activity for a record they cannot access.

Examples:

```txt
A user without Inventory read permission should not see product stock activity.
A user without CRM read permission should not see customer pipeline activity.
A user without employee read permission should not see employee activity.
A user without incident access should not see incident timeline items.
```

Future Activity Feed permission checks should consider:

```txt
Tenant membership
Module enablement
Target module permission
Target Business Object permission
Possibly target record visibility
```

Activity Feed must not become a permission bypass.

Bad behavior:

```txt
User cannot open a purchase request, but can see in activity feed that it was approved for ₱500,000.
```

Correct behavior:

```txt
If the user cannot access the purchase request, the activity feed item is hidden or safely redacted.
```

---

# 14. Event Consumption Rules

Activity Feed should consume event envelopes from the SDK event system.

It should not subscribe to random payloads.

Future listener shape may look like:

```ts
sdk.events.on('objects.product.updated', async (event) => {
  await sdk.activity.recordFromEvent(event, {
    targetType: 'product',
    targetId: event.payload.productId,
    verb: 'updated',
  })
})
```

However, event listener registration must remain server-only.

Activity Feed event consumers must not:

```txt
Run in client components
Import business module internals
Assume full Prisma records in payloads
Use payload orgId
Bypass permission rules
Break the original mutation if activity recording fails
```

Listener failures should be logged and handled, not surfaced to the user performing the original business action.

If activity recording becomes mission-critical for compliance, that belongs to Audit Log Service, not Activity Feed Service.

---

# 15. Which Events Become Activity Items

Not every event should become visible activity.

Examples likely suitable for activity:

```txt
objects.product.created
objects.product.updated
objects.customer.created
inventory.stock_adjustment.submitted
inventory.stock_adjustment.approved
inventory.stock_movement.created
leave.request.submitted
leave.request.approved
expense.claim.submitted
expense.claim.rejected
incident.report.created
asset.assignment.created
platform.comment.created
platform.attachment.created
```

Examples likely unsuitable for activity:

```txt
kernel.session.refreshed
kernel.user.last_seen_updated
search.index.refreshed
notification.delivery_attempted
background_job.completed
internal.cache.invalidated
```

The Activity Feed Service must have a mapping layer.

It must not blindly convert every event into a feed item.

---

# 16. Activity Item Language

Activity feed entries are product UX.

They must be human-readable.

Bad:

```txt
inventory.stock_adjustment.created: { id: "abc123" }
```

Better:

```txt
Juan dela Cruz created a stock adjustment.
```

Better with context:

```txt
Juan dela Cruz created a stock adjustment for Main Warehouse.
```

Do not expose raw event names as the primary user-facing text.

Event names are stable contracts for developers.

Activity messages are user-facing product copy.

---

# 17. Sensitive Data and Redaction

Activity Feed must not leak sensitive data.

Avoid storing or displaying:

```txt
Full customer details
Full employee personal information
Government IDs
Salary or payroll details
Bank details
Medical information
Private notes
Full before/after snapshots
Secrets
Tokens
Internal error stacks
```

Activity entries should store minimal display information.

Prefer:

```txt
targetId
targetType
targetLabel
actorLabel
verb
safe metadata
```

Do not store full Prisma records.

Do not assume activity metadata is safe for every user.

---

# 18. Soft Delete and Restore Behavior

Activity Feed must respect record lifecycle.

If a target record is soft-deleted:

```txt
Normal users should usually not see its activity feed.
Admin restore flows may show its timeline.
Activity items themselves should not be hard-deleted automatically.
```

If an activity item itself needs to be removed from normal display:

```txt
Use deletedAt/deletedBy.
Do not hard delete normal activity records.
```

However, Activity Feed is not the same as Audit Log.

If an activity item is deleted from user-facing display, the audit/compliance trail may still retain evidence elsewhere once Audit Log Service exists.

---

# 19. API Contract — Future Only

Possible future API routes:

```txt
GET /api/orgs/[orgSlug]/activity/entity/[targetType]/[targetId]
GET /api/orgs/[orgSlug]/activity/modules/[moduleId]
GET /api/orgs/[orgSlug]/activity/me
```

All future APIs must:

```txt
Return JSON only
Use { data, error, meta? }
Use verified PlatformContext
Reject client-supplied orgId
Validate route params
Validate query strings
Check permissions
Respect module enablement
Paginate results
Never return raw internal event payloads by default
```

Activity APIs must never use:

```txt
/api/activity?orgId=...
/api/[module]/activity?orgId=...
```

---

# 20. UI Contract — Future Only

Possible future UI surfaces:

```txt
Entity detail page activity panel
Module dashboard activity list
User-specific activity list
Organization admin activity overview
Record timeline drawer
```

The first implementation should likely support only entity-level activity panels.

Do not start with a global social feed.

Good first UI:

```txt
Product detail page:
  Activity tab showing product-related activity.

Customer detail page:
  Activity tab showing CRM/customer-related activity.
```

Bad first UI:

```txt
Global homepage feed with every event in the org.
```

Global feeds become noisy quickly and require mature filtering, grouping, and permissions.

---

# 21. Query and Pagination Rules

Future Activity Feed queries must be paginated from day one.

Forbidden:

```ts
await db.activityItem.findMany({ where: { orgId: ctx.org.id } })
```

Required:

```ts
await db.activityItem.findMany({
  where: {
    orgId: ctx.org.id,
    targetType: input.targetType,
    targetId: input.targetId,
    deletedAt: null,
  },
  orderBy: { occurredAt: 'desc' },
  take: input.limit,
  cursor: input.cursor ? { id: input.cursor } : undefined,
})
```

Activity feeds can grow fast.

Every list query must have:

```txt
orgId filter
permission filter or post-filter
pagination
stable ordering
index support
soft-delete filter
```

---

# 22. Storage and Retention

Activity Feed storage may grow quickly.

Retention must be decided before implementation.

Possible future policies:

```txt
Keep normal activity for 12 months.
Keep important lifecycle activity indefinitely.
Archive older activity.
Keep audit/compliance separately.
```

Do not decide retention casually.

Retention affects:

```txt
Storage cost
Database performance
Client expectations
Backup size
Restore complexity
Privacy
Compliance
```

The first implementation must include a cost estimate.

---

# 23. AI Relationship

The future AI Layer may summarize activity.

Examples:

```txt
"Summarize what happened to this customer this month."
"Why did stock for Product A change yesterday?"
"Show recent activity before this purchase request was approved."
```

But AI activity summarization is deferred.

Activity Feed Service must not be built primarily for AI.

The correct sequence is:

```txt
Events first.
Activity Feed later.
AI summaries after activity data is reliable.
```

AI must never use Activity Feed to bypass record permissions.

---

# 24. Background Jobs Relationship

MVP Activity Feed may begin as synchronous/in-process event consumption only if safe.

However, a mature Activity Feed may need background jobs for:

```txt
Event normalization
Backfills
Activity grouping
Retention cleanup
Indexing
Digest preparation
AI summaries
```

Background Jobs are a separate deferred Platform Service.

Do not implement a queue only for Activity Feed until the Background Jobs document approves a platform-wide job strategy.

---

# 25. Implementation Preconditions

Before Activity Feed Service can be implemented:

```txt
[ ] At least three independent activity feed use cases logged
[ ] Platform Service evidence log completed
[ ] ADR approved
[ ] Event contracts stable for initial supported modules
[ ] Activity item schema reviewed
[ ] SDK API reviewed
[ ] Permission model reviewed
[ ] UI surfaces reviewed
[ ] Design System timeline components approved
[ ] Query/index strategy reviewed
[ ] Retention policy drafted
[ ] Tests specified
```

Claude may not implement this service until all required documents are frozen and implementation is explicitly approved.

---

# 26. Minimum Future MVP Scope

The first Activity Feed Service implementation, when approved, should be intentionally small.

Recommended MVP:

```txt
Entity-level activity list only
Event-derived activity entries only
Basic actor + action + target display
Tenant-scoped activity records
Permission-aware reads
Cursor pagination
Soft delete for activity items
Tests for tenant isolation and permissions
```

Explicitly exclude from first implementation:

```txt
Global organization feed
Realtime updates
AI summaries
Digest emails
Complex grouping
Reactions
Mentions
Threaded comments
Custom activity templates per client
Cross-module analytics
Background job processor
Mobile push notifications
External webhooks
```

---

# 27. Testing Requirements — Future

When implemented, Activity Feed Service must include tests for:

```txt
Tenant isolation
Wrong-org access denial
Permission denial
Module-disabled behavior
Entity activity listing
Pagination
Deleted activity exclusion
Deleted target behavior
Event-to-activity mapping
Sensitive metadata redaction
Client-supplied orgId rejection
API JSON response shape
No redirects from API
No raw Prisma in modules
No module imports from Platform Service internals
```

At least two organizations are required in every security-sensitive test suite.

Admin-only tests are insufficient.

---

# 28. Generator Rules

The Module Generator must not generate Activity Feed integration by default.

Forbidden generator output:

```txt
activity.ts
activity-feed.tsx
ActivityFeed component
ActivityItem model
sdk.activity.record(...)
activity table migration
activity API route
```

Allowed generator output:

```txt
Event constants
Event payload schemas
Event emission tests
Manifest event declarations
```

Reason:

```txt
Clean events prepare for Activity Feed later.
Premature activity code creates a fake Platform Service before evidence exists.
```

---

# 29. Forbidden Patterns

Claude must not generate or implement:

```ts
await prisma.activityItem.create({ data: { orgId: input.orgId } })
```

```ts
await sdk.activity.record(orgId, activity)
```

```ts
await prisma.activityItem.findMany({ where: { targetId } })
```

```ts
import { ActivityFeedService } from '@/platform/activity/internal'
```

```ts
import { InventoryService } from '@/modules/inventory/service'
```

```txt
/api/activity?orgId=...
/api/[module]/activity?orgId=...
```

```txt
Global activity feed implemented before entity-level timeline
Activity feed implemented before three independent use cases
Activity generated directly from every event without filtering
Full Prisma records stored in activity metadata
Sensitive fields displayed in activity copy
Activity feed used as audit log
Activity feed used as notification service
Activity feed used as report engine
```

---

# 30. Claude Implementation Rules

If Claude is given this document during the restarted foundation build, Claude must respond:

```txt
This document is contract-only and deferred.
I will not implement Activity Feed Service yet.
I will only ensure current event contracts remain compatible with future Activity Feed.
```

Claude may help with:

```txt
Event naming
Event payload schemas
Business Object event emission
Module event emission
Tests proving events are emitted
Evidence log updates
Future proposal drafting
```

Claude must not help with:

```txt
ActivityFeed component
Activity database models
Activity API routes
Activity SDK APIs
Activity event consumers
Activity timeline UI
Activity background jobs
Activity AI summaries
```

---

# 31. Acceptance Criteria for This Document

This document is acceptable when:

```txt
[ ] It clearly defines Activity Feed Service.
[ ] It clearly distinguishes Activity Feed from Audit Log, Notifications, Comments, and Events.
[ ] It explicitly defers implementation.
[ ] It explains how activity feed will be added later.
[ ] It requires Three Independent Use Cases evidence.
[ ] It requires verified PlatformContext.
[ ] It rejects client-supplied orgId.
[ ] It defines future tenant and permission requirements.
[ ] It defines future API and UI direction without approving implementation.
[ ] It defines generator restrictions.
[ ] It gives Claude clear do-not-implement instructions.
```

---

# 32. Founder Review Questions

Before freezing this document, answer:

```txt
1. Do we agree Activity Feed should be deferred?
2. Do we agree the first future implementation should start with entity-level timelines, not a global feed?
3. Do we agree activity should be event-derived rather than manually written by every module?
4. Do we agree Activity Feed is separate from Audit Log?
5. Do we agree Activity Feed is separate from Notification Service?
6. Do we agree module generators should emit events but not activity-feed code?
7. Do we agree a Platform Service proposal and ADR are required before implementation?
```

---

# 33. Final Rule

The Activity Feed Service should tell the story of business records.

But OneDayOS should not build that storyteller before enough real business records and workflows exist.

For now:

```txt
Build clean events.
Build secure modules.
Build shared Business Objects.
Do not build Activity Feed yet.
```

When repeated timeline needs are proven, Activity Feed can become a powerful Platform Service.

Until then, it remains a contract, not code.
