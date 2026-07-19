# OneDayOS Engineering Manual — 08 Module System / 05 Module Navigation

**Document ID:** `08-module-system/05-module-navigation.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Architecture  
**Last Updated:** July 2026  
**Implementation Allowed:** No, not until marked `Frozen`  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `03-design-system/02-layout-system.md` — planned
- `03-design-system/03-component-standards.md` — planned
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/01-tenancy-data-isolation.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/02-module-loader-registry.md`
- `08-module-system/03-module-folder-contract.md`
- `08-module-system/04-module-permissions.md`

---

## 1. Purpose

This document defines how navigation works in OneDayOS business modules.

Navigation is not just a sidebar concern. In OneDayOS, navigation is the visible expression of:

1. The current organization.
2. Enabled modules.
3. User permissions.
4. Module manifests.
5. Kernel routes.
6. Business Object routes.
7. Client configuration.
8. Platform design standards.

The restarted build must not recreate the old MVP behavior where sidebar links could point to missing routes, active-state matching used unsafe prefix logic, and module navigation could appear without complete permission/module checks.

The goal of this document is to make navigation predictable, secure, generated, and consistent across every module.

---

## 2. Core Rule

Navigation is derived from platform state.

It is never hard-coded per client.

```txt
Verified PlatformContext
  ↓
Known module registry
  ↓
OrgModule enablement
  ↓
User permissions
  ↓
Module manifest navigation
  ↓
Kernel app shell rendering
```

The sidebar must answer this question:

> What is this verified user allowed to see inside this verified organization right now?

But hiding or showing a navigation item is not security.

The route, API, and service still enforce authorization.

---

## 3. Why Module Navigation Matters

OneDayOS is intended to serve many organizations from one platform codebase.

That means navigation must be:

1. **Tenant-aware** — one organization’s enabled modules do not leak into another organization’s UI.
2. **Permission-aware** — users only see module areas they can access.
3. **Manifest-driven** — module authors declare navigation once.
4. **Design-system consistent** — every module feels like part of OneDayOS.
5. **Route-safe** — links must correspond to real pages.
6. **Active-state safe** — `/inventory` must not accidentally match `/inventory-audit`.
7. **Generator-friendly** — generated modules should receive correct navigation by default.
8. **Future-compatible** — navigation can later support search, command menu, AI, marketplace modules, and client settings.

Navigation mistakes are product-quality problems and security-adjacent problems.

A user seeing a link to a disabled module creates confusion.

A user seeing a link to a module they cannot access creates support noise.

A route allowing access because the sidebar hid the link but the API forgot permission enforcement is a security failure.

---

## 4. Scope

This document defines:

1. Navigation sources.
2. Navigation resolution pipeline.
3. Kernel navigation.
4. Business Object navigation.
5. Module navigation.
6. Settings navigation.
7. Manifest navigation contract.
8. Href rules.
9. Active-state rules.
10. Permission-aware rendering.
11. Module-enabled rendering.
12. Sidebar grouping.
13. Child navigation.
14. Empty navigation states.
15. Disabled-module behavior.
16. Breadcrumb behavior.
17. Badge/count behavior.
18. Responsive/collapsed sidebar behavior.
19. Keyboard and command-menu readiness.
20. Generated module requirements.
21. Test requirements.
22. Forbidden patterns.
23. Claude implementation instructions.

---

## 5. Non-Goals

This document does not define:

1. Final visual design tokens. Those belong to the Design System documents.
2. Full sidebar component styling. That belongs to `03-design-system/02-layout-system.md` and `03-design-system/03-component-standards.md`.
3. RBAC storage. That belongs to `04-kernel/03-users-roles-permissions.md`.
4. Permission enforcement algorithm. That belongs to `04-kernel/04-authorization-enforcement.md`.
5. Module enablement storage. That belongs to the Kernel and Module Registry documents.
6. Role-management UI.
7. Per-user custom navigation ordering.
8. Drag-and-drop custom dashboards.
9. Marketplace remote modules.
10. FastAPI navigation or routing behavior. FastAPI is excluded from the core platform.

---

## 6. Mental Model

A navigation item is a pointer to a route.

It is displayed only when all required gates pass.

```txt
Does the user have a valid session?
  ↓
Does the user belong to this organization?
  ↓
Is the organization active enough to access this area?
  ↓
Is the module known to the platform?
  ↓
Is the module enabled for this organization?
  ↓
Does the user have permission required by this nav item?
  ↓
Render nav item
```

A navigation item is not allowed to make security decisions by itself.

The same permission requirement used to display a nav item must also be used by the destination route/API/service.

---

## 7. Navigation Sources

OneDayOS navigation is assembled from five sources.

### 7.1 Kernel Navigation

Kernel navigation is owned by the platform.

Examples:

```txt
Dashboard
Users
Roles
Organization Settings
Billing / Subscription
Module Settings
```

Kernel navigation must be declared in Kernel-owned navigation configuration, not inside business modules.

Required location:

```txt
src/platform/navigation/kernel-navigation.ts
```

or:

```txt
src/kernel/navigation/kernel-navigation.ts
```

The exact file path may be decided during implementation, but it must not live inside a business module.

### 7.2 Business Object Navigation

Business Object navigation is owned by the Business Objects layer.

Examples:

```txt
Employees
Products
Customers
Suppliers
Warehouses
```

Business Object navigation must use `objects.*` permissions.

Examples:

```txt
objects.employee.read
objects.product.read
objects.customer.read
objects.supplier.read
objects.warehouse.read
```

Business Objects are not module navigation.

Product does not appear under Inventory because Inventory does not own Product.

Customer does not appear under CRM because CRM does not own Customer.

Employee does not appear under Leave because Leave does not own Employee.

The UI may visually group Business Objects near modules for convenience, but the architecture must preserve ownership.

### 7.3 Module Navigation

Module navigation is declared by each module manifest.

Examples:

```txt
Inventory
Stock Levels
Stock Movements
Adjustments
Leave Requests
CRM Pipeline
Visitors
Incidents
```

Module navigation belongs to the module that owns the workflow or module-owned entity.

Inventory can declare navigation for `Stock Levels` because stock levels are Inventory-owned behavior.

Inventory must not declare navigation for core `Products` unless the target route is explicitly an Inventory extension view, not the canonical Product directory.

### 7.4 Settings Navigation

Settings navigation is mixed:

1. Kernel owns organization/account/security settings.
2. Modules may declare module settings pages.
3. Platform Services may eventually declare service settings pages.

Module settings must still respect module enablement and permissions.

Examples:

```txt
/settings/organization
/settings/users
/settings/roles
/settings/modules
/settings/inventory
/settings/leave
```

For MVP, settings navigation can be simple and Kernel-rendered.

Do not let every module invent a separate settings layout.

### 7.5 Utility Navigation

Utility navigation includes future platform surfaces such as:

```txt
Global Search
Command Menu
AI Assistant
Help
Support
Notifications
```

Most of these are deferred.

The navigation contract should not block them, but the restarted MVP should not implement them prematurely.

---

## 8. Navigation Resolution Pipeline

The canonical server-side navigation resolver should follow this order:

```ts
const ctx = await sdk.auth.requirePageOrgContext(orgSlug)

const knownModules = moduleRegistry.getRegistered()
const enabledModules = await moduleRegistry.getEnabledForOrg(ctx)
const kernelNav = getKernelNavigation()
const objectNav = getBusinessObjectNavigation()
const moduleNav = getModuleNavigation(enabledModules)

const resolvedNav = await filterNavigationForContext(ctx, [
  ...kernelNav,
  ...objectNav,
  ...moduleNav,
])
```

The resolver must not accept `orgId` from the client.

The resolver must not trust only `orgSlug`.

The resolver must use verified `PlatformContext`.

Recommended function:

```ts
export async function getNavigationForContext(
  ctx: PlatformContext
): Promise<ResolvedNavigation>
```

Recommended location:

```txt
src/platform/navigation/server.ts
```

or:

```txt
src/kernel/navigation/server.ts
```

This function should be server-only.

Client components receive already-resolved navigation data.

---

## 9. Navigation Item Contract

### 9.1 Canonical Type

The canonical navigation item shape should be:

```ts
export type NavigationItem = {
  key: string
  label: string
  href: string
  icon?: LucideIconName
  requiredPermission: PermissionRequirement
  exact?: boolean
  order?: number
  group?: NavigationGroupKey
  children?: NavigationItem[]
  badge?: NavigationBadgeDefinition
  description?: string
}
```

Where:

```ts
export type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Example:

```ts
{
  key: 'inventory.stock_levels',
  label: 'Stock Levels',
  href: '/inventory/stock-levels',
  icon: 'Boxes',
  requiredPermission: {
    module: 'inventory',
    resource: 'stock_level',
    action: 'read',
  },
  exact: false,
  order: 20,
  group: 'operations',
}
```

### 9.2 `key`

`key` is a stable UI/navigation identity.

Rules:

1. It must be globally unique.
2. It should use dot notation.
3. It should not contain org slugs.
4. It should not contain database IDs.
5. It should not change casually because saved preferences and analytics may later depend on it.

Examples:

```txt
kernel.dashboard
objects.employee.list
objects.product.list
inventory.dashboard
inventory.stock_levels
inventory.adjustments
leave.requests
crm.pipeline
```

### 9.3 `label`

`label` is the display text.

Rules:

1. Use short nouns where possible.
2. Avoid implementation terms.
3. Avoid module duplication in every label.
4. Avoid vague labels like `Records`, `Management`, or `Module`.

Good:

```txt
Stock Levels
Adjustments
Leave Requests
Pipeline
Visitors
Incidents
```

Bad:

```txt
Inventory Management
Inventory Records
Manage Inventory Data
Module Home
```

### 9.4 `href`

`href` is relative to the organization shell.

Correct:

```ts
href: '/inventory/stock-levels'
href: '/objects/products'
href: '/settings/users'
```

The platform renders:

```txt
/[orgSlug]/inventory/stock-levels
/[orgSlug]/objects/products
/[orgSlug]/settings/users
```

Forbidden:

```ts
href: '/acme-corp/inventory/stock-levels'
href: 'https://client-a.onedayonlysystems.com/inventory'
href: '/api/orgs/acme-corp/inventory/products'
href: 'inventory/stock-levels'
href: '../settings'
```

Reasons:

1. Module manifests must not know organization slugs.
2. Module navigation must not link to APIs.
3. Relative paths without leading `/` create ambiguity.
4. External links belong to explicit link components, not module navigation.

### 9.5 `icon`

Icons should use approved Lucide icon names.

Rules:

1. Use one primary icon per top-level nav item.
2. Avoid icon-only meaning for important actions.
3. Do not import icon components inside manifest files.
4. Store icon names as strings.
5. The platform shell resolves icon names to components.

Correct:

```ts
icon: 'Package'
icon: 'Users'
icon: 'Warehouse'
icon: 'ClipboardList'
```

Forbidden:

```ts
icon: <Package />
icon: Package
```

Reason:

The manifest must remain declarative and safely importable.

### 9.6 `requiredPermission`

Every visible navigation item must declare a required permission.

Correct:

```ts
requiredPermission: {
  module: 'inventory',
  resource: 'stock_level',
  action: 'read',
}
```

For Business Objects:

```ts
requiredPermission: {
  module: 'objects',
  resource: 'product',
  action: 'read',
}
```

For Kernel settings:

```ts
requiredPermission: {
  module: 'kernel',
  resource: 'user',
  action: 'read',
}
```

Navigation without permissions is forbidden except for very limited shell utilities that are available to all authenticated users, such as the current user's own profile menu.

### 9.7 `exact`

`exact` controls active-state matching.

Use `exact: true` when only the exact route should be active.

Example:

```ts
{
  href: '/inventory',
  exact: true,
}
```

Use `exact: false` when child pages should also keep the parent active.

Example:

```ts
{
  href: '/inventory/stock-levels',
  exact: false,
}
```

This would match:

```txt
/acme/inventory/stock-levels
/acme/inventory/stock-levels/product-123
```

It must not match:

```txt
/acme/inventory-stock-levels
/acme/inventory-audit
```

### 9.8 `order`

`order` controls ordering within a group.

Rules:

1. Use increments of `10` to leave room for future insertion.
2. Lower numbers appear first.
3. Missing order defaults to `1000`.
4. Ties sort alphabetically by label.

Example:

```ts
order: 10
order: 20
order: 30
```

### 9.9 `group`

`group` groups navigation into stable sections.

Recommended MVP group keys:

```ts
type NavigationGroupKey =
  | 'home'
  | 'directory'
  | 'operations'
  | 'sales'
  | 'people'
  | 'finance'
  | 'admin'
  | 'settings'
```

The visual group labels should be defined by the app shell, not by every module.

Do not let modules invent arbitrary group labels without review.

### 9.10 `children`

Nested navigation is allowed but should be used sparingly.

Rules:

1. MVP should prefer one-level sidebar navigation.
2. Children may be used for complex modules once needed.
3. Parent items with children may be clickable or section-only, but the behavior must be explicit.
4. Child visibility must be permission-filtered independently.
5. If a parent has no visible children and no own route, hide the parent.

Do not build a deeply nested ERP menu tree in the MVP.

OneDayOS should feel fast and modern, not like legacy ERP software.

### 9.11 `badge`

Badges are optional and deferred unless a module already has safe data to show.

Examples:

```txt
Low stock count
Pending leave request count
Open incident count
```

Rules:

1. Badge data must be tenant-scoped.
2. Badge data must be permission-aware.
3. Badge data must not be fetched inside the manifest.
4. Badge data must not slow down the shell.
5. Badge data should be fetched separately or deferred.

The manifest may declare that a badge exists, but not execute badge queries.

Example:

```ts
badge: {
  type: 'count',
  source: 'inventory.low_stock_count',
}
```

The resolver decides whether and when to load the count.

---

## 10. Module Navigation Contract

A module may declare navigation only for routes it owns.

For module `inventory`, valid module navigation hrefs begin with:

```txt
/inventory
/inventory/...
```

Examples:

```ts
navigation: {
  primary: [
    {
      key: 'inventory.dashboard',
      label: 'Inventory',
      href: '/inventory',
      icon: 'Package',
      requiredPermission: {
        module: 'inventory',
        resource: 'dashboard',
        action: 'read',
      },
      exact: true,
      order: 10,
    },
    {
      key: 'inventory.stock_levels',
      label: 'Stock Levels',
      href: '/inventory/stock-levels',
      icon: 'Boxes',
      requiredPermission: {
        module: 'inventory',
        resource: 'stock_level',
        action: 'read',
      },
      exact: false,
      order: 20,
    },
  ],
}
```

Forbidden in Inventory manifest:

```ts
href: '/objects/products'
```

Reason:

Product is a shared Business Object route, not Inventory-owned navigation.

Inventory may have an Inventory-specific Product Extension route if needed:

```ts
href: '/inventory/product-settings'
```

But the canonical Product directory remains:

```txt
/[orgSlug]/objects/products
```

---

## 11. Business Object Navigation Contract

Business Object navigation should be declared centrally.

Recommended path:

```txt
/[orgSlug]/objects/employees
/[orgSlug]/objects/products
/[orgSlug]/objects/customers
/[orgSlug]/objects/suppliers
/[orgSlug]/objects/warehouses
```

Corresponding nav hrefs:

```txt
/objects/employees
/objects/products
/objects/customers
/objects/suppliers
/objects/warehouses
```

Permission requirements:

```ts
{ module: 'objects', resource: 'employee', action: 'read' }
{ module: 'objects', resource: 'product', action: 'read' }
{ module: 'objects', resource: 'customer', action: 'read' }
{ module: 'objects', resource: 'supplier', action: 'read' }
{ module: 'objects', resource: 'warehouse', action: 'read' }
```

Business Object navigation belongs in a group such as:

```txt
Directory
```

or:

```txt
Records
```

I recommend `Directory` because it communicates shared reference data better than `Records`.

MVP recommendation:

```txt
Dashboard
Directory
  Employees
  Products
  Customers
  Suppliers
  Warehouses
Operations
  Inventory
  Leave
  Purchasing
Settings
```

But the final visual grouping should be settled in the Design System / Layout documents.

---

## 12. Kernel Navigation Contract

Kernel navigation belongs to platform-level surfaces.

Examples:

```txt
Dashboard
Users
Roles
Modules
Organization Settings
Billing
```

Recommended hrefs:

```txt
/dashboard
/settings/organization
/settings/users
/settings/roles
/settings/modules
/settings/billing
```

Permission requirements:

```ts
{ module: 'kernel', resource: 'dashboard', action: 'read' }
{ module: 'kernel', resource: 'organization', action: 'read' }
{ module: 'kernel', resource: 'user', action: 'read' }
{ module: 'kernel', resource: 'role', action: 'read' }
{ module: 'kernel', resource: 'module', action: 'read' }
{ module: 'kernel', resource: 'billing', action: 'read' }
```

MVP may allow all authenticated users to see the dashboard, but the permission contract should still exist.

Do not special-case Kernel navigation in scattered sidebar code.

Declare it once and feed it through the same resolver.

---

## 13. Route Structure Rules

### 13.1 Page Routes

Module pages live under:

```txt
src/app/(platform)/[orgSlug]/[moduleId]/...
```

Examples:

```txt
src/app/(platform)/[orgSlug]/inventory/page.tsx
src/app/(platform)/[orgSlug]/inventory/stock-levels/page.tsx
src/app/(platform)/[orgSlug]/leave/requests/page.tsx
```

Business Object pages live under:

```txt
src/app/(platform)/[orgSlug]/objects/[object]/...
```

Examples:

```txt
src/app/(platform)/[orgSlug]/objects/products/page.tsx
src/app/(platform)/[orgSlug]/objects/customers/page.tsx
```

Settings pages live under:

```txt
src/app/(platform)/[orgSlug]/settings/...
```

### 13.2 API Routes

Navigation links must never point to API routes.

API routes live under:

```txt
/api/orgs/[orgSlug]/...
```

Examples:

```txt
/api/orgs/[orgSlug]/inventory/stock-levels
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/settings/users
```

The sidebar only links to pages.

### 13.3 Route Existence

Every manifest-declared navigation href must have a corresponding page route.

This should be tested by static route validation where possible.

At minimum, generated modules must create the page route for every generated nav item.

Do not ship a sidebar that links to routes that do not exist.

---

## 14. Active-State Matching

### 14.1 Problem

Unsafe prefix matching creates false active states.

Bad:

```ts
pathname.startsWith(href)
```

This causes:

```txt
/inventory matches /inventory-audit
/settings matches /settings-advanced
```

The previous MVP had this risk. The restarted build must not repeat it.

### 14.2 Required Matching Function

Implement a route-aware helper.

Recommended:

```ts
export function isNavigationItemActive(args: {
  pathname: string
  orgSlug: string
  href: string
  exact?: boolean
}): boolean {
  const orgHref = `/${args.orgSlug}${args.href}`
  const current = normalizePath(args.pathname)
  const target = normalizePath(orgHref)

  if (args.exact) return current === target

  return current === target || current.startsWith(`${target}/`)
}
```

Helper rules:

1. Normalize trailing slashes.
2. Normalize repeated slashes.
3. Compare against the full organization path.
4. For non-exact matches, require a segment boundary.
5. Do not use raw `startsWith(href)`.

### 14.3 Examples

Given:

```txt
orgSlug = acme
href = /inventory
exact = false
```

Matches:

```txt
/acme/inventory
/acme/inventory/stock-levels
/acme/inventory/stock-levels/123
```

Does not match:

```txt
/acme/inventory-audit
/acme/inventory_old
/acme/settings/inventory
/beta/inventory
```

Given:

```txt
href = /inventory
exact = true
```

Matches only:

```txt
/acme/inventory
```

Does not match:

```txt
/acme/inventory/stock-levels
```

### 14.4 Tests Required

The active matcher must have tests for:

```txt
exact route match
child route match
trailing slash normalization
/inventory not matching /inventory-audit
/settings not matching /settings-advanced
wrong org slug not matching
root dashboard exact matching
```

---

## 15. Permission-Aware Navigation

### 15.1 Default Behavior

If the user lacks the required permission, hide the navigation item.

Example:

```txt
User lacks inventory.stock_adjustment.create
→ Hide "Adjustments" create entry or action nav.
```

For page navigation, use read permission:

```txt
inventory.stock_adjustment.read
```

### 15.2 Hidden Navigation Is Not Security

This must be repeated in code comments and tests:

```txt
Navigation visibility is not authorization.
```

Even if a link is hidden, a user can manually enter the URL or call the API.

Therefore:

1. Page routes must resolve `PlatformContext`.
2. Page routes must check module enablement when module-owned.
3. APIs must enforce permissions.
4. Services must enforce permissions for sensitive operations.

### 15.3 Parent/Child Visibility

If a parent has children:

1. Filter children first.
2. If any child remains, show the parent.
3. If no child remains but the parent has its own route and permission, show the parent.
4. If no child remains and parent has no own route, hide the parent.

### 15.4 Admin Wildcard

Admin wildcard permissions may make nav items visible.

But wildcard permission never bypasses:

1. Tenant membership.
2. Module enablement.
3. Organization active/suspended restrictions.
4. Route/API/service security.

Admin in Org A cannot see Org B navigation.

---

## 16. Module Enablement Navigation

A module must be both registered and enabled before its navigation appears.

```txt
Registered in codebase? yes
Enabled for org? yes
User has permission? yes
→ show module nav
```

If any gate fails, the nav item is hidden.

### 16.1 Registered but Not Enabled

If a module exists in code but is not enabled for the organization:

```txt
Do not show its nav.
Do not allow its routes.
Do not allow its APIs.
```

For direct route/API access, return safe module-not-found behavior:

```txt
404 MODULE_NOT_FOUND
```

This avoids revealing commercial/module availability details to unauthorized users.

### 16.2 Enabled but User Lacks Permission

If a module is enabled but the user lacks permission:

```txt
Hide nav item.
Direct page access should show 403 or permission-denied page.
API access should return 403 JSON.
```

Within the same verified organization, a permission denial can be explicit.

Across organizations or disabled modules, prefer safe 404 behavior.

### 16.3 Suspended Organization

If an organization is suspended:

1. Users may still access limited account/billing/support pages.
2. Business module navigation should be hidden or blocked.
3. Kernel should show a clear suspended-state banner.
4. APIs for business modules should return a structured suspension error or 403 depending on the Kernel API contract.

Suspension logic belongs to Kernel context resolution, not individual modules.

---

## 17. Navigation Groups

MVP navigation should use a small number of stable groups.

Recommended:

```txt
Home
Directory
Operations
Sales
People
Finance
Admin
Settings
```

### 17.1 Recommended Initial Sidebar

For a client with Inventory enabled:

```txt
Home
  Dashboard

Directory
  Employees
  Products
  Suppliers
  Warehouses

Operations
  Inventory
  Stock Levels
  Stock Movements
  Adjustments

Admin
  Users
  Roles
  Modules

Settings
  Organization
  Billing
```

This is illustrative, not final design.

The final visual grouping belongs to the Design System / Layout documents.

### 17.2 Group Ordering

Recommended group order:

```txt
home       10
directory 20
operations 30
sales      40
people     50
finance    60
admin      90
settings   100
```

Module items should declare their group and order.

If a module does not declare a group, default to `operations`.

If a nav item is settings-related, it should usually be placed under Settings, not the main module group.

### 17.3 Empty Groups

Do not render empty groups.

Do not render group headings if there is only one group and visual design calls for minimal navigation.

Do not show groups that contain only hidden items.

---

## 18. Sidebar Behavior

### 18.1 Sidebar Data

The sidebar should receive resolved data.

Good:

```tsx
<AppShell navigation={navigation} />
```

Bad:

```tsx
<Sidebar orgId={orgId} />
```

Reason:

Client components should not resolve permissions, module enablement, or tenant context.

Those are server concerns.

### 18.2 Collapsed Sidebar

Collapsed sidebar behavior:

1. Shows icons only.
2. Uses tooltips for labels.
3. Preserves keyboard focus order.
4. Does not change which items are visible.
5. Does not fetch new authorization data on the client.

Collapsed state may be client-local in MVP.

Persisting per-user sidebar preference is deferred.

### 18.3 Mobile Navigation

MVP can use a drawer/sheet on small screens.

Rules:

1. Same resolved navigation data.
2. Same permission filtering.
3. Same active matching.
4. Same route href rules.
5. No separate mobile-only permission logic.

### 18.4 Tooltips

Non-obvious icons should have short tooltips.

Tooltips are UX help, not documentation.

Tooltip rule:

```txt
1–2 sentences max.
No permission/security details.
No technical IDs.
```

Example:

```txt
Stock Levels: View current product quantities by warehouse.
```

---

## 19. Breadcrumbs

Breadcrumbs should be derived from route and navigation metadata where possible.

Example:

```txt
Inventory / Stock Levels / Product ABC
```

Rules:

1. Breadcrumbs must not query tenant data in client components.
2. Static route segments can come from navigation definitions.
3. Dynamic labels may be fetched server-side by the page.
4. Breadcrumbs must not expose records from another organization.
5. Breadcrumbs must respect permission boundaries.

Example for detail page:

```tsx
<Breadcrumb
  items={[
    { label: 'Inventory', href: `/${orgSlug}/inventory` },
    { label: 'Stock Levels', href: `/${orgSlug}/inventory/stock-levels` },
    { label: stockLevel.productName },
  ]}
/>
```

The `stockLevel.productName` must be loaded using `PlatformContext` and tenant-scoped queries.

---

## 20. Command Menu Readiness

OneDayOS should eventually be keyboard-first.

Navigation metadata should be usable by a future command menu.

Therefore each nav item should have:

1. Stable `key`.
2. Human label.
3. Href.
4. Optional description.
5. Required permission.
6. Module owner.
7. Group.

The command menu should reuse the resolved navigation list, not reimplement permission filtering.

MVP does not need a full command menu.

But do not design navigation in a way that prevents it.

---

## 21. Search and AI Readiness

Future Search and AI can use navigation metadata to understand available app surfaces.

Rules:

1. AI must receive only navigation items available to the current user.
2. AI must not use hidden navigation to infer unavailable modules.
3. Search results must respect tenant and permission boundaries.
4. Module manifests may describe routes, but actual user-visible navigation must come from resolved navigation.

MVP should not implement AI navigation actions yet.

But the metadata should remain clean enough to support them later.

---

## 22. Client Configuration

In MVP, navigation labels and structure come from platform/module definitions.

Per-organization navigation customization is deferred.

Allowed in MVP:

```txt
Enable/disable modules per org
Show/hide items based on permissions
Basic ordering from manifests
```

Deferred:

```txt
Per-org custom nav labels
Per-user pinned nav
Custom groups
Client-specific route aliases
Drag-and-drop navigation builder
White-label nav restructuring
```

Reason:

Custom navigation too early can make training, support, screenshots, documentation, AI context, and module generation harder.

OneDayOS should standardize first.

---

## 23. Disabled, Missing, and Unknown Routes

### 23.1 Disabled Module Route

If a user directly visits a disabled module route:

```txt
/[orgSlug]/inventory
```

and Inventory is not enabled for that org:

```txt
Return safe 404 MODULE_NOT_FOUND or render notFound().
```

Do not render:

```txt
Inventory is not included in your plan.
```

unless the user has admin/billing permission and is inside their verified organization.

### 23.2 Missing Module Route

If a manifest declares a route that does not exist, this is an implementation error.

It should fail tests.

Do not leave broken links in the shell.

### 23.3 Permission-Denied Route

If module is enabled but user lacks permission:

1. Hide link in sidebar.
2. Direct page access renders permission denied.
3. API access returns `403 FORBIDDEN` JSON.

### 23.4 Wrong Organization Route

If a user from Org A visits Org B route:

```txt
/org-b/inventory
```

Kernel context resolution should fail before navigation is built.

Recommended response:

```txt
404 ORG_NOT_FOUND
```

Do not reveal whether Org B exists.

---

## 24. Module Settings Navigation

Modules may declare settings pages separately from main navigation.

Example:

```ts
settingsNavigation: [
  {
    key: 'inventory.settings',
    label: 'Inventory Settings',
    href: '/settings/inventory',
    requiredPermission: {
      module: 'inventory',
      resource: 'settings',
      action: 'read',
    },
    order: 30,
  },
]
```

Rules:

1. Module settings require module enablement.
2. Module settings require module settings permission.
3. Settings nav should be rendered inside the platform Settings area.
4. Module settings must not create separate module-owned admin shells.
5. Module settings routes still receive `PlatformContext`.

---

## 25. Navigation Data Shape Sent to Client

Client components should receive only safe navigation data.

Recommended resolved type:

```ts
export type ResolvedNavigationItem = {
  key: string
  label: string
  href: string
  icon?: LucideIconName
  group: NavigationGroupKey
  exact: boolean
  order: number
  children?: ResolvedNavigationItem[]
  description?: string
  badge?: ResolvedNavigationBadge
}
```

Do not send:

```txt
raw permission rows
role IDs
orgId
userId
subscription internals
hidden nav items
module registry internals
```

It is acceptable to send full hrefs that include `orgSlug`:

```txt
/acme/inventory/stock-levels
```

But the server should build them.

The client should not assemble tenant paths from hidden IDs.

---

## 26. Implementation Pattern

### 26.1 Server Resolver

Recommended server resolver:

```ts
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'

export async function getNavigationForContext(
  ctx: PlatformContext
): Promise<ResolvedNavigation> {
  const items = [
    ...getKernelNavigation(),
    ...getBusinessObjectNavigation(),
    ...getEnabledModuleNavigation(ctx),
  ]

  return filterAndResolveNavigation(ctx, items)
}
```

### 26.2 App Shell Usage

```tsx
export default async function OrgLayout({ children, params }: Props) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const navigation = await getNavigationForContext(ctx)

  return (
    <AppShell
      ctx={toClientShellContext(ctx)}
      navigation={navigation}
    >
      {children}
    </AppShell>
  )
}
```

Do not pass full `PlatformContext` to client components.

Use a safe shell context:

```ts
type ClientShellContext = {
  orgSlug: string
  orgName: string
  userName: string
  userAvatarUrl?: string
}
```

### 26.3 Sidebar Component

The sidebar should be a client component only for UI state:

```txt
collapsed state
mobile drawer state
hover/focus states
active route calculation
```

The sidebar should not fetch permissions.

The sidebar should not call APIs to determine module access.

The sidebar should not import `@/sdk/server`.

---

## 27. Generated Module Requirements

The module generator must produce navigation that follows this document.

Generated manifest navigation must include:

```ts
navigation: {
  primary: [
    {
      key: '[moduleId].home',
      label: '[Module Label]',
      href: '/[moduleId]',
      icon: 'Box',
      requiredPermission: {
        module: '[moduleId]',
        resource: 'dashboard',
        action: 'read',
      },
      exact: true,
      order: 10,
      group: 'operations',
    },
  ],
}
```

The generator must also create:

```txt
src/app/(platform)/[orgSlug]/[moduleId]/page.tsx
```

The generated page must:

1. Resolve `PlatformContext`.
2. Check module enablement.
3. Check permission.
4. Use server-side data loading.
5. Never accept client-supplied `orgId`.
6. Never import raw Prisma.
7. Never import `@/kernel/*` from module code.

Generated navigation must not point to:

```txt
/api/...
external URLs
missing routes
other modules' routes
Business Object canonical routes unless declared by Business Objects
```

---

## 28. Testing Requirements

### 28.1 Navigation Resolver Tests

Required tests:

```txt
authenticated user sees kernel dashboard nav
user from Org A does not resolve navigation for Org B
registered but disabled module does not appear
module enabled but user lacks permission does not appear
module enabled and user has permission appears
admin wildcard sees enabled module nav
admin wildcard does not see disabled module nav
Business Object nav uses objects permissions
settings nav uses kernel/module settings permissions
empty groups are removed
hidden nav items are not sent to client
```

### 28.2 Active-State Tests

Required tests:

```txt
exact match works
non-exact child match works
/inventory does not match /inventory-audit
/settings does not match /settings-advanced
trailing slashes are normalized
wrong org path does not match
query strings do not break matching
hash fragments do not break matching
```

### 28.3 Module Manifest Navigation Tests

Required tests:

```txt
all nav keys are unique
all hrefs start with /
no href contains org slug
no href points to /api
no href points outside the module namespace unless allowed by layer rules
all nav items have requiredPermission
all requiredPermission objects reference declared module permissions or approved objects/kernel permissions
no wildcard permissions in manifest nav
all generated nav routes exist
```

### 28.4 Permission Tests

Required tests:

```txt
user without read permission cannot see nav item
user without read permission cannot load destination page
user without read permission receives 403 from API
user cannot make nav appear by changing orgSlug
```

### 28.5 Snapshot Tests

Avoid brittle full-sidebar snapshot tests.

Prefer behavioral tests.

Allowed snapshots:

1. Resolved navigation data for a known fixture.
2. Small visual component render only if stable.

Do not use snapshots as a substitute for permission/tenant tests.

---

## 29. Architecture Checks

The architecture checker should flag:

```txt
pathname.startsWith(href)
next/link href to /api from navigation config
hard-coded org slug in manifest href
href without leading /
module nav href pointing to another module
module nav href pointing to /objects unless explicitly approved
navigation item without requiredPermission
wildcard permission in module navigation
Sidebar importing @/sdk/server
Sidebar importing @/kernel/*
module manifest importing @/kernel/*
module manifest importing service.ts
```

Recommended command:

```bash
npm run check:architecture
```

This should run in CI before the build is considered safe.

---

## 30. Forbidden Patterns

### 30.1 Hard-Coded Client Navigation

Forbidden:

```tsx
<Link href="/acme-corp/inventory">Inventory</Link>
```

Correct:

```tsx
<Link href={`/${orgSlug}/inventory`}>Inventory</Link>
```

But preferably the server resolver returns the complete href.

### 30.2 Client-Side Permission Resolution

Forbidden:

```tsx
useEffect(() => {
  fetch('/api/permissions')
}, [])
```

Correct:

```tsx
<AppShell navigation={resolvedNavigation} />
```

### 30.3 Unsafe Active Matching

Forbidden:

```ts
const active = pathname.startsWith(item.href)
```

Correct:

```ts
const active = isNavigationItemActive({ pathname, orgSlug, href: item.href, exact: item.exact })
```

### 30.4 Module Self-Navigation Outside Its Boundary

Forbidden in Inventory manifest:

```ts
href: '/leave/requests'
href: '/objects/products'
href: '/settings/users'
```

Correct:

```ts
href: '/inventory/stock-levels'
href: '/inventory/adjustments'
href: '/settings/inventory'
```

The `settings/inventory` route should be declared in module settings navigation, not primary module navigation.

### 30.5 Missing Permission

Forbidden:

```ts
{
  key: 'inventory.stock_levels',
  label: 'Stock Levels',
  href: '/inventory/stock-levels',
}
```

Correct:

```ts
{
  key: 'inventory.stock_levels',
  label: 'Stock Levels',
  href: '/inventory/stock-levels',
  requiredPermission: {
    module: 'inventory',
    resource: 'stock_level',
    action: 'read',
  },
}
```

### 30.6 Manifest Runtime Imports

Forbidden:

```ts
import { sdk } from '@/sdk/server'
import { prisma } from '@/kernel/db/client'
import { InventoryService } from './service'
```

Correct:

```ts
import type { ModuleManifest } from '@/sdk'
import { defineModuleManifest } from '@/sdk'
```

### 30.7 Broken Route Links

Forbidden:

```ts
href: '/employees'
```

if no corresponding route exists.

Every navigation href must be backed by a page route.

---

## 31. Claude Implementation Instructions

When Claude implements module navigation, give it this instruction:

```md
You are implementing OneDayOS Module Navigation.

Authoritative document:
docs/engineering-manual/08-module-system/05-module-navigation.md

Rules:
- Do not hard-code client/org-specific navigation.
- Do not use pathname.startsWith(href) for active matching.
- Do not let the sidebar fetch permissions or module enablement.
- Resolve navigation server-side from verified PlatformContext.
- Module nav appears only when module is enabled and user has permission.
- Hidden nav is not security; destination routes/APIs/services still enforce permissions.
- Navigation hrefs are org-shell relative and must start with /.
- Module manifests must not import @/kernel/*, @/sdk/server, services, or raw Prisma.
- Business Object nav uses objects.* permissions and is not owned by modules.
- Generated modules must include secure nav by default.
- Add tests for active matching, module enablement, permission filtering, and broken href prevention.
```

Claude must not decide:

1. A new navigation ownership model.
2. A new permission namespace.
3. Client-specific sidebar customization.
4. Runtime plugin navigation.
5. FastAPI routing/navigation behavior.
6. Module-to-module nav dependencies.

Claude may decide:

1. Exact internal helper file names if consistent.
2. Component decomposition inside the app shell.
3. Small UI implementation details consistent with the Design System.
4. Test helper names.

---

## 32. Acceptance Criteria

This document is satisfied when:

```txt
[ ] Navigation is resolved server-side from PlatformContext
[ ] Sidebar receives safe resolved navigation data
[ ] Module nav appears only if module is registered, enabled, and permitted
[ ] Business Object nav uses objects.* permissions
[ ] Kernel nav uses kernel.* permissions
[ ] Module nav hrefs stay inside module namespace
[ ] Settings nav is handled consistently
[ ] Active matching is segment-safe
[ ] /inventory does not match /inventory-audit
[ ] Hidden nav items are not sent to client
[ ] Disabled module routes return safe 404 behavior
[ ] Permission-denied module routes return permission-denied behavior
[ ] Generated modules include navigation metadata
[ ] Generated modules create matching page routes
[ ] Tests cover enablement, permissions, wrong-org access, active matching, and empty groups
[ ] Architecture checks block forbidden navigation patterns
```

---

## 33. New-Build Implementation Priority

For the restarted platform build, implement navigation in this order:

```txt
1. Server-side PlatformContext resolution
2. Static Kernel navigation definitions
3. Static Business Object navigation definitions
4. Module manifest navigation definitions
5. Module registry + OrgModule enablement filtering
6. Permission filtering
7. Resolved navigation DTO for AppShell
8. Segment-safe active matcher
9. Sidebar rendering
10. Empty-state handling
11. Navigation tests
12. Architecture checks
```

Do not start with sidebar styling.

Start with navigation correctness.

The visual system can improve later, but the architecture must be correct from day one.

---

## 34. Design Notes for Later Documents

The future Design System documents should decide:

1. Exact sidebar width.
2. Collapsed sidebar appearance.
3. Group heading typography.
4. Active item color.
5. Hover states.
6. Icon size.
7. Mobile drawer behavior.
8. Breadcrumb visual style.
9. Command menu behavior.
10. Empty navigation illustration/copy.

This document only defines the architecture and behavior.

---

## 35. Summary

Module navigation in OneDayOS must be:

```txt
Manifest-declared
Platform-resolved
Tenant-aware
Permission-aware
Module-enable-aware
Route-safe
Active-state safe
Design-system ready
Generator-friendly
```

The sidebar is not a list of hard-coded links.

It is the visible result of OneDayOS platform state.

The most important rules are:

```txt
No verified PlatformContext, no navigation.
No module enablement, no module nav.
No permission, no nav item.
No route, no link.
No raw prefix matching.
No client-side authorization.
No module-owned Business Object navigation.
```

If OneDayOS follows this contract, every future module can plug into the shell without creating a custom sidebar, custom route logic, or client-specific navigation fork.
