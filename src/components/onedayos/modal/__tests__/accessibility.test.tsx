// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '@/test/accessibility'
import { RouteModal } from '../route-modal'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/acme/inventory/stock-levels/level-1',
  useSearchParams: () => new URLSearchParams(),
}))

describe('RouteModal accessibility', () => {
  it('provides an accessible modal dialog at desktop and full-screen mobile markup', async () => {
    const { container } = render(
      <RouteModal title="Stock Level" description="Current calculated Inventory balance." closeHref="/acme/inventory/stock-levels">
        <label htmlFor="reason">Reason</label>
        <input id="reason" />
      </RouteModal>,
    )

    expect(screen.getByRole('dialog', { name: 'Stock Level' })).toHaveAttribute('data-route-modal')
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeVisible()
    expect(screen.getByLabelText('Reason')).toBeVisible()
    await expectNoA11yViolations(container)
  }, 15_000)
})
