# Data Table, Modal, and Export Testing

Status: Frozen
Implementation Timing: Test authority for V2-2 through V2-5
Implementation Allowed: Apply the relevant section only in its authorized package

## Purpose

Data Table V2, URL-addressable modals, and bounded export touch security, accessibility, and tenant isolation. Tests must prove more than happy-path rendering.

This document authorizes test requirements, not early implementation: Data Table coverage applies in V2-2, modal coverage in V2-3, chart/process accessibility coverage in V2-4 where relevant, and export coverage in V2-5.

## Data Table Tests

Required coverage:

- Search submits only allowlisted query keys.
- Filters reject `orgId` and unknown keys.
- Sorting and pagination preserve tenant scope.
- Row selection is visible and keyboard accessible.
- Column visibility does not expose disallowed fields.
- Row click opens view/edit according to permission.
- Action-cell clicks do not also trigger row opening.
- Loading, empty, filtered-empty, and error states are contextual.

## Modal Tests

Required coverage:

- Intercepted modal route opens from list.
- Direct modal URL renders full-page fallback.
- Browser back closes modal.
- Focus is trapped and restored.
- Escape and close controls work.
- Permission denial returns safe UI or JSON as appropriate.
- Form validation preserves safe entered values.

## Export Tests

Required coverage:

- Export requires explicit export permission.
- Export uses tenant-scoped server data.
- Export applies current filters and sort.
- Selected-row export exports only selected permitted rows.
- Column allowlist excludes internal IDs unless explicitly approved.
- Row-count limit is enforced.
- Filename is safe.
- CSV injection protections are applied.
- XLSX output is generated server-side.

## Accessibility Tests

- Keyboard-only table and modal walkthrough.
- Screen-reader labels for search, filters, selected rows, row actions, and modal titles.
- Color is not the only status indicator.
