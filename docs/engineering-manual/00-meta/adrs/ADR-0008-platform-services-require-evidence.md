# ADR-0008: Platform Services Require Evidence

**Status:** Accepted  
**Date:** 2026-07

## Context

Platform Services can become expensive abstractions if introduced before repeated client needs prove the pattern.

## Decision

Platform Services require evidence, normally the Three Independent Use Cases rule, before implementation.

## Alternatives Considered

- Building all listed services during foundation.
- Creating services from roadmap names alone.
- Client-specific service implementations.

## Consequences

Service documents may exist as contracts, but the implementation default remains no until scope is proven and approved.

## Manual References

- `01-foundation/02-product-principles.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`

## Implementation Notes

Foundation Package 1 must not implement Platform Services such as Search, Reporting, Notifications, Attachments, Comments, Activity Feed, Approval Workflow, or Background Jobs.
