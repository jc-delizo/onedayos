# OneDayOS Engineering Manual — 04 Kernel / 00 Kernel Overview

**Document ID:** `04-kernel/00-kernel-overview.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Project:** OneDayOS  
**Website:** onedayonlysystems.com  
**Implementation Mode:** New-build architecture specification  

---

## 1. Purpose

This document defines the role, scope, boundaries, and minimum implementation contract of the **OneDayOS Kernel**.

The Kernel is the foundation every OneDayOS tenant, user, business object, platform service, and business module depends on.

The Kernel is not a business module.

The Kernel is not a SaaS starter.

The Kernel is not a generic admin dashboard.

The Kernel is the platform substrate that makes OneDayOS possible.

If the Kernel is wrong, every module built on top of it will inherit the mistake.

---

## 2. Relationship to Other Approved Documents

This document assumes the following Engineering Manual documents have been reviewed and approved:

```txt
01-foundation/00-vision.md
02-architecture/00-system-architecture.md
02-architecture/01-layer-boundaries.md
13-security/08-production-readiness-gate.md
13-security/09-security-stabilization-new-build-spec.md
```

This document does not replace those documents. It applies them specifically to the Kernel.

Where this document conflicts with a more specific future Kernel subdocument, the more specific document wins only after review and approval.

Expected future Kernel subdocuments:

```txt
04-kernel/01-authentication.md
04-kernel/02-organizations-tenancy.md
04-kernel/03-users-roles-permissions.md
04-kernel/04-authorization-enforcement.md
04-kernel/05-settings-configuration.md
04-kernel/06-feature-flags-subscriptions.md
04-kernel/07-routing-app-shell.md
04-kernel/08-kernel-api-contracts.md
```

---

## 3. Kernel Definition

The Kernel contains the minimum platform fundamentals required by every OneDayOS deployment.

The Kernel answers these questions:

```txt
Who is the user?
Which organization do they belong to?
Are they allowed to access this organization?
Which modules are enabled for this organization?
What permissions does the user have?
How do modules safely access platform capabilities?
How are routes, sessions, API responses, and events standardized?
```

The Kernel must be small, stable, and boring.

A good Kernel does not impress users directly. It prevents the platform from collapsing as modules multiply.

---

## 4. Kernel Position in the Master Architecture

The locked OneDayOS architecture is:

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

The Kernel is the bottom layer.

Everything depends on it.

It must not depend on business modules.

It must not depend on client-specific configuration.

It must not contain business workflows that belong to modules.

---

## 5. Kernel Responsibilities

The Kernel owns the following platform fundamentals.

### 5.1 Authentication

The Kernel owns authentication integration and session resolution.

Responsibilities:

```txt
Supabase Auth integration
Browser auth client
Server auth client
Session lookup
Page-safe auth guards
API-safe auth guards
Registration seam between Supabase Auth and OneDayOS database records
Logout behavior
Auth error normalization
```

The Kernel must provide separate auth helpers for pages and APIs.

Page helpers may redirect.

API helpers must never redirect.

---

### 5.2 Organizations and Tenancy

The Kernel owns organization identity and tenant access control.

Responsibilities:

```txt
Organization model
Organization slug routing
Organization activation/suspension status
User-to-organization membership
Tenant context resolution
Tenant boundary validation
Tenant-scoped route enforcement
Tenant-scoped API enforcement
```

The Kernel must guarantee that a user from Organization A cannot access Organization B by guessing its slug, API URL, or record ID.

This is a foundation requirement, not a later hardening task.

---

### 5.3 Users, Roles, and Permissions

The Kernel owns platform users and access control primitives.

Responsibilities:

```txt
User model
Role model
UserRole assignments
Permission model
Permission constants
Wildcard permissions
Permission checks
Permission enforcement helpers
Permission-denied response standards
```

Permissions are not only UI visibility flags.

Permissions must be enforced in server-side code.

---

### 5.4 Platform Context

The Kernel owns creation of verified runtime context.

A module, service, or API route must not receive loose tenant identifiers such as raw `orgId` strings from the client.

Instead, OneDayOS must create a verified context object.

Canonical concept:

```ts
type PlatformContext = {
  authUserId: string
  userId: string
  orgId: string
  orgSlug: string
  orgName: string
  isOrgActive: boolean
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled'
  enabledModuleIds: string[]
  roleIds: string[]
  permissionClaims: PermissionClaim[]
}
```

This type may evolve, but the concept is fixed:

```txt
Context is created by the Kernel.
Context is verified by the Kernel.
Context is passed downward.
Modules do not invent context.
Modules do not trust request payloads for tenant identity.
```

---

### 5.5 SDK Backing Implementation

The Kernel powers the SDK, but modules must not import Kernel internals directly.

The Kernel may contain internal implementations such as:

```txt
kernel/auth/*
kernel/tenancy/*
kernel/permissions/*
kernel/modules/*
kernel/events/*
kernel/settings/*
kernel/subscriptions/*
kernel/db/*
```

But business modules consume these through:

```ts
import { sdk } from '@/sdk'
```

Never through:

```ts
import { requireAuth } from '@/kernel/auth/session'
import { prisma } from '@/kernel/db/client'
import { can } from '@/kernel/permissions/check'
```

The Kernel is allowed to change internally.

The SDK is the public contract.

---

### 5.6 Module Registry and Loader

The Kernel owns module registration and module enablement.

Responsibilities:

```txt
ModuleManifest type
Module registry
Module registration
Module compatibility warnings
Enabled module lookup per organization
Disabled module enforcement
Module navigation assembly
Module dependency metadata
```

The Kernel does not own module business logic.

The Kernel only knows that modules exist, what they declare, and whether they are enabled for an organization.

---

### 5.7 Event Bus Interface

The Kernel owns the event bus interface.

Responsibilities:

```txt
Event emission API
Event subscription API
Event naming validation
Event payload shape convention
Synchronous in-process MVP bus
Future queue replacement seam
```

The MVP event bus may be in-process.

However, modules must call the SDK event interface so the implementation can later move to Redis, a queue, background jobs, or durable event storage without rewriting module code.

---

### 5.8 Settings and Configuration Primitives

The Kernel owns generic settings storage.

Responsibilities:

```txt
Organization-scoped settings
Module-scoped settings
Kernel settings
JSON value storage
Default resolution
Validation hooks
Client-safe configuration exposure
```

The Kernel stores settings. It does not decide module-specific business behavior unless that behavior is a true platform concern.

---

### 5.9 Feature Flags and Subscriptions

The Kernel owns organization-level module enablement and basic subscription records.

Responsibilities:

```txt
OrgModule records
Module enabled/disabled status
Subscription plan
Subscription status
User limits
Module limits
Storage limits
Suspension behavior
Future billing seam
```

Feature flags must affect both navigation and access.

A disabled module must not merely disappear from the sidebar. Its routes and APIs must also be inaccessible.

---

### 5.10 App Shell and Routing Primitives

The Kernel owns the platform shell structure.

Responsibilities:

```txt
Authenticated platform layout
Organization route group
Sidebar shell
Header shell
Core navigation assembly
Enabled module navigation assembly
Permission-aware navigation filtering
Route guard conventions
Not found and forbidden behavior
```

The Kernel owns the frame of the application.

Modules own their screens inside that frame.

---

### 5.11 API Contract Primitives

The Kernel owns API response conventions and reusable API helpers.

Every API must return:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
}
```

Where:

```ts
type ApiError = {
  code: string
  message: string
  details?: unknown
}
```

APIs must not return raw strings as errors.

APIs must not expose stack traces to clients.

APIs must not redirect to login.

---

### 5.12 Database Access Seam

The Kernel owns the raw database client.

Modules must not import the raw Prisma client.

The restarted build should prefer this pattern:

```ts
sdk.getDb(ctx)
```

not this older pattern:

```ts
sdk.getDb(orgId)
```

Reason:

```txt
orgId can be copied from a URL, payload, hidden input, query string, or another tenant.
PlatformContext must be created only after auth, membership, org status, and route validation pass.
```

The database routing seam remains valuable, but it should be context-based, not string-based.

---

## 6. What the Kernel Must Not Contain

The Kernel must not contain business workflows.

Forbidden Kernel responsibilities:

```txt
Inventory stock movement logic
Leave approval rules
CRM pipeline logic
Purchase request workflow
Expense claim validation
Asset assignment workflow
Visitor check-in workflow
Incident report workflow
Client-specific dashboards
Client-specific labels and workflows
```

The Kernel must also not prematurely contain Platform Services.

Deferred until justified:

```txt
Approval Engine
Notification Engine
Workflow Engine
Audit Log Service
Comments Service
Attachments Service
Activity Feed Service
Reporting Service
Search Service
Dynamic Form Engine
Dynamic CRUD Engine
Background Job Queue
AI Assistant runtime
```

Some of these are important. They are not Kernel fundamentals.

They must be promoted only after the Three Independent Use Cases Rule is satisfied, unless a future ADR explicitly approves an exception.

---

## 7. Kernel and Business Objects

Business Objects are conceptually separate from the Kernel.

Examples:

```txt
Employee
Product
Customer
Supplier
Warehouse
```

These are shared business entities used by multiple modules.

They are not module-owned.

They are not Kernel fundamentals in the same way authentication and tenancy are.

However, for MVP implementation simplicity, Business Object tables may physically live near Kernel tables in the same Prisma schema.

This physical colocation must not blur the architectural boundary.

Correct interpretation:

```txt
Conceptual architecture:
Kernel → Business Objects

MVP physical implementation:
Kernel tables and Business Object tables may share one database schema and one Prisma schema.

Import/access rule:
Modules still access shared objects through SDK/service contracts, not through Kernel internals.
```

### 7.1 Employee Clarification

Employee is close to Kernel because it can link to User.

But Employee is not the same as User.

```txt
User = login identity and access control subject.
Employee = business person record used by HR, Leave, Assets, Projects, Approvals, and other modules.
```

A User may have an Employee record.

An Employee may exist without a User login.

Therefore:

```txt
User belongs to Kernel.
Employee belongs to Business Objects.
```

The Kernel may need to understand the optional User ↔ Employee relationship, but Employee business behavior must not live in Kernel.

### 7.2 Branch and Department Clarification

Branch and Department are organization structure primitives.

They belong to Kernel because they define tenant structure and are used broadly for user scoping, employee assignment, permissions, reports, and configuration.

```txt
Organization → Branch → Department
```

The model may support nullable branch relationships for simpler SMEs.

### 7.3 Warehouse Clarification

Warehouse is not Kernel.

Warehouse is an operational Business Object.

It can be used by Inventory, Purchasing, Transfers, Assets, and future logistics features.

It should not be treated as an organization structure primitive even if it optionally links to Branch.

---

## 8. Recommended New-Build Kernel Folder Structure

The restarted platform should use a folder structure that makes Kernel boundaries explicit.

Recommended structure:

```txt
src/
  kernel/
    api/
      response.ts
      errors.ts
      handlers.ts

    auth/
      browser-client.ts
      server-client.ts
      session.ts
      page-auth.ts
      api-auth.ts
      register.ts

    context/
      platform-context.ts
      require-page-context.ts
      require-api-context.ts
      require-service-context.ts

    tenancy/
      organizations.ts
      org-membership.ts
      org-status.ts
      org-slug.ts

    permissions/
      constants.ts
      claims.ts
      can.ts
      require-permission.ts
      guards.ts

    modules/
      manifest.ts
      registry.ts
      enabled-modules.ts
      module-route-guard.ts

    events/
      event-bus.ts
      event-names.ts
      event-types.ts

    settings/
      settings.ts
      schemas.ts

    subscriptions/
      plans.ts
      subscription-status.ts

    db/
      client.ts
      soft-delete.ts
      transactions.ts

  sdk/
    index.ts
    auth.ts
    context.ts
    permissions.ts
    events.ts
    modules.ts
    db.ts

  modules/
    .gitkeep
```

This is not a final command to Claude yet. It is the target organization for the Kernel implementation.

---

## 9. Import Rules

### 9.1 Kernel Import Rules

Kernel files may import:

```txt
Other Kernel internals
Database client
Supabase server/browser clients
Framework primitives
Shared low-level utilities
```

Kernel files must not import:

```txt
Business modules
Client-specific configuration logic
Module services
Module UI
Platform Services that depend on modules
```

### 9.2 SDK Import Rules

SDK files may import Kernel internals and re-export stable public functions.

The SDK is the adapter between Kernel internals and module consumers.

### 9.3 Module Import Rules

Business modules may import:

```ts
import { sdk } from '@/sdk'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/platform/data-table'
import { SomeLocalThing } from './local-file'
```

Business modules must not import:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/can'
import { registerModule } from '@/kernel/modules/registry'
import { InventoryService } from '@/modules/inventory/service' // from another module
```

Cross-module communication happens through events, shared Business Objects, Platform Services, or SDK APIs.

Never through direct module imports.

---

## 10. Kernel Runtime Model

The Kernel participates in three runtime zones.

### 10.1 Server Runtime

Used for:

```txt
Session validation
Supabase server auth
Prisma queries
API route handling
Route guards
Permission enforcement
Tenant context creation
Module enablement checks
```

Most Kernel logic should live here.

### 10.2 Client Runtime

Used for:

```txt
Browser auth client
Logout
Optimistic UI helpers
Client-safe user/session display
Theme toggles
Navigation interactions
```

Client-side Kernel code must not contain secrets, service-role logic, raw database access, or server-only permission decisions.

### 10.3 Database Runtime

Used for:

```txt
Tenant-scoped data
Roles and permissions
Org module enablement
Settings
Subscriptions
Business Object records
Future RLS policies
```

In Phase 1, application-level tenant isolation is mandatory.

Future RLS is defense-in-depth, not a replacement for application-level checks.

---

## 11. Canonical Request Flow

### 11.1 Page Request Flow

For an authenticated organization page:

```txt
Request: /[orgSlug]/some-page
  ↓
Kernel page context resolver
  ↓
Check Supabase session
  ↓
Load platform User
  ↓
Load Organization by slug
  ↓
Verify user.orgId === org.id
  ↓
Verify org is active
  ↓
Load enabled modules
  ↓
Load roles/permission claims
  ↓
Return PlatformContext
  ↓
Render App Shell and page
```

If unauthenticated:

```txt
Redirect to /login
```

If authenticated but wrong organization:

```txt
Return notFound() or forbidden page
```

Prefer not to reveal whether another organization slug exists.

### 11.2 API Request Flow

For an organization-scoped API:

```txt
Request: /api/orgs/[orgSlug]/...
  ↓
Kernel API context resolver
  ↓
Check Supabase session
  ↓
Load platform User
  ↓
Load Organization by slug
  ↓
Verify user.orgId === org.id
  ↓
Verify org is active
  ↓
Verify module is enabled, if route is module-scoped
  ↓
Verify permission, if route performs protected action
  ↓
Return PlatformContext to handler
```

If unauthenticated:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

HTTP status:

```txt
401
```

If authenticated but unauthorized:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

HTTP status:

```txt
403
```

API routes must never return HTML login redirects.

---

## 12. Canonical API Route Shape

Every protected API route should follow this pattern conceptually:

```ts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params

  const ctxResult = await sdk.auth.requireApiContext({
    request,
    orgSlug,
    module: 'inventory',
    permission: {
      module: 'inventory',
      action: 'create',
      resource: 'stock_adjustment',
    },
  })

  if (!ctxResult.ok) return ctxResult.response

  const body = await request.json()
  const parsed = CreateStockAdjustmentSchema.safeParse(body)

  if (!parsed.success) {
    return sdk.api.validationError(parsed.error)
  }

  const data = await InventoryService.create(ctxResult.ctx, parsed.data)

  return sdk.api.created(data)
}
```

This is illustrative. Exact helper names will be finalized in the SDK and API contract documents.

The key rule is fixed:

```txt
Auth, org membership, module enablement, and permission enforcement happen before service execution.
```

---

## 13. Canonical Service Shape

Module services should receive verified context.

Correct:

```ts
export class InventoryService {
  static async listProducts(ctx: PlatformContext) {
    return sdk.getDb(ctx).product.findMany({
      where: { orgId: ctx.orgId },
    })
  }
}
```

Incorrect:

```ts
export class InventoryService {
  static async listProducts(orgId: string) {
    return sdk.getDb(orgId).product.findMany({
      where: { orgId },
    })
  }
}
```

Worse:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

The first pattern is safer because `ctx` can only be created by the Kernel after tenant validation.

---

## 14. Permission Enforcement Model

Permission checks must exist at multiple layers.

### 14.1 UI Layer

UI checks decide what the user sees.

Examples:

```txt
Hide Create button if user cannot create.
Hide Delete action if user cannot delete.
Hide admin settings link if user cannot manage settings.
```

UI checks are helpful but never sufficient.

### 14.2 API Layer

API checks are mandatory.

Every protected API route must enforce permissions before mutation or sensitive read.

### 14.3 Service Layer

Service layer should receive verified `PlatformContext`.

For sensitive operations, the service should either:

```txt
1. require a context type that proves permission was already checked, or
2. perform its own permission requirement.
```

This will be finalized in `04-kernel/04-authorization-enforcement.md`.

### 14.4 Database Layer

Database queries must include tenant scope.

Future RLS may add another layer of protection, but Phase 1 must not depend on RLS.

---

## 15. Tenant Isolation Model

Tenant isolation is one of the Kernel's core responsibilities.

Minimum rules:

```txt
Every tenant-scoped table has orgId.
Every tenant-scoped query filters by ctx.orgId.
Every organization page validates org slug membership.
Every organization API validates org slug membership.
Client-supplied orgId is rejected or ignored.
Record IDs alone are never enough for reads or writes.
Mutations include orgId in the where clause where applicable.
```

Example safe update:

```ts
await db.inventoryItem.update({
  where: {
    id_orgId: {
      id: input.id,
      orgId: ctx.orgId,
    },
  },
  data,
})
```

If a Prisma model does not support compound unique `id_orgId`, use a safe guarded update pattern such as `updateMany` with both `id` and `orgId`, then verify affected row count.

Unsafe update:

```ts
await db.inventoryItem.update({
  where: { id: input.id },
  data,
})
```

This can become an IDOR vulnerability.

---

## 16. Kernel API Routes

Kernel-owned API routes should use a consistent namespace.

Recommended:

```txt
/api/kernel/auth/register
/api/kernel/auth/session
/api/orgs/[orgSlug]/kernel/users
/api/orgs/[orgSlug]/kernel/roles
/api/orgs/[orgSlug]/kernel/permissions
/api/orgs/[orgSlug]/kernel/settings
/api/orgs/[orgSlug]/kernel/modules
```

Module APIs should be tenant-scoped by org slug.

Recommended:

```txt
/api/orgs/[orgSlug]/inventory/products
/api/orgs/[orgSlug]/inventory/stock-movements
/api/orgs/[orgSlug]/leave/requests
```

Avoid:

```txt
/api/inventory?orgId=...
/api/products?orgId=...
/api/employees?orgId=...
```

The org slug in the URL is not trusted by itself. It is simply the lookup key that the server verifies against the authenticated user.

---

## 17. Error Code Standards

Kernel API helpers should standardize these error codes at minimum:

| HTTP Status | Code | Meaning |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Input failed schema validation. |
| 401 | `UNAUTHENTICATED` | No valid session. |
| 403 | `FORBIDDEN` | User lacks permission or org access. |
| 404 | `NOT_FOUND` | Record or route target not found. |
| 409 | `CONFLICT` | Unique constraint or business conflict. |
| 422 | `UNPROCESSABLE_ENTITY` | Valid shape but invalid business operation. |
| 500 | `INTERNAL_ERROR` | Unexpected server error. |

Error responses must not leak stack traces.

Server logs may contain diagnostic details.

Client responses must contain safe messages.

---

## 18. Kernel Data Model Scope

The Kernel may define or directly manage these models:

```txt
Organization
Branch
Department
User
Role
UserRole
Permission
Subscription
OrgModule
Setting
```

The following should be treated as Business Objects, even if stored in the same Prisma schema:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

This distinction must be reflected in service boundaries and documentation.

---

## 19. Soft Delete Responsibility

The Kernel may provide shared soft-delete utilities.

Soft-delete rules:

```txt
Use deletedAt and deletedBy for record-level deletion.
isActive is not deletion.
isActive represents business status.
Deleted records should be hidden by default.
Restore requires explicit admin behavior.
Hard delete requires explicit policy.
```

Soft-delete behavior must not rely only on developer memory.

The Kernel should provide reusable helpers or Prisma extensions where safe.

However, any known extension bypasses must be documented and tested.

---

## 20. Event Naming Responsibility

The Kernel should enforce or validate event naming where practical.

Required convention:

```txt
{module}.{entity}.{past_tense_verb}
```

Examples:

```txt
inventory.product.created
inventory.stock_adjustment.created
crm.customer.converted
purchasing.purchase_request.approved
hr.employee.deactivated
```

Invalid examples:

```txt
product.created
ProductCreated
inventoryProductCreated
inv.product.create
inventory.product.create
```

A wrong event name is a contract bug.

---

## 21. Module Enablement Rules

A module is usable for an organization only if all of the following are true:

```txt
The module is registered in the module registry.
The module is compatible with the Kernel version or explicitly allowed.
The organization has an enabled OrgModule record for it.
The organization subscription allows it.
The user has required permission for the action.
The module's dependencies, if any, are enabled.
```

Navigation should show only enabled and visible modules.

APIs and routes must enforce enablement independently of navigation.

---

## 22. App Shell Rules

The Kernel app shell should provide:

```txt
Organization-aware layout
Sidebar
Header
User menu
Logout
Enabled module navigation
Core platform navigation
Permission-aware navigation filtering
Consistent loading/error/forbidden states
```

The app shell must not include fake links to routes that do not exist.

The app shell must not use unsafe active matching such as naive `pathname.startsWith(href)` where route collisions are possible.

Correct active matching should be segment-aware.

Example issue to avoid:

```txt
/inventory matches /inventory-audit by accident
```

---

## 23. Kernel Testing Requirements

The Kernel is not acceptable without tests for actual security behavior.

Minimum test categories:

```txt
Authentication helper tests
API auth helper tests
Org context resolver tests
Wrong-org access tests
Permission allow tests
Permission deny tests
Wildcard permission tests
Disabled module access tests
API response shape tests
Soft-delete behavior tests
Module registry tests
Event bus tests
Registration rollback tests
Proxy/middleware tests
```

Tests must not be tautological.

Bad test:

```txt
It checks that a mocked function returns the mocked value.
```

Good test:

```txt
Org A user attempts to access Org B route and is denied.
```

---

## 24. Minimum Security Test Matrix

The Kernel must include at least this security matrix before module work begins:

| Scenario | Expected Result |
|---|---|
| No session calls protected API | `401 UNAUTHENTICATED` JSON |
| No session loads protected page | Redirect to login |
| Org A user loads Org B route | Not found or forbidden |
| Org A user calls Org B API | `403 FORBIDDEN` or `404 NOT_FOUND` JSON |
| Staff without permission creates record | `403 FORBIDDEN` JSON |
| Admin with wildcard permission creates record | Success |
| Client submits `orgId` in payload | Ignored or rejected |
| API route throws validation error | `400 VALIDATION_ERROR` JSON |
| Disabled module route is loaded | Forbidden or not found |
| Disabled module API is called | `403 FORBIDDEN` or `404 NOT_FOUND` JSON |

---

## 25. Kernel Build Sequence for Claude

Claude should not be asked to build the whole Kernel in one prompt.

Recommended implementation sequence:

```txt
1. Project bootstrap and dependency baseline
2. Database schema for Kernel-only models
3. API response/error helpers
4. Supabase auth clients
5. Registration seam
6. Page auth helper
7. API auth helper
8. PlatformContext type and resolvers
9. Organization tenancy guard
10. Roles and permissions model
11. Permission checking and enforcement helpers
12. Feature flags and module registry
13. Settings and subscription primitives
14. Event bus interface
15. App shell routing
16. Kernel test matrix
17. SDK wrapper exports
18. Import boundary linting
```

Each step should have tests.

No business module should be implemented during Kernel construction.

A tiny fake test module may be used only to verify registry, navigation, or SDK contracts.

---

## 26. Claude Implementation Rules

When Claude implements Kernel work, use a prompt like:

```md
You are implementing a OneDayOS Kernel subsystem.

Authoritative manual documents:
- docs/engineering-manual/04-kernel/00-kernel-overview.md
- [specific subdocument]

Rules:
- Do not build business modules.
- Do not build Platform Services.
- Do not accept client-supplied orgId.
- Do not use redirect-based auth helpers inside API routes.
- Every API returns { data, error } JSON.
- Every protected API uses API-safe auth.
- Every org-scoped route validates org membership.
- Every mutation checks permissions.
- Modules must import from @/sdk only.
- Add tests for allow and deny paths.
- Stop if the manual is ambiguous.
```

Claude must not decide Kernel boundaries.

Claude implements the approved manual.

---

## 27. Kernel Acceptance Criteria

The Kernel Overview is satisfied when the implementation provides:

```txt
[ ] Supabase Auth integration exists
[ ] Registration creates Supabase Auth user and database records through one server-owned seam
[ ] Page auth helper exists
[ ] API auth helper exists and returns JSON 401
[ ] PlatformContext exists
[ ] Page context resolver validates org membership
[ ] API context resolver validates org membership
[ ] Client-supplied orgId is not trusted
[ ] Roles and permissions exist
[ ] Permission enforcement helper exists
[ ] API mutations enforce permissions
[ ] Module registry exists
[ ] Enabled modules are org-scoped
[ ] Disabled modules are inaccessible, not merely hidden
[ ] Settings storage exists
[ ] Subscription record exists
[ ] Event bus SDK interface exists
[ ] App shell exists
[ ] SDK wraps Kernel public capabilities
[ ] Business modules cannot import Kernel internals
[ ] Tenant isolation tests pass
[ ] API auth behavior tests pass
[ ] Permission allow/deny tests pass
[ ] Build, typecheck, lint, and test suite pass
```

---

## 28. Production Blockers

The Kernel is not production-ready if any of the following are true:

```txt
API routes redirect to login instead of returning JSON 401.
Authenticated users can access another organization's route by guessing the slug.
API routes accept orgId from query strings or request bodies for tenant-scoped work.
Permission checks exist but are not enforced.
Mutation routes are protected only by authentication.
Module routes are visible/usable when the module is disabled.
Services accept loose orgId strings from unverified callers.
Business modules import from @/kernel/*.
Soft-deleted records appear in normal reads.
Live migration and seed have not been verified against Postgres.
```

If any blocker exists, OneDayOS may be demoed locally but must not onboard a second real tenant.

---

## 29. Explicit Non-Goals for Kernel Phase

Do not implement these in the Kernel phase:

```txt
Inventory Module
Leave Module
CRM Module
Approval Engine
Notification Engine
Dynamic Form Engine
Dynamic CRUD Engine
Reporting Engine
Search Engine
AI Assistant
Marketplace
Billing automation
Background job queue
Complex multi-org user switching
Database-per-tenant architecture
PostgreSQL RLS policies
```

Some of these are future priorities.

They are not prerequisites for a correct Kernel, except where the Kernel must preserve seams for them.

---

## 30. Architectural Risks This Document Intentionally Addresses

This Kernel Overview directly addresses the highest-risk issues found in the previous MVP reference:

```txt
Tenant isolation must be built into the new Kernel from day one.
Permission checks must be enforced, not merely implemented.
API auth must return JSON errors, not redirects.
Client-supplied orgId must not be trusted.
Module generator output must be secure by default.
Business Objects must not be confused with Kernel internals.
```

The restarted platform should not recreate the old MVP and then patch these later.

---

## 31. Founder Review Questions

Before freezing this document, answer these questions:

### Question 1: Should MVP users belong to exactly one organization?

Recommended answer:

```txt
Yes. Single-org users for MVP.
```

Reason:

```txt
Philippine SME clients will usually operate as separate tenants.
Multi-org user switching adds complexity before it creates value.
```

Future path:

```txt
Add Membership table later if marketplace/agency/admin use cases require one user across multiple orgs.
```

### Question 2: Should APIs be nested under `/api/orgs/[orgSlug]/...`?

Recommended answer:

```txt
Yes.
```

Reason:

```txt
It makes tenant context explicit in route structure while still requiring server-side membership validation.
```

### Question 3: Should services accept `PlatformContext` instead of `orgId`?

Recommended answer:

```txt
Yes.
```

Reason:

```txt
A verified context is harder to misuse than a string.
```

### Question 4: Should the Kernel include Employee?

Recommended answer:

```txt
No, not conceptually. Employee is a Business Object.
```

But:

```txt
The User ↔ Employee relationship is allowed because User is Kernel and Employee is a shared business entity.
```

### Question 5: Should RLS be implemented immediately?

Recommended answer:

```txt
No, not in Phase 1.
```

Reason:

```txt
Application-level isolation must be correct first. RLS should be added later as defense-in-depth after patterns stabilize.
```

---

## 32. Decision

The OneDayOS Kernel will be rebuilt as a security-first, SDK-backed, tenant-aware platform foundation.

The new Kernel must include authentication, organizations, users, roles, permissions, context resolution, module enablement, settings, subscriptions, event interface, app shell, and API contracts.

The Kernel must not include business modules, premature Platform Services, client-specific workflows, or dynamic engines.

The Kernel is complete only when tenant isolation, API auth behavior, and permission enforcement are implemented and tested.

---

## 33. Next Documents

After this Kernel Overview is approved, write these in order:

```txt
04-kernel/01-authentication.md
04-kernel/02-organizations-tenancy.md
04-kernel/03-users-roles-permissions.md
04-kernel/04-authorization-enforcement.md
04-kernel/08-kernel-api-contracts.md
```

Recommended next document:

```txt
04-kernel/01-authentication.md
```

Reason:

```txt
Authentication and API-safe auth helpers are prerequisites for tenant context, permission enforcement, and every protected route.
```
