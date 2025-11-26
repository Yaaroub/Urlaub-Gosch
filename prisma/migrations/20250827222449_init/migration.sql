-- CreateTable
CREATE TABLE "public"."Property" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "maxPersons" INTEGER NOT NULL,
    "dogsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Amenity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PricePeriod" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "propertyId" INTEGER NOT NULL,

    CONSTRAINT "PricePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "guestName" TEXT,
    "propertyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AmenityToProperty" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AmenityToProperty_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Property_location_idx" ON "public"."Property"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_name_key" ON "public"."Amenity"("name");

-- CreateIndex
CREATE INDEX "PricePeriod_propertyId_startDate_endDate_idx" ON "public"."PricePeriod"("propertyId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_propertyId_startDate_endDate_idx" ON "public"."Booking"("propertyId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "_AmenityToProperty_B_index" ON "public"."_AmenityToProperty"("B");

-- AddForeignKey
ALTER TABLE "public"."PricePeriod" ADD CONSTRAINT "PricePeriod_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AmenityToProperty" ADD CONSTRAINT "_AmenityToProperty_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AmenityToProperty" ADD CONSTRAINT "_AmenityToProperty_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
