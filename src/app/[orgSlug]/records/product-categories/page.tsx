import { LinkButton } from '@/components/ui/button'
import { PRODUCT_CATEGORY_PERMISSIONS, ProductCategoryService } from '@/business-objects/product'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../_components/records-config'
import { RecordsListPage } from '../_components/records-list-page'

export default async function ProductCategoriesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const records = await ProductCategoryService.list(ctx, {})
  const area = getRecordArea('product-categories')
  const canCreate = sdk.permissions.can(ctx, PRODUCT_CATEGORY_PERMISSIONS.CREATE)
  const canUpdate = sdk.permissions.can(ctx, PRODUCT_CATEGORY_PERMISSIONS.UPDATE)

  return (
    <RecordsListPage
      orgSlug={orgSlug}
      area={area}
      rows={records}
      getRowId={(row) => row.id}
      columns={[
        { id: 'name', header: 'Name', cell: (row) => row.name },
      ]}
      canCreate={canCreate}
      rowActions={
        canUpdate
          ? (row) => <LinkButton href={`/${orgSlug}/records/product-categories/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
          : undefined
      }
    />
  )
}
