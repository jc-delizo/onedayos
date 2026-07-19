import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { inventoryUx } from '../ux'

const requiredUxFields = [
  'primaryUsers',
  'userGoals',
  'primaryTasks',
  'taskFrequency',
  'workEnvironment',
  'requiredKnowledge',
  'relatedBusinessObjects',
  'moduleOwnedRecords',
  'criticalErrorsToPrevent',
  'permissionRoles',
  'appNavigation',
  'pageMap',
  'defaultLandingPage',
  'processFlowRoute',
  'keyboardWorkflows',
  'accessibilityRequirements',
  'usabilityTestScenarios',
  'knownMvpLimitations',
  'futureIntegrations',
] as const

describe('inventory UX contract', () => {
  it('exports a populated ModuleUxContract without placeholders', () => {
    for (const field of requiredUxFields) {
      const value = inventoryUx[field]

      expect(value).toBeDefined()
      if (Array.isArray(value)) {
        expect(value.length).toBeGreaterThan(0)
      } else {
        expect(value).toEqual(expect.any(String))
      }
    }

    expect(JSON.stringify(inventoryUx)).not.toContain('TODO(UX)')
  })

  it('declares the correct landing and Process Flow routes', () => {
    expect(inventoryUx.defaultLandingPage).toBe('/[orgSlug]/inventory')
    expect(inventoryUx.processFlowRoute).toBe('/[orgSlug]/inventory/process-flow')
  })

  it('keeps related Business Objects separate from Inventory-owned records', () => {
    expect(inventoryUx.relatedBusinessObjects).toEqual(['Product', 'ProductCategory', 'Supplier', 'Warehouse'])
    expect(inventoryUx.moduleOwnedRecords).toEqual([
      'InventoryProductExtension',
      'StockBalance',
      'StockMovement',
      'StockAdjustment',
    ])

    for (const related of inventoryUx.relatedBusinessObjects) {
      expect(inventoryUx.moduleOwnedRecords).not.toContain(related)
    }
  })

  it('names critical Inventory errors without claiming deferred features are implemented', () => {
    const criticalErrors = inventoryUx.criticalErrorsToPrevent.join(' ')
    const limitations = inventoryUx.knownMvpLimitations.join(' ')

    expect(criticalErrors).toMatch(/wrong Warehouse/i)
    expect(criticalErrors).toMatch(/outside the current organization/i)
    expect(criticalErrors).toMatch(/below zero/i)
    expect(criticalErrors).toMatch(/Partially creating/i)
    expect(limitations).toMatch(/No purchasing receipt integration/i)
    expect(limitations).toMatch(/No notifications/i)
    expect(limitations).not.toMatch(/implemented/i)
  })

  it('contains no tenant identity or server-only imports', () => {
    const source = readFileSync(join(process.cwd(), 'src/modules/inventory/ux.ts'), 'utf8')
    const tenantKey = 'org' + 'Id'

    expect(source).toContain('satisfies ModuleUxContract')
    expect(source).not.toContain(tenantKey)
    expect(source).not.toContain('@/sdk/server')
    expect(source).not.toContain('@/kernel/')
    expect(source).not.toContain('@prisma/client')
    expect(source).not.toContain('react')
  })

  it('records honest UX conformance status without certification or public demo claims', () => {
    const source = readFileSync(join(process.cwd(), 'src/modules/inventory/UX-CONFORMANCE.md'), 'utf8')

    expect(source).toContain('Implementation Conformance Complete')
    expect(source).toContain('Human Validation Pending')
    expect(source).toContain('Controlled Founder/Prospect Guided Demo Approved')
    expect(source).toContain('Public Demo Approval: Pending')
    expect(source).not.toMatch(/certified/i)
    expect(source).not.toContain('Public Demo Approved')
  })
})
