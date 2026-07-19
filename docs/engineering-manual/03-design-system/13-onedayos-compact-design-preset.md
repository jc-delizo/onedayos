# OneDayOS Engineering Manual — 03 Design System / 13 OneDayOS Compact Design Preset

Status: Frozen  
Implementation Allowed: Yes — OneDayOS Compact preset  
Owner: Founder / Platform Architecture  
Last Updated: 2026-07  
ADR: `00-meta/adrs/ADR-0012-onedayos-compact-design-preset.md`

---

# Purpose

This document freezes the OneDayOS Compact design preset.

Its job is to give shared components, official modules, future generators, tests, and human reviews a concrete visual target.

# Character

OneDayOS Compact should feel:

- premium
- calm
- compact
- operational
- businesslike
- keyboard-friendly
- trustworthy
- data-dense

It must not feel:

- generic SaaS
- Bootstrap admin
- playful
- over-animated
- decorative
- marketing-led
- per-client customized

# Token Map

Required semantic tokens:

- `--color-background`
- `--color-foreground`
- `--color-surface`
- `--color-surface-raised`
- `--color-surface-muted`
- `--color-border`
- `--color-border-strong`
- `--color-muted`
- `--color-muted-foreground`
- `--color-brand`
- `--color-brand-foreground`
- `--color-primary`
- `--color-primary-foreground`
- `--color-accent`
- `--color-accent-foreground`
- `--color-destructive`
- `--color-destructive-foreground`
- `--color-success`
- `--color-success-foreground`
- `--color-warning`
- `--color-warning-foreground`
- `--color-information`
- `--color-information-foreground`
- `--color-focus-ring`
- `--color-sidebar-background`
- `--color-sidebar-foreground`
- `--color-sidebar-muted`
- `--color-sidebar-hover`
- `--color-sidebar-selected`
- `--color-popover-background`
- `--color-popover-foreground`

Compatibility aliases may exist while older components are migrated, but new shared UI should prefer the semantic token names.

# Typography

Use the system UI stack:

```css
ui-sans-serif,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif
```

Do not add custom fonts, `next/font`, external font requests, or unloaded Inter-first declarations.

# Iconography

Use `lucide-react` for shared chrome and common actions.

Rules:

- one icon family
- consistent icon sizing
- labels remain for important actions
- icon-only controls need accessible names
- decorative icons are hidden from assistive technology
- do not rewrite whole modules just to add icons

# Density

OneDayOS Compact uses compact-medium density:

- ordinary controls: about 34-36px
- small controls: about 30-32px
- form controls: about 36-40px when justified
- table rows: compact but readable
- shell rows: compact enough for operational navigation
- panel padding: modest

Text must not clip or overflow in controls, badges, table cells, or sidebar rows.

# Radius

Lock:

- small: `4px`
- medium: `6px`
- large: `8px`

Avoid pill shapes except badges/status.

# Borders/Shadows

Use border-first hierarchy.

Ordinary cards, panels, forms, tables, and sections should rely on border and surface contrast.

Use shadows only for floating surfaces:

- popovers
- app switcher
- profile menu
- dropdowns
- dialogs
- toasts

Do not use glow, glass, large marketing shadows, or shadow-heavy card grids.

# Buttons

Required variants:

- primary/default
- secondary
- outline
- ghost
- destructive
- link

Rules:

- primary/default uses semantic primary orange
- secondary is neutral
- outline is neutral border
- ghost is neutral hover
- destructive is red/destructive
- link is text-style primary
- no hardcoded orange in Button source
- disabled and focus states must remain visible
- icon-only buttons require accessible names

# Inputs/Forms

Inputs use compact sizing, semantic borders, tokenized surfaces, and visible invalid state.

Forms must not include hidden tenant fields or client-submitted `orgId`.

Field labels, descriptions, errors, and form-level messages must use shared primitives and semantic tokens.

# Tables

Tables are central to OneDayOS.

Rules:

- semantic table elements
- compact row spacing
- muted table headers
- tokenized row hover
- empty/loading/error states
- row actions with accessible names
- no table mega-library in this preset

# Sidebar/Floating Surfaces

The authenticated app shell uses deep navy tokens.

The sidebar must show the current organization, app switcher, current app navigation, related records where useful, and a profile button.

Floating surfaces use popover tokens and floating shadow. Ordinary sidebar rows use selected/hover backgrounds, not dots or left rails.

# Semantic Colors

Semantic state meaning:

- destructive: red
- warning: amber
- success: green
- information: blue
- neutral: zinc-neutral
- brand: OneDayOS orange

Brand orange is not warning. Accent is not brand.

Status meaning must not rely on color alone.

# Light/Dark Tokens

Light and dark maps must include the required semantic tokens.

Dark mode remains class-based and compatible with:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

# Forbidden Patterns

Forbidden:

- `--color-accent: #F97316`
- raw orange in TSX
- raw navy in TSX
- multiple icon libraries
- shadcn CLI regeneration
- `components.json` created only to imitate shadcn
- external font requests
- theme builders
- per-client CSS
- organization accent overrides
- glassmorphism
- glow effects
- fake dashboard cards/charts

# Selective shadcn Adoption

shadcn may be used as future reference/source material only.

Any adoption must preserve:

- OneDayOS tokens
- custom shell and navigation model
- tenant-safe forms
- accessibility behavior
- tests

The shadcn CLI may not overwrite audited components without another ADR.

# Runtime Appearance Boundary

Runtime Light / Dark / System behavior is approved by ADR-0013 and specified in:

- `00-meta/adrs/ADR-0013-runtime-appearance-preference.md`
- `03-design-system/14-runtime-appearance.md`

This preset only defines the Compact token maps and visual semantics that runtime appearance resolves. Runtime Appearance does not create organization branding, custom client themes, alternate presets, Prisma fields, or API-backed theme settings.

# Organization Branding Boundary

Organization branding remains limited to organization name and future logo.

This preset does not approve:

- organization custom colors
- custom CSS
- theme builders
- white-labeling
- per-client layouts

# Tests

Required tests/checks:

- brand token remains `#F97316`
- primary exists and uses semantic orange
- accent exists and is neutral
- semantic status token families exist
- deep-navy sidebar tokens exist
- system UI stack exists
- unloaded Inter-first declaration is absent
- 4/6/8 radius tokens exist
- Button variants use semantic tokens
- Button source does not hardcode orange
- shared shell uses Lucide chrome icons
- no mixed icon libraries in active source
- ordinary surfaces are border-first
- floating surfaces retain floating shadow
- UX checks enforce stable preset guardrails
