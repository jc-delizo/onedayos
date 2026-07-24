// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '@/test/accessibility'
import {
  ChartContainer,
  ChartDataTable,
  ChartEmptyState,
  ChartLegend,
} from '..'

const A11Y_TIMEOUT = 15_000

describe('OneDayOS chart accessibility', () => {
  it('has no detectable violations with legend and accessible data fallback', async () => {
    const rows = [{ date: '2026-07-24', inbound: 8, outbound: 3 }]
    const { container } = render(
      <ChartContainer
        id="movement"
        title="Inbound vs Outbound movement"
        description="Current adjustment movement quantities in UTC."
        legend={[
          { label: 'Inbound', color: 'var(--chart-primary)' },
          { label: 'Outbound', color: 'var(--chart-secondary)', marker: 'striped' },
        ]}
        dataSummary={(
          <ChartDataTable
            label="Movement data"
            rows={rows}
            getRowKey={(row) => row.date}
            columns={[
              { id: 'date', header: 'Date', cell: (row) => row.date },
              { id: 'inbound', header: 'Inbound units', cell: (row) => row.inbound },
              { id: 'outbound', header: 'Outbound units', cell: (row) => row.outbound },
            ]}
          />
        )}
      >
        <svg><title>Decorative visual chart</title></svg>
      </ChartContainer>,
    )

    expect(screen.getByRole('table', { name: 'Movement data' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('has no detectable violations in chart empty states', async () => {
    const { container } = render(
      <section aria-label="Empty charts">
        <ChartEmptyState title="No movement in the last 30 days" description="Older ledger history remains available." />
        <ChartLegend items={[{ label: 'Low Stock', color: 'var(--chart-warning)', marker: 'striped' }]} />
      </section>,
    )

    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)
})
