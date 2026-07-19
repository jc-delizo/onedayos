# ADR-0001: Shared Platform Deployment

**Status:** Accepted  
**Date:** 2026-07

## Context

OneDayOS is a shared business operating system for multiple client organizations. Normal clients should not receive separate application forks, repositories, Vercel projects, or isolated platform copies by default.

## Decision

OneDayOS uses a shared platform deployment for normal clients. Per-client infrastructure is not part of the default foundation or delivery model.

## Alternatives Considered

- Per-client application deployments.
- Per-client repositories or forks.
- Dedicated infrastructure as the default sales model.

## Consequences

The foundation must enforce tenancy, permissions, and operational safety inside one shared platform. Dedicated infrastructure requires explicit founder and architecture approval.

## Manual References

- `01-foundation/00-vision.md`
- `01-foundation/01-business-model.md`
- `02-architecture/00-system-architecture.md`
- `15-deployment-operations/01-vercel-deployment.md`

## Implementation Notes

Foundation work must avoid client-specific app code, app forks, and per-client deployment assumptions.
