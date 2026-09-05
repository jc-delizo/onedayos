# Implementation Note — V2-6D UI and Controlled Demo Cutover

Status: Code, Sandbox Migration, Backfill, and Controlled Cutover Gates Complete; Founder Acceptance Pending

V2-6D enables the guarded Inventory V2 transaction surface for the controlled sandbox only. It adds runtime-aware Receipt, Issue, Transfer, and Adjustment navigation; server-mode lists; direct-page and URL-addressable create/detail/reverse views; bounded CSV/XLSX exports; canonical dashboard movement mapping; and a current Process Flow after successful cutover.

The accepted expand-only migration was deployed, then the guarded deterministic backfill created 9 canonical Adjustment transactions, 9 lines, and 9 movement links. A rerun created zero rows. The guarded V2 reset preserved legacy/backfilled history and recreated the canonical Receipt, Transfer, Issue, and Adjustment sequence twice with final Main/Secondary balances of Water `120/10`, Tea `35/5`, and Coffee `5/3`.

Warehouse Operator now has exact V2 read/create and Customer-read permissions; it has no reverse, transaction export, wildcard, Organization-admin, Product Settings update, or shared-record mutation grant.

Runtime is enabled only in the controlled sandbox. Legacy `StockAdjustment` tables, fields, and compatibility routes remain intact. Events remain best effort; no Durable Outbox, caching, accents, website assets, new module, or Platform Service was introduced.

Fast application rollback before Founder acceptance is to set the private runtime flag false, rebuild, and restart. The additive schema and canonical data remain; database restore is reserved for proven corruption and requires explicit operator authorization.
