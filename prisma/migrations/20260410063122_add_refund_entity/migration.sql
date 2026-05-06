-- CreateTable
CREATE TABLE "public"."refunds" (
    "id" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "client_id" INTEGER,
    "client_name" TEXT,
    "comment" TEXT,
    "related_document_id" INTEGER,
    "related_document_type" TEXT,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);
