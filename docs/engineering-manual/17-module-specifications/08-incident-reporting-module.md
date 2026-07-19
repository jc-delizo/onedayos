# OneDayOS Engineering Manual — Incident Reporting Module Specification

**Document ID:** `17-module-specifications/08-incident-reporting-module.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Incident Reporting Module Implementation  
**Owner:** OneDayOS Founder / Lead Architect  
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
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `07-business-objects/00-business-object-philosophy.md`
- `07-business-objects/01-employee.md`
- `07-business-objects/07-business-object-extension-pattern.md`
- `07-business-objects/08-business-object-event-contracts.md`
- `08-module-system/00-module-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `08-module-system/03-module-folder-contract.md`
- `08-module-system/04-module-permissions.md`
- `08-module-system/06-module-events.md`
- `09-cli-generators/06-generator-safety-rails.md`
- `13-security/08-production-readiness-gate.md`
- `17-module-specifications/00-module-spec-template.md`

---

# 1. Purpose

The **Incident Reporting Module** allows an organization to record, track, assign, investigate, and close internal business incidents.

Examples:

```txt
Safety incident
Security incident
Operational issue
Property damage
Quality issue
Policy violation
Near miss
Customer complaint routed internally
```

The module is intended for Philippine SMEs that need a practical incident log and follow-up workflow without immediately requiring a full EHS system, helpdesk system, audit system, notification engine, attachment service, or workflow engine.

The MVP goal is:

```txt
Capture incident
Classify severity
Assign responsibility
Track corrective actions
Resolve / close
Keep tenant-safe record history through events and status fields
```

This module should be useful for:

```txt
warehouses
schools
clinics, with caution
small factories
logistics companies
offices
retail branches
property management teams
service companies
```

---

# 2. Architectural Position

Incident Reporting is a **Business Module**.

It is not:

```txt
Kernel
Business Object layer
Platform Service
Audit Log Service
Notification Service
Workflow Engine
Comments Service
Attachment Service
Activity Feed
Helpdesk system
HR disciplinary system
Legal case management system
```

It consumes the platform through the SDK.

It must not import from:

```txt
@/kernel/*
other modules
raw Prisma
server env helpers from client components
```

It must use:

```ts
import { sdk } from '@/sdk/server'
```

for server-side platform access.

It must receive verified `PlatformContext`, never loose `orgId` strings.

```ts
IncidentService.create(ctx, input)
IncidentService.assign(ctx, incidentId, input)
IncidentService.close(ctx, incidentId, input)
```

Forbidden:

```ts
IncidentService.create(orgId, input)
IncidentService.list(orgId)
sdk.getDb(orgId)
```

Required:

```ts
IncidentService.create(ctx, input)
IncidentService.list(ctx, filters)
sdk.getDb(ctx)
```

---

# 3. Module Identity

Recommended module identity:

```ts
id: 'incidents'
label: 'Incident Reporting'
icon: 'TriangleAlert'
version: '0.1.0'
lifecycle: 'draft'
```

Recommended route base:

```txt
/[orgSlug]/incidents
```

Recommended API base:

```txt
/api/orgs/[orgSlug]/incidents
```

Recommended event namespace:

```txt
incidents.*
```

Use `incidents`, not `incident-reporting`, for route and event namespace brevity.

---

# 4. Non-Goals

The MVP must not implement:

```txt
photo uploads
file attachments
ID/document uploads
platform-wide Attachment Service
notifications
email alerts
SMS alerts
workflow engine
approval workflow engine
comments service
activity feed
audit log service
AI incident analysis
AI risk scoring
legal case management
compliance reporting
OSHA-style enterprise EHS features
insurance claim management
police blotter integration
visitor access control
asset insurance workflows
customer support ticketing
SLA engine
real-time incident command center
mobile offline mode
public incident submission portal
anonymous reporting portal
```

Some of these may become future module extensions or Platform Services after evidence exists.

Do not build them during the first Incident Reporting implementation.

---

# 5. Business Workflows

## 5.1 Report Incident

A user records an incident.

Minimum fields:

```txt
title
description
category
severity
occurredAt
location
reporter
```

The reporter may be:

```txt
current platform user
linked Employee
manually entered reporter name if no Employee link exists
```

Preferred MVP:

```txt
reportedByUserId = ctx.user.id
reporterEmployeeId = ctx.employee?.id when available
```

The client must not submit `orgId`.

The service derives tenant from `PlatformContext`.

---

## 5.2 Triage Incident

A manager or authorized user reviews the incident.

Triage may set:

```txt
severity
priority
status
assignedToEmployeeId
dueAt
initial notes
```

Triage is not an approval workflow.

Do not use or create Platform Approval Workflow Service.

---

## 5.3 Assign Incident

An authorized user assigns responsibility to an Employee.

Assignment should record:

```txt
assignedToEmployeeId
assignedAt
assignedByUserId
status transition when appropriate
```

Assignment does not send notifications in MVP.

If the assigned user needs to know, the UI can show assigned incidents when they log in.

Notification Service remains deferred.

---

## 5.4 Add Corrective Action

A corrective action is a concrete follow-up item connected to the incident.

Examples:

```txt
Repair damaged shelf
Conduct safety briefing
Replace defective tool
Review CCTV footage
Update procedure
Interview involved staff
```

Corrective actions are module-owned records, not Platform Comments and not Tasks Service.

They may have:

```txt
description
assignedToEmployeeId
dueAt
status
completedAt
completedByUserId
```

---

## 5.5 Resolve Incident

A responsible user marks the incident as resolved after required work is done.

Resolution should capture:

```txt
resolutionSummary
rootCause, optional
resolvedAt
resolvedByUserId
```

Resolution does not necessarily mean final closure.

---

## 5.6 Close Incident

A manager or authorized user closes the incident after review.

Closing should capture:

```txt
closedAt
closedByUserId
closureNotes, optional
```

Closed incidents are business records and should not be deleted.

---

## 5.7 Reopen Incident

An authorized user may reopen a closed incident if additional work is needed.

Reopening should:

```txt
set status to reopened or in_review
record reopenedAt
record reopenedByUserId
emit event
```

---

## 5.8 Cancel Erroneous Incident

Cancellation is business state.

Use cancellation for reports that should remain visible as business history but should no longer be acted on.

Soft delete is only for erroneous test records, duplicate entries, or records that should be hidden from normal operation.

---

# 6. Business Objects Used

Incident Reporting may use the following shared objects / Kernel primitives:

| Object / Primitive | Layer | Usage |
|---|---|---|
| Employee | Business Object | Reporter, assignee, resolver, closer, involved person |
| Branch | Kernel org structure | Incident location |
| Department | Kernel org structure | Department involved |
| Warehouse | Business Object | Optional incident location for warehouse-related incidents |
| User | Kernel identity | Actor performing actions |
| Organization | Kernel tenancy | Tenant boundary |

Important:

```txt
Incident Reporting does not own Employee.
Incident Reporting does not own Branch.
Incident Reporting does not own Department.
Incident Reporting does not own Warehouse.
Incident Reporting does not own User.
```

Forbidden duplicate tables:

```txt
IncidentEmployee
SafetyEmployee
ReporterEmployee
IncidentWarehouse
IncidentDepartment
```

Use existing shared records through tenant-safe relationships.

---

# 7. Module-Owned Entities

Incident Reporting owns incident-specific workflow records.

Recommended MVP entities:

```txt
IncidentCategory
Incident
IncidentCorrectiveAction
```

Optional future entities:

```txt
IncidentInvolvedPerson
IncidentStatusHistory
IncidentRiskAssessment
IncidentAttachmentLink, after Attachment Service exists
```

Do not create optional future entities in MVP unless explicitly approved.

---

# 8. Data Model Draft

This is a design-level schema sketch. The final Prisma schema may adjust field names, but must preserve the architecture.

## 8.1 IncidentCategory

```prisma
model IncidentCategory {
  id          String    @id @default(cuid())
  orgId       String
  code        String
  name        String
  description String?
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  org       Organization @relation(fields: [orgId], references: [id])
  incidents Incident[]

  @@unique([orgId, code])
  @@unique([id, orgId])
  @@index([orgId, isActive])
  @@map("incident_categories")
}
```

Category examples:

```txt
Safety
Security
Property Damage
Equipment Failure
Quality Issue
Near Miss
Policy Violation
Other
```

---

## 8.2 Incident

```prisma
model Incident {
  id                  String    @id @default(cuid())
  orgId               String
  incidentNo          String
  categoryId          String?

  title               String
  description         String
  severity            String    @default("medium")
  priority            String    @default("normal")
  status              String    @default("reported")

  occurredAt          DateTime
  reportedAt          DateTime  @default(now())
  reportedByUserId    String
  reporterEmployeeId  String?

  branchId            String?
  departmentId        String?
  warehouseId         String?
  locationText        String?

  assignedToEmployeeId String?
  assignedAt          DateTime?
  assignedByUserId    String?

  rootCause           String?
  resolutionSummary   String?
  resolvedAt          DateTime?
  resolvedByUserId    String?

  closedAt            DateTime?
  closedByUserId      String?
  cancelledAt         DateTime?
  cancelledByUserId   String?
  cancellationReason  String?

  dueAt               DateTime?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?
  deletedBy           String?

  org                 Organization       @relation(fields: [orgId], references: [id])
  category            IncidentCategory?  @relation(fields: [categoryId], references: [id])
  reporterEmployee    Employee?          @relation("IncidentReporter", fields: [reporterEmployeeId], references: [id])
  assignedToEmployee  Employee?          @relation("IncidentAssignee", fields: [assignedToEmployeeId], references: [id])
  warehouse           Warehouse?         @relation(fields: [warehouseId], references: [id])
  correctiveActions   IncidentCorrectiveAction[]

  @@unique([orgId, incidentNo])
  @@unique([id, orgId])
  @@index([orgId, status])
  @@index([orgId, severity])
  @@index([orgId, categoryId])
  @@index([orgId, reportedAt])
  @@index([orgId, assignedToEmployeeId])
  @@map("incidents")
}
```

Notes:

```txt
incidentNo is unique per organization.
status is business state.
deletedAt is record lifecycle.
orgId is server-derived only.
```

Branch and Department relations may be implemented after Kernel relation details are finalized. If cross-schema relation complexity is not worth it in MVP, store `branchId` / `departmentId` as tenant-validated string references and resolve through services.

---

## 8.3 IncidentCorrectiveAction

```prisma
model IncidentCorrectiveAction {
  id                   String    @id @default(cuid())
  orgId                String
  incidentId           String

  description          String
  status               String    @default("open")
  assignedToEmployeeId String?
  dueAt                DateTime?
  completedAt          DateTime?
  completedByUserId    String?

  createdByUserId      String
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  deletedAt            DateTime?
  deletedBy            String?

  org                  Organization @relation(fields: [orgId], references: [id])
  incident             Incident     @relation(fields: [incidentId, orgId], references: [id, orgId])
  assignedToEmployee   Employee?    @relation(fields: [assignedToEmployeeId], references: [id])

  @@unique([id, orgId])
  @@index([orgId, incidentId])
  @@index([orgId, status])
  @@index([orgId, assignedToEmployeeId])
  @@map("incident_corrective_actions")
}
```

Corrective actions are not Platform Comments.

They are structured business follow-up items specific to incident resolution.

---

# 9. Status Model

Recommended Incident statuses:

```txt
reported
in_review
assigned
in_progress
resolved
closed
cancelled
reopened
```

Recommended Corrective Action statuses:

```txt
open
in_progress
completed
cancelled
```

Status transitions must be service-owned.

Do not let the client submit arbitrary status changes directly.

Bad:

```ts
await db.incident.update({ data: body })
```

Good:

```ts
await IncidentService.assign(ctx, incidentId, input)
await IncidentService.resolve(ctx, incidentId, input)
await IncidentService.close(ctx, incidentId, input)
```

---

# 10. Permissions

Permissions use the module namespace:

```txt
incidents.*
```

Recommended permissions:

```txt
incidents.incident.create
incidents.incident.read
incidents.incident.update
incidents.incident.delete
incidents.incident.assign
incidents.incident.triage
incidents.incident.resolve
incidents.incident.close
incidents.incident.reopen
incidents.incident.cancel
incidents.incident.export

incidents.category.create
incidents.category.read
incidents.category.update
incidents.category.delete

incidents.corrective_action.create
incidents.corrective_action.read
incidents.corrective_action.update
incidents.corrective_action.delete
incidents.corrective_action.complete
```

Optional self-service permissions:

```txt
incidents.own_incident.create
incidents.own_incident.read
```

Use self-service permissions only if the first implementation includes a staff reporting portal.

If the first implementation is manager/admin-only, do not add own-record logic yet.

---

# 11. Permission Rules

## 11.1 Create Incident

Creating an incident requires either:

```txt
incidents.incident.create
```

or, if staff self-reporting is enabled:

```txt
incidents.own_incident.create
```

If `own_incident.create` is used, the service must force:

```txt
reportedByUserId = ctx.user.id
reporterEmployeeId = ctx.employee.id if linked
```

The client may not choose another reporter unless the user has manager-level create/update permission.

---

## 11.2 Read Incident

Reading all incidents requires:

```txt
incidents.incident.read
```

Reading own incidents may use:

```txt
incidents.own_incident.read
```

Own-read logic must be explicit in the service.

Do not hide it inside raw Prisma query fragments from the client.

---

## 11.3 Assign / Triage / Close

These require explicit permissions:

```txt
incidents.incident.triage
incidents.incident.assign
incidents.incident.close
```

Do not treat `update` as enough for all status transitions.

---

## 11.4 Export

Export requires:

```txt
incidents.incident.export
```

Read permission is not export permission.

Export remains deferred unless specifically implemented.

---

# 12. Routes

Recommended pages:

```txt
/[orgSlug]/incidents
/[orgSlug]/incidents/new
/[orgSlug]/incidents/[id]
/[orgSlug]/incidents/[id]/edit
/[orgSlug]/incidents/categories
/[orgSlug]/incidents/settings
```

MVP may implement fewer pages:

```txt
/[orgSlug]/incidents
/[orgSlug]/incidents/new
/[orgSlug]/incidents/[id]
```

Do not build settings until the module needs configurable defaults.

---

# 13. APIs

Recommended API routes:

```txt
GET    /api/orgs/[orgSlug]/incidents
POST   /api/orgs/[orgSlug]/incidents
GET    /api/orgs/[orgSlug]/incidents/[id]
PATCH  /api/orgs/[orgSlug]/incidents/[id]
DELETE /api/orgs/[orgSlug]/incidents/[id]

POST   /api/orgs/[orgSlug]/incidents/[id]/triage
POST   /api/orgs/[orgSlug]/incidents/[id]/assign
POST   /api/orgs/[orgSlug]/incidents/[id]/resolve
POST   /api/orgs/[orgSlug]/incidents/[id]/close
POST   /api/orgs/[orgSlug]/incidents/[id]/reopen
POST   /api/orgs/[orgSlug]/incidents/[id]/cancel

GET    /api/orgs/[orgSlug]/incidents/categories
POST   /api/orgs/[orgSlug]/incidents/categories
PATCH  /api/orgs/[orgSlug]/incidents/categories/[id]
DELETE /api/orgs/[orgSlug]/incidents/categories/[id]

POST   /api/orgs/[orgSlug]/incidents/[id]/corrective-actions
PATCH  /api/orgs/[orgSlug]/incidents/[id]/corrective-actions/[actionId]
POST   /api/orgs/[orgSlug]/incidents/[id]/corrective-actions/[actionId]/complete
DELETE /api/orgs/[orgSlug]/incidents/[id]/corrective-actions/[actionId]
```

Do not use:

```txt
/api/incidents?orgId=...
/api/incident-reporting
/api/[module]
```

Every API must:

```txt
return JSON only
never redirect
create verified PlatformContext
validate route params
validate query params
validate body
reject client-supplied orgId
enforce module enablement
enforce permission
call service with PlatformContext
return { data, error, meta? }
```

---

# 14. Service Contract

Recommended service shape:

```ts
export class IncidentService {
  static async list(ctx: PlatformContext, filters: ListIncidentsInput) {}
  static async getById(ctx: PlatformContext, id: string) {}
  static async create(ctx: PlatformContext, input: CreateIncidentInput) {}
  static async update(ctx: PlatformContext, id: string, input: UpdateIncidentInput) {}
  static async softDelete(ctx: PlatformContext, id: string) {}

  static async triage(ctx: PlatformContext, id: string, input: TriageIncidentInput) {}
  static async assign(ctx: PlatformContext, id: string, input: AssignIncidentInput) {}
  static async resolve(ctx: PlatformContext, id: string, input: ResolveIncidentInput) {}
  static async close(ctx: PlatformContext, id: string, input: CloseIncidentInput) {}
  static async reopen(ctx: PlatformContext, id: string, input: ReopenIncidentInput) {}
  static async cancel(ctx: PlatformContext, id: string, input: CancelIncidentInput) {}

  static async createCorrectiveAction(ctx: PlatformContext, incidentId: string, input: CreateCorrectiveActionInput) {}
  static async completeCorrectiveAction(ctx: PlatformContext, incidentId: string, actionId: string, input: CompleteCorrectiveActionInput) {}
}
```

Public service methods must enforce permission during MVP.

Example:

```ts
await sdk.permissions.require(ctx, {
  module: 'incidents',
  resource: 'incident',
  action: 'create',
})
```

Then perform validation and persistence through `sdk.getDb(ctx)`.

---

# 15. Validation Rules

Use Zod schemas.

All body schemas must reject unknown keys by default.

Client-supplied `orgId` is forbidden.

Example:

```ts
export const CreateIncidentSchema = z.strictObject({
  title: z.string().min(2).max(160),
  description: z.string().min(5).max(5000),
  categoryId: z.string().min(1).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  occurredAt: z.iso.datetime(),
  branchId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  warehouseId: z.string().min(1).optional(),
  locationText: z.string().max(255).optional(),
})
```

Tests must prove this fails:

```json
{
  "title": "Broken shelf",
  "description": "A shelf collapsed.",
  "orgId": "other-org"
}
```

Expected error:

```txt
TENANT_ID_NOT_ALLOWED
```

or validation failure for unrecognized key, depending on API wrapper design.

---

# 16. Events

Incident Reporting emits module events under the `incidents` namespace.

Recommended events:

```txt
incidents.incident.created
incidents.incident.updated
incidents.incident.triaged
incidents.incident.assigned
incidents.incident.resolved
incidents.incident.closed
incidents.incident.reopened
incidents.incident.cancelled
incidents.incident.deleted
incidents.incident.restored

incidents.corrective_action.created
incidents.corrective_action.updated
incidents.corrective_action.completed
incidents.corrective_action.cancelled
incidents.corrective_action.deleted

incidents.category.created
incidents.category.updated
incidents.category.deleted
```

Events are facts, not commands.

Bad:

```txt
incidents.notify_manager
incidents.send_email
incidents.create_task
```

Good:

```txt
incidents.incident.created
incidents.incident.assigned
incidents.corrective_action.completed
```

Event payloads must be small.

Example:

```ts
await sdk.events.emit(ctx, 'incidents.incident.created', {
  incidentId: incident.id,
  incidentNo: incident.incidentNo,
  severity: incident.severity,
  status: incident.status,
  categoryId: incident.categoryId,
})
```

Do not include:

```txt
orgId
full Prisma record
full description if sensitive
full user object
secrets
attachments
```

---

# 17. UI Screens

## 17.1 Incident List

Purpose:

```txt
Show incidents with filters and status overview.
```

Recommended columns:

```txt
Incident No
Title
Category
Severity
Status
Occurred At
Reported By
Assigned To
Due Date
```

Recommended filters:

```txt
status
severity
category
assignedToEmployeeId
branchId
reported date range
```

MVP filters may be simple query params; do not build Dynamic Table View Engine.

---

## 17.2 New Incident Form

Purpose:

```txt
Capture a new incident quickly.
```

Recommended fields:

```txt
title
description
category
severity
occurredAt
locationText
branch
department
warehouse, optional
```

No hidden `orgId` field.

No file upload field in MVP.

---

## 17.3 Incident Detail

Purpose:

```txt
Show full incident record, current status, assignment, corrective actions, and closure details.
```

Recommended sections:

```txt
summary
status/severity
report details
location
assignment
corrective actions
resolution
system metadata
```

Do not build generic comments.

Corrective actions are structured records, not comments.

---

## 17.4 Category Management

Purpose:

```txt
Allow admins/managers to configure incident categories.
```

MVP can seed categories and defer UI if delivery pressure is high.

---

# 18. Forms

Forms must follow OneDayOS form standards.

Required:

```txt
React Hook Form
Zod validation
clear labels
short help text/tooltips for non-obvious fields
no hidden orgId
disabled submit during request
success toast
error state
keyboard-submit support
```

Do not implement Dynamic Form Engine.

---

# 19. Tables

Tables must use the shared table design system.

Required list behavior:

```txt
empty state
loading/skeleton state
error state
row action menu
permission-aware action visibility
status badges
severity badges
```

Hidden actions are not security.

APIs and services enforce security.

---

# 20. Settings

MVP settings may be deferred.

Possible future settings:

```txt
default severity
default categories
incident number prefix
require branch
require department
allow staff self-reporting
auto-close after resolution, optional
```

Do not create a settings UI until at least one real client needs it.

If settings are needed, store through the Kernel `Setting` pattern with module key:

```txt
module = incidents
```

---

# 21. Seed Data

Recommended default categories:

```txt
SAFETY — Safety
SECURITY — Security
PROPERTY_DAMAGE — Property Damage
EQUIPMENT — Equipment Issue
QUALITY — Quality Issue
NEAR_MISS — Near Miss
POLICY — Policy Violation
OTHER — Other
```

Seed must be idempotent.

Seed must use verified org provisioning context or controlled provisioning scripts.

Seed must not overwrite client-customized categories.

---

# 22. Relationship to Deferred Platform Services

## 22.1 Attachment Service

Incident reports often need photos.

But file uploads are excluded from MVP.

Do not implement Attachment Service just because this module would benefit from it.

If a real client absolutely requires photos:

```txt
founder/architect approval required
module-local file handling may be considered
evidence log must be updated
future Attachment Service candidate is strengthened
```

But the default Incident Reporting MVP has no uploads.

---

## 22.2 Notification Service

Do not send automatic emails/SMS in MVP.

Emit events only.

Future Notification Service may listen to:

```txt
incidents.incident.created
incidents.incident.assigned
incidents.incident.closed
```

---

## 22.3 Activity Feed

Do not build timeline UI in MVP.

Events prepare for future activity feed.

---

## 22.4 Comments Service

Do not build generic comments.

Use structured fields and corrective actions.

If a client needs discussion threads across multiple records/modules, record it as Comments Service evidence.

---

## 22.5 Audit Log

Do not implement Audit Log Service in MVP.

Events prepare for future audit ingestion.

---

## 22.6 Workflow / Approval Engine

Incident closure is a local status transition.

Do not implement Platform Workflow or Approval Engine.

---

# 23. Module Manifest Requirements

The manifest should declare:

```ts
export const IncidentsModule = {
  id: 'incidents',
  label: 'Incident Reporting',
  version: '0.1.0',
  lifecycle: 'draft',
  icon: 'TriangleAlert',
  dependencies: [],
  businessObjects: ['employee', 'warehouse'],
  permissions: [
    { module: 'incidents', resource: 'incident', action: 'create' },
    { module: 'incidents', resource: 'incident', action: 'read' },
    { module: 'incidents', resource: 'incident', action: 'update' },
    { module: 'incidents', resource: 'incident', action: 'delete' },
    { module: 'incidents', resource: 'incident', action: 'assign' },
    { module: 'incidents', resource: 'incident', action: 'triage' },
    { module: 'incidents', resource: 'incident', action: 'resolve' },
    { module: 'incidents', resource: 'incident', action: 'close' },
    { module: 'incidents', resource: 'incident', action: 'reopen' },
    { module: 'incidents', resource: 'incident', action: 'cancel' },
    { module: 'incidents', resource: 'category', action: 'read' },
    { module: 'incidents', resource: 'category', action: 'create' },
    { module: 'incidents', resource: 'category', action: 'update' },
    { module: 'incidents', resource: 'category', action: 'delete' },
    { module: 'incidents', resource: 'corrective_action', action: 'create' },
    { module: 'incidents', resource: 'corrective_action', action: 'read' },
    { module: 'incidents', resource: 'corrective_action', action: 'update' },
    { module: 'incidents', resource: 'corrective_action', action: 'delete' },
    { module: 'incidents', resource: 'corrective_action', action: 'complete' },
  ],
  navItems: [
    {
      label: 'Incidents',
      href: '/incidents',
      icon: 'TriangleAlert',
      requiredPermission: { module: 'incidents', resource: 'incident', action: 'read' },
    },
  ],
  events: {
    emits: [
      'incidents.incident.created',
      'incidents.incident.assigned',
      'incidents.incident.resolved',
      'incidents.incident.closed',
      'incidents.corrective_action.completed',
    ],
    listens: [],
  },
}
```

Do not self-register the manifest as a side effect.

The module loader imports pure manifests through the module composition root.

---

# 24. AI Context

Runtime AI is deferred.

But the module may include static AI context metadata later.

The AI context should explain:

```txt
what incidents are
what statuses mean
what corrective actions are
that Employee is shared
that attachments are deferred
that notifications are deferred
that Incident Reporting is not a legal/compliance advisory system
```

AI must not receive incident descriptions or sensitive data unless a future AI feature is explicitly approved and permission-scoped.

---

# 25. Security Rules

Incident Reporting data may contain sensitive information.

Examples:

```txt
injury descriptions
staff behavior
security issues
property damage
customer complaints
workplace conflict
policy violations
```

Therefore:

```txt
No full record event payloads
No full request bodies in logs
No incident descriptions in operational logs
No sensitive data in AI context by default
No unrestricted exports
No client-supplied orgId
No support-staff tenant bypass
```

Exports require explicit export permission and are deferred unless approved.

---

# 26. Soft Delete and Business State

Use business states for real workflow outcomes:

```txt
cancelled
closed
resolved
```

Use soft delete only for erroneous records that should be hidden from normal operation.

Soft delete fields:

```txt
deletedAt
deletedBy
```

Deleted incidents should not appear in normal lists, filters, dashboards, exports, reports, or AI context.

Restore requires explicit permission if implemented.

---

# 27. Testing Requirements

Incident Reporting is not implementation-complete without tests.

Required test groups:

```txt
service tests
integration tests
API tests
permission tests
tenant isolation tests
validation tests
event tests
soft delete tests
UI tests
architecture checks
```

## 27.1 Tenant Isolation Tests

Must use at least two organizations:

```txt
Alpha Org
Beta Org
```

Required tests:

```txt
Alpha user cannot list Beta incidents
Alpha user cannot read Beta incident by ID
Alpha user cannot update Beta incident
Alpha user cannot close Beta incident
Alpha user cannot delete Beta incident
Alpha user cannot create corrective action on Beta incident
```

## 27.2 Permission Tests

Required tests:

```txt
user without incidents.incident.read cannot list incidents
user without incidents.incident.create cannot create incident
user without incidents.incident.assign cannot assign incident
user without incidents.incident.close cannot close incident
user without incidents.corrective_action.complete cannot complete corrective action
admin wildcard works only inside own org
```

Admin-only tests are insufficient.

## 27.3 API Failure Tests

Required tests:

```txt
unauthenticated API returns JSON 401, not redirect
wrong-org access returns safe 404
missing permission returns JSON 403
client-supplied orgId is rejected
invalid severity fails validation
invalid status transition fails
unknown body keys fail validation
module disabled returns safe 404 MODULE_NOT_FOUND
```

## 27.4 Event Tests

Required tests:

```txt
create emits incidents.incident.created
assign emits incidents.incident.assigned
resolve emits incidents.incident.resolved
close emits incidents.incident.closed
complete corrective action emits incidents.corrective_action.completed
failed mutation emits no event
event payload does not include orgId
event payload does not include full description unless explicitly approved
```

## 27.5 Soft Delete Tests

Required tests:

```txt
soft-deleted incidents do not appear in list
soft-deleted incidents return safe not found through normal getById
soft-deleted corrective actions do not appear normally
hard delete is not used for normal delete
```

## 27.6 Architecture Checks

Must block:

```txt
import from @/kernel/* inside module
raw Prisma inside module
sdk.getDb(orgId)
client-supplied orgId in schemas/forms/APIs
/api/incidents?orgId=...
direct imports from other modules
full record event payloads
FastAPI/Python backend files
```

---

# 28. Implementation Sequence

Do not implement Incident Reporting before the foundation exists.

Required before implementation:

```txt
PlatformContext helpers
sdk.getDb(ctx)
API auth/context wrappers
permission enforcement helpers
module manifest system
module loader
Business Object services for Employee/Warehouse lookup
API error contract
Zod validation contract
test fixtures with two organizations
check:architecture
```

Recommended implementation sequence:

```txt
1. Create module spec and founder approval
2. Generate module shell with Module Generator
3. Add Prisma models
4. Add Zod schemas
5. Add services with permission enforcement
6. Add API routes
7. Add pages and UI components
8. Add seed/provisioning categories
9. Add service/API/security tests
10. Add architecture checks if new patterns appear
11. Run full check suite
12. Enable module for test organization
13. Smoke test in staging
```

---

# 29. Claude Implementation Prompt

Use this prompt only after this document is approved and foundation dependencies exist.

```md
You are implementing the OneDayOS Incident Reporting Module.

Authoritative document:
docs/engineering-manual/17-module-specifications/08-incident-reporting-module.md

Rules:
- Implement only the Incident Reporting Module scope defined in this document.
- Do not create Platform Services.
- Do not add Attachments, Notifications, Comments, Activity Feed, Audit Log, AI, Workflow Engine, or Approval Engine.
- Do not duplicate Employee, Warehouse, Branch, Department, User, or Organization.
- Do not import from @/kernel/* inside the module.
- Do not import from other modules.
- Do not use raw Prisma inside module code.
- Use @/sdk/server.
- Use verified PlatformContext.
- Use sdk.getDb(ctx), never sdk.getDb(orgId).
- APIs must live under /api/orgs/[orgSlug]/incidents/...
- Pages must live under /[orgSlug]/incidents/...
- Reject client-supplied orgId.
- Enforce permissions in APIs and services.
- Return { data, error, meta? } JSON only.
- Add tenant-isolation, permission-denial, validation, event, soft-delete, and architecture tests.
- Stop and report if a required foundation helper does not exist.
```

---

# 30. Acceptance Criteria

Incident Reporting is acceptable when:

```txt
[ ] Module manifest exists and validates
[ ] Module uses id incidents
[ ] Module pages live under /[orgSlug]/incidents
[ ] Module APIs live under /api/orgs/[orgSlug]/incidents
[ ] Services receive PlatformContext
[ ] No service accepts loose orgId
[ ] Module uses sdk.getDb(ctx)
[ ] Client-supplied orgId is rejected
[ ] Employee is reused as shared Business Object
[ ] Warehouse is reused if needed
[ ] Branch and Department remain Kernel primitives
[ ] No duplicate Employee/Warehouse/Branch/Department tables exist
[ ] IncidentCategory model exists if categories are implemented
[ ] Incident model exists
[ ] IncidentCorrectiveAction model exists if corrective actions are implemented
[ ] Status transitions are service-owned
[ ] Soft delete is implemented for erroneous records
[ ] Cancellation/closure/resolution are business states
[ ] Permissions are enforced in APIs and services
[ ] API failure paths return JSON only
[ ] Events are emitted after successful mutations
[ ] Events do not include orgId or full records
[ ] Tests use at least two organizations
[ ] Permission-denial tests exist
[ ] API failure tests exist
[ ] Soft-delete tests exist
[ ] Event tests exist
[ ] Architecture checks pass
[ ] Typecheck passes
[ ] Test suite passes
[ ] Build passes
```

---

# 31. Explicitly Forbidden

Claude and future engineers must not do these:

```txt
Create IncidentEmployee
Create IncidentWarehouse
Create IncidentDepartment
Create a client-specific incident module
Create Attachment Service from this module
Create Notification Service from this module
Create Comments Service from this module
Create Activity Feed from this module
Create Audit Log Service from this module
Create Workflow Engine from this module
Create AI incident analysis from this module
Add photo uploads casually
Add hidden orgId fields
Accept orgId in API body
Use sdk.getDb(orgId)
Use raw Prisma inside the module
Import @/kernel/* inside the module
Import another module directly
Return API redirects
Return login HTML from APIs
Log full incident descriptions in operational logs
Emit full incident records as events
Build a public anonymous reporting portal in MVP
Build legal/compliance advice features
```

---

# 32. Founder Review Checklist

Before approving implementation, confirm:

```txt
[ ] This module is commercially useful enough to implement.
[ ] MVP excludes attachments/photos unless separately approved.
[ ] MVP excludes notifications.
[ ] MVP excludes generic comments.
[ ] MVP excludes activity timeline.
[ ] MVP excludes audit log UI.
[ ] MVP excludes approval/workflow engine.
[ ] Employee reuse is clear.
[ ] Branch/Department/Warehouse usage is clear.
[ ] Status workflow is simple enough for one-day delivery.
[ ] Tests are strong enough to prevent tenant/permission mistakes.
[ ] The module will not become a custom one-client app.
```

---

# 33. Final Rule

The Incident Reporting Module should help SMEs capture and resolve incidents.

It should not become a hidden dumping ground for every future collaboration, attachment, workflow, notification, audit, legal, or AI feature.

Build the incident workflow cleanly.

Emit events.

Let repeated future use cases decide which Platform Services are promoted later.
