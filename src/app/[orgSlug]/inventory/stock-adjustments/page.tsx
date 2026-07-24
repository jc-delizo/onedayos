import { sdk } from '@/sdk/server'
import { ListPage } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { stockAdjustmentQuerySchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from '../_components/inventory-shell'
import { StockAdjustmentsDataTable } from '../_components/inventory-data-tables'

export default async function StockAdjustmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  const query = stockAdjustmentQuerySchema.parse(await searchParams)
  const [result, warehouseOptions] = await Promise.all([
    InventoryService.listStockAdjustmentsPage(ctx, query),
    InventoryService.listWarehouseFilterOptions(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ),
  ])
  const canCreateAdjustment = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE)
  const canExport = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_EXPORT)

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-adjustments">
      <ListPage
        breadcrumb="Inventory / Stock Adjustments"
        title="Stock Adjustments"
        headerMode="compact"
        primaryAction={
          canCreateAdjustment ? (
            <LinkButton href={`/${orgSlug}/inventory/stock-adjustments/new`} variant="primary">New Adjustment</LinkButton>
          ) : undefined
        }
      >
        <StockAdjustmentsDataTable orgSlug={orgSlug} rows={result.rows} query={query} pageMeta={result.meta} warehouseOptions={warehouseOptions} canExport={canExport} />
      </ListPage>
    </InventoryShell>
  )
}
