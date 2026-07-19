import { EMPLOYEE_PERMISSIONS, EmployeeService } from '@/business-objects/employee'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../../../_components/records-config'
import { RecordsFormPage } from '../../../_components/records-form-page'

function dateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : ''
}

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  await sdk.permissions.require(ctx, EMPLOYEE_PERMISSIONS.UPDATE)
  const record = await EmployeeService.getById(ctx, id)

  return (
    <RecordsFormPage
      orgSlug={orgSlug}
      area={getRecordArea('employees')}
      id={id}
      initialValues={{
        employeeNo: record.employeeNo,
        name: record.name,
        email: record.email,
        phone: record.phone,
        position: record.position,
        employmentType: record.employmentType,
        employmentStatus: record.employmentStatus,
        hiredAt: dateInput(record.hiredAt),
        endedAt: dateInput(record.endedAt),
      }}
    />
  )
}
