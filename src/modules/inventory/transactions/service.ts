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

type OptionRecord = { id: string; code?: string; name: string; unit?: string | null }
type OptionDb = {
  product: { findMany(args: unknown): Promise<OptionRecord[]> }
  warehouse: { findMany(args: unknown): Promise<OptionRecord[]> }
  supplier: { findMany(args: unknown): Promise<OptionRecord[]> }
  customer: { findMany(args: unknown): Promise<OptionRecord[]> }
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
    await sdk.permissions.require(ctx, PRODUCT_PERMISSIONS.READ)
    await sdk.permissions.require(ctx, WAREHOUSE_PERMISSIONS.READ)
    if (type === 'RECEIPT' && 'supplierId' in input && input.supplierId) {
      await sdk.permissions.require(ctx, SUPPLIER_PERMISSIONS.READ)
    }
    if (type === 'ISSUE' && 'customerId' in input && input.customerId) {
      await sdk.permissions.require(ctx, CUSTOMER_PERMISSIONS.READ)
    }
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
  async formOptions(ctx: PlatformContext) {
    await requireRuntimeModule(ctx)
    await sdk.permissions.requireAny(ctx, Object.values(POST))
    await sdk.permissions.require(ctx, PRODUCT_PERMISSIONS.READ)
    await sdk.permissions.require(ctx, WAREHOUSE_PERMISSIONS.READ)
    const db = sdk.getDb(ctx).prisma as OptionDb
    const [products, warehouses, suppliers, customers] = await Promise.all([
      db.product.findMany({
        where: {
          orgId: ctx.org.id,
          deletedAt: null,
          isActive: true,
          inventoryExtension: { deletedAt: null, isStockTracked: true },
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        take: 250,
        select: { id: true, code: true, name: true, unit: true },
      }),
      db.warehouse.findMany({
        where: { orgId: ctx.org.id, deletedAt: null, isActive: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        take: 250,
        select: { id: true, code: true, name: true },
      }),
      sdk.permissions.can(ctx, SUPPLIER_PERMISSIONS.READ)
        ? db.supplier.findMany({
            where: { orgId: ctx.org.id, deletedAt: null },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            take: 250,
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      sdk.permissions.can(ctx, CUSTOMER_PERMISSIONS.READ)
        ? db.customer.findMany({
            where: { orgId: ctx.org.id, deletedAt: null },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            take: 250,
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ])
    return {
      products: products.map((row) => ({
        id: row.id,
        label: `${row.code ?? ''}${row.code ? ' — ' : ''}${row.name}`,
        unit: row.unit ?? 'pcs',
      })),
      warehouses: warehouses.map((row) => ({
        id: row.id,
        label: `${row.code ?? ''}${row.code ? ' — ' : ''}${row.name}`,
      })),
      suppliers: suppliers.map((row) => ({ id: row.id, label: row.name })),
      customers: customers.map((row) => ({ id: row.id, label: row.name })),
    }
  },
}
