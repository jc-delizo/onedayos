# OneDayOS Engineering Manual — Client Discovery

**Document ID:** `16-client-delivery/01-client-discovery.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before First Paid Client Delivery`  
**Owner:** Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `05-sdk/00-sdk-overview.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/00-module-philosophy.md`
- `10-platform-services/01-three-client-rule.md`
- `16-client-delivery/00-one-day-delivery-playbook.md`

---

# 1. Purpose

This document defines how OneDayOS conducts client discovery before accepting, scoping, configuring, or building a client delivery.

Client Discovery is the process that decides whether a request should become:

```txt
configuration
existing module setup
module extension
new draft module
future reusable module
future Platform Service candidate
premium custom work
or rejected scope
```

Discovery protects the platform from becoming a collection of bespoke apps.

It also protects the founder from accidentally selling work that cannot be delivered in one business day.

---

# 2. Core Principle

```txt
Discovery is not requirements gathering for custom software.
Discovery is fit assessment for a shared platform.
```

A typical software agency asks:

```txt
What do you want us to build?
```

OneDayOS asks:

```txt
Which parts of your business fit the platform,
which parts need configuration,
which parts should become modules,
and which parts should not be promised in one day?
```

---

# 3. Why Discovery Matters

OneDayOS promises fast delivery because the platform is standardized.

The danger is not technical difficulty alone.

The real danger is accepting vague, custom, or high-risk work and pretending it fits the one-day model.

Bad discovery creates:

```txt
custom forks
messy client-specific logic
duplicated Business Objects
unpriced support burden
unbounded AppCare expectations
rushed Platform Services
fragile module code
security exceptions
missed integrations
wrong data models
manual work hidden behind "automation"
```

Good discovery creates:

```txt
clear scope
module fit
known exclusions
configured roles
clean data requirements
handover plan
AppCare boundaries
implementation-ready tasks
no surprises for Claude
```

---

# 4. Discovery Output

A discovery call is not complete until it produces a written **Client Discovery Brief**.

The brief must answer:

```txt
Who is the client?
What business process do they want to improve?
Which module or modules fit?
What data is needed?
Who are the users?
What permissions are needed?
What must be delivered on day one?
What is explicitly excluded?
What is AppCare responsible for?
What needs founder/architect review?
```

No client delivery should begin from memory or chat notes alone.

---

# 5. Discovery Is a Gate

Discovery must happen before:

```txt
client quote finalization
one-day delivery commitment
Claude implementation prompt
module creation
database migration
client provisioning
AppCare activation
```

A client request that is not discovered is not ready to build.

---

# 6. What Discovery Is Not

Discovery is not:

```txt
unlimited consulting
free process redesign
custom ERP analysis
data cleanup service
integration design workshop
AI automation brainstorming
guarantee that all requests fit OneDayOS
approval to build new Platform Services
approval to create client-specific forks
```

The purpose is to decide what can be delivered safely and repeatably.

---

# 7. Discovery Timebox

For normal SME one-day delivery, discovery should be timeboxed.

Recommended structure:

```txt
15 minutes — business context
20 minutes — workflow walkthrough
15 minutes — users, roles, permissions
15 minutes — data and reports
15 minutes — module fit and scope boundaries
10 minutes — next steps and exclusions
```

Total:

```txt
60–90 minutes
```

If discovery requires several days of analysis, the client likely needs:

```txt
premium scoping
custom module planning
enterprise engagement
or deferral
```

---

# 8. Pre-Discovery Qualification

Before the main discovery call, confirm these basics.

## 8.1 Client Profile

Ask:

```txt
Company name?
Industry?
Number of employees?
Number of branches?
Current process?
Current tools?
Number of expected users?
Urgency?
Budget expectation?
Decision-maker?
```

## 8.2 OneDayOS Fit

Good early-fit signals:

```txt
manual spreadsheet process
repeated internal workflow
SME with simple approval structure
needs internal tracking
does not require deep integration on day one
can accept standard workflow first
has clean enough starting data
```

Weak fit signals:

```txt
requires complex accounting replacement
requires regulated healthcare/financial workflows
requires real-time IoT/hardware integration
requires offline-first mobile app
requires many external integrations immediately
expects fully custom UI/workflow for cheap
wants to own infrastructure at low price
cannot define the process clearly
```

## 8.3 Budget Fit

If the client expects:

```txt
"full custom enterprise system"
```

for:

```txt
₱20,000 initial + ₱3,500/month
```

expectation-setting is required before technical discovery.

---

# 9. Discovery Call Structure

## 9.1 Opening Script

Use this framing:

```txt
OneDayOS is a shared business operating system.
We do not build one-off apps for every client.
We configure and extend a standard platform.
The goal today is to identify what fits the one-day delivery scope,
what should be phased later,
and what should not be promised as part of the initial build.
```

This sets expectations early.

---

## 9.2 Business Context Questions

Ask:

```txt
What does your business do?
Which department will use this first?
What problem are you trying to solve?
Why now?
What happens today when this process fails?
Who owns this process?
How many people are involved?
How often does this process happen?
What are you using now?
What is painful about the current process?
What would success look like after one week?
```

Capture:

```txt
business process
frequency
pain intensity
operational value
decision-maker
first department
expected usage volume
```

---

## 9.3 Current Workflow Walkthrough

Ask the client to walk through the actual process.

Use prompts:

```txt
Start from the beginning.
What triggers the process?
Who creates the record?
What information do they enter?
Who reviews it?
Who approves it?
What happens after approval?
What can go wrong?
What reports do you need after?
```

Document as:

```txt
Trigger
Input
Actors
Steps
Decisions
Outputs
Exceptions
Reports
```

Example:

```txt
Process: Leave request
Trigger: Employee wants time off
Input: dates, leave type, reason
Actors: employee, manager, HR
Decision: manager approves or rejects
Output: leave record, balance update
Exception: insufficient leave credits
Report: monthly leave summary
```

---

# 10. Module Fit Assessment

Discovery must classify the request into one of these categories.

## 10.1 Existing Module Fit

The request fits an existing planned or built module.

Examples:

```txt
stock tracking → Inventory
leave requests → Leave
sales pipeline → CRM
expense claims → Expenses
asset assignment → Assets
visitor log → Visitor Management
incident reports → Incident Reporting
purchase requests → Purchasing
```

Action:

```txt
Use existing module spec.
Configure settings.
Load data.
Set permissions.
Do not create new module.
```

---

## 10.2 Existing Module with Extension

The request mostly fits an existing module but needs additional module-specific fields or behavior.

Example:

```txt
Inventory product needs "reorder point" and "preferred supplier"
```

Correct classification:

```txt
Product remains Business Object.
Inventory-specific fields go in InventoryProductExtension.
```

Action:

```txt
Use extension table.
Do not add fields to core Product unless repeated independent use cases prove it.
```

---

## 10.3 New Draft Module

The request is a distinct reusable business capability.

Example:

```txt
Fleet Management for trucking companies
```

Possible module-owned entities:

```txt
Vehicle
FuelLog
OdometerLog
MaintenanceSchedule
VehicleAssignment
```

Shared Business Objects used:

```txt
Employee → drivers
Supplier → repair shops / fuel providers
Warehouse or Branch → locations, if needed
```

Action:

```txt
Create new draft module spec.
Do not fork the platform.
Use module generator.
Enable only for the client that needs it.
Log evidence for future reuse.
```

---

## 10.4 Platform Service Candidate

The request is not a business module but a reusable cross-cutting capability.

Examples:

```txt
comments on many record types
file attachments across modules
approval workflow across modules
notifications across modules
global search
activity timeline
```

Action:

```txt
Do not immediately build Platform Service.
Check evidence log.
If fewer than three independent use cases exist, keep behavior module-local or defer.
```

---

## 10.5 Bad-Fit Custom Request

The request is too client-specific, too vague, too risky, or too expensive for the standard offer.

Examples:

```txt
"Make it exactly like our spreadsheet, every column and formula."
"Build a custom payroll system with Philippine compliance in one day."
"Integrate with five external systems immediately."
"Let our customers log in and pay online by tomorrow."
"Build us a mobile app with offline mode."
```

Action:

```txt
Reject from one-day scope.
Offer paid scoping or custom quote only if strategically worth it.
```

---

# 11. Request Classification Decision Tree

Use this decision tree:

```txt
Client request
  ↓
Can it be solved with existing settings/configuration?
  → yes: configure
  ↓ no
Does an existing module already handle the main workflow?
  → yes: use that module
  ↓ no
Is it a small module-specific field or behavior?
  → yes: extension table or module-local logic
  ↓ no
Is it a distinct reusable business capability?
  → yes: new draft module
  ↓ no
Is it repeated across three independent use cases?
  → yes: Platform Service proposal
  ↓ no
Is it high-risk or very client-specific?
  → yes: reject, defer, or quote custom
```

---

# 12. Business Object Discovery

Discovery must identify which shared Business Objects are involved.

Ask:

```txt
Does this workflow involve employees?
Does it involve customers?
Does it involve suppliers?
Does it involve products/items?
Does it involve warehouses/storage locations?
Does it involve branches or departments?
```

Classify correctly:

```txt
Employee → Business Object
Customer → Business Object
Supplier → Business Object
Product → Business Object
Warehouse → Business Object
Branch → Kernel org-structure primitive
Department → Kernel org-structure primitive
User → Kernel login identity
Role/Permission → Kernel access control
```

## 12.1 Common Mistakes

Do not allow:

```txt
InventoryProduct as duplicate Product
CRMCustomer as duplicate Customer
LeaveEmployee as duplicate Employee
PurchasingSupplier as duplicate Supplier
```

Correct pattern:

```txt
shared Business Object
+ module-owned extension table
```

---

# 13. User and Role Discovery

Ask:

```txt
Who will use the system?
Who can create records?
Who can view records?
Who can edit records?
Who can delete or deactivate records?
Who can approve?
Who can export?
Who can manage settings?
Who should not see this module?
```

Minimum role output:

```txt
Admin
Manager / Supervisor
Staff / Encoder
Viewer / Read-only, if needed
```

For each module, define:

```txt
read
create
update
delete / deactivate
approve, if applicable
export, if applicable
import, if applicable
manage settings, if applicable
```

## 13.1 Permission Boundary Reminder

Do not assume:

```txt
module enabled = user can access
read = export
create = import
admin = cross-tenant access
UI hidden = secure
```

Permissions must be explicitly defined.

---

# 14. Organization Structure Discovery

Ask:

```txt
How many branches or locations do you have?
Are departments branch-specific or company-wide?
Do employees belong to one branch?
Do employees belong to one department?
Do managers approve only their branch/team?
Do reports need branch or department filters?
```

MVP assumption:

```txt
Organization → Branch → Department
```

Supported variation:

```txt
Department can exist without branch
```

Deferred complexity:

```txt
matrix organizations
multi-branch employee assignments
region hierarchy
branch-scoped RBAC
department-scoped RBAC
multi-org users
```

If the client needs these on day one, escalate.

---

# 15. Data Discovery

Ask:

```txt
What data already exists?
Where is it stored?
Spreadsheet?
Google Sheets?
Excel?
Paper?
Existing software?
How many rows?
Who owns the data?
Is the data clean?
Are there duplicates?
Are required fields missing?
Do you need historical data imported?
What can be entered manually later?
```

## 15.1 Data Classification

Classify data as:

```txt
required for day one
nice-to-have
historical archive
dirty/untrusted
sensitive
not needed
```

## 15.2 Import Scope

For one-day delivery, prefer:

```txt
small clean CSV
manual setup
controlled founder/developer import script
basic seed/provisioning
```

Avoid promising:

```txt
large messy migration
automated data cleanup
Excel formula recreation
multi-source import
two-way sync
historical reconstruction
```

## 15.3 Data Security Questions

Ask:

```txt
Does this include employee personal data?
Customer personal data?
Supplier bank/tax data?
Medical/health data?
Financial records?
Government IDs?
Sensitive documents?
```

High-risk data may require founder/architect review.

---

# 16. Workflow Discovery

For each workflow, capture:

```txt
name
trigger
creator
required fields
optional fields
status lifecycle
approval steps
exceptions
notifications needed
reports needed
data outputs
```

## 16.1 Status Lifecycle

Ask:

```txt
What statuses does this record go through?
Who can change each status?
Can a status be reversed?
What happens when it is cancelled?
What happens when it is rejected?
What happens when it is completed?
```

Example:

```txt
Draft → Submitted → Approved → Completed
Draft → Submitted → Rejected
Submitted → Cancelled
```

## 16.2 Approval Discovery

Ask:

```txt
Is approval needed?
Who approves?
Is it always one person?
Does approval depend on amount, branch, department, or role?
Can approvers delegate?
Can approval be skipped?
Do rejected items go back to draft?
```

Important:

```txt
Do not build Approval Workflow Service just because one module needs approval.
Keep approval module-local until repeated independent use cases prove platform need.
```

---

# 17. Reporting Discovery

Ask:

```txt
What do you need to see daily?
What do you need weekly?
What do you need monthly?
Who reads the report?
Is it on screen or exported?
Do you need CSV export?
Do you need PDF?
Do you need charts?
Do you need summaries by branch/department/status/date?
```

Classify reports:

```txt
simple list filter
module dashboard metric
module-local report
future Reporting Service candidate
custom BI request
```

MVP preference:

```txt
module-local lists and simple filters
```

Do not promise:

```txt
custom BI dashboards
scheduled email reports
pivot tables
cross-module analytics
AI-generated reports
```

unless explicitly scoped later.

---

# 18. Search Discovery

Ask:

```txt
What records do users need to find quickly?
Search by name?
Search by code?
Search by date?
Search by status?
Search across modules?
```

MVP preference:

```txt
module-local search/filter
Business Object lookup
```

Do not promise:

```txt
global search
semantic search
AI search
cross-module search
```

unless the Search Service has been promoted later.

---

# 19. Notification Discovery

Ask:

```txt
Who needs to be alerted?
When?
Inside the app?
Email?
SMS?
Is it required on day one?
What happens if no notification is sent?
```

MVP preference:

```txt
visible status/dashboard/list
manual communication
module-local simple indication
```

Do not promise full Notification Service unless promoted later.

---

# 20. Attachment Discovery

Ask:

```txt
Do users need to upload files?
What type of files?
Photos?
Receipts?
PDFs?
Contracts?
IDs?
How many per month?
Who can view/download them?
Are they sensitive?
Are files required on day one?
```

MVP default:

```txt
Attachments Service is deferred.
Do not promise generic file upload unless explicitly approved.
```

If one module truly needs files:

```txt
require founder/architect approval
define storage/security/backup scope
log as Platform Service evidence
```

---

# 21. Integration Discovery

Ask:

```txt
Does this need to connect to another system?
Accounting?
Payroll?
POS?
E-commerce?
Google Sheets?
Email?
SMS?
Payment gateway?
Barcode scanner?
Biometric device?
```

Classify:

```txt
not needed
manual import/export
future integration
paid custom integration
bad fit for one-day delivery
```

One-day delivery should generally exclude deep integrations.

---

# 22. AI Discovery

Ask carefully:

```txt
Do users expect AI help?
What questions would they ask?
Should AI only explain how to use the module?
Should AI analyze business records?
Should AI create or update records?
```

MVP default:

```txt
No runtime client-facing AI unless explicitly implemented later.
AI-assisted development is allowed.
AI support/documentation can come later.
```

Do not promise:

```txt
AI assistant
AI reports
AI search
AI SQL
AI workflow automation
AI data mutation
```

without separate future architecture approval.

---

# 23. Sensitive / Regulated Domain Discovery

Some domains require extra caution.

Examples:

```txt
healthcare / clinics / dental
finance / lending / insurance
payroll / compensation
legal records
government IDs
children/minors data
high-volume payment records
employee discipline cases
security incidents
```

If a request involves sensitive data:

```txt
pause
document risk
escalate to founder/architect review
do not promise one-day delivery casually
```

---

# 24. One-Day Scope Rules

A one-day scope should normally include:

```txt
one client organization
one to two modules
standard roles
standard settings
basic data loading
basic lists/forms
standard module workflows
basic reports/lists
handover and training
AppCare setup
```

A one-day scope should normally exclude:

```txt
new Platform Services
complex integrations
large data migration
custom dashboards
AI runtime features
file uploads
offline mobile apps
customer portals
payment processing
dedicated infrastructure
complex approval engine
multi-branch custom RBAC
custom workflow builder
```

---

# 25. Scope Levels

## 25.1 Green Scope

Safe for one-day delivery.

Examples:

```txt
Enable Inventory for 20 products and 2 warehouses.
Enable Leave module for 15 employees with simple manager approval.
Enable Visitor Log with basic check-in/check-out fields.
```

Characteristics:

```txt
clear process
small data
standard module fit
few users
few roles
no integration
no complex reports
```

---

## 25.2 Yellow Scope

Needs caution or phased delivery.

Examples:

```txt
Inventory plus CSV import of 2,000 products.
Leave module with two-level approval.
CRM with custom pipeline stages and customer import.
Fleet module for first logistics client.
```

Characteristics:

```txt
still possible
needs tighter scope
may require extra fee
may need new draft module
requires founder review
```

---

## 25.3 Red Scope

Reject from one-day delivery.

Examples:

```txt
Complete accounting system replacement.
Payroll with statutory compliance.
Patient medical records with documents.
Multi-system integration with real-time sync.
Offline-first mobile app.
Custom ERP exactly matching their spreadsheet.
```

Characteristics:

```txt
high risk
high support burden
unclear process
regulated/sensitive
needs custom architecture
not one-day productized delivery
```

---

# 26. Client Expectation Setting

Use clear language:

```txt
OneDayOS delivers standard platform modules quickly.
If a request fits the platform, we can deliver fast.
If a request is custom, complex, or risky, we will phase it or quote it separately.
We do not force everything into day one because that creates fragile software.
```

Do not say:

```txt
Yes, we can do anything.
We will customize everything.
No problem, that is included.
Claude can just generate it.
```

---

# 27. Discovery Brief Template

Every discovery should produce a document like this.

```md
# Client Discovery Brief — [Client Name]

## Client Summary
- Company:
- Industry:
- Contact:
- Decision-maker:
- Expected users:
- Branches:
- Departments:

## Business Problem
- Current process:
- Pain points:
- Success criteria:

## Requested Scope
- Requested modules:
- Requested workflows:
- Requested reports:
- Requested integrations:
- Requested data import:

## Module Fit
- Existing module fit:
- Extension needed:
- New draft module needed:
- Platform Service candidate:
- Rejected/deferred requests:

## Business Objects
- Employees:
- Customers:
- Suppliers:
- Products:
- Warehouses:
- Branches:
- Departments:

## Users & Permissions
| Role | Users | Modules | Permissions |
|---|---:|---|---|

## Data
- Source:
- Row counts:
- Cleanliness:
- Required day-one data:
- Deferred historical data:
- Sensitive data:

## Workflows
### Workflow 1: [Name]
- Trigger:
- Creator:
- Steps:
- Statuses:
- Approver:
- Exceptions:
- Output:

## Reports / Views
- Day-one:
- Deferred:

## Exclusions
- Not included in day one:
- Requires separate quote:
- Requires future Platform Service:

## Delivery Plan
- Day-one deliverables:
- Configuration tasks:
- Data tasks:
- Training tasks:
- AppCare setup:

## Risks
- Technical:
- Data:
- Scope:
- Security:
- Commercial:

## Decision
- Accepted for one-day delivery: yes/no
- Requires founder review: yes/no
- Requires custom quote: yes/no
```

---

# 28. Discovery Checklist

Before approving delivery:

```txt
[ ] Client identity confirmed
[ ] Decision-maker confirmed
[ ] First department/use case confirmed
[ ] Requested module(s) identified
[ ] Business Objects identified
[ ] Users and roles identified
[ ] Required permissions identified
[ ] Branch/department structure understood
[ ] Data source identified
[ ] Day-one data scope defined
[ ] Reports/views defined
[ ] Workflow statuses defined
[ ] Approvals clarified
[ ] Integrations clarified
[ ] Attachments clarified
[ ] AI expectations clarified
[ ] Sensitive data risk checked
[ ] Scope exclusions written
[ ] AppCare expectations explained
[ ] One-day feasibility confirmed
[ ] Founder/architect review done if needed
```

---

# 29. Red Flags

Stop and review if the client says:

```txt
"Can you just copy our whole spreadsheet?"
"We need everything customized."
"Our process changes every week."
"We need this connected to all our systems."
"We need payroll compliance."
"We need medical records."
"We need customer payments tomorrow."
"We need our own database but same price."
"We don't know the process yet, just build something."
"We want unlimited changes under maintenance."
```

These are not automatic rejections, but they require scope control.

---

# 30. Commercial Classification

Every request should be classified commercially.

| Classification | Meaning | Action |
|---|---|---|
| Included setup | Fits standard one-day delivery | Include |
| Configuration | Settings, roles, module enablement | Include if small |
| Data loading | Small clean data import/manual entry | Include if scoped |
| Enhancement | Improves existing module | Quote or backlog |
| New draft module | New reusable capability | Quote / founder approval |
| Platform Service candidate | Cross-cutting repeated capability | Evidence log / future |
| Custom work | Client-specific or complex | Separate quote |
| Rejected | Bad fit or too risky | Decline or defer |

---

# 31. How Discovery Feeds Claude

Claude should never receive:

```txt
"Build an app for this client."
```

Claude should receive:

```txt
Use the approved Client Discovery Brief and Module Specification.
Implement only the scoped module/configuration tasks.
Do not invent architecture.
Do not add Platform Services.
Do not create client-specific forks.
Do not bypass PlatformContext, permissions, tenant isolation, or SDK rules.
```

---

# 32. Claude Discovery-to-Implementation Prompt Template

```md
You are implementing a OneDayOS client delivery task.

Authoritative documents:
- Client Discovery Brief: [path]
- Module Specification: [path]
- Engineering Manual sections: [list]

Rules:
- Do not build a separate client app.
- Do not create client-specific infrastructure.
- Do not create Platform Services unless explicitly approved.
- Do not duplicate Business Objects.
- Use existing modules where possible.
- Use extension tables for module-specific fields.
- Use verified PlatformContext.
- Use sdk.getDb(ctx).
- Reject client-supplied orgId.
- Enforce permissions in APIs and services.
- Add or update tests for tenant isolation and permission denial.

Task:
[Specific scoped task]
```

---

# 33. Scenario Examples

## 33.1 Good Fit: Hardware Store Inventory

Client:

```txt
Small hardware store with 3 branches.
Needs product list, warehouses, stock counts, low-stock view.
```

Classification:

```txt
Inventory module
Product Business Object
Warehouse Business Object
Branch Kernel primitive
possibly InventoryProductExtension for reorder point
```

Day-one scope:

```txt
enable Inventory
create branches/warehouses
load products
basic stock list
basic adjustment workflow if already specified
```

Deferred:

```txt
barcode scanning
supplier purchase orders
automatic reorder notifications
full reporting service
```

---

## 33.2 New Draft Module: Trucking Fleet

Client:

```txt
Delivery trucking company needs vehicles, fuel logs, odometer readings, maintenance schedule.
```

Classification:

```txt
new Fleet module
```

Shared objects:

```txt
Employee as driver
Supplier as repair shop/fuel provider
Branch as location
```

Module-owned entities:

```txt
Vehicle
FuelLog
OdometerLog
MaintenanceRecord
VehicleAssignment
```

Action:

```txt
founder approval
write Fleet module spec
create draft module
enable only for this client
log reuse evidence
```

---

## 33.3 Bad One-Day Fit: Dental Clinic Records

Client:

```txt
Dental clinic wants patient records, tooth charts, x-rays, prescriptions, billing, treatment plans.
```

Classification:

```txt
high-risk vertical module
not normal one-day scope
```

Concerns:

```txt
health data
attachments
specialized UI
privacy burden
custom workflows
medical history
possibly regulated/sensitive records
```

Action:

```txt
do not promise one-day delivery
offer paid scoping or decline
requires founder/architect review
```

---

## 33.4 Platform Service Candidate: Attachments

Client A:

```txt
Incident Reporting needs photos.
```

Action:

```txt
module-local or defer; log evidence
```

Client B:

```txt
Expenses needs receipts.
```

Action:

```txt
align pattern; log evidence
```

Client C:

```txt
Assets needs warranty documents.
```

Action:

```txt
now write Attachment Service proposal and ADR
do not build directly inside one module
```

---

# 34. Anti-Patterns

Do not do this:

```txt
build custom app folder for client
create client-specific Prisma models in random places
add client-specific fields to shared Business Objects
create duplicate Employee/Product/Customer tables
add Platform Services during delivery without evidence
accept messy data migration as "included"
promise AI/reporting/search/file uploads without architecture
let Claude decide module boundaries
treat AppCare as unlimited changes
trust the client's requested solution without understanding the workflow
```

---

# 35. Acceptance Criteria

This document is accepted when:

```txt
[ ] Discovery process is clear
[ ] Discovery output template is usable
[ ] Module fit rules are clear
[ ] New module handling is clear
[ ] Platform Service candidate handling is clear
[ ] One-day scope rules are explicit
[ ] Red flags are documented
[ ] User/role/data/workflow discovery questions are complete
[ ] Claude implementation handoff pattern is defined
[ ] Founder can use this before a real sales/client call
```

---

# 36. Final Rule

```txt
Discovery decides whether OneDayOS should configure, extend, modularize, defer, quote separately, or reject.

It does not give permission to build custom apps.
```
