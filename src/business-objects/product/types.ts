import type { Product, ProductCategory } from '@prisma/client'
import type {
  CreateProductCategoryInput,
  CreateProductInput,
  UpdateProductCategoryInput,
  UpdateProductInput,
} from './schema'

export type ProductRecord = Product
export type ProductCategoryRecord = ProductCategory
export type {
  CreateProductCategoryInput,
  CreateProductInput,
  UpdateProductCategoryInput,
  UpdateProductInput,
}
