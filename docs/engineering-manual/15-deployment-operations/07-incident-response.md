# OneDayOS Engineering Manual — 15 Deployment & Operations — 07 Incident Response

```txt
Document ID: 15-deployment-operations/07-incident-response.md
Version: 1.0
Status: Draft for Founder Review
Owner: Founder / Lead Software Architect
Last Updated: July 2026
Implementation Status: Required Before AppCare Claims; Minimum Runbook Required Before First Production Client
Supersedes: None
Depends On:
  - 00-meta/04-definition-of-done.md
  - 02-architecture/00-system-architecture.md
  - 04-kernel/08-kernel-api-contracts.md
  - 05-sdk/03-sdk-auth-permissions.md
  - 06-data/07-backup-restore.md
  - 13-security/00-security-model.md
  - 13-security/02-tenant-isolation.md
  - 13-security/05-data-security.md
  - 13-security/08-production-readiness-gate.md
  - 14-testing-quality/06-regression-testing.md
  - 15-deployment-operations/04-monitoring-observability.md
  - 15-deployment-operations/05-error-handling.md
  - 15-deployment-operations/06-appcare-operations.md
Implementation Allowed: Yes, for runbook/process/tooling only. Do not build custom incident-management software in MVP.
```

---

# 1. Purpose

This document defines how OneDayOS handles production incidents.

An incident is any event that threatens the availability, correctness, security, privacy, recoverability, or trustworthiness of the OneDayOS platform.

Because OneDayOS is a shared platform, incident response is not optional. A single production issue can affect multiple client organizations.

The goal is not to pretend incidents will never happen.

The goal is to make sure incidents are:

```txt
detected quickly
triaged clearly
contained safely
communicated honestly
resolved carefully
reviewed afterward
converted into permanent prevention
```

---

# 2. Core Principle

```txt
During an incident, protect customer data and platform integrity first.
Speed matters, but unsafe fixes make incidents worse.
```

The correct response is not panic-driven hacking.

The correct response is disciplined containment.

---

# 3. Shared Platform Reality

OneDayOS does not normally operate one separate app per client.

The normal model is:

```txt
One OneDayOS production platform
One shared production database
Many client Organizations
Tenant isolation through orgId
Access through PlatformContext, roles, permissions, modules, and settings
```

This creates operational leverage:

```txt
one codebase
one deployment pipeline
one migration path
one monitoring system
one backup strategy
one AppCare process
```

But it also creates shared-infrastructure blast radius:

```txt
bad platform deployment -> may affect many clients
bad database migration -> may affect many clients
Supabase production outage -> may affect many clients
Vercel production outage -> may affect many clients
cross-tenant bug -> potentially critical security incident
```

Therefore, OneDayOS must operate like a platform, not like a collection of small custom apps.

---

# 4. Non-Goals

This document does not define:

```txt
custom incident-management software
custom status-page software
custom monitoring dashboards
custom ticketing systems
enterprise SOC process
formal ISO 27001 process
full legal breach-response manual
client-specific infrastructure playbooks
per-client deployment rollback process
```

Those may come later.

For MVP, OneDayOS needs a clear founder-operated incident runbook.

---

# 5. Incident Categories

OneDayOS incidents should be classified by type.

## 5.1 Availability incident

Examples:

```txt
site unavailable
login unavailable
module pages timing out
Supabase unavailable
Vercel deployment broken
DNS/domain issue
```

## 5.2 Data correctness incident

Examples:

```txt
wrong stock quantities
duplicate records created
bad import script
bad migration changed data incorrectly
soft-deleted records visible
records disappeared from normal views
```

## 5.3 Tenant isolation incident

Examples:

```txt
Org A user can access Org B route
Org A user can read Org B API data
Org A user can mutate Org B data
API trusts client-supplied orgId
background job processes wrong org
report/search/AI leaks cross-tenant data
```

Tenant isolation incidents are always severe.

## 5.4 Authorization incident

Examples:

```txt
staff user can delete records without permission
module-disabled org can access module API
read-only user can export data
Admin wildcard bypasses org boundary
UI hides button but API still allows mutation
```

## 5.5 Authentication incident

Examples:

```txt
login broken
registration creates orphaned auth users
password reset broken
session validation broken
API returns redirects instead of JSON auth errors
wrong current-user lookup
```

## 5.6 Data security / privacy incident

Examples:

```txt
personal data exposed to wrong user
sensitive fields appear in logs
full records sent in event payloads
AI context includes sensitive fields
backup exported to unsafe location
production data copied to staging without controls
```

## 5.7 Secret exposure incident

Examples:

```txt
SUPABASE_SERVICE_ROLE_KEY leaked
DATABASE_URL committed
.env.local pushed to GitHub
production env pasted into Claude/chat
service key exposed to browser bundle
provider API key leaked in logs
```

## 5.8 Deployment regression

Examples:

```txt
new deploy breaks login
new deploy breaks dashboard
new deploy breaks module API
new deploy introduces build/runtime mismatch
new deploy missing Prisma Client generation
```

## 5.9 Migration incident

Examples:

```txt
migration failed halfway
migration locks production table
migration drops needed column
backfill corrupts tenant data
new unique constraint fails on existing data
code deployed before migration or after incompatible migration
```

## 5.10 Backup / restore incident

Examples:

```txt
backup missing
restore fails
restore target wrong
restore overwrites newer data
per-tenant repair script affects wrong org
storage objects missing after DB restore
```

## 5.11 Monitoring / observability incident

Examples:

```txt
error tracking disabled
uptime monitor not alerting
logs missing request IDs
Sentry source maps broken
production errors only discovered from client complaint
```

## 5.12 Future AI incident

Examples:

```txt
AI sees data user cannot access
AI leaks sensitive fields
AI acts without confirmation
AI follows prompt injection from business data
AI generates unsafe query plan
```

AI runtime is deferred, but the incident category is defined now.

---

# 6. Severity Levels

Incidents must be assigned a severity level.

Severity determines urgency, communication, escalation, and postmortem requirements.

## SEV-0 — Critical platform/security incident

A SEV-0 incident is existential or trust-critical.

Examples:

```txt
confirmed cross-tenant data exposure
confirmed unauthorized data mutation across tenants
production database destructive corruption affecting multiple clients
production Supabase project deleted or inaccessible
production secrets exposed publicly
client data breach likely requiring regulatory notification
complete platform outage affecting all clients for a sustained period
```

Response:

```txt
immediate containment
founder/architect leads
stop deployments except hotfixes
preserve evidence
communicate internally immediately
prepare client communication
legal/privacy review if personal data involved
postmortem required
regression tests required
```

## SEV-1 — Major incident

A SEV-1 incident seriously affects one or more clients but is not yet confirmed existential.

Examples:

```txt
login broken for many users
one official module unusable across clients
bad migration causes incorrect data for one module
permission bug allows unauthorized action inside same tenant
production deployment breaks core workflow
backup restore drill fails before an actual restore need
```

Response:

```txt
immediate triage
contain or rollback quickly
notify affected clients if user-facing impact is confirmed
postmortem required
regression tests required
```

## SEV-2 — Moderate incident

A SEV-2 incident affects functionality but has a workaround or limited scope.

Examples:

```txt
non-critical page errors
one client cannot access a non-core module screen
slow performance on a specific report
incorrect UI state but data safe
module-local import failed before writing data
```

Response:

```txt
triage within AppCare process
fix through normal hotfix/release path
regression test if bug is platform-relevant
client communication if visible to client
```

## SEV-3 — Minor incident

A SEV-3 incident is low-risk and usually not urgent.

Examples:

```txt
typo
cosmetic UI issue
minor empty-state bug
non-blocking tooltip issue
low-risk log warning
```

Response:

```txt
track normally
fix in next scheduled release
no formal postmortem required unless repeated
```

---

# 7. Severity Escalation Rules

Escalate severity immediately if any of these are true:

```txt
client data may have crossed tenant boundaries
production secrets may be exposed
personal data may have been disclosed incorrectly
production database integrity is uncertain
restore may be required
multiple clients are affected
incident affects authentication or authorization
incident affects backup/restore confidence
incident is being reported publicly
```

When unsure between two severities, choose the higher severity first.

Downgrade later after evidence.

---

# 8. Incident Roles

MVP may have a small team, but roles should still be clear.

## 8.1 Incident Lead

Usually the founder or lead architect.

Responsibilities:

```txt
own incident classification
coordinate containment
decide rollback/hotfix/disablement
approve client communication
ensure evidence is preserved
ensure postmortem happens
```

## 8.2 Technical Lead

Usually the engineer/Claude operator fixing the issue.

Responsibilities:

```txt
inspect logs
identify root cause
prepare fix
run tests
avoid unsafe changes
report exactly what changed
```

## 8.3 Communications Owner

May be the founder in MVP.

Responsibilities:

```txt
write client-facing updates
avoid overpromising
avoid technical speculation
document affected clients
track support inquiries
```

## 8.4 Data Protection / Privacy Owner

May be founder initially, but should become formal later.

Responsibilities:

```txt
assess personal-data exposure
coordinate legal/privacy review
determine notification obligations
preserve evidence
avoid premature public claims
```

## 8.5 Claude Code

Claude is not an incident commander.

Claude may:

```txt
analyze logs provided to it after secrets are removed
propose root-cause hypotheses
write tests
write patches from narrow instructions
review diff for unsafe patterns
```

Claude must not:

```txt
receive production secrets
receive raw client data unnecessarily
run production migrations
decide client notification strategy
decide legal breach obligations
implement broad architecture changes during an incident
```

---

# 9. Incident Lifecycle

Every incident follows this lifecycle.

```txt
1. Detect
2. Classify
3. Contain
4. Investigate
5. Remediate
6. Verify
7. Communicate
8. Review
9. Prevent recurrence
```

Do not skip containment while investigating.

Do not skip verification after remediation.

Do not skip prevention after resolution.

---

# 10. Detection

Incidents may be detected by:

```txt
Vercel errors
Supabase logs
Sentry alerts
uptime monitoring
failed CI/deploy checks
client support report
manual AppCare review
security test failure
migration failure
Claude/code review finding
```

Minimum detection channels before serious production/AppCare:

```txt
[ ] error tracking active
[ ] uptime monitoring active
[ ] Vercel production logs accessible
[ ] Supabase production logs accessible
[ ] backup status review process exists
[ ] support intake channel exists
```

---

# 11. Initial Triage Checklist

When an incident is suspected, answer these first:

```txt
[ ] What happened?
[ ] When did it start?
[ ] Is it still happening?
[ ] Which environment is affected?
[ ] Which client organizations are affected?
[ ] Which modules are affected?
[ ] Is data confidentiality at risk?
[ ] Is data integrity at risk?
[ ] Is tenant isolation at risk?
[ ] Is authentication/authorization affected?
[ ] Is a recent deployment involved?
[ ] Is a recent migration involved?
[ ] Is a provider outage involved?
[ ] Do we need to stop writes, disable a module, rollback code, or rotate secrets?
```

If the answer to tenant isolation, confidentiality, or production secrets is “maybe,” treat as high severity until disproven.

---

# 12. Containment First

Containment means reducing damage before completing root-cause analysis.

Possible containment actions:

```txt
rollback latest deployment
disable affected module for affected orgs
disable affected API route temporarily
hide affected UI surface
pause onboarding/imports
stop writes to affected table/workflow
rotate exposed secret
revoke leaked token
block unsafe feature flag
restore previous environment variable
apply hotfix
put maintenance notice in affected area
```

Containment must be narrow where possible.

But if tenant isolation is at risk, broad containment is acceptable.

---

# 13. Do Not Do These During an Incident

Forbidden incident behaviors:

```txt
do not run unreviewed production migrations
do not run prisma migrate reset in production
do not run prisma db push in production
do not manually edit production data without a script and backup
do not paste production secrets into Claude
do not paste raw client data into Claude unless explicitly sanitized
do not create hidden support backdoors
do not bypass PlatformContext to quickly fix a route
do not patch only the UI when API/service remains vulnerable
do not solve wrong-org bugs by hiding org slugs only
do not delete records as cleanup without backup and audit trail
do not make legal/privacy notification claims without review
do not say “no data was affected” until verified
```

---

# 14. Rollback vs Hotfix

## 14.1 Use rollback when

```txt
recent deployment caused the incident
schema remains compatible with previous code
rollback will restore service faster than hotfix
root cause is unclear but deployment is suspicious
```

## 14.2 Use hotfix when

```txt
rollback cannot work because database schema changed
incident is security-related and needs targeted patch
rollback would reintroduce another serious bug
only one route/service needs correction
```

## 14.3 Rollback is not database rollback

Vercel rollback only restores code.

It does not undo database migrations.

If a database migration is involved, follow the production migration incident process.

---

# 15. Incident Type Runbooks

## 15.1 Platform outage runbook

Use when the app is unavailable or unusable.

Checklist:

```txt
[ ] Confirm outage from user report and external monitor.
[ ] Check Vercel deployment status.
[ ] Check Vercel runtime logs.
[ ] Check Supabase project status and database connectivity.
[ ] Check recent deploys.
[ ] Check recent environment-variable changes.
[ ] Check recent migrations.
[ ] Determine affected routes/modules.
[ ] Rollback latest deployment if likely cause and schema-compatible.
[ ] Communicate if client-visible.
[ ] Add regression test or deployment check if platform bug.
```

Avoid:

```txt
changing database schema during outage unless root cause requires it
manual production edits without evidence
```

## 15.2 Login/auth incident runbook

Use when users cannot log in or sessions behave incorrectly.

Checklist:

```txt
[ ] Confirm Supabase Auth is reachable.
[ ] Check auth redirect URL configuration.
[ ] Check cookies/session behavior.
[ ] Check /api/kernel/auth/me.
[ ] Check recent auth helper changes.
[ ] Confirm API auth returns JSON 401, not redirect HTML.
[ ] Check Supabase Auth user exists.
[ ] Check matching Prisma User exists.
[ ] Check User.isActive.
[ ] Check Organization.isActive / subscription status.
[ ] Check if issue affects all orgs or one org.
[ ] Rollback or hotfix.
```

Known high-risk pattern:

```txt
Supabase Auth user exists but Prisma User/Organization row is missing.
```

This usually indicates broken registration synchronization.

## 15.3 Tenant isolation incident runbook

Use when cross-tenant access is suspected.

Treat as SEV-0 until disproven.

Checklist:

```txt
[ ] Stop or disable affected route/module if active exposure is possible.
[ ] Preserve logs and request IDs.
[ ] Identify source route/API/service.
[ ] Identify affected orgs and users.
[ ] Determine read exposure, write exposure, or both.
[ ] Check whether client-supplied orgId was accepted.
[ ] Check PlatformContext creation.
[ ] Check service query scoping.
[ ] Check sdk.getDb(ctx) usage.
[ ] Check findUnique({ where: { id } }) on tenant-scoped records.
[ ] Check module enablement and permissions.
[ ] Add two-org regression test before patch is considered complete.
[ ] Review whether client/privacy notification is required.
```

Containment options:

```txt
disable affected module
disable affected API route
roll back deployment
hotfix context/query scoping
block suspicious requests
```

Required post-incident outputs:

```txt
[ ] root-cause note
[ ] two-org regression test
[ ] permission-denial test if relevant
[ ] architecture check if pattern is detectable
[ ] manual amendment if rule was unclear
```

## 15.4 Permission incident runbook

Use when users can do actions they should not be able to do.

Checklist:

```txt
[ ] Identify action, resource, module, user, role, org.
[ ] Confirm module enablement separately from permission.
[ ] Confirm API route checks permission.
[ ] Confirm service checks permission.
[ ] Confirm UI hiding is not the only protection.
[ ] Check wildcard matching.
[ ] Check Permission.resource handling.
[ ] Check non-null conditions are denied in MVP.
[ ] Add non-admin denial test.
[ ] Add API 403 test.
[ ] Add service permission test.
```

Do not fix permission bugs only in UI.

## 15.5 Database migration incident runbook

Use when a migration fails, corrupts data, or causes downtime.

Checklist:

```txt
[ ] Stop further deploys/migrations.
[ ] Identify migration name and deployment commit.
[ ] Check whether migration completed or partially failed.
[ ] Check affected tables and orgs.
[ ] Check whether code expects new schema.
[ ] Check backup state before migration.
[ ] Decide rollback-code, roll-forward migration, or targeted repair.
[ ] Avoid full database restore unless necessary.
[ ] Restore to staging if investigation requires data comparison.
[ ] Write repair script with dry-run if data fix is needed.
[ ] Run repair in staging first.
[ ] Run production repair with founder approval.
[ ] Add migration regression check.
```

Forbidden:

```txt
prisma migrate reset in production
prisma db push in production
manual dashboard schema edits to “quickly fix” production
```

## 15.6 Data corruption incident runbook

Use when data was written incorrectly.

Checklist:

```txt
[ ] Identify corrupt records.
[ ] Identify affected orgIds.
[ ] Identify write path causing corruption.
[ ] Stop or disable write path.
[ ] Determine whether soft delete/restore can recover.
[ ] Determine whether targeted repair is enough.
[ ] Restore backup to staging if historical comparison needed.
[ ] Write tenant-aware repair script.
[ ] Include dry-run output.
[ ] Include before/after summary.
[ ] Run on staging.
[ ] Run on production only after approval.
[ ] Add regression test for corrupting path.
```

Full production restore is last resort because it affects all clients.

## 15.7 Secret exposure runbook

Use when any production secret may have leaked.

Checklist:

```txt
[ ] Identify secret type.
[ ] Identify exposure location.
[ ] Revoke/rotate secret immediately.
[ ] Remove exposed secret from repo/chat/logs where possible.
[ ] Check access logs for misuse.
[ ] Redeploy with new secret.
[ ] Confirm old secret no longer works.
[ ] Audit code for accidental client exposure.
[ ] Add architecture/check rule if pattern is detectable.
[ ] Treat secret pasted into Claude/chat as compromised.
```

High-risk secrets:

```txt
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
Vercel tokens
GitHub tokens
AI provider keys
email/SMS provider keys
```

## 15.8 Backup/restore incident runbook

Use when restore is required or backup confidence is compromised.

Checklist:

```txt
[ ] Determine if soft delete restore solves issue.
[ ] Determine if targeted repair solves issue.
[ ] Determine backup recovery point needed.
[ ] Restore backup to staging first if possible.
[ ] Verify restored data.
[ ] For one-client issue, extract affected orgId data and repair production carefully.
[ ] For global issue, prepare full restore decision.
[ ] Communicate expected data-loss window if applicable.
[ ] After restore/repair, verify affected workflows.
[ ] Document actual recovery time and recovery point.
```

Storage files need separate handling once Attachment Service exists.

Database backup alone is not complete file recovery.

## 15.9 Provider outage runbook

Use when Vercel, Supabase, DNS, or another infrastructure provider is degraded.

Checklist:

```txt
[ ] Confirm provider status.
[ ] Confirm platform symptoms.
[ ] Identify whether all clients or some clients are affected.
[ ] Avoid unnecessary code changes if provider outage is root cause.
[ ] Communicate service dependency issue if client-facing.
[ ] Monitor until provider recovers.
[ ] Verify platform after recovery.
[ ] Document incident if AppCare clients affected.
```

Do not create permanent architecture changes during a provider outage unless the postmortem proves they are necessary.

---

# 16. Client Communication Rules

Client communication should be honest, calm, and specific enough to be useful.

Do not over-share internals.

Do not hide material impact.

## 16.1 When to communicate

Communicate to affected clients when:

```txt
service is down or degraded
core workflow is unavailable
client data may be incorrect
client data may have been exposed
restoration/repair work may affect them
incident will take visible time to resolve
```

## 16.2 What to say initially

Initial update should include:

```txt
what is affected
who is affected if known
what users may experience
what OneDayOS is doing now
whether action is required from client
when next update will happen, if known
```

Avoid:

```txt
unverified root-cause claims
legal conclusions
blaming providers prematurely
saying data is safe before confirmed
technical details that create security risk
```

## 16.3 Example initial message — outage

```txt
We are currently investigating an issue affecting access to OneDayOS for some users.

Impact: Some users may be unable to load the dashboard or module pages.
Current action: We are checking the latest deployment, application logs, and infrastructure status.
Data: We have no evidence of data loss at this time, but we are still verifying.

We will send another update after we confirm the cause or restore service.
```

## 16.4 Example initial message — module issue

```txt
We identified an issue affecting the [Module Name] module.

Impact: Users may be unable to [specific action]. Other modules are currently unaffected.
Current action: We temporarily disabled the affected action while we apply a fix.
Data: Existing records remain stored. We are verifying whether any records require correction.

We will update you after verification is complete.
```

## 16.5 Example initial message — data issue

```txt
We are investigating a data correctness issue affecting [specific module/workflow].

Impact: Some records may display incorrect [field/status/value].
Current action: We paused the affected workflow and are comparing the affected records against system logs/backups.
Data: We are identifying the exact records affected before applying any repair.

Please avoid making manual corrections until we confirm the repair plan, to prevent duplicate changes.
```

## 16.6 Example initial message — possible privacy/security issue

```txt
We are investigating a potential data access issue.

Impact: We are currently determining the scope and affected records.
Current action: We have contained the suspected access path and are preserving logs for investigation.
Next step: We will provide a confirmed update once we complete the initial assessment.

We will not ask you for passwords or sensitive credentials during this process.
```

Do not send this lightly. If personal data exposure is suspected, founder/legal/privacy review is required.

---

# 17. Privacy / Breach Notification Note

OneDayOS operates in the Philippine SME context and may process personal information.

If an incident may involve unauthorized access, disclosure, modification, loss, or exposure of personal data, it must be escalated immediately for privacy review.

This manual is not legal advice.

However, the incident process must recognize that Philippine breach-reporting rules may require notification to the National Privacy Commission and affected data subjects within defined timelines when a reportable personal data breach occurs.

Operational rule:

```txt
If personal data breach is suspected, do not wait for perfect certainty before escalating.
Preserve evidence.
Contain the incident.
Start privacy/legal review immediately.
```

Founder must maintain a separate privacy/breach decision log for such incidents.

---

# 18. Evidence Preservation

During serious incidents, preserve evidence before deleting or overwriting it.

Evidence may include:

```txt
request IDs
Vercel logs
Supabase logs
Sentry issue IDs
deployment commit SHA
migration name
error screenshots
affected orgIds
affected userIds
affected record IDs
API route names
timestamps
support messages
configuration changes
environment-variable change history
```

Do not store unnecessary sensitive data in incident notes.

Use IDs and summaries where possible.

---

# 19. Incident Notes Template

Create an incident note using this structure.

```md
# Incident [YYYY-MM-DD]-[short-name]

Severity:
Status:
Incident Lead:
Technical Lead:
Started At:
Detected At:
Resolved At:
Affected Environment:
Affected Organizations:
Affected Modules:

## Summary

## User Impact

## Data Impact

## Security / Privacy Impact

## Timeline

- HH:MM — event
- HH:MM — event

## Detection Source

## Initial Containment

## Root Cause

## Fix Applied

## Verification

## Client Communication

## Follow-Up Tasks

- [ ] regression test
- [ ] architecture check
- [ ] manual update
- [ ] monitoring improvement
- [ ] backup/restore improvement
- [ ] client follow-up

## Lessons Learned
```

---

# 20. Timeline Discipline

During the incident, keep a timeline.

Do not rely on memory afterward.

Minimum timeline events:

```txt
incident detected
severity assigned
containment started
client impact confirmed
rollback/hotfix started
fix deployed
verification started
verification completed
client notified
incident closed
postmortem completed
```

Use Asia/Manila time for client-facing operational records unless otherwise specified.

---

# 21. Verification Before Closure

An incident is not resolved just because a fix was deployed.

Closure requires verification.

Minimum verification:

```txt
[ ] affected route/API works for allowed user
[ ] affected route/API fails safely for wrong user if security-related
[ ] affected tenant cannot access other tenant if tenant-related
[ ] affected permission denial works if permission-related
[ ] affected module disabled behavior works if module-related
[ ] affected data repaired or confirmed safe
[ ] logs show error stopped recurring
[ ] monitoring is green
[ ] client-facing workflow tested
[ ] regression test added or explicitly justified
```

---

# 22. Postmortem Requirements

Postmortem is required for:

```txt
all SEV-0 incidents
all SEV-1 incidents
any tenant isolation bug
any data breach or suspected data breach
any production secret exposure
any destructive database incident
any restore failure
any repeated SEV-2 incident
```

Postmortem should be blameless but not vague.

The question is not “who messed up?”

The question is:

```txt
What system allowed this to happen,
and what system change prevents it next time?
```

---

# 23. Postmortem Template

```md
# Postmortem: [Incident Name]

Date:
Severity:
Incident Lead:
Status:

## Executive Summary

## What Happened

## What Was Affected

## What Was Not Affected

## Root Cause

## Why It Was Not Caught Earlier

## What Went Well

## What Went Poorly

## Corrective Actions

| Action | Owner | Due Date | Status |
|---|---|---|---|
| Add regression test | | | |
| Add architecture check | | | |
| Update manual | | | |
| Improve monitoring | | | |
| Improve runbook | | | |

## Client Communication Summary

## Long-Term Prevention
```

---

# 24. Regression Requirement

Every serious incident must produce prevention.

Possible prevention outputs:

```txt
unit test
integration test
API test
security test
architecture check
CI quality gate
generator safety rail
manual amendment
ADR
monitoring alert
backup restore drill
migration review checklist
```

Examples:

```txt
Incident: API returned redirect HTML instead of 401 JSON
Prevention: API test that unauthenticated request returns JSON 401

Incident: Org A accessed Org B record
Prevention: two-org tenant isolation regression test

Incident: Staff user deleted record without permission
Prevention: service permission-denial test + API 403 test

Incident: Generator emitted sdk.getDb(orgId)
Prevention: generator test + check:architecture pattern

Incident: Prisma Client missing in fresh deploy
Prevention: build script includes prisma generate + CI check
```

---

# 25. Incident Response and Claude

Claude may be used during incident response, but only under strict boundaries.

## 25.1 Safe Claude uses

```txt
summarize sanitized logs
identify suspicious code paths
write regression tests
review a focused patch
compare code against Engineering Manual
produce a hotfix plan from known facts
write client-facing draft for founder review
```

## 25.2 Unsafe Claude uses

```txt
paste production secrets
paste full client data dumps
ask Claude to “fix production” broadly
let Claude choose architecture during incident
let Claude run production migrations
let Claude decide breach notification
let Claude create support bypasses
let Claude implement deferred Platform Services as incident workaround
```

## 25.3 Incident prompt template

```md
We are investigating a OneDayOS incident.

Authoritative documents:
- 13-security/02-tenant-isolation.md
- 13-security/03-permission-enforcement.md
- 15-deployment-operations/07-incident-response.md

Incident summary:
[brief factual summary]

Known facts:
- [fact]
- [fact]

Sanitized logs:
[logs with secrets and client data removed]

Task:
Analyze likely root cause and propose a minimal safe patch plan.
Do not invent architecture.
Do not request production secrets.
Do not suggest production migrations unless explicitly necessary.
Identify what tests must be added before the fix is complete.
```

---

# 26. Incident Response and Deferred Services

Do not use incidents as excuses to prematurely build deferred services.

Examples:

```txt
Incident: client wants to know who changed a record
Wrong response: build full Audit Log Service immediately
Correct response: inspect logs/events where available, then evidence-log Audit need

Incident: users missed a workflow update
Wrong response: build Notification Service immediately
Correct response: fix current workflow visibility, evidence-log notification need

Incident: long import times out
Wrong response: build full Background Jobs platform immediately
Correct response: pause large imports, use controlled script, evidence-log jobs need
```

Platform Services still require evidence, proposal, ADR, and manual approval.

Exception:

A critical production risk may justify a narrow infrastructure patch, but not a broad generic service.

---

# 27. Incident Response and Shared Database

Because OneDayOS uses one shared database, incident response must avoid global damage.

## 27.1 Per-tenant repair preference

If only one organization is affected, prefer:

```txt
restore backup to staging
extract affected orgId data
write targeted repair script
run dry-run
run repair for only affected orgId
verify
```

Avoid full production restore unless multiple tenants or core tables are corrupted and targeted repair is unsafe.

## 27.2 Never repair without orgId

Bad repair script:

```ts
await prisma.product.updateMany({ data: { unit: 'pcs' } })
```

Good repair script:

```ts
await prisma.product.updateMany({
  where: { orgId: affectedOrgId, deletedAt: null },
  data: { unit: 'pcs' },
})
```

Better repair script:

```txt
supports --dry-run
prints affected count
requires explicit orgSlug/orgId
writes repair log
is reviewed before production
```

---

# 28. Incident Response and Module Disablement

Module disablement is a valid containment tool.

Examples:

```txt
disable Inventory adjustment route if stock mutation bug exists
disable Expenses import route if duplicate expenses are being created
disable CRM export route if export permission bug exists
disable Attachments once future storage access bug exists
```

Disabling a module must not delete data.

Module disablement should be tracked in incident notes.

---

# 29. Maintenance Mode

Full-platform maintenance mode is deferred.

For MVP, use narrower controls first:

```txt
rollback deployment
disable affected module
disable affected API route
hide affected UI action
pause imports/onboarding
```

A future maintenance-mode feature may be added if repeated operations need it.

Do not build maintenance mode during foundation unless explicitly approved.

---

# 30. Status Page

A public status page is deferred.

For early MVP/AppCare, use direct client communication.

A status page becomes useful when:

```txt
client count grows
multiple clients are regularly affected by shared incidents
support volume increases during outages
AppCare SLA becomes more formal
```

Do not build custom status-page software.

Use a provider if/when needed.

---

# 31. Incident Response by Environment

## 31.1 Local

Local incidents are developer problems unless they reveal platform bugs.

Examples:

```txt
Prisma generate missing
.env.local invalid
Supabase local unavailable
```

If repeated, improve setup docs or CI checks.

## 31.2 Preview

Preview incidents should block merge/deploy.

They should not affect clients if environment separation is correct.

## 31.3 Staging

Staging incidents are valuable warnings.

If staging migration fails, production migration must not proceed.

## 31.4 Production

Production incidents follow this runbook.

Production has client impact and AppCare implications.

---

# 32. Incident Response Metrics

Track these over time:

```txt
MTTD — mean time to detect
MTTA — mean time to acknowledge
MTTC — mean time to contain
MTTR — mean time to recover
number of affected organizations
number of repeated incidents
number of incidents caught by monitoring vs clients
number of incidents with regression tests added
number of incidents caused by deploy/migration/generator
```

Do not overbuild dashboards early.

A spreadsheet or Markdown log is acceptable for MVP.

---

# 33. Incident Log

Maintain an incident log.

Minimum fields:

```txt
incident id
date
severity
summary
affected orgs
affected modules
root cause category
resolution
postmortem link
regression added yes/no
manual updated yes/no
```

This becomes valuable for AppCare trust and platform maturity.

---

# 34. Root Cause Categories

Use consistent categories:

```txt
auth bug
tenant isolation bug
permission enforcement bug
API contract bug
service logic bug
module logic bug
generator bug
migration bug
Prisma/query bug
Supabase/provider issue
Vercel/provider issue
environment-variable issue
monitoring gap
backup/restore gap
manual/process gap
```

This helps identify repeated weak areas.

---

# 35. Founder Decision Points

The founder must explicitly approve:

```txt
production database repair scripts
full production restore
client-facing data incident statements
secret rotation that may disrupt services
major module disablement affecting many clients
hotfix that skips normal CI checks
any legal/privacy notification
any client compensation/credit
any dedicated infrastructure exception
```

---

# 36. AppCare Incident Boundaries

AppCare includes:

```txt
bug investigation
platform uptime monitoring
security updates
backup monitoring
reasonable incident communication
bug fixes
recovery assistance within platform capabilities
```

AppCare does not automatically include:

```txt
unlimited custom data cleanup caused by client misuse
new feature development during incident
manual business operations for client
client-side device/network troubleshooting beyond basic guidance
legal advice
forensic investigation beyond platform logs
enterprise SLA unless separately sold
```

---

# 37. Dedicated Infrastructure Incidents

Dedicated infrastructure is deferred as a premium/enterprise option.

If added later, incident response must account for:

```txt
separate Supabase project
separate Vercel project or environment
separate backups
separate migration process
separate monitoring
separate support contract
```

Do not let one-off dedicated deployments silently fork the incident process.

---

# 38. Security Incident Stop Conditions

Stop normal development if any of these occur:

```txt
confirmed tenant isolation breach
production secret leak
unauthorized cross-tenant write
personal data breach likely requiring notification
production database integrity uncertain
backup/restore cannot be trusted after data incident
```

Resume normal work only after:

```txt
[ ] incident contained
[ ] root cause understood enough
[ ] client/privacy obligations handled
[ ] regression coverage added
[ ] production verified
[ ] founder approves resume
```

---

# 39. Implementation Guidance for Claude

Claude may implement only process/tooling that this document explicitly allows.

Allowed:

```txt
create incident note template
create postmortem template
create runbook Markdown files
add requestId helper if specified elsewhere
add safe health endpoint if specified elsewhere
add tests for incident-related bug fixes
add architecture checks for known unsafe patterns
```

Forbidden:

```txt
custom incident-management app
custom status page
support staff tenant bypass
production migration scripts without explicit task
automatic client notification system
background job system
Audit Log Service
Notification Service
Activity Feed Service
AI incident assistant
FastAPI incident service
```

---

# 40. Acceptance Criteria

This document is accepted when:

```txt
[ ] severity levels are clear
[ ] tenant isolation incidents are treated as critical
[ ] privacy/security incidents have escalation rules
[ ] rollback/hotfix distinction is clear
[ ] database incidents avoid unsafe global restore by default
[ ] secret exposure has a rotation runbook
[ ] client communication rules are defined
[ ] postmortem and regression requirements are defined
[ ] Claude boundaries are defined
[ ] AppCare incident boundaries are defined
```

---

# 41. Required Before First Production Client

Before the first production client, OneDayOS must have:

```txt
[ ] incident note template
[ ] incident log location
[ ] founder/technical owner identified
[ ] error tracking enabled
[ ] uptime monitoring enabled
[ ] production logs accessible
[ ] rollback process understood
[ ] backup/restore process documented
[ ] secret rotation process documented
[ ] basic client communication template
```

---

# 42. Required Before Serious AppCare Claims

Before AppCare is marketed as mature operations, OneDayOS must have:

```txt
[ ] incident severity process in use
[ ] monthly AppCare review checklist
[ ] backup restore drill completed
[ ] production migration runbook tested
[ ] postmortem template used at least once in drill or real incident
[ ] uptime/error monitoring reviewed regularly
[ ] contact process for affected clients
[ ] privacy/security escalation process
[ ] incident regression policy enforced
```

---

# 43. Final Rule

```txt
An incident is not over when the site works again.
It is over when the platform is harder to break the same way again.
```

---

# 44. Recommended Next Document

```txt
15-deployment-operations/08-cost-management.md
```

Reason:

Incident response protects trust.

Cost management protects the business model.

OneDayOS cannot promise low-cost AppCare if infrastructure, AI, storage, monitoring, and support costs are not controlled.
