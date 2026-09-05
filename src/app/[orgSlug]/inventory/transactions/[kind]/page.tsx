import { notFound } from 'next/navigation'
import { sdk } from '@/sdk/server'
import { transactionQuerySchema, type InventoryTransactionType } from '@/modules/inventory/transactions/schemas'
import { InventoryTransactionListPresenter } from '../../_components/inventory-transaction-presenters'
import { InventoryShell } from '../../_components/inventory-shell'

const types = {
  receipts: 'RECEIPT',
  issues: 'ISSUE',
  transfers: 'TRANSFER',
  adjustments: 'ADJUSTMENT',
} as const satisfies Record<string, InventoryTransactionType>

export default async function InventoryTransactionListPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; kind: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { orgSlug, kind } = await params
  const type = types[kind as keyof typeof types]
  if (!type) notFound()
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  sdk.runtime.requireInventoryV2()
  const query = transactionQuerySchema.parse(await searchParams)
  return (
    <InventoryShell orgSlug={orgSlug} activeItem={kind}>
      <InventoryTransactionListPresenter ctx={ctx} type={type} query={query} />
    </InventoryShell>
  )
}
