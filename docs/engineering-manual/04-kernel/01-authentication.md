# OneDayOS Engineering Manual — 04 Kernel / 01 Authentication

**Document ID:** `04-kernel/01-authentication.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Owner:** OneDayOS Founding Architect  
**Project:** OneDayOS  
**Website:** onedayonlysystems.com  
**Last Updated:** July 2026  
**Implementation Allowed:** No — freeze after founder review  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `13-security/08-production-readiness-gate.md`
- `13-security/09-security-stabilization-new-build-spec.md`
- `04-kernel/00-kernel-overview.md`

---

# 1. Purpose

This document defines the authentication architecture for the OneDayOS Kernel.

Authentication is the first security boundary of the platform. It answers:

```txt
Who is this person?
```

It does **not** answer:

```txt
Which organization can they access?
What are they allowed to do?
Which modules are enabled?
Which records may they mutate?
```

Those questions are handled by tenancy, authorization, permissions, and module access control.

However, authentication must provide the secure foundation for all of those systems.

This document defines:

- Supabase Auth usage.
- Prisma `User` synchronization.
- Login behavior.
- Registration behavior.
- API-safe auth behavior.
- Page-safe auth behavior.
- Service-role boundaries.
- Session helpers.
- Platform user resolution.
- Auth test requirements.
- Claude Code implementation boundaries.

---

# 2. Architectural Context

OneDayOS is being restarted from scratch.

The previous MVP Kernel proved several useful patterns, but it also exposed critical risks:

- API routes used page-style auth helpers that redirected instead of returning JSON `401` responses.
- Org membership checks were incomplete.
- Permission checks existed but were not enforced.
- Some module patterns risked accepting client-supplied `orgId`.
- Registration required careful Supabase Auth and Prisma synchronization.

The new build must not repeat those mistakes.

Authentication must be designed as a **Kernel primitive** from day one.

---

# 3. Authentication Philosophy

## 3.1 Supabase Auth is the identity provider

OneDayOS uses Supabase Auth for:

- Email/password authentication.
- Session cookies.
- Auth user IDs.
- Password management.
- Future magic links or SSO.

OneDayOS does **not** build its own password system.

---

## 3.2 Prisma `User` is the platform user

Supabase Auth tells us that a person is authenticated.

Prisma tells us whether that authenticated person exists inside OneDayOS.

Supabase Auth user:

```txt
Identity-layer user
```

Prisma `User`:

```txt
Platform-layer user
```

The platform user contains OneDayOS-specific information:

- Organization membership.
- Name.
- Email.
- Avatar.
- Active/inactive status.
- Role assignments.
- Employee link.

---

## 3.3 Auth is not authorization

Authentication verifies identity.

Authorization verifies permission.

This is allowed:

```ts
const authUser = await sdk.auth.requireApiAuth()
```

This is incomplete:

```ts
const authUser = await sdk.auth.requireApiAuth()
await InventoryService.create(body)
```

This is the correct shape:

```ts
const ctx = await sdk.auth.requireApiOrgContextBySlug(orgSlug)
await sdk.permissions.require(ctx, {
  module: 'inventory',
  action: 'create',
  resource: 'stock_adjustment',
})
await InventoryService.create(ctx, input)
```

---

## 3.4 Page auth and API auth must be separate

Page auth may redirect:

```txt
Unauthenticated dashboard page request → redirect to /login
```

API auth must never redirect:

```txt
Unauthenticated API request → 401 JSON
```

This distinction is mandatory.

An API route must never return an HTML login page or a `307` redirect when the client expects JSON.

---

## 3.5 Registration must be atomic enough for platform safety

Supabase Auth and Prisma records must be created through one server-owned flow.

The client must never do this:

```ts
await supabase.auth.signUp(...)
```

and then hope a separate process creates the OneDayOS `Organization` and `User` rows later.

That creates orphaned auth users.

Instead, registration must be owned by a Kernel API route that creates:

```txt
Supabase Auth user
+ Organization
+ Subscription
+ Admin role
+ Admin permissions
+ Prisma User
+ UserRole assignment
```

as one logical onboarding operation.

If Prisma creation fails after Supabase Auth user creation, the route must attempt to delete the Supabase Auth user so the account can be retried cleanly.

---

# 4. Non-Goals

This document does not define:

- Permission model details.
- Full role management UI.
- Multi-org user switching.
- SSO.
- Magic links.
- Two-factor authentication.
- Public marketplace authentication.
- Customer billing enforcement.
- Row Level Security.
- Module-specific access rules.

Those belong in separate manual documents.

For the MVP rebuild, this document assumes:

```txt
One authenticated platform user belongs to one organization.
```

Multi-org membership can be added later through an explicit architecture change.

---

# 5. Core Decisions

## Decision 1 — Supabase Auth user ID equals Prisma User ID

The Prisma `User.id` must equal the Supabase Auth `auth.users.id`.

```prisma
model User {
  id    String @id // Supabase auth.users.id
  orgId String
  email String
  name  String
}
```

This avoids maintaining a separate identity mapping table during MVP.

---

## Decision 2 — No client-side signup

The registration page must call a Kernel API route.

Allowed:

```ts
await fetch('/api/kernel/auth/register', {
  method: 'POST',
  body: JSON.stringify(formData),
})
```

Forbidden:

```ts
await supabase.auth.signUp({ email, password })
```

Reason:

The Kernel must control the Supabase Auth ↔ Prisma sync seam.

---

## Decision 3 — Login may use Supabase browser client

The login page may use the Supabase browser client for `signInWithPassword` because the platform user already exists.

Allowed:

```ts
const supabase = createBrowserClient()
await supabase.auth.signInWithPassword({ email, password })
```

After login, the client must call a **current-user endpoint**, not a user-by-ID endpoint.

Allowed:

```ts
const res = await fetch('/api/kernel/auth/me')
```

Forbidden:

```ts
const res = await fetch(`/api/kernel/users/${user.id}`)
```

Reason:

`/api/kernel/auth/me` derives the current user from the session. It does not trust a caller-supplied ID.

---

## Decision 4 — Auth helpers must be split by runtime context

The Kernel must provide separate helpers for:

```txt
Page/server component auth
API route auth
Org-scoped page auth
Org-scoped API auth
```

Do not use one helper for every situation.

---

## Decision 5 — Authenticated user is not automatically a valid platform user

A Supabase Auth user may exist without a Prisma `User` row because of:

- Failed registration rollback.
- Manual Supabase dashboard edits.
- Data corruption.
- Legacy imports.

The Kernel must handle this explicitly.

Authenticated but unprovisioned users should receive:

```txt
ACCOUNT_NOT_PROVISIONED
```

not a crash.

---

## Decision 6 — Inactive users and inactive organizations cannot access the app

If `User.isActive = false`, access is denied.

If `Organization.isActive = false`, access is denied.

Subscription status may later add more nuanced behavior, but inactive user/org status is enforced by the Kernel.

---

## Decision 7 — Auth does not accept `orgId` from clients

Auth context resolvers may accept an org slug from the route path because slugs are user-facing URLs.

They must not accept `orgId` from:

- Query strings.
- JSON request bodies.
- Hidden form fields.
- Client state.
- Local storage.

Forbidden:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
```

Allowed:

```ts
const ctx = await requireApiOrgContextBySlug(orgSlug)
```

The server resolves the slug to an organization and verifies membership.

---

# 6. Terminology

## 6.1 Supabase Auth User

The user returned by Supabase Auth.

Example shape:

```ts
type SupabaseAuthUser = {
  id: string
  email?: string
}
```

This user proves authentication only.

---

## 6.2 Platform User

The OneDayOS `User` row stored in PostgreSQL through Prisma.

Example shape:

```ts
type PlatformUser = {
  id: string
  orgId: string
  name: string
  email: string
  isActive: boolean
}
```

This user proves platform membership.

---

## 6.3 Platform Context

A verified context object created by the Kernel.

```ts
type PlatformContext = {
  authUserId: string
  userId: string
  orgId: string
  orgSlug: string
  user: {
    id: string
    name: string
    email: string
    isActive: boolean
  }
  org: {
    id: string
    name: string
    slug: string
    isActive: boolean
  }
}
```

This context should be passed into services.

Preferred:

```ts
InventoryService.list(ctx)
```

Avoid:

```ts
InventoryService.list(orgId)
```

Reason:

`PlatformContext` proves the org ID came from the Kernel, not from the client.

---

# 7. Required File Structure

The authentication subsystem should use this structure:

```txt
src/kernel/auth/
  browser.ts
  server.ts
  admin.ts
  session.ts
  context.ts
  errors.ts
  types.ts
  __tests__/
    session.test.ts
    context.test.ts
    register-route.test.ts
    me-route.test.ts

src/app/(auth)/
  layout.tsx
  login/page.tsx
  register/page.tsx

src/app/api/kernel/auth/
  register/route.ts
  me/route.ts

src/sdk/index.ts
```

Notes:

- File names may be adjusted if the codebase standard differs, but the responsibilities must remain separate.
- `admin.ts` must never be imported by client components.
- API routes that use Prisma or Supabase admin APIs must run in Node.js runtime.

---

# 8. Supabase Client Helpers

## 8.1 Browser client

File:

```txt
src/kernel/auth/browser.ts
```

Purpose:

Client-side login, logout, and session-aware UI behavior.

Required export:

```ts
export function createBrowserClient()
```

Rules:

- May use `NEXT_PUBLIC_SUPABASE_URL`.
- May use `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Must not use `SUPABASE_SERVICE_ROLE_KEY`.
- Must be marked with `'use client'` if required by framework usage.

---

## 8.2 Server client

File:

```txt
src/kernel/auth/server.ts
```

Purpose:

Server-side session reading and cookie refresh.

Required export:

```ts
export async function createServerClient()
```

Rules:

- Uses Supabase anon key.
- Reads and writes cookies through Next.js server APIs.
- Used by `getAuthUser()` and session helpers.
- Does not use service role.

---

## 8.3 Admin client

File:

```txt
src/kernel/auth/admin.ts
```

Purpose:

Privileged auth operations.

Required export:

```ts
export function createSupabaseAdminClient()
```

Used for:

- Creating auth users during registration.
- Deleting auth users during rollback.
- Future admin-controlled password reset or invitations.

Rules:

- Uses `SUPABASE_SERVICE_ROLE_KEY`.
- Must only be imported by server-only code.
- Must never be imported by client components.
- Must never be exposed through SDK to modules.

---

# 9. Session Helper Contract

File:

```txt
src/kernel/auth/session.ts
```

Required exports:

```ts
export async function getAuthUser(): Promise<SupabaseAuthUser | null>

export async function requirePageAuth(): Promise<SupabaseAuthUser>

export async function requireApiAuth(): Promise<SupabaseAuthUser>
```

## 9.1 `getAuthUser()`

Returns the Supabase Auth user or `null`.

It must not redirect.

It must not throw for normal unauthenticated users.

Expected behavior:

```txt
Authenticated session exists → returns Supabase user
No session exists → returns null
Supabase error → logs server-side and returns null or throws mapped KernelAuthError
```

---

## 9.2 `requirePageAuth()`

Used by pages, layouts, and server components.

Expected behavior:

```txt
Authenticated → returns Supabase user
Unauthenticated → redirect('/login')
```

Allowed to use Next.js `redirect()`.

Forbidden in API routes.

---

## 9.3 `requireApiAuth()`

Used by API routes only.

Expected behavior:

```txt
Authenticated → returns Supabase user
Unauthenticated → throws or returns KernelAuthError with 401 metadata
```

It must not call `redirect()`.

It must not return HTML.

It must be compatible with this API response shape:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

---

# 10. Platform User Resolution

Authentication is incomplete until the Supabase Auth user is resolved to a Prisma `User`.

File:

```txt
src/kernel/auth/context.ts
```

Required exports:

```ts
export async function getCurrentPlatformUser(): Promise<PlatformUser | null>

export async function requirePlatformUser(): Promise<PlatformUser>

export async function requireApiPlatformUser(): Promise<PlatformUser>
```

## 10.1 Resolution flow

```txt
1. Read Supabase Auth user from session.
2. If missing, return/throw UNAUTHENTICATED.
3. Query Prisma User where id = authUser.id.
4. If missing, return/throw ACCOUNT_NOT_PROVISIONED.
5. If user.isActive = false, return/throw USER_INACTIVE.
6. Return PlatformUser.
```

## 10.2 Do not query by email

Forbidden:

```ts
prisma.user.findUnique({ where: { email: authUser.email } })
```

Allowed:

```ts
prisma.user.findUnique({ where: { id: authUser.id } })
```

Reason:

The Supabase Auth ID is the stable identity key. Email can change.

---

# 11. Organization Context Resolution

Org-scoped pages and APIs must use Kernel context resolvers.

Required exports:

```ts
export async function requirePageOrgContextBySlug(
  orgSlug: string
): Promise<PlatformContext>

export async function requireApiOrgContextBySlug(
  orgSlug: string
): Promise<PlatformContext>
```

## 11.1 Resolution flow

```txt
1. Authenticate user.
2. Resolve Prisma User by auth user ID.
3. Verify user is active.
4. Resolve Organization by orgSlug.
5. Verify org exists.
6. Verify org is active.
7. Verify user.orgId === org.id.
8. Return PlatformContext.
```

## 11.2 Membership check is mandatory

This check is non-negotiable:

```ts
if (user.orgId !== org.id) denyAccess()
```

Without this, any authenticated user can guess another org slug and load another tenant's pages.

## 11.3 Page vs API behavior

For pages:

```txt
Unauthenticated → redirect('/login')
Org missing → notFound()
Org mismatch → notFound() or forbidden page
Inactive user/org → forbidden page
```

Recommended MVP behavior:

```txt
Org missing or org mismatch → notFound()
```

Reason:

Do not reveal whether an org slug exists.

For APIs:

```txt
Unauthenticated → 401 JSON
Org missing → 404 JSON
Org mismatch → 403 JSON or 404 JSON
Inactive user/org → 403 JSON
```

Recommended MVP behavior:

```txt
Org missing → 404 ORG_NOT_FOUND
Org mismatch → 403 ORG_ACCESS_DENIED
```

Reason:

API clients need explicit machine-readable errors. If we later want stricter slug privacy, we can change mismatch to `404` through the API error mapper.

---

# 12. API Error Contract

Authentication errors must map to the platform API contract.

Required error shape:

```ts
type ApiError = {
  code: string
  message: string
  details?: unknown
}

type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
}
```

Required auth-related error codes:

| Code | HTTP | Meaning |
|---|---:|---|
| `UNAUTHENTICATED` | 401 | No valid session |
| `ACCOUNT_NOT_PROVISIONED` | 403 | Supabase user exists but no Prisma `User` row exists |
| `USER_INACTIVE` | 403 | Platform user is inactive |
| `ORG_NOT_FOUND` | 404 | Organization slug does not exist |
| `ORG_INACTIVE` | 403 | Organization exists but is inactive |
| `ORG_ACCESS_DENIED` | 403 | User does not belong to requested organization |
| `INVALID_INPUT` | 400 | Request validation failed |
| `REGISTRATION_FAILED` | 500 | Registration failed after validation |

API routes must use shared response helpers.

Example:

```ts
return apiError('UNAUTHENTICATED', 'Authentication required.', 401)
```

Do not hand-roll inconsistent response shapes per route.

---

# 13. Registration Flow

## 13.1 Route

Required route:

```txt
POST /api/kernel/auth/register
```

Runtime:

```ts
export const runtime = 'nodejs'
```

Reason:

Registration uses Prisma and Supabase Admin APIs.

---

## 13.2 Input schema

Minimum schema:

```ts
const RegisterSchema = z.object({
  orgName: z.string().min(2).max(120),
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
})
```

Optional later fields:

```txt
phone
industry
company size
referral source
```

Do not add these until needed.

---

## 13.3 Registration sequence

Required sequence:

```txt
1. Parse JSON request body.
2. Validate with Zod.
3. Normalize email.
4. Generate base org slug from orgName.
5. Create Supabase Auth user using service role.
6. Start Prisma transaction.
7. Create Organization.
8. Create Subscription.
9. Create Admin Role.
10. Create wildcard Admin Permission.
11. Create Prisma User with id = Supabase user id.
12. Assign UserRole to Admin Role.
13. Commit transaction.
14. Return orgSlug.
15. If transaction fails, attempt to delete Supabase Auth user.
```

Important:

The previous MVP route created organization, user, and subscription. The new build should also create the initial Admin role, wildcard Admin permission, and UserRole assignment in the same flow. Without this, the first user can authenticate but may not be authorized to administer their own org.

---

## 13.4 Slug generation

Function behavior:

```txt
"Acme Trading Inc." → "acme-trading-inc"
"Jollibee #42" → "jollibee-42"
```

If slug exists:

```txt
acme-trading-inc
acme-trading-inc-1
acme-trading-inc-2
```

Slug generation must happen server-side.

---

## 13.5 Email confirmation policy

MVP B2B onboarding may use:

```ts
email_confirm: true
```

Reason:

Accounts are operator-provisioned or created during guided onboarding.

Future public self-service signup may require email confirmation. That must be handled by a separate amendment.

---

## 13.6 Registration response

Success:

```json
{
  "data": {
    "orgSlug": "acme-trading-inc"
  },
  "error": null
}
```

Validation failure:

```json
{
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Please check the submitted fields.",
    "details": {}
  }
}
```

Auth creation failure:

```json
{
  "data": null,
  "error": {
    "code": "REGISTRATION_FAILED",
    "message": "Account creation failed. Please try again."
  }
}
```

Do not return raw Supabase or Prisma stack traces to the client.

---

## 13.7 Registration rollback

If the Supabase Auth user is created but Prisma transaction fails:

```ts
await supabaseAdmin.auth.admin.deleteUser(supabaseUserId)
```

Rollback failure must be logged server-side.

Client message should remain generic.

Reason:

A failed rollback is an operational issue, not user-facing detail.

---

# 14. Login Flow

## 14.1 Page

Required page:

```txt
/login
```

Implementation:

- Client component.
- Uses React Hook Form.
- Uses Zod validation.
- Uses Supabase browser client.
- Calls `signInWithPassword`.
- Calls `/api/kernel/auth/me` after successful sign-in.
- Redirects to `/${orgSlug}/dashboard`.

---

## 14.2 Login sequence

```txt
1. User enters email/password.
2. Client validates fields.
3. Client calls Supabase signInWithPassword.
4. Supabase sets session cookies.
5. Client calls GET /api/kernel/auth/me.
6. Server resolves current platform user and organization.
7. Client redirects to /[orgSlug]/dashboard.
8. Client refreshes router state.
```

---

## 14.3 Do not redirect using user ID endpoint

Forbidden:

```ts
const { data: { user } } = await supabase.auth.getUser()
const res = await fetch(`/api/kernel/users/${user.id}`)
```

Allowed:

```ts
const res = await fetch('/api/kernel/auth/me')
```

Reason:

The server should derive user identity from the session, not from a URL parameter.

---

# 15. Current User Endpoint

## 15.1 Route

Required route:

```txt
GET /api/kernel/auth/me
```

Runtime:

```ts
export const runtime = 'nodejs'
```

---

## 15.2 Behavior

```txt
1. Require API auth.
2. Resolve Prisma User.
3. Verify user is active.
4. Resolve Organization.
5. Verify org is active.
6. Return safe user/org payload.
```

---

## 15.3 Response

Success:

```json
{
  "data": {
    "user": {
      "id": "user_123",
      "name": "Juan dela Cruz",
      "email": "juan@example.com"
    },
    "org": {
      "id": "org_123",
      "name": "Acme Trading",
      "slug": "acme-trading"
    },
    "redirectTo": "/acme-trading/dashboard"
  },
  "error": null
}
```

Failure examples:

```txt
401 UNAUTHENTICATED
403 ACCOUNT_NOT_PROVISIONED
403 USER_INACTIVE
403 ORG_INACTIVE
```

---

# 16. Logout Flow

Logout may be handled client-side with Supabase browser client.

Required behavior:

```txt
1. User clicks Sign out.
2. Client calls supabase.auth.signOut().
3. Client redirects to /login.
4. Client refreshes router state.
```

Optional future endpoint:

```txt
POST /api/kernel/auth/logout
```

Not required for MVP unless a server-owned logout flow becomes necessary.

---

# 17. Route Protection and Next.js Proxy

## 17.1 Proxy purpose

The Next.js proxy or middleware should primarily keep Supabase session cookies fresh.

It should not be the only auth enforcement layer.

Real protection must happen in:

- Page layouts.
- Server components.
- API route helpers.
- Service permissions.

---

## 17.2 Next.js version note

If the selected Next.js version uses `src/proxy.ts`, use `src/proxy.ts`.

If it uses `middleware.ts`, use `middleware.ts`.

Do not copy old middleware assumptions blindly.

The previous MVP encountered framework-specific behavior around this, so the new build must verify the correct file name during bootstrap.

---

## 17.3 Proxy must not break APIs

The proxy must not redirect API requests to `/login`.

API routes must return JSON errors through API helpers.

Proxy matcher must exclude or safely pass through:

```txt
/api/*
/_next/*
favicon.ico
static assets
```

---

# 18. Org-Scoped Layout Auth

The org layout must use the page org context resolver.

Required route group:

```txt
src/app/(platform)/[orgSlug]/layout.tsx
```

Required behavior:

```ts
const ctx = await sdk.auth.requirePageOrgContextBySlug(orgSlug)
```

Then pass safe context into the app shell:

```tsx
<AppShell
  orgSlug={ctx.org.slug}
  orgName={ctx.org.name}
  userName={ctx.user.name}
>
  {children}
</AppShell>
```

Forbidden:

```ts
const authUser = await requireAuth()
const org = await prisma.organization.findUnique({ where: { slug: orgSlug } })
// missing user.orgId === org.id check
```

---

# 19. API Auth Pattern

All protected API routes must use this pattern.

Preferred org-scoped route shape:

```txt
/api/orgs/[orgSlug]/inventory/products
/api/orgs/[orgSlug]/employees
/api/orgs/[orgSlug]/settings
```

Route example:

```ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requireApiOrgContextBySlug(orgSlug)

  await sdk.permissions.require(ctx, {
    module: 'inventory',
    action: 'read',
    resource: 'product',
  })

  const data = await InventoryProductService.list(ctx)
  return apiOk(data)
}
```

Forbidden API shape:

```txt
/api/inventory/products?orgId=org_123
```

Forbidden code:

```ts
const orgId = request.nextUrl.searchParams.get('orgId')
const data = await InventoryProductService.list(orgId)
```

---

# 20. SDK Auth Surface

The SDK must expose auth functions used by modules and routes.

Required SDK shape:

```ts
export const sdk = {
  auth: {
    getAuthUser,
    requirePageAuth,
    requireApiAuth,
    getCurrentPlatformUser,
    requirePlatformUser,
    requireApiPlatformUser,
    requirePageOrgContextBySlug,
    requireApiOrgContextBySlug,
  },
}
```

Naming may be adjusted for readability, but the page/API distinction must remain visible.

Do not expose:

```ts
sdk.auth.createSupabaseAdminClient
```

The service role client is Kernel-internal only.

---

# 21. Security Rules

## 21.1 Service role key rules

`SUPABASE_SERVICE_ROLE_KEY` must:

- Exist only in server environment variables.
- Never be prefixed with `NEXT_PUBLIC_`.
- Never appear in client bundles.
- Never be returned in API responses.
- Never be logged.
- Never be committed.

---

## 21.2 Environment variables

Required `.env.example` entries:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_URL=
```

Do not include real values.

---

## 21.3 Account enumeration

Registration and login errors should avoid unnecessary account enumeration.

Acceptable login error:

```txt
Invalid email or password.
```

Avoid exposing:

```txt
This email exists but password is wrong.
```

---

## 21.4 Rate limiting

Rate limiting is not mandatory for the first local MVP, but authentication endpoints must be designed so rate limiting can be added later.

Candidate endpoints for future rate limiting:

```txt
POST /api/kernel/auth/register
POST /login through Supabase
POST /api/kernel/auth/password-reset
```

---

# 22. Data Model Requirements

Minimum required models from the Kernel schema:

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users        User[]
  roles        Role[]
  subscription Subscription?
}

model User {
  id        String   @id // Supabase auth.users.id
  orgId     String
  name      String
  email     String
  avatarUrl String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  org   Organization @relation(fields: [orgId], references: [id])
  roles UserRole[]
}

model Role {
  id       String  @id @default(cuid())
  orgId    String
  name     String
  isSystem Boolean @default(false)

  org         Organization @relation(fields: [orgId], references: [id])
  permissions Permission[]
  userRoles   UserRole[]

  @@unique([orgId, name])
}

model UserRole {
  userId String
  roleId String

  user User @relation(fields: [userId], references: [id])
  role Role @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}

model Permission {
  id         String  @id @default(cuid())
  roleId     String
  module     String
  action     String
  resource   String?
  conditions Json?

  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, module, action, resource])
}
```

Additional models such as `Subscription`, `Employee`, `Branch`, and `Department` are defined in related Kernel documents.

---

# 23. First Admin Provisioning

The first user in a newly registered organization must be assigned Admin permissions immediately.

Required created records:

```txt
Organization
Subscription
Role: Admin
Permission: module='*', action='*', resource=null
User
UserRole: user → Admin
```

Recommended Admin permission:

```ts
{
  module: '*',
  action: '*',
  resource: null,
  conditions: null,
}
```

Reason:

Admin bootstrap should not require many separate permission rows in MVP.

The permission system must support wildcard action and wildcard module.

---

# 24. Tests Required

Authentication is not complete without tests.

## 24.1 Session tests

Required tests:

```txt
getAuthUser returns null when unauthenticated
getAuthUser returns user when authenticated
requirePageAuth redirects when unauthenticated
requirePageAuth returns user when authenticated
requireApiAuth returns/throws 401 error when unauthenticated
requireApiAuth never calls redirect
requireApiAuth returns user when authenticated
```

---

## 24.2 Platform user tests

Required tests:

```txt
authenticated Supabase user without Prisma User → ACCOUNT_NOT_PROVISIONED
inactive platform user → USER_INACTIVE
active platform user → returns PlatformUser
platform user lookup uses authUser.id, not email
```

---

## 24.3 Org context tests

Required tests:

```txt
user can access own org slug
user cannot access another org slug
missing org slug returns ORG_NOT_FOUND or notFound behavior
inactive org returns ORG_INACTIVE
context contains orgId derived server-side
context does not accept client-supplied orgId
```

---

## 24.4 Registration route tests

Required tests:

```txt
invalid input returns 400 INVALID_INPUT
successful registration creates Supabase Auth user
successful registration creates Organization
successful registration creates Subscription
successful registration creates Admin Role
successful registration creates wildcard Admin Permission
successful registration creates Prisma User with Supabase ID
successful registration assigns UserRole
Prisma failure rolls back Supabase Auth user
raw errors are not exposed to client
```

---

## 24.5 Current user endpoint tests

Required tests:

```txt
GET /api/kernel/auth/me unauthenticated → 401 JSON
GET /api/kernel/auth/me authenticated but unprovisioned → 403 JSON
GET /api/kernel/auth/me inactive user → 403 JSON
GET /api/kernel/auth/me active user → returns safe user/org payload
response does not expose role internals unless explicitly requested
```

---

## 24.6 Login page smoke tests

Required tests:

```txt
login page renders
client validates invalid email
client validates short password
successful login calls /api/kernel/auth/me
successful login redirects to /[orgSlug]/dashboard
failed login shows generic error
```

---

# 25. Implementation Order

Claude Code should implement authentication in this order:

```txt
1. Supabase browser/server/admin clients
2. Auth error types and API response helpers
3. Session helpers
4. Platform user resolver
5. Org context resolver
6. Registration API route
7. Current-user API route
8. Login page
9. Register page
10. Logout behavior in Header/AppShell later
11. Tests
```

Do not build module routes before auth context is working.

Do not build permission enforcement before auth context exists.

---

# 26. Claude Implementation Prompt

Use this prompt when asking Claude Code to implement this subsystem:

```md
You are implementing OneDayOS Kernel Authentication.

Authoritative document:
docs/engineering-manual/04-kernel/01-authentication.md

Related documents:
- docs/engineering-manual/04-kernel/00-kernel-overview.md
- docs/engineering-manual/13-security/09-security-stabilization-new-build-spec.md
- docs/engineering-manual/13-security/08-production-readiness-gate.md

Rules:
- Do not invent architecture.
- Do not implement modules.
- Do not use page redirect auth helpers in API routes.
- Do not accept client-supplied orgId.
- Do not expose the Supabase service role key.
- Registration must be server-owned.
- Login may use the Supabase browser client.
- After login, redirect using /api/kernel/auth/me, not /api/kernel/users/[id].
- API routes must return { data, error } JSON.
- Add tests for unauthenticated, unprovisioned, inactive, and success states.
- Stop and report if the manual is ambiguous.

Task:
Implement only the authentication subsystem described in this document.
```

---

# 27. Acceptance Criteria

Authentication can be considered complete only when all of the following are true:

```txt
[ ] Browser Supabase client exists
[ ] Server Supabase client exists
[ ] Admin Supabase client exists and is server-only
[ ] getAuthUser exists
[ ] requirePageAuth redirects unauthenticated page users
[ ] requireApiAuth returns or maps to 401 JSON without redirect
[ ] Platform user resolver exists
[ ] Org context resolver exists
[ ] Org context verifies user.orgId === org.id
[ ] Registration route creates Supabase Auth user server-side
[ ] Registration route creates Organization
[ ] Registration route creates Subscription
[ ] Registration route creates Admin Role
[ ] Registration route creates wildcard Admin Permission
[ ] Registration route creates Prisma User using Supabase user ID
[ ] Registration route assigns UserRole
[ ] Registration route rolls back Supabase user on Prisma failure
[ ] Login page uses Supabase browser signInWithPassword
[ ] Login page calls /api/kernel/auth/me after login
[ ] Login page redirects to /[orgSlug]/dashboard
[ ] /api/kernel/auth/me returns safe current-user payload
[ ] API errors follow { data, error } shape
[ ] No API route uses redirect-based auth
[ ] No auth flow trusts client-supplied orgId
[ ] Tests cover auth success and failure modes
[ ] npm run test:run passes
[ ] npm run typecheck passes
[ ] npm run build passes
```

---

# 28. Explicit Anti-Patterns

The following are forbidden:

```ts
// Client-side signup that bypasses Kernel registration
await supabase.auth.signUp(...)
```

```ts
// API auth helper that redirects
await requireAuth()
```

```ts
// User lookup by URL param for current user behavior
fetch(`/api/kernel/users/${user.id}`)
```

```ts
// Trusting client-supplied tenant identity
const orgId = request.nextUrl.searchParams.get('orgId')
```

```ts
// Passing loose orgId into services
InventoryService.list(orgId)
```

```ts
// Importing service role client into a client component
import { createSupabaseAdminClient } from '@/kernel/auth/admin'
```

```ts
// Returning raw errors to client
return NextResponse.json({ error: err.message })
```

---

# 29. Relationship to Future Documents

This document is a prerequisite for:

- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/01-tenancy-data-isolation.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `08-module-system/04-module-permissions.md`

Authentication must be frozen before those documents are implemented.

---

# 30. Founder Review Questions

Before freezing this document, answer these questions:

## 30.1 Should public self-registration exist in production?

Recommended answer:

```txt
Not by default.
```

Use it for development and guided onboarding. Later, expose it publicly only if sales requires it.

## 30.2 Should first user receive wildcard Admin permission?

Recommended answer:

```txt
Yes, for MVP.
```

It is simpler and consistent with the platform bootstrap model.

## 30.3 Should org mismatch return 403 or 404 in APIs?

Recommended answer:

```txt
403 for APIs, 404 for pages.
```

APIs benefit from explicit machine-readable errors. Pages should avoid revealing org existence.

## 30.4 Should login use `/api/kernel/auth/me`?

Recommended answer:

```txt
Yes.
```

It avoids user-ID based lookup routes and keeps current-user resolution session-derived.

---

# 31. Final Principle

Authentication should be boring, strict, and invisible when it works.

Users should simply log in and arrive at their organization dashboard.

Engineers and AI agents should never have to guess:

```txt
Do I redirect here?
Do I return JSON here?
Where do I get orgId?
Can I trust this user ID?
Is this a real platform user?
```

The Kernel must answer those questions through explicit helpers.

That is the purpose of this authentication design.
