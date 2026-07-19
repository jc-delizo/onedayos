# OneDayOS Engineering Manual — 01 Foundation — 01 Business Model

**Document ID:** `01-foundation/01-business-model.md`  
**Version:** 1.0  
**Status:** Frozen  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Date:** July 2026  
**Implementation Allowed:** Yes — frozen for Foundation Package 1 where applicable  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/06-feature-flags-subscriptions.md`
- `08-module-system/00-module-philosophy.md`
- `10-platform-services/01-three-client-rule.md`
- `15-deployment-operations/06-appcare-operations.md`
- `15-deployment-operations/08-cost-management.md`
- `16-client-delivery/00-one-day-delivery-playbook.md`
- `16-client-delivery/02-scope-control.md`

---

# 1. Purpose

This document defines the business model OneDayOS is being engineered to support.

OneDayOS is not a traditional agency project.

OneDayOS is not a SaaS starter kit.

OneDayOS is not ten separate apps for ten separate clients.

OneDayOS is a shared business software platform that sells fast, productized internal systems to Philippine SMEs through reusable modules, centralized AppCare, and disciplined scope control.

The core commercial promise is:

```txt
Custom internal business applications for Philippine SMEs
configured and delivered in one business day
on top of a reusable OneDayOS platform.
```

The core internal truth is:

```txt
Clients buy OneDayOS.
Modules are enabled.
Configuration adapts the platform.
AppCare sustains the relationship.
Reusable improvements compound over time.
```

The business model must shape architecture.

If the architecture makes every client a separate app, AppCare becomes expensive.

If the architecture makes every request custom code, one-day delivery collapses.

If the architecture builds too many generic engines too early, the platform becomes slow and expensive before revenue proves the need.

If the architecture ignores security, one shared platform becomes commercially dangerous.

The goal is:

```txt
Fast delivery now.
Reusable platform later.
Low support burden always.
```

---

# 2. Business Positioning

Public positioning:

```txt
OneDayOS builds custom internal business applications for Philippine SMEs in one business day.
```

Internal positioning:

```txt
OneDayOS is a Business Operating System.
```

The customer may describe the purchase as:

```txt
inventory app
leave app
CRM app
visitor log
incident reporting system
```

But OneDayOS must sell and operate it as:

```txt
OneDayOS Platform
+ enabled modules
+ client configuration
+ AppCare
```

This distinction matters because the long-term company is not built by selling isolated projects.

It is built by turning repeated SME workflows into reusable product modules.

---

# 3. Core Business Thesis

OneDayOS exists because many Philippine SMEs need internal software but cannot justify:

```txt
large ERP implementation cost
long custom development timelines
complex enterprise SaaS subscriptions
multiple disconnected apps
manual spreadsheet-heavy operations
high-maintenance bespoke software
```

OneDayOS should win by offering:

```txt
fast delivery
local SME fit
lower upfront price
simple recurring support
shared platform maturity
reusable modules
premium but practical UX
AI-assisted development
```

The competitive advantage is not writing code from scratch quickly.

The competitive advantage is:

```txt
platform maturity
standardized module patterns
reusable Business Objects
safe generators
centralized AppCare
architecture that improves with every client
```

---

# 4. Primary Revenue Model

## 4.1 Initial Build

Baseline offer:

```txt
Initial Build: ₱20,000+
Delivery target: one business day
```

The initial build fee covers a scoped, productized delivery using the existing OneDayOS platform.

It may include:

```txt
client discovery
organization setup
basic branding/configuration
enabled module setup
standard roles and permissions
basic data loading
standard forms/tables/pages
basic training
handover
AppCare activation
```

It does **not** automatically include:

```txt
unlimited custom workflows
new Platform Services
complex integrations
runtime AI features
file upload systems
dedicated infrastructure
large data migration
custom reports beyond scope
custom mobile app
customer portal
accounting/payroll/legal compliance systems
industry-specific regulated workflows
```

The `+` in `₱20,000+` is important.

It means the price increases when delivery complexity increases.

OneDayOS should not force every client into the same price if the operational burden is clearly different.

---

## 4.2 AppCare

Baseline offer:

```txt
AppCare: ₱3,500/month
```

AppCare is the recurring operations and support layer.

It may include:

```txt
hosting
monitoring
security updates
bug fixes
backup checks
maintenance
minor configuration support
AI-assisted internal support
standard platform updates
```

AppCare does **not** mean:

```txt
unlimited custom development
unlimited admin work for the client
unlimited data cleanup
new modules on demand
custom integrations included
complex reports included
runtime AI included
dedicated infrastructure included
zero downtime guarantee
zero data loss guarantee
instant per-tenant restore guarantee
```

AppCare must remain commercially viable.

If AppCare becomes unlimited labor, OneDayOS becomes an underpriced agency.

---

## 4.3 Future Module Revenue

Modules may eventually become priced add-ons.

Examples:

```txt
Inventory Module
Leave Module
CRM Module
Purchasing Module
Expenses Module
Assets Module
Visitor Management Module
Incident Reporting Module
```

Possible future pricing structures:

```txt
base platform + included module allowance
additional module monthly fee
premium module setup fee
vertical module package
advanced module tier
```

No final module pricing is defined in this document.

But the architecture must support per-organization module enablement through `OrgModule`, subscription limits, settings, roles, and permissions.

---

## 4.4 Future Add-On Revenue

Potential future add-ons:

```txt
premium AI
integrations
advanced reporting
dedicated infrastructure
larger storage allocation
higher user limits
priority support
custom module development
marketplace modules
industry-specific vertical packages
```

These must not be accidentally included in the base offer.

They should become priced surfaces only after the platform can support them safely.

---

# 5. What the Client Actually Buys

The client does not buy source code.

The client does not buy a Supabase account.

The client does not buy a Vercel project.

The client does not buy a separate application fork.

The client buys access to a configured OneDayOS organization.

```txt
OneDayOS Platform
  └── Organization: Client Company
        ├── enabled modules
        ├── users
        ├── roles
        ├── permissions
        ├── settings
        ├── client data
        └── AppCare support
```

Normal delivery model:

```txt
One shared codebase.
One shared production platform.
One shared database.
Many tenant organizations.
Tenant separation by orgId.
Access controlled by PlatformContext, modules, settings, roles, and permissions.
```

This business model depends on the architecture staying shared.

Per-client forks are commercially dangerous.

---

# 6. Product Packaging Model

## 6.1 Base Platform

Every client receives the base OneDayOS platform.

The base platform includes foundational capabilities such as:

```txt
authentication
organization tenancy
users
roles
permissions
Business Objects
module registry
app shell
settings
standard UI patterns
AppCare operating model
```

The base platform is not sold as an empty technical shell.

It is the operating layer that makes modules reusable.

---

## 6.2 Business Modules

A module is a productized business capability.

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
```

Modules are enabled per organization.

A module can exist in the codebase without being enabled for every client.

```txt
Module exists in platform
  ≠ every client can use it

Client can use it only if:
  module is enabled for their org
  subscription allows it
  user has permission
  UI exposes it
```

---

## 6.3 Client Configuration

Configuration adapts the platform to a client.

Examples:

```txt
organization name
brand accent/logo
branches
departments
users
roles
permissions
enabled modules
module settings
labels where allowed
initial data
```

Configuration is preferred over custom code.

Custom code is allowed only when it becomes a clean platform/module improvement or a separately priced custom/premium engagement.

---

## 6.4 AppCare

AppCare is the recurring relationship.

It keeps the platform operating and improving.

It should create predictable monthly revenue without turning OneDayOS into unlimited custom support.

---

# 7. Pricing Discipline

## 7.1 Initial price is a floor, not a promise for every request

```txt
₱20,000+ means minimum commercial starting point.
```

The price should increase for:

```txt
more modules
new draft module creation
complex workflows
messy data migration
higher-risk domains
special reports
integrations
training complexity
accelerated delivery under uncertainty
```

OneDayOS should not accept complex work at the base price just to close a deal.

Bad early pricing creates bad operational expectations.

---

## 7.2 AppCare price assumes standard platform operation

```txt
₱3,500/month assumes shared infrastructure and standard support scope.
```

The price should increase for:

```txt
higher user counts
large storage usage
premium AI usage
priority support
custom integrations
dedicated infrastructure
complex reporting needs
higher operational risk
regulated/sensitive workflows
```

The base AppCare price should not silently absorb heavy operational burden.

---

## 7.3 Do not discount by increasing scope

If a client negotiates price, do not compensate by adding more work.

Acceptable discount behavior:

```txt
lower scope
fewer modules
fewer users
longer timeline
less data loading
fewer reports
no custom workflow
no premium support
```

Bad discount behavior:

```txt
same low price
more features
faster timeline
custom logic
special support promises
```

Discounting scope is safer than discounting architecture.

---

# 8. Commercial Scope Ladder

Every client request should be classified before commitment.

```txt
1. Configuration
2. Existing Module Setup
3. Module Extension
4. New Draft Module
5. Platform Service Candidate
6. Custom / Premium Work
7. Reject or Defer
```

## 8.1 Configuration

Use settings, roles, permissions, labels, enabled modules, and initial data.

Example:

```txt
Client wants only managers to approve leave.
→ Configure roles/permissions in Leave.
```

## 8.2 Existing Module Setup

Use an already built module without changing core architecture.

Example:

```txt
Client needs stock tracking.
→ Enable Inventory and configure warehouses/products.
```

## 8.3 Module Extension

Add module-specific fields or behavior without polluting shared Business Objects.

Example:

```txt
Inventory needs reorder point for products.
→ Add InventoryProductExtension.reorderPoint.
→ Do not add reorderPoint to core Product.
```

## 8.4 New Draft Module

Create a clean module if the workflow is independent and commercially worth building.

Example:

```txt
Trucking client needs Fleet Management.
→ Create Fleet as a draft module.
→ Enable it only for that organization first.
→ Keep it SDK-compliant and reusable.
```

## 8.5 Platform Service Candidate

Use an evidence log and Three Independent Use Cases Rule.

Example:

```txt
Leave needs approvals.
Purchasing needs approvals.
Expenses needs approvals.
→ Approval Workflow Service candidate.
→ Write evidence log and proposal.
→ Do not implement casually during one client delivery.
```

## 8.6 Custom / Premium Work

Some requests may be valuable but not standard.

Example:

```txt
Dedicated infrastructure.
Complex accounting integration.
Industry-specific regulated workflows.
Large data migration.
```

These require separate pricing.

## 8.7 Reject or Defer

Some requests are not commercially or architecturally worth accepting.

Example:

```txt
Client wants full healthcare record system for base price.
Client wants direct Supabase access.
Client wants their own fork but pays standard AppCare.
Client wants runtime AI to edit records without approvals.
```

Rejecting bad-fit work protects the platform.

---

# 9. Architecture Must Support the Business Model

The business model requires the following architectural choices.

## 9.1 One shared platform by default

Normal clients are tenant organizations inside the shared platform.

This keeps costs low and updates fast.

```txt
One update improves all clients.
One security fix protects all clients.
One module improvement compounds across the platform.
```

## 9.2 Tenant isolation is existential

Because many clients share one platform, tenant isolation is not optional.

If tenant isolation fails, the business model fails.

Therefore:

```txt
PlatformContext is mandatory.
Client-supplied orgId is forbidden.
Two-org tests are mandatory.
Wrong-org access must fail safely.
Permissions must be enforced in APIs and services.
```

## 9.3 Modules are reusable products

Modules must not become client folders.

Bad:

```txt
src/clients/acme/inventory
src/clients/abc/leave
src/modules/inventory-custom-for-client-a
```

Good:

```txt
src/modules/inventory
src/modules/leave
src/modules/fleet
```

Then enable modules per organization.

## 9.4 Business Objects prevent duplication

Shared entities like Product, Customer, Supplier, Employee, and Warehouse must not be duplicated per module.

This preserves the “one login, one database, shared platform” promise.

## 9.5 Platform Services are deferred until proven

Do not build Audit Log, Notifications, Attachments, Comments, Approval Workflow, Search, Reporting, Background Jobs, Dynamic Forms, or Dynamic CRUD just because they sound useful.

Build them when repeated independent use cases prove the need.

This prevents the platform from becoming heavy before revenue justifies it.

---

# 10. Why One-Day Delivery Requires Constraints

One-day delivery is not possible if every client is allowed to redefine the product.

One-day delivery requires:

```txt
fixed architecture
approved modules
standard UI patterns
standard roles
standard API patterns
standard data model
standard deployment
standard handover
standard AppCare terms
```

The promise is not:

```txt
Any app, any workflow, any integration, any complexity, in one day.
```

The promise is:

```txt
A scoped internal business system, delivered quickly because the platform already exists.
```

The correct sales posture is:

```txt
We can deliver fast because we do not start from zero.
```

---

# 11. AppCare Economics

AppCare is the most important long-term revenue line.

It should become predictable recurring revenue.

But AppCare only works if support cost stays low.

Support cost stays low when:

```txt
clients use the same platform
modules share patterns
bugs are fixed globally
tests prevent regressions
monitoring catches issues early
training reduces confusion
scope is controlled
custom code is rare
configuration is standard
```

Support cost grows when:

```txt
client-specific forks exist
module code is inconsistent
permissions are unclear
tenant bugs require manual investigation
data corrections are frequent
AppCare is treated as unlimited labor
integrations are promised casually
runtime AI/file uploads/jobs are added without controls
```

Therefore, AppCare must be protected by architecture and contract language.

---

# 12. What AppCare Includes

Standard AppCare may include:

```txt
hosting operations
basic uptime monitoring
error monitoring
security updates
bug fixes
backup checks
basic restore readiness
small configuration assistance
platform maintenance
module bug fixes
standard platform improvements
AI-assisted internal support
monthly operational review
```

Bug fixes are included because bugs weaken the product.

Security fixes are included because platform trust depends on them.

Small configuration help is included because it reduces churn and keeps clients successful.

---

# 13. What AppCare Excludes Unless Separately Priced

Standard AppCare does not automatically include:

```txt
new module development
major workflow changes
complex reports
custom dashboards
third-party integrations
file upload systems
runtime AI features
large data cleanup
large imports/migrations
dedicated infrastructure
custom SLAs
industry-specific compliance consulting
client staff admin labor
hardware support
accounting/legal/payroll advisory
```

This exclusion list protects margins.

It also protects the product from becoming inconsistent.

---

# 14. Bug vs Enhancement Rule

A request is a bug if:

```txt
the platform does not behave according to approved spec
an existing feature fails
security rules are violated
permissions do not work as designed
tenant isolation fails
known acceptance criteria are not met
```

A request is an enhancement if:

```txt
client wants new behavior
client wants a new field not previously scoped
client wants a different workflow
client wants an integration
client wants a new report
client wants a new module
client wants a deferred service
```

Bug fixes are usually AppCare.

Enhancements require scope review.

---

# 15. New Module Economics

A new module can start because one client needs it.

That is acceptable if the module is built as a clean platform module, not a client fork.

Example:

```txt
Client: logistics company
Request: fleet maintenance tracking
Decision: build Fleet as draft module
Enabled for: that client first
Future: reusable for logistics clients
```

Rules for one-client modules:

```txt
must follow module spec template
must use SDK
must use PlatformContext
must not import Kernel internals
must not duplicate Business Objects
must include security tests
must be enabled through OrgModule
must not contain client-specific naming in code
```

Commercially, one-client modules should usually be priced higher than standard module setup because they create product development work.

Possible pricing categories:

```txt
standard module setup
module extension
new draft module
premium vertical module
custom enterprise module
```

Do not promise new reusable modules at the base setup price unless strategically intentional.

---

# 16. Platform Service Economics

Platform Services are expensive because they add shared infrastructure.

Examples:

```txt
Approval Workflow Service
Notification Service
Attachment Service
Audit Log Service
Activity Feed Service
Reporting Service
Search Service
Background Jobs
Dynamic Forms
Dynamic CRUD
```

Each one may require:

```txt
database tables
SDK APIs
permissions
UI surfaces
module integration
migration planning
backup implications
monitoring
security tests
support documentation
training
```

Therefore, a Platform Service should not be built because one client casually asks for it.

It should be built after repeated independent use cases prove the platform-level need.

This protects both engineering velocity and commercial margins.

---

# 17. Dedicated Infrastructure Economics

Dedicated infrastructure is not part of the standard OneDayOS offer.

Normal clients use shared OneDayOS-owned infrastructure.

Dedicated infrastructure may be offered later for premium/enterprise clients.

Possible triggers:

```txt
large contract value
strict compliance requirements
client requires infrastructure ownership
custom SLA
high data sensitivity
data residency needs
enterprise procurement requirement
```

Dedicated infrastructure should require:

```txt
separate setup fee
higher monthly AppCare
separate backup monitoring
separate migration process
separate incident response
clear support contract
```

It must not be offered at standard AppCare pricing.

---

# 18. Infrastructure Cost Model

The MVP business model assumes:

```txt
OneDayOS-owned Vercel account/team
OneDayOS-owned Supabase organization
one production platform
one staging platform
one shared production database
many tenant organizations
```

This minimizes operational burden and allows platform updates to benefit all clients.

But it also means shared-infrastructure risk must be handled through:

```txt
MFA
least-privilege access
at least two trusted owners
backups
restore drills
staging environment
migration discipline
monitoring
incident response
external backup planning
```

This is why AppCare is part of the business model.

OneDayOS is not just selling software.

It is operating the platform.

---

# 19. AI Business Model

AI has two separate business roles.

## 19.1 Development AI

Allowed now:

```txt
ChatGPT for architecture and planning
Claude Code for implementation from frozen specs
AI-assisted test writing
AI-assisted documentation
AI-assisted code review
```

This improves internal delivery speed.

It should not be separately sold to clients yet.

## 19.2 Runtime AI

Deferred:

```txt
in-app chatbot
AI support agent
AI reporting
AI query
AI data actions
AI CRUD generation inside production
embeddings / vector search
RAG over client data
```

Runtime AI should become premium only after security, cost, permissions, prompt-injection defenses, and product value are clear.

AI must not become an unpriced cost sink.

---

# 20. Future Marketplace Model

A future marketplace may allow OneDayOS to distribute modules more broadly.

But MVP should not build marketplace infrastructure.

Marketplace readiness means:

```txt
stable module manifests
module versioning
SDK compatibility contracts
module docs
permissions
settings
events
tests
upgrade paths
```

Do not confuse marketplace readiness with marketplace implementation.

The first goal is reusable internal modules.

The marketplace comes later.

---

# 21. Subscription and Plan Model

The system should support subscription records early, but billing automation can come later.

MVP subscription concepts:

```txt
plan
status
maxUsers
maxModules
storageGb
trialEndsAt
renewsAt
```

Example statuses:

```txt
trial
active
suspended
cancelled
```

Important rule:

```txt
Subscription status is not tenant deletion.
```

If a client is suspended:

```txt
login may still work
module access may be blocked
client data is preserved
billing/support process decides next step
```

Do not delete client data because of billing status without a formal retention/deletion policy.

---

# 22. Module Enablement vs Subscription vs Permission

These are separate gates.

```txt
Subscription = what the organization is commercially allowed to use.
OrgModule = what modules are enabled for the organization.
Permission = what a user can do inside enabled modules.
```

Example:

```txt
Client has Inventory included in plan.
Inventory is enabled for the organization.
Staff user has inventory.stock_balance.read only.
Admin has more permissions.
```

A user should not see a module simply because the organization pays for it.

The user must also have permission.

This separation protects security and supports commercial packaging.

---

# 23. Sales Promise Rules

Sales language must match architecture.

Allowed:

```txt
“We configure OneDayOS for your workflow.”
“You get your own secure organization inside the platform.”
“We can enable Inventory and Leave for your team.”
“AppCare covers hosting, monitoring, maintenance, backups, and bug fixes.”
“New custom workflows can be quoted separately.”
```

Avoid:

```txt
“You get your own app codebase.”
“You get your own database.”
“Everything is customizable.”
“Any request is included in AppCare.”
“We can build any module in one day.”
“Zero downtime guaranteed.”
“Zero data loss guaranteed.”
“AI can do anything in your system.”
```

Commercial promises must not exceed operational reality.

---

# 24. Client Ownership Model

Standard clients own their business data contractually, but they do not operate the infrastructure.

Standard clients receive:

```txt
OneDayOS login access
configured organization
enabled modules
role-based access
AppCare support
handover documentation
```

Standard clients do not receive:

```txt
GitHub repository access
Supabase dashboard access
Vercel dashboard access
Prisma migration access
database credentials
service role keys
source code ownership
infrastructure ownership
```

Future enterprise terms may differ, but that requires separate agreement and pricing.

---

# 25. Data and Export Commercial Position

Clients may need access to their data.

OneDayOS should support responsible exports over time.

But export is not the same as direct database access.

MVP position:

```txt
client data remains tenant-scoped inside OneDayOS
export features require explicit module support and export permissions
manual founder-assisted exports may be allowed under controlled processes
raw DB access is not offered to normal clients
```

This protects tenant isolation, security, and platform integrity.

---

# 26. Bad Business Model Anti-Patterns

## 26.1 Per-client forks

```txt
client-a app
client-b app
client-c app
```

This destroys update speed and AppCare margins.

## 26.2 Unlimited customization

```txt
Every field, layout, workflow, and report customized per client.
```

This turns OneDayOS into bespoke software.

## 26.3 Building all Platform Services upfront

```txt
Audit Log + Notifications + Workflow + Attachments + Dynamic Forms + AI before real modules.
```

This delays revenue and creates abstractions before patterns are known.

## 26.4 Underpricing high-risk domains

```txt
Healthcare, payroll, finance, legal, government-ID-heavy workflows at standard base price.
```

This creates privacy, support, and compliance risk.

## 26.5 AppCare as unlimited labor

```txt
Client pays ₱3,500/month and expects ongoing feature development.
```

This breaks the recurring model.

## 26.6 Client-owned infrastructure by default

```txt
Every normal SME gets their own Supabase project and Vercel deployment.
```

This increases operational burden before revenue justifies it.

---

# 27. Good Business Model Patterns

## 27.1 Productized setup

```txt
Discovery brief
Scope lock
Configuration
Module enablement
Training
Handover
AppCare
```

## 27.2 Reusable module delivery

```txt
Write module spec
Generate safe scaffold
Implement with Claude
Test security boundaries
Enable per organization
Improve module for future clients
```

## 27.3 Platform compounding

```txt
One bug fix improves all clients.
One design improvement improves all modules.
One module enhancement helps future clients.
One security hardening protects the shared platform.
```

## 27.4 Clear upsell surfaces

```txt
more modules
more users
premium support
premium AI
integrations
dedicated infrastructure
custom vertical modules
```

---

# 28. Financial Decision Filters

Before accepting work, ask:

```txt
Will this improve the platform or only one client?
Can this be configured instead of coded?
Can this become a reusable module?
Will this increase AppCare support burden?
Does the price cover the operational complexity?
Does this require a deferred Platform Service?
Does this introduce security, privacy, or compliance risk?
Will this make future updates harder?
```

If the answer is bad, do not accept the request under standard pricing.

---

# 29. How This Document Affects Engineering

Engineering decisions must support:

```txt
low operational cost
shared updates
module reuse
safe tenant isolation
standardized UI
fast client onboarding
predictable AppCare
scope control
future add-on revenue
```

Therefore, Claude must not:

```txt
create client-specific folders
create per-client infrastructure
bypass module enablement
hardcode client rules
add custom fields to Business Objects casually
implement deferred services casually
add runtime AI casually
add file uploads casually
add FastAPI casually
accept client-supplied orgId
use loose orgId service methods
```

Engineering exists to make the business model repeatable.

---

# 30. Implementation Rules for Subscription/Billing Features

When subscription/billing is eventually implemented:

```txt
Do not hardcode commercial pricing into scattered UI components.
Do not let the browser decide plan limits.
Do not let client input decide subscription status.
Do not delete data automatically on cancellation.
Do not expose billing internals to unauthorized users.
Do not couple Stripe/future billing directly into business modules.
```

Preferred future pattern:

```txt
Kernel owns Subscription.
Billing provider integration updates Subscription through controlled server routes/webhooks.
OrgModule and plan limits are enforced server-side.
UI reads safe subscription state.
Modules ask SDK whether capability is available.
```

Stripe or any billing provider is deferred until there is enough paid-client need.

Manual billing is acceptable during early validation.

---

# 31. Manual Billing Is Acceptable Early

During early MVP, OneDayOS may use manual billing outside the app.

That can be acceptable because the bigger risk is building billing too early.

Manual billing may include:

```txt
invoice manually
record subscription status manually
update org subscription record manually through admin script/admin UI
track AppCare externally
```

Do not overbuild billing before product-market fit.

But the database model should still support subscription state so access can be enforced later.

---

# 32. Commercial Readiness Checklist

Before accepting paid clients, the founder should be able to answer:

```txt
[ ] What exactly is included in the initial build?
[ ] What exactly is excluded?
[ ] What does AppCare include?
[ ] What does AppCare exclude?
[ ] What happens if the client asks for a new module?
[ ] What happens if the client asks for an integration?
[ ] What happens if the client asks for file uploads?
[ ] What happens if the client asks for runtime AI?
[ ] What happens if the client asks for dedicated infrastructure?
[ ] What is a bug vs an enhancement?
[ ] How are module add-ons priced later?
[ ] What operational promises are safe to make today?
[ ] What operational promises are not safe yet?
```

If these answers are unclear, sales will create engineering debt.

---

# 33. Founder Operating Rules

The founder should protect the platform by using these rules:

```txt
Do not sell what the platform cannot safely operate.
Do not promise deferred Platform Services as included.
Do not price custom work like standard setup.
Do not allow one client to redefine shared architecture.
Do not confuse fast delivery with unlimited scope.
Do not treat AppCare as unlimited development.
Do not accept high-risk domains without premium pricing and review.
Do not let every client request become a platform feature.
```

The founder should say:

```txt
“That is possible, but it is outside the standard one-day scope.”
“That should be a future module improvement.”
“That requires a separate quote.”
“That is not supported in the current version.”
“That belongs in AppCare as a bug fix.”
“That is a Platform Service candidate, but we need repeated use cases before building it.”
```

---

# 34. Claude Implementation Rules

Claude must not implement billing, subscription enforcement, plan limits, payment provider integration, or pricing UI from this document alone.

This document is business doctrine, not a billing implementation spec.

Before Claude implements billing/subscription features, there must be a dedicated implementation document defining:

```txt
data model
plan names
subscription statuses
billing provider decision
webhook handling
manual override process
permissions
API routes
UI screens
tests
migration plan
failure handling
```

Claude may use this document to understand why the platform must avoid:

```txt
client forks
per-client infrastructure
unpriced custom work
casual Platform Services
unbounded AI/storage/jobs
```

---

# 35. Acceptance Criteria

This document is ready to freeze when:

```txt
[ ] Founder agrees with the initial build positioning.
[ ] Founder agrees with AppCare boundaries.
[ ] Founder agrees that normal clients do not get separate infrastructure.
[ ] Founder agrees that source code/infrastructure access is not included for normal clients.
[ ] Founder agrees that new modules may be priced separately.
[ ] Founder agrees that Platform Services are not built for one casual request.
[ ] Founder agrees that runtime AI, integrations, file uploads, and dedicated infrastructure are premium/deferred surfaces.
[ ] Founder agrees that AppCare is not unlimited development.
[ ] Founder agrees that commercial promises must match operational readiness.
```

---

# 36. Final Rule

```txt
OneDayOS must make every new client cheaper to serve than the last one.
```

If a client makes the platform more reusable, the business compounds.

If a client creates a custom fork, hidden support burden, or unpriced operational risk, the business weakens.

The business model and architecture must therefore protect each other.

