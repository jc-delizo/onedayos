import type { ProcessFlowDefinition } from '@/sdk'

export const inventoryProcessFlow = {
  title: 'Inventory Process Flow',
  description:
    'How shared records, stock settings, adjustments, balances, and movement ledgers work together in OneDayOS.',
  steps: [
    {
      id: 'shared-records-setup',
      number: 1,
      title: 'Shared Records',
      description:
        'Products and Warehouses are created as shared Records before Inventory references them.',
      inputs: ['Shared Product records', 'Shared Warehouse records'],
      outputs: ['Reusable Product and Warehouse identities'],
      warning: 'Inventory does not own Product, ProductCategory, Warehouse, or Supplier identity.',
      status: 'current',
    },
    {
      id: 'inventory-product-settings',
      number: 2,
      title: 'Inventory Tracking Settings',
      description:
        'Inventory extends shared Products with stock tracking and reorder point settings stored in InventoryProductExtension.',
      inputs: ['Shared Product', 'Stock tracking setting', 'Reorder point'],
      outputs: ['InventoryProductExtension for the shared Product'],
      warning: 'Inventory settings must not duplicate Product code, name, unit, category, or Supplier identity.',
      status: 'current',
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
      status: 'current',
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
      status: 'current',
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
      status: 'current',
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
      status: 'current',
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
      status: 'current',
    },
  ],
  connections: [
    { from: 'shared-records-setup', to: 'inventory-product-settings' },
    { from: 'inventory-product-settings', to: 'stock-adjustment' },
    { from: 'stock-adjustment', to: 'transactional-posting' },
    { from: 'transactional-posting', to: 'stock-balance', label: 'updates together' },
    { from: 'transactional-posting', to: 'stock-movement-ledger', label: 'appends together' },
    { from: 'stock-movement-ledger', to: 'low-stock-detection' },
  ],
  plannedLabel: 'Planned for Inventory V2 — not implemented in the current demo',
  plannedSteps: [
    {
      id: 'planned-receipts',
      title: 'Receipts',
      description: 'Planned inbound stock workflow referencing a shared Supplier and destination Warehouse.',
      status: 'planned',
    },
    {
      id: 'planned-issues',
      title: 'Issues',
      description: 'Planned outbound stock workflow with an optional shared Customer reference.',
      status: 'planned',
    },
    {
      id: 'planned-transfers',
      title: 'Transfers',
      description: 'Planned paired movement between source and destination Warehouses.',
      status: 'planned',
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
    'Inventory does not yet implement Receipts, Issues, Transfers, purchasing, sales, approvals, notifications, accounting, or background jobs.',
  ],
  futureIntegrations: [
    'Purchasing may later provide source documents for approved Receipt workflows.',
    'Sales or fulfillment may later provide source documents for approved Issue workflows.',
    'Notifications may later subscribe to low-stock events.',
    'These are future integration directions, not active modules or current demo behavior.',
  ],
} as const satisfies ProcessFlowDefinition
