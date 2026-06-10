"""API surface: bearer-token gate, fail-closed behavior, request models.

Hermetic: Supabase is left unconfigured (the repo is swapped for a disabled
one after startup), so authenticated requests stop at the 503 DB guard —
enough to prove the auth dependency ran and passed.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from src import main as main_mod
from src.config import Settings
from src.db import Repository
from src.main import EmergencyRequest, OptimizeRequest, ReassignRequest, SuggestRequest

API_KEY = "test-dispatch-key"

PROTECTED = [
    ("/optimize", {"tenant_id": "t"}),
    ("/suggest", {"tenant_id": "t", "job_id": "j"}),
    ("/emergency", {"tenant_id": "t", "job_id": "j"}),
    ("/reassign", {"tenant_id": "t", "tech_id": "x"}),
]

OFFLINE = dict(redis_url="", google_maps_api_key="", supabase_url="", supabase_service_role_key="")


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(
        main_mod, "get_settings", lambda: Settings(dispatch_api_key=API_KEY, **OFFLINE)
    )
    with TestClient(main_mod.app) as c:
        # Disabled repo regardless of the host environment's .env.
        main_mod.app.state.repo = Repository(Settings(**OFFLINE))
        yield c


@pytest.fixture
def unconfigured_client(monkeypatch):
    monkeypatch.setattr(main_mod, "get_settings", lambda: Settings(**OFFLINE))
    with TestClient(main_mod.app) as c:
        main_mod.app.state.repo = Repository(Settings(**OFFLINE))
        yield c


def test_health_requires_no_auth(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@pytest.mark.parametrize("path,body", PROTECTED)
def test_missing_token_rejected(client, path, body):
    assert client.post(path, json=body).status_code == 401


@pytest.mark.parametrize("path,body", PROTECTED)
def test_wrong_token_rejected(client, path, body):
    res = client.post(path, json=body, headers={"Authorization": "Bearer nope"})
    assert res.status_code == 401


@pytest.mark.parametrize("path,body", PROTECTED)
def test_non_bearer_scheme_rejected(client, path, body):
    res = client.post(path, json=body, headers={"Authorization": f"Basic {API_KEY}"})
    assert res.status_code == 401


@pytest.mark.parametrize("path,body", PROTECTED)
def test_valid_token_passes_auth_gate(client, path, body):
    # Auth passes; the request then stops at the unconfigured-DB guard (503
    # with the Supabase message), proving the gate let it through.
    res = client.post(path, json=body, headers={"Authorization": f"Bearer {API_KEY}"})
    assert res.status_code == 503
    assert "Supabase" in res.json()["detail"]


@pytest.mark.parametrize("path,body", PROTECTED)
def test_unset_api_key_fails_closed(unconfigured_client, path, body):
    res = unconfigured_client.post(
        path, json=body, headers={"Authorization": "Bearer anything"}
    )
    assert res.status_code == 503
    assert "DISPATCH_API_KEY" in res.json()["detail"]


def test_no_per_request_mode_override():
    # Dispatch mode must come from tenant config only (manual-mode tenants can
    # never be escalated to auto by a caller).
    assert "mode" not in OptimizeRequest.model_fields
    assert "mode" not in ReassignRequest.model_fields


def test_suggest_and_emergency_require_tenant_id():
    assert SuggestRequest.model_fields["tenant_id"].is_required()
    assert EmergencyRequest.model_fields["tenant_id"].is_required()


def test_suggest_without_tenant_id_is_422(client):
    res = client.post(
        "/suggest", json={"job_id": "j"}, headers={"Authorization": f"Bearer {API_KEY}"}
    )
    assert res.status_code == 422
