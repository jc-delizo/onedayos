# OneDayOS Engineering Manual — Field Metadata Schema

**Document ID:** `11-dynamic-systems/04-field-metadata-schema.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Contract Required Now; Dynamic Runtime Deferred`  
**Owner:** OneDayOS Founder / Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/01-sdk-public-api.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `11-dynamic-systems/00-dynamic-systems-philosophy.md`

---

# 1. Purpose

The Field Metadata Schema defines the shared language OneDayOS will eventually use to describe fields across:

```txt
Forms
Tables
Search
Filters
Import
Export
Reports
AI context
Dynamic CRUD
Generated CRUD
Generated forms
Module manifests
Business Object documentation
```

This document exists now so future dynamic systems are aligned before Claude or any engineer invents incompatible metadata formats.

The goal is not to build a Dynamic Form Engine today.

The goal is to define the metadata contract that future engines and generators will depend on.

---

# 2. Core Principle

Field metadata describes how a field should behave across the platform.

It does not replace:

```txt
Database schema
Zod validation
Permission enforcement
Tenant isolation
Service-layer business rules
API authorization
Prisma migrations
```

The server remains the authority.

Metadata is a contract, not a security boundary by itself.

---

# 3. Implementation Status

This document is required now as a design contract.

The following are allowed now:

```txt
Shared TypeScript metadata types
Static metadata definitions
Metadata validation tests
Module manifest metadata fields
Business Object metadata documentation
Generator planning
```

The following are not allowed yet:

```txt
Dynamic Form Engine
Dynamic CRUD Engine
Runtime field renderer
Custom Fields Service
No-code form builder
Client-configurable schema builder
Dynamic database migration from metadata
AI-generated production CRUD without review
```

Claude must not implement any runtime dynamic system from this document alone.

---

# 4. Why Field Metadata Matters

Without a shared metadata language, every subsystem will describe fields differently.

That leads to this:

```txt
Forms define fields one way.
Tables define columns another way.
Search defines searchable fields another way.
Imports define mappings another way.
AI context describes entities another way.
Reports define filters another way.
```

This becomes unmaintainable.

OneDayOS needs one metadata vocabulary that can grow over time.

---

# 5. Non-Goals

This document does not define:

```txt
A working Dynamic Form Engine
A working Dynamic CRUD Engine
A custom field system
A workflow engine
A report builder
A database schema generator
A visual form builder
A no-code app builder
A replacement for Prisma
A replacement for Zod
A replacement for permissions
A replacement for service-layer rules
```

If Claude implements any of those from this document, it is overbuilding.

---

# 6. Metadata Design Principles

## 6.1 Metadata must be declarative

Metadata should be plain serializable data.

Allowed:

```ts
{
  key: 'name',
  label: 'Name',
  type: 'text',
  required: true,
}
```

Forbidden:

```ts
{
  key: 'name',
  validate: (value) => customRuntimeLogic(value),
  visible: () => currentUser.isAdmin,
}
```

No executable functions should be embedded in metadata.

Reason: executable metadata is hard to validate, hard to serialize, hard to test, hard to render safely, and dangerous for future AI-generated configuration.

---

## 6.2 Metadata must not contain tenant identity

Field metadata must never ask the client to provide:

```txt
orgId
organizationId
tenantId
```

Tenant identity comes from:

```txt
authenticated session
+ orgSlug route
+ verified PlatformContext
```

Never from metadata.

Never from hidden form fields.

Never from client input.

---

## 6.3 Metadata should describe product behavior, not database internals

Good metadata:

```txt
Label: Reorder Point
Type: Number
Help text: Alert when stock goes below this quantity.
Required: false
Editable: users with inventory.product.update
```

Bad metadata:

```txt
DB column: inventory_product_extensions.reorder_point
SQL: SELECT reorder_point FROM inventory_product_extensions
Join: LEFT JOIN products ON ...
```

The metadata may reference an entity and field key, but it should not expose raw SQL or low-level query instructions.

---

## 6.4 Metadata must support reuse across systems

A field should not need separate definitions for:

```txt
form input
table column
search filter
import column
export column
AI context
```

The same field metadata can include system-specific sections.

Example:

```ts
{
  key: 'name',
  label: 'Name',
  type: 'text',
  required: true,
  table: { visibleByDefault: true, sortable: true },
  search: { searchable: true, weight: 'high' },
  import: { importable: true, required: true },
  export: { exportable: true },
}
```

---

## 6.5 Metadata must be conservative

Do not add metadata properties because they might be useful someday.

Every property should have a known future purpose.

When unsure, leave it out.

Field metadata is part of the platform contract. Bad metadata becomes technical debt.

---

# 7. Field Metadata Is Not Security

Metadata can describe permission requirements.

But metadata does not enforce them.

This is only a hint:

```ts
permissions: {
  read: { module: 'objects', resource: 'employee', action: 'read' },
  update: { module: 'objects', resource: 'employee', action: 'update' },
}
```

Security must still be enforced in:

```txt
API routes
Service methods
SDK permission helpers
Database access patterns
Tests
```

UI hiding is never enough.

Metadata should help render correct UI, but the server must remain authoritative.

---

# 8. Field Metadata and Zod

Zod remains the validation authority for API bodies, forms, imports, settings, events, and AI output.

Field metadata may eventually generate or assist Zod schemas, but it does not replace Zod.

Good future direction:

```txt
Field metadata → generated Zod schema → server validates input
```

Bad direction:

```txt
Field metadata → client-side validation only → API trusts client
```

Server validation is mandatory.

Client validation is UX.

---

# 9. Field Metadata and Prisma

Prisma remains the database schema and migration authority.

Field metadata must not auto-create Prisma models, columns, or migrations.

Forbidden:

```txt
Add field metadata
→ automatically alter production database
```

Required:

```txt
Architecture decision
→ Prisma migration
→ Zod schema update
→ service update
→ metadata update
→ tests
```

Metadata follows the schema.

Metadata does not secretly become the schema.

---

# 10. Field Metadata and Dynamic Systems

Field metadata is a foundation for future dynamic systems.

But the existence of metadata does not mean these engines exist now:

```txt
Dynamic Form Engine
Dynamic CRUD Engine
Dynamic Table View Engine
Import/Export Engine
View Builder
AI CRUD Generator
```

Those remain deferred until repeated hand-coded patterns prove the need.

---

# 11. Entity Metadata

Fields should belong to an Entity Metadata definition.

An entity is one of:

```txt
Business Object
Module-owned entity
Module extension entity
Platform Service entity
Kernel entity
```

For MVP and near-term module work, the main categories are:

```txt
Business Object
Module-owned entity
Module extension entity
```

## 11.1 Entity Metadata Type

Recommended shape:

```ts
export type EntityKind =
  | 'business_object'
  | 'module_entity'
  | 'module_extension'
  | 'kernel_entity'
  | 'platform_service_entity'

export type EntityMetadata = {
  id: string
  kind: EntityKind
  namespace: string
  label: string
  pluralLabel: string
  description?: string
  fields: FieldMetadata[]
}
```

Example:

```ts
export const productEntityMetadata: EntityMetadata = {
  id: 'objects.product',
  kind: 'business_object',
  namespace: 'objects',
  label: 'Product',
  pluralLabel: 'Products',
  description: 'Shared product identity used across Inventory, Purchasing, and Sales.',
  fields: [],
}
```

Example module extension:

```ts
export const inventoryProductExtensionMetadata: EntityMetadata = {
  id: 'inventory.product_extension',
  kind: 'module_extension',
  namespace: 'inventory',
  label: 'Inventory Product Settings',
  pluralLabel: 'Inventory Product Settings',
  description: 'Inventory-specific behavior attached to a shared Product.',
  fields: [],
}
```

---

# 12. Field Metadata Core Type

Recommended base shape:

```ts
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'multi_select'
  | 'relation'
  | 'email'
  | 'phone'
  | 'url'
  | 'computed'

export type FieldSource =
  | 'system'
  | 'business'
  | 'module'
  | 'computed'

export type FieldMetadata = {
  key: string
  label: string
  type: FieldType
  source: FieldSource

  description?: string
  helpText?: string
  placeholder?: string

  required?: boolean
  nullable?: boolean
  readOnly?: boolean

  validation?: FieldValidation
  options?: FieldOption[]
  relation?: RelationMetadata

  display?: FieldDisplayMetadata
  form?: FieldFormMetadata
  table?: FieldTableMetadata
  filter?: FieldFilterMetadata
  search?: FieldSearchMetadata
  import?: FieldImportMetadata
  export?: FieldExportMetadata
  ai?: FieldAIMetadata
  sensitivity?: FieldSensitivityMetadata
  permissions?: FieldPermissionMetadata

  lifecycle?: FieldLifecycleMetadata
}
```

This type is intentionally broad enough to support future systems, but not so broad that it becomes a full no-code language.

---

# 13. Field Key Rules

Field keys must be stable.

They are contracts used by forms, tables, imports, exports, search, reports, and AI context.

## 13.1 Required format

Field keys should use camelCase:

```txt
name
employeeNo
hiredAt
reorderPoint
minimumStock
createdAt
```

Forbidden:

```txt
Employee No
employee-no
employee_no
EmployeeNo
```

Reason: field keys should match TypeScript/Zod/Prisma-style properties.

---

## 13.2 Field key stability

Once a field key is used in production, renaming it is a breaking change.

Renaming requires:

```txt
ADR or manual approval
migration plan
API compatibility review
import/export review
AI context review
tests
release note
```

---

## 13.3 Reserved field keys

These fields are system-controlled and must not be accepted from client input:

```txt
id
orgId
createdAt
updatedAt
deletedAt
deletedBy
createdBy
updatedBy
```

Some may appear in read-only table/detail metadata.

Example allowed:

```ts
{
  key: 'createdAt',
  label: 'Created',
  type: 'datetime',
  source: 'system',
  readOnly: true,
  table: { visibleByDefault: false },
  export: { exportable: true },
}
```

Example forbidden:

```ts
{
  key: 'orgId',
  label: 'Organization',
  type: 'text',
  form: { input: true },
}
```

`orgId` must never be included in client-facing form metadata.

---

# 14. Field Source

Every field should have a source.

## 14.1 `system`

System-managed field.

Examples:

```txt
id
createdAt
updatedAt
deletedAt
deletedBy
```

Usually read-only.

---

## 14.2 `business`

Core Business Object or module business field.

Examples:

```txt
Product.name
Customer.phone
Employee.employeeNo
Warehouse.code
```

---

## 14.3 `module`

Module-specific extension field.

Examples:

```txt
InventoryProductExtension.reorderPoint
PurchasingSupplierExtension.paymentTerms
CRMCustomerExtension.leadSource
```

---

## 14.4 `computed`

Calculated field not directly stored as user input.

Examples:

```txt
currentStock
availableBalance
daysUntilRenewal
isLowStock
```

Computed fields must not be editable.

---

# 15. Validation Metadata

Validation metadata describes future validation generation behavior.

Zod remains the real validation engine.

Recommended type:

```ts
export type FieldValidation = {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  integer?: boolean
  decimalPlaces?: number
  pattern?: string
  format?: 'email' | 'phone' | 'url' | 'date' | 'datetime'
  allowedValues?: string[]
}
```

Rules:

```txt
Validation metadata must be expressible declaratively.
Validation metadata must not contain functions.
Validation metadata must be enforceable server-side.
Validation metadata must match Zod schemas.
```

Bad:

```ts
validation: {
  custom: '(value) => value.startsWith("EMP-")'
}
```

Good:

```ts
validation: {
  pattern: '^EMP-[0-9]{4}$'
}
```

---

# 16. Select Options

Select fields may define static options.

```ts
export type FieldOption = {
  label: string
  value: string
  description?: string
  colorToken?: string
}
```

Example:

```ts
{
  key: 'employmentType',
  label: 'Employment Type',
  type: 'select',
  source: 'business',
  required: true,
  options: [
    { label: 'Full-time', value: 'full_time' },
    { label: 'Part-time', value: 'part_time' },
    { label: 'Contractor', value: 'contractor' },
  ],
}
```

Rules:

```txt
Static options are allowed.
Dynamic options should use relation metadata.
Options must be stable once used in production.
Changing option values may be a data migration.
Labels may change; values should not casually change.
```

---

# 17. Relation Metadata

Relation fields are high-risk because they can accidentally leak cross-tenant data.

Recommended type:

```ts
export type RelationMetadata = {
  targetEntity: string
  valueField: string
  labelField: string
  descriptionField?: string
  optionEndpoint?: string
  requiredPermission?: PermissionRequirement
}
```

Example:

```ts
{
  key: 'categoryId',
  label: 'Category',
  type: 'relation',
  source: 'business',
  relation: {
    targetEntity: 'objects.product_category',
    valueField: 'id',
    labelField: 'name',
    optionEndpoint: '/api/orgs/[orgSlug]/objects/product-categories/options',
    requiredPermission: {
      module: 'objects',
      resource: 'product_category',
      action: 'read',
    },
  },
}
```

Rules:

```txt
Relation options must be loaded server-side or through tenant-scoped APIs.
Relation option APIs must use PlatformContext.
Relation IDs must be revalidated server-side on submit.
Relation metadata must not contain raw SQL.
Relation metadata must not allow cross-org lookups.
```

Client-selected IDs are untrusted.

The service must verify that selected related records belong to the same organization.

---

# 18. Display Metadata

Display metadata controls how values appear.

Recommended type:

```ts
export type FieldDisplayMetadata = {
  format?:
    | 'plain'
    | 'badge'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'relative_time'
    | 'email'
    | 'phone'
    | 'link'
  emptyText?: string
  align?: 'left' | 'center' | 'right'
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}
```

Rules:

```txt
Display metadata should not affect stored value.
Display metadata should not enforce security.
Display metadata should use design-system tokens, not arbitrary colors.
```

Bad:

```ts
display: { color: '#FF0000' }
```

Better:

```ts
options: [
  { label: 'Active', value: 'active', colorToken: 'success' },
  { label: 'Inactive', value: 'inactive', colorToken: 'muted' },
]
```

---

# 19. Form Metadata

Form metadata describes how a field should appear in a future generated form.

Recommended type:

```ts
export type FieldFormMetadata = {
  input?: boolean
  component?:
    | 'text_input'
    | 'textarea'
    | 'number_input'
    | 'currency_input'
    | 'date_picker'
    | 'datetime_picker'
    | 'checkbox'
    | 'select'
    | 'multi_select'
    | 'relation_select'
  section?: string
  order?: number
  autoFocus?: boolean
}
```

Rules:

```txt
Form metadata must never include orgId.
Form metadata must not include hidden tenant fields.
Form metadata must not include server-only secrets.
Form metadata must not define executable validation.
Form metadata must match Zod schemas.
```

Generated forms should submit only business input.

The API creates `PlatformContext` from session and route.

---

# 20. Table Metadata

Table metadata describes how a field should appear in a future generated table.

Recommended type:

```ts
export type FieldTableMetadata = {
  visibleByDefault?: boolean
  sortable?: boolean
  resizable?: boolean
  sticky?: boolean
  order?: number
}
```

Rules:

```txt
Sortable fields must be backed by safe server-side sorting.
Hidden columns are not security.
Sensitive fields should not be sent to the client unless authorized.
Tables must exclude soft-deleted records by default.
```

---

# 21. Filter Metadata

Filter metadata describes whether a field can be used in filters.

Recommended type:

```ts
export type FieldFilterMetadata = {
  filterable?: boolean
  operators?: FilterOperator[]
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'between'
  | 'in'
```

Rules:

```txt
Filters must be converted to safe server-side query logic.
Filters must not become raw SQL.
Filters must respect orgId through PlatformContext.
Filters must exclude soft-deleted records by default.
Filters must respect permissions and module enablement.
```

---

# 22. Search Metadata

Search metadata describes whether a field should be searchable.

Recommended type:

```ts
export type FieldSearchMetadata = {
  searchable?: boolean
  weight?: 'low' | 'normal' | 'high'
}
```

Rules:

```txt
Search Service is deferred.
Module-local search is allowed.
Search metadata prepares future indexing.
Search must be tenant-scoped.
Search must respect permissions.
Search must exclude soft-deleted records.
Sensitive fields should usually not be searchable.
```

Example:

```ts
{
  key: 'name',
  label: 'Name',
  type: 'text',
  source: 'business',
  search: { searchable: true, weight: 'high' },
}
```

---

# 23. Import Metadata

Import metadata describes how a field may participate in future CSV/Excel imports.

Recommended type:

```ts
export type FieldImportMetadata = {
  importable?: boolean
  required?: boolean
  aliases?: string[]
  example?: string
}
```

Rules:

```txt
Import Engine is deferred.
Imports must validate server-side.
Imports must use PlatformContext.
Imports must never accept orgId.
Imports must revalidate relation IDs or relation labels.
Imports must produce clear row-level errors.
Imports must not bypass permissions.
```

Example:

```ts
{
  key: 'employeeNo',
  label: 'Employee No.',
  type: 'text',
  source: 'business',
  import: {
    importable: true,
    required: true,
    aliases: ['Employee Number', 'Employee ID', 'Emp No'],
    example: 'EMP-0001',
  },
}
```

---

# 24. Export Metadata

Export metadata describes whether a field may be included in exports.

Recommended type:

```ts
export type FieldExportMetadata = {
  exportable?: boolean
  label?: string
  defaultIncluded?: boolean
}
```

Rules:

```txt
Export Engine is deferred.
Export must use PlatformContext.
Export requires explicit permission.
Export must respect sensitivity rules.
Export must exclude soft-deleted records by default.
Export must not leak fields hidden from the user.
```

Read permission does not automatically mean export permission.

---

# 25. AI Metadata

AI metadata describes how a field may be explained to future AI features.

Recommended type:

```ts
export type FieldAIMetadata = {
  includeInContext?: boolean
  description?: string
  exampleValues?: string[]
  sensitivity?: 'public' | 'internal' | 'sensitive'
}
```

Rules:

```txt
AI Layer is deferred.
AI metadata must not expose secrets.
AI metadata must not expose unnecessary PII.
AI queries must use PlatformContext.
AI must respect permissions.
AI must not generate arbitrary SQL.
```

Example:

```ts
{
  key: 'reorderPoint',
  label: 'Reorder Point',
  type: 'number',
  source: 'module',
  ai: {
    includeInContext: true,
    description: 'Quantity threshold that indicates when the product should be reordered.',
    exampleValues: ['10', '50', '100'],
  },
}
```

---

# 26. Sensitivity Metadata

Some fields contain sensitive information.

Recommended type:

```ts
export type FieldSensitivityMetadata = {
  level: 'normal' | 'personal' | 'sensitive' | 'restricted'
  reason?: string
}
```

Examples:

```txt
normal: product name, warehouse code
personal: employee phone, customer email
sensitive: salary, government ID, bank account
restricted: secrets, tokens, confidential internal notes
```

Rules:

```txt
Sensitive fields should not be included in events by default.
Sensitive fields should not be included in AI context by default.
Sensitive fields should not be exported without explicit permission.
Sensitive fields should not appear in global search unless approved.
```

For MVP, avoid placing highly sensitive fields in core Business Objects unless absolutely required.

---

# 27. Permission Metadata

Permission metadata references the permissions required to see or modify a field.

Recommended type:

```ts
export type PermissionRequirement = {
  module: string
  resource: string
  action: string
}

export type FieldPermissionMetadata = {
  read?: PermissionRequirement
  create?: PermissionRequirement
  update?: PermissionRequirement
  export?: PermissionRequirement
}
```

Example:

```ts
permissions: {
  read: { module: 'objects', resource: 'employee', action: 'read' },
  update: { module: 'objects', resource: 'employee', action: 'update' },
  export: { module: 'objects', resource: 'employee', action: 'export' },
}
```

Rules:

```txt
Field permission metadata is not enforcement.
APIs and services still enforce permissions.
Field-level permissions are deferred unless proven needed.
Do not implement ABAC here.
```

---

# 28. Lifecycle Metadata

Lifecycle metadata describes field stability.

Recommended type:

```ts
export type FieldLifecycleMetadata = {
  status: 'draft' | 'stable' | 'deprecated' | 'removed'
  since?: string
  deprecatedSince?: string
  removalTarget?: string
  replacementField?: string
}
```

Rules:

```txt
Stable fields are compatibility contracts.
Deprecated fields should remain readable until migration is complete.
Removed fields require migration and release notes.
```

This is especially important for exports, reports, AI context, and saved views later.

---

# 29. Visibility Rules

Complex visibility conditions are deferred.

For now, prefer simple metadata:

```ts
form: { input: true }
table: { visibleByDefault: true }
```

Future conditional visibility may use declarative rules:

```ts
export type VisibilityRule = {
  field: string
  operator: 'equals' | 'not_equals' | 'in' | 'is_empty' | 'is_not_empty'
  value?: string | number | boolean | string[]
}
```

But this must not be implemented until Dynamic Forms are approved.

Do not add arbitrary JavaScript visibility functions.

---

# 30. Required Metadata Validation

If metadata types are implemented, they should be validated.

At minimum, tests should prove:

```txt
field keys are unique within an entity
field keys use camelCase
reserved client-input fields are rejected
relation fields include relation metadata
select fields include options
computed fields are read-only
metadata contains no functions
permission requirements use valid shape
entity IDs are unique
```

Example validation test intent:

```ts
expect(validateEntityMetadata(productEntityMetadata)).toEqual({ ok: true })
```

Do not rely only on TypeScript.

Runtime validation is helpful because metadata may later be generated by Claude or AI tools.

---

# 31. Business Object Metadata Examples

## 31.1 Product

```ts
export const productFields: FieldMetadata[] = [
  {
    key: 'code',
    label: 'Code',
    type: 'text',
    source: 'business',
    required: true,
    helpText: 'Unique product code within this organization.',
    validation: { minLength: 1, maxLength: 64 },
    table: { visibleByDefault: true, sortable: true, order: 10 },
    search: { searchable: true, weight: 'high' },
    import: { importable: true, required: true, aliases: ['SKU', 'Item Code'] },
    export: { exportable: true, defaultIncluded: true },
    permissions: {
      read: { module: 'objects', resource: 'product', action: 'read' },
      update: { module: 'objects', resource: 'product', action: 'update' },
    },
  },
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    source: 'business',
    required: true,
    validation: { minLength: 1, maxLength: 160 },
    table: { visibleByDefault: true, sortable: true, order: 20 },
    search: { searchable: true, weight: 'high' },
    import: { importable: true, required: true, aliases: ['Product Name', 'Item Name'] },
    export: { exportable: true, defaultIncluded: true },
  },
  {
    key: 'unit',
    label: 'Unit',
    type: 'text',
    source: 'business',
    required: true,
    helpText: 'Base unit of measure, such as pcs, kg, liter, or box.',
    table: { visibleByDefault: true, sortable: true, order: 30 },
    import: { importable: true, required: false, example: 'pcs' },
    export: { exportable: true, defaultIncluded: true },
  },
]
```

## 31.2 Inventory Product Extension

```ts
export const inventoryProductExtensionFields: FieldMetadata[] = [
  {
    key: 'reorderPoint',
    label: 'Reorder Point',
    type: 'number',
    source: 'module',
    required: false,
    helpText: 'Alert when available stock drops below this quantity.',
    validation: { min: 0, integer: true },
    table: { visibleByDefault: true, sortable: true },
    filter: { filterable: true, operators: ['less_than_or_equal', 'greater_than_or_equal'] },
    import: { importable: true, required: false, example: '10' },
    export: { exportable: true, defaultIncluded: true },
    permissions: {
      read: { module: 'inventory', resource: 'product_extension', action: 'read' },
      update: { module: 'inventory', resource: 'product_extension', action: 'update' },
    },
  },
]
```

This keeps Product clean while allowing Inventory to add stock-specific behavior.

---

# 32. Forbidden Metadata Patterns

## 32.1 Client-supplied orgId

Forbidden:

```ts
{
  key: 'orgId',
  label: 'Organization',
  type: 'text',
  form: { input: true },
}
```

Reason: tenant identity is never client input.

---

## 32.2 Executable functions

Forbidden:

```ts
{
  key: 'amount',
  visible: (ctx) => ctx.user.role === 'admin',
}
```

Reason: metadata must be serializable and auditable.

---

## 32.3 Raw SQL

Forbidden:

```ts
{
  key: 'totalSales',
  sql: 'SELECT SUM(amount) FROM sales WHERE org_id = ...',
}
```

Reason: metadata must not become a query engine.

---

## 32.4 Generic custom fields in MVP

Forbidden:

```ts
{
  key: 'customFields',
  type: 'json',
}
```

Reason: this creates a hidden schema inside JSON and weakens validation, search, reporting, import/export, AI, and support.

Custom Fields Service is not part of MVP.

---

## 32.5 Module-owned copies of Business Objects

Forbidden:

```txt
inventory.productName
crm.customerName
leave.employeeName
```

When these represent shared objects, use Business Objects instead:

```txt
objects.product.name
objects.customer.name
objects.employee.name
```

Module-specific extension fields belong in extension tables.

---

# 33. Where Metadata Should Live

Exact folders may be finalized in the Repository Architecture document, but the intended direction is:

```txt
Shared metadata types:
  exported from @/sdk

Business Object metadata:
  close to Business Object service/schema definitions

Module metadata:
  inside the module package

Module manifest:
  may reference or include module metadata
```

Example future structure:

```txt
src/sdk/
  metadata.ts

src/business-objects/product/
  metadata.ts

src/modules/inventory/
  metadata.ts
  manifest.ts
```

Rules:

```txt
Metadata files must not import @/kernel/*.
Metadata files must not import @/sdk/server.
Metadata files must not import Prisma.
Metadata files must not import service methods.
Metadata files must remain safe to import in build-time/generator contexts.
```

---

# 34. Metadata in Module Manifests

Module manifests may declare fields for future systems.

But manifest field metadata must be pure metadata.

Good:

```ts
export const inventoryManifest = {
  id: 'inventory',
  fields: inventoryProductExtensionFields,
}
```

Bad:

```ts
export const inventoryManifest = {
  id: 'inventory',
  fields: await loadFieldsFromDatabase(),
}
```

Manifest metadata should not require database access.

---

# 35. Metadata and AI-Assisted Development

Claude and future AI generators may use field metadata to generate:

```txt
forms
tables
schemas
docs
tests
import mappings
export definitions
AI context
```

Therefore, metadata must be explicit and boring.

Ambiguous metadata causes bad AI output.

Bad:

```ts
{ key: 'status', type: 'text' }
```

Better:

```ts
{
  key: 'status',
  label: 'Status',
  type: 'select',
  source: 'business',
  required: true,
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
  helpText: 'Controls whether this record is available for new transactions.',
}
```

---

# 36. Metadata and Import/Export Safety

Import/export will eventually be high-risk because it can move large volumes of data.

Metadata must support future safety controls:

```txt
which fields are importable
which fields are exportable
which fields are required
which field names have aliases
which fields contain personal/sensitive data
which permission is required to export
```

Import/export must never become a shortcut around APIs and services.

---

# 37. Metadata and Search Safety

Search metadata must eventually prevent accidental sensitive search exposure.

Example:

```ts
{
  key: 'email',
  label: 'Email',
  type: 'email',
  sensitivity: { level: 'personal', reason: 'Contact information' },
  search: { searchable: false },
}
```

Personal or sensitive fields should not be searchable by default.

Search must respect:

```txt
tenancy
permissions
module enablement
soft delete
field sensitivity
```

---

# 38. Metadata and Reports

Reporting Service is deferred, but metadata can prepare future report field selection.

Reportable fields should eventually be declared explicitly.

Do not assume every table field is reportable.

Example future extension:

```ts
report?: {
  reportable?: boolean
  aggregate?: 'count' | 'sum' | 'avg' | 'min' | 'max'
}
```

This is intentionally not included in the core type yet.

Reason: reporting patterns are not proven.

---

# 39. Compatibility Rules

Field metadata is a compatibility contract.

Breaking changes include:

```txt
renaming a field key
changing field type
removing an option value
changing import behavior
changing export behavior
changing sensitivity level downward
changing relation target
removing a field from AI context that AI workflows depend on
```

Non-breaking changes may include:

```txt
improving label text
adding helpText
adding placeholder
adding export label
making table hidden by default if not relied on
adding a new optional field
```

When clients already use a module, field metadata changes should be reviewed carefully.

---

# 40. Testing Requirements

When metadata types and validators are implemented, tests must cover:

```txt
valid Business Object field metadata
valid module extension field metadata
invalid field keys
reserved field input rejection
relation fields without relation metadata
select fields without options
computed fields marked editable
metadata containing functions
duplicate field keys
permission shape validation
sensitivity defaults
```

Generated module tests should also ensure generated metadata does not contain:

```txt
orgId as form input
raw SQL
functions
customFields JSON
module-owned copies of Business Objects
```

---

# 41. Acceptance Criteria

This document is accepted when:

```txt
[ ] Founder agrees Field Metadata is a contract, not a runtime engine.
[ ] Founder agrees Dynamic Forms and Dynamic CRUD remain deferred.
[ ] Metadata explicitly rejects client-supplied orgId.
[ ] Metadata explicitly rejects executable functions.
[ ] Metadata supports forms, tables, search, imports, exports, AI, and future generators.
[ ] Metadata does not replace Zod, Prisma, APIs, services, or permissions.
[ ] Business Object and module extension examples are clear.
[ ] Claude implementation boundaries are clear.
```

---

# 42. Claude Implementation Boundaries

Claude may implement from this document only if explicitly instructed.

Allowed limited implementation:

```txt
Create shared TypeScript metadata types.
Create metadata validation helpers.
Create tests for metadata validation.
Create static example metadata for Business Objects or generated module templates.
```

Forbidden implementation:

```txt
Dynamic Form Engine
Dynamic CRUD Engine
Runtime form renderer
Runtime table renderer
Custom Fields Service
Metadata-driven database migrations
AI CRUD generator
Report builder
Search indexer
Import/export engine
```

Required Claude instruction:

```txt
Implement only the metadata type contract and tests.
Do not implement any runtime dynamic system.
Do not add custom fields.
Do not add database migrations unless separately specified.
Do not accept client-supplied orgId.
Do not import @/kernel/* from metadata files.
```

---

# 43. Founder Notes

Field metadata is one of the most important long-term accelerators for OneDayOS.

But it is also one of the easiest places to overbuild.

The correct strategy is:

```txt
Define the metadata language early.
Use it lightly in manifests and generators.
Hand-code real forms and tables first.
Observe repeated patterns.
Only then build dynamic engines.
```

Do not confuse metadata maturity with engine maturity.

OneDayOS can have a strong metadata contract before it has a Dynamic Form Engine.

That is the right order.

---

# 44. Final Rule

Field metadata should make future automation possible.

It should not turn OneDayOS into an unstable no-code platform before the core product is proven.

