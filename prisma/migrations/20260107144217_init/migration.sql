/*
  Warnings:

  - You are about to drop the `cashbox_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cashflow_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `remonline_cashboxes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cashbox_transactions" DROP CONSTRAINT "cashbox_transactions_cashflow_item_id_fkey";

-- DropForeignKey
ALTER TABLE "cashbox_transactions" DROP CONSTRAINT "cashbox_transactions_remonline_cashbox_id_fkey";

-- DropTable
DROP TABLE "cashbox_transactions";

-- DropTable
DROP TABLE "cashflow_items";

-- DropTable
DROP TABLE "remonline_cashboxes";

-- CreateTable
CREATE TABLE "Deal" (
    "id" INTEGER NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);
