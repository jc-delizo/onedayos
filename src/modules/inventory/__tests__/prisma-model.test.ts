import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function modelBlock(schema: string, model: string): string {
  const match = schema.match(new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`))
  return match?.[0] ?? ''
}

describe('inventory Prisma model shape', () => {
  const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8')

  it('adds only Inventory-owned module models', () => {
    for (const model of ['InventoryProductExtension', 'StockBalance', 'StockMovement', 'StockAdjustment']) {
      expect(schema).toContain(`model ${model}`)
    }

    for (const forbidden of ['InventoryProduct ', 'InventoryWarehouse ', 'InventorySupplier ']) {
      expect(schema).not.toContain(`model ${forbidden}`)
    }
  })

  it('keeps Inventory extension fields out of shared Product and Warehouse identity', () => {
    const product = modelBlock(schema, 'Product')
    const warehouse = modelBlock(schema, 'Warehouse')
    const extension = modelBlock(schema, 'InventoryProductExtension')

    expect(product).not.toContain('reorderPoint')
    expect(product).not.toContain('quantity')
    expect(product).not.toContain('warehouseId')
    expect(warehouse).not.toContain('quantity')
    expect(extension).toContain('productId')
    expect(extension).toContain('reorderPoint')
    expect(extension).not.toContain('code')
    expect(extension).not.toContain('name')
    expect(extension).not.toContain('warehouseId')
  })
})
