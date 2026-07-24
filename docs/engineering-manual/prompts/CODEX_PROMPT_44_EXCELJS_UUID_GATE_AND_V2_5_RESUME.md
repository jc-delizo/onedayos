# OneDayOS — ExcelJS UUID Compatibility Gate and V2-5 Resume

Prompt 43 correctly stopped at its mandatory dependency gate.

The attempted exact dependency:

```text
exceljs@4.4.0
```

resolved:

```text
exceljs@4.4.0
└── uuid@8.3.2
```

and triggered the reviewed moderate advisory:

```text
GHSA-w5hq-g745-h8pq
```

The Founder authorizes one narrowly scoped compatibility experiment:

```text
exceljs@4.4.0
└── uuid@11.1.1 through an ExcelJS-scoped npm override
```

This is not a blanket approval of ExcelJS.

The override must pass every compatibility, runtime, audit, server-boundary, and clean-removal gate below.

If the gate passes, resume Prompt 43 exactly from its post-dependency implementation phase.

If the gate fails, remove ExcelJS and the override, restore a clean dependency tree, and stop for Founder review.

## Why This Candidate Is Being Tested

The live advisory marks `uuid` versions below `11.1.1` as affected and `11.1.1` as patched.

ExcelJS 4.4.0 is a CommonJS package and currently declares `uuid@^8.3.0`.

The repository/community evidence indicates ExcelJS uses only the `v4()` API without external output-buffer arguments.

`uuid@11.1.1` is therefore the preferred patched compatibility candidate because:

- it contains the advisory fix,
- it still supports CommonJS,
- it preserves the named `v4` API used by ExcelJS,
- it avoids the CommonJS removal introduced in later UUID major lines.

These are hypotheses to verify, not assumptions to trust.

## Absolute Scope

### Allowed

- install exact `exceljs@4.4.0`
- add one nested npm override scoped only to ExcelJS:
  - `exceljs -> uuid@11.1.1`
- inspect every ExcelJS UUID call site
- add compatibility/security gate tests
- run workbook write/read round-trip tests
- run all audits and project gates
- document the override and its removal condition
- resume Prompt 43 only after every gate passes

### Forbidden

Do not:

- use a global `uuid` override
- use `uuid@12+`, `uuid@14`, or an ESM-only UUID release
- add `uuid` as a direct application dependency merely to mask the transitive path
- patch files inside `node_modules`
- fork ExcelJS in this task
- select another XLSX library silently
- suppress npm audit
- run `npm audit fix`
- run `npm audit fix --force`
- implement client-side Excel generation
- change Prisma schema
- create migrations
- implement V2-6 or later work
- add imports, background jobs, caching, accents, website assets, modules, or Platform Services

## Primary Authority

Read first:

- `docs/engineering-manual/00-meta/adrs/ADR-0017-bounded-table-export.md`
- `docs/engineering-manual/14-testing-quality/10-data-table-modal-export-testing.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FOUNDER-DECISION-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-FREEZE-REPORT.md`
- `docs/engineering-manual/00-meta/INVENTORY-DEMO-V2-IMPLEMENTATION-ROADMAP.md`
- `docs/engineering-manual/00-meta/V2-4-ACCEPTANCE-REPORT.md`
- `docs/engineering-manual/00-meta/DEPENDENCY-SECURITY-REMEDIATION-REPORT-2026-07.md`
- the complete Prompt 43 V2-5 instructions supplied by the Founder

If the complete Prompt 43 text is not available in repository/context, complete only the compatibility gate and stop. Do not reconstruct V2-5 from memory.

## Repository Safety

Before work:

1. Run `git status --short`.
2. Preserve all Prompt 31–43 work.
3. Do not reset, restore, delete, or overwrite unrelated files.
4. Do not create a commit unless separately instructed.
5. Stop any stale Next server before dependency installation/final build.
6. Keep the final server on port `1320`.
7. Use Node 24.

## Phase 1 — Capture the Clean Baseline

Run under Node 24:

```bash
node --version
npm --version

npm audit --json > /tmp/onedayos-exceljs-audit-baseline.json || true
npm audit --omit=dev --json > /tmp/onedayos-exceljs-audit-prod-baseline.json || true
npm ls exceljs uuid tmp --all || true
```

Confirm:

- ExcelJS is absent before the experiment
- all current audit thresholds are clean
- existing package overrides are recorded before editing

Do not print secrets.

## Phase 2 — Install ExcelJS and Add the Scoped Override

Install exact:

```text
exceljs@4.4.0
```

Merge, do not replace, the existing root `overrides` object.

Add exactly the nested override equivalent to:

```json
{
  "overrides": {
    "exceljs": {
      "uuid": "11.1.1"
    }
  }
}
```

Preserve all existing Next/PostCSS/Sharp/Prisma/find-my-way overrides.

Do not add a global:

```json
"uuid": "11.1.1"
```

Do not manually edit `package-lock.json`.

Regenerate through npm under Node 24.

Run:

```bash
npm ci
npm ls exceljs uuid tmp --all
npm explain uuid
```

Required tree:

```text
exceljs@4.4.0
└── uuid@11.1.1 overridden
```

No vulnerable `uuid@8.3.2` may remain under ExcelJS.

## Phase 3 — Inspect Every ExcelJS UUID Use

Inspect installed ExcelJS source:

```bash
rg -n "require\\(['\"]uuid['\"]\\)|from ['\"]uuid['\"]|uuidv4|\\.v4\\(" node_modules/exceljs
```

Record every production call site.

Required acceptance:

- ExcelJS uses only UUID `v4`
- no ExcelJS call uses UUID v3, v5, or v6
- no ExcelJS call passes an external output buffer
- no ExcelJS call relies on removed v8-only behavior
- import form resolves correctly with UUID 11.1.1 under Node 24

If any incompatible use is found, remove the dependency/override and stop.

## Phase 4 — CommonJS and Module-Interop Gate

Verify under Node 24:

```text
require('exceljs')
dynamic import('exceljs')
require('uuid').v4
```

or equivalent tests matching the actual server bundling mode.

Required:

- no `ERR_REQUIRE_ESM`
- no Jest/Vitest ESM parse failure
- no missing `v4` export
- no browser-build resolution in the Node server path
- no peer/dependency-tree invalid state

Add focused automated tests.

Do not rely only on a one-line manual smoke command.

## Phase 5 — Workbook Round-Trip Compatibility Tests

Create test-only compatibility coverage.

At minimum:

1. Construct an ExcelJS Workbook.
2. Set workbook metadata.
3. Add a worksheet.
4. Add stable columns.
5. Add rows containing:
   - text
   - number
   - boolean
   - Date
   - null
   - formula-like text that remains text
6. Apply the limited header/freeze/autofilter features planned by V2-5.
7. Write the workbook to a Buffer.
8. Confirm the buffer begins with a valid ZIP/XLSX signature.
9. Load the buffer into a new ExcelJS Workbook.
10. Verify:
    - worksheet exists
    - headers match
    - row count matches
    - typed values round-trip
    - dates round-trip
    - no formula is created
11. Create multiple workbooks/worksheets to exercise ExcelJS UUID generation repeatedly.
12. Run the tests under Node 24.

Also test:

- safe worksheet-name handling
- maximum worksheet-name length
- workbook generation with at least several hundred rows
- no temp-file requirement for the in-memory V2-5 path

Do not implement the final V2-5 export adapter until this gate passes.

## Phase 6 — Server-Only Boundary Gate

Before V2-5 implementation, prove:

- ExcelJS is imported only by server-only test/gate files
- no client component imports ExcelJS
- no browser-safe SDK export exposes ExcelJS
- no shared component imports ExcelJS
- `next build` succeeds
- ExcelJS is not required by client-side entry points

Add or strengthen architecture/UX source-contract checks.

During resumed V2-5, preserve this boundary through a dynamic or server-only import as appropriate.

## Phase 7 — Security Audit Gate

Run:

```bash
npm audit --json > /tmp/onedayos-exceljs-audit-after-override.json || true
npm audit --omit=dev --json > /tmp/onedayos-exceljs-audit-prod-after-override.json || true

npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate
```

All three threshold commands must pass.

Also inspect:

```bash
npm ls uuid tmp --all
```

Confirm:

- no affected UUID version remains
- no vulnerable `tmp` version is introduced
- no other ExcelJS transitive advisory appears
- no invalid peer state exists

If any advisory remains, remove ExcelJS and the scoped override, restore clean `package.json`/lock state, rerun audits, and stop.

## Phase 8 — Full Project Regression Gate

Run:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run check:ux
npm run test:a11y
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm run check:all
npm run demo:check
```

Required:

- all pass
- no V2-1 through V2-4 regression
- no demo-role change
- no schema/migration change
- no runtime UI change before Prompt 43 resumes

## Phase 9 — Create the Compatibility-Gate Report

Create:

```text
docs/engineering-manual/00-meta/
  V2-5-EXCELJS-UUID-COMPATIBILITY-GATE.md
```

Required sections:

```text
# V2-5 ExcelJS UUID Compatibility Gate

## Status

## Trigger

## Runtime

## ExcelJS Decision

## Advisory

## ExcelJS UUID Usage Audit

## Override Scope

## CommonJS/ESM Compatibility

## Workbook Round-Trip Tests

## Server-Only Boundary

## Audit Before

## Audit After

## Risks

## Override Removal Condition

## Prompt 43 Resume Status
```

If all gates pass, allowed status:

```text
ExcelJS Compatibility Gate Passed
Prompt 43 May Resume
```

Document removal condition:

```text
Remove the override when a stable ExcelJS release declares a patched compatible UUID dependency and passes the same gate.
```

Do not mark V2-5 complete yet.

## Phase 10 — Resume Prompt 43

Only after every compatibility/security gate passes:

1. Read the complete Prompt 43.
2. Resume it from the post-dependency implementation phase.
3. Preserve its full frozen scope and forbidden boundaries.
4. Implement the bounded server-side CSV/XLSX export package.
5. Complete every Prompt 43 final-report requirement.

Do not repeat the dependency gate unnecessarily.

If Prompt 43 is unavailable, stop after the compatibility report and ask the Founder to provide it.

## Rollback on Gate Failure

If any gate fails:

1. Remove `exceljs`.
2. Remove only the nested ExcelJS → UUID override.
3. Regenerate the lockfile.
4. Run `npm ci`.
5. Confirm all three audit thresholds return zero.
6. Confirm `check:all` and `demo:check` pass.
7. Document the exact failed compatibility condition.
8. Stop for Founder review.

Do not select another library in the same task.

## Final Verification

Under Node 24:

```bash
node --version
npm --version
npm ci

npm ls exceljs uuid tmp --all
npm ls --all

npm run typecheck
npm run lint
npm run test:run
npm run check:ux
npm run test:a11y
npm run build
npm run check:architecture
npm run check:generated
npm run check:env
npm run check:prisma
npm run check:all
npm run demo:check

npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=high
npm audit --audit-level=moderate

git diff --check
git status --short
```

Do not run:

```bash
npm audit fix
npm audit fix --force
```

## Final Report Required

Report:

1. Compatibility-gate summary.
2. Node/npm versions.
3. Files inspected.
4. Files created.
5. Files modified.
6. Exact ExcelJS version.
7. Exact UUID override and scope.
8. Why UUID 11.1.1 was selected.
9. Every ExcelJS UUID call site and API used.
10. CommonJS/ESM compatibility result.
11. Workbook write/read round-trip result.
12. Server-only boundary result.
13. `npm ls exceljs uuid tmp` result.
14. Before/after audit counts.
15. Production-moderate audit result.
16. Full-high audit result.
17. Full-moderate audit result.
18. Full project gate results.
19. `check:all` result.
20. `demo:check` result.
21. Override risks/removal condition.
22. Whether Prompt 43 was available and resumed.
23. If resumed, provide the complete Prompt 43 final report.
24. If not resumed, state exactly why.
25. Confirmation that no alternative XLSX library, global UUID override, Prisma/schema/migration change, V2-6+ feature, caching, accents, website assets, new module, or Platform Service was added.
26. Whether the ExcelJS compatibility gate passed.
27. Whether V2-5 is complete or remains incomplete.

Stop on any compatibility or audit failure.
