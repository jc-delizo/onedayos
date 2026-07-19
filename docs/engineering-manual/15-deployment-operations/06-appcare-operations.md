# OneDayOS Engineering Manual — 15.06 AppCare Operations

**Document ID:** `15-deployment-operations/06-appcare-operations.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before AppCare Claims; Operational Practice Required Before First Paid AppCare Client`  
**Owner:** Founder / Platform Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `01-foundation/01-business-model.md`
- `02-architecture/00-system-architecture.md`
- `04-kernel/02-organizations-tenancy.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/07-backup-restore.md`
- `13-security/08-production-readiness-gate.md`
- `15-deployment-operations/00-environments.md`
- `15-deployment-operations/01-vercel-deployment.md`
- `15-deployment-operations/02-supabase-operations.md`
- `15-deployment-operations/03-database-migrations-production.md`
- `15-deployment-operations/04-monitoring-observability.md`
- `15-deployment-operations/05-error-handling.md`

---

# 1. Purpose

This document defines how OneDayOS operates the recurring **AppCare** service.

AppCare is the recurring operational promise behind OneDayOS.

It is not just a subscription label.

It is the system of work that keeps every client organization running on the shared OneDayOS platform.

The commercial offer is:

```txt
AppCare
₱3,500/month

Includes:
- Hosting
- Monitoring
- Security updates
- Backups
- Bug fixes
- AI support
- Maintenance
```

This document explains what those words mean operationally.

---

# 2. Core Principle

AppCare exists because OneDayOS is a shared platform.

The client does not buy a one-off app and then manage hosting themselves.

The client buys:

```txt
OneDayOS
+ enabled modules
+ ongoing AppCare
```

That means OneDayOS is responsible for operating the platform.

The correct mental model is:

```txt
One shared OneDayOS platform
  ├── Organization: Client A
  ├── Organization: Client B
  ├── Organization: Client C
  └── Organization: Client D
```

Not:

```txt
Client A custom app
Client B custom app
Client C custom app
Client D custom app
```

AppCare operations must protect this platform model.

---

# 3. Non-Goals

AppCare does **not** mean:

```txt
unlimited custom development
unlimited new features
per-client app forks
per-client Supabase projects
per-client Vercel projects
custom SLA for every client
24/7 enterprise support by default
manual database edits on request
free module development forever
free data cleanup forever
custom reports outside agreed scope forever
```

AppCare keeps the platform healthy.

It does not turn every future request into free development.

---

# 4. AppCare Scope

## 4.1 Included by default

The base AppCare package includes:

```txt
Hosting
Monitoring
Security updates
Backups
Bug fixes
Platform maintenance
Basic operational support
AI-assisted support where available
Minor configuration assistance
```

## 4.2 Not included by default

The base AppCare package does not include:

```txt
new custom modules
large feature requests
complex data migration
manual data entry
custom integrations
third-party API setup beyond agreed scope
custom analytics/reports outside existing module capability
client-specific infrastructure
dedicated database
dedicated deployment
regulated compliance work
24/7 guaranteed emergency SLA
```

These may be sold as:

```txt
paid module work
paid implementation work
premium AppCare
enterprise AppCare
custom project work
```

---

# 5. AppCare and the Platform Business Model

OneDayOS must keep AppCare operationally lightweight.

At ₱3,500/month, AppCare cannot support chaotic custom infrastructure per client.

Therefore, the default operating model is:

```txt
one codebase
one production deployment
one production database
many tenant organizations
per-org modules
per-org settings
per-org permissions
centralized monitoring
centralized backup strategy
centralized update process
```

This is why the Engineering Manual rejects normal per-client forks.

A per-client fork may seem easier for one client, but it becomes expensive and fragile across many clients.

---

# 6. AppCare Product Boundaries

## 6.1 Bug fix

A bug is behavior that violates the approved implementation spec or expected platform behavior.

Examples:

```txt
A permitted user cannot create a record.
A table crashes when opened.
A saved form submits but does not persist.
A dashboard count is incorrect.
A user gets a 500 error from normal usage.
A module route returns HTML instead of JSON from an API.
A permission check is not enforced.
```

Bug fixes are included in AppCare.

## 6.2 Enhancement

An enhancement is a new or changed behavior that was not part of the approved module scope.

Examples:

```txt
Add a new approval flow.
Add a custom report.
Add SMS notifications.
Add file attachments.
Add a new dashboard widget.
Add custom status lifecycle.
Add integration with accounting software.
```

Enhancements are not automatically included in base AppCare.

They require scope review.

## 6.3 Configuration support

Configuration support means helping the client use existing platform settings.

Examples:

```txt
enable or disable a module
adjust module settings
add users
assign roles
change organization logo
update branch or department records
explain how to use a screen
```

Minor configuration support is included.

Large configuration changes or ongoing admin labor may require paid support.

## 6.4 Data repair

Data repair means correcting incorrect records.

Examples:

```txt
wrong products imported
duplicate customers
incorrect stock numbers entered by user
incorrect employee records
```

Data repair is not automatically included unless the error was caused by a OneDayOS bug.

---

# 7. AppCare Responsibilities

## 7.1 OneDayOS responsibilities

OneDayOS is responsible for:

```txt
keeping the platform online within reasonable operational limits
monitoring for errors and downtime
maintaining the production deployment
maintaining the Supabase project
maintaining database migrations
running backup/restore practices
applying security updates
fixing confirmed bugs
protecting tenant isolation
protecting production secrets
maintaining core module compatibility
communicating major incidents
```

## 7.2 Client responsibilities

The client is responsible for:

```txt
using the system correctly
keeping their own login secure
assigning correct internal users and roles
checking business data accuracy
reporting issues clearly
not sharing accounts
not asking staff to bypass permissions
providing correct source data for onboarding/imports
approving scope changes
paying AppCare on time
```

## 7.3 Shared responsibilities

Some responsibilities are shared:

```txt
data accuracy
user training
access reviews
module configuration
workflow fit
incident communication
```

OneDayOS provides the platform.

The client still owns their business process.

---

# 8. AppCare Operational Model

## 8.1 Normal client model

Normal clients are tenant organizations inside the shared production platform.

```txt
Organization row
Users
Roles
Permissions
Enabled modules
Settings
Business records scoped by orgId
```

They do not receive:

```txt
separate Vercel project
separate Supabase project
separate database
separate code branch
separate GitHub repository
```

## 8.2 Dedicated infrastructure

Dedicated infrastructure is deferred.

It may be offered later as premium or enterprise AppCare.

Possible triggers:

```txt
large client
compliance requirement
custom SLA
client demands infrastructure ownership
high contract value
strict data separation requirement
```

Dedicated infrastructure must not be offered casually.

It requires separate pricing because it increases operational burden.

---

# 9. AppCare Lifecycle

## 9.1 New client activation

A client becomes AppCare-active only after:

```txt
[ ] organization is provisioned
[ ] admin user exists
[ ] roles are assigned
[ ] enabled modules are configured
[ ] agreed module scope is delivered
[ ] smoke test passes
[ ] client can log in
[ ] handover is completed
[ ] AppCare coverage is explained
[ ] billing/subscription status is recorded
```

## 9.2 Active client

An active client receives normal AppCare coverage.

```txt
Subscription.status = active
Organization.isActive = true
```

Active clients can use enabled modules based on roles and permissions.

## 9.3 Trial client

A trial client may receive limited coverage.

```txt
Subscription.status = trial
```

Trial limitations must be clear before onboarding.

Possible limitations:

```txt
limited users
limited modules
limited storage
limited support
limited duration
```

## 9.4 Suspended client

A suspended client should be blocked from normal module usage but should not lose data.

```txt
Subscription.status = suspended
```

Suspension may happen because of:

```txt
payment issue
security issue
contract issue
abuse
manual founder decision
```

Suspended behavior:

```txt
login may still work
billing/support screen may show
business modules should be inaccessible
background jobs for that org should not run unless operationally required
no data should be deleted automatically
```

## 9.5 Cancelled client

Cancelled client behavior must be handled carefully.

```txt
Subscription.status = cancelled
```

Cancellation must not immediately delete data.

Required decisions:

```txt
data retention window
data export process
data deletion request process
reactivation policy
final invoice status
```

A future Client Delivery / Support document should define cancellation and data-retention details more formally.

---

# 10. Daily AppCare Operations

The founder/operator should be able to check platform health quickly.

## 10.1 Daily checks

Daily checks should include:

```txt
[ ] production app reachable
[ ] login flow working
[ ] error tracker checked
[ ] uptime monitor checked
[ ] Vercel deployment status checked
[ ] Supabase project health checked
[ ] no unusual API error spike
[ ] no unresolved critical client issue
```

These checks should take minutes, not hours.

If daily checks require complex manual database inspection, the platform lacks operational maturity.

## 10.2 Daily client support triage

Support inbox should be triaged into:

```txt
critical bug
normal bug
how-to question
configuration request
enhancement request
billing issue
data issue
security concern
```

The category determines whether it is included in AppCare or requires separate scope.

---

# 11. Weekly AppCare Operations

Weekly operations should include:

```txt
[ ] review unresolved errors
[ ] review recent deployments
[ ] review dependency/security notices
[ ] review failed jobs when background jobs exist
[ ] review backup status
[ ] review open support items
[ ] review client onboarding pipeline
[ ] review slow pages or slow APIs
[ ] review unusual database growth
```

Weekly review should identify platform issues before clients complain.

---

# 12. Monthly AppCare Operations

Monthly AppCare operations should include:

```txt
[ ] confirm production backups are running
[ ] perform or schedule restore drill according to restore-drill cadence
[ ] review uptime/error history
[ ] review dependency updates
[ ] review platform costs
[ ] review active clients and subscription states
[ ] review security access to Vercel/Supabase/GitHub
[ ] review modules causing support burden
[ ] review repeated client requests for potential module/platform improvement
[ ] prepare short internal maintenance report
```

Monthly review should help answer:

```txt
Is AppCare still profitable?
Which clients create the most support work?
Which modules create the most bugs?
Which repeated requests should become product improvements?
Which risks are growing?
```

---

# 13. AppCare Before First Production Client

Before the first real paid client, OneDayOS must have a minimal AppCare foundation.

Required:

```txt
[ ] production deployment exists
[ ] staging deployment exists or staging process exists
[ ] production Supabase project exists
[ ] staging Supabase project exists
[ ] environment variables are separated
[ ] production app can be built from a fresh clone
[ ] prisma generate runs during build/check process
[ ] basic monitoring exists
[ ] error tracking exists or is explicitly deferred with founder risk acceptance
[ ] uptime check exists
[ ] backup policy is known
[ ] restore drill plan exists
[ ] incident response draft exists
[ ] client support channel exists
[ ] bug/enhancement distinction is documented
[ ] production readiness gate passes for tenant/security/API basics
```

The first production client does not require enterprise operations.

It does require honesty about what AppCare includes and what risks remain.

---

# 14. AppCare Before Second Tenant

Before onboarding a second tenant in the same production database, AppCare must satisfy the Production Readiness Gate.

Required:

```txt
[ ] tenant isolation tests pass with at least two organizations
[ ] wrong-org route access fails safely
[ ] wrong-org API access fails safely
[ ] client-supplied orgId is rejected
[ ] API auth returns JSON 401, not redirect/HTML
[ ] permission-denial tests pass
[ ] module-disabled tests pass where modules exist
[ ] soft-deleted records are hidden in normal reads
[ ] production backup status is verified
[ ] restore process has at least been rehearsed in staging
```

This is non-negotiable.

A shared platform without tenant-isolation proof is not ready for multiple clients.

---

# 15. Monitoring Under AppCare

AppCare monitoring should cover:

```txt
app availability
auth failures
API error rates
server exceptions
database connectivity
slow routes
failed deployments
backup status
client-reported incidents
```

## 15.1 Minimum monitoring stack

Minimum viable monitoring:

```txt
Vercel deployment status
Vercel runtime logs
Supabase dashboard/logs
application error tracker
external uptime monitor
manual AppCare review checklist
```

Do not build custom monitoring dashboards during MVP.

Use provider tools first.

## 15.2 What should trigger attention

Examples:

```txt
production app unreachable
login broken
sudden spike in 500 errors
cross-tenant access suspicion
database connection failures
failed production deployment
migration failure
repeated API validation errors after deployment
sudden slow page/API behavior
support report from multiple clients
```

---

# 16. Backup and Restore Under AppCare

Backups are part of AppCare.

However, AppCare must not overpromise.

## 16.1 Backup promise

AppCare may say:

```txt
OneDayOS maintains platform backups and restore procedures as part of AppCare.
```

AppCare should not say:

```txt
zero data loss guaranteed
instant restore guaranteed
per-record restore guaranteed
per-client restore guaranteed at any time
```

unless those capabilities are actually implemented and tested.

## 16.2 Restore principle

A backup is not real until restored and verified.

Restore drills should be part of AppCare maturity.

## 16.3 Shared database restore risk

Because OneDayOS uses one shared production database, full database restore affects all clients.

Therefore:

```txt
one-client data issue
  → prefer targeted repair from staging restore

global corruption
  → consider full restore only as last resort
```

## 16.4 Storage backup

When Attachment Service or file upload exists, database backups are not enough.

Files in object storage require their own backup/restore plan.

No AppCare file-storage promise should be made until this is documented and tested.

---

# 17. Security Updates Under AppCare

AppCare includes reasonable security maintenance.

Security updates include:

```txt
dependency updates
framework security fixes
Supabase/Vercel configuration review
secret rotation when compromised
access review
security regression tests
patching known vulnerabilities
```

Security updates do not mean blindly upgrading everything immediately.

Updates must respect:

```txt
staging verification
test suite
migration safety
module compatibility
production risk
```

Security fixes may bypass normal feature release cycles when risk is high.

---

# 18. Bug Fix Operations

## 18.1 Bug intake

Every bug report should capture:

```txt
client organization
affected user
module/page
steps to reproduce
expected result
actual result
screenshot or screen recording if available
time observed
severity
whether issue affects one client or many
```

## 18.2 Bug classification

Bug severity:

```txt
P0 — security breach, cross-tenant exposure, total outage, data corruption
P1 — major feature broken for active client
P2 — normal bug with workaround
P3 — minor UI/wording issue
```

## 18.3 Bug fix rule

Every serious bug fix must include:

```txt
[ ] root cause identified
[ ] regression test added
[ ] affected clients assessed
[ ] staging verified if applicable
[ ] production deployed safely
[ ] support note written if client-facing
```

Security bugs must also update security tests and, when needed, the Engineering Manual.

---

# 19. Enhancement Request Operations

Not all requests are AppCare bugs.

Enhancement requests should be classified as:

```txt
configuration change
module improvement
new module
platform service candidate
custom integration
client-specific request
bad-fit request
```

The default process:

```txt
1. Record request.
2. Classify it.
3. Check if it fits existing configuration.
4. Check if it belongs to an existing module.
5. Check if it is reusable.
6. Decide: AppCare, paid change, defer, reject, or product roadmap.
```

Repeated enhancement requests should feed the roadmap.

They should not create hidden client forks.

---

# 20. AI Support Under AppCare

The business offer includes AI support.

For MVP, this must be interpreted carefully.

AI support may mean:

```txt
AI-assisted internal support by OneDayOS
AI-assisted documentation writing
AI-assisted troubleshooting by the operator
future contextual help inside the app
```

AI support does **not** mean immediately shipping:

```txt
client-facing AI chatbot
AI data analyst
AI SQL agent
AI that changes production records
AI that exports data
AI that bypasses permissions
```

User-facing AI support remains deferred until the AI Layer documents permit it.

In the meantime, the founder/operator may use AI privately to help answer support questions, but must not paste secrets, sensitive client data, or full database exports into AI tools.

---

# 21. Release and Update Operations

AppCare includes platform maintenance.

That means clients benefit from platform updates.

## 21.1 Update model

The model is:

```txt
OneDayOS updates the shared platform.
All organizations run on the updated platform.
Access remains controlled by modules, settings, roles, and permissions.
```

Not:

```txt
manually patch each client app separately
```

## 21.2 Release types

Release types:

```txt
security patch
bug fix
minor module improvement
new module
schema migration
design system improvement
operations improvement
```

## 21.3 Release notes

Client-facing release notes should be written when changes affect users.

Internal-only fixes do not always require client-facing release notes.

Examples requiring release notes:

```txt
new screen
changed workflow
new permission
new export behavior
changed report logic
module UI change that users will notice
```

Examples not always requiring release notes:

```txt
internal refactor
test improvement
minor error logging fix
invisible security hardening
```

---

# 22. Client Communication

AppCare requires clear communication.

## 22.1 Normal support communication

Support replies should include:

```txt
issue summary
current status
next action
whether it is a bug, configuration issue, or enhancement
whether extra scope is required
```

## 22.2 Incident communication

During an incident, communication should be:

```txt
clear
honest
short
time-stamped
not overly technical
not speculative
```

Example:

```txt
We are currently investigating login errors affecting OneDayOS.
Your data is not currently believed to be affected.
We will send another update after verification.
```

Do not say:

```txt
Everything is fine.
```

unless it has been verified.

## 22.3 Maintenance communication

If planned maintenance may affect users:

```txt
announce window
explain expected impact
confirm completion
mention any action needed from client
```

---

# 23. Support Access

Support access to client organizations is sensitive.

For MVP, do not hack in hidden support bypasses.

Forbidden:

```txt
@onedayonlysystems.com can access all orgs automatically
admin wildcard bypasses tenant isolation
support user can change any org silently
direct database edits as normal support workflow
```

If OneDayOS staff support access is needed later, it must be designed explicitly.

Future support access should include:

```txt
explicit support role
limited permissions
time-bound access
auditable access
client approval where appropriate
no tenant-isolation bypass
```

Until then, support should use:

```txt
screen sharing
client admin actions
carefully reviewed repair scripts
staging investigation
manual founder/operator access only under documented process
```

---

# 24. Billing and Suspension Operations

AppCare billing must eventually connect to subscription status.

MVP may handle billing manually.

Still, the platform should support:

```txt
trial
active
suspended
cancelled
```

## 24.1 Payment issue

When payment fails or is overdue:

```txt
1. Notify client.
2. Provide grace period if policy allows.
3. Mark subscription risk internally.
4. Suspend only after policy threshold.
5. Do not delete data automatically.
```

## 24.2 Suspension behavior

Suspension should block normal module use.

It should not delete data.

It should not corrupt tenant configuration.

It should not require code changes.

---

# 25. AppCare and Module Enablement

AppCare does not mean every client can access every module.

Access is controlled by:

```txt
OrgModule enablement
subscription plan
settings
roles
permissions
UI surfaces
```

If a new module is deployed globally, it is not automatically visible to every client.

Example:

```txt
Fleet module is deployed.
Only logistics clients with Fleet enabled can access it.
```

This protects the shared platform model while still allowing product growth.

---

# 26. AppCare and Deferred Platform Services

Deferred Platform Services are not included merely because they appear in the roadmap.

Examples:

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
```

A client does not get these automatically until they are implemented in the shared platform and exposed through modules/settings/permissions.

If a client needs a deferred capability before the Platform Service exists:

```txt
1. Determine if the need is module-local.
2. Keep it module-local if only one module needs it.
3. Record evidence.
4. Promote only after repeated independent use cases justify it.
```

This is how OneDayOS avoids overengineering while still growing into a real platform.

---

# 27. Operational Metrics

AppCare should eventually track:

```txt
active clients
active users
enabled modules per org
monthly support tickets
bugs by module
mean time to first response
mean time to resolution
production incidents
uptime history
failed deploys
failed migrations
backup verification status
restore drill status
platform cost per client
support cost per client
```

MVP does not need a dashboard for all of this.

But the founder should start tracking enough to know whether AppCare is profitable and sustainable.

---

# 28. AppCare Cost Discipline

AppCare must stay commercially viable.

Every operational choice should ask:

```txt
Will this increase support burden?
Will this make deployments harder?
Will this make migrations harder?
Will this create per-client differences?
Will this reduce future reuse?
Will this require manual work every month?
Will this break the ₱3,500/month economics?
```

The system should prefer:

```txt
shared components
shared modules
shared monitoring
shared migrations
configurable behavior
repeatable onboarding
automated tests
centralized fixes
```

Over:

```txt
client forks
manual DB edits
ad hoc scripts
one-off settings hidden in code
undocumented exceptions
separate infrastructure by default
```

---

# 29. AppCare Checklist

## 29.1 Client activation checklist

```txt
[ ] org created
[ ] admin user created
[ ] admin can log in
[ ] subscription record created
[ ] modules enabled
[ ] roles assigned
[ ] permissions assigned
[ ] settings configured
[ ] seed/client data loaded if applicable
[ ] module smoke test completed
[ ] support channel shared
[ ] AppCare scope explained
[ ] handover completed
```

## 29.2 Daily checklist

```txt
[ ] app reachable
[ ] uptime monitor checked
[ ] error tracker checked
[ ] critical logs checked
[ ] support inbox triaged
[ ] no critical unresolved incidents
```

## 29.3 Weekly checklist

```txt
[ ] review unresolved production errors
[ ] review deployments
[ ] review support tickets
[ ] review backup status
[ ] review dependency/security notices
[ ] review slow routes or APIs
[ ] review repeated requests
```

## 29.4 Monthly checklist

```txt
[ ] review active client list
[ ] review subscription statuses
[ ] review AppCare profitability
[ ] review platform costs
[ ] review backup/restore status
[ ] review access controls
[ ] review dependency updates
[ ] review module support burden
[ ] review repeated enhancement requests
[ ] update roadmap evidence logs where needed
```

## 29.5 Pre-deployment checklist

```txt
[ ] typecheck passes
[ ] tests pass
[ ] build passes
[ ] architecture checks pass
[ ] migration reviewed if present
[ ] staging verified if production-impacting
[ ] rollback/forward-fix plan known
[ ] release notes prepared if user-facing
```

## 29.6 Post-deployment checklist

```txt
[ ] production deployment succeeded
[ ] app reachable
[ ] login smoke test passes
[ ] affected module smoke test passes
[ ] error tracker checked
[ ] support channel monitored
[ ] release note sent if needed
```

---

# 30. Claude Implementation Rules

Claude must treat AppCare as an operations contract, not as permission to add random infrastructure.

Claude may implement AppCare-related code only when a frozen implementation document says so.

Claude must not:

```txt
create per-client deployments
create per-client Supabase projects
add background jobs casually
add monitoring dashboards casually
add AI chatbot support casually
add support-staff backdoors
add hidden tenant bypasses
add FastAPI operations services
store secrets in database settings
commit real environment variables
run production migrations
claim AppCare readiness without gates
```

Claude may help with:

```txt
checklists
runbooks
support templates
health endpoints when specified
error handling improvements
monitoring integration when specified
backup/restore scripts when specified
CI checks
operations documentation
```

---

# 31. Acceptance Criteria

This document is accepted when:

```txt
[ ] AppCare scope is clear
[ ] AppCare non-goals are clear
[ ] bug vs enhancement distinction is clear
[ ] daily/weekly/monthly operations are defined
[ ] backup/restore responsibilities are defined
[ ] monitoring responsibilities are defined
[ ] support access boundaries are defined
[ ] client suspension/cancellation principles are defined
[ ] AppCare checklist exists
[ ] Claude implementation restrictions are explicit
[ ] document aligns with shared-platform architecture
```

AppCare is not operationally ready until the relevant gates are implemented and tested.

---

# 32. Founder Summary

AppCare is the recurring business engine of OneDayOS.

It must be simple enough to operate across many clients.

The correct model is:

```txt
Build and maintain one strong platform.
Keep clients as tenant organizations.
Use modules, settings, permissions, and roles to customize behavior.
Fix bugs once for everyone.
Avoid client forks.
Protect backups and monitoring.
Be clear about what AppCare includes.
Charge separately for new work.
```

AppCare should make OneDayOS more valuable every month.

It should not become unlimited custom labor.

