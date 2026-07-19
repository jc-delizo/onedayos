# OneDayOS — Runtime Appearance Hardening Package 6C

You are implementing the approved OneDayOS runtime appearance system.

OneDayOS Compact Design Preset Package 6B has been completed and verified.

The Founder explicitly approves Runtime Appearance Hardening Package 6C only.

This package implements and/or hardens the user-facing appearance preference:

- Light
- Dark
- System

Runtime appearance changes color mode only.

It must not change the OneDayOS Compact design preset, component geometry, typography, iconography, radius, density, navigation, or organization branding.

## Approved Product Decision

The profile menu must expose:

```text
Appearance
  Light
  Dark
  System
```

Behavior:

- Default: `System`
- Light: always use light tokens
- Dark: always use dark tokens
- System: follow the operating system/browser preference
- Preference persists across reloads
- System mode responds live when the operating-system preference changes
- The correct mode is applied before the page becomes visible, to avoid a light/dark flash
- Appearance is a user/browser preference for this MVP
- No organization-wide appearance setting
- No database field
- No API
- No client-supplied `orgId`
- No theme builder
- No switch between Mira/Vega/OneDayOS Compact
- No custom CSS per client

## Absolute Scope Boundaries

Do not:

- alter OneDayOS Compact token semantics except for a tiny compatibility fix
- migrate components to shadcn, Radix, Base UI, Mira, Vega, or another preset
- add `next-themes` unless the existing local provider is proven unfixable and you stop for Founder approval first
- add another theme dependency
- add organization color controls
- add custom fonts
- add custom CSS support
- add per-client component variants
- modify Prisma
- add migrations
- modify Inventory business logic or APIs
- modify Organization or Records business behavior
- modify the module generator
- implement new modules
- implement Platform Services, Dynamic Systems, runtime AI, background jobs, or FastAPI
- make public website demo claims

## Primary Implementation Authority

Read and follow:

- `docs/engineering-manual/03-design-system/THEME-PRESET-AUDIT.md`
- `docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/01-brand-system.md`
- `docs/engineering-manual/03-design-system/03-component-standards.md`
- `docs/engineering-manual/03-design-system/07-interaction-motion-standards.md`
- `docs/engineering-manual/03-design-system/08-accessibility-standards.md`
- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0012-onedayos-compact-design-preset.md`
- `docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-onedayos-compact-preset-lock.md`

Also obey:

- `docs/engineering-manual/02-architecture/02-repository-architecture.md`
- `docs/engineering-manual/02-architecture/05-dependency-rules.md`
- `docs/engineering-manual/14-testing-quality/04-ui-testing.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`

If these documents conflict, stop and report the conflict instead of inventing a resolution.

## Repository Safety

The worktree may contain many existing changes.

Before coding:

1. Run `git status --short`.
2. Record current changed and untracked files.
3. Do not reset, delete, restore, or overwrite unrelated work.
4. Do not restore the historical implementation.
5. Keep edits scoped to appearance state, root layout integration, profile-menu behavior, tests, documentation, and narrowly necessary token compatibility.
6. Do not create a commit unless separately instructed.

## Local Port Rule

The app must remain on port `1320`.

Do not switch back to `3000`.

Verify:

- `npm run dev` uses port 1320
- `npm run start` uses port 1320
- `.env.example` uses `NEXT_PUBLIC_APP_URL=http://localhost:1320`
- active app configuration does not use localhost:3000
- port 3000 appears only in rejection guards or archived/historical documentation

## Goal

Deliver a small, dependency-free or existing-provider-based appearance system that is:

- hydration-safe
- flash-resistant
- persistent
- accessible
- keyboard-usable
- compatible with Server Components
- compatible with the existing OneDayOS Compact light/dark token maps
- reusable by all current and future modules
- independent of tenant/business data

## Before Coding

Inspect and report briefly:

1. Current appearance/theme provider files.
2. Current root layout integration.
3. Current `<html>` class/data attributes.
4. Current dark-mode CSS selector and token maps.
5. Current profile menu Appearance UI.
6. Whether the Appearance controls are functional or placeholders.
7. Current persistence method, if any.
8. Current system-preference listener, if any.
9. Current pre-hydration/no-flash behavior, if any.
10. Current tests for appearance behavior.
11. Current screenshots proving light/dark rendering.
12. Files you plan to create.
13. Files you plan to modify.
14. Any hydration, CSP, or accessibility ambiguity.

If there is a real architecture ambiguity, stop and wait for Founder approval.

If the existing provider already satisfies part of this package, preserve it and harden only the missing behavior. Do not rewrite working code merely to match a preferred file name.

# Governance and Documentation

## 1. Create ADR-0013

Create:

```text
docs/engineering-manual/00-meta/adrs/
  ADR-0013-runtime-appearance-preference.md
```

Metadata:

```text
Status: Accepted
Date: 2026-07
```

Required sections:

- Context
- Decision
- Preference Values
- Default Behavior
- Persistence
- Pre-Hydration Application
- System Preference Changes
- Accessibility
- Data and Tenancy Boundary
- Organization Branding Boundary
- Alternatives Considered
- Consequences
- Risks
- Rollback Strategy
- Manual References
- Implementation Notes

The Decision must state:

- OneDayOS supports `light`, `dark`, and `system`.
- `system` is the default.
- Appearance is a browser/user preference in MVP.
- Appearance is not stored in Prisma.
- Appearance is not organization configuration.
- Runtime appearance does not change the OneDayOS Compact preset.
- No formal accessibility or design-system certification claim is made.

## 2. Create runtime appearance specification

Create:

```text
docs/engineering-manual/03-design-system/
  14-runtime-appearance.md
```

Metadata:

```text
Status: Frozen
Implementation Allowed: Yes — Runtime Appearance
```

Required sections:

- Purpose
- Appearance Values
- Default
- Persistence
- DOM Contract
- Pre-Hydration Script
- System Preference Listener
- Profile Menu Contract
- Accessibility
- Light Token Expectations
- Dark Token Expectations
- Failure/Fallback Behavior
- Data/Tenancy Boundary
- Organization Branding Boundary
- Testing Requirements
- Forbidden Patterns

## 3. Amend roadmap and related docs narrowly

Update as needed:

```text
docs/engineering-manual/00-meta/00-roadmap.md
docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md
docs/engineering-manual/03-design-system/THEME-PRESET-AUDIT.md
```

Register ADR-0013 and the runtime appearance document.

Preserve frozen status and note the ADR-backed amendment.

## 4. Create implementation note

Create:

```text
docs/engineering-manual/03-design-system/
  IMPLEMENTATION-NOTE-runtime-appearance.md
```

Include:

- existing provider audit
- files created/modified
- persistence key
- DOM contract
- no-flash approach
- system-listener behavior
- profile-menu behavior
- tests
- screenshots
- explicit non-goals
- no database/API/organization theme setting
- Organization Branding remains deferred

# Appearance Contract

Use this canonical type:

```ts
export type AppearancePreference = 'light' | 'dark' | 'system'
```

Use a stable storage key:

```text
onedayos.appearance
```

If an existing stable key already exists and changing it would break users, preserve it and document the decision.

## Resolved appearance

Resolved mode is:

```ts
type ResolvedAppearance = 'light' | 'dark'
```

Resolution:

```text
light  -> light
dark   -> dark
system -> matchMedia('(prefers-color-scheme: dark)')
```

# DOM Contract

Use the root `<html>` element.

Required behavior:

## Dark

```text
<html class="dark" data-appearance="dark" data-resolved-appearance="dark">
```

## Light

```text
<html class does not contain "dark"
      data-appearance="light"
      data-resolved-appearance="light">
```

## System

```text
data-appearance="system"
data-resolved-appearance="light" or "dark"
class="dark" only when the system preference resolves to dark
```

Also set:

```text
document.documentElement.style.colorScheme = resolvedAppearance
```

or an equivalent standards-based mechanism.

Do not use separate light/dark route trees.

Do not add appearance state to URLs.

Do not add `orgId`.

# Pre-Hydration / No-Flash Requirement

The saved preference and resolved mode must be applied before React hydration and before the page visibly paints where practical.

Preferred approach:

- a tiny inline bootstrap script in the root layout, emitted before interactive application code
- or preserve/harden an existing equivalent implementation

The script must:

1. Read the saved preference from localStorage.
2. Validate it against `light`, `dark`, `system`.
3. Fall back to `system`.
4. Resolve the current system preference.
5. Apply/remove the `dark` class.
6. Set `data-appearance`.
7. Set `data-resolved-appearance`.
8. Set `color-scheme`.
9. Fail safely if storage access throws.

Keep the script small and deterministic.

Do not expose secrets.

Do not use `dangerouslySetInnerHTML` without an explicit, reviewed reason. If an inline script requires it in Next.js, keep content static, local, and documented.

If a Content Security Policy exists and blocks inline scripts, stop and report the conflict rather than weakening CSP.

Use `suppressHydrationWarning` on `<html>` only if required by the implementation and document why.

# Runtime Provider

Create or harden a provider, for example:

```text
src/components/onedayos/appearance-provider.tsx
```

or preserve the current equivalent path.

Required public API:

```ts
type AppearanceContextValue = {
  preference: AppearancePreference
  resolvedAppearance: 'light' | 'dark'
  setPreference: (preference: AppearancePreference) => void
}
```

Provide a hook such as:

```ts
useAppearance()
```

Requirements:

- client-only provider
- does not import server-only code
- does not import Prisma
- does not call APIs
- does not accept `orgId`
- validates stored values
- persists valid preference
- updates DOM immediately
- updates system resolution live only while preference is `system`
- cleans up media-query listeners
- does not create duplicate listeners on rerender
- survives localStorage failures
- does not throw if matchMedia is unavailable in tests/non-browser contexts
- does not make layout wait for a network request

# Profile Menu Contract

The existing profile menu must expose:

```text
Profile
Appearance
Sign out
```

Appearance opens a submenu/popover/menu containing:

- Light
- Dark
- System

Requirements:

- selected preference is visibly indicated with text and/or check icon
- selected state is not color-only
- each option has an accessible name
- menu is keyboard accessible
- selection applies immediately
- selection persists
- menu closes after selection if current menu behavior supports it
- Sign out behavior remains unchanged
- Profile behavior remains unchanged
- no page reload required
- no duplicate Appearance controls elsewhere unless intentionally documented

Use existing Lucide icons:

- Sun
- Moon
- Monitor or Laptop
- Check where useful

Do not add another icon library.

# Appearance Fallback Behavior

If storage is unavailable:

- use `system`
- keep the application usable
- do not show a blocking error

If matchMedia is unavailable:

- resolve `system` to light
- keep the application usable

If a stored value is invalid:

- ignore it
- fall back to system
- optionally replace it with `system` on the next valid write

Do not render raw storage errors to the user.

# Token Compatibility

Do not redesign tokens.

Verify the OneDayOS Compact light and dark maps support:

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

Only make tiny compatibility corrections if a token is missing or clearly broken.

Brand/primary/accent rules remain:

```text
brand = #F97316
primary = brand orange
accent = neutral
```

Do not map accent to orange.

# Files to Create

Expected, subject to existing implementation:

```text
src/components/onedayos/
  appearance-provider.tsx
  appearance-menu.tsx

src/components/onedayos/__tests__/
  appearance-provider.test.tsx
  appearance-menu.test.tsx

docs/engineering-manual/00-meta/adrs/
  ADR-0013-runtime-appearance-preference.md

docs/engineering-manual/03-design-system/
  14-runtime-appearance.md
  IMPLEMENTATION-NOTE-runtime-appearance.md
```

If equivalent provider/menu files already exist, modify them rather than duplicate them.

Optionally create:

```text
src/lib/appearance.ts
```

for shared-safe constants/pure functions only.

Do not put appearance types in Kernel.

# Files to Modify

Expected:

```text
src/app/layout.tsx
src/components/onedayos/app-shell.tsx
src/components/onedayos/index.ts
src/app/globals.css
```

Modify only where needed.

Potentially update focused tests for the profile menu/app shell.

Do not broadly refactor unrelated shell code.

# Tests

Use existing Vitest + Testing Library setup.

## Pure resolution tests

Test:

- valid stored `light`
- valid stored `dark`
- valid stored `system`
- invalid stored value falls back to `system`
- `system` resolves from matchMedia
- missing matchMedia falls back safely
- storage read failure falls back safely

## Provider tests

Test:

- default preference is `system`
- setting `dark` adds `dark` class
- setting `light` removes `dark` class
- setting `system` follows current media query
- preference persists to storage
- DOM data attributes update
- `color-scheme` updates
- system media-query change updates resolved mode when preference is `system`
- system media-query change does not override explicit `light` or `dark`
- media listener is removed on cleanup
- provider does not access APIs
- provider accepts no `orgId`

## Pre-hydration script tests

Use stable source-contract or unit tests.

Verify the script:

- reads `onedayos.appearance`
- validates allowed values
- defaults to system
- applies/removes `dark`
- sets data attributes
- sets `color-scheme`
- catches storage failures
- contains no secret/env references
- contains no tenant/org references

Avoid brittle exact-string snapshots of minified script formatting.

## Appearance menu tests

Test:

- Profile, Appearance, and Sign out remain present
- Appearance exposes Light, Dark, System
- current preference is indicated non-visually as well as visually
- selecting Light calls `setPreference('light')`
- selecting Dark calls `setPreference('dark')`
- selecting System calls `setPreference('system')`
- all options are keyboard reachable
- icon-only triggers have accessible names
- sign-out behavior is not regressed

## Accessibility tests

Extend `test:a11y` coverage for:

- profile menu trigger
- appearance options/menu
- selected appearance state

Use the existing axe helper.

Do not claim full WCAG conformance.

## Regression tests

Verify:

- OneDayOS Compact tokens remain unchanged in semantics
- app launcher still works
- app switcher still works
- Inventory navigation still works
- Organization app visibility rules remain unchanged
- profile and sign-out remain usable
- no organization appearance setting exists
- no database/API calls were added
- no `next-themes` dependency was added

# `check:ux` Enhancements

Add only stable rules, if useful:

- runtime appearance document exists
- appearance provider/menu exists
- allowed preference values are light/dark/system
- storage key is stable
- no `next-themes` dependency
- no appearance Prisma field/model
- no `orgId` in appearance files
- no generic accent-to-orange regression
- no custom client CSS/theme directory

Do not make brittle checks for component internals.

Preserve all existing official-module and OneDayOS Compact checks.

# Manual Visual Review

Use the running sandbox if available.

Do not install Playwright.

If authenticated review is available without printing secrets, inspect:

- `/login`
- `/register`
- `/onedayosdemo/apps`
- `/onedayosdemo/inventory`
- `/onedayosdemo/inventory/process-flow`
- `/onedayosdemo/inventory/stock-levels`
- `/onedayosdemo/inventory/stock-adjustments/new`
- `/onedayosdemo/organization/people`
- profile menu
- appearance submenu

Verify in Light:

- readable contrast
- neutral surfaces
- orange primary actions
- visible focus
- table readability
- sidebar readability

Verify in Dark:

- no pure-black/neon treatment
- deep navy shell remains clear
- neutral surfaces distinguish hierarchy
- muted text remains readable
- status colors remain understandable
- focus remains visible
- popovers/menu remain readable

Verify in System:

- it matches current OS preference
- changing OS preference updates live while menu is on System, if feasible

Check reload persistence.

If screenshot tooling is available, save:

```text
/tmp/onedayos-appearance-light-*.png
/tmp/onedayos-appearance-dark-*.png
/tmp/onedayos-appearance-system-*.png
```

Report paths.

If authenticated screenshots are not possible, report the limitation honestly.

# Documentation Update to UX Conformance

Update:

```text
src/modules/inventory/UX-CONFORMANCE.md
```

only if appearance testing provides new truthful evidence.

You may record:

- Light/Dark/System automated behavior tested
- selected accessibility tests passed
- authenticated visual appearance review completed, only if actually completed

Do not claim representative-user validation.

Do not claim public demo approval.

# Forbidden Changes

Do not modify:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- Inventory services/APIs/schema
- auth behavior
- module generator
- Organization or Records business behavior
- demo provisioning
- `.env.local`
- public deployment automation
- shadcn preset
- Lucide version unless a genuine compatibility issue is found
- system font decision
- OneDayOS Compact radius/density

Do not run migrations.

Do not run demo provisioning.

Do not add browser automation.

# Verification Commands

Run:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run check:ux
npm run test:a11y
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm run check:all
npm audit --audit-level=moderate
git diff --check
git status --short
```

Do not run:

```bash
npm audit fix --force
```

If the server is available, use port 1320 for smoke and visual checks.

# Final Report Required

Report:

1. Runtime Appearance Package summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. ADR-0013 summary.
6. Runtime appearance specification summary.
7. Existing provider audit result.
8. Storage key.
9. DOM contract.
10. Pre-hydration/no-flash implementation.
11. System preference listener behavior.
12. Profile menu behavior.
13. Tests added or strengthened.
14. Updated total test count.
15. Accessibility test result.
16. `check:ux` changes.
17. Visual review result and screenshot paths, if any.
18. Persistence/reload result.
19. System-mode live update result.
20. Port 1320 status.
21. Exact verification commands and results.
22. `check:all` result.
23. npm audit result.
24. Git diff/status observations.
25. Any deviations from the approved runtime appearance decision.
26. Any unresolved hydration, CSP, browser, or accessibility risks.
27. Confirmation that no Prisma, migrations, Inventory business logic, APIs, generator, Organization branding, shadcn migration, new modules, or per-client themes were added.
28. Whether Runtime Appearance Package 6C is complete.
29. Whether Organization Branding remains deferred.
30. Whether public website demo approval remains pending.

Stop after this package.

Do not proceed to Organization Branding, Organization/Records retrofit, public demo preparation, deployment automation, or new modules without Founder approval.
