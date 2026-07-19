# OneDayOS Engineering Manual — 10 Platform Services / 02 Audit Log Service

**Document ID:** `10-platform-services/02-audit-log-service.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Deferred — Contract Only`  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
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
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/06-module-events.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`

---

# 1. Purpose

The Audit Log Service is the future OneDayOS Platform Service responsible for recording significant user, system, Business Object, and module actions in a tenant-scoped, searchable, durable, and trustworthy way.

Its long-term purpose is to answer questions like:

```txt
Who created this product?
Who edited this customer?
Who deleted this employee record?
Who approved this purchase request?
Who changed this setting?
Who enabled this module?
When did this happen?
From which organization?
From which user account?
What changed?
```

The Audit Log Service is important because OneDayOS will manage internal business operations for many SMEs. As clients grow, they will eventually need accountability, troubleshooting history, compliance support, support diagnostics, and operational transparency.

However, the Audit Log Service must **not** be implemented during the restarted foundation build unless explicitly approved by a later ADR.

For now, the required action is:

```txt
Emit stable events at mutation points now.
Build the Audit Log Service later when reuse is proven.
```

---

# 2. Implementation Status

```txt
Status: Deferred
Implementation allowed now: No
Event contract preparation allowed now: Yes
Schema preparation allowed now: No, unless approved by ADR
UI implementation allowed now: No
```

The restarted foundation build should include:

```txt
Kernel Event Bus interface
SDK event emission
Business Object mutation events
Module mutation events
```

It should not yet include:

```txt
AuditLog table
Audit Log UI
Audit Log search
Audit Log retention settings
Audit Log export
Audit Log event consumers
Audit Log Platform Service SDK
```

The reason is architectural discipline. Audit logging is very likely to become a Platform Service, but OneDayOS should still avoid building a heavy generic audit system before enough real module workflows exist.

---

# 3. Why Audit Logs Are Deferred

Audit logging sounds universally useful, but the correct shape depends on real usage.

Different modules may need different levels of detail:

```txt
Inventory:
- stock adjustment created
- stock movement reversed
- warehouse changed

CRM:
- customer updated
- deal stage changed
- lead converted

Leave:
- leave request submitted
- leave request approved
- leave request rejected

Purchasing:
- purchase request approved
- supplier changed
- purchase order cancelled

Settings:
- role permission changed
- module enabled
- subscription status changed
```

If we build the Audit Log Service too early, we may overbuild:

```txt
full before/after snapshots
field-level diff engine
custom audit categories
export engine
timeline UI
retention policies
tamper-proof storage
complex query builder
```

Some of those may be needed later. None should block the restarted Kernel, SDK, data, and module foundation.

---

# 4. Relationship to the Audit Event Rule

OneDayOS already requires mutation events.

The rule is:

```txt
Every mutation of a Business Object must emit an event.
```

This is not the same as building the Audit Log Service.

Current/foundation requirement:

```txt
Product created
  → emit objects.product.created
```

Future Audit Log Service:

```txt
objects.product.created
  → Audit Log listener consumes event
  → writes audit log row
  → audit log appears in UI/search/export
```

So the architecture is:

```txt
Business mutation
  ↓
Service transaction succeeds
  ↓
Event emitted through SDK
  ↓
Future Audit Log Service listener receives event
  ↓
AuditLog record created
```

The key point:

```txt
Mutation events are required now.
Audit persistence is deferred.
```

---

# 5. What the Audit Log Service Is

The Audit Log Service is a Platform Service that records meaningful system and business actions.

It should eventually provide:

```txt
tenant-scoped audit entries
actor identity
action name
entity reference
module/source namespace
timestamp
changed fields
safe metadata
request context
search/filter API
admin UI
entity timeline integration
export support
retention rules
support diagnostics
```

It should be accessed through the SDK:

```ts
sdk.audit.list(ctx, query)
sdk.audit.getForEntity(ctx, entityRef)
sdk.audit.recordSystemEvent(ctx, input)
```

However, direct `sdk.audit.*` APIs should not be added until this service is approved for implementation.

---

# 6. What the Audit Log Service Is Not

The Audit Log Service is not:

```txt
the Event Bus
the Activity Feed
the Notification Service
the Workflow Engine
the Approval Engine
the Reporting Engine
the Error Logger
the Analytics Service
a replacement for database backups
a replacement for permission enforcement
a replacement for tenant isolation
a place to store full business records
a generic JSON dumping ground
```

Important distinctions:

| Concept | Purpose |
|---|---|
| Event Bus | Communicates facts between platform parts |
| Audit Log | Persists important actions for accountability |
| Activity Feed | User-facing narrative timeline |
| Notification Service | Tells users something needs attention |
| Error Logging | Captures technical failures |
| Reporting | Aggregates operational/business data |

The Audit Log may eventually feed Activity Feed, Reporting, Search, AI, or Support tools, but it should not become all of them.

---

# 7. Trigger for Implementation

The Audit Log Service should be implemented only after one of these triggers happens:

## 7.1 Three Independent Use Cases Trigger

Audit logging becomes necessary across at least three independent use cases, such as:

```txt
Use case 1: Business Object changes need traceability
Use case 2: Approval decisions need traceability
Use case 3: Settings/permission changes need traceability
```

or:

```txt
Use case 1: Inventory adjustments
Use case 2: Leave approvals
Use case 3: Purchasing approvals
```

## 7.2 Commercial Trigger

A paying client explicitly requires audit logs as part of a module purchase or AppCare requirement, and the need is likely reusable.

## 7.3 Security Trigger

A security incident, support incident, or production readiness review concludes that durable audit history is required before onboarding additional clients.

## 7.4 Support Trigger

AppCare support becomes difficult because the team cannot answer:

```txt
Who changed this?
When did this happen?
Was this deleted or edited?
Was this caused by a user or system process?
```

---

# 8. Evidence Log Requirement

Before implementation, create an evidence log.

Example:

```md
# Platform Service Candidate: Audit Log

## Capability
Durable audit trail for user/system mutations.

## Evidence

### Use Case 1
Module/Area: Business Objects
Action: Product updated
Need: User wants to know who changed product details.

### Use Case 2
Module/Area: Settings / Permissions
Action: Role permissions changed
Need: Admin wants accountability for access changes.

### Use Case 3
Module/Area: Purchasing / Approvals
Action: Purchase request approved
Need: Manager wants approval history.

## Decision
Promote to Platform Service.

## Reason
Same accountability pattern appears across at least three independent use cases.

## Alternatives
- Keep module-local audit tables
- Use event logs only
- Use database triggers

## Recommendation
Implement centralized Audit Log Service consuming SDK events.
```

No implementation should begin without this evidence log or an explicit founder override.

---

# 9. Architectural Position

The Audit Log Service belongs here:

```txt
Kernel
  ↓
Business Objects
  ↓
Platform Services
      └── Audit Log Service
  ↓
Business Modules
  ↓
Client Configuration
```

The Audit Log Service may depend on:

```txt
SDK
PlatformContext
Event Bus
Database access through sdk.getDb(ctx)
Kernel auth/user/org concepts
Business Object event contracts
Module event contracts
```

The Audit Log Service must not depend on:

```txt
Inventory internals
CRM internals
Leave internals
Purchasing internals
module service classes
module Prisma access shortcuts
client-specific code
FastAPI backend services
```

---

# 10. Access Pattern

The future service should be SDK-accessed.

Allowed future pattern:

```ts
import { sdk } from '@/sdk/server'

const auditEntries = await sdk.audit.list(ctx, {
  entityType: 'product',
  entityId: productId,
})
```

Forbidden pattern:

```ts
import { AuditLogService } from '@/platform-services/audit-log/service'
```

Also forbidden:

```ts
import { prisma } from '@/kernel/db/client'
await prisma.auditLog.findMany(...)
```

Business modules should not import Audit Log internals.

---

# 11. Tenant Model

Audit logs are tenant-scoped.

Every audit entry must belong to exactly one organization.

Future audit table must include:

```txt
orgId
```

However, code should not accept `orgId` from the client or event payload.

Correct source of tenant identity:

```txt
verified PlatformContext
```

The future Audit Log Service should receive:

```ts
PlatformContext
```

not:

```ts
orgId: string
```

Correct future method shape:

```ts
sdk.audit.list(ctx, query)
sdk.audit.record(ctx, input)
```

Incorrect future method shape:

```ts
sdk.audit.list(orgId, query)
sdk.audit.record(orgId, input)
```

---

# 12. Actor Model

Every audit entry should identify who or what caused the action.

Potential actor types:

```txt
user
system
import
migration
automation
ai
support
```

MVP future actor model:

```ts
type AuditActor = {
  type: 'user' | 'system'
  userId?: string
  displayName?: string
}
```

Later actor types can be added only with ADR or service amendment.

Rules:

```txt
If a human user caused the action, record user actor.
If the system caused the action, record system actor.
If the action originated from AI, record the human user plus AI metadata later.
Do not store secrets or raw session tokens.
Do not rely only on display names.
```

Actor identity should be derived from `PlatformContext`, not from request body.

---

# 13. Entity Reference Model

Audit entries must identify the affected entity without requiring direct dependency on module tables.

Recommended future entity reference:

```ts
type AuditEntityRef = {
  namespace: string       // "objects", "inventory", "kernel"
  entity: string          // "product", "stock_adjustment", "role"
  entityId: string
  display?: string
}
```

Examples:

```json
{
  "namespace": "objects",
  "entity": "product",
  "entityId": "prod_123",
  "display": "SKU-001 — Bond Paper"
}
```

```json
{
  "namespace": "inventory",
  "entity": "stock_adjustment",
  "entityId": "adj_123",
  "display": "Adjustment #ADJ-0001"
}
```

```json
{
  "namespace": "kernel",
  "entity": "role",
  "entityId": "role_123",
  "display": "Warehouse Staff"
}
```

The Audit Log Service should not require foreign keys to every possible module table in MVP. That would create tight coupling.

Prefer generic entity references.

---

# 14. Event Consumption Model

The future Audit Log Service should primarily consume SDK events.

Example:

```ts
sdk.events.on('objects.product.created', async (event) => {
  await sdk.audit.record(event.ctx, {
    action: 'created',
    source: event.name,
    entity: {
      namespace: 'objects',
      entity: 'product',
      entityId: event.payload.productId,
    },
    changedFields: [],
  })
})
```

But implementation should not be done now.

Current requirement is only:

```txt
Ensure events are emitted consistently.
Ensure event envelopes include enough metadata for future audit logging.
```

---

# 15. Event Envelope Requirements for Future Auditability

Existing SDK events should be designed so the future Audit Log Service can work without retrofitting all modules.

The event envelope should eventually include:

```ts
type EventEnvelope<TPayload> = {
  id: string
  name: string
  occurredAt: Date
  ctx: PlatformContext
  actor: {
    type: 'user' | 'system'
    userId?: string
  }
  payload: TPayload
  source: {
    namespace: string
    module?: string
    service?: string
  }
}
```

For now, the SDK Events document is authoritative. This Audit Log document only states what audit logging will need from events later.

---

# 16. What Should Be Audited Eventually

The future Audit Log Service should eventually record:

## 16.1 Kernel Actions

```txt
organization.created
organization.updated
organization.suspended
organization.reactivated
user.invited
user.created
user.deactivated
role.created
role.updated
role.deleted
permission.granted
permission.revoked
module.enabled
module.disabled
setting.updated
subscription.updated
```

## 16.2 Business Object Actions

```txt
objects.employee.created
objects.employee.updated
objects.employee.deactivated
objects.employee.reactivated
objects.employee.deleted
objects.employee.restored

objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored

objects.customer.created
objects.customer.updated
objects.customer.deleted
objects.customer.restored

objects.supplier.created
objects.supplier.updated
objects.supplier.deleted
objects.supplier.restored

objects.warehouse.created
objects.warehouse.updated
objects.warehouse.deactivated
objects.warehouse.reactivated
objects.warehouse.deleted
objects.warehouse.restored
```

## 16.3 Module Actions

Examples:

```txt
inventory.stock_adjustment.created
inventory.stock_adjustment.approved
inventory.stock_movement.created
leave.request.submitted
leave.request.approved
leave.request.rejected
purchasing.purchase_request.created
purchasing.purchase_request.approved
expenses.claim.submitted
expenses.claim.approved
```

Module actions should be added based on module specs, not guessed globally.

---

# 17. What Should Not Be Audited by Default

Avoid noisy audit logs.

Do not audit by default:

```txt
page views
sidebar clicks
table sorting
filter changes
search input typing
form field focus/blur
normal list reads
normal detail reads
hover interactions
client-side validation failures
temporary UI state changes
```

Read events should be audited only if a future security/privacy requirement demands it.

Examples that may require read auditing later:

```txt
exporting employee data
viewing salary data
viewing confidential incident reports
viewing government ID fields
viewing sensitive attachments
```

Those are not MVP requirements.

---

# 18. Future Database Model

When implemented, the likely model is:

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  orgId       String

  occurredAt  DateTime @default(now())

  actorType   String   // "user" | "system" | future: "import" | "automation" | "ai"
  actorUserId String?

  source      String   // event name, e.g. "objects.product.updated"
  namespace   String   // "objects" | "kernel" | "inventory"
  module      String?  // "inventory" if module-owned

  entityType  String   // "product", "customer", "stock_adjustment"
  entityId    String?
  entityLabel String?

  action      String   // "created" | "updated" | "deleted" | "approved"

  changedFields Json?
  metadata      Json?

  requestId   String?
  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  org Organization @relation(fields: [orgId], references: [id])

  @@index([orgId, occurredAt])
  @@index([orgId, namespace, entityType, entityId])
  @@index([orgId, actorUserId])
  @@index([orgId, source])
  @@map("audit_logs")
}
```

This schema is not yet approved for migration. It is a recommended future shape only.

---

# 19. Immutability Rule

Audit entries should be append-only.

After an audit entry is created:

```txt
it should not be updated during normal operation
it should not be soft-deleted during normal operation
it should not be hard-deleted except through retention/maintenance policy
```

Why:

```txt
An audit log that users can freely edit is not an audit log.
```

Future implementation should avoid normal update/delete APIs for audit entries.

If corrections are needed, create a new audit entry:

```txt
audit.entry.corrected
```

This is deferred.

---

# 20. Retention Policy

Retention should not be implemented in MVP.

Future default:

```txt
Keep audit logs for at least the active customer lifecycle.
```

Future configurable retention may include:

```txt
90 days
180 days
1 year
3 years
forever while subscription is active
```

But this has cost and compliance implications. It requires a future ADR.

For now:

```txt
Do not promise specific audit retention in AppCare until the service exists.
```

---

# 21. Sensitive Data Rules

Audit logs must not store secrets or unnecessarily sensitive data.

Forbidden in audit metadata:

```txt
passwords
password reset tokens
session tokens
Supabase service role keys
API keys
raw cookies
full request headers
full request bodies
credit card details
bank account details
full government IDs
private file contents
```

Avoid full before/after snapshots by default.

Preferred update payload:

```json
{
  "changedFields": ["name", "unit", "categoryId"]
}
```

Avoid:

```json
{
  "before": { "full": "record" },
  "after": { "full": "record" }
}
```

If future modules need field-level before/after values, add explicit redaction rules first.

---

# 22. Changed Fields Model

For update events, use `changedFields`.

Example:

```json
{
  "productId": "prod_123",
  "changedFields": ["name", "unit"]
}
```

This is safer and more stable than storing full records.

Future display:

```txt
Juan updated Product SKU-001
Changed: name, unit
```

If a future UI needs exact before/after values, implement a controlled diff policy with redaction.

---

# 23. API Contract

Future audit APIs should follow the Kernel API contract.

Potential future routes:

```txt
GET /api/orgs/[orgSlug]/platform/audit
GET /api/orgs/[orgSlug]/platform/audit/[id]
GET /api/orgs/[orgSlug]/platform/audit/entity/[namespace]/[entity]/[entityId]
```

Response shape:

```json
{
  "data": [],
  "error": null,
  "meta": {
    "pagination": {
      "cursor": "next_cursor"
    }
  }
}
```

Errors must use JSON only:

```txt
401 UNAUTHENTICATED
403 FORBIDDEN
404 ORG_NOT_FOUND
400 VALIDATION_ERROR
```

No redirects. No HTML.

---

# 24. Permissions

Future permissions:

```txt
platform.audit.read
platform.audit.export
```

Possible future permission objects:

```ts
{
  module: 'platform',
  resource: 'audit',
  action: 'read'
}
```

```ts
{
  module: 'platform',
  resource: 'audit',
  action: 'export'
}
```

Rules:

```txt
Audit read permission does not grant access to underlying business records.
Audit export should be separate from audit read.
Admin wildcard may include audit access only within verified tenant.
Tenant isolation is always enforced before permissions.
```

Potential concern:

A user might have permission to view audit logs but not view the underlying entity. The future UI must handle this safely.

Example:

```txt
User can see:
"System updated confidential incident report"

But cannot click through to the incident record if they lack incident permission.
```

This requires careful design later.

---

# 25. UI Requirements

Future audit UI should be implemented only after the Design System and Platform Service are approved.

Potential screens:

```txt
Organization Settings → Audit Log
Entity Detail → Activity/Audit tab
Admin Support → Recent security-sensitive actions
```

The audit UI should support:

```txt
date range filter
actor filter
entity filter
module/source filter
action filter
search by entity label
pagination / cursor loading
safe empty state
export button if permitted
```

It should not initially include:

```txt
complex report builder
graph visualization
tamper-proof notarization
field-level diff viewer
AI summarization
```

Those are future enhancements.

---

# 26. Relationship to Activity Feed

Audit Log and Activity Feed are related but not identical.

Audit Log:

```txt
administrator-facing
accountability-oriented
complete enough for traceability
precise
less narrative
```

Activity Feed:

```txt
user-facing
timeline-oriented
collaboration-oriented
summarized
more readable
```

One future path:

```txt
AuditLog records
  ↓
Activity Feed presentation layer
```

But do not build Activity Feed now.

---

# 27. Relationship to Notifications

Audit logs should not notify users directly.

Incorrect:

```txt
AuditLogService writes row and emails manager
```

Correct future pattern:

```txt
business event emitted
  ↓
Audit Log listener records action
  ↓
Notification listener decides whether to notify
```

Audit and notification concerns must remain separate.

---

# 28. Relationship to Search and AI

Future Search and AI may use audit logs.

Examples:

```txt
"Show me recent changes to this customer"
"Who deleted this product?"
"What happened to stock yesterday?"
```

But AI must not bypass audit permissions.

Future AI access to audit logs must check:

```txt
tenant membership
module enablement if relevant
audit read permission
underlying entity permission when showing sensitive details
```

Do not implement AI audit queries now.

---

# 29. Request Context

Future audit logs may include request context for security/support.

Possible metadata:

```txt
requestId
ipAddress
userAgent
route
method
```

Rules:

```txt
Do not store raw cookies.
Do not store authorization headers.
Do not store full request bodies.
Do not trust client-provided IP headers without deployment review.
```

Request context should be captured by Kernel/API wrappers, not manually in every module.

---

# 30. Performance Considerations

Audit logging must not make normal mutations feel slow.

Future options:

## 30.1 Synchronous Insert

Simple and reliable:

```txt
Business mutation succeeds
Audit row inserted
Response returned
```

Good for early implementation, but may add latency.

## 30.2 Event Consumer Insert

Preferred initial Platform Service shape:

```txt
Business mutation succeeds
Event emitted
Audit listener writes row
```

This may still be in-process at first.

## 30.3 Outbox / Queue

Future durable pattern:

```txt
Business mutation writes outbox event in transaction
Background worker processes event
Audit row created
```

This is more reliable but should wait until background jobs exist.

Do not build the queue prematurely.

---

# 31. Transaction Boundary

Important question:

```txt
Should audit rows be written in the same transaction as the mutation?
```

Future decision:

- For critical security actions, maybe yes.
- For normal business events, maybe event-driven after commit is acceptable.
- For durable correctness, outbox pattern is best later.

MVP future recommendation:

```txt
When Audit Log Service is first implemented, record via event listener.
For critical Kernel security changes, consider direct audit insert through Kernel service.
```

This requires a future ADR before implementation.

---

# 32. Failure Behavior

Audit logging failure should be handled carefully.

Default future rule:

```txt
Audit listener failure should not break normal business mutation.
```

Exception candidates:

```txt
permission changes
role changes
organization suspension
subscription changes
security-sensitive admin actions
```

For those, failure to audit might need to fail the original action.

This is not decided yet. It requires an implementation ADR.

For now, event listener failures should be logged and surfaced to monitoring when observability exists.

---

# 33. Idempotency

Future audit consumers must avoid duplicate audit entries.

Potential idempotency source:

```txt
event.id
```

Future `AuditLog` table may include:

```txt
eventId String? @unique
```

Recommended future model addition:

```prisma
eventId String? @unique
```

This is not required until event persistence/outbox exists.

---

# 34. Import and Bulk Operation Auditing

Bulk imports should not create unmanageable audit noise.

Bad:

```txt
10,000 imported products
→ 10,000 separate user-visible audit rows only
```

Better:

```txt
products.imported
  metadata: {
    count: 10000,
    created: 9800,
    updated: 200,
    failed: 12
  }
```

But individual row-level audit may still be useful for restore/debugging.

Future import engine should define this policy.

Do not decide now.

---

# 35. Soft Delete and Restore

Soft delete events should be audit-friendly.

Expected future events:

```txt
objects.product.deleted
objects.product.restored
objects.customer.deleted
objects.customer.restored
```

Audit display:

```txt
Maria deleted Product SKU-001
Maria restored Product SKU-001
```

Audit logs themselves should not use normal soft delete.

Audit logs are append-only.

---

# 36. Security Boundaries

The Audit Log Service must respect all OneDayOS security rules:

```txt
tenant isolation first
API auth returns JSON only
verified PlatformContext required
no client-supplied orgId
permission enforcement required
SDK-only module access
no raw Prisma in modules
no direct module imports
no FastAPI core backend
```

Audit logs must not become a side channel for data leakage.

Example risk:

```txt
User cannot see salary data,
but audit log says:
"Salary changed from ₱50,000 to ₱80,000"
```

Therefore:

```txt
Do not store sensitive before/after values by default.
Redact sensitive fields.
Check permissions before showing entity labels/details.
```

---

# 37. Multi-Tenant Safety

Audit queries must always be tenant-scoped.

Forbidden:

```ts
await db.auditLog.findMany({
  where: { entityId }
})
```

Required:

```ts
await db.auditLog.findMany({
  where: {
    orgId: ctx.org.id,
    entityId,
  }
})
```

But module/business code should still use SDK service methods instead of raw queries.

---

# 38. Future Service Interface

Recommended future interface:

```ts
type AuditQuery = {
  actorUserId?: string
  namespace?: string
  module?: string
  entityType?: string
  entityId?: string
  action?: string
  source?: string
  occurredFrom?: Date
  occurredTo?: Date
  cursor?: string
  limit?: number
}

type RecordAuditInput = {
  source: string
  namespace: string
  module?: string
  entityType: string
  entityId?: string
  entityLabel?: string
  action: string
  changedFields?: string[]
  metadata?: Record<string, unknown>
}

interface AuditService {
  list(ctx: PlatformContext, query: AuditQuery): Promise<PaginatedAuditLogs>
  getById(ctx: PlatformContext, id: string): Promise<AuditLog | null>
  getForEntity(ctx: PlatformContext, ref: AuditEntityRef): Promise<AuditLog[]>
  record(ctx: PlatformContext, input: RecordAuditInput): Promise<void>
}
```

Do not implement this now.

---

# 39. Future SDK Surface

Future SDK addition:

```ts
sdk.audit = {
  list,
  getById,
  getForEntity,
  record,
}
```

But `record` should probably be reserved for Platform Services and Kernel internals, not business modules.

Business modules should normally emit business events. The Audit Log listener records audit entries.

Allowed in module service:

```ts
await sdk.events.emit(ctx, INVENTORY_EVENTS.STOCK_ADJUSTMENT_CREATED, payload)
```

Usually forbidden in module service:

```ts
await sdk.audit.record(ctx, ...)
```

Exception requires architecture review.

---

# 40. Why Modules Should Not Write Audit Logs Directly

If modules write audit logs directly, the platform will get inconsistent audit data.

Bad pattern:

```txt
Inventory writes one audit shape
CRM writes another audit shape
Leave forgets to write audit
Purchasing writes too much sensitive data
```

Correct pattern:

```txt
Modules emit stable events.
Audit Log Service consumes events consistently.
```

This keeps auditing centralized and reusable.

---

# 41. Event-to-Audit Mapping

When implemented, the service should define mapping files.

Example:

```txt
src/platform-services/audit-log/mappings/objects.ts
src/platform-services/audit-log/mappings/kernel.ts
src/platform-services/audit-log/mappings/inventory.ts
```

But be careful: mapping modules must not import module internals.

Allowed:

```ts
import { INVENTORY_EVENTS } from '@/modules/inventory/events'
```

Potentially acceptable if event constants are shared-safe and do not import services.

Forbidden:

```ts
import { InventoryService } from '@/modules/inventory/service'
```

This needs review when implemented.

---

# 42. Interaction with Module Enablement

If a module is disabled for an organization, its old audit logs should not disappear.

Example:

```txt
Client used Inventory for 6 months.
Inventory later disabled.
Audit history for previous Inventory actions should remain accessible to admins.
```

But UI links to disabled module records may not work.

The audit UI should handle this:

```txt
"Inventory module is currently disabled."
```

No implementation now.

---

# 43. Interaction with Deleted Records

Audit logs should remain even after the target record is soft-deleted.

Example:

```txt
Product deleted
Audit log remains
Entity link may show deleted/restored state
```

If entity is hard-deleted by a legal/retention process later, audit logs may need redaction. This requires future policy.

---

# 44. AppCare Implications

Audit logs may become valuable for AppCare:

```txt
support investigation
client training
dispute resolution
bug diagnosis
security review
```

But AppCare should not promise audit log availability until the service is implemented and tested.

Current AppCare language should avoid:

```txt
Complete audit trail included
```

Until it exists.

Acceptable future language after implementation:

```txt
Activity and audit history for supported modules
```

Exact claims require founder approval.

---

# 45. Observability vs Audit

Do not confuse technical logs with audit logs.

Technical logs:

```txt
server error
database timeout
API latency
failed request
```

Audit logs:

```txt
user updated product
admin changed permission
system disabled module
```

Both matter. They serve different users.

---

# 46. Testing Requirements When Implemented

When implementation is approved, tests must include:

## 46.1 Tenant Isolation

```txt
Org A admin cannot read Org B audit logs.
Org A audit query never returns Org B entries.
Wrong org slug returns safe 404.
```

## 46.2 Permission Enforcement

```txt
User without platform.audit.read gets 403.
User with platform.audit.read can list audit entries.
User without platform.audit.export cannot export audit entries.
```

## 46.3 Event Consumption

```txt
objects.product.created event creates audit entry.
objects.product.updated event records changedFields.
failed mutation does not create audit entry.
listener failure is handled according to policy.
```

## 46.4 Sensitive Data

```txt
password fields are not stored.
tokens are not stored.
sensitive fields are redacted.
full Prisma records are rejected.
```

## 46.5 API Contract

```txt
Unauthenticated request returns 401 JSON.
Forbidden request returns 403 JSON.
Validation errors return VALIDATION_ERROR JSON.
No redirects.
No HTML.
```

## 46.6 Immutability

```txt
No normal update API exists for audit entries.
No normal delete API exists for audit entries.
Retention deletion path is separate if implemented.
```

---

# 47. Architecture Checks

Future `check:architecture` should eventually detect:

```txt
modules calling sdk.audit.record directly
modules importing audit service internals
audit queries without orgId/ctx
audit code accepting orgId from request body
audit code storing full request bodies
audit code storing known secret keys
```

This is deferred.

---

# 48. Claude Implementation Rules

Claude must follow these rules:

```txt
Do not implement Audit Log Service from this document alone.
Do not create AuditLog Prisma model unless explicitly instructed.
Do not create audit UI unless explicitly instructed.
Do not add sdk.audit unless implementation is approved.
Do not add FastAPI or Python services.
Do not write audit logs directly from modules.
Do not store full before/after records without redaction policy.
Do not accept client-supplied orgId.
Do not bypass PlatformContext.
Do not import module services into Audit Log Service.
Do not make audit logging a replacement for events.
```

If asked to implement audit logging, Claude must first be given:

```txt
approved evidence log
approved ADR
approved Audit Log implementation spec
approved database migration plan
approved security test plan
```

---

# 49. Anti-Patterns

## 49.1 Module-Local Audit Tables

Bad:

```txt
inventory_audit_logs
crm_audit_logs
leave_audit_logs
```

Why bad:

```txt
duplicated logic
inconsistent shape
hard to search globally
hard to support AppCare
hard to build AI/support tools later
```

## 49.2 Full Record Snapshots by Default

Bad:

```json
{
  "before": { "entire": "record" },
  "after": { "entire": "record" }
}
```

Why bad:

```txt
PII leakage
large storage cost
schema fragility
hard redaction
```

## 49.3 Audit as Event Bus

Bad:

```txt
Other modules watch audit logs to trigger business behavior.
```

Why bad:

```txt
audit is persistence, not workflow coordination
```

Use Event Bus for coordination.

## 49.4 Audit as Notification

Bad:

```txt
Audit log writes send notifications directly.
```

Use Notification Service later.

## 49.5 Audit as Security Boundary

Bad:

```txt
We do not need permission checks because audit will show abuse.
```

Audit does not prevent abuse. Authorization prevents abuse.

---

# 50. Future Implementation Phases

When approved, implement in phases:

## Phase 1 — Passive Event-to-Audit MVP

```txt
AuditLog table
core audit service
event listeners for Business Objects
admin list UI
tenant isolation tests
permission tests
```

## Phase 2 — Kernel Security Actions

```txt
role changes
permission changes
module enable/disable
settings changes
subscription changes
```

## Phase 3 — Module Integrations

```txt
Inventory
Leave
Purchasing
Expenses
CRM
```

## Phase 4 — Entity Timelines

```txt
Product timeline
Customer timeline
Employee timeline
Module record timeline
```

## Phase 5 — Export and Retention

```txt
CSV export
retention policy
admin restore diagnostics
support tooling
```

## Phase 6 — Search / AI / Reporting Integration

```txt
audit search
AI questions over audit history
support summaries
incident investigation tools
```

---

# 51. Minimal Foundation Requirements Now

Even though Audit Log Service is deferred, the restarted foundation must still do these now:

```txt
Business Object services emit events.
Module services emit events.
Event names follow naming contract.
Event payloads are small and stable.
Event payloads avoid full records and secrets.
Events use PlatformContext.
Event envelopes include actor and tenant context through ctx.
Mutations emit events only after success.
Failed mutations do not emit success events.
```

This is enough to make the future Audit Log Service possible without retrofitting every module.

---

# 52. Acceptance Criteria for This Document

This document is ready for founder approval when:

```txt
[ ] It clearly marks Audit Log Service as deferred.
[ ] It explains the difference between events and audit logs.
[ ] It defines the future purpose of audit logs.
[ ] It defines what should and should not be audited.
[ ] It requires PlatformContext and tenant isolation.
[ ] It forbids client-supplied orgId.
[ ] It avoids full sensitive snapshots by default.
[ ] It defines future permissions.
[ ] It defines future API/UI direction.
[ ] It includes implementation triggers.
[ ] It includes Claude rules.
[ ] It does not authorize implementation by itself.
```

---

# 53. Final Architectural Position

The Audit Log Service is very likely to become one of OneDayOS’s most important Platform Services.

But it should not be built prematurely.

The correct strategy is:

```txt
Now:
  Emit clean, stable, tenant-scoped events.

Later:
  Promote Audit Log Service when evidence proves the need.

Always:
  Keep audit logging centralized, SDK-accessed, tenant-safe, permission-aware, and separate from notifications, activity feeds, reporting, and workflow logic.
```

Audit logging should become a powerful advantage for OneDayOS, but only if it is built on top of clean events, verified `PlatformContext`, strict tenant isolation, and consistent module boundaries.
