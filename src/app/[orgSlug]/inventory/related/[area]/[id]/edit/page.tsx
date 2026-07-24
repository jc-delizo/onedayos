import { notFound } from 'next/navigation'
import { sdk } from '@/sdk/server'
import {
  isInventoryRelatedRecordArea,
  SharedRecordFormPresenter,
} from '../../../../../records/_components/shared-record-pages'

export default async function EditInventoryRelatedRecordPage({
  params,
}: {
  params: Promise<{ orgSlug: string; area: string; id: string }>
}) {
  const { orgSlug, area, id } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()

  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return <SharedRecordFormPresenter ctx={ctx} areaId={area} context="inventory" id={id} />
}
