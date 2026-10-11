from __future__ import annotations

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import (
    COOKIE_NAME,
    COOKIE_SECURE,
    FRONTEND_ORIGIN,
    JWT_EXPIRE_MINUTES,
    REMEMBER_ME_EXPIRE_DAYS,
)
from app.db import Base, engine, get_db
from app.deps import get_current_user, get_current_user_optional
from app.models import DeactivatedUser, User
from app.routers.predictions import router as predictions_router
from app.schemas import (
    AuthResponse,
    LoginIn,
    MeResponse,
    ProfileUpdateIn,
    SignupIn,
    UserOut,
)
from app.security import create_access_token, hash_password, verify_password

origins = [
    "http://localhost:5173",
    FRONTEND_ORIGIN,
]

app = FastAPI(title="PAL.SE Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(predictions_router)


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
    )


def _set_auth_cookie(response: Response, token: str, max_age_seconds: int | None = None) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=max_age_seconds if max_age_seconds is not None else JWT_EXPIRE_MINUTES * 60,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupIn, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    db.refresh(user)
    _set_auth_cookie(response, create_access_token(user.id))
    return AuthResponse(user=_to_user_out(user))


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if db.get(DeactivatedUser, user.id) is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")
    expires_minutes = (
        REMEMBER_ME_EXPIRE_DAYS * 24 * 60 if payload.remember_me else JWT_EXPIRE_MINUTES
    )
    _set_auth_cookie(
        response,
        create_access_token(user.id, expires_minutes=expires_minutes),
        max_age_seconds=expires_minutes * 60,
    )
    return AuthResponse(user=_to_user_out(user))


@app.patch("/api/auth/me", response_model=AuthResponse)
def update_me(
    payload: ProfileUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AuthResponse:
    if payload.first_name is not None:
        first_name = payload.first_name.strip()
        if not first_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="First name is required")
        user.first_name = first_name

    if payload.last_name is not None:
        last_name = payload.last_name.strip()
        if not last_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Last name is required")
        user.last_name = last_name

    if payload.email is not None:
        email = payload.email.lower().strip()
        if email != user.email:
            existing = db.query(User).filter(User.email == email).first()
            if existing is not None and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
                )
            user.email = email

    if payload.new_password is not None:
        if not payload.current_password or not verify_password(
            payload.current_password, user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        user.password_hash = hash_password(payload.new_password)

    db.commit()
    db.refresh(user)
    return AuthResponse(user=_to_user_out(user))


@app.delete("/api/auth/me")
def delete_me(
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool]:
    """Soft-delete (deactivate) the signed-in account and clear its session."""
    if db.get(DeactivatedUser, user.id) is None:
        db.add(DeactivatedUser(user_id=user.id))
        db.commit()
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite="lax")
    return {"ok": True}


@app.get("/api/auth/me", response_model=MeResponse)
def me(request: Request, db: Session = Depends(get_db)) -> MeResponse:
    user = get_current_user_optional(request, db)
    if user is None:
        return MeResponse(user=None)
    return MeResponse(user=_to_user_out(user))


@app.post("/api/auth/logout")
def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite="lax")
    return {"ok": True}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
