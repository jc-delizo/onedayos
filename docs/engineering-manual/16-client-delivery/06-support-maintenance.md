# OneDayOS Engineering Manual — 16 Client Delivery / 06 Support & Maintenance

**Document ID:** `16-client-delivery/06-support-maintenance.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before First Paid AppCare Client  
**Owner:** Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Related Documents:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/04-authorization-enforcement.md`
- `05-sdk/00-sdk-overview.md`
- `06-data/07-backup-restore.md`
- `13-security/08-production-readiness-gate.md`
- `15-deployment-operations/04-monitoring-observability.md`
- `15-deployment-operations/06-appcare-operations.md`
- `15-deployment-operations/07-incident-response.md`
- `16-client-delivery/00-one-day-delivery-playbook.md`
- `16-client-delivery/01-client-discovery.md`
- `16-client-delivery/02-scope-control.md`
- `16-client-delivery/03-client-configuration.md`
- `16-client-delivery/04-user-training.md`
- `16-client-delivery/05-handover.md`

---

# 1. Purpose

This document defines how OneDayOS handles client support and maintenance after handover.

Support and maintenance are not side activities. They are part of the OneDayOS business model.

The commercial promise is:

```txt
Initial Build
+ AppCare
= client receives a working business system that remains hosted, monitored, maintained, secured, and supported
```

But AppCare must not become unlimited custom development.

The purpose of this document is to protect:

```txt
client trust
platform quality
support profitability
founder sanity
AppCare margins
architecture consistency
shared-platform maintainability
```

---

# 2. Core Principle

```txt
Support the shared platform.
Do not become a custom software department for every client.
```

OneDayOS should support clients through:

```txt
stable platform updates
clear scope boundaries
repeatable support workflows
configuration-first changes
regression-tested bug fixes
safe maintenance practices
documented AppCare coverage
```

OneDayOS should not support clients through:

```txt
per-client code forks
untracked direct database edits
unlimited new features
hidden support backdoors
casual production patches
custom infrastructure per normal client
unbounded founder labor
```

---

# 3. Relationship to AppCare

AppCare is the recurring service layer behind OneDayOS.

AppCare includes:

```txt
hosting operations
platform monitoring
security updates
backup checks
bug fixes
maintenance
limited configuration assistance
AI-assisted internal support
platform improvements
```

AppCare does not automatically include:

```txt
new modules
new integrations
custom dashboards
custom reports
runtime AI features
file upload systems
workflow engines
complex data migration
dedicated infrastructure
unlimited training
ongoing client admin work
client-specific code changes
```

The simple boundary is:

```txt
Bug = included.
Configuration help = limited included.
Enhancement = scoped separately.
New module = scoped separately.
Platform Service = promoted only after evidence.
Client-specific fork = rejected.
```

---

# 4. Definitions

## 4.1 Support

Support means helping a client successfully use the system that was delivered and approved during handover.

Examples:

```txt
user cannot log in
client admin forgot where to manage roles
module page shows an error
data import did not load as expected
permission appears incorrect
client asks how to add a user
client asks how to configure a branch
```

## 4.2 Maintenance

Maintenance means keeping the shared OneDayOS platform healthy.

Examples:

```txt
security dependency updates
bug fixes
database migration checks
backup verification
monitoring review
performance review
regression tests
platform cleanup
minor UX refinements
```

## 4.3 Bug

A bug is behavior where OneDayOS fails to do what was approved, documented, delivered, and reasonably expected.

Examples:

```txt
authorized user cannot access enabled module
unauthorized user can access restricted page
table fails to load valid records
form saves wrong value
API returns HTML instead of JSON
soft-deleted records appear in normal list
cross-tenant access is possible
```

Bugs are included in AppCare.

## 4.4 Enhancement

An enhancement is a request for behavior not included in the approved delivery scope.

Examples:

```txt
add new report
add approval workflow
add Excel import
add email notifications
add new module field
add dashboard widget
add export format
add integration with accounting software
```

Enhancements are not automatically included in AppCare.

## 4.5 Configuration Request

A configuration request is a client-specific setup change that uses existing platform capabilities.

Examples:

```txt
enable a module
disable a module
add user
update role
change module setting
change company logo
add branch
add department
adjust permission assignment
```

Minor configuration support may be included in AppCare, but ongoing administrative work should not become unlimited labor.

## 4.6 Data Correction

A data correction is a controlled change to client data caused by incorrect import, user mistake, or operational cleanup.

Examples:

```txt
remove duplicated imported products
correct wrong employee numbers
restore accidentally deleted supplier
fix imported customer phone format
```

Data corrections must be handled carefully because OneDayOS uses a shared production database.

## 4.7 Incident

An incident is a production-impacting event requiring urgent investigation, containment, communication, and postmortem.

Examples:

```txt
platform outage
cross-tenant data exposure
production secret leak
authentication failure affecting many users
bad migration corrupting data
backup restore failure
```

Incidents follow the Incident Response document, not normal support flow.

---

# 5. Support Classification Ladder

Every support request must be classified before work starts.

```txt
1. Usage question
2. Bug
3. Minor configuration request
4. Data correction
5. Enhancement
6. New module request
7. Platform Service candidate
8. Integration request
9. Dedicated infrastructure request
10. Security/privacy incident
11. Bad-fit request
```

Do not let every support message become an implementation task.

---

# 6. Support Request Intake

Every support request should capture enough information to reproduce or classify it.

Minimum support intake fields:

```txt
client organization
requester name
requester email
affected module
affected page or URL
what the user expected
what actually happened
screenshot or short screen recording, if useful
steps to reproduce
urgency
number of affected users
when it started
whether data appears wrong or missing
```

Do not accept vague requests like:

```txt
The app is broken.
Inventory does not work.
Please fix ASAP.
```

Respond by asking for reproduction information, unless the issue is clearly a major incident.

---

# 7. Support Severity Levels

Support severity is different from engineering priority.

## 7.1 SEV-0 — Critical Incident

Examples:

```txt
cross-tenant data exposure
platform unavailable for all clients
production database corruption
production secret leaked
client can access another client's data
security vulnerability being actively exploited
```

Required response:

```txt
enter incident response mode
contain first
communicate carefully
preserve evidence
patch safely
add regression tests
write postmortem
```

## 7.2 SEV-1 — Major Client Impact

Examples:

```txt
one client cannot access core module
multiple users blocked from daily operations
critical form cannot submit
wrong permissions block entire department
recent deployment broke production workflow
```

Required response:

```txt
prioritize investigation
identify workaround if possible
fix through normal patch process or hotfix process
add regression test
communicate status to client contact
```

## 7.3 SEV-2 — Normal Bug or Support Issue

Examples:

```txt
single user has issue
non-critical page error
minor display bug
role needs adjustment
configuration clarification
```

Required response:

```txt
triage
classify
fix or schedule
document if repeated
```

## 7.4 SEV-3 — Enhancement / Future Request

Examples:

```txt
new dashboard
extra report
new workflow
integration
AI feature
file upload
approval rules
```

Required response:

```txt
classify as enhancement
do not promise immediately
review scope and pricing
log as product/module/platform candidate if reusable
```

---

# 8. AppCare Coverage

## 8.1 Included in Standard AppCare

Standard AppCare may include:

```txt
platform hosting operations
basic uptime monitoring
application error monitoring
security dependency updates
bug fixes
minor platform patches
backup verification checks
limited configuration support
minor permission support
basic user-access troubleshooting
module behavior support for delivered modules
client guidance based on delivered workflow
internal AI-assisted troubleshooting
```

## 8.2 Not Automatically Included

Standard AppCare does not automatically include:

```txt
new modules
new business workflows
new reports beyond delivered scope
new dashboards beyond delivered scope
integrations
custom APIs
customer portals
advanced analytics
file attachments
approval workflow engine
notification engine
runtime AI assistant
mass data cleanup
complex data migration
ongoing client data entry
unlimited retraining
dedicated Supabase project
dedicated Vercel deployment
client-owned infrastructure management
custom CSS/layout/design per client
```

## 8.3 Included Only With Approval

These require founder/architect review:

```txt
direct production data correction
bulk import after handover
module-local file handling
new module creation
sensitive-field handling
healthcare/payroll/government-ID workflows
dedicated infrastructure
cross-module reporting
AI data access
third-party integrations
```

---

# 9. Bug Fix Policy

Bug fixes are platform improvements.

Because OneDayOS uses one shared platform, a bug fix normally benefits all clients after deployment.

Correct model:

```txt
fix bug once
add regression test
deploy shared platform
all affected organizations benefit
```

Wrong model:

```txt
patch Client A manually
copy patch to Client B later
leave Client C broken
create client-specific branch
```

## 9.1 Bug Fix Requirements

A bug fix should include:

```txt
root cause identified
code fix
relevant test added or updated
architecture check if needed
typecheck passing
tests passing
build passing
safe deployment plan
```

## 9.2 Security Bug Requirements

A security bug fix must include:

```txt
containment
root cause
regression test
architecture check if possible
incident classification
client communication if needed
postmortem if serious
```

Security bugs include:

```txt
cross-tenant access
permission bypass
API auth redirect bug
client-supplied orgId accepted
secret exposure
wrong data export
sensitive data in logs/events/AI context
```

---

# 10. Configuration Support Policy

Configuration support is allowed when it uses existing platform capabilities.

Examples:

```txt
enable Inventory for org
add new staff user
assign Staff role
create custom role from existing permissions
add branch
add department
adjust module setting
change logo
update organization name
```

Configuration changes must not require code changes unless the request becomes an enhancement.

## 10.1 Configuration Safety Rules

```txt
use admin UI when available
use approved provisioning scripts when admin UI does not exist
never use client-supplied orgId directly
never change another organization's configuration accidentally
record what changed
verify with client after change
```

## 10.2 Configuration Anti-Patterns

Forbidden:

```txt
manual database edits without record
editing production data from memory
changing permissions without client admin approval
creating hidden admin accounts
using service role casually
copying settings from one org to another without review
```

---

# 11. Data Correction Policy

Data correction is sometimes necessary, but it is dangerous.

Because OneDayOS uses one shared production database, even a small data script can affect multiple clients if written incorrectly.

## 11.1 Allowed Data Corrections

Allowed with review:

```txt
restore accidentally soft-deleted record
fix wrong imported value
remove duplicated records from one import
correct broken relation caused by import bug
repair data after confirmed platform bug
```

## 11.2 Data Correction Requirements

Before data correction:

```txt
identify affected organization
identify affected records
confirm source of truth
write dry-run script when possible
avoid raw SQL unless explicitly approved
use verified tenant context or exact org scoping
backup or snapshot if risk is meaningful
run in staging when possible
record before/after summary
```

After data correction:

```txt
verify with client
record what changed
add regression test if caused by platform bug
update import/provisioning script if caused by process bug
```

## 11.3 Data Correction Forbidden Patterns

Forbidden:

```txt
UPDATE products SET ... without orgId
DELETE FROM ... in production without approval
hard-deleting business records casually
using production SQL copied from AI without review
repairing data across all tenants when only one org is affected
letting Claude write and run production data scripts without human review
```

---

# 12. Maintenance Categories

## 12.1 Application Maintenance

Includes:

```txt
bug fixes
security patches
dependency updates
framework upgrades when approved
UI consistency fixes
API contract fixes
permission enforcement fixes
tenant-isolation fixes
```

## 12.2 Database Maintenance

Includes:

```txt
Prisma migrations
index review
migration verification
seed/provisioning improvements
backup checks
restore drills
safe backfills
soft-delete cleanup strategy later
```

## 12.3 Infrastructure Maintenance

Includes:

```txt
Vercel deployment health
Supabase project health
environment variables
billing health
monitoring tools
error tracking
uptime checks
backup provider status
```

## 12.4 Security Maintenance

Includes:

```txt
secret rotation when needed
access review
MFA enforcement
dependency security review
permission model review
log privacy review
test hardening
incident postmortems
```

## 12.5 Documentation Maintenance

Includes:

```txt
client help docs
training notes
handover template
known limitations
support macros
Founder Guide
Engineering Manual amendments
```

---

# 13. Recurring Maintenance Checklist

## 13.1 Daily / Frequent Checks

Minimum frequent checks:

```txt
review application error tracker
review uptime monitor status
review failed deployments
review urgent support messages
review production incident alerts
```

Do not turn daily checks into manual overwork. Use provider alerts where possible.

## 13.2 Weekly Checks

Weekly checks:

```txt
review unresolved support tickets
review recent errors by module
review slow or failing API patterns
review failed auth/login reports
review backup status
review upcoming dependency/security updates
review recent client requests for repeated patterns
```

## 13.3 Monthly Checks

Monthly checks:

```txt
review AppCare clients
review support workload by client
review infrastructure costs
review backup/restore readiness
review active modules per client
review deferred service evidence log
review repeated enhancement requests
review security exceptions
review documentation gaps
```

## 13.4 Quarterly Checks

Quarterly checks:

```txt
restore drill if production risk justifies it
access review for Supabase, Vercel, GitHub, monitoring tools
review AppCare pricing vs workload
review platform roadmap
review whether any deferred service has enough evidence
review dedicated infrastructure candidates
```

---

# 14. Support Workflow

## 14.1 Normal Support Workflow

```txt
1. Receive request.
2. Capture required context.
3. Classify request.
4. Determine severity.
5. Check whether covered by AppCare.
6. Reproduce if bug.
7. Fix, configure, explain, or quote separately.
8. Verify result.
9. Communicate resolution.
10. Add documentation or regression test if needed.
```

## 14.2 Bug Workflow

```txt
1. Reproduce bug.
2. Identify affected client(s).
3. Identify whether tenant/security-sensitive.
4. Create failing test if possible.
5. Fix in shared platform.
6. Run check commands.
7. Deploy through approved process.
8. Confirm resolution.
9. Update regression coverage.
```

## 14.3 Enhancement Workflow

```txt
1. Classify enhancement.
2. Check if configuration can solve it.
3. Check if existing module extension can solve it.
4. Check if new module is justified.
5. Check if Platform Service evidence exists.
6. Quote/schedule/reject/defer.
7. Do not implement during support without approval.
```

## 14.4 Incident Workflow

Use the Incident Response document.

Do not handle incidents as normal support tickets.

---

# 15. Client Admin Responsibility

OneDayOS should empower the client admin.

The client admin is normally responsible for:

```txt
requesting users
confirming role assignments
confirming data corrections
approving configuration changes
triaging staff questions internally when possible
reporting issues with enough detail
communicating business priority
```

OneDayOS should not become the client's internal admin team unless separately contracted.

Examples of client admin work not automatically included:

```txt
creating every staff account forever
manually updating daily data
doing recurring exports for the client
cleaning client-entered data every week
training every new employee one-on-one
```

---

# 16. Support Communication Standards

Support communication should be:

```txt
clear
calm
specific
non-defensive
honest about scope
honest about uncertainty
careful with security/privacy details
```

Avoid:

```txt
making promises before triage
blaming the user
sharing internal stack traces
sharing secrets or IDs unnecessarily
saying a feature is included when it is not
suggesting direct database access to clients
```

## 16.1 Example — Bug Acknowledgement

```txt
Thanks for reporting this. I’ll check whether this is a platform bug or a configuration issue.
Please send the affected page, user email, what you expected to happen, and a screenshot if available.
```

## 16.2 Example — Enhancement Boundary

```txt
This is not part of the current delivered scope, but it looks like a valid enhancement request.
I’ll classify it and confirm whether it should be handled as configuration, a module improvement, or a separate paid change.
```

## 16.3 Example — Deferred Service Boundary

```txt
That feature is on the long-term platform roadmap, but it is not included in the current module yet.
For now, we can either use the existing workflow or review this as a separate enhancement.
```

## 16.4 Example — Data Correction Caution

```txt
Because this changes production data, I’ll first confirm the affected records and prepare the safest correction path.
We do not make direct database changes casually because multiple client organizations share the same platform database.
```

---

# 17. AppCare Change Request Classification

Use this table when a client asks for something after handover.

| Request | Classification | AppCare Included? | Action |
|---|---|---:|---|
| User cannot log in | Support / Bug | Yes | Investigate auth/user status |
| Add one user | Minor configuration | Usually yes if limited | Use admin/provisioning flow |
| Add 100 users from messy Excel | Data import / enhancement | No, unless included | Quote separately |
| Button causes server error | Bug | Yes | Fix + regression test |
| Add approval workflow | Enhancement / Platform Service candidate | No | Scope separately |
| Add photo uploads | Enhancement / Attachment candidate | No | Scope separately |
| Build new Fleet module | New module | No | Discovery + module spec |
| Client wants own Supabase project | Dedicated infrastructure | No | Premium/enterprise review |
| Data from another client visible | Incident / SEV-0 | Yes, critical | Incident response |
| Export all records monthly for client | Operational admin labor | No by default | Quote or build export feature if approved |
| Change company logo | Configuration | Usually yes | Use settings |
| Custom dashboard per manager | Enhancement | No | Scope separately |
| Add field unique to one client | Module extension or custom request | Depends | Review architecture |

---

# 18. Platform Updates and Existing Clients

Because OneDayOS is one shared platform, platform updates can affect multiple clients.

Correct mental model:

```txt
shared code update
+ shared database migration if needed
+ per-org configuration
= clients receive updated platform behavior based on enabled modules and permissions
```

Existing clients should not be updated through separate manual patching.

## 18.1 Safe Update Requirements

Before deploying an update that affects clients:

```txt
tests pass
architecture checks pass
migration reviewed if any
staging verified if meaningful
known affected modules identified
rollback/forward-fix path understood
client communication prepared if visible change
```

## 18.2 Feature Visibility

A platform feature may exist in code but not be visible to all clients.

Visibility depends on:

```txt
module enablement
plan/subscription
feature flags
settings
permissions
UI route exposure
```

---

# 19. Support for Draft vs Official Modules

## 19.1 Draft Module

A draft module is early, possibly built for one client first.

Support rules:

```txt
known limitations must be documented
client must know it is early if relevant
bugs still get fixed
feature expansion is not automatically included
use-case evidence should be logged
```

## 19.2 Official Module

An official module has passed module readiness gates.

Support rules:

```txt
stronger regression expectations
better documentation
clearer AppCare coverage
usable by multiple clients
safer generator/spec pattern
```

## 19.3 Module-Specific Support

Module-specific support should never violate platform boundaries.

Examples:

```txt
Inventory support must not duplicate Product.
Leave support must not duplicate Employee.
CRM support must not duplicate Customer.
Assets support must not invent its own Supplier.
```

---

# 20. Deferred Platform Services in Support

Deferred Platform Services must not be promised during support.

Examples of deferred services:

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
Runtime AI
```

If a client requests one of these capabilities:

```txt
1. Classify the use case.
2. Check if module-local solution is enough.
3. Log evidence.
4. Do not build the Platform Service unless promotion criteria are met.
5. Quote separately if needed.
```

Support must not turn deferred services into accidental rushed implementations.

---

# 21. Security and Privacy Support

Security/privacy support issues must be escalated immediately.

Examples:

```txt
wrong client data visible
unauthorized user can access page
export contains sensitive fields
logs contain personal data
AI context includes private data
service key exposed
user from old client still has access
```

Support agent/founder must not:

```txt
speculate publicly
share internal details unnecessarily
promise legal conclusions
hide incidents
patch without regression tests
send production secrets to Claude
```

Security bugs are not normal support tickets.

---

# 22. Production Access During Support

Production access must be limited.

Allowed production access:

```txt
founder/operator access to Vercel/Supabase/GitHub as needed
approved engineer access using least privilege
read-only observation where possible
controlled scripts for approved data correction
```

Forbidden:

```txt
client access to Supabase dashboard
client access to Vercel dashboard
client access to GitHub repo
client access to production database
sharing service role key
using support backdoor to impersonate client without design
hidden OneDayOS staff bypass
```

Future internal support tooling should be designed separately. Do not hack support access into tenant logic.

---

# 23. Support Tooling

Do not build custom support software in MVP.

Use boring tools first:

```txt
email
Linear
GitHub Issues
Notion
Google Drive
Slack/Discord only if controlled
Sentry or equivalent for errors
Vercel/Supabase dashboards
```

A custom support portal is deferred.

A custom ticketing system is deferred.

AI support agent is deferred.

---

# 24. Documentation and Knowledge Base

Repeated support questions should become documentation.

Documentation candidates:

```txt
how to add a user
how to assign a role
how to reset password
how to enable module
how to import starting data
how to understand Product vs Inventory
how to understand User vs Employee
how AppCare works
what is included / not included
how to report a bug
```

Documentation reduces support cost and improves AppCare margin.

---

# 25. Founder Guide Relationship

This Engineering Manual is for architecture and implementation.

A separate Founder Guide should explain support and operations in plain language.

Recommended Founder Guide documents:

```txt
founder-guide/00-how-onedayos-works.md
founder-guide/01-clients-tenants-and-infrastructure.md
founder-guide/02-updates-deployments-and-appcare.md
founder-guide/03-backups-outages-and-disaster-recovery.md
founder-guide/04-support-scope-and-client-requests.md
founder-guide/05-when-to-offer-dedicated-infrastructure.md
```

The Founder Guide should not replace this document. It should make this document understandable operationally.

---

# 26. Claude Code Rules

Claude may help with support and maintenance, but only inside controlled boundaries.

Claude may:

```txt
analyze sanitized error logs
write regression tests
fix scoped bugs
update documentation
draft client-facing explanations
write migration scripts for review
write data correction dry-run scripts
review module code against the manual
```

Claude must not:

```txt
receive production secrets
receive service role keys
receive raw production database dumps casually
run production migrations
run production data correction scripts
decide client compensation/legal/privacy notification
create per-client forks
create hidden support backdoors
add deferred Platform Services casually
implement new features from support chat alone
```

## 26.1 Claude Support Prompt Template

```md
You are assisting with a OneDayOS support issue.

Authoritative documents:
- docs/engineering-manual/16-client-delivery/06-support-maintenance.md
- docs/engineering-manual/13-security/08-production-readiness-gate.md
- docs/engineering-manual/15-deployment-operations/07-incident-response.md

Issue classification:
[bug/configuration/data correction/enhancement/incident]

Client organization:
[org slug or sanitized org reference]

Scope:
[exact approved scope]

Rules:
- Do not request or expose production secrets.
- Do not suggest direct production DB edits unless explicitly approved.
- Do not accept client-supplied orgId patterns.
- Do not bypass PlatformContext.
- Do not create client-specific forks.
- Add regression tests for bug fixes.
- Stop and report if this is a security/privacy incident.

Task:
[exact task]
```

---

# 27. Maintenance Release Rules

A maintenance release is a platform update that improves stability, security, or correctness.

Examples:

```txt
fix API auth error shape
fix permission bug
fix sidebar active matching
fix soft-delete visibility
update dependencies
improve monitoring
improve error messages
add regression tests
```

Maintenance releases should not sneak in:

```txt
new unapproved features
new modules
new Platform Services
schema changes without migration review
client-specific behavior
runtime AI
file upload systems
```

---

# 28. Hotfix Rules

Hotfixes are allowed for serious production issues, but they still need discipline.

Hotfix requirements:

```txt
minimal change
clear affected area
no unrelated refactors
manual verification
regression test added immediately or as part of follow-up
post-hotfix review
```

Hotfixes must not become the normal delivery style.

---

# 29. AppCare Suspension and Cancellation

If a client stops paying AppCare or contractually cancels:

Possible actions:

```txt
mark Subscription status as suspended or cancelled
block module access if required by business policy
preserve client data for agreed retention period
avoid deleting data immediately
communicate access/export policy clearly
```

Do not:

```txt
delete tenant data casually
hard-delete organization records
reuse org slug immediately
remove records without retention policy
```

Suspension should be a Kernel/subscription state, not a manual code path.

---

# 30. Dedicated Infrastructure Support

Dedicated infrastructure is not part of standard AppCare.

If offered later, it requires separate terms.

Dedicated infrastructure may include:

```txt
separate Supabase project
separate Vercel project
separate database
separate monitoring
separate backup policy
separate migration process
custom SLA
higher AppCare fee
```

Do not provide dedicated infrastructure casually.

Dedicated infrastructure reduces shared-platform blast radius, but increases operational burden.

---

# 31. Anti-Patterns

Forbidden support and maintenance anti-patterns:

```txt
"I'll just edit the database quickly."
"This is just for one client, so I'll fork it."
"I'll add this Platform Service while fixing their issue."
"I'll give the client Supabase access."
"I'll put a hidden orgId field in the form."
"I'll ask Claude to fix production using the service role key."
"I'll skip tests because it's urgent."
"I'll patch generated files but leave the generator broken."
"I'll treat an enhancement as a bug to keep the client happy."
"I'll promise it now and figure out architecture later."
```

These are how a platform becomes unmaintainable.

---

# 32. Acceptance Criteria

This document is accepted when:

```txt
[ ] AppCare boundaries are clear.
[ ] Bugs, enhancements, configuration, data correction, incidents, and new modules are distinguishable.
[ ] Support workflow is documented.
[ ] Maintenance checklist is documented.
[ ] Data correction rules are documented.
[ ] Security/privacy escalation rules are documented.
[ ] Claude support rules are documented.
[ ] Client admin responsibilities are documented.
[ ] Deferred Platform Service boundaries are documented.
[ ] Per-client forks are explicitly rejected.
[ ] Dedicated infrastructure is treated as premium/enterprise, not default.
```

---

# 33. Implementation Checklist Before First Paid AppCare Client

Before the first paid AppCare client:

```txt
[ ] Support intake template exists.
[ ] Bug/enhancement classification process exists.
[ ] AppCare included/not-included list exists.
[ ] Client handover references AppCare boundaries.
[ ] Monitoring minimum is active.
[ ] Backup status is known.
[ ] Incident response runbook exists.
[ ] Founder knows how to handle data correction safely.
[ ] Claude support prompt template is available.
[ ] Client-facing support email/channel is decided.
[ ] Internal ticket tracker is selected.
[ ] Support documentation location exists.
```

---

# 34. Final Rule

```txt
Support should make the platform stronger.

Every bug fix should improve OneDayOS for all clients.
Every repeated question should improve documentation.
Every repeated request should inform the roadmap.
Every serious incident should improve tests and operations.

Support must not become untracked custom development.
```
