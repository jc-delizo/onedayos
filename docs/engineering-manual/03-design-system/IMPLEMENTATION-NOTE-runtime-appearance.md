# Implementation Note: Runtime Appearance Package 6C

Status: Implementation note  
Date: 2026-07  
Package: Runtime Appearance Hardening Package 6C

## Summary

Runtime Light / Dark / System appearance is implemented as a personal browser-local preference.

The package hardens the existing local provider and bootstrap script rather than adding `next-themes`.

## Existing Provider Audit

Before this pass, the repository already had:

- a local `ThemeProvider`
- a root pre-hydration script
- profile-menu Appearance choices
- localStorage persistence
- `prefers-color-scheme` support

Gaps hardened in this package:

- canonical storage key changed to `onedayos.appearance`
- previous `onedayos-theme` key is read as compatibility fallback
- root DOM now sets `data-appearance`
- root DOM now sets `data-resolved-appearance`
- `color-scheme` is set by both script and provider
- storage failures still apply a safe System fallback
- provider exposes `useAppearance()` with `resolvedAppearance`
- old `ThemeProvider` / `useThemePreference` exports remain as compatibility aliases

## Files Changed

- `src/app/layout.tsx`
- `src/components/onedayos/appearance-provider.tsx`
- `src/components/onedayos/theme-provider.tsx`
- `src/components/onedayos/theme-script.ts`
- `src/components/onedayos/app-shell.tsx`
- `src/components/onedayos/index.ts`
- `src/components/onedayos/theme-provider.test.tsx`
- `src/components/onedayos/app-shell.test.tsx`
- `src/components/onedayos/patterns/__tests__/accessibility.test.tsx`
- `scripts/check-ux.ts`
- `scripts/check-ux.test.ts`

## Storage Key

Canonical key:

```text
onedayos.appearance
```

Compatibility read-only fallback:

```text
onedayos-theme
```

## DOM Contract

The root `<html>` receives:

- `class="dark"` only when resolved appearance is dark
- `data-appearance="light" | "dark" | "system"`
- `data-resolved-appearance="light" | "dark"`
- `style.colorScheme = "light" | "dark"`

## No-Flash Behavior

The root layout uses a small static inline script to apply the saved/resolved appearance before React hydration. `suppressHydrationWarning` remains on `<html>` because the script intentionally mutates root attributes before hydration.

If a future strict Content Security Policy blocks inline scripts, add a nonce/hash solution or return for architecture review. Do not weaken CSP silently.

## System Listener

The provider listens to `prefers-color-scheme` only when preference is `system`, updates resolved appearance live, and cleans up listeners.

Explicit Light and Dark preferences are not overridden by OS changes.

## Profile Menu

Appearance remains inside the sidebar profile menu. There is no second theme button in the sidebar or header.

Options:

- Light
- Dark
- System

Selected state uses radio semantics plus check/text, not color only.

## Tests

Automated tests cover:

- default System behavior
- Light/Dark updates
- persistence
- legacy key fallback
- system change listener
- listener cleanup
- storage and matchMedia failure fallback
- pre-hydration script contract
- profile menu Appearance behavior
- axe coverage for the profile menu and Appearance options
- `check:ux` runtime appearance guardrails

## Non-Goals

This package did not add:

- Prisma fields
- API routes
- organization settings
- organization branding
- per-client CSS
- theme builders
- `next-themes`
- shadcn/Radix migration
- Inventory business logic
- generator changes
- new modules

## Public Demo Status

This package does not approve public website demo claims. Runtime appearance is MVP-complete, but public demo approval remains pending broader manual review.
