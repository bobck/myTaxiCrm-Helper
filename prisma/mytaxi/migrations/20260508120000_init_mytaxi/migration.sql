-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."cars" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cars_status_idx" ON "public"."cars"("status");

-- CreateIndex
CREATE INDEX "cars_license_plate_idx" ON "public"."cars"("license_plate");

-- CreateTable
CREATE TABLE "public"."car_status_log" (
    "id" BIGSERIAL NOT NULL,
    "car_id" TEXT NOT NULL,
    "prev_status" TEXT,
    "next_status" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "car_status_log_car_id_changed_at_idx" ON "public"."car_status_log"("car_id", "changed_at");

-- CreateIndex
CREATE INDEX "car_status_log_changed_at_idx" ON "public"."car_status_log"("changed_at");
