# OneDayOS Engineering Manual — CRM Module Specification

**Document ID:** `17-module-specifications/03-crm-module.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before CRM Module Implementation  
**Owner:** OneDayOS Founder / Platform Architect  
**Last Updated:** July 2026  
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
- `07-business-objects/03-customer.md`
- `07-business-objects/01-employee.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/*`
- `09-cli-generators/*`
- `13-security/*`
- `14-testing-quality/*`
- `17-module-specifications/00-module-spec-template.md`

---

# 1. Purpose

The CRM Module gives Philippine SMEs a simple, reusable way to manage sales relationships, opportunities, pipeline stages, and follow-up work inside OneDayOS.

CRM is not a standalone customer database.

CRM is a business module that uses the shared `Customer` Business Object and adds sales-specific behavior around it.

```txt
Customer = shared Business Object
CRM = sales relationship and pipeline behavior around Customer
```

The CRM Module should prove that OneDayOS can support relationship-driven workflows without duplicating shared business entities.

---

# 2. Core Position

CRM must not own `Customer`.

CRM may extend `Customer`.

CRM may create `Customer` records through approved Business Object services when the user has the required `objects.customer.*` permissions.

CRM may maintain CRM-specific data about a Customer through module-owned extension tables.

CRM may own opportunities, pipeline stages, and sales follow-up records.

CRM may not own platform-wide comments, notifications, activity feed, reports, AI, attachments, billing, or customer portals.

---

# 3. Business Goal

The first CRM version should help a small business answer:

```txt
Who are our prospects/customers?
What opportunities are currently open?
Which deals are close to winning?
Who owns each opportunity?
What stage is each opportunity in?
What should the sales team follow up next?
What deals were won or lost?
```

The CRM Module should be simple enough for one-day delivery but structured enough to become reusable across many clients.

---

# 4. Non-Goals

The CRM MVP must not include:

```txt
full Salesforce-style CRM
marketing automation
email campaign engine
SMS campaigns
email inbox integration
call-center integration
customer support tickets
customer portal
quotations
invoicing
accounting
commissions
sales targets
sales forecasting engine
territory management
lead scoring AI
duplicate customer merge engine
generic Contact Person engine
generic Activity Feed Service
Notification Service
Attachment Service
Reporting Service
AI assistant
workflow automation engine
approval engine
custom fields JSON
no-code CRM builder
FastAPI backend
Python CRM service
```

The CRM Module must not become a generic business relationship platform before the basics are proven.

---

# 5. Business Objects Used

The CRM Module uses these shared Business Objects:

| Business Object | Usage |
|---|---|
| `Customer` | Company/person that the business sells to or may sell to |
| `Employee` | Sales owner / account owner / opportunity owner |
| `Branch` | Optional org-structure context through Kernel, not CRM-owned |
| `Department` | Optional org-structure context through Kernel, not CRM-owned |

The CRM Module does **not** own:

```txt
Customer
Employee
Branch
Department
Supplier
Product
Warehouse
```

If CRM later needs Product for quotes or sales orders, that should be handled by a separate Sales/Quotations module or future integration, not by polluting CRM MVP.

---

# 6. Customer vs Lead Decision

## 6.1 MVP Decision

CRM MVP should **not** implement a separate `Lead` identity table.

Instead:

```txt
Prospect = Customer Business Object + CRM customer profile lifecycle stage
Active customer = Customer Business Object + CRM customer profile lifecycle stage
Lost/unqualified prospect = Customer Business Object + CRM customer profile lifecycle stage
```

This avoids creating parallel records like:

```txt
Lead
Customer
CRMCustomer
Prospect
Account
```

which would quickly cause duplicate identity problems.

## 6.2 Why

A small business usually thinks in simple terms:

```txt
person/company we may sell to
person/company we are selling to
person/company we sold to
```

For OneDayOS MVP, all of these can be represented by `Customer` plus CRM-specific status.

## 6.3 Future Lead Entity

A separate Lead entity may be introduced later only if repeated real use cases prove the need for pre-customer capture workflows such as:

```txt
marketing forms
lead imports
lead qualification teams
duplicate lead management
lead-to-account conversion
lead scoring
campaign attribution
```

Until then, do not create `Lead`.

---

# 7. Module-Owned Entities

The CRM Module should own only CRM-specific concepts.

## 7.1 `CrmCustomerProfile`

CRM-specific extension table for `Customer`.

Purpose:

```txt
Stores sales-specific metadata about a shared Customer.
```

Suggested fields:

```prisma
model CrmCustomerProfile {
  id              String    @id @default(cuid())
  orgId           String
  customerId      String
  lifecycleStage  String    @default("prospect")
  source          String?
  ownerEmployeeId String?
  lastContactedAt DateTime?
  nextFollowUpAt  DateTime?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  deletedBy       String?

  customer Customer @relation(fields: [customerId, orgId], references: [id, orgId])
  owner    Employee? @relation(fields: [ownerEmployeeId, orgId], references: [id, orgId])

  @@unique([orgId, customerId])
  @@index([orgId, lifecycleStage])
  @@index([orgId, ownerEmployeeId])
  @@index([orgId, nextFollowUpAt])
  @@map("crm_customer_profiles")
}
```

Allowed `lifecycleStage` values for MVP:

```txt
prospect
active
inactive
lost
```

Important:

`lifecycleStage` is CRM-specific. It must not be added to the core `Customer` table.

## 7.2 `CrmPipeline`

Represents a sales pipeline.

For MVP, most organizations should have one default pipeline.

Suggested fields:

```prisma
model CrmPipeline {
  id        String    @id @default(cuid())
  orgId     String
  name      String
  isDefault Boolean   @default(false)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  deletedBy String?

  stages CrmPipelineStage[]

  @@unique([orgId, name])
  @@index([orgId, isDefault])
  @@map("crm_pipelines")
}
```

Do not overbuild multiple pipelines unless a client needs it. The model can support it, but the UI may start with one default pipeline.

## 7.3 `CrmPipelineStage`

Represents stages inside a pipeline.

Suggested fields:

```prisma
model CrmPipelineStage {
  id          String    @id @default(cuid())
  orgId       String
  pipelineId  String
  name        String
  position    Int
  probability Int?
  isWonStage  Boolean   @default(false)
  isLostStage Boolean   @default(false)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  pipeline CrmPipeline @relation(fields: [pipelineId, orgId], references: [id, orgId])

  @@unique([orgId, pipelineId, name])
  @@unique([orgId, pipelineId, position])
  @@index([orgId, pipelineId])
  @@map("crm_pipeline_stages")
}
```

Default MVP stages:

```txt
New
Qualified
Proposal
Negotiation
Won
Lost
```

The `Won` and `Lost` stages should be terminal by default.

## 7.4 `CrmOpportunity`

Represents a potential sale/deal.

Suggested fields:

```prisma
model CrmOpportunity {
  id                 String    @id @default(cuid())
  orgId              String
  customerId          String
  pipelineId          String
  stageId             String
  ownerEmployeeId     String?
  title               String
  description         String?
  estimatedValue      Decimal?
  currency            String    @default("PHP")
  expectedCloseDate   DateTime?
  status              String    @default("open")
  lostReason          String?
  wonAt               DateTime?
  lostAt              DateTime?
  closedAt            DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?
  deletedBy           String?

  customer Customer @relation(fields: [customerId, orgId], references: [id, orgId])
  pipeline CrmPipeline @relation(fields: [pipelineId, orgId], references: [id, orgId])
  stage    CrmPipelineStage @relation(fields: [stageId, orgId], references: [id, orgId])
  owner    Employee? @relation(fields: [ownerEmployeeId, orgId], references: [id, orgId])

  @@index([orgId, customerId])
  @@index([orgId, pipelineId, stageId])
  @@index([orgId, ownerEmployeeId])
  @@index([orgId, status])
  @@index([orgId, expectedCloseDate])
  @@map("crm_opportunities")
}
```

Allowed `status` values for MVP:

```txt
open
won
lost
cancelled
```

Important:

`cancelled` is not deletion.

Deletion remains soft delete.

## 7.5 `CrmFollowUp`

Optional MVP record for simple follow-up tasks.

Suggested fields:

```prisma
model CrmFollowUp {
  id             String    @id @default(cuid())
  orgId          String
  opportunityId  String?
  customerId      String?
  assignedToId    String?
  title          String
  description    String?
  dueAt          DateTime?
  completedAt    DateTime?
  status         String    @default("open")
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?
  deletedBy      String?

  opportunity CrmOpportunity? @relation(fields: [opportunityId, orgId], references: [id, orgId])
  customer    Customer? @relation(fields: [customerId, orgId], references: [id, orgId])
  assignedTo  Employee? @relation(fields: [assignedToId, orgId], references: [id, orgId])

  @@index([orgId, opportunityId])
  @@index([orgId, customerId])
  @@index([orgId, assignedToId])
  @@index([orgId, dueAt])
  @@index([orgId, status])
  @@map("crm_follow_ups")
}
```

Allowed `status` values:

```txt
open
completed
cancelled
```

This is **not** the Platform Activity Feed and not the Notification Service.

It is CRM-local follow-up work.

---

# 8. Entity Boundary Summary

| Concept | Layer | Owner |
|---|---|---|
| Customer identity | Business Object | Business Objects layer |
| Customer email/phone/address | Business Object | Business Objects layer |
| Customer lifecycle stage | Module extension | CRM |
| Customer sales owner | Module extension | CRM |
| Sales pipeline | Module-owned entity | CRM |
| Pipeline stage | Module-owned entity | CRM |
| Opportunity/deal | Module-owned entity | CRM |
| Follow-up task | Module-owned entity | CRM |
| Employee identity | Business Object | Business Objects layer |
| Sales user login | Kernel User | Kernel |
| Notifications | Platform Service | Deferred |
| Activity feed | Platform Service | Deferred |
| Comments | Platform Service | Deferred |
| Attachments | Platform Service | Deferred |
| Reports | Platform Service | Deferred |

---

# 9. Permissions

CRM permissions must use full permission objects.

They must not use action arrays like:

```ts
permissions: ['create', 'read', 'update', 'delete']
```

## 9.1 CRM Module Permissions

Recommended CRM permissions:

```ts
export const CRM_PERMISSIONS = {
  DASHBOARD_READ: {
    module: 'crm',
    resource: 'dashboard',
    action: 'read',
  },

  CUSTOMER_PROFILE_READ: {
    module: 'crm',
    resource: 'customer_profile',
    action: 'read',
  },
  CUSTOMER_PROFILE_CREATE: {
    module: 'crm',
    resource: 'customer_profile',
    action: 'create',
  },
  CUSTOMER_PROFILE_UPDATE: {
    module: 'crm',
    resource: 'customer_profile',
    action: 'update',
  },
  CUSTOMER_PROFILE_DELETE: {
    module: 'crm',
    resource: 'customer_profile',
    action: 'delete',
  },

  PIPELINE_READ: {
    module: 'crm',
    resource: 'pipeline',
    action: 'read',
  },
  PIPELINE_CREATE: {
    module: 'crm',
    resource: 'pipeline',
    action: 'create',
  },
  PIPELINE_UPDATE: {
    module: 'crm',
    resource: 'pipeline',
    action: 'update',
  },
  PIPELINE_DELETE: {
    module: 'crm',
    resource: 'pipeline',
    action: 'delete',
  },

  PIPELINE_STAGE_READ: {
    module: 'crm',
    resource: 'pipeline_stage',
    action: 'read',
  },
  PIPELINE_STAGE_CREATE: {
    module: 'crm',
    resource: 'pipeline_stage',
    action: 'create',
  },
  PIPELINE_STAGE_UPDATE: {
    module: 'crm',
    resource: 'pipeline_stage',
    action: 'update',
  },
  PIPELINE_STAGE_DELETE: {
    module: 'crm',
    resource: 'pipeline_stage',
    action: 'delete',
  },

  OPPORTUNITY_READ: {
    module: 'crm',
    resource: 'opportunity',
    action: 'read',
  },
  OPPORTUNITY_CREATE: {
    module: 'crm',
    resource: 'opportunity',
    action: 'create',
  },
  OPPORTUNITY_UPDATE: {
    module: 'crm',
    resource: 'opportunity',
    action: 'update',
  },
  OPPORTUNITY_DELETE: {
    module: 'crm',
    resource: 'opportunity',
    action: 'delete',
  },
  OPPORTUNITY_CLOSE: {
    module: 'crm',
    resource: 'opportunity',
    action: 'close',
  },

  FOLLOW_UP_READ: {
    module: 'crm',
    resource: 'follow_up',
    action: 'read',
  },
  FOLLOW_UP_CREATE: {
    module: 'crm',
    resource: 'follow_up',
    action: 'create',
  },
  FOLLOW_UP_UPDATE: {
    module: 'crm',
    resource: 'follow_up',
    action: 'update',
  },
  FOLLOW_UP_DELETE: {
    module: 'crm',
    resource: 'follow_up',
    action: 'delete',
  },
  FOLLOW_UP_COMPLETE: {
    module: 'crm',
    resource: 'follow_up',
    action: 'complete',
  },
} as const
```

## 9.2 Business Object Permissions Required

CRM operations that create or update Customer records must also require `objects.customer.*` permissions.

Examples:

| Operation | Required Permissions |
|---|---|
| View CRM customer list | `objects.customer.read` + `crm.customer_profile.read` |
| Create customer from CRM | `objects.customer.create` + `crm.customer_profile.create` |
| Update customer core fields | `objects.customer.update` |
| Update CRM-specific fields | `crm.customer_profile.update` |
| Create opportunity for customer | `objects.customer.read` + `crm.opportunity.create` |
| View opportunity | `crm.opportunity.read` |
| Move opportunity stage | `crm.opportunity.update` |
| Mark opportunity won/lost | `crm.opportunity.close` |
| Delete opportunity | `crm.opportunity.delete` |

## 9.3 Admin Role

Admin may receive wildcard permission:

```txt
*.*.*
```

But wildcard permissions never bypass tenant isolation or module enablement.

## 9.4 Sales Staff Role

A default `Sales Staff` role may include:

```txt
objects.customer.read
objects.customer.create
objects.customer.update

crm.dashboard.read
crm.customer_profile.read
crm.customer_profile.create
crm.customer_profile.update
crm.pipeline.read
crm.pipeline_stage.read
crm.opportunity.read
crm.opportunity.create
crm.opportunity.update
crm.opportunity.close
crm.follow_up.read
crm.follow_up.create
crm.follow_up.update
crm.follow_up.complete
```

It should not include:

```txt
crm.pipeline.create
crm.pipeline.delete
crm.pipeline_stage.delete
crm.opportunity.delete
objects.customer.delete
```

unless explicitly granted.

---

# 10. Routes

## 10.1 Page Routes

CRM pages live under the org shell:

```txt
/[orgSlug]/crm
/[orgSlug]/crm/customers
/[orgSlug]/crm/customers/[customerId]
/[orgSlug]/crm/opportunities
/[orgSlug]/crm/opportunities/new
/[orgSlug]/crm/opportunities/[opportunityId]
/[orgSlug]/crm/pipeline
/[orgSlug]/crm/follow-ups
/[orgSlug]/crm/settings
```

MVP recommended pages:

```txt
/[orgSlug]/crm
/[orgSlug]/crm/customers
/[orgSlug]/crm/opportunities
/[orgSlug]/crm/opportunities/new
/[orgSlug]/crm/opportunities/[opportunityId]
/[orgSlug]/crm/pipeline
```

`follow-ups` and `settings` may be deferred if needed.

## 10.2 API Routes

CRM APIs live under tenant-scoped module paths:

```txt
/api/orgs/[orgSlug]/crm/customer-profiles
/api/orgs/[orgSlug]/crm/customer-profiles/[customerId]

/api/orgs/[orgSlug]/crm/pipelines
/api/orgs/[orgSlug]/crm/pipelines/[pipelineId]

/api/orgs/[orgSlug]/crm/pipeline-stages
/api/orgs/[orgSlug]/crm/pipeline-stages/[stageId]

/api/orgs/[orgSlug]/crm/opportunities
/api/orgs/[orgSlug]/crm/opportunities/[opportunityId]
/api/orgs/[orgSlug]/crm/opportunities/[opportunityId]/stage
/api/orgs/[orgSlug]/crm/opportunities/[opportunityId]/close

/api/orgs/[orgSlug]/crm/follow-ups
/api/orgs/[orgSlug]/crm/follow-ups/[followUpId]
/api/orgs/[orgSlug]/crm/follow-ups/[followUpId]/complete
```

Customer Business Object APIs remain separate:

```txt
/api/orgs/[orgSlug]/objects/customers
/api/orgs/[orgSlug]/objects/customers/[customerId]
```

CRM must not create:

```txt
/api/crm?orgId=...
/api/customers?module=crm
/api/crm/customers?orgId=...
```

---

# 11. Navigation

CRM manifest navigation should include:

```ts
navItems: [
  {
    label: 'CRM',
    href: '/crm',
    icon: 'Handshake',
    requiredPermission: {
      module: 'crm',
      resource: 'dashboard',
      action: 'read',
    },
  },
  {
    label: 'Customers',
    href: '/crm/customers',
    icon: 'Users',
    requiredPermission: {
      module: 'crm',
      resource: 'customer_profile',
      action: 'read',
    },
  },
  {
    label: 'Opportunities',
    href: '/crm/opportunities',
    icon: 'CircleDollarSign',
    requiredPermission: {
      module: 'crm',
      resource: 'opportunity',
      action: 'read',
    },
  },
  {
    label: 'Pipeline',
    href: '/crm/pipeline',
    icon: 'Kanban',
    requiredPermission: {
      module: 'crm',
      resource: 'pipeline',
      action: 'read',
    },
  },
]
```

Navigation visibility requires:

```txt
authenticated user
+ tenant membership
+ CRM module enabled for org
+ required permission
```

Hidden navigation is not security.

Routes, APIs, and services still enforce authorization.

---

# 12. Services

CRM services must be server-only and must receive verified `PlatformContext`.

```ts
CrmCustomerProfileService
CrmPipelineService
CrmOpportunityService
CrmFollowUpService
```

Service methods must not accept loose `orgId`.

Bad:

```ts
CrmOpportunityService.list(orgId)
CrmOpportunityService.create(orgId, input)
```

Good:

```ts
CrmOpportunityService.list(ctx, filters)
CrmOpportunityService.create(ctx, input)
```

## 12.1 Example Service Pattern

```ts
export class CrmOpportunityService {
  static async create(ctx: PlatformContext, input: CreateOpportunityInput) {
    await sdk.permissions.require(ctx, {
      module: 'crm',
      resource: 'opportunity',
      action: 'create',
    })

    const db = sdk.getDb(ctx)

    // Revalidate tenant-safe Customer relation
    const customer = await db.customer.findFirst({
      where: {
        id: input.customerId,
        orgId: ctx.org.id,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!customer) {
      throw new OneDayError('CUSTOMER_NOT_FOUND', 'Customer not found.', 404)
    }

    const opportunity = await db.crmOpportunity.create({
      data: {
        orgId: ctx.org.id,
        customerId: input.customerId,
        pipelineId: input.pipelineId,
        stageId: input.stageId,
        ownerEmployeeId: input.ownerEmployeeId ?? null,
        title: input.title,
        estimatedValue: input.estimatedValue ?? null,
        expectedCloseDate: input.expectedCloseDate ?? null,
      },
    })

    await sdk.events.emit(ctx, 'crm.opportunity.created', {
      opportunityId: opportunity.id,
      customerId: opportunity.customerId,
      stageId: opportunity.stageId,
      ownerEmployeeId: opportunity.ownerEmployeeId,
    })

    return opportunity
  }
}
```

## 12.2 Service Authorization

Public CRM service methods should enforce permissions internally during MVP.

API routes should also enforce permissions before calling services.

This double enforcement is intentional for MVP safety.

---

# 13. Validation

CRM schemas must use Zod and `z.strictObject()` for request bodies.

## 13.1 Forbidden Fields

CRM client input schemas must reject:

```txt
orgId
deletedAt
deletedBy
createdAt
updatedAt
wonAt
lostAt
closedAt
```

unless a very specific internal server-only schema requires them.

## 13.2 Create Opportunity Schema

Example:

```ts
export const CreateOpportunitySchema = z.strictObject({
  customerId: z.string().min(1),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1),
  ownerEmployeeId: z.string().min(1).optional(),
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  estimatedValue: z.coerce.number().nonnegative().optional(),
  currency: z.string().length(3).default('PHP'),
  expectedCloseDate: z.iso.datetime().optional(),
})
```

## 13.3 Stage Change Schema

```ts
export const ChangeOpportunityStageSchema = z.strictObject({
  stageId: z.string().min(1),
})
```

## 13.4 Close Opportunity Schema

```ts
export const CloseOpportunitySchema = z.strictObject({
  outcome: z.enum(['won', 'lost']),
  lostReason: z.string().max(500).optional(),
})
```

Rules:

```txt
If outcome = lost, lostReason may be required by module setting.
If outcome = won, lostReason must not be submitted.
```

---

# 14. Events

CRM events use the `crm` namespace.

Business Object Customer events use the `objects` namespace.

## 14.1 CRM Events Emitted

```txt
crm.customer_profile.created
crm.customer_profile.updated
crm.customer_profile.deleted
crm.customer_profile.restored

crm.pipeline.created
crm.pipeline.updated
crm.pipeline.deleted
crm.pipeline.restored

crm.pipeline_stage.created
crm.pipeline_stage.updated
crm.pipeline_stage.deleted
crm.pipeline_stage.restored

crm.opportunity.created
crm.opportunity.updated
crm.opportunity.stage_changed
crm.opportunity.won
crm.opportunity.lost
crm.opportunity.cancelled
crm.opportunity.deleted
crm.opportunity.restored

crm.follow_up.created
crm.follow_up.updated
crm.follow_up.completed
crm.follow_up.cancelled
crm.follow_up.deleted
crm.follow_up.restored
```

## 14.2 Events Not Emitted by CRM

CRM must not emit Customer Business Object events directly.

These are emitted by the Business Object service:

```txt
objects.customer.created
objects.customer.updated
objects.customer.deleted
objects.customer.restored
```

## 14.3 Event Payload Rules

Event payloads must not include:

```txt
orgId
full Prisma records
full customer records
full notes
secrets
tokens
sensitive fields
```

Example payload:

```ts
await sdk.events.emit(ctx, 'crm.opportunity.won', {
  opportunityId: opportunity.id,
  customerId: opportunity.customerId,
  estimatedValue: opportunity.estimatedValue?.toString() ?? null,
  closedAt: opportunity.closedAt?.toISOString() ?? null,
})
```

## 14.4 Event Listeners

CRM MVP does not need to listen to other module events.

Future possible listeners:

```txt
objects.customer.deleted -> mark CRM profile unavailable
objects.employee.deactivated -> unassign or flag owned opportunities
```

Do not implement these listeners until needed.

---

# 15. UI Screens

## 15.1 CRM Dashboard

Purpose:

```txt
Quick sales overview for the organization.
```

Suggested MVP cards:

```txt
Open opportunities
Estimated open pipeline value
Won opportunities this month
Follow-ups due
```

This is module-local dashboard behavior, not Reporting Service.

The dashboard must respect permissions.

If user lacks opportunity read permission, do not show opportunity metrics.

## 15.2 Customers Page

Purpose:

```txt
CRM-specific view of shared Customer records with CRM profile data.
```

Table columns:

```txt
Customer name
Lifecycle stage
Owner
Phone/email
Last contacted
Next follow-up
Open opportunities
```

Important:

This page displays `Customer` + `CrmCustomerProfile`.

It must not imply that CRM owns Customer.

## 15.3 Customer Detail Page

Purpose:

```txt
Show CRM-specific customer relationship context.
```

MVP sections:

```txt
Customer summary
CRM profile
Open opportunities
Won/lost opportunities
Follow-ups
```

Do not implement generic comments, attachments, activity feed, or AI.

## 15.4 Opportunities Page

Purpose:

```txt
List and filter opportunities.
```

Table columns:

```txt
Title
Customer
Stage
Owner
Estimated value
Expected close date
Status
Updated at
```

Filters:

```txt
status
stage
owner
expected close date
customer
```

Saved views are deferred.

## 15.5 Opportunity Detail Page

Purpose:

```txt
Manage one opportunity.
```

Sections:

```txt
Opportunity details
Customer link
Current stage
Owner
Estimated value
Expected close date
Status
Follow-ups
Stage movement action
Win/loss action
```

## 15.6 Pipeline Page

Purpose:

```txt
Simple pipeline board or stage list.
```

MVP may start as a grouped table by stage.

Kanban drag-and-drop is optional and may be deferred.

If drag-and-drop is implemented, it must still call a permission-enforced stage-change API.

## 15.7 Follow-Ups Page

Optional MVP.

Purpose:

```txt
List open and overdue follow-up tasks.
```

This is not Notification Service.

No email/SMS reminders in MVP.

---

# 16. Forms

CRM forms must follow OneDayOS form standards.

## 16.1 Create CRM Customer Form

This may be a composite workflow:

```txt
Create Customer Business Object
+ Create CrmCustomerProfile
```

Required permissions:

```txt
objects.customer.create
crm.customer_profile.create
```

The service must own the transaction.

Fields:

```txt
Customer name
Email
Phone
Address
Lifecycle stage
Source
Owner
Notes
```

No hidden `orgId`.

## 16.2 Create Opportunity Form

Fields:

```txt
Customer
Title
Pipeline
Stage
Owner
Estimated value
Currency
Expected close date
Description
```

Relation fields must be tenant-scoped and revalidated server-side.

## 16.3 Stage Change Form

Fields:

```txt
New stage
```

If moving to won/lost stage, the UI may route to close form.

## 16.4 Close Opportunity Form

Fields:

```txt
Outcome: won/lost
Lost reason
```

If won:

```txt
set status = won
set wonAt
set closedAt
move to Won stage if configured
emit crm.opportunity.won
```

If lost:

```txt
set status = lost
set lostAt
set closedAt
set lostReason
move to Lost stage if configured
emit crm.opportunity.lost
```

---

# 17. Tables

CRM should use the shared OneDayOS table standards.

MVP tables:

```txt
CRM customers table
Opportunities table
Pipeline stages table
Follow-ups table
```

Each table should support:

```txt
loading state
empty state
error state
permission-aware row actions
soft-deleted record exclusion
tenant-scoped data
keyboard-friendly interaction where practical
```

Do not implement saved views yet.

Do not implement dynamic table runtime yet.

---

# 18. Settings

CRM settings are module settings under the `crm` namespace.

Possible MVP settings:

```txt
defaultPipelineId
defaultCurrency = PHP
requireLostReason = true
enableFollowUps = true
```

Settings must be validated with Zod.

Settings must not store secrets.

Settings must not store arbitrary custom fields JSON.

---

# 19. AI Context

CRM module AI context should teach future AI:

```txt
CRM manages sales relationships and opportunities.
Customer is a shared Business Object.
CRM does not own Customer identity.
Prospects are represented as Customers with CRM lifecycle stage in MVP.
Opportunities are CRM-owned records.
Pipeline stages are CRM-owned records.
Follow-ups are CRM-owned records.
CRM does not handle invoicing, email campaigns, attachments, or support tickets in MVP.
```

Safe future questions:

```txt
What is the CRM module used for?
How do I create an opportunity?
What does opportunity stage mean?
Why is Customer shared across modules?
What is the difference between Customer and Opportunity?
```

Unsafe/deferred questions:

```txt
Export all customer data.
Email all prospects.
Generate SQL for lost deals.
Change all opportunities to won.
Show customers from another organization.
```

Runtime AI features remain deferred.

---

# 20. Reports and Dashboards

CRM MVP may have simple module-local dashboard summaries.

Allowed:

```txt
open opportunity count
won opportunity count
lost opportunity count
estimated pipeline value
opportunities by stage
follow-ups due
```

Deferred:

```txt
Reporting Service
custom report builder
scheduled reports
PDF reports
cross-module reports
AI reporting
export engine
```

If a client asks for complex CRM reporting, classify it as:

```txt
module-local enhancement
or future Reporting Service evidence
```

not an automatic platform service.

---

# 21. Seed Data

When CRM is enabled for an organization, the module provisioning hook may create:

```txt
Default CRM Pipeline
Default Pipeline Stages
Optional Sales Staff role template
Default CRM settings
```

Default pipeline:

```txt
Pipeline: Default Sales Pipeline

Stages:
1. New
2. Qualified
3. Proposal
4. Negotiation
5. Won
6. Lost
```

Rules:

```txt
Seed must be idempotent.
Seed must not overwrite existing client pipeline changes.
Seed must use verified system/admin PlatformContext or approved provisioning context.
Seed must not accept client-supplied orgId.
Seed must not create sample customers in production unless explicitly requested.
```

---

# 22. Tests

CRM implementation is not complete unless these tests exist.

## 22.1 Service Tests

Required:

```txt
create CRM customer profile with valid Customer
reject profile for Customer from another org
reject duplicate profile for same Customer
create opportunity
reject opportunity for Customer from another org
reject opportunity for PipelineStage from another org
move opportunity stage
mark opportunity won
mark opportunity lost
soft delete opportunity
restore opportunity if restore implemented
emit expected events after successful mutations
do not emit events after failed mutations
```

## 22.2 Permission Tests

Required:

```txt
staff without crm.opportunity.create cannot create opportunity
staff without crm.opportunity.update cannot move stage
staff without crm.opportunity.close cannot win/lost opportunity
staff without objects.customer.create cannot create Customer from CRM
staff without crm.customer_profile.create cannot create CRM profile
admin wildcard works only inside verified org
```

## 22.3 Tenant Isolation Tests

Every tenant-sensitive CRM test suite must use at least two organizations.

Required:

```txt
Org A user cannot list Org B opportunities
Org A user cannot read Org B opportunity detail
Org A user cannot create opportunity for Org B Customer
Org A user cannot move Org B opportunity stage
Org A user cannot use Org B pipeline stage
Org A user cannot update Org B CRM profile
client-supplied orgId is rejected
```

## 22.4 API Tests

Required:

```txt
401 JSON for unauthenticated requests
403 JSON for missing permission
safe 404 for wrong org
404 MODULE_NOT_FOUND when CRM disabled
400 VALIDATION_ERROR for invalid body
TENANT_ID_NOT_ALLOWED for submitted orgId
success response uses { data, error, meta? }
no redirects
no HTML auth pages
```

## 22.5 UI Tests

Required:

```txt
CRM nav hidden when module disabled
CRM nav hidden when permission missing
CRM dashboard renders for authorized user
opportunity table empty state
opportunity create form validation
form does not include hidden orgId
stage action hidden when permission missing
win/loss action hidden when permission missing
```

## 22.6 Architecture Tests

Required:

```txt
CRM module does not import @/kernel/*
CRM module does not import other modules
CRM module does not import raw Prisma
CRM module does not use sdk.getDb(orgId)
CRM module does not accept client-supplied orgId
CRM module does not create duplicate Customer table
CRM module does not emit objects.customer.* directly
CRM module APIs live under /api/orgs/[orgSlug]/crm/...
```

---

# 23. Implementation Plan

Claude must implement CRM only after the required foundation documents and helpers exist.

## 23.1 Pre-Implementation Checks

Before CRM implementation starts:

```txt
[ ] PlatformContext implemented
[ ] sdk.getDb(ctx) implemented
[ ] API route wrapper implemented
[ ] API-safe auth helper implemented
[ ] requireApiModuleContext implemented
[ ] permission enforcement implemented
[ ] Business Object Customer service implemented
[ ] Employee Business Object service implemented or lookup helper implemented
[ ] Event SDK implemented
[ ] module manifest contract implemented
[ ] module registry implemented
[ ] two-org test fixtures implemented
[ ] CI architecture checks implemented
```

If any of these are missing, Claude must stop and report the missing dependency.

## 23.2 Build Steps

Recommended implementation sequence:

```txt
1. Run module generator for crm.
2. Replace scaffold placeholders with CRM manifest, permissions, schemas, services, APIs, pages, tests.
3. Add Prisma models:
   - CrmCustomerProfile
   - CrmPipeline
   - CrmPipelineStage
   - CrmOpportunity
   - CrmFollowUp if included
4. Run Prisma migration locally.
5. Add CRM provisioning seed/hook for default pipeline/stages.
6. Implement CRM services.
7. Implement CRM API routes.
8. Implement CRM pages.
9. Implement CRM UI components.
10. Add tests.
11. Run:
    - npm run lint
    - npm run typecheck
    - npm run test:run
    - npm run check:architecture
    - npm run build
12. Enable CRM for demo org/staging org.
13. Perform smoke test.
```

---

# 24. Module Manifest Requirements

CRM manifest must include:

```ts
export const crmManifest = {
  id: 'crm',
  label: 'CRM',
  description: 'Manage customers, opportunities, pipeline stages, and sales follow-ups.',
  version: '0.1.0',
  lifecycle: 'draft',
  compatibility: {
    platform: { min: '0.1.0' },
    sdk: { min: '0.1.0' },
    manifest: { min: '1.0.0' },
  },
  icon: 'Handshake',
  businessObjectsUsed: ['customer', 'employee'],
  moduleOwnedEntities: [
    'crm_customer_profile',
    'crm_pipeline',
    'crm_pipeline_stage',
    'crm_opportunity',
    'crm_follow_up',
  ],
  permissions: [
    // full permission objects, not action arrays
  ],
  navItems: [
    // permission-aware nav items
  ],
  events: {
    emits: [
      'crm.customer_profile.created',
      'crm.customer_profile.updated',
      'crm.opportunity.created',
      'crm.opportunity.updated',
      'crm.opportunity.stage_changed',
      'crm.opportunity.won',
      'crm.opportunity.lost',
    ],
    listens: [],
  },
  settings: [
    'defaultPipelineId',
    'defaultCurrency',
    'requireLostReason',
    'enableFollowUps',
  ],
  aiContext: crmAiContext,
}
```

Manifest must be pure metadata.

Manifest must not:

```txt
import @/kernel/*
import @/sdk/server
import raw Prisma
self-register through side effects
include seed functions directly
include secrets
include tenant data
```

---

# 25. Deferred CRM Features

Deferred until repeated use cases prove them:

```txt
separate Lead entity
Contact Person entity
customer merge/deduplication
email integration
SMS integration
marketing campaign module
quote/proposal generation
sales order generation
invoice integration
customer portal
file attachments
notes/comments service
activity feed
notifications/reminders
advanced reporting
sales forecasting
commissions
targets/quotas
territory management
AI lead scoring
AI email drafting
AI query/reporting
mobile-specific CRM app
```

If a client asks for one of these, classify it through the scope ladder:

```txt
configuration
module extension
new module
Platform Service candidate
custom/premium work
reject/defer
```

Do not build these casually into CRM MVP.

---

# 26. Commercial Fit

CRM should be sellable as a OneDayOS module for SMEs that need:

```txt
customer/prospect list
sales pipeline
deal tracking
sales owner assignment
follow-up reminders inside CRM UI
basic sales dashboard
```

CRM is not appropriate for clients that require:

```txt
full marketing automation
integrated call center
enterprise Salesforce replacement
complex sales commission logic
regulated client communication archiving
multi-channel support system
deep email/calendar integration
```

Those should be quoted separately, deferred, or rejected.

---

# 27. Acceptance Criteria

CRM is implementation-ready only when this specification is approved and frozen.

CRM is production-ready only when:

```txt
[ ] CRM uses shared Customer Business Object
[ ] CRM does not duplicate Customer
[ ] CRM uses Employee for owner assignment
[ ] CRM services receive PlatformContext
[ ] CRM APIs live under /api/orgs/[orgSlug]/crm/...
[ ] CRM client schemas reject orgId
[ ] CRM APIs return { data, error, meta? }
[ ] CRM APIs never redirect
[ ] CRM permissions are enforced in APIs and services
[ ] CRM module enablement is enforced
[ ] CRM soft-deletes module records
[ ] CRM excludes soft-deleted records by default
[ ] CRM emits CRM events for CRM mutations
[ ] CRM does not emit Business Object events directly
[ ] CRM has two-org tenant isolation tests
[ ] CRM has permission-denial tests
[ ] CRM has API failure-path tests
[ ] CRM has UI tests for key screens
[ ] CRM passes architecture checks
[ ] CRM passes typecheck
[ ] CRM passes tests
[ ] CRM passes build
[ ] CRM does not implement deferred Platform Services
```

---

# 28. Claude Implementation Prompt

Use this prompt only after this document is approved and frozen.

```md
You are implementing the OneDayOS CRM Module.

Authoritative documents:
- docs/engineering-manual/17-module-specifications/03-crm-module.md
- docs/engineering-manual/17-module-specifications/00-module-spec-template.md
- docs/engineering-manual/07-business-objects/03-customer.md
- docs/engineering-manual/07-business-objects/01-employee.md
- docs/engineering-manual/07-business-objects/07-business-object-extension-pattern.md
- docs/engineering-manual/08-module-system/*
- docs/engineering-manual/05-sdk/*
- docs/engineering-manual/13-security/*
- docs/engineering-manual/14-testing-quality/*

Rules:
- Do not invent architecture.
- Do not duplicate Customer.
- Do not create Lead unless explicitly approved in a later ADR.
- Do not import from @/kernel/* inside the CRM module.
- Do not import raw Prisma inside the CRM module.
- Do not import other modules.
- Do not use sdk.getDb(orgId).
- Use sdk.getDb(ctx).
- Services must receive PlatformContext.
- APIs must live under /api/orgs/[orgSlug]/crm/...
- Pages must live under /[orgSlug]/crm/...
- Reject client-supplied orgId.
- Enforce permissions in APIs and services.
- Use shared Customer Business Object service for Customer creation/update.
- Use CRM extension table for CRM-specific customer fields.
- Emit crm.* events for CRM mutations.
- Do not emit objects.customer.* directly from CRM services.
- Do not implement Notifications, Activity Feed, Comments, Attachments, Reporting, AI, or Background Jobs.
- Add tenant-isolation and permission-denial tests.
- Add architecture checks if needed.
- Stop and report if PlatformContext, sdk.getDb(ctx), permission helpers, API wrapper, or Business Object services do not exist.

Task:
Implement the CRM Module exactly as specified.
```

---

# 29. Founder Review Checklist

Before approving this document:

```txt
[ ] CRM scope is small enough for early OneDayOS delivery
[ ] CRM does not duplicate Customer
[ ] CRM does not create Lead prematurely
[ ] CRM uses Customer + CRM profile for prospects
[ ] Opportunity workflow is clear
[ ] Pipeline stages are simple enough
[ ] Follow-ups are acceptable as module-local CRM records
[ ] Deferred features are clearly excluded
[ ] Permissions are understandable
[ ] API routes match platform rules
[ ] Tests are strong enough
[ ] Claude prompt is narrow enough
```

---

# 30. Final Rule

CRM should make OneDayOS more reusable, not more bespoke.

If CRM starts becoming a custom Salesforce clone, stop.

If CRM needs Customer identity, use the Customer Business Object.

If CRM needs sales-specific customer data, use `CrmCustomerProfile`.

If CRM needs pipeline behavior, keep it inside CRM.

If three independent modules need the same cross-cutting capability, record evidence and promote through the Platform Service process.

Do not fork the platform for one client.
