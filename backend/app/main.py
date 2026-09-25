# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.qaza import router as qaza_router

app = FastAPI(title="Qaza Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://jsur.vercel.app",
        "https://qazo-tracker.vercel.app",
    ],
    # Every Vercel preview build (e.g. dev-branch previews) gets its own
    # random subdomain under the same Vercel team/project, like:
    #   https://frontend-qaza-tracker-q1zn164sv-umids-projects-c2dd780a.vercel.app
    # This regex allows any of those preview URLs without hardcoding each
    # one, while still only matching your own Vercel team's domains.
    allow_origin_regex=r"^https://[a-z0-9-]+-umids-projects-c2dd780a\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(qaza_router, prefix="/qaza", tags=["Qaza"])

@app.get("/")
def root():
    return {"status": "Qaza API running"}
