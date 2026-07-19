import { sdk } from '@/sdk/server'
import { EmptyState, FormPage } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { InventoryService } from '@/modules/inventory/service'
import { InventoryShell } from '../../_components/inventory-shell'
import { StockAdjustmentForm } from '../../_components/stock-adjustment-form'

export default async function NewStockAdjustmentPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  const options = await InventoryService.getStockAdjustmentFormOptions(ctx)
  const canPost = options.products.length > 0 && options.warehouses.length > 0

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-adjustments">
      <FormPage
        breadcrumb="Inventory / New Adjustment"
        title="New Stock Adjustment"
        description="Post a manual correction. The server computes before, delta, movement, and resulting balance."
        primaryAction={<LinkButton href={`/${orgSlug}/inventory/stock-adjustments`} variant="secondary">Back to Adjustments</LinkButton>}
        contextualHelp="Product and Warehouse identity come from shared Records. Inventory validates both records and computes posting quantities on the server."
        form={
          canPost ? (
            <StockAdjustmentForm orgSlug={orgSlug} options={options} />
          ) : (
            <EmptyState
              title="Products and Warehouses are required"
              description="Create shared Product and Warehouse records before posting stock adjustments."
              action={<LinkButton href={`/${orgSlug}/records/products`} size="sm" variant="secondary">Open Products</LinkButton>}
            />
          )
        }
      />
    </InventoryShell>
  )
}
