# OneDayOS Engineering Manual

## 04 Kernel / 06 Feature Flags & Subscriptions

**Document ID:** `04-kernel/06-feature-flags-subscriptions.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** Founder / Platform Architect  
**Last Updated:** July 2026  
**Implementation Status:** Required Before Restarted Foundation Build  
**Depends On:**

- `01-foundation/01-business-model.md`
- `01-foundation/03-platform-vs-modules.md`
- `04-kernel/00-kernel-overview.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/05-settings-configuration.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/01-sdk-public-api.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/02-module-loader-registry.md`

---

# 1. Purpose

This document defines how OneDayOS controls:

```txt
which organizations can use the platform,
which modules are enabled for each organization,
which plan limits apply,
which commercial states block or allow access,
and how module availability differs from user permission.
```

Feature flags and subscriptions are part of the **Kernel** because every client organization, every module, every route, every sidebar, and every AppCare workflow depends on them.

The purpose is not to build billing automation early. The purpose is to ensure the restarted OneDayOS platform has a clean, secure, commercially useful way to answer:

```txt
Can this organization use OneDayOS?
Can this organization use this module?
Can this user see this module?
Can this user perform this action?
Has this organization exceeded its plan limits?
```

These are related questions, but they are not the same question.

---

# 2. Core Position

OneDayOS should not treat every module as automatically available to every client.

OneDayOS should also not treat module enablement as user authorization.

The correct model is:

```txt
Organization subscription
  ↓
Organization module enablement
  ↓
User role / permission
  ↓
UI visibility
  ↓
API / service enforcement
```

In practical terms:

```txt
Subscription says whether the organization is commercially allowed to use the platform.
OrgModule says whether a module is enabled for that organization.
Permission says whether a user can perform a specific action.
Settings say how an enabled capability behaves within approved boundaries.
```

These must stay separate.

---

# 3. Non-Negotiable Rules

## 3.1 Module enablement is not permission

A module being enabled for an organization does **not** mean every user in that organization can access it.

Example:

```txt
Inventory enabled for Acme Corp
  ≠
All Acme users can create stock adjustments
```

Correct access still requires permission:

```txt
inventory.stock_adjustment.create
```

---

## 3.2 Permission is not module enablement

A user having a permission does **not** mean a disabled module becomes available.

Example:

```txt
User has inventory.product.read
but Inventory is disabled for the organization
→ route/API should behave as unavailable
```

Admin wildcard permissions do not bypass module enablement.

---

## 3.3 Subscription status is not permission

An active subscription does not automatically grant module access.

Example:

```txt
Subscription active
but CRM not enabled
→ user cannot access CRM
```

---

## 3.4 Feature flags are not settings

Feature flags determine whether a capability is available.

Settings configure behavior inside an already available capability.

Example:

```txt
OrgModule(inventory, enabled=true)
→ Inventory exists for this organization

Setting(inventory.low_stock_threshold_mode = "manual")
→ Inventory behavior configuration
```

---

## 3.5 Feature flags are not secrets

Feature flags and subscription records must never contain infrastructure secrets, API keys, service keys, provider tokens, or private credentials.

---

## 3.6 Client-supplied `orgId` is forbidden

No module enablement, subscription check, setting lookup, route guard, API body, or form may trust client-supplied `orgId`.

Tenant identity must come from:

```txt
authenticated user
+ orgSlug route param
+ verified PlatformContext
```

---

## 3.7 Disabling a module must not delete data

When a module is disabled for an organization:

```txt
hide navigation,
block routes/APIs,
stop normal access,
but keep data intact.
```

Module disabling is an access/configuration state, not a data deletion workflow.

---

# 4. Scope

## 4.1 This document covers

- Subscription records.
- Trial, active, suspended, cancelled states.
- Plan limits.
- Module enablement through `OrgModule`.
- Module visibility in sidebar/navigation.
- Module route/API gating.
- Plan-limit checks.
- Feature flags versus settings.
- Feature flags versus permissions.
- Future billing integration seams.
- Test requirements.
- Claude implementation rules.

---

## 4.2 This document does not cover

- Stripe implementation.
- Payment collection.
- Invoicing.
- Tax handling.
- Marketplace billing.
- Per-seat billing automation.
- Client self-service upgrades.
- Enterprise contracts.
- Dedicated infrastructure pricing.
- Runtime feature flag SaaS providers.
- Complex entitlement engines.
- Per-organization module version pinning.

Those are future documents or ADRs.

---

# 5. Layer Placement

Feature flags and subscriptions belong in the **Kernel**.

Reason:

```txt
Every organization needs subscription state.
Every module needs enablement state.
Every sidebar depends on enabled modules.
Every protected module route depends on enabled modules.
Every AppCare workflow depends on commercial state.
```

They do not belong in business modules.

A module may declare what it requires, but the Kernel decides whether it is enabled for an organization.

---

# 6. Key Concepts

## 6.1 Organization

An `Organization` is a client tenant inside OneDayOS.

Example:

```txt
Organization: acme-corp
Organization: cruz-trading
Organization: manila-logistics
```

The organization is the tenant boundary.

---

## 6.2 Subscription

A `Subscription` represents the commercial state and plan limits of an organization.

It answers questions like:

```txt
Is the organization in trial?
Is the organization active?
Is the organization suspended?
How many users are allowed?
How many modules are allowed?
What storage limit applies?
```

It does not grant user permissions.

---

## 6.3 Plan

A `plan` is a commercial package.

Suggested MVP plan IDs:

```txt
starter
pro
enterprise
```

The exact commercial packaging may change, but plan IDs should remain simple and stable.

---

## 6.4 Subscription status

Suggested status values:

```txt
trial
active
suspended
cancelled
```

Reserved future status:

```txt
past_due
```

Do not implement complex billing-state automation in MVP.

---

## 6.5 OrgModule

`OrgModule` is the organization-level module enablement record.

It answers:

```txt
Is Inventory enabled for this organization?
Is Leave enabled for this organization?
Is CRM enabled for this organization?
```

It does not answer:

```txt
Can this user create records?
Can this user export data?
Can this user approve requests?
```

Those are permission checks.

---

## 6.6 Module Manifest

A Module Manifest declares what the module is:

```txt
id
label
version
permissions
navigation
routes
APIs
events
settings
compatibility
```

The manifest says what exists in the codebase.

`OrgModule` says whether that module is enabled for a tenant organization.

---

## 6.7 Feature flag

For OneDayOS MVP, there are three kinds of feature availability control:

```txt
1. Module enablement through OrgModule.
2. Plan limits through Subscription.
3. Typed settings through Setting for behavior within enabled capabilities.
```

Do not add a generic `FeatureFlag` table during MVP unless a future ADR proves it is needed.

---

# 7. Conceptual Access Model

A module page/API is accessible only if all required gates pass.

```txt
1. Authentication gate
   Is the user logged in?

2. Tenant gate
   Does the user belong to the organization identified by orgSlug?

3. Organization commercial gate
   Is the organization active/trial-allowed?

4. Module enablement gate
   Is this module enabled for the organization?

5. Permission gate
   Does this user have the required permission?

6. Business-rule gate
   Is the action valid for the current record state?
```

The order matters.

Recommended order:

```txt
auth → tenant → subscription/org status → module enablement → permission → validation/business logic
```

---

# 8. Subscription Status Behavior

## 8.1 `trial`

Trial organizations are allowed to use the platform until `trialEndsAt`.

Expected behavior:

```txt
login allowed
platform shell allowed
modules allowed if enabled
trial banner shown if close to expiration
admin/settings pages show trial status
```

If `trialEndsAt` has passed and the subscription has not been manually changed to `active`, the organization should be treated as commercially blocked.

MVP can implement this conservatively:

```txt
trial + trialEndsAt in future → access allowed
trial + trialEndsAt in past → module access blocked, admin/billing/support page allowed
```

---

## 8.2 `active`

Active organizations are allowed to use enabled modules within their plan limits.

Expected behavior:

```txt
login allowed
platform shell allowed
enabled modules allowed subject to user permissions
settings allowed subject to permissions
```

---

## 8.3 `suspended`

Suspended organizations are commercially blocked but not deleted.

Expected behavior:

```txt
login allowed
platform shell may show suspension screen
normal module access blocked
billing/support/account page allowed if implemented
no data deleted
no module data deleted
```

This is important for AppCare.

A suspended client may need to log in to see billing/support instructions, but should not continue normal operations.

---

## 8.4 `cancelled`

Cancelled organizations are commercially closed.

Expected behavior:

```txt
login behavior depends on policy
normal module access blocked
data retained according to retention policy
reactivation possible only through founder/admin operation
```

Do not hard-delete organization data on cancellation.

---

## 8.5 `past_due` future state

`past_due` is reserved for future billing automation.

Do not build Stripe behavior yet.

When billing integration exists later, `past_due` may allow a grace period before suspension.

---

# 9. Recommended Data Model

## 9.1 Subscription

Recommended restarted-build shape:

```prisma
model Subscription {
  id          String    @id @default(cuid())
  orgId       String    @unique
  plan        String    @default("starter")
  status      String    @default("trial")
  maxUsers    Int       @default(10)
  maxModules  Int       @default(3)
  storageGb   Int       @default(5)
  trialEndsAt DateTime?
  renewsAt    DateTime?
  cancelledAt DateTime?
  suspendedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  org Organization @relation(fields: [orgId], references: [id])

  @@map("subscriptions")
}
```

Notes:

```txt
plan is a commercial label.
status controls platform-level commercial access.
maxUsers, maxModules, and storageGb are stored to allow per-client overrides.
trialEndsAt controls trial expiration.
renewsAt is informational/manual in MVP.
cancelledAt and suspendedAt are optional but useful for AppCare history.
```

Do not add a full billing ledger in MVP.

---

## 9.2 OrgModule

Recommended restarted-build shape:

```prisma
model OrgModule {
  id         String    @id @default(cuid())
  orgId      String
  moduleId   String
  isEnabled  Boolean   @default(true)
  enabledAt  DateTime?
  enabledBy  String?
  disabledAt DateTime?
  disabledBy String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, moduleId])
  @@index([moduleId])
  @@map("org_modules")
}
```

Notes:

```txt
moduleId must match a registered Module Manifest ID.
isEnabled controls access.
disabling a module does not delete data.
enabledBy / disabledBy are platform User IDs when available.
```

If we want to keep the first implementation simpler, `enabledBy`, `disabledAt`, and `disabledBy` may be deferred, but `updatedAt` is strongly recommended.

---

## 9.3 No generic FeatureFlag table in MVP

Do not add this by default:

```prisma
model FeatureFlag { ... }
```

Reason:

```txt
Generic feature flags easily become a second settings system,
a second permissions system,
a client-specific customization dumping ground,
or an excuse to ship half-built features.
```

Use these instead:

```txt
OrgModule for module enablement.
Subscription for commercial limits.
Setting for typed behavior configuration.
Code-level feature constants for internal development gates.
```

A real feature flag service/table can be proposed later if rollout needs become proven.

---

# 10. Plan Definitions

MVP plan definitions may live in code as Kernel constants.

Example:

```ts
export const PLAN_DEFINITIONS = {
  starter: {
    label: 'Starter',
    defaultMaxUsers: 10,
    defaultMaxModules: 3,
    defaultStorageGb: 5,
  },
  pro: {
    label: 'Pro',
    defaultMaxUsers: 25,
    defaultMaxModules: 8,
    defaultStorageGb: 20,
  },
  enterprise: {
    label: 'Enterprise',
    defaultMaxUsers: 100,
    defaultMaxModules: 999,
    defaultStorageGb: 100,
  },
} as const
```

The database `Subscription` row stores actual applied limits.

That allows manual overrides:

```txt
starter client with maxModules = 5
pro client with maxUsers = 50
enterprise client with custom storage limit
```

Do not overbuild plan catalogs in the database yet.

---

# 11. Module Enablement Behavior

## 11.1 Enabling a module

Enabling a module means creating or updating an `OrgModule` row:

```txt
orgId = organization ID
moduleId = module manifest ID
isEnabled = true
enabledAt = now
enabledBy = current platform user, if available
```

Before enabling, the Kernel must verify:

```txt
module exists in the registry
module dependencies are satisfied
subscription allows another module
organization is not cancelled
operator/user has permission to enable modules
```

---

## 11.2 Disabling a module

Disabling a module means:

```txt
isEnabled = false
disabledAt = now
disabledBy = current platform user, if available
```

It must not:

```txt
delete module data
hard-delete records
remove module migrations
remove module code
remove permissions automatically without explicit policy
```

Recommended behavior:

```txt
hide module from sidebar
block module pages
block module APIs
keep data intact
allow re-enable later
```

---

## 11.3 Disabling a dependency module

If other enabled modules require a module, the Kernel should block disabling it.

Example:

```txt
Purchasing depends on Inventory
Inventory cannot be disabled while Purchasing is enabled
```

In MVP, required module dependencies should be rare.

Most cross-module behavior should use events and optional integrations.

---

## 11.4 Enabling a draft module

A draft module may be enabled for one organization if commercially approved.

Rules:

```txt
must still use standard module structure
must still use SDK
must still use PlatformContext
must still pass tenant and permission tests
must not become a client fork
```

This supports client-driven module creation while preserving platform discipline.

---

# 12. Subscription and Module Limits

## 12.1 Max users

`maxUsers` controls how many active platform users an organization may have.

It should count:

```txt
User rows where orgId = ctx.org.id and isActive = true
```

It should not count:

```txt
Employee records without login accounts
inactive users
soft-deleted future user records, if user soft delete exists later
```

When limit is exceeded:

```txt
block new user invitation/creation
return PLAN_LIMIT_EXCEEDED
show clear admin-facing message
```

---

## 12.2 Max modules

`maxModules` controls how many modules an organization may have enabled.

It should count:

```txt
OrgModule rows where orgId = ctx.org.id and isEnabled = true
```

Question: should Kernel/Business Object pages count as modules?

Answer: no.

`maxModules` counts Business Modules only.

Do not count:

```txt
Kernel
Business Objects
Settings
Dashboard
Support/account pages
```

---

## 12.3 Storage GB

`storageGb` is a future storage limit.

In MVP, attachments are deferred, so storage enforcement can be a reserved field.

Do not implement Supabase Storage just because `storageGb` exists.

When Attachment Service is implemented later, it must define storage counting and enforcement.

---

# 13. SDK Expectations

The SDK should eventually expose server-only helpers similar to:

```ts
sdk.subscriptions.getCurrent(ctx)
sdk.subscriptions.requireUsable(ctx)
sdk.subscriptions.assertCanAddUser(ctx)
sdk.subscriptions.assertCanEnableModule(ctx, moduleId)

sdk.modules.getRegistered()
sdk.modules.getEnabledForOrg(ctx)
sdk.modules.isEnabled(ctx, moduleId)
sdk.modules.requireEnabled(ctx, moduleId)
sdk.modules.enable(ctx, moduleId)
sdk.modules.disable(ctx, moduleId)
```

However, MVP implementation should not overbuild unused helpers.

Required foundation helpers:

```ts
sdk.modules.isEnabled(ctx, moduleId)
sdk.modules.requireEnabled(ctx, moduleId)
sdk.subscriptions.requireUsable(ctx)
```

These must use verified `PlatformContext`.

Forbidden:

```ts
sdk.modules.isEnabled(orgId, moduleId)
sdk.subscriptions.getByOrgId(orgId)
sdk.modules.enable(body.orgId, body.moduleId)
```

---

# 14. PlatformContext Requirements

`PlatformContext` should include enough information to avoid repeated unsafe lookups.

Recommended fields:

```ts
type PlatformContext = {
  authUserId: string
  user: {
    id: string
    orgId: string
    email: string
    name: string
    isActive: boolean
  }
  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
  }
  subscription: {
    plan: string
    status: string
    maxUsers: number
    maxModules: number
    storageGb: number
    trialEndsAt: Date | null
  }
  enabledModuleIds: Set<string>
  roleIds: string[]
  permissions: PermissionGrant[]
  requestId?: string
}
```

Do not include secrets.

Do not include raw Supabase session objects unless needed internally.

---

# 15. Route and API Behavior

## 15.1 Module pages

Module pages must verify module enablement before rendering.

Example:

```txt
/[orgSlug]/inventory
```

Required checks:

```txt
authenticated
tenant membership verified
subscription usable
Inventory enabled for org
user has inventory permission
```

If module is disabled:

```txt
return safe 404 or module-not-available screen depending on context
```

Do not reveal disabled module details to unauthorized users.

---

## 15.2 Module APIs

Module APIs must verify module enablement before service calls.

Example:

```txt
/api/orgs/[orgSlug]/inventory/stock-adjustments
```

Required checks:

```txt
authenticated
tenant membership verified
subscription usable
Inventory enabled for org
permission granted
request validated
```

If module is disabled:

```json
{
  "data": null,
  "error": {
    "code": "MODULE_NOT_FOUND",
    "message": "Module not available."
  }
}
```

Status:

```txt
404
```

Using `404` avoids confirming whether a module exists but is disabled for that organization.

---

## 15.3 Subscription-blocked APIs

If organization status blocks access:

```json
{
  "data": null,
  "error": {
    "code": "SUBSCRIPTION_INACTIVE",
    "message": "This organization cannot currently access this feature."
  }
}
```

Recommended status:

```txt
402 or 403
```

For MVP, use `403` unless we define a payment-specific API contract later.

---

## 15.4 Plan-limit APIs

When an action exceeds plan limits:

```json
{
  "data": null,
  "error": {
    "code": "PLAN_LIMIT_EXCEEDED",
    "message": "This organization has reached its current plan limit.",
    "details": {
      "limit": "maxModules",
      "current": 3,
      "maximum": 3
    }
  }
}
```

Do not expose billing/provider internals.

---

# 16. Navigation Behavior

Sidebar module visibility requires:

```txt
organization subscription usable
module enabled for organization
user has at least one navigation-required permission
```

Example:

```txt
Inventory enabled for organization
User has inventory.stock_balance.read
→ show Inventory nav
```

Example:

```txt
Inventory enabled for organization
User has no inventory permissions
→ hide Inventory nav
```

Example:

```txt
Inventory disabled for organization
User has Admin wildcard permission
→ hide Inventory nav
```

Admin wildcard does not bypass module enablement.

---

# 17. Settings UI Behavior

A future organization settings screen may show:

```txt
subscription status
plan label
trial expiration
enabled modules
available modules
user count versus maxUsers
module count versus maxModules
storage usage versus storageGb, later
```

MVP may keep module enablement as a founder/admin provisioning script rather than client-facing UI.

If a UI exists, it must be permission-gated.

Suggested permissions:

```txt
kernel.subscription.read
kernel.module.read
kernel.module.enable
kernel.module.disable
```

Do not allow normal staff users to enable modules.

Do not allow module enablement through client-supplied `orgId`.

---

# 18. Client Provisioning Behavior

During client onboarding, the provisioning flow should create:

```txt
Organization
Subscription
Admin User
Admin Role
Admin wildcard permission
Initial Branch/Department if provided
Enabled modules through OrgModule
Module settings if needed
Initial Business Objects if provided
```

For MVP, this may be done through a founder-run script.

The script must:

```txt
be idempotent where possible
validate module IDs against registered manifests
respect maxModules unless founder override is explicit
never accept raw unverified orgId from client input
not overwrite existing client data
```

---

# 19. Manual Billing and Future Billing

## 19.1 MVP billing model

MVP billing can be manual.

Example:

```txt
Founder receives payment manually.
Founder sets Subscription.status = active.
Founder sets plan and limits.
Founder enables purchased modules.
```

This is acceptable early.

Do not overbuild Stripe before the product and pricing are stable.

---

## 19.2 Future Stripe integration

Future Stripe integration should update subscription state, but it must not become the only source of platform authorization.

Recommended future flow:

```txt
Stripe webhook received
  ↓
validated server-side
  ↓
updates OneDayOS Subscription row
  ↓
OneDayOS uses Subscription row for access decisions
```

Modules should not call Stripe.

Business modules should not know billing provider details.

---

# 20. Feature Flag Categories

## 20.1 Module feature flags

Implemented through `OrgModule`.

Example:

```txt
inventory enabled
crm enabled
leave disabled
```

---

## 20.2 Plan feature flags

Implemented through `Subscription.plan` and limits.

Example:

```txt
starter plan maxModules = 3
pro plan maxModules = 8
enterprise plan custom limits
```

Do not hard-code plan behavior inside modules.

---

## 20.3 Module behavior settings

Implemented through typed `Setting` keys.

Example:

```txt
leave.balance_tracking.enabled = true
inventory.low_stock_threshold_mode = "manual"
crm.default_pipeline_stage = "new"
```

These settings configure behavior; they do not enable the module itself.

---

## 20.4 Beta/internal release flags

MVP should avoid a database-heavy beta flag system.

For early development, use code-level constants or typed Settings only when necessary.

Example:

```txt
kernel.beta.new_dashboard.enabled
```

Rules:

```txt
must be registered
must have schema
must have default
must not bypass permissions
must not expose unfinished security-sensitive features
```

---

# 21. Errors

Required error codes:

```txt
SUBSCRIPTION_INACTIVE
SUBSCRIPTION_TRIAL_EXPIRED
PLAN_LIMIT_EXCEEDED
MODULE_NOT_FOUND
MODULE_NOT_ENABLED       // internal/logging only; public APIs may return MODULE_NOT_FOUND
MODULE_DEPENDENCY_MISSING
MODULE_LIMIT_EXCEEDED
TENANT_ID_NOT_ALLOWED
FORBIDDEN
UNAUTHENTICATED
```

External API responses should prefer safe codes.

Example:

```txt
Disabled module → MODULE_NOT_FOUND
Wrong org → ORG_NOT_FOUND
Missing permission → FORBIDDEN
```

---

# 22. Events

Subscription and module enablement changes should emit Kernel events.

Suggested events:

```txt
kernel.subscription.created
kernel.subscription.updated
kernel.subscription.status_changed
kernel.module.enabled
kernel.module.disabled
kernel.module.enable_failed
```

Event payloads must not include full records.

Example payload:

```ts
type KernelModuleEnabledPayload = {
  moduleId: string
  enabledBy: string | null
}
```

Do not include `orgId` in the payload. The event envelope should already include tenant context.

---

# 23. Security Rules

## 23.1 Module enablement is privileged

Only authorized users or founder/operator provisioning scripts may enable or disable modules.

Suggested permission:

```txt
kernel.module.enable
kernel.module.disable
```

---

## 23.2 Subscription changes are privileged

Only authorized founder/operator/admin flows may change subscription plan/status.

Suggested permission:

```txt
kernel.subscription.update
```

For MVP, subscription changes may be founder-only and not exposed in client UI.

---

## 23.3 No client-supplied tenant identity

Forbidden patterns:

```ts
body.orgId
query.orgId
headers['x-org-id']
sdk.modules.enable(body.orgId, moduleId)
sdk.subscriptions.getByOrgId(body.orgId)
```

Allowed pattern:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
await sdk.modules.enable(ctx, moduleId)
```

---

## 23.4 Disabled modules must not leak data

If a module is disabled, its APIs must not return records, counts, metadata, or status details to normal users.

Wrong:

```json
{
  "error": "Inventory is disabled for Acme Corp"
}
```

Better:

```json
{
  "error": {
    "code": "MODULE_NOT_FOUND",
    "message": "Module not available."
  }
}
```

---

# 24. Testing Requirements

## 24.1 Subscription tests

Required tests:

```txt
trial org before expiration can access enabled module
trial org after expiration is blocked from module access
active org can access enabled module
suspended org cannot access normal module routes/APIs
cancelled org cannot access normal module routes/APIs
```

---

## 24.2 Module enablement tests

Required tests:

```txt
enabled module appears in resolved navigation when user has permission
disabled module does not appear in navigation
disabled module API returns safe 404
Admin wildcard does not bypass disabled module
module enablement requires registered manifest
module enablement respects maxModules
module disabling does not delete data
```

---

## 24.3 Permission separation tests

Required tests:

```txt
module enabled + missing permission → 403
module disabled + permission present → safe 404
module enabled + permission present → success
module enabled + Admin wildcard → success
wrong org + module enabled → safe org 404
```

---

## 24.4 Plan-limit tests

Required tests:

```txt
cannot create user beyond maxUsers
cannot enable module beyond maxModules
can enable module after disabling another module if under limit
plan-limit error uses stable PLAN_LIMIT_EXCEEDED shape
```

---

## 24.5 Two-organization tests

Every tenant-sensitive feature flag/subscription test suite must include at least two organizations.

Example:

```txt
Alpha Corp has Inventory enabled.
Beta Corp does not.
Alpha user cannot use Beta orgSlug to infer Beta module state.
Beta user cannot access Alpha module APIs.
```

---

# 25. UI Requirements

## 25.1 Trial banner

A trial organization should see a calm, non-annoying trial banner if the trial is near expiration.

Example:

```txt
Trial ends in 5 days. Contact OneDayOS to continue AppCare.
```

Do not show this to every staff user if it creates noise. Prefer admin/owner users.

---

## 25.2 Suspended state

Suspended organizations should see a clear account state page.

Example:

```txt
Your OneDayOS access is currently paused.
Please contact support to reactivate your AppCare subscription.
```

Do not show raw billing provider errors.

---

## 25.3 Module unavailable state

Normal users should see either safe 404 or a permission-aware unavailable page.

Do not say:

```txt
You would have access to Inventory if your company paid more.
```

That is bad UX and can create internal client friction.

Admin settings can show upgrade/module availability more explicitly.

---

# 26. Generator Requirements

The Module Generator must:

```txt
create manifest metadata
not auto-enable modules for all organizations
not create subscription rows
not create billing logic
not create client-supplied orgId patterns
not create disabled-module bypasses
include tests for module disabled behavior
include tests that Admin wildcard does not bypass disabled module
```

Generated module pages/APIs must call module context helpers that check enablement.

---

# 27. Claude Implementation Rules

Claude must not:

```txt
implement Stripe from this document
add a generic FeatureFlag table without ADR
put billing logic inside business modules
allow module access based only on permission
allow module access based only on OrgModule
treat Admin wildcard as module enablement
delete module data when disabling a module
accept orgId in body/query/header
create per-client module forks
create per-client Supabase/Vercel infrastructure
```

Claude must:

```txt
use PlatformContext
use tenant-scoped routes/APIs
separate subscription, module enablement, and permissions
add denial tests
add plan-limit tests where applicable
add two-org tests
return JSON API errors
emit safe Kernel events for subscription/module changes
```

---

# 28. Implementation Package Requirements

Before Claude implements this subsystem, the implementation package must include:

```txt
[ ] Frozen Subscription and OrgModule schema
[ ] Frozen API error contract
[ ] Frozen PlatformContext shape
[ ] Required SDK helper list
[ ] Required permissions
[ ] Required tests
[ ] Decision on MVP admin UI versus provisioning scripts
[ ] Decision on trial expiration behavior
[ ] Decision on suspended organization UX
```

Do not ask Claude:

```txt
Build feature flags and subscriptions.
```

Ask Claude:

```txt
Using the frozen Feature Flags & Subscriptions document, implement only:
- Subscription model helpers
- OrgModule enablement helpers
- module access checks
- required tests
Do not implement billing, Stripe, client self-service upgrade UI, or generic feature-flag service.
```

---

# 29. Acceptance Criteria

This document is implemented correctly when:

```txt
[ ] Every organization has a Subscription record.
[ ] Every enabled module uses OrgModule.
[ ] Disabled modules do not appear in sidebar.
[ ] Disabled module pages/APIs are blocked.
[ ] Admin wildcard permission does not bypass module enablement.
[ ] Active/trial organizations can access enabled modules.
[ ] Suspended/cancelled/expired organizations are blocked from normal module access.
[ ] Plan user/module limits are enforced where implemented.
[ ] Client-supplied orgId is rejected.
[ ] Module enablement is separate from permission.
[ ] Settings are separate from feature flags.
[ ] Subscription changes and module enablement changes emit safe events.
[ ] Tests include two organizations.
[ ] Tests include permission separation.
[ ] Tests include module-disabled behavior.
[ ] Tests include plan-limit behavior where implemented.
[ ] API errors use stable JSON shape.
[ ] Claude does not implement billing automation from this document alone.
```

---

# 30. Open Questions

These do not block MVP but should become ADRs later if needed.

## 30.1 Should `past_due` be added now?

Recommendation:

```txt
No. Reserve it as a future status.
```

Manual billing can use `active` and `suspended` initially.

---

## 30.2 Should clients self-enable modules?

Recommendation:

```txt
No for MVP.
```

Founder/admin provisioning is safer until pricing, module maturity, and UX are proven.

---

## 30.3 Should module enablement have approval workflow?

Recommendation:

```txt
No for MVP.
```

That would create a Platform Workflow/Approval dependency too early.

---

## 30.4 Should OneDayOS use a third-party feature flag provider?

Recommendation:

```txt
No for MVP.
```

Use `OrgModule`, `Subscription`, and typed `Setting` first.

---

## 30.5 Should enterprise clients have separate plans and infrastructure?

Recommendation:

```txt
Yes later, but not in MVP.
```

Dedicated infrastructure is a premium/enterprise deployment model, not the default AppCare model.

---

# 31. Summary

Feature flags and subscriptions are the commercial and availability layer of OneDayOS.

They must answer:

```txt
Can this organization use the platform?
Can this organization use this module?
Is this organization within plan limits?
```

They must not answer:

```txt
Can this user perform this action?
How does this module behave internally?
What secrets does this integration use?
```

The final rule:

```txt
Subscription controls commercial access.
OrgModule controls module availability.
Permissions control user actions.
Settings control behavior.
Do not mix them.
```
