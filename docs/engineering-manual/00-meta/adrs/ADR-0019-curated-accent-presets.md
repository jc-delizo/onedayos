# ADR-0019: Curated Accent Presets

Status: Accepted
Date: 2026-07
Implementation Timing: V2-8
Implementation Allowed: Only through the approved V2-8 implementation package

## Context

Current appearance supports Light, Dark, and System. Founder review requested curated color choices so OneDayOS does not remain only dark blue/orange. Earlier brand decisions preserve `--color-brand: #F97316` and keep generic `accent` neutral.

## Decision

Use a curated personal Accent preference, browser-local for MVP:

- Neutral.
- Orange.
- Blue.
- Violet.
- Emerald.
- Rose.

The OneDayOS brand mark remains orange. Accent presets may affect primary actions, focus rings, selected states, chart accents, and links where appropriate. Accent presets must not alter semantic danger, warning, success, or information meanings.

The default accent is Neutral.

## Consequences

- This amends the earlier fixed-orange primary emphasis decision.
- Theme tests must verify light/dark contrast for each preset.
- Accent choice remains personal and browser-local, not organization-wide.

## Non-Goals

- Theme builder.
- White labeling.
- Per-client CSS.
- Organization-wide theme settings.
- Arbitrary component-specific colors.

## Implementation Timing

V2-8 only. Chart accents may follow the curated preset while retaining accessible labels and non-color status cues.
