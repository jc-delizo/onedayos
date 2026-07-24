# Modal Interaction Standard

Status: Frozen
Implementation Timing: V2-3
Implementation Allowed: Only through the approved V2-3 implementation package

## Purpose

Create, edit, view, and adjust flows should keep users in operational context while preserving URLs, refresh behavior, and accessibility.

## Standard

Use URL-addressable dialogs or sheets for eligible interactions:

- Desktop: dialog.
- Small screens: sheet or full-screen dialog.
- Direct URL/refresh: full-page fallback.
- Browser back closes modal when entered from a list.
- Permission checks run on the route and service.

## First Targets

- New Stock Adjustment.
- Adjust Stock from Stock Levels row.
- Product view/edit.
- Category view/edit.
- Supplier view/edit.
- Customer view/edit.
- Warehouse view/edit.

## Implementation Direction

Use Next.js App Router Parallel Routes and Intercepting Routes where appropriate. Selective use of Radix Dialog is approved as the scoped accessible primitive. This is not approval for a broad Radix or shadcn migration.

## Rules

- No hidden `orgId` fields.
- No client-submitted previous quantity, new quantity, or balance-after values when the server must compute them.
- Unsaved changes should not be lost without warning once forms become modal.
- Focus must move into the modal and return to the trigger.
- Escape and close buttons must be accessible.

## Tests Required in V2-3

- Intercepted modal opens from list.
- Direct route renders fallback page.
- Back/forward behavior works.
- Focus is trapped and restored.
- Permission denial is safe.
