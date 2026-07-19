# OneDayOS — Design Preset Lock Package 6B

You are implementing the Founder-approved OneDayOS design preset.

The Theme and Design Preset Audit is complete. The approved preset is:

# OneDayOS Compact

OneDayOS Compact is a custom product preset inspired by compact enterprise interfaces and Mira-like density principles. It is not a direct Mira installation and is not permission to regenerate or overwrite the existing audited component system.

Runtime Light / Dark / System behavior belongs to Package 6C. Organization branding belongs to a later package.

## Approved Decisions

| Dimension | Decision |
|---|---|
| Preset | OneDayOS Compact |
| Components | Keep current audited custom components |
| shadcn posture | Selective source/reference adoption only |
| Primitive migration | None now |
| Font | System UI stack |
| Icons | Lucide |
| Content palette | Zinc-neutral |
| App shell | Deep navy |
| Brand | `#F97316` |
| Primary actions | Brand orange |
| Generic accent | Neutral, never brand orange |
| Semantic states | Red danger, amber warning, green success, blue information |
| Radius | 4px / 6px / 8px |
| Density | Compact-medium |
| Hierarchy | Border-first, minimal shadows |
| Runtime appearance | Light / Dark / System, deferred |
| Organization branding | Name and logo only; accent override deferred |
| Custom CSS/theme builder | Rejected |

## Absolute Restrictions

Do not run `npx shadcn init`, `npx shadcn add`, or any generator that overwrites components.

Do not:

- migrate wholesale to Mira, Vega, Radix, Base UI, or another preset
- create `components.json` merely to imitate shadcn
- add `next-themes`
- implement runtime theme switching
- change theme persistence
- implement organization accent controls
- create a theme builder
- add custom fonts
- change Prisma, migrations, APIs, auth, Inventory business logic, or module behavior
- add new modules, Platform Services, Dynamic Systems, runtime AI, or FastAPI
- use `npm audit fix --force`

## Authority

Read and obey:

- `docs/engineering-manual/03-design-system/THEME-PRESET-AUDIT.md`
- `docs/engineering-manual/03-design-system/00-design-vision.md`
- `docs/engineering-manual/03-design-system/01-brand-system.md`
- `docs/engineering-manual/03-design-system/02-layout-system.md`
- `docs/engineering-manual/03-design-system/03-component-standards.md`
- `docs/engineering-manual/03-design-system/04-table-standards.md`
- `docs/engineering-manual/03-design-system/05-form-standards.md`
- `docs/engineering-manual/03-design-system/06-empty-loading-error-states.md`
- `docs/engineering-manual/03-design-system/07-interaction-motion-standards.md`
- `docs/engineering-manual/03-design-system/08-accessibility-standards.md`
- `docs/engineering-manual/03-design-system/09-ux-constitution.md`
- `docs/engineering-manual/03-design-system/10-page-patterns.md`
- `docs/engineering-manual/14-testing-quality/09-ux-conformance-testing.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0011-human-centred-ux-standard.md`
- `docs/engineering-manual/02-architecture/04-technology-baseline.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`

Inspect existing implementation notes in `docs/engineering-manual/03-design-system/`.

If documents conflict with the approved decisions, stop and report the conflict.

## Repository Safety

Before coding:

1. Run `git status --short`.
2. Record existing changes.
3. Do not reset, restore, delete, or overwrite unrelated work.
4. Limit edits to preset governance, global tokens, shared components/shell styling, focused tests, and stable UX checks.
5. Do not commit unless separately instructed.

## Port

Keep port `1320`.

Verify:

- `npm run dev` uses 1320
- `npm run start` uses 1320
- `.env.example` uses `NEXT_PUBLIC_APP_URL=http://localhost:1320`
- port 3000 appears only in guards or archived/historical docs

## Before Coding Report

Inspect and report:

1. Current dependencies and icon usage.
2. Current `src/app/globals.css` token structure.
3. Current font declarations and whether Inter is loaded.
4. Current light/dark tokens.
5. Button/LinkButton variants and sizes.
6. Input/Field sizing.
7. Surface/Panel/Card geometry.
8. DataTable density.
9. AppShell/sidebar/app-switcher/profile-menu styling.
10. Status badge mappings.
11. Raw colors outside token definitions.
12. Existing design and `check:ux` tests.
13. Planned files.
14. Visual/accessibility regression risks.

Stop for Founder review if architecture is ambiguous. Otherwise proceed.

# Governance

## Create ADR-0012

Create:

`docs/engineering-manual/00-meta/adrs/ADR-0012-onedayos-compact-design-preset.md`

Use:

- Status: Accepted
- Date: 2026-07

Include:

- Context
- Decision
- Preset Definition
- shadcn Adoption Posture
- Typography
- Iconography
- Color Semantics
- Density and Geometry
- Borders and Shadows
- Runtime Appearance Boundary
- Organization Branding Boundary
- Alternatives
- Consequences
- Risks
- Rollback Strategy
- Manual References

State clearly:

- OneDayOS Compact is custom.
- It is Mira-inspired in density, not a Mira installation.
- Current audited components remain.
- shadcn is future source/reference only.
- shadcn CLI cannot overwrite audited components without another ADR.
- system font and Lucide are approved.
- runtime appearance is separate.
- no external design-system certification claim is made.

## Create Preset Specification

Create:

`docs/engineering-manual/03-design-system/13-onedayos-compact-design-preset.md`

Use:

- Status: Frozen
- Implementation Allowed: Yes — OneDayOS Compact preset

Include:

- Purpose
- Character
- Token Map
- Typography
- Iconography
- Density
- Radius
- Borders/Shadows
- Buttons
- Inputs/Forms
- Tables
- Sidebar/Floating Surfaces
- Semantic Colors
- Light/Dark Tokens
- Forbidden Patterns
- Selective shadcn Adoption
- Runtime Appearance Boundary
- Organization Branding Boundary
- Tests

## Narrow Manual Amendments

Update only as needed:

- `docs/engineering-manual/00-meta/00-roadmap.md`
- `docs/engineering-manual/03-design-system/01-brand-system.md`
- `docs/engineering-manual/03-design-system/03-component-standards.md`
- `docs/engineering-manual/02-architecture/04-technology-baseline.md`
- `docs/engineering-manual/03-design-system/THEME-PRESET-AUDIT.md`

Register ADR-0012 and the preset document. Replace stale Inter preference with system UI stack, record Lucide, and record the custom/selective-shadcn posture. Preserve frozen status and note ADR-backed amendment.

## Implementation Note

Create:

`docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-onedayos-compact-preset-lock.md`

Record files changed, dependency/version, token migration, font migration, icon scope, component changes, tests, visual review, non-goals, and follow-up Package 6C.

# Dependency

Inspect whether `lucide-react` exists.

- If absent, add one compatible runtime version.
- If present, reuse it.
- Do not add another icon library, Radix, Base UI, shadcn package, next-themes, or font package.
- Record exact Lucide version.

# Font

Use this stack:

```css
ui-sans-serif,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif
```

Do not add font files, `next/font`, or external font requests. Remove stale Inter-first declarations if Inter is not loaded. Use the same stack for body and headings unless an existing documented reason says otherwise.

# Token Lock

Adapt the current token system rather than creating a parallel one.

Ensure equivalent light and dark semantic tokens exist for:

- background / foreground
- surface / surface-raised / surface-muted
- border / border-strong
- muted / muted-foreground
- brand / brand-foreground
- primary / primary-foreground
- accent / accent-foreground
- destructive / destructive-foreground
- success / success-foreground
- warning / warning-foreground
- information / information-foreground
- focus-ring
- sidebar-background / sidebar-foreground / sidebar-muted / sidebar-hover / sidebar-selected
- popover-background / popover-foreground

Rules:

- `brand = #F97316`
- primary uses orange
- brand and primary may share the base value but keep distinct semantics
- accent remains neutral and must not equal orange
- shell uses a tokenized deep navy
- content uses a zinc-neutral direction
- status meaning is not communicated by color alone
- avoid raw navy/orange in TSX

# Geometry and Density

Lock:

- radius small: 4px
- radius medium: 6px
- radius large: 8px
- compact-medium density

Normalize shared primitives only where needed:

- ordinary controls approximately 34–36px
- small controls approximately 30–32px
- larger form controls approximately 38–40px where justified
- inputs approximately 36–40px
- compact readable table rows
- modest panel padding
- accessible target sizes remain intact

Avoid pills except badges/status.

# Borders and Shadows

Use border-first hierarchy.

- ordinary cards, tables, and panels: borders/surface contrast
- shadows: floating surfaces only (popover, app switcher, profile menu, dropdown, dialog)
- no glow, glassmorphism, or marketing-card shadow everywhere

# Buttons

Normalize shared Button and LinkButton with these variants:

- primary/default
- secondary
- outline
- ghost
- destructive
- link

Sizes where useful:

- sm
- default
- lg
- icon

Rules:

- primary/default = semantic primary orange
- secondary = neutral
- outline = neutral border
- ghost = neutral hover
- destructive = red
- icon-only buttons require accessible labels
- focus/disabled/loading states stay clear
- no raw orange hex/classes in Button source

Do not add excessive cosmetic variants.

# Icons

Use Lucide consistently in shared chrome/common actions, prioritizing:

1. app switcher
2. profile menu
3. sidebar/navigation
4. shared action buttons
5. shared state icons

Do not rewrite every module page merely to add icons.

Rules:

- consistent sizes
- labels remain for important actions
- icon-only buttons have accessible names
- decorative icons are hidden from assistive technology where appropriate
- no emoji as production navigation icons
- no mixed icon libraries

# Shared Components

Inspect actual paths before editing. Likely scope:

- `src/components/ui/button.tsx`
- `input.tsx`
- `field.tsx`
- `badge.tsx`
- `status-badge.tsx`
- `surface.tsx`
- `data-table.tsx`
- `skeleton.tsx`
- state components
- `src/components/onedayos/app-shell.tsx`
- app launcher/switcher/profile components
- page header
- loading skeletons
- shared page patterns

Requirements:

- semantic tokens
- restrained API changes
- preserve behavior and accessibility
- preserve shell/IA
- no broad rewrites

# Runtime Appearance Boundary

Do not implement or alter:

- profile Appearance selection
- Light/Dark/System behavior
- persistence
- system preference listener
- hydration/flicker prevention
- next-themes

Only ensure locked light/dark tokens are compatible with the existing provider. Document issues for Package 6C.

# Tests

Add focused tests.

## Token tests

Verify:

- brand exists and is `#F97316`
- primary exists
- accent exists and is not brand orange
- semantic status tokens exist
- deep-navy sidebar token exists
- system font stack exists
- stale unloaded Inter-first declaration is absent
- 4/6/8 radius tokens exist
- light and dark maps include required semantics
- raw orange is restricted to approved token definitions

## Button tests

Verify semantic variants, sizes, focus behavior, and no raw orange in source.

## Shared component tests

Verify semantic token use, density/radius contract, DataTable accessibility/compactness, Input/Field relationship, ordinary Surface has no excessive shadow, and floating surfaces retain appropriate shadow.

## Icon tests

Verify shared shell/action components use Lucide, no second icon library is introduced, icon-only controls are named, and app switcher remains keyboard accessible.

## Regression tests

Verify app shell structure, app launcher, Inventory navigation, profile menu, and shared UX patterns still work. Verify runtime theme behavior was neither added nor removed.

Avoid brittle full Tailwind-class snapshots.

# check:ux

Add only stable rules if useful:

- required preset tokens exist
- accent is not orange
- stale unloaded Inter is absent
- shared Button does not hardcode orange
- raw orange outside approved token files is rejected
- mixed icon libraries in active source are rejected

Do not enforce every spacing class.

Preserve all existing module UX checks.

# Visual Review

Use the sandbox if available. Do not install Playwright.

Inspect representative pages in available light/dark modes:

- `/onedayosdemo/apps`
- `/onedayosdemo/inventory`
- `/onedayosdemo/inventory/process-flow`
- `/onedayosdemo/inventory/stock-levels`
- `/onedayosdemo/inventory/stock-adjustments/new`
- `/onedayosdemo/organization/people`
- profile menu
- app switcher

Review font consistency, button hierarchy, neutral accent behavior, restrained orange, density, radii, focus, dark contrast, floating shadows, and absence of generic SaaS drift.

Save screenshots under `/tmp` if tooling exists. Otherwise report the limitation.

# Forbidden Changes

Do not modify:

- Prisma/schema/migrations
- Inventory services/APIs/schema
- auth behavior
- module generator
- Organization/Records business behavior
- demo provisioning
- `.env.local`
- runtime appearance behavior
- organization branding
- public deployment automation

Do not run migrations or demo provisioning.

# Verification

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

If Lucide changed, also run:

```bash
npm ls lucide-react
```

Do not run `npm audit fix --force`.

# Final Report

Report:

1. Preset-lock summary.
2. Files inspected.
3. Files created.
4. Files modified.
5. ADR-0012 summary.
6. Preset specification summary.
7. Lucide dependency/version.
8. Token changes.
9. Font changes.
10. Icon migration scope.
11. Button changes.
12. Radius/density changes.
13. Border/shadow changes.
14. `check:ux` changes.
15. Tests added/updated and new total.
16. Accessibility-test result.
17. Visual review and screenshot paths.
18. Port 1320 status.
19. Exact commands/results.
20. `check:all` result.
21. npm audit result.
22. Git diff/status observations.
23. Deviations, if any.
24. Remaining visual/accessibility risks.
25. Confirmation of no Prisma, migrations, Inventory business logic/API, generator, runtime-theme, org-branding, new-module, or wholesale shadcn migration.
26. Whether Package 6B is complete.
27. Whether Package 6C remains blocked pending Founder approval.
28. Whether public website demo approval remains pending.

Stop after this package. Do not proceed to runtime appearance, organization branding, Organization/Records retrofit, public demo preparation, or new modules without Founder approval.
