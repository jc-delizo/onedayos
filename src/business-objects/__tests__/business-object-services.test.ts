import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlatformContext } from '@/sdk'
import { CUSTOMER_EVENTS, CUSTOMER_PERMISSIONS, CustomerService } from '../customer'
import { PRODUCT_EVENTS, PRODUCT_PERMISSIONS, ProductService } from '../product'

const { mockEmit, mockGetDb, mockRequirePermission } = vi.hoisted(() => ({
  mockEmit: vi.fn(),
  mockGetDb: vi.fn(),
  mockRequirePermission: vi.fn(),
}))

vi.mock('@/sdk/server', () => ({
  sdk: {
    getDb: mockGetDb,
    permissions: {
      require: mockRequirePermission,
    },
    events: {
      emit: mockEmit,
    },
  },
}))

function makeCtx(orgId: string): PlatformContext {
  return {
    requestId: `req_${orgId}`,
    auth: { provider: 'supabase', userId: `user_${orgId}`, email: `${orgId}@example.com` },
    user: { id: `user_${orgId}`, orgId, name: 'User', email: `${orgId}@example.com`, isActive: true },
    org: {
      id: orgId,
      slug: orgId,
      name: orgId,
      isActive: true,
      status: 'ACTIVE',
      subscriptionStatus: 'ACTIVE',
      plan: 'foundation',
    },
    roles: [],
    permissions: [],
    enabledModules: [],
  }
}

function makePrisma() {
  return {
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productCategory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
  }
}

describe('Business Object services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequirePermission.mockResolvedValue(undefined)
    mockEmit.mockResolvedValue({ eventName: 'ok' })
  })

  it('requires PlatformContext database access and tenant-scopes list queries', async () => {
    const prisma = makePrisma()
    prisma.customer.findMany.mockResolvedValue([])
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await CustomerService.list(makeCtx('org_a'), { search: 'acme' })

    expect(mockGetDb).toHaveBeenCalledWith(expect.objectContaining({ org: expect.objectContaining({ id: 'org_a' }) }))
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.anything(), CUSTOMER_PERMISSIONS.READ)
    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          orgId: 'org_a',
          deletedAt: null,
          OR: expect.any(Array),
        }),
      }),
    )
  })

  it('returns exact Product totals and stable pages above 100 without loading the full tenant set', async () => {
    const prisma = makePrisma()
    const fixtures = Array.from({ length: 155 }, (_, index) => ({
      id: `product_${String(index + 1).padStart(3, '0')}`,
      orgId: 'org_a',
      code: `SKU-${String(index + 1).padStart(3, '0')}`,
      name: `Product ${String(index + 1).padStart(3, '0')}`,
      description: index === 139 ? 'scale-needle' : null,
      categoryId: null,
      unit: 'pcs',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
      category: null,
    }))
    prisma.product.findMany.mockImplementation(async (args) => {
      const query = args as { skip: number; take: number; where: { OR?: Array<Record<string, { contains: string }>> } }
      const needle = query.where.OR?.map((clause) => Object.values(clause)[0]?.contains).find(Boolean)
      const matches = needle
        ? fixtures.filter((row) => `${row.code} ${row.name} ${row.description ?? ''}`.toLowerCase().includes(needle.toLowerCase()))
        : fixtures
      return matches.slice(query.skip, query.skip + query.take)
    })
    prisma.product.count.mockImplementation(async (args) => {
      const query = args as { where: { OR?: Array<Record<string, { contains: string }>> } }
      const needle = query.where.OR?.map((clause) => Object.values(clause)[0]?.contains).find(Boolean)
      return needle
        ? fixtures.filter((row) => `${row.code} ${row.name} ${row.description ?? ''}`.toLowerCase().includes(needle.toLowerCase())).length
        : fixtures.length
    })
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    const pageTwo = await ProductService.listPage(makeCtx('org_a'), {
      page: 2,
      pageSize: 50,
      direction: 'asc',
    })
    const pageThree = await ProductService.listPage(makeCtx('org_a'), {
      page: 3,
      pageSize: 50,
      direction: 'asc',
    })
    const searchResult = await ProductService.listPage(makeCtx('org_a'), {
      q: 'scale-needle',
      page: 1,
      pageSize: 25,
      direction: 'asc',
    })

    expect(pageTwo.meta).toEqual({ page: 2, pageSize: 50, total: 155, totalPages: 4 })
    expect(pageThree.meta).toEqual({ page: 3, pageSize: 50, total: 155, totalPages: 4 })
    expect(new Set([...pageTwo.rows, ...pageThree.rows].map((row) => row.id)).size).toBe(100)
    expect(searchResult.rows.map((row) => row.id)).toEqual(['product_140'])
    expect(searchResult.meta.total).toBe(1)
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 50, take: 50 }))
    expect(prisma.product.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ orgId: 'org_a', deletedAt: null }),
    })
  })

  it('prevents Org A from reading Org B records through safe not found behavior', async () => {
    const prisma = makePrisma()
    prisma.customer.findFirst.mockResolvedValue(null)
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await expect(CustomerService.getById(makeCtx('org_a'), 'customer_b')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
    expect(prisma.customer.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'customer_b',
        orgId: 'org_a',
        deletedAt: null,
      },
    })
  })

  it('creates records with server-derived tenant identity and emits minimal events', async () => {
    const prisma = makePrisma()
    prisma.customer.create.mockResolvedValue({ id: 'customer_a', orgId: 'org_a', name: 'Acme' })
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await CustomerService.create(makeCtx('org_a'), { name: 'Acme' })

    expect(mockRequirePermission).toHaveBeenCalledWith(expect.anything(), CUSTOMER_PERMISSIONS.CREATE)
    expect(prisma.customer.create).toHaveBeenCalledWith({
      data: {
        orgId: 'org_a',
        name: 'Acme',
      },
    })
    expect(mockEmit).toHaveBeenCalledWith(expect.anything(), CUSTOMER_EVENTS.CREATED, { customerId: 'customer_a' })
    expect(mockEmit.mock.calls[0][2]).not.toHaveProperty('orgId')
  })

  it('does not write records when permission is denied', async () => {
    const prisma = makePrisma()
    mockRequirePermission.mockRejectedValue({ status: 403, code: 'FORBIDDEN' })
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await expect(CustomerService.create(makeCtx('org_a'), { name: 'Acme' })).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })

    expect(mockGetDb).not.toHaveBeenCalled()
    expect(prisma.customer.create).not.toHaveBeenCalled()
    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('does not emit events when the database mutation fails', async () => {
    const prisma = makePrisma()
    prisma.customer.create.mockRejectedValue(new Error('database unavailable'))
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await expect(CustomerService.create(makeCtx('org_a'), { name: 'Acme' })).rejects.toThrow('database unavailable')

    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('soft deletes and restores records without hard delete behavior', async () => {
    const prisma = makePrisma()
    prisma.customer.findFirst.mockResolvedValue({ id: 'customer_a', orgId: 'org_a', name: 'Acme' })
    prisma.customer.update.mockResolvedValue({ id: 'customer_a', orgId: 'org_a', name: 'Acme' })
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await CustomerService.softDelete(makeCtx('org_a'), 'customer_a')
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id_orgId: { id: 'customer_a', orgId: 'org_a' } },
      data: {
        deletedAt: expect.any(Date),
        deletedBy: 'user_org_a',
      },
    })

    await CustomerService.restore(makeCtx('org_a'), 'customer_a')
    expect(prisma.customer.update).toHaveBeenLastCalledWith({
      where: { id_orgId: { id: 'customer_a', orgId: 'org_a' } },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    })
  })

  it('validates product category references inside the same tenant', async () => {
    const prisma = makePrisma()
    prisma.productCategory.findFirst.mockResolvedValue({ id: 'cat_a', orgId: 'org_a', name: 'Parts' })
    prisma.product.create.mockResolvedValue({ id: 'product_a', orgId: 'org_a', code: 'SKU-1', name: 'Cable' })
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await ProductService.create(makeCtx('org_a'), { code: 'SKU-1', name: 'Cable', categoryId: 'cat_a' })

    expect(mockRequirePermission).toHaveBeenCalledWith(expect.anything(), PRODUCT_PERMISSIONS.CREATE)
    expect(prisma.productCategory.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'cat_a',
        orgId: 'org_a',
        deletedAt: null,
      },
    })
  })

  it('supports Product deactivate and reactivate as update-authorized lifecycle changes', async () => {
    const prisma = makePrisma()
    prisma.product.findFirst.mockResolvedValue({ id: 'product_a', orgId: 'org_a', code: 'SKU-1', name: 'Cable' })
    prisma.product.update.mockResolvedValue({ id: 'product_a', orgId: 'org_a', code: 'SKU-1', name: 'Cable' })
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await ProductService.deactivate(makeCtx('org_a'), 'product_a')

    expect(mockRequirePermission).toHaveBeenCalledWith(expect.anything(), PRODUCT_PERMISSIONS.UPDATE)
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id_orgId: { id: 'product_a', orgId: 'org_a' } },
      data: { isActive: false },
    })
    expect(mockEmit).toHaveBeenCalledWith(expect.anything(), PRODUCT_EVENTS.DEACTIVATED, { productId: 'product_a' })

    await ProductService.reactivate(makeCtx('org_a'), 'product_a')

    expect(prisma.product.update).toHaveBeenLastCalledWith({
      where: { id_orgId: { id: 'product_a', orgId: 'org_a' } },
      data: { isActive: true },
    })
    expect(mockEmit).toHaveBeenLastCalledWith(expect.anything(), PRODUCT_EVENTS.REACTIVATED, { productId: 'product_a' })
  })
})
