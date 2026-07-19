import { PRODUCT_CATEGORY_PERMISSIONS } from '@/business-objects/product'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../_components/records-config'
import { RecordsFormPage } from '../../_components/records-form-page'

export default async function NewProductCategoryPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  await sdk.permissions.require(ctx, PRODUCT_CATEGORY_PERMISSIONS.CREATE)

  return <RecordsFormPage orgSlug={orgSlug} area={getRecordArea('product-categories')} />
}
