# ADR-0006: FastAPI Excluded From Core Platform

**Status:** Accepted  
**Date:** 2026-07

## Context

Adding FastAPI to the core platform would create a second backend runtime, auth surface, deployment path, monitoring surface, and data access model.

## Decision

FastAPI is excluded from the restarted OneDayOS core platform.

## Alternatives Considered

- FastAPI as the main API backend.
- FastAPI for normal module CRUD.
- FastAPI for foundation auth, tenancy, or data access.

## Consequences

Core APIs use Next.js route handlers. Any future FastAPI use requires a separate ADR and a narrow service-specific reason.

## Manual References

- `02-architecture/04-technology-baseline.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/05-sdk-compatibility-versioning.md`
- `13-security/08-production-readiness-gate.md`

## Implementation Notes

Foundation implementation must not add Python backend files, FastAPI dependencies, Alembic, SQLAlchemy, or a second API runtime.
