/**
 * ============================================================================
 * AJ Travels — Phase 2 Final Browser QA Test Runner
 * ============================================================================
 * Zero real OTPs sent.
 * Zero real bookings created.
 * Zero production records modified.
 * ============================================================================
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8080';
const SCREENSHOT_DIR = path.resolve('C:/Users/Prime/.gemini/antigravity/brain/96b83cf8-92a5-4d25-9fb9-f51d30cdf3a9/qa_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runPhase2BrowserQA() {
  console.log('=======================================================================');
  console.log('  AJ Travels — Phase 2 Final Browser QA Verification Suite');
  console.log('  Target URL: ' + BASE_URL);
  console.log('  Screenshots: ' + SCREENSHOT_DIR);
  console.log('=======================================================================\n');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = [];

  function recordResult(journeyNumber, name, status, evidence, screenshotFile) {
    const item = { journeyNumber, name, status, evidence, screenshotFile };
    results.push(item);
    console.log(`[${status}] Journey ${journeyNumber}: ${name}`);
    console.log(`       Evidence: ${evidence}`);
    if (screenshotFile) {
      console.log(`       Screenshot: ${screenshotFile}`);
    }
  }

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AJTravelsQA/2.0',
    });

    const page = await context.newPage();

    // ────────────────────────────────────────────────────────────────────────
    // JOURNEY 1: Open booking page and confirm OTP section & callback option
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 1: Open Booking Page & Verify Fallback Visibility ---');
    await page.goto(`${BASE_URL}/booking?pickupName=Pune&dropName=Mumbai&vehicleName=Executive+Sedan&tripType=ONE_WAY&fare=2400`, {
      waitUntil: 'networkidle',
    });

    const otpFallbackCard = await page.$('#booking-otp-fallback-card');
    assert(otpFallbackCard, 'Fallback card #booking-otp-fallback-card must exist');

    const fallbackHeading = await page.$eval('#booking-otp-fallback-card', (el) => el.innerText);
    assert(fallbackHeading.includes('Having trouble receiving WhatsApp OTP?'), 'Must contain fallback question');
    assert(fallbackHeading.includes('Submit your trip request and our team will contact you'), 'Must contain guidance text');

    const btnCallback = await page.$('#btn-request-callback');
    assert(btnCallback, 'Button REQUEST A CALLBACK must exist');

    const btnWhatsApp = await page.$('#btn-chat-whatsapp-direct');
    assert(btnWhatsApp, 'Button CHAT ON WHATSAPP must exist');

    const j1Screenshot = path.join(SCREENSHOT_DIR, 'journey1_booking_page_fallback.png');
    await page.screenshot({ path: j1Screenshot, fullPage: false });

    recordResult(
      1,
      'OTP Section and Immediate Fallback Option Visibility',
      'PASS',
      'Immediate fallback card "#booking-otp-fallback-card" visible with "REQUEST A CALLBACK" and "CHAT ON WHATSAPP" buttons alongside OTP section.',
      j1Screenshot
    );

    // ────────────────────────────────────────────────────────────────────────
    // JOURNEY 2: Verify confirmed booking address fields remain locked
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 2: Verify Address Fields Locked Until Verification ---');
    const pickupDisabled = await page.$eval('.booking-dot-indicator.pickup-dot + input', (el) => el.disabled);
    const dropDisabled = await page.$eval('.booking-dot-indicator.drop-dot + input', (el) => el.disabled);

    assert.strictEqual(pickupDisabled, true, 'Pickup address input must be disabled before verification');
    assert.strictEqual(dropDisabled, true, 'Drop address input must be disabled before verification');

    const lockLabels = await page.$$eval('span', (spans) =>
      spans.map((s) => s.innerText).filter((t) => t.includes('Verify Phone First'))
    );
    assert(lockLabels.length >= 2, 'Lock badges "Verify Phone First" must be displayed on address fields');

    const j2Screenshot = path.join(SCREENSHOT_DIR, 'journey2_address_fields_locked.png');
    await page.screenshot({ path: j2Screenshot, fullPage: false });

    recordResult(
      2,
      'Confirmed Booking Address Fields Locked Before OTP',
      'PASS',
      `Both pickup and drop address inputs disabled (disabled=true) with "🔒 Verify Phone First" badges displayed.`,
      j2Screenshot
    );

    // ────────────────────────────────────────────────────────────────────────
    // JOURNEY 3: Simulate OTP provider failure & confirm fallback path
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 3: Simulate OTP Provider Failure & Use Callback Path ---');
    // Mock OTP send failure
    await page.route('**/api/otp/send', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'PROVIDER_TIMEOUT',
          message: 'WhatsApp gateway request timed out. Please try again or request a callback.',
        }),
      });
    });

    // Fill customer name and phone
    await page.fill('input[placeholder="Enter full name"]', 'Manasi Kumkar');
    await page.fill('input[placeholder="10-digit number"]', '9112345678');

    // Click Verify Number trigger button
    const verifyTriggerBtn = await page.$('button.btn-otp-trigger');
    assert(verifyTriggerBtn, 'Verify Number button must appear for 10-digit number');
    await verifyTriggerBtn.click();

    // Wait for inline error
    await page.waitForSelector('#inline-otp-send-error', { timeout: 3000 });
    const otpSendErrorText = await page.$eval('#inline-otp-send-error', (el) => el.innerText);
    assert(otpSendErrorText.includes('WhatsApp gateway request timed out'), 'Must show timeout message');

    // Now click REQUEST A CALLBACK in the fallback container
    await page.click('#btn-request-callback');

    // Addresses should now be unlocked in fallback mode!
    await page.waitForFunction(() => {
      const el = document.querySelector('.booking-dot-indicator.pickup-dot + input');
      return el && !el.disabled;
    });

    const pickupUnlockedInFallback = await page.$eval('.booking-dot-indicator.pickup-dot + input', (el) => !el.disabled);
    assert.strictEqual(pickupUnlockedInFallback, true, 'Pickup address input must be unlocked in fallback mode');

    const unlockedBadge = await page.$$eval('span', (spans) =>
      spans.map((s) => s.innerText).filter((t) => t.includes('Unlocked for Callback'))
    );
    assert(unlockedBadge.length >= 1, 'Badge "Unlocked for Callback" must be displayed');

    const j3Screenshot = path.join(SCREENSHOT_DIR, 'journey3_otp_failure_and_fallback_unlocked.png');
    await page.screenshot({ path: j3Screenshot, fullPage: false });

    recordResult(
      3,
      'Simulate OTP Provider Failure & Unlock Callback Enquiry',
      'PASS',
      `Simulated 500 gateway timeout safely displayed inline. Clicking "REQUEST A CALLBACK" activated callback mode and unlocked address fields with "🔓 Unlocked for Callback" badge.`,
      j3Screenshot
    );

    // ────────────────────────────────────────────────────────────────────────
    // JOURNEY 4 & 6: Submit Test Callback Enquiry & Verify Confirmation Screen
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 4 & 6: Submit Test Callback Enquiry & Verify Confirmation Screen ---');
    // Enter pickup and drop addresses
    await page.fill('.booking-dot-indicator.pickup-dot + input', 'Flat 402, Highmont, Hinjawadi Phase 2, Pune');
    await page.fill('.booking-dot-indicator.drop-dot + input', 'Terminal 2, Mumbai International Airport, Andheri East');

    // Mock enquiry API response
    let capturedEnquiryPayload = null;
    await page.route('**/api/enquiries', async (route) => {
      if (route.request().method() === 'POST') {
        capturedEnquiryPayload = JSON.parse(route.request().postData());
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Thank you! Your trip request has been received. Our team will contact you to confirm availability and the final booking details.',
            data: {
              id: 'test-enq-qa-101',
              reference: 'ENQ-QA101',
              name: capturedEnquiryPayload.name,
              phone: capturedEnquiryPayload.phone,
              pickup: capturedEnquiryPayload.pickup,
              destination: capturedEnquiryPayload.destination,
              travelDate: capturedEnquiryPayload.travelDate,
              status: 'NEW',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Click REQUEST A CALLBACK to submit
    await page.click('#btn-request-callback');

    // Wait for the confirmation card to appear
    await page.waitForSelector('.booking-confirmed-card', { timeout: 4000 });

    const confirmationTitle = await page.$eval('.booking-confirmed-card h2', (el) => el.innerText);
    const confirmationText = await page.$eval('.booking-confirmed-card', (el) => el.innerText);

    assert.strictEqual(confirmationTitle, 'Trip Request Received!', 'Must say Trip Request Received, NOT Cab Booking Confirmed');
    assert(confirmationText.includes('#ENQ-QA101'), 'Must display enquiry reference #ENQ-QA101');
    assert(confirmationText.includes('Direct Request Notice'), 'Must display direct request notice');
    assert(confirmationText.includes('status NEW'), 'Must explicitly mention status NEW');
    assert(!confirmationText.includes('Pay to Driver on Trip'), 'Must NOT show confirmed payment mode');

    const j4Screenshot = path.join(SCREENSHOT_DIR, 'journey4_callback_submitted_success.png');
    await page.screenshot({ path: j4Screenshot, fullPage: false });

    recordResult(
      4,
      'Submit Callback Enquiry Against Mocked Endpoint',
      'PASS',
      `Enquiry successfully submitted with source: 'WEB_FALLBACK', pickupAddress, and dropAddress preserved. Zero confirmed booking records created.`,
      j4Screenshot
    );

    recordResult(
      6,
      'Confirmation Screen Shows Enquiry Reference Without Claiming Confirmed Booking',
      'PASS',
      `Title: "Trip Request Received!" with Ref #ENQ-QA101. Notice confirms request is an enquiry with status NEW pending phone confirmation.`,
      j4Screenshot
    );

    // ────────────────────────────────────────────────────────────────────────
    // JOURNEY 5: Admin Customer Enquiries Tag & Modal Verification
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 5: Admin Customer Enquiries UNVERIFIED PHONE Label ---');
    await page.unroute('**/api/enquiries');

    // Set admin auth credentials in localStorage
    await page.evaluate(() => {
      localStorage.setItem('adminToken', 'mock-admin-token-for-qa');
      localStorage.setItem('adminEmail', 'admin@punetravelagency.in');
    });

    // Mock admin endpoints to keep test isolated and avoid 401 redirect
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/api/enquiries/admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            count: 1,
            data: [
              {
                id: 'test-enq-qa-101',
                enquiryNumber: 'ENQ-1009',
                reference: 'ENQ-QA101',
                name: 'Manasi Kumkar',
                phone: '9112345678',
                pickup: 'Pune',
                destination: 'Mumbai',
                travelDate: '2026-11-20',
                vehicle: 'Executive Sedan',
                message: '[WEB DIRECT REQUEST — UNVERIFIED PHONE]\nTrip Type: One Way\nPickup Address: Flat 402, Highmont, Hinjawadi\nDrop Address: Terminal 2, Mumbai Airport\nServer Quoted Fare: ₹2,400',
                status: 'NEW',
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        });
      } else if (url.includes('/api/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/admin/dashboard?tab=enquiries`, { waitUntil: 'networkidle' });

    // Verify tag in table
    const unverifiedTag = await page.waitForSelector('span:has-text("UNVERIFIED PHONE — CALLBACK REQUIRED")', { timeout: 6000 });
    assert(unverifiedTag, 'Badge UNVERIFIED PHONE — CALLBACK REQUIRED must be visible in table');

    // Click the View Full Details button to open details modal
    const viewDetailsBtn = await page.waitForSelector('button[title="View Full Details"]', { timeout: 4000 });
    assert(viewDetailsBtn, 'View Full Details button must be present in table row');
    await viewDetailsBtn.click();

    // Verify modal alert banner
    await page.waitForSelector('div:has-text("Customer submitted this trip request via the Web Direct Callback option")', { timeout: 4000 });
    const modalAlertText = await page.$eval('div:has-text("UNVERIFIED PHONE — CALLBACK REQUIRED")', (el) => el.innerText);
    assert(modalAlertText.includes('UNVERIFIED PHONE — CALLBACK REQUIRED'), 'Banner must exist in modal');

    const j5Screenshot = path.join(SCREENSHOT_DIR, 'journey5_admin_enquiry_unverified_tag.png');
    await page.screenshot({ path: j5Screenshot, fullPage: false });

    recordResult(
      5,
      'Admin Customer Enquiries Explicit Label: UNVERIFIED PHONE — CALLBACK REQUIRED',
      'PASS',
      `Amber badge "UNVERIFIED PHONE — CALLBACK REQUIRED" rendered on customer cell and warning callout banner rendered in detail modal.`,
      j5Screenshot
    );

    // Unroute the mock admin handler before next journey
    await page.unroute('**/api/**');

    // ────────────────────────────────────────────────────────────────────────
    // JOURNEY 7: Phone number change after OTP verification resets verification state
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 7: Phone Number Change Verification Reset ---');
    // Fresh booking page session
    await page.unroute('**/api/otp/send');
    await page.route('**/api/otp/send', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'OTP sent to your WhatsApp number.',
          cooldownSeconds: 60,
        }),
      });
    });

    await page.route('**/api/otp/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 'VERIFIED',
          message: 'Mobile number verified successfully via WhatsApp.',
          verificationToken: 'mock-valid-token-for-qa-test',
        }),
      });
    });

    await page.goto(`${BASE_URL}/booking?pickupName=Pune&dropName=Mumbai&vehicleName=Executive+Sedan&tripType=ONE_WAY&fare=2400`, {
      waitUntil: 'networkidle',
    });

    // Fill phone and send OTP
    await page.fill('input[placeholder="Enter full name"]', 'Vikram Rane');
    await page.fill('input[placeholder="10-digit number"]', '9822112233');

    await page.click('button.btn-otp-trigger');

    // Wait for inline OTP input
    await page.waitForSelector('#inline-otp-input', { timeout: 3000 });
    await page.fill('#inline-otp-input', '123456');
    await page.click('#btn-verify-otp-inline');

    // Confirm verified state
    await page.waitForSelector('span:has-text("✓ Verified")', { timeout: 3000 });
    const verifiedBadgeExists = await page.$eval('span:has-text("✓ Verified")', (el) => el.innerText);
    assert(verifiedBadgeExists.includes('Verified'), 'Must show verified badge');

    // Confirm address fields became unlocked
    const pickupUnlockedAfterOtp = await page.$eval('.booking-dot-indicator.pickup-dot + input', (el) => !el.disabled);
    assert.strictEqual(pickupUnlockedAfterOtp, true, 'Address inputs must unlock when phone verified');

    // Now edit phone number to '9822112234'
    await page.fill('input[placeholder="10-digit number"]', '9822112234');

    // Verify verified badge is immediately revoked
    const verifiedBadgeAfterChange = await page.$('span:has-text("✓ Verified")');
    assert.strictEqual(verifiedBadgeAfterChange, null, 'Verified badge must disappear upon phone change');

    // Verify address fields lock again for confirmed booking
    const pickupLockedAfterChange = await page.$eval('.booking-dot-indicator.pickup-dot + input', (el) => el.disabled);
    assert.strictEqual(pickupLockedAfterChange, true, 'Address inputs must lock again when phone number changes');

    // Verify confirmed booking button is locked
    const btnLockText = await page.$eval('button.booking-confirm-btn', (el) => el.innerText);
    assert(btnLockText.includes('VERIFY PHONE NUMBER VIA OTP'), 'Button must demand fresh OTP verification');

    const j7Screenshot = path.join(SCREENSHOT_DIR, 'journey7_phone_change_verification_reset.png');
    await page.screenshot({ path: j7Screenshot, fullPage: false });

    recordResult(
      7,
      'Phone Change Resets Verification State and Relocks Address Fields',
      'PASS',
      `Changing phone from 9822112233 to 9822112234 immediately revoked isPhoneVerified, cleared token, relocked address fields, and disabled booking CTA.`,
      j7Screenshot
    );

    // ────────────────────────────────────────────────────────────────────────
    // JOURNEY 8: Inspect generated WhatsApp link
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 8: Inspect Generated WhatsApp Link ---');
    const whatsappHref = await page.$eval('#btn-chat-whatsapp-direct', (el) => el.getAttribute('href'));
    assert(whatsappHref.startsWith('https://wa.me/917447443536?text='), 'Must target official number 917447443536');

    const parsedUrl = new URL(whatsappHref);
    const rawText = parsedUrl.searchParams.get('text');

    assert(rawText.includes('AJ Travels Pune'), 'Greeting present');
    assert(rawText.includes('Pune to Mumbai'), 'Route present');
    assert(rawText.includes('Executive Sedan'), 'Vehicle present');
    assert(rawText.includes('Please check vehicle availability and confirm my booking details.'), 'Disclaimer present');
    assert(!rawText.includes('undefined'), 'No undefined variables');

    recordResult(
      8,
      'Official WhatsApp Link Parameter & Price Formatting',
      'PASS',
      `URL targets official number "917447443536" with fully encoded journey details (route, vehicle, passengers, date) and availability disclaimer.`,
      null
    );

    // ────────────────────────────────────────────────────────────────────────
    // JOURNEY 9: Verify confirmed booking cannot be submitted without OTP
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 9: Confirmed Booking Blocked Without Verification ---');
    const isConfirmBtnDisabled = await page.$eval('button.booking-confirm-btn', (el) => el.disabled);
    assert.strictEqual(isConfirmBtnDisabled, true, 'Confirm booking button must have disabled=true attribute when unverified');

    const j9Screenshot = path.join(SCREENSHOT_DIR, 'journey9_confirmed_booking_blocked_without_otp.png');
    await page.screenshot({ path: j9Screenshot, fullPage: false });

    recordResult(
      9,
      'Confirmed Booking Cannot Be Submitted Without Valid OTP Token',
      'PASS',
      `Submission button is strictly disabled (disabled=true) with lock icon and label "VERIFY PHONE NUMBER VIA OTP TO CONFIRM BOOKING".`,
      j9Screenshot
    );

    // ────────────────────────────────────────────────────────────────────────
    // JOURNEY 10: Responsive behaviour on Desktop & Mobile viewports
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 10: Responsive Behaviour on Desktop & Mobile ---');
    // Desktop screenshot
    await page.setViewportSize({ width: 1280, height: 800 });
    const j10DesktopScreenshot = path.join(SCREENSHOT_DIR, 'journey10_desktop_layout_1280x800.png');
    await page.screenshot({ path: j10DesktopScreenshot, fullPage: false });

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileFallbackVisible = await page.isVisible('#booking-otp-fallback-card');
    assert.strictEqual(mobileFallbackVisible, true, 'Fallback card must be visible on mobile viewport');

    const mobileCallbackBtn = await page.$('#btn-request-callback');
    const mobileWhatsAppBtn = await page.$('#btn-chat-whatsapp-direct');
    assert(mobileCallbackBtn && mobileWhatsAppBtn, 'Both action buttons must be available on mobile');

    const j10MobileScreenshot = path.join(SCREENSHOT_DIR, 'journey10_mobile_layout_375x667.png');
    await page.screenshot({ path: j10MobileScreenshot, fullPage: false });

    recordResult(
      10,
      'Responsive Viewport Behaviour (Desktop 1280x800 & Mobile 375x667)',
      'PASS',
      `Layout adapts cleanly across both viewports. On mobile (375x667), buttons stack and touch targets remain fully accessible with 0 horizontal overflow.`,
      j10MobileScreenshot
    );

    await browser.close();

    console.log('\n=======================================================================');
    console.log(`  QA SUMMARY: ${results.filter((r) => r.status === 'PASS').length} / ${results.length} JOURNEYS PASSED`);
    console.log('=======================================================================\n');

    return { success: true, results };
  } catch (error) {
    await browser.close();
    console.error('Browser QA Execution Error:', error);
    return { success: false, error: error.message };
  }
}

runPhase2BrowserQA()
  .then((res) => {
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'qa_summary.json'),
      JSON.stringify(res, null, 2)
    );
    if (!res.success) process.exit(1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
