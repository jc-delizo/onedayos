# Inventory UX Conformance

## V2-5 Bounded Export

- Founder accepted the controlled V2-5 bounded export package on 2026-07-24; public-demo and production approval are not implied.
- Stock Levels, Movements, and Adjustments expose CSV/XLSX only when the verified user has both read and explicit export permission.
- Export remains tenant-scoped, filter/sort aware, column-allowlisted, formula-safe, and synchronously bounded.
- The Warehouse Operator profile is unchanged and has no Export control.
- Automated export and accessibility checks are regression evidence, not formal WCAG or public-demo approval.

## Status

Implementation Conformance Complete  
Role-Based UX Validation Preparation Complete  
Founder Controlled Walkthroughs Complete  
Human Validation Pending

## Standards Targeted

- Aligned with ISO 9241-210
- Aligned with ISO 9241-110
- Reviewed using Nielsen's usability heuristics
- Targets WCAG 2.2 Level AA

This file records OneDayOS product evidence. It does not claim ISO certification, WCAG certification, or third-party accessibility certification.

## UX Contract

Inventory now has a production-shaped `inventoryUx` contract in `src/modules/inventory/ux.ts`.

The contract documents:

- primary users and goals
- critical Inventory tasks
- related shared Business Objects
- Inventory-owned records
- critical errors to prevent
- permission profiles
- app navigation and page map
- keyboard and accessibility expectations
- usability scenarios
- MVP limitations and future integrations

## Automated Structural Checks

Completed in this package:

- Inventory UX contract source tests
- Inventory Process Flow source tests
- Inventory page-pattern source tests
- `npm run check:ux`
- existing architecture checker
- existing generated-template checker
- existing TypeScript, lint, build, env, and Prisma checks

V2-1 adds structural coverage for compact/explanatory page-header modes, permission-derived Shared Records app visibility, Inventory-context Related Records routes, shared presenter reuse, and Product Settings navigation compatibility.

## Automated Accessibility Checks

Completed for selected surfaces in Automated UX and Accessibility Gates Package 5.

Current automated coverage includes:

- shared page patterns scanned with `axe-core`
- shared empty, error, permission denied, and module unavailable states scanned with `axe-core`
- Inventory Process Flow through shared `ProcessFlowPage`
- representative Inventory Stock Levels table markup
- Inventory Stock Adjustment form component
- profile menu and Appearance options through the shared app shell

These checks are useful regression gates, but they do not prove full WCAG 2.2 Level AA conformance.

## Runtime Appearance Evidence

Runtime Appearance Package 6C verified browser-local Light / Dark / System behavior through automated provider tests and browser screenshots.

Inventory-specific appearance evidence captured:

- Stock Levels in Dark mode with real demo data
- Process Flow in Light mode
- System mode root attribute resolution on the shared login surface

This is implementation evidence only. It does not replace representative-user validation or formal accessibility review.

## Manual Accessibility Review

Pending formal review.

Implementation expectations covered by code and tests include visible focus through shared primitives, semantic tables, labeled form controls, text-based low-stock status, safe errors, and Process Flow readability without color-only meaning.

## Founder Walkthrough

Iterative Founder product reviews have already identified and driven fixes for shell/sidebar navigation, app launcher behavior, profile menu behavior, generic loading states, app switcher polish, and Process Flow clarity.

This package records those learnings in Inventory's UX contract and shared Process Flow implementation.

Controlled Founder walkthrough records:

- Founder Org Admin walkthrough: Completed
- Founder Warehouse User proxy walkthrough: Completed
- Blocker findings: None reported
- Must-Fix findings: None reported
- Scores: Not scored

These walkthroughs support controlled guided demo use only. They do not claim independent representative-user validation, independent Org Admin validation, formal WCAG conformance, or public demo approval.

## Representative Operational User Walkthrough

Pending.

A warehouse or operations user still needs to complete a task-based walkthrough covering stock-level review, low-stock interpretation, adjustment posting, and ledger review.

Package 8 prepared a sandbox Warehouse Operator persona and review script for this walkthrough. Completion is still pending because the prepared persona is a Founder proxy account, not representative-user validation.

## Representative Org Admin Walkthrough

Pending.

A non-Founder Org Admin still needs to complete a task-based walkthrough covering Inventory access, contextual Inventory Tracking Settings, Process Flow comprehension, and navigation between Inventory and Shared Records.

Package 8 prepared Org Admin and Warehouse proxy review scorecards. No independent Org Admin validation is claimed.

## Critical Tasks

- Find current quantity for a Product in a Warehouse.
- Identify why a Product is low stock.
- Post a safe manual Stock Adjustment.
- Verify the related StockMovement ledger entry.
- Understand that Product, ProductCategory, Customer, Supplier, and Warehouse are shared Records.
- Return from shared Records back to Inventory through the app shell.
- Understand MVP boundaries through Process Flow.
- Recover from validation and permission errors without technical details.

## Findings

- No unresolved critical implementation conformance finding is recorded in this package.
- Formal representative-user evidence is still missing.
- Full manual accessibility evidence is still missing.
- Founder controlled walkthroughs reported no blocker or must-fix findings.
- Independent representative-user, independent Org Admin, and formal accessibility validation remain pending.

## Resolutions

- Added Inventory UX contract.
- Extracted reusable declarative Inventory Process Flow.
- Refactored Inventory pages toward shared page patterns.
- Preserved Inventory shell, security, tenant, permission, and service behavior.
- Added tests for UX contract, Process Flow, and page-pattern integration.
- Added automated structural UX gate coverage.
- Added selected automated accessibility gate coverage.
- Prepared role-based UX validation guide, scorecards, accessibility checklist, and findings log.
- Added compact operational headers while preserving the explanatory Process Flow header.
- Moved Inventory Related Records to Inventory-context URLs backed by shared presenters and services.
- Removed Product Settings from top-level navigation while preserving `/inventory/product-settings` as a contextual compatibility surface.

## V2-1 Evidence

V2-1 automated evidence covers compact semantic page headers, explanatory Process Flow preservation, Inventory-context Products/Categories/Customers/Suppliers/Warehouses, permission-aware Shared Records app visibility, contextual Inventory settings access, and unchanged Light/Dark/System behavior.

Manual Founder visual review of the completed V2-1 implementation remains pending until recorded. Public-demo approval and website-asset approval remain pending; website asset production remains paused.

## V2-2 Data Table Evidence

- Stock Levels, Stock Movements, and Stock Adjustments use the shared `DataTableV2` contract.
- Inventory list query schemas strictly allowlist search, filters, sorting, direction, and bounded pagination; `orgId` and unknown keys are rejected.
- Inventory APIs return additive `page`, `pageSize`, `total`, and `totalPages` metadata with exact database counts.
- Stock Status remains visible as text, but its filter is removed because exact related-field pagination requires the V2-6 query-layer decision. `status` and `lowStockOnly` URL keys are rejected.
- Inventory Tracking Settings and all Inventory operational lists use server mode with exact matching counts; no tenant list is fully downloaded for browser filtering.
- Scale regression coverage proves truthful totals, pages, search, and warehouse filtering with 155 Stock Levels.
- Stock rows are pointer- and keyboard-openable, while selection and action controls do not activate the row.
- Stock Levels exposes `Adjust Stock` only with adjustment-create permission and passes only validated Product/Warehouse prefill. Quantity remains server-calculated and server-validated.
- Movement and posted-adjustment details are read-only canonical full pages. No modal, export, chart, or Inventory transaction work was introduced.
- Automated component, query-schema, service/API, accessibility, structural UX, and full-gate evidence is recorded in the V2-2 implementation note.

Manual production-browser review is implementation evidence only. Representative-user validation and formal accessibility review remain pending.

## Manual Accessibility Checklist

Unchecked items remain required before public accessibility or public demo claims:

- [ ] Full keyboard-only walkthrough for Inventory Dashboard, Process Flow, Stock Levels, Stock Adjustments, and New Adjustment.
- [ ] Screen-reader spot check for Inventory navigation, Process Flow, Stock Levels, and New Adjustment.
- [ ] Browser-level accessibility scan outside jsdom.
- [ ] Representative warehouse user walkthrough.
- [ ] Independent Org Admin walkthrough.
- [x] Founder Warehouse proxy review.
- [x] Founder Org Admin review.
- [ ] Validation that focus order and visible focus remain acceptable in the sandbox browser.
- [ ] Validation that low-stock and warning states are understandable without relying on color.
- [ ] Formal WCAG conformance assessment, if a formal claim is ever needed.

## Deferred Issues

## V2-4 Dashboard and Process Flow Evidence

- The Dashboard uses exact service-backed KPIs and serializable chart DTOs; it does not derive totals from paginated table rows.
- Stock Health counts unique tracked Products organization-wide. Categories are exclusive, textual, backed by an accessible data summary, and enforced to sum to the Tracked Products KPI.
- The 30-day Movement trend uses exactly 30 UTC calendar dates including the current UTC date and only current opening-balance/adjustment vocabulary.
- Guarded reset persists nine internally consistent recent adjustments/movements for the three canonical Products, so the controlled trend is useful without fake presenter data.
- Warehouse comparison explicitly uses Product × Warehouse positions because Product quantities use mixed units. It does not claim that position totals reconcile to the unique Product KPI.
- A 50,000 combined-candidate preflight and post-read guard returns no partial analytics and exposes a safe, accessible recovery message when exact application-memory processing is not supported.
- Recharts is isolated to the client chart presenter; the shared chart wrapper has no tenant, permission, service, API, or caching concerns.
- Light and Dark semantic chart tokens, labeled legends, unit-bearing tooltips, contextual states, and summary tables are covered by structural/component/axe checks.
- Process Flow derives visual arrows and branches from the canonical declarative connection graph.
- The visible ordered fallback communicates current sequence without relying on arrows, layout, or color.
- Receipts, Issues, and Transfers are explicitly labeled planned and not implemented; Purchasing, Sales, and Notifications remain future integrations only.
- No export, schema/migration, Inventory V2 transaction, caching, accent, asset, module, diagram-engine, or Platform Service scope was added.

Founder accepted the V2-4 visual direction. Explicit Founder package acceptance, independent screen-reader/keyboard validation, and representative-user validation remain pending. V2-5 remains blocked and website asset production remains paused.

## V2-3 URL-Addressable Modal Evidence

- New Adjustment, Stock Level, Stock Movement, and posted Stock Adjustment have URL-addressable dialogs with canonical full-page fallbacks.
- Product Inventory Tracking appears as a separately permissioned/API-separated section on shared Product surfaces; Inventory does not own Product identity.
- Modal dirty-state, focus, responsive layout, direct fallback, and close/refresh behavior have automated structural/accessibility coverage. Founder visual and independent accessibility validation remain pending.

- Formal keyboard-only review.
- Screen-reader spot check.
- Representative warehouse user walkthrough.
- Representative Org Admin walkthrough.
- Independent V2-1 Founder visual review.

## Approval Result

Controlled Founder/Prospect Guided Demo Approved: Yes, for guided sandbox walkthroughs after `npm run demo:reset`, `npm run demo:check`, and `npm run check:all` pass for the session.  
Public Demo Approval: Pending.
Production Readiness: Not implied.  
Independent Representative-User Validation: Pending.  
Formal Accessibility Conformance: Not claimed.
