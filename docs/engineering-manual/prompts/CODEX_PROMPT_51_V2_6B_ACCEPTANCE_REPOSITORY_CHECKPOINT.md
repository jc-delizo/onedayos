# OneDayOS — V2-6B Founder Acceptance and Repository Checkpoint

V2-6B Schema, Migration, and Backfill Foundation has completed:

- additive Prisma schema and expand-only migration
- read-only deterministic legacy backfill preflight
- 9 valid / 0 invalid / 0 warning controlled-sandbox legacy adjustments
- fresh PostgreSQL migration rehearsal
- V2-5 upgrade-path migration rehearsal
- executable database constraint verification
- valid and invalid synthetic backfill-preflight rehearsal
- V2-5 rollback/compatibility verification
- production dependency audit clean
- one approved, time-bounded dev-only lint-tooling exception
- 439 tests passing
- 18 accessibility tests passing
- `check:all` passing
- `demo:check` passing
- controlled Supabase sandbox not migrated or mutated

The Founder explicitly accepts **V2-6B**.

This task creates a safe repository checkpoint for the accepted V2-6B foundation and updates governance so V2-6C becomes the next package eligible for explicit Founder approval.

This task does **not** authorize V2-6C implementation.

This task does **not** authorize controlled-sandbox migration or backfill.

## Founder Acceptance Decision

Record:

```text
V2-6B Founder Accepted
```

The evidence accepted includes:

- schema contract
- expand-only migration
- disposable fresh-database rehearsal
- disposable V2-5 upgrade rehearsal
- database CHECK/FK/index verification
- legacy V2-5 compatibility
- deterministic read-only preflight
- production dependency cleanliness
- documented temporary lint-tooling exception

The accepted development-tooling exception remains:

```text
Advisory: GHSA-mh99-v99m-4gvg
Package: brace-expansion
Scope: dev-only lint tooling
Review By: 2026-08-31
```

Do not describe the raw full development audit as clean.

Use exact wording:

```text
Production dependency audit: clean.
Development audit: one approved, time-bounded lint-tooling exception.
```

## Sandbox Migration Decision

The controlled Supabase sandbox remains **unmigrated**.

Do not apply the V2-6B migration or execute the backfill in this task.

The additive migration/backfill/cutover remains an explicit operator gate for V2-6D unless the frozen implementation roadmap is separately amended.

V2-6C may later be implemented against the accepted schema contract with runtime cutover disabled.

## Absolute Scope

### Allowed

- verify current repository/worktree state
- classify every tracked/untracked path
- update V2-6B acceptance/readiness/governance documents
- update the V2-6C handoff status to Ready for Founder Approval
- run all current quality/security/demo gates
- stage intended V2-6B files
- create one Git checkpoint commit
- create one annotated local tag
- create a repository checkpoint report
- leave authorized prompt files untracked
- keep the current production server working on port 1320

### Forbidden

Do not:

- apply any migration
- execute any backfill
- mutate sandbox data
- run `demo:reset`
- implement V2-6C
- implement posting/reversal services
- add transaction APIs, permissions, events, or UI
- change Prisma schema or migration SQL
- change dependencies
- alter the approved audit-policy exception
- implement V2-6D, V2-7, or V2-8
- add caching, accents, website assets, modules, or Platform Services
- stage `.env.local`
- stage secrets
- stage prompt input files
- push commits or tags
- rewrite/amend history
- run `npm audit fix`
- run `npm audit fix --force`

## Primary Authority

Read first:

- `docs/engineering-manual/00-meta/V2-6B-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6B-MIGRATION-REHEARSAL-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6b-schema-migration-backfill.md`
- `docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md`
- `docs/engineering-manual/00-meta/V2-6-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6B-SCHEMA-MIGRATION-BACKFILL.md`
- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6C-POSTING-API-COMPATIBILITY.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/00-meta/DEV-TOOLING-SECURITY-EXCEPTION-GHSA-MH99-V99M-4GVG.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-V2-5-REPOSITORY-CHECKPOINT.md`

Inspect:

- `package.json`
- `package-lock.json`
- `prisma/schema.prisma`
- `prisma/migrations/20260725000000_inventory_v2_transaction_foundation/migration.sql`
- `scripts/inventory-v2/**`
- `scripts/check-dependency-audit-policy.ts`
- `.github/workflows/ci.yml`
- `.gitignore`

If the evidence does not match the reports, stop and report the mismatch.

## Expected Repository History

Expected prior commits/tags:

```text
V2-5 checkpoint:
6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b
inventory-demo-v2-v2.5-checkpoint

V2-6 governance checkpoint:
7acee4f8800bec6d9230ec5fde0d138e20195d54
inventory-demo-v2-v2.6-governance
```

Verify both tags and commits.

Do not modify them.

## Authorized Untracked Prompt Inputs

Prompt files for Prompt 46 through Prompt 51 may remain untracked.

They must:

- remain unmodified
- remain unstaged
- remain uncommitted

Any other ambiguous untracked file requires stopping before the commit.

# Phase 1 — Record and Classify the Worktree

Run:

```bash
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short
git status --porcelain=v2
git diff --stat
git diff --name-status
git ls-files --others --exclude-standard
```

Classify every path:

```text
A. Intended V2-6B Prisma/migration foundation
B. Intended V2-6B scripts/tests
C. Intended dependency/audit-policy changes
D. Intended V2-6B governance/reports
E. Intended package/lock/CI/config
F. Authorized untracked prompt inputs — exclude
G. Secrets/local environment — exclude
H. Build/runtime/temp files — exclude
I. Unrelated/ambiguous — stop
```

Do not blindly stage the repository.

# Phase 2 — Secret and Artifact Scan

Before staging, scan intended files safely for indicators such as:

```text
sb_secret_
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
ONEDAYOS_DEMO_ADMIN_PASSWORD=
ONEDAYOS_DEMO_WAREHOUSE_PASSWORD=
BEGIN PRIVATE KEY
Authorization: Bearer
```

Report file path and indicator type only.

Redact values.

Expected placeholders/test literals are permitted only when clearly non-secret.

Do not stage:

- `.env.local`
- local databases/dumps
- Docker runtime files
- `/tmp` artifacts
- screenshots
- logs/PIDs
- `.next`
- `node_modules`
- generated local credentials
- prompt input files

# Phase 3 — Record Founder Acceptance

Update:

```text
docs/engineering-manual/00-meta/V2-6B-ACCEPTANCE-REPORT.md
```

Set status:

```text
Founder Accepted
```

Record:

- acceptance date
- production audit clean
- approved time-bounded dev-tooling exception
- fresh migration rehearsal passed
- upgrade-path rehearsal passed
- constraint tests passed
- preflight rehearsal passed
- controlled sandbox not migrated
- backfill not executed
- V2-6C not yet authorized

Update:

```text
docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6b-schema-migration-backfill.md
```

with Founder acceptance and checkpoint reference.

Update:

```text
docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md
```

to state:

```text
V2-6B Founder Accepted
V2-6C is the next package eligible for explicit Founder authorization
V2-6D remains blocked
Controlled-sandbox migration/backfill remains pending
```

Update:

```text
docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6C-POSTING-API-COMPATIBILITY.md
```

from Blocked to:

```text
Status: Ready for Founder Approval
Implementation Allowed: No — explicit Founder authorization required
```

Do not authorize implementation.

Update the roadmap narrowly with the same statuses.

# Phase 4 — Create the Checkpoint Report

Create:

```text
docs/engineering-manual/00-meta/
  INVENTORY-DEMO-V2-V2-6B-REPOSITORY-CHECKPOINT.md
```

Required sections:

```text
# Inventory Demo V2 V2-6B Repository Checkpoint

## Status

## Founder Acceptance

## Git Root and Branch

## Previous HEAD

## Included Scope

## Prisma Schema and Migration

## Backfill Foundation

## Disposable Migration Evidence

## Dependency Audit Policy

## Development-Tooling Exception

## Excluded Files

## Secret Scan

## Quality Gates

## Controlled Sandbox Status

## Checkpoint Commit

## Checkpoint Tag

## Rollback Instructions

## V2-6C Readiness
```

Rollback instructions should prefer:

```text
git switch --detach inventory-demo-v2-v2.6b-foundation
git switch -c recovery/v2-6b inventory-demo-v2-v2.6b-foundation
git diff inventory-demo-v2-v2.6b-foundation..HEAD
```

Do not recommend destructive reset as the first option.

# Phase 5 — Final Pre-Commit Gates

Use Node 24.

Run:

```bash
node --version
npm --version
npm ci

npm run check:audit-policy
npm audit --omit=dev --audit-level=moderate

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

npx prisma validate
npx prisma generate

git diff --check
```

Capture the raw full audit and verify it contains only the approved exception.

Do not mislabel the raw full audit as clean.

Do not run migration rehearsal again unless a relevant V2-6B file changed after Prompt 50.

Do not connect to or alter the sandbox database.

# Phase 6 — Stage Intended Files Only

Stage only intended V2-6B and acceptance/checkpoint files.

Do not use `git add .` unless classification proves every path is intended.

After staging:

```bash
git status --short
git diff --cached --stat
git diff --cached --name-status
git diff --cached --check
```

Repeat the secret/artifact scan against staged files.

Required:

- no prompt files
- no `.env.local`
- no secrets
- no runtime artifacts
- no unrelated files
- no sandbox data dumps
- no temporary Docker files

# Phase 7 — Create the V2-6B Commit

Verify Git identity:

```bash
git config user.name
git config user.email
```

If missing, stop and leave the safe staged state intact.

If present, create one commit:

```text
feat: add Inventory V2 transaction schema foundation
```

Do not amend.

Do not push.

# Phase 8 — Create the Annotated Local Tag

Create:

```text
inventory-demo-v2-v2.6b-foundation
```

Tag message:

```text
Accepted Inventory V2 schema, expand migration, and backfill foundation
```

If the tag exists, inspect it and do not overwrite.

Do not push the tag.

# Phase 9 — Verify the Checkpoint

Run:

```bash
git status --short
git log -1 --stat
git show --stat --oneline HEAD
git tag --list "inventory-demo-v2-v2.6b-foundation"
git rev-parse HEAD
git rev-list -n 1 inventory-demo-v2-v2.6b-foundation
```

Required:

- tag points to the new commit
- all intended V2-6B files are committed
- only authorized prompt inputs remain untracked
- `.env.local` remains ignored/untracked
- no source/config ambiguity remains

# Final Report Required

Report:

1. V2-6B acceptance/checkpoint summary.
2. Git root and branch.
3. Previous HEAD.
4. Files classified by category.
5. Files excluded and why.
6. Secret-scan result.
7. Founder acceptance updates.
8. Full test count.
9. Accessibility test count.
10. `check:all` result.
11. `demo:check` result.
12. Production audit result.
13. Approved raw development-audit exception result.
14. Prisma validate/generate result.
15. Staged file count/stat.
16. Commit hash and message.
17. Tag name and target hash.
18. Final worktree status.
19. Remaining untracked prompt files.
20. Checkpoint report path.
21. Confirmation controlled sandbox was not migrated/backfilled.
22. Confirmation no application behavior, dependency version, new Prisma change, migration execution, database data, permission, API, UI, export cutover, caching, accent, website asset, module, or Platform Service change occurred in this checkpoint task.
23. Whether the repository is safely checkpointed through V2-6B.
24. Whether V2-6C is ready for explicit Founder authorization.
25. Whether V2-6D and controlled-sandbox migration/backfill remain blocked.

Stop after the checkpoint.

Do not implement V2-6C in this task.
