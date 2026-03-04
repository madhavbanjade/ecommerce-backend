/*
  Warnings:

  - You are about to drop the column `badge` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `brands` on the `Product` table. All the data in the column will be lost.
  - Added the required column `category` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "badge",
DROP COLUMN "brands",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isOnSale" BOOLEAN NOT NULL DEFAULT true;
