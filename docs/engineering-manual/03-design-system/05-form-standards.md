# OneDayOS Engineering Manual — Form Standards

**Document ID:** `03-design-system/05-form-standards.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Platform UI Build`  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `03-design-system/00-design-vision.md`
- `03-design-system/01-brand-system.md`
- `03-design-system/02-layout-system.md`
- `03-design-system/03-component-standards.md`
- `03-design-system/04-table-standards.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/05-data-validation-zod.md`
- `11-dynamic-systems/01-dynamic-form-engine.md`

---

# 1. Purpose

This document defines how forms must look, behave, validate, submit, fail, recover, and integrate with OneDayOS security boundaries.

Forms are one of the most important surfaces in OneDayOS because they are where users create and change business data.

A bad form makes OneDayOS feel like a generic admin template.

A dangerous form can break tenant isolation, permissions, validation, data quality, and trust.

The goal of this document is to ensure every form in OneDayOS feels:

```txt
clear
fast
calm
secure
consistent
businesslike
premium
low-friction
```

Forms should help users complete business work confidently.

Forms should not feel like raw database rows exposed to non-technical users.

---

# 2. Core Principle

```txt
A OneDayOS form is not a CRUD dump.
It is a guided business interaction.
```

A form is not complete because it has inputs and a submit button.

A form is complete when:

```txt
[ ] the user understands what they are doing
[ ] required fields are obvious
[ ] validation is clear
[ ] errors are recoverable
[ ] tenant identity is server-derived
[ ] permissions are enforced outside the UI
[ ] submission feels fast
[ ] failure rolls back safely
[ ] data is validated on the server
[ ] no hidden security assumptions exist in the client
```

---

# 3. Non-Negotiable Form Rules

## 3.1 Forms must never submit `orgId`

Forbidden:

```tsx
<input type="hidden" name="orgId" value={orgId} />
```

Forbidden:

```ts
body: JSON.stringify({ ...formData, orgId })
```

Forbidden:

```ts
const schema = z.object({
  name: z.string(),
  orgId: z.string(),
})
```

Correct:

```txt
Tenant identity comes from:
authenticated session
+ route orgSlug
+ verified PlatformContext
```

The server derives tenant context.

The client submits only business input.

---

## 3.2 Client validation is UX; server validation is security

Client-side validation helps the user.

Server-side validation protects the platform.

Every form submission must be validated server-side using approved Zod schemas.

Client validation must never be treated as sufficient.

---

## 3.3 Forms must not enforce security by hiding fields or buttons

Permission-aware UI is good usability.

It is not security.

A user without permission may not see a submit button, but the API and service must still reject the operation.

Correct enforcement stack:

```txt
UI visibility          → convenience
API permission check   → required
Service permission     → required during MVP
Database tenant scope  → required
```

---

## 3.4 Forms submit to tenant-scoped APIs

Business Object forms submit to:

```txt
/api/orgs/[orgSlug]/objects/[object]
```

Module forms submit to:

```txt
/api/orgs/[orgSlug]/[moduleId]/[resource]
```

Examples:

```txt
/api/orgs/acme-corp/objects/products
/api/orgs/acme-corp/objects/employees
/api/orgs/acme-corp/inventory/stock-adjustments
/api/orgs/acme-corp/leave/leave-requests
```

Forbidden:

```txt
/api/products?orgId=...
/api/inventory?orgId=...
/api/[module]
```

---

## 3.5 Forms must use approved platform components

Forms must use OneDayOS form components built on top of:

```txt
shadcn/ui
React Hook Form
Zod
Motion for React where appropriate
sonner for toasts
```

Modules must not invent their own form system.

---

# 4. Form Types

OneDayOS supports several form patterns.

Each pattern has a different UX and implementation contract.

---

## 4.1 Create Form

Used when creating a new record.

Examples:

```txt
Create Product
Create Customer
Create Employee
Create Stock Adjustment
Create Leave Request
Create Expense Claim
```

Create forms should:

```txt
[ ] have a clear title
[ ] explain what will be created
[ ] focus the first meaningful field
[ ] submit quickly
[ ] show success toast
[ ] redirect to list or detail depending on context
[ ] never submit orgId
[ ] validate server-side
```

Default post-success behavior:

```txt
Simple Business Object create → return to list or detail
Workflow create → detail page or workflow status page
Settings create → remain in context
```

---

## 4.2 Edit Form

Used when updating an existing record.

Edit forms should:

```txt
[ ] show current values
[ ] show unsaved-change state
[ ] preserve user input on validation error
[ ] use optimistic UI only when rollback is safe
[ ] clearly distinguish Save from destructive actions
[ ] avoid accidental destructive edits
```

Edit forms must not silently overwrite server state if conflict handling is required.

Conflict handling may be simple in MVP, but stale updates should not become hidden data corruption.

---

## 4.3 Workflow Action Form

Used for business actions, not normal CRUD.

Examples:

```txt
Approve Leave Request
Reject Expense Claim
Submit Purchase Order
Void Goods Receipt
Check Out Visitor
Assign Incident
Resolve Incident
Return Asset
```

Workflow action forms are not generic edit forms.

They should be short, contextual, and explicit.

They must usually appear in:

```txt
dialog
sheet
detail page action panel
inline action confirmation
```

They should explain consequence.

Example:

```txt
Reject leave request
Reason is required. The employee will see this reason.
```

Workflow action forms must call specific service methods.

Forbidden:

```txt
Update status directly from a generic edit form.
```

Correct:

```ts
LeaveService.rejectRequest(ctx, requestId, input)
```

---

## 4.4 Settings Form

Used for org/module configuration.

Examples:

```txt
Organization profile
Module settings
Inventory defaults
Leave policy settings
Role configuration
Client branding
```

Settings forms should:

```txt
[ ] be grouped into clear sections
[ ] explain consequences
[ ] avoid too many fields on one screen
[ ] show save status
[ ] support cancel/reset when useful
[ ] validate JSON/settings values with Zod
```

Settings must not become a secret store.

Settings must not store infrastructure credentials during MVP.

---

## 4.5 Inline Form

Used for small edits inside an existing page.

Examples:

```txt
rename view
quick edit category name
add small note
change status label
```

Inline forms are allowed only when the action is small and low-risk.

They should not be used for:

```txt
large record creation
business workflows
sensitive fields
multi-step operations
destructive changes
```

---

## 4.6 Multi-Step Form

Deferred for MVP unless explicitly approved.

Multi-step forms add complexity:

```txt
draft state
partial validation
navigation
resume behavior
error recovery
```

Use only when a single form would be genuinely overwhelming.

Do not create multi-step flows just to look enterprise.

---

## 4.7 Bulk Forms

Bulk edit, bulk import, and bulk action forms are deferred unless explicitly justified.

Bulk operations are high risk because they can affect many records across one tenant.

Bulk forms require:

```txt
explicit permission
preview
confirmation
clear count of affected records
tenant-safe filters
rollback/recovery plan
```

---

# 5. Standard Form Architecture

## 5.1 Recommended create/edit architecture

For tenant-scoped forms, use this structure:

```txt
Server page
  ↓
creates verified page context
  ↓
loads allowed relation options
  ↓
renders client form component
  ↓
client submits business input only
  ↓
tenant-scoped API validates body
  ↓
API creates PlatformContext
  ↓
API checks permission
  ↓
service re-checks permission during MVP
  ↓
service mutates DB through sdk.getDb(ctx)
  ↓
service emits event
  ↓
API returns { data, error, meta? }
```

---

## 5.2 Server page responsibilities

Server pages may:

```txt
[ ] validate orgSlug through platform context
[ ] load current record for edit forms
[ ] load tenant-safe relation options
[ ] check page-level permission for initial rendering
[ ] pass safe initial data into client components
```

Server pages must not:

```txt
[ ] accept client-supplied orgId
[ ] leak records across organizations
[ ] pass secrets into client components
[ ] pass full unnecessary Prisma records into client components
```

---

## 5.3 Client form responsibilities

Client form components may:

```txt
[ ] manage input state
[ ] display validation errors
[ ] submit to APIs
[ ] show optimistic local feedback
[ ] show toasts
[ ] handle dirty state
[ ] render tooltips/help text
[ ] animate transitions subtly
```

Client form components must not:

```txt
[ ] import @/sdk/server
[ ] import @/kernel/*
[ ] import raw Prisma
[ ] import server env helpers
[ ] include hidden orgId fields
[ ] trust relation IDs without server validation
[ ] decide final authorization
```

---

## 5.4 API responsibilities

API routes must:

```txt
[ ] return JSON only
[ ] never redirect
[ ] validate route params
[ ] validate query params
[ ] validate request body with Zod
[ ] reject client-supplied orgId
[ ] create verified PlatformContext
[ ] enforce permission
[ ] call service with PlatformContext
[ ] map errors to { data, error, meta? }
```

---

## 5.5 Service responsibilities

Services must:

```txt
[ ] receive PlatformContext
[ ] enforce permission during MVP
[ ] use sdk.getDb(ctx)
[ ] validate business rules
[ ] perform tenant-scoped queries
[ ] perform transactions when needed
[ ] emit events after successful mutations
[ ] avoid full-record event payloads
```

---

# 6. Visual Form Standards

## 6.1 Form width

Use different widths based on complexity.

| Form Type | Recommended Width |
|---|---:|
| Simple create form | `max-w-xl` |
| Normal business form | `max-w-2xl` |
| Settings form | `max-w-3xl` |
| Complex workflow page | `max-w-4xl` |
| Dialog form | `sm:max-w-lg` |
| Sheet form | `w-full sm:max-w-xl` |

Do not stretch short forms full-width across the page.

Wide empty forms feel cheap and generic.

---

## 6.2 Form page structure

Standard form page:

```txt
Page header
  title
  description
  optional back link

Form card or section stack
  grouped fields
  help text
  validation

Action bar
  cancel
  save / submit
```

Example layout:

```tsx
<div className="max-w-2xl space-y-6">
  <PageHeader
    title="New product"
    description="Create a shared product record that modules can reference."
  />

  <Card>
    <CardContent className="space-y-5 pt-6">
      {/* fields */}
    </CardContent>
  </Card>
</div>
```

---

## 6.3 Section grouping

Long forms must be grouped.

Good groups:

```txt
Basic information
Contact details
Assignment
Settings
Review
```

Bad groups:

```txt
General
Other
Miscellaneous
Extra
```

If a group is called “Miscellaneous,” the form is not understood well enough.

---

## 6.4 Label standards

Labels must be:

```txt
short
clear
business-friendly
sentence case
specific
```

Good:

```txt
Employee number
Product code
Host employee
Visit purpose
Requested dates
Rejection reason
```

Bad:

```txt
EmpNo
ProdCd
host_id
purpose_text
Date Range Value
```

Do not expose database names to users.

---

## 6.5 Required field indicator

Required fields should be clear but not visually aggressive.

Preferred:

```txt
Label + subtle required indicator
```

Example:

```tsx
<FormLabel>
  Product name <span className="text-destructive">*</span>
</FormLabel>
```

Do not place a huge red warning at every required field.

---

## 6.6 Help text

Use help text when a field needs clarification.

Good help text:

```txt
Used as the unique item code inside this organization.
```

Bad help text:

```txt
Please input the product code here.
```

Help text must explain meaning, not repeat the label.

---

## 6.7 Tooltips

The original Kernel plan established a tooltip/help rule: non-obvious fields, status badges, action buttons, and metrics should have concise tooltip help where needed.

Tooltips should be:

```txt
short
specific
1–2 sentences maximum
available instantly or near-instantly
```

Use tooltips for:

```txt
field meaning
status meaning
calculation explanation
permission-sensitive actions
unusual business terms
```

Do not use tooltips as documentation dumps.

If a field needs a paragraph-long tooltip, the field or workflow is probably unclear.

---

## 6.8 Placeholder text

Placeholders are examples, not labels.

Good:

```txt
Example: P-0001
Example: Juan Dela Cruz
Example: Office supplies
```

Bad:

```txt
Enter value here
Type something
Name
```

Never rely on placeholder text as the only field label.

---

## 6.9 Field density

OneDayOS should feel compact and professional.

Use enough whitespace to reduce anxiety, but not so much that the product feels like a marketing landing page.

Avoid:

```txt
giant input heights
excessive vertical padding
huge gaps between every field
oversized cards for small forms
```

Preferred:

```txt
calm compact spacing
clear grouping
consistent vertical rhythm
data-dense but readable forms
```

---

# 7. Field Type Standards

## 7.1 Text input

Use for short text.

Examples:

```txt
Product code
Employee number
Category name
Supplier name
```

Text inputs should have:

```txt
label
optional help text
autocomplete where appropriate
validation message
```

---

## 7.2 Textarea

Use for longer human-written text.

Examples:

```txt
Incident description
Rejection reason
Corrective action notes
Expense explanation
```

Textarea should not be used for structured data.

If the user is expected to enter multiple values, the model may be wrong.

---

## 7.3 Number input

Use carefully.

Quantities and money should be validated as Decimal-compatible values server-side.

Do not trust JavaScript floating-point math for money.

For money:

```txt
validate string input
convert to Decimal-compatible server value
compute totals server-side
```

Forbidden:

```ts
const total = Number(amount) * Number(quantity)
```

for critical money calculations.

---

## 7.4 Date input

Date fields must be labeled with business meaning.

Good:

```txt
Hired date
Requested start date
Requested end date
Visit date
Incident date
Purchase order date
```

Bad:

```txt
Date
Start
End
```

Date handling must be consistent with timezone policy.

Do not hide timezone-sensitive behavior in client-only logic.

---

## 7.5 Select

Use selects for small controlled lists.

Good candidates:

```txt
Employment type
Leave type
Incident severity
Asset status
Expense category
```

Selects should not be used for large searchable datasets.

For large datasets, use combobox/searchable relation picker.

---

## 7.6 Relation picker

Relation fields are security-sensitive.

Examples:

```txt
Employee
Customer
Supplier
Product
Warehouse
Branch
Department
```

Relation options must be:

```txt
loaded server-side or through tenant-safe APIs
scoped to verified PlatformContext
permission-aware when needed
revalidated server-side on submit
```

Forbidden:

```txt
client sends arbitrary employeeId and service trusts it
```

Correct:

```txt
client sends employeeId
server verifies employee belongs to ctx.org.id
server verifies user may reference that employee
```

---

## 7.7 Checkbox

Use checkboxes for independent boolean choices.

Examples:

```txt
Active
Requires approval
Allow negative stock
```

Do not use checkboxes for mutually exclusive options.

Use radio/select instead.

---

## 7.8 Radio group

Use radio groups for small mutually exclusive choices.

Examples:

```txt
Full day / Half day
Individual / Company customer
Immediate / Scheduled
```

Avoid radio groups with too many options.

---

## 7.9 File input

File uploads are deferred for the core platform until Attachment Service or explicitly approved module-local file handling exists.

Do not casually add file inputs to forms.

File uploads imply:

```txt
object storage
permissions
signed URLs
file size limits
backup/restore
malware/security policy
retention
privacy
cost controls
```

---

## 7.10 Rich text

Rich text is deferred.

Use plain textarea for MVP unless founder/architect approval is given.

Rich text adds:

```txt
sanitization
XSS risk
rendering complexity
copy/paste formatting issues
AI/context concerns
```

---

# 8. Validation Standards

## 8.1 Zod schemas

Every create/update form must have Zod schemas.

Recommended naming:

```ts
CreateProductSchema
UpdateProductSchema
CreateLeaveRequestSchema
RejectLeaveRequestSchema
```

Schemas should live near the module or Business Object boundary.

Client-safe schemas may be imported by client components.

Server-only validation must live in `.server.ts` files.

---

## 8.2 Strict object schemas

API request body schemas should reject unknown keys.

Use:

```ts
z.strictObject({
  name: z.string().min(1),
})
```

not:

```ts
z.object({
  name: z.string().min(1),
})
```

when accepting API bodies.

This is important because unknown keys may include forbidden fields like `orgId`.

---

## 8.3 Client-supplied `orgId` test

Every generated form/API pair must have a test proving `orgId` is rejected.

Example test intent:

```txt
POST /api/orgs/acme/products with body { name: "X", orgId: "other-org" }
→ 400 TENANT_ID_NOT_ALLOWED
```

---

## 8.4 Field-level errors

Field errors should appear directly under the field.

They should be:

```txt
specific
actionable
plain English
```

Good:

```txt
Product code is required.
Employee number must be unique in this organization.
Requested end date must be after start date.
```

Bad:

```txt
Invalid input.
Error.
Validation failed.
```

---

## 8.5 Form-level errors

Use form-level errors for errors that are not tied to one field.

Examples:

```txt
You do not have permission to create products.
This module is not enabled for your organization.
The record was updated by someone else. Refresh and try again.
```

Do not show raw server errors to users.

---

## 8.6 Business rule errors

Business rule errors should come from services.

Examples:

```txt
Cannot approve your own expense claim.
Cannot return an asset that is not currently assigned.
Cannot check out a visitor who is already checked out.
Cannot delete a warehouse with active stock records.
```

These are not just Zod validation errors.

They are business rules.

---

# 9. Submission Standards

## 9.1 Submit button behavior

Submit buttons must:

```txt
[ ] show pending state
[ ] prevent double-submit
[ ] remain visually stable
[ ] use specific text
```

Good button text:

```txt
Create product
Save changes
Submit request
Approve request
Reject claim
Check out visitor
```

Bad button text:

```txt
Submit
OK
Go
Done
```

Use business verbs.

---

## 9.2 Cancel behavior

Cancel should be predictable.

For create forms:

```txt
Cancel → return to list or previous page
```

For edit forms with unsaved changes:

```txt
Cancel → warn or confirm if data would be lost
```

For dialog forms:

```txt
Cancel → close dialog without mutation
```

---

## 9.3 Optimistic UI

Forms should use optimistic UI where it improves perceived speed and rollback is safe.

Good optimistic candidates:

```txt
simple create row appears in list
simple edit updates visible field
soft delete removes row from list
status change updates badge
```

Bad optimistic candidates:

```txt
complex stock adjustment before transaction succeeds
money approval before permission/business rules pass
multi-record import
workflow transition with complex side effects
```

Optimistic UI must never bypass server authority.

Required behavior:

```txt
optimistic update
API request
success → confirm state
failure → rollback + toast + optionally refresh
```

---

## 9.4 Toasts

Use `sonner` for feedback.

Success toast examples:

```txt
Product created.
Changes saved.
Leave request submitted.
Incident assigned.
```

Error toast examples:

```txt
Could not save changes. Please check the highlighted fields.
You do not have permission to perform this action.
This record was changed. Refresh and try again.
```

Do not overuse toasts for every keystroke or minor UI state.

---

## 9.5 Redirect after submit

Common patterns:

| Form | Success Behavior |
|---|---|
| Create Business Object | Go to detail or list |
| Create workflow record | Go to detail/status page |
| Edit detail form | Stay on page and show saved state |
| Settings form | Stay on page |
| Dialog action | Close dialog and refresh local section |

Avoid surprising redirects.

---

# 10. Error and Recovery Standards

## 10.1 Validation failure

Validation failure should:

```txt
[ ] keep user input
[ ] focus first invalid field when practical
[ ] show field-level messages
[ ] avoid losing form state
```

---

## 10.2 Permission failure

Permission failure should:

```txt
[ ] show clear message
[ ] not reveal sensitive data
[ ] not crash the page
[ ] not leave optimistic state applied
```

Example:

```txt
You do not have permission to create products.
```

---

## 10.3 Tenant failure

Wrong-org access should generally behave like safe not found.

Example:

```txt
This page is not available.
```

Do not reveal:

```txt
This organization exists but you are not a member.
```

in normal user-facing flows.

---

## 10.4 Network/server failure

Network/server failure should:

```txt
[ ] rollback optimistic state
[ ] show retry path when possible
[ ] preserve input when possible
[ ] log with request ID
```

Example:

```txt
Could not save right now. Your changes are still here. Try again.
```

---

# 11. Permission-Aware Form UI

Permission-aware forms should improve usability.

They must not be the security layer.

Examples:

```txt
user without create permission does not see “New product” button
user without update permission sees read-only detail fields
user without approve permission does not see approval action
```

But APIs and services must still enforce permissions.

---

# 12. Read-Only Form/Detail Mode

For users with read permission but no update permission, detail pages may show read-only field layouts.

Read-only views should not look broken or disabled everywhere.

Preferred:

```txt
clean detail layout
field labels and values
edit button hidden or disabled with explanation
```

Avoid:

```txt
entire form rendered as disabled inputs
```

Disabled-input walls feel like broken software.

---

# 13. Destructive Action Standards

Destructive actions must be explicit.

Examples:

```txt
Delete draft record
Deactivate employee
Cancel leave request
Void goods receipt
Retire asset
```

Use the right business verb.

Do not call everything “delete.”

Most business workflows should use business state transitions:

```txt
cancelled
voided
retired
resolved
closed
inactive
```

Soft delete is record lifecycle, not business state.

---

## 13.1 Confirmation dialogs

Use confirmation dialogs for destructive or irreversible actions.

Dialog should include:

```txt
action name
record name
consequence
confirm button with destructive style
cancel button
```

Example:

```txt
Cancel leave request?
This will mark the request as cancelled. It will remain in history.
```

---

## 13.2 Type-to-confirm

Type-to-confirm is deferred for MVP except for unusually dangerous platform/admin actions.

Do not make normal business workflows unnecessarily dramatic.

---

# 14. Relation Forms and Business Objects

Forms must respect Business Object ownership.

---

## 14.1 Product forms

Product create/edit forms belong to the Business Objects layer.

They should not appear as if Inventory owns Product.

Product-specific Inventory fields belong in Inventory extension forms.

Correct separation:

```txt
Product form:
  code
  name
  description
  category
  unit

Inventory product settings form:
  reorder point
  minimum stock
  inventory tracking options
```

---

## 14.2 Customer forms

Customer forms belong to Business Objects.

CRM-specific fields belong in CRM profile/extension forms.

Correct separation:

```txt
Customer form:
  name
  email
  phone
  address

CRM customer profile form:
  lifecycle stage
  lead source
  account owner
```

---

## 14.3 Employee forms

Employee forms belong to Business Objects.

Leave-specific fields belong in Leave.

Expenses-specific employee behavior belongs in Expenses.

Assets-specific employee assignment belongs in Assets.

---

## 14.4 Warehouse forms

Warehouse forms belong to Business Objects.

Inventory stock behavior does not belong in the core Warehouse form.

---

# 15. Form Motion Standards

Use Motion for React sparingly to clarify transitions.

Good use cases:

```txt
field group reveal
row added after create
error summary entrance
dialog/sheet entrance
optimistic row removal
section collapse/expand
```

Bad use cases:

```txt
bouncy inputs
slow page transitions
animated decoration
confetti
constant motion while typing
```

Motion should make the product feel faster, not playful.

Respect reduced-motion preferences.

---

# 16. Loading Standards

Forms should not feel dead while loading.

Use:

```txt
skeleton fields
subtle disabled pending states
button loading text
inline status
```

Avoid:

```txt
full page spinner for simple forms
layout shift after loading
blank white cards
```

---

# 17. Accessibility Standards

Forms must be accessible.

Required:

```txt
[ ] labels associated with inputs
[ ] error messages associated with fields
[ ] keyboard navigation works
[ ] submit works from keyboard where appropriate
[ ] focus states are visible
[ ] dialogs trap focus
[ ] destructive dialogs are screen-reader understandable
[ ] color is not the only error indicator
```

Do not remove focus rings casually.

OneDayOS should feel keyboard-friendly and professional.

---

# 18. Mobile and Responsive Standards

MVP is business desktop-first, but forms must remain usable on mobile.

Rules:

```txt
[ ] form fields stack on small screens
[ ] action buttons remain reachable
[ ] dialogs do not overflow unusably
[ ] tables may become harder on mobile, but forms must work
[ ] touch targets are large enough
```

Do not design mobile-only workflows unless explicitly required.

Most Philippine SME internal operations will likely happen on desktop/laptop, but mobile usability still matters.

---

# 19. Generated Form Standards

Generated forms must follow this document.

The Module Generator and future Form Generator must not output generic forms.

Generated forms must include:

```txt
[ ] no hidden orgId
[ ] tenant-scoped API target
[ ] Zod schema
[ ] React Hook Form
[ ] field-level errors
[ ] submit pending state
[ ] success/error toast
[ ] permission-aware UI where applicable
[ ] relation fields revalidated server-side
[ ] tests for orgId rejection
[ ] tests for validation errors
[ ] tests for forbidden imports
```

Generated forms must not include:

```txt
[ ] raw Prisma
[ ] @/kernel imports
[ ] @/sdk/server in client components
[ ] client-supplied orgId
[ ] full business records in browser unnecessarily
[ ] dynamic customFields JSON
[ ] file uploads unless explicitly approved
```

---

# 20. Form Testing Requirements

Every important form needs tests appropriate to its risk.

---

## 20.1 UI form tests

Test:

```txt
renders required fields
shows validation errors
submits valid input
shows pending state
shows permission-aware visibility
keeps input after validation error
uses accessible labels
```

---

## 20.2 API form-submission tests

Test:

```txt
401 unauthenticated
403 missing permission
safe 404 wrong org
400 validation error
400 client-supplied orgId rejected
201/200 success
JSON response shape
no redirects
```

---

## 20.3 Service tests

Test:

```txt
uses PlatformContext
checks permission
scopes records to ctx.org.id
validates relation IDs belong to ctx.org.id
emits event after successful mutation
emits no event on failure
uses soft delete for delete behavior
```

---

## 20.4 Architecture tests

Block:

```txt
@/kernel/* imports in module forms
@/sdk/server imports in client components
raw Prisma imports in modules
hidden orgId fields
JSON.stringify({ ..., orgId }) patterns
/api/[module] route patterns
```

---

# 21. Anti-Patterns

## 21.1 Database-shaped forms

Bad:

```txt
Show every database column directly to the user.
```

Example bad fields:

```txt
id
orgId
createdAt
updatedAt
deletedAt
deletedBy
userId
foreign key IDs without labels
```

Users do business work.

They do not edit database rows.

---

## 21.2 Generic admin-template forms

Bad:

```txt
plain card
random inputs
Submit button
no help text
no business context
no error recovery
```

This recreates the old problem.

OneDayOS must not feel like a SaaS starter.

---

## 21.3 Hidden tenant fields

Forbidden:

```txt
hidden orgId
hidden userId for authorization
hidden role permissions
hidden module enablement
```

Hidden fields are not security.

---

## 21.4 Custom module form systems

Forbidden:

```txt
Inventory has its own form design
CRM has its own form design
Leave has its own form design
```

Modules should inherit platform form standards.

---

## 21.5 Business workflow as generic edit

Bad:

```txt
User edits status = approved
```

Correct:

```txt
User clicks Approve
Approval form appears if needed
Service runs approve workflow
Event emitted
```

---

## 21.6 Overusing deferred systems

Do not implement these just because forms would be easier:

```txt
Dynamic Form Engine
Dynamic CRUD Engine
Custom Fields Service
Workflow Engine
Attachment Service
AI form builder
```

These remain deferred unless separately approved.

---

# 22. Claude Implementation Rules

When Claude implements forms, it must follow these rules:

```txt
1. Do not generate generic CRUD forms.
2. Do not include orgId in client schemas, forms, or payloads.
3. Use tenant-scoped API routes under /api/orgs/[orgSlug]/...
4. Use React Hook Form and Zod.
5. Use strict server-side validation.
6. Use approved OneDayOS form components.
7. Use field-level errors and useful help text.
8. Use optimistic UI only where rollback is safe.
9. Use sonner toasts for submission feedback.
10. Do not import @/kernel/* in modules.
11. Do not import @/sdk/server in client components.
12. Do not use raw Prisma in forms.
13. Do not implement Dynamic Forms unless explicitly instructed.
14. Add form, API, service, and architecture tests where relevant.
15. Stop if required platform helpers do not exist.
```

---

# 23. Example: Good Product Create Form Contract

Product is a shared Business Object.

Form route:

```txt
/[orgSlug]/records/products/new
```

API route:

```txt
POST /api/orgs/[orgSlug]/objects/products
```

Fields:

```txt
code
name
description
categoryId
unit
```

Not fields:

```txt
orgId
stock quantity
reorder point
supplier price
warehouse location
valuation method
```

Those belong elsewhere.

Submission flow:

```txt
Client submits product input
API creates PlatformContext
API checks objects.product.create
API validates strict schema
ProductService.create(ctx, input)
Service creates Product with ctx.org.id
Service emits objects.product.created
API returns JSON
UI shows success toast
```

---

# 24. Example: Good Leave Request Form Contract

Leave Request is module-owned.

Form route:

```txt
/[orgSlug]/leave/requests/new
```

API route:

```txt
POST /api/orgs/[orgSlug]/leave/leave-requests
```

Fields:

```txt
employeeId
leaveTypeId
startDate
endDate
reason
```

Not fields:

```txt
orgId
status = approved
approvedById
balanceAfter
```

Submission flow:

```txt
Client submits request input
API creates PlatformContext
API checks leave.leave_request.create or leave.own_leave_request.create
API validates strict schema
Service verifies employee belongs to ctx.org.id
Service creates LeaveRequest as pending
Service emits leave.leave_request.submitted
API returns JSON
UI redirects to request detail or list
```

---

# 25. Implementation Checklist

Before a form is accepted:

```txt
[ ] uses approved layout and components
[ ] labels are business-friendly
[ ] required fields are clear
[ ] help text/tooltips exist for non-obvious fields
[ ] no hidden orgId field
[ ] no client-supplied orgId in payload
[ ] client schema excludes orgId
[ ] server schema rejects orgId
[ ] API is tenant-scoped
[ ] API returns JSON only
[ ] API validates params/query/body
[ ] API creates PlatformContext
[ ] API checks permission
[ ] service receives PlatformContext
[ ] service validates relation IDs tenant-safely
[ ] service emits event after successful mutation
[ ] success toast exists
[ ] error handling exists
[ ] optimistic UI used only if safe
[ ] tests cover validation failure
[ ] tests cover permission denial
[ ] tests cover wrong org if tenant-sensitive
[ ] tests cover client-supplied orgId rejection
[ ] architecture checks pass
```

---

# 26. Final Rule

```txt
OneDayOS forms should feel like a polished business operating system,
not like database tables with inputs attached.
```

A great OneDayOS form is:

```txt
calm enough for daily work
strict enough for data quality
fast enough to feel modern
secure enough for shared tenancy
consistent enough for generators
clear enough for Philippine SME users
```

This document is required before Claude builds the restarted platform UI.

