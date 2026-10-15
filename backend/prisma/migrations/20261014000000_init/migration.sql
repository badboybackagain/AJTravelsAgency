-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Maharashtra',
    "type" TEXT NOT NULL DEFAULT 'CITY',
    "side" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "pickupLocationId" TEXT NOT NULL,
    "dropLocationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '/assets/sedan.webp',
    "description" TEXT,
    "seatingCapacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "local_vehicles" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pickupLocationId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '/assets/sedan.webp',
    "description" TEXT,
    "seatingCapacity" INTEGER NOT NULL DEFAULT 4,
    "durationHours" INTEGER NOT NULL DEFAULT 8,
    "baseFare" DOUBLE PRECISION NOT NULL,
    "extraHourCharge" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "parkingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "parkingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parkingType" TEXT NOT NULL DEFAULT 'FIXED',
    "waitingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "freeMinutes" INTEGER NOT NULL DEFAULT 30,
    "perHourCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_availability" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "availableDate" TIMESTAMP(3) NOT NULL,
    "availableFromTime" TEXT NOT NULL,
    "availableToTime" TEXT NOT NULL,
    "availableQuantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fares" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "tripType" TEXT NOT NULL DEFAULT 'ONE_WAY',
    "baseFare" DOUBLE PRECISION NOT NULL,
    "perKmFare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumFare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fare_tolls" (
    "id" TEXT NOT NULL,
    "fareId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fare_tolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fare_parking" (
    "id" TEXT NOT NULL,
    "fareId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "locationId" TEXT,
    "chargingType" TEXT NOT NULL DEFAULT 'FIXED',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fare_parking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fare_waiting" (
    "id" TEXT NOT NULL,
    "fareId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "locationId" TEXT,
    "freeMinutes" INTEGER NOT NULL DEFAULT 30,
    "perHourCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fare_waiting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tolls" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "vehicleCategory" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_charges" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "vehicleCategory" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "chargingType" TEXT NOT NULL DEFAULT 'FIXED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waiting_charges" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "vehicleCategory" TEXT NOT NULL,
    "freeMinutes" INTEGER NOT NULL DEFAULT 30,
    "perHourCharge" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waiting_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "routeId" TEXT,
    "vehicleId" TEXT,
    "localVehicleId" TEXT,
    "pickupLocationId" TEXT,
    "dropLocationId" TEXT,
    "city" TEXT,
    "tripType" TEXT NOT NULL DEFAULT 'ONE_WAY',
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "pickupTime" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3),
    "returnTime" TEXT,
    "durationHours" INTEGER,
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "pickupAddress" TEXT,
    "dropAddress" TEXT,
    "fareTotal" DOUBLE PRECISION NOT NULL,
    "fareDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routes_pickupLocationId_dropLocationId_key" ON "routes"("pickupLocationId", "dropLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "fares_routeId_vehicleId_tripType_key" ON "fares"("routeId", "vehicleId", "tripType");

-- CreateIndex
CREATE UNIQUE INDEX "fare_parking_fareId_key" ON "fare_parking"("fareId");

-- CreateIndex
CREATE UNIQUE INDEX "fare_waiting_fareId_key" ON "fare_waiting"("fareId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_dropLocationId_fkey" FOREIGN KEY ("dropLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_vehicles" ADD CONSTRAINT "local_vehicles_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_availability" ADD CONSTRAINT "vehicle_availability_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_availability" ADD CONSTRAINT "vehicle_availability_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fares" ADD CONSTRAINT "fares_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fares" ADD CONSTRAINT "fares_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fare_tolls" ADD CONSTRAINT "fare_tolls_fareId_fkey" FOREIGN KEY ("fareId") REFERENCES "fares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fare_parking" ADD CONSTRAINT "fare_parking_fareId_fkey" FOREIGN KEY ("fareId") REFERENCES "fares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fare_waiting" ADD CONSTRAINT "fare_waiting_fareId_fkey" FOREIGN KEY ("fareId") REFERENCES "fares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tolls" ADD CONSTRAINT "tolls_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_charges" ADD CONSTRAINT "parking_charges_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_charges" ADD CONSTRAINT "waiting_charges_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_localVehicleId_fkey" FOREIGN KEY ("localVehicleId") REFERENCES "local_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

