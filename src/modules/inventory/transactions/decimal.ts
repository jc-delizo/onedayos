const SCALE = 10_000n

export function scaled(value: unknown): bigint {
  const text = String(value)
  const negative = text.startsWith('-')
  const unsigned = negative ? text.slice(1) : text
  const [whole, fraction = ''] = unsigned.split('.')
  const result = BigInt(whole) * SCALE + BigInt(fraction.padEnd(4, '0').slice(0, 4))
  return negative ? -result : result
}

export function decimal(value: bigint): string {
  const negative = value < 0
  const absolute = negative ? -value : value
  const whole = absolute / SCALE
  const fraction = String(absolute % SCALE).padStart(4, '0').replace(/0+$/, '')
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}
