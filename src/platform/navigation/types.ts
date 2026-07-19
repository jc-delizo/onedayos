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
  id: 'inventory' | 'organization'
  label: string
  href: string
  description: string
}

export type TenantNavContext = 'workspace' | 'inventory' | 'organization' | 'records'

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
