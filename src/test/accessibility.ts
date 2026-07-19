import axe, { type Result, type RunOptions } from 'axe-core'
import { expect } from 'vitest'

export type AccessibilityCheckOptions = RunOptions

const defaultOptions: AccessibilityCheckOptions = {
  rules: {
    // jsdom does not implement canvas rendering used by axe-core color contrast.
    // Keep browser/manual color-contrast review explicit instead of producing noisy false signals here.
    'color-contrast': { enabled: false },
  },
}

function mergeOptions(options?: AccessibilityCheckOptions): AccessibilityCheckOptions {
  return {
    ...defaultOptions,
    ...options,
    rules: {
      ...defaultOptions.rules,
      ...options?.rules,
    },
  }
}

function formatViolation(violation: Result) {
  const nodes = violation.nodes
    .map((node) => {
      const target = node.target.join(', ')
      const summary = node.failureSummary ? ` ${node.failureSummary.replace(/\s+/g, ' ').trim()}` : ''
      return `    - ${target}${summary}`
    })
    .join('\n')

  return [
    `${violation.id}: ${violation.help}`,
    `  Impact: ${violation.impact ?? 'unknown'}`,
    `  Help: ${violation.helpUrl}`,
    nodes,
  ]
    .filter(Boolean)
    .join('\n')
}

export async function getA11yViolations(container: HTMLElement, options?: AccessibilityCheckOptions) {
  const results = await axe.run(container, mergeOptions(options))
  return results.violations
}

export async function expectNoA11yViolations(container: HTMLElement, options?: AccessibilityCheckOptions) {
  const violations = await getA11yViolations(container, options)
  const message = violations.map(formatViolation).join('\n\n')

  expect(violations, message).toHaveLength(0)
}
