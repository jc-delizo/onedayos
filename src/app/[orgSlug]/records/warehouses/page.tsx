import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { WAREHOUSE_PERMISSIONS, WarehouseService } from '@/business-objects/warehouse'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../_components/records-config'
import { RecordsListPage } from '../_components/records-list-page'

export default async function WarehousesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const records = await WarehouseService.list(ctx, {})
  const area = getRecordArea('warehouses')
  const canCreate = sdk.permissions.can(ctx, WAREHOUSE_PERMISSIONS.CREATE)
  const canUpdate = sdk.permissions.can(ctx, WAREHOUSE_PERMISSIONS.UPDATE)

  return (
    <RecordsListPage
      orgSlug={orgSlug}
      area={area}
      rows={records}
      getRowId={(row) => row.id}
      columns={[
        { id: 'code', header: 'Code', cell: (row) => row.code },
        { id: 'name', header: 'Name', cell: (row) => row.name },
        {
          id: 'status',
          header: 'Status',
          cell: (row) => <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</StatusBadge>,
        },
      ]}
      canCreate={canCreate}
      rowActions={
        canUpdate
          ? (row) => <LinkButton href={`/${orgSlug}/records/warehouses/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
          : undefined
      }
    />
  )
}
