import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd(), 'src/app/[orgSlug]')

describe('V2-3 intercepted route architecture', () => {
  it('keeps the parallel slot default and canonical full-page fallbacks', () => {
    expect(readFileSync(join(root, '@modal/default.tsx'), 'utf8')).toContain('return null')
    for (const path of [
      'inventory/stock-adjustments/new/page.tsx',
      'inventory/stock-levels/[id]/page.tsx',
      'inventory/stock-movements/[id]/page.tsx',
      'inventory/stock-adjustments/[id]/page.tsx',
      'records/[area]/[id]/page.tsx',
      'inventory/related/[area]/[id]/page.tsx',
    ]) expect(existsSync(join(root, path))).toBe(true)
  })

  it('reuses canonical presenters without importing business services in intercepted pages', () => {
    const interceptRoot = join(root, '@modal')
    for (const path of [
      '(.)inventory/stock-adjustments/new/page.tsx',
      '(.)inventory/stock-levels/[id]/page.tsx',
      '(.)inventory/stock-movements/[id]/page.tsx',
      '(.)inventory/stock-adjustments/[id]/page.tsx',
      '(.)records/[area]/[id]/page.tsx',
      '(.)records/[area]/[id]/edit/page.tsx',
      '(.)records/[area]/new/page.tsx',
    ]) {
      const source = readFileSync(join(interceptRoot, path), 'utf8')
      expect(source).toContain('Presenter')
      expect(source).not.toMatch(/InventoryService|ProductService|CustomerService|SupplierService|WarehouseService/)
    }
  })
})
