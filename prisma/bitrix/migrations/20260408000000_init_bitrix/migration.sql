-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."insurance_invoices" (
    "id" INTEGER NOT NULL,
    "payment_date" DATE,
    "created_at" DATE,
    "sum" DOUBLE PRECISION,
    "auto_park_id" TEXT,
    "auto_park_name" TEXT,
    "license_plate" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sync_metadata" (
    "entity_name" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_metadata_pkey" PRIMARY KEY ("entity_name")
);
