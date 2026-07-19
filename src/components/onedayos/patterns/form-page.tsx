import type { ReactNode } from 'react'
import { FormMessage } from '@/components/ui/field'
import { Surface } from '@/components/ui/surface'
import type { AppPageProps } from './app-page'
import { AppPage } from './app-page'

export type FormPageProps = Omit<AppPageProps, 'children'> & {
  form: ReactNode
  formError?: ReactNode
  footer?: ReactNode
  cancelAction?: ReactNode
  pendingState?: ReactNode
}

export function FormPage({
  form,
  formError,
  footer,
  cancelAction,
  pendingState,
  ...appPageProps
}: FormPageProps) {
  return (
    <AppPage {...appPageProps} contentWidth={appPageProps.contentWidth ?? 'narrow'}>
      <Surface className="space-y-5 p-4">
        {formError ? <FormMessage tone="danger">{formError}</FormMessage> : null}
        {pendingState ? <div role="status">{pendingState}</div> : null}
        <div>{form}</div>
        {(footer || cancelAction) ? (
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
            {cancelAction}
            {footer}
          </div>
        ) : null}
      </Surface>
    </AppPage>
  )
}
