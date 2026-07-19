import { WAREHOUSE_PERMISSIONS, WarehouseService } from '@/business-objects/warehouse'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../../_components/records-config'
import { RecordsFormPage } from '../../../_components/records-form-page'

export default async function EditWarehousePage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  await sdk.permissions.require(ctx, WAREHOUSE_PERMISSIONS.UPDATE)
  const record = await WarehouseService.getById(ctx, id)

  return (
    <RecordsFormPage
      orgSlug={orgSlug}
      area={getRecordArea('warehouses')}
      id={id}
      initialValues={{
        code: record.code,
        name: record.name,
        address: record.address,
        isActive: record.isActive,
      }}
    />
  )
}
