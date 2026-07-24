# Curated Accent Presets

Status: Frozen
Implementation Timing: V2-8
Implementation Allowed: Only through the approved V2-8 implementation package

## Purpose

OneDayOS should support personal visual preference without becoming a theme builder or per-client styling system.

## Approved Presets

- Neutral.
- Orange.
- Blue.
- Violet.
- Emerald.
- Rose.

Default: Neutral.

## Scope

Accent presets may affect:

- Primary actions.
- Focus ring.
- Selected states.
- Chart accents.
- Links where appropriate.

Accent presets must not affect:

- Destructive red.
- Warning amber.
- Success green.
- Information blue when semantically required.
- Content readability.
- Layout.
- Font.
- Radius.
- Client-specific branding.

## Brand Rule

The OneDayOS brand token remains:

```css
--color-brand: #F97316;
```

Do not remap generic accent to brand orange. Generic `accent` remains a neutral interaction token unless and until an approved preset maps selected interaction values.

## Persistence

Accent preference remains personal and browser-local for MVP. No Prisma field, API route, organization setting, or per-client CSS file is allowed.

## Tests Required in V2-8

- Each preset passes light and dark contrast checks.
- Semantic colors remain unchanged.
- Preference persists without tenant/user IDs in storage.
- App shell, forms, tables, charts, and Process Flow remain readable.
