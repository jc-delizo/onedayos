# OneDayOS Engineering Manual — 10 Platform Services / 03 Notification Service

**Document ID:** `10-platform-services/03-notification-service.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Deferred — Contract Only`  
**Author:** ChatGPT, acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
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
- `06-data/01-tenancy-data-isolation.md`
- `06-data/05-data-validation-zod.md`
- `08-module-system/06-module-events.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`
- `10-platform-services/02-audit-log-service.md`

---

# 1. Purpose

The Notification Service is the future OneDayOS Platform Service responsible for delivering user-facing alerts across modules.

It answers questions like:

```txt
Who needs to know that something happened?
How should they be notified?
Has the notification been read?
Should this event create an in-app notification, email, SMS, or nothing?
Can the user control notification preferences?
Can the same event avoid notifying the same person multiple times?
```

The Notification Service is important because many business modules eventually need to alert people:

```txt
Inventory: stock dropped below reorder threshold.
Leave: leave request needs approval.
Purchasing: purchase request was approved.
Expenses: expense claim was rejected.
Incidents: incident was assigned to a supervisor.
Visitors: visitor checked in and host should be alerted.
Assets: asset maintenance is due.
Projects: task deadline is approaching.
```

However, the Notification Service must **not** be implemented during the restarted foundation build.

For now, modules should emit clean business events. The future Notification Service can subscribe to those events once at least three independent use cases prove the need.

Core rule:

```txt
Events happen now.
Notifications come later.
```

---

# 2. Current Decision

The Notification Service is **deferred**.

Claude must not implement any of the following from this document alone:

```txt
notification tables
notification inbox UI
email delivery
SMS delivery
push notifications
notification preferences
notification templates
notification SDK APIs
notification background jobs
notification queue workers
notification digest system
notification analytics
```

This document is a **contract and boundary document**, not an implementation ticket.

The correct foundation-stage work is:

```txt
1. Define stable event contracts.
2. Emit events from services after successful mutations.
3. Keep event payloads small, tenant-safe, and typed.
4. Avoid hard-coding notification behavior inside unrelated modules unless only one module needs it.
5. Promote Notification Service only after enough evidence exists.
```

---

# 3. Why This Service Is Deferred

Notifications are tempting to build early because they sound universally useful.

That is dangerous.

A premature Notification Service can easily become:

```txt
an email engine
an approval engine
an activity feed
an audit log
an automation engine
an inbox
an escalation system
a workflow scheduler
a user preference system
a template engine
a background job system
```

Those are not the same thing.

Building all of them before real module needs exist would create needless complexity.

OneDayOS should not build a generic Notification Engine because it is a common SaaS feature. It should build the Notification Service only when repeated OneDayOS workflows prove exactly what notification behavior the platform needs.

---

# 4. Trigger for Implementation

The Notification Service may be proposed only after the **Three Independent Use Cases Rule** is satisfied.

This means at least three independent workflows need notification behavior that is meaningfully the same.

Good trigger example:

```txt
Use case 1: Leave request needs manager approval notification.
Use case 2: Purchase request needs approver notification.
Use case 3: Expense claim needs finance approval notification.

Shared capability:
Notify assigned approvers about pending approval tasks.
```

Another good trigger example:

```txt
Use case 1: Inventory low-stock alert.
Use case 2: Asset maintenance due alert.
Use case 3: Project deadline approaching alert.

Shared capability:
Notify responsible users about time-sensitive operational exceptions.
```

Bad trigger example:

```txt
Only Inventory needs low-stock alerts.
```

Decision:

```txt
Keep the alert logic inside Inventory for now.
Do not build the Notification Service yet.
```

Another bad trigger example:

```txt
The founder thinks every SaaS platform needs notifications.
```

Decision:

```txt
Not evidence.
Do not build.
```

---

# 5. Evidence Log Requirement

Before implementation, create a Notification Service evidence log.

Required format:

```md
# Notification Service Evidence Log

## Candidate Capability
Notify users when business events require attention.

## Use Case 1
Module:
Workflow:
Event:
Recipient:
Urgency:
Required channel:
Why module-local is insufficient:

## Use Case 2
Module:
Workflow:
Event:
Recipient:
Urgency:
Required channel:
Why module-local is insufficient:

## Use Case 3
Module:
Workflow:
Event:
Recipient:
Urgency:
Required channel:
Why module-local is insufficient:

## Common Pattern

## Proposed Service Boundary

## Non-Goals

## Decision
Promote / Do Not Promote
```

A future implementation must be based on this evidence log, not on assumptions.

---

# 6. What the Notification Service Is

The Notification Service is a Platform Service that converts selected business events into user-facing notifications.

It may eventually handle:

```txt
in-app notifications
read/unread state
notification recipients
notification preferences
notification templates
email delivery
SMS delivery
push delivery
scheduled reminders
digests
retry behavior
delivery status
notification-related permissions
notification cleanup/retention
```

At the platform level, the Notification Service should answer:

```txt
Should this event notify anyone?
Who should be notified?
What should the notification say?
Where should the notification send?
Has the user already seen it?
Should it be grouped, delayed, retried, or suppressed?
```

---

# 7. What the Notification Service Is Not

The Notification Service is not the Event Bus.

The Event Bus records that something happened:

```txt
inventory.stock_level.reorder_threshold_crossed
leave.request.submitted
purchasing.purchase_request.approved
```

The Notification Service decides whether humans need to be alerted about that event.

---

The Notification Service is not the Audit Log Service.

Audit Log answers:

```txt
What happened?
Who did it?
When did it happen?
What entity was affected?
```

Notification Service answers:

```txt
Who should be told?
How should they be told?
Have they read it?
```

---

The Notification Service is not the Activity Feed.

Activity Feed may show a timeline of entity activity.

Notification Service shows actionable or relevant alerts to a user.

A record can appear in an Activity Feed without notifying anyone.

A notification can be created without appearing in a public activity timeline.

---

The Notification Service is not the Approval Engine.

Approval Engine decides:

```txt
Who must approve?
What step is next?
What happens when approved or rejected?
```

Notification Service may tell the approver:

```txt
You have a leave request waiting for review.
```

The approval workflow itself must not live inside notifications.

---

The Notification Service is not the Workflow Engine.

Workflow Engine may eventually coordinate business steps.

Notification Service only alerts people.

It should not become a hidden automation engine.

---

The Notification Service is not an email marketing system.

It should not handle:

```txt
marketing newsletters
campaigns
lead nurturing
promotional blasts
bulk marketing email
```

Those are outside the OneDayOS internal business software core.

---

The Notification Service is not a chat system.

It should not become:

```txt
Slack clone
team chat
threaded conversations
real-time messaging product
```

If communication features are needed later, they require separate evidence and architecture.

---

# 8. Layer Placement

The Notification Service belongs in:

```txt
Platform Services
```

It does not belong in:

```txt
Kernel
Business Objects
Business Modules
Client Configuration
```

Reason:

```txt
It is not required for every module at foundation time.
It is not a shared business identity object.
It is not domain-specific to one business module.
It is a reusable cross-cutting capability after repeated need is proven.
```

---

# 9. Relationship to Kernel

The Notification Service depends on Kernel primitives.

It may use:

```txt
Authentication
Organizations
Users
Roles
Permissions
Settings
Module enablement
Event Bus interface
SDK
PlatformContext
```

It must not modify Kernel internals directly.

It must not bypass Kernel authorization.

It must not create its own user, role, permission, or organization model.

It must not store tenant identity from client input.

All notification operations must derive tenant context from verified `PlatformContext`.

---

# 10. Relationship to Business Objects

Notifications may reference Business Objects.

Examples:

```txt
Product low-stock notification references Product.
Employee leave approval notification references Employee.
Customer follow-up reminder references Customer.
Supplier onboarding issue references Supplier.
Warehouse receiving issue references Warehouse.
```

But notifications must not own or duplicate Business Objects.

Bad pattern:

```txt
NotificationProduct
NotificationEmployee
NotificationCustomer
```

Good pattern:

```txt
Notification.entityType = 'objects.product'
Notification.entityId = product.id
```

The Notification Service may reference entities generically, but it must not become an entity store.

---

# 11. Relationship to Business Modules

Modules should emit business events.

The Notification Service may later listen to those events.

Modules should not call Notification Service directly unless a future SDK contract explicitly allows it.

Preferred future pattern:

```txt
Module service mutation succeeds.
Module emits event.
Notification Service listener evaluates event.
Notification Service creates notification if rules match.
```

Example:

```txt
LeaveService.submitRequest(ctx, input)
  → emits leave.request.submitted
  → future Notification Service creates notification for manager
```

Modules must not import notification internals:

```ts
// Forbidden
import { NotificationService } from '@/platform/notifications/service'
```

Future module code should use SDK-level contracts only if direct notification creation is approved:

```ts
// Possible future, only after service is implemented and documented
await sdk.notifications.notify(ctx, input)
```

For MVP, this SDK namespace must remain reserved and unimplemented.

---

# 12. Relationship to Events

The Notification Service should be event-driven.

Events are the correct foundation for future notifications because they decouple modules from notification delivery.

Good event examples:

```txt
inventory.stock_level.reorder_threshold_crossed
leave.request.submitted
leave.request.approved
purchasing.purchase_request.submitted
expenses.claim.rejected
assets.maintenance_due.detected
incidents.incident.assigned
visitors.visitor.checked_in
```

Bad event examples:

```txt
send.email
notify.user
create.notification
approval.notify
```

Why bad?

They are commands disguised as events.

Event names should describe business facts, not instructions to another system.

Correct principle:

```txt
Modules publish facts.
Notification Service decides whether facts require notifications.
```

---

# 13. Event Payload Requirements for Future Notifications

To make future notifications possible, module events should include enough information to identify the affected entity and actor.

Recommended event payload shape:

```ts
type BusinessEventPayload = {
  entityId: string
  actorUserId?: string
  relatedUserIds?: string[]
  changedFields?: string[]
  severity?: 'info' | 'warning' | 'critical'
}
```

But payloads must remain small and safe.

Forbidden event payload contents:

```txt
full Prisma records
passwords
access tokens
large JSON blobs
private notes unless necessary
full customer PII unless necessary
raw request bodies
orgId inside payload
```

Tenant identity comes from the `EventEnvelope`, which is created by the SDK using `PlatformContext`.

---

# 14. Notification Categories

The future Notification Service should support a small set of categories.

Recommended MVP categories when implemented:

```txt
approval_required
approval_result
assignment
exception
reminder
system
mention
```

Definitions:

| Category | Meaning | Example |
|---|---|---|
| `approval_required` | User must review/approve something | Purchase request awaiting approval |
| `approval_result` | User is informed of approval/rejection | Leave request approved |
| `assignment` | User was assigned responsibility | Incident assigned to supervisor |
| `exception` | Something needs attention | Stock below reorder threshold |
| `reminder` | Time-sensitive reminder | Asset maintenance due tomorrow |
| `system` | Platform/account notice | Module disabled, subscription issue |
| `mention` | User was mentioned in a comment | Future comments service |

Do not create dozens of categories early.

Too many categories create configuration burden before the notification product is mature.

---

# 15. Notification Channels

The future service may support channels in phases.

Recommended channel order:

```txt
1. In-app notifications
2. Email notifications
3. SMS notifications
4. Push notifications
```

## 15.1 In-App Notifications

In-app notifications should be first.

Reason:

```txt
lowest external dependency
lowest cost
lowest deliverability risk
best fit for AppCare MVP
keeps users inside OneDayOS
```

In-app notifications may include:

```txt
notification bell
unread count
notification list
read/unread state
click-through URL
basic filtering
```

## 15.2 Email Notifications

Email should come after in-app notifications.

Reasons to defer:

```txt
requires provider choice
requires sender domain setup
requires unsubscribe/preference handling
requires delivery monitoring
creates support burden when email is not received
```

## 15.3 SMS Notifications

SMS should be strongly deferred.

Reasons:

```txt
cost per message
Philippine number formatting issues
provider reliability
user consent
spam risk
support burden
```

SMS should only be used for genuinely urgent workflows once paid clients prove the need.

## 15.4 Push Notifications

Push notifications are deferred even further.

Reason:

```txt
OneDayOS is initially a web platform.
Push notifications add browser/device/platform complexity.
```

---

# 16. Future Data Model — Conceptual Only

Do not implement this schema yet.

A future Notification Service may include models like:

```prisma
model Notification {
  id          String    @id @default(cuid())
  orgId       String
  recipientId String
  category    String
  title       String
  body        String?
  entityType  String?
  entityId    String?
  sourceEvent String?
  actionUrl   String?
  severity    String    @default("info")
  readAt      DateTime?
  createdAt   DateTime  @default(now())
  deletedAt   DateTime?
  deletedBy   String?
}
```

Possible future delivery model:

```prisma
model NotificationDelivery {
  id             String    @id @default(cuid())
  orgId          String
  notificationId String
  channel        String
  status         String
  provider       String?
  providerRef    String?
  attemptedAt    DateTime?
  deliveredAt    DateTime?
  failedAt       DateTime?
  failureReason  String?
  createdAt      DateTime  @default(now())
}
```

Possible future preference model:

```prisma
model NotificationPreference {
  id         String   @id @default(cuid())
  orgId      String
  userId     String
  category   String
  channel    String
  isEnabled  Boolean  @default(true)
  updatedAt  DateTime @updatedAt
}
```

These are examples only.

A future implementation document must refine them based on evidence.

---

# 17. Tenant Isolation Rules

Notifications are tenant-scoped business data.

Every notification record must include:

```txt
orgId
recipientId
```

Every notification query must scope by verified `PlatformContext`.

Users must never read notifications from another organization.

Client-supplied `orgId` is forbidden.

Bad pattern:

```ts
const orgId = body.orgId
await db.notification.findMany({ where: { orgId } })
```

Good pattern:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
const notifications = await NotificationService.listForCurrentUser(ctx)
```

Even if a user ID is guessed, notification access must still require matching organization context.

---

# 18. Recipient Rules

The future service must distinguish between:

```txt
actor
recipient
watcher
approver
assignee
mentioned user
organization admin
```

Definitions:

| Role | Meaning |
|---|---|
| Actor | The user who caused the event |
| Recipient | The user who receives the notification |
| Watcher | User following an entity or workflow |
| Approver | User responsible for approval step |
| Assignee | User assigned responsibility |
| Mentioned user | User referenced in a comment or note |
| Org admin | User with admin permissions in the organization |

The Notification Service must not blindly notify everyone.

Bad pattern:

```txt
Every event notifies all admins.
```

Better pattern:

```txt
Event-specific rules choose recipients based on workflow responsibility.
```

---

# 19. Self-Notification Rule

By default, users should not receive notifications for actions they performed themselves.

Example:

```txt
Juan submits his own leave request.
Juan should not receive: "You submitted a leave request."
Manager should receive: "Juan submitted a leave request for approval."
```

Exceptions may exist:

```txt
confirmation receipts
approval result notifications
system warnings
critical business events
```

But exceptions must be explicit.

---

# 20. Idempotency and Duplicate Prevention

The future Notification Service must avoid duplicate notifications.

Duplicate risks:

```txt
event emitted twice
listener retried
background job retried
user refreshes action
same threshold detected repeatedly
same approval request submitted twice
```

A future implementation should define an idempotency key.

Possible format:

```txt
{orgId}:{sourceEventId}:{recipientId}:{category}
```

or:

```txt
{orgId}:{eventName}:{entityType}:{entityId}:{recipientId}:{notificationRuleId}
```

Implementation must define this carefully.

For now, event payloads should include stable entity IDs so future duplicate prevention is possible.

---

# 21. Notification Severity

Future notifications may use severity.

Recommended levels:

```txt
info
warning
critical
```

Examples:

| Severity | Example |
|---|---|
| `info` | Leave request approved |
| `warning` | Product stock is below reorder threshold |
| `critical` | Security-related account issue |

Do not create many severity levels early.

Severity should influence visual treatment and delivery channel only after clear rules exist.

---

# 22. Notification Templates

Notifications should eventually use templates.

But templates should be simple.

Possible future template:

```ts
type NotificationTemplate = {
  id: string
  category: NotificationCategory
  title: string
  body?: string
  actionLabel?: string
}
```

Avoid early complex template systems:

```txt
no liquid templates in MVP
no user-authored templates in MVP
no per-client templating language in MVP
no HTML email editor in MVP
```

Reason:

```txt
Template systems become products by themselves.
OneDayOS does not need that complexity early.
```

---

# 23. Notification Preferences

User notification preferences are useful but should be deferred until there is actual notification volume.

Future preferences may include:

```txt
category on/off
channel on/off
email digest preference
quiet hours
module-specific preferences
```

Do not build preferences before notifications exist.

Do not create complex preference UI early.

Initial future implementation can use opinionated defaults.

Example:

```txt
approval_required: in-app enabled, email optional
approval_result: in-app enabled
exception: in-app enabled
system: in-app enabled, cannot fully disable
```

---

# 24. Delivery Status

For in-app notifications, delivery status can be simple:

```txt
created
read
archived/deleted
```

For email/SMS, future status may include:

```txt
pending
sent
delivered
failed
bounced
suppressed
```

Do not add delivery status complexity before external channels exist.

---

# 25. Read/Unread Behavior

Future in-app notifications should support:

```txt
unread count
mark one as read
mark all as read
read timestamp
filter unread only
```

Soft delete or archive behavior should be decided later.

Recommended future default:

```txt
Users can archive/delete their notification view.
The platform may retain notification records for operational history for a limited time.
```

But do not confuse notification retention with audit retention.

Audit retention belongs to Audit Log Service.

---

# 26. Permissions

Future notification permissions may include:

```txt
platform.notifications.read
platform.notifications.manage
platform.notifications.configure
platform.notifications.send_test
```

But personal user notifications should generally be accessible to the recipient.

Example:

```txt
A user can read their own notifications.
An admin can configure org-level notification settings.
A support/operator role may view delivery diagnostics later.
```

Potential permission objects:

```ts
{
  module: 'platform',
  resource: 'notification',
  action: 'read'
}

{
  module: 'platform',
  resource: 'notification_setting',
  action: 'update'
}
```

Do not use module-specific permissions for the platform notification inbox.

Bad:

```txt
inventory.notification.read
leave.notification.read
```

Good:

```txt
platform.notification.read
```

Module permissions still determine whether the underlying entity/action is accessible.

A notification should not become a permission bypass.

Example:

```txt
User receives a notification about a purchase request.
When they click it, the purchase module route still checks permission.
```

---

# 27. Security Rules

The Notification Service must obey all platform security rules.

Required:

```txt
verified PlatformContext
org-scoped queries
recipient-scoped queries
permission checks for administrative actions
no client-supplied orgId
no raw Prisma in modules
no module direct imports
no cross-tenant notification reads
no secret values in notifications
no full sensitive records in notification payloads
```

Notifications can leak sensitive information if poorly designed.

Example bad notification:

```txt
"Maria Santos was terminated. Salary: ₱80,000. Reason: confidential misconduct report."
```

Better:

```txt
"An employee record was updated."
```

or, if recipient has proper permission:

```txt
"Maria Santos' employment status was updated."
```

Notification content must be designed based on recipient permissions.

---

# 28. Privacy and PII

Notifications may contain personal data.

Potential PII:

```txt
employee names
customer names
supplier contact information
visitor names
incident descriptions
leave reasons
expense details
medical notes
phone numbers
email addresses
addresses
```

The future service must minimize what it stores.

Do not store large sensitive payloads in notifications.

Recommended future pattern:

```txt
Store concise display text + entity reference.
Fetch detailed entity data only after permission checks on click-through.
```

---

# 29. API Shape — Future Only

Do not implement these routes yet.

Possible future routes:

```txt
GET    /api/orgs/[orgSlug]/platform/notifications
POST   /api/orgs/[orgSlug]/platform/notifications/[id]/read
POST   /api/orgs/[orgSlug]/platform/notifications/read-all
DELETE /api/orgs/[orgSlug]/platform/notifications/[id]
GET    /api/orgs/[orgSlug]/platform/notification-settings
PATCH  /api/orgs/[orgSlug]/platform/notification-settings
```

All routes must:

```txt
return JSON only
use { data, error, meta? }
use API-safe auth helpers
create verified PlatformContext
reject client-supplied orgId
validate route params and body with Zod
scope by ctx.org.id and ctx.user.id
```

No notification API may use redirect-style auth.

---

# 30. SDK Shape — Future Only

Do not implement this SDK namespace yet.

Possible future server SDK:

```ts
sdk.notifications.listForCurrentUser(ctx, input)
sdk.notifications.markRead(ctx, notificationId)
sdk.notifications.markAllRead(ctx)
sdk.notifications.configure(ctx, input)
```

Possible internal service API:

```ts
NotificationService.createFromEvent(ctx, envelope)
NotificationService.create(ctx, input)
NotificationService.deliver(ctx, notificationId)
```

Direct module usage should be restricted.

Preferred:

```txt
Modules emit events.
Notification Service listens.
```

Direct notification creation may be allowed only for Kernel/system notices or clearly approved workflows.

---

# 31. UI Shape — Future Only

Do not implement notification UI yet.

Possible future UI:

```txt
notification bell in header
unread count badge
notification dropdown
notifications page
read/unread filters
notification preferences page
admin notification settings page
```

Design standards:

```txt
premium
minimal
data-dense
fast
keyboard-friendly
not noisy
not gamified
```

Notification UI must not make OneDayOS feel like a social app.

This is business software.

Notifications should be useful, calm, and actionable.

---

# 32. Real-Time Behavior

Do not implement real-time notification delivery initially.

Recommended future progression:

```txt
1. Load notifications on page render.
2. Refresh notifications after mutations where needed.
3. Add polling if necessary.
4. Add Supabase Realtime or another real-time mechanism only if proven useful.
```

Real-time is not free.

It increases complexity, connection usage, debugging cost, and support burden.

OneDayOS should not implement real-time notifications until there is clear user value.

---

# 33. Background Jobs

External notification delivery should eventually use background jobs.

Email and SMS should not be sent directly inside business transactions.

Future pattern:

```txt
business mutation commits
business event emitted
notification record created
background job sends email/SMS
status recorded
retry if necessary
```

But background jobs are deferred.

Do not introduce Redis, queues, workers, or job infrastructure just for hypothetical notifications.

---

# 34. Failure Behavior

Notification failures must not break business mutations.

Example:

```txt
Leave request submission succeeds.
Notification delivery fails.
Leave request must remain submitted.
Failure is logged/retried later.
```

If a notification is required for legal/business correctness, then it is not merely a notification and needs a different workflow design.

Rule:

```txt
Notifications are side effects.
They are not the source of truth for business state.
```

---

# 35. Notification Rules

The future service will need rules to decide which events create notifications.

Possible future rule shape:

```ts
type NotificationRule = {
  id: string
  eventName: string
  category: NotificationCategory
  recipientResolver: string
  templateId: string
  channels: NotificationChannel[]
  isEnabled: boolean
}
```

But do not build a generic rule engine too early.

Initial implementation can use explicit code-based rules inside the Notification Service.

Bad early abstraction:

```txt
User-configurable no-code notification rule builder.
```

Good early implementation:

```txt
A small set of typed notification handlers for proven events.
```

---

# 36. Recipient Resolvers

Recipient selection should be explicit.

Possible future resolver examples:

```txt
assigned_user
request_approver
entity_owner
branch_manager
department_manager
module_admin
organization_admin
mentioned_user
```

Do not hard-code fragile assumptions like:

```txt
notify all admins
notify first user in org
notify everyone with read permission
```

Recipient resolver behavior must be tested.

---

# 37. Module Enablement Rules

The Notification Service must respect module enablement.

If a module is disabled for an organization:

```txt
its listeners should not create notifications for that module's events
its notification routes should not be clickable
old notifications may remain visible only if their target remains meaningful
```

Future implementation must define whether old notifications from disabled modules are hidden, archived, or displayed as historical records.

Default recommendation:

```txt
Do not delete notifications when a module is disabled.
Do not create new notifications for disabled-module workflows.
Click-through may show MODULE_NOT_FOUND if the module is disabled.
```

---

# 38. Multi-Tenant Deployment Implication

OneDayOS uses one platform deployment and one shared tenant-scoped database.

Therefore:

```txt
Notification Service updates affect all clients using the platform.
Notification access is controlled by orgId, recipient, permissions, settings, and module enablement.
Notification feature rollout should use org/module settings or feature flags if needed.
```

Do not create per-client notification code forks.

Bad:

```txt
Client A custom notification code
Client B custom notification code
Client C custom notification code
```

Good:

```txt
One Notification Service
Per-org settings
Per-module rules
Per-user preferences
```

---

# 39. Configuration

Future Notification Service configuration may exist at multiple levels:

```txt
platform defaults
organization settings
module settings
user preferences
```

Order of precedence should be defined before implementation.

Possible future precedence:

```txt
platform safety rules
organization-level disabled channels
module-level notification defaults
user preferences
```

But avoid complex configuration early.

Initial notification behavior should be opinionated and simple.

---

# 40. Email Provider Decision

Do not choose an email provider in this document.

Provider selection requires a future ADR.

Potential factors:

```txt
deliverability
cost
Philippine business support
sender domain setup
API reliability
developer experience
bounce handling
logs
webhooks
Vercel compatibility
```

Do not let Claude casually install an email provider dependency.

---

# 41. SMS Provider Decision

Do not choose an SMS provider in this document.

SMS requires separate ADR because it affects:

```txt
cost
consent
message templates
Philippine number handling
provider reliability
spam compliance
support burden
```

SMS should not be part of MVP Notification Service unless a paid workflow proves it is essential.

---

# 42. FastAPI Decision

FastAPI must not be introduced for notifications.

The core platform backend remains:

```txt
Next.js route handlers
TypeScript
Supabase
PostgreSQL
Prisma
Vercel
```

Reasons not to use FastAPI here:

```txt
second backend runtime
second deployment path
second auth surface
second API contract style
more operational burden
more ambiguity for Claude
unnecessary for notifications
```

A future Python service may be considered only through ADR for highly specialized work such as AI document processing, not for core platform notifications.

---

# 43. Anti-Patterns

## 43.1 Sending Emails Directly from Module Services

Bad:

```ts
await sendEmail(manager.email, 'Leave request submitted')
```

inside `LeaveService`.

Why bad:

```txt
hard-coded delivery
no user preferences
no retry
no central status
no tenant-wide consistency
hard to change provider
hard to test
```

Better foundation-stage pattern:

```ts
await sdk.events.emit(ctx, 'leave.request.submitted', payload)
```

Future Notification Service can listen.

---

## 43.2 Notification Commands as Events

Bad:

```txt
notification.send_email
user.notify
send.manager.alert
```

Good:

```txt
leave.request.submitted
inventory.stock_level.reorder_threshold_crossed
incidents.incident.assigned
```

---

## 43.3 Notifying Everyone

Bad:

```txt
notify all users in organization
notify all admins for every event
```

Good:

```txt
notify the responsible approver
notify the assigned supervisor
notify users configured for that exception type
```

---

## 43.4 Notifications as Security Bypass

Bad:

```txt
User cannot access Purchase Request normally,
but notification includes all purchase details.
```

Good:

```txt
Notification contains minimal text.
Click-through route enforces permission before showing details.
```

---

## 43.5 Building a Rule Builder Too Early

Bad:

```txt
no-code notification automation builder
custom per-client notification scripts
workflow editor
email template designer
```

Good:

```txt
small typed notification handlers after proven use cases
```

---

## 43.6 Using Notifications as Audit Log

Bad:

```txt
Use Notification table to reconstruct who changed what.
```

Good:

```txt
Audit Log Service handles audit history.
Notification Service handles user alerts.
```

---

# 44. Future Implementation Phases

When the service is approved, implementation should likely happen in phases.

## Phase 1 — In-App Notifications Only

Possible scope:

```txt
Notification table
recipient-scoped list
read/unread state
notification bell
notification dropdown
basic click-through URL
manual typed event handlers for 3 proven use cases
two-org security tests
permission tests
```

No email.
No SMS.
No real-time.
No complex preferences.
No generic rule builder.

## Phase 2 — Preferences and Admin Settings

Possible scope:

```txt
user category preferences
org-level notification defaults
admin settings page
category/channel controls
```

## Phase 3 — Email Delivery

Possible scope:

```txt
email provider ADR
provider integration
background delivery jobs
retry behavior
delivery status
email templates
bounce handling
```

## Phase 4 — SMS / Push / Digests

Possible scope:

```txt
SMS provider ADR
urgent notification classification
digest settings
push notification feasibility
```

Each phase requires its own implementation document.

---

# 45. Future Testing Requirements

When implemented, Notification Service tests must include:

```txt
recipient can read own notification
recipient cannot read another user's notification
Org A user cannot read Org B notification
client-supplied orgId is rejected
unauthenticated API returns JSON 401
unauthorized admin setting update returns JSON 403
wrong-org access returns safe 404
notification list excludes soft-deleted/archived records
mark-as-read works only for recipient
mark-all-read scopes to current user and org
module-disabled behavior is correct
event handler creates notification only when rule matches
event handler does not create duplicate notification on retry
notification payload does not store sensitive full records
```

External channel tests later must include:

```txt
email send queued, not sent in transaction
retry behavior
failure status recorded
provider failure does not break business mutation
idempotency prevents duplicate sends
```

All tenant-sensitive tests must use at least two organizations.

Admin-only tests are insufficient.

---

# 46. Architecture Checks

Future implementation must pass architecture checks.

Forbidden patterns:

```txt
body.orgId
searchParams.get('orgId')
sdk.getDb(orgId)
import { prisma } from '@/kernel/db/client' inside modules
import '@/kernel/*' inside modules
import from another module
sendEmail(...) inside module service
notification event names as commands
full Prisma record in event payload
FastAPI notification route
```

The Notification Service itself may use approved server-only platform internals according to its future implementation document, but business modules may not.

---

# 47. Claude Implementation Rules

Claude must obey these rules:

```txt
Do not implement Notification Service from this document.
Do not add notification database tables.
Do not add notification UI.
Do not add email providers.
Do not add SMS providers.
Do not add notification SDK APIs.
Do not add background jobs.
Do not add FastAPI.
Do not place notification logic inside unrelated modules unless specifically scoped.
Do not convert business events into notification commands.
```

Claude may do the following now:

```txt
ensure modules emit clean business events
ensure event payloads are safe and typed
ensure module manifests declare emitted/listened events
ensure generator output supports event contracts
ensure tests verify event emission after successful mutations
```

Claude may implement Notification Service only when given a future frozen document such as:

```txt
10-platform-services/03-notification-service-implementation-phase-1.md
```

---

# 48. Acceptance Criteria for This Document

This document is acceptable when:

```txt
[ ] It clearly marks Notification Service as deferred.
[ ] It explains why notifications are not Kernel.
[ ] It explains why notifications are not Event Bus, Audit Log, Activity Feed, Approval Engine, or Workflow Engine.
[ ] It defines the Three Independent Use Cases trigger.
[ ] It requires an evidence log before promotion.
[ ] It defines future notification categories and channels without implementing them.
[ ] It defines tenant isolation requirements.
[ ] It defines recipient, privacy, and permission principles.
[ ] It rejects client-supplied orgId.
[ ] It keeps modules event-driven.
[ ] It avoids direct module-to-notification coupling.
[ ] It excludes FastAPI from core notifications.
[ ] It gives Claude explicit do-not-implement rules.
```

---

# 49. Final Decision

The Notification Service is an important future Platform Service, but it should not be built during the restarted foundation phase.

The correct current action is:

```txt
Build Kernel.
Build SDK.
Build Business Objects.
Build Module System.
Build secure generators.
Emit typed business events.
Defer Notification Service until three independent use cases prove the need.
```

Notifications should become a platform capability only when OneDayOS has enough real workflows to know what notifications actually need to do.

Until then:

```txt
Events first.
Notifications later.
```
