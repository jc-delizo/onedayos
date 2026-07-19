# OneDayOS Engineering Manual — 02 Architecture / 00 System Architecture

**Document ID:** `02-architecture/00-system-architecture.md`  
**Version:** 1.0  
**Status:** Frozen  
**Owner:** Founder / Software Architect  
**Author:** ChatGPT, acting as founding software architect  
**Date:** July 2026  
**Depends On:** `01-foundation/00-vision.md`  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  

---

# 1. Purpose

This document defines the master system architecture for OneDayOS.

It explains how the platform is structured, how its layers interact, what each layer is allowed to contain, and which architectural rules must be followed by all future implementation work.

This document exists to prevent OneDayOS from becoming:

- a generic SaaS starter,
- a folder of unrelated CRUD apps,
- a collection of bespoke client projects,
- a codebase where every module invents its own architecture,
- or an AI-generated admin dashboard with no long-term platform foundation.

OneDayOS is a long-term Business Operating System for Philippine SMEs. The architecture must support hundreds of organizations, many reusable modules, shared business objects, AI-assisted development, and fast one-day delivery without creating unmaintainable custom code.

---

# 2. Relationship to the Vision Document

The Vision document defines what OneDayOS is.

This System Architecture document defines how OneDayOS is structured so the Vision can survive implementation.

The Vision says:

> Customers buy OneDayOS plus enabled modules. They do not buy separate apps.

Therefore, the architecture must enforce:

- one platform,
- one login,
- one tenant model,
- one shared database strategy,
- one SDK,
- one design system,
- one module system,
- one event system,
- and one consistent delivery model.

Any architecture that encourages one-off module behavior is incompatible with the Vision.

---

# 3. Architectural North Star

The locked conceptual architecture is:

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

This is the product architecture, not necessarily the physical folder structure.

The physical implementation may temporarily place some layers near each other for MVP speed, but the conceptual separation must be preserved.

The most important current example is Business Objects:

```txt
Conceptually:
  Business Objects are their own layer.

Physically in the MVP:
  Business Object tables may live in the same Prisma schema and codebase area as Kernel.

Architecturally:
  Business Objects are not Kernel internals.
  Modules must not reach into Kernel internals to use them.
  Access should happen through stable SDK/service contracts.
```

This clarification resolves the current MVP tension where Business Objects were implemented as a `Layer 1.5` part of the Kernel plan, while the long-term architecture treats them as a distinct layer.

---

# 4. Scope of This Document

This document decides:

- the master architecture layers,
- the allowed direction of dependencies,
- the responsibility of each layer,
- the module communication model,
- the database tenancy model,
- the SDK rule,
- the Business Object rule,
- the Platform Service promotion rule,
- the event-driven integration model,
- the current MVP exceptions,
- and the implementation gates that protect the architecture.

This document does **not** fully define:

- exact database models,
- full permission helper implementation,
- final design system tokens,
- module manifest schema details,
- individual module specifications,
- deployment runbooks,
- production monitoring,
- or the complete AI layer.

Those are defined in separate Engineering Manual documents.

---

# 5. Primary Architectural Decisions

## 5.1 One platform, not many apps

OneDayOS is a single platform that can enable different modules for different organizations.

A customer does not receive a separate codebase for Inventory, Leave, CRM, or Visitor Management.

They receive:

```txt
OneDayOS
  + enabled modules
  + organization configuration
  + users and permissions
  + AppCare
```

This means every module must be designed as part of the same operating system.

---

## 5.2 Single shared database for the current architecture

The current architecture uses one PostgreSQL database with shared tables and tenant separation by `org_id`.

```txt
organizations
users
employees
products
customers
suppliers
warehouses
inventory_records
leave_requests
...
```

Each tenant-scoped table must include `org_id` unless it is truly global platform metadata.

The current strategy is:

```txt
One deployment
One database
Shared tables
Tenant isolation through org_id
Application-level tenant enforcement now
RLS later as defense-in-depth
```

This supports the commercial model because it keeps operational cost low while enabling many SMEs to run on the same platform.

---

## 5.3 SDK-only module access

Business modules must not import Kernel internals.

Allowed:

```ts
import { sdk } from '@/sdk'
```

Forbidden inside modules:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
import { registerModule } from '@/kernel/modules/registry'
```

The SDK is the only supported interface between modules and the platform.

This gives OneDayOS freedom to refactor Kernel internals without rewriting every module.

---

## 5.4 Modules never communicate directly

A module must not import another module.

Forbidden:

```ts
// inside purchasing module
import { InventoryService } from '@/modules/inventory/service'
```

Allowed:

```ts
await sdk.events.emit('purchasing.purchase_order.received', payload)
```

Other modules or services may subscribe to the event.

This prevents tight coupling and keeps modules independently reusable.

---

## 5.5 Business Objects are shared and minimal

Shared business entities belong to the Business Objects layer, not to individual modules.

Examples:

- Employee
- Product
- Customer
- Supplier
- Branch
- Warehouse
- Department
- Project, when proven

A module must not define its own duplicate version of these objects.

For example, Inventory must not create `InventoryProduct` as its own copy of Product identity.

Correct pattern:

```txt
Product
  id
  orgId
  code
  name
  unit

InventoryProductExtension
  productId
  reorderPoint
  minimumStock
  valuationMethod
```

Core Business Objects must contain only fields that are broadly reusable. Module-specific details belong in module-owned extension tables.

---

## 5.6 Platform Services require evidence

A reusable capability becomes a Platform Service only after it is needed by three independent modules or use cases.

This is the Three Client Rule, refined as:

```txt
Do not promote a capability into Platform Services just because it sounds reusable.
Promote it when repeated real module demand proves it is reusable.
```

Examples that should remain deferred until proven:

- Approval Engine
- Notification Engine
- Comment Engine
- Attachment Service
- Activity Feed
- Dynamic Form Engine
- Workflow Engine
- Background Jobs

This prevents premature abstraction.

---

## 5.7 Dynamic CRUD and Dynamic Forms are strategic, not immediate

The long-term goal is metadata-driven CRUD, forms, tables, reports, import/export, and AI generation.

But OneDayOS must not build a low-quality no-code framework before real module patterns exist.

The current rule:

```txt
Do not implement the Dynamic Form Engine until at least three modules have hand-coded forms and repeated pain is confirmed.
```

However, the metadata strategy should be designed early so hand-coded modules do not block future generation.

---

# 6. System Context

At runtime, OneDayOS serves multiple organizations using the same application deployment.

```txt
User
  ↓ logs in through Supabase Auth
OneDayOS Web App
  ↓ resolves platform User + Organization
Kernel
  ↓ provides auth, tenancy, permissions, module registry
SDK
  ↓ exposes stable interface
Business Modules
  ↓ read/write tenant-scoped data
PostgreSQL
```

Each request must answer these questions:

```txt
Who is the authenticated user?
Which organization are they trying to access?
Is that user a member of that organization?
Which modules are enabled for that organization?
What permissions does the user have?
Which data is scoped to that organization?
```

Until all of these are answered, the request is not safe.

---

# 7. Architecture Layers

## 7.1 Layer 0 — Infrastructure

Infrastructure is not shown in the conceptual layer stack, but it supports everything.

Current infrastructure:

```txt
Vercel
GitHub
Supabase
PostgreSQL
Prisma
Linear
Claude Code
```

Future infrastructure may include:

```txt
Redis
Background job queue
Object storage
Email provider
SMS provider
Stripe or Philippine payment provider
Analytics/observability provider
AI provider abstraction
```

Infrastructure should be replaceable where commercially reasonable.

The application must avoid scattering infrastructure-specific calls throughout modules. Platform-facing wrappers should hide provider details.

---

## 7.2 Layer 1 — Kernel

The Kernel contains platform fundamentals required by every module.

Kernel owns:

- authentication integration,
- session helpers,
- organizations,
- tenant context,
- users,
- roles,
- permissions,
- organization modules / feature flags,
- subscriptions and plan limits,
- settings foundation,
- module registry,
- event bus primitive,
- SDK backing implementations,
- app shell primitives,
- routing guards,
- platform API response contracts.

Kernel must stay small.

Kernel must not contain:

- Inventory business logic,
- Leave business logic,
- CRM business logic,
- purchasing workflows,
- approval workflows before promotion,
- notification workflows before promotion,
- report builders before promotion,
- client-specific logic,
- module-specific fields on shared objects.

Kernel’s job is to make the platform coherent, not to become a dumping ground.

---

## 7.3 Layer 1.5 / Conceptual Layer 2 — Business Objects

Business Objects are shared domain entities used by multiple modules.

They are conceptually separate from Kernel, even if implemented physically near Kernel during MVP.

Business Objects own:

- minimal shared schema,
- shared identity,
- shared lifecycle conventions,
- soft-delete behavior,
- shared events,
- extension rules,
- cross-module reference semantics.

Examples:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
Branch
Department
```

Business Objects do not own module workflows.

Example:

```txt
Product owns:
  code
  name
  unit
  category

Inventory owns:
  stock balance
  reorder point
  valuation method
  stock movement history

Purchasing owns:
  supplier quote lines
  purchase order lines
  receiving history
```

This distinction is critical.

If Product becomes an Inventory-owned concept, CRM, Purchasing, Reservations, and future Sales modules will either duplicate it or become improperly dependent on Inventory.

---

## 7.4 Layer 2 — Platform Services

Platform Services are reusable capabilities that multiple modules consume.

Potential Platform Services:

- Approval Engine
- Notification Engine
- Workflow Engine
- Reporting Engine
- Search Service
- Audit Log Service
- Activity Feed Service
- Comment Service
- Attachment Service
- Import/Export Service
- Background Job Service
- AI Context Service

Platform Services may depend on:

```txt
Kernel
Business Objects
SDK contracts
```

Platform Services must not depend on a specific Business Module.

Wrong:

```txt
Approval Engine imports LeaveRequest directly.
```

Correct:

```txt
Leave Module submits an approval request to Approval Service.
Approval Service stores a generic approval record referencing entityType/entityId.
```

Platform Services are promoted only after evidence.

---

## 7.5 Layer 3 — Business Modules

Business Modules implement business-domain workflows.

Examples:

- Inventory
- Leave
- CRM
- Purchasing
- Expenses
- Assets
- Projects
- Reservations
- Visitor Management
- Incident Reporting

A module is not merely a folder.

A module is a self-contained package containing:

```txt
manifest
routes
permissions
navigation
schemas
services
API routes
pages
business logic
events
AI context
tests
documentation
seed logic
```

Modules consume the platform through the SDK.

Modules may own:

- module-specific tables,
- module-specific services,
- module-specific workflows,
- module-specific settings,
- module-specific reports before promotion,
- module-specific screens,
- module-specific forms,
- module-specific permissions.

Modules may not own:

- duplicate shared business entities,
- Kernel primitives,
- cross-module direct imports,
- direct raw access to Kernel internals,
- global settings patterns,
- tenant identity decisions.

---

## 7.6 Layer 4 — Client Configuration

Client Configuration determines how a specific organization uses OneDayOS.

It includes:

- enabled modules,
- disabled modules,
- plan limits,
- roles,
- permissions,
- organization settings,
- module settings,
- branch and department setup,
- labels and defaults,
- future workflow configuration,
- future form/table/report configuration,
- future AI preferences.

Client Configuration should be stored as data, not as code branches.

Wrong:

```txt
if client === 'acme' then show custom page
```

Correct:

```txt
OrgModule enables inventory
Settings configure inventory defaults
Roles determine visible actions
```

Client Configuration is the mechanism that allows one platform to serve many SMEs without forks.

---

# 8. Dependency Direction

## 8.1 Conceptual dependency direction

Conceptually, higher layers consume lower layers.

```txt
Client Configuration
  consumes Business Modules

Business Modules
  consume SDK, Business Objects, Platform Services

Platform Services
  consume SDK, Kernel, Business Objects

Business Objects
  consume Kernel tenancy conventions

Kernel
  consumes Infrastructure
```

In code, the SDK is the public boundary that hides Kernel internals.

---

## 8.2 Code dependency rule

The safe dependency graph is:

```txt
src/modules/*
  → src/sdk
  → src/kernel/*

src/modules/*
  → src/components/*
  → src/lib/*

src/platform-services/* future
  → src/sdk
  → src/kernel/*

src/kernel/*
  → infrastructure libraries
```

Forbidden:

```txt
src/modules/* → src/kernel/*
src/modules/* → src/modules/other-module/*
src/kernel/* → src/modules/*
src/components/ui/* → business logic
src/components/kernel/layout/* → module-specific service logic
src/platform-services/* → src/modules/*
```

---

## 8.3 Enforceable import rules

The architecture should eventually be enforced by ESLint or dependency-cruiser.

Rules should include:

```txt
1. modules may import from @/sdk
2. modules may import from @/components
3. modules may import from @/lib
4. modules may import from their own module folder
5. modules may not import from @/kernel
6. modules may not import from another module folder
7. kernel may not import from modules
8. UI components may not import Prisma or SDK services unless explicitly kernel-level components
```

Claude Code must be instructed to treat these rules as hard boundaries.

---

# 9. Request Lifecycle Architecture

## 9.1 Page request lifecycle

A typical organization-scoped page request should behave like this:

```txt
1. Request arrives at /:orgSlug/:modulePath
2. Auth session is resolved
3. Platform User is loaded from Prisma
4. Organization is loaded by slug
5. User membership in organization is verified
6. Enabled modules are loaded
7. Route/module access is verified
8. Permissions are checked where required
9. Tenant-scoped data is queried using orgId
10. Page renders inside AppShell
```

Critical rule:

```txt
Authentication alone is not tenant authorization.
```

A user being logged in does not mean they can access every organization route.

---

## 9.2 API request lifecycle

A typical API mutation should behave like this:

```txt
1. Request arrives at /api/...
2. API-safe auth helper checks session
3. Platform User is loaded
4. Organization context is derived from route/session/server state
5. Client-supplied orgId is ignored or rejected
6. Permission is enforced
7. Request body is validated with Zod
8. Service receives a verified PlatformContext
9. Service performs tenant-scoped database operation
10. Service emits required event
11. API returns { data, error } JSON
```

API routes must not use page-oriented helpers that redirect with HTML.

API authentication failure must return JSON `401`.

API authorization failure must return JSON `403`.

---

## 9.3 Service lifecycle

Services should not accept loose `orgId` and `userId` strings unless the manual explicitly allows it.

Preferred pattern:

```ts
type PlatformContext = {
  userId: string
  orgId: string
  orgSlug?: string
  roleIds?: string[]
}
```

Then:

```ts
InventoryService.createStockAdjustment(ctx, input)
```

This makes tenant and actor context explicit.

A service should not need to guess which organization it is operating under.

---

# 10. Tenancy Architecture

## 10.1 Current tenancy model

OneDayOS currently uses organization-based tenancy.

```txt
Organization = tenant
User belongs to Organization
Tenant data includes orgId
Routes use orgSlug
Database rows use orgId
```

This is appropriate for the first stage because most Philippine SMEs will not require complex multi-org identity.

---

## 10.2 Single-org user assumption

For the MVP, a platform user belongs to one organization.

```txt
User.orgId → Organization.id
```

This simplifies:

- login redirect,
- permission checks,
- route guards,
- tenant scoping,
- support operations.

Future multi-org users may require:

```txt
Account
Membership
Organization
UserProfile
```

But that should not be added until real demand appears.

---

## 10.3 Organization route guard

Every organization-scoped route must verify:

```txt
authenticatedUser.id exists in platform users
platformUser.orgId === organization.id
organization.slug === route orgSlug
organization is active
user is active
subscription is not suspended, where relevant
```

If this check fails:

- pages should show not found or access denied depending on the scenario,
- APIs should return JSON `401` or `403`,
- no tenant data should be queried beyond what is required to perform the check.

---

## 10.4 No client-supplied tenant identity

Client payloads must not determine tenant identity.

Forbidden:

```ts
const orgId = body.orgId
const records = await service.list(orgId)
```

Forbidden:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

Correct:

```ts
const ctx = await sdk.auth.requireApiOrgContext(...)
const records = await service.list(ctx)
```

The client may send business data.

The server derives tenant identity.

---

## 10.5 Database-per-tenant future seam

Although the current system uses one database, modules must call:

```ts
sdk.getDb(ctx)
```

rather than importing Prisma directly.

Today:

```txt
sdk.getDb(ctx) → shared Prisma singleton scoped by verified PlatformContext
```

Future:

```txt
sdk.getDb(ctx) → tenant-specific database connection or shard
```

This seam must be protected now, even if per-tenant databases are never used.

It is cheap insurance.

---

# 11. Authentication Architecture

## 11.1 Supabase Auth and Prisma User

Supabase Auth owns authentication identity.

Prisma owns platform user identity and organization membership.

```txt
Supabase auth.users.id
  =
Prisma User.id
```

This mapping allows the system to resolve a Supabase session into a OneDayOS user.

---

## 11.2 Registration seam

Registration must create Supabase Auth and Prisma records in one logical flow.

The client must not call `supabase.auth.signUp` directly and then hope a separate process creates Prisma records.

Correct flow:

```txt
Client submits registration
  ↓
/api/kernel/auth/register
  ↓
Supabase admin creates auth user
  ↓
Prisma transaction creates Organization, User, Subscription
  ↓
On Prisma failure, Supabase auth user is rolled back
```

This prevents orphaned auth users.

---

## 11.3 Page auth vs API auth

OneDayOS needs two different auth helpers.

Page helper:

```ts
sdk.auth.requireAuth()
```

Behavior:

```txt
Unauthenticated page request → redirect to /login
```

API helper:

```ts
sdk.auth.requireApiAuth()
```

Behavior:

```txt
Unauthenticated API request → 401 JSON
```

These must not be confused.

Using a redirect helper inside an API route is an architectural bug.

---

# 12. Authorization Architecture

## 12.1 RBAC foundation

Current permission model:

```txt
User
  has many UserRole
Role
  has many Permission
Permission
  module
  action
  resource optional
  conditions future
```

Actions include:

```txt
create
read
update
delete
approve
```

Modules include:

```txt
kernel
inventory
hr
crm
purchasing
expenses
assets
visitors
incidents
*
```

Wildcard module/action support is allowed for admin-style roles.

---

## 12.2 Permission checks are mandatory in APIs and services

UI permission checks are not security.

They improve usability only.

The real enforcement must happen in:

```txt
API routes
service methods
server actions, if used
```

Every mutation must answer:

```txt
Is this user allowed to perform this action in this organization?
```

Recommended helper:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  action: 'create',
  resource: 'stock_adjustment',
})
```

If denied:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

---

## 12.3 Authorization must be tenant-scoped

A permission is not valid outside the user’s organization.

Wrong:

```txt
User has inventory.read somewhere, therefore can read inventory everywhere.
```

Correct:

```txt
User has inventory.read through a role scoped to orgId.
User may read only inventory data for that same orgId.
```

Permission checks must include `orgId`.

---

# 13. Data Architecture

## 13.1 Shared database, shared tables

OneDayOS uses shared database tables because:

- it lowers operational cost,
- it simplifies deployments,
- it supports one-day delivery,
- it avoids per-client code branches,
- it matches the early-stage commercial model.

The cost is that tenant isolation must be enforced rigorously.

---

## 13.2 Tenant-scoped table rule

Every tenant-owned table must include:

```txt
orgId
```

Examples:

```txt
users.orgId
employees.orgId
products.orgId
customers.orgId
warehouses.orgId
inventory_stock_movements.orgId
leave_requests.orgId
```

Non-tenant-scoped global tables must be explicitly justified.

---

## 13.3 Soft-delete convention

Business records should use:

```txt
deletedAt DateTime?
deletedBy String?
```

`isActive` must not be used as a substitute for deletion.

Use:

```txt
isActive = business status
```

Examples:

```txt
Employee.isActive = still employed
Organization.isActive = account active
```

Use:

```txt
deletedAt = record hidden/deleted from normal operations
```

Soft-delete coverage must be tested and documented carefully because ORM extensions may not cover every query path.

---

## 13.4 Data validation

All external input must be validated with Zod before reaching services.

```txt
Client form validation is helpful.
Server validation is mandatory.
```

Validation errors must use the platform API response contract.

---

## 13.5 Migration authority

Prisma is the schema migration authority.

Forbidden:

```txt
Manual database schema edits in Supabase dashboard
Untracked SQL changes
Ad hoc production changes without migration file
```

Every schema change must be repeatable from a fresh clone.

---

# 14. SDK Architecture

## 14.1 SDK purpose

The SDK is the public API surface of OneDayOS for business modules.

It exists to:

- hide Kernel internals,
- protect future refactors,
- enforce tenancy conventions,
- enforce permission conventions,
- centralize event access,
- prepare for future database routing,
- support AI and generator-driven development.

---

## 14.2 Current SDK surface

The SDK should expose or eventually expose:

```ts
sdk.auth
sdk.permissions
sdk.events
sdk.getDb
sdk.modules
sdk.organizations
sdk.users
sdk.settings
sdk.forms      // future
sdk.tables     // future
sdk.search     // future
sdk.ai         // future
```

The SDK must not become a random convenience export file.

Every new SDK capability requires an explicit reason and should be documented.

---

## 14.3 SDK backward compatibility

Once modules rely on an SDK method, changing it becomes a platform compatibility issue.

Therefore:

```txt
Adding SDK methods is easy.
Removing SDK methods requires migration.
Changing SDK method behavior requires review.
Changing SDK method signatures requires compatibility planning.
```

This matters because future modules may be generated, sold, reused, or marketplace-distributed.

---

# 15. Module Architecture

## 15.1 Module as package

Each module must have a consistent package shape.

Expected shape:

```txt
src/modules/[module]/
  manifest.ts
  schema.ts
  service.ts
  permissions.ts
  events.ts
  ai-context.ts
  docs.md
  __tests__/
```

Route and UI files may live in the Next.js app directory, but the module’s core business logic belongs under `src/modules/[module]`.

---

## 15.2 Module manifest

Every module must provide a manifest.

The manifest describes:

- identity,
- label,
- version,
- kernel compatibility,
- dependencies,
- permissions,
- navigation,
- events emitted,
- events listened to,
- dashboard widgets future,
- field metadata future,
- AI context,
- seed behavior.

The module registry and sidebar must be driven by manifest + organization configuration, not hard-coded navigation.

---

## 15.3 Module-owned data

A module may own data specific to its business domain.

Inventory may own:

```txt
StockBalance
StockMovement
InventoryAdjustment
ReorderRule
```

Leave may own:

```txt
LeaveRequest
LeaveType
LeaveBalance
```

CRM may own:

```txt
Deal
Pipeline
Activity
LeadSource
```

But modules must reference shared Business Objects instead of copying them.

---

## 15.4 Module-generated code must be secure by default

The Module Builder CLI must not generate insecure placeholders.

Generated code must not:

- accept `orgId` from the client,
- call raw Prisma from module code,
- skip permission checks,
- skip tenant scoping,
- use page redirect auth helpers in APIs,
- hard-delete business records by default,
- omit event emission for mutations,
- create generic admin UI inconsistent with the design system.

The generator should be treated as a product surface, not a helper script.

---

# 16. Event Architecture

## 16.1 Event bus purpose

The event bus allows modules and future Platform Services to react to changes without direct imports.

Example:

```txt
Inventory creates stock movement
  ↓ emits inventory.stock_movement.created
Audit service records event
Search service updates index
Notification service alerts subscribed users
AI context service updates embeddings future
Analytics service updates metrics future
```

Inventory should not know who listens.

---

## 16.2 Event naming

Events must follow:

```txt
{module}.{entity}.{past_tense_verb}
```

Examples:

```txt
inventory.product.created
inventory.stock_movement.created
leave.leave_request.approved
crm.customer.converted
purchasing.purchase_request.submitted
hr.employee.deactivated
```

Wrong:

```txt
productCreated
inventoryProductCreate
onProductCreate
inv.prod.new
```

A wrong event name is equivalent to a broken API contract.

---

## 16.3 Event payloads

Events should eventually have schemas.

Minimum event payload should include:

```ts
type PlatformEventPayload = {
  orgId: string
  actorId?: string
  entityId: string
  entityType: string
  occurredAt: string
  data?: Record<string, unknown>
}
```

Do not include sensitive data in event payloads unless the event contract explicitly allows it.

---

## 16.4 In-process now, durable later

The current event bus may be in-process.

That is acceptable for MVP.

Future evolution:

```txt
In-process EventBus
  → durable event table
  → background job queue
  → retryable asynchronous handlers
```

Callers should not change when the internal implementation changes.

That is why modules access events through `sdk.events`.

---

# 17. Platform Service Promotion Architecture

## 17.1 What qualifies as a Platform Service

A capability qualifies as a Platform Service when:

```txt
1. at least three independent modules or use cases need it,
2. the repeated behavior is materially similar,
3. a shared interface can be designed without distorting module workflows,
4. the operational cost is justified,
5. the abstraction improves delivery speed or consistency.
```

---

## 17.2 Examples

### Approval Engine

Do not build because Leave might need approvals.

Build when evidence appears from multiple modules such as:

```txt
Leave request approval
Purchase request approval
Expense claim approval
Asset disposal approval
```

### Notification Engine

Do not build because notifications sound useful.

Build when multiple modules need consistent notification delivery.

### Attachment Service

Do not build until multiple modules need files.

Possible demand:

```txt
Incident photos
Expense receipts
Purchase quotations
Employee documents
```

---

## 17.3 Promotion process

When a capability appears reusable:

```txt
1. Keep first implementation inside the module.
2. Keep second implementation inside the module unless very obviously identical.
3. At third independent need, write a Platform Service proposal.
4. Review common behavior and differences.
5. Extract only the common core.
6. Leave module-specific policy inside modules.
7. Add SDK/service interface.
8. Add migration path for existing module implementations.
```

---

# 18. UI and Design Architecture

## 18.1 Design system as platform layer

The design system is not decoration.

It is a platform capability that ensures every module feels like OneDayOS.

Without a frozen design system, every generated module will recreate generic admin UI.

---

## 18.2 UI ownership

UI should be organized as:

```txt
components/ui
  low-level shadcn-style primitives

components/kernel
  app shell, layout, platform navigation, shared table patterns

components/platform
  future reusable platform service components

modules/[module]/components
  module-specific components only
```

Module components may compose platform components.

They must not redefine base UI patterns.

---

## 18.3 Design invariants

Every screen should be:

- minimal,
- premium,
- fast,
- data-dense where appropriate,
- keyboard-friendly,
- consistent,
- responsive,
- accessible,
- and visually distinct from a generic admin dashboard.

Every module should inherit:

- table standards,
- form standards,
- empty states,
- loading states,
- error states,
- page layout rules,
- action placement rules,
- typography and spacing rules.

---

# 19. AI Architecture

## 19.1 AI-assisted development

Claude Code and other coding agents are implementers, not architects.

They should implement frozen manual documents.

They should not decide:

- new layer boundaries,
- new SDK conventions,
- new module communication patterns,
- new service abstractions,
- new security behavior,
- or new design direction.

If the manual is ambiguous, the AI agent should stop and report ambiguity.

---

## 19.2 AI product layer

User-facing AI should eventually operate through the same platform architecture.

AI must be:

- tenant-scoped,
- permission-aware,
- module-context-aware,
- auditable for sensitive actions,
- safe from cross-tenant data leakage,
- unable to bypass normal service permissions.

AI is not a shortcut around architecture.

AI is a consumer of architecture.

---

## 19.3 Module AI context

Every module should eventually describe itself for AI through metadata.

This may include:

```txt
module purpose
business objects used
entities owned
common user questions
supported actions
forbidden actions
query examples
workflow descriptions
```

This prepares OneDayOS for AI support, AI reporting, and AI-assisted configuration.

---

# 20. API Architecture

## 20.1 Response contract

Every API route must return:

```json
{
  "data": {},
  "error": null
}
```

or:

```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

String-only errors may exist in early MVP code, but the manual should move toward structured errors.

---

## 20.2 Standard API statuses

```txt
200 OK                  successful read/update/delete
201 Created             successful create
400 Bad Request          invalid input
401 Unauthorized         unauthenticated
403 Forbidden            authenticated but not allowed
404 Not Found            missing resource or inaccessible resource
409 Conflict             duplicate or invalid state transition
422 Unprocessable Entity semantic validation failure
500 Internal Error       unexpected server failure
```

---

## 20.3 API route responsibilities

API routes should:

- authenticate,
- resolve organization context,
- enforce permissions,
- validate input,
- call services,
- map errors to API response shape.

API routes should not contain complex business logic.

Business logic belongs in services.

---

# 21. Routing Architecture

## 21.1 Route structure

Expected high-level route structure:

```txt
/(auth)
  /login
  /register

/(platform)
  /[orgSlug]
    /dashboard
    /settings
    /employees
    /[module]
    /[module]/new
    /[module]/[id]

/api/kernel
  /auth/register
  /users
  /orgs
  /...

/api/orgs/[orgSlug]/[moduleId]
  tenant-scoped module-owned API routes
```

---

## 21.2 Organization slug routing

`orgSlug` is a URL identifier.

It must resolve to an Organization.

It must not be trusted by itself.

The route must verify that the authenticated user belongs to the organization represented by the slug.

---

## 21.3 Active navigation

Sidebar active-state matching must avoid unsafe prefix matching.

Wrong:

```ts
pathname.startsWith(href)
```

Problem:

```txt
/inventory also matches /inventory-audit
```

Correct behavior should match exact route or segment-aware descendants.

This belongs in the design/layout implementation document, but the architectural risk is recorded here.

---

# 22. Configuration Architecture

## 22.1 Settings

Settings should be stored as tenant-scoped data.

Expected model:

```txt
Setting
  orgId
  module
  key
  value Json
```

Settings may be:

- Kernel settings,
- module settings,
- future Platform Service settings,
- future AI settings,
- future design/theme settings.

Settings must be validated by schemas.

---

## 22.2 Feature flags and enabled modules

Enabled modules are organization-scoped.

Expected model:

```txt
OrgModule
  orgId
  moduleId
  isEnabled
```

The sidebar, module routes, and module access checks must all respect `OrgModule`.

A disabled module must be inaccessible, not merely hidden.

---

## 22.3 Subscriptions and plan limits

Subscription records define commercial limits.

Examples:

```txt
plan
status
maxUsers
maxModules
storageGb
trialEndsAt
renewsAt
```

Plan enforcement should be centralized in Kernel/SDK helpers, not scattered across modules.

---

# 23. Testing Architecture

## 23.1 Tests protect architecture

Tests are not only for business logic.

They must protect architectural rules.

Important test categories:

```txt
Tenant isolation tests
Permission enforcement tests
API response contract tests
Forbidden import tests
SDK contract tests
Module generator tests
Event emission tests
Soft-delete tests
Route guard tests
Design-system smoke tests
```

---

## 23.2 Security regression tests

Known risks must become regression tests.

Required examples:

```txt
Unauthenticated API request returns 401 JSON
Authenticated user from Org A cannot access Org B page
Authenticated user from Org A cannot read Org B API records
Authenticated user from Org A cannot mutate Org B API records
Authenticated but unauthorized user receives 403 JSON
Client-supplied orgId is ignored or rejected
Wildcard admin permission works
Staff without permission is denied
```

---

## 23.3 Generator tests

If a generator creates module code, tests must verify the generated code follows architecture.

The generator should be tested for:

- correct file output,
- SDK-only imports,
- no raw Kernel imports,
- tenant-safe API skeletons,
- permission enforcement placeholders or implementation,
- JSON API error behavior,
- event naming convention,
- generated test skeletons.

---

# 24. Deployment Architecture

## 24.1 Current deployment model

Current intended model:

```txt
GitHub repository
  ↓
Vercel deployment
  ↓
Supabase Postgres + Auth
  ↓
OneDayOS app serves multiple organizations
```

This matches the early business model because it minimizes operational complexity.

---

## 24.2 Environment separation

The platform should support:

```txt
local
preview
staging
production
```

At minimum, production data must be separate from development data.

No local or preview environment may point accidentally to production writable credentials.

---

## 24.3 AppCare implications

Because AppCare includes hosting, monitoring, security updates, backups, bug fixes, AI support, and maintenance, architecture must support low-friction operations.

This means:

- repeatable deployments,
- repeatable migrations,
- centralized logs,
- backup/restore plan,
- predictable error handling,
- no per-client code forks,
- minimal manual production changes.

---

# 25. Current MVP Reconciliation

The current MVP kernel implementation is a useful foundation, but it is not yet the final architecture.

This manual treats current code as evidence, not doctrine.

Known current-state realities:

```txt
Kernel MVP exists.
SDK exists.
Module registry exists.
Event bus exists.
Business Object schema exists.
Module builder exists.
Tests/build reportedly pass.
Live migration and seed still need real Postgres verification.
Tenant isolation is not yet production-safe.
Permission checks exist but are not enforced everywhere.
API auth behavior still needs JSON-safe helpers.
Soft-delete coverage has known limitations.
```

Therefore, the architecture allows continued manual writing but blocks production multi-tenant rollout and official module expansion until security stabilization is complete.

---

# 26. Immediate Architecture Risks

## 26.1 Critical — Tenant isolation incomplete

Risk:

```txt
A logged-in user may access another organization route by guessing orgSlug.
```

Required resolution:

```txt
Add org membership guard for pages.
Add API org context resolver.
Add cross-tenant tests.
Block second tenant until fixed.
```

---

## 26.2 Critical — Permission system not fully enforced

Risk:

```txt
Permissions exist in the database and helper layer, but routes/services may not call them.
```

Required resolution:

```txt
Add sdk.permissions.require().
Require permission checks in APIs and sensitive services.
Add tests for denied users.
Update generator to include permission enforcement.
```

---

## 26.3 High — API auth redirects instead of JSON

Risk:

```txt
API routes using page auth helpers return redirects/HTML instead of JSON 401.
```

Required resolution:

```txt
Add requireApiAuth().
Add requireApiOrgContext().
Standardize API error contract.
Add tests.
```

---

## 26.4 High — Module generator can spread bad patterns

Risk:

```txt
If the generator creates insecure routes, every future module inherits the issue.
```

Required resolution:

```txt
Write generator safety rails.
Fix generator output before using it for official modules.
Test generated output.
```

---

## 26.5 High — Design system not frozen

Risk:

```txt
Generated modules may inherit generic admin/dashboard UI.
```

Required resolution:

```txt
Freeze design vision, layout, table, form, empty/loading/error states before official Inventory UI.
```

---

# 27. Architecture Invariants

The following rules must remain true unless changed by ADR.

## 27.1 Platform invariants

```txt
OneDayOS is one platform, not many apps.
Customers buy OneDayOS plus modules.
No per-client forks by default.
Configuration is preferred over customization.
```

## 27.2 Tenancy invariants

```txt
Organization is the tenant.
Tenant data is scoped by orgId.
Never trust client-supplied orgId.
No second tenant until tenant isolation tests pass.
```

## 27.3 SDK invariants

```txt
Modules import from @/sdk.
Modules do not import @/kernel/*.
Modules do not import other modules.
sdk.getDb(ctx) is the database seam.
```

## 27.4 Business Object invariants

```txt
Shared entities are not module-owned.
Business Objects remain minimal.
Module-specific fields use extension tables.
Business Object mutations emit events.
```

## 27.5 Module invariants

```txt
Every module has a manifest.
Every module declares permissions.
Every module declares emitted/listened events.
Every module has tests.
Every module is tenant-scoped.
Every module uses platform UI standards.
```

## 27.6 Platform Service invariants

```txt
Platform Services require evidence.
Three independent use cases trigger review.
Do not build reusable engines from imagination.
Keep first implementation module-local when uncertain.
```

## 27.7 API invariants

```txt
Every API returns { data, error }.
Unauthenticated API returns 401 JSON.
Unauthorized API returns 403 JSON.
Input is validated server-side.
Mutations emit events where required.
```

---

# 28. Architecture Decision Records Required

The following ADRs should be created or confirmed after this document is reviewed:

```txt
ADR-0001: One shared database with org_id tenancy.
ADR-0002: Business Objects are conceptually separate but physically colocated for MVP.
ADR-0003: Modules may import only from @/sdk for platform capabilities.
ADR-0004: Modules must not import other modules; use events.
ADR-0005: Platform Services require Three Client Rule evidence.
ADR-0006: Dynamic Forms and Dynamic CRUD are deferred until repeated module patterns exist.
ADR-0007: RLS is deferred to Phase 1.5 as defense-in-depth, not a replacement for app-level isolation.
ADR-0008: API routes require JSON-safe auth helpers, separate from page redirect helpers.
```

---

# 29. Implementation Gates Created by This Architecture

## 29.1 Manual Foundation Gate

Before more broad implementation:

```txt
[ ] Roadmap frozen
[ ] Vision approved/frozen
[ ] System Architecture approved/frozen
[ ] Layer Boundaries approved/frozen
[ ] Dependency Rules approved/frozen
[ ] Production Readiness Gate approved/frozen
```

---

## 29.2 Security Stabilization Gate

Before onboarding a second tenant:

```txt
[ ] requireApiAuth implemented
[ ] requireOrgContext implemented for pages
[ ] requireApiOrgContext implemented for APIs
[ ] org membership check enforced
[ ] client-supplied orgId rejected/ignored
[ ] sdk.permissions.require implemented
[ ] API permission enforcement added
[ ] service permission/context pattern added
[ ] cross-tenant read tests pass
[ ] cross-tenant write tests pass
[ ] 401/403 JSON tests pass
```

---

## 29.3 Design System Gate

Before official Inventory UI:

```txt
[ ] Design Vision frozen
[ ] Brand System frozen
[ ] Layout System frozen
[ ] Table Standards frozen
[ ] Form Standards frozen
[ ] Empty/Loading/Error States frozen
[ ] Interaction Standards frozen
```

---

## 29.4 Module System Gate

Before official module implementation:

```txt
[ ] SDK Public API frozen
[ ] Module Manifest frozen
[ ] Module Folder Contract frozen
[ ] Module Permission Contract frozen
[ ] Module Event Contract frozen
[ ] Generator Safety Rails frozen
```

---

# 30. Non-Goals

This architecture intentionally does not require immediately building:

- multi-org user membership,
- database-per-tenant routing,
- PostgreSQL RLS,
- marketplace packaging,
- workflow engine,
- approval engine,
- notification engine,
- dynamic form engine,
- dynamic CRUD engine,
- background jobs,
- custom client theme editor,
- analytics warehouse,
- offline mode,
- mobile app,
- plugin marketplace.

These may become important later.

They should not be built before evidence and sequencing justify them.

---

# 31. What Claude Code May Decide

Claude Code may decide:

- local variable names,
- small internal helper functions,
- test names,
- component decomposition inside a frozen design pattern,
- implementation details that do not cross architecture boundaries,
- minor refactors inside the requested subsystem.

Claude Code may not decide:

- new architecture layers,
- whether modules can import Kernel internals,
- whether to skip permission checks,
- whether to accept client-supplied orgId,
- whether to add Platform Services early,
- whether to create duplicate Business Objects,
- whether to add new third-party infrastructure,
- whether to change API response shape,
- whether to generate generic SaaS UI patterns,
- whether to bypass the Engineering Manual.

If Claude encounters ambiguity, it must stop and report the ambiguity.

---

# 32. Acceptance Criteria for This Document

This document is ready to freeze when the founder and architect agree that it clearly answers:

```txt
[ ] What is the master OneDayOS architecture?
[ ] What belongs in Kernel?
[ ] What are Business Objects?
[ ] Why are Business Objects conceptually separate from Kernel?
[ ] What belongs in Platform Services?
[ ] What belongs in Business Modules?
[ ] What belongs in Client Configuration?
[ ] How do modules communicate?
[ ] How does tenancy work?
[ ] Why must modules use the SDK?
[ ] What are the forbidden dependency directions?
[ ] What are the current MVP exceptions?
[ ] Which risks block production or second tenant onboarding?
[ ] What must Claude Code follow?
```

If any answer is unclear, this document should remain Draft.

---

# 33. Next Documents

After this document is approved, the next documents should be:

```txt
02-architecture/01-layer-boundaries.md
02-architecture/05-dependency-rules.md
13-security/08-production-readiness-gate.md
04-kernel/04-authorization-enforcement.md
```

Recommended order:

```txt
1. Layer Boundaries
2. Dependency Rules
3. Production Readiness Gate
4. Authorization Enforcement
5. Security Stabilization Patch Specification
```

This sequence turns the architecture into enforceable implementation work.

---

# 34. Final Architectural Position

OneDayOS should be built like a real operating platform from the beginning, but not like an enterprise product bloated with premature services.

The correct balance is:

```txt
Strict boundaries
Lean Kernel
Shared Business Objects
SDK-only module access
Evidence-based Platform Services
Metadata-ready design
Security before tenant scale
Design system before official modules
Generator safety before rapid module creation
```

The architecture should make the right thing easy and the wrong thing difficult.

That is how OneDayOS can eventually deliver internal business software in one day without becoming a graveyard of custom applications.
