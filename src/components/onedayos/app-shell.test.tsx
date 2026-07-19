// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getCurrentNavContext, isSegmentActive, TenantAppShell } from './app-shell'
import { ThemeProvider } from './theme-provider'
import { APPEARANCE_STORAGE_KEY } from './theme-script'
import type { TenantAppShellModel } from '@/platform/navigation/types'

let mockedPathname = '/acme/inventory'

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
}))

const adminModel: TenantAppShellModel = {
  org: {
    name: 'Acme Trading',
    slug: 'acme',
    plan: 'demo',
  },
  user: {
    name: 'Demo Org Admin',
    email: 'demo@example.test',
  },
  apps: [
    {
      id: 'inventory',
      label: 'Inventory',
      href: '/acme/inventory',
      description: 'Stock levels, product settings, movements, and manual adjustments.',
    },
    {
      id: 'organization',
      label: 'Organization',
      href: '/acme/organization',
      description: 'People, branches, departments, and organization-wide settings.',
    },
  ],
  sidebars: {
    workspace: [
      {
        id: 'apps',
        label: 'Apps',
        items: [
          { id: 'app-inventory', label: 'Inventory', href: '/acme/inventory' },
          { id: 'app-organization', label: 'Organization', href: '/acme/organization' },
        ],
      },
    ],
    inventory: [
      {
        id: 'inventory',
        label: 'Inventory',
        items: [
          { id: 'inventory-dashboard', label: 'Dashboard', href: '/acme/inventory', exact: true },
          { id: 'inventory-process-flow', label: 'Process Flow', href: '/acme/inventory/process-flow' },
          { id: 'inventory-product-settings', label: 'Product Settings', href: '/acme/inventory/product-settings' },
          { id: 'inventory-stock-levels', label: 'Stock Levels', href: '/acme/inventory/stock-levels' },
          { id: 'inventory-stock-movements', label: 'Stock Movements', href: '/acme/inventory/stock-movements' },
          { id: 'inventory-stock-adjustments', label: 'Stock Adjustments', href: '/acme/inventory/stock-adjustments' },
        ],
      },
      {
        id: 'related-records',
        label: 'Related Records',
        items: [
          { id: 'products', label: 'Products', href: '/acme/records/products' },
          { id: 'product-categories', label: 'Categories', href: '/acme/records/product-categories' },
          { id: 'suppliers', label: 'Suppliers', href: '/acme/records/suppliers' },
          { id: 'warehouses', label: 'Warehouses', href: '/acme/records/warehouses' },
        ],
      },
    ],
    organization: [
      {
        id: 'organization',
        label: 'Organization',
        items: [
          { id: 'organization-people', label: 'People', href: '/acme/organization/people' },
          {
            id: 'organization-branches-departments',
            label: 'Branches & Departments',
            href: '/acme/organization/branches-departments',
          },
          { id: 'organization-settings', label: 'Settings', href: '/acme/organization/settings' },
        ],
      },
    ],
    records: [
      {
        id: 'shared-records',
        label: 'Shared Records',
        items: [
          { id: 'employees', label: 'Employees', href: '/acme/records/employees' },
          { id: 'products', label: 'Products', href: '/acme/records/products' },
          { id: 'customers', label: 'Customers', href: '/acme/records/customers' },
          { id: 'suppliers', label: 'Suppliers', href: '/acme/records/suppliers' },
        ],
      },
    ],
  },
}


function renderWithTheme(ui: Parameters<typeof render>[0]) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

const staffModel: TenantAppShellModel = {
  ...adminModel,
  apps: [adminModel.apps[0]],
  sidebars: {
    ...adminModel.sidebars,
    workspace: [
      {
        id: 'apps',
        label: 'Apps',
        items: [{ id: 'app-inventory', label: 'Inventory', href: '/acme/inventory' }],
      },
    ],
    organization: [],
  },
}

describe('TenantAppShell navigation', () => {
  it('shows organization name at the sidebar top without the old OneDayOS text or org card', () => {
    mockedPathname = '/acme/inventory'
    const { container } = renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Inventory content</p>
      </TenantAppShell>,
    )

    const aside = container.querySelector('aside')

    expect(aside).not.toBeNull()
    expect(within(aside as HTMLElement).getByText('Acme Trading')).toBeInTheDocument()
    expect(within(aside as HTMLElement).queryByText('OneDayOS')).not.toBeInTheDocument()
    expect(within(aside as HTMLElement).queryByText('/acme')).not.toBeInTheDocument()
    expect(within(aside as HTMLElement).queryByText('demo')).not.toBeInTheDocument()
  })

  it('opens the app switcher as a right-side popover for Org Admin users without retired app text', async () => {
    const user = userEvent.setup()
    mockedPathname = '/acme/inventory'
    const { container } = renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Inventory content</p>
      </TenantAppShell>,
    )

    expect(screen.queryByText('Current App')).not.toBeInTheDocument()
    expect(screen.queryByText('Apps >')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch apps' })).toHaveTextContent('Inventory')
    expect(screen.getByRole('button', { name: 'Switch apps' }).querySelector('svg')).not.toBeNull()
    expect(container.querySelector('.lucide-grid-3x3')).not.toBeNull()
    expect(container.querySelector('details')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Switch apps' }))

    const menu = screen.getByRole('menu', { name: 'Apps' })
    expect(within(menu).getByRole('menuitem', { name: /Inventory: Stock levels/i })).toHaveAttribute('href', '/acme/inventory')
    expect(within(menu).getByRole('menuitem', { name: /Organization: People/i })).toHaveAttribute('href', '/acme/organization')
  })

  it('hides Organization from the app switcher for non-admin users', async () => {
    const user = userEvent.setup()
    mockedPathname = '/acme/inventory'

    renderWithTheme(
      <TenantAppShell model={staffModel}>
        <p>Inventory content</p>
      </TenantAppShell>,
    )

    await user.click(screen.getByRole('button', { name: 'Switch apps' }))

    const menu = screen.getByRole('menu', { name: 'Apps' })
    expect(within(menu).getByRole('menuitem', { name: /Inventory: Stock levels/i })).toBeInTheDocument()
    expect(within(menu).queryByRole('menuitem', { name: /Organization: People/i })).not.toBeInTheDocument()
  })

  it('keeps Inventory sidebar operational and excludes Organization-only records', () => {
    mockedPathname = '/acme/inventory/product-settings'

    renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Inventory content</p>
      </TenantAppShell>,
    )

    const nav = screen.getByRole('navigation', { name: 'Workspace navigation' })
    expect(within(nav).getByText('Inventory')).toBeInTheDocument()
    expect(within(nav).getByText('Related Records')).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Process Flow' })).toHaveAttribute('href', '/acme/inventory/process-flow')
    expect(within(nav).getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/acme/records/products')
    expect(within(nav).getByRole('link', { name: 'Categories' })).toHaveAttribute('href', '/acme/records/product-categories')
    expect(within(nav).getByRole('link', { name: 'Suppliers' })).toHaveAttribute('href', '/acme/records/suppliers')
    expect(within(nav).getByRole('link', { name: 'Warehouses' })).toHaveAttribute('href', '/acme/records/warehouses')
    expect(within(nav).queryByRole('link', { name: 'People' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Employees' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Customers' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Organization' })).not.toBeInTheDocument()
  })

  it('marks Process Flow active without activating Dashboard', () => {
    mockedPathname = '/acme/inventory/process-flow'

    renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Process Flow content</p>
      </TenantAppShell>,
    )

    const nav = screen.getByRole('navigation', { name: 'Workspace navigation' })
    expect(within(nav).getByRole('link', { name: 'Process Flow' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('shows Organization sidebar without Inventory operational links', () => {
    mockedPathname = '/acme/organization/people'

    renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Organization content</p>
      </TenantAppShell>,
    )

    const nav = screen.getByRole('navigation', { name: 'Workspace navigation' })
    expect(within(nav).getByRole('link', { name: 'People' })).toHaveAttribute('href', '/acme/organization/people')
    expect(within(nav).getByRole('link', { name: 'Branches & Departments' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Settings' })).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Stock Levels' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Stock Adjustments' })).not.toBeInTheDocument()
  })

  it('does not trap Records pages away from Inventory', async () => {
    const user = userEvent.setup()
    mockedPathname = '/acme/records/products'

    renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Records content</p>
      </TenantAppShell>,
    )

    const nav = screen.getByRole('navigation', { name: 'Workspace navigation' })
    expect(within(nav).getByRole('link', { name: 'Products' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Switch apps' }))

    expect(screen.getByRole('menuitem', { name: /Inventory: Stock levels/i })).toHaveAttribute('href', '/acme/inventory')
  })

  it('renders a single profile button with Profile, Appearance, and Sign out menu actions', async () => {
    const user = userEvent.setup()
    mockedPathname = '/acme/inventory'

    renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Inventory content</p>
      </TenantAppShell>,
    )

    const profileButton = screen.getByRole('button', { name: 'Open profile menu' })
    expect(profileButton).toHaveTextContent('Demo Org Admin')

    await user.click(profileButton)

    const menu = screen.getByRole('menu', { name: 'Profile menu' })
    expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', '/acme/profile')
    expect(within(menu).getByText('Appearance')).toBeInTheDocument()
    expect(within(menu).getByRole('menuitemradio', { name: /Light/ })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitemradio', { name: /Dark/ })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitemradio', { name: /System/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(menu).getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()
    expect(menu.querySelectorAll('svg').length).toBeGreaterThanOrEqual(5)
  })

  it('changes appearance immediately without API calls or tenant identity', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    localStorage.clear()
    document.documentElement.className = ''
    mockedPathname = '/acme/inventory'

    renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Inventory content</p>
      </TenantAppShell>,
    )

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    await user.click(screen.getByRole('menuitemradio', { name: /Dark/ }))

    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-appearance', 'dark')
    expect(document.documentElement).toHaveAttribute('data-resolved-appearance', 'dark')
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark')
    expect(localStorage.getItem('orgId')).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.queryByRole('menu', { name: 'Profile menu' })).not.toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('keeps appearance options as real keyboard controls with non-color selected state', async () => {
    const user = userEvent.setup()
    localStorage.clear()
    document.documentElement.className = ''
    mockedPathname = '/acme/inventory'

    renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Inventory content</p>
      </TenantAppShell>,
    )

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))

    const menu = screen.getByRole('menu', { name: 'Profile menu' })
    const lightOption = within(menu).getByRole('menuitemradio', { name: /Light/ })

    expect(lightOption.tagName).toBe('BUTTON')
    expect(within(menu).getByRole('menuitemradio', { name: /System/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(menu).getByText('Selected')).toBeInTheDocument()

    await user.click(lightOption)

    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-appearance', 'light')
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('light')
  })

  it('does not render a shell header strip, notification-style active dot, or selected left rail', () => {
    mockedPathname = '/acme/inventory'
    const { container } = renderWithTheme(
      <TenantAppShell model={adminModel}>
        <p>Inventory content</p>
      </TenantAppShell>,
    )

    expect(container.querySelector('header')).toBeNull()
    expect(container.querySelector('span.size-1\\.5.rounded-full')).toBeNull()
    expect(screen.queryByText('Records / Products')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-current="page"]')?.className).not.toContain('border-l')
  })

  it('uses segment-aware active matching and app context detection', () => {
    expect(isSegmentActive('/acme/inventory', '/acme/inventory')).toBe(true)
    expect(isSegmentActive('/acme/inventory/product-settings', '/acme/inventory')).toBe(true)
    expect(isSegmentActive('/acme/inventory/process-flow', '/acme/inventory/process-flow')).toBe(true)
    expect(isSegmentActive('/acme/inventory-audit', '/acme/inventory')).toBe(false)
    expect(isSegmentActive('/acme/records/products/new', '/acme/records/products')).toBe(true)
    expect(isSegmentActive('/acme/records/products', '/acme/records', true)).toBe(false)
    expect(getCurrentNavContext('/acme/inventory-audit', 'acme')).toBe('workspace')
    expect(getCurrentNavContext('/acme/organization/settings', 'acme')).toBe('organization')
  })
})
