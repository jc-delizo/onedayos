import { RouteModal } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { StockLevelDetailPresenter } from '../../../../inventory/_components/inventory-record-presenters'

export default async function StockLevelModal({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return <RouteModal title="Stock Level" description="Current calculated Inventory balance." closeHref={`/${orgSlug}/inventory/stock-levels`}><StockLevelDetailPresenter ctx={ctx} id={id} surface="modal" /></RouteModal>
}
