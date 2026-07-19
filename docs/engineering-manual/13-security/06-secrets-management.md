# OneDayOS Engineering Manual — 13 Security / 06 Secrets Management

**Document ID:** `13-security/06-secrets-management.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Foundation Build`  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `04-kernel/01-authentication.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `06-data/00-database-architecture.md`
- `13-security/00-security-model.md`
- `13-security/01-auth-security.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `13-security/04-api-security.md`
- `13-security/05-data-security.md`

---

# 1. Purpose

This document defines how OneDayOS stores, names, protects, rotates, accesses, and audits secrets.

Secrets are not only a deployment detail.

For OneDayOS, secrets protect:

```txt
Supabase project access
database access
Supabase Auth admin operations
Prisma migrations
Vercel deployments
future email/SMS providers
future AI providers
future storage providers
future background job providers
future billing providers
```

A leaked secret can become a cross-tenant breach.

Because OneDayOS uses one shared platform, one shared production deployment, and one shared database for many client organizations, secret leakage can affect more than one customer at the same time.

Therefore, secrets management is part of the platform security model.

---

# 2. Core Principle

```txt
Secrets are platform infrastructure credentials.
They are never business data, never client configuration, and never module input.
```

A secret must never be:

```txt
stored in source code
committed to Git
included in module manifests
included in client-side bundles
included in logs
included in events
included in AI context
included in generated files
included in screenshots
sent to Claude as pasted raw values
stored in database settings
stored in module configuration
exposed to client organizations
```

---

# 3. Why This Matters for OneDayOS

OneDayOS is not ten independent client apps.

The intended model is:

```txt
One OneDayOS production platform
One OneDayOS-owned Supabase production project
One shared PostgreSQL database
Many client organizations separated by orgId
```

This means one serious secret leak can affect:

```txt
all organizations
all users
all modules
all Business Objects
all client data
all backups
future storage files
future AI context
```

Therefore, secrets must be treated as production infrastructure assets, not casual `.env` values.

---

# 4. Non-Goals

This document does not implement:

```txt
enterprise secret manager integration
HashiCorp Vault
AWS Secrets Manager
GCP Secret Manager
per-client secret stores
client-owned infrastructure
dedicated Supabase projects per client
automatic secret rotation service
runtime secret leasing
hardware security modules
FastAPI secret layer
Python backend secret management
```

Those may be considered later through ADRs.

For the restarted foundation build, secrets should be managed through:

```txt
.env.local for local development
.env.example for documentation
Vercel environment variables for hosted deployments
Supabase dashboard/API for Supabase-owned credentials
GitHub secrets only if CI/CD needs them
strict code boundaries
architecture checks
manual rotation runbooks
```

---

# 5. Definitions

## 5.1 Secret

A **secret** is any value that grants access to private infrastructure, data, third-party accounts, privileged operations, or sensitive systems.

Examples:

```txt
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN
Vercel deployment token
GitHub token
Stripe secret key
email provider API key
SMS provider API key
AI provider API key
Sentry DSN if configured as private
backup storage credential
```

## 5.2 Public environment variable

A **public environment variable** is safe to expose to the browser by design.

In Next.js, public browser-exposed variables are usually prefixed with:

```txt
NEXT_PUBLIC_
```

Examples:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
```

However, public does not mean irrelevant. Public keys still depend on proper server-side and database-side security.

## 5.3 Server-only environment variable

A **server-only environment variable** is used only in server code, API routes, server actions, scripts, migrations, or build/deployment environments.

Examples:

```txt
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN
```

Server-only variables must never be imported into browser code.

## 5.4 Service role key

The Supabase service role key is a high-privilege key that can bypass Row Level Security and perform administrative operations.

For OneDayOS, it is allowed only for narrow server-owned operations, such as:

```txt
server-owned registration
admin-created user provisioning
emergency auth cleanup
maintenance scripts
future controlled admin operations
```

It must never be exposed to the browser or to client organizations.

## 5.5 Infrastructure admin

An **infrastructure admin** is a trusted OneDayOS operator with access to Vercel, Supabase, GitHub, billing, or deployment credentials.

Client users are not infrastructure admins.

---

# 6. Secret Classification

OneDayOS secrets are classified into five levels.

## 6.1 Public client-safe values

These may be available to browser code.

Examples:

```txt
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Rules:

```txt
May be used in client components.
May be present in browser bundles.
Must not grant privileged access by itself.
Must rely on server-side checks and RLS/future RLS where applicable.
Must not contain service/admin privileges.
```

## 6.2 Server-only application secrets

These are needed by the Next.js server runtime.

Examples:

```txt
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
```

Rules:

```txt
Never use in client components.
Never prefix with NEXT_PUBLIC_.
Never log.
Never expose through API responses.
Never include in error messages.
Never send to AI providers.
Only import through server-only modules.
```

## 6.3 Deployment secrets

These are used by Vercel/GitHub/CI to deploy or operate the platform.

Examples:

```txt
VERCEL_TOKEN
GITHUB_TOKEN
SUPABASE_ACCESS_TOKEN
```

Rules:

```txt
Store only in the deployment platform or CI secret store.
Do not put in .env.example except as placeholder names.
Do not give to Claude.
Rotate after team changes or suspected leak.
```

## 6.4 Third-party integration secrets

These are future provider credentials.

Examples:

```txt
STRIPE_SECRET_KEY
RESEND_API_KEY
TWILIO_AUTH_TOKEN
OPENAI_API_KEY
SENTRY_AUTH_TOKEN
```

Rules:

```txt
Add only when the integration is approved.
Never add future provider keys before implementation.
Use server-only names unless explicitly public.
Keep provider-specific secrets out of module manifests.
Add rotation steps when provider is added.
```

## 6.5 Break-glass secrets

These are emergency credentials with high destructive power.

Examples:

```txt
Supabase owner account credentials
database admin credentials
backup restore credentials
production project transfer credentials
billing-owner credentials
```

Rules:

```txt
Use only by trusted owners.
Protect with MFA.
Do not share in chat.
Do not store in project files.
Keep recovery process documented outside source control if necessary.
At least two trusted owners should be able to recover the infrastructure.
```

---

# 7. Approved MVP Environment Variables

The restarted foundation build should begin with the smallest useful set.

## 7.1 Public variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Rules:

```txt
Only NEXT_PUBLIC_* variables may be read by browser code.
Do not add NEXT_PUBLIC_ to any secret key.
Do not expose plan limits, internal IDs, service keys, or database URLs through NEXT_PUBLIC_*.
```

## 7.2 Server-only variables

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=...
```

Rules:

```txt
Server-only variables must be read only from server-only files.
Server-only variables must never be used in client components.
Server-only variables must never be returned by APIs.
```

## 7.3 Future variables

These are reserved examples only. Do not add until the corresponding subsystem is approved.

```env
# Future billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Future email
RESEND_API_KEY=

# Future SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Future AI
OPENAI_API_KEY=

# Future error tracking
SENTRY_AUTH_TOKEN=
SENTRY_DSN=
```

Rules:

```txt
Do not add unused secrets.
Every secret must have a documented owner and use.
Every future provider secret requires an approved implementation document or ADR.
```

---

# 8. Required `.env.example`

The repository must include:

```txt
.env.example
```

The file must contain names and placeholder values only.

Example:

```env
# Public app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase public client settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key

# Server-only database connections
DATABASE_URL=postgresql://postgres:password@db.project-ref.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres

# Server-only Supabase admin key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`.env.example` must not contain:

```txt
real values
production project refs if considered sensitive
real database usernames/passwords
real service role key
real API keys
screenshots of dashboards
comments containing copied secrets
```

---

# 9. Required `.gitignore`

The repository must ignore local secret files.

Required entries:

```gitignore
.env
.env.*
!.env.example
```

If a tool creates local env backups, also ignore patterns such as:

```gitignore
.env.local
.env.production
.env.production.local
.env.staging
.env.staging.local
.env.backup
.env*.bak
```

Important:

```txt
.env.example is committed.
Real .env files are not committed.
```

---

# 10. Local Development Rules

Local development uses:

```txt
.env.local
```

Rules:

```txt
.env.local must never be committed.
Developers should copy from .env.example.
Developers should receive real values through a secure channel, not Git.
Developers should use staging/dev Supabase values when possible.
Production secrets should not be required for ordinary local development.
```

Local development should avoid production credentials.

Preferred:

```txt
local app
+ development Supabase project
+ development database
```

Allowed temporarily:

```txt
local app
+ staging Supabase project
```

Avoid:

```txt
local app
+ production Supabase project
```

Production data should not be used locally unless explicitly approved for a controlled recovery/debugging operation.

---

# 11. Vercel Environment Rules

Vercel must store environment variables per environment:

```txt
Development
Preview
Production
```

Required principle:

```txt
Production secrets belong only in Production.
Staging/preview secrets belong only in Preview or staging project configuration.
Development secrets belong only in Development.
```

Do not reuse the production Supabase project for Preview deployments unless explicitly approved.

Preferred mapping:

```txt
Vercel Production → Supabase Production
Vercel Preview → Supabase Staging
Local Development → Supabase Development
```

If OneDayOS does not initially maintain three Supabase projects, document the temporary exception.

---

# 12. Sensitive Environment Variables in Vercel

Vercel supports sensitive environment variables whose values are non-readable after creation.

For production secrets, use sensitive environment variables when available.

Recommended sensitive variables:

```txt
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN
future STRIPE_SECRET_KEY
future OPENAI_API_KEY
future RESEND_API_KEY
future TWILIO_AUTH_TOKEN
future SENTRY_AUTH_TOKEN
```

Variables that may remain non-sensitive but still protected:

```txt
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Even public variables should still be environment-specific.

---

# 13. Supabase Key Rules

## 13.1 `NEXT_PUBLIC_SUPABASE_URL`

Allowed:

```txt
browser client
server client
auth helpers
public configuration
```

Not sensitive by itself.

## 13.2 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Allowed:

```txt
browser Supabase client
login flow
session refresh
public authenticated requests through Supabase client
```

Rules:

```txt
Must be treated as public.
Must not be used as an admin key.
Must rely on proper policies/server checks.
Must not be confused with the service role key.
```

## 13.3 `SUPABASE_SERVICE_ROLE_KEY`

Allowed only in:

```txt
server-owned registration endpoint
server-only auth admin helper
controlled maintenance scripts
controlled future admin operations
```

Forbidden in:

```txt
client components
browser bundles
module manifests
module client code
events
logs
AI context
Zod schemas
field metadata
settings
database records
generated modules
```

A file that imports or uses `SUPABASE_SERVICE_ROLE_KEY` must be clearly server-only.

Recommended naming:

```txt
*.server.ts
```

Example:

```txt
src/kernel/auth/admin.server.ts
```

Forbidden:

```txt
src/sdk/client/*
src/components/*
src/modules/*/*-client.tsx
src/modules/*/manifest.ts
```

---

# 14. Database URL Rules

## 14.1 `DATABASE_URL`

Used by Prisma application runtime.

Rules:

```txt
Server-only.
Never exposed to browser.
Never logged.
Never sent to AI.
Never stored in app database.
Never included in generated module files.
```

## 14.2 `DIRECT_URL`

Used for migrations or direct DB operations where required.

Rules:

```txt
Server-only.
Used only by Prisma migration/config tooling.
Should not be used by module code.
Should not be used by ordinary API routes.
Should not be exposed to browser.
```

## 14.3 No raw database access in modules

Modules must not import Prisma directly.

Allowed:

```ts
const db = sdk.getDb(ctx)
```

Forbidden:

```ts
import { prisma } from '@/kernel/db/client'
const db = new PrismaClient()
process.env.DATABASE_URL
process.env.DIRECT_URL
```

This is both a secrets rule and an architecture rule.

---

# 15. Server / Client Boundary Rules

OneDayOS must enforce import boundaries.

## 15.1 Browser-safe imports

Browser/client code may import:

```txt
@/sdk
@/sdk/client
client-safe types
client-safe constants
UI components
Zod schemas that do not import server-only code
```

## 15.2 Server-only imports

Server code may import:

```txt
@/sdk/server
server auth helpers
server context helpers
Prisma-backed SDK helpers
Supabase admin helpers
```

## 15.3 Forbidden browser imports

Client components must not import:

```txt
@/sdk/server
@/kernel/*
@/kernel/db/client
@/kernel/auth/admin.server
@prisma/client
process.env.DATABASE_URL
process.env.DIRECT_URL
process.env.SUPABASE_SERVICE_ROLE_KEY
```

## 15.4 Naming convention

Use file names to make boundaries obvious.

Recommended:

```txt
auth-admin.server.ts
context.server.ts
db.server.ts
route.ts
service.ts
```

For browser-only code:

```txt
*-client.tsx
client.ts
sdk/client/*
```

Avoid ambiguous files that mix browser and server responsibilities.

---

# 16. Registration Secret Rules

Registration is a high-risk flow because it creates:

```txt
Supabase Auth user
Organization
User
Subscription
Admin role
Admin permissions
```

The client must never call:

```ts
supabase.auth.signUp()
```

directly for platform registration.

The approved pattern is:

```txt
Client submits registration form
→ POST /api/kernel/auth/register
→ server validates input
→ server uses Supabase admin/service role
→ server creates auth user
→ server creates Prisma records
→ server rolls back auth user if Prisma creation fails
```

The service role key is used only inside the server-owned registration flow.

Forbidden:

```txt
client-side signUp followed by separate Prisma user creation
client-submitted orgId
client-submitted role/permission grants
client-submitted subscription status
```

---

# 17. API Secret Rules

API routes must never expose secrets through:

```txt
JSON response body
error message
stack trace
headers
cookies
redirect URLs
logs
debug fields
validation errors
```

Forbidden response examples:

```json
{
  "error": "Database connection failed: postgresql://postgres:password@..."
}
```

```json
{
  "debug": {
    "SUPABASE_SERVICE_ROLE_KEY": "..."
  }
}
```

Approved response example:

```json
{
  "data": null,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong."
  }
}
```

Detailed errors may be logged internally only if they do not contain secrets.

---

# 18. Logging Rules

Logs must not include secrets.

Forbidden log content:

```txt
process.env
request headers containing authorization tokens
cookies
Supabase access token
refresh token
service role key
database URL
full request body from auth or integration routes
full Prisma record containing sensitive fields
AI prompt containing business data plus secrets
```

Acceptable log content:

```txt
request ID
orgId when server-derived
userId when server-derived
route name
error code
safe error message
duration
module ID
operation name
```

Example:

```ts
logger.error('Registration failed', {
  code: 'REGISTRATION_PRISMA_FAILED',
  requestId,
})
```

Forbidden:

```ts
console.error('Registration failed', {
  env: process.env,
  body,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
})
```

---

# 19. Event Secret Rules

Events must not include secrets.

Forbidden event payload fields:

```txt
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
accessToken
refreshToken
password
passwordHash
apiKey
secretKey
authorizationHeader
cookie
```

Business events should include minimal IDs and safe metadata.

Example:

```ts
await sdk.events.emit(ctx, 'objects.product.created', {
  productId: product.id,
  code: product.code,
})
```

Forbidden:

```ts
await sdk.events.emit(ctx, 'kernel.secret.exposed', {
  env: process.env,
})
```

---

# 20. AI Secret Rules

AI must never receive secrets.

Forbidden AI context:

```txt
.env file contents
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
Vercel tokens
GitHub tokens
Supabase access tokens
Stripe secret keys
OpenAI API keys
email/SMS provider secrets
private backup credentials
```

Claude may receive:

```txt
placeholder environment variable names
.env.example with fake placeholder values
architecture rules
error messages with secrets redacted
file paths
code with placeholder values
```

Claude must not receive:

```txt
real .env.local
real production environment variables
real service role key
real database URL
screenshots showing secret values
```

If a secret is accidentally pasted into Claude or any AI tool, treat it as compromised and rotate it.

---

# 21. Module Manifest Secret Rules

Module manifests are public platform metadata.

They must not contain secrets.

Forbidden manifest fields:

```txt
apiKey
secret
token
webhookSecret
databaseUrl
serviceRoleKey
providerCredentials
```

Allowed manifest fields:

```txt
id
label
version
compatibility
permissions
navItems
routes
api routes
events
settings schema references
AI context references
docs references
```

If a module needs provider credentials later, credentials belong in a server-only integration configuration, not the manifest.

---

# 22. Settings Secret Rules

The OneDayOS `Setting` table must not become a secret store during MVP.

Forbidden:

```txt
storing service role key in Setting.value
storing database URLs in Setting.value
storing provider API keys in Setting.value
storing client secrets in Setting.value
```

Allowed:

```txt
module labels
display preferences
feature configuration
non-secret provider IDs
non-secret toggles
business settings
```

Future exception:

A future encrypted secret-management feature for client-owned integrations may be considered through an ADR, but it is not part of MVP.

---

# 23. Client Configuration Secret Rules

Client configuration may include:

```txt
enabled modules
module settings
labels
branch/department data
roles
permissions
feature flags
business preferences
```

Client configuration must not include:

```txt
Supabase credentials
database credentials
Vercel credentials
service role key
OneDayOS infrastructure secrets
provider secrets unless future encrypted integration settings exist
```

---

# 24. GitHub Rules

GitHub must not contain real secrets.

Required:

```txt
.gitignore blocks .env files.
.env.example uses placeholders.
Pull requests must not include secrets.
Secret leaks require immediate rotation.
```

Recommended:

```txt
Enable GitHub secret scanning where available.
Use branch protection for main.
Avoid storing production secrets in GitHub unless CI needs them.
Use GitHub Actions secrets only for CI operations.
Limit repository admin access.
```

If GitHub Actions later deploys or runs checks requiring secrets, use GitHub Secrets or environment-protected secrets.

---

# 25. Claude Code Rules

Claude Code must not be given real secrets.

Approved Claude inputs:

```txt
.env.example
placeholder environment variable names
error logs with secrets redacted
architecture documents
code using process.env.NAME
```

Forbidden Claude inputs:

```txt
.env.local
production Vercel env values
Supabase service role key
database URL
direct URL
Supabase access token
provider API keys
private keys
cookies
JWT refresh tokens
```

Claude must not generate code that:

```txt
logs process.env
returns environment variables through APIs
places service role keys in client code
prefixes secret variables with NEXT_PUBLIC_
stores secrets in module manifests
stores secrets in Setting.value
creates FastAPI secret infrastructure
```

Claude implementation prompts should include:

```txt
Do not request or print real environment variable values.
Use placeholder values only.
Do not expose server-only secrets to client code.
Do not add NEXT_PUBLIC_ to secrets.
```

---

# 26. Generator Rules

Generators must not generate secrets or secret-like placeholders that look real.

Generated files may include:

```txt
process.env.SOME_REQUIRED_ENV
placeholder comments
.env.example placeholder names
```

Generated files must not include:

```txt
real API keys
fake-but-realistic keys
hardcoded service role key
hardcoded database URL
hardcoded provider token
client-facing secret fields
```

The generator must not create:

```txt
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_DATABASE_URL
NEXT_PUBLIC_DIRECT_URL
NEXT_PUBLIC_OPENAI_API_KEY
```

Forbidden generated code:

```ts
const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
```

```ts
console.log(process.env)
```

```ts
return NextResponse.json({ env: process.env })
```

---

# 27. Secret Access Pattern

Secrets should be centralized behind server-only config helpers.

Preferred:

```txt
src/config/env.server.ts
```

Example:

```ts
import 'server-only'
import { z } from 'zod'

const ServerEnvSchema = z.strictObject({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const serverEnv = ServerEnvSchema.parse(process.env)
```

Rules:

```txt
Only server-only code imports env.server.ts.
Client code must not import env.server.ts.
Validation errors must not print raw secret values.
```

For browser-safe values:

```txt
src/config/env.client.ts
```

Example:

```ts
const ClientEnvSchema = z.strictObject({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const clientEnv = ClientEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
})
```

Client env helper must expose only public values.

---

# 28. Environment Validation Rules

The app should validate required environment variables at startup/build time.

Required checks:

```txt
NEXT_PUBLIC_SUPABASE_URL exists
NEXT_PUBLIC_SUPABASE_ANON_KEY exists
DATABASE_URL exists
DIRECT_URL exists
SUPABASE_SERVICE_ROLE_KEY exists in server runtime where needed
```

Validation must not print secret values.

Bad:

```txt
DATABASE_URL=postgresql://postgres:password@...
is invalid
```

Good:

```txt
DATABASE_URL is missing or invalid.
```

---

# 29. Secret Rotation Rules

Secrets must be rotated when:

```txt
a team member with access leaves
a secret is pasted into chat/AI/email accidentally
a secret appears in Git history
a secret appears in logs
a laptop with secrets is lost
Vercel/Supabase/GitHub access is suspected compromised
a provider reports compromise
a production access review finds unnecessary access
```

Suggested rotation cadence for MVP:

```txt
High-risk secrets: rotate after incident or team change
Provider API keys: rotate after incident or contractor offboarding
Database URLs: rotate after suspected leak
Service role key: rotate after suspected leak immediately
```

High-risk secrets include:

```txt
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
SUPABASE_ACCESS_TOKEN
VERCEL_TOKEN
GITHUB_TOKEN
future STRIPE_SECRET_KEY
future OPENAI_API_KEY
```

---

# 30. Secret Leak Response Runbook

If a secret is leaked:

## Step 1 — Stop exposure

```txt
Delete public message if possible.
Remove leaked file from active branch.
Disable public access if possible.
Do not paste the secret again.
```

## Step 2 — Identify secret type

```txt
Supabase service role key
database URL
Vercel token
GitHub token
provider API key
JWT/cookie/session token
```

## Step 3 — Rotate immediately

```txt
Generate new secret in provider dashboard.
Update Vercel/GitHub/env configuration.
Redeploy if needed.
Invalidate old key.
```

## Step 4 — Review logs and access

```txt
Check suspicious access.
Check database changes.
Check user creation/deletion.
Check unusual exports.
Check provider usage.
```

## Step 5 — Repair

```txt
Revert bad commit.
Purge secret from Git history if necessary.
Update .env.example if placeholder was wrong.
Add architecture/test check to prevent recurrence.
```

## Step 6 — Communicate if needed

If client data may have been exposed, follow incident-response procedures.

## Step 7 — Postmortem

Record:

```txt
what leaked
where it leaked
who had access
when rotation completed
what data may have been affected
what prevention was added
```

---

# 31. Access Control for Infrastructure Secrets

Infrastructure access must follow least privilege.

## 31.1 Supabase

Recommended roles:

```txt
Owner: founder and one trusted backup owner
Administrator: trusted platform engineer only if necessary
Developer: limited engineers
Read-only: debugging/observer role when possible
```

Rules:

```txt
No client gets Supabase dashboard access in MVP.
No contractor gets Owner by default.
MFA required for owners.
Service role key access limited.
Billing access limited.
```

## 31.2 Vercel

Recommended:

```txt
Owner: founder/company owner
Admin: trusted platform engineer if needed
Developer: implementation contributors
```

Rules:

```txt
Limit production env access.
Use sensitive env vars for production secrets.
Remove access after engagement.
Do not give client organizations Vercel access for shared platform.
```

## 31.3 GitHub

Recommended:

```txt
Owner/Admin: founder + trusted technical owner
Maintainer/Write: implementation engineers
Read: only if needed
```

Rules:

```txt
Use branch protection.
Avoid secrets in repo.
Use GitHub Secrets only for CI.
Review collaborator access regularly.
```

---

# 32. Billing and Account Continuity

Because OneDayOS owns the infrastructure accounts, loss of access or billing failure can affect multiple clients.

Minimum operational controls:

```txt
company-owned email address for Supabase/Vercel/GitHub
MFA enabled
at least two trusted recovery owners
backup payment method
billing alerts
domain ownership documented
production project ownership documented
recovery codes stored securely
```

This is not a code requirement, but it is an AppCare operating requirement.

---

# 33. Secrets and Backups

Backups may contain sensitive business data.

Backup credentials are secrets.

Rules:

```txt
Backup export credentials must be server/operator-only.
Backup locations must not be public.
Backup files must not be uploaded to AI tools.
Backup files must not be committed.
Backup restore logs must not print secrets.
Production backup restored to staging must be access-controlled.
```

Future storage backups require separate controls because database backups do not automatically cover all object storage needs.

---

# 34. Secrets and Future Dedicated Infrastructure

MVP uses shared OneDayOS-owned infrastructure.

Future dedicated client infrastructure may introduce per-client secrets, such as:

```txt
client-owned Supabase project URL
client-owned database URL
client-owned storage bucket
client-owned provider credentials
```

This is deferred.

If added later, it requires:

```txt
ADR
pricing model
support model
secret ownership model
migration model
backup model
rotation model
deployment model
```

Do not design MVP around per-client infrastructure secrets.

---

# 35. Forbidden Patterns

## 35.1 Environment exposure

Forbidden:

```ts
return NextResponse.json({ data: process.env, error: null })
```

## 35.2 Secret logging

Forbidden:

```ts
console.log('env', process.env)
console.log('service role', process.env.SUPABASE_SERVICE_ROLE_KEY)
```

## 35.3 Client-side service key

Forbidden:

```ts
'use client'

const key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
```

## 35.4 Prefixing secrets with `NEXT_PUBLIC_`

Forbidden:

```env
NEXT_PUBLIC_DATABASE_URL=
NEXT_PUBLIC_DIRECT_URL=
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_SECRET_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=
```

## 35.5 Module-owned secret config

Forbidden:

```ts
export const InventoryModule = {
  id: 'inventory',
  apiKey: process.env.INVENTORY_API_KEY,
}
```

## 35.6 Secrets in settings

Forbidden:

```ts
await sdk.settings.set(ctx, {
  module: 'kernel',
  key: 'supabase.serviceRoleKey',
  value: process.env.SUPABASE_SERVICE_ROLE_KEY,
})
```

## 35.7 Secrets in AI context

Forbidden:

```ts
const context = {
  env: process.env,
}
```

---

# 36. Approved Patterns

## 36.1 Server-only Supabase admin client

```ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '@/config/env.server'

export function createSupabaseAdminClient() {
  return createClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

Rules:

```txt
Server-only import required.
Used only in Kernel auth/admin flows.
Never exported through SDK client.
Never used in client components.
```

## 36.2 Browser Supabase client

```ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { clientEnv } from '@/config/env.client'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

Rules:

```txt
Uses public anon/publishable key only.
No service role key.
No database URL.
```

## 36.3 Redacted logging helper

```ts
function redact(value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (value.length <= 8) return '[redacted]'
  return `${value.slice(0, 4)}...[redacted]`
}
```

Prefer not logging secrets at all. Redaction is a last line of defense.

---

# 37. Required Architecture Checks

The restarted build should include a future:

```bash
npm run check:architecture
```

Secrets-related checks should flag:

```txt
process.env in client components
SUPABASE_SERVICE_ROLE_KEY outside server-only files
DATABASE_URL outside approved config/db files
DIRECT_URL outside approved Prisma/config files
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY anywhere
NEXT_PUBLIC_DATABASE_URL anywhere
NEXT_PUBLIC_DIRECT_URL anywhere
console.log(process.env)
NextResponse.json({ ...process.env })
module manifests containing secret-like keys
settings code writing secret-like keys
```

The first version may be a simple script using text scanning and import checks.

---

# 38. Required Tests

Secrets management requires both tests and static checks.

## 38.1 Env validation tests

Test:

```txt
missing required env returns safe validation error
invalid URL returns safe validation error
validation error does not print secret value
client env exposes only NEXT_PUBLIC_* values
server env rejects missing server secrets
```

## 38.2 Server/client boundary tests

Test or check:

```txt
client code cannot import env.server
client code cannot import Supabase admin helper
client code cannot import @/sdk/server
client code cannot import @/kernel/*
```

## 38.3 API error tests

Test:

```txt
API internal errors do not include DATABASE_URL
API internal errors do not include SUPABASE_SERVICE_ROLE_KEY
API auth failures return JSON 401, not secret-bearing stack traces
```

## 38.4 Generator tests

Test generated output does not include:

```txt
NEXT_PUBLIC_DATABASE_URL
NEXT_PUBLIC_DIRECT_URL
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
process.env in client components
service role usage in modules
raw Prisma in modules
```

---

# 39. Required Files for Restarted Build

The foundation build should create:

```txt
.env.example
src/config/env.client.ts
src/config/env.server.ts
src/config/__tests__/env.test.ts
scripts/check-architecture.ts
```

Optional but recommended later:

```txt
docs/founder-guide/03-backups-outages-and-disaster-recovery.md
docs/operations/secrets-rotation-runbook.md
```

---

# 40. Claude Implementation Prompt

When asking Claude to implement secrets management, use a narrow prompt.

```md
You are implementing OneDayOS Secrets Management foundation.

Authoritative document:
docs/engineering-manual/13-security/06-secrets-management.md

Rules:
- Do not ask for real secrets.
- Do not print real environment variable values.
- Use placeholder values only.
- Do not expose server-only env vars to client code.
- Do not prefix secrets with NEXT_PUBLIC_.
- Create env.client.ts and env.server.ts.
- Use server-only protection for server env.
- Add env validation tests.
- Add architecture checks for obvious secret leaks.
- Do not modify unrelated modules.
- Do not add FastAPI, Python secret infrastructure, Vault, AWS Secrets Manager, or third-party secret managers.
- Stop if a required secret name is ambiguous.
```

---

# 41. Acceptance Criteria

This document is satisfied when:

```txt
[ ] .env.example exists with placeholder values only
[ ] real .env files are ignored by Git
[ ] server env validation exists
[ ] client env validation exists
[ ] server env does not expose values to browser
[ ] client env exposes only NEXT_PUBLIC_* values
[ ] Supabase service role key is used only in server-only Kernel/admin code
[ ] DATABASE_URL and DIRECT_URL are used only in approved server/config/migration code
[ ] no generated module uses process.env directly
[ ] no client component imports server env
[ ] API errors do not expose secrets
[ ] logs do not print process.env
[ ] check:architecture flags obvious secret leak patterns
[ ] Claude prompts forbid real secrets
[ ] secret leak response runbook exists or is scheduled
```

---

# 42. Founder Review Questions

Before freezing this document, answer:

```txt
1. Who owns the OneDayOS Supabase organization?
2. Who is the backup owner?
3. Who owns the Vercel team/account?
4. Who owns the GitHub organization/repository?
5. Where are recovery codes stored?
6. Is MFA enforced for infrastructure owners?
7. Will production use Vercel sensitive environment variables?
8. Will local development use development/staging credentials only?
9. What is the first secret rotation procedure?
10. Who is allowed to see production secrets?
```

If these questions are not answered, the platform can still be built, but production operations remain immature.

---

# 43. Final Rule

```txt
If a value can unlock infrastructure, bypass security, access client data, or mutate production systems, it is a secret.

Secrets do not belong in code, modules, manifests, settings, logs, AI context, events, or client bundles.
```

