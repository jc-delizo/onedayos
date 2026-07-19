# OneDayOS Engineering Manual — 15 Deployment & Operations — 04 Monitoring & Observability

**Document ID:** `15-deployment-operations/04-monitoring-observability.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before AppCare Claims; Minimum Required Before First Production Client  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `00-meta/00-roadmap.md`
- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/01-sdk-public-api.md`
- `06-data/07-backup-restore.md`
- `13-security/00-security-model.md`
- `13-security/05-data-security.md`
- `13-security/08-production-readiness-gate.md`
- `14-testing-quality/08-ci-quality-gates.md`
- `15-deployment-operations/00-environments.md`
- `15-deployment-operations/01-vercel-deployment.md`
- `15-deployment-operations/02-supabase-operations.md`
- `15-deployment-operations/03-database-migrations-production.md`

---

# 1. Purpose

This document defines how OneDayOS monitors, observes, investigates, alerts on, and responds to production behavior.

Monitoring is not a nice-to-have.

Monitoring is part of the AppCare promise.

OneDayOS sells recurring care:

```txt
Hosting
Monitoring
Security updates
Backups
Bug fixes
AI support
Maintenance
```

Therefore, OneDayOS cannot responsibly claim AppCare unless it can answer basic operational questions:

```txt
Is the platform online?
Are users able to log in?
Are API routes failing?
Is the database healthy?
Are background jobs failing later?
Did the latest deployment introduce errors?
Which organizations are affected?
Which module is causing the problem?
Was customer data exposed?
Was the issue security-sensitive?
```

This document defines the minimum observability model needed to operate OneDayOS as a shared platform.

---

# 2. Core Principle

```txt
If we cannot see it, we cannot support it.
```

OneDayOS must not operate production clients blindly.

A one-day delivery business can still be technically serious. Fast delivery requires **more** observability, not less, because platform updates affect many client organizations at once.

---

# 3. Key Distinction: Monitoring vs Observability

## 3.1 Monitoring

Monitoring answers:

```txt
Is something wrong?
```

Examples:

```txt
Production is down
Error rate is high
Database connections are saturated
Login is failing
A deployment failed
Storage is almost full
Backups failed
```

## 3.2 Observability

Observability answers:

```txt
Why is it wrong?
Who is affected?
What changed?
Which module or route caused it?
What should we do next?
```

Examples:

```txt
/api/orgs/acme/inventory/stock-adjustments started returning 500s after deployment 2026-07-06. 
Only the Inventory module is affected.
The error is caused by a missing migration column.
Affected orgs: acme, demo-corp.
Rollback code is possible, but the database migration already ran.
Forward-fix required.
```

Monitoring alerts us.

Observability helps us repair.

---

# 4. What This Document Covers

This document covers:

```txt
application errors
runtime logs
structured logs
API failure monitoring
database health monitoring
Supabase monitoring
Vercel monitoring
deployment monitoring
uptime monitoring
alert severity levels
incident investigation signals
AppCare operational checks
logging safety
PII/log redaction
future metrics and dashboards
```

---

# 5. What This Document Does Not Cover

This document does not implement or define:

```txt
Audit Log Service
Activity Feed Service
Notification Service
Reporting Service
Background Jobs Service
client-facing status page
custom observability platform
Grafana/Prometheus stack for MVP
Datadog for MVP
OpenTelemetry pipeline for MVP
per-client observability dashboards
support-ticket system
full incident response process
cost management policy
```

Those are covered or deferred elsewhere.

Important distinction:

```txt
Operational logs are for OneDayOS operators.
Audit logs are product-visible records of business/user actions.
Activity feed is product-visible timeline UX.
Notifications are user-facing alerts.
```

Do not confuse them.

---

# 6. Current Platform Assumptions

OneDayOS MVP uses:

```txt
Next.js App Router
Vercel hosting
Supabase Auth
Supabase PostgreSQL
Prisma
One shared production database
Many tenant organizations
Tenant isolation through orgId + PlatformContext
SDK-only module access
```

Normal clients do not have separate deployments, Supabase projects, or databases.

Therefore, one production issue can affect many organizations.

This makes monitoring an AppCare-critical subsystem.

---

# 7. Monitoring Philosophy

## 7.1 Monitor the shared platform, not individual app forks

OneDayOS should monitor:

```txt
one production app
one production database
one auth system
one deployment pipeline
many organizations inside the app
```

Not:

```txt
client-a app
client-b app
client-c app
client-d app
```

Clients are tenant organizations, not infrastructure environments.

## 7.2 Prefer boring provider tools first

For MVP, use the tools already provided by the platform stack before building custom observability infrastructure.

Default sources:

```txt
Vercel Observability
Vercel Runtime Logs
Vercel deployment status
Supabase Dashboard logs and metrics
Supabase database reports
Sentry for application error tracking
external uptime monitor
```

Do not build a custom monitoring platform during the restarted foundation build.

## 7.3 Do not over-observe sensitive data

More logs are not always better.

OneDayOS handles business data and personal information.

Logs must help diagnose issues without becoming a second unsafe copy of production data.

Forbidden in logs:

```txt
passwords
session tokens
Supabase JWTs
service role keys
DATABASE_URL
DIRECT_URL
full request bodies
full Prisma records
full customer records
full employee records
full AI prompts containing business data
file contents
bank details
government IDs
salary/payroll data
medical data
```

## 7.4 Alert on symptoms, investigate with context

Alerts should identify symptoms:

```txt
high error rate
production down
database unavailable
deployment failed
login failing
storage nearly full
background job failures later
```

Logs and traces should provide context:

```txt
route
module
request ID
deployment ID
error code
status code
duration
orgId when necessary
userId when necessary
```

---

# 8. Required Observability Surfaces

OneDayOS must eventually observe all of these surfaces.

## 8.1 Availability

Questions:

```txt
Is the production site reachable?
Is the login page reachable?
Is an authenticated dashboard route reachable?
Are core API health routes reachable?
```

Minimum MVP:

```txt
external uptime check for public site
health endpoint check
manual authenticated smoke check before AppCare maturity
```

Future:

```txt
authenticated synthetic monitoring
per-region uptime checks
public status page
```

## 8.2 Application Errors

Questions:

```txt
Are users hitting unexpected exceptions?
Which route threw?
Which module threw?
Which deployment introduced it?
Which organizations are affected?
```

Minimum MVP:

```txt
Sentry or equivalent error tracking
server-side error capture
client-side error capture
release/deployment correlation
source maps in production
```

Sentry is the preferred default for MVP unless an ADR chooses another provider.

## 8.3 API Health

Questions:

```txt
Are protected APIs returning 500?
Are APIs redirecting when they should return JSON?
Are validation errors increasing?
Are wrong-org access attempts increasing?
Are permission denials increasing unusually?
```

Minimum MVP:

```txt
structured API logging through sdk.api.handle()
consistent API response shape
error codes
status codes
request IDs
route/module labels
```

## 8.4 Database Health

Questions:

```txt
Is Postgres reachable?
Are database connections saturated?
Are queries slow?
Are migrations successful?
Is storage approaching limits?
Are indexes missing?
Are locks blocking writes?
```

Minimum MVP:

```txt
Supabase database dashboard checks
basic database storage/connection monitoring
slow query awareness
migration verification
```

Future:

```txt
Supabase Metrics API
Grafana Cloud
Datadog
custom database alert rules
query performance regression dashboards
```

## 8.5 Auth Health

Questions:

```txt
Can users log in?
Can sessions refresh?
Are registration flows failing?
Are users getting orphaned Supabase Auth records?
Are password reset flows working?
```

Minimum MVP:

```txt
login smoke check
/api/kernel/auth/me monitoring through tests
registration route tests
Sentry capture for auth route failures
```

## 8.6 Deployment Health

Questions:

```txt
Did the deployment build successfully?
Did Prisma generate run?
Did environment variables validate?
Was the correct branch deployed?
Was the matching migration applied?
Did error rate spike after deployment?
```

Minimum MVP:

```txt
Vercel deployment status
CI gate status
post-deployment smoke check
release marker in error tracking
```

## 8.7 Backup and Restore Health

Questions:

```txt
Are backups enabled?
When was the last successful backup?
Has restore been tested?
Can we restore to staging?
Can we perform targeted tenant repair?
```

Minimum MVP:

```txt
manual backup verification checklist
restore drill before serious production use
pre-migration backup check
```

## 8.8 Future Background Job Health

Deferred until Background Jobs exist.

When added, monitor:

```txt
queue depth
job failures
retry counts
dead-letter count
job duration
import/export completion
scheduled job success
```

No background-job monitoring should be built before background jobs exist.

---

# 9. Recommended MVP Tooling

## 9.1 Vercel Observability

Use for:

```txt
function errors
function duration
traffic patterns
route-level performance
deployment investigation
runtime logs
usage anomalies
```

Vercel Observability is appropriate because OneDayOS runs on Vercel.

Do not build a replacement in MVP.

## 9.2 Vercel Runtime Logs

Use for:

```txt
API route failures
server-side logging
request investigation
deployment-specific runtime behavior
```

However, Vercel logs are not a substitute for structured error tracking.

Logs are useful for investigation.

Sentry-style error tracking is useful for grouping, alerting, stack traces, releases, and regressions.

## 9.3 Sentry

Preferred default for:

```txt
server exceptions
client exceptions
stack traces
release tracking
source maps
performance traces if needed
error grouping
regression visibility
```

Recommended initial setup:

```txt
@Sentry/nextjs integration
server-side error capture
client-side error capture
production source maps
release environment tags
orgId/userId tags where safe
PII disabled or heavily controlled
session replay disabled initially unless explicitly approved
```

Important:

```txt
Do not send full request bodies to Sentry.
Do not enable broad PII collection casually.
Do not enable session replay by default for SME business data.
```

## 9.4 Supabase Dashboard

Use for:

```txt
database health
database storage
connection issues
auth issues
logs
query performance investigation
backup visibility
```

## 9.5 Supabase Metrics API

Deferred for MVP.

Use later when OneDayOS needs:

```txt
custom dashboards
longer metric retention
Prometheus-compatible monitoring
database alert rules
multi-signal operations dashboard
```

Do not set up Prometheus/Grafana during the restarted foundation build unless production usage proves the need.

## 9.6 External Uptime Monitoring

Required before serious AppCare claims.

Provider may be chosen later.

Candidates:

```txt
Better Stack
UptimeRobot
Checkly
Pingdom
StatusCake
```

Minimum checks:

```txt
public homepage
login page
health endpoint
```

Future checks:

```txt
authenticated login flow
client dashboard smoke flow
module-specific smoke flow
```

Do not build a custom uptime monitoring system in OneDayOS MVP.

---

# 10. Health Endpoints

OneDayOS should expose limited internal health endpoints.

## 10.1 Public Health Endpoint

Path:

```txt
/api/health
```

Purpose:

```txt
basic deployment availability
external uptime monitoring
```

Response example:

```json
{
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "environment": "production"
  },
  "error": null
}
```

Rules:

```txt
must not expose secrets
must not expose database URLs
must not expose deployment internals beyond safe version/environment
must not expose organization count
must not expose user count
must not expose enabled modules
```

## 10.2 Deep Health Endpoint

Path:

```txt
/api/internal/health
```

Status:

```txt
Deferred until internal auth/admin access exists.
```

Potential checks:

```txt
database connectivity
migration version
Supabase Auth reachability
Storage reachability later
background job queue later
```

Access:

```txt
internal only
requires secure operator authentication or signed monitor token
never public
```

Do not build a deep health endpoint until access control is settled.

---

# 11. Structured Logging Contract

OneDayOS logs should be structured enough to investigate production issues without leaking sensitive data.

## 11.1 Log Levels

Use these levels:

```txt
debug
info
warn
error
fatal
```

Meaning:

| Level | Meaning |
|---|---|
| `debug` | Local/dev troubleshooting only. Usually disabled in production. |
| `info` | Expected operational event. |
| `warn` | Unexpected but recoverable condition. |
| `error` | Failed operation requiring investigation. |
| `fatal` | Platform-critical failure requiring immediate response. |

## 11.2 Required Log Fields

Server/API logs should prefer this shape:

```ts
type LogContext = {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  requestId?: string
  route?: string
  method?: string
  status?: number
  durationMs?: number
  module?: string
  operation?: string
  orgId?: string
  userId?: string
  errorCode?: string
  deploymentId?: string
  environment?: 'local' | 'preview' | 'staging' | 'production'
}
```

## 11.3 `orgId` and `userId` in Logs

`orgId` and `userId` are allowed in server logs when needed for investigation.

But they must be treated as internal diagnostic identifiers.

Rules:

```txt
allowed: orgId
allowed: userId
allowed: route
allowed: module
allowed: error code
allowed: request ID
avoid: user email unless needed
avoid: organization name unless needed
forbidden: passwords, tokens, secrets, full records, full request bodies
```

Reason:

```txt
Operators need to know which tenant is affected.
Operators do not need full customer data in logs.
```

## 11.4 Forbidden Log Patterns

Forbidden:

```ts
console.log(req.body)
console.log(await request.json())
console.log(process.env)
console.log(user)
console.log(customer)
console.log(employee)
console.log(error) // if error includes sensitive details without sanitization
```

Allowed pattern:

```ts
logger.error('Inventory create failed', {
  requestId,
  route: '/api/orgs/[orgSlug]/inventory/products',
  module: 'inventory',
  operation: 'product.create',
  orgId: ctx.org.id,
  userId: ctx.user.id,
  errorCode: 'INVENTORY_PRODUCT_CREATE_FAILED',
})
```

## 11.5 Logging Helper

The restarted build should include a server-only logging helper.

Recommended file:

```txt
src/lib/observability/logger.server.ts
```

Responsibilities:

```txt
standardize log format
redact sensitive keys
include environment
include request ID when available
send to console for Vercel ingestion
optionally capture error to Sentry
```

Forbidden:

```txt
logger in client components that can expose secrets
logger that accepts arbitrary request body without redaction
logger that sends full tenant data to third-party providers
```

---

# 12. Request IDs and Correlation

Every API request should have a request ID.

Purpose:

```txt
connect API response
server logs
Sentry error
deployment logs
support report
```

Implementation options:

```txt
read incoming x-request-id if trusted
otherwise generate crypto.randomUUID()
return request ID in response headers
include requestId in structured logs
include requestId in Sentry scope/tags
```

Response header:

```txt
x-onedayos-request-id: <uuid>
```

API error response may include request ID in `meta`:

```json
{
  "data": null,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong."
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

Do not expose stack traces to clients.

---

# 13. Error Tracking Contract

## 13.1 Expected Errors

Expected errors usually should not be captured as Sentry errors individually.

Examples:

```txt
401 UNAUTHENTICATED
403 FORBIDDEN
404 NOT_FOUND
400 VALIDATION_ERROR
409 CONFLICT
```

These should be logged at `warn` or `info` depending on frequency and context.

They may become alerts if volume spikes.

## 13.2 Unexpected Errors

Unexpected errors should be captured.

Examples:

```txt
uncaught exception
Prisma query failure
missing env var in production
unexpected Supabase Auth failure
unhandled service error
invariant violation
```

Capture with:

```txt
requestId
route
module
operation
orgId if available
userId if available
errorCode
release/deployment
```

Do not capture:

```txt
full request body
full database record
passwords
tokens
service keys
private file contents
```

## 13.3 Sentry Scope Rules

Recommended tags:

```txt
environment
release
route
module
operation
errorCode
orgId
```

Recommended user context:

```txt
id: userId
```

Avoid by default:

```txt
email
name
phone
organization name
```

Use `orgId` instead of organization name for diagnostics.

---

# 14. API Observability

Every API route should be wrapped by the platform API helper.

Recommended helper:

```txt
sdk.api.handle()
```

The wrapper should:

```txt
generate requestId
parse route params
create PlatformContext when needed
validate input
measure duration
map errors to API response shape
log safe structured summary
capture unexpected errors
return JSON only
never redirect
```

API logs should include:

```txt
method
route pattern
status
durationMs
requestId
module
operation
orgId when context exists
userId when context exists
errorCode when error exists
```

Forbidden:

```txt
logging raw request body
logging raw response data
logging full Prisma result
logging auth token
logging cookies
```

---

# 15. Database Observability

## 15.1 Minimum Database Checks

Before production client onboarding:

```txt
Supabase project health reviewed
connection mode verified
Prisma migration applied
seed/provisioning verified
basic query performance acceptable
storage capacity checked
backup setting checked
```

## 15.2 Database Metrics to Watch

Minimum operational awareness:

```txt
CPU
RAM
storage usage
connection count
pool saturation
long-running queries
slow queries
locks
replication/backup status if exposed
```

## 15.3 Query Logging

Prisma query logging in production should be cautious.

Recommended:

```txt
log query errors
log slow-query warnings later if implemented safely
avoid logging all SQL in production
avoid logging full query parameters if sensitive
```

## 15.4 Slow Query Policy

A query is operationally suspicious when it causes:

```txt
slow page load
API timeout
database CPU spike
connection saturation
locking
poor client UX
```

Potential future helper:

```txt
logger.warn('Slow database operation', {
  operation: 'inventory.stock_level.list',
  durationMs,
  orgId: ctx.org.id,
  module: 'inventory',
})
```

Do not build a full database performance platform in MVP.

---

# 16. Security Observability

OneDayOS should monitor suspicious patterns without turning logs into a privacy risk.

Security-relevant signals:

```txt
repeated 401s
repeated 403s
wrong-org access attempts
client-supplied orgId attempts
module-disabled access attempts
rate-like suspicious behavior
admin permission changes later
failed login spikes
unexpected service role usage
unexpected export attempts
```

Rules:

```txt
wrong-org attempts should be logged safely
client-supplied orgId attempts should be logged safely
permission denials should be observable but not noisy
security events must not include sensitive record payloads
```

Future:

```txt
Security Event Log
Admin security dashboard
Suspicious activity alerts
```

Deferred until evidence justifies it.

---

# 17. Multi-Tenant Incident Observability

Because OneDayOS is a shared platform, every incident must answer:

```txt
Is this global?
Is this limited to one module?
Is this limited to one organization?
Is this limited to one user role?
Is this caused by a deployment?
Is this caused by a migration?
Is this caused by a configuration change?
```

Logs and errors should make this possible through:

```txt
module
route
operation
orgId
userId
requestId
deployment ID
error code
```

Do not rely only on client reports like:

```txt
“It is not working.”
```

A production issue should be traceable.

---

# 18. Alerting Strategy

## 18.1 Alert Channels

Minimum MVP:

```txt
email alert to founder/operator
```

Recommended once AppCare grows:

```txt
Slack or equivalent team channel
phone/SMS/push for P0 incidents
status-page update workflow
```

Do not overcomplicate alert routing before there is an operations team.

## 18.2 Alert Severity Levels

### P0 — Critical Platform Incident

Examples:

```txt
production unavailable
login unavailable for all users
database unavailable
data leak suspected
wrong-tenant data exposure suspected
bad migration corrupts shared data
```

Response:

```txt
immediate investigation
pause risky deployments
communicate if client-impacting
preserve logs
document incident
add regression tests
```

### P1 — Major Degradation

Examples:

```txt
major module broken
high API 500 rate
many clients affected
production deployment introduced errors
backup/restore concern discovered
```

Response:

```txt
investigate quickly
rollback code if safe
forward-fix if migration-related
notify affected clients if needed
```

### P2 — Moderate Issue

Examples:

```txt
one module degraded
one client affected
non-critical API failure
performance issue
non-blocking auth edge case
```

Response:

```txt
triage
schedule fix
track regression test
```

### P3 — Minor Issue

Examples:

```txt
UI glitch
non-critical warning
low-volume recoverable error
cosmetic issue
```

Response:

```txt
log
prioritize normally
fix in normal maintenance cycle
```

---

# 19. Internal Targets vs Client Promises

OneDayOS may define internal targets.

Do not make public SLA promises casually.

For MVP/AppCare:

```txt
AppCare includes monitoring and maintenance.
It does not automatically guarantee enterprise SLA, zero downtime, or zero data loss.
```

Internal targets may include:

```txt
production uptime target
maximum alert acknowledgement target
maximum P0 investigation start target
maximum backup verification interval
monthly error review
```

But public SLA commitments require:

```txt
pricing
staffing
on-call coverage
backup/PITR maturity
incident response maturity
legal terms
```

Do not promise what operations cannot support.

---

# 20. Deployment Monitoring

Every production deployment should be observable.

Required deployment metadata:

```txt
git commit SHA
deployment ID
environment
release version
migration version if applicable
```

Post-deployment checks:

```txt
homepage loads
login page loads
/api/health returns ok
basic authenticated smoke route works
Sentry receives no immediate new critical errors
Vercel function error rate not spiking
Supabase database reachable
```

If a deployment follows a database migration:

```txt
verify migrated schema
verify app can read/write key records
verify no high error spike
verify tenant-scoped queries still work
```

---

# 21. AppCare Monitoring Checklist

Before claiming AppCare includes monitoring, OneDayOS should have:

```txt
[ ] Vercel production deployment monitored
[ ] Vercel runtime logs accessible
[ ] Sentry or equivalent error tracking configured
[ ] Source maps configured safely
[ ] Supabase database health reviewed
[ ] External uptime monitor configured
[ ] /api/health endpoint deployed
[ ] Alert email destination configured
[ ] Production error triage process defined
[ ] Backup status checked
[ ] Restore drill completed or scheduled
[ ] Incident severity levels defined
[ ] Client communication template drafted
[ ] Monthly AppCare review checklist drafted
```

If these are not done, do not overstate AppCare maturity.

---

# 22. Monthly AppCare Review

Each active production month should include a lightweight review.

Checklist:

```txt
[ ] Review Sentry unresolved errors
[ ] Review highest-volume API errors
[ ] Review Vercel function error trends
[ ] Review Vercel function duration/cost anomalies
[ ] Review Supabase database storage
[ ] Review Supabase connection/health issues
[ ] Review backup status
[ ] Review failed login/auth anomalies if available
[ ] Review recent deployments and incidents
[ ] Review open security regressions
[ ] Review recurring client support issues
```

Output:

```txt
internal AppCare notes
bugs to fix
regression tests to add
manual updates if architecture drift found
```

Do not manually create a long report for every small client unless priced into AppCare.

---

# 23. Observability and Privacy

Observability vendors can become data processors/subprocessors.

Before sending production data to third-party tools:

```txt
verify what data is sent
disable unnecessary PII
avoid session replay initially
avoid full payload capture
avoid full request/response body capture
review retention settings
review team access
```

Sentry/session replay caution:

```txt
Session replay can capture sensitive business UI.
Do not enable it by default in MVP.
Enable only after data masking and privacy review.
```

AI observability caution:

```txt
Do not send raw business prompts, full tenant records, or user data to AI tooling for debugging without explicit policy.
```

---

# 24. Logging Redaction Rules

The logging helper should redact common sensitive keys.

Recommended default redaction keys:

```txt
password
confirmPassword
token
access_token
refresh_token
authorization
cookie
set-cookie
apiKey
secret
serviceRoleKey
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
creditCard
bankAccount
governmentId
salary
```

Redaction behavior:

```txt
replace value with [REDACTED]
never partially log secrets
never log original value for debugging
```

Test redaction.

Do not rely on developer discipline alone.

---

# 25. Future Observability Maturity Levels

## Level 0 — Local Development Only

```txt
console errors
local tests
manual debugging
```

Not production-ready.

## Level 1 — First Production Client Minimum

```txt
Vercel runtime logs
/api/health
Sentry error tracking
Supabase dashboard checks
basic alert email
manual smoke checks
```

Required before real client production use.

## Level 2 — AppCare Minimum

```txt
external uptime monitor
error alerting
post-deployment checks
monthly AppCare review
backup verification
incident severity process
basic client-impact assessment
```

Required before confidently selling AppCare as recurring care.

## Level 3 — Growing Platform

```txt
Slack/on-call alerting
Supabase metrics export
dashboard for app/db metrics
synthetic authenticated checks
incident runbooks
status-page workflow
structured business-impact tagging
```

Appropriate after multiple paying clients.

## Level 4 — Enterprise Maturity

```txt
SLOs/SLAs
formal on-call rotation
dedicated observability stack
advanced tracing
per-enterprise tenant dashboards
compliance reporting
security event monitoring
```

Deferred.

---

# 26. Required Implementation Pieces for Restarted Build

The restarted foundation build should include only the minimum observability primitives.

Required before production client:

```txt
src/lib/observability/logger.server.ts
src/lib/observability/redact.ts
src/lib/observability/request-id.ts
src/app/api/health/route.ts
API wrapper requestId support
API wrapper safe error logging
Sentry or equivalent error tracking setup
production source maps configured safely
```

Required tests:

```txt
logger redacts sensitive keys
logger does not log raw request body
/api/health returns safe data only
API wrapper includes requestId
API wrapper returns JSON errors
unexpected API errors are captured/logged safely
architecture check blocks forbidden logging patterns where possible
```

Not required during foundation build:

```txt
custom observability dashboard
Grafana
Prometheus
Datadog
client-facing status page
synthetic authenticated monitor
advanced tracing
session replay
log drains
custom metrics API
```

---

# 27. Suggested Logger Interface

Example:

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

type LogMeta = {
  requestId?: string
  route?: string
  method?: string
  status?: number
  durationMs?: number
  module?: string
  operation?: string
  orgId?: string
  userId?: string
  errorCode?: string
  [key: string]: unknown
}

export const logger = {
  debug(message: string, meta?: LogMeta): void,
  info(message: string, meta?: LogMeta): void,
  warn(message: string, meta?: LogMeta): void,
  error(message: string, meta?: LogMeta & { error?: unknown }): void,
  fatal(message: string, meta?: LogMeta & { error?: unknown }): void,
}
```

Rules:

```txt
server-only
redacts sensitive keys
outputs structured JSON to console
captures unexpected errors through Sentry if configured
never throws from logger itself
```

---

# 28. Suggested API Wrapper Observability Flow

```txt
1. Request enters route.
2. Generate or read requestId.
3. Start timer.
4. Validate request.
5. Create PlatformContext if protected route.
6. Execute route handler/service.
7. Log summary with status and duration.
8. Return JSON response with requestId header.
9. If expected error, log safe warn/info.
10. If unexpected error, capture to Sentry and return safe JSON 500.
```

This keeps observability consistent across Kernel, Business Object, and Module APIs.

---

# 29. Alert Rules to Add Eventually

Minimum future alerts:

```txt
production uptime failed
/api/health failed
5xx error rate spike
Vercel deployment failed
Sentry new issue above threshold
Sentry regression in latest release
Supabase database unavailable
Supabase storage close to limit
Supabase connection saturation
backup failure or missing backup
background job failure later
```

Security-related future alerts:

```txt
wrong-org attempts spike
client-supplied orgId attempts spike
permission denial spike for sensitive routes
unexpected export attempts
admin/role changes later
```

Do not alert on every single 403.

Alert on suspicious patterns.

---

# 30. Claude Implementation Rules

Claude must not:

```txt
build a custom observability platform
add Datadog/Grafana/Prometheus without ADR
enable Sentry session replay by default
log full request bodies
log cookies or auth headers
log service role keys
log DATABASE_URL or DIRECT_URL
log full Prisma records
send full tenant data to Sentry
create per-client monitoring infrastructure
implement Audit Log, Activity Feed, or Notifications from this document
add FastAPI/Python monitoring stack
```

Claude may implement, when explicitly asked:

```txt
logger.server.ts
redaction helper
request ID helper
/api/health route
Sentry setup
API wrapper observability behavior
safe error capture
logger tests
health endpoint tests
architecture checks for forbidden log patterns
```

---

# 31. Acceptance Criteria

This document is ready for implementation when:

```txt
[ ] monitoring philosophy is approved
[ ] MVP tooling choices are approved
[ ] Sentry/equivalent decision is approved
[ ] uptime monitor requirement is approved
[ ] logging redaction rules are approved
[ ] request ID contract is approved
[ ] /api/health contract is approved
[ ] AppCare monitoring checklist is approved
[ ] deferred observability systems are clearly blocked
```

The implementation is complete when:

```txt
[ ] /api/health exists and exposes only safe data
[ ] request IDs exist for API responses
[ ] API wrapper logs safe structured summaries
[ ] unexpected server errors are captured
[ ] logger redacts sensitive keys
[ ] no full request bodies are logged
[ ] no secrets are logged
[ ] production error tracker is configured
[ ] source maps are configured safely
[ ] external uptime monitor is configured before AppCare claim
[ ] Vercel runtime logs are accessible
[ ] Supabase health/backup checks are documented
[ ] tests cover logger redaction
[ ] tests cover health endpoint response
[ ] tests cover API wrapper requestId/error behavior
[ ] `npm run check:all` passes
```

---

# 32. Founder Summary

Monitoring is how OneDayOS keeps AppCare real.

The MVP does not need a complex observability stack.

It does need:

```txt
Vercel logs and observability
Supabase health visibility
Sentry or equivalent error tracking
safe structured logs
request IDs
external uptime monitoring
backup/restore checks
monthly AppCare review
```

The biggest risk is not lacking dashboards.

The biggest risk is shipping a shared multi-tenant platform and not knowing when something breaks, who is affected, or whether customer data is at risk.

So the rule is:

```txt
Start boring.
Start safe.
Observe the shared platform.
Do not leak data into logs.
Do not overpromise AppCare before monitoring exists.
```

---

# 33. References

These references should be checked again before implementation because provider features and plan limits change over time.

- Vercel Observability documentation
- Vercel Runtime Logs documentation
- Vercel Alerts documentation
- Supabase Metrics API documentation
- Supabase Logs / Telemetry documentation
- Supabase Database Backups documentation
- Sentry Next.js SDK documentation
- OneDayOS Engineering Manual security and deployment documents
