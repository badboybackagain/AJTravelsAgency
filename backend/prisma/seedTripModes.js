const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Comprehensive 3-Mode Travel Data (ONE_WAY, ROUND_TRIP, LOCAL)...');

  // 1. Ensure Locations
  const locations = [
    { name: 'Pune (All Areas)', city: 'Pune', state: 'Maharashtra', side: 'PUNE_SIDE' },
    { name: 'Hinjawadi, Pune', city: 'Pune', state: 'Maharashtra', side: 'PUNE_SIDE' },
    { name: 'Wakad / Baner, Pune', city: 'Pune', state: 'Maharashtra', side: 'PUNE_SIDE' },
    { name: 'Viman Nagar / Kharadi, Pune', city: 'Pune', state: 'Maharashtra', side: 'PUNE_SIDE' },
    { name: 'Kothrud / Shivajinagar, Pune', city: 'Pune', state: 'Maharashtra', side: 'PUNE_SIDE' },
    { name: 'Pune Airport (PNQ)', city: 'Pune', state: 'Maharashtra', side: 'PUNE_SIDE' },
    { name: 'Mumbai (All Areas)', city: 'Mumbai', state: 'Maharashtra', side: 'MUMBAI_SIDE' },
    { name: 'BKC (Bandra Kurla), Mumbai', city: 'Mumbai', state: 'Maharashtra', side: 'MUMBAI_SIDE' },
    { name: 'Andheri, Mumbai', city: 'Mumbai', state: 'Maharashtra', side: 'MUMBAI_SIDE' },
    { name: 'Bandra / Dadar, Mumbai', city: 'Mumbai', state: 'Maharashtra', side: 'MUMBAI_SIDE' },
    { name: 'Borivali / Western Suburbs, Mumbai', city: 'Mumbai', state: 'Maharashtra', side: 'MUMBAI_SIDE' },
    { name: 'Thane / Navi Mumbai / Vashi', city: 'Navi Mumbai', state: 'Maharashtra', side: 'MUMBAI_SIDE' },
    { name: 'Mumbai Airport (BOM - T1/T2)', city: 'Mumbai', state: 'Maharashtra', side: 'MUMBAI_SIDE' },
  ];

  for (const loc of locations) {
    const existing = await prisma.location.findFirst({ where: { name: loc.name } });
    if (!existing) {
      await prisma.location.create({ data: { ...loc, isActive: true } });
    } else {
      await prisma.location.update({ where: { id: existing.id }, data: { side: loc.side, city: loc.city } });
    }
  }

  const puneLoc = await prisma.location.findFirst({ where: { name: 'Pune (All Areas)' } });
  const mumbaiLoc = await prisma.location.findFirst({ where: { name: 'Mumbai (All Areas)' } });

  // 2. Ensure Primary Routes
  let puneToMumbai = await prisma.route.findFirst({
    where: { pickupLocationId: puneLoc.id, dropLocationId: mumbaiLoc.id },
  });
  if (!puneToMumbai) {
    puneToMumbai = await prisma.route.create({
      data: { routeName: 'Pune → Mumbai', pickupLocationId: puneLoc.id, dropLocationId: mumbaiLoc.id, isActive: true },
    });
  }

  let mumbaiToPune = await prisma.route.findFirst({
    where: { pickupLocationId: mumbaiLoc.id, dropLocationId: puneLoc.id },
  });
  if (!mumbaiToPune) {
    mumbaiToPune = await prisma.route.create({
      data: { routeName: 'Mumbai → Pune', pickupLocationId: mumbaiLoc.id, dropLocationId: puneLoc.id, isActive: true },
    });
  }

  // 3. Vehicles
  const standardVehicles = [
    {
      name: 'Executive Sedan',
      category: 'SEDAN',
      image: '/assets/sedan.webp',
      description: 'Fuel: CNG / Petrol | 4 Seater | AC | Free Cancellation | Best for couples & business travel.',
      seatingCapacity: 4,
      displayOrder: 1,
      oneWayBase: 2199,
      roundTripBase: 4199,
      tollAmount: 320,
      parkingAmount: 100,
    },
    {
      name: 'Spacious SUV (Ertiga / Carens)',
      category: 'SUV',
      image: '/assets/suv.webp',
      description: 'Fuel: Diesel / CNG | 6 Seater | Extra Luggage Space | Ideal for families & groups.',
      seatingCapacity: 6,
      displayOrder: 2,
      oneWayBase: 3199,
      roundTripBase: 5999,
      tollAmount: 320,
      parkingAmount: 150,
    },
    {
      name: 'Premium Innova Crysta',
      category: 'LUXURY',
      image: '/assets/luxury.jpg',
      description: 'Fuel: Diesel (Turbo) | 6 Seater | Captain Seats | Supreme comfort & executive ride.',
      seatingCapacity: 6,
      displayOrder: 3,
      oneWayBase: 4899,
      roundTripBase: 8999,
      tollAmount: 320,
      parkingAmount: 200,
    },
    {
      name: 'Compact Hatchback',
      category: 'HATCHBACK',
      image: '/assets/hatchback.jpg',
      description: 'Fuel: CNG / Petrol | 4 Seater | Budget friendly express cab for solo and quick commutes.',
      seatingCapacity: 4,
      displayOrder: 4,
      oneWayBase: 1899,
      roundTripBase: 3599,
      tollAmount: 320,
      parkingAmount: 50,
    },
    {
      name: 'Luxury Tempo Traveller',
      category: 'MINIBUS',
      image: '/assets/minibus.jpg',
      description: 'Fuel: Diesel | 12-17 Seater | Pushback Recliner Seats | Group tours & corporate trips.',
      seatingCapacity: 12,
      displayOrder: 5,
      oneWayBase: 7999,
      roundTripBase: 14999,
      tollAmount: 640,
      parkingAmount: 300,
    },
  ];

  const routes = [puneToMumbai, mumbaiToPune];

  for (const vData of standardVehicles) {
    let vehicle = await prisma.vehicle.findFirst({ where: { name: vData.name } });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          name: vData.name,
          category: vData.category,
          image: vData.image,
          description: vData.description,
          seatingCapacity: vData.seatingCapacity,
          displayOrder: vData.displayOrder,
          isActive: true,
        },
      });
    } else {
      vehicle = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          category: vData.category,
          image: vData.image,
          description: vData.description,
          seatingCapacity: vData.seatingCapacity,
          displayOrder: vData.displayOrder,
          isActive: true,
        },
      });
    }

    for (const route of routes) {
      // ONE_WAY Fare
      await prisma.fare.upsert({
        where: { routeId_vehicleId_tripType: { routeId: route.id, vehicleId: vehicle.id, tripType: 'ONE_WAY' } },
        update: {
          baseFare: vData.oneWayBase,
          perKmFare: 14,
          minimumFare: vData.oneWayBase,
          isActive: true,
        },
        create: {
          routeId: route.id,
          vehicleId: vehicle.id,
          tripType: 'ONE_WAY',
          baseFare: vData.oneWayBase,
          perKmFare: 14,
          minimumFare: vData.oneWayBase,
          isActive: true,
          fareTolls: { create: [{ name: 'Mumbai-Pune Expressway Toll', amount: vData.tollAmount, isActive: true }] },
          fareParking: { create: { enabled: true, amount: vData.parkingAmount, chargingType: 'FIXED' } },
          fareWaiting: { create: { enabled: true, freeMinutes: 45, perHourCharge: 150 } },
        },
      });

      // ROUND_TRIP Fare
      await prisma.fare.upsert({
        where: { routeId_vehicleId_tripType: { routeId: route.id, vehicleId: vehicle.id, tripType: 'ROUND_TRIP' } },
        update: {
          baseFare: vData.roundTripBase,
          perKmFare: 13,
          minimumFare: vData.roundTripBase,
          isActive: true,
        },
        create: {
          routeId: route.id,
          vehicleId: vehicle.id,
          tripType: 'ROUND_TRIP',
          baseFare: vData.roundTripBase,
          perKmFare: 13,
          minimumFare: vData.roundTripBase,
          isActive: true,
          fareTolls: { create: [{ name: 'Expressway Return Tolls (Both Ways)', amount: vData.tollAmount * 2, isActive: true }] },
          fareParking: { create: { enabled: true, amount: vData.parkingAmount * 2, chargingType: 'FIXED' } },
          fareWaiting: { create: { enabled: true, freeMinutes: 90, perHourCharge: 150 } },
        },
      });
    }
  }

  // 4. Seed LOCAL Vehicles (Pune & Mumbai)
  await prisma.localVehicle.deleteMany();

  const localVehiclesData = [
    {
      city: 'Pune',
      name: 'AC Executive Sedan (Pune Local 8 Hrs)',
      category: 'SEDAN',
      image: '/assets/sedan.webp',
      description: 'Fuel: CNG / Petrol | 8 Hrs / 80 KMs package with professional city driver.',
      seatingCapacity: 4,
      durationHours: 8,
      baseFare: 1850,
      extraHourCharge: 150,
      parkingEnabled: true,
      parkingAmount: 100,
      waitingEnabled: true,
      freeMinutes: 30,
      perHourCharge: 150,
      availableQuantity: 5,
      status: 'AVAILABLE',
      isActive: true,
    },
    {
      city: 'Pune',
      name: 'AC Spacious SUV (Pune Local 8 Hrs)',
      category: 'SUV',
      image: '/assets/suv.webp',
      description: 'Fuel: Diesel / CNG | 8 Hrs / 80 KMs package for family & group city visits.',
      seatingCapacity: 6,
      durationHours: 8,
      baseFare: 2650,
      extraHourCharge: 200,
      parkingEnabled: true,
      parkingAmount: 150,
      waitingEnabled: true,
      freeMinutes: 30,
      perHourCharge: 200,
      availableQuantity: 4,
      status: 'AVAILABLE',
      isActive: true,
    },
    {
      city: 'Pune',
      name: 'AC Hatchback (Pune Local 4 Hrs)',
      category: 'HATCHBACK',
      image: '/assets/hatchback.jpg',
      description: 'Fuel: CNG / Petrol | 4 Hrs / 40 KMs quick city travel & errands.',
      seatingCapacity: 4,
      durationHours: 4,
      baseFare: 1199,
      extraHourCharge: 120,
      parkingEnabled: false,
      parkingAmount: 0,
      waitingEnabled: true,
      freeMinutes: 20,
      perHourCharge: 120,
      availableQuantity: 6,
      status: 'AVAILABLE',
      isActive: true,
    },
    {
      city: 'Pune',
      name: 'AC Luxury Crysta (Pune Local 8 Hrs)',
      category: 'LUXURY',
      image: '/assets/luxury.jpg',
      description: 'Fuel: Diesel (Turbo) | Premium executive chauffeur package.',
      seatingCapacity: 6,
      durationHours: 8,
      baseFare: 4200,
      extraHourCharge: 350,
      parkingEnabled: true,
      parkingAmount: 200,
      waitingEnabled: true,
      freeMinutes: 45,
      perHourCharge: 350,
      availableQuantity: 3,
      status: 'AVAILABLE',
      isActive: true,
    },
    {
      city: 'Mumbai',
      name: 'AC Executive Sedan (Mumbai Local 8 Hrs)',
      category: 'SEDAN',
      image: '/assets/sedan.webp',
      description: 'Fuel: CNG / Petrol | 8 Hrs / 80 KMs Mumbai city & BKC package.',
      seatingCapacity: 4,
      durationHours: 8,
      baseFare: 2150,
      extraHourCharge: 180,
      parkingEnabled: true,
      parkingAmount: 150,
      waitingEnabled: true,
      freeMinutes: 30,
      perHourCharge: 180,
      availableQuantity: 5,
      status: 'AVAILABLE',
      isActive: true,
    },
    {
      city: 'Mumbai',
      name: 'AC Spacious SUV (Mumbai Local 8 Hrs)',
      category: 'SUV',
      image: '/assets/suv.webp',
      description: 'Fuel: Diesel / CNG | 8 Hrs / 80 KMs Mumbai sightseeing & business travel.',
      seatingCapacity: 6,
      durationHours: 8,
      baseFare: 2950,
      extraHourCharge: 220,
      parkingEnabled: true,
      parkingAmount: 200,
      waitingEnabled: true,
      freeMinutes: 30,
      perHourCharge: 220,
      availableQuantity: 4,
      status: 'AVAILABLE',
      isActive: true,
    },
    {
      city: 'Mumbai',
      name: 'AC Hatchback (Mumbai Local 4 Hrs)',
      category: 'HATCHBACK',
      image: '/assets/hatchback.jpg',
      description: 'Fuel: CNG / Petrol | 4 Hrs / 40 KMs quick South Mumbai / Western sub travel.',
      seatingCapacity: 4,
      durationHours: 4,
      baseFare: 1350,
      extraHourCharge: 140,
      parkingEnabled: false,
      parkingAmount: 0,
      waitingEnabled: true,
      freeMinutes: 20,
      perHourCharge: 140,
      availableQuantity: 6,
      status: 'AVAILABLE',
      isActive: true,
    },
  ];

  for (const item of localVehiclesData) {
    await prisma.localVehicle.create({ data: item });
  }

  console.log('✅ Comprehensive 3-Mode Travel Data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
