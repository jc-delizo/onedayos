import { sdk } from '@/sdk/server'
import { InventoryShell } from '../../_components/inventory-shell'
import { StockLevelDetailPresenter } from '../../_components/inventory-record-presenters'

export default async function StockLevelDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-levels">
      <StockLevelDetailPresenter ctx={ctx} id={id} />
    </InventoryShell>
  )
}
