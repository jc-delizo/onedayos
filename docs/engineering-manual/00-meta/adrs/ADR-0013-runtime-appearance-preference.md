# ADR-0013: Runtime Appearance Preference

Status: Accepted  
Date: 2026-07  
Owner: Founder / Platform Architecture  
Applies To: OneDayOS runtime appearance behavior, root layout, app shell profile menu, and design-system tests

---

# Context

ADR-0012 froze the OneDayOS Compact design preset, but intentionally left runtime Light / Dark / System behavior to a separate package. The application already had a local browser-side theme provider, pre-hydration script, and profile-menu Appearance choices. Package 6C approves hardening that local implementation instead of adding a new theming dependency.

# Decision

OneDayOS supports exactly three runtime appearance preferences:

- Light
- Dark
- System

This is a personal browser-local preference for MVP. It is not organization configuration, not a database-backed user setting, not a white-labeling system, and not a theme builder.

# Preference Values

The implementation values are:

```ts
type AppearancePreference = 'light' | 'dark' | 'system'
type ResolvedAppearance = 'light' | 'dark'
```

# Default Behavior

The default preference is `system`.

Resolution is:

- `light` resolves to `light`
- `dark` resolves to `dark`
- `system` resolves from `prefers-color-scheme`

If `matchMedia` is unavailable, `system` safely resolves to `light`.

# Persistence

The preference is stored in browser `localStorage` using:

```text
onedayos.appearance
```

The implementation may read the previous `onedayos-theme` key for compatibility, but new writes use `onedayos.appearance`.

# Pre-Hydration Application

The root layout emits a small static inline bootstrap script before interactive application code. The script reads and validates the saved preference, resolves the active appearance, updates the root `<html>` class and data attributes, and sets `color-scheme`.

The inline script is intentionally static and local. It does not contain secrets, environment variables, tenant identifiers, or network calls.

# System Preference Changes

When the selected preference is `system`, the runtime provider listens to `prefers-color-scheme` changes and updates the resolved appearance live. Explicit `light` and `dark` choices are not overridden by operating-system changes.

# Accessibility

The profile menu exposes Appearance choices as keyboard-reachable controls with non-color-only selected state through radio semantics, check icon/text, and visible selected styling.

The implementation does not claim formal WCAG conformance or certification.

# Data and Tenancy Boundary

Runtime appearance must not:

- add Prisma fields or models
- add API routes
- store `orgId`
- submit tenant identity
- depend on organization membership
- call server-only SDK or Kernel code

# Organization Branding Boundary

Runtime appearance does not approve organization custom colors, client-specific CSS, white-labeling, theme builders, custom layouts, or organization-wide appearance settings. Organization Branding remains deferred.

# Alternatives Considered

## Add `next-themes`

Rejected for now. The existing local provider is small, testable, and compatible with OneDayOS Compact. Adding `next-themes` would add dependency surface without a current need.

## Store Preference in the Database

Rejected for MVP. A browser-local preference is sufficient and avoids tenant or account-setting complexity.

## Organization-Level Theme Setting

Rejected for this package. That belongs to a future Organization Branding decision.

# Consequences

- Light / Dark / System behavior is approved and hardened.
- The DOM contract becomes testable through root data attributes.
- Theme behavior remains independent of organizations, modules, APIs, and Prisma.
- Existing browser preferences stored under the old key can continue to work during transition.

# Risks

- Inline bootstrap scripts may conflict with a future strict Content Security Policy unless nonce/hash support is added.
- Automated tests do not prove all real-browser contrast outcomes.
- Browser privacy settings may block `localStorage`; the app must still remain usable.

# Rollback Strategy

If runtime appearance causes unacceptable regressions:

1. Revert the provider, bootstrap script, profile-menu behavior, and tests as a file group.
2. Keep OneDayOS Compact tokens intact.
3. Default the root to light mode until a revised runtime package is approved.

# Manual References

This ADR is registered by or amends:

- `03-design-system/14-runtime-appearance.md`
- `03-design-system/13-onedayos-compact-design-preset.md`
- `03-design-system/THEME-PRESET-AUDIT.md`
- `03-design-system/IMPLEMENTATION-NOTE-runtime-appearance.md`
- `00-meta/00-roadmap.md`

# Implementation Notes

The Package 6C implementation hardens the existing local provider. It does not add `next-themes`, Prisma fields, APIs, organization branding, custom client CSS, shadcn/Radix migration, Inventory logic, generator logic, or new modules.
