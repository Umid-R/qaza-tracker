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

## Authentication and testing
Every API call sends Telegram's signed `initData` (`Authorization: tma ...`), and the backend only
serves a user their own data. `initData` only exists inside Telegram, so test by opening the Mini App
from the bot (a browser tab will get `401`).

## Deployment
Deployed on Vercel. Production branch: `main`. Any other branch gets its own
automatic preview deployment.
Part of the [Qaza Tracker monorepo](../README.md). Vercel Root Directory: `frontend`.
