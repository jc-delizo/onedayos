import { notFound } from 'next/navigation'
import { sdk } from '@/sdk/server'
import {
  isInventoryRelatedRecordArea,
  SharedRecordFormPresenter,
} from '../../../../records/_components/shared-record-pages'

export default async function NewInventoryRelatedRecordPage({
  params,
}: {
  params: Promise<{ orgSlug: string; area: string }>
}) {
  const { orgSlug, area } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()

  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return <SharedRecordFormPresenter ctx={ctx} areaId={area} context="inventory" />
}
