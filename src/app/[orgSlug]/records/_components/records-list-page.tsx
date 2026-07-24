import type { ReactNode } from 'react'
import { LinkButton } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { DataTable, EmptyState, ListPage, type DataTableColumn } from '@/components/onedayos'
import type { RecordAreaConfig } from './records-config'
import { RecordsShell } from './records-shell'
import { RecordsDataTable, type RecordTableRow } from './records-data-table'
import type { DataTablePageMeta, DataTableQueryState } from '@/components/onedayos'

export type RecordsPageContext = 'shared-records' | 'inventory'

export function RecordsListPage<T>({
  orgSlug,
  area,
  rows,
  columns,
  getRowId,
  canCreate = true,
  rowActions,
  context = 'shared-records',
  secondaryActions,
  v2,
}: {
  orgSlug: string
  area: RecordAreaConfig
  rows: T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T) => string
  canCreate?: boolean
  rowActions?: (row: T) => ReactNode
  context?: RecordsPageContext
  secondaryActions?: ReactNode
  v2?: {
    rows: RecordTableRow[]
    canUpdate: boolean
    canExport: boolean
    exportEndpoint: string
    query: DataTableQueryState
    pageMeta: DataTablePageMeta
  }
}) {
  const baseHref = context === 'inventory'
    ? `/${orgSlug}/inventory/related/${area.id}`
    : `/${orgSlug}/records/${area.id}`
  const contextualHelp = area.id === 'employees'
    ? 'People administration lives in Organization / People. This direct Employee surface is a shared-record view, not an Inventory or HR module.'
    : context === 'inventory'
      ? area.inventoryOwnership
      : 'Shared Records are organization-wide business identities reused by enabled apps.'

  return (
    <RecordsShell orgSlug={orgSlug} activeArea={area.id}>
      <ListPage
        breadcrumb={context === 'inventory' ? `Inventory / Related Records / ${area.label}` : `Shared Records / ${area.label}`}
        title={area.label}
        headerMode="compact"
        primaryAction={
          canCreate ? (
            <LinkButton href={`${baseHref}/new`} variant="primary">New {area.singular}</LinkButton>
          ) : undefined
        }
        secondaryActions={secondaryActions}
        contextualHelp={contextualHelp}
      >
        <Surface className="p-4">
          {v2 ? (
            <RecordsDataTable
              tableId={`objects.${area.id}`}
              areaId={area.id}
              rows={v2.rows}
              baseHref={baseHref}
              singular={area.singular}
              canUpdate={v2.canUpdate}
              canExport={v2.canExport}
              exportEndpoint={v2.exportEndpoint}
              query={v2.query}
              pageMeta={v2.pageMeta}
            />
          ) : (
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
                    <LinkButton href={`${baseHref}/new`} size="sm" variant="primary">New {area.singular}</LinkButton>
                  ) : undefined
                }
              />
              }
            />
          )}
        </Surface>
      </ListPage>
    </RecordsShell>
  )
}
