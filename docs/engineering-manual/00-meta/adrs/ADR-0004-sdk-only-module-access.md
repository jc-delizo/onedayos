# ADR-0004: SDK-Only Module Access

**Status:** Accepted  
**Date:** 2026-07

## Context

Modules need platform capabilities without depending on Kernel internals or other modules.

## Decision

Modules access platform capabilities through the OneDayOS SDK only. Modules must not import `@/kernel/*`, raw Prisma, or other modules.

## Alternatives Considered

- Direct Kernel imports from modules.
- Raw Prisma access inside modules.
- Module-to-module imports.

## Consequences

The SDK becomes the stable boundary between modules and the platform. Architecture checks must enforce the boundary.

## Manual References

- `02-architecture/01-layer-boundaries.md`
- `02-architecture/05-dependency-rules.md`
- `05-sdk/00-sdk-overview.md`
- `08-module-system/03-module-folder-contract.md`

## Implementation Notes

Foundation implementation may create SDK structure and checks, but must not implement business modules yet.
