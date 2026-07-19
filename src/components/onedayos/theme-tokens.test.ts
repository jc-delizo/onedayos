import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('OneDayOS theme tokens', () => {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

  it('locks OneDayOS Compact brand, primary, and neutral accent semantics', () => {
    expect(css).toContain('--color-brand: #F97316')
    expect(css).toContain('--color-primary: #F97316')
    expect(css).toContain('--color-accent:')
    expect(css).not.toMatch(/--color-accent\s*:\s*#F97316/i)
  })

  it('defines required semantic token families for light and dark mode', () => {
    for (const token of [
      '--color-background',
      '--color-foreground',
      '--color-surface',
      '--color-surface-raised',
      '--color-surface-muted',
      '--color-border',
      '--color-border-strong',
      '--color-muted',
      '--color-muted-foreground',
      '--color-brand-foreground',
      '--color-primary-foreground',
      '--color-accent-foreground',
      '--color-destructive',
      '--color-destructive-foreground',
      '--color-success',
      '--color-success-foreground',
      '--color-warning',
      '--color-warning-foreground',
      '--color-information',
      '--color-information-foreground',
      '--color-focus-ring',
      '--color-sidebar-background',
      '--color-sidebar-foreground',
      '--color-sidebar-muted',
      '--color-sidebar-hover',
      '--color-sidebar-selected',
      '--color-popover-background',
      '--color-popover-foreground',
    ]) {
      expect(css).toContain(token)
    }

    expect(css.match(/--color-sidebar-background/g)).toHaveLength(2)
    expect(css.match(/--color-primary:/g)).toHaveLength(2)
    expect(css.match(/--color-accent:/g)).toHaveLength(2)
  })

  it('uses the approved system UI font stack without an unloaded Inter-first declaration', () => {
    expect(css).toContain('--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;')
    expect(css).not.toMatch(/--font-sans\s*:[^;]*\bInter\b/)
    expect(css).not.toContain('next/font')
  })

  it('locks compact radius tokens at 4px, 6px, and 8px', () => {
    expect(css).toContain('--radius-small: 4px')
    expect(css).toContain('--radius-medium: 6px')
    expect(css).toContain('--radius-large: 8px')
    expect(css).toContain('--radius-xs: 4px')
    expect(css).toContain('--radius-sm: 6px')
    expect(css).toContain('--radius-md: 8px')
  })

  it('keeps raw brand orange restricted to approved token definitions', () => {
    const rawOrangeMatches = [...css.matchAll(/#F97316/g)].map((match) => {
      const lineStart = css.lastIndexOf('\n', match.index) + 1
      const lineEnd = css.indexOf('\n', match.index)
      return css.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim()
    })

    expect(rawOrangeMatches).toEqual([
      '--color-brand: #F97316;',
      '--color-primary: #F97316;',
      '--color-brand: #F97316;',
      '--color-primary: #F97316;',
    ])
  })

  it('uses class-based Tailwind dark mode tokens', () => {
    expect(css).toContain('@custom-variant dark (&:where(.dark, .dark *));')
    expect(css).toMatch(/\.dark\s*\{/)
    expect(css).not.toContain('@media (prefers-color-scheme: dark)')
  })
})
