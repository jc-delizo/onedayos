# OneDayOS — Inventory Demo V2 Package V2-6A
# Pre-Implementation Schema, Migration, and Transaction-Semantics Review

The repository is safely checkpointed through V2-5.

Checkpoint:

```text
Commit: 6d4f70aec380ea60d66d0b7ef5a9fa0cac11747b
Tag: inventory-demo-v2-v2.5-checkpoint
Branch: main
Worktree: clean
```

V2-5 is Founder Accepted for the controlled package.

The Founder explicitly authorizes **V2-6A planning and migration review only**.

This is not authorization to implement V2-6 application code, modify Prisma, create a migration, or mutate the sandbox database.

## Purpose

V2-6 is the first major Inventory Demo V2 domain and schema package.

Before implementation, produce a complete, reviewable design for:

- `InventoryTransaction`
- `InventoryTransactionLine`
- receipt posting
- issue posting
- transfer posting
- adjustment migration
- StockMovement generation
- StockBalance updates
- status and immutability rules
- reversals/voiding
- Supplier and Customer references
- permissions
- APIs
- events
- UI routes/modals
- migration/backfill
- rollback and data verification

The result must be detailed enough that V2-6 implementation can proceed without inventing schema or behavior during coding.

## Primary Authority

Read first:

- `docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-V2-5-REPOSITORY-CHECKPOINT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/17-module-specifications/09-inventory-v2-module.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0020-inventory-v2-operational-workflows.md`

Also obey:

- `docs/engineering-manual/17-module-specifications/01-inventory-module.md`
- `docs/engineering-manual/07-business-objects/00-business-object-philosophy.md`
- `docs/engineering-manual/07-business-objects/02-product.md`
- `docs/engineering-manual/07-business-objects/03-customer.md`
- `docs/engineering-manual/07-business-objects/04-supplier.md`
- `docs/engineering-manual/07-business-objects/05-warehouse.md`
- `docs/engineering-manual/07-business-objects/07-business-object-extension-pattern.md`
- `docs/engineering-manual/08-module-system/04-module-permissions.md`
- `docs/engineering-manual/08-module-system/06-module-events.md`
- `docs/engineering-manual/08-module-system/09-module-testing.md`
- `docs/engineering-manual/04-kernel/04-authorization-enforcement.md`
- `docs/engineering-manual/04-kernel/08-kernel-api-contracts.md`
- `docs/engineering-manual/05-sdk/02-sdk-db-access.md`
- `docs/engineering-manual/05-sdk/03-sdk-auth-permissions.md`
- `docs/engineering-manual/05-sdk/04-sdk-events.md`
- `docs/engineering-manual/06-data/00-prisma-schema-strategy.md`
- `docs/engineering-manual/06-data/01-tenancy-data-isolation.md`
- `docs/engineering-manual/06-data/02-migrations.md`
- `docs/engineering-manual/06-data/03-soft-delete-archival.md`
- `docs/engineering-manual/06-data/04-indexing-performance.md`
- `docs/engineering-manual/06-data/05-data-validation-zod.md`
- `docs/engineering-manual/13-security/02-tenant-isolation.md`
- `docs/engineering-manual/13-security/03-permission-enforcement.md`
- `docs/engineering-manual/13-security/04-api-security.md`
- `docs/engineering-manual/13-security/05-data-security.md`
- `docs/engineering-manual/14-testing-quality/05-security-testing.md`
- `docs/engineering-manual/14-testing-quality/08-ci-quality-gates.md`
- `docs/engineering-manual/15-deployment-operations/03-database-migrations-production.md`

Inspect the V2-5 checkpoint reports and current Inventory implementation notes.

If any authority conflicts, stop and report the conflict. Do not silently choose.

## Founder-Frozen V2-6 Direction

The approved model direction is:

```text
InventoryTransaction
InventoryTransactionLine
```

Transaction types:

```text
receipt
issue
transfer
adjustment
```

Approved relationships:

- Receipt may reference a shared Supplier.
- Issue may reference a shared Customer.
- Customer on Issue is optional.
- Transfer uses source and destination Warehouses.
- Product remains a shared Business Object.
- Warehouse remains a shared Business Object.
- Supplier remains a shared Business Object.
- Customer remains a shared Business Object.
- Inventory does not own any of those identities.

Approved boundaries:

- no Purchase Orders
- no Sales Orders
- no accounting
- no valuation/costing
- no approvals
- no notifications
- no lots/serial numbers
- no attachments
- no background jobs
- no caching changes
- no import engine
- no new business module

## Absolute Scope

### Allowed

- inspect current Prisma schema and migrations
- inspect Inventory services, APIs, events, permissions, tests, and demo data
- design exact proposed Prisma models and enums
- design exact migration/backfill strategy
- design posting and reversal semantics
- design permissions, APIs, events, UI routes, and tests
- produce schema excerpts and migration pseudocode/SQL outline in documentation
- identify indexes and constraints
- identify compatibility/deprecation plan for existing `StockAdjustment`
- create a V2-6 implementation handoff
- update roadmap/readiness documents narrowly

### Forbidden

Do not:

- edit `prisma/schema.prisma`
- create a migration folder
- run `prisma migrate dev`
- run `prisma migrate deploy`
- run `prisma db push`
- run demo reset
- mutate sandbox data
- implement services/APIs/UI
- modify permissions
- install dependencies
- change package files
- change V2-1 through V2-5 behavior
- implement caching or accents
- resume website asset production
- add new modules
- commit or tag
- run `npm audit fix`
- run `npm audit fix --force`

## Repository Safety

Before work:

1. Run `git status --short`.
2. Confirm the worktree is clean.
3. Confirm current HEAD and checkpoint tag.
4. Do not alter the checkpoint commit/tag.
5. Do not commit.
6. Keep this package documentation-only.

If the worktree is not clean before this task, stop and report the unexpected state.

# Phase 1 — Current Inventory Data Model Audit

Inspect:

- `prisma/schema.prisma`
- all Inventory migrations
- `InventoryProductExtension`
- `StockBalance`
- `StockMovement`
- `StockAdjustment`
- relevant relations on Product, Supplier, Customer, Warehouse, User, Organization
- current enum/string vocabularies
- soft-delete fields
- timestamps
- unique constraints
- indexes
- foreign-key actions

Report the exact current fields and constraints.

At minimum answer:

1. How is current quantity stored?
2. How is current movement direction/type stored?
3. How are before/after quantities stored?
4. How is a StockAdjustment linked to StockMovement?
5. Is a movement immutable by application contract or schema?
6. Is a StockAdjustment editable?
7. What currently identifies who posted a transaction?
8. How are references/reasons represented?
9. What existing data must be backfilled?
10. What current fields are redundant after V2-6?

# Phase 2 — Current Posting Logic Audit

Inspect the current stock-adjustment transaction service.

Document exact order:

1. permission/module checks
2. Product/Warehouse tenant validation
3. current balance lookup
4. quantity calculation
5. negative-stock prevention
6. adjustment creation
7. movement creation
8. balance create/update
9. event emission
10. transaction boundary
11. failure/rollback behavior

Identify reusable logic and logic that must be replaced.

Do not change it.

# Phase 3 — Proposed State Model

Decide and document the V2-6 lifecycle.

Evaluate at least:

## Option A — Posted-only + void/reversal

```text
POSTED
VOIDED
```

Creation posts atomically.

## Option B — Draft + posted + voided

```text
DRAFT
POSTED
VOIDED
```

Drafts can be edited before posting.

Use the frozen Inventory V2 specification as authority.

Recommend the smallest lifecycle that supports the demo honestly.

For each status define:

- editable fields
- permitted transitions
- who may transition
- side effects
- event emission
- StockMovement/StockBalance behavior
- API behavior
- UI behavior
- audit fields

Do not invent approval states.

# Phase 4 — Exact Proposed Prisma Schema

Produce an exact proposed schema excerpt in documentation only.

At minimum evaluate fields for:

## `InventoryTransaction`

Potential fields to review:

```text
id
orgId
type
status
transactionNumber
referenceNumber
transactionDate
supplierId?
customerId?
sourceWarehouseId?
destinationWarehouseId?
reason?
notes?
postedAt?
postedByUserId?
voidedAt?
voidedByUserId?
voidReason?
reversalOfTransactionId?
createdAt
updatedAt
```

Do not include fields without a justified use.

## `InventoryTransactionLine`

Potential fields:

```text
id
orgId
transactionId
productId
quantity
unit?
lineNumber
notes?
createdAt
updatedAt
```

Decide whether unit is snapshotted or always derived from Product.

## Relations

Review:

- Organization
- Supplier
- Customer
- source Warehouse
- destination Warehouse
- Product
- posting User
- voiding User
- reversal transaction
- StockMovement linkage

## Enums

Propose exact names and values for:

```text
InventoryTransactionType
InventoryTransactionStatus
```

Follow current Prisma naming conventions.

## Constraints

Define exact type-specific invariants that Prisma cannot fully express and must be enforced in Zod/service logic.

Examples:

### Receipt

- destinationWarehouse required
- sourceWarehouse absent
- Supplier optional
- Customer absent

### Issue

- sourceWarehouse required
- destinationWarehouse absent
- Customer optional
- Supplier absent

### Transfer

- sourceWarehouse required
- destinationWarehouse required
- source != destination
- Supplier absent
- Customer absent

### Adjustment

- exactly one target Warehouse
- define whether it uses source or destination field, or a dedicated `warehouseId`
- Supplier/Customer absent

Avoid awkward nullable-field design if a clearer schema is possible.

Compare:

1. shared `sourceWarehouseId`/`destinationWarehouseId`
2. generic `warehouseId` plus source/destination for transfer
3. per-type tables

The unified model decision is frozen, but field design still requires review.

# Phase 5 — Movement Linkage Design

Decide how `StockMovement` links to the unified transaction.

Preferred direction to evaluate:

```text
inventoryTransactionId?
inventoryTransactionLineId?
```

For transfer, one line produces:

- one outbound movement at source
- one inbound movement at destination

For receipt/issue/adjustment, one line usually produces one movement.

Define:

- movement type vocabulary after V2-6
- backward compatibility with:
  - opening_balance
  - adjustment_in
  - adjustment_out
- whether new types include:
  - receipt_in
  - issue_out
  - transfer_out
  - transfer_in
- whether current `stockAdjustmentId` remains temporarily
- migration timing for removing old relation
- event payload IDs
- immutable linkage

Do not implement.

# Phase 6 — StockAdjustment Compatibility Decision

Choose and document one strategy:

## Strategy 1 — Migrate and retire

- backfill each current StockAdjustment into InventoryTransaction/Line
- link current movements
- remove old model in a later cleanup migration

## Strategy 2 — Keep compatibility projection temporarily

- new transactions become canonical
- old StockAdjustment remains read-only during transition
- migration/backfill occurs in phases

## Strategy 3 — Preserve StockAdjustment as a subtype table

Only if the frozen unified-model decision permits it.

Recommend the safest strategy.

Address:

- existing API routes
- existing detail pages/modals
- existing export routes
- existing demo reset/provisioning
- Data Table V2
- dashboard activity
- Process Flow
- events
- tests
- rollback

No existing URL should silently break without a compatibility plan.

# Phase 7 — Migration and Backfill Plan

Design an ordered migration plan.

At minimum include:

1. add enums/new tables/nullable relations
2. add indexes/uniques
3. backfill current StockAdjustment rows
4. create transaction lines
5. link existing StockMovements
6. verify counts and quantities
7. update application to dual-read or new-read as required
8. switch writes to new transaction model
9. preserve compatibility routes
10. cleanup/deprecate old model in a later migration only after evidence

The V2-6 migration should be reversible where practical.

Define:

- preflight checks
- SQL/Prisma data migration approach
- transaction boundaries
- batch size
- failure handling
- idempotency
- validation queries
- rollback strategy
- sandbox-first execution
- production execution remains separately gated

Do not create migration files now.

## Backfill mapping

For every current StockAdjustment:

- transaction type = adjustment
- status = posted
- transaction date mapping
- reason/reference mapping
- Warehouse mapping
- User/poster mapping
- one transaction line
- movement linkage
- before/after quantity verification

Define behavior for incomplete or inconsistent historical rows.

Do not silently backfill corrupt data.

# Phase 8 — Posting Semantics

Design exact atomic posting behavior for:

## Receipt

- validate Supplier when supplied
- validate destination Warehouse
- validate every Product
- positive quantities only
- create transaction/lines
- create inbound movements
- update balances
- emit events after commit

## Issue

- validate optional Customer
- validate source Warehouse
- positive line quantities
- prevent negative stock per Product/Warehouse
- create outbound movements
- update balances
- emit after commit

## Transfer

- validate both Warehouses
- source != destination
- validate stock at source
- create paired movements
- decrement source
- increment destination
- no quantity creation/loss
- one database transaction
- emit one transaction-level event plus line/movement facts as approved

## Adjustment

Define whether input is:

- delta quantity, or
- counted final quantity

Preserve the current safer server-computed contract.

If current manual adjustment is delta-based, document that.

Do not allow client-computed before/after balances.

## Multi-line failure

Any invalid line must fail the entire transaction.

No partial posting.

# Phase 9 — Void/Reversal Design

Posted stock history must not be destructively edited.

Design a safe reversal model.

At minimum decide:

- whether `VOIDED` creates reversing movements
- whether a separate reversal transaction is created
- how original transaction is marked
- who may reverse
- reversal reason
- negative-stock validation on reversal
- transfer reversal behavior
- event names
- UI wording
- export behavior

Preferred auditability direction:

```text
Create a posted reversal transaction;
mark the original as reversed/voided;
never delete posted movements.
```

Do not use hard delete.

Do not allow arbitrary line edits after posting.

# Phase 10 — Transaction Numbering

Design organization-scoped transaction numbers.

Examples:

```text
REC-2026-000001
ISS-2026-000001
TRF-2026-000001
ADJ-2026-000001
```

Address:

- organization scope
- transaction type
- year rollover
- concurrency
- uniqueness
- retries
- database enforcement
- no client generation

If reliable numbering requires a sequence/counter model, document it.

Do not add a new model without justification.

A UUID-backed display reference may be safer for MVP; compare both options.

# Phase 11 — Permissions

Define exact V2-6 permissions through the existing permission model.

At minimum:

```text
inventory.receipt.read
inventory.receipt.create
inventory.receipt.reverse

inventory.issue.read
inventory.issue.create
inventory.issue.reverse

inventory.transfer.read
inventory.transfer.create
inventory.transfer.reverse

inventory.adjustment.read
inventory.adjustment.create
inventory.adjustment.reverse

inventory.transaction.export
```

Reconcile with existing:

```text
inventory.stock_adjustment.*
inventory.stock_movement.*
inventory.stock_level.*
```

Define:

- compatibility aliases or migration
- Org Admin behavior
- Warehouse Operator role changes, if any
- least privilege
- no wildcard grant
- no automatic export grant
- source/destination Warehouse visibility
- Supplier/Customer read dependencies

Do not change permissions now.

# Phase 12 — Events

Define exact fact events.

Potential transaction-level events:

```text
inventory.receipt.posted
inventory.issue.posted
inventory.transfer.posted
inventory.adjustment.posted
inventory.transaction.reversed
```

Potential movement-level events remain:

```text
inventory.stock_movement.created
inventory.stock_balance.updated
inventory.stock_below_reorder_point
```

Follow current event naming rules.

Payload requirements:

- no `orgId`
- no full Prisma records
- minimal IDs and quantities
- stable versioning if current event system supports it
- emitted only after commit
- no Notification Service implementation

# Phase 13 — API Contract

Design exact routes under:

```text
/api/orgs/[orgSlug]/inventory/transactions
```

or type-specific routes if the frozen spec requires them.

Compare:

## Unified API

```text
POST /inventory/transactions
GET  /inventory/transactions
GET  /inventory/transactions/[id]
POST /inventory/transactions/[id]/reverse
```

with a strict `type` field.

## Type-specific API

```text
/inventory/receipts
/inventory/issues
/inventory/transfers
/inventory/adjustments
```

The model is unified, but APIs may still be type-specific for stronger validation.

Recommend one.

Requirements:

- JSON envelopes
- strict Zod
- no `orgId`
- permission checks
- safe 401/403/404
- module disabled 404
- full transaction atomicity
- no raw errors
- idempotency/retry strategy
- selected shared-record references validated in tenant

Do not implement.

# Phase 14 — UI and Navigation Contract

Freeze the planned Inventory sidebar:

```text
Dashboard
Process Flow
Stock Levels

Transactions
  Receipts
  Issues
  Transfers
  Adjustments

Movement Ledger

Related Records
  Products
  Categories
  Suppliers
  Customers
  Warehouses
```

Design pages:

- transaction list per type or unified list with type tabs/filters
- create modal/full-page fallback
- read-only posted detail modal
- reverse action
- no edit after posting
- permission-aware actions
- Data Table V2
- V2-3 URL-addressable modals
- V2-5 exports
- compact operational headers

Define form fields for each transaction type.

No implementation now.

# Phase 15 — Dashboard and Process Flow Impact

Define V2-6 changes to:

## Dashboard

Movement Trend should map:

- receipt → inbound
- issue → outbound
- transfer → internal movement, not counted as net inbound/outbound organization-wide unless a Warehouse-level view
- adjustment → inbound/outbound based on delta

Avoid double-counting transfer movement in organization-wide inbound/outbound charts.

## Process Flow

Current planned nodes become implemented only after V2-6 passes.

Update flow to show:

- Receipt
- Issue
- Transfer
- Adjustment
- Transactional Posting
- Balance and Ledger

No workflow should be marked current before code/migration passes.

# Phase 16 — Export Impact

Define how V2-5 export changes:

- transaction lists
- transaction lines
- legacy adjustment export compatibility
- no internal IDs
- Supplier/Customer/Warehouse labels
- reversal status
- posted/reversed timestamps
- permissions
- row limits

Do not implement.

# Phase 17 — Demo Data and Reset

Design canonical demo V2 data:

- at least one Receipt from Demo Supplier
- at least one Issue, optionally to Demo Customer
- at least one Transfer between two Warehouses
- at least one Adjustment
- movement and balance chains reconcile
- Coffee Beans remains low stock where intended
- at least two Warehouses are needed for transfer demonstration

This may require adding a second canonical demo Warehouse during V2-6.

Document exact expected balances before/after each transaction.

Do not mutate demo data now.

# Phase 18 — Test Matrix

Produce an implementation-grade test matrix.

Required categories:

## Schema

- enums
- constraints
- indexes
- relations
- unique numbers
- tenant fields

## Migration

- empty DB
- current demo DB
- multiple organizations
- inconsistent historical row rejection
- idempotent backfill
- rollback rehearsal
- no orphan movements

## Receipt

- valid
- invalid Supplier
- invalid Warehouse/Product
- multi-line atomicity
- balance create/update
- event timing

## Issue

- valid
- optional Customer
- negative-stock prevention
- cross-tenant reference
- multi-line rollback

## Transfer

- valid paired movement
- same Warehouse rejection
- insufficient stock
- no quantity loss
- multi-line rollback

## Adjustment

- positive/negative
- negative-stock rejection
- legacy compatibility
- server-computed quantities

## Reverse

- each type
- double-reversal rejection
- permission denial
- insufficient stock on reversal
- immutable original history

## API

- 401/403/404
- module disabled
- malformed JSON
- unknown keys
- orgId rejection
- idempotency/retry
- safe errors

## UI

- role visibility
- modals/full-page fallback
- read-only posted detail
- reverse confirmation
- Data Table V2
- exports
- Light/Dark/System
- mobile
- accessibility

## Events

- names
- payloads
- after commit
- no event on failure
- no orgId/full record

# Phase 19 — Performance and Index Review

Propose indexes for:

- orgId + type + status + transactionDate
- orgId + sourceWarehouseId
- orgId + destinationWarehouseId
- orgId + supplierId
- orgId + customerId
- transactionId + lineNumber
- orgId + productId
- movement transaction linkage

Do not add indexes now.

Identify query plans that should be tested after migration.

# Phase 20 — Deliverables

Create:

```text
docs/engineering-manual/00-meta/
  V2-6-SCHEMA-MIGRATION-REVIEW.md
  V2-6-TRANSACTION-SEMANTICS.md
  V2-6-MIGRATION-BACKFILL-PLAN.md
  V2-6-TEST-MATRIX.md
  IMPLEMENTATION-PACKAGE-V2-6-INVENTORY-CORE-TRANSACTIONS.md
```

Create, if governance requires:

```text
docs/engineering-manual/00-meta/adrs/
  ADR-0021-inventory-transaction-lifecycle-and-reversal.md
```

ADR status:

```text
Status: Proposed
Date: 2026-07
Implementation Allowed: No — Founder review required
```

Do not create an ADR if ADR-0020 and the frozen spec already fully decide these details. Explain the decision.

Update narrowly:

```text
docs/engineering-manual/00-meta/V2-6-READINESS-NOTE.md
docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md
```

Do not authorize implementation automatically.

## Implementation Package Status

The handoff must say:

```text
Status: Draft for Founder Review
Implementation Allowed: No
```

until the Founder approves the schema, migration, and lifecycle decisions.

# Verification

Documentation and read-only audit only.

Run:

```bash
git status --short
git rev-parse HEAD
git rev-list -n 1 inventory-demo-v2-v2.5-checkpoint

find prisma -type f | sort
find src/modules/inventory -type f | sort
find src/app/api/orgs -path '*inventory*' -type f | sort
find src/app/'[orgSlug]'/inventory -type f | sort

rg -n "StockAdjustment|StockMovement|StockBalance|InventoryTransaction|receipt|issue|transfer|reverse|void" \
  prisma src/modules/inventory src/app/api/orgs src/app/'[orgSlug]'/inventory

git diff --check
git status --short
```

Do not run:

- npm install
- tests/build
- Prisma generate
- migrations
- demo reset
- database commands
- audit fix
- commit

# Final Report Required

Report:

1. V2-6A review summary.
2. Checkpoint/clean-worktree verification.
3. Files inspected.
4. Files created.
5. Files modified.
6. Current Inventory schema summary.
7. Current posting logic summary.
8. Recommended transaction lifecycle.
9. Exact proposed model fields/enums.
10. Type-specific invariants.
11. Movement-linkage decision.
12. StockAdjustment compatibility strategy.
13. Migration/backfill sequence.
14. Posting semantics by type.
15. Reversal/void strategy.
16. Transaction numbering decision.
17. Permission plan.
18. Event plan.
19. API route recommendation.
20. UI/navigation plan.
21. Dashboard/Process Flow impact.
22. Export impact.
23. Canonical demo V2 data plan.
24. Index/performance recommendations.
25. Test matrix summary.
26. ADR-0021 decision/status, if created.
27. Implementation package path/status.
28. Conflicts or unresolved Founder decisions.
29. Exact verification commands and results.
30. Confirmation that no application code, dependency, Prisma schema, migration, data, permission, API, UI, caching, accent, website asset, module, or Platform Service change was made.
31. Whether V2-6A is complete.
32. Whether V2-6 implementation remains blocked pending Founder review.
