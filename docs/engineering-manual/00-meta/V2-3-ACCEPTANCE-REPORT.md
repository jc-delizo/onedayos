# V2-3 Acceptance Report

## Status

Code and Automated Gates Complete
Founder Visual Acceptance Pending

## Modal Architecture

An organization-level `@modal` parallel slot uses selective Radix Dialog composition. Soft Next.js navigation resolves `(.)` intercepted routes over the preserved underlying app/list. Direct requests and refreshes resolve canonical full-page routes.

## Targets Implemented

- Inventory: New Adjustment, Stock Level, Stock Movement, posted Stock Adjustment.
- Shared Records: Product, Product Category, Customer, Supplier, and Warehouse create/view/edit.
- Inventory-context Shared Records: the same canonical entity presenters while retaining Inventory context.
- Product Inventory Tracking: separate read/update section and API boundary.

## Direct Fallback Verification

Canonical full-page route files remain for every intercepted target. Intercept routes reuse presenters and contain no direct Business Object or Inventory service logic.

## Browser Navigation Behavior

Clean close and successful mutation use browser Back, with canonical list fallback if no usable intercepted history exists. Underlying search/filter/sort/page state remains in the preserved list URL. Forward navigation can restore the intercepted route.

## Permission Behavior

Update permission produces edit links and server-required edit presenters. Read-only permission produces view links and omits edit controls. Adjustment creation and Product Inventory setting read/update remain separately checked. Organization behavior was not expanded.

## Unsaved Changes

Dirty modal forms guard close button, Escape, overlay, Back, and unload. Continue Editing restores the form; Discard explicitly closes. Mutation success clears dirty state. The History API Back guard remains subject to browser-level navigation behavior; before-unload protection is the refresh/tab-close boundary.

## Accessibility

Radix Dialog supplies modal semantics and focus containment. Dialog title, description, named close control, labeled form fields, responsive semantic content, Escape handling, and discard focus are covered by Testing Library and axe checks. Automated evidence is not formal WCAG conformance.

## Manual Visual Review

Controlled production review passed for:

- Org Admin Stock Level, Adjustment, Product, Category, Customer create, Supplier, and Warehouse dialogs.
- Warehouse Operator Product, Supplier, and Warehouse read-only dialogs; Organization remained unavailable.
- Product Inventory Tracking permission/API separation.
- direct full-page fallback with no dialog wrapper.
- browser Back close and Forward reopen.
- Light, Dark, and System appearance.
- 390 × 844 full-screen mobile layout with reachable close/actions and internal scrolling.
- dirty-form Continue Editing and Discard Changes confirmation.

Evidence is stored locally under `/tmp/v2-3-*.png` and is not approved for publication.

## Findings

- The pre-V2-3 `check:ux` adjustment-form rule assumed `FormPage` lived directly in the page file; it now recognizes the canonical presenter.
- Supabase opaque secret keys require a canonical resolver shared by privileged app and demo tooling; the repaired key and demo gate pass.

## Blockers, Must-Fix, and Polish

- Blockers: none.
- Must-Fix: none.
- Polish: independent screen-reader and representative-user validation remains pending.

## V2-4 Readiness

V2-3 code, automated gates, controlled demo, and visual evidence are complete. Founder acceptance remains required before V2-4, which is blocked pending explicit authorization. Website asset production remains paused.
