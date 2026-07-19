import type { ReactNode } from 'react'
import { LinkButton } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { DataTable, EmptyState, ListPage, type DataTableColumn } from '@/components/onedayos'
import type { RecordAreaConfig } from './records-config'
import { RecordsShell } from './records-shell'

export function RecordsListPage<T>({
  orgSlug,
  area,
  rows,
  columns,
  getRowId,
  canCreate = true,
  rowActions,
}: {
  orgSlug: string
  area: RecordAreaConfig
  rows: T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T) => string
  canCreate?: boolean
  rowActions?: (row: T) => ReactNode
}) {
  const contextualHelp = area.id === 'employees'
    ? 'People administration lives in Organization / People. This direct Employee surface is a shared-record view, not an Inventory or HR module.'
    : undefined

  return (
    <RecordsShell orgSlug={orgSlug} activeArea={area.id}>
      <ListPage
        breadcrumb={`Shared Records / ${area.label}`}
        title={area.label}
        description={area.description}
        primaryAction={
          canCreate ? (
            <LinkButton href={`/${orgSlug}/records/${area.id}/new`} variant="primary">New {area.singular}</LinkButton>
          ) : undefined
        }
        contextualHelp={contextualHelp}
      >
        <Surface className="p-4">
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={getRowId}
            rowActions={rowActions}
            emptyState={
              <EmptyState
                title={`No ${area.label.toLowerCase()} yet`}
                description={
                  canCreate
                    ? `Create the first shared ${area.singular.toLowerCase()} record when the organization is ready.`
                    : `No shared ${area.singular.toLowerCase()} records are available to view yet.`
                }
                action={
                  canCreate ? (
                    <LinkButton href={`/${orgSlug}/records/${area.id}/new`} size="sm" variant="primary">New {area.singular}</LinkButton>
                  ) : undefined
                }
              />
            }
          />
        </Surface>
      </ListPage>
    </RecordsShell>
  )
}
