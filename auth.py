"""Session-based authentication using signed cookies.

Uses itsdangerous.URLSafeTimedSerializer for cookie signing and verification.
"""

from __future__ import annotations

from typing import Any

from fastapi import Request
from fastapi.responses import Response
from itsdangerous import URLSafeTimedSerializer

from config import settings

_serializer = URLSafeTimedSerializer(
    secret_key=settings.SECRET_KEY,
    salt="office-tools-auth",
)

COOKIE_NAME = "session"
COOKIE_MAX_AGE = 86400  # 24 hours


def create_session(response: Response) -> None:
    """Set a signed session cookie on the response."""
    data: dict[str, Any] = {"auth": True}
    token = _serializer.dumps(data)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True when behind HTTPS (cloudflared provides this)
    )


def verify_session(request: Request) -> bool:
    """Check if the request has a valid session cookie."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return False
    try:
        data: dict[str, Any] = _serializer.loads(token, max_age=COOKIE_MAX_AGE)
        return bool(data.get("auth"))
    except Exception:
        return False


def clear_session(response: Response) -> None:
    """Remove the session cookie."""
    response.delete_cookie(key=COOKIE_NAME, httponly=True, samesite="lax")
