# OneDayOS Engineering Manual — 15 Deployment & Operations / 02 Supabase Operations

**Document ID:** `15-deployment-operations/02-supabase-operations.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Foundation Build`  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `00-meta/00-roadmap.md`
- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `05-sdk/02-sdk-db-access.md`
- `06-data/00-database-architecture.md`
- `06-data/04-migrations-seeding.md`
- `06-data/07-backup-restore.md`
- `13-security/06-secrets-management.md`
- `13-security/08-production-readiness-gate.md`
- `15-deployment-operations/00-environments.md`
- `15-deployment-operations/01-vercel-deployment.md`

---

# 1. Purpose

This document defines how OneDayOS operates Supabase as the managed backend infrastructure for the restarted platform build.

Supabase is not merely a database vendor in OneDayOS. It is the managed infrastructure layer for:

```txt
PostgreSQL database
Supabase Auth
future Supabase Storage
project environment separation
database connection management
backups and restore workflows
service-role administration
production operational controls
```

This document exists so Claude, future engineers, and the founder do not accidentally operate OneDayOS like a collection of client apps.

The default OneDayOS model is:

```txt
One OneDayOS-owned Supabase organization
One production Supabase project
One staging Supabase project
Optional development/test projects
Many OneDayOS client organizations inside the production database
```

The client receives a OneDayOS tenant organization.

The client does **not** receive a Supabase account.

---

# 2. Non-Goals

This document does **not** define:

```txt
Prisma schema details
Prisma migration syntax
Vercel deployment process
application-level tenant isolation implementation
full backup/restore runbooks
Supabase RLS policy implementation
Supabase Storage bucket implementation
client onboarding workflows
support SLA
billing automation
self-hosted Supabase
FastAPI infrastructure
```

Those are covered or deferred in other documents.

This document defines the operational model for using Supabase safely as OneDayOS infrastructure.

---

# 3. Core Decision

## 3.1 Supabase belongs to OneDayOS, not to normal clients

For MVP and standard AppCare customers, the Supabase organization and projects are owned by OneDayOS.

```txt
Supabase Organization: OneDayOS Systems
  ├── Project: onedayos-production
  ├── Project: onedayos-staging
  └── Project: onedayos-development / onedayos-test
```

Inside the production database:

```txt
organizations
  ├── Client A
  ├── Client B
  ├── Client C
  └── Client D
```

This is different from:

```txt
Client A Supabase project
Client B Supabase project
Client C Supabase project
```

The second model is rejected for MVP because it creates per-client infrastructure operations, migration drift, backup complexity, and AppCare overhead.

---

# 4. Mental Model

## 4.1 Supabase organization vs OneDayOS organization

These two words sound similar but mean different things.

| Term | Meaning |
|---|---|
| Supabase Organization | Infrastructure billing/team/account container owned by OneDayOS |
| Supabase Project | Hosted backend project containing Postgres, Auth, Storage, keys, settings |
| OneDayOS Organization | Client tenant row inside the OneDayOS application database |
| OneDayOS User | Application user who logs in to OneDayOS |
| Supabase Dashboard User | Infrastructure operator/admin with Supabase console access |

A client user is **not** a Supabase Dashboard user.

A client organization is **not** a Supabase organization.

A client app is **not** a Supabase project.

---

# 5. Why Standard Clients Do Not Get Their Own Supabase Account

## 5.1 The platform model

OneDayOS is built around:

```txt
one codebase
one platform deployment
one production database
many tenant organizations
shared modules
per-org configuration
per-org permissions
per-org module enablement
```

This is the same mental model as:

```txt
Odoo
ERPNext
Salesforce
Microsoft Dynamics
```

A client buys OneDayOS plus modules.

They do not buy their own isolated copy of the infrastructure by default.

## 5.2 Operational reason

If every standard client had its own Supabase project, then 10 clients would mean:

```txt
10 Supabase projects
10 production databases
10 auth configurations
10 sets of environment variables
10 migration targets
10 backup policies
10 restore workflows
10 billing surfaces
10 places for schema drift
10 places for configuration drift
```

At 100 clients, this becomes operationally dangerous and commercially unviable for a low monthly AppCare price.

## 5.3 Commercial reason

The standard OneDayOS offer is based on:

```txt
fast delivery
shared platform improvements
low operational cost
repeatable AppCare
centralized security fixes
centralized backups and monitoring
```

Per-client Supabase projects break that model.

## 5.4 Update reason

With one shared platform, a security fix is deployed once:

```txt
Fix tenant guard
Deploy platform
All clients benefit
```

With per-client projects, the same fix must be migrated and verified repeatedly:

```txt
Patch Client A
Patch Client B
Patch Client C
Patch Client D
...
```

This is exactly what OneDayOS must avoid.

---

# 6. Accepted Default Infrastructure Model

## 6.1 Standard production model

```txt
Vercel production deployment
  ↓
OneDayOS production Supabase project
  ↓
PostgreSQL database
  ↓
organizations table
  ↓
Client tenants separated by orgId
```

## 6.2 Required Supabase projects

At minimum:

```txt
onedayos-production
onedayos-staging
```

Recommended:

```txt
onedayos-production
onedayos-staging
onedayos-development
onedayos-ci-test
```

## 6.3 Project purpose

| Project | Purpose | May Contain Real Client Data? |
|---|---|---|
| Production | Real clients | Yes |
| Staging | Pre-production migration/deployment verification | No, unless controlled sanitized snapshot |
| Development | Local/dev support | No |
| CI Test | Automated test database | No |

---

# 7. Dedicated Infrastructure Exception

Dedicated Supabase infrastructure may be offered later, but only as a premium/enterprise option.

Valid reasons:

```txt
large enterprise contract
strict compliance requirement
client demands own infrastructure
client demands direct database ownership
custom SLA
high-risk data category
regional/data residency requirement
higher support budget
```

Dedicated infrastructure must not be included in the standard one-day build price or base AppCare plan.

If offered later, it requires:

```txt
separate pricing
separate deployment runbook
separate migration process
separate backup monitoring
separate incident response
separate support terms
separate ADR
```

Claude must not create dedicated-infrastructure behavior unless a future founder-approved ADR exists.

---

# 8. Supabase Product Usage Boundaries

## 8.1 PostgreSQL

PostgreSQL is the primary database for OneDayOS.

It stores:

```txt
organizations
users
roles
permissions
business objects
module-owned records
settings
subscriptions
module enablement
future platform service data
```

Rules:

```txt
Prisma is the schema and migration authority.
No dashboard table edits for application schema.
No hand-edited production schema.
No per-client schemas.
No per-client databases for standard clients.
Every tenant-scoped table uses orgId.
```

## 8.2 Supabase Auth

Supabase Auth is the identity provider.

It stores:

```txt
auth credentials
session state
auth user identity
email/password login state
future MFA state
future password reset state
```

OneDayOS stores platform user records in Prisma:

```txt
User
Role
UserRole
Permission
Employee link
orgId
```

Rules:

```txt
Supabase Auth user ID equals Prisma User.id.
Registration is server-owned.
Client does not call supabase.auth.signUp() directly for platform registration.
API auth and page auth use separate helpers.
Current user lookup uses /api/kernel/auth/me.
```

## 8.3 Supabase Storage

Storage is deferred until the Attachment Service or module-local approved file handling exists.

Before that:

```txt
No production buckets.
No public business-file buckets.
No upload APIs.
No file metadata tables.
No attachment UI.
```

When eventually used:

```txt
binary object lives in Supabase Storage
metadata lives in PostgreSQL
access is server-authorized
private files use signed URLs
storage paths are server-generated
client-supplied bucket/path/url is rejected
```

## 8.4 Supabase Edge Functions

Supabase Edge Functions are not part of the MVP core platform.

Rejected for MVP:

```txt
business module APIs in Edge Functions
permission logic in Edge Functions
background jobs in Edge Functions
AI calls in Edge Functions
migration scripts in Edge Functions
```

The OneDayOS backend boundary remains Next.js route handlers on Vercel.

A future Edge Function may be allowed only through an ADR.

## 8.5 Supabase Realtime

Realtime is deferred.

Do not implement:

```txt
live dashboards
realtime table updates
presence
chat
activity stream subscriptions
notification subscriptions
```

Realtime may be useful later, but it is not part of the restarted foundation build.

## 8.6 Supabase Vector / pgvector

Vector search and embeddings are deferred.

Do not implement:

```txt
AI embeddings
semantic search
vector indexes
RAG store
AI document retrieval
```

Future AI/search work requires separate documents and ADRs.

---

# 9. Supabase Account and Organization Operations

## 9.1 Ownership

OneDayOS must use a company-owned Supabase organization.

Rejected:

```txt
personal founder hobby project as production infrastructure
shared personal login
single-owner account with no recovery path
client-owned Supabase project for standard clients
```

Required:

```txt
company-owned Supabase organization
production project inside company organization
staging project inside company organization
at least two trusted owners before serious production
MFA enabled for operators
billing controlled by company
```

## 9.2 Access roles

Supabase access must follow least privilege.

Suggested role usage:

| Person / Role | Supabase Access |
|---|---|
| Founder / infrastructure owner | Owner |
| Trusted technical co-founder / backup operator | Owner or Administrator |
| Engineer implementing app code | Developer or limited project access |
| Accountant / billing-only operator | Billing access if available; otherwise no project access |
| Client | No Supabase dashboard access |
| Claude | No real Supabase dashboard access, no production secrets |

## 9.3 MFA

MFA should be required for all Supabase organization owners and administrators.

Minimum rule:

```txt
No production Supabase Owner/Admin account without MFA.
```

## 9.4 Owner redundancy

OneDayOS should not depend on a single Supabase account owner.

Before serious production:

```txt
[ ] At least two trusted owners exist
[ ] Recovery email is company-controlled
[ ] Billing owner is known
[ ] Emergency contact path is known
[ ] MFA is enabled
```

---

# 10. Billing Operations

## 10.1 OneDayOS pays Supabase

For standard AppCare clients:

```txt
Client pays OneDayOS
OneDayOS pays Supabase
```

Clients do not pay Supabase directly.

## 10.2 Billing risk

Billing failure can affect multiple clients.

Therefore, production billing must be treated as infrastructure risk.

Minimum controls:

```txt
valid company payment method
backup payment method when possible
billing email monitored
renewal/failed-payment emails monitored
monthly cost review
Supabase plan documented
PITR decision documented
compute size documented
```

## 10.3 Cost discipline

Each additional Supabase project may add compute cost.

Therefore:

```txt
Do not create per-client projects for normal clients.
Do not create forgotten test projects.
Do not create preview Supabase projects casually.
Archive/delete unused non-production projects safely.
```

---

# 11. Project Naming Convention

Use clear project names:

```txt
onedayos-production
onedayos-staging
onedayos-development
onedayos-ci-test
```

Avoid:

```txt
my-test-project
oneday-final
prod-2
client-a-db
john-supabase
```

Project names must make environment purpose obvious.

---

# 12. Region Selection

Supabase region selection should optimize for Philippine SME users.

Decision factors:

```txt
latency to Philippine users
Vercel deployment region compatibility
backup/restore availability
cost
future compliance needs
```

Once production region is chosen, changing it later is not trivial.

Therefore, production region must be recorded in operations documentation.

Required record:

```txt
Production Supabase region: [TBD]
Reason: [TBD]
Chosen by: [TBD]
Date: [TBD]
```

Claude must not choose production region silently.

---

# 13. Environment Variable Model

## 13.1 Required variables

OneDayOS uses different values per environment.

Typical variables:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_APP_URL
```

Future variables may include:

```txt
SUPABASE_PROJECT_REF
SUPABASE_ACCESS_TOKEN_FOR_CI
SMTP credentials
storage bucket names
backup destination credentials
AI provider keys
```

## 13.2 Secret boundaries

Public variables:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
```

Server-only variables:

```txt
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
SUPABASE_ACCESS_TOKEN
SMTP_PASSWORD
AI_PROVIDER_API_KEY
```

Rules:

```txt
Server secrets never use NEXT_PUBLIC_.
Service role key never reaches browser code.
DATABASE_URL never reaches browser code.
DIRECT_URL never reaches browser code.
Client components never import server env helpers.
```

## 13.3 Environment separation

Production Vercel environment variables point to production Supabase.

Staging Vercel environment variables point to staging Supabase.

Preview/local/CI must not use production Supabase unless explicitly approved for a read-only emergency diagnostic task.

---

# 14. Connection Strings and Prisma

## 14.1 Required connection categories

OneDayOS needs two database connection purposes:

```txt
Runtime queries
Migration/admin operations
```

Suggested variables:

```txt
DATABASE_URL = runtime connection string
DIRECT_URL = migration/admin direct connection string
```

## 14.2 Runtime connection

Vercel serverless functions produce many short-lived connections.

The default runtime connection should use the Supabase pooler strategy suitable for serverless traffic.

Rules:

```txt
Runtime app uses DATABASE_URL.
Runtime app does not use DIRECT_URL.
Prisma connection limits must be conservative.
Connection timeouts must be monitored.
```

## 14.3 Migration connection

Prisma migrations should use the direct/admin-capable connection where appropriate.

Rules:

```txt
Migrations use DIRECT_URL where Prisma config requires it.
Production migrations are not run inside Vercel build.
Production migrations run only through approved migration process.
```

## 14.4 Prisma + Supabase pooler cautions

Prisma and transaction poolers need careful settings because prepared statements and connection behavior can differ between direct connections and poolers.

Rules:

```txt
Use the documented Supabase/Prisma connection pattern.
Do not guess connection strings.
Do not paste random dashboard strings into production without review.
Do not change DATABASE_URL/DIRECT_URL without running staging checks.
```

---

# 15. Database Operations

## 15.1 Prisma owns application schema

OneDayOS application schema changes must flow through Prisma migrations.

Allowed:

```txt
edit prisma/schema.prisma
create migration locally
review migration SQL
apply to staging
verify
apply to production through approved process
```

Rejected:

```txt
create app tables manually in Supabase dashboard
edit production columns manually
rename production columns manually
create one-off client tables manually
use db push in production
```

## 15.2 Supabase managed schemas

Supabase owns managed schemas like:

```txt
auth
storage
realtime
```

OneDayOS should not make Prisma manage these schemas directly in MVP.

Rules:

```txt
Prisma models live in application-owned schema/tables.
Auth user data is synchronized into Prisma User through application logic.
Do not create direct Prisma dependencies on auth.users in MVP.
Do not allow Prisma migration drift from Supabase managed schemas.
```

## 15.3 SQL Editor usage

The Supabase SQL editor is allowed only for controlled operations:

```txt
read-only diagnostics
approved emergency repair
approved migration verification
approved manual restore inspection
```

It is not allowed for normal application schema changes.

Every production write through SQL editor must be recorded:

```txt
Date
Operator
Reason
SQL executed
Affected orgId(s)
Rollback/repair plan
Founder approval
```

## 15.4 Table Editor usage

The Supabase Table Editor should not be used for normal production data management.

Allowed only:

```txt
read-only inspection
emergency founder-approved repair if no safer tool exists
```

Rejected:

```txt
manual client onboarding through random table edits
manual module enabling without audit/provisioning script once tooling exists
manual schema editing
manual user/role edits without record
```

---

# 16. Supabase Auth Operations

## 16.1 Auth ownership

Supabase Auth stores authentication identity.

OneDayOS stores authorization identity.

```txt
Supabase Auth: who can authenticate
OneDayOS Prisma User: who exists in the platform
Roles/Permissions: what they can do
Employee: business/person record
```

## 16.2 Registration

Registration is server-owned.

Rules:

```txt
Client does not call supabase.auth.signUp() directly for OneDayOS tenant creation.
Registration API creates Supabase Auth user and Prisma records in one logical sequence.
If Prisma creation fails, auth user must be cleaned up or the failure must be recoverable.
First org user receives Admin role.
```

## 16.3 Login

Login may use Supabase browser client for password sign-in.

After login, the client must ask OneDayOS who the current platform user is:

```txt
GET /api/kernel/auth/me
```

Rejected:

```txt
GET /api/kernel/users/[id]
```

Reason: current-user lookup must be session-derived, not IDOR-shaped.

## 16.4 Password reset

Password reset is allowed as a future auth flow, but it must be configured safely.

Rules:

```txt
Redirect URLs must be environment-specific.
Reset completion page must not reveal whether an email belongs to an account.
Reset token handling must rely on Supabase-supported flow.
Password reset does not bypass OneDayOS user status.
Inactive/suspended users remain blocked by OneDayOS context checks.
```

## 16.5 Email confirmation

For B2B operator-provisioned MVP onboarding, skipping email confirmation may be acceptable.

But if public self-service registration is ever opened, email confirmation policy must be reviewed.

Required future decision:

```txt
B2B invite-only registration
vs
public self-service registration
```

## 16.6 Custom SMTP

Custom SMTP is not required for the restarted foundation build.

It may be needed before polished production onboarding because default auth emails may not match OneDayOS branding/deliverability needs.

Future SMTP setup requires:

```txt
provider decision
from address
DNS records
email templates
secret storage
bounce/complaint handling
support process
```

Do not add SMTP credentials casually.

---

# 17. Supabase Service Role Key Operations

## 17.1 Service role key power

The service role key is highly privileged.

It may bypass database protections such as RLS and should be treated as production infrastructure root-level access.

Rules:

```txt
Never expose service role key to browser code.
Never prefix service role key with NEXT_PUBLIC_.
Never paste service role key into Claude/chat.
Never store service role key in module manifests.
Never log service role key.
Never send service role key to clients.
```

## 17.2 Allowed usage

Allowed service role use cases:

```txt
server-owned registration
admin auth user creation/deletion
controlled back-office maintenance scripts
future controlled support tooling
```

Disallowed:

```txt
normal module reads/writes
client-side auth
browser components
module services by default
public APIs
```

## 17.3 Rotation

Rotate service role key if:

```txt
it is pasted into chat/Claude
it is committed to Git
it appears in logs
an operator account is compromised
an engineer leaves without clean offboarding
there is any uncertainty about exposure
```

Rotation must be tested in staging before production when possible.

---

# 18. Supabase Storage Operations — Future

Storage is deferred until attachments/file-handling is approved.

## 18.1 Storage must not start accidentally

Claude must not create:

```txt
storage buckets
storage upload APIs
storage RLS policies
signed URL helpers
file metadata tables
attachment UI
```

unless an approved Attachment Service or module-local file-handling document exists.

## 18.2 Future storage model

When implemented:

```txt
PostgreSQL stores file metadata.
Supabase Storage stores binary objects.
Server generates path.
Server authorizes upload/download.
Client receives short-lived signed URL.
Private business files are not public.
```

## 18.3 Backup implication

Database backups do not automatically guarantee full recovery of Storage objects.

Therefore, before attachments launch, OneDayOS needs:

```txt
storage object backup strategy
metadata/object consistency checks
restore drill including files
storage cost monitoring
```

---

# 19. RLS Operations — Future Defense in Depth

RLS is not MVP’s primary tenant isolation mechanism.

MVP tenant isolation comes from:

```txt
verified PlatformContext
sdk.getDb(ctx)
service-level org scoping
API tenant guards
permission enforcement
two-org tests
architecture checks
```

RLS remains a future defense-in-depth layer.

Rules now:

```txt
Do not implement RLS casually.
Design tables to be RLS-compatible.
Do not expose application tables directly to browser Supabase clients.
Do not rely on Supabase auth.uid() for OneDayOS tenancy strategy in MVP.
```

Future RLS implementation requires:

```txt
RLS ADR
staging table experiment
Postgres app.org_id context strategy
Prisma transaction wrapper
performance test
rollback plan
```

---

# 20. Backups and Restore Operations

## 20.1 Production backup posture

Production must run on a Supabase plan appropriate for real customer data.

Minimum requirements before serious production:

```txt
[ ] Paid production project
[ ] Backup availability understood
[ ] PITR decision documented
[ ] Restore drill completed
[ ] Backup access permissions controlled
[ ] AppCare promise aligned with actual backup capability
```

## 20.2 PITR decision

Point-in-Time Recovery is not optional to consider.

It may or may not be enabled immediately, but the decision must be explicit:

```txt
PITR status: enabled / disabled
Reason: [TBD]
RPO expectation: [TBD]
RTO expectation: [TBD]
Date reviewed: [TBD]
```

Do not promise near-zero data loss unless PITR or equivalent tested recovery exists.

## 20.3 Restore drills

Backups are not real until restored.

Required restore drill before serious production:

```txt
1. Restore production-like backup to non-production project.
2. Verify organizations table.
3. Verify users/roles/permissions.
4. Verify Business Objects.
5. Verify module data.
6. Verify migration history.
7. Verify auth implications.
8. Document time required.
9. Document issues found.
```

## 20.4 One-client incident strategy

Because OneDayOS uses one shared database, restoring production for one client’s mistake is usually too destructive.

Preferred path:

```txt
restore backup to staging
identify affected orgId data
write targeted repair script
review dry run
execute repair in production
verify affected client
```

Full production restore is a last resort.

---

# 21. Supabase Branching and Preview Workflows

Supabase branching may be useful later, but it is not required for MVP.

For MVP:

```txt
staging project is enough
preview deployments do not run production migrations
preview deployments do not get production DB credentials
```

Future branching can be considered for:

```txt
database migration previews
schema diff workflows
complex PR validation
larger engineering team
```

Do not build the OneDayOS foundation around Supabase branching unless a future operations ADR approves it.

---

# 22. Monitoring and Health Checks

Supabase operational health must be reviewed as part of AppCare.

Minimum areas:

```txt
database CPU
memory
connection usage
slow queries
database size
auth errors
failed login spikes
backup status
storage usage later
billing status
project status
```

Do not rely only on users reporting problems.

Future `AppCare Operations` document should convert this into a recurring checklist.

---

# 23. Incident Scenarios

## 23.1 Supabase service outage

Response:

```txt
check Supabase status
confirm Vercel status
confirm database connectivity
identify affected clients/modules
communicate if client-facing impact exists
avoid unsafe manual changes during outage
record incident
```

## 23.2 Supabase account compromise

Response:

```txt
revoke compromised access
rotate keys
rotate database password if needed
review team members
review logs
inspect production changes
notify affected clients if data risk exists
write postmortem
```

## 23.3 Project deletion or severe project failure

Response:

```txt
contact Supabase support immediately
identify latest restorable backup
restore to new project if needed
update Vercel environment variables
run smoke tests
verify tenant isolation
verify login
verify module data
communicate outage status
```

## 23.4 Bad migration

Response:

```txt
stop additional writes if needed
identify migration and affected tables
avoid blind rollback if data changed
restore to staging if needed
write forward repair migration/script
verify with tests
apply approved repair
write regression test
```

## 23.5 Billing interruption

Response:

```txt
restore payment method
contact Supabase support if project is affected
verify project health
add backup billing controls
record incident
```

---

# 24. Client Access Rules

Clients do not receive:

```txt
Supabase dashboard access
Supabase database password
service role key
project API settings access
SQL editor access
Storage dashboard access
billing access
```

Clients receive:

```txt
OneDayOS login
OneDayOS organization URL
module access based on plan/settings
role-based permissions
AppCare support channel
```

Exception requires premium/dedicated infrastructure contract and separate ADR.

---

# 25. Founder / Operator Checklist

Before production:

```txt
[ ] OneDayOS-owned Supabase organization exists
[ ] Production project exists
[ ] Staging project exists
[ ] Production and staging are separate projects
[ ] Production is not inside a personal hobby account
[ ] At least two trusted owners exist
[ ] MFA enabled for owners/admins
[ ] Billing method active
[ ] Backup billing method considered
[ ] Supabase plan selected intentionally
[ ] Production region documented
[ ] DATABASE_URL and DIRECT_URL documented securely
[ ] Service role key stored only in server environment
[ ] Vercel production env points to production Supabase
[ ] Vercel staging env points to staging Supabase
[ ] Prisma migration process tested on staging
[ ] Seed/provisioning process tested
[ ] Backup settings reviewed
[ ] Restore drill performed
[ ] Incident contact path known
```

Monthly AppCare operations:

```txt
[ ] Check Supabase billing status
[ ] Check database usage
[ ] Check connection usage
[ ] Check backup status
[ ] Check auth error trends
[ ] Check storage usage once files exist
[ ] Check team member access list
[ ] Review production incidents
[ ] Review pending migrations
[ ] Review costs vs AppCare margin
```

---

# 26. Claude Implementation Rules

Claude must follow these rules when implementing Supabase-related code or operations:

```txt
Do not create per-client Supabase projects.
Do not create per-client Vercel projects.
Do not add Supabase Edge Functions.
Do not add FastAPI or Python backend services.
Do not expose service role key.
Do not create public business-file buckets.
Do not add Storage before Attachment Service or approved module-local file handling.
Do not run Prisma migrations in Vercel build.
Do not use db push in staging or production.
Do not manually edit Supabase schema through generated instructions.
Do not import Supabase admin clients into client components.
Do not let modules call Supabase directly for privileged operations.
Do not add direct browser database access to application tables.
Do not ask for real production secrets in chat.
```

If Claude needs Supabase credentials, it must ask the operator to configure environment variables locally or in Vercel/Supabase dashboard. Claude must not request the secret values to be pasted into the conversation.

---

# 27. Anti-Patterns

## 27.1 Client-owned Supabase by default

Rejected:

```txt
Every client gets their own Supabase account.
```

Reason:

```txt
high operational burden
migration drift
backup complexity
AppCare cost explosion
harder platform updates
```

## 27.2 Client-specific project fork

Rejected:

```txt
onedayos-client-a Supabase project
onedayos-client-b Supabase project
onedayos-client-c Supabase project
```

Exception only for premium dedicated infrastructure.

## 27.3 Dashboard-driven schema changes

Rejected:

```txt
Add table manually in Supabase dashboard.
```

Reason:

```txt
Prisma migration drift
no review
no repeatability
no CI proof
```

## 27.4 Service role in module code

Rejected:

```ts
import { createClient } from '@supabase/supabase-js'
const admin = createClient(url, serviceRoleKey)
```

inside business modules.

Privileged Supabase operations belong in Kernel/server infrastructure.

## 27.5 Browser access to application tables

Rejected:

```txt
Client component uses Supabase browser client to query products table directly.
```

Reason:

```txt
bypasses OneDayOS API contract
bypasses PlatformContext pattern
requires premature RLS correctness
can bypass module/permission rules
```

Business data access goes through OneDayOS APIs/services.

## 27.6 Treating backups as automatic magic

Rejected:

```txt
Supabase has backups, so we are safe.
```

Correct:

```txt
Backups are safe only after restore has been tested.
```

---

# 28. Relationship to OneDayOS Architecture

Supabase operations must preserve:

```txt
single shared platform
shared database tenancy
orgId isolation
PlatformContext authorization
Prisma migration authority
SDK-only module access
no client forks
no module direct database access
centralized AppCare operations
```

Supabase is infrastructure.

It is not the architecture.

The OneDayOS architecture remains:

```txt
Kernel
  ↓
Business Objects
  ↓
Platform Services
  ↓
Business Modules
  ↓
Client Configuration
```

---

# 29. Acceptance Criteria

This document is accepted when:

```txt
[ ] Founder understands that clients do not receive Supabase accounts by default
[ ] Supabase project/environment model is approved
[ ] Production/staging separation is approved
[ ] Dedicated infrastructure is explicitly deferred
[ ] Supabase access-control rules are approved
[ ] Service role key rules are approved
[ ] Database operation rules are approved
[ ] Backup/restore operational expectations are approved
[ ] Storage remains deferred until Attachment Service or approved module-local need
[ ] Claude rules are clear enough to prevent per-client infrastructure drift
```

---

# 30. Implementation Checklist for Restarted Foundation Build

Before Claude starts foundation implementation:

```txt
[ ] Create OneDayOS-owned Supabase organization
[ ] Create staging Supabase project
[ ] Create production Supabase project
[ ] Configure local/staging/production environment variables
[ ] Configure Vercel environments
[ ] Verify Prisma can connect to staging
[ ] Verify Prisma migrate deploy against staging
[ ] Verify seed/provisioning against staging
[ ] Verify Supabase Auth login/register against staging
[ ] Verify production credentials are not used locally/CI
[ ] Document project refs securely
[ ] Document backup/PITR decision
[ ] Add restore drill to operations backlog
```

---

# 31. Founder Plain-English Summary

For normal clients:

```txt
They do not get Supabase.
They get OneDayOS.
```

Supabase is your infrastructure.

OneDayOS is what the client uses.

The client’s data lives in your production database, separated by `orgId` and protected by OneDayOS authentication, tenancy checks, permissions, APIs, SDK rules, and tests.

This gives you:

```txt
fast delivery
centralized updates
centralized backups
centralized support
low AppCare cost
platform reuse
```

The tradeoff is shared-infrastructure blast radius.

That risk is handled through:

```txt
company-owned account
MFA
two owners
separate staging/production
least-privilege access
paid production plan
backups
restore drills
incident runbooks
future dedicated infrastructure option for premium clients
```

Do not solve shared-infrastructure risk by giving every small client their own infrastructure too early. That creates a different and larger operational problem.

---

# 32. References

- Supabase Access Control: https://supabase.com/docs/guides/platform/access-control
- Supabase Billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase Database Backups: https://supabase.com/docs/guides/platform/backups
- Supabase Backup and Restore using CLI: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- Supabase Connect to your database: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase Prisma Troubleshooting: https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Auth SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- OneDayOS Kernel v2 historical reference: `2026-07-02-onedayos-platform-kernel-v2.md`

---

# 33. Final Rule

OneDayOS clients are tenants of the OneDayOS platform.

They are not owners of the Supabase infrastructure.

For MVP:

```txt
OneDayOS owns Supabase.
OneDayOS operates Supabase.
OneDayOS protects client data through platform architecture.
Dedicated infrastructure is a future premium exception, not the default.
```
