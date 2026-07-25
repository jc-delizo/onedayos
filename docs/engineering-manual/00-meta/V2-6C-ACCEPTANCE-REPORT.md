# V2-6C Acceptance Report

Date: 2026-07-25

## Status

Founder Accepted
Sandbox Migration and Cutover Pending

Acceptance Date: 2026-07-25

## Implemented Boundary

- disabled-by-default, server-only Inventory V2 runtime gate;
- strict 1–100-line Receipt, Issue, Transfer, Adjustment, and reversal inputs;
- tenant-scoped canonical posting with exact Decimal arithmetic;
- SHA-256 idempotency and normalized request hashes;
- frozen-format cryptographic transaction numbers;
- Serializable posting with bounded reviewed-conflict retry;
- atomic balance, line, movement, and reversal linkage;
- type-specific list/create APIs plus unified detail/reverse APIs;
- exact permissions and a non-live future Warehouse Operator V2 declaration;
- post-commit best-effort events;
- canonical DTO/query and legacy projection seams without cutover;
- isolated Docker/PostgreSQL posting and concurrency rehearsal.

## Acceptance Evidence

The disposable rehearsal passed Receipt/Issue/Transfer/Adjustment posting and reversal, balance
create/update, paired Transfer movement linkage, insufficient-stock rejection, multi-line rollback,
same-request replay without duplicate event, changed-request idempotency conflict,
double/reversal-of-reversal rejection, cross-tenant reference rejection, organization-scoped
idempotency, and real concurrent Issue negative-stock prevention. It also passed the clarified
100-line Transfer case with exactly 200 movements, maximum-size replay without reposting, and
final-line failure with full rollback.

Normal compiler, lint, unit/API, architecture, UX, Prisma, build, accessibility, dependency, demo,
and server gates are recorded in the final V2-6C execution report for Prompt 53.

## Accepted Delivery Boundary

Production dependency audit is clean. The raw development audit is not clean: it contains only
the approved, time-bounded GHSA-mh99-v99m-4gvg lint-tooling exception, with review due
2026-08-31.

Events remain best effort after commit for the V2-6 MVP. A separate Durable Outbox ADR and
implementation package are mandatory before any external consumer may depend on reliable
delivery.

## Safety and Remaining Gate

The controlled sandbox was not migrated, backfilled, reset, provisioned, or switched to V2.
`.env.local` remains runtime-disabled. V2-6D is the next package eligible for explicit Founder and
operator authorization, but it is not authorized by this acceptance. Controlled-sandbox
migration, backfill, role provisioning, runtime enablement, and UI cutover remain pending.

## Repository Checkpoint

The accepted implementation is checkpointed by the annotated local tag
`inventory-demo-v2-v2.6c-posting-engine`. The tag is local only and is not pushed by this package.
