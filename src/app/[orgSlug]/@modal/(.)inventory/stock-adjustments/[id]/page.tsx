import { RouteModal } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { StockAdjustmentDetailPresenter } from '../../../../inventory/_components/inventory-record-presenters'

export default async function StockAdjustmentModal({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return <RouteModal title="Stock Adjustment" description="Read-only posted adjustment." closeHref={`/${orgSlug}/inventory/stock-adjustments`}><StockAdjustmentDetailPresenter ctx={ctx} id={id} surface="modal" /></RouteModal>
}
