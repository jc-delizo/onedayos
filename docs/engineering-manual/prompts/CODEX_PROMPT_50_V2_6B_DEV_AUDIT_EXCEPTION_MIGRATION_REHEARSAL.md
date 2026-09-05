# OneDayOS — V2-6B Final Acceptance Gate
# Time-Bounded Dev-Tooling Audit Exception + Disposable PostgreSQL Rehearsal

V2-6B Schema, Migration, and Backfill Foundation is code-complete.

The previous acceptance attempt correctly remediated all production/runtime dependency findings, but the raw full-development audit still reports nine high package entries caused by one newly disclosed advisory:

```text
GHSA-mh99-v99m-4gvg
package: brace-expansion
```

The remaining vulnerable package is reached only through the current stable ESLint / Next.js lint-tooling graph, including legacy `minimatch@3`.

A safe drop-in override to `brace-expansion@5.0.8` is not approved because legacy `minimatch@3` expects the old callable CommonJS export while the patched current brace-expansion line exposes a different named-export API.

The Founder authorizes a **temporary, narrowly scoped, time-bounded development-tooling exception** for this one advisory so that the isolated PostgreSQL migration rehearsal can proceed.

This is not a general audit waiver.

V2-6C remains blocked.

The controlled Supabase sandbox migration remains unauthorized.

## Founder Security Decision

The following policy is approved:

### Production dependency requirement

This must remain clean:

```text
npm audit --omit=dev --audit-level=moderate
→ exit 0
```

No production/runtime advisory is allowed.

### Development dependency policy

The raw full audit may remain nonzero **only** for:

```text
Advisory: GHSA-mh99-v99m-4gvg
Package: brace-expansion
Severity: high
Dependency class: dev-only
Approved roots: ESLint / eslint-config-next / their stable lint plugins
```

Every other moderate, high, or critical advisory remains forbidden.

### Exception expiration

The exception expires on:

```text
2026-08-31
```

It must be reviewed earlier when any of these change:

- `eslint`
- `eslint-config-next`
- `@eslint/*`
- `eslint-plugin-*`
- `minimatch`
- `brace-expansion`
- Next.js major/minor lint integration
- npm advisory metadata for this GHSA

### Exposure boundary

The exception is acceptable only while:

- `brace-expansion` is absent from the production dependency tree,
- the vulnerable path is used only by local/CI lint tooling,
- OneDayOS runtime requests never pass user-controlled glob/brace patterns to it,
- lint commands use repository-controlled static configuration,
- lint jobs are resource/time bounded,
- CI lint execution receives no production secrets,
- the advisory and upstream remediation status remain documented.

### Explicitly rejected workarounds

Do not:

- override legacy `minimatch@3` directly to `brace-expansion@5.0.8`,
- install ESLint 10 while stable plugin peer dependencies remain invalid,
- patch files inside `node_modules`,
- add `patch-package`,
- maintain a local fork of minimatch or ESLint in this task,
- suppress all npm advisories,
- delete the lint gate,
- run `npm audit fix`,
- run `npm audit fix --force`.

When a coherent stable lint stack becomes available, remove the exception and restore a clean raw full audit.

## Absolute Scope

### Allowed

- implement a strict dependency-audit policy checker
- document the temporary exception
- update CI/quality gates to enforce production-clean + exact-dev-exception policy
- add lint timeout/resource safeguards
- perform disposable PostgreSQL migration rehearsals
- create synthetic legacy fixture data only in disposable databases
- run V2-6B read-only backfill preflight against disposable databases
- test database constraints and V2-5 compatibility
- update V2-6B acceptance and migration reports
- run all application/security/demo gates
- restart the current V2-5 runtime on port 1320

### Forbidden

Do not:

- apply the V2-6B migration to the controlled Supabase sandbox
- use `.env.local` `DATABASE_URL` or `DIRECT_URL` for rehearsal
- execute the real sandbox backfill
- run `demo:reset`
- change canonical demo data
- implement V2-6C posting/reversal services
- add transaction APIs, permissions, events, or UI
- change Inventory business behavior
- modify Prisma schema or the V2-6B migration except to fix a proven rehearsal defect
- add a new dependency merely for test orchestration
- install PostgreSQL or Docker
- add caching, accents, website assets, modules, or Platform Services
- create a commit or tag
- touch or stage authorized prompt files
- modify `.env.local`

## Primary Authority

Read first:

- `docs/engineering-manual/00-meta/V2-6B-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6B-MIGRATION-REHEARSAL-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6b-schema-migration-backfill.md`
- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6B-SCHEMA-MIGRATION-BACKFILL.md`
- `docs/engineering-manual/00-meta/V2-6-SCHEMA-MIGRATION-REVIEW.md`
- `docs/engineering-manual/00-meta/V2-6-MIGRATION-BACKFILL-PLAN.md`
- `docs/engineering-manual/00-meta/V2-6-TEST-MATRIX.md`
- `docs/engineering-manual/00-meta/V2-6-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-AUDIT-TRIAGE-2026-07.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`
- `docs/engineering-manual/06-data/04-migrations-seeding.md`
- `docs/engineering-manual/15-deployment-operations/03-database-migrations-production.md`
- `docs/engineering-manual/13-security/08-production-readiness-gate.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`

Inspect:

- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `eslint.config.*`
- `scripts/check-*`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `prisma.config.ts`
- `scripts/inventory-v2/**`
- `.env.example`

If authorities conflict with the Founder decision above, record the Founder decision as a narrow time-bound amendment. Stop if any other conflict remains.

## Repository Safety

Before work:

1. Run `git status --short`.
2. Record every changed/untracked path.
3. Preserve all approved V2-6 governance and V2-6B changes.
4. Authorized prompt files remain untouched, untracked, and unstaged.
5. Do not reset, restore, delete, or overwrite unrelated work.
6. Do not create a commit or tag.
7. Use Node 24.
8. Stop stale runtime only before final build/start.

# Phase 1 — Reproduce and Prove the Exact Exception

Under Node 24 save sanitized outputs:

```bash
node --version
npm --version

npm audit --json > /tmp/onedayos-v2-6b-full-audit.json || true
npm audit --omit=dev --json > /tmp/onedayos-v2-6b-production-audit.json || true

npm ls brace-expansion minimatch eslint eslint-config-next --all
npm explain brace-expansion
```

Prove:

1. Production audit has zero findings.
2. Every remaining full-audit finding maps to:
   - `brace-expansion`
   - GHSA-mh99-v99m-4gvg
   - dev-only package nodes
   - stable ESLint/Next lint roots.
3. No other advisory ID is present.
4. No vulnerable `brace-expansion` path is present in `npm ls --omit=dev`.
5. The project runtime source does not import:
   - `brace-expansion`
   - `minimatch`
   - ESLint internals.
6. Current lint scripts/configuration use static repository-controlled patterns.
7. No application request value is forwarded into lint/glob patterns.

If any condition fails, stop. Do not use the exception.

# Phase 2 — Implement a Strict Audit-Policy Gate

Create a narrowly scoped policy checker, for example:

```text
scripts/check-dependency-audit-policy.ts
scripts/check-dependency-audit-policy.test.ts
```

Add a package script such as:

```text
check:audit-policy
```

## Required behavior

The checker must:

1. run or consume `npm audit --json`,
2. require zero production findings at moderate or higher,
3. permit only the exact approved development advisory,
4. verify the advisory is:
   - package `brace-expansion`,
   - GHSA-mh99-v99m-4gvg,
   - high severity,
   - dev-only,
   - transitive,
   - reached only from approved lint roots,
5. reject:
   - any other advisory,
   - any production path,
   - any direct application dependency path,
   - critical findings,
   - an expired exception,
   - changed package roots,
   - changed advisory metadata,
6. print:
   - production audit result,
   - approved exception count,
   - review-by date,
   - removal trigger,
7. exit nonzero on any mismatch,
8. never print secrets.

Do not suppress or rewrite the raw npm audit output.

## Policy source

Store the approved exception in a small explicit policy file or typed constant with:

```text
advisory ID
package
severity
approved roots
review-by date
rationale
owner
removal conditions
```

Do not create a generic allow-anything mechanism.

## Tests

Required:

- exact approved tree passes
- production occurrence fails
- different advisory fails
- additional moderate advisory fails
- direct dependency fails
- wrong package fails
- wrong root fails
- critical severity fails
- expired exception fails
- review date parsed in UTC
- no findings passes
- safe output contains no package-lock contents/secrets

# Phase 3 — CI and Lint Mitigations

Update CI narrowly.

Requirements:

- production dependency audit remains a strict required gate
- `check:audit-policy` is a required gate
- raw full audit may be recorded for visibility but must not be falsely reported as clean
- lint remains required
- lint execution is time-bounded
- lint job/step does not receive sandbox/production secrets
- no untrusted runtime input is passed as an ESLint glob
- no audit suppression flags

Use the existing CI architecture.

Do not add a new CI service.

If GitHub Actions job-level `timeout-minutes` is already present, verify it is suitable. Otherwise add a narrow timeout appropriate to the lint/check job.

Document the risk boundary.

# Phase 4 — Documentation of the Exception

Create:

```text
docs/engineering-manual/00-meta/
  DEV-TOOLING-SECURITY-EXCEPTION-GHSA-MH99-V99M-4GVG.md
```

Required sections:

```text
# Development Tooling Security Exception

## Status

## Advisory

## Affected Dependency Path

## Production Exposure

## Development Exposure

## Why a Drop-In Override Is Unsafe

## Approved Compensating Controls

## CI Controls

## Review-By Date

## Removal Triggers

## Owner

## Prohibited Workarounds

## Current Upstream Status
```

Status:

```text
Accepted Temporarily
Review By: 2026-08-31
```

Update:

- dependency triage
- dependency remediation report
- CI quality-gates document
- V2-6B acceptance/rehearsal report

Do not call the raw full audit clean.

Use exact language:

```text
Production dependency audit: clean.
Development audit: one approved, time-bounded lint-tooling exception.
```

# Phase 5 — Isolated Docker PostgreSQL Safety Gate

The previous report confirms Docker and PostgreSQL client tools are available.

Use a local disposable PostgreSQL container.

Never use:

- `.env.local` `DATABASE_URL`
- `.env.local` `DIRECT_URL`
- the Supabase host/project
- any shared database.

## Container requirements

- unique random container name
- current stable PostgreSQL image already available locally, or pull only if ordinary Docker operation is allowed
- bind only to `127.0.0.1`
- dynamically allocated host port
- random rehearsal-only password
- no password printed
- explicit health check
- cleanup through `try/finally` / shell trap
- container removed after success or failure
- no persistent volume
- no cloud connection

Before migration, compare the rehearsal URL against sandbox URLs by normalized host/database and refuse any match.

Create a reusable safety helper.

# Phase 6 — Migration Rehearsal Harness

Create or complete:

```text
scripts/inventory-v2/migration-rehearsal.ts
scripts/inventory-v2/migration-rehearsal.test.ts
scripts/inventory-v2/migration-fixtures.ts
```

Add:

```text
inventory:v2:migration:rehearse
```

Requirements:

- creates/uses only disposable local infrastructure
- cannot accept arbitrary CLI database URLs
- never reads sandbox URLs as fallback
- prints safe progress only
- cleans up on SIGINT/SIGTERM/failure
- creates separate fresh and upgrade databases in the disposable container
- does not alter the main worktree
- uses temporary directories/worktrees under `/tmp`
- no secret persistence
- no demo reset.

# Phase 7 — Fresh Database Rehearsal

Against disposable database `fresh`:

1. apply all repository migrations through V2-6B,
2. verify `_prisma_migrations`,
3. inspect tables/enums/columns/indexes/FKs/CHECK constraints,
4. verify legacy tables/fields remain,
5. verify new tables are empty,
6. verify no demo data exists,
7. verify no destructive statement occurred.

Validate every frozen V2-6B schema object.

# Phase 8 — V2-5 Upgrade-Path Rehearsal

Use the governance checkpoint or V2-5 checkpoint through a temporary detached worktree/archive under `/tmp`.

Against disposable database `upgrade`:

1. apply migrations only through the pre-V2-6B state,
2. seed deterministic synthetic legacy data for two organizations,
3. verify legacy application queries,
4. apply only the V2-6B expand migration,
5. prove:
   - all legacy rows remain,
   - counts remain unchanged,
   - new tables are empty,
   - new nullable links remain null,
   - V2-5 legacy queries still work,
   - no organization leakage,
   - no demo/sandbox data was used.

Do not switch or alter the main worktree.

# Phase 9 — Executable Constraint Tests

Against disposable migrated databases, test accepted/rejected rows.

Required invalid cases:

- bad transaction number format
- self reversal
- invalid reversal shape
- duplicate reversal of one original
- same Transfer source/destination
- invalid Receipt warehouse shape
- invalid Issue warehouse shape
- invalid Adjustment warehouse shape
- invalid Transfer warehouse shape
- partial idempotency hash pair
- empty unit
- nonpositive line number
- negative line quantity
- partial movement-link pair
- movement transaction/line/org mismatch
- duplicate org transaction number
- duplicate org idempotency key.

Required valid foundation rows for all four transaction types.

Do not test posting service behavior.

# Phase 10 — Backfill Preflight Rehearsal

Run the read-only preflight against synthetic valid legacy data.

Required:

- two organizations
- deterministic mappings
- exact adjustment/movement matching
- current Product unit snapshot
- counted-final adjustment quantity
- no writes
- repeat output identical.

Run separate invalid scenarios:

- missing/wrong-org Product
- missing/wrong-org Warehouse
- missing User
- inconsistent before/after/delta
- missing movement
- duplicate movement
- wrong movement delta
- wrong quantity-after
- invalid Product unit
- orphan movement
- deterministic collision.

Preflight must fail nonzero and report sanitized issue codes.

# Phase 11 — Recovery Compatibility Rehearsal

Prove:

- V2-5 legacy SQL/application query shapes continue after the additive migration,
- old `StockAdjustment` remains readable,
- old `sourceType`/`sourceId` remain,
- current application build does not require the migration,
- rolling application code back to V2-5 remains compatible with the expanded database before cutover.

Document operational rollback:

- application rollback to checkpoint,
- leave additive schema unused, or
- restore pre-migration backup if operators require physical schema rollback.

Do not create destructive down SQL.

# Phase 12 — Full Regression Gates

Under Node 24 run:

```bash
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
npm run check:audit-policy

npm audit --omit=dev --audit-level=moderate
```

Also capture the raw full audit and report the expected exception.

Do not require raw full audit exit 0 while this approved exception remains active.

No other advisory is allowed.

# Phase 13 — Final Runtime

After all gates:

- stop stale server,
- start latest `next start` on port 1320,
- verify `/`, `/login`, `/register`,
- verify unauthenticated `/api/kernel/auth/me`,
- keep server running.

The controlled sandbox database remains unmigrated.

# Phase 14 — Acceptance Documentation

Update/create:

```text
docs/engineering-manual/00-meta/V2-6B-MIGRATION-REHEARSAL-REPORT.md
docs/engineering-manual/00-meta/V2-6B-ACCEPTANCE-REPORT.md
docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6b-schema-migration-backfill.md
docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md
```

Allowed final V2-6B status if all non-sandbox gates pass:

```text
Static and Disposable Migration Gates Complete
Founder Acceptance Pending
Sandbox Migration Authorization Pending
```

Record dependency status exactly:

```text
Production audit clean.
One approved time-bounded dev-only lint-tooling exception remains.
```

Do not mark V2-6C authorized.

# Verification Commands

Run under Node 24:

```bash
node --version
npm --version
npm ci
npm ls --all

npm run check:audit-policy
npm audit --omit=dev --audit-level=moderate

npm run inventory:v2:migration:rehearse

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

git diff --check
git status --short
```

Capture but do not mislabel:

```bash
npm audit --json
npm audit --audit-level=high
npm audit --audit-level=moderate
```

Do not run:

```bash
npm audit fix
npm audit fix --force
prisma migrate deploy
prisma migrate dev
prisma db push
prisma migrate reset
npm run demo:reset
```

against the controlled sandbox.

# Final Report Required

Report:

1. V2-6B final acceptance-gate summary.
2. Node/npm versions.
3. Initial worktree state.
4. Files created.
5. Files modified.
6. Exact raw full-audit findings.
7. Proof production audit is clean.
8. Approved exception-policy implementation.
9. Exception expiry/removal triggers.
10. CI/lint compensating controls.
11. Audit-policy test result.
12. Disposable Docker/PostgreSQL version and safety proof.
13. Fresh migration result.
14. Upgrade-path migration result.
15. Constraint execution result.
16. Legacy V2-5 compatibility result.
17. Backfill preflight valid result.
18. Invalid scenario results.
19. Recovery/rollback rehearsal.
20. Tests added and updated total count.
21. Accessibility result.
22. `check:all` result.
23. `demo:check` result.
24. Production audit result.
25. Raw full-audit exception result.
26. Confirmation controlled sandbox was not migrated.
27. Port 1320 server status/PID.
28. Documentation paths.
29. Git diff/status observations.
30. Deviations from scope, if any.
31. Remaining migration/backfill/security risks.
32. Confirmation that no V2-6C service/API/permission/event/UI/export cutover, demo V2 data, caching, accents, website assets, modules, or Platform Services were implemented.
33. Whether V2-6B is ready for Founder acceptance.
34. Whether sandbox migration authorization remains pending.
35. Whether V2-6C remains blocked.

Stop after this package.

Do not apply the migration to the sandbox or proceed to V2-6C without explicit Founder/operator authorization.
