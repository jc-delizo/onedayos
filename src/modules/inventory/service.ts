import 'server-only'
import { sdk } from '@/sdk/server'
import type { ApiErrorCode, PermissionRequirement, PlatformContext } from '@/sdk'
import {
  inventoryEvents,
  productExtensionPayloadSchema,
  reorderThresholdCrossedPayloadSchema,
  stockAdjustmentCreatedPayloadSchema,
  stockBalanceUpdatedPayloadSchema,
  stockMovementCreatedPayloadSchema,
} from './events'
import { INVENTORY_PERMISSIONS } from './permissions'
import type {
  CreateStockAdjustmentInput,
  ProductSettingListQuery,
  StockAdjustmentQuery,
  StockLevelQuery,
  StockMovementQuery,
  UpsertProductSettingInput,
} from './schema'
import type {
  InventoryDashboard,
  InventoryDashboardKpis,
  InventoryFormOption,
  InventoryProductSettingListItem,
  MovementTrendDatum,
  StockAdjustmentCreated,
  StockAdjustmentFormOptions,
  StockAdjustmentListItem,
  StockHealthDatum,
  InventoryPage,
  StockLevelListItem,
  StockMovementListItem,
  StockStatus,
  WarehouseStockDatum,
} from './types'

type DecimalLike = string | number | { toString(): string } | null | undefined

type ProductRecord = {
  id: string
  code: string
  name: string
  unit?: string | null
  deletedAt?: Date | string | null
  isActive?: boolean
  category?: { name: string } | null
  inventoryExtension?: InventoryProductExtensionRecord | null
}

type WarehouseRecord = {
  id: string
  code: string
  name: string
  deletedAt?: Date | string | null
  isActive?: boolean
}

type UserRecord = {
  id: string
  name: string
}

type InventoryProductExtensionRecord = {
  id: string
  productId: string
  reorderPoint: DecimalLike
  isStockTracked: boolean
  updatedAt: Date | string
  deletedAt?: Date | string | null
  product?: ProductRecord
}

type StockBalanceRecord = {
  id: string
  productId: string
  warehouseId: string
  quantity: DecimalLike
  updatedAt: Date | string
  product: ProductRecord
  warehouse: WarehouseRecord
}

type StockMovementRecord = {
  id: string
  productId: string
  warehouseId: string
  type: string
  quantityDelta: DecimalLike
  resultingQuantity: DecimalLike
  sourceType?: string | null
  sourceId?: string | null
  reason?: string | null
  occurredAt: Date | string
  createdBy: string
  actor?: UserRecord | null
  product: ProductRecord
  warehouse: WarehouseRecord
}

type StockAdjustmentRecord = {
  id: string
  productId: string
  warehouseId: string
  quantityBefore: DecimalLike
  quantityAfter: DecimalLike
  quantityDelta: DecimalLike
  reason: string
  notes?: string | null
  status: string
  createdAt: Date | string
  createdBy: string
  actor?: UserRecord | null
  product: ProductRecord
  warehouse: WarehouseRecord
}

type Delegate<TRecord> = {
  findMany(args: unknown): Promise<TRecord[]>
  findFirst(args: unknown): Promise<TRecord | null>
  create(args: unknown): Promise<TRecord>
  update(args: unknown): Promise<TRecord>
  count?(args: unknown): Promise<number>
}

type InventoryPrisma = {
  product: Pick<Delegate<ProductRecord>, 'findMany' | 'findFirst' | 'count'>
  warehouse: Pick<Delegate<WarehouseRecord>, 'findMany' | 'findFirst' | 'count'>
  inventoryProductExtension: Delegate<InventoryProductExtensionRecord>
  stockBalance: Delegate<StockBalanceRecord>
  stockMovement: Delegate<StockMovementRecord>
  stockAdjustment: Delegate<StockAdjustmentRecord>
  $transaction<T>(callback: (tx: InventoryPrisma) => Promise<T>): Promise<T>
}

type DashboardProductExtensionRecord = InventoryProductExtensionRecord & {
  product: ProductRecord
}

const DASHBOARD_MOVEMENT_TYPES = [
  'opening_balance',
  'adjustment_in',
  'adjustment_out',
  'receipt_in',
  'issue_out',
  'transfer_in',
  'transfer_out',
  'reversal_in',
  'reversal_out',
] as const

export const DASHBOARD_AGGREGATION_MAX_CANDIDATES = 50_000

type DashboardMovementType = (typeof DASHBOARD_MOVEMENT_TYPES)[number]

function isDashboardMovementType(value: string): value is DashboardMovementType {
  return (DASHBOARD_MOVEMENT_TYPES as readonly string[]).includes(value)
}

type InventoryEvent = {
  name: string
  payload: Record<string, unknown>
}

export class InventoryServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode = 'VALIDATION_ERROR',
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'InventoryServiceError'
  }
}

export function isInventoryServiceError(error: unknown): error is InventoryServiceError {
  return error instanceof InventoryServiceError
}

function getInventoryPrisma(ctx: PlatformContext): InventoryPrisma {
  return sdk.getDb(ctx).prisma as InventoryPrisma
}

async function requireInventoryPermission(
  ctx: PlatformContext,
  requirement: PermissionRequirement,
): Promise<void> {
  await sdk.modules.requireEnabled(ctx, 'inventory')
  await sdk.permissions.require(ctx, requirement)
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function decimalToUnits(value: DecimalLike): bigint {
  const raw = String(value ?? '0').trim()

  if (!/^-?\d+(?:\.\d{1,4})?$/.test(raw)) {
    throw new InventoryServiceError('Quantity must be a decimal with up to four decimal places.')
  }

  const sign = raw.startsWith('-') ? -1n : 1n
  const unsigned = raw.replace(/^-/, '')
  const [whole, fraction = ''] = unsigned.split('.')
  return sign * (BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, '0')))
}

function formatUnits(units: bigint): string {
  const sign = units < 0n ? '-' : ''
  const absolute = units < 0n ? -units : units
  const whole = absolute / 10000n
  const fraction = String(absolute % 10000n).padStart(4, '0').replace(/0+$/, '')
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`
}

function decimalString(value: DecimalLike): string {
  return formatUnits(decimalToUnits(value))
}

function unitsToNumber(units: bigint): number {
  return Number(formatUnits(units))
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function addUtcDays(value: Date, days: number): Date {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function utcDateKey(value: Date | string): string {
  return toIso(value).slice(0, 10)
}

export function buildMovementTrend(
  records: Array<Pick<StockMovementRecord, 'type' | 'quantityDelta' | 'occurredAt'>>,
  now: Date,
  options: { inventoryV2Enabled?: boolean } = {},
): { data: MovementTrendDatum[]; start: Date; end: Date } {
  const today = startOfUtcDay(now)
  const start = addUtcDays(today, -29)
  const end = addUtcDays(today, 1)
  const byDate = new Map<string, MovementTrendDatum>()

  for (let offset = 0; offset < 30; offset += 1) {
    const date = utcDateKey(addUtcDays(start, offset))
    byDate.set(date, { date, inbound: 0, outbound: 0 })
  }

  for (const record of records) {
    if (!isDashboardMovementType(record.type)) {
      throw new InventoryServiceError(
        'The movement trend contains an unsupported movement type.',
        'INTERNAL_ERROR',
        500,
      )
    }
    if (!options.inventoryV2Enabled && !['opening_balance', 'adjustment_in', 'adjustment_out'].includes(record.type)) {
      throw new InventoryServiceError(
        'The legacy movement trend contains a V2 movement while Inventory V2 is disabled.',
        'INTERNAL_ERROR',
        500,
      )
    }

    const bucket = byDate.get(utcDateKey(record.occurredAt))
    if (!bucket) continue
    if (record.type === 'transfer_in' || record.type === 'transfer_out') continue
    const magnitude = unitsToNumber(decimalToUnits(record.quantityDelta))

    if (['opening_balance', 'adjustment_in', 'receipt_in', 'reversal_in'].includes(record.type)) {
      bucket.inbound += Math.abs(magnitude)
    } else {
      bucket.outbound += Math.abs(magnitude)
    }
  }

  return { data: [...byDate.values()], start, end }
}

export function buildDashboardStockSummary(
  extensions: DashboardProductExtensionRecord[],
  balances: StockBalanceRecord[],
  warehouses: WarehouseRecord[],
): {
  kpis: InventoryDashboardKpis
  stockHealth: StockHealthDatum[]
  warehouseStock: WarehouseStockDatum[]
} {
  const extensionByProduct = new Map(extensions.map((extension) => [extension.productId, extension]))
  const productTotals = new Map(extensions.map((extension) => [extension.productId, 0n]))
  const warehouseRows = new Map(
    warehouses.map((warehouse) => [
      warehouse.id,
      {
        warehouseName: warehouse.name,
        trackedPositions: new Set<string>(),
        lowStockPositions: new Set<string>(),
        outOfStockPositions: new Set<string>(),
        hasPositiveStock: false,
      },
    ]),
  )

  for (const balance of balances) {
    const extension = extensionByProduct.get(balance.productId)
    const warehouse = warehouseRows.get(balance.warehouseId)
    if (!extension || !warehouse) continue

    const quantity = decimalToUnits(balance.quantity)
    productTotals.set(balance.productId, (productTotals.get(balance.productId) ?? 0n) + quantity)
    warehouse.trackedPositions.add(balance.productId)
    warehouse.hasPositiveStock ||= quantity > 0n

    const reorderPoint = decimalToUnits(extension.reorderPoint)
    if (quantity <= 0n) warehouse.outOfStockPositions.add(balance.productId)
    else if (reorderPoint > 0n && quantity <= reorderPoint) warehouse.lowStockPositions.add(balance.productId)
  }

  let inStock = 0
  let lowStock = 0
  let outOfStock = 0

  for (const extension of extensions) {
    const quantity = productTotals.get(extension.productId) ?? 0n
    const reorderPoint = decimalToUnits(extension.reorderPoint)
    if (quantity <= 0n) outOfStock += 1
    else if (reorderPoint > 0n && quantity <= reorderPoint) lowStock += 1
    else inStock += 1
  }

  const warehouseStock = [...warehouseRows.values()]
    .map((warehouse): WarehouseStockDatum => ({
      warehouseName: warehouse.warehouseName,
      trackedPositions: warehouse.trackedPositions.size,
      lowStockPositions: warehouse.lowStockPositions.size,
      outOfStockPositions: warehouse.outOfStockPositions.size,
    }))
    .sort((left, right) => (
      right.trackedPositions - left.trackedPositions
      || left.warehouseName.localeCompare(right.warehouseName)
    ))

  return {
    kpis: {
      trackedProducts: extensions.length,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
      warehousesWithStock: [...warehouseRows.values()].filter((warehouse) => warehouse.hasPositiveStock).length,
    },
    stockHealth: [
      { status: 'in_stock', label: 'In Stock', count: inStock },
      { status: 'low_stock', label: 'Low Stock', count: lowStock },
      { status: 'out_of_stock', label: 'Out of Stock', count: outOfStock },
    ],
    warehouseStock,
  }
}

export function assertDashboardAggregationCapacity(counts: {
  trackedProducts: number
  balances: number
  warehouses: number
  movements: number
}): void {
  const candidateCount = counts.trackedProducts + counts.balances + counts.warehouses + counts.movements

  if (candidateCount > DASHBOARD_AGGREGATION_MAX_CANDIDATES) {
    throw new InventoryServiceError(
      'Dashboard analytics exceed the current exact-processing limit. Narrow the operational scope or contact an administrator while aggregate optimization is prepared.',
      'VALIDATION_ERROR',
      422,
    )
  }
}

function relationWhere(ctx: PlatformContext, id: string) {
  return {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  }
}

async function requireProduct(
  prisma: InventoryPrisma,
  ctx: PlatformContext,
  productId: string,
): Promise<ProductRecord> {
  const product = await prisma.product.findFirst({
    where: {
      ...relationWhere(ctx, productId),
      isActive: true,
    },
    include: {
      category: true,
    },
  })

  if (!product) {
    throw new InventoryServiceError('Product was not found for this organization.', 'NOT_FOUND', 404)
  }

  return product
}

async function requireWarehouse(
  prisma: InventoryPrisma,
  ctx: PlatformContext,
  warehouseId: string,
): Promise<WarehouseRecord> {
  const warehouse = await prisma.warehouse.findFirst({
    where: {
      ...relationWhere(ctx, warehouseId),
      isActive: true,
    },
  })

  if (!warehouse) {
    throw new InventoryServiceError('Warehouse was not found for this organization.', 'NOT_FOUND', 404)
  }

  return warehouse
}

function productSettingDto(product: ProductRecord): InventoryProductSettingListItem {
  const extension = product.inventoryExtension

  return {
    id: extension?.id ?? `new:${product.id}`,
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    productUnit: product.unit ?? 'pcs',
    categoryName: product.category?.name ?? null,
    reorderPoint: decimalString(extension?.reorderPoint ?? 0),
    isStockTracked: extension?.isStockTracked ?? true,
    updatedAt: extension ? toIso(extension.updatedAt) : '',
  }
}

function stockStatus(quantity: DecimalLike, extension?: InventoryProductExtensionRecord | null): StockStatus {
  if (extension && !extension.isStockTracked) {
    return 'not_tracked'
  }

  const reorderPoint = decimalToUnits(extension?.reorderPoint ?? 0)
  if (reorderPoint > 0n && decimalToUnits(quantity) <= reorderPoint) {
    return 'low_stock'
  }

  return 'ok'
}

function stockLevelDto(record: StockBalanceRecord): StockLevelListItem {
  const extension = record.product.inventoryExtension
  const status = stockStatus(record.quantity, extension)

  return {
    id: record.id,
    productId: record.productId,
    productCode: record.product.code,
    productName: record.product.name,
    productUnit: record.product.unit ?? 'pcs',
    categoryName: record.product.category?.name ?? null,
    warehouseId: record.warehouseId,
    warehouseCode: record.warehouse.code,
    warehouseName: record.warehouse.name,
    quantity: decimalString(record.quantity),
    reorderPoint: extension ? decimalString(extension.reorderPoint) : null,
    isLowStock: status === 'low_stock',
    status,
    updatedAt: toIso(record.updatedAt),
  }
}

function movementDto(record: StockMovementRecord): StockMovementListItem {
  return {
    id: record.id,
    productId: record.productId,
    productCode: record.product.code,
    productName: record.product.name,
    warehouseId: record.warehouseId,
    warehouseName: record.warehouse.name,
    type: record.type,
    quantityDelta: decimalString(record.quantityDelta),
    resultingQuantity: record.resultingQuantity == null ? null : decimalString(record.resultingQuantity),
    reason: record.reason ?? null,
    sourceType: record.sourceType ?? null,
    sourceId: record.sourceId ?? null,
    occurredAt: toIso(record.occurredAt),
    createdByName: record.actor?.name ?? record.createdBy,
  }
}

function adjustmentDto(record: StockAdjustmentRecord): StockAdjustmentListItem {
  return {
    id: record.id,
    productId: record.productId,
    productCode: record.product.code,
    productName: record.product.name,
    warehouseId: record.warehouseId,
    warehouseName: record.warehouse.name,
    quantityBefore: decimalString(record.quantityBefore),
    quantityAfter: decimalString(record.quantityAfter),
    quantityDelta: decimalString(record.quantityDelta),
    reason: record.reason,
    notes: record.notes ?? null,
    status: record.status,
    createdAt: toIso(record.createdAt),
    createdByName: record.actor?.name ?? record.createdBy,
  }
}

function pagination(query: { page: number; pageSize: number }) {
  return {
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  }
}

function productSearch(search: string | undefined) {
  if (!search) return undefined
  return [
    { code: { contains: search, mode: 'insensitive' } },
    { name: { contains: search, mode: 'insensitive' } },
  ]
}

function activeProductWhere(ctx: PlatformContext, query?: { search?: string; productId?: string }) {
  const where: Record<string, unknown> = {
    orgId: ctx.org.id,
    deletedAt: null,
    isActive: true,
  }
  const search = productSearch(query?.search)

  if (query?.productId) where.id = query.productId
  if (search) where.OR = search

  return where
}

function activeWarehouseWhere(ctx: PlatformContext, warehouseId?: string) {
  return {
    orgId: ctx.org.id,
    deletedAt: null,
    isActive: true,
    ...(warehouseId ? { id: warehouseId } : {}),
  }
}

async function emitInventoryEvents(ctx: PlatformContext, events: InventoryEvent[]) {
  for (const event of events) {
    if ('orgId' in event.payload) {
      throw new InventoryServiceError('Inventory event payloads must not expose tenant identity.', 'INTERNAL_ERROR', 500)
    }

    await sdk.events.emit(ctx, event.name, event.payload)
  }
}

export class InventoryService {
  static async listWarehouseFilterOptions(
    ctx: PlatformContext,
    requirement: PermissionRequirement,
  ): Promise<InventoryFormOption[]> {
    await requireInventoryPermission(ctx, requirement)
    const prisma = getInventoryPrisma(ctx)
    const where = activeWarehouseWhere(ctx)
    const count = prisma.warehouse.count
    if (!count) throw new InventoryServiceError('Warehouse filters are temporarily unavailable.', 'INTERNAL_ERROR', 500)
    const total = await count.call(prisma.warehouse, { where })
    if (total > 250) {
      throw new InventoryServiceError(
        'There are too many warehouses to build this filter safely. Contact an administrator.',
        'VALIDATION_ERROR',
        400,
      )
    }
    const rows = await prisma.warehouse.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: 250,
    })
    return rows.map((warehouse) => ({
      id: warehouse.id,
      label: `${warehouse.code} - ${warehouse.name}`,
    }))
  }

  static async getDashboard(
    ctx: PlatformContext,
    options: { now?: Date } = {},
  ): Promise<InventoryDashboard> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.DASHBOARD_READ)

    const canReadMovements = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ)
    const canReadAdjustments = sdk.permissions.can(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ)
    const now = options.now ?? new Date()
    const rangeStart = addUtcDays(startOfUtcDay(now), -29)
    const rangeEnd = addUtcDays(startOfUtcDay(now), 1)

    const prisma = getInventoryPrisma(ctx)
    const extensionWhere = {
      orgId: ctx.org.id,
      deletedAt: null,
      isStockTracked: true,
      product: activeProductWhere(ctx),
    }
    const balanceWhere = {
      orgId: ctx.org.id,
      product: {
        ...activeProductWhere(ctx),
        inventoryExtension: {
          deletedAt: null,
          isStockTracked: true,
        },
      },
      warehouse: activeWarehouseWhere(ctx),
    }
    const warehouseWhere = activeWarehouseWhere(ctx)
    const movementWhere = {
      orgId: ctx.org.id,
      occurredAt: {
        gte: rangeStart,
        lt: rangeEnd,
      },
      product: activeProductWhere(ctx),
      warehouse: activeWarehouseWhere(ctx),
    }
    const extensionCount = prisma.inventoryProductExtension.count
    const balanceCount = prisma.stockBalance.count
    const warehouseCount = prisma.warehouse.count
    const movementCount = prisma.stockMovement.count
    if (!extensionCount || !balanceCount || !warehouseCount || !movementCount) {
      throw new InventoryServiceError(
        'Dashboard analytics are temporarily unavailable.',
        'INTERNAL_ERROR',
        500,
      )
    }
    const [trackedProductCandidates, balanceCandidates, warehouseCandidates, movementCandidates] = await Promise.all([
      extensionCount.call(prisma.inventoryProductExtension, { where: extensionWhere }),
      balanceCount.call(prisma.stockBalance, { where: balanceWhere }),
      warehouseCount.call(prisma.warehouse, { where: warehouseWhere }),
      movementCount.call(prisma.stockMovement, { where: movementWhere }),
    ])
    assertDashboardAggregationCapacity({
      trackedProducts: trackedProductCandidates,
      balances: balanceCandidates,
      warehouses: warehouseCandidates,
      movements: movementCandidates,
    })

    const [extensions, balances, warehouses, trendRecords, recentMovements, recentAdjustments] = await Promise.all([
      prisma.inventoryProductExtension.findMany({
        where: extensionWhere,
        include: {
          product: true,
        },
        orderBy: { productId: 'asc' },
      }) as Promise<DashboardProductExtensionRecord[]>,
      prisma.stockBalance.findMany({
        where: balanceWhere,
        include: {
          product: {
            include: {
              inventoryExtension: true,
            },
          },
          warehouse: true,
        },
        orderBy: { id: 'asc' },
      }),
      prisma.warehouse.findMany({
        where: warehouseWhere,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      prisma.stockMovement.findMany({
        where: movementWhere,
        orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
      }),
      canReadMovements
        ? this.listStockMovements(ctx, { page: 1, pageSize: 5 })
        : Promise.resolve([]),
      canReadAdjustments
        ? this.listStockAdjustments(ctx, { page: 1, pageSize: 5 })
        : Promise.resolve([]),
    ])

    assertDashboardAggregationCapacity({
      trackedProducts: extensions.length,
      balances: balances.length,
      warehouses: warehouses.length,
      movements: trendRecords.length,
    })

    const stockSummary = buildDashboardStockSummary(extensions, balances, warehouses)
    const movementTrend = buildMovementTrend(trendRecords, now, {
      inventoryV2Enabled: sdk.runtime?.isInventoryV2Enabled?.() ?? false,
    })

    return {
      ...stockSummary,
      movementTrend: movementTrend.data,
      movementRange: {
        start: utcDateKey(movementTrend.start),
        end: utcDateKey(addUtcDays(movementTrend.end, -1)),
        timezone: 'UTC',
      },
      recentMovements,
      recentAdjustments,
    }
  }

  static async listProductSettings(
    ctx: PlatformContext,
    query: ProductSettingListQuery,
  ): Promise<InventoryProductSettingListItem[]> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ)
    const prisma = getInventoryPrisma(ctx)

    const products = await prisma.product.findMany({
      where: activeProductWhere(ctx, query),
      include: {
        category: true,
        inventoryExtension: true,
      },
      orderBy: [
        query.sort === 'reorderPoint'
          ? { inventoryExtension: { reorderPoint: query.direction ?? 'asc' } }
          : { name: query.sort ? (query.direction ?? 'asc') : 'asc' },
        { id: 'asc' },
      ],
      ...pagination(query),
    })

    return products.map(productSettingDto)
  }

  static async listProductSettingsPage(
    ctx: PlatformContext,
    query: ProductSettingListQuery,
  ): Promise<InventoryPage<InventoryProductSettingListItem>> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ)
    const prisma = getInventoryPrisma(ctx)
    const where = activeProductWhere(ctx, query)
    const count = prisma.product.count
    if (!count) throw new InventoryServiceError('Pagination is temporarily unavailable.', 'INTERNAL_ERROR', 500)
    const [rows, total] = await Promise.all([
      this.listProductSettings(ctx, query),
      count.call(prisma.product, { where }),
    ])
    return {
      rows,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    }
  }

  static async upsertProductSetting(
    ctx: PlatformContext,
    input: UpsertProductSettingInput,
  ): Promise<InventoryProductSettingListItem> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_UPDATE)
    const prisma = getInventoryPrisma(ctx)
    const product = await requireProduct(prisma, ctx, input.productId)
    const existing = await prisma.inventoryProductExtension.findFirst({
      where: {
        orgId: ctx.org.id,
        productId: input.productId,
      },
    })

    const data = {
      reorderPoint: decimalString(input.reorderPoint),
      isStockTracked: input.isStockTracked,
      deletedAt: null,
      deletedBy: null,
    }

    const record = existing
      ? await prisma.inventoryProductExtension.update({
          where: {
            orgId_productId: {
              orgId: ctx.org.id,
              productId: input.productId,
            },
          },
          data,
        })
      : await prisma.inventoryProductExtension.create({
          data: {
            orgId: ctx.org.id,
            productId: input.productId,
            ...data,
          },
        })

    const changedFields = ['isStockTracked', 'reorderPoint']
    const payload = productExtensionPayloadSchema.parse({
      productExtensionId: record.id,
      productId: record.productId,
      changedFields,
    })

    await sdk.events.emit(
      ctx,
      existing && !existing.deletedAt
        ? inventoryEvents.productExtensionUpdated.name
        : inventoryEvents.productExtensionCreated.name,
      payload,
    )

    return productSettingDto({
      ...product,
      inventoryExtension: record,
    })
  }

  static async listStockLevels(ctx: PlatformContext, query: StockLevelQuery): Promise<StockLevelListItem[]> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_LEVEL_READ)
    const prisma = getInventoryPrisma(ctx)
    const records = await prisma.stockBalance.findMany({
      where: {
        orgId: ctx.org.id,
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        product: activeProductWhere(ctx, { search: query.q ?? query.search }),
        warehouse: activeWarehouseWhere(ctx),
      },
      include: {
        product: {
          include: {
            category: true,
            inventoryExtension: true,
          },
        },
        warehouse: true,
      },
      orderBy: [
        query.sort === 'warehouse'
          ? { warehouse: { name: query.direction ?? 'asc' } }
          : query.sort === 'quantity'
            ? { quantity: query.direction ?? 'asc' }
            : { product: { name: query.sort ? (query.direction ?? 'asc') : 'asc' } },
        { id: 'asc' },
      ],
      ...pagination(query),
    })
    return records.map(stockLevelDto)
  }

  static async getStockLevel(ctx: PlatformContext, id: string): Promise<StockLevelListItem> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_LEVEL_READ)
    const prisma = getInventoryPrisma(ctx)
    const record = await prisma.stockBalance.findFirst({
      where: {
        id,
        orgId: ctx.org.id,
        product: activeProductWhere(ctx),
        warehouse: activeWarehouseWhere(ctx),
      },
      include: {
        product: {
          include: {
            category: true,
            inventoryExtension: true,
          },
        },
        warehouse: true,
      },
    })

    if (!record) {
      throw new InventoryServiceError('Stock level was not found.', 'NOT_FOUND', 404)
    }

    return stockLevelDto(record)
  }

  static async listStockLevelsPage(
    ctx: PlatformContext,
    query: StockLevelQuery,
  ): Promise<InventoryPage<StockLevelListItem>> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_LEVEL_READ)
    const prisma = getInventoryPrisma(ctx)
    const where = {
      orgId: ctx.org.id,
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      product: activeProductWhere(ctx, { search: query.q ?? query.search }),
      warehouse: activeWarehouseWhere(ctx),
    }
    const count = prisma.stockBalance.count
    if (!count) throw new InventoryServiceError('Pagination is temporarily unavailable.', 'INTERNAL_ERROR', 500)
    const [rows, total] = await Promise.all([
      this.listStockLevels(ctx, query),
      count.call(prisma.stockBalance, { where }),
    ])
    return {
      rows,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    }
  }

  static async listStockMovements(ctx: PlatformContext, query: StockMovementQuery): Promise<StockMovementListItem[]> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ)
    const prisma = getInventoryPrisma(ctx)
    const records = await prisma.stockMovement.findMany({
      where: {
        orgId: ctx.org.id,
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.from || query.to
          ? {
              occurredAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
        product: activeProductWhere(ctx, { search: query.q ?? query.search }),
        warehouse: activeWarehouseWhere(ctx),
      },
      include: {
        product: true,
        warehouse: true,
        actor: true,
      },
      orderBy: [
        query.sort === 'product'
          ? { product: { name: query.direction ?? 'asc' } }
          : query.sort === 'quantity'
            ? { quantityDelta: query.direction ?? 'asc' }
            : { occurredAt: query.sort ? (query.direction ?? 'asc') : 'desc' },
        { id: 'asc' },
      ],
      ...pagination(query),
    })

    return records.map(movementDto)
  }

  static async getStockMovement(ctx: PlatformContext, id: string): Promise<StockMovementListItem> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ)
    const prisma = getInventoryPrisma(ctx)
    const record = await prisma.stockMovement.findFirst({
      where: {
        id,
        orgId: ctx.org.id,
        product: activeProductWhere(ctx),
        warehouse: activeWarehouseWhere(ctx),
      },
      include: {
        product: true,
        warehouse: true,
        actor: true,
      },
    })

    if (!record) {
      throw new InventoryServiceError('Stock movement was not found.', 'NOT_FOUND', 404)
    }

    return movementDto(record)
  }

  static async listStockMovementsPage(
    ctx: PlatformContext,
    query: StockMovementQuery,
  ): Promise<InventoryPage<StockMovementListItem>> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ)
    const prisma = getInventoryPrisma(ctx)
    const where = {
      orgId: ctx.org.id,
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.from || query.to
        ? { occurredAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          } }
        : {}),
      product: activeProductWhere(ctx, { search: query.q ?? query.search }),
      warehouse: activeWarehouseWhere(ctx),
    }
    const count = prisma.stockMovement.count
    if (!count) throw new InventoryServiceError('Pagination is temporarily unavailable.', 'INTERNAL_ERROR', 500)
    const [rows, total] = await Promise.all([
      this.listStockMovements(ctx, query),
      count.call(prisma.stockMovement, { where }),
    ])
    return {
      rows,
      meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    }
  }

  static async listStockAdjustments(
    ctx: PlatformContext,
    query: StockAdjustmentQuery,
  ): Promise<StockAdjustmentListItem[]> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ)
    const prisma = getInventoryPrisma(ctx)
    const records = await prisma.stockAdjustment.findMany({
      where: {
        orgId: ctx.org.id,
        deletedAt: null,
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        product: activeProductWhere(ctx, { search: query.q ?? query.search }),
        warehouse: activeWarehouseWhere(ctx),
      },
      include: {
        product: true,
        warehouse: true,
        actor: true,
      },
      orderBy: [
        query.sort === 'product'
          ? { product: { name: query.direction ?? 'asc' } }
          : query.sort === 'quantity'
            ? { quantityDelta: query.direction ?? 'asc' }
            : { createdAt: query.sort ? (query.direction ?? 'asc') : 'desc' },
        { id: 'asc' },
      ],
      ...pagination(query),
    })

    return records.map(adjustmentDto)
  }

  static async getStockAdjustment(ctx: PlatformContext, id: string): Promise<StockAdjustmentListItem> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ)
    const prisma = getInventoryPrisma(ctx)
    const record = await prisma.stockAdjustment.findFirst({
      where: {
        id,
        orgId: ctx.org.id,
        deletedAt: null,
        product: activeProductWhere(ctx),
        warehouse: activeWarehouseWhere(ctx),
      },
      include: {
        product: true,
        warehouse: true,
        actor: true,
      },
    })

    if (!record) {
      throw new InventoryServiceError('Stock adjustment was not found.', 'NOT_FOUND', 404)
    }

    return adjustmentDto(record)
  }

  static async listStockAdjustmentsPage(
    ctx: PlatformContext,
    query: StockAdjustmentQuery,
  ): Promise<InventoryPage<StockAdjustmentListItem>> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ)
    const prisma = getInventoryPrisma(ctx)
    const where = {
      orgId: ctx.org.id,
      deletedAt: null,
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      product: activeProductWhere(ctx, { search: query.q ?? query.search }),
      warehouse: activeWarehouseWhere(ctx),
    }
    const count = prisma.stockAdjustment.count
    if (!count) throw new InventoryServiceError('Pagination is temporarily unavailable.', 'INTERNAL_ERROR', 500)
    const [rows, total] = await Promise.all([
      this.listStockAdjustments(ctx, query),
      count.call(prisma.stockAdjustment, { where }),
    ])
    return {
      rows,
      meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    }
  }

  static async getStockAdjustmentFormOptions(ctx: PlatformContext): Promise<StockAdjustmentFormOptions> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE)
    const prisma = getInventoryPrisma(ctx)
    const [products, warehouses, balances] = await Promise.all([
      prisma.product.findMany({
        where: activeProductWhere(ctx),
        orderBy: { name: 'asc' },
      }),
      prisma.warehouse.findMany({
        where: activeWarehouseWhere(ctx),
        orderBy: { name: 'asc' },
      }),
      prisma.stockBalance.findMany({
        where: {
          orgId: ctx.org.id,
          product: activeProductWhere(ctx),
          warehouse: activeWarehouseWhere(ctx),
        },
        include: {
          product: true,
          warehouse: true,
        },
      }),
    ])

    return {
      products: products.map((product): InventoryFormOption => ({
        id: product.id,
        label: `${product.code} - ${product.name}`,
        help: product.unit ?? 'pcs',
      })),
      warehouses: warehouses.map((warehouse): InventoryFormOption => ({
        id: warehouse.id,
        label: `${warehouse.code} - ${warehouse.name}`,
      })),
      stockLevels: balances.map((balance) => ({
        productId: balance.productId,
        warehouseId: balance.warehouseId,
        quantity: decimalString(balance.quantity),
      })),
    }
  }

  static async createStockAdjustment(
    ctx: PlatformContext,
    input: CreateStockAdjustmentInput,
  ): Promise<StockAdjustmentCreated> {
    await requireInventoryPermission(ctx, INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE)
    const prisma = getInventoryPrisma(ctx)
    const desiredQuantity = decimalToUnits(input.quantityAfter)

    if (desiredQuantity < 0n) {
      throw new InventoryServiceError('Resulting stock cannot be negative.')
    }

    const result = await prisma.$transaction(async (tx) => {
      await requireProduct(tx, ctx, input.productId)
      await requireWarehouse(tx, ctx, input.warehouseId)

      let extension = await tx.inventoryProductExtension.findFirst({
        where: {
          orgId: ctx.org.id,
          productId: input.productId,
          deletedAt: null,
        },
      })
      const events: InventoryEvent[] = []

      if (!extension) {
        extension = await tx.inventoryProductExtension.create({
          data: {
            orgId: ctx.org.id,
            productId: input.productId,
            reorderPoint: '0',
            isStockTracked: true,
          },
        })
        events.push({
          name: inventoryEvents.productExtensionCreated.name,
          payload: productExtensionPayloadSchema.parse({
            productExtensionId: extension.id,
            productId: extension.productId,
            changedFields: ['isStockTracked', 'reorderPoint'],
          }),
        })
      }

      if (!extension.isStockTracked) {
        throw new InventoryServiceError('This Product is not tracked by Inventory.')
      }

      const existingBalance = await tx.stockBalance.findFirst({
        where: {
          orgId: ctx.org.id,
          productId: input.productId,
          warehouseId: input.warehouseId,
        },
        include: {
          product: true,
          warehouse: true,
        },
      })
      const quantityBefore = existingBalance ? decimalToUnits(existingBalance.quantity) : 0n
      const quantityDelta = desiredQuantity - quantityBefore

      if (quantityDelta === 0n) {
        throw new InventoryServiceError('New quantity must differ from the current quantity.')
      }

      const adjustment = await tx.stockAdjustment.create({
        data: {
          orgId: ctx.org.id,
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantityBefore: formatUnits(quantityBefore),
          quantityAfter: formatUnits(desiredQuantity),
          quantityDelta: formatUnits(quantityDelta),
          reason: input.reason,
          notes: input.notes,
          status: 'posted',
          createdBy: ctx.user.id,
        },
        include: {
          product: true,
          warehouse: true,
          actor: true,
        },
      })

      const movementType =
        quantityBefore === 0n && desiredQuantity > 0n
          ? 'opening_balance'
          : quantityDelta > 0n
            ? 'adjustment_in'
            : 'adjustment_out'

      const movement = await tx.stockMovement.create({
        data: {
          orgId: ctx.org.id,
          productId: input.productId,
          warehouseId: input.warehouseId,
          type: movementType,
          quantityDelta: formatUnits(quantityDelta),
          resultingQuantity: formatUnits(desiredQuantity),
          sourceType: 'stock_adjustment',
          sourceId: adjustment.id,
          reason: input.reason,
          createdBy: ctx.user.id,
        },
        include: {
          product: true,
          warehouse: true,
          actor: true,
        },
      })

      const balance = existingBalance
        ? await tx.stockBalance.update({
            where: {
              orgId_productId_warehouseId: {
                orgId: ctx.org.id,
                productId: input.productId,
                warehouseId: input.warehouseId,
              },
            },
            data: {
              quantity: formatUnits(desiredQuantity),
            },
            include: {
              product: {
                include: {
                  category: true,
                  inventoryExtension: true,
                },
              },
              warehouse: true,
            },
          })
        : await tx.stockBalance.create({
            data: {
              orgId: ctx.org.id,
              productId: input.productId,
              warehouseId: input.warehouseId,
              quantity: formatUnits(desiredQuantity),
            },
            include: {
              product: {
                include: {
                  category: true,
                  inventoryExtension: true,
                },
              },
              warehouse: true,
            },
          })

      events.push(
        {
          name: inventoryEvents.stockAdjustmentCreated.name,
          payload: stockAdjustmentCreatedPayloadSchema.parse({
            adjustmentId: adjustment.id,
            productId: adjustment.productId,
            warehouseId: adjustment.warehouseId,
            quantityDelta: formatUnits(quantityDelta),
            createdBy: ctx.user.id,
          }),
        },
        {
          name: inventoryEvents.stockMovementCreated.name,
          payload: stockMovementCreatedPayloadSchema.parse({
            movementId: movement.id,
            productId: movement.productId,
            warehouseId: movement.warehouseId,
            quantityDelta: formatUnits(quantityDelta),
            resultingQuantity: formatUnits(desiredQuantity),
            sourceType: 'stock_adjustment',
            sourceId: adjustment.id,
          }),
        },
        {
          name: inventoryEvents.stockBalanceUpdated.name,
          payload: stockBalanceUpdatedPayloadSchema.parse({
            productId: balance.productId,
            warehouseId: balance.warehouseId,
            quantity: formatUnits(desiredQuantity),
          }),
        },
      )

      const reorderPoint = decimalToUnits(extension.reorderPoint)
      if (reorderPoint > 0n && quantityBefore > reorderPoint && desiredQuantity <= reorderPoint) {
        events.push({
          name: inventoryEvents.reorderThresholdCrossed.name,
          payload: reorderThresholdCrossedPayloadSchema.parse({
            productId: input.productId,
            warehouseId: input.warehouseId,
            quantity: formatUnits(desiredQuantity),
            reorderPoint: formatUnits(reorderPoint),
          }),
        })
      }

      return {
        events,
        adjustment: {
          id: adjustment.id,
          productId: adjustment.productId,
          warehouseId: adjustment.warehouseId,
          quantityBefore: formatUnits(quantityBefore),
          quantityAfter: formatUnits(desiredQuantity),
          quantityDelta: formatUnits(quantityDelta),
          reason: adjustment.reason,
          createdAt: toIso(adjustment.createdAt),
        } satisfies StockAdjustmentCreated,
      }
    })

    await emitInventoryEvents(ctx, result.events)
    return result.adjustment
  }
}
