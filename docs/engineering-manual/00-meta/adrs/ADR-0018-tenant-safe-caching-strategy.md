# ADR-0018: Tenant-Safe Caching Strategy

Status: Accepted
Date: 2026-07
Implementation Timing: V2-7 only, after V2 query and mutation shapes stabilize
Implementation Allowed: Only through the approved V2-7 implementation package

## Context

Founder review requested caching for cost and performance. OneDayOS is tenant-scoped and permission-sensitive, so indiscriminate caching can leak data or show stale operational stock values.

## Decision

Caching is a separate, selective architecture package after read and mutation shapes stabilize. Do not enable global caching.

Never cache:

- Authentication state.
- PlatformContext.
- Permission decisions unless a safe key/expiry model is proven.
- Fresh Stock Balances and Stock Movements requiring immediate freshness.
- Mutations.
- Sensitive cross-tenant responses.
- Exports.

Potentially cache:

- Static module metadata.
- Slow-changing Product Categories.
- Supplier and Warehouse lookup lists.
- Tenant-tagged shared-record lists.
- Short-TTL dashboard historical aggregates.
- Non-sensitive process/documentation content.

## Requirements

- Cache keys include tenant identity.
- User-sensitive results include user/permission scope or remain uncached.
- Tags include organization and resource.
- Mutations invalidate affected tags.
- Read-your-own-write behavior is preserved.
- Cache behavior is observable in tests or logs.
- Cost benefit is measured.

## Consequences

- Caching is deferred until Inventory V2 table/query shapes are stable.
- Next.js 16 cache mode must be audited before choosing Cache Components or older APIs.

## Implementation Timing

V2-7 only, after stabilization and a current Next.js 16 cache-model audit. Activation requires measured cost or latency benefit, organization-scoped keys/tags, explicit invalidation, read-your-own-write behavior, and tenant-isolation tests.
