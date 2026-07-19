// @vitest-environment jsdom

import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppearanceProvider, useAppearance } from './appearance-provider'
import {
  APPEARANCE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  getAppearanceInitScript,
} from './theme-script'

type MatchListener = (event: MediaQueryListEvent) => void

const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')

function installMatchMedia(initialDark: boolean) {
  let matches = initialDark
  const listeners = new Set<MatchListener>()

  const queryList = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((event: string, listener: MatchListener) => {
      if (event === 'change') listeners.add(listener)
    }),
    removeEventListener: vi.fn((event: string, listener: MatchListener) => {
      if (event === 'change') listeners.delete(listener)
    }),
    addListener: vi.fn((listener: MatchListener) => listeners.add(listener)),
    removeListener: vi.fn((listener: MatchListener) => listeners.delete(listener)),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => queryList),
  })

  return {
    queryList,
    listenerCount: () => listeners.size,
    setDark(nextDark: boolean) {
      matches = nextDark
      const event = { matches, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent
      for (const listener of listeners) listener(event)
    },
  }
}

function AppearanceProbe() {
  const { preference, resolvedAppearance, resolvedTheme, setPreference } = useAppearance()

  return (
    <div>
      <p>Preference: {preference}</p>
      <p>Resolved: {resolvedAppearance}</p>
      <p>Legacy resolved: {resolvedTheme}</p>
      <button type="button" onClick={() => setPreference('light')}>Light</button>
      <button type="button" onClick={() => setPreference('dark')}>Dark</button>
      <button type="button" onClick={() => setPreference('system')}>System</button>
    </div>
  )
}

function renderProbe() {
  return render(
    <AppearanceProvider>
      <AppearanceProbe />
    </AppearanceProvider>,
  )
}

function resetRootAppearance() {
  document.documentElement.className = ''
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-appearance')
  document.documentElement.removeAttribute('data-resolved-appearance')
}

function runInitScript() {
  Function(getAppearanceInitScript())()
}

describe('AppearanceProvider', () => {
  beforeEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor)
    }
    localStorage.clear()
    resetRootAppearance()
  })

  afterEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor)
    }
    vi.restoreAllMocks()
  })

  it('defaults to System and resolves from matchMedia when no saved value exists', async () => {
    installMatchMedia(true)

    renderProbe()

    await screen.findByText('Preference: system')
    await waitFor(() => expect(screen.getByText('Resolved: dark')).toBeInTheDocument())
    expect(screen.getByText('Legacy resolved: dark')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-appearance', 'system')
    expect(document.documentElement).toHaveAttribute('data-resolved-appearance', 'dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('applies and persists Light preference immediately', async () => {
    installMatchMedia(true)
    const user = userEvent.setup()

    renderProbe()
    await user.click(screen.getByRole('button', { name: 'Light' }))

    expect(screen.getByText('Preference: light')).toBeInTheDocument()
    expect(screen.getByText('Resolved: light')).toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-appearance', 'light')
    expect(document.documentElement).toHaveAttribute('data-resolved-appearance', 'light')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('light')
  })

  it('applies Dark preference and restores it after remount', async () => {
    installMatchMedia(false)
    const user = userEvent.setup()

    const view = renderProbe()
    await user.click(screen.getByRole('button', { name: 'Dark' }))

    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-appearance', 'dark')
    expect(document.documentElement).toHaveAttribute('data-resolved-appearance', 'dark')
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark')

    view.unmount()
    resetRootAppearance()
    renderProbe()

    await waitFor(() => expect(screen.getByText('Preference: dark')).toBeInTheDocument())
    expect(document.documentElement).toHaveClass('dark')
  })

  it('migrates the previous local theme key without keeping it as the canonical key', async () => {
    installMatchMedia(false)
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, 'dark')

    renderProbe()

    await waitFor(() => expect(screen.getByText('Preference: dark')).toBeInTheDocument())
    expect(document.documentElement).toHaveAttribute('data-appearance', 'dark')
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull()
  })

  it('keeps System preference responsive to system theme changes', async () => {
    const media = installMatchMedia(false)

    renderProbe()
    await waitFor(() => expect(screen.getByText('Resolved: light')).toBeInTheDocument())
    expect(document.documentElement).not.toHaveClass('dark')

    act(() => media.setDark(true))

    await waitFor(() => expect(screen.getByText('Resolved: dark')).toBeInTheDocument())
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-resolved-appearance', 'dark')
  })

  it('does not let system changes override explicit Light or Dark preferences', async () => {
    const media = installMatchMedia(false)
    const user = userEvent.setup()

    renderProbe()
    await user.click(screen.getByRole('button', { name: 'Light' }))

    act(() => media.setDark(true))

    expect(screen.getByText('Preference: light')).toBeInTheDocument()
    expect(screen.getByText('Resolved: light')).toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('removes the system media listener on cleanup', () => {
    const media = installMatchMedia(false)

    const view = renderProbe()
    expect(media.listenerCount()).toBe(1)

    view.unmount()

    expect(media.listenerCount()).toBe(0)
  })

  it('falls back safely when matchMedia is unavailable', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    renderProbe()

    await waitFor(() => expect(screen.getByText('Resolved: light')).toBeInTheDocument())
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-appearance', 'system')
    expect(document.documentElement).toHaveAttribute('data-resolved-appearance', 'light')
  })

  it('falls back safely when storage cannot be read or written', async () => {
    installMatchMedia(true)
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn(() => {
          throw new Error('blocked')
        }),
        setItem: vi.fn(() => {
          throw new Error('blocked')
        }),
      },
    })
    const user = userEvent.setup()

    renderProbe()

    await waitFor(() => expect(screen.getByText('Preference: system')).toBeInTheDocument())
    expect(document.documentElement).toHaveAttribute('data-appearance', 'system')
    expect(document.documentElement).toHaveAttribute('data-resolved-appearance', 'dark')

    await user.click(screen.getByRole('button', { name: 'Light' }))
    expect(screen.getByText('Preference: light')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('data-appearance', 'light')
  })

  it('initialization script applies the approved DOM contract before hydration', () => {
    installMatchMedia(true)
    localStorage.setItem(APPEARANCE_STORAGE_KEY, 'system')

    runInitScript()

    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-appearance', 'system')
    expect(document.documentElement).toHaveAttribute('data-resolved-appearance', 'dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('initialization script validates values and survives storage failures', () => {
    installMatchMedia(false)
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn(() => {
          throw new Error('blocked')
        }),
      },
    })

    runInitScript()

    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-appearance', 'system')
    expect(document.documentElement).toHaveAttribute('data-resolved-appearance', 'light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('initialization script only uses browser-local appearance keys and no tenant or secret references', () => {
    const script = getAppearanceInitScript()

    expect(script).toContain(APPEARANCE_STORAGE_KEY)
    expect(script).toContain(LEGACY_THEME_STORAGE_KEY)
    expect(script).toContain('data-appearance')
    expect(script).toContain('data-resolved-appearance')
    expect(script).toContain('prefers-color-scheme')
    expect(script).not.toContain('orgId')
    expect(script).not.toContain('organizationId')
    expect(script).not.toContain('DATABASE_URL')
    expect(script).not.toContain('SUPABASE')
  })
})
