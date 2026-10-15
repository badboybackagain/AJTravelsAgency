// ============================================================
// SEED BUSINESS DATA — Verified Core Locations, Routes & Vehicles
// ============================================================
// Safety Rules:
// 1. Strictly Idempotent: safe to run multiple times without duplicating.
// 2. Preserves existing records; no deleteMany or destructive calls.
// 3. ZERO invented fares, tolls, parking, waiting charges, or bookings.
// ============================================================

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const baseLocations = [
  // PUNE SIDE
  { name: 'Pune (All Areas)', city: 'Pune', state: 'Maharashtra', type: 'CITY', side: 'PUNE_SIDE' },
  { name: 'Hinjawadi', city: 'Pune', state: 'Maharashtra', type: 'AREA', side: 'PUNE_SIDE' },
  { name: 'Wakad / Baner', city: 'Pune', state: 'Maharashtra', type: 'AREA', side: 'PUNE_SIDE' },
  { name: 'Kothrud / Shivajinagar', city: 'Pune', state: 'Maharashtra', type: 'AREA', side: 'PUNE_SIDE' },
  { name: 'Viman Nagar / Kharadi', city: 'Pune', state: 'Maharashtra', type: 'AREA', side: 'PUNE_SIDE' },
  { name: 'Pune Airport (PNQ)', city: 'Pune', state: 'Maharashtra', type: 'AIRPORT', side: 'PUNE_SIDE' },

  // MUMBAI SIDE
  { name: 'Mumbai (All Areas)', city: 'Mumbai', state: 'Maharashtra', type: 'CITY', side: 'MUMBAI_SIDE' },
  { name: 'BKC (Bandra Kurla)', city: 'Mumbai', state: 'Maharashtra', type: 'AREA', side: 'MUMBAI_SIDE' },
  { name: 'Andheri', city: 'Mumbai', state: 'Maharashtra', type: 'AREA', side: 'MUMBAI_SIDE' },
  { name: 'Bandra / Dadar', city: 'Mumbai', state: 'Maharashtra', type: 'AREA', side: 'MUMBAI_SIDE' },
  { name: 'Navi Mumbai / Vashi', city: 'Navi Mumbai', state: 'Maharashtra', type: 'AREA', side: 'MUMBAI_SIDE' },
  { name: 'Mumbai Airport (BOM - T1/T2)', city: 'Mumbai', state: 'Maharashtra', type: 'AIRPORT', side: 'MUMBAI_SIDE' },
];

const routeDefinitions = [
  { pickup: 'Pune (All Areas)', drop: 'Mumbai (All Areas)', name: 'Pune → Mumbai' },
  { pickup: 'Mumbai (All Areas)', drop: 'Pune (All Areas)', name: 'Mumbai → Pune' },

  { pickup: 'Pune (All Areas)', drop: 'Mumbai Airport (BOM - T1/T2)', name: 'Pune → Mumbai Airport' },
  { pickup: 'Mumbai Airport (BOM - T1/T2)', drop: 'Pune (All Areas)', name: 'Mumbai Airport → Pune' },

  { pickup: 'Hinjawadi', drop: 'Mumbai (All Areas)', name: 'Hinjawadi → Mumbai' },
  { pickup: 'Mumbai (All Areas)', drop: 'Hinjawadi', name: 'Mumbai → Hinjawadi' },

  { pickup: 'Hinjawadi', drop: 'Mumbai Airport (BOM - T1/T2)', name: 'Hinjawadi → Mumbai Airport' },
  { pickup: 'Mumbai Airport (BOM - T1/T2)', drop: 'Hinjawadi', name: 'Mumbai Airport → Hinjawadi' },

  { pickup: 'Pune Airport (PNQ)', drop: 'Mumbai (All Areas)', name: 'Pune Airport → Mumbai' },
  { pickup: 'Mumbai (All Areas)', drop: 'Pune Airport (PNQ)', name: 'Mumbai → Pune Airport' },
];

const vehicleFleet = [
  {
    name: 'Executive Sedan',
    category: 'SEDAN',
    image: '/assets/sedan.webp',
    description: 'Comfortable private travel for 1-4 passengers. Swift Dzire, Honda Amaze or equivalent.',
    seatingCapacity: 4,
    displayOrder: 1,
    isActive: true,
  },
  {
    name: 'Spacious SUV (Ertiga / Carens)',
    category: 'SUV',
    image: '/assets/suv.webp',
    description: 'Ideal for families and groups with extra luggage space. Ertiga, Carens or equivalent.',
    seatingCapacity: 6,
    displayOrder: 2,
    isActive: true,
  },
  {
    name: 'Premium Innova Crysta',
    category: 'LUXURY',
    image: '/assets/luxury.jpg',
    description: 'Executive luxury chauffeured travel. Captain seats, supreme comfort & reliability.',
    seatingCapacity: 6,
    displayOrder: 3,
    isActive: true,
  },
  {
    name: 'Executive Tempo Traveller',
    category: 'MINIBUS',
    image: '/assets/minibus.jpg',
    description: 'Large group & corporate travel. 12-17 seats with dedicated luggage space.',
    seatingCapacity: 14,
    displayOrder: 4,
    isActive: true,
  },
];

async function seed() {
  console.log('=== SEEDING VERIFIED CORE BUSINESS DATA ===\n');

  // 1. Locations
  console.log('📍 Seeding Locations (12 Hubs)...');
  const locationMap = {};

  for (const loc of baseLocations) {
    const existing = await prisma.location.findFirst({
      where: { name: loc.name, city: loc.city }
    });

    if (existing) {
      const updated = await prisma.location.update({
        where: { id: existing.id },
        data: { state: loc.state, type: loc.type, side: loc.side, isActive: true }
      });
      locationMap[loc.name] = updated;
      console.log(`  ℹ️  Preserved/Updated: ${loc.name} (${updated.id})`);
    } else {
      const created = await prisma.location.create({
        data: { ...loc, isActive: true }
      });
      locationMap[loc.name] = created;
      console.log(`  ✅ Created: ${loc.name} (${created.id})`);
    }
  }

  // 2. Directional Routes (5 Hub Pairs = 10 Routes)
  console.log('\n🗺️  Seeding Directional Routes (10 Routes)...');
  const seededRoutes = [];

  for (const rDef of routeDefinitions) {
    const pickup = locationMap[rDef.pickup];
    const drop = locationMap[rDef.drop];

    if (!pickup || !drop) {
      throw new Error(`Location not found for route: ${rDef.name} (${rDef.pickup} -> ${rDef.drop})`);
    }

    const existingRoute = await prisma.route.findUnique({
      where: {
        pickupLocationId_dropLocationId: {
          pickupLocationId: pickup.id,
          dropLocationId: drop.id,
        }
      }
    });

    if (existingRoute) {
      const updated = await prisma.route.update({
        where: { id: existingRoute.id },
        data: { routeName: rDef.name, isActive: true }
      });
      seededRoutes.push(updated);
      console.log(`  ℹ️  Preserved/Updated Route: ${rDef.name} (${updated.id})`);
    } else {
      const created = await prisma.route.create({
        data: {
          routeName: rDef.name,
          pickupLocationId: pickup.id,
          dropLocationId: drop.id,
          isActive: true,
        }
      });
      seededRoutes.push(created);
      console.log(`  ✅ Created Route: ${rDef.name} (${created.id})`);
    }
  }

  // 3. Vehicle Fleet (4 Categories)
  console.log('\n🚗 Seeding Vehicle Fleet (4 Categories)...');
  const seededVehicles = [];

  for (const vData of vehicleFleet) {
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { name: vData.name }
    });

    if (existingVehicle) {
      const updated = await prisma.vehicle.update({
        where: { id: existingVehicle.id },
        data: {
          category: vData.category,
          image: vData.image,
          description: vData.description,
          seatingCapacity: vData.seatingCapacity,
          displayOrder: vData.displayOrder,
          isActive: true,
        }
      });
      seededVehicles.push(updated);
      console.log(`  ℹ️  Preserved/Updated Vehicle: ${vData.name} (${updated.id})`);
    } else {
      const created = await prisma.vehicle.create({
        data: vData
      });
      seededVehicles.push(created);
      console.log(`  ✅ Created Vehicle: ${vData.name} (${created.id})`);
    }
  }

  console.log('\n=== SEED SUMMARY ===');
  console.log(`Locations seeded: ${Object.keys(locationMap).length}`);
  console.log(`Routes seeded:    ${seededRoutes.length}`);
  console.log(`Vehicles seeded:  ${seededVehicles.length}`);
  console.log(`Fares seeded:     0 (Pricing to be configured via Admin Dashboard)`);
  console.log('✅ Base seed complete without errors.');
}

seed()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
