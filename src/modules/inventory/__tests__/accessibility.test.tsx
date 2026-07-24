// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataTable, ListPage, ProcessFlowPage, SafePageErrorState } from '@/components/onedayos'
import { StatusBadge } from '@/components/ui/status-badge'
import { StockAdjustmentForm } from '@/app/[orgSlug]/inventory/_components/stock-adjustment-form'
import { inventoryProcessFlow } from '../process-flow'
import { expectNoA11yViolations } from '@/test/accessibility'

const A11Y_TIMEOUT = 15_000

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

const formOptions = {
  products: [{ id: 'product_a', label: 'COFFEE-1KG - Coffee Beans 1kg', help: 'kg' }],
  warehouses: [{ id: 'warehouse_a', label: 'MAIN - Main Warehouse' }],
  stockLevels: [{ productId: 'product_a', warehouseId: 'warehouse_a', quantity: '8' }],
}

describe('Inventory accessibility', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
    mockRefresh.mockReset()
  })

  it('Inventory Process Flow renders through the shared accessible pattern', async () => {
    const { container } = render(<ProcessFlowPage breadcrumb="Inventory / Process Flow" definition={inventoryProcessFlow} />)

    expect(screen.getByRole('heading', { name: 'Inventory Process Flow' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Current step details' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Transactional Posting' })).toBeInTheDocument()
    expect(screen.getByText('What this module does not own')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('Stock Levels representative table communicates low-stock status with text', async () => {
    const { container } = render(
      <ListPage title="Stock Levels" description="Current stock by shared Product and Warehouse.">
        <DataTable
          columns={[
            { id: 'product', header: 'Product', cell: (row: { product: string }) => row.product },
            { id: 'warehouse', header: 'Warehouse', cell: (row: { warehouse: string }) => row.warehouse },
            { id: 'quantity', header: 'Quantity', cell: (row: { quantity: string }) => row.quantity },
            {
              id: 'status',
              header: 'Status',
              cell: (row: { status: string }) => <StatusBadge variant="warning">{row.status}</StatusBadge>,
            },
          ]}
          rows={[{ id: 'level_1', product: 'Coffee Beans 1kg', warehouse: 'Main Warehouse', quantity: '8 kg', status: 'Low Stock' }]}
          getRowId={(row) => row.id}
        />
      </ListPage>,
    )

    expect(screen.getByRole('cell', { name: 'Low Stock' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('Stock Adjustment form exposes labels and no tenant identity controls', async () => {
    const { container } = render(<StockAdjustmentForm orgSlug="acme" options={formOptions} />)

    expect(screen.getByLabelText(/Product/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Warehouse/)).toBeInTheDocument()
    expect(screen.getByLabelText('Current Quantity')).toHaveValue('8')
    expect(screen.getByRole('button', { name: 'Post Adjustment' })).toBeInTheDocument()
    expect(container.querySelector('input[name="orgId"]')).toBeNull()
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('Dashboard aggregation-limit failure remains safe and accessible', async () => {
    const { container } = render(
      <SafePageErrorState
        title="Dashboard analytics need a narrower scope"
        message="The current organization exceeds the exact Dashboard processing limit. Narrow the operational scope or contact an administrator while aggregate optimization is prepared."
      />,
    )

    expect(screen.getByRole('heading', { name: 'Dashboard analytics need a narrower scope' })).toBeInTheDocument()
    expect(container).toHaveTextContent('Narrow the operational scope')
    expect(container).not.toHaveTextContent(/Prisma|candidate|stack|orgId/i)
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)
})
