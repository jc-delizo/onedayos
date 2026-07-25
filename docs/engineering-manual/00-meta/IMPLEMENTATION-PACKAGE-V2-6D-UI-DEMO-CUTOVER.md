# Implementation Package — V2-6D UI, Demo, and Cutover

Status: Blocked
Implementation Allowed: No

## Dependency

Requires Founder acceptance of V2-6B and V2-6C, including sandbox schema/backfill and disabled posting-engine evidence, followed by explicit V2-6D authorization.

## Scope After Authorization

- frozen sidebar and type-specific transaction pages;
- Data Table V2 lists and bounded V2-5 exports;
- URL-addressable create/detail/reverse modals with full-page fallback;
- compact headers, permission-aware actions, read-only posted/reversed details;
- dashboard movement mapping and Process Flow cutover;
- guarded canonical demo additions and exact balances;
- feature enablement/cutover, complete acceptance and controlled-demo review.

## Authority

Accepted ADR-0021, Frozen V2-6 documents, Founder Decision/Freeze reports, accepted V2-6B/C artifacts, V2-2 through V2-5 component/UX/export contracts, accessibility/security/demo authorities.

## Allowed Files After Authorization

- Inventory pages, intercepted routes, presenters, forms, navigation, process flow, and tests;
- Inventory Data Table/export resource integration and API export routes;
- dashboard aggregation/presentation updates and tests;
- guarded sandbox demo reset/provision/readiness files and tests;
- V2-6D implementation/acceptance documentation.

## Forbidden

- unapproved schema/migration/service contract redesign;
- legacy StockAdjustment cleanup;
- public self-service demo or production claim;
- unguarded/shared-environment data mutation;
- export grant to Warehouse Operator;
- Purchase/Sales Orders, accounting, approvals, notifications, Outbox, background jobs, caching, accents, website assets, dependencies, module, or Platform Service work.

## Safety Gates and Tests

- permission-aware sidebar and actions for Org Admin, Warehouse Operator, and denied users;
- strict form semantics, line accessibility, mobile, Light/Dark/System;
- intercepted modal/direct page parity, refresh, Back/Forward, focus and dirty-state behavior;
- posted/reversed immutability and reversal confirmation;
- exact Dashboard mapping without transfer double-counting;
- Process Flow stays Planned until final acceptance;
- bounded CSV/XLSX permissions, limits, safe fields/cells/filenames;
- guarded organization-scoped reset with Secondary Warehouse, Demo Customer, Receipt, Issue, Transfer, Adjustment;
- final Water `120/10`, Tea `35/5`, Coffee `5/3`, Coffee organization total `8`;
- full reconciliation, quality, security, accessibility, build, migration, rollback, and controlled-demo gates.

## Rollback

Disable the feature and restore prior navigation/presenters while preserving canonical transactions, links, movements, and balances. Do not delete posted demo facts outside the separately guarded reset. Forward-fix schema/data issues.

## Exit Criteria

- complete UI/API/service/schema/migration/export/demo matrix passes;
- exact canonical balances and movement chains reconcile;
- Process Flow becomes Current only in the final accepted cutover;
- Founder accepts V2-6;
- public demo and production remain separately gated.

## Next Package

V2-7 and V2-8 remain blocked. Legacy StockAdjustment cleanup requires a later separately approved package.
