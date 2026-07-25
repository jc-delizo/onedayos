import { describe, expect, it } from 'vitest'
import {
  evaluateDependencyAuditPolicy,
  type AuditPolicyInput,
  type AuditReport,
} from './check-dependency-audit-policy'

const advisory = {
  name: 'brace-expansion',
  severity: 'high',
  title: 'brace-expansion denial of service',
  url: 'https://github.com/advisories/GHSA-mh99-v99m-4gvg',
}

function approvedInput(): AuditPolicyInput {
  const vulnerabilities: AuditReport['vulnerabilities'] = {
    'brace-expansion': { name: 'brace-expansion', severity: 'high', isDirect: false, via: [advisory] },
    minimatch: { name: 'minimatch', severity: 'high', isDirect: false, via: ['brace-expansion'] },
    '@eslint/config-array': { name: '@eslint/config-array', severity: 'high', isDirect: false, via: ['minimatch'] },
    '@eslint/eslintrc': { name: '@eslint/eslintrc', severity: 'high', isDirect: false, via: ['minimatch'] },
    eslint: { name: 'eslint', severity: 'high', isDirect: true, via: ['@eslint/config-array', '@eslint/eslintrc', 'minimatch'] },
    'eslint-plugin-import': { name: 'eslint-plugin-import', severity: 'high', isDirect: false, via: ['minimatch'] },
    'eslint-plugin-jsx-a11y': { name: 'eslint-plugin-jsx-a11y', severity: 'high', isDirect: false, via: ['minimatch'] },
    'eslint-plugin-react': { name: 'eslint-plugin-react', severity: 'high', isDirect: false, via: ['minimatch'] },
    'eslint-config-next': {
      name: 'eslint-config-next',
      severity: 'high',
      isDirect: true,
      via: ['eslint-plugin-import', 'eslint-plugin-jsx-a11y', 'eslint-plugin-react'],
    },
  }
  return {
    production: { vulnerabilities: {} },
    full: { vulnerabilities },
    now: new Date('2026-07-25T00:00:00.000Z'),
    lockPackages: {
      'node_modules/eslint': { version: '9.39.4', dev: true },
      'node_modules/eslint-config-next': { version: '16.2.11', dev: true },
      'node_modules/eslint-config-next/node_modules/eslint-plugin-import': { version: '2.32.0', dev: true },
      'node_modules/eslint-config-next/node_modules/eslint-plugin-jsx-a11y': { version: '6.10.2', dev: true },
      'node_modules/eslint-config-next/node_modules/eslint-plugin-react': { version: '7.37.5', dev: true },
      'node_modules/minimatch': { version: '3.1.5', dev: true },
      'node_modules/brace-expansion': { version: '1.1.16', dev: true },
      'node_modules/safe/node_modules/brace-expansion': { version: '5.0.8', dev: true },
    },
  }
}

describe('dependency audit exception policy', () => {
  it('accepts only the exact approved tree', () => {
    expect(evaluateDependencyAuditPolicy(approvedInput())).toEqual({ ok: true, errors: [], approvedExceptionCount: 1 })
  })

  it('accepts a fully clean tree', () => {
    const input = approvedInput()
    input.full.vulnerabilities = {}
    input.lockPackages = {}
    const result = evaluateDependencyAuditPolicy(input)
    expect(result.errors).not.toContain('Production dependency audit must contain zero findings.')
  })

  it.each([
    ['production occurrence', (input: AuditPolicyInput) => { input.production.vulnerabilities = input.full.vulnerabilities }, 'Production dependency audit'],
    ['different advisory', (input: AuditPolicyInput) => { input.full.vulnerabilities['brace-expansion'].via = [{ ...advisory, url: 'https://github.com/advisories/GHSA-other' }] }, 'other than the exact approved GHSA'],
    ['additional moderate advisory', (input: AuditPolicyInput) => { input.full.vulnerabilities.other = { name: 'other', severity: 'moderate', isDirect: false, via: [{ ...advisory, name: 'other', severity: 'moderate', url: 'https://github.com/advisories/GHSA-other' }] } }, 'do not exactly match'],
    ['direct dependency', (input: AuditPolicyInput) => { input.full.vulnerabilities['brace-expansion'].isDirect = true }, 'must exist and remain transitive'],
    ['wrong package', (input: AuditPolicyInput) => { input.full.vulnerabilities['brace-expansion'].via = [{ ...advisory, name: 'wrong' }] }, 'does not resolve only'],
    ['wrong root', (input: AuditPolicyInput) => { input.lockPackages['node_modules/eslint']!.version = '9.39.5' }, 'Approved lint root changed'],
    ['critical severity', (input: AuditPolicyInput) => { input.full.vulnerabilities.minimatch.severity = 'critical' }, 'Critical finding'],
    ['expired exception', (input: AuditPolicyInput) => { input.now = new Date('2026-09-01T00:00:00.000Z') }, 'expired'],
    ['production lock node', (input: AuditPolicyInput) => { input.lockPackages['node_modules/brace-expansion']!.dev = false }, 'not strictly dev-only'],
  ])('rejects %s', (_label, mutate, expected) => {
    const input = approvedInput()
    mutate(input)
    expect(evaluateDependencyAuditPolicy(input).errors.join(' ')).toContain(expected)
  })

  it('parses the review date as an exact UTC boundary', () => {
    const before = approvedInput()
    before.now = new Date('2026-08-31T23:59:59.999Z')
    expect(evaluateDependencyAuditPolicy(before).ok).toBe(true)
    const after = approvedInput()
    after.now = new Date('2026-09-01T00:00:00.000Z')
    expect(evaluateDependencyAuditPolicy(after).ok).toBe(false)
  })

  it('returns only bounded diagnostics and no lockfile content', () => {
    const result = evaluateDependencyAuditPolicy(approvedInput())
    expect(JSON.stringify(result)).not.toContain('password')
    expect(JSON.stringify(result)).not.toContain('resolved')
    expect(JSON.stringify(result).length).toBeLessThan(500)
  })
})
