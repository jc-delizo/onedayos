# Inventory Demo V2 V2-6B Repository Checkpoint

## Status

V2-6B Founder Accepted. This report is included in the checkpoint commit resolved by the
annotated local tag `inventory-demo-v2-v2.6b-foundation`.

## Founder Acceptance

The Founder accepted V2-6B Schema, Migration, and Backfill Foundation on 2026-07-25. Accepted
evidence includes the frozen schema contract, expand-only migration, fresh and V2-5 upgrade
rehearsals, executable database constraints, legacy compatibility, deterministic read-only
preflight, production dependency cleanliness, and the documented temporary lint-tooling
exception.

Production dependency audit: clean.

Development audit: one approved, time-bounded lint-tooling exception.

## Git Root and Branch

- Git root: `/home/odoo/jc/test2`
- Branch: `main`

## Previous HEAD

`7acee4f8800bec6d9230ec5fde0d138e20195d54`, tagged
`inventory-demo-v2-v2.6-governance`.

The earlier V2-5 checkpoint remains
`6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b`, tagged
`inventory-demo-v2-v2.5-checkpoint`.

## Included Scope

All intended paths were classified before staging:

- A — Prisma/migration foundation: `prisma/schema.prisma` and the one additive V2-6B migration.
- B — scripts/tests: stable Prisma foundation checks, deterministic preflight validation,
  disposable rehearsal/safety fixtures, and focused tests.
- C — dependency/audit policy: compatible dependency remediation, exact exception policy/checker,
  CI enforcement, and the existing server-only ExcelJS configuration.
- D — governance/reports: acceptance, rehearsal, security, readiness, roadmap, client delivery,
  package handoffs, and this checkpoint report.
- E — package/lock/CI/config: intended package scripts, lockfile, Next config, and workflow.
- F — Prompt 46 through Prompt 51: authorized untracked task inputs, excluded.
- G — `.env.local` and local credentials: ignored and excluded.
- H — `.next`, `node_modules`, logs, audit JSON, Docker runtime state, and `/tmp` evidence:
  ignored or outside the repository and excluded.
- I — unrelated or ambiguous paths: none.

The narrow route-modal timer cleanup and regression test are included because Prompt 50 discovered
the lifecycle defect during the required full gate. They cancel only an obsolete fallback after
route unmount and do not add Inventory or V2-6C behavior.

## Prisma Schema and Migration

The checkpoint adds the frozen `InventoryTransaction` and `InventoryTransactionLine` schema,
enums, indexes, tenant-safe composite relations, manual checks, and nullable canonical movement
links. The one migration is expand-only and preserves all legacy tables and fields. It was not
applied to the controlled sandbox.

## Backfill Foundation

The deterministic preflight is read-only, sanitized, paged, and fails closed on tenant, state,
arithmetic, movement, chain, balance, reference, unit, orphan, ambiguity, or collision errors.
The controlled-sandbox read-only result remains 9 valid, 0 invalid, and 0 warnings. No backfill
executor is included or run.

## Disposable Migration Evidence

PostgreSQL 17.10 fresh deployment and V2-5 checkpoint upgrade rehearsals passed in an automatically
removed loopback-only Docker container. All four migrations, frozen database objects, unchanged
legacy counts, empty new tables, null new links, four accepted transaction shapes, 17 rejected
constraint cases, deterministic valid preflight, 12 database-backed invalid scenarios, and V2-5
rollback compatibility were verified.

## Dependency Audit Policy

The production moderate audit is a strict zero-finding gate. The exact policy checker fails on any
additional or changed advisory, production/direct occurrence, root/version mismatch, critical
severity, non-dev lock node, or expiry. CI keeps the raw full audit visible, requires the policy
checker, and bounds lint execution.

## Development-Tooling Exception

- Advisory: GHSA-mh99-v99m-4gvg
- Package: `brace-expansion`
- Scope: dev-only stable ESLint/Next lint tooling
- Review by: 2026-08-31
- Owner: Platform Security

The raw full development audit is not clean. Remove the exception when a coherent stable patched
lint stack becomes available or at the review deadline, with earlier review on any frozen graph or
advisory metadata change.

## Excluded Files

Prompt 46 through Prompt 51 remain untracked, unstaged, and uncommitted. `.env.local`, build
outputs, installed dependencies, logs, PIDs, audit JSON, database dumps, Docker files, screenshots,
and temporary evidence are excluded. No prompt, secret, or runtime artifact is part of the
checkpoint.

## Secret Scan

The pre-stage and staged scans inspect indicator names without printing values. Only documented
indicator examples, environment key names, and clearly synthetic test literals are permitted.
No credential-bearing local environment file, Supabase secret, database URL, demo password,
private key, bearer token, database dump, or generated rehearsal credential is included.

## Quality Gates

Verified under Node 24.18.0 and npm 11.16.0:

- clean `npm ci` and valid dependency tree;
- production audit with zero findings and exact dev-exception policy;
- 439 tests across 66 files;
- 18 accessibility tests across 5 files;
- typecheck, lint, UX, architecture, generated-source, environment, and Prisma checks;
- production build and aggregate `check:all`;
- controlled read-only `demo:check`;
- Prisma validate/generate;
- unstaged and staged diff checks.

## Controlled Sandbox Status

The controlled Supabase sandbox remains unmigrated. V2-6B backfill was not executed and no
sandbox data was mutated. Migration/backfill/cutover remains an explicit operator gate for V2-6D
unless the frozen roadmap is separately amended.

## Checkpoint Commit

Commit message:

```text
feat: add Inventory V2 transaction schema foundation
```

The immutable hash is resolved through the annotated checkpoint tag to avoid a self-referential
commit document.

## Checkpoint Tag

Annotated local tag:

```text
inventory-demo-v2-v2.6b-foundation
```

Tag message:

```text
Accepted Inventory V2 schema, expand migration, and backfill foundation
```

The tag is local only and is not pushed by this package.

## Rollback Instructions

Prefer recoverable inspection or a new branch:

```bash
git switch --detach inventory-demo-v2-v2.6b-foundation
git switch -c recovery/v2-6b inventory-demo-v2-v2.6b-foundation
git diff inventory-demo-v2-v2.6b-foundation..HEAD
```

Do not destructively reset later work as the first recovery option. The accepted expand schema may
remain unused during application rollback; physical database rollback requires restoring an
operator-verified pre-migration backup.

## V2-6C Readiness

V2-6C is the next package eligible for explicit Founder authorization. Implementation remains
disallowed until that authorization is given. V2-6D and controlled-sandbox migration/backfill
remain blocked.
