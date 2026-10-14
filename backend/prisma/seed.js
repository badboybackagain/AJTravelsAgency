// ============================================================
// SEED SCRIPT — Development data only
// ============================================================
// IMPORTANT:
// - Locations and routes are seeded as DEMO data
// - NO PRICES are seeded — admin must configure fares from the dashboard
// - One admin user is seeded using environment variables
// ============================================================

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // ============================================================
  // 1. Create Admin User
  // ============================================================
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@punemumbaitravels.in';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: 'ADMIN', name: 'Administrator' }
    });
    console.log(`✅ Admin created: ${admin.email}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  }

  // ============================================================
  // 2. Seed Locations — PUNE SIDE
  // ============================================================
  const puneLocations = [
    { name: 'Pune (All Areas)', city: 'Pune', type: 'CITY', side: 'PUNE_SIDE' },
    { name: 'Hinjawadi', city: 'Pune', type: 'AREA', side: 'PUNE_SIDE' },
    { name: 'Wakad / Baner', city: 'Pune', type: 'AREA', side: 'PUNE_SIDE' },
    { name: 'Viman Nagar / Kharadi', city: 'Pune', type: 'AREA', side: 'PUNE_SIDE' },
    { name: 'Kothrud / Shivajinagar', city: 'Pune', type: 'AREA', side: 'PUNE_SIDE' },
    { name: 'Hadapsar', city: 'Pune', type: 'AREA', side: 'PUNE_SIDE' },
    { name: 'Aundh / Pimpri', city: 'Pune', type: 'AREA', side: 'PUNE_SIDE' },
    { name: 'Pune Airport (PNQ)', city: 'Pune', type: 'AIRPORT', side: 'PUNE_SIDE' },
  ];

  // MUMBAI SIDE
  const mumbaiLocations = [
    { name: 'Mumbai (All Areas)', city: 'Mumbai', type: 'CITY', side: 'MUMBAI_SIDE' },
    { name: 'BKC (Bandra Kurla)', city: 'Mumbai', type: 'AREA', side: 'MUMBAI_SIDE' },
    { name: 'Andheri', city: 'Mumbai', type: 'AREA', side: 'MUMBAI_SIDE' },
    { name: 'Bandra', city: 'Mumbai', type: 'AREA', side: 'MUMBAI_SIDE' },
    { name: 'Powai / Hiranandani', city: 'Mumbai', type: 'AREA', side: 'MUMBAI_SIDE' },
    { name: 'Borivali / Kandivali', city: 'Mumbai', type: 'AREA', side: 'MUMBAI_SIDE' },
    { name: 'Dadar / Prabhadevi', city: 'Mumbai', type: 'AREA', side: 'MUMBAI_SIDE' },
    { name: 'Thane', city: 'Thane', type: 'CITY', side: 'MUMBAI_SIDE' },
    { name: 'Navi Mumbai / Vashi', city: 'Navi Mumbai', type: 'AREA', side: 'MUMBAI_SIDE' },
    { name: 'Panvel', city: 'Panvel', type: 'AREA', side: 'MUMBAI_SIDE' },
    { name: 'Mumbai Airport (BOM)', city: 'Mumbai', type: 'AIRPORT', side: 'MUMBAI_SIDE' },
  ];

  const allLocations = [...puneLocations, ...mumbaiLocations];
  const locationMap = {};

  console.log('\n📍 Seeding Locations...');
  for (const loc of allLocations) {
    const existing = await prisma.location.findFirst({
      where: { name: loc.name, city: loc.city }
    });

    if (existing) {
      locationMap[loc.name] = existing;
      console.log(`  ℹ️  Exists: ${loc.name}`);
    } else {
      const created = await prisma.location.create({ data: loc });
      locationMap[loc.name] = created;
      console.log(`  ✅ Created: ${loc.name}`);
    }
  }

  // ============================================================
  // 3. Seed Vehicles
  // NOTE: No prices here. Admin must configure fares from dashboard.
  // ============================================================
  const vehicles = [
    {
      name: 'Executive Sedan',
      category: 'SEDAN',
      image: '/assets/sedan.webp',
      description: 'Comfortable private travel for 1-4 passengers. Swift Dzire, Honda Amaze or equivalent.',
      seatingCapacity: 4,
      displayOrder: 1,
    },
    {
      name: 'Spacious SUV',
      category: 'SUV',
      image: '/assets/suv.webp',
      description: 'Ideal for families and groups. Innova, Ertiga, Carens or equivalent.',
      seatingCapacity: 6,
      displayOrder: 2,
    },
    {
      name: 'Premium / Luxury Class',
      category: 'LUXURY',
      image: '/assets/pune-to-mumbai-premium-travel-banner.webp',
      description: 'Executive travel experience. Crysta, Camry, or premium equivalent.',
      seatingCapacity: 4,
      displayOrder: 3,
    },
    {
      name: 'Luxury Mini Bus',
      category: 'MINI_BUS',
      image: '/assets/pune-mumbai-travel-banner.webp',
      description: 'Group travel. Tempo Traveller or Mini Bus (12-17 seats).',
      seatingCapacity: 14,
      displayOrder: 4,
    },
    {
      name: '20-Seater Bus',
      category: 'TWENTY_SEATER',
      image: '/assets/pune-mumbai-travel-banner.webp',
      description: 'Large group travel. 20-seater coach with luggage space.',
      seatingCapacity: 20,
      displayOrder: 5,
    },
  ];

  console.log('\n🚗 Seeding Vehicles...');
  const vehicleMap = {};
  for (const v of vehicles) {
    const existing = await prisma.vehicle.findFirst({ where: { name: v.name } });
    if (existing) {
      vehicleMap[v.name] = existing;
      console.log(`  ℹ️  Exists: ${v.name}`);
    } else {
      const created = await prisma.vehicle.create({ data: v });
      vehicleMap[v.name] = created;
      console.log(`  ✅ Created: ${v.name}`);
    }
  }

  // ============================================================
  // 4. Seed Routes — DEMO (bidirectional between key hubs)
  // Backend validates that ONLY configured routes are served.
  // ============================================================
  const routePairs = [
    // Pune (All Areas) ↔ Mumbai (All Areas)
    { pickup: 'Pune (All Areas)', drop: 'Mumbai (All Areas)', name: 'Pune → Mumbai' },
    { pickup: 'Mumbai (All Areas)', drop: 'Pune (All Areas)', name: 'Mumbai → Pune' },

    // Pune ↔ Mumbai Airport
    { pickup: 'Pune (All Areas)', drop: 'Mumbai Airport (BOM)', name: 'Pune → Mumbai Airport' },
    { pickup: 'Mumbai Airport (BOM)', drop: 'Pune (All Areas)', name: 'Mumbai Airport → Pune' },

    // Pune ↔ BKC
    { pickup: 'Pune (All Areas)', drop: 'BKC (Bandra Kurla)', name: 'Pune → BKC' },
    { pickup: 'BKC (Bandra Kurla)', drop: 'Pune (All Areas)', name: 'BKC → Pune' },

    // Pune ↔ Andheri
    { pickup: 'Pune (All Areas)', drop: 'Andheri', name: 'Pune → Andheri' },
    { pickup: 'Andheri', drop: 'Pune (All Areas)', name: 'Andheri → Pune' },

    // Pune ↔ Thane
    { pickup: 'Pune (All Areas)', drop: 'Thane', name: 'Pune → Thane' },
    { pickup: 'Thane', drop: 'Pune (All Areas)', name: 'Thane → Pune' },

    // Hinjawadi ↔ Mumbai
    { pickup: 'Hinjawadi', drop: 'Mumbai (All Areas)', name: 'Hinjawadi → Mumbai' },
    { pickup: 'Mumbai (All Areas)', drop: 'Hinjawadi', name: 'Mumbai → Hinjawadi' },

    // Hinjawadi ↔ Mumbai Airport
    { pickup: 'Hinjawadi', drop: 'Mumbai Airport (BOM)', name: 'Hinjawadi → Mumbai Airport' },
    { pickup: 'Mumbai Airport (BOM)', drop: 'Hinjawadi', name: 'Mumbai Airport → Hinjawadi' },

    // Pune Airport ↔ Mumbai
    { pickup: 'Pune Airport (PNQ)', drop: 'Mumbai (All Areas)', name: 'Pune Airport → Mumbai' },
    { pickup: 'Mumbai (All Areas)', drop: 'Pune Airport (PNQ)', name: 'Mumbai → Pune Airport' },
  ];

  console.log('\n🗺️  Seeding Routes...');
  for (const pair of routePairs) {
    const pickupLoc = locationMap[pair.pickup];
    const dropLoc = locationMap[pair.drop];

    if (!pickupLoc || !dropLoc) {
      console.log(`  ⚠️  Skipping ${pair.name} — location not found`);
      continue;
    }

    const existing = await prisma.route.findFirst({
      where: { pickupLocationId: pickupLoc.id, dropLocationId: dropLoc.id }
    });

    if (existing) {
      console.log(`  ℹ️  Exists: ${pair.name}`);
    } else {
      await prisma.route.create({
        data: {
          routeName: pair.name,
          pickupLocationId: pickupLoc.id,
          dropLocationId: dropLoc.id,
        }
      });
      console.log(`  ✅ Created: ${pair.name}`);
    }
  }

  // ============================================================
  // 5. Seed Initial Demo Fare Configurations
  // ============================================================
  console.log('\n💵 Seeding Demo Fare Configurations...');
  const mainRoute = await prisma.route.findFirst({
    where: {
      pickupLocation: { name: 'Pune (All Areas)' },
      dropLocation: { name: 'Mumbai (All Areas)' },
    },
  });

  const returnRoute = await prisma.route.findFirst({
    where: {
      pickupLocation: { name: 'Mumbai (All Areas)' },
      dropLocation: { name: 'Pune (All Areas)' },
    },
  });

  const demoFares = [
    {
      vehicleName: 'Executive Sedan',
      baseFare: 2200,
      tolls: [{ name: 'Mumbai-Pune Expressway Toll', amount: 320 }],
      parking: { enabled: true, amount: 100, chargingType: 'FIXED' },
      waiting: { enabled: true, freeMinutes: 30, perHourCharge: 150 },
      availQty: 6,
    },
    {
      vehicleName: 'Spacious SUV',
      baseFare: 3200,
      tolls: [{ name: 'Mumbai-Pune Expressway Toll', amount: 480 }],
      parking: { enabled: true, amount: 150, chargingType: 'FIXED' },
      waiting: { enabled: true, freeMinutes: 30, perHourCharge: 200 },
      availQty: 4,
    },
    {
      vehicleName: 'Premium / Luxury Class',
      baseFare: 5500,
      tolls: [{ name: 'Mumbai-Pune Expressway Toll', amount: 480 }],
      parking: { enabled: true, amount: 200, chargingType: 'FIXED' },
      waiting: { enabled: true, freeMinutes: 45, perHourCharge: 350 },
      availQty: 2,
    },
  ];

  const routesToSeed = [mainRoute, returnRoute].filter(Boolean);

  for (const r of routesToSeed) {
    for (const df of demoFares) {
      const v = vehicleMap[df.vehicleName];
      if (!v) continue;

      const existingFare = await prisma.fare.findFirst({
        where: { routeId: r.id, vehicleId: v.id },
      });

      if (!existingFare) {
        const createdFare = await prisma.fare.create({
          data: {
            routeId: r.id,
            vehicleId: v.id,
            baseFare: df.baseFare,
            perKmFare: 0,
            minimumFare: df.baseFare,
            isActive: true,
          },
        });

        for (const toll of df.tolls) {
          await prisma.fareToll.create({
            data: {
              fareId: createdFare.id,
              name: toll.name,
              amount: toll.amount,
            },
          });
        }

        await prisma.fareParking.create({
          data: {
            fareId: createdFare.id,
            enabled: df.parking.enabled,
            amount: df.parking.amount,
            chargingType: df.parking.chargingType,
          },
        });

        await prisma.fareWaiting.create({
          data: {
            fareId: createdFare.id,
            enabled: df.waiting.enabled,
            freeMinutes: df.waiting.freeMinutes,
            perHourCharge: df.waiting.perHourCharge,
          },
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await prisma.vehicleAvailability.create({
          data: {
            vehicleId: v.id,
            routeId: r.id,
            availableDate: today,
            status: 'AVAILABLE',
            availableQuantity: df.availQty,
            availableFromTime: '00:00',
            availableToTime: '23:59',
          },
        });

        console.log(`  ✅ Configured fare for ${v.name} on ${r.routeName}`);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Log in to admin dashboard at /admin/login');
  console.log(`   2. Email: ${adminEmail}`);
  console.log(`   3. Password: ${adminPassword}`);
  console.log('   4. Go to Fare Management → Manage route + vehicle configs');
  console.log('\n⚠️  Remember: Change admin password after first login!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
