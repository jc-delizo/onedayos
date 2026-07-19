# ADR-0003: PlatformContext Over Loose orgId

**Status:** Accepted  
**Date:** 2026-07

## Context

Earlier plans used loose `orgId` values in service calls and SDK access. That pattern can accidentally trust client input or bypass membership verification.

## Decision

Protected operations use verified `PlatformContext`. Services and SDK calls receive `ctx`, not loose `orgId`.

## Alternatives Considered

- `sdk.getDb(orgId)`.
- Service methods that accept `orgId` strings.
- Reading `body.orgId` or `searchParams.get('orgId')` for tenant proof.

## Consequences

The API layer must establish authenticated context before data access. The SDK database seam is `sdk.getDb(ctx)`.

## Manual References

- `02-architecture/00-system-architecture.md`
- `04-kernel/02-organizations-tenancy.md`
- `05-sdk/02-sdk-db-access.md`
- `13-security/08-production-readiness-gate.md`

## Implementation Notes

Architecture checks should block `sdk.getDb(orgId)`, client-supplied `orgId`, and loose tenant service methods.
