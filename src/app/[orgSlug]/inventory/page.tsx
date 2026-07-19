import { sdk } from '@/sdk/server'
import { DashboardMetric, DashboardPage, DataTable, EmptyState, SectionHeader } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from './_components/inventory-shell'

export default async function InventoryPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  const dashboard = await InventoryService.getDashboard(ctx)
  const summaryMetrics = [
    ['Tracked Products', dashboard.summary.trackedProducts],
    ['Low Stock Products', dashboard.summary.lowStockProducts],
    ['Warehouses With Stock', dashboard.summary.warehousesWithStock],
  ] as const

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="overview">
      <DashboardPage
        breadcrumb="Inventory / Dashboard"
        title="Inventory Overview"
        description="Current tracked stock, low-stock pressure, and recent inventory activity."
        primaryAction={<LinkButton href={`/${orgSlug}/inventory/stock-adjustments/new`} variant="primary">New Adjustment</LinkButton>}
        metrics={
          <>
            {summaryMetrics.map(([label, value]) => (
            <DashboardMetric key={label} label={label} value={typeof value === 'number' ? value : 'Restricted'} />
            ))}
          </>
        }
        primaryContent={
          <Surface className="p-4">
            <SectionHeader title="Recent Movements" description="Latest immutable stock ledger entries." />
            <div className="mt-4">
              <DataTable
                columns={[
                  { id: 'product', header: 'Product', cell: (row) => row.productName },
                  { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouseName },
                  { id: 'type', header: 'Type', cell: (row) => <StatusBadge variant="info">{row.type}</StatusBadge> },
                  { id: 'delta', header: 'Delta', cell: (row) => row.quantityDelta },
                  { id: 'date', header: 'Date', cell: (row) => new Date(row.occurredAt).toLocaleDateString() },
                ]}
                rows={dashboard.recentMovements}
                getRowId={(row) => row.id}
                emptyState={<EmptyState title="No stock movements yet" description="Movements appear after stock adjustments are posted." />}
              />
            </div>
          </Surface>
        }
        secondaryContent={
          <Surface className="p-4">
            <SectionHeader title="Recent Adjustments" description="Manual corrections posted by inventory users." />
            <div className="mt-4">
              <DataTable
                columns={[
                  { id: 'product', header: 'Product', cell: (row) => row.productName },
                  { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouseName },
                  { id: 'before', header: 'Before', cell: (row) => row.quantityBefore },
                  { id: 'after', header: 'After', cell: (row) => row.quantityAfter },
                  { id: 'reason', header: 'Reason', cell: (row) => row.reason },
                ]}
                rows={dashboard.recentAdjustments}
                getRowId={(row) => row.id}
                emptyState={<EmptyState title="No stock adjustments yet" description="Post an adjustment to begin the inventory ledger." />}
              />
            </div>
          </Surface>
        }
      />
    </InventoryShell>
  )
}
