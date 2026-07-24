# Tenant-Safe Caching Strategy

Status: Frozen
Implementation Timing: V2-7 only, after V2 query and mutation shapes stabilize
Implementation Allowed: Only through the approved V2-7 implementation package

## Purpose

Caching must reduce cost and latency without leaking tenant data, serving stale operational stock, or bypassing permission checks.

## Current State

The current Next config only enables typed routes. There is no explicit app-level caching strategy, no `unstable_cache`, no cache tags, and no runtime cache invalidation in source.

## Cache Classification

Never cache:

- Authentication state.
- PlatformContext.
- Permission decisions unless a safe key/expiry model is proven.
- Mutations.
- Exports.
- Sensitive cross-tenant responses.
- Fresh Stock Balances.
- Stock Movements requiring immediate freshness.

Potentially cache:

- Static module metadata.
- ProductCategory lookup lists.
- Supplier and Warehouse lookup lists.
- Shared-record list pages with tenant-specific keys and tags.
- Dashboard historical aggregates with short TTL.
- Static process/documentation content.

## Required Key Shape

Cache keys must include:

- Organization id or slug.
- Resource name.
- Allowlisted query state.
- User/permission scope where the data differs by permission.

## Invalidation

Mutations must invalidate tenant-scoped tags for affected resources. Stock mutations must preserve read-your-own-write behavior and must not show stale balance after posting.

## Observability

Implementation must expose enough logs or tests to prove:

- Cache hit/miss behavior.
- Tag invalidation.
- Tenant isolation.
- Stale stock prevention.
- Cost/latency benefit.

## Next.js Audit Required

Before V2-7 implementation, audit the active Next.js 16 caching model and decide whether to use Cache Components, route segment options, or a newer cache API. Do not enable global caching. No caching work is authorized in V2-1 through V2-6.
