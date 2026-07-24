'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { DataTableQueryState } from './types'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25

export function useTableQueryState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateTableQuery(
    patch: Partial<DataTableQueryState> & { filters?: Record<string, string | undefined> },
    resetPage = false,
  ) {
    const next = new URLSearchParams(searchParams.toString())
    const values: Record<string, string | number | undefined> = {
      q: patch.q,
      page: resetPage ? DEFAULT_PAGE : patch.page,
      pageSize: patch.pageSize,
      sort: patch.sort,
      direction: patch.direction,
      ...patch.filters,
    }

    for (const [key, value] of Object.entries(values)) {
      const isDefault = (key === 'page' && value === DEFAULT_PAGE)
        || (key === 'pageSize' && value === DEFAULT_PAGE_SIZE)
      if (value === undefined || value === '' || isDefault) next.delete(key)
      else next.set(key, String(value))
    }

    const query = next.toString()
    router.push((query ? `${pathname}?${query}` : pathname) as never)
  }

  return { updateTableQuery }
}
