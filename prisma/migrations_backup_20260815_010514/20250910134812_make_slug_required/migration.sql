/*
  Warnings:

  - You are about to alter the column `pricePerNight` on the `PricePeriod` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `order` on the `PropertyImage` table. All the data in the column will be lost.
  - Made the column `slug` on table `Property` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."PricePeriod" ALTER COLUMN "pricePerNight" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Property" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."PropertyImage" DROP COLUMN "order",
ADD COLUMN     "sort" INTEGER NOT NULL DEFAULT 0;
