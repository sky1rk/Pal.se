from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.supabase import verify_bearer_token
from app.db.session import get_db
from app.models.profile import Profile

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    claims = verify_bearer_token(credentials.credentials)
    user_id = uuid.UUID(str(claims["sub"]))
    profile = await db.get(Profile, user_id)
    if profile is None:
        # Trigger should have created this; 404 (not 500) signals retry-after-signup race.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not ready, retry shortly",
        )
    return profile
