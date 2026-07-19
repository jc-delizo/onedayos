# OneDayOS Engineering Manual — Platform vs Modules

**Document ID:** `01-foundation/03-platform-vs-modules.md`  
**Version:** 1.0  
**Status:** Frozen  
**Owner:** Founder / Platform Architect  
**Last Updated:** July 6, 2026  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  
**Depends On:**

- `01-foundation/00-vision.md`
- `01-foundation/01-business-model.md`
- `01-foundation/02-product-principles.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `05-sdk/00-sdk-overview.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `10-platform-services/01-three-client-rule.md`

---

# 1. Purpose

This document defines how OneDayOS separates the **Platform** from **Business Modules**, **Business Objects**, **Platform Services**, and **Client Configuration**.

Its purpose is to stop OneDayOS from becoming any of the following:

```txt
A collection of unrelated client apps
A pile of CRUD screens
A generic SaaS starter
An overengineered ERP before real patterns exist
A set of client-specific forks
A codebase where every new request becomes a special case
```

OneDayOS must become a reusable Business Operating System. That means every feature request must be classified correctly before it becomes code.

The central question is:

```txt
Where does this capability belong?
```

This document gives the answer.

---

# 2. Core Principle

The platform should contain what is **structurally necessary and reusable**.

Modules should contain what is **domain-specific and independently sellable**.

Client configuration should contain what is **organization-specific but not code-specific**.

```txt
Platform = shared foundation
Business Objects = shared business identity
Platform Services = reusable cross-cutting capabilities, only after proof
Business Modules = domain workflows
Client Configuration = tenant-specific settings, enablement, and preferences
```

The rule is:

```txt
Reuse aggressively.
Abstract carefully.
Customize reluctantly.
Fork almost never.
```

---

# 3. The Locked Architecture

OneDayOS uses this conceptual architecture:

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

This is a conceptual dependency model, not just a folder structure.

The lower layers provide stable capabilities to the upper layers. Upper layers may depend downward through approved contracts. Lower layers must not depend upward on business modules or client-specific behavior.

---

# 4. Layer Summary

| Layer | Purpose | Examples | Should It Know About Modules? |
|---|---|---|---|
| Kernel | Platform fundamentals | Auth, tenancy, users, roles, permissions, module registry, SDK backing, API contracts | No business logic |
| Business Objects | Shared business entities | Employee, Product, Customer, Supplier, Warehouse | No module ownership |
| Platform Services | Reusable cross-cutting services | Audit Log, Notifications, Approvals, Attachments, Reporting, Search | No module imports |
| Business Modules | Domain workflows | Inventory, Leave, CRM, Purchasing, Expenses, Assets | Yes, through SDK only |
| Client Configuration | Per-org settings | Enabled modules, roles, labels, limits, feature flags | No code ownership |

---

# 5. Kernel vs Everything Else

## 5.1 Kernel definition

The Kernel contains only platform fundamentals required for OneDayOS to exist.

Kernel may contain:

```txt
Authentication
Session handling
Organization tenancy
Users
Roles
Permissions
Subscriptions / plan records
Module registry
Module enablement
Settings/configuration primitives
API response contracts
Verified PlatformContext creation
Routing/app shell primitives
Event Bus interface
SDK backing implementations
```

Kernel must not contain:

```txt
Inventory logic
Leave logic
CRM logic
Purchasing logic
Expense workflows
Approval workflows unless formally promoted later
Notification delivery unless formally promoted later
Comments
Attachments
Reporting engine
Search engine
Client-specific business rules
```

## 5.2 Kernel test

Ask:

```txt
Would every OneDayOS deployment need this even if no business module existed yet?
```

If yes, it may belong in Kernel.

If no, it probably belongs somewhere else.

## 5.3 Examples

| Capability | Belongs In | Reason |
|---|---|---|
| Login | Kernel | Every user needs authentication |
| Organization slug routing | Kernel | Every tenant route depends on it |
| Role assignment | Kernel | Every module depends on permissions |
| Stock adjustment | Inventory Module | Domain-specific stock workflow |
| Leave approval | Leave Module for MVP | Approval Service not proven yet |
| Receipt upload | Module-local or future Attachment Service | Not Kernel |
| Low-stock notification | Inventory local event first | Notification Service not proven yet |

---

# 6. Business Objects vs Modules

## 6.1 Business Objects definition

Business Objects are shared business identities used across modules.

They answer:

```txt
What is this thing?
```

Modules answer:

```txt
What does this business do with this thing?
```

## 6.2 Core Business Objects

Approved Business Objects:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Branch and Department are not normal Business Objects. They are Kernel organization-structure primitives.

## 6.3 Ownership rules

```txt
Inventory does not own Product.
CRM does not own Customer.
Leave does not own Employee.
Purchasing does not own Supplier.
Assets does not own Warehouse.
```

Modules may reference Business Objects.

Modules may extend Business Objects through module-owned extension tables.

Modules must not duplicate Business Objects.

## 6.4 Good examples

```txt
Product
  id
  orgId
  code
  name
  unit

InventoryProductExtension
  productId
  orgId
  reorderPoint
  minimumStock
  inventoryStatus
```

```txt
Customer
  id
  orgId
  name
  email
  phone

CrmCustomerProfile
  customerId
  orgId
  lifecycleStage
  assignedSalesEmployeeId
```

```txt
Employee
  id
  orgId
  employeeNo
  name
  branchId
  departmentId

LeaveBalance
  employeeId
  orgId
  leaveTypeId
  balance
```

## 6.5 Bad examples

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
AssetWarehouse
```

These duplicate shared identity and create long-term platform damage.

## 6.6 Business Object field rule

Business Object fields must be the lowest common denominator.

A proposed field belongs in a core Business Object only if it is broadly useful across independent modules.

```txt
If only Inventory needs reorderPoint → InventoryProductExtension.
If only CRM needs lifecycleStage → CrmCustomerProfile.
If only Purchasing needs defaultLeadTimeDays → PurchasingSupplierProfile.
```

When unsure:

```txt
Put the field in an extension table first.
Promote later if repeated use proves it.
```

---

# 7. Platform Services vs Modules

## 7.1 Platform Service definition

A Platform Service is a reusable cross-cutting capability used by multiple independent modules or workflows.

Examples:

```txt
Audit Log
Notification Service
Approval Workflow Service
Comments Service
Attachments Service
Activity Feed
Reporting Service
Search Service
Background Jobs
```

Platform Services are not business modules.

They do not represent a client-purchased business domain. They provide reusable infrastructure behavior to many modules.

## 7.2 The Three Independent Use Cases Rule

A capability should not become a Platform Service just because it sounds reusable.

Use this rule:

```txt
One independent use case:
  Keep it inside the module.

Two independent use cases:
  Align patterns and start an evidence log.

Three independent use cases:
  Write a Platform Service proposal and ADR.

Three use cases do not automatically mean implementation.
They trigger architectural review.
```

## 7.3 Why this rule exists

Premature Platform Services create:

```txt
extra tables
extra APIs
extra permissions
extra UI
extra tests
extra migrations
extra support burden
extra Claude ambiguity
```

OneDayOS should not build a generic ERP engine before the real patterns appear.

## 7.4 Examples

### Approvals

```txt
Only Leave needs approvals
→ Keep approval logic inside Leave.

Leave + Expenses need approvals
→ Align patterns, but do not build Approval Service yet.

Leave + Expenses + Purchasing need approvals
→ Write Approval Workflow Service proposal.
```

### Attachments

```txt
Only Incident Reporting needs photos
→ Keep module-local or defer.

Incident Reporting + Expenses + Assets need files
→ Write Attachment Service proposal.
```

### Notifications

```txt
Only Inventory needs low-stock alerts
→ Keep local event/status behavior.

Inventory + Leave + Incidents all need user notifications
→ Write Notification Service proposal.
```

---

# 8. Business Modules

## 8.1 Module definition

A Business Module is a domain capability package.

It contains workflows, records, screens, APIs, services, permissions, events, tests, and documentation for one business domain.

Examples:

```txt
Inventory
Leave
CRM
Purchasing
Expenses
Assets
Visitor Management
Incident Reporting
Fleet Management, if added later
```

## 8.2 Modules are not standalone apps

A module must not behave like its own isolated SaaS product.

A module lives inside the shared OneDayOS platform.

It uses:

```txt
shared auth
shared tenancy
shared users
shared roles
shared permissions
shared Business Objects
shared SDK
shared app shell
shared design system
shared database
```

## 8.3 Module responsibilities

A module may contain:

```txt
module manifest
module permissions
module-owned entities
module extension tables
module services
module API routes
module pages
module forms
module tables
module events
module settings
module tests
module documentation
module AI context metadata
```

A module must not contain:

```txt
Kernel internals
raw Prisma access
another module's services
client-specific hacks
duplicate Business Objects
Platform Services hidden inside the module
per-client infrastructure assumptions
```

## 8.4 Module import rule

Modules import only from approved surfaces:

```txt
Allowed:
  @/sdk
  @/sdk/server
  @/sdk/client
  @/components/...
  module-local files
  shared type-only packages where approved

Forbidden:
  @/kernel/*
  raw Prisma client
  another module's service
  another module's database model wrapper
  server env helpers from client components
```

## 8.5 Module communication rule

Modules do not call each other directly.

They communicate through events or shared Business Objects.

Good:

```txt
Inventory emits inventory.stock_adjustment.posted
Purchasing may listen later if a documented integration exists
```

Bad:

```txt
Purchasing imports InventoryService
Inventory imports PurchasingService
```

---

# 9. Client Configuration

## 9.1 Definition

Client Configuration is per-organization setup inside the shared OneDayOS platform.

It answers:

```txt
How does this organization use the platform?
```

It does not create a new app.

## 9.2 Configuration may include

```txt
Organization name
Organization slug
Logo / light branding
Subscription plan
Enabled modules
User accounts
Roles
Permissions
Branches
Departments
Business Objects
Module settings
Labels where approved
Feature flags
Data imports / onboarding data
```

## 9.3 Configuration must not include

```txt
custom source code
custom database schema for one client
custom app shell
custom Vercel project
custom Supabase project
per-client module fork
hard-coded client rules in module code
hidden tenant bypasses
```

## 9.4 Client-specific request handling

A client-specific request should first be classified:

```txt
Can it be configuration?
Can it be a module setting?
Can it be a module extension?
Can it become a reusable module enhancement?
Can it become a new module?
Is it a Platform Service candidate?
Is it premium custom work?
Should it be rejected?
```

---

# 10. The Classification Ladder

Every feature request should move through this ladder before code is written.

```txt
1. Configuration
2. Existing module behavior
3. Existing module setting
4. Module extension table
5. Reusable module enhancement
6. New draft module
7. Platform Service candidate
8. Kernel change
9. Premium/custom/enterprise work
10. Reject or defer
```

Do not jump to a higher level unless the lower levels are insufficient.

---

# 11. Classification Decision Table

| Request | Classification | Why |
|---|---|---|
| Enable Inventory for Client A | Client Configuration | Module already exists |
| Add reorder point to Product for Inventory | Module extension | Inventory-specific Product behavior |
| Add customer lifecycle stage | CRM extension | CRM-specific Customer behavior |
| Track leave balances | Leave Module | Domain-specific workflow |
| Add low-stock alerts only for Inventory | Inventory local behavior | Notification Service not proven |
| Add receipt uploads only for Expenses | Expenses local/deferred | Attachment Service not proven |
| Add approvals to Leave, Expenses, Purchasing | Platform Service candidate | Three independent approval workflows |
| Add organization login and roles | Kernel | Required by every module |
| Add truck maintenance tracking | New Fleet Module candidate | New business domain |
| Add one weird report only for one client | Custom/premium or reject | Not reusable enough |
| Add raw SQL report builder | Reject/defer | Too risky for MVP |

---

# 12. New Module vs Existing Module Extension

## 12.1 Use an existing module extension when

```txt
The workflow clearly belongs to an existing domain.
The new fields only extend how that module uses a Business Object.
The user experience fits the existing module.
The permission model fits the existing module.
```

Example:

```txt
Inventory wants reorder point, minimum stock, and stock status for Product.
→ Add InventoryProductExtension.
```

## 12.2 Create a new module when

```txt
The request represents an independent business domain.
It has its own workflows, records, permissions, navigation, and lifecycle.
It cannot be naturally explained as part of an existing module.
It may be sold or enabled separately in the future.
```

Example:

```txt
Fleet Management needs vehicles, fuel logs, odometer readings, maintenance schedules, and assignments.
→ Create Fleet module.
```

## 12.3 Do not create a new module when

```txt
The client only needs a small field.
The request is a one-off label change.
The request is better solved by a setting.
The request is a report/view over existing data.
The request is actually a future Platform Service.
```

---

# 13. Scenario: Fleet Management Request

A trucking company asks for:

```txt
vehicle records
driver assignments
fuel logs
odometer readings
maintenance schedules
repair records
vehicle documents
```

This is outside the planned modules.

Bad response:

```txt
Force it into Assets.
Add truck fields to Employee.
Create client-specific tables.
Fork the app for this trucking client.
```

Correct response:

```txt
Create a draft Fleet module if commercially approved.
```

Fleet may use shared objects:

```txt
Employee → driver / mechanic / assigned person
Supplier → repair shops / fuel providers
Warehouse or Branch → location
Attachments later → vehicle documents, if Attachment Service exists
Expenses later → fuel/repair costs, if integrated later
```

Fleet may own:

```txt
Vehicle
VehicleAssignment
FuelLog
OdometerReading
MaintenanceSchedule
MaintenanceRecord
```

Initial status:

```txt
Draft module
Enabled only for the requesting client
No client fork
No Platform Service unless repeated use proves need
```

If later more logistics clients need it, Fleet can become an official module.

---

# 14. Scenario: Dental Clinic Request

A dental clinic asks for:

```txt
patient charts
medical history
tooth charting
x-ray uploads
prescriptions
treatment plans
doctor notes
appointments
billing
```

This is not just a simple module request.

It introduces:

```txt
sensitive health data
attachments
specialized workflows
privacy risk
possible regulatory obligations
complex UI
higher support burden
```

Possible classification:

```txt
Reject for standard one-day offer
or quote as premium vertical module
or defer until healthcare strategy is approved
```

Do not casually build this into CRM or Customer.

This is a domain/vertical decision, not just a technical task.

---

# 15. Scenario: Client Wants A Custom Dashboard

A client asks:

```txt
Can the dashboard show these 12 custom KPIs just for us?
```

Classification process:

```txt
Can standard module dashboards handle it?
Can simple saved filters handle it?
Is this a reusable report?
Is this a Reporting Service candidate?
Is this a one-off custom dashboard?
```

MVP response:

```txt
Use existing dashboards or module-local lightweight reports.
Do not build a generic Reporting Service yet.
Do not create a client-specific dashboard fork.
```

If approved as custom/premium work, it must still follow platform rules.

---

# 16. Scenario: Client Wants File Uploads

A client asks:

```txt
Can users upload receipts/photos/documents?
```

Classification:

```txt
One module needs it → module-local or defer.
Three independent modules need it → Attachment Service proposal.
```

Do not build the generic Attachment Service just because one module asks.

Do not store files casually without:

```txt
tenant scoping
permissions
storage cost controls
backup/restore plan
file access rules
signed URLs
storage object consistency
```

---

# 17. Scenario: Client Wants AI

A client asks:

```txt
Can AI answer questions about our business?
```

Classification:

```txt
Contextual help → future safe AI candidate
Query business data → deferred/high-risk
Mutate records → deferred/high-risk
Export data through AI → forbidden until explicit design
Raw SQL through AI → rejected
```

AI must never become a permission bypass.

MVP response:

```txt
Development AI is allowed.
User-facing runtime AI remains deferred unless a future AI spec approves a narrow feature.
```

---

# 18. Platform Change vs Module Change

## 18.1 Platform change

A platform change affects the shared foundation or multiple modules.

Examples:

```txt
New SDK method
New API response shape
New permission model
New tenancy model
New app shell behavior
New Business Object field
New Platform Service
New deployment model
```

Platform changes usually require:

```txt
Manual update
Tests
Possible ADR
Migration plan if database changes
Regression checks
```

## 18.2 Module change

A module change affects a business domain.

Examples:

```txt
Inventory stock adjustment workflow
Leave request cancellation
CRM opportunity stages
Expense claim submission
Visitor check-out
Incident corrective action
```

Module changes require:

```txt
Module spec update
Permission review
Tenant tests
API tests
Service tests
UI tests
Event review
```

## 18.3 Configuration change

A configuration change affects one organization without changing source code.

Examples:

```txt
Enable CRM for Client A
Add Staff role for Client B
Change Inventory reorder threshold setting
Change logo
Add branch
Import product list
```

Configuration changes require:

```txt
Founder/operator review
Smoke test
No code fork
No custom schema
```

---

# 19. Business Object Field Promotion

A module extension field may later become a Business Object field, but only after review.

Promotion requires:

```txt
Evidence from independent use cases
ADR or manual amendment
Migration plan
Backward compatibility plan
Tests
Updated module specs
Updated API schemas
Updated UI forms/tables
Updated event payload rules
```

Example:

```txt
barcode starts as InventoryProductExtension.barcode
Later Purchasing and Sales also need barcode
Review whether barcode should move to Product
```

Do not promote fields casually.

Bad core Business Object fields are hard to remove later.

---

# 20. Platform Service Promotion

A module-local capability may later become a Platform Service.

Promotion flow:

```txt
1. First use case appears
2. Keep module-local
3. Record evidence
4. Second independent use case appears
5. Align patterns, still local
6. Third independent use case appears
7. Write Platform Service proposal
8. Write ADR if approved
9. Write implementation-grade manual document
10. Define SDK contract
11. Define data model
12. Define tests
13. Migrate module-local behavior if appropriate
14. Claude implements narrow package only
```

Do not skip the evidence and design steps.

---

# 21. Client-Specific Work

Client-specific work is not automatically forbidden, but it must be controlled.

## 21.1 Allowed client-specific configuration

```txt
logo
organization settings
enabled modules
roles
permissions
branches
departments
module settings
initial data
labels where approved
```

## 21.2 Dangerous client-specific code

```txt
if (orgSlug === 'acme')
if (clientName === 'Juan Trading')
custom page only for one org inside shared module code
custom schema column only for one org
hard-coded business exception in service logic
client-specific CSS fork
```

These are normally forbidden.

## 21.3 Premium/custom work

Some client requests may be commercially worthwhile but not reusable.

If accepted, they must still avoid:

```txt
cross-tenant risk
module boundary violations
raw Prisma in modules
client-specific forks
undocumented architecture
```

Premium work may become:

```txt
module setting
module extension
new draft module
separate enterprise engagement
```

It should not silently corrupt the shared platform.

---

# 22. Dedicated Infrastructure

Normal clients do not receive dedicated infrastructure.

Normal model:

```txt
One shared OneDayOS platform
One production deployment
One production database
Many tenant organizations
```

Dedicated infrastructure is deferred as premium/enterprise.

It may be considered only for:

```txt
large enterprise client
strict compliance need
client-owned infrastructure requirement
high contract value
custom SLA
data residency requirement
```

Dedicated infrastructure must require separate pricing and operational process.

It is not part of the normal one-day delivery and AppCare offer.

---

# 23. FastAPI and Additional Backends

FastAPI is not part of the core platform.

Do not add FastAPI for:

```txt
normal APIs
module APIs
CRUD
auth
tenancy
permissions
reporting
search
simple background work
```

A future specialized Python service may be considered only through ADR for narrow use cases such as:

```txt
heavy document processing
specialized ML workloads
advanced data extraction
large-scale offline processing
```

Even then, modules must not call it directly. It would be a Platform Service boundary.

---

# 24. Request Classification Worksheet

Before accepting or implementing a request, answer:

```txt
1. What is the client asking for?
2. Which current module/domain does it relate to?
3. Does it use an existing Business Object?
4. Is it only configuration?
5. Is it a module setting?
6. Is it a module-specific extension field?
7. Is it a reusable enhancement to an existing module?
8. Is it an independent new module?
9. Is it a Platform Service candidate?
10. Does it require a Kernel change?
11. Does it involve sensitive data, files, AI, integrations, or infrastructure?
12. Does it affect all clients or only one organization?
13. Can it be delivered in one day safely?
14. Is it included in AppCare, billable enhancement, premium work, or rejected?
15. What tests are required?
16. Does it require manual update or ADR?
```

No request should go to Claude before this classification is complete.

---

# 25. Claude Rules

Claude must not be asked:

```txt
Build this client app.
Add this wherever it fits.
Make a quick custom page for this client.
Just add the field to Product.
Just call the Inventory service from Purchasing.
Just add a notification engine.
Just create a new API quickly.
```

Claude should be given:

```txt
Approved classification
Relevant frozen manual documents
Module spec or implementation package
Acceptance criteria
Forbidden patterns
Required tests
```

Claude must stop if:

```txt
The request does not clearly belong to a layer.
The request appears to require a Platform Service.
The request duplicates a Business Object.
The request requires client-specific code.
The request needs FastAPI or new infrastructure.
The request changes tenancy, permissions, SDK, or deployment model.
```

---

# 26. Anti-Patterns

## 26.1 Client fork anti-pattern

```txt
client-a-app/
client-b-app/
client-c-app/
```

Rejected.

## 26.2 Module owns shared identity anti-pattern

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
```

Rejected.

## 26.3 Platform Service too early anti-pattern

```txt
One module needs approvals
→ Build generic Approval Engine
```

Rejected.

## 26.4 Custom field dumping ground anti-pattern

```txt
customFields Json
```

Rejected for MVP.

## 26.5 Raw tenant identity anti-pattern

```txt
orgId from request body
sdk.getDb(orgId)
```

Rejected.

Use verified `PlatformContext`.

## 26.6 Module-to-module import anti-pattern

```txt
import { InventoryService } from '@/modules/inventory/service'
```

Rejected.

Use events, shared Business Objects, or an approved Platform Service.

---

# 27. Acceptance Criteria

This document is ready to freeze when:

```txt
[ ] Every major feature request can be classified using this document.
[ ] Kernel vs Business Object vs Platform Service vs Module vs Configuration is clear.
[ ] Business Object ownership rules are explicit.
[ ] Platform Service promotion rules are explicit.
[ ] New module creation rules are explicit.
[ ] Client-specific work rules are explicit.
[ ] Claude stop conditions are explicit.
[ ] Examples cover common edge cases.
[ ] The document prevents per-client forks.
[ ] The document supports one-day delivery without architectural drift.
```

---

# 28. Founder Review Questions

Before freezing, answer:

```txt
1. Is the classification ladder practical for sales and discovery?
2. Are we too strict about avoiding custom code?
3. Are we clear enough about when a new module can start with one client?
4. Are we clear enough about when to reject a request?
5. Are there Philippine SME scenarios missing from the examples?
6. Should any planned module be reclassified?
7. Should any capability currently deferred be moved earlier?
8. Does this make module development easier or harder?
```

---

# 29. Final Rule

The final rule is:

```txt
OneDayOS grows by converting repeated business needs into reusable platform capability.
It does not grow by copying apps, duplicating entities, or hiding custom code inside modules.
```

Every client should make the platform smarter.

No client should make the architecture messier.
