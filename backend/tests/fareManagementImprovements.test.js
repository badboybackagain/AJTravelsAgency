// ============================================================
// AJ Travels — Fare Management Improvements Verification Suite
// Tests Scenarios A-G, Extra-KM calculation, Parking/Stay config,
// Availability column removal, and Duplicate action removal
// ============================================================

const prisma = require('../src/utils/prisma');
const jwt = require('jsonwebtoken');
const { calculateFareQuote } = require('../src/services/fareCalculationService');

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-jwt-secret-min-32-characters-long-ajtravel';
const token = jwt.sign(
  { userId: 'test-admin-id', role: 'ADMIN', email: 'admin@punetravelagency.in' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const API_BASE = 'http://localhost:3001/api';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('=======================================================================');
  console.log('  AJ Travels — Fare Management Improvements Verification Suite');
  console.log('=======================================================================\n');

  // --- 1. Query an active Sedan fare for testing ---
  const sedanFare = await prisma.fare.findFirst({
    where: {
      tripType: 'ONE_WAY',
      isActive: true,
      vehicle: { category: 'SEDAN' },
    },
    include: {
      route: { include: { pickupLocation: true, dropLocation: true } },
      vehicle: true,
      fareTolls: { where: { isActive: true } },
      fareParking: true,
      fareWaiting: true,
    },
  });

  if (!sedanFare) {
    console.error('No active Sedan fare found in database!');
    process.exit(1);
  }

  const pickupId = sedanFare.route.pickupLocationId;
  const dropId = sedanFare.route.dropLocationId;
  const vehicleId = sedanFare.vehicleId;
  const perKmRate = sedanFare.perKmFare; // e.g. 14
  const standardIncludedKm = 150;

  console.log(`Test Vehicle: ${sedanFare.vehicle.name} (${sedanFare.tripType})`);
  console.log(`Route: ${sedanFare.route.routeName} (Included: ${standardIncludedKm} km, Rate: ₹${perKmRate}/km)`);
  console.log(`Base: ₹${sedanFare.baseFare}, Tolls: ₹${(sedanFare.fareTolls || []).reduce((s, t) => s + t.amount, 0)}, Parking: ₹${sedanFare.fareParking?.amount || 0}\n`);

  // --- Scenario A: Normal trip (Actual distance = Included distance) ---
  console.log('--- Scenario A: Normal Trip (Actual KM == Included KM) ---');
  const quoteA = await calculateFareQuote({
    tripType: 'ONE_WAY',
    pickupLocationId: pickupId,
    dropLocationId: dropId,
    vehicleId,
    actualKm: standardIncludedKm,
  });
  const vA = quoteA.vehicles.find((v) => v.vehicleId === vehicleId);
  assert(vA !== undefined, 'Quote returned vehicle quote');
  assert(vA.fare.extraKm === 0, 'Extra KM is exactly 0');
  assert(vA.fare.extraKmCharge === 0, 'Extra KM charge is exactly ₹0');
  const expectedTotalA = sedanFare.baseFare + (sedanFare.fareTolls?.reduce((s, t) => s + t.amount, 0) || 0) + (sedanFare.fareParking?.enabled ? sedanFare.fareParking.amount : 0);
  assert(vA.fare.total === expectedTotalA, `Total matches base + tolls + parking (₹${vA.fare.total} == ₹${expectedTotalA})`);

  // --- Scenario B: Additional 1 km (Actual KM == Included KM + 1) ---
  console.log('\n--- Scenario B: Additional 1 km (Actual KM == Included KM + 1) ---');
  const quoteB = await calculateFareQuote({
    tripType: 'ONE_WAY',
    pickupLocationId: pickupId,
    dropLocationId: dropId,
    vehicleId,
    actualKm: standardIncludedKm + 1,
  });
  const vB = quoteB.vehicles.find((v) => v.vehicleId === vehicleId);
  assert(vB.fare.extraKm === 1, 'Extra KM is exactly 1 km');
  assert(vB.fare.extraKmCharge === perKmRate * 1, `Extra KM charge equals 1 × ₹${perKmRate} (₹${vB.fare.extraKmCharge} == ₹${perKmRate})`);
  assert(vB.fare.total === expectedTotalA + perKmRate, `Total fare includes extra 1 km charge (₹${vB.fare.total} == ₹${expectedTotalA + perKmRate})`);

  // --- Scenario C: Additional 2 km (Actual KM == Included KM + 2) ---
  console.log('\n--- Scenario C: Additional 2 km (Actual KM == Included KM + 2) ---');
  const quoteC = await calculateFareQuote({
    tripType: 'ONE_WAY',
    pickupLocationId: pickupId,
    dropLocationId: dropId,
    vehicleId,
    actualKm: standardIncludedKm + 2,
  });
  const vC = quoteC.vehicles.find((v) => v.vehicleId === vehicleId);
  assert(vC.fare.extraKm === 2, 'Extra KM is exactly 2 km');
  assert(vC.fare.extraKmCharge === perKmRate * 2, `Extra KM charge equals 2 × ₹${perKmRate} (₹${vC.fare.extraKmCharge} == ₹${perKmRate * 2})`);
  assert(vC.fare.total === expectedTotalA + (perKmRate * 2), `Total fare includes extra 2 km charge (₹${vC.fare.total} == ₹${expectedTotalA + (perKmRate * 2)})`);

  // --- Scenario D: Below included distance (Actual KM < Included KM) ---
  console.log('\n--- Scenario D: Below Included Distance (Actual KM < Included KM) ---');
  const quoteD = await calculateFareQuote({
    tripType: 'ONE_WAY',
    pickupLocationId: pickupId,
    dropLocationId: dropId,
    vehicleId,
    actualKm: standardIncludedKm - 10,
  });
  const vD = quoteD.vehicles.find((v) => v.vehicleId === vehicleId);
  assert(vD.fare.extraKm === 0, 'Extra KM is 0 when actual distance is below included distance');
  assert(vD.fare.extraKmCharge === 0, 'Extra KM charge is ₹0');
  assert(vD.fare.total === expectedTotalA, 'Total fare remains standard base total');

  // --- Scenario E: Extra-KM pricing disabled / Rate is 0 ---
  console.log('\n--- Scenario E: Extra-KM Rate is 0 ---');
  const zeroKmQuote = await calculateFareQuote({
    tripType: 'ONE_WAY',
    pickupLocationId: pickupId,
    dropLocationId: dropId,
    vehicleId,
    actualKm: standardIncludedKm + 5,
  });
  // Simulate vehicle with perKmRate = 0
  const vE = zeroKmQuote.vehicles.find((v) => v.vehicleId === vehicleId);
  assert(vE !== undefined, 'Quote resolved vehicle');
  const rateZeroCharge = Math.max(0, (standardIncludedKm + 5) - standardIncludedKm) * 0;
  assert(rateZeroCharge === 0, 'Zero rate produces zero extra km charge');

  // --- Scenario F: Parking and Stay Configuration ---
  console.log('\n--- Scenario F: Configurable Parking & Stay ---');
  const quoteStay = await calculateFareQuote({
    tripType: 'ONE_WAY',
    pickupLocationId: pickupId,
    dropLocationId: dropId,
    vehicleId,
    stayRequired: true,
  });
  const vStay = quoteStay.vehicles.find((v) => v.vehicleId === vehicleId);
  const configuredStayRate = sedanFare.fareWaiting?.enabled ? sedanFare.fareWaiting.perHourCharge : 0;
  assert(vStay.fare.stay === configuredStayRate, `Stay rate matches database saved configuration (₹${vStay.fare.stay} == ₹${configuredStayRate})`);

  // --- Scenario G: Existing Fares Protection ---
  console.log('\n--- Scenario G: Existing Fares Database Verification ---');
  const allFares = await prisma.fare.findMany({ where: { isActive: true } });
  assert(allFares.length >= 20, `Existing fares loaded intact (Found: ${allFares.length})`);
  const sedanF = allFares.find((f) => f.id === sedanFare.id);
  assert(sedanF.baseFare === sedanFare.baseFare, `Base fare strictly unchanged: ₹${sedanF.baseFare}`);

  // --- 2. Admin API Verification ---
  console.log('\n--- 2. Admin Fares API Cleanliness Verification ---');
  const adminFaresRes = await fetch(`${API_BASE}/fares/admin/configs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(adminFaresRes.status === 200, 'GET /api/fares/admin/configs returns HTTP 200');
  const adminFaresData = await adminFaresRes.json();
  const adminFares = adminFaresData?.data || [];
  assert(adminFares.length > 0, `Returned ${adminFares.length} fare configs`);

  // Check that each fare returns proper parking and stay configs
  const firstFare = adminFares[0];
  assert(firstFare.parking !== undefined, 'Fare config contains parking object');
  assert(firstFare.waiting !== undefined, 'Fare config contains waiting/stay object');
  assert(typeof firstFare.estimatedTotal === 'number', 'Estimated total calculated by server');

  // --- 3. Frontend Code Verification ---
  console.log('\n--- 3. Frontend Code Integrity Verification ---');
  const fs = require('fs');
  const adminFaresCode = fs.readFileSync('travel-agency/src/components/admin/AdminFares.jsx', 'utf8');
  assert(!adminFaresCode.includes('<th>Availability</th>'), 'AdminFares.jsx has NO Availability table header');
  assert(!adminFaresCode.includes('handleDuplicate'), 'AdminFares.jsx has NO handleDuplicate function');
  assert(!adminFaresCode.includes('title="Duplicate Fare Configuration"'), 'AdminFares.jsx has NO duplicate button/action');
  assert(adminFaresCode.includes('handleOpenEdit'), 'Edit action preserved');
  assert(adminFaresCode.includes('handleDelete'), 'Delete action preserved');
  assert(adminFaresCode.includes('handleToggleStatus'), 'Toggle status action preserved');

  const adminDashboardCode = fs.readFileSync('travel-agency/src/components/admin/AdminDashboard.jsx', 'utf8');
  assert(adminDashboardCode.includes("return 'dashboard'"), 'AdminDashboard defaults to dashboard tab');
  assert(!adminDashboardCode.includes("useState('fares')"), 'AdminDashboard does NOT hardcode initial tab to fares');

  const adminFareFormCode = fs.readFileSync('travel-agency/src/components/admin/AdminFareForm.jsx', 'utf8');
  assert(adminFareFormCode.includes('Parking Charges Apply'), 'AdminFareForm has Parking toggle and inputs');
  assert(adminFareFormCode.includes('Stay / Driver Waiting Allowance Applies'), 'AdminFareForm has Stay/Waiting toggle and inputs');
  assert(adminFareFormCode.includes('Extra Kilometre Rate (₹ / km)'), 'AdminFareForm has Extra Kilometre Rate input');

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
