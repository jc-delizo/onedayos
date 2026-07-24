import { sdk } from '@/sdk/server'
import { ListPage } from '@/components/onedayos'
import { stockMovementQuerySchema } from '@/modules/inventory/schema'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from '../_components/inventory-shell'
import { StockMovementsDataTable } from '../_components/inventory-data-tables'

export default async function StockMovementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  const query = stockMovementQuerySchema.parse(await searchParams)
  const [result, warehouseOptions] = await Promise.all([
    InventoryService.listStockMovementsPage(ctx, query),
    InventoryService.listWarehouseFilterOptions(ctx, INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ),
  ])
  const canExport = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_MOVEMENT_EXPORT)

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-movements">
      <ListPage
        breadcrumb="Inventory / Stock Movements"
        title="Stock Movements"
        headerMode="compact"
        contextualHelp="Stock Movements are not normal editable records. They explain Inventory changes after posting."
      >
        <StockMovementsDataTable orgSlug={orgSlug} rows={result.rows} query={query} pageMeta={result.meta} warehouseOptions={warehouseOptions} canExport={canExport} />
      </ListPage>
    </InventoryShell>
  )
}
