# OneDayOS Engineering Manual — 01 Foundation — 04 Commercial Constraints

**Document ID:** `01-foundation/04-commercial-constraints.md`  
**Version:** `1.0`  
**Status:** Frozen  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  
**Depends On:**

- `01-foundation/00-vision.md`
- `01-foundation/01-business-model.md`
- `01-foundation/02-product-principles.md`
- `01-foundation/03-platform-vs-modules.md`
- `02-architecture/00-system-architecture.md`
- `13-security/08-production-readiness-gate.md`
- `16-client-delivery/00-one-day-delivery-playbook.md`
- `16-client-delivery/02-scope-control.md`

---

# 1. Purpose

This document defines the commercial constraints that OneDayOS engineering must respect.

OneDayOS is not being built as a theoretical perfect ERP.

OneDayOS is being built as a commercial platform that must support:

```txt
₱20,000+ initial build
₱3,500/month AppCare
one-business-day delivery
Philippine SME clients
low operational cost
module reuse
AI-assisted development
one shared platform
many client organizations
```

The purpose of this document is to make sure engineering decisions do not accidentally destroy the business model.

Architecture exists to serve the business.

But the reverse is also true:

```txt
A weak business model will force bad architecture.
A weak architecture will destroy the business model.
```

OneDayOS must optimize for both.

---

# 2. Core Commercial Thesis

The commercial thesis of OneDayOS is:

```txt
Build the platform once.
Deliver client systems quickly.
Reuse every improvement.
Support many clients with low marginal cost.
Earn recurring revenue through AppCare.
```

The business fails if every client becomes custom work.

The business works if every client makes the shared platform stronger.

---

# 3. The One-Day Delivery Constraint

OneDayOS promises:

```txt
Custom internal business applications for Philippine SMEs in one business day.
```

But internally this means:

```txt
One-day configuration and module activation.
Not one-day bespoke software invention.
```

One-day delivery is possible only when:

```txt
[ ] The platform already exists
[ ] The client fits supported module patterns
[ ] Scope is locked before delivery
[ ] Business Objects are reusable
[ ] Modules are reusable
[ ] Generators produce safe scaffolds
[ ] Design system is shared
[ ] AppCare boundaries are clear
[ ] Custom work is limited or separately priced
```

One-day delivery is not possible if every client asks for:

```txt
custom data model
custom workflow engine
custom dashboard
custom integrations
custom deployment
custom authentication
custom reports
custom AI
custom UI
```

Therefore, every one-day delivery must be protected by discovery and scope control.

---

# 4. The Pricing Constraint

The starting price is:

```txt
Initial build: ₱20,000+
AppCare: ₱3,500/month
```

These numbers create strict engineering constraints.

At this price point, OneDayOS cannot afford:

```txt
per-client repositories
per-client infrastructure by default
per-client database schemas
per-client code forks
per-client design systems
unlimited support
manual migrations for every client
custom integrations in standard scope
unbounded AI usage
heavy DevOps operations
```

The architecture must support low marginal cost.

Every client should become cheaper to serve over time.

If the tenth client takes as much engineering effort as the first client, the platform failed.

---

# 5. AppCare Constraint

AppCare is the recurring subscription that funds the platform.

AppCare includes:

```txt
hosting
monitoring
security updates
backups
bug fixes
AI-assisted support
maintenance
limited configuration help
```

AppCare does not automatically include:

```txt
new modules
custom workflows
custom dashboards
integrations
runtime AI features
file upload systems
complex imports
custom reports
client-specific UI
client-specific infrastructure
unlimited admin work
```

The AppCare constraint is simple:

```txt
AppCare must be supportable at scale.
```

If an AppCare task cannot be repeated, automated, documented, or priced separately, it is dangerous.

---

# 6. Shared Infrastructure Constraint

The default OneDayOS infrastructure model is:

```txt
One OneDayOS-owned Supabase organization
One production Supabase project
One staging Supabase project
One production Vercel deployment
One shared codebase
One shared production database
Many OneDayOS client organizations inside the app
```

A normal client receives:

```txt
OneDayOS Organization
Enabled modules
Roles and permissions
Settings
Business data separated by orgId
AppCare support
```

A normal client does not receive:

```txt
Supabase dashboard access
Vercel project access
GitHub repository access
Service role keys
Database admin access
Separate production deployment
Separate code fork
```

This constraint is necessary because standard AppCare pricing cannot support separate infrastructure for every small SME client.

Dedicated infrastructure may exist later as a premium or enterprise offering.

It must not be the default.

---

# 7. Shared Database Constraint

The default database model is:

```txt
One shared PostgreSQL database
Shared tables
Tenant-scoped records using orgId
Verified PlatformContext
SDK-only database access
```

This model supports:

```txt
fast onboarding
single migration path
centralized backups
shared module upgrades
simple AppCare operations
lower hosting cost
```

It also creates responsibility:

```txt
tenant isolation must be correct
cross-tenant tests are mandatory
client-supplied orgId is forbidden
services must receive PlatformContext
permissions must be enforced
backups must be tested
```

The shared database model is commercially correct for MVP.

But it is only acceptable if the security model is strong.

---

# 8. No Client Forks Constraint

Client forks are one of the biggest threats to OneDayOS.

Forbidden default pattern:

```txt
client-a-app/
client-b-app/
client-c-app/
```

Required pattern:

```txt
onedayos-platform/
  Organization: Client A
  Organization: Client B
  Organization: Client C
```

Client-specific forks create:

```txt
duplicated bugs
duplicated fixes
duplicated deployments
duplicated migrations
inconsistent UX
higher support cost
harder AppCare
slower delivery
weaker platform reuse
```

Therefore:

```txt
Client-specific code is rejected by default.
```

Client variation should be handled through:

```txt
settings
module enablement
feature flags
roles
permissions
Business Object extension tables
module configuration
future workflow configuration
future view configuration
```

Not through forks.

---

# 9. Scope Constraint

OneDayOS must classify every client request before promising it.

The classification ladder is:

```txt
1. Configuration
2. Existing module behavior
3. Module setting
4. Module extension table
5. Reusable module enhancement
6. New draft module
7. Platform Service candidate
8. Premium/custom work
9. Reject or defer
```

A request should not jump straight to custom development.

A request should not become a Platform Service just because one client wants it.

A request should not pollute Kernel just because it feels important.

A request should not create a new shared Business Object field unless it is broadly reusable.

---

# 10. Module Reuse Constraint

Modules are the commercial unit of reuse.

A module should be:

```txt
reusable
configurable
test-covered
tenant-safe
permission-safe
SDK-compliant
design-system-compliant
AppCare-supportable
```

A module may start because one client needs it.

But even then, it must be built as:

```txt
clean draft module
```

Not:

```txt
client-specific patch
```

Example:

```txt
Client asks for Fleet Management.
```

Bad response:

```txt
Add random vehicle fields inside Assets.
Hard-code trucking-client routes.
Fork the app.
```

Correct response:

```txt
Create a draft Fleet module if commercially justified.
Use shared Employee for drivers.
Use Supplier for repair shops.
Use module-owned Vehicle/FuelLog/MaintenanceRecord entities.
Enable Fleet only for that client.
Improve and productize it if more clients need it.
```

---

# 11. Platform Service Constraint

Platform Services are expensive.

They require:

```txt
data model
SDK surface
API surface
permissions
UI
migration plan
tests
monitoring
support docs
future compatibility
```

Therefore, Platform Services must be earned.

The rule is:

```txt
Three independent use cases trigger review.
They do not automatically trigger implementation.
```

Services that remain deferred until proven include:

```txt
Audit Log Service
Notification Service
Approval Workflow Service
Comments Service
Attachments Service
Activity Feed Service
Reporting Service
Search Service
Background Jobs
Dynamic Forms
Dynamic CRUD
Dynamic Table Views
AI Querying
```

A module can have local behavior before a Platform Service exists.

Example:

```txt
Leave can have module-local approval.
Purchasing can have module-local approval.
Expenses can have module-local approval.
```

After the pattern repeats, OneDayOS may design a shared Approval Workflow Service.

But it should not be built in advance.

---

# 12. Generator Constraint

Generators exist to reduce delivery time.

But a generator can either scale quality or scale mistakes.

Therefore, generated code must be:

```txt
secure by default
tenant-safe by default
permission-enforced by default
tested by default
SDK-compliant by default
design-system-compliant by default
```

Generated code must not contain:

```txt
client-supplied orgId
sdk.getDb(orgId)
raw Prisma imports inside modules
@/kernel imports inside modules
/api/[module]?orgId=...
auth-only APIs
placeholder security tests
module-to-module imports
duplicate Business Objects
```

The generator must make the correct architecture faster than the wrong architecture.

---

# 13. Design System Constraint

The design system is a commercial asset.

A generic admin UI weakens the OneDayOS brand.

The previous generated base app had the right pieces but the wrong feel:

```txt
auth
sidebar
dashboard
cards
CRUD
```

But it did not feel like a premium Business Operating System.

OneDayOS UI must support:

```txt
fast delivery
module consistency
user trust
reduced training burden
premium positioning
support efficiency
```

Therefore:

```txt
Every module must use the shared design system.
```

No normal client should receive:

```txt
custom UI fork
custom layout
custom component library
custom CSS theme beyond approved branding tokens
```

---

# 14. AI Cost and Scope Constraint

AI is part of the OneDayOS advantage.

But runtime AI can become expensive and risky.

During the foundation build:

```txt
Development AI is allowed.
User-facing runtime AI is deferred.
```

Development AI includes:

```txt
manual writing
Claude implementation
code review
test generation
architecture critique
support drafting
```

Runtime AI features are deferred, including:

```txt
in-app chatbot
AI database query
AI report generation
AI actions
AI support agent
embeddings
RAG
vector search
AI import mapping
AI receipt parsing
```

Before runtime AI ships, OneDayOS must define:

```txt
cost controls
permissions
tenant isolation
context limits
sensitive-field rules
confirmation flows
provider choice
logging policy
AppCare boundaries
```

AI should improve margins.

It must not quietly destroy them.

---

# 15. Integration Constraint

Integrations are commercially dangerous if included too early.

Examples:

```txt
Stripe
GCash
Maya
Xero
QuickBooks
Shopify
Lazada
Shopee
Google Workspace
Microsoft 365
biometrics devices
barcode hardware
SMS gateways
email providers
accounting systems
payroll systems
```

Integrations create:

```txt
external dependencies
API failures
maintenance burden
support questions
security risk
test complexity
billing complexity
client-specific edge cases
```

Therefore:

```txt
Integrations are premium/deferred unless explicitly included in scope.
```

OneDayOS should not casually promise integrations as part of the standard one-day package.

---

# 16. File Storage Constraint

Files look simple but are operationally expensive.

Files introduce:

```txt
storage cost
backup complexity
access control
signed URLs
malware risk
privacy risk
large upload failures
retention questions
support issues
```

Therefore:

```txt
Attachment Service is deferred.
```

Module-local file handling may be allowed only with founder/architect approval.

Before full file support exists, OneDayOS should prefer structured fields and text references.

Examples:

```txt
receipt number instead of receipt upload
incident description instead of photo upload
warranty reference instead of warranty PDF upload
```

This keeps early modules lighter and AppCare safer.

---

# 17. Reporting Constraint

Every SME wants reports.

But reporting can become endless custom work.

Therefore:

```txt
Module-local basic reports are allowed.
Generic Reporting Service is deferred.
Custom SQL per client is rejected by default.
```

Acceptable early reporting:

```txt
Inventory low-stock table
Leave request status counts
Expense claim status summary
CRM opportunity pipeline list
```

Dangerous reporting:

```txt
custom SQL per client
custom dashboards per client
one-off exports without tests
cross-module analytics without permission model
AI-generated SQL
```

Reports must respect:

```txt
tenant isolation
permissions
module enablement
soft delete
sensitive fields
export permissions
```

---

# 18. Support Labor Constraint

The most hidden cost in AppCare is founder/support labor.

A feature is not commercially viable if it causes endless support questions.

Support-heavy features include:

```txt
custom workflows
complex imports
integrations
role misconfiguration
file uploads
AI actions
advanced reports
manual data corrections
client-specific behavior
```

Therefore, OneDayOS must prefer:

```txt
clear defaults
strong empty states
role templates
simple permissions
good onboarding
training materials
client admin responsibility
support request classification
regression tests
```

The platform must reduce support load over time.

---

# 19. Security as Commercial Constraint

Security is not only a technical issue.

A tenant leak can destroy the business.

Therefore:

```txt
Security shortcuts are commercially unacceptable.
```

Before serious production use, OneDayOS must satisfy:

```txt
verified PlatformContext
tenant isolation tests
permission enforcement tests
API JSON failure behavior
client-supplied orgId rejection
soft-delete behavior
secrets management
backup/restore plan
incident response plan
```

The initial build price cannot justify weak security.

Low price does not mean low responsibility.

---

# 20. Founder Time Constraint

The founder’s time is the scarcest resource.

Engineering must reduce the need for founder intervention over time.

The system should make it easy to:

```txt
classify requests
create modules
configure clients
run tests
deploy safely
support clients
explain AppCare
reject bad-fit requests
promote reusable enhancements
```

If the platform requires the founder to personally hand-edit code for every client, it failed.

---

# 21. Claude Constraint

Claude Code can accelerate OneDayOS.

But Claude should not be allowed to make commercial or architectural decisions.

Claude must not decide:

```txt
whether to add a Platform Service
whether to create a new module
whether to accept custom scope
whether to add FastAPI
whether to create dedicated infrastructure
whether to build runtime AI
whether to add file uploads
whether to add an integration
whether to fork a client app
```

Claude may implement:

```txt
frozen manual documents
approved module specifications
approved bug fixes
approved generator work
approved design-system components
approved delivery tasks
```

Claude must stop when a request has commercial ambiguity.

---

# 22. Commercial Request Classification

Every client request should be classified before work begins.

## 22.1 Configuration

Examples:

```txt
enable Inventory
add users
create roles
set branch names
change module settings
configure product categories
```

Decision:

```txt
Included in normal delivery/AppCare if reasonable.
```

## 22.2 Existing Module Behavior

Examples:

```txt
track stock movements
submit leave requests
record visitors
create expense claims
```

Decision:

```txt
Standard module delivery.
```

## 22.3 Module Enhancement

Examples:

```txt
Inventory needs reorder point
Leave needs half-day option
CRM needs follow-up date
Expenses needs merchant field
```

Decision:

```txt
Reusable backlog item.
May be included, deferred, or quoted.
```

## 22.4 New Draft Module

Examples:

```txt
Fleet Management
Reservations
Service Tickets
Job Orders
Rental Tracking
Training Records
```

Decision:

```txt
Founder/architect review.
Can be built if commercially justified.
Must follow module architecture.
```

## 22.5 Platform Service Candidate

Examples:

```txt
attachments needed by Incidents + Expenses + Assets
approvals needed by Leave + Purchasing + Expenses
notifications needed by Inventory + Leave + Incidents
```

Decision:

```txt
Create evidence log.
Write proposal/ADR.
Do not casually implement.
```

## 22.6 Premium / Custom Work

Examples:

```txt
custom integration
dedicated infrastructure
complex migration
custom report suite
client portal
AI automation
industry-specific workflows
```

Decision:

```txt
Quote separately.
Do not include in standard one-day package.
```

## 22.7 Reject or Defer

Examples:

```txt
unsafe workflow
bad-fit regulated domain
client-specific hack
request that violates tenant model
request that requires unsupported infrastructure
```

Decision:

```txt
Reject or defer honestly.
```

---

# 23. Commercial Anti-Patterns

These are dangerous and should be rejected by default.

## 23.1 “Just for this client” code

```txt
if (org.slug === 'client-a') {
  // custom behavior
}
```

Rejected.

Use configuration, feature flags, or separate approved module behavior.

## 23.2 Per-client repositories

Rejected for normal clients.

## 23.3 Per-client databases

Rejected for MVP standard pricing.

May become premium/enterprise later.

## 23.4 Custom dashboards per client

Rejected unless separately scoped.

## 23.5 Unlimited AppCare requests

Rejected.

AppCare is maintenance and support, not infinite development.

## 23.6 Platform Service by imagination

Rejected.

Services are promoted from evidence.

## 23.7 AI feature by excitement

Rejected.

Runtime AI needs cost, safety, and permission design.

## 23.8 File uploads by default

Rejected.

Files require storage, backup, permission, and operational planning.

## 23.9 Integrations in standard scope

Rejected unless explicitly priced and approved.

## 23.10 Business Object pollution

Rejected.

Do not add module-specific fields to shared objects without evidence and ADR.

---

# 24. Commercially Safe Default Stack

The commercially safe MVP stack is:

```txt
Next.js
TypeScript
Tailwind CSS
shadcn/ui-based OneDayOS components
Motion for React
React Hook Form
Zod
Supabase Auth
Supabase PostgreSQL
Prisma
Vercel
GitHub
Claude Code
Manual billing initially
```

Do not add without ADR:

```txt
FastAPI
GraphQL
tRPC
Redis
queue providers
search engines
BI tools
workflow engines
AI runtime providers
file upload providers
SMS/email providers
per-client infrastructure
enterprise observability stack
```

---

# 25. Commercial Gates

## 25.1 Before First Paid Client

```txt
[ ] Vision approved
[ ] Business model approved
[ ] Product principles approved
[ ] Platform vs Modules approved
[ ] Commercial constraints approved
[ ] Production Readiness Gate approved
[ ] One-Day Delivery Playbook approved
[ ] Scope Control approved
[ ] AppCare boundaries approved
[ ] First module scope approved
```

## 25.2 Before Promising AppCare

```txt
[ ] Hosting model documented
[ ] Monitoring baseline defined
[ ] Backup plan defined
[ ] Restore drill planned or completed
[ ] Incident response documented
[ ] Support classification documented
[ ] Bug vs enhancement distinction documented
[ ] AppCare limits documented
[ ] Cost review process documented
```

## 25.3 Before Adding a New Module for One Client

```txt
[ ] Request classified
[ ] Reuse potential assessed
[ ] Module spec written
[ ] Business Objects identified
[ ] No duplicate shared entities
[ ] Scope priced or approved
[ ] Deferred services not casually included
[ ] Tests defined
```

## 25.4 Before Adding a Platform Service

```txt
[ ] Three independent use cases logged
[ ] Evidence log reviewed
[ ] ADR written if needed
[ ] Manual document written
[ ] SDK contract defined
[ ] Data model defined
[ ] Security model defined
[ ] Cost impact reviewed
[ ] Claude implementation package prepared
```

---

# 26. Example: Reusable Enhancement After Delivery

Client A receives Inventory.

They ask for:

```txt
reorder point per product
```

Classification:

```txt
Reusable module enhancement
```

Correct implementation:

```txt
InventoryProductExtension.reorderPoint
Inventory table low-stock badge
Inventory service low-stock query
Inventory tests
Inventory docs update
```

Incorrect implementation:

```txt
Product.reorderPoint
client-specific code
custom dashboard only for Client A
Notification Service before evidence
```

Reason:

```txt
Reorder point is inventory-specific behavior, not core Product identity.
```

---

# 27. Example: Request Outside Planned Modules

Client asks for:

```txt
Fleet Management
```

Classification:

```txt
New draft module candidate
```

Possible module-owned entities:

```txt
Vehicle
FuelLog
OdometerLog
MaintenanceRecord
VehicleAssignment
```

Shared objects used:

```txt
Employee = driver
Supplier = repair shop / fuel provider
Warehouse or Branch = location
```

Commercial decision:

```txt
Build if priced/approved.
Enable for this client only.
Keep it reusable.
Do not fork.
```

---

# 28. Example: High-Risk Request

Client asks for:

```txt
Clinic patient records with medical history, prescriptions, x-rays, and treatment notes.
```

Classification:

```txt
High-risk regulated/sensitive domain
```

Decision options:

```txt
Reject for now
Quote as premium vertical module
Require privacy/security review
Require file/attachment plan
Require data retention plan
Require special AppCare pricing
```

Do not casually include this in standard one-day delivery.

---

# 29. Decision Rules

When unsure, use these rules.

## Rule 1 — Protect Recurring Margin

If the request creates permanent support burden, price it separately or reject it.

## Rule 2 — Prefer Configuration Over Code

If a request can be solved with settings, do not write custom code.

## Rule 3 — Prefer Module Enhancement Over Fork

If it is reusable, improve the module.

## Rule 4 — Prefer Draft Module Over Client Hack

If it is a new domain, create a clean module.

## Rule 5 — Prefer Evidence Over Premature Platform Service

If only one module needs it, keep it local.

## Rule 6 — Protect Tenant Safety

No commercial opportunity justifies weak tenant isolation.

## Rule 7 — Protect Founder Time

Do not accept work that makes the founder personally responsible for endless manual support.

---

# 30. Claude Instructions

Claude must follow these commercial constraints during implementation.

Claude must not:

```txt
create per-client forks
create per-client infrastructure
add custom org-specific branches in code
add FastAPI
add runtime AI
add file upload systems
add integrations
add Platform Services
add custom dashboards
bypass module specs
bypass scope locks
add client-supplied orgId
implement features outside approved scope
```

Claude may:

```txt
implement frozen manual documents
implement approved module specs
implement approved module enhancements
write tests
improve generators
improve design-system components
write documentation
refactor toward manual compliance
```

If Claude encounters a commercial ambiguity, it must stop and report:

```txt
This request may affect scope, pricing, AppCare, infrastructure, module boundaries, or Platform Service promotion. Founder/architect review required.
```

---

# 31. Acceptance Criteria

This document is ready to freeze when:

```txt
[ ] It clearly protects the ₱20,000+ initial build model
[ ] It clearly protects the ₱3,500/month AppCare model
[ ] It explains why per-client forks are rejected
[ ] It explains why normal clients do not get dedicated infrastructure
[ ] It explains how client requests are classified
[ ] It explains when new modules are acceptable
[ ] It explains why Platform Services are deferred until evidence exists
[ ] It explains why runtime AI, integrations, and file uploads are not standard scope
[ ] It gives Claude clear commercial stop conditions
[ ] It aligns with Vision, Business Model, Product Principles, and Platform vs Modules
```

---

# 32. Final Rule

The final commercial rule is:

```txt
OneDayOS should become easier, faster, and cheaper to deliver after every client.
```

If a decision makes the next client harder to serve, it is probably wrong.

If a decision makes the platform more reusable, more secure, easier to support, and faster to configure, it is probably right.

