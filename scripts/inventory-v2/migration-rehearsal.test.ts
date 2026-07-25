import { describe, expect, it } from 'vitest'
import {
  assertDisposableDatabaseUrl,
  databaseIdentity,
  redactSecret,
  REHEARSAL_DATABASE_PREFIX,
} from './migration-safety'

describe('disposable migration safety gate', () => {
  const local = `postgresql://postgres:secret@127.0.0.1:54321/${REHEARSAL_DATABASE_PREFIX}fresh`

  it('accepts a namespaced loopback database', () => {
    expect(() => assertDisposableDatabaseUrl(local, [])).not.toThrow()
  })

  it.each([
    'postgresql://postgres:x@example.com:5432/onedayos_v2_6b_fresh',
    'postgresql://postgres:x@10.0.0.2:5432/onedayos_v2_6b_fresh',
    'postgresql://postgres:x@127.0.0.1:5432/postgres',
  ])('rejects unsafe target %s', (value) => {
    expect(() => assertDisposableDatabaseUrl(value, [])).toThrow()
  })

  it('normalizes host and escaped database names', () => {
    expect(databaseIdentity('postgresql://u:p@LOCALHOST:5432/OneDayOS_v2_6b_fresh')).toEqual({
      host: 'localhost',
      database: 'onedayos_v2_6b_fresh',
    })
  })

  it('rejects a target matching a configured sandbox identity', () => {
    expect(() =>
      assertDisposableDatabaseUrl(local, [
        `postgresql://different:credentials@127.0.0.1:54321/${REHEARSAL_DATABASE_PREFIX}fresh`,
      ]),
    ).toThrow(/matches a configured sandbox/)
  })

  it('redacts the random rehearsal credential', () => {
    expect(redactSecret('failed for secret-value', 'secret-value')).toBe('failed for [REDACTED]')
  })
})
