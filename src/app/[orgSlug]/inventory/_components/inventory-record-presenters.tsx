import { notFound } from 'next/navigation'
import { DetailPage, EmptyState, FormPage } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { stockAdjustmentPrefillSchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import type { PlatformContext } from '@/sdk'
import { sdk } from '@/sdk/server'
import { StockAdjustmentForm } from './stock-adjustment-form'

type SurfaceMode = 'page' | 'modal'

export async function StockAdjustmentCreatePresenter({
  ctx,
  searchParams,
  surface = 'page',
}: {
  ctx: PlatformContext
  searchParams: Record<string, string | string[] | undefined>
  surface?: SurfaceMode
}) {
  const orgSlug = ctx.org.slug
  const options = await InventoryService.getStockAdjustmentFormOptions(ctx)
  const parsedPrefill = stockAdjustmentPrefillSchema.safeParse(searchParams)
  if (!parsedPrefill.success) notFound()
  const { productId, warehouseId } = parsedPrefill.data
  if (productId && !options.products.some((option) => option.id === productId)) notFound()
  if (warehouseId && !options.warehouses.some((option) => option.id === warehouseId)) notFound()
  const canPost = options.products.length > 0 && options.warehouses.length > 0
  const form = canPost ? (
    <StockAdjustmentForm orgSlug={orgSlug} options={options} initialProductId={productId} initialWarehouseId={warehouseId} />
  ) : (
    <EmptyState
      title="Products and Warehouses are required"
      description="Create shared Product and Warehouse records before posting stock adjustments."
      action={<LinkButton href={`/${orgSlug}/inventory/related/products`} size="sm" variant="secondary">Open Products</LinkButton>}
    />
  )
  if (surface === 'modal') return <Surface className="p-4">{form}</Surface>
  return (
    <FormPage
      breadcrumb="Inventory / New Adjustment"
      title="New Stock Adjustment"
      headerMode="compact"
      primaryAction={<LinkButton href={`/${orgSlug}/inventory/stock-adjustments`} variant="secondary">Back to Adjustments</LinkButton>}
      contextualHelp="Post a manual correction. Product and Warehouse identity come from Shared Records; Inventory computes balances on the server."
      form={form}
    />
  )
}

export async function StockLevelDetailPresenter({ ctx, id, surface = 'page' }: { ctx: PlatformContext; id: string; surface?: SurfaceMode }) {
  const row = await InventoryService.getStockLevel(ctx, id)
  const orgSlug = ctx.org.slug
  const actions = (
    <div className="flex flex-wrap gap-2">
      {sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE) ? (
        <LinkButton href={`/${orgSlug}/inventory/stock-adjustments/new?productId=${encodeURIComponent(row.productId)}&warehouseId=${encodeURIComponent(row.warehouseId)}`} variant="primary">Adjust Stock</LinkButton>
      ) : null}
      {sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ) ? (
        <LinkButton href={`/${orgSlug}/inventory/related/products/${row.productId}`} variant="secondary">Inventory Tracking Settings</LinkButton>
      ) : null}
    </div>
  )
  const summary = (
    <dl className="grid gap-3 sm:grid-cols-2">
      <div><dt>Product</dt><dd>{row.productName}</dd></div>
      <div><dt>Warehouse</dt><dd>{row.warehouseName}</dd></div>
      <div><dt>Current quantity</dt><dd>{row.quantity} {row.productUnit}</dd></div>
      <div><dt>Reorder point</dt><dd>{row.reorderPoint ?? 'Not set'}</dd></div>
      <div><dt>Status</dt><dd>{row.status === 'low_stock' ? 'Low Stock' : row.status === 'not_tracked' ? 'Not Tracked' : 'In Stock'}</dd></div>
    </dl>
  )
  if (surface === 'modal') return <div className="space-y-4"><Surface className="p-4">{summary}</Surface><p className="text-sm text-[var(--color-muted)]">This balance is calculated and cannot be edited directly.</p>{actions}</div>
  return (
    <DetailPage
      breadcrumb="Inventory / Stock Levels / Detail"
      title={`${row.productName} at ${row.warehouseName}`}
      headerMode="compact"
      summary={summary}
      sections={<p className="text-sm text-[var(--color-muted)]">This stock balance is calculated by Inventory posting rules and cannot be edited directly.</p>}
      actions={actions}
    />
  )
}

export async function StockMovementDetailPresenter({ ctx, id, surface = 'page' }: { ctx: PlatformContext; id: string; surface?: SurfaceMode }) {
  const row = await InventoryService.getStockMovement(ctx, id)
  const summary = <dl className="grid gap-3 sm:grid-cols-2"><div><dt>Product</dt><dd>{row.productName}</dd></div><div><dt>Warehouse</dt><dd>{row.warehouseName}</dd></div><div><dt>Quantity change</dt><dd>{row.quantityDelta}</dd></div><div><dt>Resulting quantity</dt><dd>{row.resultingQuantity ?? '—'}</dd></div><div><dt>Type</dt><dd>{row.type}</dd></div></dl>
  const sections = <p className="text-sm text-[var(--color-muted)]">{row.reason ?? 'No reason recorded.'} Stock Movements are immutable append-only ledger entries.</p>
  const metadata = <p className="text-sm">Occurred {new Date(row.occurredAt).toLocaleString()}</p>
  if (surface === 'modal') return <div className="space-y-4"><Surface className="p-4">{summary}</Surface>{sections}<Surface className="p-4">{metadata}</Surface></div>
  return <DetailPage breadcrumb="Inventory / Stock Movements / Detail" title={`${row.productName} movement`} headerMode="compact" contextualHelp="Stock Movements are immutable ledger entries." summary={summary} sections={sections} metadata={metadata} />
}

export async function StockAdjustmentDetailPresenter({ ctx, id, surface = 'page' }: { ctx: PlatformContext; id: string; surface?: SurfaceMode }) {
  const row = await InventoryService.getStockAdjustment(ctx, id)
  const summary = <dl className="grid gap-3 sm:grid-cols-2"><div><dt>Product</dt><dd>{row.productName}</dd></div><div><dt>Warehouse</dt><dd>{row.warehouseName}</dd></div><div><dt>Status</dt><dd>{row.status}</dd></div><div><dt>Before</dt><dd>{row.quantityBefore}</dd></div><div><dt>After</dt><dd>{row.quantityAfter}</dd></div><div><dt>Delta</dt><dd>{row.quantityDelta}</dd></div></dl>
  const sections = <p className="text-sm text-[var(--color-muted)]">{row.reason} Posted adjustments are read-only.</p>
  const metadata = <p className="text-sm">Posted {new Date(row.createdAt).toLocaleString()} by {row.createdByName}</p>
  if (surface === 'modal') return <div className="space-y-4"><Surface className="p-4">{summary}</Surface>{sections}<Surface className="p-4">{metadata}</Surface></div>
  return <DetailPage breadcrumb="Inventory / Stock Adjustments / Detail" title={`${row.productName} adjustment`} headerMode="compact" contextualHelp="Posted stock adjustments are read-only." summary={summary} sections={sections} metadata={metadata} />
}
