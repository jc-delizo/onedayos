# Implementation Note: Organization and Shared Records UX Retrofit

## Decision

Organization remains a built-in Org Admin app. Shared Records remain shared data surfaces that enabled apps can reference.

Records are not an app, and Organization is not a business module.

## Organization

- Organization appears in the app switcher only for Org Admin users.
- Organization routes require verified organization context and Org Admin permission.
- Organization sidebar is limited to People, Branches & Departments, and Settings.
- People represents platform users plus shared Employee records, while preserving the rule that User is not Employee.
- Employee can exist without login access.
- Organization Settings only shows supported organization preferences.
- Organization Settings does not include theme builders, white-labeling, module enablement, permissions editing, secrets, or raw JSON editing.

## Shared Records

- Shared Records are organization-wide business identities used by enabled apps.
- Direct Records routes keep the authenticated app shell and app switcher visible.
- Records landing presents Products, Categories, Customers, Suppliers, and Warehouses.
- People administration belongs under Organization / People for this MVP.
- Compatibility Employee record routes may remain, but they should guide users back to Organization / People.
- Product, ProductCategory, Supplier, and Warehouse remain shared identities consumed by Inventory, not Inventory-owned records.
- Customer remains a shared identity for future customer-facing workflows; CRM is not implemented.
- Supplier remains a shared identity for future procurement workflows; Purchasing is not implemented.

## Page Patterns

- Organization landing uses `AppPage`.
- Organization People and Branches & Departments use `ListPage`.
- Organization Settings uses `SettingsPage`.
- Records landing uses `AppPage`.
- Shared record list pages use `ListPage`.
- Shared record create/edit pages use `FormPage`.

## Validation

`src/platform/organization/UX-CONFORMANCE.md` and `src/business-objects/UX-CONFORMANCE.md` record implementation conformance and pending human validation.

Automated checks are structural regression gates only. They do not replace representative-user validation, browser keyboard testing, screen-reader checks, or formal accessibility review.
