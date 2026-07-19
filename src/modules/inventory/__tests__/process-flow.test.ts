import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { inventoryProcessFlow } from '../process-flow'

const expectedStepIds = [
  'shared-records-setup',
  'inventory-product-settings',
  'stock-adjustment',
  'transactional-posting',
  'stock-balance',
  'stock-movement-ledger',
  'low-stock-detection',
  'future-integrations',
] as const

describe('inventory Process Flow definition', () => {
  it('exports all required steps in logical order with stable IDs', () => {
    expect(inventoryProcessFlow.steps.map((step) => step.id)).toEqual(expectedStepIds)
    expect(new Set(inventoryProcessFlow.steps.map((step) => step.id)).size).toBe(expectedStepIds.length)

    inventoryProcessFlow.steps.forEach((step, index) => {
      expect(step.number).toBe(index + 1)
      expect(step.title).toEqual(expect.any(String))
      expect(step.description).toEqual(expect.any(String))
    })
  })

  it('explains server validation, transactional posting, and negative-stock prevention', () => {
    const stockAdjustment = inventoryProcessFlow.steps.find((step) => step.id === 'stock-adjustment')
    const transactionalPosting = inventoryProcessFlow.steps.find((step) => step.id === 'transactional-posting')
    const text = JSON.stringify([stockAdjustment, transactionalPosting])

    expect(text).toMatch(/server validates Product and Warehouse ownership/i)
    expect(text).toMatch(/computes previous and new quantities/i)
    expect(text).toMatch(/prevents negative resulting stock/i)
    expect(text).toMatch(/StockAdjustment/i)
    expect(text).toMatch(/StockMovement/i)
    expect(text).toMatch(/StockBalance/i)
    expect(text).toMatch(/transaction/i)
  })

  it('describes StockMovement as append-only ledger and low-stock as quantity versus reorder point', () => {
    const movement = inventoryProcessFlow.steps.find((step) => step.id === 'stock-movement-ledger')
    const lowStock = inventoryProcessFlow.steps.find((step) => step.id === 'low-stock-detection')

    expect(JSON.stringify(movement)).toMatch(/append-only ledger/i)
    expect(JSON.stringify(lowStock)).toMatch(/current quantity/i)
    expect(JSON.stringify(lowStock)).toMatch(/reorder point/i)
    expect(JSON.stringify(lowStock)).toMatch(/No Notification Service exists/i)
  })

  it('declares correct ownership boundaries and deferred integrations', () => {
    expect(inventoryProcessFlow.owns).toEqual([
      'InventoryProductExtension',
      'StockBalance',
      'StockMovement',
      'StockAdjustment',
    ])
    expect(inventoryProcessFlow.doesNotOwn).toEqual([
      'Product',
      'ProductCategory',
      'Supplier',
      'Warehouse',
      'Customer',
      'Employee',
    ])
    expect(inventoryProcessFlow.futureIntegrations?.join(' ')).toMatch(/Purchasing receipts can later/i)
    expect(inventoryProcessFlow.futureIntegrations?.join(' ')).toMatch(/Notification Service can later/i)
  })

  it('contains no tenant identity, server imports, API calls, Prisma, or executable workflow logic', () => {
    const source = readFileSync(join(process.cwd(), 'src/modules/inventory/process-flow.ts'), 'utf8')
    const tenantKey = 'org' + 'Id'

    expect(source).toContain('satisfies ProcessFlowDefinition')
    expect(source).not.toContain(tenantKey)
    expect(source).not.toContain('@/sdk/server')
    expect(source).not.toContain('@/kernel/')
    expect(source).not.toContain('@prisma/client')
    expect(source).not.toContain('fetch(')
    expect(source).not.toContain('Workflow Engine')
    expect(source).not.toContain('Dynamic Forms')
    expect(source).not.toContain('runtime AI')
  })
})
