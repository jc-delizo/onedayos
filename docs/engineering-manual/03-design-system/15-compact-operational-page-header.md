# Compact Operational Page Header

Status: Frozen
Implementation Timing: V2-1
Implementation Allowed: Only through the approved V2-1 implementation package

## Purpose

Routine business pages need faster vertical scanning than the current explanatory header provides. This frozen specification defines two header modes for V2-1.

## Header Modes

### Compact Operational Header

Use for:

- Table/list pages.
- Dashboards.
- Routine create/edit forms.
- Inventory stock pages.
- Shared Records list pages.

Required structure:

- Compact breadcrumb or context label.
- Page title.
- Primary action on the same row when space allows.
- Optional small contextual help below the title when the relationship is not obvious.

Default spacing target:

- No large bottom border block.
- Tight vertical rhythm.
- Preserve heading semantics with a single `h1`.
- Actions remain keyboard reachable.

### Explanatory Header

Use for:

- App launcher.
- Process Flow.
- Onboarding.
- Architecture-heavy or concept-heavy pages.

Required structure:

- Breadcrumb or context label.
- Title.
- Short description.
- Optional primary action.

## Rules

- Do not remove page titles.
- Do not rely only on sidebar navigation for orientation.
- Do not duplicate global app/org identity in page headers.
- Do not make headings hero-sized inside operational app pages.

## Tests Required in V2-1

- Compact mode renders `h1`, breadcrumb, and primary action.
- Explanatory mode renders description.
- Long titles and actions do not overlap on mobile.
- Accessibility tree remains correct.
