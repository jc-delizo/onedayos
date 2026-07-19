# OneDayOS Engineering Manual — 04 Kernel / 07 Routing & App Shell

**Document ID:** `04-kernel/07-routing-app-shell.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Platform UI Build`  
**Owner:** OneDayOS Founder + ChatGPT Architecture Partner  
**Last Updated:** July 2026  
**Supersedes:** Earlier MVP shell assumptions from Kernel v2 where they conflict with this document  
**Depends On:**

- `00-meta/01-manual-governance.md`
- `00-meta/03-claude-workflow.md`
- `00-meta/04-definition-of-done.md`
- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `02-architecture/02-repository-architecture.md`
- `02-architecture/03-runtime-architecture.md`
- `02-architecture/05-dependency-rules.md`
- `03-design-system/02-layout-system.md`
- `03-design-system/03-component-standards.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/06-feature-flags-subscriptions.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/05-module-navigation.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `13-security/04-api-security.md`
- `13-security/08-production-readiness-gate.md`

---

# 1. Purpose

This document defines the routing and app-shell architecture for the restarted OneDayOS platform.

The app shell is not just visual chrome. It is the runtime container where tenant context, module enablement, navigation, route access, subscriptions, permissions, and UI structure meet.

A correct shell ensures that:

```txt
user logs in
  ↓
user enters a specific organization route
  ↓
Kernel verifies membership
  ↓
Kernel creates PlatformContext
  ↓
subscription and module availability are resolved
  ↓
navigation is built server-side
  ↓
pages render only what the user can access
  ↓
API routes enforce the same rules
```

The app shell must make OneDayOS feel like one unified Business Operating System, not a folder of unrelated modules.

---

# 2. Non-Goals

This document does **not** define:

```txt
business module implementation
module-specific page design
module-owned services
database schema details
Supabase Auth internals
full Design System component API
billing provider integration
customer self-service portal
public API design
mobile native app routing
dedicated enterprise deployment routing
marketing website routing
```

It also does **not** implement:

```txt
runtime AI assistant
global search
command palette data search
Activity Feed
Audit Log
Notifications
Dynamic Forms
Dynamic CRUD
View Builder
Background Jobs
FastAPI backend
GraphQL API
```

Those remain separate or deferred systems.

---

# 3. Core Principle

The routing and app shell must enforce this rule:

```txt
The URL may locate a tenant.
The Kernel must authorize the tenant.
```

Therefore:

```txt
/[orgSlug]/inventory
```

does **not** mean the user is allowed into that organization.

It means:

```txt
The user is asking to access the organization with this slug.
```

The Kernel must then verify:

```txt
authenticated user exists
platform User exists
organization exists
user.orgId === organization.id
organization is active or allowed for limited suspended access
subscription status permits the destination
module is enabled if route is module-owned
user has required permission
```

Only after that can the page render real tenant data.

---

# 4. Route Families

OneDayOS uses these route families:

```txt
/
  Public landing or redirect

/(auth)/...
  Login, registration, password reset, auth-related pages

/[orgSlug]/...
  Authenticated tenant shell

/api/kernel/...
  Kernel APIs not tied to one business module

/api/orgs/[orgSlug]/...
  Tenant-scoped APIs

/api/orgs/[orgSlug]/objects/...
  Business Object APIs

/api/orgs/[orgSlug]/[moduleId]/...
  Business Module APIs
```

The restarted build should not use:

```txt
/api/[module]
/api/inventory?orgId=...
/dashboard?orgId=...
/app/[orgId]/...
/clients/[clientId]/...
/tenant/[tenantId]/...
```

because those patterns encourage loose tenant handling or client-supplied tenant identity.

---

# 5. Canonical Route Tree

The restarted build should use this high-level route tree:

```txt
src/app/
  layout.tsx
  globals.css

  (public)/
    page.tsx

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
      page.tsx
      dashboard/
        page.tsx

      records/
        employees/
          page.tsx
          new/
            page.tsx
          [employeeId]/
            page.tsx
            edit/
              page.tsx
        products/
          page.tsx
          new/
            page.tsx
          [productId]/
            page.tsx
            edit/
              page.tsx
        customers/
          page.tsx
          new/
            page.tsx
          [customerId]/
            page.tsx
            edit/
              page.tsx
        suppliers/
          page.tsx
          new/
            page.tsx
          [supplierId]/
            page.tsx
            edit/
              page.tsx
        warehouses/
          page.tsx
          new/
            page.tsx
          [warehouseId]/
            page.tsx
            edit/
              page.tsx

      inventory/
        page.tsx
        stock-levels/
          page.tsx
        adjustments/
          page.tsx
          new/
            page.tsx
          [adjustmentId]/
            page.tsx

      leave/
        page.tsx
        requests/
          page.tsx
          new/
            page.tsx
          [requestId]/
            page.tsx
        balances/
          page.tsx

      crm/
        page.tsx
        opportunities/
          page.tsx
          new/
            page.tsx
          [opportunityId]/
            page.tsx

      purchasing/
        page.tsx
        purchase-requests/
          page.tsx
          new/
            page.tsx
          [purchaseRequestId]/
            page.tsx
        purchase-orders/
          page.tsx
          new/
            page.tsx
          [purchaseOrderId]/
            page.tsx
        receipts/
          page.tsx

      expenses/
        page.tsx
        claims/
          page.tsx
          new/
            page.tsx
          [claimId]/
            page.tsx

      assets/
        page.tsx
        [assetId]/
          page.tsx

      visitors/
        page.tsx
        visits/
          page.tsx
          new/
            page.tsx
          [visitId]/
            page.tsx

      incidents/
        page.tsx
        new/
          page.tsx
        [incidentId]/
          page.tsx

      settings/
        page.tsx
        users/
          page.tsx
        roles/
          page.tsx
        modules/
          page.tsx
        organization/
          page.tsx
        billing/
          page.tsx
```

This tree is not a requirement to implement every page immediately.

It is the routing convention that future pages should follow.

---

# 6. Auth Route Group

Auth pages live outside the tenant shell:

```txt
/(auth)/login
/(auth)/register
/(auth)/forgot-password
/(auth)/reset-password
```

Auth pages must not require `PlatformContext` because unauthenticated users do not yet have tenant context.

However, registration is special:

```txt
Register page
  ↓
POST /api/kernel/auth/register
  ↓
server creates Supabase Auth user
  ↓
server creates Organization
  ↓
server creates Prisma User
  ↓
server creates Subscription
  ↓
server creates Admin role and permissions
```

Registration must remain server-owned.

The client must not call:

```ts
supabase.auth.signUp()
```

directly for platform organization creation.

---

# 7. Post-Login Flow

After successful login, the client should not fetch:

```txt
/api/kernel/users/[id]
```

That pattern is IDOR-prone and trains the UI to pass user IDs around.

Use:

```txt
GET /api/kernel/auth/me
```

Expected behavior:

```txt
Browser session cookie
  ↓
Kernel resolves Supabase user
  ↓
Kernel resolves Prisma User
  ↓
Kernel resolves Organization
  ↓
returns safe current-user payload
```

Example response:

```json
{
  "data": {
    "user": {
      "id": "user_123",
      "name": "Juan Dela Cruz",
      "email": "juan@example.com"
    },
    "organization": {
      "id": "org_123",
      "name": "Acme Trading",
      "slug": "acme-trading"
    },
    "defaultRoute": "/acme-trading/dashboard"
  },
  "error": null
}
```

The login page may then redirect to:

```txt
/[orgSlug]/dashboard
```

---

# 8. Tenant Shell Route

The tenant shell lives at:

```txt
/[orgSlug]/...
```

The shell layout file is:

```txt
src/app/(platform)/[orgSlug]/layout.tsx
```

This layout is a **server component** and must:

```txt
1. read orgSlug from route params
2. require page auth
3. resolve Prisma User from authenticated session
4. resolve Organization by slug
5. verify user.orgId === organization.id
6. verify organization status
7. resolve subscription status
8. resolve enabled modules
9. resolve user roles and permissions
10. create PlatformContext
11. build navigation server-side
12. render AppShell
```

The layout must not:

```txt
trust orgSlug as authorization
accept orgId from query params
accept orgId from hidden form fields
fetch navigation from the browser
let the browser decide which modules are enabled
let the browser decide permissions
query tenant data without PlatformContext
```

---

# 9. PlatformContext Creation in Shell

The tenant layout must create a verified page context.

Conceptual helper:

```ts
const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
```

Expected return shape:

```ts
type PlatformContext = {
  authUserId: string
  user: {
    id: string
    name: string
    email: string
    isActive: boolean
  }
  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
  }
  subscription: {
    status: 'trial' | 'active' | 'suspended' | 'cancelled'
    plan: string
    maxUsers: number
    maxModules: number
  }
  roles: Array<{
    id: string
    name: string
    isSystem: boolean
  }>
  permissions: Array<{
    module: string
    resource: string
    action: string
  }>
  enabledModules: string[]
}
```

The actual type belongs in the SDK/auth documents, but routing must depend on this concept.

---

# 10. Page Auth vs API Auth

Page auth and API auth are different.

Page auth may redirect:

```txt
unauthenticated page request
  → redirect /login
```

API auth must never redirect:

```txt
unauthenticated API request
  → 401 JSON
```

Therefore:

```ts
sdk.auth.requirePageOrgContext(orgSlug)
```

is acceptable inside tenant pages and layouts.

But API routes must use:

```ts
sdk.auth.requireApiOrgContext(req, orgSlug)
sdk.auth.requireApiModuleContext(req, orgSlug, moduleId)
```

Never use redirect-based page helpers in API routes.

---

# 11. Root Route Behavior

The root route `/` may be implemented as one of these:

```txt
Option A:
  public marketing / landing page

Option B:
  redirect authenticated user to their org dashboard
  redirect unauthenticated user to login

Option C:
  temporary internal redirect to /login during MVP
```

Recommended MVP:

```txt
/ 
  unauthenticated → /login
  authenticated → /[user.org.slug]/dashboard
```

Marketing can move to a separate route or separate site later.

The root route must not guess org slugs from client payloads.

---

# 12. Business Object Page Routes

Business Objects should be visually and structurally shared.

Recommended page routes:

```txt
/[orgSlug]/records/employees
/[orgSlug]/records/products
/[orgSlug]/records/customers
/[orgSlug]/records/suppliers
/[orgSlug]/records/warehouses
```

This reinforces that:

```txt
Product is not owned by Inventory
Customer is not owned by CRM
Employee is not owned by Leave
Supplier is not owned by Purchasing
Warehouse is not owned by Inventory
```

Business Object APIs live under:

```txt
/api/orgs/[orgSlug]/objects/employees
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/suppliers
/api/orgs/[orgSlug]/objects/warehouses
```

Do not create:

```txt
/api/orgs/[orgSlug]/inventory/products
/api/orgs/[orgSlug]/crm/customers
/api/orgs/[orgSlug]/leave/employees
```

for core Business Object CRUD.

A module may create extension APIs, for example:

```txt
/api/orgs/[orgSlug]/inventory/product-settings
/api/orgs/[orgSlug]/crm/customer-profiles
```

but not duplicate shared objects.

---

# 13. Module Page Routes

Module pages follow:

```txt
/[orgSlug]/[moduleId]/...
```

Examples:

```txt
/acme-trading/inventory
/acme-trading/inventory/stock-levels
/acme-trading/leave/requests
/acme-trading/crm/opportunities
/acme-trading/purchasing/purchase-orders
/acme-trading/expenses/claims
/acme-trading/assets
/acme-trading/visitors/visits
/acme-trading/incidents
```

Module APIs follow:

```txt
/api/orgs/[orgSlug]/[moduleId]/...
```

Examples:

```txt
/api/orgs/acme-trading/inventory/stock-levels
/api/orgs/acme-trading/leave/requests
/api/orgs/acme-trading/crm/opportunities
/api/orgs/acme-trading/purchasing/purchase-orders
```

Forbidden:

```txt
/api/inventory
/api/inventory?orgId=...
/api/modules/inventory
/[orgSlug]/modules/inventory
```

---

# 14. Settings Routes

Kernel settings should live under:

```txt
/[orgSlug]/settings
/[orgSlug]/settings/users
/[orgSlug]/settings/roles
/[orgSlug]/settings/modules
/[orgSlug]/settings/organization
/[orgSlug]/settings/billing
```

Settings APIs should live under:

```txt
/api/orgs/[orgSlug]/settings
/api/orgs/[orgSlug]/settings/users
/api/orgs/[orgSlug]/settings/roles
/api/orgs/[orgSlug]/settings/modules
/api/orgs/[orgSlug]/settings/organization
/api/orgs/[orgSlug]/settings/billing
```

Settings must respect:

```txt
tenant membership
subscription status
permissions
typed settings schema
client-supplied orgId rejection
```

Settings must not become:

```txt
custom field system
workflow engine
secret store
permission bypass
module enablement bypass
billing provider implementation
```

---

# 15. Sidebar Architecture

Sidebar navigation must be built from server-resolved data.

Inputs:

```txt
PlatformContext
registered module manifests
enabled OrgModule rows
subscription status
user permissions
Business Object navigation rules
Kernel settings route definitions
```

The sidebar should not fetch permissions from the client.

The browser may receive a filtered navigation tree, such as:

```ts
type ResolvedNavSection = {
  id: string
  label: string
  items: ResolvedNavItem[]
}

type ResolvedNavItem = {
  id: string
  label: string
  href: string
  icon?: string
  requiredPermission?: {
    module: string
    resource: string
    action: string
  }
}
```

The client sidebar component receives only already-authorized navigation items.

---

# 16. Navigation Sections

Recommended sidebar sections:

```txt
Core
  Dashboard

Records
  Employees
  Products
  Customers
  Suppliers
  Warehouses

Modules
  Inventory
  Leave
  CRM
  Purchasing
  Expenses
  Assets
  Visitors
  Incidents

Administration
  Settings
```

Rules:

```txt
Core routes are Kernel-owned.
Records routes are Business Object-owned.
Module routes are module-owned.
Administration routes are Kernel-owned.
```

The exact visual labels may evolve, but the ownership boundaries must remain clear.

---

# 17. Navigation Visibility Rules

A navigation item is visible only if all applicable checks pass.

For Kernel admin routes:

```txt
authenticated
tenant member
organization route valid
required kernel permission
```

For Business Object routes:

```txt
authenticated
tenant member
required objects.* permission
```

For Module routes:

```txt
authenticated
tenant member
organization subscription allows module access
module enabled for organization
required module permission
```

For suspended organizations:

```txt
dashboard may show suspended notice
settings/billing may be accessible to admins
normal module routes blocked
```

The exact suspended-org access matrix belongs in subscriptions and AppCare documents, but the shell must support it.

---

# 18. Sidebar Active State Matching

Sidebar active state must be segment-aware.

Bad:

```ts
pathname.startsWith(href)
```

Why bad:

```txt
/inventory matches /inventory-audit
/crm matches /crm-old
/assets matches /assets-reporting
```

Good conceptual behavior:

```txt
href: /acme/inventory
active:
  /acme/inventory
  /acme/inventory/stock-levels
not active:
  /acme/inventory-audit
```

Recommended helper:

```ts
export function isRouteActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}
```

However, this helper should be used only after both paths are normalized.

It should handle:

```txt
trailing slashes
query strings excluded
hash fragments excluded
URL decoding edge cases
```

Tests must prove:

```txt
/inventory active for /inventory
/inventory active for /inventory/stock-levels
/inventory not active for /inventory-audit
/settings active for /settings/users
/settings not active for /settings-old
```

The old MVP had unsafe prefix active matching; the restarted build must not repeat that.

---

# 19. Breadcrumbs

Breadcrumbs should be derived from route metadata and page context.

Examples:

```txt
Dashboard
Records / Products
Records / Products / New Product
Inventory / Stock Levels
Inventory / Adjustments / New Adjustment
Settings / Users
```

Breadcrumbs must not leak records the user cannot access.

For dynamic detail pages, the page must fetch the record through tenant-safe service helpers before rendering the record label.

If the record is not accessible:

```txt
return safe 404
```

not:

```txt
breadcrumb shows hidden record name
```

Breadcrumb metadata may come from:

```txt
Kernel route definitions
Business Object route definitions
Module manifest route metadata
page-local route metadata
```

---

# 20. Header Architecture

The app header should show:

```txt
organization name
current user avatar/menu
possibly quick command trigger later
possibly environment badge in non-production
possibly subscription/suspended notice
```

It should not show:

```txt
raw orgId
database IDs
debug data in production
module counts that reveal hidden modules
billing internals to unauthorized users
```

The user menu may include:

```txt
Profile
Keyboard shortcuts
Sign out
```

Future items may include:

```txt
Switch organization
Support
Theme toggle
```

But multi-org users and support access are deferred.

---

# 21. Organization Switcher

MVP users belong to exactly one organization.

Therefore, no organization switcher is needed in MVP.

Do not implement:

```txt
multi-org switcher
support impersonation org switcher
staff global org picker
client selector
superadmin org browser
```

without future ADR/manual documents.

If a future multi-org user model is approved, it must update:

```txt
authentication
tenancy
PlatformContext
permissions
routing
navigation
audit/security
support access
testing
```

---

# 22. Route Failure Behavior

Route failures must be safe and consistent.

## 22.1 Unauthenticated Page Request

```txt
/[orgSlug]/dashboard
```

Expected:

```txt
redirect to /login
```

Optional return URL may be included later, but it must be validated.

## 22.2 Wrong Organization

User from Org A requests:

```txt
/org-b/dashboard
```

Expected:

```txt
safe 404
```

Do not reveal:

```txt
Org B exists
You are not a member of Org B
```

## 22.3 Missing Permission

User lacks permission for:

```txt
/acme/settings/users
```

Expected page behavior:

```txt
permission denied page
or safe 404 depending sensitivity
```

Recommended:

```txt
403-style permission page for same-org known route
404 for wrong-org or disabled module
```

## 22.4 Disabled Module

User accesses:

```txt
/acme/inventory
```

when Inventory is not enabled.

Expected:

```txt
safe 404 MODULE_NOT_FOUND
```

The module should not appear in sidebar.

## 22.5 Suspended Organization

User accesses normal module route:

```txt
/acme/inventory
```

when org is suspended.

Expected:

```txt
billing/suspended state page
or access blocked page
```

Allowed routes may include:

```txt
dashboard suspended notice
settings/billing for admins
support instructions
```

Do not delete data.

## 22.6 Missing Record

User accesses:

```txt
/acme/records/products/prod_123
```

but product does not exist, belongs to another org, or is soft-deleted.

Expected:

```txt
safe 404
```

Do not reveal whether the record ID exists in another organization.

---

# 23. API Route Failure Behavior

API routes must use the Kernel API contract.

Examples:

## Unauthenticated API

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

Status:

```txt
401
```

## Wrong Organization

```json
{
  "data": null,
  "error": {
    "code": "ORG_NOT_FOUND",
    "message": "Organization not found."
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

Status:

```txt
404
```

## Missing Permission

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

Status:

```txt
403
```

## Disabled Module

```json
{
  "data": null,
  "error": {
    "code": "MODULE_NOT_FOUND",
    "message": "Module not found."
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

Status:

```txt
404
```

APIs must never return redirects or login HTML.

---

# 24. Page-Level Permission Checks

Page-level checks are for:

```txt
access control
navigation consistency
better user experience
early failure before expensive data loading
```

Page-level checks do not replace:

```txt
API checks
service checks
database tenant scoping
```

A page may call:

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'read',
})
```

or:

```ts
await sdk.permissions.require(ctx, {
  module: 'inventory',
  resource: 'stock_level',
  action: 'read',
})
```

Then load data through services.

---

# 25. Service-Level Checks

Services must receive verified `PlatformContext`.

Good:

```ts
await InventoryService.listStockLevels(ctx, input)
```

Bad:

```ts
await InventoryService.listStockLevels(orgId)
```

Good:

```ts
const db = sdk.getDb(ctx)
```

Bad:

```ts
const db = sdk.getDb(orgId)
```

The app shell helps create context for pages, but services remain responsible for safe behavior.

---

# 26. Layout Data Loading Rules

The tenant layout should load only shell-level data:

```txt
current user
organization
subscription
roles/permissions
enabled modules
navigation
```

It should not load heavy module data.

Do not load:

```txt
all products
all employees
all opportunities
all stock levels
all incidents
large dashboard datasets
```

in the shell.

Pages load their own business data.

This keeps navigation fast and reduces wasted queries.

---

# 27. Caching Rules

Tenant-specific pages and APIs must not be globally cached.

Use cautious server rendering defaults.

Rules:

```txt
tenant pages should be dynamic
tenant APIs should be dynamic
do not statically generate org pages
do not cache permission-sensitive data globally
do not cache navigation across users unless permission-aware
do not cache module enablement without invalidation strategy
```

Future caching requires ADR/manual review because caching can cause cross-tenant or cross-permission leaks.

---

# 28. Client Components in the Shell

Client components may be used for:

```txt
sidebar collapse
user menu dropdown
theme toggle
mobile sheet
command-menu trigger
optimistic UI actions
dialogs
forms
Motion animations
```

Client components must not import:

```txt
@/sdk/server
@/kernel/*
@/lib/env.server
raw Prisma
Supabase admin client
service role key helpers
server-only module services
```

Client components receive safe props from server components.

---

# 29. Mobile Shell

MVP should support basic responsive behavior:

```txt
desktop: fixed sidebar + header
tablet/mobile: collapsed sidebar or sheet menu
```

Mobile must not use a separate routing model.

Do not create:

```txt
/mobile/[orgSlug]/...
```

or module-specific mobile routes for MVP.

Responsive behavior belongs in the shared app shell.

---

# 30. Command Menu

A command menu is desirable later because OneDayOS should be keyboard-first.

MVP may include a command-menu shell trigger only if it is navigation-only.

Allowed early:

```txt
Open command menu
Navigate to visible routes
Search visible navigation items
```

Deferred:

```txt
global data search
AI command execution
record search
cross-module search
mutations from command menu
```

Command menu items must be built from the same server-resolved navigation tree.

Do not allow the client to discover hidden routes.

---

# 31. Route Metadata

Routes should eventually have metadata such as:

```ts
type RouteMeta = {
  id: string
  label: string
  href: string
  owner: 'kernel' | 'business-object' | 'module'
  moduleId?: string
  requiredPermission?: PermissionRequirement
  showInSidebar?: boolean
  showInCommandMenu?: boolean
  breadcrumbs?: string[]
}
```

For MVP, this may be simple static definitions and module manifest metadata.

But do not scatter route labels and permissions across random components.

The long-term goal is:

```txt
navigation
breadcrumbs
command menu
page titles
access checks
documentation
```

should share route metadata.

---

# 32. Module Manifest Relationship

Module manifests declare navigation, but the platform resolves visibility.

A module manifest may define:

```ts
navigation: [
  {
    label: 'Stock Levels',
    href: '/inventory/stock-levels',
    requiredPermission: {
      module: 'inventory',
      resource: 'stock_level',
      action: 'read',
    },
  },
]
```

The module manifest does not decide:

```txt
whether this org has module enabled
whether current user can see it
whether subscription permits it
whether org is suspended
```

The Kernel shell resolves those.

---

# 33. Preventing Missing Route Links

The old MVP shell had sidebar links to routes that did not exist.

The restarted build must prevent this.

Rules:

```txt
Every sidebar nav item must point to an implemented route or explicitly hidden placeholder.
Generated module nav must generate matching page route.
Route manifest tests must verify nav hrefs.
No final sidebar link may route to unimplemented 404.
```

During active development, a route may be marked:

```ts
status: 'coming-soon'
```

but then the UI must render a clear Coming Soon state, not a broken 404.

For production client delivery, enabled navigation should not contain dead routes.

---

# 34. Coming Soon Routes

Coming Soon routes may exist for internal previews, but not as a substitute for implementation.

Rules:

```txt
coming-soon routes are hidden from normal clients by default
may be visible to founder/admin in staging
must not imply AppCare support
must not appear in production handover as delivered
must not count as implemented module functionality
```

If a module is sold/enabled for a client, its core route must be real.

---

# 35. Page Titles

Every page should have a consistent title structure:

```txt
Primary title
Short description
Optional actions toolbar
Optional breadcrumbs
```

Examples:

```txt
Products
Shared product records used across Inventory, Purchasing, and Sales.

Stock Levels
Current stock position by product and warehouse.

Leave Requests
Requests submitted by employees for review and approval.
```

Titles must reflect ownership:

```txt
Products
not Inventory Products

Customers
not CRM Customers

Employees
not Leave Employees
```

Module-specific extension pages can use module labels:

```txt
Inventory Product Settings
CRM Customer Profiles
```

---

# 36. App Shell Visual Direction

The app shell should follow the Design System:

```txt
minimal
premium
data-dense
fast
calm
keyboard-friendly
not generic dashboard template
```

Avoid:

```txt
huge empty sidebar spacing
fake cards
marketing-style gradients
dashboard-template icon walls
unnecessary animations
bright orange everywhere
```

Use brand color intentionally:

```txt
active nav
primary actions
small highlights
focus points
```

Do not use brand color as every hover background.

---

# 37. Environment Badge

Non-production environments should show a subtle badge:

```txt
LOCAL
PREVIEW
STAGING
```

Production should not show a badge unless needed.

This prevents accidental testing in production.

The badge must not expose secrets or internal URLs.

---

# 38. Logout Behavior

Logout should:

```txt
call Supabase signOut
clear session cookies
redirect to /login
refresh router state
```

Logout should not:

```txt
delete Prisma User
delete Employee
delete Organization
clear organization data
```

Logout must work from any tenant route.

---

# 39. Forbidden Routing Patterns

Claude must not implement these patterns:

```txt
/api/[module]
/api/inventory?orgId=...
/api/kernel/users/[id] for current-user lookup
/[orgSlug]/modules/[moduleId]
/[orgSlug]/inventory/products for core Product CRUD
/[orgSlug]/crm/customers for core Customer CRUD
/[orgSlug]/leave/employees for core Employee CRUD
/client-a/*
/client-b/*
/admin/all-orgs without support-access spec
/superadmin without support-access spec
```

Also forbidden:

```txt
hidden orgId input fields
localStorage orgId
sessionStorage orgId
query-string orgId
body.orgId
sdk.getDb(orgId)
raw Prisma inside module pages
raw Prisma inside client components
client-side permission discovery
```

---

# 40. Required Tests

## 40.1 Tenant Shell Tests

Must prove:

```txt
unauthenticated user redirects to login
authenticated user can access own org
authenticated user cannot access another org
wrong-org access returns safe 404
inactive user is blocked
suspended org blocks normal module routes
```

## 40.2 Navigation Tests

Must prove:

```txt
enabled module appears if user has permission
enabled module does not appear if user lacks permission
disabled module does not appear even if user has wildcard permission
Business Object nav uses objects permissions
settings nav requires kernel/settings permissions
nav items do not link to missing routes
active-state matching is segment-aware
```

## 40.3 API Route Shape Tests

Must prove:

```txt
tenant APIs use /api/orgs/[orgSlug]/...
Business Object APIs use /api/orgs/[orgSlug]/objects/...
module APIs use /api/orgs/[orgSlug]/[moduleId]/...
old /api/[module] pattern does not exist
client-supplied orgId is rejected
API auth returns JSON 401
```

## 40.4 Client Component Import Tests

Architecture checks must block:

```txt
@/sdk/server inside client components
@/kernel/* inside client components
raw Prisma inside client components
server env helpers inside client components
```

## 40.5 Active State Tests

Must prove:

```txt
/inventory active for /inventory
/inventory active for /inventory/stock-levels
/inventory not active for /inventory-audit
/settings active for /settings/users
/settings not active for /settings-old
/records/products active for /records/products/[id]
/records/products not active for /records/productivity
```

## 40.6 Business Object Route Tests

Must prove:

```txt
Product CRUD route lives under /records/products
Product API lives under /objects/products
Inventory does not define Product CRUD route
Customer CRUD route lives under /records/customers
CRM does not define Customer CRUD route
Employee CRUD route lives under /records/employees
Leave does not define Employee CRUD route
```

---

# 41. Architecture Checks

`npm run check:architecture` should eventually block these route/shell patterns:

```txt
app/api/[module]
nextUrl.searchParams.get('orgId')
body.orgId
input.orgId
sdk.getDb(orgId)
import { prisma } from '@/kernel/db/client' inside modules
import '@/kernel/*' inside modules
import '@/sdk/server' inside client components
pathname.startsWith(href) in sidebar active matching
/api/kernel/users/[id] for current user lookup
```

Some checks may begin as grep/AST scripts and mature later.

The key rule:

```txt
Unsafe routing patterns should fail fast before they reach production.
```

---

# 42. Claude Implementation Rules

When Claude implements routing and app shell, it must:

```txt
use frozen manual docs
create PlatformContext in tenant shell
use page auth helpers only in pages/layouts
use API auth helpers only in APIs
use tenant-scoped API route shapes
reject client-supplied orgId
build navigation server-side
filter navigation by module enablement and permissions
use segment-aware active matching
create tests for wrong-org, disabled module, missing permission, and active matching
avoid generic admin template shell
avoid raw Prisma in modules
avoid module-to-module imports
```

Claude must stop and ask for architecture review if it wants to:

```txt
add multi-org user switching
add support impersonation
add superadmin org browser
add public API
add FastAPI
add GraphQL
add client-specific routes
add per-client app shell
add global search
add command palette data search
add runtime AI
```

---

# 43. Claude Prompt Template

Use this when implementing the shell:

```md
You are implementing the OneDayOS Routing & App Shell subsystem.

Authoritative documents:
- docs/engineering-manual/04-kernel/07-routing-app-shell.md
- docs/engineering-manual/04-kernel/01-authentication.md
- docs/engineering-manual/04-kernel/02-organizations-tenancy.md
- docs/engineering-manual/04-kernel/04-authorization-enforcement.md
- docs/engineering-manual/04-kernel/08-kernel-api-contracts.md
- docs/engineering-manual/05-sdk/01-sdk-public-api.md
- docs/engineering-manual/08-module-system/05-module-navigation.md
- docs/engineering-manual/03-design-system/02-layout-system.md

Rules:
- Do not invent architecture.
- Do not use /api/[module].
- Do not accept client-supplied orgId.
- Do not use sdk.getDb(orgId).
- Do not import @/kernel/* inside modules.
- Do not use redirect-style auth helpers in API routes.
- Build navigation server-side from PlatformContext.
- Active route matching must be segment-aware.
- Add tests for wrong-org, disabled module, missing permission, and active-state edge cases.
- Stop if required PlatformContext, SDK, or permission helpers are missing.

Task:
Implement only the Routing & App Shell subsystem described in the documents.
```

---

# 44. Acceptance Criteria

This document is satisfied when:

```txt
[ ] authenticated tenant shell exists under /[orgSlug]
[ ] shell verifies user.orgId === org.id
[ ] wrong-org access fails safely
[ ] current-user lookup uses /api/kernel/auth/me
[ ] APIs do not use /api/[module]
[ ] APIs do not accept orgId from query/body
[ ] Business Object routes live under /records/*
[ ] Business Object APIs live under /api/orgs/[orgSlug]/objects/*
[ ] Module routes live under /[orgSlug]/[moduleId]/*
[ ] Module APIs live under /api/orgs/[orgSlug]/[moduleId]/*
[ ] sidebar navigation is server-resolved
[ ] sidebar filters disabled modules
[ ] sidebar filters missing permissions
[ ] sidebar active matching is segment-aware
[ ] no sidebar links point to missing routes in production client delivery
[ ] suspended org behavior is defined and tested
[ ] client components do not import server-only code
[ ] route failure behavior is safe and consistent
[ ] tests cover auth, tenancy, module enablement, permission, active state, and old forbidden route patterns
[ ] architecture checks block unsafe route/import patterns
```

---

# 45. Final Rule

The OneDayOS app shell is the user’s first proof that this is a platform.

It must not feel like:

```txt
a generic dashboard template
a collection of folders
a hacked multi-tenant app
a module demo
```

It must feel like:

```txt
one business operating system
one organization workspace
shared records
enabled modules
consistent navigation
fast interaction
clear boundaries
safe tenant isolation
```

The route structure and app shell must make the correct architecture visible to users and hard for developers or Claude to bypass.
