# OneDayOS Engineering Manual — 07 Business Objects — 01 Employee

**Document ID:** `07-business-objects/01-employee.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Last Updated:** July 2026  
**Implementation Allowed:** Not until approved/frozen with the Business Object foundation documents  
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

---

# 1. Purpose

This document defines the **Employee Business Object** for OneDayOS.

`Employee` is the shared representation of a person who works for, reports to, is assigned to, requests from, approves for, receives assets from, or otherwise participates in the client organization.

Employee is not owned by HR.

Employee is not owned by Leave.

Employee is not owned by Projects.

Employee is not owned by Assets.

Employee is not owned by any module.

Employee is a **shared Business Object** because many modules need the same person identity.

Examples:

```txt
Leave Module
  → Employee requests leave

Assets Module
  → Employee receives company laptop

Projects Module
  → Employee is assigned to project

Expenses Module
  → Employee submits reimbursement

Purchasing Module
  → Employee requests purchase

Incident Reporting Module
  → Employee reports or is involved in incident

Visitor Management Module
  → Employee hosts visitor
```

Therefore, OneDayOS must maintain **one Employee record per employee per organization**, not one copy per module.

---

# 2. Core Rule

```txt
Employee exists once.
Modules reference Employee.
Modules extend Employee only through module-owned extension tables.
Modules must never duplicate Employee.
```

Bad:

```txt
leave_employees
asset_employees
project_members_as_fake_employees
crm_staff
inventory_users_as_employees
```

Good:

```txt
employees
leave_employee_profiles
asset_assignments.employeeId
project_members.employeeId
expense_claims.employeeId
purchase_requests.requestedByEmployeeId
```

---

# 3. Employee vs User

This is one of the most important distinctions in the OneDayOS Kernel.

## 3.1 User

`User` is a platform login identity.

A User answers:

```txt
Who can log in?
What organization do they belong to?
What roles and permissions do they have?
Is their account active?
```

A User is part of the Kernel.

A User is security-sensitive.

A User is linked to Supabase Auth.

A User may or may not correspond to an Employee record.

Examples of Users:

```txt
company admin
operations staff
OneDayOS support operator in future
external accountant in future
```

## 3.2 Employee

`Employee` is a business/personnel record.

An Employee answers:

```txt
Who works for this organization?
Which branch or department are they in?
What is their employee number?
Are they currently employed?
Can business records reference them?
```

An Employee is a Business Object.

An Employee may exist without a login account.

Examples:

```txt
warehouse staff without OneDayOS login
field technician without OneDayOS login
driver with assets assigned but no login
cashier whose manager enters records for them
```

## 3.3 Relationship

```txt
User 0..1 → Employee
Employee 0..1 → User
```

In MVP terms:

```txt
User.employeeId optional
Employee.userId optional and unique
```

A person can be an employee without being a system user.

A system user may be linked to an employee if they represent an actual company employee.

Do not assume every user is an employee.

Do not assume every employee can log in.

---

# 4. Non-Goals

The Employee Business Object must remain minimal.

The following do **not** belong in core Employee for MVP:

```txt
salary
payroll settings
SSS number
TIN
PhilHealth number
Pag-IBIG number
bank account details
leave credits
work schedule
attendance rules
timekeeping records
performance reviews
emergency contacts
training history
certifications
medical information
complex org chart hierarchy
approval routing rules
employment contract documents
```

Those belong in future modules or extension tables, subject to the Three Independent Use Cases Rule and security review.

Examples:

```txt
PayrollEmployeeExtension
LeaveEmployeeProfile
AttendanceEmployeeSchedule
HRPersonnelFile
ApprovalDelegationRule
TrainingRecord
```

The core Employee table should not become an HRIS dumping ground.

---

# 5. Layer Classification

| Capability | Layer | Reason |
|---|---|---|
| Login identity | Kernel | Security/auth concern |
| User roles | Kernel | Security/auth concern |
| Employee identity | Business Objects | Shared business entity |
| Branch | Kernel org structure | Organization structure primitive |
| Department | Kernel org structure | Organization structure primitive |
| Leave balances | Leave Module | Domain-specific |
| Payroll profile | Payroll/HR Module | Sensitive domain-specific |
| Asset assignments | Assets Module | Domain-specific |
| Project membership | Projects Module | Domain-specific |
| Approval delegation | Platform Service later | Repeated approval workflow capability |

---

# 6. Data Model

## 6.1 Recommended Prisma Model

The exact model may evolve during implementation, but Claude should start from this shape unless a later frozen document supersedes it.

```prisma
model Employee {
  id               String    @id @default(cuid())
  orgId            String

  // Optional link to platform login user.
  // Null means the employee has no system login.
  userId           String?   @unique

  // Stable employee identifier within the client organization.
  employeeNo       String

  // Display name used across modules.
  name             String

  // Business contact details.
  email            String?
  phone            String?

  // Organization structure.
  branchId         String?
  departmentId     String?

  // Human-readable role/title in the business.
  position         String?

  // Business status, not deletion status.
  employmentType   String?   // full_time | part_time | contractor | seasonal | intern | other
  employmentStatus String    @default("active") // active | inactive | resigned | terminated

  hiredAt          DateTime?
  endedAt          DateTime?

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Soft delete lifecycle.
  deletedAt        DateTime?
  deletedBy        String?

  org              Organization @relation(fields: [orgId], references: [id])
  user             User?        @relation(fields: [userId], references: [id])
  branch           Branch?      @relation(fields: [branchId], references: [id])
  department       Department?  @relation(fields: [departmentId], references: [id])

  @@unique([orgId, employeeNo])
  @@unique([id, orgId])
  @@index([orgId, name])
  @@index([orgId, branchId])
  @@index([orgId, departmentId])
  @@index([orgId, employmentStatus])
  @@index([orgId, deletedAt])
  @@map("employees")
}
```

## 6.2 Required Fields

| Field | Required | Reason |
|---|---:|---|
| `orgId` | Yes | Tenant boundary |
| `employeeNo` | Yes | Stable organization-local identifier |
| `name` | Yes | Human-readable display identity |
| `employmentStatus` | Yes | Business status |
| `createdAt` | Yes | Audit/debug baseline |
| `updatedAt` | Yes | Sync/debug baseline |
| `deletedAt` | Yes as nullable field | Soft delete lifecycle |
| `deletedBy` | Yes as nullable field | Soft delete accountability |

## 6.3 Optional Fields

| Field | Reason Optional |
|---|---|
| `userId` | Many employees do not log in |
| `email` | Some employees may not have work email |
| `phone` | Some clients may not track phone numbers |
| `branchId` | Some organizations are department-first or single-location |
| `departmentId` | Some small clients may not use departments |
| `position` | Useful but not mandatory |
| `employmentType` | Some clients may not classify employment type |
| `hiredAt` | Legacy employee data may be incomplete |
| `endedAt` | Only relevant after employment ends |

---

# 7. Important Modeling Decisions

## 7.1 Use `employmentStatus`, not only `isActive`

The old MVP schema used `isActive` for Employee employment status.

For the restarted build, `employmentStatus` is clearer because it can represent more than two states:

```txt
active
inactive
resigned
terminated
```

This avoids overloading a Boolean for real business meaning.

If implementation needs a Boolean for convenience, it should be derived:

```ts
const isCurrentlyEmployed = employee.employmentStatus === 'active'
```

Do not use `isActive` as deletion status.

Deletion is always represented by:

```txt
deletedAt
deletedBy
```

## 7.2 Employee number is organization-scoped

Employee numbers only need to be unique inside the same organization.

Required constraint:

```prisma
@@unique([orgId, employeeNo])
```

Do not make `employeeNo` globally unique.

Bad:

```txt
Employee No. 001 can exist only once across all OneDayOS clients
```

Good:

```txt
Client A can have Employee No. 001
Client B can also have Employee No. 001
```

## 7.3 Email is not the identity key

Employee email should not be used as the primary identity key.

Reasons:

```txt
some employees have no email
some employees share email accounts
some employees change email addresses
some employees use personal email temporarily
login email belongs to User, not necessarily Employee
```

Therefore:

```txt
User.email = authentication/login email
Employee.email = business contact email
```

They may be the same value, but the system must not assume they are the same concept.

## 7.4 User link must be same-organization

An Employee must never link to a User from another organization.

The service must verify:

```txt
employee.orgId === ctx.org.id
user.orgId === ctx.org.id
```

Prefer database-level protection where practical by adding composite tenant-safe uniqueness constraints on `User` and `Employee`, then using composite references if Prisma implementation supports the final relation shape cleanly.

Application-level verification is mandatory either way.

---

# 8. Tenant Rules

Employee is tenant-scoped.

Every Employee query must be scoped by verified `PlatformContext`.

Required pattern:

```ts
EmployeeService.list(ctx, filters)
EmployeeService.getById(ctx, employeeId)
EmployeeService.create(ctx, input)
EmployeeService.update(ctx, employeeId, input)
EmployeeService.softDelete(ctx, employeeId)
```

Forbidden pattern:

```ts
EmployeeService.list(orgId)
EmployeeService.getById(employeeId)
sdk.getDb(orgId)
findUnique({ where: { id: employeeId } })
```

The tenant boundary comes from:

```txt
Supabase session
+ Prisma User
+ Organization slug
+ User.orgId === Organization.id
= PlatformContext
```

Never trust `orgId` from client payloads.

---

# 9. Permissions

Employee permissions use the `objects` namespace.

Required permission constants:

```ts
export const EMPLOYEE_PERMISSIONS = {
  READ: {
    module: 'objects',
    resource: 'employee',
    action: 'read',
  },
  CREATE: {
    module: 'objects',
    resource: 'employee',
    action: 'create',
  },
  UPDATE: {
    module: 'objects',
    resource: 'employee',
    action: 'update',
  },
  DELETE: {
    module: 'objects',
    resource: 'employee',
    action: 'delete',
  },
  RESTORE: {
    module: 'objects',
    resource: 'employee',
    action: 'restore',
  },
  DEACTIVATE: {
    module: 'objects',
    resource: 'employee',
    action: 'deactivate',
  },
} as const
```

## 9.1 Permission Meaning

| Permission | Allows |
|---|---|
| `objects.employee.read` | View employee records |
| `objects.employee.create` | Create employee records |
| `objects.employee.update` | Edit employee profile fields |
| `objects.employee.delete` | Soft-delete employee records |
| `objects.employee.restore` | Restore soft-deleted employee records |
| `objects.employee.deactivate` | Mark employee no longer active/resigned/terminated |

## 9.2 Linking Employee to User

Linking an Employee to a User affects both Business Objects and Kernel identity.

Therefore, linking or unlinking should require **both**:

```txt
objects.employee.update
kernel.user.update
```

or a future explicit permission:

```txt
kernel.user.link_employee
```

Until that is defined, Claude must not implement employee-user linking casually in generic Employee CRUD.

## 9.3 UI Visibility Is Not Security

The UI may hide Employee actions based on permissions.

But security is enforced only by API and service checks.

Required service/API pattern:

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'employee',
  action: 'create',
})
```

---

# 10. APIs

Employee APIs live under Business Object APIs, not module APIs.

Required route namespace:

```txt
/api/orgs/[orgSlug]/objects/employees
```

Not:

```txt
/api/hr/employees
/api/leave/employees
/api/assets/employees
/api/employees?orgId=...
```

## 10.1 Required API Routes

### List Employees

```txt
GET /api/orgs/[orgSlug]/objects/employees
```

Query params:

```txt
q?                  search by employeeNo/name/email/phone
branchId?           filter by branch
 departmentId?       filter by department
employmentStatus?   filter by employment status
includeInactive?    explicit boolean, default false
cursor?             pagination cursor
limit?              page size
```

Rules:

```txt
must require API org context
must require objects.employee.read
must exclude soft-deleted records
must never accept orgId
must validate all query params with Zod
```

### Create Employee

```txt
POST /api/orgs/[orgSlug]/objects/employees
```

Rules:

```txt
must require API org context
must require objects.employee.create
must reject orgId in body
must validate body with Zod strict object
must validate branch/department belong to ctx.org.id
must emit objects.employee.created
```

### Get Employee

```txt
GET /api/orgs/[orgSlug]/objects/employees/[employeeId]
```

Rules:

```txt
must require API org context
must require objects.employee.read
must query by id + ctx.org.id + deletedAt null
must return safe 404 if not found or wrong org
```

### Update Employee

```txt
PATCH /api/orgs/[orgSlug]/objects/employees/[employeeId]
```

Rules:

```txt
must require API org context
must require objects.employee.update
must reject orgId in body
must validate body with Zod strict object
must validate branch/department belong to ctx.org.id
must emit objects.employee.updated
```

### Soft Delete Employee

```txt
DELETE /api/orgs/[orgSlug]/objects/employees/[employeeId]
```

Rules:

```txt
must require API org context
must require objects.employee.delete
must soft delete only
must set deletedAt and deletedBy
must emit objects.employee.deleted
must not hard delete
```

### Restore Employee

```txt
POST /api/orgs/[orgSlug]/objects/employees/[employeeId]/restore
```

Rules:

```txt
must require API org context
must require objects.employee.restore
must restore only records belonging to ctx.org.id
must emit objects.employee.restored
```

### Change Employment Status

```txt
POST /api/orgs/[orgSlug]/objects/employees/[employeeId]/employment-status
```

or use normal `PATCH` if no special workflow is needed.

Rules:

```txt
must require objects.employee.deactivate for inactive/resigned/terminated transitions
must set endedAt when employmentStatus becomes resigned or terminated
must emit objects.employee.deactivated when moving out of active status
must emit objects.employee.reactivated when returning to active status
```

---

# 11. API Response Contract

All Employee APIs must follow the Kernel API contract.

Success:

```json
{
  "data": {
    "id": "emp_123",
    "employeeNo": "EMP-001",
    "name": "Juan Dela Cruz"
  },
  "error": null
}
```

Validation error:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request input.",
    "fields": {
      "employeeNo": ["Employee number is required."]
    }
  }
}
```

Unauthorized:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

Forbidden:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

Wrong organization or missing employee:

```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Employee not found."
  }
}
```

Never leak whether an Employee exists in another organization.

---

# 12. Validation Schemas

Employee schemas must use Zod.

All request body schemas must be strict.

Bad:

```ts
z.object({ name: z.string() })
```

Good:

```ts
z.strictObject({ name: z.string() })
```

## 12.1 Create Schema

```ts
import { z } from 'zod'

export const CreateEmployeeSchema = z.strictObject({
  employeeNo: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  email: z.email().trim().toLowerCase().optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  branchId: z.string().min(1).optional().nullable(),
  departmentId: z.string().min(1).optional().nullable(),
  position: z.string().trim().max(120).optional().or(z.literal('')),
  employmentType: z.enum([
    'full_time',
    'part_time',
    'contractor',
    'seasonal',
    'intern',
    'other',
  ]).optional().nullable(),
  employmentStatus: z.enum([
    'active',
    'inactive',
    'resigned',
    'terminated',
  ]).default('active'),
  hiredAt: z.iso.date().optional().nullable(),
})
```

## 12.2 Forbidden Body Fields

The following fields must not be accepted from client create/update payloads:

```txt
id
orgId
userId
createdAt
updatedAt
deletedAt
deletedBy
```

`userId` linking must be a separate, permission-guarded operation.

`orgId` comes only from `PlatformContext`.

## 12.3 Update Schema

```ts
export const UpdateEmployeeSchema = CreateEmployeeSchema
  .partial()
  .strict()
```

When using `.partial()`, confirm that forbidden fields are still impossible because they were never part of the base schema.

## 12.4 Query Schema

```ts
export const ListEmployeesQuerySchema = z.strictObject({
  q: z.string().trim().max(200).optional(),
  branchId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  employmentStatus: z.enum([
    'active',
    'inactive',
    'resigned',
    'terminated',
  ]).optional(),
  includeInactive: z.enum(['true', 'false']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})
```

---

# 13. Service Contract

Employee business logic belongs in a Business Object service, not inside API routes or UI components.

Recommended location:

```txt
src/business-objects/employees/service.ts
```

or, if the implementation keeps Business Objects under Kernel physically for MVP:

```txt
src/kernel/business-objects/employees/service.ts
```

The conceptual layer remains Business Objects either way.

## 13.1 Required Methods

```ts
type EmployeeService = {
  list(ctx: PlatformContext, filters: ListEmployeesFilters): Promise<EmployeeListResult>
  getById(ctx: PlatformContext, employeeId: string): Promise<EmployeeDto>
  create(ctx: PlatformContext, input: CreateEmployeeInput): Promise<EmployeeDto>
  update(ctx: PlatformContext, employeeId: string, input: UpdateEmployeeInput): Promise<EmployeeDto>
  softDelete(ctx: PlatformContext, employeeId: string): Promise<void>
  restore(ctx: PlatformContext, employeeId: string): Promise<EmployeeDto>
  setEmploymentStatus(
    ctx: PlatformContext,
    employeeId: string,
    status: EmploymentStatus,
  ): Promise<EmployeeDto>
}
```

## 13.2 Service Rules

Every service method must:

```txt
receive PlatformContext
perform permission requirement or receive proof that it was already required
scope all queries by ctx.org.id
exclude deleted records by default
validate tenant ownership of branchId and departmentId
emit required events after successful mutations
return DTOs, not raw Prisma records when used by API/UI
```

## 13.3 Example Create Flow

```ts
export async function createEmployee(
  ctx: PlatformContext,
  input: CreateEmployeeInput,
) {
  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'employee',
    action: 'create',
  })

  await assertBranchAndDepartmentBelongToOrg(ctx, input)

  const employee = await sdk.getDb(ctx).employee.create({
    data: {
      orgId: ctx.org.id,
      employeeNo: input.employeeNo,
      name: input.name,
      email: normalizeOptionalString(input.email),
      phone: normalizeOptionalString(input.phone),
      branchId: input.branchId ?? null,
      departmentId: input.departmentId ?? null,
      position: normalizeOptionalString(input.position),
      employmentType: input.employmentType ?? null,
      employmentStatus: input.employmentStatus ?? 'active',
      hiredAt: input.hiredAt ? new Date(input.hiredAt) : null,
    },
  })

  await sdk.events.emit(ctx, {
    name: 'objects.employee.created',
    entity: {
      type: 'employee',
      id: employee.id,
    },
    payload: {
      employeeId: employee.id,
      employeeNo: employee.employeeNo,
      name: employee.name,
    },
  })

  return toEmployeeDto(employee)
}
```

---

# 14. Events

Employee mutations must emit Business Object events.

Events use the `objects` namespace.

## 14.1 Required Events

```txt
objects.employee.created
objects.employee.updated
objects.employee.deactivated
objects.employee.reactivated
objects.employee.deleted
objects.employee.restored
objects.employee.linked_to_user
objects.employee.unlinked_from_user
```

## 14.2 Event Payload Rules

Payloads must be small and stable.

Do not emit full Prisma records.

Do not emit sensitive future HR fields.

Recommended payload for create/update:

```ts
type EmployeeEventPayload = {
  employeeId: string
  employeeNo: string
  name: string
  branchId?: string | null
  departmentId?: string | null
  employmentStatus?: string
}
```

Recommended payload for soft delete:

```ts
type EmployeeDeletedPayload = {
  employeeId: string
  employeeNo: string
  deletedBy: string
}
```

Recommended payload for user link:

```ts
type EmployeeLinkedToUserPayload = {
  employeeId: string
  userId: string
}
```

The SDK event envelope adds:

```txt
event id
event name
org id
actor user id
timestamp
source
```

## 14.3 Event Consumers

Potential future consumers:

```txt
Audit Log Service
Search Indexing
AI Context Indexing
Activity Feed
Notification Service
Reporting Cache
```

These consumers are deferred until promoted by the Three Independent Use Cases Rule.

Employee events should be emitted now so those future services can be added without retrofitting every mutation.

---

# 15. Extension Pattern

Modules may extend Employee through module-owned tables.

## 15.1 Leave Extension Example

```prisma
model LeaveEmployeeProfile {
  id                String @id @default(cuid())
  orgId             String
  employeeId         String
  annualLeaveCredits Decimal
  sickLeaveCredits   Decimal

  employee Employee @relation(fields: [employeeId], references: [id])

  @@unique([orgId, employeeId])
  @@index([orgId])
  @@map("leave_employee_profiles")
}
```

## 15.2 Assets Example

Assets usually do not need an Employee extension table. They reference Employee directly:

```prisma
model AssetAssignment {
  id         String @id @default(cuid())
  orgId      String
  assetId    String
  employeeId String
  assignedAt DateTime
  returnedAt DateTime?

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([orgId, employeeId])
  @@map("asset_assignments")
}
```

## 15.3 Payroll Extension Example

```prisma
model PayrollEmployeeProfile {
  id              String @id @default(cuid())
  orgId           String
  employeeId       String
  payType          String
  baseSalary       Decimal?
  bankAccountLast4 String?

  employee Employee @relation(fields: [employeeId], references: [id])

  @@unique([orgId, employeeId])
  @@map("payroll_employee_profiles")
}
```

Payroll data is sensitive and must not be added to core Employee.

---

# 16. Relationship to Branch and Department

Branch and Department are Kernel organization-structure primitives.

Employee may reference both.

Rules:

```txt
Employee.branchId must belong to ctx.org.id
Employee.departmentId must belong to ctx.org.id
If Department has branchId, and Employee.branchId is also set, they should not conflict
Department can be branch-null for department-first organizations
Employee.branchId may be null
Employee.departmentId may be null
```

Do not hard-code the assumption that every Employee must have a branch.

Some Philippine SMEs have one location and simple departments only.

Do not hard-code the assumption that every Employee must have a department.

Some SMEs may start with only employee names and numbers.

---

# 17. Employee Lifecycle

Employee lifecycle is separate from record deletion.

## 17.1 Active Employee

```txt
employmentStatus = active
deletedAt = null
```

The employee currently works for the organization and can be referenced by active workflows.

## 17.2 Inactive / Resigned / Terminated Employee

```txt
employmentStatus = inactive | resigned | terminated
deletedAt = null
endedAt may be set
```

The employee no longer participates in most new workflows, but historical records still reference them.

Examples:

```txt
old leave requests
old asset assignments
old project assignments
old purchase requests
old incident reports
```

Do not delete employees just because they resigned.

Use employment status.

## 17.3 Soft-Deleted Employee

```txt
deletedAt != null
```

Soft delete means the record itself should be hidden from normal views.

Soft delete is for:

```txt
duplicate record
erroneous import
test data accidentally created in production
privacy/legal deletion workflow in future
```

Soft delete is not the same as resignation.

---

# 18. Deletion Rules

Employee deletion must be conservative because many records may reference employees.

## 18.1 Normal Employee Offboarding

Use:

```txt
employmentStatus = resigned | terminated
endedAt = date
```

Do not soft delete.

## 18.2 Erroneous Record Removal

Use soft delete:

```txt
deletedAt = now
deletedBy = ctx.user.id
```

## 18.3 Hard Delete

Hard delete is forbidden for normal app behavior.

Hard delete may only happen through approved maintenance scripts, under a future data retention/deletion policy, and only with explicit architectural approval.

---

# 19. Search Behavior

Employee should be searchable by:

```txt
employeeNo
name
email
phone
position
branch name future
department name future
```

Search must be tenant-scoped.

Search must exclude soft-deleted records.

Search may optionally exclude non-active employees by default in assignment pickers.

Example:

```txt
Asset assignment picker
  → show active employees only by default

Historical reports
  → include inactive/resigned/terminated employees when referenced by old records
```

---

# 20. Reporting Behavior

Reports may group by Employee.

Examples:

```txt
assets assigned by employee
leave days used by employee
expenses submitted by employee
projects by employee
incidents reported by employee
```

Reports must preserve historical references even if employee status changes later.

Do not rewrite historical records when employee name/branch/department changes unless a future snapshotting strategy requires it.

For MVP, historical records can display the current Employee name.

Future modules may snapshot display fields if needed.

---

# 21. UI Requirements

The Employee Business Object should eventually provide shared UI surfaces:

```txt
Employee list
Employee create form
Employee edit form
Employee detail page
Employee picker/search component
Employee status badge
Employee branch/department display
```

These shared UI components prevent each module from building its own employee selector.

## 21.1 Employee Picker

Many modules will need an employee picker.

Examples:

```txt
assign asset to employee
request leave for employee
assign task to employee
select visitor host
select incident reporter
```

The Employee picker should:

```txt
search by employeeNo and name
show branch/department when available
exclude soft-deleted employees
show active employees by default
allow historical/inactive display when viewing old records
respect objects.employee.read permission
be tenant-scoped
```

Do not build a generic dynamic relation picker too early.

A simple Employee picker is acceptable because Employee is a core Business Object.

---

# 22. Import Behavior

Employee import is likely needed early for real clients.

However, a full Import Engine is deferred.

MVP may support a controlled operator script or simple admin import if needed.

Rules for any Employee import:

```txt
must be tenant-scoped
must require verified PlatformContext or operator context
must validate every row with Zod
must reject rows with orgId
must upsert by orgId + employeeNo only if explicitly selected
must not overwrite userId links accidentally
must report row-level errors
must emit events or documented bulk event
```

Do not silently create Users for imported Employees.

Employee import creates employees only.

User invitations/login creation is a separate Kernel user flow.

---

# 23. AI Context

Employee can be included in future AI context, but carefully.

Allowed AI-safe fields by default:

```txt
employee id
employee number
name
branch
 department
position
employment status
```

Sensitive or future fields must not be added to AI context by default:

```txt
salary
government IDs
bank details
medical data
performance notes
private HR records
```

AI must obey permissions.

A user who cannot read employees must not retrieve employee data through AI.

AI must be tenant-scoped.

---

# 24. Module Usage Rules

## 24.1 Leave Module

Leave references Employee.

Leave may own:

```txt
LeaveRequest
LeaveType
LeaveBalance or LeaveEmployeeProfile
```

Leave must not own:

```txt
LeaveEmployee
Employee copy
Employee department copy
```

## 24.2 Assets Module

Assets references Employee for assignments.

Assets may own:

```txt
Asset
AssetAssignment
AssetReturn
```

Assets must not copy Employee fields except optional historical snapshot fields if approved.

## 24.3 Projects Module

Projects references Employee for membership and task assignment.

Projects may own:

```txt
Project
ProjectMember
Task
```

`ProjectMember.employeeId` references Employee.

## 24.4 Expenses Module

Expenses references Employee as claimant/requester.

Expenses may own:

```txt
ExpenseClaim
ExpenseLine
ReimbursementBatch
```

## 24.5 Visitor Management Module

Visitor Management references Employee as host.

Visitor module may own:

```txt
Visitor
Visit
VisitLog
```

`Visit.hostEmployeeId` references Employee.

---

# 25. Database Query Rules

Required list query shape:

```ts
const employees = await sdk.getDb(ctx).employee.findMany({
  where: {
    orgId: ctx.org.id,
    deletedAt: null,
    ...(filters.employmentStatus
      ? { employmentStatus: filters.employmentStatus }
      : { employmentStatus: 'active' }),
  },
  orderBy: [{ name: 'asc' }],
  take: filters.limit,
})
```

Forbidden:

```ts
await prisma.employee.findMany()
await prisma.employee.findUnique({ where: { id } })
await sdk.getDb(orgId).employee.findMany(...)
await sdk.getDb(ctx).employee.findMany({ where: { orgId: input.orgId } })
```

For get-by-id:

```ts
const employee = await sdk.getDb(ctx).employee.findFirst({
  where: {
    id: employeeId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Do not use tenant-unsafe `findUnique` on Employee.

---

# 26. Error Handling

| Case | API Status | Error Code |
|---|---:|---|
| Unauthenticated | 401 | `UNAUTHENTICATED` |
| Wrong org | 404 | `ORG_NOT_FOUND` or `NOT_FOUND` |
| Missing permission | 403 | `FORBIDDEN` |
| Invalid body/query | 400 | `VALIDATION_ERROR` |
| Duplicate employee number | 409 | `CONFLICT` |
| Branch not found in org | 400 or 404 | `INVALID_REFERENCE` |
| Department not found in org | 400 or 404 | `INVALID_REFERENCE` |
| Employee not found | 404 | `NOT_FOUND` |

For wrong-org Employee access, return `NOT_FOUND`, not `FORBIDDEN`, to avoid leaking cross-tenant existence.

---

# 27. Tests Required

Employee implementation is not complete unless these tests exist.

## 27.1 Service Tests

```txt
creates employee scoped to ctx.org.id
rejects duplicate employeeNo inside same org
allows same employeeNo in different org
lists only employees from ctx.org.id
excludes soft-deleted employees
gets employee by id only within ctx.org.id
updates only employees from ctx.org.id
soft-deletes with deletedAt/deletedBy
restores only employees from ctx.org.id
deactivates without soft-deleting
rejects branchId from another org
rejects departmentId from another org
emits objects.employee.created
emits objects.employee.updated
emits objects.employee.deleted
```

## 27.2 Permission Tests

```txt
admin can read/create/update/delete
staff without objects.employee.create cannot create
staff without objects.employee.update cannot update
staff without objects.employee.delete cannot delete
UI-hidden action is still rejected by API/service
wildcard permission works inside same org only
wildcard permission does not cross tenant boundary
```

## 27.3 API Tests

```txt
unauthenticated request returns 401 JSON
wrong orgSlug returns safe 404 JSON
missing permission returns 403 JSON
client-supplied orgId in body is rejected
unknown body keys are rejected
validation errors follow API contract
same employeeNo in same org returns 409
same employeeNo in different org succeeds
cross-tenant get/update/delete returns safe 404
```

## 27.4 Tenant Tests

Every tenant-sensitive Employee test must use at least two organizations:

```txt
orgA
orgB
userA in orgA
userB in orgB
employeeA in orgA
employeeB in orgB
```

Single-org tests are insufficient.

---

# 28. Seed Data

Baseline seed should create no real employees unless needed for demo.

Demo seed may create:

```txt
EMP-001 — Juan Dela Cruz — Operations — active
EMP-002 — Maria Santos — Sales — active
EMP-003 — Pedro Reyes — Warehouse — active
```

Demo employee data must be obviously fake.

Production seed must not create fake employees for real client orgs.

Client onboarding may create employees through:

```txt
admin UI
operator script
future import tool
```

---

# 29. Claude Implementation Rules

When Claude implements Employee, instruct it:

```txt
Implement only the Employee Business Object described in this document.
Do not create HR, Leave, Payroll, Attendance, or Approval features.
Do not add salary, government IDs, bank fields, or leave balances to Employee.
Do not import from @/kernel/* inside modules.
Use PlatformContext for every protected operation.
Use sdk.getDb(ctx), never sdk.getDb(orgId).
Reject client-supplied orgId.
Use Zod strict schemas.
Use API-safe auth helpers.
Use objects.employee.* permissions.
Emit objects.employee.* events after mutations.
Soft-delete; never hard-delete.
Add two-org tenant isolation tests.
Add permission denial tests.
Return { data, error } JSON from APIs.
Do not add FastAPI.
Stop if the manual conflicts with approved Kernel/SDK/Data documents.
```

---

# 30. Common Mistakes to Avoid

## Mistake 1: Treating Employee as HR-owned

Bad:

```txt
src/modules/hr/employees
```

Employee is not HR-owned.

HR may extend Employee later.

## Mistake 2: Creating users automatically for employees

Bad:

```txt
Every employee gets a login account.
```

Most SMEs will have employees who never log in.

Create Employee first.

Create/link User only when access is needed.

## Mistake 3: Deleting resigned employees

Bad:

```txt
employee resigns → deletedAt = now
```

Good:

```txt
employee resigns → employmentStatus = resigned, endedAt = date
```

## Mistake 4: Adding payroll fields to core Employee

Bad:

```txt
Employee.salary
Employee.sssNumber
Employee.bankAccount
```

Good:

```txt
PayrollEmployeeProfile.employeeId
```

## Mistake 5: Trusting `orgId` from the form

Bad:

```ts
const orgId = body.orgId
```

Good:

```ts
const ctx = await sdk.auth.requireApiOrgContext(req, orgSlug)
const orgId = ctx.org.id
```

## Mistake 6: Using employee email as login identity

Bad:

```txt
Employee.email drives authentication
```

Good:

```txt
User.email drives login
Employee.email is business contact info
```

---

# 31. Open Questions

These are intentionally not decided in this Employee document.

## 31.1 Manager / Supervisor Field

Should Employee have `managerEmployeeId`?

Decision for MVP:

```txt
Deferred.
```

Reason:

```txt
manager chains affect approvals, org charts, HR, leave, expenses, and projects.
This can become workflow logic quickly.
Do not put it into core Employee until at least three independent use cases prove the same pattern.
```

## 31.2 Employee Name Structure

Should Employee use `firstName`, `middleName`, `lastName`, `suffix`, or one `name` field?

Decision for MVP:

```txt
Use name.
```

Reason:

```txt
Philippine names can be complex.
Many SMEs maintain names as display strings.
One-day delivery benefits from simple data entry.
Formal name decomposition can be added later if payroll/HR/legal modules require it.
```

## 31.3 Employee Auto-Numbering

Should OneDayOS auto-generate employee numbers?

Decision for MVP:

```txt
Manual employeeNo required.
```

Future:

```txt
Org setting may define employee number sequence.
```

Do not build sequence engine yet.

## 31.4 Employee Custom Fields

Should clients add custom employee fields?

Decision for MVP:

```txt
No generic custom fields yet.
```

Future:

```txt
Dynamic Fields / Dynamic Forms after proven repetition.
```

---

# 32. Implementation Checklist

Claude should not implement Employee until this checklist is satisfied:

```txt
[ ] Business Object Philosophy approved/frozen
[ ] Employee document approved/frozen
[ ] Kernel API contract approved/frozen
[ ] SDK auth/permissions approved/frozen
[ ] SDK DB access approved/frozen
[ ] Tenancy data isolation approved/frozen
[ ] Zod validation approved/frozen
[ ] Soft-delete rules approved/frozen
```

Employee implementation is complete only when:

```txt
[ ] Employee Prisma model exists with orgId tenancy
[ ] Employee service uses PlatformContext
[ ] Employee APIs live under /api/orgs/[orgSlug]/objects/employees
[ ] Employee schemas reject orgId and unknown keys
[ ] Employee permissions use objects.employee.*
[ ] Employee mutations emit objects.employee.* events
[ ] Employee list excludes deleted records
[ ] Employee delete is soft delete only
[ ] Employee status change does not soft-delete
[ ] Branch/department references are tenant-validated
[ ] Employee can exist without User
[ ] User link cannot cross organizations
[ ] Two-org tenant tests pass
[ ] Permission denial tests pass
[ ] API error contract tests pass
[ ] Typecheck passes
[ ] Lint passes
[ ] Build passes
```

---

# 33. Acceptance Criteria

This document is accepted when the founder and architect agree that:

```txt
[ ] Employee is clearly separate from User
[ ] Employee is clearly a Business Object, not an HR module entity
[ ] Core Employee fields are minimal enough for many modules
[ ] HR/payroll/leave-specific fields are excluded
[ ] Tenant isolation rules are explicit
[ ] Permission rules are explicit
[ ] API routes are explicit
[ ] Service patterns are explicit
[ ] Events are explicit
[ ] Soft delete vs employment status is clear
[ ] Extension pattern is clear
[ ] Claude can implement Employee without inventing architecture
```

---

# 34. Final Architectural Rule

Employee is the person identity that business modules share.

It must be stable, tenant-scoped, minimal, permission-protected, soft-deletable, and event-emitting.

OneDayOS should never have multiple competing Employee concepts.

```txt
One organization.
One employee record.
Many modules referencing it.
No duplicates.
No module ownership.
No loose orgId.
No HR overreach.
```
