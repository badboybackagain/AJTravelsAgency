-- CreateTable
CREATE TABLE "integration_settings" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "provider" TEXT NOT NULL DEFAULT 'GENERIC_HTTP',
    "apiUrl" TEXT,
    "apiKey" TEXT,
    "senderId" TEXT,
    "destinationNumber" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastStatus" TEXT NOT NULL DEFAULT 'UNCONFIGURED',
    "lastVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pickup" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "travelDate" TEXT,
    "vehicle" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "eventType" TEXT NOT NULL,
    "referenceId" TEXT,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerResponse" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_service_key" ON "integration_settings"("service");

-- CreateIndex
CREATE INDEX "notification_logs_referenceId_eventType_idx" ON "notification_logs"("referenceId", "eventType");
