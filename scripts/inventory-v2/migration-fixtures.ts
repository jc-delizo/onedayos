export const LEGACY_FIXTURE_SQL = String.raw`
INSERT INTO "organizations" ("id","name","slug","updatedAt") VALUES
('org-a','Synthetic A','synthetic-a',CURRENT_TIMESTAMP),
('org-b','Synthetic B','synthetic-b',CURRENT_TIMESTAMP);
INSERT INTO "users" ("id","orgId","name","email","updatedAt") VALUES
('user-a','org-a','Actor A','actor-a@example.invalid',CURRENT_TIMESTAMP),
('user-b','org-b','Actor B','actor-b@example.invalid',CURRENT_TIMESTAMP);
INSERT INTO "products" ("id","orgId","code","name","unit","updatedAt") VALUES
('product-a','org-a','A-1','Product A','pcs',CURRENT_TIMESTAMP),
('product-b','org-b','B-1','Product B','kg',CURRENT_TIMESTAMP);
INSERT INTO "warehouses" ("id","orgId","code","name","updatedAt") VALUES
('warehouse-a','org-a','A-1','Warehouse A',CURRENT_TIMESTAMP),
('warehouse-a2','org-a','A-2','Warehouse A2',CURRENT_TIMESTAMP),
('warehouse-b','org-b','B-1','Warehouse B',CURRENT_TIMESTAMP),
('warehouse-b2','org-b','B-2','Warehouse B2',CURRENT_TIMESTAMP);
INSERT INTO "inventory_product_extensions" ("id","orgId","productId","updatedAt") VALUES
('extension-a','org-a','product-a',CURRENT_TIMESTAMP),
('extension-b','org-b','product-b',CURRENT_TIMESTAMP);
INSERT INTO "stock_balances" ("id","orgId","productId","warehouseId","quantity","updatedAt") VALUES
('balance-a','org-a','product-a','warehouse-a',7,CURRENT_TIMESTAMP),
('balance-b','org-b','product-b','warehouse-b',0,CURRENT_TIMESTAMP);
INSERT INTO "stock_adjustments"
("id","orgId","productId","warehouseId","quantityBefore","quantityAfter","quantityDelta","reason","status","createdBy","createdAt","updatedAt") VALUES
('adjust-a-1','org-a','product-a','warehouse-a',0,10,10,'opening','posted','user-a','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
('adjust-a-2','org-a','product-a','warehouse-a',10,7,-3,'count','posted','user-a','2026-01-02T00:00:00Z','2026-01-02T00:00:00Z'),
('adjust-b-1','org-b','product-b','warehouse-b',0,5,5,'opening','posted','user-b','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
('adjust-b-2','org-b','product-b','warehouse-b',5,0,-5,'count','posted','user-b','2026-01-02T00:00:00Z','2026-01-02T00:00:00Z');
INSERT INTO "stock_movements"
("id","orgId","productId","warehouseId","type","quantityDelta","resultingQuantity","sourceType","sourceId","occurredAt","createdBy","createdAt") VALUES
('movement-a-1','org-a','product-a','warehouse-a','opening_balance',10,10,'stock_adjustment','adjust-a-1','2026-01-01T00:00:01Z','user-a','2026-01-01T00:00:01Z'),
('movement-a-2','org-a','product-a','warehouse-a','adjustment_out',-3,7,'stock_adjustment','adjust-a-2','2026-01-02T00:00:01Z','user-a','2026-01-02T00:00:01Z'),
('movement-b-1','org-b','product-b','warehouse-b','opening_balance',5,5,'stock_adjustment','adjust-b-1','2026-01-01T00:00:01Z','user-b','2026-01-01T00:00:01Z'),
('movement-b-2','org-b','product-b','warehouse-b','adjustment_out',-5,0,'stock_adjustment','adjust-b-2','2026-01-02T00:00:01Z','user-b','2026-01-02T00:00:01Z');
`

export const LEGACY_COUNTS_SQL = String.raw`
SELECT concat(
  (SELECT count(*) FROM "organizations"), ':',
  (SELECT count(*) FROM "products"), ':',
  (SELECT count(*) FROM "warehouses"), ':',
  (SELECT count(*) FROM "stock_adjustments"), ':',
  (SELECT count(*) FROM "stock_movements"), ':',
  (SELECT count(*) FROM "stock_balances")
);
`

export const VALID_FOUNDATION_SQL = String.raw`
INSERT INTO "inventory_transactions"
("id","orgId","type","transactionNumber","warehouseId","sourceWarehouseId","destinationWarehouseId","postedByUserId","updatedAt") VALUES
('tx-receipt','org-a','RECEIPT','REC-2026-0000000000000001','warehouse-a',NULL,NULL,'user-a',CURRENT_TIMESTAMP),
('tx-issue','org-a','ISSUE','ISS-2026-0000000000000001','warehouse-a',NULL,NULL,'user-a',CURRENT_TIMESTAMP),
('tx-transfer','org-a','TRANSFER','TRF-2026-0000000000000001',NULL,'warehouse-a','warehouse-a2','user-a',CURRENT_TIMESTAMP),
('tx-adjustment','org-a','ADJUSTMENT','ADJ-2026-0000000000000001','warehouse-a',NULL,NULL,'user-a',CURRENT_TIMESTAMP);
INSERT INTO "inventory_transaction_lines"
("id","orgId","transactionId","productId","quantity","unit","lineNumber","updatedAt") VALUES
('line-receipt','org-a','tx-receipt','product-a',1,'pcs',1,CURRENT_TIMESTAMP);
`
