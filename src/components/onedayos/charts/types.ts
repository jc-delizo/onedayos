import type { ReactNode } from 'react'

export type ChartLegendItem = {
  label: string
  color: string
  marker?: 'solid' | 'striped' | 'dashed'
}
export type ChartDataColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
}
