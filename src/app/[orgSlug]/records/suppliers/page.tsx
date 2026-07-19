import { LinkButton } from '@/components/ui/button'
import { SUPPLIER_PERMISSIONS, SupplierService } from '@/business-objects/supplier'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../_components/records-config'
import { RecordsListPage } from '../_components/records-list-page'

export default async function SuppliersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const records = await SupplierService.list(ctx, {})
  const area = getRecordArea('suppliers')
  const canCreate = sdk.permissions.can(ctx, SUPPLIER_PERMISSIONS.CREATE)
  const canUpdate = sdk.permissions.can(ctx, SUPPLIER_PERMISSIONS.UPDATE)

  return (
    <RecordsListPage
      orgSlug={orgSlug}
      area={area}
      rows={records}
      getRowId={(row) => row.id}
      columns={[
        { id: 'name', header: 'Name', cell: (row) => row.name },
        { id: 'email', header: 'Email', cell: (row) => row.email ?? '—' },
        { id: 'phone', header: 'Phone', cell: (row) => row.phone ?? '—' },
      ]}
      canCreate={canCreate}
      rowActions={
        canUpdate
          ? (row) => <LinkButton href={`/${orgSlug}/records/suppliers/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
          : undefined
      }
    />
  )
}
