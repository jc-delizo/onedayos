// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'
import {
  AppPage,
  DashboardMetric,
  DashboardPage,
  DetailPage,
  FormPage,
  ListPage,
  SettingsPage,
} from '..'

describe('OneDayOS page patterns', () => {
  it('AppPage renders breadcrumb, title, description, primary action, and content', () => {
    render(
      <AppPage
        breadcrumb={[
          { label: 'Inventory', href: '/acme/inventory' },
          { label: 'Stock Levels' },
        ]}
        title="Stock Levels"
        description="Current quantity by Product and Warehouse."
        primaryAction={<Button>New Adjustment</Button>}
      >
        <p>Stock table content</p>
      </AppPage>,
    )

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inventory' })).toHaveAttribute('href', '/acme/inventory')
    expect(screen.getByRole('heading', { name: 'Stock Levels' })).toBeInTheDocument()
    expect(screen.getByText('Current quantity by Product and Warehouse.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New Adjustment' })).toBeInTheDocument()
    expect(screen.getByText('Stock table content')).toBeInTheDocument()
  })

  it('AppPage works without optional actions', () => {
    render(
      <AppPage title="Products" description="Shared product identity.">
        <p>Product list</p>
      </AppPage>,
    )

    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('DashboardPage renders caller-supplied metrics and content without inventing fake metrics', () => {
    render(
      <DashboardPage
        title="Inventory Overview"
        description="Real inventory summary."
        metrics={<DashboardMetric label="Low-stock items" value="1" description="Computed from stock levels." />}
        primaryContent={<p>Recent stock activity</p>}
      />,
    )

    expect(screen.getByText('Low-stock items')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Recent stock activity')).toBeInTheDocument()
    expect(screen.queryByText(/fake/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument()
  })

  it('ListPage renders toolbar and list content', () => {
    render(
      <ListPage
        title="Products"
        description="Shared product identity."
        toolbar={<label htmlFor="product-filter">Filter products</label>}
      >
        <table>
          <tbody>
            <tr>
              <td>Bottled Water 500ml</td>
            </tr>
          </tbody>
        </table>
      </ListPage>,
    )

    expect(screen.getByLabelText('List filters and actions')).toHaveTextContent('Filter products')
    expect(screen.getByRole('cell', { name: 'Bottled Water 500ml' })).toBeInTheDocument()
  })

  it('ListPage renders true-empty state', () => {
    render(
      <ListPage
        title="Products"
        description="Shared product identity."
        state={{ type: 'empty', title: 'No products yet', description: 'Create a shared Product before tracking stock.' }}
      >
        <p>Rows should not render</p>
      </ListPage>,
    )

    expect(screen.getByText('No products yet')).toBeInTheDocument()
    expect(screen.getByText('Create a shared Product before tracking stock.')).toBeInTheDocument()
    expect(screen.queryByText('Rows should not render')).not.toBeInTheDocument()
  })

  it('ListPage renders filtered-empty state', () => {
    render(
      <ListPage title="Stock Movements" description="Inventory ledger." state={{ type: 'filtered-empty' }}>
        <p>Rows should not render</p>
      </ListPage>,
    )

    expect(screen.getByText('No matching records')).toBeInTheDocument()
    expect(screen.queryByText('Rows should not render')).not.toBeInTheDocument()
  })

  it('ListPage renders loading state', () => {
    render(
      <ListPage title="Stock Levels" description="Current inventory quantity." state={{ type: 'loading', label: 'Loading stock levels' }}>
        <p>Rows should not render</p>
      </ListPage>,
    )

    expect(screen.getByRole('status', { name: 'Loading stock levels' })).toBeInTheDocument()
    expect(screen.queryByText('Rows should not render')).not.toBeInTheDocument()
  })

  it('ListPage renders safe error state without exposing raw technical details', () => {
    render(
      <ListPage
        title="Stock Levels"
        description="Current inventory quantity."
        state={{ type: 'error', message: 'PrismaClientKnownRequestError: stack trace leaked' }}
      >
        <p>Rows should not render</p>
      </ListPage>,
    )

    expect(screen.getByText('Unable to load this page')).toBeInTheDocument()
    expect(screen.getByText(/Something went wrong while loading this area/i)).toBeInTheDocument()
    expect(screen.queryByText(/PrismaClientKnownRequestError/i)).not.toBeInTheDocument()
  })

  it('DetailPage renders summary and sections', () => {
    render(
      <DetailPage
        title="Product Detail"
        description="Shared product identity."
        summary={<p>SKU: WATER-500</p>}
        sections={<section><h2>Inventory usage</h2><p>Referenced by stock balances.</p></section>}
      />,
    )

    expect(screen.getByLabelText('Record summary')).toHaveTextContent('SKU: WATER-500')
    expect(screen.getByRole('heading', { name: 'Inventory usage' })).toBeInTheDocument()
  })

  it('FormPage renders form content and action/footer slot', () => {
    render(
      <FormPage
        title="New Adjustment"
        description="Post a manual inventory correction."
        form={<label htmlFor="reason">Reason</label>}
        footer={<Button type="submit">Post Adjustment</Button>}
        cancelAction={<Button variant="quiet">Cancel</Button>}
      />,
    )

    expect(screen.getByText('Reason')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Post Adjustment' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('SettingsPage renders settings content', () => {
    render(
      <SettingsPage
        title="Organization Settings"
        description="Configure organization-wide preferences."
        sectionNavigation={<a href="#general">General</a>}
        sections={<section id="general"><h2>General</h2><p>Organization name.</p></section>}
      />,
    )

    expect(screen.getByLabelText('Settings sections')).toHaveTextContent('General')
    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument()
  })

  it('page patterns do not render duplicate module navigation', () => {
    render(
      <AppPage title="Inventory Overview" description="Operational dashboard.">
        <p>Dashboard content</p>
      </AppPage>,
    )

    expect(screen.queryByRole('navigation', { name: 'Workspace navigation' })).not.toBeInTheDocument()
    expect(screen.queryByText('Product Settings')).not.toBeInTheDocument()
    expect(screen.queryByText('Stock Levels')).not.toBeInTheDocument()
  })

  it('patterns do not render hidden orgId fields', () => {
    const { container } = render(
      <ListPage title="Products" description="Shared product identity.">
        <div>Rows</div>
      </ListPage>,
    )

    expect(container.querySelector('input[name="orgId"]')).not.toBeInTheDocument()
    expect(within(container).queryByDisplayValue('orgId')).not.toBeInTheDocument()
  })
})
