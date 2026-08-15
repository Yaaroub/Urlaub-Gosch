-- CreateTable
CREATE TABLE "public"."LastMinuteOffer" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "discount" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LastMinuteOffer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."LastMinuteOffer" ADD CONSTRAINT "LastMinuteOffer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
