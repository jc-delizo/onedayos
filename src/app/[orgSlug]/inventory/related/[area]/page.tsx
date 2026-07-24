import { notFound } from 'next/navigation'
import { sdk } from '@/sdk/server'
import {
  isInventoryRelatedRecordArea,
  SharedRecordListPresenter,
} from '../../../records/_components/shared-record-pages'

export default async function InventoryRelatedRecordsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; area: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { orgSlug, area } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()

  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return <SharedRecordListPresenter ctx={ctx} areaId={area} context="inventory" searchParams={await searchParams} />
}
