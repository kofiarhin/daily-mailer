// clock.js
// Standalone cron worker for Heroku (no HTTP server)

// Load .env in local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const cron = require("node-cron");
const sendEmail = require("./sendEmail");

// ---------- Config ----------
const CRON_ENABLED =
  (process.env.CRON_ENABLED || "true").toLowerCase() !== "false";
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 6 * * *"; // 06:00 daily
const CRON_TZ = process.env.CRON_TZ || process.env.TZ || "Europe/London";
const CRON_TO = process.env.DAILY_EMAIL_TO || "you@example.com";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sendWithRetry = async (payload, tries = 3) => {
  for (let i = 1; i <= tries; i++) {
    try {
      await sendEmail(payload);
      return true;
    } catch (e) {
      console.error(`[CLOCK] send attempt ${i} failed:`, e?.message || e);
      if (i < tries) await sleep(1000 * i);
    }
  }
  return false;
};

// ---------- Boot ----------
if (!CRON_ENABLED) {
  console.log("[CLOCK] cron disabled, exiting");
  process.exit(0);
}

console.log(`[CLOCK] worker running → schedule=${CRON_SCHEDULE} tz=${CRON_TZ}`);

// ---------- Schedule ----------
cron.schedule(
  CRON_SCHEDULE,
  async () => {
    const now = new Date().toISOString();
    console.log(`[CLOCK] tick @ ${now} → sending to ${CRON_TO}`);
    const ok = await sendWithRetry({
      to: CRON_TO,
      subject: "Daily 6 AM check-in",
      text: "Good morning! This is your scheduled email.",
    });
    console.log(
      ok ? `[CLOCK] success → ${CRON_TO}` : `[CLOCK] failed after retries`
    );
  },
  { scheduled: true, timezone: CRON_TZ }
);

// ---------- Keep process alive ----------
setInterval(() => {}, 60 * 60 * 1000);
