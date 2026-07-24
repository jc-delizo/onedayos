// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DataTableV2 } from '../data-table-v2'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/onedayosdemo/records/products',
  useSearchParams: () => new URLSearchParams(),
}))

type Row = { id: string; name: string; code: string }
const rows: Row[] = [
  { id: '2', name: 'Tea', code: 'TEA' },
  { id: '1', name: 'Coffee', code: 'COF' },
]
const columns = [
  { id: 'code', header: 'Code', cell: (row: Row) => row.code, accessor: (row: Row) => row.code, required: true },
  { id: 'name', header: 'Name', cell: (row: Row) => row.name, accessor: (row: Row) => row.name, sortable: true },
]

function renderTable(props: Partial<React.ComponentProps<typeof DataTableV2<Row>>> = {}) {
  return render(
    <DataTableV2
      tableId="objects.products"
      mode="client"
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      rowInteraction={{ href: (row) => `/products/${row.id}`, label: (row) => `Open ${row.name}` }}
      rowActions={(row) => <button type="button">Actions for {row.name}</button>}
      {...props}
    />,
  )
}

describe('DataTableV2', () => {
  beforeEach(() => {
    push.mockReset()
    localStorage.clear()
  })

  it('renders semantic headers, rows, search, pagination, and horizontal overflow', () => {
    const { container } = renderTable()
    expect(screen.getByRole('columnheader', { name: 'Code' })).toBeInTheDocument()
    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.getByLabelText('Search objects.products')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(container.querySelector('.overflow-x-auto')).toBeInTheDocument()
  })

  it('searches and clears in client mode', () => {
    renderTable()
    fireEvent.change(screen.getByLabelText('Search objects.products'), { target: { value: 'Coffee' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.queryByText('Tea')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText('Tea')).toBeInTheDocument()
  })

  it('sorts through accessible headers', () => {
    renderTable()
    const sortButton = screen.getByRole('button', { name: 'Sort by Name' })
    fireEvent.click(sortButton)
    expect(sortButton).toHaveTextContent('(ascending)')
  })

  it('selects the current page and reports selected count', () => {
    renderTable()
    fireEvent.click(screen.getByLabelText('Select all rows on this page'))
    expect(screen.getByRole('status')).toHaveTextContent('2 selected on this page')
  })

  it('opens rows by pointer, Enter, and Space', () => {
    renderTable()
    const coffee = screen.getByRole('row', { name: 'Open Coffee' })
    fireEvent.click(coffee)
    fireEvent.keyDown(coffee, { key: 'Enter' })
    fireEvent.keyDown(coffee, { key: ' ' })
    expect(push).toHaveBeenCalledTimes(3)
    expect(push).toHaveBeenLastCalledWith('/products/1')
  })

  it('does not activate a row from nested actions or selection', () => {
    renderTable()
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Coffee' }))
    fireEvent.click(screen.getByLabelText('Select Open Coffee'))
    expect(push).not.toHaveBeenCalled()
  })

  it('persists hideable column visibility and keeps required columns visible', () => {
    renderTable()
    fireEvent.click(screen.getByText('Columns'))
    expect(screen.getByLabelText('Code')).toBeDisabled()
    fireEvent.click(screen.getByLabelText('Name'))
    expect(localStorage.getItem('onedayos.table.objects.products.columns')).toContain('name')
  })

  it('renders loading, true-empty, filtered-empty, and safe-error states', () => {
    const { rerender } = renderTable({ loading: true })
    expect(document.querySelector('[data-data-table-v2="objects.products"]')).toBeInTheDocument()
    rerender(<DataTableV2 tableId="objects.products" mode="client" columns={columns} rows={[]} getRowId={(row) => row.id} />)
    expect(screen.getByText('No records yet')).toBeInTheDocument()
    rerender(<DataTableV2 tableId="objects.products" mode="client" columns={columns} rows={[]} getRowId={(row) => row.id} query={{ q: 'missing', page: 1, pageSize: 25 }} />)
    expect(screen.getByText('No matching records')).toBeInTheDocument()
    rerender(<DataTableV2 tableId="objects.products" mode="client" columns={columns} rows={[]} getRowId={(row) => row.id} error="Try again later." />)
    expect(screen.getByText('Try again later.')).toBeInTheDocument()
  })

  it('uses URL query state in server mode and caps page-size choices', () => {
    renderTable({
      mode: 'server',
      query: { page: 2, pageSize: 25, sort: 'name', direction: 'asc' },
      pageMeta: { page: 2, pageSize: 25, total: 52, totalPages: 3 },
    })
    expect(screen.getByText('Page 2 of 3 · 52 rows')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '50' } })
    expect(push).toHaveBeenCalledWith('/onedayosdemo/records/products?pageSize=50')
    expect(screen.queryByRole('option', { name: '1000' })).not.toBeInTheDocument()
  })

  it('falls back safely when localStorage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied')
    })
    renderTable()
    fireEvent.click(screen.getByText('Columns'))
    expect(() => fireEvent.click(screen.getByLabelText('Name'))).not.toThrow()
  })

  it('hides export unless configured and downloads filtered CSV with visible columns', async () => {
    expect(screen.queryByText('Export')).not.toBeInTheDocument()
    const createObjectURL = vi.fn(() => 'blob:export')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const fetchMock = vi.fn().mockResolvedValue(new Response('Code,Name\r\nCOF,Coffee\r\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="onedayos-products-2026-07-24.csv"',
      },
    }))
    vi.stubGlobal('fetch', fetchMock)

    renderTable({
      mode: 'server',
      query: { q: 'coffee', page: 2, pageSize: 25, sort: 'name', direction: 'asc' },
      pageMeta: { page: 2, pageSize: 25, total: 1, totalPages: 1 },
      exportOptions: {
        endpoint: '/api/orgs/acme/objects/products/export',
        resourceLabel: 'products',
        totalFilteredRows: 1,
      },
    })
    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByRole('button', { name: 'CSV all filtered rows (1)' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(init.body))).toEqual({
      format: 'csv',
      scope: 'filtered',
      columns: ['code', 'name'],
      query: { q: 'coffee', sort: 'name', direction: 'asc' },
    })
    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export')
    expect(screen.getByRole('status')).toHaveTextContent('onedayos-products-2026-07-24.csv is ready.')
  })

  it('offers selected and filtered scopes and preserves selection after an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: null,
      error: { code: 'EXPORT_ROW_LIMIT_EXCEEDED', message: 'Narrow the current filters.' },
    }), { status: 422, headers: { 'Content-Type': 'application/json' } })))
    renderTable({
      exportOptions: {
        endpoint: '/api/orgs/acme/objects/products/export',
        resourceLabel: 'products',
        totalFilteredRows: 20,
      },
    })
    fireEvent.click(screen.getByLabelText('Select Open Coffee'))
    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByRole('button', { name: 'CSV selected rows (1)' }))

    await waitFor(() => expect(screen.getByText('Narrow the current filters.')).toBeInTheDocument())
    expect(screen.getByLabelText('Select Open Coffee')).toBeChecked()
    expect(screen.getByRole('button', { name: 'CSV all filtered rows (20)' })).toBeInTheDocument()
  })
})
