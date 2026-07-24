# Implementation Note — V2-3 URL-Addressable Modals

## Status

Code and Automated Gates Complete
Founder Visual Acceptance Pending

## Dependency and Security

The implementation uses exact `@radix-ui/react-dialog@1.1.21`. React 19 peers, Node 24, Next 16.2.11, TypeScript 6, the complete npm tree, and production/full audit thresholds pass. The PostCSS and `find-my-way` advisories were remediated before modal work resumed.

## Architecture

The organization layout renders an `@modal` parallel slot beside canonical page content. `(.)` intercepted routes handle soft navigation for Inventory and Shared Records. Direct requests and refreshes continue to resolve the existing canonical full-page routes.

Intercepted routes contain authentication/context composition and reuse the canonical Inventory and Shared Record presenters. No business service/API logic is duplicated inside intercepted pages.

## Route Modal Contract

`RouteModal` owns Radix portal/dialog composition, overlay, accessible title/description, focus containment, responsive sizing, close navigation, dirty-state coordination, and discard confirmation. It does not own authentication, permissions, data access, validation schemas, tenant identity, or mutations.

Desktop uses a compact centered dialog with bounded height and internal scrolling. Small screens use the full viewport without a separate sheet dependency.

Clean close uses browser Back with a canonical `closeHref` fallback. Back/Forward therefore retains canonical URL behavior and list query state. Successful modal mutations clear dirty state, refresh server data, and close only after API success.

## Unsaved Changes

Record and Adjustment forms mark modal state dirty on change. Close button, Escape, overlay interaction, refresh/tab close, and browser Back are guarded. A same-dialog confirmation offers Continue Editing or Discard Changes without a nested modal/focus trap.

## Product Inventory Tracking

Product detail/edit surfaces contain a separated Inventory Tracking section when `inventory.product_setting.read` is allowed. Identity edits continue through the Business Object API. Tracking/reorder edits continue through `/inventory/product-settings/[id]` and require `inventory.product_setting.update`. Neither permission implies the other.

The `/inventory/product-settings` compatibility page remains a direct fallback but is not restored to top-level Inventory navigation.

## Targets

- New Stock Adjustment with validated Product/Warehouse prefill
- Stock Level, immutable Stock Movement, and posted Stock Adjustment views
- Product, Product Category, Customer, Supplier, and Warehouse create/view/edit
- the same shared entities in Inventory context

## Tests and Checks

Coverage includes route-slot/canonical architecture, presenter reuse, dialog labeling, close behavior, dirty discard behavior, opaque Supabase admin-key support, axe validation, Data Table regressions, permission/service suites, and `check:ux` structural contracts.

Automated accessibility evidence is not a formal WCAG claim. Independent keyboard, screen-reader, and representative-user validation remain acceptance work.

## Visual Review

The final Node 24 production build passed controlled review for both personas, direct fallback, Back/Forward, dirty discard, Light/Dark/System, and a 390 × 844 full-screen modal. Screenshots remain private under `/tmp/v2-3-*.png`.

## Explicit Non-Goals

No charts, Recharts, export, ExcelJS, schema/migration, Inventory V2 transaction, caching, accent preset, website asset, new module, Platform Service, broad Radix migration, or new modal library was added.

V2-4 remains blocked. Website asset production remains paused.
