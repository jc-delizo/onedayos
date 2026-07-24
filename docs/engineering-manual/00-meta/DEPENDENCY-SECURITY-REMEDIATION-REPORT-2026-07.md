# Dependency Security Remediation Report

## Status

Complete and verified on 2026-07-23. The approved dependency-only package removed all findings from both the full and production npm audits without changing application behavior, the Prisma schema, migrations, or V2 scope.

Founder visual acceptance remains pending and is independent of this technical remediation.

## Supported Runtime

- Required range: Node `>=24 <25`, npm `>=11 <12`.
- Verified runtime: Node `24.18.0` LTS and npm `11.16.0`.
- No repository-supported Node version manager was installed on the host. Verification used the official Node `v24.18.0` Linux x64 distribution in `/tmp`, checked against the official SHA-256 manifest.
- `.nvmrc`, `package.json` engines, and CI remain aligned on Node 24.

## Audit Before

| Audit | Package entries | Severity | Exit |
| --- | ---: | --- | ---: |
| Full `npm audit --json` | 8 | 4 high, 4 moderate | 1 |
| Production `npm audit --omit=dev --json` | 7 | 3 high, 4 moderate | 1 |
| Full `--audit-level=high` | Findings present | High | 1 |

The eight package entries represented fourteen underlying GitHub advisories. Baseline JSON was retained locally at `/tmp/onedayos-audit-before.json` and `/tmp/onedayos-audit-prod-before.json`.

## Direct Dependency Changes

| Package | Before | After | Reason |
| --- | ---: | ---: | --- |
| `next` | 16.2.10 | 16.2.11 | Patched production runtime |
| `eslint-config-next` | 16.2.10 | 16.2.11 | Keep framework lint tooling aligned |
| `prisma` | 7.8.0 | 7.9.0 | Remove vulnerable development-tooling path |
| `@prisma/client` | 7.8.0 | 7.9.0 | Coherent Prisma family |
| `@prisma/adapter-pg` | 7.8.0 | 7.9.0 | Coherent Prisma family |

React `19.2.7`, React DOM `19.2.7`, `pg@8.22.0`, TypeScript `6.0.3`, and all other direct versions were unchanged.

## Transitive Dependency Changes

- `sharp`: `0.34.5 -> 0.35.3` at `next -> sharp`.
- Next-nested `postcss`: `8.4.31 -> 8.5.10`.
- Other PostCSS copies remain patched at `8.5.16` through Tailwind and Vite.
- `@prisma/dev`: `0.24.3 -> 0.24.14`.
- `@hono/node-server`: removed from the dependency tree.
- `@prisma/streams-local`: `0.1.2 -> 0.1.11`.
- `fast-uri`: `3.1.3 -> 3.1.4`.
- ESLint-path `brace-expansion`: `1.1.15 -> 1.1.16`.

## Next.js Remediation

`next` and `eslint-config-next` were upgraded together from `16.2.10` to the compatible security patch `16.2.11`. React 19 peer compatibility remains satisfied. The production build, route generation, `next start`, public routes, authentication boundaries, 278 tests, and authenticated persona review all passed.

No middleware or proxy was added, and authorization remains enforced at server page, service, and API boundaries.

## Sharp Remediation

Next `16.2.11` still declares optional `sharp@^0.34.5`; because a caret range below `1.0.0` cannot select `0.35.x`, the parent patch alone could not remediate the advisory. A parent-scoped override resolves `next -> sharp@0.35.3`.

Under Node 24, requiring sharp succeeded and reported sharp `0.35.3` with libvips `8.18.3`. Clean install, build, and production runtime all passed. OneDayOS still has no untrusted image-upload or image-processing feature.

## PostCSS Remediation

Next `16.2.11` still pins `postcss@8.4.31`, below the patched `8.5.10` floor. A parent-scoped override resolves `next -> postcss@8.5.10`.

The installed tree contains only patched instances:

- `next -> postcss@8.5.10`
- `@tailwindcss/postcss -> postcss@8.5.16`
- `vitest -> vite -> postcss@8.5.16`

Build, CSS processing, UI review, and audit checks passed.

## Prisma/Tooling Remediation

`prisma`, `@prisma/client`, and `@prisma/adapter-pg` were upgraded coherently to `7.9.0`. `prisma validate`, `prisma generate`, `check:prisma`, database-backed tests, `demo:check`, and the production runtime passed.

Prisma `7.9.0` resolves `@prisma/dev@0.24.14`, which no longer depends on Hono. Its updated streams path resolves patched `fast-uri@3.1.4`. The compatible ESLint path was refreshed to `brace-expansion@1.1.16`.

No schema, migration, seed, provisioning, adapter-construction, data, or database change was made. No migration or demo reset/provision command was run.

## Overrides Used

`package.json` contains one parent-scoped override:

```json
{
  "next@16.2.11": {
    "postcss": "8.5.10",
    "sharp": "0.35.3"
  }
}
```

The scope is limited to Next `16.2.11`. It is required because that parent release still publishes a vulnerable exact PostCSS dependency and a sharp range that cannot cross into the patched `0.35.x` line. Compatibility evidence includes a clean Node 24 install, native sharp load, full dependency-tree validation, all repository gates, two production builds, production smoke, and two-role browser review.

Remove each override when a future approved Next patch natively declares a patched compatible version, after repeating this package's install, build, audit, runtime, and persona checks.

The previous `@prisma/dev -> @hono/node-server@1.19.13` override was removed because Prisma no longer contains that dependency path.

## Compatibility Verification

- `npm ci`: passed; 604 packages installed and 605 audited.
- `npm ls --all`: passed with no invalid or unmet dependency state.
- Prisma validation and generation: passed at `7.9.0`.
- Typecheck and lint: passed.
- Tests: 47 files / 278 tests passed.
- Focused accessibility: 2 files / 13 tests passed.
- Architecture, generated-template, environment, UX, and Prisma checks: passed.
- Standalone production build: passed.
- `npm run check:all`: passed, including its independent production build.
- `npm run demo:check`: passed without resetting or provisioning demo data.

## Security Regression Verification

- `/api/kernel/auth/me` without authentication returned JSON HTTP 401.
- `/api/kernel/auth/register` POST returned HTTP 403 with `REGISTRATION_DISABLED`.
- `/register` remained HTTP 200 with invite-only messaging.
- Org Admin retained Inventory, Shared Records, and Organization.
- Warehouse Operator retained permission-aware Inventory and Shared Records access, lacked Customer actions where permission is absent, and received 404 for direct Organization access.
- Warehouse Product and Warehouse lists remained read-only.
- No tenant, permission, schema, service, route, API, or middleware authorization behavior changed.
- App Launcher role filtering, compact operational headers, explanatory Process Flow, Inventory-context Related Records, contextual Inventory Tracking Settings, and Light/Dark/System persistence passed in the production browser review.

## Audit After

| Audit | Package entries | Severity | Exit |
| --- | ---: | --- | ---: |
| Full `npm audit --json` | 0 | None | 0 |
| Production `npm audit --omit=dev --json` | 0 | None | 0 |
| Production `--audit-level=moderate` | 0 | None | 0 |
| Full `--audit-level=high` | 0 | None | 0 |
| Full `--audit-level=moderate` | 0 | None | 0 |

After-state JSON was retained locally at `/tmp/onedayos-audit-after.json` and `/tmp/onedayos-audit-prod-after.json`.

## Remaining Advisories

None reported by npm for the installed lockfile. There are no deferred or accepted advisory findings in this package.

## Risks

- The two Next child overrides must be re-evaluated whenever Next is upgraded.
- npm audit reflects currently published registry advisory data; future disclosures can change the result without a code change.
- Founder visual approval, representative-user validation, and formal keyboard/screen-reader/WCAG review remain pending acceptance activities, not dependency vulnerabilities.

## Rollback Plan

Rollback is limited to `package.json` and `package-lock.json`:

1. Restore Next and `eslint-config-next` to `16.2.10`.
2. Restore the Prisma family to `7.8.0`.
3. Restore the former Prisma/Hono override and remove the Next-scoped overrides.
4. Regenerate/install the matching lockfile under Node 24 and repeat verification.

No schema, migration, data, application-code, or generated source rollback is required. Rollback would restore known advisories and therefore must not be used as an operational resolution without a newly approved security decision.

## V2-2 Readiness

The dependency-security blocker identified by Prompt 34 is cleared: all required audit thresholds and compatibility checks pass. V2-2 is **not authorized by this report** and remains blocked until the Founder explicitly accepts V2-1 visuals and authorizes the next package under the frozen roadmap.

## V2-3 Dependency Gate Hotfix — 2026-07-24

Fresh registry data added two high-severity findings after the previous clean report:

- GHSA-6g55-p6wh-862q / CVE-2026-45623 affected `postcss <=8.5.11`. The existing `next@16.2.11` child override now resolves PostCSS `8.5.18`.
- GHSA-c96f-x56v-gq3h / CVE-2026-47219 affected `find-my-way <=9.6.0`. Prisma `7.9.0` remains the latest stable Prisma release, so the exact tooling parent `@prisma/dev@0.24.14` now resolves `find-my-way@9.7.0` through a narrow override.

`npm ci`, `npm ls --all`, Prisma validate/generate, typecheck, lint, 50 test files / 313 tests, 3 accessibility files / 14 tests, UX/architecture/generated/environment checks, two production builds, `check:all`, and all three audit thresholds passed under Node `24.18.0` and npm `11.16.0`. Full and production audit JSON each report zero findings.

The controlled-demo readiness check did not pass because Supabase Auth rejected the configured service-role credential with HTTP 403 `bad_jwt` (unrecognized ES256 key ID). Prompt 39 forbids modifying `.env.local`; no credential, demo data, schema, migration, API, or UI change was made. Prompt 38 remains paused until the sandbox credential is repaired and `npm run demo:check` passes.
