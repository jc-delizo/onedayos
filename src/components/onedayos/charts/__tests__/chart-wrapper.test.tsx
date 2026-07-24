// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  ChartContainer,
  ChartDataTable,
  ChartEmptyState,
  ChartErrorState,
  ChartLegend,
  ChartLoadingState,
  formatChartValue,
} from '..'

describe('OneDayOS chart wrapper', () => {
  it('associates title and description and exposes legend plus data summary', () => {
    render(
      <ChartContainer
        id="stock-health"
        title="Stock health"
        description="Current tracked Products by stock status."
        legend={[{ label: 'Low Stock', color: 'var(--chart-warning)', marker: 'striped' }]}
        dataSummary={(
          <ChartDataTable
            label="Stock health data"
            rows={[{ status: 'Low Stock', count: 2 }]}
            getRowKey={(row) => row.status}
            columns={[
              { id: 'status', header: 'Status', cell: (row) => row.status },
              { id: 'count', header: 'Products', cell: (row) => row.count },
            ]}
          />
        )}
      >
        <div>Responsive chart region</div>
      </ChartContainer>,
    )

    const section = screen.getByRole('region', { name: 'Stock health' })
    expect(section).toHaveAttribute('aria-describedby', 'stock-health-description')
    expect(screen.getByText('Current tracked Products by stock status.')).toHaveAttribute('id', 'stock-health-description')
    expect(screen.getByLabelText('Chart legend')).toHaveTextContent('Low Stock')
    expect(screen.getByRole('table', { name: 'Stock health data' })).toBeInTheDocument()
  })

  it('provides deterministic tooltip units and contextual states', () => {
    expect(formatChartValue(12.5, 'units')).toBe('12.5 units')
    expect(formatChartValue('bad', 'products')).toBe('0 products')

    render(
      <>
        <ChartEmptyState title="No tracked Products" description="Enable tracking to begin." />
        <ChartLoadingState />
        <ChartErrorState />
        <ChartLegend items={[{ label: 'Inbound', color: 'var(--chart-primary)' }]} />
      </>,
    )

    expect(screen.getByText('No tracked Products')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading chart' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('temporarily unavailable')
    expect(screen.getByLabelText('Chart legend')).toHaveTextContent('Inbound')
  })

  it('uses semantic chart tokens without fetching or accepting tenant identity', () => {
    const root = join(process.cwd(), 'src/components/onedayos/charts')
    const source = [
      'chart-container.tsx',
      'chart-data-table.tsx',
      'chart-states.tsx',
      'chart-tooltip.tsx',
      'types.ts',
    ].map((file) => readFileSync(join(root, file), 'utf8')).join('\n')
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

    expect(source).not.toContain('fetch(')
    expect(source).not.toContain('orgId')
    expect(source).not.toContain('PlatformContext')
    expect(css).toContain('--chart-primary:')
    expect(css).toContain('--chart-positive:')
    expect(css).toContain('--chart-warning:')
    expect(css.match(/--chart-primary:/g)).toHaveLength(2)
  })
})
