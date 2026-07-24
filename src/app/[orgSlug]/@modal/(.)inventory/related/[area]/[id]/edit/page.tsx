import { notFound } from 'next/navigation'
import { RouteModal } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '@/app/[orgSlug]/records/_components/records-config'
import { isInventoryRelatedRecordArea, SharedRecordFormPresenter } from '@/app/[orgSlug]/records/_components/shared-record-pages'

export default async function InventoryRelatedEditModal({ params }: { params: Promise<{ orgSlug: string; area: string; id: string }> }) {
  const { orgSlug, area, id } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  const config = getRecordArea(area)
  return <RouteModal title={`Edit ${config.singular}`} description="Shared identity fields remain owned by Shared Records." closeHref={`/${orgSlug}/inventory/related/${area}`}><SharedRecordFormPresenter ctx={ctx} areaId={area} context="inventory" id={id} surface="modal" /></RouteModal>
}
