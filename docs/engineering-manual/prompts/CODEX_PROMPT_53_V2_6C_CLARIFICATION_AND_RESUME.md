# OneDayOS — V2-6C Domain Clarification and Resume
# Reversal Representation + 100-Line Transaction Limit

V2-6C correctly stopped before implementation because two frozen-contract details were ambiguous.

The Founder now resolves both items and explicitly authorizes Codex to:

1. reconcile the frozen V2-6 governance documents with the decisions below, and
2. resume the complete Prompt 52 V2-6C implementation within its existing scope.

No V2-6D work is authorized.

The controlled Supabase sandbox must remain unmigrated, unbackfilled, unprovisioned for V2 permissions, and V2 runtime-disabled.

## Repository Baseline

Expected:

```text
Branch: main
HEAD: b439afd12266a03766699f7fdc08f2178a480aba
Tag: inventory-demo-v2-v2.6b-foundation
```

Expected untracked files:

- authorized Prompt 46 through Prompt 53 inputs only

Prompt files must remain untouched, unstaged, and uncommitted.

Stop if any unexpected source/config/package/Prisma change exists before this task.

## Primary Authority

Read and reconcile:

- `docs/engineering-manual/00-meta/V2-6-TRANSACTION-SEMANTICS.md`
- `docs/engineering-manual/00-meta/V2-6-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/V2-6-TEST-MATRIX.md`
- `docs/engineering-manual/00-meta/IMPLEMENTATION-PACKAGE-V2-6C-POSTING-API-COMPATIBILITY.md`
- `docs/engineering-manual/00-meta/adrs/ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- `docs/engineering-manual/17-module-specifications/09-inventory-v2-module.md`
- the complete Prompt 52 V2-6C instructions supplied by the Founder

These Founder clarifications are a narrow amendment to the frozen V2-6 contract.

If the complete Prompt 52 text is unavailable in repository/context, complete only the documentation reconciliation and stop. Do not reconstruct its implementation scope from memory.

# Founder Decision 1 — Exact Reversal Representation

## General reversal contract

A reversal:

- creates a new `POSTED` InventoryTransaction,
- retains the original business `type`,
- receives a new `REV-{UTC_YEAR}-{16 UPPERCASE HEX}` transaction number,
- sets `reversalOfTransactionId` to the original transaction,
- uses the current server-owned `postedAt`,
- uses the current reversing user as `postedByUserId`,
- uses the new required operator-supplied reversal `reason`,
- is atomic,
- appends new inverse movements,
- never edits or deletes original lines or movements,
- marks the original transaction `REVERSED` only after the reversal post succeeds,
- may be created at most once per original,
- may not itself be reversed.

The reverse request contains only:

```text
reason
```

plus the required `Idempotency-Key` header.

The client does not submit reversal lines, quantities, Warehouses, party references, dates, actors, balances, movement types, transaction numbers, or organization identity.

## Reference context

Copy these contextual fields from the original transaction:

- `referenceNumber`
- `referenceDate`
- `supplierId`, when the original is a Receipt
- `customerId`, when the original is an Issue

Do not copy the original transaction-level `reason`.

The reversal transaction stores the new required reversal reason.

Do not automatically duplicate the original transaction-level `notes`; the original remains linked and auditable.

For each reversal line, copy:

- `productId`
- snapshotted `unit`
- `lineNumber`
- line `notes`, when present

## Receipt reversal

Header:

```text
type = RECEIPT
warehouseId = original.warehouseId
sourceWarehouseId = null
destinationWarehouseId = null
supplierId = original.supplierId
customerId = null
```

Lines:

```text
quantity = original positive receipt quantity
```

Effects:

- append `reversal_out`
- signed movement quantity is negative
- reduce the same Warehouse balance
- reject if current stock is insufficient
- no original movement is changed

## Issue reversal

Header:

```text
type = ISSUE
warehouseId = original.warehouseId
sourceWarehouseId = null
destinationWarehouseId = null
customerId = original.customerId
supplierId = null
```

Lines:

```text
quantity = original positive issue quantity
```

Effects:

- append `reversal_in`
- signed movement quantity is positive
- increase the same Warehouse balance

## Transfer reversal

The reversal represents the actual reverse physical direction.

Header:

```text
type = TRANSFER
warehouseId = null
sourceWarehouseId = original.destinationWarehouseId
destinationWarehouseId = original.sourceWarehouseId
supplierId = null
customerId = null
```

Lines:

```text
quantity = original positive transfer quantity
```

Effects for each line:

- append `reversal_out` at the original destination / reversal source
- append `reversal_in` at the original source / reversal destination
- subtract from the reversal source
- add to the reversal destination
- reject if the original destination no longer has sufficient stock
- preserve organization-wide total quantity
- no original transfer movement is changed

Do not retain the original source/destination direction on the reversal header.

## Adjustment reversal

Adjustment line semantics remain:

```text
quantity = counted final quantity
```

The reversal line must therefore **not** copy the original Adjustment line quantity.

For each original Adjustment line:

1. locate the exactly linked canonical original movement,
2. read the original signed movement delta,
3. read the current balance at reversal time,
4. compute:

```text
reversalDelta = -originalMovement.quantityChange
postReversalCountedQuantity =
  currentBalance.quantity + reversalDelta
```

5. reject if the computed post-reversal quantity is negative,
6. create the reversal line with:

```text
quantity = postReversalCountedQuantity
```

7. append:
   - `reversal_in` when `reversalDelta > 0`
   - `reversal_out` when `reversalDelta < 0`

The reversal movement stores the signed inverse delta.

The reversal line stores the server-computed counted final quantity.

The client never supplies either value.

A zero original movement/no-op Adjustment is not a valid reversible posting unless the already frozen Adjustment contract explicitly permits and defines it. Follow the frozen no-op rule.

## Reversal movement derivation

Always derive inverse effects from the original canonical linked movements rather than trusting reconstructed client or display values.

For a valid original transaction:

- Receipt line → exactly one canonical movement
- Issue line → exactly one canonical movement
- Adjustment line → exactly one canonical movement
- Transfer line → exactly two canonical movements, one source and one destination

Missing, duplicate, cross-tenant, or inconsistent movement linkage causes a safe domain failure. Do not guess or repair runtime history.

## Reversal idempotency

A replay of the same reversal Idempotency-Key and normalized reason returns the original reversal result and emits no duplicate events.

The same key with a different reason/request hash returns the frozen idempotency conflict.

The original transaction may not be reversed by a second distinct idempotency key after the first reversal succeeds.

# Founder Decision 2 — Transaction Line Limit

Approve this V2-6 MVP limit:

```text
Minimum lines per create transaction: 1
Maximum lines per create transaction: 100
```

Apply to:

- Receipt create
- Issue create
- Transfer create
- Adjustment create

Implementation requirements:

- strict Zod `.min(1).max(100)` or equivalent
- stable validation error
- no client/runtime override
- no environment-configurable bypass
- count submitted transaction lines, not database movements
- a Transfer with 100 lines may create 200 movements
- request hashing includes every line in the submitted order according to the frozen normalization contract
- all 100 lines remain one atomic transaction
- exceeding the limit fails before any database mutation
- zero lines fails before any database mutation

The reverse request has no client line array.

A reversal reproduces the complete original transaction line set according to the rules above.

All new V2 transactions are bounded at creation, and legacy backfilled Adjustments contain one line, so reversal remains within the approved bound.

Tests must prove:

- 0 lines rejected
- 1 line accepted
- 100 lines accepted
- 101 lines rejected
- no database call for 0/101 lines
- a 100-line Transfer produces the expected paired-movement count atomically in isolated PostgreSQL testing
- a failure on the final line rolls back the entire transaction

The limit may be reconsidered only through a later measured performance amendment. V2-6C must not invent batching or background posting.

# Task 1 — Reconcile Frozen Documents

Update narrowly:

- `V2-6-TRANSACTION-SEMANTICS.md`
- `V2-6-FOUNDER-DECISION-REPORT.md`
- `V2-6-TEST-MATRIX.md`
- `IMPLEMENTATION-PACKAGE-V2-6C-POSTING-API-COMPATIBILITY.md`
- `ADR-0021-inventory-transaction-lifecycle-and-reversal.md`
- `09-inventory-v2-module.md`, only if needed for consistency

Preserve Accepted/Frozen statuses.

Add a clearly dated Founder clarification/amendment note.

Remove ambiguous language such as an unqualified:

```text
copy original lines
```

Replace it with the exact type-specific rules above.

Search for and reconcile every conflicting reversal or unbounded-line statement.

Do not reopen unrelated V2-6 decisions.

# Task 2 — Resume Prompt 52

After documentation consistency checks pass, resume the complete Prompt 52 V2-6C implementation.

All Prompt 52 boundaries remain in force, including:

- runtime disabled by default,
- controlled sandbox unmigrated,
- no V2 UI/navigation cutover,
- no live V2 permission provisioning,
- no demo reset,
- no V2-6D work,
- disposable PostgreSQL posting rehearsal,
- production audit clean,
- only the approved, unexpired dev lint exception,
- no Durable Outbox,
- no caching/accent/website work.

Do not omit any Prompt 52 final-report requirement.

# Required Additional Tests

In addition to Prompt 52 tests, add explicit coverage for:

## Receipt reversal

- copied positive line quantity
- same Warehouse
- same optional Supplier
- `reversal_out`
- insufficient current stock rejection

## Issue reversal

- copied positive line quantity
- same Warehouse
- same optional Customer
- `reversal_in`

## Transfer reversal

- source/destination swapped
- positive copied line quantity
- reversal_out at original destination
- reversal_in at original source
- organization total unchanged
- insufficient original-destination stock rejection

## Adjustment reversal

- original positive delta
- original negative delta
- current balance changed after original posting
- post-reversal line quantity equals current balance minus original delta
- movement delta is exact inverse
- negative computed result rejected
- client cannot supply reversal quantity
- original line quantity is not blindly copied

## Reference context

- reference number/date copied
- Supplier/Customer copied only for applicable types
- new reversal reason used
- original transaction-level reason not copied
- line notes copied
- current posting actor/time used

## Movement integrity

- missing canonical movement rejects
- duplicate movement rejects
- line/transaction/org mismatch rejects
- transfer requires exact paired original movements
- no history repair

## Line limit

- 0 / 1 / 100 / 101 cases
- no DB access before invalid limit failure
- 100-line Receipt/Issue/Adjustment atomicity
- 100-line Transfer creates 200 movements
- line 100 failure rolls back all effects
- idempotent replay of maximum-size request does not repost

# Verification Before Resume

Documentation consistency:

```bash
rg -n "copy original lines|line limit|maximum.*line|100 lines|Adjustment reversal|sourceWarehouseId|destinationWarehouseId" \
  docs/engineering-manual/00-meta \
  docs/engineering-manual/17-module-specifications

git diff --check
```

Then execute the full Prompt 52 verification suite.

# Final Report Required

Begin the report with:

1. Clarification summary.
2. Documents reconciled.
3. Final Receipt reversal representation.
4. Final Issue reversal representation.
5. Final Transfer reversal representation.
6. Final Adjustment reversal representation.
7. Final reference-context behavior.
8. Final line-count limit.
9. New clarification tests.

Then provide the complete Prompt 52 final report.

Explicitly confirm:

- no sandbox migration/backfill/reset/provisioning occurred,
- V2 runtime remains disabled in the controlled sandbox,
- no V2-6D UI/navigation/export/demo cutover occurred,
- V2-6D remains blocked.

Stop after V2-6C.

Do not proceed to V2-6D without explicit Founder authorization.
