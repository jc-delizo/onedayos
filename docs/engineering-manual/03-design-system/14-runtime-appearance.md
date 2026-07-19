# OneDayOS Engineering Manual — 03 Design System / 14 Runtime Appearance

Status: Frozen  
Implementation Allowed: Yes — Runtime Appearance  
Owner: Founder / Platform Architecture  
Last Updated: 2026-07  
ADR: `00-meta/adrs/ADR-0013-runtime-appearance-preference.md`

---

# Purpose

This document freezes the OneDayOS runtime appearance contract.

Runtime Appearance controls how the existing OneDayOS Compact token maps resolve at runtime. It does not define a new visual preset, client theme system, organization branding feature, or white-labeling layer.

# Appearance Values

Supported preference values:

- `light`
- `dark`
- `system`

No additional values are allowed without another ADR.

# Default

The default preference is `system`.

# Persistence

The preference is browser-local and stored under:

```text
onedayos.appearance
```

The implementation may read an older `onedayos-theme` key for compatibility, but the canonical storage key is `onedayos.appearance`.

# DOM Contract

The root `<html>` element is the contract surface.

Dark preference:

```text
class includes dark
data-appearance="dark"
data-resolved-appearance="dark"
```

Light preference:

```text
class does not include dark
data-appearance="light"
data-resolved-appearance="light"
```

System preference:

```text
data-appearance="system"
data-resolved-appearance="light" or "dark"
class includes dark only when system resolves to dark
```

The implementation must also set `document.documentElement.style.colorScheme` or an equivalent standards-based mechanism.

# Pre-Hydration Script

The root layout may emit a tiny static inline script to prevent obvious light/dark flash before React hydration.

The script must:

- read the saved preference
- validate it against `light`, `dark`, and `system`
- fall back to `system`
- resolve `prefers-color-scheme`
- apply or remove the `dark` class
- set `data-appearance`
- set `data-resolved-appearance`
- set `color-scheme`
- survive storage and media-query failures

If a future Content Security Policy blocks inline scripts, do not weaken CSP silently. Add a nonce/hash strategy or return for architecture review.

# System Preference Listener

When preference is `system`, the provider listens for `prefers-color-scheme` changes and updates the resolved appearance live.

When preference is `light` or `dark`, system changes must not override the explicit preference.

Listeners must be cleaned up on unmount or preference changes.

# Profile Menu Contract

The profile menu must expose:

- Profile
- Appearance
- Sign out

Appearance must expose:

- Light
- Dark
- System

Selected state must be visible and not color-only. Icon-only triggers need accessible names. Sign out and Profile behavior must not regress.

# Accessibility

Appearance controls must be keyboard reachable, have accessible names, expose selected state semantically, and preserve visible focus in light and dark mode.

This document does not claim formal WCAG certification.

# Light/Dark Token Expectations

Runtime Appearance resolves the existing OneDayOS Compact token maps.

Required token roles include:

- background
- foreground
- surface
- surface-raised
- surface-muted
- border
- muted text
- primary
- accent
- destructive
- success
- warning
- information
- sidebar
- popover
- focus ring

Brand remains `--color-brand: #F97316`. Primary may use brand orange. Generic accent remains neutral and must not be mapped to brand orange.

# Failure/Fallback Behavior

If storage is unavailable, use `system` in memory and keep the UI usable.

If `matchMedia` is unavailable, resolve `system` to `light`.

If a stored value is invalid, ignore it and fall back to `system`.

Do not render raw storage or browser API errors to users.

# Data/Tenancy Boundary

Runtime Appearance must not:

- use `orgId`
- submit tenant identity
- call APIs
- add Prisma fields or models
- depend on organization membership
- import server-only SDK or Kernel code

# Organization Branding Boundary

Runtime Appearance is not organization branding.

Forbidden in this package:

- organization custom colors
- client CSS
- theme builders
- preset switchers
- white-labeling
- custom layouts

# Testing Requirements

Tests must cover:

- default `system`
- light and dark explicit modes
- system resolution from `matchMedia`
- live system changes
- persistence
- invalid stored values
- storage failure
- DOM data attributes
- `color-scheme`
- profile-menu Appearance controls
- selected state
- no API/DB/tenant coupling
- no `next-themes`
- token semantics, especially brand vs accent

# Forbidden Patterns

Forbidden:

- `--color-accent: #F97316`
- `next-themes` without Founder approval
- Prisma appearance fields
- theme API routes
- organization appearance settings
- `orgId` in appearance state
- per-client CSS or theme directories
- route-based appearance state
- full-screen loaders only to determine appearance
