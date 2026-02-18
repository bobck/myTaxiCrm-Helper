/*
  Warnings:

  - The primary key for the `posting_products` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "posting_products" DROP CONSTRAINT "posting_products_pkey",
ADD COLUMN     "serial_number" TEXT NOT NULL DEFAULT '',
ADD CONSTRAINT "posting_products_pkey" PRIMARY KEY ("id", "posting_id", "serial_number");
