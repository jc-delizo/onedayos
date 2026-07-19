import { CUSTOMER_PERMISSIONS, CustomerService } from '@/business-objects/customer'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../../_components/records-config'
import { RecordsFormPage } from '../../../_components/records-form-page'

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  await sdk.permissions.require(ctx, CUSTOMER_PERMISSIONS.UPDATE)
  const record = await CustomerService.getById(ctx, id)

  return (
    <RecordsFormPage
      orgSlug={orgSlug}
      area={getRecordArea('customers')}
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
