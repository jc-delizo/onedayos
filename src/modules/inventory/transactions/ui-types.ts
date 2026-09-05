import type { InventoryTransactionType } from './schemas'

export type InventoryTransactionOption = {
  id: string
  label: string
  unit?: string
}

export type InventoryTransactionFormOptions = {
  products: InventoryTransactionOption[]
  warehouses: InventoryTransactionOption[]
  suppliers: InventoryTransactionOption[]
  customers: InventoryTransactionOption[]
}

export type InventoryTransactionLineDto = {
  id: string
  productId: string
  quantity: string
  unit: string
  lineNumber: number
  notes?: string | null
  product?: { id: string; code: string; name: string; unit: string | null }
}

export type InventoryTransactionDto = {
  id: string
  type: InventoryTransactionType
  status: 'POSTED' | 'REVERSED'
  transactionNumber: string
  referenceNumber?: string | null
  referenceDate?: string | null
  reason?: string | null
  notes?: string | null
  postedAt: string
  postedBy?: { id: string; name: string }
  warehouse?: { id: string; code: string; name: string } | null
  sourceWarehouse?: { id: string; code: string; name: string } | null
  destinationWarehouse?: { id: string; code: string; name: string } | null
  supplier?: { id: string; name: string } | null
  customer?: { id: string; name: string } | null
  reversal?: { id: string; transactionNumber: string } | null
  reversalOf?: { id: string; transactionNumber: string } | null
  lines: InventoryTransactionLineDto[]
}
