# OneDayOS Engineering Manual — 15 Deployment & Operations — 08 Cost Management

**Document ID:** `15-deployment-operations/08-cost-management.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Date:** July 2026  
**Implementation Status:** Required Before AppCare Claims; Minimum Cost Controls Required Before First Paid AppCare Client  
**Depends On:**

- `01-foundation/01-business-model.md`
- `01-foundation/04-commercial-constraints.md`
- `02-architecture/00-system-architecture.md`
- `06-data/07-backup-restore.md`
- `10-platform-services/01-three-client-rule.md`
- `12-ai-layer/06-ai-safety-boundaries.md`
- `13-security/05-data-security.md`
- `15-deployment-operations/00-environments.md`
- `15-deployment-operations/01-vercel-deployment.md`
- `15-deployment-operations/02-supabase-operations.md`
- `15-deployment-operations/04-monitoring-observability.md`
- `15-deployment-operations/06-appcare-operations.md`

---

# 1. Purpose

This document defines how OneDayOS controls infrastructure, AI, storage, support, monitoring, backup, deployment, and operational costs while preserving the business promise:

```txt
₱20,000+ initial build
+ ₱3,500/month AppCare
+ fast delivery
+ shared reusable platform
+ low operational burden
```

Cost management is not accounting decoration.

It is part of the architecture.

A platform that is cheap to build but expensive to operate will fail commercially.

A platform that requires separate infrastructure per normal SME client will fail the one-day delivery promise.

A platform that lets AI, storage, logs, background jobs, or custom modules grow without limits will quietly destroy AppCare margins.

The goal is:

```txt
Every client improves the platform.
No normal client should create a hidden infrastructure company inside OneDayOS.
```

---

# 2. Core Principle

```txt
OneDayOS must be priced as a product,
not maintained like bespoke software.
```

This means:

```txt
Shared infrastructure by default.
Shared platform improvements by default.
Configuration before custom code.
Module reuse before one-off builds.
Provider tools before custom operations software.
Cost visibility before scale.
Premium pricing for premium operational burden.
```

---

# 3. Why Cost Management Is an Architecture Concern

OneDayOS is designed to serve many SME organizations through one shared platform.

That gives the business major advantages:

```txt
one codebase
one deployment pipeline
one database model
one AppCare workflow
one upgrade path
one module ecosystem
```

But it also means bad platform decisions affect all clients.

A single careless decision can multiply across every tenant:

```txt
unbounded AI calls
large file uploads
verbose logs
bad database queries
slow serverless functions
per-client infrastructure
custom client forks
unplanned background jobs
unscoped reporting queries
```

So cost control belongs in the Engineering Manual, not only in bookkeeping.

---

# 4. Scope

This document covers:

```txt
Vercel costs
Supabase costs
AI costs
Storage costs
Monitoring costs
Backup and restore costs
Email/SMS/provider costs
Domain and deployment costs
Support labor cost
Custom module cost
Dedicated infrastructure cost
Cost review cadence
Cost incident response
Claude implementation rules
```

This document does **not** define:

```txt
final public pricing page
accounting software
invoice generation
tax treatment
Stripe/billing implementation
customer collections process
formal financial reporting
```

Those belong to future business operations and billing documents.

---

# 5. Non-Negotiable Cost Decisions

## 5.1 Normal clients do not get separate infrastructure

For MVP and standard AppCare clients:

```txt
One OneDayOS-owned Vercel team/project model
One OneDayOS-owned Supabase production project
One shared production database
Many tenant organizations inside the app
```

Normal clients do **not** get:

```txt
separate Vercel project
separate Supabase project
separate database
separate schema
separate app fork
separate migration pipeline
separate backup process
```

Why:

```txt
10 clients should not mean 10 infrastructure stacks.
100 clients should not mean 100 migration targets.
```

Dedicated infrastructure is a future premium/enterprise option only.

---

## 5.2 Costly capabilities are deferred until proven

Do not implement costly shared services just because they sound useful.

Deferred services include:

```txt
Attachment Service
Notification Service
AI Support Agent
Background Jobs
Reporting Service
Search Service
Activity Feed
Approval Workflow Service
Comments Service
Dynamic CRUD
Dynamic Forms
View Builder
```

These are not free.

They create cost through:

```txt
new tables
new APIs
new UI
new tests
new storage
new monitoring
new background work
new support questions
new failure modes
new security review
```

They require evidence before implementation.

---

## 5.3 Client-specific forks are rejected

Do not solve cost or customization problems with app forks.

Rejected pattern:

```txt
client-a app
client-b app
client-c app
```

Correct pattern:

```txt
OneDayOS shared platform
  ├── Org: Client A
  ├── Org: Client B
  ├── Org: Client C
  └── Org: Client D
```

Client differences should be handled through:

```txt
OrgModule
settings
roles
permissions
feature flags
module configuration
extension tables
future workflow rules
```

Not through duplicated codebases.

---

## 5.4 AI is cost-controlled by default

AI is powerful but dangerous for margins.

MVP rule:

```txt
Development AI is allowed.
Runtime user-facing AI is deferred.
```

No user-facing AI feature may be implemented until it has:

```txt
explicit use case
estimated cost per action
rate limits
permission model
tenant boundary
logging policy
fallback behavior
abuse controls
founder approval
```

AI must never become an invisible cost leak.

---

## 5.5 AppCare is not unlimited labor

AppCare includes:

```txt
hosting
monitoring
security updates
backups
bug fixes
maintenance
limited support
AI-assisted support
```

AppCare does **not** automatically include:

```txt
new module development
large data cleanup
unlimited admin work
custom reports every week
client-specific workflow rewrites
unbounded integrations
free dedicated infrastructure
unlimited file storage
unlimited AI usage
```

---

# 6. Cost Surfaces

## 6.1 Vercel

Vercel cost drivers may include:

```txt
serverless/function compute
function duration
request volume
bandwidth/egress
image optimization
build minutes
observability/logging features
team/account plan
additional environments
```

Rules:

```txt
Use one shared Vercel production deployment for normal clients.
Do not create per-client Vercel projects.
Do not run production migrations inside Vercel build.
Do not use long-running tasks inside API requests.
Do not add heavy server-side rendering where static/server-light pages work.
Do not enable expensive observability features blindly.
```

Cost controls:

```txt
enable Vercel spend management where available
configure spend notifications
monitor bandwidth and function usage
watch slow API routes
avoid accidental loops or polling storms
review build/deployment usage monthly
```

---

## 6.2 Supabase

Supabase cost drivers may include:

```txt
database compute size
database storage
egress
monthly active users
auth usage
logs ingestion
storage size
storage egress
realtime usage
edge function invocations
backups / PITR
additional projects
dedicated compute
```

Rules:

```txt
One production Supabase project for normal clients.
Separate staging Supabase project.
No per-client Supabase projects for normal AppCare.
No Supabase Storage until Attachment Service or approved module-local file handling.
No Edge Functions in MVP.
No Realtime in MVP unless approved.
No Vector in MVP.
No manual dashboard schema edits.
```

Cost controls:

```txt
use Supabase spend cap where appropriate
review organization usage monthly
watch database size and egress
watch logs ingestion
watch monthly active users
watch storage before enabling attachments
watch slow queries before scaling compute
prefer indexes and query fixes before larger compute
```

---

## 6.3 Database queries

Database inefficiency becomes infrastructure cost.

Common cost leaks:

```txt
N+1 queries
unindexed tenant filters
large unpaginated tables
expensive cross-module reports
loading full records when only names are needed
unbounded exports
search implemented as table scans
AI querying large datasets
```

Rules:

```txt
Every tenant-scoped query filters by orgId through verified PlatformContext.
Every list endpoint paginates.
Every table has sane limits.
Every export requires explicit export permission.
Every expensive query needs indexes or review.
Cross-module reports require founder/architect approval.
```

---

## 6.4 Storage and files

Files are a major future cost risk.

Cost drivers:

```txt
file size
storage duration
download bandwidth
preview generation
virus scanning future
backup duplication
restore complexity
client support
```

Rules:

```txt
Attachment Service is deferred.
No generic file uploads in MVP.
No public buckets for private business files.
No client-controlled storage paths.
No unlimited file upload promises.
No file storage included without explicit limits.
```

When file handling is introduced, AppCare must define:

```txt
max file size
allowed file types
storage quota per org
overage policy
delete/archive policy
backup policy
restore limitations
```

---

## 6.5 AI usage

AI cost drivers:

```txt
model choice
input tokens
output tokens
context size
tool calls
retries
background agents
embeddings
vector storage
image/document processing
support chat volume
```

Rules:

```txt
No runtime AI in MVP unless explicitly approved.
No AI feature without per-action cost estimate.
No AI feature without rate limits.
No AI feature without tenant and permission checks.
No AI feature without logging usage by orgId and feature.
No full database dumps into prompts.
No AI export shortcut.
No AI-generated SQL.
```

Initial safe AI posture:

```txt
Use AI for development and internal support.
Reserve sdk.ai but do not implement runtime AI.
First future client-facing AI should be contextual help, not data querying.
```

---

## 6.6 Monitoring and observability

Monitoring tools can also become a cost surface.

Cost drivers:

```txt
log volume
error event volume
trace volume
session replay
retention period
number of seats
custom dashboards
alerts
```

Rules:

```txt
Use provider tools first.
Use Sentry or equivalent for application errors.
Do not enable session replay by default.
Do not log full request bodies.
Do not log full records.
Do not log secrets.
Limit log verbosity in production.
```

Monitoring must help AppCare without becoming an expensive analytics product.

---

## 6.7 Email, SMS, and external notifications

Notification cost drivers:

```txt
email volume
SMS volume
failed delivery retries
digests
provider monthly minimums
support around delivery issues
```

Rules:

```txt
Notification Service is deferred.
No SMS in MVP.
No bulk email in MVP.
No marketing email from OneDayOS operational systems.
No notification provider until Notification Service is approved.
```

Future Notification Service must define:

```txt
per-org usage limits
provider choice
retry rules
failure handling
opt-in/out preferences
cost attribution
```

---

## 6.8 Support labor

Support labor is the easiest cost to underestimate.

Cost drivers:

```txt
unclear scope
bad UX
missing docs
client-specific workflows
manual data fixes
custom reports
training gaps
slow bug diagnosis
no monitoring
no runbooks
```

Rules:

```txt
Every module needs documentation.
Every client needs handover notes.
Every support request should be classified.
Every bug fix should produce a regression test.
Every repeated support issue should improve docs or UX.
```

Support categories:

| Category | AppCare Treatment |
|---|---|
| Bug | Included |
| Small configuration help | Included within reason |
| User training refresh | Limited / scheduled |
| New feature | Quoted |
| New module | Quoted |
| Custom report | Quoted unless already included |
| Data cleanup | Usually quoted |
| Client mistake requiring data repair | Case-by-case |
| Dedicated infrastructure | Premium/enterprise |

---

## 6.9 Dedicated infrastructure

Dedicated infrastructure may be offered later for premium clients.

Triggers:

```txt
large contract value
strict compliance requirement
custom SLA
client demands infrastructure ownership
data residency requirement
high-risk data
large file/AI/storage usage
```

Dedicated infrastructure requires separate pricing because it adds:

```txt
separate Vercel deployment
separate Supabase project
separate migration execution
separate backup monitoring
separate incident response
separate environment variables
separate restore testing
separate support burden
```

MVP rule:

```txt
Do not offer dedicated infrastructure as part of standard AppCare.
```

---

# 7. Cost Categories

Every new feature, module, or client request should be classified into one of these cost categories.

| Category | Meaning | Default Decision |
|---|---|---|
| Platform-fixed cost | Shared cost of running OneDayOS | Covered by pooled AppCare |
| Per-org variable cost | Cost grows with each client org | Track and limit |
| Per-user variable cost | Cost grows with active users | Track through plan limits |
| Per-record variable cost | Cost grows with data volume | Use pagination/indexes/archival |
| Per-file variable cost | Cost grows with uploads/downloads | Require quota before enabling |
| Per-AI-action cost | Cost grows with prompts/tool calls | Require approval and limits |
| Support labor cost | Human time | Classify as bug/config/enhancement |
| Dedicated ops cost | Separate infrastructure | Premium only |

---

# 8. AppCare Unit Economics

The base AppCare price is:

```txt
₱3,500 / month / client organization
```

This must cover normal usage of:

```txt
hosting
monitoring
backups
security updates
bug fixes
maintenance
support
```

Therefore, OneDayOS must know at least roughly:

```txt
monthly platform cost
monthly variable cost per client
monthly support time per client
gross margin per client
```

A simple founder-level formula:

```txt
AppCare margin per client
= AppCare revenue
- allocated shared infrastructure cost
- estimated variable usage cost
- estimated support labor cost
- provider/tool allocation
```

Example structure:

```txt
₱3,500 AppCare revenue
- ₱X allocated Vercel/Supabase/monitoring cost
- ₱Y estimated support labor
- ₱Z variable AI/storage/email cost
= contribution margin
```

Do not obsess over exact allocation too early.

But do not ignore it either.

Minimum recommendation:

```txt
Review platform cost monthly.
Review support burden monthly.
Review any client whose usage/support is abnormal.
```

---

# 9. Fair Use Policy

Standard AppCare should include normal SME usage.

It should not imply unlimited everything.

The client-facing contract should eventually define fair-use limits for:

```txt
number of users
number of enabled modules
file storage
AI usage
support requests
large data imports
large exports
custom reports
integrations
```

MVP internal default:

```txt
Do not advertise unlimited unless the cost is truly negligible.
```

Potential future plan fields already align with this:

```txt
Subscription.maxUsers
Subscription.maxModules
Subscription.storageGb
```

Additional future fields may include:

```txt
aiMonthlyCredits
exportMonthlyLimit
fileUploadLimitMb
apiRateLimit
supportTier
```

Do not implement these until needed, but design pricing language so they can exist.

---

# 10. Cost Controls by Provider

## 10.1 Vercel controls

Required before serious production use:

```txt
[ ] Company-owned Vercel team/account
[ ] Billing owner assigned
[ ] Spend notifications enabled where available
[ ] Spend management reviewed
[ ] Production and preview env vars separated
[ ] Build command includes prisma generate
[ ] Production migrations not run in Vercel build
[ ] Runtime logs reviewed regularly
[ ] Slow/erroring functions investigated
```

Do not use Vercel as:

```txt
background worker platform for long-running jobs
per-client deployment factory
production migration runner
unbounded API polling surface
```

---

## 10.2 Supabase controls

Required before serious production use:

```txt
[ ] Company-owned Supabase organization
[ ] MFA enforced for owners/admins
[ ] At least two trusted owners
[ ] Production project on appropriate paid plan
[ ] Staging and production projects separated
[ ] Spend cap reviewed where applicable
[ ] Backups configured and restore tested
[ ] PITR decision documented
[ ] Logs usage reviewed
[ ] Storage not enabled casually
[ ] Service role key protected
```

Do not use Supabase as:

```txt
manual schema editor
per-client project factory for normal clients
unbounded file storage bucket
hidden support backdoor
```

---

## 10.3 OpenAI / AI-provider controls

Required before any runtime AI feature:

```txt
[ ] Provider project separated from personal usage
[ ] Usage limits reviewed
[ ] Cost dashboard reviewed
[ ] Allowed models documented
[ ] Rate limits defined
[ ] Per-org usage logging designed
[ ] Prompt/context size limits defined
[ ] Sensitive fields excluded by default
[ ] Abuse scenario reviewed
```

No runtime AI feature may launch without a cost estimate.

---

# 11. Cost Attribution

MVP should not build a full internal billing analytics engine.

But we should make future attribution possible.

Where safe and practical, logs/events should include diagnostic identifiers:

```txt
orgId
moduleId
featureId
requestId
operation type
```

This helps answer:

```txt
Which client is causing high API usage?
Which module is slow?
Which feature is expensive?
Which client needs a higher plan?
```

Rules:

```txt
Do not log sensitive business data.
Do not log full request bodies.
Do not log full records.
Do not log secrets.
Do not expose internal cost attribution to client users in MVP.
```

---

# 12. Cost-Aware Engineering Rules

## 12.1 Pagination is mandatory

List APIs must paginate.

Rejected:

```ts
await db.product.findMany({ where: { orgId: ctx.org.id } })
```

Required:

```ts
await db.product.findMany({
  where: { orgId: ctx.org.id, deletedAt: null },
  take: pageSize,
  skip,
  orderBy: { createdAt: 'desc' },
})
```

## 12.2 Exports require explicit permission

Read is not export.

```txt
objects.customer.read
```

is not the same as:

```txt
objects.customer.export
```

Exports can create:

```txt
data leakage risk
large query cost
support requests
compliance risk
```

## 12.3 Imports must be bounded

Imports can create:

```txt
large writes
bad data
support burden
undo/repair work
```

MVP imports should use controlled onboarding scripts unless an import feature is explicitly approved.

## 12.4 Logs must be minimal

Bad:

```ts
console.log(body)
console.log(record)
console.log(process.env)
```

Good:

```ts
logger.info('inventory.stock_adjustment.create.failed', {
  requestId,
  orgId: ctx.org.id,
  userId: ctx.user.id,
  code: error.code,
})
```

## 12.5 AI context must be small

Bad:

```txt
Send all products, customers, employees, and orders to AI.
```

Good:

```txt
Send module metadata, user question, allowed summary, and bounded query results.
```

## 12.6 Background jobs require approval

Do not add background jobs just because a task is slow.

First ask:

```txt
Can the task be optimized?
Can the task be batched manually?
Can it be handled by onboarding script?
Is this repeated across modules?
Does this require a durable queue?
```

---

# 13. Client Request Cost Classification

When a client asks for a new feature, classify it before building.

| Request | Cost Risk | Decision |
|---|---|---|
| Add one dropdown option | Low | Configuration if possible |
| Add one field to module-owned extension table | Low/Medium | Accept if reusable enough |
| Add field to core Business Object | Medium/High | Requires Business Object review |
| Upload files | High | Defer or module-local with approval |
| Send SMS | High variable | Defer unless priced separately |
| Generate PDF reports | Medium/High | Quote or defer |
| AI assistant | High variable/security | Defer unless tightly scoped |
| New industry-specific module | Medium/High | Spec + quote as module |
| Dedicated database | High ops | Premium/enterprise only |
| Custom client fork | Very high | Reject |

---

# 14. Cost Review Cadence

## Daily / during early production

```txt
[ ] Check production errors
[ ] Check uptime alerts
[ ] Check obvious usage spikes
[ ] Check deployment health after releases
```

## Weekly

```txt
[ ] Review Vercel usage
[ ] Review Supabase usage
[ ] Review error tracking volume
[ ] Review slow routes / DB concerns
[ ] Review support requests by client
```

## Monthly

```txt
[ ] Review infrastructure invoice
[ ] Review client AppCare revenue
[ ] Review high-support clients
[ ] Review high-usage clients
[ ] Review storage growth
[ ] Review AI usage if any
[ ] Review backup/restore posture
[ ] Decide whether pricing/fair-use rules need adjustment
```

## Before enabling a costly feature

```txt
[ ] Estimate cost surface
[ ] Define limits
[ ] Define permissions
[ ] Define logs/metrics
[ ] Define support impact
[ ] Define billing treatment
[ ] Founder approval
```

---

# 15. Cost Incident Response

A cost incident occurs when usage or billing increases unexpectedly.

Examples:

```txt
AI usage spike
file storage spike
serverless function loop
bad polling UI
large export loop
runaway logs
database query storm
bot traffic
misconfigured preview deployment using production
```

Response:

```txt
1. Identify provider and cost surface.
2. Check whether production clients are affected.
3. Pause or disable the runaway feature if necessary.
4. Preserve logs needed for diagnosis.
5. Block abusive traffic or broken code path.
6. Deploy fix or rollback code.
7. Review whether tenant data/security was affected.
8. Add test, architecture check, rate limit, or monitoring alert.
9. Update manual if the cost surface was not documented.
```

Cost incidents are not only finance issues.

They may reveal:

```txt
missing rate limits
bad UI polling
unsafe exports
bad AI design
missing pagination
missing provider limits
```

---

# 16. Pricing and Plan Implications

The starter AppCare price should assume:

```txt
normal SME usage
limited users
limited modules
no heavy file storage
no runtime AI
no SMS
no dedicated infrastructure
no custom SLA
```

If a client needs more, price more.

Potential future plan differentiators:

```txt
more users
more modules
more storage
premium support
advanced reports
AI credits
integrations
dedicated infrastructure
custom SLA
```

Do not silently include premium cost surfaces in the base plan.

---

# 17. Dedicated Infrastructure Pricing Rule

Dedicated infrastructure is not just a technical setting.

It is a different operating model.

If offered later, it should include:

```txt
setup fee
higher monthly AppCare
separate backup monitoring
separate migration process
separate incident response
separate restore drills
separate environment variables
separate deployment checks
```

Minimum rule:

```txt
Dedicated infrastructure must never be priced like normal AppCare.
```

---

# 18. Generator Rules

Generators must not create cost-heavy features by default.

Module generator must not generate:

```txt
file upload scaffolding
AI scaffolding
background job scaffolding
notification scaffolding
reporting engine scaffolding
search indexing scaffolding
custom monitoring dashboards
SMS/email provider code
per-client deployment files
FastAPI/Python workers
```

Generated modules should be cost-safe by default:

```txt
pagination-ready
permission-enforced
tenant-scoped
soft-delete aware
event-emitting
no unbounded exports
no client-supplied orgId
```

---

# 19. Claude Implementation Rules

Claude must not:

```txt
create per-client infrastructure
add FastAPI/Python backend for cost reasons
add AI runtime features without approval
add file storage without approved Attachment/module-local file spec
add background jobs without approved Background Jobs spec
add SMS/email providers without Notification Service approval
add unbounded exports
add unpaginated list endpoints
log request bodies or full records
suggest db push for production
hide costs inside AppCare scope
```

Claude must:

```txt
prefer shared platform implementation
use existing provider controls
keep costly services deferred unless approved
include pagination
include limits
include tests
include architecture checks
surface cost risks in implementation notes
```

---

# 20. AppCare Cost Checklist

Before selling AppCare seriously:

```txt
[ ] Vercel account/team ownership is clear
[ ] Vercel spend alerts/controls reviewed
[ ] Supabase organization ownership is clear
[ ] Supabase spend cap / usage controls reviewed
[ ] Production/staging separated
[ ] Backup and restore tested
[ ] Monitoring configured
[ ] Error tracking configured
[ ] Logs are privacy-safe
[ ] AppCare included/excluded scope written
[ ] Support classification process written
[ ] No runtime AI cost surface active without limits
[ ] No file storage feature active without quota
[ ] No per-client infrastructure unless premium
[ ] Monthly cost review scheduled
```

---

# 21. Acceptance Criteria

This document is accepted when:

```txt
[ ] Founder understands why normal clients share infrastructure
[ ] Founder understands shared infrastructure cost/blast-radius tradeoff
[ ] AppCare scope is not confused with unlimited custom work
[ ] Vercel, Supabase, AI, storage, monitoring, and support costs are identified
[ ] Deferred services are not treated as free roadmap items
[ ] Costly features require approval and limits
[ ] Dedicated infrastructure is explicitly premium/enterprise only
[ ] Claude is blocked from creating cost-heavy systems casually
[ ] Monthly cost review is part of operations
```

---

# 22. Founder Summary

The business goal is not to minimize cost at all costs.

The goal is to make cost predictable.

The dangerous pattern is:

```txt
low setup fee
low monthly AppCare
high hidden support burden
high hidden infrastructure cost
custom client forks
unlimited usage promises
```

The correct pattern is:

```txt
shared platform
controlled modules
clear AppCare scope
fair-use limits
provider spend controls
monthly review
premium pricing for premium burden
```

OneDayOS becomes commercially strong when every new client increases reusable platform value without creating a new operational burden that eats the margin.

---

# 23. References

These references were checked while drafting. Pricing, quotas, and plan names can change, so always verify current provider documentation before making pricing commitments.

- Vercel Spend Management: https://vercel.com/docs/spend-management
- Vercel Pricing and Usage: https://vercel.com/docs/pricing
- Vercel Manage and Optimize Usage: https://vercel.com/docs/pricing/manage-and-optimize-usage
- Supabase Billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase Cost Control / Spend Cap: https://supabase.com/docs/guides/platform/cost-control
- Supabase Compute Usage: https://supabase.com/docs/guides/platform/manage-your-usage/compute
- Supabase Storage Usage: https://supabase.com/docs/guides/platform/manage-your-usage/storage-size
- Supabase Egress Usage: https://supabase.com/docs/guides/platform/manage-your-usage/egress
- OpenAI API Pricing: https://developers.openai.com/api/docs/pricing
- OpenAI API Rate Limits: https://developers.openai.com/api/docs/guides/rate-limits
- OpenAI API Production Best Practices: https://developers.openai.com/api/docs/guides/production-best-practices

---

# 24. Next Document

Recommended next document:

```txt
16-client-delivery/00-one-day-delivery-playbook.md
```
