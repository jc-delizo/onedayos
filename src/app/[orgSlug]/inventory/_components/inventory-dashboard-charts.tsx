'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartDataTable,
  ChartEmptyState,
  ChartTooltip,
  type ChartLegendItem,
} from '@/components/onedayos/charts'
import type {
  MovementTrendDatum,
  StockHealthDatum,
  WarehouseStockDatum,
} from '@/modules/inventory/types'

const stockHealthColors = {
  in_stock: 'var(--chart-positive)',
  low_stock: 'var(--chart-warning)',
  out_of_stock: 'var(--chart-negative)',
} as const

const stockHealthLegend: ChartLegendItem[] = [
  { label: 'In Stock', color: stockHealthColors.in_stock, marker: 'solid' },
  { label: 'Low Stock', color: stockHealthColors.low_stock, marker: 'striped' },
  { label: 'Out of Stock', color: stockHealthColors.out_of_stock, marker: 'dashed' },
]

const movementLegend: ChartLegendItem[] = [
  { label: 'Inbound', color: 'var(--chart-primary)', marker: 'solid' },
  { label: 'Outbound', color: 'var(--chart-secondary)', marker: 'striped' },
]

const warehouseLegend: ChartLegendItem[] = [
  { label: 'Tracked Positions', color: 'var(--chart-secondary)', marker: 'solid' },
  { label: 'Low-Stock Positions', color: 'var(--chart-warning)', marker: 'striped' },
  { label: 'Out-of-Stock Positions', color: 'var(--chart-negative)', marker: 'dashed' },
]

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`))
}

function StockHealthTooltip({
  active,
  payload,
  percentages,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: StockHealthDatum }>
  percentages: ReadonlyMap<StockHealthDatum['status'], number>
}) {
  const datum = payload?.[0]?.payload
  if (!active || !datum) return null

  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-popover-background)] p-3 text-xs text-[var(--color-popover-foreground)] shadow-[var(--shadow-floating)]">
      <p className="font-semibold">{datum.label}</p>
      <p>{datum.count} products · {percentages.get(datum.status) ?? 0}%</p>
    </div>
  )
}

export function buildStockHealthPercentages(
  data: StockHealthDatum[],
): Map<StockHealthDatum['status'], number> {
  const total = data.reduce((sum, datum) => sum + datum.count, 0)
  if (total === 0) return new Map(data.map((datum) => [datum.status, 0]))

  const shares = data.map((datum, index) => {
    const exact = (datum.count / total) * 100
    return { status: datum.status, index, rounded: Math.floor(exact), remainder: exact - Math.floor(exact) }
  })
  const remaining = 100 - shares.reduce((sum, share) => sum + share.rounded, 0)
  const distributionOrder = [...shares].sort((left, right) => (
    right.remainder - left.remainder || left.index - right.index
  ))

  for (let index = 0; index < remaining; index += 1) {
    distributionOrder[index % distributionOrder.length].rounded += 1
  }

  return new Map(shares.map((share) => [share.status, share.rounded]))
}

export function StockHealthChart({ data }: { data: StockHealthDatum[] }) {
  const total = data.reduce((sum, datum) => sum + datum.count, 0)
  const percentages = buildStockHealthPercentages(data)

  return (
    <ChartContainer
      id="inventory-stock-health"
      title="Stock Health"
      description="Unique tracked Products by organization-wide stock status."
      legend={stockHealthLegend}
      dataSummary={total > 0 ? (
        <ChartDataTable
          label="Stock health counts and percentages"
          rows={data}
          getRowKey={(row) => row.status}
          columns={[
            { id: 'status', header: 'Status', cell: (row) => row.label },
            { id: 'count', header: 'Products', cell: (row) => row.count },
            {
              id: 'percentage',
              header: 'Share',
              cell: (row) => `${percentages.get(row.status) ?? 0}%`,
            },
          ]}
        />
      ) : (
        <p className="border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted)]">
          No tracked Products are available to summarize.
        </p>
      )}
    >
      {total === 0 ? (
        <ChartEmptyState
          title="No tracked Products"
          description="Enable Inventory Tracking for a Product to populate stock health."
        />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius="54%"
              outerRadius="82%"
              paddingAngle={2}
              isAnimationActive={false}
              stroke="var(--color-surface)"
              strokeWidth={2}
            >
              {data.map((datum) => (
                <Cell key={datum.status} fill={stockHealthColors[datum.status]} />
              ))}
            </Pie>
            <Tooltip content={<StockHealthTooltip percentages={percentages} />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  )
}

export function MovementTrendChart({
  data,
  range,
}: {
  data: MovementTrendDatum[]
  range: { start: string; end: string; timezone: 'UTC' }
}) {
  const hasActivity = data.some((datum) => datum.inbound > 0 || datum.outbound > 0)

  return (
    <ChartContainer
      id="inventory-movement-trend"
      title="Inbound vs Outbound movement"
      description={`Daily opening-balance and adjustment quantities from ${formatDate(range.start)} to ${formatDate(range.end)} (${range.timezone}).`}
      legend={movementLegend}
      dataSummary={hasActivity ? (
        <ChartDataTable
          label="Daily inbound and outbound movement quantities"
          rows={data}
          getRowKey={(row) => row.date}
          columns={[
            { id: 'date', header: 'Date (UTC)', cell: (row) => formatDate(row.date) },
            { id: 'inbound', header: 'Inbound units', cell: (row) => row.inbound },
            { id: 'outbound', header: 'Outbound units', cell: (row) => row.outbound },
          ]}
        />
      ) : (
        <p className="border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted)]">
          No opening-balance or adjustment movement occurred in this 30-day UTC period.
        </p>
      )}
    >
      {hasActivity ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} accessibilityLayer>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<ChartTooltip unit="units" />} labelFormatter={(label) => formatDate(String(label))} />
            <Bar dataKey="inbound" name="Inbound" fill="var(--chart-primary)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="outbound" name="Outbound" fill="var(--chart-secondary)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmptyState
          title="No movement in the last 30 days"
          description="Older ledger history remains available in Stock Movements. New adjustments will appear here."
        />
      )}
    </ChartContainer>
  )
}

export function WarehouseStockChart({ data }: { data: WarehouseStockDatum[] }) {
  const hasTrackedPositions = data.some((datum) => datum.trackedPositions > 0)

  return (
    <ChartContainer
      id="inventory-warehouse-stock"
      title="Warehouse Stock Positions"
      description="Tracked Product positions by Warehouse. Each position is one Product balance in one Warehouse, so these counts do not reconcile to the unique Product KPI."
      legend={warehouseLegend}
      dataSummary={data.length > 0 ? (
        <ChartDataTable
          label="Tracked, low-stock, and out-of-stock Product positions by Warehouse"
          rows={data}
          getRowKey={(row) => row.warehouseName}
          defaultOpen
          columns={[
            { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouseName },
            { id: 'tracked', header: 'Tracked Positions', cell: (row) => row.trackedPositions },
            { id: 'low', header: 'Low-Stock Positions', cell: (row) => row.lowStockPositions },
            { id: 'out', header: 'Out-of-Stock Positions', cell: (row) => row.outOfStockPositions },
          ]}
        />
      ) : (
        <p className="border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted)]">
          No active Warehouses are available.
        </p>
      )}
    >
      {!hasTrackedPositions ? (
        <ChartEmptyState
          title={data.length === 0 ? 'No active Warehouses' : 'No tracked stock by Warehouse'}
          description="Tracked Product balances will populate this comparison."
        />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="warehouseName"
              width={112}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip unit="product positions" />} />
            <Bar dataKey="trackedPositions" name="Tracked Positions" fill="var(--chart-secondary)" radius={[0, 3, 3, 0]} isAnimationActive={false} />
            <Bar dataKey="lowStockPositions" name="Low-Stock Positions" fill="var(--chart-warning)" radius={[0, 3, 3, 0]} isAnimationActive={false} />
            <Bar dataKey="outOfStockPositions" name="Out-of-Stock Positions" fill="var(--chart-negative)" radius={[0, 3, 3, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  )
}
