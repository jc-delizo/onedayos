import { sdk } from '@/sdk/server'
import { InventoryShell } from '../../_components/inventory-shell'
import { StockAdjustmentCreatePresenter } from '../../_components/inventory-record-presenters'

export default async function NewStockAdjustmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return (
    <InventoryShell orgSlug={orgSlug} activeItem="stock-adjustments">
      <StockAdjustmentCreatePresenter ctx={ctx} searchParams={await searchParams} />
    </InventoryShell>
  )
}
