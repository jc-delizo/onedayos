// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { describe, it, vi } from 'vitest'
import { expectNoA11yViolations } from '@/test/accessibility'
import { DataTableV2 } from '../data-table-v2'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/acme/inventory/stock-levels',
  useSearchParams: () => new URLSearchParams(),
}))

describe('Data Table V2 accessibility', () => {
  it('has no detectable axe violations with toolbar, filters, sorting, selection, actions, and interactive rows', async () => {
    const { container } = render(
      <DataTableV2
        tableId="inventory.stock-levels"
        mode="client"
        columns={[
          { id: 'product', header: 'Product', cell: (row) => row.product, accessor: (row) => row.product, sortable: true, required: true },
          { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouse, accessor: (row) => row.warehouse },
          { id: 'status', header: 'Status', cell: (row) => row.status, accessor: (row) => row.status },
        ]}
        rows={[{ id: 'one', product: 'Coffee Beans', warehouse: 'Main Warehouse', status: 'Low Stock' }]}
        getRowId={(row) => row.id}
        filters={[{ id: 'status', label: 'Stock status', options: [{ value: 'Low Stock', label: 'Low Stock' }] }]}
        rowInteraction={{ href: (row) => `/stock-levels/${row.id}`, label: (row) => `View ${row.product}` }}
        rowActions={() => <button type="button">Adjust Stock</button>}
        exportOptions={{
          endpoint: '/api/orgs/acme/inventory/stock-levels/export',
          resourceLabel: 'stock levels',
          totalFilteredRows: 1,
        }}
      />,
    )
    await expectNoA11yViolations(container)
  }, 15_000)
})
