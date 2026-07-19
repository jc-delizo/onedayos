# OneDayOS Engineering Manual — 01 Foundation — 02 Product Principles

**Document ID:** `01-foundation/02-product-principles.md`  
**Version:** 1.0  
**Status:** Frozen  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Date:** July 2026  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  
**Depends On:**

- `01-foundation/00-vision.md`
- `01-foundation/01-business-model.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `05-sdk/00-sdk-overview.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `09-cli-generators/00-generator-philosophy.md`
- `10-platform-services/01-three-client-rule.md`
- `16-client-delivery/00-one-day-delivery-playbook.md`
- `16-client-delivery/02-scope-control.md`
- `17-module-specifications/00-module-spec-template.md`

---

# 1. Purpose

This document defines the product principles that should guide every OneDayOS decision.

It answers questions like:

```txt
Should this be configuration or code?
Should this be a new module?
Should this be a Platform Service?
Should this become part of the reusable product?
Should this be rejected?
Should Claude implement this now?
```

OneDayOS must grow from client work, but it must not become trapped by client work.

Every project should make the shared platform better.

But not every client request should become a platform feature.

The product discipline is:

```txt
Capture real client pain.
Classify it correctly.
Productize reusable patterns.
Reject or price non-reusable custom work.
Never fork the platform casually.
```

---

# 2. Core Product Principle

The core product principle is:

```txt
OneDayOS is configured for clients.
It is not rewritten for clients.
```

A client delivery should feel custom to the client, but internally it should be built from reusable platform parts.

The customer may say:

```txt
I need an inventory app.
I need a visitor log.
I need a leave management system.
I need a trucking system.
```

But OneDayOS should translate that into:

```txt
client organization
+ enabled modules
+ shared business objects
+ module settings
+ roles and permissions
+ scoped configuration
+ reusable improvements where justified
```

The product should become more capable after every project, but the platform must not become messy after every project.

---

# 3. Product Principles Summary

These principles are ordered. Earlier principles generally override later ones.

```txt
1. Platform before project.
2. Configure before customize.
3. Reuse before build.
4. Module before fork.
5. Business Object before duplicate entity.
6. Extension table before core-field pollution.
7. Evidence before abstraction.
8. Security before speed.
9. Convention before configuration.
10. UX consistency before module individuality.
11. Tests before trust.
12. Productization after every delivery.
13. AppCare sustainability before feature promises.
14. AI accelerates architecture; AI does not invent architecture.
15. Founder review before high-risk commitments.
```

Each principle is expanded below.

---

# 4. Principle 1 — Platform Before Project

OneDayOS must never think in terms of isolated client apps.

Incorrect mental model:

```txt
Client A App
Client B App
Client C App
```

Correct mental model:

```txt
OneDayOS Platform
  ├── Organization: Client A
  ├── Organization: Client B
  ├── Organization: Client C
  └── Organization: Client D
```

A project is not a separate product.

A project is a delivery of the shared platform to one client organization.

This means:

```txt
no client-specific repositories by default
no client-specific databases by default
no client-specific Vercel projects by default
no client-specific Supabase projects by default
no copied app folders
no hardcoded client names in module code
no one-off layouts for normal clients
```

A client may receive unique configuration, but not a unique architecture.

---

# 5. Principle 2 — Configure Before Customize

The first question for any client request is:

```txt
Can this be solved with configuration?
```

Configuration includes:

```txt
enabled modules
roles
permissions
branches
departments
users
employees
module settings
labels
statuses
basic categories
basic thresholds
simple branding
initial data
```

Examples:

```txt
Client wants only managers to approve leave
→ configure roles and permissions

Client wants three warehouses
→ create Warehouse Business Object records

Client wants different expense categories
→ configure ExpenseCategory records

Client wants Inventory but no Purchasing
→ enable Inventory only
```

Do not write code when configuration is enough.

Code should be reserved for reusable behavior, not one-off preference.

---

# 6. Principle 3 — Reuse Before Build

Before creating anything new, check what already exists.

Ask:

```txt
Is there an existing Business Object?
Is there an existing module?
Is there an existing setting?
Is there an existing component?
Is there an existing service helper?
Is there an existing generator output pattern?
```

Incorrect:

```txt
Create CRMCustomer table because CRM needs customers.
Create LeaveEmployee table because Leave needs employees.
Create InventoryWarehouse table because Inventory needs warehouses.
```

Correct:

```txt
CRM uses Customer.
Leave uses Employee.
Inventory uses Warehouse.
```

OneDayOS gains speed by reusing known platform parts, not by reinventing them in every module.

---

# 7. Principle 4 — Module Before Fork

If configuration is not enough, the next question is:

```txt
Is this a clean module or module enhancement?
```

A new business capability should usually become:

```txt
src/modules/[moduleId]
```

not:

```txt
src/clients/acme/custom-app
src/modules/inventory/acme-special-case
client-specific branch
client-specific repo
```

A module can start with one client.

That is acceptable.

But it must still be written as a module:

```txt
manifest
permissions
routes
APIs
services
events
schemas
tests
AI context
module documentation
```

The first client may fund the first version of a module.

The platform should own the module pattern.

---

# 8. Principle 5 — Business Object Before Duplicate Entity

If a request involves a common real-world business entity, check whether it is a Business Object.

Current shared Business Objects include:

```txt
Employee
Product
ProductCategory
Customer
Supplier
Warehouse
```

Kernel org-structure primitives include:

```txt
Organization
Branch
Department
User
Role
Permission
```

A module must not duplicate shared entities.

Incorrect:

```txt
InventoryProduct
CRMCustomer
LeaveEmployee
PurchasingSupplier
AssetWarehouse
```

Correct:

```txt
Product + InventoryProductExtension
Customer + CrmCustomerProfile
Employee + LeaveRequest
Supplier + PurchasingSupplierProfile
Warehouse + StockBalance
```

This principle is one of the most important reasons OneDayOS can feel like a real business operating system instead of a set of disconnected apps.

---

# 9. Principle 6 — Extension Table Before Core-Field Pollution

Business Objects should remain minimal.

A field belongs in a core Business Object only when it is genuinely useful across independent modules.

If a field is module-specific, it belongs in a module-owned extension table.

Example:

```txt
Product
  id
  orgId
  code
  name
  description
  categoryId
  unit

InventoryProductExtension
  productId
  orgId
  reorderPoint
  minimumStock
  maximumStock
  stockPolicy

PurchasingProductProfile
  productId
  orgId
  preferredSupplierId
  defaultPurchaseUnit
  leadTimeDays
```

Do not add fields to `Product` just because Inventory wants them.

Incorrect:

```txt
Product.reorderPoint
Product.preferredSupplierId
Product.defaultSellingPrice
Product.lastPurchaseCost
```

Correct:

```txt
Inventory owns inventory-specific fields.
Purchasing owns purchasing-specific fields.
Sales owns sales-specific fields.
```

Promotion to the core Business Object requires evidence, review, migration plan, tests, and likely an ADR.

---

# 10. Principle 7 — Evidence Before Abstraction

Do not build generic engines too early.

This applies to:

```txt
Approval Engine
Notification Service
Attachment Service
Comments Service
Activity Feed
Reporting Service
Search Service
Background Jobs
Dynamic Form Engine
Dynamic CRUD Engine
Dynamic Table View Engine
Workflow Engine
Custom Fields
AI Query Layer
```

The rule is:

```txt
One use case → keep it local.
Two use cases → align patterns and log evidence.
Three independent use cases → review for platform promotion.
```

Three independent use cases trigger review, not automatic implementation.

This prevents OneDayOS from building a heavy ERP engine before the market proves what the product actually needs.

---

# 11. Principle 8 — Security Before Speed

OneDayOS is a shared multi-tenant platform.

Therefore:

```txt
a tenant bug is a business-threatening bug
an auth bug is a business-threatening bug
a permission bug is a business-threatening bug
a data export bug is a business-threatening bug
```

Speed does not excuse unsafe architecture.

Required security posture:

```txt
verified PlatformContext
server-derived tenant identity
no client-supplied orgId
tenant-scoped APIs
permission enforcement in APIs and services
non-admin denial tests
two-organization tenant tests
JSON API errors
soft delete for business records
safe event payloads
no secrets in client code
```

A module is not done when the right user can use it.

It is done when the wrong user is safely denied.

---

# 12. Principle 9 — Convention Before Configuration

Configuration is useful, but too much configuration creates chaos.

OneDayOS should prefer strong conventions.

Examples:

```txt
standard module folder structure
standard API route shape
standard permission shape
standard event naming
standard table UI
standard form UI
standard error response shape
standard soft-delete fields
standard module manifest
standard test matrix
```

Only introduce configuration when variation is common and valuable.

Incorrect:

```txt
Every module chooses its own API response shape.
Every module chooses its own table style.
Every module invents its own permission naming.
Every client gets custom labels for every concept.
```

Correct:

```txt
One platform pattern.
Reasonable settings where needed.
Consistent developer and user experience.
```

This is especially important for Claude and generators.

AI-assisted development works best when the pattern is boring, explicit, and repeatable.

---

# 13. Principle 10 — UX Consistency Before Module Individuality

Modules should feel like parts of OneDayOS, not separate apps inside a sidebar.

Inventory, Leave, CRM, Expenses, Assets, Visitors, and Incidents should share:

```txt
layout rhythm
table density
form behavior
empty states
loading states
error states
toasts
motion behavior
icons
permissions behavior
navigation structure
```

A module may have domain-specific workflows, but it should not invent a separate visual language.

Incorrect:

```txt
Inventory looks like a warehouse dashboard template.
CRM looks like a sales SaaS template.
Leave looks like an HR SaaS template.
Expenses looks like an accounting template.
```

Correct:

```txt
Every module feels like OneDayOS.
Each module has domain-specific content inside shared design patterns.
```

This prevents the product from feeling like stitched-together templates.

---

# 14. Principle 11 — Tests Before Trust

No feature, module, generator, API, or platform helper should be trusted just because it works once.

Required tests depend on the subsystem, but the general rule is:

```txt
happy path
failure path
auth failure
wrong tenant
missing permission
validation failure
soft-delete behavior
event emission
forbidden import checks
generated output safety
```

For tenant-sensitive work:

```txt
single-org tests are insufficient
admin-only tests are insufficient
```

Every serious bug must create regression protection.

Testing should make OneDayOS faster over time because Claude and humans can change the platform with confidence.

---

# 15. Principle 12 — Productization After Every Delivery

Yes, OneDayOS should have reusable module enhancement after every project.

But it must be disciplined.

After every client delivery, perform a productization review.

The question is not:

```txt
What did this client ask for?
```

The question is:

```txt
What did this delivery teach us that should improve the reusable platform?
```

Possible outcomes:

```txt
1. No product change needed.
2. Documentation improvement.
3. Configuration preset improvement.
4. Design-system improvement.
5. Module bug fix.
6. Reusable module enhancement.
7. New module candidate.
8. Platform Service evidence log entry.
9. Generator improvement.
10. Test coverage improvement.
11. AppCare/support process improvement.
12. Commercial pricing/scope adjustment.
```

Every project should feed the platform.

But not every project should add code.

---

# 16. Reusable Module Enhancement Loop

The reusable module enhancement loop is:

```txt
Client delivery
  ↓
Delivery retrospective
  ↓
Classify requests and friction
  ↓
Identify reusable improvement candidates
  ↓
Update module spec or backlog
  ↓
Implement as shared module enhancement
  ↓
Add tests
  ↓
Update documentation
  ↓
Deploy to shared platform
  ↓
Expose via settings / permissions / feature flags where needed
```

This is how OneDayOS compounds.

Example:

```txt
Client A uses Inventory and asks for product reorder point.
```

Decision:

```txt
Reorder point is Inventory-specific.
Add to InventoryProductExtension, not Product.
```

Then:

```txt
update Inventory spec
add migration
add service logic
add table column
add form field
add tests
update docs
ship to platform
```

Now future Inventory clients benefit.

But Product remains clean.

---

# 17. Enhancement Classification

Every post-project improvement should be classified before implementation.

| Classification | Meaning | Action |
|---|---|---|
| Bug | Existing promised behavior is broken | Fix, test, deploy |
| Documentation gap | Feature exists but is unclear | Improve docs/training |
| Configuration preset | Reusable setup pattern | Add default/preset |
| Module enhancement | Reusable improvement inside one module | Update module spec, implement, test |
| Module extension | One module needs extra fields around a Business Object | Add extension table/fields |
| New module candidate | Independent business capability | Write module spec first |
| Platform Service evidence | Repeated cross-module capability emerging | Add evidence log entry |
| Design-system improvement | Reusable UI/UX improvement | Update design docs/components |
| Generator improvement | Repeated code pattern | Update generator templates/tests |
| Custom/premium request | Valuable but not broadly reusable | Price separately or defer |
| Bad-fit request | Too risky or outside strategy | Reject or refer out |

This classification prevents emotional product decisions.

A client asking loudly does not automatically make a feature reusable.

---

# 18. Examples of Reusable Module Enhancement

## Example 1 — Inventory client asks for low-stock highlight

Request:

```txt
Can low-stock products be highlighted in red?
```

Classification:

```txt
Reusable Inventory enhancement.
```

Action:

```txt
Add reorder threshold field to InventoryProductExtension.
Add table badge.
Add service query.
Add tests.
Add event later if needed.
Do not build Notification Service yet.
```

Why:

```txt
This improves Inventory generally.
It does not require a Platform Service.
```

## Example 2 — Leave client asks for department approver

Request:

```txt
Leave requests should go to department heads.
```

Classification:

```txt
Potential reusable Leave enhancement.
Module-local approval rule.
```

Action:

```txt
Add Leave module setting for approval mode.
Use Employee/Department relationship.
Do not build Platform Approval Workflow Service yet.
Log as approval use case evidence.
```

Why:

```txt
Only Leave needs it for now.
```

## Example 3 — Expenses client asks for receipt upload

Request:

```txt
Can employees upload receipt photos?
```

Classification:

```txt
Attachment use case evidence.
Potential module-local or deferred feature.
```

Action options:

```txt
If necessary for paid scope: implement module-local controlled upload with founder approval.
If not necessary: defer until Attachment Service evidence grows.
Log evidence for future Attachment Service.
```

Why:

```txt
Files introduce storage, security, backup, and privacy complexity.
Do not casually build generic Attachment Service from one request.
```

## Example 4 — CRM client asks for WhatsApp integration

Request:

```txt
Can leads automatically receive WhatsApp messages?
```

Classification:

```txt
Integration / premium request.
Not standard module enhancement.
```

Action:

```txt
Defer or quote separately.
Do not add generic messaging service.
Do not add provider integration casually.
```

Why:

```txt
External integrations add cost, secrets, deliverability, compliance, support burden, and failure modes.
```

## Example 5 — Trucking client asks for fleet maintenance

Request:

```txt
We need trucks, odometer logs, fuel logs, and maintenance schedules.
```

Classification:

```txt
New draft module candidate: Fleet.
```

Action:

```txt
Write Fleet Module Specification.
Use Employee for drivers.
Use Supplier for service providers.
Create Vehicle/FuelLog/MaintenanceRecord as module-owned entities.
Enable only for this client first.
Do not fork the platform.
```

Why:

```txt
This is a coherent business capability outside current modules.
A new module is cleaner than forcing it into Assets or Expenses.
```

---

# 19. Productization Review After Every Project

Every delivery should end with a short internal review.

Required questions:

```txt
1. What did the client request that we did not have?
2. Which requests were solved by configuration?
3. Which requests required code?
4. Which code should become reusable?
5. Which code was too client-specific?
6. Did we duplicate any Business Object accidentally?
7. Did we create any module-specific field that belongs in an extension table?
8. Did any capability appear that may become a Platform Service later?
9. Did the generator fail to scaffold something we repeated manually?
10. Did the design system lack a component or pattern?
11. Did tests catch the dangerous cases?
12. Did AppCare receive new recurring burden?
13. Should pricing/scope change for the next similar client?
```

The output should be a small review note:

```md
# Delivery Productization Review — [Client Name]

## Delivery Summary

## Reusable Improvements Found

## Module Enhancements Proposed

## Platform Service Evidence

## Generator Improvements

## Design System Improvements

## Support / AppCare Lessons

## Pricing / Scope Lessons

## Decisions

## Follow-up Tasks
```

This review should be short but consistent.

The goal is not bureaucracy.

The goal is compounding learning.

---

# 20. When a Reusable Enhancement Should Be Built

A reusable module enhancement should usually be built when:

```txt
it fits the module's purpose
it benefits future clients
it does not pollute Business Objects
it does not require deferred Platform Services prematurely
it can be controlled by settings/permissions if not universal
it has a clear data model
it has a clear UI pattern
it can be tested
it does not create large AppCare burden
```

A reusable enhancement should not be built when:

```txt
it only makes sense for one client's unusual process
it adds complex workflow rules without repeated evidence
it requires an integration not commercially justified
it stores sensitive data without security review
it adds infrastructure burden beyond AppCare economics
it turns a module into a different product
it makes the UI worse for most users
it requires hidden per-client code paths
```

Reusable does not mean universally visible.

A feature can exist in the shared platform but be gated by:

```txt
module settings
feature flags
subscription plan
role permissions
workflow state
client configuration
```

---

# 21. Productization and Existing Clients

When a reusable enhancement is deployed, it becomes part of the shared OneDayOS platform.

But it should not necessarily disrupt all existing clients.

There are three rollout modes:

## 21.1 Always-on improvement

Use for safe improvements.

Examples:

```txt
faster table loading
better empty states
security fixes
bug fixes
accessibility improvements
form validation clarity
```

Existing clients get the improvement automatically.

## 21.2 Configuration-gated improvement

Use when the feature may not fit every client.

Examples:

```txt
Inventory reorder thresholds
Leave balance tracking
Expense approval mode
CRM follow-up reminders
```

The code ships to the platform, but each organization chooses or is configured into the behavior.

## 21.3 Permission-gated improvement

Use when only some roles should access it.

Examples:

```txt
export reports
approve leave
void purchase receipts
mark expense paid
restore deleted records
```

The feature exists, but access depends on roles and permissions.

## 21.4 Beta-gated improvement

Use when the feature is reusable but not fully proven.

Examples:

```txt
new module dashboard
new reporting view
new import script
new workflow action
```

Expose to selected organizations first.

Do not use beta flags as a substitute for client-specific forks.

---

# 22. Productization Does Not Mean Free Custom Work

If a client funds a feature, OneDayOS may still productize it.

That is normal.

The client pays for priority, delivery, and business value.

OneDayOS retains the right to make the improvement reusable unless the contract says otherwise.

This should be clear in commercial terms.

Do not create a business expectation that:

```txt
Client-funded feature = private code forever.
```

The default should be:

```txt
Client-funded enhancement may become part of the shared OneDayOS platform.
```

Private/dedicated/custom ownership should be premium and explicit.

---

# 23. Principle 13 — AppCare Sustainability Before Feature Promises

Every product decision affects AppCare.

Before saying yes, ask:

```txt
Will this increase monthly support burden?
Will this require monitoring?
Will this create backup/restore complexity?
Will this create security risk?
Will this require external provider support?
Will this create per-client troubleshooting?
Will this require manual monthly work?
Will it still be profitable at ₱3,500/month?
```

A feature is not only an implementation cost.

It is a maintenance obligation.

This matters especially for:

```txt
file uploads
email/SMS/WhatsApp integrations
background jobs
AI features
custom reports
imports/exports
customer portals
public forms
approval workflows
scheduled notifications
```

If AppCare cannot support it economically, it should be premium, deferred, simplified, or rejected.

---

# 24. Principle 14 — AI Accelerates Architecture; AI Does Not Invent Architecture

AI should help OneDayOS move faster.

AI should not decide what OneDayOS is.

Allowed:

```txt
Claude implements frozen documents.
Claude fills in module code from approved module specs.
Claude writes tests from approved acceptance criteria.
Claude fixes bugs with regression tests.
Claude improves generator templates from approved contracts.
Claude drafts documentation from approved architecture.
```

Not allowed:

```txt
Claude invents a new tenancy model.
Claude adds FastAPI because it feels useful.
Claude creates per-client infrastructure.
Claude implements deferred Platform Services from roadmap names.
Claude duplicates Business Objects inside modules.
Claude accepts client-supplied orgId.
Claude creates runtime AI features without approval.
Claude changes module boundaries to finish faster.
```

The Engineering Manual exists so AI can implement faster without making architectural decisions.

---

# 25. Principle 15 — Founder Review Before High-Risk Commitments

Some requests require founder/architect review before they are promised or implemented.

High-risk categories include:

```txt
healthcare or medical records
payroll
government IDs
tax/accounting automation
financial approvals above simple workflows
external payment integrations
public portals
customer-facing forms
file uploads involving sensitive documents
AI access to business data
cross-module reporting
background jobs
multi-org users
dedicated infrastructure
client-owned Supabase/Vercel
third-party messaging integrations
large imports/migrations
custom workflow engines
```

The rule is:

```txt
If a request could change security, operations, compliance, pricing, or architecture, stop and review.
```

Do not let sales pressure or delivery speed turn high-risk work into casual implementation.

---

# 26. Request Classification Flow

Every request should pass through this flow:

```txt
1. Is it already available?
   → Use existing feature.

2. Can it be configured?
   → Configure it.

3. Does it belong to an existing module?
   → Add module enhancement or extension.

4. Does it involve a shared Business Object?
   → Use or extend the Business Object properly.

5. Is it an independent business capability?
   → Write new module specification.

6. Is it a repeated cross-module capability?
   → Add Platform Service evidence.

7. Is it high-risk or operationally expensive?
   → Founder review / premium scope / defer.

8. Is it not aligned with OneDayOS?
   → Reject.
```

This classification should happen before Claude receives implementation instructions.

---

# 27. Product Principles for Planned Modules

## Inventory

Inventory should focus on:

```txt
stock balances
stock movements
stock adjustments
inventory-specific product settings
warehouse stock visibility
```

Inventory should not own:

```txt
Product
Warehouse
Supplier
Purchasing
Accounting
Notifications
Attachments
```

## Leave

Leave should focus on:

```txt
leave types
leave requests
module-local approval
leave balances if configured
```

Leave should not own:

```txt
Employee
Payroll
Attendance
Platform Approval Engine
Notifications
```

## CRM

CRM should focus on:

```txt
customer relationship data
opportunities
pipeline stages
follow-ups
```

CRM should not own:

```txt
Customer identity
Billing
Support
Marketing automation
Notifications
AI sales assistant
```

## Purchasing

Purchasing should focus on:

```txt
purchase requests
purchase orders
goods receipts as documents
module-local approval
```

Purchasing should not own:

```txt
Supplier
Product
Warehouse
Inventory stock posting by default
Accounts Payable
Platform Approval Engine
```

## Expenses

Expenses should focus on:

```txt
expense claims
expense lines
expense categories
module-local approval
payment markers
```

Expenses should not own:

```txt
Employee
Payroll
Accounting ledger
Attachment Service
AI receipt extraction
```

## Assets

Assets should focus on:

```txt
asset records
asset assignments
asset maintenance records
asset lifecycle status
```

Assets should not own:

```txt
Employee
Supplier
Warehouse
Inventory
Purchasing
Accounting depreciation
```

## Visitor Management

Visitor Management should focus on:

```txt
visitor identity within the module
visit check-in/check-out
host employee
visit destination
```

Visitor Management should not own:

```txt
Employee
Access control hardware
ID scanning
photo attachments
notifications
AI receptionist
```

## Incident Reporting

Incident Reporting should focus on:

```txt
incident records
incident categories
assignment
resolution
corrective actions
closure
```

Incident Reporting should not own:

```txt
Employee
Attachment Service
Comments Service
Activity Feed
Workflow Engine
AI incident analysis
```

---

# 28. Product Principles for New Modules

New modules are allowed.

The planned module list is not final.

But every new module must pass these tests:

```txt
Does it represent a coherent business capability?
Can it be named generically?
Can it serve future clients?
Does it avoid duplicating Business Objects?
Does it avoid importing other modules?
Does it use SDK and PlatformContext?
Does it have a clear manifest, permissions, routes, APIs, services, events, tests, and docs?
Can it be enabled only for the client that needs it first?
Does it avoid secretly implementing deferred Platform Services?
```

A module can be born from one client.

A client-specific fork should not.

Example accepted module candidate:

```txt
Fleet
Reservations
Projects
Service Tickets
Production Jobs
Quality Checks
Training Records
Room Booking
```

Example bad module candidate:

```txt
AcmeCustomSystem
JuanInventorySpecial
ClientBLeaveVariant
EverythingModule
CustomFieldsEngine
UniversalWorkflowBuilder
```

Names reveal architecture.

If the module name contains the client name, the product decision is probably wrong.

---

# 29. Product Principles for Platform Services

Platform Services must not be built because they sound useful.

They should be built because repeated module patterns prove they are necessary.

Before building a Platform Service, require:

```txt
three independent use cases
evidence log
clear service boundary
manual document
ADR if architectural
SDK contract
data model
permission model
API behavior
test matrix
migration plan
AppCare impact review
```

Do not build:

```txt
Approval Engine because Leave needs approval once.
Attachment Service because one module wants photos.
Notification Service because one module wants email.
Reporting Service because one client wants a dashboard.
Workflow Engine because workflows sound powerful.
Custom Fields because one client wants extra fields.
```

Do build later when evidence proves the platform needs it.

---

# 30. Product Principles for Design

The product should feel like a premium operating system, not a generated admin panel.

Design principles:

```txt
minimal
calm
fast
data-dense
keyboard-friendly
consistent
businesslike
premium
```

Reject:

```txt
fake dashboards
generic stat-card walls
Bootstrap/admin-template look
module-specific visual styles
client-specific CSS forks
placeholder loading/error states
forms that look like raw database rows
```

Every module should inherit the design system.

Design consistency is part of the product moat.

---

# 31. Product Principles for Delivery

One-day delivery depends on scope discipline.

The default one-day delivery should include:

```txt
client organization setup
users and roles
enabled modules
configuration
basic data loading
smoke testing
training
handover
AppCare activation
```

The default one-day delivery should not include:

```txt
new Platform Services
complex integrations
runtime AI
file systems
advanced reports
workflow engines
customer portals
large messy migrations
dedicated infrastructure
client-specific forks
```

If a client needs something beyond standard one-day scope, classify and price it.

Do not silently absorb it.

---

# 32. Product Principles for Pricing

Architecture and pricing must reinforce each other.

If a request is reusable and light:

```txt
consider including it as module improvement
```

If a request is reusable but substantial:

```txt
quote as module enhancement or premium package
```

If a request is one-off:

```txt
quote custom work or reject
```

If a request increases monthly operations burden:

```txt
adjust AppCare or require premium plan
```

If a request requires dedicated infrastructure:

```txt
price as enterprise/dedicated deployment
```

Do not let low setup price create unlimited engineering obligation.

---

# 33. Anti-Patterns

## 33.1 Client Fork

```txt
Create a separate app for one client.
```

Usually rejected.

## 33.2 Module Pollution

```txt
Add CRM fields directly to Customer.
Add Inventory fields directly to Product.
Add Leave fields directly to Employee.
```

Rejected unless evidence supports promotion.

## 33.3 Platform Service Prematurity

```txt
Build Notification Service because one module wants an alert.
```

Rejected.

## 33.4 Generic Engine Fantasy

```txt
Build universal workflow/custom fields/dynamic CRUD before real modules stabilize.
```

Rejected.

## 33.5 Client-Specific Settings Explosion

```txt
Add hundreds of obscure switches to satisfy one client.
```

Rejected.

## 33.6 Hidden Custom Code Path

```txt
if (org.slug === 'acme') { special behavior }
```

Rejected.

Use settings, module configuration, feature flags, or proper module design.

## 33.7 AI as Product Shortcut

```txt
Let AI generate the module live from client prompt.
```

Rejected.

AI can assist implementation from approved specs, not invent production architecture.

---

# 34. Decision Checklist

Before approving a product change, answer:

```txt
[ ] Is this configuration, module enhancement, new module, Platform Service, or custom work?
[ ] Does this fit OneDayOS vision?
[ ] Does this preserve shared platform architecture?
[ ] Does this avoid client-specific forks?
[ ] Does this reuse existing Business Objects?
[ ] Does this avoid core Business Object pollution?
[ ] Does this require new permissions?
[ ] Does this require tenant-sensitive tests?
[ ] Does this affect AppCare burden?
[ ] Does this require a migration?
[ ] Does this require feature gating?
[ ] Does this require an ADR?
[ ] Does this require founder review?
[ ] Should this update a generator?
[ ] Should this update documentation/training?
```

If these questions cannot be answered, the product change is not ready for Claude.

---

# 35. Claude Implementation Rules

Claude must follow these product principles when implementing.

Claude must not:

```txt
create client-specific forks
add hidden org-specific code paths
duplicate Business Objects
add module-specific fields to core Business Objects without approval
implement deferred Platform Services
implement Dynamic Systems from roadmap names
add FastAPI or Python services
accept client-supplied orgId
use sdk.getDb(orgId)
bypass PlatformContext
bypass permissions
create generic engines prematurely
invent product scope
```

Claude must:

```txt
ask for or use an approved manual document
use module specs
use PlatformContext
use sdk.getDb(ctx)
use tenant-scoped APIs
reject client-supplied orgId
write tests
respect design system
update documentation when behavior changes
stop when architecture is ambiguous
```

Implementation prompt reminder:

```md
You are implementing a OneDayOS product/module/platform change.

Authoritative documents:
- [list frozen docs]

Rules:
- Do not invent architecture.
- Do not create client-specific forks.
- Classify the request before implementation.
- Reuse Business Objects.
- Use extension tables for module-specific fields.
- Use PlatformContext.
- Use sdk.getDb(ctx).
- Reject client-supplied orgId.
- Enforce permissions in APIs and services.
- Add tenant and permission tests.
- Stop if scope is ambiguous.
```

---

# 36. Founder Operating Rules

The founder should use these rules during sales, discovery, delivery, and support.

## 36.1 Say yes to outcomes, not implementation details

Client says:

```txt
Can you make my inventory easier to monitor?
```

Good response:

```txt
Yes, we can configure and improve inventory visibility within the Inventory module.
```

Avoid promising:

```txt
Yes, we will build custom notifications, dashboards, and mobile alerts tomorrow.
```

## 36.2 Avoid promising Platform Services by accident

Client says:

```txt
Can it notify everyone automatically?
```

Safe response:

```txt
We can review notification needs. Basic module-level status visibility may be included; automated notifications may require a future enhancement depending on scope.
```

## 36.3 Turn repeated requests into product backlog

If three clients ask for the same thing, that is valuable.

Do not treat it as annoyance.

Treat it as evidence.

## 36.4 Protect AppCare economics

If a request creates monthly manual labor, it must be priced or simplified.

---

# 37. Relationship to Reusable Module Enhancements

Reusable module enhancement is not optional.

It is the business engine of OneDayOS.

The long-term product improves through this loop:

```txt
client need
→ delivery
→ learning
→ classification
→ reusable enhancement
→ module maturity
→ faster future delivery
→ lower support burden
→ better margins
```

But the loop must be disciplined.

Do not confuse:

```txt
client-specific request
```

with:

```txt
product-worthy improvement
```

The founder and architect must decide.

Claude must implement only after the decision is clear.

---

# 38. Acceptance Criteria

This document is acceptable when:

```txt
[ ] It clearly explains OneDayOS product decision principles.
[ ] It distinguishes configuration, customization, modules, Platform Services, and custom work.
[ ] It defines reusable module enhancement after every project.
[ ] It prevents client-specific forks.
[ ] It protects Business Object boundaries.
[ ] It reinforces the Three Independent Use Cases Rule.
[ ] It connects product decisions to AppCare sustainability.
[ ] It gives concrete examples of request classification.
[ ] It gives Claude clear implementation boundaries.
[ ] It gives the founder practical sales/delivery decision rules.
```

---

# 39. Summary

OneDayOS should become easier to build after every client.

That only happens if client work is productized deliberately.

The correct product rhythm is:

```txt
Configure first.
Enhance modules when reusable.
Create new modules when the capability is coherent.
Promote Platform Services only with evidence.
Reject or price custom work when it does not fit.
Never fork casually.
```

The final product rule is:

```txt
Every client project should teach the platform something.
Only the reusable lessons should become the platform.
```
