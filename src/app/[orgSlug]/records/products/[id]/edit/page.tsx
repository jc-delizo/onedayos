import { PRODUCT_PERMISSIONS, ProductService } from '@/business-objects/product'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../../_components/records-config'
import { RecordsFormPage } from '../../../_components/records-form-page'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  await sdk.permissions.require(ctx, PRODUCT_PERMISSIONS.UPDATE)
  const record = await ProductService.getById(ctx, id)

  return (
    <RecordsFormPage
      orgSlug={orgSlug}
      area={getRecordArea('products')}
      id={id}
      initialValues={{
        code: record.code,
        name: record.name,
        description: record.description,
        unit: record.unit,
        isActive: record.isActive,
      }}
    />
  )
}
