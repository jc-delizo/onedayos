import type { ModuleAiContext } from '@/sdk'

export const inventoryAiContext = {
  description: 'Inventory tracks quantities of shared Products stored in shared Warehouses.',
  businessPurpose:
    'Help operators know what products are tracked, where stock is stored, how much is on hand, and why stock changed.',
  commonQuestions: [],
  supportedActions: [
    'Explain stock balances as current operational state.',
    'Explain stock movements as immutable ledger entries.',
    'Explain stock adjustments as posted manual corrections.',
  ],
  forbiddenActions: [
    'Do not treat Inventory as the owner of Product, Warehouse, or Supplier identity.',
    'Do not expose tenant data outside the verified organization.',
    'Do not perform valuation, purchasing, sales, approval, notification, or AI actions in the MVP.',
  ],
} satisfies ModuleAiContext
