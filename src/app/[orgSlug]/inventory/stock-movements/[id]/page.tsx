import { sdk } from '@/sdk/server'
import { InventoryShell } from '../../_components/inventory-shell'
import { StockMovementDetailPresenter } from '../../_components/inventory-record-presenters'

export default async function StockMovementDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-movements">
      <StockMovementDetailPresenter ctx={ctx} id={id} />
    </InventoryShell>
  )
}
