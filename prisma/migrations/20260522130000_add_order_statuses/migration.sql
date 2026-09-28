-- CreateTable
CREATE TABLE "public"."order_statuses" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "group_type" INTEGER,
    "group_name" TEXT,

    CONSTRAINT "order_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_status_id_idx" ON "public"."orders"("status_id");
