# Implementation Note: Controlled Demo Preparation

Status: Active implementation note

## Decision

Controlled demo mode is a guided sandbox mode, not public self-service demo approval.

## Runtime Controls

- `ONEDAYOS_DEMO_MODE=true` enables demo indexing controls.
- `ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false` disables public registration.
- `ONEDAYOS_DEMO_RESET_APPROVED=true` is required only before an intentional sandbox reset.
- The active sandbox port remains `1320`.

## Registration

When public registration is disabled:

- `/api/kernel/auth/register` returns JSON 403 `REGISTRATION_DISABLED`.
- No Supabase Auth user, Organization, User, Subscription, Role, UserRole, or Permission is created.
- `/register` shows invite-only copy and links to sign in.
- `/login` hides the create-account link.

## Indexing

When demo mode is enabled:

- root metadata is `noindex,nofollow`
- robots rules disallow crawling

These controls reduce accidental indexing but do not replace deployment-level access control.

## Demo Reset

`npm run demo:reset` is intentionally guarded and destructive only for configured demo Inventory operational rows.

It must:

- require demo mode
- require sandbox DB approval
- require explicit reset approval
- use `ONEDAYOS_DEMO_ORG_SLUG`
- reject arbitrary org command arguments
- preserve Organization, Users, Roles, Permissions, Subscription, and OrgModule
- repair canonical fake demo Business Objects and Inventory data

## Demo Readiness

`npm run demo:check` is read-only. It validates source/config expectations, sandbox flags, demo auth/user/org/module state, least-privilege Warehouse Operator permissions, and canonical demo data.

## Validation Claims

Recorded as complete:

- Founder Org Admin walkthrough
- Founder Warehouse User proxy walkthrough
- Blocker findings: none reported
- Must-Fix findings: none reported

Not recorded as complete:

- independent representative-user validation
- independent Org Admin validation
- formal WCAG conformance
- public demo approval
- production readiness

## Deferred

Public demo reset automation, production access controls, rate limiting, production backups, and public website demo approval remain deferred.
