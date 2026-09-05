import type { ReactNode } from 'react'
import { TenantAppShell } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { buildTenantAppShellModel } from '@/platform/navigation/tenant-navigation'

export default async function OrgLayout({
  children,
  modal,
  params,
}: {
  children: ReactNode
  modal?: ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const model = buildTenantAppShellModel(ctx, {
    inventoryV2Enabled: sdk.runtime?.isInventoryV2Enabled?.() ?? false,
  })

  return <TenantAppShell model={model}>{children}{modal}</TenantAppShell>
}
