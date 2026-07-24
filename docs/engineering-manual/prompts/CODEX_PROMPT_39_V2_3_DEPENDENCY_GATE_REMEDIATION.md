# OneDayOS — V2-3 Dependency Gate Remediation
# PostCSS 8.5.18 + find-my-way 9.7.0 Security Hotfix

Prompt 38 correctly stopped at its mandatory dependency gate.

The V2-3 modal implementation has NOT started.

The only V2-3 change currently made is the exact dependency addition:

```text
@radix-ui/react-dialog@1.1.21
```

A fresh npm audit then surfaced newly published high-severity advisories through:

```text
next@16.2.11
  → postcss@8.5.10

prisma@7.9.0
  → find-my-way@9.6.0
```

This task is a narrowly scoped dependency security remediation package.

Do not implement V2-3 modal source code in this task.

After this package is clean and approved, Prompt 38 may resume from its post-dependency implementation phases.

## Current Security Targets

### PostCSS

Current advisory state to verify from the live registry/advisory database:

```text
Affected: postcss <= 8.5.17
Patched:  postcss 8.5.18
```

At least one newly disclosed high-severity advisory is not fixed by 8.5.10.

### find-my-way

Current advisory state to verify:

```text
Affected: find-my-way <= 9.6.0
Patched:  find-my-way 9.7.0
```

The reported issue is a remotely triggerable denial of service when used with Node HTTP/2.

Do not rely only on this prompt’s version text. Recheck the live official package/advisory data before modifying the lockfile.

## Package Goal

Restore clean dependency gates while preserving:

- Next.js 16.2.11 unless a newer stable patched 16.x release is actually required
- React 19
- TypeScript 6
- Prisma 7.9.0 unless a coherent newer stable Prisma 7 patch is available and clearly safer
- Node 24
- `@radix-ui/react-dialog@1.1.21`
- all V2-1 and V2-2 functionality
- controlled-demo behavior
- all current tests and quality gates

Required outcome:

```text
npm audit --omit=dev --audit-level=moderate
→ exit 0

npm audit --audit-level=high
→ exit 0

npm audit --audit-level=moderate
→ exit 0
```

If these outcomes cannot be reached safely without a breaking or unreviewed change, stop and report the blocker.

## Absolute Scope

### Allowed

- inspect current dependency/advisory data
- update existing narrow npm overrides
- add one narrowly scoped parent override for `find-my-way@9.7.0` if required and compatible
- update a coherent Prisma 7 patch set if an official stable patch already resolves the issue
- update `package.json`
- update `package-lock.json`
- run `npm ci`
- update dependency security documentation
- add focused dependency-integrity tests only if needed
- restore the final production server on port 1320

### Forbidden

Do not:

- implement V2-3 modal components
- create parallel/intercepting routes
- modify application UI
- modify Inventory business logic
- modify APIs
- modify Prisma schema
- create or run migrations
- remove Radix merely to hide unrelated audit findings
- add `find-my-way` as a direct dependency merely to mask its transitive path
- use a broad unscoped override without dependency-path evidence
- upgrade to Next preview/canary
- upgrade to a new Next major
- downgrade Next, React, Prisma, or Node
- run `npm audit fix`
- run `npm audit fix --force`
- implement charts, exports, Inventory V2 transactions, caching, accent presets, or website assets
- add new modules or Platform Services
- modify `.env.local`

## Primary Authority

Read first:

- `docs/engineering-manual/00-meta/DEPENDENCY-AUDIT-TRIAGE-2026-07.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`
- `docs/engineering-manual/00-meta/V2-2-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/03-design-system/17-modal-interaction-standard.md`
- `docs/engineering-manual/13-security/08-production-readiness-gate.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/02-architecture/04-technology-baseline.md`

Inspect:

- `package.json`
- `package-lock.json`
- `.nvmrc`
- `next.config.*`
- `prisma.config.ts`
- `.github/workflows/ci.yml`

If remediation would conflict with the frozen technology baseline, stop and report the conflict.

## Repository Safety

Before work:

1. Run `git status --short`.
2. Record all existing changed/untracked paths.
3. Preserve all Prompt 31–38 work.
4. Do not reset, restore, delete, or overwrite unrelated work.
5. Do not create a commit unless separately instructed.
6. Stop any stale Next server before the final clean install/build.
7. Keep the final server on port `1320`.

## Supported Runtime

Use the repository-supported runtime:

```text
Node >=24 <25
```

Run:

```bash
node --version
npm --version
```

If Node 24 is not active, switch before changing dependency files.

# Phase 1 — Reproduce the New Audit

Save sanitized outputs under `/tmp`:

```bash
npm audit --json > /tmp/onedayos-v2-3-audit-before.json || true
npm audit --omit=dev --json > /tmp/onedayos-v2-3-audit-prod-before.json || true

npm ls next postcss prisma @prisma/client @prisma/adapter-pg find-my-way @radix-ui/react-dialog --all
npm explain postcss
npm explain find-my-way
```

Record:

- each advisory ID
- severity
- affected package
- installed version
- patched version
- exact dependency path
- direct/transitive
- runtime/dev-only
- current npm suggested fix
- whether a parent package update is available

Confirm whether the five high findings represent:

- multiple advisory records
- repeated vulnerable package paths
- or both

Do not infer from the count alone.

# Phase 2 — Verify Current Stable Package Data

Check official current stable versions and security data for:

```text
next
postcss
prisma
@prisma/client
@prisma/adapter-pg
find-my-way
@radix-ui/react-dialog
```

Rules:

- use stable releases only
- no preview/canary/beta/RC
- no major upgrade
- no downgrade
- keep direct packages coherent
- record exact source/version decision in the remediation report

## Next.js decision

Next 16.2.11 already addressed the July Next.js security release that prompted the previous remediation.

Do not change Next merely because its dependency path contains vulnerable PostCSS.

Upgrade Next only if:

- a newer stable 16.x patch exists,
- it is required to resolve a current direct Next advisory,
- and compatibility is verified.

Otherwise keep:

```text
next@16.2.11
eslint-config-next@16.2.11
```

# Phase 3 — PostCSS Remediation

The existing package configuration previously used a parent-scoped Next override for PostCSS 8.5.10.

Update the dependency graph so every active PostCSS instance is at least:

```text
8.5.18
```

Preferred order:

1. inspect whether the current direct parent can resolve 8.5.18 naturally
2. update the existing narrow parent-scoped override from 8.5.10 to 8.5.18
3. inspect all PostCSS instances with:

```bash
npm ls postcss --all
```

4. verify no instance remains `<=8.5.17`

Do not:

- use an incompatible major override
- add a second parallel PostCSS dependency unnecessarily
- modify CSS behavior or application source
- process untrusted CSS as a workaround

If the existing parent-scoped Next override is retained, document:

- exact override scope
- why it is compatible
- removal condition when Next resolves the patched version itself

# Phase 4 — find-my-way Remediation

Inspect the exact Prisma/tooling parent path.

Target:

```text
find-my-way@9.7.0 or later compatible stable 9.x
```

Preferred order:

1. determine whether a newer coherent stable Prisma 7 patch release resolves `find-my-way`
2. if yes, upgrade together:
   - `prisma`
   - `@prisma/client`
   - `@prisma/adapter-pg`
3. if no coherent Prisma patch is available, use a narrowly scoped parent override targeting the actual Prisma/tooling parent path
4. verify the parent semver/API compatibility
5. verify Prisma CLI and generated client behavior

Do not:

- add `find-my-way` as a top-level dependency
- apply a broad global override without justification
- change Prisma schema
- change database configuration
- run migrations

Run:

```bash
npm ls prisma @prisma/client @prisma/adapter-pg find-my-way --all
npm explain find-my-way
npm run check:prisma
npx prisma validate
npx prisma generate
```

If a scoped override is used, document:

- exact parent
- exact override
- why parent update was insufficient
- compatibility evidence
- removal condition

# Phase 5 — Radix Gate Verification

Keep:

```text
@radix-ui/react-dialog@1.1.21
```

unless the live official package data shows a newer stable patch is required for security or compatibility.

Verify:

- no peer conflicts
- no advisory through the Radix path
- React 19 compatibility
- no V2-3 source imports yet
- no broad Radix packages were added

Run:

```bash
npm ls @radix-ui/react-dialog --all
```

Do not implement the modal in this task.

# Phase 6 — Clean Install and Dependency Integrity

After minimal package changes:

```bash
npm ci
npm ls --all
```

Required:

- no invalid packages
- no unmet peer dependencies
- no extraneous dependency state
- deterministic lockfile
- no manual lockfile edits

# Phase 7 — Full Regression Gates

Run all current gates because overrides affect framework/tooling dependencies:

```bash
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
```

Verify:

- V2-1 and V2-2 behavior unchanged
- controlled registration remains disabled
- Org Admin/Warehouse permissions unchanged
- Light/Dark/System unchanged
- no schema/migration difference
- no modal code exists yet

# Phase 8 — Final Audit Gate

Run and save:

```bash
npm audit --json > /tmp/onedayos-v2-3-audit-after.json || true
npm audit --omit=dev --json > /tmp/onedayos-v2-3-audit-prod-after.json || true

npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

All three threshold commands must pass.

If npm still proposes only breaking downgrades despite patched compatible transitive versions:

- do not force
- inspect the exact lock/override behavior
- report the unresolved package path
- leave Prompt 38 blocked

# Phase 9 — Documentation

Update:

```text
docs/engineering-manual/00-meta/DEPENDENCY-AUDIT-TRIAGE-2026-07.md
docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md
```

Add the newly disclosed advisories separately from the previous fourteen records.

Create:

```text
docs/engineering-manual/00-meta/
  V2-3-DEPENDENCY-GATE-REPORT.md
```

Required sections:

```text
# V2-3 Dependency Gate Report

## Status

## Trigger

## Runtime

## Audit Before

## PostCSS Advisory and Remediation

## find-my-way Advisory and Remediation

## Next.js Decision

## Prisma Decision

## Radix Dialog Decision

## Overrides Added or Updated

## Clean Install

## Application Regression Gates

## Audit After

## Remaining Advisories

## Risks and Removal Conditions

## Prompt 38 Resume Status
```

Allowed final status if all thresholds pass:

```text
V2-3 Dependency Gate Passed
Prompt 38 May Resume
```

Do not mark V2-3 itself complete.

# Phase 10 — Restore Latest Production Runtime

After all gates pass:

1. stop any stale server on port 1320
2. run the latest production build if needed
3. start:

```bash
npm run start
```

4. verify:

```text
/
 /login
 /register
 /api/kernel/auth/me
```

Expected:

- pages 200
- auth/me JSON 401 unauthenticated
- registration remains disabled
- server remains running on port 1320

# Verification Commands

Run under Node 24:

```bash
node --version
npm --version

npm ci
npm ls --all
npm ls next postcss prisma @prisma/client @prisma/adapter-pg find-my-way @radix-ui/react-dialog --all

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

# Final Report Required

Report:

1. Dependency-gate summary.
2. Why the previously clean audit changed.
3. Node/npm versions.
4. Files inspected.
5. Files created.
6. Files modified.
7. Exact advisory IDs and severities.
8. Exact vulnerable dependency paths.
9. PostCSS before/after versions.
10. PostCSS override/parent decision.
11. find-my-way before/after versions.
12. Prisma update or scoped-override decision.
13. Next.js version decision.
14. Radix Dialog version/result.
15. `npm ci` result.
16. `npm ls --all` integrity result.
17. Updated full test count.
18. `check:all` result.
19. `demo:check` result.
20. Before/after audit counts.
21. Production moderate audit result.
22. Full high audit result.
23. Full moderate audit result.
24. Remaining advisories, if any.
25. Documentation updates.
26. Port 1320 server status/PID.
27. Git diff/status observations.
28. Any deviations from scope.
29. Confirmation that no modal components/routes, V2-3 UI, Prisma schema, migrations, charts, exports, Inventory V2 transactions, caching, accents, website assets, new modules, or Platform Services were implemented.
30. Whether the V2-3 dependency gate passed.
31. Whether Prompt 38 may resume.
32. Whether V2-3 remains incomplete until its implementation and acceptance pass.

Stop after dependency remediation.

Do not implement or resume V2-3 modal code in this same task.
