export type LegacyOrganization = {
  id: string
}

export type LegacyProduct = {
  id: string
  orgId: string
  unit: string
  isActive: boolean
  deletedAt: Date | null
}

export type LegacyWarehouse = {
  id: string
  orgId: string
  isActive: boolean
  deletedAt: Date | null
}

export type LegacyUser = {
  id: string
  orgId: string
  isActive: boolean
  deletedAt: Date | null
}

export type LegacyStockAdjustment = {
  id: string
  orgId: string
  productId: string
  warehouseId: string
  quantityBefore: string
  quantityAfter: string
  quantityDelta: string
  reason: string
  notes: string | null
  status: string
  createdBy: string
  createdAt: Date
  deletedAt: Date | null
  deletedBy: string | null
}

export type LegacyStockMovement = {
  id: string
  orgId: string
  productId: string
  warehouseId: string
  type: string
  quantityDelta: string
  resultingQuantity: string | null
  sourceType: string | null
  sourceId: string | null
  createdBy: string
  occurredAt: Date
}

export type LegacyStockBalance = {
  orgId: string
  productId: string
  warehouseId: string
  quantity: string
}

export type BackfillInput = {
  organizations: LegacyOrganization[]
  products: LegacyProduct[]
  warehouses: LegacyWarehouse[]
  users: LegacyUser[]
  adjustments: LegacyStockAdjustment[]
  movements: LegacyStockMovement[]
  balances: LegacyStockBalance[]
}

export type BackfillIssue = {
  severity: 'invalid' | 'warning'
  code: string
  orgRef: string
  adjustmentRef?: string
  movementRef?: string
}

export type BackfillMapping = {
  orgRef: string
  adjustmentRef: string
  transactionId: string
  transactionNumber: string
  lineId: string
  movementId: string
  lineQuantity: string
  unit: string
  postedAt: string
  referenceDate: null
}

export type BackfillOrganizationSummary = {
  orgRef: string
  validCount: number
  invalidCount: number
  warningCount: number
}

export type BackfillPreflightReport = {
  mode: 'read-only-preflight'
  validCount: number
  invalidCount: number
  warningCount: number
  organizations: BackfillOrganizationSummary[]
  issues: BackfillIssue[]
  mappings: BackfillMapping[]
}
