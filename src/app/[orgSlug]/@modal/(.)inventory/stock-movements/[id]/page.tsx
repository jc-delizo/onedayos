import { RouteModal } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { StockMovementDetailPresenter } from '../../../../inventory/_components/inventory-record-presenters'

export default async function StockMovementModal({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return <RouteModal title="Stock Movement" description="Immutable append-only ledger entry." closeHref={`/${orgSlug}/inventory/stock-movements`}><StockMovementDetailPresenter ctx={ctx} id={id} surface="modal" /></RouteModal>
}
