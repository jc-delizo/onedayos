// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppLauncher } from './app-launcher'
import type { TenantAppSwitcherItem } from '@/platform/navigation/types'

const inventoryApp: TenantAppSwitcherItem = {
  id: 'inventory',
  label: 'Inventory',
  href: '/acme/inventory',
  description: 'Stock levels, movements, tracking settings, and manual adjustments.',
  icon: 'Package',
}

const sharedRecordsApp: TenantAppSwitcherItem = {
  id: 'shared-records',
  label: 'Shared Records',
  href: '/acme/records',
  description: 'Organization-wide Products, Categories, Customers, Suppliers, and Warehouses.',
  icon: 'Database',
}

const organizationApp: TenantAppSwitcherItem = {
  id: 'organization',
  label: 'Organization',
  href: '/acme/organization',
  description: 'People, branches, departments, and organization-wide settings.',
  icon: 'Building2',
}

describe('AppLauncher', () => {
  it('shows Inventory when enabled and Organization for Org Admin users', () => {
    render(<AppLauncher apps={[inventoryApp, sharedRecordsApp, organizationApp]} />)

    expect(screen.getByRole('heading', { name: 'Choose an app' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Inventory' })).toHaveAttribute('href', '/acme/inventory')
    expect(screen.getByRole('link', { name: 'Open Shared Records' })).toHaveAttribute('href', '/acme/records')
    expect(screen.getByRole('link', { name: 'Open Organization' })).toHaveAttribute('href', '/acme/organization')
  })

  it('shows permission-derived Shared Records while hiding Organization for non-admin users', () => {
    render(<AppLauncher apps={[inventoryApp, sharedRecordsApp]} />)

    expect(screen.getByRole('link', { name: 'Open Inventory' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open Organization' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Shared Records' })).toBeInTheDocument()
  })
})
