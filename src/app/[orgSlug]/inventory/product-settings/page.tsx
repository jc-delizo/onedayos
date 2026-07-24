import { sdk } from '@/sdk/server'
import { ListPage } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { productSettingListQuerySchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from '../_components/inventory-shell'
import { ProductSettingsDataTable } from '../_components/inventory-data-tables'

export default async function InventoryProductSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  const query = productSettingListQuerySchema.parse(await searchParams)
  const result = await InventoryService.listProductSettingsPage(ctx, query)

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-levels">
      <ListPage
        breadcrumb="Inventory / Stock Levels / Tracking Settings"
        title="Inventory Tracking Settings"
        headerMode="compact"
        secondaryActions={<LinkButton href={`/${orgSlug}/inventory/stock-levels`} variant="secondary">Back to Stock Levels</LinkButton>}
        contextualHelp={(
          <>
            This compatibility page manages Inventory-specific tracking for shared Products. Product identity remains in Shared Records.{' '}
            <LinkButton href={`/${orgSlug}/inventory/related/products`} size="sm" variant="quiet">Open Inventory Products</LinkButton>
          </>
        )}
      >
        <ProductSettingsDataTable orgSlug={orgSlug} rows={result.rows} query={query} pageMeta={result.meta} />
      </ListPage>
    </InventoryShell>
  )
}
