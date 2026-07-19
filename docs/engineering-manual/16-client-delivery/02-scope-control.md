# OneDayOS Engineering Manual — 16 Client Delivery — 02 Scope Control

**Document ID:** `16-client-delivery/02-scope-control.md`  
**Version:** `1.0`  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before First Paid Client Delivery  
**Owner:** Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `13-security/08-production-readiness-gate.md`
- `15-deployment-operations/06-appcare-operations.md`
- `16-client-delivery/00-one-day-delivery-playbook.md`
- `16-client-delivery/01-client-discovery.md`

---

# 1. Purpose

This document defines how OneDayOS controls scope during sales, discovery, delivery, support, AppCare, and future module development.

Scope control exists to protect the core OneDayOS promise:

```txt
Custom internal business applications for Philippine SMEs,
delivered in one business day,
on top of one reusable platform.
```

The one-day promise is possible only if OneDayOS does **not** behave like a traditional custom software agency.

A traditional agency accepts open-ended requirements and then writes bespoke code.

OneDayOS must do the opposite:

```txt
Classify the request.
Use the platform.
Configure first.
Extend carefully.
Create modules only when worthwhile.
Promote Platform Services only when proven.
Reject or quote separately when necessary.
Never fork casually.
```

Scope control is not about saying “no” to clients randomly.

Scope control is about protecting:

- delivery speed
- AppCare profitability
- platform reuse
- product consistency
- tenant security
- low operational cost
- future AI-assisted development
- founder sanity

---

# 2. Core Principle

```txt
OneDayOS sells a platformized delivery outcome,
not unlimited custom software labor.
```

The client is buying:

```txt
OneDayOS
+ selected modules
+ configuration
+ onboarding
+ AppCare
```

The client is not buying:

```txt
unlimited feature requests
unlimited workflow redesign
unlimited integrations
unlimited reporting
unlimited AI
unlimited file storage
unlimited custom UI
unlimited business analysis
unlimited development time
```

---

# 3. Non-Goals

Scope control is not intended to:

- make OneDayOS rigid forever
- reject every unusual request
- prevent new modules from being created
- prevent useful platform evolution
- prevent paid custom or premium work
- ignore client-specific business realities
- force every client into the exact same workflow

Scope control **is** intended to prevent:

- client-specific forks
- hidden custom code paths
- modules becoming dumping grounds
- Platform Services being built too early
- one-day projects becoming multi-week custom builds
- AppCare becoming unlimited development support
- Claude inventing architecture during delivery
- sales promises that engineering cannot support

---

# 4. Scope Control Vocabulary

## 4.1 Configuration

A change made using existing settings, roles, permissions, module enablement, labels, defaults, or seed data.

Examples:

```txt
Enable Inventory module
Add warehouse records
Create Admin and Staff roles
Set default product unit
Add branches/departments
Configure subscription limits
Rename a status label if supported
```

Configuration is the preferred way to satisfy client needs.

## 4.2 Module Setup

Using an existing module as intended.

Examples:

```txt
Set up Inventory for products and stock levels
Set up Leave for leave requests
Set up CRM for customer pipeline
Set up Visitor Management for visitor logs
```

## 4.3 Module Extension

Adding module-specific fields, screens, rules, or workflows without changing shared Business Objects or creating a new module.

Examples:

```txt
InventoryProductExtension.reorderPoint
FleetVehicle.plateNumber
CRMCustomerExtension.leadSource
PurchasingSupplierExtension.paymentTerms
```

Module extension is allowed only when it remains inside the module boundary and does not pollute shared Business Objects.

## 4.4 New Draft Module

A new business capability package created because an existing module does not fit.

Examples:

```txt
Fleet Management
Clinic Appointments
Training Management
Equipment Calibration
Rental Reservations
Field Service
```

A new module may start for one client if commercially worthwhile, but it must still follow OneDayOS architecture.

It is not a client fork.

## 4.5 Platform Service Candidate

A repeated cross-cutting capability that may eventually become a Platform Service after evidence.

Examples:

```txt
Approvals
Notifications
Attachments
Comments
Activity Feed
Reporting
Search
Background Jobs
```

A single client request does not justify a Platform Service.

## 4.6 Custom / Premium Work

Work that is outside standard one-day delivery but may be quoted separately.

Examples:

```txt
complex import from messy Excel files
third-party accounting integration
custom PDF templates
dedicated infrastructure
multi-branch role logic beyond MVP
custom dashboards
advanced approvals
SMS integration
customer portal
```

## 4.7 Rejected / Deferred Work

Requests that should not be accepted yet because they are risky, unprofitable, too custom, legally sensitive, operationally heavy, or architecturally premature.

Examples:

```txt
payroll tax computation
medical records without healthcare review
loan management without compliance review
client-owned infrastructure on starter pricing
AI that can edit records automatically
open-ended custom workflow builder
```

---

# 5. Standard One-Day Delivery Scope

A standard one-day delivery should normally include:

```txt
1 client organization
1 to 2 approved modules
standard app shell
standard design system
standard login
standard roles
standard permissions
basic branch/department setup
basic Business Object setup
basic module settings
basic clean data loading
basic smoke testing
basic client training
AppCare activation
```

A standard one-day delivery should **not** include:

```txt
new Platform Services
runtime AI features
large data migration
third-party integrations
custom mobile apps
custom dashboards
custom PDF/report builders
file attachment systems
advanced approval engine
background job infrastructure
customer/vendor portals
dedicated database
dedicated Supabase project
dedicated Vercel project
complex role hierarchies
full business-process consulting
```

---

# 6. One-Day Scope Budget

Every client delivery should be scoped as a limited delivery budget, not an open development session.

A default one-day delivery budget is:

```txt
Discovery already completed before delivery day
1 organization provisioned
1 to 2 modules enabled/configured
up to 3 user roles
up to 10 initial users
up to 3 branches/departments/warehouses unless otherwise agreed
basic clean data import only
1 training/handover session
basic smoke testing
AppCare setup
```

This is not a hard universal pricing table. It is a scope-control baseline.

The founder may adjust it, but every adjustment should be explicit.

---

# 7. Scope Lock

## 7.1 Definition

Scope Lock is the point where the client, founder, and delivery team agree what will be delivered in the one-day build.

After Scope Lock, new requests are classified as:

```txt
in-scope clarification
post-launch configuration
paid enhancement
new module request
Platform Service evidence
rejected/deferred
```

Scope Lock must happen before Claude receives implementation instructions.

## 7.2 Scope Lock Requirements

Before work starts, the following must exist:

```txt
[ ] Client Discovery Brief approved
[ ] modules selected
[ ] users/roles defined
[ ] required Business Objects identified
[ ] data import files received and reviewed
[ ] out-of-scope items listed
[ ] known limitations disclosed
[ ] AppCare scope explained
[ ] delivery day scheduled
[ ] founder approves the scope
```

## 7.3 Scope Lock Statement

Every delivery should have a written scope statement similar to:

```txt
For this one-day delivery, OneDayOS will provision the client's organization,
enable Inventory and Customer modules, configure users/roles/warehouses,
load the provided clean product CSV, test login and basic workflows,
and conduct a handover session.

The delivery does not include accounting integration, barcode scanning,
custom reports, mobile app support, or automated notifications.
These may be quoted separately after launch.
```

---

# 8. Request Classification Process

Every client request must go through this classification process.

```txt
Request received
  ↓
Does existing configuration solve it?
  → yes: configure
  ↓ no
Does an existing module already support it?
  → yes: module setup
  ↓ no
Can an existing module support it via extension table/settings?
  → yes: module extension
  ↓ no
Is it a reusable independent business capability?
  → yes: new draft module
  ↓ no
Is it a repeated cross-cutting capability across independent use cases?
  → yes: Platform Service candidate; evidence log + proposal
  ↓ no
Is it commercially worth custom work?
  → yes: quote separately
  ↓ no
Reject or defer
```

This classification must happen before promising delivery.

---

# 9. Configuration Before Customization

Configuration is always preferred.

Examples:

| Client Need | Preferred Response |
|---|---|
| “We have 3 branches.” | Create 3 Branch records. |
| “Only managers can approve.” | Configure roles/permissions if approval exists. |
| “We call warehouses stockrooms.” | Use label setting later if supported; otherwise explain standard naming. |
| “We need 5 users.” | Add users and assign roles. |
| “We need Inventory only.” | Enable Inventory module only. |

Anti-pattern:

```txt
Hard-code a client's wording or workflow into source code.
```

Acceptable:

```txt
Use settings, module settings, labels, permissions, or seed data.
```

---

# 10. Existing Module Before New Module

Before creating a new module, ask:

```txt
Does this fit an existing module with normal configuration?
Does it fit an existing module with a clean extension table?
Would this create duplicate Business Objects?
Would this module become reusable for future SMEs?
```

Example:

A client asks:

```txt
“We need to track office laptops, who has them, and when they were issued.”
```

Correct classification:

```txt
Assets module
```

Not:

```txt
New Laptop Tracking module
Inventory extension
Employee custom fields
```

---

# 11. New Module Criteria

A new module may be created when:

```txt
[ ] the workflow is not configuration
[ ] the workflow does not cleanly fit an existing module
[ ] the workflow is commercially valuable
[ ] the workflow can be isolated as a business capability
[ ] it can use existing Kernel, SDK, Business Objects, and module rules
[ ] it does not require premature Platform Services
[ ] it does not require client-specific infrastructure
[ ] founder approves the module as draft
```

A new module must have:

```txt
[ ] module spec
[ ] manifest
[ ] permissions
[ ] routes
[ ] APIs
[ ] services
[ ] events
[ ] tests
[ ] documentation
[ ] AI context metadata if relevant
```

A new module must not:

```txt
hard-code orgSlug
hard-code client name
import another module
import Kernel internals
use raw Prisma
accept client-supplied orgId
duplicate Business Objects
create a Platform Service internally
```

---

# 12. One-Client Module Rule

A new module may start because of one client.

This is allowed.

But it must start as:

```txt
Draft Module
```

Not:

```txt
Client Fork
```

Example:

```txt
Client: trucking company
Need: fleet maintenance and fuel logs
Decision: create Fleet module as draft
Enabled for: trucking client only
```

The module exists in the shared platform codebase but is enabled only for that organization.

Later:

```txt
Second logistics client uses Fleet
Third logistics client uses Fleet
Fleet becomes official reusable module
```

This is how OneDayOS grows without forking.

---

# 13. Existing Module Extension Rules

A module extension is appropriate when the request is clearly part of an existing module's domain.

Example:

```txt
Inventory needs reorder points for products.
```

Correct:

```txt
InventoryProductExtension.reorderPoint
```

Incorrect:

```txt
Product.reorderPoint
```

Reason:

```txt
Product is a shared Business Object.
Reorder point is inventory-specific.
```

Another example:

```txt
CRM needs lead source for customers.
```

Correct:

```txt
CRMCustomerExtension.leadSource
```

Incorrect:

```txt
Customer.leadSource
```

Extension tables protect Business Object minimalism.

---

# 14. Platform Service Scope Rule

A client request must not automatically become a Platform Service.

Example:

```txt
One client needs receipt uploads in Expenses.
```

Wrong response:

```txt
Build Attachment Service now.
```

Correct response:

```txt
Keep receipt handling module-local if approved.
Log attachment use case.
Wait for more evidence.
```

Platform Services require:

```txt
[ ] Three Independent Use Cases evidence
[ ] founder/architect review
[ ] proposal document
[ ] ADR if needed
[ ] data model
[ ] SDK contract
[ ] security model
[ ] tests
[ ] implementation prompt for Claude
```

Deferred Platform Services include:

```txt
Audit Log
Notifications
Approval Workflow
Comments
Attachments
Activity Feed
Reporting
Search
Background Jobs
```

These must not be implemented during ordinary client delivery unless already promoted and approved.

---

# 15. AppCare Scope Boundary

AppCare includes:

```txt
hosting
monitoring
security updates
backups
bug fixes
maintenance
basic AI-assisted support
minor configuration support
```

AppCare does not automatically include:

```txt
new modules
new integrations
custom dashboards
custom reports
business-process redesign
large data imports
new Platform Services
runtime AI features
file upload systems
custom mobile apps
dedicated infrastructure
ongoing admin labor
```

If a client asks for new work during AppCare, classify it:

```txt
bug
configuration
enhancement
new module
Platform Service candidate
custom/premium work
reject/defer
```

---

# 16. Bug vs Enhancement

This distinction protects AppCare profitability.

## 16.1 Bug

A bug is when OneDayOS does not behave according to the approved scope, manual, module spec, or accepted platform behavior.

Examples:

```txt
User cannot log in despite correct credentials
Inventory list throws error
Staff can access Admin page
Org A can see Org B data
Product create form saves wrong value
Approved module route returns 500
```

Bug fixes are generally included in AppCare.

## 16.2 Enhancement

An enhancement is a new capability, new workflow, new report, new UI, new integration, new module behavior, or changed business process.

Examples:

```txt
Add SMS alerts
Add barcode scanning
Add custom PDF invoice
Add new dashboard chart
Add manager approval flow
Add multi-step import wizard
Add accounting integration
```

Enhancements require scope review and may be quoted separately.

## 16.3 Configuration

Configuration is a supported setup change using existing platform capabilities.

Examples:

```txt
Add new user
Change role permission
Enable existing module
Add warehouse
Change module setting
```

Minor configuration support may be included in AppCare, but ongoing admin labor is not unlimited.

---

# 17. One-Day Delivery Inclusion Table

| Item | Standard One-Day? | Notes |
|---|---:|---|
| Organization provisioning | Yes | Required. |
| User creation | Yes | Within agreed limit. |
| Role setup | Yes | Standard roles only. |
| Module enablement | Yes | 1–2 modules normally. |
| Existing module configuration | Yes | Within scope. |
| Clean CSV import | Maybe | Only if clean and reviewed before delivery. |
| Messy data cleanup | No | Quote separately. |
| New module | Maybe | Only if small, approved, and spec-ready. |
| Platform Service | No | Requires evidence and manual doc. |
| Third-party integration | No | Quote separately. |
| Custom report | Maybe | Simple module-local only; complex reporting deferred. |
| Dashboard customization | No by default | Quote separately. |
| File uploads | No by default | Attachment Service deferred. |
| AI chatbot | No | AI runtime deferred. |
| Dedicated database | No | Premium/enterprise only later. |
| Dedicated Supabase project | No | Premium/enterprise only later. |
| Dedicated Vercel project | No | Premium/enterprise only later. |
| Client-specific fork | Never | Violates platform model. |

---

# 18. Red Flag Requests

These requests should trigger caution or rejection:

```txt
“Can you just copy our Excel exactly?”
“Can every client screen be different?”
“Can we have our own database on the starter plan?”
“Can users approve based on 20 custom rules?”
“Can the AI automatically update records?”
“Can you integrate with our old accounting software tomorrow?”
“Can you import this messy 15-sheet Excel file today?”
“Can you make it work like our entire manual process?”
“Can you build it now and we’ll explain the rules later?”
“Can you make this one special for us only?”
```

These are not automatically bad clients, but they are scope risks.

---

# 19. Yellow Flag Requests

These may be accepted, but require careful classification:

```txt
simple additional field
simple CSV import
simple approval status
simple custom label
simple module-local report
simple dashboard stat
new module for a clear workflow
basic role variant
basic onboarding data
```

Yellow flag means:

```txt
pause
classify
write scope
avoid hidden complexity
```

---

# 20. Scenario: Client Wants Fleet Management

Client:

```txt
“We operate delivery trucks. We need to track vehicles, drivers, fuel logs,
odometer readings, maintenance, tire replacements, and renewal dates.”
```

Classification:

```txt
New Draft Module: Fleet
```

Potential shared Business Objects:

```txt
Employee → drivers
Supplier → fuel stations / repair shops
Warehouse maybe not relevant
Attachments later → vehicle documents
Expenses later → fuel and repairs
```

Module-owned entities:

```txt
Vehicle
VehicleAssignment
OdometerLog
FuelLog
MaintenanceSchedule
MaintenanceRecord
```

Decision:

```txt
May be accepted as paid new draft module if commercially worthwhile.
Must not be hacked into Assets or Inventory unless the scope is truly asset-only.
```

Out-of-scope unless separately approved:

```txt
GPS tracking
fuel card integration
LTO integration
driver mobile app
route optimization
maintenance vendor portal
```

---

# 21. Scenario: Client Wants Dental Clinic System

Client:

```txt
“We need patients, dental charts, appointments, x-rays, prescriptions,
treatment plans, medical history, and billing.”
```

Classification:

```txt
High-risk vertical module candidate
Founder/architect review required
Likely not standard one-day delivery
```

Why:

```txt
sensitive health data
file attachments
specialized clinical workflows
privacy/compliance risk
complex records
possible medical/legal implications
```

Possible response:

```txt
OneDayOS can support appointment and customer-style records in standard modules,
but full dental charting and medical-record workflows are outside the standard one-day package.
This would require a separate vertical module scope and pricing.
```

Do not casually build this as normal CRM.

---

# 22. Scenario: Client Wants Custom Reports

Client:

```txt
“We need a daily report showing low stock, pending purchase requests,
unpaid invoices, and staff attendance.”
```

Classification:

```txt
Cross-module reporting request
High-risk for standard one-day delivery
```

Possible decisions:

```txt
If only Inventory is enabled:
  simple module-local report may be allowed.

If it spans multiple modules:
  defer or quote separately.

If three clients/modules need similar reporting:
  Reporting Service candidate.
```

Do not build a custom SQL report per client inside the platform.

---

# 23. Scenario: Client Wants File Uploads

Client:

```txt
“Can employees upload receipts for expenses?”
```

Classification:

```txt
Attachment capability
```

Decision path:

```txt
If Expenses really needs receipt upload for one client:
  module-local attachment handling may be considered with founder approval.

Do not build full Attachment Service yet.
Log the use case.
```

Out-of-scope for standard one-day delivery unless pre-approved:

```txt
multi-file uploads
image compression
virus scanning
signed URL management
storage quotas
storage backup procedures
attachment search
attachment permissions across modules
```

---

# 24. Scenario: Client Wants Approval Workflow

Client:

```txt
“Leave requests must be approved by supervisor, then HR, then owner if more than five days.”
```

Classification:

```txt
Approval workflow
```

Decision path:

```txt
If only Leave needs approval:
  keep approval logic module-local.

If Leave + Purchasing + Expenses all need similar approvals:
  Approval Workflow Service candidate.
```

Do not build a generic Workflow Engine for one client.

---

# 25. Scenario: Client Wants Their Own Infrastructure

Client:

```txt
“We want our own Supabase account and database.”
```

Classification:

```txt
Dedicated infrastructure request
Premium/enterprise only
Not standard one-day delivery
```

Standard answer:

```txt
The standard OneDayOS package runs on shared OneDayOS-managed infrastructure
with tenant isolation, backups, monitoring, and AppCare. Dedicated infrastructure
is a premium enterprise option and requires separate pricing and operations scope.
```

Do not include this in the normal package.

---

# 26. Scenario: Client Wants AI Features

Client:

```txt
“Can AI automatically summarize sales and update customer statuses?”
```

Classification:

```txt
Runtime AI feature
Deferred / premium future capability
```

Possible response:

```txt
AI-assisted development and internal support are part of how OneDayOS is built,
but user-facing AI automation is not included in the standard one-day package yet.
Future AI features will require strict permission, tenant, audit, and confirmation controls.
```

Do not let AI mutate production data directly.

---

# 27. Scope Creep Patterns

Watch for these patterns:

## 27.1 “Just One Small Field”

A field may be small visually but large architecturally.

Ask:

```txt
Is it shared Business Object data?
Is it module-specific?
Does it require import/export?
Does it require permissions?
Does it appear in reports?
Does it affect workflows?
```

## 27.2 “Can We Add a Simple Report?”

Reports often imply:

```txt
query logic
permissions
exports
time filters
cross-module joins
data accuracy expectations
support questions
```

## 27.3 “Can We Upload Files?”

Files imply:

```txt
storage cost
access control
signed URLs
backup/restore
file size limits
file type limits
virus scanning future
data retention
```

## 27.4 “Can We Notify Users?”

Notifications imply:

```txt
delivery channels
preferences
read/unread state
retries
background jobs
email/SMS provider costs
privacy
support issues
```

## 27.5 “Can AI Do It?”

AI implies:

```txt
cost
permission boundaries
tenant isolation
prompt injection
incorrect answers
action confirmation
audit trail
support liability
```

Small requests are not always small systems.

---

# 28. Commercial Decision Matrix

| Request | Strategic Value | Complexity | Reuse Potential | Suggested Action |
|---|---:|---:|---:|---|
| Add existing module | High | Low | High | Include/configure |
| Add clean user roles | High | Low | High | Include/configure |
| Clean CSV import | Medium | Medium | Medium | Include if pre-reviewed |
| Messy data cleanup | Low | High | Low | Quote separately |
| New reusable module | High | Medium/High | High | Quote/approve as draft module |
| One-off client workflow | Low | High | Low | Reject or premium custom |
| Platform Service candidate | High | High | High | Evidence + proposal, not immediate |
| Dedicated infrastructure | Medium | High | Low | Premium/enterprise only |
| Runtime AI action | Medium/High | High | Unknown | Defer |
| Third-party integration | Medium | High | Medium | Quote separately |

---

# 29. Scope Change Process

After Scope Lock, every new request must become a Change Request.

## 29.1 Change Request Template

```md
# Change Request

Client:
Organization:
Requested by:
Date:

## Request

## Business Reason

## Classification
- [ ] Configuration
- [ ] Existing Module Setup
- [ ] Module Extension
- [ ] New Draft Module
- [ ] Platform Service Candidate
- [ ] Custom/Premium Work
- [ ] Reject/Defer

## Impact
- Delivery timeline:
- Data model:
- Permissions:
- Tests:
- AppCare:
- Cost:

## Decision
- [ ] Include in current scope
- [ ] Defer after launch
- [ ] Quote separately
- [ ] Reject

## Founder Approval
```

## 29.2 Change Request States

```txt
proposed
classified
approved
quoted
deferred
rejected
implemented
```

Claude must not implement a post-Scope-Lock request unless it has an approved state.

---

# 30. Client Communication Scripts

## 30.1 Configuration Response

```txt
Yes, that fits the standard OneDayOS configuration. We can include it in the setup.
```

## 30.2 Out-of-Scope but Possible Later

```txt
That is possible, but it is outside the one-day delivery scope. We can launch the standard module first, then quote that as a separate enhancement after go-live.
```

## 30.3 New Module Response

```txt
That workflow does not fit the existing modules cleanly. We can treat it as a new OneDayOS module if it is important enough for your business, but it needs a separate module scope and approval.
```

## 30.4 Platform Service Deferred Response

```txt
That capability affects multiple parts of the platform, so we do not add it casually for one project. We will log it as a platform-service candidate and revisit it once repeated use cases prove the need.
```

## 30.5 Rejection Response

```txt
That request is outside what OneDayOS can safely support in the current package. I do not want to promise something that will become unreliable or expensive to maintain. We can revisit it later as a separate premium scope if needed.
```

## 30.6 Dedicated Infrastructure Response

```txt
The standard OneDayOS package runs on OneDayOS-managed shared infrastructure with tenant isolation and AppCare. Dedicated infrastructure is possible later as an enterprise option, but it is not included in the standard one-day package.
```

---

# 31. Scope Control and Pricing

Scope control must inform pricing.

Standard package:

```txt
₱20,000+ initial build
₱3,500/month AppCare
```

This pricing assumes:

```txt
shared platform
standard modules
limited configuration
no dedicated infrastructure
no open-ended custom development
no heavy integrations
no full custom workflow engine
```

Requests that add operational burden should increase price.

Examples:

```txt
new module
complex data migration
custom integration
custom report package
file upload/storage-heavy workflow
dedicated infrastructure
premium AppCare SLA
runtime AI feature
```

Do not absorb high-complexity requests into starter pricing.

---

# 32. Scope Control and Architecture

Every scope decision must preserve the architecture:

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

Scope control must prevent:

```txt
Business Object pollution
module-to-module imports
Platform Service premature implementation
client-specific forks
raw Prisma in modules
loose orgId handling
hard-coded orgSlug logic
custom database edits
```

If a request requires violating architecture, it must be rejected or redesigned.

---

# 33. Scope Control and Business Objects

When a client asks for a field, classify it carefully.

Example:

```txt
“Products need reorder point.”
```

Wrong:

```txt
Add Product.reorderPoint
```

Correct:

```txt
InventoryProductExtension.reorderPoint
```

Business Object fields should be lowest common denominator.

Module-specific fields go in module extension tables.

---

# 34. Scope Control and Design System

Clients may ask for visual changes.

Allowed in standard scope:

```txt
logo upload if supported
basic brand color if supported
standard OneDayOS layout
standard module UI
```

Not included by default:

```txt
custom dashboard layout
custom table design
custom module layout
client-specific component variants
custom animations
client-specific theme fork
```

OneDayOS should have a consistent premium product identity.

It should not become 20 differently designed dashboards.

---

# 35. Scope Control and Data Imports

Standard one-day delivery may include basic clean data loading.

Allowed if pre-reviewed:

```txt
clean CSV
known columns
small/medium row count
no complex transformations
no duplicate resolution beyond simple matching
no multi-sheet Excel logic
no ambiguous relationships
```

Out-of-scope unless quoted:

```txt
messy Excel cleanup
multi-sheet transformation
legacy database migration
deduplication project
manual data encoding
OCR extraction
PDF extraction
large import with background jobs
import UI
AI column mapping
```

Client data must be reviewed before delivery day.

Do not discover messy data during the one-day build.

---

# 36. Scope Control and Integrations

Third-party integrations are not part of standard one-day delivery.

Examples:

```txt
QuickBooks
Xero
Shopify
Lazada
Shopee
Google Sheets sync
SMS provider
email provider
payment gateway
biometric attendance system
barcode scanner hardware
GPS tracking
```

Integrations require:

```txt
API review
credentials/security review
data mapping
failure handling
sync strategy
rate limit review
logging
support model
separate pricing
```

Do not promise integrations casually.

---

# 37. Scope Control and Reports

Simple module-local reports may be allowed if they are small and clearly scoped.

Allowed examples:

```txt
Inventory low stock list
Leave requests by status
CRM leads by stage
Expenses by category
```

Out-of-scope by default:

```txt
cross-module reporting
custom SQL reports
scheduled reports
PDF reports
pivot table builder
BI dashboard
AI-generated reports
export-heavy reporting
```

Reporting Service remains deferred until repeated independent use cases prove it.

---

# 38. Scope Control and AI

AI-assisted development is part of how OneDayOS is built.

Runtime AI features are not standard delivery yet.

Do not include in standard one-day scope:

```txt
AI chatbot
AI query over business data
AI report generator
AI workflow automation
AI record editing
AI import mapping
AI customer support bot
AI embeddings/vector search
```

Future AI features must respect:

```txt
PlatformContext
tenant isolation
permissions
module enablement
soft delete
sensitive field exclusions
preview + human confirmation for actions
```

---

# 39. Scope Control and Security

No client request may weaken security.

Forbidden even if client asks:

```txt
shared passwords
turn off auth
make everyone admin
expose Supabase dashboard
send service keys
skip permission checks
use client-supplied orgId
hard-code tenant access
allow cross-org staff access without support-access model
```

Security scope is not negotiable.

---

# 40. Scope Control and Claude

Claude must not receive broad instructions like:

```txt
Build the client's app.
Add whatever they requested.
Make it work like their Excel.
```

Claude should receive narrow instructions:

```txt
Using frozen documents X, Y, and Z, implement the approved scope item:
[exact module / service / route / test].
Do not implement out-of-scope requests.
Do not add Platform Services.
Do not create client-specific forks.
Stop if the scope conflicts with the manual.
```

Claude must not decide:

```txt
whether a request is in scope
whether to create a new Platform Service
whether to add dedicated infrastructure
whether to bypass security rules
whether to fork the app
whether to add a third-party integration
```

Claude may help implement approved scope only.

---

# 41. Delivery-Day Scope Control Checklist

Before starting delivery:

```txt
[ ] Discovery Brief approved
[ ] Scope Lock approved
[ ] modules selected
[ ] out-of-scope items documented
[ ] data files received and reviewed
[ ] roles/users identified
[ ] Business Objects identified
[ ] integrations explicitly excluded unless quoted
[ ] Platform Services explicitly excluded unless already implemented
[ ] AppCare scope explained
[ ] delivery acceptance criteria defined
```

During delivery:

```txt
[ ] do not accept new verbal scope casually
[ ] classify every new request
[ ] log deferred items
[ ] reject architectural shortcuts
[ ] keep Claude tasks narrow
[ ] test auth, tenancy, permissions, and module access
```

Before handover:

```txt
[ ] delivered items match Scope Lock
[ ] excluded items remain excluded
[ ] known limitations disclosed
[ ] client trained on included workflows
[ ] AppCare process explained
[ ] enhancement requests logged separately
```

---

# 42. Scope Review Questions

Before accepting any request, ask:

```txt
Does this help the platform or only this client?
Can configuration solve it?
Does an existing module already solve it?
Does it belong in a module extension table?
Does it require a new module?
Does it require a Platform Service?
Does it touch sensitive data?
Does it require new infrastructure?
Does it create recurring support burden?
Can it be delivered safely in one day?
Will this make future modules easier or harder?
Can Claude implement this without inventing architecture?
```

If the answers are unclear, do not include it in one-day delivery.

---

# 43. Founder Decision Rights

The founder must approve:

```txt
new draft modules
Platform Service proposals
dedicated infrastructure
runtime AI features
third-party integrations
large data migrations
sensitive/regulated domain work
custom pricing exceptions
client-specific premium work
any exception to one-day scope rules
```

The founder should not delegate these decisions to Claude.

---

# 44. Scope Control Acceptance Criteria

This document is accepted when:

```txt
[ ] client requests can be classified consistently
[ ] one-day delivery boundaries are clear
[ ] AppCare boundaries are clear
[ ] bug vs enhancement is clear
[ ] new module criteria are clear
[ ] Platform Service promotion is protected
[ ] client-specific forks are explicitly rejected
[ ] Claude implementation boundaries are clear
[ ] sales/support language exists for saying no or quoting separately
```

---

# 45. Claude Implementation Rules

Claude must follow these rules during client delivery:

```txt
Do not implement anything outside approved scope.
Do not create client-specific forks.
Do not hard-code client org slugs.
Do not create per-client infrastructure.
Do not add Platform Services during delivery unless explicitly approved.
Do not add runtime AI features.
Do not add integrations without a signed scope.
Do not add file uploads casually.
Do not modify Business Objects for module-specific fields.
Do not bypass PlatformContext.
Do not accept client-supplied orgId.
Do not use raw Prisma inside modules.
Do not import from @/kernel/* inside modules.
Do not import one module from another.
Do not skip tests because the request is “small.”
```

If Claude finds that a requested implementation violates the manual, it must stop and report the conflict.

---

# 46. Recommended Founder Rule

The founder should use this rule in sales and delivery:

```txt
If it cannot be configured, generated, reused, or clearly scoped,
it does not belong in the one-day delivery.
```

This protects the business.

---

# 47. Summary

Scope control is what keeps OneDayOS from becoming a normal custom-software agency.

The goal is not to reject clients.

The goal is to protect the platform so that each new client makes OneDayOS stronger, not messier.

The correct delivery model is:

```txt
Configure first.
Use existing modules second.
Extend modules carefully third.
Create draft modules when valuable.
Promote Platform Services only when proven.
Quote or reject custom work honestly.
Never fork casually.
```

If OneDayOS follows this discipline, the platform becomes faster and more valuable with every client.

If OneDayOS ignores this discipline, it becomes 100 custom apps with one brand name.

That must not happen.
