# OneDayOS Engineering Manual Roadmap

**Document ID:** `00-meta/00-roadmap.md`  
**Version:** 1.0  
**Status:** Frozen  
**Author:** ChatGPT / OneDayOS Architecture Partner  
**Date:** July 2026  
**Implementation Allowed:** Governance document — use as authority for process  
**Supersedes:** Initial conversation roadmap draft and `onedayos-engineering-manual-roadmap-v1.md` after formal freeze  
**Depends On:**

- `00-meta/01-manual-governance.md`
- `00-meta/02-architecture-decision-records.md`
- `00-meta/03-claude-workflow.md`
- `00-meta/04-definition-of-done.md`
- `02-architecture/06-architecture-risk-register.md`
- `13-security/08-production-readiness-gate.md`

---

# ADR-Backed Amendment — 2026-07

ADR-0012 accepts the `OneDayOS Compact` design preset and registers:

- `00-meta/adrs/ADR-0012-onedayos-compact-design-preset.md`
- `03-design-system/13-onedayos-compact-design-preset.md`

This amendment clarifies that the current Design System implementation keeps the audited custom OneDayOS components, uses Lucide for shared chrome icons, uses a system UI font stack, and treats shadcn as selective source/reference material unless a future ADR approves component regeneration.

ADR-0013 accepts the Runtime Appearance preference and registers:

- `00-meta/adrs/ADR-0013-runtime-appearance-preference.md`
- `03-design-system/14-runtime-appearance.md`

This amendment clarifies that Light / Dark / System appearance is an MVP personal browser-local preference, defaults to System, uses the `onedayos.appearance` storage key, and does not approve organization branding, Prisma fields, APIs, custom client CSS, or theme builders.

# 1. Purpose

This document is the canonical roadmap for the OneDayOS Engineering Manual.

The Engineering Manual exists so that OneDayOS can be implemented as a long-term platform, not as a sequence of improvised client applications.

Its job is to answer:

```txt
What documents exist?
What order should they be written, reviewed, frozen, and implemented?
Which parts of the platform are allowed now?
Which parts are deferred?
What may Claude implement?
What must Claude never invent?
What must be true before we build modules or onboard clients?
```

This roadmap is not a marketing plan, backlog, or feature wishlist.

It is the operating map for turning OneDayOS into a reusable Business Operating System.

---

# 2. Core Philosophy

OneDayOS must not be built as separate client apps.

The correct model is:

```txt
OneDayOS Platform
  ├── Organization: Client A
  ├── Organization: Client B
  ├── Organization: Client C
  └── Organization: Client D
```

Normal clients receive:

```txt
One shared platform
One shared production deployment
One shared PostgreSQL database
Tenant-scoped data through orgId
Enabled modules through OrgModule
Settings through typed configuration
Permissions through RBAC
AppCare through centralized operations
```

Normal clients do **not** receive:

```txt
Separate GitHub repository
Separate Vercel project
Separate Supabase project
Separate database
Separate source-code fork
Separate custom application
```

Dedicated infrastructure may become a future premium/enterprise offer, but it is not the MVP model.

---

# 3. Why This Manual Exists

The previous generated base app had useful pieces:

```txt
Auth
Sidebar
Dashboard
Cards
CRUD
Module scaffolding
```

But it was not yet a platform.

It also exposed major risks:

```txt
Incomplete org membership checks
Permissions existed but were not enforced
API auth used redirect-style page behavior
Loose orgId patterns could create tenant risk
Soft-delete coverage was incomplete
Generated modules could scale unsafe patterns
The UI felt like a generic admin/SaaS starter
```

The Engineering Manual exists to prevent those mistakes from becoming the foundation of the restarted build.

The goal is not to write documents forever.

The goal is:

```txt
Decide architecture once.
Write it clearly.
Freeze it deliberately.
Use generators and Claude to implement it quickly.
Make every future module easier than the last.
```

---

# 4. Relationship to Previous Kernel v2 Plan

The previous Kernel v2 implementation plan remains an important historical reference.

It contributed valuable decisions:

```txt
Shared database with org_id tenancy
SDK-only module access
Module registry
Event Bus
Business Object reuse
Soft-delete rule
Three Client Rule
Optimistic UI
Tooltip/help rule
Module Builder CLI concept
Dynamic Form Engine gate
AppCare-centered operating model
```

But the restarted Engineering Manual supersedes it after formal freeze.

The previous plan also documented risks and deviations that the restarted build must not reproduce:

```txt
can() was not enforced
org membership checks were incomplete
requireAuth() redirected in API routes
soft-delete coverage was partial
live migration and seed were unverified
some tests were tautological
module scaffolding used unsafe route/orgId patterns
sidebar links and active matching had issues
```

**Rule:** the previous Kernel v2 plan is evidence and lesson material. It is not final doctrine once this manual is frozen.

---

# 5. Manual Status System

Every Engineering Manual document must use one of these statuses.

| Status | Meaning | Claude May Implement? |
|---|---|---:|
| `Draft` | Being written or under founder review | No |
| `Approved for Freeze` | Founder agrees with direction, but repo freeze pass is pending | No |
| `Frozen` | Formal source of truth for implementation | Yes, if implementation is allowed |
| `Amended` | Frozen document changed through amendment/ADR | Yes, if current amendment permits |
| `Superseded` | Replaced by a newer document | No |
| `Deferred` | Contract exists, implementation intentionally blocked | No |

Conversation approval means:

```txt
Founder agrees with the document direction.
```

It does **not** automatically mean:

```txt
Document has been moved to the repo path
Document has been conflict-checked
Document has been versioned and frozen
Claude may implement from it
```

A separate freeze pass is required.

---

# 6. Canonical Manual Repository Structure

Final manual files should live here:

```txt
docs/
  engineering-manual/
    00-meta/
    01-foundation/
    02-architecture/
    03-design-system/
    04-kernel/
    05-sdk/
    06-data/
    07-business-objects/
    08-module-system/
    09-cli-generators/
    10-platform-services/
    11-dynamic-systems/
    12-ai-layer/
    13-security/
    14-testing-quality/
    15-deployment-operations/
    16-client-delivery/
    17-module-specifications/
```

During planning, files may be produced as individual Markdown artifacts.

Before implementation, they must be copied into the repository with the correct folder/file names.

---

# 7. Manual Document Inventory

This section defines the intended Engineering Manual document set.

## 7.1 Meta Documents

```txt
00-meta/00-roadmap.md
00-meta/01-manual-governance.md
00-meta/02-architecture-decision-records.md
00-meta/03-claude-workflow.md
00-meta/04-definition-of-done.md
```

Purpose:

```txt
Control the manual itself.
Define how architecture is approved.
Define how Claude receives work.
Define what “done” means.
```

## 7.2 Foundation Documents

```txt
01-foundation/00-vision.md
01-foundation/01-business-model.md
01-foundation/02-product-principles.md
01-foundation/03-platform-vs-modules.md
01-foundation/04-commercial-constraints.md
```

Purpose:

```txt
Define what OneDayOS is.
Define why it exists commercially.
Define the principles used to classify every request.
```

## 7.3 Architecture Documents

```txt
02-architecture/00-system-architecture.md
02-architecture/01-layer-boundaries.md
02-architecture/02-repository-architecture.md
02-architecture/03-runtime-architecture.md
02-architecture/04-technology-baseline.md
02-architecture/05-dependency-rules.md
02-architecture/06-architecture-risk-register.md
```

Purpose:

```txt
Define the platform structure.
Define repository and runtime boundaries.
Define dependency rules and risk tracking.
```

## 7.4 Design System Documents

```txt
03-design-system/00-design-vision.md
03-design-system/01-brand-system.md
03-design-system/02-layout-system.md
03-design-system/03-component-standards.md
03-design-system/04-table-standards.md
03-design-system/05-form-standards.md
03-design-system/06-empty-loading-error-states.md
03-design-system/07-interaction-motion-standards.md
03-design-system/08-accessibility-standards.md
```

Purpose:

```txt
Prevent generic admin UI.
Make every module feel like OneDayOS.
Make tables, forms, empty states, loading states, and failure states premium and reusable.
```

## 7.5 Kernel Documents

```txt
04-kernel/00-kernel-overview.md
04-kernel/01-authentication.md
04-kernel/02-organizations-tenancy.md
04-kernel/03-users-roles-permissions.md
04-kernel/04-authorization-enforcement.md
04-kernel/05-settings-configuration.md
04-kernel/06-feature-flags-subscriptions.md
04-kernel/07-routing-app-shell.md
04-kernel/08-kernel-api-contracts.md
```

Purpose:

```txt
Define the minimum platform foundation every module depends on.
```

Kernel includes:

```txt
Authentication
Organizations
Users
Roles
Permissions
Subscriptions
Module enablement
Settings
Routing/app shell
API contracts
SDK backing primitives
```

Kernel does **not** include:

```txt
Inventory workflows
CRM workflows
Leave workflows
Notifications
Approval engine
Comments
Attachments
Reporting
Search
Runtime AI
Dynamic CRUD
Dynamic Forms
```

## 7.6 SDK Documents

```txt
05-sdk/00-sdk-overview.md
05-sdk/01-sdk-public-api.md
05-sdk/02-sdk-db-access.md
05-sdk/03-sdk-auth-permissions.md
05-sdk/04-sdk-events.md
05-sdk/05-sdk-compatibility-versioning.md
05-sdk/06-sdk-testing-contract.md
```

Purpose:

```txt
Define the only supported interface modules use to access the platform.
```

Critical SDK decisions:

```txt
@/sdk          = shared-safe types/constants
@/sdk/server   = server-only SDK
@/sdk/client   = browser-safe client helpers
sdk.getDb(ctx) = required
sdk.getDb(orgId) = forbidden
modules import SDK, not Kernel internals
```

## 7.7 Data Documents

```txt
06-data/00-database-architecture.md
06-data/01-tenancy-data-isolation.md
06-data/02-prisma-conventions.md
06-data/03-soft-delete-archival.md
06-data/04-migrations-seeding.md
06-data/05-data-validation-zod.md
06-data/06-row-level-security-plan.md
06-data/07-backup-restore.md
```

Purpose:

```txt
Define shared PostgreSQL, tenant isolation, Prisma usage, validation, migration, soft delete, RLS future, and recovery model.
```

## 7.8 Business Object Documents

```txt
07-business-objects/00-business-object-philosophy.md
07-business-objects/01-employee.md
07-business-objects/02-product.md
07-business-objects/03-customer.md
07-business-objects/04-supplier.md
07-business-objects/05-warehouse.md
07-business-objects/07-business-object-extension-pattern.md
07-business-objects/08-business-object-event-contracts.md
```

`07-business-objects/06-branch-department.md` from the original roadmap is intentionally not used as a Business Object document.

Reason:

```txt
Branch and Department are Kernel organization-structure primitives, not Business Objects.
```

If more detail is needed later, create:

```txt
04-kernel/09-branch-department-structure.md
```

or append the detail to:

```txt
04-kernel/02-organizations-tenancy.md
```

## 7.9 Module System Documents

```txt
08-module-system/00-module-philosophy.md
08-module-system/01-module-manifest.md
08-module-system/02-module-loader-registry.md
08-module-system/03-module-folder-contract.md
08-module-system/04-module-permissions.md
08-module-system/05-module-navigation.md
08-module-system/06-module-events.md
08-module-system/07-module-dependencies.md
08-module-system/08-module-versioning.md
08-module-system/09-module-testing.md
```

Purpose:

```txt
Make modules repeatable, testable, reusable, tenant-safe, and generator-compatible.
```

## 7.10 CLI / Generator Documents

```txt
09-cli-generators/00-generator-philosophy.md
09-cli-generators/01-module-generator.md
09-cli-generators/02-crud-generator.md
09-cli-generators/03-form-generator.md
09-cli-generators/04-api-generator.md
09-cli-generators/05-test-generator.md
09-cli-generators/06-generator-safety-rails.md
```

Purpose:

```txt
Make correct architecture faster than wrong architecture.
```

Implementation status distinction:

```txt
Module Generator = needed early
CRUD Generator = deferred
Form Generator = deferred
Standalone API Generator = deferred, but route contract required now
Standalone Test Generator = deferred, but module generator must emit tests now
```

## 7.11 Platform Services Documents

```txt
10-platform-services/00-platform-services-philosophy.md
10-platform-services/01-three-client-rule.md
10-platform-services/02-audit-log-service.md
10-platform-services/03-notification-service.md
10-platform-services/04-approval-workflow-service.md
10-platform-services/05-comments-service.md
10-platform-services/06-attachments-service.md
10-platform-services/07-activity-feed-service.md
10-platform-services/08-reporting-service.md
10-platform-services/09-search-service.md
10-platform-services/10-background-jobs.md
```

Purpose:

```txt
Define future reusable cross-cutting services.
Block premature implementation.
```

Platform Services are deferred unless explicitly promoted through evidence and approval.

## 7.12 Dynamic Systems Documents

```txt
11-dynamic-systems/00-dynamic-systems-philosophy.md
11-dynamic-systems/01-dynamic-form-engine.md
11-dynamic-systems/02-dynamic-crud-engine.md
11-dynamic-systems/03-dynamic-table-view-engine.md
11-dynamic-systems/04-field-metadata-schema.md
11-dynamic-systems/05-import-export-engine.md
11-dynamic-systems/06-view-builder.md
```

Purpose:

```txt
Prepare long-term metadata-driven acceleration without prematurely building a no-code platform.
```

## 7.13 AI Layer Documents

```txt
12-ai-layer/00-ai-layer-philosophy.md
12-ai-layer/01-ai-context-contract.md
12-ai-layer/02-module-ai-context.md
12-ai-layer/03-ai-query-patterns.md
12-ai-layer/04-ai-assisted-crud-generation.md
12-ai-layer/05-ai-support-agent.md
12-ai-layer/06-ai-safety-boundaries.md
```

Purpose:

```txt
Allow AI-assisted development now.
Defer runtime AI until security, context, permissions, cost, and support boundaries are ready.
```

## 7.14 Security Documents

```txt
13-security/00-security-model.md
13-security/01-auth-security.md
13-security/02-tenant-isolation.md
13-security/03-permission-enforcement.md
13-security/04-api-security.md
13-security/05-data-security.md
13-security/06-secrets-management.md
13-security/07-security-testing.md
13-security/08-production-readiness-gate.md
13-security/09-security-stabilization-new-build-spec.md
```

Purpose:

```txt
Make security part of the foundation, not a patch after modules exist.
```

## 7.15 Testing and Quality Documents

```txt
14-testing-quality/00-testing-philosophy.md
14-testing-quality/01-unit-testing.md
14-testing-quality/02-integration-testing.md
14-testing-quality/03-api-testing.md
14-testing-quality/04-ui-testing.md
14-testing-quality/05-security-testing.md
14-testing-quality/06-regression-testing.md
14-testing-quality/07-test-data-fixtures.md
14-testing-quality/08-ci-quality-gates.md
```

Purpose:

```txt
Turn the manual into enforceable automated checks.
```

## 7.16 Deployment and Operations Documents

```txt
15-deployment-operations/00-environments.md
15-deployment-operations/01-vercel-deployment.md
15-deployment-operations/02-supabase-operations.md
15-deployment-operations/03-database-migrations-production.md
15-deployment-operations/04-monitoring-observability.md
15-deployment-operations/05-error-handling.md
15-deployment-operations/06-appcare-operations.md
15-deployment-operations/07-incident-response.md
15-deployment-operations/08-cost-management.md
```

Purpose:

```txt
Make AppCare operationally real and commercially viable.
```

## 7.17 Client Delivery Documents

```txt
16-client-delivery/00-one-day-delivery-playbook.md
16-client-delivery/01-client-discovery.md
16-client-delivery/02-scope-control.md
16-client-delivery/03-client-configuration.md
16-client-delivery/04-user-training.md
16-client-delivery/05-handover.md
16-client-delivery/06-support-maintenance.md
```

Purpose:

```txt
Turn the “one business day” promise into a repeatable operating process.
```

## 7.18 Module Specification Documents

```txt
17-module-specifications/00-module-spec-template.md
17-module-specifications/01-inventory-module.md
17-module-specifications/02-leave-module.md
17-module-specifications/03-crm-module.md
17-module-specifications/04-purchasing-module.md
17-module-specifications/05-expenses-module.md
17-module-specifications/06-assets-module.md
17-module-specifications/07-visitor-management-module.md
17-module-specifications/08-incident-reporting-module.md
```

Purpose:

```txt
Give Claude implementation-grade module contracts.
```

---

# 8. Current Completion State

As of this roadmap revision, the main planned Engineering Manual document set has been drafted as individual Markdown artifacts, subject to founder review and formal repository freeze.

Completed draft sections:

```txt
00 Meta
01 Foundation
02 Architecture
03 Design System
04 Kernel
05 SDK
06 Data
07 Business Objects
08 Module System
09 CLI / Generators
10 Platform Services
11 Dynamic Systems
12 AI Layer
13 Security
14 Testing & Quality
15 Deployment & Operations
16 Client Delivery
17 Module Specifications
```

Important caveat:

```txt
Drafted ≠ Frozen
Approved in chat ≠ Ready for Claude implementation
```

Before Claude restarts implementation, a formal freeze pass must happen.

---

# 9. Recommended Freeze Order

Do not freeze all documents randomly.

Freeze them in the order that reduces implementation risk.

## 9.1 Freeze Batch A — Governance and Doctrine

```txt
00-meta/00-roadmap.md
00-meta/01-manual-governance.md
00-meta/02-architecture-decision-records.md
00-meta/03-claude-workflow.md
00-meta/04-definition-of-done.md
01-foundation/00-vision.md
01-foundation/01-business-model.md
01-foundation/02-product-principles.md
01-foundation/03-platform-vs-modules.md
01-foundation/04-commercial-constraints.md
```

Purpose:

```txt
Make sure we know what OneDayOS is, how decisions are governed, and how Claude is allowed to work.
```

## 9.2 Freeze Batch B — Architecture and Risk

```txt
02-architecture/00-system-architecture.md
02-architecture/01-layer-boundaries.md
02-architecture/02-repository-architecture.md
02-architecture/03-runtime-architecture.md
02-architecture/04-technology-baseline.md
02-architecture/05-dependency-rules.md
02-architecture/06-architecture-risk-register.md
```

Purpose:

```txt
Lock the structure of the restarted platform before code starts.
```

## 9.3 Freeze Batch C — Security Foundation

```txt
13-security/00-security-model.md
13-security/01-auth-security.md
13-security/02-tenant-isolation.md
13-security/03-permission-enforcement.md
13-security/04-api-security.md
13-security/05-data-security.md
13-security/06-secrets-management.md
13-security/07-security-testing.md
13-security/08-production-readiness-gate.md
13-security/09-security-stabilization-new-build-spec.md
```

Purpose:

```txt
Prevent the restarted build from repeating the old MVP’s security gaps.
```

## 9.4 Freeze Batch D — Kernel, SDK, and Data

```txt
04-kernel/00-kernel-overview.md
04-kernel/01-authentication.md
04-kernel/02-organizations-tenancy.md
04-kernel/03-users-roles-permissions.md
04-kernel/04-authorization-enforcement.md
04-kernel/05-settings-configuration.md
04-kernel/06-feature-flags-subscriptions.md
04-kernel/07-routing-app-shell.md
04-kernel/08-kernel-api-contracts.md
05-sdk/*
06-data/*
```

Purpose:

```txt
Give Claude a coherent foundation implementation package.
```

## 9.5 Freeze Batch E — Design System

```txt
03-design-system/*
```

Purpose:

```txt
Prevent the restarted UI from becoming another generic admin starter.
```

## 9.6 Freeze Batch F — Business Objects and Module System

```txt
07-business-objects/*
08-module-system/*
09-cli-generators/*
```

Purpose:

```txt
Prepare safe reusable module generation.
```

## 9.7 Freeze Batch G — Testing, Deployment, and Operations

```txt
14-testing-quality/*
15-deployment-operations/*
```

Purpose:

```txt
Make the platform testable, deployable, monitorable, and supportable.
```

## 9.8 Freeze Batch H — Client Delivery and Module Specs

```txt
16-client-delivery/*
17-module-specifications/*
```

Purpose:

```txt
Make paid client delivery and module implementation repeatable.
```

## 9.9 Freeze Batch I — Deferred Contracts

```txt
10-platform-services/*
11-dynamic-systems/*
12-ai-layer/*
```

Purpose:

```txt
Keep future systems well-defined but blocked until evidence proves they are needed.
```

---

# 10. Implementation Roadmap After Freeze

After the freeze pass, implementation should happen in packages.

Claude should not receive the entire manual and be told to build everything.

Claude should receive one narrow Implementation Package at a time.

---

## 10.1 Implementation Package 1 — Repository and Tooling Foundation

Authoritative docs:

```txt
00-meta/03-claude-workflow.md
00-meta/04-definition-of-done.md
02-architecture/02-repository-architecture.md
02-architecture/04-technology-baseline.md
02-architecture/05-dependency-rules.md
14-testing-quality/08-ci-quality-gates.md
```

Build:

```txt
Next.js app scaffold
TypeScript configuration
Tailwind v4 configuration
shadcn/ui setup
Prisma 7 config
Vitest setup
Testing Library setup
Architecture-check scripts
Environment validation files
Base folder structure
CI/check scripts
```

Do not build:

```txt
Inventory
CRM
Leave
Platform Services
Runtime AI
Dynamic CRUD
Dynamic Forms
FastAPI
Background jobs
Per-client infrastructure
```

Exit criteria:

```txt
npm run check:all passes
prisma generate runs in build/check workflow
architecture checks exist
folder structure matches manual
no forbidden dependencies/imports
```

---

## 10.2 Implementation Package 2 — Kernel Security Foundation

Authoritative docs:

```txt
04-kernel/00-kernel-overview.md
04-kernel/01-authentication.md
04-kernel/02-organizations-tenancy.md
04-kernel/03-users-roles-permissions.md
04-kernel/04-authorization-enforcement.md
04-kernel/08-kernel-api-contracts.md
13-security/*
06-data/01-tenancy-data-isolation.md
```

Build:

```txt
Supabase Auth integration
Prisma User model
Registration API
Login flow
/api/kernel/auth/me
PlatformContext creation
Page auth helper
API auth helper
Org membership verification
RBAC models and permission matcher
Permission enforcement helpers
API wrapper and error response contract
Two-organization security fixtures/tests
```

Exit criteria:

```txt
Unauthenticated API returns JSON 401
Wrong-org access fails safely
Client-supplied orgId is rejected
Permission denial returns JSON 403
Admin wildcard does not bypass tenant isolation
Two-org tests pass
No route uses redirect-style auth in APIs
```

---

## 10.3 Implementation Package 3 — Database and Business Objects

Authoritative docs:

```txt
06-data/*
07-business-objects/*
05-sdk/02-sdk-db-access.md
05-sdk/04-sdk-events.md
```

Build:

```txt
Core Prisma schema
Organization / Subscription / OrgModule
User / Role / Permission / UserRole
Branch / Department
Employee
Product / ProductCategory
Customer
Supplier
Warehouse
Soft-delete helpers
Business Object services
Business Object APIs
Business Object events
Seed/test fixtures
```

Exit criteria:

```txt
Business Object CRUD uses PlatformContext
APIs live under /api/orgs/[orgSlug]/objects/...
No client-supplied orgId
Soft-delete behavior tested
Business Object events emitted
Two-org tests pass
Permission-denial tests pass
```

---

## 10.4 Implementation Package 4 — SDK and Module System

Authoritative docs:

```txt
05-sdk/*
08-module-system/*
09-cli-generators/00-generator-philosophy.md
09-cli-generators/01-module-generator.md
09-cli-generators/06-generator-safety-rails.md
```

Build:

```txt
@/sdk shared-safe exports
@/sdk/server
@/sdk/client
ModuleManifest types
Module registry
Static module composition root
OrgModule enablement helpers
Module navigation resolution
Module event declarations
Module generator CLI
Generated module security tests
check:generated
```

Exit criteria:

```txt
module:create generates safe module shell
Generated module uses /api/orgs/[orgSlug]/[moduleId]/...
Generated module uses PlatformContext
Generated module uses sdk.getDb(ctx)
Generated module rejects orgId
Generated module includes tenant and permission tests
Generated module has no forbidden imports
```

---

## 10.5 Implementation Package 5 — App Shell and Design System

Authoritative docs:

```txt
03-design-system/*
04-kernel/07-routing-app-shell.md
08-module-system/05-module-navigation.md
14-testing-quality/04-ui-testing.md
```

Build:

```txt
OneDayOS app shell
Sidebar
Header
Records navigation
Module navigation
Layout primitives
Brand tokens
Table components
Form components
Empty/loading/error state components
Permission-aware UI helpers
Optimistic UI patterns
Motion patterns
Accessibility baseline
```

Exit criteria:

```txt
UI does not look like stock admin starter
Sidebar is server-resolved
Active state matching is segment-aware
Business Objects appear under Records, not modules
Forms do not submit orgId
Tables use shared standards
Loading/error/empty states are finished states
Keyboard and accessibility basics pass
```

---

## 10.6 Implementation Package 6 — Inventory Module

Authoritative docs:

```txt
17-module-specifications/00-module-spec-template.md
17-module-specifications/01-inventory-module.md
07-business-objects/02-product.md
07-business-objects/05-warehouse.md
07-business-objects/04-supplier.md
08-module-system/*
09-cli-generators/*
```

Build:

```txt
Inventory module scaffold
InventoryProductExtension
StockBalance
StockMovement
StockAdjustment
Inventory APIs
Inventory pages
Inventory services
Inventory events
Inventory tests
```

Do not build:

```txt
Purchasing integration
Accounting valuation
Barcode hardware
Attachment Service
Notification Service
Approval Workflow Service
Runtime AI
```

Exit criteria:

```txt
Inventory does not own Product
Inventory does not own Warehouse
Inventory does not own Supplier
No InventoryProduct identity duplicate
Stock adjustment transaction is correct
Two-org tests pass
Permission-denial tests pass
Events emit safely
UI follows design system
```

---

## 10.7 Implementation Package 7 — First Client Delivery Workflow

Authoritative docs:

```txt
16-client-delivery/*
15-deployment-operations/*
13-security/08-production-readiness-gate.md
```

Build/process:

```txt
Client discovery brief template
Scope lock template
Client configuration checklist
Handover packet template
AppCare activation checklist
Support classification flow
Smoke test checklist
Founder guide draft
```

Exit criteria:

```txt
A real client can be provisioned without creating a new app
Client receives enabled modules and roles
Smoke tests pass
Handover packet exists
AppCare boundaries are clear
No per-client fork is created
```

---

# 11. Deferred Systems Policy

These are not implemented during the restarted foundation build:

```txt
Audit Log Service
Notification Service
Approval Workflow Service
Comments Service
Attachments Service
Activity Feed Service
Reporting Service
Search Service
Background Jobs
Dynamic Form Engine
Dynamic CRUD Engine
Dynamic Table View Engine
Import/Export Engine
View Builder
Runtime AI
AI Support Agent
AI Query
FastAPI backend
Redis
Queues
Dedicated search engine
Per-client infrastructure
```

Some contracts are written now so that future implementations do not violate architecture.

But contract-only documents do not authorize implementation.

---

# 12. Three Independent Use Cases Rule

The original rule was called the Three Client Rule.

The refined rule is:

```txt
A capability may be reviewed for promotion to Platform Service only after three independent use cases prove the same reusable need.
```

The three use cases can be:

```txt
three independent clients
three independent modules
three independent workflows
or a mix of the above
```

Examples:

```txt
Leave approvals
Purchasing approvals
Expense approvals
→ Approval Workflow Service candidate
```

```txt
Incident photos
Expense receipts
Asset warranty documents
→ Attachment Service candidate
```

```txt
Inventory list search
CRM customer search
Asset search
→ Search Service candidate
```

Important:

```txt
Three use cases trigger review.
They do not automatically trigger implementation.
```

Promotion requires:

```txt
Evidence log
Platform Service proposal
ADR if needed
Manual document update
Data model
SDK contract
Security model
Tests
Claude implementation package
```

---

# 13. New Module Policy

A new module can begin with one client.

That does not violate the platform model.

Correct pattern:

```txt
One client needs Fleet Management
→ classify request
→ create clean draft Fleet module if commercially justified
→ use SDK and PlatformContext
→ reuse Business Objects
→ avoid client-specific names
→ enable only for that client through OrgModule
→ improve into official reusable module if more clients need it
```

Wrong pattern:

```txt
Create client-acme-fleet folder
Fork the app
Add custom tables outside module system
Duplicate Employee or Supplier
Hard-code client workflow in Kernel
Build Platform Services casually
```

Every new module requires a module specification before implementation.

---

# 14. Client Delivery Policy

One-day delivery means:

```txt
Known scope
Approved module(s)
Client organization provisioning
Roles and permissions
Settings
Initial data
Smoke tests
Training
Handover
AppCare activation
```

It does not mean:

```txt
One-day custom software invention
Unlimited workflow changes
Arbitrary integrations
Runtime AI
Dedicated infrastructure
Messy data migration
New Platform Services
New generic engines
```

Every client project should end with a Productization Review:

```txt
What should become a bug fix?
What should become documentation?
What should become configuration?
What should become a reusable module enhancement?
What should become a new module candidate?
What should become Platform Service evidence?
What should be rejected as custom noise?
```

---

# 15. Founder Guide Track

The Engineering Manual is for implementation.

A separate Founder Guide should be created later for operator understanding.

Recommended folder:

```txt
docs/founder-guide/
  00-how-onedayos-works.md
  01-clients-tenants-and-infrastructure.md
  02-updates-deployments-and-appcare.md
  03-backups-outages-and-disaster-recovery.md
  04-costs-pricing-and-dedicated-infrastructure.md
  05-how-to-handle-client-requests.md
  06-how-to-use-claude-safely.md
```

Purpose:

```txt
Explain OneDayOS in founder/operator language.
Avoid forcing the founder to think like a senior engineer every time.
```

This is not part of the Engineering Manual implementation authority.

---

# 16. First ADR Registry and Backlog

The following decisions are the accepted initial ADR registry as of the UX Governance freeze pass.

```txt
ADR-0001: One shared platform, not per-client apps
ADR-0002: One shared PostgreSQL database with orgId tenancy for MVP
ADR-0003: PlatformContext over loose orgId
ADR-0004: SDK-only module access
ADR-0005: Business Objects conceptual layer
ADR-0006: FastAPI excluded from the core platform
ADR-0007: RLS deferred to Phase 1.5 defense-in-depth
ADR-0008: Platform Services require evidence
ADR-0009: Dynamic Systems deferred
ADR-0010: Normal clients use shared infrastructure
ADR-0011: Human-centred UX standard
```

Older draft backlog numbering is superseded by the ADR files under `00-meta/adrs/`.

---

# 17. Critical Gates

## 17.1 Manual Freeze Gate

Before Claude restarts implementation:

```txt
[ ] all relevant docs copied into docs/engineering-manual/
[ ] statuses normalized
[ ] superseded files marked
[ ] production readiness gate v2 selected as current gate
[ ] branch/department Business Object doc removed or reclassified
[ ] conflicts resolved
[ ] initial ADR backlog created
[ ] implementation package prepared
```

## 17.2 Foundation Build Gate

Before official modules:

```txt
[ ] repository structure implemented
[ ] architecture checks implemented
[ ] Kernel auth implemented
[ ] PlatformContext implemented
[ ] tenant isolation implemented
[ ] permission enforcement implemented
[ ] API contract implemented
[ ] SDK implemented
[ ] database schema implemented
[ ] Business Object services implemented
[ ] two-org tests pass
[ ] permission-denial tests pass
[ ] build/typecheck/test/check:architecture pass
```

## 17.3 Second Tenant Gate

Before onboarding a second real client organization into production:

```txt
[ ] wrong-org route access fails safely
[ ] wrong-org API reads fail safely
[ ] wrong-org API writes fail safely
[ ] client-supplied orgId is rejected
[ ] admin wildcard does not bypass tenant isolation
[ ] module-disabled behavior is tested
[ ] soft-deleted records do not surface normally
[ ] monitoring/error logging is minimally operational
[ ] backup/restore process is documented
```

## 17.4 Official Module Gate

Before a module is considered official/reusable:

```txt
[ ] module spec frozen
[ ] generated scaffold passes architecture checks
[ ] module does not duplicate Business Objects
[ ] module services use PlatformContext
[ ] module APIs use /api/orgs/[orgSlug]/[moduleId]/...
[ ] module has two-org tenant tests
[ ] module has permission-denial tests
[ ] module has event tests
[ ] module UI follows design system
[ ] module can be enabled/disabled through OrgModule
```

## 17.5 AppCare Gate

Before serious AppCare claims:

```txt
[ ] production deployment process documented
[ ] migration process documented
[ ] monitoring configured
[ ] error tracking configured
[ ] backup process documented
[ ] restore drill completed or clearly scheduled
[ ] incident response runbook exists
[ ] support/maintenance boundaries documented
[ ] cost review process exists
```

---

# 18. Claude Implementation Package Template

Every Claude task should use this structure.

```md
# Claude Implementation Package

## Task
Implement [specific subsystem].

## Authoritative Documents
- docs/engineering-manual/[path].md
- docs/engineering-manual/[path].md

## Scope
Implement only:
- ...

Do not implement:
- ...

## Hard Rules
- Use PlatformContext.
- Use sdk.getDb(ctx), never sdk.getDb(orgId).
- Do not accept client-supplied orgId.
- APIs return JSON only.
- API auth returns 401 JSON, never redirects.
- Enforce permissions in APIs and services.
- Modules do not import @/kernel/*.
- Modules do not import raw Prisma.
- Modules do not import other modules.
- Add tests.

## Required Tests
- ...

## Verification Commands
- npm run lint
- npm run typecheck
- npm run test:run
- npm run build
- npm run check:architecture
- npm run check:generated, if generator work

## Stop Conditions
Stop and report if:
- manual conflicts exist
- a deferred system seems required
- a new dependency seems necessary
- an ADR appears required
- implementation would require per-client infrastructure
- implementation would require FastAPI/runtime AI/background jobs/platform service
```

---

# 19. Architecture Decisions Locked by This Roadmap

These are roadmap-level commitments unless changed by ADR.

```txt
One shared platform
One normal production deployment
One normal production database
Clients are Organizations inside OneDayOS
Supabase account/project is owned by OneDayOS, not normal clients
Vercel project is owned by OneDayOS, not normal clients
Tenant boundary is Organization
orgSlug locates; PlatformContext authorizes
Client-supplied orgId is forbidden
SDK is the module boundary
Modules never import Kernel internals
Modules never import other modules
Business Objects are shared and module-neutral
Platform Services are deferred until proven
Dynamic Systems are deferred until proven
Runtime AI is deferred
FastAPI is excluded from the core platform
Design System must precede serious UI/module implementation
Testing and CI are architecture enforcement
AppCare is not unlimited custom development
```

---

# 20. Current Recommended Next Step

After this roadmap is approved, the next practical step is not to create more new manual sections.

The next practical step is:

```txt
Manual Consolidation and Freeze Pass
```

That means:

```txt
1. Move all generated Markdown artifacts into docs/engineering-manual/.
2. Normalize file names and paths.
3. Normalize document headers.
4. Mark superseded versions.
5. Resolve contradictions.
6. Create initial ADR files.
7. Freeze Batch A, B, C, and D first.
8. Create Claude Implementation Package 1.
9. Only then ask Claude to restart implementation.
```

Recommended immediate work order:

```txt
1. Freeze governance/meta docs.
2. Freeze foundation docs.
3. Freeze architecture/security/kernel/sdk/data docs.
4. Create ADR-0001 through ADR-0010.
5. Prepare Claude Implementation Package 1.
6. Start restarted platform implementation.
```

---

# 21. Final Rule

OneDayOS should become easier to build after this manual, not harder.

The manual succeeds only if it enables this workflow:

```txt
Founder approves scope
Architecture is already decided
Claude receives a narrow package
Generator creates safe scaffold
Tests enforce the boundaries
Module ships faster
Next client benefits from the improvement
```

The manual fails if it becomes:

```txt
A document graveyard
A reason to delay forever
A set of rules nobody follows
A replacement for product judgment
An excuse for overengineering
```

Therefore, the roadmap’s final rule is:

```txt
Document enough to prevent architectural drift.
Implement narrowly enough to maintain momentum.
Productize every reusable lesson.
Never fork the platform casually.
```

---

# ADR-0011 UX Governance Amendment

ADR-0011 registers the human-centred UX governance package as the next design-system governance layer.

New roadmap documents:

```txt
00-meta/adrs/ADR-0011-human-centred-ux-standard.md
03-design-system/09-ux-constitution.md
03-design-system/10-page-patterns.md
03-design-system/11-module-ux-contract.md
03-design-system/12-usability-review-checklist.md
03-design-system/templates/module-ux-review.md
14-testing-quality/09-ux-conformance-testing.md
```

Required implementation sequence after Founder review:

```txt
1. UX Governance
2. Shared Page Patterns
3. Generator UX Contract
4. Inventory UX Conformance
5. CI + Accessibility Gates
6. Organization and Records retrofit
```

The UX governance documents are draft governance until reviewed and frozen. They must not be used to expand implementation scope before Founder approval.
