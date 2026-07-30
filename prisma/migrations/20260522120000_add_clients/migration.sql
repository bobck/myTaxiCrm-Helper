-- CreateTable
CREATE TABLE "public"."clients" (
    "id" INTEGER NOT NULL,
    "name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" JSONB,
    "notes" TEXT,
    "address" TEXT,
    "supplier" BOOLEAN,
    "juridical" BOOLEAN,
    "conflicted" BOOLEAN,
    "modified_at" BIGINT,
    "created_at" BIGINT,
    "discount_code" TEXT,
    "discount_goods" DOUBLE PRECISION,
    "order_discount_services" DOUBLE PRECISION,
    "sale_discount_services" DOUBLE PRECISION,
    "discount_materials" DOUBLE PRECISION,
    "custom_fields" JSONB,
    "ad_campaign_id" INTEGER,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_modified_at_idx" ON "public"."clients"("modified_at");

-- Seed entity_sync row so the loader can read state without bootstrap branching.
INSERT INTO "public"."entity_sync" ("entity_name", "sync_details", "updated_at")
VALUES ('Client', '{}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("entity_name") DO NOTHING;
