import type { ProcessFlowDefinition } from '@/sdk'

export const inventoryProcessFlow = {
  title: 'Inventory Process Flow',
  description:
    'How shared records, stock settings, adjustments, balances, and movement ledgers work together in OneDayOS.',
  steps: [
    {
      id: 'shared-records-setup',
      number: 1,
      title: 'Shared Records Setup',
      description:
        'Products, categories, suppliers, and warehouses are created as shared Records before Inventory uses them.',
      inputs: ['Shared Product records', 'Shared Warehouse records', 'Optional shared Supplier records'],
      outputs: ['Reusable business identities that Inventory can reference'],
      warning: 'Inventory does not own Product, ProductCategory, Warehouse, or Supplier identity.',
    },
    {
      id: 'inventory-product-settings',
      number: 2,
      title: 'Inventory Product Settings',
      description:
        'Inventory extends shared Products with stock tracking and reorder point settings stored in InventoryProductExtension.',
      inputs: ['Shared Product', 'Stock tracking setting', 'Reorder point'],
      outputs: ['InventoryProductExtension for the shared Product'],
      warning: 'Inventory settings must not duplicate Product code, name, unit, category, or Supplier identity.',
    },
    {
      id: 'stock-adjustment',
      number: 3,
      title: 'Stock Adjustment',
      description:
        'A user posts an opening balance or manual correction. The server validates Product and Warehouse ownership, computes previous and new quantities, and prevents negative resulting stock.',
      inputs: ['Product', 'Warehouse', 'New quantity', 'Reason', 'Optional notes'],
      outputs: ['Validated stock adjustment intent'],
      warning: 'Client-computed previous quantity, new quantity, and balance-after values are not accepted as source of truth.',
    },
    {
      id: 'transactional-posting',
      number: 4,
      title: 'Transactional Posting',
      description:
        'One stock adjustment creates the StockAdjustment, appends a StockMovement, and updates or creates StockBalance together in a transaction.',
      inputs: ['Validated Product and Warehouse', 'Server-computed quantity delta', 'Posting user'],
      outputs: ['StockAdjustment', 'StockMovement', 'StockBalance update or creation'],
      warning: 'If any persistence step fails, no adjustment, movement, balance update, or success event should remain.',
    },
    {
      id: 'stock-balance',
      number: 5,
      title: 'Stock Balance',
      description:
        'StockBalance stores the current quantity by Product and Warehouse. Users read this operational state through Stock Levels.',
      inputs: ['Successful posting transaction'],
      outputs: ['Current quantity by shared Product and Warehouse'],
      warning: 'StockBalance is not directly edited by users.',
    },
    {
      id: 'stock-movement-ledger',
      number: 6,
      title: 'Stock Movement Ledger',
      description:
        'StockMovement is the append-only ledger of Inventory changes. Users read it through Stock Movements for investigation and reconciliation.',
      inputs: ['Successful posting transaction'],
      outputs: ['Immutable stock movement entry with resulting quantity and source reference'],
      warning: 'Movements are not normal editable records in this MVP.',
    },
    {
      id: 'low-stock-detection',
      number: 7,
      title: 'Low-Stock Detection',
      description:
        'Stock Levels compare current quantity with the reorder point from InventoryProductExtension and show low-stock status with text.',
      inputs: ['StockBalance quantity', 'InventoryProductExtension reorder point'],
      outputs: ['Low-stock visual and text status'],
      warning: 'No Notification Service exists in this MVP; low stock is a visible status and event only.',
    },
    {
      id: 'future-integrations',
      number: 8,
      title: 'Future Integrations',
      description:
        'Purchasing, sales, notifications, reporting, import/export, and background automation can connect later through approved packages.',
      inputs: ['Approved future module or Platform Service package'],
      outputs: ['Deferred integration path, not current behavior'],
      warning: 'This Process Flow explains current Inventory behavior and does not implement workflow automation.',
    },
  ],
  owns: [
    'InventoryProductExtension',
    'StockBalance',
    'StockMovement',
    'StockAdjustment',
  ],
  doesNotOwn: [
    'Product',
    'ProductCategory',
    'Supplier',
    'Warehouse',
    'Customer',
    'Employee',
  ],
  currentBoundaries: [
    'Inventory supports manual stock adjustments, current stock levels, product stock settings, movement history, and low-stock visual status.',
    'Inventory does not create or own Product, ProductCategory, Supplier, Warehouse, Customer, or Employee identity.',
    'Inventory does not directly edit StockBalance or StockMovement through normal UI routes.',
    'Inventory does not implement purchasing receipts, sales outbound posting, transfers, approvals, notifications, attachments, comments, reporting, search, or background jobs.',
  ],
  futureIntegrations: [
    'Purchasing receipts can later create inbound StockMovements.',
    'Sales or fulfillment can later create outbound StockMovements.',
    'Notification Service can later subscribe to low-stock events.',
    'Reporting Service can later summarize inventory trends.',
    'Import/Export Engine can later support controlled bulk setup.',
    'Background jobs can be considered only when real volume requires them.',
  ],
} as const satisfies ProcessFlowDefinition
