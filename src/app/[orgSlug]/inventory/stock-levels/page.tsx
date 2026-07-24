import { sdk } from '@/sdk/server'
import { ListPage } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { stockLevelQuerySchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from '../_components/inventory-shell'
import { StockLevelsDataTable } from '../_components/inventory-data-tables'

export default async function StockLevelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  const query = stockLevelQuerySchema.parse(await searchParams)
  const [result, warehouseOptions] = await Promise.all([
    InventoryService.listStockLevelsPage(ctx, query),
    InventoryService.listWarehouseFilterOptions(ctx, INVENTORY_PERMISSIONS.STOCK_LEVEL_READ),
  ])
  const canCreateAdjustment = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE)
  const canExport = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_LEVEL_EXPORT)
  const canReadProductSettings = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ)

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-levels">
      <ListPage
        breadcrumb="Inventory / Stock Levels"
        title="Stock Levels"
        headerMode="compact"
        contextualHelp="Stock status remains visible on each row. Exact status filtering is temporarily deferred; use Product search and the complete Warehouse filter."
        primaryAction={
          canCreateAdjustment ? (
            <LinkButton href={`/${orgSlug}/inventory/stock-adjustments/new`} variant="primary">Adjust Stock</LinkButton>
          ) : undefined
        }
        secondaryActions={
          canReadProductSettings ? (
            <LinkButton href={`/${orgSlug}/inventory/product-settings`} variant="secondary">Manage tracking settings</LinkButton>
          ) : undefined
        }
      >
        <StockLevelsDataTable orgSlug={orgSlug} rows={result.rows} canAdjust={canCreateAdjustment} canExport={canExport} query={query} pageMeta={result.meta} warehouseOptions={warehouseOptions} />
      </ListPage>
    </InventoryShell>
  )
}
