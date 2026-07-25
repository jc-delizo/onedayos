import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dependencyAuditPolicy } from './dependency-audit-policy'

type AuditAdvisory = {
  name: string
  severity: string
  title: string
  url: string
}

type AuditVulnerability = {
  name: string
  severity: string
  isDirect: boolean
  via: Array<string | AuditAdvisory>
}

export type AuditReport = {
  vulnerabilities: Record<string, AuditVulnerability>
}

export type LockPackage = {
  version?: string
  dev?: boolean
  devOptional?: boolean
  optional?: boolean
}

export type AuditPolicyInput = {
  production: AuditReport
  full: AuditReport
  lockPackages: Record<string, LockPackage>
  now: Date
}

export type AuditPolicyResult = {
  ok: boolean
  errors: string[]
  approvedExceptionCount: number
}

function vulnerableBraceNodes(lockPackages: Record<string, LockPackage>): Array<[string, LockPackage]> {
  return Object.entries(lockPackages).filter(([path, value]) =>
    /(?:^|\/)node_modules\/brace-expansion$/.test(path) &&
    value.version !== undefined &&
    value.version !== '5.0.8',
  )
}

function expectedVersion(lockPackages: Record<string, LockPackage>, packageName: string): string | undefined {
  const exactPaths: Record<string, string> = {
    eslint: 'node_modules/eslint',
    'eslint-config-next': 'node_modules/eslint-config-next',
    'eslint-plugin-import': 'node_modules/eslint-config-next/node_modules/eslint-plugin-import',
    'eslint-plugin-jsx-a11y': 'node_modules/eslint-config-next/node_modules/eslint-plugin-jsx-a11y',
    'eslint-plugin-react': 'node_modules/eslint-config-next/node_modules/eslint-plugin-react',
    minimatch: 'node_modules/minimatch',
    'brace-expansion': 'node_modules/brace-expansion',
  }
  return lockPackages[exactPaths[packageName]]?.version
}

export function evaluateDependencyAuditPolicy(input: AuditPolicyInput): AuditPolicyResult {
  const errors: string[] = []
  const productionEntries = Object.keys(input.production.vulnerabilities)
  if (productionEntries.length > 0) errors.push('Production dependency audit must contain zero findings.')

  if (Object.keys(input.full.vulnerabilities).length === 0) {
    return { ok: errors.length === 0, errors, approvedExceptionCount: 0 }
  }

  if (input.now.getTime() > Date.parse(dependencyAuditPolicy.reviewBy)) {
    errors.push(`Development-tooling exception expired on ${dependencyAuditPolicy.reviewBy}.`)
  }

  const entries = Object.keys(input.full.vulnerabilities).sort()
  const expectedEntries = [...dependencyAuditPolicy.expectedVulnerabilityEntries].sort()
  if (JSON.stringify(entries) !== JSON.stringify(expectedEntries)) {
    errors.push('Full audit package entries do not exactly match the approved lint-tooling graph.')
  }

  const advisoryObjects: AuditAdvisory[] = []
  const reachesApprovedAdvisory = (name: string, seen = new Set<string>()): boolean => {
    if (seen.has(name)) return false
    seen.add(name)
    const vulnerability = input.full.vulnerabilities[name]
    if (!vulnerability) return false
    let approved = false
    for (const via of vulnerability.via) {
      if (typeof via === 'string') {
        approved = reachesApprovedAdvisory(via, new Set(seen)) || approved
      } else {
        advisoryObjects.push(via)
        approved =
          via.name === dependencyAuditPolicy.package &&
          via.severity === dependencyAuditPolicy.severity &&
          via.url === dependencyAuditPolicy.advisoryUrl
            ? true
            : approved
      }
    }
    return approved
  }

  for (const [name, vulnerability] of Object.entries(input.full.vulnerabilities)) {
    if (vulnerability.severity === 'critical') errors.push(`Critical finding is never excepted: ${name}.`)
    if (!reachesApprovedAdvisory(name)) errors.push(`Finding does not resolve only to the approved advisory: ${name}.`)
  }

  const uniqueAdvisories = new Set(advisoryObjects.map(({ url }) => url))
  if (uniqueAdvisories.size !== 1 || !uniqueAdvisories.has(dependencyAuditPolicy.advisoryUrl)) {
    errors.push('Raw audit contains an advisory other than the exact approved GHSA.')
  }

  const braceFinding = input.full.vulnerabilities[dependencyAuditPolicy.package]
  if (!braceFinding || braceFinding.isDirect) {
    errors.push('Approved brace-expansion finding must exist and remain transitive.')
  }

  for (const [name, version] of Object.entries(dependencyAuditPolicy.expectedVersions)) {
    if (expectedVersion(input.lockPackages, name) !== version) {
      errors.push(`Approved lint root changed: ${name} must remain ${version}.`)
    }
  }

  const vulnerableNodes = vulnerableBraceNodes(input.lockPackages)
  if (vulnerableNodes.length === 0) errors.push('Expected dev-only vulnerable brace-expansion node is absent.')
  for (const [path, value] of vulnerableNodes) {
    if (!value.dev || value.optional || value.devOptional) {
      errors.push(`Vulnerable brace-expansion node is not strictly dev-only: ${path}.`)
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    approvedExceptionCount: errors.length === 0 ? uniqueAdvisories.size : 0,
  }
}

function runAudit(args: string[]): AuditReport {
  const result = spawnSync('npm', ['audit', '--json', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  })
  if (!result.stdout.trim()) throw new Error('npm audit returned no JSON output.')
  return JSON.parse(result.stdout) as AuditReport
}

function main(): void {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as {
    packages: Record<string, LockPackage>
  }
  const result = evaluateDependencyAuditPolicy({
    production: runAudit(['--omit=dev']),
    full: runAudit([]),
    lockPackages: lock.packages,
    now: new Date(),
  })

  if (!result.ok) {
    process.stderr.write(`Dependency audit policy failed:\n${result.errors.map((error) => `- ${error}`).join('\n')}\n`)
    process.exitCode = 1
    return
  }

  process.stdout.write(
    [
      'Production dependency audit: clean.',
      `Approved development exception count: ${result.approvedExceptionCount}.`,
      `Review by: ${dependencyAuditPolicy.reviewBy.slice(0, 10)}.`,
      `Removal trigger: ${dependencyAuditPolicy.removalConditions.join('; ')}.`,
    ].join('\n') + '\n',
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`Dependency audit policy failed: ${error instanceof Error ? error.message : 'unknown error'}\n`)
    process.exitCode = 1
  }
}
