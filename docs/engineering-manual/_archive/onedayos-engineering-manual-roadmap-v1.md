# OneDayOS Engineering Manual Roadmap v1.0

This roadmap should become the **single source of truth** for OneDayOS architecture, implementation conventions, Claude Code instructions, and future module development.

The uploaded kernel plan is the current implementation reference. It establishes the present three-layer implementation model, the SDK rule, shared `org_id` database rule, Three Client Rule, event naming convention, soft-delete rule, and the Dynamic Form Engine gate. It also records important open risks: `sdk.permissions.can()` is not yet enforced, org membership checks are incomplete, `requireAuth()` returns redirects instead of API-safe JSON errors, and the live database migration/seed has not yet been verified against Postgres. fileciteturn4file5 fileciteturn4file2 fileciteturn4file1

The manual should not be written as a “nice architecture document.” It should be written as an **implementation operating system** for engineers and AI agents.

---

# 1. Roadmap Philosophy

## Core rule

Claude Code should never be asked:

> “Build OneDayOS.”

Claude Code should be asked:

> “Using frozen Engineering Manual document `XX`, implement only the subsystem described there. Do not invent architecture.”

Each manual document must be detailed enough that a senior engineer or coding agent can implement it without making new architectural decisions.

---

# 2. Manual Status System

Every manual document should have one of these statuses:

| Status | Meaning |
|---|---|
| `Draft` | Being written. Not safe for implementation. |
| `Review` | Ready for architectural critique. |
| `Frozen` | Approved. Claude may implement from it. |
| `Amended` | Frozen but changed through an explicit amendment. |
| `Superseded` | Replaced by a newer document. |
| `Deferred` | Intentionally not implemented yet. |

No subsystem should be implemented from a `Draft` document.

---

# 3. Manual Folder Structure

Use this structure:

```txt
docs/
  engineering-manual/
    00-meta/
      00-roadmap.md
      01-manual-governance.md
      02-architecture-decision-records.md
      03-claude-workflow.md
      04-definition-of-done.md

    01-foundation/
      00-vision.md
      01-business-model.md
      02-product-principles.md
      03-platform-vs-modules.md
      04-commercial-constraints.md

    02-architecture/
      00-system-architecture.md
      01-layer-boundaries.md
      02-repository-architecture.md
      03-runtime-architecture.md
      04-technology-baseline.md
      05-dependency-rules.md
      06-architecture-risk-register.md

    03-design-system/
      00-design-vision.md
      01-brand-system.md
      02-layout-system.md
      03-component-standards.md
      04-table-standards.md
      05-form-standards.md
      06-empty-loading-error-states.md
      07-interaction-motion-standards.md
      08-accessibility-standards.md

    04-kernel/
      00-kernel-overview.md
      01-authentication.md
      02-organizations-tenancy.md
      03-users-roles-permissions.md
      04-authorization-enforcement.md
      05-settings-configuration.md
      06-feature-flags-subscriptions.md
      07-routing-app-shell.md
      08-kernel-api-contracts.md

    05-sdk/
      00-sdk-overview.md
      01-sdk-public-api.md
      02-sdk-db-access.md
      03-sdk-auth-permissions.md
      04-sdk-events.md
      05-sdk-compatibility-versioning.md
      06-sdk-testing-contract.md

    06-data/
      00-database-architecture.md
      01-tenancy-data-isolation.md
      02-prisma-conventions.md
      03-soft-delete-archival.md
      04-migrations-seeding.md
      05-data-validation-zod.md
      06-row-level-security-plan.md
      07-backup-restore.md

    07-business-objects/
      00-business-object-philosophy.md
      01-employee.md
      02-product.md
      03-customer.md
      04-supplier.md
      05-warehouse.md
      06-branch-department.md
      07-business-object-extension-pattern.md
      08-business-object-event-contracts.md

    08-module-system/
      00-module-philosophy.md
      01-module-manifest.md
      02-module-loader-registry.md
      03-module-folder-contract.md
      04-module-permissions.md
      05-module-navigation.md
      06-module-events.md
      07-module-dependencies.md
      08-module-versioning.md
      09-module-testing.md

    09-cli-generators/
      00-generator-philosophy.md
      01-module-generator.md
      02-crud-generator.md
      03-form-generator.md
      04-api-generator.md
      05-test-generator.md
      06-generator-safety-rails.md

    10-platform-services/
      00-platform-services-philosophy.md
      01-three-client-rule.md
      02-audit-log-service.md
      03-notification-service.md
      04-approval-workflow-service.md
      05-comments-service.md
      06-attachments-service.md
      07-activity-feed-service.md
      08-reporting-service.md
      09-search-service.md
      10-background-jobs.md

    11-dynamic-systems/
      00-dynamic-systems-philosophy.md
      01-dynamic-form-engine.md
      02-dynamic-crud-engine.md
      03-dynamic-table-view-engine.md
      04-field-metadata-schema.md
      05-import-export-engine.md
      06-view-builder.md

    12-ai-layer/
      00-ai-layer-philosophy.md
      01-ai-context-contract.md
      02-module-ai-context.md
      03-ai-query-patterns.md
      04-ai-assisted-crud-generation.md
      05-ai-support-agent.md
      06-ai-safety-boundaries.md

    13-security/
      00-security-model.md
      01-auth-security.md
      02-tenant-isolation.md
      03-permission-enforcement.md
      04-api-security.md
      05-data-security.md
      06-secrets-management.md
      07-security-testing.md
      08-production-readiness-gate.md

    14-testing-quality/
      00-testing-philosophy.md
      01-unit-testing.md
      02-integration-testing.md
      03-api-testing.md
      04-ui-testing.md
      05-security-testing.md
      06-regression-testing.md
      07-test-data-fixtures.md
      08-ci-quality-gates.md

    15-deployment-operations/
      00-environments.md
      01-vercel-deployment.md
      02-supabase-operations.md
      03-database-migrations-production.md
      04-monitoring-observability.md
      05-error-handling.md
      06-appcare-operations.md
      07-incident-response.md
      08-cost-management.md

    16-client-delivery/
      00-one-day-delivery-playbook.md
      01-client-discovery.md
      02-scope-control.md
      03-client-configuration.md
      04-user-training.md
      05-handover.md
      06-support-maintenance.md

    17-module-specifications/
      00-module-spec-template.md
      01-inventory-module.md
      02-leave-module.md
      03-crm-module.md
      04-purchasing-module.md
      05-expenses-module.md
      06-assets-module.md
      07-visitor-management-module.md
      08-incident-reporting-module.md
```

---

# 4. Recommended Writing Order

Do **not** write the documents in numeric order only. Write them in the order that reduces architectural risk fastest.

## Phase A — Doctrine and Guardrails

Write first:

1. `00-meta/00-roadmap.md`
2. `00-meta/01-manual-governance.md`
3. `01-foundation/00-vision.md`
4. `02-architecture/00-system-architecture.md`
5. `02-architecture/01-layer-boundaries.md`
6. `02-architecture/05-dependency-rules.md`
7. `13-security/08-production-readiness-gate.md`

Reason: before Claude writes more code, the project needs doctrine, boundaries, and hard stop conditions.

---

## Phase B — Current Kernel Reconciliation

Write next:

1. `04-kernel/00-kernel-overview.md`
2. `04-kernel/01-authentication.md`
3. `04-kernel/02-organizations-tenancy.md`
4. `04-kernel/03-users-roles-permissions.md`
5. `04-kernel/04-authorization-enforcement.md`
6. `06-data/01-tenancy-data-isolation.md`
7. `13-security/02-tenant-isolation.md`
8. `13-security/03-permission-enforcement.md`

Reason: the current plan explicitly says the kernel exists but tenant isolation is not yet production-safe. Permissions exist but are not enforced, org membership checks are incomplete, and API auth behavior needs correction. These are blockers before any serious module work. fileciteturn4file2

---

## Phase C — Design System Before Business Modules

Write next:

1. `03-design-system/00-design-vision.md`
2. `03-design-system/01-brand-system.md`
3. `03-design-system/02-layout-system.md`
4. `03-design-system/03-component-standards.md`
5. `03-design-system/04-table-standards.md`
6. `03-design-system/05-form-standards.md`
7. `03-design-system/06-empty-loading-error-states.md`
8. `03-design-system/07-interaction-motion-standards.md`

Reason: the first generated UI felt like a generic SaaS/admin starter. If the design system is not frozen before module work, every module will inherit generic dashboard patterns.

---

## Phase D — SDK, Data, and Business Objects

Write next:

1. `05-sdk/00-sdk-overview.md`
2. `05-sdk/01-sdk-public-api.md`
3. `05-sdk/02-sdk-db-access.md`
4. `06-data/00-database-architecture.md`
5. `06-data/02-prisma-conventions.md`
6. `06-data/03-soft-delete-archival.md`
7. `07-business-objects/00-business-object-philosophy.md`
8. `07-business-objects/07-business-object-extension-pattern.md`

Reason: modules must consume the platform only through `@/sdk`, and shared business entities must remain minimal and reusable. The uploaded plan already treats SDK-only access and Business Object minimalism as hard constraints. fileciteturn4file1 fileciteturn4file7

---

## Phase E — Module System and Generator Contracts

Write next:

1. `08-module-system/00-module-philosophy.md`
2. `08-module-system/01-module-manifest.md`
3. `08-module-system/02-module-loader-registry.md`
4. `08-module-system/03-module-folder-contract.md`
5. `08-module-system/04-module-permissions.md`
6. `08-module-system/06-module-events.md`
7. `09-cli-generators/00-generator-philosophy.md`
8. `09-cli-generators/01-module-generator.md`
9. `09-cli-generators/06-generator-safety-rails.md`

Reason: the module builder is useful, but generated modules must not repeat today’s security weaknesses. The current scaffold emits events and uses the SDK, but the manual must tighten permission enforcement, org derivation, generated API behavior, and manifest rules. fileciteturn4file9

---

## Phase F — Dynamic Systems, but Only as Strategy

Write next:

1. `11-dynamic-systems/00-dynamic-systems-philosophy.md`
2. `11-dynamic-systems/04-field-metadata-schema.md`
3. `11-dynamic-systems/01-dynamic-form-engine.md`
4. `11-dynamic-systems/02-dynamic-crud-engine.md`

Important: these should be **design documents**, not implementation tickets yet. The current plan correctly says the Dynamic Form Engine should not be built until three modules have hand-coded forms and the pain is proven. fileciteturn4file1

---

## Phase G — Platform Services

Write after at least three module patterns exist:

1. `10-platform-services/00-platform-services-philosophy.md`
2. `10-platform-services/01-three-client-rule.md`
3. `10-platform-services/02-audit-log-service.md`
4. `10-platform-services/03-notification-service.md`
5. `10-platform-services/04-approval-workflow-service.md`
6. `10-platform-services/08-reporting-service.md`
7. `10-platform-services/09-search-service.md`
8. `10-platform-services/10-background-jobs.md`

Reason: Platform Services should not be invented early. The uploaded plan intentionally deferred audit logs, notifications, approvals, activity timelines, comments, attachments, and background jobs until actual module demand proves the need. fileciteturn4file7

---

## Phase H — First Official Module

Write last before implementing Inventory:

1. `17-module-specifications/00-module-spec-template.md`
2. `17-module-specifications/01-inventory-module.md`

Inventory should be treated as the **first proof that the platform works**, not as the thing that defines the platform.

---

# 5. Detailed Document Roadmap

## 00-meta/00-roadmap.md — Engineering Manual Roadmap

**Purpose:** Defines the full document map, writing order, implementation gates, and review process.

**Must include:**

- Why the Engineering Manual exists.
- Difference between architecture docs and implementation-grade docs.
- Manual status system.
- Required review steps.
- Freeze policy.
- How amendments work.
- How Claude Code consumes the manual.

**Acceptance criteria:**

- A new engineer can understand which document to read first.
- Claude can be told which document is authoritative.
- No subsystem can be implemented without a frozen source document.

---

## 00-meta/01-manual-governance.md — Manual Governance

**Purpose:** Prevents the manual from becoming stale or contradictory.

**Must include:**

- Document ownership.
- Versioning.
- Review process.
- How to mark conflicts.
- How to supersede documents.
- How to record architectural exceptions.
- Rule: “As-built” code does not automatically override the manual; discrepancies must become ADRs.

**Acceptance criteria:**

- Every document has `Status`, `Version`, `Owner`, `Last Updated`, `Supersedes`, and `Implementation Allowed`.
- Every change to a frozen document requires either an amendment or ADR.

---

## 00-meta/02-architecture-decision-records.md — ADR System

**Purpose:** Creates a formal place for important decisions.

**Must include:**

- ADR template.
- Decision categories.
- When an ADR is required.
- How to reverse decisions.
- Required sections: context, decision, alternatives, consequences, follow-up tasks.

**Examples of immediate ADRs:**

```txt
ADR-0001: One database, shared tables, org_id tenancy.
ADR-0002: Business Objects are conceptually separate but physically in Kernel schema for MVP.
ADR-0003: Modules may import only from @/sdk.
ADR-0004: Dynamic Forms deferred until Three Client Rule trigger.
ADR-0005: RLS deferred to Phase 1.5, but tenant isolation must be enforced in application code now.
```

**Acceptance criteria:**

- Every major disagreement has a place to be resolved.
- Claude cannot silently choose alternatives.

---

## 00-meta/03-claude-workflow.md — Claude Code Workflow

**Purpose:** Defines how Claude Code should be used.

**Must include:**

- Claude is an implementer, not architect.
- Claude receives one frozen document at a time.
- Claude must produce a plan before code.
- Claude must identify files to modify before editing.
- Claude must write or update tests.
- Claude must not add dependencies without approval.
- Claude must not create Platform Services early.
- Claude must not generate generic SaaS UI patterns.

**Required implementation prompt template:**

```md
You are implementing OneDayOS subsystem [NAME].

Authoritative document:
docs/engineering-manual/[PATH].md

Rules:
- Do not invent architecture.
- Do not import from @/kernel in modules.
- Do not bypass sdk.getDb(orgId).
- Do not accept client-supplied orgId.
- Every API returns { data, error }.
- Add tests before or with implementation.
- Stop and report if the manual is ambiguous.

Task:
Implement only the scope defined in this document.
```

**Acceptance criteria:**

- Claude’s scope is always narrow.
- Architecture drift becomes visible immediately.

---

## 00-meta/04-definition-of-done.md — Definition of Done

**Purpose:** Defines what “finished” means.

**Must include:**

- Documentation done.
- Tests passing.
- TypeScript passing.
- Build passing.
- Security checks passing.
- Tenant isolation verified.
- No forbidden imports.
- No unhandled API errors.
- No undocumented deviations.
- No generic UI regressions.

**Acceptance criteria:**

A subsystem is not done unless:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

all pass, and any subsystem-specific checks pass.

---

# 6. Foundation Documents

## 01-foundation/00-vision.md — Product Vision

**Purpose:** Defines what OneDayOS is and is not.

**Must include:**

- OneDayOS is a Business Operating System.
- Customers buy OneDayOS plus modules, not separate apps.
- One deployment, one database, one login.
- Built for Philippine SMEs.
- One-day delivery is a business promise, not an excuse for weak architecture.
- Comparable systems: Odoo, ERPNext, Dynamics, Salesforce.
- Long-term positioning: “Vercel for internal business software.”

**Must explicitly reject:**

- SaaS starter thinking.
- Admin dashboard templates.
- One-off client apps.
- Module-specific duplicated entities.
- Speed over platform correctness.

**Acceptance criteria:**

- Any future contributor can explain OneDayOS in one paragraph.
- Every architecture decision can be evaluated against this vision.

---

## 01-foundation/01-business-model.md — Business Model

**Purpose:** Connects architecture to revenue.

**Must include:**

- Initial build: ₱20,000+.
- Recurring AppCare: ₱3,500/month.
- What AppCare includes.
- Future module revenue.
- Premium AI.
- Marketplace.
- Integrations.
- Hosting cost constraints.
- Why low operational burden matters.

**Acceptance criteria:**

- Architecture decisions must consider delivery speed, support cost, and recurring revenue.
- Custom work that cannot be reused is treated as margin erosion.

---

## 01-foundation/02-product-principles.md — Product Principles

**Purpose:** Defines product behavior.

**Must include:**

- Configure before customize.
- Reuse before build.
- Convention before configuration.
- Metadata before hand-coded repetition.
- Standard workflows before bespoke workflows.
- Premium UX before feature sprawl.
- Security before tenant growth.
- Platform maturity before module count.

**Acceptance criteria:**

- Product decisions have a clear hierarchy.
- Scope creep can be rejected with principles.

---

## 01-foundation/03-platform-vs-modules.md — Platform vs Modules

**Purpose:** Clarifies what belongs in the platform.

**Must include:**

- Kernel responsibilities.
- Business Object responsibilities.
- Platform Service responsibilities.
- Module responsibilities.
- Client Configuration responsibilities.
- Three Client Rule.
- Exception process.

**Acceptance criteria:**

- A new feature can be classified without debate.
- Overengineering has a formal check.

---

## 01-foundation/04-commercial-constraints.md — Commercial Constraints

**Purpose:** Keeps engineering aligned with the business.

**Must include:**

- Delivery must support one-business-day implementation.
- Support burden must stay low.
- Modules must be repeatable.
- Configuration must be understandable by non-engineers eventually.
- Platform must support hundreds of SMEs without per-client forks.
- No architectural choice should require enterprise ops too early.

**Acceptance criteria:**

- Technical elegance cannot violate commercial reality.
- Every proposed service must justify operational cost.

---

# 7. Architecture Documents

## 02-architecture/00-system-architecture.md — System Architecture

**Purpose:** Defines the master architecture.

**Locked architecture:**

```txt
Kernel
  ↓
Business Objects
  ↓
Platform Services
  ↓
Business Modules
  ↓
Client Configuration
```

**Important clarification:**

Business Objects are **conceptually a separate layer**, even if some current MVP tables physically live in the Kernel schema. This resolves the current ambiguity where the uploaded plan describes Business Objects as Layer 1.5 while also saying they are part of the Kernel schema. fileciteturn4file5

**Must include:**

- Layer definitions.
- Direction of dependencies.
- Forbidden dependencies.
- Extension points.
- Runtime boundaries.
- Future marketplace implications.

**Acceptance criteria:**

- No module can directly call another module.
- No module can import Kernel internals.
- No Platform Service can depend on a business module.
- Business Objects cannot contain module-specific fields.

---

## 02-architecture/01-layer-boundaries.md — Layer Boundaries

**Purpose:** Provides exact classification rules.

**Must include this decision table:**

| Capability | Belongs In | Example |
|---|---|---|
| Auth/session | Kernel | Login, session, route guard |
| Organizations | Kernel | Org, branch, department |
| Shared entity | Business Objects | Employee, Product, Customer |
| Cross-cutting reusable feature | Platform Services | Approvals, notifications |
| Domain-specific workflow | Business Module | Inventory adjustment |
| Client-specific preference | Client Configuration | Enabled modules, labels |

**Acceptance criteria:**

- Every future feature request can be classified.
- The Three Client Rule has examples and edge cases.

---

## 02-architecture/02-repository-architecture.md — Repository Architecture

**Purpose:** Defines folder structure and ownership.

**Must include:**

- `src/app`
- `src/kernel`
- `src/sdk`
- `src/modules`
- `src/components`
- `src/lib`
- `src/config`
- `prisma`
- `scripts`
- `docs`

**Must define forbidden imports:**

```txt
Allowed:
modules/* → @/sdk
modules/* → @/components
modules/* → module-local files

Forbidden:
modules/* → @/kernel/*
modules/* → another module/*
platform services → modules/*
components/ui → business logic
```

**Acceptance criteria:**

- Import rules can be linted.
- Claude knows where every new file belongs.

---

## 02-architecture/03-runtime-architecture.md — Runtime Architecture

**Purpose:** Explains how the app runs.

**Must include:**

- Next.js App Router structure.
- Server components vs client components.
- API routes.
- Supabase Auth.
- Prisma/Postgres.
- Vercel deployment.
- Module manifest registration.
- Event bus lifecycle.
- Future background jobs.

**Acceptance criteria:**

- Engineers understand what runs server-side, client-side, and in the database.
- No accidental client exposure of server-only code.

---

## 02-architecture/04-technology-baseline.md — Technology Baseline

**Purpose:** Freezes supported versions and conventions.

**Must include:**

- Next.js baseline.
- React baseline.
- TypeScript baseline.
- Tailwind baseline.
- shadcn/ui baseline.
- Supabase baseline.
- Prisma baseline.
- Zod baseline.
- Vitest baseline.
- Node version.
- Package management rules.

The uploaded plan says the as-built stack uses Next.js 16.2.9, TypeScript 5, Tailwind CSS v4, shadcn/ui 4.12, Supabase, Prisma 7, Zod 4, React Hook Form 7, Vitest 4, and Vercel. fileciteturn4file5

**Acceptance criteria:**

- No accidental dependency drift.
- Upgrade decisions require ADRs.

---

## 02-architecture/05-dependency-rules.md — Dependency Rules

**Purpose:** Protects architecture from erosion.

**Must include:**

- Import rules.
- Dependency direction.
- Third-party dependency approval.
- Server/client package boundaries.
- UI dependency standards.
- Database access restrictions.
- SDK-only module contract.

**Acceptance criteria:**

- ESLint rules or dependency-cruiser rules can enforce it.
- Claude cannot add packages casually.

---

## 02-architecture/06-architecture-risk-register.md — Architecture Risk Register

**Purpose:** Tracks known architectural risks.

**Immediate entries:**

| Risk | Severity | Manual Owner | Required Resolution |
|---|---:|---|---|
| Tenant isolation incomplete | Critical | Security/Kernel | Fix before second tenant |
| Permissions exist but are unenforced | Critical | Kernel/Security | Add route/service guards |
| API auth redirects instead of JSON 401 | High | Kernel/API | Create API auth helper |
| Soft-delete extension incomplete | High | Data | Cover bypass paths or document restrictions |
| UI too generic | High | Design System | Freeze design standards |
| Dynamic systems premature | Medium | Architecture | Keep deferred until trigger |
| Module generator can create insecure routes | High | CLI/Module System | Harden generator contract |

The uploaded plan already flags several of these as known open issues. fileciteturn4file2

**Acceptance criteria:**

- Risks are visible before implementation.
- No critical risk can be ignored during module rollout.

---

# 8. Design System Documents

## 03-design-system/00-design-vision.md — Design Vision

**Purpose:** Defines what OneDayOS should feel like.

**Must include:**

- Premium.
- Minimal.
- Fast.
- Data-dense.
- Keyboard-first.
- Calm, not playful.
- Inspired by Linear, Stripe, Vercel, Attio, Raycast, Notion.
- Not Bootstrap.
- Not generic admin template.
- Not crowded ERP from the 2000s.

**Acceptance criteria:**

- Screenshots can be judged against a clear standard.
- Claude cannot generate generic dashboards.

---

## 03-design-system/01-brand-system.md — Brand System

**Purpose:** Defines colors, typography, spacing, and identity.

**Must include:**

- OneDayOS brand color usage.
- Neutral palette.
- Dark mode rules.
- Typography hierarchy.
- Border radius.
- Shadows.
- Icon style.
- Logo rules.
- Client theming rules.

**Important correction:**

Do not hijack generic shadcn `accent` tokens for brand orange. The uploaded plan notes that the as-built version moved from `--color-accent` to `--color-brand` because overriding `accent` affected hover states globally. fileciteturn4file8

**Acceptance criteria:**

- Every component can inherit brand tokens consistently.
- Client theming is possible without rewriting components.

---

## 03-design-system/02-layout-system.md — Layout System

**Purpose:** Defines page structure.

**Must include:**

- App shell.
- Sidebar.
- Header.
- Content width.
- Page titles.
- Toolbar placement.
- Breadcrumbs.
- Module navigation.
- Detail page layout.
- Split views.
- Responsive behavior.

**Acceptance criteria:**

- Every module page feels like part of the same product.
- Module teams do not invent layouts.

---

## 03-design-system/03-component-standards.md — Component Standards

**Purpose:** Defines reusable component behavior.

**Must include:**

- Buttons.
- Inputs.
- Selects.
- Dialogs.
- Drawers.
- Dropdowns.
- Tabs.
- Cards.
- Badges.
- Tooltips.
- Popovers.
- Toasts.
- Skeletons.

**Acceptance criteria:**

- Components have consistent variants.
- Claude knows which component to use for each interaction.

---

## 03-design-system/04-table-standards.md — Table Standards

**Purpose:** Makes tables a core product strength.

**Must include:**

- Density.
- Column alignment.
- Sticky headers.
- Row hover.
- Row actions.
- Bulk actions.
- Sorting.
- Filtering.
- Search.
- Empty state.
- Loading state.
- Pagination.
- Column visibility.
- Keyboard navigation.

**Acceptance criteria:**

- Tables are beautiful and useful.
- No module builds its own table style.

---

## 03-design-system/05-form-standards.md — Form Standards

**Purpose:** Defines how all forms work before Dynamic Forms exist.

**Must include:**

- Field layout.
- Required fields.
- Validation.
- Error messages.
- Help text.
- Tooltips.
- Save/cancel behavior.
- Optimistic create/update.
- Dirty state.
- Keyboard submit.
- Mobile behavior.

The uploaded plan already includes tooltip/help and optimistic UI standards; the design manual should expand these into UI-wide rules. fileciteturn4file7

**Acceptance criteria:**

- Hand-coded forms are consistent.
- Future Dynamic Form Engine has real patterns to extract.

---

## 03-design-system/06-empty-loading-error-states.md

**Purpose:** Prevents dead-feeling software.

**Must include:**

- Empty state patterns.
- Loading skeletons.
- Error recovery.
- Permission-denied states.
- No-data states.
- First-time module states.
- Failed network states.
- Maintenance states.

**Acceptance criteria:**

- No screen appears broken when data is missing.
- Empty states help users act.

---

## 03-design-system/07-interaction-motion-standards.md

**Purpose:** Defines perceived speed.

**Must include:**

- <100ms perceived interaction target.
- Optimistic UI.
- Hover transitions.
- Layout animations.
- Skeletons over spinners.
- Toast timing.
- Disabled states.
- Button feedback.

**Acceptance criteria:**

- Every mutation feels instant.
- Motion supports clarity, not decoration.

---

## 03-design-system/08-accessibility-standards.md

**Purpose:** Ensures product usability.

**Must include:**

- Keyboard navigation.
- Focus states.
- Color contrast.
- Screen reader labels.
- Dialog focus trapping.
- Table navigation.
- Form error association.
- Reduced motion.

**Acceptance criteria:**

- UI remains usable without mouse.
- Accessibility is built into component standards.

---

# 9. Kernel Documents

## 04-kernel/00-kernel-overview.md

**Purpose:** Defines what Kernel is allowed to contain.

**Kernel may contain:**

- Authentication.
- Organizations.
- Users.
- Roles.
- Permissions.
- Feature flags.
- Subscriptions.
- Settings.
- Module registry.
- Event bus interface.
- SDK backing implementations.
- App shell routing primitives.

**Kernel must not contain:**

- Inventory logic.
- CRM logic.
- Leave logic.
- Approval engine unless promoted later.
- Notification engine unless promoted later.
- Client-specific workflows.

**Acceptance criteria:**

- Kernel stays small.
- “Needed by every module” is enforced.

---

## 04-kernel/01-authentication.md

**Purpose:** Defines auth implementation.

**Must include:**

- Supabase Auth responsibilities.
- Prisma `User` responsibilities.
- Auth ↔ DB sync.
- Registration flow.
- Login flow.
- Logout flow.
- Session refresh.
- Server client vs browser client.
- API auth behavior.
- Service role usage.
- Rollback behavior.

The uploaded plan specifically requires Supabase Auth and Prisma records to be created through the same server route to avoid orphaned auth users. fileciteturn4file1

**Acceptance criteria:**

- No client directly creates Supabase users for platform registration.
- No route confuses auth user with platform user.
- API routes return JSON errors, not redirects.

---

## 04-kernel/02-organizations-tenancy.md

**Purpose:** Defines org, branch, department, tenant membership.

**Must include:**

- `Organization`.
- `Branch`.
- `Department`.
- `org_id` rule.
- Org slug routing.
- Membership check.
- Single-org user assumption.
- Future multi-org user path.
- Org switching.
- Suspended org behavior.

**Critical rule:**

A user may only access `/:orgSlug/*` if their platform `User.orgId` matches that org.

**Acceptance criteria:**

- A user cannot load another org’s dashboard by guessing a slug.
- Org lookup and membership validation happen together.

---

## 04-kernel/03-users-roles-permissions.md

**Purpose:** Defines RBAC model.

**Must include:**

- User.
- Employee.
- Role.
- UserRole.
- Permission.
- Wildcard permissions.
- Module/action/resource model.
- Future ABAC via `conditions`.
- Admin role.
- Staff role.
- Permission naming.

**Acceptance criteria:**

- Roles are org-scoped.
- Permissions can be tested.
- Permission shape can evolve without breaking modules.

---

## 04-kernel/04-authorization-enforcement.md

**Purpose:** Defines how permissions are actually enforced.

**Must include:**

- `can()` behavior.
- Required checks in API routes.
- Required checks in server actions/services.
- Required checks in UI rendering.
- Difference between hiding buttons and enforcing permissions.
- Helper functions.
- Permission denial response format.
- Test matrix.

**Hard rule:**

UI permission checks are convenience only. API/service permission checks are mandatory.

**Acceptance criteria:**

- No mutation route exists without permission enforcement.
- Every generated module route includes permission checks.
- Permission tests cover allow and deny cases.

---

## 04-kernel/05-settings-configuration.md

**Purpose:** Defines settings and configuration storage.

**Must include:**

- `Setting` model.
- JSON value conventions.
- Org-scoped settings.
- Module-scoped settings.
- Kernel settings.
- Validation schemas.
- Defaults.
- Runtime config vs DB config.
- Client-safe config.

**Acceptance criteria:**

- Settings are queryable.
- Modules do not invent their own settings pattern.

---

## 04-kernel/06-feature-flags-subscriptions.md

**Purpose:** Defines enabled modules and plan limits.

**Must include:**

- `OrgModule`.
- `Subscription`.
- Module enable/disable flow.
- Trial plan.
- Starter/pro/enterprise.
- Max users.
- Max modules.
- Storage limits.
- Suspended state.
- Billing integration seam.

**Acceptance criteria:**

- Sidebar and routes obey enabled modules.
- Disabled modules are inaccessible, not merely hidden.

---

## 04-kernel/07-routing-app-shell.md

**Purpose:** Defines shell and route structure.

**Must include:**

- Auth route group.
- Platform route group.
- `/:orgSlug/dashboard`.
- Module routes.
- Settings routes.
- 404 behavior.
- Permission denied behavior.
- Sidebar active state rules.

**Acceptance criteria:**

- Sidebar links do not point to missing routes.
- Active route matching does not use unsafe prefix matching.

---

## 04-kernel/08-kernel-api-contracts.md

**Purpose:** Defines API behavior.

**Must include:**

- Response shape: `{ data, error }`.
- Error codes.
- Validation errors.
- Auth errors.
- Permission errors.
- Not found.
- Conflict.
- Rate-limit future.
- Logging.
- No unhandled throws.

**Acceptance criteria:**

- Every route has predictable client behavior.
- Claude-generated APIs follow one pattern.

---

# 10. SDK Documents

## 05-sdk/00-sdk-overview.md

**Purpose:** Defines why the SDK exists.

**Must include:**

- SDK is the public platform interface.
- Modules never import Kernel internals.
- SDK protects future refactors.
- SDK supports multi-database routing later.
- SDK allows kernel internals to change.

The uploaded plan explicitly says modules import from `@/sdk`, never from `@/kernel/*`. fileciteturn4file1

**Acceptance criteria:**

- Every module dependency goes through SDK.
- Import linting can enforce it.

---

## 05-sdk/01-sdk-public-api.md

**Purpose:** Defines the SDK surface.

**Must include:**

```ts
sdk.auth
sdk.permissions
sdk.events
sdk.getDb
sdk.modules
sdk.organizations
sdk.users
sdk.settings
sdk.forms // future
sdk.tables // future
sdk.search // future
sdk.ai // future
```

**Acceptance criteria:**

- SDK API is documented before expansion.
- Backward compatibility rules are defined.

---

## 05-sdk/02-sdk-db-access.md

**Purpose:** Defines database access through SDK.

**Must include:**

- `sdk.getDb(orgId)`.
- No raw Prisma singleton in modules.
- Tenant-aware query helpers.
- Soft-delete behavior.
- Future database-per-tenant seam.
- Transaction patterns.
- Forbidden query examples.

**Acceptance criteria:**

- Modules never call raw `prisma`.
- Tenant routing can change later without module rewrites.

---

## 05-sdk/03-sdk-auth-permissions.md

**Purpose:** Defines auth and permission helpers.

**Must include:**

- `sdk.auth.getSession`.
- `sdk.auth.requireAuth`.
- `sdk.auth.requireApiAuth`.
- `sdk.permissions.can`.
- `sdk.permissions.require`.
- Permission denial shape.
- Testing helpers.

**Acceptance criteria:**

- API routes do not call redirect-based auth helpers.
- Permission checks are easy enough that generated modules use them.

---

## 05-sdk/04-sdk-events.md

**Purpose:** Defines event API.

**Must include:**

- `sdk.events.emit`.
- `sdk.events.on`.
- `sdk.events.off`.
- Event naming.
- Payload schemas.
- Sync vs async listeners.
- Failure behavior.
- Future queue migration.

The uploaded plan requires event names to follow `{module}.{entity}.{past_tense_verb}`. fileciteturn4file7

**Acceptance criteria:**

- Event names become stable contracts.
- Wrong event naming is treated like broken API behavior.

---

## 05-sdk/05-sdk-compatibility-versioning.md

**Purpose:** Defines SDK versioning.

**Must include:**

- Kernel version.
- Module compatibility.
- Deprecated APIs.
- Breaking change process.
- Migration guide requirements.
- Compatibility tests.

**Acceptance criteria:**

- Marketplace/module ecosystem is possible later.
- Modules can declare compatibility safely.

---

## 05-sdk/06-sdk-testing-contract.md

**Purpose:** Defines how SDK behavior is tested.

**Must include:**

- SDK mock pattern.
- Contract tests.
- Module test utilities.
- Forbidden mocking shortcuts.
- Regression tests.

**Acceptance criteria:**

- Module tests remain stable even if Kernel internals change.

---

# 11. Data Documents

## 06-data/00-database-architecture.md

**Purpose:** Defines the database model.

**Must include:**

- Single PostgreSQL database.
- Shared tables.
- `org_id` on tenant-scoped models.
- Prisma as migration authority.
- No hand-edited DB schema.
- Naming conventions.
- Indexing conventions.
- Foreign key conventions.
- Future partitioning and scaling options.

**Acceptance criteria:**

- Schema growth is controlled.
- Every tenant-scoped table has `orgId`.

---

## 06-data/01-tenancy-data-isolation.md

**Purpose:** Defines tenant isolation.

**Must include:**

- `org_id` rule.
- Org membership rule.
- Query scoping rule.
- No client-supplied `orgId`.
- Service-layer org derivation.
- Test patterns.
- Cross-tenant attack examples.
- RLS future.

**Hard rule:**

Never trust `orgId` from client payloads. Derive it from authenticated user/session + route context.

**Acceptance criteria:**

- Cross-tenant reads and writes are tested.
- Tenant isolation is verified before second tenant onboarding.

---

## 06-data/02-prisma-conventions.md

**Purpose:** Defines Prisma usage.

**Must include:**

- Prisma 7 config.
- Adapter usage.
- Client singleton.
- `prisma generate`.
- Migration workflow.
- Transaction rules.
- Query selection.
- Avoiding N+1 patterns.
- Seed behavior.

**Acceptance criteria:**

- Fresh CI clone can build.
- Database client behavior is consistent.

---

## 06-data/03-soft-delete-archival.md

**Purpose:** Defines deletion behavior.

**Must include:**

- `deletedAt`.
- `deletedBy`.
- Difference between `isActive` and deleted.
- Query extension behavior.
- Known bypass paths.
- Restore behavior.
- Hard delete policy.
- Admin-only deleted record access.

The uploaded plan notes that soft-delete extension coverage is incomplete and can be bypassed by some query types. fileciteturn4file2

**Acceptance criteria:**

- Soft-deleted records do not accidentally surface.
- Known Prisma limitations are handled or forbidden.

---

## 06-data/04-migrations-seeding.md

**Purpose:** Defines DB migration and seed process.

**Must include:**

- Local migration.
- Production migration.
- Supabase migration caution.
- Seed data.
- Demo org.
- Module seed hooks.
- Rollback policy.
- Migration review checklist.

**Acceptance criteria:**

- Live DB migration can be run predictably.
- Seed script is verified against real Postgres.

---

## 06-data/05-data-validation-zod.md

**Purpose:** Defines validation.

**Must include:**

- Zod schema placement.
- Create/update schemas.
- Server-side validation.
- Client-side validation.
- Error formatting.
- Type inference.
- Module schema conventions.

**Acceptance criteria:**

- Every mutation validates input.
- Validation errors follow API contract.

---

## 06-data/06-row-level-security-plan.md

**Purpose:** Defines RLS as future defense-in-depth.

**Must include:**

- Why RLS is deferred.
- When to implement.
- `current_setting('app.org_id')` strategy.
- Prisma compatibility considerations.
- Migration strategy.
- Test strategy.

The uploaded plan describes RLS as Phase 1.5 defense-in-depth, not Phase 1. fileciteturn4file1

**Acceptance criteria:**

- RLS is planned, not forgotten.
- Application-level isolation remains mandatory.

---

## 06-data/07-backup-restore.md

**Purpose:** Defines backup and restore.

**Must include:**

- Supabase backups.
- Manual exports.
- Point-in-time restore.
- Per-tenant restore limitations.
- AppCare responsibilities.
- Restore drills.
- Data retention.

**Acceptance criteria:**

- AppCare has a credible backup story.
- Customer data loss response is documented.

---

# 12. Business Object Documents

## 07-business-objects/00-business-object-philosophy.md

**Purpose:** Defines shared domain entities.

**Must include:**

- Business Objects are shared.
- They belong to no module.
- They are minimal.
- Module-specific fields go in extension tables.
- Three Client Rule for adding shared fields.
- Events required for mutations.

**Acceptance criteria:**

- No module duplicates Employee, Product, Customer, Supplier, or Warehouse.
- No module pollutes core objects with domain-specific fields.

---

## 07-business-objects/01-employee.md

**Purpose:** Defines Employee.

**Must include:**

- Employee vs User.
- Employee without login.
- User-linked employee.
- Employment status.
- Department/branch relationship.
- HR extension pattern.
- Leave module usage.
- Assets module usage.
- Projects module usage.

**Acceptance criteria:**

- Employee can be reused across HR, leave, assets, projects, approvals.

---

## 07-business-objects/02-product.md

**Purpose:** Defines Product.

**Must include:**

- Product identity.
- Code.
- Name.
- Unit.
- Category.
- Inventory extension pattern.
- Purchasing extension pattern.
- Sales/CRM extension pattern.
- SKU vs Product decision.

**Acceptance criteria:**

- Inventory does not own Product.
- Module-specific inventory fields are separate.

---

## 07-business-objects/03-customer.md

**Purpose:** Defines Customer.

**Must include:**

- Customer identity.
- Contact fields.
- CRM extension.
- Reservations extension.
- Billing future.
- Duplicate handling future.

**Acceptance criteria:**

- Customer is reusable beyond CRM.

---

## 07-business-objects/04-supplier.md

**Purpose:** Defines Supplier.

**Must include:**

- Supplier identity.
- Contact fields.
- Purchasing usage.
- Inventory usage.
- Payables future.

**Acceptance criteria:**

- Supplier is reusable across purchasing and inventory.

---

## 07-business-objects/05-warehouse.md

**Purpose:** Defines Warehouse.

**Must include:**

- Warehouse vs Branch.
- Warehouse address.
- Branch relationship.
- Inventory usage.
- Transfers future.
- Multi-location SMEs.

**Acceptance criteria:**

- Warehouse supports inventory without forcing every branch to be a warehouse.

---

## 07-business-objects/06-branch-department.md

**Purpose:** Defines org structure.

**Must include:**

- Organization → Branch → Department assumption.
- Nullable branch department support.
- Department parent/child.
- Employee assignment.
- Philippine SME assumptions.
- Matrix org future.

**Acceptance criteria:**

- Structure works for simple SMEs without overengineering.

---

## 07-business-objects/07-business-object-extension-pattern.md

**Purpose:** Defines module-specific extensions.

**Must include:**

- Extension table pattern.
- Foreign key to Business Object.
- One-to-one extension.
- One-to-many extension.
- Migration strategy when field becomes shared.
- Anti-patterns.

**Example:**

```txt
Product
  id
  orgId
  code
  name
  unit

InventoryProductExtension
  productId
  reorderPoint
  minimumStock
  valuationMethod
```

**Acceptance criteria:**

- Shared objects remain clean.
- Modules can extend without forking.

---

## 07-business-objects/08-business-object-event-contracts.md

**Purpose:** Defines events for shared objects.

**Must include:**

- `kernel.employee.created`
- `kernel.employee.updated`
- `kernel.employee.deactivated`
- `kernel.product.created`
- `kernel.customer.created`
- Payload schemas.
- Required emit points.
- Audit future.

**Acceptance criteria:**

- Audit service can be added later without retrofitting mutations.

---

# 13. Module System Documents

## 08-module-system/00-module-philosophy.md

**Purpose:** Defines what a module is.

**Must include:**

- A module is a package, not a folder.
- It has manifest, routes, permissions, nav, services, APIs, pages, AI context, tests, docs.
- It consumes SDK.
- It cannot import other modules.
- It cannot define duplicate shared entities.
- It should be generated.

**Acceptance criteria:**

- Every module has the same shape.
- Module development is repeatable.

---

## 08-module-system/01-module-manifest.md

**Purpose:** Defines manifest contract.

**Must include:**

- ID.
- Label.
- Version.
- Kernel version.
- Icon.
- Dependencies.
- Permissions.
- Nav items.
- Events emitted/listened.
- Fields metadata future.
- Dashboard widgets future.
- AI context.
- Seed function.

The uploaded plan already has an expanded `ModuleManifest` with permissions, nav, events, fields, dashboard widgets, AI context, docs, and seed function. fileciteturn4file14

**Acceptance criteria:**

- Manifest is stable enough for module loader, navigation, permissions, search, AI, and marketplace later.

---

## 08-module-system/02-module-loader-registry.md

**Purpose:** Defines module registration.

**Must include:**

- In-process registry.
- `registerModule`.
- `getRegistered`.
- `getEnabledForOrg`.
- Startup import strategy.
- Duplicate registration behavior.
- Version mismatch behavior.
- Future remote registry.

**Acceptance criteria:**

- Sidebar and enabled routes are driven by registry + org feature flags.
- Module registration cannot silently fail.

---

## 08-module-system/03-module-folder-contract.md

**Purpose:** Defines module file structure.

**Must include:**

```txt
src/modules/[module]/
  manifest.ts
  schema.ts
  service.ts
  events.ts
  permissions.ts
  ai-context.ts
  docs.md
  __tests__/
```

**Acceptance criteria:**

- Generator and humans use the same structure.
- Claude knows where to place code.

---

## 08-module-system/04-module-permissions.md

**Purpose:** Defines module permission model.

**Must include:**

- Permission constants.
- Manifest-declared permissions.
- API enforcement.
- UI visibility.
- Resource-specific permissions.
- Approval permission future.
- Permission test template.

**Acceptance criteria:**

- Generated modules enforce permissions by default.
- No module route ships with auth-only protection.

---

## 08-module-system/05-module-navigation.md

**Purpose:** Defines module nav.

**Must include:**

- Sidebar nav.
- Section grouping.
- Icons.
- Active matching.
- Disabled module handling.
- Permission-aware nav.
- Empty nav.

**Acceptance criteria:**

- Navigation is consistent.
- Enabled module does not mean visible actions without permission.

---

## 08-module-system/06-module-events.md

**Purpose:** Defines module event contracts.

**Must include:**

- Event naming.
- Event payload schema.
- Events emitted in services, not components.
- Listener registration.
- Failure behavior.
- Future async queue.

**Acceptance criteria:**

- Cross-module workflows can happen without direct imports.

---

## 08-module-system/07-module-dependencies.md

**Purpose:** Defines module dependencies.

**Must include:**

- Manifest dependencies.
- Enable order.
- Missing dependency behavior.
- Circular dependency prohibition.
- Shared object dependency vs module dependency.
- Future marketplace dependency resolution.

**Acceptance criteria:**

- A module cannot be enabled if required dependencies are missing.

---

## 08-module-system/08-module-versioning.md

**Purpose:** Defines module versioning.

**Must include:**

- Semver.
- Kernel compatibility.
- Migration scripts.
- Breaking changes.
- Deprecation policy.
- Client org module version future.

**Acceptance criteria:**

- Modules can evolve safely.

---

## 08-module-system/09-module-testing.md

**Purpose:** Defines tests required for modules.

**Must include:**

- Service tests.
- API tests.
- Permission tests.
- Tenant isolation tests.
- UI smoke tests.
- Event emission tests.
- Generator tests.

**Acceptance criteria:**

- A module cannot be considered production-ready without tenant and permission tests.

---

# 14. CLI and Generator Documents

## 09-cli-generators/00-generator-philosophy.md

**Purpose:** Defines why generators exist.

**Must include:**

- AI-assisted development depends on conventions.
- Generator output must be production-safe.
- Generated code should be boring and correct.
- Customization happens inside defined extension points.
- Generator must not create insecure placeholders.

**Acceptance criteria:**

- Generated modules start from the correct architecture.
- Claude modifies generated code instead of inventing structure.

---

## 09-cli-generators/01-module-generator.md

**Purpose:** Defines `module:create`.

**Must include:**

- CLI input.
- File outputs.
- Manifest output.
- Service skeleton.
- API skeleton.
- Page skeleton.
- Tests.
- Permission checks.
- Tenant org derivation.
- Event emission.
- Import registry update.
- Failure behavior.

**Important correction:**

Generated API routes must not accept `orgId` from query string or payload for tenant-scoped operations. They should derive org from authenticated user/session and route context.

**Acceptance criteria:**

- Running the generator produces secure-by-default code.
- Generated module passes tests before customization.

---

## 09-cli-generators/02-crud-generator.md

**Purpose:** Defines future CRUD generation.

**Status:** Deferred.

**Must include:**

- Required metadata.
- Supported field types.
- Generated list/create/edit/detail pages.
- Generated API routes.
- Permission enforcement.
- Tenant scoping.
- Soft delete.
- Event emission.
- Tests.

**Acceptance criteria:**

- CRUD generation cannot be built until hand-coded module patterns are proven.

---

## 09-cli-generators/03-form-generator.md

**Purpose:** Defines future form generation.

**Status:** Deferred.

**Must include:**

- Field metadata.
- Validation metadata.
- Visibility conditions.
- Permission conditions.
- Relation fields.
- Layout metadata.
- Help text.
- Tooltips.

**Acceptance criteria:**

- Future form generator matches the hand-coded form standards.

---

## 09-cli-generators/04-api-generator.md

**Purpose:** Defines generated API routes.

**Must include:**

- JSON response contract.
- Auth helper.
- Permission helper.
- Validation.
- Tenant derivation.
- Error mapping.
- Test generation.

**Acceptance criteria:**

- Generated APIs are safer than hand-written ones.

---

## 09-cli-generators/05-test-generator.md

**Purpose:** Defines generated tests.

**Must include:**

- Service tests.
- API tests.
- Tenant isolation tests.
- Permission denial tests.
- Event emission tests.
- Validation tests.

**Acceptance criteria:**

- Generator output includes meaningful tests, not tautologies.

---

## 09-cli-generators/06-generator-safety-rails.md

**Purpose:** Prevents unsafe generated code.

**Must include forbidden output patterns:**

```txt
where: { orgId: input.orgId }
request.nextUrl.searchParams.get('orgId')
import { prisma } from '@/kernel/db/client' inside modules
await sdk.auth.requireAuth() inside API route if it redirects
API route without permission check
mutation without event emission
delete without soft-delete behavior
```

**Acceptance criteria:**

- Generated code is lintable for architectural violations.

---

# 15. Platform Services Documents

## 10-platform-services/00-platform-services-philosophy.md

**Purpose:** Defines when something becomes a Platform Service.

**Must include:**

- Three Client Rule.
- Evidence log.
- Promotion criteria.
- Extraction process.
- Backward compatibility.
- Service API pattern.
- Service events.

**Acceptance criteria:**

- Platform Services are not built from imagination.
- Reuse is earned.

---

## 10-platform-services/01-three-client-rule.md

**Purpose:** Formalizes the Three Client Rule.

**Must include:**

- What counts as an independent module/client.
- What counts as the same capability.
- Exceptions.
- Evidence template.
- Promotion process.
- Rejection examples.

**Suggested refinement:**

Use a **Three Independent Use Cases Rule**, not only “three clients.” If three independent modules in the same client need the capability, that may be enough evidence. But it still requires architectural review.

**Acceptance criteria:**

- Overengineering is controlled.
- Useful shared services are not delayed irrationally.

---

## 10-platform-services/02-audit-log-service.md

**Purpose:** Defines future audit logs.

**Status:** Deferred until needed, but event contracts should prepare for it.

**Must include:**

- What gets audited.
- Actor.
- Entity.
- Before/after.
- Org scope.
- Event ingestion.
- Retention.
- UI.

**Acceptance criteria:**

- Can be added using existing mutation events.

---

## 10-platform-services/03-notification-service.md

**Purpose:** Defines notifications.

**Status:** Deferred.

**Must include:**

- In-app notifications.
- Email future.
- SMS future.
- Trigger events.
- User preferences.
- Delivery status.
- Retry behavior.

**Acceptance criteria:**

- Notifications do not get hard-coded inside modules.

---

## 10-platform-services/04-approval-workflow-service.md

**Purpose:** Defines approval engine.

**Status:** Deferred until multiple modules need approvals.

**Must include:**

- Approval request.
- Steps.
- Approvers.
- Conditions.
- Delegation.
- Escalation future.
- Events.
- UI patterns.

**Acceptance criteria:**

- Leave, purchasing, expenses can eventually share one approval engine.

---

## 10-platform-services/05-comments-service.md

**Purpose:** Defines comments.

**Status:** Deferred.

**Must include:**

- Commentable entity pattern.
- Mentions future.
- Permissions.
- Events.
- UI.

**Acceptance criteria:**

- Comments are not recreated differently per module.

---

## 10-platform-services/06-attachments-service.md

**Purpose:** Defines file attachments.

**Status:** Deferred.

**Must include:**

- Supabase Storage.
- Attachment metadata.
- Entity linking.
- Upload permissions.
- File size.
- Virus scanning future.
- Signed URLs.
- Deletion.

**Acceptance criteria:**

- File handling is consistent across modules.

---

## 10-platform-services/07-activity-feed-service.md

**Purpose:** Defines activity timeline.

**Status:** Deferred.

**Must include:**

- Activity event.
- Entity timeline.
- User timeline.
- Org timeline.
- Event normalization.
- UI.

**Acceptance criteria:**

- Activity feed can reuse events and audit logs.

---

## 10-platform-services/08-reporting-service.md

**Purpose:** Defines reporting.

**Must include:**

- Saved reports.
- Report definitions.
- Filters.
- Aggregations.
- Export.
- Permissions.
- Dashboard widgets.
- Future scheduled reports.

**Acceptance criteria:**

- Reporting does not become custom SQL per client.

---

## 10-platform-services/09-search-service.md

**Purpose:** Defines platform search.

**Must include:**

- Searchable entities.
- Module-provided search config.
- Global search.
- Per-module search.
- Permissions-aware results.
- Indexing strategy.
- Future full-text/vector search.

**Acceptance criteria:**

- Search can span modules without direct module coupling.

---

## 10-platform-services/10-background-jobs.md

**Purpose:** Defines background work.

**Must include:**

- When to introduce queue.
- Candidate tools.
- Job payload.
- Retry.
- Idempotency.
- Scheduling.
- Dead-letter handling.
- Vercel constraints.

**Acceptance criteria:**

- Event bus can evolve from in-process to durable queue.

---

# 16. Dynamic Systems Documents

## 11-dynamic-systems/00-dynamic-systems-philosophy.md

**Purpose:** Defines metadata-driven development.

**Must include:**

- Dynamic systems are long-term accelerators.
- They must come from observed repetition.
- Hand-coded patterns come first.
- AI generation should target metadata.
- Avoid building a low-quality no-code platform prematurely.

**Acceptance criteria:**

- Dynamic CRUD/forms are not built before the platform has real examples.

---

## 11-dynamic-systems/01-dynamic-form-engine.md

**Purpose:** Defines future form engine.

**Status:** Deferred.

**Must include:**

- Field definitions.
- Validation.
- Visibility.
- Permissions.
- Layout.
- Relation fields.
- Conditional fields.
- Import/export flags.
- AI form generation.
- Migration from hand-coded forms.

**Acceptance criteria:**

- Form engine has a precise contract before implementation.

---

## 11-dynamic-systems/02-dynamic-crud-engine.md

**Purpose:** Defines future CRUD engine.

**Status:** Deferred.

**Must include:**

- Entity metadata.
- API generation.
- List page.
- Detail page.
- Create/edit forms.
- Permissions.
- Search.
- Sort/filter.
- Soft delete.
- Event emission.

**Acceptance criteria:**

- CRUD engine produces secure module-quality CRUD, not toy scaffolds.

---

## 11-dynamic-systems/03-dynamic-table-view-engine.md

**Purpose:** Defines configurable table views.

**Must include:**

- Columns.
- Filters.
- Sorts.
- Saved views.
- User preferences.
- Org defaults.
- Export.
- Permissions.

**Acceptance criteria:**

- Tables become configurable without becoming inconsistent.

---

## 11-dynamic-systems/04-field-metadata-schema.md

**Purpose:** Defines metadata shared by forms, tables, search, import/export, and AI.

**Must include:**

```ts
type FieldMetadata = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  visible?: VisibilityRule
  editable?: PermissionRule
  importable?: boolean
  exportable?: boolean
  helpText?: string
}
```

**Acceptance criteria:**

- Metadata is reusable across multiple dynamic systems.

---

## 11-dynamic-systems/05-import-export-engine.md

**Purpose:** Defines import/export.

**Status:** Deferred.

**Must include:**

- CSV import.
- Excel future.
- Validation.
- Error reporting.
- Duplicate handling.
- Export permissions.
- Audit events.

**Acceptance criteria:**

- Bulk data workflows are standardized.

---

## 11-dynamic-systems/06-view-builder.md

**Purpose:** Defines saved views.

**Status:** Deferred.

**Must include:**

- Personal views.
- Org views.
- Module views.
- Filters.
- Sorting.
- Columns.
- Permissions.

**Acceptance criteria:**

- Power users can configure views without custom code.

---

# 17. AI Layer Documents

## 12-ai-layer/00-ai-layer-philosophy.md

**Purpose:** Defines OneDayOS AI strategy.

**Must include:**

- AI assists development.
- AI assists users.
- AI never bypasses permissions.
- AI uses module context.
- AI should understand business objects.
- AI responses must be tenant-scoped.
- AI actions require confirmation.

**Acceptance criteria:**

- AI becomes a platform capability, not random chat buttons.

---

## 12-ai-layer/01-ai-context-contract.md

**Purpose:** Defines context format.

**Must include:**

- Org context.
- User context.
- Enabled modules.
- Permissions.
- Business objects.
- Module descriptions.
- Safe data access.
- Redaction.

**Acceptance criteria:**

- AI receives enough context to help without leaking data.

---

## 12-ai-layer/02-module-ai-context.md

**Purpose:** Defines module AI metadata.

**Must include:**

- Module description.
- Supported questions.
- Entity definitions.
- Common workflows.
- Query examples.
- Action examples.
- Forbidden actions.

**Acceptance criteria:**

- Every module can teach the AI what it does.

---

## 12-ai-layer/03-ai-query-patterns.md

**Purpose:** Defines AI-powered querying.

**Must include:**

- Natural language to filters.
- Natural language to reports.
- Permission-aware query execution.
- Safe SQL restrictions.
- Explainable results.

**Acceptance criteria:**

- AI cannot run arbitrary unsafe queries.

---

## 12-ai-layer/04-ai-assisted-crud-generation.md

**Purpose:** Defines AI generation of CRUD from metadata.

**Status:** Deferred.

**Must include:**

- Required metadata.
- Prompt templates.
- Verification tests.
- Security checks.
- Human approval.

**Acceptance criteria:**

- AI-generated CRUD follows the platform manual.

---

## 12-ai-layer/05-ai-support-agent.md

**Purpose:** Defines user-facing support AI.

**Must include:**

- AppCare support.
- Help center context.
- Module docs.
- Ticket escalation.
- Safe troubleshooting.
- No unauthorized data access.

**Acceptance criteria:**

- AI support reduces support burden without creating security risk.

---

## 12-ai-layer/06-ai-safety-boundaries.md

**Purpose:** Defines AI safety.

**Must include:**

- Permission boundaries.
- Tenant boundaries.
- Destructive action confirmation.
- Audit trail.
- Prompt injection defenses.
- Data minimization.

**Acceptance criteria:**

- AI cannot become a backdoor around the app.

---

# 18. Security Documents

## 13-security/00-security-model.md

**Purpose:** Defines total security posture.

**Must include:**

- Auth.
- Tenant isolation.
- Authorization.
- API security.
- Data security.
- Secrets.
- Audit future.
- Backups.
- Production readiness.

**Acceptance criteria:**

- Security is not scattered across documents.

---

## 13-security/01-auth-security.md

**Purpose:** Defines auth-specific security.

**Must include:**

- Supabase session validation.
- Email confirmation policy.
- Password policy.
- Service role protection.
- Cookie behavior.
- CSRF considerations.
- Logout behavior.

**Acceptance criteria:**

- Auth flows are safe for production.

---

## 13-security/02-tenant-isolation.md

**Purpose:** Defines tenant isolation in depth.

**Must include:**

- Route-level org validation.
- API-level org validation.
- Query-level org validation.
- Permission-level org validation.
- No client-supplied org IDs.
- Cross-tenant test matrix.
- Future RLS.

**Acceptance criteria:**

- Second tenant onboarding is blocked until this passes.

---

## 13-security/03-permission-enforcement.md

**Purpose:** Defines permission enforcement.

**Must include:**

- Required API checks.
- Required service checks.
- UI visibility.
- Wildcard permissions.
- Resource-level permissions.
- Test matrix.

**Acceptance criteria:**

- Every mutation route denies unauthorized users.

---

## 13-security/04-api-security.md

**Purpose:** Defines API safety.

**Must include:**

- `requireApiAuth`.
- JSON 401.
- JSON 403.
- Zod validation.
- Error mapping.
- No stack traces.
- Rate limiting future.
- Request logging.

**Acceptance criteria:**

- API behavior is machine-consumable and secure.

---

## 13-security/05-data-security.md

**Purpose:** Defines data handling.

**Must include:**

- Sensitive fields.
- PII.
- Data retention.
- Exports.
- Backups.
- Logs.
- Deletion policy.

**Acceptance criteria:**

- Customer data is protected by default.

---

## 13-security/06-secrets-management.md

**Purpose:** Defines secrets.

**Must include:**

- `.env.local`.
- `.env.example`.
- Vercel env vars.
- Supabase service role.
- Rotation.
- No secrets in commits.
- Claude restrictions.

**Acceptance criteria:**

- Secrets are never leaked into code or docs.

---

## 13-security/07-security-testing.md

**Purpose:** Defines security tests.

**Must include:**

- Auth tests.
- Permission denial tests.
- Cross-tenant read/write tests.
- API response tests.
- Regression tests for known holes.
- Generated module security tests.

**Acceptance criteria:**

- Known security issues cannot reappear silently.

---

## 13-security/08-production-readiness-gate.md

**Purpose:** Defines production blockers.

**Immediate blockers:**

- Live migration and seed not verified.
- Org membership check incomplete.
- Permission enforcement incomplete.
- API auth helper missing.
- Some soft-delete bypass paths unresolved.
- Generated module security contract incomplete.

**Acceptance criteria:**

Before onboarding a second tenant:

```txt
[ ] Live Postgres migration verified
[ ] Seed verified
[ ] User cannot access another org route
[ ] User cannot read another org API data
[ ] User cannot mutate another org data
[ ] Permission denial returns 403 JSON
[ ] Unauthenticated API returns 401 JSON
[ ] Generated module includes tenant isolation tests
[ ] Generated module includes permission tests
```

---

# 19. Testing and Quality Documents

## 14-testing-quality/00-testing-philosophy.md

**Purpose:** Defines quality culture.

**Must include:**

- Tests protect architecture.
- Tests must not be tautological.
- Security tests are first-class.
- Generated code includes tests.
- Manual acceptance criteria become tests.

**Acceptance criteria:**

- Test suite proves real behavior, not just imports.

---

## 14-testing-quality/01-unit-testing.md

**Purpose:** Defines unit tests.

**Must include:**

- Where tests live.
- Naming.
- Mocking.
- What to unit test.
- What not to over-mock.
- Utility functions.

**Acceptance criteria:**

- Unit tests are meaningful and fast.

---

## 14-testing-quality/02-integration-testing.md

**Purpose:** Defines integration tests.

**Must include:**

- DB integration tests.
- Supabase mock/test strategy.
- Prisma test database.
- Seed fixtures.
- Tenant isolation integration tests.

**Acceptance criteria:**

- Core platform behavior is tested against realistic data.

---

## 14-testing-quality/03-api-testing.md

**Purpose:** Defines API tests.

**Must include:**

- Authenticated requests.
- Unauthenticated requests.
- Forbidden requests.
- Validation errors.
- Tenant boundary tests.
- Response shape.

**Acceptance criteria:**

- Every API route follows contract.

---

## 14-testing-quality/04-ui-testing.md

**Purpose:** Defines UI tests.

**Must include:**

- Component rendering.
- Forms.
- Tables.
- Empty states.
- Loading states.
- Permission visibility.
- Accessibility smoke tests.

**Acceptance criteria:**

- UI behavior does not regress silently.

---

## 14-testing-quality/05-security-testing.md

**Purpose:** Defines security regression tests.

**Must include:**

- IDOR tests.
- Cross-tenant tests.
- Permission tests.
- API auth tests.
- Module generator security tests.

**Acceptance criteria:**

- Known vulnerabilities become permanent tests.

---

## 14-testing-quality/06-regression-testing.md

**Purpose:** Defines regression policy.

**Must include:**

- Every bug fix gets a test.
- Every security fix gets a test.
- Every generator bug gets generator test.
- Release checklist.

**Acceptance criteria:**

- Fixed bugs stay fixed.

---

## 14-testing-quality/07-test-data-fixtures.md

**Purpose:** Defines test data.

**Must include:**

- Demo org.
- Second org.
- Admin user.
- Staff user.
- Unauthorized user.
- Sample business objects.
- Sample module records.

**Acceptance criteria:**

- Tenant and permission tests are easy to write.

---

## 14-testing-quality/08-ci-quality-gates.md

**Purpose:** Defines CI checks.

**Must include:**

- Typecheck.
- Lint.
- Tests.
- Build.
- Prisma generate.
- Forbidden import check.
- Security test subset.

**Acceptance criteria:**

- CI blocks architectural violations.

---

# 20. Deployment and Operations Documents

## 15-deployment-operations/00-environments.md

**Purpose:** Defines environments.

**Must include:**

- Local.
- Preview.
- Staging.
- Production.
- Environment variable rules.
- Supabase project strategy.
- Demo org strategy.

**Acceptance criteria:**

- Deployments are predictable.

---

## 15-deployment-operations/01-vercel-deployment.md

**Purpose:** Defines Vercel deployment.

**Must include:**

- Build command.
- Environment variables.
- Prisma generate.
- Preview deployments.
- Production deployment.
- Rollback.
- Domain setup.

**Acceptance criteria:**

- Fresh deployment does not fail due to missing Prisma generation.

---

## 15-deployment-operations/02-supabase-operations.md

**Purpose:** Defines Supabase operations.

**Must include:**

- Auth.
- Database.
- Storage future.
- Backups.
- Connection strings.
- Pooling.
- Service role.
- Dashboard operations.

**Acceptance criteria:**

- Supabase is operated consistently.

---

## 15-deployment-operations/03-database-migrations-production.md

**Purpose:** Defines production migration process.

**Must include:**

- Migration review.
- Backup before migration.
- Apply migration.
- Verify.
- Rollback strategy.
- Zero-downtime future.

**Acceptance criteria:**

- Database changes do not become risky one-off events.

---

## 15-deployment-operations/04-monitoring-observability.md

**Purpose:** Defines monitoring.

**Must include:**

- Error tracking.
- Logs.
- Uptime.
- Database health.
- Slow queries.
- AppCare dashboard future.
- Alert thresholds.

**Acceptance criteria:**

- AppCare can be delivered credibly.

---

## 15-deployment-operations/05-error-handling.md

**Purpose:** Defines error behavior.

**Must include:**

- API errors.
- UI errors.
- Server errors.
- Validation errors.
- Logging.
- User-safe messages.
- Developer diagnostics.

**Acceptance criteria:**

- Users see useful errors.
- Developers get enough debugging context.

---

## 15-deployment-operations/06-appcare-operations.md

**Purpose:** Defines recurring maintenance.

**Must include:**

- Hosting.
- Monitoring.
- Security updates.
- Backups.
- Bug fixes.
- AI support.
- Monthly checks.
- Support SLA future.

**Acceptance criteria:**

- ₱3,500/month AppCare has a concrete operational checklist.

---

## 15-deployment-operations/07-incident-response.md

**Purpose:** Defines incident handling.

**Must include:**

- Severity levels.
- Response steps.
- Communication.
- Rollback.
- Data loss response.
- Security incident response.
- Postmortems.

**Acceptance criteria:**

- Incidents are handled consistently.

---

## 15-deployment-operations/08-cost-management.md

**Purpose:** Defines cost discipline.

**Must include:**

- Vercel costs.
- Supabase costs.
- Storage costs.
- AI costs.
- Per-client margin.
- Cost alerts.
- Scaling thresholds.

**Acceptance criteria:**

- Platform growth does not destroy margins.

---

# 21. Client Delivery Documents

## 16-client-delivery/00-one-day-delivery-playbook.md

**Purpose:** Defines how OneDayOS delivers in one business day.

**Must include:**

- Discovery.
- Scope control.
- Module selection.
- Configuration.
- Data import.
- Testing.
- Training.
- Handover.
- AppCare activation.

**Acceptance criteria:**

- Delivery is repeatable.
- “One day” does not mean custom hacking.

---

## 16-client-delivery/01-client-discovery.md

**Purpose:** Defines discovery process.

**Must include:**

- Questions to ask.
- Module fit.
- Red flags.
- Scope boundaries.
- Data requirements.
- User roles.
- Approval flows.
- Reports needed.

**Acceptance criteria:**

- Discovery produces implementation-ready configuration.

---

## 16-client-delivery/02-scope-control.md

**Purpose:** Prevents bespoke drift.

**Must include:**

- What fits one-day delivery.
- What requires paid custom work.
- What should become module improvement.
- What should be rejected.
- Change request process.

**Acceptance criteria:**

- Sales promises do not break architecture.

---

## 16-client-delivery/03-client-configuration.md

**Purpose:** Defines client setup.

**Must include:**

- Org creation.
- Users.
- Roles.
- Branches.
- Departments.
- Enabled modules.
- Settings.
- Branding.
- Seed data.

**Acceptance criteria:**

- Client onboarding is configuration-driven.

---

## 16-client-delivery/04-user-training.md

**Purpose:** Defines training.

**Must include:**

- Admin training.
- Staff training.
- Module walkthrough.
- Common workflows.
- Support escalation.
- AI support usage.

**Acceptance criteria:**

- Clients can use the system after handover.

---

## 16-client-delivery/05-handover.md

**Purpose:** Defines client handover.

**Must include:**

- Login details.
- Enabled modules.
- Known limitations.
- Support channel.
- AppCare coverage.
- Data backup explanation.

**Acceptance criteria:**

- Client understands what was delivered and what is supported.

---

## 16-client-delivery/06-support-maintenance.md

**Purpose:** Defines ongoing support.

**Must include:**

- Bug definition.
- Enhancement definition.
- Response process.
- Monthly maintenance.
- Security updates.
- Backup checks.

**Acceptance criteria:**

- Support stays profitable and standardized.

---

# 22. Module Specification Documents

## 17-module-specifications/00-module-spec-template.md

**Purpose:** Defines the template for every module spec.

**Required sections:**

```md
# [Module Name] Module Specification

Status:
Version:
Depends On:
Authoritative Architecture Docs:

## Purpose
## Non-Goals
## Business Workflows
## Business Objects Used
## Module-Owned Entities
## Permissions
## Routes
## API
## Services
## Events Emitted
## Events Listened To
## UI Screens
## Forms
## Tables
## Reports
## Settings
## AI Context
## Tests
## Seed Data
## Implementation Plan
## Acceptance Criteria
```

**Acceptance criteria:**

- Every module spec is implementation-grade.
- Claude can implement one module without inventing structure.

---

## 17-module-specifications/01-inventory-module.md

**Purpose:** Defines first official module.

**Must include:**

- Inventory purpose.
- Product usage.
- Warehouse usage.
- Module-owned entities:
  - Stock balance.
  - Stock movement.
  - Inventory adjustment.
  - Reorder rule.
- Events:
  - `inventory.stock_movement.created`
  - `inventory.stock_adjustment.created`
  - `inventory.stock_level.low`
- Permissions:
  - `inventory.read`
  - `inventory.create`
  - `inventory.update`
  - `inventory.delete`
  - `inventory.adjust`
- Screens:
  - Inventory dashboard.
  - Products.
  - Stock levels.
  - Adjustments.
  - Warehouses.
- Tests:
  - Tenant isolation.
  - Permission denial.
  - Stock movement correctness.
  - Event emission.

**Important rule:**

Inventory does not own `Product`. It extends `Product`.

**Acceptance criteria:**

- Inventory proves Business Objects, SDK, module system, permissions, design system, and event bus all work together.

---

# 23. Implementation Gates

## Gate 1 — Manual Foundation Gate

Before code resumes:

```txt
[ ] 00-roadmap frozen
[ ] manual-governance frozen
[ ] vision frozen
[ ] system-architecture frozen
[ ] layer-boundaries frozen
[ ] dependency-rules frozen
[ ] production-readiness-gate frozen
```

---

## Gate 2 — Tenant Safety Gate

Before second tenant:

```txt
[ ] org membership check implemented
[ ] route-level tenant guard implemented
[ ] API tenant guard implemented
[ ] client-supplied orgId rejected
[ ] permissions enforced in APIs
[ ] permissions enforced in services
[ ] requireApiAuth returns 401 JSON
[ ] forbidden cross-tenant reads tested
[ ] forbidden cross-tenant writes tested
```

---

## Gate 3 — Design System Gate

Before official Inventory UI:

```txt
[ ] design vision frozen
[ ] brand system frozen
[ ] layout system frozen
[ ] table standards frozen
[ ] form standards frozen
[ ] loading/empty/error states frozen
[ ] interaction standards frozen
```

---

## Gate 4 — SDK and Module Gate

Before new module implementation:

```txt
[ ] SDK public API frozen
[ ] SDK DB access frozen
[ ] module manifest frozen
[ ] module folder contract frozen
[ ] module permission contract frozen
[ ] module generator safety rails frozen
```

---

## Gate 5 — Inventory Gate

Before Inventory starts:

```txt
[ ] Business Object philosophy frozen
[ ] Product spec frozen
[ ] Warehouse spec frozen
[ ] Business Object extension pattern frozen
[ ] Inventory module spec frozen
[ ] Inventory acceptance tests written
```

---

# 24. Architectural Challenges I Would Make Now

## 1. Do not call the current Kernel production-safe yet

The kernel is a promising MVP foundation, but it is not safe for multi-tenant production until tenant membership, permission enforcement, and API auth behavior are fixed. The uploaded plan itself identifies these as open issues. fileciteturn4file2

## 2. Business Objects should be conceptually outside Kernel

For MVP, they may physically live in the same Prisma schema. Architecturally, they should not be treated as Kernel internals. Modules should consume them through SDK/service contracts.

## 3. The Three Client Rule needs an evidence log

Otherwise, “three clients need it” becomes subjective. Create a small document/table where every repeated capability is logged before promotion.

## 4. The module generator must be hardened before it becomes trusted

A generator that creates insecure routes will scale bad architecture faster. The generator should be treated as a product surface, not just a convenience script.

## 5. Dynamic CRUD should be designed early but implemented late

Metadata contracts can be documented now. The engine itself should wait until enough hand-coded forms/tables exist to avoid building the wrong abstraction.

## 6. Design system is not decoration

The first app felt generic because UI was treated as scaffolding. The design system must be frozen before Inventory; otherwise, the first real module will teach Claude the wrong style.

---

# 25. The Next Three Documents to Write

I recommend writing these next, in this exact order:

```txt
1. docs/engineering-manual/00-meta/00-roadmap.md
2. docs/engineering-manual/01-foundation/00-vision.md
3. docs/engineering-manual/02-architecture/00-system-architecture.md
```

After those are reviewed and frozen, write:

```txt
4. docs/engineering-manual/02-architecture/01-layer-boundaries.md
5. docs/engineering-manual/13-security/08-production-readiness-gate.md
6. docs/engineering-manual/04-kernel/04-authorization-enforcement.md
```

That sequence gives us doctrine, architecture, and safety before more code.
