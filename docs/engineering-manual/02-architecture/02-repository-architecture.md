# OneDayOS Engineering Manual — 02 Architecture — 02 Repository Architecture

**Document ID:** `02-architecture/02-repository-architecture.md`  
**Version:** `1.0`  
**Status:** Frozen  
**Owner:** OneDayOS Founder / Lead Architect  
**Author:** ChatGPT, acting as founding software architect  
**Last Updated:** July 2026  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  
**Depends On:**

- `01-foundation/00-vision.md`
- `01-foundation/02-product-principles.md`
- `01-foundation/03-platform-vs-modules.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `06-data/00-database-architecture.md`
- `08-module-system/03-module-folder-contract.md`
- `09-cli-generators/06-generator-safety-rails.md`
- `13-security/08-production-readiness-gate.md`
- `14-testing-quality/08-ci-quality-gates.md`

---

# 1. Purpose

This document defines the physical repository architecture for the restarted OneDayOS platform build.

It answers:

```txt
Where should files live?
What may import what?
Where does Claude create new code?
Where do generators write files?
Where do Kernel, SDK, Business Objects, modules, UI, tests, scripts, and docs belong?
```

The goal is not merely to make the folder tree look clean.

The goal is to make the architecture difficult to violate.

OneDayOS will rely heavily on Claude Code, generators, reusable modules, shared Business Objects, and a shared multi-tenant database. That means the repository must be organized so the correct architecture is the easiest path.

A weak repository structure causes predictable failures:

```txt
modules import Kernel internals
modules import other modules
raw Prisma appears everywhere
client components import server-only code
Business Objects get duplicated inside modules
Platform Services get hidden inside modules
client-specific folders appear
API routes use inconsistent paths
features bypass tenant isolation
Claude invents folder structure repeatedly
```

This document prevents those failures.

---

# 2. Core Rule

The repository must express the architecture.

The conceptual architecture remains:

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

The physical codebase must make these boundaries visible.

The highest-value rule is:

```txt
Business modules may import from the SDK and approved shared UI utilities.
Business modules may not import Kernel internals, raw Prisma, or other modules.
```

This is not a style preference.

It is the mechanism that keeps OneDayOS from becoming a collection of tightly coupled client apps.

---

# 3. Repository Design Principles

## 3.1 One repository for the core platform

For MVP and normal clients, OneDayOS should use:

```txt
one application repository
one Vercel project for production
one shared Supabase production project
one shared PostgreSQL database
many OneDayOS tenant organizations
```

Normal clients do not get separate repositories.

A client is represented by an `Organization` row, module enablement, settings, roles, permissions, and data.

A client is not represented by:

```txt
client-acme/
client-bobs-hardware/
client-custom-code/
apps/client-a/
apps/client-b/
```

Client-specific source-code folders are forbidden for normal delivery.

## 3.2 Architecture before convenience

Claude must not place files wherever implementation feels easiest.

Examples of bad convenience:

```txt
Put a helper in src/lib because it is quick.
Import Prisma directly inside a module because it works.
Put Product fields in Inventory because Inventory is the first module.
Create a custom client folder because this client is special.
Put notification code inside Leave because Leave needs it today.
```

The repository should force each file to answer:

```txt
Is this Kernel?
Is this SDK?
Is this a Business Object?
Is this a Platform Service?
Is this a Business Module?
Is this UI-only?
Is this client configuration?
Is this a script?
Is this documentation?
```

If the answer is unclear, Claude must stop and ask for architecture review.

## 3.3 Server/client boundaries must be visible

OneDayOS uses Next.js App Router.

This makes server/client boundaries easy to violate if the repository is not strict.

The codebase must clearly distinguish:

```txt
browser-safe code
server-only code
shared type-only code
React Server Components
React Client Components
API route handlers
Prisma/database code
Supabase server auth code
Supabase browser auth code
```

A client component must never accidentally import:

```txt
raw Prisma
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
@/sdk/server
@/kernel/*
server-only module services
```

## 3.4 Generated code must land in predictable places

Generators are architecture enforcement tools.

The Module Generator should not need to think.

Claude should not need to choose folder layout.

The repository must make generator output deterministic.

Every module should have the same shape.
Every module page should have predictable routes.
Every module API should have predictable routes.
Every module test should live in predictable locations.

## 3.5 The repository should support future growth without early overengineering

This is not a monorepo with many apps yet.

Do not start with:

```txt
apps/web
apps/api
packages/kernel
packages/ui
packages/sdk
packages/modules
```

That may become useful later, but it is too much for the restarted MVP.

The correct MVP shape is a single Next.js app with strong internal boundaries.

Future extraction into packages is possible if the boundaries are clean now.

---

# 4. Target Repository Tree

The restarted build should use this target structure:

```txt
onedayos-platform/
  .github/
    workflows/
      ci.yml

  docs/
    engineering-manual/
      00-meta/
      01-foundation/
      02-architecture/
      03-design-system/
      04-kernel/
      05-sdk/
      06-data/
      07-business-objects/
      08-module-system/
      09-cli-generators/
      10-platform-services/
      11-dynamic-systems/
      12-ai-layer/
      13-security/
      14-testing-quality/
      15-deployment-operations/
      16-client-delivery/
      17-module-specifications/
    adr/
    founder-guide/

  prisma/
    schema.prisma
    migrations/
    seed.ts
    seed-demo.ts

  scripts/
    create-module.ts
    check-architecture.ts
    check-generated.ts
    provision-org.ts
    data-repair/

  src/
    app/
      (auth)/
      (platform)/
      api/
      globals.css
      layout.tsx
      not-found.tsx
      error.tsx

    kernel/
      auth/
      context/
      db/
      errors/
      modules/
      organizations/
      permissions/
      settings/
      subscriptions/
      users/
      events/
      routing/

    sdk/
      index.ts
      types.ts
      errors.ts
      constants.ts
      server/
      client/

    business-objects/
      employees/
      products/
      customers/
      suppliers/
      warehouses/
      index.ts

    platform-services/
      README.md
      audit-log/
      notifications/
      approvals/
      comments/
      attachments/
      activity-feed/
      reporting/
      search/
      background-jobs/

    modules/
      index.ts
      inventory/
      leave/
      crm/
      purchasing/
      expenses/
      assets/
      visitors/
      incidents/

    components/
      ui/
      onedayos/
      layout/
      data-table/
      forms/
      empty-states/
      feedback/
      icons/

    lib/
      utils.ts
      format.ts
      dates.ts
      currency.ts
      ids.ts

    config/
      env.server.ts
      env.client.ts
      app.ts
      routes.ts

    test/
      fixtures/
      helpers/
      mocks/
      architecture/

  .env.example
  components.json
  next.config.ts
  package.json
  prisma.config.ts
  tsconfig.json
  vitest.config.ts
  vitest.setup.ts
```

This is the desired repository shape for the restarted foundation build.

Not every folder must contain complete functionality immediately.

But the folders should exist where they represent approved architecture.

Deferred systems may have only a `README.md` or placeholder contract folder until implementation is approved.

---

# 5. Top-Level Directory Responsibilities

## 5.1 `.github/`

Contains CI and repository automation.

Allowed:

```txt
GitHub Actions workflows
pull request checks
architecture check commands
build/test/typecheck workflows
```

Forbidden:

```txt
production secrets committed in workflow files
manual production migration commands embedded casually
client-specific CI pipelines
FastAPI/Python backend CI for core platform
```

Production database migrations should eventually run through a controlled workflow, not through Vercel build and not from a random laptop.

## 5.2 `docs/`

Contains the Engineering Manual, ADRs, and founder/operator documentation.

Allowed:

```txt
engineering-manual/
adr/
founder-guide/
client-facing templates
runbooks
```

Forbidden:

```txt
secrets
client confidential data
raw production logs
unreviewed architecture decisions hidden in random docs
```

The Engineering Manual is the source of truth after documents are reviewed and frozen.

The Founder Guide should explain operations in plain language, but it should not override engineering documents.

## 5.3 `prisma/`

Contains schema, migrations, and controlled seed scripts.

Allowed:

```txt
schema.prisma
migrations/
seed.ts
seed-demo.ts
```

Forbidden:

```txt
per-client schema files
manual SQL schema drift outside migrations
module-specific migration systems
Alembic
SQLAlchemy
FastAPI database models
production data dumps
```

Prisma is the schema and migration authority.

Supabase is the PostgreSQL host, not the place for casual manual schema editing.

## 5.4 `scripts/`

Contains developer/operator scripts.

Allowed:

```txt
module generator
architecture checks
generated-code checks
org provisioning scripts
controlled data-repair scripts
safe local utilities
```

Forbidden:

```txt
scripts that require production credentials by default
scripts that accept client-supplied orgId from unsafe sources
scripts that bypass PlatformContext without explicit operator approval
scripts that mutate production without dry-run and confirmation
per-client one-off scripts committed as permanent architecture
```

Scripts are powerful because they may bypass normal UI/API flows.

Therefore, scripts must be treated as operational code.

## 5.5 `src/`

Contains the application source code.

The rest of this document focuses mainly on `src/` because this is where most architecture drift happens.

---

# 6. `src/app` — Next.js App Router

`src/app` owns routes, layouts, pages, route handlers, and global app files.

It should not own business logic.

It should not contain raw domain services.

It should orchestrate:

```txt
route params
server context creation
API wrappers
page composition
data fetching through services
rendering UI components
```

## 6.1 Target `src/app` structure

```txt
src/app/
  layout.tsx
  globals.css
  not-found.tsx
  error.tsx

  (auth)/
    layout.tsx
    login/
      page.tsx
    register/
      page.tsx
    forgot-password/
      page.tsx
    reset-password/
      page.tsx

  (platform)/
    [orgSlug]/
      layout.tsx
      dashboard/
        page.tsx
      objects/
        employees/
          page.tsx
          new/
            page.tsx
          [employeeId]/
            page.tsx
            edit/
              page.tsx
        products/
        customers/
        suppliers/
        warehouses/
      settings/
        page.tsx
        users/
          page.tsx
        roles/
          page.tsx
        modules/
          page.tsx
      inventory/
      leave/
      crm/
      purchasing/
      expenses/
      assets/
      visitors/
      incidents/

  api/
    kernel/
      auth/
        register/
          route.ts
        me/
          route.ts
        logout/
          route.ts
      orgs/
        route.ts
      settings/
        route.ts
    orgs/
      [orgSlug]/
        objects/
          employees/
            route.ts
            [employeeId]/
              route.ts
          products/
          customers/
          suppliers/
          warehouses/
        inventory/
        leave/
        crm/
        purchasing/
        expenses/
        assets/
        visitors/
        incidents/
```

## 6.2 Auth routes

Auth pages belong under:

```txt
src/app/(auth)/...
```

Auth route handlers belong under:

```txt
src/app/api/kernel/auth/...
```

The login page may use the browser Supabase auth client for sign-in.

Registration must be server-owned.

The client must not call `supabase.auth.signUp()` directly for OneDayOS organization creation.

## 6.3 Platform routes

Authenticated tenant routes belong under:

```txt
src/app/(platform)/[orgSlug]/...
```

The `[orgSlug]` layout is responsible for creating tenant context.

The route segment `orgSlug` is a locator only.

It does not authorize access.

The layout must verify:

```txt
authenticated session
Prisma User exists
Organization exists
user.orgId === organization.id
organization active/suspended status
```

The layout may then produce a verified `PlatformContext` for server-side usage.

## 6.4 API routes

Tenant APIs must use:

```txt
/api/orgs/[orgSlug]/...
```

Business Object APIs must use:

```txt
/api/orgs/[orgSlug]/objects/[object]
```

Module APIs must use:

```txt
/api/orgs/[orgSlug]/[moduleId]/[resource]
```

Forbidden API route shapes:

```txt
/api/[module]
/api/inventory?orgId=...
/api/products?orgId=...
/api/kernel/users/[id] for current-user lookup
/api/client-a/custom-thing
```

Current-user lookup should use:

```txt
GET /api/kernel/auth/me
```

Not:

```txt
GET /api/kernel/users/[id]
```

## 6.5 App route files must stay thin

Page files and API route files should be thin orchestration layers.

A route handler may:

```txt
validate params
parse request body
create PlatformContext
call permission helper
call a service
return standardized JSON
```

A route handler must not:

```txt
contain complex business workflow logic
write raw Prisma queries directly for modules
trust request body orgId
emit events directly instead of service layer
make direct calls to another module service
return unstructured errors
redirect on API auth failure
```

Business logic belongs in services.

---

# 7. `src/kernel` — Platform Fundamentals

`src/kernel` owns the platform fundamentals required by every module.

Kernel is not a dumping ground.

Kernel exists so that every module can depend on the same platform foundation without knowing how it is implemented.

## 7.1 Target Kernel structure

```txt
src/kernel/
  auth/
    client.ts
    server.ts
    session.ts
    registration.server.ts
    api-auth.server.ts
    __tests__/

  context/
    platform-context.ts
    require-page-context.server.ts
    require-api-context.server.ts
    require-api-module-context.server.ts
    __tests__/

  db/
    client.ts
    transaction.server.ts
    soft-delete.ts
    __tests__/

  errors/
    one-day-error.ts
    api-errors.ts
    error-codes.ts
    __tests__/

  modules/
    types.ts
    registry.server.ts
    loader.server.ts
    enablement.server.ts
    __tests__/

  organizations/
    service.server.ts
    schema.ts
    __tests__/

  permissions/
    constants.ts
    matcher.ts
    service.server.ts
    require-permission.server.ts
    __tests__/

  settings/
    service.server.ts
    schema.ts
    __tests__/

  subscriptions/
    service.server.ts
    schema.ts
    __tests__/

  users/
    service.server.ts
    schema.ts
    __tests__/

  events/
    bus.server.ts
    envelope.ts
    naming.ts
    __tests__/

  routing/
    route-patterns.ts
    active-route.ts
    __tests__/
```

## 7.2 Kernel may contain

Kernel may contain:

```txt
authentication helpers
server/browser Supabase auth clients
PlatformContext creation
organization/tenant primitives
users
roles
permissions
module registry and loader
OrgModule enablement
settings
subscriptions
core API error handling
in-process event bus interface
server-only database client
routing primitives
```

## 7.3 Kernel must not contain

Kernel must not contain:

```txt
inventory workflows
leave workflows
CRM pipelines
expense claims
asset assignment workflows
visitor check-in workflow
incident corrective actions
approval engine implementation before promotion
notification service implementation before promotion
client-specific workflows
module-specific fields on shared objects
```

## 7.4 Kernel import rules

Kernel may import from:

```txt
@/config/server-only config
@/lib pure utilities
Prisma client
Supabase server/browser helpers
Zod
Next.js server APIs where appropriate
```

Kernel should not import from:

```txt
@/modules/*
@/platform-services/* implementations
business module services
client components
```

Kernel must not depend on business modules.

If Kernel imports a business module, the architecture is inverted.

---

# 8. `src/sdk` — Public Platform Interface

The SDK is the supported interface between modules and the platform.

Modules do not consume Kernel directly.

They consume the SDK.

## 8.1 Target SDK structure

```txt
src/sdk/
  index.ts              # shared-safe exports only
  types.ts              # PlatformContext, manifest types, event types
  constants.ts          # shared constants safe for client/server
  errors.ts             # shared error codes/types

  server/
    index.ts            # exports sdk server object
    auth.ts
    context.ts
    permissions.ts
    db.ts
    events.ts
    modules.ts
    settings.ts
    organizations.ts

  client/
    index.ts            # exports sdkClient browser-safe object
    api.ts
    auth.ts
    routes.ts
    optimistic.ts
```

## 8.2 SDK import paths

Approved import paths:

```ts
import type { PlatformContext } from '@/sdk'
import { PERMISSIONS } from '@/sdk'
import { sdk } from '@/sdk/server'
import { sdkClient } from '@/sdk/client'
```

Forbidden import paths in modules:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
import { bus } from '@/kernel/events/bus'
```

## 8.3 Shared SDK root

`@/sdk` must be safe for shared imports.

It may export:

```txt
types
constants
error codes
manifest types
event name types
permission requirement types
```

It must not export:

```txt
Prisma client
server auth helpers
server context helpers
service role clients
DATABASE_URL access
SUPABASE_SERVICE_ROLE_KEY access
server-only SDK object
```

## 8.4 Server SDK

`@/sdk/server` may export the server SDK.

It may access:

```txt
Kernel internals
Prisma
server-only Supabase clients
PlatformContext helpers
permission enforcement
server event bus
module registry
```

Only server files may import it.

Approved server files include:

```txt
API route handlers
server components
server actions if used later
server services
module service files named .server.ts or service.ts when server-only by convention
scripts with explicit approval
```

Client components may not import `@/sdk/server`.

## 8.5 Client SDK

`@/sdk/client` may export browser-safe helpers.

It may contain:

```txt
fetch wrappers
standard API response parsing
optimistic UI helpers
route builders
browser Supabase sign-in helper if appropriate
```

It must not contain:

```txt
Prisma
service role clients
server context helpers
permission enforcement as authority
raw env secrets
```

---

# 9. `src/business-objects` — Shared Business Identity Layer

Business Objects are conceptually separate from Kernel.

They may live physically in the same application repository and Prisma schema, but they are not Kernel internals.

## 9.1 Target Business Object structure

```txt
src/business-objects/
  index.ts

  employees/
    schema.ts
    service.server.ts
    events.ts
    permissions.ts
    api.ts
    __tests__/

  products/
    schema.ts
    service.server.ts
    events.ts
    permissions.ts
    api.ts
    __tests__/

  customers/
    schema.ts
    service.server.ts
    events.ts
    permissions.ts
    api.ts
    __tests__/

  suppliers/
    schema.ts
    service.server.ts
    events.ts
    permissions.ts
    api.ts
    __tests__/

  warehouses/
    schema.ts
    service.server.ts
    events.ts
    permissions.ts
    api.ts
    __tests__/
```

## 9.2 Business Objects included in MVP architecture

The initial shared Business Objects are:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Branch and Department are not Business Objects.

They are Kernel organization-structure primitives.

## 9.3 Business Object API routes

Business Object pages should live under:

```txt
/[orgSlug]/objects/products
/[orgSlug]/objects/customers
/[orgSlug]/objects/employees
/[orgSlug]/objects/suppliers
/[orgSlug]/objects/warehouses
```

Business Object APIs should live under:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/employees
/api/orgs/[orgSlug]/objects/suppliers
/api/orgs/[orgSlug]/objects/warehouses
```

They should not live under module APIs.

Forbidden:

```txt
/api/orgs/[orgSlug]/inventory/products as the canonical product API
/api/orgs/[orgSlug]/crm/customers as the canonical customer API
/api/orgs/[orgSlug]/leave/employees as the canonical employee API
```

Modules may have extension-specific APIs, but shared Business Object identity remains outside modules.

## 9.4 Business Object import rules

Business Object services may import:

```txt
@/sdk/server
@/sdk shared types
@/lib utilities
Business Object local files
```

Business Object services must not import:

```txt
@/modules/*
@/kernel/* directly, except through approved lower-level SDK/internal implementation if explicitly allowed
client components
Platform Service implementations unless the service has been approved and exposed through SDK
```

## 9.5 Business Object events

Business Object events use the `objects` namespace.

Examples:

```txt
objects.product.created
objects.product.updated
objects.product.deleted
objects.customer.created
objects.employee.deactivated
objects.warehouse.reactivated
```

Do not use module namespaces for shared objects.

Forbidden:

```txt
inventory.product.created
crm.customer.created
leave.employee.created
```

---

# 10. `src/platform-services` — Deferred Reusable Capabilities

Platform Services are reusable cross-cutting capabilities that are promoted only after evidence.

They are not part of the restarted foundation implementation unless explicitly approved later.

## 10.1 Target Platform Services structure

```txt
src/platform-services/
  README.md

  audit-log/
    README.md

  notifications/
    README.md

  approvals/
    README.md

  comments/
    README.md

  attachments/
    README.md

  activity-feed/
    README.md

  reporting/
    README.md

  search/
    README.md

  background-jobs/
    README.md
```

During foundation build, most of these folders should contain documentation only.

Do not create tables, APIs, SDK methods, UIs, or background workers for deferred services just because the folders exist.

## 10.2 Platform Service promotion

Before a service implementation appears in this folder, the following must exist:

```txt
Evidence log
Architecture review
ADR if significant
Frozen service specification
Data model
SDK contract
Security model
Testing plan
Implementation package for Claude
```

## 10.3 Platform Service import rules

Platform Services may import:

```txt
@/sdk/server
@/lib utilities
shared types
approved Kernel internals only through SDK/internal service boundaries
```

Platform Services must not import:

```txt
@/modules/*
module services
module UI
client-specific code
```

If a Platform Service imports a business module, it is no longer a platform service.

It has become coupled domain logic.

---

# 11. `src/modules` — Business Modules

Business Modules are self-contained business capability packages.

They are not standalone apps.

They are not client forks.

They are not allowed to own shared Business Objects.

## 11.1 Target module root structure

```txt
src/modules/
  index.ts

  inventory/
    manifest.ts
    permissions.ts
    schema.ts
    types.ts
    service.server.ts
    events.ts
    settings.ts
    navigation.ts
    ai-context.ts
    docs.md
    index.ts
    README.md
    __tests__/

  leave/
  crm/
  purchasing/
  expenses/
  assets/
  visitors/
  incidents/
```

## 11.2 Module barrel

`src/modules/index.ts` is the static list of known module manifests.

Example:

```ts
import { inventoryManifest } from './inventory/manifest'
import { leaveManifest } from './leave/manifest'

export const moduleManifests = [
  inventoryManifest,
  leaveManifest,
] as const
```

Manifests should not self-register as side effects.

The module loader/composition root should register/validate them.

## 11.3 Module may contain

A module may contain:

```txt
manifest
permissions
Zod schemas
module-owned types
module-owned services
module-owned event constants and payload schemas
module-specific settings schema
module navigation metadata
module AI context metadata
module documentation
module tests
module-owned API route implementations through route files in src/app
module-owned UI pages through route files in src/app
```

## 11.4 Module must not contain

A module must not contain:

```txt
duplicate Employee/Product/Customer/Supplier/Warehouse identity tables
raw Prisma singleton imports
Kernel direct imports
other module imports
client-specific code
Platform Service implementations
FastAPI/Python backend files
Supabase service role usage
custom global design-system components
hidden tenant fields
```

## 11.5 Module import rules

Modules may import:

```ts
import type { PlatformContext } from '@/sdk'
import { sdk } from '@/sdk/server'
import { sdkClient } from '@/sdk/client'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/onedayos/data-table'
import { formatCurrency } from '@/lib/format'
```

Modules may import local files:

```ts
import { CreateExpenseSchema } from './schema'
import { EXPENSE_PERMISSIONS } from './permissions'
import { ExpenseService } from './service.server'
```

Modules must not import:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
import { bus } from '@/kernel/events/bus'
import { InventoryService } from '@/modules/inventory/service.server'
import { CustomerService } from '@/business-objects/customers/service.server' // use SDK/object API boundary if needed
```

The last line needs nuance.

A module should generally access Business Objects through approved SDK/service interfaces, not by reaching into object internals casually.

For MVP, if direct imports from `src/business-objects/*/service.server.ts` are temporarily allowed, that exception must be documented and linted narrowly.

The preferred long-term shape is:

```ts
sdk.objects.products.create(ctx, input)
sdk.objects.customers.findById(ctx, customerId)
```

But if `sdk.objects` is not implemented yet, module specifications must state the approved object-service import path.

## 11.6 Module API routes

Module API route files live under `src/app/api/orgs/[orgSlug]/[moduleId]/...`.

The module package contains business logic, not route files.

Example:

```txt
src/modules/inventory/service.server.ts
src/modules/inventory/schema.ts
src/modules/inventory/permissions.ts

src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/route.ts
src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/[id]/route.ts
```

API route files call module services.

Services do the business work.

## 11.7 Module pages

Module page files live under:

```txt
src/app/(platform)/[orgSlug]/[moduleId]/...
```

Example:

```txt
src/app/(platform)/[orgSlug]/inventory/page.tsx
src/app/(platform)/[orgSlug]/inventory/stock-levels/page.tsx
src/app/(platform)/[orgSlug]/inventory/adjustments/page.tsx
```

Client components may live next to pages when they are route-specific:

```txt
src/app/(platform)/[orgSlug]/inventory/stock-levels/stock-levels-client.tsx
```

Reusable module UI components may live inside the module:

```txt
src/modules/inventory/components/stock-status-badge.tsx
```

But module UI components must not become shared design-system components unless promoted deliberately.

---

# 12. `src/components` — UI System

`src/components` contains reusable UI components.

It should not contain business logic.

## 12.1 Target components structure

```txt
src/components/
  ui/
    button.tsx
    input.tsx
    dialog.tsx
    table.tsx
    ...shadcn components

  onedayos/
    page-header.tsx
    section-header.tsx
    data-table.tsx
    form-shell.tsx
    detail-shell.tsx
    status-badge.tsx
    empty-state.tsx
    confirm-dialog.tsx
    toolbar.tsx

  layout/
    app-shell.tsx
    sidebar.tsx
    header.tsx
    breadcrumbs.tsx
    command-menu.tsx

  forms/
    field-label.tsx
    form-section.tsx
    form-actions.tsx
    relation-select.tsx

  data-table/
    data-table.tsx
    table-toolbar.tsx
    table-empty-state.tsx
    table-skeleton.tsx
    row-actions.tsx

  empty-states/
    module-empty-state.tsx
    business-object-empty-state.tsx
    permission-denied-state.tsx
    error-state.tsx

  feedback/
    loading-skeleton.tsx
    optimistic-toast.tsx
    inline-error.tsx

  icons/
    module-icon.tsx
```

## 12.2 `components/ui`

`components/ui` contains shadcn/ui base components.

These should stay low-level.

Do not add business logic here.

Do not add module-specific variants here.

Do not modify shadcn components casually unless the design system requires it.

## 12.3 `components/onedayos`

`components/onedayos` contains OneDayOS product components built on top of shadcn/ui.

Examples:

```txt
OneDayOS DataTable
OneDayOS PageHeader
OneDayOS FormShell
OneDayOS EmptyState
OneDayOS StatusBadge
```

These components express the product design system.

Modules should use these instead of creating their own table/form shell patterns.

## 12.4 Component import rules

UI components may import:

```txt
React
shadcn components
lucide icons
Motion for React where appropriate
@/lib utilities
client-safe SDK helpers if explicitly browser-safe
```

UI components must not import:

```txt
raw Prisma
@/kernel/*
@/sdk/server
server env helpers
module services
business object services
Supabase service role helpers
```

A client component importing server-only code is a critical architecture violation.

---

# 13. `src/lib` — Pure Utilities Only

`src/lib` is for small pure utilities.

It is not a junk drawer.

## 13.1 Allowed in `src/lib`

Allowed:

```txt
cn utility
formatting helpers
date formatting
currency formatting
safe string helpers
ID/slug helpers if pure
number parsing helpers
small type helpers
```

Examples:

```txt
src/lib/utils.ts
src/lib/format.ts
src/lib/dates.ts
src/lib/currency.ts
src/lib/ids.ts
```

## 13.2 Forbidden in `src/lib`

Forbidden:

```txt
Prisma client
Supabase service role client
business services
permission checks
tenant context
module logic
Platform Service logic
large framework abstractions
client-specific helpers
```

If a file in `src/lib` knows about `orgId`, permissions, modules, subscriptions, or tenants, it probably belongs somewhere else.

---

# 14. `src/config` — Configuration Boundaries

`src/config` contains application configuration helpers.

## 14.1 Target config structure

```txt
src/config/
  env.server.ts
  env.client.ts
  app.ts
  routes.ts
```

## 14.2 Server env

`env.server.ts` validates and exports server-only environment variables.

It may include:

```txt
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
SENTRY_AUTH_TOKEN if needed in build only
private provider keys later
```

It must be server-only.

Client components must never import it.

## 14.3 Client env

`env.client.ts` validates and exports browser-safe environment variables.

It may include:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
```

It must not include secrets.

## 14.4 App config

`app.ts` may contain non-secret app constants:

```txt
app name
support email
default plan names
brand constants
```

## 14.5 Route config

`routes.ts` may contain route builders.

Route builders should prevent stringly typed route mistakes.

Example:

```ts
export const routes = {
  orgDashboard: (orgSlug: string) => `/${orgSlug}/dashboard`,
  inventory: (orgSlug: string) => `/${orgSlug}/inventory`,
}
```

But route builders must not encode tenant authorization.

Authorization remains server-side.

---

# 15. `src/test` — Shared Test Infrastructure

Test helpers should be organized because OneDayOS security depends heavily on good fixtures.

## 15.1 Target test structure

```txt
src/test/
  fixtures/
    orgs.ts
    users.ts
    roles.ts
    business-objects.ts
    modules.ts

  helpers/
    create-test-org.ts
    create-test-user.ts
    create-platform-context.ts
    api-test-client.ts
    expect-api-error.ts

  mocks/
    supabase-auth.ts
    next-cookies.ts

  architecture/
    forbidden-imports.ts
    forbidden-patterns.ts
    generated-output.ts
```

## 15.2 Test helpers must not leak into production

Production code must not import from:

```txt
@/test/*
```

Architecture checks should enforce this.

## 15.3 Test fixtures are not seed data

Test fixtures are for automated tests.

Seed data is for local/demo environments.

Client provisioning is for real client setup.

These are separate systems.

Do not mix them.

---

# 16. Naming Conventions

## 16.1 File naming

Use kebab-case for files by default:

```txt
platform-context.ts
require-api-context.server.ts
stock-adjustment-form.tsx
inventory-list-client.tsx
```

React component file names may use kebab-case or PascalCase consistently within a folder.

Preferred for OneDayOS:

```txt
page-header.tsx
form-shell.tsx
stock-status-badge.tsx
```

## 16.2 Server-only files

Server-only files should use `.server.ts` when there is any chance they may be imported incorrectly.

Examples:

```txt
service.server.ts
registry.server.ts
loader.server.ts
api-auth.server.ts
transaction.server.ts
```

This makes server/client boundaries visible.

## 16.3 Client components

Route-local client components should be explicitly named:

```txt
inventory-list-client.tsx
stock-adjustment-form-client.tsx
```

They must begin with:

```ts
'use client'
```

They must not import server-only modules.

## 16.4 Test files

Tests live in `__tests__` folders close to the code they test.

Examples:

```txt
src/kernel/permissions/__tests__/matcher.test.ts
src/modules/inventory/__tests__/service.test.ts
src/app/api/orgs/[orgSlug]/inventory/__tests__/route.test.ts
```

Architecture-level tests may live under:

```txt
src/test/architecture/
```

## 16.5 Module names

Module IDs use lowercase kebab-case:

```txt
inventory
leave
crm
purchasing
expenses
assets
visitors
incidents
fleet
reservations
```

Do not use client-specific module IDs:

```txt
acme-inventory
bobs-custom-crm
jollibee-delivery-special
```

## 16.6 Business Object names

Business Object folders use plural nouns:

```txt
employees
products
customers
suppliers
warehouses
```

Module extension tables should clearly include module namespace:

```txt
InventoryProductExtension
CrmCustomerProfile
PurchasingSupplierProfile
```

---

# 17. Import Boundary Matrix

This matrix is mandatory.

| From | May Import | Must Not Import |
|---|---|---|
| `src/app/(auth)` | `@/sdk/client`, auth UI, client-safe helpers | raw Prisma, service role, module services |
| `src/app/(platform)` server pages | `@/sdk/server`, services, UI components | raw Prisma except approved Kernel pages, client secrets |
| `src/app/api` | `@/sdk/server`, schemas, services | redirect auth helpers, raw unscoped Prisma, client code |
| `src/kernel` | config, Prisma, Supabase, lib | modules, module services, client-specific code |
| `src/sdk/server` | Kernel internals | modules, client components |
| `src/sdk/client` | browser-safe utilities | Kernel, Prisma, server env, service role |
| `src/business-objects` | SDK/server, local schemas, lib | modules, Platform Service internals |
| `src/modules` | SDK, shared UI, lib, local files | Kernel, raw Prisma, other modules |
| `src/platform-services` | SDK/server, lib | modules, client-specific code |
| `src/components` | shadcn, React, lib, client-safe SDK | Kernel, raw Prisma, server SDK |
| `src/lib` | nothing platform-specific | Kernel, modules, Prisma, Supabase service role |
| `src/test` | test helpers, app code under test | production imports from test code |

---

# 18. Forbidden Import Examples

These patterns must be blocked by `npm run check:architecture`.

## 18.1 Modules importing Kernel

Forbidden:

```ts
// inside src/modules/inventory/service.server.ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
```

Allowed:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
```

## 18.2 Modules importing other modules

Forbidden:

```ts
// inside src/modules/purchasing/service.server.ts
import { InventoryService } from '@/modules/inventory/service.server'
```

Allowed:

```txt
Purchasing emits event: purchasing.goods_receipt.posted
Inventory may later listen if integration is approved.
```

## 18.3 Client components importing server code

Forbidden:

```ts
'use client'

import { sdk } from '@/sdk/server'
import { prisma } from '@/kernel/db/client'
```

Allowed:

```ts
'use client'

import { sdkClient } from '@/sdk/client'
```

## 18.4 Raw Prisma in modules

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'

await prisma.product.findUnique({ where: { id } })
```

Allowed:

```ts
const db = sdk.getDb(ctx)
await db.product.findFirst({
  where: {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

## 18.5 Client-supplied tenant identity

Forbidden:

```ts
const { orgId } = await request.json()
const db = sdk.getDb(orgId)
```

Allowed:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const db = sdk.getDb(ctx)
```

---

# 19. API Route File Pattern

Every protected API route should follow the same shape.

Example:

```ts
import { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { CreateStockAdjustmentSchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service.server'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'

export const POST = sdk.api.handle(
  async (req: NextRequest, { params }: { params: Promise<{ orgSlug: string }> }) => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')

    const body = await sdk.api.parseJson(req)
    const input = sdk.validation.parse(CreateStockAdjustmentSchema, body)

    await sdk.permissions.require(ctx, INVENTORY_PERMISSIONS.stockAdjustment.create)

    const result = await InventoryService.createStockAdjustment(ctx, input)

    return sdk.api.created(result)
  }
)
```

The exact API wrapper names may change, but the shape must remain:

```txt
API-safe context
validated input
permission check
service call with PlatformContext
standard JSON response
```

Route handlers must not redirect.

---

# 20. Service File Pattern

Module service files should be server-only.

Example:

```txt
src/modules/inventory/service.server.ts
```

A service method should receive verified `PlatformContext` first:

```ts
export class InventoryService {
  static async createStockAdjustment(
    ctx: PlatformContext,
    input: CreateStockAdjustmentInput
  ) {
    await sdk.permissions.require(ctx, INVENTORY_PERMISSIONS.stockAdjustment.create)

    const db = sdk.getDb(ctx)

    return sdk.db.transaction(ctx, async (tx) => {
      // business logic here
    })
  }
}
```

Forbidden:

```ts
static async createStockAdjustment(orgId: string, input: Input) {}
static async list(userId: string, orgId: string) {}
static async create(input: Input & { orgId: string }) {}
```

Services should not accept loose tenant identity.

---

# 21. Business Object Extension Pattern in Repository

Module-specific Business Object fields belong in the module folder.

Example:

```txt
src/modules/inventory/schema.ts
src/modules/inventory/service.server.ts
```

Prisma model:

```prisma
model InventoryProductExtension {
  id           String   @id @default(cuid())
  orgId        String
  productId    String
  reorderPoint Decimal?
  minimumStock Decimal?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?
  deletedBy    String?

  product Product @relation(fields: [productId, orgId], references: [id, orgId])

  @@unique([orgId, productId])
  @@map("inventory_product_extensions")
}
```

Code location:

```txt
Product identity service:
  src/business-objects/products/service.server.ts

Inventory extension behavior:
  src/modules/inventory/service.server.ts
```

Do not place Inventory extension logic in the Product Business Object service unless it has been promoted or explicitly approved.

---

# 22. Route/Page Ownership Examples

## 22.1 Product list

Product is a Business Object.

Canonical page:

```txt
/[orgSlug]/objects/products
```

Canonical API:

```txt
/api/orgs/[orgSlug]/objects/products
```

Inventory may link to Products, but should not own canonical Product CRUD.

## 22.2 Stock levels

Stock level is Inventory-owned.

Canonical page:

```txt
/[orgSlug]/inventory/stock-levels
```

Canonical API:

```txt
/api/orgs/[orgSlug]/inventory/stock-levels
```

## 22.3 Leave request

Leave request is Leave-owned.

Canonical page:

```txt
/[orgSlug]/leave/requests
```

Canonical API:

```txt
/api/orgs/[orgSlug]/leave/requests
```

## 22.4 Employee

Employee is a Business Object.

Canonical page:

```txt
/[orgSlug]/objects/employees
```

Canonical API:

```txt
/api/orgs/[orgSlug]/objects/employees
```

Leave may reference Employee, but Leave does not own Employee.

---

# 23. `src/app` vs `src/modules` Responsibilities

A common mistake is to put all module code inside `src/app` because Next.js routes live there.

Do not do that.

Use this split:

```txt
src/app
  route and page entry points
  calls services
  renders layouts/pages

src/modules/[module]
  module manifest
  permissions
  schemas
  services
  event definitions
  settings metadata
  AI context
  module-local components
  tests
```

Example:

```txt
src/app/(platform)/[orgSlug]/inventory/stock-adjustments/page.tsx
  imports Inventory page composition/client components
  obtains data through InventoryService

src/modules/inventory/service.server.ts
  owns stock adjustment business logic

src/modules/inventory/schema.ts
  owns validation schemas

src/modules/inventory/events.ts
  owns inventory event names and payload schemas
```

---

# 24. Architecture Check Requirements

The repository must include architecture checks before serious implementation.

Command:

```bash
npm run check:architecture
```

Should check for forbidden patterns.

Minimum checks:

```txt
modules must not import @/kernel/*
modules must not import raw Prisma
modules must not import other modules
client components must not import @/sdk/server
client components must not import @/kernel/*
client components must not import server env helpers
components must not import raw Prisma
lib must not import Prisma or Kernel
API routes must not use redirect-style auth helpers
API routes must not contain ?orgId route patterns
module APIs must live under /api/orgs/[orgSlug]/...
route files must not trust body.orgId
services must not define public methods taking orgId as first argument
no sdk.getDb(orgId)
no findUnique({ where: { id } }) on tenant-scoped models in modules/services
no FastAPI/Python backend files in core platform
no client-specific folders under src/modules or src/app
```

Possible implementation approaches:

```txt
custom TypeScript/Node script
ESLint no-restricted-imports
dependency-cruiser later if needed
simple grep-style checks first
```

Do not overbuild.

A simple custom script is acceptable for MVP if it catches the dangerous cases.

---

# 25. Generated Code Check Requirements

The repository must include generated-code checks.

Command:

```bash
npm run check:generated
```

This should:

```txt
run the module generator in a temp directory
inspect generated files
ensure generated module compiles
ensure generated tests exist
ensure generated code contains no forbidden patterns
```

Generated code must not contain:

```txt
sdk.getDb(orgId)
body.orgId
searchParams.get('orgId')
/api/[module]
import '@/kernel/*' inside module files
raw Prisma imports in modules
placeholder-only tests
redirect auth helper in API routes
Business Object duplicates
FastAPI/Python files
```

The generator is only trustworthy if its output is continuously checked.

---

# 26. Package and Dependency Rules

## 26.1 Approved core dependency categories

Approved for the restarted core platform:

```txt
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Radix primitives through shadcn
React Hook Form
Zod
Motion for React
lucide-react
sonner
Supabase JS / SSR helpers
Prisma
Vitest
Testing Library
Playwright later for smoke tests
Sentry or equivalent for monitoring if approved
```

## 26.2 Dependencies requiring ADR or founder approval

Require approval:

```txt
FastAPI
GraphQL server
tRPC
Redux/Zustand/Jotai global state
TanStack Table if adding heavy table engine
TanStack Query if adopted as a global data-fetching standard
Redis
queue providers
email/SMS providers
file upload providers
search engines
AI provider SDKs for runtime use
billing providers
workflow engines
BI/reporting libraries
large UI frameworks beyond shadcn
```

This does not mean these are bad.

It means they change architecture or operational cost.

## 26.3 FastAPI decision

FastAPI is excluded from the restarted core platform.

Do not create:

```txt
apps/api
fastapi/
python backend
requirements.txt
alembic
sqlalchemy models
```

FastAPI may be reconsidered later only through ADR for a narrow specialized service, such as heavy document processing or AI/ML orchestration.

It must not become the main backend.

---

# 27. Client-Specific Code Policy

Client-specific source-code folders are forbidden for normal clients.

Forbidden:

```txt
src/clients/acme/
src/modules/acme-inventory/
src/app/(platform)/[orgSlug]/acme-special-page/
src/config/acme.ts
prisma/acme-schema.prisma
```

Allowed client-specific behavior should be handled through:

```txt
Organization row
OrgModule enablement
settings
roles
permissions
module settings
light branding configuration
feature flags
approved module extensions
new reusable draft modules
```

If a client needs something outside existing modules, classify it:

```txt
configuration
module setting
module extension
module enhancement
new draft module
Platform Service candidate
premium/custom work
reject/defer
```

Do not fork the platform.

---

# 28. Documentation Placement

Engineering Manual files belong in:

```txt
docs/engineering-manual/[section]/[file].md
```

ADRs belong in:

```txt
docs/adr/ADR-0001-title.md
```

Founder/operator guides belong in:

```txt
docs/founder-guide/
```

Module docs belong in:

```txt
src/modules/[module]/docs.md
```

Client handover templates may belong in:

```txt
docs/client-delivery/templates/
```

Do not use README files as the only source of architectural truth.

READMEs may summarize.

Frozen manual documents decide.

---

# 29. Repository Architecture for Claude

Claude must follow this workflow when creating files:

```txt
1. Identify the layer.
2. Identify the owning folder.
3. Check import rules.
4. Check server/client boundary.
5. Add tests in the correct location.
6. Run architecture checks.
7. Report files changed.
```

Claude must stop if asked to create code and the correct folder is unclear.

Examples:

## 29.1 Request: “Add reorder point to products”

Claude must not add `reorderPoint` to core `Product` immediately.

Correct classification:

```txt
Inventory-specific field
→ src/modules/inventory
→ InventoryProductExtension
```

## 29.2 Request: “Add comments to incidents”

Claude must not build Platform Comments Service automatically.

Correct classification:

```txt
Incident-specific note? module-local field
Reusable comments across records? evidence log / deferred Platform Service proposal
```

## 29.3 Request: “Add customer status for CRM”

Claude must not add CRM lifecycle status to core Customer.

Correct classification:

```txt
CRM-specific customer field
→ CrmCustomerProfile inside CRM module
```

## 29.4 Request: “Create Fleet app for trucking client”

Claude must not create a separate client app.

Correct classification:

```txt
new draft module
→ src/modules/fleet
→ enabled only for that client organization
```

---

# 30. Implementation Checklist

Before the restarted foundation build begins, repository architecture is ready when:

```txt
[ ] Target folder structure is approved
[ ] SDK split is approved: @/sdk, @/sdk/server, @/sdk/client
[ ] Module import boundaries are approved
[ ] Business Object folder strategy is approved
[ ] Platform Services deferred folder strategy is approved
[ ] App Router route conventions are approved
[ ] API route conventions are approved
[ ] Component folder strategy is approved
[ ] Server/client naming conventions are approved
[ ] check:architecture requirements are approved
[ ] check:generated requirements are approved
[ ] Claude workflow references this document
```

---

# 31. Architecture Check Acceptance Criteria

The repository architecture is not implemented correctly unless these can be enforced:

```txt
[ ] Module files cannot import @/kernel/*
[ ] Module files cannot import raw Prisma
[ ] Module files cannot import other modules
[ ] Client components cannot import @/sdk/server
[ ] Client components cannot import server env helpers
[ ] API routes do not use redirect-style auth helpers
[ ] API routes follow /api/orgs/[orgSlug]/... shape
[ ] Tenant APIs reject client-supplied orgId
[ ] Services use PlatformContext, not loose orgId
[ ] Business Object APIs are separate from module APIs
[ ] Product is not owned by Inventory routes
[ ] Customer is not owned by CRM routes
[ ] Employee is not owned by Leave routes
[ ] Deferred Platform Services contain no implementation unless approved
[ ] No client-specific source folders exist
[ ] No FastAPI/Python backend files exist in core platform
```

---

# 32. Claude Implementation Prompt Template

Use this prompt when asking Claude to implement the repository structure.

```md
You are implementing the OneDayOS repository architecture.

Authoritative documents:
- docs/engineering-manual/02-architecture/02-repository-architecture.md
- docs/engineering-manual/05-sdk/00-sdk-overview.md
- docs/engineering-manual/05-sdk/01-sdk-public-api.md
- docs/engineering-manual/13-security/08-production-readiness-gate.md
- docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md

Scope:
- Create or adjust folder structure only where needed.
- Add architecture check scripts.
- Add generated-code check script scaffolding.
- Do not implement business modules.
- Do not implement deferred Platform Services.
- Do not add FastAPI/Python backend.
- Do not create client-specific folders.

Rules:
- Modules must not import @/kernel/*.
- Modules must not import raw Prisma.
- Modules must not import other modules.
- Client components must not import @/sdk/server.
- APIs must use /api/orgs/[orgSlug]/... route shape.
- Services must receive PlatformContext, not loose orgId.
- Generated code must be checked for forbidden patterns.

Required output:
- Files changed.
- Scripts added.
- Architecture checks implemented.
- Commands run.
- Any manual ambiguities or deviations.
```

---

# 33. Common Anti-Patterns

## 33.1 The junk drawer anti-pattern

Bad:

```txt
src/lib/auth.ts
src/lib/db.ts
src/lib/permissions.ts
src/lib/inventory.ts
```

Why bad:

```txt
lib becomes unofficial Kernel
boundaries disappear
client imports become dangerous
Claude puts everything there
```

Correct:

```txt
src/kernel/auth
src/kernel/db
src/kernel/permissions
src/modules/inventory
```

## 33.2 The module sovereignty anti-pattern

Bad:

```txt
src/modules/inventory/products.ts
src/modules/crm/customers.ts
src/modules/leave/employees.ts
```

Why bad:

```txt
shared entities get duplicated
cross-module consistency dies
OneDayOS becomes many apps
```

Correct:

```txt
src/business-objects/products
src/business-objects/customers
src/business-objects/employees
```

## 33.3 The route-driven architecture anti-pattern

Bad:

```txt
All logic lives inside src/app routes because Next.js makes routes easy.
```

Why bad:

```txt
business logic becomes scattered
services are not reusable
modules cannot be generated cleanly
tests become hard
```

Correct:

```txt
routes orchestrate
services own behavior
schemas validate
SDK enforces platform access
```

## 33.4 The client fork anti-pattern

Bad:

```txt
src/app/(platform)/[orgSlug]/client-a-special-flow
src/modules/acme-inventory
```

Why bad:

```txt
updates become impossible
AppCare becomes custom labor
architecture stops compounding
```

Correct:

```txt
module setting
feature flag
reusable module enhancement
new draft module
premium dedicated deployment only when justified
```

## 33.5 The premature package anti-pattern

Bad:

```txt
Create monorepo packages before boundaries are proven.
```

Why bad:

```txt
slower iteration
more tooling complexity
Claude confusion
harder one-day delivery early
```

Correct:

```txt
single app repository
strict internal boundaries
future extraction when needed
```

---

# 34. Relationship to Previous Kernel v2 Implementation

The previous Kernel v2 implementation proved useful ideas:

```txt
shared database with org_id
SDK-only module access
module registry
Event Bus
Module Builder CLI
Business Object reuse
soft delete
optimistic UI
Three Client Rule
```

It also exposed risks:

```txt
incomplete org membership checks
permissions modeled but not enforced
redirect-style API auth
loose orgId handling
soft-delete bypass paths
weak generator output
sidebar route and active-state issues
missing Prisma generation in fresh builds
```

The restarted repository architecture keeps the useful direction but rejects the risky physical patterns.

The most important corrections are:

```txt
sdk.getDb(ctx), not sdk.getDb(orgId)
PlatformContext first
/api/orgs/[orgSlug]/... APIs
@/sdk/server and @/sdk/client split
pure module manifests
static module composition root
architecture checks
no raw Prisma in modules
no direct Kernel imports in modules
no client-supplied orgId
```

---

# 35. Final Rule

The repository structure should make the correct architecture boring.

Claude should not need to wonder:

```txt
Where do I put this?
Can this module import that?
Should this be Kernel?
Should this be a Platform Service?
Can I use Prisma here?
Can I accept orgId here?
```

The repository should answer those questions before code is written.

The final rule is:

```txt
OneDayOS repository architecture exists to make good platform behavior the path of least resistance.
```

