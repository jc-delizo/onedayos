# OneDayOS — V2-6 Founder Decision, Freeze, and Staged Implementation Handoff

V2-6A schema, migration, and transaction-semantics review is complete.

The Founder has reviewed the V2-6A recommendations and explicitly approves the V2-6 direction subject to the decisions and amendments below.

This task is documentation governance only.

Do not implement application code.

Do not modify Prisma schema.

Do not create a migration.

Do not run Prisma commands.

Do not mutate sandbox data.

Do not modify permissions, APIs, UI, services, events, package files, dependencies, caching, accents, or website assets.

Do not commit or tag.

## Repository Baseline

Expected baseline:

```text
HEAD: 6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b
Tag: inventory-demo-v2-v2.5-checkpoint
Branch: main
```

The authorized untracked Prompt 46 file may still exist and must remain untouched, unstaged, and uncommitted.

Any additional unexpected source/config changes require stopping for Founder review.

## Primary Authority

Read and reconcile:

- `docs/engineering-manual/00-meta/V2-6-SCHEMA-MIGRATION-REVIEW.md`
- `docs/engineering-manual/00-meta/V2-6-TRANSACTION-SEMANTICS.md`
- `docs/engineering-manual/00-meta/V2-6-MIGRATION-BACKFILL-PLAN.md`
- `docs/engineering-manual/00-meta/V2-6-TEST-MATRIX.md`
- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6-INVENTORY-CORE-TRANSACTIONS.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- `docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/17-module-specifications/09-inventory-v2-module.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0020-inventory-v2-operational-workflows.md`

Also obey all architecture, data, security, testing, and migration authorities referenced by Prompt 46.

If any Founder decision below cannot be reconciled safely with the existing documents, stop and report the exact conflict.

# Founder Decisions

## 1. Unified Model

Approved:

```text
InventoryTransaction
InventoryTransactionLine
```

Transaction types remain:

```text
RECEIPT
ISSUE
TRANSFER
ADJUSTMENT
```

Do not add a generic Party model.

Do not add separate receipt/issue/transfer model families.

## 2. Lifecycle Terminology

Approve a posted-only lifecycle, but use:

```text
InventoryTransactionStatus:
POSTED
REVERSED
```

Do not use `VOIDED` for a transaction whose stock effects were already posted and then counteracted.

Rationale:

```text
Void implies cancellation/erasure.
OneDayOS preserves the original posting and creates compensating stock history.
The accurate state is REVERSED.
```

No Draft or Approval status.

No editing or hard deletion after posting.

## 3. Reversal Model

Approved:

- reversal creates a separate POSTED transaction
- reversal transaction references the original through `reversalOfTransactionId`
- original transitions `POSTED → REVERSED`
- original movements remain immutable
- reversing movements are newly appended
- one original transaction may be reversed at most once
- a reversal transaction may not itself be reversed
- if a reversal was entered incorrectly, post a new normal corrective transaction
- reversal requires a reason
- reverse operation is atomic
- reversal is rejected when it would create invalid negative stock

The reversal transaction keeps the original business type for validation and reporting, but is identified by the non-null reversal relation.

Use a `REV` transaction-number prefix for reversal transactions.

Do not add a fifth `REVERSAL` transaction type.

Remove or rename proposed `voided*` terminology in the reviewed design.

Prefer deriving reversal date/actor from the posted reversal transaction rather than storing unnecessary duplicate `voidedAt/voidedBy` fields on the original.

If a small denormalized `reversedAt` field is retained for an approved query-performance reason, document its atomic consistency rule. Do not retain `voided*` naming.

## 4. Warehouse Field Design

Approved:

### Receipt

```text
warehouseId required
sourceWarehouseId absent
destinationWarehouseId absent
```

`warehouseId` means destination Warehouse for a Receipt.

### Issue

```text
warehouseId required
sourceWarehouseId absent
destinationWarehouseId absent
```

`warehouseId` means source Warehouse for an Issue.

### Adjustment

```text
warehouseId required
sourceWarehouseId absent
destinationWarehouseId absent
```

`warehouseId` is the counted Warehouse.

### Transfer

```text
warehouseId absent
sourceWarehouseId required
destinationWarehouseId required
sourceWarehouseId != destinationWarehouseId
```

Supplier/Customer/Warehouse invariants must be enforced in strict Zod/service logic and, where safely supported, migration-level CHECK constraints.

## 5. Unit Snapshot

Approved.

Each `InventoryTransactionLine` snapshots the Product unit at posting time.

Requirements:

- Product remains the shared identity
- `productId` remains the foreign key
- `unit` is a required historical snapshot
- later Product-unit edits do not reinterpret posted quantities
- no duplicate Product name/code snapshot is required for MVP
- exports/details may use current Product identity plus the snapshotted unit

## 6. Line Quantity Semantics

Approved type-specific semantics:

- Receipt: positive quantity received
- Issue: positive quantity issued
- Transfer: positive quantity transferred
- Adjustment: counted final quantity, zero allowed

For Adjustment:

- client supplies counted final quantity
- server reads previous balance
- server computes signed delta
- client never supplies previous quantity, after quantity, or balance after

Use clear type-specific API fields even if the unified database column remains named `quantity`.

Document that `quantity` on an Adjustment line stores the counted final quantity, not the delta.

## 7. Movement Linkage

Approve explicit nullable links from `StockMovement` to the new transaction and line while preserving legacy source fields during transition.

Preferred integrity design:

```text
inventoryTransactionId?
inventoryTransactionLineId?
```

The relation must guarantee that the referenced line belongs to the same transaction and organization.

Use a composite unique/relation strategy if required to enforce:

```text
movement.orgId
movement.inventoryTransactionId
movement.inventoryTransactionLineId
→ same organization and same transaction line
```

Preserve current `sourceType` / `sourceId` only as compatibility fields until a later approved cleanup migration.

New V2-6 writes must populate the canonical transaction linkage.

Backfilled legacy movements must be linked exactly once.

## 8. Movement-Type Vocabulary

Keep the existing movement-type storage approach for the compatibility migration unless the reviewed schema proves a safe enum conversion.

New approved values:

```text
receipt_in
issue_out
transfer_out
transfer_in
adjustment_in
adjustment_out
reversal_in
reversal_out
```

Preserve legacy:

```text
opening_balance
```

Do not represent a reversed Receipt as `receipt_in` with a negative quantity.

Use explicit reversal direction types.

Movement quantities remain signed according to the current ledger contract.

Document exact dashboard mapping:

- receipt_in → inbound
- issue_out → outbound
- adjustment_in → inbound
- adjustment_out → outbound
- reversal_in/out → actual direction
- transfer_in/out excluded from organization-wide net inbound/outbound totals
- opening_balance remains a separately documented legacy/demo input

## 9. Idempotency

Approved and required for create/post and reverse commands.

Use:

```text
Idempotency-Key request header
```

Persistence design:

```text
idempotencyKeyHash?
requestHash?
```

They may be nullable only to support legacy backfill.

For every new API-created transaction:

- key is required
- server hashes the key
- server hashes the normalized request
- unique organization-scoped key
- same key + same request returns the original successful result
- same key + different request returns a stable conflict error
- no raw idempotency key is stored
- no client orgId
- retries do not double-post stock

Define stable errors such as:

```text
IDEMPOTENCY_KEY_REQUIRED
IDEMPOTENCY_KEY_REUSED
```

Use the existing API envelope.

## 10. Concurrency Control

Approved:

```text
Serializable database transaction
+ bounded retry for serialization/write-conflict failures
```

Use Prisma’s supported transaction-isolation contract under Prisma 7.

Requirements:

- bounded retry count
- retry only known serialization/write-conflict failures
- no retry on validation/permission/domain errors
- no partial posting
- no negative-stock race
- no transfer quantity loss
- tests with concurrent Issue/Transfer attempts

If Prisma/PostgreSQL behavior cannot safely provide this, stop during implementation rather than weakening the guarantee.

## 11. Transaction Number

Approved server-generated non-sequential reference.

Format:

```text
REC-{UTC_YEAR}-{16 uppercase hex}
ISS-{UTC_YEAR}-{16 uppercase hex}
TRF-{UTC_YEAR}-{16 uppercase hex}
ADJ-{UTC_YEAR}-{16 uppercase hex}
REV-{UTC_YEAR}-{16 uppercase hex}
```

Rules:

- generated server-side with cryptographically strong randomness
- no client generation
- organization-scoped unique constraint
- retry on the extremely unlikely unique collision
- maximum three generation attempts
- year is based on server posting time in UTC
- no counter/sequence model in MVP
- transaction number is display/reference data, not authorization

## 12. Reference Date

Approved:

- `referenceDate` is optional
- represents an external document/business reference date
- stored as a date-only value where supported
- may be in the past
- may not be later than current UTC calendar date plus one day
- the one-day allowance avoids local-time/UTC rollover rejection
- `postedAt` remains server-owned and determines actual posting time
- reference date does not backdate StockMovement creation or bypass immutable posting history

No arbitrary future dating.

## 13. Event Delivery

Approve current best-effort post-commit events for V2-6 MVP only.

Requirements:

- events emitted after successful database commit
- no event emitted on failed transaction
- event failure is logged safely with request/transaction context
- event failure does not roll back an already committed stock transaction
- no durable-delivery claim
- no external integration may depend on these events for guaranteed processing

Before any real external consumer, notification, accounting integration, or cross-system workflow is enabled:

```text
a separate Durable Outbox ADR/package is mandatory
```

Do not implement an Outbox in V2-6.

## 14. StockAdjustment Compatibility

Approved strategy:

```text
Keep StockAdjustment temporarily as a read-only compatibility source/projection.
```

V2-6 migration sequence:

- add new canonical models/links
- backfill valid legacy adjustments
- link existing movements
- keep legacy routes working
- switch new writes to unified transactions only after cutover gates
- switch reads/exports through canonical projections
- do not remove StockAdjustment in V2-6
- remove legacy model/fields only in a later approved cleanup migration

Invalid or ambiguous legacy records stop the backfill.

No silent repair.

## 15. API Structure

Approved:

```text
GET/POST /api/orgs/[orgSlug]/inventory/transactions/receipts
GET/POST /api/orgs/[orgSlug]/inventory/transactions/issues
GET/POST /api/orgs/[orgSlug]/inventory/transactions/transfers
GET/POST /api/orgs/[orgSlug]/inventory/transactions/adjustments

GET /api/orgs/[orgSlug]/inventory/transactions/[id]
POST /api/orgs/[orgSlug]/inventory/transactions/[id]/reverse
```

Use type-specific create schemas/routes with one unified service/model.

List routes may share internal query infrastructure.

Requirements:

- strict Zod
- no orgId
- verified PlatformContext
- module and permissions
- safe 401/403/404
- idempotency
- atomic posting
- JSON envelopes
- no raw errors

## 16. Warehouse Operator Demo Permissions

Approved least-privilege V2-6 expansion:

```text
inventory.receipt.read
inventory.receipt.create

inventory.issue.read
inventory.issue.create

inventory.transfer.read
inventory.transfer.create

inventory.adjustment.read
inventory.adjustment.create
```

Also grant:

```text
objects.customer.read
```

because Customer is an optional Issue reference.

Do not grant:

```text
*.reverse
inventory.transaction.export
inventory.product_setting.update
wildcard/admin permission
Organization admin permission
shared-record create/update/delete
```

Preserve current shared Product/Category/Supplier/Warehouse read permissions.

Org Admin wildcard remains unchanged.

Existing `inventory.stock_adjustment.read/create` grants receive an idempotent compatibility migration, but reverse/export are not granted automatically.

## 17. Reversal Permissions

Approve explicit permissions:

```text
inventory.receipt.reverse
inventory.issue.reverse
inventory.transfer.reverse
inventory.adjustment.reverse
```

Org Admin wildcard satisfies them.

Warehouse Operator does not receive them.

No generic reverse permission should silently cover every type unless the existing permission model requires it and the docs explicitly map it.

## 18. Transaction Export

Approve:

```text
inventory.transaction.export
```

Do not grant it automatically to Warehouse Operator.

V2-5 legacy adjustment export remains compatible during migration.

V2-6 implementation must update the export matrix only when the canonical transaction reads are stable.

## 19. Demo V2 Data

Approved canonical additions:

- Secondary Warehouse
- Demo Customer
- at least one Receipt from Demo Supplier
- at least one Issue with optional Demo Customer reference
- at least one Transfer between Main and Secondary Warehouses
- at least one Adjustment

Final expected balances:

```text
Product     Main   Secondary   Organization total
Water       120    10          130
Tea         35     5           40
Coffee      5      3           8
```

Coffee remains low against reorder point 10.

Every movement/transaction chain must reconcile exactly.

Demo reset remains guarded and organization-scoped.

## 20. Dashboard Semantics after V2-6

Approved:

- Receipt → inbound
- Issue → outbound
- Adjustment → signed delta
- Reversal → actual inverse direction
- Transfer → excluded from organization-wide inbound/outbound totals
- Warehouse-level details may show transfer movement separately
- no double-counting

## 21. Process Flow after V2-6

Receipts, Issues, and Transfers may move from Planned to Current only after:

- schema migration passes
- sandbox backfill passes
- posting services pass
- APIs pass
- UI passes
- controlled demo passes
- Founder accepts V2-6

Do not update them to Current during schema-only work.

# Staged V2-6 Implementation

V2-6 is too large for one uncontrolled change set.

Freeze these subpackages:

```text
V2-6B  Schema, Migration, and Backfill Foundation
V2-6C  Posting Engine, APIs, Permissions, Events, and Compatibility Reads
V2-6D  UI, Modals, Navigation, Exports, Demo Cutover, and Acceptance
```

Do not reorder without an amendment.

## V2-6B

May implement:

- Prisma enums/models/relations/indexes/check constraints
- nullable StockMovement canonical linkage
- migration files
- read-only dry-run/backfill tooling
- migration validation tests
- feature flag/config scaffolding if required
- no new write cutover
- no sandbox migration without separate explicit operator approval

## V2-6C

May implement only after V2-6B acceptance:

- unified posting/reversal service
- serializable retry
- idempotency
- type-specific APIs
- permissions/events
- compatibility projections
- feature remains disabled until V2-6D cutover

## V2-6D

May implement only after V2-6C acceptance:

- sidebar/routes/tables/modals/forms
- V2-5 export integration
- Dashboard/Process Flow update
- canonical demo V2 data
- sandbox migration/backfill/cutover
- acceptance and controlled-demo review

Legacy StockAdjustment cleanup remains a later package, not V2-6D.

# Task 1 — Reconcile ADR-0021

Update:

```text
docs/engineering-manual/00-meta/adrs/
  ADR-0021-inventory-transaction-lifecycle-and-reversal.md
```

Set:

```text
Status: Accepted
Date: 2026-07
```

Replace `VOIDED` lifecycle language with `REVERSED`.

Record all Founder decisions above.

Do not mark application implementation complete.

# Task 2 — Freeze V2-6 Review Documents

Update:

- `V2-6-SCHEMA-MIGRATION-REVIEW.md`
- `V2-6-TRANSACTION-SEMANTICS.md`
- `V2-6-MIGRATION-BACKFILL-PLAN.md`
- `V2-6-TEST-MATRIX.md`

Set:

```text
Status: Frozen
```

Reconcile them with the Founder decisions.

Do not leave unresolved decision markers for items decided above.

Any genuinely unresolved implementation detail must be called out explicitly and must not undermine the frozen contract.

# Task 3 — Create Founder Decision Report

Create:

```text
docs/engineering-manual/00-meta/
  V2-6-FOUNDER-DECISION-REPORT.md
```

Include:

- all approved decisions
- amendments to V2-6A
- accepted status/reversal terminology
- warehouse/unit design
- idempotency/concurrency
- numbering/reference date
- event-delivery boundary
- permission expansion
- demo-data plan
- staged subpackage order
- forbidden scope
- public/production status

Required wording:

```text
V2-6 direction is approved.
Implementation is authorized one subpackage at a time.
Only V2-6B is eligible for explicit Founder authorization next.
```

# Task 4 — Create V2-6 Freeze Report

Create:

```text
docs/engineering-manual/00-meta/
  V2-6-FREEZE-REPORT.md
```

Include:

- documents inspected
- conflicts found
- conflicts resolved
- ADR status
- document statuses
- final decisions
- staged package order
- migration safety boundary
- implementation readiness
- checkpoint reference

# Task 5 — Replace the Single Draft Handoff with Staged Handoffs

Keep the original combined V2-6 package as historical/superseded documentation, or mark it superseded without deleting it.

Create:

```text
docs/engineering-manual/00-meta/
  IMPLEMENTATION-PACKAGE-V2-6B-SCHEMA-MIGRATION-BACKFILL.md

docs/engineering-manual/00-meta/
  IMPLEMENTATION-PACKAGE-V2-6C-POSTING-API-COMPATIBILITY.md

docs/engineering-manual/00-meta/
  IMPLEMENTATION-PACKAGE-V2-6D-UI-DEMO-CUTOVER.md
```

## V2-6B handoff status

```text
Status: Ready for Founder Approval
Implementation Allowed: No — explicit Founder authorization required
```

## V2-6C and V2-6D handoff status

```text
Status: Blocked
Implementation Allowed: No
```

Each handoff must include:

- scope
- authoritative docs
- allowed files/changes
- forbidden changes
- safety gates
- tests
- rollback
- exit criteria
- next-package dependency

Do not implement any subpackage.

# Task 6 — Update Readiness and Roadmap

Update narrowly:

- `V2-6-READINESS-NOTE.md`
- `INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`

Record:

```text
V2-6A complete
ADR-0021 accepted
V2-6 documents frozen
V2-6B next eligible package
V2-6C/V2-6D blocked
V2-7/V2-8 blocked
website asset production paused
public self-service demo unapproved
production readiness unclaimed
```

# Verification

Documentation-only.

Run:

```bash
git status --short
git rev-parse HEAD
git rev-list -n 1 inventory-demo-v2-v2.5-checkpoint

rg -n "Status: Proposed|VOIDED|voidedAt|voidedBy|voidReason|Founder decision required|Implementation Allowed: No — Founder review required" \
  docs/engineering-manual/00-meta/adrs/ADR-0021-*.md \
  docs/engineering-manual/00-meta/V2-6-*.md \
  docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6*.md

rg -n "POSTED|REVERSED|reversalOfTransactionId|Idempotency-Key|Serializable|REC-|ISS-|TRF-|ADJ-|REV-|SUPABASE|Warehouse Operator|V2-6B|V2-6C|V2-6D" \
  docs/engineering-manual/00-meta \
  docs/engineering-manual/17-module-specifications

git diff --check
git status --short
```

Do not run:

- npm install
- npm tests/build
- Prisma commands
- migrations
- demo reset/check
- database commands
- dependency audit fix
- staging
- commit/tag

# Final Report Required

Report:

1. V2-6 Founder-decision/freeze summary.
2. Repository/checkpoint verification.
3. Files inspected.
4. Files created.
5. Files modified.
6. ADR-0021 final status.
7. Lifecycle/reversal decision.
8. Warehouse/unit decision.
9. Idempotency/concurrency decision.
10. Numbering/reference-date decision.
11. Event-delivery boundary.
12. Compatibility/backfill decision.
13. API/permission decision.
14. Demo V2 data decision.
15. V2-6B/C/D package order and statuses.
16. Conflicts found/resolved.
17. Remaining unresolved decisions, if any.
18. Exact verification commands/results.
19. Confirmation that no application code, dependency, Prisma schema, migration, database data, permission, API, UI, caching, accent, website asset, module, or Platform Service change was made.
20. Whether V2-6 governance is frozen.
21. Whether V2-6B is ready for explicit Founder authorization.
22. Whether V2-6C, V2-6D, V2-7, and V2-8 remain blocked.

Stop after governance.

Do not implement V2-6B or any later package without explicit Founder approval.
