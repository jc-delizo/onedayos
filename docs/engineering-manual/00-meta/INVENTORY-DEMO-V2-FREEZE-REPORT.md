# Inventory Demo V2 Freeze Report

Status: Frozen
Date: 2026-07
Implementation Allowed: One package at a time; only V2-1 is authorized next

## Documents Inspected

- ADR-0014 through ADR-0020.
- `03-design-system/15-compact-operational-page-header.md` through `18-curated-accent-presets.md`.
- `02-architecture/07-tenant-safe-caching-strategy.md`.
- `08-module-system/10-contextual-shared-records.md`.
- `14-testing-quality/10-data-table-modal-export-testing.md`.
- `17-module-specifications/09-inventory-v2-module.md`.
- `INVENTORY-DEMO-V2-CHANGE-IMPACT-REPORT.md`.
- `INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`.
- Canonical `00-roadmap.md` and `02-architecture-decision-records.md`.

## Conflicts Found and Resolved

No ambiguous conflict blocked the freeze. The following stale or superseded language was reconciled:

- “Records are not apps” was amended by accepted ADR-0015. Shared Records is now a permission-aware built-in app, not an `OrgModule`.
- Light/Dark/System-only scope was amended by accepted ADR-0019 for curated browser-local accents in V2-8; runtime appearance modes remain intact.
- Adjustment-only Inventory MVP was extended by accepted ADR-0020 for V2-6 unified transactions.
- The broad Import/Export Engine remains deferred; accepted ADR-0017 narrowly permits bounded table export in V2-5.
- Product Settings moves out of top-level Inventory navigation in V2-1 without losing contextual access. URL-addressable modal treatment remains in V2-3.
- Customer-on-issue wording was resolved as optional.
- “Preferred/likely/if approved” dependency language was replaced with the Founder’s accepted or conditional decisions.
- Context preservation was sequenced: V2-1 uses contextual routes/full-page fallbacks; V2-3 may add modal surfaces.

## ADR Status and Timing

| ADR | Status | Timing |
| --- | --- | --- |
| ADR-0014 Compact Operational Page Header | Accepted | V2-1 |
| ADR-0015 Shared Records Built-In App and Context Preservation | Accepted | V2-1 |
| ADR-0016 Data Table V2 and Modal Interactions | Accepted | V2-2 and V2-3 |
| ADR-0017 Bounded Table Export | Accepted | V2-5 |
| ADR-0018 Tenant-Safe Caching Strategy | Accepted | V2-7 after stabilization |
| ADR-0019 Curated Accent Presets | Accepted | V2-8 |
| ADR-0020 Inventory V2 Operational Workflows | Accepted | V2-6 |

## Detailed Spec Status and Timing

| Specification | Status | Timing |
| --- | --- | --- |
| Compact Operational Page Header | Frozen | V2-1 |
| Data Table V2 | Frozen | V2-2 |
| Modal Interaction Standard | Frozen | V2-3 |
| Curated Accent Presets | Frozen | V2-8 |
| Tenant-Safe Caching Strategy | Frozen | V2-7 only |
| Contextual Shared Records | Frozen | V2-1 |
| Data Table, Modal, and Export Testing | Frozen | Authority for V2-2 through V2-5 |
| Inventory V2 Module Specification | Frozen | V2-6 |

## Dependencies

- Stable `@tanstack/react-table` v8: approved for V2-2.
- Selective Radix Dialog: approved for V2-3; no broad Radix/shadcn migration.
- Recharts v3: approved for V2-4 through a small wrapper, with real data only.
- `exceljs@4.4.0`: conditionally approved for V2-5, server-side only, subject to an implementation-time compatibility, maintenance, security, advisory, and bundle audit.

No dependency installation is authorized by this freeze.

## Risks Preserved

- Table and modal query state must not accept tenant identity from clients.
- Modal routing must preserve direct URLs, refresh, Back/Forward, focus trap/return, and full-page fallbacks.
- Export must prove permission separation, tenant isolation, safe columns, row limits, safe filenames, and CSV injection handling.
- Unified transactions require a reviewed migration/backfill and rollback plan, immutable posting, type-specific validation, no negative stock, paired transfers, and safe reversal.
- Caching requires complete organization and permission scope, explicit invalidation, read-your-own-write behavior, and measured value.
- Accent presets require light/dark contrast validation and must not alter semantic colors.

## V2-1 Readiness

The V2-1 implementation package is complete as a governance handoff. It has authoritative documents, allowed/forbidden scope, exit criteria, rollback boundaries, and verification commands. V2-1 is ready for explicit Founder approval, but it was not implemented during this freeze. V2-2 through V2-8 remain blocked.
