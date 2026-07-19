// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProcessFlowPage } from '..'
import type { ProcessFlowDefinition } from '@/sdk'

const inventoryFlow = Object.freeze({
  title: 'Inventory Process Flow',
  description: 'How shared records, settings, adjustments, balances, and ledger entries work together.',
  steps: [
    {
      id: 'shared-records',
      title: 'Shared Records Setup',
      description: 'Products and Warehouses are created as shared Records.',
      inputs: ['Product', 'Warehouse'],
      outputs: ['Shared identity'],
    },
    {
      id: 'adjustment',
      number: 2,
      title: 'Stock Adjustment',
      description: 'The user posts an opening balance or manual correction.',
      inputs: ['Product ID', 'Warehouse ID', 'Quantity change'],
      outputs: ['StockAdjustment', 'StockMovement', 'StockBalance update'],
      warning: 'Negative resulting stock is prevented.',
    },
  ],
  owns: ['InventoryProductExtension', 'StockBalance', 'StockMovement', 'StockAdjustment'],
  doesNotOwn: ['Product', 'ProductCategory', 'Warehouse', 'Supplier'],
  currentBoundaries: ['No purchasing integration.', 'No approval workflow.'],
  futureIntegrations: ['Purchasing receipts can later create inbound movements.'],
} as const satisfies ProcessFlowDefinition)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProcessFlowPage', () => {
  it('renders title and description', () => {
    render(<ProcessFlowPage breadcrumb="Inventory / Process Flow" definition={inventoryFlow} />)

    expect(screen.getByRole('heading', { name: 'Inventory Process Flow' })).toBeInTheDocument()
    expect(screen.getByText(/How shared records, settings, adjustments/i)).toBeInTheDocument()
  })

  it('renders ordered process steps', () => {
    const { container } = render(<ProcessFlowPage definition={inventoryFlow} />)

    const list = container.querySelector('ol')
    expect(list?.tagName).toBe('OL')
    expect(screen.getByRole('heading', { name: 'Shared Records Setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Stock Adjustment' })).toBeInTheDocument()
    expect(screen.getByLabelText('Step 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Step 2')).toBeInTheDocument()
  })

  it('renders inputs and outputs when provided', () => {
    render(<ProcessFlowPage definition={inventoryFlow} />)

    expect(screen.getByText('Product ID')).toBeInTheDocument()
    expect(screen.getByText('Warehouse ID')).toBeInTheDocument()
    expect(screen.getAllByText('StockMovement').length).toBeGreaterThan(0)
    expect(screen.getByText('StockBalance update')).toBeInTheDocument()
  })

  it('renders warning when provided', () => {
    render(<ProcessFlowPage definition={inventoryFlow} />)

    expect(screen.getByRole('note')).toHaveTextContent('Negative resulting stock is prevented.')
  })

  it('renders owns and does-not-own lists', () => {
    render(<ProcessFlowPage definition={inventoryFlow} />)

    expect(screen.getByRole('heading', { name: 'What this module owns' })).toBeInTheDocument()
    expect(screen.getByText('InventoryProductExtension')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What this module does not own' })).toBeInTheDocument()
    expect(screen.getAllByText('Product').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Warehouse').length).toBeGreaterThan(0)
    expect(screen.getByText('Supplier')).toBeInTheDocument()
  })

  it('renders boundaries and future integrations when provided', () => {
    render(<ProcessFlowPage definition={inventoryFlow} />)

    expect(screen.getByRole('heading', { name: 'Current MVP boundaries' })).toBeInTheDocument()
    expect(screen.getByText('No purchasing integration.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Future integrations' })).toBeInTheDocument()
    expect(screen.getByText('Purchasing receipts can later create inbound movements.')).toBeInTheDocument()
  })

  it('remains understandable without relying on color-only content', () => {
    render(<ProcessFlowPage definition={inventoryFlow} />)

    expect(screen.getByText('Process steps')).toBeInTheDocument()
    expect(screen.getAllByText('Inputs').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Outputs').length).toBeGreaterThan(0)
    expect(screen.getByText('What this module owns')).toBeInTheDocument()
    expect(screen.getByText('What this module does not own')).toBeInTheDocument()
  })

  it('does not render form controls or mutation actions', () => {
    render(<ProcessFlowPage definition={inventoryFlow} />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('does not make API calls', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    render(<ProcessFlowPage definition={inventoryFlow} />)

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('accepts a frozen readonly definition', () => {
    expect(Object.isFrozen(inventoryFlow)).toBe(true)

    render(<ProcessFlowPage definition={inventoryFlow} />)

    expect(screen.getByRole('heading', { name: 'Inventory Process Flow' })).toBeInTheDocument()
  })
})
