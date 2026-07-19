import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'
import { Surface } from '@/components/ui/surface'

function HeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      {action ? <Skeleton className="h-9 w-32" /> : null}
    </div>
  )
}

export function AppShellSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading workspace shell"
      className="min-h-screen bg-[var(--color-bg)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]"
    >
      <aside className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="space-y-5">
          <Skeleton className="h-8 w-32" />
          <Surface className="space-y-3 p-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </Surface>
          {['Workspace', 'Records', 'Modules'].map((section) => (
            <div key={section} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-11/12" />
              <Skeleton className="h-8 w-10/12" />
            </div>
          ))}
        </div>
      </aside>
      <main className="space-y-6 px-5 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-full" />
        <HeaderSkeleton />
        <Surface className="space-y-3 p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-2/3" />
        </Surface>
      </main>
    </div>
  )
}

export function AppLauncherSkeleton() {
  return (
    <div role="status" aria-label="Loading apps launcher" className="space-y-5">
      <HeaderSkeleton action={false} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Surface key={index} className="space-y-4 p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-28" />
          </Surface>
        ))}
      </div>
    </div>
  )
}

export function TablePageSkeleton({ label = 'Loading table page' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-5">
      <HeaderSkeleton />
      <Surface className="p-4">
        <div className="mb-3 grid grid-cols-4 gap-3 border-b border-[var(--color-border)] pb-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
        <TableSkeleton rows={6} columns={4} />
      </Surface>
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div role="status" aria-label="Loading inventory overview" className="space-y-5">
      <HeaderSkeleton />
      <div className="grid gap-3 md:grid-cols-3">
        <Surface className="space-y-3 p-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-16" />
        </Surface>
        <Surface className="space-y-3 p-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-16" />
        </Surface>
        <Surface className="space-y-3 p-4">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-8 w-16" />
        </Surface>
      </div>
      <Surface className="p-4">
        <Skeleton className="mb-4 h-5 w-40" />
        <TableSkeleton rows={4} columns={5} />
      </Surface>
    </div>
  )
}

export function ProcessFlowPageSkeleton() {
  return (
    <div role="status" aria-label="Loading inventory process flow" className="space-y-5">
      <HeaderSkeleton action={false} />
      <Surface className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </Surface>
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="space-y-3 p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </Surface>
        <Surface className="space-y-3 p-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Surface>
      </div>
    </div>
  )
}

export function FormPageSkeleton() {
  return (
    <div role="status" aria-label="Loading form page" className="space-y-5">
      <HeaderSkeleton />
      <Surface className="space-y-5 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </Surface>
    </div>
  )
}
