// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  buildStockHealthPercentages,
  MovementTrendChart,
  StockHealthChart,
  WarehouseStockChart,
} from './inventory-dashboard-charts'

vi.mock('recharts', () => {
  const Wrapper = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  return {
    Bar: Wrapper,
    BarChart: Wrapper,
    CartesianGrid: Wrapper,
    Cell: Wrapper,
    Pie: Wrapper,
    PieChart: Wrapper,
    ResponsiveContainer: Wrapper,
    Tooltip: Wrapper,
    XAxis: Wrapper,
    YAxis: Wrapper,
  }
})

describe('Inventory Dashboard chart presenters', () => {
  it('renders Stock Health labels, values, percentages, and summary', () => {
    render(<StockHealthChart data={[
      { status: 'in_stock', label: 'In Stock', count: 7 },
      { status: 'low_stock', label: 'Low Stock', count: 2 },
      { status: 'out_of_stock', label: 'Out of Stock', count: 1 },
    ]} />)

    expect(screen.getByRole('heading', { name: 'Stock Health' })).toBeInTheDocument()
    expect(screen.getByText('Unique tracked Products by organization-wide stock status.')).toBeInTheDocument()
    expect(screen.getByLabelText('Chart legend')).toHaveTextContent('In Stock')
    expect(screen.getByRole('table', { name: /Stock health counts/ })).toHaveTextContent('70%')
    expect(screen.getByRole('table', { name: /Stock health counts/ })).toHaveTextContent('Out of Stock')
  })

  it('uses deterministic whole percentages that reconcile to 100', () => {
    const percentages = buildStockHealthPercentages([
      { status: 'in_stock', label: 'In Stock', count: 1 },
      { status: 'low_stock', label: 'Low Stock', count: 1 },
      { status: 'out_of_stock', label: 'Out of Stock', count: 1 },
    ])

    expect([...percentages.values()]).toEqual([34, 33, 33])
    expect([...percentages.values()].reduce((sum, percentage) => sum + percentage, 0)).toBe(100)
  })

  it('renders the honest 30-day empty state without inventing a trend', () => {
    const data = Array.from({ length: 30 }, (_, index) => ({
      date: `2026-07-${String(index + 1).padStart(2, '0')}`,
      inbound: 0,
      outbound: 0,
    }))
    render(<MovementTrendChart
      data={data}
      range={{ start: '2026-06-25', end: '2026-07-24', timezone: 'UTC' }}
    />)

    expect(screen.getByRole('heading', { name: 'Inbound vs Outbound movement' })).toBeInTheDocument()
    expect(screen.getByText('No movement in the last 30 days')).toBeInTheDocument()
    expect(screen.getByText(/No opening-balance or adjustment movement occurred/)).toBeInTheDocument()
    expect(screen.queryByText(/increase|decrease|trend/i)).not.toBeInTheDocument()
  })

  it('renders all Warehouses as Product positions and explains the unique-Product distinction', () => {
    render(<WarehouseStockChart data={[
      {
        warehouseName: 'Main Warehouse',
        trackedPositions: 12,
        lowStockPositions: 2,
        outOfStockPositions: 1,
      },
      {
        warehouseName: 'Cold Storage',
        trackedPositions: 0,
        lowStockPositions: 0,
        outOfStockPositions: 0,
      },
    ]} />)

    expect(screen.getByRole('heading', { name: 'Warehouse Stock Positions' })).toBeInTheDocument()
    expect(screen.getByText(/Each position is one Product balance in one Warehouse/)).toBeInTheDocument()
    const table = screen.getByRole('table', { name: /Product positions by Warehouse/ })
    expect(table).toHaveTextContent('Main Warehouse')
    expect(table).toHaveTextContent('Cold Storage')
    expect(table).toHaveTextContent('Out-of-Stock Positions')
    expect(table).not.toHaveTextContent('Total Quantity')
  })

  it('keeps Recharts in the approved presenter and uses semantic tokens without fake data', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/[orgSlug]/inventory/_components/inventory-dashboard-charts.tsx'),
      'utf8',
    )

    expect(source).toContain("from 'recharts'")
    expect(source).toContain('var(--chart-positive)')
    expect(source).toContain('var(--chart-warning)')
    expect(source).toContain('unit="product positions"')
    expect(source).toContain('Tracked Product positions by Warehouse')
    expect(source).toContain('isAnimationActive={false}')
    expect(source).not.toContain('fetch(')
    expect(source).not.toContain('orgId')
    expect(source).not.toMatch(/fake|fabricated/i)
  })
})
