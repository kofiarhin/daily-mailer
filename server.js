// server/index.js

const express = require("express");
const cron = require("node-cron");
const sendEmail = require("./sendEmail");

const app = express();
const port = process.env.PORT || 5000;

// Parse JSON body
app.use(express.json());

// Route: send to any email you pass in body
// Example: POST /send-email { "to": "kofi@example.com" }
app.post("/send-email", async (req, res) => {
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ error: "Missing 'to' email address" });
  }

  try {
    await sendEmail({
      to,
      subject: "Dynamic email",
      text: `Hello ${to}, this is your dynamic email.`,
    });
    res.json({ ok: true, message: `Email sent to ${to}` });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ ok: false, error: "Failed to send email" });
  }
});

// Cron: runs every day at 6 AM
cron.schedule(
  "0 6 * * *",
  async () => {
    try {
      const to = "kofiarhin69@gmail.com";
      await sendEmail({
        to,
        subject: "Daily 6 AM check-in",
        text: "Good morning! This is your scheduled 6 AM email.",
      });
      console.log(`[CRON] Sent 6 AM email to ${to}`);
    } catch (err) {
      console.error("[CRON] Failed to send daily email:", err);
    }
  },
  { scheduled: true, timezone: "Europe/London" }
);

app.listen(port, () => console.log("server started on port:", port));
