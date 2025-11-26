/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Property` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "public"."Property"("slug");
