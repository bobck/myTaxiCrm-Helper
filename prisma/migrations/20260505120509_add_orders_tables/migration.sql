-- CreateTable
CREATE TABLE "public"."orders" (
    "id" INTEGER NOT NULL,
    "modified_at" BIGINT NOT NULL,
    "uuid" TEXT,
    "created_at" BIGINT NOT NULL,
    "done_at" BIGINT,
    "scheduled_for" BIGINT,
    "duration" INTEGER,
    "kindof_good" TEXT,
    "serial" TEXT,
    "packagelist" TEXT,
    "appearance" TEXT,
    "malfunction" TEXT,
    "manager_notes" TEXT,
    "engineer_notes" TEXT,
    "resume" TEXT,
    "payed" DOUBLE PRECISION,
    "missed_payments" INTEGER,
    "warranty_measures" INTEGER,
    "warranty_date" BIGINT,
    "urgent" BOOLEAN,
    "discount_sum" DOUBLE PRECISION,
    "custom_fields" TEXT,
    "estimated_cost" TEXT,
    "closed_at" BIGINT,
    "estimated_done_at" BIGINT,
    "id_label" TEXT,
    "price" DOUBLE PRECISION,
    "branch_id" INTEGER,
    "overdue" BOOLEAN,
    "status_overdue" BOOLEAN,
    "manager_id" INTEGER,
    "engineer_id" INTEGER,
    "created_by_id" INTEGER,
    "closed_by_id" INTEGER,
    "brand" TEXT,
    "model" TEXT,
    "client_id" INTEGER,
    "client_name" TEXT,
    "asset_id" INTEGER,
    "asset_uid" TEXT,
    "order_type_id" INTEGER,
    "status_id" INTEGER,
    "ad_campaign_id" INTEGER,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders_parts" (
    "order_id" INTEGER NOT NULL,
    "id" INTEGER NOT NULL,
    "entity_id" INTEGER,
    "engineer_id" INTEGER,
    "title" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "discount_value" DOUBLE PRECISION,
    "code" TEXT,
    "article" TEXT,
    "warranty" INTEGER,
    "warranty_period" INTEGER,
    "uom_id" INTEGER,

    CONSTRAINT "orders_parts_pkey" PRIMARY KEY ("order_id","id")
);

-- CreateTable
CREATE TABLE "public"."orders_operations" (
    "order_id" INTEGER NOT NULL,
    "id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "engineer_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "discount_value" DOUBLE PRECISION NOT NULL,
    "warranty" INTEGER NOT NULL,
    "warranty_period" INTEGER NOT NULL,
    "uom_id" INTEGER NOT NULL,

    CONSTRAINT "orders_operations_pkey" PRIMARY KEY ("order_id","id")
);

-- CreateTable
CREATE TABLE "public"."orders_attachments" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "created_at" BIGINT NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "orders_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders_resources" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "orders_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders_to_resources" (
    "resource_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,

    CONSTRAINT "orders_to_resources_pkey" PRIMARY KEY ("resource_id","order_id")
);

-- CreateIndex
CREATE INDEX "orders_modified_at_idx" ON "public"."orders"("modified_at");

-- CreateIndex
CREATE INDEX "orders_attachments_order_id_idx" ON "public"."orders_attachments"("order_id");
