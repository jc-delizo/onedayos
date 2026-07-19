# OneDayOS Engineering Manual — 13 Security / 01 Auth Security

**Document ID:** `13-security/01-auth-security.md`  
**Version:** `1.0`  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Restarted Foundation Build  
**Owner:** OneDayOS Founder + Software Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/05-data-validation-zod.md`
- `13-security/00-security-model.md`
- `13-security/08-production-readiness-gate.md`
- `13-security/09-security-stabilization-new-build-spec.md`

---

# 1. Purpose

This document defines the authentication security model for OneDayOS.

It exists to ensure that the restarted OneDayOS build does not repeat the earlier MVP authentication risks:

```txt
API auth helper redirects instead of returning JSON 401
current-user lookup can become ID-based
registration can create Supabase users without matching Prisma users
client code can call Supabase sign-up directly
org membership is not proven during route/API access
modules treat authentication as enough security
```

Authentication is the first security gate, but it is not the whole security model.

A signed-in user is only known to be a valid identity. They are not automatically allowed to access an organization, module, record, action, export, AI context, or admin function.

---

# 2. Core Auth Principle

```txt
Authentication proves who the user is.
PlatformContext proves what the user may access.
```

Every protected OneDayOS request must follow this order:

```txt
1. Authenticate Supabase user.
2. Load matching OneDayOS User record.
3. Resolve organization from orgSlug.
4. Verify user belongs to organization.
5. Create verified PlatformContext.
6. Check module enablement if module-scoped.
7. Check permission if action-scoped.
8. Execute service logic.
```

The platform must never stop at step 1.

---

# 3. Identity Model

OneDayOS uses two related identities:

```txt
Supabase Auth user = authentication identity
Prisma User = OneDayOS platform user
```

The required relationship is:

```txt
Prisma User.id === Supabase auth.users.id
```

## 3.1 Supabase Auth responsibilities

Supabase Auth owns:

```txt
email/password authentication
session cookies / refresh behavior
password hashing
password reset tokens
email auth mechanics
future MFA factors
future OAuth/SSO providers
```

## 3.2 OneDayOS Prisma User responsibilities

The OneDayOS `User` record owns:

```txt
orgId
name
email mirror for display/search
avatarUrl
active/inactive status
role assignments
employee link
platform-level user preferences later
```

## 3.3 What must not live in Supabase user metadata

Do not use Supabase user metadata as the source of truth for:

```txt
orgId
role
permissions
enabled modules
employeeId
plan/subscription
branch/department scope
business settings
```

Metadata may be convenient, but it is not the OneDayOS authorization database.

---

# 4. Authentication Is Not Authorization

The following statement is false:

```txt
User is logged in, so they may access the route.
```

The correct rule is:

```txt
User is logged in
+ user belongs to requested organization
+ organization is allowed
+ module is enabled when applicable
+ user has permission
= access allowed
```

This distinction is mandatory because OneDayOS is a shared multi-tenant platform.

---

# 5. Account Creation Model

## 5.1 Default MVP position

For the restarted MVP, OneDayOS should avoid open public self-service sign-up unless founder-approved.

The safer B2B model is:

```txt
Founder/operator provisions client organization.
Founder/operator creates first admin user.
Client admin later invites or creates staff users.
```

A public marketing-site sign-up flow can exist later, but it should not be required for the foundation build.

## 5.2 Server-owned registration only

If registration exists, it must be server-owned.

Forbidden:

```ts
// Forbidden in OneDayOS registration UI
await supabase.auth.signUp({ email, password })
```

Required pattern:

```txt
Client submits registration form
→ /api/kernel/auth/register
→ server validates input
→ server creates Supabase Auth user with service role
→ server creates Organization, User, Subscription, Admin Role, Admin Permission
→ server rolls back Supabase Auth user if Prisma transaction fails
```

The client must never be responsible for synchronizing Supabase Auth and Prisma records.

## 5.3 Atomic logical sequence

Registration should be treated as one logical operation:

```txt
create auth user
create org
create platform user
create subscription
create admin role
create admin permission
assign admin role
```

If the database transaction fails after the Supabase user is created, the route must attempt to delete the Supabase user so the email can be reused cleanly.

The rollback should be logged.

The API should return a safe error message.

## 5.4 First user becomes Admin

The first platform user for a newly created organization receives:

```txt
Admin role
*.*.* wildcard permission
```

This wildcard applies only inside that verified organization.

It never bypasses tenant isolation.

## 5.5 Staff user creation

Staff user creation should eventually be admin-controlled.

The future flow should be:

```txt
Admin opens Users settings
Admin creates or invites staff user
Server creates Supabase Auth user
Server creates OneDayOS User
Server assigns role
User receives invite/password reset flow
```

For the foundation build, staff onboarding may be implemented minimally, but it must still use server-owned auth creation.

## 5.6 Public sign-up deferred by default

Public self-service sign-up creates abuse and support risk:

```txt
spam accounts
unpaid tenant creation
trial abuse
rate-limit pressure
fake organizations
orphaned auth records if sync fails
```

If implemented, it requires:

```txt
rate limiting
email confirmation decision
captcha or abuse controls later
billing/trial rules
org uniqueness rules
strong error handling
monitoring
```

Do not add public sign-up casually.

---

# 6. Login Model

## 6.1 Browser login may use Supabase client

The login page may use the Supabase browser client for password login:

```ts
await supabase.auth.signInWithPassword({ email, password })
```

This is acceptable because login authenticates an existing user. It does not create platform records.

## 6.2 Login redirect must use current session, not user ID route

After login, the app must not call an ID-based user endpoint like:

```txt
GET /api/kernel/users/[id]
```

That pattern invites IDOR mistakes.

Use current-session lookup:

```txt
GET /api/kernel/auth/me
```

The endpoint derives the current Supabase user from the session cookie and returns the matching OneDayOS user + organization summary.

## 6.3 Login success flow

Recommended MVP flow:

```txt
1. User submits email/password.
2. Supabase browser client signs in.
3. Client calls GET /api/kernel/auth/me.
4. Server resolves current Supabase user from session.
5. Server loads OneDayOS User and Organization.
6. Server returns orgSlug.
7. Client redirects to /[orgSlug]/dashboard.
```

No client-supplied user ID is required.

No client-supplied org ID is required.

---

# 7. Session Model

## 7.1 Use Supabase SSR helpers

The restarted build should use Supabase SSR helpers for Next.js server/client session handling.

Required files:

```txt
src/kernel/auth/client.ts
src/kernel/auth/server.ts
src/kernel/auth/session.ts
src/kernel/auth/api.ts
src/kernel/auth/context.ts
```

The exact file names may vary, but the separation must remain.

## 7.2 No custom token storage

Forbidden:

```txt
storing access tokens manually in localStorage
storing refresh tokens manually in localStorage
writing custom JWT cookies
passing access tokens through URLs
putting auth tokens in query strings
```

Supabase session management should be handled through official client/server helpers.

## 7.3 Page auth and API auth are separate

Page auth may redirect.

API auth must return JSON.

Required page helper:

```ts
await sdk.auth.requirePageAuth()
```

Behavior:

```txt
Unauthenticated page request → redirect to /login
Authenticated page request → returns auth user
```

Required API helper:

```ts
await sdk.auth.requireApiAuth(request)
```

Behavior:

```txt
Unauthenticated API request → 401 JSON
Authenticated API request → returns auth user
```

## 7.4 API auth must never redirect

Forbidden inside API routes:

```ts
await sdk.auth.requirePageAuth()
await requireAuth() // if it redirects
redirect('/login')
```

Required API response:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

HTTP status:

```txt
401 Unauthorized
```

## 7.5 Expired session behavior

For pages:

```txt
expired session → redirect to /login
```

For APIs:

```txt
expired session → 401 JSON
```

For client components:

```txt
API returns 401 → show session expired state or redirect to login
```

Do not display raw Supabase errors to users.

---

# 8. PlatformContext Creation

Authentication helpers must support creating `PlatformContext`.

A verified `PlatformContext` includes:

```ts
type PlatformContext = {
  authUserId: string
  user: {
    id: string
    orgId: string
    email: string
    name: string
    isActive: boolean
  }
  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
  }
  roles: Array<{
    id: string
    name: string
  }>
  permissions: PermissionGrant[]
}
```

Exact fields may evolve, but the context must prove:

```txt
authenticated user
matching platform user
requested organization
membership in that organization
active user state
active/suspended organization state
role/permission loading capability
```

## 8.1 Page org context helper

Required helper:

```ts
await sdk.auth.requirePageOrgContext(orgSlug)
```

Behavior:

```txt
Unauthenticated → redirect /login
Wrong org → notFound() or safe 404 page
Inactive user → redirect or safe blocked page
Suspended org → limited suspended-org page
Success → PlatformContext
```

## 8.2 API org context helper

Required helper:

```ts
await sdk.auth.requireApiOrgContext(request, orgSlug)
```

Behavior:

```txt
Unauthenticated → 401 JSON
Wrong org → safe 404 JSON
Inactive user → 403 JSON
Suspended org → 403 JSON, except allowed billing/support routes
Success → PlatformContext
```

## 8.3 API module context helper

Required helper:

```ts
await sdk.auth.requireApiModuleContext(request, orgSlug, moduleId)
```

Behavior:

```txt
Unauthenticated → 401 JSON
Wrong org → safe 404 JSON
Module disabled → safe 404 JSON
Success → PlatformContext with module access proven
```

Permission checks still happen separately.

---

# 9. Organization Membership Rule

`orgSlug` is a locator, not authorization.

This is not enough:

```txt
Organization exists with slug = acme
```

The platform must verify:

```txt
current user belongs to organization with slug = acme
```

MVP rule:

```ts
user.orgId === org.id
```

If false, the response should avoid revealing whether the organization exists.

Recommended response:

```json
{
  "data": null,
  "error": {
    "code": "ORG_NOT_FOUND",
    "message": "Organization not found."
  }
}
```

HTTP status:

```txt
404 Not Found
```

This prevents organization enumeration and cross-tenant route probing.

---

# 10. User Active / Suspended Behavior

## 10.1 Inactive user

If `User.isActive === false`, the user should not access normal platform routes.

API behavior:

```txt
403 FORBIDDEN
```

Page behavior:

```txt
blocked account page or logout + message
```

## 10.2 Suspended organization

If `Organization.isActive === false` or subscription status is suspended, normal modules should be blocked.

Allowed routes may include:

```txt
billing resolution
support contact
account status page
logout
```

Suspended organizations must not continue normal business operations.

## 10.3 Deleted user records

User records should generally not be hard-deleted while Supabase Auth users remain active.

If a user is removed from an organization:

```txt
set User.isActive = false
remove or deactivate sessions if supported
retain auditability where applicable
```

Hard deletion requires a separate data deletion policy.

---

# 11. Password Policy

## 11.1 MVP password minimum

OneDayOS should enforce at least:

```txt
minimum 10 characters
```

Do not require arbitrary complexity rules such as mandatory symbols, uppercase, and numbers unless there is a specific reason. Length and password manager compatibility are more important.

## 11.2 Recommended password UX

Registration and user creation should encourage:

```txt
long passphrases
password managers
unique passwords
```

## 11.3 Password reset

Password reset should be handled through Supabase Auth.

The app should provide a branded password reset flow later, but the reset token logic belongs to Supabase Auth.

Password reset completion must redirect to a safe app route.

## 11.4 Admin-created users

If an admin creates a staff user, the preferred future flow is:

```txt
admin creates user
server creates auth user without exposing password
user receives invite/reset link
user sets own password
```

Avoid admins manually assigning reusable passwords.

---

# 12. Email Confirmation Policy

## 12.1 Founder/operator-created first admin

For B2B onboarding, the first admin may be confirmed immediately by the server-owned registration/provisioning route.

This is acceptable because the account is operator-provisioned.

## 12.2 Public self-service sign-up

If public self-service sign-up exists later, email confirmation should be required unless a founder-approved ADR says otherwise.

## 12.3 Staff invites

Future staff invites should use email-based invite or password reset flows.

Staff users should prove control of their email before using the platform.

---

# 13. Multi-Factor Authentication

## 13.1 Infrastructure MFA is required

OneDayOS-owned infrastructure accounts must use MFA.

This applies to:

```txt
Supabase organization owners
Vercel owners
GitHub owners
domain registrar
billing/payment account
email account used for recovery
```

## 13.2 App-user MFA is deferred

MFA for client application users is deferred for MVP.

Reason:

```txt
adds onboarding complexity
adds support burden
requires recovery process
requires role/plan decisions
not needed for every Philippine SME at launch
```

## 13.3 Future app-user MFA candidates

MFA should be reconsidered for:

```txt
OneDayOS internal support users
client admin users
enterprise clients
high-risk modules
financial approval actions
export-heavy roles
```

## 13.4 MFA must not be hacked into modules

If MFA becomes required, it should be a Kernel/Auth capability, not a module-specific behavior.

---

# 14. Service Role Key Rules

The Supabase service role key is extremely sensitive.

It bypasses normal client-side security expectations and must be treated as a production secret.

## 14.1 Allowed locations

Allowed only in:

```txt
server-only Kernel auth code
server-only provisioning scripts
secure admin-only maintenance scripts
```

## 14.2 Forbidden locations

Forbidden in:

```txt
client components
browser bundles
module code
module manifests
public environment variables
logs
AI prompts
Markdown examples with real values
committed files
```

## 14.3 Naming rule

Only environment variables prefixed with `NEXT_PUBLIC_` are available to the browser.

The service role key must never use `NEXT_PUBLIC_`.

Correct:

```txt
SUPABASE_SERVICE_ROLE_KEY=...
```

Forbidden:

```txt
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...
```

## 14.4 Service role access through SDK

Business modules must not access Supabase service-role clients.

If a module needs user provisioning, storage signing, or other privileged behavior later, it must call an approved SDK/server capability.

---

# 15. Cookie and Session Security

## 15.1 Use official cookie integration

Use Supabase SSR helpers with Next.js cookies.

Do not hand-roll auth cookie handling.

## 15.2 Same-origin app assumption

MVP assumes OneDayOS APIs are used by the OneDayOS web app from the same origin.

Do not expose a public third-party API in MVP.

## 15.3 CSRF posture

Because browser sessions use cookies, state-changing API requests should be protected by same-origin assumptions.

MVP requirements:

```txt
no cross-origin API access
no wildcard CORS
mutating routes accept JSON only
validate Origin/Host for sensitive mutations where practical
reject client-supplied orgId
validate Zod bodies strictly
require PlatformContext
require permission
```

A formal CSRF token system may be added later if OneDayOS exposes cross-origin APIs or complex embedded flows.

## 15.4 No token in URLs

Forbidden:

```txt
?access_token=...
?refresh_token=...
?session=...
```

Auth tokens must never appear in URLs, logs, browser history, support screenshots, or analytics.

---

# 16. API Auth Contract

Every protected API must use the Kernel API contract.

Required response shape:

```ts
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta?: Record<string, unknown>
}
```

Required auth-related errors:

```txt
UNAUTHENTICATED → 401
FORBIDDEN → 403
ORG_NOT_FOUND → 404
USER_INACTIVE → 403
ORG_SUSPENDED → 403
MODULE_NOT_FOUND → 404
```

## 16.1 API auth failure example

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

## 16.2 Wrong organization example

```json
{
  "data": null,
  "error": {
    "code": "ORG_NOT_FOUND",
    "message": "Organization not found."
  }
}
```

Do not return:

```txt
This org exists but you are not a member.
```

That leaks tenant existence.

---

# 17. Route Rules

## 17.1 Auth pages

Auth pages:

```txt
/login
/register              // optional / founder-approved
/forgot-password       // future
/reset-password        // future
```

## 17.2 Platform pages

Tenant-scoped pages:

```txt
/[orgSlug]/dashboard
/[orgSlug]/objects/products
/[orgSlug]/inventory/stock-levels
/[orgSlug]/settings/users
```

Every `orgSlug` route must create verified org context.

## 17.3 APIs

Kernel auth APIs:

```txt
/api/kernel/auth/register
/api/kernel/auth/me
/api/kernel/auth/logout       // optional wrapper
/api/kernel/auth/password-reset // future
```

Tenant APIs:

```txt
/api/orgs/[orgSlug]/objects/products
/api/orgs/[orgSlug]/inventory/stock-levels
/api/orgs/[orgSlug]/settings/users
```

Forbidden:

```txt
/api/[module]?orgId=...
/api/kernel/users/[id] for current-user lookup
/api/orgs?id=...
```

---

# 18. Logout

Logout should use the Supabase browser client:

```ts
await supabase.auth.signOut()
```

After logout:

```txt
redirect to /login
refresh app state
clear client-side cached user data
```

Server-side logout endpoints may be added for consistency, but the client must not keep stale user context after sign-out.

---

# 19. Account Recovery and Support

## 19.1 Client user password recovery

Password recovery should use Supabase Auth reset mechanisms.

Support staff should not ask users for passwords.

Support staff should not manually set weak temporary passwords unless there is a documented emergency procedure.

## 19.2 Lost admin access

If a client loses their only admin account, founder/operator recovery may be required.

Recovery process must verify client identity through an out-of-band business process.

Do not give admin access based only on an email request.

## 19.3 Last admin protection

The platform must prevent accidental removal or deactivation of the last admin in an organization.

This was defined in the Users/Roles/Permissions document and is repeated here because it affects auth recovery.

---

# 20. Infrastructure Account Security

The OneDayOS Supabase organization is infrastructure, not a client tenant.

Clients do not receive Supabase dashboard access in MVP.

Infrastructure security requirements:

```txt
company-owned Supabase organization
at least two trusted owners
MFA enabled for owners
least-privilege team access
no shared logins
service role key protected
billing payment method maintained
recovery email controlled by company
production and staging separated
```

This belongs partly to Deployment/Operations, but it affects auth security because infrastructure account compromise can compromise many client tenants.

---

# 21. Auth Logging

Authentication-related events should be logged carefully.

Allowed logs:

```txt
login success/failure count
registration success/failure
user provisioning success/failure
password reset requested
account disabled
role assignment changed
suspicious repeated failures
```

Do not log:

```txt
passwords
access tokens
refresh tokens
service role keys
full session cookies
password reset tokens
raw Supabase auth links
```

Audit Log Service is deferred, so initial logs may be application logs. Future audit integration should consume safe auth/security events.

---

# 22. Auth Events

Auth/security events should use the `kernel` namespace.

Examples:

```txt
kernel.user.created
kernel.user.activated
kernel.user.deactivated
kernel.user.login_succeeded
kernel.user.login_failed
kernel.user.password_reset_requested
kernel.user.role_assigned
kernel.user.role_removed
```

Do not emit events with sensitive payloads.

Allowed payload style:

```json
{
  "userId": "user_123",
  "reason": "admin_deactivated"
}
```

Forbidden payload style:

```json
{
  "password": "...",
  "accessToken": "...",
  "refreshToken": "...",
  "fullSession": { }
}
```

Whether login success/failure becomes persisted audit data is deferred.

---

# 23. Rate Limiting and Abuse Controls

## 23.1 MVP baseline

Supabase Auth provides authentication endpoint protections, but OneDayOS should still avoid exposing risky custom auth endpoints without controls.

High-risk custom endpoints:

```txt
/api/kernel/auth/register
/api/kernel/auth/password-reset
/api/kernel/auth/invite
```

## 23.2 Registration exposure

If `/api/kernel/auth/register` is public, it needs abuse controls.

MVP safer option:

```txt
registration disabled publicly
or founder/operator-only provisioning
or invite-only registration
```

## 23.3 Future app-level rate limiting

Future rate limiting candidates:

```txt
login attempts per IP/email
registration attempts per IP
password reset requests per email
invite sends per admin
AI support requests
export requests
```

Rate limiting should be added through a Platform/Kernal API concern, not module-local hacks.

---

# 24. Forbidden Patterns

Claude and engineers must not implement these patterns.

## 24.1 Direct client registration through Supabase

```ts
await supabase.auth.signUp(...)
```

Forbidden for OneDayOS organization/user creation.

## 24.2 API route using redirect auth

```ts
await requireAuth()
```

Forbidden if `requireAuth()` redirects.

Use API-safe auth helpers.

## 24.3 Current user by arbitrary ID

```txt
GET /api/kernel/users/[id]
```

Forbidden for current-user lookup.

Use:

```txt
GET /api/kernel/auth/me
```

## 24.4 Auth metadata as permission source

Forbidden:

```ts
const role = session.user.user_metadata.role
```

Use Prisma roles and permissions through SDK.

## 24.5 Client-supplied org identity

Forbidden:

```json
{
  "orgId": "org_123"
}
```

Tenant identity comes from:

```txt
session + orgSlug + verified PlatformContext
```

## 24.6 Module auth shortcuts

Forbidden:

```ts
if (user) createRecord()
```

Required:

```txt
user authenticated
org context verified
module enabled
permission checked
input validated
service called with PlatformContext
```

## 24.7 Supabase dashboard access for clients

Clients are application users, not infrastructure users.

Do not invite normal clients to the Supabase dashboard in MVP.

## 24.8 FastAPI auth backend

Do not add FastAPI, Python auth services, or a second backend auth runtime for the restarted core platform.

---

# 25. Required Implementation Shape

Recommended server SDK auth surface:

```ts
sdk.auth.getSession()
sdk.auth.requirePageAuth()
sdk.auth.requireApiAuth(request)
sdk.auth.requirePageOrgContext(orgSlug)
sdk.auth.requireApiOrgContext(request, orgSlug)
sdk.auth.requireApiModuleContext(request, orgSlug, moduleId)
sdk.auth.getCurrentUserContext()
```

Recommended client SDK auth surface:

```ts
sdkClient.auth.signInWithPassword(input)
sdkClient.auth.signOut()
sdkClient.auth.getMe()
```

The client SDK must not expose service-role operations.

---

# 26. Testing Requirements

Auth security tests are mandatory.

## 26.1 Registration tests

```txt
valid registration creates Supabase user + Organization + User + Subscription + Admin role
Prisma failure rolls back Supabase user
invalid body returns 400 JSON
duplicate email returns safe error
client-supplied role/permission/orgId is rejected
```

## 26.2 Login/current-user tests

```txt
login succeeds with valid credentials
/api/kernel/auth/me returns current user from session
/api/kernel/auth/me does not accept userId param
unauthenticated /me returns 401 JSON
inactive user returns blocked response
```

## 26.3 API auth tests

```txt
unauthenticated protected API returns 401 JSON
unauthenticated protected API does not redirect
unauthenticated protected API does not return HTML
expired session returns 401 JSON
```

## 26.4 Tenant context tests

```txt
Org A user can access Org A route
Org A user cannot access Org B route
Org A user cannot access Org B API
wrong org returns safe 404 JSON
client-supplied orgId is rejected
```

## 26.5 Module context tests

```txt
enabled module + permission succeeds
disabled module returns safe 404
missing permission returns 403
admin wildcard still requires module enabled
```

## 26.6 Infrastructure secret tests / checks

```txt
service role key never appears in browser bundle
service role key never uses NEXT_PUBLIC prefix
modules do not import service-role client
client components do not import @/sdk/server
```

---

# 27. Acceptance Criteria

This document is satisfied when the restarted build has:

```txt
[ ] Supabase Auth is the only identity provider in MVP
[ ] Prisma User.id equals Supabase auth user id
[ ] Registration is server-owned
[ ] Client never calls supabase.auth.signUp for org/user creation
[ ] Registration creates org/user/subscription/admin role in one logical flow
[ ] Supabase auth user is rolled back if Prisma transaction fails
[ ] Login redirects using /api/kernel/auth/me, not /api/kernel/users/[id]
[ ] Page auth helper redirects only for pages
[ ] API auth helper returns 401 JSON for APIs
[ ] No protected API returns redirect HTML for auth failure
[ ] PlatformContext helpers verify org membership
[ ] Wrong-org access returns safe 404
[ ] Inactive users are blocked
[ ] Suspended orgs are blocked except allowed routes
[ ] Service role key is server-only
[ ] No auth tokens are stored manually in localStorage
[ ] Client-supplied orgId is rejected
[ ] Module routes do not treat auth as authorization
[ ] Auth security tests cover registration, API auth, org context, and module context
[ ] Architecture check blocks forbidden auth patterns
```

---

# 28. Claude Implementation Rules

When Claude implements auth security, use this prompt framing:

```md
You are implementing OneDayOS Auth Security.

Authoritative documents:
- 04-kernel/01-authentication.md
- 04-kernel/02-organizations-tenancy.md
- 04-kernel/08-kernel-api-contracts.md
- 05-sdk/03-sdk-auth-permissions.md
- 13-security/00-security-model.md
- 13-security/01-auth-security.md
- 13-security/08-production-readiness-gate.md
- 13-security/09-security-stabilization-new-build-spec.md

Rules:
- Do not let client call supabase.auth.signUp for org/user creation.
- Do not use redirecting auth helpers in API routes.
- Do not create /api/kernel/users/[id] for current-user lookup.
- Use /api/kernel/auth/me for current session lookup.
- Use verified PlatformContext for org/module APIs.
- Reject client-supplied orgId.
- Return JSON { data, error } only from APIs.
- Add tests for 401 JSON, wrong-org denial, and auth/Prisma sync rollback.
- Do not add FastAPI or a second backend auth runtime.
```

Claude must stop and ask for architectural review if it finds ambiguity around registration, org membership, service-role use, or session handling.

---

# 29. Non-Goals

This document does not implement:

```txt
public self-service sign-up marketing funnel
OAuth / Google / Microsoft login
enterprise SSO
app-user MFA
full invite system
passwordless login
magic links
SCIM provisioning
cross-org users
support impersonation
session management dashboard
risk-based authentication
device management
```

These may be added later through ADRs and dedicated implementation documents.

---

# 30. Final Rule

```txt
A logged-in user is not enough.
Only verified PlatformContext is trusted.
```

