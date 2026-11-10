# 🕌 Qaza Tracker

A Telegram bot and Mini App that helps Muslims **count, remember and make up their missed prayers**. It reminds you of each prayer at the right time, records the ones you miss, and shows how many you still owe. **Used by 12 real people**, in English, Uzbek and Russian.

<p align="center">
  <img src="docs/demo.gif" width="480" alt="Walkthrough: /start, name, city, prayer times, then the Mini App opens">
</p>

*Walkthrough (23 seconds): `/start`, the bot asks for a name and a city, sends that city's prayer times, and the Mini App opens with the count of missed prayers.*

---

## Try it

<table>
<tr>
<td align="center" width="200"><img src="docs/bot-qr.png" width="180" alt="QR code for @qazo_trackerbot"><br><sub>Scan with your phone</sub></td>
<td>

**[@qazo_trackerbot](https://t.me/qazo_trackerbot)** on Telegram

1. Open the bot and send `/start`.
2. Type your name, then send your location or type your city.
3. The bot sends your prayer times. Tap **Qaza Tracker** (the button next to the message box) to open the app.

<img src="docs/bot-profile.png" width="220" alt="The bot's profile in Telegram showing the username @qazo_trackerbot">

</td>
</tr>
</table>

---

## The problem

Muslims pray five times a day, and each prayer has a time window that ends (for example, the morning prayer, Fajr, must be finished before sunrise). A prayer that is missed is not forgotten: it has to be **made up later**, and this make-up prayer is called **qaza**.

The difficulty is the counting. Someone who missed prayers for months or years can owe **hundreds** of them, and the number changes every day: a new miss adds one, a make-up prayer removes one. Paper notes and memory do not work for that, and most people also forget the prayer window itself while they are busy.

## What it does

**The bot (reminders and recording)**
- Sends a message at each prayer time, using prayer times for the user's own city (Aladhan API, Hanafi school).
- Sends a warning **10 minutes before a prayer's time runs out**, with an **"I prayed"** button.
- If nobody answers within 2 hours, it **records the prayer as missed automatically** and removes the message, so nothing is lost silently.
- Sends an extra reminder for Isha at 22:00.
- Handles each user's time zone, which it finds from their location.

**The Mini App (the numbers)**
- **Home:** how many qaza prayers you still owe, and how many of today's five you have prayed.
- **Log:** three tabs. Mark today's five prayers as prayed or missed (a missed one gets a reason: sleep, work or study, travel, health, forgot, other). Add old missed prayers you want to start counting. Clear qaza prayers you have made up (it will not let you clear more than you owe).
- **Calendar:** a monthly summary (prayers on time, missed, qaza done), your most missed prayer and most common reason, and a day-by-day history.
- Also shows weekly activity and a short motivational quote in the user's language.

<p align="center">
  <img src="docs/home.png" width="230" alt="Home: total qaza prayers remaining and today's prayers">
  <img src="docs/calendar.png" width="230" alt="Calendar: monthly summary and daily prayer history">
  <img src="docs/bot-chat.png" width="300" alt="Bot setup chat: name, city, prayer times">
</p>

---

## About the project

| | |
|---|---|
| **Input** | The user's city or location, taps on the "I prayed" button, and prayers logged in the app. Prayer times come from the Aladhan API (Hanafi school), and the city is turned into coordinates with OpenStreetMap. |
| **Output** | Prayer time reminders, a running count of missed prayers, stats and a calendar. |
| **Users** | **12 real users**, in 3 languages. |
| **My role** | Solo: product idea, design, frontend, backend, bot, database, deployment, translations. |
| **Duration** | About 1 month, from scratch. |
| **Stack** | React + TypeScript + Vite + Tailwind (Mini App), FastAPI (API), aiogram (bot), Supabase PostgreSQL, Vercel, Railway |

---

## Architecture

```
                    ┌──────────────────────┐
  Telegram user ───►│ Telegram Mini App    │  frontend/  (React, Vercel)
                    └──────────┬───────────┘
                               │ HTTPS
                    ┌──────────▼───────────┐
                    │ REST API             │  backend/   (FastAPI, Vercel serverless)
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Supabase PostgreSQL  │
                    └──────────▲───────────┘
                               │
                    ┌──────────┴───────────┐
  Telegram user ───►│ Telegram bot         │  telegram_bot/  (aiogram, Railway)
                    │ prayer-time schedulers│
                    └──────────────────────┘
```

- **`frontend/`**: the Mini App. It runs inside Telegram and reads the user's Telegram ID from the Telegram WebApp SDK. Pages: Home, Log, Calendar.
- **`backend/`**: a FastAPI REST API (totals, breakdown, stats, weekly activity, calendar, quotes, log prayers, mark as prayed), deployed as a Vercel serverless function. Every user route checks Telegram's signed login data, so users only reach their own data.
- **`telegram_bot/`**: an always-on bot. Every user gets their own scheduler tasks: a message at each prayer time, and a warning 10 minutes before each prayer's deadline (for example, Fajr ends at sunrise) with an "I prayed" button. If there is no answer within 2 hours, the prayer is recorded as *missed* and the message is deleted. There is also a reminder for Isha at 22:00. The user's time zone is found from their location.
- **Supabase** stores users, prayer logs and missed prayers. The bot talks to it directly, and the Mini App talks to it through the API.

---

## 🧩 Problems I hit and how I solved them

**1. One of the reminders was silently lost (Asr under-detection).**
The bot remembered only one pending reminder per user. When a second reminder came before the first was answered, it overwrote the first and that prayer was never marked as missed. I changed it to track pending reminders **per message**, so several can wait at once.

**2. Random `ConnectionTerminated` errors from the database.**
With many scheduler tasks running at once, the Supabase client's HTTP/2 connections kept getting terminated. I forced HTTP/1.1, and the errors stopped.

**3. The bot crashed on startup with `Illegal header value`.**
A hidden trailing newline in the `SUPABASE_KEY` environment variable broke the request header. I now strip whitespace from every environment variable in the bot and the backend.

**4. Deployments failed on dependency versions.**
`pydantic-core` had no ready-made build for Python 3.13, which forced a failing source build, and pip kept backtracking against Supabase versions. I pinned Python 3.12 and `pydantic==2.5.3`.

**5. Translation quality in Uzbek and Russian.**
My first translations had awkward phrasing and wrong spelling in the greeting. I corrected the orthography, made the bot and the Mini App use the same greeting, and fixed a bug where quotes were not filtered by the user's language.

**6. Simplifying the product as I used it.**
I merged the Profile page into Home, removed stat chips that were not useful, removed the free-text "Other" reason (it is now just "Others"), and log automatically detected missed prayers with the reason "Unknown" instead of a made-up one.

**7. The API trusted whatever user id it was given.**
Routes like `/total/{userId}` returned data for any id in the URL, so a stranger who guessed a Telegram id could read or change that person's prayers. I added Telegram's signed `initData` check on the backend: the Mini App sends it with every call, the backend recomputes the signature with the bot token, rejects stale data, and only allows a user to touch their own data. It has 14 tests, and I rolled it out in a log-only mode first (log what would be blocked, check real traffic, then enforce).

**8. Shared code in two services.**
The bot and the API use the same database queries. I documented this in each folder so a schema change is made in both places.

---

## Repository layout

```
├── frontend/       # React + Vite Mini App       → deploy on Vercel
├── backend/        # FastAPI API                  → deploy on Vercel
└── telegram_bot/   # aiogram bot                  → deploy on Railway
```

Each folder has its own README with setup steps and its own `.env.example`.

### Deploying from this monorepo
| Folder | Host | Setting |
|---|---|---|
| `frontend/` | Vercel | Root Directory = `frontend` |
| `backend/` | Vercel | Root Directory = `backend` |
| `telegram_bot/` | Railway | Root Directory = `telegram_bot` (the config file is `/telegram_bot/railway.json`) |

---

## Run it locally

```bash
# API
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # SUPABASE_URL, SUPABASE_KEY
uvicorn app.main:app --reload

# Mini App
cd frontend && npm install
cp .env.example .env        # VITE_API_URL
npm run dev                 # needs Telegram's signed login data, so open the Mini App from the bot

# Bot
cd telegram_bot && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # TELEGRAM_TOKEN, SUPABASE_URL, SUPABASE_KEY
python -m bot.tg_bot
```

---

## Next steps

- Share the database code between the API and the bot instead of keeping two copies.
- Add automated tests for the reminder logic and the other API routes (the authentication already has tests).
- Add reminders for more time zones and calculation methods.
