# OneDayOS Engineering Manual — 04 Kernel / 05 Settings & Configuration

**Document ID:** `04-kernel/05-settings-configuration.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT / OneDayOS Architecture Partner  
**Date:** July 2026  
**Implementation Status:** Required Before Restarted Foundation Build  
**Supersedes:** None  
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
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/00-database-architecture.md`
- `06-data/05-data-validation-zod.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `13-security/05-data-security.md`
- `13-security/06-secrets-management.md`

---

## 1. Purpose

This document defines how **settings and configuration** work in OneDayOS.

OneDayOS must serve many organizations from one shared platform. Different clients may need different labels, preferences, module behavior, business defaults, and operational configuration. Those differences must be handled through **safe configuration**, not through code forks.

The purpose of the Settings & Configuration system is to let OneDayOS adapt to each organization while preserving:

```txt
one shared codebase
one shared deployment
one shared platform architecture
many tenant organizations
strict tenant isolation
module reuse
low AppCare burden
```

Settings exist to make OneDayOS configurable.

Settings must not become:

```txt
custom code
secret storage
permission bypasses
workflow engines
no-code app builders
dynamic schema engines
client-specific forks
```

---

## 2. Core Principle

The core rule is:

```txt
Configuration changes behavior inside approved boundaries.
Configuration does not create new architecture.
```

A setting may control:

```txt
which default unit to use
which label to display
which optional field to show
which module preference is active
which dashboard widget is visible
which numbering prefix to use
which default status is selected
```

A setting must not control:

```txt
which tenant data a user can access
which permission a user has
which module is enabled
which database is used
which code path bypasses validation
which business rule executes arbitrary logic
which SQL query runs
which secret key is used
```

---

## 3. Settings vs Other Platform Concepts

Settings must be clearly separated from other platform concepts.

| Concept | Purpose | Example | Stored As |
|---|---|---|---|
| Setting | Org/module behavior preference | Inventory default unit | `Setting` |
| Feature Flag / Module Enablement | Whether a module or feature is available | Inventory enabled for Org A | `OrgModule`, future feature flags |
| Subscription | Commercial plan and limits | Starter, active, max users | `Subscription` |
| Permission | What a user may do | `inventory.stock_adjustment.create` | Role/Permission tables |
| Secret | Infrastructure/provider credential | Supabase service key | Environment variables / secret manager |
| Business Data | Client operational data | Product, Customer, Leave Request | Business Object / module tables |
| Client Branding | Visual customization | Logo, light accent preference | Organization fields / future branding config |
| Workflow Rule | Business process logic | Approval routing | Module logic or future Platform Service |

A setting must not be used to replace any of the others.

---

## 4. What Belongs in Settings

Settings are appropriate for values that are:

```txt
organization-scoped
module-scoped or kernel-scoped
safe to store in the database
validated by schema
not secret
not permission-sensitive by themselves
not arbitrary executable logic
used to customize approved behavior
```

Examples:

```txt
kernel.locale.default = "en-PH"
kernel.timezone.default = "Asia/Manila"
kernel.display.dateFormat = "MMM d, yyyy"
kernel.display.currency = "PHP"
inventory.defaultUnit = "pcs"
inventory.stockAdjustment.requiresReason = true
inventory.lowStock.enabled = false
leave.allowHalfDay = false
leave.defaultAnnualLeaveDays = 0
crm.defaultOpportunityStage = "new"
expenses.defaultCurrency = "PHP"
assets.assetTagPrefix = "ASSET"
visitors.requireCompanyName = false
incidents.defaultSeverity = "medium"
```

Settings should generally be simple.

If a value begins to look like a programming language, a rules engine, or a workflow builder, it probably does not belong in Settings.

---

## 5. What Must Not Belong in Settings

Settings must not store:

```txt
Supabase service role keys
database URLs
API keys
passwords
OAuth secrets
SMTP credentials
payment provider secrets
raw SQL
raw Prisma filters
JavaScript functions
serialized code
permission grants
role assignments
module enablement state
subscription plan state
large business records
client-specific source-code behavior
unreviewed workflow rules
arbitrary custom fields
```

### 5.1 Secrets Are Not Settings

The `Setting` table must not become a secret store in MVP.

Bad:

```json
{
  "module": "integrations",
  "key": "mailgun.apiKey",
  "value": "key-abc123"
}
```

Good:

```txt
MAILGUN_API_KEY stored in Vercel/Supabase/provider secret infrastructure
```

If a future integration needs per-organization encrypted credentials, that requires a separate ADR, encryption design, rotation policy, access audit, and support model.

Do not hide that complexity inside `Setting.value`.

### 5.2 Permissions Are Not Settings

Bad:

```json
{
  "module": "inventory",
  "key": "allowStaffToAdjustStock",
  "value": true
}
```

Good:

```txt
Role: Warehouse Staff
Permission: inventory.stock_adjustment.create
```

Settings may affect UI defaults or module behavior, but permissions decide what a user may do.

### 5.3 Module Enablement Is Not a Setting

Bad:

```json
{
  "module": "kernel",
  "key": "inventory.enabled",
  "value": true
}
```

Good:

```txt
OrgModule:
  orgId
  moduleId = "inventory"
  isEnabled = true
```

Module enablement belongs in `OrgModule`, not `Setting`.

### 5.4 Subscription Plan Is Not a Setting

Bad:

```json
{
  "module": "kernel",
  "key": "plan",
  "value": "pro"
}
```

Good:

```txt
Subscription:
  plan = "pro"
  status = "active"
  maxUsers = 25
  maxModules = 8
```

Commercial entitlements belong in `Subscription` and related billing/feature systems.

---

## 6. Data Model

The base model is:

```prisma
model Setting {
  id        String   @id @default(cuid())
  orgId     String
  module    String
  key       String
  value     Json
  updatedAt DateTime @updatedAt

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, module, key])
  @@map("settings")
}
```

For the restarted build, the model should be expanded slightly for auditability and lifecycle clarity:

```prisma
model Setting {
  id        String   @id @default(cuid())
  orgId     String
  module    String
  key       String
  value     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  updatedBy String?

  org Organization @relation(fields: [orgId], references: [id])

  @@unique([orgId, module, key])
  @@index([orgId, module])
  @@map("settings")
}
```

### 6.1 Why `value` Is JSON

`value` uses PostgreSQL JSONB through Prisma `Json` because settings may be strings, booleans, numbers, arrays, or small objects.

Examples:

```json
"PHP"
```

```json
true
```

```json
{
  "prefix": "INV",
  "padding": 5
}
```

But JSON flexibility does not mean arbitrary structure is allowed.

Every setting key must have a validation schema.

---

## 7. Setting Namespaces

Every setting belongs to a module namespace.

Examples:

```txt
kernel
inventory
leave
crm
purchasing
expenses
assets
visitors
incidents
objects
```

The `module` field answers:

```txt
Which part of OneDayOS owns this setting contract?
```

The `key` field answers:

```txt
Which specific configurable behavior is this?
```

### 7.1 Kernel Settings

Kernel settings use:

```txt
module = "kernel"
```

Examples:

```txt
kernel.locale.default
kernel.timezone.default
kernel.display.dateFormat
kernel.display.currency
kernel.org.profile.lockedFields
```

Kernel settings may affect organization-wide preferences, but must not control permissions, auth, tenancy, or module enablement.

### 7.2 Business Object Settings

Business Object settings, if needed, use:

```txt
module = "objects"
```

Examples:

```txt
objects.product.codeLabel
objects.customer.displayNameFormat
objects.employee.employeeNoLabel
```

Use sparingly.

Business Objects should remain stable shared objects. Do not use settings to make them wildly different per client.

### 7.3 Module Settings

Business Module settings use the module ID:

```txt
module = "inventory"
module = "leave"
module = "crm"
```

Examples:

```txt
inventory.defaultUnit
inventory.allowNegativeStock
leave.allowHalfDay
crm.defaultPipelineName
```

A module may only read and write its own settings through approved SDK/service APIs.

### 7.4 Platform Service Settings

Deferred Platform Services may later have namespaces such as:

```txt
platform.notifications
platform.attachments
platform.approvals
platform.search
platform.ai
```

These must not be implemented just because this document names them.

They remain deferred until their respective Platform Service documents, evidence logs, ADRs, and implementation packages exist.

---

## 8. Setting Key Naming

Setting keys must be stable contracts.

Use dot notation:

```txt
category.name
category.subcategory.name
```

Examples:

```txt
display.currency
display.dateFormat
numbering.assetTagPrefix
stock.allowNegativeStock
stock.lowStockEnabled
requests.allowHalfDay
```

Avoid:

```txt
random camelCase without grouping
vague names like "config"
module name repeated inside key
client-specific names
business data in key names
```

Bad:

```txt
inventory.inventorySettings
clientAcmeSpecialFlag
config
settings
allowEverything
```

Good:

```txt
stock.allowNegativeStock
numbering.stockAdjustmentPrefix
```

---

## 9. Settings Registry

Every official setting must be registered in code before it can be read or written.

The Settings Registry defines:

```ts
type SettingDefinition<T> = {
  module: string
  key: string
  label: string
  description?: string
  defaultValue: T
  schema: z.ZodType<T>
  scope: 'org'
  category?: string
  editableBy?: PermissionRequirement
  sensitive?: boolean
  visibleInAdmin?: boolean
}
```

Example:

```ts
export const inventorySettings = {
  allowNegativeStock: {
    module: 'inventory',
    key: 'stock.allowNegativeStock',
    label: 'Allow negative stock',
    description: 'Allows stock balances to go below zero during adjustments.',
    defaultValue: false,
    schema: z.boolean(),
    scope: 'org',
    category: 'Stock',
    editableBy: {
      module: 'inventory',
      resource: 'settings',
      action: 'update',
    },
    visibleInAdmin: true,
  },
}
```

No code should read unknown settings by stringly typed keys scattered throughout the app.

Bad:

```ts
await getSetting(ctx, 'inventory', 'whateverTheClientAskedFor')
```

Good:

```ts
await sdk.settings.get(ctx, inventorySettings.allowNegativeStock)
```

---

## 10. SDK Contract

Settings are accessed through the server SDK.

Reserved server SDK shape:

```ts
sdk.settings.get(ctx, definition)
sdk.settings.getMany(ctx, definitions)
sdk.settings.set(ctx, definition, value)
sdk.settings.reset(ctx, definition)
sdk.settings.listForModule(ctx, moduleId)
```

Example:

```ts
const allowNegativeStock = await sdk.settings.get(
  ctx,
  inventorySettings.allowNegativeStock
)
```

To update:

```ts
await sdk.settings.set(
  ctx,
  inventorySettings.allowNegativeStock,
  false
)
```

### 10.1 Required Context

All server-side setting operations must use verified `PlatformContext`.

Good:

```ts
await sdk.settings.get(ctx, definition)
```

Bad:

```ts
await sdk.settings.get(orgId, module, key)
```

The following are forbidden:

```txt
sdk.settings.get(orgId, ...)
sdk.settings.set(orgId, ...)
body.orgId
query.orgId
hidden orgId form fields
```

Tenant identity must come from:

```txt
authenticated session
+ route orgSlug
+ verified user/org membership
+ PlatformContext
```

---

## 11. Defaults

Every setting must have a default value.

A missing row does not mean an error.

A missing row means:

```txt
use the registered default
```

This keeps onboarding simple.

Example:

```ts
const defaultCurrency = await sdk.settings.get(ctx, kernelSettings.displayCurrency)
```

If the organization has no row for `kernel.display.currency`, the SDK returns:

```txt
PHP
```

### 11.1 Do Not Seed Every Default Row

Do not create database rows for every default setting during org creation unless there is a reason.

Prefer:

```txt
registry default + DB override only when changed
```

This keeps the settings table clean and avoids unnecessary migration/support noise.

### 11.2 When to Materialize a Setting Row

A row should be created when:

```txt
the client changes the setting
an onboarding script explicitly sets a non-default value
a module provisioning step requires an explicit value
```

---

## 12. Validation

Every setting update must validate:

```txt
module
key
value shape
permission
module ownership
tenant context
```

Unknown setting keys must be rejected.

Bad:

```ts
await prisma.setting.upsert({
  data: {
    orgId: body.orgId,
    module: body.module,
    key: body.key,
    value: body.value,
  },
})
```

Good:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)

await sdk.permissions.require(ctx, {
  module: 'kernel',
  resource: 'settings',
  action: 'update',
})

const parsed = UpdateSettingSchema.parse(body)

await sdk.settings.set(ctx, kernelSettings.displayCurrency, parsed.value)
```

### 12.1 Zod Rules

Setting schemas must use Zod.

Examples:

```ts
z.boolean()
z.number().int().min(0)
z.string().min(1).max(50)
z.enum(['PHP', 'USD'])
z.strictObject({
  prefix: z.string().min(1).max(10),
  padding: z.number().int().min(1).max(10),
})
```

Use `z.strictObject()` for object-valued settings.

Do not allow unknown keys in setting values.

### 12.2 Unknown Keys

Unknown setting keys must return:

```json
{
  "data": null,
  "error": {
    "code": "SETTING_NOT_FOUND",
    "message": "Setting not found."
  }
}
```

### 12.3 Invalid Values

Invalid setting values must return:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid setting value.",
    "details": {
      "fieldErrors": {
        "value": ["Expected boolean"]
      }
    }
  }
}
```

---

## 13. API Contract

Settings APIs must follow the Kernel API contract.

Recommended API paths:

```txt
GET   /api/orgs/[orgSlug]/settings
GET   /api/orgs/[orgSlug]/settings/[module]
PATCH /api/orgs/[orgSlug]/settings/[module]/[key]
POST  /api/orgs/[orgSlug]/settings/[module]/[key]/reset
```

### 13.1 API Rules

Settings APIs must:

```txt
return JSON only
never redirect
never accept orgId from body/query
validate route params
create verified PlatformContext
enforce permission
validate setting value
return { data, error, meta? }
```

### 13.2 Listing Settings

Listing settings should return registered settings plus effective values.

Example:

```json
{
  "data": [
    {
      "module": "inventory",
      "key": "stock.allowNegativeStock",
      "label": "Allow negative stock",
      "description": "Allows stock balances to go below zero during adjustments.",
      "value": false,
      "defaultValue": false,
      "isDefault": true,
      "editable": true
    }
  ],
  "error": null
}
```

### 13.3 Updating a Setting

Request:

```json
{
  "value": true
}
```

Forbidden request:

```json
{
  "orgId": "org_123",
  "value": true
}
```

If `orgId` is present, reject:

```json
{
  "data": null,
  "error": {
    "code": "TENANT_ID_NOT_ALLOWED",
    "message": "Tenant identity is resolved by the server."
  }
}
```

---

## 14. Permission Model

Settings updates require permissions.

Recommended permissions:

```txt
kernel.settings.read
kernel.settings.update
inventory.settings.read
inventory.settings.update
leave.settings.read
leave.settings.update
crm.settings.read
crm.settings.update
```

Or using the standard object shape:

```ts
{
  module: 'inventory',
  resource: 'settings',
  action: 'read'
}
```

```ts
{
  module: 'inventory',
  resource: 'settings',
  action: 'update'
}
```

### 14.1 Read vs Update

Reading settings and updating settings are separate actions.

A user may be able to read module settings without being able to change them.

### 14.2 Kernel vs Module Settings

Kernel settings require kernel-level permission.

Module settings require module-level setting permission.

A user with `inventory.settings.update` must not be allowed to update `leave` settings.

### 14.3 Admin Wildcard

Admin wildcard permissions may grant settings access, but only inside the verified organization.

Wildcard permissions never bypass tenant isolation.

---

## 15. Client Configuration Use Cases

Settings support client configuration in controlled ways.

### 15.1 Labels

Settings may lightly customize labels.

Example:

```txt
objects.product.codeLabel = "Item Code"
objects.employee.employeeNoLabel = "Employee ID"
```

But avoid turning every noun in the product into a setting.

Too much label configuration increases support burden and documentation complexity.

### 15.2 Defaults

Settings may define defaults.

Examples:

```txt
inventory.defaultUnit = "pcs"
expenses.defaultCurrency = "PHP"
incidents.defaultSeverity = "medium"
```

Defaults must be revalidated server-side.

### 15.3 Optional Fields

Settings may hide/show approved optional fields.

Example:

```txt
visitors.requireCompanyName = false
```

But hidden fields are not security.

APIs and services must still validate and enforce rules.

### 15.4 Numbering Prefixes

Settings may define safe numbering prefixes.

Example:

```json
{
  "prefix": "ASSET",
  "padding": 5
}
```

Do not let clients define arbitrary numbering scripts.

### 15.5 Module Behavior Toggles

Settings may toggle approved module behavior.

Example:

```txt
leave.allowHalfDay = false
inventory.allowNegativeStock = false
```

But these toggles must be deliberately designed and tested.

Do not create random flags for every client request.

---

## 16. Settings Are Not a Custom Fields System

Generic client-defined custom fields are forbidden in MVP.

Bad:

```json
{
  "module": "inventory",
  "key": "customFields",
  "value": [
    { "name": "Supplier Mood", "type": "text" }
  ]
}
```

Custom fields introduce:

```txt
schema ambiguity
validation complexity
search/export complexity
AI context risk
reporting complexity
migration complexity
support burden
```

If a module-specific field is truly needed, use a proper module extension table and update the module spec.

If repeated clients need a generic custom-field capability, that requires a future Platform Service proposal, evidence log, ADR, and separate implementation plan.

---

## 17. Settings Are Not a Workflow Engine

Do not encode workflows in settings.

Bad:

```json
{
  "key": "approvalRules",
  "value": {
    "if": "amount > 5000",
    "then": "manager.approve()"
  }
}
```

Good for MVP:

```txt
Module-local workflow implemented in service code
with clear statuses, permissions, and tests
```

Future workflow engines or approval engines require the Three Independent Use Cases Rule and separate Platform Service design.

---

## 18. Security Rules

Settings are tenant-scoped and security-sensitive because they can alter business behavior.

All settings operations must obey:

```txt
authentication
tenant membership
module enablement where relevant
permission enforcement
schema validation
server-derived tenant identity
structured API errors
privacy-safe logging
```

### 18.1 No Client-Supplied Org ID

Settings forms and APIs must never submit:

```txt
orgId
organizationId
tenantId
```

If present, reject.

### 18.2 No Secrets

Settings must not store secrets.

### 18.3 No Permission Bypass

Settings must not be used to grant permissions.

### 18.4 No Module Bypass

Settings must not enable disabled modules.

### 18.5 No Hidden Tenant Behavior

Settings must not create client-specific hidden branches in code.

Bad:

```ts
if (org.slug === 'acme') {
  // special behavior
}
```

Good:

```ts
const feature = await sdk.settings.get(ctx, approvedSetting)
```

But only when the setting is documented, validated, and reusable.

---

## 19. UI Standards

Settings UI must feel like a professional control panel, not a raw key/value database editor.

### 19.1 Settings Page Structure

Recommended structure:

```txt
Settings
  Organization
  Users & Roles
  Modules
  Business Records
  Inventory
  Leave
  CRM
  Expenses
  Assets
  Visitor Management
  Incident Reporting
```

Only show sections the organization has enabled and the user may access.

### 19.2 Do Not Expose Raw JSON by Default

Most settings should be edited through typed controls:

```txt
toggle
select
text input
number input
radio group
small structured form
```

Do not expose raw JSON editing to normal users.

### 19.3 Show Defaults

Settings UI should communicate when a setting is using the default value.

Example:

```txt
Currency: PHP
Using default
```

### 19.4 Reset to Default

Where safe, settings should support:

```txt
Reset to default
```

This should delete the override row or set it back to the default according to the SDK contract.

### 19.5 Optimistic UI

Safe settings updates may use optimistic UI.

Example:

```txt
Toggle allowNegativeStock
→ switch changes immediately
→ request runs
→ success toast or rollback on error
```

But never pretend a high-impact setting succeeded if the server rejects it.

### 19.6 Tooltips

Every non-obvious setting must include a short tooltip.

Tooltips should explain impact, not restate the label.

Bad:

```txt
Allow negative stock: Allows negative stock.
```

Good:

```txt
If enabled, stock balances may go below zero during adjustments. Keep this off unless your team records stock later than it physically moves.
```

---

## 20. Module Settings Ownership

A module owns its setting definitions.

Recommended file:

```txt
src/modules/[moduleId]/settings.ts
```

Example:

```ts
export const inventorySettings = {
  allowNegativeStock: { ... },
  defaultUnit: { ... },
}
```

The platform may collect all registered module settings for admin UI, but the module owns the definitions.

### 20.1 Manifests May Reference Settings

A module manifest may include setting metadata references, but should not contain executable logic.

Example:

```ts
settings: [
  'stock.allowNegativeStock',
  'stock.lowStockEnabled',
]
```

The setting definitions themselves remain in `settings.ts`.

---

## 21. Kernel Settings Ownership

Kernel setting definitions should live under:

```txt
src/kernel/settings/definitions.ts
```

or, if exposed through SDK:

```txt
src/sdk/server/settings/definitions.ts
```

Kernel settings include organization-wide preferences and platform configuration that is safe to store per organization.

Kernel settings do not include:

```txt
secrets
infrastructure keys
module enablement
subscription plans
permissions
```

---

## 22. Business Object Settings Ownership

Business Object settings, if needed, should live under:

```txt
src/business-objects/settings.ts
```

Use sparingly.

Business Objects should not become highly client-customizable entities too early.

The more customizable a Business Object becomes, the harder it becomes for modules, reports, imports, exports, search, and AI to reuse it consistently.

---

## 23. Settings and Events

Settings changes should emit events.

Recommended event namespace:

```txt
kernel.setting.updated
kernel.setting.reset
```

Payloads must be minimal.

Example:

```ts
await sdk.events.emit(ctx, 'kernel.setting.updated', {
  module: 'inventory',
  key: 'stock.allowNegativeStock',
})
```

Payloads must not include:

```txt
orgId
full setting history
secrets
large values
sensitive data
```

If a future Audit Log Service exists, it can consume these events.

Do not implement Audit Log just for settings.

---

## 24. Settings and AppCare

Settings are part of AppCare because configuration support is part of the recurring service.

But AppCare does not mean unlimited settings customization.

Allowed AppCare examples:

```txt
change default currency
rename product code label
enable a documented module option
reset a setting to default
explain what a setting does
```

Not automatically included:

```txt
invent a new setting
create a custom workflow toggle
add custom fields
build a new module
create client-specific UI
change security rules
```

If a client repeatedly asks for a new setting, classify it:

```txt
configuration improvement
module enhancement
new module candidate
Platform Service evidence
custom/premium request
reject/defer
```

---

## 25. Settings and One-Day Delivery

Settings help one-day delivery because they allow quick client configuration without code changes.

But this only works if settings are:

```txt
few
documented
validated
safe
understandable
reusable
```

Too many settings make delivery slower.

A platform with 500 random toggles is harder to operate than a platform with 50 well-designed settings.

The goal is not maximum configurability.

The goal is:

```txt
repeatable setup for common SME variations
```

---

## 26. Settings and Client-Specific Requests

When a client asks for behavior that sounds like a setting, ask:

```txt
Is this likely to be useful for future clients?
Is this safe to expose?
Can it be validated simply?
Does it alter security, tenancy, or permissions?
Does it add support burden?
Does it belong in module logic instead?
Does it actually require a new module or workflow?
```

### 26.1 Good Setting Candidate

Client says:

```txt
We call employees "Team Members" in our company.
```

Possible setting:

```txt
objects.employee.displayLabel = "Team Member"
```

But only if we want label customization at that level.

### 26.2 Bad Setting Candidate

Client says:

```txt
Managers can approve expenses below ₱5,000, but only if the employee is from Cebu and the request is submitted before Friday, except for fuel expenses.
```

This is not a simple setting.

This is workflow logic.

For MVP, keep it module-local if approved. Later, it may become evidence for Approval Workflow / Workflow Engine, but not now.

---

## 27. Default Kernel Settings

Recommended initial kernel setting definitions:

```txt
kernel.display.currency
kernel.display.timezone
kernel.display.dateFormat
kernel.display.timeFormat
kernel.display.numberFormat
kernel.organization.businessNameLabel
```

Defaults:

```txt
currency: PHP
timezone: Asia/Manila
dateFormat: MMM d, yyyy
timeFormat: h:mm a
numberFormat: en-PH
businessNameLabel: Company
```

Do not overbuild localization in MVP.

Philippine SME defaults are acceptable.

---

## 28. Recommended MVP Settings by Module

These are candidate settings, not mandatory implementation for every module.

### 28.1 Inventory

```txt
inventory.stock.allowNegativeStock = false
inventory.stock.lowStockEnabled = false
inventory.product.defaultUnit = "pcs"
inventory.numbering.adjustmentPrefix = "ADJ"
```

### 28.2 Leave

```txt
leave.requests.allowHalfDay = false
leave.balances.enabled = false
leave.balances.defaultAnnualLeaveDays = 0
```

### 28.3 CRM

```txt
crm.pipeline.defaultStage = "new"
crm.followUps.enabled = false
```

### 28.4 Purchasing

```txt
purchasing.approvals.enabled = false
purchasing.numbering.purchaseRequestPrefix = "PR"
purchasing.numbering.purchaseOrderPrefix = "PO"
```

### 28.5 Expenses

```txt
expenses.currency.default = "PHP"
expenses.approvals.enabled = false
```

### 28.6 Assets

```txt
assets.numbering.assetTagPrefix = "ASSET"
assets.maintenance.enabled = true
```

### 28.7 Visitor Management

```txt
visitors.companyName.required = false
visitors.checkout.required = true
```

### 28.8 Incident Reporting

```txt
incidents.severity.default = "medium"
incidents.correctiveActions.enabled = true
```

These settings should be implemented only when the corresponding module is implemented and the setting is explicitly included in the module spec.

---

## 29. Settings Read Path

Settings should be read in server code wherever possible.

Recommended:

```txt
Server Component / Route Handler / Service
  → verified PlatformContext
  → sdk.settings.get(ctx, definition)
  → render/pass safe value to client
```

Avoid client-side settings discovery unless needed for interactive UI.

Client components should receive already-resolved values as props, or call safe tenant-scoped APIs.

Client components must never import server settings SDK.

---

## 30. Settings Write Path

Settings updates should follow this flow:

```txt
User changes setting in UI
  ↓
Client sends { value } to tenant-scoped API
  ↓
API validates route params and body
  ↓
API creates PlatformContext
  ↓
API checks permission
  ↓
SDK validates setting definition and value
  ↓
SDK upserts Setting row
  ↓
SDK emits settings event
  ↓
API returns JSON
  ↓
UI confirms or rolls back optimistic state
```

At no point does the client submit `orgId`.

---

## 31. Caching

Settings may be read often.

For MVP, prefer correctness over complex caching.

Allowed:

```txt
per-request memoization
simple server-side helper that batches getMany
```

Deferred:

```txt
Redis cache
cross-request cache invalidation
client-side global settings cache
background refresh
```

Because settings can affect behavior, stale settings can create confusing support issues.

Do not add Redis or background jobs just for settings in MVP.

---

## 32. Migration and Backward Compatibility

Setting keys are compatibility contracts.

Changing a key can break:

```txt
module behavior
admin settings UI
onboarding scripts
client configuration
support documentation
future AI context
```

### 32.1 Renaming Settings

Renaming a setting requires:

```txt
migration/backfill plan
compatibility period or direct migration
tests
manual update
release note
```

### 32.2 Removing Settings

Removing a setting requires:

```txt
confirm no code reads it
remove from registry
remove UI
clean up rows if necessary
document migration
```

### 32.3 Changing Value Shape

Changing a setting value shape requires data migration.

Example:

Old:

```json
"ASSET"
```

New:

```json
{
  "prefix": "ASSET",
  "padding": 5
}
```

This requires an explicit migration/backfill.

---

## 33. Tests Required

Settings implementation must include tests for:

```txt
reading default value when no row exists
reading override value when row exists
setting update with valid value
setting update with invalid value
unknown setting key rejection
client-supplied orgId rejection
wrong-org access denial
missing permission denial
admin wildcard within correct org
a user from Org A cannot read/write Org B settings
module user cannot update another module's settings
reset to default behavior
event emission on update/reset
no event emission on failed update
no secrets in setting values where enforceable
settings API returns JSON only
API unauthenticated returns 401 JSON
API unauthorized returns 403 JSON
API wrong org returns safe 404
```

Tenant-sensitive tests must use at least two organizations.

Admin-only tests are insufficient.

---

## 34. Architecture Checks

`check:architecture` should eventually block:

```txt
body.orgId in settings routes
query orgId in settings routes
sdk.settings.get(orgId, ...)
sdk.settings.set(orgId, ...)
raw prisma.setting access inside modules
settings updates without permission requirement
unknown setting strings scattered outside definitions
NEXT_PUBLIC_ variables for server-only settings/secrets
secrets stored in Setting definitions
client components importing @/sdk/server settings helpers
```

---

## 35. Forbidden Patterns

The following are forbidden:

```ts
await prisma.setting.findMany({ where: { orgId: body.orgId } })
```

```ts
await sdk.settings.set(body.orgId, 'inventory', 'stock.allowNegativeStock', true)
```

```tsx
<input type="hidden" name="orgId" value={orgId} />
```

```json
{
  "module": "kernel",
  "key": "supabase.serviceRoleKey",
  "value": "..."
}
```

```json
{
  "module": "inventory",
  "key": "customWorkflow",
  "value": "if amount > 5000 then approve()"
}
```

```ts
if (ctx.org.slug === 'client-a') {
  // special setting behavior
}
```

```ts
const setting = await prisma.setting.findUnique({
  where: { orgId_module_key: { orgId, module, key } },
})
```

The last example is forbidden in modules because modules must use SDK/server services, not raw Prisma.

---

## 36. Claude Implementation Rules

Claude must obey these rules when implementing Settings & Configuration:

```txt
Do not implement settings before PlatformContext exists.
Do not accept orgId from request body or query string.
Do not store secrets in Setting.
Do not implement custom fields.
Do not implement workflow engine behavior.
Do not use settings for permissions.
Do not use settings for module enablement.
Do not use settings for subscription plan state.
Do not expose raw JSON editors to normal users.
Do not add Redis or caching infrastructure.
Do not add FastAPI or Python services.
Do not create client-specific settings hacks.
Do not bypass SDK/server boundaries.
```

Claude must implement:

```txt
registered setting definitions
Zod validation
server-side SDK helpers
API-safe errors
permission enforcement
two-org tenant tests
client-supplied orgId rejection tests
event emission tests
UI patterns from the Design System
```

---

## 37. Implementation Package Checklist

Before Claude implements Settings & Configuration, provide:

```txt
[ ] Frozen Kernel API Contract
[ ] Frozen PlatformContext/Auth helper documents
[ ] Frozen Permission Enforcement document
[ ] Frozen Data Validation/Zod document
[ ] Frozen Secrets Management document
[ ] Frozen Design System Form/State standards
[ ] Approved settings registry shape
[ ] Approved initial setting definitions
[ ] Required API paths
[ ] Required permission names
[ ] Required tests
```

---

## 38. Acceptance Criteria

The Settings & Configuration subsystem is acceptable when:

```txt
[ ] Settings are read through SDK/server helpers
[ ] Settings are written through SDK/server helpers
[ ] Every setting has a registered definition
[ ] Every setting has a default value
[ ] Every setting has a Zod schema
[ ] Unknown setting keys are rejected
[ ] Invalid values return VALIDATION_ERROR
[ ] Client-supplied orgId is rejected
[ ] Settings APIs use /api/orgs/[orgSlug]/...
[ ] Settings APIs return JSON only
[ ] Settings APIs never redirect
[ ] Settings APIs create verified PlatformContext
[ ] Settings APIs enforce permission
[ ] A user from Org A cannot read Org B settings
[ ] A user from Org A cannot update Org B settings
[ ] A user without settings permission cannot update settings
[ ] Module users cannot update other modules' settings
[ ] Admin wildcard works only inside verified org
[ ] Settings are not used for module enablement
[ ] Settings are not used for permissions
[ ] Settings are not used for subscription plans
[ ] Settings do not store secrets
[ ] Settings changes emit safe events
[ ] Failed settings updates do not emit events
[ ] UI shows defaults clearly
[ ] UI supports safe reset to default
[ ] UI uses optimistic behavior only where safe
[ ] Tests include at least two organizations
[ ] Architecture checks block known unsafe patterns
[ ] Typecheck, tests, architecture checks, and build pass
```

---

## 39. Non-Goals

This document does not implement:

```txt
Feature Flag system beyond OrgModule
Subscription billing
Secret management infrastructure
Custom fields engine
Dynamic Form Engine
Dynamic CRUD Engine
Workflow Engine
Approval Engine
Notification Service
Audit Log Service
Settings version history
Settings rollback history
Redis caching
Per-client configuration files
Dedicated infrastructure settings
Runtime AI settings
```

Those require separate documents and approval.

---

## 40. Final Rule

The final rule is:

```txt
Settings make the shared platform adaptable.
They must not make the platform fragmented.
```

If a setting helps OneDayOS serve many SMEs with the same codebase, it may belong.

If a setting exists only to avoid making a clear product, module, or commercial decision, it probably does not belong.
