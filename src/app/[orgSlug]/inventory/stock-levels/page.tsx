import { sdk } from '@/sdk/server'
import { DataTable, EmptyState, ListPage } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { stockLevelQuerySchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from '../_components/inventory-shell'

function statusLabel(status: string) {
  if (status === 'low_stock') return 'Low Stock'
  if (status === 'not_tracked') return 'Not Tracked'
  return 'OK'
}

function statusVariant(status: string) {
  if (status === 'low_stock') return 'warning' as const
  if (status === 'not_tracked') return 'neutral' as const
  return 'success' as const
}

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
  const rows = await InventoryService.listStockLevels(ctx, query)
  const canCreateAdjustment = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE)

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-levels">
      <ListPage
        breadcrumb="Inventory / Stock Levels"
        title="Stock Levels"
        description="Current stock by shared Product and Warehouse."
        primaryAction={
          canCreateAdjustment ? (
            <LinkButton href={`/${orgSlug}/inventory/stock-adjustments/new`} variant="primary">Adjust Stock</LinkButton>
          ) : undefined
        }
      >
        <DataTable
          columns={[
            { id: 'productCode', header: 'Product Code', cell: (row) => row.productCode },
            { id: 'productName', header: 'Product', cell: (row) => row.productName },
            { id: 'category', header: 'Category', cell: (row) => row.categoryName ?? 'Uncategorized' },
            { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouseName },
            { id: 'quantity', header: 'Quantity', cell: (row) => `${row.quantity} ${row.productUnit}` },
            { id: 'reorder', header: 'Reorder Point', cell: (row) => row.reorderPoint ?? '-' },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge variant={statusVariant(row.status)}>{statusLabel(row.status)}</StatusBadge> },
          ]}
          rows={rows}
          getRowId={(row) => row.id}
          emptyState={<EmptyState title="No stock levels yet" description="Post an adjustment to create the first stock balance." />}
        />
      </ListPage>
    </InventoryShell>
  )
}
