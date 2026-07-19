import type { ReactNode } from 'react'
import { BrandMark } from './brand-mark'
import { Surface } from '@/components/ui/surface'

export function AuthShell({ title, description, children, footer }: { title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-[var(--color-bg)] lg:grid-cols-[minmax(0,1fr)_440px]">
      <section className="hidden border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] px-10 py-8 lg:flex lg:flex-col lg:justify-between">
        <BrandMark />
        <div className="max-w-xl space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-brand)]">Platform foundation</p>
          <h1 className="text-3xl font-semibold tracking-normal text-[var(--color-foreground)]">
            Calm infrastructure for daily operations.
          </h1>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Authentication, organization context, permissions, and APIs are verified before business modules are introduced.
          </p>
        </div>
        <p className="pl-12 text-xs text-[var(--color-subtle)]">Local development runs on port 1320.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[380px] space-y-6">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <Surface className="p-5">
            <div className="mb-5 space-y-2">
              <h1 className="text-xl font-semibold tracking-normal text-[var(--color-foreground)]">{title}</h1>
              {description ? <p className="text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
            </div>
            {children}
          </Surface>
          {footer ? <div className="text-center text-sm text-[var(--color-muted)]">{footer}</div> : null}
        </div>
      </section>
    </main>
  )
}

export function FoundationShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <BrandMark />
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
            Foundation
          </span>
        </header>
        <div className="flex flex-1 flex-col py-8">{children}</div>
      </div>
    </main>
  )
}
