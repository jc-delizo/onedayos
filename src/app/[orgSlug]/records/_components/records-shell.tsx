import type { ReactNode } from 'react'

export function RecordsShell({
  children,
}: {
  orgSlug?: string
  activeArea?: string
  children: ReactNode
}) {
  return <div className="space-y-6">{children}</div>
}
