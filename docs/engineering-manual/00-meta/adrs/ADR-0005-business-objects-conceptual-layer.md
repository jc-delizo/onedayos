# ADR-0005: Business Objects Conceptual Layer

**Status:** Accepted  
**Date:** 2026-07

## Context

OneDayOS needs shared business concepts such as Employee, Product, Customer, Supplier, and Warehouse without turning every client request into Kernel code.

## Decision

Business Objects are a conceptual platform layer separate from Kernel and separate from modules.

## Alternatives Considered

- Treating Business Objects as Kernel primitives.
- Duplicating common entities inside modules.
- Treating every entity as module-owned.

## Consequences

Business Objects should be reusable and stable, but they must not pollute Kernel responsibilities. Branch and Department remain Kernel organization-structure primitives, not Business Objects.

## Manual References

- `01-foundation/03-platform-vs-modules.md`
- `02-architecture/01-layer-boundaries.md`
- `07-business-objects/00-business-object-philosophy.md`

## Implementation Notes

Foundation Package 1 should not implement Business Object models unless explicitly approved by a later package.
