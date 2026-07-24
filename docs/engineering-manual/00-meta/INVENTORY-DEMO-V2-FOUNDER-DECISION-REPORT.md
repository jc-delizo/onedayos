# Inventory Demo V2 Founder Decision Report

Status: Frozen
Date: 2026-07
Decision Authority: OneDayOS Founder
Implementation Allowed: One package at a time; only V2-1 is authorized next

Inventory Demo V2 direction approved.
Implementation is authorized one package at a time.
Only V2-1 is authorized next.

## Approved Decisions

- Use compact and explanatory page-header modes. Compact is the operational default; page titles remain semantic.
- Make Shared Records a permission-aware built-in app containing Products, Product Categories, Customers, Suppliers, and Warehouses. It is not controlled by `OrgModule`; People remains under Organization.
- Preserve Inventory app context and sidebar when users enter shared records from Inventory. Reuse shared services, APIs, and components.
- Remove Product Settings from top-level Inventory navigation in V2-1 while retaining contextual access and a documented compatibility/deprecation route. V2-3 owns later modal treatment.
- Adopt stable `@tanstack/react-table` v8 headlessly in V2-2 while retaining OneDayOS markup, styling, permissions, states, and server/API architecture.
- Use URL-addressable modals with direct full-page fallbacks in V2-3. Next.js App Router Parallel and Intercepting Routes are the approved routing direction; Radix Dialog may be used selectively.
- Use Recharts v3 through a small OneDayOS wrapper in V2-4. Charts must use real service-backed data and accessible non-color-only summaries.
- Implement bounded server-side CSV/XLSX export with separate permissions, tenant scoping, allowlisted filters/sort/columns, selected or filtered scope, row limits, and safe filenames in V2-5.
- Use unified `InventoryTransaction` and `InventoryTransactionLine` models for receipt, issue, transfer, and adjustment in V2-6.
- Permit an optional shared `customerId` on stock issues. Do not create a generic Party model or imply CRM/Sales Orders exist.
- Defer selective tenant-safe caching to V2-7 after query/mutation stabilization and a current Next.js 16 audit.
- Add browser-local Neutral, Orange, Blue, Violet, Emerald, and Rose accent presets in V2-8, with Neutral as default. The OneDayOS mark remains orange; semantic colors remain fixed.

## Conditional Decision

`exceljs@4.4.0` is conditionally approved for V2-5, server-side only, behind a small replaceable OneDayOS adapter. Before implementation, recheck Node 24 and Next.js 16 compatibility, maintenance/security state, critical advisories, and server-bundle behavior. It must not enter client bundles. An unacceptable audit result requires Founder review; no substitute may be selected silently.

## Rejected Alternatives

- A visual table mega-library or beta major.
- Native `<dialog>` as the initial modal primitive.
- A broad Radix or shadcn migration.
- `xlsx` as the selected V2-5 library.
- Separate receipt, issue, and transfer model families.
- A generic Party model.
- Broad Import/Export Engine, reporting service, saved views, or background exports.
- Global caching or caching of auth, PlatformContext, mutations, exports, fresh stock, or incompletely scoped tenant data.
- Theme builder, arbitrary component colors, custom client CSS, or organization-wide arbitrary palettes.
- Inventory-owned copies of shared Product, Category, Supplier, Customer, or Warehouse identities.

## Deferred Capabilities

- V2-2 through V2-8 remain blocked until each package receives explicit Founder approval.
- Purchase Orders, Sales Orders, accounting, approvals, notifications, lots, serials, expiry, bins, background jobs, Platform Services, Dynamic Systems, runtime AI, and FastAPI remain outside this V2 scope.
- Tenant-safe caching is deferred to V2-7 after stabilization.
- Accent presets are deferred to V2-8.

## Frozen Package Order

1. V2-1 — Compact Header + Shared Records IA
2. V2-2 — Data Table V2
3. V2-3 — URL-Addressable Modals
4. V2-4 — Dashboard Charts + Process Flow Diagram V2
5. V2-5 — CSV/XLSX Export V1
6. V2-6 — Inventory V2 Core Transactions
7. V2-7 — Tenant-Safe Caching
8. V2-8 — Curated Accent Presets

Reordering requires an ADR or roadmap amendment.

## Website Asset Pause

Website screenshot/video asset production remains paused until V2-1 through V2-6 are complete and audited, V2-8 is stable or earlier capture is explicitly approved, controlled demo reset/check passes, and no Blocker or Must-Fix findings remain.

## Readiness Status

- Public-demo status: not approved for public release; the controlled demo remains the only approved demo posture.
- Production-readiness status: not production-ready; existing production, security, operational, backup/restore, and V2 package gates still apply.
- V2-1 handoff: documented and ready for explicit Founder approval.
- Later V2 packages: blocked.
