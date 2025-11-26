-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('NONE', 'PAYPAL', 'CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('NOT_REQUIRED', 'REQUIRES_PAYMENT', 'AUTHORIZED', 'PAID', 'REFUNDED', 'CANCELED');

-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "currency" TEXT DEFAULT 'EUR',
ADD COLUMN     "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalAmount" DECIMAL(10,2),
ADD COLUMN     "transactionId" TEXT,
ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "public"."Booking"("userId");

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
