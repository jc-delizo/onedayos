import { RouteModal } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { StockAdjustmentCreatePresenter } from '../../../../inventory/_components/inventory-record-presenters'

export default async function NewAdjustmentModal({ params, searchParams }: { params: Promise<{ orgSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return (
    <RouteModal title="New Stock Adjustment" description="Post a server-validated stock correction." closeHref={`/${orgSlug}/inventory/stock-adjustments`}>
      <StockAdjustmentCreatePresenter ctx={ctx} searchParams={await searchParams} surface="modal" />
    </RouteModal>
  )
}
