# OneDayOS — Supabase Admin Key Repair, Demo Gate Recovery, and Prompt 38 Resume

The V2-3 dependency security gate is clean.

Current dependency state:

- `@radix-ui/react-dialog@1.1.21` is installed.
- PostCSS resolves to the patched version.
- `find-my-way` resolves to the patched version.
- Full and production dependency audits report zero vulnerabilities.
- No V2-3 modal source code has been implemented yet.

The remaining blocker is the controlled sandbox admin credential:

```text
npm run demo:check
→ Supabase HTTP 403 bad_jwt
→ unrecognized ES256 key ID
```

The Founder/operator has now replaced the sandbox backend key in `.env.local` with a valid key from the same Supabase project.

This task must:

1. verify the corrected Supabase admin key safely,
2. harden the app to support Supabase’s current opaque secret API keys,
3. restore `demo:check`,
4. restore the latest server on port 1320,
5. then resume and complete Prompt 38 exactly within its frozen V2-3 scope.

## Absolute Secret Rules

Never print:

- Supabase secret keys
- legacy service-role keys
- database URLs
- JWTs
- access tokens
- cookies
- sessions
- passwords

Do not commit `.env.local`.

Do not log more than key presence/type. Do not log any prefix beyond what is strictly necessary; prefer boolean classification.

## Correct Key Model

The canonical server-side key is:

```text
SUPABASE_SECRET_KEY
```

Preferred format:

```text
sb_secret_...
```

For backward compatibility only, the app may fall back to:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Supported backend-key forms:

1. New opaque Supabase secret API key:
   - `sb_secret_...`
2. Legacy long-lived `service_role` API key:
   - only when copied from the same project’s Legacy API Keys dashboard section

Do not accept as the admin API key:

- `sb_publishable_...`
- anon/publishable key
- user session JWT
- Auth access token
- custom ES256 JWT
- JWT signing private/public key
- JWKS URL/content
- a key from another Supabase project

Do not assume every server key is a JWT.

Do not decode or locally verify an opaque `sb_secret_...` key as a JWT.

## Repository Safety

Before work:

1. Run `git status --short`.
2. Preserve all Prompt 31–39 work.
3. Do not reset, restore, delete, or overwrite unrelated files.
4. Do not create a commit unless separately instructed.
5. Keep the final runtime on port `1320`.
6. Use Node 24.

## Phase 1 — Inspect Current Admin-Key Handling

Inspect:

- `.env.example`
- `src/kernel/env/server.ts`
- `src/kernel/env/shared.ts`
- Supabase admin-client helper(s)
- `scripts/check-demo-readiness.ts`
- `scripts/provision-sandbox-demo.ts`
- `scripts/reset-sandbox-demo.ts`
- tests covering server env and demo operations

Report:

- which variable is canonical today
- whether code assumes JWT structure
- whether code validates `role=service_role`
- whether code supports `sb_secret_...`
- whether any admin client uses SSR/cookie session state
- whether any code manually sets an Authorization header
- whether project URL and key are sourced independently

Do not print values.

## Phase 2 — Canonical Admin-Key Resolver

If needed, implement one small server-only resolver, for example:

```ts
getSupabaseAdminApiKey()
```

Resolution order:

```text
SUPABASE_SECRET_KEY
→ SUPABASE_SERVICE_ROLE_KEY compatibility fallback
```

Requirements:

- server-only
- returns no key to client code
- no `NEXT_PUBLIC_` exposure
- accepts valid opaque secret keys
- accepts valid legacy service-role keys as fallback
- rejects publishable/anon-style keys
- does not decode opaque keys as JWT
- does not accept arbitrary ES256 user/custom JWTs as service credentials
- throws a safe configuration error without including the key
- used consistently by registration, provisioning, reset, readiness checks, and admin helpers

If the code currently requires only `SUPABASE_SERVICE_ROLE_KEY`, preserve compatibility but migrate internal naming toward `SUPABASE_SECRET_KEY`.

Update `.env.example` with non-secret placeholders and migration comments if needed.

Do not modify `.env.local`.

## Phase 3 — Dedicated Admin Client

Verify the privileged client uses:

```text
@supabase/supabase-js createClient
```

with:

- the project URL
- the resolved server secret/service-role API key
- no browser cookies
- no user session
- `persistSession: false`
- `autoRefreshToken: false`
- no manually injected user Authorization token

Do not initialize the privileged client through the SSR cookie client.

Keep admin and user-session clients separate.

## Phase 4 — Safe Credential Verification

Without printing the key, verify:

1. project URL is present,
2. resolved admin key is present,
3. key is not a publishable key,
4. key comes from the same project in practice by making a minimal admin Auth call,
5. the admin call succeeds.

Use a harmless operation such as:

```text
auth.admin.listUsers with a one-row page
```

or another non-mutating admin operation supported by the installed SDK.

Do not create, update, or delete a user for this check.

If the call still returns:

```text
bad_jwt
unrecognized ES256 key ID
```

stop and report:

```text
The configured admin key is still not a valid API secret/service-role key for this project.
```

Do not proceed to demo reset or V2-3.

## Phase 5 — Demo Gate Recovery

Once the admin check succeeds, run:

```bash
npm run demo:check
```

It must pass.

Do not run `demo:reset` unless `demo:check` identifies canonical-data drift requiring repair and all reset safety flags are true.

If reset is needed:

```bash
npm run demo:reset
npm run demo:check
```

Do not print secrets.

## Phase 6 — Restore Latest Runtime

Stop any stale process on port 1320.

Run:

```bash
npm run build
npm run start
```

Keep the latest `next start` server running on port 1320.

Verify:

- `/` returns 200
- `/login` returns 200
- `/register` returns 200 with invite-only state
- `/api/kernel/auth/me` returns unauthenticated JSON 401
- registration API remains JSON 403 `REGISTRATION_DISABLED`

## Phase 7 — Update Dependency Gate Report

Update:

```text
docs/engineering-manual/00-meta/V2-3-DEPENDENCY-GATE-REPORT.md
```

Record:

- dependency advisories are remediated
- audit thresholds pass
- Supabase credential blocker is resolved
- `demo:check` passes
- latest server is restored
- Prompt 38 is authorized to resume

Allowed status:

```text
V2-3 Dependency Gate Passed
Prompt 38 May Resume
```

Do not mark V2-3 complete yet.

## Phase 8 — Resume Prompt 38

After every gate above passes, read the complete frozen Prompt 38 V2-3 instructions supplied by the Founder and resume from its implementation phase.

Do not repeat or change its scope.

Implement only V2-3:

- reusable OneDayOS route-modal/dialog wrapper
- Next.js parallel/intercepting routes
- full-page canonical fallbacks
- approved Inventory modal targets
- approved Shared Records create/view/edit targets
- Product Inventory Tracking Settings migration
- permission-aware view/edit behavior
- unsaved-change safeguards
- accessibility tests
- `check:ux` gates
- V2-3 documentation and acceptance report

All Prompt 38 forbidden scope remains forbidden:

- no V2-4 charts
- no Recharts
- no Process Flow Diagram V2
- no export
- no ExcelJS
- no Prisma/schema/migrations
- no Inventory V2 transactions
- no caching
- no accent presets
- no website assets
- no new modules
- no Platform Services

If the full Prompt 38 text is unavailable in the repository/context, stop after the credential/demo-gate recovery and ask the Founder to supply it again. Do not reconstruct or improvise its implementation scope.

## Tests for Admin-Key Compatibility

Add or strengthen tests:

- prefers `SUPABASE_SECRET_KEY`
- falls back to legacy `SUPABASE_SERVICE_ROLE_KEY`
- accepts `sb_secret_...`
- rejects `sb_publishable_...`
- rejects missing key
- does not JWT-decode opaque secret key
- safe errors do not contain key material
- admin client does not use cookies/user session
- demo checker uses the canonical resolver
- provisioning/reset use the canonical resolver
- legacy compatibility remains tested
- no admin key enters a client bundle

## Verification

Under Node 24 run:

```bash
node --version
npm --version
npm ci

npm run typecheck
npm run lint
npm run test:run
npm run check:ux
npm run test:a11y
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm run check:all
npm run demo:check

npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate

git diff --check
git status --short
```

Do not run:

```bash
npm audit fix
npm audit fix --force
```

## Final Report Required

Report:

1. Admin-key blocker summary.
2. Root cause found.
3. Files inspected.
4. Files created.
5. Files modified.
6. Canonical environment variable decision.
7. New secret-key support.
8. Legacy service-role compatibility.
9. Confirmation that no key material was printed.
10. Admin-client architecture.
11. Non-mutating admin verification result.
12. `demo:check` result.
13. Whether `demo:reset` was needed.
14. Runtime server PID/mode/URL.
15. Dependency audit result.
16. Admin-key tests added.
17. Updated full test count.
18. `check:all` result.
19. V2-3 dependency-gate report status.
20. Whether Prompt 38 was available and resumed.
21. If resumed, complete the full Prompt 38 final report requirements.
22. If not resumed, state exactly why and stop after gate recovery.
23. Confirmation that no secret was committed or exposed.
24. Confirmation that no work outside Prompt 38/V2-3 scope occurred.
25. Whether V2-3 is complete or remains incomplete.

Stop immediately if the repaired credential is still invalid.
