import { sdk } from '@/sdk/server'
import { SharedRecordFormPresenter } from '../../_components/shared-record-pages'

export default async function NewProductCategoryPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  return <SharedRecordFormPresenter ctx={ctx} areaId="product-categories" context="shared-records" />
}
