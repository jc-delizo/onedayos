import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFiles(dir: string): string {
  return readdirSync(dir)
    .flatMap((entry) => {
      const absolute = join(dir, entry)
      if (statSync(absolute).isDirectory()) {
        return entry === '__tests__' ? [] : readFiles(absolute)
      }
      return absolute.endsWith('.ts') || absolute.endsWith('.tsx') ? readFileSync(absolute, 'utf8') : ''
    })
    .join('\n')
}

describe('inventory architecture', () => {
  it('keeps module files behind SDK boundaries', () => {
    const source = readFiles(join(process.cwd(), 'src/modules/inventory'))
    const tenantKey = 'org' + 'Id'

    for (const pattern of [
      'sdk.getDb(' + tenantKey + ')',
      'getDb(' + tenantKey + ')',
      'body.' + tenantKey,
      'input.' + tenantKey,
      "searchParams.get('" + tenantKey + "')",
      '/api/' + '[module]',
      '/api/' + 'inventory',
      'framer' + '-motion',
      'Fast' + 'API',
      "from '@/" + 'kernel/',
      "from '@prisma/" + "client'",
      "from '@/" + 'modules/',
    ]) {
      expect(source).not.toContain(pattern)
    }
  })

  it('does not duplicate shared Product, Warehouse, or Supplier identities', () => {
    const source = readFiles(join(process.cwd(), 'src/modules/inventory'))

    expect(source).not.toMatch(/\bInventoryProduct\b/)
    expect(source).not.toMatch(/\bInventoryWarehouse\b/)
    expect(source).not.toMatch(/\bInventorySupplier\b/)
    expect(source).not.toMatch(/\bmodel\s+(Product|Warehouse|Supplier)\b/)
    expect(source).toContain('InventoryProductExtension')
    expect(source).toContain('StockBalance')
    expect(source).toContain('StockMovement')
    expect(source).toContain('StockAdjustment')
  })

  it('does not expose unscoped Inventory routes', () => {
    expect(existsSync(join(process.cwd(), 'src/app/api/inventory/route.ts'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'src/app/api/[module]/route.ts'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'src/app/api/orgs/[orgSlug]/inventory/dashboard/route.ts'))).toBe(true)
  })
})
