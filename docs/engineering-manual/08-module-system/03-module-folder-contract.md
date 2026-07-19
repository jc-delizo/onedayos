# OneDayOS Engineering Manual — 08 Module System / 03 Module Folder Contract

**Document ID:** `08-module-system/03-module-folder-contract.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Architecture  
**Last Updated:** July 2026  
**Implementation Allowed:** No, not until marked `Frozen`  
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
- `05-sdk/05-sdk-compatibility-versioning.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/02-module-loader-registry.md`

---

## 1. Purpose

This document defines the required folder and file contract for every OneDayOS business module.

A module must be easy for a human engineer, Claude Code, tests, generators, and architecture checks to understand without guessing.

The folder contract exists to make module development:

1. Repeatable.
2. Secure by default.
3. Easy to generate.
4. Easy to review.
5. Easy to test.
6. Easy to evolve.
7. Compatible with the SDK-only architecture.
8. Compatible with the future marketplace/module ecosystem.

A module is not merely a directory under `src/modules`. A module is a structured business capability package with a required public contract and private implementation files.

---

## 2. Core Rule

Every business module must follow one predictable structure:

```txt
src/modules/[moduleId]/
  manifest.ts
  permissions.ts
  schema.ts
  types.ts
  service.ts
  events.ts
  settings.ts
  navigation.ts
  ai-context.ts
  docs.md
  index.ts
  README.md
  __tests__/
    manifest.test.ts
    service.test.ts
    permissions.test.ts
    events.test.ts
    tenant-isolation.test.ts
```

When the module grows, it may add approved subfolders:

```txt
src/modules/[moduleId]/
  components/
  services/
  validators/
  queries/
  mutations/
  mappers/
  fixtures/
  __tests__/
```

But the top-level public contract files must remain stable.

---

## 3. Why This Matters

OneDayOS intends to build and operate hundreds of SME business systems from one platform.

That goal fails if every module invents its own structure.

Bad module structure leads to:

```txt
Different service styles per module
Different permission styles per module
Different validation styles per module
Different event naming per module
Different API assumptions per module
Different tests per module
Different Claude output every time
```

The folder contract gives Claude a narrow lane:

```txt
Manifest goes here.
Permissions go here.
Schemas go here.
Service logic goes here.
Events go here.
Tests go here.
No architecture invention required.
```

---

## 4. Scope

This document defines:

1. Required module folder structure.
2. Required module files.
3. Optional module subfolders.
4. File responsibilities.
5. Public vs private module exports.
6. Server/client boundaries.
7. API route placement.
8. Page route placement.
9. Test placement.
10. Generated module requirements.
11. Forbidden module structures.
12. Claude implementation rules.

---

## 5. Non-Goals

This document does not define:

1. The module manifest schema in full. That belongs to `08-module-system/01-module-manifest.md`.
2. The module loader registry in full. That belongs to `08-module-system/02-module-loader-registry.md`.
3. Dynamic CRUD generation. That belongs to future Dynamic Systems documents.
4. The Inventory module specification. That belongs to `17-module-specifications/01-inventory-module.md`.
5. Platform Services. Those require Three Independent Use Cases evidence.
6. Remote module loading or marketplace installation.
7. Per-organization module version pinning.
8. FastAPI or a second backend runtime.

---

## 6. Required Module Root Structure

Every module must live under:

```txt
src/modules/[moduleId]/
```

Example:

```txt
src/modules/inventory/
src/modules/leave/
src/modules/crm/
src/modules/purchasing/
src/modules/assets/
```

The `moduleId` must be:

1. Lowercase.
2. URL-safe.
3. Kebab-case if multiple words.
4. Stable once released.
5. Unique across the platform.

Valid examples:

```txt
inventory
leave
crm
purchasing
visitor-management
incident-reporting
```

Invalid examples:

```txt
Inventory
inventory_module
ClientAInventory
inventory-v2
crmNew
```

---

## 7. Standard Module Folder Tree

A normal MVP module should use this structure:

```txt
src/modules/[moduleId]/
  manifest.ts
  permissions.ts
  schema.ts
  types.ts
  service.ts
  events.ts
  settings.ts
  navigation.ts
  ai-context.ts
  docs.md
  index.ts
  README.md
  __tests__/
    manifest.test.ts
    service.test.ts
    permissions.test.ts
    events.test.ts
    tenant-isolation.test.ts
```

A larger module may use this expanded structure:

```txt
src/modules/[moduleId]/
  manifest.ts
  permissions.ts
  schema.ts
  types.ts
  service.ts
  events.ts
  settings.ts
  navigation.ts
  ai-context.ts
  docs.md
  index.ts
  README.md

  components/
    [Module]EmptyState.tsx
    [Module]StatusBadge.tsx
    [Module]SummaryCard.tsx

  services/
    [entity].service.ts
    [workflow].service.ts

  queries/
    [entity].queries.ts

  mutations/
    [entity].mutations.ts

  validators/
    [entity].validators.ts

  mappers/
    [entity].mapper.ts

  fixtures/
    [module].fixtures.ts

  __tests__/
    manifest.test.ts
    service.test.ts
    permissions.test.ts
    events.test.ts
    tenant-isolation.test.ts
    api-contract.test.ts
    validation.test.ts
```

The expanded structure is allowed only when the module has enough complexity to justify it.

Do not create subfolders for theoretical future complexity.

---

## 8. Required File Responsibilities

### 8.1 `manifest.ts`

Purpose: declares the module’s public platform contract.

It must export a pure manifest object.

Example:

```ts
import type { ModuleManifest } from '@/sdk'
import { inventoryPermissions } from './permissions'
import { inventoryNavItems } from './navigation'
import { inventoryEvents } from './events'
import { inventoryAiContext } from './ai-context'

export const inventoryManifest = {
  id: 'inventory',
  label: 'Inventory',
  description: 'Manage stock levels, movements, adjustments, and warehouse inventory.',
  version: '0.1.0',
  compatibility: {
    platform: { min: '0.1.0', maxExclusive: '1.0.0' },
    sdk: { min: '0.1.0', maxExclusive: '1.0.0' },
    manifest: { version: '1.0' },
  },
  icon: 'Package',
  dependencies: [],
  businessObjects: ['product', 'warehouse', 'supplier'],
  ownedEntities: ['stock_movement', 'stock_adjustment', 'stock_balance'],
  permissions: inventoryPermissions,
  navItems: inventoryNavItems,
  events: inventoryEvents,
  aiContext: inventoryAiContext,
} satisfies ModuleManifest
```

`manifest.ts` must not:

```txt
Import @/kernel/*
Import @/sdk/server
Import Prisma
Import services
Perform database queries
Register itself as a side effect
Start event listeners as a side effect
Read environment variables
Call fetch
Call dynamic runtime APIs
Contain business logic
```

The manifest must be statically importable by the module registry.

---

### 8.2 `permissions.ts`

Purpose: defines all permissions introduced by the module.

Example:

```ts
import type { PermissionDefinition } from '@/sdk'

export const inventoryPermissions = [
  {
    module: 'inventory',
    resource: 'stock_balance',
    action: 'read',
    label: 'View stock balances',
    description: 'Allows viewing stock levels across warehouses.',
  },
  {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
    label: 'Create stock adjustments',
    description: 'Allows creating stock adjustment records.',
  },
] satisfies PermissionDefinition[]
```

Rules:

1. Module permissions must use the module ID as the `module` namespace.
2. Module permissions must not use wildcard `*`.
3. Module permissions must use non-null `resource`.
4. Module permission constants should be exported for services and pages.
5. Business Object permissions must not be declared as module permissions.

Bad:

```ts
{ module: '*', resource: '*', action: '*' }
{ module: 'inventory', resource: null, action: 'read' }
{ module: 'inventory', resource: 'product', action: 'create' } // product is a Business Object
```

Good:

```ts
{ module: 'inventory', resource: 'stock_movement', action: 'create' }
{ module: 'inventory', resource: 'stock_adjustment', action: 'approve' }
{ module: 'objects', resource: 'product', action: 'create' } // belongs to Business Object area, not module manifest
```

---

### 8.3 `schema.ts`

Purpose: defines client-safe Zod schemas and TypeScript input types.

Example:

```ts
import { z } from 'zod'

export const createStockAdjustmentSchema = z.strictObject({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int(),
  reason: z.string().min(1).max(500),
})

export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>
```

Rules:

1. Use `z.strictObject()` by default for API payloads.
2. Do not include `orgId` in client-submitted schemas.
3. Do not include `userId` in client-submitted schemas when it should come from context.
4. Do not include permission fields in client-submitted schemas.
5. Export inferred types from schemas.
6. Keep schemas client-safe unless the file is explicitly server-only.

Bad:

```ts
export const createInventoryRecordSchema = z.object({
  orgId: z.string(),
  name: z.string(),
})
```

Good:

```ts
export const createInventoryRecordSchema = z.strictObject({
  name: z.string().min(1),
})
```

`orgId` comes from verified `PlatformContext`, never from request body.

---

### 8.4 `types.ts`

Purpose: defines module-specific TypeScript types.

Example:

```ts
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer'

export type StockMovementListItem = {
  id: string
  productName: string
  warehouseName: string
  quantity: number
  movementType: StockMovementType
  createdAt: string
}
```

Rules:

1. Keep module-specific types here.
2. Do not duplicate SDK types.
3. Do not duplicate Business Object types unless creating view models.
4. Prefer view-model types for UI/API outputs.
5. Do not export raw Prisma model types directly to client components.

Allowed:

```ts
ProductOption
StockMovementListItem
InventoryDashboardStats
```

Forbidden:

```ts
InventoryProduct // if it duplicates Product identity
RawPrismaStockMovementWithSecrets
```

---

### 8.5 `service.ts`

Purpose: defines the module service API.

For small modules, one `service.ts` is enough.

Example:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
import { createStockAdjustmentSchema } from './schema'

export const InventoryService = {
  async listStockBalances(ctx: PlatformContext) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_balance',
      action: 'read',
    })

    const db = sdk.getDb(ctx)

    return db.stockBalance.findMany({
      where: {
        orgId: ctx.org.id,
        deletedAt: null,
      },
    })
  },

  async createStockAdjustment(ctx: PlatformContext, input: unknown) {
    await sdk.permissions.require(ctx, {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'create',
    })

    const data = createStockAdjustmentSchema.parse(input)
    const db = sdk.getDb(ctx)

    const adjustment = await db.stockAdjustment.create({
      data: {
        orgId: ctx.org.id,
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        reason: data.reason,
        createdBy: ctx.user.id,
      },
    })

    await sdk.events.emit(ctx, 'inventory.stock_adjustment.created', {
      stockAdjustmentId: adjustment.id,
    })

    return adjustment
  },
}
```

Rules:

1. Services receive verified `PlatformContext`.
2. Services must not accept loose `orgId` strings.
3. Services must not accept raw request objects.
4. Services must enforce permissions for sensitive operations.
5. Services must validate input or receive already-validated input from an API wrapper.
6. Services must use `sdk.getDb(ctx)`.
7. Services must emit events for mutations.
8. Services must soft-delete business data.
9. Services must not import other modules.
10. Services must not import `@/kernel/*`.

Forbidden:

```ts
InventoryService.list(orgId: string)
InventoryService.create(body: any)
import { prisma } from '@/kernel/db/client'
import { CustomerService } from '@/modules/crm/service'
```

Allowed:

```ts
InventoryService.list(ctx: PlatformContext)
InventoryService.create(ctx: PlatformContext, input: CreateInput)
import { sdk } from '@/sdk/server'
```

---

### 8.6 `events.ts`

Purpose: declares module event names and event payload schemas.

Example:

```ts
import { z } from 'zod'
import type { ModuleEventDefinition } from '@/sdk'

export const inventoryEventNames = {
  stockAdjustmentCreated: 'inventory.stock_adjustment.created',
  stockMovementCreated: 'inventory.stock_movement.created',
  stockLevelLow: 'inventory.stock_level.low',
} as const

export const stockAdjustmentCreatedPayloadSchema = z.strictObject({
  stockAdjustmentId: z.string(),
})

export const inventoryEvents = {
  emits: [
    {
      name: inventoryEventNames.stockAdjustmentCreated,
      payloadSchema: stockAdjustmentCreatedPayloadSchema,
      description: 'Emitted when a stock adjustment is created.',
    },
  ],
  listens: [],
} satisfies ModuleEventDefinition
```

Rules:

1. Event names must follow `{namespace}.{entity}.{past_tense_verb}`.
2. Module-owned events use the module ID as namespace.
3. Business Object events use `objects.*`, not module namespace.
4. Event payload schemas must be explicit.
5. Payloads must not contain full Prisma records.
6. Payloads must not contain `orgId`.
7. Event definitions must be importable by `manifest.ts`.
8. Event listeners must not be started as manifest side effects.

Bad:

```ts
'inventory.product.created' // Product is shared object
'inventory.stockAdjustmentCreated' // wrong format
'inventory.stock_adjustment.create' // not past tense
```

Good:

```ts
'objects.product.created'
'inventory.stock_adjustment.created'
'inventory.stock_level.low'
```

---

### 8.7 `settings.ts`

Purpose: declares module settings schema, defaults, and keys.

Example:

```ts
import { z } from 'zod'

export const inventorySettingsKeys = {
  allowNegativeStock: 'allow_negative_stock',
  defaultWarehouseId: 'default_warehouse_id',
} as const

export const inventorySettingsSchema = z.strictObject({
  allowNegativeStock: z.boolean().default(false),
  defaultWarehouseId: z.string().nullable().default(null),
})

export const inventoryDefaultSettings = {
  allowNegativeStock: false,
  defaultWarehouseId: null,
} satisfies z.infer<typeof inventorySettingsSchema>
```

Rules:

1. Settings keys must be stable.
2. Settings must be validated with Zod.
3. Module settings must live under the module namespace.
4. Settings must not be read directly from the database inside UI components.
5. Settings must not include secrets.
6. Settings must not be used to bypass permissions.

---

### 8.8 `navigation.ts`

Purpose: declares module navigation items separately from the manifest for clarity.

Example:

```ts
import type { ModuleNavItem } from '@/sdk'

export const inventoryNavItems = [
  {
    label: 'Inventory',
    href: 'inventory',
    icon: 'Package',
    requiredPermission: {
      module: 'inventory',
      resource: 'stock_balance',
      action: 'read',
    },
  },
  {
    label: 'Stock Adjustments',
    href: 'inventory/adjustments',
    icon: 'SlidersHorizontal',
    requiredPermission: {
      module: 'inventory',
      resource: 'stock_adjustment',
      action: 'read',
    },
  },
] satisfies ModuleNavItem[]
```

Rules:

1. Navigation items must be relative to `/:orgSlug`.
2. Navigation items must not include full domains.
3. Navigation items must include required permission.
4. Navigation visibility requires module enablement and permission.
5. Navigation must not define access control by itself.

---

### 8.9 `ai-context.ts`

Purpose: provides safe module context for the future AI layer.

Example:

```ts
import type { ModuleAiContext } from '@/sdk'

export const inventoryAiContext = {
  description: 'Inventory manages stock balances, stock movements, warehouses, and adjustments.',
  businessObjectsUsed: ['product', 'warehouse', 'supplier'],
  moduleEntities: ['stock_balance', 'stock_movement', 'stock_adjustment'],
  exampleQuestions: [
    'Which products are low stock?',
    'Show recent stock adjustments.',
    'Which warehouse has the most stock movements this week?',
  ],
  forbiddenActions: [
    'Do not adjust stock without explicit user confirmation.',
    'Do not reveal data outside the verified organization.',
  ],
} satisfies ModuleAiContext
```

Rules:

1. AI context must not contain secrets.
2. AI context must not include client-specific data.
3. AI context must not include hard-coded organization IDs.
4. AI context must describe what the module does.
5. AI context must list forbidden or sensitive actions.

---

### 8.10 `docs.md`

Purpose: provides module documentation for humans and future AI support.

It should include:

```txt
Purpose
Key workflows
Entities
Permissions
Events
Settings
Common troubleshooting
Known limitations
```

`docs.md` should be written for product/support understanding, not internal implementation only.

---

### 8.11 `README.md`

Purpose: provides developer-facing module instructions.

It should include:

```txt
Module purpose
Files overview
How to run tests
How to seed/provision module defaults
Important architecture constraints
```

Difference:

```txt
docs.md = product/support/user-facing explanation
README.md = developer/Claude-facing implementation explanation
```

---

### 8.12 `index.ts`

Purpose: defines approved public exports from the module package.

Example:

```ts
export { inventoryManifest } from './manifest'
export { inventoryPermissions } from './permissions'
export { inventoryEventNames } from './events'
export type { StockMovementListItem } from './types'
```

Rules:

1. Keep exports minimal.
2. Do not export services for other modules to call.
3. Do not use `export *` casually.
4. Do not export raw database internals.
5. Do not export server-only values to client imports.

Important:

The module index is for platform composition, tests, and type access. It is not permission for one module to call another module.

---

## 9. Optional Subfolders

### 9.1 `components/`

Use for module-specific UI components.

Allowed examples:

```txt
InventoryStatusBadge.tsx
StockAdjustmentForm.tsx
LowStockEmptyState.tsx
```

Rules:

1. Components must not import raw Prisma.
2. Client components must not import `@/sdk/server`.
3. Components should use shared design-system primitives.
4. Components should not own business logic.
5. Components should not make insecure API calls.

---

### 9.2 `services/`

Use when one `service.ts` becomes too large.

Example:

```txt
services/
  stock-balance.service.ts
  stock-movement.service.ts
  stock-adjustment.service.ts
```

Rules:

1. Services receive `PlatformContext`.
2. Services enforce permissions.
3. Services use `sdk.getDb(ctx)`.
4. Services emit events for mutations.
5. Services do not import other modules.

If `services/` exists, top-level `service.ts` may act as a facade:

```ts
export { StockBalanceService } from './services/stock-balance.service'
export { StockMovementService } from './services/stock-movement.service'
export { StockAdjustmentService } from './services/stock-adjustment.service'
```

---

### 9.3 `queries/`

Use for reusable read-query helpers.

Rules:

1. Query helpers must receive `PlatformContext`.
2. Query helpers must include `orgId: ctx.org.id`.
3. Query helpers must exclude soft-deleted records by default.
4. Query helpers must not bypass permissions unless called only from already-authorized services.

---

### 9.4 `mutations/`

Use for complex write operations that do not fit directly in a service file.

Rules:

1. Mutations must receive `PlatformContext`.
2. Mutations must validate inputs.
3. Mutations must enforce permission or be called only from a service that does.
4. Mutations must emit events.
5. Mutations must use transactions when changing multiple records.

---

### 9.5 `validators/`

Use for server-only validation that requires database access or context.

Example:

```ts
export async function assertProductBelongsToOrg(ctx: PlatformContext, productId: string) {
  const db = sdk.getDb(ctx)
  const product = await db.product.findFirst({
    where: {
      id: productId,
      orgId: ctx.org.id,
      deletedAt: null,
    },
  })

  if (!product) throw new NotFoundError('Product not found')
}
```

Rules:

1. Put database-backed validation in server-only files.
2. Do not put database queries in client-safe `schema.ts`.
3. Always tenant-scope validation queries.

---

### 9.6 `mappers/`

Use for converting database records into API/UI-safe view models.

Example:

```ts
export function toStockMovementListItem(record: StockMovementWithRelations): StockMovementListItem {
  return {
    id: record.id,
    productName: record.product.name,
    warehouseName: record.warehouse.name,
    quantity: record.quantity,
    movementType: record.type,
    createdAt: record.createdAt.toISOString(),
  }
}
```

Rules:

1. Do not expose sensitive fields.
2. Do not return raw Prisma relation graphs to client components.
3. Normalize dates for API responses.

---

### 9.7 `fixtures/`

Use for module-specific test fixtures.

Rules:

1. Fixtures must include `orgA` and `orgB` cases for tenant tests.
2. Fixtures must include admin and restricted users.
3. Fixtures must not require real production data.
4. Fixtures must not hide permission bugs by always using admin.

---

## 10. Route Placement Contract

Module files under `src/modules/[moduleId]` do not define Next.js routes directly.

Next.js page and API routes live in `src/app`.

### 10.1 Page Routes

Module pages must live under:

```txt
src/app/(platform)/[orgSlug]/[moduleId]/...
```

Examples:

```txt
src/app/(platform)/[orgSlug]/inventory/page.tsx
src/app/(platform)/[orgSlug]/inventory/adjustments/page.tsx
src/app/(platform)/[orgSlug]/inventory/adjustments/new/page.tsx
src/app/(platform)/[orgSlug]/crm/customers/page.tsx
```

Rules:

1. Page routes use `orgSlug` from route params.
2. Page routes must create or receive verified context through SDK helpers.
3. Page routes must not fetch records using client-supplied `orgId`.
4. Page routes should call module services, not raw Prisma.
5. Server components perform auth/context/data fetch.
6. Client components handle interaction, forms, optimistic UI, and local state.

---

### 10.2 API Routes

Module APIs must live under:

```txt
src/app/api/orgs/[orgSlug]/[moduleId]/...
```

Examples:

```txt
src/app/api/orgs/[orgSlug]/inventory/stock-balances/route.ts
src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/route.ts
src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/[id]/route.ts
```

Forbidden:

```txt
src/app/api/inventory/route.ts
src/app/api/inventory/[id]/route.ts
src/app/api/[moduleId]?orgId=...
```

Reason:

Tenant APIs must be org-route-scoped. The server verifies that the authenticated user belongs to the organization identified by `orgSlug`.

---

### 10.3 API Route Pattern

All protected module APIs should follow this pattern:

```ts
import { sdk } from '@/sdk/server'
import { InventoryService } from '@/modules/inventory/service'

export const POST = sdk.api.handle(async (req, { params }) => {
  const { orgSlug } = await params

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
  const body = await req.json()

  const data = await InventoryService.createStockAdjustment(ctx, body)

  return sdk.api.created(data)
})
```

Required sequence:

```txt
1. Resolve orgSlug from route params
2. Create verified PlatformContext
3. Verify module is enabled
4. Validate body/query/params
5. Enforce permissions in service or API
6. Execute business operation
7. Return Kernel API response shape
```

---

## 11. Server and Client Boundary

### 11.1 Server-Only Module Files

These files are server-only by default:

```txt
service.ts
services/*.service.ts
queries/*.queries.ts
mutations/*.mutations.ts
validators/*.validators.ts
```

They may import:

```ts
import { sdk } from '@/sdk/server'
```

They must not be imported by client components.

---

### 11.2 Client-Safe Module Files

These files should be client-safe:

```txt
manifest.ts
permissions.ts
schema.ts
types.ts
events.ts
settings.ts
navigation.ts
ai-context.ts
```

But client-safe does not mean browser-specific.

They must not import:

```txt
@/sdk/server
@/kernel/*
Prisma
next/headers
next/cookies
server-only
Node fs/path/process APIs
```

---

### 11.3 Client Components

Client components must use:

```ts
'use client'
```

Client components may import:

```txt
@/sdk/client
@/components/ui/*
module schema/types
module client-safe components
```

Client components must not import:

```txt
@/sdk/server
@/kernel/*
module service.ts
raw Prisma
server-only helpers
```

---

## 12. Import Rules

### 12.1 Allowed Imports from Module Code

Module code may import:

```txt
@/sdk
@/sdk/server      server-only files only
@/sdk/client      client files only
@/components/ui/*
@/components/kernel/* if explicitly approved as shared platform UI
@/lib/utils
same-module relative files
```

---

### 12.2 Forbidden Imports from Module Code

Module code must not import:

```txt
@/kernel/*
@/modules/[otherModule]/*
@prisma/client directly in module services for runtime DB access
@/kernel/db/client
@/kernel/auth/*
@/kernel/permissions/*
@/kernel/modules/*
@/kernel/events/*
```

Important nuance:

Type-only imports from generated Prisma types may be allowed only in server-only module files if approved by the data architecture document. Runtime database access must still go through `sdk.getDb(ctx)`.

---

## 13. Public vs Private Module API

A module’s public contract is:

```txt
manifest
permissions
events emitted/listened
settings schema
AI context
module-owned API routes
module-owned pages
```

A module’s private implementation is:

```txt
service internals
query structure
mutation internals
component internals
mappers
fixtures
```

Other modules must not depend on private implementation.

Bad:

```ts
import { InventoryService } from '@/modules/inventory/service'
```

from another module.

Good:

```ts
await sdk.events.emit(ctx, 'purchasing.goods_received.created', { ... })
```

Then Inventory may listen to that event if explicitly declared.

---

## 14. Business Object Usage in Modules

Modules may reference Business Objects through SDK-supported services or tenant-safe database relations.

Examples:

```txt
Inventory references Product and Warehouse.
Purchasing references Supplier and Product.
Leave references Employee.
CRM references Customer.
```

Modules must not create duplicate shared entities.

Forbidden module files/models:

```txt
src/modules/inventory/product.ts
src/modules/inventory/models/product.ts
src/modules/crm/customer.ts
src/modules/leave/employee.ts
InventoryProduct as product identity duplicate
CRMCustomer as customer identity duplicate
LeaveEmployee as employee identity duplicate
```

Allowed:

```txt
InventoryProductExtension
PurchasingSupplierExtension
CRMCustomerExtension
LeaveEmployeePolicy
```

---

## 15. Module-Owned Entities

Module-owned entities are records that belong only to that business domain.

Examples:

```txt
Inventory:
  StockBalance
  StockMovement
  StockAdjustment
  ReorderRule

Leave:
  LeaveRequest
  LeaveType
  LeaveBalance

CRM:
  Lead
  Deal
  Pipeline
  Activity

Purchasing:
  PurchaseRequest
  PurchaseOrder
  GoodsReceipt
```

Module-owned entity files may appear in schemas, services, and APIs, but shared identities must remain Business Objects.

---

## 16. Test Folder Contract

Every module must include:

```txt
__tests__/
  manifest.test.ts
  service.test.ts
  permissions.test.ts
  events.test.ts
  tenant-isolation.test.ts
```

### 16.1 `manifest.test.ts`

Must verify:

```txt
manifest ID is valid
manifest compatibility exists
permissions are full objects
nav items have permissions
events follow naming convention
manifest does not contain wildcard permissions
manifest does not contain side-effect-only registration
```

---

### 16.2 `service.test.ts`

Must verify:

```txt
services accept PlatformContext
services call sdk.getDb(ctx)
services enforce permissions
services tenant-scope queries
services emit events for mutations
services soft-delete instead of hard delete
```

---

### 16.3 `permissions.test.ts`

Must verify:

```txt
read permission allows read
missing permission denies read
create permission allows create
missing create permission denies create
admin wildcard works within same org
admin wildcard does not bypass tenant isolation
```

---

### 16.4 `events.test.ts`

Must verify:

```txt
events are declared in manifest
event names follow convention
event payload schemas validate emitted payloads
mutation services emit expected events
payloads do not include orgId
payloads do not include full records
```

---

### 16.5 `tenant-isolation.test.ts`

Must verify:

```txt
Org A user cannot read Org B records
Org A user cannot create records in Org B
Org A user cannot update Org B records
Org A user cannot delete Org B records
client-supplied orgId is rejected
findUnique by id alone is not used for tenant-scoped records
```

Every tenant-isolation test must use at least two organizations.

Single-org security tests are not sufficient.

---

## 17. Generated Module Requirements

The module generator must create:

```txt
src/modules/[moduleId]/manifest.ts
src/modules/[moduleId]/permissions.ts
src/modules/[moduleId]/schema.ts
src/modules/[moduleId]/types.ts
src/modules/[moduleId]/service.ts
src/modules/[moduleId]/events.ts
src/modules/[moduleId]/settings.ts
src/modules/[moduleId]/navigation.ts
src/modules/[moduleId]/ai-context.ts
src/modules/[moduleId]/docs.md
src/modules/[moduleId]/index.ts
src/modules/[moduleId]/README.md
src/modules/[moduleId]/__tests__/manifest.test.ts
src/modules/[moduleId]/__tests__/service.test.ts
src/modules/[moduleId]/__tests__/permissions.test.ts
src/modules/[moduleId]/__tests__/events.test.ts
src/modules/[moduleId]/__tests__/tenant-isolation.test.ts
```

Generated API routes must be under:

```txt
src/app/api/orgs/[orgSlug]/[moduleId]/...
```

Generated page routes must be under:

```txt
src/app/(platform)/[orgSlug]/[moduleId]/...
```

Generated services must use:

```ts
sdk.getDb(ctx)
```

not:

```ts
sdk.getDb(orgId)
```

Generated code must reject client-supplied `orgId`.

---

## 18. Forbidden Generated Output

The generator must never create code containing these patterns:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
import { sdk } from '@/sdk' // inside server-only service where '@/sdk/server' is required
sdk.getDb(orgId)
request.nextUrl.searchParams.get('orgId')
body.orgId
where: { id }
where: { orgId: input.orgId }
delete({ where: { id } })
findUnique({ where: { id } })
```

Generated code must also not create:

```txt
src/app/api/[moduleId]/route.ts
src/app/api/[moduleId]/[id]/route.ts
src/modules/[moduleId]/manifest.ts with sdk.modules.register(...) side effect
src/modules/[moduleId]/schema.ts with orgId in create schema
```

---

## 19. Example: Inventory Module Folder

A first Inventory module should look approximately like this:

```txt
src/modules/inventory/
  manifest.ts
  permissions.ts
  schema.ts
  types.ts
  service.ts
  events.ts
  settings.ts
  navigation.ts
  ai-context.ts
  docs.md
  index.ts
  README.md
  __tests__/
    manifest.test.ts
    service.test.ts
    permissions.test.ts
    events.test.ts
    tenant-isolation.test.ts
```

If Inventory grows:

```txt
src/modules/inventory/
  services/
    stock-balance.service.ts
    stock-movement.service.ts
    stock-adjustment.service.ts
  queries/
    stock-balance.queries.ts
  mutations/
    stock-adjustment.mutations.ts
  components/
    StockLevelBadge.tsx
    StockAdjustmentForm.tsx
    LowStockEmptyState.tsx
  mappers/
    stock-balance.mapper.ts
```

Inventory must not create:

```txt
src/modules/inventory/product.service.ts as Product owner
src/modules/inventory/product.schema.ts as Product identity owner
src/modules/inventory/warehouse.service.ts as Warehouse owner
```

Product and Warehouse belong to Business Objects.

Inventory may create:

```txt
InventoryProductExtension
StockBalance
StockMovement
StockAdjustment
ReorderRule
```

---

## 20. Example: Leave Module Folder

A Leave module should look approximately like this:

```txt
src/modules/leave/
  manifest.ts
  permissions.ts
  schema.ts
  types.ts
  service.ts
  events.ts
  settings.ts
  navigation.ts
  ai-context.ts
  docs.md
  index.ts
  README.md
  __tests__/
    manifest.test.ts
    service.test.ts
    permissions.test.ts
    events.test.ts
    tenant-isolation.test.ts
```

Leave must not create:

```txt
LeaveEmployee
HREmployee
Employee copy inside leave
```

Leave may create:

```txt
LeaveRequest
LeaveType
LeaveBalance
LeavePolicy
```

Employee remains a Business Object.

---

## 21. Example: CRM Module Folder

A CRM module should look approximately like this:

```txt
src/modules/crm/
  manifest.ts
  permissions.ts
  schema.ts
  types.ts
  service.ts
  events.ts
  settings.ts
  navigation.ts
  ai-context.ts
  docs.md
  index.ts
  README.md
  __tests__/
    manifest.test.ts
    service.test.ts
    permissions.test.ts
    events.test.ts
    tenant-isolation.test.ts
```

CRM must not create:

```txt
CRMCustomer as duplicate customer identity
```

CRM may create:

```txt
Lead
Deal
Pipeline
CRMCustomerExtension
CRMActivity
```

Customer remains a Business Object.

---

## 22. Module Docs Requirements

Every module must include `docs.md` with these sections:

```md
# [Module Name]

## Purpose
## Key Workflows
## Business Objects Used
## Module-Owned Entities
## Permissions
## Events
## Settings
## User Screens
## API Summary
## Known Limitations
## Support Notes
```

This file should help:

1. Human support staff.
2. Future AI support agent.
3. Claude when enhancing the module.
4. New engineers joining the project.

---

## 23. Module README Requirements

Every module must include `README.md` with these sections:

```md
# [Module Name] Developer README

## Architecture
## Folder Structure
## Important Files
## How to Run Tests
## How to Add a New Entity
## How to Add a Permission
## How to Add an Event
## How to Add a Page
## How to Add an API Route
## Forbidden Patterns
```

This is developer-facing and may include implementation details.

---

## 24. Naming Conventions

### 24.1 Files

Use kebab-case for multi-word file names:

```txt
stock-adjustment.service.ts
stock-movement.mapper.ts
low-stock-empty-state.tsx
```

For React components, PascalCase file names are allowed when the file exports a single component:

```txt
StockAdjustmentForm.tsx
LowStockEmptyState.tsx
```

Pick one style per subfolder and stay consistent.

---

### 24.2 Services

Use PascalCase service names:

```ts
InventoryService
StockAdjustmentService
LeaveRequestService
CRMDealService
```

---

### 24.3 Schemas

Use lower camelCase schema names:

```ts
createStockAdjustmentSchema
updateStockAdjustmentSchema
stockAdjustmentQuerySchema
```

---

### 24.4 Events

Use snake_case entity segments in event names:

```txt
inventory.stock_adjustment.created
inventory.stock_movement.created
objects.product.updated
```

Do not use camelCase in event names.

---

### 24.5 Permissions

Use lower snake_case resources:

```txt
stock_adjustment
stock_movement
leave_request
purchase_order
```

Permission shape:

```txt
module.resource.action
```

Examples:

```txt
inventory.stock_adjustment.create
inventory.stock_balance.read
leave.leave_request.approve
crm.deal.update
```

---

## 25. Module Lifecycle Hooks

Module lifecycle hooks are not stored as functions inside the manifest.

The manifest may declare hook names:

```ts
provisioning: {
  install: 'installInventoryModule',
  seedDefaults: 'seedInventoryDefaults',
}
```

The implementation lives in a server-only file:

```txt
src/modules/inventory/provisioning.server.ts
```

Rules:

1. Hooks receive `PlatformContext`.
2. Hooks must not accept loose `orgId`.
3. Hooks must be idempotent.
4. Hooks must not delete client data during upgrades.
5. Hooks must be called by Kernel/module loader workflows, not by manifest import side effects.

MVP may defer actual hooks, but the folder contract must not block them later.

---

## 26. Relationship to Module Registry

The module registry should import manifests from the module index/composition root.

Preferred:

```ts
// src/modules/index.ts
import { inventoryManifest } from './inventory'
import { leaveManifest } from './leave'

export const knownModuleManifests = [
  inventoryManifest,
  leaveManifest,
]
```

Then:

```ts
// src/platform/module-loader.server.ts
import { knownModuleManifests } from '@/modules'
import { createModuleRegistry } from '@/platform/module-registry.server'

export const moduleRegistry = createModuleRegistry(knownModuleManifests)
```

Avoid:

```ts
// src/modules/inventory/manifest.ts
sdk.modules.register(inventoryManifest)
```

Reason:

Side-effect registration is easy to forget, hard to test, and confusing for Claude.

---

## 27. Relationship to SDK

Modules must treat the SDK as their only platform interface.

Shared/client-safe files may import:

```ts
import type { ModuleManifest } from '@/sdk'
```

Server-only service files may import:

```ts
import { sdk } from '@/sdk/server'
```

Client components may import:

```ts
import { sdkClient } from '@/sdk/client'
```

Modules must not reach behind the SDK into Kernel internals.

---

## 28. Relationship to Business Objects

Business Object APIs and services live outside individual modules.

Module folders may declare usage of Business Objects, but they do not own those objects.

Example:

```ts
businessObjects: ['product', 'warehouse', 'supplier']
```

This means Inventory can reference these objects. It does not mean Inventory owns their CRUD.

If a module needs module-specific fields, it creates extension tables and extension services.

Example:

```txt
Product
  shared identity

InventoryProductExtension
  inventory-specific behavior
```

---

## 29. Relationship to Platform Services

Modules must not create their own pseudo-platform service folders.

Forbidden:

```txt
src/modules/inventory/approval-engine/
src/modules/leave/notification-engine/
src/modules/crm/activity-feed-service/
```

If only one module needs a capability, keep it as module-specific workflow logic.

If three independent use cases need it, propose promotion through the Three Independent Use Cases Rule.

Until promoted, do not pretend it is a platform service.

---

## 30. Relationship to Dynamic CRUD and Dynamic Forms

Dynamic CRUD and Dynamic Forms are deferred.

Modules may include metadata that will help future dynamic systems, but must not build private mini-engines.

Allowed:

```txt
field metadata in manifest
table column definitions for a module page
form schemas with Zod
```

Forbidden:

```txt
src/modules/inventory/dynamic-form-engine.ts
src/modules/crm/crud-builder.ts
src/modules/leave/generic-field-renderer.tsx
```

Future dynamic systems belong to Platform Services only after the trigger is satisfied.

---

## 31. Security Rules

Every module folder must support these security rules:

```txt
No raw Prisma access from module code
No @/kernel imports
No client-supplied orgId
No API routes outside /api/orgs/[orgSlug]/[moduleId]
No service methods accepting loose orgId
No mutation without permission enforcement
No mutation without event emission
No hard delete for business records
No cross-module direct imports
No duplicated Business Objects
```

---

## 32. Architecture Check Requirements

The codebase should eventually include an architecture check that fails if module files contain forbidden imports or patterns.

Suggested checks:

```txt
modules cannot import @/kernel/*
modules cannot import @/modules/* except same module relative imports
modules cannot import @/kernel/db/client
client files cannot import @/sdk/server
server services cannot call sdk.getDb(orgId)
API files cannot read orgId from query/body
module APIs must live under /api/orgs/[orgSlug]/...
module manifests cannot call sdk.modules.register
```

This check should run in CI:

```bash
npm run check:architecture
```

---

## 33. Claude Implementation Rules

When Claude creates or edits a module, it must follow these rules:

1. Use the standard folder structure.
2. Do not create extra architecture.
3. Do not create platform services inside a module.
4. Do not import from `@/kernel/*`.
5. Do not import another module.
6. Do not use raw Prisma.
7. Use `PlatformContext` in services.
8. Use `sdk.getDb(ctx)`.
9. Reject client-supplied `orgId`.
10. Use `/api/orgs/[orgSlug]/[moduleId]/...` for APIs.
11. Use `/[orgSlug]/[moduleId]/...` for pages.
12. Use Zod strict schemas.
13. Enforce permissions.
14. Emit events for mutations.
15. Soft-delete business records.
16. Add required tests.
17. Stop if the manual is ambiguous.

Claude must not “improve” the folder structure without approval.

---

## 34. Claude Prompt Template

Use this when asking Claude to create a new module folder:

```md
You are implementing a OneDayOS business module folder.

Authoritative documents:
- docs/engineering-manual/08-module-system/00-module-philosophy.md
- docs/engineering-manual/08-module-system/01-module-manifest.md
- docs/engineering-manual/08-module-system/02-module-loader-registry.md
- docs/engineering-manual/08-module-system/03-module-folder-contract.md
- docs/engineering-manual/05-sdk/01-sdk-public-api.md
- docs/engineering-manual/05-sdk/02-sdk-db-access.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md
- docs/engineering-manual/06-data/01-tenancy-data-isolation.md

Task:
Create the folder structure for module: [MODULE_ID].

Rules:
- Do not implement full business logic unless explicitly requested.
- Do not import from @/kernel/*.
- Do not import other modules.
- Do not use raw Prisma.
- Do not accept orgId from request body or query params.
- Services must receive PlatformContext.
- Database access must use sdk.getDb(ctx).
- API routes must live under /api/orgs/[orgSlug]/[MODULE_ID]/...
- Pages must live under /[orgSlug]/[MODULE_ID]/...
- Add required test skeletons.
- Stop and report if this document conflicts with existing code.
```

---

## 35. Common Mistakes

### Mistake 1: Module owns a shared object

Bad:

```txt
src/modules/inventory/product.service.ts
```

Why bad:

Product is a Business Object. Inventory may extend it, not own it.

Correct:

```txt
src/modules/inventory/services/inventory-product-extension.service.ts
```

---

### Mistake 2: API route outside org scope

Bad:

```txt
src/app/api/inventory/route.ts
```

Correct:

```txt
src/app/api/orgs/[orgSlug]/inventory/route.ts
```

---

### Mistake 3: Client-submitted `orgId`

Bad:

```ts
const orgId = body.orgId
```

Correct:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const orgId = ctx.org.id
```

---

### Mistake 4: Module imports Kernel

Bad:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
```

Correct:

```ts
import { sdk } from '@/sdk/server'
```

---

### Mistake 5: Manifest self-registers

Bad:

```ts
sdk.modules.register(inventoryManifest)
```

Correct:

```ts
export const inventoryManifest = { ... } satisfies ModuleManifest
```

Then the platform composition root imports it.

---

### Mistake 6: Always-admin tests

Bad:

```txt
All tests use Admin role only.
```

Correct:

```txt
Tests include Admin, allowed Staff, denied Staff, Org A user, Org B user.
```

---

## 36. Minimum Module Definition of Done

A module folder is not complete unless:

```txt
[ ] Required root files exist
[ ] Required tests exist
[ ] Manifest is pure and valid
[ ] Permissions are full permission objects
[ ] Events follow naming convention
[ ] Schemas reject unknown keys
[ ] Schemas reject client-supplied orgId
[ ] Services receive PlatformContext
[ ] Services use sdk.getDb(ctx)
[ ] Services enforce permissions
[ ] Services emit mutation events
[ ] Services soft-delete business data
[ ] API routes use /api/orgs/[orgSlug]/[moduleId]
[ ] Page routes use /[orgSlug]/[moduleId]
[ ] No @/kernel imports exist in module files
[ ] No direct imports from other modules exist
[ ] Tenant-isolation tests use at least two organizations
[ ] Permission-denial tests exist
[ ] npm run typecheck passes
[ ] npm run test:run passes
[ ] npm run check:architecture passes, when available
[ ] npm run build passes
```

---

## 37. Acceptance Criteria

This document is accepted when:

1. A new module folder can be generated without architectural decisions.
2. Claude knows exactly which files to create.
3. Claude knows what each file may contain.
4. Claude knows what each file must not contain.
5. Module APIs are always tenant-scoped.
6. Module services always use `PlatformContext`.
7. Module database access always uses `sdk.getDb(ctx)`.
8. Module tests always include tenant isolation and permission-denial coverage.
9. Module manifests remain pure metadata.
10. Business Objects are not duplicated inside modules.
11. Platform Services are not hidden inside modules.
12. The module folder structure is lintable and generator-friendly.

---

## 38. Founder Review Questions

Before freezing this document, answer:

1. Should every module include `settings.ts` and `ai-context.ts` from day one, even if minimal?
2. Should every module include `docs.md` and `README.md`, or should these be generated later?
3. Should module services live in a single `service.ts` until complexity requires a `services/` folder?
4. Should module API routes be generated immediately, or only when the module has a real entity?
5. Should architecture checks be implemented before the first module generator?
6. Should we require module folders to include `fixtures/` from day one?

Recommended answers:

```txt
1. Yes, include minimal settings.ts and ai-context.ts from day one.
2. Yes, include both docs.md and README.md from day one.
3. Yes, start with service.ts; split only when needed.
4. Generate route skeletons only for real entities, not placeholder CRUD.
5. Yes, architecture checks should exist before trusting the generator.
6. No, fixtures/ can appear when real tests need them, but test templates must support two-org fixtures.
```

---

## 39. Final Architectural Position

The module folder contract is not bureaucracy.

It is how OneDayOS turns module delivery into a repeatable platform capability.

A business module should be easy to generate, inspect, test, secure, and evolve.

The correct module structure is:

```txt
Predictable enough for Claude.
Strict enough for security.
Flexible enough for real business workflows.
Small enough for one-day delivery.
Stable enough for a decade-long platform.
```

---

## ADR-0011 UX Folder Amendment

After UX governance is reviewed and frozen, every future official business module folder should include:

```txt
src/modules/[module]/
  ux.ts
  process-flow.ts
  UX-CONFORMANCE.md
```

Purpose:

- `ux.ts` declares the module UX Contract in generator-friendly metadata.
- `process-flow.ts` declares process-flow steps and ownership boundaries for UI/tests.
- `UX-CONFORMANCE.md` records human review evidence, known findings, and Founder-approved deferrals.

These files are required for official business modules after adoption. This governance pass does not modify existing module source or generator output.
