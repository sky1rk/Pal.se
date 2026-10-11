from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.core.config import get_settings

settings = get_settings()

origins = list(
    dict.fromkeys(
        [
            "http://localhost:5173",
            settings.FRONTEND_ORIGIN,
        ]
    )
)

app = FastAPI(title="PAL.SE API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
