-- CreateTable
CREATE TABLE "postings" (
    "id" INTEGER NOT NULL,
    "id_label" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "description" TEXT,
    "document_number" TEXT,

    CONSTRAINT "postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_products" (
    "id" INTEGER NOT NULL,
    "posting_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "uom_id" INTEGER NOT NULL,
    "code" TEXT,
    "article" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "is_serial" BOOLEAN NOT NULL,
    "sernums" JSONB,

    CONSTRAINT "posting_products_pkey" PRIMARY KEY ("id","posting_id")
);

-- CreateTable
CREATE TABLE "private_api_warehouse_cells_to_posting_products" (
    "posting_id" INTEGER NOT NULL,
    "posting_item_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "cell_id" INTEGER NOT NULL,
    "cell_title" TEXT,
    "warehouse_id" INTEGER,
    "code" TEXT,
    "article" TEXT,
    "title" TEXT,
    "uom_id" INTEGER,
    "quantity" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "total_cost" DOUBLE PRECISION,
    "sn_accounting" BOOLEAN,
    "sernums_json" TEXT,
    "warranty" INTEGER,
    "warranty_period" INTEGER,
    "is_custom_taxes" BOOLEAN,
    "taxes_json" TEXT,
    "is_enable_expiration_tracking" BOOLEAN,
    "is_expiring_soon_alert_enabled" BOOLEAN,
    "is_critical_alert_enabled" BOOLEAN,
    "expiring_soon_alert_value" INTEGER,
    "critical_alert_value" INTEGER,
    "expiring_soon_alert_unit" INTEGER,
    "critical_alert_unit" INTEGER,

    CONSTRAINT "private_api_warehouse_cells_to_posting_products_pkey" PRIMARY KEY ("posting_id","posting_item_id")
);

-- AddForeignKey
ALTER TABLE "posting_products" ADD CONSTRAINT "posting_products_posting_id_fkey" FOREIGN KEY ("posting_id") REFERENCES "postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
