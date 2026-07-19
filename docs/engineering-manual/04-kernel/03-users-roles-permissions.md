# OneDayOS Engineering Manual  
# 04 Kernel / 03 Users, Roles & Permissions

**Document ID:** `04-kernel/03-users-roles-permissions.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Owner:** OneDayOS Founder  
**Last Updated:** July 2026  
**Implementation Allowed:** No — freeze required before Claude implementation  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `13-security/08-production-readiness-gate.md`
- `13-security/09-security-stabilization-new-build-spec.md`
- `04-kernel/00-kernel-overview.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`

**Supersedes / Clarifies:**

- Any illustrative Permission schema snippets in earlier Kernel documents.
- The previous MVP plan's nullable `Permission.resource` design.

---

# 1. Purpose

This document defines the OneDayOS **User**, **Role**, **UserRole**, and **Permission** model.

It answers:

- What is a OneDayOS platform user?
- How does a platform user relate to a Supabase Auth user?
- How does a platform user relate to an Employee?
- What is a Role?
- What is a Permission?
- How are roles scoped to organizations?
- How are permissions represented?
- Which default roles exist?
- How should role assignment work?
- What must never be trusted from the client?
- What belongs in this document versus the Authorization Enforcement document?

This document is **not** just a schema description. It is the access-control model for the entire platform.

The restarted OneDayOS build must not repeat the old MVP problem where a permission system existed but no routes or services actually used it. This document defines the model. The next document, `04-kernel/04-authorization-enforcement.md`, defines the runtime enforcement rules.

---

# 2. Core Decision

OneDayOS uses **organization-scoped RBAC** for MVP.

```txt
Supabase Auth User
  ↓ same id
OneDayOS User
  ↓ belongs to one Organization in MVP
UserRole assignments
  ↓ grant org-scoped Roles
Role Permissions
  ↓ authorize actions inside enabled modules
PlatformContext
  ↓ carries verified user + org + role context into services
```

The core model is:

```txt
User belongs to exactly one Organization in MVP.
Role belongs to exactly one Organization.
UserRole belongs to exactly one Organization.
Permission belongs to exactly one Organization and one Role.
Modules declare possible permissions.
Roles grant actual permissions.
APIs and services enforce permissions.
UI visibility is convenience only.
```

The role and permission system must be:

- tenant-scoped
- simple enough for SMEs
- strict enough for multi-tenant safety
- flexible enough for future modules
- compatible with AI-assisted module generation
- enforceable through tests

---

# 3. Non-Goals

This document does **not** define:

- Supabase login mechanics.
- Registration UI.
- Tenant route resolution.
- API auth response format.
- Runtime permission enforcement flow.
- Dynamic role management UI design.
- Row Level Security.
- Multi-organization users.
- User invitations.
- External identity providers.
- Field-level permissions.
- Attribute-based access control.
- Approval workflows.
- Audit log service.
- Platform support impersonation.
- Client billing plans.

Those are separate documents or future phases.

---

# 4. Important Correction From The Previous MVP Plan

The previous MVP plan used this shape:

```prisma
model Permission {
  roleId   String
  module   String
  action   String
  resource String?

  @@unique([roleId, module, action, resource])
}
```

That design has a subtle but serious database problem.

In PostgreSQL, normal unique constraints treat `NULL` values as distinct. This means multiple rows like this may be allowed:

```txt
roleId = admin-role
module = inventory
action = read
resource = NULL
```

Because `resource` is nullable, the uniqueness rule is weaker than it looks.

For the restarted build, this document changes the design:

```txt
Permission.resource is not nullable.
Use '*' to mean all resources.
```

So the permission becomes:

```txt
module='inventory', action='read', resource='*'
```

instead of:

```txt
module='inventory', action='read', resource=null
```

This makes uniqueness predictable, easier to test, and easier for Claude to implement correctly.

---

# 5. Definitions

## 5.1 Supabase Auth User

The **Supabase Auth User** is the identity-provider record managed by Supabase Auth.

It owns:

- email authentication
- password authentication
- auth session
- refresh tokens
- auth cookies
- account identity

It does **not** own:

- organization membership
- roles
- permissions
- module access
- employee profile
- application preferences

The Supabase Auth user ID must equal the OneDayOS `User.id`.

```txt
supabase.auth.users.id === users.id
```

---

## 5.2 OneDayOS User

A **User** is the platform identity inside OneDayOS.

A User answers:

```txt
Who is this person inside the OneDayOS platform?
Which Organization do they belong to?
Are they active?
Which roles do they have?
Are they linked to an Employee?
```

The User record is stored in Prisma/PostgreSQL.

---

## 5.3 Employee

An **Employee** is a shared Business Object representing a worker/person in the business.

A User and an Employee are not the same thing.

```txt
User = platform login identity
Employee = business/personnel record
```

An Employee may or may not have login access.

Examples:

```txt
Warehouse staff with login
→ User + Employee

Delivery rider recorded in HR but no login
→ Employee only

External accountant with system access but not company employee
→ User only
```

This distinction is required for HR, Leave, Assets, Projects, Approvals, and future workflows.

---

## 5.4 Role

A **Role** is a named collection of permissions within one Organization.

Examples:

```txt
Admin
Staff
Inventory Manager
HR Officer
Approver
Viewer
```

Roles are org-scoped.

```txt
ABC Hardware Admin ≠ Northstar Logistics Admin
```

A role created in one Organization must never be assignable to a user in another Organization.

---

## 5.5 UserRole

A **UserRole** assigns one Role to one User inside one Organization.

One user may have multiple roles.

Example:

```txt
Maria Santos
  - Staff
  - Inventory Manager
  - Purchase Approver
```

The join table must include `orgId` even though it can be inferred through User and Role. This is deliberate.

Reason:

```txt
Every tenant-scoped row should be directly tenant-scoped by orgId.
```

This improves:

- query safety
- indexing
- tenant isolation tests
- future data export
- future RLS
- future support tooling

---

## 5.6 Permission

A **Permission** grants one action against one module/resource pair.

The canonical shape is:

```txt
module
resource
action
conditions
```

Example:

```txt
module:   inventory
resource: product
action:   read
```

Another example:

```txt
module:   kernel
resource: users
action:   manage
```

Permissions are granted to Roles, not directly to Users.

---

## 5.7 Permission Key

A **Permission Key** is the human-readable representation of a permission.

Format:

```txt
{module}.{resource}.{action}
```

Examples:

```txt
kernel.users.read
kernel.users.manage
kernel.roles.manage
kernel.settings.update
inventory.product.read
inventory.stock_adjustment.create
inventory.stock_adjustment.approve
crm.customer.read
leave.leave_request.approve
```

The database stores permission fields separately, but UI, documentation, logs, and tests may use the permission key format.

---

## 5.8 Wildcard Permission

A wildcard permission uses `*` in one or more fields.

Examples:

```txt
*.*.*
inventory.*.*
inventory.product.*
inventory.*.read
```

The most powerful permission is:

```txt
module:   *
resource: *
action:   *
```

This grants full access inside the user's verified Organization only.

It does **not** bypass tenant isolation.

It does **not** enable disabled modules.

It does **not** grant access to another Organization.

---

## 5.9 Conditions

`conditions` is a future ABAC extension field.

Examples of future conditions:

```json
{ "scope": "own_branch" }
```

```json
{ "maxAmount": 50000 }
```

```json
{ "departmentId": "same_as_user" }
```

For MVP:

```txt
conditions must be null.
```

If a permission has non-null `conditions` before a condition evaluator exists, permission evaluation must treat it as **not granted**, not as unrestricted access.

This prevents a dangerous failure mode where a conditional permission is accidentally interpreted as a full permission.

---

# 6. Authoritative Data Model

This is the authoritative MVP schema shape for Users, Roles, UserRoles, and Permissions.

The exact Prisma syntax may evolve during implementation, but Claude must preserve the semantics.

```prisma
model User {
  id        String   @id // = Supabase auth.users.id
  orgId     String
  name      String
  email     String   @unique
  avatarUrl String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  org      Organization @relation(fields: [orgId], references: [id])
  employee Employee?
  roles    UserRole[]

  @@index([orgId])
  @@index([orgId, isActive])
  @@map("users")
}

model Role {
  id          String    @id @default(cuid())
  orgId       String
  name        String
  description String?
  isSystem    Boolean   @default(false)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org         Organization @relation(fields: [orgId], references: [id])
  permissions Permission[]
  userRoles   UserRole[]

  @@unique([orgId, name])
  @@index([orgId, isActive])
  @@map("roles")
}

model UserRole {
  orgId     String
  userId    String
  roleId    String
  createdAt DateTime @default(now())
  createdBy String?

  org  Organization @relation(fields: [orgId], references: [id])
  user User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role         @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([orgId, userId, roleId])
  @@index([orgId, roleId])
  @@index([orgId, userId])
  @@map("user_roles")
}

model Permission {
  id         String   @id @default(cuid())
  orgId      String
  roleId     String
  module     String
  resource   String   @default("*")
  action     String
  conditions Json?
  createdAt  DateTime @default(now())

  org  Organization @relation(fields: [orgId], references: [id])
  role Role         @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([orgId, roleId, module, resource, action])
  @@index([orgId, module, resource, action])
  @@index([orgId, roleId])
  @@map("permissions")
}
```

---

# 7. Why `UserRole.orgId` And `Permission.orgId` Are Required

The previous MVP design relied on this inference:

```txt
Permission → Role → Organization
UserRole → User → Organization
UserRole → Role → Organization
```

That is logically valid, but not operationally ideal for a multi-tenant platform.

For the restarted build, tenant-scoped join/configuration rows should include `orgId` directly.

This gives us:

```txt
where: { orgId: ctx.org.id }
```

on every access-control query.

It also makes future RLS easier because every tenant-scoped table can be filtered by `org_id` directly.

The service layer must still validate consistency:

```txt
User.orgId must equal UserRole.orgId
Role.orgId must equal UserRole.orgId
Permission.orgId must equal Role.orgId
```

Do not rely on duplicated `orgId` alone. It is a scoping and indexing aid, not a substitute for service validation.

---

# 8. User Model Rules

## 8.1 User ID

`User.id` must equal the Supabase Auth user ID.

```txt
Supabase Auth user id: 4b877...
Prisma User.id:        4b877...
```

Do not create a separate internal user ID for MVP.

Reason:

- simpler auth lookup
- fewer identity joins
- lower risk of orphan mapping bugs
- easier debugging
- easier support

---

## 8.2 User Organization

For MVP:

```txt
User belongs to exactly one Organization.
```

This is represented by:

```prisma
User.orgId String
```

Multi-organization membership is deferred.

Do not introduce:

```txt
UserOrganization
OrganizationMembership
AccountMembership
WorkspaceMembership
```

until a real commercial need appears.

---

## 8.3 User Email

`User.email` should be unique in MVP.

Reason:

- Supabase Auth enforces email uniqueness per project.
- OneDayOS MVP uses one Supabase project for the platform.
- One platform user belongs to one org.

Future multi-org users may require a membership model. That future change should be handled through an ADR, not guessed now.

---

## 8.4 User Active Status

`User.isActive` controls whether a platform user can access the application.

If `User.isActive = false`:

```txt
login may succeed at Supabase level
but OneDayOS PlatformContext creation must fail
and protected routes/APIs must deny access
```

This is important because disabling a user inside OneDayOS should not require deleting their Supabase Auth account.

---

## 8.5 User vs Employee

A User may link to an Employee through `Employee.userId`.

Examples:

```txt
User with Employee:
- company staff member with login access

User without Employee:
- external accountant
- owner representative
- implementation consultant

Employee without User:
- staff member tracked for HR/leave/assets but no system login
```

Never assume:

```txt
User always has Employee
Employee always has User
```

Services must handle both cases.

---

## 8.6 No Direct User Permissions In MVP

Permissions are assigned to Roles only.

Do not implement:

```txt
UserPermission
per-user override permissions
allow/deny exceptions
```

unless a future ADR approves it.

Reason:

- per-user overrides become hard to support
- SMEs need understandable access control
- roles are easier for AI and support staff to reason about
- direct user overrides hide security behavior

---

# 9. Role Model Rules

## 9.1 Roles Are Organization-Scoped

Every Role belongs to exactly one Organization.

```txt
Role.orgId is required.
```

A role from Org A must never be assigned to a user from Org B.

The role assignment service must verify:

```ts
user.orgId === ctx.org.id
role.orgId === ctx.org.id
```

before creating a UserRole.

---

## 9.2 Role Names Are Unique Per Organization

This must be enforced:

```prisma
@@unique([orgId, name])
```

Allowed:

```txt
ABC Hardware: Admin
Northstar Logistics: Admin
```

Not allowed:

```txt
ABC Hardware: Admin
ABC Hardware: Admin
```

---

## 9.3 System Roles

System roles are created by the Kernel.

```txt
Role.isSystem = true
```

System roles may have protected behavior.

Examples:

```txt
Admin
Staff
Viewer
```

For MVP, OneDayOS should seed only what it truly needs:

```txt
Admin
Staff
```

Additional roles can be created by admins later.

Do not over-seed many roles just because enterprise systems have them.

---

## 9.4 Admin Role

Every Organization must have an Admin role.

Admin role permission:

```txt
module:   *
resource: *
action:   *
```

The first registered user of an Organization receives Admin.

The Admin role:

- is system-owned
- cannot be deleted
- cannot be renamed in MVP
- cannot lose its final wildcard permission through normal UI
- must always have at least one active user assigned

---

## 9.5 Staff Role

Every Organization should have a Staff role.

MVP Staff role may begin with conservative permissions:

```txt
kernel.profile.read
kernel.profile.update
```

Business module permissions should be granted explicitly later.

Do not give Staff broad module access by default unless there is a deliberate product decision.

---

## 9.6 Custom Roles

Admins may eventually create custom roles such as:

```txt
Inventory Manager
HR Officer
Branch Supervisor
Approver
Viewer
```

Custom roles:

- belong to one org
- can be renamed
- can be deleted if no users depend on them
- can have module permissions
- cannot grant permissions the editing user does not already have, unless the editing user is Admin

The role management UI can be deferred, but the data model must support custom roles from the start.

---

## 9.7 Last Admin Protection

The system must prevent an Organization from losing its last Admin.

Forbidden actions:

```txt
Deactivate last active Admin user
Remove Admin role from last active Admin user
Delete Admin role
Remove Admin wildcard from Admin role
Disable the only Admin's user account
```

This is not optional. Without it, clients can lock themselves out and create AppCare support burden.

---

# 10. Permission Model Rules

## 10.1 Permission Fields

Each Permission has:

```txt
orgId
roleId
module
resource
action
conditions
```

Field meanings:

| Field | Meaning | Example |
|---|---|---|
| `orgId` | Tenant scope | `org_123` |
| `roleId` | Role receiving permission | `role_admin` |
| `module` | Module or `*` | `inventory` |
| `resource` | Resource or `*` | `product` |
| `action` | Action or `*` | `read` |
| `conditions` | Future ABAC restrictions | `null` in MVP |

---

## 10.2 Module

`module` identifies the platform area.

Examples:

```txt
kernel
inventory
crm
leave
purchasing
expenses
assets
visitors
incidents
projects
*
```

Rules:

- module IDs must match Module Manifest IDs
- lowercase only
- kebab-case allowed when necessary
- no spaces
- no display labels
- `*` means all modules

---

## 10.3 Resource

`resource` identifies the entity or capability inside a module.

Examples:

```txt
users
roles
settings
profile
product
stock_movement
stock_adjustment
customer
leave_request
purchase_request
expense_claim
asset
visitor_log
incident_report
*
```

Rules:

- lowercase only
- snake_case preferred for multi-word resources
- `*` means all resources in the module
- resource is never nullable

---

## 10.4 Action

`action` identifies what the user can do.

Standard actions:

```txt
read
create
update
delete
manage
approve
export
import
```

Meanings:

| Action | Meaning |
|---|---|
| `read` | View records or configuration |
| `create` | Create records |
| `update` | Edit records |
| `delete` | Soft-delete or remove records |
| `manage` | Broad administrative control over a resource |
| `approve` | Approve or reject workflow items |
| `export` | Export data |
| `import` | Import data |
| `*` | All actions |

Module-specific actions are allowed only if documented in the module specification.

Examples:

```txt
inventory.stock_adjustment.post
reservations.booking.check_in
assets.asset.assign
```

However, prefer standard actions unless a business workflow genuinely needs a custom action.

---

## 10.5 Conditions

For MVP:

```txt
conditions = null
```

No UI should allow admins to create conditional permissions yet.

No generator should emit conditional permissions yet.

No service should assume conditional permissions work yet.

When ABAC is eventually introduced, the evaluator must be centralized in Kernel.

Modules must not parse `conditions` independently.

---

# 11. Permission Matching Semantics

Permission evaluation must check exact matches and wildcard matches.

Given a required permission:

```txt
module: inventory
resource: product
action: read
```

The following grants access:

```txt
inventory.product.read
inventory.product.*
inventory.*.read
inventory.*.*
*.product.read
*.*.read
*.*.*
```

The following does not grant access:

```txt
inventory.product.create
crm.product.read
inventory.stock_adjustment.read
kernel.*.*
```

Permission matching should be easy to reason about.

Recommended matching logic:

```ts
function matchesPermission(grant, required) {
  return matches(grant.module, required.module)
    && matches(grant.resource, required.resource)
    && matches(grant.action, required.action)
}

function matches(grantValue, requiredValue) {
  return grantValue === '*' || grantValue === requiredValue
}
```

But before a grant is considered valid:

```txt
conditions must be null
or conditions must be evaluated by an approved ABAC evaluator
```

For MVP, non-null conditions mean no match.

---

# 12. Feature Flags vs Permissions

Module enablement and permissions are separate gates.

A module must be both:

```txt
enabled for the Organization
and
allowed for the User by permission
```

Example:

```txt
Inventory module enabled for ABC Hardware
Maria has inventory.product.read
→ Maria can view products
```

Example:

```txt
Inventory module enabled for ABC Hardware
Juan has no inventory permissions
→ Juan cannot view Inventory
```

Example:

```txt
Inventory module disabled for ABC Hardware
Maria has *.*.* as Admin
→ Maria still cannot use Inventory module screens as normal module access
```

Admin may access Kernel settings that enable modules, but disabled modules should not appear or execute as normal business modules.

This distinction matters for subscriptions, module sales, and clean client configuration.

---

# 13. PlatformContext Relationship

The permission system must integrate with `PlatformContext`.

A verified PlatformContext should contain at least:

```ts
type PlatformContext = {
  authUserId: string
  user: {
    id: string
    orgId: string
    name: string
    email: string
    isActive: boolean
  }
  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
    subscriptionStatus?: string
  }
  roles: Array<{
    id: string
    name: string
    isSystem: boolean
  }>
}
```

Permission checks should receive `ctx`, not loose user and org strings.

Preferred:

```ts
await sdk.permissions.can(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

Not preferred:

```ts
await can(userId, 'read', 'inventory', orgId)
```

Forbidden in modules:

```ts
await can(body.userId, body.action, body.module, body.orgId)
```

The context must be created by Kernel auth/tenancy helpers, not by client payloads.

---

# 14. User Lifecycle

## 14.1 Registration

When a new Organization is registered, the server-owned registration flow must create:

```txt
Supabase Auth user
Organization
Subscription
Platform User
Admin Role
Staff Role
Admin wildcard Permission
UserRole assigning first User to Admin
```

This should happen in one logical server-owned sequence.

The first user should become Admin.

Recommended registration result:

```txt
Organization: Acme Corp
User: maria@acme.ph
Role: Admin
Permission: *.*.*
```

---

## 14.2 User Creation After Registration

User creation after org registration is a future admin operation.

MVP may defer invitation flows.

When implemented, user creation must:

- require `kernel.users.manage` or equivalent Admin access
- create Supabase Auth user server-side or send invite through Supabase
- create OneDayOS User
- assign at least one Role
- validate user count against subscription limits
- never accept `orgId` from client payload
- derive org from PlatformContext

---

## 14.3 User Deactivation

Deactivating a user should set:

```txt
User.isActive = false
```

It should not delete the Supabase Auth user by default.

Reason:

- keeps history intact
- avoids deleting audit references later
- supports reactivation
- preserves employee linkage

Protected routes and APIs must reject inactive users during PlatformContext creation.

---

## 14.4 User Reactivation

Reactivating a user should set:

```txt
User.isActive = true
```

Before reactivation:

- verify Organization is active
- verify subscription permits active users
- verify user still belongs to same org
- verify role assignments still make sense

---

## 14.5 User Deletion

Hard-deleting users should be avoided in MVP.

Use deactivation instead.

Hard delete may be needed later for:

- privacy request
- mistaken account creation
- internal cleanup

Hard-delete behavior requires a separate security/data-retention decision.

---

# 15. Role Lifecycle

## 15.1 Create Role

Creating a role requires:

```txt
kernel.roles.manage
```

or Admin wildcard.

The server must derive `orgId` from PlatformContext.

Client payload may include:

```json
{
  "name": "Inventory Manager",
  "description": "Can manage inventory products and stock adjustments",
  "permissions": [
    { "module": "inventory", "resource": "product", "action": "read" },
    { "module": "inventory", "resource": "product", "action": "create" },
    { "module": "inventory", "resource": "product", "action": "update" }
  ]
}
```

Client payload must not include:

```json
{
  "orgId": "org_other_company"
}
```

If `orgId` is present in a role-management payload, reject it.

---

## 15.2 Update Role

Updating a role requires:

```txt
kernel.roles.manage
```

Rules:

- system roles have protected fields
- Admin role cannot be downgraded through normal UI
- role name remains unique per org
- permission changes happen in one transaction
- permission writes are org-scoped

---

## 15.3 Delete Role

Deleting roles should be soft-delete or disallowed when assigned.

MVP recommendation:

```txt
Do not hard-delete roles through normal UI.
Set Role.deletedAt or Role.isActive=false.
```

Forbidden:

- deleting Admin role
- deleting last role of a user if it would leave the user inaccessible unintentionally
- deleting a role from another org

---

## 15.4 Assign Role To User

Assigning a role requires:

```txt
kernel.users.manage
```

or:

```txt
kernel.roles.manage
```

The role assignment service must validate:

```txt
ctx.org.id === targetUser.orgId
ctx.org.id === role.orgId
ctx.org.id === userRole.orgId
```

Never assign a role based only on `roleId` from the client.

A guessed `roleId` from another org must fail even if it exists.

---

## 15.5 Remove Role From User

Removing a role requires the same permissions as assignment.

The service must prevent:

```txt
removing the final Admin assignment from an Organization
```

This check must count only:

- active users
- active roles
- Admin/system role assignment
- same org

---

# 16. Default Roles And Permissions

## 16.1 Minimum MVP Seed

Every new Organization should get:

```txt
Role: Admin
Role: Staff
```

Admin permissions:

```txt
*.*.*
```

Staff permissions:

```txt
kernel.profile.read
kernel.profile.update
```

Optional MVP permission if dashboard requires it:

```txt
kernel.dashboard.read
```

Do not grant business module access to Staff by default unless onboarding configuration explicitly chooses it.

---

## 16.2 Why Not Seed Many Roles?

Do not seed:

```txt
Inventory Manager
HR Officer
Purchasing Officer
CRM Manager
Approver
Accountant
Branch Manager
```

until modules or client configuration need them.

Reason:

- unnecessary choices confuse SMEs
- every role becomes support burden
- many unused roles make permissions look broken
- default roles should be obvious

Generated module specs may recommend role templates later, but Kernel should stay minimal.

---

# 17. Kernel Permissions

Kernel permissions control platform administration.

Recommended MVP Kernel permission resources:

```txt
profile
users
roles
settings
modules
subscription
dashboard
```

Recommended permissions:

```txt
kernel.profile.read
kernel.profile.update
kernel.dashboard.read
kernel.users.read
kernel.users.manage
kernel.roles.read
kernel.roles.manage
kernel.settings.read
kernel.settings.update
kernel.modules.read
kernel.modules.manage
kernel.subscription.read
```

Dangerous permissions:

```txt
kernel.roles.manage
kernel.users.manage
kernel.modules.manage
```

These should usually be Admin-only.

---

# 18. Module Permissions

Each module declares its available permission definitions in its Module Manifest or module permission file.

Example Inventory permissions:

```ts
export const INVENTORY_PERMISSIONS = [
  { module: 'inventory', resource: 'product', action: 'read' },
  { module: 'inventory', resource: 'product', action: 'create' },
  { module: 'inventory', resource: 'product', action: 'update' },
  { module: 'inventory', resource: 'product', action: 'delete' },
  { module: 'inventory', resource: 'stock_level', action: 'read' },
  { module: 'inventory', resource: 'stock_adjustment', action: 'create' },
  { module: 'inventory', resource: 'stock_adjustment', action: 'approve' },
]
```

Modules declare possible permissions.

Roles grant actual permissions.

The Kernel should never assume all users get all module permissions when a module is enabled.

---

# 19. Permission Constants

The Kernel should expose permission constants through the SDK.

Example:

```ts
export const ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  APPROVE: 'approve',
  EXPORT: 'export',
  IMPORT: 'import',
  ALL: '*',
} as const

export const RESOURCES = {
  ALL: '*',
} as const

export const MODULES = {
  ALL: '*',
  KERNEL: 'kernel',
  INVENTORY: 'inventory',
  CRM: 'crm',
  LEAVE: 'leave',
  PURCHASING: 'purchasing',
  EXPENSES: 'expenses',
  ASSETS: 'assets',
  VISITORS: 'visitors',
  INCIDENTS: 'incidents',
  PROJECTS: 'projects',
} as const
```

But do not force modules to import Kernel internals.

Modules should import from:

```ts
import { sdk } from '@/sdk'
```

or module-local permission constants.

---

# 20. SDK Contract

The SDK should expose permission functions.

Minimum MVP SDK surface:

```ts
sdk.permissions.can(ctx, permission)
sdk.permissions.require(ctx, permission)
sdk.permissions.listForUser(ctx)
sdk.permissions.ACTIONS
sdk.permissions.MODULES
```

This document defines the model and matching semantics.

The next Authorization Enforcement document defines exactly when and how `require()` must be called.

Recommended type:

```ts
type PermissionRequirement = {
  module: string
  resource: string
  action: string
}
```

Do not use positional arguments like:

```ts
can(userId, action, module, orgId)
```

That shape is too easy to misuse and too easy for Claude to call incorrectly.

Preferred:

```ts
await sdk.permissions.can(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

---

# 21. Access-Control Query Pattern

Permission evaluation should query within `ctx.org.id` only.

Conceptual query:

```ts
const grants = await db.permission.findMany({
  where: {
    orgId: ctx.org.id,
    roleId: { in: ctx.roles.map((role) => role.id) },
  },
  select: {
    module: true,
    resource: true,
    action: true,
    conditions: true,
  },
})
```

Then evaluate in code:

```ts
return grants.some((grant) =>
  grant.conditions === null &&
  matchesPermission(grant, required)
)
```

Do not query permissions globally.

Forbidden:

```ts
await db.permission.findMany({ where: { roleId: { in: roleIds } } })
```

because it does not include `orgId`.

---

# 22. Permission Caching

MVP does not need complex permission caching.

Permission checks should prioritize correctness over micro-optimization.

Acceptable MVP patterns:

- load roles during PlatformContext creation
- query permissions when needed
- cache permissions within a single request only

Not allowed in MVP:

- global in-memory permission cache shared across tenants
- long-lived permission cache without invalidation
- client-side permission cache used for enforcement

Future permission caching requires an ADR.

---

# 23. UI Visibility Rules

UI may use permissions to hide or disable controls.

Examples:

```txt
hide New Product button if no inventory.product.create
hide Role Settings page if no kernel.roles.manage
disable Delete button if no inventory.product.delete
```

But UI checks are not enforcement.

The API and service layer must still enforce permissions.

This must be repeated in Claude implementation prompts because generated UI often hides buttons but forgets server checks.

---

# 24. API Route Placement

Role and user management APIs should be tenant-scoped by org slug.

Recommended routes:

```txt
/api/orgs/[orgSlug]/kernel/users
/api/orgs/[orgSlug]/kernel/users/[userId]
/api/orgs/[orgSlug]/kernel/roles
/api/orgs/[orgSlug]/kernel/roles/[roleId]
/api/orgs/[orgSlug]/kernel/roles/[roleId]/permissions
/api/orgs/[orgSlug]/kernel/users/[userId]/roles
```

Avoid:

```txt
/api/kernel/users?orgId=...
/api/kernel/roles?orgId=...
```

Reason:

```txt
orgSlug is route context
orgId is server-derived tenant identity
client-supplied orgId is rejected
```

---

# 25. Client Payload Rules

Client payloads may include business inputs.

Allowed examples:

```json
{
  "name": "Inventory Manager",
  "description": "Can manage inventory records"
}
```

```json
{
  "roleIds": ["role_123", "role_456"]
}
```

Client payloads must not include tenant identity.

Forbidden:

```json
{
  "orgId": "org_abc"
}
```

If role/user/permission APIs receive `orgId` in the payload, they should reject the request with `400 BAD_REQUEST`.

Do not silently ignore it.

Rejecting it trains Claude, engineers, and tests to avoid the pattern.

---

# 26. Security Rules

## 26.1 Never Trust Client-Supplied Role IDs Alone

A role ID from the client is only a locator.

Before using it, the server must verify:

```txt
role.orgId === ctx.org.id
```

---

## 26.2 Never Trust Client-Supplied User IDs Alone

A user ID from the client is only a locator.

Before modifying a target user, the server must verify:

```txt
targetUser.orgId === ctx.org.id
```

---

## 26.3 Never Let Users Escalate Themselves Accidentally

A user should not be able to grant themselves Admin unless they already have the required management permission.

Dangerous flow:

```txt
Staff user calls /roles/assign with own userId and Admin roleId
```

Must return:

```txt
403 FORBIDDEN
```

---

## 26.4 Never Allow Cross-Org Role Assignment

This must fail:

```txt
Org A user assigns Org B role to Org A user
Org A user assigns Org A role to Org B user
Org A user modifies Org B permission
```

Even if the caller is Admin in Org A.

Admin is tenant-local.

---

## 26.5 Never Let Wildcard Bypass Tenant Isolation

This is important:

```txt
*.*.* means everything inside ctx.org.id only.
```

It does not mean platform super-admin.

OneDayOS internal support access is a separate future system.

Do not implement it by abusing customer Admin roles.

---

# 27. Error Semantics

Detailed API error formatting belongs in `04-kernel/08-kernel-api-contracts.md`, but this document defines access-control meanings.

Use these distinctions:

| Situation | Status | Code |
|---|---:|---|
| Not logged in | 401 | `UNAUTHENTICATED` |
| Logged in but inactive user | 403 | `USER_INACTIVE` |
| Logged in but wrong org | 404 or 403 | See tenancy document |
| Missing permission | 403 | `FORBIDDEN` |
| Target role not in org | 404 | `NOT_FOUND` |
| Target user not in org | 404 | `NOT_FOUND` |
| Last admin violation | 409 | `LAST_ADMIN_REQUIRED` |
| Client supplied orgId | 400 | `CLIENT_ORG_ID_FORBIDDEN` |
| Invalid permission definition | 400 | `INVALID_PERMISSION` |

For cross-tenant target resources, prefer `404 NOT_FOUND` where appropriate to avoid confirming that another tenant's record exists.

---

# 28. Role Management Service Contract

The Kernel should provide service functions for role/user access management.

Conceptual service:

```ts
class AccessControlService {
  static async listRoles(ctx: PlatformContext): Promise<RoleDTO[]>
  static async createRole(ctx: PlatformContext, input: CreateRoleInput): Promise<RoleDTO>
  static async updateRole(ctx: PlatformContext, roleId: string, input: UpdateRoleInput): Promise<RoleDTO>
  static async deactivateRole(ctx: PlatformContext, roleId: string): Promise<void>
  static async assignRole(ctx: PlatformContext, targetUserId: string, roleId: string): Promise<void>
  static async removeRole(ctx: PlatformContext, targetUserId: string, roleId: string): Promise<void>
  static async listUserRoles(ctx: PlatformContext, targetUserId: string): Promise<RoleDTO[]>
}
```

Every method receives `PlatformContext`.

No method receives loose `orgId`.

---

# 29. Transaction Rules

Role and permission changes should be transactional.

Examples:

```txt
create role + permissions
update role + replace permissions
assign role + verify last-admin constraints
remove role + verify last-admin constraints
```

If any part fails, the entire operation should fail.

This prevents partial states like:

```txt
Role created but permissions missing
Permission created for wrong org
UserRole assigned but role missing
Admin role stripped without replacement
```

---

# 30. Audit Event Preparation

The Audit Log Service is deferred, but access-control mutations should emit events from day one.

Required events:

```txt
kernel.user.created
kernel.user.updated
kernel.user.deactivated
kernel.user.reactivated
kernel.role.created
kernel.role.updated
kernel.role.deactivated
kernel.role.permission_added
kernel.role.permission_removed
kernel.user_role.assigned
kernel.user_role.removed
```

Event naming must follow the platform convention:

```txt
{module}.{entity}.{past_tense_verb}
```

For compound events, use clear entity names:

```txt
kernel.user_role.assigned
```

not:

```txt
roleAssigned
user.role.add
rbac.changed
```

Event payloads should include:

```txt
orgId
targetUserId or roleId
actorUserId
changed fields where appropriate
```

Do not emit sensitive data unnecessarily.

---

# 31. Seed Requirements

The registration path and seed script must both create consistent access-control data.

Minimum seed for a new Organization:

```txt
Admin role
Staff role
Admin wildcard permission
First user assigned to Admin
```

Pseudo-seed:

```ts
const adminRole = await tx.role.create({
  data: {
    orgId: org.id,
    name: 'Admin',
    isSystem: true,
  },
})

await tx.permission.create({
  data: {
    orgId: org.id,
    roleId: adminRole.id,
    module: '*',
    resource: '*',
    action: '*',
    conditions: null,
  },
})

await tx.userRole.create({
  data: {
    orgId: org.id,
    userId: firstUser.id,
    roleId: adminRole.id,
    createdBy: firstUser.id,
  },
})
```

---

# 32. Testing Requirements

This model requires tests before being considered complete.

## 32.1 Schema/Service Tests

Test:

```txt
creates Admin and Staff roles for new org
assigns first user to Admin
Admin has *.*.*
Staff does not have module admin access by default
role names unique per org
same role name allowed across orgs
UserRole requires same org user and role
Permission requires same org role
```

---

## 32.2 Permission Matching Tests

Test:

```txt
exact permission grants access
wrong action denies access
wrong resource denies access
wrong module denies access
module wildcard grants access
resource wildcard grants access
action wildcard grants access
*.*.* grants access
non-null conditions deny access in MVP
inactive role does not grant access
inactive user cannot create PlatformContext
```

---

## 32.3 Tenant Isolation Tests

Test:

```txt
Org A user cannot receive Org B role
Org A user cannot use Org B role ID
Org A admin cannot edit Org B role
Org A admin cannot read Org B permissions
Org A wildcard permission does not grant Org B access
permission query includes orgId
```

---

## 32.4 Last Admin Tests

Test:

```txt
cannot remove Admin role from only active Admin
cannot deactivate only active Admin
cannot delete Admin role
cannot remove Admin wildcard permission through normal service
can remove Admin from one user if another active Admin remains
```

---

## 32.5 API Tests

Test future role/user APIs:

```txt
unauthenticated request returns 401 JSON
missing permission returns 403 JSON
client-supplied orgId returns 400
roleId from another org returns 404
userId from another org returns 404
valid Admin can create role
Staff cannot create role
```

---

# 33. Forbidden Implementation Patterns

Claude must not generate these patterns.

## 33.1 No Raw Org ID In Access-Control APIs

Forbidden:

```ts
const orgId = body.orgId
```

Required:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, params.orgSlug)
```

---

## 33.2 No Direct Prisma From Modules

Forbidden in modules:

```ts
import { prisma } from '@/kernel/db/client'
```

Required:

```ts
import { sdk } from '@/sdk'
```

---

## 33.3 No Global Role Query

Forbidden:

```ts
await prisma.role.findMany()
```

Required:

```ts
await db.role.findMany({ where: { orgId: ctx.org.id } })
```

---

## 33.4 No Permission Check Without Resource

Forbidden:

```ts
await sdk.permissions.can(ctx, 'inventory.read')
```

Required:

```ts
await sdk.permissions.can(ctx, {
  module: 'inventory',
  resource: 'product',
  action: 'read',
})
```

Permissions must be explicit.

---

## 33.5 No Conditional Permission Ignoring

Forbidden:

```ts
if (grant.module === module && grant.action === action) return true
```

because it ignores `conditions`.

Required:

```ts
if (grant.conditions !== null) return false // MVP
```

or use approved condition evaluator in a future ABAC phase.

---

# 34. Implementation Notes For Claude

When Claude implements this document, it must:

1. Use this document as the authoritative RBAC model.
2. Add `orgId` to `UserRole` and `Permission`.
3. Use non-null `Permission.resource` with `'*'` wildcard.
4. Seed Admin and Staff roles for new orgs.
5. Assign first user to Admin during registration.
6. Implement permission matching with module/resource/action wildcards.
7. Treat non-null `conditions` as denied in MVP.
8. Validate user/role/permission org consistency in services.
9. Add last-admin protection.
10. Add tests for permission matching and tenant isolation.
11. Expose permission helpers through the SDK only.
12. Avoid role/permission logic inside business modules.
13. Stop if this document conflicts with an already frozen later document.

Claude must not:

- use nullable `Permission.resource`
- accept client-supplied `orgId`
- create direct user permissions
- implement ABAC conditions
- implement multi-org users
- create a platform super-admin system
- let wildcard permissions bypass tenancy
- skip permission tests

---

# 35. Acceptance Criteria

This document is ready for implementation when the following are true:

```txt
[ ] User model is clearly distinct from Employee
[ ] Role model is org-scoped
[ ] UserRole includes orgId
[ ] Permission includes orgId
[ ] Permission.resource is non-null
[ ] '*' wildcard semantics are defined
[ ] conditions behavior is defined for MVP
[ ] Admin role behavior is defined
[ ] Staff role behavior is defined
[ ] last-admin protection is defined
[ ] module enablement vs permission distinction is defined
[ ] SDK permission shape uses PlatformContext
[ ] forbidden patterns are explicit
[ ] test matrix is complete
```

Implementation is complete only when:

```txt
[ ] registration creates Admin role
[ ] registration creates Staff role
[ ] registration creates Admin wildcard permission
[ ] first user receives Admin role
[ ] can() supports exact and wildcard matching
[ ] can() denies non-null conditions in MVP
[ ] role assignment validates same org
[ ] permission writes validate same org
[ ] last-admin protection tests pass
[ ] cross-tenant role/permission tests pass
[ ] no role/permission API accepts orgId from client payload
[ ] no modules import access-control internals directly
[ ] npm run lint passes
[ ] npm run typecheck passes
[ ] npm run test:run passes
[ ] npm run build passes
```

---

# 36. Architectural Risks

## 36.1 Overbuilding Enterprise RBAC Too Early

Risk:

```txt
Building groups, policies, denies, inheritance, ABAC, field permissions, and custom scopes before real clients need them.
```

Decision:

```txt
Use simple org-scoped RBAC for MVP.
Keep conditions field as future extension only.
```

---

## 36.2 Under-Enforcing Permissions

Risk:

```txt
The permission system exists but APIs/services do not call it.
```

This was a previous MVP risk.

Decision:

```txt
This document defines the model.
The next Authorization Enforcement document must make permission checks mandatory in APIs and services.
```

---

## 36.3 Wildcards Becoming Platform Super-Admin

Risk:

```txt
*.*.* accidentally grants access across tenants.
```

Decision:

```txt
Wildcard permissions are always scoped to ctx.org.id.
Internal OneDayOS support access is a separate future design.
```

---

## 36.4 Nullable Resource Uniqueness Bug

Risk:

```txt
Nullable resource allows duplicate permissions under PostgreSQL uniqueness semantics.
```

Decision:

```txt
Permission.resource is required and uses '*' for all resources.
```

---

## 36.5 Role Assignment IDOR

Risk:

```txt
An attacker guesses roleId or userId from another org.
```

Decision:

```txt
Every user/role operation verifies orgId against PlatformContext.
Cross-org targets return 404 or 403 based on API contract.
```

---

# 37. ADR Triggers

An ADR is required before implementing any of the following:

- multi-organization users
- direct user permissions
- deny permissions
- role inheritance
- groups or teams as permission principals
- branch-scoped permissions
- department-scoped permissions
- field-level permissions
- ABAC condition evaluator
- internal OneDayOS support impersonation
- platform super-admin role
- external SSO
- custom client permission engines

---

# 38. Relationship To Upcoming Documents

This document defines the RBAC data model and semantics.

The next document, `04-kernel/04-authorization-enforcement.md`, must define:

- where permission checks happen
- API helper shape
- service helper shape
- UI permission visibility
- required generated-code patterns
- standard 401/403 behavior
- enforcement tests

Do not ask Claude to implement this document alone without the enforcement document unless the task is strictly schema/seeding/testing.

The model and the enforcement rules are two halves of one security system.

---

# 39. Final Doctrine

OneDayOS permissions are not decoration.

They are not just sidebar visibility.

They are not just UI hints.

They are part of the tenant safety boundary.

The correct mental model is:

```txt
Auth proves who the user is.
Tenancy proves which organization they belong to.
Roles describe what authority they have.
Permissions decide what they may do.
PlatformContext carries the verified truth.
Services and APIs enforce it.
```

If a permission exists in the database but no server code enforces it, the permission system does not exist.

For the restarted OneDayOS build, Users, Roles, and Permissions must be built as production safety infrastructure from day one.
