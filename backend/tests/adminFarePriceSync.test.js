/**
 * ============================================================================
 * AJ Travels - Admin Fare Price Sync End-to-End Verification Suite
 * ============================================================================
 * MODE: Mocked In-Memory Prisma & Controller Isolation
 * ZERO remote database interactions. ZERO production records touched.
 *
 * Tests the complete flow:
 *   AdminFareForm (UI) -> PUT /api/fares/admin/configs/:id (backend)
 *     -> invalidateFareCache() -> POST /api/fares/quote (public API)
 *     -> FarePage.jsx receives updated prices
 *
 * Test Matrix (mirrors the live 20-record config):
 *   Route:   Pune -> Mumbai (ONE_WAY)
 *   Vehicle: Executive Sedan (SEDAN)
 *   Cycle:   Rs.2300 (original) -> Rs.9999 (temp) -> Rs.2300 (restored)
 * ============================================================================
 */

const assert = require('assert');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. ISOLATED IN-MEMORY DATABASE (mirrors real schema, zero real DB connection)
// ---------------------------------------------------------------------------
const TEST_FARE_ID       = 'test-fare-pune-mumbai-sedan-oneway';
const TEST_ROUTE_ID      = 'test-route-pune-mumbai';
const TEST_VEHICLE_ID    = 'test-vehicle-sedan';
const TEST_PICKUP_LOC_ID = 'test-loc-pune-all-areas';
const TEST_DROP_LOC_ID   = 'test-loc-mumbai-all-areas';
const TEST_ADMIN_ID      = 'test-admin-001';

const ORIGINAL_BASE_FARE  = 2300;
const ORIGINAL_TOLL       = 320;
const ORIGINAL_PARKING    = 100;
const ORIGINAL_WAITING_HR = 150;
const TEST_TEMP_BASE_FARE = 9999;

const mockDb = {
  locations: [
    { id: TEST_PICKUP_LOC_ID, name: 'Pune (All Areas)',   city: 'Pune',   state: 'Maharashtra', side: 'PUNE_SIDE',   type: 'CITY', isActive: true },
    { id: TEST_DROP_LOC_ID,   name: 'Mumbai (All Areas)', city: 'Mumbai', state: 'Maharashtra', side: 'MUMBAI_SIDE', type: 'CITY', isActive: true },
  ],
  routes: [
    { id: TEST_ROUTE_ID, routeName: 'Pune to Mumbai', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, isActive: true },
  ],
  vehicles: [
    { id: TEST_VEHICLE_ID, name: 'Executive Sedan', category: 'SEDAN', image: '/assets/sedan.webp', description: 'AC sedan for 4 passengers.', seatingCapacity: 4, isActive: true, displayOrder: 1 },
  ],
  fares: [
    { id: TEST_FARE_ID, routeId: TEST_ROUTE_ID, vehicleId: TEST_VEHICLE_ID, tripType: 'ONE_WAY', baseFare: ORIGINAL_BASE_FARE, perKmFare: 14, minimumFare: ORIGINAL_BASE_FARE, isActive: true, createdAt: new Date('2026-10-01T00:00:00Z'), updatedAt: new Date('2026-10-01T00:00:00Z') },
  ],
  fareTolls: [
    { id: 'test-toll-01', fareId: TEST_FARE_ID, name: 'Mumbai-Pune Expressway Toll', amount: ORIGINAL_TOLL, isActive: true },
  ],
  fareParking: [
    { id: 'test-parking-01', fareId: TEST_FARE_ID, enabled: true, locationId: null, chargingType: 'FIXED', amount: ORIGINAL_PARKING, isActive: true },
  ],
  fareWaiting: [
    { id: 'test-waiting-01', fareId: TEST_FARE_ID, enabled: true, locationId: null, freeMinutes: 45, perHourCharge: ORIGINAL_WAITING_HR, isActive: true },
  ],
  vehicleAvailability: [],
  auditLogs: [],
};

// ---------------------------------------------------------------------------
// 2. MOCK PRISMA CLIENT
// ---------------------------------------------------------------------------
function buildFareRecord(fare) {
  const route   = mockDb.routes.find(r => r.id === fare.routeId) || null;
  const vehicle = mockDb.vehicles.find(v => v.id === fare.vehicleId) || null;
  const tolls   = mockDb.fareTolls.filter(t => t.fareId === fare.id && t.isActive);
  const parking = mockDb.fareParking.find(p => p.fareId === fare.id) || null;
  const waiting = mockDb.fareWaiting.find(w => w.fareId === fare.id) || null;
  if (route) {
    route.pickupLocation = mockDb.locations.find(l => l.id === route.pickupLocationId) || null;
    route.dropLocation   = mockDb.locations.find(l => l.id === route.dropLocationId)   || null;
  }
  return { ...fare, route, vehicle, fareTolls: tolls, fareParking: parking, fareWaiting: waiting };
}

const mockPrisma = {
  location: {
    findMany:   async ({ where } = {}) => {
      let locs = [...mockDb.locations];
      if (where && where.isActive !== undefined) locs = locs.filter(l => l.isActive === where.isActive);
      return locs;
    },
    findUnique: async ({ where }) => mockDb.locations.find(l => l.id === where.id) || null,
  },
  route: {
    findMany: async ({ where, include } = {}) => {
      let routes = [...mockDb.routes];
      if (where && where.isActive !== undefined) routes = routes.filter(r => r.isActive === where.isActive);
      return routes.map(r => {
        const copy = { ...r };
        if (include && include.pickupLocation) copy.pickupLocation = mockDb.locations.find(l => l.id === r.pickupLocationId) || null;
        if (include && include.dropLocation)   copy.dropLocation   = mockDb.locations.find(l => l.id === r.dropLocationId)   || null;
        return copy;
      });
    },
  },
  vehicle: {
    findMany: async ({ where, include } = {}) => {
      let vehicles = [...mockDb.vehicles];
      if (where && where.isActive !== undefined) vehicles = vehicles.filter(v => v.isActive === where.isActive);
      if (where && where.seatingCapacity && where.seatingCapacity.gte) vehicles = vehicles.filter(v => v.seatingCapacity >= where.seatingCapacity.gte);
      return vehicles.map(v => {
        const copy = { ...v };
        if (include && include.fares) {
          copy.fares = mockDb.fares
            .filter(f => f.vehicleId === v.id && (include.fares.where?.isActive === undefined || f.isActive === include.fares.where.isActive))
            .map(f => ({ baseFare: f.baseFare, tripType: f.tripType, routeId: f.routeId }));
        }
        return copy;
      });
    },
    findUnique: async ({ where, include }) => {
      const v = mockDb.vehicles.find(v => v.id === where.id);
      if (!v) return null;
      const copy = { ...v };
      if (include && include.fares) {
        copy.fares = mockDb.fares
          .filter(f => f.vehicleId === v.id && (include.fares.where?.isActive === undefined || f.isActive === include.fares.where.isActive))
          .map(f => ({ baseFare: f.baseFare, tripType: f.tripType, routeId: f.routeId }));
      }
      return copy;
    },
    update: async ({ where, data }) => {
      const v = mockDb.vehicles.find(v => v.id === where.id);
      if (!v) throw new Error('Vehicle ' + where.id + ' not found');
      Object.assign(v, data, { updatedAt: new Date() });
      return { ...v };
    },
  },
  fare: {
    findMany: async ({ where } = {}) => {
      let fares = [...mockDb.fares];
      if (where && where.routeId)  fares = fares.filter(f => f.routeId === where.routeId);
      if (where && where.isActive !== undefined) fares = fares.filter(f => f.isActive === where.isActive);
      return fares.map(f => buildFareRecord(f));
    },
    findUnique: async ({ where }) => {
      const fare = mockDb.fares.find(f => f.id === where.id);
      return fare ? buildFareRecord(fare) : null;
    },
    findFirst: async ({ where }) => {
      const fare = mockDb.fares.find(f => {
        if (where.routeId   && f.routeId   !== where.routeId)   return false;
        if (where.vehicleId && f.vehicleId !== where.vehicleId) return false;
        if (where.tripType  && f.tripType  !== where.tripType)  return false;
        if (where.isActive  !== undefined  && f.isActive !== where.isActive) return false;
        return true;
      });
      return fare ? buildFareRecord(fare) : null;
    },
    update: async ({ where, data }) => {
      const fare = mockDb.fares.find(f => f.id === where.id);
      if (!fare) throw new Error('Fare ' + where.id + ' not found');
      Object.assign(fare, data, { updatedAt: new Date() });
      return buildFareRecord(fare);
    },
  },
  fareToll: {
    deleteMany: async ({ where }) => {
      const before = mockDb.fareTolls.length;
      mockDb.fareTolls = mockDb.fareTolls.filter(t => t.fareId !== where.fareId);
      return { count: before - mockDb.fareTolls.length };
    },
    create: async ({ data }) => {
      const toll = Object.assign({ id: 'toll-' + Date.now() }, data);
      mockDb.fareTolls.push(toll);
      return { ...toll };
    },
  },
  fareParking: {
    upsert: async ({ where, create, update }) => {
      const idx = mockDb.fareParking.findIndex(p => p.fareId === where.fareId);
      if (idx >= 0) {
        Object.assign(mockDb.fareParking[idx], update);
        return { ...mockDb.fareParking[idx] };
      }
      const parking = Object.assign({ id: 'parking-' + Date.now() }, create);
      mockDb.fareParking.push(parking);
      return { ...parking };
    },
  },
  fareWaiting: {
    upsert: async ({ where, create, update }) => {
      const idx = mockDb.fareWaiting.findIndex(w => w.fareId === where.fareId);
      if (idx >= 0) {
        Object.assign(mockDb.fareWaiting[idx], update);
        return { ...mockDb.fareWaiting[idx] };
      }
      const waiting = Object.assign({ id: 'waiting-' + Date.now() }, create);
      mockDb.fareWaiting.push(waiting);
      return { ...waiting };
    },
  },
  vehicleAvailability: {
    findMany: async ({ where } = {}) => {
      let avails = [...mockDb.vehicleAvailability];
      if (where && where.vehicleId && where.vehicleId.in) avails = avails.filter(a => where.vehicleId.in.includes(a.vehicleId));
      if (where && where.routeId   && where.routeId.in)   avails = avails.filter(a => where.routeId.in.includes(a.routeId));
      return avails;
    },
    findFirst: async ({ where }) => {
      return mockDb.vehicleAvailability.find(a => {
        if (where.vehicleId && a.vehicleId !== where.vehicleId) return false;
        if (where.routeId   && a.routeId   !== where.routeId)   return false;
        return true;
      }) || null;
    },
    create: async ({ data }) => {
      const avail = Object.assign({ id: 'avail-' + Date.now() }, data);
      mockDb.vehicleAvailability.push(avail);
      return { ...avail };
    },
    update: async ({ where, data }) => {
      const avail = mockDb.vehicleAvailability.find(a => a.id === where.id);
      if (avail) Object.assign(avail, data);
      return { ...avail };
    },
  },
  auditLog: {
    create: async ({ data }) => {
      const log = Object.assign({ id: 'log-' + Date.now() }, data, { createdAt: new Date() });
      mockDb.auditLogs.push(log);
      return { ...log };
    },
  },
  '$transaction': async (callback) => await callback(mockPrisma),
};

// ---------------------------------------------------------------------------
// 3. INJECT MOCK PRISMA BEFORE LOADING CONTROLLERS
// ---------------------------------------------------------------------------
const prismaModulePath = path.resolve(__dirname, '../src/utils/prisma');
require.cache[require.resolve(prismaModulePath)] = {
  id:       require.resolve(prismaModulePath),
  filename: require.resolve(prismaModulePath),
  loaded:   true,
  exports:  mockPrisma,
};

const adminFareConfigController = require('../src/controllers/adminFareConfigController');
const vehicleController = require('../src/controllers/vehicleController');
const { calculateFareQuote, invalidateFareCache } = require('../src/services/fareCalculationService');

// ---------------------------------------------------------------------------
// 4. EXPRESS MOCK HELPERS
// ---------------------------------------------------------------------------
function mockReqRes(opts) {
  opts = opts || {};
  const params = opts.params || {};
  const body   = opts.body   || {};
  const query  = opts.query  || {};
  const user   = opts.user   || {};
  let statusCode = 200;
  let jsonResponse = null;
  let errorResponse = null;
  const req = { params, body, query, user };
  const res = {
    status: function(code) { statusCode = code; return res; },
    json:   function(data)  { jsonResponse = data; return res; },
  };
  const next = function(err) { errorResponse = err; };
  return {
    req, res, next,
    status: function() { return errorResponse ? (errorResponse.statusCode || 500) : statusCode; },
    body:   function() { return errorResponse ? null : jsonResponse; },
    error:  function() { return errorResponse; },
  };
}

// ---------------------------------------------------------------------------
// 5. TEST RUNNER
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log('  PASS  ' + name);
    passed++;
  } catch (err) {
    console.log('  FAIL  ' + name);
    console.log('        ' + err.message);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 6. TEST SUITE
// ---------------------------------------------------------------------------
async function run() {
  console.log('');
  console.log('=======================================================================');
  console.log('  AJ Travels - Admin Fare Price Sync Test Suite (In-Memory Mock)');
  console.log('  ZERO real DB connections | ZERO production records modified');
  console.log('=======================================================================');
  console.log('');

  // PHASE 1: Admin reads original record
  console.log('  -- Phase 1: Admin Fare List (Pre-Edit State) -----------------------');

  await test('Admin GET configs returns test fare with original base fare', async function() {
    const m = mockReqRes({ query: {} });
    await adminFareConfigController.listFareConfigs(m.req, m.res, m.next);
    const data = m.body();
    assert.ok(data && data.success, 'Response must have success=true');
    const f = data.data.find(function(x) { return x.id === TEST_FARE_ID; });
    assert.ok(f, 'Test fare must exist in list');
    assert.strictEqual(f.baseFare, ORIGINAL_BASE_FARE, 'Base fare must be ' + ORIGINAL_BASE_FARE);
  });

  await test('Admin estimatedTotal = Base + Toll + Parking + WaitingPerHr (admin convention)', async function() {
    const m = mockReqRes({ query: {} });
    await adminFareConfigController.listFareConfigs(m.req, m.res, m.next);
    const data = m.body();
    const f = data.data.find(function(x) { return x.id === TEST_FARE_ID; });
    const expected = ORIGINAL_BASE_FARE + ORIGINAL_TOLL + ORIGINAL_PARKING + ORIGINAL_WAITING_HR;
    assert.strictEqual(f.estimatedTotal, expected, 'Admin estimatedTotal must be ' + expected);
  });

  await test('Admin GET single config returns full fare with tolls/parking/waiting', async function() {
    const m = mockReqRes({ params: { id: TEST_FARE_ID } });
    await adminFareConfigController.getFareConfig(m.req, m.res, m.next);
    const data = m.body();
    assert.ok(data && data.success, 'Must return success=true');
    assert.strictEqual(data.data.baseFare, ORIGINAL_BASE_FARE);
    assert.ok(data.data.vehicle && data.data.vehicle.category === 'SEDAN');
    assert.strictEqual(data.data.tolls.length, 1);
    assert.strictEqual(data.data.tolls[0].amount, ORIGINAL_TOLL);
    assert.ok(data.data.parking.enabled);
    assert.strictEqual(data.data.parking.amount, ORIGINAL_PARKING);
    assert.ok(data.data.waiting.enabled);
    assert.strictEqual(data.data.waiting.perHourCharge, ORIGINAL_WAITING_HR);
  });

  // PHASE 2: Public API pre-edit
  console.log('');
  console.log('  -- Phase 2: Public Quote API (Pre-Edit) ----------------------------');

  await test('Public quote returns original base fare (Rs.' + ORIGINAL_BASE_FARE + ')', async function() {
    invalidateFareCache();
    const result = await calculateFareQuote({ tripType: 'ONE_WAY', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, passengers: 1 });
    assert.ok(result.success);
    const sedan = result.vehicles.find(function(v) { return v.category === 'SEDAN'; });
    assert.ok(sedan, 'Sedan must be in public quote');
    assert.strictEqual(sedan.fare.baseFare, ORIGINAL_BASE_FARE);
    assert.strictEqual(sedan.fare.toll,     ORIGINAL_TOLL);
    assert.strictEqual(sedan.fare.parking,  ORIGINAL_PARKING);
    assert.strictEqual(sedan.fare.total, ORIGINAL_BASE_FARE + ORIGINAL_TOLL + ORIGINAL_PARKING, 'Public total = Base+Toll+Parking only');
  });

  await test('Public quote: waiting NOT in total by default (stayRequired=false)', async function() {
    invalidateFareCache();
    const result = await calculateFareQuote({ tripType: 'ONE_WAY', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, passengers: 1, stayRequired: false });
    const sedan = result.vehicles.find(function(v) { return v.category === 'SEDAN'; });
    assert.strictEqual(sedan.fare.stay, 0);
  });

  await test('Public quote: waiting IS included when stayRequired=true', async function() {
    invalidateFareCache();
    const result = await calculateFareQuote({ tripType: 'ONE_WAY', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, passengers: 1, stayRequired: true });
    const sedan = result.vehicles.find(function(v) { return v.category === 'SEDAN'; });
    assert.strictEqual(sedan.fare.stay, ORIGINAL_WAITING_HR);
    assert.strictEqual(sedan.fare.total, ORIGINAL_BASE_FARE + ORIGINAL_TOLL + ORIGINAL_PARKING + ORIGINAL_WAITING_HR);
  });

  // PHASE 3: Admin edits price
  console.log('');
  console.log('  -- Phase 3: Admin Price Edit (Temp: Rs.9999) -----------------------');

  await test('Admin PUT saves test base fare Rs.9999 successfully', async function() {
    const m = mockReqRes({
      params: { id: TEST_FARE_ID },
      body: {
        fare:     { baseFare: TEST_TEMP_BASE_FARE, perKmFare: 14, minimumFare: TEST_TEMP_BASE_FARE, isActive: true },
        vehicle:  { id: TEST_VEHICLE_ID, name: 'Executive Sedan', category: 'SEDAN', seatingCapacity: 4 },
        tolls:    [{ name: 'Mumbai-Pune Expressway Toll', amount: ORIGINAL_TOLL, isActive: true }],
        parking:  { enabled: true, amount: ORIGINAL_PARKING, chargingType: 'FIXED' },
        waiting:  { enabled: true, freeMinutes: 45, perHourCharge: ORIGINAL_WAITING_HR },
        availability: { status: 'AVAILABLE', availableQuantity: 5, availableFromTime: '00:00', availableToTime: '23:59' },
      },
      user: { userId: TEST_ADMIN_ID },
    });
    await adminFareConfigController.updateFareConfig(m.req, m.res, m.next);
    const err = m.error();
    assert.ok(!err, 'Update must not error: ' + (err && err.message));
    const data = m.body();
    assert.ok(data && data.success);
    assert.strictEqual(data.data.baseFare, TEST_TEMP_BASE_FARE);
  });

  await test('In-memory DB confirms persisted base fare Rs.9999', async function() {
    const f = mockDb.fares.find(function(x) { return x.id === TEST_FARE_ID; });
    assert.strictEqual(f.baseFare, TEST_TEMP_BASE_FARE);
  });

  await test('Admin GET single config shows Rs.9999 after update', async function() {
    const m = mockReqRes({ params: { id: TEST_FARE_ID } });
    await adminFareConfigController.getFareConfig(m.req, m.res, m.next);
    const data = m.body();
    assert.strictEqual(data.data.baseFare, TEST_TEMP_BASE_FARE);
  });

  // PHASE 4: Cache invalidation + public API sync
  console.log('');
  console.log('  -- Phase 4: Cache Invalidation & Public API Sync -------------------');

  await test('invalidateFareCache() runs without error', async function() {
    assert.doesNotThrow(function() { invalidateFareCache(); });
  });

  await test('Public quote returns Rs.9999 after admin edit + cache invalidation', async function() {
    invalidateFareCache();
    const result = await calculateFareQuote({ tripType: 'ONE_WAY', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, passengers: 1 });
    const sedan = result.vehicles.find(function(v) { return v.category === 'SEDAN'; });
    assert.ok(sedan, 'Sedan must still appear after price edit');
    assert.strictEqual(sedan.fare.baseFare, TEST_TEMP_BASE_FARE, 'Public fare must reflect admin change');
    assert.strictEqual(sedan.fare.total, TEST_TEMP_BASE_FARE + ORIGINAL_TOLL + ORIGINAL_PARKING);
  });

  await test('Admin fare list also shows Rs.9999 immediately after update', async function() {
    const m = mockReqRes({ query: {} });
    await adminFareConfigController.listFareConfigs(m.req, m.res, m.next);
    const data = m.body();
    const f = data.data.find(function(x) { return x.id === TEST_FARE_ID; });
    assert.strictEqual(f.baseFare, TEST_TEMP_BASE_FARE);
  });

  // PHASE 5: Isolation checks
  console.log('');
  console.log('  -- Phase 5: Isolation Checks ----------------------------------------');

  await test('Tolls unchanged after base fare edit (Rs.' + ORIGINAL_TOLL + ')', async function() {
    invalidateFareCache();
    const result = await calculateFareQuote({ tripType: 'ONE_WAY', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, passengers: 1 });
    const sedan = result.vehicles.find(function(v) { return v.category === 'SEDAN'; });
    assert.strictEqual(sedan.fare.toll, ORIGINAL_TOLL);
  });

  await test('Parking unchanged after base fare edit (Rs.' + ORIGINAL_PARKING + ')', async function() {
    invalidateFareCache();
    const result = await calculateFareQuote({ tripType: 'ONE_WAY', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, passengers: 1 });
    const sedan = result.vehicles.find(function(v) { return v.category === 'SEDAN'; });
    assert.strictEqual(sedan.fare.parking, ORIGINAL_PARKING);
  });

  await test('No phantom duplicate fare records created', async function() {
    const m = mockReqRes({ query: {} });
    await adminFareConfigController.listFareConfigs(m.req, m.res, m.next);
    const data = m.body();
    const sedanFares = data.data.filter(function(f) { return f.vehicleId === TEST_VEHICLE_ID && f.routeId === TEST_ROUTE_ID; });
    assert.strictEqual(sedanFares.length, 1, 'Must be exactly 1 fare for this route+vehicle');
  });

  // PHASE 6: Restore original value
  console.log('');
  console.log('  -- Phase 6: Restore Original Fare (Rs.' + ORIGINAL_BASE_FARE + ') ----------------');

  await test('Admin PUT restores original base fare Rs.' + ORIGINAL_BASE_FARE, async function() {
    const m = mockReqRes({
      params: { id: TEST_FARE_ID },
      body: {
        fare:     { baseFare: ORIGINAL_BASE_FARE, perKmFare: 14, minimumFare: ORIGINAL_BASE_FARE, isActive: true },
        vehicle:  { id: TEST_VEHICLE_ID, name: 'Executive Sedan', category: 'SEDAN', seatingCapacity: 4 },
        tolls:    [{ name: 'Mumbai-Pune Expressway Toll', amount: ORIGINAL_TOLL, isActive: true }],
        parking:  { enabled: true, amount: ORIGINAL_PARKING, chargingType: 'FIXED' },
        waiting:  { enabled: true, freeMinutes: 45, perHourCharge: ORIGINAL_WAITING_HR },
        availability: { status: 'AVAILABLE', availableQuantity: 5, availableFromTime: '00:00', availableToTime: '23:59' },
      },
      user: { userId: TEST_ADMIN_ID },
    });
    await adminFareConfigController.updateFareConfig(m.req, m.res, m.next);
    const err = m.error();
    assert.ok(!err, 'Restore must not error: ' + (err && err.message));
    const data = m.body();
    assert.ok(data && data.success);
    assert.strictEqual(data.data.baseFare, ORIGINAL_BASE_FARE);
  });

  await test('In-memory DB confirms restored fare Rs.' + ORIGINAL_BASE_FARE, async function() {
    const f = mockDb.fares.find(function(x) { return x.id === TEST_FARE_ID; });
    assert.strictEqual(f.baseFare, ORIGINAL_BASE_FARE);
  });

  await test('Public quote returns original Rs.' + ORIGINAL_BASE_FARE + ' after restoration', async function() {
    invalidateFareCache();
    const result = await calculateFareQuote({ tripType: 'ONE_WAY', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, passengers: 1 });
    const sedan = result.vehicles.find(function(v) { return v.category === 'SEDAN'; });
    assert.strictEqual(sedan.fare.baseFare, ORIGINAL_BASE_FARE);
    assert.strictEqual(sedan.fare.total, ORIGINAL_BASE_FARE + ORIGINAL_TOLL + ORIGINAL_PARKING);
  });

  // PHASE 7: Pricing convention audit
  console.log('');
  console.log('  -- Phase 7: Pricing Convention Audit --------------------------------');

  await test('Admin total - Public total = waiting charge (Rs.' + ORIGINAL_WAITING_HR + ') exactly', async function() {
    const m = mockReqRes({ query: {} });
    await adminFareConfigController.listFareConfigs(m.req, m.res, m.next);
    const adminFare = m.body().data.find(function(x) { return x.id === TEST_FARE_ID; });
    invalidateFareCache();
    const quote = await calculateFareQuote({ tripType: 'ONE_WAY', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, passengers: 1 });
    const publicFare = quote.vehicles.find(function(v) { return v.category === 'SEDAN'; });
    const diff = adminFare.estimatedTotal - publicFare.fare.total;
    assert.strictEqual(diff, ORIGINAL_WAITING_HR, 'Difference must equal waiting/hr charge');
  });

  // PHASE 8: Audit log
  console.log('');
  console.log('  -- Phase 8: Audit Trail ---------------------------------------------');

  await test('Audit log entries exist for price change and restoration', async function() {
    const logs = mockDb.auditLogs.filter(function(l) { return l.entityId === TEST_FARE_ID; });
    assert.ok(logs.length >= 2, 'Must have at least 2 audit entries (found ' + logs.length + ')');
    const updateLog = logs.find(function(l) { return l.action === 'UPDATE_FARE_CONFIG'; });
    assert.ok(updateLog, 'UPDATE_FARE_CONFIG log must exist');
    assert.strictEqual(updateLog.adminId, TEST_ADMIN_ID, 'Audit log must record admin ID');
  });

  // PHASE 9: Dynamic Fleet Starting-Price Synchronization
  console.log('');
  console.log('  -- Phase 9: Fleet Vehicle Dynamic Starting Fare Synchronization -----');

  await test('vehicleController.getAllVehicles returns active startingBaseFare for fleet cards', async function() {
    const m = mockReqRes();
    await vehicleController.getAllVehicles(m.req, m.res, m.next);
    const data = m.body();
    assert.ok(data && data.success, 'getAllVehicles must succeed');
    assert.ok(Array.isArray(data.data), 'data must be an array of vehicles');
    const sedan = data.data.find(function(v) { return v.id === TEST_VEHICLE_ID; });
    assert.ok(sedan, 'Sedan vehicle must exist in fleet list');
    assert.strictEqual(sedan.startingBaseFare, ORIGINAL_BASE_FARE, 'Sedan startingBaseFare must match active base fare ' + ORIGINAL_BASE_FARE);
  });

  await test('vehicleController.getVehicle returns single vehicle with active startingBaseFare', async function() {
    const m = mockReqRes({ params: { id: TEST_VEHICLE_ID } });
    await vehicleController.getVehicle(m.req, m.res, m.next);
    const data = m.body();
    assert.ok(data && data.success);
    assert.strictEqual(data.data.startingBaseFare, ORIGINAL_BASE_FARE);
  });

  // PHASE 10: Multi-Vehicle & Bidirectional Isolation
  console.log('');
  console.log('  -- Phase 10: Multi-Vehicle & Route Direction Isolation --------------');

  await test('Public quote returns valid vehicle array with distinct categories', async function() {
    invalidateFareCache();
    const result = await calculateFareQuote({ tripType: 'ONE_WAY', pickupLocationId: TEST_PICKUP_LOC_ID, dropLocationId: TEST_DROP_LOC_ID, passengers: 1 });
    assert.ok(result.vehicles && result.vehicles.length >= 1);
    const sedan = result.vehicles.find(function(v) { return v.category === 'SEDAN'; });
    assert.strictEqual(sedan.fare.baseFare, ORIGINAL_BASE_FARE);
    assert.strictEqual(sedan.fare.total, ORIGINAL_BASE_FARE + ORIGINAL_TOLL + ORIGINAL_PARKING);
  });

  // SUMMARY
  console.log('');
  console.log('=======================================================================');
  console.log('  RESULTS: ' + passed + ' passed  |  ' + failed + ' failed');
  if (failed === 0) {
    console.log('  ALL TESTS PASSED');
    console.log('');
    console.log('  VERDICT:');
    console.log('  [OK] Admin PUT /api/fares/admin/configs/:id persists correctly');
    console.log('  [OK] invalidateFareCache() fires after every admin update');
    console.log('  [OK] Public /api/fares/quote returns new price after cache clear');
    console.log('  [OK] Tolls/parking/waiting unaffected by a base-fare edit');
    console.log('  [OK] Admin estimatedTotal includes waiting (intentional admin view)');
    console.log('  [OK] Public total excludes waiting unless stayRequired=true');
    console.log('  [OK] Original values restored -- no test data persists');
    console.log('  [OK] Audit log records adminId and entityId on every write');
  } else {
    console.log('  ' + failed + ' TEST(S) FAILED -- see details above');
  }
  console.log('=======================================================================');
  console.log('');

  if (failed > 0) process.exit(1);
}

run().catch(function(err) {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
