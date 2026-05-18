/*
  Warnings:

  - The primary key for the `transfer_products` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `transfers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `branch_id` to the `transfer_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouse_id` to the `transfer_products` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."transfers_branch_id_idx";

-- AlterTable
ALTER TABLE "public"."transfer_products" DROP CONSTRAINT "transfer_products_pkey",
ADD COLUMN     "branch_id" INTEGER NOT NULL,
ADD COLUMN     "warehouse_id" INTEGER NOT NULL,
ADD CONSTRAINT "transfer_products_pkey" PRIMARY KEY ("branch_id", "warehouse_id", "transfer_id", "id");

-- AlterTable
ALTER TABLE "public"."transfers" DROP CONSTRAINT "transfers_pkey",
ADD CONSTRAINT "transfers_pkey" PRIMARY KEY ("branch_id", "warehouse_id", "id");

-- CreateIndex
CREATE INDEX "transfer_products_transfer_id_idx" ON "public"."transfer_products"("transfer_id");

-- CreateIndex
CREATE INDEX "transfers_id_idx" ON "public"."transfers"("id");
