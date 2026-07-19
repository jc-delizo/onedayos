# Implementation Package 1 — Foundation

**Status:** Prepared, not executed  
**Date:** 2026-07-08  
**Implementation Approval:** Granted by Founder for Foundation Package 1 only.

## Founder Approval

Foundation Package 1 is approved for implementation.

This approval applies only to the allowed Foundation Package 1 scope.

It does not approve modules, Business Objects, Platform Services, Dynamic Systems, runtime AI, background jobs, FastAPI, or client-specific infrastructure.

## Goal

Implement the restarted OneDayOS foundation only.

## Authoritative Documents

- `00-meta/03-claude-workflow.md`
- `00-meta/04-definition-of-done.md`
- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `02-architecture/02-repository-architecture.md`
- `02-architecture/03-runtime-architecture.md`
- `02-architecture/04-technology-baseline.md`
- `02-architecture/05-dependency-rules.md`
- `04-kernel/00-kernel-overview.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/02-prisma-conventions.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/04-migrations-seeding.md`
- `06-data/05-data-validation-zod.md`
- `13-security/08-production-readiness-gate.md`
- `14-testing-quality/08-ci-quality-gates.md`

## Allowed Implementation Scope

- Project scaffold
- Repository structure
- Environment validation
- Prisma setup
- Supabase Auth helpers
- PlatformContext
- API-safe auth helpers
- Tenant context helpers
- RBAC schema
- Permission helpers
- SDK structure
- `sdk.getDb(ctx)`
- API wrapper
- Error response helpers
- Architecture checks
- Test fixtures
- CI/check scripts

## Forbidden Scope

- Business modules
- Inventory
- CRM
- Leave
- Client-specific app code
- Platform Services
- Dynamic Forms
- Dynamic CRUD
- Runtime AI
- Background Jobs
- Search
- Reporting
- Notifications
- Attachments
- Comments
- Activity Feed
- Approval Workflow
- FastAPI
- Per-client infrastructure
- Supabase Edge Functions
- Raw Prisma in modules
- `sdk.getDb(orgId)`
- Client-supplied `orgId`

## Required Verification for Later Implementation

- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`
- `npm run check:architecture`

If a command does not exist yet, the later implementation agent must create the proper script if it belongs to the foundation scope, or report why it cannot exist yet.

## Required Foundation Boundaries

- Use `PlatformContext`, not loose `orgId`.
- Use `sdk.getDb(ctx)`, not `sdk.getDb(orgId)`.
- Use `/api/orgs/[orgSlug]/...` for tenant APIs.
- Use `/api/kernel/auth/me` for current-user lookup.
- Reject client-supplied `orgId`.
- API-safe auth helpers must return JSON `401`; APIs must not redirect to login.
- FastAPI is excluded from the core platform unless a future ADR approves a narrow use case.

## Stop Conditions

Stop and request founder review if implementation would require:

- Business module behavior.
- A Platform Service.
- Dynamic runtime engines.
- Runtime AI.
- Background jobs.
- A second backend runtime.
- Per-client infrastructure.
- A change to the tenancy, SDK, or dependency model.
