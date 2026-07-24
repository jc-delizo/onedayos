import { sdk } from '@/sdk/server'
import { SharedRecordFormPresenter } from '../../../_components/shared-record-pages'

export default async function EditProductCategoryPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  return <SharedRecordFormPresenter ctx={ctx} areaId="product-categories" context="shared-records" id={id} />
}
