// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RecordForm } from './record-form'
import { getRecordArea } from './records-config'
import { RecordsListPage } from './records-list-page'
import { RecordsShell } from './records-shell'

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

const customerFields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email' as const },
]

describe('Business Object Records UI', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
    mockRefresh.mockReset()
  })

  it('does not render a duplicate Records content navbar', () => {
    render(
      <RecordsShell orgSlug="acme">
        <p>Records content</p>
      </RecordsShell>,
    )

    expect(screen.getByText('Records content')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Records section' })).not.toBeInTheDocument()
    expect(screen.queryByText('Inventory')).not.toBeInTheDocument()
    expect(screen.queryByText('CRM')).not.toBeInTheDocument()
  })

  it('does not render hidden orgId fields', () => {
    const { container } = render(
      <RecordForm
        orgSlug="acme"
        endpoint="customers"
        fields={customerFields}
        returnHref="/acme/records/customers"
        submitLabel="Create Customer"
      />,
    )

    expect(container.querySelector('input[name="orgId"]')).toBeNull()
    expect(container.querySelector('input[type="hidden"]')).toBeNull()
  })

  it('submits object form data to org-scoped APIs without tenant identity', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ data: { id: 'customer_a' }, error: null }),
    } as Response)

    render(
      <RecordForm
        orgSlug="acme"
        endpoint="customers"
        fields={customerFields}
        returnHref="/acme/records/customers"
        submitLabel="Create Customer"
      />,
    )

    await user.type(screen.getByLabelText(/Name/), 'Acme Trading')
    await user.type(screen.getByLabelText(/Email/), 'ops@example.com')
    await user.click(screen.getByRole('button', { name: 'Create Customer' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(String((init as RequestInit).body))

    expect(url).toBe('/api/orgs/acme/objects/customers')
    expect(body).toEqual({ name: 'Acme Trading', email: 'ops@example.com' })
    expect(body).not.toHaveProperty('orgId')
    expect(mockPush).toHaveBeenCalledWith('/acme/records/customers')
  })

  it('hides create and edit actions for read-only shared Records users', () => {
    render(
      <RecordsListPage
        orgSlug="acme"
        area={getRecordArea('products')}
        rows={[{ id: 'product_a', code: 'WAT-500', name: 'Bottled Water' }]}
        getRowId={(row) => row.id}
        columns={[
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'name', header: 'Name', cell: (row) => row.name },
        ]}
        canCreate={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'New Product' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
  })
})
