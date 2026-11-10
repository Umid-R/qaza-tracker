"""Tests for Telegram initData authentication (no database needed)."""
import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.auth import (InvalidInitData, authorize_path_user, ensure_same_user,
                      get_verified_user_id, validate_init_data)

BOT_TOKEN = "123456:TEST-TOKEN"


def make_init_data(user_id=111, token=BOT_TOKEN, auth_date=None, tamper=False):
    """Build initData exactly the way Telegram does."""
    fields = {
        "auth_date": str(int(auth_date if auth_date is not None else time.time())),
        "query_id": "AAH-test",
        "user": json.dumps({"id": user_id, "first_name": "Test"}, separators=(",", ":")),
    }
    check = "\n".join(f"{k}={v}" for k, v in sorted(fields.items()))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    fields["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if tamper:
        fields["user"] = json.dumps({"id": 999, "first_name": "Evil"}, separators=(",", ":"))
    return urlencode(fields)


def test_valid_init_data_returns_user():
    assert validate_init_data(make_init_data(111), BOT_TOKEN)["id"] == 111


def test_wrong_bot_token_is_rejected():
    with pytest.raises(InvalidInitData):
        validate_init_data(make_init_data(token="other:TOKEN"), BOT_TOKEN)


def test_tampered_user_is_rejected():
    with pytest.raises(InvalidInitData):
        validate_init_data(make_init_data(tamper=True), BOT_TOKEN)


def test_expired_init_data_is_rejected():
    old = time.time() - 3 * 24 * 3600
    with pytest.raises(InvalidInitData):
        validate_init_data(make_init_data(auth_date=old), BOT_TOKEN)


def test_missing_hash_and_garbage_are_rejected():
    with pytest.raises(InvalidInitData):
        validate_init_data("auth_date=1&user=%7B%7D", BOT_TOKEN)
    with pytest.raises(InvalidInitData):
        validate_init_data("not-a-querystring", BOT_TOKEN)


# --- the FastAPI dependencies, on a tiny app -------------------------------
app = FastAPI()


@app.get("/mine/{userId}", dependencies=[Depends(authorize_path_user)])
def mine(userId: int):
    return {"ok": True, "user": userId}


@app.post("/write")
def write(body: dict, uid: int = Depends(get_verified_user_id)):
    ensure_same_user(body["user_id"], uid)
    return {"ok": True}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("TELEGRAM_TOKEN", BOT_TOKEN + "\n")  # trailing newline must not matter
    return TestClient(app)


def auth(user_id=111, **kw):
    return {"Authorization": "tma " + make_init_data(user_id, **kw)}


def test_own_data_allowed(client):
    assert client.get("/mine/111", headers=auth(111)).status_code == 200


def test_other_users_data_forbidden(client):
    assert client.get("/mine/222", headers=auth(111)).status_code == 403


def test_no_header_is_401(client):
    assert client.get("/mine/111").status_code == 401


def test_forged_header_is_401(client):
    assert client.get("/mine/111", headers=auth(111, token="x:y")).status_code == 401


def test_write_for_other_user_forbidden(client):
    assert client.post("/write", json={"user_id": 222}, headers=auth(111)).status_code == 403
    assert client.post("/write", json={"user_id": 111}, headers=auth(111)).status_code == 200


def test_unconfigured_server_fails_closed(monkeypatch):
    monkeypatch.delenv("TELEGRAM_TOKEN", raising=False)
    assert TestClient(app).get("/mine/111", headers=auth(111)).status_code == 500


# --- log-only rollout mode --------------------------------------------------
def test_log_mode_allows_but_reports(monkeypatch, capsys):
    monkeypatch.setenv("TELEGRAM_TOKEN", BOT_TOKEN)
    monkeypatch.setenv("AUTH_MODE", "log")
    c = TestClient(app)
    assert c.get("/mine/111").status_code == 200                       # no header: allowed
    assert c.get("/mine/222", headers=auth(111)).status_code == 200    # other user: allowed
    assert c.get("/mine/111", headers=auth(111)).status_code == 200    # valid
    out = capsys.readouterr().out
    assert "AUTH_WOULD_BLOCK no tma header" in out
    assert "AUTH_WOULD_BLOCK user 111 asked for user 222" in out
    assert "AUTH_OK user=111" in out


def test_enforce_is_the_default(monkeypatch):
    monkeypatch.setenv("TELEGRAM_TOKEN", BOT_TOKEN)
    monkeypatch.delenv("AUTH_MODE", raising=False)
    assert TestClient(app).get("/mine/111").status_code == 401


def test_unknown_mode_value_still_enforces(monkeypatch):
    monkeypatch.setenv("TELEGRAM_TOKEN", BOT_TOKEN)
    monkeypatch.setenv("AUTH_MODE", "off")
    assert TestClient(app).get("/mine/111").status_code == 401
