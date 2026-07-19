# OneDayOS Engineering Manual — 05 SDK — 04 SDK Events

**Document ID:** `05-sdk/04-sdk-events.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Author:** ChatGPT / OneDayOS Architecture Partner  
**Date:** July 2026  
**Implementation Allowed:** `No — freeze before implementation`  
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

---

# 1. Purpose

This document defines the OneDayOS SDK event system.

Events are how OneDayOS modules, Business Objects, Kernel systems, and future Platform Services communicate without direct imports or direct runtime coupling.

This document answers:

- What is an event?
- What is the event naming convention?
- How do modules emit events?
- How do modules and Platform Services listen to events?
- What must an event payload contain?
- What must an event payload never contain?
- How do events relate to tenancy, permissions, transactions, audit logs, search, AI, and notifications?
- What is built in the restarted platform MVP?
- What is intentionally deferred?

The event system must protect the core architecture rule:

```txt
Modules never call each other directly.
Modules publish events.
Other modules or Platform Services subscribe.
```

---

# 2. Executive Summary

The restarted OneDayOS platform should implement an SDK-level event system with these rules:

```txt
1. Events are emitted only on the server.
2. Events are emitted through @/sdk/server.
3. Events always receive verified PlatformContext.
4. Events never receive loose orgId strings.
5. Events use a strict naming convention.
6. Events are treated as stable API contracts.
7. Events include tenant, actor, source, entity, timestamp, and version metadata.
8. Event listeners must be isolated, idempotent, and non-blocking.
9. Event handler failures must not break the original business mutation.
10. Durable event persistence, background jobs, and full audit logs are deferred.
```

The MVP event bus is allowed to be in-process.

The event contract must still be designed so it can later evolve into:

```txt
Event Outbox
Background Jobs
Audit Log Service
Search Indexing
Notification Service
AI Context Updates
Analytics
Webhook Integrations
```

without changing module business logic.

---

# 3. Non-Goals

This document does **not** implement:

- Redis.
- Kafka.
- Durable background queues.
- Webhooks.
- Full audit log storage.
- Notification delivery.
- Search indexing.
- Event replay.
- Event sourcing.
- A Python/FastAPI event service.
- Cross-deployment event federation.

Those are future Platform Services.

For the restarted core platform, events remain TypeScript/Next.js server infrastructure behind the SDK.

---

# 4. Why Events Exist

Events exist because OneDayOS must become a platform, not a set of tightly coupled apps.

Bad architecture:

```ts
// ❌ Inventory directly imports Audit
import { AuditService } from '@/modules/audit/service'

// ❌ Inventory directly imports Search
import { SearchService } from '@/modules/search/service'

// ❌ Inventory knows too much about subscribers
await AuditService.recordProductCreated(product)
await SearchService.indexProduct(product)
```

Correct architecture:

```ts
// ✅ Inventory emits one stable event
await sdk.events.emit(ctx, ProductCreatedEvent, {
  source: { module: 'inventory', service: 'ProductService' },
  entity: { type: 'product', id: product.id },
  payload: {
    productId: product.id,
    code: product.code,
    name: product.name,
  },
})
```

Then future services can subscribe independently:

```txt
objects.product.created
  ↓
Audit Log Service
Search Service
AI Context Service
Notification Service
Analytics Service
```

The emitting module knows nothing about subscribers.

---

# 5. Core Event Principle

Events are **facts that already happened**.

They should be named in the past tense:

```txt
created
updated
deleted
submitted
approved
rejected
cancelled
activated
deactivated
enabled
disabled
```

Events should not be commands.

Incorrect:

```txt
inventory.product.create
inventory.product.send_notification
leave.request.approve_now
```

Correct:

```txt
objects.product.created
inventory.stock_movement.created
leave.leave_request.approved
kernel.module.enabled
```

If code needs to command another system to do something, that is not an event contract. That is either:

```txt
1. A service call inside the same module/service boundary, or
2. A future workflow/background job command system.
```

Do not confuse events with commands.

---

# 6. Event Namespace Decision

The old MVP reference used examples such as:

```txt
inventory.product.created
```

For the restarted architecture, we should be more precise.

Because Business Objects are conceptually separate from Kernel and are not owned by modules, shared Business Object events should use the namespace:

```txt
objects
```

Therefore:

```txt
objects.product.created
objects.customer.created
objects.supplier.created
objects.warehouse.created
objects.employee.created
```

Kernel-only events use:

```txt
kernel
```

Examples:

```txt
kernel.user.created
kernel.organization.created
kernel.role.created
kernel.permission.granted
kernel.module.enabled
```

Module-owned events use the module ID:

```txt
inventory.stock_movement.created
inventory.stock_adjustment.approved
leave.leave_request.submitted
crm.deal.won
purchasing.purchase_request.approved
```

This distinction matters.

`Product` is not owned by Inventory.

Inventory can create products through the shared Business Object service, but the emitted product event should still be:

```txt
objects.product.created
```

not:

```txt
inventory.product.created
```

Inventory-specific stock behavior should use the Inventory namespace:

```txt
inventory.stock_movement.created
inventory.reorder_rule.triggered
inventory.stock_level.recalculated
```

---

# 7. Event Naming Convention

All event names must follow this grammar:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Where:

```txt
namespace = kernel | objects | module_id | future platform service id
entity    = singular lower_snake_case entity name
verb      = lower_snake_case past-tense verb
```

Examples:

```txt
kernel.organization.created
kernel.user.invited
kernel.user.deactivated
kernel.module.enabled
kernel.permission.granted

objects.employee.created
objects.employee.updated
objects.product.created
objects.product.updated
objects.customer.created
objects.supplier.deleted
objects.warehouse.deactivated

inventory.stock_movement.created
inventory.stock_adjustment.submitted
inventory.stock_adjustment.approved
inventory.stock_level.recalculated

leave.leave_request.submitted
leave.leave_request.approved
leave.leave_request.rejected

purchasing.purchase_request.submitted
purchasing.purchase_request.approved
purchasing.purchase_order.created

crm.lead.created
crm.deal.won
crm.deal.lost
```

Forbidden event names:

```txt
product.created
ProductCreated
productCreated
inventory.product.create
inventory.product.make
inventory.Product.Created
inventory/product/created
inventory.product_created
inventory.product.created.now
```

The event name is an API contract.

A wrong event name is not cosmetic. It is equivalent to breaking an API route.

---

# 8. Event Name Validation

The SDK must validate event names at runtime in development and test environments.

Recommended validation:

```ts
const EVENT_NAME_PATTERN = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/
```

Valid:

```txt
objects.product.created
inventory.stock_movement.created
visitor-management.visitor_log.created
```

Invalid:

```txt
Objects.product.created
inventory.stockMovement.created
inventory.stock_movement.create-now!
```

The SDK should expose:

```ts
validateEventName(name: string): boolean
assertValidEventName(name: string): void
```

Invalid event names should fail tests.

---

# 9. Event Architecture

The SDK event architecture has four layers:

```txt
Module / Business Object Service
  ↓
@sdk/server sdk.events.emit(ctx, definition, args)
  ↓
Kernel Event Bus
  ↓
Registered Listeners
```

Modules do not import the Kernel event bus.

Forbidden:

```ts
// ❌ Module importing Kernel internals
import { bus } from '@/kernel/events/bus'
```

Allowed:

```ts
// ✅ Module using server SDK
import { sdk } from '@/sdk/server'
```

The Kernel may contain the in-process bus implementation.

Modules only know the SDK interface.

---

# 10. Server-Only Rule

Domain events may only be emitted on the server.

Allowed locations:

```txt
Server services
API route handlers
Server actions, if used later
Kernel server code
Platform Service server code
```

Forbidden locations:

```txt
Client components
React event handlers
Browser SDK
Local optimistic UI code
```

Wrong:

```tsx
'use client'

await sdk.events.emit(...)
```

Correct:

```txt
Client submits mutation
  ↓
API route validates auth, tenant, permission, input
  ↓
Service performs mutation
  ↓
Service emits event server-side
```

The client may trigger business actions, but the server emits domain events after validation and persistence.

---

# 11. Event Definitions

Events should be defined as typed contracts, not scattered raw strings.

Recommended structure:

```txt
src/modules/inventory/events.ts
src/business-objects/product/events.ts
src/kernel/events/contracts.ts
```

Example:

```ts
import { z } from 'zod'
import { defineEvent } from '@/sdk'

export const ProductCreatedEvent = defineEvent({
  name: 'objects.product.created',
  version: 1,
  payload: z.object({
    productId: z.string(),
    code: z.string(),
    name: z.string(),
  }),
})
```

Module-owned event:

```ts
import { z } from 'zod'
import { defineEvent } from '@/sdk'

export const StockMovementCreatedEvent = defineEvent({
  name: 'inventory.stock_movement.created',
  version: 1,
  payload: z.object({
    stockMovementId: z.string(),
    productId: z.string(),
    warehouseId: z.string(),
    quantityDelta: z.number(),
    movementType: z.enum(['in', 'out', 'adjustment', 'transfer']),
  }),
})
```

Kernel event:

```ts
import { z } from 'zod'
import { defineEvent } from '@/sdk'

export const ModuleEnabledEvent = defineEvent({
  name: 'kernel.module.enabled',
  version: 1,
  payload: z.object({
    moduleId: z.string(),
    enabledByUserId: z.string(),
  }),
})
```

---

# 12. EventDefinition Type

The shared SDK should export a safe event definition type from `@/sdk`.

```ts
export type EventDefinition<TPayload = unknown> = {
  name: EventName
  version: number
  payloadSchema?: ZodSchema<TPayload>
}
```

Recommended helper:

```ts
export function defineEvent<TPayload>(definition: {
  name: EventName
  version: number
  payload: ZodSchema<TPayload>
}): EventDefinition<TPayload> {
  assertValidEventName(definition.name)

  return {
    name: definition.name,
    version: definition.version,
    payloadSchema: definition.payload,
  }
}
```

This helper may live in shared-safe SDK code because it does not access database, auth, cookies, Supabase, Prisma, or server-only APIs.

---

# 13. EventEnvelope

Handlers should receive a normalized event envelope, not a raw payload.

```ts
export type EventEnvelope<TPayload = unknown> = {
  id: string
  name: EventName
  version: number

  org: {
    id: string
    slug: string
  }

  actor: {
    type: 'user' | 'system'
    userId: string | null
  }

  source: {
    module: string
    service?: string
  }

  entity?: {
    type: string
    id: string
  }

  payload: TPayload

  occurredAt: string
  requestId?: string
  correlationId?: string
  causationId?: string
}
```

Important fields:

| Field | Meaning |
|---|---|
| `id` | Unique event ID. Use `crypto.randomUUID()` for MVP. |
| `name` | Stable event contract name. |
| `version` | Payload contract version. |
| `org.id` | Tenant boundary, derived from `PlatformContext`. |
| `org.slug` | Human-readable tenant locator, derived from `PlatformContext`. |
| `actor.userId` | Platform user who caused the event. |
| `source.module` | Emitting module or namespace. |
| `source.service` | Emitting service class/function. |
| `entity.type` | Primary entity type affected. |
| `entity.id` | Primary entity ID affected. |
| `payload` | Event-specific payload. |
| `occurredAt` | ISO timestamp. |
| `requestId` | Request trace ID, if available. |
| `correlationId` | Multi-step workflow grouping ID, future. |
| `causationId` | Parent event ID, future. |

---

# 14. PlatformContext Requirement

`ctx` is mandatory for server event emission.

Allowed:

```ts
await sdk.events.emit(ctx, ProductCreatedEvent, {
  source: { module: 'objects', service: 'ProductService' },
  entity: { type: 'product', id: product.id },
  payload: {
    productId: product.id,
    code: product.code,
    name: product.name,
  },
})
```

Forbidden:

```ts
// ❌ No verified PlatformContext
await sdk.events.emit(ProductCreatedEvent, payload)

// ❌ Loose orgId
await sdk.events.emit('objects.product.created', orgId, payload)

// ❌ Client-supplied orgId in payload
await sdk.events.emit(ctx, ProductCreatedEvent, {
  payload: {
    orgId: input.orgId,
    productId: product.id,
  },
})
```

The SDK must derive tenant and actor metadata from `PlatformContext`, not from caller-provided payloads.

This preserves the security pattern:

```txt
Verified PlatformContext first.
Database access second.
Business operation third.
Event emission fourth.
```

---

# 15. SDK Events Public API

The shared SDK should expose event types and definition helpers.

```ts
// @/sdk
export type EventName
export type EventDefinition<TPayload>
export type EventEnvelope<TPayload>
export function defineEvent<TPayload>(...): EventDefinition<TPayload>
export function validateEventName(name: string): boolean
export function assertValidEventName(name: string): void
```

The server SDK should expose runtime event methods.

```ts
// @/sdk/server
sdk.events.emit(ctx, definition, args)
sdk.events.on(definition, handler)
sdk.events.off(subscription)
```

Recommended server API:

```ts
await sdk.events.emit(ctx, ProductCreatedEvent, {
  source: {
    module: 'objects',
    service: 'ProductService',
  },
  entity: {
    type: 'product',
    id: product.id,
  },
  payload: {
    productId: product.id,
    code: product.code,
    name: product.name,
  },
})
```

Handler API:

```ts
const unsubscribe = sdk.events.on(ProductCreatedEvent, async (event) => {
  // event is EventEnvelope<ProductCreatedPayload>
})
```

The browser SDK must not expose domain event emission.

```ts
// @/sdk/client
// ❌ no sdkClient.events.emit for domain events
```

---

# 16. Event Emit Arguments

Recommended type:

```ts
type EmitEventArgs<TPayload> = {
  source: {
    module: string
    service?: string
  }
  entity?: {
    type: string
    id: string
  }
  payload: TPayload
  correlationId?: string
  causationId?: string
}
```

Full emit signature:

```ts
async function emit<TPayload>(
  ctx: PlatformContext,
  definition: EventDefinition<TPayload>,
  args: EmitEventArgs<TPayload>
): Promise<EmitResult>
```

Recommended result:

```ts
type EmitResult = {
  eventId: string
  listenerCount: number
  failures: Array<{
    listenerName?: string
    message: string
  }>
}
```

Listener failures should be reported and logged but should not throw by default.

---

# 17. Handler Signature

Recommended handler type:

```ts
type EventHandler<TPayload> = (
  event: EventEnvelope<TPayload>
) => Promise<void> | void
```

Handlers receive the full envelope.

They do not receive `ctx` directly.

If a handler needs to read or write tenant data, it must create or receive a safe system context derived from the event envelope through a Kernel-controlled helper.

Example future helper:

```ts
const systemCtx = await sdk.auth.createSystemContextFromEvent(event, {
  service: 'search-indexer',
})
```

This helper is deferred.

For MVP, event listeners should generally be limited to simple in-process logging, test assertions, and non-critical side effects.

---

# 18. MVP Event Bus Behavior

The restarted MVP may use an in-process event bus.

MVP bus rules:

```txt
1. Event handlers run in the same Node.js process.
2. Event handlers are awaited with Promise.allSettled.
3. One failed listener does not stop other listeners.
4. Listener failures are logged.
5. Event delivery is best-effort.
6. Event delivery is not durable.
7. Event order is not guaranteed across separate events.
8. Event handlers must be idempotent.
```

This is acceptable for MVP because Platform Services are not yet built.

But the SDK API must be compatible with a future durable event system.

---

# 19. Future Durable Event Architecture

When the Three Independent Use Cases Rule proves the need, events can evolve into an outbox-based architecture.

Future flow:

```txt
Business mutation transaction
  ↓
Write domain data
  ↓
Write event_outbox row in same transaction
  ↓
Commit
  ↓
Background worker reads outbox
  ↓
Dispatches listeners / notifications / webhooks / search indexing
```

Future table:

```prisma
model EventOutbox {
  id            String   @id @default(cuid())
  orgId         String
  name          String
  version       Int
  sourceModule  String
  sourceService String?
  entityType    String?
  entityId      String?
  actorType     String
  actorUserId   String?
  payload       Json
  occurredAt    DateTime
  processedAt   DateTime?
  attempts      Int      @default(0)
  lastError      String?
  createdAt     DateTime @default(now())

  @@index([orgId, name])
  @@index([processedAt, createdAt])
  @@map("event_outbox")
}
```

Do not build this in the MVP unless a frozen document explicitly authorizes it.

---

# 20. Events and Database Transactions

Events should be emitted after the database mutation succeeds.

Simple MVP pattern:

```ts
const product = await db.product.create({
  data: {
    orgId: ctx.org.id,
    code: input.code,
    name: input.name,
  },
})

await sdk.events.emit(ctx, ProductCreatedEvent, {
  source: { module: 'objects', service: 'ProductService' },
  entity: { type: 'product', id: product.id },
  payload: {
    productId: product.id,
    code: product.code,
    name: product.name,
  },
})

return product
```

Avoid emitting inside a Prisma transaction unless the event is written to an outbox table inside that same transaction.

Problematic pattern:

```ts
// ❌ Avoid in MVP
await sdk.db.transaction(ctx, async (tx) => {
  const product = await tx.product.create(...)

  // Listener may read product before transaction commits.
  // Listener may fail while transaction is still open.
  await sdk.events.emit(ctx, ProductCreatedEvent, ...)
})
```

Preferred MVP pattern:

```ts
const product = await sdk.db.transaction(ctx, async (tx) => {
  return tx.product.create(...)
})

await sdk.events.emit(ctx, ProductCreatedEvent, ...)
```

When durable outbox is implemented, this changes:

```ts
await sdk.db.transaction(ctx, async (tx) => {
  const product = await tx.product.create(...)
  await sdk.events.enqueue(tx, ctx, ProductCreatedEvent, ...)
  return product
})
```

But `enqueue` is deferred.

---

# 21. Events and Error Handling

Event name validation errors should fail fast.

Payload validation errors should fail fast.

Listener errors should not fail the original business operation.

Behavior matrix:

| Error Type | Should mutation fail? | Reason |
|---|---:|---|
| Invalid event name | Yes | Developer contract bug. |
| Invalid payload schema | Yes | Developer contract bug. |
| Missing PlatformContext | Yes | Security bug. |
| Listener throws | No | Subscribers should not break publisher. |
| Event bus unavailable in MVP | Log and continue if non-critical | MVP bus is best-effort. |
| Future durable outbox write fails | Yes if event is part of transaction | Audit/event durability may be required later. |

Implementation rule:

```txt
Emit should validate the event contract before dispatching listeners.
Listener failures are isolated after validation succeeds.
```

---

# 22. Events and Tenant Isolation

Every event is tenant-scoped unless explicitly marked as global Kernel telemetry.

For MVP, all business events are tenant-scoped.

The emitting SDK must set:

```ts
event.org.id = ctx.org.id
event.org.slug = ctx.org.slug
```

Listeners must never process one org's event as another org.

Forbidden:

```ts
// ❌ Listener uses payload.orgId
const db = sdk.getDb({ orgId: event.payload.orgId })
```

Correct future pattern:

```ts
// ✅ Listener derives service context from event envelope
const systemCtx = await sdk.auth.createSystemContextFromEvent(event, {
  service: 'search-indexer',
})

const db = sdk.getDb(systemCtx)
```

Because system context from events is not yet defined, MVP listeners should be limited and carefully reviewed.

---

# 23. Events and Permissions

Events do not grant permission.

Permission is checked before mutation.

Example flow:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'create',
})

const product = await ProductService.create(ctx, input)
```

Inside the service:

```ts
const product = await db.product.create(...)
await sdk.events.emit(ctx, ProductCreatedEvent, ...)
```

The event proves that an authorized mutation happened.

The event itself is not used to authorize the mutation.

Admin wildcard permissions also do not bypass tenant isolation.

An Admin in Org A can emit events only for Org A because the event context comes from Org A's verified `PlatformContext`.

---

# 24. Events and Module Enablement

A module should emit events only when the module is enabled for the organization.

This must be checked before the business action occurs.

Example:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

This helper checks:

```txt
1. Authenticated user
2. Platform user exists
3. Organization exists
4. User belongs to organization
5. Organization is active
6. Inventory module is enabled
```

If the module is disabled, the business action should not run and no module event should be emitted.

Business Object events are different.

If the product is created through the shared Business Object API, the namespace is `objects`, and the required gate is Business Object permission, not Inventory enablement.

---

# 25. Events and Business Objects

Every mutation of a shared Business Object should emit an event.

Shared Business Object events:

```txt
objects.employee.created
objects.employee.updated
objects.employee.deactivated
objects.employee.deleted

objects.product.created
objects.product.updated
objects.product.deleted

objects.customer.created
objects.customer.updated
objects.customer.deleted

objects.supplier.created
objects.supplier.updated
objects.supplier.deleted

objects.warehouse.created
objects.warehouse.updated
objects.warehouse.deleted
```

These are required because future Platform Services will depend on them:

```txt
Audit Log Service
Search Service
AI Context Service
Reporting Service
Notification Service
```

Business Object events should include:

```txt
Entity ID
Stable display fields
Minimal summary fields
No secrets
No unnecessary PII
```

Example payload:

```ts
{
  productId: product.id,
  code: product.code,
  name: product.name,
}
```

Do not include the entire Prisma record by default.

---

# 26. Events and Module Manifests

Module manifests must declare the events they emit and listen to.

Recommended manifest shape:

```ts
export const InventoryModule = {
  id: 'inventory',
  label: 'Inventory',
  version: '1.0.0',
  kernelVersion: '1.0.0',

  events: {
    emits: [
      'inventory.stock_movement.created',
      'inventory.stock_adjustment.submitted',
      'inventory.stock_adjustment.approved',
    ],
    listens: [
      'objects.product.created',
      'objects.warehouse.created',
    ],
  },
}
```

Manifest declarations are used for:

```txt
Architecture review
Dependency analysis
Future marketplace inspection
Future AI context
Future event documentation
Future generated tests
```

If a module emits an event that is not listed in its manifest, tests should fail.

If a module listens to an event that is not listed in its manifest, tests should fail.

---

# 27. Listener Registration

Listeners should be registered explicitly.

Recommended structure:

```txt
src/modules/inventory/
  manifest.ts
  events.ts
  service.ts
```

Example:

```ts
// src/modules/inventory/events.ts
import { sdk } from '@/sdk/server'
import { ProductCreatedEvent } from '@/business-objects/product/events'

export function registerInventoryEventListeners() {
  sdk.events.on(ProductCreatedEvent, async (event) => {
    // MVP: keep this simple; do not create complex cross-module side effects yet.
    console.info('[inventory] product created', event.entity?.id)
  })
}
```

Root module barrel:

```ts
// src/modules/index.ts
import { InventoryModule } from './inventory/manifest'
import { registerInventoryEventListeners } from './inventory/events'
import { sdk } from '@/sdk/server'

sdk.modules.register(InventoryModule)
registerInventoryEventListeners()
```

The exact loader implementation will be finalized in the Module System document.

For now, the architectural rule is:

```txt
Listener registration must be explicit, inspectable, and testable.
```

---

# 28. Listener Idempotency

Every listener must be idempotent.

A listener may receive the same event more than once in a future durable event system.

Idempotent example:

```ts
await searchIndex.upsert({
  orgId: event.org.id,
  entityType: event.entity.type,
  entityId: event.entity.id,
  document: buildDocument(event),
})
```

Non-idempotent example:

```ts
// ❌ Could double-send notification if event is retried
await sendEmail(user.email, 'Product created')
```

Safer future pattern:

```ts
await notificationService.enqueueOnce({
  eventId: event.id,
  recipientId: user.id,
  template: 'product_created',
})
```

For MVP, avoid important non-idempotent side effects in listeners.

---

# 29. Listener Failure Isolation

One broken listener must not break other listeners.

Correct bus behavior:

```ts
const results = await Promise.allSettled(
  handlers.map((handler) => handler(event))
)
```

Then log failures:

```ts
for (const result of results) {
  if (result.status === 'rejected') {
    console.error('[events] listener failed', {
      eventId: event.id,
      eventName: event.name,
      error: result.reason,
    })
  }
}
```

Do not use:

```ts
// ❌ Stops after first thrown listener
for (const handler of handlers) {
  await handler(event)
}
```

unless failure propagation is intentionally part of a future workflow engine.

---

# 30. Payload Design Rules

Event payloads should be small, stable, and safe.

Include:

```txt
Entity IDs
Stable display fields
Business state needed by subscribers
Amounts/statuses/dates relevant to the event
```

Avoid:

```txt
Full Prisma records
Raw request bodies
Passwords
Tokens
Secrets
Service role keys
Large blobs
Unnecessary PII
Client-supplied orgId
Nested unrelated entities
```

Good payload:

```ts
{
  leaveRequestId: leaveRequest.id,
  employeeId: leaveRequest.employeeId,
  dateFrom: leaveRequest.dateFrom.toISOString(),
  dateTo: leaveRequest.dateTo.toISOString(),
  status: leaveRequest.status,
}
```

Bad payload:

```ts
{
  orgId: body.orgId,
  requestBody: body,
  employee: fullEmployeeRecord,
  userSession: session,
}
```

Payloads are long-term contracts.

Do not casually add or remove payload fields after modules or services subscribe to them.

---

# 31. Payload Versioning

Every event definition has a version.

```ts
export const ProductCreatedEvent = defineEvent({
  name: 'objects.product.created',
  version: 1,
  payload: ProductCreatedPayloadSchema,
})
```

Backward-compatible changes:

```txt
Adding optional payload field
Adding non-breaking metadata
Clarifying docs
```

Breaking changes:

```txt
Removing field
Renaming field
Changing field type
Changing meaning of field
Making optional field required
```

Breaking changes require one of these:

```txt
1. New version with migration path, or
2. New event name if semantic meaning changed.
```

Example:

```txt
objects.product.created v1
objects.product.created v2
```

or, if the meaning is truly different:

```txt
objects.product.imported
```

Do not silently change payload meaning.

---

# 32. Events and Audit Logs

The Audit Log Service is deferred.

But event design must prepare for it.

Audit logs will eventually subscribe to events like:

```txt
objects.product.created
objects.product.updated
objects.customer.deleted
kernel.permission.granted
inventory.stock_adjustment.approved
```

Therefore event envelopes must already include:

```txt
Event ID
Org ID
Actor user ID
Source module/service
Entity type/id
Timestamp
Payload
```

Do not build Audit Log Service in the MVP.

But do not emit weak events that make Audit impossible later.

---

# 33. Events and Search

Search Service is deferred.

But searchable entities should eventually emit events that allow indexing.

Examples:

```txt
objects.product.created → index product
objects.product.updated → update product index
objects.product.deleted → remove product from index
objects.customer.created → index customer
objects.employee.updated → update employee index
```

Event payloads should include enough summary fields for lightweight indexing, but Search can also fetch fresh data using a future system context.

Do not build Search Service yet.

---

# 34. Events and Notifications

Notification Service is deferred.

Modules should not hard-code platform notifications unless only one module needs them.

Example:

```txt
inventory.stock_level.low
```

If only Inventory needs it, Inventory may handle it internally.

If Leave, Purchasing, Expenses, and Inventory all need user notifications, promote to Platform Notification Service under the Three Independent Use Cases Rule.

Events make that promotion easier.

---

# 35. Events and AI Layer

The AI Layer is deferred.

But future AI context can subscribe to events to update what it knows about an organization.

Examples:

```txt
objects.product.created
objects.employee.created
inventory.stock_movement.created
leave.leave_request.approved
```

The AI Layer must never bypass permissions.

Events should not leak sensitive data into AI context by default.

Therefore event payloads should be minimal and safe.

---

# 36. Events and Background Jobs

Background Jobs are deferred.

The event API must not expose implementation details that would prevent a queue later.

Do not let modules depend on synchronous listener behavior.

Forbidden assumption:

```ts
await sdk.events.emit(ctx, Event, args)
// assume listener already updated search index
```

Correct assumption:

```txt
After emit completes, the event was accepted for best-effort dispatch.
Subscribers may process now or later.
```

This allows `sdk.events.emit` to later change from:

```txt
in-process dispatch
```

to:

```txt
outbox + worker
```

without changing module code.

---

# 37. Events and Module-to-Module Communication

Modules may react to other modules' events only through the SDK event system.

Allowed:

```txt
CRM listens to objects.customer.created
Inventory listens to objects.product.created
Purchasing listens to objects.supplier.created
Assets listens to objects.employee.deactivated
```

Forbidden:

```ts
// ❌ Direct module import
import { InventoryService } from '@/modules/inventory/service'
```

Event-based communication should still be used carefully.

If Module B cannot function without Module A, that is a module dependency and must be declared in the manifest.

If Module B only enriches behavior when Module A emits events, that may be an optional event listener.

---

# 38. Required Events for MVP Kernel

The restarted Kernel should define, at minimum, these event contracts.

## 38.1 Kernel Events

```txt
kernel.organization.created
kernel.organization.updated
kernel.organization.suspended
kernel.organization.reactivated

kernel.user.created
kernel.user.updated
kernel.user.deactivated
kernel.user.reactivated

kernel.role.created
kernel.role.updated
kernel.role.deleted

kernel.permission.granted
kernel.permission.revoked

kernel.module.enabled
kernel.module.disabled
```

These events support future audit logs, admin timelines, and support diagnostics.

## 38.2 Business Object Events

```txt
objects.employee.created
objects.employee.updated
objects.employee.deactivated
objects.employee.deleted

objects.product.created
objects.product.updated
objects.product.deleted

objects.customer.created
objects.customer.updated
objects.customer.deleted

objects.supplier.created
objects.supplier.updated
objects.supplier.deleted

objects.warehouse.created
objects.warehouse.updated
objects.warehouse.deleted
```

Business Object CRUD may not be implemented immediately, but when those mutations are implemented, these events are mandatory.

## 38.3 Module Events

No official module events are mandatory until a module spec is frozen.

For Inventory later, likely events include:

```txt
inventory.stock_movement.created
inventory.stock_adjustment.submitted
inventory.stock_adjustment.approved
inventory.stock_adjustment.rejected
inventory.stock_level.recalculated
inventory.stock_level.low
```

These should be finalized in the Inventory Module Specification, not here.

---

# 39. Implementation File Structure

Recommended SDK event files:

```txt
src/sdk/
  events/
    types.ts
    define-event.ts
    validate-event-name.ts
  index.ts

src/sdk/server/
  events.ts
  index.ts

src/kernel/
  events/
    bus.ts
    contracts.ts
    __tests__/
      bus.test.ts
      event-name.test.ts
      emit.test.ts
```

Possible shared Business Object event contracts:

```txt
src/business-objects/
  employee/events.ts
  product/events.ts
  customer/events.ts
  supplier/events.ts
  warehouse/events.ts
```

If the repo does not yet have a `src/business-objects` folder, the System Architecture and Business Object documents should decide the final location.

Do not put Business Object event contracts inside a business module.

---

# 40. Example Implementation Sketch

This is not final code, but it defines the intended shape.

```ts
// src/sdk/events/types.ts
import type { z } from 'zod'

export type EventName = `${string}.${string}.${string}`

export type EventDefinition<TPayload> = {
  name: EventName
  version: number
  payloadSchema: z.ZodType<TPayload>
}

export type EventEnvelope<TPayload> = {
  id: string
  name: EventName
  version: number
  org: {
    id: string
    slug: string
  }
  actor: {
    type: 'user' | 'system'
    userId: string | null
  }
  source: {
    module: string
    service?: string
  }
  entity?: {
    type: string
    id: string
  }
  payload: TPayload
  occurredAt: string
  requestId?: string
  correlationId?: string
  causationId?: string
}
```

```ts
// src/sdk/events/define-event.ts
export function defineEvent<TPayload>(definition: {
  name: EventName
  version: number
  payload: z.ZodType<TPayload>
}): EventDefinition<TPayload> {
  assertValidEventName(definition.name)

  return {
    name: definition.name,
    version: definition.version,
    payloadSchema: definition.payload,
  }
}
```

```ts
// src/sdk/server/events.ts
export const events = {
  async emit<TPayload>(
    ctx: PlatformContext,
    definition: EventDefinition<TPayload>,
    args: EmitEventArgs<TPayload>
  ): Promise<EmitResult> {
    assertServerContext(ctx)
    assertValidEventName(definition.name)

    const parsedPayload = definition.payloadSchema.parse(args.payload)

    const envelope: EventEnvelope<TPayload> = {
      id: crypto.randomUUID(),
      name: definition.name,
      version: definition.version,
      org: {
        id: ctx.org.id,
        slug: ctx.org.slug,
      },
      actor: {
        type: ctx.user ? 'user' : 'system',
        userId: ctx.user?.id ?? null,
      },
      source: args.source,
      entity: args.entity,
      payload: parsedPayload,
      occurredAt: new Date().toISOString(),
      requestId: ctx.requestId,
      correlationId: args.correlationId,
      causationId: args.causationId,
    }

    return kernelEventBus.emit(envelope)
  },

  on<TPayload>(
    definition: EventDefinition<TPayload>,
    handler: EventHandler<TPayload>
  ) {
    return kernelEventBus.on(definition.name, handler)
  },
}
```

---

# 41. Correct Usage Example — Business Object Mutation

```ts
import { sdk } from '@/sdk/server'
import { ProductCreatedEvent } from '@/business-objects/product/events'
import { CreateProductSchema } from './schema'

export class ProductService {
  static async create(ctx: PlatformContext, input: unknown) {
    await sdk.permissions.require(ctx, {
      module: 'objects',
      resource: 'product',
      action: 'create',
    })

    const data = CreateProductSchema.parse(input)
    const db = sdk.getDb(ctx)

    const product = await db.product.create({
      data: {
        orgId: ctx.org.id,
        code: data.code,
        name: data.name,
        unit: data.unit,
      },
    })

    await sdk.events.emit(ctx, ProductCreatedEvent, {
      source: { module: 'objects', service: 'ProductService' },
      entity: { type: 'product', id: product.id },
      payload: {
        productId: product.id,
        code: product.code,
        name: product.name,
      },
    })

    return product
  }
}
```

---

# 42. Correct Usage Example — Module Mutation

```ts
import { sdk } from '@/sdk/server'
import { StockMovementCreatedEvent } from './events'

export class StockMovementService {
  static async create(ctx: PlatformContext, input: CreateStockMovementInput) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_movement',
      action: 'create',
    })

    const db = sdk.getDb(ctx)

    const movement = await db.stockMovement.create({
      data: {
        orgId: ctx.org.id,
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantityDelta: input.quantityDelta,
        movementType: input.movementType,
      },
    })

    await sdk.events.emit(ctx, StockMovementCreatedEvent, {
      source: { module: 'inventory', service: 'StockMovementService' },
      entity: { type: 'stock_movement', id: movement.id },
      payload: {
        stockMovementId: movement.id,
        productId: movement.productId,
        warehouseId: movement.warehouseId,
        quantityDelta: movement.quantityDelta,
        movementType: movement.movementType,
      },
    })

    return movement
  }
}
```

---

# 43. Forbidden Patterns

## 43.1 Raw Kernel Bus Import

```ts
// ❌ Forbidden inside modules
import { bus } from '@/kernel/events/bus'
```

Use:

```ts
// ✅
import { sdk } from '@/sdk/server'
```

## 43.2 Raw String Emission in Business Logic

```ts
// ❌ Forbidden
await sdk.events.emit(ctx, 'objects.product.created', payload)
```

Use typed event definitions:

```ts
// ✅
await sdk.events.emit(ctx, ProductCreatedEvent, args)
```

## 43.3 Client-Side Event Emission

```tsx
// ❌ Forbidden
'use client'
await sdk.events.emit(...)
```

## 43.4 Client-Supplied orgId

```ts
// ❌ Forbidden
await sdk.events.emit(ctx, ProductCreatedEvent, {
  payload: {
    orgId: input.orgId,
    productId: product.id,
  },
})
```

Tenant metadata comes from `ctx`.

## 43.5 Required Business Logic in Listener

```ts
// ❌ Dangerous assumption
await sdk.events.emit(ctx, OrderApprovedEvent, args)
// assume listener creates purchase order synchronously
```

If a workflow requires a guaranteed next step, use an explicit service/workflow design.

Events are not a replacement for transactionally required domain logic.

---

# 44. Testing Requirements

The SDK event system must include tests for:

```txt
Event name validation
Event definition creation
Payload schema validation
Envelope creation from PlatformContext
No loose orgId accepted
Listener registration
Listener deregistration
Multiple listeners receiving one event
One listener failure not blocking others
Invalid payload rejects before dispatch
Invalid event name rejects before dispatch
Handlers receive EventEnvelope, not raw payload
Client SDK does not export domain emit
Modules do not import @/kernel/events
```

---

# 45. Required Test Cases

## 45.1 Event Name Validation

```txt
Given valid name objects.product.created
When validateEventName is called
Then it returns true
```

```txt
Given invalid name ProductCreated
When assertValidEventName is called
Then it throws
```

## 45.2 Payload Validation

```txt
Given ProductCreatedEvent requires productId, code, name
When payload misses productId
Then sdk.events.emit throws before dispatching listeners
```

## 45.3 Envelope Uses PlatformContext

```txt
Given ctx.org.id = org_a
When ProductCreatedEvent is emitted
Then envelope.org.id = org_a
And payload.orgId is not required
```

## 45.4 Listener Failure Isolation

```txt
Given two listeners
And listener A throws
When event is emitted
Then listener B still receives the event
And emit result reports one failure
```

## 45.5 No Kernel Import in Modules

```txt
Given module code
When import rules are checked
Then modules cannot import '@/kernel/events/*'
```

## 45.6 Manifest Event Declaration

```txt
Given Inventory emits inventory.stock_movement.created
When manifest is validated
Then that event appears in manifest.events.emits
```

---

# 46. Lint and Static Analysis Rules

The architecture should eventually enforce:

```txt
modules/* cannot import @/kernel/events/*
modules/* cannot import @/kernel/*
client components cannot import @/sdk/server
client components cannot call sdk.events.emit
event names must match pattern
module emitted events must appear in manifest
module listened events must appear in manifest
```

Potential tools:

```txt
ESLint no-restricted-imports
dependency-cruiser
custom test scripts
manifest validation tests
```

These checks should be part of CI once the module system is implemented.

---

# 47. Claude Implementation Instructions

When Claude implements the SDK event system, use this prompt shape:

```md
You are implementing OneDayOS SDK Events.

Authoritative document:
docs/engineering-manual/05-sdk/04-sdk-events.md

Rules:
- Do not invent event architecture.
- Do not import @/kernel/events from modules.
- Do not expose event emission in @/sdk/client.
- Do not accept orgId as an event emit argument.
- Events must use PlatformContext.
- Events must validate names.
- Events must validate payload schemas.
- Event handlers receive EventEnvelope.
- Listener failures must not break the original mutation.
- Do not add Redis, Kafka, FastAPI, or background jobs.
- Do not build Audit Log Service.
- Do not build Notification Service.
- Do not build Search Service.

Implement only:
1. Shared event types/helpers in @/sdk.
2. Server event runtime in @/sdk/server.
3. Kernel in-process event bus.
4. Tests required by this document.
```

---

# 48. Implementation Acceptance Criteria

The SDK event system is accepted only when:

```txt
[ ] @/sdk exports shared event types and defineEvent helper
[ ] @/sdk/server exports sdk.events.emit/on/off
[ ] @/sdk/client does not export domain event emission
[ ] Event names are validated
[ ] Event payloads are validated through schemas
[ ] Event envelopes are created from PlatformContext
[ ] orgId cannot be passed directly to emit
[ ] Listener failures are isolated
[ ] Event handlers receive full envelope
[ ] Modules cannot import @/kernel/events
[ ] Tests cover event validation
[ ] Tests cover payload validation
[ ] Tests cover listener failure isolation
[ ] Tests cover tenant metadata from ctx
[ ] Tests cover forbidden client/server SDK boundary
[ ] TypeScript passes
[ ] Build passes
```

Commands:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

---

# 49. Architectural Risks

## 49.1 Event System Becomes a Hidden Workflow Engine

Risk:

```txt
Developers start using events to orchestrate required business processes.
```

Mitigation:

```txt
Events are facts, not commands.
Required workflows need explicit service/workflow design.
```

## 49.2 Event Payloads Leak Sensitive Data

Risk:

```txt
Future AI/search/audit systems consume payloads containing too much information.
```

Mitigation:

```txt
Payload minimalism.
No full Prisma records.
No secrets.
No raw request bodies.
```

## 49.3 In-Process Bus Gives False Durability

Risk:

```txt
Developers assume events are durable because the API looks formal.
```

Mitigation:

```txt
Document MVP best-effort semantics clearly.
Do not use listeners for mission-critical side effects.
Add outbox later through frozen Platform Service spec.
```

## 49.4 Raw Strings Cause Contract Drift

Risk:

```txt
Typos silently break subscribers.
```

Mitigation:

```txt
Typed event definitions.
Runtime validation.
Manifest event declarations.
Tests.
```

## 49.5 Cross-Tenant Event Handling Mistakes

Risk:

```txt
Listener processes Org A event using Org B context.
```

Mitigation:

```txt
Envelope derives org from PlatformContext.
Listeners cannot use payload orgId.
Future system context helper derives tenant from event envelope.
```

---

# 50. Final Decision

OneDayOS should implement SDK Events in the restarted build, but only as a lightweight, in-process, server-side event system behind the SDK.

It should not implement durable event infrastructure yet.

It should not implement Audit Logs, Notifications, Search, or AI event consumers yet.

But it must define event contracts correctly from day one because future Platform Services will depend on them.

The final rule:

```txt
Events are stable tenant-scoped facts emitted through the server SDK after authorized business mutations.
They are not commands, not workflows, not client actions, and not a shortcut around permissions.
```

