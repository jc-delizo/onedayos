# OneDayOS — Dependency Security Remediation Package 2026-07

V2-1 has passed automated gates and authenticated acceptance review with no UI regression found.

V2-2 remains blocked because the dependency audit reports production-capable and development/tooling advisories, including high-severity findings.

The Founder authorizes this **Dependency Security Remediation Package only**.

Do not implement V2-2 or any later Inventory Demo V2 feature.

## Package Goal

Remediate the current dependency advisories through minimal, coherent, non-breaking upgrades while preserving:

- Next.js 16 architecture
- React 19
- TypeScript 6
- Prisma 7 with the PostgreSQL driver adapter
- Node 24 support
- OneDayOS security boundaries
- V2-1 UI and information architecture
- controlled-demo runtime behavior
- all existing tests and gates

Target outcomes:

```text
npm audit --omit=dev --audit-level=moderate
→ exit 0

npm audit --audit-level=high
→ exit 0
```

Preferred outcome:

```text
npm audit --audit-level=moderate
→ exit 0
```

If a remaining advisory cannot be safely remediated without a breaking major change, stop and report it for Founder review rather than using `--force`.

## Current Remediation Candidates

Treat these as minimum candidates to verify against the live dependency tree and current official advisories:

```text
next
  affected: versions below the patched 16.2.11 for the current reported advisory
  candidate target: 16.2.11

sharp
  affected: versions below 0.35.0 for the current reported advisory
  candidate target: a compatible patched 0.35.x release
  verify the current stable release before installation

postcss
  affected: versions below 8.5.10 for the current reported advisory
  candidate minimum: 8.5.10

Prisma family
  update coherently on one compatible Prisma 7 release line
  candidate current line to verify: 7.9.x
```

Do not blindly install these versions without checking:

- `package.json`
- `package-lock.json`
- `npm audit --json`
- `npm ls`
- official package/advisory data at implementation time
- Node 24 compatibility
- Next.js 16 compatibility
- peer dependencies

## Primary Authority

Read first:

- `docs/engineering-manual/00-meta/DEPENDENCY-AUDIT-TRIAGE-2026-07.md`
- `docs/engineering-manual/00-meta/V2-1-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/02-architecture/04-technology-baseline.md`
- `docs/engineering-manual/13-security/08-production-readiness-gate.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/15-deployment-operations/00-environments.md`
- `docs/engineering-manual/15-deployment-operations/01-vercel-deployment.md`
- `docs/engineering-manual/15-deployment-operations/05-error-handling.md`

Also inspect:

- `.nvmrc`
- `package.json`
- `package-lock.json`
- `next.config.*`
- `prisma.config.ts`
- `prisma/schema.prisma`
- `.github/workflows/ci.yml`

If the remediation conflicts with the frozen technology baseline, stop and report the conflict.

## Absolute Scope

### Allowed

- update direct dependency versions
- update compatible transitive resolutions
- update `package-lock.json`
- add narrowly scoped npm `overrides` only when the parent package cannot yet resolve a patched compatible transitive version
- update Prisma packages coherently
- update dependency-related tests/config only when required for compatibility
- update the dependency triage document
- create a remediation report
- add a temporary regression test for a dependency-driven compatibility issue
- update CI only if a dependency command requires a stable supported adjustment

### Forbidden

Do not:

- run `npm audit fix`
- run `npm audit fix --force`
- downgrade Next.js
- downgrade React
- switch from Next.js
- migrate to a different ORM
- change Prisma schema
- create or run migrations
- change application behavior unless a dependency compatibility fix is unavoidable
- implement V2-2 Data Table features
- install TanStack Table
- install Radix Dialog
- install Recharts
- install ExcelJS
- implement charts, modals, exports, caching, accents, or Inventory V2 transactions
- change Inventory services/APIs/business logic
- change authentication architecture
- change tenant/permission behavior
- create new modules
- resume website asset production
- modify `.env.local`
- claim production readiness

## Repository Safety

Before work:

1. Run `git status --short`.
2. Record current changed/untracked files.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Do not restore historical implementation files.
5. Do not create a commit unless separately instructed.
6. Stop the running Next server before changing dependencies.
7. Do not leave multiple servers on port 1320.

## Required Runtime

This package must be installed and verified under the repository-supported runtime:

```text
Node >=24 <25
```

Run:

```bash
node --version
npm --version
```

If Node 24 is not active:

- use the repository’s `.nvmrc`/available version manager to switch to Node 24
- if Node 24 cannot be activated, stop before changing dependencies and report the blocker

Do not treat successful Node 22 tests as sufficient for dependency remediation.

# Phase 1 — Reproduce and Map the Audit

Before changing versions, run and save sanitized outputs under `/tmp`:

```bash
npm audit --json > /tmp/onedayos-audit-before.json || true
npm audit --omit=dev --json > /tmp/onedayos-audit-prod-before.json || true
npm audit --audit-level=high
npm outdated || true
npm ls next react react-dom sharp postcss prisma @prisma/client @prisma/adapter-pg pg hono fast-uri brace-expansion --all
```

Record:

- direct package
- transitive dependency path
- production versus dev-only
- installed version
- affected range
- patched range
- available parent-package fix
- whether the current app uses the vulnerable behavior

Do not print secrets.

Confirm the audit findings against:

```text
DEPENDENCY-AUDIT-TRIAGE-2026-07.md
```

If the live audit materially differs, update the triage before remediation.

# Phase 2 — Next.js Remediation

## Required action

Upgrade the direct Next dependency to the smallest compatible patched Next 16 release that resolves all current Next advisories.

Expected candidate:

```text
next@16.2.11
```

Use an exact version unless the repository’s established dependency policy requires another deterministic format.

Do not upgrade to a new major.

Do not downgrade.

## Verify compatibility

After the Next update:

- inspect peer dependency output
- verify React 19 remains supported
- verify TypeScript/ESLint integration
- verify App Router routes
- verify `next build`
- verify `next start -p 1320`
- verify proxy/middleware behavior
- verify protected pages still perform server-side auth/PlatformContext checks
- verify APIs still return JSON 401/403 rather than HTML redirects

The application must not rely solely on middleware/proxy authorization.

# Phase 3 — `sharp` Remediation

Inspect why `sharp` is installed:

- direct dependency
- Next optional/image dependency
- another transitive path

Preferred order:

1. Allow the patched Next version and clean install to resolve a safe `sharp`.
2. If the resolved version remains vulnerable, determine whether a compatible patched `sharp` 0.35.x can be selected safely.
3. Use a narrowly scoped override only if necessary and supported.
4. Do not add a broad override that affects unrelated packages.
5. Verify native binary installation on Node 24 and the target Linux environment.
6. Verify build/start and any current `next/image` usage.

Target:

```text
sharp >=0.35.0
```

Prefer the current compatible patched 0.35.x release found at implementation time.

Document whether OneDayOS currently processes untrusted uploaded images. Even if exposure is currently low, remediate the vulnerable package.

# Phase 4 — PostCSS Remediation

Preferred order:

1. Let the patched Next/Tailwind dependency graph resolve a patched PostCSS.
2. Inspect all remaining PostCSS instances:

```bash
npm ls postcss --all
```

3. Ensure every production-capable PostCSS instance is:

```text
>=8.5.10
```

4. If a vulnerable nested instance remains:
   - identify its parent
   - prefer upgrading the parent
   - use a narrowly scoped override only if compatibility is verified
   - do not override across incompatible major ranges

Verify:

- Tailwind CSS compilation
- global CSS
- production build
- Light/Dark/System styles
- OneDayOS Compact token checks

OneDayOS does not currently accept arbitrary user CSS; preserve that boundary.

# Phase 5 — Prisma/Tooling Remediation

Prisma packages must remain coherent.

Inspect direct versions:

```bash
npm ls prisma @prisma/client @prisma/adapter-pg --depth=0
```

Upgrade together to one compatible Prisma 7 release line.

Candidate to verify:

```text
prisma@7.9.0
@prisma/client@7.9.0
@prisma/adapter-pg@7.9.0
```

If the current official stable versions differ at implementation time, use a coherent compatible stable set and document the decision.

Also inspect:

- `pg`
- `prisma.config.ts`
- generated client behavior
- seed/provision scripts
- migration commands
- adapter construction
- any Prisma 7 APIs used by tests

Run:

```bash
npm run check:prisma
npx prisma validate
npx prisma generate
```

Do not change the schema merely to satisfy an upgrade.

Do not run migrations.

Do not run demo provisioning unless later smoke verification genuinely requires it; prefer `demo:check`.

## Transitive tooling advisories

Re-run the audit after the coherent Prisma update.

Inspect remaining:

- Hono
- fast-uri
- brace-expansion
- other reported CLI/tooling dependencies

Preferred order:

1. upgrade the direct parent
2. allow lockfile re-resolution
3. use a narrow compatible override only if required
4. avoid adding direct dependencies solely to hide an audit warning
5. distinguish dev-only from runtime accurately

No high-severity advisory may remain unexplained.

# Phase 6 — Lockfile and Install Integrity

After choosing versions:

1. Update `package.json` minimally.
2. Regenerate `package-lock.json` under Node 24.
3. Run a clean deterministic install:

```bash
npm ci
```

4. Verify:

```bash
npm ls --all
```

There must be no invalid or unmet peer dependency state relevant to the application.

Do not edit the lockfile manually.

# Phase 7 — Security and Compatibility Regression

Run all existing gates.

In addition, verify:

## Auth/security

- `/api/kernel/auth/me` unauthenticated returns JSON 401
- registration remains disabled in controlled demo mode
- Warehouse Operator still cannot access Organization
- Shared Records visibility remains permission-aware
- no tenant/permission behavior changed
- no middleware-only authorization dependency was introduced

## V2-1 UI

- App Launcher still shows correct apps by role
- compact headers remain
- explanatory Process Flow remains
- contextual Related Records retain Inventory context
- Product Settings remains absent from top-level nav and contextually accessible
- Light/Dark/System persist

## Build/runtime

- production build passes
- fresh `next start` works on port 1320
- public/local `/`, `/login`, `/register` smoke checks pass
- `demo:check` passes

Do not change V2-1 visuals unless a dependency regression requires a minimal fix.

# Phase 8 — Audit Acceptance Thresholds

Run:

```bash
npm audit --json > /tmp/onedayos-audit-after.json || true
npm audit --omit=dev --json > /tmp/onedayos-audit-prod-after.json || true
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

## Required to unblock V2-2

At minimum:

```text
npm audit --omit=dev --audit-level=moderate
→ passes

npm audit --audit-level=high
→ passes
```

Preferred:

```text
npm audit --audit-level=moderate
→ passes
```

If full moderate audit still fails only on dev/tooling advisories:

- every remaining advisory must be documented
- no safe compatible patch may be available
- no high advisory may remain
- Founder approval is required before V2-2

Do not suppress or delete audit scripts.

# Documentation

## Update triage

Update:

```text
docs/engineering-manual/00-meta/DEPENDENCY-AUDIT-TRIAGE-2026-07.md
```

For every prior advisory record:

- remediated version
- remediation method
- verification result
- residual exposure
- status

## Create remediation report

Create:

```text
docs/engineering-manual/00-meta/
  DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md
```

Required sections:

```text
# Dependency Security Remediation Report

## Status

## Supported Runtime

## Audit Before

## Direct Dependency Changes

## Transitive Dependency Changes

## Next.js Remediation

## Sharp Remediation

## PostCSS Remediation

## Prisma/Tooling Remediation

## Overrides Used

## Compatibility Verification

## Security Regression Verification

## Audit After

## Remaining Advisories

## Risks

## Rollback Plan

## V2-2 Readiness
```

If overrides are used, document:

- exact scope
- why parent upgrade was insufficient
- compatibility evidence
- removal condition

## Update V2-1 acceptance report

Update:

```text
docs/engineering-manual/00-meta/V2-1-ACCEPTANCE-REPORT.md
```

Add the remediation result.

Do not falsely mark Founder visual approval if it has not been explicitly recorded.

# Rollback Strategy

Before changing dependencies, record the current versions.

The package must be revertible through:

- `package.json`
- `package-lock.json`
- dependency-related compatibility files only

No schema/data rollback should be required.

If a candidate upgrade breaks the app:

- revert that candidate cleanly
- do not stack workarounds blindly
- report the blocker
- do not proceed to V2-2

# Verification Commands

Run under Node 24:

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

npm ls next react react-dom sharp postcss prisma @prisma/client @prisma/adapter-pg pg hono fast-uri brace-expansion --all

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

Start the final production server with:

```bash
npm run start
```

on port 1320 after stopping any stale server.

# Final Report Required

Report:

1. Dependency remediation summary.
2. Node/npm versions used.
3. Files inspected.
4. Files created.
5. Files modified.
6. Before/after direct dependency versions.
7. Next.js remediation result.
8. Sharp remediation result and resolved dependency path.
9. PostCSS remediation result and all resolved instances.
10. Prisma package versions and compatibility result.
11. Hono/fast-uri/brace-expansion result.
12. Overrides used, if any.
13. `npm ci` result.
14. Peer/dependency-tree integrity result.
15. Updated full test count.
16. `check:all` result.
17. `demo:check` result.
18. V2-1 UI/security regression result.
19. Production server mode/PID/URL.
20. Before/after audit counts.
21. `npm audit --omit=dev --audit-level=moderate` result.
22. `npm audit --audit-level=high` result.
23. Full moderate audit result.
24. Remaining advisories and classification.
25. Documentation updates.
26. Git diff/status observations.
27. Any deviations from approved scope.
28. Any unresolved security or compatibility risks.
29. Confirmation that no Prisma schema, migrations, V2-2+ feature, charts, modals, exports, Inventory V2 transactions, caching, accent presets, website assets, new modules, or Platform Services were added.
30. Whether the Dependency Security Remediation Package is complete.
31. Whether V2-2 is unblocked or still requires Founder review.

Stop after dependency remediation.

Do not proceed to V2-2 without Founder approval, even if all audits pass.
