import { notFound } from 'next/navigation'
import { RouteModal } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../../../records/_components/records-config'
import { isInventoryRelatedRecordArea, SharedRecordFormPresenter } from '../../../../records/_components/shared-record-pages'

export default async function SharedRecordCreateModal({ params }: { params: Promise<{ orgSlug: string; area: string }> }) {
  const { orgSlug, area } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const config = getRecordArea(area)
  return <RouteModal title={`New ${config.singular}`} description="Create a shared organization-wide business identity." closeHref={`/${orgSlug}/records/${area}`}><SharedRecordFormPresenter ctx={ctx} areaId={area} context="shared-records" surface="modal" /></RouteModal>
}
