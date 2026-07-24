# V2-5 ExcelJS UUID Compatibility Gate

## Status

ExcelJS Compatibility Gate Passed
Prompt 43 May Resume

## Trigger

The first `exceljs@4.4.0` installation resolved `uuid@8.3.2` and activated moderate advisory `GHSA-w5hq-g745-h8pq`. Prompt 43 stopped and removed the dependency. Prompt 44 authorized one ExcelJS-scoped patched UUID experiment.

## Runtime

- Node `24.18.0`
- npm `11.16.0`
- Next.js `16.2.11`

## ExcelJS Decision

V2-5 uses exact `exceljs@4.4.0`, server-side only. It remains the npm stable release and is MIT licensed. The stable release is old and its declared UUID range is stale, so the scoped override remains an explicit maintenance risk.

## Advisory

`GHSA-w5hq-g745-h8pq` affects UUID versions below `11.1.1`. The clean installed tree contains `uuid@11.1.1` and no UUID 8 copy.

## ExcelJS UUID Usage Audit

The only production import is:

```text
node_modules/exceljs/lib/xlsx/xform/sheet/cf-ext/cf-rule-ext-xform.js
```

It destructures CommonJS `v4` and has two calls:

```text
uuidv4()
uuidv4()
```

Both calls have zero arguments. There is no UUID v3, v5, v6, external output buffer, or removed v8-only behavior in ExcelJS production source.

## Override Scope

The root package preserves the existing Next and Prisma overrides and adds only:

```json
{
  "exceljs": {
    "uuid": "11.1.1"
  }
}
```

There is no global UUID override and UUID is not a direct dependency.

## CommonJS/ESM Compatibility

Under Node 24:

- `require('exceljs')`: passed.
- dynamic `import('exceljs')`: passed.
- `require('uuid').v4`: passed.
- no `ERR_REQUIRE_ESM`, missing export, peer, or tree error occurred.

## Workbook Round-Trip Tests

Automated coverage creates three independent 350-row workbooks, exercises both reviewed UUID call sites through x14 conditional-formatting serialization, writes in memory, verifies the ZIP signature, reloads with ExcelJS, and verifies headers, row count, text, number, boolean, Date, null, freeze pane, autofilter, formula-safe text, and worksheet-name limits. No temp file is required.

## Server-Only Boundary

ExcelJS production use exists only in `src/platform/table-export/xlsx-exporter.ts`, which begins with `import 'server-only'`. Client components receive only endpoint/download UI state. Architecture and UX gates reject client ExcelJS imports. Next production build passes.

## Audit Before

The post-Prompt-43 baseline contained zero full and production audit findings and no ExcelJS.

## Audit After

With the scoped override:

- production moderate: zero findings;
- full high: zero findings;
- full moderate: zero findings;
- `tmp@0.2.7`;
- `npm ls --all`: valid.

JSON evidence is retained privately under `/tmp/onedayos-exceljs-audit-*.json`.

## Risks

- ExcelJS 4.4.0 has a slow stable-release cadence and legacy transitive packages.
- UUID 11.1.1 is outside ExcelJS’s declared `^8.3.0` range even though the audited API is compatible.
- In-memory XLSX cost grows with row and column count; V2-5 therefore remains synchronous and capped at 10,000 rows.
- Future advisories can change the decision.

## Override Removal Condition

Remove the override when a stable ExcelJS release declares a patched compatible UUID dependency and passes the same gate.

## Prompt 43 Resume Status

All compatibility and audit conditions passed. Prompt 43 resumed from its post-dependency implementation phase.
