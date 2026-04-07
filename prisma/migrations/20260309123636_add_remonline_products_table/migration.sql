-- DropForeignKey
ALTER TABLE "private_api"."posting_products" DROP CONSTRAINT "posting_products_posting_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."posting_products" DROP CONSTRAINT "posting_products_posting_id_fkey";

-- CreateTable
CREATE TABLE "public"."products" (
    "id" INTEGER NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "is_serial" BOOLEAN NOT NULL DEFAULT false,
    "article" TEXT,
    "description" TEXT,
    "is_enable_expiration_tracking" BOOLEAN,
    "is_expiration_tracking_enabled" BOOLEAN,
    "is_expiring_soon_alert_enabled" BOOLEAN,
    "is_critical_alert_enabled" BOOLEAN,
    "default_supplier_id" INTEGER,
    "category_id" INTEGER,
    "category_title" TEXT,
    "uom_id" INTEGER,
    "warranty" INTEGER,
    "warranty_period" INTEGER,
    "prices" JSONB,
    "images" JSONB,
    "custom_fields" JSONB,
    "is_dimensions_weight_enabled" BOOLEAN,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
