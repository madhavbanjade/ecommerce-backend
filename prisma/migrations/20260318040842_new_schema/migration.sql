/*
  Warnings:

  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `discount_percentage` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `discounted_price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `is_avilable` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `original_price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `product_description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `product_name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock_quantity` on the `ProductSize` table. All the data in the column will be lost.
  - You are about to drop the `FAQ` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalPrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Made the column `tag` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `stockQuantity` to the `ProductSize` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Unisex');

-- DropIndex
DROP INDEX "Product_product_name_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
DROP COLUMN "discount_percentage",
DROP COLUMN "discounted_price",
DROP COLUMN "is_avilable",
DROP COLUMN "original_price",
DROP COLUMN "product_description",
DROP COLUMN "product_name",
DROP COLUMN "quantity",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "dicountPrice" DOUBLE PRECISION,
ADD COLUMN     "discountPercent" DOUBLE PRECISION,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "isAvilable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "originalPrice" INTEGER NOT NULL,
ALTER COLUMN "tag" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductSize" DROP COLUMN "stock_quantity",
ADD COLUMN     "stockQuantity" INTEGER NOT NULL;

-- DropTable
DROP TABLE "FAQ";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToProduct" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryToProduct_B_index" ON "_CategoryToProduct"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- AddForeignKey
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
