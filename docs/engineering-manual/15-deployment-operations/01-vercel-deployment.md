# OneDayOS Engineering Manual — 15 Deployment & Operations — 01 Vercel Deployment

Version: 1.0  
Status: Draft for Founder Review  
Implementation Status: Required Before Restarted Foundation Build  
Owner: OneDayOS Founder / Lead Architect  
Last Updated: July 2026  
Supersedes: None  
Depends On:

- `00-meta/00-roadmap.md`
- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `06-data/04-migrations-seeding.md`
- `13-security/06-secrets-management.md`
- `13-security/08-production-readiness-gate.md`
- `14-testing-quality/08-ci-quality-gates.md`
- `15-deployment-operations/00-environments.md`

---

# 1. Purpose

This document defines how OneDayOS is deployed to Vercel.

It is not a generic Vercel checklist.

It is the deployment contract for a multi-tenant business operating system where one shared codebase serves many client organizations.

The goal is:

```txt
One codebase
One controlled deployment pipeline
One production app
Many client organizations
No per-client deployment forks
```

This document tells Claude Code, future engineers, and the founder how OneDayOS should be deployed without weakening tenant isolation, secrets management, migrations, AppCare operations, or one-day delivery.

---

# 2. Core Deployment Principle

OneDayOS clients do not receive separate Vercel applications by default.

A normal client is created as an `Organization` inside the OneDayOS platform.

Correct model:

```txt
OneDayOS Vercel Project
  └── OneDayOS Production App
        ├── Organization: Client A
        ├── Organization: Client B
        ├── Organization: Client C
        └── Organization: Client D
```

Incorrect model:

```txt
Client A Vercel Project
Client B Vercel Project
Client C Vercel Project
Client D Vercel Project
```

Per-client Vercel projects are forbidden for the normal MVP/AppCare offer.

They may become a future premium/dedicated infrastructure option, but only through a separate ADR, higher pricing, and a dedicated operations process.

---

# 3. Deployment Goals

The deployment system must support:

```txt
fast releases
safe rollbacks
clean preview deployments
staging before production
separate production and staging secrets
separate production and staging Supabase projects
repeatable builds
Prisma Client generation
no production migrations from preview builds
no per-client forks
low AppCare support burden
```

Deployment must make the platform easier to operate as more clients join.

It must not create hidden per-client infrastructure work.

---

# 4. Non-Goals

This document does not define:

```txt
Supabase database operations
production database migration procedure
monitoring and observability
incident response
cost management
client onboarding workflow
dedicated enterprise deployments
background job provider selection
custom domain marketplace
```

Those are separate documents.

This document focuses only on Vercel deployment of the core Next.js platform.

---

# 5. Vercel Account Ownership

OneDayOS should be deployed from a company-owned Vercel team/account, not a personal founder account.

Required ownership model:

```txt
Vercel Team: OneDayOS Systems
  ├── Project: onedayos-platform
  ├── Environment: production
  ├── Environment: preview
  ├── Environment: development/local
  └── Optional custom environment: staging
```

Rules:

```txt
Do not deploy production from a personal Vercel account.
Do not put production secrets in a personal environment.
Do not give clients Vercel dashboard access.
Do not create one Vercel project per normal client.
Use least-privilege access for collaborators.
Protect the GitHub repository and deployment branches.
```

A client user is an application user, not an infrastructure operator.

---

# 6. Recommended Vercel Project Model

## 6.1 Preferred MVP model

Use one Vercel project for the OneDayOS platform.

```txt
Vercel Project: onedayos-platform
  Production environment → production Supabase project
  Preview environment    → preview/staging Supabase project or disposable preview DB
  Development/local      → local/dev Supabase project
```

If Vercel Custom Environments are available on the active plan, create a persistent `staging` custom environment.

```txt
Custom Environment: staging
  Branch: staging
  Supabase project: OneDayOS staging
  Domain: staging.onedayonlysystems.com or staging-app.onedayonlysystems.com
```

If Custom Environments are unavailable or operationally confusing during MVP, use a separate staging Vercel project as a temporary alternative.

```txt
Vercel Project: onedayos-platform-staging
  Connected to staging branch
  Uses staging Supabase project
```

The staging alternative is acceptable because staging is an internal platform environment, not a client fork.

## 6.2 Forbidden MVP model

Do not create:

```txt
onedayos-client-a
onedayos-client-b
onedayos-client-c
```

as separate Vercel projects for normal clients.

That would break the platform model and increase AppCare cost.

---

# 7. Environment Mapping

The deployment environments should map to data environments as follows:

| Vercel Environment | Git Source | Supabase Project | Purpose |
|---|---|---|---|
| Local | developer machine | local/dev Supabase | development |
| Preview | feature branch / PR | preview or staging Supabase | code review and temporary testing |
| Staging | `staging` branch or custom target | staging Supabase | release validation |
| Production | `main` branch / production promotion | production Supabase | live clients |

Critical rule:

```txt
Preview and staging must never use production database credentials.
```

---

# 8. Git Branch and Deployment Strategy

Recommended branches:

```txt
main       → production-ready code
staging    → release candidate validation
feature/*  → development and pull requests
```

Recommended flow:

```txt
feature branch
  ↓ pull request
preview deployment
  ↓ merge to staging
staging deployment
  ↓ smoke tests and migration verification
merge/promote to main
  ↓ production deployment
```

Direct production deployment from an unreviewed local machine is forbidden except for founder-approved emergency recovery.

---

# 9. Production Deployment Rule

Production deployment should be Git-driven.

Preferred production trigger:

```txt
Merge approved release commit into main
→ CI checks pass
→ Vercel production deployment builds
→ post-deploy smoke checks run
```

Forbidden normal workflow:

```bash
vercel --prod
```

from a developer laptop without review.

Emergency CLI deploys may be allowed only if:

```txt
production is down
founder approves
exact commit is recorded
post-deploy verification is performed
incident note is written
```

---

# 10. Build Command

The Vercel production build must generate Prisma Client before building Next.js.

Recommended package scripts:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "typecheck": "tsc --noEmit",
    "test:run": "vitest run",
    "check:architecture": "tsx scripts/check-architecture.ts",
    "check:generated": "tsx scripts/check-generated.ts",
    "check:all": "npm run typecheck && npm run test:run && npm run check:architecture && npm run check:generated && npm run build"
  }
}
```

Recommended Vercel Build Command:

```bash
npm run build
```

Do not rely on locally generated Prisma Client files.

A fresh clone and a Vercel build must be able to generate everything needed.

---

# 11. Install Command

Recommended install command:

```bash
npm ci
```

Use `npm install` only if the project intentionally does not commit a lockfile, which is not recommended.

Rules:

```txt
Commit package-lock.json.
Use deterministic installs in CI and Vercel.
Do not allow dependency drift during production deployment.
Do not install dependencies manually inside Vercel build scripts.
```

---

# 12. Output Directory

For a standard Next.js deployment on Vercel, do not override the output directory unless there is a documented reason.

Default:

```txt
Vercel detects Next.js and uses its framework defaults.
```

Forbidden unless approved:

```json
{
  "outputDirectory": "dist"
}
```

OneDayOS is not a static export application.

It uses server behavior, auth, API routes, and tenant context.

---

# 13. Environment Variables

## 13.1 Required variables

Each Vercel environment must have its own values for:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_APP_URL
APP_ENV
```

Future variables may include:

```txt
SENTRY_DSN
LOG_LEVEL
AI_PROVIDER_API_KEY
EMAIL_PROVIDER_API_KEY
STORAGE_BACKUP_KEY
```

Future variables must follow the same secrets-management rules.

## 13.2 Public vs server variables

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
AI_PROVIDER_API_KEY
EMAIL_PROVIDER_API_KEY
```

Rules:

```txt
Never prefix server secrets with NEXT_PUBLIC_.
Never expose DATABASE_URL to the browser.
Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
Never log environment variable values.
Never paste production secrets into Claude or chat.
```

## 13.3 Environment-specific values

Production variables must point to production infrastructure.

Staging variables must point to staging infrastructure.

Preview variables must not point to production infrastructure.

Incorrect:

```txt
Preview deployment → production DATABASE_URL
```

Correct:

```txt
Preview deployment → preview/staging DATABASE_URL
```

## 13.4 Environment variable updates

Changing environment variables is not enough by itself.

After changing environment variables in Vercel, redeploy the affected environment so the deployment receives the new values.

---

# 14. Vercel System Environment Variables

Vercel system environment variables may be useful later for deployment metadata.

Potential uses:

```txt
show deployment version in admin diagnostics
log deployment URL in smoke tests
identify preview branch
record release build metadata
```

Do not build core tenant logic on Vercel system variables.

Tenant identity must always come from:

```txt
authenticated session
+ platform User record
+ orgSlug
+ verified PlatformContext
```

---

# 15. Supabase Auth Redirect URLs

Each environment must be allowed in Supabase Auth redirect configuration.

Production examples:

```txt
https://app.onedayonlysystems.com/**
https://onedayonlysystems.com/**
```

Staging examples:

```txt
https://staging.onedayonlysystems.com/**
https://staging-app.onedayonlysystems.com/**
```

Preview deployment handling must be deliberate.

Acceptable options:

```txt
Option A: allow Vercel preview URL patterns only for non-production Supabase project
Option B: restrict preview auth and test authenticated flows only in staging
Option C: use a dedicated preview Supabase project with safe redirect patterns
```

Forbidden:

```txt
Allow broad preview redirect URLs on the production Supabase project without review.
```

---

# 16. Domains

Recommended domain model:

```txt
onedayonlysystems.com      → marketing site or main landing
app.onedayonlysystems.com  → OneDayOS app
staging.onedayonlysystems.com → staging app, if used
```

If the app initially lives directly at:

```txt
onedayonlysystems.com
```

then marketing and app routes must be clearly separated.

Client organizations should use path-based tenancy in MVP:

```txt
/app/[orgSlug]
```

or:

```txt
/[orgSlug]
```

depending on the final routing decision.

Client-specific custom domains are deferred.

Forbidden in MVP:

```txt
client-a.com → separate client deployment
client-b.com → separate client deployment
```

Custom domains for clients create support, DNS, SSL, auth redirect, and tenant routing complexity. They require a future dedicated document.

---

# 17. Production Migration Rule

Vercel build must not be responsible for production database migrations.

Forbidden build command:

```bash
prisma migrate deploy && prisma generate && next build
```

Why:

```txt
Vercel build can run for preview, staging, or production.
A misconfigured environment could run migrations against the wrong database.
A failed migration during a deployment can leave code and schema out of sync.
Production migration needs backup, review, and verification.
```

Correct model:

```txt
Migration pipeline / manual approved command
  ↓
prisma migrate deploy against intended database
  ↓
verify schema and seed/provisioning behavior
  ↓
Vercel deploys compatible app code
```

The detailed migration process belongs to:

```txt
15-deployment-operations/03-database-migrations-production.md
```

---

# 18. Deployment and Migration Compatibility

Every production deployment must consider database compatibility.

Safe deployment pattern:

```txt
1. Add backward-compatible database schema.
2. Deploy app code that can read/write new schema.
3. Backfill if required.
4. Remove old code only after data is migrated and stable.
```

Dangerous pattern:

```txt
1. Drop column.
2. Deploy app code that assumes old data disappeared.
3. Rollback becomes impossible because old code needs the dropped column.
```

Production rollback is easy only when database changes are backward-compatible.

If a deployment includes destructive migrations, rollback strategy must be written before deployment.

---

# 19. Preview Deployments

Preview deployments are for reviewing code before production.

They may be created automatically for pull requests.

Preview deployments must:

```txt
use non-production environment variables
never connect to production database
never run production migrations
never expose production secrets
never be used as client-facing production apps
```

Preview deployments may be used for:

```txt
UI review
basic auth checks against non-production Supabase
module page review
API behavior smoke tests
Claude/founder review
```

Preview deployments should not be used for:

```txt
real client onboarding
production data entry
production AppCare checks
```

---

# 20. Staging Deployments

Staging is a persistent pre-production environment.

It should be as close to production as possible while using separate data and secrets.

Staging should have:

```txt
separate Supabase project
separate database
separate Auth configuration
separate service role key
separate app URL
seeded test organizations
fake users
fake business data
```

Staging is where production-like flows are verified:

```txt
login
registration
org route access
wrong-org denial
permission denial
module enablement
Business Object CRUD
module CRUD
soft delete
API JSON errors
migration behavior
```

Do not skip staging for production deployments that include:

```txt
auth changes
tenant context changes
permission changes
Prisma migrations
module generator changes
Business Object schema changes
API contract changes
```

---

# 21. Production Deployment Checklist

Before production deployment:

```txt
[ ] PR reviewed
[ ] Manual document updated if architecture changed
[ ] ADR written if decision changed
[ ] npm run check:all passes locally or in CI
[ ] staging deployment passed
[ ] staging smoke tests passed
[ ] migration impact reviewed
[ ] backup decision confirmed if migration included
[ ] environment variables verified
[ ] no production secrets in preview/local
[ ] no client-specific fork created
[ ] release notes written
```

After production deployment:

```txt
[ ] production app loads
[ ] login works
[ ] /api/kernel/auth/me returns expected JSON
[ ] unauthenticated API returns JSON 401, not redirect/HTML
[ ] known org dashboard loads
[ ] wrong-org route fails safely
[ ] permission-denied route fails safely
[ ] enabled module nav appears for permitted user
[ ] disabled module route fails safely
[ ] error logs checked
[ ] release recorded
```

---

# 22. Smoke Test Requirements

Every production deployment must run smoke checks.

Minimum smoke checklist:

```txt
GET /login
GET /api/kernel/auth/me as unauthenticated user → 401 JSON
Login as staging/production test user
GET /[orgSlug]/dashboard
Attempt wrong-org access
Attempt permission-denied action
Verify sidebar renders enabled modules only
Verify no server error in Vercel logs
```

Once official modules exist, add module-specific smoke checks:

```txt
Inventory list loads
Product create validates correctly
Product create rejects client-supplied orgId
Delete is soft delete
Permission-denied user cannot mutate
```

Smoke tests are not a replacement for automated tests.

They are a final deployment sanity check.

---

# 23. Rollback Rules

Vercel rollback can restore a previous deployment quickly, but it does not automatically undo database migrations.

Rollback is safe when:

```txt
only code changed
new database changes were backward-compatible
old code can still run on current database schema
```

Rollback is dangerous when:

```txt
a column was dropped
a table was renamed
data was destructively transformed
old code cannot read the new schema
new app wrote data in a new incompatible shape
```

If a release includes database migrations, the rollback plan must be written before production deployment.

Preferred recovery sequence:

```txt
1. If code-only bug, use Vercel rollback.
2. If schema-compatible bug, rollback code and keep schema.
3. If data/schema bug, stop writes or disable affected module.
4. Restore to staging or inspect backup.
5. Prefer forward-fix or targeted repair.
6. Full production restore only as last resort.
```

---

# 24. Vercel Instant Rollback Caution

When using Vercel rollback, remember:

```txt
rollback restores a previous deployment
rollback may restore older deployment configuration
rollback does not update changed environment variables
rollback can interact badly with cron/job changes later
```

Therefore:

```txt
Do not treat rollback as a database recovery tool.
Do not treat rollback as a secrets rotation tool.
Do not treat rollback as a substitute for migration planning.
```

---

# 25. Vercel Project Settings

Recommended project settings:

```txt
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
Output Directory: default / auto-detected
Root Directory: repository root unless monorepo changes this
Node Version: use project-supported Node version
Environment Variables: set per environment
Git integration: enabled
Production branch: main
Preview deployments: enabled for PR review
```

Do not override settings unless there is a documented reason.

---

# 26. Node Version

The project should define Node version consistently.

Recommended:

```json
{
  "engines": {
    "node": ">=20"
  }
}
```

If Vercel project settings allow selecting Node version, match the project baseline.

Node version drift can cause:

```txt
build failures
Prisma binary/client issues
Next.js behavior differences
local/production mismatch
```

---

# 27. `vercel.json` Policy

Do not create a complex `vercel.json` early.

A minimal `vercel.json` may be allowed for explicit build command or future functions/crons, but default framework detection should be preferred.

Allowed if needed:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json"
}
```

Forbidden without ADR:

```txt
rewrites that bypass tenant routing
broad CORS headers
cron jobs
edge function rewrites
custom build output hacks
per-client routing rules
```

Vercel configuration should not become a hidden application router.

OneDayOS routing belongs in Next.js and the Kernel routing/app-shell layer.

---

# 28. GitHub Integration Rules

The Vercel project should be connected to the official OneDayOS GitHub repository.

Rules:

```txt
Protect main branch.
Require CI before merge.
Require review before production-impacting changes.
Do not allow random forks to access secrets.
Do not deploy untrusted fork PRs with privileged environment variables.
```

GitHub/Vercel integration should support preview deployments, but production secrets must remain protected.

---

# 29. Secrets and Access Control

Deployment access is security-sensitive.

Rules:

```txt
Vercel team access must be least privilege.
Supabase service role key must be server-only.
DATABASE_URL must be server-only.
Production env vars must be visible/editable only to trusted owners/admins.
Do not paste production env vars into Claude.
Do not store production env vars in GitHub issues, Linear, Slack, or docs.
```

If a production secret is exposed:

```txt
1. Rotate the secret.
2. Redeploy affected environment.
3. Check logs for misuse if applicable.
4. Document the incident.
5. Add a prevention check if possible.
```

---

# 30. AppCare Implications

Vercel deployment is part of AppCare.

AppCare depends on:

```txt
reliable production deployment
safe rollback plan
environment variable discipline
staging validation
error visibility
release notes
backup/migration discipline
```

Do not promise AppCare maturity until:

```txt
[ ] production deployment process is documented
[ ] production smoke tests exist
[ ] staging exists
[ ] backup/restore plan exists
[ ] incident response plan exists
[ ] monitoring exists
[ ] cost monitoring exists
```

---

# 31. Client Onboarding Is Not Deployment

Adding a new client should not require a new Vercel deployment.

Correct onboarding:

```txt
create Organization row
enable modules through OrgModule
create users/roles/permissions
configure settings
import seed/onboarding data
train client
```

Incorrect onboarding:

```txt
clone repository
create new Vercel project
create new Supabase project
copy environment variables
modify code for client
deploy custom app
```

If onboarding regularly requires code deployment, the platform has failed.

Some module improvements may require deployment, but client creation itself should eventually be configuration/provisioning.

---

# 32. Dedicated Client Deployment Exception

A dedicated Vercel/Supabase deployment may be considered later for:

```txt
large enterprise client
strict compliance requirement
client-owned infrastructure requirement
custom SLA
separate billing contract
high-value vertical deployment
regional/data residency requirement
```

This requires:

```txt
ADR
separate pricing
separate AppCare tier
separate backup plan
separate migration plan
separate monitoring
separate incident response
```

Dedicated deployment must never be offered accidentally as part of the standard one-day SME package.

---

# 33. Deployment Anti-Patterns

Forbidden:

```txt
one Vercel project per normal client
production database in preview deployments
production service role key in preview deployments
prisma migrate deploy inside Vercel build command
client-specific branches that live forever
manual production deploys from laptops as normal workflow
committed .env files
NEXT_PUBLIC_DATABASE_URL
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
broad preview redirect URLs on production Auth without review
Vercel rewrites that bypass orgSlug routing
FastAPI deployment as part of core platform
```

---

# 34. Claude Code Rules

Claude must not:

```txt
create client-specific Vercel projects
add per-client deployment branches
add production migration commands to Vercel build
expose server secrets as NEXT_PUBLIC variables
remove prisma generate from build
connect preview to production database
create vercel.json rewrites that bypass Kernel routing
add FastAPI/Python deployment files for core platform
claim deployment is complete without check commands
```

Claude may:

```txt
update package scripts to include prisma generate
create deployment documentation
create smoke test scripts
create environment variable validation files
create architecture checks for deployment anti-patterns
create CI workflows that verify build readiness
```

---

# 35. Recommended Vercel Deployment Setup Steps

Initial setup:

```txt
1. Create company-owned Vercel team.
2. Import official OneDayOS GitHub repository.
3. Select Next.js framework preset.
4. Set production branch to main.
5. Configure environment variables per environment.
6. Set build command to npm run build.
7. Ensure npm run build includes prisma generate.
8. Connect production domain.
9. Configure staging custom environment or staging project.
10. Configure Supabase Auth redirect URLs per environment.
11. Run first preview deployment.
12. Run first staging deployment.
13. Run smoke tests.
14. Promote/deploy to production only after gates pass.
```

---

# 36. Deployment Verification Commands

Before production deployment, run:

```bash
npm run typecheck
npm run test:run
npm run check:architecture
npm run check:generated
npm run build
```

Preferred combined command:

```bash
npm run check:all
```

If any command fails, do not deploy.

---

# 37. Future Improvements

Deferred improvements:

```txt
automated post-deploy smoke tests
Vercel deployment protection rules
custom staging environment if not available immediately
deployment status page
release dashboard
automated rollback runbook
Sentry integration
Datadog/Logtail/Axiom integration
cost alerts
enterprise dedicated deployment template
client custom-domain support
```

These should be added through future Deployment & Operations documents or ADRs.

---

# 38. Acceptance Criteria

This document is satisfied when:

```txt
[ ] OneDayOS uses a company-owned Vercel team/account.
[ ] Normal clients are not deployed as separate Vercel projects.
[ ] Production branch is controlled.
[ ] Production environment variables are separate from staging/preview.
[ ] Preview deployments do not use production database credentials.
[ ] Build command runs Prisma Client generation.
[ ] Vercel build does not run production migrations.
[ ] Supabase Auth redirect URLs are configured per environment.
[ ] Production deployment checklist exists.
[ ] Post-deploy smoke checklist exists.
[ ] Rollback limitations are understood and documented.
[ ] Claude rules are documented.
```

---

# 39. Implementation Prompt for Claude

Use this only after the document is approved.

```md
You are implementing the OneDayOS Vercel Deployment foundation.

Authoritative document:
docs/engineering-manual/15-deployment-operations/01-vercel-deployment.md

Rules:
- Do not create per-client deployment infrastructure.
- Do not add production migrations to the Vercel build command.
- Ensure npm run build generates Prisma Client.
- Do not expose server secrets as NEXT_PUBLIC variables.
- Do not add FastAPI or Python deployment files.
- Do not connect preview deployments to production database.
- Do not change architecture without stopping and reporting ambiguity.

Tasks:
1. Review package scripts.
2. Ensure build includes prisma generate.
3. Add or update env validation if missing.
4. Add deployment smoke-test script skeleton if appropriate.
5. Add architecture checks for forbidden deployment patterns if appropriate.
6. Document required Vercel environment variables in .env.example without real values.
7. Run npm run check:all.

Report:
- files changed
- commands run
- commands passed/failed
- any manual Vercel dashboard steps still required
```

---

# 40. Final Rule

A Vercel deployment is not just a successful build.

For OneDayOS, deployment means:

```txt
the right code
on the right environment
with the right secrets
against the right database
through the right branch
with the right rollback plan
serving all clients safely
```

If any of those are unclear, do not deploy.
