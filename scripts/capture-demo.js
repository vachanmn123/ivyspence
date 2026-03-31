#!/usr/bin/env node
/**
 * Demo capture script for IvySpence.
 *
 * Starts the Next.js app, navigates through all pages using a headless
 * browser, saves screenshots to screenshots/, and stitches them into a
 * demo video at demo/demo.mp4.
 *
 * Requirements: PostgreSQL running locally, ffmpeg, Google Chrome
 *
 * Usage:
 *   node scripts/capture-demo.js
 *
 * Environment variables (optional overrides):
 *   DATABASE_PRISMA_URL      – Postgres connection string (pooled)
 *   DATABASE_URL_NON_POOLING – Postgres connection string (direct)
 *   PORT                     – Port for the Next.js server (default 3001)
 */

"use strict";

const puppeteer = require("puppeteer");
const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// ─── Configuration ────────────────────────────────────────────────────────────

const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOTS_DIR = path.join(ROOT, "screenshots");
const VIDEO_DIR = path.join(ROOT, "demo");
const VIDEO_PATH = path.join(VIDEO_DIR, "demo.mp4");

const DB_URL =
  process.env.DATABASE_PRISMA_URL ||
  "postgresql://ivyspence:ivyspence123@localhost:5432/ivyspence";
const DB_DIRECT =
  process.env.DATABASE_URL_NON_POOLING ||
  "postgresql://ivyspence:ivyspence123@localhost:5432/ivyspence";

const NEXTAUTH_SECRET = "demo-secret-for-capture-script-only";

// Chrome executable: prefer env var, then common Linux paths, then let
// Puppeteer auto-detect (falls back to its bundled Chromium).
const CHROME_EXECUTABLE =
  process.env.CHROME_EXECUTABLE ||
  [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].find((p) => fs.existsSync(p)) ||
  undefined; // undefined → Puppeteer uses its bundled Chromium

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[capture-demo] ${msg}`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** Wait for the Next.js server to respond (retries every second). */
async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch (_) {
      // not ready yet – keep waiting
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs} ms`);
}

/** Capture a full-page screenshot and record the file path. */
async function screenshot(page, name, screenshotFiles) {
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  screenshotFiles.push(file);
  log(`  📸  ${name}.png`);
  return file;
}

// ─── Patch layout.js to remove Google Fonts for offline builds ───────────────

const LAYOUT_PATH = path.join(ROOT, "app", "layout.js");

/**
 * Temporarily replace the `next/font/google` import with a no-op so the
 * Next.js build succeeds in environments without internet access (CI, sandboxes).
 * Returns the original file content so it can be restored later.
 */
function patchLayoutForOfflineBuild() {
  const original = fs.readFileSync(LAYOUT_PATH, "utf8");
  const patched = original
    // Remove the google-font import line
    .replace(
      /^import\s+\{[^}]+\}\s+from\s+"next\/font\/google";\n/m,
      "// next/font/google import removed for offline demo build\n"
    )
    // Replace the Inter() call with a plain object that has a className property
    .replace(
      /^const\s+inter\s*=\s*Inter\([^)]*\);\n/m,
      "const inter = { className: '' }; // offline fallback\n"
    );
  fs.writeFileSync(LAYOUT_PATH, patched, "utf8");
  return original;
}

function restoreLayout(original) {
  fs.writeFileSync(LAYOUT_PATH, original, "utf8");
}

// ─── Database seeding ─────────────────────────────────────────────────────────

async function seedDatabase() {
  log("Seeding database with demo data…");

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url: DB_DIRECT } },
  });

  try {
    // Clean up any leftover data from a previous demo run
    await prisma.session.deleteMany({
      where: { userId: { startsWith: "demo" } },
    });
    await prisma.transaction.deleteMany({
      where: { userId: { startsWith: "demo" } },
    });
    await prisma.account.deleteMany({
      where: { userId: { startsWith: "demo" } },
    });
    await prisma.user.deleteMany({ where: { id: { startsWith: "demo" } } });

    // Create demo user
    const user = await prisma.user.create({
      data: {
        id: "demo-user-001",
        name: "Demo User",
        email: "demo@ivyspence.demo",
        emailVerified: new Date(),
        defaultCurrencyCode: "USD",
      },
    });

    // Sample transactions
    const txData = [
      {
        name: "Salary",
        description: "Monthly salary",
        amount: 3500,
        daysAgo: 30,
      },
      {
        name: "Rent",
        description: "Monthly rent payment",
        amount: -1200,
        daysAgo: 28,
      },
      {
        name: "Groceries",
        description: "Weekly grocery shopping",
        amount: -120,
        daysAgo: 21,
      },
      {
        name: "Freelance",
        description: "Website project",
        amount: 800,
        daysAgo: 15,
      },
      {
        name: "Utilities",
        description: "Electricity and water",
        amount: -95,
        daysAgo: 10,
      },
      {
        name: "Restaurant",
        description: "Dinner with friends",
        amount: -65,
        daysAgo: 5,
      },
    ];

    const transactions = [];
    for (const tx of txData) {
      const date = new Date();
      date.setDate(date.getDate() - tx.daysAgo);
      const t = await prisma.transaction.create({
        data: {
          name: tx.name,
          description: tx.description,
          amount: tx.amount,
          userId: user.id,
          createdAt: date,
          updatedAt: date,
        },
      });
      transactions.push(t);
    }

    // Create a long-lived demo session (24 h)
    const sessionToken = "demo-session-token-for-capture-001";
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: { sessionToken, userId: user.id, expires },
    });

    log("  ✅  Database seeded");
    return { user, transactions, sessionToken };
  } finally {
    await prisma.$disconnect();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  ensureDir(SCREENSHOTS_DIR);
  ensureDir(VIDEO_DIR);

  // 1. Database migrations
  log("Running database migrations…");
  execSync("npx prisma migrate deploy", {
    cwd: ROOT,
    env: {
      ...process.env,
      DATABASE_PRISMA_URL: DB_URL,
      DATABASE_URL_NON_POOLING: DB_DIRECT,
    },
    stdio: "inherit",
  });

  // 2. Seed
  const { transactions, sessionToken } = await seedDatabase();

  // 3. Build Next.js (with offline-safe layout patch)
  log("Patching layout.js for offline build…");
  const originalLayout = patchLayoutForOfflineBuild();
  let buildError = null;
  try {
    log("Building the Next.js app (this may take a minute)…");
    execSync("npm run build", {
      cwd: ROOT,
      env: {
        ...process.env,
        DATABASE_PRISMA_URL: DB_URL,
        DATABASE_URL_NON_POOLING: DB_DIRECT,
        NEXTAUTH_SECRET,
        NEXTAUTH_URL: BASE_URL,
        NODE_ENV: "production",
      },
      stdio: "inherit",
    });
  } catch (err) {
    buildError = err;
  } finally {
    log("Restoring layout.js…");
    restoreLayout(originalLayout);
  }
  if (buildError) throw buildError;

  // 4. Start Next.js server
  log(`Starting Next.js server on port ${PORT}…`);
  const server = spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
    cwd: ROOT,
    env: {
      ...process.env,
      DATABASE_PRISMA_URL: DB_URL,
      DATABASE_URL_NON_POOLING: DB_DIRECT,
      NEXTAUTH_SECRET,
      NEXTAUTH_URL: BASE_URL,
      NODE_ENV: "production",
      PORT: String(PORT),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));

  await waitForServer(BASE_URL);
  log("Server is up.");

  // 5. Launch browser and capture screenshots
  log("Launching browser…");
  const browser = await puppeteer.launch({
    headless: "new",
    ...(CHROME_EXECUTABLE ? { executablePath: CHROME_EXECUTABLE } : {}),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const screenshotFiles = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const snap = (name) => screenshot(page, name, screenshotFiles);

    // 5a. Home page (logged-out)
    log("Capturing home page (logged-out)…");
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    await snap("01-home");

    // 5b. Sign-in page
    log("Capturing sign-in page…");
    await page.goto(`${BASE_URL}/api/auth/signin`, {
      waitUntil: "networkidle2",
    });
    await snap("02-signin");

    // 5c. Inject session cookie so we appear logged in
    log("Setting demo session cookie…");
    await page.setCookie({
      name: "next-auth.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });

    // 5d. Home page (logged-in)
    log("Capturing home page (logged-in)…");
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    await snap("03-home-loggedin");

    // 5e. Transactions list
    log("Capturing transactions page…");
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle2" });
    await page.waitForSelector("table", { timeout: 10000 }).catch(() => {});
    await snap("04-transactions");

    // 5f. Fill the Add Transaction form
    log("Filling in the Add Transaction form…");
    await page.type('input[name="name"]', "Coffee");
    await page.type('input[name="description"]', "Morning coffee");
    await page.type('input[name="amount"]', "4.50");
    await snap("05-add-transaction-form-filled");

    await page.click('button[type="submit"]');
    await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
    await snap("06-after-add-transaction");

    // 5g. Edit an existing transaction
    if (transactions.length > 0) {
      const tx = transactions[0];
      log(`Capturing edit page for "${tx.name}"…`);
      await page.goto(`${BASE_URL}/transactions/${tx.id}`, {
        waitUntil: "networkidle2",
      });
      await snap("07-edit-transaction");

      const descInput = await page.$('input[name="description"]');
      if (descInput) {
        await descInput.click({ clickCount: 3 });
        await descInput.type("Updated description");
        await snap("08-edit-transaction-modified");
      }
    }

    // 5h. Transactions page after updates
    log("Capturing final transactions page…");
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle2" });
    await snap("09-transactions-final");
  } finally {
    await browser.close();
    server.kill("SIGTERM");
  }

  // 6. Assemble video from screenshots using ffmpeg
  log("Assembling demo video from screenshots…");

  // Write ffmpeg concat file – each frame displayed for 2 seconds
  const concatList = path.join(VIDEO_DIR, "frames.txt");
  const lines = screenshotFiles.map((f) => `file '${f}'\nduration 2`);
  // Repeat the last frame so ffmpeg includes it fully
  lines.push(`file '${screenshotFiles[screenshotFiles.length - 1]}'`);
  fs.writeFileSync(concatList, lines.join("\n"), "utf8");

  execSync(
    [
      "ffmpeg -y",
      `-f concat -safe 0 -i "${concatList}"`,
      `-vf "scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2,fps=1"`,
      `-c:v libx264 -pix_fmt yuv420p`,
      `"${VIDEO_PATH}"`,
    ].join(" "),
    { stdio: "inherit" }
  );

  log(`✅  Video  → ${VIDEO_PATH}`);
  log(`✅  Screenshots → ${SCREENSHOTS_DIR}`);
  log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
