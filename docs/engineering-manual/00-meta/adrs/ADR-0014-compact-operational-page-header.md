# ADR-0014: Compact Operational Page Header

Status: Accepted
Date: 2026-07
Implementation Timing: V2-1
Implementation Allowed: Only through the approved V2-1 implementation package

## Context

The controlled Inventory demo proved that the current page header is clear but too tall for routine operational pages. Current `PageHeader` has one mode with breadcrumb/eyebrow, title, description, actions, border, and generous spacing. That is appropriate for explanatory pages, but it consumes too much vertical space on high-frequency tables and dashboards.

## Decision

Introduce two page header modes in V2-1:

- Compact Operational Header for tables, dashboards, and routine forms.
- Explanatory Header for onboarding, process explanation, app launcher, and complex concepts.

The page title remains required for accessibility, document structure, and orientation. The compact mode should place title and primary action on one row where responsive space allows, keep breadcrumb compact, and omit or relocate obvious descriptions into contextual help.

## Consequences

- Inventory and shared records pages can become denser without losing orientation.
- Existing pages need an explicit header mode choice.
- Tests must verify headings remain semantic and primary actions remain keyboard reachable.

## Non-Goals

- Removing page titles.
- Replacing sidebar navigation with breadcrumb-only orientation.
- Changing route structure.
- Redesigning all components in the same package.

## Implementation Timing

V2-1 implements the two-mode header model. Compact mode is the default for routine operational list and dashboard pages; explanatory mode remains for Process Flow, onboarding, the app launcher, and complex concepts.
