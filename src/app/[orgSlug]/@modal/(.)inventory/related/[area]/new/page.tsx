import { notFound } from 'next/navigation'
import { RouteModal } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '@/app/[orgSlug]/records/_components/records-config'
import { isInventoryRelatedRecordArea, SharedRecordFormPresenter } from '@/app/[orgSlug]/records/_components/shared-record-pages'

export default async function InventoryRelatedCreateModal({ params }: { params: Promise<{ orgSlug: string; area: string }> }) {
  const { orgSlug, area } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  const config = getRecordArea(area)
  return <RouteModal title={`New ${config.singular}`} description="Create a Shared Record while preserving Inventory context." closeHref={`/${orgSlug}/inventory/related/${area}`}><SharedRecordFormPresenter ctx={ctx} areaId={area} context="inventory" surface="modal" /></RouteModal>
}
