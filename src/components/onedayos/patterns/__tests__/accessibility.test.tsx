// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppearanceProvider } from '@/components/onedayos/appearance-provider'
import { TenantAppShell } from '@/components/onedayos/app-shell'
import { expectNoA11yViolations } from '@/test/accessibility'
import {
  AppPage,
  DashboardMetric,
  DashboardPage,
  FormPage,
  ListPage,
  ModuleUnavailablePageState,
  PermissionDeniedPageState,
  ProcessFlowPage,
  SafePageErrorState,
  SettingsPage,
  TrueEmptyState,
} from '..'
import type { ProcessFlowDefinition } from '@/sdk'
import type { TenantAppShellModel } from '@/platform/navigation/types'

const A11Y_TIMEOUT = 15_000

vi.mock('next/navigation', () => ({
  usePathname: () => '/acme/inventory',
}))

const flow = {
  title: 'Inventory Process Flow',
  description: 'How shared records, settings, adjustments, balances, and movements work together.',
  steps: [
    {
      id: 'shared-records',
      number: 1,
      title: 'Shared Records',
      description: 'Products and Warehouses are created as shared Records.',
      inputs: ['Product', 'Warehouse'],
      outputs: ['Shared identity'],
    },
    {
      id: 'posting',
      number: 2,
      title: 'Transactional Posting',
      description: 'One adjustment creates an adjustment, movement, and balance update.',
      inputs: ['Validated Product', 'Validated Warehouse'],
      outputs: ['StockAdjustment', 'StockMovement', 'StockBalance'],
      warning: 'Negative resulting stock is prevented.',
    },
  ],
  owns: ['StockBalance', 'StockMovement', 'StockAdjustment'],
  doesNotOwn: ['Product', 'Warehouse', 'Supplier'],
  currentBoundaries: ['No purchasing receipt integration in this MVP.'],
  futureIntegrations: ['Purchasing receipts can connect later through an approved package.'],
} as const satisfies ProcessFlowDefinition

const shellModel: TenantAppShellModel = {
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
      description: 'Stock levels, movements, tracking settings, and manual adjustments.',
      icon: 'Package',
    },
    {
      id: 'shared-records',
      label: 'Shared Records',
      href: '/acme/records',
      description: 'Organization-wide business identities.',
      icon: 'Database',
    },
    {
      id: 'organization',
      label: 'Organization',
      href: '/acme/organization',
      description: 'People, branches, departments, and organization-wide settings.',
      icon: 'Building2',
    },
  ],
  sidebars: {
    workspace: [],
    inventory: [
      {
        id: 'inventory',
        label: 'Inventory',
        items: [
          { id: 'inventory-dashboard', label: 'Dashboard', href: '/acme/inventory', exact: true },
          { id: 'inventory-process-flow', label: 'Process Flow', href: '/acme/inventory/process-flow' },
          { id: 'inventory-stock-levels', label: 'Stock Levels', href: '/acme/inventory/stock-levels' },
        ],
      },
    ],
    organization: [],
    'shared-records': [],
  },
}

describe('OneDayOS shared page-pattern accessibility', () => {
  it('AppPage exposes a semantic page header and accessible primary action', async () => {
    const { container } = render(
      <AppPage
        breadcrumb={[
          { label: 'Inventory', href: '/acme/inventory' },
          { label: 'Stock Levels' },
        ]}
        title="Stock Levels"
        description="Current quantity by Product and Warehouse."
        primaryAction={<Button>New Adjustment</Button>}
      >
        <p>Current stock content.</p>
      </AppPage>,
    )

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Stock Levels' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New Adjustment' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('DashboardPage renders accessible real metrics and content', async () => {
    const { container } = render(
      <DashboardPage
        title="Inventory Overview"
        description="Current tracked stock and low-stock pressure."
        metrics={<DashboardMetric label="Low-stock products" value="1" description="Computed from Stock Levels." />}
        primaryContent={<p>Recent movement table appears here.</p>}
      />,
    )

    expect(screen.getByLabelText('Dashboard metrics')).toHaveTextContent('Low-stock products')
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('ListPage supports semantic table content and status text', async () => {
    const { container } = render(
      <ListPage title="Stock Levels" description="Current inventory quantity.">
        <table>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Coffee Beans 1kg</td>
              <td>Low Stock</td>
            </tr>
          </tbody>
        </table>
      </ListPage>,
    )

    expect(screen.getByRole('columnheader', { name: 'Product' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Low Stock' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('FormPage exposes labels, help text, and actions', async () => {
    const { container } = render(
      <FormPage
        title="New Adjustment"
        description="Post a manual stock correction."
        form={
          <form aria-label="Stock adjustment form">
            <label htmlFor="reason">Reason</label>
            <Input id="reason" name="reason" aria-describedby="reason-help" />
            <p id="reason-help">Use a short business reason.</p>
          </form>
        }
        footer={<Button type="submit">Post Adjustment</Button>}
        cancelAction={<Button variant="quiet">Cancel</Button>}
      />,
    )

    expect(screen.getByRole('form', { name: 'Stock adjustment form' })).toBeInTheDocument()
    expect(screen.getByLabelText('Reason')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('SettingsPage exposes settings navigation and content', async () => {
    const { container } = render(
      <SettingsPage
        title="Organization Settings"
        description="Configure organization-wide preferences."
        sectionNavigation={<a href="#general">General</a>}
        sections={<section id="general"><h2>General</h2><p>Organization name.</p></section>}
      />,
    )

    expect(screen.getByLabelText('Settings sections')).toHaveTextContent('General')
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('Organization admin surfaces remain accessible through shared page patterns', async () => {
    const people = render(
      <ListPage
        breadcrumb="Organization / People"
        title="People"
        description="Manage people and platform-user relationships for this organization."
        contextualHelp="User login and Employee records are related but separate."
      >
        <table>
          <caption className="sr-only">Platform users and employee records</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Login</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Demo Org Admin</td>
              <td>Linked</td>
            </tr>
          </tbody>
        </table>
      </ListPage>,
    )

    expect(screen.getByRole('heading', { name: 'People' })).toBeInTheDocument()
    await expectNoA11yViolations(people.container)
    people.unmount()

    const branches = render(
      <ListPage
        breadcrumb="Organization / Branches & Departments"
        title="Branches & Departments"
        description="Manage company locations and organizational structure used across OneDayOS."
      >
        <table>
          <caption className="sr-only">Branches and departments</caption>
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MAIN</td>
              <td>Main Branch</td>
            </tr>
          </tbody>
        </table>
      </ListPage>,
    )

    expect(screen.getByRole('heading', { name: 'Branches & Departments' })).toBeInTheDocument()
    await expectNoA11yViolations(branches.container)
    branches.unmount()

    const settings = render(
      <SettingsPage
        breadcrumb="Organization / Settings"
        title="Settings"
        description="Configure organization-wide preferences supported by OneDayOS."
        sections={<section><h2>Organization</h2><p>Supported preferences appear here without raw setting payloads.</p></section>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    await expectNoA11yViolations(settings.container)
  }, A11Y_TIMEOUT)

  it('Shared Records built-in app surfaces remain accessible and ownership-explicit', async () => {
    const recordsLanding = render(
      <AppPage
        breadcrumb="Shared Records"
        title="Shared Records"
        headerMode="compact"
        contextualHelp="Shared Records are organization-wide business identities reused by enabled apps. People remains under Organization."
      >
        <section aria-label="Shared record areas">
          <h2>Products</h2>
          <p>Shared product/SKU identity used by Inventory and future modules.</p>
        </section>
      </AppPage>,
    )

    expect(screen.getByText(/Shared Records are organization-wide business identities reused/)).toBeInTheDocument()
    await expectNoA11yViolations(recordsLanding.container)
    recordsLanding.unmount()

    const products = render(
      <ListPage headerMode="compact" title="Products" contextualHelp="Shared Product identity used by Inventory and other apps.">
        <table>
          <caption className="sr-only">Shared Products</caption>
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>WATER-500</td>
              <td>Bottled Water 500ml</td>
            </tr>
          </tbody>
        </table>
      </ListPage>,
    )

    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument()
    await expectNoA11yViolations(products.container)
    products.unmount()

    const productForm = render(
      <FormPage
        title="New Product"
        description="Shared product/SKU identity used by Inventory and future modules."
        form={
          <form aria-label="Shared product form">
            <label htmlFor="product-code">Code</label>
            <Input id="product-code" name="code" />
            <label htmlFor="product-name">Name</label>
            <Input id="product-name" name="name" />
          </form>
        }
      />,
    )

    expect(productForm.container.querySelector('input[name="orgId"]')).toBeNull()
    await expectNoA11yViolations(productForm.container)
    productForm.unmount()

    const warehouses = render(
      <ListPage title="Warehouses" description="Shared warehouse/location identity used by Inventory and future stock workflows.">
        <table>
          <caption className="sr-only">Shared Warehouses</caption>
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MAIN</td>
              <td>Main Warehouse</td>
            </tr>
          </tbody>
        </table>
      </ListPage>,
    )

    expect(screen.getByRole('heading', { name: 'Warehouses' })).toBeInTheDocument()
    await expectNoA11yViolations(warehouses.container)
    warehouses.unmount()

    const denied = render(<PermissionDeniedPageState />)

    expect(screen.getByText('Permission required')).toBeInTheDocument()
    await expectNoA11yViolations(denied.container)
  }, A11Y_TIMEOUT)

  it('ProcessFlowPage remains semantic, ordered, and understandable without color-only meaning', async () => {
    const { container } = render(<ProcessFlowPage breadcrumb="Inventory / Process Flow" definition={flow} />)

    expect(container.querySelector('ol')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Current step details' })).toBeInTheDocument()
    expect(screen.getAllByText('Inputs').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Outputs').length).toBeGreaterThan(0)
    expect(screen.getByRole('note')).toHaveTextContent('Negative resulting stock is prevented.')
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('state patterns render accessible empty, error, permission, and unavailable states', async () => {
    const { container } = render(
      <div>
        <TrueEmptyState title="No stock levels yet" description="Post an adjustment to begin." action={<Button>New Adjustment</Button>} />
        <SafePageErrorState message="Something recoverable happened." />
        <PermissionDeniedPageState />
        <ModuleUnavailablePageState moduleName="Inventory" />
      </div>,
    )

    expect(screen.getByText('No stock levels yet')).toBeInTheDocument()
    expect(screen.getByText('Permission required')).toBeInTheDocument()
    expect(screen.getByText('Inventory is unavailable')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)

  it('profile menu and Appearance options expose accessible controls and selected state', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <AppearanceProvider>
        <TenantAppShell model={shellModel}>
          <p>Inventory content</p>
        </TenantAppShell>
      </AppearanceProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))

    expect(screen.getByRole('menu', { name: 'Profile menu' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /Light/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /Dark/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /System/ })).toHaveAttribute('aria-checked')
    expect(screen.getByText('Selected')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  }, A11Y_TIMEOUT)
})
