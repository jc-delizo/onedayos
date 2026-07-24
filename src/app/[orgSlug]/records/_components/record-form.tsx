'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FormMessage, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useRouteModalLifecycle } from '@/components/onedayos'

export type RecordFormField = {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'date' | 'checkbox' | 'textarea'
  required?: boolean
  description?: string
}

export function RecordForm({
  orgSlug,
  endpoint,
  fields,
  initialValues = {},
  method = 'POST',
  returnHref,
  submitLabel,
}: {
  orgSlug: string
  endpoint: string
  fields: RecordFormField[]
  initialValues?: Record<string, string | boolean | null | undefined>
  method?: 'POST' | 'PATCH'
  returnHref: string
  submitLabel: string
}) {
  const router = useRouter()
  const modal = useRouteModalLifecycle()
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage(null)

    const form = new FormData(event.currentTarget)
    const payload: Record<string, string | boolean> = {}

    for (const field of fields) {
      if (field.type === 'checkbox') {
        payload[field.name] = form.get(field.name) === 'on'
        continue
      }

      const value = String(form.get(field.name) ?? '').trim()
      if (value || field.required) {
        payload[field.name] = value
      }
    }

    const response = await fetch(`/api/orgs/${encodeURIComponent(orgSlug)}/objects/${endpoint}`, {
      method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const result = (await response.json()) as { error: { message: string } | null }

    if (result.error) {
      setMessage(result.error.message)
      setPending(false)
      return
    }

    if (modal) {
      modal.completeMutation()
    } else {
      router.push(returnHref as never)
      router.refresh()
    }
  }

  return (
    <form className="max-w-2xl space-y-4" onSubmit={submit} onChange={() => modal?.markDirty()}>
      {fields.map((field) => {
        const value = initialValues[field.name]

        if (field.type === 'textarea') {
          return (
            <Field key={field.name}>
              <Label htmlFor={field.name} required={field.required}>{field.label}</Label>
              <textarea
                id={field.name}
                name={field.name}
                defaultValue={typeof value === 'string' ? value : ''}
                className="min-h-24 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-subtle)]"
                required={field.required}
              />
              {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
            </Field>
          )
        }

        if (field.type === 'checkbox') {
          return (
            <Field key={field.name}>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
                <input
                  name={field.name}
                  type="checkbox"
                  defaultChecked={Boolean(value)}
                  className="size-4 rounded border-[var(--color-border)]"
                />
                {field.label}
              </label>
              {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
            </Field>
          )
        }

        return (
          <Field key={field.name}>
            <Label htmlFor={field.name} required={field.required}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type ?? 'text'}
              defaultValue={typeof value === 'string' ? value : ''}
              required={field.required}
            />
            {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
          </Field>
        )
      })}
      <FieldError>{message}</FieldError>
      <div className="flex items-center gap-2">
        <Button disabled={pending} type="submit" variant="primary">
          {pending ? 'Saving...' : submitLabel}
        </Button>
        <Button disabled={pending} type="button" variant="secondary" onClick={() => modal ? modal.requestClose() : router.push(returnHref as never)}>
          Cancel
        </Button>
      </div>
      <FormMessage tone="neutral">Tenant and permission checks run on the server before records change.</FormMessage>
    </form>
  )
}
