-- CreateTable
CREATE TABLE "cashbox_transactions" (
    "id" INTEGER NOT NULL,
    "cashbox_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "direction" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "created_at" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "client_id" INTEGER,
    "related_document_id" INTEGER,
    "related_document_type" INTEGER,
    "cashflow_item_id" INTEGER,

    CONSTRAINT "cashbox_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashflow_items" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "direction" INTEGER NOT NULL,

    CONSTRAINT "cashflow_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashboxes" (
    "id" INTEGER NOT NULL,
    "title" TEXT,
    "type" INTEGER,
    "balance" DOUBLE PRECISION,
    "is_global" BOOLEAN,
    "currency" TEXT,

    CONSTRAINT "cashboxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cashbox_transactions_cashbox_id_created_at_idx" ON "cashbox_transactions"("cashbox_id", "created_at");

-- AddForeignKey
ALTER TABLE "cashbox_transactions" ADD CONSTRAINT "cashbox_transactions_cashbox_id_fkey" FOREIGN KEY ("cashbox_id") REFERENCES "cashboxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbox_transactions" ADD CONSTRAINT "cashbox_transactions_cashflow_item_id_fkey" FOREIGN KEY ("cashflow_item_id") REFERENCES "cashflow_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
