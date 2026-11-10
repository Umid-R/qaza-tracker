"""Telegram Mini App authentication.

The Mini App sends Telegram's signed `initData` string in the header
    Authorization: tma <initData>
Telegram signs it with a key derived from the bot token, so only Telegram can
produce a valid one. We recompute the signature here and only trust the user id
inside it. A request may then only touch the data of that same user.

Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
"""
import hashlib
import hmac
import json
import os
import time
from typing import Optional
from urllib.parse import parse_qsl

from fastapi import Depends, Header, HTTPException

# initData older than this is rejected (limits replay of a leaked value)
MAX_AGE_SECONDS = 24 * 60 * 60


class InvalidInitData(Exception):
    pass


def validate_init_data(init_data: str, bot_token: str,
                       max_age: int = MAX_AGE_SECONDS, now: Optional[float] = None) -> dict:
    """Return the Telegram user dict if `init_data` is genuine and fresh, else raise InvalidInitData."""
    try:
        fields = dict(parse_qsl(init_data, keep_blank_values=True, strict_parsing=True))
    except ValueError:
        raise InvalidInitData("malformed initData")

    received_hash = fields.pop("hash", None)
    if not received_hash:
        raise InvalidInitData("missing hash")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(fields.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise InvalidInitData("bad signature")

    try:
        auth_date = int(fields["auth_date"])
    except (KeyError, ValueError):
        raise InvalidInitData("missing auth_date")
    if (now if now is not None else time.time()) - auth_date > max_age:
        raise InvalidInitData("initData expired")

    try:
        user = json.loads(fields["user"])
        int(user["id"])
    except (KeyError, ValueError, TypeError):
        raise InvalidInitData("missing user")
    return user


def _enforcing() -> bool:
    """AUTH_MODE=log only logs what would be blocked (for a safe rollout). Anything else enforces."""
    return (os.environ.get("AUTH_MODE") or "enforce").strip().lower() != "log"


def _deny(status: int, detail: str, log_note: str) -> None:
    """Block the request, or in log mode just record that it would have been blocked."""
    if _enforcing():
        raise HTTPException(status_code=status, detail=detail)
    print(f"AUTH_WOULD_BLOCK {log_note}", flush=True)


def get_verified_user_id(authorization: Optional[str] = Header(default=None)) -> Optional[int]:
    """FastAPI dependency: the Telegram user id proven by the Authorization header.

    Returns None only in log mode when the header is missing or invalid.
    """
    bot_token = (os.environ.get("TELEGRAM_TOKEN") or "").strip()
    if not bot_token:
        # fail closed: never serve user data when auth is not configured
        _deny(500, "Server auth is not configured", "TELEGRAM_TOKEN not set")
        return None

    if not authorization or not authorization.lower().startswith("tma "):
        _deny(401, "Missing Telegram authorization", "no tma header")
        return None

    try:
        user = validate_init_data(authorization[4:].strip(), bot_token)
    except InvalidInitData as e:
        _deny(401, f"Invalid Telegram authorization: {e}", f"invalid initData ({e})")
        return None
    return int(user["id"])


def authorize_path_user(userId: int, uid: Optional[int] = Depends(get_verified_user_id)) -> int:
    """For routes like /total/{userId}: the path user must be the signed-in user."""
    if uid is None:
        return userId  # log mode, already logged
    if userId != uid:
        _deny(403, "You can only access your own data", f"user {uid} asked for user {userId}")
    elif not _enforcing():
        print(f"AUTH_OK user={uid}", flush=True)
    return userId


def ensure_same_user(body_user_id: int, uid: Optional[int]) -> None:
    """For POST routes that carry user_id in the body."""
    if uid is None:
        return  # log mode, already logged
    if body_user_id != uid:
        _deny(403, "You can only change your own data", f"user {uid} wrote for user {body_user_id}")
    elif not _enforcing():
        print(f"AUTH_OK user={uid}", flush=True)
