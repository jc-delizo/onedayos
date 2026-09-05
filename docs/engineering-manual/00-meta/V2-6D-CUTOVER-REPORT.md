# V2-6D Controlled Sandbox Cutover Report

## Status

Code, Sandbox Migration, Backfill, and Controlled Cutover Gates Complete

Founder Acceptance Pending

## Backup

- Path: `/tmp/onedayos-v2-6d-precutover-20260725T121654Z-pg17.dump`
- SHA-256: `7291d85d3e8a9ad001df047a0de7c65ff83fc2e9127783af6844b7d5c1b8ae63`
- Verification: PostgreSQL 17 `pg_restore --list`
- Mode: `0600`

Manual restore is intentionally not executed:

```bash
pg_restore --clean --if-exists --dbname="$DIRECT_URL" /tmp/onedayos-v2-6d-precutover-20260725T121654Z-pg17.dump
```

## Cutover Result

- Accepted expand-only migration `20260725000000_inventory_v2_transaction_foundation` applied successfully.
- Guarded backfill: 9 valid, 0 invalid, 0 warnings; 9 transaction/line/movement links written.
- Idempotent rerun: 0 inserts, 9 already matching links.
- Warehouse Operator provisioned with the exact 19-permission V2 profile.
- Secondary Warehouse and Demo Customer created/repaired.
- Guarded reset run twice; each result contains exactly four canonical V2 demo transactions and six balances.
- Final totals: Water 130, Tea 40, Coffee 8; Coffee remains low stock.
- Runtime enabled only after the preceding checks passed; latest `next start` runs on port 1320.

## Rollback

Before Founder acceptance, disable the private V2 runtime flag, rebuild, and restart. This restores the V2-5 UI while preserving additive schema/data. Do not automatically restore the database; use the verified backup only after explicit operator authorization for proven integrity damage.

## Boundary

Legacy `StockAdjustment` structures remain. Event delivery is best effort. Public self-service demo approval, production readiness, website asset work, V2-7, and V2-8 remain blocked.
