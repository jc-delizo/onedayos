import { createHash, randomBytes } from 'node:crypto'

export function requireIdempotencyKey(value: string | null): string {
  if (!value) {
    throw new InventoryTransactionError(
      'IDEMPOTENCY_KEY_REQUIRED',
      400,
      'Idempotency-Key header is required.',
    )
  }
  if (value.length > 200 || !/^[\x21-\x7e]+$/.test(value)) {
    throw new InventoryTransactionError(
      'VALIDATION_ERROR',
      400,
      'A printable, non-blank Idempotency-Key header of at most 200 characters is required.',
    )
  }
  return value
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)]))
  }
  return value
}

export function requestHash(operation: string, value: unknown): string {
  return sha256(JSON.stringify(stable({ operation, value })))
}

const PREFIX = { RECEIPT: 'REC', ISSUE: 'ISS', TRANSFER: 'TRF', ADJUSTMENT: 'ADJ' } as const

export function transactionNumber(
  type: keyof typeof PREFIX,
  now = new Date(),
  entropy: () => Buffer = () => randomBytes(8),
): string {
  const suffix = entropy().toString('hex').toUpperCase()
  if (!/^[0-9A-F]{16}$/.test(suffix)) throw new Error('Transaction-number entropy must be exactly eight bytes.')
  return `${PREFIX[type]}-${now.getUTCFullYear()}-${suffix}`
}

export function reversalTransactionNumber(now = new Date(), entropy: () => Buffer = () => randomBytes(8)): string {
  const suffix = entropy().toString('hex').toUpperCase()
  if (!/^[0-9A-F]{16}$/.test(suffix)) throw new Error('Transaction-number entropy must be exactly eight bytes.')
  return `REV-${now.getUTCFullYear()}-${suffix}`
}

export function utcDate(value?: string): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

export class InventoryTransactionError extends Error {
  constructor(
    public readonly code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'IDEMPOTENCY_KEY_REQUIRED' | 'IDEMPOTENCY_KEY_REUSED'
      | 'INSUFFICIENT_STOCK' | 'TRANSACTION_ALREADY_REVERSED' | 'INVENTORY_REFERENCE_INVALID' | 'INTERNAL_ERROR',
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'InventoryTransactionError'
  }
}

export function isInventoryTransactionError(error: unknown): error is InventoryTransactionError {
  return error instanceof InventoryTransactionError
}
