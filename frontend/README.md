# Qaza Tracker — Frontend

React + Vite + TypeScript Telegram Mini App for tracking missed (qaza) prayers.

## Stack
- React 18, TypeScript, Vite, Tailwind
- Runs embedded inside Telegram (uses Telegram WebApp SDK to identify the user)
- Talks to the [backend](../backend) API over HTTP

## Setup
```bash
npm install
cp .env.example .env   # fill in VITE_API_URL
npm run dev
```

## Testing outside Telegram
Since this app normally gets the user's ID from Telegram's SDK, testing in a
regular browser needs a manual override: append `?uid=<telegram_user_id>` to
the URL, e.g. `http://localhost:5173/?uid=123456789`.

## Deployment
Deployed on Vercel. Production branch: `main`. Any other branch gets its own
automatic preview deployment.
Part of the [Qaza Tracker monorepo](../README.md). Vercel Root Directory: `frontend`.
