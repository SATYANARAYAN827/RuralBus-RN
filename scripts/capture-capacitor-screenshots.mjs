import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:\\Users\\admin\\OneDrive\\Documents\\RURAL BUS RN\\references\\screenshots\\capacitor';

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 844, isMobile: true, hasTouch: true };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Starting Capacitor Golden UI Screenshot Capture Pipeline...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900', '--hide-scrollbars'],
  });

  const page = await browser.newPage();

  async function snap(name, subviewAction = null) {
    // 1. Desktop Screenshot
    await page.setViewport(DESKTOP_VIEWPORT);
    if (subviewAction) await subviewAction(page, 'desktop');
    await sleep(600);
    const deskPath = path.join(OUTPUT_DIR, 'desktop', ${name}.png);
    await page.screenshot({ path: deskPath, fullPage: false });
    console.log(  📸 [Desktop] -> .png);

    // 2. Mobile Screenshot
    await page.setViewport(MOBILE_VIEWPORT);
    if (subviewAction) await subviewAction(page, 'mobile');
    await sleep(600);
    const mobPath = path.join(OUTPUT_DIR, 'mobile', ${name}.png);
    await page.screenshot({ path: mobPath, fullPage: false });
    console.log(  📱 [Mobile]  -> .png);
  }

  async function login(phone, password) {
    await page.setViewport(DESKTOP_VIEWPORT);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 20000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2' });

    // Wait for login form
    const idInput = await page.waitForSelector('input#login-identifier, input[name="user_identifier"], input[type="text"]', { timeout: 8000 });
    await idInput.click({ clickCount: 3 });
    await idInput.type(phone);

    const pwdInput = await page.waitForSelector('input#login-password, input[name="user_password"], input[type="password"]', { timeout: 8000 });
    await pwdInput.click({ clickCount: 3 });
    await pwdInput.type(password);

    const submitBtn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await submitBtn.click();

    // Wait for authenticated app shell
    await sleep(2500);
  }

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 1: AUTHENTICATION & SECURITY
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n--- Capturing Auth Module ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(1000);

    // 1.1 Login Screen (Dark / Default)
    await snap('01_auth_login_dark');

    // 1.2 Login Screen (Light Mode)
    await page.evaluate(() => {
      const toggle = document.querySelector('button[aria-label*="theme"], button[title*="theme"], .theme-toggle-btn');
      if (toggle) toggle.click();
    });
    await sleep(400);
    await snap('02_auth_login_light');

    // 1.3 Register Screen Step 1
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, a'));
      const regLink = links.find((l) => l.textContent?.includes('Create Passenger Account') || l.textContent?.includes('Register'));
      if (regLink) regLink.click();
    });
    await sleep(500);
    await snap('03_auth_register_step1');

    // 1.4 Back to login & Forgot Password modal
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, a'));
      const signInLink = links.find((l) => l.textContent?.includes('Sign In') || l.textContent?.includes('Already registered'));
      if (signInLink) signInLink.click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, span, a'));
      const forgot = links.find((l) => l.textContent?.includes('Forgot Password'));
      if (forgot) forgot.click();
    });
    await sleep(500);
    await snap('04_auth_forgot_password_modal');

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 2: PASSENGER PORTAL (7381319957 / Admin@123)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n--- Capturing Passenger Portal ---');
    await login('7381319957', 'Admin@123');

    // 2.1 Passenger Home
    await snap('05_passenger_home');

    // 2.2 Passenger Find Bus
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const findTab = tabs.find((t) => t.textContent?.includes('Find Bus') || t.textContent?.includes('Search'));
      if (findTab) findTab.click();
    });
    await sleep(800);
    await snap('06_passenger_find_bus');

    // 2.3 Passenger My Tickets
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const tktTab = tabs.find((t) => t.textContent?.includes('Tickets') || t.textContent?.includes('My Tickets'));
      if (tktTab) tktTab.click();
    });
    await sleep(800);
    await snap('07_passenger_my_tickets');

    // 2.4 Passenger Profile
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const profTab = tabs.find((t) => t.textContent?.includes('Profile'));
      if (profTab) profTab.click();
    });
    await sleep(800);
    await snap('08_passenger_profile');

    // 2.5 Passenger Profile Themes Modal
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, div[style*="cursor"]'));
      const themeItem = items.find((i) => i.textContent?.includes('Themes'));
      if (themeItem) themeItem.click();
    });
    await sleep(500);
    await snap('09_passenger_themes_modal');

    // Close modal
    await page.keyboard.press('Escape');
    await sleep(300);

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 3: DRIVER PORTAL (8018174171 / Admin@123)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n--- Capturing Driver Portal ---');
    await login('8018174171', 'Admin@123');

    // 3.1 Driver Home
    await snap('10_driver_home');

    // 3.2 Driver Map
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const mapTab = tabs.find((t) => t.textContent?.includes('Map') || t.textContent?.includes('Live Map'));
      if (mapTab) mapTab.click();
    });
    await sleep(1000);
    await snap('11_driver_map');

    // 3.3 Driver Stops
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const stopTab = tabs.find((t) => t.textContent?.includes('Stops'));
      if (stopTab) stopTab.click();
    });
    await sleep(800);
    await snap('12_driver_stops');

    // 3.4 Driver History
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const histTab = tabs.find((t) => t.textContent?.includes('History'));
      if (histTab) histTab.click();
    });
    await sleep(800);
    await snap('13_driver_history');

    // 3.5 Driver Profile
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const profTab = tabs.find((t) => t.textContent?.includes('Profile'));
      if (profTab) profTab.click();
    });
    await sleep(800);
    await snap('14_driver_profile');

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 4: CONDUCTOR PORTAL (6371289527 / Admin@123)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n--- Capturing Conductor Portal ---');
    await login('6371289527', 'Admin@123');

    // 4.1 Conductor Home
    await snap('15_conductor_home');

    // 4.2 Conductor Scan
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const scanTab = tabs.find((t) => t.textContent?.includes('Scan'));
      if (scanTab) scanTab.click();
    });
    await sleep(800);
    await snap('16_conductor_scan');

    // 4.3 Conductor Passengers
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const passTab = tabs.find((t) => t.textContent?.includes('Passengers') || t.textContent?.includes('Manifest'));
      if (passTab) passTab.click();
    });
    await sleep(800);
    await snap('17_conductor_passengers');

    // 4.4 Conductor Cash Tickets POS
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const cashTab = tabs.find((t) => t.textContent?.includes('Cash') || t.textContent?.includes('POS'));
      if (cashTab) cashTab.click();
    });
    await sleep(800);
    await snap('18_conductor_cash_tickets');

    // 4.5 Conductor Profile
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .bottom-nav-item, header button'));
      const profTab = tabs.find((t) => t.textContent?.includes('Profile'));
      if (profTab) profTab.click();
    });
    await sleep(800);
    await snap('19_conductor_profile');

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 5: FLEET OWNER / OPERATOR ADMIN (9861465410 / Admin@123)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n--- Capturing Fleet Owner Portal ---');
    await login('9861465410', 'Admin@123');

    // 5.1 Owner Home
    await snap('20_owner_home');

    // 5.2 Owner Buses
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const busTab = tabs.find((t) => t.textContent?.includes('Buses') || t.textContent?.includes('Fleet'));
      if (busTab) busTab.click();
    });
    await sleep(800);
    await snap('21_owner_buses');

    // 5.3 Owner Live Map Radar
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const mapTab = tabs.find((t) => t.textContent?.includes('Live Map') || t.textContent?.includes('Radar'));
      if (mapTab) mapTab.click();
    });
    await sleep(1000);
    await snap('22_owner_live_map');

    // 5.4 Owner Staff
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const staffTab = tabs.find((t) => t.textContent?.includes('Staff') || t.textContent?.includes('Crew'));
      if (staffTab) staffTab.click();
    });
    await sleep(800);
    await snap('23_owner_staff');

    // 5.5 Owner Routes
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const routeTab = tabs.find((t) => t.textContent?.includes('Routes'));
      if (routeTab) routeTab.click();
    });
    await sleep(800);
    await snap('24_owner_routes');

    // 5.6 Owner Trips
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const tripTab = tabs.find((t) => t.textContent?.includes('Trips'));
      if (tripTab) tripTab.click();
    });
    await sleep(800);
    await snap('25_owner_trips');

    // 5.7 Owner Revenue
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const revTab = tabs.find((t) => t.textContent?.includes('Revenue'));
      if (revTab) revTab.click();
    });
    await sleep(800);
    await snap('26_owner_revenue');

    // 5.8 Owner Profile
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const profTab = tabs.find((t) => t.textContent?.includes('Profile'));
      if (profTab) profTab.click();
    });
    await sleep(800);
    await snap('27_owner_profile');

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 6: SUPER ADMIN DASHBOARD (9876500000 / Password123!)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n--- Capturing Super Admin Portal (Zero Map/Tracking Verified) ---');
    await login('9876500000', 'Password123!');

    // 6.1 Super Admin Home
    await snap('28_superadmin_home');

    // 6.2 Super Admin Owners
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const ownTab = tabs.find((t) => t.textContent?.includes('Owners') || t.textContent?.includes('Operators'));
      if (ownTab) ownTab.click();
    });
    await sleep(800);
    await snap('29_superadmin_owners');

    // 6.3 Super Admin Buses
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const busTab = tabs.find((t) => t.textContent?.includes('Buses'));
      if (busTab) busTab.click();
    });
    await sleep(800);
    await snap('30_superadmin_buses');

    // 6.4 Super Admin Staff
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const staffTab = tabs.find((t) => t.textContent?.includes('Staff'));
      if (staffTab) staffTab.click();
    });
    await sleep(800);
    await snap('31_superadmin_staff');

    // 6.5 Super Admin Routes
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const routeTab = tabs.find((t) => t.textContent?.includes('Routes'));
      if (routeTab) routeTab.click();
    });
    await sleep(800);
    await snap('32_superadmin_routes');

    // 6.6 Super Admin Trips
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const tripTab = tabs.find((t) => t.textContent?.includes('Trips'));
      if (tripTab) tripTab.click();
    });
    await sleep(800);
    await snap('33_superadmin_trips');

    // 6.7 Super Admin Requests
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const reqTab = tabs.find((t) => t.textContent?.includes('Requests'));
      if (reqTab) reqTab.click();
    });
    await sleep(800);
    await snap('34_superadmin_requests');

    // 6.8 Super Admin Profile
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button, .nav-tab-item, header button'));
      const profTab = tabs.find((t) => t.textContent?.includes('Profile'));
      if (profTab) profTab.click();
    });
    await sleep(800);
    await snap('35_superadmin_profile');

    console.log('\n✅ All Golden Capacitor Screenshots Captured Successfully!');
  } catch (err) {
    console.error('❌ Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

main();
