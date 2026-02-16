-- CreateTable
CREATE TABLE "postings" (
    "id" INTEGER NOT NULL,
    "id_label" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "description" TEXT,
    "document_number" TEXT,

    CONSTRAINT "postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_products" (
    "id" INTEGER NOT NULL,
    "posting_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "uom_id" INTEGER NOT NULL,
    "code" TEXT,
    "article" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "is_serial" BOOLEAN NOT NULL,
    "sernums" JSONB,

    CONSTRAINT "posting_products_pkey" PRIMARY KEY ("id","posting_id")
);

-- AddForeignKey
ALTER TABLE "posting_products" ADD CONSTRAINT "posting_products_posting_id_fkey" FOREIGN KEY ("posting_id") REFERENCES "postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
