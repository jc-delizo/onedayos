import { notFound } from 'next/navigation'
import { RouteModal } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '@/app/[orgSlug]/records/_components/records-config'
import { isInventoryRelatedRecordArea, SharedRecordDetailPresenter } from '@/app/[orgSlug]/records/_components/shared-record-pages'

export default async function InventoryRelatedDetailModal({ params }: { params: Promise<{ orgSlug: string; area: string; id: string }> }) {
  const { orgSlug, area, id } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  const config = getRecordArea(area)
  return <RouteModal title={config.singular} description="Shared Record in Inventory context." closeHref={`/${orgSlug}/inventory/related/${area}`}><SharedRecordDetailPresenter ctx={ctx} areaId={area} context="inventory" id={id} surface="modal" /></RouteModal>
}
