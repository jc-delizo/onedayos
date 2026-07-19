import { WAREHOUSE_PERMISSIONS } from '@/business-objects/warehouse'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../_components/records-config'
import { RecordsFormPage } from '../../_components/records-form-page'

export default async function NewWarehousePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  await sdk.permissions.require(ctx, WAREHOUSE_PERMISSIONS.CREATE)

  return <RecordsFormPage orgSlug={orgSlug} area={getRecordArea('warehouses')} initialValues={{ isActive: true }} />
}
