# OneDayOS Engineering Manual — 16 Client Delivery — 03 Client Configuration

**Document ID:** `16-client-delivery/03-client-configuration.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Implementation Status:** Required Before First Paid Client Delivery  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/04-migrations-seeding.md`
- `06-data/05-data-validation-zod.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/02-module-loader-registry.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `15-deployment-operations/00-environments.md`
- `16-client-delivery/00-one-day-delivery-playbook.md`
- `16-client-delivery/01-client-discovery.md`
- `16-client-delivery/02-scope-control.md`

---

## 1. Purpose

This document defines how a client is configured inside OneDayOS after discovery and scope lock.

Client Configuration is the operational process of turning an approved client scope into a working tenant organization inside the shared OneDayOS platform.

It covers:

- organization creation
- subscription/AppCare setup
- module enablement
- role and permission setup
- users
- employees
- branches
- departments
- Business Objects
- module settings
- branding
- client-specific labels
- initial data
- smoke tests
- handover readiness

The goal is to make client onboarding repeatable enough that a founder or implementation engineer can configure a standard client without inventing architecture.

---

## 2. Core Principle

A client configuration is not a new app.

It is a tenant setup inside the shared OneDayOS platform.

```txt
Wrong mental model:
Client request → build a new app

Correct mental model:
Client request → create/configure an Organization inside OneDayOS
```

The correct output of client configuration is:

```txt
OneDayOS Platform
  └── Organization: client-slug
        ├── users
        ├── roles
        ├── permissions
        ├── branches
        ├── departments
        ├── employees
        ├── enabled modules
        ├── module settings
        ├── client configuration
        └── initial data
```

Not:

```txt
client-name-app/
client-name-database/
client-name-supabase-project/
client-name-vercel-project/
client-name-special-code/
```

---

## 3. Non-Goals

Client Configuration is not:

- a custom development phase
- a place to bypass the module system
- a place to create client-specific forks
- a place to create new database schema manually
- a place to create per-client Supabase projects
- a place to create per-client Vercel projects
- a place to add unapproved Platform Services
- a place to add runtime AI features
- a place to add integrations casually
- a place to import messy data without validation
- a place to grant support staff hidden tenant access

Client Configuration should be mostly data and settings, not code.

---

## 4. Definitions

### OneDayOS Organization

A tenant inside the OneDayOS application.

Examples:

```txt
acme-trading
northstar-logistics
juan-dental-clinic
```

The OneDayOS Organization is represented by the `Organization` database model and identified in URLs by `orgSlug`.

### Supabase Organization

The infrastructure account/project group owned by OneDayOS.

Clients do not get their own Supabase Organization in the normal MVP model.

### Client Configuration

The tenant-specific setup that determines how a client uses the shared platform.

Examples:

```txt
enabled modules
roles
permissions
users
branches
departments
settings
labels
initial records
```

### Client Fork

A separate codebase, database, Vercel project, Supabase project, or long-lived branch created for one normal client.

Client forks are forbidden for normal OneDayOS delivery.

---

## 5. Client Configuration Happens After Scope Lock

Client Configuration must not begin until these exist:

```txt
[ ] Client Discovery Brief approved
[ ] Scope Lock approved
[ ] selected modules confirmed
[ ] one-day delivery boundaries confirmed
[ ] AppCare terms understood
[ ] data requirements confirmed
[ ] admin contact confirmed
[ ] go-live date confirmed
```

Claude should not be asked to configure a client from a vague conversation.

Bad prompt:

```txt
Set up this client. They need inventory and leave.
```

Good prompt:

```txt
Using the approved Client Discovery Brief and Scope Lock,
provision Organization `acme-trading` with Inventory and Leave enabled,
roles Admin/Manager/Staff, the provided users, and the approved settings.
Do not create custom code.
```

---

## 6. Configuration Surfaces

Client setup should use these surfaces, in this order:

```txt
1. Organization record
2. Subscription record
3. OrgModule records
4. Roles and permissions
5. Users
6. Employee records
7. Branch and Department records
8. Business Object records
9. Module settings
10. Kernel settings
11. Client theme/branding settings
12. Approved onboarding data imports/scripts
```

Client setup should not use:

```txt
1. new git repositories
2. client-specific branches
3. manual database edits in Supabase dashboard
4. direct production SQL from chat-generated snippets
5. one-off tables without migrations
6. unreviewed module code
7. copied modules renamed for a client
8. hidden support/admin bypasses
```

---

## 7. Required Client Configuration Checklist

Every client configuration must complete this checklist.

```txt
[ ] Organization created
[ ] Organization slug confirmed
[ ] Subscription/AppCare status created
[ ] Enabled modules created in OrgModule
[ ] Default roles created
[ ] Permissions assigned to roles
[ ] Admin user created
[ ] Staff users created or invite process prepared
[ ] Employees created where needed
[ ] Branches created where needed
[ ] Departments created where needed
[ ] Business Objects imported/created where needed
[ ] Module settings configured
[ ] Kernel settings configured
[ ] Branding settings configured, if included
[ ] Initial data validated
[ ] Smoke tests passed
[ ] Handover package prepared
[ ] AppCare record activated
```

---

## 8. Organization Creation

Every client begins as an `Organization`.

Required fields:

```txt
name
slug
isActive
createdAt
updatedAt
```

Recommended slug rules:

```txt
lowercase
letters, numbers, hyphens only
short enough to be readable
stable after go-live
unique globally
not based on temporary project names
```

Example:

```txt
Client legal/trade name: ACME Trading Corporation
Organization name: ACME Trading
Slug: acme-trading
URL: /acme-trading/dashboard
```

Slugs are locators, not authorization.

A user may only access an organization route if the Kernel verifies:

```txt
authenticated user
+ platform User record
+ requested orgSlug
+ user.orgId === organization.id
```

---

## 9. Organization Slug Changes

Changing an organization slug after go-live should be rare.

Reasons:

- bookmarked URLs may break
- training material may reference old URLs
- support records may reference old slug
- browser history may contain old paths
- future integrations may depend on URL paths

If slug changes are supported later, they need a formal process:

```txt
[ ] confirm business reason
[ ] check slug availability
[ ] create redirect/alias strategy if needed
[ ] update documentation
[ ] notify client admin
[ ] test login and module routes
```

MVP recommendation:

```txt
Treat orgSlug as stable after handover.
```

---

## 10. Subscription and AppCare Setup

Every paid client should have a `Subscription` record.

Minimum fields:

```txt
orgId
plan
status
maxUsers
maxModules
storageGb
trialEndsAt
renewsAt
```

Recommended MVP plans:

```txt
trial
starter
pro
enterprise
```

Recommended statuses:

```txt
trial
active
suspended
cancelled
```

AppCare activation should require:

```txt
[ ] production organization exists
[ ] admin user can log in
[ ] enabled modules work
[ ] backup/restore expectations explained
[ ] support channel confirmed
[ ] payment terms confirmed
[ ] client handover completed
```

Suspension should block module access but should not delete client data.

---

## 11. Module Enablement

Modules are enabled per organization through `OrgModule`.

Example:

```txt
Organization: acme-trading
Enabled Modules:
  inventory
  leave
```

This means:

```txt
Inventory code exists in the platform.
Leave code exists in the platform.
Only acme-trading sees these modules if enabled and permitted.
```

Module enablement is not the same as permission.

A module can be enabled for an organization while a specific user cannot see it.

Correct access model:

```txt
User can access module only if:
  authenticated
  tenant membership valid
  module enabled for organization
  user has required permission
```

---

## 12. Module Enablement Rules

When enabling a module:

```txt
[ ] module exists in code registry
[ ] manifest is valid
[ ] module dependencies are satisfied
[ ] organization plan allows the module count
[ ] module provisioning hook exists if required
[ ] module default settings are inserted if required
[ ] module permissions are assigned to roles
[ ] module routes smoke-tested
```

When disabling a module:

```txt
[ ] confirm client request or billing status
[ ] do not delete module data
[ ] disable OrgModule record
[ ] remove/hide navigation access
[ ] keep historical records intact
[ ] confirm APIs return safe MODULE_NOT_FOUND behavior
```

Do not delete module data just because a module is disabled.

---

## 13. Role Setup

Every client should start with a small role set.

Recommended MVP roles:

```txt
Admin
Manager
Staff
Viewer
```

Not every client needs all roles, but the role model should stay predictable.

### Admin

Admin can manage the organization configuration and modules included in scope.

Admin may receive wildcard permissions inside the organization.

Admin wildcard does not bypass:

```txt
tenant isolation
module enablement
suspended organization state
platform safety rules
```

### Manager

Manager can usually create/update records and approve workflows if the module supports it.

Approval rights should not be assumed globally.

### Staff

Staff can usually create and read records relevant to day-to-day work.

### Viewer

Viewer can read permitted data but cannot mutate or export unless explicitly granted.

---

## 14. Permission Setup

Permissions should be assigned to roles, not directly to users.

Correct:

```txt
User → UserRole → Role → Permission
```

Avoid:

```txt
User → direct custom permission grants
```

Direct user permissions are deferred unless a future ADR approves them.

Permissions should use the approved shape:

```ts
type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Examples:

```txt
objects.employee.read
objects.employee.create
objects.product.read
inventory.stock_movement.create
inventory.stock_adjustment.approve
leave.request.read
leave.request.create
```

Do not grant permissions just because a module is enabled.

---

## 15. User Setup

Users are platform login identities.

User is not the same as Employee.

A user may or may not have an Employee record.

A client admin user should always be created first.

Required user setup fields:

```txt
id = Supabase Auth user id
orgId
name
email
isActive
```

User setup must be server-owned.

Do not create a Supabase Auth user without also creating the matching Prisma `User` record.

Correct registration/provisioning sequence:

```txt
1. create Supabase Auth user server-side
2. create Prisma User record with same id
3. assign role
4. optionally create/link Employee
5. send login/invite instructions
```

Do not let the browser call direct sign-up for organization creation.

---

## 16. Employee Setup

Employee is a shared Business Object.

Employee should be created when the client needs personnel records for:

```txt
leave
approvals
assets
projects
attendance future
HR future
```

Employee can exist without a login.

Examples:

```txt
Warehouse staff with no system login → Employee only
Manager with system access → User + Employee
External accountant login → User only, maybe no Employee
```

Do not duplicate employees inside modules.

Forbidden:

```txt
LeaveEmployee
AssetEmployee
ProjectEmployee
```

Correct:

```txt
Employee
LeaveRequest.employeeId
AssetAssignment.employeeId
ProjectAssignment.employeeId
```

---

## 17. Branch and Department Setup

Branch and Department are Kernel organization-structure primitives.

Use Branch for physical/site/location structure.

Examples:

```txt
Head Office
Cebu Branch
Warehouse 1
Davao Office
```

Use Department for internal organizational grouping.

Examples:

```txt
Operations
Sales
Finance
HR
Warehouse Team
```

Departments may optionally belong to branches.

This supports both patterns:

```txt
Organization → Branch → Department
Organization → Department
```

Do not create a new Branch or Department model inside modules.

---

## 18. Warehouse Setup

Warehouse is a Business Object, not a Branch.

A Branch may have zero, one, or multiple Warehouses.

Examples:

```txt
Branch: Head Office
Warehouses:
  Main Stockroom
  Demo Unit Storage

Branch: Cebu Branch
Warehouses:
  Cebu Warehouse
```

Do not automatically create a Warehouse for every Branch unless the client actually tracks stock there.

Do not automatically treat every Warehouse as a Branch.

---

## 19. Business Object Setup

Business Objects should be configured/imported only when needed by enabled modules.

Common Business Objects:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Rules:

```txt
[ ] Business Objects are shared
[ ] modules do not own them
[ ] modules do not duplicate them
[ ] module-specific fields go in extension tables
[ ] imports validate tenant-safe uniqueness
[ ] soft-deleted records are handled explicitly
```

Examples:

```txt
Inventory setup may require Product, ProductCategory, Supplier, Warehouse.
Leave setup may require Employee, Branch, Department.
CRM setup may require Customer.
```

---

## 20. Module Settings Setup

Each module may have settings.

Settings are stored through the approved settings system, not hard-coded per client.

Example module settings:

```txt
inventory.defaultUnit
inventory.allowNegativeStock
inventory.lowStockThresholdMode
leave.annualLeaveDefaultDays
leave.requiresApproval
crm.defaultPipelineName
```

Settings must be:

```txt
tenant-scoped
module-scoped
validated with Zod
safe to expose only if client-safe
documented in module spec
```

Settings must not store secrets.

---

## 21. Kernel Settings Setup

Kernel settings apply to organization-level platform behavior.

Examples:

```txt
organization.displayName
organization.timezone
organization.dateFormat
organization.currency
organization.logoUrl
organization.brandColor
organization.defaultLandingModule
```

For Philippine SMEs, likely defaults:

```txt
timezone: Asia/Manila
currency: PHP
dateFormat: yyyy-MM-dd or MMM d, yyyy
```

These defaults should be configurable later, but they should not require code changes.

---

## 22. Branding Setup

Branding should be configuration, not custom CSS per client.

MVP branding may include:

```txt
organization name
logo URL
brand color
```

Branding must not break the OneDayOS design system.

Avoid:

```txt
client-specific Tailwind files
client-specific component variants
client-specific page layouts
client-specific CSS hacks
```

Correct:

```txt
settings-driven logo and limited brand token overrides
```

OneDayOS should still feel like OneDayOS.

Client branding should be a light skin, not a full redesign.

---

## 23. Initial Data Setup

Initial data can come from:

```txt
manual entry
CSV prepared by founder/client
controlled onboarding script
future import engine
```

The full Import/Export Engine is deferred.

Limited onboarding scripts are allowed if they follow data-security rules.

Initial data rules:

```txt
[ ] validate before writing
[ ] reject client-supplied orgId
[ ] derive orgId from approved target organization
[ ] use services where possible
[ ] respect Business Object uniqueness
[ ] avoid direct raw SQL
[ ] produce import summary
[ ] keep source file secure
[ ] delete temporary files when no longer needed
```

Bad import behavior:

```txt
Paste arbitrary SQL into Supabase
Import records with orgId from CSV
Create duplicate Product/Customer/Employee tables
Bypass service validation
Ignore row errors silently
```

Good import behavior:

```txt
Parse CSV
Validate rows
Resolve tenant context
Use approved service/provisioning helper
Report successes and failures
Run smoke test after import
```

---

## 24. Client-Supplied `orgId` Is Forbidden

Client configuration tools, scripts, APIs, and forms must not trust `orgId` from client input.

Forbidden CSV column:

```csv
orgId,name,email
org_123,Alice,alice@example.com
```

Correct CSV:

```csv
name,email
Alice,alice@example.com
```

The provisioning command or admin operation should specify the target organization securely.

Example:

```bash
npm run client:import employees -- --org acme-trading --file employees.csv
```

The script resolves `acme-trading` server-side and creates a verified context.

---

## 25. Provisioning Scripts

MVP client setup may use founder/developer-run provisioning scripts.

Potential scripts:

```txt
client:create-org
client:create-admin
client:enable-module
client:assign-role
client:import-employees
client:import-products
client:smoke-test
```

Provisioning scripts must:

```txt
[ ] run only in server/ops context
[ ] require explicit environment confirmation
[ ] require explicit org slug
[ ] validate inputs
[ ] never accept orgId from uploaded files
[ ] be idempotent where practical
[ ] log safe summaries
[ ] avoid printing secrets or full records
[ ] support dry-run where practical
```

Provisioning scripts must not:

```txt
[ ] run automatically during Vercel build
[ ] run automatically on every deployment
[ ] modify production without explicit command
[ ] call browser-only SDKs
[ ] bypass Prisma migrations
[ ] create schema changes
```

---

## 26. Client Configuration Data Model

The MVP should avoid one giant `ClientConfiguration` JSON blob.

Use dedicated platform tables where they already exist:

```txt
Organization
Subscription
OrgModule
Role
Permission
UserRole
Setting
Branch
Department
Employee
Business Object tables
Module-owned settings/tables
```

Use `Setting` only for actual settings, not for primary business records.

Bad:

```txt
Setting: inventory.products = huge JSON array
Setting: users = huge JSON array
Setting: employees = huge JSON array
```

Good:

```txt
products table
employees table
settings table only for configuration values
```

---

## 27. Configuration vs Customization

A request is configuration when it can be handled through existing settings, modules, roles, labels, or seed data.

Examples:

```txt
enable Inventory
turn on Leave approvals
add branches
define departments
set default leave days
set low-stock threshold
create Manager role
change logo
```

A request is customization when it requires new behavior, new workflows, new tables, new APIs, or new module logic.

Examples:

```txt
custom approval routing based on amount and branch
integrate with biometric attendance device
send SMS to customers
generate BIR-specific tax report
build vehicle maintenance tracker
```

Configuration is part of one-day delivery.

Customization requires classification and approval.

---

## 28. Handling Requests Outside Existing Configuration

During configuration, the client may ask for something extra.

Use this decision ladder:

```txt
1. Can we solve it with existing settings?
2. Can we solve it with existing roles/permissions?
3. Can we solve it with existing module behavior?
4. Can we solve it with a module extension table?
5. Is it a clean new draft module?
6. Is it a Platform Service candidate?
7. Is it custom/premium work?
8. Should we reject/defer it?
```

Do not say yes immediately during configuration.

Recommended response:

```txt
That is outside the locked one-day scope. We can record it as a follow-up request and classify whether it should be configuration, an enhancement, a new module, or custom work.
```

---

## 29. Example Configuration — Inventory Client

Client:

```txt
ACME Trading
```

Modules:

```txt
Inventory
```

Configuration:

```txt
Organization:
  name: ACME Trading
  slug: acme-trading

Subscription:
  plan: starter
  status: active
  maxUsers: 10
  maxModules: 3

Modules:
  inventory enabled

Roles:
  Admin
  Warehouse Manager
  Warehouse Staff
  Viewer

Business Objects:
  ProductCategory
  Product
  Supplier
  Warehouse

Branches:
  Head Office
  Cebu Branch

Warehouses:
  Main Warehouse
  Cebu Warehouse

Settings:
  inventory.allowNegativeStock = false
  inventory.defaultUnit = pcs
```

What should not happen:

```txt
Create acme-inventory app
Create separate Supabase project
Create custom Product table
Add ACME-specific code paths
Build generic Attachment Service just because they ask about product photos
```

---

## 30. Example Configuration — Leave Management Client

Client:

```txt
Northstar Services
```

Modules:

```txt
Leave
```

Configuration:

```txt
Organization:
  name: Northstar Services
  slug: northstar-services

Roles:
  Admin
  HR Manager
  Department Manager
  Employee

Business Objects:
  Employee

Org Structure:
  Branches optional
  Departments required

Settings:
  leave.defaultAnnualDays = 5 or 10, depending on client policy
  leave.requiresApproval = true
  leave.allowHalfDay = true
```

What should not happen:

```txt
Create LeaveEmployee model
Treat User as Employee automatically
Build full Workflow Engine for one leave approval flow
Build Notification Service before repeated use cases
```

---

## 31. Example Configuration — Client Asks for Fleet

Client:

```txt
Logistics company
```

Request:

```txt
vehicles
drivers
fuel logs
maintenance records
odometer readings
```

Classification:

```txt
Not configuration.
Not Inventory.
Not generic Assets only.
Likely new draft Fleet module.
```

Correct next step:

```txt
Create a Fleet Module Specification if founder approves.
Use Employee for drivers.
Maybe use Supplier for repair shops/fuel vendors.
Fleet owns Vehicle, FuelLog, MaintenanceRecord.
Enable only for that organization at first.
```

Incorrect next step:

```txt
Hack vehicle fields into Assets.
Create client-specific app fork.
Create Employee.vehiclePlateNumber.
Create Product rows for trucks.
```

---

## 32. Smoke Testing After Configuration

Every configured client must pass smoke tests before handover.

Minimum smoke test checklist:

```txt
[ ] Client admin can log in
[ ] Admin lands on correct org dashboard
[ ] Admin cannot access another org
[ ] Enabled module appears in sidebar
[ ] Disabled module does not appear
[ ] Staff user sees only permitted navigation
[ ] Staff user cannot access unauthorized API/action
[ ] Business Object list loads
[ ] Module list page loads
[ ] Create form works for approved record
[ ] Validation error appears for invalid input
[ ] Client-supplied orgId is not accepted by APIs/forms
[ ] Soft-deleted test record does not appear in normal list
[ ] Logout works
[ ] Handover URL confirmed
```

If smoke tests fail, do not hand over.

---

## 33. Configuration Review Before Handover

Before handover, the founder/implementer should review:

```txt
[ ] organization name and slug
[ ] enabled modules
[ ] user list
[ ] role assignments
[ ] sample data
[ ] module settings
[ ] client branding
[ ] support contact
[ ] AppCare status
[ ] known limitations
```

The client should receive a clear explanation of what was configured and what is not included.

---

## 34. Handover Package Inputs

Client Configuration should produce inputs for the handover document:

```txt
Client name
Organization URL
Admin user email
Enabled modules
Configured roles
Configured branches/departments
Initial data loaded
Known limitations
Support channel
AppCare coverage
Out-of-scope requests logged
```

This allows the next document, `16-client-delivery/05-handover.md`, to be generated from real configuration data.

---

## 35. Configuration Change Requests After Handover

After handover, changes should be classified:

```txt
Bug
Configuration change
Enhancement
New module
Platform Service candidate
Custom/premium work
Reject/defer
```

Examples:

| Request | Classification |
|---|---|
| Add a user | Configuration / AppCare support |
| Change logo | Configuration |
| Enable Inventory | Configuration / module sale |
| Add approval levels to Leave | Enhancement or future Approval Service candidate |
| Upload receipts to Expenses | Future Attachment Service evidence or module-local feature |
| Build payroll | New module / high-risk domain review |
| Give all staff access to all clients | Reject |

---

## 36. Configuration and AppCare

AppCare may include limited configuration support.

Included examples:

```txt
add/remove users
reset role assignment
enable purchased module
minor setting changes
clarify how configured workflow works
```

Not automatically included:

```txt
new module development
custom workflows
large data cleanup
integrations
custom reports
AI automations
file storage features
complex migration from old systems
```

AppCare must stay commercially viable.

---

## 37. Security Rules

Client Configuration must obey all security rules:

```txt
[ ] no client-supplied orgId
[ ] no support backdoor
[ ] no raw Prisma in modules
[ ] no direct Kernel imports inside modules
[ ] no direct module-to-module imports
[ ] no direct production SQL without approved operations process
[ ] no secrets in settings
[ ] no secrets in handover docs
[ ] no production secrets sent to Claude
[ ] no full client data pasted into AI tools
[ ] no shared admin passwords
```

Client configuration should create secure defaults, not shortcuts.

---

## 38. Claude Implementation Rules

Claude may help with client configuration only from approved inputs.

Claude may:

```txt
generate provisioning scripts
write seed/provisioning helpers
write validation schemas
write smoke-test scripts
prepare handover drafts
update module settings code if approved
create a new draft module if a frozen module spec exists
```

Claude may not:

```txt
invent client-specific architecture
create client forks
create per-client Supabase/Vercel projects
ask for production secrets
run production migrations
paste raw SQL as the primary solution
add unapproved Platform Services
add runtime AI features
bypass tenant isolation
create hidden support/admin bypasses
```

Claude prompt template:

```md
You are configuring a OneDayOS client organization.

Authoritative documents:
- 16-client-delivery/03-client-configuration.md
- approved Client Discovery Brief
- approved Scope Lock

Rules:
- Do not create a new app.
- Do not create a client fork.
- Do not create per-client infrastructure.
- Do not accept client-supplied orgId.
- Use organization slug to resolve verified PlatformContext.
- Use existing modules and settings only unless a frozen module spec authorizes new code.
- Add or update smoke tests for the configuration path if code changes are required.

Task:
Configure [CLIENT_NAME] according to the approved brief.
Report exactly what records/settings/scripts were created or changed.
```

---

## 39. Architecture Checks

The platform should eventually include architecture checks that detect configuration anti-patterns.

Examples:

```txt
client-specific directories under src/modules
hard-coded org slugs in module code
hard-coded client names in business logic
imports from @/kernel inside modules
raw Prisma imports inside modules
sdk.getDb(orgId)
client-supplied orgId schemas
NEXT_PUBLIC_ server secrets
per-client environment variable patterns
```

Example forbidden code:

```ts
if (orgSlug === 'acme-trading') {
  // special behavior
}
```

Correct alternative:

```txt
setting-driven behavior
module setting
feature flag
role/permission
approved module extension
```

---

## 40. Required Acceptance Criteria

This document is accepted when:

```txt
[ ] It defines client configuration as tenant provisioning, not app building.
[ ] It explains organization, subscription, module, role, user, employee, branch, department, Business Object, settings, and branding setup.
[ ] It forbids per-client forks and per-client infrastructure for normal MVP clients.
[ ] It defines module enablement separately from permission.
[ ] It defines user separately from employee.
[ ] It defines client-supplied orgId as forbidden.
[ ] It defines initial data setup rules.
[ ] It defines smoke tests before handover.
[ ] It defines how to handle post-handover changes.
[ ] It defines Claude implementation restrictions.
```

---

## 41. Founder Checklist

Before configuring a real client, confirm:

```txt
[ ] Discovery Brief approved
[ ] Scope Lock approved
[ ] modules selected
[ ] client admin identified
[ ] users list prepared
[ ] roles/permissions agreed
[ ] org structure known
[ ] initial data received and cleaned
[ ] module settings decided
[ ] branding assets received, if included
[ ] handover schedule confirmed
[ ] AppCare terms accepted
```

After configuring:

```txt
[ ] smoke tests passed
[ ] client URL works
[ ] admin login works
[ ] module navigation works
[ ] staff permissions verified
[ ] handover package prepared
[ ] out-of-scope requests logged
[ ] AppCare activated
```

---

## 42. Summary

Client Configuration is the bridge between the OneDayOS platform and the client’s actual business use.

It must be fast, repeatable, secure, and boring.

The correct mindset is:

```txt
Configure the tenant.
Enable the modules.
Set the roles.
Load the data.
Test the access.
Handover the system.
Do not fork the app.
```

If a client request cannot fit configuration, classify it properly before building anything.

OneDayOS wins by turning client delivery into repeatable platform configuration, not by reinventing a custom app every time.
