# OneDayOS Engineering Manual — Dynamic Systems Philosophy

**Document ID:** `11-dynamic-systems/00-dynamic-systems-philosophy.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Philosophy Required Now; Dynamic System Implementations Deferred`  
**Owner:** OneDayOS Founder / Software Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `05-sdk/00-sdk-overview.md`
- `06-data/00-database-architecture.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `09-cli-generators/00-generator-philosophy.md`
- `10-platform-services/01-three-client-rule.md`

---

# 1. Purpose

This document defines the OneDayOS philosophy for **Dynamic Systems**.

Dynamic Systems are long-term platform capabilities that allow OneDayOS to generate, configure, render, and operate business software from metadata instead of hand-written code.

Examples include:

```txt
Dynamic Form Engine
Dynamic CRUD Engine
Dynamic Table View Engine
Field Metadata Schema
Import/Export Engine
View Builder
```

These systems are central to the long-term OneDayOS vision, but they must not be implemented prematurely.

The purpose of this document is to prevent two opposite mistakes:

```txt
Mistake 1: Never building dynamic systems.
Result: OneDayOS becomes a slow custom-development agency.

Mistake 2: Building dynamic systems too early.
Result: OneDayOS becomes a weak no-code platform with wrong abstractions.
```

The correct path is:

```txt
Build strong conventions first.
Hand-code enough real modules.
Observe repetition.
Extract metadata.
Then build dynamic systems from proven patterns.
```

---

# 2. Executive Summary

Dynamic Systems are not part of the restarted foundation build.

They are planned extension points.

They should be documented now so the platform architecture is prepared for them, but Claude must not implement them until the evidence exists.

The foundation build should prioritize:

```txt
Kernel
SDK
Tenant isolation
Permissions
Business Objects
Module System
Generator safety
Design System
Hand-coded first modules
```

Only after repeated real patterns emerge should OneDayOS implement:

```txt
Dynamic Form Engine
Dynamic CRUD Engine
Dynamic Table Engine
Import/Export Engine
View Builder
```

The guiding rule is:

```txt
Dynamic Systems should be extracted from real module repetition,
not invented from abstract imagination.
```

---

# 3. What Dynamic Systems Are

A Dynamic System is a reusable platform capability that uses metadata to generate or render software behavior.

Instead of writing every form, table, API, and CRUD page by hand, the platform eventually describes business entities using metadata such as:

```txt
field name
field label
field type
validation
permissions
visibility
searchability
sortability
filterability
importability
exportability
display behavior
relationship behavior
AI context
```

The platform can then use that metadata to drive:

```txt
forms
tables
filters
search
imports
exports
AI assistance
CRUD pages
validation
permissions
reports
```

This is the long-term acceleration engine for OneDayOS.

---

# 4. What Dynamic Systems Are Not

Dynamic Systems are not a license to build a generic no-code product immediately.

They are not:

```txt
A replacement for good architecture
A replacement for a design system
A replacement for domain modeling
A replacement for permissions
A replacement for tenant isolation
A replacement for tests
A way to skip module specifications
A way to let Claude invent business logic
A way to store everything in JSON
A way to avoid writing migrations
A way to create client-specific hacks
```

Dynamic Systems should make proven patterns faster.

They should not make unclear patterns vague.

---

# 5. The Core Principle

The core principle is:

```txt
Metadata should describe known patterns.
It should not hide unknown architecture.
```

Bad dynamic architecture starts with this:

```txt
Let's make everything configurable.
```

Good dynamic architecture starts with this:

```txt
We have implemented the same pattern three times.
We understand it.
Now we can describe it with metadata.
```

---

# 6. Why Dynamic Systems Matter to OneDayOS

OneDayOS is not trying to become a normal software agency.

The long-term goal is to become the fastest platform for delivering internal business software to SMEs.

That requires a path from:

```txt
Manual module implementation
```

to:

```txt
Generated module implementation
```

to:

```txt
Metadata-driven module implementation
```

to:

```txt
AI-assisted business software assembly
```

Without Dynamic Systems, OneDayOS will eventually slow down as module count and client count increase.

With premature Dynamic Systems, OneDayOS will become brittle, generic, and difficult to debug.

The timing matters.

---

# 7. Required Development Sequence

The correct sequence is:

```txt
1. Hand-code the first high-quality modules.
2. Use consistent Design System patterns.
3. Use consistent SDK and service patterns.
4. Use consistent API contracts.
5. Use consistent validation patterns.
6. Use consistent table and form patterns.
7. Observe repetition across modules.
8. Extract stable metadata.
9. Generate code from metadata.
10. Later, render dynamic behavior from metadata.
```

The wrong sequence is:

```txt
1. Build a generic form engine.
2. Build a generic CRUD engine.
3. Force all modules into it.
4. Discover real business workflows do not fit.
5. Add escape hatches.
6. Add more escape hatches.
7. End up with a confusing internal framework.
```

OneDayOS must avoid the wrong sequence.

---

# 8. Dynamic Systems vs Generators

Dynamic Systems are related to generators, but they are not the same thing.

## 8.1 Generators

Generators create static code.

Example:

```txt
npm run module:create inventory
```

The generator outputs normal files:

```txt
manifest.ts
schema.ts
service.ts
api route files
page files
tests
```

After generation, the code is edited, tested, reviewed, and deployed like normal code.

Generators are safer early because they produce explicit code that engineers and Claude can inspect.

## 8.2 Dynamic Systems

Dynamic Systems interpret metadata at runtime or build time.

Example:

```ts
const fields = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    searchable: true,
  },
]
```

The platform then renders or generates behavior from the metadata.

Dynamic Systems are more powerful, but also riskier.

## 8.3 Rule

For OneDayOS MVP:

```txt
Prefer static generators before runtime dynamic systems.
```

This gives us speed without hiding too much logic too early.

---

# 9. Dynamic Systems vs Platform Services

Dynamic Systems are not automatically Platform Services.

Some Dynamic Systems may eventually become Platform Services, but they need their own evidence and acceptance criteria.

Examples:

```txt
Dynamic Form Engine       → likely Platform Service later
Dynamic CRUD Engine       → likely Platform Service later
Dynamic Table View Engine → likely Platform Service later
Import/Export Engine      → likely Platform Service later
View Builder              → likely Platform Service later
```

However, they should not be implemented just because they appear in the roadmap.

They must pass the Three Independent Use Cases Rule or a stricter manual gate.

---

# 10. The Dynamic Systems Gate

A Dynamic System may only move from deferred planning to implementation when all of the following are true:

```txt
[ ] At least three independent modules or workflows show the same repeated pattern
[ ] The repeated pattern has been implemented by hand at least twice
[ ] The repeated pain is documented
[ ] The metadata shape is clear
[ ] The security model is clear
[ ] The tenant model is clear
[ ] The permission model is clear
[ ] The Design System behavior is clear
[ ] The API behavior is clear
[ ] The test strategy is clear
[ ] The first implementation can be narrow
[ ] Founder/architect approves promotion
[ ] An implementation-grade manual document exists
[ ] Claude receives a narrow implementation task
```

If these conditions are not met, implementation is not allowed.

---

# 11. First Dynamic System Candidate: Field Metadata

The first dynamic concept OneDayOS should define is **Field Metadata**.

Field Metadata is not a full engine.

It is the common language future systems can share.

A field metadata contract can later support:

```txt
forms
tables
search
filters
imports
exports
AI context
reports
validation hints
```

But defining the contract does not mean implementing a full Dynamic Form Engine or CRUD Engine.

The likely future shape is:

```ts
type FieldMetadata = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  description?: string
  helpText?: string
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  importable?: boolean
  exportable?: boolean
  visible?: VisibilityRule
  editable?: PermissionRule
  display?: DisplayMetadata
  relation?: RelationMetadata
}
```

This contract should be written before any engine.

---

# 12. Dynamic Form Engine Philosophy

The Dynamic Form Engine is the future system that renders forms from metadata.

It is deferred.

## 12.1 Why Deferred

Forms look simple, but business forms hide complexity:

```txt
validation
conditional fields
permissions
relation loading
server validation
optimistic UI
error display
dirty state
mobile layout
field help
accessibility
multi-step flows
approval side effects
module-specific behavior
```

A premature form engine will either be too weak or too flexible.

Too weak means real modules cannot use it.

Too flexible means it becomes a hard-to-debug framework.

## 12.2 Required Evidence

Before implementing the Dynamic Form Engine, OneDayOS should have at least three hand-coded forms from real modules.

Examples:

```txt
Product create/edit form
Employee create/edit form
Inventory adjustment form
Leave request form
Expense claim form
Purchase request form
```

After these exist, we can ask:

```txt
What field patterns repeat?
What validation patterns repeat?
What layout patterns repeat?
What permission patterns repeat?
What relation-loading patterns repeat?
What cannot be generalized yet?
```

Only then should the engine be designed.

## 12.3 What Not To Build First

Do not start with:

```txt
drag-and-drop form builder
custom field builder
client-editable schema builder
JSON-only entity storage
workflow-aware forms
public form builder
visual no-code editor
```

Those are later possibilities, not foundation work.

---

# 13. Dynamic CRUD Engine Philosophy

The Dynamic CRUD Engine is the future system that generates or renders standard CRUD behavior from metadata.

It is deferred.

## 13.1 Why Deferred

CRUD is dangerous because it appears generic but often is not.

A simple CRUD page hides many business decisions:

```txt
Who can create?
Who can edit?
Who can delete?
Is delete allowed or only deactivate?
What event should emit?
What fields are required?
What fields are tenant-scoped?
What related records must be checked?
What happens to soft-deleted records?
What appears in search?
What appears in export?
What should be optimistic?
What must be transactional?
```

If OneDayOS builds a generic CRUD engine too early, it may generate unsafe or shallow software.

## 13.2 Required Evidence

Before implementing a Dynamic CRUD Engine, OneDayOS should have at least three stable CRUD patterns.

Examples:

```txt
Business Object CRUD: Product
Business Object CRUD: Customer
Module extension CRUD: InventoryProductExtension
Module-owned CRUD: StockAdjustment
Module-owned CRUD: LeaveRequest
```

These should reveal which CRUD parts are truly generic and which remain domain-specific.

---

# 14. Dynamic Table View Engine Philosophy

The Dynamic Table View Engine is the future system for configurable table views.

It may support:

```txt
columns
sorting
filtering
saved views
per-user preferences
org defaults
exports
bulk actions
```

It is deferred, but tables should be designed now with future configurability in mind.

## 14.1 Current Rule

During the foundation and first modules:

```txt
Build excellent hand-coded tables using shared Design System components.
```

Do not build configurable saved views yet.

## 14.2 Why Deferred

Saved views introduce complexity:

```txt
view permissions
user preferences
org-wide defaults
filter serialization
query validation
backward compatibility
field renames
export behavior
AI query mapping
```

These are real platform features and should not be rushed.

---

# 15. Import/Export Engine Philosophy

Import/export is a high-value future capability for SME onboarding.

It is also high-risk.

Imports can corrupt data quickly if poorly designed.

Exports can leak data quickly if poorly secured.

Therefore, the Import/Export Engine is deferred.

## 15.1 Future Import Requirements

A future import system must handle:

```txt
tenant isolation
permission checks
file parsing
schema validation
row-level validation
relation matching
duplicate detection
dry run
error report
partial success policy
rollback strategy
audit/event behavior
large file handling
background jobs
```

## 15.2 Future Export Requirements

A future export system must handle:

```txt
permission checks
export-specific permissions
field-level restrictions
soft-delete exclusion
PII awareness
large exports
background jobs
file expiration
audit events
```

## 15.3 Current Rule

Do not implement a generic import/export engine in the restarted foundation build.

If a first module needs export, implement a small module-local export only with founder approval and evidence logging.

---

# 16. View Builder Philosophy

The View Builder is a future system for saved views and user-configurable data screens.

It is deferred.

A future View Builder may support:

```txt
saved filters
saved sorts
visible columns
grouping
personal views
shared org views
module default views
kanban views
calendar views
```

For MVP, this is too early.

The first priority is to create excellent standard views that work for most SMEs.

---

# 17. Dynamic Systems and Tenant Isolation

Dynamic Systems must never bypass tenant isolation.

All dynamic behavior must be tenant-scoped through verified `PlatformContext`.

Forbidden:

```ts
renderDynamicCrud({ orgId: body.orgId })
loadDynamicForm({ orgId: searchParams.get('orgId') })
runDynamicQuery({ tenant: clientTenant })
```

Required:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, moduleId)
await DynamicCrudService.list(ctx, metadata, query)
```

Dynamic metadata must not become a way to trust client-submitted tenant identity.

---

# 18. Dynamic Systems and Permissions

Dynamic Systems must never bypass permissions.

A Dynamic Form Engine must know:

```txt
Who can view the form?
Who can submit the form?
Who can edit each field?
Who can see relation options?
Who can perform the resulting action?
```

A Dynamic CRUD Engine must know:

```txt
Who can list records?
Who can create records?
Who can read details?
Who can update records?
Who can soft-delete records?
Who can restore records?
Who can export records?
```

A Dynamic Table Engine must know:

```txt
Who can see which columns?
Who can apply which filters?
Who can bulk update?
Who can export?
```

UI hiding is not security.

Dynamic APIs and services must enforce permissions server-side.

---

# 19. Dynamic Systems and Business Objects

Dynamic Systems must respect the Business Object architecture.

They must not generate duplicate shared entities.

Forbidden generated entities:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
InventoryWarehouse
```

Correct pattern:

```txt
Product
Customer
Employee
Supplier
Warehouse

plus module-owned extension tables when needed
```

Dynamic metadata must distinguish between:

```txt
Shared Business Object fields
Module extension fields
Module-owned entity fields
Computed/display fields
```

This distinction is mandatory.

---

# 20. Dynamic Systems and Events

Dynamic Systems must emit correct business events.

A generated or dynamic mutation is still a real business mutation.

Therefore it must follow event rules:

```txt
Business Object mutation → objects.* event
Module-owned mutation → module.* event
Extension-table mutation → module extension event
```

Examples:

```txt
objects.product.created
objects.customer.updated
inventory.stock_adjustment.created
inventory.product_extension.updated
```

Dynamic Systems must not emit vague events like:

```txt
crud.record.created
form.submitted
data.changed
```

Those are not stable business contracts.

---

# 21. Dynamic Systems and Soft Delete

Dynamic Systems must enforce soft delete by default.

Generated or dynamic delete behavior must mean:

```txt
set deletedAt
set deletedBy
emit deleted event
hide from normal reads
allow restore only with explicit permission
```

Dynamic Systems must not hard-delete business records by default.

They must also not expose deleted records unless the caller uses an explicit restore/admin path with permission.

---

# 22. Dynamic Systems and Validation

Dynamic Systems must use Zod-backed validation.

Metadata is not enough.

Bad:

```txt
field metadata exists, therefore input is safe
```

Good:

```txt
field metadata generates or maps to a Zod schema
server validates all input
unknown fields are rejected
client-supplied orgId is rejected
```

Dynamic metadata and validation schemas must stay aligned.

If they drift, server validation wins.

---

# 23. Dynamic Systems and AI

AI is a major reason Dynamic Systems matter.

In the future, AI should be able to help generate:

```txt
forms
CRUD screens
field metadata
module specs
validation rules
reports
import mappings
search filters
```

But AI must generate inside strict architecture.

AI must not invent:

```txt
tenant model
permission model
event names
Business Object ownership
API response shape
module folder structure
raw Prisma shortcuts
custom per-client forks
```

Dynamic Systems give AI a safe target.

Instead of asking AI:

```txt
Build a leave app.
```

OneDayOS should eventually ask:

```txt
Generate metadata and static code for a Leave Request entity using the approved module, form, CRUD, table, permission, and event contracts.
```

---

# 24. Dynamic Systems and Design System

Dynamic Systems must inherit the OneDayOS Design System.

They must not generate generic admin UI.

Dynamic forms and tables must follow:

```txt
layout standards
spacing standards
field standards
table standards
empty states
loading states
error states
keyboard navigation
accessibility standards
motion standards
```

If the Design System is weak, Dynamic Systems will scale weak UI.

Therefore, Dynamic Systems must wait until the Design System is strong enough to encode.

---

# 25. Dynamic Systems and Client Configuration

Dynamic Systems should eventually make client configuration faster.

However, configuration must not become uncontrolled customization.

Allowed future configuration:

```txt
labels
visible fields
required fields where safe
module settings
view defaults
saved filters
import mappings
export templates
```

Dangerous configuration:

```txt
arbitrary database fields
arbitrary JavaScript
arbitrary SQL
client-edited permission logic
client-edited workflow code
client-edited validation code that bypasses server validation
```

The goal is controlled configurability, not unlimited no-code editing.

---

# 26. Dynamic Systems and One-Day Delivery

Dynamic Systems support the one-day delivery promise, but only after they are mature.

In the early phase, one-day delivery should come from:

```txt
standard modules
safe generators
strong conventions
reusable Business Objects
shared Design System
clear client scope
configuration
```

Later, one-day delivery can become faster through:

```txt
metadata-driven forms
metadata-driven CRUD
import mapping
saved views
AI-assisted module assembly
```

But the early platform must not depend on immature dynamic engines.

---

# 27. The No-Code Trap

OneDayOS must not accidentally become a bad no-code platform.

Bad no-code platforms often suffer from:

```txt
unclear data models
weak permissions
slow UI
generic screens
hard-to-debug workflows
customer-specific hacks
schema stored only as JSON
fragile integrations
no testability
poor migration story
```

OneDayOS should instead become:

```txt
architecture-first
schema-first
SDK-first
tenant-safe
permission-safe
testable
generator-friendly
metadata-assisted
AI-assisted
```

Dynamic Systems should strengthen the architecture, not replace it.

---

# 28. MVP Dynamic Systems Policy

During the restarted foundation build, Claude is allowed to implement:

```txt
No Dynamic Form Engine
No Dynamic CRUD Engine
No Dynamic Table View Engine
No Import/Export Engine
No View Builder
No Custom Fields Service
No Workflow Builder
No client-editable schema builder
```

Claude may implement only:

```txt
static module generator contracts
static API generator contracts
static form generator contracts as deferred specs
static CRUD generator contracts as deferred specs
field metadata type placeholders if required by manifest types
```

Even field metadata should remain simple and non-runtime until approved.

---

# 29. Allowed Now

The restarted foundation build may include simple metadata fields in module manifests for future compatibility.

Allowed:

```ts
fields?: FieldMetadata[]
```

But these fields must not drive runtime behavior yet unless a later approved document says so.

Allowed use today:

```txt
documentation
AI context preparation
future generator hints
manual review
```

Not allowed today:

```txt
runtime form rendering
runtime CRUD rendering
runtime query generation
client-editable metadata
production behavior depending on unfrozen metadata
```

---

# 30. Deferred Documents Under This Section

The following documents should be written, but most should remain deferred:

```txt
11-dynamic-systems/01-dynamic-form-engine.md
11-dynamic-systems/02-dynamic-crud-engine.md
11-dynamic-systems/03-dynamic-table-view-engine.md
11-dynamic-systems/04-field-metadata-schema.md
11-dynamic-systems/05-import-export-engine.md
11-dynamic-systems/06-view-builder.md
```

Recommended writing order:

```txt
1. Field Metadata Schema
2. Dynamic Form Engine
3. Dynamic CRUD Engine
4. Dynamic Table View Engine
5. Import/Export Engine
6. View Builder
```

However, implementation should remain blocked until the gates are met.

---

# 31. Anti-Patterns

The following patterns are forbidden unless a future ADR explicitly approves them.

## 31.1 Everything Table

Forbidden:

```txt
Record
RecordField
RecordValue
```

as the primary data model for business modules.

Reason: it destroys relational integrity, queryability, migrations, type safety, and performance.

## 31.2 Universal JSON Fields

Forbidden:

```txt
customFields Json
```

as the default way to add business fields.

Reason: it hides schema decisions and makes validation, permissions, search, and reporting harder.

## 31.3 Dynamic Permissions Without Enforcement

Forbidden:

```txt
metadata says field is hidden, so API does not check permission
```

Reason: UI metadata is not security.

## 31.4 Client-Editable Business Schema

Forbidden for MVP:

```txt
client admins create arbitrary new database fields
client admins edit validation logic
client admins define workflows with arbitrary conditions
```

Reason: this becomes a no-code platform before OneDayOS has strong platform primitives.

## 31.5 Arbitrary SQL Reports

Forbidden:

```txt
AI-generated SQL
client-written SQL
module-generated SQL without review
```

Reason: tenant isolation, permission enforcement, and data leakage risk.

## 31.6 Runtime Business Logic in Metadata

Forbidden:

```json
{
  "onSubmit": "if amount > 50000 then require approval"
}
```

Reason: business logic becomes hidden, untested, and unsafe.

---

# 32. Future Promotion Example: Dynamic Forms

A correct promotion path might look like this:

```txt
1. Product form is hand-coded.
2. Employee form is hand-coded.
3. Supplier form is hand-coded.
4. Inventory adjustment form is hand-coded.
5. Repetition is observed:
   - text fields
   - select fields
   - relation fields
   - validation
   - help text
   - required state
   - permission visibility
6. Field Metadata Schema is finalized.
7. Dynamic Form Engine spec is written.
8. ADR approves first narrow engine.
9. Claude implements engine for simple create/edit forms only.
10. Existing hand-coded forms are migrated one by one.
```

A wrong path would be:

```txt
1. Build a generic form renderer immediately.
2. Force Inventory to use it.
3. Add hacks for Inventory.
4. Add hacks for Leave.
5. Add hacks for Expenses.
6. Now the engine is unmaintainable.
```

---

# 33. Future Promotion Example: Import/Export

A correct promotion path might look like this:

```txt
1. Inventory needs Product import.
2. Implement a narrow Product import manually.
3. Expenses needs receipt/category import.
4. Implement a narrow Expenses import manually.
5. CRM needs Customer import.
6. Repeated import needs are clear.
7. Evidence log shows shared import lifecycle:
   - file upload
   - column mapping
   - validation
   - dry run
   - row errors
   - commit
8. Import/Export Engine proposal is written.
9. ADR approves narrow CSV import engine.
10. Claude implements it as Platform Service.
```

This is better than building a generic importer on day one without knowing real SME data issues.

---

# 34. Relationship to AI-Assisted Development

Dynamic Systems should eventually give Claude and other AI agents a stable target.

Instead of AI generating random code, AI should generate:

```txt
approved metadata
approved schemas
approved service skeletons
approved tests
approved module manifests
```

This improves speed while preserving architecture.

The Engineering Manual should become the guardrail that lets AI move fast without inventing the platform.

---

# 35. Relationship to AppCare

Dynamic Systems can reduce AppCare cost later by standardizing:

```txt
forms
tables
validation
imports
exports
views
```

But immature Dynamic Systems can increase AppCare cost by creating bugs that are hard to debug.

Therefore, OneDayOS should prioritize maintainable hand-coded patterns before runtime abstraction.

The goal is not just faster delivery.

The goal is lower long-term support burden.

---

# 36. Implementation Instructions for Claude

Claude must follow these rules:

```txt
Do not implement Dynamic Form Engine.
Do not implement Dynamic CRUD Engine.
Do not implement Dynamic Table View Engine.
Do not implement Import/Export Engine.
Do not implement View Builder.
Do not create customFields JSON as a shortcut.
Do not build generic no-code infrastructure.
Do not generate arbitrary SQL systems.
Do not add FastAPI or Python backend services for dynamic systems.
Do not make metadata client-editable.
Do not trust client-supplied orgId.
Do not bypass PlatformContext.
Do not bypass permissions.
Do not bypass Zod validation.
```

Claude may:

```txt
Implement hand-coded forms.
Implement hand-coded tables.
Implement static generators when approved.
Define shared TypeScript types for future metadata when approved.
Add documentation comments preparing future extraction.
Write tests that make future extraction safer.
```

If Claude believes a Dynamic System is needed, it must stop and report:

```txt
The requested task appears to require a deferred Dynamic System.
Per Engineering Manual 11-dynamic-systems/00, implementation is not allowed without a frozen subsystem document and promotion approval.
```

---

# 37. Acceptance Criteria

This document is accepted when:

```txt
[ ] Dynamic Systems are understood as long-term accelerators, not foundation features
[ ] Dynamic Forms are explicitly deferred
[ ] Dynamic CRUD is explicitly deferred
[ ] Dynamic Tables are explicitly deferred
[ ] Import/Export Engine is explicitly deferred
[ ] View Builder is explicitly deferred
[ ] Static generators are distinguished from runtime Dynamic Systems
[ ] Field Metadata is identified as the first safe dynamic contract
[ ] Tenant isolation requirements are clear
[ ] Permission requirements are clear
[ ] Business Object boundaries are clear
[ ] Event requirements are clear
[ ] Claude implementation restrictions are clear
```

---

# 38. Founder Review Questions

Before freezing this document, answer:

```txt
1. Do we agree that Dynamic Systems are deferred?
2. Do we agree that generators come before runtime dynamic engines?
3. Do we agree that Field Metadata is the first dynamic contract to design?
4. Do we agree that client-editable schemas are not MVP?
5. Do we agree that customFields JSON is forbidden as the default shortcut?
6. Do we agree that Dynamic Forms require proven hand-coded forms first?
7. Do we agree that Dynamic CRUD requires proven hand-coded CRUD first?
8. Do we agree that Import/Export requires separate security review?
```

---

# 39. Final Rule

The final rule is:

```txt
Do not build dynamic systems to avoid thinking.
Build dynamic systems only after thinking has produced repeatable patterns.
```

OneDayOS should eventually become highly metadata-driven.

But first, it must become architecturally correct.
