# OneDayOS Theme and Design Preset Audit

## Status

Draft for Founder Review  
Implementation Allowed: No - Founder must approve the preset decision first

This is an audit and decision-preparation document. It does not approve a preset migration, runtime theme implementation, organization branding, component regeneration, dependency changes, or visual redesign.

## Post-Audit Founder Decision

Founder approval for Package 6B selected `OneDayOS Compact`.

The decision is now recorded in:

- `00-meta/adrs/ADR-0012-onedayos-compact-design-preset.md`
- `03-design-system/13-onedayos-compact-design-preset.md`

The approved direction follows this audit's Option 3 recommendation: a custom OneDayOS compact preset, not a full Mira/shadcn migration.

Package 6C approval is now recorded in:

- `00-meta/adrs/ADR-0013-runtime-appearance-preference.md`
- `03-design-system/14-runtime-appearance.md`

Runtime Appearance keeps the local provider, defaults to System, persists browser-local preference under `onedayos.appearance`, and remains separate from Organization Branding.

## Audit-Time Repository Configuration

Audit-time application stack before Package 6B implementation:

- Next.js `16.2.10`
- React `19.2.7`
- Tailwind CSS `4.3.2` through `@tailwindcss/postcss`
- custom CSS variables in `src/app/globals.css`
- `clsx` and `tailwind-merge` through `src/lib/cn.ts`
- no `components.json` present in the working tree
- no Tailwind config file present
- no `next-themes`
- no Radix UI package
- no Base UI package
- no `lucide-react`
- no `class-variance-authority`
- no shadcn package in the active package graph

Audit-time port scripts:

```text
npm run dev   -> next dev -p 1320
npm run start -> next start -p 1320
```

The source included a local `ThemeProvider`, theme initialization script, profile-menu appearance choices, and tests. This means runtime appearance support already existed in the repository before Package 6B. This audit did not change that behavior.

Implementation/manual drift identified before preset lock:

- `03-component-standards.md` says OneDayOS uses shadcn/ui and Radix-style primitives as the base component layer.
- Current code is not using Radix UI, shadcn component source, `components.json`, `class-variance-authority`, or `lucide-react`.
- Therefore the current app is best classified as a custom OneDayOS component stack inspired by shadcn/Tailwind patterns, not an active shadcn/Radix preset implementation.

## Current Token Map

Audit-time tokens were defined in `src/app/globals.css`.

| Token area | Current value / behavior |
| --- | --- |
| Brand | `--color-brand: #F97316` in light and dark |
| Brand contrast | light `#ffffff`, dark `#11100e` |
| Brand soft | light `#fff4ec`, dark `#2b190f` |
| Primary | no dedicated `--color-primary`; primary Button uses `--color-foreground` background and `--color-surface` text |
| Primary foreground | no dedicated token; implemented through Button inline color fallback |
| Accent | no `--color-accent` token; neutral hover uses `--color-bg-subtle` |
| Accent foreground | none |
| Background | light `#f7f6f3`, dark `#11100e` |
| Foreground | light `#171512`, dark `#f4f0e8` |
| Surface/card | light `#ffffff`, dark `#181613` |
| Surface raised | light `#fbfaf8`, dark `#1f1c18` |
| Muted text | light `#6f6a60`, dark `#b6aea2` |
| Subtle text | light `#8a8478`, dark `#8f8678` |
| Border | light `#ded9cf`, dark `#34302a` |
| Strong border | light `#c7c0b4`, dark `#4b453c` |
| Input | no separate input token; Input uses surface, border, foreground, subtle placeholder |
| Ring/focus | `--color-focus`, light `#f97316`, dark `#fb923c`; `--shadow-focus` uses orange ring alpha |
| Destructive/danger | light `#b91c1c` / `#fef2f2`, dark `#fca5a5` / `#2a1010` |
| Success | light `#15803d` / `#ecfdf3`, dark `#86efac` / `#102718` |
| Warning | light `#b45309` / `#fff7ed`, dark `#fbbf24` / `#2a1d09` |
| Info | light `#0369a1` / `#eff6ff`, dark `#93c5fd` / `#102033` |
| Neutral | light `#4b5563` / `#f3f4f6`, dark `#d1d5db` / `#242424` |
| Radius | `--radius-xs: 4px`, `--radius-sm: 6px`, `--radius-md: 8px` |
| Font | `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| Sidebar tokens | no separate sidebar token set; sidebar uses generic bg/surface/border/text tokens |

Important brand/accent finding:

- Brand orange is correctly isolated as `--color-brand`.
- Generic `accent` is not present and is not mapped to orange.
- Current Button primary does not use brand orange. It uses foreground as the filled color. This is calm, but it means brand orange is mostly identity/focus/required/breadcrumb rather than primary action color.
- A future preset decision should explicitly decide whether primary actions should use `--color-brand`, a new semantic `--color-primary`, or the current foreground-filled style.

Raw color usage:

- Raw hex/rgb/hsl usage is concentrated in `src/app/globals.css` and token tests.
- Component code mostly uses CSS variables.
- Body background includes subtle gradients using `rgb(...)`.

## Current Component/Primitive Map

| Surface | Classification | Notes |
| --- | --- | --- |
| `Button` / `LinkButton` | custom OneDayOS primitive | Plain React/Next Link, token classes, no CVA, no Radix |
| `Input` | custom OneDayOS primitive | Plain input, token classes |
| `Field`, `Label`, descriptions/errors | custom OneDayOS primitive | Plain semantic elements |
| `Surface` / `Panel` | custom OneDayOS primitive | Plain section/div wrappers |
| `StatusBadge` | custom OneDayOS primitive | Token variants, no shadcn Badge dependency |
| `DataTable` | custom OneDayOS business primitive | Semantic table; no table library |
| `TenantAppShell` | custom OneDayOS shell | Custom sidebar, app switcher, profile menu; no Radix dropdown/popover |
| Profile menu | custom popover/menu | Uses button/menu roles, no primitive library |
| App switcher | custom popover/menu | Uses button/menu roles, no primitive library |
| Dialog/popover/dropdown primitives | absent as reusable primitive files | Existing popovers are custom inside app shell |
| Page patterns | custom OneDayOS patterns | `AppPage`, `DashboardPage`, `ListPage`, `FormPage`, `SettingsPage`, `ProcessFlowPage` |
| Auth shell/foundation shell | custom OneDayOS shell | Token-based layouts |
| Skeletons/loading states | custom OneDayOS primitives | Contextual skeletons |

Audit-time primitive library determination:

- Radix UI: not installed and not imported.
- Base UI: not installed and not imported.
- shadcn/ui: no active `components.json`, no active generator config, no active shadcn package, and no canonical shadcn component source currently in `src/components/ui`.
- Icon library: no `lucide-react`; current app uses text mark and small CSS grid icon for app switcher.

## Current Typography

Current font token:

```css
--font-sans:
  Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Findings:

- Inter is named first in the CSS stack.
- Inter is not loaded through `next/font`, `@font-face`, or a CSS import.
- If the user's system does not have Inter installed, the app falls back to the system UI font.
- Body and headings use the same font family.
- Typography is compact: body `14px`, line-height `1.5`, headings generally `text-2xl` or smaller inside panels.

Risk:

- Switching to a pure system font stack would likely be low to medium risk because the app already falls back to system fonts.
- Actually loading Inter through `next/font` would change metrics and could affect density, table fit, and perceived polish.
- Founder should decide whether OneDayOS wants "system-first" typography for operational speed or "Inter-loaded" typography for consistent brand polish.

## Current Density and Geometry

Current density is compact-medium and operational.

Observed values:

- Sidebar width: `280px`
- Sidebar item minimum height: `min-h-8`
- App switcher row: `px-3 py-2`
- Profile button: `px-2 py-2`
- Button sizes: `sm h-8`, `md h-9`
- Input/select height: `h-9`
- Table cells: `px-3 py-2`
- Table header text: `text-xs`
- Table body text: `text-sm`
- Panels/cards: usually `p-4`
- Page content spacing: `space-y-6`
- Shell content padding: `px-5 py-6`, increasing to `lg:px-8`
- Radius: 4px / 6px / 8px
- Shadows: subtle panel shadow; active selected state uses inset border shadow
- Borders: used heavily and subtly for structure

Assessment:

- Density is appropriate for a business operating system.
- Tables are compact enough for operational data without collapsing into tiny text.
- Cards/panels are restrained at 8px radius or less.
- Border/shadow strategy is calm and low-glare.
- Some density is encoded directly in Tailwind classes rather than a named density token, so preset changes could require broad source edits unless density tokens/classes are formalized first.

## Current Runtime Appearance Readiness

Current repository state:

- `.dark` class mode exists through Tailwind v4 custom variant.
- `ThemeProvider` exists and is mounted in `src/app/layout.tsx`.
- `getThemeInitScript()` exists and runs before hydration.
- Preference key is `onedayos.appearance`, with `onedayos-theme` read as a legacy compatibility fallback.
- Supported preferences are `light`, `dark`, `system`.
- System mode reads `prefers-color-scheme`.
- System mode listens for browser/OS theme changes.
- Theme persistence uses browser `localStorage`.
- `next-themes` is not installed.
- Profile menu includes Appearance controls through custom shell UI.

Audit interpretation:

- Runtime appearance is already implemented in the current source.
- The current implementation uses a local provider, which is simpler than adding `next-themes` for this stack.
- If Founder wants the sequencing to treat runtime appearance as not yet approved, this is a governance/history conflict to resolve. Technically, the code is already present and tested.
- A future Runtime Appearance package should either keep and harden the local provider or explicitly replace it. Adding `next-themes` is not necessary based on current architecture.

## Accessibility Risks

Changing preset, font, colors, radius, or density risks:

- reducing contrast in light or dark mode
- weakening focus ring visibility
- making table rows too tall for operational scanning or too dense for readability
- making touch targets too small if density is reduced further
- making selected states rely on color only
- reintroducing brand orange into neutral hover/accent states
- making warning/low-stock states visually confused with brand color
- breaking semantic menu/dialog behavior if custom popovers are replaced without accessible primitives
- changing font metrics enough to cause text clipping in buttons, sidebar rows, tables, and forms

Existing automated gates help with structure:

- `npm run check:ux`
- `npm run test:a11y`
- component and shell tests

Limitations:

- jsdom/axe automation does not prove browser color contrast.
- It does not prove full keyboard workflow completion.
- It does not prove screen-reader behavior in real browsers.
- Any preset implementation must include manual visual, keyboard, and browser accessibility checks.

## Candidate Option 1 — Preserve Current Preset

Description:

Keep the current custom OneDayOS component source and only formalize its current tokens, density, typography, and runtime appearance model.

Evaluation:

- Effort: low to medium.
- Risk: lowest.
- Consistency: good, because current pages already use these primitives.
- Visual identity: already distinct from generic shadcn starter, though still needs a formal name and token spec.
- Future generator reuse: good if tokens and density are documented.
- Drawback: manual/component docs saying "shadcn/Radix" remain inaccurate unless amended.

Implementation shape:

- Formalize token names.
- Add missing semantic `primary` decision if needed.
- Keep custom primitives.
- Preserve no-Radix/no-shadcn dependency posture unless a future accessible dialog/select/menu package requires it.

## Candidate Option 2 — Migrate Toward Mira

Description:

Use Mira as a structural inspiration or named shadcn preset direction for compact/data-dense UI.

Evaluation:

- Effort: high if treated as real component migration.
- Risk: high if shadcn regeneration overwrites custom security/accessibility/tested behavior.
- Consistency: uncertain until all primitives and pages are reconciled.
- Visual identity: could improve polish if carefully adapted, but could also make OneDayOS look like a preset instead of a product.
- Future generator reuse: good only after a full, stable OneDayOS wrapper layer is revalidated.

Migration implications:

- Would likely require restoring/creating `components.json`.
- Would likely require adding or re-adding shadcn/Radix/lucide/CVA style dependencies depending on selected components.
- Would require auditing Button, Input, Field, Surface, Badge, DataTable, AppShell, profile menu, app switcher, page patterns, loading states, and tests.
- Should not be done by running shadcn generators over existing files.

Recommendation:

- Do not migrate wholesale to Mira in the next implementation package.
- Use Mira only as reference material if Founder prefers its density/geometry after reviewing screenshots or examples.

## Candidate Option 3 — OneDayOS Compact Hybrid

Description:

Define a named OneDayOS preset that keeps the current audited components, locks tokens and density, and borrows only the compatible goals from compact enterprise/shadcn-style presets.

Potential characteristics:

- compact-medium density
- current custom primitives retained
- optional future Lucide decision, but no immediate icon dependency
- brand orange remains `--color-brand`
- explicit `--color-primary` decision if Founder wants brand primary actions
- neutral accent/hover behavior stays neutral
- neutral base palette remains warm-zinc/stone unless Founder chooses cooler zinc/slate
- radius remains 4px / 6px / 8px
- borders do most structural work; shadows stay subtle
- runtime Light / Dark / System remains color-mode only
- organization branding stays limited and deferred

Evaluation:

- Effort: medium.
- Risk: low to medium.
- Consistency: highest with current code.
- Visual identity: strongest because it becomes OneDayOS-owned instead of named-preset-owned.
- Future generator reuse: strongest if written into tokens, page patterns, and check gates.

## Recommended Direction

Primary recommendation: adopt Option 3, "OneDayOS Compact Hybrid."

Reason:

- The app is already a custom OneDayOS stack, not a live shadcn preset.
- Current density, radius, and token structure match the Founder goals better than a wholesale preset migration would.
- A named OneDayOS preset can preserve the product identity while still allowing selective inspiration from Mira/Vega-style compactness.
- It avoids overwriting custom shell, app switcher, profile menu, page patterns, tenant-safe forms, and tests.

Fallback recommendation: Option 1, preserve current preset and formalize it without renaming or expanding the design system yet.

Do not choose Option 2 unless Founder explicitly approves a higher-risk preset migration after visual comparison.

Recommended decisions:

| Decision area | Recommendation |
| --- | --- |
| Structural style direction | OneDayOS Compact Hybrid |
| Primitive library | keep current custom primitives for now |
| Base neutral palette | keep warm-zinc/stone calm neutral unless Founder wants cooler zinc |
| Primary/brand mapping | keep `--color-brand`; decide whether to add `--color-primary` mapped to brand or foreground |
| Accent mapping | keep neutral; do not map accent to brand orange |
| Semantic colors | keep separate success/warning/danger/info/neutral/brand tokens |
| Font family | Founder decision: system-first stack vs loaded Inter |
| Icon library | Founder decision: continue minimal custom/CSS icons vs adopt Lucide |
| Radius scale | keep 4/6/8px |
| Density | compact-medium |
| Shadow/border strategy | borders primary, subtle shadows only |
| Runtime Light/Dark/System | user-device preference only; color mode only |
| Organization branding | defer; allow only logo/limited accent later, no custom CSS/layouts |

## Founder Decisions Required

| Decision | Options | Recommended default |
| --- | --- | --- |
| Preset name | Current Custom, OneDayOS Compact, Mira-inspired, Vega-inspired | OneDayOS Compact |
| Primary button color | foreground-filled, brand orange, separate primary token | decide in Package 6B; lean brand for primary actions if restrained |
| Font | system-first, loaded Inter, Inter fallback only | system-first unless Founder wants stronger brand consistency |
| Icon library | no library/custom CSS, Lucide | Lucide only if broader iconography is required |
| Neutral palette | current warm neutral, cooler zinc, slate | keep current warm neutral unless visual review says too beige |
| shadcn migration | no migration, selective reference, full Mira/Vega migration | no full migration |
| Organization branding | deferred, logo only, logo plus limited accent | deferred |

## Proposed Implementation Packages

### Package 6B — Design Preset Lock

- name the preset
- formalize token map
- decide primary/brand/accent mapping
- decide font
- decide icon library posture
- lock radius/density values
- update tests for tokens and components
- no runtime appearance expansion
- no shadcn generator overwrite

### Package 6C — Runtime Appearance

- reconcile current local `ThemeProvider` with Founder-approved runtime appearance scope
- harden Light / Dark / System if needed
- verify persistence, system listener, hydration/flicker handling
- profile menu behavior
- visual and accessibility checks

Status: implemented as a hardening package through ADR-0013 and `03-design-system/14-runtime-appearance.md`. This did not add `next-themes`, Prisma fields, APIs, organization branding, or a theme builder.

### Package 6D — Organization Branding, Deferred

- organization logo if approved
- optional tightly controlled accent if approved
- no custom CSS
- no custom layouts
- no per-client component variants
- no white-label theme builder

## Expected Files to Change

Expected Package 6B files:

```text
src/app/globals.css
src/components/ui/button.tsx
src/components/ui/input.tsx
src/components/ui/field.tsx
src/components/ui/status-badge.tsx
src/components/ui/surface.tsx
src/components/onedayos/app-shell.tsx
src/components/onedayos/data-table.tsx
src/components/onedayos/loading-skeletons.tsx
src/components/onedayos/page-header.tsx
src/components/onedayos/patterns/*
src/components/onedayos/theme-tokens.test.ts
src/components/onedayos/design-system.test.tsx
docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-design-preset-lock.md
```

Possible Package 6C files:

```text
src/app/layout.tsx
src/components/onedayos/theme-provider.tsx
src/components/onedayos/theme-script.ts
src/components/onedayos/app-shell.tsx
src/components/onedayos/theme-provider.test.tsx
src/components/onedayos/theme-tokens.test.ts
docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-theme-appearance.md
```

Possible package files only if Founder approves dependencies:

```text
package.json
package-lock.json
components.json
```

## Files That Must Not Change

The preset lock and runtime appearance packages should not change:

```text
prisma/schema.prisma
prisma/migrations/**
src/kernel/**
src/sdk/server.ts
src/modules/inventory/service.ts
src/modules/inventory/schema.ts
src/modules/inventory/api.ts
src/app/api/**
scripts/create-module.ts
scripts/check-generated.ts
src/business-objects/**
```

Generator templates should change only in a separate Founder-approved generator/style enforcement package.

## Visual Regression Checklist

Before implementing a preset decision, test:

- login page in light and dark
- register page in light and dark
- app launcher
- Inventory dashboard
- Inventory Process Flow
- Product Settings
- Stock Levels with low-stock status
- Stock Movements ledger
- Stock Adjustments list
- New Stock Adjustment form
- Records Products
- Records Warehouses
- Organization People
- app switcher popover
- profile menu and Appearance choices
- sidebar active/hover/focus states
- button primary/secondary/quiet/danger states
- input, textarea, select, disabled, invalid states
- empty/loading/error/permission/module-unavailable states
- keyboard focus visibility
- text fitting in buttons, table cells, sidebar rows, and badges

Automated checks to run:

```text
npm run check:ux
npm run test:a11y
npm run test:run
npm run build
```

Manual checks still required:

- browser color contrast
- keyboard-only workflow
- screen-reader spot check
- responsive/mobile layout sanity
- Founder visual review

## Risks and Rollback Strategy

Main risks:

- Named shadcn preset migration overwrites custom OneDayOS behavior.
- Brand orange leaks into neutral hover/accent states.
- Primary button color decision makes the UI too loud or too low-emphasis.
- Font changes reduce table density or cause text clipping.
- Radius/shadow changes make the app look like a generic SaaS starter.
- Reintroducing broad dependencies increases component and accessibility risk.
- Existing runtime appearance implementation may conflict with a desired governance sequence.

Rollback strategy:

- Package 6B should be token-first and component-minimal.
- Keep changes small enough to revert by file group.
- Do not run shadcn generators over existing components.
- Preserve current tests before changing style.
- Add screenshot/manual review evidence before claiming visual approval.
- If a preset change makes the product look generic, revert to current custom OneDayOS preset and continue with token formalization only.
