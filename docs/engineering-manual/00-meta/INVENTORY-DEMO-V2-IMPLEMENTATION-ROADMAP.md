# Inventory Demo V2 Implementation Roadmap

Status: Frozen
Date: 2026-07
Implementation Allowed: One package at a time; V2-6C is next eligible for explicit Founder authorization

Frozen sequence: `V2-1 → V2-2 → V2-3 → V2-4 → V2-5 → V2-6 → V2-7 → V2-8`.

Do not reorder without an ADR or roadmap amendment. Governance approval does not itself authorize implementation.

## Package V2-1: Compact Header and Shared Records IA

Goals:

- Add compact operational header mode.
- Make Shared Records a built-in app.
- Preserve Inventory context for related records, with the Inventory sidebar remaining visible.
- Remove Product Settings from top-level Inventory navigation through a route deprecation plan.
- Preserve Inventory-specific Product settings through a contextual action and full-page fallback.

Likely files:

- `src/components/onedayos/page-header.tsx`
- `src/components/onedayos/patterns/*`
- `src/platform/navigation/*`
- `src/app/[orgSlug]/records/*`
- `src/app/[orgSlug]/inventory/product-settings/*`

Schema impact: none.

Dependency impact: none.

Tests:

- Header mode tests.
- App switcher tests.
- Context-preserving related records tests.
- Route redirect/deprecation tests.

Rollback:

- Restore the previous nav model and header mode; the compatibility route preserves Product Settings access.

Exit criteria:

- Shared Records appears as app only when permitted.
- Inventory sidebar no longer treats Product Settings as top-level.
- No Business Object ownership confusion.
- Direct Shared Records navigation works and is not `OrgModule`-controlled.
- Product Settings remains accessible contextually.

Forbidden:

- Dynamic CRUD.
- New business modules.
- Dependencies, schema changes, modals, tables V2, charts, exports, caching, accents, and public assets.

## Package V2-2: Data Table V2

Goals:

- Add operational table shell.
- Add search, filters, sorting, pagination, row selection, column visibility, row actions, and row click.
- Add Stock Levels per-row Adjust Stock action.

Likely files:

- `src/components/onedayos/data-table-v2.tsx`
- `src/components/onedayos/table-controls/*`
- Inventory and Records list pages.
- Query schemas and tests.

Schema impact: none.

Dependency impact: approved stable `@tanstack/react-table` v8; install only during an explicitly approved V2-2 package.

Tests:

- Search/filter/sort/pagination.
- Keyboard row activation.
- Permission-aware row interaction.
- `orgId` rejection.

Rollback:

- Keep existing `DataTable` as fallback until V2 is stable.

Exit criteria:

- Stock Levels and shared Records use table controls without visual drift.

Forbidden:

- Saved views.
- Reporting service.

## Package V2-3: URL-Addressable Modals

Goals:

- Implement modal routing standard.
- Apply to New Adjustment, Adjust Stock, and shared record view/edit/create.
- Preserve direct page fallback.

Likely files:

- `src/app/[orgSlug]/@modal/*` or approved equivalent.
- Modal primitive wrapper.
- Inventory and Records routes.

Schema impact: none.

Dependency impact: selective Radix Dialog use is approved; install only during an explicitly approved V2-3 package.

Tests:

- Intercepted route opens modal.
- Direct route fallback.
- Focus trap and restore.
- Permission failure behavior.

Rollback:

- Route back to full-page create/edit pages.

Exit criteria:

- Founder can adjust stock from Stock Levels without leaving context.

Forbidden:

- Workflow engine.

## Package V2-4: Dashboard and Process Flow Visual Upgrade

Goals:

- Add real charts to Dashboard.
- Replace card-only Process Flow with accessible directional diagram.
- Keep real data only.

Likely files:

- Dashboard page and service aggregate methods.
- Chart wrapper components.
- Process Flow pattern components.

Schema impact: none unless aggregate query performance requires indexes, which must be reviewed separately.

Dependency impact: Recharts v3 is approved through a small OneDayOS wrapper; install only during an explicitly approved V2-4 package.

Tests:

- Chart data from service only.
- No fake metrics.
- Process diagram accessible text fallback.
- Color is not sole status indicator.

Rollback:

- Fall back to KPI/table dashboard and ordered process cards.

Exit criteria:

- Demo dashboard shows real stock health and trends.

Forbidden:

- Fake chart data.
- Reporting service.

## Package V2-5: Export V1

Goals:

- Add bounded CSV and XLSX export to eligible tables.
- Add export permissions.
- Enforce tenant scope, filters, selected/all filtered scope, column allowlist, and row limits.

Likely files:

- Export service helpers.
- Export route handlers.
- Table export controls.
- Permission constants/seeds.

Schema impact: maybe permission seed/config only.

Dependency impact: `exceljs@4.4.0` is conditionally approved for server-side use behind a replaceable adapter; CSV may use local generation.

Precondition:

- Recheck Node 24 and Next.js 16 compatibility, maintenance/security state, critical advisories, and server-bundle behavior. Stop for Founder review if risk is unacceptable.

Tests:

- Permission denial.
- Tenant isolation.
- Column allowlist.
- CSV injection handling.
- Row limit.
- XLSX generation.

Rollback:

- Remove export controls and routes; keep tables.

Exit criteria:

- Exported files match filtered tenant data and approved columns only.

Forbidden:

- Import engine.
- Background export jobs.

## Package V2-6: Inventory V2 Core Transactions

V2-6A is complete. ADR-0021 is Accepted and the review documents are Frozen.

The frozen lifecycle is posted-only `POSTED → REVERSED`, with separate posted reversal transactions, composite transaction/line movement linkage, counted-final Adjustment lines, expand-contract legacy compatibility, fixed server-generated non-sequential numbers, required idempotency, serializable posting, type-specific APIs, exact least-privilege permissions, best-effort MVP events, and an implementation-grade test matrix.

Implementation order is:

1. V2-6B — Schema, Migration, and Backfill Foundation: Founder Accepted on 2026-07-25; controlled sandbox migration/backfill remains pending.
2. V2-6C — Posting Engine, APIs, Permissions, Events, and Compatibility Reads: Ready for Founder Approval; implementation is not yet authorized.
3. V2-6D — UI, Modals, Navigation, Exports, Demo Cutover, and Acceptance: Blocked.

No subpackage may begin without explicit authorization. Sandbox migration/backfill also requires separate operator approval.

Goals:

- Add Receive Stock, Issue Stock, Transfer Stock, and Adjustment transaction flows.
- Connect Supplier, Customer, Product, and Warehouse meaningfully.
- Generate StockMovement and StockBalance updates transactionally.

Likely files:

- Prisma schema and migration.
- Inventory schemas, services, events, APIs, UI pages, tests.
- Demo provisioning updates.

Schema impact: yes.

Approved model and migration direction:

- Add `InventoryTransaction` and `InventoryTransactionLine`.
- Use `type = RECEIPT | ISSUE | TRANSFER | ADJUSTMENT` and `status = POSTED | REVERSED`.
- Keep existing StockAdjustment initially or backfill through an approved V2-6 migration plan.
- Allow optional shared Customer reference on issues; do not introduce a Party model.

Dependency impact: none required.

Tests:

- Multi-line posting.
- Negative stock rejection.
- Cross-tenant Product/Warehouse/Supplier/Customer rejection.
- Paired transfer movements.
- No partial writes.
- No event on failed mutation.
- Immutable posted transaction behavior and safe reversal.

Rollback:

- Migration rollback plan required before implementation.
- Feature flag new transaction UI until verified.

Exit criteria:

- Demo can show receipts, issues, transfers, adjustments, stock levels, and movement ledger.

Forbidden:

- Purchase Orders.
- Sales Orders.
- Accounting.
- Approvals.
- Notifications.

## Package V2-7: Tenant-Safe Caching

Goals:

- Add narrow caching only after V2 data shape stabilizes.
- Cache tenant-safe reference data and safe aggregates.
- Preserve fresh stock after mutation.

Schema impact: none.

Dependency impact: none expected.

Tests:

- Tenant key isolation.
- Invalidation after mutation.
- Read-your-own-write.
- Cache hit/miss observability.

Rollback:

- Disable cache wrappers and return to direct reads.

Exit criteria:

- Measured cost/latency benefit without stale stock.

Forbidden:

- Global cache enablement.
- Cached auth or PlatformContext.
- Fresh Stock Balances, immediate-freshness Stock Movements, exports, mutations, or cross-tenant responses.

## Package V2-8: Curated Accent Presets

Goals:

- Add curated browser-local accent presets.
- Keep Light/Dark/System.
- Keep brand orange separate from neutral accent semantics.
- Offer Neutral, Orange, Blue, Violet, Emerald, and Rose; default to Neutral.

Schema impact: none.

Dependency impact: none expected.

Tests:

- Preset persistence.
- Contrast checks.
- Semantic colors unchanged.
- No org/user IDs in storage.

Rollback:

- Remove accent selector and return to Light/Dark/System only.

Exit criteria:

- Presets feel polished in app shell, tables, forms, and charts.

Forbidden:

- Theme builder.
- Organization-wide theming.
- Per-client CSS.

## Founder Decisions and Deferred Boundaries

- Shared Records is a built-in permission-aware app, not an `OrgModule`; People remains under Organization.
- Product Settings leaves top-level Inventory navigation in V2-1 but remains accessible contextually. V2-3 owns modal treatment.
- Stable TanStack Table v8, Recharts v3, and selective Radix Dialog use are accepted only in their assigned packages.
- `exceljs@4.4.0` remains conditional until the V2-5 implementation-time audit.
- Unified Inventory transactions and optional Customer-on-issue are frozen for V2-6.
- V2-6B is Founder Accepted. V2-6C is next eligible for explicit Founder authorization. V2-6D and
  controlled sandbox migration/backfill remain blocked.
- Tenant-safe caching is deferred to V2-7 after stabilization and a current Next.js 16 audit.
- Curated accents default to Neutral in V2-8; the OneDayOS mark remains orange and semantic colors remain fixed.
- Website asset production remains paused until V2-1 through V2-6 are complete and audited, capture timing is approved, the controlled demo gates pass, and no Blocker/Must-Fix findings remain.
- Public self-service demo approval and production readiness remain unclaimed.
