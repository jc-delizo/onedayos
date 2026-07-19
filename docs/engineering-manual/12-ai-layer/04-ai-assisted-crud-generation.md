# OneDayOS Engineering Manual — 12 AI Layer / 04 AI-Assisted CRUD Generation

**Document ID:** `12-ai-layer/04-ai-assisted-crud-generation.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Deferred — Contract Only`  
**Author:** ChatGPT, acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
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
- `08-module-system/03-module-folder-contract.md`
- `08-module-system/04-module-permissions.md`
- `08-module-system/06-module-events.md`
- `08-module-system/09-module-testing.md`
- `09-cli-generators/00-generator-philosophy.md`
- `09-cli-generators/02-crud-generator.md`
- `09-cli-generators/06-generator-safety-rails.md`
- `11-dynamic-systems/02-dynamic-crud-engine.md`
- `11-dynamic-systems/04-field-metadata-schema.md`
- `12-ai-layer/00-ai-layer-philosophy.md`
- `12-ai-layer/01-ai-context-contract.md`
- `12-ai-layer/02-module-ai-context.md`
- `12-ai-layer/03-ai-query-patterns.md`

---

# 1. Purpose

This document defines how OneDayOS should eventually use AI to help generate CRUD code safely.

The goal is to make future module development faster without letting AI invent architecture, bypass security, duplicate Business Objects, or generate generic admin-app scaffolding.

The key principle is:

```txt
AI may assist CRUD development.
AI must not become the CRUD architecture.
```

AI-assisted CRUD generation should help a human founder, architect, or coding agent produce OneDayOS-compliant code faster.

It should not allow users to dynamically create production database entities, APIs, or forms at runtime.

---

# 2. Implementation Status

AI-Assisted CRUD Generation is **not implemented during the restarted foundation build**.

This document is a contract only.

Claude must not implement:

```txt
AI CRUD generator
AI module generator
AI schema generator
AI migration generator
AI form generator
AI code-writing endpoint
AI app builder
AI no-code builder
AI database designer
AI prompt-to-Prisma tool
AI prompt-to-API tool
AI prompt-to-module tool
sdk.ai.generateCrud
```

from this document alone.

Allowed foundation work:

```txt
manual documentation
static type definitions if explicitly requested
module spec templates
metadata contracts
Claude implementation prompt templates
architecture safety rules
```

Forbidden foundation work:

```txt
OpenAI / Anthropic provider integration
AI code-generation API
runtime CRUD generation
runtime Prisma schema generation
automatic migration writing
AI-written production code without review
AI-generated SQL
AI-generated raw Prisma queries
AI-generated FastAPI or Python backend files
```

---

# 3. Core Position

OneDayOS will use AI in two different ways.

## 3.1 Development AI

Development AI is allowed now.

Examples:

```txt
ChatGPT helps write Engineering Manual documents.
Claude Code implements a frozen subsystem.
Claude Code fills in a generated module shell.
Claude Code writes tests from a module spec.
Claude Code reviews code for forbidden patterns.
```

Development AI operates in the development workflow.

It does not directly run inside client production accounts.

## 3.2 Runtime AI

Runtime AI is deferred.

Examples:

```txt
A client asks the app to create a new table.
A client asks AI to create a new CRUD screen.
A client asks AI to modify database schema.
A client asks AI to generate an approval workflow.
```

These are not allowed in MVP.

The correct near-term use of AI is:

```txt
Founder + ChatGPT define manual/spec.
Claude implements frozen spec.
Tests enforce architecture.
Human reviews before deploy.
```

The incorrect use is:

```txt
Client describes an app.
AI changes production database.
AI creates APIs.
AI deploys changes without review.
```

That path is rejected.

---

# 4. Definition of AI-Assisted CRUD Generation

AI-Assisted CRUD Generation means using an AI coding agent to help produce static source code for a CRUD surface based on approved OneDayOS inputs.

Approved inputs may include:

```txt
frozen Engineering Manual documents
module specification
Business Object specification
Prisma model proposal
field metadata
permission contract
route contract
API contract
service contract
UI standards
test requirements
```

The AI may produce:

```txt
implementation plan
file list
Prisma schema proposal
Zod schemas
service methods
API route handlers
React pages
React client components
event payload schemas
tests
documentation updates
```

The AI must not produce production changes from vague prompts alone.

Bad prompt:

```txt
Claude, build a CRM app.
```

Acceptable prompt:

```txt
Claude, using these frozen documents and the approved CRM module spec, implement the Customer Interaction CRUD surface only. Do not modify unrelated files. Do not add new architecture. Add tests for tenant isolation, permission denial, validation, soft delete, and event emission.
```

---

# 5. Relationship to Other OneDayOS Systems

AI-Assisted CRUD Generation is not the same as the other generation systems.

## 5.1 Not the Module Generator

The Module Generator is a CLI that creates a module skeleton.

Example:

```bash
npm run module:create inventory
```

It is deterministic.

It does not think.

AI may later help fill in the generated module, but the CLI owns the safe starting structure.

## 5.2 Not the Static CRUD Generator

The Static CRUD Generator is a future CLI that may generate normal code from metadata.

Example future command:

```bash
npm run crud:create inventory stock-adjustment
```

It should not be implemented yet.

AI-Assisted CRUD Generation may eventually help write or review the static generator templates, but it is not itself the generator.

## 5.3 Not the Dynamic CRUD Engine

Dynamic CRUD Engine means a runtime system that renders CRUD from metadata.

It is deferred.

AI-Assisted CRUD Generation should produce reviewed source code, not runtime database/admin behavior.

## 5.4 Not the Dynamic Form Engine

Dynamic Form Engine means runtime form rendering from form metadata.

It is deferred.

AI may help write ordinary React forms now, but it must not create runtime form infrastructure unless that subsystem is explicitly approved.

## 5.5 Not AI Query

AI Query helps users ask questions about data.

AI-Assisted CRUD Generation helps developers create CRUD code.

These must remain separate.

## 5.6 Not a Client-Facing App Builder

Clients should not be able to type:

```txt
Make me a Purchase Request app.
```

and have the system automatically generate database tables, APIs, UI, permissions, and deployments.

That may sound attractive, but it is dangerous until the platform is mature.

---

# 6. Why This Is Deferred

AI-assisted CRUD generation is powerful, but it multiplies whatever architecture exists.

If the architecture is correct, AI can help create modules quickly.

If the architecture is weak, AI will create insecure modules quickly.

The old MVP already showed the danger of scaffolding unsafe patterns:

```txt
loose orgId handling
sdk.getDb(orgId)
auth-only APIs
redirect-style API auth
weak tests
module-owned copies of shared objects
generic admin UI
```

The restarted platform must first lock down:

```txt
PlatformContext
SDK server/client split
tenant-scoped APIs
permission enforcement
Business Object ownership
soft delete
module manifest contract
generator safety rails
real module tests
design system
```

Only after those are stable should AI-assisted CRUD generation become more formal.

---

# 7. Strategic Goal

The long-term goal is not to avoid code.

The long-term goal is to make code generation boring, safe, and repeatable.

Ideal future workflow:

```txt
1. Founder chooses module or feature.
2. Founder and architect write a module spec.
3. Module spec references frozen manual documents.
4. CLI creates module or CRUD shell.
5. Claude fills in code using approved patterns.
6. Tests enforce security and architecture.
7. Human reviews and deploys.
```

Eventually:

```txt
AI reads metadata + manual + module spec
AI proposes source-code changes
AI writes tests
AI explains risk
AI waits for approval
```

The AI should behave like a disciplined junior-to-mid engineer, not a founder, architect, database admin, or production operator.

---

# 8. CRUD Eligibility Rules

Not every business workflow is CRUD.

AI-assisted CRUD generation may only be considered for simple entity management.

## 8.1 Good CRUD Candidates

Good candidates:

```txt
Product Category
Warehouse
Supplier
Customer note type
Asset category
Expense category
Visitor purpose
Incident category
Project status
Unit of measure
```

These usually have:

```txt
list
create
read/detail
update
soft delete
restore maybe
basic filters
simple permissions
simple events
```

## 8.2 Bad CRUD Candidates

Bad candidates:

```txt
stock movement
inventory adjustment
leave request
purchase request
expense claim
approval workflow
asset assignment
reservation booking
incident investigation
project task workflow
```

These are workflows, not simple CRUD.

They usually require:

```txt
state transitions
business rules
approval logic
side effects
computed balances
ledger-like history
notifications later
reporting later
audit-sensitive changes
```

AI must not reduce these workflows to generic CRUD.

## 8.3 Special Case: Business Objects

Business Objects may have CRUD surfaces, but they are shared layer features, not module features.

Examples:

```txt
Employee CRUD -> Business Objects / Kernel-adjacent surface
Product CRUD -> Business Objects surface
Customer CRUD -> Business Objects surface
Supplier CRUD -> Business Objects surface
Warehouse CRUD -> Business Objects surface
```

These APIs should live under:

```txt
/api/orgs/[orgSlug]/objects/employees
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/suppliers
/api/orgs/[orgSlug]/objects/warehouses
```

not under module APIs.

## 8.4 Special Case: Module Extension Tables

Module extension tables may have CRUD-like behavior, but they depend on the shared Business Object.

Example:

```txt
InventoryProductExtension
PurchasingSupplierExtension
SalesCustomerExtension
```

AI must understand that extension CRUD is not the same as Business Object CRUD.

Creating an Inventory Product Extension may require:

```txt
objects.product.read
inventory.product_extension.create
```

Creating a new Product from inside Inventory may require:

```txt
objects.product.create
inventory.product_extension.create
```

The service must own the transaction.

---

# 9. Required Inputs Before AI Generates CRUD Code

Claude or any future AI assistant must receive enough approved context before generating CRUD code.

Minimum required inputs:

```txt
1. Target layer
2. Target entity
3. Whether entity is Business Object or module-owned entity
4. Whether entity is an extension table
5. Approved Prisma model or model proposal
6. Approved permissions
7. Approved API routes
8. Approved events
9. Approved Zod schema shape
10. UI screen requirements
11. Table/form standards
12. Test requirements
13. Non-goals
14. Forbidden patterns
```

If these are missing, Claude must stop and ask for a spec or produce a planning-only response.

## 9.1 Target Layer

The prompt must say one of:

```txt
Kernel
Business Objects
Platform Service
Business Module
Client Configuration
```

For CRUD, the common layers are:

```txt
Business Objects
Business Module
```

## 9.2 Entity Ownership

The prompt must explicitly say:

```txt
ownedBy: objects
```

or:

```txt
ownedBy: inventory
```

or:

```txt
extensionOf: objects.product
ownedBy: inventory
```

AI must not guess ownership.

## 9.3 Approved Permissions

Permissions must be explicit.

Example:

```ts
const permissions = [
  { module: 'inventory', resource: 'stock_location', action: 'read' },
  { module: 'inventory', resource: 'stock_location', action: 'create' },
  { module: 'inventory', resource: 'stock_location', action: 'update' },
  { module: 'inventory', resource: 'stock_location', action: 'delete' },
]
```

AI must not invent wildcard permissions.

## 9.4 Approved Route Shape

Module-owned CRUD route:

```txt
/api/orgs/[orgSlug]/inventory/stock-locations
```

Business Object CRUD route:

```txt
/api/orgs/[orgSlug]/objects/products
```

Forbidden:

```txt
/api/inventory
/api/products
/api/[module]
/api/crud/[entity]
?orgId=...
```

## 9.5 Approved Event Names

Events must follow:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Examples:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
inventory.stock_location.created
inventory.stock_location.updated
inventory.stock_location.deleted
```

AI must not invent camelCase, abbreviations, or command-style events.

Forbidden:

```txt
createProduct
productCreate
inventory.product.create
send.notification
update_stock
```

---

# 10. Required Output From AI

When Claude is asked to implement AI-assisted CRUD work, it must produce an implementation plan before code.

The implementation plan must include:

```txt
files to create
files to modify
Prisma model changes
Zod schemas
API route handlers
service methods
UI pages/components
permissions used
events emitted
tests to add
manual references
known risks
```

Claude must not immediately edit files from a vague prompt.

## 10.1 File List

Example file list for module-owned CRUD:

```txt
src/modules/inventory/stock-locations/schema.ts
src/modules/inventory/stock-locations/service.ts
src/modules/inventory/stock-locations/events.ts
src/modules/inventory/stock-locations/permissions.ts
src/modules/inventory/stock-locations/__tests__/service.test.ts
src/modules/inventory/stock-locations/__tests__/api.test.ts
src/app/api/orgs/[orgSlug]/inventory/stock-locations/route.ts
src/app/api/orgs/[orgSlug]/inventory/stock-locations/[id]/route.ts
src/app/(platform)/[orgSlug]/inventory/stock-locations/page.tsx
src/app/(platform)/[orgSlug]/inventory/stock-locations/new/page.tsx
src/app/(platform)/[orgSlug]/inventory/stock-locations/[id]/edit/page.tsx
```

Example file list for Business Object CRUD:

```txt
src/business-objects/products/schema.ts
src/business-objects/products/service.ts
src/business-objects/products/events.ts
src/business-objects/products/permissions.ts
src/business-objects/products/__tests__/service.test.ts
src/business-objects/products/__tests__/api.test.ts
src/app/api/orgs/[orgSlug]/objects/products/route.ts
src/app/api/orgs/[orgSlug]/objects/products/[id]/route.ts
src/app/(platform)/[orgSlug]/objects/products/page.tsx
src/app/(platform)/[orgSlug]/objects/products/new/page.tsx
src/app/(platform)/[orgSlug]/objects/products/[id]/edit/page.tsx
```

Exact paths may change if the repository architecture document defines a different Business Object folder, but the ownership boundary must remain.

## 10.2 Tests

AI output must include tests, not just implementation.

Required test categories:

```txt
authentication required
wrong-org denied safely
module-disabled denied safely, for module-owned CRUD
permission denied
permission allowed
client-supplied orgId rejected
validation error
create success
update success
soft delete success
deleted records hidden
restore if supported
event emitted on success
event not emitted on failure
no raw Prisma in module files
no @/kernel import in module files
no module-to-module import
```

A CRUD surface without tests is not accepted.

---

# 11. Required CRUD Implementation Pattern

Every generated CRUD surface must follow this order:

```txt
1. API route receives request.
2. API route validates route params.
3. API route creates verified PlatformContext.
4. API route validates body/query with Zod.
5. API route rejects client-supplied orgId.
6. API route calls service with ctx + validated input.
7. Service enforces permission.
8. Service uses sdk.getDb(ctx).
9. Service scopes every query by ctx.org.id.
10. Service applies soft-delete rules.
11. Service emits event after successful mutation.
12. API route returns { data, error, meta? } JSON.
```

For module-owned APIs:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

For Business Object APIs:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
```

Then:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_location',
  action: 'create',
})
```

or:

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'create',
})
```

---

# 12. Required Service Pattern

Services must receive `PlatformContext`, not loose tenant identifiers.

Allowed:

```ts
export async function createStockLocation(
  ctx: PlatformContext,
  input: CreateStockLocationInput
) {
  await sdk.permissions.require(ctx, {
    module: 'inventory',
    resource: 'stock_location',
    action: 'create',
  })

  const db = sdk.getDb(ctx)

  const record = await db.stockLocation.create({
    data: {
      orgId: ctx.org.id,
      name: input.name,
      code: input.code,
      createdBy: ctx.user.id,
    },
  })

  await sdk.events.emit(ctx, 'inventory.stock_location.created', {
    stockLocationId: record.id,
  })

  return record
}
```

Forbidden:

```ts
export async function createStockLocation(orgId: string, input: Input) {}
```

Forbidden:

```ts
const db = sdk.getDb(input.orgId)
```

Forbidden:

```ts
const db = prisma
```

Forbidden:

```ts
await sdk.events.emit('inventory.stock_location.created', record)
```

Events must use `PlatformContext` and safe payloads.

---

# 13. Required API Pattern

API routes must use the Kernel API contract.

Example route shape:

```ts
import { sdk } from '@/sdk/server'
import { CreateStockLocationSchema } from '@/modules/inventory/stock-locations/schema'
import { StockLocationService } from '@/modules/inventory/stock-locations/service'

export const POST = sdk.api.handle(async (req, { params }) => {
  const { orgSlug } = await params

  const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
  const body = await sdk.api.parseJson(req, CreateStockLocationSchema)

  const data = await StockLocationService.create(ctx, body)

  return sdk.api.created(data)
})
```

The actual SDK helper names may be refined, but the pattern must remain:

```txt
API-safe auth
verified context
Zod validation
service call
JSON response
```

Forbidden:

```ts
await sdk.auth.requireAuth()
```

inside API routes if it redirects.

Forbidden:

```ts
return redirect('/login')
```

inside API routes.

Forbidden:

```ts
return NextResponse.redirect(...)
```

inside protected API routes.

Protected APIs return JSON errors only.

---

# 14. Required Zod Pattern

CRUD body schemas must use strict object validation.

Allowed:

```ts
export const CreateStockLocationSchema = z.strictObject({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
})
```

Forbidden:

```ts
export const CreateStockLocationSchema = z.object({
  orgId: z.string(),
  code: z.string(),
  name: z.string(),
})
```

Forbidden:

```ts
z.object(...).passthrough()
```

for API request bodies.

Unknown keys must fail validation.

Client-supplied `orgId` must fail validation.

---

# 15. Required Database Pattern

CRUD queries must be tenant-scoped.

Allowed:

```ts
await db.stockLocation.findMany({
  where: {
    orgId: ctx.org.id,
    deletedAt: null,
  },
  orderBy: { name: 'asc' },
})
```

Allowed for unique tenant-safe lookup:

```ts
await db.stockLocation.findFirst({
  where: {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Forbidden:

```ts
await db.stockLocation.findUnique({ where: { id } })
```

for tenant-scoped records.

Forbidden:

```ts
await db.stockLocation.delete({ where: { id } })
```

for business records.

Use soft delete:

```ts
await db.stockLocation.update({
  where: { id_orgId: { id, orgId: ctx.org.id } },
  data: {
    deletedAt: new Date(),
    deletedBy: ctx.user.id,
  },
})
```

if the schema has a composite unique constraint.

Otherwise use tenant-safe `updateMany` plus affected-count check.

---

# 16. Required UI Pattern

AI-generated CRUD UI must follow the Design System documents.

Even before the full design system is frozen, AI must avoid generic admin-starter UI.

Required UI qualities:

```txt
minimal
premium
data-dense
keyboard-friendly
consistent with app shell
beautiful table state
beautiful form state
clear empty states
skeleton loading where needed
toasts for mutations
optimistic UI where safe
```

Forbidden UI patterns:

```txt
generic Bootstrap dashboard
random card grids for everything
unlabeled icon buttons
spinner-only loading states
forms with hidden orgId fields
CRUD pages that ignore permissions
client components importing server SDK
client components importing raw Prisma
client-side auth enforcement only
```

Client components may use browser-safe helpers only:

```ts
import { sdkClient } from '@/sdk/client'
```

They must not import:

```ts
import { sdk } from '@/sdk/server'
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
```

---

# 17. Required Event Pattern

Mutations must emit events after successful database writes.

Business Object CRUD events:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored
```

Module-owned CRUD events:

```txt
inventory.stock_location.created
inventory.stock_location.updated
inventory.stock_location.deleted
inventory.stock_location.restored
```

Event payloads must be small.

Allowed:

```ts
await sdk.events.emit(ctx, 'inventory.stock_location.created', {
  stockLocationId: record.id,
})
```

Allowed:

```ts
await sdk.events.emit(ctx, 'objects.product.updated', {
  productId: product.id,
  changedFields: ['name', 'unit'],
})
```

Forbidden:

```ts
await sdk.events.emit(ctx, 'objects.product.updated', product)
```

Forbidden:

```ts
await sdk.events.emit(ctx, 'inventory.product.created', { productId })
```

if Product is the shared Business Object.

---

# 18. Permission Rules

AI-generated CRUD must enforce permissions in services and APIs.

The UI may hide controls, but it is not security.

## 18.1 Business Object CRUD Permissions

Use `objects` namespace.

Examples:

```txt
objects.product.read
objects.product.create
objects.product.update
objects.product.delete
objects.product.restore
objects.product.export
```

Permission object:

```ts
{
  module: 'objects',
  resource: 'product',
  action: 'create',
}
```

## 18.2 Module-Owned CRUD Permissions

Use module namespace.

Examples:

```txt
inventory.stock_location.read
inventory.stock_location.create
inventory.stock_location.update
inventory.stock_location.delete
inventory.stock_location.restore
inventory.stock_location.export
```

Permission object:

```ts
{
  module: 'inventory',
  resource: 'stock_location',
  action: 'create',
}
```

## 18.3 Extension CRUD Permissions

Extension CRUD may require both Business Object and module permissions.

Example:

```txt
Create Product from Inventory screen:
requires objects.product.create
requires inventory.product_extension.create
```

Example:

```txt
Update reorder point only:
requires inventory.product_extension.update
may not require objects.product.update
```

The service spec must decide this explicitly.

AI must not guess.

---

# 19. Module Enablement Rules

Module-owned CRUD requires module enablement.

If Inventory is disabled for an org, the following must be inaccessible:

```txt
/api/orgs/[orgSlug]/inventory/stock-locations
/[orgSlug]/inventory/stock-locations
```

Even if the user has wildcard Admin permission.

Admin wildcard permission does not bypass module enablement.

Business Object CRUD may not require a specific business module, but may require platform configuration or object navigation enablement depending on future product decisions.

---

# 20. Relationship Rules

AI-generated CRUD must treat relationships carefully.

## 20.1 Tenant-Safe Relations

Relation IDs from the client are untrusted.

Example:

```txt
productId
warehouseId
employeeId
customerId
supplierId
```

The service must verify that the related record belongs to `ctx.org.id`.

Allowed:

```ts
const warehouse = await db.warehouse.findFirst({
  where: {
    id: input.warehouseId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})

if (!warehouse) throw sdk.errors.notFound('WAREHOUSE_NOT_FOUND')
```

Forbidden:

```ts
connect: { id: input.warehouseId }
```

without tenant verification.

## 20.2 Business Object Relations

Module-owned tables that reference Business Objects must do so without duplicating them.

Allowed:

```txt
InventoryProductExtension.productId -> Product.id
InventoryProductExtension.orgId -> Organization.id
```

Forbidden:

```txt
InventoryProduct.name
InventoryProduct.sku
InventoryProduct.unit
```

if those fields duplicate Product.

## 20.3 Cross-Module Relations

AI must not create direct foreign keys to other module-owned tables without explicit approval.

Prefer:

```txt
sourceModule
sourceEntity
sourceId
```

for traceability when strict referential integrity is not required.

---

# 21. AI Prompt Contract

When asking Claude to generate CRUD code, use a narrow prompt.

Template:

```md
You are implementing a OneDayOS CRUD surface.

Authoritative documents:
- docs/engineering-manual/04-kernel/04-authorization-enforcement.md
- docs/engineering-manual/04-kernel/08-kernel-api-contracts.md
- docs/engineering-manual/05-sdk/01-sdk-public-api.md
- docs/engineering-manual/05-sdk/02-sdk-db-access.md
- docs/engineering-manual/06-data/01-tenancy-data-isolation.md
- docs/engineering-manual/06-data/03-soft-delete-archival.md
- docs/engineering-manual/08-module-system/04-module-permissions.md
- docs/engineering-manual/09-cli-generators/06-generator-safety-rails.md
- docs/engineering-manual/12-ai-layer/04-ai-assisted-crud-generation.md

Target:
- Layer: [Business Objects | Business Module]
- Module: [module id, if applicable]
- Entity: [entity name]
- Ownership: [objects | module-owned | extension of Business Object]

Rules:
- Do not invent architecture.
- Do not import from @/kernel inside modules.
- Do not import raw Prisma inside modules.
- Do not accept client-supplied orgId.
- Use verified PlatformContext.
- Use sdk.getDb(ctx).
- Use tenant-scoped API routes.
- Use z.strictObject() for request bodies.
- Enforce permissions in services.
- Return JSON only from APIs.
- Use soft delete for deletes.
- Emit events only after successful mutation.
- Add tenant-isolation and permission-denial tests.
- Stop if the spec is ambiguous.

Task:
Implement only [specific CRUD surface].
```

Claude should respond first with:

```txt
implementation plan
files to modify
risks/ambiguities
test plan
```

before editing.

---

# 22. Required AI Review Checklist

Before accepting AI-generated CRUD code, review this checklist.

```txt
[ ] Correct layer selected
[ ] Entity ownership is correct
[ ] No duplicated Business Object
[ ] No client-supplied orgId
[ ] No sdk.getDb(orgId)
[ ] No raw Prisma in module files
[ ] No @/kernel imports in module files
[ ] No module-to-module imports
[ ] API route is tenant-scoped
[ ] API route returns JSON only
[ ] API route uses API-safe auth/context helper
[ ] Body schema uses z.strictObject()
[ ] Route params are validated
[ ] Query params are validated
[ ] Service receives PlatformContext
[ ] Service enforces permissions
[ ] Service scopes queries by ctx.org.id
[ ] Reads exclude deleted records
[ ] Delete is soft delete
[ ] Mutation emits correct event
[ ] Event payload is safe and small
[ ] Tests use at least two organizations
[ ] Tests include non-admin permission denial
[ ] Tests include wrong-org denial
[ ] Tests include client-supplied orgId rejection
[ ] Tests include validation errors
[ ] Tests include event emission
[ ] Tests include non-emission on failed mutation
[ ] Typecheck passes
[ ] Tests pass
[ ] Build passes
[ ] Architecture check passes
```

If any critical item fails, the code is rejected.

---

# 23. Anti-Patterns

## 23.1 Prompt-to-App

Forbidden:

```txt
Build an Inventory app.
```

Reason:

```txt
Too broad. Encourages Claude to invent architecture.
```

## 23.2 Prompt-to-Database

Forbidden:

```txt
Create whatever Prisma models are needed.
```

Reason:

```txt
AI may duplicate Business Objects or create unsafe tenant models.
```

## 23.3 Prompt-to-Admin-Dashboard

Forbidden:

```txt
Generate CRUD pages for all tables.
```

Reason:

```txt
OneDayOS is not a generic admin panel.
```

## 23.4 Client Runtime CRUD Builder

Forbidden for MVP:

```txt
Let clients create their own tables and fields.
```

Reason:

```txt
This creates schema, security, support, and migration complexity too early.
```

## 23.5 AI SQL Agent

Forbidden:

```txt
Let AI write SQL to implement CRUD.
```

Reason:

```txt
Unsafe, hard to test, and bypasses Prisma/migration discipline.
```

## 23.6 AI Permission Guessing

Forbidden:

```txt
AI decides what permissions are needed.
```

Reason:

```txt
Permissions are product/security contracts. They require explicit design.
```

## 23.7 Full Record Event Payloads

Forbidden:

```txt
Emit full database record in event payload.
```

Reason:

```txt
Leaks sensitive fields and creates compatibility risk.
```

## 23.8 Generic Custom Fields

Forbidden in MVP:

```txt
customFields Json
```

as a shortcut for CRUD generation.

Reason:

```txt
It hides schema design, validation, permissions, search, exports, reporting, and AI context inside ungoverned JSON.
```

---

# 24. Future AI-Assisted CRUD Maturity Levels

OneDayOS should evolve gradually.

## Level 0 — Manual Code with AI Help

Current safe path.

```txt
Founder + ChatGPT write specs.
Claude implements manually.
Tests enforce rules.
```

## Level 1 — CLI Skeleton + AI Fill-In

Near-term goal.

```txt
CLI creates module shell.
Claude fills service/API/UI/tests from frozen spec.
```

## Level 2 — Static CRUD Generator + AI Review

Future.

```txt
CRUD generator creates code from metadata.
Claude reviews/refines.
Tests enforce architecture.
```

## Level 3 — AI Generates Static Code from Approved Metadata

Future after repeated modules.

```txt
AI proposes code changes from metadata.
Human reviews.
CI verifies.
```

## Level 4 — Runtime Dynamic CRUD

Long-term, not guaranteed.

```txt
Platform renders simple CRUD from metadata at runtime.
```

This requires proven security, design, permissions, and metadata maturity.

It must not be rushed.

---

# 25. When AI-Assisted CRUD May Become an Implemented Tool

Before implementing an actual AI-assisted CRUD tool, all must be true:

```txt
[ ] Production Readiness Gate passed
[ ] SDK public API frozen
[ ] DB access contract frozen
[ ] Module Generator implemented and trusted
[ ] Generator safety rails implemented
[ ] At least three real modules built manually or semi-manually
[ ] Repeated CRUD pain documented
[ ] Design System table/form standards frozen
[ ] Static CRUD Generator design approved
[ ] Field Metadata contract proven in real modules
[ ] Security test suite catches unsafe generated patterns
[ ] Founder approves AI-generation workflow
[ ] ADR written and approved
```

Until then, AI-assisted CRUD is a development practice, not a platform feature.

---

# 26. Required Future ADR Topics

Before implementation, write ADRs for:

```txt
ADR: AI provider for development automation, if embedded into tooling
ADR: Whether AI code generation runs locally or in CI
ADR: Whether AI may modify Prisma schema proposals
ADR: Static CRUD generation before Dynamic CRUD
ADR: Required human approval gates
ADR: Generated-code verification pipeline
ADR: How generated code is attributed and reviewed
ADR: Whether prompts/specs are stored as project artifacts
```

No ADR is needed for using ChatGPT and Claude manually in the current development workflow.

An ADR is needed when AI becomes part of OneDayOS tooling or runtime behavior.

---

# 27. Verification Requirements

Any future AI-assisted CRUD workflow must run:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run check:architecture
```

Expected architecture checks:

```txt
no @/kernel imports in modules
no raw Prisma imports in modules
no sdk.getDb(orgId)
no client-supplied orgId in schemas
no /api/[module] route pattern
no module-to-module imports
no hard deletes for business data
no unsafe findUnique on tenant-scoped models
```

The AI workflow is not accepted unless verification passes.

---

# 28. Claude Implementation Rules

Claude must follow these rules:

```txt
1. Do not implement AI CRUD tooling from this document alone.
2. Do not add AI provider packages.
3. Do not create AI APIs.
4. Do not create runtime CRUD engines.
5. Do not create client-facing app builders.
6. Do not generate Prisma schema from natural language without explicit approved schema spec.
7. Do not use FastAPI, Python, Pydantic, Alembic, or SQLAlchemy.
8. Do not create database migrations automatically from vague prompts.
9. Do not create module-owned copies of Business Objects.
10. Do not create generic customFields JSON.
11. Do not accept client-supplied orgId.
12. Do not bypass PlatformContext.
13. Do not bypass permission enforcement.
14. Do not bypass tests.
15. Stop if ownership, permissions, routes, or events are ambiguous.
```

Claude may help with:

```txt
implementation planning
module spec refinement
CRUD file scaffolding from approved spec
Zod schema writing
service implementation
API route implementation
UI component implementation
test writing
architecture review
forbidden-pattern cleanup
```

only when explicitly instructed with a frozen spec.

---

# 29. Founder Decision Filter

When considering AI-assisted CRUD, ask:

```txt
Does this help us deliver modules faster without reducing security?
Does this follow the manual, or does it invent architecture?
Does this create source code we can review, test, and maintain?
Does this respect Business Object ownership?
Does this avoid client-specific forks?
Does this avoid runtime schema chaos?
Does this help one-day delivery later?
```

If the answer is yes, it may be useful.

If the answer is:

```txt
It lets clients build anything they want.
```

be careful. That is usually a no-code platform, not OneDayOS MVP.

---

# 30. Acceptance Criteria

This document is accepted when:

```txt
[ ] It clearly separates development AI from runtime AI
[ ] It blocks immediate AI CRUD tool implementation
[ ] It defines safe AI-assisted CRUD generation principles
[ ] It defines required inputs before AI generates CRUD code
[ ] It defines required outputs from AI
[ ] It defines safe API/service/DB/UI/event patterns
[ ] It protects PlatformContext
[ ] It rejects client-supplied orgId
[ ] It protects Business Object ownership
[ ] It requires tenant-isolation and permission-denial tests
[ ] It distinguishes CRUD from workflows
[ ] It gives Claude clear implementation boundaries
[ ] It keeps FastAPI/Python outside the core platform
```

---

# 31. Final Rule

AI-assisted CRUD generation should make OneDayOS faster only after OneDayOS is already disciplined.

The final rule is:

```txt
AI may accelerate approved architecture.
AI may not create architecture.
```

