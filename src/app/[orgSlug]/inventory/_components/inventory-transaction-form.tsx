'use client'

import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useRouteModalLifecycle } from '@/components/onedayos'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, Label } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { InventoryTransactionType } from '@/modules/inventory/transactions/schemas'
import type { InventoryTransactionFormOptions } from '@/modules/inventory/transactions/ui-types'

type EditableLine = { key: string; productId: string; quantity: string; notes: string }

const labels = {
  RECEIPT: { singular: 'Receipt', plural: 'receipts', quantity: 'Quantity' },
  ISSUE: { singular: 'Issue', plural: 'issues', quantity: 'Quantity' },
  TRANSFER: { singular: 'Transfer', plural: 'transfers', quantity: 'Quantity' },
  ADJUSTMENT: { singular: 'Adjustment', plural: 'adjustments', quantity: 'Counted final quantity' },
} as const

function newLine(productId = ''): EditableLine {
  return { key: crypto.randomUUID(), productId, quantity: '', notes: '' }
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  required = true,
  emptyLabel,
}: {
  id: string
  label: string
  value: string
  options: Array<{ id: string; label: string }>
  onChange(value: string): void
  required?: boolean
  emptyLabel?: string
}) {
  return (
    <Field>
      <Label htmlFor={id} required={required}>{label}</Label>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
      >
        {!required ? <option value="">{emptyLabel ?? `No ${label}`}</option> : null}
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </Field>
  )
}

export function InventoryTransactionForm({
  orgSlug,
  type,
  options,
}: {
  orgSlug: string
  type: InventoryTransactionType
  options: InventoryTransactionFormOptions
}) {
  const router = useRouter()
  const modal = useRouteModalLifecycle()
  const config = labels[type]
  const [warehouseId, setWarehouseId] = useState(options.warehouses[0]?.id ?? '')
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(options.warehouses[1]?.id ?? '')
  const [partyId, setPartyId] = useState('')
  const [lines, setLines] = useState<EditableLine[]>([newLine(options.products[0]?.id)])
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const retry = useRef<{ fingerprint: string; key: string } | null>(null)
  const productById = useMemo(() => new Map(options.products.map((option) => [option.id, option])), [options.products])

  function updateLine(index: number, patch: Partial<EditableLine>) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line))
    modal?.markDirty()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = new FormData(event.currentTarget)
    const duplicate = new Set(lines.map((line) => line.productId)).size !== lines.length
    if (duplicate) {
      setMessage('A Product may appear only once in a transaction.')
      return
    }
    const common = {
      referenceNumber: String(form.get('referenceNumber') ?? '').trim() || undefined,
      referenceDate: String(form.get('referenceDate') ?? '').trim() || undefined,
      notes: String(form.get('notes') ?? '').trim() || undefined,
    }
    const payloadLines = lines.map((line) => ({
      productId: line.productId,
      unit: productById.get(line.productId)?.unit ?? 'pcs',
      ...(type === 'ADJUSTMENT' ? { countedQuantity: line.quantity } : { quantity: line.quantity }),
      notes: line.notes.trim() || undefined,
    }))
    const payload = type === 'TRANSFER'
      ? { ...common, sourceWarehouseId: warehouseId, destinationWarehouseId, lines: payloadLines }
      : {
          ...common,
          warehouseId,
          ...(type === 'RECEIPT' && partyId ? { supplierId: partyId } : {}),
          ...(type === 'ISSUE' && partyId ? { customerId: partyId } : {}),
          ...(type === 'ADJUSTMENT' ? { reason: String(form.get('reason') ?? '').trim() } : {}),
          lines: payloadLines,
        }
    const fingerprint = JSON.stringify(payload)
    if (!retry.current || retry.current.fingerprint !== fingerprint) {
      retry.current = { fingerprint, key: crypto.randomUUID() }
    }

    setPending(true)
    setMessage('')
    try {
      const response = await fetch(`/api/orgs/${encodeURIComponent(orgSlug)}/inventory/transactions/${config.plural}`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'Idempotency-Key': retry.current.key,
        },
        body: fingerprint,
      })
      const result = await response.json() as { data?: { id: string }; error?: { message: string } | null }
      if (!response.ok || result.error) {
        setMessage(result.error?.message ?? `The ${config.singular.toLowerCase()} could not be posted.`)
        return
      }
      retry.current = null
      if (modal) modal.completeMutation()
      else {
        router.push(`/${orgSlug}/inventory/transactions/${config.plural}` as never)
        router.refresh()
      }
    } catch {
      setMessage('The request could not be completed. Retry will safely use the same submission key.')
    } finally {
      setPending(false)
    }
  }

  const disabled = pending || options.products.length === 0 || options.warehouses.length === 0
  return (
    <form className="space-y-4" onSubmit={submit} onChange={() => modal?.markDirty()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="referenceNumber">Reference number</Label>
          <Input id="referenceNumber" name="referenceNumber" maxLength={100} />
        </Field>
        <Field>
          <Label htmlFor="referenceDate">Reference date</Label>
          <Input id="referenceDate" name="referenceDate" type="date" />
        </Field>
      </div>

      {type === 'TRANSFER' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField id="sourceWarehouseId" label="Source Warehouse" value={warehouseId} options={options.warehouses} onChange={setWarehouseId} />
          <SelectField id="destinationWarehouseId" label="Destination Warehouse" value={destinationWarehouseId} options={options.warehouses} onChange={setDestinationWarehouseId} />
        </div>
      ) : (
        <SelectField id="warehouseId" label={type === 'RECEIPT' ? 'Destination Warehouse' : type === 'ISSUE' ? 'Source Warehouse' : 'Warehouse'} value={warehouseId} options={options.warehouses} onChange={setWarehouseId} />
      )}

      {type === 'RECEIPT' ? (
        <SelectField id="supplierId" label="Supplier" value={partyId} options={options.suppliers} onChange={setPartyId} required={false} emptyLabel="No Supplier reference" />
      ) : null}
      {type === 'ISSUE' ? (
        <SelectField id="customerId" label="Customer" value={partyId} options={options.customers} onChange={setPartyId} required={false} emptyLabel="No Customer reference" />
      ) : null}
      {type === 'ADJUSTMENT' ? (
        <Field>
          <Label htmlFor="reason" required>Reason</Label>
          <Input id="reason" name="reason" required maxLength={500} placeholder="Physical count correction" />
        </Field>
      ) : null}

      <fieldset className="space-y-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
        <legend className="px-1 text-sm font-semibold">Product lines ({lines.length}/100)</legend>
        <FieldDescription>Each Product may appear once. Quantities support up to four decimal places.</FieldDescription>
        {lines.map((line, index) => (
          <div key={line.key} className="grid gap-3 border-b border-[var(--color-border)] pb-3 last:border-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
            <SelectField
              id={`line-${index}-product`}
              label={`Line ${index + 1} Product`}
              value={line.productId}
              options={options.products}
              onChange={(value) => updateLine(index, { productId: value })}
            />
            <Field>
              <Label htmlFor={`line-${index}-quantity`} required>{config.quantity}</Label>
              <Input
                id={`line-${index}-quantity`}
                inputMode="decimal"
                required
                value={line.quantity}
                onChange={(event) => updateLine(index, { quantity: event.target.value })}
                aria-describedby={`line-${index}-unit`}
              />
              <FieldDescription id={`line-${index}-unit`}>{productById.get(line.productId)?.unit ?? 'unit'}</FieldDescription>
            </Field>
            <Button
              className="self-end"
              type="button"
              variant="outline"
              disabled={lines.length === 1 || pending}
              aria-label={`Remove line ${index + 1}`}
              onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}
            >
              Remove
            </Button>
            <Field className="sm:col-span-3">
              <Label htmlFor={`line-${index}-notes`}>Line notes</Label>
              <Input id={`line-${index}-notes`} maxLength={500} value={line.notes} onChange={(event) => updateLine(index, { notes: event.target.value })} />
            </Field>
          </div>
        ))}
        <Button type="button" variant="secondary" disabled={pending || lines.length >= 100} onClick={() => setLines((current) => [...current, newLine(options.products.find((product) => !current.some((line) => line.productId === product.id))?.id ?? options.products[0]?.id)])}>
          Add Product line
        </Button>
      </fieldset>

      <Field>
        <Label htmlFor="notes">Transaction notes</Label>
        <textarea id="notes" name="notes" maxLength={1000} className="min-h-20 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" />
      </Field>
      <FieldError>{message}</FieldError>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={disabled}>{pending ? 'Posting…' : `Post ${config.singular}`}</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => modal ? modal.requestClose() : router.push(`/${orgSlug}/inventory/transactions/${config.plural}` as never)}>Cancel</Button>
      </div>
    </form>
  )
}

export function InventoryTransactionReverseForm({
  orgSlug,
  transactionId,
  closeHref,
}: {
  orgSlug: string
  transactionId: string
  closeHref: string
}) {
  const router = useRouter()
  const modal = useRouteModalLifecycle()
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const key = useRef<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    key.current ??= crypto.randomUUID()
    setPending(true)
    setMessage('')
    try {
      const response = await fetch(`/api/orgs/${encodeURIComponent(orgSlug)}/inventory/transactions/${encodeURIComponent(transactionId)}/reverse`, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'Idempotency-Key': key.current },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      const result = await response.json() as { error?: { message: string } | null }
      if (!response.ok || result.error) {
        setMessage(result.error?.message ?? 'The reversal could not be posted.')
        return
      }
      key.current = null
      if (modal) modal.completeMutation()
      else {
        router.push(closeHref as never)
        router.refresh()
      }
    } catch {
      setMessage('The request could not be completed. Retry will safely use the same submission key.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <p className="text-sm text-[var(--color-muted)]">Reversal appends inverse movements and preserves the original posted history. It cannot be undone.</p>
      <Field>
        <Label htmlFor="reversalReason" required>Reversal reason</Label>
        <Input id="reversalReason" required maxLength={500} value={reason} onChange={(event) => { setReason(event.target.value); key.current = null; modal?.markDirty() }} />
      </Field>
      <FieldError>{message}</FieldError>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" disabled={pending || !reason.trim()}>{pending ? 'Reversing…' : 'Post Reversal'}</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => modal ? modal.requestClose() : router.push(closeHref as never)}>Cancel</Button>
      </div>
    </form>
  )
}
