# Development Tooling Security Exception

## Status

Accepted Temporarily

Review By: 2026-08-31

Production dependency audit: clean.

Development audit: one approved, time-bounded lint-tooling exception.

## Advisory

GHSA-mh99-v99m-4gvg affects `brace-expansion` and is rated high. The raw npm audit represents
this single advisory as nine vulnerable wrapper package entries.

## Affected Dependency Path

The affected copies are transitive development dependencies beneath ESLint 9,
`eslint-config-next@16.2.11`, and their stable lint plugins through `minimatch@3.1.5`.
`scripts/check-dependency-audit-policy.ts` freezes the exact advisory, versions, wrapper entries,
approved roots, and dev-only lockfile classification.

## Production Exposure

No affected copy occurs in `npm ls --omit=dev`; the production audit reports zero findings.
Application runtime source does not import Brace Expansion, Minimatch, or ESLint internals, and no
request value is passed to lint patterns.

## Development Exposure

Exposure is limited to local and CI lint execution over repository-controlled static patterns and
configuration. Lint receives no sandbox or production secrets.

## Why a Drop-In Override Is Unsafe

Legacy Minimatch 3 calls Brace Expansion as a CommonJS function. Patched Brace Expansion 5 exposes
a different named-export API. Forcing it below Minimatch 3 breaks the consumer contract. ESLint 10
is also not an accepted substitute while the current stable plugins reject its peer range.

## Approved Compensating Controls

- production moderate-or-higher audit must remain at zero;
- the strict policy checker rejects any changed/additional advisory, package, severity, dependency
  class, root, wrapper, version, or expired review date;
- affected lockfile nodes must remain dev-only and transitive;
- runtime source and request handling remain outside the lint graph;
- no generic audit allowlist or suppression exists.

## CI Controls

CI runs the production audit and exact policy checker as required gates. Raw full audit output
remains visible and nonzero. Lint remains required, is bounded to ten minutes inside a 45-minute
job, uses static repository input, and receives no environment secrets.

## Review-By Date

2026-08-31 at the latest.

## Removal Triggers

Review earlier when ESLint, `eslint-config-next`, `@eslint/*`, any `eslint-plugin-*`, Minimatch,
Brace Expansion, Next.js lint integration, or advisory metadata changes. Remove the exception as
soon as a coherent stable patched lint stack passes install, peer, lint, test, build, and audit
gates.

## Owner

Platform Security.

## Prohibited Workarounds

Do not force Brace Expansion 5 below Minimatch 3, adopt ESLint 10 with invalid plugin peers, patch
`node_modules`, add `patch-package`, maintain a local fork in this package, suppress all
advisories, remove lint, or run either form of `npm audit fix`.

## Current Upstream Status

As verified 2026-07-25, the repository's stable ESLint/Next lint graph has no compatible clean
resolution. Upstream and npm advisory metadata must be checked at every removal trigger and no
later than the review date.
