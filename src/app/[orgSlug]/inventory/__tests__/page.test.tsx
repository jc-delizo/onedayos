// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StockAdjustmentForm } from '../_components/stock-adjustment-form'
import { InventoryShell } from '../_components/inventory-shell'

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

const options = {
  products: [{ id: 'product_a', label: 'SKU-1 - Bond Paper', help: 'ream' }],
  warehouses: [{ id: 'warehouse_a', label: 'MAIN - Main Warehouse' }],
  stockLevels: [{ productId: 'product_a', warehouseId: 'warehouse_a', quantity: '8' }],
}

describe('Inventory UI', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
    mockRefresh.mockReset()
  })

  it('renders the adjustment form without hidden tenant fields', () => {
    const { container } = render(<StockAdjustmentForm orgSlug="acme" options={options} />)

    expect(screen.getByLabelText(/Product/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Warehouse/)).toBeInTheDocument()
    expect(screen.getByLabelText('Current Quantity')).toHaveValue('8')
    expect(container.querySelector('input[name="orgId"]')).toBeNull()
    expect(container.querySelector('input[type="hidden"]')).toBeNull()
  })

  it('submits stock adjustments to tenant-scoped Inventory API without orgId', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ data: { id: 'adjustment_a' }, error: null }),
    } as Response)

    render(<StockAdjustmentForm orgSlug="acme" options={options} />)

    await user.type(screen.getByLabelText(/New Quantity/), '10')
    await user.type(screen.getByLabelText(/Reason/), 'Physical count correction')
    await user.click(screen.getByRole('button', { name: 'Post Adjustment' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(String((init as RequestInit).body))

    expect(url).toBe('/api/orgs/acme/inventory/stock-adjustments')
    expect(body).toEqual({
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityAfter: '10',
      reason: 'Physical count correction',
    })
    expect(body).not.toHaveProperty('orgId')
    expect(String(url)).not.toContain('/api/inventory')
    expect(mockPush).toHaveBeenCalledWith('/acme/inventory/stock-adjustments')
  })

  it('does not call deprecated current-user or client-side signup paths', () => {
    const source = String(StockAdjustmentForm)

    expect(source).not.toContain('/api/kernel/users/[id]')
    expect(source).not.toContain('signUp')
  })

  it('does not render a duplicate Inventory content navbar', () => {
    render(
      <InventoryShell orgSlug="acme" activeItem="product-settings">
        <p>Inventory content</p>
      </InventoryShell>,
    )

    expect(screen.getByText('Inventory content')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Inventory section' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Shared Products' })).not.toBeInTheDocument()
  })

  it('uses shared page patterns for Inventory dashboard, lists, and form pages', () => {
    const sources = {
      dashboard: readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/page.tsx'), 'utf8'),
      productSettings: readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/product-settings/page.tsx'), 'utf8'),
      stockLevels: readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/stock-levels/page.tsx'), 'utf8'),
      stockMovements: readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/stock-movements/page.tsx'), 'utf8'),
      stockAdjustments: readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/stock-adjustments/page.tsx'), 'utf8'),
      newAdjustment: [
        readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/stock-adjustments/new/page.tsx'), 'utf8'),
        readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/_components/inventory-record-presenters.tsx'), 'utf8'),
      ].join('\n'),
    }

    expect(sources.dashboard).toContain('DashboardPage')
    expect(sources.dashboard).toContain('DashboardMetric')
    expect(sources.dashboard).toContain('StockHealthChart')
    expect(sources.dashboard).toContain('MovementTrendChart')
    expect(sources.dashboard).toContain('WarehouseStockChart')
    expect(sources.dashboard).toContain('Dashboard analytics need a narrower scope')
    expect(sources.dashboard).toContain('SafePageErrorState')
    expect(sources.dashboard).not.toContain('error.message')
    expect(sources.dashboard).toContain('Out of Stock')
    expect(sources.dashboard).toContain('Recent Movements')
    expect(sources.dashboard).toContain('Recent Adjustments')
    expect(sources.dashboard).not.toContain('fake metrics')
    expect(sources.dashboard).not.toMatch(/percentage delta|trend arrow/i)
    expect(sources.productSettings).toContain('ListPage')
    expect(sources.stockLevels).toContain('ListPage')
    expect(sources.stockMovements).toContain('ListPage')
    expect(sources.stockAdjustments).toContain('ListPage')
    expect(sources.newAdjustment).toContain('StockAdjustmentCreatePresenter')
    expect(sources.newAdjustment).toContain('FormPage')

    for (const source of Object.values(sources)) {
      expect(source).toContain('headerMode="compact"')
      expect(source).not.toContain('Shared Products')
      expect(source).not.toContain('Inventory section')
      expect(source).not.toContain('name="orgId"')
    }
  })

  it('uses contextual shared loading and safe error states', () => {
    const loadingSources = [
      readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/loading.tsx'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/product-settings/loading.tsx'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/stock-levels/loading.tsx'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/stock-movements/loading.tsx'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/stock-adjustments/loading.tsx'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/stock-adjustments/new/loading.tsx'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/related/[area]/loading.tsx'), 'utf8'),
    ]
    const errorSource = readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/error.tsx'), 'utf8')

    expect(loadingSources[0]).toContain('DashboardPageLoadingState')
    expect(loadingSources.slice(1, 5).every((source) => source.includes('TablePageLoadingState'))).toBe(true)
    expect(loadingSources[5]).toContain('FormPageLoadingState')
    expect(loadingSources[6]).toContain('PageLoadingState')
    expect(errorSource).toContain('SafePageErrorState')

    for (const source of [...loadingSources, errorSource]) {
      expect(source).not.toContain('Loading...')
      expect(source).not.toContain('throw error')
    }
  })
})
