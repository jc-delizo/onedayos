import { sdk } from '@/sdk/server'
import { ProcessFlowPage } from '@/components/onedayos'
import { inventoryProcessFlow } from '@/modules/inventory/process-flow'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { InventoryShell } from '../_components/inventory-shell'

export default async function InventoryProcessFlowPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, 'inventory')
  await sdk.permissions.require(ctx, INVENTORY_PERMISSIONS.DASHBOARD_READ)

  return (
    <InventoryShell orgSlug={orgSlug} activeItem="process-flow">
      <ProcessFlowPage breadcrumb="Inventory / Process Flow" definition={inventoryProcessFlow} />
    </InventoryShell>
  )
}
