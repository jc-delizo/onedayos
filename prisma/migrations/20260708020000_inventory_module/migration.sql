-- Inventory Module MVP tables.
-- Product, Warehouse, and Supplier identity remain in shared Business Objects.

CREATE TABLE "inventory_product_extensions" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reorderPoint" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "isStockTracked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "inventory_product_extensions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_balances" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantityDelta" DECIMAL(18,4) NOT NULL,
    "resultingQuantity" DECIMAL(18,4),
    "sourceType" TEXT,
    "sourceId" TEXT,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantityBefore" DECIMAL(18,4) NOT NULL,
    "quantityAfter" DECIMAL(18,4) NOT NULL,
    "quantityDelta" DECIMAL(18,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'posted',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_product_extensions_orgId_productId_key"
    ON "inventory_product_extensions"("orgId", "productId");
CREATE UNIQUE INDEX "inventory_product_extensions_productId_orgId_key"
    ON "inventory_product_extensions"("productId", "orgId");
CREATE INDEX "inventory_product_extensions_orgId_isStockTracked_idx"
    ON "inventory_product_extensions"("orgId", "isStockTracked");
CREATE INDEX "inventory_product_extensions_orgId_deletedAt_idx"
    ON "inventory_product_extensions"("orgId", "deletedAt");

CREATE UNIQUE INDEX "stock_balances_orgId_productId_warehouseId_key"
    ON "stock_balances"("orgId", "productId", "warehouseId");
CREATE INDEX "stock_balances_orgId_warehouseId_idx"
    ON "stock_balances"("orgId", "warehouseId");
CREATE INDEX "stock_balances_orgId_productId_idx"
    ON "stock_balances"("orgId", "productId");

CREATE INDEX "stock_movements_orgId_productId_occurredAt_idx"
    ON "stock_movements"("orgId", "productId", "occurredAt");
CREATE INDEX "stock_movements_orgId_warehouseId_occurredAt_idx"
    ON "stock_movements"("orgId", "warehouseId", "occurredAt");
CREATE INDEX "stock_movements_orgId_sourceType_sourceId_idx"
    ON "stock_movements"("orgId", "sourceType", "sourceId");

CREATE INDEX "stock_adjustments_orgId_productId_createdAt_idx"
    ON "stock_adjustments"("orgId", "productId", "createdAt");
CREATE INDEX "stock_adjustments_orgId_warehouseId_createdAt_idx"
    ON "stock_adjustments"("orgId", "warehouseId", "createdAt");
CREATE INDEX "stock_adjustments_orgId_createdBy_idx"
    ON "stock_adjustments"("orgId", "createdBy");
CREATE INDEX "stock_adjustments_orgId_deletedAt_idx"
    ON "stock_adjustments"("orgId", "deletedAt");

ALTER TABLE "inventory_product_extensions"
    ADD CONSTRAINT "inventory_product_extensions_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_product_extensions"
    ADD CONSTRAINT "inventory_product_extensions_productId_orgId_fkey"
    FOREIGN KEY ("productId", "orgId") REFERENCES "products"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_balances"
    ADD CONSTRAINT "stock_balances_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_balances"
    ADD CONSTRAINT "stock_balances_productId_orgId_fkey"
    FOREIGN KEY ("productId", "orgId") REFERENCES "products"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_balances"
    ADD CONSTRAINT "stock_balances_warehouseId_orgId_fkey"
    FOREIGN KEY ("warehouseId", "orgId") REFERENCES "warehouses"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_productId_orgId_fkey"
    FOREIGN KEY ("productId", "orgId") REFERENCES "products"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_warehouseId_orgId_fkey"
    FOREIGN KEY ("warehouseId", "orgId") REFERENCES "warehouses"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_productId_orgId_fkey"
    FOREIGN KEY ("productId", "orgId") REFERENCES "products"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_warehouseId_orgId_fkey"
    FOREIGN KEY ("warehouseId", "orgId") REFERENCES "warehouses"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_adjustments"
    ADD CONSTRAINT "stock_adjustments_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
