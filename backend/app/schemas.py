from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class SignupIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False


class UserOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr


class AuthResponse(BaseModel):
    user: UserOut


class MeResponse(BaseModel):
    user: UserOut | None = None
