from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.user import AuthMeResponse, ProfileOut, ProfileUpdate

router = APIRouter()


@router.get("/api/auth/me", response_model=AuthMeResponse)
async def me(current_user: Profile = Depends(get_current_user)) -> AuthMeResponse:
    return AuthMeResponse(user=ProfileOut.model_validate(current_user))


@router.patch("/api/users/me", response_model=ProfileOut)
async def update_me(
    payload: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileOut:
    profile = await db.get(Profile, current_user.id)
    if profile is None:  # pragma: no cover - defensive; deps already 404s
        profile = current_user
        db.add(profile)
    data = payload.model_dump(exclude_unset=True)
    if data.get("first_name") is not None:
        profile.first_name = data["first_name"].strip()
    if data.get("last_name") is not None:
        profile.last_name = data["last_name"].strip()
    await db.commit()
    await db.refresh(profile)
    return ProfileOut.model_validate(profile)
