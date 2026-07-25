// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteModal, useRouteModalLifecycle } from '../route-modal'

const router = {
  back: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/acme/records/products/new',
  useSearchParams: () => new URLSearchParams(),
}))

function DirtyControl() {
  const modal = useRouteModalLifecycle()
  return <button type="button" onClick={() => modal?.markDirty()}>Change field</button>
}

describe('RouteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('announces title and description and closes a clean dialog through history', async () => {
    const user = userEvent.setup()
    render(<RouteModal title="Edit Product" description="Update shared Product identity." closeHref="/acme/records/products"><button type="button">Save</button></RouteModal>)

    expect(screen.getByRole('dialog', { name: 'Edit Product' })).toHaveAccessibleDescription('Update shared Product identity.')
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(router.back).toHaveBeenCalledOnce()
  })

  it('requires explicit confirmation before discarding dirty state', async () => {
    const user = userEvent.setup()
    render(<RouteModal title="New Product" description="Create a Product." closeHref="/acme/records/products"><DirtyControl /></RouteModal>)

    await user.click(screen.getByRole('button', { name: 'Change field' }))
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(router.back).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog', { name: 'Discard unsaved changes' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Continue editing' }))
    expect(screen.getByRole('button', { name: 'Change field' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(router.back).toHaveBeenCalledOnce()
  })

  it('cancels the close fallback when the route unmounts', () => {
    vi.useFakeTimers()
    const { unmount } = render(<RouteModal title="Edit Product" closeHref="/acme/records/products"><button type="button">Save</button></RouteModal>)
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    unmount()
    vi.runAllTimers()
    expect(router.replace).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
