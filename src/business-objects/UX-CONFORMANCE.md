# Shared Records UX Conformance

## V2-5 Bounded Export

- Founder accepted the controlled V2-5 bounded export package on 2026-07-24; public-demo and production approval are not implied.
- Eligible Shared Records use the common server-only export adapter with resource-specific permissions and explicit safe columns.
- Platform User/auth identity is excluded. Employee export omits the linked auth identifier.
- Export UI is absent without explicit permission; URL table state and selection remain intact.

## Status

Implementation Conformance Complete  
Role-Based UX Validation Preparation Complete  
Founder Warehouse Proxy Walkthrough Complete  
Representative-User Validation Pending

This file records implementation evidence for shared Business Object Records. It does not approve public demo claims, formal accessibility claims, or representative-user validation.

## Scope

Shared Records is a built-in, permission-aware app for shared business identity surfaces. It is not a business module and is not controlled by `OrgModule`.

Implemented shared Records surfaces:

- `/[orgSlug]/records`
- `/[orgSlug]/records/products`
- `/[orgSlug]/records/product-categories`
- `/[orgSlug]/records/customers`
- `/[orgSlug]/records/suppliers`
- `/[orgSlug]/records/warehouses`
- compatibility Employee record routes under `/[orgSlug]/records/employees`
- Inventory-context routes under `/[orgSlug]/inventory/related/[area]`, including reusable full-page create/edit fallbacks

## Conformance Evidence

- The Records landing uses `AppPage` and explains that shared Records are organization-wide identities used by enabled apps.
- Shared record list pages use `ListPage`.
- Shared record create/edit pages use `FormPage`.
- Record forms do not render hidden `orgId` fields.
- Record forms submit to org-scoped APIs and do not include client-supplied tenant identity.
- Product, ProductCategory, Supplier, and Warehouse wording keeps Inventory as a consumer, not owner.
- Customer wording does not imply CRM is implemented.
- Supplier wording does not imply Purchasing is implemented.
- Employees are not promoted on the Records landing; primary People administration lives in Organization / People.
- The persistent app shell remains available on direct Records routes so users can return to Inventory or Organization through the app switcher.
- Shared Records appears in the app switcher only when at least one Product, Category, Customer, Supplier, or Warehouse read permission is granted.
- Direct `/records/**` routes use the Shared Records sidebar; People and Inventory transactions are absent.
- Inventory-context routes retain the Inventory app and sidebar while reusing the same presenters, services, APIs, validation, permissions, tables, and forms.
- Routine list and form pages use the compact operational header.

## Shared Record Ownership Boundaries

Inventory may reference:

- Product
- ProductCategory
- Customer
- Supplier
- Warehouse

Inventory does not own those identities.

Future modules may reference shared Records after Founder approval, but they must not duplicate Product, Customer, Supplier, Warehouse, or Employee identities.

## Explicit Non-Scope

- Records are not a module.
- Records do not contain Inventory-specific reorder points, stock quantities, stock balances, or movement ledgers.
- Records do not contain CRM lifecycle or pipeline behavior.
- Records do not contain Purchasing payment terms, approvals, ratings, or procurement workflow.
- Records do not contain payroll, attendance, onboarding, leave, or HRIS workflow.

## Automated Checks

Expected regression coverage:

- `npm run check:ux`
- `npm run test:a11y`
- source-contract tests for shared Records page-pattern usage
- shared record form tests for hidden tenant identity and org-scoped API submission
- tenant shell navigation tests proving Records routes keep app-switcher access to Inventory
- role-based Warehouse Operator checks for read-only shared Product, Category, Supplier, and Warehouse access

## Pending Human Validation

- Representative operations user walkthrough of Product and Warehouse Records from Inventory context.
- Representative Org Admin walkthrough of shared Records vs Organization People.
- Keyboard-only walkthrough in a real browser.
- Screen-reader spot check in a real browser.
- Confirmation that users understand Shared Records as a built-in app for shared identities, not a business module.

## V2-1 Evidence

V2-1 implemented the Shared Records built-in app, permission-aware app/sidebar visibility, direct Shared Records current-app detection, and Inventory-context related-record routes. Automated evidence covers navigation resolution, shared presenter reuse, tenant-safe permission enforcement, compact headers, and contextual ownership wording.

Manual Founder visual review of the completed V2-1 implementation remains pending until recorded. Public-demo approval and website-asset approval remain pending; website asset production remains paused.

Founder Warehouse User proxy walkthrough is completed with no blocker or must-fix findings reported. This does not claim representative-user validation has occurred.

## V2-2 Data Table Evidence

- Products, Product Categories, Customers, Suppliers, and Warehouses use Data Table V2 server mode with strict page-specific query schemas and exact tenant-scoped counts.
- Search, sorting, pagination, page-scoped selection, column visibility, and explicit row actions share one semantic table implementation.
- Update permission routes rows to canonical edit pages; read-only permission routes rows to canonical full-page detail pages.
- Shared Records and Inventory-context routes reuse the same permission-safe presenters and table adapter.
- Collection APIs use strict page-specific query schemas and additive pagination metadata through exact tenant-scoped counts.
- Active-state filters remain page-specific. Product category names are loaded as a relation for the current Product page rather than through an unbounded category fetch. Customer and Supplier wording still does not imply CRM or Purchasing.
- Shared Records and Inventory-context routes reuse the same server presenters; scale tests prove exact Product totals and search beyond row 100 with 155 fixtures.

No modal, export, Dynamic CRUD, schema, or ownership change was introduced. Manual visual review does not constitute representative-user or formal accessibility approval.

## V2-3 URL-Addressable Modal Evidence

- Products, Product Categories, Customers, Suppliers, and Warehouses support create/view/edit dialogs in Shared Records and Inventory context.
- Canonical full-page routes remain direct-navigation and refresh fallbacks.
- Read-only users receive view surfaces; update and create remain server-permission enforced.
- Product Inventory settings remain a distinct Inventory-owned extension and mutation boundary.
- No export, Dynamic CRUD, schema, or Business Object ownership change was introduced.

## Approval Result

Controlled Founder/Prospect Guided Demo Approved: Yes, for guided sandbox walkthroughs after controlled demo gates pass for the session.  
Public Demo Approval: Pending.  
Production Readiness: Not implied.  
Representative-User Validation: Pending.  
Formal Accessibility Claim: Pending formal review.
