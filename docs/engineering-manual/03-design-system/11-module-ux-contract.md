# OneDayOS Engineering Manual — 03 Design System / 11 Module UX Contract

Document ID: `03-design-system/11-module-ux-contract.md`  
Version: 1.0  
Status: Frozen  
Implementation Allowed: Governance authority — implementation requires an approved package  
Depends On: `03-design-system/09-ux-constitution.md`

---

# 1. Purpose

The Module UX Contract is the required usability contract for every official OneDayOS business module.

It must be completed before coding a module. It explains who the module serves, what work it supports, what it owns, what it borrows from shared Business Objects, and how users should understand the workflow.

---

# 2. Required Fields

Each module spec must include a `UX Contract` section with:

1. Primary Users.
2. User Goals.
3. Primary Tasks.
4. Task Frequency.
5. Work Environment.
6. Required Knowledge.
7. Related Business Objects.
8. Module-Owned Records.
9. Critical Errors to Prevent.
10. Permission Roles.
11. App Navigation.
12. Page Map.
13. Default Landing Page.
14. Process Flow.
15. Loading States.
16. Empty States.
17. Error and Recovery States.
18. Permission-Denied State.
19. Module-Unavailable State.
20. Keyboard Workflows.
21. Accessibility Requirements.
22. Usability Test Scenarios.
23. Known MVP Limitations.
24. Future Integrations.
25. Required UX tests and review evidence.

If any field is not applicable, the spec must say why.

---

# 3. Process Flow Requirement

Every official business module must include a declarative Process Flow definition and a Process Flow page unless an accepted ADR grants an exception.

The Process Flow definition and page must explain:

- What the module owns.
- What it does not own.
- Normal workflow steps.
- Inputs.
- Outputs.
- Transaction or posting behavior where relevant.
- Critical error prevention.
- Current MVP boundaries.
- Future integrations.

Process Flow is educational and declarative. It does not imply:

- Workflow Engine.
- Automation engine.
- Approval Service.
- Dynamic Forms.
- Background jobs.
- AI orchestration.
- Notification Service.
- Any deferred Platform Service.

---

# 4. UX Contract Review Gate

A module cannot move from specification to implementation until:

- The UX Contract is complete.
- The main process flow is described.
- Shared Business Object ownership is clear.
- Page patterns are selected.
- Critical user mistakes are listed.
- Required tests and manual review evidence are defined.

Implementation may not fill in UX intent after the fact.

---

# 5. Example: Inventory UX Contract

This example is illustrative and must stay aligned with the Inventory module spec.

## Target Users and Roles

- Org Admin.
- Warehouse or operations staff with Inventory access.

## Required Knowledge

- Product and Warehouse are shared Records.
- Inventory owns stock behavior only.

## Permission Roles

- Users need Inventory read permissions for overview and list pages.
- Users need stock-adjustment create permission to post adjustments.

## Default Landing Page

- Inventory Dashboard.

## Primary Jobs

- Understand current stock by Product and Warehouse.
- Configure inventory tracking settings for shared Products.
- Post opening balances or manual corrections.
- Review stock movement history.
- Identify low-stock items.

## Work Environment and Frequency

Inventory work is operational and repeated. Users need compact tables, clear quantities, fast navigation, and strong prevention of cross-tenant or wrong-product mistakes.

## Main Process Flow

1. Shared Products and Warehouses are created in Records.
2. Inventory adds product-specific tracking settings.
3. A user posts a Stock Adjustment.
4. The service transaction creates the adjustment, movement, and balance update.
5. Stock Levels show current balance.
6. Stock Movements show the ledger.
7. Low-stock status is derived from quantity versus reorder point.

## Known MVP Limitations and Future Integrations

- No purchasing receipt integration.
- No sales outbound posting.
- No approval workflow.
- No Notification Service.
- No AI orchestration.

## Page Inventory

- Inventory Dashboard: Module Dashboard Pattern.
- Process Flow: Process Flow Pattern.
- Product Settings: List / Table Pattern.
- Stock Levels: List / Table Pattern.
- Stock Movements: List / Table Pattern.
- Stock Adjustments: List / Table Pattern.
- New Adjustment: Create / Edit Form Pattern.

## Mistakes to Prevent

- Adjusting stock for a Product from another organization.
- Adjusting stock for a Warehouse from another organization.
- Submitting `orgId` from the client.
- Creating negative stock where not allowed.
- Editing ledger movements as normal records.
- Treating Product or Warehouse as Inventory-owned identity.

## Ownership Boundaries

Inventory owns stock behavior:

- InventoryProductExtension.
- StockBalance.
- StockMovement.
- StockAdjustment.

Inventory does not own:

- Product.
- ProductCategory.
- Warehouse.
- Supplier.
- Customer.
- Employee.

## Required UX Tests

- Process Flow explains ownership boundaries.
- New Adjustment form contains no hidden `orgId`.
- Product and Warehouse links go to shared Records.
- Stock Levels show low-stock state from real data.
- Loading and error states match page context.
- Sidebar keeps Inventory and Related Records clear.

---

# 6. Final Rule

A module UX Contract is not decoration. It is the product contract that prevents generated code from becoming generic CRUD.
