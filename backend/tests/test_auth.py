from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.api import deps as deps_module
from app.main import app
from app.models.profile import Profile


def _fake_profile() -> Profile:
    now = datetime.now(timezone.utc)
    return Profile(
        id=uuid.uuid4(),
        email="doctor@hospital.org",
        first_name="Sarah",
        last_name="Jenkins",
        created_at=now,
        updated_at=now,
    )


def _client_with_user() -> TestClient:
    async def override_get_current_user() -> Profile:
        return _fake_profile()

    app.dependency_overrides[deps_module.get_current_user] = override_get_current_user
    try:
        yield_client = TestClient(app)
    finally:
        pass
    return yield_client


def test_health_ok():
    with TestClient(app) as client:
        resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_me_requires_auth():
    with TestClient(app) as client:
        resp = client.get("/api/auth/me")
    assert resp.status_code in (401, 403)


def test_me_returns_profile():
    client = _client_with_user()
    try:
        resp = client.get("/api/auth/me")
    finally:
        app.dependency_overrides.clear()
    assert resp.status_code == 200
    body = resp.json()["user"]
    assert body["email"] == "doctor@hospital.org"
    assert body["first_name"] == "Sarah"
