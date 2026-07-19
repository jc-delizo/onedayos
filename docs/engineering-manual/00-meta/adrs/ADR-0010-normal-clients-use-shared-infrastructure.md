# ADR-0010: Normal Clients Use Shared Infrastructure

**Status:** Accepted  
**Date:** 2026-07

## Context

OneDayOS is sold and operated as a repeatable platform. Normal client delivery must not create infrastructure sprawl that AppCare cannot support.

## Decision

Normal clients use shared OneDayOS infrastructure. Dedicated infrastructure is exceptional custom work, not the default product model.

## Alternatives Considered

- Dedicated Supabase projects per normal client.
- Dedicated Vercel projects per normal client.
- Separate databases or app forks as the default delivery model.

## Consequences

Tenant isolation, billing, operations, support, and security must assume a shared platform baseline.

## Manual References

- `01-foundation/01-business-model.md`
- `01-foundation/04-commercial-constraints.md`
- `15-deployment-operations/00-environments.md`
- `16-client-delivery/02-scope-control.md`

## Implementation Notes

Implementation packages must not create per-client infrastructure unless a later founder-approved custom scope explicitly says so.
