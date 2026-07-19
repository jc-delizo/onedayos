# OneDayOS — Theme and Design Preset Audit Package 6A

You are performing a focused audit of the current OneDayOS visual preset and theme architecture before any theme implementation or shadcn-style migration.

Automated UX and Accessibility Gates Package 5 has been completed and verified.

The Founder wants OneDayOS to support more than color mode. The Founder specifically raised shadcn customization dimensions such as:

- style families such as Mira, Vega, and related shadcn presets
- primary/button colors
- neutral/base palette
- typography, including system font options
- icon library
- border radius
- component density
- Light / Dark / System runtime appearance

This package is an audit and decision-preparation package only.

Do not change the visual design yet.

Do not install or remove dependencies.

Do not run shadcn generators that overwrite existing components.

Do not implement Light / Dark / System yet.

Do not migrate to Mira, Vega, or another preset yet.

Do not modify Inventory, Organization, Records, Prisma, APIs, auth, generator templates, or business logic.

Do not implement new modules.

Do not add FastAPI.

## Goal

Produce an implementation-grade report that answers:

1. What visual preset and primitive stack does the current OneDayOS code actually use?
2. Which parts are shadcn-derived and which parts are custom OneDayOS components?
3. What tokens currently control primary, brand, accent, neutral, status, radius, font, density, and dark mode?
4. Would adopting Mira, Vega, or another shadcn style require a safe token migration, component regeneration, or broad source replacement?
5. What is the safest recommended OneDayOS design preset?
6. What should be runtime user appearance versus build-time platform design?
7. What exact files would change in the implementation package?
8. What visual regressions must be tested before implementation?

## Product Distinction

Treat these as three separate systems:

### A. Platform Design Preset

A controlled build-time product decision.

Includes:

- structural style direction
- density
- typography
- component geometry
- radius
- icon library
- primary/button behavior
- neutral palette
- table/form spacing

Examples may include Mira, Vega, Nova, or a custom OneDayOS preset.

Users do not switch this from the profile menu.

### B. Runtime Appearance

A user preference:

- Light
- Dark
- System

This belongs in the profile menu and persists per user/browser.

Runtime appearance changes color mode only. It does not switch between Mira and Vega.

### C. Organization Branding

Deferred unless already explicitly implemented:

- organization logo
- limited organization accent
- login-page branding

Organization branding must not allow:

- custom CSS
- custom layouts
- per-client component variants
- arbitrary fonts
- white-label theme builder
- client-specific forks

## Founder Constraints

Preserve these existing OneDayOS principles:

- calm
- compact
- premium
- data-dense
- operational
- businesslike
- predictable
- accessible
- no generic SaaS/admin starter look
- no glassmorphism
- no gradient-heavy decoration
- no playful/bouncy component style
- no arbitrary module colors
- no orange mapped to generic neutral hover/accent behavior

Brand color remains:

```text
#F97316
```

But the audit must determine whether it should map to:

- dedicated brand token
- semantic primary token
- both, with clear separation

Generic `accent` should remain neutral unless the current architecture proves otherwise.

## Local Port Rule

The app must remain on port 1320.

Do not switch back to 3000.

No server restart is required unless needed for screenshot inspection.

## Authoritative Documents

Read and follow:

- `docs/engineering-manual/03-design-system/00-design-vision.md`
- `docs/engineering-manual/03-design-system/01-brand-system.md`
- `docs/engineering-manual/03-design-system/02-layout-system.md`
- `docs/engineering-manual/03-design-system/03-component-standards.md`
- `docs/engineering-manual/03-design-system/07-interaction-motion-standards.md`
- `docs/engineering-manual/03-design-system/08-accessibility-standards.md`
- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0011-human-centred-ux-standard.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`

Inspect current implementation notes under:

- `docs/engineering-manual/03-design-system/`

If the manual and current implementation conflict, report the conflict. Do not silently change code.

## Repository Safety

Before auditing:

1. Run `git status --short`.
2. Record the dirty/untracked state.
3. Do not reset, delete, restore, or overwrite unrelated work.
4. Do not create a commit unless separately instructed.
5. Keep this package documentation-only unless a tiny audit script is absolutely necessary. Prefer no code changes.

## Required Inspection

Inspect and report:

### 1. Project configuration

- `package.json`
- `package-lock.json`
- `components.json`
- `next.config.*`
- `postcss.config.*`
- Tailwind-related configuration
- global CSS entry points
- theme provider files, if any
- current icon dependencies
- current font loading/imports
- current shadcn/base component source

### 2. Visual tokens

Inspect:

- `src/app/globals.css`
- CSS variables
- Tailwind `@theme` blocks
- dark-mode selectors
- semantic token mappings
- raw color usage in component code

Identify current values for:

- brand
- primary
- primary foreground
- accent
- accent foreground
- background
- foreground
- card/surface
- muted
- border
- input
- ring
- destructive
- success
- warning
- info
- radius
- font sans/body/heading
- sidebar tokens, if separate

### 3. Component primitives

Inspect representative components:

- Button / LinkButton
- Input
- Field
- Surface / Panel
- Badge / StatusBadge
- DataTable
- AppShell
- Profile menu
- App switcher
- Dialog/popover/dropdown primitives
- shared page patterns

For each, classify:

- shadcn-derived
- directly customized shadcn source
- custom OneDayOS component
- wrapper around a primitive library
- unclear / needs review

### 4. Primitive library

Determine whether current components use:

- Radix UI
- Base UI
- another primitive library
- custom primitives

Do not assume based only on shadcn terminology.

Inspect imports and package dependencies.

### 5. Current style identity

Determine whether the current source resembles or declares:

- Vega
- Mira
- Nova
- Maia
- Lyra
- Luma
- older New York/default style
- a custom/hybrid OneDayOS style

Do not claim an exact shadcn style unless the repository proves it.

If the current app is already heavily customized, say so.

### 6. Typography

Determine:

- current font family
- whether Inter is actually loaded
- whether a system font stack is used
- whether headings/body differ
- whether font choice affects layout or density
- whether switching to system font is low-risk or high-risk

### 7. Density and geometry

Audit:

- sidebar row height
- button height
- input height
- table row height
- card padding
- page spacing
- radius scale
- border/shadow usage

Describe current density:

- compact
- medium
- spacious
- inconsistent

### 8. Runtime appearance readiness

Determine:

- whether `.dark` class mode already works
- whether system preference is currently respected
- whether a ThemeProvider exists
- whether theme persistence exists
- whether SSR hydration/flicker is currently handled
- whether profile menu Theme item is functional or placeholder
- whether `next-themes` is installed
- whether a local provider would be simpler

Do not implement it yet.

### 9. Accessibility implications

Audit risks of changing preset/font/colors:

- contrast
- focus ring visibility
- touch target size
- table density
- text size
- selected states
- status colors
- dark-mode readability

Reference existing automated gates, but do not claim they cover browser contrast.

### 10. Screenshot/visual evidence

If the running sandbox app is available and authenticated access can be used without printing secrets, inspect representative pages:

- app launcher
- Inventory dashboard
- Inventory Process Flow
- Stock Levels
- New Stock Adjustment
- Organization People
- profile menu
- app switcher

Use existing screenshot capability if available.

Do not install Playwright.

If screenshots cannot be produced, report that limitation.

## Compare Candidate Directions

Compare at least these three options:

### Option 1 — Preserve Current OneDayOS Custom Preset

Keep the current custom source and only formalize tokens, typography, density, and runtime appearance.

Evaluate:

- effort
- risk
- consistency
- visual identity
- future generator reuse

### Option 2 — Migrate Toward Mira

Use Mira as the structural inspiration or source preset because of compact/data-dense goals.

Evaluate:

- whether actual component regeneration would be required
- risk of overwriting custom accessibility/security behavior
- migration effort
- effect on buttons, inputs, tables, sidebar, radius, spacing, and typography
- whether a full migration is justified

### Option 3 — Define “OneDayOS Compact” Hybrid

Keep current audited components but explicitly lock a OneDayOS preset inspired by compact enterprise patterns.

Potential characteristics:

- compact-medium density
- current primitive library retained
- Lucide icons retained
- brand orange for primary actions
- neutral accent/hover states
- neutral or zinc base palette
- restrained radius
- system font or Inter, based on audit
- Light / Dark / System runtime appearance

Evaluate whether this is safer and more maintainable than adopting a named shadcn style wholesale.

## Required Recommendation

Produce one primary recommendation and one fallback.

The recommendation must explicitly decide or flag Founder decisions for:

- structural style direction
- primitive library
- base neutral palette
- primary/brand mapping
- accent mapping
- success/warning/danger/info colors
- font family
- icon library
- radius scale
- component density
- shadow/border strategy
- runtime Light/Dark/System
- organization branding scope

Do not silently decide the font if the manual and current implementation differ.

If Founder choice is required, present a concise decision table.

## Files to Create

Create:

```text
docs/engineering-manual/03-design-system/
  THEME-PRESET-AUDIT.md
```

Optional, only if useful:

```text
docs/engineering-manual/03-design-system/
  THEME-PRESET-DECISION-TEMPLATE.md
```

Do not create an ADR yet unless the repository governance explicitly requires it at the audit stage.

Do not modify frozen design documents in this audit package.

## THEME-PRESET-AUDIT.md Structure

Required sections:

```text
# OneDayOS Theme and Design Preset Audit

## Status

## Current Repository Configuration

## Current Token Map

## Current Component/Primitive Map

## Current Typography

## Current Density and Geometry

## Current Runtime Appearance Readiness

## Accessibility Risks

## Candidate Option 1 — Preserve Current Preset

## Candidate Option 2 — Migrate Toward Mira

## Candidate Option 3 — OneDayOS Compact Hybrid

## Recommended Direction

## Founder Decisions Required

## Proposed Implementation Packages

## Expected Files to Change

## Files That Must Not Change

## Visual Regression Checklist

## Risks and Rollback Strategy
```

Status:

```text
Draft for Founder Review
Implementation Allowed: No — Founder must approve the preset decision first
```

## Proposed Implementation Packages

The audit should propose a safe sequence, likely:

### Package 6B — Design Preset Lock

- formalize tokens
- lock font/radius/density/icon decisions
- update component variants only where necessary
- no runtime theme switching yet
- visual regression tests

### Package 6C — Runtime Appearance

- Light / Dark / System
- profile menu behavior
- persistence
- system preference listener
- hydration/flicker prevention
- appearance tests

### Package 6D — Organization Branding, Deferred

- logo
- controlled accent, only if later approved
- no custom CSS/layouts

Do not implement these packages now.

## Verification

Run documentation/audit-safe commands:

```bash
git status --short
find src/components -maxdepth 4 -type f | sort
find src/app -maxdepth 3 -type f | sort
rg -n "font-family|--color-|--radius|@theme|dark|next-themes|ThemeProvider|theme" src components.json package.json
rg -n "from ['\\\"]@radix-ui|from ['\\\"]@base-ui|lucide-react|class-variance-authority" src package.json
rg -n "#[0-9A-Fa-f]{3,8}|rgb\\(|hsl\\(" src --glob '*.{ts,tsx,css}'
git diff --check
```

Do not run:

- npm install
- shadcn add/init
- migrations
- demo provisioning
- npm audit fix
- code format across the whole repo

You may run existing tests only if needed to understand current configuration, but no test run is required for a documentation-only audit.

## Final Report Required

Report:

1. Audit summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. Current shadcn/custom style determination.
6. Current primitive library.
7. Current font.
8. Current token/brand/accent mapping.
9. Current density/radius.
10. Runtime appearance readiness.
11. Option comparison.
12. Primary recommendation.
13. Fallback recommendation.
14. Founder decisions required.
15. Proposed implementation package sequence.
16. Visual regression risks.
17. Exact commands and results.
18. Confirmation that no application code, dependencies, Prisma, migrations, generator, Inventory, Organization, Records, or runtime theme behavior changed.
19. Whether Theme and Design Preset Audit is ready for Founder review.
20. Whether Design Preset Lock and Runtime Appearance implementation remain blocked pending Founder approval.

Stop after this audit.

Do not implement preset migration, runtime appearance, organization branding, new modules, or other UI changes without Founder approval.
