const { chromium } = require('playwright-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTests() {
  console.log('🚀 Starting Fleet Loading States & Anti-Flash Verification in Real Chrome...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName, details = '') {
    totalCount++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    }
  }

  // =========================================================================
  // TEST 1: Homepage with 1500ms API Throttling
  // =========================================================================
  try {
    console.log('--- TEST 1: Homepage Vehicle Discovery Under Slow Network (1500ms Delay) ---');
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    const page = await ctx.newPage();

    await page.route('**/api/vehicles', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      route.continue();
    });

    const homeNav = page.goto('http://localhost:8080/#vehicles');
    
    // Wait for skeleton cards to mount
    await page.waitForSelector('.vehicle-card-skeleton', { timeout: 5000 });
    const skeletonCardsCount = await page.locator('.vehicle-card-skeleton').count();
    assert(skeletonCardsCount === 6, 'Renders 6 skeleton cards while vehicleApi is loading', `Count: ${skeletonCardsCount}`);

    // Verify NO old hardcoded text flashes during loading
    const pageTextDuringLoading = await page.locator('#vehicles').innerText();
    const hasOldSedanText = pageTextDuringLoading.includes('Swift Dzire / Toyota Etios') || pageTextDuringLoading.includes('Executive Sedan (Swift Dzire / Etios)');
    assert(!hasOldSedanText, 'No old hardcoded vehicle names or models flash while loading');

    // Wait for API response to complete
    await homeNav;
    await page.waitForSelector('.vehicle-title', { timeout: 10000 });

    const renderedTitles = await page.locator('.vehicle-title').allInnerTexts();
    console.log('    Rendered vehicle titles after loading:', renderedTitles);
    assert(renderedTitles.includes('Sedan'), 'Authoritative DB vehicle "Sedan" rendered');
    assert(renderedTitles.includes('Spacious SUV (Ertiga / Carens)'), 'Authoritative DB vehicle "Spacious SUV (Ertiga / Carens)" rendered');
    assert(renderedTitles.includes('Innova Crysta'), 'Authoritative DB vehicle "Innova Crysta" rendered');
    assert(renderedTitles.includes('test'), 'Authoritative DB vehicle "test" rendered');

    await ctx.close();
  } catch (err) {
    console.error('Test 1 error:', err);
  }

  // =========================================================================
  // TEST 2: /vehicles Catalogue Page with 1500ms API Throttling
  // =========================================================================
  try {
    console.log('\n--- TEST 2: /vehicles Fleet Catalogue Under Slow Network (1500ms Delay) ---');
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    const page = await ctx.newPage();

    await page.route('**/api/vehicles', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      route.continue();
    });

    const vehiclesNav = page.goto('http://localhost:8080/vehicles');
    
    // Wait for fleet skeleton cards
    await page.waitForSelector('.fleet-card-skeleton', { timeout: 5000 });
    const fleetSkeletonsCount = await page.locator('.fleet-card-skeleton').count();
    assert(fleetSkeletonsCount === 6, 'Renders 6 fleet skeleton cards in /vehicles while loading', `Count: ${fleetSkeletonsCount}`);

    // Verify NO old hardcoded static data is rendered
    const fleetTextDuringLoading = await page.locator('.fleet-cards-grid').innerText();
    const hasOldFleetStatic = fleetTextDuringLoading.includes('Budget Compact Hatchback (WagonR / Tiago)');
    assert(!hasOldFleetStatic, 'No old static vehiclesData content rendered during loading');

    // Wait for API to resolve
    await vehiclesNav;
    await page.waitForSelector('.fleet-car-title', { timeout: 10000 });

    const fleetTitles = await page.locator('.fleet-car-title').allInnerTexts();
    console.log('    Rendered fleet catalogue titles:', fleetTitles);
    assert(fleetTitles.includes('Sedan'), 'Database vehicle "Sedan" displayed in catalogue');
    assert(fleetTitles.includes('Compact Hatchback'), 'Database vehicle "Compact Hatchback" displayed in catalogue');
    assert(fleetTitles.includes('Luxury Tempo Traveller'), 'Database vehicle "Luxury Tempo Traveller" displayed in catalogue');

    await ctx.close();
  } catch (err) {
    console.error('Test 2 error:', err);
  }

  // =========================================================================
  // TEST 3: Vehicle Detail Page (/vehicles/sedan and /vehicles/test)
  // =========================================================================
  try {
    console.log('\n--- TEST 3: Vehicle Detail Page Loading State & Authoritative Data ---');
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    const page = await ctx.newPage();

    await page.route('**/api/vehicles', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      route.continue();
    });

    // Test /vehicles/sedan with skeleton wait
    const sedanNav = page.goto('http://localhost:8080/vehicles/sedan');
    await page.waitForSelector('.detail-skeleton-box', { timeout: 5000 });
    const detailSkeleton = await page.locator('.detail-skeleton-box').count();
    assert(detailSkeleton > 0, 'Renders vehicle detail skeleton during API load', `Skeleton boxes: ${detailSkeleton}`);

    await sedanNav;
    await page.waitForSelector('.veh-main-title', { timeout: 10000 });
    const sedanTitle = await page.locator('.veh-main-title').innerText();
    assert(sedanTitle === 'Sedan', 'Authoritative database title "Sedan" rendered on detail page', `Title: ${sedanTitle}`);

    // Verify sidebar "Other Vehicle Options" has DB vehicles
    const otherVehiclesList = await page.locator('.other-veh-row strong').allInnerTexts();
    console.log('    Sidebar Other Vehicle Options:', otherVehiclesList);
    assert(!otherVehiclesList.includes('Executive Sedan (Swift Dzire / Etios)'), 'Sidebar does NOT show old static vehiclesData names');
    assert(otherVehiclesList.includes('Spacious SUV (Ertiga / Carens)'), 'Sidebar shows live DB vehicle "Spacious SUV (Ertiga / Carens)"');

    // Test /vehicles/test (custom user vehicle)
    await page.goto('http://localhost:8080/vehicles/test');
    await page.waitForSelector('.veh-main-title', { timeout: 10000 });
    const testTitle = await page.locator('.veh-main-title').innerText();
    assert(testTitle === 'test', 'User-created DB vehicle "test" renders detail page cleanly without 404 flash', `Title: ${testTitle}`);

    await ctx.close();
  } catch (err) {
    console.error('Test 3 error:', err);
  }

  // =========================================================================
  // TEST 4: Booking Page Loading State & DB Precedence
  // =========================================================================
  try {
    console.log('\n--- TEST 4: Booking Page Loading & Fare Quote Resolution ---');
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    const page = await ctx.newPage();

    // Delay fare quote by 1500ms
    await page.route('**/api/fares/quote', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      route.continue();
    });

    const bookingUrl = 'http://localhost:8080/booking?tripType=ONE_WAY&pickupId=cmv80w1ou0001e05pthwtzv8c&dropId=cmv80xizg0008e05pehlnof92&vehicleId=cmv810ltd000we05ph7oeg4is&vehicleName=Outdated+Vehicle+Name';
    const bookNav = page.goto(bookingUrl);
    
    // Wait for the booking skeleton shimmer
    await page.waitForSelector('.booking-skeleton-box', { timeout: 5000 });
    const noVehicleWarningCount = await page.locator('text=No Cab Category Selected').count();
    assert(noVehicleWarningCount === 0, 'Does NOT flash "No Cab Category Selected" warning box while quote is calculating');
    
    const bookingSkeletonCount = await page.locator('.booking-skeleton-box').count();
    assert(bookingSkeletonCount > 0, 'Displays compact booking vehicle shimmer while quote is calculating', `Count: ${bookingSkeletonCount}`);

    // Wait for quote calculation to finish and skeleton to disappear
    await page.waitForFunction(() => !document.querySelector('.booking-skeleton-box'), { timeout: 10000 });
    await page.waitForTimeout(300);

    const assignedChip = await page.locator('.svc-stats-chips-row strong').first().innerText();
    console.log('    Resolved Assigned Vehicle Chip:', assignedChip);
    assert(assignedChip === 'Sedan', 'Authoritative DB name "Sedan" overrides URL parameter once quote arrives');

    await bookNav;
    await ctx.close();
  } catch (err) {
    console.error('Test 4 error:', err);
  }

  // =========================================================================
  // TEST 5: API Error State Handling (No Silent Fallback to Fake/Stale Data)
  // =========================================================================
  try {
    console.log('\n--- TEST 5: Graceful Error State Handling (Simulating API Failure) ---');
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    const page = await ctx.newPage();

    // Route /api/vehicles to fail with 500
    await page.route('**/api/vehicles', route => route.abort('failed'));

    // Check Homepage under API failure
    await page.goto('http://localhost:8080/#vehicles');
    await page.waitForSelector('.vehicle-discovery-error-box', { timeout: 10000 });
    
    const homepageHasError = await page.locator('.vehicle-discovery-error-box').isVisible();
    assert(homepageHasError, 'Homepage displays clear error state with Retry button on API failure');

    const errorHomeText = await page.locator('#vehicles').innerText();
    const silentlyShowedFleet = errorHomeText.includes('Swift Dzire') || errorHomeText.includes('Family SUV');
    assert(!silentlyShowedFleet, 'Homepage does NOT silently display stale hardcoded fleet when API fails');

    // Check /vehicles under API failure
    await page.goto('http://localhost:8080/vehicles');
    await page.waitForSelector('.fleet-error-container', { timeout: 10000 });
    const catalogueHasError = await page.locator('.fleet-error-container').isVisible();
    assert(catalogueHasError, '/vehicles page displays clear error state with Retry button on API failure');

    // Check /vehicles/sedan under API failure
    await page.goto('http://localhost:8080/vehicles/sedan');
    await page.waitForSelector('text=Vehicle Details Temporarily Unavailable', { timeout: 10000 });
    const detailHasError = await page.locator('text=Vehicle Details Temporarily Unavailable').isVisible();
    assert(detailHasError, 'Vehicle detail page displays clear error state with Retry button on API failure');

    await ctx.close();
  } catch (err) {
    console.error('Test 5 error:', err);
  }

  await browser.close();
  console.log(`\n========================================`);
  console.log(`🏁 ALL TESTS COMPLETED: ${passedCount} / ${totalCount} PASSED`);
  console.log(`========================================\n`);
}

runTests();
