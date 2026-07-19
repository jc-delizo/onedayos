import { FormPage } from '@/components/onedayos'
import type { RecordAreaConfig } from './records-config'
import { RecordForm } from './record-form'
import { RecordsShell } from './records-shell'

export function RecordsFormPage({
  orgSlug,
  area,
  initialValues,
  id,
}: {
  orgSlug: string
  area: RecordAreaConfig
  initialValues?: Record<string, string | boolean | null | undefined>
  id?: string
}) {
  const isEdit = Boolean(id)
  const baseHref = `/${orgSlug}/records/${area.id}`
  const contextualHelp = area.id === 'employees'
    ? 'People administration lives in Organization / People. User login access remains separate from Employee records.'
    : 'Shared Records define business identity that enabled apps can reference without owning or duplicating it.'

  return (
    <RecordsShell orgSlug={orgSlug} activeArea={area.id}>
      <FormPage
        breadcrumb={`Shared Records / ${area.label}`}
        title={`${isEdit ? 'Edit' : 'New'} ${area.singular}`}
        description={area.description}
        contextualHelp={contextualHelp}
        form={
          <RecordForm
            orgSlug={orgSlug}
            endpoint={id ? `${area.endpoint}/${id}` : area.endpoint}
            fields={area.fields}
            initialValues={initialValues}
            method={id ? 'PATCH' : 'POST'}
            returnHref={baseHref}
            submitLabel={isEdit ? `Save ${area.singular}` : `Create ${area.singular}`}
          />
        }
      />
    </RecordsShell>
  )
}
