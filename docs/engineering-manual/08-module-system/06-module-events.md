# OneDayOS Engineering Manual — 08 Module System / 06 Module Events

**Document ID:** `08-module-system/06-module-events.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT (GPT-5.5), acting as OneDayOS founding software architect  
**Date:** July 2026  
**Implementation Allowed:** No — implementation may begin only after this document is reviewed, approved, and marked `Frozen`.

---

# 1. Purpose

This document defines how **OneDayOS business modules participate in the platform event system**.

OneDayOS modules must not call each other directly. They communicate by publishing events and, when appropriate, subscribing to events published by other parts of the platform.

This document covers:

- What module events are.
- What module events are not.
- Who owns event names.
- How event names are structured.
- How event payloads are shaped.
- Where events are emitted.
- Where listeners are registered.
- How module enablement affects listeners.
- How event failures are handled.
- How events are tested.
- What Claude Code is allowed to implement.

This document does **not** replace the SDK Events document. The SDK Events document defines the underlying event API. This document defines the module-level rules for using that API correctly.

---

# 2. Core Principle

The core rule is:

```txt
Modules communicate through events, never through direct imports or direct service calls.
```

A module may emit:

```txt
inventory.stock_movement.created
```

Another module or future Platform Service may listen.

But Inventory must not directly call:

```ts
NotificationService.sendLowStockAlert(...)
PurchasingService.createPurchaseRequest(...)
SearchService.indexInventoryRecord(...)
```

That kind of coupling would destroy the platform architecture.

---

# 3. Events Are Facts, Not Commands

A OneDayOS event represents a fact that already happened.

Good:

```txt
inventory.stock_movement.created
leave.leave_request.submitted
purchasing.purchase_request.approved
objects.product.updated
crm.lead.converted
```

Bad:

```txt
inventory.create_stock_movement
leave.submit_leave_request
notification.send_email
search.reindex_product
purchasing.make_purchase_order
```

The difference matters.

A command asks another part of the system to do something.

An event says something already happened.

Modules should publish facts. Other parts of the platform may react to those facts.

---

# 4. Relationship to the SDK Event System

The SDK event system is the only allowed interface for emitting or subscribing to events.

Allowed:

```ts
import { sdk } from '@/sdk/server'

await sdk.events.emit(ctx, eventName, payload)
```

Forbidden:

```ts
import { bus } from '@/kernel/events/bus'
import { EventBus } from '@/kernel/events/bus'
import { redis } from '@/kernel/queue'
import { prisma } from '@/kernel/db/client'
```

Modules must not import the Kernel event bus directly.

Today, the event system may be in-process.

Later, it may become:

```txt
in-process bus
→ transactional outbox
→ background job queue
→ durable event stream
```

Module code must not care. The SDK is the boundary.

---

# 5. Scope

This document applies to:

```txt
Business Modules
Module-owned entities
Module-owned services
Module-owned APIs
Module event declarations
Module event handlers
Module generator output
```

Examples:

```txt
Inventory
Leave
CRM
Purchasing
Expenses
Assets
Visitor Management
Incident Reporting
Reservations
Projects
```

This document also covers how modules listen to:

```txt
kernel.*
objects.*
other-module.*
```

events, but only through formal event subscriptions.

---

# 6. Non-Goals

This document does not implement:

```txt
Audit Log Service
Notification Service
Search indexing
AI memory/indexing
Reporting projections
Workflow Engine
Approval Engine
Background job queue
External webhooks
Third-party integrations
Durable event outbox
Event replay
```

Those are future Platform Services or infrastructure capabilities.

This document ensures that when those capabilities are eventually built, existing modules will already emit clean, stable events.

---

# 7. Event Namespaces

OneDayOS uses these event namespaces:

| Namespace | Owner | Example |
|---|---|---|
| `kernel` | Kernel | `kernel.user.invited` |
| `objects` | Business Objects layer | `objects.product.created` |
| Module ID | Business Module | `inventory.stock_movement.created` |
| Platform Service ID | Future Platform Service | `approval.request.approved` |

Modules must use their module ID as namespace.

Examples:

```txt
inventory.stock_movement.created
leave.leave_request.submitted
crm.lead.converted
expenses.expense_claim.approved
assets.asset.assigned
visitors.visit.checked_in
incidents.incident.reported
```

A module must not emit events in another module's namespace.

Forbidden:

```txt
Inventory emitting purchasing.purchase_request.created
CRM emitting objects.customer.created directly
Leave emitting hr.employee.updated
```

Only the owning layer may emit its own events.

---

# 8. Event Naming Convention

All events must follow:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Where:

```txt
namespace = kernel | objects | moduleId | future platform service ID
entity = snake_case business noun
past_tense_verb = past-tense business event
```

Examples:

```txt
inventory.stock_movement.created
inventory.stock_adjustment.submitted
inventory.stock_adjustment.approved
inventory.stock_adjustment.rejected
inventory.stock_level.low_detected

leave.leave_request.submitted
leave.leave_request.approved
leave.leave_request.rejected
leave.leave_request.cancelled

crm.lead.created
crm.lead.converted
crm.opportunity.won
crm.opportunity.lost

purchasing.purchase_request.submitted
purchasing.purchase_request.approved
purchasing.purchase_request.rejected

objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored
```

---

# 9. Avoid State-Only Event Names

An event name should describe what happened, not merely the resulting state.

Avoid:

```txt
inventory.stock_level.low
leave.leave_request.pending
crm.opportunity.closed
```

Prefer:

```txt
inventory.stock_level.low_detected
leave.leave_request.submitted
crm.opportunity.won
crm.opportunity.lost
```

A previous shorthand like:

```txt
inventory.stock_level.low
```

is understandable conversationally, but the final implementation contract should use a past-tense event name:

```txt
inventory.stock_level.low_detected
```

or, if more precise:

```txt
inventory.stock_level.reorder_threshold_crossed
```

The platform should be strict here because event names become long-lived API contracts.

---

# 10. Forbidden Event Name Patterns

Forbidden:

```txt
camelCase:
inventory.stockMovement.created

PascalCase:
Inventory.StockMovement.Created

Imperative commands:
inventory.create_stock_movement
notification.send_email

Ambiguous verbs:
inventory.stock.changed
crm.customer.processed

Generic events:
module.record.updated
system.event.created

Abbreviations:
inv.prod.created
pur.po.appr

Names without ownership:
product.created
customer.updated
```

Every event name should be clear enough that a future engineer can understand its source and meaning without reading the implementation.

---

# 11. Event Ownership

The layer that owns the entity owns the event.

## 11.1 Business Object Events

Business Object events use the `objects` namespace.

Examples:

```txt
objects.employee.created
objects.product.updated
objects.customer.deleted
objects.supplier.restored
objects.warehouse.deactivated
```

Inventory must not emit:

```txt
inventory.product.created
```

because Inventory does not own Product.

If Inventory creates a Product through the Business Object service, the Business Object service emits:

```txt
objects.product.created
```

If Inventory then creates inventory-specific metadata for that Product, Inventory may emit:

```txt
inventory.product_extension.created
```

## 11.2 Module-Owned Entity Events

Module-owned entities use the module namespace.

Examples:

```txt
inventory.stock_movement.created
inventory.stock_adjustment.approved
leave.leave_request.submitted
crm.lead.converted
expenses.expense_claim.rejected
```

## 11.3 Kernel Events

Kernel events use the `kernel` namespace.

Examples:

```txt
kernel.user.created
kernel.user.deactivated
kernel.organization.created
kernel.module.enabled
kernel.module.disabled
```

Business modules may listen to Kernel events only through approved subscriptions.

They must not emit Kernel events.

---

# 12. Event Payload Rule

Event payloads must be:

```txt
Small
Stable
Serializable
Tenant-safe
Permission-safe
PII-conscious
Schema-validated
```

Event payloads must not be full database records.

Good:

```ts
{
  stockMovementId: 'sm_123',
  productId: 'prod_123',
  warehouseId: 'wh_123',
  movementType: 'adjustment',
  quantityDelta: -5
}
```

Bad:

```ts
{
  id: 'sm_123',
  orgId: 'org_123',
  product: {
    id: 'prod_123',
    name: 'Product Name',
    cost: 123,
    supplier: {...},
    deletedAt: null
  },
  createdByUser: {
    id: 'user_123',
    email: 'person@example.com',
    roles: [...]
  }
}
```

The event envelope already carries tenant and actor context. Payloads should not duplicate it.

---

# 13. Payload Must Not Include `orgId`

Event payloads must not include:

```txt
orgId
organizationId
tenantId
orgSlug
```

The `PlatformContext` and event envelope carry tenant identity.

Forbidden:

```ts
await sdk.events.emit(ctx, INVENTORY_EVENTS.stockMovementCreated, {
  orgId: ctx.org.id,
  stockMovementId: movement.id,
})
```

Correct:

```ts
await sdk.events.emit(ctx, INVENTORY_EVENTS.stockMovementCreated, {
  stockMovementId: movement.id,
})
```

This prevents code from slowly drifting back into loose tenant-ID handling.

---

# 14. Payload Must Not Include Secrets or Sensitive Data

Payloads must not include:

```txt
Passwords
Access tokens
Refresh tokens
Supabase service role keys
Private API keys
Bank details
Government IDs
Salary data
Full customer records
Full employee records
Large free-text notes
Uploaded file contents
```

If a handler needs more data, it should query using:

```ts
sdk.getDb(ctx)
```

with the tenant-scoped `PlatformContext`.

---

# 15. Payloads Must Be JSON-Serializable

Event payloads must be safe to store in a future outbox table.

Allowed:

```txt
string
number
boolean
null
plain objects
arrays
ISO date strings
```

Avoid:

```txt
Date objects
Map
Set
class instances
functions
BigInt
Prisma Decimal objects
File/Blob
```

Use ISO strings for timestamps:

```ts
occurredOn: new Date().toISOString()
```

not raw `Date` objects inside payloads.

---

# 16. Event Envelope

The SDK should normalize emitted events into an internal envelope.

Conceptual shape:

```ts
type EventEnvelope<TPayload> = {
  id: string
  name: string
  version: number

  orgId: string
  actorUserId: string | null

  source: {
    type: 'kernel' | 'objects' | 'module' | 'platform_service'
    id: string
  }

  payload: TPayload

  occurredAt: string

  correlationId?: string
  causationId?: string
}
```

Modules emit only:

```ts
eventName
payload
```

through a verified `PlatformContext`.

The SDK constructs the rest.

Module code should not hand-build event envelopes.

---

# 17. `PlatformContext` Requirement

Events must be emitted with a verified `PlatformContext`.

Allowed:

```ts
await sdk.events.emit(ctx, INVENTORY_EVENTS.stockMovementCreated, payload)
```

Forbidden:

```ts
await sdk.events.emit('inventory.stock_movement.created', payload)
await sdk.events.emit(orgId, 'inventory.stock_movement.created', payload)
await bus.emit('inventory.stock_movement.created', payload)
```

Why:

```txt
Events must be tenant-scoped.
Events must know the actor.
Future audit logs need actor and org.
Future queues need metadata.
Future AI/search/reporting consumers need safe context.
```

---

# 18. Where Events Are Emitted

Events should be emitted from **module services**, after successful business mutations.

Correct:

```txt
API route
  → validates request
  → creates PlatformContext
  → calls module service
  → service mutates database
  → service emits event
  → API returns response
```

Incorrect:

```txt
Client component emits event
API route emits event directly
Database trigger emits module event
Prisma middleware emits business event automatically
Another module emits event on behalf of this module
```

---

# 19. Do Not Emit Events From UI Components

Forbidden:

```tsx
'use client'

await sdk.events.emit(...)
```

Reasons:

```txt
The browser cannot be trusted.
The browser does not have server-side PlatformContext.
The browser must not access server SDK.
The browser should not publish business facts.
```

Client components perform user interactions.

Server routes and services enforce security and mutate state.

Services emit events.

---

# 20. Do Not Emit Events From API Routes Unless Explicitly Approved

API routes should usually not emit module events directly.

Bad:

```ts
export async function POST(req: NextRequest) {
  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
  const input = await validate(req)
  const record = await sdk.getDb(ctx).stockMovement.create(...)
  await sdk.events.emit(ctx, INVENTORY_EVENTS.stockMovementCreated, { stockMovementId: record.id })
  return sdk.api.created(record)
}
```

Better:

```ts
export async function POST(req: NextRequest) {
  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
  const input = await validate(req)

  const record = await InventoryService.createStockMovement(ctx, input)

  return sdk.api.created(record)
}
```

The service owns the business mutation, so the service owns the business event.

---

# 21. Event Emission and Transactions

For MVP, events should be emitted **after** the successful database transaction.

Example:

```ts
static async createStockMovement(ctx: PlatformContext, input: CreateStockMovementInput) {
  const db = sdk.getDb(ctx)

  const movement = await sdk.db.transaction(ctx, async (tx) => {
    const created = await tx.stockMovement.create({
      data: {
        orgId: ctx.org.id,
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantityDelta: input.quantityDelta,
        createdBy: ctx.user.id,
      },
    })

    await tx.stockBalance.updateMany({
      where: {
        orgId: ctx.org.id,
        productId: input.productId,
        warehouseId: input.warehouseId,
      },
      data: {
        quantity: { increment: input.quantityDelta },
      },
    })

    return created
  })

  await sdk.events.emit(ctx, INVENTORY_EVENTS.stockMovementCreated, {
    stockMovementId: movement.id,
    productId: movement.productId,
    warehouseId: movement.warehouseId,
    quantityDelta: movement.quantityDelta,
  })

  return movement
}
```

Do not emit before the transaction succeeds.

If a future outbox is implemented, the outbox record should be written inside the transaction, then dispatched asynchronously.

---

# 22. Critical Consistency Rule

If a reaction is required for the original operation to be correct, do not use an event.

Do it inside the same service or transaction.

Example:

```txt
Creating a stock movement must update stock balance.
```

That should happen inside the Inventory service transaction.

Do not do this:

```txt
stock_movement.created event
  → listener updates stock balance
```

because if the listener fails, stock becomes incorrect.

Events are for decoupled reactions, not core invariants.

Good event consumers:

```txt
Audit Log
Search Index
Notifications
AI context update
Activity Feed
Reporting projection
Non-critical cross-module reaction
```

Bad event consumers:

```txt
Required inventory balance update
Required accounting ledger write
Required permission assignment
Required approval state transition
```

If it must be atomic, it belongs in the service transaction, not in the event bus.

---

# 23. Module Event File Structure

Every module should define event names and payload schemas in:

```txt
src/modules/[module]/events.ts
```

For server-only event handlers, use:

```txt
src/modules/[module]/event-handlers.server.ts
```

`events.ts` should be safe to import from manifests and tests. It should not import:

```txt
@/sdk/server
@/kernel/*
raw Prisma
other modules
```

`event-handlers.server.ts` may import:

```txt
@/sdk/server
module-local services
module-local schemas
```

but must not import:

```txt
@/kernel/*
other modules
raw Prisma
```

---

# 24. Event Constants Example

Example for Inventory:

```ts
// src/modules/inventory/events.ts
import { z } from 'zod'

export const INVENTORY_EVENTS = {
  stockMovementCreated: 'inventory.stock_movement.created',
  stockAdjustmentSubmitted: 'inventory.stock_adjustment.submitted',
  stockAdjustmentApproved: 'inventory.stock_adjustment.approved',
  stockAdjustmentRejected: 'inventory.stock_adjustment.rejected',
  stockLevelLowDetected: 'inventory.stock_level.low_detected',
} as const

export const StockMovementCreatedPayloadSchema = z.strictObject({
  stockMovementId: z.string().min(1),
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  movementType: z.enum(['opening_balance', 'adjustment', 'transfer_in', 'transfer_out', 'purchase_receipt', 'sale_issue']),
  quantityDelta: z.number(),
})

export type StockMovementCreatedPayload = z.infer<typeof StockMovementCreatedPayloadSchema>
```

Event names should be constants, not inline strings scattered across services.

---

# 25. Event Payload Validation

Every emitted event payload must have a Zod schema.

The service should either:

1. build payloads from validated internal data, or
2. explicitly validate before emitting.

Example:

```ts
const payload = StockMovementCreatedPayloadSchema.parse({
  stockMovementId: movement.id,
  productId: movement.productId,
  warehouseId: movement.warehouseId,
  movementType: movement.type,
  quantityDelta: movement.quantityDelta,
})

await sdk.events.emit(ctx, INVENTORY_EVENTS.stockMovementCreated, payload)
```

This is not only for runtime safety. It also documents the event contract.

---

# 26. Manifest Event Declaration

A module manifest must declare events it emits and events it listens to.

Recommended shape:

```ts
events: {
  emits: [
    {
      name: INVENTORY_EVENTS.stockMovementCreated,
      version: 1,
      description: 'Emitted after an inventory stock movement is created.',
      payloadSchema: 'StockMovementCreatedPayloadSchema',
    },
  ],
  listens: [
    {
      name: OBJECT_EVENTS.productDeleted,
      reason: 'Archive or deactivate inventory-specific product metadata.',
      handler: 'handleProductDeleted',
    },
  ],
}
```

The manifest remains pure metadata.

It does not import server SDKs.

It does not register handlers by side effect.

---

# 27. Manifest Declarations Must Match Code

If a module emits an event, it must be declared in the manifest.

If a module listens to an event, it must be declared in the manifest.

Forbidden:

```ts
await sdk.events.emit(ctx, 'inventory.secret_event.created', payload)
```

when the manifest does not declare that event.

Architecture checks should verify:

```txt
events.ts constants
manifest.events.emits
manifest.events.listens
service emit calls
event handler registration
```

are consistent.

---

# 28. Listener Registration

Modules that listen to events should expose a server-only registration function.

Example:

```ts
// src/modules/inventory/event-handlers.server.ts
import type { ModuleEventRegistry } from '@/sdk/server'
import { OBJECT_EVENTS } from '@/business-objects/events'
import { InventoryProductExtensionService } from './service'

export function registerInventoryEventHandlers(events: ModuleEventRegistry) {
  events.on({
    event: OBJECT_EVENTS.productDeleted,
    listenerModule: 'inventory',
    handler: async (envelope) => {
      await InventoryProductExtensionService.handleProductDeleted(envelope.ctx, {
        productId: envelope.payload.productId,
      })
    },
  })
}
```

The platform composition root should register known module handlers.

Do not self-register handlers as module-import side effects.

Forbidden:

```ts
// src/modules/inventory/event-handlers.server.ts
sdk.events.on('objects.product.deleted', handler)
```

at module top level.

Reason:

```txt
Side effects are hard to test.
Registration order becomes ambiguous.
Disabled modules become harder to filter.
Claude may accidentally register the same handler multiple times.
```

---

# 29. Listener Module Enablement

A module listener should run only for organizations where the listener module is enabled.

Example:

```txt
objects.product.updated emitted

Inventory listener:
  runs only if Inventory is enabled for that org

CRM listener:
  runs only if CRM is enabled for that org

Search Platform Service listener:
  future Platform Service rules apply
```

The preferred SDK-level handler registration shape is:

```ts
events.on({
  event: 'objects.product.deleted',
  listenerModule: 'inventory',
  handler,
})
```

This allows the SDK to skip the handler when:

```txt
Inventory is not enabled for ctx.org.id
```

If the MVP SDK does not yet support automatic listener-module filtering, the handler must explicitly check module enablement before doing work.

---

# 30. Listener Permission Rules

Event handlers are not user-facing API boundaries.

The original user action should already have passed:

```txt
authentication
tenant membership
module enablement
permission
validation
```

before the event was emitted.

Therefore, normal event handlers do not re-check the original user permission.

However, handlers must not use events to perform new human business actions that would normally require explicit permission.

Allowed handler behavior:

```txt
Update derived module metadata
Invalidate cache
Create activity/audit/search records in future services
Recalculate non-critical projection
Archive extension record when shared object is deleted
```

Not allowed in MVP:

```txt
Auto-approve a purchase request
Auto-create a payment
Auto-delete another module's business record
Auto-assign a role
Auto-create a legally meaningful document
```

Those require a future Workflow Engine or explicit automation system with its own permissions, audit trail, and review model.

---

# 31. Listener Failure Behavior

A listener failure must not break the original business mutation.

For MVP:

```txt
Business mutation succeeds
Event emitted
One listener fails
Other listeners still run
API response still represents successful mutation
Failure is logged
```

The event bus should use `Promise.allSettled` or equivalent behavior.

If a reaction is business-critical, it should not be an event listener.

---

# 32. Event Ordering

Do not rely on strict event ordering in MVP.

For example, do not assume:

```txt
inventory.stock_adjustment.submitted
```

will always be processed before:

```txt
inventory.stock_adjustment.approved
```

by every future asynchronous consumer.

Handlers should be idempotent and tolerant of reordering where practical.

If strict ordering is required for correctness, the logic belongs in the service transaction or a future durable workflow system.

---

# 33. Idempotency

Event handlers should be safe to run more than once.

Future durable queues may retry failed handlers.

Handlers that write records should use idempotent patterns:

```txt
upsert by eventId
unique constraint on projection source
skip if already processed
compare current state before update
```

MVP in-process events may not retry, but module code should not assume exactly-once delivery.

---

# 34. Causation and Correlation

When a handler emits another event, the SDK should preserve causation metadata.

Example:

```txt
objects.product.deleted
  causes
inventory.product_extension.archived
```

Conceptually:

```txt
correlationId = original user action trace
causationId = event that caused this event
```

MVP does not need a full tracing UI.

But event envelope types should reserve:

```txt
correlationId
causationId
```

for future audit, debugging, and AI explanations.

---

# 35. Events and Business Objects

Shared Business Object mutations emit `objects.*` events.

Examples:

```txt
objects.employee.created
objects.employee.updated
objects.employee.deactivated
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
```

Modules listen when they need to react.

Example:

```txt
objects.product.deleted
  → Inventory archives InventoryProductExtension
  → Purchasing archives PurchasingProductExtension
  → Search removes product from index later
```

Business Object events must not be emitted from module code directly unless the module is calling the approved Business Object service and that service emits the event.

---

# 36. Module Extension Events

If a module creates or updates module-specific extension records for a Business Object, those events belong to the module.

Example:

```txt
objects.product.created
inventory.product_extension.created
purchasing.product_extension.updated
```

The split is intentional.

Product identity belongs to Business Objects.

Inventory-specific metadata belongs to Inventory.

---

# 37. Events and Soft Delete

Soft delete operations should emit deleted events.

Example:

```txt
inventory.stock_adjustment.deleted
objects.product.deleted
objects.customer.deleted
```

Restore operations should emit restored events.

Example:

```txt
inventory.stock_adjustment.restored
objects.product.restored
objects.customer.restored
```

Do not emit `removed` or `destroyed` unless the operation is truly hard delete, which is forbidden for normal business data.

---

# 38. Events and Status Changes

For business status changes, use the business verb.

Examples:

```txt
leave.leave_request.submitted
leave.leave_request.approved
leave.leave_request.rejected
leave.leave_request.cancelled

inventory.stock_adjustment.submitted
inventory.stock_adjustment.approved
inventory.stock_adjustment.rejected

crm.opportunity.won
crm.opportunity.lost
```

Avoid generic:

```txt
leave.leave_request.updated
```

when the important business fact is:

```txt
leave.leave_request.approved
```

Generic `updated` events are acceptable for ordinary field updates, but major workflow transitions deserve specific events.

---

# 39. Events and Imports

Bulk imports are deferred.

When imports are eventually implemented, avoid emitting thousands of per-row events synchronously in a request.

Preferred future shape:

```txt
inventory.products.import_started
inventory.products.import_completed
inventory.products.import_failed
```

and, if needed, individual row events handled by a background job.

For MVP, generated modules should not implement bulk import events unless the Import/Export Engine document is frozen.

---

# 40. Events and Notifications

Modules must not send notifications directly.

Bad:

```ts
await sendEmail(...)
await sendSms(...)
await createNotification(...)
```

inside a business module service.

Good:

```ts
await sdk.events.emit(ctx, INVENTORY_EVENTS.stockLevelLowDetected, payload)
```

Future Notification Service may listen and decide what to send.

Until Notification Service exists, no notification engine should be improvised inside a single module unless the Three Independent Use Cases Rule says it should stay module-local.

---

# 41. Events and Audit Logs

Modules must not implement their own audit log tables.

Every meaningful module mutation should emit an event.

Future Audit Log Service can subscribe.

If audit logging is needed before the Platform Audit Service exists, it should be handled by a conscious architectural decision, not hidden inside each module.

---

# 42. Events and Search

Modules must not directly update a global search index.

Future Search Service should listen to events.

Example:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
inventory.stock_movement.created
crm.lead.converted
```

Search is a Platform Service candidate once enough modules need it.

---

# 43. Events and AI

Modules must not directly write to AI memory, vector indexes, embeddings, or AI context stores.

Future AI Layer may listen to safe, tenant-scoped events.

Event payloads should be intentionally small and PII-conscious so AI-related consumers do not accidentally receive excessive data.

---

# 44. Events and External Webhooks

External webhooks are not part of MVP module events.

Do not expose internal module events directly to customers or external systems.

Future external integration events need:

```txt
separate webhook contracts
delivery retries
signatures
tenant-specific subscriptions
rate limits
secret management
audit logs
```

Internal event names are not automatically public API names.

---

# 45. Event Versioning

Every event contract has a version.

MVP can start with:

```txt
version: 1
```

Breaking changes require either:

1. a new event name, or
2. a versioned event contract with migration/deprecation notes.

Non-breaking changes:

```txt
Adding an optional payload field
Adding a new event
Adding a new listener
```

Breaking changes:

```txt
Removing a payload field
Renaming a payload field
Changing field type
Changing event meaning
Changing ownership
Changing whether an event is emitted
```

Once a module is used by real clients, event contracts should be treated like API contracts.

---

# 46. Event Deprecation

If an event must be replaced:

```txt
1. Add the new event.
2. Emit both old and new events temporarily if needed.
3. Update listeners.
4. Add tests.
5. Mark old event as deprecated in the manifest.
6. Remove only through an approved compatibility change.
```

Do not silently rename events.

---

# 47. Module Event Tests

Every module that emits events must include tests proving:

```txt
Event is emitted after successful mutation.
Event is not emitted when validation fails.
Event is not emitted when permission fails.
Event is not emitted when transaction fails.
Payload matches schema.
Payload does not include orgId.
Payload does not include full records.
Event name matches manifest declaration.
Correct event is emitted for workflow transitions.
```

Every module that listens to events must include tests proving:

```txt
Handler processes valid event envelope.
Handler uses PlatformContext.
Handler uses sdk.getDb(ctx).
Handler does not import another module directly.
Handler skips or is skipped when listener module is disabled.
Handler is idempotent where it writes derived data.
Handler failure does not break unrelated listeners.
```

---

# 48. Required Two-Organization Tests

Any event handler that reads or writes tenant-scoped records must be tested with at least two organizations.

Minimum test:

```txt
Org A emits event for Product A
Org B has Product B with same-looking IDs/data shape
Handler updates only Org A records
Org B records remain unchanged
```

Single-organization event tests are not sufficient for OneDayOS.

---

# 49. Required Permission Tests

For event-emitting operations, tests must verify:

```txt
User without required permission cannot trigger mutation.
No event is emitted when permission is denied.
User with permission can trigger mutation.
Event is emitted after success.
```

This prevents the old risk where permissions existed but were not enforced by routes or services.

---

# 50. Required Manifest Consistency Tests

Generated modules should include tests that validate:

```txt
Every manifest.events.emits name exists in events.ts.
Every emitted event in services appears in manifest.events.emits.
Every manifest.events.listens name has a registered handler.
Every event name matches naming convention.
Every event payload schema is strict.
No event payload schema includes orgId.
```

These tests may start as module-level tests and later become architecture-level checks.

---

# 51. Event Name Regex

Architecture checks should enforce an event-name pattern.

Recommended:

```txt
^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$
```

Additional semantic checks should reject:

```txt
camelCase
PascalCase
empty segments
spaces
hyphens
abbreviations in known namespaces
imperative verbs where detectable
```

A regex cannot prove the verb is past tense, so code review and manual standards still matter.

---

# 52. Generated Module Requirements

The module generator must create:

```txt
src/modules/[module]/events.ts
src/modules/[module]/__tests__/events.test.ts
```

If the module listens to events, it must also create:

```txt
src/modules/[module]/event-handlers.server.ts
src/modules/[module]/__tests__/event-handlers.test.ts
```

Generated `events.ts` must include:

```txt
event name constants
Zod payload schemas
payload TypeScript types
manifest-compatible event metadata
```

Generated services must include event emission examples using:

```ts
await sdk.events.emit(ctx, MODULE_EVENTS.recordCreated, payload)
```

not:

```ts
await sdk.events.emit('module.record.created', payload)
```

unless the string comes from a constant.

---

# 53. Forbidden Patterns

Claude Code must not generate:

```ts
// Direct Kernel event bus import
import { bus } from '@/kernel/events/bus'

// Direct module call
import { PurchasingService } from '@/modules/purchasing/service'

// Event emitted from browser
'use client'
await sdk.events.emit(...)

// Event emitted with loose orgId
await sdk.events.emit(orgId, eventName, payload)

// Payload includes orgId
{ orgId: ctx.org.id, recordId: record.id }

// Full Prisma record payload
await sdk.events.emit(ctx, eventName, record)

// Inline event strings everywhere
await sdk.events.emit(ctx, 'inventory.record.created', payload)

// Command-style event
await sdk.events.emit(ctx, 'notification.send_email', payload)

// Critical invariant through listener
stock_movement.created → listener updates stock balance

// Listener registration by side effect
sdk.events.on(...) at module top-level

// Handler without tenant context
const db = sdk.getDb()
```

---

# 54. Correct Service Pattern

Recommended service pattern:

```ts
import { sdk, type PlatformContext } from '@/sdk/server'
import {
  INVENTORY_EVENTS,
  StockMovementCreatedPayloadSchema,
} from './events'
import { CreateStockMovementSchema, type CreateStockMovementInput } from './schema'

export class InventoryService {
  static async createStockMovement(
    ctx: PlatformContext,
    input: CreateStockMovementInput
  ) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_movement',
      action: 'create',
    })

    const data = CreateStockMovementSchema.parse(input)

    const movement = await sdk.db.transaction(ctx, async (tx) => {
      return tx.stockMovement.create({
        data: {
          orgId: ctx.org.id,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantityDelta: data.quantityDelta,
          createdBy: ctx.user.id,
        },
      })
    })

    const payload = StockMovementCreatedPayloadSchema.parse({
      stockMovementId: movement.id,
      productId: movement.productId,
      warehouseId: movement.warehouseId,
      quantityDelta: movement.quantityDelta,
    })

    await sdk.events.emit(ctx, INVENTORY_EVENTS.stockMovementCreated, payload)

    return movement
  }
}
```

Important characteristics:

```txt
Uses PlatformContext.
Checks permission.
Validates input.
Mutates through tenant-scoped database access.
Emits after successful mutation.
Validates payload.
Does not include orgId in payload.
Does not emit from API route.
```

---

# 55. Correct API Pattern

Recommended API pattern:

```ts
export const POST = sdk.api.handle(
  async (req, { params }) => {
    const ctx = await sdk.auth.requireApiModuleContext(
      req,
      params.orgSlug,
      'inventory'
    )

    const input = await sdk.api.parseJson(req, CreateStockMovementSchema)

    const result = await InventoryService.createStockMovement(ctx, input)

    return sdk.api.created(result)
  }
)
```

The API route does not emit the event.

The service emits the event.

---

# 56. Correct Listener Pattern

Recommended listener pattern:

```ts
import type { ModuleEventRegistry } from '@/sdk/server'
import { OBJECT_EVENTS } from '@/business-objects/events'
import { InventoryProductExtensionService } from './service'

export function registerInventoryEventHandlers(events: ModuleEventRegistry) {
  events.on({
    event: OBJECT_EVENTS.productDeleted,
    listenerModule: 'inventory',
    handler: async (envelope) => {
      await InventoryProductExtensionService.archiveForDeletedProduct(
        envelope.ctx,
        {
          productId: envelope.payload.productId,
          sourceEventId: envelope.id,
        }
      )
    },
  })
}
```

This keeps the dependency direction correct.

Inventory listens to an object event.

Inventory does not import Product internals or another module.

---

# 57. Events and Module Dependencies

Listening to another module's event does not automatically mean a hard module dependency.

There are two kinds of relationships:

## 57.1 Hard Dependency

The module cannot function without another module.

Example:

```txt
A Payroll module may require Employee Business Object access.
```

This should be declared as a manifest dependency if it is truly module-level.

## 57.2 Optional Event Reaction

The module can function alone, but reacts when another event exists.

Example:

```txt
Inventory listens to purchasing.purchase_receipt.posted
```

If Purchasing is not installed, Inventory still works.

This should be declared as an event listener, not necessarily a hard dependency.

---

# 58. Avoid Event Ping-Pong

Modules must not create infinite loops.

Bad:

```txt
inventory.stock_level.low_detected
  → purchasing.purchase_request.created
  → inventory.stock_level.rechecked
  → purchasing.purchase_request.created
  → ...
```

If a listener emits another event, it should be intentional, idempotent, and tested.

Future Workflow Engine should handle more complex automation.

---

# 59. Events and Module Disablement

Disabling a module should not delete its data.

It should also prevent module listeners from processing future events for that organization.

Example:

```txt
Client disables Inventory.

objects.product.updated still emits.
Inventory listener does not run for that org.
Inventory data remains stored but inactive/inaccessible.
```

If the module is re-enabled later, it may need a resync/rebuild process.

That process is not part of MVP.

---

# 60. Events and Rebuild/Backfill

Because MVP events are in-process and non-durable, modules must not assume they can rebuild all state from historical events.

If a module needs a projection, it should be able to rebuild from the database.

Future durable event/outbox architecture may support replay, but MVP does not.

---

# 61. Event Logging

For MVP, event emissions and listener failures should be logged server-side.

Logs should include:

```txt
eventId
eventName
orgId
source
listenerModule
handler name
error message
```

Logs must not include:

```txt
full payload with sensitive data
secrets
tokens
full user records
```

Future Audit Log is separate from technical event logging.

---

# 62. Event Security Model

Events are not a shortcut around security.

Security rules:

```txt
Only permission-checked services emit business events.
Events require PlatformContext.
Payloads do not include orgId.
Handlers use sdk.getDb(ctx).
Handlers do not use raw Prisma.
Handlers do not trust payload IDs without tenant-scoped queries.
Handlers do not call other modules directly.
Handlers do not perform new human actions without explicit automation rules.
```

---

# 63. Event Handler Database Access

Handlers must use:

```ts
sdk.getDb(ctx)
```

or:

```ts
sdk.db.transaction(ctx, fn)
```

Forbidden:

```ts
sdk.getDb()
sdk.getDb(orgId)
prisma.model.findUnique({ where: { id } })
```

When reading tenant-scoped records, use tenant-safe filters:

```ts
where: {
  id: payload.productId,
  orgId: ctx.org.id,
  deletedAt: null,
}
```

---

# 64. Event Handler Output

Event handlers should usually not return meaningful values.

They should:

```txt
complete successfully
log and fail safely
emit follow-up events if needed
```

The original emitter should not depend on handler return values.

---

# 65. Event Handler Time Budget

MVP in-process handlers run during the request lifecycle unless the SDK defers them.

Therefore handlers must be lightweight.

Good:

```txt
update small derived row
log technical event
enqueue future work once queue exists
```

Bad:

```txt
send many emails
call slow external API
process large CSV
generate PDFs
run AI embeddings
```

Long-running work requires background jobs, which are deferred.

---

# 66. Event Categories

For documentation clarity, events may be categorized as:

| Category | Meaning | Example |
|---|---|---|
| Entity lifecycle | Record created/updated/deleted/restored | `objects.product.created` |
| Workflow transition | Business status changed | `leave.leave_request.approved` |
| Threshold detection | A condition was detected | `inventory.stock_level.low_detected` |
| Assignment | Entity assigned/unassigned | `assets.asset.assigned` |
| Import/export | Bulk data operation | Deferred |
| Integration | External system interaction | Deferred |

This category is documentation only for MVP.

---

# 67. Events and Dashboard Widgets

Modules should not directly update dashboard widgets.

Future dashboard/reporting services may listen to events and update projections.

For MVP, dashboard data should be queried directly using tenant-scoped services.

---

# 68. Events and Settings

Changing module settings should emit events only when a meaningful business/system fact has happened.

Examples:

```txt
kernel.module.enabled
kernel.module.disabled
kernel.setting.updated
```

Module-specific setting changes may emit:

```txt
inventory.setting.updated
```

only if another subsystem genuinely needs to react.

Do not spam events for every minor preference change unless there is a consumer.

---

# 69. Events and the Three Independent Use Cases Rule

Events themselves are a Kernel/SDK primitive because modules need decoupled communication from the beginning.

But event consumers should not be promoted into Platform Services prematurely.

Example:

```txt
Only Inventory needs a low-stock notification
→ keep it module-local or defer.

Inventory + Incidents + Leave all need user notifications
→ promote Notification Service.

Leave + Purchasing + Expenses all need approvals
→ promote Approval Workflow Service.
```

The event system allows future services to be added without retrofitting module mutations, but those services should still obey the Three Independent Use Cases Rule.

---

# 70. Claude Code Implementation Rules

When implementing module events, Claude Code must follow these rules:

```txt
1. Do not import from @/kernel/* inside modules.
2. Do not import from another module.
3. Do not emit events from client components.
4. Do not emit events directly from API routes unless a frozen document explicitly allows it.
5. Emit events from services after successful mutations.
6. Use PlatformContext for all event emission.
7. Do not put orgId in payload.
8. Do not put full Prisma records in payload.
9. Define event constants in events.ts.
10. Define strict Zod payload schemas.
11. Declare emitted/listened events in the module manifest.
12. Add tests for event emission and non-emission on failure.
13. Add tests that payloads do not include orgId.
14. Add two-org tests for handlers.
15. Keep listener registration server-only and explicit.
16. Do not implement Audit, Notifications, Search, AI indexing, or Workflow Engine unless their manual documents are frozen.
```

---

# 71. Implementation Checklist

A module's event implementation is acceptable only if:

```txt
[ ] Event names follow {namespace}.{entity}.{past_tense_verb}
[ ] Event names are constants
[ ] Payload schemas use Zod strict objects
[ ] Payloads do not include orgId
[ ] Payloads do not include full records
[ ] Services emit after successful mutation
[ ] Services do not emit when validation fails
[ ] Services do not emit when permission fails
[ ] API routes do not emit business events directly
[ ] Client components do not emit events
[ ] Manifest declares emitted events
[ ] Manifest declares listened events
[ ] Listener registration is explicit and server-only
[ ] Listener module enablement is respected
[ ] Handlers use PlatformContext
[ ] Handlers use sdk.getDb(ctx)
[ ] Handlers are tenant-scoped
[ ] Handler failures do not break original mutation
[ ] Tests cover event emission
[ ] Tests cover event non-emission on failure
[ ] Tests cover payload schema
[ ] Tests cover manifest consistency
[ ] Tests cover two-org isolation for handlers
```

---

# 72. Acceptance Criteria

This document is complete when:

```txt
[ ] Module event naming is unambiguous.
[ ] Module event ownership is unambiguous.
[ ] Business Object events and module events are clearly separated.
[ ] Event payload rules are strict enough for future outbox/queue support.
[ ] Event emission location is clear.
[ ] Listener registration pattern is clear.
[ ] Module enablement rules for listeners are clear.
[ ] Security boundaries are clear.
[ ] Testing requirements are clear.
[ ] Claude Code can implement module events without inventing architecture.
```

---

# 73. Founder Review Questions

Before freezing this document, answer:

```txt
1. Do we accept the stricter correction from inventory.stock_level.low to inventory.stock_level.low_detected?
2. Do we want event handler registration in event-handlers.server.ts as the official pattern?
3. Should listener module enablement be enforced by the SDK automatically in MVP?
4. Should every emitted event require a Zod payload schema in MVP, or only module-owned events?
5. Should module manifests declare rich event metadata or only event names for the first build?
```

My recommendation:

```txt
Use the stricter event naming now.
Use event-handlers.server.ts for listeners.
Require SDK-level listener module enablement filtering if it is not too costly.
Require Zod payload schemas for all module and Business Object events.
Use rich event metadata in manifests because it helps future docs, AI context, and generator validation.
```

---

# 74. Final Rule

The final rule is:

```txt
If two modules need to know about the same business fact,
publish an event.

If one module needs another module to do something,
do not call it directly.

Model the fact first.
Let subscribers react.
Keep the module boundary intact.
```

This is how OneDayOS stays a platform instead of becoming a tangled collection of custom apps.
