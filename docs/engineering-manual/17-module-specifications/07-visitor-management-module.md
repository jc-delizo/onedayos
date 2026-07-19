# OneDayOS Engineering Manual — Visitor Management Module Specification

**Document ID:** `17-module-specifications/07-visitor-management-module.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Visitor Management Module Implementation  
**Owner:** Founder / Architecture  
**Last Updated:** July 2026  
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
- `05-sdk/*`
- `06-data/*`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/01-employee.md`
- `08-module-system/*`
- `09-cli-generators/*`
- `13-security/*`
- `14-testing-quality/*`
- `17-module-specifications/00-module-spec-template.md`

---

# 1. Purpose

The **Visitor Management Module** allows an organization to record, monitor, and manage people visiting its offices, branches, warehouses, facilities, or work sites.

It supports common SME workflows such as:

```txt
visitor arrives
→ staff/security records visitor
→ visitor is assigned a host employee
→ visitor is checked in
→ visit remains visible while active
→ visitor is checked out
→ visit history is retained for operations and security reference
```

The module is meant for practical internal operations, not high-compliance physical security infrastructure.

It should be simple enough for:

```txt
front desk staff
security guard
office admin
branch admin
operations manager
```

to use without training complexity.

---

# 2. Core Positioning

Visitor Management is a **Business Module**.

It is not Kernel.

It is not a Business Object layer.

It is not a Platform Service.

It consumes:

```txt
Kernel auth
Kernel tenancy
Kernel users/roles/permissions
Kernel Branch / Department org structure
Business Object Employee
SDK auth/context/db/events/permissions
```

It owns:

```txt
Visitor identity inside this module
Visit records
Visit status lifecycle
Visitor check-in/check-out behavior
Visitor-specific settings
Visitor-specific reports/views later
```

Core rule:

```txt
Employee = shared Business Object used as host.
Visitor = module-owned external-person identity for visitor workflows.
Visit = module-owned attendance/event record.
```

---

# 3. Non-Goals

The Visitor Management Module must not become a generic security, CRM, HR, access-control, identity-verification, or compliance platform.

The first implementation must not include:

```txt
facial recognition
ID scanning
passport/driver license OCR
visitor photo capture
signature capture
QR code self-check-in
public kiosk mode
badge printing
turnstile integration
CCTV integration
door access control
real-time host notifications
SMS/email notifications
file attachments
NDA/document signing
health declarations
temperature checks
blacklist/watchlist engine
multi-stage visitor approval workflow
contractor compliance workflow
event attendee management
customer portal
visitor mobile app
AI receptionist
AI risk scoring
advanced analytics
```

These may become future features only after separate review.

The module must not implement these deferred Platform Services internally:

```txt
Notification Service
Attachment Service
Comments Service
Activity Feed Service
Approval Workflow Service
Reporting Service
Search Service
Background Jobs
AI Support Agent
```

The module may emit events that these future services can consume later.

---

# 4. Module Identity

```ts
const moduleId = 'visitors'
const moduleLabel = 'Visitor Management'
const moduleLifecycle = 'draft'
const initialVersion = '0.1.0'
```

Use the module ID `visitors` instead of `visitor-management` for shorter URLs and consistency with earlier platform constants.

Routes:

```txt
/[orgSlug]/visitors
/api/orgs/[orgSlug]/visitors/...
```

Do not use:

```txt
/api/visitor-management
/api/visitors?orgId=...
/[orgSlug]/visitor-management-custom
/client-a-visitors
```

---

# 5. Business Objects and Kernel Objects Used

## 5.1 Employee

Visitor Management uses `Employee` as the host or person being visited.

Examples:

```txt
visitor.hostEmployeeId → Employee.id
```

Rules:

```txt
Visitor Management does not own Employee.
Visitor Management must not create VisitEmployee, HostEmployee, or SecurityEmployee identity tables.
Visitor Management must not add visitor-specific fields to core Employee.
```

If host-related visitor behavior is needed later, use a module-owned extension table or module-owned visit fields.

---

## 5.2 Branch

Visitor Management may use Kernel `Branch` as the visit location.

Examples:

```txt
Head Office
Cebu Branch
Warehouse Site
Plant 1
```

Rules:

```txt
Branch remains a Kernel org-structure primitive.
Visitor Management does not own Branch.
A visit may optionally reference branchId.
```

---

## 5.3 Department

Visitor Management may use Kernel `Department` for host department or visit destination.

Rules:

```txt
Department remains a Kernel org-structure primitive.
Visitor Management does not own Department.
A visit may optionally reference departmentId.
```

---

## 5.4 Customer and Supplier

Do not link Visitor to Customer or Supplier in MVP by default.

Reason:

A visitor can be:

```txt
customer representative
supplier representative
job applicant
repair technician
government visitor
delivery rider
family member
consultant
walk-in guest
```

For MVP, use simple text fields:

```txt
visitor.companyName
visit.purpose
```

Future optional links may be added later:

```txt
visitor.customerId
visitor.supplierId
```

But only if real use cases prove the need.

Do not create Customer or Supplier records automatically from visitor input.

---

# 6. Module-Owned Entities

Visitor Management owns two primary entities:

```txt
Visitor
Visit
```

A `Visitor` represents an external person known to the visitor module.

A `Visit` represents a specific visit occurrence.

One visitor can have many visits.

---

# 7. Entity: Visitor

## 7.1 Purpose

`Visitor` stores minimal reusable information about an external person who visits the organization.

It exists so repeated visitors do not need to be typed from scratch every time.

It is **not** a platform-wide Business Object yet.

It is module-owned because, for now, only Visitor Management uses it.

If three independent modules later need a generalized external-person object, we may review whether to promote or redesign it.

---

## 7.2 Suggested Prisma Shape

```prisma
model Visitor {
  id          String    @id @default(cuid())
  orgId       String

  fullName    String
  email       String?
  phone       String?
  companyName String?
  notes       String?

  isActive    Boolean   @default(true)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org          Organization @relation(fields: [orgId], references: [id])
  visits       Visit[]

  @@index([orgId])
  @@index([orgId, fullName])
  @@index([orgId, phone])
  @@map("visitors")
}
```

Important:

```txt
Do not add government ID number in MVP.
Do not add ID photo in MVP.
Do not add visitor photo in MVP.
Do not add facial biometrics in MVP.
Do not add Customer/Supplier relation in MVP.
Do not make email required.
Do not make phone required.
```

Reason:

Visitor data is personal information. The MVP should minimize what it stores.

---

## 7.3 Visitor Active vs Deleted

`isActive` means the visitor should normally be selectable for new visits.

`deletedAt` means the visitor record is soft-deleted because it was erroneous, duplicate, or intentionally removed.

Rules:

```txt
Inactive visitor may still appear in historical visits.
Deleted visitor should not appear in normal lists.
Deleted visitor should not be selectable for new visits.
Hard delete is forbidden in normal operations.
```

---

# 8. Entity: Visit

## 8.1 Purpose

`Visit` records a specific visit occurrence.

Examples:

```txt
Juan dela Cruz visits Ana Santos at Head Office on July 6, 2026.
ABC Repair technician checks in at Warehouse 2.
Supplier representative visits Purchasing Department.
```

---

## 8.2 Suggested Prisma Shape

```prisma
model Visit {
  id             String    @id @default(cuid())
  orgId          String

  visitorId      String
  hostEmployeeId String?
  branchId       String?
  departmentId   String?

  purpose        String
  status         String    @default("scheduled")
  // scheduled | checked_in | checked_out | cancelled | no_show

  scheduledAt    DateTime?
  checkedInAt    DateTime?
  checkedOutAt   DateTime?

  badgeNumber    String?
  remarks        String?

  createdBy      String
  checkedInBy    String?
  checkedOutBy   String?
  cancelledBy    String?
  cancelledAt    DateTime?
  cancelReason   String?

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?
  deletedBy      String?

  org            Organization @relation(fields: [orgId], references: [id])
  visitor        Visitor      @relation(fields: [visitorId], references: [id])
  hostEmployee   Employee?    @relation(fields: [hostEmployeeId], references: [id])
  branch         Branch?      @relation(fields: [branchId], references: [id])
  department     Department?  @relation(fields: [departmentId], references: [id])

  @@index([orgId])
  @@index([orgId, status])
  @@index([orgId, scheduledAt])
  @@index([orgId, checkedInAt])
  @@index([orgId, visitorId])
  @@index([orgId, hostEmployeeId])
  @@map("visits")
}
```

---

## 8.3 Visit Status Lifecycle

Recommended MVP lifecycle:

```txt
scheduled
  → checked_in
  → checked_out

scheduled
  → cancelled

scheduled
  → no_show
```

For walk-ins, the module may create a visit and immediately check it in:

```txt
created as checked_in
checkedInAt = now
```

Rules:

```txt
checked_out visits are final in MVP.
cancelled visits are final in MVP.
no_show visits are final in MVP.
checked_in visits cannot be deleted casually.
completed visit records should be retained unless retention policy says otherwise.
```

---

## 8.4 Cancellation vs Soft Delete

Cancellation is business state.

Soft delete is record lifecycle.

Use cancellation when:

```txt
visitor appointment was cancelled
visitor did not proceed
visit should remain part of business history
```

Use soft delete only when:

```txt
record was created by mistake
record is duplicate
record should be hidden from normal operations
```

Hard delete is forbidden in normal module operations.

---

# 9. Module-Owned Settings

Suggested MVP settings:

```ts
type VisitorSettings = {
  allowWalkIns: boolean
  requireHostEmployee: boolean
  requireBranch: boolean
  requirePurpose: boolean
  defaultVisitDurationMinutes?: number
  visitorRetentionDays?: number
}
```

Default values:

```ts
{
  allowWalkIns: true,
  requireHostEmployee: false,
  requireBranch: false,
  requirePurpose: true,
  defaultVisitDurationMinutes: 120,
  visitorRetentionDays: 365,
}
```

Important:

`visitorRetentionDays` is configuration only in MVP.

Automatic deletion or archival requires future Background Jobs and a separate retention implementation.

Do not implement auto-purge in the first version.

---

# 10. Permissions

Visitor Management permissions use the `visitors` namespace.

Do not use wildcard permissions in the module manifest.

Admin roles may receive wildcard grants at the role level, but the module manifest declares explicit permissions only.

---

## 10.1 Visitor Permissions

```ts
const visitorPermissions = [
  {
    module: 'visitors',
    resource: 'visitor',
    action: 'read',
    description: 'View visitor directory records.',
  },
  {
    module: 'visitors',
    resource: 'visitor',
    action: 'create',
    description: 'Create visitor directory records.',
  },
  {
    module: 'visitors',
    resource: 'visitor',
    action: 'update',
    description: 'Update visitor directory records.',
  },
  {
    module: 'visitors',
    resource: 'visitor',
    action: 'delete',
    description: 'Soft-delete visitor directory records.',
  },
  {
    module: 'visitors',
    resource: 'visitor',
    action: 'export',
    description: 'Export visitor directory records.',
  },
]
```

---

## 10.2 Visit Permissions

```ts
const visitPermissions = [
  {
    module: 'visitors',
    resource: 'visit',
    action: 'read',
    description: 'View visit records.',
  },
  {
    module: 'visitors',
    resource: 'visit',
    action: 'create',
    description: 'Create scheduled or walk-in visits.',
  },
  {
    module: 'visitors',
    resource: 'visit',
    action: 'update',
    description: 'Update editable visit details before completion.',
  },
  {
    module: 'visitors',
    resource: 'visit',
    action: 'delete',
    description: 'Soft-delete erroneous visit records.',
  },
  {
    module: 'visitors',
    resource: 'visit',
    action: 'check_in',
    description: 'Check visitors in.',
  },
  {
    module: 'visitors',
    resource: 'visit',
    action: 'check_out',
    description: 'Check visitors out.',
  },
  {
    module: 'visitors',
    resource: 'visit',
    action: 'cancel',
    description: 'Cancel scheduled visits.',
  },
  {
    module: 'visitors',
    resource: 'visit',
    action: 'export',
    description: 'Export visit records.',
  },
]
```

---

## 10.3 Settings Permissions

```ts
const settingsPermissions = [
  {
    module: 'visitors',
    resource: 'settings',
    action: 'manage',
    description: 'Manage Visitor Management settings.',
  },
]
```

---

## 10.4 Permission Rules

Rules:

```txt
Read is not export.
Create is not check_in.
Check_in is not check_out.
Cancel is not delete.
Manage settings is separate from all operational permissions.
```

UI visibility is not security.

APIs and services must enforce permissions.

---

# 11. Routes

## 11.1 Page Routes

Recommended MVP page routes:

```txt
/[orgSlug]/visitors
/[orgSlug]/visitors/new
/[orgSlug]/visitors/visits
/[orgSlug]/visitors/visits/[visitId]
/[orgSlug]/visitors/directory
/[orgSlug]/visitors/directory/[visitorId]
/[orgSlug]/visitors/settings
```

Minimum first screen:

```txt
/[orgSlug]/visitors
```

This should show today’s active and scheduled visits.

---

## 11.2 API Routes

Recommended API routes:

```txt
GET    /api/orgs/[orgSlug]/visitors/visitors
POST   /api/orgs/[orgSlug]/visitors/visitors
GET    /api/orgs/[orgSlug]/visitors/visitors/[visitorId]
PATCH  /api/orgs/[orgSlug]/visitors/visitors/[visitorId]
DELETE /api/orgs/[orgSlug]/visitors/visitors/[visitorId]

GET    /api/orgs/[orgSlug]/visitors/visits
POST   /api/orgs/[orgSlug]/visitors/visits
GET    /api/orgs/[orgSlug]/visitors/visits/[visitId]
PATCH  /api/orgs/[orgSlug]/visitors/visits/[visitId]
DELETE /api/orgs/[orgSlug]/visitors/visits/[visitId]

POST   /api/orgs/[orgSlug]/visitors/visits/[visitId]/check-in
POST   /api/orgs/[orgSlug]/visitors/visits/[visitId]/check-out
POST   /api/orgs/[orgSlug]/visitors/visits/[visitId]/cancel

GET    /api/orgs/[orgSlug]/visitors/settings
PATCH  /api/orgs/[orgSlug]/visitors/settings
```

Do not use:

```txt
/api/visitors?orgId=...
/api/visitor-management
/api/[module]
```

---

# 12. API Rules

Every API must:

```txt
return JSON only
return { data, error, meta? }
never redirect
never return HTML
validate route params
validate query params
validate request body
reject client-supplied orgId
create verified PlatformContext
verify module is enabled
verify permissions
call services with PlatformContext
map errors through Kernel API contract
```

API route pattern:

```ts
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  return sdk.api.handle(req, async () => {
    const { orgSlug } = await params

    const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'visitors')

    const input = await sdk.api.parseJson(req, CreateVisitSchema)

    const data = await VisitService.create(ctx, input)

    return sdk.api.created(data)
  })
}
```

---

# 13. Validation Schemas

Use Zod schemas with `z.strictObject()` by default.

## 13.1 Create Visitor Schema

```ts
export const CreateVisitorSchema = z.strictObject({
  fullName: z.string().min(1).max(200),
  email: z.email().optional().nullable(),
  phone: z.string().min(3).max(50).optional().nullable(),
  companyName: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})
```

Must reject:

```txt
orgId
createdBy
deletedAt
deletedBy
isAdmin
```

---

## 13.2 Create Visit Schema

```ts
export const CreateVisitSchema = z.strictObject({
  visitorId: z.string().min(1).optional(),
  visitor: CreateVisitorSchema.optional(),

  hostEmployeeId: z.string().min(1).optional().nullable(),
  branchId: z.string().min(1).optional().nullable(),
  departmentId: z.string().min(1).optional().nullable(),

  purpose: z.string().min(1).max(500),
  scheduledAt: z.iso.datetime().optional().nullable(),
  badgeNumber: z.string().max(100).optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
})
```

Rule:

A create visit request must provide either:

```txt
visitorId
```

or:

```txt
visitor object
```

but not both unless the service explicitly supports merging/updating visitor data.

For MVP, prefer rejecting both-present input.

---

## 13.3 Check-In Schema

```ts
export const CheckInVisitSchema = z.strictObject({
  badgeNumber: z.string().max(100).optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
})
```

---

## 13.4 Check-Out Schema

```ts
export const CheckOutVisitSchema = z.strictObject({
  remarks: z.string().max(1000).optional().nullable(),
})
```

---

## 13.5 Cancel Visit Schema

```ts
export const CancelVisitSchema = z.strictObject({
  reason: z.string().min(1).max(500),
})
```

---

# 14. Services

Services are the authority for business behavior.

APIs validate transport.

Services enforce business rules.

Services receive verified `PlatformContext`.

Services must never accept loose `orgId`.

---

## 14.1 VisitorService

Suggested service methods:

```ts
export const VisitorService = {
  list(ctx, query),
  getById(ctx, visitorId),
  create(ctx, input),
  update(ctx, visitorId, input),
  deactivate(ctx, visitorId),
  reactivate(ctx, visitorId),
  softDelete(ctx, visitorId),
  restore(ctx, visitorId),
}
```

Each public method must:

```txt
require appropriate permission
use sdk.getDb(ctx)
scope queries by ctx.org.id
exclude deleted records by default
reject cross-tenant references
emit events for mutations
return safe DTOs
```

---

## 14.2 VisitService

Suggested service methods:

```ts
export const VisitService = {
  list(ctx, query),
  listToday(ctx, query),
  listActive(ctx, query),
  getById(ctx, visitId),
  create(ctx, input),
  update(ctx, visitId, input),
  checkIn(ctx, visitId, input),
  checkOut(ctx, visitId, input),
  cancel(ctx, visitId, input),
  markNoShow(ctx, visitId),
  softDelete(ctx, visitId),
  restore(ctx, visitId),
}
```

---

## 14.3 Visit Creation Rules

When creating a visit:

```txt
validate visitor exists in ctx.org if visitorId is provided
create visitor first if inline visitor input is provided
validate hostEmployee belongs to ctx.org if hostEmployeeId is provided
validate branch belongs to ctx.org if branchId is provided
validate department belongs to ctx.org if departmentId is provided
apply module settings
create visit with ctx.user.id as createdBy
emit visitors.visit.created
```

If creating a visitor and visit together, use a transaction.

---

## 14.4 Check-In Rules

Checking in should:

```txt
require visitors.visit.check_in
verify visit belongs to ctx.org
verify visit is scheduled or created for walk-in
set status = checked_in
set checkedInAt = now
set checkedInBy = ctx.user.id
optionally set badgeNumber
emit visitors.visit.checked_in
```

Do not allow check-in when status is:

```txt
checked_in
checked_out
cancelled
no_show
```

---

## 14.5 Check-Out Rules

Checking out should:

```txt
require visitors.visit.check_out
verify visit belongs to ctx.org
verify status = checked_in
set status = checked_out
set checkedOutAt = now
set checkedOutBy = ctx.user.id
emit visitors.visit.checked_out
```

Do not allow check-out when status is:

```txt
scheduled
checked_out
cancelled
no_show
```

---

## 14.6 Cancel Rules

Cancelling should:

```txt
require visitors.visit.cancel
verify visit belongs to ctx.org
require reason
set status = cancelled
set cancelledAt = now
set cancelledBy = ctx.user.id
set cancelReason
emit visitors.visit.cancelled
```

For MVP, do not allow cancellation after check-out.

---

# 15. Events

Visitor Management events use the `visitors` namespace.

Events are facts, not commands.

Events must be emitted through `@/sdk/server` using verified `PlatformContext`.

Payloads must not include:

```txt
orgId
full visitor record
full visit record
sensitive notes
government ID values
raw request body
```

---

## 15.1 Visitor Events

```txt
visitors.visitor.created
visitors.visitor.updated
visitors.visitor.deactivated
visitors.visitor.reactivated
visitors.visitor.deleted
visitors.visitor.restored
```

Suggested payload:

```ts
type VisitorEventPayload = {
  visitorId: string
  changedFields?: string[]
}
```

---

## 15.2 Visit Events

```txt
visitors.visit.created
visitors.visit.updated
visitors.visit.checked_in
visitors.visit.checked_out
visitors.visit.cancelled
visitors.visit.no_show_marked
visitors.visit.deleted
visitors.visit.restored
```

Suggested payload:

```ts
type VisitEventPayload = {
  visitId: string
  visitorId: string
  hostEmployeeId?: string | null
  branchId?: string | null
  status?: string
  changedFields?: string[]
}
```

Do not emit:

```txt
notify.host
send.email
visitor.alert
```

Those are commands or notification concerns, not business facts.

A future Notification Service may subscribe to:

```txt
visitors.visit.checked_in
```

and notify the host employee later.

Do not implement that now.

---

# 16. Navigation

Recommended manifest navigation:

```ts
navItems: [
  {
    label: 'Visitors',
    href: '/visitors',
    icon: 'UserRoundCheck',
    requiredPermission: {
      module: 'visitors',
      resource: 'visit',
      action: 'read',
    },
  },
]
```

Optional later navigation:

```txt
Today
Directory
Settings
```

Do not create sidebar entries for disabled or unauthorized users.

Sidebar visibility is not security.

Routes, APIs, and services still enforce authorization.

---

# 17. UI Screens

## 17.1 Visitor Dashboard / Today Screen

Route:

```txt
/[orgSlug]/visitors
```

Purpose:

Show operational visitor status for today.

Should include:

```txt
scheduled today
currently checked in
recently checked out
quick check-in button
quick check-out action
visitor name
company name
host employee
branch/location
status badge
scheduled time
checked-in time
```

Must include empty states:

```txt
No visitors scheduled today.
No active visitors currently checked in.
```

---

## 17.2 New Visit Screen

Route:

```txt
/[orgSlug]/visitors/new
```

Purpose:

Create a scheduled or walk-in visit.

Fields:

```txt
visitor existing/new selector
visitor full name
visitor phone/email optional
company name optional
host employee optional/required depending on settings
branch optional/required depending on settings
purpose
scheduled time optional
badge number optional
remarks optional
```

The form must not include:

```txt
hidden orgId
hidden userId
hidden role
hidden permission
```

---

## 17.3 Visit Detail Screen

Route:

```txt
/[orgSlug]/visitors/visits/[visitId]
```

Purpose:

Show visit details and allowed actions.

Actions:

```txt
check in
check out
cancel
edit draft/scheduled details
soft delete erroneous record
```

Actions must be permission-aware.

---

## 17.4 Visitor Directory Screen

Route:

```txt
/[orgSlug]/visitors/directory
```

Purpose:

Show reusable visitor records.

MVP may defer directory if the first implementation is visit-first.

If included, it should support:

```txt
search by name/company/phone
active/inactive filter
last visit date
create visitor
edit visitor
soft delete visitor
```

---

## 17.5 Settings Screen

Route:

```txt
/[orgSlug]/visitors/settings
```

Purpose:

Manage module settings.

Requires:

```txt
visitors.settings.manage
```

Settings UI may be deferred if the first version hardcodes safe defaults.

---

# 18. Tables

Visitor Management tables should follow the OneDayOS table standards.

## 18.1 Today’s Visits Table

Recommended columns:

```txt
Status
Visitor
Company
Host
Location
Scheduled
Checked In
Checked Out
Actions
```

## 18.2 Visitor Directory Table

Recommended columns:

```txt
Visitor
Company
Phone
Email
Last Visit
Status
Actions
```

## 18.3 Table Rules

Tables must:

```txt
exclude soft-deleted records by default
show skeleton loading states
show meaningful empty states
use status badges
use permission-aware row actions
avoid leaking unauthorized actions
support responsive density
avoid raw JSON dumps
```

---

# 19. Forms

Forms must follow the OneDayOS form standards.

Rules:

```txt
client validation is UX
server validation is security
server schemas use z.strictObject()
orgId never appears in forms
relation IDs are revalidated server-side
host employee options are tenant-scoped
branch options are tenant-scoped
submit only business input
```

Forms should include tooltips for:

```txt
host employee
badge number
purpose
visitor retention setting
```

---

# 20. Data Privacy and Retention

Visitor data is personal information.

The module should store the minimum useful data.

MVP should avoid highly sensitive fields.

Do not store by default:

```txt
government ID numbers
ID photos
visitor photos
biometric data
health data
signature images
vehicle plate number unless specifically scoped
```

If a client requests these, classify the request as higher-risk custom scope and require founder/architect review.

Retention:

```txt
visitorRetentionDays may be configured
but automatic purge is deferred until Background Jobs exist
```

For MVP, retention cleanup may be a controlled founder/developer-run script if necessary.

---

# 21. Search, Reporting, Export

## 21.1 Search

Module-local filtering/search is allowed:

```txt
search visits by visitor name, company, host, status, date
search visitor directory by name, company, phone
```

Do not implement global Search Service.

---

## 21.2 Reporting

Simple module-local summaries are allowed later:

```txt
visits today
active visitors
visits this week
visits by branch
visits by purpose
```

Do not implement Reporting Service.

---

## 21.3 Export

Export is not part of MVP unless explicitly approved.

If export is implemented:

```txt
requires visitors.visit.export or visitors.visitor.export
must exclude sensitive fields by default
must respect tenant isolation
must respect soft delete
must log/emit export-relevant event if future audit requires it
```

Read permission is not export permission.

---

# 22. Module Manifest Requirements

The Visitor Management manifest must declare:

```txt
module ID
label
version
lifecycle
compatibility window
Business Objects used
Kernel objects used
module-owned entities
permissions
navigation
page routes
API routes
events emitted
events listened to
settings keys
AI context
```

The manifest must be pure metadata.

It must not:

```txt
self-register via side effects
import @/kernel/*
import @/sdk/server
import Prisma
import other modules
contain secrets
contain tenant data
contain client-specific logic
```

---

# 23. AI Context

Visitor Management AI Context should be static and tenant-neutral.

It may explain:

```txt
what a visitor is
what a visit is
how check-in/check-out works
what statuses mean
what permissions exist
common workflows
```

It must not include:

```txt
real visitor names
real client data
orgId
secrets
business records
```

Runtime AI features are deferred.

AI must not:

```txt
query visitor data directly
export visitor logs
check visitors in/out
cancel visits
mutate records
bypass permissions
```

Future AI help may explain how to use the Visitor Management module, but not act on data without a separate approved AI action system.

---

# 24. Tests

Visitor Management must include tests before being considered implementation-ready.

## 24.1 Required Test Categories

```txt
schema tests
service tests
API tests
integration tests
permission tests
tenant isolation tests
soft-delete tests
status-transition tests
event emission tests
UI tests
architecture checks
```

---

## 24.2 Tenant Isolation Tests

Must use at least two organizations:

```txt
Alpha Org
Beta Org
```

Required cases:

```txt
Alpha user cannot list Beta visits
Alpha user cannot read Beta visit by ID
Alpha user cannot check in Beta visit
Alpha user cannot check out Beta visit
Alpha user cannot cancel Beta visit
Alpha user cannot update Beta visitor
Alpha user cannot soft-delete Beta visitor
client-supplied orgId is rejected
```

---

## 24.3 Permission Tests

Required cases:

```txt
user with visitors.visit.read can list visits
user without visitors.visit.read gets 403
user with visitors.visit.create can create visit
user without visitors.visit.create gets 403
user with visitors.visit.check_in can check in
user without visitors.visit.check_in gets 403
user with visitors.visit.check_out can check out
user without visitors.visit.check_out gets 403
user with visitors.visit.cancel can cancel
user without visitors.visit.cancel gets 403
read permission does not allow export
create permission does not allow check-in unless explicitly granted
```

Admin wildcard may be tested, but admin-only tests are insufficient.

---

## 24.4 API Tests

Every protected API must test:

```txt
401 unauthenticated JSON response
403 missing permission JSON response
safe 404 wrong-org response
404 module disabled response
400 validation error response
400 client-supplied orgId rejection
success response
no redirect
no HTML
stable { data, error, meta? } shape
```

---

## 24.5 Status Transition Tests

Required cases:

```txt
scheduled → checked_in allowed
checked_in → checked_out allowed
scheduled → cancelled allowed
scheduled → no_show allowed if implemented
checked_out → checked_in rejected
cancelled → checked_in rejected
checked_out → cancelled rejected in MVP
cancelled → checked_out rejected
```

---

## 24.6 Event Tests

Required cases:

```txt
visitor creation emits visitors.visitor.created
visit creation emits visitors.visit.created
check-in emits visitors.visit.checked_in
check-out emits visitors.visit.checked_out
cancel emits visitors.visit.cancelled
failed mutation emits no success event
event payload does not include orgId
event payload does not include full visitor or visit record
event payload does not include notes by default
```

---

## 24.7 Soft Delete Tests

Required cases:

```txt
soft-deleted visitors are excluded from normal directory
soft-deleted visits are excluded from normal lists
historical visits still work when visitor is inactive
completed visits are cancelled/closed/checked-out, not hard-deleted
hard delete is not used in normal service methods
```

---

## 24.8 UI Tests

Required cases:

```txt
today screen renders active visits
empty state renders when no visits exist
check-in button hidden for user without permission
check-out button hidden for user without permission
form does not render or submit orgId
status badge displays correctly
cancel action requires reason
```

UI tests do not replace service/API permission tests.

---

# 25. Architecture Checks

The module must pass architecture checks that block:

```txt
import from @/kernel/* inside src/modules/visitors
import from another module
raw Prisma import inside module code
sdk.getDb(orgId)
client-supplied orgId
/api/visitors route shape
/api/[module] route shape
hidden orgId form fields
full-record event payloads
Business Object duplication
FastAPI/Python backend files
```

Forbidden duplicate entities:

```txt
VisitorEmployee
HostEmployee
SecurityEmployee
VisitorCustomer
VisitorSupplier
BranchVisitor
```

---

# 26. Implementation Plan

## Step 1 — Write / approve module spec

This document must be approved before implementation.

## Step 2 — Generate module scaffold

Use the Module Generator after it has been updated to the restarted architecture.

```bash
npm run module:create visitors
```

The generator must produce safe defaults.

If the generator still emits old patterns like `/api/[module]` or `sdk.getDb(orgId)`, do not use it.

## Step 3 — Add Prisma models

Add:

```txt
Visitor
Visit
```

Use tenant-scoped indexes and soft-delete fields.

## Step 4 — Implement schemas

Add Zod schemas for:

```txt
CreateVisitor
UpdateVisitor
CreateVisit
UpdateVisit
CheckInVisit
CheckOutVisit
CancelVisit
VisitorSettings
```

Schemas must reject `orgId`.

## Step 5 — Implement services

Implement:

```txt
VisitorService
VisitService
VisitorSettingsService
```

Services receive `PlatformContext`.

Services enforce permissions during MVP.

## Step 6 — Implement APIs

Use tenant-scoped route shape:

```txt
/api/orgs/[orgSlug]/visitors/...
```

No redirects.

No client-supplied orgId.

## Step 7 — Implement UI

Start with:

```txt
Today / active visits screen
New visit form
Visit detail screen
```

Directory and settings can be second pass if needed.

## Step 8 — Implement events

Emit visitor and visit events through SDK.

## Step 9 — Implement tests

Add all required test categories.

## Step 10 — Run quality gates

Required commands:

```bash
npm run check:architecture
npm run lint
npm run typecheck
npm run test:run
npm run build
```

---

# 27. MVP Acceptance Criteria

Visitor Management MVP is complete only when:

```txt
[ ] module spec approved
[ ] module manifest valid
[ ] module uses SDK only
[ ] module uses PlatformContext
[ ] module uses sdk.getDb(ctx)
[ ] no client-supplied orgId accepted
[ ] Visitor model implemented
[ ] Visit model implemented
[ ] soft delete implemented
[ ] check-in/check-out lifecycle implemented
[ ] cancellation implemented
[ ] permissions declared
[ ] permissions enforced in APIs and services
[ ] tenant isolation tests pass with two organizations
[ ] permission-denial tests pass with non-admin users
[ ] API failure-path tests pass
[ ] event emission tests pass
[ ] event payload safety tests pass
[ ] UI basic flow works
[ ] forms do not include orgId
[ ] module disabled returns safe 404
[ ] architecture checks pass
[ ] typecheck passes
[ ] tests pass
[ ] build passes
```

---

# 28. Claude Implementation Prompt

Use this prompt when asking Claude to implement Visitor Management:

```md
You are implementing the OneDayOS Visitor Management Module.

Authoritative documents:
- docs/engineering-manual/17-module-specifications/07-visitor-management-module.md
- docs/engineering-manual/17-module-specifications/00-module-spec-template.md
- docs/engineering-manual/08-module-system/*
- docs/engineering-manual/05-sdk/*
- docs/engineering-manual/06-data/*
- docs/engineering-manual/13-security/*
- docs/engineering-manual/14-testing-quality/*

Rules:
- Do not invent architecture.
- Do not import from @/kernel/* inside the module.
- Do not import raw Prisma inside the module.
- Do not import another module.
- Do not accept client-supplied orgId.
- Use verified PlatformContext.
- Use sdk.getDb(ctx), not sdk.getDb(orgId).
- APIs must live under /api/orgs/[orgSlug]/visitors/...
- Pages must live under /[orgSlug]/visitors/...
- APIs must return JSON only.
- APIs must never redirect.
- Services must enforce permissions during MVP.
- Visitor Management does not own Employee, Branch, Department, Customer, Supplier, or Warehouse.
- Do not implement Notifications, Attachments, Activity Feed, Approval Workflow, Reporting, Search, Background Jobs, or AI.
- Do not implement kiosk mode, QR codes, badge printing, ID scanning, visitor photos, or file uploads.
- Add tenant-isolation and permission-denial tests.
- Stop and report if required foundation helpers are missing.

Task:
Implement only the Visitor Management MVP described in this document.
```

---

# 29. Founder Review Checklist

Before approving implementation, confirm:

```txt
[ ] Visitor Management should be a module, not a Platform Service
[ ] Visitor is module-owned for MVP
[ ] Employee remains shared Business Object
[ ] Branch/Department remain Kernel org-structure
[ ] Customer/Supplier links are deferred
[ ] no ID scanning / photo / file upload in MVP
[ ] no Notification Service in MVP
[ ] no Attachment Service in MVP
[ ] check-in/check-out lifecycle is sufficient
[ ] permissions are clear
[ ] tests are sufficient
[ ] scope supports one-day delivery
```

---

# 30. Final Rule

Visitor Management should solve the normal SME visitor-log problem cleanly.

It should not become an enterprise physical-security system.

Build:

```txt
visitor directory
visit records
check-in
check-out
host employee reference
branch/location reference
status lifecycle
events
tests
```

Do not build:

```txt
access control
biometrics
QR kiosk
notifications
attachments
security watchlists
workflow engines
AI receptionist
client-specific forks
```

The module is successful if it proves that OneDayOS can add a practical operational module quickly while preserving:

```txt
tenant isolation
permissions
Business Object boundaries
SDK-only access
event-driven architecture
soft delete
clean UX
one shared platform
```
