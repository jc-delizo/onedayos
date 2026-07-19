import { sdk } from '@/sdk/server'
import { buildTenantAppShellModel } from '@/platform/navigation/tenant-navigation'
import { AppLauncher } from './app-launcher'

export default async function AppsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const model = buildTenantAppShellModel(ctx)

  return <AppLauncher apps={model.apps} />
}
