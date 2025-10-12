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
    try {
      await sendEmail({
        to: CRON_TO,
        subject: "Daily 6 AM check-in",
        text: "Good morning! This is your scheduled email.",
      });
      console.log(`[CLOCK] success → ${CRON_TO}`);
    } catch (err) {
      console.error("[CLOCK] error:", err);
    }
  },
  { scheduled: true, timezone: CRON_TZ }
);

// ---------- Keep process alive ----------
setInterval(() => {}, 60 * 60 * 1000);
