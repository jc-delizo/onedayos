# V2-1 Acceptance Report

## Status

Code and Automated Gates Complete
Codex Authenticated Visual Review Complete
Founder Visual Acceptance Recorded by Prompt 36
Dependency Security Remediation Complete

Date reviewed: 2026-07-23

## Latest Build Runtime

- The prior listener was `next start`, PID `1305887`, started 2026-07-19 from this repository.
- It predated the 2026-07-23 V2-1 build and was stopped cleanly.
- The current tree was rebuilt successfully.
- Prompt 35 stopped the prior acceptance listener before changing dependencies.
- Latest runtime: Next `16.2.11` via `next start`, PID `713393`, `http://localhost:1320`.
- Final build ID `MryyOvKK2Z2fL9Xdx0bET` was verified before the post-remediation authenticated browser review.
- `/login` returned HTTP 200; unauthenticated `/onedayosdemo/apps` redirected to `/login`.
- The latest production server remains running on port 1320.

## Automated Gates

- `npm run check:all`: passed on the acceptance tree, with 47 files / 278 tests, 2 accessibility files / 13 tests, and a successful production build.
- `npm run build`: passed before both the initial and final authenticated reviews.
- `npm run demo:check`: passed; controlled-demo posture remains intact.
- TypeScript, lint, UX, architecture, generated-template, environment, Prisma, and whitespace checks passed.
- Prompt 35 repeated the full matrix under Node `24.18.0` / npm `11.16.0` after a clean `npm ci`; all results remained green.

## Authenticated Visual Review

Existing Google Chrome was driven through the DevTools protocol at a consistent 1440 × 900 viewport. No browser dependency was installed. Separate browser profiles authenticated using the controlled-demo Org Admin and Warehouse Operator accounts without printing credentials, cookies, tokens, or session values.

Org Admin:

- App Launcher showed Inventory, Shared Records, and Organization exactly once.
- Inventory, direct Shared Records, and Organization routes loaded with the expected data and context.
- The app switcher remained present and contained the three expected apps.

Warehouse Operator:

- App Launcher showed Inventory and Shared Records.
- Organization was absent from the launcher and app switcher.
- Direct Organization / People access failed safely with a 404.
- Products and Warehouses were read-only: no create/edit mutation actions were rendered.
- Inventory Tracking Settings was readable but exposed no update form or mutation control.

This is Codex review evidence, not Founder approval or independent representative-user validation.

## Compact Header Review

- Inventory Dashboard, contextual record lists, direct Shared Records pages, Stock Levels, Inventory Tracking Settings, and Organization People rendered `data-page-header-mode="compact"`.
- Each reviewed operational page exposed exactly one visible `h1`.
- Breadcrumbs communicated the current app and page.
- Primary actions aligned on the title row at the desktop viewport.
- Routine description blocks did not consume oversized header space.

## Shared Records App Review

- Direct `/onedayosdemo/records/**` routes selected Shared Records.
- Sidebar contained Products, Categories, Customers, Suppliers, and Warehouses.
- People and Inventory transactions were absent.
- Pages used compact headers and organization-wide ownership wording.
- Shared Records appeared from verified record-read permissions, not `OrgModule`.

## Context-Preserving Related Records Review

Products, Categories, Suppliers, Customers, and Warehouses loaded through `/onedayosdemo/inventory/related/[area]`.

- Inventory stayed selected.
- Inventory sidebar stayed visible.
- Breadcrumbs used `Inventory / Related Records / ...`.
- Product, Category, Supplier, Customer, and Warehouse ownership remained shared.
- Supplier copy did not claim Purchasing exists.
- Customer copy did not claim CRM or Inventory V2 issues exist.
- The contextual pages reused the shared list presenters and service/API paths verified by source tests and inspection.

## Product Settings Compatibility Review

- Product Settings was absent from top-level Inventory navigation.
- Stock Levels exposed `Manage tracking settings`.
- Contextual Products exposed `Inventory settings`.
- `/onedayosdemo/inventory/product-settings` loaded as `Inventory Tracking Settings`.
- The compatibility page linked back to Stock Levels and Inventory Products without a redirect loop.
- Org Admin and Warehouse views reflected current permissions; no data, API, service, or `InventoryProductExtension` functionality was removed.

## Role/Permission Review

- Org Admin: Inventory, Shared Records, Organization.
- Warehouse Operator: Inventory and Shared Records; Organization denied.
- Warehouse Customers was absent because that persona lacks Customer read permission.
- Warehouse Product/Warehouse mutation controls were absent.
- Product Settings update remains protected by the existing server permission checks and tests.
- Shared presenters use verified `PlatformContext`; no client-supplied or hidden `orgId` was introduced.
- Direct unauthorized routes fail safely.

## Light/Dark/System Review

The appearance menu was exercised in the authenticated Org Admin runtime:

- Light selected, stored, and persisted after reload.
- Dark selected, stored, and persisted after reload.
- System selected, stored, resolved to the headless browser's light preference, and persisted after reload.
- Inventory Dashboard remained legible in Light and Dark.
- Selected sidebar states, compact headers, brand orange, app switcher, and profile/appearance controls remained legible.

## Screenshots

All screenshots are local review evidence in `/tmp` and are not committed or approved for website use:

- `/tmp/v2-1-org-admin-app-launcher-light.png`
- `/tmp/v2-1-warehouse-app-launcher-light.png`
- `/tmp/v2-1-inventory-dashboard-compact-light.png`
- `/tmp/v2-1-inventory-dashboard-compact-dark.png`
- `/tmp/v2-1-process-flow-explanatory.png`
- `/tmp/v2-1-inventory-context-products.png`
- `/tmp/v2-1-shared-records-products.png`
- `/tmp/v2-1-shared-records-app.png`
- `/tmp/v2-1-product-settings-contextual-access.png`
- `/tmp/v2-1-organization-people.png`

Additional local review evidence:

- `/tmp/v2-1-founder-review-montage.png`
- `/tmp/v2-1-admin-browser-review.json`
- `/tmp/v2-1-warehouse-browser-review.json`

## Dependency Remediation Result

See `DEPENDENCY-AUDIT-TRIAGE-2026-07.md` and `DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`.

- The before-state full audit contained 8 package entries — 4 high and 4 moderate — representing fourteen GHSA records.
- Next and matching lint config are now `16.2.11`; sharp resolves to `0.35.3`; all PostCSS copies are patched.
- The coherent Prisma family is now `7.9.0`; Hono is absent, while `fast-uri@3.1.4` and `brace-expansion@1.1.16` are patched.
- Full and production audits now report zero advisories.
- Production moderate, full high, and full moderate acceptance thresholds pass.
- Clean install, dependency-tree integrity, Prisma compatibility, full gates, production smoke, and two-role authenticated regression all pass.

## Findings

- No V2-1 visual, IA, theme, or permission regression requiring a code fix was found.
- The freshly built production server is now proven to be the process reviewed on port 1320.
- The separately approved dependency security remediation is complete; no application or schema fix was required.

## Blockers

- Founder has not yet approved the screenshots or live V2-1 surfaces.
- The dependency-security blocker is cleared.
- V2-2 remains blocked solely on explicit Founder V2-1 visual acceptance and authorization of the next package.

## Must-Fix Items

- No dependency-security must-fix item remains from the Prompt 34 triage.
- Obtain explicit Founder visual acceptance before authorizing V2-2.

## Polish Items

- Independent representative-user validation remains pending.
- Formal keyboard-only, screen-reader, and WCAG review remain pending.
- The Product Settings compatibility route remains intentionally temporary pending an approved later package.

## Founder Approval Required

The Founder must:

1. Review the screenshots or live pages.
2. Accept or request V2-1 visual changes.
3. Explicitly authorize any later V2 package only after acceptance.

## V2-2 Readiness

Prompt 36 records the Founder’s acceptance of the V2-1 visual and information-architecture result and explicitly authorizes V2-2 Data Table V2 only. V2-3 and all later packages remain blocked. Website asset production remains paused.
