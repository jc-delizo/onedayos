'use client'

import Link from 'next/link'
import { AppWindow, Check, Grid3X3, LogOut, Monitor, Moon, Palette, Sun, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAppearance } from './appearance-provider'
import type { AppearancePreference } from './theme-script'
import { cn } from '@/lib/cn'
import { sdkClient } from '@/sdk/client'
import type {
  TenantAppShellModel,
  TenantNavContext,
  TenantNavItem,
  TenantNavSection,
} from '@/platform/navigation/types'

export function isSegmentActive(pathname: string, href: string, exact = false): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const normalizedHref = href.replace(/\/+$/, '') || '/'

  if (exact) {
    return normalizedPath === normalizedHref
  }

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`)
}

function NavLink({ item, active }: { item: TenantNavItem; active: boolean }) {
  return (
    <Link
      href={item.href as never}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex min-h-8 items-center rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--color-sidebar-selected)] text-[var(--color-sidebar-selected-foreground)]'
          : 'text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-foreground)]',
      )}
    >
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

function NavSection({ section, pathname }: { section: TenantNavSection; pathname: string }) {
  return (
    <section className="space-y-1" aria-labelledby={`nav-section-${section.id}`}>
      <h2
        id={`nav-section-${section.id}`}
        className="px-2.5 text-[11px] font-semibold uppercase tracking-normal text-[var(--color-sidebar-muted)]"
      >
        {section.label}
      </h2>
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <NavLink
            key={item.id}
            item={item}
            active={isSegmentActive(pathname, item.href, item.exact)}
          />
        ))}
      </div>
    </section>
  )
}

export function getCurrentNavContext(pathname: string, orgSlug: string): TenantNavContext {
  if (isSegmentActive(pathname, `/${orgSlug}/inventory`)) return 'inventory'
  if (isSegmentActive(pathname, `/${orgSlug}/organization`)) return 'organization'
  if (isSegmentActive(pathname, `/${orgSlug}/records`)) return 'records'
  return 'workspace'
}

function currentAppLabel(context: TenantNavContext) {
  if (context === 'inventory') return 'Inventory'
  if (context === 'organization') return 'Organization'
  return 'Apps'
}

const appearanceOptions: Array<{ value: AppearancePreference; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

export function TenantAppShell({ model, children }: { model: TenantAppShellModel; children: ReactNode }) {
  const pathname = usePathname() ?? ''
  const [appMenuOpen, setAppMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const { preference, setPreference } = useAppearance()
  const currentContext = getCurrentNavContext(pathname, model.org.slug)
  const sidebarSections = model.sidebars[currentContext].length > 0 ? model.sidebars[currentContext] : model.sidebars.workspace
  const currentApp = currentAppLabel(currentContext)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAppMenuOpen(false)
        setProfileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  async function signOut() {
    setSigningOut(true)
    const supabase = sdkClient.auth.createClient()
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-background)] text-[var(--color-sidebar-foreground)] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-5 px-4 py-4">
          <div className="space-y-4">
            <div className="flex min-h-9 items-center gap-2">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-hover)] text-xs font-semibold text-[var(--color-primary)]"
              >
                <AppWindow className="size-4" />
              </span>
              <p className="truncate text-sm font-semibold text-[var(--color-sidebar-foreground)]">{model.org.name}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={appMenuOpen}
                aria-label="Switch apps"
                className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-hover)] px-3 py-2 text-left text-sm font-semibold text-[var(--color-sidebar-foreground)] transition-colors hover:bg-[var(--color-sidebar-selected)]"
                onClick={() => {
                  setAppMenuOpen((open) => !open)
                  setProfileMenuOpen(false)
                }}
              >
                <span className="truncate">{currentApp}</span>
                <Grid3X3 aria-hidden="true" className="size-4 text-[var(--color-sidebar-muted)]" />
              </button>
              {appMenuOpen ? (
                <div
                  role="menu"
                  aria-label="Apps"
                  className="absolute left-[calc(100%+1rem)] top-0 z-50 w-72 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-popover-background)] p-2 text-[var(--color-popover-foreground)] shadow-[var(--shadow-floating)]"
                >
                  <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-normal text-[var(--color-subtle)]">
                    Apps
                  </p>
                {model.apps.map((app) => (
                  <Link
                    key={app.id}
                    href={app.href as never}
                    aria-label={`${app.label}: ${app.description}`}
                    role="menuitem"
                    onClick={() => setAppMenuOpen(false)}
                    className={cn(
                      'block rounded-[var(--radius-sm)] border px-2 py-2 text-sm transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
                      currentContext === app.id
                        ? 'border-[var(--color-border-strong)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                        : 'border-transparent text-[var(--color-muted)]',
                    )}
                  >
                    <span className="block font-medium">{app.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[var(--color-subtle)]">{app.description}</span>
                  </Link>
                ))}
                </div>
              ) : null}
            </div>
          </div>

          <nav aria-label="Workspace navigation" className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
            {sidebarSections.map((section) => (
              <NavSection key={section.id} section={section} pathname={pathname} />
            ))}
          </nav>

          <div className="relative border-t border-[var(--color-sidebar-border)] pt-4">
            {profileMenuOpen ? (
              <div
                role="menu"
                aria-label="Profile menu"
                className="absolute bottom-[calc(100%+0.5rem)] left-0 z-50 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-popover-background)] p-2 text-[var(--color-popover-foreground)] shadow-[var(--shadow-floating)]"
              >
                <Link
                  href={`/${model.org.slug}/profile` as never}
                  role="menuitem"
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <User aria-hidden="true" className="size-4" />
                  Profile
                </Link>
                <div className="border-y border-[var(--color-border)] py-2" role="none">
                  <p
                    id="appearance-menu-label"
                    className="flex items-center gap-2 px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-normal text-[var(--color-subtle)]"
                  >
                    <Palette aria-hidden="true" className="size-3.5" />
                    Appearance
                  </p>
                  <div role="group" aria-labelledby="appearance-menu-label" className="space-y-1">
                    {appearanceOptions.map((option) => {
                      const selected = preference === option.value
                      const Icon = option.icon

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="menuitemradio"
                          aria-checked={selected}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
                            selected
                              ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[inset_0_0_0_1px_var(--color-border)]'
                              : 'text-[var(--color-muted)]',
                          )}
                          onClick={() => {
                            setPreference(option.value)
                            setProfileMenuOpen(false)
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <Icon aria-hidden="true" className="size-4" />
                            {option.label}
                          </span>
                          {selected ? (
                            <span className="flex items-center gap-1 text-xs text-[var(--color-subtle)]">
                              <Check aria-hidden="true" className="size-3.5" />
                              Selected
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <Button
                  className="mt-1 w-full justify-start px-2.5"
                  size="sm"
                  variant="ghost"
                  disabled={signingOut}
                  role="menuitem"
                  onClick={signOut}
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </Button>
              </div>
            ) : null}
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              aria-label="Open profile menu"
              className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2 py-2 text-left transition-colors hover:bg-[var(--color-sidebar-hover)]"
              onClick={() => {
                setProfileMenuOpen((open) => !open)
                setAppMenuOpen(false)
              }}
            >
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-hover)] text-xs font-semibold text-[var(--color-sidebar-muted)]"
              >
                {initials(model.user.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[var(--color-sidebar-foreground)]">{model.user.name}</span>
              </span>
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
