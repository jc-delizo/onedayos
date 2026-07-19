import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { checkArchitecture } from './check-architecture'

let tempDirs: string[] = []

function makeTempRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'onedayos-arch-'))
  tempDirs.push(dir)
  return dir
}

describe('architecture checker', () => {
  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true })
    }
    tempDirs = []
  })

  it('catches forbidden Foundation Package patterns in active code', () => {
    const root = makeTempRepo()
    mkdirSync(join(root, 'src/app/api/example'), { recursive: true })
    writeFileSync(
      join(root, 'src/app/api/example/route.ts'),
      "import { redirect } from 'next/navigation'\nconst org = body.orgId\nredirect('/login')\n",
    )
    mkdirSync(join(root, 'src/app/register'), { recursive: true })
    writeFileSync(
      join(root, 'src/app/register/form.tsx'),
      "'use client'\nimport { sdk } from '@/sdk/server'\nimport { prisma } from '@prisma/client'\nimport { x } from '@/kernel/db/client'\nJSON.stringify({ orgId: 'org_a' })\nsupabase.auth.signUp({ email: 'a@example.com', password: 'password' })\n<input name=\"orgId\" />\n",
    )
    mkdirSync(join(root, 'src/modules/inventory'), { recursive: true })
    writeFileSync(
      join(root, 'src/modules/inventory/service.ts'),
      "import { prisma } from '@/kernel/db/client'\nimport { Product } from '@/modules/crm/service'\nclass InventoryProduct {}\n",
    )
    writeFileSync(join(root, 'src/modules/inventory/schema.prisma'), 'model Product { id String @id }\n')
    writeFileSync(
      join(root, 'src/modules/inventory/manifest.ts'),
      "sdk.modules.register(inventoryManifest)\nexport const manifest = { permissions: ['create'], wildcard: { module: '*', resource: '*', action: '*' } }\n",
    )
    writeFileSync(
      join(root, 'src/service.ts'),
      "sdk.getDb(orgId)\ngetDb(orgId)\nconst tenant = input.orgId\nrequest.nextUrl.searchParams.get('orgId')\nconst oldModule = '/api/[module]'\nconst oldInventory = '/api/inventory'\nconst oldSample = '/api/sample-module'\nconst oldUser = '/api/kernel/users/[id]'\nconst oldButton = 'Records / Products'\nimport { motion } from 'framer-motion'\n",
    )
    mkdirSync(join(root, 'src/components/onedayos'), { recursive: true })
    writeFileSync(
      join(root, 'src/components/onedayos/app-shell.tsx'),
      "'use client'\n<span>Current App</span>\n<span>Apps &gt;</span>\n<span className=\"size-1.5 rounded-full border-l-2\" />\n",
    )
    writeFileSync(join(root, 'api.py'), 'from fastapi import FastAPI\n')

    const findings = checkArchitecture(root).map((finding) => finding.rule)

    expect(findings).toContain('no-sdk-get-db-org-id')
    expect(findings).toContain('no-get-db-org-id')
    expect(findings).toContain('no-body-org-id')
    expect(findings).toContain('no-input-org-id')
    expect(findings).toContain('no-search-param-org-id')
    expect(findings).toContain('no-old-module-api-pattern')
    expect(findings).toContain('no-inventory-api')
    expect(findings).toContain('no-unscoped-sample-module-api')
    expect(findings).toContain('no-id-current-user-api')
    expect(findings).toContain('no-framer-motion')
    expect(findings).toContain('no-api-page-auth-helper')
    expect(findings).toContain('no-module-kernel-imports')
    expect(findings).toContain('no-raw-prisma-in-modules')
    expect(findings).toContain('no-module-to-module-imports')
    expect(findings).toContain('no-module-self-registration')
    expect(findings).toContain('no-module-action-array-permissions')
    expect(findings).toContain('no-module-wildcard-permissions')
    expect(findings).toContain('no-duplicate-business-object-identity')
    expect(findings).toContain('no-business-object-models-in-modules')
    expect(findings).toContain('no-client-server-sdk-import')
    expect(findings).toContain('no-client-kernel-import')
    expect(findings).toContain('no-client-raw-prisma')
    expect(findings).toContain('no-org-id-form-field')
    expect(findings).toContain('no-client-org-id-json')
    expect(findings).toContain('no-client-supabase-signup')
    expect(findings).toContain('no-old-records-products-button')
    expect(findings).toContain('no-current-app-label')
    expect(findings).toContain('no-apps-arrow-label')
    expect(findings).toContain('no-sidebar-active-dot')
    expect(findings).toContain('no-sidebar-active-left-rail')
    expect(findings).toContain('no-python-backend')
  })

  it('ignores docs and intentional test fixtures', () => {
    const root = makeTempRepo()
    mkdirSync(join(root, 'docs'), { recursive: true })
    writeFileSync(join(root, 'docs/manual.md'), 'sdk.getDb(orgId)\n/api/inventory\n')
    mkdirSync(join(root, 'src/__fixtures__'), { recursive: true })
    writeFileSync(join(root, 'src/__fixtures__/bad.ts'), 'const org = body.orgId\n')

    expect(checkArchitecture(root)).toEqual([])
  })

  it('allows legitimate future Business Object extension names without allowing duplicate identities', () => {
    const root = makeTempRepo()
    mkdirSync(join(root, 'src/modules/inventory'), { recursive: true })
    writeFileSync(
      join(root, 'src/modules/inventory/extensions.ts'),
      'class InventoryProductExtension {}\nclass PurchasingSupplierProfile {}\nclass CrmCustomerProfile {}\n',
    )

    expect(checkArchitecture(root)).toEqual([])

    writeFileSync(
      join(root, 'src/modules/inventory/duplicates.ts'),
      'class InventoryProduct {}\nclass InventoryWarehouse {}\nclass InventorySupplier {}\nclass PurchasingSupplier {}\n',
    )

    const findings = checkArchitecture(root).map((finding) => finding.rule)

    expect(findings).toContain('no-duplicate-business-object-identity')
  })
})
