-- DropIndex
DROP INDEX "public"."Property_location_idx";

-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "icalLastRunAt" TIMESTAMP(3),
ADD COLUMN     "icalUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "icalUrl" TEXT;
