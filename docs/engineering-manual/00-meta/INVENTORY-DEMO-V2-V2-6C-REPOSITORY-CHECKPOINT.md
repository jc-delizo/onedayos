# Inventory Demo V2 V2-6C Repository Checkpoint

## Status

V2-6C Founder Accepted. This report is included in the checkpoint commit resolved by the
annotated local tag `inventory-demo-v2-v2.6c-posting-engine`.

## Founder Acceptance

The Founder accepted V2-6C Posting Engine, APIs, Permissions, Events, and Compatibility Reads on
2026-07-25. The accepted boundary includes disabled runtime safety, strict posting contracts,
idempotency, Serializable concurrency, atomic balances/movements, all four reversal
representations, exact permissions, best-effort post-commit events, compatibility projections,
and disposable PostgreSQL evidence.

## Git Root and Branch

- Git root: `/home/odoo/jc/test2`
- Branch: `main`

## Previous HEAD

`b439afd12266a03766699f7fdc08f2178a480aba`, tagged
`inventory-demo-v2-v2.6b-foundation`.

Earlier checkpoints remain:

- `inventory-demo-v2-v2.5-checkpoint` → `6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b`
- `inventory-demo-v2-v2.6-governance` → `7acee4f8800bec6d9230ec5fde0d138e20195d54`

## Included Scope

- Inventory V2 transaction schemas, security/decimal utilities, engine, service, DTOs, compatibility
  projections, API error mapping, and route adapters.
- Receipt, Issue, Transfer, Adjustment, unified detail, and reversal API routes.
- Exact permissions, manifest-owned entities/APIs, event contracts, SDK runtime gate, and the
  future-only Warehouse Operator V2 profile.
- Unit/API tests, architecture/UX/Prisma safety gates, and the isolated posting rehearsal.
- V2-6C acceptance, implementation, readiness, handoff, roadmap, and this checkpoint report.

## Runtime Feature Gate

`ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED` is server-only and defaults to `false`. Route and service
gates execute before V2 database access. The production server and controlled sandbox remain
runtime-disabled, and current navigation exposes no V2 transaction UI.

## Posting Engine

Receipt, Issue, Transfer, and counted-final Adjustment post all header, line, movement, and balance
changes atomically. Product/Warehouse/party references are tenant-scoped and active/non-deleted as
applicable. Decimal arithmetic is exact, balance work is deterministic, Transfer movements net to
zero, and negative stock fails the whole operation.

## Idempotency

Create and reverse require `Idempotency-Key`. Only its SHA-256 hash and a stable normalized request
hash are stored. Same-key/same-request returns the original DTO without reposting or duplicate
events. Changed reuse returns `IDEMPOTENCY_KEY_REUSED`; unique races are resolved safely.

## Serializable Concurrency

Posting uses Prisma Serializable transactions and retries only `P2034`, PostgreSQL `40001`, and
`40P01`, with at most three attempts. Domain, permission, validation, and idempotency failures are
not retryable.

## Reversal Model

Reversal creates one linked POSTED `REV` transaction, appends inverse movements, and marks the
original REVERSED without changing original history. Receipt/Issue retain Warehouse and applicable
party; Transfer swaps Warehouses; Adjustment derives the inverse from exact canonical movement
history and stores the resulting counted-final quantity. Double and reversal-of-reversal requests
are rejected.

## APIs and Permissions

Four type-specific GET/POST route pairs plus unified detail and reverse routes use strict JSON
envelopes and safe errors. Permissions are separate for each type's read/create/reverse operation,
with `inventory.transaction.export` separate. The live Warehouse Operator profile is unchanged;
the V2 profile remains declarative for a later authorized cutover.

## Events and Delivery Boundary

Transaction, movement, and balance facts emit only after commit, and idempotent replay emits
nothing. Delivery remains best effort for the V2-6 MVP. A separate Durable Outbox ADR and
implementation package are mandatory before any external consumer depends on reliable delivery.

## Legacy Compatibility

Legacy `StockAdjustment`, routes, dashboard, exports, navigation, and UI remain active. Canonical
projection helpers are included for V2-6D; there is no current write or UI cutover. Prisma schema
and the accepted V2-6B migration are unchanged by V2-6C.

## Disposable PostgreSQL Evidence

The no-argument rehearsal creates a random no-volume PostgreSQL container on a loopback dynamic
port and always removes it. It passed all four posting/reversal types, tenant isolation,
idempotency replay/conflict, rollback, linkage, real concurrent Issue safety, a 100-line Transfer
with exactly 200 movements, maximum-size replay without reposting, and final-line failure with
full rollback.

## Dependency Audit Policy

Production dependency audit is clean. The raw development audit is not clean; it contains only
the approved GHSA-mh99-v99m-4gvg lint-tooling exception, represented by nine wrapper findings.
The exception is dev-only, exact, and expires for review on 2026-08-31.

## Controlled Sandbox Status

The controlled sandbox remains unmigrated, unbackfilled, unprovisioned for V2 permissions, and
runtime-disabled. V2-5 UI and behavior remain active. No reset or canonical demo-data mutation was
performed.

## Excluded Files

Prompt 46 through Prompt 54 remain untracked, unstaged, and uncommitted. `.env.local`, credentials,
screenshots, build outputs, installed dependencies, logs, PID files, audit JSON, database dumps,
Docker state, and `/tmp` evidence are excluded. No V2-6D implementation is included.

## Secret Scan

Pre-stage and staged scans inspect secret indicators without exposing values. Matches are limited
to documented `.env.example` placeholders, environment-contract placeholder tests/defaults, and
the rehearsal's random disposable local PostgreSQL credential. No credential-bearing local
environment file, Supabase secret, sandbox database URL, demo password, private key, bearer token,
dump, or persistent credential is included.

## Quality Gates

Verified with Node 24.18.0 and npm 11.16.0:

- clean `npm ci` and dependency tree;
- production moderate audit with zero findings and the exact dev-exception policy;
- 447 tests across 68 files and 18 accessibility tests across 5 files;
- typecheck, lint, UX, architecture, generated-source, environment, and Prisma checks;
- production build and aggregate `check:all`;
- controlled read-only `demo:check`;
- disposable PostgreSQL posting rehearsal;
- Prisma validate/generate and staged/unstaged diff checks.

## Checkpoint Commit

Commit message:

```text
feat: add Inventory V2 posting and API foundation
```

The immutable hash is resolved through the annotated checkpoint tag to avoid a self-referential
commit document.

## Checkpoint Tag

Annotated local tag:

```text
inventory-demo-v2-v2.6c-posting-engine
```

Tag message:

```text
Accepted Inventory V2 posting, reversal, API, permission, and compatibility foundation
```

The tag is local only and is not pushed by this package.

## Rollback Instructions

Prefer recoverable inspection or a new branch:

```bash
git switch --detach inventory-demo-v2-v2.6c-posting-engine
git switch -c recovery/v2-6c inventory-demo-v2-v2.6c-posting-engine
git diff inventory-demo-v2-v2.6c-posting-engine..HEAD
```

Do not destructively reset later work as the first recovery option. Keep the feature disabled and
forward-fix canonical data if any later environment has posted transactions.

## V2-6D Readiness

V2-6D is ready for explicit Founder/operator approval but remains unauthorized. Controlled-sandbox
migration, backfill, permission provisioning, runtime enablement, and UI/demo cutover remain
blocked. V2-7 and V2-8 remain blocked.
