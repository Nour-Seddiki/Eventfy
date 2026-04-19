"""Tests for the active session (logged-in devices) feature."""
import sys
from pathlib import Path
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.base import Base
from app.models.user import User
from app.models.active_session import ActiveSession
from app.services.auth_service import hashing_password
from app.services.active_session_service import (
    create_session,
    get_user_sessions,
    revoke_session,
    revoke_all_other_sessions,
    is_session_active,
    update_last_activity,
    _extract_device_info,
)


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def user(db):
    u = User(
        username="testuser",
        email="test@gmail.com",
        hashed_password=hashing_password("password123"),
        role="attendee",
        is_verified=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _fake_request(ua="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36", ip="192.168.1.10"):
    """Build a minimal mock Request with headers and client."""
    req = MagicMock()
    req.headers = {"user-agent": ua}
    req.client = MagicMock()
    req.client.host = ip
    return req


# ── Model tests ──────────────────────────────────────────────────────

class TestActiveSessionModel:
    def test_create_active_session(self, db, user):
        session = ActiveSession(
            user_id=user.id,
            token_jti="test-jti-1234",
            device_name="Chrome on Linux",
            device_type="desktop",
            ip_address="10.0.0.1",
            os="Linux",
            browser="Chrome 120",
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        assert session.id is not None
        assert session.user_id == user.id
        assert session.token_jti == "test-jti-1234"
        assert session.is_active is True
        assert session.logged_out_at is None

    def test_unique_jti_constraint(self, db, user):
        s1 = ActiveSession(user_id=user.id, token_jti="dup-jti")
        db.add(s1)
        db.commit()

        s2 = ActiveSession(user_id=user.id, token_jti="dup-jti")
        db.add(s2)
        with pytest.raises(Exception):  # IntegrityError
            db.commit()
        db.rollback()


# ── Device info extraction tests ─────────────────────────────────────

class TestExtractDeviceInfo:
    def test_chrome_desktop(self):
        req = _fake_request(
            ua="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            ip="1.2.3.4",
        )
        info = _extract_device_info(req)
        assert info["device_type"] == "desktop"
        assert "Chrome" in info["browser"]
        assert "Linux" in info["os"]
        assert info["ip_address"] == "1.2.3.4"

    def test_mobile_safari(self):
        req = _fake_request(
            ua="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
            ip="10.0.0.5",
        )
        info = _extract_device_info(req)
        assert info["device_type"] == "mobile"
        assert "iOS" in info["os"]

    def test_x_forwarded_for(self):
        req = MagicMock()
        req.headers = {
            "user-agent": "TestAgent/1.0",
            "x-forwarded-for": "203.0.113.50, 10.0.0.1",
        }
        req.client = MagicMock()
        req.client.host = "127.0.0.1"
        info = _extract_device_info(req)
        assert info["ip_address"] == "203.0.113.50"


# ── Service tests ────────────────────────────────────────────────────

class TestCreateSession:
    def test_creates_session_and_returns_jti(self, db, user):
        req = _fake_request()
        jti = create_session(user.id, req, db)

        assert isinstance(jti, str)
        assert len(jti) == 36  # UUID format

        row = db.query(ActiveSession).filter(ActiveSession.token_jti == jti).first()
        assert row is not None
        assert row.user_id == user.id
        assert row.is_active is True
        assert "Chrome" in row.browser

    def test_multiple_sessions_for_same_user(self, db, user):
        req1 = _fake_request(ua="Chrome/120", ip="10.0.0.1")
        req2 = _fake_request(ua="Firefox/115", ip="10.0.0.2")

        jti1 = create_session(user.id, req1, db)
        jti2 = create_session(user.id, req2, db)

        assert jti1 != jti2
        sessions = db.query(ActiveSession).filter(ActiveSession.user_id == user.id).all()
        assert len(sessions) == 2


class TestGetUserSessions:
    def test_returns_active_sessions(self, db, user):
        req = _fake_request()
        jti1 = create_session(user.id, req, db)
        jti2 = create_session(user.id, _fake_request(ip="10.0.0.2"), db)

        sessions = get_user_sessions(user.id, jti1, db)
        assert len(sessions) == 2

        current = [s for s in sessions if s["is_current"]]
        assert len(current) == 1
        assert current[0]["is_current"] is True

    def test_excludes_revoked_sessions(self, db, user):
        jti1 = create_session(user.id, _fake_request(), db)
        jti2 = create_session(user.id, _fake_request(ip="10.0.0.2"), db)

        # Revoke the second session
        s2 = db.query(ActiveSession).filter(ActiveSession.token_jti == jti2).first()
        revoke_session(s2.id, user.id, db)

        sessions = get_user_sessions(user.id, jti1, db)
        assert len(sessions) == 1


class TestRevokeSession:
    def test_revokes_own_session(self, db, user):
        jti = create_session(user.id, _fake_request(), db)
        row = db.query(ActiveSession).filter(ActiveSession.token_jti == jti).first()

        revoke_session(row.id, user.id, db)

        db.refresh(row)
        assert row.is_active is False
        assert row.logged_out_at is not None

    def test_cannot_revoke_other_users_session(self, db, user):
        # Create another user
        other = User(
            username="other",
            email="other@gmail.com",
            hashed_password=hashing_password("pass"),
            role="attendee",
            is_verified=True,
        )
        db.add(other)
        db.commit()
        db.refresh(other)

        jti = create_session(other.id, _fake_request(), db)
        row = db.query(ActiveSession).filter(ActiveSession.token_jti == jti).first()

        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            revoke_session(row.id, user.id, db)
        assert exc.value.status_code == 404

    def test_cannot_revoke_already_revoked(self, db, user):
        jti = create_session(user.id, _fake_request(), db)
        row = db.query(ActiveSession).filter(ActiveSession.token_jti == jti).first()
        revoke_session(row.id, user.id, db)

        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            revoke_session(row.id, user.id, db)


class TestRevokeAllOtherSessions:
    def test_revokes_others_keeps_current(self, db, user):
        jti_current = create_session(user.id, _fake_request(), db)
        jti_other1 = create_session(user.id, _fake_request(ip="10.0.0.2"), db)
        jti_other2 = create_session(user.id, _fake_request(ip="10.0.0.3"), db)

        count = revoke_all_other_sessions(user.id, jti_current, db)
        assert count == 2

        assert is_session_active(jti_current, db) is True
        assert is_session_active(jti_other1, db) is False
        assert is_session_active(jti_other2, db) is False


class TestIsSessionActive:
    def test_active_session(self, db, user):
        jti = create_session(user.id, _fake_request(), db)
        assert is_session_active(jti, db) is True

    def test_revoked_session(self, db, user):
        jti = create_session(user.id, _fake_request(), db)
        row = db.query(ActiveSession).filter(ActiveSession.token_jti == jti).first()
        revoke_session(row.id, user.id, db)
        assert is_session_active(jti, db) is False

    def test_nonexistent_jti(self, db):
        assert is_session_active("nonexistent-jti", db) is False


class TestUpdateLastActivity:
    def test_updates_timestamp(self, db, user):
        jti = create_session(user.id, _fake_request(), db)
        row = db.query(ActiveSession).filter(ActiveSession.token_jti == jti).first()
        original = row.last_activity

        update_last_activity(jti, db)
        db.refresh(row)
        assert row.last_activity >= original
