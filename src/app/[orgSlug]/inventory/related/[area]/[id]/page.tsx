import { notFound } from 'next/navigation'
import { sdk } from '@/sdk/server'
import {
  isInventoryRelatedRecordArea,
  SharedRecordDetailPresenter,
} from '../../../../records/_components/shared-record-pages'
import { InventoryShell } from '../../../_components/inventory-shell'

export default async function InventoryRelatedDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; area: string; id: string }>
}) {
  const { orgSlug, area, id } = await params
  if (!isInventoryRelatedRecordArea(area)) notFound()
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  return (
    <InventoryShell orgSlug={orgSlug} activeItem={area}>
      <SharedRecordDetailPresenter ctx={ctx} areaId={area} context="inventory" id={id} />
    </InventoryShell>
  )
}
