// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import InventoryProcessFlowPage from './page'

const { mockRequirePageModuleContext, mockRequirePermission } = vi.hoisted(() => ({
  mockRequirePageModuleContext: vi.fn(),
  mockRequirePermission: vi.fn(),
}))

vi.mock('@/sdk/server', () => ({
  sdk: {
    auth: {
      requirePageModuleContext: mockRequirePageModuleContext,
    },
    permissions: {
      require: mockRequirePermission,
    },
  },
}))

describe('Inventory Process Flow page', () => {
  it('renders the explanatory process diagram without tenant fields or mutations', async () => {
    const { container } = render(
      await InventoryProcessFlowPage({ params: Promise.resolve({ orgSlug: 'acme' }) }),
    )

    expect(mockRequirePageModuleContext).toHaveBeenCalledWith('acme', 'inventory')
    expect(mockRequirePermission).toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Inventory Process Flow' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Process steps' })).toBeInTheDocument()
    expect(screen.getByText('Shared Records Setup')).toBeInTheDocument()
    expect(screen.getByText('Transactional Posting')).toBeInTheDocument()
    expect(screen.getByText(/updates or creates StockBalance together in a transaction/)).toBeInTheDocument()
    expect(screen.getByText('What this module owns')).toBeInTheDocument()
    expect(screen.getByText('What this module does not own')).toBeInTheDocument()
    expect(screen.getAllByText('Product').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Warehouse').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Supplier').length).toBeGreaterThan(0)
    expect(screen.getByText(/No Notification Service exists in this MVP/)).toBeInTheDocument()
    expect(container.querySelector('input[name="orgId"]')).toBeNull()
    expect(container.querySelector('form')).toBeNull()
  })

  it('does not add API calls or mutation services for the explanatory page', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/process-flow/page.tsx'), 'utf8')

    expect(source).toContain('ProcessFlowPage')
    expect(source).toContain('inventoryProcessFlow')
    expect(source).not.toContain('fetch(')
    expect(source).not.toContain('InventoryService')
    expect(source).not.toContain('POST')
    expect(source).not.toContain('PATCH')
    expect(source).not.toContain('DELETE')
  })

  it('uses the shared Process Flow loading state', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/[orgSlug]/inventory/process-flow/loading.tsx'), 'utf8')

    expect(source).toContain('ProcessFlowLoadingState')
    expect(source).not.toContain('Loading...')
  })
})
