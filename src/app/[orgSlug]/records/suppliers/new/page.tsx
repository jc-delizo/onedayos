import { sdk } from '@/sdk/server'
import { SharedRecordFormPresenter } from '../../_components/shared-record-pages'

export default async function NewSupplierPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  return <SharedRecordFormPresenter ctx={ctx} areaId="suppliers" context="shared-records" />
}
