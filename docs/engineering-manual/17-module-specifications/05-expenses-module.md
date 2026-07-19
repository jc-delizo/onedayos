# OneDayOS Engineering Manual — 17 Module Specifications — 05 Expenses Module

**Document ID:** `17-module-specifications/05-expenses-module.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Expenses Module Implementation  
**Owner:** OneDayOS Founder / Software Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `00-meta/00-roadmap.md`
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
- `07-business-objects/04-supplier.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/*`
- `09-cli-generators/*`
- `10-platform-services/04-approval-workflow-service.md`
- `10-platform-services/06-attachments-service.md`
- `14-testing-quality/*`
- `17-module-specifications/00-module-spec-template.md`

---

# 1. Purpose

The Expenses Module manages internal expense claims submitted by employees for reimbursement, review, approval, and payment tracking.

The module exists to answer questions like:

```txt
Who submitted an expense claim?
What was the expense for?
When was it incurred?
How much is being claimed?
Who approved or rejected it?
Has it been reimbursed?
```

The Expenses Module should help Philippine SMEs replace manual reimbursement tracking through spreadsheets, chat messages, paper receipts, and scattered approvals.

It is not an accounting system. It is not payroll. It is not a payment processor. It is not a tax-compliance engine. It is a controlled internal expense-claim workflow module.

---

# 2. Core Rule

```txt
Employee = shared Business Object.
Expenses = reimbursement workflow around Employee expense claims.
```

Expenses must not create its own employee identity table.

Forbidden examples:

```txt
ExpenseEmployee
ReimbursementEmployee
ClaimsEmployee
ExpenseUser
```

The claimant, approver, payer, or reviewer should reference the shared Employee or User identity as appropriate.

---

# 3. Strategic Role in OneDayOS

Expenses is an important future module because many SMEs need controlled reimbursement workflows, but it also introduces several risks:

```txt
money fields
approval logic
receipt files
sensitive spending data
export risk
finance workflow expectations
```

Therefore, Expenses must stay narrow in MVP.

It should prove that OneDayOS can model a real approval-like workflow without prematurely building:

```txt
Platform Approval Workflow Service
Attachment Service
Notification Service
Accounting integration
Payroll integration
Payment automation
AI receipt processing
```

---

# 4. Non-Goals for MVP

The Expenses MVP must not include:

```txt
full accounting system
chart of accounts
general ledger
accounts payable
payroll reimbursement integration
bank payment integration
GCash/Maya/payment gateway integration
BIR tax compliance automation
VAT computation engine
withholding tax engine
OCR receipt scanning
AI receipt extraction
receipt photo/file uploads by default
Platform Attachment Service
Platform Approval Workflow Service
Platform Notification Service
Platform Activity Feed
Platform Comments Service
budget control engine
corporate card reconciliation
cash advance liquidation
multi-currency accounting
per-diem rules
mileage reimbursement
travel management
supplier bill management
purchase order matching
```

Some of these may become future features, but they are not part of the first Expenses module specification.

---

# 5. Business Objects Used

The Expenses Module uses these shared objects and platform primitives:

| Object / Primitive | Layer | Usage |
|---|---|---|
| `Employee` | Business Objects | Claimant, optional approver identity, optional payer identity |
| `User` | Kernel | Authenticated platform actor |
| `Organization` | Kernel | Tenant boundary |
| `Branch` | Kernel org structure | Optional claim classification/reporting |
| `Department` | Kernel org structure | Optional claim classification/reporting |
| `Supplier` | Business Objects | Optional future vendor linkage; not required in MVP |
| `Setting` | Kernel | Module settings such as default currency |
| `OrgModule` | Kernel | Enables or disables Expenses per organization |

## 5.1 Employee Usage

The claimant should be an Employee.

```txt
ExpenseClaim.employeeId → Employee.id
```

A User may be linked to an Employee, but User and Employee are not the same concept.

The current authenticated user may submit a claim only if the platform can resolve the employee identity allowed by the workflow.

## 5.2 Supplier Usage

Supplier linkage is optional in MVP.

Many employee expenses are paid to vendors that the company does not want to maintain as official suppliers.

Therefore, an expense line may have:

```txt
merchantName String?
supplierId String? // optional, future or advanced use
```

The module must not force every restaurant, gas station, parking provider, or small merchant to become a Supplier Business Object.

## 5.3 Branch and Department Usage

Branch and Department are Kernel org-structure primitives, not Business Objects.

Expenses may optionally store branch/department context for reporting or approval routing later, but approval routing by branch/department is deferred.

---

# 6. Module-Owned Entities

The Expenses Module owns the following domain entities:

```txt
ExpenseCategory
ExpenseClaim
ExpenseLine
ExpenseApprovalAction
ExpensePaymentMarker
```

The final implementation may collapse `ExpenseApprovalAction` and `ExpensePaymentMarker` into history/event records if the platform has not yet created a generic activity/audit service. However, the workflow concepts must remain explicit in the service layer.

---

# 7. Entity Responsibilities

## 7.1 ExpenseCategory

Represents a reusable category for classifying expenses.

Examples:

```txt
Transportation
Meals
Fuel
Office Supplies
Client Meeting
Parking
Communication
```

ExpenseCategory is module-owned because it is specific to expense classification.

It is not a Business Object.

## 7.2 ExpenseClaim

Represents one reimbursement claim submitted by an employee.

Examples:

```txt
January client visit expenses
Fuel reimbursement for delivery route
Office supply reimbursement
```

A claim has one or more lines.

## 7.3 ExpenseLine

Represents one item inside a claim.

Examples:

```txt
Taxi fare — ₱350
Lunch with client — ₱1,200
Printer ink — ₱850
Parking — ₱80
```

ExpenseLine belongs to ExpenseClaim.

## 7.4 ExpenseApprovalAction

Represents a module-local approval or rejection action.

This is not the Platform Approval Workflow Service.

The Expenses MVP may need to record:

```txt
who approved
who rejected
when it happened
optional reason/comment
```

## 7.5 ExpensePaymentMarker

Represents that a claim has been marked as reimbursed or paid.

This is not a real payment transaction.

It does not move money.

It does not integrate with accounting.

It simply records that finance/admin marked the claim as paid.

---

# 8. Recommended Prisma Model Shape

This is a conceptual schema. Claude must adapt it to the current generated Prisma conventions when implementation begins.

```prisma
model ExpenseCategory {
  id          String    @id @default(cuid())
  orgId       String
  code        String?
  name        String
  description String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org   Organization @relation(fields: [orgId], references: [id])
  lines ExpenseLine[]

  @@unique([orgId, name])
  @@unique([id, orgId])
  @@index([orgId, deletedAt])
  @@map("expense_categories")
}

model ExpenseClaim {
  id             String    @id @default(cuid())
  orgId          String
  claimNo        String
  employeeId     String
  title          String
  description    String?
  status         String    @default("draft")
  currency       String    @default("PHP")
  totalAmount    Decimal   @db.Decimal(12, 2)
  submittedAt    DateTime?
  approvedAt     DateTime?
  approvedById   String?
  rejectedAt     DateTime?
  rejectedById   String?
  rejectionReason String?
  cancelledAt    DateTime?
  cancelledById  String?
  paidAt         DateTime?
  paidById       String?
  paymentNote    String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?
  deletedBy      String?

  org      Organization @relation(fields: [orgId], references: [id])
  employee Employee     @relation(fields: [employeeId], references: [id])
  lines    ExpenseLine[]

  @@unique([orgId, claimNo])
  @@unique([id, orgId])
  @@index([orgId, employeeId])
  @@index([orgId, status])
  @@index([orgId, deletedAt])
  @@map("expense_claims")
}

model ExpenseLine {
  id           String    @id @default(cuid())
  orgId        String
  claimId      String
  categoryId   String?
  expenseDate  DateTime
  description  String
  merchantName String?
  supplierId   String?
  amount       Decimal   @db.Decimal(12, 2)
  receiptNo    String?
  notes        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?
  deletedBy    String?

  org      Organization     @relation(fields: [orgId], references: [id])
  claim    ExpenseClaim     @relation(fields: [claimId], references: [id])
  category ExpenseCategory? @relation(fields: [categoryId], references: [id])
  supplier Supplier?        @relation(fields: [supplierId], references: [id])

  @@unique([id, orgId])
  @@index([orgId, claimId])
  @@index([orgId, categoryId])
  @@index([orgId, supplierId])
  @@index([orgId, deletedAt])
  @@map("expense_lines")
}
```

## 8.1 Money Field Rule

Expense amounts must use Decimal-compatible values.

Do not use JavaScript floating-point arithmetic for money.

Forbidden:

```ts
const total = lines.reduce((sum, line) => sum + line.amount, 0)
```

Required:

```txt
Use Prisma Decimal / Decimal.js-compatible arithmetic.
Store amounts as Decimal in PostgreSQL.
Serialize API responses safely as strings or controlled decimal values.
```

## 8.2 Claim Number Rule

`claimNo` must be unique per organization.

Example format:

```txt
EXP-2026-000001
EXP-2026-000002
```

For MVP, the sequence may be generated by service logic inside a transaction.

Do not allow the client to provide the authoritative claim number unless explicitly supported by module settings.

---

# 9. Status Model

Recommended claim statuses:

```txt
draft
submitted
approved
rejected
cancelled
paid
```

## 9.1 Status Transition Rules

| From | To | Actor | Notes |
|---|---|---|---|
| `draft` | `submitted` | claimant / authorized user | Requires at least one valid line |
| `draft` | `cancelled` | claimant / authorized user | Optional |
| `submitted` | `approved` | approver | Module-local approval |
| `submitted` | `rejected` | approver | Requires reason recommended |
| `submitted` | `cancelled` | claimant/admin | Optional, based on settings |
| `approved` | `paid` | finance/admin | Payment marker only |
| `rejected` | `draft` | deferred | Revision workflow deferred |
| `paid` | any previous state | forbidden | Paid is final in MVP |

## 9.2 Delete vs Cancel Rule

Cancellation is business state.

Deletion is record lifecycle.

```txt
Draft claim created by mistake → may be soft-deleted.
Submitted claim no longer valid → cancel.
Approved claim should not be deleted casually.
Paid claim should not be deleted through normal UI.
```

---

# 10. Permissions

Expenses permissions use the `expenses` module namespace.

Business Object permissions remain under `objects.*`.

## 10.1 Recommended Permissions

| Permission | Purpose |
|---|---|
| `expenses.expense_claim.read` | Read all visible expense claims |
| `expenses.own_expense_claim.read` | Read own claims only |
| `expenses.expense_claim.create` | Create claim for employees allowed by role |
| `expenses.own_expense_claim.create` | Create own claim |
| `expenses.expense_claim.update` | Update editable claims |
| `expenses.own_expense_claim.update` | Update own draft claims |
| `expenses.expense_claim.delete` | Soft-delete allowed claims |
| `expenses.own_expense_claim.delete` | Soft-delete own draft claims |
| `expenses.expense_claim.submit` | Submit claim |
| `expenses.own_expense_claim.submit` | Submit own draft claim |
| `expenses.expense_claim.approve` | Approve submitted claims |
| `expenses.expense_claim.reject` | Reject submitted claims |
| `expenses.expense_claim.cancel` | Cancel claims |
| `expenses.expense_claim.mark_paid` | Mark approved claims as paid |
| `expenses.expense_claim.restore` | Restore soft-deleted claims |
| `expenses.expense_claim.export` | Export claim data |
| `expenses.expense_category.read` | Read categories |
| `expenses.expense_category.create` | Create categories |
| `expenses.expense_category.update` | Update categories |
| `expenses.expense_category.delete` | Soft-delete categories |
| `expenses.settings.read` | Read Expenses settings |
| `expenses.settings.update` | Update Expenses settings |

## 10.2 Permission Rules

Read permission is not export permission.

Create permission is not import permission.

Approve permission does not automatically allow mark-paid.

Admin wildcard permission does not bypass tenant isolation or module enablement.

UI permission checks are for usability only. API and service checks are mandatory.

---

# 11. Roles and Default Access Pattern

The module should support these practical role patterns:

| Role Pattern | Typical Access |
|---|---|
| Staff | Create, read, update, submit own draft claims |
| Manager / Approver | Read submitted claims, approve/reject claims |
| Finance | Read claims, mark approved claims as paid, export if granted |
| Admin | Full module permissions inside verified organization |

Do not hard-code these roles.

Seed or provisioning may create suggested roles, but permissions must remain configurable through the platform role system.

---

# 12. APIs

All Expenses APIs must live under:

```txt
/api/orgs/[orgSlug]/expenses/...
```

Forbidden:

```txt
/api/expenses?orgId=...
/api/expenses/[id]
/api/[module]?orgId=...
```

## 12.1 API Route List

Recommended MVP routes:

```txt
GET    /api/orgs/[orgSlug]/expenses/claims
POST   /api/orgs/[orgSlug]/expenses/claims
GET    /api/orgs/[orgSlug]/expenses/claims/[id]
PATCH  /api/orgs/[orgSlug]/expenses/claims/[id]
DELETE /api/orgs/[orgSlug]/expenses/claims/[id]
POST   /api/orgs/[orgSlug]/expenses/claims/[id]/submit
POST   /api/orgs/[orgSlug]/expenses/claims/[id]/approve
POST   /api/orgs/[orgSlug]/expenses/claims/[id]/reject
POST   /api/orgs/[orgSlug]/expenses/claims/[id]/cancel
POST   /api/orgs/[orgSlug]/expenses/claims/[id]/mark-paid
GET    /api/orgs/[orgSlug]/expenses/categories
POST   /api/orgs/[orgSlug]/expenses/categories
PATCH  /api/orgs/[orgSlug]/expenses/categories/[id]
DELETE /api/orgs/[orgSlug]/expenses/categories/[id]
GET    /api/orgs/[orgSlug]/expenses/settings
PATCH  /api/orgs/[orgSlug]/expenses/settings
```

## 12.2 API Requirements

Every protected API must:

```txt
create verified PlatformContext
verify tenant membership
verify Expenses module is enabled
validate route params
validate query params
validate request body with Zod
reject client-supplied orgId
enforce permission before service call
call service with PlatformContext
return { data, error, meta? } JSON only
never redirect
never return HTML auth responses
```

---

# 13. Service Layer

Expenses services receive verified `PlatformContext`.

Forbidden:

```ts
ExpensesService.list(orgId)
ExpensesService.create(orgId, input)
sdk.getDb(orgId)
```

Required:

```ts
ExpensesService.listClaims(ctx, input)
ExpensesService.createClaim(ctx, input)
sdk.getDb(ctx)
```

## 13.1 Recommended Service Methods

```ts
ExpensesService.listClaims(ctx, query)
ExpensesService.getClaim(ctx, claimId)
ExpensesService.createDraftClaim(ctx, input)
ExpensesService.updateDraftClaim(ctx, claimId, input)
ExpensesService.deleteDraftClaim(ctx, claimId)
ExpensesService.submitClaim(ctx, claimId)
ExpensesService.approveClaim(ctx, claimId, input)
ExpensesService.rejectClaim(ctx, claimId, input)
ExpensesService.cancelClaim(ctx, claimId, input)
ExpensesService.markClaimPaid(ctx, claimId, input)
ExpensesService.restoreClaim(ctx, claimId)

ExpensesService.listCategories(ctx)
ExpensesService.createCategory(ctx, input)
ExpensesService.updateCategory(ctx, categoryId, input)
ExpensesService.deleteCategory(ctx, categoryId)
```

## 13.2 Transaction Rule

Operations that change claim status and related data must be transactional.

Examples:

```txt
submit claim
approve claim
reject claim
mark paid
soft delete claim with lines
restore claim with lines
```

---

# 14. Validation

All request bodies must use Zod schemas.

Schemas must use strict objects by default.

Client-supplied `orgId` must be rejected.

## 14.1 Claim Create Schema Shape

```ts
const createExpenseClaimSchema = z.strictObject({
  employeeId: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  currency: z.string().length(3).default('PHP'),
  lines: z.array(createExpenseLineSchema).min(1).optional(),
})
```

## 14.2 Line Schema Shape

```ts
const createExpenseLineSchema = z.strictObject({
  categoryId: z.string().optional(),
  expenseDate: z.iso.date(),
  description: z.string().min(1).max(200),
  merchantName: z.string().max(120).optional(),
  supplierId: z.string().optional(),
  amount: decimalStringSchema,
  receiptNo: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
})
```

## 14.3 Relation Validation

The service must verify that referenced records belong to the same organization:

```txt
employeeId
categoryId
supplierId
branchId
departmentId
```

Do not trust IDs just because they are valid strings.

---

# 15. Events

Expenses events use the `expenses` namespace.

Employee and Supplier events remain in the `objects` namespace.

## 15.1 Required Events

```txt
expenses.expense_claim.created
expenses.expense_claim.updated
expenses.expense_claim.submitted
expenses.expense_claim.approved
expenses.expense_claim.rejected
expenses.expense_claim.cancelled
expenses.expense_claim.marked_paid
expenses.expense_claim.deleted
expenses.expense_claim.restored
expenses.expense_category.created
expenses.expense_category.updated
expenses.expense_category.deleted
expenses.expense_category.restored
```

## 15.2 Event Payload Rules

Event payloads must:

```txt
include stable IDs
include changedFields for update events
avoid full Prisma records
avoid sensitive data
avoid full rejection notes if not needed
avoid full payment notes if not needed
not include orgId in payload
be emitted through @/sdk/server using PlatformContext
```

Example:

```ts
await sdk.events.emit(ctx, 'expenses.expense_claim.approved', {
  claimId: claim.id,
  employeeId: claim.employeeId,
  approvedById: ctx.user.id,
  amount: claim.totalAmount.toString(),
  currency: claim.currency,
})
```

---

# 16. Pages

Expenses pages live under:

```txt
/[orgSlug]/expenses/...
```

Recommended MVP pages:

```txt
/[orgSlug]/expenses
/[orgSlug]/expenses/claims
/[orgSlug]/expenses/claims/new
/[orgSlug]/expenses/claims/[id]
/[orgSlug]/expenses/categories
/[orgSlug]/expenses/settings
```

## 16.1 Dashboard

The Expenses dashboard may show:

```txt
pending claims count
submitted claims awaiting approval
approved unpaid total
paid this month total
my open claims
```

These are module-local dashboard cards, not the future Reporting Service.

## 16.2 Claims List

The claims table should show:

```txt
claim number
title
employee
status
total amount
submitted date
approved date
paid date
row actions based on permission
```

## 16.3 Claim Detail

Claim detail should show:

```txt
claim header
employee
status
total
lines
approval/rejection/payment metadata
actions available for current state and permission
```

## 16.4 Claim Form

The claim form should support:

```txt
title
description
employee selection when authorized
line items
category
expense date
merchant name
amount
receipt number
notes
```

The form must not include hidden `orgId`.

---

# 17. Tables

Expenses tables should follow the platform DataTable standards.

Required table states:

```txt
loading
empty
filtered empty
permission denied
error
optimistic update / rollback where applicable
```

Tables must not expose export actions unless the user has export permission.

---

# 18. Forms

Forms should be hand-coded for MVP.

Do not use the Dynamic Form Engine yet.

Form rules:

```txt
client validation improves UX
server validation is authoritative
unknown keys are rejected
orgId is never submitted
relation options are tenant-scoped
relation IDs are revalidated server-side
non-obvious fields have tooltips
save/submit actions are clearly distinguished
```

---

# 19. Settings

Recommended Expenses settings:

```txt
defaultCurrency: "PHP"
allowStaffCancellationBeforeApproval: true
requireCategory: true
requireReceiptNo: false
requireApprovalBeforePayment: true
allowClaimantEditAfterSubmit: false
```

Settings must be stored through the Kernel settings/configuration pattern.

Settings are not secrets.

Settings must not contain provider credentials, service keys, or payment credentials.

---

# 20. Receipts and Attachments

Receipt file uploads are excluded from the first Expenses MVP.

Reason:

```txt
file storage introduces cost, access control, backup/restore, signed URLs,
virus scanning considerations, storage quotas, and Attachment Service pressure.
```

The MVP may support:

```txt
receiptNo
merchantName
notes
```

If a paying client truly requires receipt images before the Platform Attachment Service exists, there are two acceptable options:

```txt
1. Reject/defer receipt uploads from one-day scope.
2. Founder-approved module-local receipt file handling with evidence log.
```

If module-local file handling is approved, it must not become a hidden generic Attachment Service.

It must be documented as evidence for future Attachment Service promotion.

---

# 21. Approval Workflow

Expenses approval is module-local for MVP.

Do not implement Platform Approval Workflow Service.

The module-local approval flow is:

```txt
draft → submitted → approved/rejected → paid
```

This is intentionally simple.

The future Platform Approval Workflow Service may be justified only after independent approval patterns repeat across modules such as:

```txt
Leave
Purchasing
Expenses
```

Until then, Expenses owns its own approval status transitions.

---

# 22. Notifications

No Platform Notification Service in MVP.

The module may emit events like:

```txt
expenses.expense_claim.submitted
expenses.expense_claim.approved
expenses.expense_claim.rejected
```

But it must not implement generic notifications, email, SMS, push, or notification preferences.

If a client asks:

```txt
Can managers be notified when an expense is submitted?
```

The answer for MVP is:

```txt
Not in the first version unless explicitly scoped.
The module emits the event so notification support can be added later.
```

---

# 23. Reporting and Export

Expenses may include simple module-local list filters and summary cards.

Do not implement the Platform Reporting Service.

Do not implement scheduled reports.

Do not implement arbitrary report builder.

CSV export may be added only if explicitly scoped and protected by:

```txt
expenses.expense_claim.export
```

Export must respect:

```txt
tenant isolation
permissions
soft delete
sensitive field restrictions
filters
```

---

# 24. AI Context

Expenses should include static module AI context later.

It should explain:

```txt
what expense claims are
claim lifecycle
what statuses mean
which Business Objects are used
what questions are safe
what actions are unsafe
```

Runtime AI features are deferred.

No AI claim approval.

No AI receipt reading.

No AI export assistant.

No AI SQL querying.

---

# 25. Module Manifest Requirements

The Expenses manifest must declare:

```txt
id: expenses
label: Expenses
version
lifecycle
compatibility
businessObjectsUsed: Employee, optional Supplier
moduleOwnedEntities: ExpenseCategory, ExpenseClaim, ExpenseLine
permissions
navigation
routes
api routes
events emitted
settings
ai context reference
```

The manifest must not self-register as a side effect.

The manifest must not import server-only code.

The manifest must not contain seed functions directly.

---

# 26. Navigation

Recommended sidebar navigation:

```txt
Expenses
  Overview
  Claims
  Categories
  Settings
```

Navigation visibility requires:

```txt
authenticated user
verified tenant membership
Expenses module enabled for organization
required permission
```

Hidden navigation is not security.

Routes, APIs, and services still enforce authorization.

---

# 27. Module Dependencies

Expenses should start with no required module dependencies.

```txt
dependencies: []
```

It uses shared Business Objects, but Business Object usage is not a module dependency.

Expenses may optionally integrate with future modules later:

```txt
Accounting
Payroll
Projects
Attachments
Notifications
Approvals
Reporting
```

But none of those are MVP dependencies.

---

# 28. Tenant Isolation Rules

Every Expenses table must include `orgId`.

Every Expenses query must be scoped by `ctx.org.id`.

Every service method must receive `PlatformContext`.

Every API must derive context from:

```txt
session
+ platform User
+ orgSlug
+ user.orgId === org.id
+ Expenses module enabled
```

Client-supplied `orgId` must be rejected.

Wrong-org access must fail safely.

Tenant-sensitive tests must use at least two organizations.

---

# 29. Soft Delete Rules

Soft delete is required for:

```txt
ExpenseCategory
ExpenseClaim
ExpenseLine
```

Draft claims may be soft-deleted.

Submitted, approved, and paid claims should normally be cancelled, rejected, or marked paid rather than deleted.

If deletion is allowed for non-draft claims, it must require elevated permission and preserve event/history integrity.

Soft-deleted records must not appear in normal lists, exports, AI context, or reports.

---

# 30. Business Rules

## 30.1 Claim Must Have Lines Before Submission

A claim cannot be submitted without at least one non-deleted line.

## 30.2 Claim Total Is Derived

`ExpenseClaim.totalAmount` must be derived from lines, not trusted from client input.

The client may display a computed total, but the service computes the authoritative total.

## 30.3 Submitted Claims Are Locked

After submission, the claimant should not edit lines unless module settings explicitly allow revision.

## 30.4 Paid Claims Are Final

Paid claims should not be editable in MVP.

Corrections require a future adjustment/reversal design.

## 30.5 Approval Cannot Be Self-Approval by Default

By default, the claimant should not approve their own claim.

If a tiny SME wants owner self-approval, that should be a setting or admin behavior, not a default loophole.

## 30.6 Rejection Reason Is Recommended

Rejected claims should include a reason.

The reason may be optional technically, but UI should encourage it.

---

# 31. Tests Required

The Expenses Module is not ready unless these tests exist.

## 31.1 Service Tests

```txt
create draft claim with valid employee
reject client-supplied orgId
reject employee from another organization
compute total from lines
submit claim with lines
reject submission with no lines
approve submitted claim
reject submitted claim
mark approved claim as paid
prevent paid claim mutation
soft-delete draft claim
prevent normal list from showing soft-deleted claims
emit events after successful mutations
not emit events after failed mutations
```

## 31.2 API Tests

Each protected API must test:

```txt
401 unauthenticated JSON
403 missing permission JSON
safe 404 wrong organization
404 module disabled
400 validation error
400 client-supplied orgId rejected
success path
no redirects
no HTML auth response
```

## 31.3 Tenant Isolation Tests

Use at least two organizations.

```txt
Org A user cannot list Org B claims
Org A user cannot read Org B claim by ID
Org A user cannot submit Org B claim
Org A user cannot approve Org B claim
Org A user cannot mark Org B claim paid
Org A user cannot reference Org B employee/category/supplier
```

## 31.4 Permission Tests

Use non-admin users.

```txt
staff can create own draft claim if granted
staff cannot approve own claim by default
approver can approve submitted claim
finance can mark paid only if granted
read does not imply export
create does not imply import
admin wildcard works only inside own organization and enabled module
```

## 31.5 Architecture Tests

```txt
no imports from @/kernel/* inside module
no raw Prisma inside module
no imports from other modules
no sdk.getDb(orgId)
no client-supplied orgId schemas
no /api/expenses?orgId routes
no duplicate Employee table
no generic Attachment Service implementation
no Platform Approval Workflow implementation
no FastAPI/Python backend files
```

---

# 32. Seed Data

Module seed/provisioning may create default categories:

```txt
Transportation
Meals
Fuel
Office Supplies
Communication
Client Meeting
Parking
Others
```

Seed must be idempotent.

Seed must be organization-scoped through verified provisioning context.

Seed must not overwrite customized client categories.

---

# 33. Implementation Plan for Claude

Claude should implement Expenses only after the foundation exists.

Required foundation helpers:

```txt
PlatformContext
sdk.auth.requireApiModuleContext
sdk.permissions.require
sdk.getDb(ctx)
sdk.events.emit(ctx, ...)
Kernel API response helpers
Zod validation conventions
module manifest loader
module permission system
architecture checks
```

If those helpers do not exist, Claude must stop and report the missing foundation dependency instead of inventing a workaround.

## 33.1 Suggested Implementation Order

```txt
1. Write Prisma models and migration.
2. Add module manifest, permissions, events, schemas, types, settings, navigation, AI context, docs.
3. Implement service layer with tests first.
4. Implement API routes with failure-path tests.
5. Implement pages and UI components.
6. Add module seed/provisioning hook for default categories.
7. Add architecture checks if missing.
8. Run full verification.
```

---

# 34. Claude Implementation Prompt

```md
You are implementing the OneDayOS Expenses Module.

Authoritative document:
docs/engineering-manual/17-module-specifications/05-expenses-module.md

Required architecture:
- Use verified PlatformContext.
- Use sdk.getDb(ctx), never sdk.getDb(orgId).
- Use /api/orgs/[orgSlug]/expenses/... API routes.
- Reject client-supplied orgId.
- Enforce tenant membership, module enablement, and permissions.
- Services must enforce permissions during MVP.
- Do not duplicate Employee, Supplier, User, Branch, Department, or Organization.
- Do not implement Platform Approval Workflow Service.
- Do not implement Attachment Service.
- Do not implement Notification Service.
- Do not implement Reporting Service.
- Do not add FastAPI, Python, Pydantic, SQLAlchemy, or Alembic.
- Add two-org tenant-isolation tests.
- Add permission-denial tests.
- Add API failure-path tests.
- Add architecture checks for forbidden patterns.

Task:
Implement only the MVP Expenses Module scope defined in this document.
Stop and report if required foundation helpers are missing.
```

---

# 35. Acceptance Criteria

The Expenses Module is acceptable only when:

```txt
[ ] Expenses manifest is valid and pure metadata.
[ ] Expenses module can be enabled per organization through OrgModule.
[ ] Expenses navigation appears only when module is enabled and user has permission.
[ ] ExpenseCategory, ExpenseClaim, and ExpenseLine models are tenant-scoped.
[ ] Employee is referenced as shared Business Object, not duplicated.
[ ] Supplier linkage is optional and tenant-safe if implemented.
[ ] Services receive PlatformContext only.
[ ] APIs live under /api/orgs/[orgSlug]/expenses/...
[ ] Client-supplied orgId is rejected.
[ ] Claim total is computed server-side from lines.
[ ] Draft → submitted → approved/rejected → paid workflow works.
[ ] Approval is module-local only.
[ ] Paid claims are protected from normal mutation.
[ ] Soft delete works and normal reads exclude deleted records.
[ ] Events emit after successful mutations.
[ ] Events do not emit after failed mutations.
[ ] Event payloads are minimal and do not include full records or orgId.
[ ] API tests cover 401, 403, safe 404, module disabled, validation, client-supplied orgId, and success.
[ ] Tenant-isolation tests use at least two organizations.
[ ] Permission-denial tests use non-admin users.
[ ] Architecture checks block forbidden imports and unsafe patterns.
[ ] No Platform Services are implemented by accident.
[ ] No FastAPI/Python backend is added.
[ ] npm run check:all passes.
```

---

# 36. Final Architectural Rule

```txt
Expenses should prove OneDayOS can support money-related internal workflows
without becoming accounting, payroll, approvals, attachments, notifications,
or custom client software.
```

The Expenses Module should be useful, narrow, secure, tenant-safe, and reusable.

It should make future modules easier to build, not create a finance monolith inside OneDayOS.
