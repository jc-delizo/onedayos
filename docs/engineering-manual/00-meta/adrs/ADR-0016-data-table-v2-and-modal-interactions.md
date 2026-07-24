# ADR-0016: Data Table V2 and Modal Interactions

Status: Accepted
Date: 2026-07
Implementation Timing: V2-2 for Data Table V2; V2-3 for modal interactions
Implementation Allowed: Only in the package assigned to each capability

## Context

The current `DataTable` is intentionally small and semantic. It renders headers, rows, actions, loading, and empty states, but it does not support operational table behavior such as search, filters, sorting, pagination controls, row selection, column visibility, row click, or export affordances. Current create/edit flows navigate to full pages instead of URL-addressable modals.

## Decision

Build Data Table V2 around a reusable OneDayOS table shell using stable `@tanstack/react-table` v8 as its headless engine. OneDayOS retains its own markup, styling, permission behavior, states, and server/API architecture.

Build URL-addressable modal interactions for create/view/edit/adjust flows using Next.js App Router Parallel Routes and Intercepting Routes where appropriate, with direct full-page fallbacks. Selective use of Radix Dialog is approved as the accessible primitive; this does not approve a broad Radix or shadcn migration.

## Required Behavior

- Search, allowlisted filters, sorting, pagination, row selection, column visibility, row actions, clickable rows, loading, empty, filtered-empty, error, and server-side mode.
- Pointer and keyboard row activation with explicit action cells that do not accidentally trigger row opening.
- Users with update permission open edit modal; read-only users open view modal.
- Direct URLs and refreshes must have full-page fallbacks.
- Server authorization remains authoritative.

## Consequences

- This is a platform capability, not just an Inventory UI fix.
- Shared Records and Inventory should migrate to the same table contract.
- Tests must cover keyboard row activation, permission-aware row mode, URL modal fallback, and action-cell propagation.

## Non-Goals

- Installing a visual table mega-library.
- Building Dynamic CRUD.
- Implementing import/export engine in this ADR.

## Implementation Timing

- V2-2: Data Table V2 and stable `@tanstack/react-table` v8.
- V2-3: URL-addressable modal routing and selective Radix Dialog use.

Neither capability is authorized in V2-1.
