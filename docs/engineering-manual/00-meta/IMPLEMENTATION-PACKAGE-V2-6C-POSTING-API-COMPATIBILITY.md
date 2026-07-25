# Implementation Package — V2-6C Posting, API, and Compatibility

Status: Founder Accepted on 2026-07-25
Implementation Allowed: Complete — no further V2-6C implementation authorized by this status

## Founder Clarification — 2026-07-25

Prompt 53 authorizes this package and freezes 1–100 create lines. Transfer reversal swaps source
and destination. Adjustment reversal derives inverse movement delta from canonical history and
stores the computed post-reversal counted-final quantity. Receipt/Issue retain their Warehouse and
applicable party. Reversals copy reference context and line metadata, but use a new reason/current
actor/time and do not copy transaction notes.

## Acceptance

V2-6B and V2-6C are Founder Accepted. The controlled-sandbox migration/backfill remains a
separate V2-6D operator gate and was not executed by V2-6C.

## Scope After Authorization

- unified Receipt, Issue, Transfer, Adjustment posting and reversal engine;
- Prisma 7 serializable transactions and bounded known-conflict retries;
- idempotency hashing/replay/conflict behavior;
- strict type-specific APIs and unified detail/reverse;
- exact permissions and idempotent role/grant migration;
- minimal post-commit events and safe emitter-failure logging;
- canonical transaction reads and legacy StockAdjustment compatibility projections;
- service/API/security/concurrency/event tests;
- feature remains disabled until V2-6D cutover.

## Authority

Accepted ADR-0021, Frozen V2-6 documents, Founder Decision/Freeze reports, accepted V2-6B artifacts, Kernel API/auth, SDK DB/permission/event, tenant/security, and test authorities.

## Allowed Files After Authorization

- `src/modules/inventory/**` service/schema/type/event/permission/manifest code and tests;
- Inventory transaction API routes/tests;
- narrowly required permission provisioning/migration code;
- compatibility query/export service adapters without UI exposure;
- V2-6C implementation/acceptance documentation.

## Forbidden

- Prisma schema/migration redesign outside an approved V2-6B correction;
- UI, modal, navigation, dashboard/process-flow current-state, export controls, or demo-data cutover;
- enabling the feature;
- StockAdjustment/source-field removal;
- dependency installation, caching, accents, assets, new module/Platform Service, Outbox, or external integration.

## Safety Gates and Tests

- exact permission/module/tenant gate order and strict no-`orgId` schemas;
- all references active, non-deleted, and same tenant;
- counted-final Adjustment semantics and unit snapshot;
- multi-line atomicity and no negative stock;
- paired zero-net transfer;
- one reversal, no reversal-of-reversal, `REV` numbering;
- exact idempotency errors/replays and number collision bound;
- concurrent Issue/Transfer tests under serializable isolation;
- events after commit, none on failure, safe best-effort failure behavior;
- safe `401/403/404/409/422` envelopes and no raw errors;
- old adjustment IDs/routes/exports continue through canonical projections;
- Warehouse Operator exact grants and denials; no reverse/export grant.

## Rollback

Keep the feature disabled. Revert application readers/writers to accepted V2-6B compatibility state without dropping canonical schema or backfilled data. If any canonical test write occurred, preserve it and forward-fix; never destructively remove posted facts.

## Exit Criteria

- all service/API/security/concurrency/event/compatibility gates pass;
- schema contract remains unchanged or separately reapproved;
- feature remains disabled;
- Founder accepts V2-6C.

## Next Package

V2-6D is ready for explicit Founder/operator approval. This acceptance does not authorize its
implementation or controlled-sandbox migration, backfill, provisioning, enablement, or cutover.
