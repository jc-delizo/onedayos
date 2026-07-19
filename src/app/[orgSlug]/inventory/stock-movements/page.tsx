import { sdk } from '@/sdk/server'
import { DataTable, EmptyState, ListPage } from '@/components/onedayos'
import { StatusBadge } from '@/components/ui/status-badge'
import { stockMovementQuerySchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from '../_components/inventory-shell'

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
  const rows = await InventoryService.listStockMovements(ctx, query)

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-movements">
      <ListPage
        breadcrumb="Inventory / Stock Movements"
        title="Stock Movements"
        description="Append-only ledger of stock changes."
        contextualHelp="Stock Movements are not normal editable records. They explain Inventory changes after posting."
      >
        <DataTable
          columns={[
            { id: 'date', header: 'Date', cell: (row) => new Date(row.occurredAt).toLocaleString() },
            { id: 'product', header: 'Product', cell: (row) => row.productName },
            { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouseName },
            { id: 'type', header: 'Type', cell: (row) => <StatusBadge variant="info">{row.type}</StatusBadge> },
            { id: 'delta', header: 'Delta', cell: (row) => row.quantityDelta },
            { id: 'result', header: 'Resulting', cell: (row) => row.resultingQuantity ?? '-' },
            { id: 'reason', header: 'Reason', cell: (row) => row.reason ?? '-' },
            { id: 'actor', header: 'Created By', cell: (row) => row.createdByName },
          ]}
          rows={rows}
          getRowId={(row) => row.id}
          emptyState={<EmptyState title="No stock movements yet" description="The ledger starts after a stock adjustment is posted." />}
        />
      </ListPage>
    </InventoryShell>
  )
}
