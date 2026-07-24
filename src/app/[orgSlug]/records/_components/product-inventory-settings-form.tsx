'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useRouteModalLifecycle } from '@/components/onedayos'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FormMessage, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function ProductInventorySettingsForm({
  orgSlug,
  productId,
  initialTracked,
  initialReorderPoint,
  canUpdate,
}: {
  orgSlug: string
  productId: string
  initialTracked: boolean
  initialReorderPoint: string
  canUpdate: boolean
}) {
  const router = useRouter()
  const modal = useRouteModalLifecycle()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!canUpdate) {
    return (
      <dl className="grid gap-3 sm:grid-cols-2">
        <div><dt>Stock tracking</dt><dd>{initialTracked ? 'Enabled' : 'Disabled'}</dd></div>
        <div><dt>Reorder point</dt><dd>{initialReorderPoint}</dd></div>
      </dl>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage(null)
    const form = new FormData(event.currentTarget)
    const response = await fetch(`/api/orgs/${encodeURIComponent(orgSlug)}/inventory/product-settings/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        isStockTracked: form.get('isStockTracked') === 'on',
        reorderPoint: String(form.get('reorderPoint') ?? '').trim(),
      }),
    })
    const result = (await response.json()) as { error: { message: string } | null }
    if (result.error) {
      setMessage(result.error.message)
      setPending(false)
      return
    }
    modal?.clearDirty()
    router.refresh()
    setMessage('Inventory settings saved.')
    setPending(false)
  }

  return (
    <form className="space-y-3" onSubmit={submit} onChange={() => modal?.markDirty()}>
      <Field>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="isStockTracked" type="checkbox" defaultChecked={initialTracked} className="size-4" />
          Track stock for this Product
        </label>
      </Field>
      <Field>
        <Label htmlFor={`reorderPoint-${productId}`}>Reorder point</Label>
        <Input id={`reorderPoint-${productId}`} name="reorderPoint" inputMode="decimal" defaultValue={initialReorderPoint} required />
      </Field>
      <FieldError>{message}</FieldError>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>{pending ? 'Saving...' : 'Save Inventory Settings'}</Button>
      <FormMessage tone="neutral">Inventory settings use a separate permission and API from Product identity.</FormMessage>
    </form>
  )
}
