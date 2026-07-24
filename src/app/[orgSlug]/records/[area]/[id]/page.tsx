import { notFound } from 'next/navigation'
import { sdk } from '@/sdk/server'
import {
  isInventoryRelatedRecordArea,
  SharedRecordDetailPresenter,
} from '../../_components/shared-record-pages'
import { RecordsShell } from '../../_components/records-shell'

export default async function SharedRecordDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; area: string; id: string }>
}) {
  const { orgSlug, area, id } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  return (
    <RecordsShell orgSlug={orgSlug} activeArea={area}>
      <SharedRecordDetailPresenter ctx={ctx} areaId={area} context="shared-records" id={id} />
    </RecordsShell>
  )
}
