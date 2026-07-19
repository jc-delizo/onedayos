# Implementation Note: Role-Based UX Validation Preparation

Date: 2026-07-19

This note records Package 8 preparation for structured Founder UX review. It does not claim representative-user validation, formal accessibility conformance, or public website demo approval.

## Scope

Prepared sandbox review for two personas:

- Org Admin: existing demo admin account with Inventory and Organization app access.
- Warehouse User: sandbox-only least-privilege account for Inventory walkthroughs.

## Warehouse Operator Sandbox Role

The `Warehouse Operator` role is demo data created by `scripts/provision-sandbox-demo.ts`. It is not a hardcoded platform role.

Allowed permissions:

- `inventory.dashboard.read`
- `inventory.product_setting.read`
- `inventory.stock_level.read`
- `inventory.stock_movement.read`
- `inventory.stock_adjustment.read`
- `inventory.stock_adjustment.create`
- `objects.product.read`
- `objects.product_category.read`
- `objects.supplier.read`
- `objects.warehouse.read`

Explicitly not granted:

- `inventory.product_setting.update`
- `objects.employee.*`
- `objects.customer.*`
- `kernel.organization.manage`
- wildcard permissions

## Validation Artifacts

Prepared:

- `docs/demo/ROLE-BASED-UX-VALIDATION-GUIDE.md`
- `docs/demo/reviews/FOUNDER-ORG-ADMIN-UX-REVIEW.md`
- `docs/demo/reviews/FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md`
- `docs/demo/reviews/MANUAL-ACCESSIBILITY-REVIEW.md`
- `docs/demo/reviews/UX-FINDINGS-LOG.md`

## Guardrails

- The provisioner remains sandbox-gated by `ONEDAYOS_SANDBOX_DB_APPROVED=true`.
- Warehouse credentials are read from `.env.local` and must not be committed or printed.
- The Warehouse Operator profile is repaired idempotently on provisioning.
- Stale extra permissions on the Warehouse Operator demo role are removed back to the approved profile.
- CI checks must not require real sandbox credentials.

## Pending Human Work

- Founder Org Admin walkthrough.
- Founder Warehouse proxy walkthrough.
- Manual accessibility checklist.
- Representative-user validation by actual operational users.
- Formal accessibility review if a formal claim is needed.
- Public website demo approval.
