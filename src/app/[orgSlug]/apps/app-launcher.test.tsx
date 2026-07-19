// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppLauncher } from './app-launcher'
import type { TenantAppSwitcherItem } from '@/platform/navigation/types'

const inventoryApp: TenantAppSwitcherItem = {
  id: 'inventory',
  label: 'Inventory',
  href: '/acme/inventory',
  description: 'Stock levels, product settings, movements, and manual adjustments.',
}

const organizationApp: TenantAppSwitcherItem = {
  id: 'organization',
  label: 'Organization',
  href: '/acme/organization',
  description: 'People, branches, departments, and organization-wide settings.',
}

describe('AppLauncher', () => {
  it('shows Inventory when enabled and Organization for Org Admin users', () => {
    render(<AppLauncher apps={[inventoryApp, organizationApp]} />)

    expect(screen.getByRole('heading', { name: 'Choose an app' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Inventory' })).toHaveAttribute('href', '/acme/inventory')
    expect(screen.getByRole('link', { name: 'Open Organization' })).toHaveAttribute('href', '/acme/organization')
  })

  it('hides Organization for non-admin users and never shows Records as an app', () => {
    render(<AppLauncher apps={[inventoryApp]} />)

    expect(screen.getByRole('link', { name: 'Open Inventory' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open Organization' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Records/i })).not.toBeInTheDocument()
  })
})
