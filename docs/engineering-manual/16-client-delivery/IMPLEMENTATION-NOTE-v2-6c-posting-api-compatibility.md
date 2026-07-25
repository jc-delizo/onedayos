# Implementation Note — V2-6C Posting API Compatibility

Status: Founder Accepted on 2026-07-25; Sandbox Migration and Cutover Pending.

Repository checkpoint: annotated local tag `inventory-demo-v2-v2.6c-posting-engine`.

## Runtime and Architecture

`ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED` is server-only and defaults to `false`. Every new route
checks it before organization/module context or V2 database access. Existing V2-5 pages, exports,
dashboard queries, adjustments, navigation, and controlled-demo behavior remain on their legacy
paths. No request-time migration or schema introspection was added.

The Inventory module uses SDK context, permissions, tenant DB access, and best-effort events.
The posting engine owns strict decimal arithmetic, normalized SHA-256 request/key hashes,
cryptographically random frozen-format numbers, Serializable transactions with at most three
reviewed conflict retries, balance writes, immutable movements, canonical links, and DTOs that
exclude tenant IDs and hashes.

## Contracts

Receipts accept a destination Warehouse, optional Supplier, and 1–100 positive Product lines.
Issues accept a source Warehouse, optional Customer, and 1–100 positive lines. Transfers require
different source/destination Warehouses and create paired movements. Adjustments accept
`countedQuantity >= 0`, compute the delta on the server, and reject no-ops. Strict schemas reject
unknown fields, duplicate Products, excessive precision, future reference dates beyond UTC+1,
and submitted tenant identity.

Create and reverse require `Idempotency-Key`. Only its SHA-256 hash is stored. A normalized
same-request replay returns the original DTO without movements, balance writes, or events; changed
reuse returns `IDEMPOTENCY_KEY_REUSED`.

Reversal creates a new posted `REV` transaction and inverse movements, marks the original
`REVERSED`, and never edits old movements. Receipt/Issue lines retain the Warehouse and positive
quantity; Transfer swaps header Warehouses; Adjustment derives its reversal counted-final quantity
from the exact linked canonical movement. Missing or inconsistent linkage rejects the operation.

## Permissions, Routes, and Events

The manifest declares exact receipt/issue/transfer/adjustment read/create/reverse permissions and
`inventory.transaction.export`. The current Warehouse Operator profile is unchanged; a separate
future V2 profile declaration is ready for V2-6D.

The eight type-specific GET/POST handlers, unified detail GET, and unified reverse POST live below
`/api/orgs/[orgSlug]/inventory/transactions`. Events are emitted only after commit and are
best-effort: four posted facts, transaction reversed, stock movement created, and stock balance
updated. They are not an Outbox and must not have external durable-delivery consumers.

## Compatibility and Evidence

Pure canonical-to-legacy projection helpers were added for the later cutover. No dual write or
legacy route cutover was introduced. The isolated `inventory:v2:posting:rehearse` command creates a
random, no-volume PostgreSQL container on a loopback dynamic port, applies migrations only there,
seeds two synthetic organizations, exercises posting/replay/rollback/reversal/linkage/tenant and
real concurrency cases, and always removes the container.

The controlled sandbox remains unmigrated and runtime-disabled. No backfill, reset, provisioning,
V2-6D UI/navigation/export/demo cutover, caching, accent, website asset, new module, Durable
Outbox, or Platform Service work is included. V2-6D is ready for explicit Founder/operator
approval but is not authorized. Sandbox migration/backfill/provisioning/runtime enablement and
cutover remain blocked pending that separate authorization.
