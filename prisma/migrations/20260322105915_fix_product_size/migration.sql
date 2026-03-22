/*
  Warnings:

  - The primary key for the `ProductSize` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id,size]` on the table `ProductSize` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `ProductSize` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "ProductSize" DROP CONSTRAINT "ProductSize_productId_fkey";

-- DropIndex
DROP INDEX "ProductSize_productId_size_key";

-- AlterTable
ALTER TABLE "ProductSize" DROP CONSTRAINT "ProductSize_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSize_id_size_key" ON "ProductSize"("id", "size");

-- AddForeignKey
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_id_fkey" FOREIGN KEY ("id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
