# V2-3 Dependency Gate Report

## Status

V2-3 Dependency Gate Passed
Prompt 38 May Resume

## Trigger

Prompt 38 correctly stopped when a fresh npm audit reported five high-severity package entries after adding the approved exact `@radix-ui/react-dialog@1.1.21` dependency. The findings were unrelated to Radix and represented two newly published advisories repeated through parent/wrapper package entries.

## Runtime

- Node: `24.18.0`
- npm: `11.16.0`
- Required engine lines remain Node `>=24 <25` and npm `>=11 <12`.

## Audit Before

Both full and production audit JSON reported:

```text
0 critical
5 high
0 moderate
0 low
```

The five entries were:

- `next` through `postcss`
- `postcss`
- `prisma` through `@prisma/dev`
- `@prisma/dev` through `find-my-way`
- `find-my-way`

The before-state JSON is saved at:

- `/tmp/onedayos-v2-3-audit-before.json`
- `/tmp/onedayos-v2-3-audit-prod-before.json`

## PostCSS Advisory and Remediation

GHSA-6g55-p6wh-862q / CVE-2026-45623 is a high-severity arbitrary-file-read and information-disclosure issue through attacker-controlled `sourceMappingURL` comments.

- Live affected range: `postcss <=8.5.11`
- Live patched floor: `8.5.12`
- Installed before: `next@16.2.11 -> postcss@8.5.10`
- Installed after: `next@16.2.11 -> postcss@8.5.18`

The prompt-authorized `8.5.18` target is above the live patched floor. Other active PostCSS copies remain `8.5.16`, which is also above that floor.

## find-my-way Advisory and Remediation

GHSA-c96f-x56v-gq3h / CVE-2026-47219 is a high-severity remotely triggerable HTTP/2 denial of service.

- Affected range: `find-my-way <=9.6.0`
- Patched version: `9.7.0`
- Installed before: `prisma@7.9.0 -> @prisma/dev@0.24.14 -> find-my-way@9.6.0`
- Installed after: `prisma@7.9.0 -> @prisma/dev@0.24.14 -> find-my-way@9.7.0`

`find-my-way` was not added as a direct dependency.

## Next.js Decision

Next `16.2.11` and matching `eslint-config-next@16.2.11` were retained. Live registry data showed no newer stable Next 16 patch, no current direct Next advisory required a framework update, and the existing parent-scoped override safely resolves the patched PostCSS child.

## Prisma Decision

The coherent Prisma family remains:

- `prisma@7.9.0`
- `@prisma/client@7.9.0`
- `@prisma/adapter-pg@7.9.0`

Prisma `7.9.0` was still the latest stable release; only `7.10.0-dev` prereleases existed. Upgrading to a prerelease is forbidden. The narrow tooling-parent override was therefore the safest stable remediation.

## Radix Dialog Decision

`@radix-ui/react-dialog@1.1.21` remains exact. Its React peer range includes React 19, `npm ls` reports no peer conflict, no advisory reaches it, no Radix meta package was added, and no application source imports it yet.

## Overrides Added or Updated

```json
{
  "next@16.2.11": {
    "postcss": "8.5.18",
    "sharp": "0.35.3"
  },
  "@prisma/dev@0.24.14": {
    "find-my-way": "9.7.0"
  }
}
```

The Next override was updated from PostCSS `8.5.10`. The Prisma tooling override is new and targets the exact parent containing the vulnerable exact child pin.

Removal conditions:

- Remove the PostCSS override after an approved stable Next patch natively resolves a patched compatible PostCSS version and all gates are repeated.
- Remove the `find-my-way` override after an approved coherent stable Prisma release resolves `@prisma/dev` with `find-my-way >=9.7.0` and all gates are repeated.

## Clean Install

- `npm install --package-lock-only`: passed, zero vulnerabilities.
- `npm ci`: passed; 647 packages installed and 648 audited.
- `npm ls --all`: passed with no invalid, unmet, or extraneous package state.
- Prisma validate and generate passed with Prisma Client `7.9.0`.

The npm 11 allow-scripts informational warning listed the existing Prisma engines, Prisma CLI, esbuild, and unrs-resolver install scripts. It did not produce an install or integrity failure.

## Application Regression Gates

Passed:

- typecheck
- lint
- 50 test files / 313 tests
- 3 accessibility files / 14 tests
- `check:ux`
- production build
- architecture check
- generated-template check
- environment check
- Prisma check
- `check:all`, including its independent build

One focused governance test was added so `check:ux` recognizes the exact Radix Dialog dependency after the Founder-authorized Prompt 38 exists while continuing to reject later-package dependencies.

Prompt 40 migrated privileged server tooling to the canonical `SUPABASE_SECRET_KEY`, with a validated legacy `SUPABASE_SERVICE_ROLE_KEY` fallback. A non-mutating one-row Admin Auth call succeeded against the configured project, and `npm run demo:check` passed every environment, registration, tenant, role, canonical-data, and Inventory readiness check. No demo reset was needed.

## Audit After

Full and production audit JSON both report:

```text
0 critical
0 high
0 moderate
0 low
```

All required thresholds passed:

- `npm audit --omit=dev --audit-level=moderate`
- `npm audit --audit-level=high`
- `npm audit --audit-level=moderate`

The after-state JSON is saved at:

- `/tmp/onedayos-v2-3-audit-after.json`
- `/tmp/onedayos-v2-3-audit-prod-after.json`

## Remaining Advisories

None reported by npm.

## Risks and Removal Conditions

The overrides must be reviewed with future Next or Prisma upgrades. Audit data can change when advisories are published even when the repository does not change.

The latest production build is running on port 1320. Public page, unauthenticated auth, invite-only registration, and registration-disabled API smoke checks pass.

## Prompt 38 Resume Status

The dependency-security findings are remediated, all npm audit thresholds pass, the Supabase admin credential is verified, `demo:check` passes, and the production runtime is restored.

**V2-3 Dependency Gate Passed. Prompt 38 May Resume.**

This dependency-gate report does not mark V2-3 complete. Prompt 40 separately authorizes resuming the frozen Prompt 38 implementation after this gate.
