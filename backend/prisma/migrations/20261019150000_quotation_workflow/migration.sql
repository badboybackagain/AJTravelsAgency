-- Migration: 20261019150000_quotation_workflow
-- Creates quotes table, adds enquiryId and quoteId to bookings, establishes traceability.

-- 1. CreateTable "quotes"
CREATE TABLE IF NOT EXISTS "quotes" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "bookingId" TEXT,
    "vehicleCategory" TEXT NOT NULL,
    "vehicleName" TEXT,
    "tripType" TEXT NOT NULL DEFAULT 'ONE_WAY',
    "baseFare" DOUBLE PRECISION NOT NULL,
    "tollCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driverAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parkingCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFare" DOUBLE PRECISION NOT NULL,
    "inclusions" TEXT,
    "exclusions" TEXT,
    "terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUOTED',
    "quoteToken" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- 2. Indexes and Uniqueness Constraints on "quotes"
CREATE UNIQUE INDEX IF NOT EXISTS "quotes_quoteToken_key" ON "quotes"("quoteToken");
CREATE UNIQUE INDEX IF NOT EXISTS "quotes_bookingId_key" ON "quotes"("bookingId");
CREATE INDEX IF NOT EXISTS "quotes_enquiryId_idx" ON "quotes"("enquiryId");
CREATE INDEX IF NOT EXISTS "quotes_quoteToken_idx" ON "quotes"("quoteToken");

-- 3. Extend "bookings" with optional traceability fields
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "enquiryId" TEXT,
ADD COLUMN IF NOT EXISTS "quoteId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_quoteId_key" ON "bookings"("quoteId");

-- 4. Foreign Key Constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quotes_enquiryId_fkey'
    ) THEN
        ALTER TABLE "quotes" 
        ADD CONSTRAINT "quotes_enquiryId_fkey" 
        FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quotes_bookingId_fkey'
    ) THEN
        ALTER TABLE "quotes" 
        ADD CONSTRAINT "quotes_bookingId_fkey" 
        FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
