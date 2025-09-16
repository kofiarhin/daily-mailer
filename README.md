# Daily Mailer

A minimal Node/Express service that:
- Sends an automated email at **06:00 (Mon–Fri, Europe/London)** using `node-cron`.
- Exposes an endpoint to **send emails on demand** with `nodemailer`.
- Deploys cleanly to **Heroku**.

---

## Tech
- Node 18+, Express
- node-cron
- nodemailer (SMTP; e.g., Gmail App Password)

---

## Endpoints
- `GET /` – health check
- `POST /send-email`
  - Body: `{ "to": "you@example.com" }`
  - Sends a one-off email to the provided address.

Example:
```bash
curl -X POST https://<YOUR-APP>.herokuapp.com/send-email   -H "Content-Type: application/json"   -d '{"to":"you@example.com"}'
```

---

## Cron (default)
- Schedule: `0 6 * * 1-5` (Mon–Fri at 06:00)
- Timezone: `Europe/London`
- Runs on a **single dyno** (`web.1`) to avoid duplicate sends.

Override via env:
```bash
CRON_SCHEDULE="0 6 * * 1-5"
TZ="Europe/London"
```
(For smoke tests, use `CRON_SCHEDULE="*/1 * * * 1-5"` to run every minute on weekdays.)

---

## Environment Variables

SMTP:
- `EMAIL_USER` – SMTP username/email (e.g., Gmail address)
- `EMAIL_PASS` – SMTP password or **App Password**

Recipients:
- `DAILY_EMAIL_TO` – email address for the daily cron

Cron controls:
- `CRON_ENABLED` – `true`/`false` (default `true`)
- `CRON_SCHEDULE` – cron expression (default `0 6 * * 1-5`)
- `TZ` – timezone (default `Europe/London`)

**Local only**: put these in `.env` (don’t commit).

---

## Local Development
```bash
npm install
# dev (auto-restart)
npm run server
# prod-like
npm start
```

`.env` example:
```env
EMAIL_USER=you@gmail.com
EMAIL_PASS=your-app-password
DAILY_EMAIL_TO=you@example.com
CRON_ENABLED=true
CRON_SCHEDULE=0 6 * * 1-5
TZ=Europe/London
```

---

## Deploy to Heroku (CLI)
```bash
# set remote (once)
heroku git:remote -a daily-mailer

# config vars
heroku config:set -a daily-mailer   EMAIL_USER=you@gmail.com EMAIL_PASS=your-app-password   DAILY_EMAIL_TO=you@example.com   CRON_ENABLED=true TZ=Europe/London   CRON_SCHEDULE="0 6 * * 1-5"

# deploy
git push heroku main
```

**Procfile**
```
web: node server.js
```

---

## Logs & Verification
```bash
# live logs
heroku logs --tail -a daily-mailer

# filter cron lines (if you use [CRON] prefixes)
heroku logs --tail -a daily-mailer | grep CRON
```

**Smoke test cron:**
```bash
heroku config:set CRON_SCHEDULE="*/1 * * * 1-5" -a daily-mailer
# watch logs for ticks/success, then revert:
heroku config:set CRON_SCHEDULE="0 6 * * 1-5" -a daily-mailer
```

---

## Troubleshooting
- **“Cannot find module 'node-cron'”** — ensure it's in `dependencies` and the lockfile is in sync:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  git add package.json package-lock.json
  git commit -m "sync lockfile"
  git push heroku main
  ```

- **`.env` on Heroku** — Heroku uses config vars; load dotenv only in non-production:
  ```js
  if (process.env.NODE_ENV !== "production") require("dotenv").config();
  ```

- **Duplicate emails** — keep a single web dyno or move cron to a worker:
  ```bash
  heroku ps:scale web=1 -a daily-mailer
  ```

---

## Structure
```
Procfile
package.json
server.js
sendEmail.js
request.rest
```
