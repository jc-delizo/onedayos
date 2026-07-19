import { sdk } from '@/sdk/server'
import { DataTable, EmptyState, ListPage } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { stockAdjustmentQuerySchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from '../_components/inventory-shell'

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
  const rows = await InventoryService.listStockAdjustments(ctx, query)
  const canCreateAdjustment = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE)

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-adjustments">
      <ListPage
        breadcrumb="Inventory / Stock Adjustments"
        title="Stock Adjustments"
        description="Posted manual corrections that explain stock changes."
        primaryAction={
          canCreateAdjustment ? (
            <LinkButton href={`/${orgSlug}/inventory/stock-adjustments/new`} variant="primary">New Adjustment</LinkButton>
          ) : undefined
        }
      >
        <DataTable
          columns={[
            { id: 'date', header: 'Date', cell: (row) => new Date(row.createdAt).toLocaleString() },
            { id: 'product', header: 'Product', cell: (row) => row.productName },
            { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouseName },
            { id: 'before', header: 'Before', cell: (row) => row.quantityBefore },
            { id: 'after', header: 'After', cell: (row) => row.quantityAfter },
            { id: 'delta', header: 'Delta', cell: (row) => row.quantityDelta },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge variant="success">{row.status}</StatusBadge> },
            { id: 'reason', header: 'Reason', cell: (row) => row.reason },
          ]}
          rows={rows}
          getRowId={(row) => row.id}
          emptyState={<EmptyState title="No stock adjustments yet" description="Post an adjustment to create stock balances and movement entries." />}
        />
      </ListPage>
    </InventoryShell>
  )
}
