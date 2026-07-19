# Implementation Note: OneDayOS Compact Preset Lock

Status: Implementation note  
Date: 2026-07  
Package: Design Preset Lock Package 6B

## Summary

The Founder-approved OneDayOS Compact preset is locked as the design target for shared OneDayOS UI.

This pass intentionally keeps the current audited custom components. It does not migrate to Mira, shadcn, Radix, Base UI, or another preset.

## Files Changed

- `src/app/globals.css`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/field.tsx`
- `src/components/ui/surface.tsx`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/onedayos/app-shell.tsx`
- selected Foundation, Records, Organization, and Inventory page call sites where neutral actions needed explicit `secondary` or `outline` variants
- `src/components/onedayos/design-system.test.tsx`
- `src/components/onedayos/theme-tokens.test.ts`
- `src/components/onedayos/app-shell.test.tsx`
- `scripts/check-ux.ts`
- `scripts/check-ux.test.ts`
- selected Engineering Manual governance documents

## Dependency

`lucide-react` was added as the approved icon library for shared chrome and common actions.

No Radix, Base UI, shadcn package, `next-themes`, font package, or second icon library was added.

## Token Migration

The token map now includes semantic roles for:

- background / foreground
- surface / surface-raised / surface-muted
- border / border-strong
- muted / muted-foreground
- brand / brand-foreground
- primary / primary-foreground
- accent / accent-foreground
- destructive / success / warning / information
- focus-ring
- sidebar tokens
- popover tokens

Compatibility aliases remain for older code that still references previous token names.

## Font Migration

The stale Inter-first declaration was replaced with the approved system UI stack.

No font files, `next/font`, or external font request was added.

## Icon Scope

Lucide is applied to shared shell chrome:

- app switcher
- organization/app mark
- profile menu
- Appearance choices
- sign out action

Module pages were not rewritten just to add icons.

## Component Changes

- Button variants now expose primary/default, secondary, outline, ghost, destructive, and link semantics.
- Existing `quiet` and `danger` aliases remain for compatibility.
- Primary/default buttons use semantic primary orange.
- Inputs use semantic invalid and disabled token roles.
- Surfaces are border-first and no longer apply ordinary panel shadow.
- Floating shell popovers use the floating shadow token.
- Status badges map to semantic destructive/information token aliases while preserving existing variant names.

## Tests and Checks

Focused tests were added or strengthened for:

- token families
- system font stack
- raw brand-orange restrictions
- Button variants and sizes
- border-first Surface behavior
- Lucide shell icon presence
- UX checker preset guardrails

`check:ux` now catches stable preset drift such as orange accent, stale Inter, hardcoded orange Button styles, missing Lucide shell chrome, and mixed icon libraries.

## Visual Review

Representative light/dark visual review is still required before public demo claims. Automated tests do not prove browser contrast or screen-reader quality.

## Non-Goals

This package did not change:

- runtime Light / Dark / System behavior
- profile Appearance persistence
- organization branding
- Prisma schema or migrations
- Inventory services, schemas, APIs, or business logic
- module generator behavior
- public demo deployment
- shadcn component generation

## Follow-Up Package 6C

Package 6C remains the place to audit or harden runtime Light / Dark / System behavior. Current runtime appearance code already exists, but this preset lock does not expand it.
