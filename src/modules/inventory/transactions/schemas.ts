import { z } from 'zod'

export const INVENTORY_TRANSACTION_TYPES = ['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT'] as const
export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number]

const id = z.string().trim().min(1).max(191)
const optionalText = (max: number) => z.string().trim().min(1).max(max).optional()
const decimalText = z.union([z.string(), z.number().finite()]).transform(String)
  .pipe(z.string().regex(/^(?:0|[1-9]\d{0,13})(?:\.\d{1,4})?$/, 'Use a non-negative decimal with at most four places.'))
const positiveQuantity = decimalText.refine((value) => Number(value) > 0, 'Quantity must be greater than zero.')
const lineBase = {
  productId: id,
  unit: z.string().trim().min(1).max(50),
  notes: optionalText(500),
}

const positiveLine = z.strictObject({ ...lineBase, quantity: positiveQuantity })
const adjustmentLine = z.strictObject({ ...lineBase, countedQuantity: decimalText })
const referenceDate = z.string().date().superRefine((value, ctx) => {
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const maximum = tomorrow.toISOString().slice(0, 10)
  if (value > maximum) ctx.addIssue({ code: 'custom', message: 'Reference date cannot be later than tomorrow in UTC.' })
})

function lines<T extends z.ZodTypeAny>(line: T) {
  return z.array(line).min(1).max(100).superRefine((items, ctx) => {
    const seen = new Set<string>()
    items.forEach((value, index) => {
      const item = value as { productId: string }
      if (seen.has(item.productId)) {
        ctx.addIssue({ code: 'custom', path: [index, 'productId'], message: 'A product may appear only once.' })
      }
      seen.add(item.productId)
    })
  })
}

const common = {
  referenceNumber: optionalText(100),
  referenceDate: referenceDate.optional(),
  notes: optionalText(1000),
}

export const receiptCreateSchema = z.strictObject({
  ...common,
  warehouseId: id,
  supplierId: id.optional(),
  lines: lines(positiveLine),
})

export const issueCreateSchema = z.strictObject({
  ...common,
  warehouseId: id,
  customerId: id.optional(),
  lines: lines(positiveLine),
})

export const transferCreateSchema = z.strictObject({
  ...common,
  sourceWarehouseId: id,
  destinationWarehouseId: id,
  lines: lines(positiveLine),
}).refine((value) => value.sourceWarehouseId !== value.destinationWarehouseId, {
  path: ['destinationWarehouseId'],
  message: 'Destination warehouse must differ from source warehouse.',
})

export const adjustmentCreateSchema = z.strictObject({
  ...common,
  warehouseId: id,
  reason: z.string().trim().min(1).max(500),
  lines: lines(adjustmentLine),
})

export const reversalCreateSchema = z.strictObject({
  reason: z.string().trim().min(1).max(500),
})

export const transactionIdParamsSchema = z.strictObject({ id })

export const transactionQuerySchema = z.strictObject({
  type: z.enum(INVENTORY_TRANSACTION_TYPES).optional(),
  status: z.enum(['POSTED', 'REVERSED']).optional(),
  warehouseId: id.optional(),
  supplierId: id.optional(),
  customerId: id.optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(['postedAt', 'referenceDate', 'transactionNumber']).default('postedAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  path: ['to'],
  message: 'The end date must not be earlier than the start date.',
})

export type ReceiptCreateInput = z.infer<typeof receiptCreateSchema>
export type IssueCreateInput = z.infer<typeof issueCreateSchema>
export type TransferCreateInput = z.infer<typeof transferCreateSchema>
export type AdjustmentCreateInput = z.infer<typeof adjustmentCreateSchema>
export type ReversalCreateInput = z.infer<typeof reversalCreateSchema>
export type TransactionQuery = z.infer<typeof transactionQuerySchema>
export type PostInput = ReceiptCreateInput | IssueCreateInput | TransferCreateInput | AdjustmentCreateInput
