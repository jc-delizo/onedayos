# ADR-0007: RLS Deferred to Phase 1.5

**Status:** Accepted  
**Date:** 2026-07

## Context

The foundation must enforce tenancy immediately, but PostgreSQL Row Level Security requires careful policy design and operational testing.

## Decision

RLS is deferred to Phase 1.5 as defense-in-depth. Phase 1 must enforce tenant isolation in application services, SDK access, and tests.

## Alternatives Considered

- RLS as the first-line Phase 1 control.
- No RLS plan.
- Relying only on route-level checks.

## Consequences

Phase 1 is still responsible for strong tenant isolation. RLS deferral is not permission to weaken service-level scoping.

## Manual References

- `06-data/01-tenancy-data-isolation.md`
- `06-data/06-row-level-security-plan.md`
- `13-security/02-tenant-isolation.md`
- `13-security/08-production-readiness-gate.md`

## Implementation Notes

Foundation Package 1 may document and prepare for RLS, but should not implement RLS policies unless a later package explicitly includes them.
