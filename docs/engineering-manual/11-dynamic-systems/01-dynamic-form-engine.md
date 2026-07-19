# OneDayOS Engineering Manual — Dynamic Form Engine

**Document ID:** `11-dynamic-systems/01-dynamic-form-engine.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Deferred — Contract Only`  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Date:** July 2026  
**Depends On:**

- `11-dynamic-systems/00-dynamic-systems-philosophy.md`
- `11-dynamic-systems/04-field-metadata-schema.md`
- `06-data/05-data-validation-zod.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `08-module-system/03-module-folder-contract.md`
- `09-cli-generators/03-form-generator.md`

---

# 1. Purpose

This document defines the future **Dynamic Form Engine** for OneDayOS.

The Dynamic Form Engine is the future platform capability that renders consistent, secure, metadata-driven forms across Business Objects and Business Modules.

It exists to eventually reduce repetitive hand-coded form work while preserving:

```txt
tenant isolation
permission enforcement
server validation
design consistency
accessibility
AI-assisted generation
module boundaries
low operational risk
```

This document is **not** permission to implement the Dynamic Form Engine yet.

It is a contract that tells future engineers and Claude Code what the Dynamic Form Engine should become **after enough real hand-coded form patterns exist**.

---

# 2. Executive Decision

The Dynamic Form Engine is **deferred**.

Claude must not implement:

```txt
form renderer
runtime form builder
database-stored form definitions
custom fields UI
no-code form designer
metadata-to-Zod compiler
dynamic submit engine
dynamic relation picker engine
```

from this document alone.

The only acceptable foundation-stage work is:

```txt
shared TypeScript metadata types
tests for metadata shape
documentation
generator alignment
hand-coded forms that follow future-compatible patterns
```

The platform should first ship hand-coded forms for real Business Objects and modules. Only after repeated patterns emerge should those patterns be promoted into a Dynamic Form Engine.

---

# 3. Core Principle

```txt
Forms are user experience.
Validation is security.
Metadata is a contract.
The server remains authoritative.
```

A dynamic form is not safe just because it is generated.

Every generated or rendered form still needs:

```txt
verified PlatformContext
tenant-safe API route
strict server validation
permission enforcement
relation revalidation
soft-delete awareness
event emission after mutation
consistent API response handling
```

The Dynamic Form Engine must never become a shortcut around the Kernel, SDK, API contracts, Zod validation, or service layer.

---

# 4. Why the Engine Is Deferred

The Dynamic Form Engine sounds useful now, but implementing it too early would be a mistake.

The first version would likely be based on guesses, not real module needs.

OneDayOS should avoid building:

```txt
a weak no-code platform
a generic admin form renderer
a custom-fields dumping ground
a complex condition engine
a half-secure metadata runtime
```

before the platform has enough actual forms to extract reliable patterns.

The correct sequence is:

```txt
1. Build hand-coded Employee form.
2. Build hand-coded Product form.
3. Build hand-coded Customer/Supplier/Warehouse forms.
4. Build first official module forms, likely Inventory.
5. Observe real repetition.
6. Freeze form standards.
7. Extract a Form Generator.
8. Only then implement Dynamic Form Engine if the pain is proven.
```

---

# 5. Dynamic Form Engine Gate

The Dynamic Form Engine may be proposed only when all of the following are true:

```txt
[ ] At least three independent modules or Business Object areas have hand-coded forms.
[ ] Those forms share repeated layout, validation, relation, permission, and submit patterns.
[ ] The repeated patterns are documented.
[ ] Hand-coded forms are becoming slower or riskier than metadata-driven forms.
[ ] The Design System form standards are frozen.
[ ] The Field Metadata Schema is frozen.
[ ] Zod validation conventions are frozen.
[ ] API route contracts are frozen.
[ ] Module generator safety rails are implemented.
[ ] Tenant-isolation and permission-denial tests exist for form submissions.
```

This is a specialized version of the **Three Independent Use Cases Rule**.

Three similar fields are not enough. Three similar complete form workflows are the signal.

Example valid trigger:

```txt
Employee create/edit form
Product create/edit form
Inventory adjustment form
```

If these forms repeatedly need the same layout, validation, relation picker, permission visibility, dirty state, and submit behavior, then a Dynamic Form Engine proposal may be written.

---

# 6. What the Dynamic Form Engine Is

The future Dynamic Form Engine is:

```txt
a metadata-driven form rendering system
a design-system consumer
a Zod/server-validation partner
a generator target
an AI-assisted development accelerator
a way to standardize repeated form workflows
```

It should eventually allow OneDayOS to define a form using metadata like:

```txt
fields
sections
layout
labels
help text
validation hints
visibility rules
permission hints
relation sources
submit behavior
empty/error/loading states
```

and render a consistent form UI automatically.

---

# 7. What the Dynamic Form Engine Is Not

The Dynamic Form Engine is not:

```txt
a replacement for server validation
a replacement for permission checks
a replacement for APIs
a replacement for services
a replacement for Prisma
a replacement for Zod
a replacement for module specs
a generic no-code app builder
a client-specific customization escape hatch
a way to add random customFields JSON
a workflow engine
a reporting engine
an import/export engine
a FastAPI/Python service
```

The engine renders forms. It does not decide whether a user may mutate data. It does not decide tenant identity. It does not own business workflows.

---

# 8. Relationship to Field Metadata

The Dynamic Form Engine must consume the shared Field Metadata contract, but it must not own that contract.

Field Metadata is broader than forms. It is also relevant to:

```txt
tables
search
filters
imports
exports
reports
AI context
module manifests
CRUD generators
```

Therefore, the Dynamic Form Engine may use field metadata, but it must not overload it with form-only concerns.

Field Metadata should describe the field.

Form Metadata should describe how that field appears in a specific form.

Example:

```txt
Field Metadata:
  key: "name"
  label: "Name"
  type: "text"
  required: true
  searchable: true

Form Metadata:
  form: "product.create"
  field: "name"
  section: "Basic Information"
  width: "full"
  autoFocus: true
  helpText: "Use the product name shown on internal records."
```

This separation prevents the same field from becoming trapped in one screen’s layout assumptions.

---

# 9. Future Architecture

The future Dynamic Form Engine should have these parts:

```txt
FormDefinition
FieldDefinition
FormSectionDefinition
VisibilityRule
PermissionRule
RelationSourceDefinition
SubmitDefinition
FormRenderer
FormProvider
FieldRenderer
FormErrorMapper
FormStateAdapter
```

Recommended future folder shape:

```txt
src/platform/forms/
  types.ts
  registry.server.ts
  validation.ts
  renderer/
    DynamicForm.tsx
    DynamicField.tsx
    fields/
      TextField.tsx
      NumberField.tsx
      DateField.tsx
      SelectField.tsx
      RelationField.tsx
      BooleanField.tsx
  __tests__/
```

Important: this is a **future** shape. Claude must not create this folder structure until implementation is explicitly approved.

---

# 10. Form Definition Contract

A future form definition should look conceptually like this:

```ts
type FormDefinition = {
  id: string
  version: string
  owner: FormOwner
  mode: 'create' | 'update' | 'detail' | 'custom'
  title: string
  description?: string
  resource: PermissionResourceRef
  submit: SubmitDefinition
  sections: FormSectionDefinition[]
}
```

Where:

```ts
type FormOwner =
  | { type: 'business_object'; object: 'employee' | 'product' | 'customer' | 'supplier' | 'warehouse' }
  | { type: 'module'; moduleId: string; entity: string }
```

A form must have an owner because the engine needs to know whether the form belongs to:

```txt
Business Objects
or
a specific Business Module
```

This distinction affects:

```txt
permissions
API routes
events
relation sources
extension table behavior
AI context
documentation
```

---

# 11. Form Sections

Forms should be composed of sections.

Example:

```ts
type FormSectionDefinition = {
  id: string
  label?: string
  description?: string
  columns?: 1 | 2 | 3
  fields: FormFieldDefinition[]
  visibility?: VisibilityRule
}
```

Sections support consistency across larger forms.

Examples:

```txt
Basic Information
Contact Details
Employment Details
Inventory Settings
Advanced
```

For MVP implementation later, section nesting should be forbidden.

---

# 12. Form Fields

A future form field definition should reference field metadata but may add form-specific behavior.

Example:

```ts
type FormFieldDefinition = {
  key: string
  label?: string
  placeholder?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  width?: 'full' | 'half' | 'third'
  autoFocus?: boolean
  visibility?: VisibilityRule
  permission?: PermissionRule
  relation?: RelationSourceDefinition
}
```

The field definition must not include:

```txt
orgId
tenantId
userId from client
raw SQL
JavaScript functions
server imports
Prisma query strings
arbitrary eval conditions
secrets
```

---

# 13. Supported Field Types — First Future Version

The first future implementation should support only boring, high-confidence field types:

```txt
text
textarea
number
date
datetime
boolean
select
relation
email
phone
url
currency
```

Do not include these in the first implementation:

```txt
rich text
file upload
signature
barcode scanner
image cropper
formula
repeating group
nested object editor
JSON editor
markdown editor
conditional subforms
map/location picker
```

Those fields can be added later through specific evidence.

The goal is not to support every possible form type. The goal is to standardize the 80% of forms OneDayOS repeatedly needs.

---

# 14. Validation Rules

The Dynamic Form Engine may show validation rules to the client, but server validation remains authoritative.

The future engine may use metadata such as:

```ts
type ValidationMetadata = {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  format?: 'email' | 'phone' | 'url' | 'date' | 'datetime'
}
```

But every submit still goes through:

```txt
API route
Zod schema
permission enforcement
service method
database constraints
```

The client form is allowed to help the user. It is not trusted.

---

# 15. Metadata-to-Zod Strategy

Do not start by generating server Zod schemas from metadata.

Recommended evolution:

## Phase 1 — Explicit Zod Schemas

Use hand-written or generator-written Zod schemas.

The form definition references the schema by stable key:

```ts
submit: {
  schemaKey: 'objects.product.create'
}
```

This is safer because server validation remains explicit.

## Phase 2 — Metadata-Assisted Schema Generation

After enough patterns exist, the engine may generate client-side schemas from metadata for UI validation.

Server schemas remain explicit.

## Phase 3 — Metadata-Compiled Server Schemas

Only after the metadata contract is proven should the platform consider compiling authoritative Zod schemas from metadata.

This requires:

```txt
test coverage
strict metadata validation
versioning
migration rules
review process
security review
```

Until then, metadata is not the final source of security truth.

---

# 16. Visibility Rules

The future engine may support declarative visibility rules.

Example:

```ts
type VisibilityRule = {
  when: {
    field: string
    operator: 'equals' | 'not_equals' | 'is_empty' | 'is_not_empty'
    value?: string | number | boolean | null
  }
}
```

First implementation should support only simple field-based conditions.

Do not support:

```txt
arbitrary JavaScript
server callbacks
database queries
permission queries inside client metadata
complex boolean expression trees
dynamic remote conditions
```

Important rule:

```txt
Hidden fields are not security.
```

If a user is not allowed to set a field, the server schema/service must reject it.

---

# 17. Permission Rules

The engine may use permission metadata to hide or disable fields, sections, or actions.

Example:

```ts
type PermissionRule = {
  module: string
  resource: string
  action: string
}
```

But UI permission behavior is convenience only.

All submits must still enforce permission in:

```txt
API route
service method
```

A hidden field does not protect data.

A disabled input does not protect data.

A missing submit button does not protect data.

---

# 18. Relation Fields

Relation fields are high-risk and must be designed carefully.

Examples:

```txt
Employee → Department
Employee → Branch
Product → ProductCategory
Warehouse → Branch
InventoryAdjustment → Product
InventoryAdjustment → Warehouse
```

Rules:

```txt
relation options must be tenant-scoped
relation options must exclude soft-deleted records
relation options must respect permissions where needed
relation IDs must be revalidated server-side on submit
client-supplied relation labels are ignored
relation source definitions must not contain raw Prisma queries
```

A future relation source should be declared by a safe registry key:

```ts
relation: {
  source: 'objects.product.categories'
}
```

Not by raw query metadata.

Forbidden:

```ts
relation: {
  prismaModel: 'productCategory',
  where: { orgId: '{{client.orgId}}' }
}
```

The engine must never let client metadata define database queries.

---

# 19. Submit Behavior

A future dynamic form should submit through the normal OneDayOS API contract.

Example:

```ts
type SubmitDefinition = {
  method: 'POST' | 'PATCH'
  endpoint: string
  successRedirect?: string
  successToast?: string
}
```

Endpoint examples:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/employees
/api/orgs/[orgSlug]/inventory/stock-adjustments
```

The submit engine must use:

```txt
sdkClient.api
tenant-scoped route
JSON request body
{ data, error, meta? } response shape
```

Forbidden:

```txt
submitting orgId
submitting tenantId
submitting directly to Prisma
using server actions without the API contract
redirect-style auth behavior
HTML error pages from API routes
```

---

# 20. API and Service Pattern

Dynamic forms must not bypass APIs or services.

Required path:

```txt
DynamicForm
  ↓
sdkClient.api
  ↓
tenant-scoped API route
  ↓
requireApiModuleContext / requireApiObjectContext
  ↓
Zod validation
  ↓
permission enforcement
  ↓
service method with PlatformContext
  ↓
sdk.getDb(ctx)
  ↓
event emission after successful mutation
```

Forbidden path:

```txt
DynamicForm
  ↓
direct database mutation
```

Forbidden path:

```txt
DynamicForm
  ↓
API route using body.orgId
```

Forbidden path:

```txt
DynamicForm
  ↓
service.create(orgId, input)
```

Services must continue receiving verified `PlatformContext`.

---

# 21. Tenant Isolation Rules

The Dynamic Form Engine must follow all standard OneDayOS tenancy rules:

```txt
no client-supplied orgId
orgSlug is a locator, not authorization
tenant membership is verified server-side
all database queries are scoped through PlatformContext
all relation options are tenant-scoped
all submits are tenant-scoped
all tests use at least two organizations
```

Dynamic metadata must never create a second tenant boundary.

It must use the existing Kernel boundary.

---

# 22. Business Object Forms

Business Object forms are owned by the Business Objects layer.

Examples:

```txt
objects.employee.create
objects.product.create
objects.customer.create
objects.supplier.create
objects.warehouse.create
```

Their APIs should live under:

```txt
/api/orgs/[orgSlug]/objects/employees
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/suppliers
/api/orgs/[orgSlug]/objects/warehouses
```

Their permissions should use:

```txt
objects.employee.create
objects.product.create
objects.customer.create
objects.supplier.create
objects.warehouse.create
```

Their events should use:

```txt
objects.employee.created
objects.product.created
objects.customer.created
objects.supplier.created
objects.warehouse.created
```

The Dynamic Form Engine must preserve this namespace distinction.

---

# 23. Module Forms

Module forms are owned by modules.

Examples:

```txt
inventory.stock_adjustment.create
leave.leave_request.create
purchasing.purchase_request.create
expenses.expense_claim.create
```

Their APIs should live under:

```txt
/api/orgs/[orgSlug]/inventory/stock-adjustments
/api/orgs/[orgSlug]/leave/leave-requests
/api/orgs/[orgSlug]/purchasing/purchase-requests
/api/orgs/[orgSlug]/expenses/expense-claims
```

Their permissions should use the module namespace:

```txt
inventory.stock_adjustment.create
leave.leave_request.create
purchasing.purchase_request.create
expenses.expense_claim.create
```

Their events should use module-owned event names:

```txt
inventory.stock_adjustment.created
leave.leave_request.submitted
purchasing.purchase_request.submitted
expenses.expense_claim.submitted
```

A module form may reference Business Objects, but it does not own them.

Example:

```txt
Inventory stock adjustment form references Product and Warehouse.
It does not define Product or Warehouse.
```

---

# 24. Extension Table Forms

Module extension forms are important.

Example:

```txt
Product core form:
  code
  name
  description
  category
  unit

Inventory Product Extension form:
  reorderPoint
  minimumStock
  valuationMethod
```

The Dynamic Form Engine must support the idea that one user workflow may create or update:

```txt
a Business Object
and
a module extension record
```

But permission checks remain separate.

Example: creating a Product from Inventory may require:

```txt
objects.product.create
inventory.product_extension.create
```

The service must own this transaction. The form engine merely renders the UI and submits validated input.

---

# 25. Client Configuration

Future client configuration may adjust limited form behavior:

```txt
labels
help text
default sort/order of optional fields
which optional fields are hidden
which optional fields are required if safely supported
```

But client configuration must not:

```txt
add arbitrary database columns
add unreviewed custom fields
bypass server validation
bypass permissions
rename fields in a way that breaks meaning
change core Business Object semantics
inject JavaScript
inject SQL
```

Client configuration is not a backdoor to custom apps.

---

# 26. Custom Fields

Generic custom fields are **not allowed in MVP**.

Do not implement:

```txt
customFields Json
client-defined arbitrary fields
custom field builder UI
custom field query engine
custom field report engine
```

Custom fields sound useful, but they create serious complexity:

```txt
validation
search
reports
exports
AI context
permissions
indexing
migration
support
data quality
tenant-specific behavior
```

If a client needs a field, first ask:

```txt
Is this field module-specific?
Is this field needed by multiple clients?
Is this field truly reusable?
Can it be an extension-table column?
```

Prefer explicit extension-table fields over generic custom fields.

---

# 27. Design System Integration

The Dynamic Form Engine must render using OneDayOS design-system components.

Expected future primitives:

```txt
FormShell
FormSection
FormRow
FormField
FormLabel
FormHelpText
FormError
FormActions
RelationPicker
```

The engine must support:

```txt
consistent labels
consistent spacing
consistent validation errors
tooltips/help text
keyboard navigation
loading states
dirty state
submit state
cancel behavior
empty relation states
permission-denied states
```

It must not generate generic admin-dashboard forms.

---

# 28. Accessibility Requirements

Dynamic forms must be accessible by default.

Requirements:

```txt
labels associated with inputs
errors associated with fields
keyboard navigation
visible focus states
required fields announced clearly
disabled fields explained where needed
aria-describedby for help/error text
dialog focus management when forms appear in modals
reduced motion support
```

Accessibility is not optional, because the engine will multiply any mistake across the platform.

---

# 29. Loading, Error, and Empty States

Dynamic forms must standardize:

```txt
initial loading
relation option loading
submit loading
optimistic submit where appropriate
validation errors
permission errors
not found errors
network errors
empty relation options
disabled module states
```

The engine must map API errors from the Kernel API contract into user-facing form behavior.

Example:

```txt
VALIDATION_ERROR → field-level errors when possible
FORBIDDEN → permission-denied state
UNAUTHENTICATED → session-expired flow
ORG_NOT_FOUND → safe not-found
MODULE_NOT_ENABLED → module unavailable state
```

---

# 30. Optimistic UI

Optimistic UI is allowed only when safe.

Good candidates:

```txt
create simple record
update display fields
soft delete list item
toggle active state
```

Bad candidates:

```txt
approval decisions
inventory stock movement
financial records
multi-step transaction
operations with irreversible side effects
```

For high-integrity workflows, the UI should show immediate feedback but not pretend the mutation succeeded until the server confirms.

The engine must allow workflows to opt out of optimistic behavior.

---

# 31. Events

The Dynamic Form Engine must not emit business events directly.

Events are emitted by services after successful mutations.

Correct:

```txt
DynamicForm submits input.
API validates.
Service mutates database.
Service emits event.
```

Incorrect:

```txt
DynamicForm emits objects.product.created.
```

The form engine does not know whether the mutation truly succeeded.

---

# 32. AI-Assisted Forms

The Dynamic Form Engine is important for AI-assisted development, but AI must not bypass review.

Future AI may help generate:

```txt
field metadata
form metadata
help text
validation hints
layout suggestions
test cases
```

AI must not independently decide:

```txt
database schema
tenant rules
permission rules
server validation
business workflows
custom fields
sensitive data exposure
```

AI-generated metadata must pass validation, tests, and human review before use.

---

# 33. Relationship to Form Generator

The Form Generator and Dynamic Form Engine are different.

```txt
Form Generator:
  generates static React/Zod form code

Dynamic Form Engine:
  renders forms at runtime from metadata
```

The correct order is:

```txt
hand-coded forms
then Form Generator
then Dynamic Form Engine
```

Do not jump directly to runtime dynamic forms.

---

# 34. Relationship to Dynamic CRUD Engine

The Dynamic Form Engine is not the Dynamic CRUD Engine.

Dynamic CRUD would coordinate:

```txt
list page
detail page
create form
edit form
delete behavior
API routes
service methods
permissions
events
tests
```

Dynamic Form Engine only handles the form rendering part.

Dynamic CRUD remains separately deferred.

---

# 35. Relationship to Import/Export

The Dynamic Form Engine may reuse field metadata, but it does not own import/export.

Form metadata can include hints like:

```txt
importable
exportable
```

but actual import/export behavior belongs to a separate future engine.

---

# 36. Relationship to Search and Reporting

The Dynamic Form Engine does not decide search/report behavior.

Field metadata may indicate:

```txt
searchable
filterable
sortable
exportable
```

but Search and Reporting Services must independently enforce:

```txt
tenant isolation
permissions
soft delete
module enablement
sensitive field exclusions
```

---

# 37. Sensitive Fields

Some fields must be handled carefully.

Examples:

```txt
salary
government IDs
bank details
personal addresses
phone numbers
email addresses
medical information
security-sensitive notes
```

The Dynamic Form Engine must support sensitivity metadata, but must not automatically expose sensitive fields to:

```txt
search
exports
AI context
event payloads
activity feed
audit summaries
```

Sensitive field handling requires explicit policy.

---

# 38. Versioning

Form definitions must be versioned.

Example:

```ts
{
  id: 'objects.product.create',
  version: '1.0.0'
}
```

Changes that are compatible:

```txt
help text change
placeholder change
layout width change
adding optional field
reordering fields
```

Changes that may be breaking:

```txt
removing field
renaming field key
changing field type
making optional field required
changing relation source
changing submit endpoint
changing permission requirement
```

Breaking form changes require review when clients are already using that workflow.

---

# 39. Storage Location

First future implementation should store form definitions in code, not the database.

Preferred first approach:

```txt
static TypeScript form definitions
version controlled
reviewed in PRs
tested in CI
```

Do not start with DB-stored form definitions.

Database-stored definitions create immediate complexity:

```txt
admin UI
versioning
validation
rollback
tenant overrides
migration
security review
support burden
```

DB-stored definitions may be considered later for selected client configuration, but not for the first Dynamic Form Engine.

---

# 40. Testing Requirements

When the Dynamic Form Engine is eventually implemented, it must include tests for:

```txt
renders supported field types
renders sections
renders help text
renders validation errors
does not render forbidden orgId field
rejects unsupported field types
evaluates simple visibility rules
does not treat hidden fields as security
submits to tenant-scoped API
maps API validation errors to fields
handles 401 JSON
handles 403 JSON
handles safe 404
handles relation option loading
does not import server-only SDK into client renderer
does not emit events directly
```

Security-sensitive tests must include at least two organizations.

---

# 41. Architecture Checks

The platform should eventually block these patterns:

```txt
orgId rendered as hidden form input
tenantId rendered as hidden form input
import { sdk } from '@/sdk/server' inside client form renderer
import { prisma } from '@/kernel/db/client' inside form renderer
form metadata containing raw SQL
form metadata containing JavaScript functions
form metadata containing service imports
form submit endpoint outside /api/orgs/[orgSlug]/...
dynamic form service accepting orgId string
```

The engine must be designed so unsafe patterns are difficult or impossible.

---

# 42. First Future Implementation Scope

When the gate is eventually passed, the first implementation should be intentionally small.

Allowed:

```txt
static form definitions in code
text field
textarea field
number field
date field
boolean field
select field
relation field through registry key
sections
help text
required indicators
client-side validation hints
API error mapping
tenant-scoped submit
basic dirty state
basic loading state
```

Not allowed in first implementation:

```txt
DB-stored forms
custom fields UI
drag-and-drop builder
workflow conditions
complex expression language
file uploads
rich text
nested/repeating fields
AI runtime form creation
arbitrary module actions
multi-step wizard
public forms
offline forms
```

---

# 43. Implementation Sequence — Future

When approved later, implementation should happen in this order:

```txt
1. Freeze Design System form standards.
2. Freeze Field Metadata Schema.
3. Collect three proven hand-coded forms.
4. Write Dynamic Form Engine ADR.
5. Write implementation spec.
6. Implement static form definition types.
7. Implement metadata validation tests.
8. Implement renderer for basic fields.
9. Implement API error mapping.
10. Implement one Business Object form as pilot.
11. Implement one module form as pilot.
12. Add architecture checks.
13. Update Form Generator to optionally target the engine.
```

Do not implement multiple complicated forms at once. Pilot with the simplest form first.

---

# 44. Claude Implementation Rules

Claude must obey these rules:

```txt
Do not implement this engine until explicitly instructed.
Do not create a no-code builder.
Do not create DB-stored form definitions.
Do not add customFields JSON.
Do not add FastAPI, Python, Pydantic, Alembic, or SQLAlchemy.
Do not bypass Zod validation.
Do not bypass API contracts.
Do not bypass PlatformContext.
Do not accept client-supplied orgId.
Do not import Kernel internals from modules.
Do not emit business events from the form renderer.
Do not generate untested dynamic runtime behavior.
```

If Claude is asked to implement a form before the engine exists, it should create a hand-coded form following the design system and validation standards.

---

# 45. Anti-Patterns

Reject these patterns:

```txt
"Let's build one generic form renderer now."
"Let's store all fields in JSON so clients can customize anything."
"Let's let AI create forms directly in production."
"Let's hide orgId in a form input."
"Let's trust hidden fields."
"Let's use metadata instead of Zod."
"Let's make visibility rules arbitrary JavaScript."
"Let's build a drag-and-drop builder for admins."
"Let's generate Prisma migrations from form metadata."
"Let's make every field searchable/exportable by default."
"Let's implement the engine before the first official module."
```

These create long-term platform risk.

---

# 46. Acceptance Criteria for This Document

This document is accepted when:

```txt
[ ] It clearly defers implementation.
[ ] It explains why the engine should wait.
[ ] It defines what the engine is and is not.
[ ] It preserves tenant isolation and permission rules.
[ ] It preserves server validation.
[ ] It separates Field Metadata from Form Metadata.
[ ] It defines safe future architecture.
[ ] It defines first implementation boundaries.
[ ] It gives Claude clear forbidden actions.
```

---

# 47. Founder Summary

The Dynamic Form Engine is one of the most important long-term accelerators for OneDayOS, but it should not be built too early.

For now:

```txt
Build good hand-coded forms.
Make them consistent.
Learn the real patterns.
Use metadata carefully.
Let generators help first.
Only build the runtime engine when repetition proves it is worth it.
```

The goal is not to create a generic no-code form builder.

The goal is to make OneDayOS faster to build without making it weaker, uglier, or less secure.

---

# 48. Final Rule

```txt
A dynamic form is not automatically a good form.
A dynamic form is not automatically a secure form.
A dynamic form is not automatically a platform advantage.

The advantage comes from correct metadata,
strong validation,
consistent design,
safe APIs,
verified tenant context,
and repeated real-world patterns.
```

Therefore, the Dynamic Form Engine is planned, but deferred.
