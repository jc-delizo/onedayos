# V2-4 Acceptance Report

## Status

Founder Visual Direction Accepted
Data-Consistency Hardening Complete
Founder Package Acceptance Pending

## Dependency

Exact stable `recharts@3.10.0` is installed behind a small OneDayOS chart layer. Node 24, React 19, Next.js 16, and TypeScript 6 compatibility were audited. Clean-install peer-tree and all required advisory gates must remain clean.

## Dashboard V2

The Inventory Dashboard preserves its compact operational header and New Adjustment action. It presents four real KPIs, unique-Product Stock Health, a 30-day Inbound versus Outbound adjustment trend, Product positions by Warehouse, Recent Movements, and Recent Adjustments.

No percentage delta, comparative trend, or demo array is fabricated.

## Chart Data Correctness

- All aggregate reads are fresh, tenant-scoped, permission-enforced, and soft-delete-aware.
- Stock Health uses exclusive Product categories that reconcile to Tracked Products.
- Out-of-stock Products include tracked Products without a balance.
- Movement dates are 30 continuous UTC calendar dates including the current UTC date.
- Only the implemented opening-balance/adjustment vocabulary is mapped.
- Unsupported future movement types fail rather than undercount.
- Warehouse charts use Product × Warehouse positions because quantities use mixed units.
- Every active Warehouse is represented; there is no silent Top N policy.
- A 50,000-candidate preflight and post-read guard fails safely rather than returning partial analytics.

## Frozen Metric Semantics

- Tracked Products: unique active, non-deleted Products with an active, non-deleted, stock-tracked Inventory extension.
- Warehouses with Stock: unique active, non-deleted Warehouses with at least one positive balance for a tracked Product.
- Product-level Out of Stock: aggregate quantity across active Warehouses is at or below zero, including no-balance Products.
- Product-level Low Stock: aggregate quantity is above zero and at or below the Product reorder point.
- Product-level In Stock: aggregate quantity is above the reorder point.
- Warehouse positions: one existing tracked Product balance in one active Warehouse. A Product can appear once in each Warehouse, so position totals do not reconcile to the unique Product KPI.

The enforced invariant is:

```text
In Stock + Low Stock + Out of Stock = Tracked Products
```

## Chart Accessibility

Each chart has a semantic title and description, explicit legend labels, values with units, contextual empty state, and a semantic text/table equivalent. Marker treatment supplements color. Animation is disabled and reduced-motion behavior remains intact.

Automated checks do not establish formal WCAG conformance.

## Process Flow Diagram V2

The shared renderer derives a horizontal/branched desktop diagram and stacked narrow-screen diagram from `inventoryProcessFlow.connections`. Local SVG arrows are decorative; a visible ordered list provides the semantic sequence and full details.

The diagram communicates the transaction branch to Stock Balance and Movement Ledger and the Movement Ledger path to Low-Stock Detection. It contains no API, mutation, automation, or tenant input.

## Current and Planned Truthfulness

Implemented-now content includes Shared Records, Inventory Tracking Settings, Stock Adjustment, Transactional Posting, Stock Balance, Movement Ledger, and Low-Stock Detection.

Receipts, Issues, and Transfers are isolated in a planned panel labeled as not implemented in the current demo. Purchasing, Sales, and Notifications are described only as future integration directions. Approvals and accounting are not implied.

## Visual Review

The original V2-4 visual direction was accepted. The data-consistency production review on July 24, 2026 covered:

- Org Admin Dashboard and Process Flow in Light and Dark;
- Warehouse Operator Dashboard and Process Flow;
- System appearance persistence and live Dark resolution;
- 390 × 844 chart stacking and vertical Process Flow;
- populated chart geometry, explicit Product/position units, legends, tooltips, summaries, and overflow;
- the planned/current distinction.

All reviewed routes rendered without horizontal page overflow. The Stock Health, populated Movement Trend, and Warehouse Stock Positions charts rendered persisted canonical data, and the mobile charts stacked without clipping. Visible summaries and tooltips used the same values and explicit units. The Process Flow remained unchanged and rendered its current branch, visible semantic fallback, and separate planned panel without presenting planned work as active.

Screenshots remain private under `/tmp/v2-4-acceptance-*.png`.

## Findings

- The reported `17 in stock / 94%` was a unique organization-wide Product result from 18 scale-test Products.
- The reported `18 tracked / 3 low` was Main Warehouse Product-position data, not the unique Product KPI. The chart copy had not made that different unit explicit.
- Scale-test drift left 18 active Products, 4 active Warehouses, 27 balances, and 126 movements in the configured demo organization even though the canonical readiness contract expected 3 Products.
- The empty trend was caused by stale persisted dates: the newest movement was May 14, while the correct inclusive window on July 24 is June 25 through July 24.
- Guarded reset now produces exactly 3 active Products, 1 active Warehouse, 3 balances, 9 internally consistent adjustments, and 9 corresponding movements.
- Canonical activity contains three opening balances, three positive adjustments, and three negative adjustments across recent UTC dates. Final balances remain 120 bottles, 35 bottles, and 8 bags.
- Exact active tracked Product/balance/movement aggregation remains application-memory work and grows with tenant data up to the temporary guard.
- An earlier Supabase Auth inspection returned `403 bad_jwt` without any repository credential change. The authoritative final `npm run demo:check` rerun passed the admin-key check, both Auth users, and all controlled-demo records, so this is not a current blocker.

## Blockers, Must-Fix, and Polish

- Blockers: none identified by the final automated, dependency, reset, demo-readiness, or controlled visual gates.
- Must-Fix: none identified by automated gates.
- Polish: Founder visual acceptance, independent keyboard/screen-reader review, and representative-user validation remain pending.

## V2-5 Readiness

V2-4 acceptance hardening, automated gates, dependency audits, idempotent guarded reset, demo readiness, and controlled visual evidence pass. The implementation is ready for explicit Founder package acceptance.

V2-5 remains blocked pending explicit Founder approval. Website asset production remains paused.
