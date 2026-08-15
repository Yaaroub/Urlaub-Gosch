-- CreateEnum
CREATE TYPE "public"."AdminPermission" AS ENUM ('PROPERTIES_VIEW', 'PROPERTIES_EDIT', 'PROPERTIES_DELETE', 'PRICES_VIEW', 'PRICES_EDIT', 'FEES_VIEW', 'FEES_EDIT', 'IMAGES_VIEW', 'IMAGES_EDIT', 'IMAGES_DELETE', 'AVAILABILITY_VIEW', 'AVAILABILITY_EDIT', 'ICAL_VIEW', 'ICAL_EDIT', 'LASTMINUTE_VIEW', 'LASTMINUTE_EDIT', 'LASTMINUTE_DELETE', 'STAFF_VIEW', 'STAFF_CREATE', 'STAFF_EDIT', 'STAFF_LOCK', 'STAFF_PASSWORD_RESET', 'STAFF_PERMISSIONS_EDIT', 'STAFF_DELETE');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "public"."UserAdminPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permission" "public"."AdminPermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAdminPermission_userId_idx" ON "public"."UserAdminPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAdminPermission_userId_permission_key" ON "public"."UserAdminPermission"("userId", "permission");

-- AddForeignKey
ALTER TABLE "public"."UserAdminPermission" ADD CONSTRAINT "UserAdminPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
