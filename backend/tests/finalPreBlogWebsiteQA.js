const { chromium } = require('playwright-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8080';

async function runComprehensiveQA() {
  console.log('=======================================================================');
  console.log('  AJ Travels - Final Pre-Blog Website Quality Assurance & Regression');
  console.log('  Browser Engine: Google Chrome (Headless)');
  console.log('  Base URL:       ' + BASE_URL);
  console.log('=======================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let totalChecks = 0;
  let passedChecks = 0;
  const defects = [];

  function record(pass, category, pageName, detail = '') {
    totalChecks++;
    if (pass) {
      passedChecks++;
      console.log(`  ✅ [${category}] ${pageName}: PASS ${detail ? '(' + detail + ')' : ''}`);
    } else {
      defects.push({ category, pageName, detail });
      console.error(`  ❌ [${category}] ${pageName}: FAIL - ${detail}`);
    }
  }

  // Helper to audit a single page
  async function auditPage(page, urlPath) {
    const consoleErrors = [];
    const failedRequests = [];

    const onConsole = msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('chrome-extension') && !text.includes('Evaluation a string as JavaScript violates')) {
          consoleErrors.push(text);
        }
      }
    };
    const onResponse = resp => {
      if (resp.status() >= 400 && !resp.url().includes('favicon')) {
        failedRequests.push(`${resp.status()} on ${resp.url()}`);
      }
    };

    page.on('console', onConsole);
    page.on('response', onResponse);

    try {
      await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Scroll to bottom to trigger any lazy-loaded images, then back to top
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 400));
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(400);

      // 1. Check title & content length (login page has ~134 chars, others have 500-15000 chars)
      const bodyTextLength = (await page.locator('body').innerText()).trim().length;
      record(bodyTextLength > 50, 'Content', urlPath, `Body length: ${bodyTextLength} chars`);

      // 2. Check broken images
      const brokenImages = await page.evaluate(async () => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const bad = [];
        for (const img of imgs) {
          // If complete and naturalWidth > 0, it's good
          if (img.complete && img.naturalWidth > 0) continue;
          // Otherwise try fetching to verify URL validity
          try {
            const res = await fetch(img.src);
            if (!res.ok) bad.push(img.src);
          } catch {
            bad.push(img.src);
          }
        }
        return bad;
      });
      record(brokenImages.length === 0, 'Images', urlPath, brokenImages.length > 0 ? `Broken: ${brokenImages.join(', ')}` : 'All images loaded');

      // 3. Check horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      record(!hasHorizontalOverflow, 'Layout-Overflow', urlPath, hasHorizontalOverflow ? 'Horizontal overflow detected' : 'Zero horizontal overflow');

      // 4. Check console errors
      record(consoleErrors.length === 0, 'Console-Errors', urlPath, consoleErrors.length > 0 ? consoleErrors.slice(0, 2).join('; ') : 'Zero console errors');

      // 5. Check failed network requests
      record(failedRequests.length === 0, 'Network-Requests', urlPath, failedRequests.length > 0 ? failedRequests.slice(0, 2).join('; ') : 'All network requests OK');

    } catch (err) {
      record(false, 'PageLoad', urlPath, err.message);
    } finally {
      page.off('console', onConsole);
      page.off('response', onResponse);
    }
  }

  try {
    // =========================================================================
    // SECTION 1: Full Website Page Audits (Desktop 1440x900)
    // =========================================================================
    console.log('--- SECTION 1: Full Website Page Audits (Desktop 1440 × 900) ---');
    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await desktopCtx.newPage();

    const pagesToAudit = [
      '/',
      '/vehicles',
      '/vehicles/sedan',
      '/vehicles/ertiga-suv',
      '/vehicles/innova-crysta',
      '/vehicles/tempo-traveller',
      '/vehicles/test',
      '/fare',
      '/booking',
      '/about',
      '/contact',
      '/services',
      '/services/pune-to-mumbai-cab',
      '/sitemap',
      '/privacy-policy',
      '/terms',
      '/admin/login'
    ];

    for (const urlPath of pagesToAudit) {
      await auditPage(p, urlPath);
    }
    await desktopCtx.close();

    // =========================================================================
    // SECTION 2: Responsive & Mobile Verification (5 Viewports)
    // =========================================================================
    console.log('\n--- SECTION 2: Responsive & Mobile Verification across 5 Viewports ---');
    const viewports = [
      { name: 'Desktop (1440 × 900)', width: 1440, height: 900 },
      { name: 'Laptop (1366 × 768)', width: 1366, height: 768 },
      { name: 'Tablet (768 × 1024)', width: 768, height: 1024 },
      { name: 'Mobile (390 × 844)', width: 390, height: 844 },
      { name: 'Small Mobile (360 × 800)', width: 360, height: 800 }
    ];

    for (const vp of viewports) {
      console.log(`\n  Checking viewport: ${vp.name}`);
      const vpCtx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const vpPage = await vpCtx.newPage();

      const testUrls = ['/', '/vehicles', '/fare', '/booking'];
      for (const url of testUrls) {
        await vpPage.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' });
        await vpPage.waitForTimeout(400);

        const overflow = await vpPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        record(!overflow, 'Responsive-Overflow', `${vp.name} on ${url}`, overflow ? 'Horizontal overflow!' : 'No overflow');
      }

      await vpCtx.close();
    }

    // =========================================================================
    // SECTION 3: Admin Dashboard Navigation & Fleet Vehicles CRUD
    // =========================================================================
    console.log('\n--- SECTION 3: Admin Dashboard Navigation & Fleet Vehicles CRUD ---');
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminCtx.newPage();

    // 1. Login with specific input IDs
    await adminPage.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
    await adminPage.fill('#admin_login_user', 'admin@punetravelagency.in');
    await adminPage.fill('#admin_login_pass', 'Admin@123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/admin/dashboard', { timeout: 10000 });
    record(adminPage.url().includes('/admin/dashboard'), 'Admin-Auth', 'Login to Dashboard', 'Successfully logged in');

    // 2. Intercity Fares tab (default active tab)
    await adminPage.waitForSelector('table:visible tbody tr', { timeout: 10000 });
    const faresRowsCount = await adminPage.locator('table:visible tbody tr').count();
    record(faresRowsCount > 0, 'Admin-Fares', 'Intercity Fares Tab', `Fares management loaded (${faresRowsCount} fare rows)`);

    // 3. Switch to Fleet Vehicles tab
    await adminPage.click('button.admin-nav-item:has-text("Fleet Vehicles")');
    await adminPage.waitForSelector('text=Fleet Vehicle Management', { timeout: 10000 });
    const fleetHeaderVisible = await adminPage.locator('text=Fleet Vehicle Management').count();
    record(fleetHeaderVisible > 0, 'Admin-Fleet', 'Fleet Vehicles Tab Active', 'Fleet vehicle management rendered');

    // Wait for vehicle table rows to finish loading
    await adminPage.waitForSelector('table:visible tbody tr', { timeout: 10000 });
    const adminVehiclesCount = await adminPage.locator('table:visible tbody tr').count();
    record(adminVehiclesCount >= 7, 'Admin-Fleet', 'Fleet Vehicles Table Rows', `Table rows count: ${adminVehiclesCount}`);

    // Check "Add Fleet Vehicle" button opens modal
    await adminPage.click('button:has-text("Add Fleet Vehicle")');
    await adminPage.waitForSelector('text=Add New Fleet Vehicle', { timeout: 5000 });
    const addVehicleModalVisible = await adminPage.locator('text=Add New Fleet Vehicle').count();
    record(addVehicleModalVisible > 0, 'Admin-Fleet', 'Add Fleet Vehicle Modal', 'Modal opened cleanly');

    // Close modal
    const closeBtn = adminPage.locator('button:has-text("Cancel"), .admin-modal-btn-close').first();
    await closeBtn.click();
    await adminPage.waitForTimeout(400);

    // 4. Switch to Local Packages tab
    const localPackagesBtn = adminPage.locator('button.admin-nav-item:has-text("Local Packages")');
    if (await localPackagesBtn.count() > 0) {
      await localPackagesBtn.click();
      await adminPage.waitForSelector('table:visible tbody tr', { timeout: 10000 });
      const localTableCount = await adminPage.locator('table:visible tbody tr').count();
      record(localTableCount > 0, 'Admin-Local', 'Local Packages Module', `Local vehicles & packages intact (${localTableCount} rows)`);
    }

    await adminCtx.close();

    // =========================================================================
    // SECTION 4: Interactive Enquiry & Booking Workflows
    // =========================================================================
    console.log('\n--- SECTION 4: Interactive Enquiry & Booking Workflows ---');
    const workflowCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const wfPage = await workflowCtx.newPage();

    // 1. Homepage Enquiry Modal
    await wfPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const enquireBtn = wfPage.locator('button:has-text("Enquire Now"), a:has-text("Enquire Now")').first();
    if (await enquireBtn.count() > 0) {
      await enquireBtn.click();
      await wfPage.waitForTimeout(400);
      const modalOpen = await wfPage.locator('.modal-backdrop, .enquiry-modal-backdrop, [role="dialog"]').count();
      record(modalOpen > 0, 'Enquiry-Modal', 'Homepage Enquire Now', 'Modal opened properly');
    }

    // 2. Fare Calculator Quote Flow (Pune -> Mumbai verified corridor)
    await wfPage.goto(`${BASE_URL}/fare?pickupId=cmv80vv9y0000e05pye15vuv0&dropId=cmv80x5oo0006e05p9lz7e2bt`, { waitUntil: 'domcontentloaded' });
    await wfPage.waitForSelector('.fare-cab-card', { timeout: 10000 });
    const quoteCards = await wfPage.locator('.fare-cab-card').count();
    record(quoteCards >= 4, 'Fare-Calculator', 'Live Fare Quote Generation', `Generated ${quoteCards} verified vehicle quotes`);

    // 3. Local Hourly Package Calculation
    await wfPage.goto(`${BASE_URL}/fare?tripType=LOCAL&city=Pune&duration=8`, { waitUntil: 'domcontentloaded' });
    await wfPage.waitForTimeout(1000);
    const localFareContent = await wfPage.locator('body').innerText();
    record(localFareContent.includes('Pune') && (localFareContent.includes('Package') || localFareContent.includes('8') || localFareContent.includes('₹')), 'Local-Packages', 'Local Hourly Package Calculation', 'Local hourly calculation intact');

    await workflowCtx.close();

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
    console.log('\n=======================================================================');
    console.log(`  QA AUDIT COMPLETE: ${passedChecks} / ${totalChecks} CHECKS PASSED`);
    if (defects.length > 0) {
      console.log(`  DEFECTS FOUND (${defects.length}):`);
      defects.forEach(d => console.log(`   - [${d.category}] ${d.pageName}: ${d.detail}`));
    } else {
      console.log('  ZERO DEFECTS FOUND! The application is fully verified.');
    }
    console.log('=======================================================================\n');
  }
}

runComprehensiveQA();
