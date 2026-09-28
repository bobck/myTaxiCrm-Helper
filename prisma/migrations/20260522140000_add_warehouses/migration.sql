-- CreateTable
CREATE TABLE "public"."warehouses" (
    "id" INTEGER NOT NULL,
    "title" TEXT,
    "is_global" BOOLEAN,
    "type" TEXT,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warehouse_cells" (
    "id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "code" TEXT,
    "is_default" BOOLEAN,
    "title" TEXT,

    CONSTRAINT "warehouse_cells_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warehouse_cells_warehouse_id_idx" ON "public"."warehouse_cells"("warehouse_id");
