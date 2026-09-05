import { sdk } from '@/sdk/server'
import {
  DashboardMetric,
  DashboardPage,
  DataTable,
  EmptyState,
  SafePageErrorState,
  SectionHeader,
} from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import { InventoryService, isInventoryServiceError } from '@/modules/inventory/service'
import {
  MovementTrendChart,
  StockHealthChart,
  WarehouseStockChart,
} from './_components/inventory-dashboard-charts'
import { InventoryShell } from './_components/inventory-shell'

export default async function InventoryPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  let dashboard: Awaited<ReturnType<typeof InventoryService.getDashboard>>
  try {
    dashboard = await InventoryService.getDashboard(ctx)
  } catch (error) {
    if (isInventoryServiceError(error) && error.status === 422) {
      return (
        <InventoryShell orgSlug={orgSlug} activeItem="overview">
          <SafePageErrorState
            title="Dashboard analytics need a narrower scope"
            message="The current organization exceeds the exact Dashboard processing limit. Narrow the operational scope or contact an administrator while aggregate optimization is prepared."
          />
        </InventoryShell>
      )
    }
    throw error
  }
  const inventoryV2Enabled = sdk.runtime?.isInventoryV2Enabled?.() ?? false
  const summaryMetrics = [
    ['Tracked Products', dashboard.kpis.trackedProducts, 'Products with active Inventory Tracking.'],
    ['Low Stock', dashboard.kpis.lowStockProducts, 'Tracked Products above zero and at or below reorder point.'],
    ['Out of Stock', dashboard.kpis.outOfStockProducts, 'Tracked Products with zero organization-wide quantity.'],
    ['Warehouses with Stock', dashboard.kpis.warehousesWithStock, 'Active Warehouses holding a positive tracked balance.'],
  ] as const

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="overview">
      <DashboardPage
        breadcrumb="Inventory / Dashboard"
        title="Inventory Overview"
        headerMode="compact"
        primaryAction={<LinkButton href={inventoryV2Enabled ? `/${orgSlug}/inventory/transactions/adjustments/new` : `/${orgSlug}/inventory/stock-adjustments/new`} target={inventoryV2Enabled ? '_top' : undefined} variant="primary">New Adjustment</LinkButton>}
        metrics={
          <>
            {summaryMetrics.map(([label, value, description]) => (
            <DashboardMetric key={label} label={label} value={value} description={description} />
            ))}
          </>
        }
        primaryContent={
          <div className="space-y-4">
            <section aria-label="Inventory charts" className="grid min-w-0 gap-4 xl:grid-cols-2">
              <StockHealthChart data={dashboard.stockHealth} />
              <MovementTrendChart data={dashboard.movementTrend} range={dashboard.movementRange} />
            </section>
            <WarehouseStockChart data={dashboard.warehouseStock} />
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
          </div>
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
