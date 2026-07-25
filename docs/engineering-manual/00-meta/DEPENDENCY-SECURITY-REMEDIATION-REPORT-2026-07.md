# Dependency Security Remediation Report

## Status

Reopened on 2026-07-25: the production audit is clean, but the full high/moderate audit is blocked
by the stable lint-stack compatibility boundary documented in the V2-6B addendum below.

The original approved dependency-only package was complete and verified on 2026-07-23. It removed
all findings reported at that time without changing application behavior, the Prisma schema,
migrations, or V2 scope.

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

## V2-6B Acceptance-Gate Remediation — 2026-07-25

Status: Production clean; one approved time-bounded dev-only lint-tooling exception.

The production audit is clean after these minimal changes:

- `@tailwindcss/postcss` and `tailwindcss` moved together from `4.3.2` to `4.3.3`;
- exact `@tailwindcss/postcss@4.3.3`, `vite@8.1.3`, and existing `next@16.2.11`
  parent scopes resolve `postcss@8.5.18`;
- exact `@prisma/dev@0.24.14` resolves `valibot@1.4.2` while preserving the prior
  `find-my-way@9.7.0` decision;
- `exceljs@4.4.0` remains pinned, while its existing parent scope now resolves
  `archiver@8.0.0`, `unzipper@0.12.5`, and the prior `uuid@11.1.1`.

The ExcelJS parent cannot naturally select safe descendants because `4.4.0` is the latest release
and declares Archiver 5 plus Unzipper 0.10. Archiver 8 and Unzipper 0.12 retain the APIs exercised
by OneDayOS's repeated XLSX write/read compatibility suite. ExcelJS is listed in Next's
`serverExternalPackages` because Unzipper exposes optional archive transports through dynamic
requires; externalizing the already server-only adapter prevents Turbopack from resolving unused
optional transports such as the AWS S3 client. Removal conditions are a future
ExcelJS release that natively selects patched descendants, followed by the same export, build,
audit, and runtime gates.

After those changes:

| Audit | Result |
| --- | --- |
| Production moderate | Pass; 0 findings |
| Full high | Fail; 9 high package entries |
| Full moderate | Fail; the same 9 high entries |

The remaining entries all fan out from GHSA-mh99-v99m-4gvg through `minimatch@3.1.5` used by
ESLint 9 and the lint plugins shipped by `eslint-config-next@16.2.11`.

Founder decision Prompt 50 accepts only this exact development-tooling graph through 2026-08-31.
The required policy checker rejects any other finding, changed metadata/root/version, production
or direct occurrence, critical severity, or expiry. Raw full audit remains nonzero and is not
reported as clean. Production dependency audit: clean. Development audit: one approved,
time-bounded lint-tooling exception.

Two apparent registry paths were rejected after direct compatibility checks:

1. ESLint `10.8.0` clears ESLint's own old Minimatch dependency, but current
   `eslint-plugin-import@2.32.0`, `eslint-plugin-jsx-a11y@6.10.2`, and
   `eslint-plugin-react@7.37.5` reject ESLint 10 in their peer ranges. `npm ls --all` reports an
   invalid peer tree, which violates the acceptance gate.
2. Forcing `brace-expansion@5.0.8` beneath Minimatch 3 is API-incompatible. Brace Expansion 1
   exports a callable CommonJS function; Brace Expansion 5 exports an object containing `expand`.
   Minimatch 3 calls the required module directly as a function.

No broad override, vulnerable downgrade, audit suppression, `npm audit fix`, or forced install was
used. The safe stopping condition is to wait for a stable coherent Next lint stack whose plugins
accept ESLint 10 or natively use a patched compatible Minimatch/Brace Expansion chain. An
independently reviewed compatibility fork would require a separate authorization.

Because Prompt 49 requires all three audit thresholds to pass before database work, no disposable
migration rehearsal was started.

Compatibility verification for the accepted partial remediation passes:

- clean `npm ci` and `npm ls --all` with no invalid or unmet peer state;
- 14 focused ExcelJS/export tests, including repeated XLSX write/read;
- 64 test files / 418 tests;
- 5 accessibility files / 18 tests;
- Prisma validation/generation, typecheck, lint, architecture, generated, UX, and environment
  checks;
- standalone production build and `npm run check:all`;
- read-only controlled `demo:check`.

No migration, backfill, demo reset, commit, tag, or `.env.local` change occurred.
