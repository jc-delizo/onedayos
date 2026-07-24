import { sdk } from '@/sdk/server'
import { SharedRecordFormPresenter } from '../../../_components/shared-record-pages'

export default async function EditCustomerPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  return <SharedRecordFormPresenter ctx={ctx} areaId="customers" context="shared-records" id={id} />
}
