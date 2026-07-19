# OneDayOS Engineering Manual — 17 Module Specifications — 02 Leave Module

**Document ID:** `17-module-specifications/02-leave-module.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Leave Module Implementation  
**Owner:** OneDayOS Founder / Platform Architect  
**Last Updated:** July 2026  
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
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/01-employee.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/*`
- `09-cli-generators/*`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`
- `13-security/*`
- `14-testing-quality/*`
- `17-module-specifications/00-module-spec-template.md`

---

# 1. Purpose

The Leave Module allows an organization to manage employee leave requests inside OneDayOS.

It supports the basic workflow:

```txt
Employee requests leave
  ↓
Authorized user reviews request
  ↓
Request is approved, rejected, or cancelled
  ↓
Leave history remains visible and auditable inside the organization
```

The Leave Module exists to prove that OneDayOS can support a workflow-oriented HR module while still preserving the platform rules:

```txt
Employee is a shared Business Object.
Leave is a business module.
Approval Engine is deferred.
Notifications are deferred.
Comments are deferred.
Attachments are deferred.
```

The Leave Module should be useful for Philippine SMEs that need simple leave tracking but do not yet need a full HRIS, payroll system, attendance system, biometrics system, or enterprise workflow engine.

---

# 2. Core Architectural Rule

The Leave Module does **not** own Employee.

```txt
Employee = shared Business Object
Leave = workflow around Employee leave requests
```

Therefore:

```txt
Correct:
LeaveRequest.employeeId → Employee.id
LeaveBalance.employeeId → Employee.id

Wrong:
LeaveEmployee
HREmployee
EmployeeLeaveProfile as duplicate identity
```

The Leave Module may create module-owned records that reference Employee, but it must not duplicate Employee identity.

---

# 3. Module Classification

| Item | Classification |
|---|---|
| Leave Module | Business Module |
| Employee | Business Object |
| User | Kernel identity |
| Organization | Kernel tenant |
| Branch | Kernel org-structure primitive |
| Department | Kernel org-structure primitive |
| Leave Request | Module-owned entity |
| Leave Type | Module-owned entity |
| Leave Balance | Module-owned entity |
| Approval flow | Module-local workflow for MVP |
| Approval Engine | Deferred Platform Service |
| Notifications | Deferred Platform Service |
| Attachments | Deferred Platform Service |
| Comments | Deferred Platform Service |
| Activity Feed | Deferred Platform Service |
| Payroll | Out of scope |
| Attendance | Out of scope |

---

# 4. Non-Goals

The Leave Module must not become a full HR/payroll platform.

The MVP Leave Module must not include:

```txt
Payroll computation
Timekeeping
Biometrics integration
Attendance logs
Shift scheduling
Timesheets
Government compliance automation
SSS / PhilHealth / Pag-IBIG calculations
13th month calculations
Leave monetization
Complex accrual engines
Carry-over automation
Branch-scoped approval rules
Multi-step approval workflow engine
Delegated approvals
Approval escalation
Email/SMS notifications
File attachments
Medical certificate uploads
Calendar integrations
Google Calendar sync
Outlook sync
AI leave assistant
Employee self-service portal outside OneDayOS
Custom per-client workflow builder
```

Some of these may become future modules or Platform Services, but they are not part of the Leave MVP.

---

# 5. Business Objects Used

## 5.1 Employee

Leave requests are made for Employees.

An Employee may or may not have a OneDayOS User login.

```txt
Employee with User:
  can request leave for themselves if permission allows

Employee without User:
  leave may be recorded by admin/HR user on their behalf
```

The Leave Module must respect the existing rule:

```txt
User is not Employee.
Employee is not User.
```

The service layer must use verified `PlatformContext` plus tenant-safe Employee lookup.

## 5.2 User

User represents the authenticated platform account.

Used for:

```txt
submittedByUserId
approvedByUserId
rejectedByUserId
cancelledByUserId
deletedBy
updatedBy future
```

User must not be treated as the leave subject unless linked to an Employee.

## 5.3 Branch and Department

Branch and Department may be displayed for filtering and context.

They are Kernel org-structure primitives, not Leave-owned entities.

The Leave Module may read Employee's branch/department through Employee relationships, but must not create Leave-specific Branch or Department tables.

---

# 6. Module-Owned Entities

The Leave Module owns only leave-specific records.

## 6.1 LeaveType

Represents a category of leave.

Examples:

```txt
Vacation Leave
Sick Leave
Emergency Leave
Unpaid Leave
Maternity Leave
Paternity Leave
Bereavement Leave
```

MVP fields:

```txt
id
orgId
code
name
description
isPaid
requiresBalance
isActive
createdAt
updatedAt
deletedAt
deletedBy
```

Rules:

```txt
code is unique per organization
isActive is business status
soft delete uses deletedAt/deletedBy
inactive leave types cannot be selected for new requests
historical requests still reference inactive leave types
```

## 6.2 LeaveRequest

Represents an employee's leave request.

MVP fields:

```txt
id
orgId
employeeId
leaveTypeId
submittedByUserId
startDate
endDate
durationDays
status
reason
decidedByUserId
decidedAt
decisionNote
cancelledByUserId
cancelledAt
cancelReason
createdAt
updatedAt
deletedAt
deletedBy
```

MVP statuses:

```txt
pending
approved
rejected
cancelled
```

Rules:

```txt
new requests start as pending
approved requests cannot be edited casually
rejected requests remain historical records
cancelled requests remain historical records
soft delete is reserved for erroneous/admin removal, not normal cancellation
```

## 6.3 LeaveBalance

Represents balance for an Employee + LeaveType + year.

MVP fields:

```txt
id
orgId
employeeId
leaveTypeId
year
allocatedDays
usedDays
pendingDays
createdAt
updatedAt
deletedAt
deletedBy
```

Rules:

```txt
unique per orgId + employeeId + leaveTypeId + year
balance tracking may be disabled by module setting
usedDays changes when approved leave is recorded
pendingDays may be updated when pending requests are submitted
balance enforcement is configurable
```

Important: LeaveBalance is module-owned. It does not belong in Employee.

---

# 7. Recommended Prisma Model Shape

This is a reference shape. Claude must adapt it to the final Prisma conventions already frozen in the Data section.

```prisma
model LeaveType {
  id              String    @id @default(cuid())
  orgId           String
  code            String
  name            String
  description     String?
  isPaid          Boolean   @default(true)
  requiresBalance Boolean   @default(true)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  deletedBy       String?

  org      Organization   @relation(fields: [orgId], references: [id])
  requests LeaveRequest[]
  balances LeaveBalance[]

  @@unique([orgId, code])
  @@unique([id, orgId])
  @@index([orgId, isActive])
  @@map("leave_types")
}

model LeaveRequest {
  id                String   @id @default(cuid())
  orgId             String
  employeeId         String
  leaveTypeId        String
  submittedByUserId  String
  startDate          DateTime
  endDate            DateTime
  durationDays       Decimal  @db.Decimal(6, 2)
  status             String   @default("pending")
  reason             String?
  decidedByUserId    String?
  decidedAt          DateTime?
  decisionNote       String?
  cancelledByUserId  String?
  cancelledAt        DateTime?
  cancelReason       String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  deletedAt          DateTime?
  deletedBy          String?

  org       Organization @relation(fields: [orgId], references: [id])
  employee  Employee     @relation(fields: [employeeId, orgId], references: [id, orgId])
  leaveType LeaveType    @relation(fields: [leaveTypeId, orgId], references: [id, orgId])

  @@unique([id, orgId])
  @@index([orgId, employeeId])
  @@index([orgId, leaveTypeId])
  @@index([orgId, status])
  @@index([orgId, startDate, endDate])
  @@map("leave_requests")
}

model LeaveBalance {
  id            String   @id @default(cuid())
  orgId         String
  employeeId    String
  leaveTypeId   String
  year          Int
  allocatedDays Decimal  @default(0) @db.Decimal(6, 2)
  usedDays      Decimal  @default(0) @db.Decimal(6, 2)
  pendingDays   Decimal  @default(0) @db.Decimal(6, 2)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  deletedBy     String?

  org       Organization @relation(fields: [orgId], references: [id])
  employee  Employee     @relation(fields: [employeeId, orgId], references: [id, orgId])
  leaveType LeaveType    @relation(fields: [leaveTypeId, orgId], references: [id, orgId])

  @@unique([orgId, employeeId, leaveTypeId, year])
  @@unique([id, orgId])
  @@index([orgId, year])
  @@map("leave_balances")
}
```

Important: composite references require Business Object models to expose tenant-safe unique constraints such as `@@unique([id, orgId])` where needed.

If Prisma relation constraints become too heavy during the first implementation, Claude may use scalar `employeeId` / `leaveTypeId` plus service-level tenant validation, but only with explicit review. Tenant validation must not be skipped.

---

# 8. MVP Date and Duration Rules

The Leave MVP should use date-based leave, not time-based attendance.

MVP assumptions:

```txt
leave requests are whole-day by default
startDate and endDate are date-only concepts
durationDays is calculated by the service
weekend/holiday exclusion is deferred unless explicitly scoped
half-day leave is deferred unless required by first paid client and approved
```

Why:

```txt
Half-day rules quickly touch attendance, shifts, holidays, payroll, and scheduling.
Those are outside the MVP Leave Module.
```

If half-day leave becomes required, it should be added as a Leave module extension, not as a Platform Service.

Possible future fields:

```txt
startPortion: "full_day" | "morning" | "afternoon"
endPortion: "full_day" | "morning" | "afternoon"
```

But do not implement them unless approved.

---

# 9. Module Settings

The Leave Module may define settings, stored through the standard OneDayOS Settings system.

Recommended MVP settings:

```ts
type LeaveSettings = {
  balanceTrackingEnabled: boolean
  enforceAvailableBalance: boolean
  allowPastDateRequests: boolean
  allowOverlappingRequests: boolean
  defaultLeaveYearStartMonth: number // 1-12
}
```

Default values:

```txt
balanceTrackingEnabled: false
enforceAvailableBalance: false
allowPastDateRequests: false
allowOverlappingRequests: false
defaultLeaveYearStartMonth: 1
```

Rationale:

```txt
Simple SMEs may only need request history.
Balance enforcement can be turned on when the client's process is ready.
```

Settings must be validated with Zod.

Settings must be org-scoped.

Client-supplied `orgId` is forbidden.

---

# 10. Permissions

The Leave Module must use full permission objects.

No wildcard permissions should be declared by the module manifest.

Admin roles may receive wildcard permissions through Kernel role grants, but module manifests must declare explicit permissions only.

## 10.1 Permission Namespace

```txt
module: leave
```

## 10.2 Resources

```txt
own_leave_request
leave_request
leave_type
leave_balance
leave_settings
```

## 10.3 Actions

Use standard actions where possible:

```txt
create
read
update
delete
approve
reject
cancel
restore
export
```

## 10.4 Recommended Permission Objects

```ts
export const LEAVE_PERMISSIONS = [
  { module: 'leave', resource: 'own_leave_request', action: 'create' },
  { module: 'leave', resource: 'own_leave_request', action: 'read' },
  { module: 'leave', resource: 'own_leave_request', action: 'cancel' },

  { module: 'leave', resource: 'leave_request', action: 'create' },
  { module: 'leave', resource: 'leave_request', action: 'read' },
  { module: 'leave', resource: 'leave_request', action: 'update' },
  { module: 'leave', resource: 'leave_request', action: 'delete' },
  { module: 'leave', resource: 'leave_request', action: 'approve' },
  { module: 'leave', resource: 'leave_request', action: 'reject' },
  { module: 'leave', resource: 'leave_request', action: 'cancel' },
  { module: 'leave', resource: 'leave_request', action: 'restore' },
  { module: 'leave', resource: 'leave_request', action: 'export' },

  { module: 'leave', resource: 'leave_type', action: 'create' },
  { module: 'leave', resource: 'leave_type', action: 'read' },
  { module: 'leave', resource: 'leave_type', action: 'update' },
  { module: 'leave', resource: 'leave_type', action: 'delete' },
  { module: 'leave', resource: 'leave_type', action: 'restore' },

  { module: 'leave', resource: 'leave_balance', action: 'read' },
  { module: 'leave', resource: 'leave_balance', action: 'update' },
  { module: 'leave', resource: 'leave_balance', action: 'export' },

  { module: 'leave', resource: 'leave_settings', action: 'read' },
  { module: 'leave', resource: 'leave_settings', action: 'update' },
] as const
```

## 10.5 Own-Record Access

MVP ABAC conditions are deferred.

To support normal staff workflows without ABAC, Leave may use explicit own-record resources:

```txt
leave.own_leave_request.create
leave.own_leave_request.read
leave.own_leave_request.cancel
```

The service must still enforce that the request belongs to the current user's linked Employee.

Permission alone is not enough.

```txt
User has leave.own_leave_request.read
  ↓
Service must verify request.employeeId === ctx.employeeId
```

If the authenticated user has no linked Employee record, own-record leave actions must fail with a safe business error.

---

# 11. Roles

The Leave Module may suggest default role grants, but grants are applied by provisioning, not by the manifest itself.

## 11.1 Staff

Recommended permissions:

```txt
leave.own_leave_request.create
leave.own_leave_request.read
leave.own_leave_request.cancel
leave.leave_type.read
```

## 11.2 HR / Leave Admin

Recommended permissions:

```txt
leave.leave_request.create
leave.leave_request.read
leave.leave_request.update
leave.leave_request.cancel
leave.leave_request.delete
leave.leave_request.restore
leave.leave_request.export
leave.leave_type.create
leave.leave_type.read
leave.leave_type.update
leave.leave_type.delete
leave.leave_balance.read
leave.leave_balance.update
leave.leave_balance.export
leave.leave_settings.read
leave.leave_settings.update
```

## 11.3 Approver

Recommended permissions:

```txt
leave.leave_request.read
leave.leave_request.approve
leave.leave_request.reject
```

Important: In MVP, Approver means a user with permission to approve pending leave requests. It does not yet mean multi-step workflow assignment.

---

# 12. Routes

## 12.1 Page Routes

All page routes live inside the organization shell.

```txt
/[orgSlug]/leave
/[orgSlug]/leave/requests
/[orgSlug]/leave/requests/new
/[orgSlug]/leave/requests/[id]
/[orgSlug]/leave/approvals
/[orgSlug]/leave/types
/[orgSlug]/leave/balances
/[orgSlug]/leave/settings
```

MVP page priority:

```txt
1. /leave/requests
2. /leave/requests/new
3. /leave/approvals
4. /leave/types
5. /leave/balances only if balanceTrackingEnabled
6. /leave/settings only for admins
```

## 12.2 API Routes

All API routes must be tenant-scoped by `orgSlug`.

```txt
GET    /api/orgs/[orgSlug]/leave/requests
POST   /api/orgs/[orgSlug]/leave/requests
GET    /api/orgs/[orgSlug]/leave/requests/[id]
PATCH  /api/orgs/[orgSlug]/leave/requests/[id]
DELETE /api/orgs/[orgSlug]/leave/requests/[id]
POST   /api/orgs/[orgSlug]/leave/requests/[id]/approve
POST   /api/orgs/[orgSlug]/leave/requests/[id]/reject
POST   /api/orgs/[orgSlug]/leave/requests/[id]/cancel

GET    /api/orgs/[orgSlug]/leave/types
POST   /api/orgs/[orgSlug]/leave/types
PATCH  /api/orgs/[orgSlug]/leave/types/[id]
DELETE /api/orgs/[orgSlug]/leave/types/[id]

GET    /api/orgs/[orgSlug]/leave/balances
PATCH  /api/orgs/[orgSlug]/leave/balances/[id]

GET    /api/orgs/[orgSlug]/leave/settings
PATCH  /api/orgs/[orgSlug]/leave/settings
```

Forbidden routes:

```txt
/api/leave?orgId=...
/api/leave/requests?orgId=...
/api/[module]
/api/leave/[id] without org slug
```

---

# 13. API Contract

Every API must use the Kernel API response shape:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

APIs must:

```txt
return JSON only
never redirect
never return login HTML
validate params
validate query strings
validate request bodies
reject client-supplied orgId
derive tenant from session + orgSlug
create verified PlatformContext before service calls
enforce permission before service calls
call services with PlatformContext
map expected errors to stable error codes
```

---

# 14. Zod Schemas

Schemas must use `z.strictObject()` by default.

## 14.1 Create Leave Request

```ts
export const CreateLeaveRequestSchema = z.strictObject({
  employeeId: z.string().min(1).optional(),
  leaveTypeId: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  reason: z.string().max(1000).optional(),
})
```

Rules:

```txt
orgId is forbidden
status is forbidden on create
submittedByUserId is forbidden
submittedAt is server-owned
employeeId is optional
```

If `employeeId` is omitted, the service treats the request as an own leave request and derives the Employee from `ctx.user.employeeId`.

If `employeeId` is provided, the service requires broader `leave.leave_request.create` permission and validates that the Employee belongs to the same org.

## 14.2 Approve Leave Request

```ts
export const ApproveLeaveRequestSchema = z.strictObject({
  note: z.string().max(1000).optional(),
})
```

## 14.3 Reject Leave Request

```ts
export const RejectLeaveRequestSchema = z.strictObject({
  reason: z.string().min(1).max(1000),
})
```

## 14.4 Cancel Leave Request

```ts
export const CancelLeaveRequestSchema = z.strictObject({
  reason: z.string().max(1000).optional(),
})
```

## 14.5 Leave Type

```ts
export const CreateLeaveTypeSchema = z.strictObject({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  isPaid: z.boolean().default(true),
  requiresBalance: z.boolean().default(true),
})
```

All schemas must reject client-supplied `orgId`.

---

# 15. Services

The Leave Module must have a server-only service layer.

Recommended file:

```txt
src/modules/leave/service.ts
```

Public service methods must receive verified `PlatformContext`.

```ts
LeaveService.listRequests(ctx, filters)
LeaveService.getRequest(ctx, id)
LeaveService.createRequest(ctx, input)
LeaveService.approveRequest(ctx, id, input)
LeaveService.rejectRequest(ctx, id, input)
LeaveService.cancelRequest(ctx, id, input)
LeaveService.deleteRequest(ctx, id)
LeaveService.restoreRequest(ctx, id)

LeaveService.listTypes(ctx)
LeaveService.createType(ctx, input)
LeaveService.updateType(ctx, id, input)
LeaveService.deleteType(ctx, id)

LeaveService.listBalances(ctx, filters)
LeaveService.updateBalance(ctx, id, input)
```

Forbidden service signatures:

```ts
LeaveService.listRequests(orgId)
LeaveService.createRequest(orgId, input)
LeaveService.approveRequest(userId, orgId, id)
```

Correct service signature:

```ts
LeaveService.createRequest(ctx, input)
```

## 15.1 Service Responsibilities

Services must handle:

```txt
tenant scoping
permission enforcement
module setting checks
Employee tenant validation
LeaveType tenant validation
status transition validation
overlapping-request validation
balance validation if enabled
soft-delete behavior
event emission after successful mutation
transaction boundaries
```

## 15.2 Create Request Flow

```txt
1. Receive PlatformContext and validated input.
2. Determine target Employee.
3. If employeeId omitted:
   - require own_leave_request.create
   - require ctx.user linked to Employee
   - target employee = ctx.employee
4. If employeeId provided:
   - require leave_request.create
   - validate employee belongs to ctx.org
5. Validate LeaveType belongs to ctx.org and is active.
6. Validate dates.
7. Validate no overlapping pending/approved leave unless setting allows it.
8. Calculate durationDays.
9. If balance tracking and enforcement enabled, validate available balance.
10. Create LeaveRequest with status pending.
11. Update pendingDays if balance tracking enabled.
12. Emit leave.leave_request.submitted.
13. Return created request.
```

## 15.3 Approve Request Flow

```txt
1. Receive PlatformContext and validated input.
2. Require leave.leave_request.approve.
3. Load request by id + ctx.org.id + deletedAt null.
4. If not found, return safe not found.
5. Require request.status === pending.
6. If balance tracking enabled:
   - move duration from pendingDays to usedDays
   - or update usedDays depending on chosen balance model
7. Set status approved.
8. Set decidedByUserId and decidedAt.
9. Save decisionNote.
10. Emit leave.leave_request.approved.
11. Return updated request.
```

## 15.4 Reject Request Flow

```txt
1. Require leave.leave_request.reject.
2. Load request by id + ctx.org.id.
3. Require status pending.
4. If balance tracking enabled, reduce pendingDays.
5. Set status rejected.
6. Set decidedByUserId, decidedAt, decisionNote.
7. Emit leave.leave_request.rejected.
```

## 15.5 Cancel Request Flow

Cancellation is not deletion.

```txt
If own cancellation:
  require own_leave_request.cancel
  verify request.employeeId === ctx.employee.id

If admin/HR cancellation:
  require leave.leave_request.cancel
```

Rules:

```txt
pending requests may be cancelled
approved requests may be cancelled only by admin/HR or if policy allows
rejected requests normally cannot be cancelled
cancelled requests remain historical records
```

Events:

```txt
leave.leave_request.cancelled
```

---

# 16. Status Transition Rules

Allowed MVP transitions:

```txt
pending → approved
pending → rejected
pending → cancelled
approved → cancelled   // admin/HR only
```

Forbidden MVP transitions:

```txt
approved → pending
rejected → pending
cancelled → pending
rejected → approved
cancelled → approved
```

Correction workflows should use a new request or admin correction, not unsafe state rewrites.

---

# 17. Events

Events must be facts, not commands.

Events must be emitted from services after successful mutations.

Events must use verified `PlatformContext`.

Event payloads must not include:

```txt
orgId
full Prisma records
full Employee records
private notes unless necessary
sensitive personal data
```

## 17.1 Leave Request Events

```txt
leave.leave_request.submitted
leave.leave_request.approved
leave.leave_request.rejected
leave.leave_request.cancelled
leave.leave_request.updated
leave.leave_request.deleted
leave.leave_request.restored
```

## 17.2 Leave Type Events

```txt
leave.leave_type.created
leave.leave_type.updated
leave.leave_type.deactivated
leave.leave_type.reactivated
leave.leave_type.deleted
leave.leave_type.restored
```

## 17.3 Leave Balance Events

```txt
leave.leave_balance.created
leave.leave_balance.updated
leave.leave_balance.adjusted
```

## 17.4 Example Event Payload

```ts
type LeaveRequestApprovedPayload = {
  requestId: string
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  durationDays: string
  decidedByUserId: string
}
```

Note: `orgId` belongs to the event envelope, not the payload.

---

# 18. Platform Services Boundary

The Leave Module will naturally create pressure to build Platform Services too early.

Do not do that.

## 18.1 Approval Engine

The Leave Module may include module-local approval logic.

Do not build the Platform Approval Workflow Service yet.

Rationale:

```txt
One module needing approval does not justify a Platform Service.
Leave approvals + purchase approvals + expense approvals may justify future promotion.
```

## 18.2 Notifications

Do not build Notification Service yet.

The Leave Module may emit events such as:

```txt
leave.leave_request.submitted
leave.leave_request.approved
leave.leave_request.rejected
```

A future Notification Service can subscribe to those events.

For MVP, users can check the Leave UI.

## 18.3 Attachments

Do not build Attachment Service yet.

Medical certificates, documents, and file uploads are deferred.

If a first paid client absolutely requires medical certificate uploads, that must become a founder-approved module-local file handling exception or wait for Attachment Service promotion.

## 18.4 Comments

Do not build Comments Service yet.

Use simple decision notes and request reason fields only.

## 18.5 Activity Feed

Do not build Activity Feed yet.

Emit events now so activity can be derived later.

---

# 19. UI Screens

The Leave UI should feel like a focused workflow module, not a generic CRUD dashboard.

## 19.1 Leave Requests List

Purpose:

```txt
Show leave requests relevant to the current user.
```

For staff:

```txt
show own requests
create new request
cancel pending own request
view status
```

For HR/Admin/Approver:

```txt
show all requests
filter by status
filter by employee
filter by leave type
approve/reject pending requests if permitted
```

Table columns:

```txt
Employee
Leave Type
Date Range
Duration
Status
Submitted Date
Decision Date
Actions
```

## 19.2 New Leave Request

Fields:

```txt
Employee       // hidden/derived for own request; visible only for create-for-others permission
Leave Type
Start Date
End Date
Reason
```

No hidden `orgId` field.

## 19.3 Request Detail

Shows:

```txt
employee
leave type
dates
duration
status
reason
decision note
decision actor
timeline-style simple status history if available
```

Do not build full Activity Feed.

## 19.4 Approvals Page

Shows pending requests requiring decision.

```txt
/[orgSlug]/leave/approvals
```

This page should be visible only to users with:

```txt
leave.leave_request.approve
or
leave.leave_request.reject
```

## 19.5 Leave Types Page

Admin-only configuration for leave categories.

## 19.6 Leave Balances Page

Visible only when balance tracking is enabled.

May be admin-only in MVP.

---

# 20. Navigation

The Leave module manifest should include nav items similar to:

```ts
navItems: [
  {
    label: 'Leave',
    href: '/leave',
    requiredPermission: { module: 'leave', resource: 'own_leave_request', action: 'read' },
  },
  {
    label: 'Leave Approvals',
    href: '/leave/approvals',
    requiredPermission: { module: 'leave', resource: 'leave_request', action: 'approve' },
  },
]
```

The actual manifest shape must follow the frozen Module Manifest document.

Navigation visibility is not security.

Routes, APIs, and services must still enforce permissions.

---

# 21. Module Manifest Requirements

The Leave manifest must declare:

```txt
id: leave
label: Leave
lifecycle: draft or official depending on readiness
module-owned entities
Business Objects used
permissions
navigation
page routes
API routes
events emitted
events listened to
settings schema
AI context reference
provisioning hook name if default leave types are seeded
```

The manifest must be pure metadata.

Forbidden manifest behavior:

```txt
self-registering side effects
importing @/kernel/*
importing @/sdk/server
importing raw Prisma
importing LeaveService
running seed functions directly
reading env vars
```

---

# 22. Default Provisioning

The Leave module may provide an optional provisioning hook.

Recommended default leave types:

```txt
VL — Vacation Leave
SL — Sick Leave
EL — Emergency Leave
UL — Unpaid Leave
```

Provisioning rules:

```txt
must be idempotent
must be org-scoped through PlatformContext
must not overwrite client-customized leave types
must not create balances unless balance tracking is enabled or explicitly requested
must not create employees
```

Provisioning must not run from the manifest directly.

---

# 23. Business Rules

## 23.1 Employee Validation

For every leave request:

```txt
Employee must exist
Employee must belong to ctx.org.id
Employee must not be soft-deleted
Employee should be active unless admin override is explicitly allowed
```

## 23.2 Leave Type Validation

```txt
LeaveType must exist
LeaveType must belong to ctx.org.id
LeaveType must not be soft-deleted
LeaveType must be active for new requests
```

## 23.3 Date Validation

```txt
startDate is required
endDate is required
startDate must be <= endDate
past date requests are blocked unless setting allows them
durationDays must be positive
```

## 23.4 Overlap Validation

By default:

```txt
same Employee cannot have overlapping pending or approved leave requests
```

Overlap can be allowed only if module setting explicitly permits it.

## 23.5 Balance Validation

If balance tracking is disabled:

```txt
LeaveRequest can be submitted without LeaveBalance
```

If balance tracking is enabled but enforcement is disabled:

```txt
balances may go negative or be informational only
```

If balance tracking and enforcement are both enabled:

```txt
service must check available balance before submission or approval
```

The exact enforcement point must be consistent:

```txt
Recommended MVP: enforce on approval, not submission.
```

Rationale:

```txt
Pending requests may change before approval.
Approval is the moment the organization commits to the leave.
```

---

# 24. Security Rules

The Leave Module must not weaken OneDayOS security.

Required rules:

```txt
use verified PlatformContext
never accept client-supplied orgId
reject orgId in request body/query
use tenant-scoped API routes
enforce module enablement
enforce permissions in API routes
enforce permissions in services during MVP
validate input with Zod
exclude soft-deleted records by default
never expose another org's Employees, LeaveTypes, LeaveRequests, or LeaveBalances
never return HTML/redirects from API routes
never import @/kernel/* from module files
never import raw Prisma from module files
never import another business module
```

---

# 25. Privacy and Sensitive Data

Leave data may contain sensitive employee information.

Examples:

```txt
sick leave reasons
medical conditions accidentally written in notes
family emergencies
personal travel details
```

Rules:

```txt
reason and decisionNote must not appear in event payloads by default
reason and decisionNote must not appear in logs
exports require explicit export permission
AI context must not include leave reasons by default
future notifications should not include sensitive leave details
```

Do not store medical certificate files in MVP.

---

# 26. Import / Export

## 26.1 Import

Generic Import Engine is deferred.

For MVP, leave balances may be initialized through founder/developer-run onboarding scripts if needed.

Rules:

```txt
scripts must use verified org context or approved provisioning context
scripts must validate before writing
scripts must not accept arbitrary orgId from CSV
scripts must not duplicate Employees
scripts must match Employees by tenant-safe identifiers
```

## 26.2 Export

Export is not included in MVP unless explicitly scoped.

If implemented later:

```txt
requires leave.leave_request.export or leave.leave_balance.export
must respect tenant isolation
must exclude deleted records by default
must avoid sensitive notes unless explicitly included and permitted
```

---

# 27. AI Context

The Leave Module should include static module AI context later.

It may describe:

```txt
what Leave does
what LeaveRequest means
what LeaveType means
what LeaveBalance means
which Business Objects it uses
common user questions
unsafe questions
permissions
module workflows
```

It must not include:

```txt
real employee leave data
orgId
client-specific policies
secrets
raw SQL
runtime data access
```

Runtime AI features are deferred.

---

# 28. Tests

The Leave Module is not production-ready without tests.

## 28.1 Required Tenant Isolation Tests

Use at least two organizations.

```txt
Org A user cannot list Org B leave requests
Org A user cannot read Org B leave request by id
Org A user cannot approve Org B leave request
Org A user cannot cancel Org B leave request
Org A user cannot update Org B leave type
Org A user cannot read Org B leave balances
```

## 28.2 Required Permission Tests

```txt
staff can create own leave request if permitted
staff cannot create leave request for another employee
staff can read own request if permitted
staff cannot read all requests without leave_request.read
staff cannot approve requests without approve permission
approver can approve pending requests
approver cannot update leave types without leave_type.update
admin/HR can manage leave types if permitted
```

## 28.3 Required API Tests

For protected routes:

```txt
unauthenticated returns JSON 401
wrong org returns safe 404
module disabled returns MODULE_NOT_FOUND
missing permission returns 403
client-supplied orgId is rejected
invalid date range returns VALIDATION_ERROR
invalid employeeId returns safe not found or validation/business error
success returns { data, error }
API never redirects
API never returns HTML
```

## 28.4 Required Service Tests

```txt
create own request derives Employee from ctx
create-for-others requires broader permission
overlapping requests are blocked by default
inactive leave type cannot be used
soft-deleted leave type cannot be used
approve only works from pending
reject only works from pending
cancel rules are enforced
balance is updated only when enabled
no events emitted when mutation fails
events emitted after successful mutation
```

## 28.5 Required Soft Delete Tests

```txt
soft-deleted LeaveTypes do not appear in normal lists
soft-deleted LeaveRequests do not appear in normal lists
delete emits leave.leave_request.deleted
restore emits leave.leave_request.restored
cancel does not soft-delete the request
```

## 28.6 Required Architecture Tests

```txt
module does not import @/kernel/*
module does not import raw Prisma
module does not import another module
module does not use sdk.getDb(orgId)
module services receive PlatformContext
module APIs use /api/orgs/[orgSlug]/leave
schemas reject orgId
no LeaveEmployee duplicate exists
```

---

# 29. Implementation Plan

Claude must not implement Leave until foundational Kernel, SDK, Data, Security, Testing, and Module System documents are frozen and implemented.

Recommended implementation sequence:

```txt
1. Freeze this Leave Module specification.
2. Run module generator: npm run module:create leave.
3. Add Leave Prisma models.
4. Create migration locally.
5. Add module manifest metadata.
6. Add permission constants.
7. Add Zod schemas.
8. Implement LeaveService.
9. Implement API routes using sdk.api.handle or approved wrapper.
10. Implement pages and client components.
11. Add provisioning hook for default leave types if approved.
12. Add tenant, permission, API, service, event, soft-delete, and architecture tests.
13. Run full checks.
14. Enable Leave for a test org.
15. Smoke test as staff, approver, and admin.
```

Required final commands:

```bash
npm run check:architecture
npm run check:generated
npm run lint
npm run typecheck
npm run test:run
npm run build
```

If any command does not exist yet, Claude must report that the platform foundation is incomplete rather than silently skipping it.

---

# 30. Claude Implementation Prompt

Use this prompt only after this document is approved/frozen and the required foundation documents are implemented.

```md
You are implementing the OneDayOS Leave Module.

Authoritative document:
docs/engineering-manual/17-module-specifications/02-leave-module.md

Rules:
- Do not invent architecture.
- Do not import from @/kernel/* inside module files.
- Do not import raw Prisma inside module files.
- Do not import another module.
- Use @/sdk/server for server-side SDK access.
- Use verified PlatformContext.
- Use sdk.getDb(ctx), never sdk.getDb(orgId).
- Tenant APIs must live under /api/orgs/[orgSlug]/leave/...
- Client-supplied orgId is forbidden and must be rejected.
- Employee is a Business Object; do not create LeaveEmployee.
- Leave approval is module-local for MVP; do not implement Platform Approval Service.
- Do not implement Notifications, Attachments, Comments, Activity Feed, or Background Jobs.
- Add tests for tenant isolation, permission denial, API failure paths, soft delete, events, and architecture rules.

Task:
Implement only the Leave Module MVP defined in this document.
Stop and report if required foundation helpers do not exist.
```

---

# 31. Acceptance Criteria

The Leave Module can be considered implemented only when all of the following are true:

```txt
[ ] Module manifest exists and follows manifest contract
[ ] Module uses SDK only
[ ] Module services receive PlatformContext
[ ] No module file imports @/kernel/*
[ ] No module file imports raw Prisma
[ ] No module file imports another module
[ ] No client-supplied orgId is accepted
[ ] APIs use /api/orgs/[orgSlug]/leave/...
[ ] APIs return JSON only
[ ] APIs never redirect
[ ] Employee is referenced, not duplicated
[ ] LeaveType exists and is tenant-scoped
[ ] LeaveRequest exists and is tenant-scoped
[ ] LeaveBalance exists if balance tracking is implemented
[ ] Staff can create own request
[ ] Staff cannot approve requests
[ ] Approver can approve/reject pending requests
[ ] Wrong-org access fails safely
[ ] Module-disabled access fails safely
[ ] Missing permission returns 403
[ ] Invalid input returns validation error
[ ] Overlapping requests are handled according to settings
[ ] Soft delete and cancellation are separate
[ ] Events are emitted only after successful mutations
[ ] No deferred Platform Services are implemented accidentally
[ ] Tests cover two organizations
[ ] Tests cover non-admin denial cases
[ ] Architecture checks pass
[ ] Typecheck passes
[ ] Tests pass
[ ] Build passes
```

---

# 32. Founder Review Questions

Before freezing this document, answer:

```txt
1. Should the MVP support half-day leave, or full-day only?
2. Should balance tracking be default on or default off?
3. Should approval be required for every leave request?
4. Who is the default approver in small SMEs: Admin only, HR role, or any Approver role?
5. Should default leave types be created automatically during module enablement?
6. Should Leave be positioned as an official early module after Inventory?
```

Default recommendation:

```txt
Full-day only.
Balance tracking default off.
Approval required by default.
Any user with Approver permission may approve.
Default leave types may be provisioned but not forced.
Leave should be an early official module after Inventory because it proves workflow behavior.
```

---

# 33. Final Rule

The Leave Module should prove that OneDayOS can handle human workflow without becoming a full HRIS too early.

```txt
Use Employee.
Do not duplicate Employee.
Keep approval module-local.
Emit events.
Defer Platform Services.
Protect tenant boundaries.
Enforce permissions.
Make the workflow simple enough to deliver.
```
