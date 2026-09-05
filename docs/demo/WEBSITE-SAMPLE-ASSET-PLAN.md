# Website Sample Asset Plan

This plan defines what can be captured from the controlled sandbox for future website or sales material. It does not approve public website demo claims.

## Current Portfolio Asset Decision — 2026-09-06

The configured sandbox cannot currently pass its runtime gate because its Supabase endpoint no
longer resolves. Until an approved sandbox passes the gates below, the portfolio may use only a
clearly labeled illustrative Inventory interface with synthetic data. It must not describe that
illustration as a live or controlled-sandbox screenshot.

## Allowed Assets After Gates Pass

- Cropped screenshots of the Apps launcher.
- Cropped screenshots of Inventory Dashboard.
- Cropped screenshots of Inventory Process Flow.
- Cropped screenshots of Stock Levels showing fake demo products.
- Cropped screenshots of Organization app navigation without personal data.

## Required Sanitization

- Do not show passwords, tokens, cookies, service keys, database URLs, or environment values.
- Do not show browser developer tools with headers, payloads, cookies, or tokens.
- Do not show real customer, employee, supplier, warehouse, or product data.
- Use only canonical fake sandbox demo data.
- Keep any demo org/user labels clearly fake.

## Required Captions

Every asset prepared from the sandbox should be captioned as:

`Controlled sandbox demo. Feature scope and production readiness vary by package.`

## Claims Not Allowed

- Public self-service demo approved.
- Production ready.
- Formal WCAG conformance complete.
- Representative-user validation complete.
- Full module marketplace or arbitrary module support.

## Review Before Publication

Before any public website use:

1. Re-run `npm run demo:check`.
2. Re-run `npm run check:all`.
3. Review this plan against the current product state.
4. Obtain explicit Founder approval for website use.
