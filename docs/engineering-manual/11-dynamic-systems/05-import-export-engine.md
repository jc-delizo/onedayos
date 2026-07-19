# OneDayOS Engineering Manual — Import / Export Engine

**Document ID:** `11-dynamic-systems/05-import-export-engine.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Deferred — Contract Only, with Limited Onboarding Scripts Allowed`  
**Author:** ChatGPT, acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
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
- `06-data/03-soft-delete-archival.md`
- `06-data/05-data-validation-zod.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/04-module-permissions.md`
- `09-cli-generators/06-generator-safety-rails.md`
- `10-platform-services/10-background-jobs.md`
- `11-dynamic-systems/00-dynamic-systems-philosophy.md`
- `11-dynamic-systems/04-field-metadata-schema.md`

---

# 1. Purpose

This document defines the future Import / Export Engine for OneDayOS.

The Import / Export Engine is the future shared system for moving structured business data into and out of OneDayOS safely, consistently, and tenant-correctly.

It may eventually support:

```txt
CSV imports
CSV exports
Excel imports
Excel exports
bulk validation
preview before commit
row-level error reports
field mapping
import templates
export templates
import history
export history
background processing
AI-assisted column mapping
```

However, this document does **not** authorize implementation of the full engine during the restarted foundation build.

The purpose of this document is to define the future contract so Claude, future engineers, and generators do not invent unsafe import/export patterns later.

---

# 2. Key Decision

The full Import / Export Engine is deferred.

But limited, controlled onboarding import scripts are allowed.

This is an important nuance.

OneDayOS must eventually support fast client onboarding. Philippine SMEs will often provide existing records in spreadsheets:

```txt
employee lists
product lists
customer lists
supplier lists
warehouse lists
stock counts
asset registers
leave balances
```

So we should not pretend imports are irrelevant.

But we should also not build a generic no-code import/export platform too early.

The correct decision is:

```txt
Foundation build:
  No full Import / Export Engine.
  No generic import UI.
  No user-facing import builder.
  No background import system.
  No saved mappings.
  No dynamic import metadata runtime.

Allowed now:
  Founder/developer-run onboarding scripts.
  Carefully reviewed one-off CSV cleanup scripts.
  Module-local import helpers only if absolutely needed.
  Manual data seeding/provisioning for first clients.

Future:
  Promote into a real Import / Export Engine once repeated patterns are proven.
```

---

# 3. Why This Is Deferred

Import/export looks simple but becomes complicated quickly.

A naive import feature can accidentally create:

```txt
cross-tenant writes
invalid foreign keys
duplicate records
corrupted stock balances
unvalidated employee data
permission bypasses
soft-deleted record resurrection
silent partial imports
PII leaks through exports
huge serverless timeouts
untraceable data changes
```

A generic import/export engine touches almost every sensitive part of the platform:

```txt
tenancy
permissions
validation
Business Objects
module extension tables
soft delete
background jobs
events
audit future
storage future
exports
AI future
support operations
```

Building it too early would slow the restarted platform and distract from the foundation.

The immediate priority remains:

```txt
Kernel
SDK
Security
Database
Business Objects
Module System
Generators
Design System
First real module
```

The full Import / Export Engine should come after real modules reveal repeated import/export patterns.

---

# 4. What This Is

The future Import / Export Engine is a platform capability for structured data movement.

It should eventually provide consistent behavior for:

```txt
importing records
validating rows
mapping columns
showing row-level errors
previewing changes
committing valid rows
rejecting invalid rows
exporting filtered data
respecting permissions
respecting tenant boundaries
respecting soft delete
tracking import/export history
```

It should eventually serve both Business Objects and module-owned entities.

Examples:

```txt
Business Object imports:
  employees
  products
  customers
  suppliers
  warehouses

Module imports:
  stock counts
  inventory adjustments
  asset registers
  expense categories
  leave balances
  visitor pre-registration lists
```

---

# 5. What This Is Not

The Import / Export Engine is not:

```txt
not a generic database importer
not a raw SQL importer
not a Prisma model explorer
not a no-code schema builder
not a data warehouse
not a backup system
not a BI system
not an ETL platform
not a migration engine
not a replacement for Prisma migrations
not a replacement for Zod validation
not a replacement for services
not a permission bypass
not a tenant bypass
not a background job system by itself
not a file attachment system
not an AI data cleaner by default
```

It must never become a way for clients, admins, or Claude to write arbitrary database changes.

---

# 6. Relationship to Other Systems

## 6.1 Import / Export vs Migrations

Migrations change the database schema.

Imports change business data.

```txt
Migration:
  Add products.barcode column.

Import:
  Load 1,000 product rows from CSV.
```

The Import / Export Engine must never create or modify database schema.

All schema changes remain Prisma migrations.

---

## 6.2 Import / Export vs Backup / Restore

Backup/restore is disaster recovery.

Import/export is structured data movement.

```txt
Backup/restore:
  Recover production database after incident.

Import/export:
  Load initial customer list or export products to CSV.
```

An export file is not a full backup.

An import file is not a restore mechanism.

---

## 6.3 Import / Export vs Attachments

A CSV import file is an operational upload.

A business attachment is a user-facing file attached to a record.

The future Import / Export Engine may temporarily store uploaded import files, but it must not become the general Attachment Service.

Attachment Service remains deferred separately.

---

## 6.4 Import / Export vs Background Jobs

Small imports may run synchronously in the future.

Large imports should eventually use Background Jobs.

Background Jobs remain deferred.

Therefore, the first full Import / Export Engine implementation should not happen until the Background Jobs decision is clear, unless the scope is intentionally limited to small synchronous imports.

---

## 6.5 Import / Export vs Dynamic Forms / Dynamic CRUD

Field Metadata can help import/export later.

But Import / Export must not depend on the Dynamic Form Engine or Dynamic CRUD Engine existing.

The future engine may use field metadata for:

```txt
labels
field types
required fields
exportability
importability
sensitivity
relation metadata
```

But server-side Zod schemas and service rules remain authoritative.

---

## 6.6 Import / Export vs AI

AI may eventually help map spreadsheet columns.

Example:

```txt
CSV column: Item Name
OneDayOS field: product.name
```

But AI must not:

```txt
auto-commit imports without review
invent fields
bypass validation
bypass permissions
run arbitrary SQL
modify tenant identity
silently merge records
```

AI-assisted import mapping is deferred.

---

# 7. Three Levels of Import / Export

OneDayOS should distinguish three levels.

---

## 7.1 Level 1 — Founder / Developer Onboarding Scripts

**Allowed during foundation and early clients.**

These are internal scripts run by the OneDayOS team during client onboarding.

Examples:

```txt
scripts/import-products.ts
scripts/import-customers.ts
scripts/import-employees.ts
scripts/import-suppliers.ts
```

Rules:

```txt
must be tenant-scoped
must require explicit orgSlug or orgId from operator config
must never accept orgId from a client-facing UI
must use platform services or SDK patterns where available
must validate input
must dry-run before write
must log row errors
must be reviewed before production use
must not be exposed to client users
```

These scripts are practical for one-day delivery.

They are not the Platform Import / Export Engine.

---

## 7.2 Level 2 — Module-Local Import / Export

**Allowed only with founder/architect approval.**

A module may temporarily implement its own import/export if only that module needs it.

Example:

```txt
Inventory needs stock count CSV import.
```

If only Inventory needs this, keep it inside Inventory.

Do not create a generic Import / Export Engine yet.

Rules:

```txt
must use PlatformContext
must reject client-supplied orgId
must use module permissions
must validate every row
must emit relevant events after successful mutations
must test tenant isolation
must test permission denial
must test soft delete behavior
must log the use case in the evidence log
```

---

## 7.3 Level 3 — Platform Import / Export Engine

**Deferred.**

This is the future shared engine.

It should be considered only after repeated independent use cases prove it.

Example evidence:

```txt
Use case 1: Product import for Inventory onboarding
Use case 2: Employee import for Leave onboarding
Use case 3: Customer import for CRM onboarding
```

Once three independent use cases exist, write:

```txt
Import / Export Engine proposal
ADR
schema design
SDK contract
API contract
permission model
UI contract
background job decision
security test plan
implementation plan for Claude
```

Only then should Claude implement the shared engine.

---

# 8. Promotion Rule

The Import / Export Engine follows the Three Independent Use Cases Rule.

One use case:

```txt
Keep it local or script-based.
```

Two use cases:

```txt
Align patterns.
Start evidence log.
Do not abstract yet unless the duplication is painful and safe to abstract.
```

Three use cases:

```txt
Write Platform Service / Dynamic System proposal.
Review architecture.
Approve or reject promotion.
```

Three use cases trigger review, not automatic implementation.

---

# 9. MVP Allowed Import Pattern

For early client onboarding, internal scripts may use this safe pattern.

```txt
1. Operator selects target org.
2. Script loads CSV locally.
3. Script validates headers.
4. Script validates rows.
5. Script resolves relation references tenant-safely.
6. Script prints dry-run summary.
7. Operator confirms.
8. Script writes through approved service or SDK path.
9. Script logs created/updated/skipped/failed rows.
10. Script emits events if services do not already emit them.
```

Internal scripts should prefer services over direct database calls.

If services do not exist yet, scripts may use approved server-only data access, but must still enforce:

```txt
tenant scoping
validation
soft delete behavior
uniqueness constraints
relation safety
idempotency
```

---

# 10. Import Safety Rules

Every import mechanism, script-based or future engine-based, must follow these rules.

## 10.1 No Client-Supplied `orgId`

Client-supplied `orgId` is forbidden.

Bad:

```ts
const orgId = row.orgId
```

Bad:

```ts
const orgId = body.orgId
```

Good:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
```

Good for internal scripts:

```ts
const ctx = await createOperatorVerifiedContext({ orgSlug: 'demo-corp' })
```

The tenant target must come from an authenticated/authorized context or from an explicit trusted operator script argument, never from uploaded data.

---

## 10.2 Validate Before Writing

Imports must validate all rows before committing whenever practical.

Validation should include:

```txt
required fields
field types
string length
number ranges
date formats
allowed enum values
relation existence
uniqueness within file
uniqueness within organization
soft-deleted conflicts
permission constraints
module enablement
```

Partial validation is dangerous because it may create half-imported business state.

---

## 10.3 Relation Resolution Must Be Tenant-Safe

Imports should not trust raw database IDs from spreadsheets.

Preferred relation keys:

```txt
employeeNo
productCode
warehouseCode
customerName plus disambiguator
supplierName plus disambiguator
branchCode or branchName
```

Bad:

```txt
productId from spreadsheet
employeeId from spreadsheet
warehouseId from spreadsheet
```

If IDs are accepted in internal scripts, they must be revalidated by `orgId`.

Example:

```ts
const product = await db.product.findFirst({
  where: {
    id: input.productId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Never use tenant-scoped `findUnique({ where: { id } })` for imported relations unless the unique constraint includes `orgId`.

---

## 10.4 Imports Must Be Idempotent When Possible

Running an import twice should not duplicate records accidentally.

Preferred patterns:

```txt
upsert by org-specific code
skip duplicate rows
show duplicate warning
require explicit update mode
```

Examples:

```txt
Product import key: orgId + code
Employee import key: orgId + employeeNo
Warehouse import key: orgId + code
```

For records without stable codes, imports should be create-only unless an explicit matching strategy is approved.

---

## 10.5 Soft-Deleted Conflicts Must Be Explicit

If an imported row matches a soft-deleted record, the system must not silently reuse or recreate it.

Possible future actions:

```txt
skip row with conflict
restore existing soft-deleted record
create new record with different code
show operator decision required
```

MVP scripts should default to skipping and reporting the conflict.

---

## 10.6 Import Commit Must Be Transactional Where Practical

For small imports, commit should happen in a transaction where possible.

For large imports, future background jobs may need batch commits.

If batching is used, the import must record:

```txt
which rows succeeded
which rows failed
whether retry is safe
whether rollback is possible
```

---

## 10.7 Import Should Not Bypass Business Services

Imports should use the same business rules as normal UI/API operations.

Bad:

```ts
await db.stockBalance.update({ ... })
```

Good:

```ts
await InventoryStockService.adjust(ctx, input)
```

Reason:

```txt
services enforce permissions
services enforce tenant boundaries
services validate business invariants
services emit events
services handle soft delete
services centralize behavior
```

If a service is too slow for bulk import, create a dedicated bulk service method with the same invariants.

---

# 11. Export Safety Rules

Exports are sensitive because they move tenant data out of OneDayOS.

Every future export must enforce:

```txt
authentication
tenant membership
module enablement
export permission
record-level visibility where applicable
soft-delete exclusion by default
field sensitivity rules
rate / size limits later
```

---

## 11.1 Export Requires Separate Permission

Read permission is not enough for export.

Example:

```txt
objects.product.read
objects.product.export

inventory.stock_level.read
inventory.stock_level.export
```

Reason:

```txt
Viewing a page is different from downloading thousands of records.
```

---

## 11.2 Exports Must Be Tenant-Scoped

Bad:

```ts
await db.product.findMany()
```

Bad:

```ts
await db.product.findMany({ where: { orgId: body.orgId } })
```

Good:

```ts
await db.product.findMany({
  where: {
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

---

## 11.3 Exports Must Exclude Deleted Records by Default

Soft-deleted records should not appear in normal exports.

Deleted-record exports require explicit restore/admin permission and a separate endpoint or mode.

---

## 11.4 Sensitive Fields Must Not Export Automatically

Field Metadata may mark fields as:

```ts
sensitive: true
exportable: false
```

Sensitive fields should require explicit review before export support.

Examples:

```txt
salary
government IDs
bank details
private notes
medical info
internal incident notes
AI-generated risk notes
```

---

## 11.5 Exports Must Not Leak Disabled Module Data

If a module is disabled for an organization, its data should not be exportable through normal module export APIs.

Admin/operator recovery scripts may access disabled module data only through approved internal procedures.

---

# 12. Future API Shape

The full future engine may expose APIs like:

```txt
POST   /api/orgs/[orgSlug]/imports/[target]/validate
POST   /api/orgs/[orgSlug]/imports/[target]/commit
GET    /api/orgs/[orgSlug]/imports/[importId]
GET    /api/orgs/[orgSlug]/imports/[importId]/errors

POST   /api/orgs/[orgSlug]/exports/[target]
GET    /api/orgs/[orgSlug]/exports/[exportId]
GET    /api/orgs/[orgSlug]/exports/[exportId]/download
```

But these routes are deferred.

No Claude implementation may add them from this document alone.

---

# 13. Future SDK Shape

The SDK namespace is reserved but not implemented:

```ts
sdk.imports
sdk.exports
```

Possible future shape:

```ts
sdk.imports.validate(ctx, target, file)
sdk.imports.commit(ctx, importId)
sdk.imports.getResult(ctx, importId)

sdk.exports.create(ctx, target, filters)
sdk.exports.getDownloadUrl(ctx, exportId)
```

This is conceptual only.

Do not implement `sdk.imports` or `sdk.exports` until the engine is approved.

---

# 14. Future Metadata Shape

Field Metadata may eventually support:

```ts
type ImportExportFieldMetadata = {
  key: string
  label: string
  type: FieldType
  importable?: boolean
  exportable?: boolean
  requiredOnImport?: boolean
  sensitive?: boolean
  relation?: {
    target: string
    lookupBy: string[]
  }
  aliases?: string[]
}
```

Example:

```ts
{
  key: 'code',
  label: 'Product Code',
  type: 'text',
  importable: true,
  exportable: true,
  requiredOnImport: true,
  aliases: ['SKU', 'Item Code', 'Product ID'],
}
```

This should help future import templates and AI-assisted mapping.

It must not auto-create database fields or migrations.

---

# 15. Future Data Model

The full engine may eventually need tables such as:

```txt
ImportBatch
ImportRowError
ExportRequest
ExportFile
ImportTemplate
ExportTemplate
```

But these tables are not approved now.

Possible future models:

```txt
ImportBatch
  id
  orgId
  target
  status
  fileName
  totalRows
  validRows
  invalidRows
  createdBy
  committedBy
  createdAt
  committedAt

ImportRowError
  id
  orgId
  importBatchId
  rowNumber
  fieldKey
  code
  message
  rawValue

ExportRequest
  id
  orgId
  target
  status
  requestedBy
  filters
  columnKeys
  fileUrl
  createdAt
  completedAt
```

These are conceptual only.

Do not implement them until a dedicated implementation document is written and approved.

---

# 16. Business Object Import Rules

## 16.1 Employee Imports

Employee imports may eventually support:

```txt
employeeNo
name
email
phone
position
employmentType
hiredAt
branch
department
```

Employee import must not include:

```txt
salary
government IDs
leave balances
attendance schedules
payroll fields
bank details
```

Those belong to future module extensions or specialized modules.

Employee import must never create platform `User` login accounts automatically unless explicitly approved.

Employee and User remain separate.

---

## 16.2 Product Imports

Product imports may eventually support:

```txt
code
name
description
category
unit
```

Product import must not include:

```txt
stock quantity
reorder point
cost
price
supplier
warehouse
barcode unless promoted later
serial numbers
lots
expiry dates
```

Stock quantity belongs to Inventory.

Product identity belongs to Business Objects.

---

## 16.3 Customer Imports

Customer imports may eventually support:

```txt
name
email
phone
address
```

Customer import must not include CRM pipeline fields in the core Customer importer.

CRM-specific customer data belongs to CRM extension tables.

---

## 16.4 Supplier Imports

Supplier imports may eventually support:

```txt
name
email
phone
address
```

Purchasing-specific fields belong to Purchasing extension tables.

---

## 16.5 Warehouse Imports

Warehouse imports may eventually support:

```txt
code
name
branch
address
isActive
```

Warehouse import must not include:

```txt
stock balances
bin locations
capacity rules
receiving rules
valuation fields
```

Those belong to modules.

---

# 17. Module Import Rules

Module imports must respect module ownership.

Examples:

```txt
Inventory stock count import:
  module-owned import
  may reference Product and Warehouse
  must not create duplicate Product or Warehouse records unless explicitly in a combined workflow

Leave balance import:
  module-owned import
  references Employee
  must not create Employee if employeeNo is unknown unless explicitly approved

CRM pipeline import:
  module-owned import
  references Customer
  may create CRM deal records
  must not duplicate Customer table
```

Module imports may reference Business Objects, but they do not own them.

---

# 18. Combined Imports

Some workflows may need to create a Business Object and a module extension together.

Example:

```txt
Inventory Product Import
  creates Product
  creates InventoryProductExtension
```

This is allowed only if:

```txt
both permission sets are enforced
both schemas are validated
transaction is service-owned
tenant context is verified
events are emitted correctly
errors are reported row-by-row
```

Permissions might include:

```txt
objects.product.create
inventory.product_extension.create
```

The import must not hide module-specific fields inside the Product table.

---

# 19. File Format Rules

## 19.1 CSV First

CSV should be the first supported format.

Reason:

```txt
simple
portable
easy to validate
easy to inspect
easy to generate from Excel / Google Sheets
```

## 19.2 Excel Later

Excel import/export may come later.

Excel adds complexity:

```txt
multiple sheets
merged cells
formatting assumptions
hidden rows
date serialization problems
formula cells
large memory usage
```

Do not implement Excel support first unless a strong client need proves it.

## 19.3 PDF Is Not Structured Import

PDF import is not part of the Import / Export Engine.

PDF extraction belongs to a future AI/document-processing workflow, not the structured import engine.

---

# 20. Import Preview Rules

The future engine should preview before commit.

Preview should show:

```txt
total rows
valid rows
invalid rows
duplicate rows
would-create count
would-update count
would-skip count
row-level errors
relation resolution errors
soft-deleted conflicts
```

Commit should be impossible when critical errors remain, unless the import mode explicitly allows partial commit.

Partial commit must be visible and auditable.

---

# 21. Error Reporting Rules

Import errors should be precise.

Bad:

```txt
Invalid CSV.
```

Good:

```txt
Row 14, Product Code: required.
Row 27, Unit: value "boxx" is not allowed.
Row 52, Warehouse: "Cebu WH" was not found in this organization.
Row 88, Product Code: duplicate of row 12.
```

Error reports should avoid exposing data from other tenants.

---

# 22. Events

Import/export events are deferred with the engine.

Possible future events:

```txt
platform.import.validated
platform.import.committed
platform.import.failed
platform.export.requested
platform.export.completed
platform.export.failed
```

Business mutations caused by imports should still emit normal business events.

Example:

```txt
objects.product.created
objects.product.updated
inventory.stock_count.imported
```

Import events describe the import process.

Business events describe the business facts.

Do not mix them.

---

# 23. Permissions

Future import/export permissions should be explicit.

Examples:

```txt
objects.product.import
objects.product.export
objects.employee.import
objects.employee.export
inventory.stock_count.import
inventory.stock_level.export
crm.customer_pipeline.import
```

Rules:

```txt
read does not imply export
create does not imply import
import does not imply update unless mode allows updates
admin wildcard grants may allow import/export only within verified tenant context
module enablement is still required for module imports/exports
```

---

# 24. UI Principles

The future user-facing import/export UI must be calm and guided.

It should support:

```txt
download template
upload file
map columns
validate
preview
commit
show results
download error report
```

It should not expose raw database field names to normal users.

It should use business language:

```txt
Product Code
Product Name
Unit
Category
```

not:

```txt
product.code
product.name
product.unit
product.categoryId
```

The UI is deferred.

---

# 25. Security Requirements

Every import/export implementation must test:

```txt
unauthenticated request returns 401 JSON
wrong-org access returns tenant-safe 404
user without permission receives 403 JSON
client-supplied orgId is rejected
module-disabled export/import is blocked
soft-deleted records are excluded by default
relation lookup cannot cross tenants
sensitive fields are not exported by default
invalid rows are rejected
partial imports are visible if allowed
```

---

# 26. Testing Requirements

Future engine tests must include:

```txt
unit tests for field mapping
unit tests for validators
unit tests for CSV parser behavior
service tests with two organizations
API tests for 401 / 403 / 404 / validation errors
permission-denial tests
client-supplied orgId rejection tests
soft-delete tests
relation tenant-safety tests
export field-sensitivity tests
large file / row limit tests
idempotency tests
partial failure tests
```

Generated modules must not include import/export scaffolding by default unless explicitly requested.

---

# 27. Operational Rules

Imports can damage data quickly.

Therefore, future production imports should have controls such as:

```txt
dry-run mode
summary before commit
operator confirmation
row-level error report
import history
ability to identify records created by import
support runbook for failed import
backup or snapshot decision for large imports
```

For early internal scripts, at minimum:

```txt
print summary
require explicit confirmation
write log file
support dry run
never run against production accidentally
```

---

# 28. Founder / Operator Workflow for Early Clients

Until the full engine exists, the recommended early workflow is:

```txt
1. Ask client for spreadsheet using OneDayOS template.
2. Clean spreadsheet manually if needed.
3. Convert to CSV.
4. Run local validation script against staging.
5. Fix row errors.
6. Dry-run against production target org.
7. Confirm counts.
8. Run import.
9. Spot-check UI.
10. Save import file and result log securely.
```

This is enough for early one-day delivery.

Do not build a generic importer until the pain is repeated and clear.

---

# 29. Forbidden Patterns

Claude must never generate these patterns:

```txt
orgId hidden form field
orgId in CSV accepted as tenant identity
body.orgId used for import target
query.orgId used for export target
raw Prisma imports inside module import code
findUnique({ where: { id } }) for tenant-scoped relations
raw SQL import from uploaded file
automatic database schema creation from CSV headers
generic customFields JSON importer
import that bypasses service permissions
export that requires only read permission
export all columns by default
export soft-deleted records by default
module import that duplicates Business Objects
client-facing import route without permission checks
client-facing export route without export permission
long-running import inside normal request without limits
FastAPI / Python / Pydantic importer in core platform
```

---

# 30. Claude Implementation Instructions

Claude may not implement the full Import / Export Engine from this document.

Claude may only implement one of the following if explicitly asked:

```txt
shared TypeScript types for future import/export metadata
internal onboarding script for one specific Business Object
module-local import/export for one approved module
validation helper for one approved CSV shape
unit tests for an approved onboarding script
```

Claude must not add:

```txt
sdk.imports
sdk.exports
import/export database tables
import/export UI
generic import API
export download API
background jobs
storage buckets
AI column mapping
Excel parser
FastAPI worker
```

unless a later frozen implementation document explicitly authorizes it.

---

# 31. Acceptance Criteria for This Document

This document is acceptable if it makes the following clear:

```txt
The full Import / Export Engine is deferred.
Limited onboarding scripts are allowed.
Client-supplied orgId is forbidden.
Imports must validate before writing.
Exports require explicit export permission.
Business Object and module import responsibilities are separate.
Field Metadata may help later but does not replace validation.
Imports must not duplicate Business Objects.
Exports must respect tenant, permission, module, sensitivity, and soft-delete rules.
Claude cannot implement the engine from this document alone.
```

---

# 32. Summary

OneDayOS will eventually need strong import/export capabilities.

But the first restarted platform should not build a generic Import / Export Engine yet.

The right approach is:

```txt
Use controlled onboarding scripts now.
Keep module-local imports local when only one module needs them.
Log repeated import/export pain.
Promote to a shared engine only after proven patterns emerge.
```

This protects the platform from premature complexity while still supporting the commercial need for fast client onboarding.

