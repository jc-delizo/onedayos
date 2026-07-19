import { PRODUCT_CATEGORY_PERMISSIONS, ProductCategoryService } from '@/business-objects/product'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../../_components/records-config'
import { RecordsFormPage } from '../../../_components/records-form-page'

export default async function EditProductCategoryPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  await sdk.permissions.require(ctx, PRODUCT_CATEGORY_PERMISSIONS.UPDATE)
  const record = await ProductCategoryService.getById(ctx, id)

  return (
    <RecordsFormPage
      orgSlug={orgSlug}
      area={getRecordArea('product-categories')}
      id={id}
      initialValues={{
        name: record.name,
      }}
    />
  )
}
