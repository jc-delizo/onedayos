'use client'

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FormMessage, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { StockAdjustmentFormOptions } from '@/modules/inventory/types'
import { useRouteModalLifecycle } from '@/components/onedayos'

export function StockAdjustmentForm({
  orgSlug,
  options,
  initialProductId,
  initialWarehouseId,
}: {
  orgSlug: string
  options: StockAdjustmentFormOptions
  initialProductId?: string
  initialWarehouseId?: string
}) {
  const router = useRouter()
  const modal = useRouteModalLifecycle()
  const [productId, setProductId] = useState(initialProductId ?? options.products[0]?.id ?? '')
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId ?? options.warehouses[0]?.id ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const currentQuantity = useMemo(() => {
    return (
      options.stockLevels.find((level) => level.productId === productId && level.warehouseId === warehouseId)?.quantity ??
      '0'
    )
  }, [options.stockLevels, productId, warehouseId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage(null)

    const form = new FormData(event.currentTarget)
    const payload = {
      productId,
      warehouseId,
      quantityAfter: String(form.get('quantityAfter') ?? '').trim(),
      reason: String(form.get('reason') ?? '').trim(),
      notes: String(form.get('notes') ?? '').trim() || undefined,
    }

    const response = await fetch(`/api/orgs/${encodeURIComponent(orgSlug)}/inventory/stock-adjustments`, {
      method: 'POST',
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
      router.push(`/${orgSlug}/inventory/stock-adjustments` as never)
      router.refresh()
    }
  }

  const disabled = pending || options.products.length === 0 || options.warehouses.length === 0

  return (
    <form className="max-w-2xl space-y-4" onSubmit={submit} onChange={() => modal?.markDirty()}>
      <Field>
        <Label htmlFor="productId" required>Product</Label>
        <select
          id="productId"
          name="productId"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]"
          required
        >
          {options.products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.label}
            </option>
          ))}
        </select>
        <FieldDescription>Products are shared Records. Inventory only adjusts stock behavior.</FieldDescription>
      </Field>

      <Field>
        <Label htmlFor="warehouseId" required>Warehouse</Label>
        <select
          id="warehouseId"
          name="warehouseId"
          value={warehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
          className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]"
          required
        >
          {options.warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.label}
            </option>
          ))}
        </select>
      </Field>

      <Field>
        <Label htmlFor="currentQuantity">Current Quantity</Label>
        <Input id="currentQuantity" value={currentQuantity} readOnly />
        <FieldDescription>Current quantity is shown for context. The server recalculates before posting.</FieldDescription>
      </Field>

      <Field>
        <Label htmlFor="quantityAfter" required>New Quantity</Label>
        <Input id="quantityAfter" name="quantityAfter" inputMode="decimal" placeholder="0" required />
      </Field>

      <Field>
        <Label htmlFor="reason" required>Reason</Label>
        <Input id="reason" name="reason" placeholder="Physical count correction" required />
      </Field>

      <Field>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          className="min-h-24 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-subtle)]"
        />
      </Field>

      <FieldError>{message}</FieldError>
      <div className="flex items-center gap-2">
        <Button disabled={disabled} type="submit" variant="primary">
          {pending ? 'Posting...' : 'Post Adjustment'}
        </Button>
        <Button disabled={pending} type="button" variant="secondary" onClick={() => modal ? modal.requestClose() : router.push(`/${orgSlug}/inventory/stock-adjustments` as never)}>
          Cancel
        </Button>
      </div>
      <FormMessage tone="neutral">Tenant, module, permission, and balance checks run on the server.</FormMessage>
    </form>
  )
}
