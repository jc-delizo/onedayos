import { LinkButton } from '@/components/ui/button'
import { CUSTOMER_PERMISSIONS, CustomerService } from '@/business-objects/customer'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../_components/records-config'
import { RecordsListPage } from '../_components/records-list-page'

export default async function CustomersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const records = await CustomerService.list(ctx, {})
  const area = getRecordArea('customers')
  const canCreate = sdk.permissions.can(ctx, CUSTOMER_PERMISSIONS.CREATE)
  const canUpdate = sdk.permissions.can(ctx, CUSTOMER_PERMISSIONS.UPDATE)

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
          ? (row) => <LinkButton href={`/${orgSlug}/records/customers/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
          : undefined
      }
    />
  )
}
