# Qaza Tracker — Backend

FastAPI backend exposing the Qaza Tracker REST API, backed by Supabase.

## Stack
- FastAPI, Supabase (Postgres), deployed as a Vercel serverless function

## Setup
```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL / SUPABASE_KEY / TELEGRAM_TOKEN
uvicorn app.main:app --reload
```

## Authentication
Every route that returns or changes a user's data requires Telegram's signed `initData`
in the header `Authorization: tma <initData>`. `app/auth.py` recomputes Telegram's HMAC
signature with the bot token (`TELEGRAM_TOKEN`), rejects data older than 24 hours, and only
lets a user read or write **their own** data (401 if the signature is missing or invalid,
403 if the user id does not match). `/` and `/qaza/quotes` stay public.

`AUTH_MODE=log` is for rollout: nothing is blocked, but `AUTH_WOULD_BLOCK` / `AUTH_OK` lines are
printed so you can check real traffic first. Any other value enforces.

```bash
pip install -r requirements-dev.txt
python -m pytest tests      # 14 tests, no database needed
```

## Structure
- `app/main.py` — FastAPI app + CORS config
- `app/auth.py` — Telegram `initData` verification
- `app/api/qaza.py` — routes
- `app/database/` — Supabase queries and stats aggregation
- `api/index.py` — Vercel serverless entrypoint

## Note on shared code
`app/database/` is duplicated in [telegram_bot](../telegram_bot), since
the Telegram bot talks to Supabase directly rather than through this API. If
you change the schema or a query here, check whether the bot's copy needs the
same update.

## Deployment
Deployed on Vercel. Production branch: `main`. Any other branch gets its own
automatic preview deployment. Remember to keep CORS `allow_origins` /
`allow_origin_regex` in `app/main.py` in sync with the frontend's actual domains.
Part of the [Qaza Tracker monorepo](../README.md). Vercel Root Directory: `backend`.
