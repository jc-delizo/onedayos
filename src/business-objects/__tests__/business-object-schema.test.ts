import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCustomerSchema } from '../customer'
import { createEmployeeSchema } from '../employee'
import { createProductCategorySchema, createProductSchema } from '../product'
import { createSupplierSchema } from '../supplier'
import { createWarehouseSchema } from '../warehouse'

const schemaSource = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8')
const serviceSources = [
  'src/business-objects/employee/service.ts',
  'src/business-objects/product/service.ts',
  'src/business-objects/customer/service.ts',
  'src/business-objects/supplier/service.ts',
  'src/business-objects/warehouse/service.ts',
  'src/business-objects/shared/service-factory.ts',
].map((file) => readFileSync(join(process.cwd(), file), 'utf8')).join('\n')

function modelBlock(model: string): string {
  const start = schemaSource.indexOf(`model ${model} `)
  return schemaSource.slice(start, schemaSource.indexOf('\n}', start))
}

describe('Business Object schema', () => {
  it('adds only the approved shared Business Object Prisma models', () => {
    for (const model of ['Employee', 'Product', 'ProductCategory', 'Customer', 'Supplier', 'Warehouse']) {
      expect(schemaSource).toContain(`model ${model} `)
    }

    for (const forbiddenModel of ['InventoryProduct', 'CRMCustomer', 'LeaveEmployee', 'HREmployee', 'PurchasingSupplier']) {
      expect(schemaSource).not.toContain(`model ${forbiddenModel} `)
    }
  })

  it('keeps Business Objects tenant-scoped and soft-delete capable', () => {
    for (const table of ['Employee', 'Product', 'ProductCategory', 'Customer', 'Supplier', 'Warehouse']) {
      const block = schemaSource.slice(schemaSource.indexOf(`model ${table} `), schemaSource.indexOf('\n}', schemaSource.indexOf(`model ${table} `)))

      expect(block).toContain('orgId')
      expect(block).toContain('deletedAt')
      expect(block).toContain('deletedBy')
      expect(block).toContain('@@unique([id, orgId])')
    }

    const productBlock = modelBlock('Product')
    const customerBlock = modelBlock('Customer')
    const supplierBlock = modelBlock('Supplier')

    expect(schemaSource).toMatch(/userId\s+String\?\s+@unique/)
    expect(productBlock).not.toContain('stockQuantity')
    expect(productBlock).not.toContain('reorderPoint')
    expect(customerBlock).not.toContain('leadStatus')
    expect(supplierBlock).not.toContain('paymentTerms')
  })

  it('uses strict schemas that reject client-supplied tenant identity and unknown keys', () => {
    const cases = [
      createEmployeeSchema.safeParse({ employeeNo: 'E-1', name: 'Ada', orgId: 'org_a' }),
      createProductSchema.safeParse({ code: 'SKU-1', name: 'Cable', orgId: 'org_a' }),
      createProductCategorySchema.safeParse({ name: 'Materials', orgId: 'org_a' }),
      createCustomerSchema.safeParse({ name: 'Acme', orgId: 'org_a' }),
      createSupplierSchema.safeParse({ name: 'Source Co', orgId: 'org_a' }),
      createWarehouseSchema.safeParse({ code: 'MAIN', name: 'Main Warehouse', orgId: 'org_a' }),
      createCustomerSchema.safeParse({ name: 'Acme', unknown: 'not allowed' }),
    ]

    for (const result of cases) {
      expect(result.success).toBe(false)
    }
  })

  it('keeps Employee distinct from User and allows employee records without login', () => {
    const result = createEmployeeSchema.safeParse({ employeeNo: 'E-2', name: 'No Login Employee' })

    expect(result.success).toBe(true)
    expect(createEmployeeSchema.safeParse({ employeeNo: 'E-2', name: 'A', userId: 'user_a' }).success).toBe(false)
  })

  it('does not use hard delete service calls for Business Objects', () => {
    expect(serviceSources).not.toMatch(/\.\s*delete\s*\(/)
    expect(serviceSources).not.toMatch(/\.\s*deleteMany\s*\(/)
  })
})
