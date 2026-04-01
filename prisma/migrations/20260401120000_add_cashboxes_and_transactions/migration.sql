-- CreateTable
CREATE TABLE "public"."cashboxes" (
    "id" INTEGER NOT NULL,
    "title" TEXT,
    "type" INTEGER,
    "currency_name" TEXT,
    "currency_code" TEXT,
    "balance" DOUBLE PRECISION,
    "is_global" BOOLEAN,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_transaction_created_at" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cashbox_transactions" (
    "id" INTEGER NOT NULL,
    "cashbox_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "direction" INTEGER NOT NULL,
    "employee_id" INTEGER,
    "created_at" BIGINT NOT NULL,
    "description" TEXT,
    "client_id" INTEGER,
    "related_document_id" INTEGER,
    "related_document_type" INTEGER,
    "cashflow_item_id" INTEGER,
    "cashflow_item_name" TEXT,
    "cashflow_item_direction" INTEGER,

    CONSTRAINT "cashbox_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cashbox_transactions_cashbox_id_created_at_idx" ON "public"."cashbox_transactions"("cashbox_id", "created_at");
