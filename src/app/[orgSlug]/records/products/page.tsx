import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { PRODUCT_PERMISSIONS, ProductService } from '@/business-objects/product'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../_components/records-config'
import { RecordsListPage } from '../_components/records-list-page'

export default async function ProductsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const records = await ProductService.list(ctx, {})
  const area = getRecordArea('products')
  const canCreate = sdk.permissions.can(ctx, PRODUCT_PERMISSIONS.CREATE)
  const canUpdate = sdk.permissions.can(ctx, PRODUCT_PERMISSIONS.UPDATE)

  return (
    <RecordsListPage
      orgSlug={orgSlug}
      area={area}
      rows={records}
      getRowId={(row) => row.id}
      columns={[
        { id: 'code', header: 'Code', cell: (row) => row.code },
        { id: 'name', header: 'Name', cell: (row) => row.name },
        { id: 'unit', header: 'Unit', cell: (row) => row.unit },
        {
          id: 'status',
          header: 'Status',
          cell: (row) => <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</StatusBadge>,
        },
      ]}
      canCreate={canCreate}
      rowActions={
        canUpdate
          ? (row) => <LinkButton href={`/${orgSlug}/records/products/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
          : undefined
      }
    />
  )
}
