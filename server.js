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
    message: "this is a happy place dont ruin it",
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

// ---------- CRON (Heroku web dyno safe-ish) ----------
// NOTE: This version schedules only on web.1 to avoid duplicates when scaling web dynos.
// For production-grade reliability, run cron in a worker process (Procfile: `worker: node clock.js`).

const isHeroku = Boolean(process.env.DYNO);
const dyno = process.env.DYNO || "local";
const isWebDyno = isHeroku ? dyno.startsWith("web.") : true; // true locally
const isPrimaryDyno = isHeroku ? dyno === "web.1" : true; // schedule only on web.1 in Heroku

const cronEnabled =
  (process.env.CRON_ENABLED || "true").toLowerCase() !== "false";
const CRON_TO = process.env.DAILY_EMAIL_TO || "you@example.com";
// For quick testing: CRON_SCHEDULE="*/1 * * * *"
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 6 * * *"; // 06:00 daily
const CRON_TZ = process.env.CRON_TZ || process.env.TZ || "Europe/London";

if (cronEnabled && isWebDyno && isPrimaryDyno) {
  console.log(
    `[CRON] scheduling ${CRON_SCHEDULE} tz=${CRON_TZ} on dyno=${dyno} (primary=${isPrimaryDyno})`
  );

  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      const now = new Date().toISOString();
      console.log(`[CRON] tick @ ${now} -> sending to ${CRON_TO}`);
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
    `[CRON] skipped: enabled=${cronEnabled}, isWebDyno=${isWebDyno}, isPrimaryDyno=${isPrimaryDyno}, dyno=${dyno}`
  );
}

// ---------- Start ----------
const server = app.listen(port, () => {
  console.log("server started on port:", port, "dyno:", dyno);
});

// Graceful shutdown (Heroku dyno cycles)
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("server closed gracefully");
  });
});
