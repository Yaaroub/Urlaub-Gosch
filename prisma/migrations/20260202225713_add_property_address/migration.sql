/*
  Warnings:

  - You are about to drop the column `currency` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Booking` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- DropIndex
DROP INDEX "public"."Booking_userId_idx";

-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "currency",
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentStatus",
DROP COLUMN "status",
DROP COLUMN "totalAmount",
DROP COLUMN "transactionId",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "address" TEXT;
