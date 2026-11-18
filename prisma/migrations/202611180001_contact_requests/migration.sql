CREATE TABLE "ContactRequest" (
    "id" SERIAL NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "isLandlordProspect" BOOLEAN NOT NULL DEFAULT false,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContactRequest_deduplicationKey_key" ON "ContactRequest"("deduplicationKey");
CREATE INDEX "ContactRequest_status_createdAt_idx" ON "ContactRequest"("status", "createdAt");
CREATE INDEX "ContactRequest_createdAt_idx" ON "ContactRequest"("createdAt");
