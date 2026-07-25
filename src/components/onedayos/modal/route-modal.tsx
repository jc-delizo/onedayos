'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type RouteModalLifecycle = {
  markDirty: () => void
  clearDirty: () => void
  requestClose: () => void
  completeMutation: () => void
}

const RouteModalLifecycleContext = createContext<RouteModalLifecycle | null>(null)

export function useRouteModalLifecycle() {
  return useContext(RouteModalLifecycleContext)
}

export function RouteModal({
  title,
  description,
  closeHref,
  size = 'lg',
  children,
}: {
  title: string
  description?: string
  closeHref: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const openedUrl = `${pathname}?${searchParams.toString()}`
  const [open, setOpen] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const continueRef = useRef<HTMLButtonElement>(null)
  const bypassPopRef = useRef(false)
  const fallbackTimerRef = useRef<number | null>(null)

  const navigateClosed = useCallback(() => {
    setOpen(false)
    router.back()
    if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current)
    fallbackTimerRef.current = window.setTimeout(() => {
      const current = `${window.location.pathname}?${window.location.search.replace(/^\?/, '')}`
      if (current === openedUrl) router.replace(closeHref as never)
      fallbackTimerRef.current = null
    }, 150)
  }, [closeHref, openedUrl, router])

  useEffect(() => () => {
    if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current)
  }, [])

  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirmingDiscard(true)
      return
    }
    navigateClosed()
  }, [dirty, navigateClosed])

  useEffect(() => {
    if (!dirty) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const guardBack = () => {
      if (bypassPopRef.current) return
      window.history.go(1)
      setConfirmingDiscard(true)
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    window.addEventListener('popstate', guardBack)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      window.removeEventListener('popstate', guardBack)
    }
  }, [dirty])

  useEffect(() => {
    if (confirmingDiscard) window.setTimeout(() => continueRef.current?.focus(), 0)
  }, [confirmingDiscard])

  const lifecycle: RouteModalLifecycle = {
    markDirty: () => setDirty(true),
    clearDirty: () => setDirty(false),
    requestClose,
    completeMutation: () => {
      setDirty(false)
      router.refresh()
      navigateClosed()
    },
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => {
      if (!next) requestClose()
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" data-route-modal-overlay />
        <Dialog.Content
          className={cn(
            'fixed inset-0 z-50 flex flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-md)]',
            size === 'sm' && 'sm:max-w-md',
            size === 'md' && 'sm:max-w-xl',
            size === 'lg' && 'sm:max-w-3xl',
            size === 'xl' && 'sm:max-w-5xl',
          )}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            requestClose()
          }}
          onPointerDownOutside={(event) => {
            event.preventDefault()
            requestClose()
          }}
          aria-describedby={description ? undefined : undefined}
          data-route-modal
        >
          <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3">
            <div>
              <Dialog.Title className="text-base font-semibold">{confirmingDiscard ? 'Discard changes?' : title}</Dialog.Title>
              {confirmingDiscard ? (
                <Dialog.Description className="mt-1 text-sm text-[var(--color-muted)]">Your unsaved changes will be lost.</Dialog.Description>
              ) : description ? (
                <Dialog.Description className="mt-1 text-sm text-[var(--color-muted)]">{description}</Dialog.Description>
              ) : null}
            </div>
            <button type="button" aria-label="Close dialog" className="rounded-[var(--radius-sm)] p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]" onClick={requestClose}>
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>
          {confirmingDiscard ? (
            <div className="flex flex-1 flex-col justify-center gap-4 p-6" role="alertdialog" aria-label="Discard unsaved changes">
              <p className="text-sm">Continue editing to keep your work, or discard it and close this dialog.</p>
              <div className="flex justify-end gap-2">
                <Button ref={continueRef} type="button" variant="secondary" onClick={() => setConfirmingDiscard(false)}>Continue editing</Button>
                <Button type="button" variant="danger" onClick={() => {
                  bypassPopRef.current = true
                  setDirty(false)
                  navigateClosed()
                }}>Discard changes</Button>
              </div>
            </div>
          ) : (
            <RouteModalLifecycleContext.Provider value={lifecycle}>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
            </RouteModalLifecycleContext.Provider>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
