-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "branchId" TEXT,
    "departmentId" TEXT,
    "position" TEXT,
    "employmentType" TEXT,
    "employmentStatus" TEXT NOT NULL DEFAULT 'active',
    "hiredAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "categoryId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "branchId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_orgId_name_idx" ON "employees"("orgId", "name");

-- CreateIndex
CREATE INDEX "employees_orgId_branchId_idx" ON "employees"("orgId", "branchId");

-- CreateIndex
CREATE INDEX "employees_orgId_departmentId_idx" ON "employees"("orgId", "departmentId");

-- CreateIndex
CREATE INDEX "employees_orgId_employmentStatus_idx" ON "employees"("orgId", "employmentStatus");

-- CreateIndex
CREATE INDEX "employees_orgId_deletedAt_idx" ON "employees"("orgId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "employees_orgId_employeeNo_key" ON "employees"("orgId", "employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "employees_id_orgId_key" ON "employees"("id", "orgId");

-- CreateIndex
CREATE INDEX "product_categories_orgId_parentId_idx" ON "product_categories"("orgId", "parentId");

-- CreateIndex
CREATE INDEX "product_categories_orgId_deletedAt_idx" ON "product_categories"("orgId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_orgId_name_key" ON "product_categories"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_id_orgId_key" ON "product_categories"("id", "orgId");

-- CreateIndex
CREATE INDEX "products_orgId_name_idx" ON "products"("orgId", "name");

-- CreateIndex
CREATE INDEX "products_orgId_categoryId_idx" ON "products"("orgId", "categoryId");

-- CreateIndex
CREATE INDEX "products_orgId_isActive_idx" ON "products"("orgId", "isActive");

-- CreateIndex
CREATE INDEX "products_orgId_deletedAt_idx" ON "products"("orgId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "products_orgId_code_key" ON "products"("orgId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "products_id_orgId_key" ON "products"("id", "orgId");

-- CreateIndex
CREATE INDEX "customers_orgId_name_idx" ON "customers"("orgId", "name");

-- CreateIndex
CREATE INDEX "customers_orgId_email_idx" ON "customers"("orgId", "email");

-- CreateIndex
CREATE INDEX "customers_orgId_phone_idx" ON "customers"("orgId", "phone");

-- CreateIndex
CREATE INDEX "customers_orgId_deletedAt_idx" ON "customers"("orgId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "customers_id_orgId_key" ON "customers"("id", "orgId");

-- CreateIndex
CREATE INDEX "suppliers_orgId_name_idx" ON "suppliers"("orgId", "name");

-- CreateIndex
CREATE INDEX "suppliers_orgId_email_idx" ON "suppliers"("orgId", "email");

-- CreateIndex
CREATE INDEX "suppliers_orgId_phone_idx" ON "suppliers"("orgId", "phone");

-- CreateIndex
CREATE INDEX "suppliers_orgId_deletedAt_idx" ON "suppliers"("orgId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_id_orgId_key" ON "suppliers"("id", "orgId");

-- CreateIndex
CREATE INDEX "warehouses_orgId_name_idx" ON "warehouses"("orgId", "name");

-- CreateIndex
CREATE INDEX "warehouses_orgId_branchId_idx" ON "warehouses"("orgId", "branchId");

-- CreateIndex
CREATE INDEX "warehouses_orgId_isActive_idx" ON "warehouses"("orgId", "isActive");

-- CreateIndex
CREATE INDEX "warehouses_orgId_deletedAt_idx" ON "warehouses"("orgId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_orgId_code_key" ON "warehouses"("orgId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_id_orgId_key" ON "warehouses"("id", "orgId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
