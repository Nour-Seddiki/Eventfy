from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from app.db.base import Base
from datetime import datetime, timezone


class ActiveSession(Base):
    __tablename__ = "active_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    token_jti = Column(String, unique=True, index=True)  # JWT unique identifier
    device_name = Column(String, nullable=True)  # e.g. "Chrome on Windows"
    device_type = Column(String, nullable=True)  # e.g. "desktop", "mobile", "tablet"
    ip_address = Column(String, nullable=True)
    os = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_activity = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    logged_out_at = Column(DateTime, nullable=True)
