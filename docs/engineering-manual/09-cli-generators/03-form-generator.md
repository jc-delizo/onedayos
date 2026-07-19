# OneDayOS Engineering Manual — 09 CLI Generators / 03 Form Generator

**Document ID:** `09-cli-generators/03-form-generator.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Allowed:** No — Deferred Specification  
**Author:** ChatGPT acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Applies To:** Restarted OneDayOS platform build  

---

# 1. Purpose

This document defines the future **Form Generator** for OneDayOS.

The Form Generator is a CLI tool that will eventually generate secure, tenant-aware, permission-aware, design-system-compliant React forms from approved metadata.

It should help produce create forms, edit forms, settings forms, filter forms, and future import-mapping forms without forcing engineers or Claude Code to hand-write the same form structure repeatedly.

However, this document is a **specification only**.

The Form Generator must **not** be implemented yet.

The immediate goal is to define the form generation contract so that future form generation does not become a generic, insecure, no-code-style abstraction.

---

# 2. Current Status

```txt
Status: Deferred
Implementation: Not allowed yet
Reason: Form patterns are not mature enough
```

The restarted OneDayOS build should first implement:

```txt
Kernel
SDK
Database architecture
Business Objects
Module System
Module Generator
Design System
At least one official module, preferably Inventory
Several hand-coded forms across different resource types
```

Only after those are stable should the Form Generator be implemented.

---

# 3. Why This Document Exists Now

Forms are one of the highest-leverage surfaces in OneDayOS.

Most internal business applications are built from:

```txt
lists
detail pages
forms
tables
reports
workflows
```

If forms are inconsistent, insecure, or generic, every module will feel like a low-quality admin panel.

If forms are standardized correctly, OneDayOS becomes faster to build, easier to maintain, safer to extend, and more pleasant to use.

The previous MVP already showed the danger of weak generation patterns:

```txt
client-supplied orgId
schemas that included tenant identity
API routes outside tenant-scoped paths
auth-only API protection
weak placeholder tests
generic SaaS UI
form scaffolds that did not encode real security rules
```

The restarted build must not repeat those patterns.

The Form Generator must encode the Engineering Manual, not bypass it.

---

# 4. Relationship to Other Generators and Systems

## 4.1 Module Generator

The Module Generator creates a module shell.

It answers:

> “Create a business capability package.”

It may create starter forms, but it should not become a general-purpose form generator.

---

## 4.2 CRUD Generator

The CRUD Generator creates resource-level CRUD code.

It may call or reuse the Form Generator later.

It answers:

> “Create secure CRUD for this resource.”

The Form Generator answers a narrower question:

> “Create a secure, validated, design-system-compliant form for this operation.”

---

## 4.3 Dynamic Form Engine

The Dynamic Form Engine is a future runtime system that renders forms dynamically from metadata.

That is not the same as this generator.

```txt
Form Generator = static React/Zod code generation
Dynamic Form Engine = runtime metadata-rendered forms
```

The Form Generator may use metadata, but it still produces ordinary code files.

The Dynamic Form Engine remains deferred until repeated hand-coded form patterns prove the need.

---

## 4.4 Design System

The Form Generator must depend on the Design System documents.

It must not invent visual styles.

Generated forms must use the OneDayOS form standards once frozen:

```txt
layout
spacing
labels
help text
tooltips
validation messages
error summary
loading state
dirty state
save/cancel behavior
confirmation behavior
keyboard behavior
accessibility behavior
```

If the Design System form standards are not frozen, the Form Generator must remain deferred.

---

# 5. Core Rule

```txt
The Form Generator must generate production-shaped forms, not demo-shaped forms.
```

Generated forms must be:

```txt
tenant-safe
permission-aware
validated with Zod
server-validation compatible
API-contract compatible
design-system compliant
accessible
keyboard-friendly
safe for AI-assisted development
free of client-supplied tenant identity
```

If the generator cannot produce a secure and maintainable form, it should not generate anything.

---

# 6. Implementation Gate

The Form Generator may not be implemented until all of the following are true:

```txt
[ ] Production Readiness Gate document is frozen
[ ] Design System form standards are frozen
[ ] Kernel API contracts are implemented and tested
[ ] SDK client/server split is implemented
[ ] Zod validation conventions are implemented
[ ] Module Generator is implemented and secure-by-default
[ ] CRUD Generator contract is reviewed, even if still deferred
[ ] At least three hand-coded create/edit forms exist
[ ] At least one Business Object form exists
[ ] At least one module-owned resource form exists
[ ] At least one module-extension form exists or is clearly designed
[ ] Generated module tests are meaningful, not placeholder tests
```

Recommended trigger:

```txt
Inventory has hand-coded forms for:
- product creation or product extension setup
- stock adjustment
- reorder rule
```

or equivalent forms across separate modules.

---

# 7. Non-Goals

The Form Generator must not:

```txt
build the Dynamic Form Engine
build a runtime no-code form builder
generate FastAPI / Python backend files
generate Pydantic schemas
generate SQLAlchemy models
create server actions without manual approval
create forms that submit orgId
create forms that trust hidden tenant fields
create field-level ABAC before the permission model supports it
generate customFields JSON blobs
generate file upload fields before Attachment Service exists
generate workflow/approval fields before Workflow or Approval Services exist
generate relation queries that bypass PlatformContext
generate form layouts that ignore the Design System
replace server-side validation
```

---

# 8. Form Target Types

The generator must support different form target types because forms can belong to different architectural layers.

## 8.1 Business Object Forms

Business Object forms manage shared entities such as:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Example create form:

```txt
/[orgSlug]/objects/products/new
```

Example API target:

```txt
POST /api/orgs/[orgSlug]/objects/products
```

Example permission:

```txt
objects.product.create
```

Business Object forms must not be generated inside module folders.

Wrong:

```txt
src/modules/inventory/forms/ProductForm.tsx
```

Correct:

```txt
src/business-objects/product/forms/ProductForm.tsx
```

or the final approved Business Object implementation folder.

---

## 8.2 Module-Owned Resource Forms

Module-owned forms manage module-specific resources.

Examples:

```txt
Inventory stock adjustment form
Leave request form
Purchase request form
Expense claim form
Incident report form
Visitor log form
Asset assignment form
```

Example create form:

```txt
/[orgSlug]/inventory/stock-adjustments/new
```

Example API target:

```txt
POST /api/orgs/[orgSlug]/inventory/stock-adjustments
```

Example permission:

```txt
inventory.stock_adjustment.create
```

---

## 8.3 Module Extension Forms

Module extension forms manage module-specific data attached to a Business Object.

Examples:

```txt
InventoryProductExtension
PurchasingSupplierExtension
SalesCustomerExtension
HRProfileExtension
```

The form must clearly separate:

```txt
Business Object fields
Module extension fields
Business Object permissions
Module extension permissions
Business Object events
Module extension events
```

Example:

```txt
Product = shared Business Object
InventoryProductExtension = Inventory-specific stock settings
```

Creating both in one UI flow may require two permission sets:

```txt
objects.product.create
inventory.product_extension.create
```

---

## 8.4 Settings Forms

Settings forms manage organization-scoped or module-scoped configuration.

Examples:

```txt
Inventory settings
Leave policy settings
Notification preferences, later
Org branding settings
Subscription limits, internal/admin only
```

Settings forms must use the Settings/Configuration contract once frozen.

They must validate `Setting.value` using explicit Zod schemas.

They must not accept arbitrary unvalidated JSON from the client.

---

## 8.5 Filter Forms

Filter forms power tables and reports.

Examples:

```txt
stock movement date filter
leave request status filter
customer search filters
expense claim date range filter
```

Filter forms must validate query params.

They must not become a general report builder.

Global search, saved views, and report builders remain separate future systems.

---

# 9. Proposed CLI Shape

The final CLI syntax may be adjusted later, but the recommended contract is below.

## 9.1 Business Object Form

```bash
npm run form:create -- \
  --object product \
  --operation create
```

## 9.2 Module-Owned Resource Form

```bash
npm run form:create -- \
  --module inventory \
  --resource stock-adjustment \
  --operation create
```

## 9.3 Module Extension Form

```bash
npm run form:create -- \
  --module inventory \
  --resource product-extension \
  --extends product \
  --operation create
```

## 9.4 Settings Form

```bash
npm run form:create -- \
  --module inventory \
  --settings
```

## 9.5 Filter Form

```bash
npm run form:create -- \
  --module inventory \
  --resource stock-movement \
  --operation filter
```

## 9.6 Dry Run

```bash
npm run form:create -- \
  --module inventory \
  --resource stock-adjustment \
  --operation create \
  --dry-run
```

Dry run must show:

```txt
files to create
files to modify
schemas to create or update
permissions required
API endpoint expected
relation option loaders required
manual follow-up steps
tests to create
```

## 9.7 Check Mode

```bash
npm run form:create -- \
  --module inventory \
  --resource stock-adjustment \
  --operation create \
  --check
```

Check mode validates whether an existing generated form still follows the generator contract.

---

# 10. Required Generator Input

The generator must not infer forms from only a name.

It needs structured metadata.

Recommended future input file:

```txt
src/modules/[moduleId]/resources/[resource]/forms/[operation].form.config.ts
```

or:

```txt
forms/[moduleId].[resource].[operation].config.ts
```

The exact physical location may be finalized later.

The metadata must be explicit enough to generate:

```txt
fields
labels
validation
layout
relation inputs
help text
permissions
submit target
success behavior
error behavior
tests
```

---

# 11. Form Metadata Contract

A future form config should conceptually include:

```ts
type FormTargetType =
  | 'business-object'
  | 'module-owned'
  | 'module-extension'
  | 'settings'
  | 'filter'

type FormOperation =
  | 'create'
  | 'edit'
  | 'duplicate'
  | 'restore'
  | 'settings'
  | 'filter'

type FormConfig = {
  type: FormTargetType
  operation: FormOperation

  identity: {
    moduleId?: string
    objectId?: string
    resourceId: string
    formId: string
    label: string
    description?: string
  }

  routes: {
    page?: string
    api?: string
    successRedirect?: string
    cancelHref?: string
  }

  permissions: {
    view?: PermissionRequirement
    submit: PermissionRequirement
  }

  fields: FormField[]
  layout: FormLayout
  behavior: FormBehavior
  tests: FormTestConfig
}
```

This type is illustrative.

The final implementation may rename fields, but the information must exist.

---

# 12. Field Metadata Requirements

Each form field must include enough metadata for UI generation, validation, accessibility, tests, and future AI context.

Conceptual field shape:

```ts
type FormField = {
  key: string
  label: string
  type: FormFieldType
  required?: boolean
  readonly?: boolean
  disabled?: boolean
  hidden?: boolean
  placeholder?: string
  helpText?: string
  tooltip?: string
  defaultValue?: unknown
  validation?: ValidationConfig
  options?: SelectOption[]
  relation?: RelationFieldConfig
  visibility?: VisibilityRule
  layout?: FieldLayoutConfig
  create?: boolean
  edit?: boolean
  filter?: boolean
}
```

Field metadata must not include tenant identity.

Forbidden field keys:

```txt
orgId
organizationId
tenantId
userId
roleIds
permissions
createdAt
updatedAt
deletedAt
deletedBy
createdBy
updatedBy
isSystem
```

These fields are server-owned or Kernel-owned.

---

# 13. Supported Field Types

The first implementation of the Form Generator may support:

```txt
text
textarea
number
money
date
datetime
boolean
email
phone
url
select
enum
relation
hidden-display-only
```

`hidden-display-only` means a read-only value shown visually to the user, not a hidden input submitted to the API.

The generator must not use hidden inputs for tenant, actor, or permission fields.

---

# 14. Deferred Field Types

The generator must not support these in the first implementation:

```txt
file upload
image upload
rich text
repeatable field arrays
nested objects
polymorphic relations
formula fields
computed expressions
signature fields
workflow state fields
approval step fields
customFields JSON
field-level permission conditions
branch-scoped field visibility
AI-generated arbitrary fields
```

These require additional platform services or mature metadata rules.

Adding them early would create long-term debt.

---

# 15. Validation Rules

Generated forms must use Zod schemas.

Client-side validation improves user experience.

Server-side validation enforces security.

```txt
Client validation = UX
Server validation = security
```

The same schema may be shared when safe, but server validation remains mandatory.

Generated forms must never rely only on browser validation or React Hook Form validation.

---

# 16. Strict Object Rule

Generated request-body schemas must reject unknown keys.

Conceptual example:

```ts
export const CreateStockAdjustmentSchema = z.strictObject({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int(),
  reason: z.string().min(1),
})
```

This prevents dangerous values from silently passing through request bodies.

Generated schemas must reject:

```txt
orgId
userId
roleIds
permissions
createdAt
updatedAt
deletedAt
deletedBy
createdBy
updatedBy
isSystem
```

If a generated form includes a hidden `orgId`, the generator is broken.

---

# 17. Form Submission Rule

Generated forms must submit only business input.

Correct body:

```json
{
  "productId": "prod_123",
  "warehouseId": "wh_123",
  "quantity": 10,
  "reason": "Physical count correction"
}
```

Forbidden body:

```json
{
  "orgId": "org_123",
  "productId": "prod_123",
  "warehouseId": "wh_123",
  "quantity": 10
}
```

Tenant identity comes from:

```txt
authenticated session
orgSlug route param
verified PlatformContext
```

not from form state.

---

# 18. Route and API Rules

Generated forms must submit to tenant-scoped API routes.

## 18.1 Module-Owned Submit Target

```txt
POST /api/orgs/[orgSlug]/inventory/stock-adjustments
PATCH /api/orgs/[orgSlug]/inventory/stock-adjustments/[id]
```

## 18.2 Business Object Submit Target

```txt
POST /api/orgs/[orgSlug]/objects/products
PATCH /api/orgs/[orgSlug]/objects/products/[id]
```

## 18.3 Forbidden Submit Targets

```txt
/api/inventory
/api/inventory?orgId=...
/api/products
/api/kernel/products
/api/[module]/[id]
```

Generated forms must never submit tenant identity in query strings.

---

# 19. Page Route Rules

Generated form pages must live inside the organization shell.

## 19.1 Module-Owned Create/Edit Pages

```txt
src/app/(platform)/[orgSlug]/inventory/stock-adjustments/new/page.tsx
src/app/(platform)/[orgSlug]/inventory/stock-adjustments/[id]/edit/page.tsx
```

## 19.2 Business Object Create/Edit Pages

```txt
src/app/(platform)/[orgSlug]/objects/products/new/page.tsx
src/app/(platform)/[orgSlug]/objects/products/[id]/edit/page.tsx
```

## 19.3 Client Component Params Rule

Generated client components must use:

```ts
useParams()
```

Generated client components must not accept `params` as props.

Server page components may receive `params`, resolve `PlatformContext`, fetch initial data, and pass safe props to the client form.

---

# 20. Server Page Pattern

Generated create/edit pages should be server components by default.

Server page responsibilities:

```txt
resolve orgSlug
create verified PlatformContext
check page-level permission
load existing record for edit
load relation options safely
pass initial values/options to client form
render not-found or permission-denied states correctly
```

Client form responsibilities:

```txt
render inputs
manage form state
show validation errors
submit to API
show loading state
show toasts
redirect or refresh after success
```

Server page components may import `@/sdk/server`.

Client form components must not.

---

# 21. Client Form Import Rules

Generated client form components may import:

```txt
@/sdk/client
@/sdk shared types/constants only
@/components/ui/*
@/components/kernel or design-system form components
module-local client-safe schema/types
react-hook-form
zod resolver
next/navigation
sonner
```

Generated client form components must not import:

```txt
@/sdk/server
@/kernel/*
@/kernel/db/client
@prisma/client runtime values
another module
server-only service files
server-only relation loaders
FastAPI clients as primary backend
```

---

# 22. Relation Field Rules

Relation fields are dangerous because they can easily leak cross-tenant data.

Examples:

```txt
product select
warehouse select
employee select
customer select
supplier select
department select
branch select
```

Generated relation fields must follow these rules:

```txt
relation options are loaded server-side using PlatformContext
relation options are scoped to ctx.org.id
relation options exclude deleted records
relation options respect permission where applicable
client receives only safe option data
client never sends relation labels as authority
server revalidates relation IDs on submit
```

Correct option shape:

```ts
type RelationOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}
```

Forbidden option data:

```txt
orgId
internal cost if not needed
private notes
full Prisma records
large nested objects
```

---

# 23. Server-Side Relation Revalidation

A relation field selected in the browser is not proof the relation is valid.

The service or API must revalidate relation IDs.

Example:

```ts
const product = await db.product.findFirst({
  where: {
    id: input.productId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})

if (!product) throw new NotFoundError('Product not found')
```

Generated forms must not assume that because a relation option was rendered, the submitted ID is safe.

---

# 24. Conditional Visibility Rules

The first implementation should be conservative with conditional fields.

Allowed simple conditions:

```txt
show field when another field equals a literal value
show field when checkbox is true
show field when select option is selected
```

Deferred conditions:

```txt
permission-based field visibility
branch-scoped visibility
database-driven field visibility
workflow-step-driven visibility
custom JavaScript expressions
AI-generated conditions
```

Field visibility is not security.

If a field should not be editable by a user, the server schema/service must enforce that rule.

---

# 25. Default Value Rules

Generated forms may support safe defaults.

Allowed defaults:

```txt
static value
current date, if business-safe
first allowed enum value, if explicitly configured
empty string
null
false
```

Forbidden defaults:

```txt
orgId
userId as hidden form value
roleIds
permissions
server-owned audit fields
unverified relation IDs
values derived from another tenant
```

If a value must come from the actor or tenant, it belongs in server logic, not form defaults.

---

# 26. Layout Rules

Generated forms must follow the OneDayOS Design System.

Default layout should be:

```txt
clear page title
short description
sectioned fields when more than 6 fields
one-column layout for narrow/simple forms
two-column layout only when fields are short and related
sticky or clearly visible submit area for long forms
cancel action
save action
keyboard submit
error summary for multi-field errors
```

Generated forms must not look like generic Bootstrap admin forms.

No random cards, borders, colors, or spacing outside the Design System.

---

# 27. Form Section Rules

Forms with many fields should use sections.

Example:

```txt
Basic Information
Inventory Settings
Accounting Settings
Notes
```

Section metadata should include:

```ts
type FormSection = {
  id: string
  label: string
  description?: string
  fields: string[]
}
```

Sections must not become tabs by default.

Tabs should be used only when each group can stand alone and when switching tabs does not hide critical validation errors.

---

# 28. Label, Help Text, and Tooltip Rules

Generated forms must include helpful labels.

A label should answer:

```txt
What is this field?
```

Help text should answer:

```txt
How should I fill this out?
```

Tooltip text should answer:

```txt
What might be unclear but does not deserve permanent screen space?
```

Rules:

```txt
Labels must not be database column names.
Tooltips must be short.
Help text must be actionable.
Every non-obvious field should include help text or tooltip.
If a tooltip needs more than two sentences, rename the field or write real documentation.
```

---

# 29. Error Handling Rules

Generated forms must handle errors consistently.

## 29.1 Client Validation Errors

Client validation errors should appear near the relevant fields.

They should use human-readable messages.

Wrong:

```txt
Invalid input
```

Better:

```txt
Quantity must be greater than zero.
```

## 29.2 Server Validation Errors

Server validation errors should map back to fields when possible.

If the server returns field errors, the form should attach them to React Hook Form.

If the error is global, show a form-level error.

## 29.3 API Error Contract

Generated forms must expect the Kernel API response shape:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: ApiMeta
}
```

Generated forms must not assume errors are plain strings.

---

# 30. Loading and Submitting Rules

Generated forms must make submission state clear.

During submission:

```txt
submit button disabled
button text changes to Saving… or Creating…
fields remain readable
cancel is disabled only if necessary
no duplicate submissions
```

For long operations, use a toast or inline status.

Do not use full-page spinners for normal form submission.

---

# 31. Success Behavior Rules

Generated create forms should normally:

```txt
submit successfully
show success toast
redirect to detail page or list page
refresh relevant server data
```

Generated edit forms should normally:

```txt
submit successfully
show success toast
stay on edit page or redirect to detail page, depending on config
refresh relevant server data
```

The success behavior must be explicit in form metadata.

The generator must not randomly choose redirect behavior.

---

# 32. Dirty State Rules

Generated edit forms should track dirty state.

If the user changes fields and attempts to leave, the UI should eventually warn them.

MVP generated forms may start with basic dirty-state behavior:

```txt
show unsaved changes indicator
reset dirty state after successful submit
disable save until changes exist, if appropriate
```

Browser-level navigation blocking may be deferred if it creates UX complexity.

---

# 33. Optimistic UI Rules

Forms may use optimistic UI only where safe.

Allowed:

```txt
optimistically add created record to local list after API starts, then reconcile
optimistically update local detail display after successful client validation, then reconcile
```

Not allowed:

```txt
optimistically assume server-created IDs before persistence
optimistically commit financial/accounting/stock-affecting state without clear rollback
optimistically bypass server validation
```

For inventory, purchasing, expenses, or approval-related workflows, prefer conservative submit behavior unless the operation has a clear rollback path.

The general interaction responsiveness standard still applies: the UI should respond immediately, but not lie about committed business state.

---

# 34. Accessibility Rules

Generated forms must be accessible by default.

Required:

```txt
labels connected to inputs
error messages connected to fields
keyboard navigation
visible focus states
submit via Enter where appropriate
Escape closes dialogs where appropriate
aria-describedby for help/error text when supported
no icon-only buttons without accessible labels
color is not the only error indicator
```

Generated forms must not sacrifice accessibility for visual minimalism.

---

# 35. Dialog, Drawer, and Page Form Rules

The generator may eventually support different form containers.

## 35.1 Page Forms

Default for most create/edit flows.

Use when:

```txt
form has several fields
form has relation selects
form has important validation
form creates business-critical records
```

## 35.2 Dialog Forms

Use only for small forms.

Examples:

```txt
create category
quick add warehouse
simple status update
```

Do not put complex business workflows inside dialogs.

## 35.3 Drawer Forms

Use only when the user should keep context from a list/detail page.

Examples:

```txt
edit customer contact info
quick update asset assignment
```

Drawers must still enforce validation and permissions through the API/service layer.

---

# 36. Settings Form Rules

Settings forms must be explicit and schema-driven.

Wrong:

```txt
accept arbitrary JSON settings from a client form
```

Correct:

```ts
const InventorySettingsSchema = z.strictObject({
  lowStockThresholdDefault: z.number().int().min(0),
  allowNegativeStock: z.boolean(),
})
```

Settings form submission must:

```txt
resolve PlatformContext
check settings permission
validate schema
write to Setting table with module/key/value rules
emit settings updated event if standardized later
```

Settings forms must not become client-specific code forks.

---

# 37. Filter Form Rules

Generated filter forms submit query state, not business mutations.

Filter fields may include:

```txt
text search
status select
date range
relation select
boolean flag
sort field
sort direction
```

Filter query schemas must validate query params.

Forbidden:

```txt
raw SQL fragments
Prisma where JSON from client
orgId query param
unbounded arbitrary field filters
AI-generated query conditions without validation
```

---

# 38. Import Mapping Forms

Import mapping forms are deferred.

When eventually implemented, they must:

```txt
reject orgId columns
validate each mapped row with Zod
show row-level errors
support dry-run preview
require import permission
be tenant-scoped
not write partial unsafe data silently
```

The Form Generator may prepare metadata for importability later, but must not implement import flows by default.

---

# 39. Generated File Output Contract

For a module-owned resource form, the generator should create files similar to:

```txt
src/modules/[moduleId]/resources/[resource]/forms/
  [operation].form.config.ts
  [Resource][Operation]Form.tsx
  [Resource][Operation]Form.schema.ts
  [Resource][Operation]Form.types.ts
  __tests__/
    [Resource][Operation]Form.schema.test.ts
    [Resource][Operation]Form.test.tsx

src/app/(platform)/[orgSlug]/[moduleId]/[resource]/new/page.tsx
src/app/(platform)/[orgSlug]/[moduleId]/[resource]/[id]/edit/page.tsx
```

For Business Object forms, generated files must live in the approved Business Object implementation area, not under a module.

For settings forms, generated files should live under the module or Kernel settings area depending on ownership.

---

# 40. Schema File Rules

Generated schema files must be safe to import in client components unless explicitly named `.server.ts`.

Client-safe schema files may include:

```txt
Zod schemas
plain TypeScript types
constants
enum options
static validation rules
```

Client-safe schema files must not include:

```txt
Prisma imports
SDK server imports
Kernel imports
process.env reads
server-only relation loaders
database-backed validators
```

Database-backed validation belongs in service/server code.

---

# 41. Relation Loader File Rules

Relation loaders must be server-only.

Recommended file naming:

```txt
relation-loaders.server.ts
```

Example:

```ts
export async function loadProductOptions(ctx: PlatformContext) {
  const db = sdk.getDb(ctx)

  const products = await db.product.findMany({
    where: {
      orgId: ctx.org.id,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { name: 'asc' },
  })

  return products.map((product) => ({
    value: product.id,
    label: `${product.code} — ${product.name}`,
  }))
}
```

Client forms receive the options as props.

---

# 42. Permission Rules

Generated forms must be permission-aware, but UI permissions are not security.

Generated pages should check permission before rendering forms.

Generated APIs/services must check permission before mutation.

Create form permission example:

```txt
inventory.stock_adjustment.create
```

Edit form permission example:

```txt
inventory.stock_adjustment.update
```

View form permission example:

```txt
inventory.stock_adjustment.read
```

The form generator must not create wildcard permissions.

---

# 43. Business Object Permission Rules

Business Object forms use the `objects` namespace.

Examples:

```txt
objects.product.create
objects.product.update
objects.customer.create
objects.employee.update
objects.warehouse.create
```

Wrong:

```txt
inventory.product.create
crm.customer.create
hr.employee.update
```

Business Object forms belong to the Business Objects layer.

Modules may link to them or embed carefully approved flows, but do not own them.

---

# 44. Module Extension Permission Rules

Module extension forms use the module namespace.

Examples:

```txt
inventory.product_extension.create
inventory.product_extension.update
purchasing.supplier_extension.update
sales.customer_extension.update
```

If the form also creates or edits a Business Object, it must require the relevant Business Object permission too.

Example combined flow:

```txt
Create Product + Inventory Extension
Required permissions:
- objects.product.create
- inventory.product_extension.create
```

---

# 45. Event Rules

Forms do not emit events directly.

Generated services emit events after successful mutations.

Client forms must not call:

```ts
sdk.events.emit(...)
```

Correct flow:

```txt
Client form submits to API
API validates and creates PlatformContext
Service performs mutation
Service emits event
API returns result
Form shows success state
```

This preserves server authority and event integrity.

---

# 46. API Error Mapping Rules

Generated forms should understand these standard API errors:

```txt
UNAUTHENTICATED
FORBIDDEN
ORG_NOT_FOUND
MODULE_NOT_FOUND
NOT_FOUND
VALIDATION_ERROR
CONFLICT
INTERNAL_SERVER_ERROR
```

Recommended UI mapping:

```txt
UNAUTHENTICATED → redirect to login or show session expired
FORBIDDEN → permission-denied state
ORG_NOT_FOUND → safe not-found state
MODULE_NOT_FOUND → safe not-found state
NOT_FOUND → record not found
VALIDATION_ERROR → map to fields or show form error
CONFLICT → show business conflict near relevant field
INTERNAL_SERVER_ERROR → show generic failure toast/message
```

Generated forms must not display raw stack traces or raw database errors.

---

# 47. Conflict Handling Rules

Generated forms must handle uniqueness and business conflicts.

Examples:

```txt
Product code already exists.
Employee number already exists.
Warehouse code already exists.
Stock adjustment cannot be negative for this warehouse.
```

Conflict messages must be tenant-safe.

Wrong:

```txt
This product code exists in Client B.
```

Correct:

```txt
This product code is already used in your organization.
```

---

# 48. Optimistic Delete Is Not Form Generation

The Form Generator should not generate list delete behavior by default.

Delete UI belongs more naturally to the CRUD Generator or table/action generator.

If a form includes a destructive action, such as cancel/void/archive, it must use:

```txt
confirmation dialog
explicit permission
server-side enforcement
clear success/failure feedback
no hidden orgId
```

---

# 49. Form Test Generation Requirements

Generated forms must include real tests.

Placeholder tests are forbidden.

## 49.1 Schema Tests

Required schema tests:

```txt
valid input passes
missing required field fails
invalid email fails, if email field exists
invalid number range fails, if number field exists
unknown key fails
client-supplied orgId fails
server-owned fields fail
edit schema rejects immutable fields
filter schema rejects unsupported query params
```

## 49.2 Component Tests

Required component tests:

```txt
renders labels
renders help text or tooltips where configured
shows validation errors
submit button disables while submitting
calls configured submit handler with business fields only
does not include hidden orgId input
maps server validation errors to fields
shows global API error message
renders relation options from props
```

## 49.3 Accessibility Tests

Recommended tests:

```txt
labels are associated with inputs
required fields are announced or marked
errors are visible and associated with fields
icon-only buttons have accessible labels
keyboard submit works
```

## 49.4 Security Tests

Required security-related tests:

```txt
form schema rejects orgId
form schema rejects deletedAt/deletedBy
form does not submit roleIds or permissions
API target path is tenant-scoped
client form does not import @/sdk/server
client form does not import @/kernel/*
```

---

# 50. Architecture Checks

The Form Generator must either create or satisfy architecture checks that reject forbidden patterns.

Forbidden generated patterns:

```txt
name="orgId"
register('orgId')
body.orgId
request.nextUrl.searchParams.get('orgId')
import { sdk } from '@/sdk/server' inside client components
import '@/kernel/*' inside modules
import { prisma } from '@/kernel/db/client'
import another module from a generated module form
fetch('/api/inventory')
fetch('/api/products')
fetch('/api/...?...orgId=')
z.object(...) that silently strips unknown keys for request bodies
form schema allowing unknown server-owned fields
hidden tenant fields
```

The generator should eventually support:

```bash
npm run check:architecture
```

or integrate with the platform architecture check suite.

---

# 51. Generated Form Anti-Patterns

## 51.1 Hidden Tenant Field

Wrong:

```tsx
<input type="hidden" {...register('orgId')} />
```

Correct:

```txt
Server derives orgId from PlatformContext.
```

---

## 51.2 Form as Security Boundary

Wrong:

```txt
Hide the button, therefore the user cannot submit.
```

Correct:

```txt
Hide the button for UX, but enforce permission in API and service.
```

---

## 51.3 Generic Form Builder Too Early

Wrong:

```txt
Build one runtime form renderer for every possible field type now.
```

Correct:

```txt
Generate normal React forms from proven metadata after patterns mature.
```

---

## 51.4 Relation Options from Client Queries

Wrong:

```tsx
useEffect(() => fetch('/api/products?orgId=' + orgId))
```

Correct:

```txt
Server page loads tenant-scoped relation options using PlatformContext.
```

---

## 51.5 Forms That Ignore Business Meaning

Wrong:

```txt
Generate a form from raw Prisma fields with labels like productId and warehouseId.
```

Correct:

```txt
Generate a business form with labels, help text, relation labels, and validation.
```

---

# 52. Relationship to Dynamic Forms

The Form Generator should prepare the ground for Dynamic Forms, but not build it.

Generated form metadata may eventually inform:

```txt
Dynamic Form Engine
Dynamic CRUD Engine
Import/export mapping
AI-assisted form creation
Field documentation
Search/filter metadata
```

But for now, generated forms should be normal, inspectable React components.

This is important because early runtime abstraction makes debugging, customization, accessibility, and design refinement harder.

OneDayOS needs strong form patterns before it needs a form engine.

---

# 53. Recommended Implementation Timing

Do not implement the Form Generator immediately after the Module Generator.

Recommended sequence:

```txt
1. Finish Kernel implementation
2. Finish SDK implementation
3. Finish database and Business Object services
4. Finish Design System form standards
5. Implement secure Module Generator
6. Build Inventory manually
7. Build at least three hand-coded forms manually
8. Review repeated patterns
9. Amend this document if needed
10. Implement Form Generator
```

The Form Generator should be extracted from proven patterns, not imagined patterns.

---

# 54. Claude Implementation Rules

When Claude eventually implements the Form Generator, use a prompt like this:

```md
You are implementing the OneDayOS Form Generator.

Authoritative document:
docs/engineering-manual/09-cli-generators/03-form-generator.md

Rules:
- Do not build the Dynamic Form Engine.
- Do not add FastAPI or Python backend files.
- Do not generate hidden orgId fields.
- Do not generate schemas that accept orgId.
- Do not generate forms that submit to /api/[module].
- Do not import @/sdk/server in client components.
- Do not import @/kernel/* inside modules.
- Do not generate relation loaders on the client.
- Do not create customFields JSON.
- Generate real tests, not placeholders.
- Stop and report if the manual is ambiguous.

Task:
Implement only the static Form Generator described in this document.
```

Claude must not decide:

```txt
new form design standards
new API route conventions
new permission model
new event behavior
new relation loading strategy
new Dynamic Form runtime
new field-level ABAC model
```

---

# 55. Acceptance Criteria for Future Implementation

The Form Generator is acceptable only when:

```txt
[ ] It refuses unsafe form/resource names
[ ] It supports dry-run mode
[ ] It refuses to overwrite existing files by default
[ ] It generates tenant-scoped submit targets
[ ] It generates page routes under the org shell
[ ] It generates strict Zod schemas
[ ] It rejects client-supplied orgId
[ ] It rejects server-owned fields
[ ] It generates client-safe form components
[ ] It keeps relation loaders server-only
[ ] It generates permission-aware form pages
[ ] It does not rely on UI checks for security
[ ] It generates forms using Design System components
[ ] It generates labels, help text, and validation messages
[ ] It generates real schema tests
[ ] It generates real component tests
[ ] It generates security tests for forbidden fields/imports
[ ] It does not generate raw Prisma imports inside modules
[ ] It does not generate FastAPI/Python backend files
[ ] It does not generate Dynamic Form runtime code
[ ] It passes npm run check:architecture
[ ] It passes npm run test:run
[ ] It passes npm run typecheck
[ ] It passes npm run build
```

---

# 56. Final Position

The Form Generator is strategically important but not urgent.

OneDayOS should eventually generate excellent forms quickly.

But the first priority is not speed.

The first priority is making sure every form is:

```txt
secure
tenant-safe
validated
permission-aware
beautiful
accessible
consistent
maintainable
testable
aligned with the platform architecture
```

A Form Generator that creates hidden tenant fields, weak schemas, generic UI, or unsafe relation selectors would damage the platform.

A Form Generator that encodes the Engineering Manual will become one of OneDayOS’s strongest delivery accelerators.
