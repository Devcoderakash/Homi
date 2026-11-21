import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const VIEWPORTS = [
  { name: "Small-Mobile-320", width: 320, height: 568, isMobile: true, hasTouch: true },
  { name: "Standard-Mobile-360", width: 360, height: 740, isMobile: true, hasTouch: true },
  { name: "Large-Mobile-390", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "Modern-Mobile-430", width: 430, height: 932, isMobile: true, hasTouch: true },
  { name: "Small-Tablet-640", width: 640, height: 960, isMobile: true, hasTouch: true },
  { name: "Tablet-768", width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: "Laptop-1024", width: 1024, height: 768, isMobile: false, hasTouch: false },
  { name: "Desktop-1280", width: 1280, height: 800, isMobile: false, hasTouch: false },
  { name: "Large-Desktop-1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: "Wide-Desktop-1920", width: 1920, height: 1080, isMobile: false, hasTouch: false },
];

const PAGES = [
  // Customer App
  { app: "customer", name: "Landing", url: "http://localhost:3000/" },
  { app: "customer", name: "Book", url: "http://localhost:3000/book" },
  { app: "customer", name: "Workers", url: "http://localhost:3000/workers" },
  { app: "customer", name: "BecomeWorker", url: "http://localhost:3000/become-a-worker" },
  { app: "customer", name: "Guide", url: "http://localhost:3000/guide" },
  { app: "customer", name: "Login", url: "http://localhost:3000/login" },
  { app: "customer", name: "CustomerDashboard", url: "http://localhost:3000/customer" },
  // Admin Panel
  { app: "admin", name: "Login", url: "http://localhost:3001/login" },
  { app: "admin", name: "Dashboard", url: "http://localhost:3001/dashboard" },
  { app: "admin", name: "Requests", url: "http://localhost:3001/requests" },
  { app: "admin", name: "Workers", url: "http://localhost:3001/workers" },
  { app: "admin", name: "Applications", url: "http://localhost:3001/applications" },
  { app: "admin", name: "Payments", url: "http://localhost:3001/payments" },
  { app: "admin", name: "Assignments", url: "http://localhost:3001/assignments" },
  { app: "admin", name: "Customers", url: "http://localhost:3001/customers" },
  { app: "admin", name: "Services", url: "http://localhost:3001/services" },
  { app: "admin", name: "Settings", url: "http://localhost:3001/settings" },
];

async function getAdminToken() {
  try {
    const res = await fetch("http://localhost:4000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@homi.demo", password: "demo1234" }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.token;
  } catch (err) {
    console.warn("Could not obtain admin token automatically:", err.message);
    return null;
  }
}

async function runAudit() {
  const outputDir = path.resolve("reports/screenshots");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const adminToken = await getAdminToken();
  if (adminToken) {
    console.log("Admin token acquired successfully for authenticated route audit.");
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = [];
  console.log(`Starting Viewport Audit across ${PAGES.length} pages and ${VIEWPORTS.length} viewports...`);

  for (const pageDef of PAGES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      try {
        await page.setViewport({
          width: vp.width,
          height: vp.height,
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });

        // Set admin token and auth cookie for admin pages
        if (pageDef.app === "admin" && pageDef.name !== "Login" && adminToken) {
          await page.evaluateOnNewDocument((token) => {
            localStorage.setItem("admin_token", token);
            document.cookie = `sb-access-token=${token}; path=/; SameSite=Lax`;
            document.cookie = `homi_admin_session=${token}; path=/; SameSite=Lax`;
          }, adminToken);
        }

        await page.goto(pageDef.url, { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;
          const bodyW = document.body ? document.body.scrollWidth : 0;
          return {
            hasOverflow: docW > winW || bodyW > winW,
            scrollWidth: Math.max(docW, bodyW),
            innerWidth: winW,
            diff: Math.max(docW, bodyW) - winW,
          };
        });

        const screenshotName = `${pageDef.app}-${pageDef.name}-${vp.name}.png`;
        const screenshotPath = path.join(outputDir, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        const status = overflow.hasOverflow ? "FAIL (Overflow)" : "PASS";
        console.log(`[${status}] ${pageDef.app} ${pageDef.name} @ ${vp.name} (${vp.width}px) - Scroll: ${overflow.scrollWidth}px / Win: ${overflow.innerWidth}px`);

        results.push({
          app: pageDef.app,
          page: pageDef.name,
          url: pageDef.url,
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          status,
          hasOverflow: overflow.hasOverflow,
          overflowDiff: overflow.diff,
          screenshot: `reports/screenshots/${screenshotName}`,
        });
      } catch (err) {
        console.error(`Error on ${pageDef.name} @ ${vp.name}:`, err.message);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();

  const resultsPath = path.resolve("reports/viewport-audit-results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status.startsWith("FAIL")).length;

  console.log("\n=======================================================");
  console.log(`AUDIT COMPLETE: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log(`Detailed results saved to: ${resultsPath}`);
  console.log("=======================================================\n");
}

runAudit().catch(console.error);
