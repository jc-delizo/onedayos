-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "InventoryTransactionStatus" AS ENUM ('POSTED', 'REVERSED');

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "inventoryTransactionId" TEXT,
ADD COLUMN     "inventoryTransactionLineId" TEXT;

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "status" "InventoryTransactionStatus" NOT NULL DEFAULT 'POSTED',
    "transactionNumber" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "referenceDate" DATE,
    "supplierId" TEXT,
    "customerId" TEXT,
    "warehouseId" TEXT,
    "sourceWarehouseId" TEXT,
    "destinationWarehouseId" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedByUserId" TEXT NOT NULL,
    "reversalOfTransactionId" TEXT,
    "idempotencyKeyHash" TEXT,
    "requestHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transaction_lines" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_transaction_lines_pkey" PRIMARY KEY ("id")
);

-- Expand-contract checks for invariants Prisma cannot express.
ALTER TABLE "inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_number_format_check"
    CHECK (
        ("reversalOfTransactionId" IS NULL AND (
            ("type" = 'RECEIPT' AND "transactionNumber" ~ '^REC-[0-9]{4}-[0-9A-F]{16}$') OR
            ("type" = 'ISSUE' AND "transactionNumber" ~ '^ISS-[0-9]{4}-[0-9A-F]{16}$') OR
            ("type" = 'TRANSFER' AND "transactionNumber" ~ '^TRF-[0-9]{4}-[0-9A-F]{16}$') OR
            ("type" = 'ADJUSTMENT' AND "transactionNumber" ~ '^ADJ-[0-9]{4}-[0-9A-F]{16}$')
        )) OR
        ("reversalOfTransactionId" IS NOT NULL AND "transactionNumber" ~ '^REV-[0-9]{4}-[0-9A-F]{16}$')
    );

ALTER TABLE "inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_warehouse_party_shape_check"
    CHECK (
        ("type" = 'RECEIPT' AND "warehouseId" IS NOT NULL AND "sourceWarehouseId" IS NULL AND "destinationWarehouseId" IS NULL AND "customerId" IS NULL) OR
        ("type" = 'ISSUE' AND "warehouseId" IS NOT NULL AND "sourceWarehouseId" IS NULL AND "destinationWarehouseId" IS NULL AND "supplierId" IS NULL) OR
        ("type" = 'TRANSFER' AND "warehouseId" IS NULL AND "sourceWarehouseId" IS NOT NULL AND "destinationWarehouseId" IS NOT NULL AND "supplierId" IS NULL AND "customerId" IS NULL) OR
        ("type" = 'ADJUSTMENT' AND "warehouseId" IS NOT NULL AND "sourceWarehouseId" IS NULL AND "destinationWarehouseId" IS NULL AND "supplierId" IS NULL AND "customerId" IS NULL)
    );

ALTER TABLE "inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_distinct_transfer_warehouses_check"
    CHECK ("sourceWarehouseId" IS NULL OR "destinationWarehouseId" IS NULL OR "sourceWarehouseId" <> "destinationWarehouseId");

ALTER TABLE "inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_not_self_reversal_check"
    CHECK ("reversalOfTransactionId" IS NULL OR "reversalOfTransactionId" <> "id");

ALTER TABLE "inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_reversal_contract_check"
    CHECK (
        "reversalOfTransactionId" IS NULL OR
        ("status" = 'POSTED' AND "reason" IS NOT NULL AND btrim("reason") <> '')
    );

ALTER TABLE "inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_idempotency_pair_check"
    CHECK (
        ("idempotencyKeyHash" IS NULL AND "requestHash" IS NULL) OR
        ("idempotencyKeyHash" IS NOT NULL AND btrim("idempotencyKeyHash") <> '' AND "requestHash" IS NOT NULL AND btrim("requestHash") <> '')
    );

ALTER TABLE "inventory_transaction_lines"
    ADD CONSTRAINT "inventory_transaction_lines_unit_nonempty_check"
    CHECK (btrim("unit") <> ''),
    ADD CONSTRAINT "inventory_transaction_lines_line_number_positive_check"
    CHECK ("lineNumber" > 0),
    ADD CONSTRAINT "inventory_transaction_lines_quantity_nonnegative_check"
    CHECK ("quantity" >= 0);

ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_inventory_link_pair_check"
    CHECK (
        ("inventoryTransactionId" IS NULL AND "inventoryTransactionLineId" IS NULL) OR
        ("inventoryTransactionId" IS NOT NULL AND "inventoryTransactionLineId" IS NOT NULL)
    );

-- CreateIndex
CREATE INDEX "inventory_transactions_orgId_type_status_referenceDate_idx" ON "inventory_transactions"("orgId", "type", "status", "referenceDate");

-- CreateIndex
CREATE INDEX "inventory_transactions_orgId_warehouseId_referenceDate_idx" ON "inventory_transactions"("orgId", "warehouseId", "referenceDate");

-- CreateIndex
CREATE INDEX "inventory_transactions_orgId_sourceWarehouseId_referenceDat_idx" ON "inventory_transactions"("orgId", "sourceWarehouseId", "referenceDate");

-- CreateIndex
CREATE INDEX "inventory_transactions_orgId_destinationWarehouseId_referen_idx" ON "inventory_transactions"("orgId", "destinationWarehouseId", "referenceDate");

-- CreateIndex
CREATE INDEX "inventory_transactions_orgId_supplierId_referenceDate_idx" ON "inventory_transactions"("orgId", "supplierId", "referenceDate");

-- CreateIndex
CREATE INDEX "inventory_transactions_orgId_customerId_referenceDate_idx" ON "inventory_transactions"("orgId", "customerId", "referenceDate");

-- CreateIndex
CREATE INDEX "inventory_transactions_orgId_postedAt_idx" ON "inventory_transactions"("orgId", "postedAt");

-- CreateIndex
CREATE INDEX "inventory_transactions_orgId_postedByUserId_postedAt_idx" ON "inventory_transactions"("orgId", "postedByUserId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transactions_id_orgId_key" ON "inventory_transactions"("id", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transactions_orgId_transactionNumber_key" ON "inventory_transactions"("orgId", "transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transactions_orgId_idempotencyKeyHash_key" ON "inventory_transactions"("orgId", "idempotencyKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transactions_reversalOfTransactionId_orgId_key" ON "inventory_transactions"("reversalOfTransactionId", "orgId");

-- CreateIndex
CREATE INDEX "inventory_transaction_lines_orgId_productId_idx" ON "inventory_transaction_lines"("orgId", "productId");

-- CreateIndex
CREATE INDEX "inventory_transaction_lines_orgId_transactionId_idx" ON "inventory_transaction_lines"("orgId", "transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transaction_lines_id_orgId_key" ON "inventory_transaction_lines"("id", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transaction_lines_id_transactionId_orgId_key" ON "inventory_transaction_lines"("id", "transactionId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transaction_lines_orgId_transactionId_lineNumber_key" ON "inventory_transaction_lines"("orgId", "transactionId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_orgId_key" ON "users"("id", "orgId");

-- CreateIndex
CREATE INDEX "stock_movements_orgId_inventoryTransactionId_idx" ON "stock_movements"("orgId", "inventoryTransactionId");

-- CreateIndex
CREATE INDEX "stock_movements_orgId_inventoryTransactionLineId_idx" ON "stock_movements"("orgId", "inventoryTransactionLineId");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventoryTransactionId_orgId_fkey" FOREIGN KEY ("inventoryTransactionId", "orgId") REFERENCES "inventory_transactions"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventoryTransactionLineId_inventoryTransa_fkey" FOREIGN KEY ("inventoryTransactionLineId", "inventoryTransactionId", "orgId") REFERENCES "inventory_transaction_lines"("id", "transactionId", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_supplierId_orgId_fkey" FOREIGN KEY ("supplierId", "orgId") REFERENCES "suppliers"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_customerId_orgId_fkey" FOREIGN KEY ("customerId", "orgId") REFERENCES "customers"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_warehouseId_orgId_fkey" FOREIGN KEY ("warehouseId", "orgId") REFERENCES "warehouses"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_sourceWarehouseId_orgId_fkey" FOREIGN KEY ("sourceWarehouseId", "orgId") REFERENCES "warehouses"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_destinationWarehouseId_orgId_fkey" FOREIGN KEY ("destinationWarehouseId", "orgId") REFERENCES "warehouses"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_postedByUserId_orgId_fkey" FOREIGN KEY ("postedByUserId", "orgId") REFERENCES "users"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_reversalOfTransactionId_orgId_fkey" FOREIGN KEY ("reversalOfTransactionId", "orgId") REFERENCES "inventory_transactions"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction_lines" ADD CONSTRAINT "inventory_transaction_lines_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction_lines" ADD CONSTRAINT "inventory_transaction_lines_transactionId_orgId_fkey" FOREIGN KEY ("transactionId", "orgId") REFERENCES "inventory_transactions"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction_lines" ADD CONSTRAINT "inventory_transaction_lines_productId_orgId_fkey" FOREIGN KEY ("productId", "orgId") REFERENCES "products"("id", "orgId") ON DELETE RESTRICT ON UPDATE CASCADE;
