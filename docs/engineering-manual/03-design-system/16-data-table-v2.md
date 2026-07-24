# Data Table V2

Status: Frozen
Implementation Timing: V2-2
Implementation Allowed: Only through the approved V2-2 implementation package

## Purpose

OneDayOS operational pages need dense, fast, permission-aware tables without adopting a generic admin-dashboard visual style.

## Current Gap

The current shared `DataTable` renders accessible table markup, loading, empty state, and row actions. It does not yet provide search, filters, sorting, pagination UI, row selection, column visibility, row click behavior, or export actions.

## Required Capabilities

- Search with server-validated query shape.
- Allowlisted filters.
- Sorting.
- Pagination.
- Row selection.
- Column visibility.
- Row actions.
- Clickable and keyboard-openable rows.
- Loading, empty, filtered-empty, and error states.
- Server-side mode for larger tables.
- Permission-aware actions.
- Export actions for eligible tables.
- URL/query-state persistence where useful.

## Approved Engine

Use stable `@tanstack/react-table` v8 as a headless table state engine. OneDayOS keeps its own markup, tokens, density, empty states, loading states, permission behavior, and server/API architecture. Do not use a beta major.

## Accessibility Rules

- Table remains semantic.
- Row opening must work through keyboard Enter/Space.
- Focus must be visible.
- Action cells must not trigger row navigation accidentally.
- Screen-reader labels must identify filters, actions, and selected rows.

## Forbidden

- Table mega-library that owns visual design.
- Client-side export from hidden untrusted data.
- Search/filter parameters that accept `orgId`.
- Saved views or reporting service in V2 table package.
- Modal routing, charts, exports, caching, or other later-package work in V2-2 unless separately authorized.
