CREATE TABLE "InquiryMailThrottle" (
    "id" INTEGER NOT NULL,
    "lastAttemptAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "InquiryMailThrottle_pkey" PRIMARY KEY ("id")
);
