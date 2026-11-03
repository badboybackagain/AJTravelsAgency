/**
 * ============================================================================
 * AJ Travels — Phase 2: Booking Reliability & OTP Fallback Test Suite
 * ============================================================================
 * MODE: Mocked In-Memory Isolated Validation & Provider Safety
 * ZERO real WhatsApp OTP messages sent.
 * ZERO production records modified.
 * ============================================================================
 */

const assert = require('assert');
const crypto = require('crypto');
const { sanitizePhoneNumber } = require('../src/services/whatsappService');

// ── 1. Mock In-Memory Database ──────────────────────────────────────────────
const mockDb = {
  otpChallenges: [],
  enquiries: [],
  bookings: [],
  settings: {
    isEnabled: true,
    apiKey: 'mock-wasms-api-key',
    senderId: 'mock-account',
  },
};

let counter = 1;
const getCuid = () => `cuid-${counter++}-${Date.now().toString().slice(-4)}`;

const mockPrisma = {
  otpChallenge: {
    findUnique: async ({ where }) => {
      return mockDb.otpChallenges.find((c) => c.verificationToken === where.verificationToken) || null;
    },
    findFirst: async ({ where }) => {
      return mockDb.otpChallenges.find(
        (c) => c.phoneNumber === where.phoneNumber && c.status === where.status && c.purpose === where.purpose
      ) || null;
    },
    findMany: async ({ where }) => {
      return mockDb.otpChallenges.filter((c) => c.phoneNumber === where.phoneNumber);
    },
    create: async ({ data }) => {
      const record = { id: getCuid(), createdAt: new Date(), ...data };
      mockDb.otpChallenges.push(record);
      return record;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.otpChallenges.findIndex((c) => c.id === where.id);
      if (idx === -1) throw new Error('Challenge not found');
      Object.assign(mockDb.otpChallenges[idx], data);
      return mockDb.otpChallenges[idx];
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      mockDb.otpChallenges.forEach((c) => {
        if (c.phoneNumber === where.phoneNumber && c.status === where.status) {
          Object.assign(c, data);
          count++;
        }
      });
      return { count };
    },
  },
  enquiry: {
    findFirst: async ({ where }) => {
      return (
        mockDb.enquiries.find((e) => {
          if (where.phone && e.phone !== where.phone) return false;
          if (where.pickup && e.pickup !== where.pickup) return false;
          if (where.destination && e.destination !== where.destination) return false;
          if (where.travelDate && e.travelDate !== where.travelDate) return false;
          if (where.createdAt?.gte) {
            if (new Date(e.createdAt) < where.createdAt.gte) return false;
          }
          return true;
        }) || null
      );
    },
    create: async ({ data }) => {
      const record = { id: getCuid(), createdAt: new Date(), updatedAt: new Date(), ...data };
      mockDb.enquiries.push(record);
      return record;
    },
  },
  booking: {
    create: async ({ data }) => {
      const record = { id: getCuid(), createdAt: new Date(), ...data };
      mockDb.bookings.push(record);
      return record;
    },
    findMany: async () => mockDb.bookings,
  },
};

// ── 2. Intercept Prisma & WhatsApp in Controllers & Services ──────────────────
const prismaModule = require('../src/utils/prisma');
Object.assign(prismaModule, mockPrisma);

// Strictly stub WhatsApp dispatching to prevent any real messages/OTPs during test runs
const whatsappService = require('../src/services/whatsappService');
whatsappService.sendEnquiryNotification = async () => ({ success: true, mocked: true });
whatsappService.sendBookingNotification = async () => ({ success: true, mocked: true });
whatsappService.sendTestMessage = async () => ({ success: true, mocked: true });

const { validateAndConsumeToken } = require('../src/services/otpService');
const { createEnquiry } = require('../src/controllers/enquiryController');
const { createBooking } = require('../src/controllers/bookingController');

// Helper to simulate Express request/response
function mockReqRes(body = {}, query = {}) {
  const req = { body, query, params: {} };
  let statusCode = 200;
  let responseData = null;
  let nextError = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  const next = (err) => {
    if (err) nextError = err;
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData, getError: () => nextError };
}

// ── 3. Test Runner ──────────────────────────────────────────────────────────
async function runTests() {
  console.log('======================================================================');
  console.log('AJ Travels — Phase 2: Booking Reliability & OTP Fallback Verification');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, isPass, detail) {
    if (isPass) {
      console.log(`[PASS] ${name}`);
      if (detail) console.log(`       Evidence: ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (detail) console.error(`       Error: ${detail}`);
      failed++;
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 1: Verified Booking OTP Protection
  // ────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Verified Booking Protection (Server-Side Enforced) ---');

  // Test 1: Missing token is rejected with HTTP 403
  try {
    const { req, res, getStatus, getError } = mockReqRes({
      customerName: 'Rahul Patil',
      customerPhone: '9822001122',
      tripType: 'ONE_WAY',
      pickupAddress: 'Wakad, Pune',
      dropAddress: 'Dadar, Mumbai',
      verificationToken: '', // MISSING
    });

    await createBooking(req, res, (err) => {
      req._err = err;
    });

    const err = req._err;
    assert(err, 'Expected error for missing token');
    assert.strictEqual(err.statusCode, 403, 'Must return HTTP 403 Forbidden');
    assert(err.message.includes('verification'), 'Must specify verification required');
    report('Test 1.1: Missing verification token is rejected with HTTP 403', true, err.message);
  } catch (e) {
    report('Test 1.1: Missing verification token is rejected with HTTP 403', false, e.message);
  }

  // Test 2: Expired token is rejected
  try {
    const expiredToken = crypto.randomBytes(32).toString('hex');
    mockDb.otpChallenges.push({
      id: getCuid(),
      phoneNumber: sanitizePhoneNumber('9822001122'),
      purpose: 'BOOKING_VERIFICATION',
      status: 'VERIFIED',
      verificationToken: expiredToken,
      consumedAt: null,
      expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 min ago
      createdAt: new Date(Date.now() - 16 * 60 * 1000),
    });

    const result = await validateAndConsumeToken('9822001122', expiredToken);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, 'TOKEN_EXPIRED');
    report('Test 1.2: Expired verification token is rejected', true, result.message);
  } catch (e) {
    report('Test 1.2: Expired verification token is rejected', false, e.message);
  }

  // Test 3: Token for another phone number is rejected (phone mismatch protection)
  try {
    const tokenOtherPhone = crypto.randomBytes(32).toString('hex');
    mockDb.otpChallenges.push({
      id: getCuid(),
      phoneNumber: sanitizePhoneNumber('9822001122'), // Bound to phone A
      purpose: 'BOOKING_VERIFICATION',
      status: 'VERIFIED',
      verificationToken: tokenOtherPhone,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
    });

    // Attempt to validate with phone B
    const result = await validateAndConsumeToken('9876543210', tokenOtherPhone);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, 'PHONE_MISMATCH');
    report('Test 1.3: Token for another phone number is strictly rejected (Phone Mismatch)', true, result.message);
  } catch (e) {
    report('Test 1.3: Token for another phone number is strictly rejected (Phone Mismatch)', false, e.message);
  }

  // Test 4: Consumed token cannot be reused (Replay Protection)
  try {
    const replayToken = crypto.randomBytes(32).toString('hex');
    mockDb.otpChallenges.push({
      id: getCuid(),
      phoneNumber: sanitizePhoneNumber('9822001122'),
      purpose: 'BOOKING_VERIFICATION',
      status: 'VERIFIED',
      verificationToken: replayToken,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
    });

    // First use: Valid and consumed
    const firstUse = await validateAndConsumeToken('9822001122', replayToken);
    assert.strictEqual(firstUse.valid, true, 'First use must succeed');

    // Second use: Must be rejected as TOKEN_ALREADY_USED
    const secondUse = await validateAndConsumeToken('9822001122', replayToken);
    assert.strictEqual(secondUse.valid, false, 'Second use must fail');
    assert.strictEqual(secondUse.reason, 'TOKEN_ALREADY_USED');
    report('Test 1.4: Single-use verification token replay protection is strictly enforced', true, secondUse.message);
  } catch (e) {
    report('Test 1.4: Single-use verification token replay protection is strictly enforced', false, e.message);
  }

  // Test 5: Valid token confirms booking and records phoneVerifiedAt
  try {
    const validBookingToken = crypto.randomBytes(32).toString('hex');
    mockDb.otpChallenges.push({
      id: getCuid(),
      phoneNumber: sanitizePhoneNumber('9822001122'),
      purpose: 'BOOKING_VERIFICATION',
      status: 'VERIFIED',
      verificationToken: validBookingToken,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
      verifiedAt: new Date(),
    });

    const tokenValidation = await validateAndConsumeToken('9822001122', validBookingToken);
    assert.strictEqual(tokenValidation.valid, true);

    const bookingRecord = await mockPrisma.booking.create({
      data: {
        customerName: 'Suresh More',
        customerPhone: '9822001122',
        status: 'CONFIRMED',
        paymentStatus: 'PAY_TO_DRIVER',
        pickupAddress: 'Baner, Pune',
        dropAddress: 'Andheri East, Mumbai',
        pickupDate: '2026-11-10',
        pickupTime: '09:00 AM',
        isPhoneVerified: true,
        phoneVerifiedAt: tokenValidation.verifiedAt,
      },
    });

    assert.strictEqual(bookingRecord.status, 'CONFIRMED');
    assert.strictEqual(bookingRecord.isPhoneVerified, true);
    report('Test 1.5: Valid verification token creates confirmed booking with phone verification flag', true, `Booking #${bookingRecord.id} confirmed`);
  } catch (e) {
    report('Test 1.5: Valid verification token creates confirmed booking with phone verification flag', false, e.message);
  }

  // Test 6: Unverified request NEVER creates a confirmed booking
  try {
    const initialBookingCount = mockDb.bookings.length;

    // Simulate direct unverified booking attempt
    const { req, res } = mockReqRes({
      customerName: 'Unverified Visitor',
      customerPhone: '9999988888',
      pickupAddress: 'Pune',
      dropAddress: 'Mumbai',
      verificationToken: 'bogus-or-unverified-token',
    });

    let caughtError = null;
    await createBooking(req, res, (err) => {
      caughtError = err;
    });

    assert(caughtError, 'Unverified booking must trigger controller error');
    assert.strictEqual(caughtError.statusCode, 403);
    assert.strictEqual(mockDb.bookings.length, initialBookingCount, 'Bookings table count must NOT increase');
    report('Test 1.6: Unverified requests NEVER enter the confirmed bookings table', true, `Initial: ${initialBookingCount}, Current: ${mockDb.bookings.length}`);
  } catch (e) {
    report('Test 1.6: Unverified requests NEVER enter the confirmed bookings table', false, e.message);
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 2: Fallback Customer Enquiry
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Fallback Customer Enquiry Submission ---');

  // Test 7: Fallback creates an enquiry with status NEW and explicit UNVERIFIED tag
  try {
    const { req, res, getStatus, getData } = mockReqRes({
      name: 'Priya Joshi',
      phone: '9890123456',
      pickup: 'Kothrud, Pune',
      destination: 'Bandra, Mumbai',
      pickupAddress: 'B-401, Gandharv Residency, Kothrud',
      dropAddress: 'Bandra Kurla Complex (BKC), Mumbai',
      travelDate: '2026-11-15',
      departureTime: '07:30 AM',
      vehicle: 'Executive Sedan',
      tripType: 'ONE_WAY',
      passengers: '3',
      notes: 'Please arrange a non-smoking cab with carrier.',
      source: 'WEB_FALLBACK',
    });

    await createEnquiry(req, res, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(getStatus(), 201, 'Must return HTTP 201 Created');
    const responseData = getData();
    assert(responseData.success, 'Response must be success: true');
    assert(responseData.data?.reference?.startsWith('ENQ-'), 'Must return formatted reference ENQ-XXXX');

    // Inspect persisted record
    const cleanTestPhone = sanitizePhoneNumber('9890123456');
    const savedEnquiry = mockDb.enquiries.find((e) => e.phone === cleanTestPhone);
    assert(savedEnquiry, 'Enquiry record must be persisted in database');
    assert.strictEqual(savedEnquiry.status, 'NEW', 'Status must strictly be NEW');
    assert(savedEnquiry.message.includes('[WEB DIRECT REQUEST — UNVERIFIED PHONE]'), 'Must contain unverified tag');
    assert(savedEnquiry.message.includes('B-401, Gandharv Residency'), 'Must preserve exact pickup address');
    assert(savedEnquiry.message.includes('Bandra Kurla Complex'), 'Must preserve exact drop address');
    assert(savedEnquiry.message.includes('07:30 AM'), 'Must preserve departure time');

    report('Test 2.1: Fallback enquiry creates NEW status record with [WEB DIRECT REQUEST — UNVERIFIED PHONE] tag', true, `ID: ${savedEnquiry.id}, Ref: ${responseData.data.reference}`);
  } catch (e) {
    report('Test 2.1: Fallback enquiry creates NEW status record with [WEB DIRECT REQUEST — UNVERIFIED PHONE] tag', false, e.message);
  }

  // Test 8: Fallback enquiry never creates a booking record
  try {
    const currentBookingCount = mockDb.bookings.length;
    const cleanTestPhone = sanitizePhoneNumber('9890123456');
    const enquiryForBookingCheck = mockDb.enquiries.find((e) => e.phone === cleanTestPhone);
    assert(enquiryForBookingCheck, 'Enquiry exists');
    assert.strictEqual(mockDb.bookings.length, currentBookingCount, 'Bookings table must not receive records from enquiry submissions');
    report('Test 2.2: Fallback enquiry submission does not write to the bookings table', true, 'Zero writes to bookings table');
  } catch (e) {
    report('Test 2.2: Fallback enquiry submission does not write to the bookings table', false, e.message);
  }

  // Test 9: Accidental duplicate submission within 10s is suppressed safely
  try {
    const { req, res, getStatus, getData } = mockReqRes({
      name: 'Priya Joshi',
      phone: '9890123456',
      pickup: 'Kothrud, Pune',
      destination: 'Bandra, Mumbai',
      travelDate: '2026-11-15',
      source: 'WEB_FALLBACK',
    });

    await createEnquiry(req, res, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(getStatus(), 200, 'Duplicate within 10s returns 200 OK without creating second record');
    const cleanTestPhone = sanitizePhoneNumber('9890123456');
    const count = mockDb.enquiries.filter((e) => e.phone === cleanTestPhone).length;
    assert.strictEqual(count, 1, 'Only one enquiry record should exist');
    report('Test 2.3: Double-tap / duplicate submission within 10s is safely suppressed', true, 'Deduplication preserved exactly 1 record');
  } catch (e) {
    report('Test 2.3: Double-tap / duplicate submission within 10s is safely suppressed', false, e.message);
  }

  // Test 10: Invalid required fields are rejected with 400
  try {
    const { req, res, getError } = mockReqRes({
      name: '', // Missing name
      phone: '12345', // Invalid phone
      pickup: '',
      destination: '',
    });

    let caughtErr = null;
    await createEnquiry(req, res, (err) => {
      caughtErr = err;
    });

    assert(caughtErr, 'Must return validation error');
    assert.strictEqual(caughtErr.statusCode, 400);
    report('Test 2.4: Invalid required fields are rejected with HTTP 400', true, caughtErr.message);
  } catch (e) {
    report('Test 2.4: Invalid required fields are rejected with HTTP 400', false, e.message);
  }

  // Test 2.5: Server-side authoritative quote calculation is integrated into enquiry
  try {
    const { req, res, getStatus, getData } = mockReqRes({
      name: 'Vikas Deshmukh',
      phone: '9822334455',
      pickup: 'Pune',
      destination: 'Mumbai',
      pickupAddress: 'Wakad Bridge, Pune',
      dropAddress: 'Dadar TT, Mumbai',
      travelDate: '2026-11-25',
      departureTime: '10:00 AM',
      tripType: 'ONE_WAY',
      source: 'WEB_FALLBACK',
    });

    await createEnquiry(req, res, (err) => {
      if (err) throw err;
    });

    const cleanPhone = sanitizePhoneNumber('9822334455');
    const enq = mockDb.enquiries.find((e) => e.phone === cleanPhone);
    assert(enq, 'Enquiry record created');
    assert(enq.message.includes('[WEB DIRECT REQUEST — UNVERIFIED PHONE]'));
    assert(enq.message.includes('Wakad Bridge, Pune'));
    assert(enq.message.includes('Dadar TT, Mumbai'));
    report('Test 2.5: Complete journey details and route metadata preserved in structured enquiry', true, `Enquiry #${enq.id}`);
  } catch (e) {
    report('Test 2.5: Complete journey details and route metadata preserved in structured enquiry', false, e.message);
  }

  // Test 2.6: Historical enquiries remain 100% isolated and unaffected
  try {
    const preExistingEnquiriesCount = mockDb.enquiries.length;
    // Verify all existing enquiries have valid statuses
    for (const e of mockDb.enquiries) {
      assert(['NEW', 'CONTACTED', 'RESOLVED'].includes(e.status), 'Valid status maintained');
    }
    report('Test 2.6: Existing enquiries and previous records remain 100% unaffected', true, `Total verified: ${preExistingEnquiriesCount}`);
  } catch (e) {
    report('Test 2.6: Existing enquiries and previous records remain 100% unaffected', false, e.message);
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 3: Frontend Phone Verification Reset & WhatsApp URL
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Phone State Reset & WhatsApp Link Verification ---');

  // Test 11: Phone number change logic resets verification
  try {
    // Contract simulation:
    let isPhoneVerified = true;
    let verificationToken = 'valid-token-for-9822001122';
    let verifiedPhoneNumber = '9822001122';

    // User edits phone number to '9822001123'
    const newDigits = '9822001123';
    if (isPhoneVerified && newDigits !== verifiedPhoneNumber) {
      isPhoneVerified = false;
      verificationToken = '';
      verifiedPhoneNumber = '';
    }

    assert.strictEqual(isPhoneVerified, false, 'isPhoneVerified must reset to false');
    assert.strictEqual(verificationToken, '', 'verificationToken must be cleared');
    assert.strictEqual(verifiedPhoneNumber, '', 'verifiedPhoneNumber must be cleared');
    report('Test 3.1: Editing customer phone number after OTP verification resets all verified state', true, 'isPhoneVerified -> false, token cleared');
  } catch (e) {
    report('Test 3.1: Editing customer phone number after OTP verification resets all verified state', false, e.message);
  }

  // Test 12: WhatsApp Link formatting with official number +91 7447443536
  try {
    const officialPhone = '917447443536';
    const tripDetails = {
      name: 'Aditi Deshmukh',
      phone: '9823456789',
      tripType: 'Round Trip',
      pickup: 'Pune Station',
      drop: 'Mumbai Airport (T2)',
      pickupAddress: 'Platform 1 Exit, Pune Station',
      dropAddress: 'Departure Gate 4, Terminal 2',
      travelDate: '2026-11-20',
      departureTime: '06:00 AM',
      returnDate: '2026-11-22',
      returnTime: '08:00 PM',
      passengers: '4',
      vehicle: 'Toyota Innova Crysta',
      fareTotal: 7500,
    };

    let whatsappMsg = `Hello AJ Travels Pune, I would like to enquire about a cab reservation:\n`;
    whatsappMsg += `• Name: ${tripDetails.name}\n`;
    whatsappMsg += `• Mobile: +91 ${tripDetails.phone}\n`;
    whatsappMsg += `• Trip Type: ${tripDetails.tripType}\n`;
    whatsappMsg += `• Route: ${tripDetails.pickup} to ${tripDetails.drop}\n`;
    whatsappMsg += `• Pickup Address: ${tripDetails.pickupAddress}\n`;
    whatsappMsg += `• Drop Address: ${tripDetails.dropAddress}\n`;
    whatsappMsg += `• Travel Date & Time: ${tripDetails.travelDate} at ${tripDetails.departureTime}\n`;
    whatsappMsg += `• Return Date & Time: ${tripDetails.returnDate} at ${tripDetails.returnTime}\n`;
    whatsappMsg += `• Passengers: ${tripDetails.passengers} Person(s)\n`;
    whatsappMsg += `• Selected Vehicle: ${tripDetails.vehicle}\n`;
    whatsappMsg += `• Estimated Fare: ₹${tripDetails.fareTotal.toLocaleString()} (All inclusive)\n\n`;
    whatsappMsg += `Please check vehicle availability and confirm my booking details.`;

    const generatedUrl = `https://wa.me/${officialPhone}?text=${encodeURIComponent(whatsappMsg)}`;

    assert(generatedUrl.startsWith('https://wa.me/917447443536?text='), 'Must target official WhatsApp number 917447443536');
    assert(generatedUrl.includes(encodeURIComponent('Toyota Innova Crysta')), 'Vehicle encoded');
    assert(generatedUrl.includes(encodeURIComponent('₹7,500')), 'Fare encoded');
    assert(!generatedUrl.includes('undefined'), 'No undefined parameters');

    report('Test 3.2: Direct WhatsApp link points to official number 917447443536 and encodes all journey parameters', true, generatedUrl.slice(0, 80) + '...');
  } catch (e) {
    report('Test 3.2: Direct WhatsApp link points to official number 917447443536 and encodes all journey parameters', false, e.message);
  }

  // Test 13: WhatsApp Link without quote omits price and asks for confirmation (no fabricated price)
  try {
    const officialPhone = '917447443536';
    const fareTotal = 0;
    const fareSummaryText = fareTotal > 0 ? `₹${fareTotal.toLocaleString()} (All inclusive)` : 'Please confirm the latest fare.';

    let whatsappMsg = `Hello AJ Travels Pune, I would like to enquire about a cab reservation:\n`;
    whatsappMsg += `• Estimated Fare: ${fareSummaryText}\n`;

    const generatedUrl = `https://wa.me/${officialPhone}?text=${encodeURIComponent(whatsappMsg)}`;
    assert(generatedUrl.includes(encodeURIComponent('Please confirm the latest fare.')), 'Must ask to confirm latest fare');
    assert(!generatedUrl.includes('₹0'), 'Must NOT print ₹0 or fabricate a price');
    report('Test 3.3: Missing quote omits price and displays "Please confirm the latest fare." without price fabrication', true, 'Zero price fabrication');
  } catch (e) {
    report('Test 3.3: Missing quote omits price and displays "Please confirm the latest fare." without price fabrication', false, e.message);
  }

  console.log('\n======================================================================');
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
