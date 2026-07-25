import 'server-only'
import type { PlatformContext, PermissionRequirement } from '@/sdk'
import { sdk } from '@/sdk/server'
import { PRODUCT_PERMISSIONS } from '@/business-objects/product/permissions'
import { WAREHOUSE_PERMISSIONS } from '@/business-objects/warehouse/permissions'
import { SUPPLIER_PERMISSIONS } from '@/business-objects/supplier/permissions'
import { CUSTOMER_PERMISSIONS } from '@/business-objects/customer/permissions'
import { INVENTORY_PERMISSIONS } from '../permissions'
import { createInventoryTransactionEngine, type InventoryV2Db } from './engine'
import type { InventoryTransactionType, PostInput, ReversalCreateInput, TransactionQuery } from './schemas'

const POST: Record<InventoryTransactionType, PermissionRequirement> = {
  RECEIPT: INVENTORY_PERMISSIONS.RECEIPT_CREATE,
  ISSUE: INVENTORY_PERMISSIONS.ISSUE_CREATE,
  TRANSFER: INVENTORY_PERMISSIONS.TRANSFER_CREATE,
  ADJUSTMENT: INVENTORY_PERMISSIONS.ADJUSTMENT_CREATE,
}
const REVERSE: Record<InventoryTransactionType, PermissionRequirement> = {
  RECEIPT: INVENTORY_PERMISSIONS.RECEIPT_REVERSE,
  ISSUE: INVENTORY_PERMISSIONS.ISSUE_REVERSE,
  TRANSFER: INVENTORY_PERMISSIONS.TRANSFER_REVERSE,
  ADJUSTMENT: INVENTORY_PERMISSIONS.ADJUSTMENT_REVERSE,
}
const READ: Record<InventoryTransactionType, PermissionRequirement> = {
  RECEIPT: INVENTORY_PERMISSIONS.RECEIPT_READ,
  ISSUE: INVENTORY_PERMISSIONS.ISSUE_READ,
  TRANSFER: INVENTORY_PERMISSIONS.TRANSFER_READ,
  ADJUSTMENT: INVENTORY_PERMISSIONS.ADJUSTMENT_READ,
}

function engine(ctx: PlatformContext) {
  const db = sdk.getDb(ctx).prisma as InventoryV2Db
  return createInventoryTransactionEngine(db, {
    emit: async ({ name, payload }) => { await sdk.events.emit(ctx, name, payload) },
  })
}

async function requireRuntimeModule(ctx: PlatformContext): Promise<void> {
  sdk.runtime.requireInventoryV2()
  await sdk.modules.requireEnabled(ctx, 'inventory')
}

function canShowLabels(ctx: PlatformContext): boolean {
  return sdk.permissions.can(ctx, PRODUCT_PERMISSIONS.READ)
    && sdk.permissions.can(ctx, WAREHOUSE_PERMISSIONS.READ)
    && sdk.permissions.can(ctx, SUPPLIER_PERMISSIONS.READ)
    && sdk.permissions.can(ctx, CUSTOMER_PERMISSIONS.READ)
}

export const InventoryTransactionService = {
  async post(ctx: PlatformContext, type: InventoryTransactionType, input: PostInput, idempotencyKey: string) {
    await requireRuntimeModule(ctx)
    await sdk.permissions.require(ctx, POST[type])
    return engine(ctx).post(type, { orgId: ctx.org.id, userId: ctx.user.id, requestId: ctx.requestId }, input, idempotencyKey)
  },
  async reverse(ctx: PlatformContext, type: InventoryTransactionType, id: string, input: ReversalCreateInput, idempotencyKey: string) {
    await requireRuntimeModule(ctx)
    await sdk.permissions.require(ctx, READ[type])
    await sdk.permissions.require(ctx, REVERSE[type])
    return engine(ctx).reverse({ orgId: ctx.org.id, userId: ctx.user.id, requestId: ctx.requestId }, id, input, idempotencyKey)
  },
  async reverseById(ctx: PlatformContext, id: string, input: ReversalCreateInput, idempotencyKey: string) {
    await requireRuntimeModule(ctx)
    await sdk.permissions.requireAny(ctx, Object.values(READ))
    await sdk.permissions.requireAny(ctx, Object.values(REVERSE))
    const current = await engine(ctx).detail(ctx.org.id, id, false)
    const type = current.type as InventoryTransactionType
    await sdk.permissions.require(ctx, READ[type])
    await sdk.permissions.require(ctx, REVERSE[type])
    return engine(ctx).reverse({ orgId: ctx.org.id, userId: ctx.user.id, requestId: ctx.requestId }, id, input, idempotencyKey)
  },
  async detail(ctx: PlatformContext, id: string) {
    await requireRuntimeModule(ctx)
    await sdk.permissions.requireAny(ctx, Object.values(READ))
    const result = await engine(ctx).detail(ctx.org.id, id, canShowLabels(ctx))
    await sdk.permissions.require(ctx, READ[result.type as InventoryTransactionType])
    return result
  },
  async list(ctx: PlatformContext, type: InventoryTransactionType, query: TransactionQuery) {
    await requireRuntimeModule(ctx)
    await sdk.permissions.require(ctx, READ[type])
    return engine(ctx).list(ctx.org.id, { ...query, type }, canShowLabels(ctx))
  },
}
