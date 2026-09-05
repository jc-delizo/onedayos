import { notFound } from 'next/navigation'
import { sdk } from '@/sdk/server'
import type { InventoryTransactionType } from '@/modules/inventory/transactions/schemas'
import { InventoryTransactionCreatePresenter } from '../../../_components/inventory-transaction-presenters'
import { InventoryShell } from '../../../_components/inventory-shell'

const types = { receipts: 'RECEIPT', issues: 'ISSUE', transfers: 'TRANSFER', adjustments: 'ADJUSTMENT' } as const satisfies Record<string, InventoryTransactionType>

export default async function NewInventoryTransactionPage({
  params,
}: {
  params: Promise<{ orgSlug: string; kind: string }>
}) {
  const { orgSlug, kind } = await params
  const type = types[kind as keyof typeof types]
  if (!type) notFound()
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  sdk.runtime.requireInventoryV2()
  return <InventoryShell orgSlug={orgSlug} activeItem={kind}><InventoryTransactionCreatePresenter ctx={ctx} type={type} /></InventoryShell>
}
