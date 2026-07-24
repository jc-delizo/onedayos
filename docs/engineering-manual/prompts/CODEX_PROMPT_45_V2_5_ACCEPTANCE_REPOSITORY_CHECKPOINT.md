# OneDayOS — V2-5 Founder Acceptance and Repository Checkpoint

V2-5 Bounded Server-Side CSV/XLSX Export V1 has completed with:

- `exceljs@4.4.0`
- a narrowly scoped ExcelJS → `uuid@11.1.1` override
- clean production and full dependency audits
- server-only workbook generation
- formula-injection protection
- permission-separated exports
- selected-row and all-filtered export scopes
- 61 test files / 376 tests passing
- 5 accessibility files / 18 tests passing
- `check:all` passing
- `demo:check` passing
- live CSV and XLSX readback verification
- no Prisma schema or migration changes

The Founder accepts V2-5.

However, the repository currently contains a very large preserved dirty worktree from Prompt 31 through Prompt 44:

```text
139 tracked changed files
116 untracked files
```

V2-6 introduces the first major Inventory Demo V2 schema and migration package.

The Founder explicitly authorizes this checkpoint package before V2-6.

This package must:

1. verify V2-5 acceptance,
2. audit every dirty/untracked path,
3. exclude secrets, runtime files, temporary screenshots, logs, and generated artifacts,
4. create one clean recoverable Git checkpoint containing the intended OneDayOS work through V2-5,
5. leave the project ready for V2-6,
6. make no application, schema, migration, dependency, UI, or business-logic changes.

## Absolute Scope

### Allowed

- inspect Git status and diff
- classify every changed/untracked path
- remove only clearly generated/temporary files that must not be versioned
- update `.gitignore` only if a real recurring generated-secret/runtime artifact is missing
- run all existing quality/security/demo gates
- stage intended repository changes
- create one Git commit
- create one annotated local checkpoint tag after the commit
- create a checkpoint report
- update V2-5 acceptance/conformance wording to Founder Accepted if supported
- create a V2-6 readiness note

### Forbidden

Do not:

- implement V2-6
- modify Prisma schema
- create or run migrations
- change application code
- change dependencies
- run `npm install`
- run `npm audit fix`
- run `npm audit fix --force`
- rewrite history
- amend an existing commit
- force-push
- push to any remote
- delete unknown work
- stage `.env.local`
- stage secrets
- stage `/tmp` screenshots
- stage runtime logs
- stage `node_modules`
- stage `.next`
- stage downloaded Node distributions
- stage database dumps
- stage auth/session files
- create public website assets
- change controlled-demo data

## Primary Authority

Read first:

- `docs/engineering-manual/00-meta/V2-5-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-5-bounded-table-export.md`
- `docs/engineering-manual/00-meta/V2-5-EXCELJS-UUID-COMPATIBILITY-GATE.md`
- `docs/engineering-manual/00-meta/V2-4-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-3-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-2-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-1-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`
- `src/modules/inventory/UX-CONFORMANCE.md`
- `src/business-objects/UX-CONFORMANCE.md`
- `src/platform/organization/UX-CONFORMANCE.md`

Also inspect:

- `.gitignore`
- `.git/info/exclude`
- current branch and remotes
- the repository root
- sibling-folder changes, if the Git root includes more than this application

If the Git root contains unrelated projects or ambiguous changes, do not stage them. Stop and report the ambiguity if they cannot be safely separated.

## Runtime

Use Node 24:

```bash
node --version
npm --version
```

Do not switch dependency versions.

## Phase 1 — Record the Git Baseline

Run:

```bash
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git status --short
git status --porcelain=v2
git diff --stat
git diff --name-status
git ls-files --others --exclude-standard
```

Record:

- Git root
- current branch
- current HEAD
- tracked changes
- untracked files
- ignored files
- whether sibling/unrelated directories are inside the Git root

Do not print secret-file contents.

## Phase 2 — Classify Every Changed/Untracked Path

Create a complete classification with these categories:

```text
A. Intended OneDayOS source/config
B. Intended Engineering Manual/governance
C. Intended tests
D. Intended package/lock/dependency files
E. Intended CI/operations/demo documentation
F. Generated build/runtime files — exclude
G. Secrets/local environment — exclude
H. Temporary screenshots/logs — exclude
I. Unrelated/sibling project files — exclude and report
J. Ambiguous — stop before commit
```

At minimum explicitly inspect for:

- `.env.local`
- `.env.*`
- `node_modules`
- `.next`
- `coverage`
- logs
- screenshots
- `/tmp` references
- downloaded Node archives/binaries
- Supabase keys
- database URLs
- JWTs
- cookies
- session files
- database dumps
- generated Prisma client outside ignored paths
- editor/OS files
- prompt files under the Engineering Manual
- artifacts directories
- sibling folders

Do not use content-scanning commands that print secrets. Use filename and safe pattern detection.

## Phase 3 — Secret and Artifact Safety Scan

Run safe scans against files intended for staging.

Search for secret indicators without printing full matching values.

Examples of indicators:

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

The scan output must report:

- file path
- indicator type
- line number if safe

Redact values.

False positives in `.env.example` placeholders are allowed only when clearly non-secret.

Do not stage any real secret.

Inspect the staged diff again after staging.

## Phase 4 — Clean Only Proven Temporary Artifacts

You may delete only files that are unquestionably:

- temporary
- generated
- ignored by repository policy
- not source-of-truth
- not user-created work

Examples:

- stale local log files
- local PID files
- accidental screenshot copies under source directories
- generated build output
- downloaded runtime archives inside the repo

Do not delete:

- source code
- tests
- docs
- prompt files
- migrations
- package files
- reports
- unknown files

If a recurring temporary path is not ignored, add the narrowest appropriate `.gitignore` rule and document it.

## Phase 5 — Verify V2-5 Acceptance

Confirm from code/tests/reports:

- ExcelJS remains server-only
- scoped UUID override remains exact
- all audits are clean
- export permissions are separate from read
- Warehouse Operator has no export permission
- CSV/XLSX live review passed
- no V2-6 work exists
- no Prisma schema/migration diff exists

Update:

```text
docs/engineering-manual/00-meta/V2-5-ACCEPTANCE-REPORT.md
```

Status may become:

```text
Founder Accepted
```

Record the Founder acceptance date.

Do not claim public-demo or production approval.

Update conformance docs only as needed to record V2-5 Founder acceptance.

## Phase 6 — Run Final Pre-Commit Gates

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

npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate

git diff --check
```

All must pass.

Do not run `demo:reset`.

Do not change canonical data.

## Phase 7 — Stage the Intended Checkpoint

Stage only intended OneDayOS files.

Do not blindly run:

```bash
git add .
git add -A
```

unless the classification proves the Git root contains only intended project changes.

Prefer path-based staging.

After staging run:

```bash
git status --short
git diff --cached --stat
git diff --cached --name-status
git diff --cached --check
```

Repeat the secret/artifact safety scan against staged files.

Review:

- no `.env.local`
- no keys/passwords
- no logs/PIDs
- no `/tmp` screenshots
- no `.next`
- no `node_modules`
- no unrelated sibling files
- no unexpected binary files

If any ambiguous file remains, unstage it and report.

## Phase 8 — Create the Checkpoint Commit

Before committing, inspect:

```bash
git config user.name
git config user.email
```

If identity is missing:

- do not configure global Git identity
- stop and ask the Founder/operator to configure identity
- leave the safely staged checkpoint intact
- do not create a partial workaround

If identity exists, create one commit with message:

```text
checkpoint: Inventory Demo V2 through V2-5
```

Do not amend.

Do not squash history.

Do not push.

## Phase 9 — Create an Annotated Local Tag

After the commit succeeds, create:

```text
inventory-demo-v2-v2.5-checkpoint
```

as an annotated local tag with message:

```text
OneDayOS Inventory Demo V2 checkpoint through bounded exports
```

If the tag already exists:

- inspect what it points to
- do not overwrite it
- stop and report the conflict

Do not push the tag.

## Phase 10 — Verify the Checkpoint

Run:

```bash
git status --short
git log -1 --stat
git show --stat --oneline HEAD
git tag --list "inventory-demo-v2-v2.5-checkpoint"
git rev-parse HEAD
git rev-list -n 1 inventory-demo-v2-v2.5-checkpoint
```

Required:

- checkpoint tag points to the new commit
- no intended V2-1 through V2-5 files remain uncommitted
- only explicitly excluded unrelated/local files may remain
- all excluded files are documented
- `.env.local` remains ignored and untracked

If the worktree is not clean because excluded unrelated/local files remain, report them exactly.

## Phase 11 — Create Checkpoint Report

Create before committing:

```text
docs/engineering-manual/00-meta/
  INVENTORY-DEMO-V2-V2-5-REPOSITORY-CHECKPOINT.md
```

Required sections:

```text
# Inventory Demo V2 V2-5 Repository Checkpoint

## Status

## Founder Acceptance

## Git Root and Branch

## Previous HEAD

## Checkpoint Commit

## Checkpoint Tag

## Included Scope

## Excluded Files

## Secret Scan

## Quality Gates

## Dependency Audits

## Demo Readiness

## Rollback Instructions

## V2-6 Readiness
```

Rollback instructions must explain safe options without executing them:

```text
git switch --detach inventory-demo-v2-v2.5-checkpoint
git switch -c recovery/v2-5 inventory-demo-v2-v2.5-checkpoint
git diff inventory-demo-v2-v2.5-checkpoint..HEAD
```

Do not recommend destructive reset as the first rollback method.

## Phase 12 — V2-6 Readiness Note

Create:

```text
docs/engineering-manual/00-meta/
  V2-6-READINESS-NOTE.md
```

Include:

- V2-5 accepted
- checkpoint commit/tag
- dependency audits clean
- Prisma schema unchanged through V2-5
- V2-6 is the next frozen package
- V2-6 will require schema/migration review
- no V2-6 implementation is authorized by this checkpoint task
- explicit Founder authorization still required

## Final Report Required

Report:

1. Checkpoint summary.
2. Git root.
3. Branch.
4. Previous HEAD.
5. Files classified by category.
6. Files excluded and why.
7. Temporary artifacts removed, if any.
8. `.gitignore` changes, if any.
9. Secret-scan result.
10. V2-5 acceptance update.
11. Full test count.
12. Accessibility test count.
13. `check:all` result.
14. `demo:check` result.
15. Dependency audit results.
16. Staged file count/stat.
17. Commit hash and message.
18. Tag name and target hash.
19. Final worktree status.
20. Remaining excluded/unrelated files.
21. Checkpoint report path.
22. V2-6 readiness-note path.
23. Confirmation that no application code, dependency, Prisma schema, migration, business logic, UI, demo data, V2-6 feature, caching, accent, website asset, new module, or Platform Service change was made by this checkpoint task.
24. Whether the repository is safely checkpointed.
25. Whether V2-6 remains blocked pending explicit Founder approval.

Stop after the checkpoint.

Do not implement V2-6 in this task.
