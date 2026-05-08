-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."car_event_type" AS ENUM ('BUSY_WITH_PRIVATE_TRADER', 'RENTAL', 'ON_SERVICE_STATION', 'BUSY_WITH_CREW', 'ROAD_ACCIDENT', 'OTHER', 'AUTO_POUND');

-- CreateTable
CREATE TABLE "public"."cars" (
    "id" TEXT NOT NULL,
    "status" "public"."car_event_type" NOT NULL,
    "license_plate" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."car_status_log" (
    "id" BIGSERIAL NOT NULL,
    "car_id" TEXT NOT NULL,
    "prev_status" "public"."car_event_type",
    "next_status" "public"."car_event_type" NOT NULL,
    "is_manager_notified" BOOLEAN NOT NULL DEFAULT false,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cars_status_idx" ON "public"."cars"("status");

-- CreateIndex
CREATE INDEX "cars_license_plate_idx" ON "public"."cars"("license_plate");

-- CreateIndex
CREATE INDEX "car_status_log_car_id_changed_at_idx" ON "public"."car_status_log"("car_id", "changed_at");

-- CreateIndex
CREATE INDEX "car_status_log_changed_at_idx" ON "public"."car_status_log"("changed_at");

