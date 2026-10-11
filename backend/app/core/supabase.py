"""Verify Supabase access tokens locally via cached JWKS (no per-request network hop)."""

from __future__ import annotations

import uuid
from functools import lru_cache

import jwt
from fastapi import HTTPException, status

from app.core.config import get_settings


@lru_cache(maxsize=1)
def _jwks_client() -> jwt.PyJWKClient:
    settings = get_settings()
    return jwt.PyJWKClient(settings.jwks_url, cache_keys=True, lifespan=600)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def verify_bearer_token(token: str) -> dict:
    """Return verified claims ({sub, email, user_metadata}) or raise 401."""
    settings = get_settings()
    if not settings.SUPABASE_URL:
        raise _unauthorized("Auth is not configured")
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=settings.SUPABASE_JWT_AUD,
            issuer=f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1",
            leeway=30,
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError:
        raise _unauthorized("Invalid or expired token") from None
    # Normalize sub to UUID early (fail closed).
    try:
        uuid.UUID(str(claims.get("sub")))
    except (ValueError, AttributeError, TypeError):
        raise _unauthorized("Invalid token subject") from None
    return claims
