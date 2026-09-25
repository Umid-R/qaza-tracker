# Qaza Tracker — Backend

FastAPI backend exposing the Qaza Tracker REST API, backed by Supabase.

## Stack
- FastAPI, Supabase (Postgres), deployed as a Vercel serverless function

## Setup
```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL / SUPABASE_KEY
uvicorn app.main:app --reload
```

## Structure
- `app/main.py` — FastAPI app + CORS config
- `app/api/qaza.py` — routes
- `app/database/` — Supabase queries and stats aggregation
- `api/index.py` — Vercel serverless entrypoint

## Note on shared code
`app/database/` is duplicated in [qaza-tracker-bot](../qaza-tracker-bot), since
the Telegram bot talks to Supabase directly rather than through this API. If
you change the schema or a query here, check whether the bot's copy needs the
same update.

## Deployment
Deployed on Vercel. Production branch: `main`. Any other branch gets its own
automatic preview deployment. Remember to keep CORS `allow_origins` /
`allow_origin_regex` in `app/main.py` in sync with the frontend's actual domains.
