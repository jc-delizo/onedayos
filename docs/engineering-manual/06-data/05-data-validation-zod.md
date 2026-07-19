# OneDayOS Engineering Manual — 06 Data — 05 Data Validation with Zod

**Document ID:** `06-data/05-data-validation-zod.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Allowed:** No — freeze this document before asking Claude to implement  
**Author:** ChatGPT acting as OneDayOS Founding Software Architect  
**Date:** July 2026  
**Project:** OneDayOS  
**Website:** onedayonlysystems.com

---

# 1. Purpose

This document defines how OneDayOS validates data using **Zod**.

Validation is not just a developer convenience. In OneDayOS, validation is part of the platform security model.

OneDayOS is a shared, multi-tenant business operating system. Every tenant-scoped operation must be protected from bad input, accidental cross-tenant access, unauthorized mutations, malformed forms, unsafe imports, and future AI-generated code mistakes.

This document exists so Claude Code, future engineers, and module generators do not invent validation patterns.

---

# 2. Related Manual Documents

This document depends on and must remain consistent with:

```txt
01-foundation/00-vision.md
02-architecture/00-system-architecture.md
02-architecture/01-layer-boundaries.md
13-security/08-production-readiness-gate.md
13-security/09-security-stabilization-new-build-spec.md
04-kernel/01-authentication.md
04-kernel/02-organizations-tenancy.md
04-kernel/03-users-roles-permissions.md
04-kernel/04-authorization-enforcement.md
04-kernel/08-kernel-api-contracts.md
05-sdk/00-sdk-overview.md
05-sdk/01-sdk-public-api.md
05-sdk/02-sdk-db-access.md
05-sdk/03-sdk-auth-permissions.md
05-sdk/04-sdk-events.md
05-sdk/06-sdk-testing-contract.md
06-data/00-database-architecture.md
06-data/01-tenancy-data-isolation.md
06-data/02-prisma-conventions.md
06-data/03-soft-delete-archival.md
06-data/04-migrations-seeding.md
```

Where there is a conflict, the stricter security rule wins until an ADR resolves the disagreement.

---

# 3. Core Decision

OneDayOS uses **Zod 4** as the canonical runtime validation layer for:

```txt
API request bodies
API route params
API query strings
form input
module service input
kernel service input
business object mutations
settings values
event payloads
import rows
future AI-generated structured data
future dynamic form metadata
future dynamic CRUD metadata
```

Zod is the boundary between untrusted input and trusted platform code.

TypeScript types are not enough because TypeScript disappears at runtime.

Prisma types are not enough because Prisma validates only at the database boundary and cannot express all platform rules.

React Hook Form validation is not enough because browser validation can be bypassed.

Therefore:

> Every untrusted boundary must validate with Zod before data reaches services or the database.

---

# 4. Non-Goals

This document does **not** define:

```txt
Prisma schema design
module-specific entity models
dynamic form engine implementation
dynamic CRUD implementation
AI agent behavior
OpenAPI generation
client-specific business workflows
```

It does define the validation contracts those systems must use later.

---

# 5. Validation Philosophy

## 5.1 Validate at boundaries

Validation must happen at every boundary where data enters the platform.

Examples:

```txt
browser → API
external integration → API
CSV import → import processor
AI structured output → action executor
settings editor → settings service
module generator → generated files
```

The deeper the input travels without validation, the more dangerous it becomes.

---

## 5.2 Parse, do not merely check

Zod schemas should produce clean, normalized values for the rest of the system.

Bad:

```ts
if (typeof body.name !== 'string') throw new Error('Invalid')
service.create(body)
```

Good:

```ts
const parsed = CreateProductInputSchema.parse(body)
service.create(ctx, parsed)
```

The service should receive validated data, not raw request data.

---

## 5.3 Reject unknown input by default

Unknown keys are dangerous in a multi-tenant platform.

The safest default for API body schemas is:

```ts
z.strictObject({ ... })
```

This matters because attackers, buggy forms, and generated code may send fields the UI does not show.

Examples of dangerous unknown keys:

```txt
orgId
userId
roleId
deletedBy
deletedAt
isSystem
permissions
createdBy
updatedBy
status
```

If the API silently strips unknown keys, a bug may hide during development. If the API rejects them, the bug becomes visible immediately.

---

## 5.4 Never trust tenant identity from input

The client must never submit tenant identity.

Forbidden:

```ts
const schema = z.strictObject({
  orgId: z.string(),
  name: z.string(),
})
```

Required:

```ts
const schema = z.strictObject({
  name: z.string(),
})

const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
await ProductService.create(ctx, schema.parse(body))
```

Tenant identity comes from verified `PlatformContext`, never from request body, query string, form field, local storage, or URL query parameter.

`orgSlug` may appear in the route path, but it is only a locator. The Kernel must verify that the authenticated user belongs to the organization resolved by that slug.

---

## 5.5 Client validation is UX; server validation is security

Client-side validation improves user experience.

Server-side validation protects the platform.

Every client-side schema used with React Hook Form must have a server-side equivalent or shared schema. The API must validate again even if the form already validated.

---

## 5.6 Generated code must be secure by default

The module generator must not create validation holes.

Generated module schemas must not include:

```txt
orgId
userId
deletedBy
deletedAt
createdBy
updatedBy
isSystem
```

Generated APIs must validate:

```txt
params
query strings
request bodies
permissions
tenant context
module enablement
```

---

# 6. Validation Boundaries

## 6.1 Route params

Route params are untrusted.

Even if Next.js provides them as typed strings, they still come from the URL.

Example:

```ts
import * as z from 'zod'

export const OrgRouteParamsSchema = z.strictObject({
  orgSlug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})
```

Usage:

```ts
const params = OrgRouteParamsSchema.parse(await rawParams)
const ctx = await sdk.auth.requireApiOrgContext(req, params.orgSlug)
```

Do not pass raw route params into services.

---

## 6.2 Query strings

Query strings are untrusted and arrive as strings.

Use separate query schemas.

Example:

```ts
export const ListQuerySchema = z.strictObject({
  q: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
})
```

Coercion is acceptable for query strings because query strings are inherently string-based.

Coercion must be used carefully for JSON request bodies.

---

## 6.3 Request bodies

Request bodies are untrusted.

Every API body must be parsed with a Zod schema before use.

Example:

```ts
export const CreateCustomerInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(160),
  email: z.email().optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(500).optional(),
})
```

Forbidden:

```ts
const body = await req.json()
await CustomerService.create(ctx, body)
```

Required:

```ts
const body = await req.json()
const input = CreateCustomerInputSchema.parse(body)
await CustomerService.create(ctx, input)
```

---

## 6.4 Form data

Forms may use the same schema as APIs when the input shape is identical.

When form data differs from API input, create a separate form schema and convert it to API input explicitly.

Example:

```ts
export const CreateProductFormSchema = z.strictObject({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
  categoryId: z.string().trim().optional(),
  unit: z.enum(['pcs', 'kg', 'liter', 'box', 'pack']).default('pcs'),
})
```

Then:

```ts
const formInput = CreateProductFormSchema.parse(rawForm)
const apiInput = {
  ...formInput,
  categoryId: emptyToUndefined(formInput.categoryId),
}
```

Do not let form schemas contain hidden tenant fields.

---

## 6.5 Service input

Service methods should receive:

```txt
verified PlatformContext
validated input
```

Example:

```ts
await ProductService.create(ctx, input)
```

Not:

```ts
await ProductService.create(orgId, userId, body)
```

The service should not have to reconstruct tenant identity from loose strings.

---

## 6.6 Settings values

Settings are JSON values, so they need explicit value schemas.

Bad:

```ts
await settings.set(ctx, 'inventory', 'lowStockAlerts', body.value)
```

Good:

```ts
const LowStockAlertsSettingSchema = z.strictObject({
  enabled: z.boolean(),
  thresholdMode: z.enum(['global', 'per_product']),
  globalThreshold: z.number().int().min(0).max(1_000_000).optional(),
})

const value = LowStockAlertsSettingSchema.parse(body.value)
await settings.set(ctx, 'inventory', 'lowStockAlerts', value)
```

Every setting key must have a known schema.

---

## 6.7 Event payloads

Events are platform contracts.

Every event type should have a payload schema.

Example:

```ts
export const ProductCreatedEventPayloadSchema = z.strictObject({
  productId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
})
```

Event payloads must not include full Prisma records.

Event payloads must not include secrets.

Event payloads must not include data from another organization.

---

## 6.8 Imports

Import rows are untrusted.

Every CSV or spreadsheet row must be validated before it is used.

Import schemas should be separate from API schemas because import data usually arrives as strings.

Example:

```ts
export const ProductImportRowSchema = z.strictObject({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
  unit: z.string().trim().default('pcs'),
  category: z.string().trim().optional(),
})
```

The import processor should collect row-level errors instead of failing the entire file on the first bad row.

---

## 6.9 AI structured output

AI output is untrusted.

Even if an AI agent generates JSON, the platform must parse it through Zod before executing any action.

Example:

```ts
const SuggestedProductSchema = z.strictObject({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
  unit: z.enum(['pcs', 'kg', 'liter', 'box', 'pack']),
})

const suggestion = SuggestedProductSchema.parse(aiOutput)
```

AI must never bypass normal validation, tenant checks, or permission checks.

---

# 7. Schema Placement

## 7.1 Kernel schemas

Kernel-only schemas belong close to the Kernel domain they validate.

```txt
src/kernel/auth/schema.ts
src/kernel/organizations/schema.ts
src/kernel/users/schema.ts
src/kernel/permissions/schema.ts
src/kernel/settings/schema.ts
```

Examples:

```txt
RegisterInputSchema
LoginInputSchema
CreateOrganizationInputSchema
CreateRoleInputSchema
AssignUserRoleInputSchema
UpdateSettingInputSchema
```

Kernel schemas may be imported by `@/sdk/server` where appropriate.

Modules must not import Kernel schemas directly unless those schemas are explicitly re-exported through the SDK.

---

## 7.2 SDK schemas

The SDK may expose stable shared schema types and constants.

```txt
src/sdk/schemas/api.ts
src/sdk/schemas/common.ts
```

Use this for platform-wide shared primitives:

```txt
pagination query schema
sort direction schema
permission requirement schema
event name schema
module manifest schema
API error code schema
```

The SDK must not expose raw Kernel internals.

---

## 7.3 Business Object schemas

Business Object schemas belong to the Business Object layer.

Recommended restarted-build path:

```txt
src/business-objects/product/schema.ts
src/business-objects/customer/schema.ts
src/business-objects/supplier/schema.ts
src/business-objects/warehouse/schema.ts
src/business-objects/employee/schema.ts
```

Examples:

```txt
CreateProductInputSchema
UpdateProductInputSchema
ProductListQuerySchema
CreateCustomerInputSchema
UpdateCustomerInputSchema
```

Modules may consume Business Objects through SDK-approved services, not by reaching into Kernel internals.

---

## 7.4 Module schemas

Module-owned schemas belong inside the module.

```txt
src/modules/inventory/schema.ts
src/modules/leave/schema.ts
src/modules/purchasing/schema.ts
src/modules/crm/schema.ts
```

A module schema may define only module-owned concepts.

Inventory may define:

```txt
CreateStockMovementInputSchema
CreateInventoryAdjustmentInputSchema
CreateReorderRuleInputSchema
```

Inventory must not define:

```txt
CreateProductInputSchema
```

because Product is a shared Business Object.

---

## 7.5 Client-safe vs server-only schemas

Some schemas are safe to import into client components.

Some schemas are server-only.

Client-safe schemas must not import:

```txt
Prisma
Supabase server clients
Node APIs
Kernel internals
server-only SDK helpers
```

A good pattern:

```txt
schema.ts          // client-safe pure Zod schemas
schema.server.ts   // server-only refinements or DB-backed validation
```

Example:

```txt
src/modules/inventory/schema.ts
src/modules/inventory/schema.server.ts
```

Use client-safe schemas with React Hook Form.

Use server schemas for validations that require database checks.

---

# 8. Naming Conventions

Use predictable names.

## 8.1 Create input

```ts
export const CreateProductInputSchema = z.strictObject({ ... })
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>
```

## 8.2 Update input

```ts
export const UpdateProductInputSchema = CreateProductInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  })

export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>
```

## 8.3 List query

```ts
export const ProductListQuerySchema = z.strictObject({ ... })
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>
```

## 8.4 Route params

```ts
export const ProductRouteParamsSchema = z.strictObject({
  orgSlug: OrgSlugSchema,
  productId: OneDayIdSchema,
})
```

## 8.5 Event payload

```ts
export const ProductCreatedEventPayloadSchema = z.strictObject({ ... })
export type ProductCreatedEventPayload = z.infer<typeof ProductCreatedEventPayloadSchema>
```

---

# 9. Shared Primitive Schemas

OneDayOS should centralize common primitive schemas.

Recommended location:

```txt
src/sdk/schemas/common.ts
```

Example:

```ts
import * as z from 'zod'

export const OneDayIdSchema = z.string().trim().min(1).max(128)

export const OrgSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const EmailSchema = z.email().max(254)

export const OptionalEmailSchema = z
  .union([z.literal(''), EmailSchema])
  .transform((value) => (value === '' ? undefined : value))
  .optional()

export const PhoneSchema = z.string().trim().min(3).max(40)

export const OptionalPhoneSchema = z
  .union([z.literal(''), PhoneSchema])
  .transform((value) => (value === '' ? undefined : value))
  .optional()

export const SortDirectionSchema = z.enum(['asc', 'desc'])

export const PaginationQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})
```

## 9.1 Why `OneDayIdSchema` is not always `z.uuid()`

Supabase Auth user IDs are UUIDs.

Prisma-generated business record IDs may be CUID/CUID2 or another generated string depending on the final schema decision.

Therefore, do not validate every platform ID as UUID.

Use explicit ID schemas:

```txt
AuthUserIdSchema       // UUID
OneDayRecordIdSchema   // platform-generated record ID
OrgSlugSchema          // slug
```

---

# 10. Strict Object Policy

## 10.1 API request bodies

API request bodies must use strict object schemas unless there is a documented exception.

Required:

```ts
z.strictObject({ ... })
```

Avoid:

```ts
z.object({ ... })
```

because normal object parsing strips unrecognized keys by default, which can hide security and generator mistakes.

## 10.2 Allowed exceptions

Loose schemas may be allowed for:

```txt
future metadata import tools
external webhook payload capture
analytics payloads
AI experiment logs
```

But loose input must be isolated and never passed directly into business services.

## 10.3 Required orgId rejection

Every tenant-scoped create/update API must reject request bodies that contain `orgId`.

This is not optional.

Test example:

```ts
it('rejects client-supplied orgId', async () => {
  const result = CreateProductInputSchema.safeParse({
    orgId: 'org-attacker',
    code: 'P-001',
    name: 'Product',
    unit: 'pcs',
  })

  expect(result.success).toBe(false)
})
```

---

# 11. API Validation Pattern

All protected APIs should use the API wrapper defined in the SDK/API contract.

Canonical shape:

```ts
export const POST = sdk.api.handle({
  module: 'inventory',
  permission: {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
  },
  paramsSchema: OrgRouteParamsSchema,
  bodySchema: CreateStockAdjustmentInputSchema,
  handler: async ({ ctx, body }) => {
    const adjustment = await InventoryService.createAdjustment(ctx, body)
    return sdk.api.created(adjustment)
  },
})
```

The wrapper must perform this order:

```txt
1. Parse route params
2. Resolve authenticated user
3. Resolve organization from orgSlug
4. Verify user belongs to organization
5. Verify organization is active
6. Verify module is enabled, when module route
7. Parse query/body
8. Check permission
9. Call service with PlatformContext + parsed input
10. Return { data, error }
```

Parsing route params before context is acceptable because parsing does not authorize access.

Permission checks must happen before mutation.

---

# 12. Validation Error Shape

Validation errors must follow the Kernel API contract.

Recommended response:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input.",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "name": ["Name is required."]
      }
    }
  }
}
```

Status:

```txt
400 Bad Request
```

## 12.1 Error formatting helper

Create one helper.

Recommended location:

```txt
src/sdk/server/api/validation.ts
```

Example:

```ts
import * as z from 'zod'

export function formatZodError(error: z.ZodError) {
  const flattened = z.flattenError(error)

  return {
    formErrors: flattened.formErrors,
    fieldErrors: flattened.fieldErrors,
  }
}
```

For deeply nested dynamic forms, use `z.treeifyError(error)` instead.

Do not use deprecated instance methods such as:

```txt
error.format()
error.flatten()
```

Use Zod 4 top-level helpers.

---

# 13. API Helper Implementation Contract

The API wrapper should provide standard parsing helpers.

Example:

```ts
type ApiHandlerConfig<TParams, TQuery, TBody, TResult> = {
  module?: string
  permission?: PermissionRequirement
  paramsSchema?: z.ZodType<TParams>
  querySchema?: z.ZodType<TQuery>
  bodySchema?: z.ZodType<TBody>
  handler: (input: {
    req: NextRequest
    ctx: PlatformContext
    params: TParams
    query: TQuery
    body: TBody
  }) => Promise<ApiResponse<TResult>>
}
```

The wrapper must:

```txt
catch ZodError
return VALIDATION_ERROR
never expose stack traces
never redirect
never return HTML
never pass raw input to handler
```

---

# 14. Server Action Validation

If the restarted build uses server actions, server actions must follow the same validation rules as API routes.

Server actions are not automatically safe.

Pattern:

```ts
'use server'

export async function createProductAction(raw: unknown) {
  const ctx = await sdk.auth.requireActionModuleContext('inventory')
  await sdk.permissions.require(ctx, {
    module: 'objects',
    resource: 'product',
    action: 'create',
  })

  const input = CreateProductInputSchema.parse(raw)
  return ProductService.create(ctx, input)
}
```

Do not allow server actions to bypass API validation rules.

---

# 15. React Hook Form Integration

OneDayOS forms should use:

```txt
React Hook Form
Zod resolver
shadcn/ui form components
```

Pattern:

```ts
const form = useForm<CreateProductInput>({
  resolver: zodResolver(CreateProductInputSchema),
  defaultValues: {
    code: '',
    name: '',
    unit: 'pcs',
  },
})
```

Client form validation must use the same user-facing rules as the API where possible.

However, do not place server-only validation in a client schema.

Bad:

```ts
export const CreateProductInputSchema = z.strictObject({
  code: z.string().refine(asyncCodeIsUniqueInDb),
})
```

Good:

```txt
schema.ts
  basic client-safe shape validation

schema.server.ts
  database-backed uniqueness validation
```

---

# 16. Database-Backed Validation

Some validation needs the database.

Examples:

```txt
unique product code inside organization
customer exists in same organization
warehouse exists in same organization
role exists in same organization
module is enabled for organization
last-admin protection
```

These checks do not belong in client-side Zod schemas.

They belong in services or server-only validation helpers using verified `PlatformContext`.

Example:

```ts
export async function assertProductCodeAvailable(
  ctx: PlatformContext,
  code: string
) {
  const db = sdk.getDb(ctx)

  const existing = await db.product.findFirst({
    where: {
      orgId: ctx.org.id,
      code,
      deletedAt: null,
    },
    select: { id: true },
  })

  if (existing) {
    throw new PlatformError({
      code: 'CONFLICT',
      message: 'A product with this code already exists.',
    })
  }
}
```

The database check must remain tenant-scoped.

---

# 17. Normalization Rules

## 17.1 Strings

Most human-entered strings should be trimmed.

Example:

```ts
z.string().trim().min(1).max(160)
```

Do not trim fields where leading/trailing spaces are meaningful. That should be rare in OneDayOS business data.

## 17.2 Empty strings

Browser forms often submit empty strings.

For optional text fields, convert empty strings to `undefined` or `null` intentionally.

Helper:

```ts
export function emptyStringToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.union([z.literal(''), schema]).transform((value) =>
    value === '' ? undefined : value
  )
}
```

Use consistently.

## 17.3 Emails

Emails should be normalized to lowercase when used for identity or uniqueness.

Example:

```ts
export const NormalizedEmailSchema = z.email().trim().toLowerCase()
```

Be careful with display-only emails if exact casing matters, but for login and uniqueness lowercase is acceptable.

## 17.4 Codes

Business codes should have module/object-specific normalization rules.

Examples:

```txt
Product code: trim, uppercase, max 40
Employee number: trim, uppercase or preserve depending on client convention
Supplier code: future, likely uppercase
```

Do not create one universal code rule if business meanings differ.

## 17.5 Phone numbers

For MVP, phone numbers should be stored as strings.

Do not store phone numbers as numbers.

Philippine phone formats vary, and users may include spaces, dashes, parentheses, and country codes.

MVP rule:

```ts
z.string().trim().min(3).max(40)
```

Future normalization can be added later.

## 17.6 Dates

Use ISO strings at API boundaries.

Examples:

```ts
z.iso.date()      // YYYY-MM-DD
z.iso.datetime()  // ISO datetime
```

Convert to `Date` only inside server code or service code.

Do not let client components construct business-critical dates without server validation.

## 17.7 Money

Do not model money casually.

For MVP validation:

```ts
const PesoAmountSchema = z.number().finite().min(0).max(999_999_999)
```

For accounting-grade modules later, decide through an ADR whether money is stored as:

```txt
minor units integer
Prisma Decimal
string decimal
```

Do not let each module invent its own money representation.

---

# 18. Coercion Rules

Zod coercion is useful but dangerous if overused.

Allowed:

```txt
query strings
URL search params
CSV/import rows
HTML form data where everything arrives as a string
```

Use carefully:

```ts
z.coerce.number().int().min(1)
```

Avoid coercion for JSON API bodies unless there is a clear reason.

Bad:

```ts
z.coerce.boolean()
```

Reason: boolean coercion can surprise developers because non-empty strings can become `true`.

For JSON APIs, prefer exact types.

---

# 19. Enum Rules

Use explicit enums for status/action/type fields.

Example:

```ts
export const EmploymentTypeSchema = z.enum([
  'full_time',
  'part_time',
  'contractor',
])
```

Avoid free strings:

```ts
z.string()
```

for fields like:

```txt
status
role type
employment type
module ID
action
permission resource
stock movement type
approval status
subscription status
```

If the set is controlled, make it an enum.

---

# 20. Permission Requirement Validation

Permission requirements are platform contracts.

They should be validated too.

Example:

```ts
export const PermissionRequirementSchema = z.strictObject({
  module: z.string().trim().min(1).max(80),
  resource: z.string().trim().min(1).max(120),
  action: z.enum([
    'create',
    'read',
    'update',
    'delete',
    'approve',
    'restore',
    'export',
    'import',
    '*',
  ]),
})
```

`resource` must not be nullable.

Use `'*'` as wildcard.

---

# 21. Module Manifest Validation

Module manifests should be validated when registered.

Example:

```ts
export const ModuleManifestSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1).max(80),
  version: z.string().min(1),
  compatibility: z.strictObject({
    minPlatformVersion: z.string(),
    maxPlatformVersion: z.string().optional(),
  }),
  icon: z.string().min(1),
  dependencies: z.array(z.string()).default([]),
  permissions: z.array(PermissionRequirementSchema),
  navItems: z.array(ModuleNavItemSchema),
  events: z.strictObject({
    emits: z.array(EventNameSchema).default([]),
    listens: z.array(EventNameSchema).default([]),
  }),
})
```

If the module manifest is invalid, registration should fail loudly during development.

Do not let invalid manifests silently register.

---

# 22. Event Name Validation

Events must follow the approved naming convention:

```txt
{namespace}.{entity}.{past_tense_verb}
```

Examples:

```txt
objects.product.created
objects.customer.updated
inventory.stock_movement.created
leave.leave_request.approved
kernel.user.created
```

Schema:

```ts
export const EventNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/)
```

This regex does not prove the verb is actually past tense. Code review still matters.

Wrong event names are API contract bugs.

---

# 23. Generated Module Schema Template

The module generator must create schemas like this:

```ts
import * as z from 'zod'

export const CreateInventoryRecordInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(160),
})

export const UpdateInventoryRecordInputSchema = CreateInventoryRecordInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  })

export const InventoryRecordListQuerySchema = z.strictObject({
  q: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export type CreateInventoryRecordInput = z.infer<
  typeof CreateInventoryRecordInputSchema
>

export type UpdateInventoryRecordInput = z.infer<
  typeof UpdateInventoryRecordInputSchema
>
```

It must not create:

```ts
orgId: z.string()
```

It must not generate APIs that read:

```ts
request.nextUrl.searchParams.get('orgId')
```

---

# 24. Business Object Validation Examples

## 24.1 Product

```ts
export const ProductUnitSchema = z.enum([
  'pcs',
  'kg',
  'g',
  'liter',
  'ml',
  'box',
  'pack',
  'set',
])

export const CreateProductInputSchema = z.strictObject({
  code: z.string().trim().min(1).max(40).toUpperCase(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  categoryId: OneDayIdSchema.optional(),
  unit: ProductUnitSchema.default('pcs'),
})
```

## 24.2 Customer

```ts
export const CreateCustomerInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(160),
  email: OptionalEmailSchema,
  phone: OptionalPhoneSchema,
  address: z.string().trim().max(500).optional(),
})
```

## 24.3 Employee

```ts
export const EmploymentTypeSchema = z.enum([
  'full_time',
  'part_time',
  'contractor',
])

export const CreateEmployeeInputSchema = z.strictObject({
  employeeNo: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
  email: OptionalEmailSchema,
  phone: OptionalPhoneSchema,
  departmentId: OneDayIdSchema.optional(),
  branchId: OneDayIdSchema.optional(),
  position: z.string().trim().max(120).optional(),
  employmentType: EmploymentTypeSchema.default('full_time'),
  hiredAt: z.iso.date().optional(),
})
```

---

# 25. Validation and Tenant Isolation

Validation must reinforce tenant isolation.

## 25.1 Forbidden tenant fields

Tenant-scoped create/update schemas must not include:

```txt
orgId
organizationId
tenantId
```

## 25.2 Forbidden actor fields

Mutation schemas must not include:

```txt
createdBy
updatedBy
deletedBy
approvedBy
restoredBy
```

Actor identity comes from `PlatformContext`.

## 25.3 Forbidden lifecycle fields

Normal create/update schemas must not include:

```txt
deletedAt
deletedBy
createdAt
updatedAt
```

Lifecycle fields are managed by the platform.

## 25.4 Forbidden permission fields

Non-admin APIs must not accept:

```txt
roleId
permissions
isSystem
module
resource
action
```

unless the route is explicitly a Kernel permission-management API and protected by admin-level permissions.

---

# 26. Validation and Soft Delete

Delete routes usually do not need a body.

They must validate route params.

Example:

```ts
export const DeleteProductParamsSchema = z.strictObject({
  orgSlug: OrgSlugSchema,
  productId: OneDayIdSchema,
})
```

Soft delete metadata must come from context:

```ts
await ProductService.softDelete(ctx, productId)
```

The service sets:

```ts
deletedAt: new Date()
deletedBy: ctx.user.id
```

The client must never send these fields.

---

# 27. Validation and Imports/Exports

Imports should validate every row independently.

Recommended result shape:

```ts
type ImportValidationResult<T> = {
  validRows: T[]
  invalidRows: {
    rowNumber: number
    raw: unknown
    errors: ValidationErrorDetails
  }[]
}
```

A single bad row should not automatically destroy the entire import unless the import mode is explicitly atomic.

Exports do not need input schemas for row data, but export filters must be validated.

Export APIs must validate:

```txt
format
columns
filters
sort
```

and must enforce permissions.

---

# 28. Validation and Search/Reporting

Search and reporting are future Platform Services, but their input contracts should follow this document.

Search inputs must validate:

```txt
query length
module/object scope
filters
sort
pagination
```

Reporting inputs must validate:

```txt
allowed measures
allowed dimensions
allowed date ranges
allowed filters
export format
```

Do not allow arbitrary SQL-like filters from the client.

---

# 29. Validation and Dynamic Forms

Dynamic Forms are deferred.

However, Zod schemas should be written in a way that can later support dynamic metadata.

Zod 4 supports JSON Schema conversion through `z.toJSONSchema()`, which may be useful later for AI-assisted forms, documentation, or generated clients.

Do not build the Dynamic Form Engine now.

But do avoid patterns that make it impossible later.

Avoid:

```txt
large unstructured custom validators hidden inside form code
schema definitions embedded inside React components
module schemas that duplicate Business Object schemas
```

Prefer:

```txt
named schemas
shared primitive schemas
field-specific max lengths
explicit enums
separate create/update/query schemas
```

---

# 30. Validation and AI

AI-generated data must be treated as untrusted.

The future AI Layer must validate all structured outputs before:

```txt
creating records
updating records
running reports
triggering workflows
generating imports
configuring modules
```

Example:

```ts
const parsed = CreateProductInputSchema.safeParse(aiSuggestedProduct)

if (!parsed.success) {
  return {
    accepted: false,
    reason: 'AI output did not match Product schema.',
    errors: formatZodError(parsed.error),
  }
}
```

AI should never be allowed to bypass the same schemas humans use.

---

# 31. Validation Testing Requirements

Every schema-heavy area needs validation tests.

## 31.1 API body tests

Must test:

```txt
valid payload succeeds
missing required field fails
invalid type fails
unknown field fails
client-supplied orgId fails
client-supplied deletedBy fails
empty string handling works
max length works
```

## 31.2 Query tests

Must test:

```txt
page defaults to 1
limit defaults to 25
limit cannot exceed 100
invalid sort field fails
invalid sort direction fails
q length limit works
```

## 31.3 Tenant isolation validation tests

Must test:

```txt
orgId in body is rejected
orgId in query string is rejected
wrong orgSlug does not authorize access
service receives PlatformContext
```

## 31.4 Permission-adjacent tests

Must test:

```txt
role creation rejects invalid wildcard shape
permission resource cannot be null
permission action must be approved enum
conditions are denied in MVP unless explicitly supported
```

## 31.5 Event payload tests

Must test:

```txt
event name format is valid
payload schema accepts valid payload
payload schema rejects full Prisma-like record when extra fields exist
payload schema rejects missing entity ID
```

---

# 32. Validation Test Example

```ts
import { describe, expect, it } from 'vitest'
import { CreateProductInputSchema } from '../schema'

describe('CreateProductInputSchema', () => {
  it('accepts a valid product', () => {
    const result = CreateProductInputSchema.safeParse({
      code: 'P-001',
      name: 'Sample Product',
      unit: 'pcs',
    })

    expect(result.success).toBe(true)
  })

  it('rejects client-supplied orgId', () => {
    const result = CreateProductInputSchema.safeParse({
      orgId: 'org-attacker',
      code: 'P-001',
      name: 'Sample Product',
      unit: 'pcs',
    })

    expect(result.success).toBe(false)
  })

  it('trims and normalizes code', () => {
    const result = CreateProductInputSchema.safeParse({
      code: ' p-001 ',
      name: 'Sample Product',
      unit: 'pcs',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('P-001')
    }
  })
})
```

---

# 33. Architecture Check Rules

`npm run check:architecture` should eventually verify schema safety patterns.

Suggested forbidden patterns:

```txt
orgId: z.string() inside module create/update schemas
organizationId: z.string() inside module create/update schemas
tenantId: z.string() inside module create/update schemas
request.nextUrl.searchParams.get('orgId')
error.flatten()
error.format()
import { prisma } from '@/kernel/db/client' inside modules
z.object({ ... }) for API body schemas without explicit allowlist comment
```

Suggested required patterns:

```txt
Create*InputSchema uses z.strictObject
Update*InputSchema exists for mutable entities
List*QuerySchema exists for list APIs
API routes use sdk.api.handle or approved equivalent
validation tests exist for generated modules
```

---

# 34. Claude Implementation Rules

Claude must follow these rules when implementing validation:

```txt
1. Use Zod 4.
2. Import as: import * as z from 'zod'.
3. Use z.strictObject for API body schemas by default.
4. Do not include orgId in client/API create or update schemas.
5. Do not include deletedAt, deletedBy, createdAt, updatedAt in normal client/API schemas.
6. Do not pass raw request bodies to services.
7. Do not validate only on the client.
8. Do not use FastAPI, Pydantic, Alembic, or Python validation for the core platform.
9. Do not use error.flatten() or error.format(); use Zod 4 top-level helpers.
10. Validate route params and query strings.
11. Create tests for rejection of unknown keys.
12. Create tests for rejection of client-supplied orgId.
13. Keep client-safe schemas free of server imports.
14. Use server-only schemas for DB-backed validation.
15. Stop and report if a validation rule conflicts with the Engineering Manual.
```

---

# 35. Implementation Prompt for Claude

Use this when asking Claude to implement validation infrastructure:

```md
You are implementing OneDayOS data validation with Zod.

Authoritative documents:
- docs/engineering-manual/06-data/05-data-validation-zod.md
- docs/engineering-manual/04-kernel/08-kernel-api-contracts.md
- docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md
- docs/engineering-manual/06-data/01-tenancy-data-isolation.md

Rules:
- Use Zod 4.
- API bodies must use z.strictObject by default.
- Do not accept orgId from request body or query string.
- Do not pass raw request data into services.
- Use PlatformContext for tenant and actor identity.
- Validation errors must return { data: null, error } JSON with code VALIDATION_ERROR.
- Do not use FastAPI or Pydantic.
- Do not import Kernel internals inside modules.
- Add tests for unknown fields, invalid fields, and client-supplied orgId.

Task:
Implement only the validation helpers, shared primitive schemas, API validation error formatter, and tests described in this document. Do not implement Dynamic Forms, Dynamic CRUD, Search, Reporting, or AI.
```

---

# 36. Acceptance Criteria

This document is implemented when:

```txt
[ ] Shared primitive schemas exist
[ ] API validation helper exists
[ ] Zod error formatter exists
[ ] Validation errors follow Kernel API contract
[ ] Create/update schemas use z.strictObject by default
[ ] Route params are validated
[ ] Query strings are validated
[ ] Client-supplied orgId is rejected
[ ] Lifecycle fields are rejected from normal payloads
[ ] Module generator emits safe schemas
[ ] Generated modules include validation tests
[ ] Client-safe schemas do not import server-only code
[ ] Server-only validations are isolated
[ ] Event payload schemas are supported
[ ] Settings value schemas are supported
[ ] Tests cover invalid input, unknown fields, orgId rejection, and query limits
[ ] No FastAPI/Pydantic validation layer exists in the core platform
```

---

# 37. Production Readiness Checklist

Before production:

```txt
[ ] Every protected API route validates params, query, and/or body as applicable
[ ] Every mutation validates body input
[ ] Every list route validates query input
[ ] Every tenant-scoped API rejects client-supplied orgId
[ ] Every validation failure returns JSON 400
[ ] Every validation error uses the approved error shape
[ ] Every generated module has validation tests
[ ] Every schema file is client-safe unless named .server.ts
[ ] No module imports validation from Kernel internals
[ ] No service receives raw request body
[ ] No client-only validation is treated as security
```

---

# 38. Founder Review Questions

Before freezing this document, answer:

```txt
1. Should product/customer/supplier/employee schemas live under src/business-objects/*, or should that folder name be src/objects/*?
2. Should OneDayOS standardize all internal generated IDs as CUID2, UUID, or Prisma default cuid?
3. Should product codes be globally uppercased by default, or should code normalization be per module/object?
4. Should phone validation remain loose for MVP?
5. Should money use Decimal from the beginning, or defer the money representation ADR until accounting-grade modules appear?
6. Should validation errors include field labels, or only field keys?
```

My recommendation:

```txt
1. Use src/business-objects/* for clarity.
2. Keep Prisma default generated string IDs for MVP unless the database architecture doc chooses otherwise.
3. Normalize product codes to uppercase; leave other code types object-specific.
4. Keep phone validation loose for MVP.
5. Defer full money representation ADR until Expenses, Purchasing, or Billing needs it.
6. Return field keys from API; map to labels in the UI.
```

---

# 39. References

This document assumes Zod 4. Relevant official Zod documentation areas:

```txt
Zod Introduction: https://zod.dev/
Zod API / Defining Schemas: https://zod.dev/api
Zod Formatting Errors: https://zod.dev/error-formatting
Zod Metadata and Registries: https://zod.dev/metadata
Zod JSON Schema: https://zod.dev/json-schema
Zod 4 Changelog: https://zod.dev/v4/changelog
```

---

# 40. Final Rule

Validation is not a form feature.

Validation is part of OneDayOS platform safety.

Claude should not be allowed to generate business modules unless the generated code validates input according to this document.
