# OneDayOS Engineering Manual — 06 Data / 07 Backup & Restore

**Document ID:** `06-data/07-backup-restore.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT, acting as OneDayOS founding software architect  
**Date:** July 2026  
**Implementation Allowed:** No — freeze after founder review  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/02-sdk-db-access.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/04-migrations-seeding.md`
- `06-data/05-data-validation-zod.md`
- `06-data/06-row-level-security-plan.md`

---

# 1. Purpose

This document defines how OneDayOS backs up, restores, verifies, and protects customer data.

OneDayOS is a shared multi-tenant business platform. A backup failure is not a small technical issue. It can become:

- a customer trust failure,
- an AppCare failure,
- a legal/commercial dispute,
- a platform reliability failure,
- and, in the worst case, a company-ending incident.

The backup and restore strategy must support the OneDayOS business model:

```txt
One production platform
One production database
Many tenant organizations
Per-organization data separation through orgId
Recurring AppCare promise
Low operational burden
Fast recovery from mistakes
```

Backups are not considered complete until they have been restored and verified.

---

# 2. Core Principle

The core principle is:

```txt
A backup that has never been restored is only a theory.
```

OneDayOS must not rely on dashboard screenshots, assumptions, or provider marketing claims alone. The platform must have documented restore procedures and recurring restore drills.

---

# 3. Scope

This document covers:

- database backups,
- Supabase-managed backups,
- point-in-time recovery planning,
- off-platform logical backups,
- restore procedures,
- restore drills,
- AppCare backup obligations,
- pre-migration backup procedure,
- per-tenant restore limitations,
- Storage backup implications,
- secrets/configuration backup implications,
- incident response handoff,
- and Claude implementation rules.

This document does **not** implement:

- a full backup automation service,
- per-tenant self-service restore,
- per-record historical rollback,
- durable audit log replay,
- object storage backup automation,
- enterprise disaster recovery,
- multi-region replication,
- or database-per-tenant restore workflows.

Those are future platform capabilities.

---

# 4. Non-Negotiable Rules

## 4.1 Production must run on a paid Supabase project or equivalent

OneDayOS must not onboard real paying clients on a database plan with no reliable production backup mechanism.

Minimum production requirement:

```txt
[ ] Automated provider-managed database backups available
[ ] Restore access available
[ ] Database credentials controlled
[ ] Production project not used for development experiments
[ ] Migrations applied only through approved workflow
```

## 4.2 Backups must be verified through restore drills

At minimum, OneDayOS must periodically restore a backup into a non-production environment and verify that the application can run against the restored data.

## 4.3 Production restores must be deliberate

Restoring the production database is dangerous because OneDayOS uses one shared database for all tenant organizations.

A production restore can affect every client.

Therefore:

```txt
Full production restore is a last-resort operation.
```

Prefer:

```txt
Restore backup to temporary project
Inspect data
Extract required rows
Apply targeted repair script
```

before choosing a full production rollback.

## 4.4 Per-tenant restore is not automatic in MVP

Because OneDayOS uses a shared database, a provider-level database restore reverts the whole database, not just one organization.

This is important.

If Client A accidentally deletes data, restoring the whole production database would also revert Client B, Client C, and every other client.

Therefore, per-tenant restore must be handled through a targeted recovery process, not a naive full database restore.

## 4.5 Soft delete is the first recovery mechanism

For normal accidental deletes, the first recovery path should be soft delete restore, not database restore.

Example:

```txt
User accidentally deletes Product
→ restore Product from deletedAt/deletedBy state
→ do not restore the whole database
```

Database restore is for larger failures:

- data corruption,
- bad migration,
- destructive script,
- provider incident,
- accidental mass update,
- or catastrophic app bug.

## 4.6 Storage objects are not covered by database backups

Supabase database backups cover database data. They do not restore Storage API objects themselves. The database may contain Storage metadata, but deleted files/objects must be backed up and restored separately once OneDayOS uses Storage for attachments, documents, images, or imports.

This matters for future modules like:

- Incident Reporting,
- Expenses,
- Assets,
- Visitor Management,
- Attachments Service,
- and Document Parsing.

## 4.7 Secrets are not backups

Secrets must not be stored in GitHub, database dumps, seed files, or Engineering Manual files.

Production secrets must be recoverable through a password manager or provider dashboard, not through committed code.

---

# 5. Backup Responsibility Model

OneDayOS backup responsibility is split across multiple layers.

| Layer | Source of Truth | Backup Method | Restore Method |
|---|---|---|---|
| Application code | GitHub | Git history, tags, releases | redeploy from tag/commit |
| Engineering Manual | GitHub/docs | Git history | restore file/version |
| Database schema | Prisma migrations | Git history | run migrations |
| Tenant data | Supabase Postgres | managed backups, PITR, logical dumps | provider restore or targeted import |
| Auth users | Supabase Auth/database | provider restore; careful with CLI dumps | provider restore or admin recreation |
| Business objects | Postgres tables | database backup + soft delete | soft restore or targeted recovery |
| Module data | Postgres tables | database backup + soft delete | soft restore or targeted recovery |
| Settings/config | Postgres `settings`, `org_modules`, env vars | database backup + secret manager | DB restore + manual env recovery |
| Storage objects | Supabase Storage | separate object backup required | storage object restore/copy |
| Environment variables | Vercel/Supabase/password manager | password manager export/process | re-enter provider secrets |
| Domains/DNS | registrar/provider | documented provider access | manual DNS restore |

---

# 6. Backup Classes

## 6.1 Provider-managed database backups

These are Supabase-managed backups visible through the Supabase dashboard or Management API.

They are the first-line disaster recovery mechanism.

Use cases:

- catastrophic production data corruption,
- failed migration with data loss,
- accidental mass deletion,
- infrastructure failure,
- or full-project rollback.

Limitations:

- restore may cause downtime,
- restore is project-wide,
- retention depends on the active plan,
- Storage objects are not restored by database backups,
- and provider backups should still be verified by restore drills.

## 6.2 Point-in-Time Recovery

Point-in-Time Recovery, or PITR, allows restoring to a specific time instead of only daily snapshots.

PITR is not required for the first local development build, but it should be considered a production maturity requirement once OneDayOS has real clients or operationally critical data.

Recommended decision:

```txt
Before first production customer:
  daily provider-managed backup is the minimum.

Before multiple active paying clients or high-volume transactional use:
  enable PITR if commercially feasible.

Before promising stronger recovery guarantees in AppCare:
  PITR is required.
```

Do not promise near-zero data loss unless PITR or an equivalent recovery mechanism is active and tested.

## 6.3 Off-platform logical backups

Provider-managed backups are necessary but not sufficient for long-term operational confidence.

OneDayOS should eventually maintain off-platform logical backups for production.

Examples:

```txt
weekly encrypted logical dump
pre-migration encrypted logical dump
monthly archival logical dump
```

These dumps must be:

- encrypted,
- access-controlled,
- stored outside the primary Supabase project,
- never committed to GitHub,
- and periodically restore-tested.

Important caution:

Supabase CLI database dumps may exclude Supabase-managed schemas such as `auth` and `storage` by default. They are useful, but they are not always equivalent to a complete provider-managed project backup.

## 6.4 Pre-migration backups

Every risky production migration must have a backup checkpoint.

At minimum:

```txt
[ ] Confirm latest provider backup exists
[ ] Confirm migration has been tested on staging
[ ] Confirm restore procedure is known
[ ] For risky migrations, create off-platform logical dump
[ ] Record migration start time
[ ] Record migration version before and after
```

## 6.5 Soft-delete restore

Soft-delete restore is the normal path for accidental deletion of business records.

This depends on the soft-delete rules defined in:

```txt
06-data/03-soft-delete-archival.md
```

Example:

```txt
Product.deletedAt = timestamp
Product.deletedBy = userId
```

Restore action:

```txt
Product.deletedAt = null
Product.deletedBy = null
```

subject to permission and tenant checks.

## 6.6 Future audit/history restore

Soft delete does not solve accidental field updates.

Example:

```txt
User changes all product costs to wrong values.
```

Without audit history, OneDayOS may need to restore a backup into staging, inspect old values, and run a targeted repair script.

Future Platform Services may improve this:

- Audit Log Service,
- Activity Feed Service,
- versioned records,
- event outbox,
- import history,
- and module-specific change history.

Do not build those now unless the Three Independent Use Cases Rule is satisfied.

---

# 7. Environment Backup Policy

## 7.1 Local development

Local development data is disposable.

Rules:

```txt
[ ] Use seed scripts
[ ] Do not store real client data locally unless explicitly authorized
[ ] Do not require local backups
[ ] Reset through migrations + seed
```

## 7.2 Preview environments

Preview deployments must not contain production client data.

Rules:

```txt
[ ] Use synthetic data
[ ] Do not connect preview deployments to production database
[ ] Do not restore production backups into public preview environments
[ ] Do not expose secrets to untrusted preview branches
```

## 7.3 Staging

Staging exists to test production-like releases and restore procedures.

Rules:

```txt
[ ] Staging should use separate Supabase project
[ ] Staging may use anonymized production-like data
[ ] Staging must not send real emails/SMS unless explicitly enabled
[ ] Restore drills should target staging or temporary restore projects
[ ] Staging should run the same Prisma migration path as production
```

## 7.4 Production

Production must be treated as the source of truth for customer operations.

Rules:

```txt
[ ] Paid project or equivalent backup-capable infrastructure
[ ] Automated provider-managed backups enabled
[ ] PITR decision documented
[ ] Off-platform backup decision documented
[ ] Restore drill schedule documented
[ ] Production secrets controlled
[ ] Migrations are reviewed and run through deployment procedure
```

---

# 8. Recommended Backup Maturity Levels

## Level 0 — Development only

Allowed only before real clients.

```txt
Provider backups: optional
PITR: no
Off-platform dumps: optional
Restore drills: optional
Client data: none
```

## Level 1 — First production client

Minimum production standard.

```txt
Provider backups: required
PITR: recommended but not mandatory
Off-platform dumps: pre-migration only
Restore drills: quarterly or before launch
Storage backup: manual/documented if Storage is used
```

Public promise should be conservative:

```txt
Backups are maintained.
Recovery is best effort within available backup window.
Exact recovery point depends on backup configuration.
```

## Level 2 — Multiple active AppCare clients

Recommended once the platform has multiple paying organizations.

```txt
Provider backups: required
PITR: strongly recommended
Off-platform dumps: weekly minimum
Restore drills: monthly or quarterly
Storage backup: required if attachments/files are active
Incident runbook: required
```

## Level 3 — Critical operations / enterprise clients

For larger customers or critical operational systems.

```txt
Provider backups: required
PITR: required
Off-platform dumps: daily or negotiated
Restore drills: monthly
Storage backup: automated
Custom RPO/RTO: contract-specific
Enterprise isolation: possible future option
```

---

# 9. Recovery Objectives

Recovery objectives must not be promised casually.

## 9.1 RPO — Recovery Point Objective

RPO means:

```txt
How much data can be lost after a disaster?
```

Examples:

```txt
Daily backup only:
  possible data loss up to the previous backup point.

PITR enabled:
  lower data-loss window, depending on provider behavior and plan.
```

OneDayOS rule:

```txt
Do not promise a specific RPO unless it is backed by current provider capability and tested restore procedure.
```

## 9.2 RTO — Recovery Time Objective

RTO means:

```txt
How long does recovery take?
```

RTO depends on:

- database size,
- backup type,
- provider restore time,
- whether restore is full-project or targeted,
- whether Storage objects are involved,
- whether data repair scripts are required,
- and whether DNS/env vars must change.

OneDayOS rule:

```txt
Do not promise instant recovery.
```

For AppCare, start with operational targets, not contractual guarantees.

---

# 10. Restore Types

## 10.1 Soft-delete restore

Use when:

- record was deleted by mistake,
- record still exists with `deletedAt`,
- relationships are still valid,
- tenant is known,
- and permission allows restore.

Example:

```txt
Restore deleted Product
Restore deleted Customer
Restore deleted Supplier
Restore deleted Employee
```

Required checks:

```txt
[ ] authenticated user
[ ] verified PlatformContext
[ ] tenant membership
[ ] module enabled if module record
[ ] restore permission
[ ] record belongs to ctx.org.id
[ ] record is actually deleted
```

## 10.2 Targeted data repair

Use when:

- only one organization is affected,
- only one module/entity is affected,
- restoring whole production would hurt other tenants,
- and old data can be extracted from a backup restored to staging.

Procedure:

```txt
1. Restore backup to temporary project or staging.
2. Query affected rows by orgId.
3. Compare current production rows.
4. Generate repair script.
5. Dry-run repair script.
6. Review with founder/technical lead.
7. Apply to production in transaction.
8. Verify affected records.
9. Record incident report.
```

## 10.3 Full production restore

Use only when:

- corruption affects most or all tenants,
- targeted repair is impossible,
- production data is unusable,
- or provider incident requires whole-project restore.

Full restore consequences:

```txt
All organizations may revert to backup point.
Recent data may be lost.
Application may experience downtime.
Storage objects may not be restored.
```

This requires founder approval unless an emergency policy says otherwise.

## 10.4 Restore to new project

Preferred for investigation.

Use when:

- diagnosing data corruption,
- extracting old tenant data,
- testing restore process,
- rehearsing disaster recovery,
- or validating backup integrity.

Benefits:

```txt
Production stays online.
No live clients are affected.
Data can be inspected safely.
Repair scripts can be tested.
```

## 10.5 Storage object restore

Use once OneDayOS stores uploaded files.

Database restore alone is insufficient.

Storage restore must handle:

- bucket definitions,
- object files,
- storage metadata,
- signed URL assumptions,
- attachment records,
- file permissions,
- and missing-object reconciliation.

Until the Attachments Service exists, every module that stores files must document its storage backup procedure.

---

# 11. Per-Tenant Restore Reality

This section is important for the founder, sales, and AppCare.

OneDayOS uses:

```txt
One database
Shared tables
orgId tenant separation
```

Therefore, provider-level restore is database-wide.

If Client A needs yesterday's data, a full database restore would also affect Client B, Client C, and every other tenant.

So per-tenant restore is not a simple provider action.

## 11.1 MVP per-tenant restore approach

MVP approach:

```txt
Restore backup to temporary project
Extract rows for orgId = affected org
Transform if schema changed
Apply targeted repair to production
Verify
```

This is advanced and should be treated as an engineering operation, not a normal support button.

## 11.2 Future per-tenant backup/export capability

Future platform capability:

```txt
OrgExport
OrgImport
OrgRestorePlan
OrgDataSnapshot
```

Possible future features:

- per-org JSON export,
- per-org CSV export,
- per-org module export,
- per-org restore preview,
- org-level backup before large imports,
- and automated rollback of imports.

Do not build this now unless repeated customer demand proves it.

---

# 12. AppCare Backup Policy

AppCare includes backups, but the promise must be precise.

## 12.1 What AppCare should include initially

Initial AppCare backup coverage:

```txt
[ ] production database backup monitoring
[ ] pre-migration backup checks
[ ] restore procedure documentation
[ ] periodic restore drill
[ ] incident response for data loss events
[ ] best-effort recovery from available backups
```

## 12.2 What AppCare should not promise by default

Do not promise these unless infrastructure supports them:

```txt
instant restore
zero data loss
per-record time travel
per-tenant one-click rollback
file/object restore if Storage backup is not active
custom retention beyond provider plan
restoring arbitrary historical states
```

## 12.3 Client-facing language

Recommended conservative language:

```txt
AppCare includes managed backups and recovery support. Recovery depends on available backup windows, backup type, and the nature of the incident. For stronger recovery guarantees, OneDayOS can enable enhanced backup options such as point-in-time recovery.
```

Avoid:

```txt
We can restore anything anytime.
```

---

# 13. Pre-Migration Backup Checklist

Every production database migration must follow this checklist.

```txt
[ ] Migration reviewed
[ ] Migration tested locally
[ ] Migration tested on staging
[ ] Prisma migration file committed
[ ] Roll-forward plan documented
[ ] Latest provider backup verified
[ ] PITR status checked if enabled
[ ] High-risk migration logical dump created if required
[ ] Production deployment window chosen
[ ] Founder/technical lead approval received for risky migration
[ ] Post-migration verification checklist ready
```

High-risk migrations include:

- dropping columns,
- renaming columns,
- changing unique constraints,
- changing foreign keys,
- backfilling large tables,
- changing tenant-scoped indexes,
- modifying `orgId` relationships,
- modifying permissions/roles,
- modifying auth/user records,
- and changing soft-delete behavior.

---

# 14. Restore Drill Procedure

A restore drill proves that backups are useful.

## 14.1 Frequency

Recommended MVP schedule:

```txt
Before first production launch:
  at least one restore drill

First production client:
  quarterly restore drill

Multiple AppCare clients:
  monthly or quarterly restore drill

Before major data model changes:
  restore drill or staging restore recommended
```

## 14.2 Drill steps

```txt
1. Select latest production backup or approved test backup.
2. Restore into staging or temporary project.
3. Configure environment variables for temporary app deployment.
4. Run Prisma/client generation if needed.
5. Run database integrity checks.
6. Run tenant isolation smoke tests.
7. Run auth/login smoke test.
8. Verify at least two organizations exist and remain isolated.
9. Verify roles and permissions.
10. Verify module enablement via OrgModule.
11. Verify soft-deleted records are hidden by normal reads.
12. Verify app shell loads.
13. Verify a core Business Object list page loads.
14. Record restore duration and issues.
15. Delete or secure temporary restored environment.
```

## 14.3 Restore drill record

Each restore drill should create a record like:

```md
# Restore Drill Record

Date:
Operator:
Source backup:
Restore target:
Database size:
Started at:
Finished at:
Approximate restore duration:
App smoke test passed: yes/no
Tenant isolation check passed: yes/no
Auth check passed: yes/no
Storage check passed: n/a yes/no
Issues found:
Follow-up tasks:
```

---

# 15. Database Integrity Checks After Restore

After any restore, run checks like these.

## 15.1 Tenant counts

```sql
select count(*) from organizations;
select count(*) from users;
select count(*) from roles;
select count(*) from permissions;
select count(*) from org_modules;
```

## 15.2 Tenant-scoped orphan checks

Every tenant-scoped table should have a valid organization.

Example pattern:

```sql
select p.id
from products p
left join organizations o on o.id = p.org_id
where o.id is null;
```

Equivalent checks should exist for:

- users,
- branches,
- departments,
- employees,
- products,
- product categories,
- customers,
- suppliers,
- warehouses,
- settings,
- module-owned tables.

## 15.3 Cross-tenant relationship checks

Example:

```sql
select e.id
from employees e
join departments d on d.id = e.department_id
where e.org_id <> d.org_id;
```

Equivalent checks should exist for:

- employee → department,
- employee → branch,
- product → category,
- warehouse → branch,
- module extension → Business Object,
- module records → Business Object.

## 15.4 Permission checks

Verify:

```txt
[ ] Admin role exists per org
[ ] Admin wildcard permission exists per org
[ ] Staff role exists where expected
[ ] UserRole records are scoped correctly
[ ] Last-admin protection still valid
```

## 15.5 Application smoke tests

Minimum smoke test after restore:

```txt
[ ] login works
[ ] /api/kernel/auth/me works
[ ] authenticated page loads
[ ] wrong-org route does not load
[ ] module list route returns data only for ctx.org.id
[ ] unauthorized mutation returns 403 JSON
[ ] validation error returns VALIDATION_ERROR
```

---

# 16. Storage Backup Policy

Storage is deferred until modules need files or the Attachments Service is promoted.

However, the backup policy must be clear now.

## 16.1 Before Storage is used

```txt
[ ] No customer files stored in Supabase Storage
[ ] No Storage backup automation required
[ ] Database backups are sufficient for MVP data
```

## 16.2 Once Storage is used

Before any module stores customer files, OneDayOS must define:

```txt
[ ] bucket naming conventions
[ ] object path conventions with orgId
[ ] file metadata table
[ ] object backup mechanism
[ ] restore mechanism
[ ] missing-object reconciliation
[ ] file deletion policy
[ ] signed URL expiration strategy
```

## 16.3 Storage backup warning

Database restore may restore attachment metadata without restoring the actual file object.

This can create broken attachment links.

Therefore:

```txt
Attachments Service cannot be production-ready without object backup and restore procedure.
```

---

# 17. Secrets and Configuration Recovery

Backups are not only database rows.

A restored app also needs configuration.

## 17.1 Secrets that must be recoverable

Examples:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_APP_URL
Vercel project settings
Supabase project ref
Domain/DNS access
Email provider keys future
AI provider keys future
Storage credentials future
```

## 17.2 Secret storage rule

Use a password manager or approved secrets vault.

Forbidden:

```txt
.env.local committed to GitHub
secrets inside Engineering Manual
secrets inside seed files
secrets inside Slack/DMs as source of truth
secrets inside database dumps intentionally
```

## 17.3 Restore to new project requires configuration recreation

When restoring to a new Supabase project, OneDayOS may need to recreate or verify:

- Auth settings,
- redirect URLs,
- email templates,
- storage buckets,
- Realtime settings,
- database extensions,
- connection strings,
- Vercel env vars,
- DNS records,
- and webhook settings.

This must be part of restore drills once those features exist.

---

# 18. Incident Decision Tree

## 18.1 Accidental single-record delete

```txt
Use soft-delete restore.
Do not restore database.
```

## 18.2 Accidental single-record edit

```txt
Check audit/history if available.
If unavailable, restore backup to staging and manually compare old value.
Apply targeted repair if justified.
```

## 18.3 Accidental bulk delete within one org

```txt
Try soft-delete bulk restore.
If hard-corrupted, restore backup to staging and extract affected org rows.
Apply targeted repair script.
Avoid full production restore unless unavoidable.
```

## 18.4 Bad import

```txt
If import batch tracking exists, rollback imported batch.
If not, restore backup to staging and run targeted repair.
Future Import Engine must include batch rollback.
```

## 18.5 Bad migration

```txt
Stop writes if needed.
Assess corruption.
Prefer forward fix.
If data corrupted, restore backup to staging.
Extract repair data.
Full production restore only if corruption is broad and unrecoverable.
```

## 18.6 Production database unavailable

```txt
Check Supabase status/provider issue.
Do not run destructive changes.
Communicate incident.
Restore only if provider confirms data loss or project corruption.
```

## 18.7 Storage object loss

```txt
Database restore alone is insufficient.
Restore objects from storage backup if available.
If no storage backup exists, incident must be disclosed honestly.
```

---

# 19. Backup Automation Strategy

Backup automation should be introduced in stages.

## 19.1 MVP stage

```txt
[ ] rely on provider-managed production database backups
[ ] document restore process
[ ] manually verify backups before risky migrations
[ ] perform restore drill before first production client
```

## 19.2 Early AppCare stage

```txt
[ ] schedule off-platform logical dump
[ ] store encrypted backup outside Supabase
[ ] track backup completion
[ ] alert on failed backup
[ ] perform recurring restore drills
```

## 19.3 Mature platform stage

```txt
[ ] backup dashboard
[ ] backup inventory
[ ] restore drill automation
[ ] per-org export
[ ] import rollback
[ ] storage object backup
[ ] PITR monitoring
[ ] incident reporting
```

---

# 20. Example Logical Backup Commands

These commands are examples only. They must be verified against the current Supabase CLI version before automation.

## 20.1 Logical dump example

```bash
mkdir -p backups/$(date +%F)

supabase db dump \
  --db-url "$DIRECT_URL" \
  -f "backups/$(date +%F)/production.sql"
```

## 20.2 Data-only dump example

```bash
supabase db dump \
  --db-url "$DIRECT_URL" \
  -f "backups/$(date +%F)/production-data.sql" \
  --use-copy \
  --data-only
```

## 20.3 Critical caution

Do not assume a CLI logical dump is equivalent to a full managed project backup.

Specifically verify:

```txt
[ ] auth schema expectations
[ ] storage metadata expectations
[ ] migration history expectations
[ ] extension expectations
[ ] RLS policy expectations if implemented later
[ ] custom roles/password expectations
```

---

# 21. Restore Runbooks

## 21.1 Restore to staging or temporary project

Use for drills and investigations.

```txt
1. Create or select restore target project.
2. Restore provider backup or import logical dump.
3. Configure app environment variables.
4. Deploy app against restored database.
5. Run smoke tests.
6. Run integrity checks.
7. Extract repair data if needed.
8. Delete or lock down restored environment after use.
```

## 21.2 Full production restore

Use only with approval.

```txt
1. Declare incident.
2. Stop production writes if possible.
3. Notify affected stakeholders.
4. Identify restore point.
5. Confirm Storage object implications.
6. Confirm data loss window.
7. Confirm founder/technical lead approval.
8. Trigger provider restore.
9. Verify database integrity.
10. Redeploy/restart app if needed.
11. Run application smoke tests.
12. Communicate recovery status.
13. Write post-incident report.
```

## 21.3 Targeted tenant repair

Use for one-tenant incidents.

```txt
1. Identify affected orgId.
2. Restore backup to temporary project.
3. Query affected rows by orgId.
4. Compare with production current rows.
5. Create repair script.
6. Dry run repair script.
7. Review with founder/technical lead.
8. Apply in production transaction.
9. Verify records.
10. Notify client if appropriate.
11. Record incident.
```

---

# 22. Required Backup Metadata

Every backup or restore event should record:

```txt
backup_id
source_project
environment
backup_type
started_at
completed_at
operator
database_size_if_known
storage_included_yes_no
schemas_included
retention_until
restore_tested_yes_no
notes
```

For restore operations:

```txt
restore_id
source_backup_id
restore_target
restore_type
restore_reason
approved_by
started_at
completed_at
success_yes_no
issues_found
post_restore_checks_passed
incident_id_if_applicable
```

MVP can track this in a manual document. Later, this can become an internal AppCare operations table.

---

# 23. Test Requirements

The backup system itself may not be fully automated in MVP, but restore readiness must be testable.

## 23.1 Required automated tests before production

```txt
[ ] seed creates valid baseline org
[ ] migrations apply to empty database
[ ] migrations apply to seeded database
[ ] tenant integrity checks pass
[ ] soft-delete restore behavior works
[ ] generated module records are org-scoped
[ ] API auth/permission tests pass after restore
```

## 23.2 Required manual verification before first client

```txt
[ ] create production-like database
[ ] run migrations
[ ] run seed/provision org
[ ] create user
[ ] login
[ ] create sample Business Object
[ ] confirm provider backup exists
[ ] restore backup to staging/temporary target
[ ] run smoke tests against restored target
[ ] document result
```

## 23.3 Required restore drill assertions

A restore drill passes only if:

```txt
[ ] app can connect to restored database
[ ] login or current-user lookup works
[ ] at least one org dashboard loads
[ ] wrong-org access is denied
[ ] module enablement works
[ ] permissions work
[ ] soft-deleted records stay hidden from normal reads
[ ] key counts match expected backup state
```

---

# 24. Forbidden Patterns

Claude and human engineers must not implement these patterns.

```txt
FORBIDDEN: relying on production database with no managed backup
FORBIDDEN: promising zero data loss without PITR/equivalent
FORBIDDEN: promising per-tenant one-click restore in MVP
FORBIDDEN: using full production restore for one deleted record
FORBIDDEN: storing database dumps in GitHub
FORBIDDEN: storing secrets in backup files intentionally
FORBIDDEN: restoring production without approval except under emergency policy
FORBIDDEN: using production backups in public preview environments
FORBIDDEN: assuming database backup restores Storage objects
FORBIDDEN: using backup scripts that ignore tenant boundaries during repair
FORBIDDEN: manually editing restored production data without a reviewed script
FORBIDDEN: treating untested backups as AppCare-compliant
FORBIDDEN: using FastAPI/Alembic/SQLAlchemy for core backup or migration flow
```

---

# 25. Claude Implementation Rules

When Claude implements backup-related tooling, it must follow these rules.

```txt
1. Do not add backup automation before the manual specifies it.
2. Do not add a second backend runtime for backups.
3. Do not use FastAPI.
4. Do not store backups in the repository.
5. Do not expose database dumps through the app UI.
6. Do not include secrets in logs.
7. Do not write scripts that accept client-supplied orgId without operator confirmation.
8. Any targeted repair script must support dry-run mode.
9. Any production repair script must require explicit environment confirmation.
10. Any restore tool must document whether Storage objects are included.
11. Any backup script must document which schemas are included/excluded.
12. Any backup/restore operation must produce a log entry or manual record.
```

Example safe production confirmation pattern:

```txt
Type the exact production project ref to continue:
```

Do not use simple yes/no prompts for destructive production operations.

---

# 26. Future Enhancements

Do not build these in MVP unless required by real customer demand.

## 26.1 Backup monitoring dashboard

Possible future internal AppCare dashboard:

```txt
Org count
Last provider backup time
Last off-platform backup time
Last restore drill time
PITR enabled yes/no
Storage backup enabled yes/no
Open backup incidents
```

## 26.2 Per-org export/import

Future capability:

```txt
Export all data for one organization.
Import into staging.
Validate dependency graph.
Restore selected module data.
```

## 26.3 Import rollback

Future Dynamic Import Engine should create import batches:

```txt
ImportBatch
ImportRow
ImportError
ImportRollback
```

This makes accidental bad imports easier to reverse without database restore.

## 26.4 Event-sourced restore

Future event/outbox model may allow replaying events or reconstructing views.

Not MVP.

## 26.5 Enterprise isolated deployment

Future enterprise clients may require:

- separate Supabase project,
- separate database,
- custom retention,
- custom PITR,
- custom RTO/RPO,
- data residency,
- and dedicated restore drills.

This is not the default OneDayOS model.

---

# 27. Acceptance Criteria

This document can be marked Frozen only if:

```txt
[ ] Founder accepts that full DB restore is project-wide, not per-tenant
[ ] Founder accepts that per-tenant restore is not automatic in MVP
[ ] AppCare backup promise is commercially clear
[ ] Production minimum backup level is defined
[ ] Pre-migration backup checklist is defined
[ ] Restore drill procedure is defined
[ ] Storage backup limitation is documented
[ ] Secrets/config recovery is documented
[ ] Claude forbidden patterns are documented
[ ] Next implementation steps are clear
```

Before first production client:

```txt
[ ] Production backup mechanism verified
[ ] At least one restore drill completed
[ ] Migration workflow tested on staging
[ ] Seed/provisioning tested
[ ] Tenant isolation tests pass
[ ] Permission tests pass
[ ] Soft-delete restore path tested
```

Before promising stronger recovery in AppCare:

```txt
[ ] PITR or equivalent enabled
[ ] Restore drill proves target recovery behavior
[ ] Storage backup exists if customer files are stored
[ ] Public support language matches actual capability
```

---

# 28. Architectural Decision

For the restarted OneDayOS platform build:

```txt
Use Supabase-managed backups as the baseline production backup mechanism.
Use Prisma migrations as the schema source of truth.
Use GitHub as the source of truth for application code and migrations.
Use soft delete as the first restore mechanism for normal accidental deletes.
Use restore-to-staging plus targeted repair for one-tenant data incidents.
Use full production restore only as a last resort.
Design for PITR and off-platform encrypted backups as production maturity increases.
Do not build per-tenant restore, backup dashboard, or Storage backup automation in MVP.
Do not use FastAPI for backup, migration, or restore workflows.
```

---

# 29. Next Recommended Manual Document

After this document is approved, the next recommended document is:

```txt
07-business-objects/00-business-object-philosophy.md
```

Reason:

The data foundation is now sufficiently specified. Before writing module specs or implementation prompts, OneDayOS must freeze how shared Business Objects work, especially:

- Employee,
- Product,
- Customer,
- Supplier,
- Warehouse,
- extension tables,
- shared event contracts,
- and the rule that modules do not own duplicated copies of shared entities.

---

# 30. External Assumptions Checked

This document assumes the following current Supabase/Postgres behavior:

- Supabase provides automated daily backups for paid production-oriented plans with retention depending on plan.
- Supabase offers Point-in-Time Recovery as an add-on for finer restore granularity.
- Supabase database backups do not restore Storage API objects themselves.
- Supabase restore operations can cause downtime and should be planned.
- Supabase CLI `db dump` is useful for logical dumps, but may exclude managed schemas such as `auth` and `storage` by default.

These assumptions should be rechecked before writing implementation scripts or customer-facing SLA language.
