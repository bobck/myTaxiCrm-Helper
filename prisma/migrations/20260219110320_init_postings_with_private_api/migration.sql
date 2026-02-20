-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "private_api";

-- CreateTable
CREATE TABLE "private_api"."posting_products" (
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
    "serial_number" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "posting_products_pkey" PRIMARY KEY ("posting_id","posting_item_id","serial_number")
);

-- AddForeignKey
ALTER TABLE "private_api"."posting_products" ADD CONSTRAINT "posting_products_posting_id_fkey" FOREIGN KEY ("posting_id") REFERENCES "public"."postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
