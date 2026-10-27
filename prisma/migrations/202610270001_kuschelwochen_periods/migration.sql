CREATE TABLE "KuschelwochenPeriod" (
    "id" SERIAL NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    CONSTRAINT "KuschelwochenPeriod_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "KuschelwochenPeriod_dates_check" CHECK ("endDate" > "startDate")
);
CREATE UNIQUE INDEX "KuschelwochenPeriod_startDate_endDate_key" ON "KuschelwochenPeriod"("startDate", "endDate");
INSERT INTO "KuschelwochenPeriod" ("startDate", "endDate") VALUES
('2026-10-31', '2026-12-18'),
('2027-01-07', '2027-03-19'),
('2027-10-30', '2027-12-17');
