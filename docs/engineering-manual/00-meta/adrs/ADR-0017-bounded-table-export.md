# ADR-0017: Bounded Table Export

Status: Accepted
Date: 2026-07
Implementation Timing: V2-5
Implementation Allowed: Only through the approved V2-5 implementation package

## Context

Founder review requested CSV and Excel export for eligible tables. Prior manuals prohibit a broad Import/Export Engine at this stage. A bounded table export capability can satisfy operational demo needs without opening a platform-wide dynamic export system.

## Decision

Export V1 is a bounded server-side capability attached only to approved tables:

- CSV.
- XLSX.
- Explicit export permissions separate from read.
- Current filters and sort applied.
- Selected rows or all filtered rows within limits.
- Allowlisted columns only.
- Tenant-scoped server generation.
- Row-count limits and safe filenames.
- No hidden or internal IDs unless explicitly approved.
- No client-side export from untrusted hidden data sets.

## Candidate Permissions

- `inventory.stock_level.export`
- `inventory.stock_movement.export`
- `inventory.stock_adjustment.export`
- `objects.product.export`
- `objects.customer.export`
- `objects.supplier.export`
- `objects.warehouse.export`

## Consequences

- Export cannot be implemented purely client-side from hidden table data.
- Export schemas and route tests must prove tenant isolation, permission denial, and column allowlisting.
- `exceljs@4.4.0` is conditionally approved for server-side use behind a small replaceable adapter.

## Non-Goals

- Import engine.
- Report builder.
- Saved views.
- Scheduled exports.
- Background jobs.

## Conditional Library Decision

Before V2-5, recheck `exceljs@4.4.0` against Node 24, Next.js 16, current maintenance and security state, critical advisories, and server-bundle behavior. Do not include it in client bundles. If the audit is unacceptable, stop for Founder review rather than silently selecting a substitute.

## Implementation Timing

V2-5 only. Eligible tables and permission grants must be named by that implementation package.
