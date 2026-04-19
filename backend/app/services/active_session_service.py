import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from starlette import status
from user_agents import parse as parse_ua

from app.models.active_session import ActiveSession


def _extract_device_info(request: Request) -> dict:
    ua_string = request.headers.get("user-agent", "")
    ua = parse_ua(ua_string)

    if ua.is_mobile:
        device_type = "mobile"
    elif ua.is_tablet:
        device_type = "tablet"
    elif ua.is_pc:
        device_type = "desktop"
    else:
        device_type = "other"

    browser = f"{ua.browser.family} {ua.browser.version_string}".strip()
    os_name = f"{ua.os.family} {ua.os.version_string}".strip()
    device_name = f"{browser} on {os_name}"

    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else None)
    if ip and "," in ip:
        ip = ip.split(",")[0].strip()

    return {
        "device_name": device_name,
        "device_type": device_type,
        "ip_address": ip,
        "os": os_name,
        "browser": browser,
    }


def create_session(user_id: int, request: Request, db: Session) -> str:
    """Create a new active session and return the jti to embed in the JWT."""
    jti = str(uuid.uuid4())
    device_info = _extract_device_info(request)

    session = ActiveSession(
        user_id=user_id,
        token_jti=jti,
        **device_info,
    )
    db.add(session)
    db.commit()
    return jti


def get_user_sessions(user_id: int, current_jti: Optional[str], db: Session) -> list:
    """Return all active sessions for a user, marking which one is current."""
    sessions = (
        db.query(ActiveSession)
        .filter(ActiveSession.user_id == user_id, ActiveSession.is_active.is_(True))
        .order_by(ActiveSession.last_activity.desc())
        .all()
    )
    result = []
    for s in sessions:
        data = {
            "id": s.id,
            "device_name": s.device_name,
            "device_type": s.device_type,
            "ip_address": s.ip_address,
            "os": s.os,
            "browser": s.browser,
            "is_active": s.is_active,
            "is_current": s.token_jti == current_jti,
            "last_activity": s.last_activity,
            "created_at": s.created_at,
        }
        result.append(data)
    return result


def revoke_session(session_id: int, user_id: int, db: Session):
    """Revoke (log out) a specific session."""
    session = (
        db.query(ActiveSession)
        .filter(
            ActiveSession.id == session_id,
            ActiveSession.user_id == user_id,
            ActiveSession.is_active.is_(True),
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    session.is_active = False
    session.logged_out_at = datetime.now(timezone.utc)
    db.commit()


def revoke_all_other_sessions(user_id: int, current_jti: str, db: Session):
    """Revoke all sessions except the current one."""
    sessions = (
        db.query(ActiveSession)
        .filter(
            ActiveSession.user_id == user_id,
            ActiveSession.is_active.is_(True),
            ActiveSession.token_jti != current_jti,
        )
        .all()
    )
    now = datetime.now(timezone.utc)
    for s in sessions:
        s.is_active = False
        s.logged_out_at = now
    db.commit()
    return len(sessions)


def update_last_activity(jti: str, db: Session):
    """Update last_activity timestamp for a session."""
    session = (
        db.query(ActiveSession)
        .filter(ActiveSession.token_jti == jti, ActiveSession.is_active.is_(True))
        .first()
    )
    if session:
        session.last_activity = datetime.now(timezone.utc)
        db.commit()


def is_session_active(jti: str, db: Session) -> bool:
    """Check if a session is still active (not revoked)."""
    session = (
        db.query(ActiveSession)
        .filter(ActiveSession.token_jti == jti, ActiveSession.is_active.is_(True))
        .first()
    )
    return session is not None
