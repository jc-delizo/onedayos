# ADR-0002: Shared PostgreSQL orgId Tenancy

**Status:** Accepted  
**Date:** 2026-07

## Context

The restarted foundation needs a simple, auditable tenant model suitable for one shared application and database.

## Decision

Use shared PostgreSQL with `orgId` tenancy for tenant-scoped records. Tenant identity must be derived server-side from authenticated membership and route context.

## Alternatives Considered

- Database-per-tenant from day one.
- Schema-per-tenant.
- Client-supplied tenant identifiers.

## Consequences

All tenant-scoped queries must include verified organization scope. Cross-tenant tests are mandatory before production readiness.

## Manual References

- `02-architecture/00-system-architecture.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `13-security/02-tenant-isolation.md`

## Implementation Notes

`orgId` is data scope, not authentication proof. APIs must reject client-supplied `orgId`.
