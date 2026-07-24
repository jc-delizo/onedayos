import { CUSTOMER_PERMISSIONS, CustomerService, customerListQuerySchema } from '@/business-objects/customer'
import {
  PRODUCT_CATEGORY_PERMISSIONS,
  PRODUCT_PERMISSIONS,
  ProductCategoryService,
  ProductService,
  productCategoryListQuerySchema,
  productListQuerySchema,
} from '@/business-objects/product'
import { SUPPLIER_PERMISSIONS, SupplierService, supplierListQuerySchema } from '@/business-objects/supplier'
import { WAREHOUSE_PERMISSIONS, WarehouseService, warehouseListQuerySchema } from '@/business-objects/warehouse'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { DetailPage } from '@/components/onedayos'
import { Surface } from '@/components/ui/surface'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { InventoryService } from '@/modules/inventory/service'
import type { PlatformContext } from '@/sdk'
import { sdk } from '@/sdk/server'
import { getRecordArea, type RecordAreaId } from './records-config'
import { RecordsFormPage } from './records-form-page'
import { RecordsListPage, type RecordsPageContext } from './records-list-page'
import { ProductInventorySettingsForm } from './product-inventory-settings-form'

export const inventoryRelatedRecordAreas = [
  'products',
  'product-categories',
  'customers',
  'suppliers',
  'warehouses',
] as const satisfies readonly RecordAreaId[]

export type InventoryRelatedRecordArea = (typeof inventoryRelatedRecordAreas)[number]

export function isInventoryRelatedRecordArea(value: string): value is InventoryRelatedRecordArea {
  return inventoryRelatedRecordAreas.includes(value as InventoryRelatedRecordArea)
}

function areaHref(ctx: PlatformContext, context: RecordsPageContext, areaId: InventoryRelatedRecordArea) {
  return context === 'inventory'
    ? `/${ctx.org.slug}/inventory/related/${areaId}`
    : `/${ctx.org.slug}/records/${areaId}`
}

export async function SharedRecordListPresenter({
  ctx,
  areaId,
  context,
  searchParams,
}: {
  ctx: PlatformContext
  areaId: InventoryRelatedRecordArea
  context: RecordsPageContext
  searchParams: Record<string, string | string[] | undefined>
}) {
  const orgSlug = ctx.org.slug
  const area = getRecordArea(areaId)
  const baseHref = areaHref(ctx, context, areaId)

  if (areaId === 'products') {
    const query = productListQuerySchema.parse(searchParams)
    const result = await ProductService.listPage(ctx, query)
    const records = result.rows as Array<(typeof result.rows)[number] & { category?: { name: string } | null }>
    const canCreate = sdk.permissions.can(ctx, PRODUCT_PERMISSIONS.CREATE)
    const canUpdate = sdk.permissions.can(ctx, PRODUCT_PERMISSIONS.UPDATE)
    const canManageTracking = context === 'inventory'
      && sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ)

    return (
      <RecordsListPage
        orgSlug={orgSlug}
        area={area}
        context={context}
        rows={records}
        v2={{ rows: records.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description,
          unit: row.unit,
          categoryName: row.category?.name ?? null,
          isActive: row.isActive,
        })), canUpdate, canExport: sdk.permissions.can(ctx, PRODUCT_PERMISSIONS.EXPORT), exportEndpoint: `/api/orgs/${orgSlug}/objects/products/export`, query: { ...query, filters: { isActive: query.isActive === undefined ? undefined : String(query.isActive) } }, pageMeta: result.meta }}
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
        secondaryActions={
          canManageTracking
            ? <LinkButton href={`/${orgSlug}/inventory/product-settings`} variant="secondary">Inventory settings</LinkButton>
            : undefined
        }
        rowActions={
          canUpdate
            ? (row) => <LinkButton href={`${baseHref}/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
            : undefined
        }
      />
    )
  }

  if (areaId === 'product-categories') {
    const query = productCategoryListQuerySchema.parse(searchParams)
    const result = await ProductCategoryService.listPage(ctx, query)
    const records = result.rows
    const canCreate = sdk.permissions.can(ctx, PRODUCT_CATEGORY_PERMISSIONS.CREATE)
    const canUpdate = sdk.permissions.can(ctx, PRODUCT_CATEGORY_PERMISSIONS.UPDATE)

    return (
      <RecordsListPage
        orgSlug={orgSlug}
        area={area}
        context={context}
        rows={records}
        v2={{ rows: records.map((row) => ({ id: row.id, name: row.name })), canUpdate, canExport: sdk.permissions.can(ctx, PRODUCT_CATEGORY_PERMISSIONS.EXPORT), exportEndpoint: `/api/orgs/${orgSlug}/objects/product-categories/export`, query, pageMeta: result.meta }}
        getRowId={(row) => row.id}
        columns={[{ id: 'name', header: 'Name', cell: (row) => row.name }]}
        canCreate={canCreate}
        rowActions={
          canUpdate
            ? (row) => <LinkButton href={`${baseHref}/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
            : undefined
        }
      />
    )
  }

  if (areaId === 'customers') {
    const query = customerListQuerySchema.parse(searchParams)
    const result = await CustomerService.listPage(ctx, query)
    const records = result.rows
    const canCreate = sdk.permissions.can(ctx, CUSTOMER_PERMISSIONS.CREATE)
    const canUpdate = sdk.permissions.can(ctx, CUSTOMER_PERMISSIONS.UPDATE)

    return (
      <RecordsListPage
        orgSlug={orgSlug}
        area={area}
        context={context}
        rows={records}
        v2={{ rows: records.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
        })), canUpdate, canExport: sdk.permissions.can(ctx, CUSTOMER_PERMISSIONS.EXPORT), exportEndpoint: `/api/orgs/${orgSlug}/objects/customers/export`, query, pageMeta: result.meta }}
        getRowId={(row) => row.id}
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'email', header: 'Email', cell: (row) => row.email ?? '—' },
          { id: 'phone', header: 'Phone', cell: (row) => row.phone ?? '—' },
        ]}
        canCreate={canCreate}
        rowActions={
          canUpdate
            ? (row) => <LinkButton href={`${baseHref}/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
            : undefined
        }
      />
    )
  }

  if (areaId === 'suppliers') {
    const query = supplierListQuerySchema.parse(searchParams)
    const result = await SupplierService.listPage(ctx, query)
    const records = result.rows
    const canCreate = sdk.permissions.can(ctx, SUPPLIER_PERMISSIONS.CREATE)
    const canUpdate = sdk.permissions.can(ctx, SUPPLIER_PERMISSIONS.UPDATE)

    return (
      <RecordsListPage
        orgSlug={orgSlug}
        area={area}
        context={context}
        rows={records}
        v2={{ rows: records.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
        })), canUpdate, canExport: sdk.permissions.can(ctx, SUPPLIER_PERMISSIONS.EXPORT), exportEndpoint: `/api/orgs/${orgSlug}/objects/suppliers/export`, query, pageMeta: result.meta }}
        getRowId={(row) => row.id}
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'email', header: 'Email', cell: (row) => row.email ?? '—' },
          { id: 'phone', header: 'Phone', cell: (row) => row.phone ?? '—' },
        ]}
        canCreate={canCreate}
        rowActions={
          canUpdate
            ? (row) => <LinkButton href={`${baseHref}/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
            : undefined
        }
      />
    )
  }

  const query = warehouseListQuerySchema.parse(searchParams)
  const result = await WarehouseService.listPage(ctx, query)
  const records = result.rows
  const canCreate = sdk.permissions.can(ctx, WAREHOUSE_PERMISSIONS.CREATE)
  const canUpdate = sdk.permissions.can(ctx, WAREHOUSE_PERMISSIONS.UPDATE)

  return (
    <RecordsListPage
      orgSlug={orgSlug}
      area={area}
      context={context}
      rows={records}
      v2={{ rows: records.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        address: row.address,
        isActive: row.isActive,
    })), canUpdate, canExport: sdk.permissions.can(ctx, WAREHOUSE_PERMISSIONS.EXPORT), exportEndpoint: `/api/orgs/${orgSlug}/objects/warehouses/export`, query: { ...query, filters: { isActive: query.isActive === undefined ? undefined : String(query.isActive) } }, pageMeta: result.meta }}
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
          ? (row) => <LinkButton href={`${baseHref}/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
          : undefined
      }
    />
  )
}

export async function SharedRecordFormPresenter({
  ctx,
  areaId,
  context,
  id,
  surface = 'page',
}: {
  ctx: PlatformContext
  areaId: InventoryRelatedRecordArea
  context: RecordsPageContext
  id?: string
  surface?: 'page' | 'modal'
}) {
  const orgSlug = ctx.org.slug
  const area = getRecordArea(areaId)

  if (areaId === 'products') {
    await sdk.permissions.require(ctx, id ? PRODUCT_PERMISSIONS.UPDATE : PRODUCT_PERMISSIONS.CREATE)
    const record = id ? await ProductService.getById(ctx, id) : null

    const formPage = (
      <RecordsFormPage
        orgSlug={orgSlug}
        area={area}
        context={context}
        id={id}
        initialValues={record ? {
          code: record.code,
          name: record.name,
          description: record.description,
          unit: record.unit,
          isActive: record.isActive,
        } : { isActive: true }}
        surface={surface}
      />
    )
    if (!id || !sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ)) return formPage
    const [setting] = await InventoryService.listProductSettings(ctx, { page: 1, pageSize: 1, productId: id })
    if (!setting) return formPage
    return (
      <div className="space-y-4">
        {formPage}
        <Surface className="space-y-3 p-4">
          <h2 className="text-sm font-semibold">Inventory Tracking</h2>
          <ProductInventorySettingsForm
            orgSlug={orgSlug}
            productId={id}
            initialTracked={setting.isStockTracked}
            initialReorderPoint={setting.reorderPoint}
            canUpdate={sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_UPDATE)}
          />
        </Surface>
      </div>
    )
  }

  if (areaId === 'product-categories') {
    await sdk.permissions.require(ctx, id ? PRODUCT_CATEGORY_PERMISSIONS.UPDATE : PRODUCT_CATEGORY_PERMISSIONS.CREATE)
    const record = id ? await ProductCategoryService.getById(ctx, id) : null
    return <RecordsFormPage orgSlug={orgSlug} area={area} context={context} id={id} initialValues={record ? { name: record.name } : undefined} surface={surface} />
  }

  if (areaId === 'customers') {
    await sdk.permissions.require(ctx, id ? CUSTOMER_PERMISSIONS.UPDATE : CUSTOMER_PERMISSIONS.CREATE)
    const record = id ? await CustomerService.getById(ctx, id) : null
    return (
      <RecordsFormPage
        orgSlug={orgSlug}
        area={area}
        context={context}
        id={id}
        initialValues={record ? { name: record.name, email: record.email, phone: record.phone, address: record.address } : undefined}
        surface={surface}
      />
    )
  }

  if (areaId === 'suppliers') {
    await sdk.permissions.require(ctx, id ? SUPPLIER_PERMISSIONS.UPDATE : SUPPLIER_PERMISSIONS.CREATE)
    const record = id ? await SupplierService.getById(ctx, id) : null
    return (
      <RecordsFormPage
        orgSlug={orgSlug}
        area={area}
        context={context}
        id={id}
        initialValues={record ? { name: record.name, email: record.email, phone: record.phone, address: record.address } : undefined}
        surface={surface}
      />
    )
  }

  await sdk.permissions.require(ctx, id ? WAREHOUSE_PERMISSIONS.UPDATE : WAREHOUSE_PERMISSIONS.CREATE)
  const record = id ? await WarehouseService.getById(ctx, id) : null
  return (
    <RecordsFormPage
      orgSlug={orgSlug}
      area={area}
      context={context}
      id={id}
      initialValues={record ? {
        code: record.code,
        name: record.name,
        address: record.address,
        isActive: record.isActive,
      } : { isActive: true }}
      surface={surface}
    />
  )
}

export async function SharedRecordDetailPresenter({
  ctx,
  areaId,
  context,
  id,
  surface = 'page',
}: {
  ctx: PlatformContext
  areaId: InventoryRelatedRecordArea
  context: RecordsPageContext
  id: string
  surface?: 'page' | 'modal'
}) {
  const area = getRecordArea(areaId)
  const baseHref = areaHref(ctx, context, areaId)
  let record: {
    id: string
    name: string
    code?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    description?: string | null
  }
  let canUpdate = false
  let inventorySetting: Awaited<ReturnType<typeof InventoryService.listProductSettings>>[number] | undefined

  if (areaId === 'products') {
    record = await ProductService.getById(ctx, id)
    canUpdate = sdk.permissions.can(ctx, PRODUCT_PERMISSIONS.UPDATE)
    if (sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ)) {
      ;[inventorySetting] = await InventoryService.listProductSettings(ctx, { page: 1, pageSize: 1, productId: id })
    }
  } else if (areaId === 'product-categories') {
    record = await ProductCategoryService.getById(ctx, id)
    canUpdate = sdk.permissions.can(ctx, PRODUCT_CATEGORY_PERMISSIONS.UPDATE)
  } else if (areaId === 'customers') {
    record = await CustomerService.getById(ctx, id)
    canUpdate = sdk.permissions.can(ctx, CUSTOMER_PERMISSIONS.UPDATE)
  } else if (areaId === 'suppliers') {
    record = await SupplierService.getById(ctx, id)
    canUpdate = sdk.permissions.can(ctx, SUPPLIER_PERMISSIONS.UPDATE)
  } else {
    record = await WarehouseService.getById(ctx, id)
    canUpdate = sdk.permissions.can(ctx, WAREHOUSE_PERMISSIONS.UPDATE)
  }

  const summary = (
    <dl className="grid gap-3 sm:grid-cols-2">
      {record.code ? <div><dt>Code</dt><dd>{record.code}</dd></div> : null}
      <div><dt>Name</dt><dd>{record.name}</dd></div>
      {record.email ? <div><dt>Email</dt><dd>{record.email}</dd></div> : null}
      {record.phone ? <div><dt>Phone</dt><dd>{record.phone}</dd></div> : null}
    </dl>
  )
  const inventorySection = inventorySetting ? (
    <Surface className="space-y-3 p-4">
      <h2 className="text-sm font-semibold">Inventory Tracking</h2>
      <ProductInventorySettingsForm
        orgSlug={ctx.org.slug}
        productId={id}
        initialTracked={inventorySetting.isStockTracked}
        initialReorderPoint={inventorySetting.reorderPoint}
        canUpdate={sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_UPDATE)}
      />
    </Surface>
  ) : null
  const sections = (
    <>
      <Surface className="p-4">
        <p className="text-sm text-[var(--color-muted)]">
          {record.description ?? record.address ?? `Read-only ${area.singular.toLowerCase()} details.`}
        </p>
      </Surface>
      {inventorySection}
    </>
  )

  if (surface === 'modal') {
    return (
      <div className="space-y-4">
        <Surface className="p-4" aria-label="Record summary">{summary}</Surface>
        {sections}
        {canUpdate ? <LinkButton href={`${baseHref}/${record.id}/edit`} variant="primary">Edit {area.singular}</LinkButton> : null}
      </div>
    )
  }

  return (
    <DetailPage
      breadcrumb={context === 'inventory'
        ? `Inventory / Related Records / ${area.label} / Detail`
        : `Shared Records / ${area.label} / Detail`}
      title={record.name}
      headerMode="compact"
      contextualHelp={context === 'inventory' ? area.inventoryOwnership : 'This identity is shared across enabled OneDayOS apps.'}
      primaryAction={canUpdate ? <LinkButton href={`${baseHref}/${record.id}/edit`} variant="primary">Edit {area.singular}</LinkButton> : undefined}
      summary={summary}
      sections={sections}
    />
  )
}
