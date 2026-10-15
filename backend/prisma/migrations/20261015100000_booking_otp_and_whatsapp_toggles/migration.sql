-- AlterTable
ALTER TABLE "integration_settings" ADD COLUMN IF NOT EXISTS "notifyBookings" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "integration_settings" ADD COLUMN IF NOT EXISTS "notifyEnquiries" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE IF NOT EXISTS "otp_challenges" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'BOOKING_VERIFICATION',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verificationToken" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL DEFAULT 'WASMS',
    "providerRef" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "otp_challenges_verificationToken_key" ON "otp_challenges"("verificationToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "otp_challenges_phoneNumber_status_idx" ON "otp_challenges"("phoneNumber", "status");

