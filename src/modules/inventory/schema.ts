import { z } from 'zod'

const decimalInputSchema = z.preprocess(
  (value) => (typeof value === 'number' ? String(value) : value),
  z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,4})?$/, 'Use a non-negative decimal with up to four decimal places.'),
)

const optionalIdSchema = z.string().trim().min(1).optional()

export const inventoryRouteIdSchema = z.strictObject({
  id: z.string().trim().min(1),
})

const pagedQuerySchema = z.strictObject({
  q: z.string().trim().max(120).transform((value) => value.replace(/\s+/g, ' ')).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  direction: z.enum(['asc', 'desc']).optional(),
})

const legacyPagedQuerySchema = z.strictObject({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export const productSettingListQuerySchema = pagedQuerySchema.extend({
  productId: optionalIdSchema,
  sort: z.enum(['product', 'reorderPoint']).optional(),
})

export const upsertProductSettingSchema = z.strictObject({
  productId: z.string().trim().min(1),
  reorderPoint: decimalInputSchema.default('0'),
  isStockTracked: z.boolean().default(true),
})

export const updateProductSettingSchema = z.strictObject({
  reorderPoint: decimalInputSchema.default('0'),
  isStockTracked: z.boolean().default(true),
})

export const stockLevelQuerySchema = pagedQuerySchema.extend({
  productId: optionalIdSchema,
  warehouseId: optionalIdSchema,
  sort: z.enum(['product', 'warehouse', 'quantity']).optional(),
})

export const stockMovementQuerySchema = pagedQuerySchema.extend({
  productId: optionalIdSchema,
  warehouseId: optionalIdSchema,
  type: z
    .enum(['opening_balance', 'adjustment_in', 'adjustment_out', 'manual_in', 'manual_out'])
    .optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sort: z.enum(['occurredAt', 'product', 'quantity']).optional(),
})

export const stockAdjustmentQuerySchema = pagedQuerySchema.extend({
  productId: optionalIdSchema,
  warehouseId: optionalIdSchema,
  status: z.enum(['posted']).optional(),
  sort: z.enum(['createdAt', 'product', 'quantity']).optional(),
})

export const createStockAdjustmentSchema = z.strictObject({
  productId: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  quantityAfter: decimalInputSchema,
  reason: z.string().trim().min(2).max(200),
  notes: z.string().trim().max(1000).optional(),
})

export const stockAdjustmentPrefillSchema = z.strictObject({
  productId: optionalIdSchema,
  warehouseId: optionalIdSchema,
})

export type ProductSettingListQuery = z.infer<typeof productSettingListQuerySchema>
export type InventoryRouteId = z.infer<typeof inventoryRouteIdSchema>
export type UpsertProductSettingInput = z.infer<typeof upsertProductSettingSchema>
export type UpdateProductSettingInput = z.infer<typeof updateProductSettingSchema>
export type StockLevelQuery = z.infer<typeof stockLevelQuerySchema>
export type StockMovementQuery = z.infer<typeof stockMovementQuerySchema>
export type StockAdjustmentQuery = z.infer<typeof stockAdjustmentQuerySchema>
export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>
export type StockAdjustmentPrefill = z.infer<typeof stockAdjustmentPrefillSchema>
