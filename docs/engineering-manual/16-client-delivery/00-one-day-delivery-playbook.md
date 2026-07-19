# OneDayOS Engineering Manual — 16 Client Delivery / 00 One-Day Delivery Playbook

**Document ID:** `16-client-delivery/00-one-day-delivery-playbook.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** Founder / Architect  
**Last Updated:** July 2026  
**Implementation Status:** `Required Before First Paid Client Delivery`  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/*`
- `05-sdk/*`
- `06-data/*`
- `07-business-objects/*`
- `08-module-system/*`
- `09-cli-generators/*`
- `13-security/08-production-readiness-gate.md`
- `14-testing-quality/*`
- `15-deployment-operations/*`

---

# 1. Purpose

This document defines how OneDayOS delivers a usable internal business application to a client in **one business day** without turning the platform into bespoke software.

The one-day delivery promise is not achieved by hacking faster.

It is achieved by:

```txt
standard platform
+ prebuilt Kernel
+ shared Business Objects
+ reusable modules
+ strict scope control
+ configuration over customization
+ generator-assisted development
+ repeatable onboarding process
+ AppCare operations
```

This document is the operating playbook for turning the platform architecture into a repeatable customer delivery motion.

---

# 2. Core Principle

The client does not receive a separate app.

The client receives a configured OneDayOS organization inside the shared OneDayOS platform.

```txt
Wrong mental model:
Client A App
Client B App
Client C App

Correct mental model:
OneDayOS Platform
  ├── Organization: Client A
  ├── Organization: Client B
  ├── Organization: Client C
  └── Organization: Client D
```

A delivery is not a fresh software project.

A delivery is:

```txt
create organization
configure structure
enable modules
configure roles
configure settings
load starting data
train users
activate AppCare
```

If a delivery requires inventing architecture, it is not a one-day delivery.

---

# 3. What “One Business Day” Means

One business day means OneDayOS can deliver a working, scoped, usable system within a normal business-day delivery window after discovery and requirements are locked.

It does not mean:

```txt
unlimited custom development
all requested features included
full process transformation
legacy system migration
complex integrations
custom reports without limits
custom workflows without limits
dedicated infrastructure
regulatory consulting
enterprise implementation
```

One business day means:

```txt
approved scope
approved module set
approved starting data
approved user roles
approved acceptance criteria
standard OneDayOS platform
```

---

# 4. What Can Be Delivered in One Day

A one-day delivery can include:

```txt
one client organization
basic organization profile
branches and departments
users
roles and permissions
1–2 mature modules
basic module settings
basic starting data import
standard dashboards/screens
standard tables/forms
standard AppCare setup
basic user training
handover documentation
```

A one-day delivery may include a **draft module** only if:

```txt
module generator exists
module spec is already written
scope is very small
no new Platform Service is required
no external integration is required
no complex workflow is required
security tests can be completed
```

---

# 5. What Cannot Be Promised in One Day

Do not promise these inside the normal one-day offer:

```txt
custom infrastructure
client-owned Supabase project
client-owned Vercel project
custom mobile app
complex third-party integration
custom workflow engine
custom approval builder
custom report builder
AI chatbot
AI analytics
file attachment system
SMS/email automation
full legacy migration
complex Excel import mapping
payroll computation
accounting compliance
high-risk medical/legal/financial workflows
multi-branch enterprise rollout
multi-company accounting structure
complex role hierarchy
custom UI theme redesign
```

These may be:

```txt
rejected
quoted separately
deferred to AppCare enhancement
turned into a future module
treated as premium/enterprise work
```

---

# 6. Delivery Classification

Every client request must be classified before implementation.

| Request Type | Delivery Decision |
|---|---|
| Fits an existing setting | Configure it |
| Fits an existing module | Enable and configure module |
| Requires module-specific fields | Use module extension table if approved |
| Requires a new reusable business capability | Create new draft module only after spec |
| Requires a repeated cross-module capability | Evidence-log as Platform Service candidate |
| Very client-specific | Quote custom work or reject |
| High-risk / regulated / sensitive | Founder review required |
| Requires deferred Platform Service | Use module-local workaround or defer |
| Requires custom infrastructure | Premium/enterprise only |

The default answer to unusual requests is not “yes.”

The default answer is:

```txt
Classify first.
Then decide.
```

---

# 7. Delivery Model

The standard delivery model is:

```txt
One shared OneDayOS production platform
One shared production database
Client represented as Organization row
Tenant data separated by orgId
Modules enabled through OrgModule
Access controlled through roles and permissions
Settings configured per organization
AppCare operated centrally
```

Normal clients do not receive:

```txt
separate repo
separate deployment
separate Supabase account
separate database
separate schema
separate Vercel project
separate fork
```

Dedicated deployments are deferred premium/enterprise options only.

---

# 8. Required Platform State Before First Delivery

Before the first paid delivery, the following must be true:

```txt
[ ] Vision approved
[ ] Architecture approved
[ ] Layer boundaries approved
[ ] Production readiness gate approved
[ ] Kernel auth implemented
[ ] Tenant isolation implemented
[ ] Permission enforcement implemented
[ ] API JSON error behavior implemented
[ ] SDK server/client split implemented
[ ] Database schema migrated and verified
[ ] Seed/provisioning scripts verified
[ ] Two-org tenant tests passing
[ ] Permission-denial tests passing
[ ] API 401/403/404 tests passing
[ ] App shell stable
[ ] Module enablement stable
[ ] At least one official module production-ready
[ ] Deployment pipeline stable
[ ] Backup plan documented
[ ] Monitoring minimum active
[ ] AppCare checklist ready
```

No client should be onboarded as a second tenant until the Tenant Safety Gate passes.

---

# 9. Pre-Sales Qualification

Before selling a one-day implementation, qualify the client.

## 9.1 Good-fit clients

Good candidates are Philippine SMEs with:

```txt
manual spreadsheet workflows
simple approval chains
basic inventory, HR, CRM, visitor, expense, asset, or project tracking needs
small to medium user count
willingness to adapt to standard workflows
clear owner/decision maker
available starting data
low integration requirements
urgent need for operational visibility
```

## 9.2 Bad-fit clients

Bad candidates include clients who require:

```txt
heavy custom workflows
complex integrations on day one
highly regulated data without premium scope
bespoke UI and branding
large historical data migration
custom accounting logic
custom payroll compliance
custom mobile app
offline-first operation
strict dedicated infrastructure at low price
multiple companies with complex consolidation
```

Bad-fit clients are not necessarily rejected forever.

They may be offered:

```txt
premium implementation
enterprise discovery
custom module roadmap
dedicated deployment
phased rollout
```

But they should not enter the standard one-day delivery lane.

---

# 10. Discovery Call Output

The discovery call must produce a structured delivery brief.

Minimum required outputs:

```txt
client name
business type
main pain point
selected modules
number of users
branches
departments
roles
starting data sources
must-have workflows
nice-to-have workflows
reports needed
training users
go-live owner
AppCare contact
out-of-scope requests
acceptance criteria
```

If these are not clear, implementation should not start.

---

# 11. Discovery Questions

Ask practical questions, not abstract software questions.

## 11.1 Business questions

```txt
What do you track today?
Where do you track it now?
What spreadsheet causes the most pain?
Who updates it?
Who needs to approve or review it?
What mistakes happen often?
What do you need to see every morning?
What report do you send to the owner/manager?
How many users will use the system in month one?
What branches/locations need access?
```

## 11.2 Scope questions

```txt
What must work on day one?
What can wait until AppCare enhancement?
What is currently done manually but can stay manual for now?
What data do you already have in Excel/Google Sheets?
What data can be entered manually after launch?
```

## 11.3 Risk questions

```txt
Do you need file uploads?
Do you need email/SMS notifications?
Do you need approval workflows?
Do you need third-party integrations?
Do you need historical data migration?
Do you handle sensitive health/legal/financial data?
Do you require a dedicated database or infrastructure?
```

Any “yes” in risk questions may affect scope, pricing, or timeline.

---

# 12. Scope Lock

Before implementation begins, scope must be locked.

A locked one-day scope must include:

```txt
selected modules
enabled users
roles
starting data
configuration decisions
acceptance criteria
known limitations
out-of-scope items
handover schedule
```

After scope lock, new requests are classified as:

```txt
configuration tweak
bug
post-launch enhancement
new module request
future Platform Service candidate
out-of-scope custom work
```

Do not accept moving-target scope during the delivery day.

---

# 13. Standard One-Day Timeline

This is the recommended delivery rhythm.

## 13.1 Before delivery day

```txt
[ ] Discovery completed
[ ] Scope locked
[ ] Invoice/deposit handled if applicable
[ ] Starting data received
[ ] User list received
[ ] Roles confirmed
[ ] Modules confirmed
[ ] Known limitations acknowledged
[ ] Delivery owner identified
```

## 13.2 Morning — Platform setup

```txt
[ ] Create Organization
[ ] Configure slug
[ ] Configure subscription/AppCare state
[ ] Create branches
[ ] Create departments
[ ] Create roles
[ ] Create users
[ ] Assign roles
[ ] Enable modules
[ ] Configure module settings
```

## 13.3 Midday — Data and module setup

```txt
[ ] Load starting data
[ ] Verify data counts
[ ] Check required Business Objects
[ ] Check module extension records
[ ] Configure dashboards/tables if available
[ ] Run smoke tests as admin
[ ] Run smoke tests as staff/non-admin
```

## 13.4 Afternoon — QA and training

```txt
[ ] Run tenant safety smoke test
[ ] Run permission smoke test
[ ] Run module acceptance checklist
[ ] Fix configuration issues
[ ] Conduct user walkthrough
[ ] Confirm acceptance criteria
[ ] Explain AppCare
[ ] Handover credentials/access process
[ ] Record post-launch enhancement list
```

## 13.5 End of day — Handover

```txt
[ ] Client confirms go-live readiness
[ ] Handover document sent
[ ] AppCare activated
[ ] Support channel confirmed
[ ] Known limitations documented
[ ] Follow-up review scheduled if needed
```

---

# 14. Delivery Roles

## 14.1 Founder / Delivery Lead

Responsible for:

```txt
scope control
client communication
configuration decisions
acceptance criteria
handover
AppCare explanation
commercial decisions
```

## 14.2 Architect / ChatGPT

Responsible for:

```txt
architectural classification
module/spec decisions
scope risk review
Platform Service promotion advice
Claude prompt preparation
manual updates
```

## 14.3 Claude Code

Responsible for:

```txt
implementation from frozen documents
running generator commands
editing code
writing tests
running checks
reporting failures
```

Claude is not responsible for:

```txt
inventing architecture
deciding scope
deciding pricing
bypassing security
creating client forks
adding deferred Platform Services casually
```

## 14.4 Client Owner

Responsible for:

```txt
business decisions
user list
starting data
acceptance approval
internal rollout
```

---

# 15. Client Organization Provisioning

Client onboarding is provisioning, not deployment.

Provisioning creates:

```txt
Organization
Subscription
Branches
Departments
Users
Roles
UserRole assignments
OrgModule records
Settings
Initial Business Objects
Module-owned records if needed
```

Provisioning must not create:

```txt
new code fork
new Supabase project
new Vercel project
new database schema
new production environment
manual database edits outside approved scripts/admin tools
```

---

# 16. User and Role Setup

Every client must have at least:

```txt
Admin
Staff
```

Additional roles should be added only when the workflow requires them.

Example roles:

```txt
Inventory Manager
Warehouse Staff
HR Admin
Approver
Viewer
Branch Manager
```

Do not create overly complex role hierarchies during one-day delivery.

MVP role rule:

```txt
Keep roles broad enough to support day-one operations.
Refine after real usage.
```

---

# 17. Module Enablement

A module is available to a client only when an `OrgModule` record enables it.

A module being in the codebase does not mean every client sees it.

```txt
module exists in codebase
+ enabled for org
+ user has permission
= visible/usable
```

Do not enable modules the client did not purchase.

Do not expose unfinished modules to normal clients unless explicitly marked as pilot/beta.

---

# 18. Data Import Rules

Data import during one-day delivery must be conservative.

Allowed in standard delivery:

```txt
small clean CSV/Excel-derived starting list
manual entry of small records
founder/developer-run import script
basic validation before write
```

Not included by default:

```txt
messy historical migration
multiple years of data
complex column mapping
duplicate merging
Excel formula interpretation
attachments/files
large import jobs
client-facing import UI
```

All imports must:

```txt
derive tenant from PlatformContext or provisioning context
never accept client-supplied orgId
validate before write
avoid duplicate Business Objects
respect soft delete
produce a simple import summary
```

---

# 19. Module Delivery Options

## 19.1 Existing official module

Use when the module is already production-ready.

Process:

```txt
enable module
configure settings
assign permissions
load starting data
run module smoke tests
train users
```

## 19.2 Existing draft/pilot module

Use only with client acknowledgement.

Requirements:

```txt
founder approval
known limitations documented
security tests passing
AppCare support scope clear
not marketed as mature module
```

## 19.3 New module

A new module may be created only if:

```txt
module spec is written
Business Objects are identified
module-owned entities are identified
permissions are defined
routes/APIs are defined
events are defined
tests are defined
scope is small enough
commercial value justifies it
```

Do not create a new module from a vague client request.

---

# 20. Handling Requests Outside Planned Modules

When a client asks for something not in the current module roadmap, follow this process:

```txt
1. Identify the business object or workflow.
2. Check if existing module/settings solve it.
3. Check if it is an extension of an existing module.
4. Check if it should become a new module.
5. Check if it is a Platform Service candidate.
6. Check if it is too client-specific or high-risk.
7. Decide: configure, extend, new module, defer, quote, or reject.
```

## Example: Fleet Management

A trucking client asks for:

```txt
vehicles
drivers
fuel logs
odometer logs
maintenance schedules
vehicle assignments
```

Correct classification:

```txt
Likely new Fleet module.
```

Shared Business Objects used:

```txt
Employee = drivers
Supplier = repair shops / fuel stations
Warehouse maybe not relevant
```

Module-owned entities:

```txt
Vehicle
FuelLog
OdometerLog
MaintenanceRecord
VehicleAssignment
```

Do not force this into Inventory or Assets unless the requested workflow is truly just asset tracking.

## Example: Dental Clinic Patient Charting

A clinic asks for:

```txt
patient records
medical history
tooth charts
x-ray uploads
prescriptions
treatment plans
appointments
billing
```

Correct classification:

```txt
High-risk vertical module / likely reject for standard one-day delivery.
```

Reason:

```txt
sensitive health data
file attachments
specialized workflows
privacy risk
support complexity
```

This may become a premium vertical module later, but should not enter the normal one-day lane casually.

---

# 21. Platform Services During Delivery

Deferred Platform Services must not be implemented just because a client asks for one instance of a capability.

Examples:

```txt
Only one module needs file uploads
→ keep module-local or defer

Only one module needs email notification
→ module-local workaround or manual process

Only one module needs approvals
→ module-local approval flow if approved

Three independent modules need same capability
→ write Platform Service proposal and ADR
```

The one-day delivery process should not create accidental Platform Services.

---

# 22. Design and UX During Delivery

Do not create client-specific UI patterns during delivery.

Use the shared design system:

```txt
standard app shell
standard sidebar
standard page headers
standard table patterns
standard form patterns
standard empty states
standard loading states
standard error states
standard permission-denied states
```

Do not let one client push OneDayOS toward:

```txt
Bootstrap admin template style
random color schemes
module-specific table designs
module-specific form layouts
client-specific UX forks
```

Premium consistency is part of the product.

---

# 23. Acceptance Criteria

Every one-day delivery must define acceptance criteria before implementation.

Example acceptance criteria:

```txt
Admin can log in.
Staff can log in.
Wrong users cannot access admin functions.
Client organization dashboard loads.
Enabled modules appear in sidebar.
Disabled modules do not appear.
Inventory staff can view products.
Inventory staff cannot access settings.
Admin can create product.
Staff without permission cannot create product.
Starting product data is visible.
Soft-deleted records do not appear.
Client confirms training completed.
```

Acceptance criteria must include at least one permission-sensitive check.

---

# 24. Delivery Smoke Test Checklist

Before handover, run a smoke test.

## 24.1 Auth

```txt
[ ] Admin can log in
[ ] Staff can log in
[ ] Logout works
[ ] Unauthenticated protected page redirects appropriately
[ ] Unauthenticated API returns JSON 401
```

## 24.2 Tenancy

```txt
[ ] Client org slug loads
[ ] Wrong org slug does not expose data
[ ] User cannot access another organization's route
[ ] API rejects client-supplied orgId
```

## 24.3 Permissions

```txt
[ ] Admin can access purchased module
[ ] Staff sees only allowed navigation
[ ] Staff without permission cannot mutate data
[ ] Permission-denied behavior is clear
```

## 24.4 Modules

```txt
[ ] Enabled modules appear
[ ] Disabled modules stay hidden
[ ] Main module list page loads
[ ] Create/edit/delete flows work if in scope
[ ] Empty states are acceptable
[ ] Starting data is correct
```

## 24.5 Operations

```txt
[ ] AppCare status confirmed
[ ] Backup posture understood
[ ] Support channel confirmed
[ ] Known limitations documented
```

---

# 25. Client Handover

The handover must include:

```txt
client org URL
admin users
enabled modules
roles summary
starting data summary
known limitations
AppCare coverage
support process
post-launch enhancement list
training notes
```

Do not hand over:

```txt
Supabase credentials
Vercel credentials
production database URL
service role keys
GitHub repo access
Claude prompts containing secrets
```

The client operates OneDayOS as a business tool, not as infrastructure.

---

# 26. AppCare Activation

AppCare starts after handover unless otherwise agreed.

AppCare includes:

```txt
hosting
monitoring
security updates
backup oversight
bug fixes
maintenance
AI-assisted internal support
minor configuration support
```

AppCare does not automatically include:

```txt
new modules
major enhancements
custom integrations
unlimited reports
data cleanup labor
manual admin work
client-specific infrastructure
Platform Service implementation
```

---

# 27. Post-Launch Enhancement Handling

After launch, classify every request.

| Request | Handling |
|---|---|
| Bug | AppCare fix |
| Minor setting change | AppCare if simple |
| New field in module extension | Scope review |
| New workflow | Enhancement quote |
| New module | Module spec + quote |
| Repeated cross-module capability | Platform Service evidence log |
| Custom integration | Separate quote |
| Dedicated infrastructure | Premium/enterprise quote |

This prevents AppCare from becoming unlimited custom development.

---

# 28. Evidence Logging

Every unusual delivery request should contribute to platform learning.

Track:

```txt
client type
requested capability
module affected
whether it was configured, extended, deferred, or rejected
whether it may repeat
possible future module/platform-service implication
```

Example:

```txt
Capability: File attachments
Client 1: Incident photos
Client 2: Expense receipts
Client 3: Asset warranty documents
Decision: Write Attachment Service proposal
```

This is how OneDayOS becomes more powerful without overengineering too early.

---

# 29. Anti-Patterns

These are forbidden during client delivery.

```txt
Creating a client-specific app fork
Creating a client-specific Supabase project for normal clients
Creating a client-specific Vercel project for normal clients
Adding business fields directly to Kernel because one client asked
Duplicating Product inside Inventory
Duplicating Customer inside CRM
Duplicating Employee inside Leave
Accepting client-supplied orgId
Bypassing permissions for speed
Giving staff hidden cross-tenant access
Adding Platform Services from one request
Adding FastAPI for one feature
Adding AI chatbot because it sounds impressive
Adding file upload before storage/security/backup plan
Running production migrations casually
Editing production DB schema manually
Hiding bugs by saying it is configuration
Promising AppCare as unlimited custom work
```

---

# 30. Claude Implementation Rules for Client Delivery

When Claude helps with a client delivery, it must receive a narrow task.

Good prompt:

```txt
Using the frozen Inventory module spec and OneDayOS Engineering Manual,
configure the Inventory module for the demo org and implement only the missing
stock adjustment service tests. Do not modify Kernel architecture.
```

Bad prompt:

```txt
Build an app for this client.
```

Claude must not:

```txt
invent new architecture
create client forks
add deferred Platform Services
add FastAPI
accept client-supplied orgId
bypass permission enforcement
skip tests
modify Business Objects casually
create duplicate shared entities
```

Claude must report:

```txt
files changed
tests added
checks run
known limitations
manual steps required
```

---

# 31. One-Day Delivery Prompt Template for Claude

Use this template after the relevant documents/specs are frozen.

```md
You are implementing a OneDayOS client delivery task.

Authoritative documents:
- docs/engineering-manual/16-client-delivery/00-one-day-delivery-playbook.md
- docs/engineering-manual/[relevant module spec]
- docs/engineering-manual/[relevant SDK/security/data docs]

Client:
[Client Name]

Organization slug:
[org-slug]

Scope:
[Exact locked scope]

Rules:
- Do not invent architecture.
- Do not create client-specific forks.
- Do not add deferred Platform Services.
- Do not add FastAPI or Python backend files.
- Do not import from @/kernel inside modules.
- Do not use raw Prisma inside modules.
- Do not accept client-supplied orgId.
- Use verified PlatformContext.
- Use tenant-scoped APIs.
- Enforce permissions.
- Add or update tests.
- Run required checks.

Task:
[Specific implementation/configuration task]

Report:
- Files changed
- Tests added
- Commands run
- Any limitations
```

---

# 32. Founder Delivery Checklist

Use this before starting a one-day implementation.

```txt
[ ] Client is a good-fit one-day candidate
[ ] Scope is locked
[ ] Module set is selected
[ ] Data received
[ ] User list received
[ ] Role list confirmed
[ ] Branches/departments confirmed
[ ] AppCare explained
[ ] Out-of-scope items documented
[ ] Acceptance criteria written
[ ] Delivery day scheduled
[ ] Required platform gates are green
```

Use this before handover.

```txt
[ ] Organization created
[ ] Users created
[ ] Roles assigned
[ ] Modules enabled
[ ] Settings configured
[ ] Starting data loaded
[ ] Admin smoke test passed
[ ] Staff smoke test passed
[ ] Permission smoke test passed
[ ] Module smoke test passed
[ ] Known limitations documented
[ ] Training completed
[ ] Handover sent
[ ] AppCare activated
```

---

# 33. Commercial Rules

The one-day delivery offer must remain commercially viable.

Do not include high-labor work inside the base price unless it becomes repeatable platform value.

Base one-day delivery should include:

```txt
standard platform setup
module enablement
standard configuration
basic starting data
basic training
handover
AppCare activation
```

Charge separately for:

```txt
new module development
complex imports
integrations
large migrations
custom reports
custom workflows
premium support
dedicated infrastructure
regulated-domain support
multi-location enterprise rollout
```

The platform must serve the business model, not consume it.

---

# 34. Implementation Acceptance Criteria

This playbook is complete when:

```txt
[ ] It clearly defines what one-day delivery means
[ ] It clearly defines what is out of scope
[ ] It explains standard client provisioning
[ ] It rejects per-client forks
[ ] It aligns with shared tenancy model
[ ] It includes discovery outputs
[ ] It includes scope-lock rules
[ ] It includes delivery-day timeline
[ ] It includes smoke-test checklist
[ ] It includes handover checklist
[ ] It includes AppCare activation rules
[ ] It includes outside-planned-module classification
[ ] It includes Claude delivery prompt template
[ ] It helps the founder decide what to accept, defer, quote, or reject
```

---

# 35. Final Rule

OneDayOS can deliver in one business day only if it refuses to become custom software every day.

The correct operating discipline is:

```txt
Configure when possible.
Extend when necessary.
Create modules when reusable.
Promote services when proven.
Reject or quote work that breaks the model.
Never fork the platform casually.
```

