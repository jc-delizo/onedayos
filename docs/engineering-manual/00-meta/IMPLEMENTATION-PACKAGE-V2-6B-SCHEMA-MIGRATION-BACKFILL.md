# Implementation Package — V2-6B Schema, Migration, and Backfill Foundation

Status: Founder Accepted on 2026-07-25
Implementation Allowed: Complete — no further V2-6B implementation authorized by this status

## Scope

Prepare the additive database foundation only:

- approved Prisma enums/models/relations/indexes;
- migration SQL and safe CHECK constraints;
- nullable canonical StockMovement linkage;
- User composite tenant key needed by actor relations;
- dry-run/backfill and verification tooling;
- migration/backfill/schema tests;
- disabled feature flag/config scaffolding only when required.

No new canonical write cutover occurs in V2-6B.

## Authority

ADR-0020, accepted ADR-0021, all four Frozen V2-6 review documents, V2-6 Founder Decision Report, V2-6 Freeze Report, Prisma/data/migration/security authorities, and the checkpoint tag.

## Allowed Files After Explicit Authorization

- `prisma/schema.prisma`;
- one or more narrowly reviewed `prisma/migrations/<approved-v2-6b-name>/migration.sql`;
- tenant-aware `scripts/db/*v2-6*` dry-run/backfill/verification files and tests;
- schema/migration architecture tests;
- minimal feature flag/config files with feature disabled;
- V2-6B implementation/acceptance documentation.

Package/lock files and dependencies are not required and remain forbidden.

## Forbidden

- sandbox/staging/production migration execution without separate environment-specific approval;
- data mutation outside an explicitly approved backfill execution;
- posting/reversal services, APIs, permission/event changes, canonical read/write cutover;
- UI, navigation, export, dashboard/process-flow current state, or demo reset/data changes;
- cleanup/drop of StockAdjustment or source fields;
- V2-7/V2-8, caching, accents, website assets, module, or Platform Service work.

## Safety Gates

- exact baseline/tag and clean authorized scope;
- schema-to-ADR field/enum/relation audit;
- generated SQL review for tenant FKs, checks, defaults, locks, and reversibility;
- no required column added to existing populated rows;
- dry-run before execute; bounded 250-row tenant batches;
- deterministic/idempotent legacy mapping;
- zero silent repair, cross-tenant link, orphan, mismatch, or partial movement link;
- backup/restore and forward-fix plan before any shared-environment execution;
- sandbox migration remains a separate operator decision.

## Tests

- empty database full migration chain;
- current demo snapshot with nine adjustments;
- two organizations and cross-tenant attacks;
- each corrupt-history rejection;
- deterministic rerun and divergent-existing-row rejection;
- transaction/line/movement composite integrity;
- exact number/reference-date/idempotency nullable legacy shape;
- schema index/constraint inspection;
- rollback before canonical writes and forward-fix rehearsal.

No V2-6 application behavior is claimed by schema tests.

## Rollback

Before canonical writes, disable the feature and remove only new verified links/rows through a reviewed forward/down procedure while leaving legacy Adjustment, Movement, and Balance facts untouched. Never drop populated canonical tables after cutover. Failed batch execution rolls back that batch and stops.

## Exit Criteria

- reviewed schema and migration match every frozen decision;
- all migration/backfill tests pass;
- dry-run and validation evidence show zero unexplained mismatches;
- no shared database was mutated without separate approval;
- StockAdjustment remains intact/read-only;
- Founder accepts V2-6B.

## Dependency

V2-6C is eligible for explicit Founder approval. V2-6B acceptance does not authorize V2-6C or
sandbox migration/backfill execution.
