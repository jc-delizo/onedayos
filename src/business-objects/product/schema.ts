import { z } from 'zod'
import { listQuerySchema, optionalText, requiredText } from '../shared/schema'

export const productListQuerySchema = listQuerySchema
export const productCategoryListQuerySchema = listQuerySchema

export const createProductSchema = z.strictObject({
  code: requiredText(80),
  name: requiredText(180),
  description: optionalText(600),
  categoryId: optionalText(128),
  unit: optionalText(40),
  isActive: z.boolean().optional(),
})

export const updateProductSchema = createProductSchema.partial().refine(
  (input) => Object.values(input).some((value) => value !== undefined),
  { message: 'At least one field is required.' },
)

export const createProductCategorySchema = z.strictObject({
  name: requiredText(160),
  parentId: optionalText(128),
})

export const updateProductCategorySchema = createProductCategorySchema.partial().refine(
  (input) => Object.values(input).some((value) => value !== undefined),
  { message: 'At least one field is required.' },
)

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>
