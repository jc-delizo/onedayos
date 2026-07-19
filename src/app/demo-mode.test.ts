import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('demo mode indexing controls', () => {
  it('can noindex and nofollow the root app metadata in controlled demo mode', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8')

    expect(source).toContain('getDemoRuntimeConfig')
    expect(source).toContain('index: false')
    expect(source).toContain('follow: false')
    expect(source).toContain('googleBot')
  })

  it('disallows all robots crawling when demo mode is enabled', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/robots.ts'), 'utf8')

    expect(source).toContain('getDemoRuntimeConfig')
    expect(source).toContain("disallow: '/'")
    expect(source).toContain("allow: '/'")
  })
})
