/*
  Warnings:

  - You are about to drop the column `isNew` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isOnSale` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isNew",
DROP COLUMN "isOnSale";
