# V2-6 Implementation Test Matrix

Status: Frozen
Date: 2026-07
Implementation Allowed: No

Every tenant-sensitive suite uses at least two organizations and separates authentication, module, permission, and tenant-denial assertions.

## Founder Clarification Coverage — 2026-07-25

- All create schemas reject 0/101 lines and accept 1/100 without database access on invalid bounds.
- Maximum-size posts remain atomic; a 100-line Transfer creates 200 paired movements.
- Receipt/Issue reversal copy positive line quantities and retain the applicable Warehouse/party.
- Transfer reversal swaps Warehouses and emits inverse movements at the physical reverse sides.
- Adjustment reversal derives inverse delta from canonical movement and stores current balance
  minus the original delta as counted-final quantity, including after intervening balance changes.
- Reversal context copies reference date/number and line notes, uses new reason/current actor/time,
  and rejects missing/duplicate/inconsistent canonical movements.

## Schema and Migration

| Area | Required evidence |
| --- | --- |
| Enums | Exact four type and two status values; invalid values rejected |
| Relations | Composite tenant-safe Product, Warehouse, Supplier, Customer, User, transaction, line, and movement links |
| Constraints | Warehouse/type combinations, source != destination, positive Receipt/Issue/Transfer quantity, non-negative counted Adjustment quantity, positive line number, idempotency field pairing |
| Uniques | Org transaction number, nullable legacy idempotency key, one reversal, line number |
| Movement linkage | Canonical movement requires transaction and line together; composite FK rejects a line from another transaction or organization |
| Indexes | Presence and query-plan use for documented list/join filters |
| Empty DB | Full migration chain applies and Prisma generates |
| Current demo | Nine adjustments/lines/movements backfill and reconcile |
| Multiple orgs | Per-org counts and no cross-tenant links |
| Corrupt history | Each mismatch class stops with no writes |
| Rerun | Dry-run and execute are idempotent; divergent existing rows fail |
| Rollback | Pre-write rollback rehearsal; post-write forward-fix rehearsal |
| Orphans | Zero orphan transactions, lines, movements, parties, Warehouses, Products, or Users |

## Receipt

- valid single- and multi-line post;
- optional Supplier absent/present;
- invalid, deleted, inactive, and cross-tenant Supplier/Warehouse/Product rejection;
- zero/negative/over-precision quantity rejection;
- optional reference date accepts history and current UTC date + 1 day, but rejects later dates;
- duplicate Product rejection;
- balance create and increment;
- unit snapshot comes from Product, not client;
- all lines roll back when one fails;
- events only after commit and no event on rollback;
- idempotent replay returns one transaction.

## Issue

- valid post with and without Customer;
- invalid/deleted/cross-tenant Customer rejection;
- invalid Warehouse/Product rejection;
- exact-stock issue reaches zero;
- insufficient stock and missing balance rejection;
- concurrent issues cannot both consume the same stock;
- multi-line failure rolls back all lines;
- outbound movement/result and balance reconcile.

## Transfer

- valid paired movement and two balance updates per line;
- same Warehouse rejection;
- invalid/cross-tenant Warehouse rejection;
- insufficient source stock rejection;
- destination balance create/update;
- sum of paired deltas is zero per line and transaction;
- organization-wide quantity does not change;
- deterministic lock order/concurrent opposite transfers do not deadlock or oversell;
- multi-line failure leaves no partial pair or balance.

## Adjustment

- positive and negative computed deltas;
- counted final quantity zero accepted when it changes stock; negative counted quantity rejected;
- counted-final input, server-computed before/delta/result;
- zero delta and negative final rejection;
- existing missing balance treated as zero;
- legacy single-line POST compatibility;
- backfilled adjustment list/detail/export compatibility;
- clients cannot submit delta/before/status/audit fields.

## Reverse

- Receipt, Issue, Transfer, and Adjustment reversal effects;
- original becomes `REVERSED` and reversal remains `POSTED`;
- reversing movements append; originals remain unchanged;
- reason and actor/time required/server-derived;
- double reversal and reversal-of-reversal rejected;
- missing permission denied;
- cross-tenant ID safely not found;
- insufficient stock blocks Receipt, Transfer, and positive-Adjustment reversal;
- all reversal lines atomic;
- idempotent reverse retry creates one reversal.

## API and Permissions

- JSON `401`, `403`, safe `404`, `409`, and `422`;
- module-disabled `404`;
- malformed JSON, unknown keys, invalid discriminator, and invalid route ID;
- `orgId` rejected in body/query;
- relation IDs revalidated inside tenant;
- correct permission per type/action;
- read does not grant create, reverse, or export;
- legacy grant migration exact and idempotent;
- no automatic reverse/export grant;
- Supplier/Customer label redaction without shared-object read;
- raw errors and Prisma records never escape;
- idempotency key missing/reused/different-payload/concurrent-replay behavior.
- `IDEMPOTENCY_KEY_REQUIRED` and `IDEMPOTENCY_KEY_REUSED` stable envelope codes;
- exact normal/reversal number prefixes, UTC posting year, 16 uppercase hex, organization uniqueness, and three-attempt collision bound;
- only known serializable/write-conflict failures retry; validation/domain failures do not;
- approved Warehouse Operator has type read/create and Customer read, but no reverse/export/admin/wildcard grants.

## UI and Accessibility

- permission-aware sidebar/actions for Org Admin, proposed Warehouse Operator, and denied user;
- Data Table V2 filters/sort/pagination/selection;
- URL-addressable create/detail/reverse modals;
- direct full-page fallback, refresh, Back/Forward, focus trap/return;
- posted and reversed details read-only, no edit route/action;
- reverse impact confirmation and required reason;
- line add/remove keyboard behavior and error association;
- empty/loading/error/forbidden states;
- Light/Dark/System, 390px mobile, no horizontal page overflow;
- axe checks for each form family, detail, reverse modal, and representative table;
- exports visible only with explicit export permission.

## Dashboard, Process Flow, and Export

- receipt inbound, issue outbound, signed adjustment mapping;
- transfers excluded from organization-wide inbound/outbound and shown correctly in Warehouse view;
- no double-counting;
- unsupported movement type fails safely;
- Process Flow stays planned until implementation acceptance;
- CSV/XLSX exact filters, selected scope, safe columns/filenames/cells;
- 10,000 filtered and 1,000 selected limits;
- no internal/idempotency/tenant IDs;
- party/Warehouse labels honor permissions;
- reversed/reversal presentation and legacy adjustment export compatibility.

## Events

- exact names and manifest declarations;
- one type-specific post event;
- reversal event;
- movement and balance facts per affected row;
- transfer fact count and paired payload IDs;
- payload schemas reject `orgId`, full records, and unknown keys;
- quantities serialized as canonical decimal strings;
- no event before commit or on database failure;
- documented best-effort behavior and safe request/transaction logging on emitter failure;
- no durable-delivery claim and no external guaranteed-delivery consumer;
- threshold-crossing events use before/after balance correctly.

## Demo and Performance

- canonical Receipt, Issue, Transfer, and Adjustment exist;
- two Warehouses and shared Supplier/Customer references;
- final balances exactly match the approved table;
- Coffee total remains 8 and low against reorder point 10;
- every running movement result equals the next movement start/final balance;
- transaction list/detail, party/Warehouse filter, Product ledger, and export query plans use intended indexes;
- posting concurrency test at realistic line count;
- bounded batch backfill memory/lock duration evidence;
- dashboard exact-processing guard still holds.

## Exit Gate

Implementation cannot be accepted until schema/migration review, sandbox migration, backfill reconciliation, service/API/UI tests, security/tenant tests, accessibility, production build, dependency gates, controlled demo check, and Founder acceptance all pass with no skipped required suite.
