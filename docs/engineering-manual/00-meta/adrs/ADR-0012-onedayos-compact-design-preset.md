# ADR-0012: OneDayOS Compact Design Preset

Status: Accepted  
Date: 2026-07  
Owner: Founder / Platform Architecture  
Applies To: OneDayOS design system, shared UI primitives, app shell, official modules, generator UX output, and visual QA

---

# Context

The Theme and Design Preset Audit found that the current OneDayOS UI is a custom audited component stack, not an active shadcn/Radix preset installation. The application already has custom OneDayOS primitives, a persistent app shell, contextual loading states, design-system tests, and UX checks.

The Founder approved a named preset so future UI work has a stable target and does not drift toward a generic SaaS starter or a wholesale external preset migration.

# Decision

OneDayOS adopts the **OneDayOS Compact** design preset.

OneDayOS Compact is a custom product preset. It is Mira-inspired in density and enterprise restraint, but it is not a Mira installation. It does not permit shadcn CLI regeneration, component overwrites, or migration to a different primitive library without another ADR.

Current audited custom components remain the implementation base.

# Preset Definition

OneDayOS Compact is:

- premium, calm, operational, and data-dense
- compact-medium in spacing
- zinc-neutral in content palette
- deep navy in the authenticated app shell
- brand-orange only where intentional
- border-first with minimal shadows
- built from the existing custom OneDayOS primitive layer

OneDayOS Compact is not:

- a full Mira, Vega, shadcn, Radix, or Base UI migration
- a theme builder
- an organization-specific theme system
- a white-labeling system
- an external design-system certification claim

# shadcn Adoption Posture

shadcn/ui remains useful as future source and reference material, but OneDayOS does not currently use a live shadcn component installation.

Rules:

- Do not run `npx shadcn init`.
- Do not run `npx shadcn add`.
- Do not create `components.json` merely to imitate shadcn.
- Do not overwrite audited OneDayOS components with generated component files.
- Selective source adoption requires review and must preserve OneDayOS tokens, security boundaries, accessibility behavior, and tests.

# Typography

OneDayOS Compact uses a system UI stack:

```css
ui-sans-serif,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif
```

Inter is not loaded in the current app and must not remain as an unloaded first-choice declaration. No custom font files, `next/font`, or external font requests are added by this preset.

# Iconography

Lucide is the approved icon family for shared chrome and common actions.

Initial adoption priority:

1. app switcher
2. profile menu
3. sidebar/navigation
4. shared action buttons
5. shared state icons

Do not mix icon libraries. Icon-only controls require accessible names.

# Color Semantics

The brand token remains:

```css
--color-brand: #F97316;
```

Primary actions use semantic primary orange. Brand and primary may share the same base color, but they remain separate token roles.

Generic accent is neutral and must not equal brand orange.

Semantic state colors remain separate:

- destructive: red
- warning: amber
- success: green
- information: blue
- neutral: zinc-neutral
- brand: OneDayOS orange

# Density and Geometry

OneDayOS Compact locks:

- small radius: `4px`
- medium radius: `6px`
- large radius: `8px`
- compact-medium density
- ordinary controls around 34-36px
- small controls around 30-32px
- form controls around 36-40px where justified
- compact readable table rows
- modest panel padding

Avoid pills except badges and status indicators.

# Borders and Shadows

Hierarchy is border-first.

Use borders and surface contrast for ordinary cards, tables, panels, forms, and page regions.

Use shadows only for floating surfaces such as app switchers, profile menus, dropdowns, popovers, dialogs, and toasts.

Do not add glow, glassmorphism, or marketing-card shadows.

# Runtime Appearance Boundary

Runtime Light / Dark / System behavior is separate from this ADR.

This ADR locks token semantics so the existing runtime appearance provider can resolve light and dark surfaces, but it does not approve changes to:

- theme persistence
- system preference listeners
- hydration/flicker prevention
- `next-themes`
- profile Appearance behavior

# Organization Branding Boundary

Organization branding is limited to organization name and future logo support unless another package approves more.

This ADR does not approve:

- organization accent colors
- per-client CSS
- custom layouts
- theme builders
- white-labeling

# Alternatives

## Preserve Current Custom Preset Without Naming

Rejected as incomplete. The current UI direction is workable, but it needs a formal preset name and token contract so future generated UI stays consistent.

## Full Mira Migration

Rejected for now. It would be higher risk, likely require restoring shadcn-style configuration and dependencies, and could overwrite audited OneDayOS behavior.

## Full shadcn/Radix Migration

Rejected for this package. shadcn remains a reference/source option, not a component-regeneration permission.

# Consequences

- OneDayOS has a named visual preset.
- Tokens, typography, iconography, radius, density, and shadow usage are locked.
- Lucide becomes an approved runtime dependency.
- Older manual language that assumed active shadcn/Radix implementation is amended by this ADR.
- Future packages must preserve OneDayOS Compact unless another ADR changes it.

# Risks

- Primary orange can become too loud if overused.
- Deep navy shell could feel heavy if content surfaces are not balanced.
- Adding icons broadly could create clutter if not restrained.
- Existing custom popovers still require ongoing accessibility review.
- Automated tests cannot prove full visual contrast or real assistive technology behavior.

# Rollback Strategy

If OneDayOS Compact causes unacceptable visual regression:

1. Revert token and primitive style changes as a file group.
2. Keep governance docs but mark the implementation rollback in an implementation note.
3. Preserve Lucide only if it remains used and approved.
4. Return to the previous custom token map until Founder approves a revised preset.

# Manual References

This ADR amends or is registered by:

- `03-design-system/13-onedayos-compact-design-preset.md`
- `03-design-system/THEME-PRESET-AUDIT.md`
- `03-design-system/01-brand-system.md`
- `03-design-system/03-component-standards.md`
- `02-architecture/04-technology-baseline.md`
- `00-meta/00-roadmap.md`
