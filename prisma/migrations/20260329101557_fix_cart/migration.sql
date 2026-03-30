-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "CartItem_productId_fkey";

-- RenameForeignKey
ALTER TABLE "Cart" RENAME CONSTRAINT "CartItem_userId_fkey" TO "Cart_userId_fkey";

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
