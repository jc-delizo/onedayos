# ADR-0009: Dynamic Systems Deferred

**Status:** Accepted  
**Date:** 2026-07

## Context

Dynamic Forms, Dynamic CRUD, view builders, and import/export engines are valuable only after repeated module patterns are understood.

## Decision

Dynamic Systems are deferred. They may be frozen as contracts, but they are not part of the first foundation implementation.

## Alternatives Considered

- Building Dynamic Forms in the foundation.
- Building Dynamic CRUD before modules exist.
- Creating runtime metadata engines from roadmap names.

## Consequences

The foundation should keep extension paths open without implementing generic runtime engines prematurely.

## Manual References

- `00-meta/00-roadmap.md`
- `11-dynamic-systems/00-dynamic-systems-philosophy.md`
- `13-security/08-production-readiness-gate.md`

## Implementation Notes

Foundation Package 1 must not implement Dynamic Forms, Dynamic CRUD, dynamic table views, view builders, or import/export engines.
