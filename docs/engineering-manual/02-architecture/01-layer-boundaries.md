# OneDayOS Engineering Manual — 02 Architecture / 01 Layer Boundaries

**Document ID:** `02-architecture/01-layer-boundaries.md`  
**Version:** 1.0  
**Status:** Frozen  
**Owner:** OneDayOS Architecture  
**Primary Author:** ChatGPT, acting as Founding Software Architect  
**Date:** July 2026  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  
**Depends On:**

- `01-foundation/00-vision.md` — Approved
- `02-architecture/00-system-architecture.md` — Approved
- Current Kernel v2 MVP implementation reference

---

# 1. Purpose

This document defines the **layer boundaries** of OneDayOS.

Its job is to answer one recurring question:

> Where does this capability belong?

OneDayOS will fail if every new feature becomes a custom module, a random utility, or a premature platform service. The platform must grow through clear architectural boundaries.

This document exists to prevent:

- Kernel bloat.
- Module-to-module coupling.
- Duplicate business entities.
- Premature platform abstractions.
- Generic SaaS starter architecture.
- Per-client forks.
- AI-generated code that places files in the wrong layer.
- Security-sensitive logic being scattered across modules.

This document is not only conceptual. It is an implementation decision guide for humans and AI coding agents.

---

# 2. The Locked Layer Model

The OneDayOS architecture is:

```txt
Kernel
  ↓
Business Objects
  ↓
Platform Services
  ↓
Business Modules
  ↓
Client Configuration
```

This is the architectural model even if the MVP implementation temporarily places some tables or files together physically.

The important rule is not physical location.

The important rule is **responsibility and dependency direction**.

---

# 3. Layer Summary

| Layer | Owns | Must Not Own |
|---|---|---|
| Kernel | Platform fundamentals required by all modules | Business workflows |
| Business Objects | Shared business entities used across modules | Module-specific fields or workflows |
| Platform Services | Reusable cross-cutting capabilities after proven reuse | Domain-specific module behavior |
| Business Modules | Domain workflows and module-owned entities | Kernel internals, duplicate shared entities, other modules |
| Client Configuration | Per-org settings, enabled modules, labels, defaults | Custom code or architecture changes |

---

# 4. Non-Negotiable Boundary Rules

These rules are mandatory.

## Rule 1 — Kernel must remain small

The Kernel contains only platform fundamentals.

A capability belongs in Kernel only if the platform cannot function without it.

Kernel is not a place for “useful shared code.”

Useful shared code belongs in either:

- Business Objects,
- Platform Services,
- `src/lib` utility code,
- or a module until reuse is proven.

## Rule 2 — Business Objects are not modules

Business Objects belong to the platform, not to any module.

`Employee`, `Product`, `Customer`, `Supplier`, and `Warehouse` are not owned by HR, Inventory, CRM, Purchasing, or Assets.

They are shared entities.

## Rule 3 — Modules never import Kernel internals

Business modules must not import from:

```txt
@/kernel/*
```

Modules consume the platform through:

```txt
@/sdk
```

Allowed:

```ts
import { sdk } from '@/sdk'
```

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
import { requireAuth } from '@/kernel/auth/session'
import { can } from '@/kernel/permissions/check'
import { registerModule } from '@/kernel/modules/registry'
```

The SDK is the stable public contract. Kernel internals may change.

## Rule 4 — Modules never import other modules

Forbidden:

```ts
import { LeaveService } from '@/modules/leave/service'
import { InventoryService } from '@/modules/inventory/service'
```

Cross-module communication must use:

- shared Business Objects,
- SDK APIs,
- Platform Services,
- or events.

## Rule 5 — Modules publish events; they do not call subscribers

A module may emit:

```txt
inventory.stock_adjustment.created
```

It must not know whether the subscriber is:

- Audit Log,
- Notification Service,
- Search,
- AI Layer,
- Reporting,
- another module,
- or nothing at all.

## Rule 6 — Platform Services are earned, not imagined

A capability becomes a Platform Service only after reuse is proven.

Default rule:

```txt
One module needs it → keep it inside that module.
Two modules need it → duplicate carefully or extract a narrow utility only if necessary.
Three independent modules need it → consider promotion to Platform Services.
```

This is the Three Client Rule, refined as the **Three Independent Use Cases Rule**.

## Rule 7 — Client Configuration must not become custom code

Client-specific changes should be stored as data whenever possible:

- enabled modules,
- settings,
- labels,
- role assignments,
- branch/department structure,
- plan limits,
- form visibility rules in the future,
- saved views in the future.

A client should not receive a fork unless explicitly approved through an architecture exception.

## Rule 8 — Tenant isolation crosses all layers

Any tenant-scoped operation must know the authenticated organization context.

No layer may trust `orgId` from client input.

Tenant identity must be derived from:

- authenticated user,
- route organization slug,
- validated platform user record,
- and organization membership.

This applies to Kernel, Business Objects, Platform Services, and Modules.

---

# 5. Layer 1 — Kernel

## 5.1 Definition

The Kernel is the minimum platform foundation required by every OneDayOS deployment.

It answers:

> Who is using the system?  
> Which organization do they belong to?  
> What are they allowed to do?  
> Which modules are enabled?  
> How does the app shell load?  
> How do modules access platform capabilities safely?

The Kernel should feel boring, stable, and small.

## 5.2 Kernel Owns

Kernel owns these capabilities:

```txt
Authentication
Session handling
Organizations
Users
Roles
Permissions
Feature flags
Subscriptions
Org module enablement
Settings storage
Module registry
Module loader
Event bus interface
SDK backing implementation
App shell primitives
Routing primitives
API response contracts
Tenant context helpers
```

## 5.3 Kernel-Owned Database Tables

Kernel owns or directly governs these tables:

```txt
organizations
subscriptions
org_modules
users
roles
user_roles
permissions
settings
```

The following tables are organizational structure primitives and are Kernel-owned unless later reclassified by ADR:

```txt
branches
departments
```

## 5.4 Why Branch and Department Are Kernel-Owned

Branch and Department are not normal business objects in OneDayOS.

They define the structure of the tenant itself.

They may affect:

- user assignment,
- employee assignment,
- permissions,
- scope boundaries,
- reporting groups,
- approval routing later,
- module visibility later.

Because of this, they belong closer to Organization than to any individual module.

This is a deliberate refinement of the broad “Business Object” language used in early planning. Branch and Department are shared, but they are also organization structure primitives.

## 5.5 Kernel Must Not Own

Kernel must not own:

```txt
Inventory stock movement logic
Leave request logic
CRM pipeline logic
Purchasing request logic
Expense claim logic
Asset assignment logic
Visitor check-in logic
Incident reporting logic
Approval workflows, until promoted
Notification delivery, until promoted
Audit log storage, until promoted
Comments, until promoted
Attachments, until promoted
Reports, until promoted
Dynamic forms, until promoted
Dynamic CRUD, until promoted
```

## 5.6 Kernel Acceptance Test

A feature belongs in Kernel only if this sentence is true:

> Every OneDayOS customer and every OneDayOS module needs this capability for the platform to function correctly.

If not, it probably does not belong in Kernel.

## 5.7 Kernel Examples

| Capability | Kernel? | Reason |
|---|---:|---|
| Login | Yes | Every user needs authentication |
| Organization slug routing | Yes | Every tenant needs organization context |
| Permission model | Yes | Every module needs authorization |
| `sdk.getDb(ctx)` seam | Yes | Every module needs tenant-aware database access through verified PlatformContext |
| Sidebar module registry | Yes | Every deployment needs enabled module navigation |
| Inventory adjustment | No | Inventory-specific workflow |
| Approval chain | No, not yet | Platform Service only after reuse is proven |
| Notification email sending | No, not yet | Platform Service later |
| Product reorder level | No | Inventory extension of Product |

---

# 6. Layer 1.5 — Business Objects

## 6.1 Definition

Business Objects are shared business entities used by multiple modules.

They are not owned by modules.

They are part of the platform domain model.

Examples:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
Project, future
AssetCategory, future if shared
```

## 6.2 Conceptual vs Physical Location

Architecturally, Business Objects are their own layer.

In the MVP, some Business Object tables may physically live in the same Prisma schema and repository area as Kernel.

That is acceptable only if the conceptual boundary remains clear.

The rule is:

```txt
Physically near Kernel for MVP convenience.
Conceptually separate from Kernel.
Consumed by modules through stable contracts.
```

Business Objects must not become Kernel internals that modules reach into directly.

## 6.3 Business Objects Own

Business Objects own:

- shared entity identity,
- lowest-common-denominator fields,
- shared lifecycle events,
- shared validation rules,
- shared lookup/list behavior,
- shared tenant scoping,
- soft-delete behavior,
- minimal relationships to Kernel org structure.

## 6.4 Business Objects Must Not Own

Business Objects must not own:

- module-specific workflows,
- module-specific calculations,
- module-specific status fields,
- module-specific reports,
- module-specific approval rules,
- UI screens owned by a business module,
- fields needed by only one module,
- fields needed by only two modules unless explicitly approved.

## 6.5 Business Object Minimalism Rule

A field belongs on a Business Object only if it is genuinely needed by every or nearly every module that touches that object.

When in doubt, leave the field out.

Example:

`Product` should contain:

```txt
id
orgId
code
name
description
categoryId
unit
createdAt
updatedAt
deletedAt
deletedBy
```

`Product` should not contain:

```txt
reorderPoint
minimumStock
valuationMethod
supplierLeadTime
sellingPrice
commissionRate
warrantyPeriod
```

Those fields belong in module extension tables.

## 6.6 Extension Table Pattern

Modules extend Business Objects using module-owned tables.

Example:

```txt
Product
  id
  orgId
  code
  name
  unit

InventoryProductExtension
  id
  orgId
  productId
  reorderPoint
  minimumStock
  valuationMethod

SalesProductExtension
  id
  orgId
  productId
  sellingPrice
  commissionCategory

PurchasingProductExtension
  id
  orgId
  productId
  preferredSupplierId
  supplierLeadTimeDays
```

The core `Product` record remains clean.

## 6.7 Business Object Events

Every mutation to a Business Object must emit an event.

Examples:

```txt
kernel.employee.created
kernel.employee.updated
kernel.employee.deactivated
kernel.product.created
kernel.product.updated
kernel.product.deleted
kernel.customer.created
kernel.supplier.created
kernel.warehouse.created
```

The event payload should include:

```ts
type BusinessObjectEventPayload = {
  orgId: string
  entityId: string
  actorUserId: string
  occurredAt: string
  changes?: Record<string, unknown>
}
```

The event does not imply that Audit Log Service exists yet. It prepares the platform for it.

## 6.8 Business Object vs Module-Owned Entity

| Entity | Belongs To | Reason |
|---|---|---|
| Employee | Business Object | Used by HR, Leave, Assets, Projects, Approvals |
| Product | Business Object | Used by Inventory, Purchasing, Sales, Reservations |
| Customer | Business Object | Used by CRM, Reservations, Billing, Support |
| Supplier | Business Object | Used by Purchasing, Inventory, Payables |
| Warehouse | Business Object | Used by Inventory, Purchasing, Transfers |
| StockMovement | Inventory Module | Inventory-specific transaction |
| LeaveRequest | Leave Module | Leave-specific workflow |
| PurchaseRequest | Purchasing Module | Purchasing-specific workflow |
| Deal | CRM Module | CRM-specific entity |
| ExpenseClaim | Expenses Module | Expenses-specific workflow |
| AssetAssignment | Assets Module | Assets-specific workflow |

---

# 7. Layer 2 — Platform Services

## 7.1 Definition

Platform Services are reusable cross-cutting capabilities that are needed by multiple independent modules or use cases.

They are not business modules.

They are not Kernel fundamentals.

They are reusable platform capabilities.

## 7.2 Platform Services Own

Platform Services may own:

```txt
Approval Engine
Notification Engine
Audit Log Service
Activity Feed
Comments
Attachments
Reporting
Search
Background Jobs
Workflow Engine
Dynamic Form Engine
Dynamic CRUD Engine
Import/Export Engine
AI Context Runtime
```

But only when promoted intentionally.

## 7.3 Platform Services Must Not Own

Platform Services must not own:

- business-domain rules from one module,
- Inventory-specific stock logic,
- Leave-specific entitlement logic,
- Purchasing-specific supplier rules,
- CRM-specific pipeline rules,
- one-off client custom workflows.

## 7.4 Promotion Rule

A capability may be promoted to Platform Services only when all of these are true:

```txt
[ ] At least three independent modules/use cases need it.
[ ] The repeated behavior is genuinely the same abstraction.
[ ] Keeping it module-local causes real duplication or inconsistency.
[ ] The proposed service API is clear.
[ ] The service can be adopted incrementally.
[ ] The service does not force weak abstractions on modules.
[ ] The promotion is documented in an ADR or service spec.
```

## 7.5 Three Independent Use Cases Rule

The original rule is called the Three Client Rule.

For engineering purposes, we refine it:

> A capability may be promoted when three independent modules, clients, or workflows require substantially the same reusable capability.

Examples:

| Capability | First Use | Second Use | Third Use | Promote? |
|---|---|---|---|---:|
| Approvals | Leave request | Purchase request | Expense claim | Yes |
| Attachments | Incident photo | Expense receipt | Supplier document | Yes |
| Comments | CRM deal note | Incident discussion | Project discussion | Yes |
| Notifications | Low stock alert | Leave approval alert | Visitor arrival alert | Yes |
| Stock ledger | Inventory only | None | None | No |
| Leave balance | Leave only | None | None | No |

## 7.6 Platform Services Consume Lower Layers

Platform Services may depend on:

- Kernel context,
- Business Objects,
- SDK contracts,
- events.

Platform Services must not depend on business modules.

Correct:

```txt
Approval Service listens to leave.leave_request.submitted event.
Approval Service stores approval_request entity referencing sourceEntityType/sourceEntityId.
```

Incorrect:

```ts
import { LeaveRequestService } from '@/modules/leave/service'
```

## 7.7 Platform Service Data Model Pattern

Platform Services should use generic entity references when possible:

```txt
ApprovalRequest
  id
  orgId
  sourceType        // "leave.leave_request" | "purchasing.purchase_request"
  sourceId
  status
  requestedById
  createdAt
```

This avoids direct foreign keys to module tables when a service must support many modules.

Where direct foreign keys are required, they must be justified in the service spec.

---

# 8. Layer 3 — Business Modules

## 8.1 Definition

A Business Module is a self-contained domain package that implements a business capability.

Examples:

```txt
Inventory
CRM
Leave
HR
Purchasing
Expenses
Assets
Projects
Reservations
Visitor Management
Incident Reporting
```

A module is not merely a folder.

A module is a product package inside OneDayOS.

## 8.2 A Module Owns

A module owns:

```txt
Manifest
Permissions
Navigation entries
Module-owned database tables
Module-specific services
Module-specific API routes
Module pages
Module forms
Module tables
Module events
Module tests
Module documentation
Module AI context
Module seed data
```

## 8.3 A Module Must Not Own

A module must not own:

```txt
Authentication
User session logic
Organization lookup logic
Raw permission system
Raw Prisma client
Shared Employee table
Shared Product table
Shared Customer table
Shared Supplier table
Shared Warehouse table
Another module's service
Platform-wide notification logic
Platform-wide approval logic
Client-specific forked code
```

## 8.4 Module File Contract

A standard module should eventually follow this structure:

```txt
src/modules/[module]/
  manifest.ts
  permissions.ts
  schema.ts
  service.ts
  events.ts
  ai-context.ts
  docs.md
  __tests__/
    service.test.ts
    permissions.test.ts
    events.test.ts
```

Routes may live in Next.js route folders, but module business logic should remain in the module package.

Example:

```txt
src/app/(platform)/[orgSlug]/inventory/page.tsx
src/app/(platform)/[orgSlug]/inventory/new/page.tsx
src/app/api/orgs/[orgSlug]/inventory/route.ts
src/modules/inventory/service.ts
src/modules/inventory/schema.ts
```

## 8.5 Module Dependency Rule

Modules can depend on:

- SDK,
- UI components,
- generic utilities,
- Business Objects through approved SDK/service contracts,
- Platform Services through approved SDK/service contracts.

Modules cannot depend on:

- Kernel internals,
- other module internals,
- raw Prisma singleton,
- direct Supabase server clients,
- direct module registry internals.

## 8.6 Module Events

Module events must follow:

```txt
{module}.{entity}.{past_tense_verb}
```

Examples:

```txt
inventory.stock_adjustment.created
inventory.stock_movement.created
inventory.stock_level.low
leave.leave_request.submitted
leave.leave_request.approved
purchasing.purchase_request.created
crm.deal.won
assets.asset.assigned
visitors.visitor.checked_in
incidents.incident.reported
```

Forbidden:

```txt
ProductCreated
product.created
inventoryProductCreated
inv.stock.low
inventory.product.create
```

Wrong event names are contract violations.

## 8.7 Module-Owned Entity Examples

| Module | Owns | Does Not Own |
|---|---|---|
| Inventory | StockMovement, StockBalance, InventoryAdjustment, ReorderRule | Product, Warehouse |
| CRM | Deal, PipelineStage, ActivityTask | Customer |
| Leave | LeaveRequest, LeaveType, LeaveBalance | Employee |
| Purchasing | PurchaseRequest, PurchaseOrder, PurchaseLine | Supplier, Product |
| Assets | Asset, AssetAssignment, MaintenanceRecord | Employee, Department |
| Expenses | ExpenseClaim, ExpenseLine, ReimbursementBatch | Employee |
| Visitors | VisitorLog, VisitPurpose, CheckInRecord | Branch |
| Incidents | IncidentReport, IncidentCategory, IncidentAction | Employee, Branch |

---

# 9. Layer 4 — Client Configuration

## 9.1 Definition

Client Configuration is the layer where OneDayOS becomes specific to one customer without becoming custom code.

It answers:

> Which parts of the platform are enabled for this organization?  
> What names, defaults, roles, and preferences apply to this client?  
> How should the standard modules behave for this tenant?

## 9.2 Client Configuration Owns

Client Configuration owns:

```txt
Enabled modules
Subscription plan
Module settings
Org settings
Role assignments
Branch and department setup
User setup
Default labels
Default statuses
Default views, future
Field visibility rules, future
Workflow settings, future
Report presets, future
AI behavior settings, future
```

## 9.3 Client Configuration Must Not Own

Client Configuration must not own:

- forked business logic,
- one-off database schema changes,
- one-off module files,
- custom API routes outside approved extension points,
- hard-coded client names in module logic,
- per-client branches in Git unless explicitly approved.

## 9.4 Configuration Before Customization

For every client request, ask:

```txt
Can this be solved through existing configuration?
Can this become module configuration?
Can this become a reusable module improvement?
Can this become a future Platform Service?
Only then consider custom work.
```

## 9.5 Client Configuration Examples

| Client Request | Correct Layer | Notes |
|---|---|---|
| Enable Inventory and Leave only | Client Configuration | `OrgModule` records |
| Change company name/logo | Client Configuration | Organization settings |
| Add Admin and Staff users | Client Configuration | Users and roles |
| Add Manila and Cebu branches | Client Configuration | Branch records |
| Rename “Warehouse” to “Stockroom” | Client Configuration, future label setting | Do not fork UI copy yet unless labels system exists |
| Require two approvers for expenses | Client Configuration, after Approval Service exists | Not custom code |
| Add a one-off custom stock formula for one client | Architecture Review | High risk of bespoke drift |

---

# 10. Dependency Direction

## 10.1 Correct Direction

Dependencies flow downward:

```txt
Client Configuration
  uses Business Modules

Business Modules
  use Platform Services, Business Objects, Kernel through SDK

Platform Services
  use Business Objects and Kernel through approved contracts

Business Objects
  use Kernel context and database infrastructure

Kernel
  depends on nothing business-specific
```

## 10.2 Forbidden Direction

The following are forbidden:

```txt
Kernel → Business Module
Kernel → Platform Service business logic
Kernel → Inventory/CRM/Leave-specific concepts
Business Object → Business Module
Platform Service → Business Module internals
Business Module → Business Module internals
Business Module → Kernel internals
Client Configuration → custom source code
```

## 10.3 Import Rules

| Source | May Import | Must Not Import |
|---|---|---|
| `src/kernel/*` | low-level libs, DB client, auth libs | `src/modules/*` |
| `src/sdk/*` | Kernel internals | Module internals |
| `src/modules/*` | `@/sdk`, UI components, module-local files | `@/kernel/*`, other modules |
| `src/platform-services/*`, future | SDK/contracts, Business Objects | module internals |
| `src/components/ui/*` | styling utilities only | business logic, SDK, Prisma |
| `src/components/kernel/*` | SDK or Kernel only when shell-specific | business module services |
| `src/app/api/orgs/[orgSlug]/[moduleId]/*` | module service, SDK | raw Kernel internals, raw Prisma |

## 10.4 Recommended Future Enforcement

The import rules should eventually be enforced with:

- ESLint `no-restricted-imports`,
- dependency-cruiser,
- custom CI grep checks,
- generator safety tests.

Example forbidden pattern checks:

```txt
src/modules/** imports @/kernel/**
src/modules/** imports @/modules/**
src/modules/** imports @/kernel/db/client
src/app/api/** uses requireAuth() when API-safe helper is required
src/app/api/** reads orgId from request body for tenant-scoped writes
```

---

# 11. Data Ownership Rules

## 11.1 Kernel Data

Kernel data defines platform identity, tenancy, access, and enablement.

Examples:

```txt
Organization
Subscription
OrgModule
User
Role
UserRole
Permission
Setting
Branch
Department
```

## 11.2 Business Object Data

Business Object data defines shared real-world entities.

Examples:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

## 11.3 Platform Service Data

Platform Service data defines reusable cross-cutting capabilities.

Examples, future:

```txt
AuditEntry
Notification
ApprovalRequest
ApprovalStep
Comment
Attachment
ActivityEvent
SavedReport
SearchIndex
BackgroundJob
```

## 11.4 Module Data

Module data defines domain-specific workflows and records.

Examples:

```txt
InventoryStockBalance
InventoryStockMovement
InventoryAdjustment
LeaveRequest
LeaveBalance
PurchaseRequest
PurchaseOrder
Deal
ExpenseClaim
AssetAssignment
VisitorLog
IncidentReport
```

## 11.5 Client Configuration Data

Client Configuration data customizes behavior per organization.

Examples:

```txt
OrgModule
Setting
Role assignment
Module setting
Saved view, future
Form field config, future
Workflow config, future
```

---

# 12. Capability Classification Decision Tree

When deciding where a feature belongs, use this order.

## Question 1 — Is it required for every module to function?

If yes, it may belong in Kernel.

Examples:

- auth,
- org context,
- permissions,
- module registry,
- SDK.

If no, continue.

## Question 2 — Is it a shared real-world business entity?

If yes, it may be a Business Object.

Examples:

- Employee,
- Product,
- Customer,
- Supplier,
- Warehouse.

If no, continue.

## Question 3 — Is it a reusable cross-cutting capability needed by multiple modules?

If yes, consider Platform Service only after the Three Independent Use Cases Rule is satisfied.

Examples:

- approvals,
- notifications,
- comments,
- attachments,
- audit logs,
- reporting,
- search.

If no, continue.

## Question 4 — Is it specific to one business domain?

If yes, it belongs in a Business Module.

Examples:

- stock adjustment,
- leave request,
- CRM deal,
- expense claim,
- visitor check-in.

If no, continue.

## Question 5 — Is it different per customer but does not require new code?

If yes, it belongs in Client Configuration.

Examples:

- enabled modules,
- role assignments,
- branch setup,
- default labels,
- module preferences.

If no, continue.

## Question 6 — Is it just a visual/component pattern?

If yes, it likely belongs in the Design System or shared UI components.

Examples:

- table density,
- empty state,
- form field layout,
- dashboard card style.

If no, continue.

## Question 7 — Is it a temporary implementation helper?

If yes, it may belong in `src/lib`, a script, or module-local utilities.

But it must not become an undeclared platform abstraction.

---

# 13. Classification Examples

## 13.1 Inventory Examples

| Feature | Layer | Reason |
|---|---|---|
| Product | Business Object | Used beyond Inventory |
| Warehouse | Business Object | Used by Inventory, Purchasing, Transfers |
| Stock balance | Inventory Module | Specific to inventory |
| Stock movement | Inventory Module | Specific to inventory ledger |
| Reorder point | Inventory extension | Product-specific but inventory-only |
| Low stock notification | Platform Service later | Notification capability reusable, trigger is inventory |
| Stock adjustment approval | Approval Service later + Inventory | Approval is platform, adjustment is module |

## 13.2 Leave Examples

| Feature | Layer | Reason |
|---|---|---|
| Employee | Business Object | Used across HR, Leave, Assets, Projects |
| Leave request | Leave Module | Domain-specific workflow |
| Leave balance | Leave Module | Leave-specific calculation |
| Leave type | Leave Module | Leave-specific config |
| Approval chain | Platform Service later | Reusable across leave, purchasing, expenses |
| Holiday calendar | Ambiguous | May start in Leave; promote if HR/Projects/Payroll need it |

## 13.3 CRM Examples

| Feature | Layer | Reason |
|---|---|---|
| Customer | Business Object | Used by CRM, Reservations, Billing, Support |
| Deal | CRM Module | CRM-specific entity |
| Pipeline stage | CRM Module | CRM-specific workflow |
| Customer note | Comments Service later or CRM local initially | Promote after reuse |
| Follow-up reminder | Notification/Task Service later | Reusable if multiple modules need reminders |

## 13.4 Purchasing Examples

| Feature | Layer | Reason |
|---|---|---|
| Supplier | Business Object | Used by purchasing, inventory, payables |
| Product | Business Object | Shared with inventory/sales |
| Purchase request | Purchasing Module | Purchasing-specific workflow |
| Purchase order | Purchasing Module | Purchasing-specific document |
| Approval | Platform Service later | Reusable across modules |
| Attachment for quotation | Attachments Service later | Reusable across modules |

## 13.5 Assets Examples

| Feature | Layer | Reason |
|---|---|---|
| Employee | Business Object | Asset assignment target |
| Department | Kernel org structure | Organization structure |
| Asset | Assets Module | Asset-specific entity |
| Asset assignment | Assets Module | Asset-specific workflow |
| Maintenance attachment | Attachments Service later | Reusable file attachment capability |
| Activity timeline | Platform Service later | Reusable history pattern |

---

# 14. Ambiguous Boundary Decisions

Some concepts are naturally ambiguous. This section gives default decisions.

## 14.1 Employee

**Decision:** Business Object.

Employee is not owned by HR.

Reasons:

- Leave needs Employee.
- Assets needs Employee.
- Projects needs Employee.
- Approvals need Employee.
- Incident Reporting may need Employee.
- Visitor Management may need host Employee.

However, `Employee` is identity-adjacent because it may link to `User`.

Therefore:

```txt
User = Kernel identity/access record
Employee = Business Object/personnel record
```

A User may have an Employee record.

An Employee may exist without a User login.

## 14.2 Branch

**Decision:** Kernel org structure.

Branch is part of the tenant structure and may influence permissions, reporting, and scope.

It is not owned by any module.

## 14.3 Department

**Decision:** Kernel org structure.

Department is part of the tenant structure and may influence user assignment, employee assignment, approvals, and reporting.

It is not owned by HR.

## 14.4 Warehouse

**Decision:** Business Object.

Warehouse is operational, not identity/tenant structure.

It may relate to Branch, but it is not the same as Branch.

Reasons:

- Some branches are not warehouses.
- Some warehouses may not be customer-facing branches.
- Inventory and Purchasing need warehouse/location concepts.

## 14.5 Settings

**Decision:** Kernel storage mechanism, but values may configure modules.

The `Setting` table is Kernel-owned.

A module may define settings keys under its module namespace:

```txt
module = "inventory"
key = "default_valuation_method"
```

But the generic settings infrastructure belongs to Kernel.

## 14.6 Audit Log

**Decision:** Platform Service, deferred.

Audit logs are important, but they should not be implemented as random module code.

For now, mutations should emit events. Audit Log Service can later subscribe.

## 14.7 Notifications

**Decision:** Platform Service, deferred.

A module may define events that could trigger notifications later.

The module should not implement platform-wide notification delivery by itself unless the notification is purely module-local and temporary.

## 14.8 Approvals

**Decision:** Platform Service, deferred until proven.

Leave may need approvals first.

Do not build the full Approval Engine for Leave alone unless the module cannot ship without a minimal local workflow.

If Leave needs approvals before the platform service exists, use a narrow module-local implementation and mark it as a promotion candidate.

## 14.9 Reporting

**Decision:** Starts module-local, promotes to Platform Service.

A report specific to Inventory belongs in Inventory.

A saved report engine, dashboard widget system, cross-module report builder, or scheduled reporting capability belongs in Platform Services after reuse is proven.

## 14.10 Search

**Decision:** Kernel search helpers may exist, but full Search Service is Platform Service.

Simple module-local search filters are module-owned.

Global search across modules is a Platform Service.

## 14.11 Dynamic Forms

**Decision:** Deferred Platform Service.

Do not build Dynamic Forms until at least three modules have hand-coded forms and repeated pain is proven.

However, modules may begin documenting field metadata in manifests if it does not increase implementation complexity.

## 14.12 Dynamic CRUD

**Decision:** Deferred Platform Service / Generator capability.

Do not build a generic CRUD engine yet.

Hand-coded module CRUD should establish patterns first.

## 14.13 AI Layer

**Decision:** Platform capability, not a module.

AI should consume module-provided context and permissions. It must not bypass tenant or permission boundaries.

---

# 15. Boundary Rules for APIs

## 15.1 Kernel APIs

Kernel APIs handle platform fundamentals.

Examples:

```txt
/api/kernel/auth/register
/api/kernel/users/[id]
/api/kernel/orgs
/api/kernel/settings
```

Kernel APIs must:

- use API-safe auth helpers,
- return JSON responses,
- validate input,
- enforce tenant membership where applicable,
- not expose business-module internals.

## 15.2 Module APIs

Module APIs handle module-owned workflows.

Examples:

```txt
/api/orgs/[orgSlug]/inventory/stock-adjustments
/api/orgs/[orgSlug]/leave/requests
/api/orgs/[orgSlug]/crm/deals
/api/orgs/[orgSlug]/purchasing/purchase-requests
```

Module APIs must:

- authenticate using SDK API-safe helpers,
- derive org context server-side,
- reject or ignore client-supplied `orgId`,
- enforce permissions,
- validate input with Zod,
- call module services,
- return `{ data, error }`,
- emit required events through services,
- test tenant and permission denial.

## 15.3 Platform Service APIs

Platform Service APIs expose reusable platform capabilities.

Examples, future:

```txt
/api/platform/approvals
/api/platform/notifications
/api/platform/attachments
/api/platform/reports
/api/platform/search
```

Platform Service APIs must not expose module internals.

They should operate through generic entity references or registered module contracts.

## 15.4 API Response Contract

All APIs must return:

```ts
type ApiResponse<T> = {
  data: T | null
  error: null | {
    code: string
    message: string
    details?: unknown
  }
}
```

Temporary string errors should be replaced by structured errors before production hardening.

## 15.5 Page Auth vs API Auth

Page auth may redirect.

API auth must return JSON.

Allowed in page/layout server components:

```ts
await sdk.auth.requireAuth()
```

Required in API routes:

```ts
await sdk.auth.requireApiAuth()
```

`requireApiAuth()` must return `401` JSON, not a `307` redirect with HTML.

---

# 16. Boundary Rules for Services

## 16.1 Service Context

Module services should receive a verified platform context.

Preferred shape:

```ts
type PlatformContext = {
  userId: string
  orgId: string
  orgSlug?: string
  permissions?: string[]
}
```

Avoid service methods like:

```ts
InventoryService.create(input)
```

Prefer:

```ts
InventoryService.create(ctx, input)
```

This makes tenant and actor context explicit.

## 16.2 Service Authorization

A route-level permission check is required.

For sensitive operations, service-level authorization should also exist or the service should require a context type that can only be produced by verified SDK helpers.

Example:

```ts
const ctx = await sdk.auth.requireApiOrgContextBySlug(orgSlug)
await sdk.permissions.require(ctx, 'inventory', 'create', 'stock_adjustment')
await InventoryService.createStockAdjustment(ctx, input)
```

## 16.3 Services Emit Events

Events should be emitted from services, not UI components.

Correct:

```ts
await InventoryService.createStockAdjustment(ctx, input)
// service emits inventory.stock_adjustment.created
```

Incorrect:

```ts
// React component emits event after fetch
sdk.events.emit('inventory.stock_adjustment.created', data)
```

The service is the source of truth for mutations.

---

# 17. Boundary Rules for UI

## 17.1 Design System vs Module UI

The Design System owns:

- component style,
- spacing rules,
- table standards,
- form standards,
- empty/loading/error patterns,
- motion standards,
- accessibility standards.

Modules own:

- which screens exist,
- which fields appear,
- which workflows are shown,
- module-specific copy,
- module-specific actions.

Modules must not invent new visual systems.

## 17.2 App Shell vs Module Pages

The App Shell owns:

- sidebar,
- header,
- org context display,
- enabled module navigation,
- account menu,
- shell-level layout.

Modules own:

- list pages,
- create/edit pages,
- detail pages,
- module dashboards,
- module-specific forms and tables.

## 17.3 Permission-Aware UI

UI may hide actions based on permissions.

But hiding UI is not authorization.

Every protected operation must also be enforced in API/service layers.

---

# 18. Tenant Boundary Rules by Layer

## 18.1 Kernel

Kernel must:

- authenticate users,
- load platform `User`,
- validate `User.orgId`,
- validate route `orgSlug`,
- resolve organization context,
- enforce org membership,
- expose safe context through SDK.

## 18.2 Business Objects

Business Object queries must:

- scope by `orgId`,
- avoid client-supplied tenant identity,
- respect soft delete,
- emit events with `orgId`,
- avoid cross-tenant relation leaks.

## 18.3 Platform Services

Platform Services must:

- scope all records by `orgId`,
- enforce permissions,
- validate source entity belongs to same `orgId`,
- avoid cross-tenant notifications, approvals, reports, search results, or AI context.

## 18.4 Business Modules

Business Modules must:

- derive `PlatformContext` server-side,
- call `sdk.getDb(ctx)`,
- enforce permissions,
- validate all input,
- test cross-tenant denial,
- never accept `orgId` from client payload as authority.

## 18.5 Client Configuration

Client Configuration must:

- be scoped by `orgId`,
- be readable only by authorized users,
- not leak enabled modules, settings, or roles across tenants.

---

# 19. Permission Boundary Rules

## 19.1 Permission Ownership

Kernel owns the permission model.

Modules declare the permissions they need.

Example module permissions:

```ts
export const inventoryPermissions = [
  'inventory.read',
  'inventory.create',
  'inventory.update',
  'inventory.delete',
  'inventory.adjust',
]
```

The Kernel stores and evaluates permissions.

The module does not implement its own RBAC engine.

## 19.2 Permission Naming

Preferred permission shape:

```txt
{module}.{action}
{module}.{resource}.{action}
```

Examples:

```txt
inventory.read
inventory.stock_adjustment.create
leave.leave_request.approve
crm.deal.update
```

The current database shape separates:

```txt
module
action
resource
```

Both representations must map cleanly.

## 19.3 Required Enforcement Points

Permissions must be enforced at:

```txt
API route level
Service/mutation level
UI visibility level
```

UI visibility alone is insufficient.

## 19.4 Wildcard Permissions

Admin roles may use wildcards:

```txt
module = "*"
action = "*"
resource = null
```

Wildcard permissions must remain org-scoped.

A wildcard in Org A must not grant anything in Org B.

---

# 20. Promotion and Demotion Rules

## 20.1 Module to Platform Service

A module-local capability can be promoted when reuse is proven.

Promotion steps:

```txt
1. Document repeated use cases.
2. Write ADR or Platform Service spec.
3. Define service API.
4. Define migration path from module-local code.
5. Add tests.
6. Update affected modules to consume service.
7. Remove duplicated module-local implementations.
```

## 20.2 Module Field to Business Object Field

A module extension field can move to a Business Object only when it becomes generally useful.

Example:

`Product.barcode` might begin in Inventory.

If Purchasing, Sales, and Reservations also need it, it may move to `Product`.

Migration steps:

```txt
1. Record evidence in ADR.
2. Add field to Business Object.
3. Backfill from extension table.
4. Update module services.
5. Keep deprecated extension field temporarily if needed.
6. Remove duplicate field in later migration.
```

## 20.3 Platform Service Back to Module

If a Platform Service proves too broad or wrong, it may be demoted or narrowed.

This requires an ADR.

Bad abstractions are worse than duplication.

## 20.4 Kernel Extraction

If Kernel becomes too large, non-fundamental capabilities should be extracted into Platform Services or Business Objects.

Kernel bloat must be treated as architectural debt.

---

# 21. Anti-Patterns

## 21.1 Kernel Bloat

Bad:

```txt
Add Approval Engine to Kernel because many modules might need it someday.
```

Good:

```txt
Keep approvals module-local or deferred until multiple modules prove the need.
```

## 21.2 Duplicate Business Entities

Bad:

```txt
src/modules/inventory/Product.ts
src/modules/crm/Customer.ts
src/modules/purchasing/Supplier.ts
```

Good:

```txt
Shared Product, Customer, Supplier Business Objects with module extension tables.
```

## 21.3 Direct Module Calls

Bad:

```ts
await InventoryService.reserveStockForPurchaseOrder(order)
```

from Purchasing.

Good:

```ts
await sdk.events.emit('purchasing.purchase_order.approved', payload)
```

Inventory may subscribe or a Platform Service may coordinate later.

## 21.4 Client-Supplied Tenant Identity

Bad:

```ts
const orgId = body.orgId
await sdk.getDb(orgId).inventoryItem.create(...)
```

Good:

```ts
const ctx = await sdk.auth.requireApiOrgContextBySlug(orgSlug)
await InventoryService.create(ctx, input)
```

## 21.5 Generic Admin Template Drift

Bad:

```txt
Every module gets generic cards, generic tables, generic CRUD pages, random spacing.
```

Good:

```txt
Every module follows the OneDayOS design system and table/form standards.
```

## 21.6 Premature Dynamic CRUD

Bad:

```txt
Build a generic CRUD engine before Inventory, Leave, and CRM exist.
```

Good:

```txt
Hand-code initial module patterns, then extract metadata-driven CRUD when repetition is proven.
```

## 21.7 Platform Service as Junk Drawer

Bad:

```txt
Put anything reusable in Platform Services.
```

Good:

```txt
Promote only proven cross-cutting capabilities with clear ownership and API contracts.
```

---

# 22. Claude Code Boundary Rules

Claude Code must follow these rules when implementing OneDayOS.

## 22.1 Claude Must Not Decide the Layer

Claude should not decide where a capability belongs.

The manual decides.

If unclear, Claude must stop and report ambiguity.

## 22.2 Claude Must Not Import Across Forbidden Boundaries

Claude must not generate:

```ts
import { prisma } from '@/kernel/db/client'
```

inside a module.

Claude must use:

```ts
import { sdk } from '@/sdk'
```

## 22.3 Claude Must Not Create Platform Services Early

Claude must not create:

```txt
Approval Engine
Notification Engine
Audit Service
Comment Service
Attachment Service
Dynamic Form Engine
Dynamic CRUD Engine
```

unless a frozen manual document explicitly instructs it to do so.

## 22.4 Claude Must Not Duplicate Business Objects

Claude must not create module-owned versions of:

```txt
Employee
Product
Customer
Supplier
Warehouse
Branch
Department
```

If a module needs additional fields, Claude must create an extension table pattern only if the module spec allows it.

## 22.5 Claude Must Not Trust orgId from Client Input

Any generated API route that accepts `orgId` from request body or query string as authority is wrong.

Claude must derive tenant context server-side.

## 22.6 Claude Must Implement Tests for Boundaries

For module work, Claude must include tests for:

```txt
permission denial
tenant isolation
no raw Kernel imports
event emission
input validation
soft-delete behavior, where applicable
```

---

# 23. Boundary Review Checklist

Before approving a feature or subsystem, ask:

```txt
[ ] Which layer owns this?
[ ] Does the chosen layer match this document?
[ ] Does it introduce Kernel bloat?
[ ] Does it duplicate a Business Object?
[ ] Does it prematurely create a Platform Service?
[ ] Does it create module-to-module coupling?
[ ] Does it bypass the SDK?
[ ] Does it trust client-supplied orgId?
[ ] Does it enforce permissions server-side?
[ ] Does it emit required events?
[ ] Does it follow the design system?
[ ] Does it preserve one-day delivery repeatability?
```

If any answer is unclear, do not implement yet.

---

# 24. Implementation Acceptance Criteria

This document is considered successfully implemented when:

```txt
[ ] Folder/import rules are reflected in lint or CI checks.
[ ] Module generator uses SDK-only imports.
[ ] Module generator does not generate client-supplied orgId patterns.
[ ] Kernel contains no module-specific business logic.
[ ] Business Objects are not duplicated in modules.
[ ] First official Inventory module extends Product and Warehouse instead of owning them.
[ ] API routes use API-safe auth helpers.
[ ] Permission enforcement is required in generated module APIs.
[ ] Tenant isolation tests exist for Kernel and generated module patterns.
[ ] Platform Services remain deferred until manually approved.
```

---

# 25. Known Current Gaps This Document Exposes

The current MVP Kernel is directionally correct, but this boundary document exposes several gaps that must be fixed before production multi-tenant use.

## 25.1 API Auth Boundary Gap

Current risk:

```txt
API routes may use redirect-based auth helpers.
```

Required boundary:

```txt
APIs must use JSON-safe auth helpers returning 401/403 responses.
```

## 25.2 Tenant Membership Boundary Gap

Current risk:

```txt
Authenticated users may load another organization's routes if org slug is guessed.
```

Required boundary:

```txt
Route orgSlug must be validated against authenticated user's orgId.
```

## 25.3 Permission Enforcement Boundary Gap

Current risk:

```txt
Permission checker exists but is not enforced in routes/services.
```

Required boundary:

```txt
Every protected API and mutation service must enforce permissions.
```

## 25.4 Module Generator Boundary Gap

Current risk:

```txt
Generated modules may include insecure scaffolding patterns.
```

Required boundary:

```txt
Generated modules must be secure-by-default and SDK-only.
```

These gaps should be resolved through the upcoming Production Readiness Gate and Security Stabilization Patch documents.

---

# 26. Required Follow-Up Documents

This document should be followed by:

```txt
13-security/08-production-readiness-gate.md
04-kernel/04-authorization-enforcement.md
05-sdk/03-sdk-auth-permissions.md
08-module-system/04-module-permissions.md
09-cli-generators/06-generator-safety-rails.md
```

These documents will convert the layer rules into implementation-grade security and generator requirements.

---

# 27. Founder Review Questions

Before freezing this document, answer these questions:

## Question 1

Do we approve the decision that `Branch` and `Department` are Kernel org-structure primitives rather than Business Objects?

Recommended answer: yes.

## Question 2

Do we approve the decision that `Warehouse` is a Business Object, not Kernel org structure?

Recommended answer: yes.

## Question 3

Do we approve the refined Three Client Rule as the Three Independent Use Cases Rule?

Recommended answer: yes.

## Question 4

Do we approve that Platform Services may use generic entity references instead of direct foreign keys to module tables?

Recommended answer: yes, by default.

## Question 5

Do we approve that module services should receive a verified `PlatformContext` rather than loose `orgId` strings?

Recommended answer: yes.

---

# 28. Freeze Criteria

This document can be marked `Frozen` when:

```txt
[ ] Founder approves the layer classifications.
[ ] Branch/Department/Warehouse classification is accepted or amended.
[ ] Import rules are accepted.
[ ] Business Object extension pattern is accepted.
[ ] Platform Service promotion rule is accepted.
[ ] Claude Code rules are accepted.
[ ] Known gaps are moved into security implementation documents.
```

Once frozen, Claude Code may use this document to classify files, imports, and ownership boundaries.

Until then, it is architectural guidance only.
