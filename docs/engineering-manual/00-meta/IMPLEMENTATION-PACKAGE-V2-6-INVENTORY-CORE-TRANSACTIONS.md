# Implementation Package — V2-6 Inventory Core Transactions

Status: Superseded by staged V2-6B, V2-6C, and V2-6D handoffs
Implementation Allowed: No

## Objective

This combined package is retained as historical V2-6A planning context. It must not be implemented as one change set. Accepted ADR-0021 and the frozen review documents are now delivered only through V2-6B, then V2-6C, then V2-6D, with separate acceptance gates.

## Required Design Inputs

- `V2-6-SCHEMA-MIGRATION-REVIEW.md`
- `V2-6-TRANSACTION-SEMANTICS.md`
- `V2-6-MIGRATION-BACKFILL-PLAN.md`
- `V2-6-TEST-MATRIX.md`
- `adrs/ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- frozen Inventory V2 specification and ADR-0020

## Authorized Scope After Future Approval

- approved Prisma schema and reviewed migration;
- tenant-aware dry-run/backfill/verification tooling;
- canonical transaction schemas, services, permissions, events, APIs, routes, presenters, tables, forms, exports, and tests;
- compatibility adapters for current adjustment URLs and exports;
- dashboard/process-flow mapping;
- controlled demo V2 data and second Warehouse.

Approval must explicitly cover schema/migration/data mutation before those actions occur.

## Package Order

1. Resolve Founder decisions and mark ADR-0021 Accepted.
2. Freeze exact schema and migration SQL review.
3. Add schema/migration and backfill tests without touching shared environments.
4. Implement expand-compatible reads and feature flag.
5. Run sandbox migration/backfill/reconciliation.
6. Implement serializable posting/reversal service and events.
7. Implement strict APIs and compatibility routes.
8. Implement permission seed migration and role evidence.
9. Implement UI/navigation/modals/tables/exports.
10. Update dashboard/process flow and controlled demo reset/provisioning.
11. Run the full V2-6 test, security, accessibility, build, migration, rollback, and demo gates.
12. Founder acceptance before public-demo or production consideration.

## Non-Negotiable Contracts

- one unified transaction/line model;
- Product, Warehouse, Supplier, and Customer remain shared Business Objects;
- posted-only creation; immutable posted history; reversal instead of edit/delete;
- no negative stock;
- paired, zero-net transfers;
- counted-final Adjustment request with server-computed delta;
- multi-line atomicity and concurrency safety;
- tenant-safe composite relations and strict `PlatformContext`;
- no client `orgId`;
- separate read/create/reverse/export permissions;
- events after commit with minimal payloads;
- expand-contract migration and no destructive same-package cleanup;
- existing URLs do not silently break.

## Forbidden Scope

No Purchase Orders, Sales Orders, accounting, valuation/costing, approvals, notifications, lots/serials/expiry/bins, attachments, background jobs, caching, accents, import engine, new module, Platform Service, website assets, or public/production release claim.

## Rollback Boundary

Before canonical writes, disable the feature and roll application code back while preserving legacy tables. After canonical writes, never drop or reverse the new schema destructively; disable writes and forward-fix. The legacy table remains until a later separately approved contract migration.

## Required Acceptance Evidence

- exact schema/migration diff and reviewed SQL;
- dry-run/backfill logs without sensitive data;
- zero mismatch/orphan/cross-tenant counts;
- two-org migration and security tests;
- serializable concurrency evidence;
- complete test matrix;
- accessibility and responsive review;
- bounded export verification;
- exact canonical demo balances;
- rollback/forward-fix rehearsal;
- clean dependency, architecture, Prisma, type, lint, test, and production-build gates.

## Superseding Handoffs

- `IMPLEMENTATION-PACKAGE-V2-6B-SCHEMA-MIGRATION-BACKFILL.md`
- `IMPLEMENTATION-PACKAGE-V2-6C-POSTING-API-COMPATIBILITY.md`
- `IMPLEMENTATION-PACKAGE-V2-6D-UI-DEMO-CUTOVER.md`

Founder design decisions are resolved in ADR-0021 and the V2-6 Founder Decision Report. Only V2-6B is eligible for explicit authorization next. No implementation is authorized by this superseded document.
