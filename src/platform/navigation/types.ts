import type { ReactNode } from 'react'

export type TenantNavItem = {
  id: string
  label: string
  href: string
  description?: string
  exact?: boolean
}

export type TenantNavSection = {
  id: string
  label: string
  items: TenantNavItem[]
}

export type TenantAppSwitcherItem = {
  id: 'inventory' | 'shared-records' | 'organization'
  label: string
  href: string
  description: string
  icon: 'Package' | 'Database' | 'Building2'
}

export type TenantNavContext = 'workspace' | 'inventory' | 'shared-records' | 'organization'

export type TenantAppShellModel = {
  org: {
    name: string
    slug: string
    plan: string
  }
  user: {
    name: string
    email: string
  }
  apps: TenantAppSwitcherItem[]
  sidebars: Record<TenantNavContext, TenantNavSection[]>
  aside?: ReactNode
}
