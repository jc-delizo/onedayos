import { EMPLOYEE_PERMISSIONS } from '@/business-objects/employee'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../_components/records-config'
import { RecordsFormPage } from '../../_components/records-form-page'

export default async function NewEmployeePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  await sdk.permissions.require(ctx, EMPLOYEE_PERMISSIONS.CREATE)

  return <RecordsFormPage orgSlug={orgSlug} area={getRecordArea('employees')} />
}
