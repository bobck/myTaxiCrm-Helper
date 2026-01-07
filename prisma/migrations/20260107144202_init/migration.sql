-- CreateTable
CREATE TABLE "cashbox_transactions" (
    "id" INTEGER NOT NULL,
    "remonline_cashbox_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "direction" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "created_at" INTEGER NOT NULL,
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
CREATE TABLE "remonline_cashboxes" (
    "id" TEXT NOT NULL,
    "last_transaction_created_at" INTEGER,
    "auto_park_id" TEXT NOT NULL,
    "auto_park_cashbox_id" TEXT NOT NULL,
    "default_contator_id" TEXT NOT NULL,
    "usa_contator_id" TEXT,
    "scooter_contator_id" TEXT,

    CONSTRAINT "remonline_cashboxes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cashbox_transactions" ADD CONSTRAINT "cashbox_transactions_remonline_cashbox_id_fkey" FOREIGN KEY ("remonline_cashbox_id") REFERENCES "remonline_cashboxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbox_transactions" ADD CONSTRAINT "cashbox_transactions_cashflow_item_id_fkey" FOREIGN KEY ("cashflow_item_id") REFERENCES "cashflow_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
