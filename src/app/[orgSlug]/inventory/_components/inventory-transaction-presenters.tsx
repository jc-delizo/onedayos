import { DetailPage, EmptyState, FormPage, ListPage } from '@/components/onedayos'
import type { DataTablePageMeta } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import type { InventoryTransactionType, TransactionQuery } from '@/modules/inventory/transactions/schemas'
import { InventoryTransactionService } from '@/modules/inventory/transactions/service'
import type {
  InventoryTransactionDto,
  InventoryTransactionFormOptions,
} from '@/modules/inventory/transactions/ui-types'
import type { PlatformContext, PermissionRequirement } from '@/sdk'
import { sdk } from '@/sdk/server'
import { InventoryTransactionForm, InventoryTransactionReverseForm } from './inventory-transaction-form'
import { InventoryTransactionsDataTable } from './inventory-transaction-table'

type SurfaceMode = 'page' | 'modal'

export const transactionUi = {
  RECEIPT: { singular: 'Receipt', plural: 'Receipts', segment: 'receipts' },
  ISSUE: { singular: 'Issue', plural: 'Issues', segment: 'issues' },
  TRANSFER: { singular: 'Transfer', plural: 'Transfers', segment: 'transfers' },
  ADJUSTMENT: { singular: 'Adjustment', plural: 'Adjustments', segment: 'adjustments' },
} as const

const createPermission: Record<InventoryTransactionType, PermissionRequirement> = {
  RECEIPT: INVENTORY_PERMISSIONS.RECEIPT_CREATE,
  ISSUE: INVENTORY_PERMISSIONS.ISSUE_CREATE,
  TRANSFER: INVENTORY_PERMISSIONS.TRANSFER_CREATE,
  ADJUSTMENT: INVENTORY_PERMISSIONS.ADJUSTMENT_CREATE,
}

const reversePermission: Record<InventoryTransactionType, PermissionRequirement> = {
  RECEIPT: INVENTORY_PERMISSIONS.RECEIPT_REVERSE,
  ISSUE: INVENTORY_PERMISSIONS.ISSUE_REVERSE,
  TRANSFER: INVENTORY_PERMISSIONS.TRANSFER_REVERSE,
  ADJUSTMENT: INVENTORY_PERMISSIONS.ADJUSTMENT_REVERSE,
}

function transactionLocation(row: InventoryTransactionDto): string {
  if (row.type === 'TRANSFER') {
    return `${row.sourceWarehouse?.name ?? 'Warehouse'} → ${row.destinationWarehouse?.name ?? 'Warehouse'}`
  }
  return row.warehouse?.name ?? 'Warehouse'
}

export async function InventoryTransactionListPresenter({
  ctx,
  type,
  query,
}: {
  ctx: PlatformContext
  type: InventoryTransactionType
  query: TransactionQuery
}) {
  const config = transactionUi[type]
  const [rawResult, options] = await Promise.all([
    InventoryTransactionService.list(ctx, type, query),
    InventoryTransactionService.formOptions(ctx),
  ])
  const result = rawResult as unknown as { rows: InventoryTransactionDto[]; meta: DataTablePageMeta }
  const canCreate = sdk.permissions.can(ctx, createPermission[type])
  const canReverse = sdk.permissions.can(ctx, reversePermission[type])
  const canExport = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.TRANSACTION_EXPORT)
  return (
    <ListPage
      breadcrumb={`Inventory / Transactions / ${config.plural}`}
      title={config.plural}
      headerMode="compact"
      primaryAction={canCreate ? <LinkButton href={`/${ctx.org.slug}/inventory/transactions/${config.segment}/new`} target="_top" variant="primary">New {config.singular}</LinkButton> : undefined}
    >
      <InventoryTransactionsDataTable
        orgSlug={ctx.org.slug}
        type={type}
        rows={result.rows}
        query={query}
        pageMeta={result.meta}
        warehouseOptions={options.warehouses}
        canReverse={canReverse}
        canExport={canExport}
      />
    </ListPage>
  )
}

export async function InventoryTransactionCreatePresenter({
  ctx,
  type,
  surface = 'page',
}: {
  ctx: PlatformContext
  type: InventoryTransactionType
  surface?: SurfaceMode
}) {
  const config = transactionUi[type]
  await sdk.permissions.require(ctx, createPermission[type])
  const options = await InventoryTransactionService.formOptions(ctx) as InventoryTransactionFormOptions
  const form = options.products.length > 0 && options.warehouses.length > 0
    ? <InventoryTransactionForm orgSlug={ctx.org.slug} type={type} options={options} />
    : <EmptyState title="Products and Warehouses are required" description="Create shared records and enable Inventory tracking before posting." />
  if (surface === 'modal') return <Surface className="p-4">{form}</Surface>
  return (
    <FormPage
      breadcrumb={`Inventory / Transactions / ${config.plural} / New`}
      title={`New ${config.singular}`}
      headerMode="compact"
      contextualHelp="Posting is atomic and immediately updates the immutable movement ledger and current balances."
      primaryAction={<LinkButton href={`/${ctx.org.slug}/inventory/transactions/${config.segment}`} variant="secondary">Back to {config.plural}</LinkButton>}
      form={form}
    />
  )
}

export async function InventoryTransactionDetailPresenter({
  ctx,
  id,
  surface = 'page',
}: {
  ctx: PlatformContext
  id: string
  surface?: SurfaceMode
}) {
  const row = await InventoryTransactionService.detail(ctx, id) as unknown as InventoryTransactionDto
  const config = transactionUi[row.type]
  const canReverse = row.status === 'POSTED' && sdk.permissions.can(ctx, reversePermission[row.type])
  const summary = (
    <dl className="grid gap-3 sm:grid-cols-2">
      <div><dt>Transaction</dt><dd>{row.transactionNumber}</dd></div>
      <div><dt>Status</dt><dd><StatusBadge variant={row.status === 'POSTED' ? 'success' : 'neutral'}>{row.status}</StatusBadge></dd></div>
      <div><dt>Warehouse</dt><dd>{transactionLocation(row)}</dd></div>
      <div><dt>Reference</dt><dd>{row.referenceNumber ?? '—'}</dd></div>
      <div><dt>Reference date</dt><dd>{row.referenceDate ? new Date(row.referenceDate).toLocaleDateString() : '—'}</dd></div>
      <div><dt>{row.type === 'RECEIPT' ? 'Supplier' : row.type === 'ISSUE' ? 'Customer' : 'Party'}</dt><dd>{row.supplier?.name ?? row.customer?.name ?? '—'}</dd></div>
    </dl>
  )
  const sections = (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Product lines</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Line</th><th className="p-2">Product</th><th className="p-2">Quantity</th><th className="p-2">Notes</th></tr></thead>
          <tbody>{row.lines.map((line) => <tr key={line.id} className="border-b"><td className="p-2">{line.lineNumber}</td><td className="p-2">{line.product ? `${line.product.code} — ${line.product.name}` : line.productId}</td><td className="p-2">{line.quantity} {line.unit}</td><td className="p-2">{line.notes ?? '—'}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="text-sm text-[var(--color-muted)]">{row.reason ?? row.notes ?? 'No additional notes.'}</p>
      {row.reversal ? <p className="text-sm">Reversed by {row.reversal.transactionNumber}.</p> : null}
      {row.reversalOf ? <p className="text-sm">Reversal of {row.reversalOf.transactionNumber}.</p> : null}
    </div>
  )
  const actions = canReverse
    ? <LinkButton href={`/${ctx.org.slug}/inventory/transactions/${config.segment}/${row.id}/reverse`} variant="destructive">Reverse {config.singular}</LinkButton>
    : undefined
  const metadata = <p className="text-sm">Posted {new Date(row.postedAt).toLocaleString()} by {row.postedBy?.name ?? 'Inventory user'}.</p>
  if (surface === 'modal') return <div className="space-y-4"><Surface className="p-4">{summary}</Surface>{sections}{actions}</div>
  return <DetailPage breadcrumb={`Inventory / ${config.plural} / Detail`} title={row.transactionNumber} headerMode="compact" contextualHelp="Posted transactions are read-only." summary={summary} sections={sections} metadata={metadata} actions={actions} />
}

export async function InventoryTransactionReversePresenter({
  ctx,
  id,
  surface = 'page',
}: {
  ctx: PlatformContext
  id: string
  surface?: SurfaceMode
}) {
  const row = await InventoryTransactionService.detail(ctx, id) as unknown as InventoryTransactionDto
  const config = transactionUi[row.type]
  await sdk.permissions.require(ctx, reversePermission[row.type])
  const closeHref = `/${ctx.org.slug}/inventory/transactions/${config.segment}/${row.id}`
  const form = <InventoryTransactionReverseForm orgSlug={ctx.org.slug} transactionId={row.id} closeHref={closeHref} />
  if (surface === 'modal') return <Surface className="p-4">{form}</Surface>
  return <FormPage breadcrumb={`Inventory / ${config.plural} / Reverse`} title={`Reverse ${row.transactionNumber}`} headerMode="compact" contextualHelp="Review the immutable transaction before appending its inverse movements." primaryAction={<LinkButton href={closeHref} variant="secondary">Back to Detail</LinkButton>} form={form} />
}
