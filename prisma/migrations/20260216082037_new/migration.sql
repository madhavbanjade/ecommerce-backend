/*
  Warnings:

  - The primary key for the `ProductSize` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ProductSize` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[product_name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "images" TEXT[];

-- AlterTable
ALTER TABLE "ProductSize" DROP CONSTRAINT "ProductSize_pkey",
DROP COLUMN "id";

-- CreateIndex
CREATE UNIQUE INDEX "Product_product_name_key" ON "Product"("product_name");
