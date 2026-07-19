# OneDayOS Engineering Manual — 02 Architecture / 04 Technology Baseline

Version: 1.0  
Status: Frozen  
Owner: OneDayOS Founder + ChatGPT Architect  
Last Updated: July 2026  
Implementation Allowed: Yes — frozen for Foundation Package 1 where applicable  
Supersedes: Technology assumptions in the old Kernel v2 MVP plan where they conflict with this document

---

# ADR-Backed Amendment — 2026-07

ADR-0012 accepts `OneDayOS Compact`.

For the current Design System implementation, the audited custom OneDayOS component layer remains in place. shadcn/ui remains approved as selective source/reference material, but the shadcn CLI must not regenerate or overwrite audited components without another ADR.

Lucide is approved and installed for shared chrome/common action icons. The active preset uses a system UI font stack and does not add a custom font package.

# 1. Purpose

This document defines the approved technology baseline for the restarted OneDayOS platform build.

Its purpose is not to chase the newest package versions. Its purpose is to make the platform:

```txt
reproducible
maintainable
secure
AI-implementable
cheap to operate
safe to upgrade
compatible with one-day delivery
```

Claude Code must not choose framework versions, add major dependencies, swap runtimes, or introduce new backend technologies without approval.

---

# 2. Core Position

OneDayOS should be built as a single full-stack TypeScript platform.

The approved baseline is:

```txt
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui source components
Motion for React
React Hook Form
Zod
Supabase
PostgreSQL
Prisma
Vitest
Vercel
GitHub
```

The rejected baseline is:

```txt
FastAPI core backend
NestJS backend
Express backend
GraphQL backend
Separate Python service for normal app logic
Per-client apps
Per-client repositories
Per-client databases for normal clients
Client-side direct database access
Runtime no-code builder in MVP
```

---

# 3. Baseline Philosophy

## 3.1 Freeze major lines, not blindly latest packages

OneDayOS should use current stable major versions, but must not install packages with loose “latest” behavior once the restarted build begins.

Correct:

```json
{
  "next": "16.2.x",
  "react": "19.x",
  "typescript": "6.0.x",
  "prisma": "7.x",
  "zod": "4.x"
}
```

Incorrect:

```bash
npm install next@latest prisma@latest zod@latest
```

Reason: `latest` can change between Claude runs, CI runs, and developer machines.

The lockfile is part of the architecture.

---

## 3.2 Avoid canary, beta, preview, and RC packages

Unless a frozen ADR explicitly allows it, OneDayOS must not use:

```txt
canary
beta
alpha
preview
rc
nightly
experimental compiler/runtime packages
```

This applies to:

```txt
Next.js
React
TypeScript
Prisma
Tailwind
shadcn/ui CLI behavior
Supabase packages
Vercel SDKs
AI SDKs
```

Exception: if Next.js itself requires a React package line through its official setup, follow the official Next.js stable installation path rather than manually pinning a random React canary.

---

## 3.3 Stability beats novelty

OneDayOS is a business operating system for SMEs, not a playground for framework experiments.

A dependency is approved only if it helps one of these goals:

```txt
security
reusability
one-day delivery
maintainability
developer experience
UI quality
operational reliability
cost control
```

---

# 4. Runtime Baseline

## 4.1 Node.js

Approved runtime:

```txt
Node.js 24 LTS
```

Recommended `package.json` engine:

```json
{
  "engines": {
    "node": ">=24 <25"
  }
}
```

Do not use Node.js 26 Current for production until it becomes LTS and passes compatibility review.

Do not use Node.js 20 for the restarted build unless a hosting/tooling constraint forces it and an ADR approves the downgrade.

Rationale:

```txt
Node 24 is the active LTS line as of the restarted build period.
LTS gives a better stability/security posture than Current.
Pinning the major runtime avoids CI/Vercel/local mismatch.
```

---

## 4.2 Package Manager

Approved package manager for MVP:

```txt
npm
```

Required files:

```txt
package.json
package-lock.json
```

Rules:

```txt
Commit package-lock.json.
Do not mix npm, pnpm, yarn, and bun in the same repo.
Do not switch package managers without ADR.
Use npm scripts as the canonical local/CI commands.
```

Reason:

```txt
npm is boring, universally available, and enough for the single-repo MVP.
```

Future note:

```txt
If OneDayOS later becomes a monorepo with packages, apps, and internal libraries, pnpm may be reconsidered through ADR.
```

---

# 5. Web Framework Baseline

## 5.1 Next.js

Approved framework:

```txt
Next.js 16 stable
```

Recommended dependency policy:

```txt
Use a stable 16.x release.
Pin exact versions in package-lock.
Do not use canary/preview releases.
```

Recommended implementation assumptions:

```txt
App Router only.
Route Handlers for business APIs.
Server Components by default.
Client Components only for interactivity.
Node runtime for Prisma-backed routes.
No Pages Router.
No tRPC.
No GraphQL.
No FastAPI backend for core platform logic.
```

Required route conventions:

```txt
/[orgSlug]/...
/api/orgs/[orgSlug]/...
/api/orgs/[orgSlug]/objects/...
/api/orgs/[orgSlug]/[moduleId]/...
```

Do not use:

```txt
/api/[module]?orgId=...
/api/inventory?orgId=...
/api/users/[id] for current-user lookup
```

Use:

```txt
/api/kernel/auth/me
```

for current authenticated platform user lookup.

---

## 5.2 React

Approved React baseline:

```txt
React 19.x compatible with the selected stable Next.js 16 release
```

Required usage:

```txt
useOptimistic for eligible optimistic UI patterns.
Server Components by default.
Client Components only where browser interactivity is needed.
```

Do not use experimental React APIs unless they are part of the selected stable Next.js-supported path and documented in a frozen manual section.

Optimistic UI rule:

```txt
Optimistic UI is required for eligible create/update/delete interactions.
The server remains the source of truth.
Rollback is mandatory on failure.
```

---

# 6. TypeScript Baseline

Approved TypeScript baseline:

```txt
TypeScript 6.0.x stable
```

Fallback:

```txt
If Next.js or a required library fails with TypeScript 6.0.x during foundation implementation,
fall back to TypeScript 5.9.x only through an ADR or documented implementation exception.
```

Rejected:

```txt
TypeScript 7 preview/native compiler for MVP
nightly TypeScript
compiler experiments
turning off strict mode to satisfy generated code
```

Required `tsconfig` posture:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Claude rule:

```txt
Claude must not solve TypeScript errors with `any`, `as any`, `// @ts-ignore`, or disabling strict settings unless explicitly approved.
```

Allowed exceptions:

```txt
Narrowly isolated interop with third-party libraries.
Test mocks where strict typing is impractical.
Temporary migration code with TODO and issue reference.
```

Every exception should be visible, not hidden.

---

# 7. Styling and Design System Baseline

## 7.1 Tailwind CSS

Approved styling engine:

```txt
Tailwind CSS v4
```

Required conventions:

```txt
CSS-first Tailwind configuration.
Use @theme tokens.
Use @custom-variant for dark mode.
Do not use Sass/Less/Stylus with Tailwind.
Do not create per-client CSS forks.
```

Required brand token:

```css
@theme {
  --color-brand: #F97316;
}
```

Forbidden:

```css
--color-accent: #F97316;
```

Reason:

```txt
Accent is used by shadcn/ui for neutral interaction states.
Hijacking it with brand orange causes global hover/selection pollution.
Use `brand` for OneDayOS identity.
```

---

## 7.2 shadcn/ui

ADR-0012 amendment:

```txt
Current audited custom OneDayOS components are the active component foundation.
shadcn/ui remains approved as selective source/reference material only.
```

Important rule:

```txt
shadcn/ui is not the OneDayOS design system.
OneDayOS Compact is the design preset and custom component contract.
```

Do not run shadcn CLI commands that overwrite audited components unless a future ADR explicitly approves that migration.

Rules:

```txt
Do not treat shadcn as a black-box runtime UI library.
Do not import random paid block libraries directly into product UI.
Do not paste generic dashboard blocks without adapting them to the design system.
Do not mix underlying primitives casually.
Do not create components.json merely to imitate shadcn.
```

Base UI / Radix note:

```txt
As of the restarted build period, shadcn/ui has moved toward Base UI as the default primitive foundation.
The implementation may use shadcn’s current default generated components.
If a component requires Radix-specific behavior, document it.
Do not mix Base UI and Radix arbitrarily without a component-level reason.
```

Required components for foundation:

```txt
button
input
label
textarea
select
dialog
sheet
dropdown-menu
popover
tooltip
table
badge
card
avatar
separator
skeleton
tabs
command
scroll-area
sonner
```

---

## 7.3 Icons

Approved icon library:

```txt
lucide-react
```

Rules:

```txt
Use one icon family consistently.
Do not mix Heroicons, Font Awesome, Material Icons, and random SVG packs.
Icon-only buttons require accessible names.
Module icons must come from approved icon names.
```

---

## 7.4 Motion

Approved motion package:

```txt
motion
```

Import path:

```ts
import { motion } from 'motion/react'
```

Do not use old imports in restarted code:

```ts
import { motion } from 'framer-motion'
```

Reason:

```txt
Motion for React is the current package lineage for Framer Motion-style animation.
The old package name may still exist, but the restarted build should standardize on `motion`.
```

Allowed uses:

```txt
subtle row insert/remove transitions
dialog/sheet entry and exit
layout transitions
table optimistic changes
short state transitions
```

Forbidden uses:

```txt
bouncy dashboard animations
slow route transitions
marketing animations inside the app shell
confetti
decorative movement that makes business work feel slower
```

---

# 8. Form and Validation Baseline

## 8.1 React Hook Form

Approved form library:

```txt
React Hook Form 7.x
```

Required usage:

```txt
Use React Hook Form for interactive client forms.
Use Zod through @hookform/resolvers.
Keep forms compact, accessible, and server-validated.
```

Do not use:

```txt
Formik
custom form state engine
hidden orgId form fields
client-only validation as security
```

---

## 8.2 Zod

Approved validation library:

```txt
Zod 4.x
```

Required usage:

```ts
z.strictObject({...})
```

for API request bodies by default.

Use current Zod 4 error helpers:

```ts
z.flattenError(error)
z.treeifyError(error)
```

Do not rely on older deprecated error-shaping patterns without checking Zod 4 compatibility.

Required security rule:

```txt
Client-supplied orgId must be rejected, not stripped silently.
```

Example:

```ts
const createProductSchema = z.strictObject({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
})
```

Forbidden:

```ts
const schema = z.object({
  orgId: z.string(),
  name: z.string(),
})
```

---

# 9. Database and Backend Data Baseline

## 9.1 Database

Approved database:

```txt
PostgreSQL hosted by Supabase
```

MVP tenancy model:

```txt
One shared PostgreSQL database.
Shared tables.
orgId on every tenant-scoped table.
No schema-per-client.
No database-per-client for normal clients.
```

Rejected for MVP:

```txt
MongoDB
MySQL
SQLite production
PlanetScale
Neon unless ADR replaces Supabase
Supabase project per normal client
separate schemas per tenant
```

---

## 9.2 Supabase

Approved Supabase usage:

```txt
Supabase Auth
Supabase PostgreSQL
Supabase Storage later, only after Attachments or approved module-local file handling
```

Required packages:

```txt
@supabase/supabase-js
@supabase/ssr
```

Rejected:

```txt
@supabase/auth-helpers-nextjs for new restarted code
client-side Supabase signUp for platform registration
Supabase Edge Functions for core business logic
Supabase Realtime for MVP
Supabase Vector for MVP
```

Auth rule:

```txt
Registration is server-owned.
The client must not call supabase.auth.signUp() directly for organization creation.
```

---

## 9.3 Prisma

Approved ORM:

```txt
Prisma ORM 7.x
```

Required packages for PostgreSQL:

```txt
prisma
@prisma/client
@prisma/adapter-pg
pg
```

Required Prisma 7 posture:

```txt
Use prisma.config.ts for CLI/database configuration.
Use a driver adapter.
Use Prisma Migrate for schema changes.
Use Prisma Client through the SDK/Data boundary.
```

Do not use old assumptions:

```prisma
// Do not rely on Prisma 5-style datasource URL behavior as the final pattern.
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}
```

The exact Prisma 7 implementation should follow the current official Prisma adapter/config docs.

Rules:

```txt
Modules never import raw Prisma.
Modules never call prisma directly.
Modules use sdk.getDb(ctx).
Never use sdk.getDb(orgId).
Never accept body.orgId.
```

Migration commands:

```bash
npx prisma migrate dev      # local only
npx prisma migrate deploy   # staging/production
npx prisma generate         # build/CI required
```

Forbidden outside throwaway local experiments:

```bash
npx prisma db push
npx prisma migrate reset
```

---

# 10. Testing Baseline

## 10.1 Unit / Integration Testing

Approved test runner:

```txt
Vitest 4.x
```

Required packages:

```txt
vitest
@vitejs/plugin-react
vite-tsconfig-paths
@testing-library/react
@testing-library/jest-dom
@testing-library/user-event
jsdom or happy-dom, selected consistently
```

Preferred test environment:

```txt
jsdom for React component tests
Node environment for backend/service tests where possible
```

Rules:

```txt
Tests must prove behavior, not just existence.
Every tenant-sensitive test suite uses at least two organizations.
Permission-sensitive tests require non-admin denial cases.
Generated modules include real tests by default.
```

---

## 10.2 Browser / E2E Testing

Deferred but approved future tool:

```txt
Playwright
```

Do not introduce a broad Playwright suite before:

```txt
app shell is stable
first official module is implemented
core design system patterns are stable
```

A small smoke suite may be introduced after foundation stability.

---

# 11. Deployment Baseline

Approved deployment platform:

```txt
Vercel
```

Rules:

```txt
One production Vercel project for the shared platform.
No Vercel project per normal client.
Preview deployments must not use production DB credentials.
Production build must run prisma generate before next build.
Production build must not run database migrations.
```

Required build command pattern:

```bash
npx prisma generate && next build
```

Production migrations happen through a separate approved workflow:

```bash
npx prisma migrate deploy
```

---

# 12. Source Control and Project Management Baseline

Approved source control:

```txt
GitHub
```

Approved project/task tracking:

```txt
Linear
```

Rules:

```txt
main branch is protected before production.
Pull requests or reviewed changes are required before production readiness.
CI must run typecheck, tests, architecture checks, Prisma generate, and build.
Claude implementation should produce commits or reviewable diffs.
```

---

# 13. Approved Dependency Categories

The following categories are approved for MVP:

```txt
framework: Next.js
runtime UI: React
language: TypeScript
styling: Tailwind CSS
component source: shadcn/ui
icons: lucide-react
forms: react-hook-form
validation: zod
animation: motion
notifications/toasts: sonner
dates: date-fns
database ORM: Prisma
postgres driver: pg
identity/data platform: Supabase
testing: Vitest + Testing Library
deployment: Vercel
```

The following categories require ADR before addition:

```txt
state management libraries
TanStack Query
TanStack Table
GraphQL clients/servers
full-text search engines
background job providers
email/SMS providers
file upload services
AI SDKs
observability paid tooling beyond approved baseline
custom analytics
runtime no-code engines
```

The following are rejected for the restarted MVP foundation:

```txt
FastAPI core backend
NestJS
Express
Django
Laravel
Rails
GraphQL backend
tRPC as core API layer
Drizzle replacing Prisma
SQLAlchemy/Alembic
Celery
Redis queues
Kafka
RabbitMQ
Temporal
Elasticsearch
Meilisearch
custom auth provider replacing Supabase Auth
```

---

# 14. Dependency Addition Policy

Claude may not add a dependency just because it is convenient.

Every new dependency must answer:

```txt
What problem does this solve?
Why can existing tools not solve it?
Is it server-only, client-only, or shared?
Does it affect bundle size?
Does it affect security?
Does it affect tenant isolation?
Does it affect AppCare cost?
Does it introduce operational infrastructure?
Does it require documentation updates?
Does it require an ADR?
```

Allowed without ADR if already in this baseline:

```txt
normal package installation for approved baseline tools
shadcn/ui source components from approved list
minor test utilities needed for existing test stack
```

Requires ADR:

```txt
new backend runtime
new database
new ORM
new auth provider
new deployment provider
new queue system
new search engine
new AI runtime provider
new file storage provider
new billing provider before billing spec
new table/form framework that replaces OneDayOS components
```

---

# 15. Version Pinning Policy

## 15.1 package.json

Use exact or compatible patch-level ranges deliberately.

Recommended pattern:

```json
{
  "dependencies": {
    "next": "16.2.x",
    "react": "19.x",
    "react-dom": "19.x",
    "zod": "4.x",
    "@prisma/client": "7.x"
  },
  "devDependencies": {
    "typescript": "6.0.x",
    "prisma": "7.x",
    "vitest": "4.x"
  }
}
```

The exact package versions are locked by:

```txt
package-lock.json
```

---

## 15.2 Renovation / Updates

Do not auto-merge dependency upgrades.

Dependency upgrades must pass:

```bash
npm ci
npm run check:all
npm run build
```

Security upgrades may be expedited, but still require verification.

Major upgrades require ADR.

---

# 16. Required npm Scripts

The restarted build should define scripts similar to:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest",
    "check:architecture": "tsx scripts/check-architecture.ts",
    "check:generated": "tsx scripts/check-generated.ts",
    "check:all": "npm run typecheck && npm run test:run && npm run check:architecture && npm run check:generated && npm run build",
    "db:generate": "prisma generate",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "module:create": "tsx scripts/create-module.ts"
  }
}
```

Notes:

```txt
If Next.js no longer provides `next lint` in the selected version/tooling path, replace with an explicit ESLint command.
The exact command should be documented in the implementation package.
```

---

# 17. Environment Variables Baseline

Required environment file pattern:

```txt
.env.example       committed, placeholders only
.env.local         local only, never committed
Vercel env vars    managed per environment
```

Required baseline variables:

```txt
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
```

Potential future variables:

```txt
SENTRY_DSN
SENTRY_AUTH_TOKEN
OPENAI_API_KEY             # deferred runtime AI only
STRIPE_SECRET_KEY          # deferred billing only
RESEND_API_KEY             # deferred email only
```

Rules:

```txt
Server secrets never use NEXT_PUBLIC_.
Client components never import server env helpers.
Claude must never receive production secret values.
```

---

# 18. Build and Fresh Clone Requirements

A fresh clone must work using only:

```bash
npm ci
cp .env.example .env.local
# fill local env values
npm run db:generate
npm run typecheck
npm run test:run
npm run build
```

Production build must not depend on local generated files.

Therefore:

```txt
prisma generate is mandatory inside build/CI.
```

This corrects one of the old MVP risks where fresh CI clones could fail because Prisma generation was not part of the build path.

---

# 19. Architecture Checks Required by Technology Baseline

The restarted platform should include architecture checks that block:

```txt
modules importing @/kernel/*
modules importing raw Prisma
modules importing other modules
client components importing @/sdk/server
client components importing server env helpers
sdk.getDb(orgId)
body.orgId
searchParams.get('orgId')
/api/[module] route shapes
redirect-style auth helpers inside API routes
framer-motion imports in restarted code
FastAPI/Python backend files
Prisma migrate reset in scripts
Prisma db push in production scripts
```

---

# 20. Old Kernel v2 Reconciliation

The old Kernel v2 reference is useful historical context, but the restarted build must follow this technology baseline where it differs.

Preserve from the old reference:

```txt
Next.js App Router
TypeScript
Tailwind v4
shadcn/ui
Supabase
PostgreSQL
Prisma
Zod
React Hook Form
Vitest
Vercel
SDK-only module access
shared orgId tenancy
Event Bus
Business Objects
optimistic UI
Tooltip/help behavior
Module Builder CLI concept
```

Correct from the old reference:

```txt
Use PlatformContext instead of loose orgId.
Use sdk.getDb(ctx), not sdk.getDb(orgId).
Use tenant-scoped API routes under /api/orgs/[orgSlug]/...
Use API-safe auth helpers that return JSON 401.
Use Motion for React package/import, not old framer-motion imports in new code.
Use shadcn/ui current Tailwind v4/React 19 path, not old named-style assumptions.
Use Prisma 7 config/adapter rules.
Use Zod 4 helpers and strict object schemas.
Use package-lock and build-time Prisma generation.
```

---

# 21. Claude Implementation Rules

When implementing the restarted foundation, Claude must:

```txt
Use only approved baseline technologies.
Stop before adding new major dependencies.
Stop before changing package manager.
Stop before adding FastAPI or Python backend code.
Stop before adding Redis/queues/background jobs.
Stop before adding runtime AI providers.
Stop before replacing Prisma or Supabase.
Stop before adding GraphQL/tRPC.
Stop before using canary/beta/preview packages.
Report exact package versions installed.
Report lockfile changes.
Run required verification commands.
```

Claude must not use this prompt:

```txt
Install whatever packages you think are needed.
```

Claude should receive this instruction instead:

```txt
Use the approved Technology Baseline document.
Do not add dependencies outside the approved baseline.
If you believe a dependency is necessary, stop and explain why before installing it.
```

---

# 22. Acceptance Criteria

This document is ready to freeze when:

```txt
[ ] Founder approves the baseline stack.
[ ] Node major version is accepted.
[ ] Package manager decision is accepted.
[ ] Next/React/TypeScript major lines are accepted.
[ ] Prisma 7 adapter/config path is accepted.
[ ] Zod 4 validation path is accepted.
[ ] shadcn/ui current source-component posture is accepted.
[ ] Motion for React import path is accepted.
[ ] FastAPI exclusion is accepted.
[ ] Dependency addition policy is accepted.
[ ] Required npm scripts are accepted.
[ ] Architecture checks are accepted.
```

---

# 23. External References Checked During Drafting

These are not implementation authority by themselves, but they informed this draft:

```txt
Next.js 16 release notes and upgrade docs
React useOptimistic documentation
TypeScript 6.0 release announcement
Tailwind CSS v4 documentation
shadcn/ui Tailwind v4 / React 19 documentation and changelog
Prisma 7 driver adapter and Prisma Client setup docs
Zod 4 documentation and migration notes
Node.js release schedule
Supabase database/Auth/connection management docs
Motion for React documentation
React Hook Form documentation
Vitest documentation
Vercel deployment/environment documentation
```

---

# 24. Final Rule

Technology choices should make OneDayOS easier to build, safer to operate, and faster to deliver.

They should not make the platform feel clever, fragile, experimental, or expensive.

```txt
Boring stable stack.
Strict architecture boundaries.
Fast module generation.
Safe tenant isolation.
Premium UI.
Low AppCare burden.
```
