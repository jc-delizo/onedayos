import { createHash } from 'node:crypto'

export function sanitizedRef(kind: string, value: string): string {
  return `${kind}_${createHash('sha256').update(value).digest('hex').slice(0, 12)}`
}

export function legacyAdjustmentTransactionNumber(orgId: string, adjustmentId: string, createdAt: Date): string {
  const year = createdAt.getUTCFullYear()
  const suffix = createHash('sha256')
    .update(`${orgId}:${adjustmentId}`)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase()

  return `ADJ-${year}-${suffix}`
}

export function legacyAdjustmentLineId(adjustmentId: string): string {
  return `legacy-adjustment-line:${adjustmentId}`
}
