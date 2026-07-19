import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const objectRouteRoots = [
  'employees',
  'products',
  'product-categories',
  'customers',
  'suppliers',
  'warehouses',
]

describe('Business Object API routes', () => {
  it('exposes Business Object APIs only under tenant-scoped object routes', () => {
    for (const objectRoute of objectRouteRoots) {
      expect(existsSync(join(process.cwd(), `src/app/api/orgs/[orgSlug]/objects/${objectRoute}/route.ts`))).toBe(true)
      expect(existsSync(join(process.cwd(), `src/app/api/${objectRoute}/route.ts`))).toBe(false)
    }

    expect(existsSync(join(process.cwd(), 'src/app/api/inventory/route.ts'))).toBe(false)
  })

  it('uses API-safe helpers and never redirect-style auth in object routes', () => {
    const routeSource = readFileSync(join(process.cwd(), 'src/business-objects/shared/api-routes.ts'), 'utf8')

    expect(routeSource).toContain('requireApiOrgContext')
    expect(routeSource).toContain('sdk.api.parseJsonBody')
    expect(routeSource).toContain('sdk.api.parseSearchParams')
    expect(routeSource).toContain('sdk.api.ok')
    expect(routeSource).not.toContain('redirect(')
    expect(routeSource).not.toContain('next/navigation')
    expect(routeSource).not.toContain('requirePageAuth')
  })
})
