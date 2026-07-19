import { SUPPLIER_PERMISSIONS, SupplierService } from '@/business-objects/supplier'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../../_components/records-config'
import { RecordsFormPage } from '../../../_components/records-form-page'

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  await sdk.permissions.require(ctx, SUPPLIER_PERMISSIONS.UPDATE)
  const record = await SupplierService.getById(ctx, id)

  return (
    <RecordsFormPage
      orgSlug={orgSlug}
      area={getRecordArea('suppliers')}
      id={id}
      initialValues={{
        name: record.name,
        email: record.email,
        phone: record.phone,
        address: record.address,
      }}
    />
  )
}
