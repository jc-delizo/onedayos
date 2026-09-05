import { notFound } from 'next/navigation'
import { sdk } from '@/sdk/server'
import { InventoryTransactionDetailPresenter } from '../../../_components/inventory-transaction-presenters'
import { InventoryShell } from '../../../_components/inventory-shell'

const kinds = new Set(['receipts', 'issues', 'transfers', 'adjustments'])

export default async function InventoryTransactionDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; kind: string; id: string }>
}) {
  const { orgSlug, kind, id } = await params
  if (!kinds.has(kind)) notFound()
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  sdk.runtime.requireInventoryV2()
  return <InventoryShell orgSlug={orgSlug} activeItem={kind}><InventoryTransactionDetailPresenter ctx={ctx} id={id} /></InventoryShell>
}
