import { sdk } from '@/sdk/server'
import { SharedRecordListPresenter } from '../_components/shared-record-pages'

export default async function WarehousesPage({ params, searchParams }: { params: Promise<{ orgSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  return <SharedRecordListPresenter ctx={ctx} areaId="warehouses" context="shared-records" searchParams={await searchParams} />
}
