// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import { DataTable } from './data-table'
import { AppShellSkeleton, DashboardPageSkeleton, FormPageSkeleton, TablePageSkeleton } from './loading-skeletons'
import { PageHeader } from './page-header'
import { EmptyState, ErrorState } from './states'

describe('OneDayOS design primitives', () => {
  it('PageHeader renders title, eyebrow, help text, and actions', () => {
    render(
      <PageHeader
        eyebrow="Foundation"
        title="Operations"
        description="A compact operational page."
        actions={<Button>New record</Button>}
      />,
    )

    expect(screen.getByText('Foundation')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Operations' })).toBeInTheDocument()
    expect(screen.getByText('A compact operational page.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New record' })).toBeInTheDocument()
  })

  it('EmptyState renders action only when provided', () => {
    const { rerender } = render(<EmptyState title="No records" description="Nothing has been created." />)

    expect(screen.getByText('No records')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<EmptyState title="No records" action={<Button>Add record</Button>} />)
    expect(screen.getByRole('button', { name: 'Add record' })).toBeInTheDocument()
  })

  it('LoadingState renders as an accessible status', () => {
    render(<LoadingState label="Loading foundation" />)

    expect(screen.getByRole('status', { name: 'Loading foundation' })).toBeInTheDocument()
  })

  it('ErrorState does not expose raw technical details', () => {
    render(<ErrorState message="PrismaClientKnownRequestError: stack trace leaked" />)

    expect(screen.queryByText(/PrismaClientKnownRequestError/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it('StatusBadge maps variants through a stable data attribute', () => {
    render(<StatusBadge variant="success">Active</StatusBadge>)

    expect(screen.getByText('Active')).toHaveAttribute('data-variant', 'success')
  })

  it('Button exposes approved OneDayOS Compact semantic variants and sizes', () => {
    render(
      <div>
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button size="icon" aria-label="Icon action">I</Button>
      </div>,
    )

    expect(screen.getByRole('button', { name: 'Default' }).className).toContain('var(--color-primary)')
    expect(screen.getByRole('button', { name: 'Secondary' }).className).toContain('var(--color-accent)')
    expect(screen.getByRole('button', { name: 'Outline' }).className).toContain('var(--color-border)')
    expect(screen.getByRole('button', { name: 'Ghost' }).className).toContain('var(--color-muted-foreground)')
    expect(screen.getByRole('button', { name: 'Destructive' }).className).toContain('var(--color-destructive)')
    expect(screen.getByRole('button', { name: 'Link' }).className).toContain('var(--color-primary)')
    expect(screen.getByRole('button', { name: 'Icon action' }).className).toContain('size-9')
  })

  it('Surface remains border-first without ordinary panel shadow', () => {
    render(<Surface>Surface content</Surface>)

    const surface = screen.getByText('Surface content').closest('section')
    expect(surface?.className).toContain('border-[var(--color-border)]')
    expect(surface?.className).not.toContain('shadow-[var(--shadow-panel)]')
  })

  it('DataTable renders headers and rows', () => {
    render(
      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row: { name: string }) => row.name },
          { id: 'status', header: 'Status', cell: (row: { status: string }) => row.status },
        ]}
        rows={[{ id: 'row_1', name: 'Kernel', status: 'Ready' }]}
        getRowId={(row) => row.id}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Kernel' })).toBeInTheDocument()
  })

  it('DataTable renders empty and loading states', () => {
    const { rerender } = render(
      <DataTable
        columns={[{ id: 'name', header: 'Name', cell: (row: { name: string }) => row.name }]}
        rows={[]}
        getRowId={(row) => row.name}
      />,
    )

    expect(screen.getByText('No records yet')).toBeInTheDocument()

    rerender(
      <DataTable
        columns={[{ id: 'name', header: 'Name', cell: (row: { name: string }) => row.name }]}
        rows={[]}
        getRowId={(row) => row.name}
        loading
      />,
    )

    expect(screen.getByRole('status', { name: 'Loading table' })).toBeInTheDocument()
  })

  it('Form field primitives render label, description, and error', () => {
    render(
      <Field>
        <Label htmlFor="email" required>Email</Label>
        <Input id="email" aria-invalid="true" aria-describedby="email-help email-error" />
        <FieldDescription id="email-help">Use your work email.</FieldDescription>
        <FieldError id="email-error">Email is required.</FieldError>
      </Field>,
    )

    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByText('Use your work email.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required.')
  })

  it('TablePageSkeleton renders table-shaped loading content', () => {
    render(<TablePageSkeleton label="Loading records table" />)

    expect(screen.getByRole('status', { name: 'Loading records table' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading table' })).toBeInTheDocument()
  })

  it('DashboardPageSkeleton differs from table loading with metric-card structure', () => {
    const { container } = render(<DashboardPageSkeleton />)

    expect(screen.getByRole('status', { name: 'Loading inventory overview' })).toBeInTheDocument()
    expect(container.querySelectorAll('section')).toHaveLength(4)
  })

  it('FormPageSkeleton renders form-field loading rows', () => {
    render(<FormPageSkeleton />)

    expect(screen.getByRole('status', { name: 'Loading form page' })).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading inventory overview' })).not.toBeInTheDocument()
  })

  it('AppShellSkeleton renders sidebar, header, and content placeholders', () => {
    render(<AppShellSkeleton />)

    expect(screen.getByRole('status', { name: 'Loading workspace shell' })).toBeInTheDocument()
  })
})
