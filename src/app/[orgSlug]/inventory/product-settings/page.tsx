import { sdk } from '@/sdk/server'
import { DataTable, EmptyState, ListPage } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { productSettingListQuerySchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from '../_components/inventory-shell'

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
  const rows = await InventoryService.listProductSettings(ctx, query)

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="product-settings">
      <ListPage
        breadcrumb="Inventory / Product Settings"
        title="Product Settings"
        description="Inventory-specific tracking settings for shared Products."
        contextualHelp={(
          <>
            Product identity is managed in Shared Records.{' '}
            <LinkButton href={`/${orgSlug}/records/products`} size="sm" variant="quiet">Open Products</LinkButton>
          </>
        )}
      >
        <DataTable
          columns={[
            { id: 'code', header: 'Code', cell: (row) => row.productCode },
            { id: 'product', header: 'Product', cell: (row) => row.productName },
            { id: 'category', header: 'Category', cell: (row) => row.categoryName ?? 'Uncategorized' },
            { id: 'tracked', header: 'Tracking', cell: (row) => <StatusBadge variant={row.isStockTracked ? 'success' : 'neutral'}>{row.isStockTracked ? 'Tracked' : 'Not Tracked'}</StatusBadge> },
            { id: 'reorder', header: 'Reorder Point', cell: (row) => `${row.reorderPoint} ${row.productUnit}` },
          ]}
          rows={rows}
          getRowId={(row) => row.id}
          emptyState={<EmptyState title="No shared Products yet" description="Create Products under Records before configuring Inventory settings." />}
        />
      </ListPage>
    </InventoryShell>
  )
}
