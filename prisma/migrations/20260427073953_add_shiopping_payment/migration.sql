-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('Cash', 'Esewa', 'Khalti');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "fullName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'Cash',
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '';
