// server.js

// Load .env only in local dev (Heroku uses config vars)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cron = require("node-cron");
const sendEmail = require("./sendEmail");

const app = express();
const port = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(express.json());

// ---------- Health ----------
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    dyno: process.env.DYNO || "local",
    ts: new Date().toISOString(),
  });
});

// ---------- Manual send (dynamic recipient) ----------
// POST /send-email  { "to": "kofi@example.com" }
app.post("/send-email", async (req, res) => {
  const { to } = req.body || {};
  if (!to)
    return res
      .status(400)
      .json({ ok: false, error: "Missing 'to' email address" });

  try {
    await sendEmail({
      to,
      subject: "Dynamic email",
      text: `Hello ${to}, this is your dynamic email.`,
    });
    return res.json({ ok: true, message: `Email sent to ${to}` });
  } catch (err) {
    console.error("[SEND] error:", err);
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
});

// ---------- CRON (Heroku-friendly) ----------
// FIX: schedule on ANY Heroku web dyno (web.1, web.2, web.3, ...), not just web.1
const isHeroku = !!process.env.DYNO;
const isWebDyno = isHeroku ? process.env.DYNO.startsWith("web.") : true; // true locally
const isPrimaryDyno = isWebDyno; // single web dyno → fine; multiple web dynos → consider Scheduler/worker to avoid dupes

const cronEnabled =
  (process.env.CRON_ENABLED || "true").toLowerCase() !== "false";
const CRON_TO = process.env.DAILY_EMAIL_TO || "you@example.com";
// For quick testing set CRON_SCHEDULE="*/1 * * * *" in Heroku config
// Default: 06:00 every day (use "0 6 * * 1-5" for Mon–Fri)
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 6 * * *";
const CRON_TZ = process.env.TZ || "Europe/London";

if (isPrimaryDyno && cronEnabled) {
  console.log(
    `[CRON] scheduling ${CRON_SCHEDULE} (${CRON_TZ}) on dyno=${
      process.env.DYNO || "local"
    }`
  );
  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      console.log(`[CRON] tick -> sending to ${CRON_TO}`);
      try {
        await sendEmail({
          to: CRON_TO,
          subject: "Daily 6 AM check-in",
          text: "Good morning! This is your scheduled email.",
        });
        console.log(`[CRON] success -> ${CRON_TO}`);
      } catch (err) {
        console.error("[CRON] error:", err);
      }
    },
    { scheduled: true, timezone: CRON_TZ }
  );
} else {
  console.log(
    `[CRON] skipped: isWebDyno=${isWebDyno}, enabled=${cronEnabled}, dyno=${
      process.env.DYNO || "local"
    }`
  );
}

// ---------- Start ----------
const server = app.listen(port, () => {
  console.log(
    "server started on port:",
    port,
    "dyno:",
    process.env.DYNO || "local"
  );
});

// Graceful shutdown (Heroku dyno cycles)
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("server closed gracefully");
  });
});
