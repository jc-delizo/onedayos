# OneDayOS — V2-6C Founder Acceptance and Repository Checkpoint

V2-6C Posting Engine, APIs, Permissions, Events, and Compatibility Reads has completed:

- disabled-by-default Inventory V2 runtime gate
- strict Receipt, Issue, Transfer, Adjustment, detail, and reversal APIs
- mandatory SHA-256 idempotency
- normalized request hashing
- frozen-format transaction numbers
- Prisma Serializable transactions with bounded retries
- atomic balance and movement posting
- exact canonical transaction/line/movement linkage
- negative-stock protection
- all four approved reversal representations
- frozen 1–100-line transaction limit
- canonical DTO/query services
- legacy V2-5 compatibility projections
- exact V2 permission definitions
- future-only Warehouse Operator V2 permission profile
- best-effort post-commit events
- disposable PostgreSQL posting/concurrency/idempotency rehearsal
- 447 tests passing across 68 files
- 18 accessibility tests passing
- `check:all` passing
- `demo:check` passing
- production dependency audit clean
- only the approved, unexpired dev-only lint-tooling exception remains

The controlled Supabase sandbox remains:

```text
unmigrated
unbackfilled
unprovisioned for V2 permissions
Inventory V2 runtime disabled
V2-5 UI and behavior active
```

The Founder explicitly accepts **V2-6C**.

This task creates a safe repository checkpoint for the accepted V2-6C implementation and updates governance so V2-6D becomes the next package eligible for explicit Founder approval.

This task does **not** authorize V2-6D implementation.

This task does **not** authorize controlled-sandbox migration, backfill, role provisioning, runtime enablement, or UI cutover.

## Repository Baseline

Expected:

```text
Branch: main
HEAD: b439afd12266a03766699f7fdc08f2178a480aba
Tag: inventory-demo-v2-v2.6b-foundation
```

Expected untracked files:

- authorized Prompt 46 through Prompt 54 inputs only

Prompt files must remain:

```text
unmodified
unstaged
uncommitted
```

Any unexpected source, configuration, package, Prisma, migration, or runtime file requires stopping before the checkpoint.

## Founder Acceptance Decision

Record:

```text
V2-6C Founder Accepted
```

Accepted evidence includes:

- runtime feature gate defaults false
- no V2 database query occurs while disabled
- type-specific strict schemas
- mandatory `Idempotency-Key`
- same-key/same-request replay safety
- same-key/different-request conflict
- cryptographically generated transaction references
- Serializable posting with maximum three reviewed conflict attempts
- Receipt atomicity
- Issue negative-stock protection
- Transfer paired movement and zero-net organization quantity
- Adjustment counted-final semantics
- exact reversal representation for all four types
- immutable original movements
- one reversal maximum
- canonical DTOs without tenant/hash/internal fields
- exact permissions with read/create/reverse separation
- best-effort events emitted after commit
- no duplicate event on idempotent replay
- disposable PostgreSQL concurrency and rollback evidence
- 100-line Transfer producing exactly 200 movements
- maximum-size replay without reposting
- final-line failure rolling back the whole transaction
- current V2-5 sandbox and UI remaining operational

## Known Accepted Boundary

Event delivery remains:

```text
best effort after commit
```

This is accepted for the V2-6 MVP only.

Before any external system, Notification Service, Accounting integration, Purchasing integration, Sales integration, or other consumer depends on reliable event delivery:

```text
a separate Durable Outbox ADR and implementation package are mandatory
```

Do not implement an Outbox in this task.

## Absolute Scope

### Allowed

- inspect and classify the V2-6C worktree
- verify V2-6C reports and implementation evidence
- update V2-6C acceptance/readiness/governance documents
- update the V2-6D handoff status to Ready for Founder Approval
- run all current quality, security-policy, Prisma, demo, and integration gates
- stage intended V2-6C files only
- create one Git checkpoint commit
- create one annotated local tag
- create one V2-6C repository-checkpoint report
- keep the current V2-5 production runtime healthy on port 1320
- leave authorized prompt files untracked

### Forbidden

Do not:

- apply the V2-6B migration to the controlled sandbox
- execute the legacy backfill
- run `demo:reset`
- mutate canonical demo data
- enable `ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED`
- modify `.env.local`
- provision V2 permissions into the live demo roles
- implement V2-6D UI, navigation, exports, dashboard, Process Flow, or demo cutover
- change Prisma schema or migration SQL
- change dependencies
- alter posting/reversal business logic
- add APIs, permissions, or events beyond the accepted V2-6C implementation
- implement caching or accents
- resume website asset production
- add modules or Platform Services
- alter the approved dev-tooling audit exception
- stage secrets, logs, screenshots, PID files, build output, or prompt files
- amend history
- force-push
- push the commit or tag
- run `npm audit fix`
- run `npm audit fix --force`

## Primary Authority

Read first:

- `docs/engineering-manual/00-meta/V2-6C-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-6c-posting-api-compatibility.md`
- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6C-POSTING-API-COMPATIBILITY.md`
- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6D-UI-DEMO-CUTOVER.md`
- `docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md`
- `docs/engineering-manual/00-meta/V2-6-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-TRANSACTION-SEMANTICS.md`
- `docs/engineering-manual/00-meta/V2-6-TEST-MATRIX.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- `docs/engineering-manual/00-meta/V2-6B-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-V2-6B-REPOSITORY-CHECKPOINT.md`
- `docs/engineering-manual/00-meta/DEV-TOOLING-SECURITY-EXCEPTION-GHSA-MH99-V99M-4GVG.md`

Inspect:

- `src/modules/inventory/transactions/**`
- `src/app/api/orgs/[orgSlug]/inventory/transactions/**`
- `scripts/inventory-v2/posting-rehearsal.ts`
- V2-6C tests
- `package.json`
- `.env.example`
- `scripts/check-dependency-audit-policy.ts`
- `prisma/schema.prisma`
- the accepted V2-6B migration
- `.gitignore`

If reports and implementation evidence do not match, stop and report the mismatch.

## Existing Checkpoints to Verify

Verify:

```text
inventory-demo-v2-v2.5-checkpoint
→ 6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b

inventory-demo-v2-v2.6-governance
→ 7acee4f8800bec6d9230ec5fde0d138e20195d54

inventory-demo-v2-v2.6b-foundation
→ b439afd12266a03766699f7fdc08f2178a480aba
```

Do not alter or recreate them.

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
A. Intended V2-6C transaction engine
B. Intended V2-6C API routes
C. Intended permissions/events/compatibility code
D. Intended V2-6C tests and disposable rehearsal
E. Intended environment/quality-gate changes
F. Intended V2-6C reports/governance
G. Authorized prompt inputs — exclude
H. Secrets/local environment — exclude
I. Build/runtime/temp artifacts — exclude
J. Unrelated/ambiguous — stop
```

Do not blindly stage the repository.

# Phase 2 — Secret and Artifact Safety Scan

Before staging, scan intended files safely for indicators:

```text
sb_secret_
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
Idempotency-Key:
Authorization: Bearer
BEGIN PRIVATE KEY
ONEDAYOS_DEMO_ADMIN_PASSWORD=
ONEDAYOS_DEMO_WAREHOUSE_PASSWORD=
```

Report:

- file path
- indicator type
- safe line number where possible

Redact values.

Expected placeholders/test literals are allowed only when clearly non-secret.

Do not stage:

- `.env.local`
- Docker credentials/state
- disposable database artifacts
- `/tmp` evidence
- screenshots
- logs/PIDs
- `.next`
- `node_modules`
- prompt files
- generated runtime secrets
- database dumps

# Phase 3 — Verify V2-6C Acceptance Evidence

Confirm from code/tests/reports:

## Runtime gate

- defaults false
- server-only
- safe 404 before V2 table access
- no current navigation exposes V2 routes
- `demo:check` passes against the unmigrated sandbox

## Schemas

- Receipt, Issue, Transfer, Adjustment, Reverse are strict
- recursive `orgId` rejection
- 1–100-line limit
- Adjustment counted-final field
- reference-date boundary
- duplicate-line behavior matches frozen contract

## Idempotency

- raw key never stored/logged
- SHA-256 key hash
- normalized request hash
- same key/same request returns original
- different request conflicts
- race safety

## Serializable posting

- exact reviewed retry codes
- maximum three attempts
- domain errors not retried
- real disposable concurrency test

## Posting

- Receipt
- Issue
- Transfer
- Adjustment
- atomic line/movement/balance behavior
- negative-stock safety
- canonical linkage

## Reversal

- Receipt
- Issue
- Transfer with swapped direction
- Adjustment with current-balance-based counted final quantity
- one reversal maximum
- reversal-of-reversal rejection
- immutable original history

## Permissions/events/APIs

- all exact permissions
- reverse/export separate
- Warehouse future profile is declarative only
- no live role provisioning
- post-commit events
- no durable-delivery claim
- no duplicate events on replay
- exact type-specific routes
- safe errors and API envelopes

## Compatibility

- current V2-5 behavior untouched
- no current export/dashboard/UI cutover
- legacy StockAdjustment remains
- controlled sandbox not migrated

If any evidence is missing, stop before accepting/committing.

# Phase 4 — Record Founder Acceptance

Update:

```text
docs/engineering-manual/00-meta/V2-6C-ACCEPTANCE-REPORT.md
```

Set status:

```text
Founder Accepted
```

Record:

- acceptance date
- controlled sandbox remains unmigrated
- V2 runtime remains disabled
- disposable posting rehearsal passed
- production audit clean
- approved time-bounded dev-tooling exception
- best-effort event boundary
- V2-6D not authorized yet

Update:

```text
docs/engineering-manual/16-client-delivery/
  IMPLEMENTATION-NOTE-v2-6c-posting-api-compatibility.md
```

with Founder acceptance and checkpoint reference.

Update:

```text
docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md
```

to state:

```text
V2-6C Founder Accepted
V2-6D is the next package eligible for explicit Founder authorization
Controlled-sandbox migration/backfill/cutover remain pending
V2-7 and V2-8 remain blocked
```

Update:

```text
docs/engineering-manual/00-meta/
  IMPLEMENTATION-PACKAGE-V2-6D-UI-DEMO-CUTOVER.md
```

from Blocked to:

```text
Status: Ready for Founder Approval
Implementation Allowed: No — explicit Founder/operator authorization required
```

Do not authorize implementation.

Update the roadmap narrowly with the same status.

# Phase 5 — Create the V2-6C Checkpoint Report

Create:

```text
docs/engineering-manual/00-meta/
  INVENTORY-DEMO-V2-V2-6C-REPOSITORY-CHECKPOINT.md
```

Required sections:

```text
# Inventory Demo V2 V2-6C Repository Checkpoint

## Status

## Founder Acceptance

## Git Root and Branch

## Previous HEAD

## Included Scope

## Runtime Feature Gate

## Posting Engine

## Idempotency

## Serializable Concurrency

## Reversal Model

## APIs and Permissions

## Events and Delivery Boundary

## Legacy Compatibility

## Disposable PostgreSQL Evidence

## Dependency Audit Policy

## Controlled Sandbox Status

## Excluded Files

## Secret Scan

## Quality Gates

## Checkpoint Commit

## Checkpoint Tag

## Rollback Instructions

## V2-6D Readiness
```

Rollback instructions should prefer:

```text
git switch --detach inventory-demo-v2-v2.6c-posting-engine
git switch -c recovery/v2-6c inventory-demo-v2-v2.6c-posting-engine
git diff inventory-demo-v2-v2.6c-posting-engine..HEAD
```

Do not recommend destructive reset as the first option.

# Phase 6 — Final Pre-Commit Gates

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

npm run inventory:v2:posting:rehearse

npx prisma validate
npx prisma generate

git diff --check
```

Capture the raw full audit and verify it contains only the approved unexpired lint-tooling exception.

Do not call the raw full audit clean.

Do not run migration/backfill/reset/provisioning against the sandbox.

# Phase 7 — Stage Intended Files Only

Stage only intended V2-6C and acceptance/checkpoint files.

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
- no disposable DB artifacts
- no screenshots/logs/PIDs
- no unrelated files
- no sandbox dump
- no runtime-generated credentials

# Phase 8 — Create the V2-6C Commit

Verify Git identity:

```bash
git config user.name
git config user.email
```

If identity is missing, stop and leave the safely staged state intact.

If present, create one commit:

```text
feat: add Inventory V2 posting and API foundation
```

Do not amend.

Do not push.

# Phase 9 — Create the Annotated Local Tag

Create:

```text
inventory-demo-v2-v2.6c-posting-engine
```

Tag message:

```text
Accepted Inventory V2 posting, reversal, API, permission, and compatibility foundation
```

If the tag already exists:

- inspect it
- do not overwrite
- stop and report the conflict

Do not push the tag.

# Phase 10 — Verify the Checkpoint

Run:

```bash
git status --short
git log -1 --stat
git show --stat --oneline HEAD
git tag --list "inventory-demo-v2-v2.6c-posting-engine"
git rev-parse HEAD
git rev-list -n 1 inventory-demo-v2-v2.6c-posting-engine
```

Required:

- tag points to the new commit
- all intended V2-6C files are committed
- only authorized prompt inputs remain untracked
- `.env.local` remains ignored/untracked
- no source/config ambiguity remains
- controlled sandbox is still unmigrated and V2-disabled

# Final Report Required

Report:

1. V2-6C acceptance/checkpoint summary.
2. Git root and branch.
3. Previous HEAD.
4. Existing checkpoint verification.
5. Files classified by category.
6. Files excluded and why.
7. Secret-scan result.
8. Founder acceptance updates.
9. Runtime feature-gate result.
10. Posting/reversal/idempotency/concurrency evidence.
11. API/permission/event/compatibility evidence.
12. Disposable PostgreSQL rehearsal result.
13. Full normal test count.
14. Accessibility test count.
15. `check:all` result.
16. `demo:check` result.
17. Production audit result.
18. Approved raw development-audit exception result.
19. Prisma validate/generate result.
20. Staged file count/stat.
21. Commit hash and message.
22. Tag name and target hash.
23. Final worktree status.
24. Remaining untracked prompt files.
25. Checkpoint report path.
26. Confirmation the controlled sandbox was not migrated, backfilled, reset, provisioned, or V2-enabled.
27. Confirmation no V2-6D UI/navigation/export/dashboard/Process Flow/demo cutover, caching, accents, website assets, modules, Durable Outbox, or Platform Services were implemented.
28. Whether the repository is safely checkpointed through V2-6C.
29. Whether V2-6D is ready for explicit Founder/operator authorization.
30. Whether controlled-sandbox migration/backfill and V2-6D cutover remain blocked.

Stop after the checkpoint.

Do not implement V2-6D in this task.
