-- CreateTable
CREATE TABLE "public"."branches" (
    "id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "is_archived" BOOLEAN NOT NULL,
    "legal_entity_id" INTEGER,
    "timezone" TEXT,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transfers" (
    "id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "id_label" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "source_warehouse_title" TEXT NOT NULL,
    "target_warehouse_title" TEXT NOT NULL,
    "created_by_fullname" TEXT NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transfer_products" (
    "transfer_id" INTEGER NOT NULL,
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "is_serial" BOOLEAN NOT NULL,
    "code" TEXT,
    "article" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "uom_id" INTEGER,
    "uom_title" TEXT,
    "uom_description" TEXT,

    CONSTRAINT "transfer_products_pkey" PRIMARY KEY ("transfer_id","id")
);

-- CreateIndex
CREATE INDEX "transfers_created_at_idx" ON "public"."transfers"("created_at");

-- CreateIndex
CREATE INDEX "transfers_branch_id_idx" ON "public"."transfers"("branch_id");
