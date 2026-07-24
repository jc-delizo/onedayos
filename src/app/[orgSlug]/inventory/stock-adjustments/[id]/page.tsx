import { sdk } from '@/sdk/server'
import { InventoryShell } from '../../_components/inventory-shell'
import { StockAdjustmentDetailPresenter } from '../../_components/inventory-record-presenters'

export default async function StockAdjustmentDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-adjustments">
      <StockAdjustmentDetailPresenter ctx={ctx} id={id} />
    </InventoryShell>
  )
}
