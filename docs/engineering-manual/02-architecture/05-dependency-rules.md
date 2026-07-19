# OneDayOS Engineering Manual — Dependency Rules

**Document ID:** `02-architecture/05-dependency-rules.md`  
**Version:** 1.0  
**Status:** Frozen  
**Owner:** OneDayOS Founder / Software Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `02-architecture/02-repository-architecture.md`
- `02-architecture/03-runtime-architecture.md`
- `02-architecture/04-technology-baseline.md`
- `04-kernel/04-authorization-enforcement.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `13-security/08-production-readiness-gate.md`

---

## 1. Purpose

This document defines what OneDayOS code is allowed to depend on.

Dependency rules are not code-style preferences. They are architectural security boundaries.

If dependency boundaries are weak, OneDayOS will eventually become:

```txt
modules importing Kernel internals
modules importing other modules
raw Prisma scattered across business logic
client components importing server secrets
per-client forks
uncontrolled package sprawl
Claude inventing architecture during implementation
```

That would destroy the OneDayOS platform model.

The goal is to make correct architecture easier than wrong architecture.

---

## 2. Core Rule

```txt
Code may depend only on layers below it or on approved stable public interfaces.
Code must never reach sideways into sibling modules or downward into private internals.
```

In practical terms:

```txt
Business modules use the SDK.
Business modules do not use Kernel internals.
Business modules do not import other modules.
Client components do not import server-only code.
Platform Services do not import business modules.
Business Objects are shared and are not owned by modules.
```

---

## 3. Dependency Direction

Conceptual architecture:

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

Implementation dependency direction:

```txt
src/kernel
  ↑ consumed by
src/sdk/server
  ↑ consumed by
src/business-objects
src/platform-services       # future/deferred
src/modules
src/app route handlers/pages
```

Important nuance:

The conceptual layer diagram explains **business responsibility**.

The import graph explains **physical code access**.

The SDK is the physical boundary that protects Kernel internals.

---

## 4. Dependency Rules by Area

## 4.1 Kernel

Kernel is the lowest OneDayOS platform layer.

Kernel may import:

```txt
approved external infrastructure libraries
Prisma client setup
Supabase server/auth helpers
Next.js server utilities where appropriate
pure shared utilities
Kernel-local files
```

Kernel must not import:

```txt
@/modules/*
@/business-objects/* business logic
@/platform-services/* business logic
@/app/* route/page files
client components
module manifests
module services
module schemas
client configuration files
```

Kernel owns fundamentals only:

```txt
authentication
session helpers
organization tenancy primitives
users
roles
permissions
module registry backing logic
event bus primitive
configuration primitives
server API/error primitives
```

Kernel must not contain:

```txt
Inventory logic
CRM logic
Leave logic
Purchasing logic
Expenses logic
Assets logic
Visitor workflow logic
Incident workflow logic
Approval Engine implementation
Notification Engine implementation
Attachment Service implementation
Reporting/Search/AI implementation
```

### Kernel anti-pattern

```ts
// ❌ Forbidden
import { InventoryService } from '@/modules/inventory/service'
```

Kernel must not know Inventory exists as business logic.

---

## 4.2 SDK

The SDK is the public platform interface.

The restarted build uses three SDK surfaces:

```txt
@/sdk          shared-safe types/constants only
@/sdk/server   server-only platform access
@/sdk/client   browser-safe client helpers
```

### `@/sdk`

Allowed contents:

```txt
shared types
manifest types
permission requirement types
event name types
error-code constants
client-safe constants
```

Forbidden contents:

```txt
Prisma
Supabase server client
Supabase service role
Next cookies/headers
server-only auth helpers
process.env access
Kernel implementation imports that leak server code
```

### `@/sdk/server`

Allowed imports:

```txt
@/kernel/*
server-only platform utilities
Prisma-backed Kernel/Data helpers
Supabase server/admin helpers where explicitly approved
```

Allowed exports:

```ts
sdk.auth
sdk.context
sdk.permissions
sdk.modules
sdk.events
sdk.getDb(ctx)
sdk.api
sdk.settings
```

Reserved but not implemented yet:

```ts
sdk.objects
sdk.forms
sdk.tables
sdk.search
sdk.ai
sdk.jobs
sdk.notifications
sdk.attachments
sdk.approvals
```

Forbidden exports for restarted MVP:

```ts
sdk.getDb(orgId)
sdk.db // raw Prisma singleton
sdk.prisma
sdk.supabaseAdmin
sdk.rawSql
sdk.ai.run
sdk.jobs.enqueue
```

### `@/sdk/client`

Allowed exports:

```txt
browser-safe fetch helpers
client-safe route helpers
client-safe error helpers
client-safe form helpers
client-safe optimistic mutation helpers
```

Forbidden imports:

```txt
@/sdk/server
@/kernel/*
@/kernel/db/client
@prisma/client
next/headers
next/cookies
server-only env helpers
Supabase service role helpers
```

### SDK anti-patterns

```ts
// ❌ Forbidden in restarted build
sdk.getDb(orgId)
```

```ts
// ✅ Required
sdk.getDb(ctx)
```

```ts
// ❌ Forbidden in client component
import { sdk } from '@/sdk/server'
```

```ts
// ✅ Browser-safe
import { sdkClient } from '@/sdk/client'
```

---

## 4.3 Business Objects

Business Objects are shared business identity records.

Examples:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Business Object implementation may import:

```txt
@/sdk/server
@/sdk shared types
@/components shared UI for Business Object pages
Business Object local files
approved shared utilities
```

Business Objects must not import:

```txt
@/modules/*
module services
module schemas
module extension logic
client-specific configuration
Platform Service implementations unless explicitly approved
```

Business Objects may expose:

```txt
Business Object services
Business Object schemas
Business Object APIs
Business Object page components
Business Object event contracts
```

Business Objects must not contain module-specific fields.

Example:

```txt
Product core fields:
  code
  name
  description
  categoryId
  unit

Inventory-specific fields:
  reorderPoint
  minimumStock
  valuationMethod

These belong in:
  InventoryProductExtension
```

### Business Object anti-pattern

```ts
// ❌ Forbidden
import { InventoryProductExtensionService } from '@/modules/inventory/service'
```

Product must not depend on Inventory.

---

## 4.4 Platform Services

Platform Services are reusable cross-cutting capabilities promoted only after the Three Independent Use Cases Rule is satisfied.

Examples:

```txt
Audit Log Service
Notification Service
Approval Workflow Service
Comments Service
Attachment Service
Activity Feed Service
Reporting Service
Search Service
Background Jobs
```

Platform Services may import:

```txt
@/sdk/server
@/sdk shared types
Platform Service local files
approved shared utilities
```

Platform Services must not import:

```txt
@/modules/*
module services
module schemas
module pages
module-specific business logic
client-specific code
```

Platform Services must be module-agnostic.

They may consume stable events, stable Business Object references, and approved SDK contracts.

They must not know module internals.

### Platform Service anti-pattern

```ts
// ❌ Forbidden
import { LeaveRequestService } from '@/modules/leave/service'
```

An Approval Workflow Service cannot import Leave.

Instead, Leave would call a future SDK approval API or emit approved events.

---

## 4.5 Business Modules

Business Modules are the strictest dependency area.

A module may import:

```txt
@/sdk
@/sdk/server from server-only module files
@/sdk/client from client components
@/components/ui
@/components/onedayos shared design-system components
@/lib/utils pure utilities
module-local files
approved Business Object public types/schemas where explicitly allowed
```

A module must not import:

```txt
@/kernel/*
@/kernel/db/client
@prisma/client directly for runtime data access
@/modules/other-module/*
other module services
other module schemas
other module manifests
other module events directly
Platform Service internals
server env helpers in client components
Supabase service role helpers
FastAPI/Python backend files
```

Module services must receive verified `PlatformContext`.

```ts
// ✅ Required
export async function createStockAdjustment(ctx: PlatformContext, input: CreateStockAdjustmentInput) {}
```

Module services must not receive loose tenant identifiers.

```ts
// ❌ Forbidden
export async function createStockAdjustment(orgId: string, input: Input) {}
```

Module APIs must create or receive verified context before calling services.

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
const result = await InventoryService.createStockAdjustment(ctx, input)
```

### Module-to-module imports are forbidden

```ts
// ❌ Forbidden
import { InventoryService } from '@/modules/inventory/service'
```

Even if Purchasing depends on Inventory, Purchasing must not import Inventory.

Cross-module communication uses:

```txt
events
shared Business Objects
future Platform Services through SDK
explicit integration specs
```

---

## 4.6 App Routes and Pages

Next.js `src/app` files are entrypoints, not architecture owners.

They may orchestrate:

```txt
auth/context creation
route param validation
permission checks
service calls
rendering
API response mapping
```

They must not contain deep business logic.

### API routes

API routes may import:

```txt
@/sdk/server
Zod schemas
module service for matching module route
Business Object service for matching Business Object route
shared API helpers
```

API routes must not import:

```txt
raw Prisma
@/kernel/* directly except Kernel-owned API routes
other modules
client components
```

Tenant API route shape:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/inventory/stock-adjustments
/api/orgs/[orgSlug]/leave/requests
```

Forbidden route shapes:

```txt
/api/inventory?orgId=...
/api/[module]
/api/products?orgId=...
```

### Server pages

Server pages may import:

```txt
@/sdk/server
server-safe services
server-safe data loaders
shared layout components
```

Server pages should not contain complex mutation/business logic.

### Client components

Client components may import:

```txt
@/sdk/client
@/components/ui
@/components/onedayos
React hooks
Motion for React from motion/react
browser-safe utilities
```

Client components must not import:

```txt
@/sdk/server
@/kernel/*
@prisma/client
next/headers
server env helpers
service role helpers
raw module server services
```

---

## 4.7 Shared Components

Shared UI components are not allowed to know business logic unless intentionally placed in a business-specific component area.

### `src/components/ui`

This contains shadcn/source primitive components.

Allowed:

```txt
styling
accessibility
primitive UI behavior
class utilities
```

Forbidden:

```txt
SDK imports
Kernel imports
Prisma imports
business logic
module logic
API calls
```

### `src/components/onedayos`

This contains OneDayOS design-system components.

Allowed:

```txt
DataTable shell
Form field wrappers
Empty state components
Loading skeleton components
Error state components
layout primitives
permission-aware display props passed from server
```

Forbidden:

```txt
raw permission fetching in client components
raw tenant fetching
raw Prisma
Kernel imports
module-specific business logic
```

### `src/components/kernel`

This name should be used carefully.

For restarted build, prefer:

```txt
src/components/onedayos
src/components/platform-shell
src/components/ui
```

Avoid making UI components import Kernel internals just because they live under `components/kernel`.

---

## 4.8 Generators and Scripts

Generator scripts may read templates and write files.

Generator scripts may import:

```txt
Node fs/path utilities
generator-local helpers
shared manifest/type definitions if safe
```

Generator scripts must not:

```txt
connect to production database
run production migrations
ask for production secrets
write client-specific forks
generate FastAPI/Python backend files
generate raw Prisma imports inside modules
generate sdk.getDb(orgId)
generate hidden orgId fields
generate /api/[module] route shapes
generate auth-only APIs
generate placeholder-only tests
generate duplicate Business Objects
```

Generated code must obey all dependency rules.

If generated code violates dependency rules, the generator is broken.

---

## 4.9 Tests

Tests may import internals when needed to verify behavior.

However, test-only access must not justify production access.

Allowed in tests:

```txt
mock Kernel internals
inspect generated files
import services directly for unit/integration tests
use raw Prisma only in test fixture setup helpers
use test database helpers
```

Forbidden in tests:

```txt
production credentials
real client data
tests that hide security boundaries through over-mocking
admin-only tests as sole security coverage
```

Test fixture helpers may use raw Prisma to create setup data, but production modules may not.

---

## 5. Import Matrix

| Source | May Import | Must Not Import |
|---|---|---|
| `src/kernel/*` | external infra libs, pure utils, Kernel-local files | modules, Platform Services, Business Object business logic, app pages |
| `src/sdk/index.ts` | shared-safe types/constants only | Prisma, server auth, Kernel runtime, env, Next cookies |
| `src/sdk/server/*` | Kernel internals, server utilities | modules, client components, runtime AI providers unless approved |
| `src/sdk/client/*` | browser-safe helpers, shared types | Kernel, Prisma, server env, service role, `@/sdk/server` |
| `src/business-objects/*` | SDK server, local object files, shared UI/utilities | modules, module internals, client config |
| `src/platform-services/*` | SDK server, local service files | business modules, module internals |
| `src/modules/[module]/*` | SDK, shared UI, local files, approved Business Object public contracts | Kernel, raw Prisma, other modules, Platform Service internals |
| `src/app/api/orgs/[orgSlug]/[module]/*` | SDK server, matching module service/schema | raw Prisma, other modules, client components |
| `src/app/(platform)/*` | SDK server, shared components, matching services | client-only modules in server files, raw Kernel unless Kernel route/page |
| Client components | SDK client, UI components, Motion, browser-safe utils | SDK server, Kernel, Prisma, server env |
| `scripts/*` | Node/generator helpers | production credentials, production DB access by default |

---

## 6. External Dependency Rules

OneDayOS must avoid package sprawl.

Every dependency adds:

```txt
upgrade risk
bundle size
security surface
Claude ambiguity
learning burden
maintenance cost
```

### 6.1 Approved baseline dependencies

The restarted baseline may include the approved stack from the Technology Baseline:

```txt
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui source components
Supabase client/SSR packages
Prisma
Zod
React Hook Form
Motion for React
lucide-react
sonner
Vitest
Testing Library
Playwright later, when approved
```

### 6.2 New dependency approval

A new production dependency requires founder/architect approval.

A new major infrastructure dependency requires an ADR.

Examples requiring ADR:

```txt
FastAPI
GraphQL
Apollo
tRPC
Redis
BullMQ
Temporal
Celery
Elasticsearch
Meilisearch
Algolia
OpenAI runtime provider
LangChain
Pinecone
Stripe
Resend
Twilio
Sentry alternative if replacing default
Datadog
```

Small UI/dev dependencies may require approval but not always an ADR.

Examples:

```txt
date utility helper
small test helper
approved linting/check package
```

### 6.3 Dependency review checklist

Before adding a dependency, answer:

```txt
[ ] What problem does this solve?
[ ] Can the existing stack solve it?
[ ] Is this needed now or deferred?
[ ] Is it server-only, client-only, or both?
[ ] Does it affect bundle size?
[ ] Does it touch auth, data, tenant isolation, files, AI, payments, or infrastructure?
[ ] Does it require secrets?
[ ] Does it require background jobs?
[ ] Does it work with Next.js App Router?
[ ] Does it work with Vercel?
[ ] Does it work with Prisma/Supabase constraints?
[ ] Is it actively maintained?
[ ] Is the license acceptable?
[ ] Does it complicate one-day delivery or AppCare?
[ ] Does it require an ADR?
```

If the answer is unclear, do not add the dependency.

---

## 7. Server / Client Boundary Rules

Next.js makes server/client boundaries easy to accidentally break.

OneDayOS must enforce these rules strictly.

### 7.1 Server-only files

Use `.server.ts` or clear folder boundaries for server-only code.

Examples:

```txt
context.server.ts
auth.server.ts
db.server.ts
event-handlers.server.ts
service.server.ts
```

Server-only files may import:

```txt
@/sdk/server
Prisma-backed helpers
Next server utilities
server env helpers
```

Server-only files must not be imported by client components.

### 7.2 Client-only files

Client components must begin with:

```ts
'use client'
```

Client files may import browser-safe SDK/helpers only.

They must not import:

```txt
@/sdk/server
@/kernel/*
@prisma/client
next/headers
next/cookies
server env helpers
service role helpers
```

### 7.3 Barrel export danger

Barrel files can accidentally mix server and client exports.

Bad:

```ts
// ❌ src/sdk/index.ts
export * from './server/auth'
export * from './client/fetch'
```

Good:

```txt
@/sdk          shared types only
@/sdk/server   server-only aggregate
@/sdk/client   client-safe aggregate
```

The same applies to modules.

Do not export server services from a module barrel that is imported by client components.

---

## 8. Database Dependency Rules

### 8.1 Raw Prisma access

Runtime raw Prisma access is allowed only in:

```txt
Kernel/Data layer
SDK server database wrapper
approved migration/seed/provisioning scripts
approved test fixture helpers
```

Runtime raw Prisma access is forbidden in:

```txt
business modules
client components
shared UI components
module API routes directly
Platform Services directly unless through SDK/data wrapper
Business Object consumers outside object services
```

### 8.2 Required pattern

```ts
// ✅ Required
const db = sdk.getDb(ctx)
await db.product.findMany({
  where: {
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

### 8.3 Forbidden patterns

```ts
// ❌ Forbidden
import { prisma } from '@/kernel/db/client'
```

```ts
// ❌ Forbidden
const db = sdk.getDb(orgId)
```

```ts
// ❌ Forbidden
const orgId = body.orgId
```

```ts
// ❌ Forbidden for tenant-scoped records
await db.product.findUnique({ where: { id } })
```

```ts
// ❌ Forbidden in modules
await prisma.$queryRaw`SELECT * FROM products`
```

---

## 9. Auth, Tenant, and Permission Dependency Rules

Protected operations must depend on verified context, not raw request data.

Correct dependency sequence:

```txt
request
  ↓
validate route params
  ↓
require API/page auth
  ↓
verify organization membership
  ↓
create PlatformContext
  ↓
verify module enablement if module route
  ↓
verify permission
  ↓
validate input
  ↓
call service with ctx + validated input
```

Forbidden shortcuts:

```ts
// ❌ No raw orgId from request
const orgId = req.nextUrl.searchParams.get('orgId')
```

```ts
// ❌ No permission checks based only on userId/orgId strings
await can(userId, 'create', 'inventory', orgId)
```

```ts
// ✅ Use context-aware permission checks
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_adjustment',
  action: 'create',
})
```

---

## 10. Event Dependency Rules

Modules must not call each other directly.

Cross-module communication uses events.

Allowed:

```ts
await sdk.events.emit(ctx, 'inventory.stock_adjustment.created', {
  stockAdjustmentId: adjustment.id,
  warehouseId: input.warehouseId,
})
```

Forbidden:

```ts
// ❌ Forbidden
import { PurchasingService } from '@/modules/purchasing/service'
```

```ts
// ❌ Forbidden
await sdk.events.emit(ctx, 'send.email', payload)
```

Events are facts, not commands.

Business Object events use `objects.*`.

Module events use module namespaces.

```txt
objects.product.created
objects.customer.updated
inventory.stock_adjustment.created
leave.leave_request.submitted
```

---

## 11. Configuration Dependency Rules

Client-specific behavior must be configuration, not code forks.

Allowed:

```txt
OrgModule
Setting
Subscription
Role
Permission
Client branding tokens
Module settings
Feature flags
```

Forbidden:

```txt
src/clients/acme/*
if (orgSlug === 'acme') custom business logic
client-specific CSS files
client-specific modules with company names
per-client database schema
per-client Vercel project for normal clients
per-client Supabase project for normal clients
```

Client-specific logic should be classified as:

```txt
configuration
module setting
module enhancement
new reusable module
premium custom work
reject/defer
```

---

## 12. Forbidden Imports

These should be blocked by `npm run check:architecture`.

### Modules

Forbidden inside `src/modules/**`:

```txt
@/kernel/
@/kernel/db/client
@prisma/client direct runtime imports
@/modules/other-module
process.env
next/headers in client files
next/cookies in client files
@/sdk/server in client files
@/platform-services/*/internal
```

### Client components

Forbidden inside files containing `'use client'`:

```txt
@/sdk/server
@/kernel/
@prisma/client
next/headers
next/cookies
server-only env helpers
SUPABASE_SERVICE_ROLE_KEY references
DATABASE_URL references
```

### Platform Services

Forbidden inside `src/platform-services/**`:

```txt
@/modules/
module service imports
module schema imports
module page/component imports
client-specific imports
```

### Shared UI

Forbidden inside `src/components/ui/**` and most `src/components/onedayos/**`:

```txt
@/kernel/
@/sdk/server
@prisma/client
module services
API route handlers
process.env server secrets
```

---

## 13. Forbidden Code Patterns

Architecture checks should flag these strings or AST patterns.

```txt
sdk.getDb(orgId)
getDb(orgId)
body.orgId
input.orgId
searchParams.get('orgId')
request.nextUrl.searchParams.get('orgId')
where: { id }
findUnique({ where: { id }
import { prisma } from '@/kernel/db/client' inside modules
from '@/kernel/' inside modules
from '@/modules/' inside another module
from '@/sdk/server' inside 'use client' files
SUPABASE_SERVICE_ROLE_KEY inside client/shared files
DATABASE_URL inside client/shared files
redirect('/login') inside API route files
NextResponse.redirect inside API route auth failure handling
/api/[module]
/api/inventory
/api/crm
/api/leave
```

String checks are not enough forever, but they are useful for MVP.

A future stricter implementation may use AST checks or dependency-cruiser-style rules.

---

## 14. Dependency Rules for Claude

Claude must follow these rules:

```txt
[ ] Do not import from @/kernel/* inside modules.
[ ] Do not import raw Prisma inside modules.
[ ] Do not import one module from another module.
[ ] Do not add a production dependency without approval.
[ ] Do not add FastAPI/Python backend files.
[ ] Do not add runtime AI, queues, background jobs, search engines, or Platform Services unless the implementation package explicitly says so.
[ ] Do not use sdk.getDb(orgId).
[ ] Do not accept client-supplied orgId.
[ ] Do not create /api/[module] routes.
[ ] Do not put business logic inside shared UI components.
[ ] Do not put client-specific code in the repository.
[ ] Stop if the required dependency is unclear.
```

Claude must report:

```txt
files changed
new imports introduced
new dependencies added, if any
architecture checks run
forbidden patterns checked
deviations from manual
uncertainties
```

---

## 15. `check:architecture` Requirements

The restarted build should include:

```bash
npm run check:architecture
```

This command should fail if dependency rules are violated.

Minimum MVP checks:

```txt
[ ] No @/kernel imports inside src/modules/**
[ ] No raw Prisma imports inside src/modules/**
[ ] No module-to-module imports
[ ] No @/sdk/server imports inside client components
[ ] No @/kernel imports inside client components
[ ] No @prisma/client imports inside client components
[ ] No sdk.getDb(orgId)
[ ] No body.orgId / input.orgId in API/service schemas except explicit rejection tests
[ ] No searchParams.get('orgId')
[ ] No /api/[module] generated routes
[ ] No redirect('/login') in API route auth paths
[ ] No FastAPI/Python backend files in core platform
[ ] No client-specific folders under src/clients or src/customers
[ ] No shadcn `accent` hijacking for brand color
[ ] No old `framer-motion` imports in restarted code; use `motion/react`
```

Recommended package scripts:

```json
{
  "scripts": {
    "check:architecture": "tsx scripts/check-architecture.ts",
    "check:all": "npm run lint && npm run typecheck && npm run check:architecture && npm run test:run && npm run build"
  }
}
```

---

## 16. Examples

## 16.1 Inventory service

Correct:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
import { CreateStockAdjustmentSchema } from './schema'

export async function createStockAdjustment(ctx: PlatformContext, input: unknown) {
  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
  })

  const parsed = CreateStockAdjustmentSchema.parse(input)
  const db = sdk.getDb(ctx)

  return db.$transaction(async (tx) => {
    // inventory mutation here
  })
}
```

Incorrect:

```ts
import { prisma } from '@/kernel/db/client'

export async function createStockAdjustment(orgId: string, input: any) {
  return prisma.stockAdjustment.create({
    data: {
      orgId: input.orgId,
      ...input,
    },
  })
}
```

## 16.2 Client form

Correct:

```tsx
'use client'

import { sdkClient } from '@/sdk/client'

await sdkClient.post(`/api/orgs/${orgSlug}/inventory/stock-adjustments`, {
  productId,
  warehouseId,
  quantity,
  reason,
})
```

Incorrect:

```tsx
await fetch('/api/inventory', {
  method: 'POST',
  body: JSON.stringify({ orgId, productId, quantity }),
})
```

## 16.3 Purchasing integration with Inventory

Correct:

```txt
Purchasing emits:
  purchasing.goods_receipt.posted

Future Inventory integration listens, if approved:
  inventory receives event envelope and creates stock movement through its own service
```

Incorrect:

```ts
// ❌ Purchasing importing Inventory directly
import { InventoryService } from '@/modules/inventory/service'
```

---

## 17. Acceptance Criteria

This document is ready to freeze when:

```txt
[ ] The import matrix is approved.
[ ] Module import rules are approved.
[ ] SDK split rules are approved.
[ ] Server/client boundary rules are approved.
[ ] Raw Prisma access rules are approved.
[ ] External dependency approval rules are approved.
[ ] Forbidden import list is approved.
[ ] Forbidden code pattern list is approved.
[ ] check:architecture minimum requirements are approved.
[ ] Claude workflow references these dependency rules.
```

Implementation based on this document is complete only when:

```txt
[ ] Repository structure follows the rules.
[ ] Modules import only approved surfaces.
[ ] Client components do not import server-only code.
[ ] API routes use tenant-scoped route shapes.
[ ] Module services receive PlatformContext.
[ ] Raw Prisma is blocked outside approved areas.
[ ] Module-to-module imports are blocked.
[ ] Client-specific folders/code are absent.
[ ] check:architecture exists and passes.
[ ] Generated module output passes dependency checks.
[ ] CI runs dependency checks.
```

---

## 18. Claude Implementation Prompt

Use this prompt after the document is frozen:

```md
You are implementing OneDayOS dependency enforcement.

Authoritative documents:
- docs/engineering-manual/02-architecture/05-dependency-rules.md
- docs/engineering-manual/02-architecture/02-repository-architecture.md
- docs/engineering-manual/05-sdk/01-sdk-public-api.md
- docs/engineering-manual/13-security/08-production-readiness-gate.md

Task:
Implement architecture dependency checks for the restarted OneDayOS platform.

Rules:
- Do not add FastAPI or Python backend files.
- Do not add new production dependencies without approval.
- Do not change the architecture.
- Do not loosen module import rules.
- Create or update scripts/check-architecture.ts.
- Add npm script check:architecture.
- Add tests or fixture checks for forbidden patterns where practical.
- Ensure generated module output passes the checks.
- Run npm run check:architecture, npm run test:run, npm run typecheck, and npm run build.

Stop if:
- A required dependency rule conflicts with existing implementation.
- A package is needed that is not approved.
- A module requires Kernel internals to function.
- The checker would need to allow client-supplied orgId.
```

---

## 19. Final Rule

```txt
OneDayOS modules should feel powerful because the platform is stable,
not because they are allowed to reach into everything.
```

Dependency discipline is what keeps OneDayOS from becoming a collection of tangled client apps.
