# OneDayOS Engineering Manual — 15 Deployment & Operations / 00 Environments

**Document ID:** `15-deployment-operations/00-environments.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Restarted Foundation Build  
**Owner:** Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `00-meta/00-roadmap.md`
- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `05-sdk/00-sdk-overview.md`
- `06-data/00-database-architecture.md`
- `06-data/04-migrations-seeding.md`
- `06-data/07-backup-restore.md`
- `13-security/06-secrets-management.md`
- `13-security/08-production-readiness-gate.md`
- `14-testing-quality/08-ci-quality-gates.md`

---

# 1. Purpose

This document defines how OneDayOS environments are structured, named, protected, deployed, seeded, tested, and operated.

It answers:

```txt
Where does local development happen?
Where does CI run tests?
Where does QA happen?
Where do production clients live?
Which Supabase project belongs to which environment?
Which Vercel environment points to which Supabase project?
How are environment variables managed?
How do auth redirect URLs work per environment?
How do migrations move from local → staging → production?
What is a client organization versus an environment?
```

This document is important because OneDayOS is a shared multi-tenant platform. A mistake in environment design can accidentally expose production data, run migrations against the wrong database, leak secrets, break sign-in redirects, or create client-specific infrastructure drift.

---

# 2. Core Principle

Environments are for the **software development lifecycle**.

Client organizations are for **tenant separation inside the application**.

They are not the same thing.

Correct mental model:

```txt
Production Environment
  OneDayOS production app
  OneDayOS production database
    ├── Organization: Client A
    ├── Organization: Client B
    ├── Organization: Client C
    └── Organization: Client D
```

Incorrect mental model:

```txt
Client A = production environment A
Client B = production environment B
Client C = production environment C
```

A normal SME client should receive a OneDayOS organization inside the production platform, not a separate Vercel project, Supabase project, Git branch, or database.

---

# 3. Definitions

## 3.1 Environment

An environment is a deployed or runnable instance of the OneDayOS platform used for a specific stage of the development and release process.

Examples:

```txt
local
ci-test
preview
staging
production
```

## 3.2 Tenant / Client Organization

A tenant is a client organization row inside OneDayOS.

Example:

```txt
Organization
  id: org_abc123
  slug: acme-trading
  name: Acme Trading Corporation
```

Tenant isolation is handled by:

```txt
orgId
PlatformContext
permissions
module enablement
settings
soft delete
future RLS defense-in-depth
```

## 3.3 Deployment

A deployment is a running version of the application code.

Example:

```txt
Vercel production deployment from main branch
Vercel preview deployment from feature branch
Vercel staging deployment from staging branch
```

## 3.4 Supabase Project

A Supabase project contains infrastructure resources such as:

```txt
PostgreSQL database
Supabase Auth
Supabase Storage
API keys
Auth URL configuration
backups
```

For MVP, Supabase projects map to **platform environments**, not individual clients.

---

# 4. Required Environments

OneDayOS should use these logical environments:

```txt
local
ci-test
preview
staging
production
```

Not all of these need equal infrastructure at the beginning, but the boundaries must be clear from day one.

---

# 5. Environment Summary Table

| Environment | Purpose | Data | Supabase Target | Vercel Target | Production Data Allowed? |
|---|---|---|---|---|---|
| Local | Developer machine | Fake/local data | Local Supabase or development project | `next dev` / `vercel dev` | No |
| CI Test | Automated tests | Generated test fixtures | Test DB / local service in CI | GitHub Actions | No |
| Preview | Pull request / feature review | Disposable or fake data | Preview/dev Supabase project or future Supabase branch | Vercel Preview | No |
| Staging | Production-like QA | Fake or sanitized data | Staging Supabase project | Staging branch/domain | No, unless explicitly sanitized |
| Production | Real clients | Real client data | Production Supabase project | Production Vercel deployment | Yes |

---

# 6. Non-Negotiable Environment Rules

## 6.1 Production credentials must never be used outside production

Forbidden:

```txt
Using production DATABASE_URL locally
Using production service role key in Preview
Using production Supabase project for CI tests
Using production Auth project for staging login tests
```

Allowed only in production runtime:

```txt
production DATABASE_URL
production DIRECT_URL
production SUPABASE_SERVICE_ROLE_KEY
production Supabase Auth project
production Storage buckets
```

## 6.2 Clients are not environments

Do not create a new environment per normal client.

Forbidden default model:

```txt
client-a Vercel project
client-b Vercel project
client-c Vercel project
client-a Supabase project
client-b Supabase project
client-c Supabase project
```

Correct MVP model:

```txt
One production Vercel deployment
One production Supabase project
Many OneDayOS Organization rows
```

## 6.3 Staging must not share the production database

Staging exists specifically to prevent production accidents.

Forbidden:

```txt
STAGING_DATABASE_URL = production DATABASE_URL
STAGING_SUPABASE_SERVICE_ROLE_KEY = production service role key
```

## 6.4 Preview must not run production migrations

Preview deployments are for branch/PR review.

They must not automatically mutate the production schema.

Forbidden:

```txt
Every Vercel Preview deployment runs prisma migrate deploy against production
Every feature branch changes the staging schema automatically
```

## 6.5 Environment variable names may be the same, values must differ

The code can read the same variable names:

```txt
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
```

But each environment must have its own values.

## 6.6 `.env.local` is local only

`.env.local` must never be committed.

`.env.example` must contain placeholders only.

## 6.7 No manual production schema edits

All schema changes go through Prisma migrations.

Forbidden:

```txt
Editing production tables manually in Supabase dashboard
Using prisma db push against production
Changing production schema from SQL editor without migration file
```

---

# 7. Recommended MVP Infrastructure Layout

## 7.1 Supabase organization/account

Use one company-owned Supabase organization for OneDayOS infrastructure.

Recommended structure:

```txt
Supabase Organization: OneDayOS Systems
  ├── Project: onedayos-production
  ├── Project: onedayos-staging
  └── Optional Project: onedayos-development
```

Do not create one Supabase organization or project per normal SME client.

## 7.2 Vercel project

Recommended MVP structure:

```txt
Vercel Team: OneDayOS Systems
  └── Project: onedayos-platform
        ├── Production deployment from main branch
        ├── Staging deployment from staging branch or staging domain
        └── Preview deployments from feature branches / pull requests
```

If Vercel branch-specific environment variable management becomes too confusing, a separate Vercel project for staging may be allowed later through an ADR.

Default MVP recommendation:

```txt
One Vercel project
Separate environment variable values per Vercel environment / branch
Separate Supabase projects for staging and production
```

---

# 8. Local Environment

## 8.1 Purpose

Local environment is for day-to-day development.

It should support:

```txt
writing code
running tests
running typecheck
running local migrations
testing auth flows safely
building modules
running generator commands
```

## 8.2 Local data

Local data must be fake.

Allowed:

```txt
Alpha Trading test org
Beta Foods test org
fake users
fake products
fake employees
fake module data
```

Forbidden:

```txt
real client database dump
real production service role key
real customer emails
real customer phone numbers
real payroll data
real uploaded files
```

## 8.3 Local Supabase options

Preferred long-term local option:

```txt
Supabase local development through Supabase CLI
```

Acceptable early option:

```txt
Dedicated development Supabase project with fake data only
```

The local environment may start simple, but it must never point to production.

## 8.4 Local `.env.local`

Example:

```env
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
SUPABASE_SERVICE_ROLE_KEY=local-service-role-key

DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

If using a development Supabase project instead of local Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<dev-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dev-service-role-key>
DATABASE_URL=<dev-database-url>
DIRECT_URL=<dev-direct-url>
```

## 8.5 Local commands

Allowed locally:

```bash
npm run dev
npm run typecheck
npm run test:run
npm run check:architecture
npm run check:generated
npm run check:all
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

Forbidden locally unless explicitly doing emergency recovery work:

```bash
npx prisma migrate deploy --schema pointed at production
npx prisma db push --schema pointed at production
```

---

# 9. CI Test Environment

## 9.1 Purpose

CI test environment proves that every change still passes:

```txt
typecheck
lint
unit tests
integration tests
API tests
security tests
architecture checks
generator checks
Prisma generate
build
```

## 9.2 CI data

CI must use fake, generated test fixtures.

Required fixture pattern:

```txt
Organization Alpha
Organization Beta
Admin user
Staff user
No-permission user
Wrong-org user
Enabled module
Disabled module
Soft-deleted records
```

CI must never use production data.

## 9.3 CI database

Acceptable MVP approaches:

```txt
A disposable PostgreSQL service in CI
A dedicated test Supabase/Postgres project with fake data only
Supabase local stack in CI if practical
```

CI database must be safe to reset.

Forbidden:

```txt
CI DATABASE_URL points to production
CI DATABASE_URL points to staging with persistent QA data unless isolated/resettable
```

## 9.4 CI migration behavior

CI should prove migrations can apply cleanly.

Recommended flow:

```bash
npx prisma generate
npx prisma migrate deploy
npm run test:run
npm run build
```

For integration tests that require known state:

```bash
reset test database
npx prisma migrate deploy
seed test fixtures
run tests
```

## 9.5 CI environment variables

CI secrets must be stored in GitHub Actions or Vercel/GitHub secret storage, not in code.

CI must not expose secrets in logs.

Forbidden:

```txt
console.log(process.env.DATABASE_URL)
printing service role key
writing .env.local into CI artifacts
```

---

# 10. Preview Environment

## 10.1 Purpose

Preview environments are temporary deployments created from feature branches or pull requests.

They are used for:

```txt
reviewing UI changes
checking app shell behavior
reviewing generated module scaffolds
validating simple feature flows
sharing a branch with founder/architect before merge
```

They are not production.

## 10.2 Preview data

Preview must use fake or disposable data.

Options:

```txt
Dedicated preview/dev Supabase project
Future Supabase branch per PR
Staging project with strict caution and no automatic migrations
```

MVP recommendation:

```txt
Use a non-production Supabase project for Preview.
Do not automatically run migrations from every preview branch.
```

## 10.3 Preview deployment rules

Preview deployments may run:

```bash
npm run typecheck
npm run test:run
npm run check:architecture
npm run build
```

Preview deployments must not automatically run:

```bash
prisma migrate deploy against production
prisma migrate deploy against shared staging without approval
```

## 10.4 Preview auth redirects

If Preview deployments need Supabase Auth, their URLs must be added to Supabase Auth redirect configuration for the non-production Supabase project.

Allowed pattern:

```txt
https://*.vercel.app/**
https://preview.onedayonlysystems.com/**
```

Only use wildcard redirect URLs in non-production unless explicitly reviewed.

Production redirect URLs should be stricter.

---

# 11. Staging Environment

## 11.1 Purpose

Staging is the final rehearsal before production.

It should be production-like enough to catch:

```txt
migration issues
auth redirect issues
Vercel environment variable issues
Supabase configuration issues
module enablement issues
permission issues
seed issues
backup/restore assumptions
```

## 11.2 Staging infrastructure

Recommended MVP:

```txt
Vercel staging branch/domain
Supabase staging project
Staging environment variables
Fake or sanitized data
```

Example:

```txt
staging.onedayonlysystems.com
Supabase project: onedayos-staging
Git branch: staging
```

## 11.3 Staging data

Staging should contain:

```txt
fake tenant organizations
fake users
fake module records
fake Business Objects
module-enabled and module-disabled orgs
soft-deleted records
permission-denied users
```

Staging should not contain real production data by default.

If real production data is needed for a serious incident investigation, it must be:

```txt
approved
sanitized where possible
access-limited
time-limited
destroyed or rotated after use
```

## 11.4 Staging migrations

Staging is where production migrations are tested.

Required flow:

```txt
1. Merge approved changes to staging branch.
2. Deploy staging app.
3. Run Prisma migrations against staging database.
4. Run smoke tests.
5. Run security checks.
6. Verify auth redirects and environment variables.
7. Only then approve production deployment.
```

## 11.5 Staging must have production-like auth setup

Staging Supabase Auth should include staging URLs:

```txt
https://staging.onedayonlysystems.com/**
```

It may also include selected Vercel preview URLs if staging project is used for preview, but this should be minimized.

---

# 12. Production Environment

## 12.1 Purpose

Production is the live OneDayOS platform used by real clients.

Production contains:

```txt
real client organizations
real users
real Business Objects
real module records
real permissions
real settings
real billing/subscription state later
real AppCare responsibility
```

## 12.2 Production infrastructure

Recommended MVP:

```txt
Vercel production deployment
Production domain
Supabase production project
Production environment variables
Production backup configuration
Production monitoring
```

Example:

```txt
app.onedayonlysystems.com
Supabase project: onedayos-production
Git branch: main
```

## 12.3 Production client model

Clients live inside production as tenant organizations.

Example:

```txt
Organization: acme-trading
Organization: flores-foods
Organization: cruz-hardware
```

Adding a client means:

```txt
create Organization row
create Admin user
create subscription/AppCare state
enable modules
configure settings
seed client-specific starting data
```

It does not mean:

```txt
create new Vercel project
create new Supabase project
create new database
create new code fork
create new branch
```

## 12.4 Production migration rules

Production migrations require approval.

Required preconditions:

```txt
[ ] Migration file reviewed
[ ] Staging migration passed
[ ] Staging smoke tests passed
[ ] Security checks passed
[ ] Backup status checked
[ ] Roll-forward plan known
[ ] Deployment window acceptable
```

Production migration command:

```bash
npx prisma migrate deploy
```

Forbidden in production:

```bash
npx prisma migrate dev
npx prisma db push
manual schema edit in Supabase dashboard
```

## 12.5 Production seed rules

Production seed may create or update only baseline platform data, such as:

```txt
system roles
system permissions
required settings defaults
known module registry metadata if stored in DB later
```

Production seed must not create:

```txt
random demo users
fake demo products
fake demo employees
test organizations unless explicitly marked internal demo
client data without onboarding workflow
```

Client onboarding is not the same as global seed.

---

# 13. Domain Strategy

## 13.1 Recommended domains

Preferred long-term domain layout:

```txt
onedayonlysystems.com          Marketing website
app.onedayonlysystems.com      Production OneDayOS app
staging.onedayonlysystems.com  Staging app
```

Client routes:

```txt
https://app.onedayonlysystems.com/acme-trading/dashboard
https://app.onedayonlysystems.com/flores-foods/inventory
```

This keeps marketing and app infrastructure separate.

## 13.2 Acceptable MVP shortcut

For the earliest MVP, the app may live at:

```txt
https://onedayonlysystems.com/[orgSlug]/dashboard
```

But the preferred production architecture is:

```txt
https://app.onedayonlysystems.com/[orgSlug]/dashboard
```

Reason:

```txt
Marketing site can evolve independently.
App auth/session behavior stays isolated.
Redirect URLs are cleaner.
Operational incidents are easier to reason about.
```

## 13.3 Client custom domains

Client custom domains are deferred.

Forbidden for MVP unless founder-approved:

```txt
client-a.com points directly to OneDayOS app
inventory.client-a.com points directly to OneDayOS app
```

Reason:

```txt
custom domains complicate auth redirects
SSL configuration
support
routing
tenant resolution
client expectations
```

Client custom domains may become a premium feature later.

---

# 14. Environment Variable Contract

## 14.1 Required variables

Baseline required variables:

```env
NEXT_PUBLIC_APP_ENV=
NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DATABASE_URL=
DIRECT_URL=
```

Future variables may include:

```env
SENTRY_DSN=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
REDIS_URL=
```

Future variables must follow the same environment separation rules.

## 14.2 Public variables

Public variables are exposed to browser bundles if prefixed with `NEXT_PUBLIC_`.

Allowed:

```env
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://app.onedayonlysystems.com
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Public does not mean harmless, but it means expected to be visible to browser code.

## 14.3 Server-only variables

Server-only variables must never use `NEXT_PUBLIC_`.

Examples:

```env
DATABASE_URL=
DIRECT_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Forbidden:

```env
NEXT_PUBLIC_DATABASE_URL=
NEXT_PUBLIC_DIRECT_URL=
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=
```

## 14.4 Environment variable validation

The restarted build should include environment validation.

Recommended files:

```txt
src/config/env.server.ts
src/config/env.client.ts
src/config/__tests__/env.test.ts
```

Rules:

```txt
server code imports env.server.ts
client code imports env.client.ts only
client code never imports server env
missing required variable fails fast
```

## 14.5 Vercel environment variable scoping

Vercel environment variables must be scoped by environment:

```txt
Development / Local
Preview
Production
```

For staging, use branch-specific Preview variables or a separate staging project if branch-specific variables become hard to manage.

Production variables must not be available to preview branches.

---

# 15. Supabase Project Strategy

## 15.1 MVP project strategy

Required minimum:

```txt
onedayos-production
onedayos-staging
```

Recommended additional:

```txt
onedayos-development
```

Local development may eventually use Supabase local stack instead of a remote development project.

## 15.2 Why separate Supabase projects for staging and production

Staging and production need separate Supabase projects because they need separate:

```txt
databases
Auth users
Auth redirect URLs
service role keys
anon keys
backups
Storage buckets later
```

Using one production Supabase project for everything creates unnecessary blast radius.

## 15.3 Why not one Supabase project per normal client

One Supabase project per client would create:

```txt
many migration targets
many backup configurations
many environment variables
many auth projects
many places for schema drift
many support surfaces
higher AppCare cost
slower one-day delivery
```

Normal clients should be tenant organizations inside the shared production project.

Dedicated Supabase projects may become a premium enterprise option later.

## 15.4 Supabase branching

Supabase branching may be useful later for preview/test changes.

MVP decision:

```txt
Do not depend on Supabase branching as the core environment model.
Use separate staging and production projects first.
```

Reason:

```txt
separate projects are simpler to reason about
staging should be persistent
production should be stable
preview database branching can be added later if PR workflows need it
```

---

# 16. Supabase Auth URL Configuration

Each Supabase project must have correct auth URL configuration.

## 16.1 Production Auth URLs

Production Supabase project should allow only production app URLs.

Example:

```txt
Site URL:
https://app.onedayonlysystems.com

Redirect URLs:
https://app.onedayonlysystems.com/**
```

If using root domain for app:

```txt
https://onedayonlysystems.com/**
```

## 16.2 Staging Auth URLs

Staging Supabase project should allow staging URLs.

Example:

```txt
Site URL:
https://staging.onedayonlysystems.com

Redirect URLs:
https://staging.onedayonlysystems.com/**
```

## 16.3 Local Auth URLs

Local Supabase/dev project should allow local URLs.

Example:

```txt
http://localhost:3000/**
```

## 16.4 Preview Auth URLs

Preview redirect URLs are allowed only for non-production Supabase projects.

Example:

```txt
https://*.vercel.app/**
```

Do not add broad Vercel wildcard preview URLs to the production Supabase project unless there is a documented reason and security review.

---

# 17. Migration Flow Across Environments

## 17.1 Local

Developer creates migration locally:

```bash
npx prisma migrate dev --name <migration-name>
```

Then runs:

```bash
npm run check:all
```

## 17.2 CI

CI validates migration against test DB:

```bash
npx prisma generate
npx prisma migrate deploy
npm run test:run
npm run build
```

## 17.3 Staging

Staging applies migration before production:

```bash
npx prisma migrate deploy
```

Then staging smoke tests must pass.

## 17.4 Production

Production applies migration only after approval:

```bash
npx prisma migrate deploy
```

Production migration must be logged.

## 17.5 Forbidden migration shortcuts

Forbidden outside local development:

```bash
npx prisma db push
npx prisma migrate dev against staging
npx prisma migrate dev against production
manual SQL schema edit in production
```

---

# 18. Seed and Provisioning Strategy by Environment

## 18.1 Seed types

OneDayOS has different data creation mechanisms:

| Mechanism | Purpose | Environment |
|---|---|---|
| Baseline seed | System roles, system permissions, required defaults | All environments |
| Test fixtures | Deterministic test data | CI/local only |
| Demo seed | Fake demo org/data | Local/staging/demo only |
| Client provisioning | Real client org/user/module setup | Production |

Do not mix these.

## 18.2 Local seed

Local seed may create:

```txt
Alpha org
Beta org
fake admins
fake staff
fake products
fake employees
fake module data
```

## 18.3 CI fixtures

CI fixtures are not production seed.

They must be deterministic, resettable, and fake.

## 18.4 Staging seed

Staging seed may create:

```txt
fake orgs
fake users
fake modules
permission scenarios
soft-deleted records
```

## 18.5 Production seed

Production seed may create only baseline platform data.

Client onboarding must use a dedicated provisioning flow.

Forbidden:

```txt
Adding real client org creation inside global prisma/seed.ts
Hardcoding client names in production seed
Hardcoding client users in production seed
```

---

# 19. Client Onboarding Is Not Environment Creation

When a new client signs up or is onboarded, do this:

```txt
1. Create Organization.
2. Create first Admin User.
3. Create subscription/AppCare record.
4. Create roles and permissions.
5. Enable purchased modules through OrgModule.
6. Configure settings.
7. Import or enter starting data.
8. Train client.
```

Do not do this:

```txt
1. Create new Git branch.
2. Create new Vercel project.
3. Create new Supabase project.
4. Copy codebase.
5. Customize environment variables for that client.
```

Exception:

```txt
Dedicated infrastructure enterprise deployment
```

That requires a separate future ADR and different pricing.

---

# 20. Environment Naming Conventions

## 20.1 App environment names

Use these exact environment names:

```txt
local
ci-test
preview
staging
production
```

Avoid synonyms:

```txt
prod
live
qa
uat
test2
client-test
```

The app may expose:

```env
NEXT_PUBLIC_APP_ENV=staging
```

Allowed values:

```ts
type AppEnvironment = 'local' | 'ci-test' | 'preview' | 'staging' | 'production'
```

## 20.2 Supabase project names

Recommended:

```txt
onedayos-production
onedayos-staging
onedayos-development
```

## 20.3 Git branches

Recommended:

```txt
main        production
staging     staging
feature/*   preview
fix/*       preview
```

Do not create branches per client.

Forbidden default:

```txt
client/acme
client/flores
client/cruz
```

---

# 21. Environment-Specific Behavior

Environment-specific behavior should be minimal.

Allowed:

```txt
logging level
debug banners
error reporting target
mock payment provider in non-production
fake email provider in non-production
seed behavior
feature flag exposure for internal testing
```

Forbidden:

```txt
security checks disabled in staging
permission checks disabled locally
multi-tenant checks disabled for development
module behavior that differs drastically per environment
production-only code paths that never run in staging
```

Dangerous example:

```ts
if (process.env.NODE_ENV !== 'production') {
  skipPermissionChecks()
}
```

This is forbidden.

The system must be safe in every environment.

---

# 22. Production Data in Non-Production

Production data must not be copied into local, preview, or staging by default.

If production data is needed for incident response:

```txt
[ ] Founder approval
[ ] Reason documented
[ ] Scope minimized
[ ] Data restored to controlled staging project only
[ ] Sensitive fields sanitized where possible
[ ] Access limited
[ ] Cleanup date defined
[ ] Incident notes updated
```

For normal development, use fake data.

---

# 23. Environment Access Control

## 23.1 Supabase access

Production Supabase access should be limited.

Recommended access model:

```txt
Founder / lead architect: owner/admin
Trusted engineer: limited/admin as needed
Support staff: no Supabase dashboard access by default
Claude: no real production secrets
Client: no Supabase dashboard access
```

## 23.2 Vercel access

Production Vercel access should be limited.

Recommended:

```txt
Founder / lead architect can manage production env vars
Developers can deploy through Git workflow
No casual direct edits to production environment variables
```

## 23.3 Clients

Clients receive OneDayOS user accounts.

They do not receive:

```txt
Vercel access
Supabase access
GitHub access
production database access
service role keys
```

---

# 24. Environment Variable Change Process

Changing a production environment variable can break production.

Required process:

```txt
1. Identify variable.
2. Identify environment.
3. Confirm old value backup/rotation plan if secret.
4. Apply to staging first when possible.
5. Smoke test staging.
6. Apply to production.
7. Redeploy if required.
8. Smoke test production.
9. Document change.
```

Forbidden:

```txt
Changing production env vars while debugging casually
Copying staging values into production without review
Copying production values into preview
```

---

# 25. Environment Checklist

## 25.1 Local checklist

```txt
[ ] .env.local exists and is not committed
[ ] .env.local uses non-production Supabase/database
[ ] npm install completed
[ ] npx prisma generate works
[ ] local migrations work
[ ] npm run test:run passes
[ ] npm run build passes
```

## 25.2 CI checklist

```txt
[ ] CI uses test/fake database
[ ] CI does not use production secrets
[ ] prisma generate runs
[ ] migrations apply
[ ] tests run
[ ] architecture checks run
[ ] generator checks run
[ ] build runs
```

## 25.3 Preview checklist

```txt
[ ] Preview uses non-production Supabase project
[ ] Preview does not run production migrations
[ ] Preview auth redirects configured in non-production Supabase only
[ ] Preview environment variables are scoped correctly
[ ] Preview build passes
```

## 25.4 Staging checklist

```txt
[ ] Staging domain configured
[ ] Staging Supabase project exists
[ ] Staging environment variables set
[ ] Staging Auth redirect URLs configured
[ ] Migrations apply to staging
[ ] Staging seed/fixtures run
[ ] Smoke tests pass
[ ] Security checks pass
```

## 25.5 Production checklist

```txt
[ ] Production domain configured
[ ] Production Supabase project exists
[ ] Production environment variables set
[ ] Production Auth redirect URLs configured
[ ] Production backups understood/configured
[ ] Owner/MFA/account recovery controls in place
[ ] Staging deployment passed
[ ] Production migration approved
[ ] Production smoke test completed
```

---

# 26. Common Failure Scenarios

## 26.1 Wrong database URL

Symptom:

```txt
Local development changes real client data.
```

Prevention:

```txt
Do not use production DATABASE_URL locally.
Add visual environment banner in non-production.
Validate NEXT_PUBLIC_APP_ENV.
Restrict production database credentials.
```

## 26.2 Auth redirect goes to wrong domain

Symptom:

```txt
Login works locally but fails on staging.
Magic link / OAuth redirects to localhost or production unexpectedly.
```

Prevention:

```txt
Configure Supabase Site URL and Redirect URLs per project.
Do not share one Auth project across all environments.
```

## 26.3 Preview deployment mutates staging database

Symptom:

```txt
Feature branch changes schema/data used by staging QA.
```

Prevention:

```txt
Do not auto-run migrations from preview deployments.
Use dedicated preview/dev DB or future Supabase branching.
```

## 26.4 Production migration fails

Symptom:

```txt
Production deployment succeeds but database schema is incompatible.
```

Prevention:

```txt
Run migrations on staging first.
Run build against generated Prisma Client.
Use safe migration patterns.
Have backup/restore plan.
```

## 26.5 Client is mistakenly treated as infrastructure

Symptom:

```txt
Every new client gets a new database and code fork.
```

Prevention:

```txt
Clients are Organization rows.
Environments are platform lifecycle stages.
Dedicated infrastructure requires future enterprise ADR.
```

---

# 27. Claude Implementation Rules

When Claude implements environment-related work, Claude must follow these rules:

```txt
1. Do not create client-specific environments.
2. Do not create one Supabase project per normal client.
3. Do not use production credentials in local, preview, staging, or CI examples.
4. Do not commit real .env files.
5. Do not prefix server secrets with NEXT_PUBLIC_.
6. Do not disable tenant or permission checks by environment.
7. Do not add FastAPI or Python infrastructure for environment management.
8. Do not add db push workflows for staging or production.
9. Do not auto-run production migrations from preview deployments.
10. Do not create separate app forks per client.
11. Do not store secrets in module manifests or settings records.
12. Do not assume Vercel Preview equals staging unless explicitly configured.
13. Do not use production Supabase Auth redirect URLs in staging docs.
14. Do not mark deployment work complete without env variable and auth redirect checks.
```

If Claude is unsure which environment a command targets, Claude must stop and ask for the correct environment.

---

# 28. Acceptance Criteria

This document is satisfied when the restarted OneDayOS foundation has:

```txt
[ ] Documented environment names
[ ] Local environment setup
[ ] CI test environment plan
[ ] Preview deployment rule
[ ] Staging environment plan
[ ] Production environment plan
[ ] Separate staging and production Supabase projects
[ ] Environment variable contract
[ ] Auth redirect URL rules
[ ] Migration flow by environment
[ ] Seed/provisioning separation
[ ] Client organization vs environment distinction
[ ] Claude implementation rules
```

Before production use:

```txt
[ ] Production environment variables configured
[ ] Production Supabase Auth redirect URLs configured
[ ] Staging environment successfully tested
[ ] Production backup posture understood
[ ] Production migration flow tested through staging
[ ] Production deployment smoke test passes
```

---

# 29. External References Checked

The following official references informed this document:

- Vercel Environments documentation: https://vercel.com/docs/deployments/environments
- Vercel Environment Variables documentation: https://vercel.com/docs/environment-variables
- Vercel Staging Environment guide: https://vercel.com/kb/guide/set-up-a-staging-environment-on-vercel
- Supabase Managing Environments documentation: https://supabase.com/docs/guides/deployment/managing-environments
- Supabase Branching documentation: https://supabase.com/docs/guides/deployment/branching
- Supabase Auth Redirect URLs documentation: https://supabase.com/docs/guides/auth/redirect-urls

---

# 30. Final Rule

Do not confuse client growth with environment growth.

OneDayOS should scale like this:

```txt
One production platform
Many client organizations
Shared modules
Shared infrastructure
Per-org configuration
Per-org permissions
Per-org data isolation
```

Not like this:

```txt
One app fork per client
One database per client by default
One deployment per client by default
One migration process per client by default
```

Environment discipline is what allows OneDayOS to remain a platform instead of becoming a pile of custom apps.
