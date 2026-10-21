/**
 * ============================================================================
 * AJ Travels — Quotation Workflow Comprehensive E2E Verification Suite
 * ============================================================================
 * MODE: Mocked In-Memory Prisma & Controller Isolation
 * ZERO remote database interactions. ZERO real records touched or modified.
 * ZERO WhatsApp, SMS, or email notifications triggered.
 * ============================================================================
 */

const assert = require('assert');
const path = require('path');

// ── 1. Set Up In-Memory Mock Database ──────────────────────────────────────
const mockDb = {
  enquiries: [
    {
      id: 'enq-uuid-101',
      name: 'Rohan Sharma',
      phone: '+919876543210',
      email: 'rohan.sharma@example.com',
      pickup: 'Kothrud, Pune',
      destination: 'Bandra West, Mumbai',
      travelDate: '2026-11-05',
      status: 'NEW',
      notes: 'Customer requesting executive sedan for family trip',
      createdAt: new Date('2026-10-21T09:00:00Z'),
    },
    {
      id: 'enq-uuid-102',
      name: 'Pooja Kulkarni',
      phone: '+919822334455',
      email: 'pooja.k@example.com',
      pickup: 'Viman Nagar, Pune',
      destination: 'Navi Mumbai',
      travelDate: '2026-11-10',
      status: 'NEW',
      notes: 'Corporate travel enquiry',
      createdAt: new Date('2026-10-21T09:30:00Z'),
    },
  ],
  quotes: [
    // Pre-existing quotes for enq-101 to verify selective superseding:
    {
      id: 'quote-uuid-existing-declined',
      enquiryId: 'enq-uuid-101',
      vehicleCategory: 'Sedan',
      vehicleName: 'Swift Dzire',
      tripType: 'ONE_WAY',
      baseFare: 2600,
      tollCharges: 400,
      driverAllowance: 0,
      parkingCharges: 0,
      totalFare: 3000,
      status: 'DECLINED',
      quoteToken: 'tok-declined-123456789012345678901234',
      validUntil: new Date(Date.now() + 86400000),
      declinedAt: new Date(),
      declinedReason: 'Customer asked for SUV instead',
      createdAt: new Date('2026-10-20T10:00:00Z'),
    },
    // Pre-existing quote for enq-102 to verify enquiry boundary isolation:
    {
      id: 'quote-uuid-other-enquiry',
      enquiryId: 'enq-uuid-102',
      vehicleCategory: 'Sedan',
      vehicleName: 'Etios',
      tripType: 'ONE_WAY',
      baseFare: 2700,
      tollCharges: 400,
      driverAllowance: 0,
      parkingCharges: 0,
      totalFare: 3100,
      status: 'QUOTED',
      quoteToken: 'tok-enq102-123456789012345678901234',
      validUntil: new Date(Date.now() + 86400000),
      createdAt: new Date('2026-10-21T08:00:00Z'),
    },
  ],
  bookings: [],
};

// ── 2. Mock Prisma Client Implementation ──────────────────────────────────
let idCounter = 1;
const generateId = (prefix) => `${prefix}-${idCounter++}-${Date.now().toString().slice(-4)}`;

const mockPrisma = {
  enquiry: {
    findUnique: async ({ where }) => {
      return mockDb.enquiries.find((e) => e.id === where.id) || null;
    },
    update: async ({ where, data }) => {
      const enq = mockDb.enquiries.find((e) => e.id === where.id);
      if (!enq) throw new Error(`Enquiry ${where.id} not found`);
      Object.assign(enq, data);
      return { ...enq };
    },
  },
  quote: {
    findUnique: async ({ where, include }) => {
      let q = null;
      if (where.id) q = mockDb.quotes.find((item) => item.id === where.id);
      if (where.quoteToken) q = mockDb.quotes.find((item) => item.quoteToken === where.quoteToken);
      if (!q) return null;
      const copy = { ...q };
      if (include?.enquiry) {
        copy.enquiry = mockDb.enquiries.find((e) => e.id === q.enquiryId) || null;
      }
      return copy;
    },
    findMany: async ({ where, orderBy, include }) => {
      let result = mockDb.quotes.filter((q) => {
        if (where.enquiryId && q.enquiryId !== where.enquiryId) return false;
        if (where.status && q.status !== where.status) return false;
        return true;
      });
      if (orderBy?.createdAt === 'desc') {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return result.map((q) => {
        const copy = { ...q };
        if (include?.booking) {
          copy.booking = mockDb.bookings.find((b) => b.id === q.bookingId) || null;
        }
        return copy;
      });
    },
    create: async ({ data }) => {
      const newQuote = {
        id: generateId('quote-uuid'),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.quotes.push(newQuote);
      return { ...newQuote };
    },
    update: async ({ where, data }) => {
      const q = mockDb.quotes.find((item) => item.id === where.id);
      if (!q) throw new Error(`Quote ${where.id} not found`);
      Object.assign(q, data, { updatedAt: new Date() });
      return { ...q };
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      mockDb.quotes.forEach((q) => {
        let match = true;
        if (where.enquiryId && q.enquiryId !== where.enquiryId) match = false;
        if (where.status && q.status !== where.status) match = false;
        if (match) {
          Object.assign(q, data, { updatedAt: new Date() });
          count++;
        }
      });
      return { count };
    },
  },
  booking: {
    create: async ({ data }) => {
      const newBooking = {
        id: generateId('booking-uuid'),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.bookings.push(newBooking);
      return { ...newBooking };
    },
  },
  $transaction: async (callback) => {
    // Execute callback passing transactional mock instance
    return await callback(mockPrisma);
  },
};

// ── 3. Inject Mock Prisma into Require Cache Before Loading Controllers ────
const prismaModulePath = path.resolve(__dirname, '../src/utils/prisma');
require.cache[require.resolve(prismaModulePath)] = {
  id: require.resolve(prismaModulePath),
  filename: require.resolve(prismaModulePath),
  loaded: true,
  exports: mockPrisma,
};

// Now require controller — it will use the mocked Prisma client
const quoteController = require('../src/controllers/quoteController');

// ── 4. Express Mock Helpers ────────────────────────────────────────────────
function createMockReqRes({ params = {}, body = {}, query = {} } = {}) {
  const req = { params, body, query };
  let statusCode = 200;
  let jsonResponse = null;
  let errorResponse = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (payload) => {
      jsonResponse = payload;
      return res;
    },
  };

  const next = (err) => {
    errorResponse = err;
  };

  return {
    req,
    res,
    next,
    getStatusCode: () => (errorResponse ? (errorResponse.statusCode || 500) : statusCode),
    getBody: () => (errorResponse ? { error: errorResponse.message, statusCode: errorResponse.statusCode || 500 } : jsonResponse),
    getError: () => errorResponse,
  };
}

// ── 5. Test Suite Execution ────────────────────────────────────────────────
async function runTestSuite() {
  const results = [];
  console.log('======================================================================');
  console.log('AJ Travels — Quotation Workflow Verification Suite (Mocked Prisma)');
  console.log('======================================================================\n');

  let quote1 = null;
  let quote2 = null;

  // --------------------------------------------------------------------------
  // TEST CASE 1: A new quotation can be prepared for an enquiry
  // --------------------------------------------------------------------------
  try {
    const { req, res, next, getStatusCode, getBody } = createMockReqRes({
      params: { id: 'enq-uuid-101' },
      body: {
        vehicleCategory: 'Sedan',
        vehicleName: 'Maruti Dzire',
        tripType: 'ONE_WAY',
        baseFare: 2800,
        tollCharges: 450,
        driverAllowance: 0,
        parkingCharges: 0,
        inclusions: 'Tolls and driver included',
        validHours: 48,
      },
    });

    await quoteController.prepareQuote(req, res, next);
    const status = getStatusCode();
    const body = getBody();

    assert.strictEqual(status, 201, `Expected status 201, got ${status}`);
    assert.strictEqual(body.success, true, 'Expected success: true');
    assert.strictEqual(body.data.status, 'QUOTED', 'Quote status must be QUOTED');
    assert.strictEqual(body.data.totalFare, 3250, 'Total fare must be 2800 + 450 = 3250');
    assert.ok(body.data.quoteToken && body.data.quoteToken.length >= 32, 'Unguessable token generated');

    // Verify enquiry status is CONTACTED
    const enq = mockDb.enquiries.find((e) => e.id === 'enq-uuid-101');
    assert.strictEqual(enq.status, 'CONTACTED', 'Enquiry status must transition to CONTACTED');

    quote1 = body.data;
    results.push({
      id: 1,
      title: 'A new quotation can be prepared for an enquiry',
      status: 'PASS',
      evidence: `Quotation #${quote1.id} issued with status QUOTED, token length ${quote1.quoteToken.length}, total ₹${quote1.totalFare}. Enquiry status -> CONTACTED.`,
    });
  } catch (err) {
    results.push({ id: 1, title: 'A new quotation can be prepared for an enquiry', status: 'FAIL', evidence: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST CASE 2: Issuing a second quotation supersedes only the previous quotations
  //              still in QUOTED status for the same enquiry
  // --------------------------------------------------------------------------
  try {
    const { req, res, next, getStatusCode, getBody } = createMockReqRes({
      params: { id: 'enq-uuid-101' },
      body: {
        vehicleCategory: 'SUV',
        vehicleName: 'Innova Crysta',
        tripType: 'ONE_WAY',
        baseFare: 4500,
        tollCharges: 450,
        driverAllowance: 300,
        parkingCharges: 100,
        validHours: 72,
      },
    });

    await quoteController.prepareQuote(req, res, next);
    const status = getStatusCode();
    const body = getBody();

    assert.strictEqual(status, 201, `Expected status 201, got ${status}`);
    quote2 = body.data;

    // 1. Check quote1 is now SUPERSEDED
    const updatedQuote1 = mockDb.quotes.find((q) => q.id === quote1.id);
    assert.strictEqual(updatedQuote1.status, 'SUPERSEDED', 'quote1 must be superseded');

    // 2. Check pre-existing DECLINED quote for enq-101 was NOT changed to SUPERSEDED
    const declinedQuote = mockDb.quotes.find((q) => q.id === 'quote-uuid-existing-declined');
    assert.strictEqual(declinedQuote.status, 'DECLINED', 'Pre-existing DECLINED quote must remain DECLINED');

    // 3. Check QUOTED quote for DIFFERENT enquiry (enq-102) was NOT changed to SUPERSEDED
    const otherEnqQuote = mockDb.quotes.find((q) => q.id === 'quote-uuid-other-enquiry');
    assert.strictEqual(otherEnqQuote.status, 'QUOTED', 'Quote for enq-102 must remain QUOTED');

    // 4. Check quote2 is active QUOTED
    assert.strictEqual(quote2.status, 'QUOTED', 'New quote2 must have status QUOTED');

    results.push({
      id: 2,
      title: 'Issuing a second quotation supersedes only previous QUOTED quotes for same enquiry',
      status: 'PASS',
      evidence: `quote1 transitioned QUOTED -> SUPERSEDED. Pre-existing DECLINED quote remained DECLINED. Quote for enquiry 102 remained QUOTED. New quote #${quote2.id} created as QUOTED.`,
    });
  } catch (err) {
    results.push({ id: 2, title: 'Issuing a second quotation supersedes only previous QUOTED quotes for same enquiry', status: 'FAIL', evidence: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST CASE 3: A superseded quotation cannot be accepted or declined
  // --------------------------------------------------------------------------
  try {
    // Attempt 1: Accept superseded quote1
    const { req: reqAccept, res: resAccept, next: nextAccept, getStatusCode: getCodeAccept, getBody: getBodyAccept } = createMockReqRes({
      params: { token: quote1.quoteToken },
    });
    await quoteController.acceptQuote(reqAccept, resAccept, nextAccept);
    assert.strictEqual(getCodeAccept(), 400, `Expected 400 when accepting superseded quote, got ${getCodeAccept()}`);
    assert.ok(getBodyAccept().error.includes('superseded'), 'Error message must mention superseded');

    // Attempt 2: Decline superseded quote1
    const { req: reqDecline, res: resDecline, next: nextDecline, getStatusCode: getCodeDecline, getBody: getBodyDecline } = createMockReqRes({
      params: { token: quote1.quoteToken },
      body: { reason: 'Price too high' },
    });
    await quoteController.declineQuote(reqDecline, resDecline, nextDecline);
    assert.strictEqual(getCodeDecline(), 400, `Expected 400 when declining superseded quote, got ${getCodeDecline()}`);
    assert.ok(getBodyDecline().error.includes('superseded'), 'Error message must mention superseded');

    results.push({
      id: 3,
      title: 'A superseded quotation cannot be accepted or declined through backend API',
      status: 'PASS',
      evidence: `HTTP 400 returned on accept: "${getBodyAccept().error}". HTTP 400 returned on decline: "${getBodyDecline().error}".`,
    });
  } catch (err) {
    results.push({ id: 3, title: 'A superseded quotation cannot be accepted or declined through backend API', status: 'FAIL', evidence: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST CASE 4: The latest valid quotation can be accepted
  // --------------------------------------------------------------------------
  try {
    const { req, res, next, getStatusCode, getBody } = createMockReqRes({
      params: { token: quote2.quoteToken },
    });
    await quoteController.acceptQuote(req, res, next);
    assert.strictEqual(getStatusCode(), 200, `Expected 200 on accepting latest quote, got ${getStatusCode()}`);
    assert.strictEqual(getBody().success, true);
    assert.strictEqual(getBody().data.status, 'ACCEPTED');
    assert.ok(getBody().data.acceptedAt, 'acceptedAt date must be recorded');

    // Verify DB reflection
    const acceptedInDb = mockDb.quotes.find((q) => q.id === quote2.id);
    assert.strictEqual(acceptedInDb.status, 'ACCEPTED');

    results.push({
      id: 4,
      title: 'The latest valid quotation can be accepted',
      status: 'PASS',
      evidence: `HTTP 200 OK. Quotation #${quote2.id} transitioned QUOTED -> ACCEPTED with timestamp ${getBody().data.acceptedAt}.`,
    });
  } catch (err) {
    results.push({ id: 4, title: 'The latest valid quotation can be accepted', status: 'FAIL', evidence: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST CASE 5: Expired and declined quotations follow existing eligibility rules
  // --------------------------------------------------------------------------
  try {
    // 5a. Create an explicitly expired quote in mock DB
    const expiredQuote = {
      id: 'quote-uuid-expired-test',
      enquiryId: 'enq-uuid-101',
      vehicleCategory: 'Sedan',
      status: 'QUOTED',
      totalFare: 3000,
      quoteToken: 'tok-expired-123456789012345678901234',
      validUntil: new Date(Date.now() - 3600000), // 1 hour ago
      createdAt: new Date(Date.now() - 86400000),
    };
    mockDb.quotes.push(expiredQuote);

    const { req: reqExp, res: resExp, next: nextExp, getStatusCode: getCodeExp, getBody: getBodyExp } = createMockReqRes({
      params: { token: expiredQuote.quoteToken },
    });
    await quoteController.acceptQuote(reqExp, resExp, nextExp);
    assert.strictEqual(getCodeExp(), 400, 'Expired quote must return 400');
    assert.ok(getBodyExp().error.includes('expired'), 'Error message must mention expired');

    // 5b. Attempt to accept previously declined quote
    const { req: reqDec, res: resDec, next: nextDec, getStatusCode: getCodeDec, getBody: getBodyDec } = createMockReqRes({
      params: { token: 'tok-declined-123456789012345678901234' },
    });
    await quoteController.acceptQuote(reqDec, resDec, nextDec);
    assert.strictEqual(getCodeDec(), 400, 'Declined quote must return 400 on acceptance');
    assert.ok(getBodyDec().error.includes('previously declined'), 'Error message must mention previously declined');

    // 5c. Attempt to decline an already accepted quote (quote2)
    const { req: reqDecAcc, res: resDecAcc, next: nextDecAcc, getStatusCode: getCodeDecAcc, getBody: getBodyDecAcc } = createMockReqRes({
      params: { token: quote2.quoteToken },
      body: { reason: 'Changed mind' },
    });
    await quoteController.declineQuote(reqDecAcc, resDecAcc, nextDecAcc);
    assert.strictEqual(getCodeDecAcc(), 400, 'Accepted quote cannot be declined');
    assert.ok(getBodyDecAcc().error.includes('already accepted'), 'Error message must state already accepted');

    // 5d. Idempotent acceptance on already accepted quote (quote2)
    const { req: reqIdemp, res: resIdemp, next: nextIdemp, getStatusCode: getCodeIdemp, getBody: getBodyIdemp } = createMockReqRes({
      params: { token: quote2.quoteToken },
    });
    await quoteController.acceptQuote(reqIdemp, resIdemp, nextIdemp);
    assert.strictEqual(getCodeIdemp(), 200, 'Idempotent accept must return 200');
    assert.ok(getBodyIdemp().message.includes('already been accepted'));

    results.push({
      id: 5,
      title: 'Expired and declined quotations follow existing eligibility rules',
      status: 'PASS',
      evidence: 'Expired quote rejected (400), previously declined quote rejected (400), accepted quote cannot be declined (400), idempotent re-accept returns 200.',
    });
  } catch (err) {
    results.push({ id: 5, title: 'Expired and declined quotations follow existing eligibility rules', status: 'FAIL', evidence: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST CASE 6: An accepted quotation can be converted into only one booking
  // --------------------------------------------------------------------------
  let bookingCreated = null;
  try {
    const { req, res, next, getStatusCode, getBody } = createMockReqRes({
      params: { id: 'enq-uuid-101', quoteId: quote2.id },
    });
    await quoteController.convertToBooking(req, res, next);
    assert.strictEqual(getStatusCode(), 201, `Expected 201 on booking conversion, got ${getStatusCode()}`);
    assert.strictEqual(getBody().success, true);
    bookingCreated = getBody().data;
    assert.ok(bookingCreated.id, 'Booking ID must be present');
    assert.strictEqual(bookingCreated.status, 'CONFIRMED');
    assert.strictEqual(bookingCreated.enquiryId, 'enq-uuid-101');
    assert.strictEqual(bookingCreated.quoteId, quote2.id);
    assert.strictEqual(bookingCreated.fareTotal, quote2.totalFare);

    // Verify quote has bookingId
    const quoteInDb = mockDb.quotes.find((q) => q.id === quote2.id);
    assert.strictEqual(quoteInDb.bookingId, bookingCreated.id);

    // Verify enquiry status is RESOLVED
    const enqInDb = mockDb.enquiries.find((e) => e.id === 'enq-uuid-101');
    assert.strictEqual(enqInDb.status, 'RESOLVED');

    results.push({
      id: 6,
      title: 'An accepted quotation can be converted into only one booking',
      status: 'PASS',
      evidence: `Booking #${bookingCreated.id} confirmed for ₹${bookingCreated.fareTotal}. Quote #${quote2.id}.bookingId updated. Enquiry status -> RESOLVED.`,
    });
  } catch (err) {
    results.push({ id: 6, title: 'An accepted quotation can be converted into only one booking', status: 'FAIL', evidence: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST CASE 7: Repeated conversion requests cannot create duplicate bookings
  // --------------------------------------------------------------------------
  try {
    const initialBookingCount = mockDb.bookings.length;
    const { req, res, next, getStatusCode, getBody } = createMockReqRes({
      params: { id: 'enq-uuid-101', quoteId: quote2.id },
    });
    await quoteController.convertToBooking(req, res, next);
    assert.strictEqual(getStatusCode(), 409, `Expected 409 Conflict on repeated conversion, got ${getStatusCode()}`);
    assert.ok(getBody().error.includes('already been created'), 'Error message must state booking already created');
    assert.strictEqual(mockDb.bookings.length, initialBookingCount, 'No duplicate booking record may be inserted');

    results.push({
      id: 7,
      title: 'Repeated conversion requests cannot create duplicate bookings',
      status: 'PASS',
      evidence: `HTTP 409 Conflict strictly returned: "${getBody().error}". Booking count unchanged (${initialBookingCount}).`,
    });
  } catch (err) {
    results.push({ id: 7, title: 'Repeated conversion requests cannot create duplicate bookings', status: 'FAIL', evidence: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST CASE 8: Fare totals are calculated correctly from configured components
  // --------------------------------------------------------------------------
  try {
    // Test that client-supplied total is completely ignored and server sums baseFare + tollCharges + driverAllowance + parkingCharges
    const { req, res, next, getStatusCode, getBody } = createMockReqRes({
      params: { id: 'enq-uuid-102' },
      body: {
        vehicleCategory: 'SUV Prime',
        vehicleName: 'Innova Crysta Luxury',
        tripType: 'ROUND_TRIP',
        baseFare: 5500.50,
        tollCharges: 750.25,
        driverAllowance: 500.00,
        parkingCharges: 250.25,
        totalFare: 1.00, // malicious or mismatched total
      },
    });

    await quoteController.prepareQuote(req, res, next);
    assert.strictEqual(getStatusCode(), 201);
    const calculatedTotal = getBody().data.totalFare;
    // 5500.50 + 750.25 + 500.00 + 250.25 = 7001.00
    assert.strictEqual(calculatedTotal, 7001.00, `Expected 7001.00, calculated: ${calculatedTotal}`);

    results.push({
      id: 8,
      title: 'Fare totals are calculated correctly from configured fare components',
      status: 'PASS',
      evidence: `Component breakdown: Base (5500.50) + Toll (750.25) + Driver (500.00) + Parking (250.25) = ₹7001.00. Tampered totalFare (1.00) was ignored.`,
    });
  } catch (err) {
    results.push({ id: 8, title: 'Fare totals are calculated correctly from configured fare components', status: 'FAIL', evidence: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST CASE 9: Customer quotation page displays correct status, price and terms
  // --------------------------------------------------------------------------
  try {
    const { req, res, next, getStatusCode, getBody } = createMockReqRes({
      params: { token: quote2.quoteToken },
    });
    await quoteController.getPublicQuoteByToken(req, res, next);
    assert.strictEqual(getStatusCode(), 200);
    const data = getBody().data;

    // Verify sanitized payload
    assert.ok(data.quoteRef, 'quoteRef formatted');
    assert.strictEqual(data.customerName, 'Rohan Sharma');
    assert.ok(data.maskedPhone.includes('•••••'), 'Phone number properly masked');
    assert.strictEqual(data.pickup, 'Kothrud, Pune');
    assert.strictEqual(data.destination, 'Bandra West, Mumbai');
    assert.strictEqual(data.totalFare, quote2.totalFare);
    assert.strictEqual(data.status, 'ACCEPTED');
    assert.ok(data.inclusions, 'Inclusions present');
    assert.ok(data.exclusions, 'Exclusions present');
    assert.ok(data.terms, 'Terms present');
    // Ensure sensitive fields are omitted
    assert.strictEqual(data.quoteToken, undefined, 'Private quoteToken must not be in data object');
    assert.strictEqual(data.bookingId, undefined, 'Internal bookingId must not be exposed');

    results.push({
      id: 9,
      title: 'Customer quotation page displays correct status, price and terms',
      status: 'PASS',
      evidence: `Public sanitized payload returned: Ref #${data.quoteRef}, Masked Phone ${data.maskedPhone}, Total ₹${data.totalFare}, Status "${data.status}". No sensitive tokens leaked.`,
    });
  } catch (err) {
    results.push({ id: 9, title: 'Customer quotation page displays correct status, price and terms', status: 'FAIL', evidence: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST CASE 10: Existing direct booking and unrelated WhatsApp functionality remain unchanged
  // --------------------------------------------------------------------------
  try {
    const bookingController = require('../src/controllers/bookingController');
    const otpController = require('../src/controllers/otpController');
    const otpService = require('../src/services/otpService');
    const whatsappService = require('../src/services/whatsappService');

    assert.strictEqual(typeof bookingController.createBooking, 'function', 'Direct createBooking exists');
    assert.strictEqual(typeof bookingController.adminGetBookings, 'function', 'adminGetBookings exists');
    assert.strictEqual(typeof otpController.requestOtp, 'function', 'requestOtp exists');
    assert.strictEqual(typeof otpController.verifyOtp, 'function', 'verifyOtp exists');
    assert.strictEqual(typeof otpService.validateAndConsumeToken, 'function', 'OTP validation exists');
    assert.strictEqual(typeof whatsappService.sendBookingNotification, 'function', 'WhatsApp booking notification exists');

    // Verify quoteController has no direct invocation of whatsappService
    const quoteControllerSource = require('fs').readFileSync(
      path.resolve(__dirname, '../src/controllers/quoteController.js'),
      'utf8'
    );
    assert.ok(!quoteControllerSource.includes("require('../services/whatsappService')"), 'quoteController does not import whatsappService');
    assert.ok(!quoteControllerSource.includes('sendWhatsAppMessage'), 'quoteController does not send WhatsApp messages');

    results.push({
      id: 10,
      title: 'Existing direct booking and unrelated WhatsApp functionality remain unchanged',
      status: 'PASS',
      evidence: 'Direct booking handlers and WhatsApp OTP services verified intact. quoteController is completely decoupled from WhatsApp messaging.',
    });
  } catch (err) {
    results.push({ id: 10, title: 'Existing direct booking and unrelated WhatsApp functionality remain unchanged', status: 'FAIL', evidence: err.message });
  }

  // ── Print Results Table ──────────────────────────────────────────────────
  console.log('----------------------------------------------------------------------');
  console.log('TEST RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------------');
  let passCount = 0;
  for (const r of results) {
    if (r.status === 'PASS') passCount++;
    console.log(`[${r.status}] Case ${r.id}: ${r.title}`);
    console.log(`       Evidence: ${r.evidence}\n`);
  }
  console.log('======================================================================');
  console.log(`TOTAL: ${results.length} | PASSED: ${passCount} | FAILED: ${results.length - passCount}`);
  console.log('======================================================================');

  if (passCount !== results.length) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
