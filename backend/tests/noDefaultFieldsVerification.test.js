// ============================================================
// AJ Travels — No Default Pre-filled Fields Verification Suite
// Verifies that Admin Add Fare, Add Fleet, and Add Blog start completely empty
// and that route selection supports custom pickup/drop.
// ============================================================

const fs = require('fs');
const prisma = require('../src/utils/prisma');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-jwt-secret-min-32-characters-long-ajtravel';
const API_BASE = 'http://localhost:3001/api';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('=======================================================================');
  console.log('  AJ Travels — No Default Pre-filled Fields Verification Suite');
  console.log('=======================================================================\n');

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminToken = jwt.sign(
    { userId: adminUser?.id || 'admin', role: 'ADMIN', email: adminUser?.email || 'admin@punetravelagency.in' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // --- 1. AdminFareForm.jsx code checks ---
  console.log('--- 1. AdminFareForm: Zero Default Pre-filled Data Verification ---');
  const fareFormCode = fs.readFileSync('travel-agency/src/components/admin/AdminFareForm.jsx', 'utf8');

  // Must not have hardcoded initial states for create mode
  assert(!fareFormCode.includes("useState('Executive Sedan')"), 'Vehicle name does NOT default to "Executive Sedan"');
  assert(!fareFormCode.includes("useState(2200)"), 'Base fare does NOT default to 2200');
  assert(!fareFormCode.includes("name: 'Mumbai-Pune Expressway Toll'"), 'Expressway toll does NOT default prefilled');
  assert(!fareFormCode.includes("setRouteId(rList[0].id)"), 'Route selection does NOT auto-select first route');
  assert(!fareFormCode.includes("setVehicleId(firstVeh.id)"), 'Vehicle selection does NOT auto-select first fleet vehicle');
  assert(fareFormCode.includes("setRouteId('')"), 'Create mode resets routeId to empty');
  assert(fareFormCode.includes("setVehicleId('')"), 'Create mode resets vehicleId to empty');
  assert(fareFormCode.includes("setBaseFare('')"), 'Create mode resets baseFare to empty');
  assert(fareFormCode.includes("setTolls([])"), 'Create mode resets tolls to empty array');

  // Custom route selection support
  console.log('\n--- 2. Route Selection: Custom Pickup & Drop Support ---');
  assert(fareFormCode.includes('fare-pickup-locations'), 'Contains datalist for custom/registered pickup selection');
  assert(fareFormCode.includes('fare-drop-locations'), 'Contains datalist for custom/registered drop selection');
  assert(fareFormCode.includes('pickupLocationName'), 'Payload passes custom pickupLocationName');
  assert(fareFormCode.includes('dropLocationName'), 'Payload passes custom dropLocationName');

  // --- 3. AdminVehicleForm.jsx code checks ---
  console.log('\n--- 3. AdminVehicleForm: Zero Default Pre-filled Data Verification ---');
  const vehicleFormCode = fs.readFileSync('travel-agency/src/components/admin/AdminVehicleForm.jsx', 'utf8');

  assert(!vehicleFormCode.includes("name: 'Executive Sedan (Swift Dzire / Etios)'"), 'Vehicle name does NOT default to "Executive Sedan"');
  assert(!vehicleFormCode.includes("description: 'Comfortable air-conditioned sedan"), 'Vehicle description does NOT default to hardcoded text');
  assert(vehicleFormCode.includes("name: ''"), 'Vehicle name initializes to empty string');
  assert(vehicleFormCode.includes("image: ''"), 'Vehicle image initializes to empty string');
  assert(vehicleFormCode.includes("description: ''"), 'Vehicle description initializes to empty string');

  // --- 4. AdminBlogForm.jsx code checks ---
  console.log('\n--- 4. AdminBlogForm: Zero Default Pre-filled Data Verification ---');
  const blogFormCode = fs.readFileSync('travel-agency/src/components/admin/AdminBlogForm.jsx', 'utf8');

  assert(!blogFormCode.includes("title: 'Overview & Route Highlights'"), 'Blog does NOT pre-fill dummy heading');
  assert(!blogFormCode.includes("q: 'How do I book a cab for this route with AJ Travels?'"), 'Blog does NOT pre-fill dummy FAQ');
  assert(blogFormCode.includes("category: ''"), 'Blog category initializes to empty string');
  assert(blogFormCode.includes("featuredImage: ''"), 'Blog featuredImage initializes to empty string');
  assert(blogFormCode.includes("content: []"), 'Blog content initializes to empty array');
  assert(blogFormCode.includes("faqs: []"), 'Blog faqs initializes to empty array');

  // --- 5. Backend API: Custom Pickup & Drop Route Creation ---
  console.log('\n--- 5. Backend API: Custom Pickup & Drop Route Creation ---');
  const customPickup = 'Kalyani Nagar Test ' + Date.now();
  const customDrop = 'Bandra Kurla Complex ' + Date.now();

  const testVeh = await prisma.vehicle.findFirst({ where: { isActive: true } });

  let createdFareId = null;
  let dbFareInfo = null;

  try {
    const createFareRes = await fetch(`${API_BASE}/fares/admin/configs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        pickupLocationName: customPickup,
        dropLocationName: customDrop,
        vehicle: {
          id: testVeh.id,
          name: testVeh.name,
          category: testVeh.category,
          seatingCapacity: testVeh.seatingCapacity,
        },
        fare: {
          tripType: 'ONE_WAY',
          baseFare: 2999,
          perKmFare: 16,
          isActive: false, // inactive test fare
        },
        tolls: [],
        parking: { enabled: false, amount: 0 },
        waiting: { enabled: false, perHourCharge: 0 },
      }),
    });

    assert(createFareRes.status === 201, `POST /api/fares/admin/configs with custom locations created successfully (Status: ${createFareRes.status})`);
    const createFareData = await createFareRes.json();
    createdFareId = createFareData?.data?.id;

    if (createdFareId) {
      // Verify locations and route were created in DB
      dbFareInfo = await prisma.fare.findUnique({
        where: { id: createdFareId },
        include: { route: { include: { pickupLocation: true, dropLocation: true } } },
      });

      assert(dbFareInfo !== null, 'Fare was persisted in database');
      assert(dbFareInfo.route.pickupLocation.name === customPickup, `Custom pickup location "${customPickup}" resolved`);
      assert(dbFareInfo.route.dropLocation.name === customDrop, `Custom drop location "${customDrop}" resolved`);
      assert(dbFareInfo.baseFare === 2999, 'Base fare matches custom entered value: ₹2999');
    }
  } finally {
    // Bulletproof cleanup: delete created test fare, route, and locations
    try {
      if (createdFareId) {
        await prisma.fare.delete({ where: { id: createdFareId } }).catch(() => {});
      }
      if (dbFareInfo?.routeId) {
        await prisma.route.delete({ where: { id: dbFareInfo.routeId } }).catch(() => {});
      }
      if (dbFareInfo?.route?.pickupLocationId) {
        await prisma.location.delete({ where: { id: dbFareInfo.route.pickupLocationId } }).catch(() => {});
      }
      if (dbFareInfo?.route?.dropLocationId) {
        await prisma.location.delete({ where: { id: dbFareInfo.route.dropLocationId } }).catch(() => {});
      }
      // Fallback cleanup by location names in case dbFareInfo was not fetched
      const orphanedLocs = await prisma.location.findMany({
        where: { name: { in: [customPickup, customDrop] } },
        select: { id: true }
      });
      if (orphanedLocs.length > 0) {
        const locIds = orphanedLocs.map(l => l.id);
        await prisma.route.deleteMany({
          where: { OR: [{ pickupLocationId: { in: locIds } }, { dropLocationId: { in: locIds } }] }
        }).catch(() => {});
        await prisma.location.deleteMany({ where: { id: { in: locIds } } }).catch(() => {});
      }
      console.log('  Cleaned up temporary test custom route and fare records in finally block.');
    } catch (cleanupErr) {
      console.warn('  Test cleanup warning:', cleanupErr.message);
    }
  }

  console.log('\n=======================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED  |  ${failed} FAILED`);
  console.log('=======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
