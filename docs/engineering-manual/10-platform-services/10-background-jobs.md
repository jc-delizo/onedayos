# OneDayOS Engineering Manual — 10 Platform Services — 10 Background Jobs

**Document ID:** `10-platform-services/10-background-jobs.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Deferred — Contract Only`  
**Owner:** Founding Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/04-sdk-events.md`
- `05-sdk/06-sdk-testing-contract.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`

---

# 1. Purpose

This document defines the future **Background Jobs** capability for OneDayOS.

Background Jobs allow the platform to run work outside the immediate user request lifecycle.

Examples:

```txt
send a notification after a business event
process an import file
generate a large export
sync with an external integration
retry a failed webhook
run a nightly maintenance check
recalculate report aggregates
expire stale invitations
clean up abandoned temporary files
```

However, this document is **contract-only**.

Claude must not implement a job queue, worker runtime, retry engine, scheduled-job system, durable workflow engine, or queue provider from this document alone.

The correct foundation-stage work is:

```txt
1. Keep business operations synchronous while simple.
2. Emit clean tenant-scoped business events now.
3. Avoid request handlers doing long-running work.
4. Preserve future seams for durable async processing.
5. Add Background Jobs only when real module needs prove them.
```

---

# 2. Core Decision

Background Jobs are a **future Platform Service**, not part of the restarted MVP Kernel.

They should be implemented only after repeated use cases prove that synchronous request handling and in-process event listeners are no longer enough.

```txt
Foundation build:
  Event Bus contract exists.
  Business events are emitted.
  No durable job queue yet.
  No worker runtime yet.
  No scheduled job framework yet.

Future platform service:
  Durable queue.
  Job records.
  Worker processing.
  Retries.
  Idempotency.
  Dead-letter handling.
  Scheduled jobs.
  Monitoring.
```

This follows the Three Independent Use Cases Rule.

---

# 3. Why Background Jobs Are Deferred

Background Jobs sound foundational, but implementing them too early adds operational complexity before OneDayOS has enough real workflows.

A job system introduces:

```txt
database tables or provider resources
queue provider selection
worker deployment model
retry behavior
idempotency requirements
dead-letter handling
monitoring
alerting
cost tracking
failure recovery
transaction boundaries
security boundaries
testing complexity
```

That is too much to add before we know the real workload patterns.

OneDayOS should first prove:

```txt
Kernel
SDK
Tenancy
Permissions
Business Objects
Module System
Event contracts
First official module
```

Then Background Jobs can be promoted when needed.

---

# 4. What Background Jobs Are

A Background Job is a unit of work that can be executed outside the original user-facing request.

A job may be:

```txt
asynchronous
scheduled
retryable
idempotent
longer-running than a normal API request
triggered by an event
triggered by a user action
triggered by a schedule
triggered by an integration callback
```

Examples:

```txt
import 10,000 products from CSV
generate a large inventory valuation export
send low-stock alert notifications
sync supplier catalog data nightly
process uploaded receipts
run stale leave request escalation
rebuild search indexes
send daily digest emails
retry failed webhook delivery
```

---

# 5. What Background Jobs Are Not

Background Jobs are not:

```txt
the Event Bus
the Notification Service
the Audit Log Service
the Activity Feed Service
the Approval Workflow Service
the Reporting Service
the Search Service
the AI Layer
a replacement for correct transactions
a place to hide business logic
a reason to skip immediate validation
a reason to accept client-supplied orgId
a reason to use FastAPI in the core platform
a generic workflow engine
```

Important distinction:

```txt
Event Bus = describes that something happened.
Background Jobs = process work asynchronously.
Notification Service = decides whether and how to notify.
Approval Workflow Service = manages approval lifecycle.
```

These capabilities may interact later, but they are not the same thing.

---

# 6. Relationship to the Event Bus

The current/foundation Event Bus may be in-process.

That is acceptable for MVP because events initially serve as architectural contracts.

Current behavior:

```txt
Business mutation succeeds.
Service emits event.
In-process listeners may react.
Listener failure does not break mutation.
```

Future behavior:

```txt
Business mutation succeeds.
Service writes event/outbox record transactionally.
Background worker publishes/consumes jobs.
Consumers process events durably.
Retries and dead-letter handling exist.
```

The SDK event contract should be designed so the internal implementation can move from in-process listeners to durable background processing without changing module code.

Modules should keep calling:

```ts
await sdk.events.emit(ctx, event)
```

They should not know whether the event is handled in memory, stored in an outbox table, sent to a queue, or processed by a worker.

---

# 7. When Background Jobs Become Necessary

Background Jobs should be considered when at least one of these patterns appears repeatedly.

## 7.1 Work Takes Too Long for a Normal Request

Examples:

```txt
large CSV imports
large exports
PDF generation
image/file processing
AI document extraction
bulk updates
```

If a request regularly risks timing out or making the UI feel slow, it may need a job.

## 7.2 Work Needs Retry

Examples:

```txt
email provider failure
SMS provider failure
third-party API failure
webhook delivery failure
file processing failure
```

If failure should be retried automatically, it probably needs a job.

## 7.3 Work Needs Scheduling

Examples:

```txt
daily report generation
subscription renewal checks
trial expiration checks
nightly sync jobs
weekly backup verification
cleanup of expired temporary files
```

If work should happen without direct user action, it may need scheduled background execution.

## 7.4 Work Fans Out

Examples:

```txt
one event creates notifications for 100 users
one import creates 10,000 records
one integration sync touches many entities
one report refresh affects many dashboards
```

If one operation creates many downstream tasks, it may need queueing.

## 7.5 Work Must Not Block the User

Examples:

```txt
post-action analytics
non-critical notifications
non-critical cache refreshes
non-critical search indexing
```

If the user does not need to wait for the result, background processing may improve perceived speed.

---

# 8. Three Independent Use Cases Trigger

A Background Jobs Platform Service should be proposed after at least three independent job use cases exist.

Example evidence:

```txt
Use case 1: Inventory imports large product CSV files.
Use case 2: Expenses processes receipt attachments asynchronously.
Use case 3: Reporting generates large exports in the background.
```

At that point, write:

```txt
Background Jobs Service Proposal
Architecture Decision Record
Provider evaluation
Data model
SDK contract
Security model
Retry/idempotency policy
Monitoring plan
Testing plan
Implementation prompt for Claude
```

Three use cases trigger review, not automatic implementation.

---

# 9. Provider Candidates

No provider is selected in this document.

Provider selection requires a future ADR.

Possible candidates include:

```txt
Vercel Cron Jobs
Vercel Queues
Vercel Workflows
Inngest
Trigger.dev
Upstash QStash
Supabase/Postgres-backed job queue
Custom Postgres outbox + worker
```

For the current OneDayOS stack, the most natural first candidates are likely:

```txt
Vercel Cron Jobs for simple scheduled triggers.
Vercel Queues or equivalent for durable asynchronous work.
Postgres outbox table for transactional event durability.
```

But this is not a provider decision.

Do not add a queue dependency during the restarted foundation build.

---

# 10. Vercel Runtime Considerations

OneDayOS is hosted on Vercel in the current stack.

Vercel Functions are excellent for request/response APIs, but background work must respect serverless execution limits.

Important implications:

```txt
Do not assume a long-running process is always alive.
Do not assume in-memory queues survive deployment or cold starts.
Do not use setInterval-style background workers in the app server.
Do not store critical queued work only in memory.
Do not run large imports synchronously inside user-facing requests.
```

If Background Jobs are implemented later, the platform should use a durable queue, provider-managed workflow system, or database-backed outbox pattern.

---

# 11. Scheduled Jobs

Scheduled jobs are jobs that run on a time basis.

Examples:

```txt
daily low-stock digest
nightly subscription status check
monthly AppCare maintenance check
weekly backup verification reminder
expired invitation cleanup
stale approval escalation
```

MVP foundation should not implement scheduled jobs unless a specific approved document requires them.

Future scheduled jobs must:

```txt
run server-side only
be idempotent
use service-level authentication
never accept arbitrary client input
resolve tenant scope explicitly
log success/failure
avoid scanning all tenant data without batching
respect organization status
respect module enablement where applicable
```

---

# 12. Queue Jobs

Queue jobs are jobs placed into a durable queue and processed by workers.

Examples:

```txt
process_product_import
send_notification
rebuild_search_index
generate_report_export
sync_external_system
process_attachment
retry_webhook_delivery
```

Future queue jobs must include:

```txt
job type
job id
org id
actor id if user-triggered
payload
status
attempt count
created timestamp
available-at timestamp
started timestamp
completed timestamp
failed timestamp
last error
idempotency key
```

However, job payloads must be minimal.

Bad payload:

```json
{
  "orgId": "org_123",
  "product": {
    "id": "prod_123",
    "name": "Full Product Record",
    "cost": 100,
    "supplier": { "...": "..." }
  }
}
```

Better payload:

```json
{
  "productId": "prod_123",
  "reason": "import_row_processed"
}
```

The worker should fetch fresh data using verified tenant context.

---

# 13. Tenant Isolation Rules

Future Background Jobs must be tenant-scoped.

Every job that touches tenant data must include a verified tenant identity created by the server, not by the client.

Rules:

```txt
Client-supplied orgId is forbidden.
Job payload orgId must be server-derived.
Workers must create a trusted job context before database access.
Workers must use sdk.getDb(ctx), not raw Prisma.
Workers must check module enablement where module data is affected.
Workers must respect soft delete.
Workers must not leak one tenant's errors/data into another tenant's logs or output.
```

The worker equivalent of `PlatformContext` may be named:

```ts
type JobContext = PlatformContext & {
  jobId: string
  jobType: string
  isBackgroundJob: true
}
```

But this is a future design detail.

The principle is mandatory:

```txt
No background code may access tenant data without a verified context.
```

---

# 14. Permission Rules

Background Jobs do not eliminate permissions.

There are two common job types:

```txt
user-triggered jobs
system-triggered jobs
```

## 14.1 User-Triggered Jobs

Examples:

```txt
user uploads CSV import
user requests report export
user asks AI to process a document
user triggers sync
```

Rules:

```txt
Permission must be checked before enqueueing the job.
The job should record actorId.
The job should record the permission-relevant action.
The worker should not rely only on the fact that the job exists.
If the actor loses permission before execution, behavior must be defined by the future service spec.
```

MVP recommendation for future implementation:

```txt
Check permission before enqueue.
Worker runs as platform system within the same org.
Audit/job metadata records the original actor.
```

## 14.2 System-Triggered Jobs

Examples:

```txt
nightly subscription check
scheduled backup verification
scheduled digest generation
cleanup expired records
```

Rules:

```txt
System jobs must use a platform system actor.
System jobs must be tenant-scoped when touching tenant data.
System jobs must respect organization status.
System jobs must respect enabled modules where applicable.
System jobs must be auditable.
```

---

# 15. Module Enablement Rules

Future jobs that are related to a module must check whether that module is enabled for the organization.

Example:

```txt
Job: generate_inventory_low_stock_digest
Requires: inventory module enabled
```

If Inventory is disabled before the job runs:

```txt
Job should be skipped or cancelled safely.
It must not resurrect disabled module behavior.
```

This prevents a disabled module from continuing to affect a client through background side effects.

---

# 16. Idempotency

Every future job handler must be idempotent.

Idempotent means the same job can safely run more than once without corrupting data.

This is mandatory because durable queues commonly use at-least-once delivery semantics.

Examples:

Bad:

```txt
Job runs twice → sends duplicate invoice.
Job runs twice → creates duplicate stock movement.
Job runs twice → emails customer twice.
```

Good:

```txt
Job has idempotency key.
Handler checks whether result already exists.
Duplicate execution becomes no-op.
```

Future job records should include:

```txt
idempotencyKey
```

Examples:

```txt
inventory-import:org_123:file_456:row_100
report-export:org_123:report_789:2026-07-05
notification:org_123:event_456:user_789
```

---

# 17. Retry Policy

Retries are useful but dangerous.

A future Background Jobs Service must define retry behavior per job type.

Required fields:

```txt
max attempts
retry delay
backoff strategy
retryable error classes
non-retryable error classes
dead-letter behavior
alert threshold
```

Examples:

```txt
Network timeout → retry.
Third-party 503 → retry.
Validation error → do not retry.
Permission denied → do not retry.
Tenant not found → do not retry.
Module disabled → do not retry.
Malformed payload → do not retry.
```

Retries must never cause duplicate business effects.

Idempotency is required before retries.

---

# 18. Dead-Letter Handling

A dead-letter job is a job that failed permanently or exceeded retry limits.

Future dead-letter behavior should include:

```txt
job retained for investigation
last error stored safely
no sensitive data leaked
operator-visible status
tenant-scoped visibility where appropriate
manual retry only for safe job types
support escalation path
```

MVP foundation should not implement dead-letter tables yet.

But future job design must account for them.

---

# 19. Transactions and Outbox Pattern

The most important future design question is how to connect database mutations with queued work.

Problem:

```txt
Create product in database.
Emit product.created event to queue.
```

If the database write succeeds but queue publishing fails, downstream work is lost.

If the queue publish succeeds but database write rolls back, downstream work sees an event for data that does not exist.

Future solution candidate:

```txt
Transactional outbox pattern.
```

Pattern:

```txt
1. Business mutation writes data.
2. Same database transaction writes outbox event.
3. Background dispatcher reads unsent outbox events.
4. Dispatcher publishes to queue or processes listeners.
5. Outbox event is marked dispatched.
```

This is likely the right future direction for important event-driven jobs.

Do not implement it during the restarted foundation build unless a later approved document says so.

But current event payload design should remain compatible with a future outbox.

---

# 20. Job Status Model — Future Candidate

If OneDayOS implements an internal job table later, a possible model is:

```prisma
model BackgroundJob {
  id              String    @id @default(cuid())
  orgId           String?
  type            String
  status          String    // queued | running | succeeded | failed | cancelled | dead_letter
  payload         Json
  idempotencyKey  String?
  actorUserId     String?
  attempts        Int       @default(0)
  maxAttempts     Int       @default(3)
  availableAt     DateTime  @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  failedAt        DateTime?
  lastErrorCode   String?
  lastErrorMessage String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([orgId, status])
  @@index([type, status])
  @@unique([idempotencyKey])
  @@map("background_jobs")
}
```

This model is illustrative only.

Claude must not add it during foundation implementation.

---

# 21. Job API Design — Future Candidate

Future job APIs may include:

```txt
POST /api/orgs/[orgSlug]/jobs
GET  /api/orgs/[orgSlug]/jobs/[jobId]
GET  /api/orgs/[orgSlug]/jobs
POST /api/orgs/[orgSlug]/jobs/[jobId]/cancel
POST /api/orgs/[orgSlug]/jobs/[jobId]/retry
```

But these are not approved now.

Future job APIs must follow the Kernel API Contract:

```json
{
  "data": {},
  "error": null
}
```

or:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

Rules:

```txt
APIs return JSON only.
No redirects.
No HTML auth responses.
No client-supplied orgId.
Validated route params.
Validated body.
Verified PlatformContext.
Permission checks.
Tenant-safe responses.
```

---

# 22. Job SDK Design — Future Candidate

A future SDK surface may look like:

```ts
sdk.jobs.enqueue(ctx, {
  type: 'inventory.import_products',
  payload: { fileId },
  idempotencyKey,
})

sdk.jobs.getStatus(ctx, jobId)

sdk.jobs.cancel(ctx, jobId)
```

But `sdk.jobs` is reserved, not implemented.

Do not expose SDK methods until the service is approved.

---

# 23. Security Requirements

Future Background Jobs must satisfy these requirements:

```txt
No client-supplied orgId.
No raw Prisma in job handlers outside approved service internals.
No module-to-module imports.
No direct Kernel imports from modules.
No full sensitive records in payloads.
No secrets in payloads.
No public job IDs that leak tenant information.
No cross-tenant job status visibility.
No background permission bypass.
No queue consumer running with overbroad unrestricted data access.
```

Job logs must avoid sensitive data.

Bad log:

```txt
Failed to process payroll for employee Juan dela Cruz salary 50000
```

Better log:

```txt
Failed to process payroll job job_123 for org org_456: VALIDATION_ERROR
```

The full sensitive context should remain inside secured database records, not logs.

---

# 24. Observability Requirements

Future Background Jobs must be observable.

Minimum future observability:

```txt
job count by type
job count by status
oldest queued job age
failed jobs by type
retry count
dead-letter count
average processing time
last successful scheduled run
last failed scheduled run
```

AppCare eventually requires operational visibility.

A platform cannot offer maintenance and monitoring if background failures are invisible.

---

# 25. Cost Requirements

Background processing can create hidden costs.

Future implementation must track or estimate:

```txt
queue provider cost
function execution cost
AI processing cost
storage cost
bandwidth cost
retry storm risk
large import/export cost
per-organization heavy usage
```

The AppCare price must remain commercially viable.

A future heavy background job may require:

```txt
plan limits
usage limits
paid add-on
admin approval
rate limiting
quota enforcement
```

Do not build unlimited background work by default.

---

# 26. UI Requirements

When background jobs exist, users need status visibility.

Examples:

```txt
Import started.
Processing 240 of 5,000 rows.
Import completed with 12 errors.
Export is being prepared.
Your file is ready to download.
Sync failed. Retry.
```

Future UI patterns:

```txt
non-blocking toast
job progress panel
job status page
error download for imports
retry button
cancel button
admin job monitor
```

Do not implement these now.

But any future job UX must follow OneDayOS UI principles:

```txt
premium
calm
clear
fast
non-blocking
recoverable
```

---

# 27. Import Jobs

Imports are the most likely first real Background Jobs use case.

Examples:

```txt
import employees
import products
import customers
import suppliers
import stock balances
```

Initial rule:

```txt
Small imports may be synchronous if safe.
Large imports should become jobs only after proven need.
```

Future import jobs must:

```txt
validate every row
record row-level errors
avoid partial corruption
support dry-run mode
be tenant-scoped
use PlatformContext
respect permissions
emit events for successful mutations
avoid full file contents in job payload
```

Do not build an Import Engine during foundation.

---

# 28. Export Jobs

Exports may become jobs when data size is large.

Examples:

```txt
inventory valuation export
customer list export
employee masterlist export
large audit export
large report export
```

Future export jobs must:

```txt
require explicit export permission
respect current user's permissions
exclude soft-deleted records by default
avoid exposing cross-tenant data
expire generated files
audit sensitive exports later
```

Read permission is not automatically export permission.

---

# 29. Notification Jobs

A future Notification Service may use Background Jobs for delivery.

Example:

```txt
inventory.stock_level.reorder_threshold_crossed
  → notification service decides recipients
  → background job sends in-app/email/SMS later
```

But modules should not enqueue notification jobs directly.

Modules should emit business facts.

The future Notification Service decides whether to enqueue notification work.

---

# 30. Search Index Jobs

A future Search Service may use Background Jobs to update indexes.

Example:

```txt
objects.product.updated
  → search service queues search index update
```

Modules should not know about search indexing.

Search indexing should be a Platform Service consumer.

---

# 31. AI Jobs

Some future AI work may require background execution.

Examples:

```txt
summarize uploaded incident report
extract fields from receipt
generate report narrative
process document embeddings
```

AI jobs are especially cost-sensitive and security-sensitive.

Future AI jobs must:

```txt
be tenant-scoped
respect permissions
avoid sending unnecessary PII to model providers
record cost metadata
support cancellation where practical
never execute arbitrary user instructions as system tasks
```

Do not build AI jobs during the foundation build.

---

# 32. FastAPI Decision

FastAPI is not part of the OneDayOS core platform.

Background Jobs do not change this decision.

Do not add:

```txt
FastAPI
Celery
RQ
Dramatiq
SQLAlchemy
Alembic
Python worker runtime
```

unless a future ADR proves a narrow, specialized need.

Possible future exception:

```txt
A dedicated AI/document-processing worker where Python libraries are genuinely required.
```

Even then, that worker must be a specialized Platform Service behind the SDK/API boundary, not a second general backend.

---

# 33. Anti-Patterns

## 33.1 In-Memory Queues

Forbidden:

```ts
const queue: Job[] = []
```

Why:

```txt
lost on restart
lost on deployment
not durable
not scalable
invisible
```

## 33.2 `setInterval` Workers in the Web App

Forbidden:

```ts
setInterval(processJobs, 5000)
```

Why:

```txt
serverless runtimes are not always alive
multiple instances may duplicate work
no durability
no visibility
```

## 33.3 Client-Enqueued Tenant Jobs

Forbidden:

```json
{
  "orgId": "org_123",
  "jobType": "export_customers"
}
```

Why:

```txt
client-supplied orgId is a tenant isolation risk
```

## 33.4 Long Work Inside API Requests

Forbidden:

```ts
export async function POST(req) {
  await processTenThousandRows()
  return Response.json(...)
}
```

Why:

```txt
slow UI
timeout risk
no retry
poor user experience
```

## 33.5 Jobs as Business Logic Dumping Ground

Forbidden:

```txt
Move confusing logic to a job so the API route looks simple.
```

Business rules belong in services.

Jobs should orchestrate when work runs, not redefine what the business operation means.

---

# 34. Testing Requirements — Future

A future Background Jobs implementation must include tests for:

```txt
enqueue permission checks
tenant isolation
client-supplied orgId rejection
idempotency
retryable error behavior
non-retryable error behavior
dead-letter behavior
module-disabled behavior
soft-deleted target behavior
successful processing
event emission after processing
no duplicate business effects
job status API security
cross-tenant job visibility denial
```

Every security-sensitive test must use at least two organizations.

Admin-only tests are insufficient.

---

# 35. Implementation Gate

Background Jobs may not be implemented until this gate passes:

```txt
[ ] Three independent use cases documented
[ ] Evidence log written
[ ] Founder/architect approves promotion
[ ] ADR approved
[ ] Provider selected
[ ] SDK contract written
[ ] Data model written
[ ] Tenant isolation model written
[ ] Permission model written
[ ] Idempotency policy written
[ ] Retry/dead-letter policy written
[ ] Monitoring plan written
[ ] Cost plan written
[ ] Tests defined
[ ] Claude implementation prompt written
```

---

# 36. Claude Implementation Rules

Claude must not implement Background Jobs from this document alone.

Claude is forbidden from adding:

```txt
queue provider dependencies
background job tables
worker routes
cron configuration
job dashboard
sdk.jobs implementation
outbox tables
email/SMS processing
search indexing workers
AI processing workers
FastAPI workers
Python backend files
```

Claude may only implement Background Jobs after receiving a frozen implementation-grade document that explicitly authorizes the work.

---

# 37. Correct Foundation Behavior

During the restarted foundation build, Claude should do this:

```txt
Emit clean events.
Keep services transactional.
Keep APIs fast.
Avoid long-running work.
Reserve sdk.jobs but do not implement it.
Do not add queue dependencies.
Do not add scheduled jobs.
Do not add workers.
```

This is enough for the platform foundation.

---

# 38. Founder Review Questions

Before freezing this document, answer:

```txt
1. Are we comfortable deferring Background Jobs until proven use cases?
2. Do we agree that the Event Bus exists now but durable queueing comes later?
3. Do we agree that in-memory queues and setInterval workers are forbidden?
4. Do we agree that future jobs must use verified tenant context?
5. Do we agree that FastAPI remains excluded from the core platform?
6. Do we agree that imports/exports are likely the first real job candidates?
```

---

# 39. Summary

Background Jobs are important, but not foundational for the restarted MVP.

The correct architecture is:

```txt
Now:
  Clean services.
  Verified PlatformContext.
  Tenant-safe APIs.
  Event contracts.
  No durable jobs yet.

Later:
  Promote Background Jobs after evidence.
  Select provider through ADR.
  Add queue/outbox/scheduling carefully.
  Preserve SDK boundaries.
  Keep tenant isolation mandatory.
```

OneDayOS should not build a queue system just because mature platforms have one.

It should build Background Jobs when real module demand proves that synchronous requests and simple events are no longer enough.
