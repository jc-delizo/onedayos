import { FormPage } from '@/components/onedayos'
import type { RecordAreaConfig } from './records-config'
import { RecordForm } from './record-form'
import { RecordsShell } from './records-shell'
import type { RecordsPageContext } from './records-list-page'
import { Surface } from '@/components/ui/surface'

export function RecordsFormPage({
  orgSlug,
  area,
  initialValues,
  id,
  context = 'shared-records',
  surface = 'page',
}: {
  orgSlug: string
  area: RecordAreaConfig
  initialValues?: Record<string, string | boolean | null | undefined>
  id?: string
  context?: RecordsPageContext
  surface?: 'page' | 'modal'
}) {
  const isEdit = Boolean(id)
  const baseHref = context === 'inventory'
    ? `/${orgSlug}/inventory/related/${area.id}`
    : `/${orgSlug}/records/${area.id}`
  const contextualHelp = area.id === 'employees'
    ? 'People administration lives in Organization / People. User login access remains separate from Employee records.'
    : context === 'inventory'
      ? area.inventoryOwnership
      : 'Shared Records define business identity that enabled apps can reference without owning or duplicating it.'

  const form = (
    <RecordForm
      orgSlug={orgSlug}
      endpoint={id ? `${area.endpoint}/${id}` : area.endpoint}
      fields={area.fields}
      initialValues={initialValues}
      method={id ? 'PATCH' : 'POST'}
      returnHref={baseHref}
      submitLabel={isEdit ? `Save ${area.singular}` : `Create ${area.singular}`}
    />
  )

  if (surface === 'modal') {
    return <Surface className="space-y-5 p-4">{form}</Surface>
  }

  return (
    <RecordsShell orgSlug={orgSlug} activeArea={area.id}>
      <FormPage
        breadcrumb={context === 'inventory' ? `Inventory / Related Records / ${area.label}` : `Shared Records / ${area.label}`}
        title={`${isEdit ? 'Edit' : 'New'} ${area.singular}`}
        headerMode="compact"
        contextualHelp={contextualHelp}
        form={form}
      />
    </RecordsShell>
  )
}
