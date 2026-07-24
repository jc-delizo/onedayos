import { notFound } from 'next/navigation'
import { RouteModal } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../../../records/_components/records-config'
import { isInventoryRelatedRecordArea, SharedRecordDetailPresenter } from '../../../../records/_components/shared-record-pages'

export default async function SharedRecordDetailModal({ params }: { params: Promise<{ orgSlug: string; area: string; id: string }> }) {
  const { orgSlug, area, id } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const config = getRecordArea(area)
  return <RouteModal title={config.singular} description="Shared organization-wide business identity." closeHref={`/${orgSlug}/records/${area}`}><SharedRecordDetailPresenter ctx={ctx} areaId={area} context="shared-records" id={id} surface="modal" /></RouteModal>
}
