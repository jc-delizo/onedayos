# V2-6B Migration Rehearsal Report

## Status

Static and Disposable Migration Gates Complete

V2-6B Founder Accepted on 2026-07-25

Sandbox Migration Authorization Pending

Production audit clean.

One approved time-bounded dev-only lint-tooling exception remains.

## Isolated Database Source and Safety

`npm run inventory:v2:migration:rehearse` created a unique, random, no-volume
`postgres:17-alpine` container running PostgreSQL 17.10. Docker bound a dynamic port only to
`127.0.0.1`. The harness generated a random unprinted password and databases under the
`onedayos_v2_6b_` namespace.

The reusable safety gate normalized and compared host/database identities against
`DATABASE_URL`/`DIRECT_URL` from the process and `.env.local`, rejected non-loopback,
non-namespaced, and matching targets, accepted no CLI arguments, and never used a configured URL
as fallback. Cleanup removed the container and `/tmp` checkpoint archive after success and is also
installed for failure, SIGINT, and SIGTERM. The controlled Supabase sandbox was not migrated.

## Fresh Database Rehearsal

Prisma migrate deploy applied all four repository migrations to the disposable fresh database.
Four completed `_prisma_migrations` records were present. Both frozen enums, both new tables,
columns, indexes, tenant-safe foreign keys, and all ten manual CHECK constraints were present.
Legacy tables/fields remained. Organizations and both new tables contained zero rows.

## V2-5 Upgrade Path

The harness extracted the three pre-V2-6B migrations directly from
`inventory-demo-v2-v2.5-checkpoint` into a mode-0600 temporary directory without changing the
main worktree. It created two organizations with deterministic synthetic users, products,
warehouses, balances, four posted adjustments, and four exact movements.

Before and after applying only the V2-6B expand migration, legacy counts remained
`2 organizations : 2 products : 4 warehouses : 4 adjustments : 4 movements : 2 balances`.
Legacy tenant-safe joins still returned all four adjustments. New tables remained empty and both
new movement links remained null. No organization leakage occurred.

## Executable Constraint Verification

Valid rows for Receipt, Issue, Transfer, and Adjustment were accepted. PostgreSQL rejected all 17
required invalid/duplicate cases: number format, self/invalid/duplicate reversal, same transfer
warehouses, all four invalid warehouse shapes, partial idempotency pair, empty unit, nonpositive
line number, negative quantity, partial movement links, movement/line/transaction/org mismatch,
duplicate organization transaction number, and duplicate organization idempotency key.

## Backfill Preflight

Two consecutive read-only runs were byte-identical:

```text
organizationCount: 2
validCount: 4
invalidCount: 0
warningCount: 0
```

Mappings used deterministic identities, exact adjustment/movement matches, current Product unit,
and counted-final quantity, including final zero. Legacy table counts were unchanged.

Twelve separate database-backed invalid scenarios exited nonzero with sanitized issue codes:
missing/wrong-org Product, missing/wrong-org Warehouse, missing User, arithmetic inconsistency,
missing/duplicate/wrong-delta/wrong-result movement, empty Product unit, and orphan movement.
Deterministic collision is additionally rejected by the focused validator test; a relational
fixture cannot persist duplicate legacy primary identity.

## Recovery and Rollback

V2-5 legacy SQL remained readable after expansion, including `StockAdjustment`,
`StockMovement.sourceType`, and `StockMovement.sourceId`. Current application compilation does not
require the migration. Before canonical cutover, operators can roll application code back to V2-5
and leave the additive schema unused. If physical rollback is required, restore the verified
pre-migration backup. No destructive down SQL was created.

## Dependency Gate

Production dependency audit: clean.

Development audit: one approved, time-bounded lint-tooling exception.

The exception is limited to GHSA-mh99-v99m-4gvg through the exact dev-only ESLint/Next lint graph,
expires 2026-08-31, and is enforced by the required audit-policy checker. The raw full audit is not
described as clean.

## Remaining Risks

- Controlled-environment backup/operator approval remains pending.
- The sandbox migration/backfill has not run.
- Shared-environment rehearsal and actual backfill execution remain separately authorized work.
- The dev-tooling exception must be removed on a compatible release or by 2026-08-31.
- V2-6C posting/reversal services remain unimplemented and require explicit Founder authorization.
